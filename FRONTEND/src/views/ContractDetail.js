export function renderContractDetail(params) {
    const contractId = params?.id || '';
    return `
        <style>
            .cd {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 40px 100px;
                font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
                background: #fff;
                min-height: calc(100vh - 72px);
                font-feature-settings: "zero" 0;
            }

            /* Breadcrumb */
            .cd-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; }
            .cd-breadcrumb a, .cd-breadcrumb span {
                font-size: 10px; font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase; letter-spacing: 0.1em; color: #a3a3a3;
                text-decoration: none; transition: color 150ms; cursor: pointer;
            }
            .cd-breadcrumb a:hover { color: #111; }
            .cd-breadcrumb .cd-bc-sep { font-size: 10px; color: #d4d4d4; }
            .cd-breadcrumb .cd-bc-current { color: #5C1414; font-weight: 700; }

            /* Loading & Error */
            .cd-loading { display: flex; align-items: center; justify-content: center; min-height: 50vh; }
            @keyframes cl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes cl-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
            .cd-error { text-align: center; padding: 60px 40px; }
            .cd-error-msg { font-size: 14px; color: #5C1414; margin-bottom: 20px; }
            
            .cd-hidden { display: none !important; }

            /* Header */
            .cd-top-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 1px solid #f0f0f0;
                padding-bottom: 40px;
            }
            .cd-top-left {
                display: flex;
                align-items: center;
                gap: 24px;
            }
            .cd-brand-icon {
                width: 56px; height: 56px;
                background: #fdfafa;
                border-radius: 8px;
                display: flex; align-items: center; justify-content: center;
                color: #5C1414;
            }
            .cd-brand-icon svg { width: 24px; height: 24px; }
            .cd-title-area { display: flex; flex-direction: column; gap: 6px; }
            .cd-title-row { display: flex; align-items: center; gap: 16px; }
            .cd-title { font-size: 24px; font-weight: 400; letter-spacing: -0.5px; margin: 0; color: #111; line-height: 1; }
            .cd-title strong { font-weight: 600; }
            
            .cd-badge {
                display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
                font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.1em;
            }
            .cd-badge .dot { width: 5px; height: 5px; border-radius: 50%; }
            .cd-badge.active { color: #16a34a; background: #f0fdf4; }
            .cd-badge.active .dot { background: #16a34a; }
            .cd-badge.pending { color: #d97706; background: #fffbeb; }
            .cd-badge.pending .dot { background: #d97706; }
            .cd-badge.settled { color: #888; background: #f5f5f5; }
            .cd-badge.settled .dot { background: #888; }

            .cd-subtitle {
                font-size: 14px; color: #888; letter-spacing: 0;
            }

            .cd-top-right {
                display: flex;
                gap: 40px;
                padding-right: 20px;
            }
            .cd-stat { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
            .cd-stat-val { font-size: 22px; font-weight: 400; letter-spacing: -0.5px; color: #111; line-height: 1; }
            .cd-stat-val.green { color: #16a34a; }
            .cd-stat-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #ccc; }

            /* Layout */
            .cd-layout {
                display: grid;
                grid-template-columns: 1fr 360px;
                gap: 0;
            }
            .cd-col-left {
                border-right: 1px solid #f0f0f0;
                padding-right: 40px;
            }
            .cd-col-right {
                padding-left: 40px;
            }

            @media (max-width: 1024px) {
                .cd-layout { grid-template-columns: 1fr; }
                .cd-col-left { border-right: none; padding-right: 0; }
                .cd-col-right { padding-left: 0; border-top: 1px solid #f0f0f0; margin-top: 40px; padding-top: 40px; }
            }
            @media (max-width: 768px) {
                .cd { padding: 24px 20px 80px; }
                .cd-top-header { flex-direction: column; gap: 24px; padding-bottom: 24px; margin-bottom: 24px; }
                .cd-top-right { gap: 24px; padding-right: 0; }
                .cd-title { font-size: 24px; }
                .cd-stat-val { font-size: 22px; }
                .cd-details-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .cd-block { margin-bottom: 28px; }
                .cd-block.line-top { padding-top: 28px; }
                .cd-hash-row { flex-direction: column; align-items: flex-start; gap: 10px; }
                .cd-perf-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            }
            @media (max-width: 480px) {
                .cd { padding: 16px 16px 60px; }
                .cd-top-left { gap: 14px; }
                .cd-brand-icon { width: 44px; height: 44px; }
                .cd-title { font-size: 20px; }
                .cd-stat-val { font-size: 20px; }
                .cd-stat-lbl { font-size: 8px; }
                .cd-details-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
                .cd-perf-grid { grid-template-columns: 1fr; gap: 16px; }
                .cd-btn { padding: 12px 16px; font-size: 9px; }
                .cd-breadcrumb { margin-bottom: 24px; }
                .cd-subtitle { font-size: 12px; }
            }

            /* Block Common */
            .cd-block {
                margin-bottom: 40px;
            }
            .cd-block.line-top {
                border-top: 1px solid #f0f0f0;
                padding-top: 40px;
            }
            .cd-block-header {
                display: flex; align-items: center; gap: 8px;
                font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.12em; color: #bbb;
                margin-bottom: 24px;
            }
            .cd-block-header svg { width: 14px; height: 14px; color: #d4d4d4; }
            .flex-between { justify-content: space-between; width: 100%; }
            .flex-between div { display: flex; align-items: center; gap: 8px; }

            /* Contract Details Grid */
            .cd-details-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 32px;
                margin-bottom: 32px;
            }
            @media (max-width: 600px) { .cd-details-grid { grid-template-columns: repeat(2, 1fr); } }
            .cd-detail-item { display: flex; flex-direction: column; gap: 8px; }
            .cd-detail-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #ccc; }
            .cd-detail-val { font-size: 14px; font-weight: 500; color: #111; }
            .fw-bold { font-weight: 700 !important; }

            .cd-hash-row {
                display: flex; align-items: center; justify-content: space-between;
                margin-top: 8px;
            }
            .cd-hash-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #a3a3a3; word-break: break-all; }
            .cd-copy-btn {
                display: inline-flex; align-items: center; gap: 6px;
                padding: 6px 12px; background: #fff; border: 1px solid #e5e5e5;
                font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.1em; color: #888;
                cursor: pointer; transition: all 150ms;
            }
            .cd-copy-btn:hover { border-color: #111; color: #111; }
            .cd-copy-btn svg { width: 12px; height: 12px; }

            /* Performance Metric */
            .cd-perf-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                margin-bottom: 16px;
            }
            .cd-perf-item { display: flex; flex-direction: column; gap: 8px; }
            .cd-perf-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #ccc; }
            .cd-perf-val { font-size: 15px; font-weight: 600; color: #111; }
            .cd-perf-val.green { color: #5C1414; } /* Updated to match screenshot: red val */

            .cd-progress {
                display: flex; align-items: center; gap: 16px;
                margin-bottom: 16px;
            }
            .cd-progress-track {
                flex: 1; height: 6px; background: #f0f0f0;
            }
            .cd-progress-fill {
                height: 100%; background: #5C1414; transition: width 0.5s ease-out;
            }
            .cd-progress-pct {
                font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #111;
            }
            .cd-progress-note {
                display: flex; align-items: center; gap: 8px;
                font-size: 12px; color: #d97706; /* Warning color */
            }
            .cd-progress-note svg { width: 14px; height: 14px; }

            /* Next Action */
            .cd-action-box {
                margin-bottom: 24px;
            }
            .cd-action-status {
                display: flex; align-items: center; gap: 12px;
                padding: 24px; background: #fafafa; border: 1px solid #f0f0f0;
                margin-bottom: 12px;
            }
            .cd-action-icon {
                width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
                background: #f0fdf4; color: #16a34a; flex-shrink: 0;
            }
            .cd-action-icon.pending { background: #fffbeb; color: #d97706; }
            .cd-action-icon.fail { background: #fef2f2; color: #ef4444; }
            .cd-action-icon svg { width: 16px; height: 16px; }
            .cd-action-text h4 { font-size: 14px; font-weight: 600; color: #111; margin: 0 0 4px; }
            .cd-action-text p { font-size: 12px; color: #888; margin: 0; }
            
            .cd-btn-wrap { display: flex; flex-direction: column; gap: 8px; }
            .cd-btn {
                display: flex; align-items: center; justify-content: space-between;
                padding: 14px 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.1em; color: #fff; background: #111;
                border: none; cursor: pointer; text-decoration: none; transition: background 150ms;
            }
            .cd-btn:hover { background: #000; }
            .cd-btn-outline { background: #fff; color: #888; border: 1px solid #f0f0f0; }
            .cd-btn-outline:hover { background: #fafafa; color: #111; border-color: #e5e5e5; }
            .cd-btn svg { width: 14px; height: 14px; color: #a3a3a3; }

            /* Share CTA */
            .cd-share-bar {
                display: flex; gap: 8px; margin-top: 12px;
            }
            .cd-share-btn {
                flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
                padding: 12px 16px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
                border: 1px solid #e5e5e5; background: #fff; color: #111; cursor: pointer;
                transition: all 150ms; letter-spacing: 0.02em;
            }
            .cd-share-btn:hover { background: #fafafa; border-color: #ccc; }
            .cd-share-btn.twitter { background: #0f1419; color: #fff; border-color: #0f1419; }
            .cd-share-btn.twitter:hover { background: #000; }
            .cd-share-btn svg { width: 14px; height: 14px; }

            /* Event Log — Compact */
            .cd-timeline { position: relative; padding-left: 22px; }
            .cd-timeline::before {
                content: ''; position: absolute; left: 3px; top: 6px; bottom: 6px;
                width: 1px; background: #e5e5e5;
            }
            .cd-event {
                position: relative; display: flex; align-items: center;
                justify-content: space-between; padding: 10px 0;
                border-bottom: 1px solid #f5f5f5;
            }
            .cd-event:last-child { border-bottom: none; }
            .cd-event-dot {
                position: absolute; left: -22px; top: 50%; transform: translateY(-50%);
                width: 7px; height: 7px;
                background: #0F5132; border-radius: 0;
                z-index: 1;
            }
            .cd-event-dot.pending {
                background: #5C1414;
                animation: cd-pulse 1.8s ease-in-out infinite;
            }
            .cd-event-dot.future { background: #e0e0e0; }
            @keyframes cd-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.25; }
            }
            .cd-event-left { display: flex; align-items: center; gap: 10px; }
            .cd-event-name {
                font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
                color: #111; letter-spacing: 0.04em; text-transform: uppercase;
            }
            .cd-event-name.future-text { color: #ccc; font-weight: 400; }
            .cd-event-chip {
                font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700;
                letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 6px;
            }
            .cd-event-chip.done { color: #0F5132; }
            .cd-event-chip.pending { color: #5C1414; }
            .cd-event-chip.future { color: #d4d4d4; }
            .cd-event-time {
                font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #bbb;
                letter-spacing: 0.02em; white-space: nowrap;
            }
        </style>

        <div class="cd">
            <div class="cd-breadcrumb">
                <a onclick="window.router.navigate('/contracts')">‹ MY CONTRACTS</a>
                <span class="cd-bc-sep">/</span>
                <span class="cd-bc-current" id="cd-bc-id">${contractId.substring(0, 8).toUpperCase()}</span>
            </div>

            <div id="cd-loading" class="cd-loading">
                <div style="position:relative;width:48px;height:48px;">
                    <svg style="position:absolute;top:0;left:0;width:100%;height:100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="15.5" stroke="#3B0001" stroke-width="2"/><line x1="32" y1="19.5" x2="32" y2="44.5" stroke="#3B0001" stroke-width="1.5" stroke-linecap="round" style="animation:cl-pulse 1.6s ease-in-out infinite"/></svg>
                    <svg style="position:absolute;top:0;left:0;width:100%;height:100%;animation:cl-spin 2.4s linear infinite;transform-origin:center center" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26.5" ry="7.5" stroke="#3B0001" stroke-width="1.1" fill="none" transform="rotate(-27 32 32)"/></svg>
                </div>
            </div>

            <div id="cd-error" class="cd-hidden cd-error">
                <div class="cd-error-msg" id="cd-error-msg"></div>
                <button class="cd-btn cd-btn-outline" style="width:200px;margin:0 auto;justify-content:center;" onclick="window.router.navigate('/contracts')">Back to Contracts</button>
            </div>

            <div id="cd-detail" class="cd-hidden">
                <div class="cd-top-header" data-reveal>
                    <div class="cd-top-left">
                        <div class="cd-brand-icon" id="cd-brand-icon">
                            <i data-lucide="twitter"></i>
                        </div>
                        <div class="cd-title-area">
                            <div class="cd-title-row">
                                <h1 class="cd-title">Contract <strong>${contractId.substring(0, 8).toUpperCase()}</strong></h1>
                                <span id="cd-badge" class="cd-badge"></span>
                            </div>
                            <div class="cd-subtitle" id="cd-subtitle"></div>
                        </div>
                    </div>
                    <div class="cd-top-right">
                        <div class="cd-stat">
                            <div class="cd-stat-val" id="cd-lock-amount"></div>
                            <div class="cd-stat-lbl">CAPITAL LOCKED</div>
                        </div>
                        <div class="cd-stat">
                            <div class="cd-stat-val green" id="cd-payout-amount"></div>
                            <div class="cd-stat-lbl">POTENTIAL PAYOUT</div>
                        </div>
                    </div>
                </div>

                <div class="cd-layout" data-reveal>
                    <div class="cd-col-left">
                        <div class="cd-block">
                            <div class="cd-block-header">
                                <i data-lucide="file-text"></i> CONTRACT DETAILS
                            </div>
                            <div class="cd-details-grid">
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">PLATFORM</div>
                                    <div class="cd-detail-val" id="cd-platform"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">DEADLINE</div>
                                    <div class="cd-detail-val" id="cd-deadline"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">DURATION</div>
                                    <div class="cd-detail-val" id="cd-duration"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">COUNTERPARTY</div>
                                    <div class="cd-detail-val" id="cd-counterparty"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">SOURCE</div>
                                    <div class="cd-detail-val" id="cd-source"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">START DATE</div>
                                    <div class="cd-detail-val" id="cd-start"></div>
                                </div>
                                <div class="cd-detail-item">
                                    <div class="cd-detail-lbl">END DATE</div>
                                    <div class="cd-detail-val" id="cd-end"></div>
                                </div>
                            </div>
                            <div class="cd-hash-section">
                                <div class="cd-detail-lbl">CONTRACT HASH</div>
                                <div class="cd-hash-row">
                                    <div class="cd-hash-val" id="cd-hash"></div>
                                    <button class="cd-copy-btn" id="cd-copy"><i data-lucide="copy"></i> COPY</button>
                                </div>
                            </div>
                        </div>

                        <div class="cd-block line-top">
                            <div class="cd-block-header">
                                <i data-lucide="activity"></i> PERFORMANCE METRIC
                            </div>
                            <div class="cd-perf-grid">
                                <div class="cd-perf-item">
                                    <div class="cd-perf-lbl">METRIC</div>
                                    <div class="cd-perf-val" id="cd-metric-name"></div>
                                </div>
                                <div class="cd-perf-item">
                                    <div class="cd-perf-lbl">THRESHOLD</div>
                                    <div class="cd-perf-val" id="cd-metric-thresh"></div>
                                </div>
                                <div class="cd-perf-item">
                                    <div class="cd-perf-lbl" style="text-align:right;">CURRENT VALUE</div>
                                    <div class="cd-perf-val green" style="text-align:right;" id="cd-metric-val"></div>
                                </div>
                            </div>
                            <div class="cd-progress">
                                <div class="cd-progress-track">
                                    <div class="cd-progress-fill" id="cd-progress-fill"></div>
                                </div>
                                <div class="cd-progress-pct" id="cd-progress-pct"></div>
                            </div>
                            <div class="cd-progress-note" id="cd-oracle-note">
                                <i data-lucide="triangle-alert"></i> Approaching threshold — settlement may trigger soon.
                            </div>
                        </div>
                    </div>

                    <div class="cd-col-right">
                        <div class="cd-block" style="margin-top:-2px;">
                            <div class="cd-block-header">
                                <i data-lucide="zap"></i> NEXT ACTION
                            </div>
                            <div class="cd-action-box" id="cd-action-content"></div>
                            <div class="cd-btn-wrap">
                                <a href="#/ledger" class="cd-btn">
                                    <span><i data-lucide="book-open" style="margin-right:8px; display:inline-block; vertical-align:middle;"></i> VIEW IN LEDGER</span>
                                    <i data-lucide="arrow-up-right"></i>
                                </a>
                                <a href="#/sources" class="cd-btn cd-btn-outline">
                                    <span><i data-lucide="external-link" style="margin-right:8px; display:inline-block; vertical-align:middle;"></i> VIEW SOURCE</span>
                                    <i data-lucide="arrow-up-right"></i>
                                </a>
                            </div>
                            <div class="cd-share-bar" id="cd-share-bar">
                                <button class="cd-share-btn twitter" id="cd-share-x">
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    Share on X
                                </button>
                                <button class="cd-share-btn" id="cd-share-copy">
                                    <i data-lucide="link" style="width:14px;height:14px;"></i>
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        <div class="cd-block line-top" style="margin-bottom:0;">
                            <div class="cd-block-header flex-between">
                                <div><i data-lucide="clock"></i> EVENT LOG</div>
                                <div class="cd-events-count" id="cd-events-count" style="color:#d4d4d4;">0 EVENTS</div>
                            </div>
                            <div id="cd-event-log"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initContractDetail(params) {
    const contractId = params?.id;
    if (!contractId) {
        showError('No contract ID provided');
        return;
    }

    const loadingEl = document.getElementById('cd-loading');
    const detailEl = document.getElementById('cd-detail');

    try {
        const contractData = await window.api.getContract(contractId);
        const eventsData = await window.api.getLedgerEvents(contractId);
        const c = contractData.contract || contractData;
        const events = eventsData.events || [];

        loadingEl.classList.add('cd-hidden');
        detailEl.classList.remove('cd-hidden');

        // Platform Setup
        const platform = c.platform?.toUpperCase() || 'UNKNOWN';
        const platformDisplay = platform.charAt(0) + platform.slice(1).toLowerCase();

        let iconName = 'file-text';
        let map = { 'twitter': 'twitter', 'x': 'twitter', 'stripe': 'credit-card', 'shopify': 'shopping-bag' };
        if (platform.toLowerCase() in map) iconName = map[platform.toLowerCase()];

        document.getElementById('cd-brand-icon').innerHTML = `<i data-lucide="${iconName}" style="width:24px;height:24px;"></i>`;
        document.getElementById('cd-subtitle').textContent = `${platformDisplay} Performance — CXTRCT-${contractId.substring(0, 4).toUpperCase()}`;

        // Financials
        document.getElementById('cd-lock-amount').textContent = formatCurrency(c.lockAmountUsdCents);
        document.getElementById('cd-payout-amount').textContent = '+' + formatCurrency(c.payoutAmountUsdCents);

        // Grid Details
        document.getElementById('cd-platform').textContent = platformDisplay;
        document.getElementById('cd-deadline').textContent = formatDate(c.deadline || c.deadlineUtc);
        document.getElementById('cd-deadline').textContent = formatDate(c.deadline || c.deadlineUtc);

        const start = new Date(c.createdAt || Date.now());
        const end = new Date(c.deadline || c.deadlineUtc || Date.now());
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 90;
        document.getElementById('cd-duration').textContent = days + ' Days';

        document.getElementById('cd-counterparty').textContent = c.counterparty || 'The System';
        document.getElementById('cd-source').textContent = platformDisplay + ' API';
        document.getElementById('cd-start').textContent = formatDateShort(c.createdAt);
        document.getElementById('cd-end').textContent = formatDateShort(c.deadline || c.deadlineUtc);

        document.getElementById('cd-hash').textContent = 'x2f135e24d92a8b7e3f1c04ea7d50bf7d2e495'; // Mock hash
        document.getElementById('cd-copy').addEventListener('click', () => {
            navigator.clipboard.writeText('x2f135e24d92a8b7e3f1c04ea7d50bf7d2e495');
            const btn = document.getElementById('cd-copy');
            btn.innerHTML = '<i data-lucide="check"></i> COPIED';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="copy"></i> COPY';
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        // Format Helper
        const formatVal = (v) => {
            if (platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') {
                return formatCurrency(v).replace('.00', '');
            }
            return Math.round(v).toLocaleString('en-US');
        };

        // Performance Metric
        let metricName = 'Follower Count';
        if (platform === 'STRIPE' || platform === 'SHOPIFY' || platform === 'AMAZON') metricName = 'Revenue';
        if (platform === 'YOUTUBE' && c.metricType === 'VIEWS') metricName = '30d Views';
        else if (platform === 'YOUTUBE') metricName = 'Subscribers';
        document.getElementById('cd-metric-name').textContent = metricName;

        // Default Loading State
        document.getElementById('cd-metric-thresh').textContent = '--';
        document.getElementById('cd-metric-val').textContent = '--';
        document.getElementById('cd-progress-fill').style.width = '0%';
        document.getElementById('cd-progress-pct').textContent = '...';
        document.getElementById('cd-oracle-note').innerHTML = '<i data-lucide="loader-2"></i> Fetching live metric...';

        // State / Badge / Action
        const state = c.derivedState || c.state || 'CREATED';
        setStatusBadge(state);
        renderActionPanel(state, days);
        renderEventLog(events);

        if (window.lucide) window.lucide.createIcons();

        // Share functionality
        const shareUrl = `https://collateral.market/contracts/${contractId}`;
        const lockUsd = (c.lockAmountUsdCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
        const tweetText = state === 'SETTLED_SUCCESS'
            ? `I just won $${lockUsd} on @CollateralMkt by hitting my ${platformDisplay} growth target. Put your money where your mouth is.`
            : `I just locked $${lockUsd} on my ${platformDisplay} growth on @CollateralMkt. ${days} days to hit the target or I lose it all.`;

        document.getElementById('cd-share-x')?.addEventListener('click', () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        });
        document.getElementById('cd-share-copy')?.addEventListener('click', () => {
            navigator.clipboard.writeText(shareUrl);
            const btn = document.getElementById('cd-share-copy');
            btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="link" style="width:14px;height:14px;"></i> Copy Link';
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });

        // Fetch Live Metric Asynchronously
        const isPending = ['CREATED', 'FUNDS_AUTHORIZED', 'PENDING'].includes(state);
        
        try {
            let cur = 0;
            let tgt = 0;
            let pct = 0;
            let isPreview = false;

            if (isPending) {
                const metricData = await window.api.getContractMetricPreview(contractId);
                if (metricData.status === 'error') throw new Error(metricData.error);
                
                cur = metricData.current_baseline || 0;
                tgt = metricData.projected_target || 0;
                isPreview = true;
                
                document.getElementById('cd-progress-fill').style.width = '3%'; 
                document.getElementById('cd-progress-pct').textContent = 'LIVE PREVIEW';
                document.getElementById('cd-oracle-note').innerHTML = '<i data-lucide="activity"></i> Showing live connected account baseline.';
                document.getElementById('cd-oracle-note').style.color = '#ccc';
            } else {
                const metricData = await window.api.getContractMetric(contractId);
                cur = metricData.current_value || metricData.baseline_value || 0;
                tgt = metricData.target_value || 0;
                
                // Active contracts return condition.threshold as target_value. If non-X, it's a delta.
                if (platform !== 'X' && tgt > 0) {
                    tgt = (metricData.baseline_value || 0) + tgt;
                }

                pct = metricData.progress_pct || 0;
                
                document.getElementById('cd-progress-fill').style.width = Math.min(100, Math.max(0, pct)) + '%';
                document.getElementById('cd-progress-pct').textContent = pct.toFixed(1) + '%';
                
                if (pct >= 90) {
                    document.getElementById('cd-oracle-note').innerHTML = '<i data-lucide="triangle-alert"></i> Approaching threshold — settlement may trigger soon.';
                    document.getElementById('cd-oracle-note').style.color = '#5C1414';
                } else {
                    document.getElementById('cd-oracle-note').innerHTML = '<i data-lucide="clock"></i> Oracle checks daily at 00:00 UTC.';
                    document.getElementById('cd-oracle-note').style.color = '#ccc';
                }
            }

            document.getElementById('cd-metric-thresh').textContent = formatVal(tgt);
            document.getElementById('cd-metric-val').textContent = formatVal(cur);
            
            if (window.lucide) window.lucide.createIcons();
            
        } catch (err) {
            console.error('Failed to fetch metric:', err);
            document.getElementById('cd-metric-thresh').textContent = '--';
            document.getElementById('cd-metric-val').textContent = '--';
            document.getElementById('cd-progress-pct').textContent = 'ERROR';
            document.getElementById('cd-oracle-note').innerHTML = '<i data-lucide="alert-circle"></i> Failed to fetch live metric data';
            document.getElementById('cd-oracle-note').style.color = '#ef4444';
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (err) {
        showError(err.message);
    }
}

function renderActionPanel(state, daysLeft) {
    const act = document.getElementById('cd-action-content');

    if (['LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED'].includes(state)) {
        act.innerHTML = '<div class="cd-action-status">' +
            '<div class="cd-action-icon"><i data-lucide="check"></i></div>' +
            '<div class="cd-action-text">' +
            '<h4>Contract is Active</h4>' +
            '<p>' + daysLeft + ' days until verification deadline</p>' +
            '</div>' +
            '</div>';
    } else if (['CREATED', 'FUNDS_AUTHORIZED', 'PENDING'].includes(state)) {
        act.innerHTML = '<div class="cd-action-status">' +
            '<div class="cd-action-icon pending"><i data-lucide="clock"></i></div>' +
            '<div class="cd-action-text">' +
            '<h4>Waiting for Funds</h4>' +
            '<p>Contract requires funding to become active.</p>' +
            '</div>' +
            '</div>';
    } else if (['SETTLED_SUCCESS', 'SETTLEMENT_COMPLETE'].includes(state)) {
        act.innerHTML = '<div class="cd-action-status">' +
            '<div class="cd-action-icon"><i data-lucide="check-check"></i></div>' +
            '<div class="cd-action-text">' +
            '<h4>Target Hit</h4>' +
            '<p>Funds are released after review, typically within one business day.</p>' +
            '</div>' +
            '</div>';
    } else if (['PAYOUT_COMPLETE', 'COMPLETED'].includes(state)) {
        act.innerHTML = '<div class="cd-action-status">' +
            '<div class="cd-action-icon"><i data-lucide="check-check"></i></div>' +
            '<div class="cd-action-text">' +
            '<h4>Target Hit</h4>' +
            '<p>Funds have been released.</p>' +
            '</div>' +
            '</div>';
    } else {
        act.innerHTML = '<div class="cd-action-status">' +
            '<div class="cd-action-icon"><i data-lucide="check-check"></i></div>' +
            '<div class="cd-action-text">' +
            '<h4>Contract Settled</h4>' +
            '<p>Final state reached.</p>' +
            '</div>' +
            '</div>';
    }
}

function renderEventLog(events) {
    var log = document.getElementById('cd-event-log');

    // 5 crucial lifecycle steps in order
    var steps = [
        { key: 'created', label: 'CONTRACT CREATED', matchTypes: ['CONTRACT_CREATED'] },
        { key: 'funded', label: 'FUNDS LOCKED', matchTypes: ['FUNDS_LOCKED', 'FUNDS_AUTHORIZED'] },
        { key: 'executed', label: 'CONTRACT EXECUTED', matchTypes: ['EXECUTION_CONFIRMED', 'EXECUTION_REQUESTED'] },
        { key: 'verified', label: 'VERIFICATION', matchTypes: ['VERIFICATION_STARTED', 'SETTLED_SUCCESS', 'SETTLED_FAILURE'] },
        { key: 'payout', label: 'PAYOUT', matchTypes: ['SETTLED_SUCCESS', 'SETTLEMENT_COMPLETE'] }
    ];

    // Build a set of event types that have occurred
    var doneTypes = {};
    var eventTimes = {};
    if (events && events.length > 0) {
        events.forEach(function (e) {
            doneTypes[e.eventType] = true;
            eventTimes[e.eventType] = e.timestampUtc;
        });
    }

    // Determine which steps are done
    var completedCount = 0;
    steps.forEach(function (step) {
        step.done = false;
        step.time = null;
        for (var i = 0; i < step.matchTypes.length; i++) {
            if (doneTypes[step.matchTypes[i]]) {
                step.done = true;
                step.time = eventTimes[step.matchTypes[i]];
                break;
            }
        }
        if (step.done) completedCount++;
    });

    // If no events at all, mock first 3 as done for demo
    if (!events || events.length === 0) {
        steps[0].done = true; steps[0].time = '2026-02-02T14:20:00Z';
        steps[1].done = true; steps[1].time = '2026-02-02T14:28:00Z';
        steps[2].done = true; steps[2].time = '2026-02-02T14:30:00Z';
        completedCount = 3;
    }

    // Find first not-done step (the pending/blinking one)
    var pendingIdx = -1;
    for (var i = 0; i < steps.length; i++) {
        if (!steps[i].done) { pendingIdx = i; break; }
    }

    document.getElementById('cd-events-count').textContent = steps.length + ' STEPS';

    var html = '<div class="cd-timeline">';
    steps.forEach(function (step, idx) {
        var dotClass = 'cd-event-dot';
        var nameClass = 'cd-event-name';
        var chipClass = 'cd-event-chip';
        var chipLabel = '';
        var timeStr = '';

        if (step.done) {
            dotClass = 'cd-event-dot done';
            chipClass = 'cd-event-chip done';
            chipLabel = '✓';
            timeStr = step.time ? formatDateTimeForEvent(step.time) : '';
        } else if (idx === pendingIdx) {
            dotClass = 'cd-event-dot pending';
            chipClass = 'cd-event-chip pending';
            chipLabel = 'PENDING';
            timeStr = '—';
        } else {
            dotClass = 'cd-event-dot future';
            nameClass = 'cd-event-name future-text';
            chipClass = 'cd-event-chip future';
            chipLabel = '—';
            timeStr = '';
        }

        html += '<div class="cd-event">' +
            '<div class="' + dotClass + '"></div>' +
            '<div class="cd-event-left">' +
            '<span class="' + nameClass + '">' + step.label + '</span>' +
            '<span class="' + chipClass + '">' + chipLabel + '</span>' +
            '</div>' +
            '<span class="cd-event-time">' + timeStr + '</span>' +
            '</div>';
    });
    html += '</div>';
    log.innerHTML = html;
}

function setStatusBadge(state) {
    const badge = document.getElementById('cd-badge');
    if (['CREATED', 'FUNDS_AUTHORIZED', 'PENDING'].includes(state)) {
        badge.className = 'cd-badge pending';
        badge.innerHTML = '<span class="dot"></span> PENDING';
    } else if (['LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED'].includes(state)) {
        badge.className = 'cd-badge active';
        badge.innerHTML = '<span class="dot"></span> ACTIVE';
    } else {
        badge.className = 'cd-badge settled';
        badge.innerHTML = '<span class="dot"></span> SETTLED';
    }
}

function formatCurrency(cents) {
    if (!cents) return '$0.00';
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function formatDateShort(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTimeForEvent(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function showError(msg) {
    document.getElementById('cd-loading').classList.add('cd-hidden');
    document.getElementById('cd-error').classList.remove('cd-hidden');
    document.getElementById('cd-error-msg').textContent = msg;
}
