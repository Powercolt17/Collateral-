/**
 * Payout operations — MANUAL APPROVAL ONLY.
 *
 * Settlement is automatic: verification, outcome and PAYOUT_QUEUED all run in
 * the worker without a human. Money movement is not. Nothing in this file is
 * ever called from the worker loop; the only path that disburses is
 * POST /v1/admin/payouts/:eventId/approve.
 *
 * That is a deliberate policy, not an implementation gap. If you are wiring
 * these functions into a scheduler, stop — tests/payout-manual-approval.test.ts
 * asserts the worker never reaches a payout adapter.
 *
 * RULES ENFORCED HERE (each exists because its absence loses or duplicates
 * someone's money). They apply to the approve path exactly as before:
 *
 * a) IDEMPOTENCY — key is `payout_{originEventId}`, derived, never random.
 *    A double-approve of the same event is a provider no-op, not a second
 *    transfer. Paying twice is worse than paying late.
 *
 * b) MISSING DESTINATION — parks as PAYOUT_BLOCKED with a reason and stops.
 *    Never retries forever, never marks itself sent. BLOCKED is not terminal,
 *    so the payout can be approved again once the user onboards.
 *
 * c) ISOLATION — each payout is independent; one failure cannot affect another.
 *
 * d) RETRY POLICY — transient errors back off to MAX_ATTEMPTS then park as
 *    PAYOUT_FAILED; terminal errors park immediately.
 *
 * e) AMOUNT — read from the frozen PAYOUT_QUEUED event, never recomputed.
 *
 * f) LEDGER LAST — PAYOUT_SENT is written only AFTER the provider confirms.
 *    A crash between the two is recovered by (a).
 *
 * AUDIT — approve and reject both record the acting admin and the timestamp.
 * Money leaving on a human decision must show whose decision it was.
 */

import { db } from '../db/client.js';
import { sql as raw } from 'drizzle-orm';
import { appendAccountEvent, AccountEventType } from './balances.js';
import { getPayoutAdapter, resolveUserRail, type PayoutAdapter } from './payout-adapters.js';

export const MAX_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 500;

export interface PayoutJobResult {
    scanned: number;
    sent: number;
    blocked: number;
    failed: number;
    details: Array<{ eventId: string; outcome: 'SENT' | 'BLOCKED' | 'FAILED'; reason?: string; providerRef?: string }>;
}

/** Deterministic. Two runs over the same event produce the same key. */
export function payoutIdempotencyKey(originEventId: string): string {
    return `payout_${originEventId}`;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Queued payouts with no terminal outcome yet.
 *
 * PAYOUT_SENT and PAYOUT_FAILED are terminal. PAYOUT_BLOCKED deliberately is
 * NOT — a parked payout must pay itself once a destination appears, otherwise
 * onboarding after a win would never deliver the money.
 */
async function fetchPending(limit: number) {
    const result: any = await db.execute(raw`
        SELECT e.id AS event_id, e.user_id, e.amount_cents, e.contract_id
        FROM account_ledger_events e
        WHERE e.event_type = 'PAYOUT_QUEUED'
          AND NOT EXISTS (
              SELECT 1 FROM account_ledger_events t
              WHERE t.origin_event_id = e.id
                AND t.event_type IN ('PAYOUT_SENT', 'PAYOUT_FAILED')
          )
        ORDER BY e.created_at ASC
        LIMIT ${limit}
    `);
    return Array.isArray(result) ? result : (result?.rows ?? []);
}

/** Has this payout already been parked? Used to avoid re-notifying every loop. */
async function alreadyBlocked(originEventId: string): Promise<boolean> {
    const result: any = await db.execute(raw`
        SELECT 1 FROM account_ledger_events
        WHERE origin_event_id = ${originEventId} AND event_type = 'PAYOUT_BLOCKED'
        LIMIT 1
    `);
    const rows = Array.isArray(result) ? result : (result?.rows ?? []);
    return rows.length > 0;
}

async function park(
    kind: 'PAYOUT_BLOCKED' | 'PAYOUT_FAILED',
    args: { userId: string; contractId?: string; amountCents: number; originEventId: string; reason: string; code: string; attempts?: number }
) {
    await appendAccountEvent({
        userId: args.userId,
        contractId: args.contractId,
        eventType: kind as any,
        amountCents: args.amountCents,
        idempotencyKey: `${kind.toLowerCase()}_${args.originEventId}`,
        originEventId: args.originEventId,
        metadata: { reason: args.reason, code: args.code, attempts: args.attempts ?? 0 },
    });
    console.error(`[Payouts] ${kind} event=${args.originEventId} user=${args.userId} code=${args.code} — ${args.reason}`);
}

/**
 * Process one payout. Never throws — a single payout's failure must not affect
 * any other (rule c). Returns what happened.
 */
export async function processOnePayout(row: {
    event_id: string; user_id: string; amount_cents: number | string; contract_id?: string;
}, adapterOverride?: PayoutAdapter, approvedBy?: string): Promise<{ outcome: 'SENT' | 'BLOCKED' | 'FAILED'; reason?: string; providerRef?: string }> {
    const originEventId = String(row.event_id);
    const userId = String(row.user_id);
    // (e) amount comes from the frozen queued event, never recomputed
    const amountCents = Number(row.amount_cents);
    const contractId = row.contract_id ? String(row.contract_id) : undefined;

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
        await park('PAYOUT_FAILED', { userId, contractId, amountCents: 0, originEventId,
            code: 'INVALID_AMOUNT', reason: `Queued amount is not a positive integer: ${row.amount_cents}` });
        return { outcome: 'FAILED', reason: 'INVALID_AMOUNT' };
    }

    const adapter = adapterOverride ?? getPayoutAdapter(await resolveUserRail(userId));

    // (b) no destination → park, do not retry, do not mark sent
    const dest = await adapter.resolveDestination(userId);
    if (dest.ok !== true) {
        const { code, reason } = dest;
        if (!(await alreadyBlocked(originEventId))) {
            await park('PAYOUT_BLOCKED', { userId, contractId, amountCents, originEventId, code, reason });
        }
        return { outcome: 'BLOCKED', reason: code };
    }

    const idempotencyKey = payoutIdempotencyKey(originEventId); // (a)
    let lastErr: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const { providerRef } = await adapter.send({
                destination: dest.destination,
                amountCents,
                idempotencyKey,
                metadata: { userId, contractId: contractId || 'n/a', originEventId, rail: adapter.rail },
            });

            // (f) ledger only after the provider confirms
            await appendAccountEvent({
                userId, contractId,
                eventType: AccountEventType.PAYOUT_SENT,
                amountCents,
                idempotencyKey: `payout_sent_${originEventId}`,
                originEventId,
                metadata: {
                    providerRef, rail: adapter.rail, destination: dest.destination, attempts: attempt,
                    // AUDIT: money left on a human decision — record whose.
                    approvedBy: approvedBy ?? 'UNKNOWN',
                    approvedAt: new Date().toISOString(),
                },
            });
            console.log(`[Payouts] SENT ${amountCents}c event=${originEventId} rail=${adapter.rail} ref=${providerRef}`);
            return { outcome: 'SENT', providerRef };
        } catch (err: any) {
            lastErr = err;
            // (d) terminal → park now; transient → back off and retry
            if (adapter.classifyError(err) === 'TERMINAL') {
                await park('PAYOUT_FAILED', { userId, contractId, amountCents, originEventId,
                    code: err?.code || 'TERMINAL', reason: err?.message || 'Terminal provider error', attempts: attempt });
                return { outcome: 'FAILED', reason: err?.code || 'TERMINAL' };
            }
            if (attempt < MAX_ATTEMPTS) await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
        }
    }

    await park('PAYOUT_FAILED', { userId, contractId, amountCents, originEventId,
        code: lastErr?.code || 'MAX_ATTEMPTS', reason: `Exhausted ${MAX_ATTEMPTS} attempts: ${lastErr?.message || 'unknown'}`, attempts: MAX_ATTEMPTS });
    return { outcome: 'FAILED', reason: 'MAX_ATTEMPTS' };
}

/**
 * Fetch one queued payout by event id, if it is still awaiting a decision.
 * Returns null when it does not exist or already has a terminal outcome.
 */
export async function fetchQueuedPayout(eventId: string) {
    const result: any = await db.execute(raw`
        SELECT e.id AS event_id, e.user_id, e.amount_cents, e.contract_id, e.created_at
        FROM account_ledger_events e
        WHERE e.id = ${eventId}
          AND e.event_type = 'PAYOUT_QUEUED'
          AND NOT EXISTS (
              SELECT 1 FROM account_ledger_events t
              WHERE t.origin_event_id = e.id
                AND t.event_type IN ('PAYOUT_SENT', 'PAYOUT_FAILED', 'PAYOUT_REJECTED')
          )
        LIMIT 1
    `);
    const rows = Array.isArray(result) ? result : (result?.rows ?? []);
    return rows[0] ?? null;
}

/** Everything awaiting an approval decision. Powers the admin queue. */
export async function listPendingPayouts(limit = 200) {
    const result: any = await db.execute(raw`
        SELECT e.id AS event_id, e.user_id, e.amount_cents, e.contract_id, e.created_at,
               c.metric_type, c.condition_json, c.deadline_utc,
               i.username
        FROM account_ledger_events e
        LEFT JOIN contracts c ON c.id = e.contract_id
        LEFT JOIN identities i ON i.user_id = e.user_id
        WHERE e.event_type = 'PAYOUT_QUEUED'
          AND NOT EXISTS (
              SELECT 1 FROM account_ledger_events t
              WHERE t.origin_event_id = e.id
                AND t.event_type IN ('PAYOUT_SENT', 'PAYOUT_FAILED', 'PAYOUT_REJECTED')
          )
        ORDER BY e.created_at ASC
        LIMIT ${limit}
    `);
    return Array.isArray(result) ? result : (result?.rows ?? []);
}

/** Record an admin declining a payout. A reason is mandatory. */
export async function rejectPayout(args: {
    eventId: string; userId: string; contractId?: string; amountCents: number;
    reason: string; rejectedBy: string;
}) {
    if (!args.reason || !args.reason.trim()) {
        throw new Error('A reason is required to reject a payout');
    }
    await appendAccountEvent({
        userId: args.userId,
        contractId: args.contractId,
        eventType: AccountEventType.PAYOUT_REJECTED as any,
        amountCents: args.amountCents,
        idempotencyKey: `payout_rejected_${args.eventId}`,
        originEventId: args.eventId,
        metadata: {
            reason: args.reason.trim(),
            rejectedBy: args.rejectedBy,
            rejectedAt: new Date().toISOString(),
        },
    });
    console.log(`[Payouts] REJECTED event=${args.eventId} by=${args.rejectedBy} — ${args.reason}`);
}
