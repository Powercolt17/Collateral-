// PUBLIC RESULTS FEED — Settled contracts and rivalries
// Proves the platform is real: shows wins, losses, draws with amounts

export function renderResults() {
    return `
        <style>
            .res {
                max-width: 960px; margin: 0 auto; padding: 48px 32px 120px;
                font-family: var(--font-content); color: #111;
            }
            .res-hero { margin-bottom: 48px; }
            .res-title {
                font-size: 28px; font-weight: 300; letter-spacing: -0.5px; margin: 0 0 8px;
            }
            .res-title strong { font-weight: 700; }
            .res-subtitle { font-size: 14px; color: #999; margin: 0 0 32px; }
            .res-stats {
                display: flex; gap: 48px; padding: 24px 0;
                border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;
            }
            .res-stat-val { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; color: #111; }
            .res-stat-val.green { color: #16a34a; }
            .res-stat-val.red { color: #752122; }
            .res-stat-lbl {
                font-size: 9px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.12em; color: #bbb; margin-top: 4px;
            }

            .res-grid { display: flex; flex-direction: column; gap: 1px; background: #f0f0f0; border: 1px solid #f0f0f0; }
            .res-card {
                display: grid; grid-template-columns: 48px 1fr 120px 120px 100px;
                align-items: center; gap: 16px; padding: 16px 20px; background: #F5EDDA;
                transition: background 150ms; cursor: default;
            }
            .res-card:hover { background: #FAF4E6; }

            .res-icon {
                width: 40px; height: 40px; border-radius: 6px;
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; font-weight: 700;
            }
            .res-icon.win { background: #f0fdf4; color: #16a34a; }
            .res-icon.loss { background: #fef2f2; color: #752122; }
            .res-icon.draw { background: #fffbeb; color: #d97706; }

            .res-info-name { font-size: 14px; font-weight: 600; color: #111; }
            .res-info-meta { font-size: 11px; color: #999; margin-top: 2px; }
            .res-info-meta span { margin-right: 12px; }

            .res-amount { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; text-align: right; }
            .res-amount.win { color: #16a34a; }
            .res-amount.loss { color: #752122; }
            .res-amount.draw { color: #d97706; }

            .res-platform {
                font-size: 10px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.1em; color: #999; text-align: right;
            }
            .res-badge {
                display: inline-flex; align-items: center; justify-content: center;
                padding: 4px 10px; font-size: 9px; font-weight: 800;
                letter-spacing: 0.1em; text-transform: uppercase; text-align: center;
            }
            .res-badge.win { background: #f0fdf4; color: #16a34a; }
            .res-badge.loss { background: #fef2f2; color: #752122; }
            .res-badge.draw { background: #fffbeb; color: #d97706; }

            .res-empty {
                text-align: center; padding: 80px 40px; color: #999;
            }
            .res-empty-title { font-size: 18px; font-weight: 600; color: #111; margin-bottom: 8px; }
            .res-empty-text { font-size: 14px; }
            .res-cta {
                display: inline-flex; align-items: center; gap: 8px;
                margin-top: 24px; padding: 14px 28px; background: #111; color: #fff;
                font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
                text-transform: uppercase; text-decoration: none; cursor: pointer;
                border: none; transition: background 150ms;
            }
            .res-cta:hover { background: #000; }

            .res-loading { display: flex; align-items: center; justify-content: center; min-height: 40vh; color: #999; }

            @media (max-width: 768px) {
                .res { padding: 24px 16px 80px; }
                .res-card { grid-template-columns: 40px 1fr 90px; gap: 10px; padding: 12px 14px; }
                .res-platform, .res-badge { display: none; }
                .res-stats { gap: 24px; flex-wrap: wrap; }
                .res-title { font-size: 22px; }
            }
        </style>

        <div class="res">
            <div class="res-hero">
                <h1 class="res-title">Settlement <strong>Results</strong></h1>
                <p class="res-subtitle">Every contract settled on Collateral — wins, losses, and draws. All transparent.</p>
                <div class="res-stats">
                    <div>
                        <div class="res-stat-val" id="res-total-settled">—</div>
                        <div class="res-stat-lbl">Total Settled</div>
                    </div>
                    <div>
                        <div class="res-stat-val green" id="res-total-won">—</div>
                        <div class="res-stat-lbl">Won</div>
                    </div>
                    <div>
                        <div class="res-stat-val red" id="res-total-lost">—</div>
                        <div class="res-stat-lbl">Lost / Forfeited</div>
                    </div>
                    <div>
                        <div class="res-stat-val" id="res-total-volume">—</div>
                        <div class="res-stat-lbl">Capital Settled</div>
                    </div>
                </div>
            </div>

            <div id="res-loading" class="res-loading">Loading results...</div>
            <div id="res-list" style="display:none;"></div>
        </div>
    `;
}

export async function initResults() {
    const loadingEl = document.getElementById('res-loading');
    const listEl = document.getElementById('res-list');
    if (!listEl) return;

    try {
        const data = await window.api.getPublicResults();
        const results = data?.results || [];

        // Stats
        const wins = results.filter(r => r.result === 'WIN').length;
        const losses = results.filter(r => r.result === 'LOSS' || r.result === 'BOTH_MISS').length;
        const totalCents = results.reduce((sum, r) => sum + (r.stakeCents || 0), 0);

        document.getElementById('res-total-settled').textContent = results.length.toString();
        document.getElementById('res-total-won').textContent = wins.toString();
        document.getElementById('res-total-lost').textContent = losses.toString();
        document.getElementById('res-total-volume').textContent = '$' + (totalCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

        if (loadingEl) loadingEl.style.display = 'none';
        listEl.style.display = 'block';

        if (results.length === 0) {
            listEl.innerHTML = `
                <div class="res-empty">
                    <div class="res-empty-title">No settlements yet</div>
                    <div class="res-empty-text">Results will appear here as contracts are settled.</div>
                    <a href="#/overview" class="res-cta">Execute Your First Contract</a>
                </div>
            `;
            return;
        }

        listEl.innerHTML = '<div class="res-grid">' + results.map(r => {
            const isWin = r.result === 'WIN';
            const isLoss = r.result === 'LOSS' || r.result === 'BOTH_MISS';
            const isDraw = r.result === 'DRAW';
            const cls = isWin ? 'win' : isLoss ? 'loss' : 'draw';
            const icon = isWin ? '✓' : isLoss ? '✗' : '⟷';
            const label = isWin ? 'WON' : isLoss ? 'LOST' : 'DRAW';
            const amount = '$' + (r.stakeCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
            const type = r.sourceType === 'RIVALRY' ? 'Rivalry' : 'Contract';
            const platform = (r.platform || '').charAt(0) + (r.platform || '').slice(1).toLowerCase();
            const date = r.settledAt ? new Date(r.settledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

            return `
                <div class="res-card">
                    <div class="res-icon ${cls}">${icon}</div>
                    <div>
                        <div class="res-info-name">${r.principal}</div>
                        <div class="res-info-meta">
                            <span>${type}</span>
                            <span>${date}</span>
                        </div>
                    </div>
                    <div class="res-platform">${platform}</div>
                    <div class="res-amount ${cls}">${amount}</div>
                    <div><span class="res-badge ${cls}">${label}</span></div>
                </div>
            `;
        }).join('') + '</div>';

    } catch (err) {
        console.error('[Results] Load error:', err);
        if (loadingEl) loadingEl.textContent = 'Failed to load results.';
    }
}
