/**
 * Plaid income stream detection — grouping regression tests.
 *
 * These lock down the B2 fix: processor payouts carry a unique reference on every
 * deposit, and an earlier normaliser that stripped only pure-digit runs left the
 * alphanumeric remainder behind ("ST A B C D E"). That fragmented one real Stripe
 * stream into four, which would have produced a baseline built from a quarter of
 * the user's income.
 */

import { describe, it, expect } from 'vitest';
import {
    normalizeDescription,
    streamGroupingBasis,
    computeStreamId,
    detectIncomeStreams,
    filterToStream,
    isInternalTransfer,
    type PlaidIncomeTransaction,
} from '../src/adapters/plaid-income.js';

const STRIPE_DESCRIPTORS = [
    'STRIPE TRANSFER ST-A1B2C3D4E5',
    'STRIPE TRANSFER ST-F6G7H8J9K0',
    'STRIPE TRANSFER ST-L1M2N3P4Q5',
    'STRIPE TRANSFER ST-R6S7T8V9W0',
];
const SHOPIFY_DESCRIPTORS = [
    'SHOPIFY PAYOUTS 8827361',
    'SHOPIFY PAYOUTS 8829114',
    'SHOPIFY PAYOUTS 8831902',
];
const PAYROLL_DESCRIPTORS = [
    'ACME CORP PAYROLL DIRECT DEP 991001',
    'ACME CORP PAYROLL DIRECT DEP 991044',
    'ACME CORP PAYROLL DIRECT DEP 991098',
];

function txn(
    description: string,
    merchantName: string | null,
    amountCents: number,
    date: string,
    id: string
): PlaidIncomeTransaction {
    return {
        transactionId: id,
        accountId: 'acct-1',
        amountCents,
        currency: 'USD',
        date,
        description,
        merchantName,
        pending: false,
    };
}

/** 12 months of deposits cycling through the given descriptors. */
function twelveMonths(
    descriptors: string[],
    merchantName: string | null,
    cents: number,
    idPrefix: string
): PlaidIncomeTransaction[] {
    return Array.from({ length: 12 }, (_, m) =>
        txn(
            descriptors[m % descriptors.length],
            merchantName,
            cents,
            `2025-${String(m + 1).padStart(2, '0')}-06`,
            `${idPrefix}${m}`
        )
    );
}

describe('normalizeDescription', () => {
    it('collapses alphanumeric per-payout references (the Stripe fragmentation bug)', () => {
        const keys = new Set(STRIPE_DESCRIPTORS.map(normalizeDescription));
        expect(keys.size).toBe(1);
    });

    it('collapses pure-digit references', () => {
        expect(new Set(SHOPIFY_DESCRIPTORS.map(normalizeDescription)).size).toBe(1);
        expect(normalizeDescription(SHOPIFY_DESCRIPTORS[0])).toBe('SHOPIFY PAYOUTS');
    });

    it('strips ACH boilerplate but keeps the payer', () => {
        expect(normalizeDescription(PAYROLL_DESCRIPTORS[0])).toBe('ACME CORP PAYROLL');
        expect(new Set(PAYROLL_DESCRIPTORS.map(normalizeDescription)).size).toBe(1);
    });

    it('keeps distinct payers distinct', () => {
        expect(normalizeDescription('ACME CORP PAYROLL DIRECT DEP 991001'))
            .not.toBe(normalizeDescription('GLOBEX INC PAYROLL DIRECT DEP 771001'));
    });

    it('strips masked account tokens', () => {
        expect(normalizeDescription('ACME PAYROLL XXXX1234')).toBe('ACME PAYROLL');
    });
});

describe('streamGroupingBasis', () => {
    it('prefers merchantName when Plaid enriches it', () => {
        expect(streamGroupingBasis('STRIPE TRANSFER ST-AAA111', 'Stripe')).toBe('M:STRIPE');
    });

    it('falls back to the normalised descriptor when merchantName is absent', () => {
        expect(streamGroupingBasis('SHOPIFY PAYOUTS 8827361', null)).toBe('D:SHOPIFY PAYOUTS');
    });

    it('cannot collide a merchant name with a descriptor key', () => {
        expect(streamGroupingBasis('X', 'SHOPIFY PAYOUTS'))
            .not.toBe(streamGroupingBasis('SHOPIFY PAYOUTS 1', null));
    });
});

describe('detectIncomeStreams — Case A: enriched Stripe payouts', () => {
    const deposits = twelveMonths(STRIPE_DESCRIPTORS, 'Stripe', 480000, 'a');

    it('collapses the fragmented fixture to EXACTLY ONE stream', () => {
        expect(detectIncomeStreams(deposits)).toHaveLength(1);
    });

    it('keeps all 12 deposits and the full amount in that stream', () => {
        const [stream] = detectIncomeStreams(deposits);
        expect(stream.depositCount).toBe(12);
        expect(stream.totalCents).toBe(12 * 480000);
    });

    it('re-resolves the same stream by frozen id (settlement path)', () => {
        const [stream] = detectIncomeStreams(deposits);
        expect(filterToStream(deposits, stream.streamId)).toHaveLength(12);
    });
});

describe('detectIncomeStreams — Case B: raw descriptors, no merchant enrichment', () => {
    const deposits = [
        ...twelveMonths(STRIPE_DESCRIPTORS, null, 480000, 'b'),
        ...twelveMonths(SHOPIFY_DESCRIPTORS, null, 310000, 'c'),
    ];

    it('yields exactly two streams — Stripe and Shopify stay separate', () => {
        expect(detectIncomeStreams(deposits)).toHaveLength(2);
    });

    it('gives each stream all 12 of its own deposits', () => {
        for (const stream of detectIncomeStreams(deposits)) {
            expect(stream.depositCount).toBe(12);
        }
    });
});

describe('grouping — known v1 over-merge behaviour', () => {
    it('MERGES two sources sharing one processor (documented, not accidental)', () => {
        // Two businesses paid through the same Stripe account both report
        // merchant "Stripe", so they group together. Acceptable for v1 because
        // the user explicitly selects their stream.
        const ids = new Set([
            computeStreamId(streamGroupingBasis('STRIPE TRANSFER ST-AAA111', 'Stripe')),
            computeStreamId(streamGroupingBasis('STRIPE TRANSFER ST-BBB222', 'Stripe')),
        ]);
        expect(ids.size).toBe(1);
    });

    it('keeps distinct merchants separate', () => {
        const ids = new Set([
            computeStreamId(streamGroupingBasis('STRIPE TRANSFER ST-AAA111', 'Stripe')),
            computeStreamId(streamGroupingBasis('SHOPIFY PAYOUTS 111', 'Shopify')),
        ]);
        expect(ids.size).toBe(2);
    });
});

describe('detectIncomeStreams — exclusions', () => {
    it('excludes internal transfers from streams', () => {
        const deposits = [
            ...twelveMonths(PAYROLL_DESCRIPTORS, 'ACME CORP', 200000, 'd'),
            txn('ONLINE TRANSFER FROM SAVINGS', null, 500000, '2025-03-10', 'x1'),
            txn('ONLINE TRANSFER FROM SAVINGS', null, 500000, '2025-04-10', 'x2'),
            txn('ONLINE TRANSFER FROM SAVINGS', null, 500000, '2025-05-10', 'x3'),
        ];
        expect(isInternalTransfer('ONLINE TRANSFER FROM SAVINGS')).toBe(true);
        const labels = detectIncomeStreams(deposits).map(s => s.label);
        expect(labels.some(l => l.includes('SAVINGS'))).toBe(false);
    });

    it('drops groups below the recurring-deposit minimum', () => {
        const deposits = [
            txn('ONE OFF CONSULTING', 'ONE OFF', 100000, '2025-01-05', 'y1'),
            txn('ONE OFF CONSULTING', 'ONE OFF', 100000, '2025-02-05', 'y2'),
        ];
        expect(detectIncomeStreams(deposits)).toHaveLength(0);
    });
});
