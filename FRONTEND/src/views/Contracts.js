// Contracts.js — Contract Execution Terminal
// Final capital lock confirmation. No wizards. No configuration.
// Tiers are embedded in the contract. This page exists for one purpose:
// Confirm and lock capital under fixed performance terms.

export function renderContracts() {
    return `
        <style>
            /* ===== EXECUTION TERMINAL — INSTITUTIONAL DESIGN ===== */

            .ext {
                background: #FAF4E6;
                min-height: calc(100vh - 64px);
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
            }

            /* Header strip */
            .ext-head {
                padding: 14px 32px;
                background: #F5EDDA;
                border-bottom: 1px solid rgba(70,55,35,.22);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .ext-head-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ext-back-btn {
                padding: 6px 12px;
                font-size: 12px; color: #888;
                background: none; border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px; cursor: pointer;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                transition: all 0.15s;
            }
            .ext-back-btn:hover { border-color: #bbb; color: #333; }
            .ext-head-id {
                font-size: 11px;
                font-family: 'JetBrains Mono', monospace;
                color: #999;
                letter-spacing: 0.5px;
            }
            .ext-head-status {
                display: inline-flex; align-items: center; gap: 6px;
                font-size: 11px; color: #065f46;
                font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .ext-head-dot {
                width: 6px; height: 6px;
                background: #065f46;
                border-radius: 50%;
                animation: ext-pulse 2s infinite;
            }
            @keyframes ext-pulse {
                0%,100% { opacity: 0.6; } 50% { opacity: 1; }
            }

            /* Title block */
            .ext-title-area {
                padding: 40px 0 0;
                max-width: 720px;
                margin: 0 auto;
            }
            .ext-page-title {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
                color: #0a0a0a;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0 0 6px;
                text-transform: uppercase;
            }
            .ext-page-sub {
                font-size: 13px;
                color: #666;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                line-height: 1.5;
            }

            /* Container */
            .ext-container {
                max-width: 720px;
                margin: 0 auto;
                padding: 32px 24px 80px;
            }

            /* Card blocks */
            .ext-card {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 16px;
            }
            .ext-card-hd {
                padding: 14px 24px;
                border-bottom: 1px solid #f0f0f0;
                background: #FAF4E6;
            }
            .ext-card-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #555;
                font-family: 'JetBrains Mono', monospace;
                margin: 0;
            }
            .ext-card-bd { padding: 24px; }

            /* Two-column grid */
            .ext-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0;
            }
            .ext-grid > div {
                padding: 16px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .ext-grid > div:nth-child(odd) { padding-right: 24px; }
            .ext-grid > div:nth-child(even) { padding-left: 24px; border-left: 1px solid #f0f0f0; }
            .ext-grid > div:nth-last-child(-n+2) { border-bottom: none; }

            .ext-lbl {
                font-size: 11px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-family: 'JetBrains Mono', monospace;
                font-weight: 500;
                margin-bottom: 4px;
            }
            .ext-val {
                font-size: 18px;
                font-weight: 600;
                color: #111;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                letter-spacing: -0.3px;
            }
            .ext-val.green { color: #065f46; }
            .ext-val.sm {
                font-size: 14px;
                font-weight: 500;
            }

            /* Baseline note */
            .ext-base-note {
                font-size: 11px;
                color: #999;
                font-family: 'JetBrains Mono', monospace;
                padding: 12px 24px;
                border-top: 1px solid #f0f0f0;
                background: #FAF4E6;
            }

            /* Forfeiture */
            .ext-forfeit {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-left: 3px solid #752122;
                border-radius: 6px;
                padding: 20px 24px;
                margin-bottom: 16px;
            }
            .ext-forfeit-hd {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #752122;
                font-family: 'JetBrains Mono', monospace;
                margin: 0 0 12px;
            }
            .ext-forfeit-body {
                font-size: 14px;
                color: #333;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
            }
            .ext-forfeit-amt {
                font-weight: 700;
                color: #752122;
            }

            /* Warning */
            .ext-warn {
                background: #FAF4E6;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                padding: 20px 24px;
                margin-bottom: 16px;
            }
            .ext-warn-hd {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #555;
                font-family: 'JetBrains Mono', monospace;
                margin: 0 0 12px;
            }
            .ext-warn-list {
                list-style: none;
                padding: 0; margin: 0;
            }
            .ext-warn-list li {
                font-size: 13px;
                color: #444;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ext-warn-list li:last-child { border-bottom: none; }
            .ext-warn-dot {
                width: 4px; height: 4px;
                background: #999;
                border-radius: 50%;
                flex-shrink: 0;
            }

            /* Provider connect gate */
            .ext-gate {
                text-align: center;
                padding: 40px 24px;
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                margin-bottom: 16px;
            }
            .ext-gate-icon {
                width: 48px; height: 48px;
                background: #f5f5f5;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
                font-size: 20px; color: #888;
            }
            .ext-gate-title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 6px;
            }
            .ext-gate-sub {
                font-size: 12px;
                color: #888;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            .ext-gate-btn {
                padding: 12px 24px;
                font-size: 12px; font-weight: 600;
                color: #fff; background: #111;
                border: none; border-radius: 6px;
                cursor: pointer; text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: background 0.15s;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            .ext-gate-btn:hover { background: #333; }
            .ext-gate-btn:disabled { background: #ccc; cursor: not-allowed; }
            .ext-gate-btn.stripe-btn { background: #635bff; }
            .ext-gate-btn.stripe-btn:hover { background: #5851eb; }

            .ext-gate-connected {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 16px;
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                border-radius: 6px;
                margin-top: 12px;
            }
            .ext-gate-connected-dot {
                width: 8px; height: 8px;
                background: #059669;
                border-radius: 50%;
            }
            .ext-gate-connected-text {
                font-size: 12px;
                font-weight: 600;
                color: #065f46;
                font-family: 'JetBrains Mono', monospace;
            }

            /* Acknowledgement */
            .ext-ack {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 16px 20px;
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                margin-bottom: 16px;
                cursor: pointer;
                transition: border-color 0.15s;
            }
            .ext-ack:hover { border-color: #bbb; }
            .ext-ack.checked { border-color: #752122; background: #fef7f7; }
            .ext-ack input[type="checkbox"] {
                width: 16px; height: 16px;
                accent-color: #752122;
                cursor: pointer;
                flex-shrink: 0;
                margin-top: 1px;
            }
            .ext-ack-text {
                font-size: 13px;
                color: #333;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.5;
                user-select: none;
            }

            /* Execute button — Dual-State */
            .ext-exec-btn {
                width: 100%;
                padding: 18px 24px;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #111111;
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                transition: all 150ms ease;
                position: relative;
                overflow: hidden;
                box-shadow: none;
            }
            .ext-exec-btn:hover:not(:disabled) {
                border-color: #7f1d1d;
                color: #7f1d1d;
                transform: translateY(-1px);
            }
            .ext-exec-btn:active:not(:disabled) {
                background: #7f1d1d;
                color: #ffffff;
                border-color: #7f1d1d;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                transform: translateY(0);
            }
            .ext-exec-btn:focus-visible {
                outline: 2px solid rgba(127,29,29,0.4);
                outline-offset: 2px;
            }
            .ext-exec-btn:disabled {
                background: #f5f5f5;
                color: #999;
                border-color: rgba(70,55,35,.22);
                cursor: not-allowed;
                box-shadow: none;
            }

            /* Footer */
            .ext-foot {
                text-align: center;
                padding: 20px 0 0;
            }
            .ext-foot-text {
                font-size: 11px;
                color: #bbb;
                font-family: 'JetBrains Mono', monospace;
                letter-spacing: 0.3px;
            }

            /* Loading state */
            .ext-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 120px 0;
                gap: 16px;
            }
            @keyframes cl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes cl-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
            .ext-loading-text {
                font-size: 12px;
                color: #999;
                font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Enforcement Modal */
            .enf-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(2px);
                z-index: 9999;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .enf-overlay.visible { display: flex; }
            .enf-modal {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 8px;
                max-width: 440px;
                width: 100%;
                overflow: hidden;
                box-shadow: 0 24px 48px rgba(0,0,0,0.15);
            }
            .enf-bar { height: 3px; background: #752122; }
            .enf-body { padding: 24px; }
            .enf-title {
                font-size: 16px; font-weight: 600;
                color: #111; margin: 0 0 8px;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            .enf-msg {
                font-size: 13px; color: #555;
                line-height: 1.6; margin: 0 0 16px;
            }
            .enf-rule {
                font-size: 10px; color: #bbb;
                font-family: 'JetBrains Mono', monospace;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin-bottom: 16px;
            }
            .enf-actions {
                display: flex; gap: 8px;
                justify-content: flex-end;
            }
            .enf-btn {
                padding: 8px 16px;
                font-size: 12px; font-weight: 600;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                border: 1px solid rgba(70,55,35,.22);
                background: #F5EDDA; color: #333;
                transition: all 0.15s;
            }
            .enf-btn:hover { background: #f5f5f5; }
            .enf-btn-primary {
                background: #111; color: #fff; border-color: #111;
            }
            .enf-btn-primary:hover { background: #333; }

            /* Responsive */
            @media (max-width: 640px) {
                .ext-container { padding: 20px 16px 60px; }
                .ext-head { padding: 12px 16px; }
                .ext-grid { grid-template-columns: 1fr; }
                .ext-grid > div:nth-child(even) { padding-left: 0; border-left: none; }
                .ext-grid > div:nth-child(odd) { padding-right: 0; }
                .ext-title-area { padding: 24px 16px 0; }
            }
        </style>

        <div class="ext">
            <!-- Header -->
            <div class="ext-head">
                <div class="ext-head-left">
                    <button class="ext-back-btn" id="ext-nav-back">← Market</button>
                    <span class="ext-head-id" id="ext-ref-id">—</span>
                </div>
                <div class="ext-head-status">
                    <span class="ext-head-dot"></span>
                    <span id="ext-status-label">READY</span>
                </div>
            </div>

            <!-- Loading -->
            <div class="ext-loading" id="ext-loader">
                <div style="position:relative;width:48px;height:48px;">
                    <svg style="position:absolute;top:0;left:0;width:100%;height:100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="15.5" stroke="#3B0001" stroke-width="2"/><line x1="32" y1="19.5" x2="32" y2="44.5" stroke="#3B0001" stroke-width="1.5" stroke-linecap="round" style="animation:cl-pulse 1.6s ease-in-out infinite"/></svg>
                    <svg style="position:absolute;top:0;left:0;width:100%;height:100%;animation:cl-spin 2.4s linear infinite;transform-origin:center center" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26.5" ry="7.5" stroke="#3B0001" stroke-width="1.1" fill="none" transform="rotate(-27 32 32)"/></svg>
                </div>
                <div class="ext-loading-text">Initializing execution terminal...</div>
            </div>

            <!-- Main Content -->
            <div id="ext-main" style="display: none;">
                <div class="ext-title-area" data-reveal>
                    <h1 class="ext-page-title">CONTRACT EXECUTION</h1>
                    <p class="ext-page-sub">You are committing capital under fixed performance terms.</p>
                </div>

                <div class="ext-container">
                    <!-- Capital Summary -->
                    <div class="ext-card">
                        <div class="ext-card-hd">
                            <h3 class="ext-card-title">Capital Summary</h3>
                        </div>
                        <div class="ext-card-bd">
                            <div class="ext-grid">
                                <div>
                                    <div class="ext-lbl">Capital to Lock</div>
                                    <div class="ext-val" id="ext-capital">$5,000</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Maximum Payout</div>
                                    <div class="ext-val green" id="ext-payout">$7,500</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Tier</div>
                                    <div class="ext-val sm" id="ext-tier">PLEDGE</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Expected Pass Rate</div>
                                    <div class="ext-val sm" id="ext-pass-rate">~30%</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Verification Source</div>
                                    <div class="ext-val sm" id="ext-source">—</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Contract Window</div>
                                    <div class="ext-val sm" id="ext-window">30 Days</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Baseline Snapshot -->
                    <div class="ext-card" data-reveal>
                        <div class="ext-card-hd">
                            <h3 class="ext-card-title">Baseline Snapshot</h3>
                        </div>
                        <div class="ext-card-bd">
                            <div class="ext-grid">
                                <div>
                                    <div class="ext-lbl">Snapshot ID</div>
                                    <div class="ext-val sm" id="ext-snap-id" style="font-family:'JetBrains Mono', monospace;font-size:12px;color:#888;">—</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Measured Period</div>
                                    <div class="ext-val sm" id="ext-snap-period">Last 30 Days</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Baseline Value</div>
                                    <div class="ext-val" id="ext-snap-base">$—</div>
                                </div>
                                <div>
                                    <div class="ext-lbl">Target Delta</div>
                                    <div class="ext-val green" id="ext-snap-delta">+15%</div>
                                </div>
                            </div>
                        </div>
                        <div class="ext-base-note">
                            Baseline snapshot is immutable after execution.
                        </div>
                    </div>

                    <!-- Forfeiture Terms -->
                    <div class="ext-forfeit" data-reveal>
                        <h3 class="ext-forfeit-hd">Capital Forfeiture Terms</h3>
                        <p class="ext-forfeit-body">
                            If performance target is not met:<br>
                            → <span class="ext-forfeit-amt" id="ext-forfeit-line">100% of locked capital is forfeited.</span>
                        </p>
                    </div>

                    <!-- Irreversibility Warning -->
                    <div class="ext-warn" data-reveal>
                        <h3 class="ext-warn-hd">Execution Terms</h3>
                        <ul class="ext-warn-list">
                            <li><span class="ext-warn-dot"></span> Execution is irreversible.</li>
                            <li><span class="ext-warn-dot"></span> Capital is locked immediately upon confirmation.</li>
                            <li><span class="ext-warn-dot"></span> Settlement is enforced via deterministic provider verification.</li>
                            <li><span class="ext-warn-dot"></span> No overrides on the outcome. No appeals.</li>
                        </ul>
                    </div>

                    <!-- Provider Connection Gate -->
                    <div class="ext-gate" id="ext-connect-gate" style="display: none;">
                        <div class="ext-gate-icon" id="ext-gate-icon">⚡</div>
                        <div class="ext-gate-title" id="ext-gate-title">Connect Provider</div>
                        <div class="ext-gate-sub" id="ext-gate-sub">
                            You must connect your verification source before executing this contract.
                        </div>
                        <button class="ext-gate-btn" id="ext-gate-btn">Connect Provider</button>
                        <div class="ext-gate-connected" id="ext-gate-connected" style="display: none;">
                            <span class="ext-gate-connected-dot"></span>
                            <span class="ext-gate-connected-text" id="ext-gate-connected-text">Connected</span>
                        </div>
                    </div>

                    <!-- Acknowledge + Execute (shown when provider is connected) -->
                    <div id="ext-exec-section" style="display: none;">
                        <label class="ext-ack" id="ext-ack-label">
                            <input type="checkbox" id="ext-ack-cb">
                            <span class="ext-ack-text">
                                I understand that failure to meet the performance target results in full capital forfeiture. This action is irreversible.
                            </span>
                        </label>

                        <button class="ext-exec-btn" id="ext-exec-btn" disabled>
                            <span id="ext-btn-text">EXECUTE CONTRACT</span>
                        </button>
                    </div>

                    <!-- Footer -->
                    <div class="ext-foot" data-reveal>
                        <span class="ext-foot-text">Settlement event will be recorded in the Global Ledger.</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =========================================================
// INIT — Execution Terminal
// =========================================================
export function initContracts() {

    // --- State ---
    let selectedSource = null;   // 'TWITTER' | 'STRIPE' | 'YOUTUBE' | 'SHOPIFY' | 'GITHUB'
    let selectedRisk = 'STEADY'; // default tier
    let capitalAmount = 5000;
    let multiplier = 1.5;
    let holdComplete = false;

    // Connection state
    let xVerified = false;
    let xUsername = null;
    let stripeVerified = false;
    let stripeAccountId = null;

    // =========================================================
    // URL PARAM HYDRATION — Read from term sheet navigation
    // =========================================================
    const hashQuery = window.location.hash.split('?')[1];
    if (hashQuery) {
        const urlParams = new URLSearchParams(hashQuery);

        // Capital amount
        const cap = parseInt(urlParams.get('capital'));
        if (cap && cap > 0) capitalAmount = cap;

        // Tier → risk mapping
        const tierParam = (urlParams.get('tier') || '').toLowerCase();
        const tierToRisk = {
            'controlled': 'STEADY',
            'steady': 'STEADY',
            'pledge': 'STEADY',
            'elevated': 'BOLD',
            'bold': 'BOLD',
            'stake': 'BOLD',
            'maximum': 'ALL_IN',
            'all_in': 'ALL_IN',
            'all-in': 'ALL_IN',
        };
        if (tierToRisk[tierParam]) selectedRisk = tierToRisk[tierParam];

        // Source
        const src = (urlParams.get('source') || '').toUpperCase();
        if (['STRIPE', 'X', 'TWITTER', 'YOUTUBE', 'SHOPIFY', 'GITHUB'].includes(src)) {
            selectedSource = src === 'X' ? 'TWITTER' : src;
        }
    }

    // =========================================================
    // FLOW LOCK — Prevent duplicate executions
    // =========================================================
    const FLOW_LOCK_KEY = 'collateral_flow_lock';
    const FLOW_LOCK_EXPIRY_MS = 5 * 60 * 1000;

    function hasActiveFlowLock() {
        const lockData = localStorage.getItem(FLOW_LOCK_KEY);
        if (!lockData) return false;
        try {
            const lock = JSON.parse(lockData);
            if (Date.now() - lock.startedAt >= FLOW_LOCK_EXPIRY_MS) {
                console.warn('[Exec] Cleared stale flow lock');
                localStorage.removeItem(FLOW_LOCK_KEY);
                return false;
            }
            return true;
        } catch { localStorage.removeItem(FLOW_LOCK_KEY); return false; }
    }

    function acquireFlowLock() {
        if (hasActiveFlowLock()) return false;
        localStorage.setItem(FLOW_LOCK_KEY, JSON.stringify({ startedAt: Date.now() }));
        return true;
    }

    function releaseFlowLock() {
        localStorage.removeItem(FLOW_LOCK_KEY);
        console.log('[Exec] Flow lock released');
    }

    // Clear stale locks on load
    hasActiveFlowLock();

    // =========================================================
    // ENFORCEMENT MODAL
    // =========================================================
    function showEnforcementModal({ title = 'Execution Blocked', message = '', ruleId = null, primaryText = null, primaryAction = null, secondaryText = 'Dismiss' } = {}) {
        document.getElementById('enf-overlay')?.remove();

        const html = `
            <div id="enf-overlay" class="enf-overlay visible">
                <div class="enf-modal">
                    <div class="enf-bar"></div>
                    <div class="enf-body">
                        <div class="enf-title">${title}</div>
                        <div class="enf-msg">${message}</div>
                        ${ruleId ? `<div class="enf-rule">Rule: ${ruleId}</div>` : ''}
                        <div class="enf-actions">
                            <button class="enf-btn" id="enf-dismiss">${secondaryText}</button>
                            ${primaryText ? `<button class="enf-btn enf-btn-primary" id="enf-primary">${primaryText}</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('enf-overlay');
        const close = () => overlay?.remove();

        document.getElementById('enf-dismiss')?.addEventListener('click', close);
        overlay?.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });

        if (primaryText && primaryAction) {
            document.getElementById('enf-primary')?.addEventListener('click', () => { close(); primaryAction(); });
        }
    }

    function showErrorModal(rawMessage, { code = null, title = null, activeContractId = null } = {}) {
        const mappings = {
            'MAX_ACTIVE_CONTRACT_PER_PLATFORM': {
                title: 'One active contract per platform',
                message: `You already have an active contract on <strong>${selectedSource === 'TWITTER' ? 'X' : 'Stripe'}</strong>.<br><br>Only <strong>1 active contract</strong> per platform is allowed.`,
                ruleId: 'MAX_ACTIVE_PER_PLATFORM',
                primaryText: activeContractId ? 'View Active Contract' : null,
                primaryAction: activeContractId ? () => window.router.navigate('/contracts/' + activeContractId) : null
            },
            'PLATFORM_NOT_CONNECTED': {
                title: 'Platform connection required',
                message: `Connect your <strong>${selectedSource === 'TWITTER' ? 'X (Twitter)' : 'Stripe'}</strong> account before creating a contract.`,
                ruleId: 'REQUIRE_PLATFORM_CONNECTION'
            },
            'PLATFORM_NOT_VERIFIED': {
                title: 'Verification incomplete',
                message: `Complete verification for your <strong>${selectedSource === 'TWITTER' ? 'X' : 'Stripe'}</strong> account.`,
                ruleId: 'REQUIRE_VERIFIED_CONNECTION'
            },
            'PLATFORM_CONNECTION_INACTIVE': {
                title: 'Connection revoked',
                message: `Your <strong>${selectedSource === 'TWITTER' ? 'X' : 'Stripe'}</strong> connection has been revoked. Please reconnect.`,
                ruleId: 'CONNECTION_STATUS_ACTIVE'
            },
            'FLOW_LOCKED': {
                title: 'Execution in progress',
                message: 'A contract execution is already running. Wait for it to complete.',
                ruleId: 'SINGLE_FLOW_LOCK'
            },
            'FUNDS_LOCK_TIMEOUT': {
                title: 'Funds not locked',
                message: 'Payment authorized but funds not fully locked. Please wait and try again.',
                ruleId: 'FUNDS_LOCK_REQUIRED'
            }
        };

        const m = code ? mappings[code] : null;
        if (m) {
            showEnforcementModal(m);
        } else {
            showEnforcementModal({ title: title || 'Execution blocked', message: rawMessage || 'An unexpected issue occurred.' });
        }
    }

    // =========================================================
    // PROVIDER SOURCE DETECTION — auto-detect from URL or default
    // =========================================================
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get('source');
    const connectedParam = urlParams.get('connected');

    if (sourceParam) {
        selectedSource = sourceParam.toUpperCase();
        if (selectedSource === 'X') selectedSource = 'TWITTER';
    }

    // Show toast if returning from OAuth
    if (connectedParam === 'x') {
        setTimeout(() => showToast('X Account Connected', 'Authority binding established.'), 500);
    } else if (connectedParam === 'stripe') {
        setTimeout(() => showToast('Stripe Connected', 'Revenue authority binding established.'), 500);
    }

    // Clean URL
    if (sourceParam || connectedParam) {
        window.history.replaceState({}, '', window.location.pathname + '#/contracts');
    }

    function showToast(title, message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 right-6 bg-[#1F7A4D] text-white px-6 py-4 rounded-lg shadow-lg z-50';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#065f46;color:#fff;padding:16px 24px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;font-family:"Neue Haas Grotesk Display","Helvetica Neue",Helvetica,Arial,sans-serif;';
        toast.innerHTML = `<div style="font-size:13px;font-weight:600;">${title}</div><div style="font-size:11px;opacity:0.9;margin-top:4px;">${message}</div>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    // =========================================================
    // CONNECTION STATUS — Canonical refresh
    // =========================================================
    async function refreshConnectionStatus() {
        try {
            const status = await window.api.getConnectionStatus();
            console.log('[Exec] Connection status:', status);

            if (!status?.platforms) {
                updateGateUI();
                return;
            }

            // X
            const x = status.platforms.find(p => p.platform === 'X');
            if (x && x.verificationStatus === 'VERIFIED') {
                xVerified = true;
                xUsername = x.metadata?.resolvedUsername || null;
                window.appState.connectedSources.twitter = true;
            } else {
                xVerified = false;
                xUsername = null;
                window.appState.connectedSources.twitter = false;
            }

            // Stripe
            const stripe = status.platforms.find(p => p.platform === 'STRIPE');
            if (stripe && stripe.verificationStatus === 'VERIFIED') {
                stripeVerified = true;
                stripeAccountId = stripe.externalAccountId || null;
                window.appState.connectedSources.stripe = true;
            } else {
                stripeVerified = false;
                stripeAccountId = null;
                window.appState.connectedSources.stripe = false;
            }

            // YouTube
            const yt = status.platforms.find(p => p.platform === 'YOUTUBE');
            if (yt && yt.verificationStatus === 'VERIFIED') {
                window.appState.connectedSources.youtube = true;
            } else {
                window.appState.connectedSources.youtube = false;
            }

            // Shopify
            const shopify = status.platforms.find(p => p.platform === 'SHOPIFY');
            if (shopify && shopify.verificationStatus === 'VERIFIED') {
                window.appState.connectedSources.shopify = true;
            } else {
                window.appState.connectedSources.shopify = false;
            }

            // GitHub
            const github = status.platforms.find(p => p.platform === 'GITHUB');
            if (github && github.verificationStatus === 'VERIFIED') {
                window.appState.connectedSources.github = true;
            } else {
                window.appState.connectedSources.github = false;
            }
        } catch (err) {
            console.log('[Exec] Status check failed:', err.message);
        }

        updateGateUI();
    }

    // =========================================================
    // GATE UI — Show connect or execute section
    // =========================================================
    function isConnected() {
        if (!selectedSource) return false;
        if (selectedSource === 'TWITTER') return !!xVerified;
        if (selectedSource === 'STRIPE') return !!stripeVerified;
        // YouTube, Shopify, GitHub: check via refreshed connection status
        if (selectedSource === 'YOUTUBE') return !!window.appState?.connectedSources?.youtube;
        if (selectedSource === 'SHOPIFY') return !!window.appState?.connectedSources?.shopify;
        if (selectedSource === 'GITHUB') return !!window.appState?.connectedSources?.github;
        return false;
    }

    function updateGateUI() {
        const gate = document.getElementById('ext-connect-gate');
        const execSection = document.getElementById('ext-exec-section');
        if (!gate || !execSection) return;

        if (!selectedSource) {
            // No source selected — show gate asking user to select
            gate.style.display = 'block';
            execSection.style.display = 'none';
            const titleEl = document.getElementById('ext-gate-title');
            const subEl = document.getElementById('ext-gate-sub');
            const btnEl = document.getElementById('ext-gate-btn');
            if (titleEl) titleEl.textContent = 'Select Provider';
            if (subEl) subEl.textContent = 'Choose a verification source to proceed with execution.';
            if (btnEl) btnEl.style.display = 'none';
            return;
        }

        const platformNames = {
            'TWITTER': 'X (Twitter)',
            'STRIPE': 'Stripe',
            'YOUTUBE': 'YouTube',
            'SHOPIFY': 'Shopify',
            'GITHUB': 'GitHub',
        };
        const platformName = platformNames[selectedSource] || selectedSource;

        if (isConnected()) {
            // Connected → show execute section
            gate.style.display = 'none';
            execSection.style.display = 'block';

            // Update source field
            const sourceField = document.getElementById('ext-source');
            if (sourceField) sourceField.textContent = platformName;
        } else {
            // Not connected → show gate
            gate.style.display = 'block';
            execSection.style.display = 'none';
            const connectedDiv = document.getElementById('ext-gate-connected');
            if (connectedDiv) connectedDiv.style.display = 'none';

            const titleEl = document.getElementById('ext-gate-title');
            const subEl = document.getElementById('ext-gate-sub');
            const btnEl = document.getElementById('ext-gate-btn');

            if (titleEl) titleEl.textContent = `Connect ${platformName}`;
            if (subEl) subEl.textContent = `You must connect your ${platformName} account to verify eligibility and execute this contract.`;
            if (btnEl) {
                btnEl.textContent = `Connect ${platformName}`;
                btnEl.style.display = 'inline-block';
                btnEl.disabled = false;
                if (selectedSource === 'STRIPE') {
                    btnEl.classList.add('stripe-btn');
                } else {
                    btnEl.classList.remove('stripe-btn');
                }
            }
        }
    }

    // =========================================================
    // HYDRATE UI — Populate fields from detected defaults
    // =========================================================
    function hydrateFields() {
        // Tier display
        const tierMap = {
            'STEADY': { name: 'PLEDGE', rate: '~30%', mult: 1.5 },
            'BOLD': { name: 'STAKE', rate: '~20%', mult: 2.5 },
            'ALL_IN': { name: 'ALL-IN', rate: '~10%', mult: 4.0 }
        };
        const tier = tierMap[selectedRisk] || tierMap['STEADY'];
        multiplier = tier.mult;
        const payout = Math.round(capitalAmount * multiplier * 100) / 100;

        setText('ext-capital', '$' + capitalAmount.toLocaleString());
        setText('ext-payout', '$' + payout.toLocaleString());
        setText('ext-tier', tier.name);
        setText('ext-pass-rate', tier.rate);
        const sourceNames = {
            'TWITTER': 'X (Twitter)',
            'STRIPE': 'Stripe',
            'YOUTUBE': 'YouTube',
            'SHOPIFY': 'Shopify',
            'GITHUB': 'GitHub',
        };
        setText('ext-source', sourceNames[selectedSource] || selectedSource || '—');
        setText('ext-window', '30 Days');

        // Snapshot
        const snapId = new Date().toISOString().slice(0, 19).replace('T', '-');
        setText('ext-snap-id', snapId);
        setText('ext-snap-base', '$—');
        setText('ext-snap-delta', '+15%');

        // Forfeiture
        const forfeitEl = document.getElementById('ext-forfeit-line');
        if (forfeitEl) {
            if (selectedRisk === 'ALL_IN') {
                forfeitEl.textContent = 'Total capital forfeiture.';
            } else {
                forfeitEl.textContent = `100% of locked capital ($${capitalAmount.toLocaleString()}) is forfeited.`;
            }
        }

        // Ref ID
        setText('ext-ref-id', 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // =========================================================
    // NAV — Back button
    // =========================================================
    document.getElementById('ext-nav-back')?.addEventListener('click', () => {
        window.router.navigate('/market');
    });

    // =========================================================
    // CONNECT BUTTON — X OAuth / Stripe Connect
    // =========================================================
    document.getElementById('ext-gate-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('ext-gate-btn');
        if (!btn || !selectedSource) return;

        btn.disabled = true;
        btn.textContent = 'Connecting...';

        try {
            if (selectedSource === 'TWITTER') {
                const result = await window.api.startXOAuth();
                if (result.connected) {
                    await refreshConnectionStatus();
                    return;
                }
                if (result.oauthUrl) {
                    window.location.href = result.oauthUrl;
                }
            } else if (selectedSource === 'STRIPE') {
                const result = await window.api.startStripeConnect();

                if (result.alreadyConnected) {
                    stripeVerified = true;
                    stripeAccountId = result.stripeAccountId;
                    window.appState.connectedSources.stripe = true;
                    updateGateUI();
                    return;
                }

                // Store state for callback
                localStorage.setItem('stripe_oauth_state', result.state);

                // Open popup
                const popup = window.open(result.oauthUrl, 'stripe-connect', 'width=600,height=700,scrollbars=yes');

                // Poll for connection
                const pollInterval = setInterval(async () => {
                    try {
                        if (popup && popup.closed) {
                            clearInterval(pollInterval);
                            await refreshConnectionStatus();
                            if (stripeVerified) {
                                showToast('Stripe Connected', 'Revenue authority binding established.');
                            }
                            btn.textContent = selectedSource === 'STRIPE' ? 'Connect Stripe' : 'Connect Provider';
                            btn.disabled = false;
                            return;
                        }

                        const s = await window.api.getStripeStatus();
                        if (s.connected) {
                            clearInterval(pollInterval);
                            if (popup && !popup.closed) popup.close();
                            stripeVerified = true;
                            stripeAccountId = s.stripeAccountId || null;
                            window.appState.connectedSources.stripe = true;
                            if (window.hydrateSession) await window.hydrateSession();
                            updateGateUI();
                            showToast('Stripe Connected', 'Revenue authority binding established.');
                        }
                    } catch (e) {
                        console.warn('[Exec] Stripe poll error:', e);
                    }
                }, 2000);

                // Timeout
                setTimeout(() => {
                    clearInterval(pollInterval);
                    btn.textContent = 'Connect Stripe';
                    btn.disabled = false;
                }, 10 * 60 * 1000);
            }
        } catch (err) {
            console.error('[Exec] Connect error:', err);
            btn.textContent = 'Connect Failed — Retry';
            btn.disabled = false;
        }
    });

    // =========================================================
    // ACKNOWLEDGEMENT CHECKBOX
    // =========================================================
    const ackCb = document.getElementById('ext-ack-cb');
    const ackLabel = document.getElementById('ext-ack-label');
    const execBtn = document.getElementById('ext-exec-btn');

    if (ackCb && execBtn) {
        ackCb.addEventListener('change', () => {
            execBtn.disabled = !ackCb.checked;
            if (ackLabel) ackLabel.classList.toggle('checked', ackCb.checked);
        });
    }

    // =========================================================
    // EXECUTE — Full pipeline
    // =========================================================
    execBtn?.addEventListener('click', async () => {
        if (!ackCb?.checked) return;
        if (holdComplete) return;

        // Flow lock
        if (!acquireFlowLock()) {
            showErrorModal('Execution already in progress.', { code: 'FLOW_LOCKED' });
            return;
        }

        holdComplete = true;
        execBtn.disabled = true;
        const btnText = document.getElementById('ext-btn-text');
        const statusLabel = document.getElementById('ext-status-label');

        // Helper: poll until state
        const pollUntilState = async (contractId, acceptStates, timeoutMs = 90000) => {
            if (!contractId) return { timeout: true, lastState: undefined, aborted: true };
            const start = Date.now();
            let delay = 750;
            let lastState = null;
            let consecutiveUndefined = 0;

            while (true) {
                try {
                    const res = await window.api.getContract(contractId);
                    lastState = res.contract?.derivedState || res.contract?.state;
                    console.log(`[Exec] Poll: ${lastState}`);

                    if (lastState === undefined) {
                        consecutiveUndefined++;
                        if (consecutiveUndefined >= 3) return { timeout: true, lastState: undefined, aborted: true, contract: res.contract, events: res.events };
                    } else { consecutiveUndefined = 0; }

                    if (acceptStates.includes(lastState)) return res;
                } catch (e) { console.warn('[Exec] Poll error:', e.message); }

                if (Date.now() - start > timeoutMs) return { timeout: true, lastState };
                await new Promise(r => setTimeout(r, delay));
                delay = Math.min(4000, Math.floor(delay * 1.35));
            }
        };

        const platformMap = {
            'TWITTER': 'X',
            'STRIPE': 'STRIPE',
            'YOUTUBE': 'YOUTUBE',
            'SHOPIFY': 'SHOPIFY',
            'GITHUB': 'GITHUB',
        };
        const chosenPlatform = platformMap[selectedSource] || selectedSource;

        const metricTypeMap = {
            'X': 'FOLLOWERS',
            'STRIPE': 'REVENUE',
            'YOUTUBE': 'SUBSCRIBERS',
            'SHOPIFY': 'REVENUE',
            'GITHUB': 'PRS_MERGED',
        };

        try {
            // STEP 1: Create contract
            if (btnText) btnText.textContent = 'Creating contract...';
            if (statusLabel) statusLabel.textContent = 'CREATING';

            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 30);

            const params = {
                platform: chosenPlatform,
                metricType: metricTypeMap[chosenPlatform] || 'FOLLOWERS',
                condition: {
                    operator: 'GTE',
                    threshold: 10000,
                    deadline: deadline.toISOString(),
                },
                lockAmountUsdCents: Math.round(capitalAmount * 100),
                payoutAmountUsdCents: Math.round(capitalAmount * 100),
                fundingMethod: 'USD_CARD',
            };

            const createRes = await window.api.createContract(params);
            if (!createRes?.ok) {
                const e = new Error(createRes?.error || 'Contract creation failed');
                e.code = createRes?.code;
                e.platform = chosenPlatform;
                throw e;
            }

            const contractId = createRes.contractId || createRes.contract?.id;
            if (!contractId) throw new Error('Contract created but no ID returned');

            // STEP 2: Funding intent
            if (btnText) btnText.textContent = 'Preparing payment...';
            if (statusLabel) statusLabel.textContent = 'FUNDING';

            const fundingRes = await window.api.createFundingIntent(contractId);
            const clientSecret = fundingRes?.clientSecret;
            if (!clientSecret) throw new Error('Failed to create payment intent');

            // STEP 3: Confirm payment
            if (btnText) btnText.textContent = 'Confirming payment...';

            if (window.stripe && window.stripeElements) {
                const confirm = await window.stripe.confirmPayment({
                    elements: window.stripeElements,
                    clientSecret,
                    redirect: 'if_required',
                });
                if (confirm?.error) throw new Error(confirm.error.message || 'Payment failed');
            } else {
                console.log('[Exec] Stripe not initialized (dev mode)');
            }

            // STEP 4: Poll for FUNDS_LOCKED
            if (btnText) btnText.textContent = 'Locking funds...';
            if (statusLabel) statusLabel.textContent = 'LOCKING';

            const lockRes = await pollUntilState(contractId, ['FUNDS_AUTHORIZED', 'FUNDS_LOCKED', 'LOCKED'], 90000);

            if (lockRes.timeout) {
                const e = new Error(`Funds did not lock. State: ${lockRes.lastState}`);
                e.code = 'FUNDS_LOCK_TIMEOUT';
                throw e;
            }

            if (lockRes.contract?.derivedState === 'LOCKED') {
                releaseFlowLock();
                // X Pixel — Create Contract conversion
                if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5u', {});
                setTimeout(() => window.router.navigate('/contracts/' + contractId), 1000);
                return;
            }

            if (lockRes.contract?.derivedState === 'FUNDS_AUTHORIZED') {
                const lockedRes = await pollUntilState(contractId, ['FUNDS_LOCKED', 'LOCKED'], 60000);
                if (lockedRes.timeout) {
                    const e = new Error(`Funds authorized but not locked. State: ${lockedRes.lastState}`);
                    e.code = 'FUNDS_LOCK_TIMEOUT';
                    throw e;
                }
                if (lockedRes.contract?.derivedState === 'LOCKED') {
                    releaseFlowLock();
                    // X Pixel — Create Contract conversion
                    if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5u', {});
                    setTimeout(() => window.router.navigate('/contracts/' + contractId), 1000);
                    return;
                }
            }

            // STEP 5: Execute
            if (btnText) btnText.textContent = 'Sealing contract...';
            if (statusLabel) statusLabel.textContent = 'EXECUTING';

            try {
                const execRes = await window.api.executeContract(contractId);
                if (!execRes?.ok) {
                    const code = execRes?.code;
                    if (code === 'FUNDS_NOT_LOCKED') {
                        if (btnText) btnText.textContent = 'Waiting for lock...';
                        const retryLock = await pollUntilState(contractId, ['FUNDS_LOCKED', 'LOCKED'], 60000);
                        if (retryLock.timeout) {
                            const e = new Error(`Funds still locking. State: ${retryLock.lastState}`);
                            e.code = 'FUNDS_NOT_LOCKED';
                            throw e;
                        }
                        const retry = await window.api.executeContract(contractId);
                        if (!retry?.ok) {
                            const e = new Error(retry?.error || 'Execute failed after retry');
                            e.code = retry?.code;
                            throw e;
                        }
                    } else {
                        const e = new Error(execRes?.error || 'Execution failed');
                        e.code = code;
                        throw e;
                    }
                }
            } catch (execErr) { throw execErr; }

            // STEP 6: Poll until LOCKED
            if (btnText) btnText.textContent = 'Finalizing...';
            if (statusLabel) statusLabel.textContent = 'FINALIZING';

            const finalRes = await pollUntilState(contractId, ['LOCKED'], 30000);
            if (finalRes.timeout) {
                throw new Error(`Contract not finalized. State: ${finalRes.lastState}`);
            }

            // SUCCESS
            releaseFlowLock();
            if (btnText) btnText.textContent = 'CONTRACT EXECUTED';
            if (statusLabel) statusLabel.textContent = 'COMPLETE';
            execBtn.style.background = '#065f46';

            // X Pixel — Create Contract conversion
            if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5u', {});

            setTimeout(() => window.router.navigate('/contracts/' + contractId), 1500);

        } catch (error) {
            console.error('[Exec] Error:', error);
            releaseFlowLock();
            holdComplete = false;
            if (btnText) btnText.textContent = 'EXECUTE CONTRACT';
            if (statusLabel) statusLabel.textContent = 'READY';
            execBtn.disabled = false;
            ackCb.checked = false;
            ackLabel?.classList.remove('checked');
            execBtn.disabled = true;

            showErrorModal(error.message, {
                code: error?.code || error?.data?.code,
                activeContractId: error?.activeContractId || error?.data?.activeContractId
            });
        }
    });

    // =========================================================
    // INIT SEQUENCE
    // =========================================================
    async function init() {
        // Auto-detect source: default to STRIPE if not set
        if (!selectedSource) {
            // Check if user has any connected source
            try {
                const status = await window.api.getConnectionStatus();
                if (status?.platforms) {
                    const stripe = status.platforms.find(p => p.platform === 'STRIPE');
                    const x = status.platforms.find(p => p.platform === 'X');

                    if (stripe?.verificationStatus === 'VERIFIED') {
                        selectedSource = 'STRIPE';
                        stripeVerified = true;
                        stripeAccountId = stripe.externalAccountId;
                        window.appState.connectedSources.stripe = true;
                    } else if (x?.verificationStatus === 'VERIFIED') {
                        selectedSource = 'TWITTER';
                        xVerified = true;
                        xUsername = x.metadata?.resolvedUsername;
                        window.appState.connectedSources.twitter = true;
                    } else {
                        // Default to Stripe as primary
                        selectedSource = 'STRIPE';
                    }
                } else {
                    selectedSource = 'STRIPE';
                }
            } catch {
                selectedSource = 'STRIPE';
            }
        } else {
            // Source was set from URL param — refresh status
            await refreshConnectionStatus();
        }

        hydrateFields();
        updateGateUI();

        // Show main content
        const loader = document.getElementById('ext-loader');
        const main = document.getElementById('ext-main');
        if (loader) loader.style.display = 'none';
        if (main) main.style.display = 'block';
    }

    init();

    // Expose wizard namespace for backwards compat (minimal)
    window.wizard = {
        selectRisk: () => { },
        selectSource: () => { },
        nextStep: () => { },
        setStep: () => { },
        startHold: () => { },
        endHold: () => { },
        completeHold: () => { },
        connectXOAuth: async () => {
            selectedSource = 'TWITTER';
            const btn = document.getElementById('ext-gate-btn');
            if (btn) btn.click();
        },
        startStripeConnect: async () => {
            selectedSource = 'STRIPE';
            const btn = document.getElementById('ext-gate-btn');
            if (btn) btn.click();
        }
    };
}
