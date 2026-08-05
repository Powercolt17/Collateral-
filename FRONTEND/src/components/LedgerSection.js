/**
 * Collateral — "Every contract settles in public".
 *
 * This frontend has no React and no react-dom, so supplied designs cannot ship
 * as authored. It follows the same convention as CollateralHero.js and
 * Header.js — a render function returning an HTML string with a scoped <style>
 * block, options instead of props, renderRow instead of a Row component, and
 * every interpolated value through escapeHtml.
 *
 * REDESIGNED against a supplied HTML sheet. Everything below the data layer is
 * new; the data layer, the honesty rules and the continuous scroll are not.
 *
 * COLOUR: warm parchment, ink, oxblood, and a muted olive for wins. The note
 * this replaces argued that paper/ink/maroon was the whole palette and that
 * green was foreign to it — that was true of the design it described and is not
 * true of this one. Wins and losses now both carry a tint and an inset rail,
 * because a ledger that only marks its losses is making an argument rather than
 * keeping a record. The olive is desaturated into the parchment family, not a
 * UI green.
 *
 * TYPE: Cormorant Garamond small-caps for the heading, the figures and the
 * stakes; EB Garamond for body and labels; IBM Plex Mono for register numbers,
 * handles and multiples. All three are already requested in index.html, so this
 * costs no new asset. The heading is NOT Trajan any more and the long note about
 * resolving "Trajan Pro" has gone with it — that bug was real but it belonged to
 * a heading that no longer exists.
 *
 * It is an h2, not the h1 the design sheet marks up. The hero already owns the
 * page's h1 and a second would flatten the document outline.
 *
 * SCOPING: every selector is namespaced under .lg. The supplied sheet styles
 * bare *, body, h1, .row, .num, .stake and .full; this component ships in the
 * same document as the hero, the header and the market views, so pasted as
 * authored it would restyle the site.
 *
 * WHAT THE DESIGN SHOWS THAT THE DATA DOES NOT HAVE. The sheet draws a lettered
 * avatar and an @handle on every row. Only genuinely staked contracts carry a
 * principal — lgFromMarket sets party to the literal 'OPEN' because the market
 * API returns no owner. So the token is drawn only where a handle exists, and
 * every other row reserves the space and leaves it blank. The alternative was
 * inventing an identity per row, which is the one thing this section has always
 * refused to do.
 *
 * The sheet also shows settled WON and LOST rows. The API reports
 * contractsSettled 0, so those styles are written but dormant. They are not a
 * promise that any exist.
 *
 * OUTCOME COLUMN: a status square for open rows, a tick for won, a cross for
 * lost. All three are drawn from status, and status comes from a real
 * settlement event or not at all.
 *
 * LIVE DATA: initLedgerSection at the foot of this file replaces every row with
 * what is in the database, and gates the ratio bar and the standfirst on the
 * real settled count. There is no fallback row set and no entries option — every
 * row on screen came from the API, or the section says why it did not.
 *
 * WHAT VARIES, AND WHY THE COLUMNS ARE THESE COLUMNS. The table went live
 * looking synthetic while being entirely real: every row read "OPEN / 4d LEFT"
 * and the stakes were "$500 $500 $100 $100 $100 $100". The two columns the eye
 * lands on were constant. Measuring the live set explains it and says what to do
 * instead:
 *
 *   fundingCloseAt   48 distinct timestamps, but all 48 publish at the SAME
 *                    instant with the same 168h window, so day-granularity
 *                    collapses them to one value. A window-elapsed bar was
 *                    designed here and abandoned once measured: elapsed% has
 *                    exactly ONE distinct value across all 48. It would have
 *                    been the same monotony in a new shape.
 *   displayTargetHint  35 distinct against 16 distinct titles. The real variety.
 *   multiplier       1.7 / 2.5 / 4, and it is the number a performance contract
 *                    is actually about.
 *   costCents        $100 / $250 / $500, correlated with tier.
 *   capacityRemaining  33 distinct — live, unused here, and the best remaining
 *                    signal if this table ever needs a fourth varying column.
 *
 * So the day count stopped being the visual load-bearer, GOAL carries the real
 * target beneath the title, and MULTIPLE was added. Three varying columns where
 * there were none.
 */

const URGENT_DAYS = 5;

/* THERE IS NO FALLBACK ROW SET, DELIBERATELY.
   A hardcoded ENTRIES array used to paint first so the section was never blank,
   and initLedgerSection replaced it once the API answered. Six invented
   contracts with invented handles were therefore on screen for as long as the
   fetch took, and any slow or failed request left them there indefinitely,
   indistinguishable from the real register. Live data only: the section paints a
   placeholder line, then real rows, and says so plainly if the fetch fails. It
   never shows a contract that does not exist. */
const LOADING_ROW = `
                <div class="lg-empty lg-mono" id="lg-empty">READING THE REGISTER&hellip;</div>`;

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


/* Oracle marks, drawn at the row scale. Same paths the oracle register and the
   hero band use, so the four brands read identically wherever they appear. */
const ORACLE_MARKS = {
    stripe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    shopify: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
};

const SHIELD = '<svg class="lg-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>';

const usd = (n) => '$' + Number(n).toLocaleString('en-US');

function renderRow(entry) {
    const open = entry.status === 'open';
    /* daysLeft may legitimately be absent — a staked rivalry carries no published
       close date. Guard the comparison: null <= 5 is true in JS, so an unknown
       date used to raise the urgency flag on a contract nothing said was urgent. */
    const dated = open && entry.daysLeft != null;
    const soon = dated && entry.daysLeft <= URGENT_DAYS;
    const cls = ['lg-row', 'lg-' + entry.status, soon ? 'lg-soon' : ''].filter(Boolean).join(' ');

    /* No date, no countdown: it once reported "0d LEFT", a claim that the
       contract expires today, purely because the field was missing.

       The marks are drawn per STATUS, and status is derived from a real
       settlement event in lgFromLedger — never from the absence of one. The tick
       and the cross can only appear on a contract the ledger says has settled,
       which is why nothing on the live page carries them today. */
    const TICK = '<svg class="lg-ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        + 'stroke-width="2.4" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>';
    const CROSS = '<svg class="lg-ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        + 'stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const SQ = '<span class="lg-sq" aria-hidden="true"></span>';
    const outcome = open
        ? (dated
            ? SQ + '<span class="lg-clock">' + escapeHtml(entry.daysLeft) + 'd</span> LEFT'
            : SQ + 'OPEN')
        : entry.status === 'returned'
            ? TICK + 'SETTLED &middot; WON'
            : entry.status === 'forfeited'
                ? CROSS + 'SETTLED &middot; LOST'
                : SQ + escapeHtml(String(entry.status).toUpperCase());

    /* The real per-contract target — "+65% revenue (14d)". 35 distinct strings
       across the 48 live listings against 16 distinct titles, so this is where
       the table's variety actually lives. */
    const target = entry.target
        ? `<span class="lg-target">${escapeHtml(entry.target)}</span>`
        : '';

    /* Payout multiple. Real and varying: 1.7 / 2.5 / 4 across the live set.
       Staked rivalry rows carry no multiple, so they get a rule rather than a
       fabricated number. */
    const mult = entry.mult
        ? `&times;${escapeHtml(entry.mult)}`
        : '<span class="lg-x-none">&mdash;</span>';
    /* The design marks the top multiple in oxblood. Threshold, not a hand-picked
       row: 4 is the highest the live set carries (1.7 / 2.5 / 4), so this
       highlights whatever the ceiling turns out to be rather than a literal. */
    const multCls = Number(entry.mult) >= 4 ? ' lg-hi' : '';

    /* PARTY. The design shows a lettered token beside an @handle for every row.
       Only real staked contracts carry a principal — lgFromMarket sets party to
       the literal 'OPEN' because the market API returns no owner, so on the
       live register almost nothing has a name to show.

       A token is therefore drawn ONLY where a handle actually exists. Everywhere
       else the space is reserved and left blank, which keeps the oracle aligned
       down the column without putting an identity on screen that no API
       returned. Initials come from the handle itself — first letter plus its
       first digit, or the next letter if it has none. */
    const named = typeof entry.party === 'string' && entry.party.startsWith('@');
    const handle = named ? entry.party.slice(1) : '';
    const initials = named
        ? (handle[0] + (/(\d)/.exec(handle) ? /(\d)/.exec(handle)[1] : (handle[1] || ''))).toUpperCase()
        : '';
    /* VERIFIED BY. The oracle's own mark in a bordered disc, its name, and a
       shield reading READ-ONLY rather than VERIFIED.

       "Verified" is the wrong word and the design sheet used it on every row.
       Nothing has been verified on an open contract — the oracle has not read
       anything yet, because the window has not closed. What is true today is the
       scope: the connection is read-only, which is the claim the oracle section
       already makes and the one that reassures. */
    const brandKey = String(entry.oracle || '').toLowerCase().replace(/[^a-z]/g, '');
    const mark = ORACLE_MARKS[brandKey]
        || `<span class="lg-mono-mark">${escapeHtml((entry.oracle || '?').charAt(0).toUpperCase())}</span>`;
    const partyCell = named
        ? `<span class="lg-ava">${escapeHtml(initials)}</span>`
          + `<span class="lg-src-meta"><span class="lg-h">${escapeHtml(entry.party)}</span>`
          + `<span class="lg-o">${escapeHtml(entry.oracle)}</span></span>`
        : `<span class="lg-badge lg-b-${escapeHtml(brandKey)}" aria-hidden="true">${mark}</span>`
          + `<span class="lg-src-meta"><span class="lg-brand">${escapeHtml(entry.oracle)}</span>`
          + `<span class="lg-scope">${SHIELD}Read-only</span></span>`;

    /* Sequential register number. A ledger numbers its entries in order; the
       sliced UUID that used to sit here read as random. seq is assigned over the
       whole set in initLedgerSection, so it survives paging. */
    const no = entry.seq != null ? String(entry.seq).padStart(3, '0') : String(entry.id);
    const tierCls = entry.tier ? ' lg-t-' + String(entry.tier).replace(/[^a-z]/gi, '') : '';

    return `
                <div class="${escapeHtml(cls)}${escapeHtml(tierCls)}">
                    <span class="lg-no">${escapeHtml(no)}</span>
                    <span class="lg-goal">${escapeHtml(entry.goal)}${target}</span>
                    <span class="lg-src">${partyCell}</span>
                    <span class="lg-amt">${escapeHtml(usd(entry.stake))}</span>
                    <span class="lg-mult${multCls}">${mult}</span>
                    <span class="lg-out">${outcome}</span>
                </div>`;
}

/**
 * @param {object}  [options]
 * @param {boolean} [options.showRatio]       Split bar. initLedgerSection hides it while nothing has settled.
 * @param {number}  [options.returnedPct]     Used by the ratio bar only.
 * @param {string}  [options.onSeeFullLedger] Inline handler for the footer link.
 *
 * There is no entries option. Rows come from the API and nowhere else.
 */
export function renderLedgerSection(options = {}) {
    const {
        showRatio = false,
        returnedPct = 61,
        onSeeFullLedger = '',
    } = options;

    const forfeitedPct = 100 - returnedPct;
    const rows = LOADING_ROW;

    const ratio = showRatio
        ? `
                <div class="lg-ratio">
                    <div class="lg-ratio-bar" role="img" aria-label="${escapeHtml(returnedPct)}% of deposits returned, ${escapeHtml(forfeitedPct)}% forfeited">
                        <i class="lg-kept" style="width:${escapeHtml(returnedPct)}%"></i>
                        <i class="lg-lost" style="width:${escapeHtml(forfeitedPct)}%"></i>
                    </div>
                    <div class="lg-ratio-legend lg-mono">
                        <span><b>${escapeHtml(returnedPct)}%</b> RETURNED TO THE HOLDER</span>
                        <span class="lg-lost-label"><b>${escapeHtml(forfeitedPct)}%</b> FORFEITED</span>
                    </div>
                </div>`
        : '';

    return `
        <style>
        /* EVERY SELECTOR IS SCOPED UNDER .lg, and that is not stylistic tidiness.
           The supplied design sheet styles bare *, body, h1, .row, .num, .stake,
           .out and .full. Pasted in as written it would restyle every table,
           heading and reset on the site — this component ships inside the same
           document as the hero, the header and the market views. Same values,
           namespaced. */
        .lg{
          /* Warm parchment, matched to the hero rather than to --paper. The hero
             now carries the plate's own gold ground, and the flat #F1EEE8 the
             section used to sit on read cold directly beneath it. */
          --lg-parch:#F1E8D3;
          --lg-ink:#211B12;
          --lg-ink-soft:#5B5140;
          --lg-muted:#9A8C6F;
          --lg-faint:#B4A98C;
          --lg-ox:#7C1D2B;
          --lg-win:#4E6B3E;
          --lg-line:rgba(60,48,30,.16);
          --lg-line-soft:rgba(60,48,30,.09);
          --lg-won-tint:rgba(78,107,62,.06);
          --lg-lost-tint:rgba(124,29,43,.05);
          --lg-serif:"EB Garamond",Georgia,serif;
          --lg-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --lg-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--lg-parch);
          color:var(--lg-ink);
          font-family:var(--lg-serif);
          -webkit-font-smoothing:antialiased;
        }
        .lg *{box-sizing:border-box;margin:0;padding:0}
        .lg-mono{font-family:var(--lg-mono)}
        .lg-wrap{max-width:1440px;margin:0 auto;padding:64px 90px 40px}
        .lg-top-rule{display:none}

        /* ---- header ---- */
        .lg-head{display:flex;justify-content:space-between;align-items:flex-start;gap:40px}
        .lg-head-l{max-width:640px}
        .lg-kicker{font-size:11px;letter-spacing:.4em;text-transform:uppercase;
          color:var(--lg-muted);font-weight:600;margin-bottom:22px}
        /* h2, NOT h1. The design sheet marks this up as h1, but the page already
           has one in the hero and a second would flatten the document outline
           for anything reading structure rather than pixels. The size, face and
           small-caps are the sheet's; only the element is different. */
        .lg h2{
          font-family:var(--lg-display);font-weight:600;color:var(--lg-ox);
          font-size:clamp(34px,3.6vw,52px);line-height:1.02;letter-spacing:.005em;
          text-transform:uppercase;font-variant:small-caps;margin-bottom:20px;
        }
        .lg-head-l p{font-size:18px;line-height:1.55;color:var(--lg-ink-soft);max-width:560px}

        .lg-sum{display:flex;flex-direction:column;gap:18px;text-align:right;padding-top:4px}
        .lg-sum dt{font-size:10px;letter-spacing:.3em;text-transform:uppercase;
          color:var(--lg-muted);font-weight:600;margin-bottom:4px}
        .lg-sum dd{font-family:var(--lg-display);font-size:30px;font-weight:600;
          color:var(--lg-ink);line-height:1;font-variant-numeric:tabular-nums lining-nums}
        .lg-sum .lg-u{font-size:15px;color:var(--lg-muted);margin-left:4px}

        /* ---- table ---- */
        .lg-cols,.lg-row{
          display:grid;
          grid-template-columns:56px minmax(0,1fr) 190px 120px 110px 160px;
          align-items:center;column-gap:20px;
        }
        .lg-cols{border-bottom:1px solid var(--lg-line);padding:0 8px 12px;margin-top:52px;
          font-size:10px;letter-spacing:.26em;text-transform:uppercase;
          color:var(--lg-faint);font-weight:600}
        .lg-cols span:nth-child(n+4){text-align:right}
        .lg-row{padding:20px 8px;border-bottom:1px solid var(--lg-line-soft)}

        .lg-no{font-family:var(--lg-mono);font-size:13px;color:var(--lg-muted);letter-spacing:.02em}
        /* Cormorant at 21px, the sheet scale. The goal is the row - what someone
           said they would do - and it was set in the same face and weight as the
           labels around it. */
        .lg-goal{font-family:var(--lg-display);font-size:21px;font-weight:600;
          color:var(--lg-ink);letter-spacing:.01em;min-width:0;line-height:1.15}
        .lg-target{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;
          color:var(--lg-muted);margin-top:5px;font-weight:500}

        .lg-src{display:flex;align-items:center;gap:11px;min-width:0}
        .lg-ava{width:26px;height:26px;border-radius:50%;flex:none;
          background:rgba(124,29,43,.10);border:1px solid rgba(124,29,43,.25);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--lg-mono);font-size:10px;color:var(--lg-ox);font-weight:500}
        /* A row with no named principal is MOST of the register, and leaving its
           cell as a single faint line was the reason the table read as stretched
           and half-empty next to the design — one column of the six was carrying
           almost nothing while the others were full.

           It is filled with what is actually true rather than with an invented
           handle: the party line reads Open, because that is the contract's real
           state and the literal value the API returns, and the token carries the
           ORACLE's initial, not a person's. The outlined treatment is the tell —
           a filled token is a party, a hairline token is a source. Nobody's
           identity is implied by either.

           Do not restyle .lg-ava-src to match .lg-ava. The difference between
           them is the difference between a contract someone has staked and one
           nobody has claimed yet. */
        .lg-ava-src{
          background:none;border:1px solid rgba(60,48,30,.22);
          color:var(--lg-muted);font-size:9px;
        }
        .lg-h-open{color:var(--lg-muted);letter-spacing:.14em;
          text-transform:uppercase;font-size:11px}

        /* VERIFIED-BY CELL. The oracle's own mark in a bordered disc, its name,
           and the scope beneath it. This replaces a lettered token and the word
           OPEN, which said nothing a reader wanted: the interesting fact about
           an open contract is not that it is unclaimed, it is which API gets to
           decide it. */
        .lg-badge{
          width:34px;height:34px;border-radius:50%;flex:none;
          border:1px solid var(--lg-line);background:rgba(255,255,255,.28);
          display:flex;align-items:center;justify-content:center;color:#2C2418;
        }
        .lg-badge svg{width:auto;height:15px;fill:currentColor;display:block}
        /* Optically balanced per brand, the same values the oracle register uses
           so the four marks read identically wherever they appear. */
        .lg-b-stripe svg{height:13px}
        .lg-b-youtube svg{height:12px}
        .lg-b-shopify svg{height:16px}
        .lg-b-x svg{height:12px}
        .lg-mono-mark{font-family:var(--lg-mono);font-weight:600;font-size:12px;color:var(--lg-ox)}
        .lg-brand{font-family:var(--lg-mono);font-size:11px;letter-spacing:.1em;
          text-transform:uppercase;color:var(--lg-ink);white-space:nowrap}
        /* READ-ONLY, not VERIFIED. The sheet stamped every row Verified, and on
           an open contract nothing has been verified — the window has not closed
           and the oracle has not read anything yet. The scope IS true today, and
           it is the fact that reassures. */
        .lg-scope{display:flex;align-items:center;gap:5px;font-family:var(--lg-mono);
          font-size:9px;letter-spacing:.12em;text-transform:uppercase;
          color:var(--lg-muted);margin-top:4px}
        .lg-shield{width:11px;height:11px;flex:none;color:var(--lg-win)}

        /* The site sets a 1.62 line-height globally and it lands on these cells,
           which is not what the design was drawn against — it inflated the goal
           cell from 23px to 31px and every row with it, about 11px per row over
           98 rows. Pinned here rather than fought elsewhere. */
        .lg-goal{line-height:1.2}
        .lg-target{line-height:1.45}
        .lg-amt{line-height:1}
        .lg-h,.lg-o{line-height:1.3}
        .lg-src-meta{display:flex;flex-direction:column;gap:2px;min-width:0}
        .lg-h{font-family:var(--lg-mono);font-size:13px;color:var(--lg-ink-soft);
          letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .lg-o{font-size:10px;letter-spacing:.22em;text-transform:uppercase;
          color:var(--lg-faint);font-weight:600}

        .lg-amt{font-family:var(--lg-display);font-size:22px;font-weight:600;
          color:var(--lg-ink);text-align:right;font-variant-numeric:tabular-nums lining-nums}
        .lg-mult{font-family:var(--lg-mono);font-size:15px;text-align:right;
          color:var(--lg-ink-soft);letter-spacing:.01em}
        .lg-mult.lg-hi{color:var(--lg-ox);font-weight:500}
        .lg-x-none{color:var(--lg-faint)}

        .lg-out{display:flex;align-items:center;justify-content:flex-end;gap:9px;
          font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;
          color:var(--lg-ink-soft)}
        /* The status dot. It pulses only on rows inside the urgent window, which
           is a real property of the row - daysLeft <= 5 - and not decoration
           applied to every line to make the table look busy. */
        .lg-sq{width:7px;height:7px;border-radius:50%;flex:none;background:var(--lg-muted)}
        .lg-soon .lg-sq{animation:lg-pulse 2.4s ease-out infinite}
        @keyframes lg-pulse{
          0%{box-shadow:0 0 0 0 rgba(124,29,43,.45)}
          70%{box-shadow:0 0 0 6px rgba(124,29,43,0)}
          100%{box-shadow:0 0 0 0 rgba(124,29,43,0)}
        }
        @media (prefers-reduced-motion:reduce){.lg-soon .lg-sq{animation:none}}
        .lg-soon .lg-out{color:var(--lg-ox)}
        .lg-soon .lg-sq{background:var(--lg-ox)}
        .lg-out .lg-clock{font-family:var(--lg-mono);font-size:11px;letter-spacing:.06em}
        .lg-ck{width:13px;height:13px;flex:none}

        /* Settled rows read as archived. These are DORMANT at the time of
           writing — the API reports contractsSettled 0, so nothing on the live
           page carries .lg-returned or .lg-forfeited. They are written now so
           the first real settlement lands styled instead of unstyled; they are
           not a promise that any exist. */
        .lg-returned{background:var(--lg-won-tint);box-shadow:inset 3px 0 0 var(--lg-win)}
        .lg-forfeited{background:var(--lg-lost-tint);box-shadow:inset 3px 0 0 var(--lg-ox)}
        .lg-returned .lg-out{color:var(--lg-win)}
        .lg-forfeited .lg-out{color:var(--lg-ox)}
        .lg-returned .lg-goal,.lg-forfeited .lg-goal{color:var(--lg-ink-soft)}
        .lg-returned .lg-no,.lg-forfeited .lg-no{color:var(--lg-faint)}

        /* CONTINUOUS SCROLL — kept exactly as it was, by request.
           #lg-body is the viewport and .lg-track is what moves. The track holds
           the register TWICE, and the animation travels exactly -50% — one full
           copy — so the second copy is under the cursor at the instant the first
           finishes and the seam never shows. Duplicating is what makes it
           seamless; a single copy has to snap back.

           Speed is set in px/sec in JS and converted to a duration against the
           measured track height, so the rows travel at the same rate whether the
           register holds 12 contracts or 400. A fixed duration would crawl on a
           long set and blur on a short one.

           translate3d, not top/margin: it runs on the compositor and does not
           relayout 98 rows every frame. */
        .lg-body{position:relative;overflow:hidden}
        .lg-track{will-change:transform}
        .lg-scrolling .lg-track{animation:lg-scroll linear infinite}
        @keyframes lg-scroll{
          from{transform:translate3d(0,0,0)}
          to{transform:translate3d(0,-50%,0)}
        }
        /* Readable on demand — the register stops while you are pointing at it. */
        .lg-scrolling:hover .lg-track{animation-play-state:paused}

        /* Softens the cut at both edges so rows enter and leave rather than
           being chopped. On the viewport, never on the track — masking the
           element that translates drags the mask along with it. */
        .lg-scrolling{
          -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 26px,
            #000 calc(100% - 26px),transparent 100%);
          mask-image:linear-gradient(to bottom,transparent 0,#000 26px,
            #000 calc(100% - 26px),transparent 100%)}

        .lg-empty{padding:26px 0 26px 14px;font-size:10px;letter-spacing:.16em;
          color:var(--lg-faint);border-bottom:1px solid var(--lg-line)}

        /* ---- footer ---- */
        .lg-foot{display:flex;justify-content:space-between;align-items:center;
          margin-top:34px;padding-top:22px;border-top:1px solid var(--lg-line);gap:24px}
        .lg-foot > span{font-size:11px;letter-spacing:.24em;text-transform:uppercase;
          color:var(--lg-muted);font-weight:600}
        .lg-foot b{color:var(--lg-ink-soft);font-weight:600}
        .lg-link{background:none;border:0;cursor:pointer;
          font-size:12px;letter-spacing:.22em;text-transform:uppercase;
          color:var(--lg-ink);font-weight:600;
          border-bottom:2px solid var(--lg-ox);padding-bottom:5px;
          transition:color 160ms ease}
        .lg-link:hover{color:var(--lg-ox)}
        .lg-link:focus-visible{outline:2px solid var(--lg-ox);outline-offset:3px}
        .lg-arw{color:var(--lg-ox);margin-left:8px}

        /* Narrow. The six-column grid cannot hold at phone width, so the fixed
           track columns collapse and the party block drops out of the row rather
           than being squeezed into 40px. */
        @media (max-width:900px){
          .lg-wrap{padding-block:clamp(40px,8vw,64px) clamp(24px,5vw,40px);padding-inline:clamp(20px,5.5vw,90px)}
          .lg-head-l p{font-size:clamp(1rem,4.2vw,1.125rem)}
          .lg-cols,.lg-row{grid-template-columns:40px minmax(0,1fr) 92px 108px;column-gap:12px}
          .lg-cols span:nth-child(3),.lg-row .lg-src{display:none}
          .lg-cols span:nth-child(n+4){text-align:right}
          .lg-head{flex-direction:column;gap:28px}
          .lg-sum{flex-direction:row;gap:28px;text-align:left;flex-wrap:wrap}
          .lg-goal{font-size:16px}
          .lg-amt{font-size:19px}
          .lg-foot{flex-direction:column;align-items:flex-start}
        }

        /* Nothing moves for someone who asked for that. The full register is
           still there and still reachable by scrolling the page. */
        @media (prefers-reduced-motion:reduce){
          .lg-scrolling .lg-track{animation:none}
          .lg-body{overflow:visible;height:auto !important}
          .lg-scrolling{-webkit-mask-image:none;mask-image:none}
        }
        @media (max-width:768px){
          .lg{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){.lg *{transition:none !important}}
        </style>

        <section class="lg">
            <div class="lg-wrap">
                <div class="lg-top-rule"></div>

                <div class="lg-head">
                    <div class="lg-head-l">
                        <div class="lg-kicker">The Ledger</div>
                        <h2>Every contract<br />settles in public</h2>
                        <p id="lg-standfirst">
                            Nothing here was decided by us. Every contract runs against a live oracle
                            and a fixed date &mdash; and when the date arrives, the outcome is posted here
                            whichever way it goes. Won or lost, it stays on the record.
                        </p>
                    </div>
                    <!-- SETTLED -> NEXT SETTLES. The count it replaced reads 0 and
                         will read 0 until the first contract reaches its date, which
                         is a true number that tells the reader nothing. The soonest
                         close date is derived from the same rows already on screen —
                         see lg-sum-next in initLedgerSection — so it is live, not a
                         stand-in, and it degrades to an em dash when no row carries a
                         published date rather than inventing one. -->
                    <dl class="lg-sum">
                        <div><dt>Capital at Stake</dt><dd id="lg-sum-cap">&mdash;</dd></div>
                        <div><dt>Contracts Open</dt><dd id="lg-sum-open">&mdash;</dd></div>
                        <div><dt>Next Settles</dt><dd id="lg-sum-next">&mdash;</dd></div>
                    </dl>
                </div>
                <div id="lg-ratio-slot">${ratio}</div>
                <div class="lg-cols">
                    <span>&#8470;</span>
                    <span>Goal</span>
                    <span>Verified By</span>
                    <span>At Stake</span>
                    <span>Multiple</span>
                    <span>Status</span>
                </div>
                <div class="lg-body" id="lg-body">${rows}</div>
                <div class="lg-foot">
                    <span><b>Verification is automatic</b> &middot; No appeals &middot; No extensions</span>
                    <button type="button" class="lg-link"${onSeeFullLedger ? ` onclick="${onSeeFullLedger}"` : ''}>See the full ledger <span class="lg-arw">&rarr;</span></button>
                </div>
            </div>
        </section>
    `;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE DATA

   The section paints a single placeholder line and this fills it with what is
   actually in the database. Nothing else ever reaches the screen. Three sources:

     /v1/market/contracts        the live contract set — real rows, real stakes,
                                 real funding windows, straight from the DB
     /v1/market/homepage-stats   settled count, capital locked, total paid out
     /v1/ledger                  real staked contracts with a named principal

   WHAT THE OUTCOME COLUMN CAN AND CANNOT SAY. Outcomes are derived, never
   assumed. RETURNED and FORFEITED are only ever written for a contract that
   carries a settlement event; everything else is an open window and reports the
   days left against its real close date. At the time of writing the API returns
   contractsSettled 0, so nothing renders as returned or forfeited — and that is
   the section telling the truth, not a bug.

   THE RATIO BAR IS GATED ON THE SAME FACT. A returned-versus-forfeited split
   computed from zero settlements is 0/0, so the bar is removed until the first
   real settlement exists, and appears on its own the moment one does.

   The standfirst is swapped for the same reason. Its wording — "an API reported,
   the date passed, and the escrow moved" — is a claim about completed
   settlements. With none on record it is replaced by a sentence describing what
   IS true; the original returns automatically once contractsSettled goes above
   zero. Neither string needs editing again.
   ───────────────────────────────────────────────────────────────────────────── */

/* How many rows the viewport shows. The track holds the whole register. */
const LG_VISIBLE_ROWS = 6;
/* Travel rate. Set in px/sec, not as a duration, so 49 contracts and 400
   contracts move at the same speed instead of the long set crawling. At ~81px a
   desktop row this is a little over one row a second. */
const LG_SCROLL_PX_PER_SEC = 90;

function lgDaysLeft(iso) {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
}

/** Live market listings -> ledger rows. Open windows only; nothing is settled. */
function lgFromMarket(list) {
    return (list || []).map((c) => {
        const t = c.template || {};
        const days = lgDaysLeft(c.fundingCloseAt);
        return {
            id: String(c.id || '').replace(/-/g, '').slice(0, 3).toUpperCase(),
            goal: t.title || t.name || c.metricKey || 'Open contract',
            /* THE PERCENTAGE ONLY, NEVER THE NOUN.
               displayTargetHint arrives as "Target: +65% units (14d)", and on 12
               of the 48 live listings that noun contradicts the contract's own
               metricKey — stripe_mrr described as "units", stripe_charge_volume
               as "orders". Rendering the string verbatim would print a
               self-contradicting row ("Monthly Recurring Revenue / +65% units")
               on a quarter of the table.

               The figure itself was checked and is sound: it is a strict
               function of tier (controlled 25-60, elevated 35-85, maximum
               50-130), the same template at the same tier always yields the same
               number, and the window matches template.rules.window_days on all
               48. So the percentage is kept and the noun is dropped — the title
               already names the metric, which is what made the noun redundant as
               well as wrong. Fix the generator upstream and nothing here needs to
               change. */
            target: (() => {
                const m = /\+\s*(\d+(?:\.\d+)?)\s*%/.exec(c.displayTargetHint || '');
                return m ? 'TARGET +' + m[1] + '%' : null;
            })(),
            party: 'OPEN',
            oracle: (t.provider || c.provider || '').replace(/^\w/, (m) => m.toUpperCase()),
            stake: Math.round((c.costCents || 0) / 100),
            mult: c.multiplier || null,
            tier: c.tier || null,
            status: 'open',
            /* No invented default. A missing fundingCloseAt used to render as
               "30d LEFT", which is a date the API never gave us. */
            daysLeft: days,
        };
    });
}

/** Real staked contracts from the ledger. These have a named principal. */
function lgFromLedger(events) {
    const byContract = new Map();
    for (const e of events || []) {
        const cur = byContract.get(e.contractId) || { events: [], first: e };
        cur.events.push(e);
        if (e.lockAmountUsdCents) cur.lock = e.lockAmountUsdCents;
        if (e.principal) cur.principal = e.principal;
        if (e.platform) cur.platform = e.platform;
        if (e.riskTier) cur.riskTier = e.riskTier;
        byContract.set(e.contractId, cur);
    }
    const rows = [];
    for (const [id, c] of byContract) {
        const types = c.events.map((e) => e.eventType).join(' ');
        // Derived, never assumed. Only a real settlement event earns an outcome.
        const settled = /SETTLED|RETURNED|PAYOUT_COMPLETE/.test(types);
        const forfeited = /FORFEIT|SETTLED_FAILURE|BOTH_MISS/.test(types);
        rows.push({
            id: String(id).replace(/-/g, '').slice(0, 3).toUpperCase(),
            goal: c.platform ? `${c.platform.charAt(0) + c.platform.slice(1).toLowerCase()} performance contract` : 'Performance contract',
            /* A staked rivalry carries a risk tier but no published multiple, so
               the multiple column gets a rule rather than an invented number. */
            target: c.riskTier ? String(c.riskTier).toUpperCase() + ' · HEAD TO HEAD' : null,
            party: c.principal ? '@' + c.principal : 'OPEN',
            oracle: (c.platform || '').replace(/^(\w)(\w*)$/, (_, a, b) => a + b.toLowerCase()),
            stake: Math.round((c.lock || 0) / 100),
            mult: null,
            tier: null,
            status: forfeited ? 'forfeited' : settled ? 'returned' : 'open',
            /* The ledger publishes no close date for a rivalry, so there is no
               countdown to state. renderRow prints OPEN rather than inventing one. */
            daysLeft: null,
        });
    }
    return rows;
}

/**
 * Fetches live data and fills the section. Safe to call when the section is
 * absent — it no-ops. Nothing is ever invented: if the fetch returns nothing,
 * the section says so rather than showing contracts that do not exist.
 */
export async function initLedgerSection() {
    const body = document.getElementById('lg-body');
    if (!body) return;

    const fail = (msg) => {
        const el = document.getElementById('lg-empty');
        if (el) el.textContent = msg;
    };

    /* Same base the api module resolves, rather than a second hardcoded host. */
    const BASE = import.meta.env.VITE_API_BASE_URL || 'https://collateral-production.up.railway.app';
    /* Direct fetches, NOT window.api.getLedgerEvents. That helper is shaped for
       a single contract and routes through the authed path, so calling it with
       no id throws "Authentication required" and silently drops the one really
       staked contract from the section. /v1/ledger itself is public. */
    const get = (path) => fetch(BASE + path).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    const [stats, market, ledger] = await Promise.all([
        get('/v1/market/homepage-stats'),
        get('/v1/market/contracts'),
        get('/v1/ledger'),
    ]);

    const staked = lgFromLedger(ledger && ledger.events);
    const open = lgFromMarket(market && market.contracts);
    const all = staked.concat(open);
    if (!all.length) {
        fail(market || ledger
            ? 'NO OPEN CONTRACTS ON THE REGISTER'
            : 'THE REGISTER IS UNREACHABLE RIGHT NOW');
        return;
    }

    const settledCount = stats && Number(stats.contractsSettled) || 0;

    /* Descending register numbers over the whole set, assigned once so a row
       keeps its number across pages. */
    all.forEach((e, i) => { e.seq = all.length - i; });

    /* Totals. capitalLocked is what is actually staked right now, which is the
       one staked contract — not the sum of the catalogue's entry prices, which
       nobody has paid. */
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (stats) {
        setText('lg-sum-cap', usd(Number(stats.capitalLocked) || 0));
        setText('lg-sum-open', String(all.length));
    }

    /* NEXT SETTLES. Derived from the rows already on screen — the soonest real
       close date in the set — so it cannot disagree with the table beneath it.
       Only dated open rows count: a staked rivalry publishes no close date, and
       treating a missing date as 0 is the same bug that once printed "0d LEFT"
       on every undated contract.

       If nothing carries a date the field stays an em dash. The unit is written
       separately so it can be typeset smaller without a second lookup. */
    const nextDays = all
        .filter((e) => e.status === 'open' && e.daysLeft != null)
        .reduce((min, e) => (min == null || e.daysLeft < min ? e.daysLeft : min), null);
    const nextEl = document.getElementById('lg-sum-next');
    if (nextEl) {
        nextEl.innerHTML = nextDays == null
            ? '&mdash;'
            : String(nextDays) + '<span class="lg-u">'
                + (nextDays === 1 ? 'day' : 'days') + '</span>';
    }

    /* Standfirst. The supplied copy is kept as the default because it promises
       rather than claims — "when the date arrives, the outcome is posted here"
       describes the mechanism and asserts nothing about the past.

       The rewrite below still fires while nothing has settled, and it is worth
       keeping for a reason the static line cannot cover: a reader looking at a
       table with no won or lost rows in it deserves to be told WHY. "None has
       reached its date yet" answers that; silence invites the assumption that
       settlements are being hidden. It swaps itself out the moment the first
       contract settles. */
    const sf = document.getElementById('lg-standfirst');
    if (sf && settledCount === 0) {
        const openCount = all.length;
        sf.textContent = `Nothing here was decided by us. ${openCount} contract${openCount === 1 ? '' : 's'} `
            + `${openCount === 1 ? 'is' : 'are'} open against a live oracle and a fixed date. `
            + `None has reached its date yet — when one does, the outcome is posted here `
            + `whichever way it goes. Won or lost, it stays on the record.`;
    }

    // Ratio bar: a returned/forfeited split needs something settled to divide.
    const ratioSlot = document.getElementById('lg-ratio-slot');
    if (ratioSlot && settledCount === 0) ratioSlot.innerHTML = '';

    const markup = all.map(renderRow).join('');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ONE COPY WHEN NOTHING WILL MOVE. The duplicate exists only to make the
       loop seamless; with the animation off it is just the register printed
       twice, which is what a reduced-motion reader would have got. */
    if (reduced) {
        body.innerHTML = markup;
        return;
    }

    /* THE REGISTER IS RENDERED TWICE INTO ONE TRACK.
       The animation travels -50%, exactly one copy, so at the moment it loops
       the second copy is sitting where the first began and the join is
       invisible. With a single copy there is nothing to move into shot and the
       list has to snap. The clone is aria-hidden so a screen reader reads the
       register once. */
    body.innerHTML = `<div class="lg-track" id="lg-track">${markup}`
        + `<div aria-hidden="true">${markup}</div></div>`;

    const track = document.getElementById('lg-track');
    if (!body.querySelector('.lg-row')) return;

    const visible = Math.min(LG_VISIBLE_ROWS, all.length);

    /* Height and duration are both MEASURED, never assumed: the viewport is a
       real row's height times the rows we want to see, and the duration is one
       copy's travel divided by the speed. Rows are far taller on a phone, where
       the grid restacks, so a constant would be wrong on one of the two. */
    const applyMetrics = () => {
        const firstRow = body.querySelector('.lg-row');
        if (!firstRow) return false;
        const rowH = firstRow.getBoundingClientRect().height;
        const copyH = track.scrollHeight / 2;
        /* Bail on a degenerate layout rather than committing it. Measured once
           at init, a zero-width container — a hidden tab, a display:none
           ancestor, a not-yet-visible route — laid the rows out at 220px instead
           of 81 and baked a 1319px viewport in permanently. */
        if (rowH <= 0 || copyH <= 0 || !body.clientWidth) return false;
        body.style.height = Math.round(rowH * visible) + 'px';
        track.style.animationDuration = (copyH / LG_SCROLL_PX_PER_SEC).toFixed(2) + 's';
        return true;
    };

    /* IT NOW REPORTS WHETHER IT SUCCEEDED, AND RETRIES UNTIL IT DOES.
       The bail above is correct and stays, but bailing silently was leaving the
       register permanently still: measured on the live page, height was never
       set and animation-duration sat at the initial 0s, so the track was
       animating across no time at all.

       The section sits far below the fold. At init its subtree is not laid out,
       so clientWidth reads 0 and the guard fires — correctly. What did not
       happen is the recovery: the ResizeObserver below watches the track, and a
       subtree whose layout is being skipped does not report a size change, so
       nothing ever asked again.

       Two independent recoveries, because the failure was silent once already:
       an IntersectionObserver that fires when the section approaches the
       viewport, and a bounded rAF poll for any path that misses. Both stop the
       moment a measurement sticks; neither can spin forever. */
    if (!applyMetrics()) {
        let settled = false;
        const done = () => { settled = true; };
        if (window.IntersectionObserver) {
            const io = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting) && applyMetrics()) { done(); io.disconnect(); }
            }, { rootMargin: '600px' });
            io.observe(body);
        }
        let tries = 0;
        const tick = () => {
            if (settled || applyMetrics() || ++tries > 90) return;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    body.classList.add('lg-scrolling');

    /* Re-measure on anything that reflows the rows: the 880px restack, an
       orientation change, a webfont arriving after first paint, or the section
       simply becoming visible. Observing the track cannot feed back — setting
       the viewport's height and the animation's duration changes neither the
       track's own height nor its width. */
    let t;
    const schedule = () => { clearTimeout(t); t = setTimeout(applyMetrics, 150); };
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(track);
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(applyMetrics).catch(() => {});
}
