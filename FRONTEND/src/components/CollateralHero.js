/**
 * Collateral — engraved hero + settlement queue.
 *
 * Ported from a supplied React component (CollateralHero.jsx) to this project's
 * view convention: a render function returning an HTML string with a scoped
 * <style> block, matching Header.js and the views in src/views/. This codebase
 * has no React or react-dom, so the .jsx could not be used as authored.
 *
 * The placeholder header that shipped with the component (.clt-bar, wordmark,
 * balance/health stats, MENU button) is deliberately ABSENT — the real header
 * is src/components/Header.js and renders above this. The component's scroll
 * listener went with it; it existed only to toggle that placeholder's solid
 * state, and .ch-header has its own scroll behaviour in main.js.
 *
 * ── DO NOT "FIX" THESE ───────────────────────────────────────────────────────
 * Every size in .clt-lockup, .clt-eyebrow, .clt-hero h1, .clt-cta, .clt-btn and
 * .clt-link is in `vw`. The plate has a clear channel of open sky and the vw
 * units keep the headline inside it at every viewport width. Converting them to
 * rem, px or utility classes drops the headline onto the temple.
 *
 * The hero's aspect-ratio comes from PLATE_W/PLATE_H; the mobile media query
 * overrides it with !important. Both are required.
 *
 * Never add backdrop-filter to anything layered over the hero. The aspect-locked
 * hero breaks the backdrop root, so it renders a partial pane — a visible box
 * with a hard edge. Use a gradient scrim.
 *
 * The primary button is ink navy (#131A2A) with an oxblood offset shadow, not an
 * oxblood fill. Oxblood on the red plate has insufficient contrast.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PLATE_W = 1600;
const PLATE_H = 915;

const QUEUE = [
    { id: '369', goal: '10,000 email leads in 30 days', who: '@growthlead', src: 'Shopify API', amount: '$1,200' },
    { id: '370', goal: '100k views on launch video', who: '@indiehacker', src: 'YouTube API', amount: '$800' },
    { id: '371', goal: '+20% revenue in 30 days', who: '@revpilot', src: 'Stripe API', amount: '$2,000' },
    { id: '372', goal: '50,000 subscribers in 60 days', who: '@deltacreator', src: 'YouTube API', amount: '$1,000' },
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {object} [options]
 * @param {string} [options.plateSrc]      Engraving URL.
 * @param {string} [options.heldInEscrow]  Pre-formatted currency string.
 * @param {string} [options.settledToday]  Pre-formatted currency string.
 * @param {number} [options.settledCount]  Contracts settled today.
 * @param {string} [options.onWriteContract] Inline handler for the primary CTA.
 * @param {string} [options.onWatchFlow]     Inline handler for the secondary CTA.
 */
export function renderCollateralHero(options = {}) {
    const {
        plateSrc = '/assets/images/collateral-plate.jpg',
        heldInEscrow = '$8,700,000',
        settledToday = '$597,736',
        settledCount = 54,
        onWriteContract = '',
        onWatchFlow = '',
    } = options;

    const rows = QUEUE.map((row) => `
                <div class="clt-row">
                    <div>
                        <span class="clt-no clt-mono">№ ${escapeHtml(row.id)}</span>
                        <span class="clt-goal">${escapeHtml(row.goal)}</span>
                        <div class="clt-who clt-mono">${escapeHtml(row.who)} · via ${escapeHtml(row.src)}</div>
                    </div>
                    <div>
                        <div class="clt-amt">${escapeHtml(row.amount)}</div>
                        <div class="clt-status clt-mono">● PENDING</div>
                    </div>
                </div>`).join('');

    return `
        <style>
        .clt{
          --paper:#F1EEE8; --paper-hi:#F7F5F0;
          --ink:#131A2A; --ink-soft:#5A6172;
          --ox:#7C1A24; --ox-deep:#5A1018;
          --rule:#D8D3C8; --green:#1F6B45;
          background:var(--paper); color:var(--ink);
          font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
          -webkit-font-smoothing:antialiased;
        }
        .clt *{box-sizing:border-box;margin:0;padding:0}
        .clt-mono{font-family:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace}

        /* #app carries pt-24 (96px) to clear the fixed header on every view.
           On this hero that gap is dead paper above the plate AND it costs the
           96px of height that was pushing the bottom of the engraving — temple
           steps, the figures at the desk — below the fold. Cancel it so the
           plate starts at the very top and runs full width. The header is an
           opaque paper bar and the top of the plate is open sky, so it reads as
           one surface. The lockup's 8.4cqw padding still clears the 64px header
           (161px at 1920), which is why the eyebrow never slides under it. */
        .clt{margin-top:-96px}

        /* ---- hero ----
           The lockup is sized in cqw (1cqw = 1% of .clt-hero's width), NOT vw.
           That is a strict improvement on the original vw units, not a
           departure from them: while the hero spans the full viewport the two
           are identical, but once max-width caps the hero the vw version would
           keep scaling with the window and walk the headline off the sky
           channel and onto the temple. cqw stays locked to the plate.

           The plate ALWAYS full-bleeds. A max-width cap that fit the whole
           engraving above the fold was tried and rejected on sight: it
           letterboxes the plate with dead paper gutters either side, which
           looks terrible. The engraving runs edge to edge; the bottom of it
           falling below the fold on a short window is the accepted trade. ---- */
        .clt-hero{
          position:relative;width:100%;
          container-type:inline-size;
          background-position:center top;
          background-size:100% 100%;
          background-repeat:no-repeat;
          background-color:var(--paper);
        }
        .clt-lockup{
          position:absolute;inset:0 0 auto 0;
          padding-top:8.4cqw;
          display:flex;flex-direction:column;align-items:center;text-align:center;
        }
        .clt-eyebrow{
          display:flex;align-items:center;gap:.85cqw;
          font-size:clamp(9px,.78cqw,20px);letter-spacing:.24em;font-weight:700;color:var(--ox);
        }
        .clt-eyebrow::before,.clt-eyebrow::after{content:"";width:2.4cqw;height:.13cqw;background:var(--ox)}
        .clt-hero h1{
          margin-top:1.4cqw;
          font-size:6.4cqw;line-height:.855;letter-spacing:-.038em;font-weight:800;
          text-transform:uppercase;
        }
        .clt-cta{margin-top:2.6cqw;display:flex;align-items:center;gap:1.9cqw}
        /* Scale is the authored one. The only addition is a px FLOOR on the two
           CTA labels: pure .82cqw falls to 8.4px at 1024 and keeps dropping,
           which is unreadable. The floor never engages above ~1340px, so it does
           not change how this renders on a full-size screen. */
        .clt-btn{
          background:var(--ink);color:var(--paper-hi);border:0;cursor:pointer;
          padding:1.15cqw 2.5cqw;
          font:700 clamp(11px,.82cqw,20px)/1 ui-monospace,Menlo,monospace;letter-spacing:.17em;
          box-shadow:.42cqw .42cqw 0 var(--ox);
          transition:box-shadow .16s ease,transform .16s ease;
        }
        .clt-btn:hover{box-shadow:.12cqw .12cqw 0 var(--ox);transform:translate(.3cqw,.3cqw)}
        .clt-link{
          background:none;border:0;cursor:pointer;color:var(--ink);
          font:700 clamp(11px,.82cqw,20px)/1 ui-monospace,Menlo,monospace;letter-spacing:.15em;
          padding-bottom:.3cqw;border-bottom:.13cqw solid var(--ox);
        }
        .clt-link:hover{color:var(--ox)}
        .clt-btn:focus-visible,.clt-link:focus-visible{
          outline:2px solid var(--ink);outline-offset:3px;
        }

        /* ---- proof strip at the fold ---- */
        .clt-strip{
          position:relative;z-index:3;
          display:flex;justify-content:center;align-items:baseline;gap:10px 40px;flex-wrap:wrap;
          padding:22px 24px;font-size:10px;letter-spacing:.16em;color:var(--ink-soft);
          background:var(--paper);
          border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);
        }
        .clt-strip b{color:var(--ink);font-weight:700}
        .clt-fig{font-size:15px;letter-spacing:.02em;font-weight:600}
        .clt-ox{color:var(--ox)}
        .clt-gr{color:var(--green)}

        /* ---- settlement queue ---- */
        .clt-queue-wrap{padding:76px 24px 96px}
        .clt-sec-head{max-width:680px;margin:0 auto 26px;text-align:center}
        .clt-kicker{
          display:flex;align-items:center;justify-content:center;gap:10px;
          font-size:10px;letter-spacing:.22em;font-weight:700;color:var(--ox);margin-bottom:14px;
        }
        .clt-kicker::before,.clt-kicker::after{content:"";width:26px;height:2px;background:var(--ox)}
        .clt-sec-head h2{font-size:30px;font-weight:800;letter-spacing:-.02em;text-transform:uppercase}
        .clt-sec-head p{margin-top:12px;font-size:14px;line-height:1.55;color:#3B4254}

        .clt-queue{
          max-width:680px;margin:0 auto;background:var(--paper-hi);
          border:1px solid var(--ink);box-shadow:7px 7px 0 rgba(19,26,42,.08);
        }
        .clt-q-head{
          display:flex;justify-content:space-between;padding:13px 18px;
          border-bottom:1px solid var(--rule);font-size:10px;letter-spacing:.14em;color:var(--ink-soft);
        }
        .clt-dot{
          display:inline-block;width:7px;height:7px;border-radius:50%;
          background:var(--green);margin-right:9px;vertical-align:1px;
        }
        .clt-q-totals{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--rule)}
        .clt-q-totals>div{padding:17px 18px}
        .clt-q-totals>div:first-child{border-right:1px solid var(--rule)}
        .clt-q-totals span{display:block;font-size:9.5px;letter-spacing:.16em;color:var(--ink-soft);margin-bottom:8px}
        .clt-q-totals b{font-size:25px;font-weight:500;letter-spacing:-.02em}
        .clt-held b{color:var(--ox)}
        .clt-settled b{color:var(--green)}
        .clt-row{
          display:flex;justify-content:space-between;align-items:center;gap:16px;
          padding:14px 18px;border-bottom:1px dotted var(--rule);
        }
        .clt-row:last-of-type{border-bottom:1px solid var(--rule)}
        .clt-no{font-size:9.5px;color:var(--ink-soft);margin-right:9px}
        .clt-goal{font-size:14px;font-weight:600}
        .clt-who{font-size:10.5px;color:var(--ink-soft);margin-top:4px}
        .clt-amt{font-size:15px;text-align:right;white-space:nowrap}
        .clt-status{font-size:9.5px;letter-spacing:.14em;color:var(--ink-soft);margin-top:5px;text-align:right}
        .clt-q-foot{
          display:flex;justify-content:space-between;padding:13px 18px;
          font-size:9.5px;letter-spacing:.14em;color:var(--ink-soft);
        }

        /* ---- mobile: unlock the ratio, plate becomes a band under the type ---- */
        @media (max-width:820px){
          .clt-hero{
            aspect-ratio:auto !important;
            padding:0 0 76vw;
            background-size:138% auto;
            background-position:center bottom;
          }
          .clt-lockup{position:static;padding:104px 22px 0}
          .clt-eyebrow{font-size:9px;gap:8px;letter-spacing:.18em}
          .clt-eyebrow::before,.clt-eyebrow::after{width:20px;height:2px}
          /* src/mobile.css:521 forces h1 to clamp(24px,7vw,36px) !important for
             every view at max-width 768px, which beats a scoped rule. The extra
             .clt and the !important below exist only to win that cascade — the
             VALUE is exactly as authored, unconverted. */
          .clt .clt-hero h1{margin-top:18px;font-size:clamp(40px,12.4vw,68px) !important;line-height:.9;letter-spacing:-.03em}
          .clt-cta{margin-top:26px;gap:18px;flex-direction:column}
          .clt-btn{padding:16px 30px;font-size:11px;box-shadow:5px 5px 0 var(--ox)}
          .clt-btn:hover{box-shadow:2px 2px 0 var(--ox);transform:translate(3px,3px)}
          .clt-link{font-size:11px;border-bottom-width:2px;padding-bottom:5px}

          .clt-strip{gap:10px;flex-direction:column;align-items:center;font-size:9px;padding:16px}
          .clt-queue-wrap{padding:44px 14px 56px}
          .clt-sec-head h2{font-size:23px}
          .clt-sec-head p{font-size:13px}
          .clt-q-totals b{font-size:21px}
          .clt-goal{font-size:13px}
          .clt-row{padding:12px 14px}
        }
        @media (max-width:420px){
          .clt-hero{padding-bottom:82vw;background-size:152% auto}
          .clt-lockup{padding-top:92px}
        }
        @media (prefers-reduced-motion:reduce){
          .clt *{transition:none !important}
        }
        </style>

        <div class="clt">
            <section class="clt-hero" style="aspect-ratio:${PLATE_W} / ${PLATE_H};background-image:url(${plateSrc});">
                <div class="clt-lockup">
                    <div class="clt-eyebrow clt-mono">SELF-ENFORCING PERFORMANCE CONTRACTS</div>
                    <h1>Put money<br />on your own<br />deadline</h1>
                    <div class="clt-cta">
                        <button type="button" class="clt-btn"${onWriteContract ? ` onclick="${onWriteContract}"` : ''}>WRITE A CONTRACT</button>
                        <button type="button" class="clt-link"${onWatchFlow ? ` onclick="${onWatchFlow}"` : ''}>WATCH FORFEITURE FLOW ↓</button>
                    </div>
                </div>
            </section>

            <div class="clt-strip clt-mono">
                <span><span class="clt-fig clt-ox">${escapeHtml(heldInEscrow)}</span> HELD IN ESCROW</span>
                <span><span class="clt-fig clt-gr">${escapeHtml(String(settledCount))}</span> CONTRACTS SETTLED TODAY</span>
                <span>ORACLES <b>STRIPE · YOUTUBE · SHOPIFY</b></span>
            </div>

            <section class="clt-queue-wrap">
                <div class="clt-sec-head">
                    <div class="clt-kicker clt-mono">LIVE</div>
                    <h2>Every contract, settling in public</h2>
                    <p>Deposits sit in custody until an API calls it. Nothing here is decided by us.</p>
                </div>

                <div class="clt-queue">
                    <div class="clt-q-head clt-mono">
                        <span><i class="clt-dot"></i>SETTLEMENT QUEUE · DEMO FEED</span>
                        <span>21:36:59</span>
                    </div>

                    <div class="clt-q-totals">
                        <div class="clt-held">
                            <span class="clt-mono">HELD IN ESCROW</span>
                            <b>${escapeHtml(heldInEscrow)}</b>
                        </div>
                        <div class="clt-settled">
                            <span class="clt-mono">SETTLED TODAY</span>
                            <b>${escapeHtml(settledToday)}</b>
                        </div>
                    </div>
${rows}

                    <div class="clt-q-foot clt-mono">
                        <span>CUSTODY · STRIPE CONNECT</span>
                        <span>${escapeHtml(String(settledCount))} SETTLED TODAY</span>
                    </div>
                </div>
            </section>
        </div>
    `;
}
