/**
 * Rivalry Listing State Tests
 *
 * The market grid draws one card per rivalry the feed returns, so anything
 * that silently removes a rivalry from that feed removes a card. The strict
 * derivation throws on a chain containing a transition the table does not
 * allow, and listRivalries used to turn that throw into a dropped row — one
 * out-of-order event erased a contract from the market permanently.
 *
 * These cover the lenient derivation the listing reads through: it must never
 * throw, must report what it read past, and must still land on the state the
 * newest event actually put the contract in.
 */

import { describe, it, expect } from 'vitest';
import {
    deriveRivalryState,
    deriveRivalryStateLenient,
    InvalidRivalryTransitionError,
} from '../src/services/rivalry-state-derivation.js';
import { RivalryStatus, RivalryEventType } from '../src/db/schema.js';

function ev(eventType: string, index: number = 0) {
    return {
        id: `revent-${index}`,
        rivalryId: 'rivalry-123',
        actor: 'SYSTEM' as const,
        userId: null,
        eventType,
        timestampUtc: new Date(Date.now() + index * 1000),
        amountUsdCents: null,
        externalRef: null,
        metadataJson: null,
        prevEventHash: null,
        eventHash: `rhash-${index}`,
    } as any;
}

function chain(...types: string[]) {
    return types.map((t, i) => ev(t, i));
}

describe('deriveRivalryStateLenient', () => {
    it('returns null for an empty chain, same as the strict derivation', () => {
        expect(deriveRivalryStateLenient([]).state).toBeNull();
    });

    it('agrees with the strict derivation on a clean chain', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_ACCEPTED,
            RivalryEventType.RIVALRY_BOTH_FUNDED,
            RivalryEventType.RIVALRY_ACTIVATED,
        );
        const lenient = deriveRivalryStateLenient(events);
        expect(lenient.state).toBe(RivalryStatus.ACTIVE);
        expect(lenient.invalidTransitions).toHaveLength(0);
        expect(deriveRivalryState(events)).toBe(RivalryStatus.ACTIVE);
    });

    it('ignores events that do not affect state', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            'RIVALRY_BASELINE_CAPTURED',
            RivalryEventType.RIVALRY_ACCEPTED,
            'RIVALRY_METRIC_RECORDED',
        );
        expect(deriveRivalryStateLenient(events).state).toBe(RivalryStatus.ACCEPTED);
    });

    /* The production chain the market actually trips on. Nothing performs
       ACTIVE → VERIFYING → VERIFIED (see jobs/rivalry-cron.ts), so a
       settlement appends SETTLEMENT_STARTED straight onto an ACTIVE chain. */
    it('does not throw on the ACTIVE → SETTLING chain production writes', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_ACCEPTED,
            RivalryEventType.RIVALRY_BOTH_FUNDED,
            RivalryEventType.RIVALRY_ACTIVATED,
            RivalryEventType.RIVALRY_SETTLEMENT_STARTED,
            RivalryEventType.RIVALRY_SETTLED,
        );

        // The strict derivation is what dropped the row.
        expect(() => deriveRivalryState(events)).toThrow(InvalidRivalryTransitionError);

        const lenient = deriveRivalryStateLenient(events);
        expect(lenient.state).toBe(RivalryStatus.SETTLED);
        expect(lenient.invalidTransitions).toHaveLength(1);
        expect(lenient.invalidTransitions[0]).toMatchObject({
            from: RivalryStatus.ACTIVE,
            to: RivalryStatus.SETTLING,
            eventType: RivalryEventType.RIVALRY_SETTLEMENT_STARTED,
        });
    });

    it('reports every disallowed transition, not just the first', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_ACTIVATED,          // skips ACCEPTED + BOTH_FUNDED
            RivalryEventType.RIVALRY_SETTLEMENT_STARTED, // skips VERIFYING + VERIFIED
        );
        const lenient = deriveRivalryStateLenient(events);
        expect(lenient.invalidTransitions).toHaveLength(2);
        expect(lenient.state).toBe(RivalryStatus.SETTLING);
    });

    /* The newest state-affecting event is what happened to the contract, so it
       is what the board shows. Falling back to the last VALID state instead
       would list a settled rivalry as ACTIVE — a finished contract advertised
       as a live one, which is worse than not listing it at all. */
    it('lands on the newest state, not the last valid one', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_SETTLED,
        );
        expect(deriveRivalryStateLenient(events).state).toBe(RivalryStatus.SETTLED);
    });

    it('treats a repeated event as a no-op rather than a violation', () => {
        // The tracker job re-appends RIVALRY_ACTIVATED for already-active
        // rivalries; that must not mark the chain degraded.
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_ACCEPTED,
            RivalryEventType.RIVALRY_BOTH_FUNDED,
            RivalryEventType.RIVALRY_ACTIVATED,
            RivalryEventType.RIVALRY_ACTIVATED,
        );
        const lenient = deriveRivalryStateLenient(events);
        expect(lenient.state).toBe(RivalryStatus.ACTIVE);
        expect(lenient.invalidTransitions).toHaveLength(0);
    });

    /* THE BOARD AND THE DETAIL PAGE MUST AGREE ON WHAT EXISTS.
       Making only the listing lenient is worse than making neither: the market
       shows a rivalry, the reader clicks it, GET /v1/rivalries/:id throws, the
       route turns that into a 500, and the page reports "RIVALRY NOT FOUND"
       about a contract sitting on the board behind it. Both read paths derive
       through this function for that reason. */
    it('reads the same chains the listing lists', () => {
        const chains = [
            chain(RivalryEventType.RIVALRY_CREATED, RivalryEventType.RIVALRY_ACTIVATED),
            chain(
                RivalryEventType.RIVALRY_CREATED,
                RivalryEventType.RIVALRY_ACCEPTED,
                RivalryEventType.RIVALRY_BOTH_FUNDED,
                RivalryEventType.RIVALRY_ACTIVATED,
                RivalryEventType.RIVALRY_SETTLEMENT_STARTED,
            ),
        ];
        for (const events of chains) {
            expect(() => deriveRivalryState(events)).toThrow(InvalidRivalryTransitionError);
            expect(() => deriveRivalryStateLenient(events)).not.toThrow();
            expect(deriveRivalryStateLenient(events).state).not.toBeNull();
        }
    });

    /* Writers must keep the guard. If the lenient function ever replaced the
       strict one on append, the ledger stops being able to reject a bad
       transition at all. */
    it('leaves the strict derivation strict', () => {
        const events = chain(
            RivalryEventType.RIVALRY_CREATED,
            RivalryEventType.RIVALRY_SETTLED,
        );
        expect(() => deriveRivalryState(events)).toThrow(InvalidRivalryTransitionError);
    });
});
