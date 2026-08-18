// CONNECT SOURCES — Institutional Data Adapter Interface
// Homepage & Market Design System Alignment (Paper #F7F4ED, Plates #FFFDF9, Dark Ink ExID #0E1420, Oxblood CTAs #7A1C29)

import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderSources() {
    return `
        <style>
            /* ══════════════════════════════════════════════════════════════
               ROOT DESIGN TOKEN BLOCK (HOMEPAGE PARITY)
               ══════════════════════════════════════════════════════════════ */
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

            .src {
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

            /* ── Header Section ── */
            .src-header-inner {
                max-width: 1300px;
                margin: 0 auto;
                padding: 60px 32px 24px;
            }
            .src-hero-title {
                font-family: var(--display, var(--font-content));
                font-size: 40px;
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                margin: 0;
            }
            .src-hero-title strong { font-weight: 800; color: var(--blood, #7A1C29); }
            .src-hero-desc {
                font-size: 14px;
                color: var(--ink-2, #4A5464);
                margin-top: 12px;
                line-height: 1.6;
                max-width: 540px;
            }

            /* Reconciled Stat Strip (Order Aligned with Market Page: Value -> Label) */
            .src-stats-strip {
                display: flex;
                gap: 64px;
                margin: 32px 0 0;
                padding: 20px 32px;
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                box-shadow: var(--lift);
                max-width: 1300px;
            }
            .src-stat-group { display: flex; flex-direction: column; gap: 6px; }
            .src-stat-value {
                font-family: var(--display, var(--font-content));
                font-size: 30px;
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                font-variant-numeric: tabular-nums;
                line-height: 1;
            }
            .src-stat-label {
                font-family: var(--mono, var(--font-data));
                font-size: 10.5px;
                text-transform: uppercase;
                letter-spacing: .16em;
                color: var(--ink-3, #6E7686);
            }

            /* ── Content Area ── */
            .src-content {
                max-width: 1300px;
                margin: 0 auto;
                padding: 0 32px 48px;
                width: 100%;
                box-sizing: border-box;
            }

            /* Monochrome Platform Dot Indicator (#6E7686) */
            .src-platform-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--ink-3, #6E7686);
            }

            /* ── Connected List (Plate) ── */
            .src-connected-list {
                display: flex;
                flex-direction: column;
                margin-bottom: 48px;
                border: 1px solid var(--rule, #DCD5C6);
                background: var(--plate, #FFFDF9);
                border-radius: var(--r, 2px);
                box-shadow: var(--lift);
            }
            .src-conn-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                border-bottom: 1px dotted var(--rule, #DCD5C6);
            }
            .src-conn-row:last-child { border-bottom: none; }
            .src-conn-row:hover { background: rgba(122, 28, 41, 0.02); }

            .src-conn-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .src-conn-name {
                font-family: var(--display, var(--font-content));
                font-size: 16px;
                font-weight: 700;
                color: var(--ink, #0E1420);
            }
            .src-conn-date {
                font-family: var(--mono, var(--font-data));
                font-size: 11px;
                color: var(--ink-3, #6E7686);
            }

            .src-badge-verified {
                font-family: var(--mono, var(--font-data));
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.16em;
                color: var(--win, #186B4A);
                background: rgba(24, 107, 74, 0.08);
                border: 1px solid rgba(24, 107, 74, 0.2);
                border-radius: 2px;
                padding: 3px 8px;
                text-transform: uppercase;
            }

            /* ── Six-step Pipeline Flow ── */
            .src-flow-timeline {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 28px 24px;
                margin: 24px 0 48px;
                gap: 16px;
                box-shadow: var(--lift);
                overflow-x: auto;
            }
            .src-flow-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                flex: 1;
                min-width: 90px;
                gap: 8px;
            }
            .src-flow-dot {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(122, 28, 41, 0.08);
                border: 1px solid rgba(122, 28, 41, 0.2);
                color: var(--blood, #7A1C29);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: var(--mono, var(--font-data));
                font-size: 11px;
                font-weight: 700;
            }
            .src-flow-lbl {
                font-family: var(--mono, var(--font-data));
                font-size: 10.5px;
                font-weight: 600;
                color: var(--ink-2, #4A5464);
                text-transform: uppercase;
                letter-spacing: .12em;
                line-height: 1.3;
            }
            .src-flow-arrow {
                color: var(--rule-strong, #BDB3A0);
                font-size: 16px;
            }

            /* ── Why Verification Matters (Pass 2 Copy Alignment & Item 1 Dark Ink ExID #0E1420) ── */
            .why-ver-panel {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 36px 32px;
                margin-bottom: 48px;
                box-shadow: var(--lift);
                display: flex;
                flex-direction: column;
                gap: 28px;
            }
            .why-ver-title {
                font-family: var(--display, var(--font-content));
                font-size: 20px;
                font-weight: 700;
                color: var(--ink, #0E1420);
                margin: 0 0 12px 0;
            }
            .why-ver-p {
                font-size: 14px;
                color: var(--ink-2, #4A5464);
                line-height: 1.65;
                margin: 0 0 12px 0;
            }

            .why-ver-flow {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                width: 100%;
            }
            .why-ver-node {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 20px 16px;
                text-align: center;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            /* Item 1 requirement: ExID node is dark ink #0E1420 with #F7F4ED text (ZERO pure black) */
            .why-ver-node.terminus {
                background: #0E1420 !important;
                border-color: #0E1420 !important;
            }
            .why-ver-node.terminus .why-ver-node-title { color: #F7F4ED !important; }
            .why-ver-node.terminus .why-ver-node-desc { color: var(--ink-4, #9AA0AC) !important; }
            .why-ver-node.terminus .why-ver-node-icon {
                background: rgba(247, 244, 237, 0.1);
                border-color: rgba(247, 244, 237, 0.2);
                color: #F7F4ED;
            }

            .why-ver-node-title {
                font-family: var(--display, var(--font-content));
                font-size: 14px;
                font-weight: 700;
                color: var(--ink, #0E1420);
            }
            .why-ver-node-desc {
                font-size: 11px;
                color: var(--ink-3, #6E7686);
                line-height: 1.4;
            }
            .why-ver-connector {
                color: var(--rule-strong, #BDB3A0);
            }

            /* ── Provider Grid (Plates) ── */
            .src-provider-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                margin-bottom: 48px;
            }
            .src-prov-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 24px;
                box-shadow: var(--lift);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                gap: 16px;
                transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .src-prov-card:hover:not(.coming-soon) {
                transform: translateY(-2px);
                border-color: var(--blood, #7A1C29);
            }
            /* Item 9: Coming soon providers de-emphasized to --ink-3 text on --paper-alt */
            .src-prov-card.coming-soon {
                background: var(--paper-alt, #EFEAE0) !important;
                border-color: var(--rule, #DCD5C6) !important;
                box-shadow: none !important;
            }
            .src-prov-card.coming-soon .src-conn-name { color: var(--ink-3, #6E7686) !important; }

            /* Item 1: CONNECT Button Oxblood #7A1C29, text #FFF8F5, hover #54111B */
            .src-btn-connect {
                background: #7A1C29 !important;
                color: #FFF8F5 !important;
                border: 1px solid #7A1C29 !important;
                border-radius: var(--r, 2px);
                padding: 12px 20px;
                font-family: var(--mono, var(--font-data));
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                cursor: pointer;
                width: 100%;
                text-align: center;
                transition: all 0.2s ease;
            }
            .src-btn-connect:hover:not(:disabled) {
                background: #54111B !important;
                border-color: #54111B !important;
            }
            .src-btn-connect:disabled {
                background: var(--rule, #DCD5C6) !important;
                color: var(--ink-3, #6E7686) !important;
                border-color: var(--rule, #DCD5C6) !important;
                cursor: not-allowed;
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .src-provider-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 768px) {
                .src-provider-grid { grid-template-columns: 1fr; }
                .why-ver-flow { flex-direction: column; }
            }
        </style>

        <div class="cl-grain" aria-hidden="true"></div>

        <div class="src">
            <div class="src-header-inner" data-reveal>
                <div class="mono-lbl" style="margin-bottom: 8px;">VERIFICATION ENGINE</div>
                <h1 class="src-hero-title">Connect <strong>Data Sources.</strong></h1>
                <div class="src-hero-desc">
                    Authorize read-only access to platform APIs for automated goal verification and deterministic collateral settlement.
                </div>

                <!-- Item 7: Reconciled Stat Strip Spanning Full Width -->
                <div class="src-stats-strip">
                    <div class="src-stat-group">
                        <div class="src-stat-value">2</div>
                        <div class="src-stat-label">CONNECTED SOURCES</div>
                    </div>
                    <div class="src-stat-group">
                        <div class="src-stat-value">12,480</div>
                        <div class="src-stat-label">VERIFIED DATA POINTS</div>
                    </div>
                    <div class="src-stat-group">
                        <div class="src-stat-value">528</div>
                        <div class="src-stat-label">CONTRACTS SETTLED</div>
                    </div>
                    <div class="src-stat-group">
                        <div class="src-stat-value" style="color: var(--win, #186B4A);">99.98%</div>
                        <div class="src-stat-label">ORACLE HEALTH</div>
                    </div>
                </div>
            </div>

            <div class="src-content">
                <!-- Section: Active Connections -->
                <div style="margin-top: 24px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
                    <span class="mono-lbl">ACTIVE CONNECTIONS</span>
                    <span class="mono-lbl" style="color: var(--ink-2, #4A5464);">2 OF 6 AUTHORIZED</span>
                </div>

                <!-- Active Connected Rows -->
                <div class="src-connected-list">
                    <!-- Stripe Row -->
                    <div class="src-conn-row">
                        <div class="src-conn-left">
                            <!-- Item 4: Monochrome Dot -->
                            <span class="src-platform-dot"></span>
                            <div>
                                <div class="src-conn-name">Stripe API</div>
                                <div class="src-conn-date">Connected 14d ago &middot; Read-only revenue telemetry</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:32px;">
                            <div style="text-align:right;">
                                <div class="src-stat-value" style="font-size:18px;">8,240</div>
                                <div class="mono-lbl" style="font-size:9px;">VERIFIED DATA POINTS</div>
                            </div>
                            <div style="text-align:right;">
                                <div class="src-stat-value" style="font-size:18px; color: var(--win, #186B4A);">99.98%</div>
                                <div class="mono-lbl" style="font-size:9px;">ACCURACY</div>
                            </div>
                            <div class="src-badge-verified">✓ AUTHORIZED</div>
                        </div>
                    </div>

                    <!-- Item 8: YouTube Row Reconciled with real 4,240 data points -->
                    <div class="src-conn-row">
                        <div class="src-conn-left">
                            <span class="src-platform-dot"></span>
                            <div>
                                <div class="src-conn-name">YouTube Data API v3</div>
                                <div class="src-conn-date">Connected 7d ago &middot; Subscriber & view count telemetry</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:32px;">
                            <div style="text-align:right;">
                                <div class="src-stat-value" style="font-size:18px;">4,240</div>
                                <div class="mono-lbl" style="font-size:9px;">VERIFIED DATA POINTS</div>
                            </div>
                            <div style="text-align:right;">
                                <div class="src-stat-value" style="font-size:18px; color: var(--win, #186B4A);">99.95%</div>
                                <div class="mono-lbl" style="font-size:9px;">ACCURACY</div>
                            </div>
                            <div class="src-badge-verified">✓ AUTHORIZED</div>
                        </div>
                    </div>
                </div>

                <!-- Section: Six-step Pipeline Flow (Preserved per instructions) -->
                <div class="mono-lbl" style="margin-bottom: 12px;">DETERMINISTIC VERIFICATION PIPELINE</div>
                <div class="src-flow-timeline">
                    <div class="src-flow-step">
                        <div class="src-flow-dot">01</div>
                        <div class="src-flow-lbl">AUTHORIZE READ-ONLY API</div>
                    </div>
                    <div class="src-flow-arrow">&rarr;</div>
                    <div class="src-flow-step">
                        <div class="src-flow-dot">02</div>
                        <div class="src-flow-lbl">PERIODIC POLL & TELEMETRY</div>
                    </div>
                    <div class="src-flow-arrow">&rarr;</div>
                    <div class="src-flow-step">
                        <div class="src-flow-dot">03</div>
                        <div class="src-flow-lbl">CRYPTOGRAPHIC PROOF</div>
                    </div>
                    <div class="src-flow-arrow">&rarr;</div>
                    <div class="src-flow-step">
                        <div class="src-flow-dot">04</div>
                        <div class="src-flow-lbl">THRESHOLD EVALUATION</div>
                    </div>
                    <div class="src-flow-arrow">&rarr;</div>
                    <div class="src-flow-step">
                        <div class="src-flow-dot">05</div>
                        <div class="src-flow-lbl">ESCROW RELEASE</div>
                    </div>
                </div>

                <!-- Section: Why Verification Matters (Pass 2 Copy Alignment & Item 1 Dark Ink ExID #0E1420) -->
                <div class="why-ver-panel">
                    <div>
                        <div class="mono-lbl" style="margin-bottom: 8px;">VERIFICATION PRINCIPLES</div>
                        <h2 class="why-ver-title">Why platform verification matters</h2>
                        <!-- Pass 2 Copy Alignment: Non-crypto, read-only telemetry vocabulary -->
                        <p class="why-ver-p">
                            Collateral never asks you to report your own results. Every contract settles on read-only telemetry pulled directly from the platform where the goal lives — the same numbers your dashboard already shows you.
                        </p>
                        <p class="why-ver-p">
                            USD contracts settle through custodial escrow via Stripe Connect. CLTR contracts settle on-chain: the same verified telemetry is signed and submitted to Robinhood Chain, where the smart contract releases or forfeits capital without any manual step.
                        </p>
                        <p class="why-ver-p">
                            By binding contract execution to cryptographic API signatures, Collateral guarantees that settlement is objective, tamper-proof, and deterministic. No manual submissions. No dispute periods. No human bias.
                        </p>
                    </div>

                    <div class="why-ver-flow">
                        <div class="why-ver-node">
                            <div class="why-ver-node-title">Platform API</div>
                            <div class="why-ver-node-desc">Authoritative Metric Source</div>
                        </div>
                        <div class="why-ver-connector">&rarr;</div>
                        <div class="why-ver-node">
                            <div class="why-ver-node-title">Read-Only Telemetry</div>
                            <div class="why-ver-node-desc">Signed TLS Payload</div>
                        </div>
                        <div class="why-ver-connector">&rarr;</div>
                        <div class="why-ver-node">
                            <div class="why-ver-node-title">Oracle Verifier</div>
                            <div class="why-ver-node-desc">Threshold Computation</div>
                        </div>
                        <div class="why-ver-connector">&rarr;</div>
                        <!-- Item 1 requirement: ExID node is dark ink #0E1420 (ZERO pure black) -->
                        <div class="why-ver-node terminus">
                            <div class="why-ver-node-title">Execution Engine</div>
                            <div class="why-ver-node-desc">Deterministic Escrow Release</div>
                        </div>
                    </div>
                </div>

                <!-- Section: Available Providers Grid (Item 6: Filled Grid Row) -->
                <div class="mono-lbl" style="margin-bottom: 16px;">AVAILABLE PROVIDERS</div>
                <div class="src-provider-grid">
                    <!-- Shopify Provider -->
                    <div class="src-prov-card">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-family:var(--display, var(--font-content)); font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                                    <span class="src-platform-dot"></span> Shopify Admin API
                                </span>
                                <span class="mono-lbl" style="background:rgba(122,28,41,0.08); color:#7A1C29; padding:2px 6px; border-radius:2px;">COMMERCE</span>
                            </div>
                            <p style="font-size:13px; color:var(--ink-2, #4A5464); margin:0 0 12px; line-height:1.5;">Connect Shopify merchant store telemetry for net sales, order volume, and customer retention contracts.</p>
                            <div style="border-top:1px dotted var(--rule, #DCD5C6); padding-top:12px;">
                                <span class="mono-lbl" style="font-size:9.5px;">SUPPORTED CONTRACT EXAMPLE</span>
                                <div style="font-size:12px; font-weight:600; color:var(--ink, #0E1420); margin-top:4px;">100 Order Volume Threshold (30d)</div>
                            </div>
                        </div>
                        <!-- Item 1: CONNECT Oxblood Button -->
                        <button class="src-btn-connect">Connect Shopify</button>
                    </div>

                    <!-- Item 9: Amazon Seller (Coming Soon — De-emphasized to --ink-3 text on --paper-alt) -->
                    <div class="src-prov-card coming-soon">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span class="src-conn-name" style="font-family:var(--display, var(--font-content)); font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                                    <span class="src-platform-dot"></span> Amazon Seller API
                                </span>
                                <span class="mono-lbl">PIPELINE</span>
                            </div>
                            <p style="font-size:13px; color:var(--ink-3, #6E7686); margin:0 0 12px; line-height:1.5;">Merchant order volume and gross merchandise value verification adapters currently undergoing security audit.</p>
                            <div style="border-top:1px dotted var(--rule, #DCD5C6); padding-top:12px;">
                                <span class="mono-lbl" style="font-size:9.5px;">SUPPORTED CONTRACT EXAMPLE</span>
                                <div style="font-size:12px; font-weight:600; color:var(--ink-3, #6E7686); margin-top:4px;">200 Order Volume Threshold</div>
                            </div>
                        </div>
                        <button class="src-btn-connect" disabled>Coming Soon</button>
                    </div>

                    <!-- Item 9: TikTok Creator API (Coming Soon — De-emphasized) -->
                    <div class="src-prov-card coming-soon">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span class="src-conn-name" style="font-family:var(--display, var(--font-content)); font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px;">
                                    <span class="src-platform-dot"></span> TikTok Creator API
                                </span>
                                <span class="mono-lbl">PIPELINE</span>
                            </div>
                            <p style="font-size:13px; color:var(--ink-3, #6E7686); margin:0 0 12px; line-height:1.5;">Short-form video view count and follower growth telemetry integration scheduled for next release cycle.</p>
                            <div style="border-top:1px dotted var(--rule, #DCD5C6); padding-top:12px;">
                                <span class="mono-lbl" style="font-size:9.5px;">SUPPORTED CONTRACT EXAMPLE</span>
                                <div style="font-size:12px; font-weight:600; color:var(--ink-3, #6E7686); margin-top:4px;">100,000 Video Views Threshold</div>
                            </div>
                        </div>
                        <button class="src-btn-connect" disabled>Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initSources() {
    // Sources initialization logic
}
