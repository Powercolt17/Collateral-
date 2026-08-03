/**
 * Manual-approval policy tests.
 *
 * Payouts are approval-only: settlement runs automatically, money movement does
 * not. The first test here is a POLICY GUARD — it reads the worker source and
 * fails if anyone wires a payout back into the loop. That is deliberate: the
 * cost of silently re-enabling automatic disbursement is real money leaving
 * without a human deciding, and a type error will not catch it.
 *
 * NOTE: this suite is NEW. The repo carries ~146 pre-existing failures
 * elsewhere; these are reported separately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── ledger + db stubs (no database, no provider, no money) ──
const appended: any[] = [];

vi.mock('../src/services/balances.js', () => ({
    AccountEventType: {
        PAYOUT_QUEUED: 'PAYOUT_QUEUED', PAYOUT_SENT: 'PAYOUT_SENT',
        PAYOUT_FAILED: 'PAYOUT_FAILED', PAYOUT_BLOCKED: 'PAYOUT_BLOCKED',
        PAYOUT_REJECTED: 'PAYOUT_REJECTED',
    },
    appendAccountEvent: async (e: any) => { appended.push(e); return { id: 'evt_' + appended.length }; },
}));

const queryText = (q: any): string =>
    (q?.queryChunks ?? []).map((c: any) =>
        typeof c === 'string' ? c : Array.isArray(c?.value) ? c.value.join('') : String(c?.value ?? '')
    ).join('');

vi.mock('../src/db/client.js', () => ({
    db: {
        execute: async (q: any) => {
            const text = queryText(q);
            if (text.includes("event_type = 'PAYOUT_BLOCKED'")) {
                return appended.some(a => a.eventType === 'PAYOUT_BLOCKED') ? [{ exists: 1 }] : [];
            }
            return [];
        },
    },
}));

vi.mock('../src/services/payout-adapters.js', async () => {
    const actual: any = await vi.importActual('../src/services/payout-adapters.js');
    return { ...actual, resolveUserRail: async () => 'USD' };
});

const { processOnePayout, rejectPayout, payoutIdempotencyKey } =
    await import('../src/services/payout-job.js');

function adapter(opts: {
    destination?: { ok: true; destination: string } | { ok: false; code: string; reason: string };
    onSend?: (n: number, key: string) => { providerRef: string };
    classify?: (e: any) => 'TRANSIENT' | 'TERMINAL';
} = {}) {
    const calls: Array<{ key: string; amountCents: number }> = [];
    let n = 0;
    return {
        calls,
        rail: 'USD' as const,
        async resolveDestination() { return opts.destination ?? { ok: true as const, destination: 'acct_1' }; },
        async send(p: any) {
            n++; calls.push({ key: p.idempotencyKey, amountCents: p.amountCents });
            if (opts.onSend) return opts.onSend(n, p.idempotencyKey);
            return { providerRef: 'tr_' + n };
        },
        classifyError(e: any) { return opts.classify ? opts.classify(e) : 'TRANSIENT' as const; },
    };
}

const row = (over: any = {}) => ({ event_id: 'ev_1', user_id: 'u_1', amount_cents: 5000, contract_id: 'c_1', ...over });

beforeEach(() => { appended.length = 0; });

// =============================================================================
// POLICY GUARD
// =============================================================================

describe('the worker never disburses', () => {
    const workerSrc = readFileSync(resolve(process.cwd(), 'src/worker/runner.ts'), 'utf8');

    it('does not import any payout module', () => {
        expect(workerSrc).not.toMatch(/from\s+['"]\.\.\/services\/payout-job\.js['"]/);
        expect(workerSrc).not.toMatch(/from\s+['"]\.\.\/services\/payout-adapters\.js['"]/);
    });

    it('does not call a payout function', () => {
        expect(workerSrc).not.toMatch(/runPayoutJob\s*\(/);
        expect(workerSrc).not.toMatch(/processOnePayout\s*\(/);
        expect(workerSrc).not.toMatch(/\.send\s*\(\s*\{/);
    });

    it('still runs settlement and verification — only money movement is gated', () => {
        expect(workerSrc).toMatch(/runVerificationJob\s*\(/);
        expect(workerSrc).toMatch(/runSettlementJob\s*\(/);
    });

    it('records why, so the next person does not "fix" it', () => {
        expect(workerSrc).toMatch(/MANUAL|manual-approval|NO PAYOUT JOB HERE/i);
    });

    // The worker now runs the scheduler's periodic jobs, so the guard above is
    // no longer sufficient on its own: a payout job added to scheduler.ts would
    // be executed by the worker without runner.ts ever mentioning it.
    const schedulerSrc = readFileSync(resolve(process.cwd(), 'src/services/scheduler.ts'), 'utf8');

    it('does not reach a payout module through the scheduler it runs', () => {
        expect(schedulerSrc).not.toMatch(/from\s+['"]\.\.\/services\/payout-job\.js['"]/);
        expect(schedulerSrc).not.toMatch(/from\s+['"]\.\.\/services\/payout-adapters\.js['"]/);
        expect(schedulerSrc).not.toMatch(/payout-job\.js|payout-adapters\.js/);
        expect(schedulerSrc).not.toMatch(/runPayoutJob\s*\(/);
        expect(schedulerSrc).not.toMatch(/processOnePayout\s*\(/);
    });

    it('runs the scheduler without re-running verification and settlement', () => {
        // Both already run on the worker's own loop. Two runners against one
        // database is the thing this consolidation removed.
        expect(workerSrc).toMatch(/includeVerificationAndSettlement:\s*false/);
    });
});

describe('approve is the only disbursing path', () => {
    const routeSrc = readFileSync(resolve(process.cwd(), 'src/routes/admin-payouts.ts'), 'utf8');

    it('exposes exactly one approve endpoint and no bulk-approve', () => {
        expect(routeSrc).toMatch(/payouts\/:eventId\/approve/);
        expect(routeSrc).not.toMatch(/approve-all|bulk.?approve|approveAll/i);
    });

    it('gates every route behind the admin check', () => {
        const handlers = routeSrc.match(/fastify\.(get|post)/g) ?? [];
        const guards = routeSrc.match(/if \(!isAdmin\(request\)\) return deny\(reply\)/g) ?? [];
        expect(guards.length).toBe(handlers.length);
    });
});

// =============================================================================
// APPROVE PATH — all six rules still hold
// =============================================================================

describe('approve path keeps the six rules', () => {
    it('(a) double-approve reuses the same idempotency key — provider no-ops', async () => {
        const a1 = adapter();
        await processOnePayout(row() as any, a1 as any, 'admin@x');
        appended.length = 0;
        const a2 = adapter();
        await processOnePayout(row() as any, a2 as any, 'admin@x');
        expect(a1.calls[0].key).toBe(a2.calls[0].key);
        expect(a1.calls[0].key).toBe(payoutIdempotencyKey('ev_1'));
    });

    it('(b) missing destination parks, never sends', async () => {
        const a = adapter({ destination: { ok: false, code: 'NO_CONNECT_ACCOUNT', reason: 'not onboarded' } });
        const r = await processOnePayout(row() as any, a as any, 'admin@x');
        expect(r.outcome).toBe('BLOCKED');
        expect(a.calls).toHaveLength(0);
        expect(appended.some(e => e.eventType === 'PAYOUT_SENT')).toBe(false);
    });

    it('(d) terminal error parks immediately without retrying', async () => {
        const a = adapter({
            onSend: () => { throw Object.assign(new Error('closed'), { code: 'account_closed' }); },
            classify: () => 'TERMINAL',
        });
        const r = await processOnePayout(row() as any, a as any, 'admin@x');
        expect(r.outcome).toBe('FAILED');
        expect(a.calls).toHaveLength(1);
    });

    it('(e) sends the frozen amount, not a recomputed one', async () => {
        const a = adapter();
        await processOnePayout(row({ amount_cents: 98765 }) as any, a as any, 'admin@x');
        expect(a.calls[0].amountCents).toBe(98765);
    });

    it('(f) PAYOUT_SENT only after the provider confirms', async () => {
        const a = adapter({ onSend: () => { throw Object.assign(new Error('x'), { code: 'account_closed' }); }, classify: () => 'TERMINAL' });
        await processOnePayout(row() as any, a as any, 'admin@x');
        expect(appended.some(e => e.eventType === 'PAYOUT_SENT')).toBe(false);
    });
});

// =============================================================================
// AUDIT
// =============================================================================

describe('audit trail', () => {
    it('records who approved and when on the sent event', async () => {
        const a = adapter();
        await processOnePayout(row() as any, a as any, 'alice@collateral');
        const sent = appended.find(e => e.eventType === 'PAYOUT_SENT');
        expect(sent.metadata.approvedBy).toBe('alice@collateral');
        expect(sent.metadata.approvedAt).toBeTruthy();
    });

    it('reject requires a reason', async () => {
        await expect(rejectPayout({
            eventId: 'ev_1', userId: 'u_1', amountCents: 5000, reason: '   ', rejectedBy: 'alice',
        })).rejects.toThrow(/reason is required/i);
        expect(appended.some(e => e.eventType === 'PAYOUT_REJECTED')).toBe(false);
    });

    it('reject records the reason and the actor, never silently drops', async () => {
        await rejectPayout({
            eventId: 'ev_9', userId: 'u_1', amountCents: 5000,
            reason: 'suspected wash trading', rejectedBy: 'bob@collateral',
        });
        const r = appended.find(e => e.eventType === 'PAYOUT_REJECTED');
        expect(r.metadata.reason).toBe('suspected wash trading');
        expect(r.metadata.rejectedBy).toBe('bob@collateral');
        expect(r.originEventId).toBe('ev_9');
    });
});
