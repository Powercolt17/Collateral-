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
 * The entire <style> block below sits inside a TEMPLATE LITERAL. Never put a
 * backtick in those CSS comments, not even a balanced pair around a property
 * name — a backtick closes the literal wherever it appears, and the landing
 * page dies with a syntax error. Use "double quotes" or caps for emphasis.
 * (This comment block is above the literal, so backticks are safe up here.)
 *
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
 * with a hard edge. Use a gradient scrim. (The --plate-grade filter on
 * .clt-hero::before is a plain filter on an element that owns its own
 * background, so it is not subject to this and is not an exception to it.)
 *
 * The plate paints on .clt-hero::before, NOT on .clt-hero, and the section's
 * inline style hands over --clt-plate rather than background-image. That split
 * exists so --plate-grade can regrade the artwork without dragging the headline,
 * button and link through the same filter. Putting the background back on the
 * section collapses the two and re-reds the hero.
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

          /* PLATE GRADE — the one value to tune if the engraving reads too hot.
             Both plate JPEGs ship as a saturated crimson duotone on a PINK
             ground, so the red was in the artwork, not in any overlay. That put
             the entire viewport in one red and left the oxblood headline,
             button and link with nothing to sit against.

             saturate() does the work; the small sepia() is a corrective, not a
             look. Desaturating alone walks the paper ground toward a dead grey-
             pink, and sepia .12 puts the warmth back without tinting it. It is
             deliberately small: measured on the actual plate, sepia at .18-.20
             starts tinting the open sky YELLOW (sky saturation climbs back to
             .096 from .077), which trades a red cast for a yellow one.

             Do NOT reach for grayscale(1) sepia(x) — the usual duotone recipe.
             It was measured here and rejected twice: it flattens the engraved
             ink to a near-neutral .17-.19 saturation, which kills the plate, and
             it blows the sky to #FFEFCF with the red channel clipped.

             Measured on /assets/images/collateral-plate.jpg, this chain:
               whole-image saturation  .416 -> .314   (-25%)
               open sky behind the h1  #DEC8C8 -> #EADCD8, vs --paper #F1EEE8
               engraved ink            #661D24 -> #492325, saturation .579
               ink HUE                 354.1 -> 355.5 deg  (--ox is 353.9)
               highlight clipping      0% (brightness 1.06 is under the knee)
             and it IMPROVES type contrast on the sky, because the ground
             lightens while the oxblood does not:
               headline --ox      6.50:1 -> 7.75:1  (AA -> AAA)
               button --ox-deep   8.68:1 -> 10.34:1

             Ink hue is the number that matters when tuning. It is what keeps
             this oxblood rather than sepia: saturate() scales the existing
             crimson, so the hue barely moves, while sepia() drags it toward
             40 deg brown. A first pass at saturate(.30) sepia(.12) landed the
             ink at .42 saturation and read GREY, which is the failure mode in
             the other direction from the original crimson. .50/.06 was picked
             off a measured sweep: it carries the most ink saturation while
             still holding the LOWEST sky saturation (.076) of any candidate
             tried, including the greyer .30/.12.

             Lower saturate() for a cooler, more pencil-grey plate; raise it to
             bring the red back. Leave sepia alone unless saturate moves a long
             way. The red is corrected HERE rather than re-exported so the
             artwork stays the single source and both plates grade identically —
             the mobile crop is a different composition and would otherwise
             drift. */
          /* brightness is 1.152 rather than the 1.06 every measurement in this
             comment was taken at, and that is NOT a regrade. The ambient sun
             layer below can only darken, so at 16% peak it runs a mean of 8%
             down across its cycle and this lifts the plate to compensate:
             1.06 / (1 - .08) = 1.152 puts the COMPOSITED average back on 1.06.
             Change the sweep amplitude and this MUST move with it, or the
             whole plate gets darker.

             ACCEPTED COST: at 16% the sky drops to 6.35:1 under the oxblood at
             the deepest point of the cycle, from 9.39:1 at the brightest. The
             display headline is large text and is far clear of any threshold
             either way, but the eyebrow and the forfeiture-flow link are small
             mono on that same sky, so they now sit at AA rather than the AAA
             they held at 10%. That is a real trade made deliberately, to get
             an effect that can actually be seen. If AAA matters more than
             visibility, drop the peak back to .10 and this to 1.124. */
          --plate-grade:saturate(.50) sepia(.06) brightness(1.152) contrast(1.05);
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
           single frame at scroll-top. The plate is 1600x894, and on a window
           WIDER in ratio than that, cover scales the plate to the width and
           the extra height has to go somewhere.

           SUPERSEDED: that overflow used to come off the top, via a "bottom"
           anchor, on the rule that the temple, the figures and the ground line
           must never crop. Measured, that rule was buying an intact ground line
           by running the lockup into the scene: at 1551x756 the sky channel
           ends at y=307 while the CTA row ends at y=358, so the button sat 51px
           INTO the artwork; at 1905x860 the overlap was 95px. It got worse the
           wider the window, because a wider window means more overflow.

           The anchor is now 35%, so ~2/3 of the overflow comes off the bottom
           and ~1/3 off the top. Same measurement after the change: +21px of
           clearance at 1551x756, +29px at 1585x700, +38px at 1905x860. A
           PERCENTAGE is what makes that hold — the shift is a fraction of the
           overflow, so it grows exactly as fast as the problem does. A fixed px
           offset would not.

           The cost is real and is accepted: the bottom of the plate — the
           carved table front — crops by ~72px at 1551x756 and ~133px at
           1905x860. The figures, the desk and the coin bag are all well above
           that line and still land whole.

           Costs NOTHING on a window taller in ratio than 1600x894, e.g.
           1351x768 or 1440x900: cover fits by height there, vertical overflow
           is 0, and a background-position percentage of 0 is the same as a
           percentage of 100. The crop is only ever spent where the overlap
           exists. ---- */
        .clt-hero{
          position:relative;width:100%;
          height:100vh;
          container-type:inline-size;
          background-color:var(--paper);
          /* Confines the light layer's blending to this section. Without it,
             mix-blend-mode on ::after would reach past the hero and blend with
             .cl-grain and the page beneath. */
          isolation:isolate;
        }
        /* The plate paints on a LAYER, not on the section, so --plate-grade can
           be applied to the artwork alone. filter on .clt-hero itself would drag
           the headline, button and link through the same grade and knock the
           oxblood off its measured contrast.

           This is filter, NOT backdrop-filter — the note at the top of this
           file rules out backdrop-filter over the hero because the aspect-locked
           frame breaks the backdrop root and renders a partial pane. A plain
           filter on an element that owns its own background has no such
           dependency.

           The URL arrives as --clt-plate from the inline style on the section
           rather than as background-image, because the image now belongs to the
           pseudo-element and a custom property is the only way to hand a value
           from markup to ::before. */
        .clt-hero::before{
          content:"";position:absolute;inset:0;z-index:0;
          background-image:var(--clt-plate);
          background-position:center 35%;
          background-size:cover;
          background-repeat:no-repeat;
          filter:var(--plate-grade);
        }

        /* ---- living engraving: ambient sun ----
           A single soft light/shadow wave drifting left to right across the
           plate on a 30s cycle. The artwork never moves and never scales; only
           the illumination over it changes.

           WHY A BLENDED LAYER AND NOT A FILTER ANIMATION. Animating
           filter:brightness() on ::before would light the whole plate evenly,
           which reads as the page dimming rather than as sun crossing a scene.
           A gradient that travels gives POSITIONAL light: because the
           composition is ordered left to right — temple, operator, altar,
           magistrates, Nike on the far right — a horizontal sweep brightens
           them in that order on its own. The sequencing in the brief comes out
           of the composition, not out of per-figure targeting.

           PLAIN ALPHA OVER NEUTRAL BLACK, NO BLEND MODE. Compositing black at
           alpha a with ordinary source-over gives out = 0*a + b*(1-a), which
           is b * (1 - a): a pure MULTIPLICATIVE gain. Every tone changes by
           the same PERCENTAGE, which is what more or less light actually does
           to a surface. Contrast ratios are preserved exactly, so the paper
           carries the light without the ink washing out, and because all three
           channels scale together it cannot shift the palette.

           SUPERSEDED: this carried mix-blend-mode:multiply. That was redundant
           and it was a liability. Redundant because multiply against black is
           Cs*Cb = 0, which then composites to b*(1-a) — the identical result
           to the line above, so the blend mode changed nothing about the
           output. A liability because it made the layer depend on the
           compositor resolving ::before as its backdrop, and ::before carries
           a filter while both layers are GPU-promoted by will-change; blend
           modes are flattened or mis-backdropped in exactly that arrangement.
           A silent no-op is the worst kind of dependency, so it is gone. If
           the effect ever needs a mode that is NOT equivalent to plain alpha —
           screen, overlay, anything that lightens — that dependency comes back
           and has to be verified on a real screen, not in arithmetic.

           SUPERSEDED, and this was a real mistake worth recording. This layer
           used soft-light, chosen so engraved grooves would take a different
           delta from the flat paper — the achievable shadow of using the
           artwork as its own displacement source. But soft-light PRESERVES
           HIGHLIGHTS by definition, and this plate is mostly light paper. The
           result measured +3.43% on the midtones and only +0.51% on the open
           sky, so the largest region of the image, the whole upper half where a
           sun would read most, varied 0.86% across the entire frame. That is
           below contrast-sensitivity threshold at this spatial frequency, and
           adaptation removes what is left over a 15s ramp. The effect was
           real, correct, and completely invisible. Reporting the midtone figure
           without separating out the sky hid it.

           A normal-blended veil is the other wrong answer: it ADDS a constant,
           so at the alpha needed to move the paper 3% the ink would jump from
           .152 to .319 and the engraving would wash out entirely.

           The cost of multiply is that it only darkens, so light here is the
           absence of shadow and --plate-grade carries a compensating
           brightness. That trade is worth it: it is the only one of the three
           that moves the paper at all.

           WHY TRANSFORM AND OPACITY ONLY. Both are compositor properties, so
           this runs on the GPU without re-rasterising a full-viewport image
           every frame. No layout property is touched, so it cannot shift the
           page or interact with scrolling.

           THE LOOP IS SEAMLESS BY CONSTRUCTION, not by easing back. The tile
           is 25% of a 400%-wide layer, so exactly one hero width, and the
           sweep translates by exactly 25% — one whole tile. The last frame is
           pixel-identical to the first, so there is no seam and no reversal:
           the sun keeps going the same way forever. The layer is 400% wide and
           offset -150% so it still covers the hero at both ends of the travel.

           Two animations, deliberately different curves. The sweep is LINEAR —
           a sun that eased in and out would visibly pulse once per cycle. The
           intensity breath is the sine the brief asks for, on opacity,
           alternating so it returns to its own start.

           Angle is a flat 90deg on purpose. A raking angle looks better but
           makes the gradient a function of x AND y, which no longer tiles
           horizontally without a visible diagonal seam at every repeat. */
        .clt-hero::after{
          content:"";
          position:absolute;top:0;bottom:0;left:-150%;width:400%;
          z-index:0;pointer-events:none;
          /* NO mix-blend-mode, deliberately. See the note above. */
          /* Alphas are set by measurement, not by eye. soft-light lifts dark
             backdrops far more in RELATIVE terms than light ones, so the
             constraint that binds is the engraved ink, not the paper. At .13
             the ink lifted 20% and visibly washed. These peaks put the
             midtones — the stone, the fabric, the bulk of the image — at a
             3.4% swing, and hold the ink to about 5 luminance points out of
             255. The paper barely moves at 0.5%, which is correct: sunlight
             should not blow out the sky the headline sits on.

             THE PROFILE IS A SAMPLED SINUSOID, and that is the whole point of
             this shape. The previous version was four straight ramps with
             corners at 30%, 50% and 70%. Amplitude was never the reason it
             read as a band travelling over the picture — the corners were. A
             corner is a discontinuity in the FIRST DERIVATIVE of luminance,
             which is exactly what triggers Mach banding: human vision
             edge-detects on the second derivative, so it manufactures a
             visible line at every slope change even when the step in
             brightness is far below threshold. Four corners meant a leading
             edge, a trailing edge and a ridge down the middle.

             THE PROFILE IS A RAISED COSINE IN A SINGLE COLOUR, which under
             multiply is the simplest smooth wave there is. alpha runs
             .05*(1+cos(2*pi*x)), so it peaks at .10 at the tile edges and
             reaches exactly 0 at the centre. Light is the ABSENCE of
             darkening, not an added highlight.

             .10 is the second time this amplitude has been raised. It started
             at an amount derived from a brief asking for +/-4% brightness,
             which measured 0.86% on the open sky and was invisible; the blend
             mode was fixed and it went to .06, which was still reported as
             invisible on a real screen. The lesson is that "felt, not seen"
             has a floor, and on a low spatial frequency wave crossing over 15
             seconds that floor is a lot higher than a specification derived
             from single-pixel percentages suggests. .10 should be near the
             ceiling: past this it starts announcing itself as an animation.
             If it needs to move again, --plate-grade brightness moves with it.

             That collapses a problem the previous version had to engineer
             around. When light and shadow were two different colours, they met
             at a crossover where the slope had to be matched by hand — a
             half-sine's slope at its foot is amplitude over width, so unequal
             peaks needed unequal lobe widths, a 70/30 split, to avoid a 2.33x
             kink at the steepest part of the wave. One colour has no crossover
             to match. The curve is C1 everywhere including the wrap, where the
             derivative is zero on both sides because the tile edge sits on the
             trough.

             The remaining slope changes are pure sampling error from the 5%
             stop spacing, and they land where they do least harm: linear
             interpolation is worst where the curve bends most, which on a
             raised cosine is the crest and trough, and those are exactly where
             the slope is near zero and the eye is least sensitive.

             ONE FULL PERIOD PER TILE IS THE BROADEST POSSIBLE. The tile is
             locked to the hero width by the seamless-loop geometry and the wave
             has to close over exactly one tile, so a single period is the
             widest feathering available without touching that geometry. */
          background-image:linear-gradient(90deg,
            rgba(0,0,0,.1600) 0%,
            rgba(0,0,0,.1561) 5%,
            rgba(0,0,0,.1447) 10%,
            rgba(0,0,0,.1270) 15%,
            rgba(0,0,0,.1047) 20%,
            rgba(0,0,0,.0800) 25%,
            rgba(0,0,0,.0553) 30%,
            rgba(0,0,0,.0330) 35%,
            rgba(0,0,0,.0153) 40%,
            rgba(0,0,0,.0039) 45%,
            rgba(0,0,0,0) 50%,
            rgba(0,0,0,.0039) 55%,
            rgba(0,0,0,.0153) 60%,
            rgba(0,0,0,.0330) 65%,
            rgba(0,0,0,.0553) 70%,
            rgba(0,0,0,.0800) 75%,
            rgba(0,0,0,.1047) 80%,
            rgba(0,0,0,.1270) 85%,
            rgba(0,0,0,.1447) 90%,
            rgba(0,0,0,.1561) 95%,
            rgba(0,0,0,.1600) 100%);
          background-size:25% 100%;
          background-repeat:repeat;
          will-change:transform,opacity;
          /* 14s, not 30s, and that is the change that matters most here.
             Amplitude was raised twice with no effect reported, because
             amplitude was the wrong knob. Vision detects CHANGE far more
             readily than it detects a static gradient, and at 30s the
             luminance at any point moves about 0.7% per second — under the
             threshold for noticing. The spatial side is no better: one cycle
             across the frame is roughly 0.02 cycles per degree, near the floor
             of the contrast sensitivity function, and all the engraved
             hatching masks it further. 30s x low amplitude was a specification
             that guaranteed invisibility. 14s roughly doubles the rate of
             change, and the amplitude increase compounds with it.

             clt-breathe is GONE. It scaled the whole darkening down to as
             little as 82%, which spent much of the cycle under the tuned
             amplitude for no visible benefit, and it made the mean darkening
             harder to compensate for. One animation, one job. */
          animation:clt-sun 14s linear infinite;
        }
        /* One whole tile. Any other value shows a seam at the wrap. */
        @keyframes clt-sun{
          from{transform:translate3d(0,0,0)}
          to{transform:translate3d(25%,0,0)}
        }
        /* clt-breathe removed. It modulated the layer's opacity as a second,
           slower rhythm, but opacity scales the entire darkening, so it spent
           most of the cycle under the amplitude the sweep was tuned for and
           made the brightness compensation depend on a mean opacity. It cost
           visibility and bought a rhythm nobody could see. */
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
          /* Above the plate layer. Both are positioned children of .clt-hero, so
             without this the ::before would paint over the type. */
          z-index:1;
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

        /* ---- entrance ----
           The hero was the only section on the page with no motion: 0 animated
           elements against 41 everywhere else. The site's motion framework was
           rolled out before this component existed and the component never
           picked it up.

           These are @keyframes, NOT the shared .rise / .clip-wipe classes, and
           that is deliberate. Those are TRANSITIONS that only fire once
           initEntranceObservers() adds .is-in. For a section below the fold
           that is fine. For this one it is not: the base state is opacity:0, so
           the hero would paint blank and stay blank for as long as JS takes —
           and forever if the bundle fails. That is the exact bug 122b9e75 had
           to fix, and the fix then was to hardcode .is-in into the markup,
           which bought visibility by giving up the animation entirely.

           An animation with fill-mode:both cannot fail that way: it starts on
           its own and always ends on the visible frame. Nothing here depends on
           the observer, and .clt-in / .clt-line are deliberately NOT names the
           observer looks for, so the two systems cannot interact.

           The values are the house language, matched to LandingStyles: rise is
           10px / 620ms, the wipe is 720ms with the same 6px lift as hl-strike,
           both on cubic-bezier(.22,1,.36,1), staggered with --d. */
        @keyframes clt-rise{
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:none}
        }
        @keyframes clt-wipe{
          from{opacity:0;clip-path:inset(0 0 100% 0);transform:translateY(6px)}
          to{opacity:1;clip-path:inset(0 0 0 0);transform:none}
        }
        .clt-in{animation:clt-rise 620ms cubic-bezier(.22,1,.36,1) var(--d,0ms) both}
        /* inline-block so clip-path has a box to clip. The BR tags are kept and
           the lines are not display:block, so the three-line rag and the
           line-height:.855 metrics are byte-identical to before. */
        .clt-line{display:inline-block;animation:clt-wipe 720ms cubic-bezier(.22,1,.36,1) var(--d,0ms) both}

        /* ---- proof strip at the fold ----
           Pulled UP over the bottom of the plate so ~44px of its 70px shows
           above the fold. The hero is exactly 100vh, so with the strip flowing
           normally it began at exactly the fold line and none of it was ever
           on screen: the escrow figure and the settled count — the only social
           proof on the page — were invisible at scroll-top, and nothing
           signalled there was more page below.

           A negative margin rather than a shorter hero, and the difference is
           not cosmetic. Shrinking the hero to 94vh was measured first and
           rejected: a shorter frame means MORE vertical overflow for cover to
           place, which walks the plate back up into the lockup. It took the
           clearance at 1551x760 from +21px down to +6px, and at 1351x768 it
           created overflow where the ratio previously had none, turning +7px
           into -11px. It would have undone the fix directly above.

           This way the hero's geometry is untouched — same height, same cover
           scale, same overflow, same clearance — and the peek is a constant
           44px at every viewport instead of a percentage that collapses on
           short windows.

           It is opaque, so it covers the bottom 44px of the engraving. That
           band is the carved table front, which the 35% anchor is already
           cropping into, and the strip's own 1px top rule reads as the plate's
           bottom edge. */
        .clt-strip{
          position:relative;z-index:3;
          margin-top:-44px;
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
          }
          /* The portrait plate swaps on the LAYER now, not on the section.
             --plate-grade is not repeated here on purpose: the desktop
             ::before rule already carries it and this block only overrides the
             three background properties, so mobile and desktop cannot drift to
             different colourways.

             The !important is now belt-and-braces rather than load-bearing. It
             was required when the section carried an inline background-image,
             which no stylesheet rule can beat; the inline style now sets
             --clt-plate instead, so equal specificity plus later source order
             would already win. Kept because the inline-style form is the
             obvious thing to revert to. */
          .clt-hero::before{
            background-image:url(/assets/images/collateral-plate-mobile.jpg) !important;
            background-size:100% 100%;
            background-position:center top;
          }
          .clt-lockup{position:absolute;inset:0 0 auto 0;padding:96px 22px 0;z-index:1}
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
          /* The transition kill above does nothing to an animation, and the
             entrance is animation-driven. Without this the hero would still
             wipe and lift for someone who asked it not to. Land every element
             on its final frame instead. */
          .clt-in,.clt-line{
            animation:none !important;
            opacity:1 !important;
            clip-path:none !important;
            transform:none !important;
          }
          /* The sweep is continuous and never stops, which is exactly what a
             reduced-motion request is about. Remove the light layer outright
             and leave the plate in its neutral state: --plate-grade and
             nothing else.

             SUPERSEDED: this used to freeze the layer at opacity .78 with the
             animation cancelled, on the theory that holding a mid-cycle frame
             kept the tone consistent with everyone else's. That was wrong, and
             more wrong now that the profile is one smooth wave per tile:
             cancelling the animation pins the wave at its start offset, so the
             trough sits over the plate permanently and the reduced-motion
             visitor gets a fixed dark band across the engraving — the exact
             artefact this pass exists to remove, made permanent. Neutral means
             no layer. */
          .clt-hero::after{
            display:none !important;
          }
        }
        </style>

        <div class="clt">
            <section class="clt-hero" style="--clt-plate:url(${plateSrc});" data-plate="${PLATE_W}x${PLATE_H}">
                <div class="clt-lockup">
                    <div class="clt-eyebrow clt-mono clt-in" style="--d:60ms">SELF-ENFORCING PERFORMANCE CONTRACTS</div>
                    <h1><span class="clt-line" style="--d:150ms">Put money</span><br /><span class="clt-line" style="--d:240ms">on your own</span><br /><span class="clt-line" style="--d:330ms"><span class="clt-accent">deadline</span></span></h1>
                    <div class="clt-cta clt-in" style="--d:470ms">
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
