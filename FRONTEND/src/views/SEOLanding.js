// SEO Landing Pages — platform-specific landing pages for organic search
// Routes: /go/stripe, /go/x, /go/shopify, /go/youtube
// Each page is optimized for specific long-tail keywords

export function renderSEOLanding(params) {
    const platform = params?.platform || 'stripe';
    const config = SEO_PAGES[platform] || SEO_PAGES.stripe;

    return `
        <style>
            .seo { min-height: 100vh; background: #F5EDDA; font-family: 'Sora', sans-serif; }
            .seo-hero {
                text-align: center; padding: 100px 24px 60px;
                max-width: 720px; margin: 0 auto;
            }
            .seo-badge {
                display: inline-block; font-family: 'JetBrains Mono', monospace;
                font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
                color: #5C1414; border: 1px solid #5C1414; padding: 6px 16px;
                margin-bottom: 28px;
            }
            .seo-h1 {
                font-size: 36px; font-weight: 900; color: #111; letter-spacing: -1.5px;
                line-height: 1.15; margin-bottom: 20px;
            }
            .seo-h1 strong { color: #5C1414; }
            .seo-sub {
                font-size: 17px; color: #777; line-height: 1.8; max-width: 540px;
                margin: 0 auto 40px;
            }
            .seo-cta {
                display: inline-block; background: #5C1414; color: #fff;
                padding: 18px 48px; font-size: 14px; font-weight: 700;
                letter-spacing: 1px; text-transform: uppercase; border: none;
                cursor: pointer; font-family: 'Sora', sans-serif;
                text-decoration: none; transition: background 0.3s;
            }
            .seo-cta:hover { background: #6e1c1c; }

            /* How it works */
            .seo-how { background: #FAF4E6; padding: 80px 24px; }
            .seo-how-inner { max-width: 900px; margin: 0 auto; }
            .seo-how-tag {
                font-family: 'JetBrains Mono', monospace; font-size: 10px;
                letter-spacing: 2px; text-transform: uppercase; color: #aaa;
                margin-bottom: 32px;
            }
            .seo-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
            .seo-how-step {}
            .seo-how-num {
                font-size: 36px; font-weight: 900; color: #5C1414; opacity: 0.3;
                margin-bottom: 12px; font-family: 'JetBrains Mono', monospace;
            }
            .seo-how-title { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 8px; }
            .seo-how-desc { font-size: 13px; color: #888; line-height: 1.7; }

            /* Use cases */
            .seo-use { padding: 80px 24px; max-width: 720px; margin: 0 auto; }
            .seo-use-tag {
                font-family: 'JetBrains Mono', monospace; font-size: 10px;
                letter-spacing: 2px; text-transform: uppercase; color: #aaa;
                margin-bottom: 32px;
            }
            .seo-use-list { display: flex; flex-direction: column; gap: 16px; }
            .seo-use-item {
                display: flex; align-items: flex-start; gap: 16px;
                padding: 24px; border: 1px solid #f0f0f0;
            }
            .seo-use-check { color: #5C1414; font-size: 18px; flex-shrink: 0; margin-top: 2px; }
            .seo-use-text { font-size: 14px; color: #444; line-height: 1.6; }
            .seo-use-text strong { color: #111; }

            /* Bottom CTA */
            .seo-bottom-cta {
                text-align: center; padding: 80px 24px;
                background: #111; color: #fff;
            }
            .seo-bottom-h2 { font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px; }
            .seo-bottom-sub { font-size: 14px; color: #999; margin-bottom: 32px; }
            .seo-bottom-btn {
                display: inline-block; background: #5C1414; color: #fff;
                padding: 18px 48px; font-size: 14px; font-weight: 700;
                letter-spacing: 1px; text-transform: uppercase; border: none;
                cursor: pointer; font-family: 'Sora', sans-serif;
                text-decoration: none;
            }

            .seo-footer {
                text-align: center; padding: 32px; font-size: 11px; color: #ccc;
                font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;
            }

            @media (max-width: 768px) {
                .seo-h1 { font-size: 24px; }
                .seo-sub { font-size: 15px; }
                .seo-how-grid { grid-template-columns: 1fr; gap: 24px; }
                .seo-hero { padding: 80px 20px 40px; }
                .seo-bottom-h2 { font-size: 24px; }
            }
        </style>

        <div class="seo">
            <!-- Hero -->
            <div class="seo-hero">
                <div class="seo-badge">${config.badge}</div>
                <h1 class="seo-h1">${config.headline}</h1>
                <p class="seo-sub">${config.subtext}</p>
                <a href="/market" class="seo-cta" onclick="event.preventDefault(); window.app.openAccessModal();">
                    ${config.ctaText}
                </a>
            </div>

            <!-- How it works -->
            <div class="seo-how">
                <div class="seo-how-inner">
                    <div class="seo-how-tag">── How It Works</div>
                    <div class="seo-how-grid">
                        ${config.steps.map((step, i) => `
                            <div class="seo-how-step">
                                <div class="seo-how-num">0${i + 1}</div>
                                <div class="seo-how-title">${step.title}</div>
                                <div class="seo-how-desc">${step.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Use cases -->
            <div class="seo-use">
                <div class="seo-use-tag">── ${config.useCaseTag}</div>
                <div class="seo-use-list">
                    ${config.useCases.map(uc => `
                        <div class="seo-use-item">
                            <div class="seo-use-check">✓</div>
                            <div class="seo-use-text">${uc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Bottom CTA -->
            <div class="seo-bottom-cta">
                <div class="seo-bottom-h2">${config.bottomHeadline}</div>
                <div class="seo-bottom-sub">${config.bottomSub}</div>
                <a href="/market" class="seo-bottom-btn" onclick="event.preventDefault(); window.app.openAccessModal();">
                    Start Free →
                </a>
            </div>

            <div class="seo-footer">
                Collateral.market · Performance Contract Protocol · © 2026
            </div>
        </div>
    `;
}

export function initSEOLanding() {
    if (window.trackEvent) {
        const platform = window.location.pathname.split('/go/')[1] || 'unknown';
        window.trackEvent('seo_landing_view', { platform });
    }
}

// ================================================================
// SEO PAGE CONFIGURATIONS
// ================================================================

const SEO_PAGES = {
    stripe: {
        badge: 'Stripe Revenue Contracts',
        headline: 'Lock capital against your <strong>Stripe revenue</strong> targets.',
        subtext: 'Put real money behind your MRR goals. Connect Stripe, set a revenue target, and lock capital. Hit it — get paid. Miss it — lose your stake. No excuses.',
        ctaText: 'Start a Revenue Contract →',
        steps: [
            { title: 'Connect Stripe', desc: 'Read-only access to your revenue data. We never touch your payouts or customer data.' },
            { title: 'Set Your Revenue Target', desc: 'Pick a growth percentage and timeline — 14 or 30 days. Lock $25 to $25,000.' },
            { title: 'Hit It or Lose It', desc: 'The protocol verifies your Stripe revenue automatically at deadline. Meet the target = payout. Miss = forfeited.' },
        ],
        useCaseTag: 'Perfect For',
        useCases: [
            '<strong>SaaS founders</strong> who want to force themselves past a revenue milestone',
            '<strong>Freelancers</strong> looking to grow recurring income with real stakes',
            '<strong>Agencies</strong> betting on client revenue growth with skin in the game',
            '<strong>Side projects</strong> transitioning from hobby to business — prove it with money',
        ],
        bottomHeadline: 'Your MRR goal deserves more than a spreadsheet.',
        bottomSub: 'Contracts start at $25. No card required to sign up.',
    },
    x: {
        badge: 'X / Twitter Growth Contracts',
        headline: 'Put money behind your <strong>X follower</strong> growth.',
        subtext: 'Stop chasing vanity metrics with zero consequence. Lock capital against a follower growth target. The protocol verifies everything automatically.',
        ctaText: 'Start a Follower Contract →',
        steps: [
            { title: 'Connect X', desc: 'OAuth connection to your X account. We read follower count — never post, like, or DM.' },
            { title: 'Set Your Growth Target', desc: 'Pick a follower growth % over 14 or 30 days. Minimum 1,000 existing followers.' },
            { title: 'Grow or Lose', desc: 'At deadline, the protocol snapshots your follower count. Exceed the target = payout up to 4x.' },
        ],
        useCaseTag: 'Who This Is For',
        useCases: [
            '<strong>Content creators</strong> tired of inconsistent posting — put money on the line',
            '<strong>Founders building in public</strong> who want to prove audience traction',
            '<strong>Rivals</strong> — challenge a friend to a head-to-head follower duel',
            '<strong>Personal brands</strong> looking to accelerate growth with real accountability',
        ],
        bottomHeadline: 'Followers are free. Accountability isn\'t.',
        bottomSub: 'Lock capital, hit your target, get paid. It\'s that simple.',
    },
    shopify: {
        badge: 'Shopify Sales Contracts',
        headline: 'Bet on your <strong>Shopify store</strong> performance.',
        subtext: 'Lock real capital against your sales targets. The protocol monitors your orders, revenue, and growth — then settles automatically at deadline.',
        ctaText: 'Start a Sales Contract →',
        steps: [
            { title: 'Connect Shopify', desc: 'Read-only access to your store metrics. Orders, revenue, and product data.' },
            { title: 'Set a Sales Target', desc: 'Revenue growth, order count, or gross sales over a 14 or 30-day window.' },
            { title: 'Perform or Forfeit', desc: 'At deadline, Collateral verifies your Shopify data. Hit = payout. Miss = capital forfeited.' },
        ],
        useCaseTag: 'Built For',
        useCases: [
            '<strong>DTC brands</strong> pushing for a sales milestone before a product launch',
            '<strong>Dropshippers</strong> looking to scale with real financial pressure',
            '<strong>E-commerce operators</strong> who want to bet on their own performance',
            '<strong>Shopify store owners</strong> launching a new product line and need accountability',
        ],
        bottomHeadline: 'Your sales targets don\'t need a motivational quote.',
        bottomSub: 'They need money on the line. Start at $25.',
    },
    youtube: {
        badge: 'YouTube Growth Contracts',
        headline: 'Lock capital against your <strong>YouTube subscriber</strong> growth.',
        subtext: 'Turn your subscriber goal into a financial contract. Connect your channel, set a target, and lock capital. The protocol does the rest.',
        ctaText: 'Start a Subscriber Contract →',
        steps: [
            { title: 'Connect YouTube', desc: 'OAuth access to your channel analytics. We read subscriber count — nothing else.' },
            { title: 'Set Your Subscriber Target', desc: 'Pick a growth target over 14 or 30 days. Lock $25 to $25,000 in capital.' },
            { title: 'Hit the Target', desc: 'At deadline, Collateral snapshots your subscriber count. Exceed it = earn up to 4x.' },
        ],
        useCaseTag: 'Perfect For',
        useCases: [
            '<strong>YouTubers</strong> trying to break past a subscriber plateau',
            '<strong>Video creators</strong> who need external pressure to post consistently',
            '<strong>Educators and course creators</strong> growing an audience with real stakes',
            '<strong>Vloggers</strong> competing with friends for fastest channel growth',
        ],
        bottomHeadline: 'Subscribers don\'t grow on motivation alone.',
        bottomSub: 'Put money on it. Sign up free, lock capital when you\'re ready.',
    },
};
