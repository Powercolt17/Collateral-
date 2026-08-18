import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderReferrals() {
    return `
        <style>
            /* ============================================================
               REFERRALS — INSTITUTIONAL DESIGN SYSTEM
               ============================================================ */
            .ref {
                background: #FAF4E6;
                min-height: calc(100vh - 72px);
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #111;
                display: flex;
                flex-direction: column;
            }

            /* ── Hero Header ── */
            .ref-header {
                background: #F5EDDA;
                border-bottom: 1px solid #f0f0f0;
            }
            .ref-header-inner {
                max-width: 1440px;
                margin: 0 auto;
                padding: 48px 64px 48px;
            }
            .ref-breadcrumb {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 500;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #ccc;
                margin-bottom: 20px;
            }
            .ref-breadcrumb strong {
                color: #752122;
                font-weight: 700;
            }
            .ref-hero-row {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 48px;
            }
            .ref-hero-left { flex: 1; }
            .ref-hero-title {
                font-size: 32px;
                font-weight: 300;
                color: #111;
                letter-spacing: -1.5px;
                margin: 0;
                line-height: 1.1;
            }
            .ref-hero-title strong {
                font-weight: 700;
            }
            .ref-hero-desc {
                font-size: 15px;
                color: #333;
                margin-top: 12px;
                line-height: 1.6;
                max-width: 440px;
            }
            .ref-hero-stats {
                display: flex;
                align-items: flex-end;
                gap: 48px;
                flex-shrink: 0;
            }
            .ref-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .ref-stat-value {
                font-size: 28px;
                font-weight: 300;
                letter-spacing: -1px;
                color: #111;
                line-height: 1;
            }
            .ref-stat-value.accent { color: #752122; }
            .ref-stat-label {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.12em;
                color: #555;
                text-transform: uppercase;
                margin-top: 8px;
            }

            /* ── Content Area ── */
            .ref-content {
                flex: 1;
                max-width: 860px;
                margin: 0 auto;
                padding: 40px 64px 80px;
                width: 100%;
                box-sizing: border-box;
            }

            /* ── Section Container ── */
            .ref-section {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                margin-bottom: 16px;
            }
            .ref-section-hdr {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            .ref-section-title {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #333;
            }
            .ref-section-sub {
                font-family: var(--font-data);
                font-size: 10px;
                color: #555;
            }

            /* ── Tier Row ── */
            .ref-tier-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #f4f4f4;
                transition: background 0.1s;
            }
            .ref-tier-row:last-child { border-bottom: none; }
            .ref-tier-row:hover { background: #FAF4E6; }
            .ref-tier-row.dimmed { opacity: 0.4; }

            .ref-tier-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ref-tier-dot {
                width: 6px;
                height: 6px;
                background: rgba(70,55,35,.22);
                flex-shrink: 0;
            }
            .ref-tier-dot.active { background: #752122; }
            .ref-tier-label {
                font-size: 13px;
                font-weight: 600;
                color: #111;
            }
            .ref-tier-label.dimmed { color: #888; font-weight: 400; }

            /* ── Badges ── */
            .ref-badge {
                display: inline-flex;
                align-items: center;
                padding: 2px 6px;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .ref-badge.next {
                background: #fff7ed;
                color: #c2410c;
                border: 1px solid #fed7aa;
            }
            .ref-badge.current {
                background: #f0fdf4;
                color: #15803d;
                border: 1px solid #bbf7d0;
            }

            .ref-tier-pct {
                font-family: var(--font-data);
                font-size: 13px;
                font-weight: 700;
                color: #111;
                letter-spacing: -0.5px;
            }
            .ref-tier-pct.dimmed { color: #888; font-weight: 400; }

            /* ── Referral Link Card ── */
            .ref-link-card {
                background: #111;
                border: 1px solid #111;
                margin-bottom: 16px;
                padding: 20px;
            }
            .ref-link-title {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #666;
                margin-bottom: 12px;
            }
            .ref-link-row {
                display: flex;
                gap: 8px;
            }
            .ref-link-input {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #333;
                font-size: 13px;
                font-family: var(--font-data);
                background: #1a1a1a;
                color: #F0E6D2;
                outline: none;
            }
            .ref-link-btn {
                padding: 10px 20px;
                background: #752122;
                color: #fff;
                border: none;
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                cursor: pointer;
                transition: background 0.15s;
                display: flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
            }
            .ref-link-btn:hover { background: #5c1a1b; }
            .ref-link-btn svg { width: 13px; height: 13px; }

            /* ── Progress Bar ── */
            .ref-progress-track {
                height: 4px;
                background: #f0f0f0;
                position: relative;
                margin: 12px 0 8px;
            }
            .ref-progress-fill {
                position: absolute;
                left: 0; top: 0; bottom: 0;
                background: #752122;
                transition: width 0.5s ease;
            }
            .ref-progress-hint {
                font-size: 12px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .ref-progress-hint strong { color: #752122; }

            /* ── How It Works ── */
            .ref-steps {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0;
                border: 1px solid rgba(70,55,35,.22);
                background: #F5EDDA;
                margin-bottom: 16px;
            }
            .ref-step {
                padding: 28px 24px;
                border-right: 1px solid rgba(70,55,35,.22);
            }
            .ref-step:last-child { border-right: none; }
            .ref-step-num {
                font-size: 24px;
                font-weight: 200;
                color: #211B12;
                letter-spacing: -1px;
                margin-bottom: 8px;
                line-height: 1;
            }
            .ref-step-title {
                font-size: 14px;
                font-weight: 700;
                color: #111;
                margin-bottom: 6px;
            }
            .ref-step-desc {
                font-size: 13px;
                color: #333;
                line-height: 1.5;
            }

            /* ── History ── */
            .ref-history-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 20px;
                border-bottom: 1px solid #f4f4f4;
            }
            .ref-history-row:last-child { border-bottom: none; }
            .ref-history-date {
                font-family: var(--font-data);
                font-size: 11px;
                color: #666;
            }
            .ref-history-status {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 2px 8px;
            }
            .ref-history-status.activated {
                background: #f0fdf4;
                color: #15803d;
                border: 1px solid #bbf7d0;
            }
            .ref-history-status.pending {
                background: #fffbeb;
                color: #d97706;
                border: 1px solid #fde68a;
            }

            /* ── Bonus Banner ── */
            .ref-bonus {
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                border-left: 3px solid #752122;
                padding: 14px 20px;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 14px;
            }
            .ref-bonus-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .ref-bonus-text {
                font-size: 12px;
                color: #111;
                font-weight: 600;
            }
            .ref-bonus-sub {
                font-size: 11px;
                color: #888;
                margin-top: 2px;
            }

            /* ── Footer ── */
            .ref-footer {
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #f0f0f0;
                display: flex;
                gap: 32px;
            }
            .ref-footer-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .ref-footer-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #555;
            }
            .ref-footer-val {
                font-family: var(--font-data);
                font-size: 10px;
                color: #111;
            }
            .ref-footer-dot {
                display: inline-block;
                width: 6px;
                height: 6px;
                background: #15803d;
                border-radius: 50%;
                margin-right: 5px;
                vertical-align: middle;
            }

            /* ── Loading ── */
            .ref-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 80px 0;
                gap: 16px;
            }
            .ref-spinner {
                width: 18px;
                height: 18px;
                border: 2px solid #f0f0f0;
                border-top-color: #752122;
                border-radius: 50%;
                animation: ref-spin 0.8s linear infinite;
            }
            @keyframes ref-spin { to { transform: rotate(360deg); } }
            .ref-loading-text {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 500;
                color: #ccc;
                text-transform: uppercase;
                letter-spacing: 0.12em;
            }

            /* ── Responsive ── */
            @media (max-width: 1024px) {
                .ref-header-inner { padding: 32px 32px; }
                .ref-content { padding: 32px 32px; }
                .ref-hero-row { flex-direction: column; align-items: flex-start; gap: 32px; }
            }
            @media (max-width: 768px) {
                .ref-header-inner { padding: 24px 16px; }
                .ref-content { padding: 24px 16px; }
                .ref-hero-stats { gap: 32px; flex-wrap: wrap; }
                .ref-steps { grid-template-columns: 1fr; }
                .ref-step { border-right: none; border-bottom: 1px solid rgba(70,55,35,.22); }
                .ref-step:last-child { border-bottom: none; }
                .ref-footer { flex-wrap: wrap; gap: 20px; }
            }
            @media (max-width: 480px) {
                .ref-hero-title { font-size: 22px; letter-spacing: -1px; }
                .ref-hero-desc { font-size: 13px; }
                .ref-stat-value { font-size: 22px; }
                .ref-link-row { flex-direction: column; }
                .ref-link-btn { width: 100%; justify-content: center; }
                .ref-link-input { font-size: 11px; }
                .ref-step { padding: 20px 16px; }
                .ref-bonus { flex-direction: column; gap: 8px; }
                .ref-tier-row { padding: 14px 16px; }
            }
        </style>

        <div class="ref">
            <!-- Hero Header -->
            <div class="ref-header" data-reveal>
                <div class="ref-header-inner">
                    <div class="ref-breadcrumb">PLATFORM / <strong>REFERRALS</strong></div>
                    <div class="ref-hero-row">
                        <div class="ref-hero-left">
                            <h1 class="ref-hero-title">Boost Your <strong>Payouts</strong></h1>
                            <p class="ref-hero-desc">Invite peers to the platform. Earn permanent profit boosts applied to every contract settlement.</p>
                        </div>
                        <div class="ref-hero-stats" id="ref-hero-stats">
                            <div class="ref-stat">
                                <span class="ref-stat-value" id="ref-boost-val">&mdash;</span>
                                <span class="ref-stat-label">Your Boost</span>
                            </div>
                            <div class="ref-stat">
                                <span class="ref-stat-value" id="ref-count-val">&mdash;</span>
                                <span class="ref-stat-label">Referrals</span>
                            </div>
                            <div class="ref-stat">
                                <span class="ref-stat-value accent" id="ref-next-val">&mdash;</span>
                                <span class="ref-stat-label">Next Reward</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="ref-content">
                <div id="referral-loading">
                    ${collateralFullLoader('Loading referral data...')}
                </div>
                <div id="referral-content" style="display:none;"></div>
                <div id="referral-error" style="display:none;"></div>
            </div>
        </div>
    `;
}

export function initReferrals() {
    if (!window.appState?.isLoggedIn) {
        const loadingEl = document.getElementById('referral-loading');
        const errorEl = document.getElementById('referral-error');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.innerHTML = `
                <div style="text-align:center;padding:80px 40px;">
                    <div style="width:56px;height:56px;background: #FAF4E6;border:1px solid #f0f0f0;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Sign in to view referrals</div>
                    <div style="font-size:13px;color:#999;max-width:360px;margin:0 auto 24px;">Create an account or sign in to access your referral dashboard and share your link.</div>
                    <button onclick="window.app.openAccessModal()" style="background:#1a1a1a;color:#fff;border:none;padding:10px 28px;font-size:13px;font-weight:500;cursor:pointer;letter-spacing:0.02em;font-family:var(--font-content);">Sign In</button>
                </div>
            `;
        }
        return;
    }
    loadReferralData();
}

async function loadReferralData() {
    const loadingEl = document.getElementById('referral-loading');
    const contentEl = document.getElementById('referral-content');
    const errorEl = document.getElementById('referral-error');

    if (!loadingEl || !contentEl || !errorEl) return;

    try {
        const stats = await window.api.getReferralStats();

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

        // Hydrate hero stats
        const boostEl = document.getElementById('ref-boost-val');
        const countEl = document.getElementById('ref-count-val');
        const nextEl = document.getElementById('ref-next-val');
        if (boostEl) boostEl.textContent = '+' + (stats.boostPct || 0) + '%';
        if (countEl) countEl.textContent = String(stats.referralCount || 0);
        if (nextEl) nextEl.textContent = stats.nextTier ? '+' + stats.nextTier.boostPct + '%' : 'MAX';

        const referralCode = stats.referralCode || null;

        const progressPct = stats.nextTier
            ? Math.min(100, Math.round((stats.referralCount / stats.nextTier.needed) * 100))
            : 100;
        const progressLabel = stats.nextTier
            ? stats.referralCount + ' / ' + stats.nextTier.needed
            : 'MAX';
        const progressHint = stats.nextTier
            ? (stats.nextTier.needed - stats.referralCount) + ' more referral' + ((stats.nextTier.needed - stats.referralCount) !== 1 ? 's' : '') + ' to unlock <strong>+' + stats.nextTier.boostPct + '%</strong> boost'
            : 'Maximum boost tier reached';

        // First-contract bonus
        const bonusHtml = stats.firstBonusAvailable
            ? '<div class="ref-bonus"><span class="ref-bonus-icon">🎁</span><div><div class="ref-bonus-text">+' + stats.firstBonusPct + '% bonus on your first contract</div><div class="ref-bonus-sub">Execute your first contract to claim this reward.</div></div></div>'
            : '';

        // Tier rows
        const tierRows = stats.tiers.map(function (t) {
            const isUnlocked = stats.referralCount >= t.minReferrals;
            const isCurrent = stats.boostPct === t.boostPct && isUnlocked;
            const isNext = stats.nextTier && stats.nextTier.boostPct === t.boostPct;
            const dimClass = isUnlocked ? '' : ' dimmed';

            let badge = '';
            if (isNext) badge = ' <span class="ref-badge next">NEXT</span>';
            if (isCurrent) badge = ' <span class="ref-badge current">CURRENT</span>';

            return '<div class="ref-tier-row' + dimClass + '">'
                + '<div class="ref-tier-left">'
                + '<div class="ref-tier-dot' + (isUnlocked ? ' active' : '') + '"></div>'
                + '<span class="ref-tier-label' + (isUnlocked ? '' : ' dimmed') + '">' + t.minReferrals + ' referral' + (t.minReferrals !== 1 ? 's' : '') + badge + '</span>'
                + '</div>'
                + '<span class="ref-tier-pct' + (isUnlocked ? '' : ' dimmed') + '">+' + t.boostPct + '%</span>'
                + '</div>';
        }).join('');

        // History
        let historyHtml = '';
        if (stats.referrals.length > 0) {
            const rows = stats.referrals.map(function (r) {
                const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const statusClass = r.status === 'ACTIVATED' ? 'activated' : 'pending';
                return '<div class="ref-history-row">'
                    + '<span class="ref-history-date">' + dateStr + '</span>'
                    + '<span class="ref-history-status ' + statusClass + '">' + r.status + '</span>'
                    + '</div>';
            }).join('');

            historyHtml = '<div class="ref-section">'
                + '<div class="ref-section-hdr"><span class="ref-section-title">Referral History</span><span class="ref-section-sub">' + stats.referrals.length + ' total</span></div>'
                + rows
                + '</div>';
        }

        contentEl.innerHTML = ''
            + bonusHtml

            // Progress to Next Tier
            + '<div class="ref-section">'
            + '<div class="ref-section-hdr"><span class="ref-section-title">Progress to Next Tier</span><span class="ref-section-sub">' + progressLabel + '</span></div>'
            + '<div style="padding:16px 20px;">'
            + '<div class="ref-progress-track"><div class="ref-progress-fill" style="width:' + progressPct + '%;"></div></div>'
            + '<div class="ref-progress-hint"><span style="color:#ccc;">›</span> <span>' + progressHint + '</span></div>'
            + '</div>'
            + '</div>'

            // Referral Code
            + (referralCode
                ? '<div class="ref-link-card">'
                + '<div class="ref-link-title">Your Referral Code</div>'
                + '<div class="ref-link-row">'
                + '<input id="referral-link-input" class="ref-link-input" type="text" readonly value="' + referralCode + '">'
                + '<button id="referral-copy-btn" class="ref-link-btn">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
                + 'COPY'
                + '</button>'
                + '</div>'
                + '<p style="font-size:11px;color:#777;margin-top:10px;">Share this code with friends. They enter it when creating an account.</p>'
                + '</div>'
                : '')

            // Boost Tiers
            + '<div class="ref-section">'
            + '<div class="ref-section-hdr"><span class="ref-section-title">Boost Tiers</span></div>'
            + tierRows
            + '</div>'

            // How It Works
            + '<div class="ref-steps">'
            + '<div class="ref-step">'
            + '<div class="ref-step-num">01</div>'
            + '<div class="ref-step-title">Share Code</div>'
            + '<div class="ref-step-desc">Send your unique referral code to peers and colleagues.</div>'
            + '</div>'
            + '<div class="ref-step">'
            + '<div class="ref-step-num">02</div>'
            + '<div class="ref-step-title">They Execute</div>'
            + '<div class="ref-step-desc">Your referral counts when they create and execute a contract.</div>'
            + '</div>'
            + '<div class="ref-step">'
            + '<div class="ref-step-num">03</div>'
            + '<div class="ref-step-title">You Earn</div>'
            + '<div class="ref-step-desc">Permanent profit boost applied to all your contracts.</div>'
            + '</div>'
            + '</div>'

            // History
            + historyHtml

            // Footer
            + '<div class="ref-footer">'
            + '<div class="ref-footer-item"><span class="ref-footer-lbl">Program Status</span><span class="ref-footer-val"><span class="ref-footer-dot"></span>ACTIVE</span></div>'
            + '<div class="ref-footer-item"><span class="ref-footer-lbl">Max Boost</span><span class="ref-footer-val">+' + stats.maxBoostPct + '%</span></div>'
            + '<div class="ref-footer-item"><span class="ref-footer-lbl">Duration</span><span class="ref-footer-val">Permanent</span></div>'
            + '<div class="ref-footer-item"><span class="ref-footer-lbl">Stacking</span><span class="ref-footer-val">Enabled</span></div>'
            + '</div>';

        // Wire copy button
        const copyBtn = document.getElementById('referral-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                const input = document.getElementById('referral-link-input');
                input.select();
                navigator.clipboard.writeText(input.value).then(function () {
                    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> COPIED';
                    copyBtn.style.background = '#15803d';
                    setTimeout(function () {
                        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> COPY';
                        copyBtn.style.background = '#752122';
                    }, 2000);
                });
            });
        }

    } catch (err) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        const msg = err.message || '';
        if (err.status === 401 || msg.includes('Unauthorized') || msg.includes('401')) {
            errorEl.innerHTML = '<div style="text-align:center;padding:80px 40px;">'
                + '<div style="width:56px;height:56px;background: #FAF4E6;border:1px solid #f0f0f0;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">'
                + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
                + '</div>'
                + '<div style="font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Session expired</div>'
                + '<div style="font-size:13px;color:#999;max-width:360px;margin:0 auto 24px;">Please sign in again to view your referral dashboard.</div>'
                + '<button onclick="window.app.openAccessModal()" style="background:#1a1a1a;color:#fff;border:none;padding:10px 28px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Sign In</button>'
                + '</div>';
        } else {
            errorEl.innerHTML = '<div style="text-align:center;padding:80px 40px;">'
                + '<div style="font-size:14px;font-weight:600;color:#752122;">' + (msg || 'Failed to load referral data') + '</div>'
                + '</div>';
        }
    }
}
