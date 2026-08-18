import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderMyContracts() {
    return `
        <style>
            :root {
              --paper: #F7F4ED;
              --paper-alt: #EFEAE0;
              --paper-deep: #E7E1D4;
              --plate: #FFFDF9;
              --notch: #F7F4ED;
              --ink: #0E1420;
              --ink-2: #4A5464;
              --ink-3: #6E7686;
              --ink-4: #9AA0AC;
              --blood: #7A1C29;
              --blood-deep: #54111B;
              --blood-mid: #9B3341;
              --blood-tint: #F5E6E8;
              --blood-wash: #FBF3F4;
              --win: #186B4A;
              --win-tint: #E6F1EA;
              --win-wash: #F2F8F4;
              --gilt: #A8854E;
              --rule: #DCD5C6;
              --rule-soft: #EAE4D8;
              --rule-strong: #BDB3A0;
              --display: var(--font-display);
              --wordmark: var(--font-display);
              --body: var(--font-content);
              --mono: var(--font-data), ui-monospace, monospace;
              --r: 2px;
              --lift: 0 1px 2px rgba(14,20,32,.04), 0 12px 28px -18px rgba(14,20,32,.22);
            }

            .myc {
                background: var(--paper, #F7F4ED);
                min-height: 100vh;
                font-family: var(--body, var(--font-content));
                color: var(--ink, #0E1420);
                padding-bottom: 100px;
                position: relative;
                font-variant-numeric: tabular-nums;
            }

            /* Fixed Grain Overlay */
            .cl-grain {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 9999;
                opacity: .035;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }

            /* Clerical Mono Label Utility */
            .mono-lbl {
                font-family: var(--mono, var(--font-data));
                font-size: 10.5px;
                letter-spacing: .16em;
                text-transform: uppercase;
                color: var(--ink-3, #6E7686);
            }

            /* ── Page Header ── */
            .myc-header {
                padding: 60px 32px 20px;
                max-width: 1300px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .myc-page-title {
                font-family: var(--display, var(--font-content));
                font-size: 40px;
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                margin: 0;
            }
            .myc-page-title strong { color: var(--blood, #7A1C29); }
            .myc-page-sub {
                font-size: 14px;
                color: var(--ink-2, #4A5464);
                margin: 8px 0 0;
                line-height: 1.6;
                max-width: 600px;
            }

            .myc-header-actions {
                display: flex;
                gap: 12px;
            }
            .myc-btn-secondary {
                padding: 12px 20px;
                background: transparent !important;
                border: 1px solid var(--ink, #0E1420) !important;
                border-radius: var(--r, 2px);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                cursor: pointer;
                color: var(--ink, #0E1420) !important;
                font-family: var(--mono, var(--font-data));
                transition: all 0.2s ease;
            }
            .myc-btn-secondary:hover {
                background: var(--paper-alt, #EFEAE0) !important;
            }
            .myc-btn-primary {
                padding: 12px 20px;
                background: #7A1C29 !important;
                color: #FFF8F5 !important;
                border: 1px solid #7A1C29 !important;
                border-radius: var(--r, 2px);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                cursor: pointer;
                font-family: var(--mono, var(--font-data));
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(122, 28, 41, 0.2);
            }
            .myc-btn-primary:hover {
                background: #54111B !important;
                border-color: #54111B !important;
                transform: translateY(-1px);
            }

            /* ── Stat Strip (Order Aligned with Market Page: Value -> Label -> Subtext) ── */
            .myc-metrics {
                max-width: 1300px;
                margin: 20px auto 32px;
                padding: 0 32px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 24px;
            }
            .myc-metric {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 20px 24px;
                box-shadow: var(--lift);
                display: flex;
                flex-direction: column;
            }
            .myc-metric-value {
                font-family: var(--display, var(--font-content));
                font-size: 32px;
                font-weight: 700;
                color: var(--ink, #0E1420);
                letter-spacing: -.026em;
                line-height: 1.1;
                margin-bottom: 6px;
                font-variant-numeric: tabular-nums;
            }
            .myc-metric-label {
                font-family: var(--mono, var(--font-data));
                font-size: 10.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                color: var(--ink-3, #6E7686);
                margin-bottom: 4px;
            }
            .myc-metric-subtext {
                font-size: 12px;
                color: var(--ink-3, #6E7686);
                line-height: 1.4;
            }

            .myc-feed {
                max-width: 1300px;
                margin: 0 auto;
                padding: 0 32px 48px;
            }

            /* ── Templates Grid & Cards (Plates) ── */
            .myo-templates-grid-3 {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
            }
            .myo-temp-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 24px;
                box-shadow: var(--lift);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                cursor: pointer;
                transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                position: relative;
            }
            .myo-temp-card:hover {
                transform: translateY(-2px);
                border-color: var(--blood, #7A1C29);
                box-shadow: 0 4px 16px rgba(14, 20, 32, 0.08);
            }
            .myo-temp-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .myo-temp-platform {
                font-family: var(--body, var(--font-content));
                font-size: 13px;
                font-weight: 700;
                color: var(--ink, #0E1420);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            /* Monochrome Platform Dot Indicator (#6E7686) */
            .myo-platform-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--ink-3, #6E7686);
            }
            .myo-temp-category {
                font-family: var(--mono, var(--font-data));
                font-size: 9.5px;
                font-weight: 700;
                color: var(--blood, #7A1C29);
                background: rgba(122, 28, 41, 0.08);
                border: 1px solid rgba(122, 28, 41, 0.2);
                border-radius: var(--r, 2px);
                padding: 2px 8px;
                text-transform: uppercase;
                letter-spacing: .12em;
            }
            .myo-temp-title {
                font-family: var(--display, var(--font-content));
                font-size: 17px;
                font-weight: 700;
                letter-spacing: -.02em;
                color: var(--ink, #0E1420);
                line-height: 1.3;
                margin-bottom: 8px;
                display: block;
            }
            .myo-temp-divider {
                border-bottom: 1px dotted var(--rule, #DCD5C6);
                margin: 16px 0;
            }
            .myo-temp-btn {
                background: #7A1C29 !important;
                color: #FFF8F5 !important;
                border: 1px solid #7A1C29 !important;
                border-radius: var(--r, 2px);
                padding: 12px 16px;
                font-family: var(--mono, var(--font-data));
                font-size: 10.5px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                cursor: pointer;
                width: 100%;
                text-align: center;
                transition: all 0.2s ease;
            }
            .myo-temp-btn:hover {
                background: #54111B !important;
                border-color: #54111B !important;
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .myc-metrics { grid-template-columns: repeat(2, 1fr); }
                .myo-templates-grid-3 { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 768px) {
                .myc-metrics { grid-template-columns: 1fr; }
                .myo-templates-grid-3 { grid-template-columns: 1fr; }
                .myc-header { flex-direction: column; gap: 20px; }
            }
        </style>

        <div class="cl-grain" aria-hidden="true"></div>

        <div class="myc">
            <div class="myc-header" data-reveal>
                <div>
                    <h1 class="myc-page-title">Active <strong>Commitments.</strong></h1>
                    <p class="myc-page-sub">Track and manage your active commitments. Completing your goals successfully returns your locked collateral and builds your profile's success score.</p>
                </div>
                <div class="myc-header-actions">
                    <button class="myc-btn-secondary" onclick="window.router.navigate('/profile')">View Identity</button>
                    <button class="myc-btn-primary" onclick="window.router.navigate('/market')">New Contract</button>
                </div>
            </div>

            <!-- Stat Strip (Order Aligned with Market Page: Value -> Label -> Subtext) -->
            <div class="myc-metrics" data-reveal>
                <div class="myc-metric">
                    <div class="myc-metric-value" id="myc-total-locked">—</div>
                    <div class="myc-metric-label">TOTAL LOCKED</div>
                    <div class="myc-metric-subtext">No capital currently committed</div>
                </div>
                <div class="myc-metric">
                    <div class="myc-metric-value" id="myc-active-count">0</div>
                    <div class="myc-metric-label">ACTIVE COMMITMENTS</div>
                    <div class="myc-metric-subtext">Ready to create your first</div>
                </div>
                <div class="myc-metric">
                    <div class="myc-metric-value" id="myc-settle-rate">—</div>
                    <div class="myc-metric-label">SETTLEMENT RATE</div>
                    <div class="myc-metric-subtext">No settlements yet</div>
                </div>
                <div class="myc-metric">
                    <div class="myc-metric-value" id="myc-avg-risk">—</div>
                    <div class="myc-metric-label">TOTAL PAYOUT</div>
                    <div class="myc-metric-subtext">No payouts yet</div>
                </div>
            </div>

            <div class="myc-feed" data-reveal>
                <div id="myc-content">
                    ${collateralFullLoader('Retrieving personal record...')}
                </div>
            </div>
        </div>
    `;
}

export async function initMyContracts() {
    const container = document.getElementById('myc-content');
    if (!container) return;

    try {
        let contracts = [];
        try {
            const response = await window.api.getContracts();
            contracts = response?.contracts || [];
        } catch (fetchErr) {
            console.warn('[MyContracts] Empty onboarding state:', fetchErr);
        }

        if (contracts.length === 0) {
            document.getElementById('myc-total-locked').textContent = '—';
            document.getElementById('myc-active-count').textContent = '0';
            document.getElementById('myc-settle-rate').textContent = '—';
            document.getElementById('myc-avg-risk').textContent = '—';

            container.innerHTML = `
                <div class="myc-onboarding-wrapper" style="display: flex; flex-direction: column; gap: 32px;">
                    
                    <!-- Getting Started Progress Bar -->
                    <div style="background: var(--plate, #FFFDF9); border: 1px solid var(--rule, #DCD5C6); padding: 24px; border-radius: var(--r, 2px); box-shadow: var(--lift);">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
                            <span class="mono-lbl">GETTING STARTED</span>
                            <span class="mono-lbl" style="color: var(--ink-2, #4A5464);">1 OF 4 COMPLETE</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="color: var(--win, #186B4A); font-weight:700;">✓</span>
                                <span class="mono-lbl" style="color: var(--ink, #0E1420);">Identity Verified</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="color: var(--win, #186B4A); font-weight:700;">✓</span>
                                <span class="mono-lbl" style="color: var(--ink, #0E1420);">Source Connected</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="window.router.navigate('/market')">
                                <span style="color: var(--blood, #7A1C29); font-weight:700;">○</span>
                                <span class="mono-lbl" style="color: var(--blood, #7A1C29); font-weight:700;">Create Commitment <span style="font-size:9px; background:rgba(122,28,41,0.1); padding:2px 4px;">NEXT</span></span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="color: var(--ink-4, #9AA0AC);">○</span>
                                <span class="mono-lbl" style="color: var(--ink-4, #9AA0AC);">Complete First Settlement</span>
                            </div>
                        </div>
                        <div style="width: 100%; height: 3px; background: var(--rule-soft, #EAE4D8); border-radius: 2px; overflow: hidden;">
                            <div style="width: 50%; height: 100%; background: var(--blood, #7A1C29);"></div>
                        </div>
                    </div>

                    <!-- Centered Empty-State Onboarding Hero -->
                    <div style="border: 1px solid var(--rule, #DCD5C6); padding: 40px; background: var(--plate, #FFFDF9); text-align: center; border-radius: var(--r, 2px); box-shadow: var(--lift);">
                        <h2 style="font-family: var(--display, var(--font-content)); font-size: 24px; margin-bottom: 12px; font-weight: 700; color: var(--ink, #0E1420);">No Active Commitments Yet</h2>
                        <p style="max-width: 620px; margin: 0 auto 24px; line-height: 1.6; color: var(--ink-2, #4A5464); font-size: 14px;">
                            Prove you can do what you say you will. When you set a goal, lock a small deposit to hold yourself accountable. Reaching your goal returns your money and builds your profile's success score. Fail, and you forfeit the deposit.
                        </p>
                        <div style="display: flex; gap: 16px; justify-content: center;">
                            <button class="myc-btn-primary" onclick="window.router.navigate('/market')">Create Your First Commitment</button>
                            <button class="myc-btn-secondary" onclick="document.getElementById('suggested-commitments-lbl').scrollIntoView({ behavior: 'smooth' })">Browse Templates</button>
                        </div>
                    </div>

                    <!-- Suggested Commitments Grid -->
                    <div style="margin-bottom: 24px;">
                        <div class="mono-lbl" id="suggested-commitments-lbl" style="margin-bottom: 16px;">SUGGESTED COMMITMENTS</div>
                        
                        <div class="myo-templates-grid-3">
                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> YouTube
                                        </span>
                                        <span class="myo-temp-category">CREATORS</span>
                                    </div>
                                    <span class="myo-temp-title">Reach 10,000 YouTube Subscribers</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Establish verification of creator channel subscriber milestones.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: YOUTUBE API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>

                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> Stripe
                                        </span>
                                        <span class="myo-temp-category">FINANCE</span>
                                    </div>
                                    <span class="myo-temp-title">Generate $10,000 Monthly Revenue</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Verify monthly stripe revenue metric triggers.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: STRIPE API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>

                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> YouTube
                                        </span>
                                        <span class="myo-temp-category">CREATORS</span>
                                    </div>
                                    <span class="myo-temp-title">Achieve 50,000 YouTube Views</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Track and verify video view count milestones.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: YOUTUBE API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>

                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> Shopify
                                        </span>
                                        <span class="myo-temp-category">COMMERCE</span>
                                    </div>
                                    <span class="myo-temp-title">Complete 100 Shopify Orders</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Fulfill orders threshold verification.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: SHOPIFY API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>

                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> X (Twitter)
                                        </span>
                                        <span class="myo-temp-category">SOCIAL</span>
                                    </div>
                                    <span class="myo-temp-title">Grow to 5,000 X Followers</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Verify follower count milestones on X.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: X API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>

                            <!-- Fixed Amazon Card with Monochrome Dot Indicator (#6E7686) -->
                            <div class="myo-temp-card" onclick="window.router.navigate('/market')">
                                <div>
                                    <div class="myo-temp-header">
                                        <span class="myo-temp-platform">
                                            <span class="myo-platform-dot"></span> Amazon
                                        </span>
                                        <span class="myo-temp-category">COMMERCE</span>
                                    </div>
                                    <span class="myo-temp-title">Fulfill 200 Amazon Orders</span>
                                    <p style="font-size: 13px; color: var(--ink-2, #4A5464); margin: 0 0 12px; line-height: 1.5;">Fulfill order volume threshold verification.</p>
                                    <div class="mono-lbl" style="font-size: 9.5px; color: var(--ink-3, #6E7686);">
                                        ESTIMATED VERIFICATION SOURCE: AMAZON SELLER API
                                    </div>
                                </div>
                                <div class="myo-temp-divider"></div>
                                <button class="myo-temp-btn">Create Commitment</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('[MyContracts] Init error:', err);
    }
}
