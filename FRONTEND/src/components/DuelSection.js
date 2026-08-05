/**
 * Collateral — "Open right now, and somebody is behind".
 *
 * BUILT ON A SUPPLIED HTML SHEET. No React here, so the sheet becomes a render
 * function and its inline script becomes initDuelSection.
 *
 * ── DO NOT PUT A BACKTICK IN THESE CSS COMMENTS ──────────────────────────────
 * The style block is inside a template literal; one backtick kills the page.
 *
 * ── THE DUELS ARE REAL, AND THE SHEET'S POLL WAS NOT ─────────────────────────
 * The sheet ships two hardcoded duels and moves their percentages on a timer:
 *
 *     const noise = (Math.random()-0.5)*0.5;
 *     f.pct = Math.max(0.1, f.pct + (f.base - f.pct)*0.25 + noise);
 *
 * under a heading reading "Real capital, real clocks, updated every oracle
 * poll" and a pulsing LIVE dot. That is a random walk presented as oracle data.
 * It is not shipped.
 *
 * It did not need to be, because the API already has this. Checked rather than
 * assumed — GET /v1/rivalries returns the real thing, and the sheet's SECOND
 * card is already an exact copy of it:
 *
 *     challengerUsername  revpilot    percentageDelta  8.1
 *     opponentUsername    quotaops    percentageDelta  5.4
 *     platform STRIPE, metricType REVENUE, poolCents 200000
 *
 * So "@revpilot +8.1% vs @quotaops +5.4% · $2,000 pool · Revenue · Stripe API"
 * is correct to the digit. The FIRST card — @jakevoss +12.4% vs @marcus +9.2%,
 * $5,000 pool, Audience · X API — does not exist. The endpoint reports total 1.
 *
 * This section therefore renders whatever /v1/rivalries returns and nothing
 * else. Today that is one duel. If a second is created it appears without an
 * edit; if the endpoint fails the section says so rather than inventing a card.
 *
 * THE POLL IS A REAL POLL. Instead of nudging numbers with noise, it re-fetches
 * on an interval, so "updated every oracle poll" describes what the code does.
 * The tick animation still fires, but only when a value has ACTUALLY changed —
 * animating an unchanged number is the same lie in a smaller font.
 *
 * ── THE STATUS PILL IS DERIVED, NEVER ASSERTED ───────────────────────────────
 * The sheet hardcodes "Live · 14d left" and "Settling". Both come from the
 * record now:
 *
 *   settledAt set                      SETTLED
 *   state ACTIVE, deadline ahead       LIVE · Nd LEFT
 *   state ACTIVE, deadline passed      AWAITING SETTLEMENT
 *
 * That last branch is not hypothetical and is worth knowing about: the live
 * rivalry's deadlineUtc was 2026-05-07 and it is still ACTIVE with settledAt
 * null. Calling that "Live · 14d left" would be false, and calling it
 * "Settling" implies a process is running. Nothing is running — there is no
 * rivalry verification job. The pill says what is true.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * The sheet styles bare *, body, h1, .section, .duel, .bar, .seg, .pill, .name
 * and .vs. Namespaced under .dl; keyframes prefixed dl-. It is an h2, not the
 * sheet's h1 — the hero owns the page's h1.
 *
 * Fonts are already in index.html, so the sheet's font link is dropped.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL
    || 'https://collateral-production.up.railway.app';

/* 60s. The oracle side does not move faster than this, so a tighter loop would
   be traffic without information. */
const POLL_MS = 60000;

function esc(v) {
    return String(v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const usd = (cents) => '$' + Math.round((cents || 0) / 100).toLocaleString('en-US');
const pct = (v) => (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%';

/** Real record -> the shape the card needs. Nothing here is invented. */
function toDuel(r) {
    const parts = r.participants || [];
    const ch = parts.find((p) => p.role === 'challenger') || {};
    const op = parts.find((p) => p.role === 'opponent') || {};
    const deadline = r.deadlineUtc ? new Date(r.deadlineUtc).getTime() : null;
    const daysLeft = deadline == null ? null : Math.ceil((deadline - Date.now()) / 86400000);

    let status = 'OPEN';
    let live = false;
    if (r.settledAt) {
        status = 'SETTLED';
    } else if (daysLeft != null && daysLeft > 0) {
        status = 'LIVE &middot; ' + daysLeft + 'd LEFT';
        live = true;
    } else if (daysLeft != null) {
        /* Past its date and still unsettled. Neither "live" nor "settling". */
        status = 'AWAITING SETTLEMENT';
    }

    const metric = (r.metricType || '').toLowerCase();
    const platform = (r.platform || '').toLowerCase();
    return {
        id: r.id,
        cat: (metric ? metric.charAt(0).toUpperCase() + metric.slice(1) : 'Contract')
            + ' &middot; ' + (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '')
            + ' API',
        status,
        live,
        settled: !!r.settledAt,
        a: { name: r.challengerUsername || 'challenger', pct: Number(ch.percentageDelta || 0) },
        b: { name: r.opponentUsername || 'opponent', pct: Number(op.percentageDelta || 0) },
        pool: r.poolCents || 0,
    };
}

export function renderDuelSection() {
    return `
        <style>
        .dl{
          --parch:#F1E8D3; --paper:#FAF5E8; --ink:#211B12; --ink-soft:#5B5140;
          --muted:#9A8C6F; --faint:#B4A98C; --ox:#7C1D2B; --win:#4E6B3E;
          --line:rgba(60,48,30,.16);
          --win-tint:rgba(78,107,62,.14); --loss-tint:rgba(124,29,43,.10);
          --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          --serif:"EB Garamond",Georgia,serif;
          --display:"Cormorant Garamond",Georgia,serif;
          position:relative;width:100%;max-width:1440px;margin:0 auto;
          padding:76px 90px 72px;background:var(--parch);color:var(--ink);
          font-family:var(--serif);-webkit-font-smoothing:antialiased;
        }
        .dl *{box-sizing:border-box;margin:0;padding:0}

        .dl-wm{position:absolute;top:34px;right:80px;font-family:var(--display);
          font-weight:600;font-size:190px;line-height:.8;color:rgba(33,27,18,.05);
          pointer-events:none;user-select:none}
        .dl-kicker{display:flex;align-items:center;gap:10px;font-family:var(--mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--win);
          font-weight:500;margin-bottom:22px}
        .dl-dot{width:8px;height:8px;border-radius:50%;background:var(--win);
          box-shadow:0 0 0 0 rgba(78,107,62,.5);animation:dl-pulse 2.2s ease-out infinite;flex:none}
        @keyframes dl-pulse{
          0%{box-shadow:0 0 0 0 rgba(78,107,62,.5)}
          70%{box-shadow:0 0 0 7px rgba(78,107,62,0)}
          100%{box-shadow:0 0 0 0 rgba(78,107,62,0)}
        }
        .dl h2{font-family:var(--display);font-weight:600;font-size:50px;line-height:1.04;
          color:var(--ink);margin-bottom:24px;max-width:560px}
        .dl-lede{font-size:18px;line-height:1.6;color:var(--ink-soft);max-width:440px}

        .dl-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:50px}
        .dl-duel{background:var(--paper);border:1px solid var(--line);border-radius:4px;
          box-shadow:0 14px 34px rgba(60,40,20,.08);padding:24px 26px 22px;
          text-align:left;font:inherit;color:inherit;cursor:pointer;width:100%;
          transition:border-color .2s ease,box-shadow .2s ease}
        .dl-duel:hover{border-color:rgba(124,29,43,.35);box-shadow:0 18px 40px rgba(60,40,20,.12)}
        .dl-duel:focus-visible{outline:2px solid var(--ox);outline-offset:3px}

        .dl-head{display:flex;justify-content:space-between;align-items:center;gap:12px;
          margin-bottom:24px}
        .dl-cat{font-family:var(--mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--muted);font-weight:500}
        .dl-pill{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);
          font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:500;
          padding:5px 11px;border-radius:20px;white-space:nowrap}
        .dl-pill.dl-on{background:var(--win-tint);color:var(--win)}
        .dl-pill.dl-off{background:var(--loss-tint);color:var(--ox)}
        .dl-ld{width:6px;height:6px;border-radius:50%;background:var(--win);
          animation:dl-pulse 2.2s ease-out infinite;flex:none}

        .dl-combat{display:flex;align-items:baseline;justify-content:space-between;
          gap:14px;margin-bottom:16px}
        .dl-fighter{display:flex;align-items:baseline;gap:10px;min-width:0}
        .dl-fighter.dl-r{flex-direction:row-reverse;text-align:right}
        .dl-name{font-family:var(--mono);font-size:13px;color:var(--ink-soft);
          letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dl-pct{font-family:var(--mono);font-size:21px;font-weight:600;letter-spacing:.01em;
          transition:color .4s ease;white-space:nowrap}
        .dl-pct.dl-lead{color:var(--win)}
        .dl-pct.dl-behind{color:var(--ink)}
        .dl-pct.dl-tick{animation:dl-tick .5s ease}
        @keyframes dl-tick{
          0%{opacity:.4;transform:translateY(-1px)}
          100%{opacity:1;transform:none}
        }
        .dl-vs{font-family:var(--mono);font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--faint);flex:none}

        .dl-bar{display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px;
          margin-bottom:22px;background:rgba(60,48,30,.08)}
        .dl-seg{height:100%;border-radius:2px;
          transition:width .9s cubic-bezier(.22,1,.36,1),background-color .5s ease}
        .dl-seg.dl-lead{background:var(--win)}
        .dl-seg.dl-behind{background:var(--ox)}

        .dl-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;
          padding-top:16px;border-top:1px dotted var(--line);font-family:var(--mono);
          font-size:11px;letter-spacing:.06em;color:var(--muted)}
        .dl-lnk{color:var(--ink);border-bottom:1.5px solid var(--ox);padding-bottom:4px;
          white-space:nowrap}
        .dl-arw{color:var(--ox)}

        .dl-empty{grid-column:1/-1;padding:34px 26px;background:var(--paper);
          border:1px solid var(--line);border-radius:4px;font-family:var(--mono);
          font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}

        @media (max-width:1100px){
          .dl{padding:60px 40px 56px}
          .dl-wm{font-size:140px;right:36px}
          .dl h2{font-size:40px}
          .dl-grid{gap:18px}
        }
        @media (max-width:820px){
          .dl{padding:48px 20px 44px}
          .dl-wm{display:none}
          .dl h2{font-size:30px;max-width:none}
          .dl-lede{font-size:16px;max-width:none}
          .dl-grid{grid-template-columns:1fr;gap:14px;margin-top:32px}
          .dl-duel{padding:20px}
          .dl-head{flex-wrap:wrap;gap:8px;margin-bottom:18px}
          /* The two figures plus "vs" do not fit one line at 320px; the names
             drop under their own numbers rather than the numbers shrinking. */
          .dl-combat{flex-wrap:wrap;gap:8px}
          .dl-pct{font-size:18px}
        }
        @media (prefers-reduced-motion:reduce){
          .dl-dot,.dl-ld,.dl-pct.dl-tick{animation:none}
          .dl-seg,.dl-pct,.dl-duel{transition:none}
        }
        </style>

        <section class="dl" id="duels">
            <div class="dl-wm" aria-hidden="true">08</div>
            <div class="dl-kicker"><span class="dl-dot" aria-hidden="true"></span> Live Rivalry Duels</div>
            <h2>Open right now, and somebody is behind</h2>
            <p class="dl-lede">Real capital, real clocks, updated every oracle poll. Open a duel to see the full position.</p>

            <div class="dl-grid" id="dl-grid">
                <div class="dl-empty" id="dl-empty">Reading the register&hellip;</div>
            </div>
        </section>
    `;
}

function cardHtml(d) {
    const aLead = d.a.pct >= d.b.pct;
    const total = (d.a.pct + d.b.pct) || 1;
    const pillCls = d.live ? 'dl-on' : 'dl-off';
    const dot = d.live ? '<span class="dl-ld" aria-hidden="true"></span> ' : '';
    return `
        <button type="button" class="dl-duel" data-id="${esc(d.id)}">
            <span class="dl-head">
                <span class="dl-cat">${d.cat}</span>
                <span class="dl-pill ${pillCls}">${dot}${d.status}</span>
            </span>
            <span class="dl-combat">
                <span class="dl-fighter">
                    <span class="dl-name">@${esc(d.a.name)}</span>
                    <span class="dl-pct dl-a ${aLead ? 'dl-lead' : 'dl-behind'}">${pct(d.a.pct)}</span>
                </span>
                <span class="dl-vs">vs</span>
                <span class="dl-fighter dl-r">
                    <span class="dl-name">@${esc(d.b.name)}</span>
                    <span class="dl-pct dl-b ${aLead ? 'dl-behind' : 'dl-lead'}">${pct(d.b.pct)}</span>
                </span>
            </span>
            <span class="dl-bar" aria-hidden="true">
                <span class="dl-seg dl-sa ${aLead ? 'dl-lead' : 'dl-behind'}" style="width:${(d.a.pct / total) * 100}%"></span>
                <span class="dl-seg dl-sb ${aLead ? 'dl-behind' : 'dl-lead'}" style="width:${(d.b.pct / total) * 100}%"></span>
            </span>
            <span class="dl-foot">
                <span>${usd(d.pool)} pool</span>
                <span class="dl-lnk">${d.settled ? 'View results' : 'View duel'} <span class="dl-arw">&rarr;</span></span>
            </span>
        </button>`;
}

/**
 * Fetches the real rivalries and keeps them current.
 *
 * The interval RE-FETCHES rather than perturbing numbers locally, which is what
 * makes "updated every oracle poll" a description instead of a decoration. The
 * tick animation fires only where a value actually moved between polls.
 */
export function initDuelSection() {
    const grid = document.getElementById('dl-grid');
    if (!grid) return;

    let previous = new Map();

    const paint = (duels) => {
        if (!duels.length) {
            grid.innerHTML =
                '<div class="dl-empty">No rivalry duels are open right now</div>';
            return;
        }
        grid.innerHTML = duels.map(cardHtml).join('');

        /* Only the values that CHANGED get the tick. */
        duels.forEach((d) => {
            const prev = previous.get(d.id);
            if (!prev) return;
            const card = grid.querySelector('[data-id="' + CSS.escape(d.id) + '"]');
            if (!card) return;
            if (prev.a !== d.a.pct) flash(card.querySelector('.dl-a'));
            if (prev.b !== d.b.pct) flash(card.querySelector('.dl-b'));
        });
        previous = new Map(duels.map((d) => [d.id, { a: d.a.pct, b: d.b.pct }]));

        grid.querySelectorAll('.dl-duel').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.router) window.router.navigate('/rivalry');
            });
        });
    };

    const flash = (el) => {
        if (!el) return;
        el.classList.remove('dl-tick');
        void el.offsetWidth;
        el.classList.add('dl-tick');
    };

    const load = async () => {
        try {
            const res = await fetch(API_BASE + '/v1/rivalries');
            if (!res.ok) throw new Error('status ' + res.status);
            const json = await res.json();
            paint((json.rivalries || []).map(toDuel));
        } catch (e) {
            /* Say so. The alternative is a card that is not backed by anything. */
            const empty = document.getElementById('dl-empty');
            if (empty) empty.textContent = 'The duel register is unreachable right now';
        }
    };

    load();
    const reduced = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) setInterval(load, POLL_MS);
}
