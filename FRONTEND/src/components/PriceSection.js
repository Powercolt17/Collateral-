/**
 * Collateral — "Name a number that would actually hurt to lose".
 *
 * BUILT ON A SUPPLIED HTML SHEET. No React here, so the sheet becomes a render
 * function with a scoped style block and its inline <script> becomes
 * initPriceSection.
 *
 * ── DO NOT PUT A BACKTICK IN THESE CSS COMMENTS ──────────────────────────────
 * The style block lives inside a template literal. One backtick below closes
 * the literal and the landing page dies with a syntax error. Double quotes or
 * caps for emphasis. (Safe up here, above the literal.)
 *
 * ── SCOPING, AND ONE SELECTOR THAT WOULD HAVE DONE REAL DAMAGE ───────────────
 * The sheet styles bare *, body, h1, .section, .pane, .spec, .tier, .note,
 * .cta and .toggle. Every one is namespaced under .prc.
 *
 * The dangerous one was "input[type=range]". Unscoped it restyles EVERY range
 * input in the application — thumb, track and all — and this codebase has
 * others outside the landing page. It is .prc input[type=range] here.
 *
 * It is an h2, not the sheet's h1: the hero owns the page's h1.
 *
 * FONTS cost nothing new. Cormorant Garamond, EB Garamond and IBM Plex Mono are
 * already requested in index.html, so the sheet's own font link is dropped.
 *
 * ── WHAT REPLACED WHAT ───────────────────────────────────────────────────────
 * This section used to live inline in Landing.js with its engine in
 * initLanding — depEl, seg, tiers, a TIERS map and calc(). All of that is
 * extracted here so the section is one file. The old engine is deleted rather
 * than left dormant, because unlike the flow section's runFlow it did NOT guard
 * its lookups end to end and would have kept re-rendering ids that no longer
 * exist.
 *
 * The CTA keeps the old behaviour exactly: openAccessModal('signup'), falling
 * back to /signin. Changing where the primary action goes was not part of a
 * visual rebuild.
 *
 * ── THE PER-TIER DEPOSIT BANDS ARE NEW, AND THEY MATTER ──────────────────────
 * The version this replaces used one slider range, $100 to $10,000, for all
 * three windows. The sheet gives each tier its own band and clamps the slider
 * when you switch. That is a real improvement: it stops the calculator quoting
 * a $10,000 deposit on a tier that does not accept one.
 *
 * ── WHERE THESE NUMBERS DISAGREE WITH THE LIVE MARKETPLACE ───────────────────
 * Checked against /v1/market/contracts rather than assumed. The API's 48 live
 * listings carry three tiers, and they are keyed to TIER, not to window length:
 *
 *     controlled   1.7x    entry $100    cap $1,500
 *     elevated     2.5x    entry $250    cap $3,000
 *     maximum      4.0x    entry $500    cap $5,000
 *
 * Against that, this sheet is right on two rows and wrong on three points:
 *
 *   Stake  2.5x, $250-$3,000   matches elevated exactly.
 *   Pledge 1.5x, $100-$1,500   band matches controlled; THE MULTIPLIER DOES
 *                              NOT. Live controlled pays 1.7x.
 *   All-In 4.0x, $500-$10,000  multiplier and entry match maximum; THE CAP DOES
 *                              NOT. Live maximum caps at $5,000.
 *
 * And structurally: the live catalogue's windows are 14 or 30 days only — there
 * is no 60-day product — and tier is independent of window, so a 14-day
 * contract can be bought at any of the three multipliers.
 *
 * Shipped as supplied because that is what was asked for, and flagged here
 * because these are prices. Two lines and a max attribute reconcile it if that
 * is wanted; the mapping from window to tier is the part that needs a decision
 * rather than an edit.
 */

const TIERS = {
    14: { tier: 'All-In', mult: 4.0, min: 500, max: 10000, miss: 'Full forfeit' },
    30: { tier: 'Stake', mult: 2.5, min: 250, max: 3000, miss: 'Full forfeit' },
    60: { tier: 'Pledge', mult: 1.5, min: 100, max: 1500, miss: 'Grace period' },
};

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

export function renderPriceSection() {
    return `
        <style>
        .prc{
          --parch:#F1E8D3; --paper:#FAF5E8; --ink:#211B12; --ink-soft:#5B5140;
          --muted:#9A8C6F; --ox:#7C1D2B; --ox-deep:#651522; --win:#4E6B3E;
          --line:rgba(60,48,30,.16); --dot:rgba(60,48,30,.28); --track:rgba(60,48,30,.16);
          --win-tint:rgba(78,107,62,.10); --loss-tint:rgba(124,29,43,.07);
          --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          --serif:"EB Garamond",Georgia,serif;
          --display:"Cormorant Garamond",Georgia,serif;
          position:relative;width:100%;max-width:1440px;margin:0 auto;
          padding:76px 90px 72px;background:var(--parch);color:var(--ink);
          font-family:var(--serif);-webkit-font-smoothing:antialiased;
        }
        .prc *{box-sizing:border-box;margin:0;padding:0}

        .prc-wm{position:absolute;top:34px;right:80px;font-family:var(--display);
          font-weight:600;font-size:190px;line-height:.8;color:rgba(33,27,18,.05);
          pointer-events:none;user-select:none}
        .prc-kicker{display:flex;align-items:center;gap:12px;font-family:var(--mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--ox);
          font-weight:500;margin-bottom:22px}
        .prc-kicker i{height:1px;width:26px;background:var(--ox);opacity:.7;flex:none}
        .prc h2{font-family:var(--display);font-weight:600;font-size:50px;line-height:1.04;
          color:var(--ink);margin-bottom:24px;max-width:560px}
        .prc-lede{font-size:18px;line-height:1.6;color:var(--ink-soft);max-width:470px}

        /* ---- calculator ---- */
        .prc-calc{margin-top:50px;display:grid;grid-template-columns:1fr 1fr;
          background:var(--paper);border:1px solid var(--line);border-radius:4px;
          overflow:hidden;box-shadow:0 14px 34px rgba(60,40,20,.08)}
        .prc-pane{padding:34px 36px;display:flex;flex-direction:column;min-width:0}
        .prc-right{border-left:1px solid var(--line)}
        .prc-plabel{font-family:var(--mono);font-size:10px;letter-spacing:.24em;
          text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:26px}

        .prc-ftop{display:flex;justify-content:space-between;align-items:baseline;
          gap:12px;margin-bottom:16px}
        .prc-ftop .prc-k{font-family:var(--mono);font-size:11px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--ink-soft)}
        .prc-ftop .prc-v{font-family:var(--mono);font-size:30px;font-weight:600;
          color:var(--ox);letter-spacing:.01em}

        /* SCOPED. Unscoped this rule restyles every range input in the app. */
        .prc input[type=range]{-webkit-appearance:none;appearance:none;width:100%;
          height:4px;border-radius:3px;background:var(--track);outline:none;cursor:pointer}
        .prc input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;
          height:22px;border-radius:50%;background:var(--ox);border:4px solid var(--paper);
          box-shadow:0 0 0 1px var(--ox),0 3px 8px rgba(101,21,34,.35);cursor:pointer;
          transition:transform .15s ease}
        .prc input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.12)}
        .prc input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;
          background:var(--ox);border:4px solid var(--paper);
          box-shadow:0 0 0 1px var(--ox),0 3px 8px rgba(101,21,34,.35);cursor:pointer}
        .prc input[type=range]:focus-visible{outline:2px solid var(--ox);outline-offset:6px}
        .prc-bounds{display:flex;justify-content:space-between;margin-top:14px;
          font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.02em}

        .prc-flab{font-family:var(--mono);font-size:11px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--ink-soft);margin:32px 0 14px}
        .prc-toggle{display:flex;border:1px solid var(--line);border-radius:3px;overflow:hidden}
        .prc-seg{flex:1;padding:15px 0;text-align:center;font-family:var(--mono);
          font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);
          cursor:pointer;background:transparent;border:0;border-left:1px solid var(--line);
          transition:background .2s ease,color .2s ease}
        .prc-seg:first-child{border-left:0}
        .prc-seg.is-on{background:var(--ox);color:var(--parch);font-weight:500}
        .prc-seg:focus-visible{outline:2px solid var(--ox);outline-offset:-3px}

        .prc-pfoot{margin-top:auto;padding-top:26px;border-top:1px dotted var(--line);
          font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;
          text-transform:uppercase;color:var(--muted)}

        /* ---- outcomes ---- */
        .prc-otiles{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);
          border-radius:4px;overflow:hidden;margin-bottom:26px}
        .prc-otile{padding:20px 22px;min-width:0}
        .prc-hit{background:var(--win-tint)}
        .prc-miss{background:var(--loss-tint);border-left:1px solid var(--line)}
        .prc-ol{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
          text-transform:uppercase;font-weight:500;margin-bottom:10px}
        .prc-hit .prc-ol{color:var(--win)}
        .prc-miss .prc-ol{color:var(--ox)}
        .prc-oa{font-family:var(--mono);font-size:28px;font-weight:600;letter-spacing:.01em;
          transition:transform .18s ease;display:inline-block}
        .prc-hit .prc-oa{color:var(--win)}
        .prc-miss .prc-oa{color:var(--ox)}
        .prc-os{font-family:var(--mono);font-size:10px;letter-spacing:.1em;
          text-transform:uppercase;color:var(--muted);margin-top:8px}
        .prc-bump{transform:scale(1.06)}

        .prc-spec{display:flex;align-items:baseline;gap:10px;padding:11px 0;
          border-bottom:1px dotted var(--line)}
        .prc-sk{font-family:var(--mono);font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--muted)}
        .prc-sf{flex:1;border-bottom:1px dotted var(--dot);transform:translateY(-3px)}
        .prc-sv{font-family:var(--mono);font-size:13px;color:var(--ink);letter-spacing:.02em}
        .prc-sv b{color:var(--ox);font-weight:600}

        .prc-cta{margin-top:26px;width:100%;height:58px;background:var(--ox);
          color:var(--parch);border:1px solid var(--ox-deep);border-radius:3px;
          font-family:var(--mono);font-size:12px;letter-spacing:.22em;
          text-transform:uppercase;font-weight:500;cursor:pointer;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 10px 24px rgba(101,21,34,.2);
          transition:background .2s ease,transform .2s ease}
        .prc-cta:hover{background:var(--ox-deep);transform:translateY(-1px)}
        .prc-cta:focus-visible{outline:2px solid var(--ink);outline-offset:3px}

        /* ---- tier cards ---- */
        .prc-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:34px}
        .prc-tier{position:relative;background:var(--paper);border:1px solid var(--line);
          border-radius:4px;padding:28px 28px 26px;text-align:left;cursor:pointer;
          font:inherit;color:inherit;
          transition:border-color .2s ease,box-shadow .2s ease,background .2s ease}
        .prc-tier.is-sel{border-color:var(--ox);background:var(--loss-tint);
          box-shadow:0 12px 30px rgba(124,29,43,.10)}
        .prc-tier:focus-visible{outline:2px solid var(--ox);outline-offset:3px}
        .prc-tc{font-family:var(--mono);font-size:10px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--muted);margin-bottom:10px}
        .prc-tm{font-family:var(--display);font-size:46px;font-weight:600;color:var(--ox);
          line-height:.9;letter-spacing:.01em}
        .prc-tm .prc-x{font-size:24px;color:var(--muted);margin-left:2px}
        .prc-tw{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
          text-transform:uppercase;color:var(--ink-soft);margin:14px 0 18px;
          padding-bottom:16px;border-bottom:1px solid var(--line)}
        .prc-trow{display:flex;align-items:baseline;gap:8px;padding:6px 0}
        .prc-tk{font-family:var(--mono);font-size:10px;letter-spacing:.14em;
          text-transform:uppercase;color:var(--muted)}
        .prc-tf{flex:1;border-bottom:1px dotted var(--dot);transform:translateY(-3px)}
        .prc-tv{font-family:var(--mono);font-size:12px;color:var(--ink)}
        .prc-ribbon{position:absolute;top:-1px;left:-1px;background:var(--ox);
          color:var(--parch);font-family:var(--mono);font-size:9px;letter-spacing:.18em;
          text-transform:uppercase;padding:6px 12px;border-radius:3px 0 3px 0;opacity:0;
          transition:opacity .2s ease}
        .prc-tier.is-sel .prc-ribbon{opacity:1}

        .prc-note{margin-top:32px;display:flex;gap:18px;max-width:760px}
        .prc-nl{font-family:var(--mono);font-size:11px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--ox);font-weight:500;white-space:nowrap}
        .prc-nt{font-family:var(--mono);font-size:12px;line-height:1.7;letter-spacing:.02em;
          text-transform:uppercase;color:var(--muted)}

        @media (max-width:1100px){
          .prc{padding:60px 40px 56px}
          .prc-wm{font-size:140px;right:36px}
          .prc h2{font-size:40px}
          .prc-tiers{gap:16px}
          .prc-tier{padding:22px}
        }
        @media (max-width:820px){
          .prc{padding:48px 20px 44px}
          .prc-wm{display:none}
          .prc h2{font-size:30px;max-width:none}
          .prc-lede{font-size:16px;max-width:none}
          .prc-calc{grid-template-columns:1fr;margin-top:32px}
          .prc-pane{padding:24px 20px}
          .prc-right{border-left:0;border-top:1px solid var(--line)}
          .prc-tiers{grid-template-columns:1fr;gap:14px;margin-top:24px}
          .prc-note{flex-direction:column;gap:8px}
          /* Two money tiles side by side at 320px give each about 130px, and
             28px figures do not fit. They stack instead of shrinking. */
          .prc-otiles{grid-template-columns:1fr}
          .prc-miss{border-left:0;border-top:1px solid var(--line)}
        }
        @media (prefers-reduced-motion:reduce){
          .prc-oa,.prc-cta,.prc-tier,.prc-ribbon,
          .prc input[type=range]::-webkit-slider-thumb{transition:none}
        }
        </style>

        <section class="prc" id="terms">
            <div class="prc-wm" aria-hidden="true">07</div>
            <div class="prc-kicker"><i aria-hidden="true"></i> Price Your Own Contract</div>
            <h2>Name a number that would actually hurt to lose</h2>
            <p class="prc-lede">Too small and you&rsquo;ll shrug it off in week two. Too large and you&rsquo;ll talk yourself out of signing at all. The right number is the one you flinch at slightly.</p>

            <div class="prc-calc">
                <div class="prc-pane">
                    <div class="prc-plabel">Contract Parameters</div>
                    <div class="prc-ftop">
                        <label class="prc-k" for="prc-dep">Deposit</label>
                        <span class="prc-v" id="prc-depv">$1,000</span>
                    </div>
                    <input type="range" id="prc-dep" min="250" max="3000" step="50" value="1000"
                           aria-label="Deposit amount" />
                    <div class="prc-bounds"><span id="prc-bmin">$250</span><span id="prc-bmax">$3,000</span></div>

                    <div class="prc-flab" id="prc-winlab">Execution Window</div>
                    <div class="prc-toggle" id="prc-toggle" role="group" aria-labelledby="prc-winlab">
                        <button type="button" class="prc-seg" data-w="14" aria-pressed="false">14 Days</button>
                        <button type="button" class="prc-seg is-on" data-w="30" aria-pressed="true">30 Days</button>
                        <button type="button" class="prc-seg" data-w="60" aria-pressed="false">60 Days</button>
                    </div>

                    <div class="prc-pfoot">Parameters lock on signature</div>
                </div>

                <div class="prc-pane prc-right">
                    <div class="prc-plabel">Settlement Outcomes</div>
                    <div class="prc-otiles">
                        <div class="prc-otile prc-hit">
                            <div class="prc-ol">If you hit target</div>
                            <div class="prc-oa" id="prc-hit">$2,500</div>
                            <div class="prc-os">Stake plus matching payout</div>
                        </div>
                        <div class="prc-otile prc-miss">
                            <div class="prc-ol">If you miss</div>
                            <div class="prc-oa" id="prc-miss">&minus;$1,000</div>
                            <div class="prc-os">Forfeited to match pool</div>
                        </div>
                    </div>

                    <div class="prc-spec"><span class="prc-sk">Tier</span><span class="prc-sf"></span><span class="prc-sv" id="prc-s-tier">Stake</span></div>
                    <div class="prc-spec"><span class="prc-sk">Match Multiplier</span><span class="prc-sf"></span><span class="prc-sv"><b id="prc-s-mult">2.5&times;</b></span></div>
                    <div class="prc-spec"><span class="prc-sk">Est. Match on Success</span><span class="prc-sf"></span><span class="prc-sv" id="prc-s-match">+$1,500</span></div>
                    <div class="prc-spec"><span class="prc-sk">On Miss</span><span class="prc-sf"></span><span class="prc-sv" id="prc-s-miss">Full forfeit</span></div>

                    <button type="button" class="prc-cta" id="prc-cta">Lock $1,000 for 30 days</button>
                </div>
            </div>

            <div class="prc-tiers" id="prc-tiers">
                <button type="button" class="prc-tier" data-w="14">
                    <span class="prc-ribbon">Your Selection</span>
                    <div class="prc-tc">Schedule A &middot; All-In</div>
                    <div class="prc-tm">4.0<span class="prc-x">&times;</span></div>
                    <div class="prc-tw">14-Day Window</div>
                    <div class="prc-trow"><span class="prc-tk">Deposit</span><span class="prc-tf"></span><span class="prc-tv">$500 &ndash; $10,000</span></div>
                    <div class="prc-trow"><span class="prc-tk">On Miss</span><span class="prc-tf"></span><span class="prc-tv">Full forfeit</span></div>
                </button>
                <button type="button" class="prc-tier is-sel" data-w="30">
                    <span class="prc-ribbon">Your Selection</span>
                    <div class="prc-tc">Schedule A &middot; Stake</div>
                    <div class="prc-tm">2.5<span class="prc-x">&times;</span></div>
                    <div class="prc-tw">30-Day Window</div>
                    <div class="prc-trow"><span class="prc-tk">Deposit</span><span class="prc-tf"></span><span class="prc-tv">$250 &ndash; $3,000</span></div>
                    <div class="prc-trow"><span class="prc-tk">On Miss</span><span class="prc-tf"></span><span class="prc-tv">Full forfeit</span></div>
                </button>
                <button type="button" class="prc-tier" data-w="60">
                    <span class="prc-ribbon">Your Selection</span>
                    <div class="prc-tc">Schedule A &middot; Pledge</div>
                    <div class="prc-tm">1.5<span class="prc-x">&times;</span></div>
                    <div class="prc-tw">60-Day Window</div>
                    <div class="prc-trow"><span class="prc-tk">Deposit</span><span class="prc-tf"></span><span class="prc-tv">$100 &ndash; $1,500</span></div>
                    <div class="prc-trow"><span class="prc-tk">On Miss</span><span class="prc-tf"></span><span class="prc-tv">Grace period</span></div>
                </button>
            </div>

            <div class="prc-note">
                <span class="prc-nl">&sect; 6.2 &middot; Schedule Note</span>
                <span class="prc-nt">Shorter windows pay more because they are harder, not because we are being generous. Fourteen days is chosen by people who have already started.</span>
            </div>
        </section>
    `;
}

/**
 * Calculator engine. Safe to call when the section is absent.
 *
 * The sheet's inline script used document-wide querySelectorAll('.seg') and
 * '.tier'; those are scoped to the section's own containers here so it cannot
 * pick up anything else on the page that happens to share a name.
 */
export function initPriceSection() {
    const dep = document.getElementById('prc-dep');
    const toggle = document.getElementById('prc-toggle');
    const tiers = document.getElementById('prc-tiers');
    if (!dep || !toggle || !tiers) return;

    const $ = (id) => document.getElementById(id);
    const segs = [...toggle.querySelectorAll('.prc-seg')];
    const cards = [...tiers.querySelectorAll('.prc-tier')];
    let win = '30';

    const paintSlider = () => {
        const pct = ((dep.value - dep.min) / (dep.max - dep.min)) * 100;
        dep.style.background =
            'linear-gradient(90deg, var(--ox) 0 ' + pct + '%, var(--track) ' + pct + '% 100%)';
    };

    const bump = (el) => {
        if (!el) return;
        el.classList.add('prc-bump');
        setTimeout(() => el.classList.remove('prc-bump'), 190);
    };

    const render = (changed) => {
        const t = TIERS[win];
        const d = +dep.value;
        $('prc-depv').textContent = money(d);
        $('prc-hit').textContent = money(d * t.mult);
        $('prc-miss').textContent = '−' + money(d);
        $('prc-s-tier').textContent = t.tier;
        $('prc-s-mult').textContent = t.mult.toFixed(1) + '×';
        /* The MATCH, not the payout: what the pool adds on top of the returned
           stake. mult - 1 rather than mult, or this row double-counts the
           deposit the tile beside it already shows. */
        $('prc-s-match').textContent = '+' + money(d * (t.mult - 1));
        $('prc-s-miss').textContent = t.miss;
        $('prc-cta').textContent = 'Lock ' + money(d) + ' for ' + win + ' days';
        paintSlider();
        if (changed) { bump($('prc-hit')); bump($('prc-miss')); }
    };

    const select = (w) => {
        win = String(w);
        const t = TIERS[win];
        segs.forEach((s) => {
            const on = s.dataset.w === win;
            s.classList.toggle('is-on', on);
            s.setAttribute('aria-pressed', String(on));
        });
        cards.forEach((c) => c.classList.toggle('is-sel', c.dataset.w === win));
        /* Clamp BEFORE re-rendering. Each tier has its own band, so carrying a
           $10,000 All-In deposit across to Pledge would quote a number that
           tier does not accept. */
        dep.min = t.min;
        dep.max = t.max;
        if (+dep.value < t.min) dep.value = t.min;
        if (+dep.value > t.max) dep.value = t.max;
        $('prc-bmin').textContent = money(t.min);
        $('prc-bmax').textContent = money(t.max);
        render(true);
    };

    dep.addEventListener('input', () => render(true));
    segs.forEach((s) => s.addEventListener('click', () => select(s.dataset.w)));
    cards.forEach((c) => c.addEventListener('click', () => select(c.dataset.w)));

    /* Unchanged from the markup this replaces: the primary action opens the
       signup modal, falling back to the sign-in route. */
    $('prc-cta').addEventListener('click', () => {
        if (window.app && window.app.openAccessModal) window.app.openAccessModal('signup');
        else if (window.router) window.router.navigate('/signin');
    });

    render(false);
}
