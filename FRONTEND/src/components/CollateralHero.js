/**
 * Collateral — engraved hero + proof strip.
 *
 * The settlement queue that used to live at the bottom of this component moved
 * out to LedgerSection.js. Its markup, CSS and QUEUE data went with it.
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
 * SUPERSEDED: the primary button was ink navy with an oxblood shadow, on the
 * rule that oxblood lacks contrast on the red plate. The August colourway makes
 * the headline, button and link all oxblood. That rule was about oxblood on the
 * ENGRAVING; the lockup sits in the plate's clear sky, which is paper, where
 * oxblood measures well clear of AA. Checked, not assumed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Desktop plate: 1600x894 JPEG, 433KB. Mobile: 900x1500 JPEG, 142KB.
//
// The mobile crop is built from the DESKTOP artwork, not from a portrait
// render. A portrait render put the scene between 28% and 100% of its height,
// so the scene alone was ~1365px tall on a 390 phone and no crop could shorten
// it without cutting figures. The desktop scene is wide and short, so it drops
// into the bottom third of a shorter canvas and leaves the top clear. Hero on a
// 390 phone goes 822px -> 650px, inside one screen instead of overflowing it.
const PLATE_W = 1600;
const PLATE_H = 894;

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

        /* Header loses its opaque paper fill over the hero so the plate runs
           under it. Scoped by lifetime, not by selector: this <style> lives
           inside the landing view's markup, so the router replaces it on
           navigation and no other route is affected. .ch-header sets its
           background with !important, hence the !important here.

           A gradient scrim, NOT background:transparent. Fully transparent was
           measured and fails: because the hero crops from the top, a short
           window lifts the left-hand cypresses into the header band, putting
           12.1% ink at luma 29 directly under the #0E1420 wordmark — dark on
           dark. The menu side stays clean (luma 226), so it is the wordmark
           alone that breaks. The scrim fades to nothing by the bottom edge, so
           the plate still reads through it.

           NOT backdrop-filter — over an aspect-broken hero it renders a partial
           pane with a hard visible edge.

           Only at the top of the page. Once .nav-scrolled lands the header
           takes back its opaque paper fill, which it needs to stay readable
           over the sections below. */
        .ch-header:not(.nav-scrolled){
          background:linear-gradient(to bottom,
            rgba(241,238,232,.92) 0%,
            rgba(241,238,232,.70) 55%,
            rgba(241,238,232,0) 100%) !important;
          border-bottom-color:transparent !important;
        }

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
           looks terrible.

           The hero is exactly ONE viewport tall so the whole thing sits in a
           single frame at scroll-top, with nothing cut off the bottom. cover +
           bottom anchor is what makes that safe: the plate is 1600x894 and the
           frame is usually taller in ratio, so something has to give, and what
           gives is the TOP BAND OF EMPTY SKY. The temple, the figures at the
           desk and the ground line are pinned to the bottom edge and never
           crop. That is also what "push the background up" means here. ---- */
        .clt-hero{
          position:relative;width:100%;
          height:100vh;
          container-type:inline-size;
          background-position:center bottom;
          background-size:cover;
          background-repeat:no-repeat;
          background-color:var(--paper);
        }
        /* ONE unit drives the whole lockup. Tune --u to resize everything at
           once; the multipliers below are the authored proportions.

           min() is the point: 1cqw tracks the plate horizontally, but the frame
           is now height-bound, and on a short window cover crops away the sky
           the type sits in. The 1.75vh companion makes the lockup shrink with
           the frame instead of walking down onto the foliage. On a normal
           desktop the cqw side wins and nothing changes. */
        .clt-hero{--u:min(1cqw,1.75vh)}
        .clt-lockup{
          position:absolute;inset:0 0 auto 0;
          /* 8.1, up from 6.3, to seat the block lower in the open sky — there was
             too much slack between the CTA row and the temple steps. This is the
             authored 8.4 -> 10.8 move (x1.286) carried onto the 0.75 scale the
             lockup now runs at. */
          padding-top:calc(8.1 * var(--u));
          display:flex;flex-direction:column;align-items:center;text-align:center;
        }
        .clt-eyebrow{
          display:flex;align-items:center;gap:calc(.64 * var(--u));
          font-size:clamp(9px,calc(.585 * var(--u)),20px);letter-spacing:.24em;font-weight:700;color:var(--ox);
        }
        .clt-eyebrow::before,.clt-eyebrow::after{content:"";width:calc(1.8 * var(--u));height:calc(.1 * var(--u));background:var(--ox)}
        .clt-hero h1{
          margin-top:calc(1.05 * var(--u));
          font-size:calc(4.8 * var(--u));line-height:.855;letter-spacing:-.038em;font-weight:800;
          text-transform:uppercase;
          /* Oxblood, per the new colourway. The !important is still doing work:
             a global h1{color:var(--text-primary)} wins over an unweighted rule
             here and was rendering the headline rgb(17,17,17). */
          color:var(--ox) !important;
        }
        /* The accent span is now the same colour as the rest of the headline —
           the whole line went oxblood, so this no longer differentiates. Kept
           because the markup still carries the span, which makes restoring a
           two-tone headline a one-value change rather than a markup edit. */
        .clt-accent{color:var(--ox)}
        .clt-cta{margin-top:calc(1.95 * var(--u));display:flex;align-items:center;gap:calc(1.43 * var(--u))}
        /* The px FLOOR on the two CTA labels stops them collapsing to ~8px on a
           1024 laptop. It does not engage on a full-size screen. */
        /* ox-deep FILL with an ox shadow — the inverse of the first attempt.
           Straight ox fill matched the headline exactly, so the button stopped
           reading as the action and became more headline. ox-deep is the darkest
           value in the section, which puts the button back at the top of the
           value hierarchy the way ink navy did, without leaving the maroon
           family the new colourway is built on. The shadow is the lighter ox, so
           the offset still separates from the fill instead of disappearing into
           it. Contrast measured, not assumed. */
        .clt-btn{
          background:var(--ox-deep);color:var(--paper-hi);border:0;cursor:pointer;
          padding:calc(.86 * var(--u)) calc(1.87 * var(--u));
          font:700 clamp(11px,calc(.615 * var(--u)),20px)/1 ui-monospace,Menlo,monospace;letter-spacing:.17em;
          box-shadow:calc(.315 * var(--u)) calc(.315 * var(--u)) 0 var(--ox);
          transition:box-shadow .16s ease,transform .16s ease;
        }
        .clt-btn:hover{box-shadow:calc(.09 * var(--u)) calc(.09 * var(--u)) 0 var(--ox);transform:translate(calc(.225 * var(--u)),calc(.225 * var(--u)))}
        .clt-link{
          background:none;border:0;cursor:pointer;color:var(--ox);
          font:700 clamp(11px,calc(.615 * var(--u)),20px)/1 ui-monospace,Menlo,monospace;letter-spacing:.15em;
          padding-bottom:calc(.225 * var(--u));border-bottom:calc(.1 * var(--u)) solid var(--ox);
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
        /* ---- mobile: unlock the ratio, plate becomes a band under the type ----
           A landscape plate on a portrait screen cannot both bleed and stay
           whole, so the deal here is: type on open paper up top, engraving as a
           band pinned to the bottom edge.

           width:100vw + margin-left:calc(50% - 50vw) is the full-bleed escape.
           .lp gives the landing page a 16px gutter at this width, which was
           insetting the hero and leaving paper down both sides while desktop
           bled edge to edge. The 100vw form is used rather than -16px margins so
           it does not silently break if that gutter ever changes.

           background-size is 100% — the plate is shown WHOLE, not zoomed. It was
           152%, which overhung the screen by ~18% a side. Measuring the plate's
           horizontal ink profile shows why that was wrong: the densest ink is at
           the outer edges (51-64% coverage in the first 10% of the width, 53-65%
           in the last 10%) because the cypresses and foliage are the frame, and
           the sparse middle is sky. So zooming crops precisely the strongest
           graphic element. 152% discarded 55% of all ink, 140% discarded 48%,
           and all that buying was ~11 points of band height. Whole plate at
           100%: 223px of band, 26% of a 390x844 screen, composition intact.

           min-height rather than height: the lockup measures ~340px at 390x844
           against a 289px band, so it fits one frame comfortably, but min-height
           means a longer translation or a larger font grows the hero instead of
           spilling type over the artwork. ---- */
        @media (max-width:820px){
          /* Mobile gets its OWN portrait plate, aspect-locked. This replaces the
             band-under-the-type approach entirely: the landscape plate used to
             be scaled and anchored to the bottom with the lockup flowing above
             it, which is why the lockup was position:static and why there was a
             padding-bottom reserving the band. A portrait crop needs none of
             that — the hero is simply the plate, and the type sits on it, the
             same way desktop works.

             background-size:100% 100% is safe here precisely BECAUSE of the
             aspect-lock: the box always matches 900/1614, so the image is never
             actually stretched.

             width:100vw + margin-left:calc(50% - 50vw) is kept, and is not in
             the supplied rules. .lp puts a 16px gutter on the landing page at
             this width; without this the hero sits inset with paper down both
             sides, which is the "it needs to be full screen" problem from
             earlier. */
          .clt-hero{
            aspect-ratio:900 / 1500 !important;
            height:auto !important;
            padding:0;
            width:100vw;
            margin-left:calc(50% - 50vw);
            background-image:url(/assets/images/collateral-plate-mobile.jpg) !important;
            background-size:100% 100%;
            background-position:center top;
          }
          .clt-lockup{position:absolute;inset:0 0 auto 0;padding:96px 22px 0}
          .clt-eyebrow{font-size:9px;gap:8px;letter-spacing:.18em}
          .clt-eyebrow::before,.clt-eyebrow::after{width:20px;height:2px}
          /* src/mobile.css:521 forces h1 to clamp(24px,7vw,36px) !important for
             every view at max-width 768px, which beats a scoped rule. The extra
             .clt and the !important below exist only to win that cascade — the
             VALUE is exactly as authored, unconverted. */
          .clt .clt-hero h1{margin-top:16px;font-size:clamp(38px,12vw,48px) !important;line-height:.9;letter-spacing:-.03em}
          .clt-cta{margin-top:26px;gap:18px;flex-direction:column}
          /* min-height is the 44px touch target; the padding alone gave 43px. */
          .clt-btn{padding:16px 30px;min-height:44px;font-size:11px;box-shadow:5px 5px 0 var(--ox)}
          .clt-btn:hover{box-shadow:2px 2px 0 var(--ox);transform:translate(3px,3px)}
          .clt-link{font-size:11px;border-bottom-width:2px;padding-bottom:5px}

          .clt-strip{gap:10px;flex-direction:column;align-items:center;font-size:9px;padding:16px}
        }
        /* No max-width:420px block. It existed to re-tune the zoom and padding of
           the old scaled band; the aspect-lock makes both meaningless. */
        @media (prefers-reduced-motion:reduce){
          .clt *{transition:none !important}
        }
        </style>

        <div class="clt">
            <section class="clt-hero" style="background-image:url(${plateSrc});" data-plate="${PLATE_W}x${PLATE_H}">
                <div class="clt-lockup">
                    <div class="clt-eyebrow clt-mono">SELF-ENFORCING PERFORMANCE CONTRACTS</div>
                    <h1>Put money<br />on your own<br /><span class="clt-accent">deadline</span></h1>
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

        </div>
    `;
}
