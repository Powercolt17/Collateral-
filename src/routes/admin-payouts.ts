/**
 * Admin Payout Queue — the ONLY path that moves money.
 *
 * Settlement is automatic. Disbursement is not: every payout waits for a human
 * decision. Nothing in the worker calls a payout adapter, and
 * tests/payout-manual-approval.test.ts fails if that ever changes.
 *
 *   GET  /v1/admin/payouts/pending            what is awaiting a decision
 *   POST /v1/admin/payouts/:eventId/approve   disburses — the only such path
 *   POST /v1/admin/payouts/:eventId/reject    declines, reason required
 *
 * Approvals are ONE AT A TIME. There is deliberately no endpoint that approves
 * everything: a single click that moves every pending payout is exactly the
 * mistake this design exists to prevent.
 *
 * AUDIT: approve and reject both record who acted and when. Money leaving on a
 * human decision must show whose decision it was.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    listPendingPayouts,
    fetchQueuedPayout,
    processOnePayout,
    rejectPayout,
} from '../services/payout-job.js';
import { getPayoutAdapter, resolveUserRail } from '../services/payout-adapters.js';

/** Same gate as the other admin routes — do not invent a second pattern. */
function isAdmin(request: FastifyRequest): boolean {
    const adminKey = (request.headers['x-admin-key'] as string) || (request.query as any)?.key;
    if (!process.env.ADMIN_API_KEY) {
        // Fail closed in production; allow local admin work without a key.
        return process.env.NODE_ENV !== 'production';
    }
    return !!adminKey && adminKey === process.env.ADMIN_API_KEY;
}

/** Who is acting. Recorded on every money-moving decision. */
function actingAdmin(request: FastifyRequest): string {
    return (request.headers['x-admin-actor'] as string)
        || (request as any).userId
        || 'admin';
}

const deny = (reply: FastifyReply) =>
    reply.status(403).send({ error: 'Unauthorized: admin access required', code: 'ADMIN_REQUIRED' });

async function adminPayoutRoutes(fastify: FastifyInstance) {
    // =========================================================================
    // 1. PENDING — everything needed to decide, without opening another screen
    // =========================================================================
    fastify.get('/v1/admin/payouts/pending', async (request, reply) => {
        if (!isAdmin(request)) return deny(reply);

        const rows = await listPendingPayouts();

        const items = await Promise.all(rows.map(async (r: any) => {
            const userId = String(r.user_id);
            const rail = await resolveUserRail(userId);
            const dest = await getPayoutAdapter(rail).resolveDestination(userId);
            const condition = r.condition_json || {};

            return {
                eventId: String(r.event_id),
                userId,
                username: r.username ?? null,
                amountCents: Number(r.amount_cents),
                amountDisplay: `$${(Number(r.amount_cents) / 100).toFixed(2)}`,
                rail,
                // A clear flag rather than a silent omission: an unpayable row
                // must be obvious at a glance.
                hasDestination: dest.ok === true,
                destination: dest.ok === true ? dest.destination : null,
                destinationIssue: dest.ok === true ? null : { code: dest.code, reason: dest.reason },
                contractId: r.contract_id ?? null,
                metricType: r.metric_type ?? null,
                target: (condition as any).threshold ?? null,
                operator: (condition as any).operator ?? null,
                deadlineUtc: r.deadline_utc ?? null,
                settledAt: r.created_at ?? null,
            };
        }));

        return {
            ok: true,
            count: items.length,
            totalCents: items.reduce((a, i) => a + i.amountCents, 0),
            unpayable: items.filter(i => !i.hasDestination).length,
            items,
        };
    });

    // =========================================================================
    // 2. APPROVE — the only path that disburses
    // =========================================================================
    fastify.post<{ Params: { eventId: string } }>(
        '/v1/admin/payouts/:eventId/approve',
        async (request, reply) => {
            if (!isAdmin(request)) return deny(reply);

            const { eventId } = request.params;
            const approvedBy = actingAdmin(request);

            const row = await fetchQueuedPayout(eventId);
            if (!row) {
                // Either it never existed or it already has a terminal outcome.
                // A second approve of the same event lands here and is a no-op —
                // and even if it did not, the idempotency key makes the transfer
                // a no-op at the provider.
                return reply.status(409).send({
                    error: 'No payout awaiting approval for that event',
                    code: 'NOT_PENDING',
                });
            }

            const result = await processOnePayout(row as any, undefined, approvedBy);

            return reply.status(result.outcome === 'SENT' ? 200 : 422).send({
                ok: result.outcome === 'SENT',
                outcome: result.outcome,
                reason: result.reason ?? null,
                providerRef: result.providerRef ?? null,
                approvedBy,
                eventId,
            });
        }
    );

    // =========================================================================
    // 3. REJECT — declines with a mandatory reason
    // =========================================================================
    fastify.post<{ Params: { eventId: string }; Body: { reason?: string } }>(
        '/v1/admin/payouts/:eventId/reject',
        async (request, reply) => {
            if (!isAdmin(request)) return deny(reply);

            const { eventId } = request.params;
            const reason = (request.body?.reason ?? '').trim();
            if (!reason) {
                // Never silently dropped: a rejected payout without a recorded
                // reason is indistinguishable from one that was lost.
                return reply.status(400).send({
                    error: 'A reason is required to reject a payout',
                    code: 'REASON_REQUIRED',
                });
            }

            const row = await fetchQueuedPayout(eventId);
            if (!row) {
                return reply.status(409).send({
                    error: 'No payout awaiting approval for that event',
                    code: 'NOT_PENDING',
                });
            }

            const rejectedBy = actingAdmin(request);
            await rejectPayout({
                eventId,
                userId: String((row as any).user_id),
                contractId: (row as any).contract_id ? String((row as any).contract_id) : undefined,
                amountCents: Number((row as any).amount_cents),
                reason,
                rejectedBy,
            });

            return { ok: true, eventId, rejectedBy, reason };
        }
    );
}

export default adminPayoutRoutes;
