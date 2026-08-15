/**
 * Seed Simulated Activity — Populates the site with realistic-looking
 * solo contracts and rivalries so the platform appears active.
 * 
 * Vibe: "Up and coming" — enough activity to look credible,
 * not so much it looks fake. Think ~25 settled solos, 8 rivalries,
 * a few in-flight contracts, and a believable ledger.
 * 
 * Run via admin endpoint: POST /v1/admin/seed-activity
 * Requires x-admin-key header
 * 
 * IDEMPOTENT: Checks for existing sim_ users before creating.
 */

import 'dotenv/config';
import { db } from './client.js';
import { sql } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';

// ============================================================================
// REALISTIC FAKE USERS — diverse, believable handles
// ============================================================================
const SIM_USERS = [
    { handle: 'marcusfitz',     display: 'Marcus Fitzgerald',  avatar: null },
    { handle: 'chelseadev',     display: 'Chelsea Park',       avatar: null },
    { handle: 'jakevoss',       display: 'Jake Voss',          avatar: null },
    { handle: 'itsnataliex',    display: 'Natalie Chen',       avatar: null },
    { handle: 'tylerbrooks',    display: 'Tyler Brooks',       avatar: null },
    { handle: 'aminadotcom',    display: 'Amina Okafor',       avatar: null },
    { handle: 'ryanx01',        display: 'Ryan Xu',            avatar: null },
    { handle: 'clodigital',     display: 'Chloe Deschamps',    avatar: null },
    { handle: 'devinmakes',     display: 'Devin Morales',      avatar: null },
    { handle: 'sarabizops',     display: 'Sara Kim',           avatar: null },
    { handle: 'miloelabs',      display: 'Milo Edwards',       avatar: null },
    { handle: 'priyabuilds',    display: 'Priya Sharma',       avatar: null },
    { handle: 'andrejcodes',    display: 'Andrej Petrov',      avatar: null },
    { handle: 'lilydao',        display: 'Lily Nakamura',      avatar: null },
    { handle: 'maxfoundr',      display: 'Max Alvarado',       avatar: null },
    { handle: 'emmaburke',      display: 'Emma Burke',         avatar: null },
];

// Realistic contract titles aligned with actual catalog templates
const SOLO_SCENARIOS = [
    // Stripe / Revenue
    { platform: 'STRIPE', metric: 'REVENUE', metricKey: 'stripe_net_revenue', title: 'Net Revenue Growth (14d)', windowDays: 14, category: 'finance' },
    { platform: 'STRIPE', metric: 'REVENUE', metricKey: 'stripe_net_revenue', title: 'Net Revenue Growth (30d)', windowDays: 30, category: 'finance' },
    { platform: 'STRIPE', metric: 'REVENUE', metricKey: 'stripe_mrr', title: 'Monthly Recurring Revenue (14d)', windowDays: 14, category: 'finance' },
    { platform: 'STRIPE', metric: 'REVENUE', metricKey: 'stripe_mrr', title: 'Monthly Recurring Revenue (30d)', windowDays: 30, category: 'finance' },
    { platform: 'STRIPE', metric: 'CHARGE_VOLUME', metricKey: 'stripe_charge_volume', title: 'Charge Volume Growth (30d)', windowDays: 30, category: 'finance' },
    // X / Followers
    { platform: 'X', metric: 'FOLLOWERS', metricKey: 'x_followers', title: 'Follower Growth (14d)', windowDays: 14, category: 'social' },
    { platform: 'X', metric: 'FOLLOWERS', metricKey: 'x_followers', title: 'Follower Growth (30d)', windowDays: 30, category: 'social' },
    // YouTube
    { platform: 'YOUTUBE', metric: 'SUBSCRIBERS', metricKey: 'youtube_subscribers', title: 'Subscriber Growth (14d)', windowDays: 14, category: 'social' },
    { platform: 'YOUTUBE', metric: 'SUBSCRIBERS', metricKey: 'youtube_subscribers', title: 'Subscriber Growth (30d)', windowDays: 30, category: 'social' },
    { platform: 'YOUTUBE', metric: 'VIEWS', metricKey: 'youtube_30day_views', title: '30-Day Views Growth (30d)', windowDays: 30, category: 'social' },
    // Shopify
    { platform: 'SHOPIFY', metric: 'GROSS_SALES', metricKey: 'shopify_net_sales', title: 'Store Net Sales (14d)', windowDays: 14, category: 'commerce' },
    { platform: 'SHOPIFY', metric: 'GROSS_SALES', metricKey: 'shopify_net_sales', title: 'Store Net Sales (30d)', windowDays: 30, category: 'commerce' },
    { platform: 'SHOPIFY', metric: 'ORDER_COUNT', metricKey: 'shopify_order_volume', title: 'Order Volume Growth (14d)', windowDays: 14, category: 'commerce' },
];

const TIERS = ['STANDARD', 'ADVANCED', 'ELITE'] as const;
const TIER_DB_MAP = { STANDARD: 'controlled', ADVANCED: 'elevated', ELITE: 'maximum' };
const TIER_MULTIPLIERS = { STANDARD: 1.7, ADVANCED: 2.5, ELITE: 4.0 };

// Stake ranges per tier (cents)
const STAKE_RANGES: Record<string, [number, number]> = {
    STANDARD: [10000, 150000],   // $100 - $1,500
    ADVANCED: [25000, 300000],   // $250 - $3,000
    ELITE:    [50000, 500000],   // $500 - $5,000
};

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(days: number): Date { return new Date(Date.now() - days * 86400000); }
function hoursAgo(hours: number): Date { return new Date(Date.now() - hours * 3600000); }
function hashEvent(data: string): string { return createHash('sha256').update(data).digest('hex'); }

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
export async function seedSimulatedActivity() {
    console.log('[Seed Activity] 🌱 Starting simulated activity seeding...');

    // Check if already seeded (check for sim users AND their contracts)
    const existing = await db.execute(sql`
        SELECT count(*) as cnt FROM users WHERE email LIKE '%@collateral.internal'
    `);
    const existingCount = Number((existing as any).rows?.[0]?.cnt || (existing as any)[0]?.cnt || 0);
    
    // Also check if contracts were created (users might exist from a failed partial run)
    let contractCount = 0;
    if (existingCount > 5) {
        const contractCheck = await db.execute(sql`
            SELECT count(*) as cnt FROM contracts c
            JOIN users u ON c.principal_user_id = u.id
            WHERE u.email LIKE '%@collateral.internal'
        `);
        contractCount = Number((contractCheck as any).rows?.[0]?.cnt || (contractCheck as any)[0]?.cnt || 0);
    }

    /* RE-RUNNABLE, SO NEW RIVALRIES CAN BE TOPPED UP.
       This used to return outright once the sim users and their contracts
       existed, which meant adding rivalries to the set below had no effect on
       an already-seeded database — the function skipped before reaching them.
       The solo-contract sections are what must not run twice; the rivalry
       section checks each pair for itself and inserts only what is missing. */
    const skipContracts = existingCount > 5 && contractCount > 10;
    if (skipContracts) {
        console.log(`[Seed Activity] Solo contracts already seeded (${existingCount} sim users, ${contractCount} contracts) — topping up rivalries only.`);
    }

    // 1. Create simulated users
    const userIds: string[] = [];
    for (const u of SIM_USERS) {
        const email = 'sim_' + u.handle + '@collateral.internal';
        const id = randomUUID();
        const createdDaysAgo = rand(14, 75); // Accounts 2-10 weeks old
        await db.execute(sql`
            INSERT INTO users (id, email, x_username, created_at)
            VALUES (${id}, ${email}, ${u.handle}, ${daysAgo(createdDaysAgo).toISOString()})
            ON CONFLICT DO NOTHING
        `);
        /* READ THE ID BACK. The insert is ON CONFLICT DO NOTHING, so on any run
           after the first it inserts nothing and this user's real id is the one
           already in the table — pushing the freshly generated UUID instead
           pointed every rivalry below at a user that does not exist, and the
           foreign keys would have rejected the lot. */
        const row: any = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
        const realId = row?.rows?.[0]?.id ?? row?.[0]?.id ?? id;
        userIds.push(String(realId));
    }
    console.log(`[Seed Activity] ✅ Created ${userIds.length} simulated users`);

    // 2. Create identities for simulated users
    for (let i = 0; i < userIds.length; i++) {
        await db.execute(sql`
            INSERT INTO identities (id, user_id, display_name, username, photo_url, status, created_at, updated_at)
            VALUES (${randomUUID()}, ${userIds[i]}, ${SIM_USERS[i].display}, ${SIM_USERS[i].handle}, NULL, 'ACTIVE', NOW(), NOW())
            ON CONFLICT DO NOTHING
        `);
    }

    // =========================================================================
    // 3. SETTLED SOLO CONTRACTS — Mix of wins (28%) and losses (72%)
    //    Spread across last 5-45 days for believable timeline
    // =========================================================================
    const contractIds: string[] = [];

    // Define specific, believable contracts (not random slop)
    const SETTLED_CONTRACTS = [
        // --- Recent losses (most common — house edge) ---
        { userIdx: 0, scenario: 0,  tier: 'STANDARD', win: false, daysBack: 3,  stakeCents: 25000 },   // Marcus lost $250 on Stripe revenue 14d
        { userIdx: 3, scenario: 5,  tier: 'STANDARD', win: false, daysBack: 4,  stakeCents: 15000 },   // Natalie lost $150 on X followers 14d
        { userIdx: 7, scenario: 7,  tier: 'STANDARD', win: false, daysBack: 5,  stakeCents: 10000 },   // Chloe lost $100 on YT subs 14d
        { userIdx: 1, scenario: 1,  tier: 'ADVANCED', win: false, daysBack: 6,  stakeCents: 50000 },   // Chelsea lost $500 on Stripe revenue 30d
        { userIdx: 4, scenario: 6,  tier: 'STANDARD', win: false, daysBack: 7,  stakeCents: 20000 },   // Tyler lost $200 on X followers 30d
        
        // --- A couple wins — shows it's possible ---
        { userIdx: 2, scenario: 5,  tier: 'STANDARD', win: true,  daysBack: 7,  stakeCents: 10000 },   // Jake WON $170 on X followers 14d
        { userIdx: 5, scenario: 10, tier: 'STANDARD', win: true,  daysBack: 8,  stakeCents: 30000 },   // Amina WON $510 on Shopify 14d

        // --- Older settled contracts ---
        { userIdx: 8, scenario: 3,  tier: 'ADVANCED', win: false, daysBack: 10, stakeCents: 75000 },   // Devin lost $750 on MRR 30d
        { userIdx: 6, scenario: 9,  tier: 'STANDARD', win: false, daysBack: 11, stakeCents: 15000 },   // Ryan lost $150 on YT views 30d
        { userIdx: 9, scenario: 11, tier: 'STANDARD', win: false, daysBack: 12, stakeCents: 20000 },   // Sara lost $200 on Shopify 30d
        { userIdx: 10, scenario: 0, tier: 'ADVANCED', win: true,  daysBack: 13, stakeCents: 40000 },   // Milo WON $1000 on Stripe 14d
        { userIdx: 11, scenario: 8, tier: 'STANDARD', win: false, daysBack: 14, stakeCents: 10000 },   // Priya lost $100 on YT subs 30d
        
        // --- Even older — platform's early days ---
        { userIdx: 0, scenario: 6,  tier: 'STANDARD', win: false, daysBack: 18, stakeCents: 10000 },   // Marcus lost $100 on X 30d (tried again)
        { userIdx: 12, scenario: 1, tier: 'STANDARD', win: true,  daysBack: 20, stakeCents: 15000 },   // Andrej WON $255 on Stripe 30d
        { userIdx: 3, scenario: 2,  tier: 'STANDARD', win: false, daysBack: 22, stakeCents: 25000 },   // Natalie lost $250 on MRR 14d
        { userIdx: 13, scenario: 5, tier: 'STANDARD', win: false, daysBack: 24, stakeCents: 10000 },   // Lily lost $100 on X 14d
        { userIdx: 14, scenario: 10, tier: 'STANDARD', win: false, daysBack: 26, stakeCents: 20000 },  // Max lost $200 on Shopify 14d
        
        // --- Elite tier (rare, big money, all losses) ---
        { userIdx: 1, scenario: 1,  tier: 'ELITE', win: false, daysBack: 15, stakeCents: 200000 },     // Chelsea lost $2,000 on Stripe 30d ALL-IN
        { userIdx: 10, scenario: 6, tier: 'ELITE', win: false, daysBack: 28, stakeCents: 100000 },     // Milo lost $1,000 on X 30d ALL-IN

        // --- A few more ADVANCED tier ---
        { userIdx: 15, scenario: 4, tier: 'ADVANCED', win: false, daysBack: 16, stakeCents: 60000 },   // Emma lost $600 on charge volume 30d
        { userIdx: 2, scenario: 11, tier: 'ADVANCED', win: true,  daysBack: 19, stakeCents: 30000 },   // Jake WON $750 on Shopify 30d
        { userIdx: 7, scenario: 8, tier: 'ADVANCED', win: false, daysBack: 25, stakeCents: 45000 },    // Chloe lost $450 on YT subs 30d
        
        // --- Very early contracts (30+ days ago) --- 
        { userIdx: 4, scenario: 0, tier: 'STANDARD', win: true,  daysBack: 32, stakeCents: 10000 },    // Tyler WON $170 on Stripe 14d (early adopter)
        { userIdx: 8, scenario: 5, tier: 'STANDARD', win: false, daysBack: 35, stakeCents: 10000 },    // Devin lost $100 on X 14d
        { userIdx: 5, scenario: 12, tier: 'STANDARD', win: false, daysBack: 38, stakeCents: 15000 },   // Amina lost $150 on order volume 14d
    ];

    for (const def of SETTLED_CONTRACTS) {
        if (skipContracts) break;   // already present; do not duplicate
        const cid = randomUUID();
        contractIds.push(cid);

        const userId = userIds[def.userIdx];
        const username = SIM_USERS[def.userIdx].handle;
        const scenario = SOLO_SCENARIOS[def.scenario];
        const tier = def.tier as typeof TIERS[number];
        const windowDays = scenario.windowDays;
        const stakeCents = def.stakeCents;
        const payoutCents = Math.round(stakeCents * TIER_MULTIPLIERS[tier]);

        const createdAt = daysAgo(def.daysBack + windowDays);
        const deadline = daysAgo(def.daysBack);
        const settledAt = new Date(deadline.getTime() + rand(1, 4) * 3600000);

        // Baseline values
        const baselineValue = scenario.metric === 'REVENUE' || scenario.metric === 'CHARGE_VOLUME' || scenario.metric === 'GROSS_SALES'
            ? rand(80000, 600000) // $800-$6k or 800-6000 charges
            : rand(800, 45000);   // followers/subs

        const targetPct = tier === 'STANDARD' ? rand(20, 30) : tier === 'ADVANCED' ? rand(30, 45) : rand(45, 70);
        const targetValue = Math.round(baselineValue * (1 + targetPct / 100));
        const finalValue = def.win
            ? Math.round(targetValue * (1 + Math.random() * 0.12))
            : Math.round(baselineValue * (1 + Math.random() * (targetPct / 100) * 0.65));

        // Insert contract
        await db.execute(sql`
            INSERT INTO contracts (
                id, principal_user_id, principal_identity_username,
                platform, metric_type, condition_json, baseline_json,
                deadline_utc, lock_amount_usd_cents, payout_amount_usd_cents,
                funding_method, risk_tier, created_at, updated_at
            ) VALUES (
                ${cid}, ${userId}, ${username},
                ${scenario.platform}, ${scenario.metric},
                ${JSON.stringify({ threshold: targetValue, operator: 'gte', targetPct })},
                ${JSON.stringify({ platform: scenario.platform, value: baselineValue, measuredAtUtc: createdAt.toISOString() })},
                ${deadline.toISOString()}, ${stakeCents}, ${payoutCents},
                'USD_CARD', ${tier},
                ${createdAt.toISOString()}, ${settledAt.toISOString()}
            )
        `);

        // Insert contract_index for state tracking (needed by results query)
        const currentState = def.win ? 'SETTLED_SUCCESS' : 'SETTLED_FAILURE';
        try {
            await db.execute(sql`
                INSERT INTO contract_index (contract_id, current_state, is_terminal, last_event_type, last_event_at_utc)
                VALUES (${cid}, ${currentState}, 1, ${currentState}, ${settledAt.toISOString()})
                ON CONFLICT (contract_id) DO UPDATE SET current_state = ${currentState}, is_terminal = 1
            `);
        } catch (e) {
            // contract_index table may not exist in all environments
            console.warn('[Seed Activity] contract_index insert skipped (table may not exist)');
        }

        // Insert ledger events chain
        const events: { type: string; ts: Date; amountCents?: number; meta: Record<string, any> }[] = [
            { type: 'CONTRACT_CREATED', ts: createdAt, meta: { simulated: true, title: scenario.title } },
            { type: 'FUNDS_AUTHORIZED', ts: new Date(createdAt.getTime() + rand(30, 180) * 1000), amountCents: stakeCents, meta: { amountUsdCents: stakeCents, paymentIntentId: 'pi_sim_' + cid.slice(0, 8) } },
            { type: 'FUNDS_LOCKED', ts: new Date(createdAt.getTime() + rand(180, 600) * 1000), amountCents: stakeCents, meta: { amountUsdCents: stakeCents } },
            { type: 'EXECUTION_CONFIRMED', ts: new Date(createdAt.getTime() + rand(600, 1200) * 1000), amountCents: stakeCents, meta: { confirmedAt: new Date(createdAt.getTime() + 900000).toISOString() } },
        ];

        if (def.win) {
            events.push({
                type: 'SETTLED_SUCCESS',
                ts: settledAt,
                amountCents: payoutCents,
                meta: { outcome: 'WIN', finalValue, payoutAmountCents: payoutCents, platform: scenario.platform }
            });
        } else {
            events.push({
                type: 'SETTLED_FAILURE',
                ts: settledAt,
                amountCents: stakeCents,
                meta: { outcome: 'LOSS', finalValue, forfeitedCents: stakeCents, platform: scenario.platform }
            });
        }

        let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        for (const evt of events) {
            const eid = randomUUID();
            const eventHash = hashEvent(prevHash + eid + evt.type);
            await db.execute(sql`
                INSERT INTO ledger_events (
                    id, contract_id, actor, event_type, timestamp_utc,
                    amount_usd_cents, metadata_json, prev_event_hash, event_hash
                ) VALUES (
                    ${eid}, ${cid}, 'SYSTEM', ${evt.type}, ${evt.ts.toISOString()},
                    ${evt.amountCents || null}, ${JSON.stringify(evt.meta)},
                    ${prevHash}, ${eventHash}
                )
            `);
            prevHash = eventHash;
        }
    }
    console.log(`[Seed Activity] ✅ Created ${SETTLED_CONTRACTS.length} settled solo contracts`);

    // =========================================================================
    // 4. IN-FLIGHT SOLO CONTRACTS — currently active, adds "live" feeling
    // =========================================================================
    const ACTIVE_CONTRACTS = [
        { userIdx: 0, scenario: 5,  tier: 'STANDARD', hoursActive: 72,  stakeCents: 15000 },  // Marcus - X followers 14d, 3 days in
        { userIdx: 3, scenario: 0,  tier: 'STANDARD', hoursActive: 168, stakeCents: 25000 },  // Natalie - Stripe revenue 14d, 7 days in
        { userIdx: 14, scenario: 7, tier: 'ADVANCED', hoursActive: 48,  stakeCents: 50000 },  // Max - YT subs 14d, 2 days in
        { userIdx: 6, scenario: 11, tier: 'STANDARD', hoursActive: 240, stakeCents: 20000 },  // Ryan - Shopify net sales 30d, 10 days in
    ];

    for (const def of ACTIVE_CONTRACTS) {
        if (skipContracts) break;   // already present; do not duplicate
        const cid = randomUUID();
        contractIds.push(cid);

        const userId = userIds[def.userIdx];
        const username = SIM_USERS[def.userIdx].handle;
        const scenario = SOLO_SCENARIOS[def.scenario];
        const tier = def.tier as typeof TIERS[number];
        const stakeCents = def.stakeCents;
        const payoutCents = Math.round(stakeCents * TIER_MULTIPLIERS[tier]);

        const createdAt = hoursAgo(def.hoursActive + 2);
        const deadline = new Date(createdAt.getTime() + scenario.windowDays * 86400000);

        const baselineValue = scenario.metric === 'REVENUE'
            ? rand(100000, 400000) : rand(1000, 30000);
        const targetPct = tier === 'STANDARD' ? rand(20, 30) : rand(30, 45);
        const targetValue = Math.round(baselineValue * (1 + targetPct / 100));

        await db.execute(sql`
            INSERT INTO contracts (
                id, principal_user_id, principal_identity_username,
                platform, metric_type, condition_json, baseline_json,
                deadline_utc, lock_amount_usd_cents, payout_amount_usd_cents,
                funding_method, risk_tier, created_at, updated_at
            ) VALUES (
                ${cid}, ${userId}, ${username},
                ${scenario.platform}, ${scenario.metric},
                ${JSON.stringify({ threshold: targetValue, operator: 'gte', targetPct })},
                ${JSON.stringify({ platform: scenario.platform, value: baselineValue, measuredAtUtc: createdAt.toISOString() })},
                ${deadline.toISOString()}, ${stakeCents}, ${payoutCents},
                'USD_CARD', ${tier},
                ${createdAt.toISOString()}, NOW()
            )
        `);

        try {
            await db.execute(sql`
                INSERT INTO contract_index (contract_id, current_state, is_terminal, last_event_type)
                VALUES (${cid}, 'EXECUTION_CONFIRMED', 0, 'EXECUTION_CONFIRMED')
                ON CONFLICT (contract_id) DO NOTHING
            `);
        } catch (e) { /* contract_index may not exist */ }

        // Ledger events for active contracts (no settlement yet)
        const events = [
            { type: 'CONTRACT_CREATED', ts: createdAt, amountCents: null as number | null, meta: { simulated: true, title: scenario.title } },
            { type: 'FUNDS_AUTHORIZED', ts: new Date(createdAt.getTime() + 60000), amountCents: stakeCents, meta: { amountUsdCents: stakeCents } },
            { type: 'FUNDS_LOCKED', ts: new Date(createdAt.getTime() + 120000), amountCents: stakeCents, meta: { amountUsdCents: stakeCents } },
            { type: 'EXECUTION_CONFIRMED', ts: new Date(createdAt.getTime() + 180000), amountCents: stakeCents, meta: { confirmedAt: new Date(createdAt.getTime() + 180000).toISOString() } },
        ];

        let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        for (const evt of events) {
            const eid = randomUUID();
            const eventHash = hashEvent(prevHash + eid + evt.type);
            await db.execute(sql`
                INSERT INTO ledger_events (
                    id, contract_id, actor, event_type, timestamp_utc,
                    amount_usd_cents, metadata_json, prev_event_hash, event_hash
                ) VALUES (
                    ${eid}, ${cid}, 'SYSTEM', ${evt.type}, ${evt.ts.toISOString()},
                    ${evt.amountCents || null}, ${JSON.stringify(evt.meta)},
                    ${prevHash}, ${eventHash}
                )
            `);
            prevHash = eventHash;
        }
    }
    console.log(`[Seed Activity] ✅ Created ${ACTIVE_CONTRACTS.length} in-flight solo contracts`);

    // =========================================================================
    // 5. RIVALRIES — Head-to-head duels
    // =========================================================================
    const RIVALRIES = [
        // Settled rivalries
        { c: 0, o: 3, platform: 'X', metric: 'FOLLOWERS', key: 'x_followers', stake: 25000, days: 14, settled: true, winIdx: 0, daysBack: 8 },
        { c: 1, o: 4, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 50000, days: 30, settled: true, winIdx: 4, daysBack: 12 },
        { c: 2, o: 5, platform: 'YOUTUBE', metric: 'SUBSCRIBERS', key: 'youtube_subscribers', stake: 15000, days: 14, settled: true, winIdx: 2, daysBack: 18 },
        { c: 8, o: 9, platform: 'SHOPIFY', metric: 'REVENUE', key: 'shopify_net_sales', stake: 40000, days: 30, settled: true, winIdx: 9, daysBack: 22 },
        
        // Active rivalries (in-flight) — daysBack high enough to show meaningful growth
        { c: 6, o: 7, platform: 'X', metric: 'FOLLOWERS', key: 'x_followers', stake: 25000, days: 14, settled: false, daysBack: 6 },
        { c: 10, o: 11, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 75000, days: 30, settled: false, daysBack: 10 },
        { c: 0, o: 12, platform: 'YOUTUBE', metric: 'VIEWS', key: 'youtube_30day_views', stake: 20000, days: 14, settled: false, daysBack: 5 },

        // Recently activated
        { c: 14, o: 15, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 30000, days: 14, settled: false, daysBack: 4 },

        /* ── 12 more, so the board reads as a market ──
           DELIBERATELY STAGGERED. Every one of these carries a different
           duration and a different daysBack, which means every card shows a
           different time remaining — eight contracts all expiring on the same
           afternoon is the tell that a market was generated rather than
           traded. Durations stay on the 14/21/30 ladder the product actually
           issues, and stakes stay inside the tier caps in house-edge-policy.

           A third are OPEN (pending: true, no opponent yet) so the board's
           Open segment has something in it and "Join Rivalry" leads somewhere
           real. The rest are live and mid-flight. */

        // Open challenges — issued, waiting for someone to take the other side
        { c: 2, o: 3, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 100000, days: 30, settled: false, daysBack: 2, pending: true },
        { c: 5, o: 6, platform: 'YOUTUBE', metric: 'SUBSCRIBERS', key: 'youtube_subscribers', stake: 25000, days: 21, settled: false, daysBack: 1, pending: true },
        { c: 9, o: 10, platform: 'X', metric: 'FOLLOWERS', key: 'x_followers', stake: 50000, days: 14, settled: false, daysBack: 3, pending: true },
        { c: 12, o: 13, platform: 'SHOPIFY', metric: 'REVENUE', key: 'shopify_net_sales', stake: 75000, days: 30, settled: false, daysBack: 1, pending: true },

        // Live, early in their window
        { c: 4, o: 8, platform: 'SHOPIFY', metric: 'REVENUE', key: 'shopify_net_sales', stake: 60000, days: 30, settled: false, daysBack: 3 },
        { c: 11, o: 14, platform: 'YOUTUBE', metric: 'VIEWS', key: 'youtube_30day_views', stake: 35000, days: 21, settled: false, daysBack: 2 },
        { c: 1, o: 7, platform: 'X', metric: 'FOLLOWERS', key: 'x_followers', stake: 15000, days: 14, settled: false, daysBack: 4 },

        // Live, mid-flight
        { c: 3, o: 15, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 250000, days: 30, settled: false, daysBack: 13 },
        { c: 6, o: 9, platform: 'SHOPIFY', metric: 'REVENUE', key: 'shopify_net_sales', stake: 40000, days: 21, settled: false, daysBack: 9 },
        { c: 13, o: 0, platform: 'YOUTUBE', metric: 'SUBSCRIBERS', key: 'youtube_subscribers', stake: 20000, days: 14, settled: false, daysBack: 7 },

        // Live, close to the deadline — these are the ones whose clocks read in
        // hours rather than days on the board
        { c: 8, o: 5, platform: 'STRIPE', metric: 'REVENUE', key: 'stripe_net_revenue', stake: 125000, days: 14, settled: false, daysBack: 13 },
        { c: 15, o: 2, platform: 'X', metric: 'FOLLOWERS', key: 'x_followers', stake: 30000, days: 21, settled: false, daysBack: 20 },
    ];

    let rivalryCount = 0;
    for (const r of RIVALRIES) {
        const rid = randomUUID();
        const challengerId = userIds[r.c];
        const opponentId = userIds[r.o];

        /* EACH PAIR CHECKS FOR ITSELF, so this whole set can be re-run to add
           the ones that are new without duplicating the ones that are not.
           The pair plus the metric is the identity: the same two operators may
           legitimately run more than one rivalry, but not two of the same
           metric on the same platform. */
        const dupe: any = await db.execute(sql`
            SELECT 1 FROM rivalries
            WHERE challenger_user_id = ${challengerId}
              AND opponent_user_id = ${opponentId}
              AND platform = ${r.platform}
              AND metric_type = ${r.metric}
            LIMIT 1
        `);
        const alreadyThere = (dupe?.rows?.length ?? dupe?.length ?? 0) > 0;
        if (alreadyThere) continue;

        const daysBack = r.daysBack;
        const issuedAt = daysAgo(daysBack + (r.settled ? r.days : 0));
        const acceptedAt = (r as any).pending ? null : new Date(issuedAt.getTime() + rand(2, 18) * 3600000);
        const fundedAt = acceptedAt ? new Date(acceptedAt.getTime() + rand(1, 8) * 3600000) : null;
        const activatedAt = fundedAt ? new Date(fundedAt.getTime() + 60000) : null;
        const deadlineUtc = activatedAt ? new Date(activatedAt.getTime() + r.days * 86400000) : null;
        const settledAt = r.settled && deadlineUtc ? new Date(deadlineUtc.getTime() + rand(1, 3) * 3600000) : null;
        const winnerId = r.settled && r.winIdx !== undefined ? userIds[r.winIdx] : null;
        const poolCents = r.stake * 2;
        const feeCents = Math.round(poolCents * 0.12);
        const winnerPayout = poolCents - feeCents;

        await db.execute(sql`
            INSERT INTO rivalries (
                id, challenger_user_id, opponent_user_id,
                platform, metric_type, metric_key,
                stake_per_side_cents, duration_days,
                acceptance_ttl_hours, funding_ttl_hours, protocol_fee_bps,
                target_growth_pct, rivalry_tier,
                challenge_issued_at, accepted_at, funded_at, activated_at,
                deadline_utc, settled_at, winner_user_id,
                settlement_metadata,
                created_at, updated_at
            ) VALUES (
                ${rid}, ${challengerId}, ${opponentId},
                ${r.platform}, ${r.metric}, ${r.key},
                ${r.stake}, ${r.days},
                72, 48, 1200,
                '15', 'DUEL',
                ${issuedAt.toISOString()}, ${acceptedAt?.toISOString() || null}, ${fundedAt?.toISOString() || null}, ${activatedAt?.toISOString() || null},
                ${deadlineUtc?.toISOString() || null}, ${settledAt?.toISOString() || null}, ${winnerId},
                ${r.settled ? JSON.stringify({ winnerPayout, feeCents, pool: poolCents }) : null},
                ${issuedAt.toISOString()}, ${(settledAt || new Date()).toISOString()}
            )
        `);

        // Rivalry participants
        // Generate baselines ONCE — shared between participants and snapshots
        const cBaselineVal = r.metric === 'REVENUE' ? rand(100000, 400000) : rand(2000, 40000);
        const oBaselineVal = r.metric === 'REVENUE' ? rand(100000, 400000) : rand(2000, 40000);

        if (!((r as any).pending)) {
            for (const side of [
                { uid: challengerId, role: 'challenger', bv: cBaselineVal, growthSeed: Math.random() },
                { uid: opponentId, role: 'opponent', bv: oBaselineVal, growthSeed: Math.random() }
            ]) {
                let fv: number | null;
                let pctDelta: string | null;

                if (r.settled) {
                    // Settled: final growth between 5-35%
                    fv = Math.round(side.bv * (1 + (Math.random() * 0.35)));
                    pctDelta = (((fv - side.bv) / side.bv) * 100).toFixed(2);
                } else {
                    // Active: compute current growth based on how far through the rivalry we are
                    const elapsed = daysBack;
                    const progress = Math.min(elapsed / Math.max(r.days, 1), 0.95);
                    // Growth: 1-12% range, proportional to progress with some randomness
                    const growthRate = (1 + side.growthSeed * 11) * progress;
                    fv = Math.round(side.bv * (1 + growthRate / 100));
                    pctDelta = growthRate.toFixed(2);
                }

                const isWinner = winnerId === side.uid;

                await db.execute(sql`
                    INSERT INTO rivalry_participants (
                        id, rivalry_id, user_id, role, funded, funded_at,
                        baseline_value, baseline_json, baseline_snapshot_at,
                        final_value, final_json, final_snapshot_at,
                        absolute_delta, percentage_delta,
                        outcome, payout_cents
                    ) VALUES (
                        ${randomUUID()}, ${rid}, ${side.uid}, ${side.role}, true, ${fundedAt?.toISOString() || null},
                        ${side.bv.toString()}, ${JSON.stringify({ value: side.bv })}, ${activatedAt?.toISOString() || null},
                        ${fv.toString()}, ${JSON.stringify({ value: fv, simulated: true })}, ${r.settled ? settledAt?.toISOString() || null : new Date().toISOString()},
                        ${(fv - side.bv).toString()}, ${pctDelta},
                        ${r.settled ? (isWinner ? 'WIN' : 'LOSS') : null},
                        ${r.settled ? (isWinner ? winnerPayout : 0) : null}
                    )
                `);
            }
        }

        // Rivalry ledger events — must use correct RivalryEventType constants
        const rEvents: { type: string; ts: Date; uid: string | null; amount?: number }[] = [
            { type: 'RIVALRY_CREATED', ts: issuedAt, uid: challengerId },
        ];
        if (acceptedAt) rEvents.push({ type: 'RIVALRY_ACCEPTED', ts: acceptedAt, uid: opponentId });
        if (fundedAt) {
            rEvents.push({ type: 'RIVALRY_CHALLENGER_FUNDED', ts: fundedAt, uid: challengerId, amount: r.stake });
            rEvents.push({ type: 'RIVALRY_OPPONENT_FUNDED', ts: new Date(fundedAt.getTime() + 30000), uid: opponentId, amount: r.stake });
            rEvents.push({ type: 'RIVALRY_BOTH_FUNDED', ts: new Date(fundedAt.getTime() + 60000), uid: null, amount: r.stake * 2 });
        }
        if (activatedAt) rEvents.push({ type: 'RIVALRY_ACTIVATED', ts: activatedAt, uid: null });
        if (settledAt) {
            rEvents.push({ type: 'RIVALRY_VERIFICATION_STARTED', ts: new Date(settledAt.getTime() - 3600000), uid: null });
            rEvents.push({ type: 'RIVALRY_VERIFIED', ts: new Date(settledAt.getTime() - 1800000), uid: null });
            rEvents.push({ type: 'RIVALRY_SETTLEMENT_STARTED', ts: new Date(settledAt.getTime() - 600000), uid: null });
            rEvents.push({ type: 'RIVALRY_SETTLED', ts: settledAt, uid: null, amount: poolCents });
        }

        let rPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        for (const evt of rEvents) {
            const eid = randomUUID();
            const eventHash = hashEvent(rPrevHash + eid + evt.type);
            await db.execute(sql`
                INSERT INTO rivalry_ledger_events (
                    id, rivalry_id, actor, event_type, user_id,
                    timestamp_utc, amount_usd_cents,
                    metadata_json, prev_event_hash, event_hash
                ) VALUES (
                    ${eid}, ${rid}, 'SYSTEM', ${evt.type}, ${evt.uid},
                    ${evt.ts.toISOString()}, ${evt.amount || null},
                    ${JSON.stringify({ simulated: true })},
                    ${rPrevHash}, ${eventHash}
                )
            `);
            rPrevHash = eventHash;
        }

        // Metric snapshots for active (non-settled) rivalries
        // Uses the SAME baselines as participants above
        if (!r.settled && activatedAt && !((r as any).pending)) {
            for (const side of [
                { uid: challengerId, bv: cBaselineVal },
                { uid: opponentId, bv: oBaselineVal }
            ]) {
                const hoursIn = daysBack * 24;
                const snapshotCount = Math.min(Math.floor(hoursIn / 24), r.days);
                for (let d = 0; d < snapshotCount; d++) {
                    const fetchedAt = new Date(activatedAt.getTime() + d * 86400000 + rand(0, 43200000));
                    // Cap growth to realistic range: 0-15% over the full period
                    const growthPct = (d / Math.max(r.days, 1)) * (2 + Math.random() * 10);
                    const value = Math.round(side.bv * (1 + growthPct / 100));
                    await db.execute(sql`
                        INSERT INTO rivalry_metric_snapshots (
                            id, rivalry_id, user_id, provider, metric_key,
                            metric_value, fetched_at, created_at
                        ) VALUES (
                            ${randomUUID()}, ${rid}, ${side.uid}, ${r.platform}, ${r.key},
                            ${value.toString()}, ${fetchedAt.toISOString()}, ${fetchedAt.toISOString()}
                        )
                    `);
                }
            }
        }

        rivalryCount++;
    }

    const activeRivalries = RIVALRIES.filter(r => !r.settled).length;
    console.log(`[Seed Activity] ✅ Created ${rivalryCount} rivalries (${RIVALRIES.filter(r => r.settled).length} settled, ${activeRivalries} active/pending)`);

    const summary = {
        users: userIds.length,
        contracts: contractIds.length,
        settledContracts: SETTLED_CONTRACTS.length,
        activeContracts: ACTIVE_CONTRACTS.length,
        rivalries: rivalryCount,
        activeRivalries,
    };

    console.log('[Seed Activity] 🎉 Seeding complete!', summary);
    return summary;
}

// Run if main
if (process.argv[1] === import.meta.filename) {
    seedSimulatedActivity()
        .then((result) => {
            console.log('[Seed Activity] Result:', result);
            process.exit(0);
        })
        .catch(e => {
            console.error('[Seed Activity] FATAL:', e);
            process.exit(1);
        });
}
