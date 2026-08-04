/**
 * Collateral — "Four APIs decide every contract".
 *
 * REBUILT against a supplied design sheet and EXTRACTED out of Landing.js, the
 * same move as CaseSection.js. It was styled by the shared .title / .lede /
 * .eyebrow rules that six sections use, and the sheet re-sets the heading in
 * Cormorant against the old grotesque, so editing in place would have restyled
 * the rest of the page.
 *
 * SCOPING. Everything sits under .orc. The sheet styles bare *, body, h1, .row,
 * .thead, .tile, .cap and .note — .row alone collides with the ledger's table in
 * the same document. h2, not the sheet's h1: the hero owns that.
 *
 * THE TABLE STAYS A TABLE, laid out with display:grid on the table elements.
 * Same reasoning as CaseSection: real tabular data, real th scope=col, and the
 * markup being replaced already had both. min-width:0 is !important because
 * mobile.css carries a bare "table { min-width:600px !important }" under 768px
 * for the wide data tables on other routes.
 *
 * ── THE CADENCES ARE REAL, AND ONE OF THEM WAS WRONG ─────────────────────────
 * These are not decorative. They are read from DEFAULT_CADENCE_MS in
 * src/services/oracle.ts:
 *
 *     X: 60 min · YOUTUBE: 60 min · STRIPE: 6h · SHOPIFY: 6h
 *
 * The section this replaces published "Every 12h" for YouTube. The code polls
 * it every SIXTY MINUTES. That was a live page understating how often the
 * product reads a connected account by twelve times, so it is corrected here to
 * Every 1h rather than carried across.
 *
 * They are also a BASELINE, not a fixed rate. computeNextCheckAt escalates to
 * 15 minutes once a contract passes 80% of target or enters its final 24 hours,
 * and to 5 minutes past 95%. A flat "Every 6h" with no qualifier reads as the
 * whole truth, so the footnote under the table states the escalation.
 *
 * If DEFAULT_CADENCE_MS changes, this table has to change with it. There is no
 * endpoint publishing it, so it cannot be wired live today — that is the real
 * fix and it is worth doing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MARKS = {
    stripe: '<svg viewBox="0 0 24 24" role="img" aria-label="Stripe"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>',
    x: '<svg viewBox="0 0 24 24" role="img" aria-label="X"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" role="img" aria-label="YouTube"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    shopify: '<svg viewBox="0 0 24 24" role="img" aria-label="Shopify"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>',
};

/* cadence values mirror DEFAULT_CADENCE_MS in src/services/oracle.ts */
const ORACLES = [
    { key: 'stripe', name: 'Stripe', metrics: 'Net revenue, MRR, order volume', cadence: 'Every 6h' },
    { key: 'x', name: 'X', metrics: 'Followers, impressions, post reach', cadence: 'Every 1h' },
    { key: 'youtube', name: 'YouTube', metrics: 'Subscribers, views, watch time', cadence: 'Every 1h' },
    { key: 'shopify', name: 'Shopify', metrics: 'Orders, revenue, average order value', cadence: 'Every 6h' },
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderOracle(o) {
    return `
                            <tr class="orc-rb">
                                <td class="orc-platform">
                                    <span class="orc-tile orc-t-${escapeHtml(o.key)}" aria-hidden="true">${MARKS[o.key]}</span>
                                    <span class="orc-pname">${escapeHtml(o.name)}</span>
                                </td>
                                <td class="orc-metrics">${escapeHtml(o.metrics)}</td>
                                <td class="orc-cad">${escapeHtml(o.cadence)}</td>
                            </tr>`;
}

export function renderOracleSection() {
    return `
        <style>
        .orc{
          --orc-parch:#F1E8D3;
          --orc-ink:#211B12;
          --orc-ink-soft:#5B5140;
          --orc-muted:#9A8C6F;
          --orc-faint:#B4A98C;
          --orc-logo:#2C2418;
          --orc-ox:#7C1D2B;
          --orc-line:rgba(60,48,30,.16);
          --orc-serif:"EB Garamond",Georgia,serif;
          --orc-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --orc-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--orc-parch);
          color:var(--orc-ink);
          font-family:var(--orc-serif);
          -webkit-font-smoothing:antialiased;
        }
        .orc *{box-sizing:border-box;margin:0;padding:0}
        .orc-wrap{width:100%;max-width:1440px;margin:0 auto;padding:76px 90px 72px}

        /* ---- intro ---- */
        .orc-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.82fr);
          gap:76px;align-items:start;margin-bottom:54px}
        .orc-kicker{display:flex;align-items:center;gap:12px;font-family:var(--orc-mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--orc-ox);
          font-weight:500;margin-bottom:22px}
        .orc-kicker .orc-r{height:1px;width:26px;background:var(--orc-ox);opacity:.7;flex:none}
        .orc h2{font-family:var(--orc-display);font-weight:600;
          font-size:clamp(32px,3.5vw,50px);line-height:1.04;letter-spacing:.004em;
          color:var(--orc-ink);margin-bottom:24px}
        .orc-body{font-size:18px;line-height:1.6;color:var(--orc-ink-soft);max-width:440px}

        .orc-note{padding-top:22px;border-top:1px solid var(--orc-line)}
        .orc-nl{font-family:var(--orc-mono);font-size:11px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--orc-ox);font-weight:500;margin-bottom:10px}
        .orc-nt{font-family:var(--orc-mono);font-size:12px;line-height:1.7;letter-spacing:.02em;
          text-transform:uppercase;color:var(--orc-muted)}

        /* ---- register ---- */
        .orc-cap{font-family:var(--orc-mono);font-size:11px;letter-spacing:.24em;
          text-transform:uppercase;color:var(--orc-muted);font-weight:500;margin-bottom:16px}
        .orc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;
          overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
        /* min-width:0 needs the !important — see the note at the top of the file. */
        .orc-tbl{width:100%;min-width:0 !important;border-collapse:collapse;
          border-top:2px solid var(--orc-ink)}
        .orc-tbl thead,.orc-tbl tbody{display:block}
        .orc-tbl tr{display:grid;grid-template-columns:280px minmax(0,1fr) 150px;
          align-items:center;column-gap:28px;padding:18px 6px}
        .orc-tbl th,.orc-tbl td{text-align:left;padding:0}
        .orc-thead{padding:13px 6px !important;border-bottom:1px solid var(--orc-line)}
        .orc-thead th{font-family:var(--orc-mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--orc-faint);font-weight:500}
        .orc-thead th:last-child{text-align:right}
        .orc-rb{border-bottom:1px dotted rgba(60,48,30,.26)}

        .orc-platform{display:flex;align-items:center;gap:16px;min-width:0}
        .orc-tile{width:38px;height:38px;flex:none;border:1px solid var(--orc-line);
          border-radius:7px;background:rgba(255,255,255,.28);
          display:flex;align-items:center;justify-content:center;color:var(--orc-logo)}
        .orc-tile svg{width:auto;fill:currentColor;display:block}
        /* Optically balanced per brand, the same way the hero band is. */
        .orc-t-stripe svg{height:19px}
        .orc-t-x svg{height:16px}
        .orc-t-youtube svg{height:15px}
        .orc-t-shopify svg{height:21px}
        .orc-pname{font-family:var(--orc-display);font-size:23px;font-weight:600;
          letter-spacing:.01em;color:var(--orc-ink)}

        .orc-metrics{font-size:16px;color:var(--orc-ink-soft)}
        .orc-cad{font-family:var(--orc-mono);font-size:13px;letter-spacing:.04em;
          color:var(--orc-ink-soft);text-align:right}

        /* The escalation footnote. Without it a flat "Every 6h" reads as the
           whole rule, and it is only the baseline. */
        .orc-foot{margin-top:16px;font-family:var(--orc-mono);font-size:11px;
          line-height:1.7;letter-spacing:.02em;color:var(--orc-muted)}

        @media (max-width:900px){
          .orc-wrap{padding-block:clamp(40px,8vw,64px);padding-inline:clamp(20px,5.5vw,90px)}
          .orc-intro{grid-template-columns:minmax(0,1fr);gap:34px;margin-bottom:36px}
          .orc-body{font-size:clamp(1rem,4.2vw,1.125rem);max-width:none}
          /* Cadence drops out of the row and rides under the platform name. Three
             columns cannot hold at phone width without shredding the metrics
             list, and the cadence is the shortest cell. */
          .orc-tbl tr{grid-template-columns:minmax(0,1fr) 84px;column-gap:14px;padding:14px 4px}
          .orc-thead th:nth-child(2){display:none}
          .orc-tbl td.orc-metrics{grid-column:1 / -1;margin-top:6px;font-size:15px}
          .orc-tile{width:32px;height:32px}
          .orc-pname{font-size:20px}
          .orc-cad{font-size:12px}
        }
        @media (max-width:768px){
          .orc{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){.orc *{transition:none !important}}
        </style>

        <section class="orc" aria-labelledby="orc-title">
            <div class="orc-wrap">
                <div class="orc-intro">
                    <div>
                        <div class="orc-kicker"><span class="orc-r" aria-hidden="true"></span> Verification Sources</div>
                        <h2 id="orc-title">Four APIs decide every contract</h2>
                        <p class="orc-body">Collateral does not score you. It reads the same numbers your
                            platform already reports, on a fixed schedule, and settles on whatever it
                            finds there.</p>
                    </div>
                    <aside class="orc-note">
                        <div class="orc-nl">&sect; 3.4 &middot; Read-Only Scopes</div>
                        <div class="orc-nt">Read-only scopes only. Collateral cannot post, message, refund,
                            or change a single setting on any account you connect &mdash; and the token can be
                            revoked from your side at any time without affecting an open contract's
                            settlement.</div>
                    </aside>
                </div>

                <div>
                    <div class="orc-cap">Register of accepted oracles &middot; Reading parameters</div>
                    <table class="orc-tbl">
                        <caption class="orc-sr">Accepted verification oracles, the metrics each one reads, and how often it is polled</caption>
                        <thead>
                            <tr class="orc-thead">
                                <th scope="col">Platform</th>
                                <th scope="col">Metrics Read</th>
                                <th scope="col">Poll Cadence</th>
                            </tr>
                        </thead>
                        <tbody>${ORACLES.map(renderOracle).join('')}
                        </tbody>
                    </table>
                    <p class="orc-foot">Baseline cadence. Polling tightens to every 15 minutes once a
                        contract passes 80% of its target or enters its final 24 hours, and to every
                        5 minutes past 95%.</p>
                </div>
            </div>
        </section>
    `;
}
