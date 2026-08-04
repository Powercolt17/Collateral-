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
 * real settled count. The ENTRIES above are the first-paint fallback only.
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

const ENTRIES = [
    { id: 372, goal: '50,000 subscribers in 60 days', target: 'TARGET +40%', party: '@deltacreator', oracle: 'YouTube', stake: 1000, mult: 2.5, tier: 'elevated', status: 'returned' },
    { id: 371, goal: '+20% revenue in 30 days', target: 'TARGET +20%', party: '@revpilot', oracle: 'Stripe', stake: 2000, mult: 1.7, tier: 'controlled', status: 'forfeited' },
    { id: 370, goal: '10,000 email leads in 30 days', target: 'TARGET +50%', party: '@growthlead', oracle: 'Shopify', stake: 1200, mult: 4, tier: 'maximum', status: 'open', daysLeft: 3 },
    { id: 369, goal: '100k views on launch video', target: 'TARGET +65%', party: '@indiehacker', oracle: 'YouTube', stake: 800, mult: 1.7, tier: 'controlled', status: 'open', daysLeft: 11 },
    { id: 368, goal: '$100k ARR in 90 days', target: 'TARGET +35%', party: '@saasfounder', oracle: 'Stripe', stake: 5000, mult: 2.5, tier: 'elevated', status: 'returned' },
    { id: 367, goal: '25,000 followers in 30 days', target: 'TARGET +45%', party: '@marcusk', oracle: 'X', stake: 1500, mult: 4, tier: 'maximum', status: 'forfeited' },
];

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
 * @param {Array}   [options.entries]         Ledger rows.
 * @param {boolean} [options.showRatio]       Split bar. initLedgerSection hides it while nothing has settled.
 * @param {number}  [options.returnedPct]     Used by the ratio bar only.
 * @param {string}  [options.onSeeFullLedger] Inline handler for the footer link.
 */
export function renderLedgerSection(options = {}) {
    const {
        entries = ENTRIES,
        showRatio = false,
        returnedPct = 61,
        onSeeFullLedger = '',
    } = options;

    const forfeitedPct = 100 - returnedPct;
    const rows = entries.map(renderRow).join('');

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

        /* Six rows silently swapping every 7s reads as a glitch until the table
           says it is a window onto 49. The tick's width is the page's real share
           of the set, so it doubles as a scale. */
        .lg-pager{display:flex;align-items:center;gap:14px;
          margin-top:18px;padding-left:14px}
        .lg-pager-n{font-size:9.5px;letter-spacing:.16em;color:var(--ink-faint);
          font-variant-numeric:tabular-nums;white-space:nowrap}
        .lg-pager-track{position:relative;flex:0 1 190px;height:1px;background:var(--rule)}
        .lg-pager-track i{position:absolute;top:-1px;height:3px;background:var(--ox);
          left:0;width:12%;transition:left .5s cubic-bezier(.16,.84,.28,1)}
        @media (prefers-reduced-motion:reduce){.lg-pager-track i{transition:none}}

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
          .lg-pager-track{flex:1 1 auto}
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
                <div id="lg-body">${rows}</div>
                <div class="lg-pager" id="lg-pager" hidden>
                    <span class="lg-pager-n lg-mono" id="lg-pager-n"></span>
                    <span class="lg-pager-track"><i id="lg-pager-tick"></i></span>
                </div>
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

   The section renders with ENTRIES so it is never blank on first paint, then
   this replaces every row with what is actually in the database. Three sources:

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

const LG_PAGE = 6;
const LG_CYCLE_MS = 7000;

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
 * Fetches live data and takes over the section. Safe to call when the section
 * is absent — it no-ops. Never throws into the caller: on any failure the rows
 * rendered at build time stay on screen rather than the section going blank.
 */
export async function initLedgerSection() {
    const body = document.getElementById('lg-body');
    if (!body) return;

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
    if (!all.length) return;

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

    const pager = document.getElementById('lg-pager');
    const pagerN = document.getElementById('lg-pager-n');
    const pagerTick = document.getElementById('lg-pager-tick');
    /* Three digits, matching the width the register column pads to. */
    const pad = (n) => String(n).padStart(3, '0');

    let page = 0;
    const paint = () => {
        const start = (page * LG_PAGE) % all.length;
        const n = Math.min(LG_PAGE, all.length);
        const slice = [];
        for (let i = 0; i < n; i++) slice.push(all[(start + i) % all.length]);
        body.innerHTML = slice.map(renderRow).join('');

        /* Quote the REGISTER NUMBERS on screen, not the slice position. seq runs
           downwards, so a positional "37–42 OF 49" sat above rows numbered
           013–008 and the two contradicted each other in the same eyeline. */
        if (pagerN) pagerN.textContent = `${pad(slice[0].seq)}–${pad(slice[n - 1].seq)} OF ${all.length}`;
        if (pagerTick) {
            pagerTick.style.width = (n / all.length) * 100 + '%';
            pagerTick.style.left = (start / all.length) * 100 + '%';
        }
    };
    paint();
    if (pager && all.length > LG_PAGE) pager.hidden = false;

    // Cycle only when there is more than one page, and never for someone who
    // asked for reduced motion.
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (all.length > LG_PAGE && !reduced) {
        setInterval(() => { page += 1; paint(); }, LG_CYCLE_MS);
    }
}
