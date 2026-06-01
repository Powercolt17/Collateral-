// Landing Page — /go — Cold-traffic conversion page
import api from '../api.js';
import { landingCSS } from './LandingStyles.js';

export function renderLanding() {
    return `
        <style>${landingCSS}</style>
        <style>@media(max-width:768px){.lp .ldesktop-proof{display:none!important}}</style>
        <div class="lp">

            <!-- LOADING BAR -->
            <div class="lloading-bar" id="lp-loading-bar"></div>

            <!-- NAV -->
            <nav class="ln">
                <div class="ln-in">
                    <a class="ln-brand" href="/">
                        <span class="logo-wordmark">Collateral</span>
                    </a>
                    <div style="display:flex; align-items:center;">
                        <button class="ln-cta" id="lp-nav-cta">Sign In</button>
                        <button class="ch-hamburger" id="mobile-menu-btn" aria-label="Menu" onclick="window.app.toggleMobileMenu()">
                            <div class="ch-hamburger-lines">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            <!-- ═══ HERO ═══ -->
            <div class="lhero-section">
            <div class="lw">
                <div class="lhero-grid">
                    <div class="lhero-left">
                        <h1 class="lh1 animate-fade-in-up">
                            <span class="lh-nobrk">Put money behind your</span><br class="lh-br">
                            <span class="lh-nobrk">next measurable goal.</span>
                        </h1>
                        <p class="lsub animate-fade-in-up delay-1">
                            Create a performance contract, lock capital, and verify the result through official APIs. Hit the target and get paid. <span class="lhide-mobile">Miss it and the contract settles automatically.</span>
                        </p>
                        <div class="lctas animate-fade-in-up delay-2">
                            <button class="lbtn lbtn-r" id="lp-hero-cta">Create Contract</button>
                            <button class="lbtn lbtn-g" onclick="document.getElementById('example-contract').scrollIntoView({behavior:'smooth'})">See Examples</button>
                        </div>
                        <div class="lcta-match ldesktop-proof animate-fade-in-up delay-2">Launch offer: Collateral matches up to $250 on your first contract.</div>
                        <div class="ltrust-bar ldesktop-proof animate-fade-in-up delay-3">API-verified • Funds in escrow • Auto-settled • No screenshots</div>


                    </div>
                    <div class="lhero-right animate-scale-in delay-1">
                        <div class="lpreview-card">
                            <div class="lpcard-header">
                                <div class="lpcard-type">Performance Contract</div>
                                <div class="lpcard-status"><span class="lpcard-status-dot"></span>Live</div>
                            </div>
                            <div class="lpcard-divider"></div>
                            <div class="lpcard-title">Stripe Revenue Growth</div>
                            <div class="lpcard-terms">
                                <div class="lpcard-term"><span class="lpcard-term-k">Stake</span><span class="lpcard-term-v">$250.00</span></div>
                                <div class="lpcard-term"><span class="lpcard-term-k">Target</span><span class="lpcard-term-v">+20% in 30 days</span></div>
                                <div class="lpcard-term"><span class="lpcard-term-k">Multiplier</span><span class="lpcard-term-v lpcard-term-highlight">2.0×</span></div>
                                <div class="lpcard-term"><span class="lpcard-term-k">Verification</span><span class="lpcard-term-v">Stripe API</span></div>
                            </div>
                            <div class="lpcard-outcome">
                                <div class="lpcard-outcome-row lpcard-outcome-hit"><span class="lpcard-outcome-icon">↑</span><span class="lpcard-outcome-text">Hit</span><span class="lpcard-outcome-result">+$500</span></div>
                                <div class="lpcard-outcome-row lpcard-outcome-miss"><span class="lpcard-outcome-icon">↓</span><span class="lpcard-outcome-text">Miss</span><span class="lpcard-outcome-result">−$250</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>


            <!-- ═══ EXAMPLE CONTRACT ═══ -->
            <div class="lw">
                <div class="lex" data-r id="example-contract">
                    <div class="lex-box">
                        <div class="lred-dash"><span class="lmono">Example contract</span></div>
                        <p class="lex-body">Lock $250 behind a Stripe revenue target. Hit the goal by the deadline and get paid. Miss it and the contract settles automatically.</p>
                        <div class="lex-small">Verified through connected accounts — not screenshots or manual review.</div>
                    </div>
                </div>
            </div>

            <!-- ═══ LOGO CAROUSEL ═══ -->
            <div class="lmarquee" data-r>
                <div class="lmarquee-label"><span class="lmono">Verified via official APIs</span></div>
                <div class="lmarquee-track">
                    <div class="lmarquee-slide">
                        <img class="logo-stripe" src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" alt="Stripe">
                        <img class="logo-x" src="https://cdn.simpleicons.org/x/555555" alt="X">
                        <img class="logo-shopify" src="https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" alt="Shopify">
                        <img class="logo-youtube" src="https://www.vectorlogo.zone/logos/youtube/youtube-ar21.svg" alt="YouTube">
                        <img class="logo-stripe" src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" alt="Stripe">
                        <img class="logo-x" src="https://cdn.simpleicons.org/x/555555" alt="X">
                        <img class="logo-shopify" src="https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" alt="Shopify">
                        <img class="logo-youtube" src="https://www.vectorlogo.zone/logos/youtube/youtube-ar21.svg" alt="YouTube">
                    </div>
                    <div class="lmarquee-slide">
                        <img class="logo-stripe" src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" alt="Stripe">
                        <img class="logo-x" src="https://cdn.simpleicons.org/x/555555" alt="X">
                        <img class="logo-shopify" src="https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" alt="Shopify">
                        <img class="logo-youtube" src="https://www.vectorlogo.zone/logos/youtube/youtube-ar21.svg" alt="YouTube">
                        <img class="logo-stripe" src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" alt="Stripe">
                        <img class="logo-x" src="https://cdn.simpleicons.org/x/555555" alt="X">
                        <img class="logo-shopify" src="https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg" alt="Shopify">
                        <img class="logo-youtube" src="https://www.vectorlogo.zone/logos/youtube/youtube-ar21.svg" alt="YouTube">
                    </div>
                </div>
            </div>

            
<!-- ═══ LIVE CONTRACT EXAMPLES ═══ -->
            <div class="lcontracts" id="contracts">
                <div class="lw">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                        <div class="lred-dash" style="margin-bottom: 0;"><span class="lmono">Open Contracts</span></div>
                        
                        <!-- ═══ OPEN CONTRACTS STATS ═══ -->
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="width: 6px; height: 6px; background: #145c14; border-radius: 50%; box-shadow: 0 0 10px rgba(20,92,20,0.8);"></span>
                            <span style="font-family: 'Inter Tight', sans-serif; font-weight: 700; color: #145c14; font-size: 15px; letter-spacing: -0.2px;">$7.6k</span>
                            <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em;">Capital Locked</span>
                        </div>
                    </div>
                    <div class="lcards">
                        <div class="lcard" data-r>
                            <div class="lcard-top">
                                <span class="lcard-src">Stripe</span>
                                <span class="lcard-tier tier-stake">Stake</span>
                            </div>
                            <div class="lcard-title">Revenue Growth</div>
                            <div class="lcard-target">+20% Revenue growth</div>
                            <div class="lcard-row"><span class="k">Stake</span><span class="v">$250 – $3,000</span></div>
                            <div class="lcard-row"><span class="k">Multiplier</span><span class="v">2.5x</span></div>
                            <div class="lcard-row"><span class="k">Window</span><span class="v">30 days</span></div>
                            <div class="lcard-btn"><button class="lp-cta-btn" data-source="STRIPE" data-tier="stake" data-capital="250">Create Contract</button></div>
                        </div>
                        <div class="lcard" data-r>
                            <div class="lcard-top">
                                <span class="lcard-src">X / Twitter</span>
                                <span class="lcard-tier tier-allin">All-In</span>
                            </div>
                            <div class="lcard-title">Follower Growth</div>
                            <div class="lcard-target">+1,000 Followers</div>
                            <div class="lcard-row"><span class="k">Stake</span><span class="v">$500 – $5,000</span></div>
                            <div class="lcard-row"><span class="k">Multiplier</span><span class="v">2.0x</span></div>
                            <div class="lcard-row"><span class="k">Window</span><span class="v">14 days</span></div>
                            <div class="lcard-btn"><button class="lp-cta-btn" data-source="X" data-tier="all_in" data-capital="500">Create Contract</button></div>
                        </div>
                        <div class="lcard" data-r>
                            <div class="lcard-top">
                                <span class="lcard-src">Shopify</span>
                                <span class="lcard-tier tier-pledge">Pledge</span>
                            </div>
                            <div class="lcard-title">Store Sales</div>
                            <div class="lcard-target">+$5,000 Net Sales</div>
                            <div class="lcard-row"><span class="k">Stake</span><span class="v">$100 – $1,500</span></div>
                            <div class="lcard-row"><span class="k">Multiplier</span><span class="v">1.5x</span></div>
                            <div class="lcard-row"><span class="k">Window</span><span class="v">30 days</span></div>
                            <div class="lcard-btn"><button class="lp-cta-btn" data-source="SHOPIFY" data-tier="pledge" data-capital="100">Create Contract</button></div>
                        </div>
                        <div class="lcard" data-r>
                            <div class="lcard-top">
                                <span class="lcard-src">YouTube</span>
                                <span class="lcard-tier tier-stake">Stake</span>
                            </div>
                            <div class="lcard-title">Subscriber Growth</div>
                            <div class="lcard-target">+500 Subscribers</div>
                            <div class="lcard-row"><span class="k">Stake</span><span class="v">$250 – $3,000</span></div>
                            <div class="lcard-row"><span class="k">Multiplier</span><span class="v">1.7x</span></div>
                            <div class="lcard-row"><span class="k">Window</span><span class="v">30 days</span></div>
                            <div class="lcard-btn"><button class="lp-cta-btn" data-source="YOUTUBE" data-tier="stake" data-capital="250">Create Contract</button></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══ HOW IT WORKS ═══ -->
            <div class="lw">
                <div class="lhow" data-r id="how">
                    <div class="lred-dash"><span class="lmono">How It Works</span></div>
                    <h2 class="lhow-h">Set a target. Lock capital.<br>Let performance <strong>decide.</strong></h2>
                    <p class="lhow-sub">Fully automated via APIs. No human bias. No exceptions.</p>

                    <div class="lsteps">
                        <div class="lstep">
                            <div class="lstep-num">01</div>
                            <div class="lstep-h">Choose Metric</div>
                            <div class="lstep-p">Select your platform and define a verifiable target.</div>
                        </div>
                        <div class="lstep">
                            <div class="lstep-num">02</div>
                            <div class="lstep-h">Lock Capital</div>
                            <div class="lstep-p">Lock capital in escrow. Once live, terms are fixed through settlement.</div>
                        </div>
                        <div class="lstep">
                            <div class="lstep-num">03</div>
                            <div class="lstep-h">Track Progress</div>
                            <div class="lstep-p">We monitor performance directly via official API integrations.</div>
                        </div>
                        <div class="lstep">
                            <div class="lstep-num">04</div>
                            <div class="lstep-h">Auto Settle</div>
                            <div class="lstep-p">Hit the target and get paid. Miss it and the contract settles automatically.</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MINI CTA BLOCK -->
            <div class="lw">
                <div class="lmini-cta" data-r>
                    <h3 class="lmini-cta-h">Ready to back your first goal?</h3>
                    <p class="lmini-cta-p">We'll match your first contract up to $250.</p>
                    <button class="lbtn lbtn-r lp-cta-btn">Create Contract</button>
                    <div class="lmini-cta-micro">Official API verification only.</div>
                </div>
            </div>

            <!-- ═══ CONTRACT TYPES ═══ -->
            <div class="lw">
                <div class="ltypes" data-r>
                    <div class="lred-dash"><span class="lmono">Contract Types</span></div>
                    <h2 class="lhow-h" style="margin-bottom:32px">Choose your <strong>contract type.</strong></h2>

                    <div class="ltypes-grid">
                        <div class="ltype">
                            <div class="ltype-badge" style="color:var(--t1);background:rgba(17,17,17,.04);border:1px solid var(--d)">Solo</div>
                            <div class="ltype-h">You vs. your target.</div>
                            <div class="ltype-p">Create a performance contract against your own goal. Hit the target to receive the agreed settlement. Miss it, and the contract auto-settles.</div>
                            <div class="ltype-detail"><strong>Best for:</strong> Revenue growth, follower milestones, and launch deadlines.</div>
                        </div>
                        <div class="ltype">
                            <div class="ltype-badge" style="color:var(--r);background:rgba(92,20,20,.04);border:1px solid rgba(92,20,20,.15)">Rivalry</div>
                            <div class="ltype-h">You vs. another operator.</div>
                            <div class="ltype-p">Lock equal capital with another founder or creator. The strongest verified result receives the agreed settlement.</div>
                            <div class="ltype-detail"><strong>Best for:</strong> Co-founder sprints, growth challenges, and sales duels.</div>
                        </div>
                    </div>
                </div>
            </div>



            <!-- ═══ FAQ ═══ -->
            <div class="lw">
                <div class="lfaq" data-r id="faq">
                    <div class="lred-dash"><span class="lmono">Common Questions</span></div>
                    <h2 class="lhow-h" style="margin-bottom:28px">No fine print. Just <strong>answers.</strong></h2>
                    <div class="lfaq-wrap">
                        <div class="fq open">
                            <div class="fq-q">Is this a game of chance?</div>
                            <div class="fq-a">No. This is a performance contract against your own measurable result, verified by official APIs. The outcome depends on your work, not luck.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">Where is the money held?</div>
                            <div class="fq-a">Capital is held securely in escrow via Stripe Connect. Funds are released only at settlement.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">How is the target verified?</div>
                            <div class="fq-a">Directly via official APIs at the deadline. No screenshots, no self-reporting. The API data is objective and final.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">Can I cancel after locking?</div>
                            <div class="fq-a">No. Once live, capital is locked from execution to settlement. You can cancel anytime before locking.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">What happens if I miss the target?</div>
                            <div class="fq-a">The contract auto-settles according to the agreed terms. Only lock capital you are comfortable committing.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">What happens if an API goes down?</div>
                            <div class="fq-a">Contracts pause automatically. If a source is permanently down, your stake is fully refunded.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">What data do you access?</div>
                            <div class="fq-a">Read-only access to the specific metric you target. We never access billing, customer records, or DMs.</div>
                        </div>
                        <div class="fq">
                            <div class="fq-q">Is this legal?</div>
                            <div class="fq-a">Yes. Available in the US, CA, UK, and EU. This is a performance contract based on skill, not gambling.</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══ FINAL CTA ═══ -->
            <div class="lfoot">
                <h2 class="lfoot-h">Put money behind a goal<br>that can be <em style="color:var(--r);font-style:normal;font-weight:700">verified.</em></h2>
                <div class="lfoot-sub">Collateral matches up to $250 on your first contract.</div>
                <button class="lfoot-btn" id="lp-final-cta">Create Contract</button>
                <div class="lfoot-micro">Official API verification only.</div>
                <div class="lfoot-line">Collateral.market · © 2026</div>
            </div>

            <!-- Landing Mobile Menu Overlay & Drawer -->
            <div id="mobile-menu-overlay" class="pnl-overlay" onclick="window.app.closeMobileMenu()"></div>
            <div id="mobile-menu" class="pnl-drawer">
                <div class="pnl-header">
                    <div class="pnl-header-left">
                        <span class="pnl-header-title">Menu</span>
                    </div>
                    <button onclick="window.app.closeMobileMenu()" class="pnl-close" aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="pnl-body">
                    <!-- Navigation -->
                    <div class="pnl-section-label">Navigation</div>
                    <a href="#" onclick="window.app.closeMobileMenu(); window.app.openAccessModal(); return false;" class="pnl-nav-link active" style="animation-delay: 0.06s"><span class="pnl-nav-indicator"></span>MARKET</a>
                    <a href="#" onclick="window.app.closeMobileMenu(); window.app.openAccessModal(); return false;" class="pnl-nav-link" style="animation-delay: 0.09s"><span class="pnl-nav-indicator"></span>ACTIVE</a>
                    <a href="#" onclick="window.app.closeMobileMenu(); window.app.openAccessModal(); return false;" class="pnl-nav-link" style="animation-delay: 0.12s"><span class="pnl-nav-indicator"></span>RIVALRY</a>
                    <a href="#" onclick="window.app.closeMobileMenu(); window.app.openAccessModal(); return false;" class="pnl-nav-link" style="animation-delay: 0.15s"><span class="pnl-nav-indicator"></span>LEDGER</a>
                    <a href="#" onclick="window.app.closeMobileMenu(); window.app.openAccessModal(); return false;" class="pnl-nav-link" style="animation-delay: 0.18s"><span class="pnl-nav-indicator"></span>SOURCES</a>
                    
                    <!-- Connect -->
                    <div id="mobile-connect-section" class="pnl-connect-section">
                        <button onclick="window.app.closeMobileMenu(); window.app.openAccessModal()" id="btn-auth-mobile" class="pnl-connect-btn">
                            CONNECT
                        </button>
                    </div>
                </div>
                
                <div class="pnl-footer">
                    <div class="pnl-status">
                        <div class="pnl-status-dot"></div>
                        <span class="pnl-status-text">All systems operational</span>
                    </div>
                    <div class="pnl-meta">
                        <div class="pnl-meta-item">
                            <span class="pnl-meta-label">Protocol</span>
                            <span class="pnl-meta-value">v1.0</span>
                        </div>
                        <div class="pnl-meta-item">
                            <span class="pnl-meta-label">Network</span>
                            <span class="pnl-meta-value">Mainnet</span>
                        </div>
                        <div class="pnl-meta-item">
                            <span class="pnl-meta-label">Settlement</span>
                            <span class="pnl-meta-value">USD</span>
                        </div>
                        <div class="pnl-meta-item">
                            <span class="pnl-meta-label">Uptime</span>
                            <span class="pnl-meta-value">99.9%</span>
                        </div>
                    </div>
                    <div class="pnl-legal">
                        <a href="/terms" onclick="window.app.closeMobileMenu()">Terms</a>
                        <a href="/docs" onclick="window.app.closeMobileMenu()">Docs</a>
                        <a href="https://x.com/collaboralcap" target="_blank">X / Twitter</a>
                    </div>
                </div>
            </div>

        </div>
    `;
}

export function initLanding() {
    // Fade in page container
    setTimeout(() => {
        document.querySelector('.lp')?.classList.add('v');
    }, 50);

    // Animate progress loading bar
    const bar = document.getElementById('lp-loading-bar');
    if (bar) {
        bar.style.width = '30%';
        setTimeout(() => { bar.style.width = '70%'; }, 100);
        setTimeout(() => {
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => { bar.style.display = 'none'; }, 300);
            }, 150);
        }, 450);
    }

    // Populate live toast notifications with real mock data
    setTimeout(async () => {
        try {
            const response = await window.api.getPublicLedger();
            if (response && response.events && response.events.length > 0) {
                let container = document.getElementById('l-toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'l-toast-container';
                    document.body.appendChild(container);
                }
                
                const timeAgo = (iso) => {
                    const diff = Math.floor((new Date() - new Date(iso)) / 60000);
                    if (diff < 1) return 'just now';
                    if (diff < 60) return `${diff}m ago`;
                    const h = Math.floor(diff / 60);
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h/24)}d ago`;
                };

                const formatAmt = (amt) => '$' + parseInt(amt, 10).toLocaleString();

                const recentEvents = response.events.slice(0, 10);
                let i = 0;
                
                const showToast = () => {
                    if (i >= recentEvents.length) i = 0;
                    const e = recentEvents[i];
                    i++;
                    
                    let amtClass = 'locked';
                    let amtPrefix = '';
                    let preAction = '@' + (e.principal || 'User');
                    let actionText = 'locked';
                    let amtRaw = (e.amountUsdCents || e.lockAmountUsdCents || 0) / 100;
                    
                    if (e.eventType === 'FUNDS_LOCKED' || e.eventType === 'EXECUTION_CONFIRMED' || e.eventType === 'CONTRACT_CREATED') {
                        actionText = `escrowed via ${e.platform || 'API'} oracle`;
                        amtPrefix = '';
                        amtClass = 'locked';
                    } else if (e.eventType === 'SETTLED_SUCCESS') {
                        actionText = `settled successfully`;
                        amtPrefix = '+';
                        amtClass = 'recovered';
                    } else if (e.eventType === 'SETTLED_FAILURE') {
                        actionText = `settled by ${e.platform || 'API'} verification`;
                        amtPrefix = '-';
                        amtClass = 'liquidated';
                    }
                    
                    let displayAmt = formatAmt(amtRaw);

                    const toast = document.createElement('div');
                    toast.className = 'l-toast animate-slide-up';
                    toast.innerHTML = `<span class="lticker-time">${timeAgo(e.timestamp || e.created_at || new Date().toISOString())}</span> <span class="lticker-action">${preAction}</span> <span class="lticker-amt ${amtClass}">${amtPrefix}${displayAmt}</span> <span class="lticker-action">${actionText}</span>`;
                    
                    container.appendChild(toast);
                    
                    // Remove toast after 4.5 seconds
                    setTimeout(() => {
                        toast.classList.remove('animate-slide-up');
                        toast.classList.add('animate-slide-down');
                        setTimeout(() => toast.remove(), 500);
                    }, 4500);
                };
                
                showToast();
                setInterval(showToast, 6000);
            }
        } catch (err) {
            console.error('Failed to load ledger ticker data', err);
        }
    }, 100);

    const p = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source','utm_campaign','utm_medium','utm_content','utm_term'].forEach(k => { const v = p.get(k); if (v) utm[k] = v; });
    if (Object.keys(utm).length) sessionStorage.setItem('collateral_utm', JSON.stringify(utm));
    if (window.trackEvent) window.trackEvent('go_page_view', { source: utm.utm_source || 'direct', campaign: utm.utm_campaign || 'none' });

    function goAction(targetUrl = '/market') {
        if (window.appState?.isLoggedIn) {
            sessionStorage.removeItem('collateral_go_flow');
            sessionStorage.removeItem('collateral_go_target');
            window.router.navigate(targetUrl);
        } else {
            sessionStorage.setItem('collateral_go_flow', '1');
            sessionStorage.setItem('collateral_go_target', targetUrl);
            window.app.openAccessModal();
        }
    }

    // All CTAs route through goAction
    ['lp-hero-cta', 'lp-final-cta', 'lp-nav-cta'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); goAction();
            if (window.trackEvent) window.trackEvent('cta_click', { button: id, ...utm });
        });
    });
    document.querySelectorAll('.lp-cta-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const source = btn.getAttribute('data-source');
            const tier = btn.getAttribute('data-tier');
            const capital = btn.getAttribute('data-capital');
            let targetUrl = '/market';
            if (source && tier && capital) {
                targetUrl = `/contracts/execute?source=${source}&tier=${tier}&capital=${capital}`;
            }
            goAction(targetUrl);
            if (window.trackEvent) window.trackEvent('cta_click', { button: 'inline', source, tier, capital, ...utm });
        });
    });

    // FAQ
    document.querySelectorAll('.fq').forEach(item => {
        item.querySelector('.fq-q')?.addEventListener('click', () => item.classList.toggle('open'));
    });

    // Scroll reveal
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('v'); obs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.lp [data-r]').forEach(el => obs.observe(el));

    // Count-up animation for stats
    const countEls = document.querySelectorAll('[data-count]');
    if (countEls.length) {
        const countObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const el = e.target;
                    const target = parseInt(el.dataset.count, 10);
                    let current = 0;
                    const step = Math.max(1, Math.floor(target / 30));
                    const interval = setInterval(() => {
                        current += step;
                        if (current >= target) { current = target; clearInterval(interval); }
                        el.textContent = current;
                    }, 40);
                    countObs.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        countEls.forEach(el => countObs.observe(el));
    }
}
