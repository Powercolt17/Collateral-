/**
 * Contract Quote Routes
 *
 * POST /v1/contracts/quote - Get pricing quote for a contract
 * GET  /v1/contracts/terms-preview - The terms the write path WILL apply
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { calculateQuote, validateQuoteInput } from '../services/contract-calculator.js';
import {
    PAYOUT_MULTIPLIERS,
    STAKE_CAPS,
    SYSTEM_DURATIONS,
    GROWTH_TARGETS,
    type RiskTier,
} from '../services/house-edge-policy.js';
import {
    suggestIncomeTerms,
    RISK_TIER_TO_INCOME_TIER,
} from '../services/income-terms.js';
import { getSelectedStreamDeposits } from '../adapters/plaid-income.js';

const RISK_TIERS: RiskTier[] = ['STANDARD', 'ADVANCED', 'ELITE'];
const TIER_LABEL: Record<RiskTier, string> = {
    STANDARD: 'Pledge',
    ADVANCED: 'Stake',
    ELITE: 'All In',
};

async function quoteRoutes(fastify: FastifyInstance) {
    /**
     * GET /v1/contracts/terms-preview?platform=PLAID
     *
     * WHY THIS EXISTS: the contract builder has to show a multiplier and a
     * payout BEFORE the contract is written, and POST /v1/contracts
     * system-calculates both and ignores anything the client sends. Without a
     * read of the same policy, a builder can only guess — and a guessed
     * multiplier printed next to "priced from your verified record" is the one
     * number on the page that must never be invented.
     *
     * It calls the SAME functions the write path calls, so what is quoted here
     * is what will be applied there:
     *   PLAID  -> suggestIncomeTerms() over the user's own deposit history
     *   others -> the fixed tier policy (PAYOUT_MULTIPLIERS / GROWTH_TARGETS)
     *
     * Read-only, and it writes nothing. When the history cannot be read it says
     * so with a code rather than returning a plausible default.
     */
    fastify.get<{ Querystring: { platform?: string } }>(
        '/v1/contracts/terms-preview',
        {
            preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
                if (!request.userId) {
                    return reply.status(401).send({ ok: false, code: 'AUTH_REQUIRED', error: 'Authentication required' });
                }
            },
        },
        async (request, reply) => {
            const platform = String((request.query as any)?.platform || '').toUpperCase();
            if (!platform) {
                return reply.status(400).send({ ok: false, code: 'PLATFORM_REQUIRED', error: 'platform is required' });
            }

            // ---- Bank income: priced off this operator's own trailing months.
            if (platform === 'PLAID') {
                let suggestion;
                try {
                    const { deposits, cadence, lastDepositDate } =
                        await getSelectedStreamDeposits(request.userId as string);
                    suggestion = suggestIncomeTerms(deposits, cadence, lastDepositDate);
                } catch (err: any) {
                    // An honest "not yet", not a fallback price.
                    return reply.status(200).send({
                        ok: false,
                        code: 'INCOME_HISTORY_UNAVAILABLE',
                        error: err?.message || 'Could not read income history',
                    });
                }

                const median = suggestion.medianMonthCents;
                const tiers = RISK_TIERS.map((riskTier) => {
                    const q = suggestion.tiers.find(t => t.tier === RISK_TIER_TO_INCOME_TIER[riskTier]);
                    return {
                        riskTier,
                        label: TIER_LABEL[riskTier],
                        // The income target is an ABSOLUTE figure at a percentile of
                        // their own months, not a growth rate over a baseline. The
                        // percentage is reported as what it is: distance above the
                        // median month, so the builder can show either.
                        targetCents: q ? q.targetCents : null,
                        growthPct: q && median > 0
                            ? Math.round(((q.targetCents - median) / median) * 100)
                            : null,
                        payoutMultiplier: q ? q.payoutMultiplier : null,
                        windowDays: SYSTEM_DURATIONS[riskTier].days,
                        minStakeUsdCents: q ? q.minStakeUsdCents : STAKE_CAPS[riskTier].minUsdCents,
                        maxStakeUsdCents: q
                            ? (q.maxAllowableStakeUsdCents ?? STAKE_CAPS[riskTier].maxUsdCents)
                            : STAKE_CAPS[riskTier].maxUsdCents,
                        available: q ? q.available : false,
                        unavailableReason: q ? q.unavailableReason : 'Not priced for this history',
                    };
                });

                return reply.status(200).send({
                    ok: true,
                    platform,
                    pricedFromHistory: true,
                    monthsAnalyzed: suggestion.monthsAnalyzed,
                    medianMonthCents: suggestion.medianMonthCents,
                    suggestedDeadlineUtc: suggestion.suggestedDeadlineUtc,
                    tiers,
                });
            }

            // ---- Every other platform keeps the fixed tier policy.
            return reply.status(200).send({
                ok: true,
                platform,
                pricedFromHistory: false,
                tiers: RISK_TIERS.map((riskTier) => ({
                    riskTier,
                    label: TIER_LABEL[riskTier],
                    targetCents: null,
                    growthPct: Math.round(GROWTH_TARGETS[riskTier].percentage * 100),
                    payoutMultiplier: PAYOUT_MULTIPLIERS[riskTier],
                    windowDays: SYSTEM_DURATIONS[riskTier].days,
                    minStakeUsdCents: STAKE_CAPS[riskTier].minUsdCents,
                    maxStakeUsdCents: STAKE_CAPS[riskTier].maxUsdCents,
                    available: true,
                })),
            });
        }
    );


    /**
     * POST /v1/contracts/quote
     * 
     * Calculate contract threshold based on baseline, tier, and window.
     * Returns deterministic quote with full explanation for audit.
     * 
     * Auth: Requires logged-in user (to prevent abuse/scraping)
     */
    fastify.post(
        '/v1/contracts/quote',
        {
            preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
                if (!request.userId) {
                    return reply.status(401).send({ ok: false, code: 'AUTH_REQUIRED', error: 'Authentication required' });
                }
            },
        },
        async (request, reply) => {
            try {
                const body = request.body as Record<string, unknown>;

                // Pre-validation: Explicit minWindow check for clearer error
                const platform = body?.platform as string;
                const windowDays = typeof body?.windowDays === 'number' ? body.windowDays : 30;

                if (platform === 'STRIPE' && windowDays < 14) {
                    return reply.status(400).send({
                        ok: false,
                        code: 'WINDOW_TOO_SHORT',
                        error: `Minimum windowDays for STRIPE is 14. Got ${windowDays}.`,
                    });
                }
                if (platform === 'X' && windowDays < 14) {
                    return reply.status(400).send({
                        ok: false,
                        code: 'WINDOW_TOO_SHORT',
                        error: `Minimum windowDays for X is 14. Got ${windowDays}.`,
                    });
                }

                const input = validateQuoteInput(request.body);
                const quote = calculateQuote(input);

                return reply.status(200).send({
                    ok: true,
                    message: 'Quote calculated',
                    ...quote,
                });
            } catch (err) {
                const error = err as Error;
                return reply.status(400).send({
                    ok: false,
                    code: 'INVALID_QUOTE_INPUT',
                    error: error.message,
                });
            }
        }
    );

    /**
     * GET /v1/contracts/quote/tiers
     * 
     * Returns tier configuration for UI display
     */
    fastify.get(
        '/v1/contracts/quote/tiers',
        async (_request, reply) => {
            return reply.status(200).send({
                tiers: [
                    {
                        tier: 'STANDARD',
                        label: 'Pledge',
                        targetWinRate: 0.30,
                        failRate: '70%',
                        description: 'Looks achievable — 70% fail',
                        payoutMultiplier: 1.75,
                    },
                    {
                        tier: 'ADVANCED',
                        label: 'Stake',
                        targetWinRate: 0.20,
                        failRate: '80%',
                        description: 'Brutal grind — 80% fail',
                        payoutMultiplier: 2.5,
                    },
                    {
                        tier: 'ELITE',
                        label: 'All In',
                        targetWinRate: 0.10,
                        failRate: '90%',
                        description: 'Near impossible — 90% fail',
                        payoutMultiplier: 4.0,
                    },
                ],
            });
        }
    );
}

export default quoteRoutes;
