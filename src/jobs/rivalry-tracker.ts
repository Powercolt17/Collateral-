// @ts-nocheck
/**
 * Rivalry Metric Tracker
 * 
 * Polls provider APIs for active rivalries and writes metric snapshots.
 * Also handles baseline snapshots when rivalries become ACTIVE (BOTH_FUNDED).
 * 
 * Called by the scheduler on a regular cadence (every 5 minutes).
 */

import { db } from '../db/client.js';
import {
    rivalries, rivalryParticipants, rivalryMetricSnapshots,
    connectedAccounts, rivalryLedgerEvents, RivalryEventType
} from '../db/schema.js';
import { eq, and, isNotNull, isNull, sql } from 'drizzle-orm';
import { getRivalryState, appendRivalryEvent } from '../services/rivalry.js';
import { randomUUID } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

interface TrackerResult {
    processed: number;
    snapshotsTaken: number;
    baselinesSet: number;
    errors: number;
    skipped: number;
}

/**
 * Outcome of a metric fetch.
 *
 * The distinction that matters: a participant with no connected account is an
 * EXPECTED state, not a failure. Rivalries can be created before both sides
 * finish connecting, and a user may never connect at all. Counting that as an
 * error means the job reports failures forever for a condition no retry fixes.
 * Only FETCH_FAILED — a provider call that actually broke — is an error.
 */
type MetricFetchResult =
    | { ok: true; value: number; rawJson: any }
    | { ok: false; reason: 'NO_ACCOUNT' | 'UNSUPPORTED_PLATFORM' }
    | { ok: false; reason: 'FETCH_FAILED' };

/** Expected absences that should be skipped rather than counted as errors. */
function isExpectedAbsence(result: MetricFetchResult): boolean {
    return !result.ok && result.reason !== 'FETCH_FAILED';
}

// =============================================================================
// METRIC FETCHERS
// =============================================================================

/**
 * Fetch the current metric value for a user on a given platform.
 * Reuses the same connected_accounts infrastructure as the oracle.
 */
async function fetchRivalryMetric(
    userId: string,
    platform: string,
    metricKey: string,
): Promise<MetricFetchResult> {
    try {
        // Find user's connected account for this platform
        const [account] = await db
            .select()
            .from(connectedAccounts)
            .where(
                and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.platform, platform),
                    eq(connectedAccounts.status, 'ACTIVE'),
                )
            )
            .limit(1);

        if (!account) {
            // Expected: the user has not connected this platform. Not an error.
            console.log(`[RivalryTracker] Skipping user ${userId} — no active ${platform} account connected`);
            return { ok: false, reason: 'NO_ACCOUNT' };
        }

        if (platform === 'X') {
            try {
                const { getXClient } = await import('../adapters/x-client.js');
                const client = getXClient();
                const followers = await client.getFollowers(account.externalAccountId);
                return { ok: true, value: followers, rawJson: { followers, accountId: account.externalAccountId } };
            } catch (err: any) {
                console.error(`[RivalryTracker] X fetch error: ${err.message}`);
                return { ok: false, reason: 'FETCH_FAILED' };
            }
        }

        if (platform === 'STRIPE') {
            // Stripe: fetch balance or net volume via Stripe API
            // For rivalries, we track total revenue from connected account
            try {
                const { default: Stripe } = await import('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
                const balance = await stripe.balance.retrieve({
                    stripeAccount: account.externalAccountId,
                });
                const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
                return { ok: true, value: available / 100, rawJson: balance };
            } catch (err: any) {
                console.error(`[RivalryTracker] Stripe fetch error: ${err.message}`);
                return { ok: false, reason: 'FETCH_FAILED' };
            }
        }

        if (platform === 'SHOPIFY') {
            // Shopify: fetch order totals
            try {
                const shop = account.externalAccountId;
                const token = account.accessToken;
                if (!token) {
                    // An ACTIVE account row with no token is a broken connection,
                    // not a normal absence — surface it.
                    console.error(`[RivalryTracker] Shopify account ${shop} is ACTIVE but has no access token`);
                    return { ok: false, reason: 'FETCH_FAILED' };
                }

                const res = await fetch(`https://${shop}/admin/api/2024-01/orders/count.json?status=any`, {
                    headers: { 'X-Shopify-Access-Token': token },
                });
                const data = await res.json();
                return { ok: true, value: data.count || 0, rawJson: data };
            } catch (err: any) {
                console.error(`[RivalryTracker] Shopify fetch error: ${err.message}`);
                return { ok: false, reason: 'FETCH_FAILED' };
            }
        }

        if (platform === 'AMAZON') {
            // Amazon: simplified — uses stored order count or API
            console.log(`[RivalryTracker] Amazon metric fetch not yet implemented — skipping`);
            return { ok: false, reason: 'UNSUPPORTED_PLATFORM' };
        }

        console.log(`[RivalryTracker] Unknown platform: ${platform} — skipping`);
        return { ok: false, reason: 'UNSUPPORTED_PLATFORM' };

    } catch (err: any) {
        console.error(`[RivalryTracker] Fetch error for ${platform}: ${err.message}`);
        return { ok: false, reason: 'FETCH_FAILED' };
    }
}

// =============================================================================
// BASELINE SNAPSHOT
// =============================================================================

/**
 * Take baseline snapshots for a rivalry that just became BOTH_FUNDED.
 * Called once when both sides fund — captures the starting metric values.
 */
async function snapshotBaselines(
    rivalryId: string,
): Promise<{ ok: boolean; skipped: number; errors: number }> {
    const [rivalry] = await db.select().from(rivalries).where(eq(rivalries.id, rivalryId));
    if (!rivalry) return { ok: false, skipped: 0, errors: 1 };

    const participants = await db
        .select()
        .from(rivalryParticipants)
        .where(eq(rivalryParticipants.rivalryId, rivalryId));

    let skipped = 0;
    let errors = 0;

    for (const participant of participants) {
        // Skip if baseline already set
        if (participant.baselineValue != null) continue;

        const result = await fetchRivalryMetric(
            participant.userId,
            rivalry.platform,
            rivalry.metricKey,
        );

        if (result.ok) {
            const hash = require('crypto')
                .createHash('sha256')
                .update(JSON.stringify(result.rawJson))
                .digest('hex')
                .slice(0, 16);

            await db.update(rivalryParticipants)
                .set({
                    baselineValue: String(result.value),
                    baselineJson: result.rawJson,
                    baselineSnapshotAt: new Date(),
                    baselineHash: hash,
                })
                .where(eq(rivalryParticipants.id, participant.id));

            // Also write initial metric snapshot
            await db.insert(rivalryMetricSnapshots).values({
                rivalryId,
                userId: participant.userId,
                provider: rivalry.platform,
                metricKey: rivalry.metricKey,
                metricValue: String(result.value),
                fetchedAt: new Date(),
                requestId: randomUUID(),
                rawPayloadHash: hash,
            });

            console.log(`[RivalryTracker] Baseline set for ${participant.role} in ${rivalryId}: ${result.value}`);
        } else if (isExpectedAbsence(result)) {
            // Waiting on this participant to connect. The activation guard below
            // will not fire until every baseline is set, so nothing advances on a
            // partial snapshot.
            skipped++;
            console.log(`[RivalryTracker] Baseline pending for ${participant.role} in ${rivalryId} — ${result.reason}`);
        } else {
            console.error(`[RivalryTracker] Failed to snapshot baseline for ${participant.role} in ${rivalryId}`);
            errors++;
        }
    }

    // If all baselines set, activate the rivalry
    const allSet = await db
        .select()
        .from(rivalryParticipants)
        .where(and(
            eq(rivalryParticipants.rivalryId, rivalryId),
            isNotNull(rivalryParticipants.baselineValue),
        ))
        .then(rows => rows.length === participants.length);

    if (allSet) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + rivalry.durationDays);

        await db.update(rivalries)
            .set({
                activatedAt: new Date(),
                deadlineUtc: deadline,
                updatedAt: new Date(),
            })
            .where(eq(rivalries.id, rivalryId));

        await appendRivalryEvent(rivalryId, {
            actor: 'SYSTEM',
            eventType: RivalryEventType.RIVALRY_ACTIVATED,
            metadata: {
                activatedAt: new Date().toISOString(),
                deadlineUtc: deadline.toISOString(),
            },
        });

        console.log(`[RivalryTracker] Rivalry ${rivalryId} ACTIVATED — deadline ${deadline.toISOString()}`);
    }

    return { ok: errors === 0, skipped, errors };
}

// =============================================================================
// PERIODIC METRIC REFRESH
// =============================================================================

/**
 * Refresh metrics for all active rivalries.
 * Takes a snapshot of each participant's current metric value.
 */
async function refreshActiveRivalryMetrics(): Promise<{ snapshots: number; errors: number; skipped: number }> {
    let snapshots = 0;
    let errors = 0;
    let skipped = 0;

    // Find all active rivalries (have activatedAt, no settledAt, past deadline check is separate)
    const activeRivalries = await db
        .select()
        .from(rivalries)
        .where(
            and(
                isNotNull(rivalries.activatedAt),
                isNull(rivalries.settledAt),
            )
        );

    for (const rivalry of activeRivalries) {
        const participants = await db
            .select()
            .from(rivalryParticipants)
            .where(eq(rivalryParticipants.rivalryId, rivalry.id));

        for (const participant of participants) {
            const result = await fetchRivalryMetric(
                participant.userId,
                rivalry.platform,
                rivalry.metricKey,
            );

            if (result.ok) {
                const hash = require('crypto')
                    .createHash('sha256')
                    .update(JSON.stringify(result.rawJson))
                    .digest('hex')
                    .slice(0, 16);

                await db.insert(rivalryMetricSnapshots).values({
                    rivalryId: rivalry.id,
                    userId: participant.userId,
                    provider: rivalry.platform,
                    metricKey: rivalry.metricKey,
                    metricValue: String(result.value),
                    fetchedAt: new Date(),
                    requestId: randomUUID(),
                    rawPayloadHash: hash,
                });

                snapshots++;
            } else if (isExpectedAbsence(result)) {
                skipped++;
            } else {
                errors++;
            }
        }
    }

    return { snapshots, errors, skipped };
}

// =============================================================================
// MAIN JOB RUNNER
// =============================================================================

/**
 * Run the full rivalry tracking job:
 * 1. Snapshot baselines for newly-funded rivalries
 * 2. Refresh metrics for active rivalries
 */
export async function runRivalryTrackerJob(): Promise<TrackerResult> {
    console.log('[RivalryTracker] Starting rivalry tracker job...');
    const startTime = Date.now();

    let processed = 0;
    let snapshotsTaken = 0;
    let baselinesSet = 0;
    let errorCount = 0;
    let skipped = 0;

    // 1. Find rivalries that are BOTH_FUNDED but not yet ACTIVATED (need baselines)
    const fundedNotActivated = await db
        .select()
        .from(rivalries)
        .where(
            and(
                isNotNull(rivalries.fundedAt),
                isNull(rivalries.activatedAt),
                isNull(rivalries.settledAt),
            )
        );

    for (const rivalry of fundedNotActivated) {
        processed++;
        const result = await snapshotBaselines(rivalry.id);
        skipped += result.skipped;
        errorCount += result.errors;
        if (result.ok && result.skipped === 0) baselinesSet++;
    }

    // 2. Refresh metrics for active rivalries
    const { snapshots, errors, skipped: refreshSkipped } = await refreshActiveRivalryMetrics();
    snapshotsTaken += snapshots;
    errorCount += errors;
    skipped += refreshSkipped;
    processed += snapshots + errors + refreshSkipped;

    const duration = Date.now() - startTime;
    console.log(`[RivalryTracker] Complete in ${duration}ms — baselines: ${baselinesSet}, snapshots: ${snapshotsTaken}, skipped: ${skipped}, errors: ${errorCount}`);

    return {
        processed,
        snapshotsTaken,
        baselinesSet,
        errors: errorCount,
        skipped,
    };
}
