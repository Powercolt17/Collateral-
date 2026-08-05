/**
 * Collateral — "Losers pay winners. That is the whole engine."
 *
 * REBUILT on a supplied HTML sheet. This frontend has no React, so designs
 * arrive as markup and are ported to the render-function convention.
 *
 * ── DO NOT PUT A BACKTICK IN THESE CSS COMMENTS ──────────────────────────────
 * The whole style block lives inside a template literal. One backtick anywhere
 * below closes the literal and the landing page dies with a syntax error. Use
 * double quotes or caps for emphasis. (This block sits above the literal, so
 * backticks are safe up here.)
 *
 * ── THE ANIMATION IS NOW PURE CSS, WHICH REMOVES A JS DEPENDENCY ─────────────
 * The version this replaces was driven by runFlow() in Landing.js, reaching in
 * by id — #track for injected coins, #pool-amt for a count-up, #pool-bar,
 * #winners, #replay — and playing once behind an IntersectionObserver.
 *
 * The supplied design animates entirely in CSS from one master duration, --T,
 * so every part is phase-locked by construction instead of by a chain of
 * setTimeouts that can drift. None of those ids exist any more.
 *
 * THAT IS SAFE, AND IT WAS CHECKED RATHER THAN ASSUMED: runFlow opens with
 * "if (!track || !poolBar || !poolAmt) return;", so with the hooks gone it
 * returns immediately rather than throwing. It is now dead code in Landing.js
 * and can go whenever that file is next touched — left alone here only because
 * a parallel session is editing it.
 *
 * REPLAY IS WIRED, because a control that says Replay and does nothing is worse
 * than no control at all. See initFlowSection.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * The sheet styles bare *, body, h1, .section, .panel, .card, .col, .track,
 * .pill and .foot. This ships in the same document as the hero, the header, the
 * ledger and the market views, so pasted as authored it would restyle the site
 * — .card and .foot alone reach several other sections. Every selector is
 * namespaced under .flw and every keyframe is prefixed flw-.
 *
 * It is an h2, not the h1 the sheet marks up: the hero owns the page's h1 and a
 * second would flatten the document outline.
 *
 * FONTS cost nothing new. Cormorant Garamond, EB Garamond and IBM Plex Mono are
 * all already requested in index.html, so the sheet's own font <link> is
 * dropped rather than duplicated.
 *
 * ── THE FIGURES NOW ADD UP, AND PREVIOUSLY THEY DID NOT ──────────────────────
 * The version this replaces split a $1,500 forfeit into +$240, +$120 and +$180,
 * and the note above it asserted "the numbers still add up". They came to $540.
 * A panel whose entire argument is "100% recirculates" was visibly failing to
 * recirculate 64% of the money, in the one place a reader checks.
 *
 * The supplied figures — +$640, +$500, +$360 — sum to exactly $1,500, and the
 * distribution bar's segments carry the matching 42.7 / 33.3 / 24 per cent.
 *
 * ── WHY THIS ILLUSTRATION IS ALLOWED TO EXIST ────────────────────────────────
 * /v1/market/homepage-stats reports contractsSettled 0 and totalPaidOut 0. No
 * cycle has closed and nobody has been paid, so this cannot be presented as a
 * record. It is framed as a WORKED EXAMPLE throughout — "Example contract",
 * "Winning contract 01" — with no date, no cycle number and no handles. An
 * earlier draft paid @revpilot, a REAL principal in the ledger; attaching an
 * invented payout to a real account is worse than inventing an account. The
 * mechanism is real and worth explaining. The event is not, and is never
 * dressed as one.
 */

export function renderFlowSection() {
    return `
        <style>
        .flw{
          --parch:#F1E8D3; --paper:#FAF5E8; --ink:#211B12; --ink-soft:#5B5140;
          --muted:#9A8C6F; --ox:#7C1D2B; --win:#4E6B3E;
          --line:rgba(60,48,30,.16); --dot:rgba(60,48,30,.28);
          --win-tint:rgba(78,107,62,.10); --win-border:rgba(78,107,62,.4);
          --loss-tint:rgba(124,29,43,.07); --loss-border:rgba(124,29,43,.32);
          /* ONE master cycle. Every animation here derives its timing from it,
             so the comet, the node flash, the pool glow and the winner pops
             stay phase-locked whatever it is set to. Change this one value and
             the whole panel re-times together. */
          --T:5s;
          --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          --serif:"EB Garamond",Georgia,serif;
          --display:"Cormorant Garamond",Georgia,serif;
          position:relative;width:100%;max-width:1440px;margin:0 auto;
          padding:76px 90px 72px;
          background:var(--parch);color:var(--ink);
          font-family:var(--serif);-webkit-font-smoothing:antialiased;
        }
        .flw *{box-sizing:border-box;margin:0;padding:0}

        .flw-wm{position:absolute;top:34px;right:80px;font-family:var(--display);
          font-weight:600;font-size:190px;line-height:.8;color:rgba(33,27,18,.05);
          pointer-events:none;user-select:none}

        .flw-kicker{display:flex;align-items:center;gap:12px;font-family:var(--mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--ox);
          font-weight:500;margin-bottom:22px}
        .flw-kicker i{height:1px;width:26px;background:var(--ox);opacity:.7;flex:none}

        .flw h2{font-family:var(--display);font-weight:600;font-size:50px;
          line-height:1.04;color:var(--ink);margin-bottom:24px;max-width:620px}
        .flw-lede{font-size:18px;line-height:1.6;color:var(--ink-soft);max-width:470px}

        /* ---- panel ---- */
        .flw-panel{margin-top:50px;background:var(--paper);border:1px solid var(--line);
          border-radius:4px;box-shadow:0 14px 34px rgba(60,40,20,.08);overflow:hidden}
        .flw-phead{display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:15px 26px;border-bottom:1px solid var(--line);font-family:var(--mono);
          font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
        .flw-rt{color:var(--ink-soft)}

        .flw-flow{display:grid;grid-template-columns:1fr .72fr 1fr;align-items:stretch}
        .flw-col{padding:30px;display:flex;flex-direction:column;min-width:0}
        .flw-mid{border-left:1px solid var(--line);border-right:1px solid var(--line)}
        .flw-col-label{font-family:var(--mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--muted);margin-bottom:16px;min-height:13px}

        .flw-card{flex:1;border:1px solid;border-radius:4px;padding:24px;
          font-family:var(--mono);display:flex;flex-direction:column}
        .flw-denied{background:var(--loss-tint);border-color:var(--loss-border)}
        .flw-cid{font-size:11px;color:var(--ink-soft);letter-spacing:.04em;margin-bottom:14px}
        .flw-cid b{color:var(--ox)}
        .flw-denied .flw-amt{font-size:34px;font-weight:600;color:var(--ox);
          letter-spacing:.01em;margin-bottom:10px;transform-origin:left center;
          animation:flw-emit var(--T) ease-out infinite}
        .flw-desc{font-size:12.5px;color:var(--muted)}
        .flw-denied .flw-foot{margin-top:auto;padding-top:20px;
          border-top:1px dotted var(--loss-border);font-size:10.5px;letter-spacing:.1em;
          text-transform:uppercase;color:var(--ox);opacity:.85}

        /* ---- connector ---- */
        .flw-conn{flex:1;position:relative;display:flex;align-items:center;justify-content:center}
        .flw-track{position:absolute;left:0;right:4px;top:50%;height:2px;background:var(--ox);
          opacity:.4;z-index:1}
        .flw-track::after{content:"";position:absolute;right:-3px;top:-5px;
          border-left:11px solid var(--ox);border-top:6px solid transparent;
          border-bottom:6px solid transparent;opacity:.6}
        .flw-pillwrap{position:relative;z-index:3;text-align:center;background:var(--paper);
          padding:0 6px}
        .flw-pill{position:relative;background:var(--paper);border:1px solid var(--loss-border);
          color:var(--ox);font-family:var(--mono);font-size:10px;letter-spacing:.14em;
          text-transform:uppercase;font-weight:500;padding:11px 15px;border-radius:3px;
          line-height:1.5;display:inline-block;max-width:180px}
        .flw-pill::after{content:"";position:absolute;inset:-7px;border:1.5px solid var(--ox);
          border-radius:6px;opacity:0;pointer-events:none;
          animation:flw-nodeflash var(--T) ease-out infinite}
        .flw-moves{margin-top:12px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;
          text-transform:uppercase;color:var(--muted)}
        .flw-moves b{color:var(--ink-soft)}

        /* The comet IS the money, and it changes colour at the midpoint —
           oxblood going in, olive coming out. That is the section's whole
           argument stated in one moving object. */
        .flw-comet{position:absolute;top:50%;left:-3%;width:24px;height:22px;margin-top:-11px;
          z-index:2;color:var(--ox);pointer-events:none;filter:drop-shadow(0 0 6px currentColor);
          animation:flw-comet var(--T) linear infinite}
        .flw-comet svg{width:24px;height:22px;display:block;fill:none;stroke:currentColor;
          stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
        .flw-comet::before{content:"";position:absolute;top:50%;right:17px;
          transform:translateY(-50%);width:40px;height:3px;border-radius:3px;
          background:linear-gradient(270deg,currentColor,transparent);opacity:.55}

        @keyframes flw-comet{
          0%{left:-3%;opacity:0;color:#7C1D2B}
          6%{opacity:1}
          40%{left:45%;color:#7C1D2B;opacity:1}
          46%{left:50%;opacity:0}
          54%{left:50%;opacity:0;color:#4E6B3E}
          60%{opacity:1}
          84%{left:100%;color:#4E6B3E;opacity:1}
          90%{left:103%;opacity:0}
          100%{left:-3%;opacity:0;color:#4E6B3E}
        }
        @keyframes flw-nodeflash{
          0%,37%{opacity:0;transform:scale(.9)}
          45%{opacity:.75;transform:scale(1)}
          57%{opacity:0;transform:scale(1.32)}
          100%{opacity:0}
        }
        @keyframes flw-emit{
          0%{transform:scale(1);text-shadow:none}
          4%{transform:scale(1.04);text-shadow:0 0 20px rgba(124,29,43,.5)}
          12%{transform:scale(1);text-shadow:none}
          100%{transform:scale(1);text-shadow:none}
        }

        /* ---- pool ---- */
        .flw-pool{background:var(--win-tint);border-color:var(--win-border);
          animation:flw-poolglow var(--T) ease-out infinite}
        .flw-pl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--win);
          font-weight:500;margin-bottom:8px}
        .flw-pool .flw-amt{font-size:34px;font-weight:600;color:var(--win);
          letter-spacing:.01em;margin-bottom:16px}
        .flw-dist{position:relative;display:flex;height:9px;border-radius:5px;overflow:hidden;
          gap:2px;margin-bottom:20px}
        .flw-seg{height:100%}
        .flw-dist::after{content:"";position:absolute;top:0;left:0;height:100%;width:48%;
          z-index:2;pointer-events:none;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);
          transform:translateX(-170%);opacity:0;animation:flw-distfill var(--T) linear infinite}
        @keyframes flw-distfill{
          0%,58%{transform:translateX(-170%);opacity:0}
          62%{opacity:1}
          66%{transform:translateX(30%)}
          86%{transform:translateX(360%);opacity:1}
          92%,100%{opacity:0;transform:translateX(360%)}
        }
        @keyframes flw-poolglow{
          0%,56%,100%{box-shadow:none}
          70%{box-shadow:0 0 30px rgba(78,107,62,.42)}
        }

        .flw-wrow{display:flex;align-items:baseline;gap:8px;padding:6px 0}
        .flw-sw{width:8px;height:8px;border-radius:2px;flex:none;transform:translateY(1px)}
        .flw-wn{font-size:12.5px;color:var(--ink-soft)}
        .flw-wf{flex:1;border-bottom:1px dotted var(--dot);transform:translateY(-3px)}
        .flw-wv{font-size:12.5px;color:var(--win);font-weight:500;display:inline-block;
          transform-origin:right center;animation:flw-winpop var(--T) ease-out infinite}
        .flw-w2 .flw-wv{animation-delay:calc(var(--T) * .04)}
        .flw-w3 .flw-wv{animation-delay:calc(var(--T) * .08)}
        @keyframes flw-winpop{
          0%,62%{transform:scale(1);color:#4E6B3E}
          69%{transform:scale(1.16);color:#39512E}
          80%{transform:scale(1);color:#4E6B3E}
          100%{transform:scale(1);color:#4E6B3E}
        }
        .flw-pool .flw-foot{margin-top:auto;padding-top:16px;
          border-top:1px dotted var(--win-border);display:flex;justify-content:space-between;
          gap:12px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--win)}

        .flw-pfoot{display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:16px 26px;border-top:1px solid var(--line);font-family:var(--mono);
          font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
        .flw-eq{color:var(--ink-soft);animation:flw-eqglow var(--T) ease-out infinite}
        .flw-neg{color:var(--ox)}
        .flw-pos{color:var(--win)}
        @keyframes flw-eqglow{
          0%,80%{opacity:.9}
          88%{opacity:1;text-shadow:0 0 14px rgba(78,107,62,.3)}
          100%{opacity:.9}
        }
        .flw-replay{background:none;border:0;cursor:pointer;color:var(--ink);
          font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;
          text-transform:uppercase;border-bottom:1.5px solid var(--ox);padding:0 0 4px}
        .flw-arw{color:var(--ox);display:inline-block;transition:transform 250ms ease}
        .flw-replay:hover .flw-arw{transform:rotate(-180deg)}
        .flw-replay:focus-visible{outline:2px solid var(--ox);outline-offset:3px}

        /* ---- narrow ---- */
        @media (max-width:1100px){
          .flw{padding:60px 40px 56px}
          .flw-wm{font-size:140px;right:36px}
          .flw h2{font-size:40px}
        }
        /* The three columns stack, and the connector KEEPS its horizontal
           travel rather than being rotated: a comet running left to right still
           reads as "this money moves from the block above to the block below",
           and rotating it would stand the arrowhead and the pill text on their
           side for no gain. */
        @media (max-width:820px){
          .flw{padding:48px 20px 44px}
          .flw-wm{display:none}
          .flw h2{font-size:30px;max-width:none}
          .flw-lede{font-size:16px;max-width:none}
          .flw-panel{margin-top:32px}
          .flw-flow{grid-template-columns:1fr}
          .flw-col{padding:22px}
          .flw-mid{border-left:0;border-right:0;
            border-top:1px solid var(--line);border-bottom:1px solid var(--line);
            padding-top:16px;padding-bottom:16px}
          .flw-mid .flw-col-label{display:none}
          .flw-conn{min-height:96px}
          .flw-phead,.flw-pfoot{flex-direction:column;align-items:flex-start;gap:10px;
            padding:14px 20px;letter-spacing:.1em}
          .flw-denied .flw-amt,.flw-pool .flw-amt{font-size:28px}
        }

        @media (prefers-reduced-motion:reduce){
          .flw-comet,.flw-dist::after,.flw-pill::after{animation:none;opacity:0}
          .flw-denied .flw-amt,.flw-pool,.flw-wv,.flw-eq{animation:none}
          .flw-arw{transition:none}
        }
        </style>

        <section class="flw" id="flowwrap">
            <div class="flw-wm" aria-hidden="true">06</div>
            <div class="flw-kicker"><i aria-hidden="true"></i> Recirculation</div>
            <h2>Losers pay winners. That is the whole engine.</h2>
            <p class="flw-lede">A forfeited deposit does not vanish into a house account. Watch where it actually goes &mdash; every dollar of it &mdash; then read the full path underneath.</p>

            <div class="flw-panel" id="flw-panel">
                <div class="flw-phead">
                    <span>Worked Example &middot; Recirculation</span>
                    <span class="flw-rt">How a forfeit moves</span>
                </div>

                <div class="flw-flow">
                    <div class="flw-col">
                        <div class="flw-col-label">Contract Denied</div>
                        <div class="flw-card flw-denied">
                            <div class="flw-cid"><b>&sect;</b> Example contract &middot; target missed</div>
                            <div class="flw-amt">&minus;$1,500</div>
                            <div class="flw-desc">Missed 25,000 followers in 30 days</div>
                            <div class="flw-foot">Deposit forfeited in full</div>
                        </div>
                    </div>

                    <div class="flw-col flw-mid">
                        <div class="flw-col-label">&nbsp;</div>
                        <div class="flw-conn">
                            <div class="flw-track" aria-hidden="true"></div>
                            <span class="flw-comet" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 12h16.5M12.5 6l6.5 6-6.5 6"/></svg></span>
                            <div class="flw-pillwrap">
                                <span class="flw-pill">Forfeited deposit<br />recirculates &rarr;</span>
                                <div class="flw-moves"><b>$1,500</b> moves &middot; <b>$0</b> skimmed</div>
                            </div>
                        </div>
                    </div>

                    <div class="flw-col">
                        <div class="flw-col-label">Match Pool</div>
                        <div class="flw-card flw-pool">
                            <div class="flw-pl">Funds this cycle&rsquo;s winners</div>
                            <div class="flw-amt">$1,500</div>
                            <div class="flw-dist" aria-hidden="true">
                                <span class="flw-seg" style="flex:0 0 42.7%;background:#4E6B3E"></span>
                                <span class="flw-seg" style="flex:0 0 33.3%;background:#5F7D4F"></span>
                                <span class="flw-seg" style="flex:0 0 24%;background:#748A63"></span>
                            </div>
                            <div class="flw-wrow flw-w1"><span class="flw-sw" style="background:#4E6B3E"></span><span class="flw-wn">Winning contract 01</span><span class="flw-wf"></span><span class="flw-wv">+$640</span></div>
                            <div class="flw-wrow flw-w2"><span class="flw-sw" style="background:#5F7D4F"></span><span class="flw-wn">Winning contract 02</span><span class="flw-wf"></span><span class="flw-wv">+$500</span></div>
                            <div class="flw-wrow flw-w3"><span class="flw-sw" style="background:#748A63"></span><span class="flw-wn">Winning contract 03</span><span class="flw-wf"></span><span class="flw-wv">+$360</span></div>
                            <div class="flw-foot"><span>Distributed in full</span><span>$1,500 / $1,500</span></div>
                        </div>
                    </div>
                </div>

                <div class="flw-pfoot">
                    <span class="flw-eq"><span class="flw-neg">&minus;$1,500 forfeited</span> = <span class="flw-pos">+$1,500 distributed</span> &middot; 100% recirculates &middot; never to Collateral</span>
                    <button type="button" class="flw-replay" id="replay">Replay <span class="flw-arw" aria-hidden="true">&#8634;</span></button>
                </div>
            </div>
        </section>
    `;
}

/**
 * Restarts the CSS cycle when Replay is pressed.
 *
 * The animations are infinite, so there is nothing to START — the only
 * meaningful action is to send them back to zero. Clearing the animation,
 * reading a layout property to force a reflow, then restoring it is the way to
 * do that: WITHOUT the forced reflow the browser coalesces both style changes
 * into one and nothing restarts.
 *
 * The button is hidden under reduced motion, where there is no cycle to replay
 * and the control would be a lie. No-ops when the section is absent.
 */
export function initFlowSection() {
    const btn = document.getElementById('replay');
    const panel = document.getElementById('flw-panel');
    if (!btn || !panel) return;

    const reduced = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { btn.hidden = true; return; }

    btn.addEventListener('click', () => {
        const animated = panel.querySelectorAll(
            '.flw-amt, .flw-pool, .flw-comet, .flw-pill, .flw-dist, .flw-wv, .flw-eq'
        );
        animated.forEach((el) => { el.style.animation = 'none'; });
        /* Forcing layout is the POINT of this line, not an accident of it. */
        void panel.offsetWidth;
        animated.forEach((el) => { el.style.animation = ''; });
    });
}
