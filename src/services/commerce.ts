// @ts-nocheck
/**
 * Commerce Service - Shopify + Amazon Revenue Tracking (HARDENED)
 * 
 * Business logic for commerce baselines, contract terms, and verification.
 * Uses Shopify/Amazon APIs for revenue tracking.
 * 
 * INVARIANTS (NON-NEGOTIABLE):
 * - Baseline snapshots are IMMUTABLE after creation
 * - Contract terms are FROZEN at execution
 * - Only delta growth is measured (not raw totals)
 * - All money in USD cents (BIGINT in DB)
 * - Fail-closed on any verification error
 * - Single-writer: only one worker per verification job
 * - Idempotent: repeated runs never double-settle
 * - Ledger-first: every operation emits an append-only event
 */

import { createHash } from 'crypto';
import { db } from '../db/client.js';
import {
    salesBaselineSnapshots,
    salesContractTerms,
    salesVerificationRuns,
    ledgerEvents,
    contracts,
    verificationJobLocks,
    connectedAccounts,
    type Contract,
    type SalesBaselineSnapshot,
    type SalesContractTerms,
    type SalesVerificationRun,
    EventType,
} from '../db/schema.js';
import { eq, desc, and, inArray, lt } from 'drizzle-orm';
import { appendEvent } from './ledger.js';
import { shopifyAdapter, type CommerceAdapter, type ShopifyBaselineSnapshot } from '../adapters/shopify.js';
import { amazonAdapter } from '../adapters/amazon-seller.js';
import { plaidIncomeAdapter } from '../adapters/plaid-income.js';
import { CommerceError, CommerceErrorCode, isRetryableError } from '../invariants/commerce-errors.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Verification rails plugged into this engine.
 * 'plaid' verifies INCOME RECEIVED (bank deposits) — not sales.
 */
export type CommercePlatform = 'shopify' | 'amazon' | 'plaid';

export interface CreateCommerceBaselineParams {
    userId: string;
    platform: CommercePlatform;
    windowDays?: number;
    executionTime?: Date;
}

export interface AttachCommerceTermsParams {
    contractId: string;
    snapshotId: string;
    platform: CommercePlatform;
    metric: 'net_settled_amount' | 'closed_won_count';
    windowDays: number;
    targetDeltaCents: number;
}

export interface EligibilityCheckResult {
    eligible: boolean;
    reasons: string[];
    errorCodes: CommerceErrorCode[];
    providerConnected: boolean;
    providerValidated: boolean;
    baselineReady: boolean;
}

export interface VerificationOutcome {
    status: 'PASS' | 'FAIL' | 'RETRY' | 'UNVERIFIABLE';
    result?: {
        pass: boolean;
        currentRevenueCents: number;
        deltaCents: number;
        targetDeltaCents: number;
    };
    errorCode?: CommerceErrorCode;
    nextAttemptAt?: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TERMINAL_EVENTS = [
    'SETTLED_SUCCESS',
    'SETTLED_FAILURE',
    'CONTRACT_FORFEITED',
    'CONTRACT_SETTLED',
];

/** Lock duration for verification jobs */
const JOB_LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum retry attempts before marking unverifiable */
const MAX_VERIFICATION_ATTEMPTS = 5;

/** Base backoff for retries */
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/** Max backoff delay cap */
const MAX_BACKOFF_MS = 10 * 60 * 1000; // 10 minutes max

/** Worker ID for lock acquisition */
const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map a rail to its sales_provider enum value.
 * New rails write their real provider; legacy Shopify/Amazon rows keep 'stripe'
 * so existing data is untouched.
 */
function toSalesProvider(platform: CommercePlatform): 'stripe' | 'plaid' {
    return platform === 'plaid' ? 'plaid' : 'stripe';
}

function getAdapter(platform: CommercePlatform): CommerceAdapter {
    switch (platform) {
        case 'shopify':
            return shopifyAdapter;
        case 'amazon':
            return amazonAdapter;
        case 'plaid':
            return plaidIncomeAdapter;
        default:
            throw new CommerceError(
                CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
                `Unknown commerce platform: ${platform}`
            );
    }
}

async function isContractTerminal(contractId: string): Promise<boolean> {
    const events = await db
        .select({ eventType: ledgerEvents.eventType })
        .from(ledgerEvents)
        .where(
            and(
                eq(ledgerEvents.contractId, contractId),
                inArray(ledgerEvents.eventType, TERMINAL_EVENTS as any)
            )
        )
        .limit(1);

    return events.length > 0;
}

/**
 * Compute idempotency key for verification job
 */
function computeIdempotencyKey(
    contractId: string,
    jobType: string,
    provider: string,
    windowStart: Date,
    windowEnd: Date
): string {
    const payload = `${contractId}|${jobType}|${provider}|${windowStart.toISOString()}|${windowEnd.toISOString()}`;
    return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

/**
 * Calculate next retry time with exponential backoff
 * Capped at MAX_BACKOFF_MS with jitter
 */
function calculateNextRetryTime(attempt: number): Date {
    const rawBackoffMs = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
    const cappedBackoffMs = Math.min(rawBackoffMs, MAX_BACKOFF_MS);
    const jitterMs = Math.random() * 10000; // 0-10s jitter
    return new Date(Date.now() + cappedBackoffMs + jitterMs);
}

// =============================================================================
// JOB LOCKING (Single Writer Guarantee)
// =============================================================================

interface JobLockResult {
    acquired: boolean;
    existingLock?: {
        lockedBy: string;
        lockedAt: Date;
        attemptCount: number;
    };
}

/**
 * Acquire lock for verification job
 * CRITICAL: Single writer guarantee
 */
async function acquireJobLock(
    idempotencyKey: string,
    contractId: string,
    jobType: string,
    provider: string,
    windowStart: Date,
    windowEnd: Date
): Promise<JobLockResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + JOB_LOCK_TTL_MS);

    try {
        // Try to insert new lock
        await db.insert(verificationJobLocks).values({
            idempotencyKey,
            contractId,
            jobType,
            provider,
            windowStart,
            windowEnd,
            lockedAt: now,
            expiresAt,
            lockedBy: WORKER_ID,
            attemptCount: 1,
        } as any);

        return { acquired: true };
    } catch (err: any) {
        // Check if it's a unique constraint violation
        if (err?.code === '23505') {
            // Lock exists - check if expired
            const [existingLock] = await db
                .select()
                .from(verificationJobLocks)
                .where(eq(verificationJobLocks.idempotencyKey, idempotencyKey))
                .limit(1);

            if (existingLock) {
                if (existingLock.expiresAt < now) {
                    // Lock expired - try to take it over
                    const [updated] = await db
                        .update(verificationJobLocks)
                        .set({
                            lockedAt: now,
                            expiresAt,
                            lockedBy: WORKER_ID,
                            attemptCount: existingLock.attemptCount + 1,
                        } as any)
                        .where(
                            and(
                                eq(verificationJobLocks.idempotencyKey, idempotencyKey),
                                lt(verificationJobLocks.expiresAt, now)
                            )
                        )
                        .returning();

                    if (updated) {
                        return { acquired: true };
                    }
                }

                return {
                    acquired: false,
                    existingLock: {
                        lockedBy: existingLock.lockedBy,
                        lockedAt: existingLock.lockedAt,
                        attemptCount: existingLock.attemptCount,
                    },
                };
            }
        }

        throw err;
    }
}

/**
 * Release job lock
 */
async function releaseJobLock(idempotencyKey: string): Promise<void> {
    await db
        .delete(verificationJobLocks)
        .where(eq(verificationJobLocks.idempotencyKey, idempotencyKey));
}

// =============================================================================
// ELIGIBILITY CHECK
// =============================================================================

/**
 * Check if user is eligible for commerce contract
 * CRITICAL: Must pass before execution
 */
export async function checkCommerceEligibility(
    userId: string,
    platform: CommercePlatform,
    contractTier: 'STANDARD' | 'ADVANCED' | 'ELITE' = 'STANDARD'
): Promise<EligibilityCheckResult> {
    const result: EligibilityCheckResult = {
        eligible: true,
        reasons: [],
        errorCodes: [],
        providerConnected: false,
        providerValidated: false,
        baselineReady: false,
    };

    try {
        const adapter = getAdapter(platform);

        // Check 1: Provider connected
        const healthCheck = await adapter.healthCheck(userId);
        if (!healthCheck.ok) {
            result.eligible = false;
            result.reasons.push(`${platform} account not connected or inactive`);
            result.errorCodes.push(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
            return result;
        }
        result.providerConnected = true;

        // Check 2: Provider validated (scopes, identity)
        const validation = await adapter.validateConnection(userId);
        if (!validation.valid) {
            result.eligible = false;
            result.reasons.push((validation as any).errorMessage || 'Provider validation failed');
            if ((validation as any).errorCode) {
                result.errorCodes.push((validation as any).errorCode);
            }
            return result;
        }
        result.providerValidated = true;

        // Check 3: Currency supported
        if ((validation as any).currency && (validation as any).currency.toUpperCase() !== 'USD') {
            result.eligible = false;
            result.reasons.push(`Currency ${(validation as any).currency} not supported. Only USD contracts available.`);
            result.errorCodes.push(CommerceErrorCode.CURRENCY_UNSUPPORTED);
            return result;
        }

        result.baselineReady = true;

    } catch (err) {
        result.eligible = false;
        if (err instanceof CommerceError) {
            result.reasons.push(err.message);
            result.errorCodes.push(err.code);
        } else {
            result.reasons.push('Failed to check eligibility');
            result.errorCodes.push(CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED);
        }
    }

    return result;
}

// =============================================================================
// BASELINE SNAPSHOTS
// =============================================================================

/**
 * Create a baseline snapshot for commerce revenue
 * CRITICAL: Immutable after creation
 */
export async function createCommerceBaseline(
    params: CreateCommerceBaselineParams
): Promise<SalesBaselineSnapshot> {
    const { userId, platform, windowDays = 30, executionTime } = params;

    const adapter = getAdapter(platform);
    const baseline = await adapter.snapshotBaseline(userId, windowDays, executionTime);

    // Calculate window bounds
    const windowEndAt = new Date(baseline.windowEnd);
    const windowStartAt = new Date(baseline.windowStart);

    // Insert baseline snapshot
    const [snapshot] = await db.insert(salesBaselineSnapshots).values({
        userId,
        provider: toSalesProvider(platform),
        windowDays,
        windowStartAt,
        windowEndAt,
        baselineJson: {
            platform,
            ...baseline,
        },
    } as any).returning();

    // Emit ledger event
    await appendEvent({
        eventType: EventType.COMMERCE_BASELINE_CAPTURED,
        contractId: null as any, // Schema requires string, but baseline has no contract yet. valid?
        // userId removed
        metadata: {
            snapshotId: snapshot.id,
            platform,
            netRevenueCents: baseline.netCents,
            orderCount: baseline.orderCount,
            windowDays,
            dataHash: baseline.dataHash,
            apiVersion: baseline.apiVersion,
        },
    });

    return snapshot;
}

/**
 * Get baseline snapshot by ID
 */
export async function getCommerceBaseline(
    snapshotId: string
): Promise<SalesBaselineSnapshot | null> {
    const [snapshot] = await db
        .select()
        .from(salesBaselineSnapshots)
        .where(eq(salesBaselineSnapshots.id, snapshotId))
        .limit(1);

    return snapshot || null;
}

/**
 * Get user's commerce baselines
 */
export async function getUserCommerceBaselines(
    userId: string,
    platform?: CommercePlatform
): Promise<SalesBaselineSnapshot[]> {
    const snapshots = await db
        .select()
        .from(salesBaselineSnapshots)
        .where(eq(salesBaselineSnapshots.userId, userId))
        .orderBy(desc(salesBaselineSnapshots.createdAt));

    // Filter by platform if specified (stored in baselineJson)
    if (platform) {
        return snapshots.filter(s => {
            const json = s.baselineJson as { platform?: string };
            return json.platform === platform;
        });
    }

    return snapshots;
}

// =============================================================================
// CONTRACT TERMS
// =============================================================================

/**
 * Attach commerce terms to a contract
 * CRITICAL: Immutable once attached
 */
export async function attachCommerceTerms(
    params: AttachCommerceTermsParams
): Promise<SalesContractTerms> {
    const { contractId, snapshotId, platform, metric, windowDays, targetDeltaCents } = params;

    // Get the contract
    const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1);

    if (!contract) {
        throw new CommerceError(
            CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
            `Contract not found: ${contractId}`
        );
    }

    // Check if already terminal
    if (await isContractTerminal(contractId)) {
        throw new CommerceError(CommerceErrorCode.CONTRACT_TERMINAL);
    }

    // Check if terms already exist
    const existingTerms = await getCommerceTerms(contractId);
    if (existingTerms) {
        throw new CommerceError(CommerceErrorCode.TERMS_ALREADY_ATTACHED);
    }

    // Get the baseline snapshot
    const snapshot = await getCommerceBaseline(snapshotId);
    if (!snapshot) {
        throw new CommerceError(
            CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
            `Baseline snapshot not found: ${snapshotId}`
        );
    }

    // Extract baseline value
    const baselineJson = snapshot.baselineJson as { netCents?: number; netRevenueCents?: number; platform?: string };
    const baselineValueCents = baselineJson.netCents || baselineJson.netRevenueCents || 0;

    // Verify platform matches
    if (baselineJson.platform !== platform) {
        throw new CommerceError(
            CommerceErrorCode.STORE_IDENTITY_MISMATCH,
            `Baseline platform mismatch: expected ${platform}, got ${baselineJson.platform}`
        );
    }

    // Calculate target total
    const targetTotalCents = baselineValueCents + targetDeltaCents;

    // Insert contract terms
    const [terms] = await db.insert(salesContractTerms).values({
        contractId,
        provider: toSalesProvider(platform as CommercePlatform),
        metric,
        windowDays,
        baselineSnapshotId: snapshotId,
        baselineValueCents,
        targetDeltaCents,
        targetTotalCents,
        qualifiedRulesJson: {
            platform,
            excludeRefunds: true,
            excludeCancellations: true,
            requireFulfillment: true,
        },
        executedAt: new Date(),
    } as any).returning();

    // Emit ledger event
    await appendEvent({
        eventType: EventType.COMMERCE_TARGET_LOCKED,
        contractId,
        metadata: {
            platform,
            snapshotId,
            baselineValueCents,
            targetDeltaCents,
            targetTotalCents,
            metric,
            windowDays,
        },
    });

    return terms;
}

/**
 * Get commerce terms for a contract
 */
export async function getCommerceTerms(
    contractId: string
): Promise<SalesContractTerms | null> {
    const [terms] = await db
        .select()
        .from(salesContractTerms)
        .where(eq(salesContractTerms.contractId, contractId))
        .limit(1);

    return terms || null;
}

// =============================================================================
// VERIFICATION (HARDENED)
// =============================================================================

/**
 * Enqueue a commerce verification run
 */
export async function enqueueCommerceVerification(
    contractId: string
): Promise<SalesVerificationRun> {
    // Get the contract
    const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1);

    if (!contract) {
        throw new CommerceError(
            CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
            `Contract not found: ${contractId}`
        );
    }

    // Check if already terminal
    if (await isContractTerminal(contractId)) {
        throw new CommerceError(CommerceErrorCode.CONTRACT_TERMINAL);
    }

    // Get commerce terms
    const terms = await getCommerceTerms(contractId);
    if (!terms) {
        throw new CommerceError(
            CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
            `No commerce terms found for contract: ${contractId}`
        );
    }

    // Extract platform from terms
    const rulesJson = terms.qualifiedRulesJson as { platform?: string };
    const platform = rulesJson?.platform || 'shopify';

    // Insert verification run
    const [run] = await db.insert(salesVerificationRuns).values({
        contractId,
        provider: toSalesProvider(platform as CommercePlatform),
        status: 'queued',
        attempt: 1,
    } as any).returning();

    // Emit ledger event
    await appendEvent({
        eventType: EventType.SALES_VERIFICATION_QUEUED,
        contractId,
        metadata: {
            runId: run.id,
            platform,
        },
    });

    return run;
}

/**
 * Process a commerce verification run with HARDENED guarantees
 * - Single writer (job lock)
 * - Idempotent
 * - Retry with backoff on transient errors
 * - Fail-closed on permanent errors
 */
export async function processCommerceVerification(
    runId: string
): Promise<VerificationOutcome> {
    // Get the verification run
    const [run] = await db
        .select()
        .from(salesVerificationRuns)
        .where(eq(salesVerificationRuns.id, runId))
        .limit(1);

    if (!run) {
        return {
            status: 'UNVERIFIABLE',
            errorCode: CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
        };
    }

    // Skip if already processed (idempotent)
    if (run.status === 'ok' || run.status === 'error') {
        return {
            status: run.status === 'ok' ? 'PASS' : 'FAIL',
            result: run.resultJson as any,
        };
    }

    // Get contract
    const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, run.contractId))
        .limit(1);

    if (!contract) {
        return {
            status: 'UNVERIFIABLE',
            errorCode: CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
        };
    }

    // Check if already terminal
    if (await isContractTerminal(run.contractId)) {
        await db.update(salesVerificationRuns)
            .set({
                status: 'error',
                finishedAt: new Date(),
                errorMessage: 'Contract already in terminal state',
            } as any)
            .where(eq(salesVerificationRuns.id, runId));

        return {
            status: 'UNVERIFIABLE',
            errorCode: CommerceErrorCode.CONTRACT_TERMINAL,
        };
    }

    // Get commerce terms
    const terms = await getCommerceTerms(run.contractId);
    if (!terms) {
        return {
            status: 'UNVERIFIABLE',
            errorCode: CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
        };
    }

    // Extract platform
    const rulesJson = terms.qualifiedRulesJson as { platform?: string };
    const platform = (rulesJson?.platform || 'shopify') as CommercePlatform;
    const windowStart = terms.executedAt;
    const windowEnd = contract.deadlineUtc;

    // Compute idempotency key
    const idempotencyKey = computeIdempotencyKey(
        run.contractId,
        'verification',
        platform,
        windowStart,
        windowEnd
    );

    // Try to acquire lock
    const lockResult = await acquireJobLock(
        idempotencyKey,
        run.contractId,
        'verification',
        platform,
        windowStart,
        windowEnd
    );

    if (!lockResult.acquired) {
        // Another worker is processing
        await appendEvent({
            eventType: EventType.COMMERCE_JOB_LOCK_CONTENTION,
            contractId: run.contractId,
            metadata: {
                runId,
                idempotencyKey,
                existingLock: lockResult.existingLock,
            },
        });

        return {
            status: 'RETRY',
            errorCode: CommerceErrorCode.JOB_LOCK_CONTENTION,
            nextAttemptAt: new Date(Date.now() + 60000), // Try again in 1 minute
        };
    }

    // Emit lock acquired event
    await appendEvent({
        eventType: EventType.COMMERCE_JOB_LOCK_ACQUIRED,
        contractId: run.contractId,
        metadata: {
            runId,
            idempotencyKey,
            workerId: WORKER_ID,
        },
    });

    // Mark as running
    await db.update(salesVerificationRuns)
        .set({ status: 'running', startedAt: new Date() } as any)
        .where(eq(salesVerificationRuns.id, runId));

    try {
        // Get baseline
        const snapshot = await getCommerceBaseline(terms.baselineSnapshotId);
        if (!snapshot) {
            throw new CommerceError(CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED);
        }

        const adapter = getAdapter(platform);

        // Evaluate
        const result = await adapter.evaluate(
            contract.principalUserId,
            terms.baselineValueCents,
            terms.targetDeltaCents,
            windowStart,
            windowEnd
        );

        // Update verification run
        const finalStatus = result.pass ? 'ok' : 'error';
        await db.update(salesVerificationRuns)
            .set({
                status: finalStatus,
                finishedAt: new Date(),
                resultJson: result,
            } as any)
            .where(eq(salesVerificationRuns.id, runId));

        // Emit appropriate ledger event
        const eventType = result.pass
            ? EventType.COMMERCE_VERIFIED_SUCCESS
            : EventType.COMMERCE_VERIFIED_FAIL;

        await appendEvent({
            eventType,
            contractId: run.contractId,
            metadata: {
                runId,
                platform,
                passed: result.pass,
                currentRevenueCents: result.currentRevenueCents,
                deltaCents: result.deltaCents,
                targetDeltaCents: result.targetDeltaCents,
                evidence: result.evidence,
            },
        });

        // Release lock
        await releaseJobLock(idempotencyKey);

        await appendEvent({
            eventType: EventType.COMMERCE_JOB_LOCK_RELEASED,
            contractId: run.contractId,
            metadata: { runId, idempotencyKey },
        });

        return {
            status: result.pass ? 'PASS' : 'FAIL',
            result: {
                pass: result.pass,
                currentRevenueCents: result.currentRevenueCents,
                deltaCents: result.deltaCents,
                targetDeltaCents: result.targetDeltaCents,
            },
        };

    } catch (err) {
        // Release lock first
        await releaseJobLock(idempotencyKey);

        const commerceError = err instanceof CommerceError
            ? err
            : new CommerceError(CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED, String(err));

        const attempt = run.attempt || 1;

        // Check if retryable
        if (isRetryableError(commerceError.code) && attempt < MAX_VERIFICATION_ATTEMPTS) {
            const nextAttemptAt = calculateNextRetryTime(attempt);

            await db.update(salesVerificationRuns)
                .set({
                    status: 'queued',
                    attempt: attempt + 1,
                    errorMessage: commerceError.message,
                })
                .where(eq(salesVerificationRuns.id, runId));

            await appendEvent({
                eventType: EventType.COMMERCE_VERIFICATION_RETRY,
                userId: contract.principalUserId,
                contractId: run.contractId,
                metadata: {
                    runId,
                    attempt: attempt + 1,
                    errorCode: commerceError.code,
                    nextAttemptAt: nextAttemptAt.toISOString(),
                },
            });

            return {
                status: 'RETRY',
                errorCode: commerceError.code,
                nextAttemptAt,
            };
        }

        // Permanent failure or max attempts reached
        await db.update(salesVerificationRuns)
            .set({
                status: 'error',
                finishedAt: new Date(),
                errorMessage: commerceError.message,
            })
            .where(eq(salesVerificationRuns.id, runId));

        await appendEvent({
            eventType: EventType.COMMERCE_VERIFICATION_UNVERIFIABLE,
            userId: contract.principalUserId,
            contractId: run.contractId,
            metadata: {
                runId,
                errorCode: commerceError.code,
                errorMessage: commerceError.message,
                attempts: attempt,
            },
        });

        return {
            status: 'UNVERIFIABLE',
            errorCode: commerceError.code,
        };
    }
}

/**
 * Get latest verification run for a contract
 */
export async function getLatestCommerceVerification(
    contractId: string
): Promise<SalesVerificationRun | null> {
    const [run] = await db
        .select()
        .from(salesVerificationRuns)
        .where(eq(salesVerificationRuns.contractId, contractId))
        .orderBy(desc(salesVerificationRuns.createdAt))
        .limit(1);

    return run || null;
}

/**
 * Health check for commerce platform
 */
export async function checkCommerceHealth(
    userId: string,
    platform: CommercePlatform
): Promise<{ ok: boolean; platform: string; shop?: string }> {
    const adapter = getAdapter(platform);
    const result = await adapter.healthCheck(userId);
    return { ...result, platform };
}
