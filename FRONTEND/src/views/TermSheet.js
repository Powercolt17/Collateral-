
import { openExecutionModal } from './ExecutionModal.js';
import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderTermSheet(params) {
    return `
        <style>
            /* ===== EXECUTION TERMINAL — INSTITUTIONAL DESIGN ===== */

            .ext {
                background: #FAF4E6;
                min-height: 100vh;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
            }

            /* Header strip */
            .ext-header {
                padding: 14px 32px;
                background: #F5EDDA;
                border-bottom: 1px solid rgba(70,55,35,.22);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .ext-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ext-back {
                padding: 6px 10px;
                font-size: 12px; color: #888;
                background: none; border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px; cursor: pointer;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                transition: all 0.15s;
            }
            .ext-back:hover { border-color: #bbb; color: #333; }
            .ext-header-id {
                font-size: 11px;
                font-family: var(--font-data);
                color: #999;
                letter-spacing: 0.5px;
            }
            .ext-header-status {
                display: inline-flex; align-items: center; gap: 6px;
                font-size: 11px; color: #065f46;
                font-family: var(--font-data);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .ext-header-dot {
                width: 6px; height: 6px;
                background: #065f46;
                border-radius: 50%;
                animation: ext-pulse 2s infinite;
            }
            @keyframes ext-pulse {
                0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; }
            }

            /* Page title */
            .ext-title-block {
                padding: 40px 0 0;
                max-width: 720px;
                margin: 0 auto;
            }
            .ext-page-title {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
                color: #0a0a0a;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0 0 6px;
                text-transform: uppercase;
            }
            .ext-page-sub {
                font-size: 13px;
                color: #666;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                line-height: 1.5;
            }

            /* Main container */
            .ext-container {
                max-width: 720px;
                margin: 0 auto;
                padding: 32px 24px 80px;
            }

            /* Capital Summary Card */
            .ext-card {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 16px;
            }
            .ext-card-header {
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
                font-family: var(--font-data);
                margin: 0;
            }
            .ext-card-body { padding: 24px; }

            /* Two-column grid */
            .ext-grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0;
            }
            .ext-grid-2 > div {
                padding: 16px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .ext-grid-2 > div:nth-child(odd) { padding-right: 24px; }
            .ext-grid-2 > div:nth-child(even) { padding-left: 24px; border-left: 1px solid #f0f0f0; }
            .ext-grid-2 > div:nth-last-child(-n+2) { border-bottom: none; }

            .ext-field-label {
                font-size: 11px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-family: var(--font-data);
                font-weight: 500;
                margin-bottom: 4px;
            }
            .ext-field-value {
                font-size: 18px;
                font-weight: 600;
                color: #111;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                letter-spacing: -0.3px;
            }
            .ext-field-value.accent { color: #065f46; }
            .ext-field-value.small {
                font-size: 14px;
                font-weight: 500;
            }

            /* Baseline Snapshot */
            .ext-baseline-note {
                font-size: 11px;
                color: #999;
                font-family: var(--font-data);
                padding: 12px 24px;
                border-top: 1px solid #f0f0f0;
                background: #FAF4E6;
            }

            /* Forfeiture Section */
            .ext-forfeit {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-left: 3px solid #752122;
                border-radius: 6px;
                padding: 20px 24px;
                margin-bottom: 16px;
            }
            .ext-forfeit-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #752122;
                font-family: var(--font-data);
                margin: 0 0 12px;
            }
            .ext-forfeit-text {
                font-size: 14px;
                color: #333;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
            }
            .ext-forfeit-amount {
                font-weight: 700;
                color: #752122;
            }

            /* Warning Block */
            .ext-warning {
                background: #FAF4E6;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                padding: 20px 24px;
                margin-bottom: 16px;
            }
            .ext-warning-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #555;
                font-family: var(--font-data);
                margin: 0 0 12px;
            }
            .ext-warning-list {
                list-style: none;
                padding: 0; margin: 0;
            }
            .ext-warning-list li {
                font-size: 13px;
                color: #444;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                padding: 6px 0;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ext-warning-list li:last-child { border-bottom: none; }
            .ext-warning-bullet {
                width: 4px; height: 4px;
                background: #999;
                border-radius: 50%;
                flex-shrink: 0;
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
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.5;
                user-select: none;
            }

            /* Execute Button — Dual-State */
            .ext-execute {
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
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                transition: all 150ms ease;
                position: relative;
                overflow: hidden;
                box-shadow: none;
            }
            .ext-execute:hover:not(:disabled) {
                border-color: #7f1d1d;
                color: #7f1d1d;
                transform: translateY(-1px);
            }
            .ext-execute:active:not(:disabled) {
                background: #7f1d1d;
                color: #ffffff;
                border-color: #7f1d1d;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                transform: translateY(0);
            }
            .ext-execute:focus-visible {
                outline: 2px solid rgba(127,29,29,0.4);
                outline-offset: 2px;
            }
            .ext-execute:disabled {
                background: #f5f5f5;
                color: #999;
                border-color: rgba(70,55,35,.22);
                cursor: not-allowed;
                box-shadow: none;
            }

            /* Footer micro */
            .ext-footer {
                text-align: center;
                padding: 20px 0 0;
            }
            .ext-footer-text {
                font-size: 11px;
                color: #bbb;
                font-family: var(--font-data);
                letter-spacing: 0.3px;
            }

            /* Loading */
            .ext-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 120px 0;
            }
            .ext-spinner {
                width: 28px; height: 28px;
                border: 2px solid rgba(70,55,35,.22);
                border-top-color: #752122;
                border-radius: 50%;
                animation: ext-spin 0.7s linear infinite;
            }
            @keyframes ext-spin {
                to { transform: rotate(360deg); }
            }

            /* Error */
            .ext-error {
                text-align: center;
                padding: 100px 20px;
            }
            .ext-error-title {
                font-size: 16px; font-weight: 600;
                color: #333; margin-bottom: 8px;
            }
            .ext-error-msg {
                font-size: 13px; color: #888; margin-bottom: 24px;
            }
            .ext-error-btn {
                padding: 10px 20px;
                font-size: 12px; font-weight: 600;
                color: #fff; background: #111;
                border: none; border-radius: 4px;
                cursor: pointer; text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            .ext-error-btn:hover { background: #333; }

            /* Provider connect gate */
            .ext-connect-gate {
                text-align: center;
                padding: 40px 24px;
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 6px;
                margin-bottom: 16px;
            }
            .ext-connect-icon {
                width: 48px; height: 48px;
                background: #f5f5f5;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
                font-size: 20px;
                color: #888;
            }
            .ext-connect-title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 6px;
            }
            .ext-connect-sub {
                font-size: 12px;
                color: #888;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            .ext-connect-btn {
                padding: 12px 24px;
                font-size: 12px; font-weight: 600;
                color: #fff; background: #111;
                border: none; border-radius: 6px;
                cursor: pointer; text-transform: uppercase;
                letter-spacing: 0.3px;
                transition: background 0.15s;
            }
            .ext-connect-btn:hover { background: #333; }

            /* Responsive */
            @media (max-width: 640px) {
                .ext-container { padding: 20px 16px 60px; }
                .ext-header { padding: 12px 16px; }
                .ext-grid-2 { grid-template-columns: 1fr; }
                .ext-grid-2 > div:nth-child(even) { padding-left: 0; border-left: none; }
                .ext-grid-2 > div:nth-child(odd) { padding-right: 0; }
                .ext-title-block { padding: 24px 16px 0; }
            }
        </style>

        <div class="ext">
            <!-- Header Strip -->
            <div class="ext-header">
                <div class="ext-header-left">
                    <button class="ext-back" id="ext-back">← Market</button>
                    <span class="ext-header-id" id="ext-contract-id"></span>
                </div>
                <div class="ext-header-status">
                    <span class="ext-header-dot"></span>
                    READY
                </div>
            </div>

            <!-- Loading -->
            <div id="ext-loading">
                ${collateralFullLoader('Loading term sheet...')}
            </div>

            <!-- Error -->
            <div id="ext-error" style="display: none;">
                <div class="ext-error">
                    <div class="ext-error-title">Contract Unavailable</div>
                    <div class="ext-error-msg" id="ext-error-msg">The requested contract could not be retrieved.</div>
                    <button class="ext-error-btn" id="ext-error-back">Return to Market</button>
                </div>
            </div>

            <!-- Main Content -->
            <div id="ext-content" style="display: none;">
                <div class="ext-title-block">
                    <h1 class="ext-page-title">CONTRACT EXECUTION</h1>
                    <p class="ext-page-sub">You are committing capital under fixed performance terms.</p>
                </div>

                <div class="ext-container">
                    <!-- Capital Summary -->
                    <div class="ext-card">
                        <div class="ext-card-header">
                            <h3 class="ext-card-title">Capital Summary</h3>
                        </div>
                        <div class="ext-card-body">
                            <div class="ext-grid-2">
                                <div>
                                    <div class="ext-field-label">Capital to Lock</div>
                                    <div class="ext-field-value" id="ext-capital">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Maximum Payout</div>
                                    <div class="ext-field-value accent" id="ext-payout">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Tier</div>
                                    <div class="ext-field-value small" id="ext-tier">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Expected Pass Rate</div>
                                    <div class="ext-field-value small" id="ext-pass-rate">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Verification Source</div>
                                    <div class="ext-field-value small" id="ext-source">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Contract Window</div>
                                    <div class="ext-field-value small" id="ext-window">—</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Baseline Snapshot -->
                    <div class="ext-card">
                        <div class="ext-card-header">
                            <h3 class="ext-card-title">Baseline Snapshot</h3>
                        </div>
                        <div class="ext-card-body">
                            <div class="ext-grid-2">
                                <div>
                                    <div class="ext-field-label">Snapshot ID</div>
                                    <div class="ext-field-value small" id="ext-snap-id" style="font-family: var(--font-data); font-size: 12px; color: #888;">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Measured Period</div>
                                    <div class="ext-field-value small" id="ext-snap-period">Last 30 Days</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Baseline Value</div>
                                    <div class="ext-field-value" id="ext-snap-value">—</div>
                                </div>
                                <div>
                                    <div class="ext-field-label">Target Delta</div>
                                    <div class="ext-field-value accent" id="ext-snap-delta">—</div>
                                </div>
                            </div>
                        </div>
                        <div class="ext-baseline-note">
                            Baseline snapshot is immutable after execution.
                        </div>
                    </div>

                    <!-- Forfeiture Terms -->
                    <div class="ext-forfeit" id="ext-forfeit">
                        <h3 class="ext-forfeit-title">Capital Forfeiture Terms</h3>
                        <p class="ext-forfeit-text" id="ext-forfeit-text">
                            If performance target is not met:<br>
                            → <span class="ext-forfeit-amount" id="ext-forfeit-amount">100% capital is forfeited.</span>
                        </p>
                    </div>

                    <!-- Irreversibility Warning -->
                    <div class="ext-warning">
                        <h3 class="ext-warning-title">Execution Terms</h3>
                        <ul class="ext-warning-list">
                            <li><span class="ext-warning-bullet"></span> Execution is irreversible.</li>
                            <li><span class="ext-warning-bullet"></span> Capital is locked immediately upon confirmation.</li>
                            <li><span class="ext-warning-bullet"></span> Settlement is enforced via deterministic provider verification.</li>
                            <li><span class="ext-warning-bullet"></span> No overrides on the outcome. No appeals.</li>
                        </ul>
                    </div>

                    <!-- Provider Gate (shown when not connected) -->
                    <div class="ext-connect-gate" id="ext-connect-gate" style="display: none;">
                        <div class="ext-connect-icon">⚡</div>
                        <div class="ext-connect-title" id="ext-connect-title">Connect Provider</div>
                        <div class="ext-connect-sub" id="ext-connect-sub">
                            You must connect your verification source before executing this contract.
                        </div>
                        <button class="ext-connect-btn" id="ext-connect-btn">Connect Provider</button>
                    </div>

                    <!-- Acknowledgement + Execute (shown when connected) -->
                    <div id="ext-execute-section" style="display: none;">
                        <!-- Acknowledgement Checkbox -->
                        <label class="ext-ack" id="ext-ack-label">
                            <input type="checkbox" id="ext-ack-check">
                            <span class="ext-ack-text">
                                I understand that failure to meet the performance target results in full capital forfeiture. This action is irreversible.
                            </span>
                        </label>

                        <!-- Execute Button -->
                        <button class="ext-execute" id="ext-execute-btn" disabled>
                            EXECUTE CONTRACT
                        </button>
                    </div>

                    <!-- Ledger Footer -->
                    <div class="ext-footer">
                        <span class="ext-footer-text">Settlement event will be recorded in the Global Ledger.</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initTermSheet(params) {
    const templateId = params?.id;
    if (!templateId) {
        showError('No contract template ID provided.');
        return;
    }

    const loadingEl = document.getElementById('ext-loading');
    const contentEl = document.getElementById('ext-content');
    const errorEl = document.getElementById('ext-error');

    // Back button
    document.getElementById('ext-back')?.addEventListener('click', () => {
        window.router.navigate('/market');
    });
    document.getElementById('ext-error-back')?.addEventListener('click', () => {
        window.router.navigate('/market');
    });

    try {
        let template = null;
        try {
            template = await window.api.getMarketContract(templateId);
        } catch (e) {
            console.error('Failed to fetch contract:', e);
            throw new Error('Contract not found.');
        }

        if (!template) throw new Error('Contract not found.');

        hydrateExecution(template);

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

        // TikTok funnel — ViewContent
        if (typeof ttq !== 'undefined') ttq.track('ViewContent', { content_id: templateId, content_name: template.title || 'Contract' });

    } catch (err) {
        console.error('[Execution] Error:', err);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        const msg = document.getElementById('ext-error-msg');
        if (msg) msg.textContent = err.message || 'Could not load contract.';
    }
}

function hydrateExecution(template) {
    const platform = template.provider || template.platform || 'Stripe';
    const riskTier = template.riskTier || 'controlled';
    const windowDays = template.windowDays || template.durationDays || 30;
    const multiplier = template.multiplier || 1.5;
    const minStake = (template.minStakeCents || 2500) / 100;
    const maxStake = (template.maxStakeCents || 250000) / 100;
    const stake = (template.defaultStakeCents || template.minStakeCents || 2500) / 100;
    const payout = Math.round(stake * multiplier * 100) / 100;
    const targetDelta = template.targetDelta || template.targetHint || '+15%';

    // Header
    const idEl = document.getElementById('ext-contract-id');
    if (idEl) idEl.textContent = 'TMPL-' + (template.id || '').substring(0, 6).toUpperCase();

    // Capital Summary
    setText('ext-capital', '$' + stake.toLocaleString());
    setText('ext-payout', '$' + payout.toLocaleString());
    setText('ext-tier', formatTierName(riskTier));
    setText('ext-pass-rate', getPassRate(riskTier));
    setText('ext-source', platform);
    setText('ext-window', `${windowDays} Days`);

    // Baseline Snapshot
    const snapTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setText('ext-snap-id', snapTime + '-' + (template.id || '').slice(0, 8));
    setText('ext-snap-period', 'Last 30 Days');
    setText('ext-snap-value', '$—');  // Would come from baseline API
    setText('ext-snap-delta', targetDelta);

    // Forfeiture
    const forfeitEl = document.getElementById('ext-forfeit-amount');
    if (forfeitEl) {
        if (riskTier.toLowerCase().includes('max') || riskTier.toLowerCase() === 'tier iii') {
            forfeitEl.textContent = 'Total capital forfeiture.';
        } else {
            forfeitEl.textContent = `100% of locked capital ($${stake.toLocaleString()}) is forfeited.`;
        }
    }

    // Provider gate
    const isConnected = checkProviderConnection(platform);
    const connectGate = document.getElementById('ext-connect-gate');
    const executeSection = document.getElementById('ext-execute-section');

    if (!isConnected) {
        if (connectGate) {
            connectGate.style.display = 'block';
            setText('ext-connect-title', `Connect ${platform}`);
            setText('ext-connect-sub', `You must connect your ${platform} account to verify eligibility and execute this contract.`);
        }
        if (executeSection) executeSection.style.display = 'none';

        document.getElementById('ext-connect-btn')?.addEventListener('click', () => {
            const source = platform.toLowerCase();
            if (window.app && window.app.connectSource) {
                window.app.connectSource(source);
            }
        });
    } else {
        if (connectGate) connectGate.style.display = 'none';
        if (executeSection) executeSection.style.display = 'block';
    }

    // Acknowledgement checkbox
    const ackCheck = document.getElementById('ext-ack-check');
    const ackLabel = document.getElementById('ext-ack-label');
    const executeBtn = document.getElementById('ext-execute-btn');

    if (ackCheck && executeBtn) {
        ackCheck.addEventListener('change', () => {
            executeBtn.disabled = !ackCheck.checked;
            if (ackLabel) {
                ackLabel.classList.toggle('checked', ackCheck.checked);
            }
        });
    }

    // Execute button → opens ExecutionModal
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            if (!ackCheck?.checked) return;

            openExecutionModal({
                id: template.id || template.templateId,
                title: template.title || 'Performance Contract',
                goal: template.title || 'Performance Contract',
                tier: riskTier.toLowerCase(),
                provider: platform.toLowerCase(),
                platform: platform.toLowerCase(),
                min_stake: stake,
                max_stake: stake,
                multiplier: multiplier,
                fee_bps: 250,
                window_days: windowDays,
                target_hint: targetDelta,
                deadline: template.deadline || new Date(Date.now() + windowDays * 86400000).toISOString()
            });
        });
    }
}

// ===== Helpers =====

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatTierName(tier) {
    const t = (tier || '').toLowerCase();
    if (t.includes('max') || t === 'tier iii' || t === 'elite' || t === 'all-in' || t === 'all_in') return 'ALL-IN';
    if (t.includes('elev') || t === 'tier ii' || t === 'advanced' || t === 'stake') return 'STAKE';
    return 'PLEDGE';
}

function getPassRate(tier) {
    const t = (tier || '').toLowerCase();
    if (t.includes('max') || t === 'tier iii' || t === 'elite' || t === 'all-in' || t === 'all_in') return '~10%';
    if (t.includes('elev') || t === 'tier ii' || t === 'advanced' || t === 'stake') return '~20%';
    return '~30%';
}

function checkProviderConnection(platform) {
    if (!window.appState || !window.appState.connectedSources) return false;
    const key = (platform || '').toLowerCase();
    if (key === 'x' || key === 'twitter') return window.appState.connectedSources.twitter;
    if (key === 'stripe' || key === 'sales') return window.appState.connectedSources.stripe;
    if (key === 'shopify') return window.appState.connectedSources.shopify;
    if (key === 'amazon') return window.appState.connectedSources.amazon;
    return false;
}

function showError(msg) {
    const loading = document.getElementById('ext-loading');
    const error = document.getElementById('ext-error');
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
    const msgEl = document.getElementById('ext-error-msg');
    if (msgEl) msgEl.textContent = msg;
}
