
import 'dotenv/config';
import { db } from './client.js';
import { contractTemplates, marketContractInstances, marketStatsCache } from './schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { STAKE_CAPS, PAYOUT_MULTIPLIERS } from '../services/house-edge-policy.js';

// =============================================================================
// STRICT TEMPLATE CATALOG (12 Templates — Sprint & Marathon only)
// =============================================================================
// Rules:
// - Verified Providers Only: STRIPE, X, SHOPIFY, YOUTUBE
// - Metrics: Revenue/Followers/Sales/Subs/Views only. No vanity metrics.
// - Durations: 14-day (Sprint) and 30-day (Marathon) only.
// - Tiers: Pledge (1.7x), Stake (2.5x), All In (4.0x)  ← matches house-edge-policy.ts

const TIER_OPTIONS = {
    controlled: 1.7,
    elevated: 2.5,
    maximum: 4.0
};

const TEMPLATES = [
    // --- STRIPE (Finance) ---
    {
        slug: 'stripe-revenue-growth-14d',
        title: 'Net Revenue Growth (14d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Increase Stripe net revenue over 14 days compared to baseline.',
        rules: { metricKey: 'stripe_net_revenue', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'stripe-revenue-growth-30d',
        title: 'Net Revenue Growth (30d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Increase Stripe net revenue over 30 days compared to baseline.',
        rules: { metricKey: 'stripe_net_revenue', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },

    // --- X / TWITTER (Social) ---
    {
        slug: 'x-follower-growth-14d',
        title: 'Follower Growth (14d)',
        category: 'social',
        provider: 'X',
        description: 'Grow your X audience count over 14 days.',
        rules: { metricKey: 'x_followers', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'x-follower-growth-30d',
        title: 'Follower Growth (30d)',
        category: 'social',
        provider: 'X',
        description: 'Grow your X audience count over 30 days.',
        rules: { metricKey: 'x_followers', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },

    // --- SHOPIFY (Commerce) ---
    {
        slug: 'shopify-net-sales-14d',
        title: 'Store Net Sales (14d)',
        category: 'commerce',
        provider: 'SHOPIFY',
        description: 'Increase Shopify Net Sales over 14 days.',
        rules: { metricKey: 'shopify_net_sales', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'shopify-net-sales-30d',
        title: 'Store Net Sales (30d)',
        category: 'commerce',
        provider: 'SHOPIFY',
        description: 'Increase Shopify Net Sales over 30 days.',
        rules: { metricKey: 'shopify_net_sales', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'shopify-order-volume-14d',
        title: 'Order Volume Growth (14d)',
        category: 'commerce',
        provider: 'SHOPIFY',
        description: 'Increase total order count over 14 days.',
        rules: { metricKey: 'shopify_order_volume', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'shopify-order-volume-30d',
        title: 'Order Volume Growth (30d)',
        category: 'commerce',
        provider: 'SHOPIFY',
        description: 'Increase total order count over 30 days.',
        rules: { metricKey: 'shopify_order_volume', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },

    // --- YOUTUBE (Creator) ---
    {
        slug: 'youtube-subscriber-growth-14d',
        title: 'Subscriber Growth (14d)',
        category: 'social',
        provider: 'YOUTUBE',
        description: 'Grow your YouTube subscriber count over 14 days.',
        rules: { metricKey: 'youtube_subscribers', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'youtube-subscriber-growth-30d',
        title: 'Subscriber Growth (30d)',
        category: 'social',
        provider: 'YOUTUBE',
        description: 'Grow your YouTube subscriber count over 30 days.',
        rules: { metricKey: 'youtube_subscribers', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'youtube-views-growth-14d',
        title: '30-Day Views Growth (14d)',
        category: 'social',
        provider: 'YOUTUBE',
        description: 'Grow your YouTube 30-day view count over 14 days.',
        rules: { metricKey: 'youtube_30day_views', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'youtube-views-growth-30d',
        title: '30-Day Views Growth (30d)',
        category: 'social',
        provider: 'YOUTUBE',
        description: 'Grow your YouTube 30-day view count over 30 days.',
        rules: { metricKey: 'youtube_30day_views', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },

    // --- STRIPE (Additional Finance) ---
    {
        slug: 'stripe-charge-volume-14d',
        title: 'Charge Volume Growth (14d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Increase total Stripe charge count over 14 days.',
        rules: { metricKey: 'stripe_charge_volume', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'stripe-charge-volume-30d',
        title: 'Charge Volume Growth (30d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Increase total Stripe charge count over 30 days.',
        rules: { metricKey: 'stripe_charge_volume', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'stripe-mrr-growth-14d',
        title: 'Monthly Recurring Revenue (14d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Grow Stripe MRR (subscriptions) over 14 days.',
        rules: { metricKey: 'stripe_mrr', window_days: 14 },
        tierOptions: TIER_OPTIONS
    },
    {
        slug: 'stripe-mrr-growth-30d',
        title: 'Monthly Recurring Revenue (30d)',
        category: 'finance',
        provider: 'STRIPE',
        description: 'Grow Stripe MRR (subscriptions) over 30 days.',
        rules: { metricKey: 'stripe_mrr', window_days: 30 },
        tierOptions: TIER_OPTIONS
    },
];

// =============================================================================
// SEED LOGIC
// =============================================================================

function getTierFromRandom(rand: number) {
    if (rand < 0.6) return 'controlled';
    if (rand < 0.9) return 'elevated';
    return 'maximum';
}

function getPolicyForTier(metricKey: string, tier: string, windowDays: number) {
    const isStripe = metricKey.startsWith('stripe');
    const isX = metricKey.startsWith('x');
    const isShopifySales = metricKey === 'shopify_net_sales';
    const isShopifyVolume = metricKey === 'shopify_order_volume';
    const isYouTubeSubs = metricKey === 'youtube_subscribers';
    const isYouTubeViews = metricKey === 'youtube_30day_views';

    let targetPct = 0;

    // =========================================================================
    // GROWTH TARGETS — per-source calibration for 70/80/90% failure rates
    //
    // Design philosophy: "Looks achievable. They sign up. They fail."
    //
    // Revenue (Stripe/Shopify): HARDER targets — one big sale can spike 50%
    // Followers/Subs (X/YT):   BASE targets — pure daily grind, no shortcuts
    // Views (YouTube):         HARDEST targets — most volatile, one video = 10x
    // Order Volume:            SAME AS followers — hard to manipulate count
    //
    // 14-day Sprint: Lower % but brutal daily rate
    // 30-day Marathon: Higher % — users think they have time, they don't
    // =========================================================================

    if (windowDays <= 14) {
        // =====================
        // 14-DAY SPRINT
        // =====================
        if (tier === 'controlled') {
            // PLEDGE — looks easy, 70% fail
            if (isX)                              { targetPct = 25; }  // +25% followers
            else if (isYouTubeSubs)               { targetPct = 25; }  // +25% subs
            else if (isStripe || isShopifySales)   { targetPct = 30; }  // +30% revenue (easier to spike)
            else if (isYouTubeViews)              { targetPct = 40; }  // +40% views (most volatile)
            else if (isShopifyVolume)             { targetPct = 25; }  // +25% orders
        } else if (tier === 'elevated') {
            // STAKE — brutal, 80% fail
            if (isX)                              { targetPct = 35; }  // +35% followers
            else if (isYouTubeSubs)               { targetPct = 35; }  // +35% subs
            else if (isStripe || isShopifySales)   { targetPct = 45; }  // +45% revenue
            else if (isYouTubeViews)              { targetPct = 60; }  // +60% views
            else if (isShopifyVolume)             { targetPct = 35; }  // +35% orders
        } else {
            // ALL IN — insane, 90% fail
            if (isX)                              { targetPct = 50; }  // +50% followers
            else if (isYouTubeSubs)               { targetPct = 50; }  // +50% subs
            else if (isStripe || isShopifySales)   { targetPct = 65; }  // +65% revenue
            else if (isYouTubeViews)              { targetPct = 90; }  // +90% views
            else if (isShopifyVolume)             { targetPct = 50; }  // +50% orders
        }
    } else {
        // =====================
        // 30-DAY MARATHON
        // =====================
        if (tier === 'controlled') {
            // PLEDGE — "I have a whole month" → 70% still fail
            if (isX)                              { targetPct = 40; }  // +40% followers
            else if (isYouTubeSubs)               { targetPct = 40; }  // +40% subs
            else if (isStripe || isShopifySales)   { targetPct = 50; }  // +50% revenue
            else if (isYouTubeViews)              { targetPct = 60; }  // +60% views
            else if (isShopifyVolume)             { targetPct = 40; }  // +40% orders
        } else if (tier === 'elevated') {
            // STAKE — "month gives me buffer" → 80% fail anyway
            if (isX)                              { targetPct = 55; }  // +55% followers
            else if (isYouTubeSubs)               { targetPct = 55; }  // +55% subs
            else if (isStripe || isShopifySales)   { targetPct = 70; }  // +70% revenue
            else if (isYouTubeViews)              { targetPct = 85; }  // +85% views
            else if (isShopifyVolume)             { targetPct = 55; }  // +55% orders
        } else {
            // ALL IN — "all or nothing for 30 days" → 90% fail
            if (isX)                              { targetPct = 75; }  // +75% followers
            else if (isYouTubeSubs)               { targetPct = 75; }  // +75% subs
            else if (isStripe || isShopifySales)   { targetPct = 100; } // +100% revenue (DOUBLE IT)
            else if (isYouTubeViews)              { targetPct = 130; } // +130% views
            else if (isShopifyVolume)             { targetPct = 75; }  // +75% orders
        }
    }

    return {
        mode: 'percentage_delta',
        target_pct: targetPct,
        min_absolute_floor: 10
    };
}

function getHint(metricKey: string, policy: any, windowDays: number) {
    const noun = metricKey.includes('revenue') || metricKey.includes('sales') ? 'revenue' :
        metricKey.includes('followers') ? 'followers' :
            metricKey.includes('subscribers') ? 'subscribers' :
                metricKey.includes('views') ? 'views' :
                    metricKey.includes('volume') ? 'orders' : 'units';

    return `Target: +${policy.target_pct}% ${noun} (${windowDays}d)`;
}

export async function seedCatalog() {
    console.log('[Seed] 🌱 Starting Catalog Seed...');

    // 1. Upsert Templates
    // We ignore 'updatedAt' to satisfy strict Typescript checks on the update object
    // Drizzle defaultNow() handles creation.
    for (const t of TEMPLATES) {
        await db.insert(contractTemplates)
            .values({
                slug: t.slug,
                title: t.title,
                category: t.category,
                provider: t.provider as any,
                description: t.description,
                rulesJson: t.rules,
                tierOptionsJson: t.tierOptions
            })
            .onConflictDoUpdate({
                target: contractTemplates.slug,
                set: {
                    title: t.title,
                    category: t.category,
                    provider: t.provider as any,
                    description: t.description,
                    rulesJson: t.rules,
                    tierOptionsJson: t.tierOptions
                }
            });
    }
    console.log(`[Seed] ✅ Ensured ${TEMPLATES.length} templates.`);

    // NOTE: displayTargetHint is now computed at serve time in market.ts
    // No need to fix DB values — computeTargetHint() overrides them in API responses

    // 2. Ensure Listings (20 Open)
    // - slotsTotal = 500
    // - slotsFilled = random(0-50)
    // - minStake = 2500, maxStake = 200000
    // - fundingCloseAt = 7 days from now

    // Get all templates to spawn from
    const allTemplates = await db.select().from(contractTemplates);

    // Filter for valid templates (must have metricKey)
    const validTemplates = allTemplates.filter(t => {
        const r = t.rulesJson as any;
        return r && typeof r.metricKey === 'string';
    });
    console.log(`[Seed] Found ${validTemplates.length} valid templates out of ${allTemplates.length} total.`);

    // Check current open listings
    const currentOpen = await db.select().from(marketContractInstances)
        .where(gt(marketContractInstances.fundingCloseAt, new Date()));

    let activeCount = currentOpen.length;
    let createdCount = 0;
    const TARGET_OPEN = 48;  // 16 templates × 3 tiers = full catalog

    console.log(`[Seed] Found ${activeCount} active listings. Target ${TARGET_OPEN}.`);

    if (activeCount < TARGET_OPEN && validTemplates.length > 0) {
        // Shuffle templates to pick random ones
        const shuffled = [...validTemplates].sort(() => 0.5 - Math.random());

        while (activeCount < TARGET_OPEN) {
            const t = shuffled[activeCount % shuffled.length];

            const filled = Math.floor(Math.random() * 51); // 0-50
            const fundingClose = new Date();
            fundingClose.setDate(fundingClose.getDate() + 7);

            // Tier Allocation (Fixed: 2 Maximum, 3 Elevated, 5 Controlled per 10 items)
            // Indices 0,1 -> Maximum (20%)
            // Indices 2,3,4 -> Elevated (30%)
            // Indices 5-9 -> Controlled (50%)
            const cyclicIndex = createdCount % 10;
            let tier = 'controlled';

            if (cyclicIndex < 2) {
                tier = 'maximum';
            } else if (cyclicIndex < 5) {
                tier = 'elevated';
            }

            const rules = t.rulesJson as any;
            const tierOptions = t.tierOptionsJson as any;

            // Smart Stake Ladder — values come from house-edge-policy.ts
            let minStake = STAKE_CAPS.STANDARD.minUsdCents;
            let maxStake = STAKE_CAPS.STANDARD.maxUsdCents;
            let multiplier = PAYOUT_MULTIPLIERS.STANDARD;
            let feeBps = 200;      // 2%

            // Sourced from house-edge-policy.ts — never re-typed as literals here.
            // Hardcoded copies silently drift the moment the policy changes.
            if (tier === 'controlled') {
                minStake = STAKE_CAPS.STANDARD.minUsdCents;
                maxStake = STAKE_CAPS.STANDARD.maxUsdCents;
                multiplier = PAYOUT_MULTIPLIERS.STANDARD;
                feeBps = 200;       // 2%
            } else if (tier === 'elevated') {
                minStake = STAKE_CAPS.ADVANCED.minUsdCents;
                maxStake = STAKE_CAPS.ADVANCED.maxUsdCents;
                multiplier = PAYOUT_MULTIPLIERS.ADVANCED;
                feeBps = 300;       // 3%
            } else if (tier === 'maximum') {
                minStake = STAKE_CAPS.ELITE.minUsdCents;
                maxStake = STAKE_CAPS.ELITE.maxUsdCents;
                multiplier = PAYOUT_MULTIPLIERS.ELITE;
                feeBps = 500;       // 5%
            }

            const policy = getPolicyForTier(rules.metricKey, tier, rules.window_days);
            const hint = getHint(rules.metricKey, policy, rules.window_days);

            // We explicitly cast to 'any' to avoid strict type errors with Drizzle's inference
            // strictly matching the schema fields we know exist.
            const [newInstance] = await db.insert(marketContractInstances).values({
                templateId: t.id,
                // status defaults to 'published'
                publishAt: new Date(),
                fundingCloseAt: fundingClose,
                capacityTotal: 500,
                capacityRemaining: 500 - filled,
                minLockCents: minStake,
                maxLockCents: maxStake,
                termsVersion: 1,
                instanceTermsJson: {
                    executionFeeBps: feeBps,
                    tier: tier // redundancy for terms verification
                },

                // Smart Tier Fields
                tier: tier,
                multiplier: multiplier.toString(),
                metricKey: rules.metricKey,
                targetPolicyJson: policy,
                displayTargetHint: hint
            } as any).returning();

            // Init stats
            await db.insert(marketStatsCache).values({
                instanceId: newInstance.id
            } as any);

            activeCount++;
            createdCount++;
        }
    }

    console.log(`[Seed] 🚀 Created ${createdCount} new listings.`);
    console.log('[Seed] Done.');
}

// Run if main
if (process.argv[1] === import.meta.filename) {
    seedCatalog()
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}
