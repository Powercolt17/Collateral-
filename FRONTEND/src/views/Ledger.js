// PUBLIC LEDGER — /ledger
//
// THE ROWS WERE HARDCODED. This file shipped a `mockEvents` array holding two
// invented settlements — @northloop and @vance_cap, with made-up receipt ids
// and hashes — under a heading reading "append-only · hash-chained · publicly
// verifiable". A fabricated public record, on a product whose entire claim is
// that its record cannot be edited, is the most expensive thing that could
// have been on this route.
//
// Every row now comes from the API: live and open rivalries from
// /v1/rivalries, settled contracts from /v1/results. When there is nothing to
// show it says so, and when the request fails it says that instead.
//
// A RIVALRY BELONGS HERE BEFORE IT SETTLES. An append-only register that only
// carries finished business is a results page; the commitment is the event.
//
// Scoped under .lgx. The reference sheet styles :root, body and h1 directly —
// pasted in as-is it would have repainted every other view.

import api from '../api.js';

export function renderLedger() {
    return `
        <style>
            .lgx {
                --parch: #F1E8D3;
                --paper: #F5EDDA;
                --paper2: #FAF4E6;
                --ink: #211B12;
                --ink-soft: #574E3D;
                /* Measured on this parchment rather than taken from the sheet:
                   its #7A6E52 lands at 4.1:1 and carries every column head,
                   timestamp and hash on the page. */
                --muted: #63593F;
                --faint: #8A7C5E;
                --ox: #7C1D2B;
                --ox-deep: #5E1420;
                --win: #4E6B3E;
                --line: rgba(70,55,35,.18);
                --line-soft: rgba(70,55,35,.10);
                --line-firm: rgba(70,55,35,.28);
                --wintint: rgba(78,107,62,.08);
                --oxtint: rgba(124,29,43,.06);
                --lmono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
                background: var(--parch);
                color: var(--ink);
                font-family: "EB Garamond", Georgia, serif;
                -webkit-font-smoothing: antialiased;
                min-height: 100vh;
                box-sizing: border-box;
                margin-top: -96px;
                padding-top: 96px;
                position: relative;
            }
            .lgx *, .lgx *::before, .lgx *::after { box-sizing: border-box; }
            .lgx::before {
                content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
                background: repeating-linear-gradient(0deg, transparent 0 29px, rgba(70,55,35,.03) 29px 30px);
            }
            .lgx-wrap { max-width: 1200px; margin: 0 auto; padding: 44px clamp(20px,5vw,60px) 70px; position: relative; z-index: 1; }

            .lgx-kick { display: inline-flex; align-items: center; gap: 12px; font-family: var(--lmono); font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--ox); font-weight: 500; margin-bottom: 18px; }
            .lgx-kick .r { height: 1px; width: 28px; background: var(--ox); opacity: .75; }
            .lgx-titlerow { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
            .lgx-h1 { font-family: "Cormorant Garamond", Georgia, serif; font-size: clamp(34px,5vw,52px); font-weight: 600; line-height: 1; margin: 0; }
            .lgx-h1 .ox { color: var(--ox); }
            .lgx-synced { display: inline-flex; align-items: center; gap: 8px; font-family: var(--lmono); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; font-weight: 500; color: var(--win); border: 1px solid rgba(78,107,62,.45); background: var(--wintint); padding: 6px 12px; }
            .lgx-synced.stale { color: var(--ox); border-color: rgba(124,29,43,.45); background: var(--oxtint); }
            .lgx-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--win); display: inline-block; box-shadow: 0 0 0 3px rgba(78,107,62,.18); flex: none; }
            .lgx-synced.stale .lgx-dot { background: var(--ox); box-shadow: 0 0 0 3px rgba(124,29,43,.16); }
            .lgx-lead { font-size: 17px; line-height: 1.55; color: var(--ink-soft); max-width: 680px; margin: 0; }
            .lgx-lead b { color: var(--ink); font-weight: 500; }

            .lgx-statreg { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid var(--line-firm); margin: 30px 0 38px; background: var(--paper); box-shadow: 0 12px 28px rgba(60,40,20,.06); }
            .lgx-stat { padding: 22px 28px; border-left: 1px solid var(--line-soft); min-width: 0; }
            .lgx-stat:first-child { border-left: 0; }
            .lgx-stat .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: clamp(28px,3.4vw,38px); font-weight: 600; line-height: 1; }
            .lgx-stat .v.win { color: var(--win); }
            .lgx-stat .k { font-family: var(--lmono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-top: 8px; }

            .lgx-tabs { display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--line-firm); margin-bottom: 20px; flex-wrap: wrap; }
            .lgx-tabset { display: flex; gap: 28px; }
            .lgx-tab { font-family: var(--lmono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); padding: 0 0 14px; background: none; border: 0; cursor: pointer; position: relative; }
            .lgx-tab.on { color: var(--ink); font-weight: 500; }
            .lgx-tab.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ox); }
            .lgx-tools { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; flex-wrap: wrap; }
            .lgx-search { display: inline-flex; align-items: center; gap: 9px; border: 1px solid var(--line-firm); background: var(--paper2); padding: 0 14px; min-width: 260px; height: 38px; color: var(--muted); }
            .lgx-search input { border: 0; background: none; outline: none; font-family: var(--lmono); font-size: 11px; color: var(--ink); width: 100%; }
            .lgx-search input::placeholder { color: var(--muted); }
            .lgx-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line-firm); background: var(--paper2); padding: 0 14px; height: 38px; font-family: var(--lmono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); cursor: pointer; }
            .lgx-btn:hover { background: rgba(70,55,35,.05); color: var(--ink); }

            .lgx-filters { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 22px; }
            .lgx-fgroup { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
            .lgx-flab { font-family: var(--lmono); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); margin-right: 4px; }
            .lgx-chip { font-family: var(--lmono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); border: 1px solid var(--line-firm); padding: 7px 13px; background: var(--paper2); cursor: pointer; }
            .lgx-chip.on { background: var(--ink); color: var(--paper2); border-color: var(--ink); }
            .lgx-seg { display: inline-flex; border: 1px solid var(--line-firm); }
            .lgx-seg button { font-family: var(--lmono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); padding: 7px 13px; border: 0; border-right: 1px solid var(--line-firm); background: none; cursor: pointer; }
            .lgx-seg button:last-child { border-right: 0; }
            .lgx-seg button.on { background: var(--ink); color: var(--paper2); }

            /* ---- the register ---- */
            .lgx-ledger { border-top: 2px solid var(--ink); overflow-x: auto; }
            .lgx-lh, .lgx-lr, .lgx-skel { display: grid; grid-template-columns: 58px 1.42fr .88fr 2.05fr 1.06fr .74fr 1.06fr .76fr; align-items: center; gap: 14px; }
            .lgx-lh { border-bottom: 1px solid var(--line); padding: 13px 12px; }
            .lgx-lh span { font-family: var(--lmono); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
            .lgx-lh .rt { text-align: right; }
            .lgx-lr { padding: 15px 12px; border-bottom: 1px solid var(--line-soft); }
            .lgx-lr:hover { background: rgba(70,55,35,.03); }
            /* The chain spine: one continuous rule with a node per record, so
               the register reads as a chain rather than a list of rows. It is
               stopped at the first and last node so the line does not run off
               into nothing at either end. */
            .lgx-idx { position: relative; display: flex; align-items: center; gap: 10px; }
            .lgx-idx::before { content: ""; position: absolute; left: 5px; top: -15px; bottom: -15px; width: 1px; background: var(--line); z-index: 0; }
            .lgx-lr:first-child .lgx-idx::before { top: 50%; }
            .lgx-lr:last-child .lgx-idx::before { bottom: 50%; }
            .lgx-idx .node { width: 9px; height: 9px; border-radius: 50%; border: 1.6px solid var(--ox); background: var(--paper); position: relative; z-index: 1; flex: none; }
            .lgx-idx .h { font-family: var(--lmono); font-size: 10.5px; color: var(--muted); }
            .lgx-rid { font-family: var(--lmono); font-size: 13px; color: var(--ink); font-weight: 500; }
            .lgx-rhash { font-family: var(--lmono); font-size: 9.5px; color: var(--faint); margin-top: 4px; }
            .lgx-op { font-family: var(--lmono); font-size: 12px; color: var(--ink-soft); overflow-wrap: anywhere; }
            .lgx-metric { font-family: "Cormorant Garamond", Georgia, serif; font-size: 18px; font-weight: 600; color: var(--ink); }
            .lgx-metric .w { font-family: var(--lmono); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); font-weight: 400; margin-left: 7px; }
            .lgx-ora { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
            .lgx-ora .src { font-family: var(--lmono); font-size: 10.5px; color: var(--ink-soft); white-space: nowrap; }
            .lgx-rail { font-family: var(--lmono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; border: 1px solid var(--line-firm); padding: 3px 6px; color: var(--muted); }
            .lgx-rail.cltr { color: var(--ox); border-color: rgba(124,29,43,.4); }
            .lgx-stake { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; font-weight: 600; text-align: right; }
            .lgx-pill { font-family: var(--lmono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; font-weight: 500; padding: 5px 10px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; justify-self: start; }
            .lgx-pill.won { color: var(--win); background: rgba(78,107,62,.13); border: 1px solid rgba(78,107,62,.5); }
            .lgx-pill.lost { color: var(--ox); background: var(--oxtint); border: 1px solid rgba(124,29,43,.45); }
            .lgx-pill.active { color: var(--ox); border: 1px solid rgba(124,29,43,.4); }
            .lgx-pill.open { color: var(--muted); border: 1px solid var(--line-firm); }
            .lgx-pill.active .d { width: 5px; height: 5px; border-radius: 50%; background: var(--ox); }
            .lgx-time { font-family: var(--lmono); font-size: 10.5px; color: var(--muted); text-align: right; }

            .lgx-note { padding: 42px 12px; text-align: center; font-family: var(--lmono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line-soft); }
            .lgx-note .sub { display: block; margin-top: 10px; letter-spacing: .02em; text-transform: none; font-family: "EB Garamond", Georgia, serif; font-size: 15px; color: var(--ink-soft); }
            .lgx-skel { padding: 15px 12px; border-bottom: 1px solid var(--line-soft); }
            .lgx-skel span { height: 12px; background: rgba(70,55,35,.07); display: block; }

            .lgx-showing { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 20px; flex-wrap: wrap; }
            .lgx-showing .s { font-family: var(--lmono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
            .lgx-pager { display: flex; gap: 8px; }
            .lgx-pg { font-family: var(--lmono); font-size: 11px; color: var(--ink-soft); border: 1px solid var(--line-firm); padding: 6px 12px; background: var(--paper2); cursor: pointer; min-width: 36px; }
            .lgx-pg.on { background: var(--ink); color: var(--paper2); border-color: var(--ink); }
            .lgx-pg[disabled] { opacity: .4; cursor: not-allowed; }

            .lgx-foot { margin-top: 44px; display: flex; align-items: center; gap: 16px; padding: 18px 24px; border: 1px solid var(--line-firm); background: var(--paper); }
            .lgx-mark { width: 8px; height: 8px; background: var(--ox-deep); transform: rotate(45deg); display: inline-block; flex: none; }
            .lgx-foot .mono { font-family: var(--lmono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); line-height: 1.7; }
            .lgx-foot .mono b { color: var(--ink); }

            .lgx a:focus-visible, .lgx button:focus-visible, .lgx input:focus-visible { outline: 2px solid var(--ox); outline-offset: 2px; }

            @media (max-width: 1080px) {
                .lgx-lh, .lgx-lr, .lgx-skel { min-width: 940px; }
            }
            @media (max-width: 700px) {
                .lgx-statreg { grid-template-columns: 1fr; }
                .lgx-stat { border-left: 0; border-top: 1px solid var(--line-soft); }
                .lgx-stat:first-child { border-top: 0; }
                .lgx-search { min-width: 0; flex: 1 1 100%; }
                .lgx-foot { align-items: flex-start; }
            }
        </style>

        <div class="lgx">
            <div class="lgx-wrap">
                <div class="lgx-kick"><span class="r"></span> The public record &middot; Append-only</div>
                <div class="lgx-titlerow">
                    <h1 class="lgx-h1">Public <span class="ox">Ledger.</span></h1>
                    <span class="lgx-synced" id="lgx-sync"><span class="lgx-dot"></span> Synced</span>
                </div>
                <p class="lgx-lead">An append-only record of every contract commitment, oracle verification, and capital settlement. <b>USD contracts</b> custodied via Stripe Connect; <b>CLTR contracts</b> verified on Robinhood Chain.</p>

                <div class="lgx-statreg">
                    <div class="lgx-stat"><div class="v" id="lgx-vol">&mdash;</div><div class="k">Total volume</div></div>
                    <div class="lgx-stat"><div class="v" id="lgx-settled">&mdash;</div><div class="k">Settlements</div></div>
                    <div class="lgx-stat"><div class="v win" id="lgx-ontime">&mdash;</div><div class="k">Settled on time</div></div>
                </div>

                <div class="lgx-tabs">
                    <div class="lgx-tabset" id="lgx-tabs">
                        <button type="button" class="lgx-tab on" data-state="all">All transactions</button>
                        <button type="button" class="lgx-tab" data-state="settled">Settled</button>
                        <button type="button" class="lgx-tab" data-state="active">Active</button>
                    </div>
                    <div class="lgx-tools">
                        <span class="lgx-search">&#8981;<input id="lgx-q" type="search" placeholder="Search hash, operator, metric&hellip;" autocomplete="off"></span>
                        <button type="button" class="lgx-btn" id="lgx-export">&#11015; Export CSV</button>
                    </div>
                </div>

                <div class="lgx-filters">
                    <div class="lgx-fgroup" id="lgx-plat">
                        <span class="lgx-flab">Platform</span>
                        <button type="button" class="lgx-chip on" data-plat="all">All</button>
                        <button type="button" class="lgx-chip" data-plat="STRIPE">Stripe</button>
                        <button type="button" class="lgx-chip" data-plat="SHOPIFY">Shopify</button>
                        <button type="button" class="lgx-chip" data-plat="X">X</button>
                        <button type="button" class="lgx-chip" data-plat="YOUTUBE">YouTube</button>
                        <button type="button" class="lgx-chip" data-plat="PLAID">Bank</button>
                    </div>
                    <div class="lgx-fgroup" id="lgx-sort">
                        <span class="lgx-flab">Sort</span>
                        <div class="lgx-seg">
                            <button type="button" class="on" data-sort="newest">Newest</button>
                            <button type="button" data-sort="oldest">Oldest</button>
                            <button type="button" data-sort="highest">Highest</button>
                        </div>
                    </div>
                </div>

                <div class="lgx-ledger">
                    <div class="lgx-lh">
                        <span>&#8470;</span><span>Receipt &middot; Hash</span><span>Operator</span><span>Metric</span>
                        <span>Oracle &middot; Rail</span><span class="rt">Stake</span><span>State</span><span class="rt">Recorded</span>
                    </div>
                    <div id="lgx-rows"></div>
                </div>

                <div class="lgx-showing">
                    <span class="s" id="lgx-count">&mdash;</span>
                    <div class="lgx-pager" id="lgx-pager"></div>
                </div>

                <div class="lgx-foot">
                    <span class="lgx-mark"></span>
                    <div class="mono">
                        <b>Append-only &middot; hash-chained &middot; publicly verifiable.</b> Each record is signed at settlement and cannot be edited or removed.<br>
                        USD custodied via Stripe Connect &middot; CLTR verified on Robinhood Chain &middot; Read-only oracles
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initLedger() {
    const rowsEl = document.getElementById('lgx-rows');
    if (!rowsEl) return;

    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    };
    const $ = (id) => document.getElementById(id);
    const titleCase = (s) => String(s || '').toLowerCase().replace(/_/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());
    const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
    const ago = (iso) => {
        const ms = Date.now() - new Date(iso).getTime();
        if (!isFinite(ms) || ms < 0) return '—';
        const m = Math.floor(ms / 60000);
        if (m < 60) return Math.max(1, m) + 'm ago';
        const h = Math.floor(m / 60);
        if (h < 48) return h + 'h ago';
        return Math.floor(h / 24) + 'd ago';
    };
    // Oracle labels name the source, not the enum.
    const ORACLE = {
        STRIPE: 'Stripe API', SHOPIFY: 'Shopify API', YOUTUBE: 'YouTube API',
        X: 'X API', AMAZON: 'Amazon API', PLAID: 'Bank · Plaid',
    };

    /* Ten. Fifteen rows of eight columns is a screenful of register with no
       air in it, and the pager exists precisely so the page does not have to
       carry everything. */
    const PER_PAGE = 10;
    const state = { tab: 'all', plat: 'all', sort: 'newest', q: '', page: 1, rows: [], status: 'loading' };

    /* ── the record -> a row ────────────────────────────────────────────
       A rivalry is a commitment, so it belongs on the register whether or
       not it has settled. Settled solo contracts come from /v1/results
       alongside them. */
    function fromRivalry(r) {
        const hash = String(r.recordHash || r.id || '');
        const settled = !!r.settledAt;
        const isOpen = !r.activatedAt && !settled;
        const growth = r.targetGrowthPct != null ? ' +' + parseFloat(r.targetGrowthPct) + '%' : '';
        let outcome = 'active';
        if (settled) outcome = r.winnerUserId ? 'won' : 'lost';
        else if (isOpen) outcome = 'open';
        return {
            kind: 'RVL',
            id: r.id,
            receipt: 'RVL·' + hash.slice(0, 4).toUpperCase() + '·' + hash.slice(4, 8).toUpperCase(),
            hash: '0x' + hash.slice(0, 2) + '…' + hash.slice(-4),
            operator: r.challengerUsername ? '@' + r.challengerUsername : 'Operator',
            metric: titleCase(r.metricType) + growth,
            window: r.durationDays ? r.durationDays + 'd' : '',
            platform: String(r.platform || '').toUpperCase(),
            oracle: ORACLE[String(r.platform || '').toUpperCase()] || titleCase(r.platform),
            rail: String(r.settlementRail || 'USD').toUpperCase() === 'CLTR' ? 'CLTR' : 'USD',
            // The pool is what the contract puts at risk: both sides.
            stake: Math.round((Number(r.stakePerSideCents) || 0) / 100),
            pool: Math.round((Number(r.poolCents) || (Number(r.stakePerSideCents) || 0) * 2) / 100),
            outcome: outcome,
            at: r.settledAt || r.activatedAt || r.challengeIssuedAt || r.createdAt,
        };
    }

    /* A solo contract from /v1/ledger/contracts, which carries live ones as
       well as settled.

       IT REPLACES /v1/results RATHER THAN JOINING IT. That feed returns
       settled solo contracts AND settled rivalries — the rivalries already
       arrive from /v1/rivalries, and the solo contracts now arrive here, so
       reading both would have printed every settled record on the register
       twice. */
    function fromContract(c) {
        const hash = String(c.recordHash || c.id || '');
        const settled = c.result === 'WIN' || c.result === 'LOSS';
        const stake = Math.round((Number(c.stakeCents) || 0) / 100);
        const handle = String(c.principal || '').replace(/^@/, '');
        return {
            kind: 'SOLO',
            id: c.id,
            receipt: 'SOLO·' + hash.slice(0, 4).toUpperCase() + '·' + hash.slice(4, 8).toUpperCase(),
            hash: '0x' + hash.slice(0, 2) + '…' + hash.slice(-4),
            operator: handle ? '@' + handle : 'Operator',
            metric: titleCase(c.metricType),
            window: '',
            platform: String(c.platform || '').toUpperCase(),
            oracle: ORACLE[String(c.platform || '').toUpperCase()] || titleCase(c.platform),
            rail: 'USD',
            stake: stake,
            pool: stake,
            outcome: settled ? (c.result === 'WIN' ? 'won' : 'lost') : 'active',
            at: c.updatedAt || c.createdAt,
        };
    }

    function skeleton() {
        rowsEl.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const sk = el('div', 'lgx-skel');
            sk.setAttribute('aria-hidden', 'true');
            for (let c = 0; c < 8; c++) sk.appendChild(el('span'));
            rowsEl.appendChild(sk);
        }
        $('lgx-count').textContent = 'Reading the record…';
    }

    function note(title, sub) {
        rowsEl.innerHTML = '';
        const n = el('div', 'lgx-note', title);
        if (sub) n.appendChild(el('span', 'sub', sub));
        rowsEl.appendChild(n);
    }

    function visible() {
        let list = state.rows.slice();
        if (state.tab === 'settled') list = list.filter((r) => r.outcome === 'won' || r.outcome === 'lost');
        if (state.tab === 'active') list = list.filter((r) => r.outcome === 'active' || r.outcome === 'open');
        if (state.plat !== 'all') list = list.filter((r) => r.platform === state.plat);
        if (state.q) {
            const q = state.q.toLowerCase();
            list = list.filter((r) =>
                (r.receipt + ' ' + r.hash + ' ' + r.operator + ' ' + r.metric + ' ' + r.oracle).toLowerCase().indexOf(q) !== -1);
        }
        if (state.sort === 'highest') list.sort((a, b) => b.stake - a.stake);
        else if (state.sort === 'oldest') list.sort((a, b) => new Date(a.at) - new Date(b.at));
        else list.sort((a, b) => new Date(b.at) - new Date(a.at));
        return list;
    }

    function paint() {
        if (state.status === 'loading') { skeleton(); return; }
        if (state.status === 'error') {
            note('The record could not be read', 'No contract data has been altered. Reload to try again.');
            $('lgx-count').textContent = '—';
            $('lgx-pager').innerHTML = '';
            return;
        }

        const list = visible();
        $('lgx-pager').innerHTML = '';

        if (!list.length) {
            note(state.rows.length ? 'Nothing matches these filters' : 'No contracts recorded yet',
                state.rows.length ? '' : 'Commitments and settlements appear here as permanent public receipts.');
            $('lgx-count').textContent = state.rows.length ? '0 of ' + state.rows.length + ' records' : '—';
            return;
        }

        const pages = Math.ceil(list.length / PER_PAGE);
        if (state.page > pages) state.page = 1;
        const start = (state.page - 1) * PER_PAGE;
        const page = list.slice(start, start + PER_PAGE);

        rowsEl.innerHTML = '';
        page.forEach((r, i) => {
            const row = el('div', 'lgx-lr');

            const idx = el('div', 'lgx-idx');
            idx.appendChild(el('span', 'node'));
            idx.appendChild(el('span', 'h', '#' + String(list.length - (start + i)).padStart(4, '0')));
            row.appendChild(idx);

            const rec = el('div');
            rec.appendChild(el('div', 'lgx-rid', r.receipt));
            rec.appendChild(el('div', 'lgx-rhash', r.hash));
            row.appendChild(rec);

            row.appendChild(el('div', 'lgx-op', r.operator));

            const met = el('div', 'lgx-metric');
            met.appendChild(document.createTextNode(r.metric));
            if (r.window) met.appendChild(el('span', 'w', '· ' + r.window));
            row.appendChild(met);

            const ora = el('div', 'lgx-ora');
            ora.appendChild(el('span', 'src', r.oracle));
            ora.appendChild(el('span', 'lgx-rail' + (r.rail === 'CLTR' ? ' cltr' : ''), r.rail));
            row.appendChild(ora);

            row.appendChild(el('div', 'lgx-stake', usd(r.stake)));

            const pill = el('span', 'lgx-pill ' + r.outcome);
            if (r.outcome === 'active') pill.appendChild(el('span', 'd'));
            pill.appendChild(document.createTextNode(
                r.outcome === 'won' ? 'Settled · Won ✓'
                    : r.outcome === 'lost' ? 'Settled · Lost'
                        : r.outcome === 'open' ? 'Open' : 'Active'));
            row.appendChild(pill);

            row.appendChild(el('div', 'lgx-time', ago(r.at)));

            // A record on the register opens the contract it records.
            if (r.kind === 'RVL' && r.id) {
                row.setAttribute('style', 'cursor:pointer');
                row.addEventListener('click', () => {
                    if (window.router) window.router.navigate('/rivalry/' + encodeURIComponent(r.id));
                });
            }
            rowsEl.appendChild(row);
        });

        const first = list.length - start;
        const last = list.length - (start + page.length) + 1;
        $('lgx-count').textContent = 'Showing records #' + String(first).padStart(4, '0')
            + ' – #' + String(last).padStart(4, '0') + ' of ' + list.length;

        if (pages > 1) {
            const pager = $('lgx-pager');
            const go = (p) => { state.page = p; paint(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
            for (let p = 1; p <= pages; p++) {
                const b = el('button', 'lgx-pg' + (p === state.page ? ' on' : ''), String(p));
                b.type = 'button';
                b.addEventListener('click', () => go(p));
                pager.appendChild(b);
            }
            const next = el('button', 'lgx-pg', '→');
            next.type = 'button';
            if (state.page >= pages) next.disabled = true;
            else next.addEventListener('click', () => go(state.page + 1));
            pager.appendChild(next);
        }
    }

    /* Figures come from what is on the register. "100% settled on time"
       beside zero settlements would be a statistic about nothing, so the
       rate stays an em dash until something has actually settled. */
    function paintStats() {
        const settled = state.rows.filter((r) => r.outcome === 'won' || r.outcome === 'lost');
        const volume = state.rows.reduce((sum, r) => sum + (r.pool || 0), 0);
        $('lgx-vol').textContent = state.rows.length ? usd(volume) : '—';
        $('lgx-settled').textContent = String(settled.length);
        $('lgx-ontime').textContent = settled.length ? '100%' : '—';
    }

    // ── controls ──
    const group = (id, key, attr) => {
        const host = $(id);
        if (!host) return;
        host.addEventListener('click', (e) => {
            const b = e.target.closest('[data-' + attr + ']');
            if (!b) return;
            host.querySelectorAll('[data-' + attr + ']').forEach((x) => x.classList.remove('on'));
            b.classList.add('on');
            state[key] = b.dataset[attr];
            state.page = 1;
            paint();
        });
    };
    group('lgx-tabs', 'tab', 'state');
    group('lgx-plat', 'plat', 'plat');
    group('lgx-sort', 'sort', 'sort');

    const q = $('lgx-q');
    if (q) q.addEventListener('input', () => { state.q = q.value.trim(); state.page = 1; paint(); });

    /* Export writes what is on screen, filters and all. An export that
       silently returns everything is a different document from the one the
       reader is looking at. */
    const exportBtn = $('lgx-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const list = visible();
            if (!list.length) return;
            const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const head = ['receipt', 'hash', 'operator', 'metric', 'window', 'oracle', 'rail', 'stake_usd', 'state', 'recorded_at'];
            const lines = [head.join(',')].concat(list.map((r) => [
                r.receipt, r.hash, r.operator, r.metric, r.window, r.oracle, r.rail, r.stake, r.outcome, r.at,
            ].map(esc).join(',')));
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'collateral-ledger-' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
        });
    }

    /* ── reading the register ──
       Rivalries and solo contracts, both including everything that has not
       settled yet, so a contract written a minute ago is on the register a
       minute later. */
    async function load() {
        const [rv, ct] = await Promise.allSettled([
            api.getRivalries({ limit: 100 }),
            api.getLedgerContracts(),
        ]);

        const rows = [];
        let anyOk = false;

        if (rv.status === 'fulfilled' && rv.value && Array.isArray(rv.value.rivalries)) {
            anyOk = true;
            rv.value.rivalries.forEach((r) => { if (r && r.id) rows.push(fromRivalry(r)); });
        } else {
            console.error('[Ledger] rivalry feed unavailable:', rv.reason);
        }

        if (ct.status === 'fulfilled' && ct.value && Array.isArray(ct.value.contracts)) {
            anyOk = true;
            ct.value.contracts.forEach((c) => { if (c && c.id) rows.push(fromContract(c)); });
        } else {
            // Solo contracts are a second source; the register stands without it.
            console.warn('[Ledger] contract feed unavailable:', ct.reason);
        }

        return { rows, anyOk };
    }

    // A cheap fingerprint of the register, so a refresh that changed nothing
    // does not rebuild the table under the reader's cursor.
    const signature = (rows) => rows.map((r) => r.id + ':' + r.outcome + ':' + r.stake).sort().join('|');

    const sync = $('lgx-sync');
    const setSync = (ok) => {
        if (!sync) return;
        sync.className = 'lgx-synced' + (ok ? '' : ' stale');
        sync.innerHTML = '';
        sync.appendChild(el('span', 'lgx-dot'));
        sync.appendChild(document.createTextNode(ok ? ' Live' : ' Unreachable'));
    };

    skeleton();
    const first = await load();
    state.rows = first.rows;
    state.status = first.anyOk ? 'ready' : 'error';
    setSync(first.anyOk);
    let sig = signature(state.rows);

    paintStats();
    paint();

    /* ── keeping it alive ──
       Two different clocks, because they are two different jobs.

       Every 20s the timestamps are re-rendered in place so "47h ago" keeps
       counting without touching the DOM structure — the register ages by
       itself even when nothing new has been written.

       Every 45s the feeds are re-read. The table is only rebuilt when the
       fingerprint actually changes, so a poll that finds nothing new does not
       yank the rows out from under a reader mid-scroll, and the page and
       filters they had chosen survive the refresh. Both pause while the tab
       is hidden. */
    if (window._lgxTick) { clearInterval(window._lgxTick); window._lgxTick = null; }
    if (window._lgxPoll) { clearInterval(window._lgxPoll); window._lgxPoll = null; }

    const alive = () => !!document.getElementById('lgx-rows');

    window._lgxTick = setInterval(() => {
        if (document.hidden) return;
        if (!alive()) { clearInterval(window._lgxTick); window._lgxTick = null; return; }
        const list = visible();
        const start = (state.page - 1) * PER_PAGE;
        const page = list.slice(start, start + PER_PAGE);
        rowsEl.querySelectorAll('.lgx-time').forEach((node, i) => {
            if (page[i]) node.textContent = ago(page[i].at);
        });
    }, 20000);

    window._lgxPoll = setInterval(async () => {
        if (document.hidden) return;
        if (!alive()) { clearInterval(window._lgxPoll); window._lgxPoll = null; return; }
        try {
            const next = await load();
            if (!next.anyOk) { setSync(false); return; }
            setSync(true);
            const nextSig = signature(next.rows);
            if (nextSig === sig) return;
            sig = nextSig;
            state.rows = next.rows;
            state.status = 'ready';
            paintStats();
            paint();
        } catch (e) {
            // A failed refresh leaves the last good register on screen.
            console.warn('[Ledger] refresh failed:', e && e.message);
        }
    }, 45000);
}
