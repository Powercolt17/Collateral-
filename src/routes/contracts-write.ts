// @ts-nocheck
/**
 * Contract Write Routes
 * 
 * Write endpoints for contract lifecycle.
 * State is NEVER stored - derived from ledger events.
 * 
 * NON-NEGOTIABLE INVARIANTS (ENFORCED GLOBALLY):
 * - principalUserId MUST come only from auth middleware (NEVER from request body)
 * - Any userId/principalUserId/ownerId/actorId field in body is REJECTED with 400
 * - These are enforced by registerWriteRouteGuards() - individual routes cannot bypass
 * 
 * All write operations:
 * 1. Load ordered ledger events (timestampUtc, id)
 * 2. Derive current state
 * 3. Validate from-state allows the action
 * 4. Append ledger event(s)
 */

import { FastifyPluginAsync } from 'fastify';
import { createFundingIntent } from '../services/funding.js';
import { createContract, getContract, updateContractBaseline } from '../services/contracts.js';
import { settleContract } from '../services/settlement.js';
import { appendEvent, getEventsForContract } from '../services/ledger.js';
import { deriveState, validateFromState, InvalidTransitionError } from '../services/state-derivation.js';
import { ContractStatus, EventType, connectedAccounts } from '../db/schema.js';
import { getPrincipal, AuthError } from '../services/auth.js';
import { registerWriteRouteGuards } from '../invariants/auth-guards.js';
import { getBindingSnapshotForContract } from '../services/identity-bindings.js';
import { db } from '../db/client.js';
import { identities } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';
import {
    getXClient,
    XAdapterError,
} from '../adapters/x.js';
import {
    checkXEligibility,
    calculateDeltaFloor,
    validateDeltaFloor,
    type FrozenXBinding,
} from '../adapters/x-eligibility.js';
import {
    stripeRevenueAdapter,
    validateTierEligibility,
    STRIPE_ERROR_CODES,
    STRIPE_TIER_PERCENTAGES,
    type StripeV1BaselineJson,
} from '../adapters/stripe-revenue.js';
import {
    requireVerifiedConnection,
    PlatformNotVerifiedError,
} from '../services/require-verified-connection.js';
import {
    validateStake,
    calculatePayout,
    STAKE_CAPS,
    SYSTEM_DURATIONS,
    PAYOUT_MULTIPLIERS,
} from '../services/house-edge-policy.js';
import {
    suggestIncomeTerms,
    freezeIncomeTerms,
    calculateIncomePayout,
    RISK_TIER_TO_INCOME_TIER,
    type FrozenIncomeTerms,
} from '../services/income-terms.js';
import { getSelectedStreamDeposits } from '../adapters/plaid-income.js';

// =====================================================
// WRITE ENDPOINT EVENT TYPES (explicit canonical list)
// =====================================================
// POST /contracts              → CONTRACT_CREATED, BASELINE_SNAPSHOTTED
// POST /:id/funding-intent     → FUNDS_AUTHORIZED
// POST /v1/stripe/webhook      → FUNDS_LOCKED (via handlePaymentSuccess)
// POST /:id/execute            → EXECUTION_REQUESTED, EXECUTION_CONFIRMED

const contractWriteRoutes: FastifyPluginAsync = async (fastify) => {
    // =======================================================================
    // GLOBAL INVARIANT ENFORCEMENT (unbypassable)
    // =======================================================================
    // This ensures ALL routes in this plugin enforce:
    // - requireAuth (401 if missing token)
    // - assertNoUserIdFieldsDeep (400 if userId/etc in body)
    registerWriteRouteGuards(fastify);
    /**
     * POST /contracts
     * Create a new contract
     * 
     * REQUIRES AUTH: principalUserId from middleware
     * REJECTS: userId in body (spoof protection)
     * 
     * From-state: NULL (no contract exists)
     * Appends: CONTRACT_CREATED, BASELINE_SNAPSHOTTED (if baseline provided)
     * To-state: CREATED
     */
    fastify.post<{
        Body: {
            username?: string;  // Optional, will look up from identity
            platform: 'X' | 'STRIPE' | 'GITHUB' | 'YOUTUBE' | 'TIKTOK' | 'SHOPIFY';
            metricType: 'IMPRESSIONS' | 'FOLLOWERS' | 'REVENUE' | 'VIEWS' | 'SUBSCRIBERS' | 'COMMITS' | 'PRS_MERGED' | 'STARS_GAINED';
            condition: {
                operator: 'GTE' | 'GT' | 'LTE' | 'LT' | 'EQ';
                threshold: number;
                deadline: string;
            };
            baseline?: Record<string, unknown>;
            lockAmountUsdCents: number;
            // DEPRECATED: payoutAmountUsdCents is now SYSTEM-CALCULATED
            // Any user-provided value is IGNORED and overridden
            payoutAmountUsdCents?: number;
            fundingMethod?: 'USD_CARD' | 'USD_ACH' | 'CRYPTO';
            riskTier?: 'STANDARD' | 'ADVANCED' | 'ELITE';
        };
    }>('/v1/contracts', async (request, reply) => {
        console.log('[contracts-write] POST /v1/contracts - START');
        try {
            // Auth is enforced by global registerWriteRouteGuards() hook
            // userId fields in body are rejected by global assertNoUserIdFieldsDeep()
            const principalUserId = getPrincipal(request);
            console.log('[contracts-write] principalUserId:', principalUserId);

            // 0. ACCOUNT STATUS GUARD (Dispute Defense)
            // Block new contracts if identity is suspended (e.g. chargeback)
            const [identity] = await db.select().from(identities).where(eq(identities.userId, principalUserId));
            if (identity?.status === 'SUSPENDED') {
                reply.status(403);
                return { error: 'Account restricted due to dispute. Please contact support.' };
            }

            const {
                username: bodyUsername,
                platform,
                metricType,
                condition,
                baseline,
                lockAmountUsdCents,
                payoutAmountUsdCents,
                fundingMethod,
                riskTier
            } = request.body;
            console.log('[contracts-write] Body parsed, platform:', platform, 'metricType:', metricType);

            // =========================================================
            // ENFORCE VERIFIED CONNECTION - Fail-closed if not verified
            // Store result for username resolution
            // =========================================================
            let verifiedConnection: Awaited<ReturnType<typeof requireVerifiedConnection>> | null = null;

            if (platform === 'X' || platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') {
                try {
                    verifiedConnection = await requireVerifiedConnection(principalUserId, platform);
                    console.log(`[contracts-write] Verified ${platform} connection:`, verifiedConnection.externalAccountId);
                } catch (err) {
                    if (err instanceof PlatformNotVerifiedError) {
                        reply.status(err.status);
                        return {
                            code: err.code,
                            error: err.message,
                            platform: err.platform,
                        };
                    }
                    throw err;
                }
            }

            // Get username: body > identity > verified X metadata
            let username = bodyUsername;
            if (!username) {
                const [identity] = await db
                    .select()
                    .from(identities)
                    .where(eq(identities.userId, principalUserId))
                    .limit(1);

                if (identity) {
                    username = identity.username;
                } else if (platform === 'X' && verifiedConnection) {
                    // Use typed metadata from verified connection (no extra DB query)
                    username = (verifiedConnection.metadata as { resolvedUsername?: string }).resolvedUsername;
                }
            }

            if (!username) {
                reply.status(400);
                return { error: `No identity found. Please connect your ${platform} account first.` };
            }

            // Input validation
            if (!platform || !metricType || !condition || !lockAmountUsdCents) {
                reply.status(400);
                return { error: 'Missing required fields' };
            }

            // =========================================================
            // BASELINE REJECTION - X/STRIPE baseline frozen at execution, not creation
            // =========================================================
            if ((platform === 'X' || platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') && baseline) {
                reply.status(400);
                return {
                    code: 'BASELINE_NOT_ALLOWED_AT_CREATION',
                    error: `Baseline cannot be set at creation for ${platform}. Baseline is automatically frozen at execution.`,
                };
            }

            // =========================================================
            // HOUSE EDGE: SYSTEM-CONTROLLED TERMS
            // Users pick stake (within bounds). Everything else is system-set.
            // payoutAmountUsdCents is CALCULATED, never user-specified.
            // =========================================================
            const tier = riskTier || 'STANDARD';

            // 1. Validate stake against tier caps
            // ─────────────────────────────────────────────────────────────
            // PAYOUT DESTINATION GATE
            //
            // A user must be payable BEFORE capital locks, not after they win.
            // Discovering at settlement that there is nowhere to send the money
            // is the worst version of this: the contract is already won, the
            // outcome is already decided, and the user waits on onboarding they
            // were never asked to do. Block here instead, while nothing is at
            // stake yet.
            // ─────────────────────────────────────────────────────────────
            {
                const { getPayoutAdapter, resolveUserRail } = await import('../services/payout-adapters.js');
                const rail = await resolveUserRail(principalUserId);
                const dest = await getPayoutAdapter(rail).resolveDestination(principalUserId);
                if (dest.ok !== true) {
                    reply.status(400);
                    return {
                        error: 'Set up how you get paid before locking capital. ' + dest.reason,
                        code: 'PAYOUT_DESTINATION_REQUIRED',
                        rail,
                        reason: dest.code,
                    };
                }
            }

            const stakeError = validateStake(lockAmountUsdCents, tier);
            if (stakeError) {
                reply.status(400);
                return {
                    error: stakeError,
                    code: 'STAKE_OUT_OF_BOUNDS',
                    allowedRange: {
                        min: STAKE_CAPS[tier].minUsdCents,
                        max: STAKE_CAPS[tier].maxUsdCents,
                        minDisplay: `$${(STAKE_CAPS[tier].minUsdCents / 100).toFixed(0)}`,
                        maxDisplay: `$${(STAKE_CAPS[tier].maxUsdCents / 100).toFixed(0)}`,
                    },
                };
            }

            // 2. System-calculate payout (NEVER trust user input)
            //
            // Income (PLAID) contracts price off the user's OWN verified history:
            // the multiplier is derived server-side from their hit rate, so no two
            // users get the same line and nothing here comes from the request body.
            // Every other platform keeps its fixed tier multiplier, untouched.
            let systemPayoutUsdCents: number;
            let frozenIncomeTerms: FrozenIncomeTerms | null = null;

            if (platform === 'PLAID') {
                let incomeQuote;
                let incomeSuggestion;
                try {
                    const { deposits, cadence, lastDepositDate } =
                        await getSelectedStreamDeposits(principalUserId);
                    incomeSuggestion = suggestIncomeTerms(deposits, cadence, lastDepositDate);
                    incomeQuote = incomeSuggestion.tiers.find(
                        q => q.tier === RISK_TIER_TO_INCOME_TIER[tier]
                    );
                } catch (err: any) {
                    reply.status(400);
                    return {
                        error: err?.message || 'Could not read income history',
                        code: 'INCOME_HISTORY_UNAVAILABLE',
                    };
                }

                if (!incomeQuote || !incomeQuote.available) {
                    reply.status(400);
                    return {
                        error: incomeQuote?.unavailableReason || 'This tier is not available yet',
                        code: 'TIER_UNAVAILABLE',
                    };
                }

                // Stake ceiling is computed up front, never enforced after the fact
                const maxStake = incomeQuote.maxAllowableStakeUsdCents;
                if (maxStake !== undefined && lockAmountUsdCents > maxStake) {
                    reply.status(400);
                    return {
                        error: `Stake exceeds the ceiling for this tier`,
                        code: 'STAKE_OUT_OF_BOUNDS',
                        allowedRange: {
                            min: incomeQuote.minStakeUsdCents,
                            max: maxStake,
                            minDisplay: `$${(incomeQuote.minStakeUsdCents / 100).toFixed(0)}`,
                            maxDisplay: `$${(maxStake / 100).toFixed(0)}`,
                        },
                    };
                }

                systemPayoutUsdCents = calculateIncomePayout(
                    lockAmountUsdCents,
                    incomeQuote.payoutMultiplier
                );
                // Freeze against the contract's ACTUAL agreed deadline, so the
                // closing instant is recorded rather than re-derived at settlement.
                frozenIncomeTerms = freezeIncomeTerms(
                    incomeQuote,
                    incomeSuggestion!,
                    new Date(condition.deadline)
                );

                console.log(`[contracts-write] INCOME TERMS (derived): stake=$${(lockAmountUsdCents / 100).toFixed(0)}, payout=$${(systemPayoutUsdCents / 100).toFixed(0)}, multiplier=${incomeQuote.payoutMultiplier}x, hitRate=${incomeQuote.rawHitRate}, edge=${incomeQuote.houseEdge}, tier=${incomeQuote.tier}`);
            } else {
                systemPayoutUsdCents = calculatePayout(lockAmountUsdCents, tier);
                console.log(`[contracts-write] SYSTEM TERMS: stake=$${(lockAmountUsdCents / 100).toFixed(0)}, payout=$${(systemPayoutUsdCents / 100).toFixed(0)}, multiplier=${PAYOUT_MULTIPLIERS[tier]}x, tier=${tier}`);
            }

            // 3. If user sent payoutAmountUsdCents, WARN and override
            if (request.body.payoutAmountUsdCents && request.body.payoutAmountUsdCents !== systemPayoutUsdCents) {
                console.warn(`[contracts-write] OVERRIDING user payout: $${(request.body.payoutAmountUsdCents / 100).toFixed(0)} → $${(systemPayoutUsdCents / 100).toFixed(0)} (system-calculated)`);
            }

            if (lockAmountUsdCents < 100) {
                reply.status(400);
                return { error: 'Minimum lock amount is $1.00 (100 cents)' };
            }

            const deadline = new Date(condition.deadline);
            if (deadline <= new Date()) {
                reply.status(400);
                return { error: 'Deadline must be in the future' };
            }

            // NOTE: X/STRIPE connection verification handled by requireVerifiedConnection() above
            // Get binding snapshot for contract creation (immutable reference)
            let bindingId: string | null = null;
            let binding: any = null;
            try {
                const result = await getBindingSnapshotForContract(principalUserId, platform);
                bindingId = result.bindingId;
                binding = result.binding;
            } catch (err) {
                console.error('[contracts-write] getBindingSnapshotForContract failed:', err);
                // Continue without binding - it's optional for some platforms
            }

            try {
                // createContract internally:
                // 1. Inserts contract record
                // 2. Appends CONTRACT_CREATED event (with precommitted terms)
                // 3. Appends BASELINE_SNAPSHOTTED if baseline provided
                const contract = await createContract({
                    principalUserId,
                    principalIdentityUsername: username,
                    platform,
                    metricType,
                    condition,
                    // Income terms are frozen here and never recomputed: tier, target,
                    // hitRate, multiplier, edge used, multiplier cap, posting buffer.
                    baseline: frozenIncomeTerms
                        ? { ...(baseline as Record<string, unknown> | null), incomeTerms: frozenIncomeTerms, graceDays: frozenIncomeTerms.postingBufferDays }
                        : baseline,
                    lockAmountUsdCents,
                    payoutAmountUsdCents: systemPayoutUsdCents, // SYSTEM-CALCULATED
                    fundingMethod,
                    riskTier: tier,
                });

                // Derive state from events (should be CREATED)
                const events = await getEventsForContract(contract.id);
                const state = deriveState(events);

                return {
                    ok: true,
                    contractId: contract.id,
                    eventType: 'CONTRACT_CREATED',
                    derivedState: state,
                    message: 'Contract created successfully',
                    contract: {
                        id: contract.id,
                        platform: contract.platform,
                        metricType: contract.metricType,
                        condition: contract.conditionJson,
                        baseline: contract.baselineJson,
                        deadline: contract.deadlineUtc.toISOString(),
                        lockAmountUsdCents: contract.lockAmountUsdCents,
                        // The SYSTEM-CALCULATED payout, returned rather than left
                        // for the caller to re-derive. A builder that prints
                        // "payout if met" after creating a contract was otherwise
                        // quoting its own arithmetic back at itself.
                        payoutAmountUsdCents: systemPayoutUsdCents,
                        recordHash: contract.recordHash,
                        createdAt: contract.createdAt.toISOString(),
                        bindingId: bindingId || null,
                    },
                };
            } catch (err: any) {
                console.error('[contracts-write] createContract error:', err);
                if (err instanceof AuthError) {
                    reply.status(401);
                    return { ok: false, code: err.code || 'AUTH_ERROR', error: err.message };
                }
                reply.status(500);
                return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
            }
        } catch (outerErr: any) {
            console.error('[contracts-write] OUTER ERROR:', outerErr);
            reply.status(500);
            return { ok: false, code: 'OUTER_ERROR', error: outerErr.message };
        }
    });

    /**
     * POST /contracts/:id/funding-intent
     * Create Stripe PaymentIntent for funding
     * 
     * REQUIRES AUTH: principalUserId from middleware
     * 
     * From-state: CREATED
     * Appends: FUNDS_AUTHORIZED (via funding service)
     * To-state: FUNDS_AUTHORIZED
     */
     fastify.post<{
        Params: { id: string };
        Body: { userId?: never; transactionHash?: string };
    }>('/v1/contracts/:id/funding-intent', async (request, reply) => {
        const { id } = request.params;
        const principalUserId = getPrincipal(request);
        const { transactionHash } = request.body || {};

        console.log('[funding-intent] Contract:', id);
        console.log('[funding-intent] principalUserId:', principalUserId);

        // Reject userId in body (spoof protection)
        if ((request.body as any)?.userId !== undefined) {
            console.log('[funding-intent] Rejected: userId in body');
            reply.status(400);
            return {
                error: 'userId in body is not allowed. User identity is derived from authentication.',
                code: 'USER_ID_NOT_ALLOWED'
            };
        }

        if (!principalUserId) {
            console.log('[funding-intent] Rejected: No auth');
            reply.status(401);
            return { ok: false, code: 'UNAUTHORIZED', error: 'Authentication required' };
        }

        try {
            // createFundingIntent internally:
            // 1. Loads events and derives state
            // 2. Validates from-state is CREATED
            // 3. Appends FUNDS_AUTHORIZED event
            console.log('[funding-intent] Calling createFundingIntent...');
            const result = await createFundingIntent(id, principalUserId, transactionHash);
            console.log('[funding-intent] Success! PaymentIntent/Tx:', result.paymentIntentId);

            return {
                ok: true,
                contractId: id,
                eventType: 'FUNDS_AUTHORIZED',
                derivedState: ContractStatus.FUNDS_AUTHORIZED,
                message: 'Funding intent created',
                clientSecret: result.clientSecret,
                paymentIntentId: result.paymentIntentId,
                amountUsdCents: result.amountUsdCents,
                status: result.status, // EXPOSE STATUS for frontend 3DS handling
            };
        } catch (err: any) {
            if (err instanceof InvalidTransitionError) {
                reply.status(400);
                return { ok: false, code: 'INVALID_STATE', error: err.message };
            }
            if (err.message.includes('Not authorized')) {
                reply.status(403);
                return { ok: false, code: 'FORBIDDEN', error: err.message };
            } else if (err.message.includes('not found')) {
                reply.status(404);
                return { ok: false, code: 'NOT_FOUND', error: err.message };
            } else {
                reply.status(500);
                return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
            }
        }
    });

    // NOTE: FUNDS_AUTHORIZED → FUNDS_LOCKED transition happens via:
    //   - PRODUCTION: Stripe webhook (POST /v1/stripe/webhook → payment_intent.succeeded)
    //   - DEVELOPMENT: Can simulate via direct webhook call or test helper
    // See: src/routes/webhooks.ts → handlePaymentSuccess

    /**
     * POST /contracts/:id/execute
     * Execute the contract - IRREVERSIBLE
     * 
     * From-state: FUNDS_LOCKED
     * Appends: EXECUTION_REQUESTED, EXECUTION_CONFIRMED
     * To-state: LOCKED
     * 
     * Idempotent: returns success if already LOCKED
     */
    fastify.post<{
        Params: { id: string };
        Body: { userId?: never }; // userId NEVER accepted from body
    }>('/v1/contracts/:id/execute', async (request, reply) => {
        const { id } = request.params;
        const principalUserId = getPrincipal(request);

        // Reject userId in body (spoof protection)
        if ((request.body as any)?.userId !== undefined) {
            reply.status(400);
            return {
                error: 'userId in body is not allowed. User identity is derived from authentication.',
                code: 'USER_ID_NOT_ALLOWED'
            };
        }

        // 1. Get contract
        const contract = await getContract(id);
        if (!contract) {
            reply.status(404);
            return { error: 'Contract not found' };
        }

        if (contract.principalUserId !== principalUserId) {
            reply.status(403);
            return { error: 'Not authorized to execute this contract' };
        }

        // =========================================================
        // ENFORCE VERIFIED CONNECTION - Fail-closed if revoked
        // =========================================================
        const contractPlatform = contract.platform;
        if (contractPlatform === 'X' || contractPlatform === 'STRIPE' || contractPlatform === 'SHOPIFY' || contractPlatform === 'AMAZON') {
            try {
                await requireVerifiedConnection(principalUserId, contractPlatform);
                console.log(`[Execute] Verified ${contractPlatform} connection for contract ${id}`);
            } catch (err) {
                if (err instanceof PlatformNotVerifiedError) {
                    reply.status(err.status);
                    return {
                        ok: false,
                        code: err.code,
                        error: `Cannot execute: ${err.message}`,
                        platform: err.platform,
                    };
                }
                throw err;
            }
        }

        // 2. Load events and derive current state
        const events = await getEventsForContract(id);
        const currentState = deriveState(events);
        console.log('[Execute] Contract:', id, 'CurrentState:', currentState, 'EventCount:', events.length);

        // 3. Idempotent: already executed
        if (currentState === ContractStatus.LOCKED) {
            return {
                ok: true,
                contractId: contract.id,
                eventType: 'EXECUTION_CONFIRMED',
                derivedState: currentState,
                message: 'Contract already executed',
            };
        }

        // 4. Validate from-state (must be FUNDS_LOCKED)
        try {
            validateFromState(currentState, [ContractStatus.FUNDS_LOCKED], 'execute');
        } catch (err) {
            if (err instanceof InvalidTransitionError) {
                reply.status(409);
                return {
                    ok: false,
                    code: 'FUNDS_NOT_LOCKED',
                    error: `Cannot execute contract in state: ${currentState}. Must be FUNDS_LOCKED.`,
                };
            }
            throw err;
        }

        try {
            // 5. Append EXECUTION_REQUESTED
            await appendEvent({
                contractId: id,
                actor: 'USER',
                eventType: EventType.EXECUTION_REQUESTED,
                metadata: { requestedAt: new Date().toISOString() },
            });

            // 6. FREEZE IDENTITY & BASELINE (Platform-specific)
            let frozenBinding: FrozenXBinding | null = null;
            let termsHash: string | null = null;

            if (contract.platform === 'X') {
                // 6a. Get VERIFIED X connected account
                const [xAccount] = await db
                    .select()
                    .from(connectedAccounts)
                    .where(
                        and(
                            eq(connectedAccounts.userId, principalUserId),
                            eq(connectedAccounts.platform, 'X'),
                            eq(connectedAccounts.status, 'ACTIVE'),
                            eq(connectedAccounts.verificationStatus, 'VERIFIED')
                        )
                    )
                    .limit(1);

                if (!xAccount) {
                    reply.status(400);
                    return {
                        ok: false,
                        code: 'X_NOT_VERIFIED',
                        error: 'No verified X account. Connect and verify your X account first.',
                    };
                }

                const xUserId = xAccount.externalAccountId;
                const xUsername = (xAccount.metadataJson as any)?.resolvedUsername || xAccount.externalAccountId;

                // 6b. Fetch account health
                const client = getXClient();
                const accountHealth = await client.getUserWithHealth(xUserId);
                console.log('[Execute] accountHealth:', JSON.stringify(accountHealth, null, 2));

                // 6c. RE-CHECK ELIGIBILITY (fail closed)
                const eligibility = checkXEligibility(accountHealth);
                console.log('[Execute] eligibility:', eligibility);
                if (!eligibility.eligible) {
                    console.log('[Execute] FAILED: eligibility check');
                    reply.status(400);
                    return {
                        ok: false,
                        code: eligibility.reasonCode,
                        error: `X account not eligible for contracts: ${eligibility.reasonCode}`,
                        details: eligibility.details,
                    };
                }

                // 6d. Calculate frozen baseline and delta floor
                const frozenBaselineFollowers = accountHealth.publicMetrics.followersCount;
                const deltaFloor = calculateDeltaFloor(frozenBaselineFollowers);

                // 6e. Validate threshold meets delta floor
                const condition = contract.conditionJson as { threshold: number; operator: string };
                console.log('[Execute] condition:', condition, 'baseline:', frozenBaselineFollowers);
                const deltaValidation = validateDeltaFloor(frozenBaselineFollowers, condition.threshold);
                console.log('[Execute] deltaValidation:', deltaValidation);

                // Skip delta validation in local dev if env var set
                const skipDeltaFloor = process.env.SKIP_DELTA_FLOOR === 'true';
                if (!deltaValidation.valid && !skipDeltaFloor) {
                    console.log('[Execute] FAILED: delta floor validation');
                    reply.status(400);
                    return {
                        ok: false,
                        code: 'DELTA_FLOOR_NOT_MET',
                        error: `Target threshold does not meet minimum delta floor. ` +
                            `Baseline: ${frozenBaselineFollowers}, Target: ${condition.threshold}, ` +
                            `Required delta: ${deltaValidation.requiredDelta}, Actual: ${deltaValidation.actualDelta}`,
                    };
                }
                if (skipDeltaFloor && !deltaValidation.valid) {
                    console.log('[Execute] ⚠️ Delta floor validation SKIPPED (SKIP_DELTA_FLOOR=true)');
                }

                // 6f. Create frozen binding
                const measuredAtUtc = new Date().toISOString();
                frozenBinding = {
                    xUserId,
                    username: xUsername,
                    baselineFollowers: frozenBaselineFollowers,
                    deltaFloor,
                    accountHealth,
                    frozenAtUtc: measuredAtUtc,
                };

                // 6g. Persist frozen baseline into contract
                const baselineToStore = {
                    platform: 'X',
                    xUserId,
                    username: xUsername,
                    followers: frozenBaselineFollowers,
                    deltaFloor,
                    accountHealth,
                    measuredAtUtc,
                    frozenAtUtc: measuredAtUtc,
                };

                await updateContractBaseline(id, baselineToStore);

                termsHash = createHash('sha256')
                    .update(JSON.stringify({
                        xUserId,
                        baselineFollowers: frozenBaselineFollowers,
                        deltaFloor,
                        threshold: condition.threshold,
                        operator: condition.operator,
                        frozenAtUtc: measuredAtUtc,
                    }))
                    .digest('hex');
            }

            // STRIPE PLATFORM EXECUTE LOGIC
            if (contract.platform === 'STRIPE') {
                // 6a. Get VERIFIED Stripe connected account
                const [stripeAccount] = await db
                    .select()
                    .from(connectedAccounts)
                    .where(
                        and(
                            eq(connectedAccounts.userId, principalUserId),
                            eq(connectedAccounts.platform, 'STRIPE'),
                            eq(connectedAccounts.status, 'ACTIVE'),
                            eq(connectedAccounts.verificationStatus, 'VERIFIED')
                        )
                    )
                    .limit(1);

                if (!stripeAccount) {
                    reply.status(400);
                    return {
                        ok: false,
                        code: 'STRIPE_NOT_VERIFIED',
                        error: 'No verified Stripe account. Connect via Stripe Connect first.',
                    };
                }

                const stripeConnectedAccountId = stripeAccount.externalAccountId;
                const condition = contract.conditionJson as { threshold: number; operator: string };
                const executionTime = new Date();

                // 6b. Determine tier based on condition/riskTier (default STEADY)
                let tier: 'STEADY' | 'BROAD' | 'ALL_IN' = 'STEADY';
                const riskTier = (contract as any).riskTier;
                if (riskTier === 'ADVANCED') tier = 'BROAD';
                else if (riskTier === 'ELITE') tier = 'ALL_IN';

                try {
                    // 6c. Create V1 baseline snapshot (validates tier eligibility + delta floor)
                    const v1Baseline = await stripeRevenueAdapter.createV1BaselineSnapshot(
                        stripeConnectedAccountId,
                        condition.threshold, // Use threshold as delta target
                        executionTime,
                        tier
                    );

                    // 6d. Persist frozen baseline into contract
                    await updateContractBaseline(id, v1Baseline);

                    // 6e. Compute termsHash
                    termsHash = createHash('sha256')
                        .update(JSON.stringify({
                            stripeConnectedAccountId: v1Baseline.stripeConnectedAccountId,
                            baselineNetRevenueCents: v1Baseline.baselineNetRevenueCents,
                            deltaTargetCents: v1Baseline.deltaTargetCents,
                            tier: v1Baseline.tier,
                            tierPercentage: v1Baseline.tierPercentage,
                            verificationWindow: v1Baseline.verificationWindow,
                            frozenAtUtc: v1Baseline.frozenAtUtc,
                            noAppeals: true,
                            deterministicSettlement: true,
                        }))
                        .digest('hex');

                } catch (err: any) {
                    // Handle tier eligibility or delta floor errors
                    const errorMessage = err.message || 'Unknown error';
                    if (errorMessage.includes(STRIPE_ERROR_CODES.INELIGIBLE_BASELINE_TOO_LOW)) {
                        reply.status(400);
                        return {
                            ok: false,
                            code: STRIPE_ERROR_CODES.INELIGIBLE_BASELINE_TOO_LOW,
                            error: errorMessage,
                        };
                    }
                    if (errorMessage.includes(STRIPE_ERROR_CODES.DELTA_FLOOR_NOT_MET)) {
                        reply.status(400);
                        return {
                            ok: false,
                            code: STRIPE_ERROR_CODES.DELTA_FLOOR_NOT_MET,
                            error: errorMessage,
                        };
                    }
                    throw err;
                }
            }

            // SHOPIFY PLATFORM EXECUTE LOGIC
            if (contract.platform === 'SHOPIFY') {
                const [shopifyAccount] = await db
                    .select()
                    .from(connectedAccounts)
                    .where(
                        and(
                            eq(connectedAccounts.userId, principalUserId),
                            eq(connectedAccounts.platform, 'SHOPIFY'),
                            eq(connectedAccounts.status, 'ACTIVE'),
                            eq(connectedAccounts.verificationStatus, 'VERIFIED')
                        )
                    )
                    .limit(1);

                if (!shopifyAccount) {
                    reply.status(400);
                    return {
                        ok: false,
                        code: 'SHOPIFY_NOT_VERIFIED',
                        error: 'No verified Shopify account. Connect your Shopify store first.',
                    };
                }

                const shopDomain = shopifyAccount.externalAccountId;
                const shopMeta = shopifyAccount.metadataJson as Record<string, any> | null;
                const executionTime = new Date();

                const baselineToStore = {
                    platform: 'SHOPIFY',
                    shopDomain,
                    shopName: shopMeta?.shopName || shopDomain,
                    measuredAtUtc: executionTime.toISOString(),
                    frozenAtUtc: executionTime.toISOString(),
                };

                await updateContractBaseline(id, baselineToStore);

                termsHash = createHash('sha256')
                    .update(JSON.stringify({
                        shopDomain,
                        frozenAtUtc: executionTime.toISOString(),
                        noAppeals: true,
                        deterministicSettlement: true,
                    }))
                    .digest('hex');
            }

            // AMAZON PLATFORM EXECUTE LOGIC
            if (contract.platform === 'AMAZON') {
                const [amazonAccount] = await db
                    .select()
                    .from(connectedAccounts)
                    .where(
                        and(
                            eq(connectedAccounts.userId, principalUserId),
                            eq(connectedAccounts.platform, 'AMAZON'),
                            eq(connectedAccounts.status, 'ACTIVE'),
                            eq(connectedAccounts.verificationStatus, 'VERIFIED')
                        )
                    )
                    .limit(1);

                if (!amazonAccount) {
                    reply.status(400);
                    return {
                        ok: false,
                        code: 'AMAZON_NOT_VERIFIED',
                        error: 'No verified Amazon Seller account. Connect your Amazon account first.',
                    };
                }

                const sellerId = amazonAccount.externalAccountId;
                const executionTime = new Date();

                const baselineToStore = {
                    platform: 'AMAZON',
                    sellerId,
                    measuredAtUtc: executionTime.toISOString(),
                    frozenAtUtc: executionTime.toISOString(),
                };

                await updateContractBaseline(id, baselineToStore);

                termsHash = createHash('sha256')
                    .update(JSON.stringify({
                        sellerId,
                        frozenAtUtc: executionTime.toISOString(),
                        noAppeals: true,
                        deterministicSettlement: true,
                    }))
                    .digest('hex');
            }

            // 7. Append EXECUTION_CONFIRMED - transitions to LOCKED
            await appendEvent({
                contractId: id,
                actor: 'SYSTEM',
                eventType: EventType.EXECUTION_CONFIRMED,
                metadata: {
                    confirmedAt: new Date().toISOString(),
                    binding: true,
                    noAppeals: true,
                    ...(termsHash && { termsHash }),
                },
            });

            // 8. Get derived state after execution
            const updatedEvents = await getEventsForContract(id);
            const newState = deriveState(updatedEvents);

            // EMAIL: Execution confirmed notification (fire-and-forget)
            import('../services/email.js').then(({ sendExecutionEmail }) => {
                sendExecutionEmail({
                    userId: contract.principalUserId,
                    contractId: id,
                    platform: contract.platform,
                    lockAmountCents: contract.lockAmountUsdCents,
                    payoutAmountCents: contract.payoutAmountUsdCents,
                    deadline: contract.deadlineUtc.toISOString(),
                    metricType: contract.metricType,
                }).catch(() => { });
            }).catch(() => { });

            // REFERRAL: Activate referral on first contract execution (fire-and-forget)
            import('../services/referral.js').then(({ activateReferral }) => {
                activateReferral(principalUserId, contract.lockAmountUsdCents)
                    .then(activated => {
                        if (activated) console.log(`🎉 Referral activated for user ${principalUserId}`);
                    })
                    .catch(err => console.error('[Referral] Activation failed (non-blocking):', err.message));
            }).catch(() => { });

            // CREATOR REFERRAL: Track funded contract for creator outreach program (fire-and-forget)
            import('../services/creator-referral.js').then(({ recordFundedContract }) => {
                recordFundedContract(principalUserId, contract.id, contract.lockAmountUsdCents)
                    .then(result => {
                        if (result.recorded) console.log(`🎨 Creator referral funded contract recorded for user ${principalUserId}`);
                    })
                    .catch(err => console.error('[CreatorRef] Funded contract tracking failed (non-blocking):', err.message));
            }).catch(() => { });

            return {
                ok: true,
                contractId: contract.id,
                eventType: 'EXECUTION_CONFIRMED',
                derivedState: newState,
                message: 'Contract executed. This is binding and irreversible.',
                deadline: contract.deadlineUtc.toISOString(),
                lockAmountUsdCents: contract.lockAmountUsdCents,
                ...(termsHash && { termsHash }),
                warnings: [
                    'No appeals will be accepted.',
                    'Capital will be forfeited on failure.',
                    'Verification is automatic and final.',
                ],
            };
        } catch (err: any) {
            if (err instanceof InvalidTransitionError) {
                reply.status(400);
                return { ok: false, code: 'INVALID_STATE', error: err.message };
            }
            reply.status(500);
            return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
        }
    });

    /**
     * POST /contracts/:id/settle
     * Admin/Internal settlement trigger (manual intervention)
     * Maps WIN/LOSS to internal SUCCESS/FAILURE outcomes.
     */
    fastify.post<{
        Params: { id: string };
        Body: { outcome: 'WIN' | 'LOSS' };
    }>('/v1/contracts/:id/settle', async (request, reply) => {
        const { id } = request.params;
        const { outcome } = request.body || {};
        // Use direct access or default to 'admin' (getPrincipal throws if missing, blocking admin bypass)
        const principalUserId = request.principalUserId || 'admin';

        // ADMIN AUTH CHECK
        const adminKey = request.headers['x-admin-key'];
        // Allow if matches env var OR if in dev mode with no env var set (for testing)
        const isValid = adminKey === process.env.ADMIN_API_KEY || (!process.env.ADMIN_API_KEY && process.env.NODE_ENV !== 'production');

        if (!isValid) {
            reply.status(403);
            return { error: 'Unauthorized: Admin access required' };
        }

        console.log(`[Settlement] Manual trigger for ${id} by ${principalUserId}, outcome: ${outcome}`);

        const mappedOutcome = outcome === 'WIN' ? 'SUCCESS' : (outcome === 'LOSS' ? 'FAILURE' : undefined);

        if (!mappedOutcome) {
            reply.status(400);
            return { ok: false, error: 'Invalid outcome. Must be WIN or LOSS.' };
        }

        try {
            // Call settlement service with override
            const result = await settleContract(id, undefined, mappedOutcome);

            if (!result.success) {
                // Return 400 if logic prevented settlement (e.g. wrong state)
                reply.status(400);
                return { ok: false, ...result };
            }

            return { ok: true, ...result };
        } catch (err: any) {
            console.error('[Settlement] Endpoint error:', err);
            reply.status(500);
            return { ok: false, error: err.message };
        }
    });

    // =======================================================================
    // DEV-ONLY: SIMULATE SUCCESS ENDPOINT
    // =======================================================================
    // Allows testing receipt page without Stripe funds locking
    // HARD-FAILS in production - no exceptions
    // =======================================================================
    fastify.post<{
        Params: { id: string };
    }>('/v1/contracts/:id/dev/simulate-success', async (request, reply) => {
        // ==========================================
        // PRODUCTION GUARD - HARD FAIL
        // ==========================================
        if (process.env.NODE_ENV === 'production') {
            console.error('[DEV SIMULATE] BLOCKED - Production environment detected!');
            reply.status(403);
            return {
                ok: false,
                code: 'PRODUCTION_BLOCKED',
                error: 'DEV endpoints are disabled in production'
            };
        }

        const contractId = request.params.id;
        const userId = request.userId!;

        console.warn('[DEV] Simulating contract success', { contractId, userId });

        try {
            // Get contract
            const contract = await getContract(contractId);
            if (!contract) {
                reply.status(404);
                return { ok: false, code: 'NOT_FOUND', error: 'Contract not found' };
            }

            // Verify ownership - contracts use principalUserId field
            // DEBUG: Log both userId values to diagnose mismatch
            console.log('[DEV] Ownership check:', {
                contractUserId: contract.principalUserId,
                authUserId: userId,
                match: contract.principalUserId === userId,
            });

            if (contract.principalUserId !== userId) {
                reply.status(403);
                return { ok: false, code: 'FORBIDDEN', error: 'Not your contract' };
            }

            // Get current events
            const events = await getEventsForContract(contractId);
            const currentState = deriveState(events);

            // Idempotent: if already in terminal success state, return success
            if (['LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED'].includes(currentState)) {
                console.log('[DEV] Contract already in success state:', currentState);
                return {
                    ok: true,
                    code: 'ALREADY_SUCCESS',
                    state: currentState,
                    message: 'Contract is already in terminal success state'
                };
            }

            // Append missing events to reach LOCKED state
            const now = new Date().toISOString();

            // If no FUNDS_AUTHORIZED, add it
            const hasFundsAuthorized = events.some(e => e.eventType === 'FUNDS_AUTHORIZED');
            if (!hasFundsAuthorized) {
                await appendEvent({
                    contractId,
                    actor: 'SYSTEM',
                    eventType: 'FUNDS_AUTHORIZED' as any,
                    metadata: {
                        dev: true,
                        simulatedAt: now,
                        amountUsdCents: contract.lockAmountUsdCents,
                        paymentIntentId: 'pi_dev_simulated_' + contractId.slice(0, 8),
                    },
                });
                console.log('[DEV] Appended FUNDS_AUTHORIZED');
            }

            // If no FUNDS_LOCKED, add it
            const hasFundsLocked = events.some(e => e.eventType === 'FUNDS_LOCKED');
            if (!hasFundsLocked) {
                await appendEvent({
                    contractId,
                    actor: 'SYSTEM',
                    eventType: 'FUNDS_LOCKED' as any,
                    metadata: {
                        dev: true,
                        simulatedAt: now,
                        amountUsdCents: contract.lockAmountUsdCents,
                        chargeId: 'ch_dev_simulated_' + contractId.slice(0, 8),
                    },
                });
                console.log('[DEV] Appended FUNDS_LOCKED');
            }

            // If no EXECUTION_REQUESTED, add it
            const hasExecutionRequested = events.some(e => e.eventType === 'EXECUTION_REQUESTED');
            if (!hasExecutionRequested) {
                await appendEvent({
                    contractId,
                    actor: 'SYSTEM',
                    eventType: 'EXECUTION_REQUESTED' as any,
                    metadata: {
                        dev: true,
                        simulatedAt: now,
                    },
                });
                console.log('[DEV] Appended EXECUTION_REQUESTED');
            }

            // If no EXECUTION_CONFIRMED, add it
            const hasExecutionConfirmed = events.some(e => e.eventType === 'EXECUTION_CONFIRMED');
            if (!hasExecutionConfirmed) {
                await appendEvent({
                    contractId,
                    actor: 'SYSTEM',
                    eventType: 'EXECUTION_CONFIRMED' as any,
                    metadata: {
                        dev: true,
                        simulatedAt: now,
                        deadline: contract.deadlineUtc?.toISOString() || now,
                        lockAmountUsdCents: contract.lockAmountUsdCents,
                        message: '[DEV] Simulated execution confirmation',
                    },
                });
                console.log('[DEV] Appended EXECUTION_CONFIRMED');
            }

            // Get final state
            const updatedEvents = await getEventsForContract(contractId);
            const finalState = deriveState(updatedEvents);

            console.warn('[DEV] Simulated contract success', { contractId, finalState });

            return {
                ok: true,
                code: 'DEV_SIMULATED',
                state: finalState,
                message: 'Contract simulated to success state (DEV ONLY)',
                eventsAdded: updatedEvents.length - events.length,
            };

        } catch (err: any) {
            console.error('[DEV] Simulate error:', err);
            reply.status(500);
            return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
        }
    });

    // =======================================================================
    // LOCK CAPITAL ENDPOINT
    // =======================================================================
    // Locks user's available balance for a contract
    // Writes CAPITAL_LOCKED to account_ledger_events
    // =======================================================================
    fastify.post<{
        Params: { id: string };
        Body: { amountCents?: number };
    }>('/v1/contracts/:id/lock', async (request, reply) => {
        const { id } = request.params;
        const principalUserId = getPrincipal(request);

        if (!principalUserId) {
            reply.status(401);
            return { ok: false, code: 'UNAUTHORIZED', error: 'Authentication required' };
        }

        try {
            // 1. Get contract
            const contract = await getContract(id);
            if (!contract) {
                reply.status(404);
                return { ok: false, code: 'NOT_FOUND', error: 'Contract not found' };
            }

            // 2. Check ownership
            if (contract.principalUserId !== principalUserId) {
                reply.status(403);
                return { ok: false, code: 'FORBIDDEN', error: 'Not authorized to lock this contract' };
            }

            // 3. Load events and check state
            const events = await getEventsForContract(id);
            const currentState = deriveState(events);

            // Idempotent: already locked
            if (currentState === ContractStatus.LOCKED || currentState === ContractStatus.FUNDS_LOCKED) {
                const { computeBalances } = await import('../services/balances.js');
                const balances = await computeBalances(principalUserId);
                return {
                    ok: true,
                    code: 'ALREADY_LOCKED',
                    contractId: id,
                    derivedState: currentState,
                    balances: {
                        availableBalanceUsdCents: balances.availableCents,
                        lockedBalanceUsdCents: balances.lockedCents,
                        pendingPayoutUsdCents: balances.pendingPayoutCents,
                    },
                };
            }

            // Must be CREATED or EXECUTABLE state to lock
            if (currentState !== ContractStatus.CREATED && currentState !== ContractStatus.FUNDS_AUTHORIZED) {
                reply.status(409);
                return {
                    ok: false,
                    code: 'INVALID_STATE',
                    error: `Cannot lock contract in state: ${currentState}. Must be CREATED or FUNDS_AUTHORIZED.`,
                };
            }

            // 4. Determine lock amount (default to contract amount)
            const amountCents = request.body?.amountCents || contract.lockAmountUsdCents;

            if (amountCents < contract.lockAmountUsdCents) {
                reply.status(400);
                return {
                    ok: false,
                    code: 'INSUFFICIENT_LOCK_AMOUNT',
                    error: `Lock amount ${amountCents} is less than required ${contract.lockAmountUsdCents}`,
                };
            }

            // 5. Check balance availability
            const { computeBalances, appendAccountEvent, AccountEventType } = await import('../services/balances.js');
            const balances = await computeBalances(principalUserId);

            if (balances.availableCents < amountCents) {
                reply.status(400);
                return {
                    ok: false,
                    code: 'INSUFFICIENT_BALANCE',
                    error: `Insufficient available balance. Required: $${(amountCents / 100).toFixed(2)}, Available: $${(balances.availableCents / 100).toFixed(2)}`,
                    balances: {
                        availableBalanceUsdCents: balances.availableCents,
                        lockedBalanceUsdCents: balances.lockedCents,
                    },
                };
            }

            // 6. Write CAPITAL_LOCKED to account ledger (idempotent via contractId)
            await appendAccountEvent({
                userId: principalUserId,
                contractId: id,
                eventType: AccountEventType.CAPITAL_LOCKED,
                amountCents, // This represents locked funds
                idempotencyKey: `capital_locked_${id}`,
                metadata: {
                    lockAmountCents: amountCents,
                    contractLockAmount: contract.lockAmountUsdCents,
                },
            });

            // 7. Write FUNDS_LOCKED event to contract ledger
            await appendEvent({
                contractId: id,
                actor: 'SYSTEM',
                eventType: EventType.FUNDS_LOCKED,
                amountUsdCents: amountCents,
                metadata: {
                    lockedAt: new Date().toISOString(),
                    source: 'available_balance',
                },
            });

            // 8. Get updated balances and state
            const updatedBalances = await computeBalances(principalUserId);
            const updatedEvents = await getEventsForContract(id);
            const newState = deriveState(updatedEvents);

            console.log(`[Lock] Contract ${id} locked with $${(amountCents / 100).toFixed(2)}`);

            return {
                ok: true,
                contractId: id,
                eventType: 'FUNDS_LOCKED',
                derivedState: newState,
                lockedAmountCents: amountCents,
                balances: {
                    availableBalanceUsdCents: updatedBalances.availableCents,
                    lockedBalanceUsdCents: updatedBalances.lockedCents,
                    pendingPayoutUsdCents: updatedBalances.pendingPayoutCents,
                },
            };

        } catch (err: any) {
            console.error('[Lock] Error:', err.message);
            reply.status(500);
            return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
        }
    });

    // (Duplicate Settle Route Removed)
    /* Params: { id: string };
    Body: { outcome: 'win' | 'loss' };
    }> ('/v1/contracts/:id/settle', async (request, reply) => {
    const { id } = request.params;
    const { outcome } = request.body;
    
    // Note: Settlement can be called by admin/system, not just contract owner
    // For MVP, allow authenticated users to settle their own contracts
    
    // ADMIN AUTH CHECK
    const adminKey = request.headers['x-admin-key'];
    // Allow if matches env var OR if in dev mode with no env var set (for testing)
    const isValid = adminKey === process.env.ADMIN_API_KEY || (!process.env.ADMIN_API_KEY && process.env.NODE_ENV !== 'production');
    
    if (!isValid) {
        reply.status(403);
        return { error: 'Unauthorized: Admin access required' };
    }
    
    if (!outcome || !['win', 'loss'].includes(outcome)) {
        reply.status(400);
        return { ok: false, code: 'INVALID_OUTCOME', error: 'Outcome must be "win" or "loss"' };
    }
    
    try {
        // 1. Get contract
        const contract = await getContract(id);
        if (!contract) {
            reply.status(404);
            return { ok: false, code: 'NOT_FOUND', error: 'Contract not found' };
        }
    
        const principalUserId = contract.principalUserId;
    
        // 2. Load events and check state
        const events = await getEventsForContract(id);
        const currentState = deriveState(events);
    
        // Idempotent: already settled
        if (currentState === ContractStatus.SETTLED ||
            currentState === ContractStatus.FORFEITED ||
            currentState === 'SETTLED_WIN' ||
            currentState === 'SETTLED_LOSS') {
            const { computeBalances } = await import('../services/balances.js');
            const balances = await computeBalances(principalUserId);
            return {
                ok: true,
                code: 'ALREADY_SETTLED',
                contractId: id,
                derivedState: currentState,
                balances: {
                    availableBalanceUsdCents: balances.availableCents,
                    lockedBalanceUsdCents: balances.lockedCents,
                    pendingPayoutUsdCents: balances.pendingPayoutCents,
                },
            };
        }
    
        // Must be in LOCKED state to settle
        if (currentState !== ContractStatus.LOCKED &&
            currentState !== ContractStatus.FUNDS_LOCKED &&
            currentState !== 'RUNNING') {
            reply.status(409);
            return {
                ok: false,
                code: 'INVALID_STATE',
                error: `Cannot settle contract in state: ${currentState}. Must be LOCKED.`,
            };
        }
    
        const { computeBalances, appendAccountEvent, AccountEventType } = await import('../services/balances.js');
    
        if (outcome === 'win') {
            // WIN: Credit the locked amount back + payout
            const payoutAmount = contract.payoutAmountUsdCents;
    
            // Write CAPITAL_UNLOCKED (return locked funds)
            await appendAccountEvent({
                userId: principalUserId,
                contractId: id,
                eventType: AccountEventType.CAPITAL_UNLOCKED,
                amountCents: contract.lockAmountUsdCents,
                idempotencyKey: `capital_unlocked_${id}`,
                metadata: { reason: 'settlement_win' },
            });
    
            // Write SETTLEMENT_WIN (credit payout - but this is the same as locked for now)
            await appendAccountEvent({
                userId: principalUserId,
                contractId: id,
                eventType: AccountEventType.SETTLEMENT_WIN,
                amountCents: payoutAmount - contract.lockAmountUsdCents, // Additional payout above principal
                idempotencyKey: `settlement_win_${id}`,
                metadata: {
                    payoutAmountCents: payoutAmount,
                    lockAmountCents: contract.lockAmountUsdCents,
                },
            });
    
            // Write PAYOUT_QUEUED
            await appendAccountEvent({
                userId: principalUserId,
                contractId: id,
                eventType: AccountEventType.PAYOUT_QUEUED,
                amountCents: payoutAmount,
                idempotencyKey: `payout_queued_${id}`,
                metadata: { settledAt: new Date().toISOString() },
            });
    
            // Write contract ledger event
            await appendEvent({
                contractId: id,
                actor: 'SYSTEM',
                eventType: EventType.SETTLED_SUCCESS,
                amountUsdCents: payoutAmount,
                metadata: {
                    outcome: 'win',
                    payoutAmountCents: payoutAmount,
                    settledAt: new Date().toISOString(),
                },
            });
    
        } else {
            // LOSS: Forfeit locked capital
            await appendAccountEvent({
                userId: principalUserId,
                contractId: id,
                eventType: AccountEventType.SETTLEMENT_LOSS,
                amountCents: 0, // No refund
                idempotencyKey: `settlement_loss_${id}`,
                metadata: {
                    forfeitedAmountCents: contract.lockAmountUsdCents,
                    settledAt: new Date().toISOString(),
                },
            });
    
            // Write contract ledger event
            await appendEvent({
                contractId: id,
                actor: 'SYSTEM',
                eventType: EventType.SETTLED_FAILURE,
                amountUsdCents: contract.lockAmountUsdCents,
                metadata: {
                    outcome: 'loss',
                    forfeitedAmountCents: contract.lockAmountUsdCents,
                    settledAt: new Date().toISOString(),
                },
            });
        }
    
        // Get updated balances and state
        const updatedBalances = await computeBalances(principalUserId);
        const updatedEvents = await getEventsForContract(id);
        const newState = deriveState(updatedEvents);
    
        console.log(`[Settle] Contract ${id} settled: ${outcome.toUpperCase()}`);
    
        return {
            ok: true,
            contractId: id,
            outcome,
            derivedState: newState,
            balances: {
                availableBalanceUsdCents: updatedBalances.availableCents,
                lockedBalanceUsdCents: updatedBalances.lockedCents,
                pendingPayoutUsdCents: updatedBalances.pendingPayoutCents,
            },
        };
    
    } catch (err: any) {
        console.error('[Settle] Error:', err.message);
        reply.status(500);
        return { ok: false, code: 'INTERNAL_ERROR', error: err.message };
    }
    }); */
};

export default contractWriteRoutes;

