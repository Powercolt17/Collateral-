/**
 * Collateral — "Every contract settles in public".
 *
 * A ledger, not a card. Colour here is data, never decoration: three states,
 * three hues, one bar.
 *
 *   settled    green   — resolved, capital returned
 *   forfeited  oxblood — resolved, capital redistributed
 *   soon       gold    — open, under URGENT_DAYS remaining
 *   open       neutral — open, plenty of runway
 *
 * The split bar at the top is deliberately the loudest element on the page. It
 * publishes the forfeiture rate at full saturation, which is the section's whole
 * argument — a page that only shows wins proves nothing. Do not soften it, and
 * do not add a fourth hue.
 *
 * Ported from a supplied React component to this project's view convention: a
 * named render function returning an HTML string with a scoped <style> block,
 * matching Header.js, CollateralHero.js and ForkSection.js. This frontend has
 * no React — react-dom is not installed — so the .jsx could not be used as
 * authored. CSS, the .lg- prefix and the data shape are verbatim.
 *
 * ── THE NUMBERS BELOW ARE FABRICATED ─────────────────────────────────────────
 * ENTRIES, settledPct, closedCount, returned and redistributed are placeholders.
 * No contract has settled on this platform — settlement has never run end to
 * end. Every caller MUST either pass real data or keep a visible demo marker on
 * this section. See the demoLabel option, which is on by default for that
 * reason. Presenting invented settlements as a live ledger is the exact failure
 * this section is otherwise arguing against.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const URGENT_DAYS = 5;

const ENTRIES = [
    { id: 372, goal: '50,000 subscribers in 60 days', party: '@deltacreator', oracle: 'YouTube', stake: 1000, status: 'settled' },
    { id: 371, goal: '+20% revenue in 30 days', party: '@revpilot', oracle: 'Stripe', stake: 2000, status: 'forfeited' },
    { id: 370, goal: '10,000 email leads in 30 days', party: '@growthlead', oracle: 'Shopify', stake: 1200, status: 'open', daysLeft: 3 },
    { id: 369, goal: '100k views on launch video', party: '@indiehacker', oracle: 'YouTube', stake: 800, status: 'open', daysLeft: 11 },
    { id: 368, goal: '$100k ARR in 90 days', party: '@saasfounder', oracle: 'Stripe', stake: 5000, status: 'settled' },
    { id: 367, goal: '25,000 followers in 30 days', party: '@marcusk', oracle: 'X', stake: 1500, status: 'forfeited' },
];

const usd = (n) => '$' + n.toLocaleString('en-US');

/** Open contracts inside the urgency window get their own visual state. */
const stateOf = (e) => (e.status === 'open' && e.daysLeft <= URGENT_DAYS ? 'soon' : e.status);

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderRow(entry) {
    const state = stateOf(entry);
    const resolved = entry.status === 'settled' || entry.status === 'forfeited';
    const outcome = resolved
        ? escapeHtml(entry.status.toUpperCase())
        : `<span class="lg-clock">${escapeHtml(String(entry.daysLeft))}d</span> LEFT`;

    return `
                <div class="lg-row lg-${escapeHtml(state)}">
                    <span class="lg-no lg-mono">${escapeHtml(String(entry.id))}</span>
                    <span class="lg-goal">${escapeHtml(entry.goal)}</span>
                    <span class="lg-src lg-mono">${escapeHtml(entry.party)} · ${escapeHtml(entry.oracle)}</span>
                    <span class="lg-amt">${escapeHtml(usd(entry.stake))}</span>
                    <span class="lg-out lg-mono">${outcome}</span>
                </div>`;
}

/**
 * @param {object} [options]
 * @param {Array}  [options.entries]        Ledger rows.
 * @param {number} [options.settledPct]     Left side of the split bar.
 * @param {number} [options.closedCount]    Contracts closed in the window.
 * @param {number} [options.returned]       Capital returned, in dollars.
 * @param {number} [options.redistributed]  Capital redistributed, in dollars.
 * @param {string} [options.onSeeFullLedger] Inline handler for the footer CTA.
 * @param {boolean}[options.demoLabel]      Marks the section as sample data.
 *   Defaults TRUE. Pass false only when `entries` and the totals are real.
 */
export function renderLedgerSection(options = {}) {
    const {
        entries = ENTRIES,
        settledPct = 61,
        closedCount = 54,
        returned = 212400,
        redistributed = 136800,
        onSeeFullLedger = '',
        demoLabel = true,
    } = options;

    const forfeitedPct = 100 - settledPct;
    const rows = entries.map(renderRow).join('');

    return `
        <style>
        .lg{
          --paper:#F1EEE8; --paper-hi:#F7F5F0;
          --ink:#131A2A; --ink-soft:#5A6172;
          --ox:#7C1A24; --green:#1F6B45; --green-lift:#2E8F5E; --gold:#9C6B1A;
          --rule:#D8D3C8; --spine:#C9C2B4;
          background:var(--paper); color:var(--ink);
          font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
          -webkit-font-smoothing:antialiased;
          padding:72px 0 96px;
        }
        .lg *{box-sizing:border-box;margin:0;padding:0}
        .lg-mono{font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}
        .lg-wrap{max-width:1180px;margin:0 auto;padding:0 32px}

        .lg-head{max-width:640px;margin-bottom:34px}
        .lg-kicker{display:flex;align-items:center;gap:10px;
          font-size:10px;letter-spacing:.22em;font-weight:700;color:var(--ox);margin-bottom:16px}
        .lg-dot{width:7px;height:7px;border-radius:50%;background:var(--green-lift);
          animation:lg-pulse 2.2s ease-out infinite}
        .lg-kicker::after{content:"";flex:1;height:1px;background:var(--rule)}
        @keyframes lg-pulse{
          0%{box-shadow:0 0 0 0 rgba(46,143,94,.5)}
          70%{box-shadow:0 0 0 7px rgba(46,143,94,0)}
          100%{box-shadow:0 0 0 0 rgba(46,143,94,0)}
        }
        /* Matches the hero headline: oxblood, uppercase. Font is deliberately
           NOT switched to var(--display) — see the note in ForkSection.js. */
        .lg h2{font-size:38px;font-weight:800;letter-spacing:-.025em;line-height:1.02;
          color:var(--ox);text-transform:uppercase}
        .lg-head p{margin-top:14px;font-size:15px;line-height:1.6;color:#3B4254;max-width:54ch}
        /* Sample-data marker. Deliberately not styled down into a whisper. */
        .lg-demo{display:inline-block;margin-top:14px;padding:4px 9px;
          border:1px solid var(--ox);color:var(--ox);
          font:700 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em}

        /* the split bar — the loudest element, deliberately */
        .lg-split{margin-bottom:34px}
        .lg-split-bar{display:flex;height:34px;overflow:hidden}
        .lg-split-bar span{display:flex;align-items:center;padding:0 14px;
          font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;color:#F7F5F0}
        .lg-won{background:var(--green)}
        .lg-lost{background:var(--ox);justify-content:flex-end}
        .lg-split-legend{display:flex;justify-content:space-between;gap:16px;margin-top:9px;
          font-size:9.5px;letter-spacing:.16em;color:var(--ink-soft)}

        /* ledger */
        .lg-cols{display:grid;grid-template-columns:56px 1fr 186px 104px 132px;gap:20px;
          padding:0 14px 10px;border-bottom:1px solid var(--ink);
          font-size:9.5px;letter-spacing:.18em;color:var(--ink-soft)}
        .lg-cols span:nth-child(4),.lg-cols span:nth-child(5){text-align:right}

        .lg-row{display:grid;grid-template-columns:56px 1fr 186px 104px 132px;gap:20px;
          align-items:baseline;padding:16px 14px;border-bottom:1px solid var(--rule);
          border-left:3px solid transparent;
          transition:background .16s ease,transform .16s ease}
        .lg-row:hover{transform:translateX(3px)}
        .lg-settled{background:rgba(46,143,94,.055);border-left-color:var(--green)}
        .lg-settled:hover{background:rgba(46,143,94,.11)}
        .lg-forfeited{background:rgba(168,34,49,.055);border-left-color:var(--ox)}
        .lg-forfeited:hover{background:rgba(168,34,49,.11)}
        .lg-soon{background:rgba(192,138,37,.07);border-left-color:var(--gold)}
        .lg-soon:hover{background:rgba(192,138,37,.14)}
        .lg-open{border-left-color:var(--spine)}
        .lg-open:hover{background:var(--paper-hi)}

        .lg-no{font-size:10px;color:var(--ink-soft)}
        .lg-goal{font-size:15px;font-weight:600;letter-spacing:-.005em}
        .lg-src{font-size:11px;color:var(--ink-soft)}
        .lg-amt{font-size:17px;text-align:right;white-space:nowrap;font-weight:600;letter-spacing:-.02em}
        .lg-settled .lg-amt{color:var(--green)}
        .lg-forfeited .lg-amt{color:var(--ox)}
        .lg-soon .lg-amt{color:var(--gold)}

        .lg-out{text-align:right;font:700 9.5px/1.5 ui-monospace,Menlo,monospace;
          letter-spacing:.15em;white-space:nowrap}
        .lg-settled .lg-out{color:var(--green)}
        .lg-forfeited .lg-out{color:var(--ox)}
        .lg-soon .lg-out{color:var(--gold)}
        .lg-open .lg-out{color:var(--ink-soft);font-weight:400}
        .lg-out::before{content:"";display:inline-block;width:7px;height:7px;margin-right:8px;
          background:currentColor}
        .lg-open .lg-out::before{background:none;border:1px solid var(--spine)}
        .lg-clock{font-size:12px;letter-spacing:-.01em}

        .lg-foot{display:flex;justify-content:space-between;align-items:baseline;gap:20px;
          margin-top:24px;font-size:11px;letter-spacing:.15em;color:var(--ink-soft)}
        .lg-foot b{color:var(--ink);font-weight:700}
        .lg-link{background:none;border:0;cursor:pointer;color:var(--ink);font-weight:700;
          font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.15em;
          border-bottom:2px solid var(--ox);padding:0 0 3px}
        .lg-link:hover{color:var(--ox)}
        .lg-link:focus-visible{outline:2px solid var(--ink);outline-offset:3px}

        @media (max-width:880px){
          .lg{padding:48px 0 64px}
          .lg-wrap{padding:0 20px}
          .lg h2{font-size:27px}
          .lg-cols{display:none}
          .lg-split-bar{height:30px}
          .lg-split-bar span{padding:0 10px;font-size:9px}
          .lg-split-legend{flex-direction:column;gap:5px}
          .lg-row{grid-template-columns:1fr auto;gap:4px 14px;padding:15px 12px}
          .lg-row:hover{transform:none}
          .lg-no{grid-column:1}
          .lg-goal{grid-column:1;grid-row:2;font-size:14px}
          .lg-src{grid-column:1;grid-row:3;margin-top:3px}
          .lg-amt{grid-column:2;grid-row:2;font-size:16px}
          .lg-out{grid-column:2;grid-row:3;margin-top:4px}
          .lg-foot{flex-direction:column;gap:12px;align-items:flex-start}
        }
        @media (prefers-reduced-motion:reduce){.lg *{animation:none !important;transition:none !important}}
        </style>

        <section class="lg" aria-labelledby="lg-title">
            <div class="lg-wrap">
                <div class="lg-head">
                    <div class="lg-kicker lg-mono">
                        <span class="lg-dot"></span>
                        LIVE LEDGER
                    </div>
                    <h2 id="lg-title">Every contract settles in public</h2>
                    <p>
                        Nothing here was decided by us. An API reported, the date passed, and the escrow moved.
                        Losses are listed beside the wins, because that is what makes the wins mean anything.
                    </p>
                    ${demoLabel ? '<div class="lg-demo">SAMPLE DATA · NO CONTRACT HAS SETTLED YET</div>' : ''}
                </div>

                <div class="lg-split">
                    <div class="lg-split-bar" role="img"
                         aria-label="${escapeHtml(settledPct)}% of contracts settled, ${escapeHtml(forfeitedPct)}% forfeited, over the last 30 days">
                        <span class="lg-won lg-mono" style="flex:${escapeHtml(settledPct)}">${escapeHtml(settledPct)}% SETTLED</span>
                        <span class="lg-lost lg-mono" style="flex:${escapeHtml(forfeitedPct)}">${escapeHtml(forfeitedPct)}% FORFEITED</span>
                    </div>
                    <div class="lg-split-legend lg-mono">
                        <span>LAST 30 DAYS · ${escapeHtml(closedCount)} CONTRACTS CLOSED</span>
                        <span>${escapeHtml(usd(returned))} RETURNED · ${escapeHtml(usd(redistributed))} REDISTRIBUTED</span>
                    </div>
                </div>

                <div class="lg-cols lg-mono">
                    <span>№</span>
                    <span>GOAL</span>
                    <span>PARTY · ORACLE</span>
                    <span>AT STAKE</span>
                    <span>OUTCOME</span>
                </div>
${rows}

                <div class="lg-foot lg-mono">
                    <span>SETTLEMENT IS AUTOMATIC · <b>NO APPEALS</b> · <b>NO EXTENSIONS</b></span>
                    <button type="button" class="lg-link"${onSeeFullLedger ? ` onclick="${onSeeFullLedger}"` : ''}>SEE THE FULL LEDGER →</button>
                </div>
            </div>
        </section>
    `;
}
