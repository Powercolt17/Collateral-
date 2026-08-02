/**
 * Production Worker Runner
 * 
 * Runs verification and settlement jobs in a continuous loop.
 * Relies on per-contract locks to allow safe multi-worker concurrency.
 * 
 * Environment Variables:
 * - WORKER_CONCURRENCY: Number of contracts to process in parallel (default: 1)
 * - WORKER_SLEEP_MS: Sleep between iterations (default: 15000)
 * - NODE_ENV: production/development
 * 
 * Graceful Shutdown:
 * - Listens for SIGTERM/SIGINT
 * - Completes current iteration before exiting
 */

import { runVerificationJob } from '../services/verification.js';
import { runSettlementJob } from '../services/settlement.js';
import { expireInstances, recomputeStats } from '../jobs/market-maintenance.js';
import { runIndexerIteration } from '../services/indexer.js';

// Configuration from environment
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '1', 10);
const WORKER_SLEEP_MS = parseInt(process.env.WORKER_SLEEP_MS || '15000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Shutdown flag
let shuttingDown = false;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp for structured logging
 */
function timestamp(): string {
    return new Date().toISOString();
}

/**
 * Structured log output
 */
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: Record<string, unknown>) {
    const entry = {
        timestamp: timestamp(),
        level,
        worker: 'collateral-worker',
        message,
        ...data,
    };
    console.log(JSON.stringify(entry));
}

/**
 * Run a single iteration of all jobs
 */
async function runJobIteration(): Promise<{
    verification: { processed: number; succeeded: number; failed: number; skipped: number };
    settlement: { processed: number; succeeded: number; failed: number; skipped: number };
}> {
    const iterationId = `iter_${Date.now()}`;
    log('INFO', 'Starting job iteration', { iterationId });

    // Run verification job
    const verificationStart = Date.now();
    const verificationResult = await runVerificationJob();
    const verificationDurationMs = Date.now() - verificationStart;

    log('INFO', 'Verification job complete', {
        iterationId,
        job: 'VERIFICATION',
        durationMs: verificationDurationMs,
        ...verificationResult,
    });

    // Run settlement job
    const settlementStart = Date.now();
    const settlementResult = await runSettlementJob();
    const settlementDurationMs = Date.now() - settlementStart;

    log('INFO', 'Settlement job complete', {
        iterationId,
        job: 'SETTLEMENT',
        durationMs: settlementDurationMs,
        ...settlementResult,
    });

    // NO PAYOUT JOB HERE — BY DESIGN.
    //
    // Payouts are manual-approval only. Settlement still runs automatically and
    // still writes PAYOUT_QUEUED; only the money movement is gated behind a
    // human. The worker must never call a payout adapter under any condition.
    // The ONLY path that disburses is POST /v1/admin/payouts/:eventId/approve.
    //
    // If you are adding automatic disbursement here, that is a policy change,
    // not a refactor. See tests/payout-manual-approval.test.ts, which fails if
    // the worker ever imports a payout adapter.

    // Run market maintenance (Feed updates)
    // Runs every iteration (approx 15s) which satisfies the < 60s requirement
    try {
        await expireInstances();
        await recomputeStats();
        log('INFO', 'Market maintenance complete', { iterationId });
    } catch (err: any) {
        log('ERROR', 'Market maintenance failed', { error: err.message, iterationId });
    }

    // Run live blockchain indexing iteration
    try {
        await runIndexerIteration();
        log('INFO', 'Blockchain indexer iteration complete', { iterationId });
    } catch (err: any) {
        log('ERROR', 'Blockchain indexer iteration failed', { error: err.message, iterationId });
    }

    return {
        verification: verificationResult,
        settlement: settlementResult,
    };
}

/**
 * Main worker loop
 */
async function runWorkerLoop(): Promise<void> {
    log('INFO', 'Worker starting', {
        concurrency: WORKER_CONCURRENCY,
        sleepMs: WORKER_SLEEP_MS,
        env: NODE_ENV,
    });

    let iterationCount = 0;

    while (!shuttingDown) {
        iterationCount++;

        try {
            const result = await runJobIteration();

            // Summary log
            const totalProcessed = result.verification.processed + result.settlement.processed;
            const totalSucceeded = result.verification.succeeded + result.settlement.succeeded;
            const totalFailed = result.verification.failed + result.settlement.failed;
            const totalSkipped = result.verification.skipped + result.settlement.skipped;

            if (totalProcessed > 0) {
                log('INFO', 'Iteration summary', {
                    iteration: iterationCount,
                    totalProcessed,
                    totalSucceeded,
                    totalFailed,
                    totalSkipped,
                });
            }
        } catch (error: any) {
            log('ERROR', 'Job iteration failed', {
                iteration: iterationCount,
                error: error.message,
                stack: error.stack,
            });
        }

        if (!shuttingDown) {
            log('INFO', `Sleeping for ${WORKER_SLEEP_MS}ms before next iteration`);
            await sleep(WORKER_SLEEP_MS);
        }
    }

    log('INFO', 'Worker shutdown complete', { iterations: iterationCount });
}

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal: string): void {
    log('INFO', `Received ${signal}, initiating graceful shutdown...`);
    shuttingDown = true;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    // Register shutdown handlers
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║              COLLATERAL WORKER - PRODUCTION               ║
╠═══════════════════════════════════════════════════════════╣
║  Concurrency: ${WORKER_CONCURRENCY.toString().padEnd(42)}║
║  Sleep Interval: ${WORKER_SLEEP_MS.toString().padEnd(38)}ms ║
║  Environment: ${NODE_ENV.padEnd(42)}║
╠═══════════════════════════════════════════════════════════╣
║  Jobs:                                                    ║
║    - runVerificationJob() → LOCKED → VERIFIED             ║
║    - runSettlementJob()   → VERIFIED → SETTLED/FORFEITED  ║
╚═══════════════════════════════════════════════════════════╝
    `);

    try {
        await runWorkerLoop();
        process.exit(0);
    } catch (error: any) {
        log('ERROR', 'Worker crashed', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

// Run if executed directly
main();
