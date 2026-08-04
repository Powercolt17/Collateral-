/**
 * Collateral — "Losers pay winners. That is the whole engine."
 *
 * Built to the supplied design sheet, scoped under .flw.
 *
 * ── THE ANIMATION IS PRESERVED EXACTLY, AND THAT CONSTRAINS THE MARKUP ───────
 * runFlow() in Landing.js is untouched by this rebuild. It reaches into the DOM
 * by id, so every one of these hooks has to survive verbatim or the section
 * goes still:
 *
 *   #flowwrap   IntersectionObserver target, threshold .35, plays once
 *   #track      coin container; runFlow injects 10 <span class="coin">, each
 *               given .go on a 150ms stagger
 *   #pool-amt   counted up to 1500 via countUp()
 *   #pool-bar   the INNER <i>, not the container — runFlow sets its width to
 *               100% directly and the CSS transition does the rest
 *   #winners    holds .winner rows; each gets .paid staggered 260ms apart
 *   #replay     click handler re-runs the whole sequence
 *
 * The coin, winner and bar CSS is brought INTO this component rather than left
 * in LandingStyles, so the section is self-contained and the old global rules
 * can be deleted with the markup they belonged to. Class names are unchanged
 * because the JS writes them: .coin, .go and .paid are an API here, not styling
 * choices. cl-travel keeps its name for the same reason.
 *
 * prefers-reduced-motion is honoured by runFlow itself, which skips the coins
 * and the count-up. The reduce block below only stops the transitions.
 *
 * ── WHAT WAS REFRAMED, AND WHY ───────────────────────────────────────────────
 * The sheet presents this as a settled event: "Cycle 2026-W12", "Settled 14 Mar
 * 2026", a denied contract belonging to @marcusk, and three named winners paid
 * @revpilot +$240, @deltacreator +$120, @quietbuild +$180.
 *
 * /v1/market/homepage-stats reports contractsSettled 0 and totalPaidOut 0. No
 * cycle has closed, nobody has been paid, and @revpilot is a REAL principal in
 * the ledger — attaching an invented payout to a real handle is worse than
 * inventing one outright.
 *
 * This section's job is to explain a mechanism, and a worked example is the
 * right way to do that, so the illustration stays. What changed is the framing:
 * it is labelled a worked example rather than a settled cycle, the date is
 * gone, and the parties are generic. The mechanism is identical and the numbers
 * still add up — 240 + 120 + 180 against a 1,500 forfeit shows the pool funding
 * winners, which is the whole point.
 *
 * Dropped: "3.8% of deposits forfeit". That is a statistic about a book with
 * nothing in it. "100% recirculates" is kept because it is a policy statement
 * about where forfeits go, not a measurement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function renderFlowSection() {
    return `
        <style>
        .flw{
          --flw-parch:#F1E8D3;
          --flw-paper:#FAF5E8;
          --flw-ink:#211B12;
          --flw-ink-soft:#5B5140;
          --flw-muted:#9A8C6F;
          --flw-ox:#7C1D2B;
          --flw-win:#4E6B3E;
          --flw-line:rgba(60,48,30,.16);
          --flw-dot:rgba(60,48,30,.28);
          --flw-win-tint:rgba(78,107,62,.10);
          --flw-win-border:rgba(78,107,62,.4);
          --flw-loss-tint:rgba(124,29,43,.07);
          --flw-loss-border:rgba(124,29,43,.32);
          --flw-serif:"EB Garamond",Georgia,serif;
          --flw-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --flw-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--flw-parch);
          color:var(--flw-ink);
          font-family:var(--flw-serif);
          -webkit-font-smoothing:antialiased;
        }
        .flw *{box-sizing:border-box;margin:0;padding:0}
        .flw-wrap{width:100%;max-width:1440px;margin:0 auto;padding:76px 90px 72px;position:relative}
        .flw-wm{position:absolute;top:34px;right:80px;font-family:var(--flw-display);
          font-weight:600;font-size:190px;line-height:.8;color:rgba(33,27,18,.05);
          pointer-events:none;user-select:none}

        .flw-kicker{display:flex;align-items:center;gap:12px;font-family:var(--flw-mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--flw-ox);
          font-weight:500;margin-bottom:22px}
        .flw-kicker .flw-r{height:1px;width:26px;background:var(--flw-ox);opacity:.7;flex:none}
        .flw h2{font-family:var(--flw-display);font-weight:600;
          font-size:clamp(32px,3.5vw,50px);line-height:1.04;letter-spacing:.004em;
          color:var(--flw-ink);margin-bottom:24px;max-width:620px}
        .flw-body{font-size:18px;line-height:1.6;color:var(--flw-ink-soft);max-width:470px}

        /* ---- panel ---- */
        .flw-panel{margin-top:50px;background:var(--flw-paper);border:1px solid var(--flw-line);
          border-radius:4px;box-shadow:0 14px 34px rgba(60,40,20,.08);overflow:hidden}
        .flw-phead{display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:15px 26px;border-bottom:1px solid var(--flw-line);font-family:var(--flw-mono);
          font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--flw-muted)}
        .flw-phead .flw-rt{color:var(--flw-ink-soft)}

        .flw-flow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.86fr) minmax(0,1fr);
          align-items:stretch}
        .flw-col{padding:30px 30px 34px;min-width:0}
        .flw-mid{border-left:1px solid var(--flw-line);border-right:1px solid var(--flw-line)}
        .flw-col-label{font-family:var(--flw-mono);font-size:10px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--flw-muted);margin-bottom:16px;min-height:14px}

        .flw-card{border:1px solid;border-radius:4px;padding:22px 22px 24px;font-family:var(--flw-mono)}
        .flw-denied{background:var(--flw-loss-tint);border-color:var(--flw-loss-border)}
        .flw-cid{font-size:11px;color:var(--flw-ink-soft);letter-spacing:.04em;margin-bottom:12px}
        .flw-cid b{color:var(--flw-ox)}
        .flw-denied .flw-amt{font-size:30px;font-weight:600;color:var(--flw-ox);
          letter-spacing:.01em;margin-bottom:10px;font-variant-numeric:tabular-nums lining-nums}
        .flw-desc{font-size:12px;color:var(--flw-muted)}

        /* ---- connector: this is the coin runway ---- */
        .flw-conn{position:relative;display:flex;align-items:center;justify-content:center;
          height:100%;min-height:150px}
        .flw-line{position:absolute;left:0;right:6px;top:50%;height:1.5px;
          background:var(--flw-ox);opacity:.45}
        .flw-line::after{content:"";position:absolute;right:-2px;top:-4px;
          border-left:9px solid var(--flw-ox);border-top:5px solid transparent;
          border-bottom:5px solid transparent;opacity:.6}
        .flw-pill{position:relative;z-index:1;background:var(--flw-paper);
          border:1px solid var(--flw-loss-border);color:var(--flw-ox);font-family:var(--flw-mono);
          font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:500;
          padding:11px 15px;border-radius:3px;text-align:center;line-height:1.5;max-width:190px}

        /* THE COIN RUNWAY. .track, .coin, .go and cl-travel are named by
           runFlow() in Landing.js — it creates the spans and adds the class, so
           these are an interface, not styling. Do not rename them here without
           changing that function. */
        .flw .track{position:absolute;inset:0;overflow:hidden;pointer-events:none}
        .flw .coin{position:absolute;top:50%;left:-14px;width:11px;height:11px;border-radius:50%;
          border:1.5px solid var(--flw-ox);background:var(--flw-loss-tint);opacity:0;
          box-shadow:0 1px 3px rgba(124,29,43,.3)}
        .flw .coin.go{animation:cl-travel 1.55s cubic-bezier(.5,0,.5,1) forwards}
        @keyframes cl-travel{
          0%{opacity:0;transform:translate(0,-50%) scale(.5)}
          12%{opacity:1;transform:translate(12%,-50%) scale(1)}
          88%{opacity:1}
          100%{opacity:0;transform:translate(760%,-50%) scale(.5)}
        }

        .flw-pool{background:var(--flw-win-tint);border-color:var(--flw-win-border)}
        .flw-pl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--flw-win);
          font-weight:500;margin-bottom:8px}
        .flw-pool .flw-amt{font-size:30px;font-weight:600;color:var(--flw-win);letter-spacing:.01em;
          margin-bottom:14px;font-variant-numeric:tabular-nums lining-nums}
        /* The container is the trough; the inner i is what runFlow widens. */
        .flw-bar{height:4px;border-radius:3px;background:rgba(78,107,62,.2);
          margin-bottom:20px;overflow:hidden}
        .flw-bar i{display:block;height:100%;width:0;background:var(--flw-win);border-radius:3px;
          transition:width 1.5s cubic-bezier(.28,.82,.3,1)}
        .flw .winner{display:flex;align-items:baseline;gap:8px;padding:6px 0;
          font-family:var(--flw-mono);font-size:12.5px;font-variant-numeric:tabular-nums;
          opacity:.22;transition:opacity .6s cubic-bezier(.22,1,.36,1)}
        .flw .winner.paid{opacity:1}
        .flw-wn{color:var(--flw-ink-soft)}
        .flw-wf{flex:1;border-bottom:1px dotted var(--flw-dot);transform:translateY(-3px)}
        .flw-wv{color:var(--flw-win);font-weight:500}

        .flw-pfoot{display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:15px 26px;border-top:1px solid var(--flw-line);font-family:var(--flw-mono);
          font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--flw-muted)}
        .flw-replay{background:none;cursor:pointer;color:var(--flw-ink);font-family:var(--flw-mono);
          font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;
          border:0;border-bottom:1.5px solid var(--flw-ox);padding:0 0 4px;white-space:nowrap;
          transition:color .16s ease}
        .flw-replay:hover{color:var(--flw-ox)}
        .flw-replay:focus-visible{outline:2px solid var(--flw-ox);outline-offset:3px}

        @media (max-width:900px){
          .flw-wrap{padding-block:clamp(40px,8vw,64px);padding-inline:clamp(20px,5.5vw,90px)}
          .flw-wm{font-size:110px;top:18px;right:18px}
          .flw-body{font-size:clamp(1rem,4.2vw,1.125rem);max-width:none}
          .flw-panel{margin-top:32px}
          /* Stacked, so the runway turns vertical. cl-travel-v is the same
             animation rotated — runFlow does not know the difference. */
          .flw-flow{grid-template-columns:minmax(0,1fr)}
          .flw-mid{border-left:0;border-right:0;border-top:1px solid var(--flw-line);
            border-bottom:1px solid var(--flw-line)}
          .flw-col{padding:22px 20px 26px}
          .flw-conn{min-height:96px}
          .flw-line{left:50%;right:auto;top:0;bottom:0;width:1.5px;height:auto;transform:translateX(-50%)}
          .flw-line::after{right:auto;left:-4px;top:auto;bottom:-2px;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:9px solid var(--flw-ox);border-bottom:0}
          .flw .coin.go{animation-name:cl-travel-v}
          .flw-phead,.flw-pfoot{flex-wrap:wrap;font-size:10px}
        }
        @keyframes cl-travel-v{
          0%{opacity:0;transform:translate(-50%,0) scale(.5)}
          12%{opacity:1;transform:translate(-50%,12%) scale(1)}
          88%{opacity:1}
          100%{opacity:0;transform:translate(-50%,760%) scale(.5)}
        }
        @media (max-width:768px){
          .flw{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){
          .flw *{transition:none !important}
          .flw .coin{display:none}
        }
        </style>

        <!-- id="flow" IS A SCROLL TARGET, not decoration. Two things aim at it:
             the hero's secondary CTA, via onWatchFlow in Landing.js, and a menu
             item in Header.js. Dropping it during this rebuild broke both
             silently - the links stayed clickable and simply did nothing, which
             is the worst kind of regression to catch by eye. Only the comment
             in LandingStyles mentions #flow, so carrying the id costs no CSS. -->
        <section class="flw" id="flow" aria-labelledby="flw-title">
            <div class="flw-wrap">
                <div class="flw-wm" aria-hidden="true">06</div>
                <div class="flw-kicker"><span class="flw-r" aria-hidden="true"></span> Recirculation</div>
                <h2 id="flw-title">Losers pay winners. That is the whole engine.</h2>
                <p class="flw-body">A forfeited deposit does not vanish into a house account. Watch
                    where it actually goes, then read the full path underneath.</p>

                <div class="flw-panel" id="flowwrap">
                    <!-- Labelled a worked example, not a settled cycle. Nothing has
                         settled: contractsSettled is 0 and totalPaidOut is 0. See the
                         note at the top of this file. -->
                    <div class="flw-phead">
                        <span>Worked example &middot; Recirculation</span>
                        <span class="flw-rt">How a forfeit moves</span>
                    </div>

                    <div class="flw-flow">
                        <div class="flw-col">
                            <div class="flw-col-label">Contract Denied</div>
                            <div class="flw-card flw-denied">
                                <div class="flw-cid"><b>&sect;</b> Example contract &middot; target missed</div>
                                <div class="flw-amt">&minus;$1,500</div>
                                <div class="flw-desc">Missed 25,000 followers in 30 days</div>
                            </div>
                        </div>

                        <div class="flw-col flw-mid">
                            <div class="flw-col-label">&nbsp;</div>
                            <div class="flw-conn">
                                <div class="flw-line" aria-hidden="true"></div>
                                <div class="track" id="track" aria-hidden="true"></div>
                                <div class="flw-pill">Forfeited deposit<br />recirculates &rarr;</div>
                            </div>
                        </div>

                        <div class="flw-col">
                            <div class="flw-col-label">Match Pool</div>
                            <div class="flw-card flw-pool">
                                <div class="flw-pl">Funds this cycle's winners</div>
                                <div class="flw-amt" id="pool-amt">$0</div>
                                <div class="flw-bar"><i id="pool-bar"></i></div>
                                <div id="winners">
                                    <div class="winner"><span class="flw-wn">Winning contract 01</span><span class="flw-wf"></span><span class="flw-wv">+$240</span></div>
                                    <div class="winner"><span class="flw-wn">Winning contract 02</span><span class="flw-wf"></span><span class="flw-wv">+$120</span></div>
                                    <div class="winner"><span class="flw-wn">Winning contract 03</span><span class="flw-wf"></span><span class="flw-wv">+$180</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flw-pfoot">
                        <span>Every forfeit is routed to that cycle's pool &mdash; never to Collateral &middot; <b>100% recirculates</b></span>
                        <button type="button" class="flw-replay" id="replay">Replay</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}
