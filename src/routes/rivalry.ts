// @ts-nocheck
/**
 * Rivalry Routes
 * 
 * Full API for head-to-head operator duels.
 * 
 * POST   /v1/rivalries           — Issue a challenge
 * GET    /v1/rivalries            — List rivalries (filterable)
 * GET    /v1/rivalries/me         — My rivalries
 * GET    /v1/rivalries/stats      — Aggregate stats
 * GET    /v1/rivalries/:id        — Rivalry detail
 * POST   /v1/rivalries/:id/accept — Accept a challenge
 * POST   /v1/rivalries/:id/decline — Decline a challenge
 * POST   /v1/rivalries/:id/fund   — Fund your side
 * GET    /v1/rivalries/:id/events — Rivalry ledger events
 * GET    /v1/rivalries/:id/metrics — Live metric snapshots
 * GET    /v1/rivalries/:id/share  — Public shareable data
 * POST   /v1/rivalries/:id/settle — Trigger settlement (system/admin)
 */

import { FastifyPluginAsync } from 'fastify';
import { getPrincipal, requireAuth } from '../services/auth.js';
import {
    createRivalry, acceptRivalry, declineRivalry, fundRivalry,
    listRivalries, getRivalryDetail, getRivalryEvents,
} from '../services/rivalry.js';
import { settleRivalry } from '../services/rivalry-settlement.js';
import { db } from '../db/client.js';
import { rivalries, rivalryMetricSnapshots, rivalryParticipants } from '../db/schema.js';
import { eq, or, asc, desc, sql } from 'drizzle-orm';

/* The market draws one card per rivalry and pages through the feed, so the
   default page had to be big enough to be worth a round-trip and the ceiling
   high enough that a board is fetched in a handful of calls. Clamped rather
   than trusted: `limit` arrives from the query string, and NaN or a negative
   silently becomes `slice(0, NaN)` — an empty board — inside listRivalries. */
const DEFAULT_PAGE = 50;
const MAX_PAGE = 200;

function pageLimit(raw: unknown): number {
    const n = parseInt(String(raw ?? ''), 10);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE;
    return Math.min(n, MAX_PAGE);
}

function pageOffset(raw: unknown): number {
    const n = parseInt(String(raw ?? ''), 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}

const rivalryRoutes: FastifyPluginAsync = async (fastify) => {

    // =========================================================================
    // POST /v1/rivalries — Issue a challenge
    // =========================================================================
    fastify.post('/v1/rivalries', { preHandler: requireAuth }, async (request, reply) => {
        let userId: string;
        try {
            userId = getPrincipal(request);
        } catch {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        const body = request.body as any;
        const { opponentUsername, platform, metricType, metricKey, stakePerSideCents, durationDays, rivalryTier } = body;

        if (!platform || !metricType || !metricKey || !stakePerSideCents || !durationDays) {
            reply.status(400);
            return { error: 'Missing required fields: platform, metricType, metricKey, stakePerSideCents, durationDays' };
        }

        try {
            const rivalry = await createRivalry({
                challengerUserId: userId,
                opponentUsername: opponentUsername || null,
                platform,
                metricType,
                metricKey,
                stakePerSideCents: parseInt(stakePerSideCents),
                durationDays: parseInt(durationDays),
                rivalryTier: rivalryTier || 'DUEL',
            });

            return { ok: true, rivalry };
        } catch (err: any) {
            reply.status(400);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries — List all rivalries
    // =========================================================================
    fastify.get('/v1/rivalries', async (request, reply) => {
        const query = request.query as any;
        const { status, limit, offset } = query;

        try {
            const result = await listRivalries({
                status,
                limit: pageLimit(limit),
                offset: pageOffset(offset),
            });
            return { ok: true, ...result };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/me — My rivalries
    // =========================================================================
    fastify.get('/v1/rivalries/me', { preHandler: requireAuth }, async (request, reply) => {
        let userId: string;
        try {
            userId = getPrincipal(request);
        } catch {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        const query = request.query as any;

        try {
            const result = await listRivalries({
                userId,
                status: query.status,
                limit: pageLimit(query.limit),
                offset: pageOffset(query.offset),
            });
            return { ok: true, ...result };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/stats — Aggregate stats
    // =========================================================================
    fastify.get('/v1/rivalries/stats', async (request, reply) => {
        try {
            const { getRivalryState } = await import('../services/rivalry.js');
            const allRivalries = await db.select().from(rivalries);

            // Count by state (we derive state per rivalry)
            let active = 0;
            let totalCapitalCents = 0;
            let largestPoolCents = 0;
            let totalSettled = 0;

            for (const r of allRivalries) {
                const pool = r.stakePerSideCents * 2;
                try {
                    const state = await getRivalryState(r.id);

                    if (state === 'ACTIVE' || state === 'VERIFYING' || state === 'BOTH_FUNDED') {
                        active++;
                        totalCapitalCents += pool;
                    }
                    if (state === 'SETTLED' || state === 'DRAW') {
                        totalSettled++;
                    }
                } catch (stateErr) {
                    // Skip this rivalry if state derivation fails
                    console.warn(`[stats] Failed to derive state for rivalry ${r.id}:`, stateErr);
                }
                if (pool > largestPoolCents) {
                    largestPoolCents = pool;
                }
            }

            return {
                ok: true,
                stats: {
                    totalRivalries: allRivalries.length,
                    activeRivalries: active,
                    settledRivalries: totalSettled,
                    totalCapitalLockedCents: totalCapitalCents,
                    largestPoolCents,
                },
            };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/:id — Rivalry detail
    // =========================================================================
    fastify.get<{ Params: { id: string } }>('/v1/rivalries/:id', async (request, reply) => {
        const { id } = request.params;

        try {
            const detail = await getRivalryDetail(id);
            if (!detail) {
                reply.status(404);
                return { error: 'Rivalry not found' };
            }
            return { ok: true, rivalry: detail };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // POST /v1/rivalries/:id/accept
    // =========================================================================
    fastify.post<{ Params: { id: string } }>('/v1/rivalries/:id/accept', { preHandler: requireAuth }, async (request, reply) => {
        let userId: string;
        try {
            userId = getPrincipal(request);
        } catch {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        try {
            await acceptRivalry(request.params.id, userId);
            return { ok: true };
        } catch (err: any) {
            reply.status(400);
            return { error: err.message };
        }
    });

    // =========================================================================
    // POST /v1/rivalries/:id/decline
    // =========================================================================
    fastify.post<{ Params: { id: string } }>('/v1/rivalries/:id/decline', { preHandler: requireAuth }, async (request, reply) => {
        let userId: string;
        try {
            userId = getPrincipal(request);
        } catch {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        try {
            await declineRivalry(request.params.id, userId);
            return { ok: true };
        } catch (err: any) {
            reply.status(400);
            return { error: err.message };
        }
    });

    // =========================================================================
    // POST /v1/rivalries/:id/fund
    // =========================================================================
    fastify.post<{ Params: { id: string } }>('/v1/rivalries/:id/fund', { preHandler: requireAuth }, async (request, reply) => {
        let userId: string;
        try {
            userId = getPrincipal(request);
        } catch {
            reply.status(401);
            return { error: 'Unauthorized' };
        }

        try {
            await fundRivalry(request.params.id, userId);
            return { ok: true };
        } catch (err: any) {
            reply.status(400);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/:id/events — Rivalry ledger events
    // =========================================================================
    fastify.get<{ Params: { id: string } }>('/v1/rivalries/:id/events', async (request, reply) => {
        try {
            const events = await getRivalryEvents(request.params.id);
            return { ok: true, events };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/:id/metrics — Live metric snapshots
    // =========================================================================
    fastify.get<{ Params: { id: string } }>('/v1/rivalries/:id/metrics', async (request, reply) => {
        try {
            const metrics = await db
                .select()
                .from(rivalryMetricSnapshots)
                .where(eq(rivalryMetricSnapshots.rivalryId, request.params.id))
                .orderBy(asc(rivalryMetricSnapshots.fetchedAt));

            return { ok: true, metrics };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // GET /v1/rivalries/:id/share — Public shareable rivalry card
    // =========================================================================
    fastify.get<{ Params: { id: string } }>('/v1/rivalries/:id/share', async (request, reply) => {
        try {
            const detail = await getRivalryDetail(request.params.id);
            if (!detail) {
                reply.status(404);
                return { error: 'Rivalry not found' };
            }

            // Return minimal shareable data (no sensitive info)
            return {
                ok: true,
                share: {
                    id: detail.id,
                    state: detail.state,
                    platform: detail.platform,
                    metricKey: detail.metricKey,
                    challengerUsername: detail.challengerUsername,
                    opponentUsername: detail.opponentUsername,
                    poolCents: detail.poolCents,
                    durationDays: detail.durationDays,
                    challenger: detail.participants.find((p: any) => p.role === 'challenger'),
                    opponent: detail.participants.find((p: any) => p.role === 'opponent'),
                    winnerUserId: detail.winnerUserId,
                    settledAt: detail.settledAt,
                },
            };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });

    // =========================================================================
    // POST /v1/rivalries/:id/settle — Trigger settlement (admin/cron)
    // =========================================================================
    fastify.post<{ Params: { id: string } }>('/v1/rivalries/:id/settle', async (request, reply) => {
        // Admin-only: require API key
        const adminKey = request.headers['x-admin-key'];
        const isValid = adminKey === process.env.ADMIN_API_KEY;
        if (!isValid) {
            reply.status(403);
            return { error: 'Unauthorized: Admin access required' };
        }

        try {
            const result = await settleRivalry(request.params.id);
            if (!result.success) {
                reply.status(400);
                return { error: result.error };
            }
            return { ok: true, settlement: result };
        } catch (err: any) {
            reply.status(500);
            return { error: err.message };
        }
    });
};

export default rivalryRoutes;
