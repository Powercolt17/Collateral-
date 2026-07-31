/**
 * Income Contract Terms Engine
 *
 * Produces auto-suggested, cut-throat-but-honest terms for BANK INCOME contracts:
 * deadline, three difficulty tiers, data-derived payout multipliers, and a
 * per-tier tunable house edge.
 *
 * SCOPE: income (Plaid) contracts ONLY.
 * The existing house-edge-policy.ts uses FIXED payout multipliers (1.7/2.5/4.0)
 * and explicitly documents "payout multipliers are FIXED and NEVER adjust
 * dynamically". This module deliberately does NOT touch that policy — other
 * platforms keep their fixed multipliers. Income contracts price off the user's
 * own track record instead.
 *
 * MEASUREMENT: income RECEIVED by a date (deposits dated on/before the deadline).
 * Never "sales made", "deals closed", or "commission earned" — the bank can only
 * prove that money arrived.
 *
 * THE HONESTY LINE (non-negotiable):
 * The edge comes from people overestimating themselves, never from rigging terms.
 * Every suggested target must be a number the user's own history shows is
 * beatable. A bet that cannot be won is fraud, not a business model.
 */

import type { PlaidCadence } from '../adapters/plaid-income.js';
import { STAKE_CAPS, MAX_SINGLE_CONTRACT_POOL_PCT } from './house-edge-policy.js';

// =============================================================================
// TIERS
// =============================================================================

export type IncomeTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

/** Map onto the existing DB risk_tier enum so income contracts persist normally. */
export const INCOME_TIER_TO_RISK_TIER: Record<IncomeTier, 'STANDARD' | 'ADVANCED' | 'ELITE'> = {
    TIER_1: 'STANDARD',
    TIER_2: 'ADVANCED',
    TIER_3: 'ELITE',
};

/** Reverse of INCOME_TIER_TO_RISK_TIER — the API speaks risk_tier. */
export const RISK_TIER_TO_INCOME_TIER: Record<'STANDARD' | 'ADVANCED' | 'ELITE', IncomeTier> = {
    STANDARD: 'TIER_1',
    ADVANCED: 'TIER_2',
    ELITE: 'TIER_3',
};

/** Target percentile of the user's own trailing monthly history. */
export const TIER_PERCENTILE: Record<IncomeTier, number> = {
    TIER_1: 0.60,  // above their median — already a losing coin-flip
    TIER_2: 0.75,  // a genuinely strong month
    TIER_3: 0.90,  // their ceiling (capped strictly below their best month)
};

// =============================================================================
// HOUSE EDGE — per-tier, tunable via env (NEVER hardcoded at call sites)
// =============================================================================

/** Defaults if env is unset. Graduated 25→26→27: keep the gateway bet attractive. */
export const HOUSE_EDGE_DEFAULTS: Record<IncomeTier, number> = {
    TIER_1: 0.25,
    TIER_2: 0.26,
    TIER_3: 0.27,
};

const HOUSE_EDGE_ENV_KEYS: Record<IncomeTier, string> = {
    TIER_1: 'HOUSE_EDGE_T1',
    TIER_2: 'HOUSE_EDGE_T2',
    TIER_3: 'HOUSE_EDGE_T3',
};

/** Sanity band — a value outside this is treated as a misconfiguration. */
export const HOUSE_EDGE_MIN = 0.0;
export const HOUSE_EDGE_MAX = 0.60;

/**
 * Read the house edge for a tier from env, falling back to the default.
 *
 * Read at CALL TIME (not module load) so the dial can be turned without a
 * redeploy. Invalid or out-of-band values fall back to the default rather than
 * silently pricing contracts off a typo.
 */
export function getHouseEdge(tier: IncomeTier): number {
    const raw = process.env[HOUSE_EDGE_ENV_KEYS[tier]];
    if (raw === undefined || raw === '') return HOUSE_EDGE_DEFAULTS[tier];

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < HOUSE_EDGE_MIN || parsed > HOUSE_EDGE_MAX) {
        console.warn(
            `[IncomeTerms] Ignoring invalid ${HOUSE_EDGE_ENV_KEYS[tier]}="${raw}" ` +
            `(expected ${HOUSE_EDGE_MIN}–${HOUSE_EDGE_MAX}); using default ${HOUSE_EDGE_DEFAULTS[tier]}`
        );
        return HOUSE_EDGE_DEFAULTS[tier];
    }
    return parsed;
}

// =============================================================================
// GUARDRAIL CONSTANTS
// =============================================================================

/**
 * Minimum months of stream history before ANY tier can be priced.
 *
 * All tiers require 6 months, matching the Plaid adapter's 180-day baseline
 * floor (PLAID_MIN_HISTORY_DAYS). A lower gate here would be dead code: the
 * baseline snapshot throws before terms are ever quoted.
 */
export const MIN_MONTHS_FOR_TIER_1 = 6;
export const MIN_MONTHS_FOR_TIER_2_3 = 6;

/** Stops multipliers spiking to 20× on a single lucky month. */
export const MIN_HIT_RATE = 0.05;

/**
 * MAX PAYOUT MULTIPLIER — a deliberate dial, not an artifact.
 *
 * Without this, the top payout is whatever the MIN_HIT_RATE floor happens to
 * produce (0.05 → up to 15×), which is an accident of the floor rather than a
 * chosen exposure limit. Tunable via env so the ceiling can move without a deploy.
 */
export const MAX_MULTIPLIER_DEFAULT = 10;
export const MAX_MULTIPLIER_ENV_KEY = 'INCOME_MAX_MULTIPLIER';
export const MAX_MULTIPLIER_MIN = 1.01;
export const MAX_MULTIPLIER_MAX = 50;

export function getMaxMultiplier(): number {
    const raw = process.env[MAX_MULTIPLIER_ENV_KEY];
    if (raw === undefined || raw === '') return MAX_MULTIPLIER_DEFAULT;

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < MAX_MULTIPLIER_MIN || parsed > MAX_MULTIPLIER_MAX) {
        console.warn(
            `[IncomeTerms] Ignoring invalid ${MAX_MULTIPLIER_ENV_KEY}="${raw}" ` +
            `(expected ${MAX_MULTIPLIER_MIN}–${MAX_MULTIPLIER_MAX}); using default ${MAX_MULTIPLIER_DEFAULT}`
        );
        return MAX_MULTIPLIER_DEFAULT;
    }
    return parsed;
}

/** Posting buffer added to the projected pay date (days). */
export const DEFAULT_POSTING_BUFFER_DAYS = 3;
export const MIN_POSTING_BUFFER_DAYS = 3;
export const MAX_POSTING_BUFFER_DAYS = 7;

/** Targets round UP to a clean number so the line reads like a real number. */
export const TARGET_ROUNDING_CENTS = 10_000; // $100

// =============================================================================
// TYPES
// =============================================================================

export interface MonthlyIncome {
    month: string;      // YYYY-MM
    totalCents: number;
}

export interface TierQuote {
    tier: IncomeTier;
    riskTier: 'STANDARD' | 'ADVANCED' | 'ELITE';
    /** Income the user must EXCEED (strictly) by the deadline. */
    targetCents: number;
    percentile: number;
    /** Fraction of historical months that strictly exceeded targetCents. */
    hitRate: number;
    /** Raw hit rate before the MIN_HIT_RATE floor (for audit). */
    rawHitRate: number;
    houseEdge: number;
    payoutMultiplier: number;
    /** Ceiling applied to payoutMultiplier (env-tunable). */
    maxMultiplierCap: number;
    /** True if the raw derived multiplier was clipped by the cap. */
    multiplierCapped: boolean;
    /**
     * Largest stake this tier can accept right now, from
     * (pool × cap%) / multiplier, bounded by the tier's own stake cap.
     * Present only when a pool balance was supplied.
     */
    maxAllowableStakeUsdCents?: number;
    minStakeUsdCents: number;
    /** Months in history that beat this target — proof it is reachable. */
    monthsBeaten: number;
    monthsAnalyzed: number;
    available: boolean;
    unavailableReason?: string;
}

export interface IncomeTermsSuggestion {
    /** The user's own history — REQUIRED in the UI next to the target. */
    monthlyHistory: MonthlyIncome[];
    monthsAnalyzed: number;
    medianMonthCents: number;
    bestMonthCents: number;
    /** Auto-suggested deadline derived from detected pay cadence. */
    suggestedDeadlineUtc: string;
    projectedPayDateUtc: string;
    postingBufferDays: number;
    cadence: PlaidCadence;
    tiers: TierQuote[];
}

// =============================================================================
// 1. PERCENTILE CALC
// =============================================================================

/**
 * Nearest-rank percentile.
 *
 * Chosen deliberately over interpolation: nearest-rank always returns a value
 * the user ACTUALLY earned in some month. An interpolated percentile can invent
 * a number between two months that they never reached — which is exactly the
 * rigged-target failure the spec forbids.
 *
 * @param p percentile in [0,1]
 */
export function percentileNearestRank(valuesCents: number[], p: number): number {
    if (valuesCents.length === 0) return 0;
    const sorted = [...valuesCents].sort((a, b) => a - b);
    const rank = Math.ceil(p * sorted.length);
    const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
    return sorted[index];
}

export function medianCents(valuesCents: number[]): number {
    if (valuesCents.length === 0) return 0;
    const sorted = [...valuesCents].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Round UP to a clean number so the target reads like a real line. */
export function roundUpToClean(cents: number, step: number = TARGET_ROUNDING_CENTS): number {
    if (cents <= 0) return 0;
    return Math.ceil(cents / step) * step;
}

/**
 * THE HARD GUARDRAIL.
 *
 * Settlement requires income to STRICTLY EXCEED the target, so the target must
 * sit strictly BELOW a month the user actually achieved — otherwise winning
 * would require beating their all-time best, a number they have never reached.
 *
 * Capping "at their best month" while settling on `>` would make the top tier
 * unwinnable by their own history AND (because no month beats it) drive the hit
 * rate to zero and the multiplier to its ceiling — the biggest advertised payout
 * on the least winnable bet. That is the rigged line. This function prevents it.
 *
 * @returns a target strictly less than bestMonth, or null if no such target exists
 */
export function capTargetBelowBest(targetCents: number, monthlyCents: number[]): number | null {
    if (monthlyCents.length === 0) return null;
    const best = Math.max(...monthlyCents);

    if (targetCents < best) return targetCents;

    // Step down to the largest clean number strictly below their best month.
    const stepped = roundUpToClean(best, TARGET_ROUNDING_CENTS) - TARGET_ROUNDING_CENTS;
    const candidate = Math.min(stepped, best - 1);

    // Must still be beaten by at least one real month
    if (candidate <= 0 || candidate >= best) return null;
    return candidate;
}

// =============================================================================
// 2. PAYOUT FORMULA
// =============================================================================

/**
 * Hit rate = fraction of historical months that STRICTLY EXCEEDED the target.
 *
 * Uses `>` — the same comparator settlement uses. Computing it with `>=` (as a
 * naive reading suggests) would overstate how often they win, understate 1/hitRate,
 * and quote a multiplier that does not match the bet actually being offered.
 * The comparator here and at settlement must never diverge.
 *
 * MUST be called with the FINAL rounded target, not the raw percentile, for the
 * same reason.
 */
export function computeHitRate(monthlyCents: number[], targetCents: number): number {
    if (monthlyCents.length === 0) return 0;
    const beaten = monthlyCents.filter(v => v > targetCents).length;
    return beaten / monthlyCents.length;
}

/**
 * payoutMultiplier = (1 / hitRate) × (1 − houseEdge)
 *
 * Fair odds are 1/hitRate; we pay less than fair and the gap is the edge.
 * Because harder tiers have lower hit rates, multipliers escalate automatically —
 * no number is hand-picked, so the line is defensible if anyone asks how it was set.
 */
export function computePayoutMultiplier(hitRate: number, houseEdge: number): number {
    const flooredHitRate = Math.max(MIN_HIT_RATE, hitRate);
    const fairOdds = 1 / flooredHitRate;
    const multiplier = fairOdds * (1 - houseEdge);
    // Ceiling is a chosen exposure limit, not whatever MIN_HIT_RATE happens to yield
    const capped = Math.min(multiplier, getMaxMultiplier());
    return Math.round(capped * 100) / 100;
}

/**
 * Payout for an income contract: stake × the DERIVED multiplier.
 *
 * Income contracts price off the user's own track record, so this replaces
 * house-edge-policy's fixed calculatePayout() for this rail only. The result is
 * written once into contracts.payoutAmountUsdCents at creation — settlement
 * reads that precommitted column and never recomputes tier math.
 */
export function calculateIncomePayout(stakeUsdCents: number, multiplier: number): number {
    return Math.round(stakeUsdCents * multiplier);
}

/**
 * MAX ALLOWABLE STAKE — computed UP FRONT, surfaced as a ceiling.
 *
 * The pool rule is that a single contract's potential payout may not exceed
 * MAX_SINGLE_CONTRACT_POOL_PCT of the pool. Rather than letting a user pick a
 * stake and then rejecting it after the fact, we invert the constraint:
 *
 *     maxStake = (pool × poolCapPct) / multiplier
 *
 * and return it with the quote so the UI can bound the input.
 *
 * @param poolBalanceUsdCents current pool balance
 * @param multiplier this tier's payout multiplier (already capped)
 * @param tierMaxStakeUsdCents the tier's own hard stake cap
 */
export function computeMaxAllowableStake(
    poolBalanceUsdCents: number,
    multiplier: number,
    tierMaxStakeUsdCents: number,
    poolCapPct: number = MAX_SINGLE_CONTRACT_POOL_PCT
): number {
    if (multiplier <= 0 || poolBalanceUsdCents <= 0) return 0;
    const maxSingleExposure = poolBalanceUsdCents * poolCapPct;
    const poolBoundStake = Math.floor(maxSingleExposure / multiplier);
    return Math.max(0, Math.min(tierMaxStakeUsdCents, poolBoundStake));
}

/**
 * Multipliers must strictly increase T1 < T2 < T3.
 *
 * On short histories, rounding can collapse two tiers onto the same target and
 * therefore the same multiplier — or even invert them. A higher tier that pays
 * the same or less than a lower one is indefensible, so we nudge upward.
 */
export function enforceMonotonicMultipliers(quotes: TierQuote[]): TierQuote[] {
    const order: IncomeTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
    const byTier = new Map(quotes.map(q => [q.tier, { ...q }]));

    let previous: number | null = null;
    for (const tier of order) {
        const quote = byTier.get(tier);
        if (!quote || !quote.available) continue;

        if (previous !== null && quote.payoutMultiplier <= previous) {
            quote.payoutMultiplier = Math.round((previous + 0.05) * 100) / 100;
        }
        previous = quote.payoutMultiplier;
    }

    return order.map(t => byTier.get(t)!).filter(Boolean);
}

// =============================================================================
// 3. MIN-HISTORY GATING
// =============================================================================

/**
 * Thin history has no real percentiles. Tier 2 and Tier 3 stay locked until the
 * user has enough months for their percentiles to mean anything.
 */
export function isTierAvailable(
    tier: IncomeTier,
    monthsAnalyzed: number
): { available: boolean; reason?: string } {
    const required = tier === 'TIER_1' ? MIN_MONTHS_FOR_TIER_1 : MIN_MONTHS_FOR_TIER_2_3;

    if (monthsAnalyzed < required) {
        return {
            available: false,
            reason: `Needs ${required} months of income history to price this tier. You have ${monthsAnalyzed}.`,
        };
    }
    return { available: true };
}

// =============================================================================
// 4. DEADLINE PROJECTION
// =============================================================================

export function resolvePostingBufferDays(requested?: number): number {
    if (requested === undefined || Number.isNaN(requested)) return DEFAULT_POSTING_BUFFER_DAYS;
    return Math.min(MAX_POSTING_BUFFER_DAYS, Math.max(MIN_POSTING_BUFFER_DAYS, Math.floor(requested)));
}

/** Project the next expected deposit date from the detected cadence. */
export function projectNextPayDate(lastDepositDate: string, cadence: PlaidCadence): Date {
    const last = new Date(`${lastDepositDate}T00:00:00.000Z`);
    const next = new Date(last);

    switch (cadence) {
        case 'WEEKLY': next.setUTCDate(next.getUTCDate() + 7); break;
        case 'BIWEEKLY': next.setUTCDate(next.getUTCDate() + 14); break;
        case 'SEMIMONTHLY': next.setUTCDate(next.getUTCDate() + 15); break;
        case 'MONTHLY': next.setUTCMonth(next.getUTCMonth() + 1); break;
        default: next.setUTCMonth(next.getUTCMonth() + 1); break;
    }
    return next;
}

/**
 * Suggested deadline = next expected pay date + posting buffer.
 * Tight by design: the buffer covers bank posting lag only, never pay lag.
 */
export function suggestDeadline(
    lastDepositDate: string,
    cadence: PlaidCadence,
    bufferDays?: number
): { deadlineUtc: Date; projectedPayDate: Date; bufferDays: number } {
    const buffer = resolvePostingBufferDays(bufferDays);
    const projectedPayDate = projectNextPayDate(lastDepositDate, cadence);
    const deadlineUtc = new Date(projectedPayDate);
    deadlineUtc.setUTCDate(deadlineUtc.getUTCDate() + buffer);
    return { deadlineUtc, projectedPayDate, bufferDays: buffer };
}

// =============================================================================
// TERMS ASSEMBLY
// =============================================================================

/** Bucket a stream's deposits into per-calendar-month totals. */
export function toMonthlyIncome(
    deposits: { date: string; amountCents: number }[]
): MonthlyIncome[] {
    const byMonth = new Map<string, number>();
    for (const d of deposits) {
        const key = d.date.slice(0, 7);
        byMonth.set(key, (byMonth.get(key) || 0) + d.amountCents);
    }
    return [...byMonth.entries()]
        .map(([month, totalCents]) => ({ month, totalCents }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

/** Build one tier's quote. */
export function quoteTier(
    tier: IncomeTier,
    monthlyCents: number[],
    poolBalanceUsdCents?: number
): TierQuote {
    const monthsAnalyzed = monthlyCents.length;
    const percentile = TIER_PERCENTILE[tier];
    const houseEdge = getHouseEdge(tier);
    const riskTier = INCOME_TIER_TO_RISK_TIER[tier];
    const maxMultiplierCap = getMaxMultiplier();
    const stakeCaps = STAKE_CAPS[riskTier];

    const unavailable = (reason: string): TierQuote => ({
        tier, riskTier, targetCents: 0, percentile,
        hitRate: 0, rawHitRate: 0, houseEdge, payoutMultiplier: 0,
        maxMultiplierCap, multiplierCapped: false,
        minStakeUsdCents: stakeCaps.minUsdCents,
        monthsBeaten: 0, monthsAnalyzed,
        available: false, unavailableReason: reason,
    });

    const gate = isTierAvailable(tier, monthsAnalyzed);
    if (!gate.available) return unavailable(gate.reason!);

    // Percentile → round UP → enforce the reachability guardrail
    const raw = percentileNearestRank(monthlyCents, percentile);
    const rounded = roundUpToClean(raw);
    const capped = capTargetBelowBest(rounded, monthlyCents);

    if (capped === null) {
        return unavailable('Income history too flat to set a target this tier could beat.');
    }

    // Hit rate is computed on the FINAL target with the SAME comparator settlement uses
    const rawHitRate = computeHitRate(monthlyCents, capped);
    const hitRate = Math.max(MIN_HIT_RATE, rawHitRate);
    const monthsBeaten = monthlyCents.filter(v => v > capped).length;

    const payoutMultiplier = computePayoutMultiplier(rawHitRate, houseEdge);
    const uncappedMultiplier = (1 / hitRate) * (1 - houseEdge);

    return {
        tier,
        riskTier,
        targetCents: capped,
        percentile,
        hitRate,
        rawHitRate,
        houseEdge,
        payoutMultiplier,
        maxMultiplierCap,
        multiplierCapped: uncappedMultiplier > maxMultiplierCap,
        maxAllowableStakeUsdCents: poolBalanceUsdCents === undefined
            ? undefined
            : computeMaxAllowableStake(poolBalanceUsdCents, payoutMultiplier, stakeCaps.maxUsdCents),
        minStakeUsdCents: stakeCaps.minUsdCents,
        monthsBeaten,
        monthsAnalyzed,
        available: true,
    };
}

/**
 * Full auto-suggested terms for an income contract.
 *
 * Returns the user's own monthly history alongside the tiers — the UI is
 * REQUIRED to show it next to the target. Being savage and transparent is what
 * kills the "you tricked me" complaint before it starts.
 */
export function suggestIncomeTerms(
    deposits: { date: string; amountCents: number }[],
    cadence: PlaidCadence,
    lastDepositDate: string,
    bufferDays?: number,
    poolBalanceUsdCents?: number
): IncomeTermsSuggestion {
    const monthlyHistory = toMonthlyIncome(deposits);
    const monthlyCents = monthlyHistory.map(m => m.totalCents);

    const { deadlineUtc, projectedPayDate, bufferDays: buffer } =
        suggestDeadline(lastDepositDate, cadence, bufferDays);

    const tiers = enforceMonotonicMultipliers([
        quoteTier('TIER_1', monthlyCents, poolBalanceUsdCents),
        quoteTier('TIER_2', monthlyCents, poolBalanceUsdCents),
        quoteTier('TIER_3', monthlyCents, poolBalanceUsdCents),
    ]);

    return {
        monthlyHistory,
        monthsAnalyzed: monthlyHistory.length,
        medianMonthCents: medianCents(monthlyCents),
        bestMonthCents: monthlyCents.length ? Math.max(...monthlyCents) : 0,
        suggestedDeadlineUtc: deadlineUtc.toISOString(),
        projectedPayDateUtc: projectedPayDate.toISOString(),
        postingBufferDays: buffer,
        cadence,
        tiers,
    };
}

/**
 * The immutable terms frozen into baselineJson at contract lock.
 * Everything needed to re-derive and defend the line after the fact.
 */
export interface FrozenIncomeTerms {
    tier: IncomeTier;
    riskTier: 'STANDARD' | 'ADVANCED' | 'ELITE';
    targetCents: number;
    percentile: number;
    hitRate: number;
    rawHitRate: number;
    houseEdgeUsed: number;
    payoutMultiplier: number;
    /** Ceiling in force when this contract was priced (env-tunable, so recorded). */
    maxMultiplierCap: number;
    multiplierCapped: boolean;
    postingBufferDays: number;

    // ── THE DISPUTE SURFACE ──
    // "When did the contract close?" is the argument that actually happens, so
    // both instants are frozen here and READ at settlement, never recomputed.
    // Recomputing deadline + buffer at settlement time would let a change to the
    // buffer — or a DST/timezone shift — silently move someone's closing date
    // after they signed. These are absolute UTC instants for that reason.
    /** Contract deadline, as agreed at lock. */
    deadlineUtc: string;
    /** The single moment settlement runs: deadlineUtc + postingBufferDays. */
    settlementDueUtc: string;
    /** Timestamps above are absolute UTC instants; no local-time reinterpretation. */
    timezone: 'UTC';

    monthsAnalyzed: number;
    monthsBeaten: number;
    monthlyHistory: MonthlyIncome[];
    comparator: 'GT';
    frozenAtUtc: string;
}

export function freezeIncomeTerms(
    quote: TierQuote,
    suggestion: IncomeTermsSuggestion,
    /** The contract's actual agreed deadline — not the suggestion. */
    deadlineUtc: Date,
    frozenAt: Date = new Date()
): FrozenIncomeTerms {
    const settlementDue = new Date(deadlineUtc);
    settlementDue.setUTCDate(settlementDue.getUTCDate() + suggestion.postingBufferDays);

    return {
        deadlineUtc: deadlineUtc.toISOString(),
        settlementDueUtc: settlementDue.toISOString(),
        timezone: 'UTC',
        tier: quote.tier,
        riskTier: quote.riskTier,
        targetCents: quote.targetCents,
        percentile: quote.percentile,
        hitRate: quote.hitRate,
        rawHitRate: quote.rawHitRate,
        houseEdgeUsed: quote.houseEdge,
        payoutMultiplier: quote.payoutMultiplier,
        maxMultiplierCap: quote.maxMultiplierCap,
        multiplierCapped: quote.multiplierCapped,
        postingBufferDays: suggestion.postingBufferDays,
        monthsAnalyzed: quote.monthsAnalyzed,
        monthsBeaten: quote.monthsBeaten,
        monthlyHistory: suggestion.monthlyHistory,
        comparator: 'GT',
        frozenAtUtc: frozenAt.toISOString(),
    };
}
