/**
 * Contract Routes (Read-Only)
 * 
 * All endpoints return derived state computed from ledger events.
 * No state is persisted on the contract record.
 */

import { FastifyPluginAsync } from 'fastify';
import { getContract, getContractWithState, getContractsForUser } from '../services/contracts.js';
import { getEventsForContract } from '../services/ledger.js';
import { deriveState } from '../services/state-derivation.js';
import { db } from '../db/client.js';
import { ledgerEvents, contracts, EventType } from '../db/schema.js';
import { desc, inArray, sql } from 'drizzle-orm';
import { timingSafeEqual } from 'crypto';

/**
 * FAILS CLOSED WHEN ADMIN_API_KEY IS UNSET.
 *
 * The admin routes below compared the header straight against the env var:
 *
 *     const isValid = adminKey === process.env.ADMIN_API_KEY;
 *
 * If ADMIN_API_KEY is not set in the environment, that is
 * `undefined === undefined`, which is TRUE — a request carrying no
 * x-admin-key header at all passes the check. On a deploy where the variable
 * was never configured, /v1/admin/reseed is world-callable, and it begins by
 * deleting every row in market_contract_instances and contract_templates.
 *
 * A missing secret must deny, never allow. The comparison is also
 * length-checked and constant-time so the endpoint does not leak the key one
 * byte at a time.
 */
function isAdmin(request: { headers: Record<string, unknown> }): boolean {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
        console.error('[admin] ADMIN_API_KEY is not configured — refusing admin request');
        return false;
    }
    const raw = request.headers['x-admin-key'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (typeof provided !== 'string' || provided.length === 0) return false;

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

const contractRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /contracts/:id
     * Single contract view with derived state
     * Powers: Contract Receipt (/contract/:id) in Aura
     */
    fastify.get<{
        Params: { id: string };
    }>('/contracts/:id', async (request, reply) => {
        const { id } = request.params;

        const result = await getContractWithState(id);

        if (!result) {
            reply.status(404);
            return { error: 'Contract not found' };
        }

        const { contract, state } = result;
        const events = await getEventsForContract(id);

        return {
            contract: {
                id: contract.id,
                principalUserId: contract.principalUserId,
                principalIdentityUsername: contract.principalIdentityUsername,
                platform: contract.platform,
                metricType: contract.metricType,
                condition: contract.conditionJson,
                baseline: contract.baselineJson,
                deadline: contract.deadlineUtc.toISOString(),
                lockAmountUsdCents: contract.lockAmountUsdCents,
                fundingMethod: contract.fundingMethod,
                riskTier: contract.riskTier,
                state, // Derived from ledger events, never persisted
                recordHash: contract.recordHash,
                socialBonusEnabled: contract.socialBonusEnabled ?? false,
                socialBonusVerified: contract.socialBonusVerified ?? false,
                socialBonusTweetId: contract.socialBonusTweetId ?? null,
                createdAt: contract.createdAt.toISOString(),
                updatedAt: contract.updatedAt.toISOString(),
            },
            events: events.map(event => ({
                id: event.id,
                actor: event.actor,
                eventType: event.eventType,
                timestamp: event.timestampUtc.toISOString(),
                amountUsdCents: event.amountUsdCents,
                externalRef: event.externalRef,
                metadata: event.metadataJson,
                eventHash: event.eventHash,
            })),
        };
    });

    /**
     * GET /contracts/:id/ledger
     * Ordered ledger events for a contract
     */
    fastify.get<{
        Params: { id: string };
    }>('/contracts/:id/ledger', async (request, reply) => {
        const { id } = request.params;

        const contract = await getContract(id);
        if (!contract) {
            reply.status(404);
            return { error: 'Contract not found' };
        }

        const events = await getEventsForContract(id);

        return {
            contractId: id,
            events: events.map(event => ({
                id: event.id,
                actor: event.actor,
                eventType: event.eventType,
                timestamp: event.timestampUtc.toISOString(),
                amountUsdCents: event.amountUsdCents,
                externalRef: event.externalRef,
                metadata: event.metadataJson,
                prevEventHash: event.prevEventHash,
                eventHash: event.eventHash,
            })),
        };
    });

    /**
     * GET /me/contracts
     * Authenticated user's contracts with derived states
     */
    fastify.get('/me/contracts', async (request, reply) => {
        // @ts-ignore - userId set by auth middleware
        const userId = request.userId;

        if (!userId) {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        const contractsWithState = await getContractsForUser(userId);

        return {
            contracts: contractsWithState.map(({ contract, state }) => ({
                id: contract.id,
                principalIdentityUsername: contract.principalIdentityUsername,
                platform: contract.platform,
                metricType: contract.metricType,
                condition: contract.conditionJson,
                deadline: contract.deadlineUtc.toISOString(),
                lockAmountUsdCents: contract.lockAmountUsdCents,
                riskTier: contract.riskTier,
                state, // Derived from ledger events
                socialBonusEnabled: contract.socialBonusEnabled ?? false,
                createdAt: contract.createdAt.toISOString(),
            })),
        };
    });

    /**
     * GET /v1/ledger
     * Public ledger of executed contract events
     * Powers: Public Record page (/ledger) in Aura
     * 
     * Returns events from all executed contracts (FUNDS_LOCKED and beyond).
     * No authentication required - this is a public transparency feed.
     */
    fastify.get('/v1/ledger', async (request, reply) => {
        try {
            let rows: any[];

            try {
                // Try full UNION ALL with rivalry events
                const result = await db.execute(sql`
                    (
                        SELECT
                            le.id::text,
                            le.contract_id::text AS "sourceId",
                            'CONTRACT' AS "sourceType",
                            le.event_type::text AS "eventType",
                            le.timestamp_utc AS "timestampUtc",
                            le.amount_usd_cents AS "amountUsdCents",
                            le.event_hash AS "eventHash",
                            le.actor::text,
                            c.platform::text,
                            c.principal_identity_username AS "principal",
                            c.lock_amount_usd_cents AS "lockAmountUsdCents",
                            c.risk_tier::text AS "riskTier"
                        FROM ledger_events le
                        INNER JOIN contracts c ON le.contract_id = c.id
                        WHERE le.event_type::text IN (
                            'FUNDS_LOCKED', 'EXECUTION_CONFIRMED',
                            'SETTLED_SUCCESS', 'SETTLED_FAILURE'
                        )
                    )
                    UNION ALL
                    (
                        SELECT
                            rle.id::text,
                            rle.rivalry_id::text AS "sourceId",
                            'RIVALRY' AS "sourceType",
                            rle.event_type::text AS "eventType",
                            rle.timestamp_utc AS "timestampUtc",
                            rle.amount_usd_cents AS "amountUsdCents",
                            rle.event_hash AS "eventHash",
                            rle.actor::text,
                            r.platform::text,
                            COALESCE(
                                (SELECT i.username FROM identities i WHERE i.user_id = r.challenger_user_id AND i.status = 'ACTIVE' LIMIT 1),
                                'unknown'
                            ) AS "principal",
                            (r.stake_per_side_cents * 2)::integer AS "lockAmountUsdCents",
                            'DUEL'::text AS "riskTier"
                        FROM rivalry_ledger_events rle
                        INNER JOIN rivalries r ON rle.rivalry_id = r.id
                        WHERE rle.event_type::text IN (
                            'RIVALRY_CREATED', 'RIVALRY_ACCEPTED',
                            'RIVALRY_SETTLED', 'RIVALRY_DRAW'
                        )
                    )
                    ORDER BY "timestampUtc" DESC
                    LIMIT 200
                `);
                rows = (result as any).rows || result;
            } catch (unionErr: any) {
                // Fallback: rivalry tables may not exist yet
                console.error('[Ledger] UNION failed — full error:', unionErr.message, unionErr.stack);
                const result = await db.execute(sql`
                    SELECT
                        le.id,
                        le.contract_id AS "sourceId",
                        'CONTRACT' AS "sourceType",
                        le.event_type AS "eventType",
                        le.timestamp_utc AS "timestampUtc",
                        le.amount_usd_cents AS "amountUsdCents",
                        le.event_hash AS "eventHash",
                        le.actor,
                        c.platform,
                        c.principal_identity_username AS "principal",
                        c.lock_amount_usd_cents AS "lockAmountUsdCents",
                        c.risk_tier AS "riskTier"
                    FROM ledger_events le
                    INNER JOIN contracts c ON le.contract_id = c.id
                    WHERE le.event_type IN (
                        'FUNDS_LOCKED', 'EXECUTION_CONFIRMED',
                        'SETTLED_SUCCESS', 'SETTLED_FAILURE'
                    )
                    ORDER BY le.timestamp_utc DESC
                    LIMIT 200
                `);
                rows = (result as any).rows || result;
            }

            return {
                events: rows.map((row: any) => ({
                    id: row.id,
                    contractId: row.sourceId,
                    sourceType: row.sourceType,
                    eventType: row.eventType,
                    timestamp: row.timestampUtc instanceof Date
                        ? row.timestampUtc.toISOString()
                        : row.timestampUtc,
                    amountUsdCents: row.amountUsdCents,
                    eventHash: row.eventHash,
                    actor: row.actor,
                    platform: row.platform,
                    principal: row.principal,
                    lockAmountUsdCents: row.lockAmountUsdCents,
                    riskTier: row.riskTier,
                })),
            };
        } catch (error) {
            console.error('[Ledger] Error fetching public ledger:', error);
            reply.status(500);
            return { error: 'Failed to fetch ledger events' };
        }
    });

    /**
     * GET /v1/results
     * Public results feed — settled contracts and rivalries
     * Powers: Public Results page (/results) in Aura
     * No authentication required.
     */
    fastify.get('/v1/results', async (request, reply) => {
        try {
            const result = await db.execute(sql`
                (
                    SELECT
                        c.id,
                        'CONTRACT' AS "sourceType",
                        c.platform,
                        c.principal_identity_username AS "principal",
                        c.lock_amount_usd_cents AS "stakeCents",
                        c.risk_tier AS "riskTier",
                        ci.current_state AS "outcome",
                        ci.updated_at AS "settledAt",
                        CASE
                            WHEN ci.current_state = 'SETTLED_SUCCESS' THEN 'WIN'
                            WHEN ci.current_state = 'SETTLED_FAILURE' THEN 'LOSS'
                            ELSE 'PENDING'
                        END AS "result"
                    FROM contracts c
                    INNER JOIN contract_index ci ON ci.contract_id = c.id
                    WHERE ci.current_state IN ('SETTLED_SUCCESS', 'SETTLED_FAILURE')
                )
                UNION ALL
                (
                    SELECT
                        r.id,
                        'RIVALRY' AS "sourceType",
                        r.platform,
                        u.display_name AS "principal",
                        r.stake_per_side_cents * 2 AS "stakeCents",
                        r.rivalry_tier AS "riskTier",
                        r.status AS "outcome",
                        r.settled_at AS "settledAt",
                        CASE
                            WHEN r.status = 'SETTLED' THEN 'WIN'
                            WHEN r.status = 'DRAW' THEN 'DRAW'
                            WHEN r.status = 'BOTH_MISS' THEN 'BOTH_MISS'
                            ELSE 'PENDING'
                        END AS "result"
                    FROM rivalries r
                    INNER JOIN users u ON r.challenger_user_id = u.id
                    WHERE r.status IN ('SETTLED', 'DRAW', 'BOTH_MISS')
                )
                ORDER BY "settledAt" DESC NULLS LAST
                LIMIT 100
            `);

            const rows = (result as any).rows || result;

            return {
                results: rows.map((row: any) => {
                    // Anonymize username: show first 3 chars + ***
                    const name = row.principal || 'Anonymous';
                    const anonymized = name.length > 3 ? name.slice(0, 3) + '***' : name;

                    return {
                        id: row.id,
                        sourceType: row.sourceType,
                        platform: row.platform,
                        principal: anonymized,
                        stakeCents: row.stakeCents,
                        riskTier: row.riskTier,
                        result: row.result,
                        settledAt: row.settledAt instanceof Date
                            ? row.settledAt.toISOString()
                            : row.settledAt,
                    };
                }),
            };
        } catch (error) {
            console.error('[Results] Error:', error);
            reply.status(500);
            return { error: 'Failed to fetch results' };
        }
    });

    /**
     * GET /v1/ledger/contracts
     *
     * Solo contracts for the public register, INCLUDING ONES THAT HAVE NOT
     * SETTLED. /v1/results deliberately filters to SETTLED_SUCCESS and
     * SETTLED_FAILURE, which is right for a results feed and wrong for an
     * append-only ledger: a contract is a public commitment the moment it is
     * written, and a register that only shows finished business cannot show
     * anything a user just created.
     *
     * Read-only, no auth, and it carries no more identity than /v1/results
     * does — the principal is anonymised the same way.
     */
    fastify.get('/v1/ledger/contracts', async (request, reply) => {
        try {
            const result = await db.execute(sql`
                SELECT
                    c.id,
                    c.platform,
                    c.metric_type       AS "metricType",
                    c.principal_identity_username AS "principal",
                    c.lock_amount_usd_cents       AS "stakeCents",
                    c.payout_amount_usd_cents     AS "payoutCents",
                    c.risk_tier         AS "riskTier",
                    c.record_hash       AS "recordHash",
                    c.deadline_utc      AS "deadlineUtc",
                    c.created_at        AS "createdAt",
                    ci.current_state    AS "state",
                    ci.updated_at       AS "updatedAt"
                FROM contracts c
                INNER JOIN contract_index ci ON ci.contract_id = c.id
                WHERE ci.current_state NOT IN ('DRAFT', 'CANCELLED')
                ORDER BY c.created_at DESC
                LIMIT 100
            `);

            const rows = (result as any).rows || result;
            const iso = (v: any) => (v instanceof Date ? v.toISOString() : v);

            return {
                ok: true,
                contracts: rows.map((row: any) => {
                    const name = row.principal || 'Anonymous';
                    const anonymized = name.length > 3 ? name.slice(0, 3) + '***' : name;
                    const state = String(row.state || '');
                    return {
                        id: row.id,
                        platform: row.platform,
                        metricType: row.metricType,
                        principal: anonymized,
                        stakeCents: Number(row.stakeCents) || 0,
                        payoutCents: Number(row.payoutCents) || 0,
                        riskTier: row.riskTier,
                        recordHash: row.recordHash,
                        deadlineUtc: iso(row.deadlineUtc),
                        createdAt: iso(row.createdAt),
                        updatedAt: iso(row.updatedAt),
                        state,
                        result: state === 'SETTLED_SUCCESS' ? 'WIN'
                            : state === 'SETTLED_FAILURE' ? 'LOSS'
                                : 'PENDING',
                    };
                }),
            };
        } catch (error) {
            console.error('[LedgerContracts] Error:', error);
            reply.status(500);
            return { ok: false, error: 'Failed to fetch contracts' };
        }
    });

    /**
     * POST /v1/admin/reseed
     * Nuke stale market listings and reseed with correct terms.
     * Hit this once after deploy: POST https://collateral-production.up.railway.app/v1/admin/reseed
     */
    fastify.post('/v1/admin/reseed', async (request, reply) => {
        if (!isAdmin(request)) {
            reply.status(403);
            return { error: 'Unauthorized: Admin access required' };
        }

        try {
            // Nuke old listings
            await db.execute(sql`DELETE FROM market_stats_cache`);
            await db.execute(sql`DELETE FROM market_contract_instances`);
            await db.execute(sql`DELETE FROM contract_templates`);

            // Re-seed fresh
            const { seedCatalog } = await import('../db/seed-catalog.js');
            await seedCatalog();

            // Verify
            const countResult = await db.execute(sql`
                SELECT count(*) as total FROM market_contract_instances
                WHERE status = 'published' AND funding_close_at > NOW()
            `);
            const total = (countResult as any).rows?.[0]?.total || 0;

            return { success: true, message: `Reseeded. ${total} active listings live.` };
        } catch (error) {
            console.error('[Admin Reseed] Error:', error);
            reply.status(500);
            return { error: 'Reseed failed: ' + (error as any).message };
        }
    });

    /**
     * POST /v1/admin/seed-activity
     * Populate the site with simulated contracts + rivalries for social proof.
     * Requires x-admin-key header.
     */
    fastify.post('/v1/admin/seed-activity', async (request, reply) => {
        if (!isAdmin(request)) {
            reply.status(403);
            return { error: 'Unauthorized: Admin access required' };
        }

        try {
            const { seedSimulatedActivity } = await import('../db/seed-activity.js');
            const result = await seedSimulatedActivity();
            return { success: true, ...result };
        } catch (error) {
            console.error('[Admin Seed Activity] Error:', error);
            reply.status(500);
            return { error: 'Seed activity failed: ' + (error as any).message };
        }
    });
};

export default contractRoutes;
