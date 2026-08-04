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
 * PLATE_W/PLATE_H describe the artwork and are reported on data-plate. The hero
 * box itself is height:100vh and is NOT aspect-locked — an older revision locked
 * it and the note about that lock survived the change for a while. Any statement
 * that the hero's aspect comes from these constants is out of date.
 *
 * backdrop-filter over the hero: the old rule here was "never", because a blur
 * layer rendered a partial pane with a hard visible edge. The edge was the real
 * problem, not the blur. .ch-header now blurs over this hero successfully by
 * fading its own layer out with a mask, so it has no edge to show — see
 * Header.js. Anything layered over the hero that blurs must do the same; a
 * square-edged blur layer will still draw that seam. (The --plate-grade filter
 * on .clt-hero::before is a plain filter on an element that owns its own
 * background, and was never subject to this.)
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

// Desktop plate: collateral-senate.jpg, 1536x1024 JPEG, 381KB.
// Mobile crop:   collateral-senate-mobile.jpg, 1066x1024 JPEG, 335KB.
//
// SUPERSEDED, kept because the lesson still binds: an earlier plate was widened
// to 2018x961 by mirror-tiling its outer 70px, because the artwork as drawn was
// 1.811 against hero frames running 2.04-2.22 and cover was eating the bottom of
// the picture — the table, coins, scroll and seal, which is the transaction the
// image is about. That canvas is gone. The senate plate is used as drawn, with
// no synthesised margin anywhere, so there is no bilateral symmetry to spot at
// the lower left and nothing to regenerate.
//
// The mobile crop is still built from the DESKTOP artwork rather than a portrait
// render, for the reason that has held through three plates: a portrait render
// puts the scene between 28% and 100% of its height, so the scene alone comes
// out ~1365px tall on a 390 phone and no crop shortens it without cutting
// figures. Cropping the desktop artwork on the LEFT only — x 470 of 1536, full
// height — keeps the whole group, keeps the artwork's own ground, and lands at
// 1.041 so it renders 375px tall on a 390 phone. That leaves 469px of paper
// above it for a lockup that measures ~340px.
//
// SENATE PLATE, 1536x1024 (3:2). Replaces the 1917x866 crop.
//
// The composition is the same shape as the one it replaces and the layout did
// not have to move: figures massed on the right, empty paper on the left. Ink
// starts at 33.3% of the width against 30.5% before, measured the same way, so
// the type channel got slightly WIDER rather than narrower.
//
// What did change is the aspect: 1.5 against 2.214, so the plate is much taller
// relative to its width. The hero is height:100vh with background-size:cover
// and is not aspect-locked, so on any desktop wider than 3:2 the surplus is
// discarded top and bottom rather than off the sides — which is the good
// direction here, because the sides are where the clear type zone and the
// deliberate right-edge bleed live. The bottom of the pedestal is already cut
// off in the source, so trimming a little more of it costs nothing.
const PLATE_W = 1767;
const PLATE_H = 1024;
// The 1536x1024 original is still shipped and still used, by the narrow-aspect
// fallback below 3/2 where the wide canvas would read as a strip.
const PLATE_NARROW = '/assets/images/collateral-senate.jpg';

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
        plateSrc = '/assets/images/collateral-senate-frame.jpg',
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
          --ox:#781C22; --ox-deep:#57131A;
          --rule:#D8D3C8; --green:#1F6B45;

          /* --ink-warm is a WARM near-black, not the palette's --ink. --ink is
             #131A2A, a cool navy, which was chosen against a crimson plate. On
             sepia it reads blue and sits apart from the artwork. This is the
             same value the engraving's own darkest ink resolves to, so the
             headline belongs to the same picture. */
          --ink-warm:#2B2118;
          /* Trajan for display caps. It is already loaded for the wordmark, in
             400 and 700, so this costs no new asset. Caps-only, which is why
             every rule using it also carries text-transform:uppercase.
             Newsreader is the text serif for anything with lowercase — Trajan
             has none, so a subhead cannot use it. */
          --roman:"Trajan Pro","Cinzel",Georgia,serif;
          --text-serif:"Newsreader",Georgia,"Times New Roman",serif;

          /* PLATE GRADE. The artwork is natively sepia ink on cream, so this is
             a small correction, not a colour conversion. Three parts, each
             load-bearing:

             SUPERSEDED — saturate(.62) was the value here, and the argument for
             it was that the plate reads warmer than --paper #F1EEE8, so pulling
             its saturation from .272 toward .169 closed the RGB distance from 63
             to 34 and brought the artwork nearer the token.

             That was the wrong thing to optimise. It treated the plate's warmth
             as drift from a palette token instead of as the artwork's subject,
             and the correction it prescribed — desaturating, then brightening to
             compensate — is what produced a chalky plate. The engraving is not a
             surface that should match --paper; it is the picture, and --paper is
             the page around it. The current value is above the file's own
             saturation, not below it, and the guidance to "warm --paper rather
             than desaturate further" still stands and is now the ONLY lever that
             should be reached for if the join at the proof strip reads wrong.

             The old note's stated floor was real, though, and worth keeping:
             below about .55 the engraving goes grey and loses the reason sepia
             was chosen at all.

             contrast(.92) — the plate stepping BACK. It is cross-hatched edge
             to edge and carries far more visual noise per square inch than a
             flat illustration, so it was winning the page against the type.
             This narrows its range about 8%. Deliberately small: the darkest
             ink is near-black so there is range to give up, but an earlier
             pass overshot and read as faded.

             brightness(1.09) — compensation for the cloud layer, NOT taste.
             The cloud only ever darkens, at a mean of opacity x 0.5. This puts
             the composited average back where it belongs. IT IS COUPLED: move
             the cloud opacity and this must move with it, along with the
             reduced-motion flat colour further down, which is that same mean
             (.16 x 0.5 = the rgba(0,0,0,.08) fallback — if those two ever
             disagree, reduced-motion users get a differently lit hero).

             Note the cloud is NOT uniform across the plate. The .clt-sky mask
             runs .45 at the left edge to 1 past 66%, so the headline column
             sees roughly .48 of nominal — 3.8% mean and 7.7% deepest, against
             8% and 16% on the right. That asymmetry is deliberate and is why
             the type stays legible while the artwork still visibly weathers.

             Do NOT reach for grayscale(1) sepia(x), the usual duotone recipe.
             Measured and rejected twice on the earlier crimson artwork: it
             flattens engraved ink to .17-.19 saturation, which kills the
             plate, and clips the sky. It is wrong here for a further reason —
             this plate is already sepia, so it would do the job twice.

             RE-MEASURED on collateral-senate.jpg at these exact values, over
             the region the headline actually occupies. The grade was tuned on
             the plate before this one and was carried over rather than
             re-derived, so it was checked rather than assumed — the two plates
             turn out to sit within two or three points of each other on every
             channel, which is why nothing here had to move:
               plate mean        237,213,175   (crop5 was 239,213,174)
               graded mean       241,226,202   (crop5 was 242,225,201)
               brightest pixel   249,236,213 — no clipping, and 5 points more
                                 headroom than crop5 left
               headline contrast 12.36:1 against the graded mean, 10.88:1
                                 against the darkest pixel in the region and
                                 13.45:1 against the brightest, all versus
                                 --ink-warm #2B2118. AAA throughout.
             Those three figures are plate-and-grade only. The .clt-sun cloud
             layer sits above at .16 opacity and modulates them further; the
             crop5 note quoted sun/cloud numbers instead, so the two sets are
             not directly comparable line for line.
             The headline is --ink-warm, not --ox; the oxblood is button-only.
             Grading it any brighter starts clipping the paper. */
          /* GOLD RESTORED. saturate(.62) was pulling 38% of the chroma out of an
             engraving whose whole character is warm gold, and brightness(1.09)
             then washed what survived toward grey-cream — the plate arrived on
             screen paler and flatter than the artwork actually is. The two
             compounded: desaturating first and lifting second is the exact
             recipe for chalk.

             1.12 puts the gold slightly ABOVE the file's own saturation rather
             than merely back at it, contrast 1.02 returns the bite that .92 had
             taken off the engraved line, and brightness comes off entirely
             because the artwork does not need lifting — it needed leaving
             alone. Re-measured after the change, not assumed. */
          --plate-grade:saturate(1.12) contrast(1.02) brightness(1);
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

        /* THE HEADER SCRIM LIVES IN Header.js NOW, AND MUST NOT BE DUPLICATED
           HERE. This rule used to paint a cream gradient onto .ch-header with
           !important so the plate could run under the bar. The header now
           carries its own blurred, masked scrim on .ch-header::before, and a
           background on the element itself paints BEHIND that layer — a .92
           fill here would sit under the blur and block the plate it was meant
           to reveal, which is the opposite of what this rule existed to do.

           The reason it existed still holds and is still handled: the hero
           crops from the top, so a short window lifts the left-hand cypresses
           into the header band, putting 12.1% ink at luma 29 under the #0E1420
           wordmark. Dark on dark. That is now solved by the blur — which
           averages those cypresses into their surroundings before anything is
           composited over them — plus the tint in Header.js. Verified by
           sampling the plate under the wordmark box rather than by eye. */

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
          /* Single layer again. This carried a paper veil down the right edge
             to stop Nike pulling focus off the operator and the table. The
             sepia plate redrew her smaller, lighter and further back, so the
             artwork solves it at source and the veil was double-counting —
             it came out with the artwork swap. */
          background-image:var(--clt-plate);
          /* LEFT, and this is the whole reason the layout changed.
             The plate is no longer a landscape with a hole of sky in the
             middle — it is a close crop with the figures massed on the RIGHT
             and empty paper on the LEFT, which is where the type now lives.
             Ink starts at 33.3% of the plate width, measured (30.5% on the
             plate this replaced, so the type channel widened slightly).

             Anchoring left puts every pixel cover discards on the RIGHT edge,
             where the magistrate already bleeds off by design, so the clear
             zone the type sits in is never eaten. Centre-anchoring would split
             the crop and take 130px off the left at 1351 wide, cutting the
             usable type width from 491px to 361px — a 27% loss of the only
             space the headline has. */
          /* COVER, ANCHORED RIGHT, ON A PLATE WHOSE PAPER WAS EXTENDED.

             THE SEAM IS WHY THIS CHANGED AGAIN. contain plus a flat
             background-color fill showed the whole plate correctly, but the
             fill met the artwork's left edge at a visible vertical line: the
             JPEG's paper is textured and very slightly modulated, a CSS colour
             is perfectly flat, and no single value matches a texture. The wider
             the window the larger that flat panel became — 496px of it at
             1882x924 — so the join was unmissable on exactly the screens most
             people use.

             Fixed at source instead of in CSS. collateral-senate-wide.jpg is
             the same artwork on a 2662x1024 canvas, the extra 1126px being the
             plate's own leftmost 400px of paper, mirror-tiled. It is the same
             trick a previous plate used and was rejected for, and the reason it
             works here is that the slice is pure paper: the earlier attempt
             mirrored 193px that contained the Nike statue and a piece of the
             temple. Measured after building rather than assumed — the largest
             column-to-column luma step anywhere in the paper is 0.765, and the
             three tile joins measure 0.295, 0.338 and 0.295, all far below what
             an eye resolves.

             With cover the image always fills the box, so no fill is ever
             exposed and there is no join to see at any width. The
             background-color stays only as a first-paint and decode-failure
             fallback.

             ANCHORED RIGHT is what fixes the composition, and the arithmetic is
             worth keeping because it is exact. Extending the canvas leftward
             does not move the distance from the first inked pixel to the right
             edge: that stays 1025px. With cover and a right anchor, while the
             plate is taller in ratio than the box, the scale is set by height,
             so the clear channel is

                 f = 1 - 1025 / (1024 * A)      A = box aspect ratio

             which is 33.3% at 1.5, 42.1% at 1.73 — the approved frame's own
             ratio and its own measured value — and 50.9% at 2.04. The channel
             widens with the window instead of the artwork creeping across the
             type.

             right TOP, not bottom. Below 2.6 the height-based scale means there
             is no vertical crop at all and the anchor is inert. Above it — an
             ultrawide — the surplus is vertical, and top keeps the paper and
             the heads while spending the crop on the pedestal's base, which the
             source already cuts off. bottom would decapitate the figures.

             SUPERSEDED — the note below describes the contain approach this
             replaced. Kept because the framing reasoning still holds and the
             narrow-aspect fallback further down still uses it:

             CONTAIN AND ANCHOR BOTTOM-RIGHT, not cover-and-left.
             cover was cropping the plate's top off on every desktop window —
             at 1920x950 it discarded 317px of height, which lifted the figures
             until their heads touched the top edge and left no paper above
             them. That is the single biggest difference from the approved
             frame, and it had a second cost: the header's blur then had heads
             directly under it and smeared them into grey blobs, instead of
             sitting over clear paper.

             contain shows the whole plate. The surplus box width appears on the
             LEFT, which is exactly where the type lives, so the clear channel
             gets wider rather than narrower — the artwork's own empty third
             plus the page paper beside it, reading as one continuous surface.

             right bottom, so the surplus falls top-left. That matches the
             artwork's own composition, which is already paper at the top left,
             and it keeps the pedestal seated on the bottom edge instead of
             floating on a band.

             The fill BELONGS ON THIS ELEMENT, under the image, so
             --plate-grade treats the paper and the artwork identically. Put it
             on .clt-hero instead and the ungraded fill meets the graded plate
             at a visible vertical seam down the middle of the hero. Same value
             and same reasoning as the mobile panel. */
          background-position:right top;
          background-size:cover;
          background-color:#EED6AF;
          background-repeat:no-repeat;
          filter:var(--plate-grade);

          /* THE PRESS. The plate does not fade in, it prints.

             This replaces the travelling shadow that was here before, which was
             removed outright. That layer was ambient — it asked to be noticed
             while nothing was happening, failed at it three times running, and
             its last working version left a permanent 7.3% darkening on the
             right half of the artwork as the price of being visible at all. A
             moment costs nothing once it is over.

             Why this and not something more elaborate: the artwork arrives as
             ONE FLAT JPEG. Animating the seal coming down, or the scribes'
             quills, needs the press hand and the scroll delivered as separate
             layers, which do not exist. A press reveal is the one gesture that
             works on a flat raster and still means something — the hero IS an
             engraved plate, so having it land as an impression rather than a
             fade says printed instrument rather than stock photo behind text.

             transform-origin is LEFT CENTER and that is not cosmetic. The
             background is anchored background-position:left center for the
             reasons recorded above — ink starts at 33.3% and every pixel cover
             discards has to fall on the right. Scaling from the default centre
             would slide the composition horizontally during the settle and walk
             the artwork across the type channel on the way. */
          transform-origin:left center;
          animation:clt-press 980ms cubic-bezier(.16,.84,.28,1) both;
        }
        /* The sheet comes off the plate left to right, and the 1.6% overscale
           settling to 1 is the paper releasing from the pressure. Both run on
           the same curve so the release lands with the wipe rather than after
           it. */
        @keyframes clt-press{
          from{clip-path:inset(0 100% 0 0);transform:scale(1.016)}
          to{clip-path:inset(0 0 0 0);transform:scale(1)}
        }

        /* The roller edge. Without this the wipe reads as a reveal; with it, it
           reads as something passing over the sheet and leaving ink behind.

           Deliberately ABOVE the type as well as the plate, so the whole hero is
           printed in one pass rather than the picture being printed next to type
           that was already there. pointer-events:none and it is gone in under a
           second, so nothing it crosses is ever interactive during it.

           The band carries warm ink on its trailing side and a thin bright edge
           at the very front, which is the wet highlight where a roller lifts.
           Same duration and same curve as the wipe, so the two edges travel
           locked together — any drift between them and it stops reading as one
           physical object. */
        .clt-press{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:4}
        .clt-press i{
          display:block;position:absolute;top:-2%;bottom:-2%;left:0;width:13%;
          background:linear-gradient(95deg,
            rgba(43,33,24,0) 0%,
            rgba(43,33,24,.13) 55%,
            rgba(43,33,24,.30) 86%,
            rgba(255,252,246,.34) 99%,
            rgba(255,252,246,0) 100%);
          transform:translate3d(-100%,0,0);
          will-change:transform,opacity;
          animation:clt-roller 980ms cubic-bezier(.16,.84,.28,1) both;
        }
        /* 13% wide travelling 800% of its own width. 769% is the exact figure
           that lands its trailing edge on the right edge of the frame and it
           measured one pixel short at 1905 wide; the opacity ramp hides that,
           but relying on a fade to cover a geometry error is how the arc's
           problems started. 800 clears it outright at every width. */
        @keyframes clt-roller{
          from{transform:translate3d(-100%,0,0);opacity:1}
          88%{opacity:1}
          to{transform:translate3d(800%,0,0);opacity:0}
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
        /* ---- sky: a MASKED WRAPPER around the drifting cloud layer ----
           The texture was competing with the headline. It needed to be quieter
           on the left, where the type sits, and left alone over the artwork —
           a vignette made of texture rather than colour.

           That cannot be done by masking the cloud layer itself. The clouds
           are a 400%-wide element that TRANSLATES; a mask on it would travel
           with it, so the quiet band would slide across the page instead of
           staying under the headline. The mask has to live on a wrapper that
           never moves, with the animation on a child inside it.

           Left 40% runs at 45% strength, ramping to full by 66% — the type
           channel is calm, the artwork keeps its weather, and the transition
           is wide enough that no edge is visible. */
        .clt-sky{
          position:absolute;inset:0;z-index:0;pointer-events:none;
          overflow:hidden;
          -webkit-mask-image:linear-gradient(to right,
            rgba(0,0,0,.45) 0%, rgba(0,0,0,.48) 34%,
            rgba(0,0,0,.80) 54%, rgba(0,0,0,1) 66%, rgba(0,0,0,1) 100%);
          mask-image:linear-gradient(to right,
            rgba(0,0,0,.45) 0%, rgba(0,0,0,.48) 34%,
            rgba(0,0,0,.80) 54%, rgba(0,0,0,1) 66%, rgba(0,0,0,1) 100%);
        }
        .clt-sky i{
          display:block;
          position:absolute;top:0;bottom:0;left:-150%;width:400%;
          pointer-events:none;
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
          /* CLOUD COVER, not a gradient. feTurbulence fractalNoise is the
             standard generator for this: octaves of Perlin noise summed at
             halving amplitude, which is what gives real cloud its structure at
             several sizes at once — big masses with smaller broken edges.

             That structure is the entire reason this is visible when the
             smooth wave was not. Detectability tracks spatial frequency
             CONTENT, and a single broad sinusoid has energy at exactly one
             very low frequency, the band the eye is worst at. Fractal noise
             spreads energy across four octaves, so some of it always lands
             where vision is sensitive. Same peak darkening as the wave it
             replaces; incomparably easier to see.

             baseFrequency is anisotropic, .005 across against .009 down, so
             the masses are stretched horizontally the way wind-driven cloud
             is. numOctaves 4 is the detail; seed fixes the pattern so it does
             not change between builds. stitchTiles makes the noise tileable so
             background-repeat has no seam.

             feColorMatrix zeroes RGB and drives ALPHA from the noise's red
             channel, 1.6 gain and -0.3 offset: black at varying transparency,
             which is shadow. The gain is contrast between sunlit and shaded
             ground — without it the noise is mush. Mean alpha stays near .5
             because the clamping is symmetric about it, which is what makes
             the brightness compensation predictable.

             This RASTERISES ONCE, when the background image decodes. It is a
             static bitmap thereafter and the animation only translates it, so
             there is no per-frame filter cost — unlike animating an SVG filter
             directly, which re-rasterises every frame and is why the top of
             this file rules that approach out. */
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Cfilter id='c' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005 0.009' numOctaves='4' seed='11' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.6 0 0 0 -0.3'/%3E%3C/filter%3E%3Crect width='600' height='400' filter='url(%23c)'/%3E%3C/svg%3E");
          /* Peak shade. The noise carries alpha 0-1, so this is the darkest a
             cloud shadow gets; mean cover is half that, .045, which is what
             --plate-grade brightness compensates for. The ONE number to tune
             for strength — and the reduced-motion flat value and the grade
             brightness both have to move with it.

             .18 -> .09 for the sepia plate. .18 was tuned against the crimson
             artwork, which was dark and busy enough to absorb it. This plate's
             sky is pale and FLAT — measured #E9D7C5 with nothing in it — so a
             smooth 18% modulation had nothing to hide behind and read as
             staining on the paper rather than light crossing a scene. The
             failure mode inverted completely: invisible on the old plate at
             this setting, too loud on the new one. */
          /* .16 -> .26. The note above records amplitude being raised three
             times with no reported change, and concludes amplitude was never
             the limiting term — which was right at the time, because the tile
             was still full-width and the wave sat at a spatial frequency the
             eye cannot resolve. That is fixed: the tile is now 12.5% and the
             cycle is 12s, so the modulation is inside the band vision responds
             to and amplitude finally does something. This is a raise on top of
             a working frequency, not another attempt to solve frequency with
             amplitude. */
          opacity:.26;
          /* 12.5% of a 400% layer = HALF the hero width, so two cycles cross
             the frame instead of one. This is the change that matters and it
             is the one thing the brief ruled out.

             Detectability of a luminance modulation is governed by its spatial
             frequency far more than by its amplitude. One cycle across 1551px
             put the wave near the floor of the contrast sensitivity function,
             where threshold contrast is enormous — 35 levels of 255 spread
             over 775px is 0.045 levels per pixel, which is below what the eye
             resolves no matter how the numbers are stacked. Amplitude was
             raised from an effective 0.86% to 6% to 10% to 16% with no
             reported change, because amplitude was never the limiting term.

             Halving the tile doubles the frequency and roughly halves the
             distance over which the full swing happens. "Extremely broad and
             feathered with no identifiable edge" and "visible" are not
             compatible requests: broad and feathered IS the definition of the
             frequency band the eye is worst at. Something had to give and it
             had to be the breadth. */
          background-size:12.5% 100%;
          background-repeat:repeat;
          will-change:transform;
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
          animation:clt-sun 12s linear infinite;
        }
        /* One whole tile. Any other value shows a seam at the wrap. */
        @keyframes clt-sun{
          from{transform:translate3d(0,0,0)}
          to{transform:translate3d(12.5%,0,0)}
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
        /* ---- lockup: left column, vertically centred ----
           SUPERSEDED: this was a centred block pinned to the top of the hero,
           padded down into a band of open sky. That arrangement is gone with
           the landscape plate. The crop puts its figures on the right and
           leaves paper on the left, so the type takes the left column and the
           artwork is never asked to carry a hole in its middle. Every geometry
           fight in this file — the 35% anchor, the sky-line measurements, the
           table cropping, the statue clipping — came from centring type over a
           picture. A left column removes the class of problem rather than
           tuning it.

           inset 0 with margin:auto 0 centres vertically against the full hero
           instead of hanging from the top, which is what makes it read as a
           column rather than a banner.

           SIZED IN cqw, NOT var(--u), and that is deliberate. --u is
           min(1cqw, 1.75vh), which ties type to the SHORTER of width and
           height. That was correct when the lockup sat in a band of sky whose
           depth collapsed on a short window. It is wrong now: the constraint is
           purely horizontal — how far across the plate the ink starts — so
           height must not enter into it at all. Keeping --u here would shrink
           the headline on a short window for no reason.

           Ink starts at 44% of the plate width, measured. Anchored left, the
           narrowest that lands at across 1351-2560 is 44% of the HERO width,
           at 1905. So the box stops at 42cqw, the gutter takes 5cqw, and the
           column is 37cqw with a couple of percent of slack.
           RAISING max-width PUSHES THE HEADLINE ONTO THE OPERATOR'S BACK. */
        .clt-lockup{
          position:absolute;inset:0;
          z-index:1;
          display:flex;flex-direction:column;justify-content:center;
          align-items:flex-start;text-align:left;
          padding:0 0 0 5cqw;
          /* 36cqw, down from 40. The senate plate's clear channel is not a
             straight edge — the pedestal widens as it descends, so the first
             inked pixel moves LEFT down the lockup: measured at 1440x900 it sits
             at x=598 on the eyebrow's row, 552 by the headline's last line and
             504 by the button's. 40cqw put the column's right edge at 570 and
             ran the secondary link 40px into the pedestal at 18.3% ink coverage,
             with the headline's last line clipping it by 14px.

             36cqw ends the column at 513, which clears the tightest row the
             lockup actually occupies. It is not the plate's global minimum
             (33.3cqw, set by the pedestal's foot) because the lockup never
             reaches that far down; capping there would have cost the headline
             another 43px of measure for clearance it does not need. */
          max-width:36cqw;
        }
        /* Roman caps, not mono. The mono eyebrow belonged to the terminal
           register the hero used to run in; against a serif headline it read
           as a different document. */
        .clt-eyebrow{
          display:flex;align-items:center;gap:calc(.7 * var(--u));
          font-family:var(--roman);font-weight:400;font-synthesis:none;
          text-transform:uppercase;
          font-size:clamp(9px,calc(.60 * var(--u)),18px);letter-spacing:.22em;
          color:var(--ink-warm);
        }
        .clt-eyebrow::before,.clt-eyebrow::after{content:"";width:calc(1.8 * var(--u));height:1px;background:rgba(43,33,24,.45)}
        /* One rule, trailing. The approved frame brackets the eyebrow on the
           right only; a rule on the left as well pushed the label off the
           column's left edge, so it no longer aligned with the headline, the
           subhead, the button and the stats — every other element in the
           lockup starts at the same x. Mobile already suppressed this one for
           the same reason. */
        .clt-eyebrow::before{display:none}

        /* Subhead. Newsreader because it needs LOWERCASE and Trajan has none —
           setting this in the display face would force it to caps and turn a
           sentence into a second headline. */
        .clt-sub{
          font-family:var(--text-serif);
          margin-top:calc(1.55 * var(--u));
          font-size:clamp(14px,calc(1.02 * var(--u)),21px);
          /* 30ch -> 42ch. The replacement sentence is 88 characters against the
             old 62, and at 30ch it broke into four short lines that read as a
             list. 42ch sets it as two, matching the approved frame. */
          line-height:1.5;color:#4A4035;max-width:42ch;
        }
        .clt-hero h1{
          /* 1.05 -> 1.70 var(--u), about +10px at desktop. Part of the
             deliberate-pacing pass: eyebrow, headline and CTA all gained
             separation so the lockup reads as composed rather than stacked. */
          margin-top:calc(1.70 * var(--u));
          /* Institutional, not startup. Three changes, each small:

             800 -> 700. An 800 grotesque at display size is a product-launch
             weight. 700 still carries the frame but stops shouting, and it
             lets the counters open up, which is what makes large type look
             expensive rather than loud.

             -.038 -> -.046em. Tighter tracking binds the line into a single
             mass instead of a row of words. This is the opposite of what the
             WORDMARK needed, and deliberately so: Trajan is inscriptional and
             wants air between letters, while a display grotesque set this
             large wants none.

             4.8 -> 4.62 var(--u), a 3.75% reduction in cap height. Small
             enough that impact is intact, enough that the headline stops
             crowding the sky channel now that the block sits lower.

             .855 -> .875 line-height. The old setting jammed the three lines
             into a slab; a little air between them reads as considered
             typesetting instead of a compressed logo. */
          /* 4.5cqw, and it is BIGGER than the 4.62 var(--u) it replaces, not
             smaller. That is the whole payoff of the re-render: the first crop
             put its figures at 30.5% and the type had to drop to 48px to fit
             beside them; at 44% the column is wide enough to carry 70px at
             1551 against the 61px it had while centred.

             In cqw for the same reason as the box above — the limit is
             horizontal, so height must not shrink it. The longest line, ON YOUR
             OWN, runs about 8.1px per 1px of font size, so 4.5cqw puts it at
             36.5cqw inside a 37cqw column. Anything above 4.55 overflows into
             the operator at 1905, where the clear zone is proportionally
             narrowest. */
          /* SENTENCE CASE IN THE TEXT SERIF, NOT TRAJAN CAPS.
             The approved frame sets the headline as a sentence — "Put money on
             your own deadline" — and Trajan cannot render it: the face is
             caps-only, so text-transform:uppercase was not a style choice here
             but a consequence of the family. Dropping to Newsreader is what
             makes lowercase possible, and lowercase is what makes the line read
             as a statement rather than an inscription.

             Trajan keeps the eyebrow and the wordmark, so the inscriptional
             voice is still in the composition where it belongs — on the labels,
             not on the sentence.

             Sized up from 3.95cqw: lowercase sets narrower than caps at equal
             size, so the same measure carries more type. The cap-height reads
             close to the old line while the x-height does the work. */
          font-family:var(--text-serif);font-weight:400;font-synthesis:none;
          font-size:4.55cqw;line-height:1.06;letter-spacing:-.012em;
          color:var(--ink-warm) !important;
          text-transform:none;
        }
        /* The accent span is now the same colour as the rest of the headline —
           the whole line went oxblood, so this no longer differentiates. Kept
           because the markup still carries the span, which makes restoring a
           two-tone headline a one-value change rather than a markup edit. */
        .clt-accent{color:var(--ox)}
        /* 1.95 -> 2.60 var(--u), about +10px, matching the gain above the
           headline. The gap between the two CTAs opens too, 1.43 -> 1.70, so
           the primary and secondary read as two separate decisions rather than
           a button pair. */
        .clt-cta{margin-top:calc(2.60 * var(--u));display:flex;align-items:center;gap:calc(1.70 * var(--u))}
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
        /* ---- the plate ----
           Rebuilt to read as an engraved brass plate rather than a web button.
           Palette is untouched: ox-deep fill, ox cast, paper-hi type, all
           already in the tokens. No gradient, no glow, no gloss anywhere —
           every bit of depth comes from a border, a hard-edged shadow, or the
           typography.

           FOUR LAYERS OF SHADOW, all zero-blur so the edges stay crisp:

           1. inset paper hairline, 20% — the bright bevel where a struck plate
              catches light along its inner edge. This is the single detail
              that stops it reading flat.
           2. inset ink hairline at the bottom, 22% — the opposite face of the
              same bevel, so the plate has a lit edge and a shaded one.
           3. a 1px ink ring, drawn as spread rather than a border so it does
              not add to the box and shift the CTA row.
           4. the hard cast, tightened from .315 to .26 var(--u). A shorter
              throw sits the plate closer to the paper; the old distance read
              as a floating card.

           Typography does the rest: tracking .17 -> .215em opens the mono into
           something closer to engraved capitals, and the extra padding gives
           the type a margin to sit in, the way an inscription is inset from the
           edge of the metal. */
        /* Serif caps and a RULED plate, not the offset-cast block it was. The
           cast shadow read as a UI button; a border with an inset rule reads as
           something struck. The outer edge is ox-deep and the inner hairline is
           paper at low alpha, which is the bevel a stamped plate catches. */
        .clt-btn{
          background:var(--ox);color:#F6EAD6;cursor:pointer;
          border:1px solid var(--ox-deep);
          padding:calc(1.05 * var(--u)) calc(2.40 * var(--u));
          font-family:var(--roman);font-weight:400;font-synthesis:none;
          font-size:clamp(12px,calc(.68 * var(--u)),21px);line-height:1;
          text-transform:uppercase;letter-spacing:.17em;
          display:inline-flex;align-items:center;gap:calc(1.6 * var(--u));
          box-shadow:
            inset 0 0 0 1px rgba(246,234,214,.30),
            inset 0 1px 0 0 rgba(246,234,214,.16);
          transition:background .16s ease,box-shadow .16s ease;
        }
        .clt-btn .clt-arrow{font-size:1.05em;line-height:1;transform:translateY(-.02em)}
        /* Darkens rather than moves. With the cast gone there is nothing to
           collapse, so the plate deepens a shade and the inner rule brightens
           — the same gesture as ink taking under pressure. */
        .clt-btn:hover{
          background:var(--ox-deep);
          box-shadow:
            inset 0 0 0 1px rgba(246,234,214,.40),
            inset 0 1px 0 0 rgba(246,234,214,.20);
        }
        /* Serif caps on a hairline, matching the plate. Oxblood is now reserved
           for the button alone, so the secondary action cannot be mistaken for
           a second primary. */
        .clt-link{
          background:none;border:0;cursor:pointer;color:var(--ink-warm);
          font-family:var(--roman);font-weight:400;font-synthesis:none;
          font-size:clamp(11px,calc(.62 * var(--u)),19px);line-height:1;
          text-transform:uppercase;letter-spacing:.17em;
          padding-bottom:calc(.55 * var(--u));
          border-bottom:1px solid rgba(43,33,24,.42);
        }
        .clt-link:hover{color:var(--ox)}
        .clt-btn:focus-visible,.clt-link:focus-visible{
          outline:2px solid var(--ink);outline-offset:3px;
        }

        /* ---- proof, moved into the column ----
           These figures used to live only in the strip below the fold, so at
           scroll-top the one piece of social proof on the page was invisible.
           They also give the column a fourth element and some mass, which is
           what stops a headline and two buttons floating against an engraving
           this dense. Removed from the strip in the same change — the same
           numbers printed twice on one screen reads as a mistake.

           A rule above rather than a box around it: the column already has
           enough shapes, and a hairline reads as a ledger entry, which is the
           right register for a figure like this. */
        /* The figures lead, the labels recede. They read as an afterthought
           when both sat at the same weight — the numeral is the fact, the
           label is only telling you what it counts, so the label drops to a
           lighter warm grey and the numeral takes the size and the ink. More
           air above and between, so it is a third block rather than a line
           tacked under the buttons. */
        .clt-proof{
          margin-top:calc(2.90 * var(--u));
          padding-top:calc(1.45 * var(--u));
          border-top:1px solid rgba(43,33,24,.18);
          display:flex;align-items:flex-start;flex-wrap:wrap;
          gap:calc(.7 * var(--u)) calc(3.0 * var(--u));
          font:400 clamp(8.5px,calc(.46 * var(--u)),12px)/1.5 ui-monospace,Menlo,monospace;
          letter-spacing:.16em;color:rgba(43,33,24,.52);
        }
        .clt-proof b{
          display:block;font-weight:400;color:var(--ink-warm);
          font-family:var(--roman);font-synthesis:none;
          font-size:2.35em;letter-spacing:.01em;line-height:1.05;
          margin-bottom:calc(.28 * var(--u));
          font-variant-numeric:tabular-nums;
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
          /* SUPERSEDED: this pulled up -44px so the strip peeked above the fold
             and the escrow figure was visible at scroll-top. The sepia plate
             makes that unaffordable. Its table and everything on it — coins,
             scroll, seal, the actual subject of the picture — sit in the bottom
             20% of the file, and the strip was parked directly over them.

             Measured at 1562x741: the table had 50px visible with the overlap
             and 94px without. The anchor cannot buy that back, because anchor
             is zero-sum — moving it from .35 to .55 gains 24px of table and
             costs 25px of headline clearance, which goes negative. Dropping
             the overlap gains 44px for nothing.

             So the proof numbers move below the fold again. The artwork's
             subject beats the social proof; the strip is one scroll away. */
          margin-top:0;
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
        /* NARROW-ASPECT DESKTOP FALLBACK.
           The wide canvas is 2.6:1. cover keeps it honest while the window is
           wider in ratio than the artwork, but on a tall desktop window — a
           square-ish 1280x1024, a rotated display — cover on a 2.6 plate scales
           by width and the clear channel formula goes NEGATIVE: at A=1.2 the
           first inked pixel lands left of x=0 and the entire lockup sits on the
           figures.

           So below 3/2 the ORIGINAL 1536x1024 plate comes back with contain,
           which is what it was doing correctly before the wide canvas existed.
           At these ratios contain fits the WIDTH, so the surplus is a band
           above the artwork and there is no flat panel beside it — the seam the
           wide plate was built to solve cannot occur here.

           min-width guards the mobile block below, which owns everything at
           820px and narrower and must not be caught by this. */
        /* ULTRAWIDE GUARD.
           The frame plate is 1.726, so on anything wider cover scales by WIDTH
           — which is the point, it is what holds the artwork's size — and the
           surplus is vertical. That is affordable up to a point: the content
           that matters runs from the heads at y=97 to the pedestal's face at
           about y=820, and the crop only starts eating it once
           boxW/1767 > boxH/820, i.e. beyond A = 2.155. At 3440x1080 the table
           and the seal would be gone entirely.

           So past 2.2 the 2.6 canvas takes over, where the scale goes back to
           height-based and nothing is cropped. The artwork reads smaller there,
           which is the trade — on a 3440 display there is no framing that keeps
           it both large and whole. */
        @media (min-width:821px) and (min-aspect-ratio:11/5){
          .clt-hero::before{
            background-image:url(/assets/images/collateral-senate-wide.jpg);
          }
        }

        @media (min-width:821px) and (max-aspect-ratio:3/2){
          .clt-hero::before{
            background-image:url(${PLATE_NARROW});
            background-size:contain;
            background-position:right bottom;
          }
        }

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
          /* NO ASPECT LOCK, NO PORTRAIT PLATE, NO SYNTHESISED SKY.
             Every mobile plate before this was a portrait canvas with sky
             painted above the figures, and each one failed the same way: the
             sky share never matched what the lockup needed, so the CTA landed
             on the scribe. The last portrait measured 36% sky against 55%
             required.

             The sky was never the artwork's job. The type sits on PAPER, and
             the section already has paper. So the hero is a plain paper panel
             with the figure crop anchored to its bottom edge — which is also
             exactly what the approved mockup shows. There is no join to blend
             because there is no synthesised region: the artwork's own ground
             meets the section's background-color, and those are matched. */
          .clt-hero{
            height:100vh;
            height:100svh;
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
            background-image:url(/assets/images/collateral-senate-mobile.jpg) !important;
            /* 100% auto, NOT cover and NOT 100% 100%. The crop keeps its own
               1.041 ratio, so it is never stretched and never cropped — the
               full group is always visible, at every phone width. */
            background-size:100% auto;
            background-position:center bottom;
            /* The artwork's own paper, sampled from its top corners. It sits
               UNDER the image on the same element, so --plate-grade treats both
               identically and the panel above the figures cannot drift to a
               different tone than the figures' own ground. That match is the
               only thing standing in for the sky that used to be painted in. */
            /* Sampled from the senate plate's own clear top-left corner, mean of
               a 292x112 block: rgb(238,214,175). The previous artwork's paper
               was #F0D6AF, two points off on red — near enough that the join was
               invisible either way, but this is the measured value for the plate
               actually on screen, so the panel and the artwork's ground are the
               same colour by derivation rather than by luck. */
            background-color:#EED6AF;
          }
          /* 96 -> 76px top padding. The extra sky in the portrait plate does
             most of the work, but the mobile lockup is fixed px while the hero
             scales with viewport WIDTH, so a narrow-and-short phone gets the
             least sky and the same tall lockup. At 360x740 the clearance was
             +3px with 96; 76 makes it +23px and every larger phone gains 20px
             with it. Still clears the 64px header by 12px. */
          /* Mobile stays CENTRED AND TOP-ANCHORED. The desktop rule above turns
             the lockup into a left column because the landscape crop puts its
             figures on the right; the portrait plate is composed the old way,
             sky on top and figures below, so it needs the old arrangement. Every
             property the desktop rule sets has to be undone explicitly —
             justify-content, align-items, text-align, padding and max-width —
             or the phone gets a narrow left column against a full-width plate. */
          /* LEFT-ALIGNED and top-anchored, matching the approved mockup and the
             desktop column. Centred type was a consequence of the old portrait
             plate, where the lockup floated in a band of sky; on a paper panel
             there is no reason for it, and left-aligning puts mobile in the same
             voice as desktop and as the rest of the site. */
          .clt-lockup{
            position:absolute;inset:0 0 auto 0;
            justify-content:flex-start;align-items:flex-start;text-align:left;
            padding:76px 22px 0;max-width:none;z-index:1;
          }
          /* The eyebrow's flanking rules are a centred device. Drop the leading
             one so the label starts flush with the headline's left edge. */
          .clt-eyebrow::before{display:none}
          .clt-eyebrow{font-size:9px;gap:8px;letter-spacing:.18em}
          .clt-eyebrow::before,.clt-eyebrow::after{width:20px;height:2px}
          /* src/mobile.css:521 forces h1 to clamp(24px,7vw,36px) !important for
             every view at max-width 768px, which beats a scoped rule. The extra
             .clt and the !important below exist only to win that cascade — the
             VALUE is exactly as authored, unconverted. */
          .clt .clt-hero h1{margin-top:14px;font-size:clamp(26px,7.2vw,34px) !important;line-height:1.06 !important;letter-spacing:.02em !important}
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
          /* Same treatment for the press, and it MUST be explicit. The plate's
             first keyframe is clip-path:inset(0 100% 0 0) — fully hidden — so
             simply cancelling the animation would leave a reduced-motion visitor
             looking at no artwork at all, permanently. Land it on the last frame
             instead. The roller is a one-second event with nothing to freeze, so
             it just goes. */
          .clt-hero::before{
            animation:none !important;
            clip-path:none !important;
            transform:none !important;
          }
          .clt-press{display:none !important}
          /* The sweep is continuous and never stops, which is exactly what a
             reduced-motion request is about, so the MOTION goes. The layer
             does not: it is replaced with a flat, unanimated 8% black.

             4.5% is not a taste value, it is the mean cloud cover. The noise
             carries alpha 0-1 with a mean near .5, scaled by the layer's .09
             opacity, so average shade is .045 — and --plate-grade carries its
             brightness purely to compensate for that average. A flat 4.5% puts
             a reduced-motion viewer on the same composited tone everyone else
             averages. It halved when the cloud opacity halved; these two and
             the grade brightness are one set of three and never move alone.

             SUPERSEDED, and this was a real bug: the rule was display:none.
             Removing the layer removes the darkening but NOT the 1.152 that
             exists to offset it, so a reduced-motion visitor got the plate
             8.7% brighter than everyone else — a washed-out engraving, as a
             direct consequence of asking for less motion. Two values that only
             make sense together, and one of them was being switched off alone.

             SUPERSEDED EARLIER: opacity .78 with the animation cancelled.
             Cancelling an animation pins the element at its first frame, and
             the first frame of this wave is its trough, so that parked a fixed
             dark band across the engraving permanently.

             Flat colour, no gradient, so there is no band at any position. */
          .clt-sky i{
            animation:none !important;
            transform:none !important;
            background-image:none !important;
            background-color:rgba(0,0,0,.08) !important;
            opacity:1 !important;
          }
        }
        </style>

        <div class="clt">
            <section class="clt-hero" style="--clt-plate:url(${plateSrc});" data-plate="${PLATE_W}x${PLATE_H}">
                <div class="clt-sky" aria-hidden="true"><i></i></div>
                <div class="clt-press" aria-hidden="true"><i></i></div>
                <div class="clt-lockup">
                    <div class="clt-eyebrow clt-mono clt-in" style="--d:60ms">SELF-ENFORCING PERFORMANCE CONTRACTS</div>
                    <h1><span class="clt-line" style="--d:150ms">Put money</span><br /><span class="clt-line" style="--d:240ms">on your own</span><br /><span class="clt-line" style="--d:330ms"><span class="clt-accent">deadline</span></span></h1>
                    <p class="clt-sub clt-in" style="--d:400ms">Stake your own money on a goal. Hit the deadline and you keep it &mdash; miss it, and it&rsquo;s gone.</p>
                    <div class="clt-cta clt-in" style="--d:520ms">
                        <button type="button" class="clt-btn"${onWriteContract ? ` onclick="${onWriteContract}"` : ''}>Create a contract <span class="clt-arrow">&rarr;</span></button>
                        <button type="button" class="clt-link"${onWatchFlow ? ` onclick="${onWatchFlow}"` : ''}>See how it works &darr;</button>
                    </div>
                    <div class="clt-proof clt-mono clt-in" style="--d:600ms">
                        <span><b>${escapeHtml(heldInEscrow)}</b>HELD IN ESCROW</span>
                        <span><b>${escapeHtml(String(settledCount))}</b>SETTLED TODAY</span>
                    </div>
                </div>
            </section>

            <div class="clt-strip clt-mono">
                <span>ORACLES <b>STRIPE · YOUTUBE · SHOPIFY</b></span>
                <span>VERIFICATION IS AUTOMATIC · <b>NO APPEALS</b> · <b>NO EXTENSIONS</b></span>
            </div>

        </div>
    `;
}
