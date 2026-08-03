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
 * PRE-LAUNCH: showRatio is gated behind !sampleData, so a bar claiming a
 * settlement rate can never render above a "no contract has settled yet"
 * notice. Leave it off until the numbers are real.
 */

const URGENT_DAYS = 5;

const ENTRIES = [
    { id: 372, goal: '50,000 subscribers in 60 days', party: '@deltacreator', oracle: 'YouTube', stake: 1000, status: 'returned' },
    { id: 371, goal: '+20% revenue in 30 days', party: '@revpilot', oracle: 'Stripe', stake: 2000, status: 'forfeited' },
    { id: 370, goal: '10,000 email leads in 30 days', party: '@growthlead', oracle: 'Shopify', stake: 1200, status: 'open', daysLeft: 3 },
    { id: 369, goal: '100k views on launch video', party: '@indiehacker', oracle: 'YouTube', stake: 800, status: 'open', daysLeft: 11 },
    { id: 368, goal: '$100k ARR in 90 days', party: '@saasfounder', oracle: 'Stripe', stake: 5000, status: 'returned' },
    { id: 367, goal: '25,000 followers in 30 days', party: '@marcusk', oracle: 'X', stake: 1500, status: 'forfeited' },
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
    const soon = open && entry.daysLeft <= URGENT_DAYS;
    const cls = ['lg-row', 'lg-' + entry.status, soon ? 'lg-soon' : ''].filter(Boolean).join(' ');

    const outcome = open
        ? '<span class="lg-clock">' + escapeHtml(entry.daysLeft) + 'd</span> LEFT'
        : escapeHtml(String(entry.status).toUpperCase());

    return `
                <div class="${escapeHtml(cls)}">
                    <span class="lg-no lg-mono">${escapeHtml(entry.id)}</span>
                    <span class="lg-goal">${escapeHtml(entry.goal)}</span>
                    <span class="lg-src lg-mono">${escapeHtml(entry.party)} &middot; ${escapeHtml(entry.oracle)}</span>
                    <span class="lg-amt">${escapeHtml(usd(entry.stake))}</span>
                    <span class="lg-out lg-mono">${outcome}</span>
                </div>`;
}

/**
 * @param {object}  [options]
 * @param {Array}   [options.entries]         Ledger rows.
 * @param {boolean} [options.sampleData]      Shows the pre-launch notice and gates the ratio bar.
 * @param {boolean} [options.showRatio]       Split bar. Only renders when sampleData is false.
 * @param {number}  [options.returnedPct]     Used by the ratio bar only.
 * @param {string}  [options.onSeeFullLedger] Inline handler for the footer link.
 */
export function renderLedgerSection(options = {}) {
    const {
        entries = ENTRIES,
        sampleData = true,
        showRatio = false,
        returnedPct = 61,
        onSeeFullLedger = '',
    } = options;

    const forfeitedPct = 100 - returnedPct;
    const rows = entries.map(renderRow).join('');

    const sampleNotice = sampleData
        ? '<div class="lg-sample lg-mono">SAMPLE DATA &middot; NO CONTRACT HAS SETTLED YET</div>'
        : '';

    const ratio = (showRatio && !sampleData)
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
        .lg h2{font-family:var(--roman);
          font-size:31px;font-weight:700;font-synthesis:none;
          letter-spacing:.008em;line-height:1.16;
          color:var(--ox);max-width:19ch;text-wrap:balance}
        .lg-head p{margin-top:17px;font-size:15px;line-height:1.62;color:#3B4254;max-width:58ch}
        .lg-sample{display:inline-block;margin:22px 0 40px;padding:7px 12px;
          border:1px solid var(--spine);background:var(--paper-hi);
          font-size:9.5px;letter-spacing:.16em;color:var(--ink-soft)}

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
          grid-template-columns:46px 1fr 172px 92px 112px;gap:20px;
          padding-left:14px;padding-right:2px}
        .lg-cols{padding-bottom:9px;border-bottom:1px solid var(--ink);
          font-size:9.5px;letter-spacing:.18em;color:var(--ink-faint)}
        .lg-cols span:nth-child(4),.lg-cols span:nth-child(5){text-align:right}

        .lg-row{align-items:baseline;padding-top:17px;padding-bottom:17px;
          border-bottom:1px solid var(--rule);
          box-shadow:inset 2px 0 0 transparent;
          transition:background .14s ease}
        .lg-row:hover{background:var(--paper-hi)}
        .lg-forfeited{box-shadow:inset 2px 0 0 var(--ox)}

        .lg-no{font-size:10px;color:var(--ink-faint)}
        .lg-goal{font-size:15px;font-weight:600;letter-spacing:-.005em}
        .lg-forfeited .lg-goal{color:var(--ox)}
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
          .lg h2{font-size:22px;max-width:none}
          .lg-sample{margin-bottom:28px}
          .lg-cols{display:none}
          .lg-ratio-legend{flex-direction:column;gap:6px}
          .lg-row{grid-template-columns:1fr auto;gap:4px 14px;
            padding-top:16px;padding-bottom:16px}
          .lg-no{grid-column:1}
          .lg-goal{grid-column:1;grid-row:2;font-size:14px}
          .lg-src{grid-column:1;grid-row:3;margin-top:3px}
          .lg-amt{grid-column:2;grid-row:2}
          .lg-out{grid-column:2;grid-row:3;margin-top:4px}
          .lg-foot{flex-direction:column;gap:12px;align-items:flex-start}
        }
        @media (prefers-reduced-motion:reduce){.lg *{transition:none !important}}
        </style>

        <section class="lg">
            <div class="lg-wrap">
                <div class="lg-top-rule"></div>

                <div class="lg-head">
                    <div class="lg-kicker lg-mono">THE LEDGER</div>
                    <h2>Every contract settles in public</h2>
                    <p>
                        Nothing here was decided by us. An API reported, the date passed, and the escrow moved.
                        Losses are listed beside the wins, because that is what makes the wins mean anything.
                    </p>
                    ${sampleNotice}
                </div>
${ratio}
                <div class="lg-cols lg-mono">
                    <span>&#8470;</span>
                    <span>GOAL</span>
                    <span>PARTY &middot; ORACLE</span>
                    <span>AT STAKE</span>
                    <span>OUTCOME</span>
                </div>
${rows}
                <div class="lg-foot lg-mono">
                    <span>SETTLEMENT IS AUTOMATIC &middot; <b>NO APPEALS</b> &middot; <b>NO EXTENSIONS</b></span>
                    <button type="button" class="lg-link"${onSeeFullLedger ? ` onclick="${onSeeFullLedger}"` : ''}>SEE THE FULL LEDGER &rarr;</button>
                </div>
            </div>
        </section>
    `;
}
