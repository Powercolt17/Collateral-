/**
 * Collateral — "Every contract settles in public".
 *
 * Built to the supplied register design: operator, goal, verifying oracle,
 * stake, live progress and status, under a four-figure summary bar.
 *
 * ── THE ROW DATA IS A DEMO SET ───────────────────────────────────────────────
 * ROWS and SUMMARY below are the design's own figures, shipped as specified.
 * They are NOT the register. /v1/market/homepage-stats currently reports
 * capitalLocked 2000, contractsSettled 0, totalPaidOut 0 and recentSettlements
 * [], and /v1/market/contracts carries no operator and no progress field at
 * all — the only stats object on a contract is {executions1h:0,
 * executions24h:0, capital24hCents:0, lastExecutionAt:null}.
 *
 * Two columns therefore cannot come from the API as it stands:
 *
 *   OPERATOR   needs an owner on the contract. lgFromMarket had to set party
 *              to the literal 'OPEN' because the market endpoint returns none.
 *   PROGRESS   needs current-vs-target. contractMetricCurrent holds exactly
 *              that (progressPct, computed in src/services/oracle.ts) but no
 *              public endpoint exposes it. capacityRemaining is the nearest
 *              published field and is NOT the same thing — it is how many
 *              slots are unsold, and its total is not published either, so a
 *              percentage from it would be wrong.
 *
 * SWITCHING TO LIVE IS ONE FUNCTION. Everything renders through fromApi()
 * below, which is the single seam: point it at an endpoint returning the same
 * shape and delete DEMO. Nothing else in this file knows where rows come from.
 * The shape a row needs is documented on the ROW_SHAPE comment.
 *
 * The backend work that unblocks it: expose principalIdentityUsername on the
 * market listing, and publish progressPct from contract_metric_current.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * Every selector sits under .lg and the keyframes are prefixed lg-. The sheet
 * styles bare *, body, h1, .stat, .row, .badge and .track — this ships in one
 * document with the hero, the header and the market views, so pasted as
 * authored it would restyle all of them. h2 not h1: the hero owns the page's.
 *
 * ── THE TICKER ───────────────────────────────────────────────────────────────
 * The design advances one row every 2.6s so the register reads as a live feed.
 * That is a presentation device on demo data, not an oracle read — the real
 * poll cadence is 1h for X and YouTube and 6h for Stripe and Shopify, per
 * DEFAULT_CADENCE_MS. It stops entirely under prefers-reduced-motion.
 */

const TICK_MS = 2600;

/* ROW_SHAPE — what fromApi() must return per row:
     n        register number, string
     op       { name, role, initials }
     goal     { title, sub }
     oracle   { key: stripe|shopify|youtube|x|plaid|github, name }
     stake    { value, unit }
     prog     { type: pct|ratio|count|features, cur, target }
     status   { state: live|verifying|settling, note } */
const DEMO = [
    { n: '044', op: { name: 'Jordan R.', role: 'Founder', initials: 'JR' },
      goal: { title: 'Increase Monthly Stripe Revenue', sub: 'Target +15%' },
      oracle: { key: 'stripe', name: 'Stripe' }, stake: { value: '$100', unit: 'USDC' },
      prog: { type: 'pct', cur: 8.4, target: 15 },
      status: { state: 'live', note: '9 Days Left' } },
    { n: '043', op: { name: 'Samantha C.', role: 'E-Commerce', initials: 'SC' },
      goal: { title: 'Increase Shopify GMV', sub: 'Target +25%' },
      oracle: { key: 'shopify', name: 'Shopify' }, stake: { value: '$500', unit: 'USDC' },
      prog: { type: 'pct', cur: 17.2, target: 25 },
      status: { state: 'live', note: '12 Days Left' } },
    { n: '042', op: { name: 'Alex M.', role: 'Agency Owner', initials: 'AC' },
      goal: { title: 'Close 18 New Clients', sub: 'Target 18 clients' },
      oracle: { key: 'plaid', name: 'Plaid' }, stake: { value: '$250', unit: 'USDC' },
      prog: { type: 'ratio', cur: 12, target: 18 },
      status: { state: 'live', note: '6 Days Left' } },
    { n: '041', op: { name: 'Katherine L.', role: 'SaaS Founder', initials: 'KL' },
      goal: { title: 'Launch SaaS v2', sub: 'Target product live' },
      oracle: { key: 'github', name: 'GitHub' }, stake: { value: '$300', unit: 'USDC' },
      prog: { type: 'features', cur: 80, target: 100 },
      status: { state: 'verifying', note: 'Oracle Update' } },
    { n: '040', op: { name: 'William T.', role: 'Content Creator', initials: 'WT' },
      goal: { title: 'Reach 10,000 YouTube Subscribers', sub: 'Target 10,000 subscribers' },
      oracle: { key: 'youtube', name: 'YouTube' }, stake: { value: '$150', unit: 'USDC' },
      prog: { type: 'count', cur: 7240, target: 10000 },
      status: { state: 'live', note: '14 Days Left' } },
    { n: '039', op: { name: 'Daniel W.', role: 'DTC Brand', initials: 'DW' },
      goal: { title: 'Reduce Customer Churn', sub: 'Target −20%' },
      oracle: { key: 'stripe', name: 'Stripe' }, stake: { value: '$200', unit: 'USDC' },
      prog: { type: 'pct', cur: -11.3, target: -20 },
      status: { state: 'settling', note: 'In Progress' } },
];

const SUMMARY = [
    { v: '$8.7M', l: 'Capital Locked', i: '<path d="M3 21h18M4 21V10M20 21V10M4 10l8-6 8 6M9 21v-7M15 21v-7"/>' },
    { v: '49', l: 'Live Contracts', i: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M13 20c.3-2.5 2.2-4.2 4.5-4.2S21.7 17.5 22 20"/>' },
    { v: '54', l: 'Settling Today', i: '<circle cx="12" cy="13" r="8"/><path d="M12 13V8M12 13l4 2M12 2h0"/>' },
    { v: '71%', l: 'Average Completion', i: '<path d="M3 17l5-5 4 4 8-8M15 8h5v5"/>' },
];

/** THE SEAM. Replace this body with a fetch returning ROW_SHAPE and the whole
 *  section goes live without another edit. */
function fromApi() { return DEMO; }

const MARKS = {
    stripe: '<svg viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>',
    shopify: '<svg viewBox="0 0 24 24"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
    github: '<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    plaid: '<span class="lg-mono-mark">P</span>',
};

const SHIELD = '<svg class="lg-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderRow(r) {
    const p = r.prog;
    return `
                    <div class="lg-row" data-type="${escapeHtml(p.type)}" data-cur="${escapeHtml(p.cur)}" data-target="${escapeHtml(p.target)}" data-live="${r.status.state === 'live' ? '1' : '0'}">
                        <div class="lg-n">${escapeHtml(r.n)}</div>
                        <div class="lg-op">
                            <span class="lg-ava">${escapeHtml(r.op.initials)}</span>
                            <span><span class="lg-op-name">${escapeHtml(r.op.name)}</span><span class="lg-op-role">${escapeHtml(r.op.role)}</span></span>
                        </div>
                        <div class="lg-goal"><span class="lg-g-title">${escapeHtml(r.goal.title)}</span><span class="lg-g-sub">${escapeHtml(r.goal.sub)}</span></div>
                        <div class="lg-ver">
                            <span class="lg-badge lg-b-${escapeHtml(r.oracle.key)}" aria-hidden="true">${MARKS[r.oracle.key] || ''}</span>
                            <span><span class="lg-brand">${escapeHtml(r.oracle.name)}</span><span class="lg-vtag">${SHIELD}Verified</span></span>
                        </div>
                        <div class="lg-stake"><span class="lg-st-v">${escapeHtml(r.stake.value)}</span><span class="lg-st-u">${escapeHtml(r.stake.unit)}</span></div>
                        <div class="lg-prog">
                            <span class="lg-pv">&mdash;</span>
                            <span class="lg-pt">${escapeHtml(r.goal.sub)}</span>
                            <span class="lg-pbar"><span class="lg-pfill"></span></span>
                            <span class="lg-pot">&mdash;</span>
                        </div>
                        <div class="lg-status lg-s-${escapeHtml(r.status.state)}">
                            <span class="lg-s-top"><span class="lg-sdot"></span><span class="lg-s1">${escapeHtml(r.status.state)}</span></span>
                            <span class="lg-s2">${escapeHtml(r.status.note)}</span>
                        </div>
                    </div>`;
}

export function renderLedgerSection(options = {}) {
    /* onSeeFullLedger is still honoured. The design sheet has no footer, and
       dropping it in the rebuild would have taken the only link to /ledger off
       the landing page with it — the kind of loss that leaves the route
       reachable but undiscoverable. */
    const { onSeeFullLedger } = options;
    const rows = fromApi().map(renderRow).join('');
    const stats = SUMMARY.map((s) => `
                        <div class="lg-stat">
                            <div class="lg-sv">${escapeHtml(s.v)}</div>
                            <div class="lg-sl">${escapeHtml(s.l)}</div>
                            <svg class="lg-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${s.i}</svg>
                        </div>`).join('');

    return `
        <style>
        .lg{
          --lg-parch:#F1E8D3; --lg-ink:#211B12; --lg-ink-soft:#5B5140;
          --lg-muted:#9A8C6F; --lg-faint:#B4A98C; --lg-logo:#2C2418;
          --lg-ox:#7C1D2B; --lg-win:#4E6B3E;
          --lg-line:rgba(60,48,30,.16); --lg-line-soft:rgba(60,48,30,.09);
          --lg-track:rgba(60,48,30,.14);
          --lg-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          --lg-serif:"EB Garamond",Georgia,serif;
          --lg-display:"Cormorant Garamond",Georgia,serif;
          background:var(--lg-parch);color:var(--lg-ink);
          font-family:var(--lg-serif);-webkit-font-smoothing:antialiased;
        }
        .lg *{box-sizing:border-box;margin:0;padding:0}
        .lg-wrap{width:100%;max-width:1360px;margin:0 auto;padding:51px 51px 54.4px}

        .lg-head{display:flex;justify-content:space-between;align-items:flex-start;gap:51px;margin-bottom:17px}
        .lg-head-l{min-width:0}
        .lg h2{font-family:var(--lg-display);font-weight:600;color:var(--lg-ox);
          font-size:clamp(28.9px,3.32vw,47.6px);line-height:1;text-transform:uppercase;
          font-variant:small-caps;letter-spacing:.01em;margin-bottom:15.3px}
        .lg-lede{font-size:14px;line-height:1.6;color:var(--lg-ink-soft);max-width:527px}

        .lg-sum{padding-top:5.1px}
        .lg-stats{display:flex;gap:0}
        .lg-stat{padding:0 25.5px;text-align:center;border-left:1px solid var(--lg-line)}
        .lg-stat:first-child{border-left:0;padding-left:0}
        .lg-sv{font-family:var(--lg-display);font-size:25.5px;font-weight:600;
          color:var(--lg-ink);line-height:1;font-variant-numeric:tabular-nums lining-nums}
        .lg-sl{font-family:var(--lg-mono);font-size:9px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--lg-muted);margin:6.8px 0 10.2px}
        .lg-ic{width:22.1px;height:22.1px;color:var(--lg-muted);opacity:.8;margin:0 auto;display:block}
        .lg-mkt{margin-top:17px;padding-top:11.9px;border-top:1px solid var(--lg-line);
          text-align:right;font-family:var(--lg-mono);font-size:10px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--lg-muted)}
        .lg-mkt b{color:var(--lg-ox);font-weight:500}
        .lg-mdot{display:inline-block;width:6.8px;height:6.8px;border-radius:50%;
          background:var(--lg-ox);margin-left:6.8px;vertical-align:middle;
          animation:lg-pulse 2.4s ease-out infinite}

        /* ---- table ---- */
        .lg-cols,.lg-row{display:grid;
          grid-template-columns:39.1px 212.5px minmax(195.5px,1fr) 178.5px 91.8px 197.2px 142.8px;
          column-gap:22.1px;align-items:center}
        .lg-table{margin-top:25.5px}
        .lg-cols{padding:0 0 11.9px;border-bottom:1px solid var(--lg-ink)}
        .lg-cols span{font-family:var(--lg-mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--lg-faint)}

        .lg-row{padding:18.7px 0;border-bottom:1px solid var(--lg-line-soft);position:relative}
        .lg-row::after{content:"";position:absolute;inset:0;background:rgba(124,29,43,.05);
          opacity:0;pointer-events:none}
        .lg-row.lg-flash::after{animation:lg-flash 1.1s ease-out}

        .lg-n{font-family:var(--lg-mono);font-size:10.2px;color:var(--lg-muted)}
        .lg-op{display:flex;align-items:center;gap:11.9px;min-width:0}
        .lg-ava{width:34px;height:34px;border-radius:50%;flex:none;
          border:1px solid rgba(124,29,43,.3);display:flex;align-items:center;
          justify-content:center;font-family:var(--lg-mono);font-size:10.2px;color:var(--lg-ox)}
        .lg-op-name{display:block;font-family:var(--lg-display);font-size:18.7px;
          font-weight:600;color:var(--lg-ink);line-height:1.1}
        .lg-op-role{display:block;font-family:var(--lg-mono);font-size:9.5px;
          letter-spacing:.14em;text-transform:uppercase;color:var(--lg-muted);margin-top:2.6px}

        .lg-g-title{display:block;font-family:var(--lg-display);font-size:17.8px;
          font-weight:600;color:var(--lg-ink);line-height:1.15}
        .lg-g-sub{display:block;font-family:var(--lg-mono);font-size:9.5px;
          letter-spacing:.14em;text-transform:uppercase;color:var(--lg-muted);margin-top:4.2px}

        .lg-ver{display:flex;align-items:center;gap:10.2px;min-width:0}
        .lg-badge{width:28.9px;height:28.9px;border-radius:50%;flex:none;
          border:1px solid var(--lg-line);display:flex;align-items:center;
          justify-content:center;color:var(--lg-logo)}
        .lg-badge svg{height:12.8px;width:auto;fill:currentColor;display:block}
        .lg-b-youtube svg{height:10.2px} .lg-b-github svg{height:13.6px}
        .lg-b-shopify svg{height:13.6px} .lg-b-stripe svg{height:11px}
        .lg-b-x svg{height:10.2px}
        .lg-mono-mark{font-family:var(--lg-mono);font-weight:600;font-size:11px}
        .lg-brand{display:block;font-family:var(--lg-mono);font-size:10px;
          letter-spacing:.1em;text-transform:uppercase;color:var(--lg-ink)}
        .lg-vtag{display:flex;align-items:center;gap:4.2px;font-family:var(--lg-mono);
          font-size:9px;letter-spacing:.12em;text-transform:uppercase;
          color:var(--lg-muted);margin-top:3.4px}
        .lg-shield{width:9.4px;height:9.4px;flex:none;color:var(--lg-win)}

        .lg-st-v{display:block;font-family:var(--lg-mono);font-size:13.6px;color:var(--lg-ink)}
        .lg-st-u{display:block;font-family:var(--lg-mono);font-size:9px;
          letter-spacing:.14em;color:var(--lg-muted);margin-top:3.4px}

        .lg-prog{display:flex;flex-direction:column;min-width:0}
        .lg-pv{font-family:var(--lg-mono);font-size:15.3px;font-weight:500;color:var(--lg-ox);
          letter-spacing:.01em;transition:opacity .35s ease}
        .lg-pv.lg-tick{animation:lg-tick .55s ease}
        .lg-pt{font-family:var(--lg-mono);font-size:9.5px;letter-spacing:.14em;
          text-transform:uppercase;color:var(--lg-muted);margin-top:4.2px}
        .lg-pbar{position:relative;height:2px;background:var(--lg-track);
          margin:9.4px 0 6.8px;border-radius:2px;overflow:hidden}
        .lg-pfill{position:absolute;left:0;top:0;height:100%;width:0;background:var(--lg-ox);
          opacity:.55;border-radius:2px;transition:width .9s cubic-bezier(.22,1,.36,1)}
        .lg-pot{font-family:var(--lg-mono);font-size:9px;letter-spacing:.14em;
          text-transform:uppercase;color:var(--lg-faint)}

        .lg-status{display:flex;flex-direction:column}
        .lg-s-top{display:flex;align-items:center;gap:6.8px}
        .lg-sdot{width:6px;height:6px;border-radius:50%;background:var(--lg-muted);flex:none}
        .lg-s1{font-family:var(--lg-mono);font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;font-weight:500;color:var(--lg-ink-soft)}
        .lg-s2{font-family:var(--lg-mono);font-size:9.5px;letter-spacing:.12em;
          text-transform:uppercase;color:var(--lg-muted);margin-top:5.1px;transition:opacity .4s ease}
        .lg-s-live .lg-sdot{background:var(--lg-ox);animation:lg-pulse 2.4s ease-out infinite}
        .lg-s-live .lg-s1{color:var(--lg-ox)}
        .lg-s-verifying .lg-sdot{background:var(--lg-ox);animation:lg-pulse 1.5s ease-out infinite}
        .lg-s-verifying .lg-s1{color:var(--lg-ox)}
        .lg-s-settling .lg-sdot{background:var(--lg-ink-soft)}
        .lg-s2.lg-fade{opacity:0}

        @keyframes lg-pulse{0%{box-shadow:0 0 0 0 rgba(124,29,43,.45)}
          70%{box-shadow:0 0 0 5.1px rgba(124,29,43,0)}100%{box-shadow:0 0 0 0 rgba(124,29,43,0)}}
        @keyframes lg-tick{0%{opacity:.35;transform:translateY(-1px)}100%{opacity:1;transform:none}}
        @keyframes lg-flash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}

        .lg-foot{display:flex;justify-content:space-between;align-items:center;gap:20.4px;
          margin-top:28.9px;padding-top:17px;border-top:1px solid var(--lg-line);
          font-family:var(--lg-mono);font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--lg-muted);flex-wrap:wrap}
        .lg-foot b{color:var(--lg-ink-soft);font-weight:500}
        .lg-link{background:none;border:0;cursor:pointer;font-family:var(--lg-mono);
          font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--lg-ink);
          font-weight:500;border-bottom:1.5px solid var(--lg-ox);padding-bottom:4.2px;
          white-space:nowrap;transition:color .16s ease}
        .lg-link:hover{color:var(--lg-ox)}
        .lg-link:focus-visible{outline:2px solid var(--lg-ox);outline-offset:2.6px}
        .lg-arw{color:var(--lg-ox);margin-left:5.1px}

        @media (max-width:1180px){
          .lg-cols,.lg-row{grid-template-columns:34px 144.5px minmax(0,1fr) 127.5px 76.5px 144.5px 110.5px;
            column-gap:13.6px}
          .lg-op-name,.lg-g-title{font-size:15.3px}
          .lg-ava{width:27.2px;height:27.2px}
        }
        @media (max-width:900px){
          .lg-wrap{padding:28.9px 17px 25.5px}
          .lg-head{flex-direction:column;gap:22.1px}
          .lg-stats{flex-wrap:wrap;gap:11.9px 0}
          .lg-stat{flex:1 1 40%;padding:0 10.2px;text-align:left}
          .lg-stat:first-child{padding-left:0}
          .lg-ic{margin:0}
          .lg-mkt{text-align:left}
          /* The seven-column grid cannot hold at phone width. The row becomes two
             stacked bands: operator and goal, then the numbers. Verified-by and
             the register number drop — the oracle is named in the goal sub and
             the number is a filing detail, not something a phone reader needs. */
          .lg-cols{display:none}
          .lg-row{grid-template-columns:minmax(0,1fr) 81.6px;column-gap:10.2px;
            row-gap:10.2px;padding:13.6px 0}
          .lg-n,.lg-ver{display:none}
          .lg-op{grid-column:1/-1}
          .lg-goal{grid-column:1/-1}
          .lg-op-name{font-size:14.4px} .lg-g-title{font-size:14.4px}
          .lg-prog{grid-column:1;} .lg-status{grid-column:2;align-items:flex-end}
          .lg-stake{grid-row:3;grid-column:2;text-align:right}
        }
        @media (prefers-reduced-motion:reduce){
          .lg-mdot,.lg-sdot,.lg-pv,.lg-pfill,.lg-s2,.lg-row::after{
            animation:none !important;transition:none !important}
        }
        </style>

        <section class="lg" aria-labelledby="lg-title">
            <div class="lg-wrap">
                <div class="lg-head">
                    <div class="lg-head-l">
                        <h2 id="lg-title">Every contract<br />settles in public</h2>
                        <p class="lg-lede">Every contract follows the same rules. Performance is
                            verified by the connected data source, settlement happens automatically,
                            and the final result becomes part of a permanent public execution record.
                            No discretion. No negotiation after the deadline.</p>
                    </div>
                    <div class="lg-sum">
                        <div class="lg-stats">${stats}
                        </div>
                        <div class="lg-mkt">Market Status: <b>Live</b><span class="lg-mdot"></span></div>
                    </div>
                </div>

                <div class="lg-table">
                    <div class="lg-cols">
                        <span>&#8470;</span><span>Operator</span><span>Goal</span>
                        <span>Verified By</span><span>At Stake</span><span>Progress</span><span>Status</span>
                    </div>${rows}
                </div>

                <div class="lg-foot">
                    <span>Verification is automatic &middot; <b>No appeals</b> &middot; <b>No extensions</b></span>
                    <button type="button" class="lg-link"${onSeeFullLedger ? ` onclick="${onSeeFullLedger}"` : ''}>See the full ledger <span class="lg-arw">&rarr;</span></button>
                </div>
            </div>
        </section>
    `;
}

/**
 * Drives the progress readouts. Safe to call when the section is absent.
 *
 * The advance is a presentation device on demo data, not an oracle read — the
 * real cadence is 1h for X and YouTube and 6h for Stripe and Shopify. It never
 * runs under prefers-reduced-motion, and it never crosses the target: each type
 * clamps below 100% so a row cannot appear to have settled itself on screen.
 */
export function initLedgerSection() {
    const section = document.querySelector('.lg');
    if (!section) return;

    const reduce = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rows = [...section.querySelectorAll('.lg-row')].map((el) => ({
        el,
        type: el.dataset.type,
        cur: Number(el.dataset.cur),
        target: Number(el.dataset.target),
        live: el.dataset.live === '1',
        pv: el.querySelector('.lg-pv'),
        pot: el.querySelector('.lg-pot'),
        fill: el.querySelector('.lg-pfill'),
    }));
    if (!rows.length) return;

    const pctOf = (r) => {
        if (r.type === 'pct') return Math.abs(r.cur) / Math.abs(r.target) * 100;
        if (r.type === 'features') return r.cur;
        return r.cur / r.target * 100;
    };
    const fmt = (r) => {
        if (r.type === 'pct') return (r.cur < 0 ? '−' : '+') + Math.abs(r.cur).toFixed(1) + '%';
        if (r.type === 'ratio') return Math.round(r.cur) + ' / ' + r.target;
        if (r.type === 'count') return Math.round(r.cur).toLocaleString('en-US');
        return Math.round(r.cur) + '%';
    };
    const paint = (r, tick) => {
        const pct = Math.min(100, pctOf(r));
        r.pv.textContent = fmt(r);
        r.pot.textContent = Math.round(pct) + '% of target';
        r.fill.style.width = pct + '%';
        if (tick && !reduce) {
            r.pv.classList.remove('lg-tick'); void r.pv.offsetWidth; r.pv.classList.add('lg-tick');
            r.el.classList.remove('lg-flash'); void r.el.offsetWidth; r.el.classList.add('lg-flash');
        }
    };
    rows.forEach((r) => paint(r, false));
    if (reduce) return;

    const liveRows = rows.filter((r) => r.live);
    if (liveRows.length) {
        let idx = 0;
        setInterval(() => {
            const r = liveRows[idx % liveRows.length];
            idx += 1;
            const k = Math.abs((Math.sin(idx * 12.9898) * 43758.5453) % 1);
            if (r.type === 'pct') {
                r.cur = Math.min(Math.abs(r.target) * 0.985, Math.abs(r.cur) + (0.1 + k * 0.35))
                    * (r.target < 0 ? -1 : 1);
            } else if (r.type === 'ratio') {
                r.cur = Math.min(r.target - 1, r.cur + (k > 0.55 ? 1 : 0));
            } else if (r.type === 'count') {
                r.cur = Math.min(r.target * 0.985, r.cur + Math.round(30 + k * 160));
            }
            paint(r, true);
        }, TICK_MS);
    }

    const vsub = section.querySelector('.lg-s-verifying .lg-s2');
    if (vsub) {
        const states = ['Oracle Update', 'Syncing…', 'Reading Repo'];
        let vi = 0;
        setInterval(() => {
            vsub.classList.add('lg-fade');
            setTimeout(() => {
                vi = (vi + 1) % states.length;
                vsub.textContent = states[vi];
                vsub.classList.remove('lg-fade');
            }, 400);
        }, 3200);
    }
}
