// ContractTermSheet.js — Institutional Contract Term Sheet
// Mechanical specification page. Not marketing.

import { getMarketListings, hasAuthToken, getReferralStats } from '../api.js';
import { openExecutionModal } from './ExecutionModal.js';

export function renderContractTermSheet(params) {
    return `
        <style>
            .cts { max-width: 1120px; margin: 0 auto; padding: 32px 24px 80px; font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; }

            /* Breadcrumb */
            .cts-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 28px; }
            .cts-breadcrumb a, .cts-breadcrumb span {
                font-size: 10px; font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;
                text-decoration: none; transition: color 150ms;
            }
            .cts-breadcrumb a:hover { color: #111; }
            .cts-breadcrumb .cts-bc-sep { font-size: 9px; color: #d4d4d4; }
            .cts-breadcrumb .cts-bc-current { color: #374151; font-weight: 600; }

            /* Two-Column Layout */
            .cts-layout { display: grid; grid-template-columns: 1fr 340px; gap: 40px; align-items: start; }
            @media (max-width: 860px) { .cts-layout { grid-template-columns: 1fr; } }

            /* Left Column */
            .cts-main { min-width: 0; }

            /* Header */
            .cts-hdr { margin-bottom: 24px; }
            .cts-hdr-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
            .cts-title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #0a0a0a; line-height: 1.2; }
            .cts-id { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #9ca3af; letter-spacing: 0.06em; padding: 4px 8px; border: 1px solid #e5e5e5; background: #fafafa; flex-shrink: 0; }
            .cts-meta-row { display: flex; align-items: center; gap: 16px; }
            .cts-provider { font-size: 12px; font-weight: 600; color: #374151; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.04em; }
            .cts-status { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 2px 8px; }
            .cts-objective { font-size: 14px; color: #6b7280; line-height: 1.5; margin-top: 10px; }

            /* Divider */
            .cts-div { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }

            /* Section Header */
            .cts-sh { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; }

            /* Summary Terms Grid */
            .cts-terms-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #d4d4d4; overflow: hidden; margin-bottom: 24px; }
            .cts-term-cell { padding: 16px 14px; border-right: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; background: #fafafa; }
            .cts-term-cell:nth-child(4n) { border-right: none; }
            .cts-term-cell:nth-last-child(-n+4) { border-bottom: none; }
            .cts-term-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-family: 'JetBrains Mono', monospace; font-weight: 600; margin-bottom: 6px; }
            .cts-term-val { font-size: 15px; font-weight: 600; color: #111; letter-spacing: -0.01em; }

            /* Subsection Blocks */
            .cts-block { margin-bottom: 20px; }
            .cts-block-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
            .cts-block-text { font-size: 13px; color: #6b7280; line-height: 1.6; }

            /* Right Panel (Sticky) */
            .cts-panel { position: sticky; top: 24px; background: #fff; border: 1px solid #d4d4d4; border-top: 2px solid #752122; overflow: hidden; }
            .cts-panel-hdr { padding: 16px 20px; background: #fafafa; border-bottom: 1px solid #e5e5e5; }
            .cts-panel-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #374151; font-family: 'JetBrains Mono', monospace; }
            .cts-panel-body { padding: 20px; }
            .cts-panel-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
            .cts-panel-row:last-of-type { border-bottom: none; }
            .cts-panel-lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
            .cts-panel-val { font-size: 14px; font-weight: 600; color: #111; }
            .cts-panel-val.capital { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #0a0a0a; }
            .cts-panel-val.success { color: #166534; }
            .cts-panel-val.failure { color: #752122; opacity: 0.85; }

            .cts-panel-div { border: none; border-top: 1px solid #e5e5e5; margin: 12px 0; }

            .cts-panel-escrow { font-size: 10px; color: #9ca3af; text-align: center; font-family: 'JetBrains Mono', monospace; margin: 12px 0 16px; }

            .cts-lock-btn {
                width: 100%; height: 48px; border: none;
                background: #752122; color: #fff;
                font-size: 12px; font-weight: 600;
                text-transform: uppercase; letter-spacing: 0.06em;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                cursor: pointer;
                transition: background 180ms ease, transform 100ms ease, box-shadow 180ms ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .cts-lock-btn:hover {
                background: #5a191a;
                box-shadow: 0 4px 12px rgba(117,33,34,0.2);
            }
            .cts-lock-btn:active { transform: translateY(1px); }

            /* Tier selector */
            .cts-tier-group { display: flex; gap: 6px; margin-bottom: 16px; }
            .cts-tier-opt {
                flex: 1; padding: 10px 6px; text-align: center;
                border: 1px solid #e5e5e5; background: #fafafa;
                font-size: 12px; font-weight: 600; color: #374151;
                font-family: 'JetBrains Mono', monospace;
                cursor: pointer; transition: all 150ms;
            }
            .cts-tier-opt:hover { border-color: #d4d4d4; background: #f5f5f5; }
            .cts-tier-opt.active { border-color: #374151; background: #fff; color: #0a0a0a; box-shadow: 0 0 0 1px #374151; }

            /* Live Metric Preview */
            .cts-perf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #d4d4d4; overflow: hidden; margin-bottom: 12px; }
            .cts-perf-item { padding: 16px 14px; border-right: 1px solid #e5e5e5; background: #fafafa; }
            .cts-perf-item:last-child { border-right: none; }
            .cts-perf-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-family: 'JetBrains Mono', monospace; font-weight: 600; margin-bottom: 6px; }
            .cts-perf-val { font-size: 15px; font-weight: 600; color: #111; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
            .cts-oracle-note { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; margin-bottom: 24px; padding-left: 2px; }
            .cts-oracle-note svg { width: 14px; height: 14px; }
            .cts-pulse { animation: cts-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes cts-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

            /* Loading */
            .cts-loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
            .cts-spinner { width: 20px; height: 20px; border: 2px solid #e5e5e5; border-top-color: #374151; border-radius: 50%; animation: cts-spin 0.7s linear infinite; }
            @keyframes cts-spin { to { transform: rotate(360deg); } }

            .cts-error { text-align: center; padding: 60px 20px; color: #6b7280; font-size: 14px; }
            .cts-error-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }

            /* Two-col subsection grid */
            .cts-subsections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; }
            @media (max-width: 640px) { .cts-subsections { grid-template-columns: 1fr; } }

            /* Ineligibility Banner */
            .cts-ineligible-banner {
                display: none;
                padding: 16px 20px;
                background: #fef2f2;
                border: 1px solid #fecaca;
                margin-bottom: 20px;
            }
            .cts-ineligible-banner.visible { display: block; }
            .cts-ineligible-hdr {
                display: flex; align-items: center; gap: 8px;
                font-size: 11px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.06em; color: #991b1b;
                font-family: 'JetBrains Mono', monospace; margin-bottom: 8px;
            }
            .cts-ineligible-hdr svg { width: 16px; height: 16px; flex-shrink: 0; }
            .cts-ineligible-text {
                font-size: 13px; color: #7f1d1d; line-height: 1.5;
            }
            .cts-ineligible-cta {
                display: inline-flex; align-items: center; gap: 6px;
                margin-top: 12px; padding: 8px 16px;
                font-size: 11px; font-weight: 600; text-transform: uppercase;
                letter-spacing: 0.06em; color: #752122;
                background: #fff; border: 1px solid #fecaca;
                cursor: pointer; font-family: 'JetBrains Mono', monospace;
                transition: all 150ms;
            }
            .cts-ineligible-cta:hover { background: #fef2f2; border-color: #991b1b; }

            .cts-lock-btn:disabled {
                background: #d4d4d4; color: #9ca3af;
                cursor: not-allowed; box-shadow: none;
            }
            .cts-lock-btn:disabled:hover { background: #d4d4d4; box-shadow: none; }
        </style>

        <div class="cts">
            <div class="cts-breadcrumb">
                <a href="#/overview">Market</a>
                <span class="cts-bc-sep">›</span>
                <span class="cts-bc-current">Term Sheet</span>
            </div>

            <div id="cts-loading" class="cts-loading">
                <div class="cts-spinner"></div>
            </div>

            <div id="cts-error" class="cts-error" style="display:none;">
                <div class="cts-error-title">Contract Not Found</div>
                <p>This contract does not exist or has expired.</p>
            </div>

            <div id="cts-content" style="display:none;">
                <div class="cts-layout">
                    <!-- Left: Term Sheet -->
                    <div class="cts-main" id="cts-main"></div>

                    <!-- Right: Sticky Execution Panel -->
                    <div id="cts-panel"></div>
                </div>
            </div>
        </div>
    `;
}

export async function initContractTermSheet(params) {
    const contractId = params?.id;
    if (!contractId) {
        showError();
        return;
    }

    try {
        const data = await getMarketListings();
        const listings = data?.listings || data?.items || data?.contracts || [];
        const contract = listings.find(c => c.id === contractId);

        if (!contract) {
            showError();
            return;
        }

        showContent(contract);

    } catch (err) {
        console.error('[TermSheet] Failed to load:', err);
        showError();
    }
}

function showError() {
    const loading = document.getElementById('cts-loading');
    const error = document.getElementById('cts-error');
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
}

function showContent(c) {
    const loading = document.getElementById('cts-loading');
    const content = document.getElementById('cts-content');
    const main = document.getElementById('cts-main');
    const panel = document.getElementById('cts-panel');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';

    // Data extraction
    const id = c.id || '';
    const shortId = id.split('-')[0].slice(0, 4).toUpperCase();
    const title = c.title || 'Performance Contract';
    const provider = (c.provider || c.platform || c.source || 'stripe').toString().toLowerCase();
    const providerLabelMap = {
        'youtube': 'YouTube', 'x': 'X (Twitter)', 'twitter': 'X (Twitter)',
        'stripe': 'Stripe', 'shopify': 'Shopify', 'github': 'GitHub', 'amazon': 'Amazon',
    };
    const displayProvider = providerLabelMap[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
    const tier = (c.tier || 'controlled').toLowerCase();
    const tierUpper = tier.toUpperCase();
    const minStake = c.min_stake || 100;
    const maxStake = c.max_stake || 1500;
    const feeBps = c.fee_bps || 250;
    const feePercent = (feeBps / 100).toFixed(1);
    const windowDays = c.window_days || 30;
    const multiplier = tierUpper === 'MAXIMUM' ? 4.0 : tierUpper === 'ELEVATED' ? 2.5 : 1.75;
    const winRate = tierUpper === 'CONTROLLED' || tierUpper === 'PLEDGE' ? '~30%' : tierUpper === 'ELEVATED' || tierUpper === 'STAKE' ? '~20%' : '~10%';
    const targetHint = c.target_hint || c.display_target_hint || '+15%';
    const stakeRange = (minStake === maxStake) ? `$${minStake.toLocaleString()}` : `$${minStake.toLocaleString()} – $${maxStake.toLocaleString()}`;
    const domain = (c.domain || 'commerce').charAt(0).toUpperCase() + (c.domain || 'commerce').slice(1);

    // === LEFT COLUMN ===
    main.innerHTML = `
        <!-- Header -->
        <div class="cts-hdr">
            <div class="cts-hdr-top">
                <div class="cts-title">${title}</div>
                <div class="cts-id">RCP-${shortId}</div>
            </div>
            <div class="cts-meta-row">
                <span class="cts-provider">${displayProvider}</span>
                <span class="cts-status">Active</span>
            </div>
            <div class="cts-objective">
                Performance contract targeting ${targetHint} ${domain.toLowerCase()} growth within a ${windowDays}-day measurement window.
            </div>
        </div>

        <hr class="cts-div">

        <!-- Section: Live Preview -->
        <div class="cts-sh">Live Connected Metric</div>
        <div class="cts-perf-grid" id="cts-live-metric-box">
            <div class="cts-perf-item">
                <div class="cts-perf-lbl">Your Live Baseline</div>
                <div class="cts-perf-val" id="cts-live-baseline"><i data-lucide="loader-2" class="cts-pulse"></i></div>
            </div>
            <div class="cts-perf-item" style="background: #fffbea;">
                <div class="cts-perf-lbl" style="color:#d97706;">Absolute Target Requirement</div>
                <div class="cts-perf-val" id="cts-live-target" style="color:#b45309;"><i data-lucide="loader-2" class="cts-pulse"></i></div>
            </div>
        </div>
        <div class="cts-ineligible-banner" id="cts-ineligible-banner">
            <div class="cts-ineligible-hdr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Minimum Requirements Not Met
            </div>
            <div class="cts-ineligible-text" id="cts-ineligible-text"></div>
            <button class="cts-ineligible-cta" onclick="window.router.navigate('/sources')">Go to Sources →</button>
        </div>
        <div class="cts-oracle-note" id="cts-oracle-note">
            <i data-lucide="activity"></i> Fetching live oracle data...
        </div>

        <hr class="cts-div">

        <!-- Section: Summary Terms -->
        <div class="cts-sh">Summary Terms</div>
        <div class="cts-terms-grid">
            <div class="cts-term-cell">
                <div class="cts-term-lbl">Duration</div>
                <div class="cts-term-val">${windowDays} Days</div>
            </div>
            <div class="cts-term-cell">
                <div class="cts-term-lbl">Target Requirement</div>
                <div class="cts-term-val">${targetHint}</div>
            </div>
            <div class="cts-term-cell">
                <div class="cts-term-lbl">Stake Range</div>
                <div class="cts-term-val">${stakeRange}</div>
            </div>
            <div class="cts-term-cell">
                <div class="cts-term-lbl">Settlement</div>
                <div class="cts-term-val">Binary</div>
            </div>
        </div>

        <hr class="cts-div">

        <!-- Section: Verification & Settlement -->
        <div class="cts-sh">Verification & Settlement</div>
        <div class="cts-subsections">
            <div class="cts-block">
                <div class="cts-block-title">Source of Truth</div>
                <div class="cts-block-text">Data retrieved directly from connected ${displayProvider} account.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Baseline Snapshot</div>
                <div class="cts-block-text">Baseline captured at execution timestamp.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Measurement Window</div>
                <div class="cts-block-text">Begins immediately upon execution confirmation.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Settlement Logic</div>
                <div class="cts-block-text">Settled automatically at window close. Funds released after review, typically within one business day.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Fail-Closed Policy</div>
                <div class="cts-block-text">If provider API cannot verify, contract fails.</div>
            </div>
        </div>

        <hr class="cts-div">

        <!-- Section: Economic Structure -->
        <div class="cts-sh">Economic Structure</div>
        <div class="cts-subsections">
            <div class="cts-block">
                <div class="cts-block-title">Platform Fee</div>
                <div class="cts-block-text">${feePercent}% of payout.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Payout Structure</div>
                <div class="cts-block-text">Fixed ${multiplier}× multiplier on locked capital.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Implied Win Rate</div>
                <div class="cts-block-text">${winRate} — tier dependent.</div>
            </div>
        </div>

        <hr class="cts-div">

        <!-- Section: Risk & Edge Cases -->
        <div class="cts-sh">Risk & Edge Cases</div>
        <div class="cts-subsections">
            <div class="cts-block">
                <div class="cts-block-title">Refund Handling</div>
                <div class="cts-block-text">Refunded transactions excluded from metric calculation.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Anti-Gaming Controls</div>
                <div class="cts-block-text">Minimum baseline floor. Objective provider filters. No manual overrides.</div>
            </div>
            <div class="cts-block">
                <div class="cts-block-title">Dispute Policy</div>
        <div class="cts-block-text">Deterministic provider data only. No appeals.</div>
            </div>
        </div>
    `;

    // === RIGHT COLUMN — Sticky Execution Panel ===
    let currentStake = minStake;
    let currentPayout = Math.round(currentStake * multiplier);
    let selectedMethod = 'USD_CARD';
    let referralBonusPct = 0;
    let isBlocked = false;

    // Build tier options from stake range
    const tierSteps = buildTierSteps(minStake, maxStake);

    const fmtStake = (v) => {
        if (selectedMethod === 'CRYPTO') {
            return v >= 1000 ? (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }).replace(/\.0$/, '') + 'K CLTR' : v.toLocaleString() + ' CLTR';
        }
        return v >= 1000 ? '$' + (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }).replace(/\.0$/, '') + 'K' : '$' + v.toLocaleString();
    };

    const fmtDollar = (v) => {
        if (selectedMethod === 'CRYPTO') {
            return v.toLocaleString() + ' CLTR';
        }
        return '$' + v.toLocaleString();
    };

    const renderPanel = () => {
        const basePayout = Math.round(currentStake * multiplier);
        const bonusAmt = referralBonusPct > 0 ? Math.round(basePayout * referralBonusPct / 100) : 0;
        currentPayout = basePayout + bonusAmt;

        panel.innerHTML = `
            <div class="cts-panel">
                <div class="cts-panel-hdr">
                    <div class="cts-panel-title">Execute Contract</div>
                </div>
                <div class="cts-panel-body">
                    <!-- Lock Method Selector Toggle -->
                    <div style="display: flex; gap: 8px; margin-bottom: 20px; background: #f3f4f6; padding: 4px; border-radius: 6px;">
                        <button class="cts-method-btn" id="cts-method-usd" style="flex: 1; padding: 8px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; background: ${selectedMethod === 'USD_CARD' ? '#fff' : 'transparent'}; color: ${selectedMethod === 'USD_CARD' ? '#111' : '#666'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: ${selectedMethod === 'USD_CARD' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'}; transition: all 0.15s; font-family: inherit;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            <span>USD Card (Stripe)</span>
                        </button>
                        <button class="cts-method-btn" id="cts-method-cltr" style="flex: 1; padding: 8px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; background: ${selectedMethod === 'CRYPTO' ? '#fff' : 'transparent'}; color: ${selectedMethod === 'CRYPTO' ? '#111' : '#666'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: ${selectedMethod === 'CRYPTO' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'}; transition: all 0.15s; font-family: inherit;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M17 12H7"/></svg>
                            <span>CLTR Staking (Web3)</span>
                        </button>
                    </div>

                    <div class="cts-panel-row">
                        <span class="cts-panel-lbl">Selected Tier</span>
                        <span class="cts-panel-val" id="cts-tier-label">${tierUpper}</span>
                    </div>

                    <div class="cts-tier-group" id="cts-tier-group">
                        ${tierSteps.map((s) => `<div class="cts-tier-opt${s === currentStake ? ' active' : ''}" data-stake="${s}">${fmtStake(s)}</div>`).join('')}
                    </div>

                    <div class="cts-panel-row">
                        <span class="cts-panel-lbl">Capital Locked</span>
                        <span class="cts-panel-val capital" id="cts-stake-val">${fmtDollar(currentStake)}</span>
                    </div>
                    <div class="cts-panel-row">
                        <span class="cts-panel-lbl">If Successful</span>
                        <span class="cts-panel-val success" id="cts-payout-val">+${fmtDollar(currentPayout)}</span>
                    </div>
                    <div id="cts-bonus-row" style="${referralBonusPct > 0 ? 'display:block;' : 'display:none;'}">
                        <div class="cts-panel-row" style="background:#f0fdf4;border:1px solid #bbf7d0;padding:4px 12px;margin:2px 0;">
                            <span class="cts-panel-lbl" style="color:#15803d;font-weight:600;font-size:9px;">🎁 Referral Bonus (+${referralBonusPct}%)</span>
                            <span class="cts-panel-val success" style="font-size:12px;">+${fmtDollar(bonusAmt)}</span>
                        </div>
                    </div>
                    <div class="cts-panel-row">
                        <span class="cts-panel-lbl">If Failed</span>
                        <span class="cts-panel-val failure" id="cts-loss-val">-${fmtDollar(currentStake)}</span>
                    </div>

                    <hr class="cts-panel-div">

                    <div class="cts-panel-escrow">${selectedMethod === 'CRYPTO' ? 'CLTR is locked on-chain in the Commitment Staking contract until settlement.' : 'Capital is held in escrow until settlement.'}</div>

                    <button class="cts-lock-btn" id="cts-lock-btn" ${isBlocked ? 'disabled' : ''}>
                        ${isBlocked ? 'INELIGIBLE — REQUIREMENTS NOT MET' : `${selectedMethod === 'CRYPTO' ? 'STAKE' : 'LOCK'} ${fmtDollar(currentStake)} ${selectedMethod === 'CRYPTO' ? 'via WEB3' : 'CAPITAL'} →`}
                    </button>
                </div>
            </div>
        `;

        // Wire events inside panel
        const tierGroup = document.getElementById('cts-tier-group');
        if (tierGroup) {
            tierGroup.addEventListener('click', (e) => {
                const opt = e.target.closest('.cts-tier-opt');
                if (!opt) return;
                currentStake = parseInt(opt.dataset.stake);
                renderPanel();
            });
        }

        document.getElementById('cts-method-usd').addEventListener('click', () => {
            if (selectedMethod === 'USD_CARD') return;
            selectedMethod = 'USD_CARD';
            renderPanel();
        });
        document.getElementById('cts-method-cltr').addEventListener('click', () => {
            if (selectedMethod === 'CRYPTO') return;
            selectedMethod = 'CRYPTO';
            renderPanel();
        });

        // Wire lock button → opens ExecutionModal directly!
        document.getElementById('cts-lock-btn')?.addEventListener('click', () => {
            if (isBlocked) return;
            openExecutionModal({
                id,
                title,
                goal: title,
                tier,
                provider,
                platform: provider,
                min_stake: currentStake,
                max_stake: currentStake,
                multiplier,
                fee_bps: feeBps,
                window_days: windowDays,
                target_hint: targetHint,
                deadline: c.deadline || new Date(Date.now() + windowDays * 86400000).toISOString()
            });
        });
    };

    renderPanel();

    // Fetch referral bonus asynchronously
    if (hasAuthToken()) {
        console.log('[TermSheet] Fetching referral stats...');
        getReferralStats().then(stats => {
            console.log('[TermSheet] Referral stats:', stats);
            if (stats && stats.firstBonusAvailable && stats.firstBonusPct > 0) {
                referralBonusPct = stats.firstBonusPct;
                renderPanel();
            }
        }).catch(err => { console.error('[TermSheet] Referral stats fetch failed:', err); });
    } else {
        console.log('[TermSheet] No auth token, skipping referral bonus check');
    }

    // Fetch Live Preview asynchronously
    const fetchLivePreview = (tierOverride) => {
        if (!hasAuthToken()) {
            document.getElementById('cts-live-baseline').innerHTML = '<span style="color:#888;font-size:12px;">Sign in required</span>';
            document.getElementById('cts-live-target').innerHTML = '--';
            document.getElementById('cts-oracle-note').innerHTML = `<i data-lucide="lock"></i> Sign in to view your live connected baseline.`;
            return;
        }
        const metricName = c.metric_key || c.metricKey || '';
        const effectiveTier = tierOverride || tier;
        
        window.api.getProviderPreview(provider, metricName, effectiveTier)
            .then(data => {
                const bEl = document.getElementById('cts-live-baseline');
                const tEl = document.getElementById('cts-live-target');
                const nEl = document.getElementById('cts-oracle-note');
                
                if (data.status === 'error') {
                     const isNotConnected = data.code === 'NOT_CONNECTED' || data.code === 'AUTH_REQUIRED';
                     const isReconnect = data.code === 'RECONNECT_REQUIRED';
                     const label = isNotConnected ? 'Not Connected' : isReconnect ? 'Reconnect Required' : 'Unavailable';
                     bEl.innerHTML = `<span style="color:#ef4444;font-size:12px;">${label}</span>`;
                     tEl.innerHTML = '--';
                     const errMsg = data.error || `Connect your ${displayProvider} account in Sources to see live data.`;
                     nEl.innerHTML = `<i data-lucide="alert-circle" style="color:#ef4444;"></i> <span style="color:#ef4444;">${errMsg}</span>`;
                } else {
                     const baseNum = data.current_baseline || 0;
                     let isMonetary = provider === 'stripe' || provider === 'shopify' || provider === 'amazon';
                     let absTarget = baseNum;
                     
                     const hintStr = targetHint.toString();
                     if (hintStr.includes('%')) {
                         const match = hintStr.match(/(\d+)%/);
                         if (match) {
                             const pct = parseFloat(match[1]);
                             absTarget = Math.round(baseNum * (1 + (pct / 100)));
                         }
                     } else if (hintStr.includes('$')) {
                         const match = hintStr.match(/\$([\d,]+)/);
                         if (match) {
                             const valCents = parseInt(match[1].replace(/,/g, '')) * 100;
                             absTarget = baseNum + valCents;
                         }
                     } else {
                         const match = hintStr.match(/\+?([\d,]+)/);
                         if (match) {
                             const val = parseInt(match[1].replace(/,/g, ''));
                             absTarget = baseNum + val;
                         }
                     }

                     const formatVal = (v) => isMonetary ? '$' + (v/100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.00', '') : Math.round(v).toLocaleString('en-US');

                     bEl.innerHTML = formatVal(baseNum);
                     tEl.innerHTML = formatVal(absTarget);

                     // Check for warning (e.g., baseline too low)
                     if (data.warning === 'BASELINE_TOO_LOW') {
                         bEl.innerHTML = `<span style="color:#dc2626;font-weight:700;">${formatVal(baseNum)}</span>`;
                         tEl.innerHTML = `<span style="color:#dc2626;">${formatVal(absTarget)}</span>`;

                         // Style the metric box red
                         const metricBox = document.getElementById('cts-live-metric-box');
                         if (metricBox) metricBox.style.borderColor = '#fca5a5';
                         const perfItems = metricBox?.querySelectorAll('.cts-perf-item');
                         if (perfItems) perfItems.forEach(el => { el.style.background = '#fef2f2'; });

                         const warnMsg = data.warning_message || `Your current baseline is below the minimum required for this contract.`;
                         nEl.innerHTML = `<i data-lucide="alert-triangle" style="color:#dc2626;"></i> <span style="color:#dc2626;font-weight:500;">${warnMsg}</span>`;

                         // Show ineligibility banner
                         const banner = document.getElementById('cts-ineligible-banner');
                         const bannerText = document.getElementById('cts-ineligible-text');
                         if (banner) banner.classList.add('visible');
                         if (bannerText) bannerText.textContent = warnMsg;

                         isBlocked = true;
                         renderPanel();
                     } else {
                         // Clear any previous warning state
                         const metricBox = document.getElementById('cts-live-metric-box');
                         if (metricBox) metricBox.style.borderColor = '#d4d4d4';
                         const perfItems = metricBox?.querySelectorAll('.cts-perf-item');
                         if (perfItems) perfItems.forEach((el, i) => { el.style.background = i === 1 ? '#fffbea' : '#fafafa'; });

                         const banner = document.getElementById('cts-ineligible-banner');
                         if (banner) banner.classList.remove('visible');

                         isBlocked = false;
                         renderPanel();

                         nEl.innerHTML = `<i data-lucide="check-circle" style="color:#16a34a;"></i> Oracle connection verified. Target will be formally locked at execution.`;
                     }
                }
                if (window.lucide) window.lucide.createIcons();
            })
            .catch(err => {
                document.getElementById('cts-live-baseline').innerHTML = '--';
                document.getElementById('cts-live-target').innerHTML = '--';
                document.getElementById('cts-oracle-note').innerHTML = `<i data-lucide="alert-circle" style="color:#ef4444;"></i> Failed to query oracle`;
                if (window.lucide) window.lucide.createIcons();
            });
    };

    fetchLivePreview(tier);
}

function buildTierSteps(min, max) {
    if (min === max || max <= 0) return [min || 25];
    const steps = [min];
    const candidates = [100, 250, 500, 1000, 1500, 2000, 3000, 5000, 10000];
    for (const v of candidates) {
        if (v > min && v <= max && steps.length < 4) steps.push(v);
    }
    if (!steps.includes(max) && steps.length < 5) steps.push(max);
    return steps;
}
