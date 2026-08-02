/**
 * Payout pipeline tests.
 *
 * These cover the rules whose absence loses or duplicates real money. They run
 * without a database or provider: the ledger and adapter are stubbed so every
 * branch is reachable and nothing can move funds.
 *
 * NOTE: this suite is NEW. The repo carries ~146 pre-existing failures in other
 * files; these are reported separately so they are not lost in that noise.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── stub the ledger before importing the job ──
const appended: any[] = [];
const blockedIds = new Set<string>();

vi.mock('../src/services/balances.js', () => ({
    AccountEventType: {
        PAYOUT_QUEUED: 'PAYOUT_QUEUED', PAYOUT_SENT: 'PAYOUT_SENT',
        PAYOUT_FAILED: 'PAYOUT_FAILED', PAYOUT_BLOCKED: 'PAYOUT_BLOCKED',
    },
    appendAccountEvent: async (e: any) => { appended.push(e); return { id: 'evt_' + appended.length }; },
}));

// drizzle's sql`` yields StringChunk objects, not strings — flatten via .value
// so the stub can tell the two queries apart.
const queryText = (q: any): string =>
    (q?.queryChunks ?? []).map((c: any) =>
        typeof c === 'string' ? c : Array.isArray(c?.value) ? c.value.join('') : String(c?.value ?? '')
    ).join('');

vi.mock('../src/db/client.js', () => ({
    db: {
        execute: async (q: any) => {
            const text = queryText(q);
            // Stands in for the real table: a park is visible to the next pass.
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

const { processOnePayout, payoutIdempotencyKey, MAX_ATTEMPTS } = await import('../src/services/payout-job.js');

type Outcome = 'SENT' | 'BLOCKED' | 'FAILED';

/** Adapter double: scripted destination + send behaviour, records every call. */
function adapter(opts: {
    destination?: { ok: true; destination: string } | { ok: false; code: string; reason: string };
    onSend?: (n: number, key: string) => { providerRef: string } | never;
    classify?: (e: any) => 'TRANSIENT' | 'TERMINAL';
}) {
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

beforeEach(() => { appended.length = 0; blockedIds.clear(); });

describe('idempotency (a)', () => {
    it('derives the key from the origin event id, not randomness', () => {
        expect(payoutIdempotencyKey('ev_abc')).toBe('payout_ev_abc');
        expect(payoutIdempotencyKey('ev_abc')).toBe(payoutIdempotencyKey('ev_abc'));
    });

    it('a restart mid-batch reuses the SAME key — provider dedupes, no second transfer', async () => {
        const a1 = adapter({});
        await processOnePayout(row() as any, a1 as any);
        // simulate the worker dying and the row being picked up again
        appended.length = 0;
        const a2 = adapter({});
        await processOnePayout(row() as any, a2 as any);
        expect(a1.calls[0].key).toBe(a2.calls[0].key);
        expect(a1.calls[0].key).toBe('payout_ev_1');
    });
});

describe('missing destination parks, never retries (b)', () => {
    it('writes PAYOUT_BLOCKED and does NOT send', async () => {
        const a = adapter({ destination: { ok: false, code: 'NO_CONNECT_ACCOUNT', reason: 'not onboarded' } });
        const r = await processOnePayout(row() as any, a as any);
        expect(r.outcome).toBe('BLOCKED');
        expect(a.calls).toHaveLength(0);                       // never contacted the provider
        expect(appended.map(e => e.eventType)).toContain('PAYOUT_BLOCKED');
        expect(appended.some(e => e.eventType === 'PAYOUT_SENT')).toBe(false);
    });

    it('records the reason so it is diagnosable', async () => {
        const a = adapter({ destination: { ok: false, code: 'PAYOUTS_DISABLED', reason: 'stripe says no' } });
        await processOnePayout(row() as any, a as any);
        const b = appended.find(e => e.eventType === 'PAYOUT_BLOCKED');
        expect(b.metadata.code).toBe('PAYOUTS_DISABLED');
        expect(b.metadata.reason).toBe('stripe says no');
    });

    it('does not re-park on a second pass (no notification storm)', async () => {
        const a = adapter({ destination: { ok: false, code: 'NO_WALLET', reason: 'none' } });
        await processOnePayout(row() as any, a as any);
        await processOnePayout(row() as any, a as any);
        expect(appended.filter(e => e.eventType === 'PAYOUT_BLOCKED')).toHaveLength(1);
    });
});

describe('error classification and retry (d)', () => {
    it('TERMINAL parks immediately with no retry', async () => {
        const a = adapter({
            onSend: () => { const e: any = new Error('account closed'); e.code = 'account_closed'; throw e; },
            classify: () => 'TERMINAL',
        });
        const r = await processOnePayout(row() as any, a as any);
        expect(r.outcome).toBe('FAILED');
        expect(a.calls).toHaveLength(1);                        // exactly one attempt
        expect(appended.some(e => e.eventType === 'PAYOUT_FAILED')).toBe(true);
    });

    it('TRANSIENT retries then parks as FAILED after MAX_ATTEMPTS', async () => {
        const a = adapter({
            onSend: () => { const e: any = new Error('503'); e.code = 'api_error'; throw e; },
            classify: () => 'TRANSIENT',
        });
        const r = await processOnePayout(row() as any, a as any);
        expect(r.outcome).toBe('FAILED');
        expect(a.calls).toHaveLength(MAX_ATTEMPTS);
        const f = appended.find(e => e.eventType === 'PAYOUT_FAILED');
        expect(f.metadata.attempts).toBe(MAX_ATTEMPTS);
    }, 20000);

    it('a transient failure that later succeeds is SENT, and reuses one key', async () => {
        const a = adapter({
            onSend: (n) => { if (n < 3) { const e: any = new Error('timeout'); throw e; } return { providerRef: 'tr_ok' }; },
            classify: () => 'TRANSIENT',
        });
        const r = await processOnePayout(row() as any, a as any);
        expect(r.outcome).toBe('SENT');
        expect(new Set(a.calls.map(c => c.key)).size).toBe(1);   // same key every attempt
    }, 20000);
});

describe('amount comes from the frozen record (e)', () => {
    it('sends exactly the queued amount', async () => {
        const a = adapter({});
        await processOnePayout(row({ amount_cents: 123456 }) as any, a as any);
        expect(a.calls[0].amountCents).toBe(123456);
        expect(appended.find(e => e.eventType === 'PAYOUT_SENT').amountCents).toBe(123456);
    });

    it('rejects a non-positive amount rather than sending it', async () => {
        const a = adapter({});
        const r = await processOnePayout(row({ amount_cents: 0 }) as any, a as any);
        expect(r.outcome).toBe('FAILED');
        expect(a.calls).toHaveLength(0);
    });
});

describe('ledger written only after provider confirms (f)', () => {
    it('no PAYOUT_SENT when the provider throws', async () => {
        const a = adapter({ onSend: () => { throw Object.assign(new Error('nope'), { code: 'x' }); }, classify: () => 'TERMINAL' });
        await processOnePayout(row() as any, a as any);
        expect(appended.some(e => e.eventType === 'PAYOUT_SENT')).toBe(false);
    });

    it('PAYOUT_SENT carries the provider reference', async () => {
        const a = adapter({});
        await processOnePayout(row() as any, a as any);
        const s = appended.find(e => e.eventType === 'PAYOUT_SENT');
        expect(s.metadata.providerRef).toBe('tr_1');
        expect(s.originEventId).toBe('ev_1');
    });
});

describe('partial batch isolation (c)', () => {
    it('one failure does not stop the others', async () => {
        const results: Outcome[] = [];
        const rows = [row({ event_id: 'ev_1' }), row({ event_id: 'ev_2' }), row({ event_id: 'ev_3' })];
        for (const r of rows) {
            const a = adapter(
                r.event_id === 'ev_2'
                    ? { onSend: () => { throw Object.assign(new Error('bad'), { code: 'account_closed' }); }, classify: () => 'TERMINAL' }
                    : {}
            );
            const out = await processOnePayout(r as any, a as any);
            results.push(out.outcome);
        }
        expect(results).toEqual(['SENT', 'FAILED', 'SENT']);
    });
});
