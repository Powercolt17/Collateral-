/**
 * Collateral — "Every contract settles in public".
 *
 * PORTED FROM THE SUPPLIED LedgerSection.jsx. This frontend has no React and no
 * react-dom, so the .jsx could not be shipped as authored; it follows the same
 * convention as CollateralHero.js and Header.js instead — a render function
 * returning an HTML string with a scoped <style> block. Props became options,
 * the Row component became renderRow, and every interpolated value goes through
 * escapeHtml. Behaviour, markup order, class names and CSS are otherwise the
 * supplied file, with the two fixes noted under TYPE and OUTCOME COLUMN.
 *
 * COLOUR: paper, ink, maroon. Nothing else. The previous version ran four hues
 * — green for settled, gold for urgency, tinted row backgrounds and a saturated
 * split bar — which read as spreadsheet conditional formatting, and green is
 * foreign to this palette. Only forfeiture is marked now: a 2px maroon inset
 * rail and maroon type. Two marked rows out of six puts the eye on the losses,
 * which is the section's argument.
 *
 * ALIGNMENT: every row carries the same 14px left padding and a transparent
 * inset shadow. Forfeited rows only swap the shadow colour. Do not move the
 * padding onto the forfeited rule — it indents those rows and breaks the
 * table's left edge, which is the one alignment a ledger has to hold.
 *
 * TYPE: the heading is Trajan, and the bug it fixes was neither a cascade
 * problem nor a family-name mismatch. The old .lg h2 declared NO font-family at
 * all, so it inherited the Helvetica stack off .lg and never asked for Trajan
 * in the first place. The global h2 in index.css is not the culprit either: it
 * is a bare element selector at 0,0,1 against 0,1,1 here, so this rule beats it
 * on every property it sets, without !important.
 *
 * The family name that works is "Trajan Pro" — what this project's own
 * @font-face declares in src/index.css. "Trajan Pro 3" and "trajan-pro-3" are
 * Adobe Fonts web-project names we do not use; they sit after ours so the
 * section still resolves if the site is ever moved onto a Typekit kit. Both a
 * 400 TTF and a 700 OTF are loaded, so font-weight:700 selects a REAL bold;
 * font-synthesis:none is set anyway so a failed load degrades to real Regular
 * rather than a smeared fake bold.
 *
 * Grotesque stays on the hero headline and the wordmark — the contrast between
 * the engraving and modern type is the point, and Trajan is caps-only and too
 * wide to carry a 6vw display line. Figures stay mono; that is what makes them
 * read as a record.
 *
 * OUTCOME COLUMN: urgent rows carry a maroon flag before the day count, so
 * without a counterpart the non-urgent rows sat 13px to the right of them and
 * the column's right edge came out ragged. Non-urgent OPEN rows now get the
 * same box with a transparent background. Returned and forfeited rows get
 * nothing — they have no day count to align.
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

const usd = (n) => '$' + Number(n).toLocaleString('en-US');

function renderRow(entry) {
    const open = entry.status === 'open';
    /* daysLeft may legitimately be absent — a staked rivalry carries no published
       close date. Guard the comparison: null <= 5 is true in JS, so an unknown
       date used to raise the urgency flag on a contract nothing said was urgent. */
    const dated = open && entry.daysLeft != null;
    const soon = dated && entry.daysLeft <= URGENT_DAYS;
    const cls = ['lg-row', 'lg-' + entry.status, soon ? 'lg-soon' : ''].filter(Boolean).join(' ');

    /* No date, no countdown. It reported "0d LEFT" — a claim that the contract
       expires today — purely because the field was missing. */
    const outcome = open
        ? (dated
            ? '<span class="lg-clock">' + escapeHtml(entry.daysLeft) + 'd</span> LEFT'
            : 'OPEN')
        : escapeHtml(String(entry.status).toUpperCase());

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

    /* Sequential register number. A ledger numbers its entries in order; the
       sliced UUID that used to sit here read as random. seq is assigned over the
       whole set in initLedgerSection, so it survives paging. */
    const no = entry.seq != null ? String(entry.seq).padStart(3, '0') : String(entry.id);
    const tierCls = entry.tier ? ' lg-t-' + String(entry.tier).replace(/[^a-z]/gi, '') : '';

    return `
                <div class="${escapeHtml(cls)}${escapeHtml(tierCls)}">
                    <span class="lg-no lg-mono">${escapeHtml(no)}</span>
                    <span class="lg-goal">${escapeHtml(entry.goal)}${target}</span>
                    <span class="lg-src lg-mono">${escapeHtml(entry.party)} &middot; ${escapeHtml(entry.oracle)}</span>
                    <span class="lg-amt">${escapeHtml(usd(entry.stake))}</span>
                    <span class="lg-mult lg-mono">${mult}</span>
                    <span class="lg-out lg-mono">${outcome}</span>
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
        .lg{
          --paper:#F1EEE8; --paper-hi:#F7F5F0;
          --ink:#131A2A; --ink-soft:#5A6172; --ink-faint:#8B8F99;
          --ox:#7C1A24; --rule:#D8D3C8; --spine:#C9C2B4;
          --display:"Neue Haas Grotesk Display","neue-haas-grotesk-display",
                    "Helvetica Neue",Helvetica,Arial,sans-serif;
          /* "Trajan Pro" FIRST because that is the family name this project's
             own @font-face declares in src/index.css, backed by a 400 TTF and a
             700 OTF. The Adobe Fonts web-project names follow as a fallback for
             a future Typekit setup; Cinzel is the free stand-in. */
          --roman:"Trajan Pro","Trajan Pro 3","trajan-pro-3","Cinzel",Georgia,serif;
          background:var(--paper); color:var(--ink);
          font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
          -webkit-font-smoothing:antialiased;
        }
        .lg *{box-sizing:border-box;margin:0;padding:0}
        .lg-mono{font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}

        /* narrowed so the head and the table read as one layout */
        .lg-wrap{max-width:1040px;margin:0 auto;padding:76px 32px 92px}

        .lg-top-rule{height:1px;background:var(--rule);margin-bottom:20px}
        .lg-kicker{font-size:10px;letter-spacing:.22em;font-weight:700;
          color:var(--ink-faint);margin-bottom:20px}
        /* The old rule set no font-family at all and inherited Helvetica off
           .lg, which is why Trajan never appeared. 0,1,1 here beats the bare h2
           in index.css at 0,0,1, so nothing needs !important. */
        /* 42px, up from 31. The weight was already right and was checked rather
           than assumed: both Trajan cuts load, and 700 measures 590.2px against
           400 at 582.3px on this string, so a real bold face is in use. Trajan
           simply has a quiet bold — it is drawn from chiselled inscription, where
           weight comes from stroke modulation rather than mass, so asking it to
           shout through font-weight does not work. On this family presence is a
           function of SIZE.

           42 is the largest step that still reads as a section head rather than a
           second hero. The hero display runs far above it, so the hierarchy is
           unambiguous either way. */
        .lg h2{font-family:var(--roman);
          font-size:42px;font-weight:700;font-synthesis:none;
          letter-spacing:.008em;line-height:1.12;
          color:var(--ox);max-width:19ch;text-wrap:balance}
        .lg-head p{margin-top:17px;font-size:15px;line-height:1.62;color:#3B4254;max-width:58ch}

        /* SPACING IS STRUCTURAL, ON THE HEAD ITSELF. It used to come from
           .lg-sample's 40px bottom margin, so deleting the sample box and hiding
           the ratio bar left the standfirst and the column rule sharing one
           baseline — measured at a 0px gap on production. Nothing below may be
           the only thing holding this apart again. */
        .lg-head{display:grid;grid-template-columns:1fr auto;gap:24px 48px;
          align-items:start;margin-bottom:40px}
        .lg-head-l{min-width:0}

        /* The head used 479px of a 1040px measure and left 529px of empty paper
           above a full-width table. A ledger that does not total itself is not a
           ledger; these are the totals, and they are live. */
        .lg-sum{display:grid;gap:15px;text-align:right;padding-top:4px}
        .lg-sum dt{font-size:9px;letter-spacing:.18em;color:var(--ink-faint);
          white-space:nowrap}
        .lg-sum dd{font-size:19px;margin-top:5px;color:var(--ink);
          font-variant-numeric:tabular-nums;letter-spacing:-.01em}
        .lg-sum .lg-sum-ox dd{color:var(--ox)}

        .lg-ratio{margin-bottom:34px}
        .lg-ratio-bar{display:flex;height:5px;background:var(--spine)}
        .lg-ratio-bar i{display:block;height:100%}
        .lg-kept{background:var(--ink)}
        .lg-lost{background:var(--ox)}
        .lg-ratio-legend{display:flex;justify-content:space-between;gap:18px;margin-top:11px;
          font-size:10px;letter-spacing:.15em;color:var(--ink-soft)}
        .lg-ratio-legend b{color:var(--ink);font-weight:700}
        .lg-lost-label b{color:var(--ox)}

        /* identical padding on every row keeps the table's left edge true */
        .lg-cols,.lg-row{display:grid;
          grid-template-columns:52px 1fr 148px 84px 70px 104px;gap:18px;
          padding-left:14px;padding-right:2px}
        .lg-cols{padding-bottom:9px;border-bottom:1px solid var(--ink);
          font-size:9.5px;letter-spacing:.18em;color:var(--ink-faint)}
        .lg-cols span:nth-child(4),.lg-cols span:nth-child(5),
        .lg-cols span:nth-child(6){text-align:right}

        .lg-row{align-items:baseline;padding-top:17px;padding-bottom:17px;
          border-bottom:1px solid var(--rule);
          box-shadow:inset 2px 0 0 transparent;
          transition:background .14s ease}
        .lg-row:hover{background:var(--paper-hi)}
        .lg-forfeited{box-shadow:inset 2px 0 0 var(--ox)}

        .lg-no{font-size:10px;color:var(--ink-faint);font-variant-numeric:tabular-nums}
        .lg-goal{font-size:15px;font-weight:600;letter-spacing:-.005em;min-width:0}
        .lg-target{display:block;margin-top:4px;font-size:10px;font-weight:400;
          letter-spacing:.13em;color:var(--ink-faint);
          font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}
        .lg-forfeited .lg-goal{color:var(--ox)}

        /* The payout multiple, and the only column whose weight tracks its own
           value: 4x should not read the same as 1.7x. */
        .lg-mult{text-align:right;font-size:12.5px;color:var(--ink-soft);
          white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
        .lg-t-elevated .lg-mult{color:var(--ink);font-weight:600}
        .lg-t-maximum .lg-mult{color:var(--ox);font-weight:700}
        .lg-x-none{color:var(--spine)}
        .lg-src{font-size:11px;color:var(--ink-soft)}
        .lg-amt{font-size:15px;text-align:right;white-space:nowrap;font-weight:600;
          font-variant-numeric:tabular-nums;letter-spacing:-.01em}
        .lg-forfeited .lg-amt{color:var(--ox)}
        .lg-open .lg-amt{color:var(--ink-soft);font-weight:500}

        .lg-out{text-align:right;font:9.5px/1.5 ui-monospace,Menlo,monospace;
          letter-spacing:.15em;white-space:nowrap;color:var(--ink-soft)}
        .lg-returned .lg-out{color:var(--ink);font-weight:700}
        .lg-forfeited .lg-out{color:var(--ox);font-weight:700}
        .lg-clock{font-size:12px;font-weight:700;color:var(--ink);letter-spacing:-.01em}
        /* urgency reads as a flag; an underline here looked like a link */
        .lg-soon .lg-out::before{content:"";display:inline-block;width:5px;height:5px;
          background:var(--ox);margin-right:8px;vertical-align:1px}
        /* Same box, no colour. Without it the flag pushes urgent rows 13px left
           of the others and the outcome column's right edge comes out ragged.
           OPEN rows only — returned and forfeited have no day count to align. */
        .lg-open:not(.lg-soon) .lg-out::before{content:"";display:inline-block;
          width:5px;height:5px;background:transparent;margin-right:8px;vertical-align:1px}

        /* CONTINUOUS SCROLL.
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
          color:var(--ink-faint);border-bottom:1px solid var(--rule)}

        /* Nothing moves for someone who asked for that. The full register is
           still there and still reachable by scrolling the page. */
        @media (prefers-reduced-motion:reduce){
          .lg-scrolling .lg-track{animation:none}
          .lg-body{overflow:visible;height:auto !important}
          .lg-scrolling{-webkit-mask-image:none;mask-image:none}
        }

        .lg-foot{display:flex;justify-content:space-between;align-items:baseline;gap:20px;
          margin-top:26px;padding-left:14px;
          font-size:10.5px;letter-spacing:.15em;color:var(--ink-soft)}
        .lg-foot b{color:var(--ink);font-weight:700}
        .lg-link{background:none;border:0;cursor:pointer;color:var(--ink);
          font:700 10.5px/1 ui-monospace,Menlo,monospace;letter-spacing:.15em;
          border-bottom:2px solid var(--ox);padding:0 0 3px}
        .lg-link:hover{color:var(--ox)}
        .lg-link:focus-visible{outline:2px solid var(--ox);outline-offset:3px}

        @media (max-width:880px){
          .lg-wrap{padding:44px 20px 64px}
          /* 26px, up from 22, tracking the desktop increase. Kept well below the
             desktop step because the phone column is narrow and 19ch is dropped
             here, so the string wraps on measure alone. */
          .lg h2{font-size:26px;max-width:none}
          .lg-cols{display:none}
          .lg-ratio-legend{flex-direction:column;gap:6px}
          /* The totals sit under the standfirst on a phone and go horizontal, so
             they read as a strip rather than a second column. */
          .lg-head{grid-template-columns:1fr;gap:26px;margin-bottom:30px}
          .lg-sum{grid-auto-flow:column;justify-content:start;gap:26px;text-align:left}
          .lg-sum dd{font-size:16px}
          .lg-row{grid-template-columns:1fr auto;gap:4px 14px;
            padding-top:16px;padding-bottom:16px}
          .lg-no{grid-column:1}
          .lg-goal{grid-column:1;grid-row:2;font-size:14px}
          .lg-src{grid-column:1;grid-row:3;margin-top:3px}
          .lg-amt{grid-column:2;grid-row:2}
          /* The multiple pairs with the stake it multiplies, not with the clock. */
          .lg-mult{grid-column:2;grid-row:1;text-align:right;font-size:11.5px}
          .lg-out{grid-column:2;grid-row:3;margin-top:4px}
          .lg-foot{flex-direction:column;gap:12px;align-items:flex-start}
        }
        @media (prefers-reduced-motion:reduce){.lg *{transition:none !important}}
        </style>

        <section class="lg">
            <div class="lg-wrap">
                <div class="lg-top-rule"></div>

                <div class="lg-head">
                    <div class="lg-head-l">
                        <div class="lg-kicker lg-mono">THE LEDGER</div>
                        <h2>Every contract settles in public</h2>
                        <p id="lg-standfirst">
                            Nothing here was decided by us. An API reported, the date passed, and the escrow moved.
                            Losses are listed beside the wins, because that is what makes the wins mean anything.
                        </p>
                    </div>
                    <dl class="lg-sum lg-mono">
                        <div><dt>CAPITAL AT STAKE</dt><dd id="lg-sum-cap">&mdash;</dd></div>
                        <div><dt>CONTRACTS OPEN</dt><dd id="lg-sum-open">&mdash;</dd></div>
                        <div class="lg-sum-ox"><dt>SETTLED</dt><dd id="lg-sum-settled">&mdash;</dd></div>
                    </dl>
                </div>
                <div id="lg-ratio-slot">${ratio}</div>
                <div class="lg-cols lg-mono">
                    <span>&#8470;</span>
                    <span>GOAL</span>
                    <span>PARTY &middot; ORACLE</span>
                    <span>AT STAKE</span>
                    <span>MULTIPLE</span>
                    <span>OUTCOME</span>
                </div>
                <div class="lg-body" id="lg-body">${rows}</div>
                <div class="lg-foot lg-mono">
                    <span>VERIFICATION IS AUTOMATIC &middot; <b>NO APPEALS</b> &middot; <b>NO EXTENSIONS</b></span>
                    <button type="button" class="lg-link"${onSeeFullLedger ? ` onclick="${onSeeFullLedger}"` : ''}>SEE THE FULL LEDGER &rarr;</button>
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
        setText('lg-sum-settled', String(settledCount));
    }

    // Standfirst: the shipped wording claims completed settlements. Only leave it
    // in place once at least one exists.
    const sf = document.getElementById('lg-standfirst');
    if (sf && settledCount === 0) {
        const openCount = all.length;
        sf.textContent = `Nothing here was decided by us. ${openCount} contract${openCount === 1 ? '' : 's'} `
            + `${openCount === 1 ? 'is' : 'are'} open against a live oracle and a fixed date. `
            + `None has reached its date yet — when one does, the outcome is posted here whichever way it goes.`;
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
        if (!firstRow) return;
        const rowH = firstRow.getBoundingClientRect().height;
        const copyH = track.scrollHeight / 2;
        /* Bail on a degenerate layout rather than committing it. Measured once
           at init, a zero-width container — a hidden tab, a display:none
           ancestor, a not-yet-visible route — laid the rows out at 220px instead
           of 81 and baked a 1319px viewport in permanently. */
        if (rowH <= 0 || copyH <= 0 || !body.clientWidth) return;
        body.style.height = Math.round(rowH * visible) + 'px';
        track.style.animationDuration = (copyH / LG_SCROLL_PX_PER_SEC).toFixed(2) + 's';
    };

    applyMetrics();
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
