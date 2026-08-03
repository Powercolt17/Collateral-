/**
 * Collateral — "Who holds you to it".
 *
 * One hairline spine with four steps on it. Step 02 is the only branch: a riser
 * goes up to SOLO and down to RIVALRY, then the spine continues. The shared
 * steps are drawn as one continuous line, which is the point — it replaces a
 * two-column diptych that needed a footnote explaining both halves settle the
 * same way.
 *
 * Ported from a supplied React component to this project's view convention: a
 * named render function returning an HTML string with a scoped <style> block,
 * matching Header.js and CollateralHero.js. This frontend has no React —
 * react-dom is not installed — so the .jsx could not be used as authored.
 * Everything else is verbatim: the .fk- prefix, the CSS, the data-first shape.
 *
 * ── DO NOT "SIMPLIFY" THESE ──────────────────────────────────────────────────
 * Do not give RIVALRY a filled oxblood panel. The two paths differ by a 3px top
 * rule and the name colour only. A filled panel makes them read as one product
 * and its evil twin rather than two options, and it puts four background values
 * in one section.
 *
 * The !important flags in the mobile block are load-bearing. The .fk-solo /
 * .fk-rival margins create the gap between the paths and the spine on desktop
 * and have to be beaten when the layout goes vertical. Removing them leaves a
 * 34px hole in the mobile stack.
 *
 * The CTAs are buttons, not links: they trigger a flow, not a navigation. If
 * they ever become links, give them real hrefs rather than href="#".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Content is data, not markup. Adding a clause or a third mode is an array edit
 * below, not a markup edit.
 */

const STEPS = {
    connect: {
        num: '01 · CONNECT',
        title: 'The oracle reads you',
        body: 'Stripe, Shopify, YouTube. Live data at the source. Nothing you type, nothing you upload.',
    },
    lock: {
        num: '03 · LOCK',
        title: 'The capital is held',
        body: 'Escrowed for the full window. No early exit, no renegotiating once it starts.',
    },
    settle: {
        num: '04 · SETTLE',
        title: 'The date decides',
        body: 'On the closing date the oracle reports and the outcome is set. Nobody adjudicates.',
    },
};

const PATHS = [
    {
        key: 'solo',
        name: 'SOLO',
        vsLeft: 'YOU',
        vsRight: 'YOU',
        clauses: [
            "You set the target. You don't get to move it.",
            'Hit it and every dollar comes back, with a matching payout.',
            "Miss and your deposit funds someone who didn't.",
        ],
        cta: 'WRITE A SOLO CONTRACT →',
    },
    {
        key: 'rival',
        name: 'RIVALRY',
        vsLeft: 'YOU',
        vsRight: 'THEM',
        clauses: [
            'Equal capital, same metric, same clock.',
            'The escrow goes to the winner. There is no draw.',
            'Neither of you gets a vote on the result.',
        ],
        cta: 'FIND A COUNTERPARTY →',
    },
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** The landing page's existing CTA behaviour: gate on auth before contract creation. */
const DEFAULT_PATH_ACTION =
    "if(window.app &amp;&amp; window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;";

function renderStep(step, column, key) {
    return `
                <div class="fk-step" data-step="${escapeHtml(key)}" style="grid-column:${column}">
                    <span class="fk-num fk-mono">${escapeHtml(step.num)}</span>
                    <div class="fk-title">${escapeHtml(step.title)}</div>
                    <p class="fk-body">${escapeHtml(step.body)}</p>
                </div>`;
}

function renderPath(path, onSelectPath) {
    const action = onSelectPath ? onSelectPath(path.key) : DEFAULT_PATH_ACTION;
    const clauses = path.clauses
        .map((c) => `<li>${escapeHtml(c)}</li>`)
        .join('');
    return `
                <div class="fk-path fk-${escapeHtml(path.key)}">
                    <div class="fk-p-top">
                        <span class="fk-p-name">${escapeHtml(path.name)}</span>
                        <span class="fk-p-vs fk-mono"><b>${escapeHtml(path.vsLeft)}</b> vs <b>${escapeHtml(path.vsRight)}</b></span>
                    </div>
                    <ul>${clauses}</ul>
                    <button type="button" class="fk-p-link fk-mono"${action ? ` onclick="${action}"` : ''}>${escapeHtml(path.cta)}</button>
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
          --paper:#F1EEE8; --paper-hi:#F7F5F0;
          --ink:#131A2A; --ink-soft:#5A6172;
          --ox:#7C1A24; --rule:#D8D3C8; --spine:#C9C2B4;
          background:var(--paper); color:var(--ink);
          font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
          -webkit-font-smoothing:antialiased;
          padding:72px 0 96px;
        }
        .fk *{box-sizing:border-box;margin:0;padding:0}
        .fk-mono{font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}
        .fk-wrap{max-width:1180px;margin:0 auto;padding:0 32px}

        .fk-head{max-width:640px;margin-bottom:64px}
        .fk-kicker{display:flex;align-items:center;gap:10px;
          font-size:10px;letter-spacing:.22em;font-weight:700;color:var(--ox);margin-bottom:16px}
        .fk-kicker::after{content:"";flex:1;height:1px;background:var(--rule)}
        /* Matches the hero headline: oxblood, uppercase.
           NOT switched to var(--display), deliberately. --display resolves to
           Archivo in the landing subtree, but the hero h1 renders Helvetica Neue
           because .clt sets its own font-family — as does .lg and .fk. All three
           headlines therefore already share a typeface. Applying --display here
           would make this one Archivo and the hero Helvetica Neue, i.e. it would
           CREATE the font mismatch it was meant to remove. Moving all three onto
           --display together is the coherent alternative and is a separate call. */
        .fk h2{font-size:38px;font-weight:800;letter-spacing:-.025em;line-height:1.02;
          color:var(--ox);text-transform:uppercase}
        .fk-head p{margin-top:14px;font-size:15px;line-height:1.6;color:#3B4254;max-width:52ch}

        /* the spine: one hairline, steps sit on it as nodes */
        .fk-fork{
          display:grid;
          grid-template-columns:1fr 1.5fr 1fr 1fr;
          grid-template-rows:auto 1px auto;
          align-items:center;
        }
        .fk-spine{grid-column:1 / -1;grid-row:2;height:1px;background:var(--spine)}

        .fk-step{grid-row:2;position:relative;z-index:2;background:var(--paper);
          padding:0 22px 0 20px;margin-top:-1px}
        .fk-step::before{content:"";position:absolute;left:0;top:50%;width:7px;height:7px;
          margin:-3px 0 0 -3px;border-radius:50%;background:var(--ink)}
        .fk-num{font-size:9.5px;letter-spacing:.2em;color:var(--ox);font-weight:700;
          display:block;margin-bottom:9px}
        .fk-title{font-size:17px;font-weight:700;letter-spacing:-.01em;margin-bottom:8px}
        .fk-body{font-size:13px;line-height:1.55;color:var(--ink-soft);max-width:26ch}

        /* the branch: risers up to SOLO and down to RIVALRY */
        .fk-branch{grid-row:2;grid-column:2;position:relative;z-index:2;
          background:var(--paper);padding:0 26px;text-align:center}
        .fk-b-label{font-size:10px;letter-spacing:.19em;font-weight:700;color:var(--ink);
          background:var(--paper);padding:0 6px;display:inline-block}
        .fk-b-sub{display:block;font-size:9.5px;letter-spacing:.16em;color:var(--ink-soft);margin-top:6px}
        .fk-branch::before,.fk-branch::after{content:"";position:absolute;left:50%;width:1px;background:var(--spine)}
        .fk-branch::before{bottom:100%;height:34px}
        .fk-branch::after{top:100%;height:34px}

        /* the two paths */
        .fk-path{grid-column:2;background:var(--paper-hi);border:1px solid var(--rule);padding:22px 24px}
        .fk-solo{grid-row:1;margin-bottom:34px;border-top:3px solid var(--ink)}
        .fk-rival{grid-row:3;margin-top:34px;border-top:3px solid var(--ox)}
        .fk-p-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
        .fk-p-name{font-size:23px;font-weight:800;letter-spacing:-.02em}
        .fk-rival .fk-p-name{color:var(--ox)}
        .fk-p-vs{font-size:10px;letter-spacing:.17em;color:var(--ink-soft)}
        .fk-p-vs b{color:var(--ink);font-weight:700}
        .fk-rival .fk-p-vs b:last-child{color:var(--ox)}
        .fk-path ul{list-style:none;display:grid;gap:9px}
        .fk-path li{font-size:13px;line-height:1.5;padding-left:17px;position:relative}
        .fk-path li::before{content:"§";position:absolute;left:0;top:1px;color:var(--ox);font-size:11px}
        .fk-p-link{display:inline-block;margin-top:16px;background:none;border:0;cursor:pointer;
          font-size:11px;letter-spacing:.13em;font-weight:700;color:var(--ink);
          border-bottom:2px solid var(--ox);padding:0 0 3px}
        .fk-p-link:hover{color:var(--ox)}
        .fk-p-link:focus-visible{outline:2px solid var(--ink);outline-offset:3px}

        .fk-note{margin-top:56px;display:flex;justify-content:space-between;align-items:baseline;gap:20px;
          border-top:1px solid var(--rule);padding-top:18px;
          font-size:11px;letter-spacing:.15em;color:var(--ink-soft)}
        .fk-note b{color:var(--ink);font-weight:700}

        /* mobile: the spine rotates vertical, nodes on the left rail */
        @media (max-width:880px){
          .fk{padding:48px 0 64px}
          .fk-wrap{padding:0 20px}
          .fk h2{font-size:27px}
          .fk-head{margin-bottom:40px}
          /* Flex column rather than block, purely to reorder. In source order
             SOLO precedes the branch, which is right for the grid — grid-row
             places it above the spine. Stacked linearly that order reads
             01 CONNECT, SOLO, 02 CHOOSE, RIVALRY, 03 LOCK: the SOLO panel turns
             up before the step that introduces it, and the numbers run out of
             sequence. order: puts the branch back in front of both paths
             without touching the DOM or the desktop grid. */
          .fk-fork{display:flex;flex-direction:column;position:relative;padding-left:26px}
          .fk-step[data-step="connect"]{order:1}
          .fk-branch{order:2}
          .fk-solo{order:3}
          .fk-rival{order:4}
          .fk-step[data-step="lock"]{order:5}
          .fk-step[data-step="settle"]{order:6}
          .fk-fork::before{content:"";position:absolute;left:3px;top:6px;bottom:6px;width:1px;background:var(--spine)}
          .fk-spine{display:none}
          .fk-step,.fk-branch{background:none;padding:0 0 30px 0;text-align:left;margin:0}
          .fk-step::before{left:-26px;top:7px;margin:0}
          .fk-branch{padding-bottom:18px}
          .fk-branch::before,.fk-branch::after{display:none}
          .fk-b-label{padding:0;background:none}
          .fk-body{max-width:none}
          .fk-path{margin:0 0 18px 0 !important;border-top-width:3px}
          .fk-rival{margin-bottom:30px !important}
          .fk-p-name{font-size:20px}
          .fk-note{flex-direction:column;gap:8px;margin-top:34px}
        }
        @media (prefers-reduced-motion:reduce){.fk *{transition:none !important}}
        </style>

        <section class="fk" aria-labelledby="fk-title">
            <div class="fk-wrap">
                <div class="fk-head">
                    <div class="fk-kicker fk-mono">HOW IT SETTLES</div>
                    <h2 id="fk-title">Who holds you to it</h2>
                    <p>
                        Every contract runs the same four steps. Only one of them has a choice in it — whether
                        you're staking against your own record or against somebody who wants it as badly as you
                        claim to.
                    </p>
                </div>

                <div class="fk-fork">
                    <div class="fk-spine" aria-hidden="true"></div>
${renderStep(STEPS.connect, 1, 'connect')}
${renderPath(PATHS[0], onSelectPath)}

                    <div class="fk-branch">
                        <span class="fk-b-label fk-mono">
                            02 · CHOOSE
                            <span class="fk-b-sub">WHO'S ON THE OTHER SIDE?</span>
                        </span>
                    </div>
${renderPath(PATHS[1], onSelectPath)}
${renderStep(STEPS.lock, 3, 'lock')}
${renderStep(STEPS.settle, 4, 'settle')}
                </div>

                <div class="fk-note fk-mono">
                    <span>STEPS 01, 03 AND 04 ARE <b>IDENTICAL</b> IN BOTH MODES</span>
                    <span>CUSTODY · <b>STRIPE CONNECT</b></span>
                </div>
            </div>
        </section>
    `;
}
