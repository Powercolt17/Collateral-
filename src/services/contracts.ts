// @ts-nocheck
/**
 * Contract Service
 * 
 * Manages contract lifecycle. State is NEVER stored.
 * All state is derived from ledger events via state-derivation service.
 * Every meaningful action emits a ledger event.
 */

import { db, type DbLike } from '../db/client.js';
import {
    contracts,
    type Contract,
    type NewContract,
    EventType,
    type ContractStatusType,
    users,
    connectedAccounts,
    marketContractInstances
} from '../db/schema.js';
import { appendEvent, getEventsForContract } from './ledger.js';
import { deriveState, canTransition, InvalidTransitionError } from './state-derivation.js';
import { eq, and, sql, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { stripeRevenueAdapter } from '../adapters/stripe-revenue.js';
import { computeSettlementDate } from '../adapters/plaid-income.js';
import { githubAdapter, getGithubClient } from '../adapters/github.js';
import { MINIMUM_BASELINES, MIN_ACCOUNT_AGE_DAYS } from './contract-calculator.js';

// =============================================================================
// ANTI-ABUSE CONSTANTS (GitHub)
// =============================================================================
export const GITHUB_MIN_REPO_AGE_DAYS = 30;
export const GITHUB_MAX_PUSHED_STALENESS_DAYS = 30;
export const GITHUB_MIN_REPO_SIZE_KB = 1000;
export const GITHUB_MIN_THRESHOLD_ADVANCED = 5;
export const GITHUB_MIN_THRESHOLD_ELITE = 10;
export const GITHUB_MAX_WINDOW_DAYS = 30;

// =============================================================================
// ANTI-SYBIL CONTROLS
// =============================================================================
export const MAX_ACTIVE_CONTRACTS_PER_USER = 3;
export const MAX_ACTIVE_CONTRACTS_PER_PLATFORM = 1;
export const CONTRACT_CREATION_COOLDOWN_HOURS = 24;
export const FAILURE_COOLDOWN_HOURS = 72; // Cooldown after failure
export const FAILURE_WINDOW_DAYS = 7;
export const MIN_LOCK_AMOUNT_USD_CENTS = 1000; // $10
// Escalation tiers (MUST BE MONOTONIC: 1.0x → 1.5x → 2.0x)
export const ESCALATION_TIER_1_FAILURES = 2; // 2 failures → 1.5x
export const ESCALATION_TIER_1_MULTIPLIER = 1.5;
export const ESCALATION_TIER_2_FAILURES = 3; // 3+ failures → 2.0x
export const ESCALATION_TIER_2_MULTIPLIER = 2.0;

/**
 * Get contract by ID
 * @param contractId - Contract to fetch
 * @param txClient - Optional transaction client
 */
export async function getContract(contractId: string, txClient?: DbLike): Promise<Contract | null> {
    const client = txClient ?? db;
    const [contract] = await client
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .limit(1);

    return contract || null;
}

/**
 * Get contract with derived state
 */
export async function getContractWithState(contractId: string): Promise<{
    contract: Contract;
    state: ContractStatusType | null;
} | null> {
    const contract = await getContract(contractId);
    if (!contract) return null;

    const events = await getEventsForContract(contractId);
    const state = deriveState(events);

    return { contract, state };
}

/**
 * Get contracts for a user with derived states
 */
export async function getContractsForUser(userId: string): Promise<{
    contract: Contract;
    state: ContractStatusType | null;
}[]> {
    const userContracts = await db
        .select()
        .from(contracts)
        .where(eq(contracts.principalUserId, userId))
        .orderBy(contracts.createdAt);

    const results = await Promise.all(
        userContracts.map(async (contract) => {
            const events = await getEventsForContract(contract.id);
            const state = deriveState(events);
            return { contract, state };
        })
    );

    return results;
}

/**
 * Compute record hash for contract immutability
 */
function computeRecordHash(contract: NewContract, firstEventId: string): string {
    const payload = {
        principalUserId: contract.principalUserId,
        platform: contract.platform,
        metricType: contract.metricType,
        conditionJson: contract.conditionJson,
        deadlineUtc: contract.deadlineUtc,
        lockAmountUsdCents: contract.lockAmountUsdCents,
        firstEventId,
    };
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export interface CreateContractParams {
    principalUserId: string;
    principalIdentityUsername: string;
    platform: 'X' | 'STRIPE' | 'GITHUB' | 'YOUTUBE' | 'TIKTOK' | 'SHOPIFY';
    metricType: 'IMPRESSIONS' | 'FOLLOWERS' | 'REVENUE' | 'VIEWS' | 'SUBSCRIBERS' | 'COMMITS' | 'PRS_MERGED' | 'STARS_GAINED';
    condition: {
        operator: 'GTE' | 'GT' | 'LTE' | 'LT' | 'EQ';
        threshold: number;
        deadline: string; // ISO date string
    };
    baseline?: Record<string, unknown>;
    lockAmountUsdCents: number;
    // PRECOMMITTED PAYOUT: Required, fixed at creation, never changes
    payoutAmountUsdCents: number;
    fundingMethod?: 'USD_CARD' | 'USD_ACH' | 'CRYPTO';
    riskTier?: 'STANDARD' | 'ADVANCED' | 'ELITE';
    marketInstanceId?: string; // Optional: Link to Live Market drop
}

/**
 * Get terminal failure events for a user from the ledger
 * These events indicate when a contract was forfeited (user failed)
 * Returns events ordered by timestamp descending (most recent first)
 */
async function getTerminalFailureEventsForUser(principalUserId: string): Promise<{
    contractId: string;
    eventType: string;
    timestamp: Date;
}[]> {
    // First get all user's contracts
    const userContractIds = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(eq(contracts.principalUserId, principalUserId));

    if (userContractIds.length === 0) {
        return [];
    }

    const contractIds = userContractIds.map(c => c.id);

    // Query ledger for terminal failure events (SETTLED_FAILURE or CONTRACT_FORFEITED)
    // These indicate the user failed to meet their commitment
    const failureEventTypes = [EventType.SETTLED_FAILURE, EventType.CONTRACT_FORFEITED];

    const failureEvents: { contractId: string; eventType: string; timestamp: Date }[] = [];

    // Query ledger events for each contract (ledger is truth)
    for (const contractId of contractIds) {
        const events = await getEventsForContract(contractId);
        const failureEvent = events.find(e =>
            failureEventTypes.includes(e.eventType as any)
        );
        if (failureEvent) {
            failureEvents.push({
                contractId,
                eventType: failureEvent.eventType,
                timestamp: failureEvent.timestampUtc,
            });
        }
    }

    // Sort by timestamp descending (most recent first)
    return failureEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Anti-Sybil Validation (LEDGER-FIRST)
 * 
 * Enforces:
 * - Active contract cap (max 3)
 * - Platform limits (max 1 per platform)
 * - Creation cooldown (24h between contracts)
 * - Failure cooldown (72h after any terminal failure - from LEDGER)
 * - Escalating min lock (based on failure COUNT from LEDGER)
 * 
 * IMPORTANT: Failure detection uses ledger events (SETTLED_FAILURE, CONTRACT_FORFEITED)
 * not contract.createdAt. This is objective and cannot be gamed.
 */
async function validateAntiSybil(
    principalUserId: string,
    lockAmountUsdCents: number,
    platform: string
): Promise<void> {
    const now = new Date();

    // Get all user contracts with states (for active cap checks)
    const userContracts = await getContractsForUser(principalUserId);

    // 1. Global active contract cap (max 3)
    const activeStates = ['CREATED', 'LOCKED', 'VERIFYING', 'SETTLING', 'VERIFIED', 'FUNDS_AUTHORIZED', 'FUNDS_LOCKED'];
    const activeContracts = userContracts.filter(c =>
        c.state && activeStates.includes(c.state)
    );
    if (activeContracts.length >= MAX_ACTIVE_CONTRACTS_PER_USER) {
        throw new Error(`Anti-sybil: Maximum ${MAX_ACTIVE_CONTRACTS_PER_USER} active contracts allowed per user`);
    }

    // 2. Platform-specific cap (max 1 per platform)
    const activePlatformContracts = activeContracts.filter(c =>
        c.contract.platform === platform
    );
    if (activePlatformContracts.length >= MAX_ACTIVE_CONTRACTS_PER_PLATFORM) {
        throw new Error(`Anti-sybil: Maximum ${MAX_ACTIVE_CONTRACTS_PER_PLATFORM} active contract per platform (${platform})`);
    }

    // 3. Creation cooldown (24h between contracts)
    const cooldownCutoff = new Date(now.getTime() - CONTRACT_CREATION_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentContract = userContracts.find(c =>
        c.contract.createdAt && new Date(c.contract.createdAt) > cooldownCutoff
    );
    if (recentContract) {
        const hoursAgo = Math.floor((now.getTime() - new Date(recentContract.contract.createdAt).getTime()) / (1000 * 60 * 60));
        throw new Error(`Anti-sybil: Must wait ${CONTRACT_CREATION_COOLDOWN_HOURS}h between contracts (last created ${hoursAgo}h ago)`);
    }

    // =============================================================================
    // LEDGER-FIRST: Get terminal failure events from ledger (objective truth)
    // =============================================================================
    const failureEvents = await getTerminalFailureEventsForUser(principalUserId);

    // 4. Failure cooldown (72h after any failure) - USES LEDGER TIMESTAMP
    const failureCooldownCutoff = new Date(now.getTime() - FAILURE_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentFailure = failureEvents.find(e => e.timestamp > failureCooldownCutoff);

    if (recentFailure) {
        const hoursAgo = Math.floor((now.getTime() - recentFailure.timestamp.getTime()) / (1000 * 60 * 60));
        const hoursRemaining = FAILURE_COOLDOWN_HOURS - hoursAgo;
        throw new Error(`Anti-sybil: Failure cooldown active. Wait ${hoursRemaining}h before creating new contracts (last failure at ${recentFailure.timestamp.toISOString()})`);
    }

    // 5. Escalating min lock after failures (MONOTONIC: 1x → 1.5x → 2x) - USES LEDGER
    const failureWindowCutoff = new Date(now.getTime() - FAILURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recentFailures = failureEvents.filter(e => e.timestamp > failureWindowCutoff);

    let minLock = MIN_LOCK_AMOUNT_USD_CENTS;
    let escalationReason = '';
    if (recentFailures.length >= ESCALATION_TIER_2_FAILURES) {
        // 3+ failures → 2.0x (highest tier first for monotonic check)
        minLock = Math.ceil(MIN_LOCK_AMOUNT_USD_CENTS * ESCALATION_TIER_2_MULTIPLIER);
        escalationReason = ` (escalated 2.0x due to ${recentFailures.length} failures in last ${FAILURE_WINDOW_DAYS} days)`;
    } else if (recentFailures.length >= ESCALATION_TIER_1_FAILURES) {
        // 2 failures → 1.5x
        minLock = Math.ceil(MIN_LOCK_AMOUNT_USD_CENTS * ESCALATION_TIER_1_MULTIPLIER);
        escalationReason = ` (escalated 1.5x due to ${recentFailures.length} failures in last ${FAILURE_WINDOW_DAYS} days)`;
    }
    // 0-1 failures → 1.0x (no escalation)

    if (lockAmountUsdCents < minLock) {
        const minDollars = (minLock / 100).toFixed(2);
        throw new Error(`Anti-sybil: Minimum lock amount is $${minDollars}${escalationReason}`);
    }
}


/**
 * Create a new contract
 * Atomically: insert contract record, append CONTRACT_CREATED event, compute record hash
 * State is CREATED after the ledger event is appended (derived, not stored)
 */
export async function createContract(params: CreateContractParams): Promise<Contract> {
    const {
        principalUserId,
        principalIdentityUsername,
        platform,
        metricType,
        condition,
        lockAmountUsdCents,
        payoutAmountUsdCents,
        fundingMethod,
        riskTier = 'STANDARD',
    } = params;

    // =========================================================
    // ANTI-SYBIL VALIDATION (before any other checks)
    // =========================================================
    await validateAntiSybil(principalUserId, lockAmountUsdCents, platform);

    // =========================================================
    // LIVE MARKET VALIDATION & CAPACITY RESERVATION
    // =========================================================
    if (params.marketInstanceId) {
        // 1. Fetch Instance
        const [instance] = await db
            .select()
            .from(marketContractInstances)
            .where(eq(marketContractInstances.id, params.marketInstanceId))
            .limit(1);

        if (!instance) {
            throw new Error(`Market instance not found: ${params.marketInstanceId}`);
        }

        // 2. Validate Status & Time
        /* Allow 'published' and 'closing'. Reject 'expired' or 'paused'. */
        if (!['published', 'closing'].includes(instance.status)) {
            throw new Error(`Market instance is not active (status: ${instance.status})`);
        }

        if (instance.fundingCloseAt < new Date()) {
            throw new Error(`Market instance funding window closed at ${instance.fundingCloseAt.toISOString()}`);
        }

        // 3. Check & Reserve Capacity (Atomic Decrement)
        if (instance.capacityRemaining !== null) {
            const [reserved] = await db
                .update(marketContractInstances)
                .set({
                    capacityRemaining: sql`${marketContractInstances.capacityRemaining} - 1`
                })
                .where(and(
                    eq(marketContractInstances.id, params.marketInstanceId),
                    gt(marketContractInstances.capacityRemaining, 0)
                ))
                .returning();

            if (!reserved) {
                throw new Error('Market instance cap reached (sold out)');
            }
        }
    }

    // =========================================================
    // STRICT CONDITION VALIDATION (per platform/metric)
    // =========================================================
    const cond = condition as any;

    if (typeof cond.operator !== 'string' || !['GTE', 'GT', 'LTE', 'LT', 'EQ'].includes(cond.operator)) {
        throw new Error('Contract condition requires valid operator (GTE, GT, LTE, LT, EQ)');
    }
    if (typeof cond.threshold !== 'number' || cond.threshold < 0) {
        throw new Error('Contract condition requires non-negative numeric threshold');
    }
    if (typeof cond.deadline !== 'string') {
        throw new Error('Contract condition requires deadline (ISO date string)');
    }

    // Platform-specific validation
    if (platform === 'GITHUB' && metricType === 'PRS_MERGED') {
        if (typeof cond.repoOwner !== 'string' || !cond.repoOwner.trim()) {
            throw new Error('GitHub PRs contract requires repoOwner in condition');
        }
        if (typeof cond.repoName !== 'string' || !cond.repoName.trim()) {
            throw new Error('GitHub PRs contract requires repoName in condition');
        }

        // =========================================================
        // TIER GATING: GitHub PRs only allowed in ADVANCED or ELITE
        // =========================================================
        if (riskTier === 'STANDARD') {
            throw new Error('GitHub PRs contracts require ADVANCED or ELITE tier (STANDARD not allowed)');
        }

        // =========================================================
        // MINIMUM THRESHOLD FLOORS
        // =========================================================
        const minThreshold = riskTier === 'ELITE' ? GITHUB_MIN_THRESHOLD_ELITE : GITHUB_MIN_THRESHOLD_ADVANCED;
        if (cond.threshold < minThreshold) {
            throw new Error(`GitHub PRs threshold must be >= ${minThreshold} for ${riskTier} tier`);
        }

        // =========================================================
        // MAXIMUM WINDOW (Deadline - Now <= 30 days)
        // =========================================================
        const deadlineDate = new Date(cond.deadline);
        const now = new Date();
        const windowDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (windowDays > GITHUB_MAX_WINDOW_DAYS) {
            throw new Error(`GitHub PRs window must be <= ${GITHUB_MAX_WINDOW_DAYS} days (got ${windowDays} days)`);
        }
    }

    // =========================================================
    // BASELINE MINIMUM ENFORCEMENT (HARD GATE)
    // No starting from zero. Users must have real metrics.
    // =========================================================
    if (platform === 'X' && (metricType === 'FOLLOWERS' || metricType === 'IMPRESSIONS')) {
        // Will get real baseline after X binding check (validated below)
        // Baseline check happens after baseline snapshot
    }
    if (platform === 'STRIPE' && metricType === 'REVENUE') {
        // Baseline check happens after Stripe snapshot below
    }
    if (platform === 'SHOPIFY' && metricType === 'REVENUE') {
        // Baseline check happens after Shopify snapshot below
    }

    // Snapshot Baseline if needed
    let baselineJson: any = null;
    if (platform === 'STRIPE' && metricType === 'REVENUE') {
        const [userRecord] = await db.select().from(users).where(eq(users.id, principalUserId)).limit(1);

        // ACCOUNT AGE CHECK: Stripe connected account
        const [stripeAccount] = await db
            .select()
            .from(connectedAccounts)
            .where(and(
                eq(connectedAccounts.userId, principalUserId),
                eq(connectedAccounts.platform, 'STRIPE')
            ))
            .limit(1);

        if (!stripeAccount) {
            throw new Error('Cannot create Stripe contract: No connected Stripe account. Connect your Stripe account first.');
        }

        if (stripeAccount.createdAt) {
            const accountAgeDays = Math.floor((Date.now() - new Date(stripeAccount.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS.STRIPE) {
                throw new Error(
                    `Account too new: Stripe account must be at least ${MIN_ACCOUNT_AGE_DAYS.STRIPE} days old. ` +
                    `Your account is ${accountAgeDays} days old.`
                );
            }
        }

        if (!userRecord) {
            throw new Error('Cannot create Stripe contract: User record not found.');
        }

        try {
            const snapshot = await stripeRevenueAdapter.snapshotBaseline(userRecord);
            baselineJson = snapshot.metrics;

            // HARD GATE: Enforce minimum revenue baseline
            const revenueCents = (baselineJson as any)?.revenue30dUsdCents ?? 0;
            const minRevenue = MINIMUM_BASELINES.STRIPE.REVENUE[riskTier];
            if (revenueCents < minRevenue) {
                const minDollars = (minRevenue / 100).toFixed(0);
                const gotDollars = (revenueCents / 100).toFixed(0);
                throw new Error(
                    `Baseline too low: ${riskTier} tier requires minimum $${minDollars}/mo revenue. ` +
                    `Your current 30-day revenue is $${gotDollars}. Build revenue first.`
                );
            }
        } catch (stripeErr) {
            if ((stripeErr as any).message?.includes('Baseline too low')) throw stripeErr;
            if ((stripeErr as any).message?.includes('Account too new')) throw stripeErr;
            console.error('[Contract] Failed to fetch Stripe baseline:', (stripeErr as any).message);
            throw new Error(
                `Failed to fetch Stripe revenue: ${(stripeErr as any).message || 'Unknown error'}. ` +
                `Please try again or reconnect your Stripe account.`
            );
        }

    } else if (platform === 'GITHUB' && metricType === 'PRS_MERGED') {
        const cond = condition as any;
        if (!cond.repoOwner || !cond.repoName) {
            throw new Error('GitHub PRs contract requires repoOwner and repoName in condition');
        }

        // 1. Fetch Connected Account (Immutable Identity Binding)
        const [connected] = await db
            .select()
            .from(connectedAccounts)
            .where(and(
                eq(connectedAccounts.userId, principalUserId),
                eq(connectedAccounts.platform, 'GITHUB')
            ))
            .limit(1);

        if (!connected) {
            throw new Error('Cannot create GitHub contract: User has no connected GitHub account');
        }

        // 2. Fetch repo metadata for eligibility checks
        const client = getGithubClient();
        const repoMeta = await client.getRepoMetadata(cond.repoOwner, cond.repoName);

        // =========================================================
        // REPO ELIGIBILITY CHECKS (Objective, No Subjective Judgement)
        // =========================================================
        const now = new Date();
        const repoAgeDays = Math.floor((now.getTime() - repoMeta.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const pushedAgoDays = Math.floor((now.getTime() - repoMeta.pushedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Check 1: Repo age >= 30 days
        if (repoAgeDays < GITHUB_MIN_REPO_AGE_DAYS) {
            throw new Error(`Cannot create GitHub contract: repo too new (${repoAgeDays} days, minimum ${GITHUB_MIN_REPO_AGE_DAYS})`);
        }

        // Check 2: Repo recently pushed (within 30 days)
        if (pushedAgoDays > GITHUB_MAX_PUSHED_STALENESS_DAYS) {
            throw new Error(`Cannot create GitHub contract: repo stale (last push ${pushedAgoDays} days ago, max ${GITHUB_MAX_PUSHED_STALENESS_DAYS})`);
        }

        // Check 3: Repo size >= 1MB
        if (repoMeta.sizeKb < GITHUB_MIN_REPO_SIZE_KB) {
            throw new Error(`Cannot create GitHub contract: repo too small (${repoMeta.sizeKb}KB, minimum ${GITHUB_MIN_REPO_SIZE_KB}KB)`);
        }

        // 3. Snapshot Baseline (Immutable Data for Verification)
        baselineJson = {
            principalGithubUserId: connected.externalAccountId, // Immutable ID
            defaultBranch: repoMeta.defaultBranch,              // Immutable Target
            repoOwner: cond.repoOwner,
            repoName: cond.repoName,
            // Repo eligibility snapshot (evidence)
            repoCreatedAtUtc: repoMeta.createdAt.toISOString(),
            repoPushedAtUtc: repoMeta.pushedAt.toISOString(),
            repoSizeKb: repoMeta.sizeKb,
        };

    } else if (platform === 'X') {
        // Fetch real follower count from connected X account
        const [xAccount] = await db
            .select()
            .from(connectedAccounts)
            .where(and(
                eq(connectedAccounts.userId, principalUserId),
                eq(connectedAccounts.platform, 'X')
            ))
            .limit(1);

        if (!xAccount) {
            throw new Error('Cannot create X contract: No connected X account. Connect your X account first.');
        }

        let followerCount = 0;
        let xAccountCreatedAt: string | null = null;
        try {
            // Fetch the user's stored OAuth 1.0a tokens from the users table
            const [userRecord] = await db
                .select({
                    xAccessToken: users.xAccessToken,
                    xAccessTokenSecret: users.xAccessTokenSecret,
                    xAccountCreatedAt: users.xAccountCreatedAt,
                })
                .from(users)
                .where(eq(users.id, principalUserId))
                .limit(1);

            const xApiKey = process.env.X_API_KEY;
            const xApiSecret = process.env.X_API_SECRET;

            if (userRecord?.xAccessToken && userRecord?.xAccessTokenSecret && xApiKey && xApiSecret) {
                // Use OAuth 1.0a verify_credentials — works on ALL X API tiers (including Free)
                const { createHmac, randomBytes } = await import('crypto');
                const nonce = randomBytes(16).toString('hex');
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const verifyUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';

                const percentEncode = (s: string) => encodeURIComponent(s)
                    .replace(/!/g, '%21').replace(/'/g, '%27')
                    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');

                const oauthParams: Record<string, string> = {
                    oauth_consumer_key: xApiKey,
                    oauth_nonce: nonce,
                    oauth_signature_method: 'HMAC-SHA1',
                    oauth_timestamp: timestamp,
                    oauth_token: userRecord.xAccessToken,
                    oauth_version: '1.0',
                };

                // Generate signature
                const sortedParams = Object.keys(oauthParams).sort()
                    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
                    .join('&');
                const signatureBase = ['GET', percentEncode(verifyUrl), percentEncode(sortedParams)].join('&');
                const signingKey = `${percentEncode(xApiSecret)}&${percentEncode(userRecord.xAccessTokenSecret)}`;
                const signature = createHmac('sha1', signingKey).update(signatureBase).digest('base64');
                oauthParams.oauth_signature = signature;

                const authHeader = 'OAuth ' + Object.keys(oauthParams).sort()
                    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
                    .join(', ');

                const response = await fetch(verifyUrl, {
                    headers: { 'Authorization': authHeader },
                });

                if (!response.ok) {
                    throw new Error(`X verify_credentials failed (${response.status})`);
                }

                const userData = await response.json() as {
                    followers_count: number;
                    created_at: string;
                };

                followerCount = userData.followers_count;
                xAccountCreatedAt = new Date(userData.created_at).toISOString();
                console.log(`[Contract] X verify_credentials: followers=${followerCount}, created=${xAccountCreatedAt}`);
            } else {
                // Fallback: use stored metadata from connection time
                const meta = xAccount.metadataJson as { followersCount?: number; accountCreatedAt?: string } | null;
                followerCount = meta?.followersCount ?? 0;
                xAccountCreatedAt = meta?.accountCreatedAt ?? null;
                console.log(`[Contract] X using stored metadata: followers=${followerCount}`);
            }
        } catch (xErr) {
            console.error('[Contract] Failed to fetch X account info:', (xErr as any).message);
            throw new Error(
                `Failed to fetch X follower count: ${(xErr as any).message || 'Unknown error'}. ` +
                `Please try again or reconnect your X account.`
            );
        }

        // ACCOUNT AGE CHECK: X account
        if (xAccountCreatedAt) {
            const accountAgeDays = Math.floor((Date.now() - new Date(xAccountCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS.X) {
                throw new Error(
                    `Account too new: X account must be at least ${MIN_ACCOUNT_AGE_DAYS.X} days old. ` +
                    `Your account is ${accountAgeDays} days old.`
                );
            }
        }

        // FOLLOWER MINIMUM CHECK
        const minFollowers = MINIMUM_BASELINES.X.FOLLOWERS[riskTier];
        if (followerCount < minFollowers) {
            throw new Error(
                `Baseline too low: ${riskTier} tier requires minimum ${minFollowers} followers. ` +
                `Got ${followerCount}. You need an existing audience to create a contract.`
            );
        }

        baselineJson = { followersCount: followerCount, accountCreatedAt: xAccountCreatedAt };
    } else if (platform === 'SHOPIFY') {
        // ACCOUNT AGE CHECK: Shopify connected account
        const [shopifyAccount] = await db
            .select()
            .from(connectedAccounts)
            .where(and(
                eq(connectedAccounts.userId, principalUserId),
                eq(connectedAccounts.platform, 'SHOPIFY')
            ))
            .limit(1);

        if (!shopifyAccount) {
            throw new Error('Cannot create Shopify contract: No connected Shopify account. Connect your store first.');
        }

        if (shopifyAccount.createdAt) {
            const accountAgeDays = Math.floor((Date.now() - new Date(shopifyAccount.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS.SHOPIFY) {
                throw new Error(
                    `Account too new: Shopify store must be at least ${MIN_ACCOUNT_AGE_DAYS.SHOPIFY} days old. ` +
                    `Your account is ${accountAgeDays} days old.`
                );
            }
        }

        // Fetch real Shopify revenue baseline
        try {
            const { shopifyAdapter } = await import('../adapters/shopify.js');
            const snapshot = await shopifyAdapter.snapshotBaseline(principalUserId);
            baselineJson = snapshot;

            // HARD GATE: Enforce minimum revenue baseline per tier
            const netCents = snapshot.netCents ?? 0;
            const minRevenue = MINIMUM_BASELINES.SHOPIFY?.REVENUE?.[riskTier] ?? 100_000;
            if (netCents < minRevenue) {
                const minDollars = (minRevenue / 100).toFixed(0);
                const gotDollars = (netCents / 100).toFixed(0);
                throw new Error(
                    `Baseline too low: ${riskTier} tier requires minimum $${minDollars}/mo revenue. ` +
                    `Your current 30-day Shopify revenue is $${gotDollars}. Build revenue first.`
                );
            }

            console.log(`[Contract] Shopify baseline: $${(netCents / 100).toFixed(2)} net revenue (${snapshot.orderCount} orders)`);
        } catch (shopErr) {
            if ((shopErr as any).message?.includes('Baseline too low')) throw shopErr;
            if ((shopErr as any).message?.includes('Account too new')) throw shopErr;
            console.error('[Contract] Failed to fetch Shopify baseline:', (shopErr as any).message);
            throw new Error('Cannot create Shopify contract: Failed to verify store revenue. Ensure your Shopify account is connected and has recent orders.');
        }
    } else if (platform === 'YOUTUBE') {
        // Fetch real YouTube baseline from connected account
        try {
            const { youtubeAdapter } = await import('../adapters/youtube.js');
            const snapshot = await youtubeAdapter.snapshotBaseline(principalUserId);
            baselineJson = snapshot;

            // ============================================================
            // TEMP DISABLED FOR TESTING — RE-ENABLE AFTER TEST
            // ============================================================

            // // ANTI-GAMING: Channel age check
            // if (snapshot.channelCreatedAt) {
            //     const channelAgeDays = Math.floor((Date.now() - new Date(snapshot.channelCreatedAt).getTime()) / (1000 * 60 * 60 * 24));
            //     if (channelAgeDays < MIN_ACCOUNT_AGE_DAYS.YOUTUBE) {
            //         throw new Error(
            //             `Account too new: YouTube channel must be at least ${MIN_ACCOUNT_AGE_DAYS.YOUTUBE} days old. ` +
            //             `Your channel is ${channelAgeDays} days old.`
            //         );
            //     }
            // }

            // // ANTI-GAMING: Minimum video count
            // if (snapshot.videoCount < 10) {
            //     throw new Error(
            //         `Not enough content: YouTube channel must have at least 10 videos. ` +
            //         `Your channel has ${snapshot.videoCount} videos.`
            //     );
            // }

            // // ANTI-GAMING: Subscriber count must be visible
            // if (snapshot.hiddenSubscriberCount) {
            //     throw new Error(
            //         'Cannot create YouTube contract: Subscriber count is hidden. ' +
            //         'Make your subscriber count public in YouTube Studio settings.'
            //     );
            // }

            // // HARD GATE: Enforce minimum baselines per tier
            // if (metricType === 'SUBSCRIBERS') {
            //     const minSubs = MINIMUM_BASELINES.YOUTUBE.SUBSCRIBERS[riskTier];
            //     if (snapshot.subscribers < minSubs) {
            //         throw new Error(
            //             `Baseline too low: ${riskTier} tier requires minimum ${minSubs.toLocaleString()} subscribers. ` +
            //             `Got ${snapshot.subscribers.toLocaleString()}. Build your audience first.`
            //         );
            //     }
            // } else if (metricType === 'VIEWS') {
            //     const minViews = MINIMUM_BASELINES.YOUTUBE.VIEWS[riskTier];
            //     if (snapshot.views30d < minViews) {
            //         throw new Error(
            //             `Baseline too low: ${riskTier} tier requires minimum ${minViews.toLocaleString()} views in 30 days. ` +
            //             `Got ${snapshot.views30d.toLocaleString()}. Build viewership first.`
            //         );
            //     }
            // }

            // ============================================================
            // END TEMP DISABLED
            // ============================================================

            console.log(`[Contract] YouTube baseline: ${snapshot.subscribers} subs, ${snapshot.views30d} 30d views, ${snapshot.videoCount} videos`);
        } catch (ytErr) {
            // if ((ytErr as any).message?.includes('Baseline too low')) throw ytErr;  // TEMP DISABLED
            // if ((ytErr as any).message?.includes('Account too new')) throw ytErr;   // TEMP DISABLED
            // if ((ytErr as any).message?.includes('Not enough content')) throw ytErr; // TEMP DISABLED
            // if ((ytErr as any).message?.includes('Subscriber count is hidden')) throw ytErr; // TEMP DISABLED
            console.error('[Contract] Failed to fetch YouTube baseline:', (ytErr as any).message);
            throw new Error('Cannot create YouTube contract: Failed to verify channel data. Ensure your YouTube account is connected.');
        }
    }

    const deadlineUtc = new Date(condition.deadline);

    // Insert contract record (no status column - state derived from ledger)
    const newContract: NewContract = {
        principalUserId,
        principalIdentityUsername,
        platform,
        metricType,
        conditionJson: condition,
        baselineJson, // Stored here
        deadlineUtc,
        lockAmountUsdCents,
        payoutAmountUsdCents,
        fundingMethod: fundingMethod || 'USD_CARD',
        riskTier,
        marketInstanceId: params.marketInstanceId,
    };

    const [inserted] = await db.insert(contracts).values(newContract).returning();

    // Append CONTRACT_CREATED event - this makes the contract state = CREATED
    // Include precommitted payout terms as ledger evidence (receipt)
    // CRITICAL: Pass deadlineUtc to populate contract_index.deadlineUtc
    const event = await appendEvent({
        contractId: inserted.id,
        actor: 'USER',
        eventType: EventType.CONTRACT_CREATED,
        amountUsdCents: lockAmountUsdCents,
        deadlineUtc,  // Populate contract_index.deadlineUtc for job candidate selection
        metadata: {
            condition,
            baseline: baselineJson,
            // PRECOMMITTED TERMS (receipt)
            lockAmountUsdCents,
            payoutAmountUsdCents,
        },
    });

    // Compute and update record hash
    const recordHash = computeRecordHash(newContract, event.id);
    const [updated] = await db
        .update(contracts)
        .set({ recordHash })
        .where(eq(contracts.id, inserted.id))
        .returning();

    // If baseline exists, emit BASELINE_SNAPSHOTTED event (immutable ledger receipt)
    if (baselineJson) {
        await appendEvent({
            contractId: inserted.id,
            actor: 'SYSTEM',
            eventType: EventType.BASELINE_SNAPSHOTTED,
            metadata: {
                snapshotAt: new Date().toISOString(),
                platform,
                metricType,
                ...baselineJson,
            },
        });
    }

    return updated;
}

/**
 * Append a state-changing event to a contract
 * Validates that the transition is allowed before appending
 */
export async function appendContractEvent(
    contractId: string,
    options: {
        actor: 'SYSTEM' | 'USER';
        eventType: keyof typeof EventType;
        amountUsdCents?: number;
        externalRef?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<{ success: boolean; error?: string }> {
    // Get current state
    const events = await getEventsForContract(contractId);
    const currentState = deriveState(events);

    if (!currentState) {
        return { success: false, error: 'Contract has no events' };
    }

    // The event type determines what state we're transitioning to
    // Append the event - validation happens in deriveState
    await appendEvent({
        contractId,
        actor: options.actor,
        eventType: EventType[options.eventType],
        amountUsdCents: options.amountUsdCents,
        externalRef: options.externalRef,
        metadata: options.metadata,
    });

    return { success: true };
}

/**
 * Update contract baseline JSON (for freezing at execution)
 * 
 * SECURITY-CRITICAL: This is the ONLY way to update baselineJson after creation.
 * Used to freeze the identity binding and baseline metrics at EXECUTION_CONFIRMED.
 * 
 * IMMUTABILITY GUARD: Rejects updates if contract is already in LOCKED or terminal state.
 * This ensures the frozen baseline cannot be tampered with after execution.
 */
export class BaselineImmutableError extends Error {
    constructor(contractId: string, currentState: string) {
        super(`Cannot update baseline for contract ${contractId} in state ${currentState}. Baseline is immutable after execution.`);
        this.name = 'BaselineImmutableError';
    }
}

export async function updateContractBaseline(
    contractId: string,
    baselineJson: Record<string, unknown>
): Promise<void> {
    // 1. Get contract and derive state
    const contract = await getContract(contractId);
    if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
    }

    // 2. Get events and derive current state
    const events = await getEventsForContract(contractId);
    const currentState = deriveState(events);

    // 3. IMMUTABILITY GUARD: Reject if already LOCKED or terminal
    const immutableStates = [
        'LOCKED',
        'SETTLED',
        'FORFEITED',
    ];

    if (currentState && immutableStates.includes(currentState)) {
        throw new BaselineImmutableError(contractId, currentState);
    }

    // 4. Perform update
    await db
        .update(contracts)
        .set({ baselineJson })
        .where(eq(contracts.id, contractId));
}


/**
 * Get contracts that are due for verification (state = LOCKED + past deadline)
 */
/**
 * Effective settlement date for a contract.
 *
 * Income (bank) contracts settle ONCE at deadline + a short posting-lag grace
 * window (default 7 days), so a deposit DATED inside the contract window has
 * time to finish posting before we read the bank.
 *
 * This delays only WHEN we check. It does not extend the measured window: a
 * deposit dated after the deadline belongs to the next contract, so each
 * deposit still counts toward exactly one contract. No re-check, no clawback.
 *
 * Every other platform returns deadlineUtc unchanged.
 */
export function getEffectiveSettlementAt(contract: Contract): Date {
    if (contract.platform !== 'PLAID') return contract.deadlineUtc;

    const frozen = contract.baselineJson as {
        graceDays?: number;
        incomeTerms?: { settlementDueUtc?: string };
    } | null;

    // PREFER THE FROZEN INSTANT. The closing date is agreed at lock and read back
    // verbatim — never re-derived. Recomputing it would let a later change to the
    // posting buffer, or a timezone/DST shift, move a contract's closing date
    // after the user signed. That is the dispute we are not going to have.
    const frozenDue = frozen?.incomeTerms?.settlementDueUtc;
    if (frozenDue) {
        const parsed = new Date(frozenDue);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    // Legacy/fallback only: contracts locked before the instant was frozen.
    return computeSettlementDate(contract.deadlineUtc, frozen?.graceDays);
}

export async function getContractsDueForVerification(): Promise<Contract[]> {
    // Get all contracts, then filter by derived state
    const allContracts = await db.select().from(contracts);

    const now = new Date();
    const results: Contract[] = [];

    for (const contract of allContracts) {
        // Income contracts settle after their posting-lag grace; all others at deadline
        if (getEffectiveSettlementAt(contract) > now) continue;

        const events = await getEventsForContract(contract.id);
        const state = deriveState(events);

        if (state === 'LOCKED') {
            results.push(contract);
        }
    }

    return results;
}

// Re-export for backwards compatibility
export { canTransition, InvalidTransitionError };
