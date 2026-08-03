/**
 * Scheduler Entrypoint
 * 
 * Unified job scheduler that runs:
 * - runVerificationJob
 * - runSettlementJob
 * - runReconciliationJob
 * 
 * Each job emits structured metrics logs.
 * Safe to run every minute, respects locks.
 */

import { runVerificationJob } from './verification.js';
import { runSettlementJob } from './settlement.js';
import { runReconciliationJob } from './reconciliation.js';
import { runOracleRefreshJob } from '../jobs/oracle-refresh.js';
import { runRivalryTrackerJob } from '../jobs/rivalry-tracker.js';
import { runRivalryCronJobs } from '../jobs/rivalry-cron.js';
import {
    isVerificationEnabled,
    isSettlementEnabled,
} from './kill-switches.js';
import {
    recordVerificationJobRun,
    recordSettlementJobRun,
    recordReconciliationJobRun,
    logJobResult,
    type JobResult,
} from './observability.js';

// =============================================================================
// JOB SCHEDULER
// =============================================================================

export interface SchedulerResult {
    verification: JobResult | null;
    settlement: JobResult | null;
    reconciliation: JobResult | null;
    oracleRefresh: JobResult | null;
    rivalryTracker: JobResult | null;
    rivalryCron: JobResult | null;
    simProgress: JobResult | null;
    totalDurationMs: number;
}

export interface RunScheduledJobsOptions {
    /**
     * Run verification and settlement as part of this pass.
     *
     * Defaults to true so direct callers (tests, the ops manual-trigger route)
     * keep their existing behaviour. The worker passes false: it already runs
     * both on its own 15s loop, and running them here as well would mean two
     * processes racing the same contracts. The jobs take per-contract advisory
     * locks, but those are a backstop — one runner is the actual defence.
     */
    includeVerificationAndSettlement?: boolean;
}

/**
 * Run all scheduled jobs
 * Safe to call every minute
 * Respects kill switches and locks
 */
export async function runScheduledJobs(
    options: RunScheduledJobsOptions = {},
): Promise<SchedulerResult> {
    const { includeVerificationAndSettlement = true } = options;
    console.log(
        `⏰ Starting scheduled job run${includeVerificationAndSettlement ? '' : ' (periodic jobs only — worker owns verification/settlement)'}...`
    );
    const startTime = Date.now();

    let verificationResult: JobResult | null = null;
    let settlementResult: JobResult | null = null;
    let reconciliationResult: JobResult | null = null;

    // 1. Verification Job
    if (!includeVerificationAndSettlement) {
        console.log('⏭️ Verification job SKIPPED (owned by the worker loop)');
    } else if (isVerificationEnabled()) {
        const jobStart = Date.now();
        try {
            const result = await runVerificationJob();
            const durationMs = Date.now() - jobStart;
            recordVerificationJobRun(durationMs);

            verificationResult = {
                jobType: 'VERIFICATION',
                processed: result.processed,
                succeeded: result.succeeded,
                failed: result.failed,
                skipped: result.skipped,
                durationMs,
                skipReasons: {
                    locked: 0, // Would need to track in job
                    retryScheduled: 0,
                    terminal: 0,
                },
            };
            logJobResult(verificationResult);
        } catch (err: any) {
            console.error('❌ Verification job error:', err.message);
        }
    } else {
        console.log('⏭️ Verification job SKIPPED (kill switch disabled)');
    }

    // 2. Settlement Job
    if (!includeVerificationAndSettlement) {
        console.log('⏭️ Settlement job SKIPPED (owned by the worker loop)');
    } else if (isSettlementEnabled()) {
        const jobStart = Date.now();
        try {
            const result = await runSettlementJob();
            const durationMs = Date.now() - jobStart;
            recordSettlementJobRun(durationMs);

            settlementResult = {
                jobType: 'SETTLEMENT',
                processed: result.processed,
                succeeded: result.succeeded,
                failed: result.failed,
                skipped: result.skipped,
                durationMs,
                skipReasons: {
                    locked: 0,
                    retryScheduled: 0,
                    terminal: 0,
                },
            };
            logJobResult(settlementResult);
        } catch (err: any) {
            console.error('❌ Settlement job error:', err.message);
        }
    } else {
        console.log('⏭️ Settlement job SKIPPED (kill switch disabled)');
    }

    // 3. Reconciliation Job (always runs if verification/settlement enabled)
    if (isVerificationEnabled() || isSettlementEnabled()) {
        const jobStart = Date.now();
        try {
            const result = await runReconciliationJob();
            const durationMs = Date.now() - jobStart;
            recordReconciliationJobRun(durationMs);

            reconciliationResult = {
                jobType: 'RECONCILIATION',
                processed: result.processed,
                succeeded: result.recovered,
                failed: result.errors,
                skipped: result.skipped,
                recovered: result.recovered,
                stillStuck: result.stillStuck,
                errors: result.errors,
                durationMs,
                skipReasons: {
                    locked: 0,
                    retryScheduled: result.skipped,
                    terminal: 0,
                },
            };
            logJobResult(reconciliationResult);
        } catch (err: any) {
            console.error('❌ Reconciliation job error:', err.message);
        }
    }

    // 4. Oracle Refresh Job (always runs if verification enabled)
    let oracleResult: JobResult | null = null;
    if (isVerificationEnabled()) {
        const jobStart = Date.now();
        try {
            const result = await runOracleRefreshJob();
            const durationMs = Date.now() - jobStart;

            oracleResult = {
                jobType: 'ORACLE_REFRESH',
                processed: result.processed,
                succeeded: result.succeeded,
                failed: result.failed,
                skipped: result.skipped,
                durationMs,
                skipReasons: {
                    locked: 0,
                    retryScheduled: 0,
                    terminal: 0,
                },
            };
            logJobResult(oracleResult);
        } catch (err: any) {
            console.error('❌ Oracle refresh job error:', err.message);
        }
    }

    // 5. Rivalry Tracker (baseline snapshots + metric polling)
    let rivalryTrackerResult: JobResult | null = null;
    {
        const jobStart = Date.now();
        try {
            const result = await runRivalryTrackerJob();
            const durationMs = Date.now() - jobStart;

            rivalryTrackerResult = {
                jobType: 'RIVALRY_TRACKER',
                processed: result.processed,
                succeeded: result.snapshotsTaken + result.baselinesSet,
                failed: result.errors,
                skipped: result.skipped,
                durationMs,
                skipReasons: { locked: 0, retryScheduled: 0, terminal: 0 },
            };
            logJobResult(rivalryTrackerResult);
        } catch (err: any) {
            console.error('❌ Rivalry tracker job error:', err.message);
        }
    }

    // 6. Rivalry Cron (auto-settle, expire, cancel)
    let rivalryCronResult: JobResult | null = null;
    {
        const jobStart = Date.now();
        try {
            const result = await runRivalryCronJobs();
            const durationMs = Date.now() - jobStart;

            rivalryCronResult = {
                jobType: 'RIVALRY_CRON',
                processed: result.settled + result.expired + result.cancelled + result.awaitingVerification,
                succeeded: result.settled + result.expired + result.cancelled,
                failed: result.errors,
                // Past-deadline rivalries with no verification path are blocked,
                // not failed — they must not read as errors.
                skipped: result.awaitingVerification,
                durationMs,
                skipReasons: { locked: 0, retryScheduled: 0, terminal: result.awaitingVerification },
            };
            logJobResult(rivalryCronResult);
        } catch (err: any) {
            console.error('❌ Rivalry cron job error:', err.message);
        }
    }

    // 7. Simulated Progress (ONLY updates @collateral.internal demo data)
    let simProgressResult: JobResult | null = null;
    {
        const jobStart = Date.now();
        try {
            const { runSimProgressJob, runSimSoloProgressJob } = await import('../jobs/sim-progress.js');
            const rivalryResult = await runSimProgressJob();
            const soloResult = await runSimSoloProgressJob();
            const durationMs = Date.now() - jobStart;

            simProgressResult = {
                jobType: 'RIVALRY_TRACKER' as any,
                processed: rivalryResult.updated + soloResult.updated,
                succeeded: rivalryResult.snapshots + soloResult.updated,
                failed: 0,
                skipped: rivalryResult.skipped,
                durationMs,
                skipReasons: { locked: 0, retryScheduled: 0, terminal: 0 },
            };
            console.log(`✅ SimProgress: ${rivalryResult.updated} rivalry participants, ${soloResult.updated} solo contracts updated`);
        } catch (err: any) {
            console.error('❌ SimProgress job error:', err.message);
        }
    }

    // 8. Drip emails for incomplete onboarding
    let dripResult: JobResult | null = null;
    {
        const jobStart = Date.now();
        try {
            const { runDripEmailJob } = await import('../jobs/drip-emails.js');
            const result = await runDripEmailJob();
            dripResult = {
                jobType: 'RIVALRY_TRACKER' as any, // reuse type since observability doesn't have DRIP_EMAIL yet
                processed: result.sent + result.skipped,
                succeeded: result.sent,
                failed: result.errors,
                skipped: result.skipped,
                durationMs: result.durationMs,
                skipReasons: { locked: 0, retryScheduled: 0, terminal: 0 },
            };
        } catch (err: any) {
            console.error('❌ Drip email job error:', err.message);
        }
    }

    const totalDurationMs = Date.now() - startTime;
    console.log(`✅ Scheduled job run complete in ${totalDurationMs}ms`);

    return {
        verification: verificationResult,
        settlement: settlementResult,
        reconciliation: reconciliationResult,
        oracleRefresh: oracleResult,
        rivalryTracker: rivalryTrackerResult,
        rivalryCron: rivalryCronResult,
        simProgress: simProgressResult,
        totalDurationMs,
    };
}

// =============================================================================
// INDIVIDUAL JOB RUNNERS (for testing)
// =============================================================================

export async function runVerificationJobWithMetrics(): Promise<JobResult> {
    if (!isVerificationEnabled()) {
        throw new Error('Verification is disabled');
    }

    const jobStart = Date.now();
    const result = await runVerificationJob();
    const durationMs = Date.now() - jobStart;
    recordVerificationJobRun(durationMs);

    const jobResult: JobResult = {
        jobType: 'VERIFICATION',
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        durationMs,
        skipReasons: {
            locked: 0,
            retryScheduled: 0,
            terminal: 0,
        },
    };
    logJobResult(jobResult);
    return jobResult;
}

export async function runSettlementJobWithMetrics(): Promise<JobResult> {
    if (!isSettlementEnabled()) {
        throw new Error('Settlement is disabled');
    }

    const jobStart = Date.now();
    const result = await runSettlementJob();
    const durationMs = Date.now() - jobStart;
    recordSettlementJobRun(durationMs);

    const jobResult: JobResult = {
        jobType: 'SETTLEMENT',
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        durationMs,
        skipReasons: {
            locked: 0,
            retryScheduled: 0,
            terminal: 0,
        },
    };
    logJobResult(jobResult);
    return jobResult;
}

export async function runReconciliationJobWithMetrics(): Promise<JobResult> {
    const jobStart = Date.now();
    const result = await runReconciliationJob();
    const durationMs = Date.now() - jobStart;
    recordReconciliationJobRun(durationMs);

    const jobResult: JobResult = {
        jobType: 'RECONCILIATION',
        processed: result.processed,
        succeeded: result.recovered,
        failed: result.errors,
        skipped: result.skipped,
        recovered: result.recovered,
        stillStuck: result.stillStuck,
        errors: result.errors,
        durationMs,
        skipReasons: {
            locked: 0,
            retryScheduled: result.skipped,
            terminal: 0,
        },
    };
    logJobResult(jobResult);
    return jobResult;
}
