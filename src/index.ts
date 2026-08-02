import 'dotenv/config';
import http from 'node:http';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import { registerSecurity } from './middleware/security.js';

// Route imports
import healthRoutes from './routes/health.js';
import ledgerRoutes from './routes/ledger.js';
import contractRoutes from './routes/contracts.js';           // Legacy (deprecated)
import contractReadRoutes from './routes/contracts-read.js';  // NEW: /v1/contracts
import contractWriteRoutes from './routes/contracts-write.js';
import profileRoutes from './routes/profiles.js';
import usersRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import clerkAuthRoutes from './routes/clerk-auth.js';
import identityRoutes from './routes/identity.js';
import webhookRoutes from './routes/webhooks.js';
import connectRoutes from './routes/connect.js';
import xOAuthRoutes from './routes/x-oauth.js';  // X OAuth (replaces bio challenge)
import stripeConnectRoutes from './routes/stripe-connect.js';
import shopifyConnectRoutes from './routes/shopify-connect.js';
import plaidConnectRoutes from './routes/plaid-connect.js';
import amazonConnectRoutes from './routes/amazon-connect.js';
import youtubeConnectRoutes from './routes/youtube-connect.js';
import quoteRoutes from './routes/quote.js';
import opsRoutes from './routes/ops.js';
import billingRoutes from './routes/billing.js';
import payoutRoutes from './routes/payouts.js';
import waitlistRoutes from './routes/waitlist.js';
import salesRoutes from './routes/sales.js';
import commerceRoutes from './routes/commerce.js';
import marketRoutes from './routes/market.js';
import oracleRoutes from './routes/oracle.js';
import socialBonusRoutes from './routes/social-bonus.js';
import referralRoutes from './routes/referrals.js';
import rivalryRoutes from './routes/rivalry.js';
import notificationRoutes from './routes/notifications.js';
import adminSnapshotRoutes from './routes/admin-snapshots.js';
import creatorReferralRoutes from './routes/creator-referrals.js';
import tokenRoutes from './routes/token.js';
import walletsRoutes from './routes/wallets.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// =========================================================
// PRODUCTION ASSERTIONS - Fail fast on missing config
// =========================================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
    const requiredEnvVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_CLIENT_ID',
        'DATABASE_URL',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error('⚠️ WARNING: Missing env vars:', missing.join(', '), '— some features will not work');
    }

    // Validate Stripe key formats (warn only)
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        console.error('⚠️ WARNING: STRIPE_SECRET_KEY should start with sk_');
    }
    if (process.env.STRIPE_CLIENT_ID && !process.env.STRIPE_CLIENT_ID.startsWith('ca_')) {
        console.error('⚠️ WARNING: STRIPE_CLIENT_ID should start with ca_');
    }
    if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
        console.error('⚠️ WARNING: STRIPE_WEBHOOK_SECRET should start with whsec_');
    }

    if (missing.length === 0) {
        console.log('✅ All required Stripe env vars validated');
    }
}

// =========================================================
// TWO-PHASE STARTUP
// Phase 1: Bind to PORT immediately — /health returns 200
// Phase 2: Boot Fastify, hand off all requests to it
// =========================================================

let fastifyHandler: ((req: http.IncomingMessage, res: http.ServerResponse) => void) | null = null;

// Phase 1 Request Handler
const server = http.createServer((req, res) => {
    // 1. Delegate to Fastify if ready
    if (fastifyHandler) {
        fastifyHandler(req, res);
        return;
    }

    const url = (req.url || '').split('?')[0];

    // Log incoming requests during boot (helps debug Railway healthchecks)
    console.log(`[boot] Incoming request: ${req.method} ${url}`);

    // 2. Handle Healthset (Phase 1)
    // Accept /health, /health/, and root / as valid health checks
    if (req.method === 'GET' && (url === '/' || url === '/health' || url === '/health/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'collateral-backend',
            version: '1.0.0',
            phase: 'booting',
            note: 'Fastify is initializing...'
        }));
        return;
    }

    // 3. Reject everything else with 503 until booted
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Service starting...' }));
});

// Bind to PORT immediately — Railway healthcheck passes within seconds
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[startup] ✅ Phase 1: Health endpoint live on 0.0.0.0:${PORT}`);

    // DIAGNOSTICS
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`[startup] 🔍 Diagnostic: DB_URL=${maskedUrl} (Length: ${dbUrl.length})`);

    // Phase 1.5: Run Migrations -> Verify Schema -> Boot
    import('./db/migrate-prod.js')
        .then(async ({ runMigrations }) => {
            console.log('[startup] 🔄 Running migrations...');
            try {
                await runMigrations();
                console.log('[startup] ✅ Migrations up to date.');
            } catch (e) {
                console.error('[startup] ⚠️ Migrations failed, attempting runtime fix...', e);
            }

            // RUNTIME SCHEMA FIX (Force Apply using raw SQL)
            // This bypasses the migration table and ensures columns exist.
            try {
                const { fixSchemaDrift } = await import('./db/fix-schema-runtime.js');
                await fixSchemaDrift();
            } catch (err) {
                console.error('[startup] ❌ Runtime Schema Fix Failed:', err);
            }

            // Seed Market Data (Safe/Idempotent)
            try {
                const { seedMarket } = await import('./db/seed-market.js');
                await seedMarket();
            } catch (err) {
                console.error('[startup] ⚠️ Seed failed (continuing):', err);
            }

            // Now check schema (non-fatal — server should still boot)
            try {
                const { checkSchema } = await import('./db/guard.js');
                await checkSchema();
            } catch (err) {
                console.error('[startup] ⚠️ Schema check failed (DB may be unavailable):', err);
            }

            // Seed simulated activity (makes platform look alive with fresh data)
            try {
                const { refreshSimulatedActivity } = await import('./db/refresh-activity.js');
                await refreshSimulatedActivity();
            } catch (err) {
                console.error('[startup] ⚠️ Activity seed failed (continuing):', err);
            }

            // Now boot app regardless — DB will reconnect when available
            bootFastify();
        })
        .catch(err => {
            console.error('[startup] ❌ Boot Sequence Failed (Migration/Schema).', err);
            // Still boot Fastify — health endpoint already running, routes will fail gracefully
            console.error('[startup] ⚠️ Attempting to boot Fastify anyway...');
            bootFastify();
        });
});

// =========================================================
// Phase 2: Full Fastify boot
// =========================================================
async function bootFastify() {
    try {
        const fastify = Fastify({
            logger: { level: 'info' },
            bodyLimit: 4 * 1024 * 1024, // 4MB — supports base64 avatar uploads
            serverFactory: (handler) => {
                // Capture the Fastify handler, reuse the existing server
                fastifyHandler = handler;
                return server;
            },
        });

        // CORS — Restrict to known origins in production
        const ALLOWED_ORIGINS = IS_PRODUCTION
            ? [
                'https://collateral.market',
                'https://www.collateral.market',
                'https://collateral-production.up.railway.app',
            ]
            : true; // Allow all in development

        await fastify.register(cors, {
            origin: ALLOWED_ORIGINS,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            maxAge: 86400, // Cache preflight for 24h
        });

        // Raw body support for Stripe webhook signature verification
        await fastify.register(rawBody, {
            field: 'rawBody',
            global: false,           // Only on routes that request it
            encoding: 'utf8',
            runFirst: true,          // Run before JSON parser
        });

        // Global Auth Hook - parse token and set userId on every request
        fastify.addHook('preHandler', async (request) => {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.slice(7);
                try {
                    const { verifyAccessToken } = await import('./services/auth.js');
                    request.userId = verifyAccessToken(token);
                } catch (err) {
                    request.userId = undefined;
                }
            }
        });

        // Global Error Handler (Envelope Consistency)
        fastify.setErrorHandler((error: any, request, reply) => {
            const statusCode = error.statusCode || 500;
            let code = error.code || 'INTERNAL_SERVER_ERROR';

            // Map status codes to readable error codes if generic
            if (!error.code || typeof error.code === 'number') {
                if (statusCode === 400) code = 'BAD_REQUEST';
                if (statusCode === 401) code = 'UNAUTHORIZED';
                if (statusCode === 403) code = 'FORBIDDEN';
                if (statusCode === 404) code = 'NOT_FOUND';
            }

            // Log 5xx errors
            if (statusCode >= 500) {
                request.log.error(error);
            }

            reply.status(statusCode).send({
                ok: false,
                code,
                error: error.message || 'Unknown error',
            });
        });

        // =========================================================
        // Security Middleware (Rate Limiting + Headers)
        // =========================================================
        await registerSecurity(fastify);

        // =========================================================
        // Route Registration
        // =========================================================
        async function safeRegister(name: string, plugin: any) {
            const start = Date.now();
            try {
                await fastify.register(plugin);
                console.log(`[startup] ✅ ${name} registered (${Date.now() - start}ms)`);
            } catch (err) {
                console.error(`[startup] ❌ ${name} FAILED (${Date.now() - start}ms):`, err);
            }
        }

        console.log('[startup] Registering routes...');

        // Health check (no auth) — FIRST
        await safeRegister('health', healthRoutes);

        // Legacy read-only endpoints
        await safeRegister('ledger', ledgerRoutes);
        await safeRegister('contracts-legacy', contractRoutes);
        await safeRegister('profiles', profileRoutes);
        await safeRegister('users', usersRoutes);

        // Identity & Auth
        await safeRegister('auth', authRoutes);
        await safeRegister('wallets', walletsRoutes);
        await safeRegister('clerk-auth', clerkAuthRoutes);
        await safeRegister('identity', identityRoutes);
        await safeRegister('connect', connectRoutes);
        await safeRegister('x-oauth', xOAuthRoutes);
        await safeRegister('stripe-connect', stripeConnectRoutes);
        await safeRegister('shopify-connect', shopifyConnectRoutes);
        await safeRegister('plaid-connect', plaidConnectRoutes);
        await safeRegister('amazon-connect', amazonConnectRoutes);
        await safeRegister('youtube-connect', youtubeConnectRoutes);
        await safeRegister('quote', quoteRoutes);

        // V1 Contract endpoints
        await safeRegister('contracts-read', contractReadRoutes);
        await safeRegister('contracts-write', contractWriteRoutes);

        // Billing, Payouts, Webhooks
        await safeRegister('billing', billingRoutes);
        await safeRegister('payouts', payoutRoutes);
        await safeRegister('webhooks', webhookRoutes);

        // Ops, Waitlist, Sales, Commerce
        await safeRegister('ops', opsRoutes);
        await safeRegister('waitlist', waitlistRoutes);
        await safeRegister('sales', salesRoutes);
        await safeRegister('commerce', commerceRoutes);
        await safeRegister('market', marketRoutes);
        await safeRegister('oracle', oracleRoutes);
        await safeRegister('social-bonus', socialBonusRoutes);
        await safeRegister('referrals', referralRoutes);
        await safeRegister('rivalry', rivalryRoutes);
        await safeRegister('notifications', notificationRoutes);
        await safeRegister('admin-snapshots', adminSnapshotRoutes);
        await safeRegister('creator-referrals', creatorReferralRoutes);
        await safeRegister('token', tokenRoutes);

        console.log('[startup] All routes queued, calling ready()...');

        // ready() executes all registered plugins — DO NOT call listen()
        // since serverFactory reuses the already-listening http server
        await fastify.ready();
        console.log(`[startup] ✅ Phase 2: Fastify ready — full API available on 0.0.0.0:${PORT}`);

        // =========================================================
        // Phase 3: Auto-Scheduler — Oracle Metric Polling
        // Runs all jobs every 5 minutes (oracle refresh, rivalry
        // tracker, rivalry cron, verification, settlement, reconciliation)
        // =========================================================
        const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
        const SCHEDULER_INITIAL_DELAY_MS = 30 * 1000; // 30 second warmup

        setTimeout(() => {
            console.log(`[scheduler] ⏰ Auto-scheduler starting (every ${SCHEDULER_INTERVAL_MS / 60000} min)...`);

            // Run immediately on first tick
            import('./services/scheduler.js').then(async ({ runScheduledJobs }) => {
                try {
                    const result = await runScheduledJobs();
                    console.log(`[scheduler] ✅ Initial run complete in ${result.totalDurationMs}ms`);
                } catch (err: any) {
                    console.error('[scheduler] ❌ Initial run failed:', err.message);
                }
            });

            // Then every 5 minutes
            setInterval(async () => {
                try {
                    const { runScheduledJobs } = await import('./services/scheduler.js');
                    const result = await runScheduledJobs();
                    console.log(`[scheduler] ✅ Scheduled run complete in ${result.totalDurationMs}ms`);
                } catch (err: any) {
                    console.error('[scheduler] ❌ Scheduled run failed:', err.message);
                }
            }, SCHEDULER_INTERVAL_MS);
        }, SCHEDULER_INITIAL_DELAY_MS);

    } catch (err) {
        console.error('[startup] ❌ Fastify boot failed:', err);
        console.error('[startup]    Health endpoint still running — deploy is alive');
        // DO NOT process.exit — keep the health server running
    }
}
