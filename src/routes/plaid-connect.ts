/**
 * Plaid Bank Connect Routes
 *
 * The bank is the engine for every solo contract: it settles anything measured
 * in dollars and produces the baseline whichever metric the user picks. Without
 * a bank connection there is no examination, no terms, and no contract on any
 * metric — so this flow gates the entire product.
 *
 * WHY THIS DOES NOT LOOK LIKE THE OTHER CONNECT ROUTES
 * Stripe/Shopify/YouTube are OAuth redirects, which the frontend runs in a popup
 * and then polls for completion. Plaid Link is an EMBEDDED modal with its own
 * lifecycle (onSuccess / onExit / onEvent). The browser never leaves the page,
 * so there is nothing to poll:
 *
 *   1. POST /v1/connect/plaid/link-token   → short-lived token that opens Link
 *   2. Link runs in-page, returns a public_token to onSuccess
 *   3. POST /v1/connect/plaid/exchange     → public_token traded for access_token
 *   4. GET  /v1/connect/plaid/status       → read back the resulting state
 *
 * SECRETS: the access_token never reaches the browser. Link hands the client a
 * short-lived public_token, and only this server can exchange it.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/client.js';
import { connectedAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import {
    getPlaidClient,
    listIncomeStreams,
    PLAID_HISTORY_DAYS,
    PLAID_MIN_HISTORY_DAYS,
} from '../adapters/plaid-income.js';

const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userId) {
        return reply.status(401).send({ error: 'Authentication required' });
    }
};

async function plaidConnectRoutes(fastify: FastifyInstance) {
    // =========================================================================
    // 1. CREATE LINK TOKEN — opens Plaid Link in the browser
    // =========================================================================
    fastify.post(
        '/v1/connect/plaid/link-token',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;
            try {
                const client = getPlaidClient();
                const { linkToken, expiration } = await client.createLinkToken(userId);
                return reply.status(200).send({ linkToken, expiration });
            } catch (err: any) {
                request.log.error({ err }, '[plaid-connect] link token creation failed');
                return reply.status(502).send({
                    error: 'Could not start bank connection',
                    code: 'PLAID_LINK_TOKEN_FAILED',
                });
            }
        }
    );

    // =========================================================================
    // 2. EXCHANGE PUBLIC TOKEN — called from Link's onSuccess
    // =========================================================================
    fastify.post<{ Body: { publicToken?: string; accountId?: string } }>(
        '/v1/connect/plaid/exchange',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;
            const { publicToken, accountId } = request.body || {};

            if (!publicToken) {
                return reply.status(400).send({
                    error: 'publicToken is required',
                    code: 'PLAID_MISSING_PUBLIC_TOKEN',
                });
            }

            try {
                const client = getPlaidClient();
                const { accessToken, itemId } = await client.exchangePublicToken(publicToken);

                // Confirm the item actually gives us what income verification needs
                // before recording it as connected — fail closed rather than store a
                // connection that cannot settle anything.
                const validation = await client.validateConnection({ accessToken, itemId, accountId });
                if (!validation.valid) {
                    return reply.status(400).send({
                        error: validation.errorMessage || 'Bank connection is not usable for income verification',
                        code: validation.errorCode || 'PLAID_CONNECTION_INVALID',
                    });
                }

                const [existing] = await db
                    .select()
                    .from(connectedAccounts)
                    .where(and(
                        eq(connectedAccounts.userId, userId),
                        eq(connectedAccounts.platform, 'PLAID')
                    ))
                    .limit(1);

                const metadata = {
                    ...(existing?.metadataJson as Record<string, unknown> | null || {}),
                    accessToken,
                    itemId,
                    accountId: accountId || null,
                    institutionName: validation.institutionName,
                };

                if (existing) {
                    await db.update(connectedAccounts)
                        .set({
                            externalAccountId: itemId,
                            accessTokenEnc: accessToken,
                            metadataJson: metadata,
                            status: 'ACTIVE',
                            verificationStatus: 'VERIFIED',
                            verifiedAt: new Date(),
                            providerCurrency: validation.currency,
                            scopesGranted: validation.products,
                            scopesHash: validation.productsHash,
                            lastValidatedAt: new Date(),
                        } as any)
                        .where(eq(connectedAccounts.id, existing.id));
                } else {
                    await db.insert(connectedAccounts).values({
                        userId,
                        platform: 'PLAID',
                        externalAccountId: itemId,
                        accessTokenEnc: accessToken,
                        metadataJson: metadata,
                        status: 'ACTIVE',
                        verificationStatus: 'VERIFIED',
                        verifiedAt: new Date(),
                        providerCurrency: validation.currency,
                        scopesGranted: validation.products,
                        scopesHash: validation.productsHash,
                        lastValidatedAt: new Date(),
                    } as any);
                }

                return reply.status(200).send({
                    connected: true,
                    institutionName: validation.institutionName,
                    accountIds: validation.accountIds,
                });
            } catch (err: any) {
                request.log.error({ err }, '[plaid-connect] token exchange failed');
                return reply.status(502).send({
                    error: 'Could not complete bank connection',
                    code: 'PLAID_EXCHANGE_FAILED',
                });
            }
        }
    );

    // =========================================================================
    // 3. STATUS — what the /market matrix reads
    // =========================================================================
    fastify.get(
        '/v1/connect/plaid/status',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;

            const [account] = await db
                .select()
                .from(connectedAccounts)
                .where(and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.platform, 'PLAID')
                ))
                .limit(1);

            if (!account || account.status !== 'ACTIVE') {
                return reply.status(200).send({ connected: false, verificationStatus: null });
            }

            const meta = (account.metadataJson as Record<string, any> | null) || {};
            return reply.status(200).send({
                connected: true,
                verificationStatus: account.verificationStatus,
                institutionName: meta.institutionName || null,
                connectedAt: account.connectedAt?.toISOString(),
                // A stream must be chosen before terms can be derived; the matrix
                // uses this to tell "connected" from "ready".
                streamSelected: !!meta.selectedStreamId,
            });
        }
    );

    // =========================================================================
    // 4. STREAMS — the recurring deposit streams the user chooses between
    // =========================================================================
    fastify.get(
        '/v1/connect/plaid/streams',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;
            try {
                const result = await listIncomeStreams(userId, PLAID_HISTORY_DAYS);
                return reply.status(200).send({
                    streams: result.streams,
                    historyStart: result.historyStart,
                    historyEnd: result.historyEnd,
                    minHistoryDays: PLAID_MIN_HISTORY_DAYS,
                });
            } catch (err: any) {
                request.log.error({ err }, '[plaid-connect] stream listing failed');
                return reply.status(400).send({
                    error: err?.message || 'Could not read income streams',
                    code: err?.code || 'PLAID_STREAMS_FAILED',
                });
            }
        }
    );

    // =========================================================================
    // 5. SELECT STREAM — frozen into the baseline at contract lock
    // =========================================================================
    fastify.post<{ Body: { streamId?: string } }>(
        '/v1/connect/plaid/select-stream',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;
            const { streamId } = request.body || {};

            if (!streamId) {
                return reply.status(400).send({
                    error: 'streamId is required',
                    code: 'PLAID_MISSING_STREAM_ID',
                });
            }

            const [account] = await db
                .select()
                .from(connectedAccounts)
                .where(and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.platform, 'PLAID')
                ))
                .limit(1);

            if (!account) {
                return reply.status(400).send({
                    error: 'No bank connected',
                    code: 'PLAID_NOT_CONNECTED',
                });
            }

            const meta = (account.metadataJson as Record<string, unknown> | null) || {};
            await db.update(connectedAccounts)
                .set({ metadataJson: { ...meta, selectedStreamId: streamId } } as any)
                .where(eq(connectedAccounts.id, account.id));

            return reply.status(200).send({ ok: true, selectedStreamId: streamId });
        }
    );

    // =========================================================================
    // 6. DISCONNECT
    // =========================================================================
    fastify.post(
        '/v1/connect/plaid/disconnect',
        { preHandler: requireAuth },
        async (request, reply) => {
            const userId = request.userId!;
            await db.update(connectedAccounts)
                .set({ status: 'REVOKED' } as any)
                .where(and(
                    eq(connectedAccounts.userId, userId),
                    eq(connectedAccounts.platform, 'PLAID')
                ));
            return reply.status(200).send({ ok: true });
        }
    );
}

export default plaidConnectRoutes;
