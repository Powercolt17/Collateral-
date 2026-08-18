/**
 * Collateral — "A plan without stakes is just a comfortable wish".
 *
 * REBUILT against a supplied design sheet, and EXTRACTED out of Landing.js at
 * the same time. It lived inline there, styled by shared .title / .lede /
 * .eyebrow rules in LandingStyles.js — rules six other sections also use. The
 * sheet re-sets the heading in Cormorant small-caps against the old grotesque,
 * so applying it in place would have restyled every other section on the page.
 * Scoped component, same convention as ForkSection.js and LedgerSection.js.
 *
 * SCOPING. Every selector sits under .cs. The sheet styles bare *, body, h1,
 * .row, .thead, .wk, .cap and .note — this ships in one document with the hero,
 * the fork, the ledger and the oracle band, so pasted as authored it would
 * restyle all of them. .row alone would have hit the ledger's table.
 *
 * It is an h2, not the sheet's h1. The hero owns the page's h1.
 *
 * THE TABLE STAYS A TABLE. The sheet builds the comparison from divs. This is
 * genuinely tabular data — two named columns compared row by row — and the
 * markup it replaces already used <table> with <th scope="col">. Divs would
 * drop that for nothing, so the rows are laid out with display:grid ON the
 * table elements instead. Identical geometry, semantics kept. The landing page
 * already used this technique in its own mobile block.
 *
 * Content is data, not markup: ROWS below drive the body, so adding a week is
 * an array edit.
 */

const ROWS = [
    { wk: '01', without: 'Announce the goal', under: 'Lock the deposit' },
    { wk: '02', without: 'Something urgent comes up', under: 'Something urgent comes up anyway' },
    { wk: '03', without: 'Move the deadline, quietly', under: 'The deadline does not move' },
    { wk: '04', without: "Decide it wasn't the right time", under: 'Ship it at 2am, badly, on time' },
];

const SETTLE = {
    wk: '—',
    without: 'Nothing at risk, nothing changed',
    under: 'Money back. And the thing exists.',
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderRow(r, settle) {
    return `
                            <tr class="${settle ? 'cs-settle' : 'cs-rb'}">
                                <td class="cs-wk">${escapeHtml(r.wk)}</td>
                                <td class="cs-void">${escapeHtml(r.without)}</td>
                                <td class="cs-under">${escapeHtml(r.under)}</td>
                            </tr>`;
}

export function renderCaseSection() {
    return `
        <style>
        .cs{
          --cs-parch:#F1E8D3;
          --cs-ink:#211B12;
          --cs-ink-soft:#5B5140;
          --cs-muted:#9A8C6F;
          --cs-faint:#B4A98C;
          --cs-void:#A89A7E;
          --cs-ox:#7C1D2B;
          --cs-win:#4E6B3E;
          --cs-line:rgba(60,48,30,.16);
          --cs-won-tint:rgba(78,107,62,.07);
          --cs-serif:var(--font-content);
          --cs-display:var(--font-display);
          --cs-mono:var(--font-data);

          background:var(--cs-parch);
          color:var(--cs-ink);
          font-family:var(--cs-serif);
          -webkit-font-smoothing:antialiased;
        }
        .cs *{box-sizing:border-box;margin:0;padding:0}
        .cs-wrap{max-width:1440px;margin:0 auto;padding:52px 90px 48px}
        /* minmax(0,...) rather than bare fr. A grid track defaults to a floor of
           min-content, so the table dragged the whole column out to its own
           min-width and the section overflowed with it. */
        .cs-grid{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1fr);
          gap:76px;align-items:start}

        /* ---- left column ---- */
        .cs-kicker{display:flex;align-items:center;gap:12px;font-family:var(--cs-mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--cs-ox);
          font-weight:500;margin-bottom:22px}
        .cs-kicker .cs-r{height:1px;width:26px;background:var(--cs-ox);opacity:.7;flex:none}
        .cs h2{font-family:var(--cs-display);font-weight:600;
          font-size:clamp(32px,3.5vw,50px);line-height:1.04;letter-spacing:.004em;
          color:var(--cs-ink);margin-bottom:26px}
        .cs-body{font-size:18px;line-height:1.6;color:var(--cs-ink-soft);max-width:470px}

        .cs-note{margin-top:40px;padding-top:22px;border-top:1px solid var(--cs-line);max-width:470px}
        .cs-nl{font-family:var(--cs-mono);font-size:11px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--cs-ox);font-weight:500;margin-bottom:10px}
        .cs-nt{font-family:var(--cs-mono);font-size:12px;line-height:1.7;letter-spacing:.02em;
          text-transform:uppercase;color:var(--cs-muted)}

        /* ---- right column: comparison ledger ---- */
        /* The caption names the table for a screen reader and is not drawn. The
           sheet has no caption at all; a table this abstract needs one, because
           "Wk / Without Stakes / Under Contract" read aloud out of context does
           not say what is being compared. */
        .cs-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;
          overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
        .cs-cap{font-family:var(--cs-mono);font-size:11px;letter-spacing:.24em;
          text-transform:uppercase;color:var(--cs-muted);font-weight:500;margin-bottom:16px}
        /* min-width:0 is LOAD-BEARING and needs the !important to survive.
           mobile.css carries a bare "table" selector with min-width:600px
           !important for every viewport under 768px. It exists for the wide
           data tables on other routes, which sit inside an overflow-x:auto
           wrapper and are meant to be scrolled sideways. This table is designed
           to fit, so that floor forced it to 600px in a 320px column - it was
           not scrolling, it was being clipped by the page overflow:hidden, so
           the last column simply vanished at 360px. A bare element selector
           loses to one class, but only if this one is important too. */
        .cs-tbl{width:100%;min-width:0 !important;border-collapse:collapse;
          border-top:2px solid var(--cs-ink)}
        /* display:grid on the table elements. The rows keep their tr/td
           semantics and the header keeps th scope=col; only the layout is
           taken over. See the note at the top of the file. */
        .cs-tbl thead,.cs-tbl tbody{display:block}
        .cs-tbl tr{display:grid;grid-template-columns:52px 1fr 1fr;align-items:center;
          column-gap:24px;padding:16px 6px}
        .cs-tbl th,.cs-tbl td{text-align:left;padding:0}
        .cs-thead{padding:12px 6px !important;border-bottom:1px solid var(--cs-line)}
        .cs-thead th{font-family:var(--cs-mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--cs-faint);font-weight:500}
        .cs-void-tag{color:var(--cs-ox);opacity:.8}
        .cs-rb{border-bottom:1px dotted rgba(60,48,30,.28)}
        .cs-wk{font-family:var(--cs-mono);font-size:12px;color:var(--cs-muted);letter-spacing:.02em}
        .cs-void{font-size:16px;color:var(--cs-void);text-decoration:line-through;
          text-decoration-thickness:1px}
        .cs-under{font-size:16px;color:var(--cs-ink)}

        /* The settle row is the only tinted thing in the section, which is the
           point — it is the one line where the two columns stop matching. */
        .cs-settle{background:var(--cs-won-tint);box-shadow:inset 3px 0 0 var(--cs-win);
          border-bottom:none;margin-top:2px}
        .cs-settle .cs-under{color:var(--cs-win);font-weight:600}

        /* Narrow. The two columns stack and the table drops its week gutter —
           at phone width a 52px column of two-digit numbers is pure overhead. */
        @media (max-width:900px){
          .cs-wrap{padding-block:clamp(40px,8vw,64px);padding-inline:clamp(20px,5.5vw,90px)}
          .cs-body{font-size:clamp(1rem,4.2vw,1.125rem)}
          .cs-grid{grid-template-columns:minmax(0,1fr);gap:40px}
          .cs-tbl tr{grid-template-columns:34px 1fr 1fr;column-gap:12px;padding:14px 4px}
          .cs-void,.cs-under{font-size:15px}
        }
        @media (max-width:768px){
          .cs{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){.cs *{transition:none !important}}
        </style>

        <section class="cs" aria-labelledby="cs-title">
            <div class="cs-wrap">
                <div class="cs-grid">
                    <div>
                        <div class="cs-kicker"><span class="cs-r" aria-hidden="true"></span> Why It Works</div>
                        <h2 id="cs-title">A plan without stakes is just a comfortable wish</h2>
                        <p class="cs-body">You already know what the next step is. You've known for months.
                            What you don't have is a reason it has to happen this week instead of some other
                            week &mdash; because missing it costs a feeling, and feelings are cheap enough to
                            absorb forever.</p>

                        <aside class="cs-note">
                            <div class="cs-nl">&sect; 3.1 &middot; Clerk's Note</div>
                            <!-- NOTE: this states a specific statistic - a median open time of
                                 11:40pm on a Sunday. It is carried over verbatim from the section
                                 this replaces and from the supplied sheet, NOT introduced here.
                                 It cannot currently be derived from the register: /v1/ledger holds
                                 one staked contract. If it is not backed by real data it should be
                                 cut or softened, because it reads as an analytics finding. -->
                            <div class="cs-nt">The median contract is opened at 11:40pm on a Sunday.
                                We have theories about why, and none of them are flattering.</div>
                        </aside>
                    </div>

                    <div>
                        <div class="cs-cap">Same goal, recorded two ways</div>
                        <table class="cs-tbl">
                            <caption class="cs-sr">A goal tracked without stakes against the same goal under contract</caption>
                            <thead>
                                <tr class="cs-thead">
                                    <th scope="col">Wk</th>
                                    <th scope="col">Without Stakes <span class="cs-void-tag">&middot; Void</span></th>
                                    <th scope="col">Under Contract</th>
                                </tr>
                            </thead>
                            <tbody>${ROWS.map((r) => renderRow(r, false)).join('')}${renderRow(SETTLE, true)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    `;
}
