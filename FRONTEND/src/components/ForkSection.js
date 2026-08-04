/**
 * Collateral — "Who holds you to it".
 *
 * REBUILT against a supplied design sheet. The layout it replaces threaded the
 * two paths INTO a single spine, with SOLO above step 02 and RIVALRY below it.
 * That is why the section rendered as overlapping blocks: the paths and the
 * shared steps were competing for the same grid rows, and at real content
 * lengths they collided.
 *
 * The shape now separates the two ideas. A four-step timeline runs across the
 * top — every contract does all four, in order — and the fork sits underneath as
 * two cards, which is the one step that has a choice in it. Nothing has to be
 * explained by a footnote because the structure says it.
 *
 * This frontend has no React, so supplied sheets cannot ship as authored. Same
 * convention as Header.js, CollateralHero.js and LedgerSection.js: a named
 * render function returning an HTML string with a scoped <style> block.
 *
 * SCOPING. Every selector is namespaced under .fk. The sheet styles bare *,
 * body, h1, .card, .step, .steps, .clause and .foot — this ships in the same
 * document as the hero, the ledger and the oracle band, so pasted as authored
 * it would restyle all three. The keyframes are prefixed too: nodeCycle and
 * numCycle are generic enough to collide with anything.
 *
 * It is an h2, not the sheet's h1. The hero owns the page's h1.
 *
 * ── DO NOT "SIMPLIFY" THESE ──────────────────────────────────────────────────
 * Do not give RIVALRY a filled oxblood panel. The two cards differ by the 2px
 * top rule and the name colour only. A filled panel makes them read as one
 * product and its evil twin rather than two options, and it puts four
 * background values in one section.
 *
 * The travelling node is a pure CSS stagger: one 8s animation on all four
 * steps with a negative delay per step, so they light in sequence without any
 * JS and without a timer to fall out of sync. Do not convert it to setInterval.
 *
 * The CTAs are buttons, not links: they trigger a flow, not a navigation. If
 * they ever become links, give them real hrefs rather than href="#".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Content is data, not markup. Adding a clause or a fifth step is an array edit
 * below, not a markup edit. Clauses carry an optional "b" - the substring to
 * emphasise — which is applied AFTER escaping, so the emphasis cannot be used
 * to inject markup.
 */

const STEPS = [
    {
        num: '01 · Connect',
        title: 'The oracle reads you',
        body: 'Stripe, Shopify, YouTube — live data straight from the source. Nothing you type, nothing you upload.',
    },
    {
        num: '02 · Choose',
        title: "Who's on the other side?",
        body: "Stake against your own record, or against a rival. This is the only step that's yours to decide.",
    },
    {
        num: '03 · Lock',
        title: 'The capital is held',
        body: 'Escrowed for the full window. No early exit, no renegotiating once the clock starts.',
    },
    {
        num: '04 · Settle',
        title: 'The date decides',
        body: 'On the closing date the oracle reports and the outcome is set. Nobody adjudicates.',
    },
];

const PATHS = [
    {
        key: 'solo',
        name: 'Solo',
        vsLeft: 'You',
        vsRight: 'You',
        clauses: [
            { t: "You set the target. You don't get to move it." },
            { t: 'Hit it and every dollar comes back — with a matching payout.', b: 'with a matching payout' },
            { t: "Miss, and your deposit funds someone who didn't." },
        ],
        cta: 'Write a Solo Contract',
    },
    {
        key: 'rival',
        name: 'Rivalry',
        vsLeft: 'You',
        vsRight: 'Them',
        clauses: [
            { t: 'Equal capital, same metric, same clock.' },
            { t: 'The escrow goes to the winner. There is no draw.', b: 'There is no draw.' },
            { t: 'Neither of you gets a vote on the result.' },
        ],
        cta: 'Find a Counterparty',
    },
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* Emphasis is applied to the ESCAPED string, and the needle is escaped the same
   way before it is searched for. A clause can therefore never introduce markup
   through its "b" field — the only tags that reach the page are the ones this
   function writes. */
function renderClause(clause) {
    const safe = escapeHtml(clause.t);
    const body = clause.b
        ? safe.replace(escapeHtml(clause.b), `<b>${escapeHtml(clause.b)}</b>`)
        : safe;
    return `
                        <div class="fk-clause"><span class="fk-mark" aria-hidden="true">&sect;</span><span>${body}</span></div>`;
}

/** The landing page's existing CTA behaviour: gate on auth before contract creation. */
const DEFAULT_PATH_ACTION =
    "if(window.app &amp;&amp; window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;";

function renderStep(step, i) {
    return `
                    <div class="fk-step" style="--d:${[0, -6, -4, -2][i]}s">
                        <div class="fk-num">${escapeHtml(step.num)}</div>
                        <h3>${escapeHtml(step.title)}</h3>
                        <p>${escapeHtml(step.body)}</p>
                    </div>`;
}

function renderPath(path, onSelectPath) {
    const action = onSelectPath ? onSelectPath(path.key) : DEFAULT_PATH_ACTION;
    const clauses = path.clauses.map(renderClause).join('');
    return `
                    <div class="fk-card fk-${escapeHtml(path.key)}">
                        <div class="fk-c-head">
                            <div class="fk-c-name">${escapeHtml(path.name)}</div>
                            <div class="fk-c-vs"><b>${escapeHtml(path.vsLeft)}</b> vs <b>${escapeHtml(path.vsRight)}</b></div>
                        </div>
                        <div class="fk-c-rule"></div>${clauses}
                        <button type="button" class="fk-c-cta"${action ? ` onclick="${action}"` : ''}>${escapeHtml(path.cta)} <span class="fk-arw" aria-hidden="true">&rarr;</span></button>
                    </div>`;
}

/**
 * @param {object} [options]
 * @param {(key: string) => string} [options.onSelectPath] Given "solo" or
 *   "rival", returns the inline handler for that path's CTA. Called at render
 *   time. Omit to keep the landing page's existing auth-gated behaviour.
 */
export function renderForkSection(options = {}) {
    const { onSelectPath } = options;

    return `
        <style>
        .fk{
          --fk-parch:#F1E8D3;
          --fk-card:#F6EFDE;
          --fk-ink:#211B12;
          --fk-ink-soft:#5B5140;
          --fk-muted:#9A8C6F;
          --fk-faint:#B4A98C;
          --fk-ox:#7C1D2B;
          --fk-line:rgba(60,48,30,.16);
          --fk-serif:"EB Garamond",Georgia,serif;
          --fk-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --fk-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--fk-parch);
          color:var(--fk-ink);
          font-family:var(--fk-serif);
          -webkit-font-smoothing:antialiased;
        }
        .fk *{box-sizing:border-box;margin:0;padding:0}
        .fk-wrap{max-width:1440px;margin:0 auto;padding:64px 90px 56px}

        /* ---- header ---- */
        .fk-kicker{font-size:11px;letter-spacing:.4em;text-transform:uppercase;
          color:var(--fk-muted);font-weight:600;margin-bottom:20px}
        .fk h2{
          font-family:var(--fk-display);font-weight:600;color:var(--fk-ox);
          font-size:clamp(34px,3.6vw,52px);line-height:1;letter-spacing:.005em;
          text-transform:uppercase;font-variant:small-caps;margin-bottom:20px;
        }
        .fk-head p{font-size:18px;line-height:1.55;color:var(--fk-ink-soft);max-width:600px}

        /* ---- four-step timeline ---- */
        .fk-steps{position:relative;display:grid;grid-template-columns:repeat(4,1fr);
          gap:34px;margin-top:60px}
        /* The rail the nodes sit on. Inset 6px each end so it starts and stops
           under the first and last node rather than running off the grid. */
        .fk-steps::before{content:"";position:absolute;top:6px;left:6px;right:6px;
          height:1px;background:var(--fk-line);z-index:0}

        .fk-step{position:relative;padding-top:30px}
        .fk-step::before{
          content:"";position:absolute;top:0;left:0;width:13px;height:13px;border-radius:50%;
          background:var(--fk-parch);border:2px solid var(--fk-muted);z-index:1;
        }
        .fk-num{
          font-family:var(--fk-mono);font-size:12px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--fk-muted);margin-bottom:12px;
        }
        .fk-step h3{font-family:var(--fk-display);font-size:24px;font-weight:600;
          letter-spacing:.01em;margin-bottom:9px;color:var(--fk-ink);line-height:1.15}
        .fk-step p{font-size:15px;line-height:1.5;color:var(--fk-ink-soft);max-width:250px}

        /* THE TRAVELLING NODE IS A STAGGER, NOT A TIMER.
           One 8s animation on all four steps, each given a negative delay so it
           starts part-way through its own cycle: 0, -6, -4, -2. Each node is lit
           for the first 25% of the cycle, so exactly one is lit at a time and
           the light appears to walk 01 -> 02 -> 03 -> 04.

           Negative delays matter — a positive delay would leave every node dark
           until its first turn came round. There is no JS and no interval, so
           nothing can drift out of step or keep running after the section
           scrolls away. */
        @media (prefers-reduced-motion:no-preference){
          .fk-step::before{animation:fk-node 8s linear infinite;animation-delay:var(--d)}
          .fk-num{animation:fk-numlit 8s linear infinite;animation-delay:var(--d)}
        }
        @keyframes fk-node{
          0%  {background:var(--fk-ox);border-color:var(--fk-ox);transform:scale(1.18);
               box-shadow:0 0 0 4px rgba(124,29,43,.16)}
          16% {background:var(--fk-ox);border-color:var(--fk-ox);transform:scale(1.18);
               box-shadow:0 0 0 9px rgba(124,29,43,0)}
          25% {background:var(--fk-parch);border-color:var(--fk-muted);transform:scale(1);
               box-shadow:0 0 0 0 rgba(124,29,43,0)}
          100%{background:var(--fk-parch);border-color:var(--fk-muted);transform:scale(1);
               box-shadow:0 0 0 0 rgba(124,29,43,0)}
        }
        @keyframes fk-numlit{
          0%{color:var(--fk-ox)} 16%{color:var(--fk-ox)}
          25%{color:var(--fk-muted)} 100%{color:var(--fk-muted)}
        }
        /* Nothing cycles for a reader who asked for that. Step 02 stays lit,
           because it is the one the fork below belongs to — a dark rail would
           leave the section with no visible relationship between the two. */
        @media (prefers-reduced-motion:reduce){
          .fk-step:nth-child(2)::before{background:var(--fk-ox);border-color:var(--fk-ox)}
          .fk-step:nth-child(2) .fk-num{color:var(--fk-ox)}
          .fk *{transition:none !important}
        }

        /* ---- the fork ---- */
        .fk-fork{margin-top:56px}
        .fk-forklabel{display:flex;align-items:center;gap:16px;margin-bottom:22px}
        .fk-forklabel .fk-t{font-family:var(--fk-mono);font-size:12px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--fk-ox);font-weight:500}
        .fk-forklabel .fk-l{flex:1;height:1px;background:var(--fk-line)}

        .fk-cards{display:grid;grid-template-columns:1fr 1fr;gap:26px}
        .fk-card{
          position:relative;background:var(--fk-card);border:1px solid var(--fk-line);
          padding:32px 34px 30px;overflow:hidden;
          transition:transform .25s cubic-bezier(.22,1,.36,1),
                     box-shadow .25s cubic-bezier(.22,1,.36,1),border-color .25s;
        }
        /* The ONLY things separating the two modes: this rule and the name
           colour. See the note at the top of the file before changing it. */
        .fk-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;
          background:var(--fk-muted)}
        .fk-rival::before{background:var(--fk-ox)}
        .fk-card:hover{transform:translateY(-3px);box-shadow:0 18px 40px rgba(60,40,20,.10);
          border-color:rgba(124,29,43,.3)}

        .fk-c-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;gap:16px}
        .fk-c-name{font-family:var(--fk-display);font-size:30px;font-weight:600;
          text-transform:uppercase;font-variant:small-caps;letter-spacing:.03em;color:var(--fk-ink)}
        .fk-rival .fk-c-name{color:var(--fk-ox)}
        .fk-c-vs{font-family:var(--fk-mono);font-size:11px;letter-spacing:.18em;
          text-transform:uppercase;color:var(--fk-faint);font-weight:500;white-space:nowrap}
        .fk-c-vs b{color:var(--fk-ink-soft);font-weight:500}
        .fk-c-rule{height:1px;background:var(--fk-line);margin:18px 0 20px}

        .fk-clause{display:flex;gap:14px;padding:9px 0;font-size:16px;line-height:1.45;
          color:var(--fk-ink-soft)}
        .fk-mark{font-family:var(--fk-mono);color:var(--fk-ox);font-size:15px;flex:none;
          opacity:.8;padding-top:1px}
        .fk-clause b{color:var(--fk-ink);font-weight:600}

        .fk-c-cta{
          background:none;border:0;cursor:pointer;
          display:inline-flex;align-items:center;gap:9px;margin-top:20px;
          font-family:var(--fk-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;
          color:var(--fk-ink);font-weight:500;border-bottom:1.5px solid var(--fk-ox);
          padding-bottom:6px;
          transition:gap .25s cubic-bezier(.22,1,.36,1),color .25s;
        }
        .fk-arw{color:var(--fk-ox);transition:transform .25s cubic-bezier(.22,1,.36,1)}
        .fk-card:hover .fk-c-cta{gap:13px}
        .fk-card:hover .fk-arw{transform:translateX(4px)}
        .fk-c-cta:focus-visible{outline:2px solid var(--fk-ox);outline-offset:3px}

        /* ---- footer ---- */
        .fk-foot{display:flex;align-items:center;gap:14px;margin-top:44px;padding-top:22px;
          border-top:1px solid var(--fk-line);flex-wrap:wrap}
        .fk-foot .fk-t{font-size:11px;letter-spacing:.24em;text-transform:uppercase;
          color:var(--fk-muted);font-weight:600}
        .fk-foot b{color:var(--fk-ink-soft);font-weight:600}
        .fk-foot .fk-sep{color:var(--fk-faint);margin:0 8px}

        /* Narrow. The four-across timeline becomes a vertical rail with the
           nodes down the left, and the two cards stack. */
        @media (max-width:900px){
          .fk-wrap{padding-block:clamp(40px,8vw,64px);padding-inline:clamp(20px,5.5vw,90px)}
          .fk-head p{font-size:clamp(1rem,4.2vw,1.125rem)}
          .fk-step p{font-size:clamp(.9rem,3.8vw,15px)}
          .fk-steps{grid-template-columns:1fr;gap:0;margin-top:40px}
          .fk-steps::before{top:6px;bottom:6px;left:6px;right:auto;width:1px;height:auto}
          .fk-step{padding:0 0 30px 30px}
          .fk-step::before{top:4px}
          .fk-step p{max-width:none}
          .fk-fork{margin-top:40px}
          .fk-cards{grid-template-columns:1fr;gap:18px}
          .fk-card{padding:26px 22px 24px}
          .fk-c-name{font-size:24px}
          .fk-foot{margin-top:32px}
        }
        /* FULL BLEED BELOW 768. mobile.css forces padding-left/right:16px on .lp
           at exactly this width, so the section stopped 16px short of both edges
           and its own parchment never reached them. Those two strips were the
           white side margins - the page ground showing past the section, not the
           section itself. 100vw plus the negative margin escapes the gutter, the
           same technique the hero already documents. Pinned to 768 deliberately:
           above it there is no gutter to escape. */
        @media (max-width:768px){
          .fk{width:100vw;margin-left:calc(50% - 50vw)}
        }
        </style>

        <section class="fk" aria-labelledby="fk-title">
            <div class="fk-wrap">
                <div class="fk-head">
                    <div class="fk-kicker">How It Settles</div>
                    <h2 id="fk-title">Who holds you to it</h2>
                    <p>
                        Every contract runs the same four steps. Only one of them gives you a choice
                        &mdash; whether you're staking against your own record, or against someone who
                        wants it as badly as you claim to.
                    </p>
                </div>

                <div class="fk-steps">${STEPS.map(renderStep).join('')}
                </div>

                <div class="fk-fork">
                    <div class="fk-forklabel">
                        <span class="fk-t">02 &middot; Choose your side</span>
                        <span class="fk-l" aria-hidden="true"></span>
                    </div>
                    <div class="fk-cards">${PATHS.map((p) => renderPath(p, onSelectPath)).join('')}
                    </div>
                </div>

                <div class="fk-foot">
                    <div class="fk-t"><b>Verification is automatic</b><span class="fk-sep">&middot;</span>No appeals<span class="fk-sep">&middot;</span>No extensions<span class="fk-sep">&middot;</span>Custody <b>Stripe Connect</b></div>
                </div>
            </div>
        </section>
    `;
}
