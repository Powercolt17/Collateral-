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
 * The contract document that floats over the engraving.
 *
 * THE ICONS ARE DRAWN HERE, not imported. Every icon set on the shelf —
 * Lucide, Feather, Heroicons — is a 2px-stroke grotesque geometry built to sit
 * next to a sans-serif UI, and dropping one into this card is the single
 * fastest way to make an heirloom document look like a settings page. These are
 * cut for the card: 1.4 stroke on a 17px glyph inside a 38px ring, drawn in
 * oxblood, each with a hairline inner ring so the medallion has TWO edges the
 * way struck metal does rather than the one edge a filled circle has.
 *
 * The temple is the same facade as the section emblems, reduced to the lines
 * that survive at 17px: pediment, entablature, four columns, stylobate. The
 * target is a dial with four cardinal ticks rather than a bullseye. Shield,
 * link and clock are conventional because those three ideas have conventional
 * signs and inventing new ones would cost comprehension for nothing.
 *
 * Values are literal on purpose. This is a specimen contract — a worked
 * example on the page, not a live figure — and wiring it to data would imply
 * otherwise.
 */
function renderContractDoc() {
    const corner = '<span class="clt-doc-corner clt-doc-c{N}" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M.8 6.2V.8h5.4"/><path d="M3.2 3.2h2.4M3.2 3.2v2.4"/></svg></span>';
    const corners = [1, 2, 3, 4].map((n) => corner.replace('{N}', String(n))).join('');

    return `
                <aside class="clt-doc-wrap" aria-label="Specimen performance contract">
                    <article class="clt-doc">
                        ${corners}
                        <div class="clt-doc-in">
                            <div class="clt-doc-head">
                                <div class="clt-doc-kicker">Performance Contract</div>
                                <div class="clt-doc-live"><i aria-hidden="true"></i>Live</div>
                            </div>

                            <div class="clt-doc-div" aria-hidden="true">
                                <span><i></i><b></b><i></i></span>
                            </div>

                            <h3 class="clt-doc-title">Stripe Revenue Growth</h3>
                            <div class="clt-doc-verified">
                                Verified by <b>Stripe API</b>
                                <span class="clt-doc-stripe" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg></span>
                            </div>

                            <div class="clt-doc-rows">
                                <div class="clt-doc-row">
                                    <span class="clt-doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.2 3.8 8.4h16.4z"/><path d="M4.8 10.4h14.4"/><path d="M6.8 10.4v6.8M10.27 10.4v6.8M13.73 10.4v6.8M17.2 10.4v6.8"/><path d="M4.8 17.2h14.4M3.4 19.8h17.2"/></svg></span>
                                    <span class="clt-doc-lab">Stake</span>
                                    <span class="clt-doc-val">$250.00</span>
                                </div>
                                <div class="clt-doc-row">
                                    <span class="clt-doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.4"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none"/><path d="M12 2.2V4M12 20v1.8M2.2 12H4M20 12h1.8"/></svg></span>
                                    <span class="clt-doc-lab">Target</span>
                                    <span class="clt-doc-val">+20%<small>in 30 days</small></span>
                                </div>
                                <div class="clt-doc-row">
                                    <span class="clt-doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l6.4 2.3v5.1c0 4.1-2.7 7.2-6.4 8.6-3.7-1.4-6.4-4.5-6.4-8.6V5.3z"/><path d="M12 6.4l3.9 1.4v3.3c0 2.6-1.6 4.6-3.9 5.5-2.3-.9-3.9-2.9-3.9-5.5V7.8z"/></svg></span>
                                    <span class="clt-doc-lab">Multiplier</span>
                                    <span class="clt-doc-val">4.0&times;</span>
                                </div>
                                <div class="clt-doc-row">
                                    <span class="clt-doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10.4 13.6a3.7 3.7 0 0 0 5.3 0l2.5-2.5a3.7 3.7 0 1 0-5.3-5.3l-1.4 1.4"/><path d="M13.6 10.4a3.7 3.7 0 0 0-5.3 0l-2.5 2.5a3.7 3.7 0 1 0 5.3 5.3l1.4-1.4"/></svg></span>
                                    <span class="clt-doc-lab">Verification</span>
                                    <span class="clt-doc-val is-mono">Stripe API</span>
                                </div>
                                <div class="clt-doc-row">
                                    <span class="clt-doc-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.6"/><path d="M12 7.4V12l3.1 1.9"/></svg></span>
                                    <span class="clt-doc-lab">Settlement</span>
                                    <span class="clt-doc-val">Auto<small>on deadline</small></span>
                                </div>
                            </div>

                            <div class="clt-doc-out">
                                <div class="clt-doc-o clt-doc-o-win">
                                    <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 18V7"/><path d="M7.4 11.6 12 7l4.6 4.6"/></svg></i>
                                    <span class="clt-doc-o-t">Hit target<small>You get</small></span>
                                    <span class="clt-doc-o-v">+$1,000.00</span>
                                </div>
                                <div class="clt-doc-o clt-doc-o-lose">
                                    <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 6v11"/><path d="M16.6 12.4 12 17l-4.6-4.6"/></svg></i>
                                    <span class="clt-doc-o-t">Miss target<small>You lose</small></span>
                                    <span class="clt-doc-o-v">&minus;$250.00</span>
                                </div>
                            </div>

                            <div class="clt-doc-foot">
                                <span><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9"/></svg> Funds held in escrow</span>
                                <em aria-hidden="true"></em>
                                <span><svg viewBox="0 0 24 24"><path d="M4 12.6 9.4 18 20 6.6"/></svg> Auto-settled</span>
                            </div>
                        </div>
                    </article>
                </aside>`;
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
          /* REFINEMENT PASS — the artwork steps back so the headline leads.
             The brief specified contrast(.92) saturate(.9) brightness(1.02) as
             absolute values, but those were written against an ungraded image.
             This plate already carries a measured grade, and going straight to
             saturate(.9) would have thrown away a deliberate correction: the
             senate plate reads flat without the 1.12 lift above.

             So the brief's FACTORS are composed onto what was already here
             rather than replacing it — 1.12 x .90 = 1.01, 1.02 x .92 = .94,
             1 x 1.02 = 1.02. Same intent (about 10% less local contrast, a
             slight desaturation, a touch lighter) without discarding the
             earlier measurement. The wax seal ends up the most saturated thing
             on the page by being the only thing not pulled down. */
          --plate-grade:saturate(1.01) contrast(.94) brightness(1.02);
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
          /* Clips the 0.6% the breathing animation pushes past the right edge.
             Without it the scaled ::before overhangs the section and lands on
             the proof strip below. */
          overflow:hidden;
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
          /* ── RECOMPOSED: THE SCENE SLIDES RIGHT ────────────────────────────
             The card was landing on the standing figure instead of the table,
             so the artwork moves out from under it. 12cqw, NOT the 18-22% the
             brief asked for, and the number is set by the wax seal.

             MEASURED off collateral-senate-frame.jpg (1767x1024): the seal sits
             at x=1496, which is 271px from the image's right edge. At 1512x945
             cover scales the plate by .923 and anchors it right, so the seal
             renders at screen x=1262. A 20% shift is 302px and puts it at
             1564 — past a 1512 viewport, gone. The same brief requires the seal
             to stay visible, so 20% cannot be right; it was written without the
             image's geometry to hand.

             13cqw is 195px at 1497 and lands the seal at 1441, clear of the
             card's right edge by 19px — it reads as peeking out from behind the
             document rather than being buried by it. That is the largest shift
             this composition affords.

             cqw and not px, so the shift is the same fraction of the hero at
             every width. A fixed offset would let the seal drift back under the
             card on wide screens.

             Sliding right exposes fill down the LEFT — 89px at 1512 — and that
             costs nothing. The plate's left third is blank paper, measured at
             #EBD3AB against this fill's #EED6AF: three values apart per
             channel. Both sit under --plate-grade on this element, so they are
             graded together and meet without a seam. That is the same reason
             the fill was put here in the first place. */
          background-position:calc(100% + 13cqw) top;
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
          /* clt-breathe is a second animation on the SAME list rather than a
             duplicate rule inside a prefers-reduced-motion:no-preference block.
             The brief asked for the no-preference wrapper, but honouring that
             literally would mean restating the clt-press shorthand in two
             places, and duplicated declarations in this file have shipped three
             separate bugs. The reduce block further down already kills both
             with animation:none !important and transform:none !important, so
             the guarantee the wrapper exists to provide is met either way.

             Scaling from LEFT CENTER is what makes this safe: the origin is
             already pinned there for the press, so the artwork grows to the
             right and the type column never moves. The 0.6% overflow is
             clipped by overflow:hidden on the section. */
          animation:
            clt-press 980ms cubic-bezier(.16,.84,.28,1) both,
            clt-breathe 14s ease-in-out 980ms infinite alternate;
        }
        /* SCRIM. The headline has to be read before the illustration is, and on
           a plate this busy that cannot be won with type alone — the figures
           have to be given something to fall back behind.

           THE STOPS ARE NOT THE ONES IN THE BRIEF, and the brief's own guardrail
           is why. It specified full strength to 26%, .55 at 46% and clear by
           64%. Measured on collateral-senate-frame.jpg, the first sustained ink
           in the band the headline occupies starts at 41.9% of the plate width,
           and the type column runs from 5% to 41%. The brief's ramp is only
           about 64% opaque where the longest headline line ends, so the leading
           figure's arm would have surfaced directly behind it.

           Holding .86 out to 44% covers the whole column and the first ink
           behind it, then falling to zero by 70% leaves the faces, the scroll
           and the seal completely untouched. The artwork loses nothing that
           matters; it loses the edge that was competing with the type.

           Three layers, one element: the top fade dissolves the figures into
           paper along the upper edge, the radial sits on the wax seal at
           68% 78% and quietly darkens everything away from it, and the
           left-to-right ramp is the scrim proper. Alpha only — no blend mode,
           because a blend here would reach past the hero. */
        .clt-hero::after{
          content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
          background:
            linear-gradient(180deg,
              rgba(239,230,210,.50) 0%,
              rgba(239,230,210,0) 22%),
            radial-gradient(120% 90% at 68% 78%,
              rgba(239,230,210,0) 40%,
              rgba(239,230,210,.35) 100%),
            linear-gradient(90deg,
              rgba(239,230,210,.96) 0%,
              rgba(239,230,210,.93) 28%,
              rgba(239,230,210,.86) 44%,
              rgba(239,230,210,.45) 56%,
              rgba(239,230,210,0) 70%);
        }
        /* AMBIENT SWEEP. Sits on .clt-sky::after so it inherits that layer's
           left-to-right mask, which keeps it off the type column for free. New
           element with nothing but this animation on it, so the brief's
           no-preference wrapper costs nothing here and is used as written. */
        .clt-sky::after{
          content:"";position:absolute;inset:-20% -40%;
          pointer-events:none;
          background:radial-gradient(38% 60% at 50% 45%,
            rgba(255,249,235,.9) 0%, rgba(255,249,235,0) 70%);
          opacity:.05;
        }
        @media (prefers-reduced-motion:no-preference){
          .clt-sky::after{animation:clt-drift 30s ease-in-out infinite alternate}
        }
        @keyframes clt-drift{
          from{transform:translate3d(-18%,0,0)}
          to{transform:translate3d(18%,0,0)}
        }
        /* 1.000 -> 1.006. Any more and it stops being weather and starts being
           a zoom, which the brief rules out explicitly. */
        @keyframes clt-breathe{
          from{transform:scale(1)}
          to{transform:scale(1.006)}
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
          /* THE OFFSET IS PINNED IN PIXELS, AND THAT IS THE FIX FOR THE VERTICAL
             STREAKING. This was left:-150%;width:400%, and a percentage of an
             odd viewport width lands on a half pixel: -150% is -562.5 at 375,
             -589.5 at 393, -2326.5 at 1551. The tile is 600px at its native
             size, so every tile boundary inherited that half pixel, and the
             browser resampled across each seam and drew a line down the plate.
             It looked intermittent because it depends entirely on whether the
             viewport width happens to be even — 360, 390 and 414 are clean,
             375 and 393 are not.

             -1200px is an exact multiple of the 600px tile, so boundaries fall
             on integers at EVERY width. The travel is already an integer 600px,
             so the alignment holds through the whole animation rather than only
             at the start.

             The width has to grow with it: calc(100% + 2400px) spans from
             -1200 to viewport+1200, which still covers the frame after the
             600px translate. 400% no longer would, because the offset is now
             fixed while 400% shrinks with the viewport. */
          position:absolute;top:0;bottom:0;left:-1200px;width:calc(100% + 2400px);
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
          /* 600px, NOT 12.5% — and this is a seam fix, not a tuning change.
             12.5% of a 400%-wide layer makes the tile exactly half the hero
             width, and every tile boundary showed as a hard vertical line down
             the artwork. On a 390px phone that put visible seams roughly 195px
             apart, which is exactly the spacing they were reported at.

             The noise itself is fine: feTurbulence carries stitchTiles=stitch,
             so it IS seamless at its own edges. What broke it was scaling. A
             percentage size resamples the 600x400 source to a fractional pixel
             width, and the tile joins then land off the pixel grid, so the
             browser blends each edge against its neighbour and draws a line.

             Pinning the horizontal axis to the source's native 600px puts every
             join on an integer boundary and lets stitchTiles do its job. The
             vertical axis stays 100% — stretching only the height cannot
             disturb a horizontal seam, and it stops the tile repeating
             downward, which would have added horizontal seams on a hero this
             tall. */
          background-size:600px 100%;
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
             harder to compensate for. One animation, one job.

             12s -> 18s, because the travel is now an absolute distance rather
             than a share of the viewport, and the two cannot both be preserved.
             The old percentage moved the layer half the hero width per cycle:
             about 65px/s on a 1551px desktop but only 16px/s on a 390px phone,
             so the same declaration produced a four-to-one difference in
             apparent speed. 600px over 18s is 33px/s on every device — slower
             than desktop was, faster than mobile was, and identical across
             them. The rate is deliberately kept well above the 30s case argued
             against above, which was slow enough to read as static.

             (The paragraph above this one argues for 14s while the declaration
             said 12s. The comment was stale; this is what actually ships.) */
          animation:clt-sun 18s linear infinite;
        }
        /* EXACTLY ONE TILE, and the tile is now 600px rather than 12.5%, so
           this must be 600px too. Any other value shows a seam at the wrap —
           the wrap is only invisible because the layer lands on a position
           identical to where it started. */
        @keyframes clt-sun{
          from{transform:translate3d(0,0,0)}
          to{transform:translate3d(600px,0,0)}
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
          /* 1 -> 2. The scrim now occupies z-index:1 between the artwork and
             the type, which is the whole point of it. */
          z-index:2;
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
          font-size:clamp(14px,calc(1.02 * var(--u)),21px);
          /* 30ch -> 42ch -> 56ch. At 30ch the sentence broke into four short
             lines that read as a list; 42ch set it as two. 56ch puts the
             measure in the 55-65 character range the brief asked for, which is
             where a text serif is most comfortable. At the 36cqw column that
             still resolves to roughly 400px, so it cannot reach the figures —
             the scrim holds to 44% and the column ends at 41%. */
          line-height:1.5;color:#4A4035;max-width:56ch;
        }
        /* h1 -> paragraph = 22px, and it needs the extra .clt to get there.
           Set inside .clt-sub above, this ONE declaration silently lost while
           every other property in the same rule applied — max-width:56ch landed
           at 473px on the live page while margin-top computed to 0. That
           asymmetry is the tell: something global targets the margin of a <p>
           at higher specificity than a single class, so it beats margin-top and
           leaves the rest alone. .clt .clt-sub is two classes and wins outright.
           The mobile override below is raised to match, or it would lose to
           this instead. */
        .clt .clt-sub{margin-top:clamp(13px,1.42cqw,22px)}
        .clt-hero h1{
          /* 1.05 -> 1.70 var(--u), about +10px at desktop. Part of the
             deliberate-pacing pass: eyebrow, headline and CTA all gained
             separation so the lockup reads as composed rather than stacked. */
          /* SPACING RHYTHM: eyebrow -> h1 = 24px at desktop. cqw keeps it fluid;
             the clamp stops it collapsing on small containers or running away
             on very wide ones. */
          margin-top:clamp(14px,1.55cqw,24px);
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
          /* Stronger, NOT bigger — the size is untouched at 4.55cqw.
             400 -> 500 on Newsreader's variable weight axis (index.html requests
             400..700, so this is a real instance, not a synthesised one).
             1.06 -> .98 line-height binds the three lines into one mass.
             -.012 -> -.005em: the tighter tracking was compensating for a
             lighter weight, and at 500 it closed the counters up.
             --ink-warm #2B2118 -> #1C160E for more bite against the scrim. */
          font-family:var(--text-serif);font-weight:500;font-synthesis:none;
          font-size:4.55cqw;line-height:.98;letter-spacing:-.005em;
          color:#1C160E !important;
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
        /* paragraph -> buttons = 32px. */
        .clt-cta{margin-top:clamp(20px,2.06cqw,32px);display:flex;align-items:center;gap:calc(1.70 * var(--u))}
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
          /* Lighter edge. The solid --ox-deep border drew a hard line around
             the shape; at .5 alpha it reads as the edge of a pressed wax slab
             rather than a UI stroke. */
          border:1px solid rgba(101,21,34,.5);
          /* ~18px top and bottom, min-height 56px — the button was the one
             element still sized like a form control. */
          padding:clamp(14px,1.16cqw,18px) calc(2.40 * var(--u));
          min-height:56px;box-sizing:border-box;
          font-family:var(--roman);font-weight:400;font-synthesis:none;
          font-size:clamp(12px,calc(.68 * var(--u)),21px);line-height:1;
          text-transform:uppercase;letter-spacing:.17em;
          display:inline-flex;align-items:center;gap:calc(1.6 * var(--u));
          /* Depth without a UI drop-shadow. The inset highlight is the lit top
             edge of a poured slab; the outer shadow is wide, soft and tinted
             oxblood rather than grey, so it reads as the object sitting in the
             page rather than floating above it. */
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            inset 0 0 0 1px rgba(246,234,214,.22),
            0 8px 22px rgba(101,21,34,.18);
          transition:all 220ms ease-out;
        }
        .clt-btn .clt-arrow{
          font-size:1.05em;line-height:1;transform:translateY(-.02em);
          transition:transform 220ms ease-out;
        }
        .clt-btn:hover .clt-arrow{transform:translate(5px,-.02em)}
        /* Darkens rather than moves. With the cast gone there is nothing to
           collapse, so the plate deepens a shade and the inner rule brightens
           — the same gesture as ink taking under pressure. */
        .clt-btn:hover{
          background:var(--ox-deep);
          /* Lifts 1px. The earlier note argued against movement because the
             old cast shadow had nothing to collapse into; with a real ambient
             shadow underneath there is now somewhere to lift FROM, and the
             shadow deepens with it. */
          transform:translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.14),
            inset 0 0 0 1px rgba(246,234,214,.34),
            0 12px 28px rgba(101,21,34,.24);
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
          /* buttons -> metrics = 40px, the largest gap in the stack. The rhythm
             widens as it descends so the column reads as deliberate rather
             than evenly stacked. */
          margin-top:clamp(26px,2.58cqw,40px);
          padding-top:clamp(12px,1.45cqw,20px);
          border-top:1px solid rgba(60,48,30,.18);
          display:flex;align-items:stretch;flex-wrap:nowrap;
          /* 40px minimum between the two cells, per the brief. */
          gap:0 clamp(28px,2.58cqw,40px);
          /* The label leaves ui-monospace for the display serif. A monospace
             caption on an engraved plate was the one element still reading as
             software. 10px / .24em / 600 is the certificate idiom: small,
             widely tracked, and set solid rather than faint.

             THE COLOUR GOES UP, NOT DOWN — .52 -> .72. The brief said not to
             reduce it further and it was right, but the value was already
             failing: rgba(43,33,24,.52) measures 2.96:1 on this ground, under
             the 4.5:1 AA floor for text this size. .72 measures 5.67:1 over
             the scrim. Strengthening it is the accessibility fix AND the
             design one. */
          font:600 clamp(9px,.65cqw,10px)/1.5 var(--roman),Georgia,serif;
          font-synthesis:none;
          text-transform:uppercase;
          letter-spacing:.24em;color:rgba(43,33,24,.72);
        }
        /* The vertical divider. Two cells on a shared rule, which is what makes
           it read as one engraved line rather than two floating numbers. */
        .clt-proof span{display:block}
        .clt-proof span + span{
          border-left:1px solid rgba(60,48,30,.18);
          padding-left:clamp(28px,2.58cqw,40px);
        }
        .clt-proof b{
          display:block;font-weight:500;color:var(--ink-warm);
          /* Cormorant Garamond, already loaded in index.html at 400/500/600, so
             this costs no new asset. Trajan has no lowercase and no true
             oldstyle figures; Cormorant is the certificate face and its numerals
             sit properly on the baseline at this size. */
          font-family:"Cormorant Garamond",Georgia,serif;font-synthesis:none;
          font-size:clamp(24px,1.94cqw,30px);
          letter-spacing:.005em;line-height:1;
          margin-bottom:clamp(5px,.52cqw,8px);
          /* Tabular so the two cells align on the baseline and the digits do
             not shift when the live numbers change. */
          font-variant-numeric:tabular-nums lining-nums;
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
        /* ORACLE BAND. Replaces the two-line text strip. Same position in the
           document and the same job — naming the sources that decide outcomes —
           but the brands are shown rather than listed.

           Namespaced to clt-. The supplied sheet styles bare *, body, .band,
           .inner, .logo and .name; this ships in the same document as the hero
           and the ledger, so pasted as authored it would restyle both.

           width:1440px in the sheet becomes width:100% with the max-width moved
           onto the inner element, or the band would refuse to fill the viewport
           and would overflow below 1440. */
        .clt-strip{
          position:relative;z-index:3;
          margin-top:0;
          background:linear-gradient(180deg,#ECE1C7 0%,#E9DDC0 100%);
          border-top:1px solid rgba(60,48,30,.16);
          border-bottom:1px solid rgba(60,48,30,.16);
        }
        /* Printed-paper tooth. 5px dot grid at 5% — it is what stops the
           gradient reading as a flat CSS panel between two engravings. */
        .clt-strip::before{
          content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
          background-image:radial-gradient(rgba(90,70,40,.05) 1px,transparent 1px);
          background-size:5px 5px;
        }
        .clt-strip-in{
          max-width:1160px;margin:0 auto;
          padding:32px 90px 30px;text-align:center;position:relative;
        }
        .clt-strip-eyebrow{
          font-family:var(--text-serif);
          font-size:10px;letter-spacing:.42em;text-transform:uppercase;
          color:#9A8C6F;font-weight:600;margin-bottom:24px;
        }
        .clt-oracles{display:flex;align-items:center;justify-content:center;gap:30px;flex-wrap:wrap}
        .clt-live{
          display:inline-flex;align-items:center;gap:9px;
          font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          font-size:11px;letter-spacing:.2em;text-transform:uppercase;
          color:#5B5140;font-weight:500;transform:translateY(-8px);
        }
        /* Optical, not structural: the label centres against the marks rather
           than the marks plus their captions. */
        .clt-dot{width:7px;height:7px;border-radius:50%;background:#5F7D4F;flex:none}
        .clt-vline{width:1px;height:44px;background:rgba(60,48,30,.16);margin:0 8px}

        .clt-logos{display:flex;align-items:flex-start;gap:52px;flex-wrap:wrap;justify-content:center}
        .clt-logo{
          display:flex;flex-direction:column;align-items:center;gap:12px;
          color:#3B3223;transition:color .2s ease;
        }
        .clt-mark{height:30px;display:flex;align-items:center;justify-content:center}
        .clt-mark svg{width:auto;fill:currentColor;display:block}
        .clt-name{
          font-family:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          font-size:10px;letter-spacing:.22em;text-transform:uppercase;
          color:#9A8C6F;font-weight:500;
        }
        .clt-logo:hover{color:#211B12}
        .clt-logo:hover .clt-name{color:#5B5140}

        /* Optically balanced per brand — the three marks have different cap
           heights and set at one size the wordless glyphs read at three
           different weights. */
        .clt-logo-stripe  .clt-mark svg{height:23px}
        .clt-logo-youtube .clt-mark svg{height:19px}
        .clt-logo-shopify .clt-mark svg{height:29px}
        .clt-logo-x       .clt-mark svg{height:20px}
        /* Plaid's symbol is a filled SQUARE of diamonds, where the siblings are
           open letterforms and glyphs. A square carries more ink per pixel of
           height than an S or a play button, so it is set below Stripe's 23 to
           keep the row reading at one weight. NOT optically confirmed — this
           pane cannot screenshot, so 24 is the brief's suggested figure and the
           reasoning for going near it rather than a measurement. Adjust by eye. */
        .clt-logo-plaid   .clt-mark svg{height:24px}

        /* The placeholder monogram tile and its rules are GONE, replaced by
           Plaid's own mark. See the note on the markup for where the file came
           from and what was and was not changed. */
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
        /* THE DESKTOP PLATE URL LIVES IN A DESKTOP-ONLY QUERY, AND THAT IS A
           PERFORMANCE FIX, NOT TIDYING.

           It used to arrive as an inline custom property on the section:
           style="--clt-plate:url(...)". Chrome resolves url() inside a custom
           property as soon as the property is DECLARED, not when it is used, so
           every phone downloaded the 406KB desktop plate on top of the 335KB
           mobile one — measured on the live page, initiatorType css, while the
           computed background-image resolved to the mobile crop alone. 406KB of
           a 741KB image payload, fetched to be thrown away.

           Declared inside min-width:821px, the property does not exist at all
           on a phone, so there is nothing to resolve and nothing to fetch. The
           mobile rule sets its own background-image directly and never referred
           to this variable. */
        @media (min-width:821px){
          .clt-hero{--clt-plate:url(${plateSrc})}
        }

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
          /* MOBILE IS A STACK, NOT AN OVERLAY.
             Every mobile treatment before this put the lockup on top of a
             full-bleed plate, and every one failed the same way: the crop has
             no reserved empty region, so whatever sat lowest in the lockup
             landed on the figures. The shipped version had the secondary link
             and BOTH metrics rendered across the scribe and the table,
             unreadable — not dim, not tight, genuinely illegible.

             No amount of tuning fixes that, because the constraint is a
             contradiction: the type wants a quiet field and this crop is busy
             edge to edge. Earlier attempts tried to buy the field by painting
             sky above the figures, and the note below records how that went —
             36% sky against 55% required. So the artwork stops being a backdrop
             and becomes a BLOCK: type on paper, picture underneath, both in
             normal flow, which is what the approved mockup actually shows.

             This also permanently kills the scroll glitch. The hero no longer
             has a viewport-derived height, so the mobile URL bar collapsing
             cannot resize it. 100svh is removed rather than patched. */
          .clt-hero{
            height:auto;
            width:100vw;
            margin-left:calc(50% - 50vw);
            /* Reserves the artwork so the lockup cannot sit on the figures.
               96vw is the drawn image height (100vw / 1.041). It no longer has
               to match the ::before, which is now the full hero. */
            padding:0 0 96vw;
          }
          /* THE GOLD RUNS THE WHOLE HERO, exactly as it does on desktop, and
             the layer that carries it is the one that already existed. ::before
             goes back to filling the section (inset:0 from the desktop rule),
             with the artwork drawn at the BOTTOM of it and the plate's own
             ground as this element's background-color. The image sits on that
             colour, on the SAME element, so --plate-grade grades both in one
             pass and the flat field can never drift to a different tone than
             the artwork's own paper. That is why there is no mask here any
             more, and no fade to tune: there is no join to hide, because above
             the image it is not a different surface, it is the same one.

             The colour is #E8CCA1, measured as the mean of the crop's own top
             row across its full width — not the old #EED6AF, which came from a
             corner block and sat six levels light on red. At the image's top
             edge the flat field now continues the drawn sky rather than
             stepping off it.

             The image keeps its native 1066x1024 ratio (1.041) via 100% auto,
             so it is never stretched or cropped, and no-repeat stops it tiling
             upward into the field it is supposed to sit on.

             This also puts the gold behind the header for free: .ch-header is
             fixed and background:transparent until it gains .nav-scrolled, so
             at the top of the page it shows whatever the hero paints. */
          /* THE FIELD ABOVE THE ARTWORK IS THE PLATE'S OWN SKY, not a colour
             chosen to imitate it. That is the whole point, and it is the only
             way this matches exactly.

             Why a flat colour cannot work: the plate's top row is not one tone.
             Measured across its full width it spans 20.5 luma levels, running
             #EED6AE at the left to #E5C698 toward the right. Any single
             background-color is therefore the MEAN of an edge that varies,
             which makes it wrong in every column except the two where the
             image happens to cross that average. The eye reads the difference
             as a horizontal step. #E8CCA1 was that mean and it was out by up to
             ten levels at the edges — the visible seam.

             A sampled linear-gradient was measured as the next candidate and
             rejected: 41 stops cut the mean error from 3.15 to 1.23 levels but
             still left about 8 levels in the blue channel at columns where the
             plate has local grain, because no smooth curve tracks noise.

             So the same file is painted TWICE. The second layer is the same
             JPEG at background-size:100% 100000px anchored top, which scales it
             so tall that only its own uppermost sliver is ever on screen — at a
             927px hero that is source rows 0 to 9, all open sky, nowhere near
             the ink that starts at row 94. Horizontal detail is preserved
             exactly because the width is still 100%, so every column gets that
             column's real colour rather than an approximation of it.

             THE HEIGHT IS THE TUNING KNOB, and bigger is better. The join shows
             source row joinY/height*1024, so the taller the layer, the closer
             that row is to the artwork's own row 0 and the smaller the step.
             Measured as the low-frequency error over a 121px window, which is
             what actually reads as a visible band:

               100% 20000px    row 28 at the join    5.07 levels
               100% 50000px    row 11                1.75
               100% 100000px   row  6                1.49
               100% 200000px   row  3                1.10

             100000 is the knee — past it the gain is under half a level and
             the sizes get silly. The browser only rasterises the visible slice,
             so the number costs nothing at runtime.

             What does NOT go away is about 11 levels of worst-case per-pixel
             difference, and it is not worth chasing: that is the plate's own
             film grain, it is the same texture on both sides of the join, and
             it reads as material rather than as an edge. The flat colour it
             replaces was 10.09 levels of LOW-frequency error — a smooth,
             systematic mismatch across the whole width, which is exactly the
             kind the eye picks up as a horizontal step.

             Layer order matters — the artwork paints OVER the sky layer, so the
             sky only shows where the artwork is not. Both live on this one
             element, so --plate-grade grades them in a single pass and they
             cannot drift apart. background-color is a fallback for a failed
             image load only. */
          /* ══ SUPERSEDED: everything above about painting the file twice ══

             THE STRETCHED LAYER WAS THE VERTICAL STREAKS. Its analysis of the
             JOIN is correct and is kept below; what it never measured is what
             the layer does to the FIELD above the join.

             At 100% 100000px the visible 844px of a phone samples the top
             844/100000 of the source — NINE rows of a 1024-row image. The note
             calls those rows "all open sky" and treats them as uniform. They
             are not: measured across the full width their luma runs 194.6 to
             220.2, a range of 25.5 levels, standard deviation 4.07 — ordinary
             paper grain plus JPEG block boundaries. Stretched down the whole
             screen every one of those becomes a VERTICAL STREAK the full height
             of the hero. It optimised a 121px band at the join and paid for it
             across the other 800px.

             A FLAT FILL IS ALSO WRONG, AND FOR THE REASON THE OLD NOTE GIVES.
             Checked rather than assumed: the artwork's top edge is not one
             colour, it runs rgb(239,214,175) at the left to rgb(231,202,159) at
             the right. #E9CDA2, the mean of its top three rows, leaves 13.01
             levels of low-frequency error at the worst column and 4.4 on
             average. That is a visible horizontal step — the exact seam the old
             note set out to remove.

             SO: A SAMPLED HORIZONTAL GRADIENT. Seventeen stops taken from the
             artwork's own top edge, smoothed over a 41px window so the stops
             track its shape and not its grain. Measured against that edge it
             leaves 2.15 levels at the worst column and 0.51 on average — six
             times better than the flat fill at the join.

             It cannot streak, and that is the structural point rather than a
             lucky result: the gradient varies along X only and is constant down
             Y, so there is nothing to smear vertically. The old layer failed
             precisely because it stretched horizontal variation downward.

             The gradient is a background LAYER under the artwork rather than a
             background-color, so both are on this one element and --plate-grade
             transforms them in a single pass; they cannot drift apart. The
             colour underneath stays as a fallback for a failed image AND
             gradient. */
          .clt-hero::before{
            background-image:
              url(/assets/images/collateral-senate-mobile.jpg),
              linear-gradient(90deg,
                rgb(239,214,175) 0%,    rgb(237,213,173) 6.25%,
                rgb(235,208,168) 12.5%, rgb(234,207,165) 18.75%,
                rgb(234,207,164) 25%,   rgb(233,206,164) 31.25%,
                rgb(232,205,162) 37.5%, rgb(232,203,160) 43.75%,
                rgb(232,203,159) 50%,   rgb(232,204,160) 56.25%,
                rgb(234,206,163) 62.5%, rgb(232,203,159) 68.75%,
                rgb(232,204,160) 75%,   rgb(231,203,158) 81.25%,
                rgb(229,199,153) 87.5%, rgb(228,199,153) 93.75%,
                rgb(231,202,159) 100%) !important;
            background-size:100% auto, 100% 100%;
            background-position:center bottom, center top;
            background-repeat:no-repeat, no-repeat;
            /* Fallback only, for a failed image AND gradient. */
            background-color:#E9CDA2;
          }
          /* Clouds cover the whole hero, like desktop — but ATTENUATED OVER THE
             TYPE, which is the same job the desktop mask does, turned through
             90 degrees. Desktop ramps left-to-right because the type is a left
             column; here the type is a full-width band across the top, so the
             ramp runs top-to-bottom.

             Removing the mask outright was measured and rejected. The cloud
             darkens by up to its full opacity of .26, which drops the subhead
             #4A4035 on the graded gold from 6.66:1 to 3.64:1 — under the 4.5:1
             AA floor for body text. Holding the top of the hero at half
             strength puts the worst case at 5.01:1. The headline never came
             close to failing; the subhead is the binding constraint, and it is
             the thing that would have shipped broken.

             The ramp finishes by 65%, which is about where the artwork begins
             at phone proportions, so the picture still gets the clouds at full
             strength. The crossover is soft and the exact percentage is not
             critical — what matters is that it is complete before the figures
             start and well clear of the metrics. */
          .clt-sky{
            -webkit-mask-image:none;
            mask-image:none;
          }
          /* The scrim is OFF here, and that is not an oversight. It is a
             left-to-right ramp that exists to hold a left type column apart
             from artwork on the right — a two-column device. Mobile is a stack:
             the type is full width and already on its own paper above the
             picture, so there is nothing to separate. Left on, it would lay a
             band of parchment across the artwork for no reason.

             The ambient sweep goes with it. On desktop it rides the .clt-sky
             mask, which kept it off the type; with that mask removed here it
             would drift across the headline instead. */
          .clt-hero::after{display:none}
          .clt-sky::after{display:none}
          /* position:relative, not static — z-index only applies to positioned
             elements and the lockup has to stay above the sky layer.

             THE 96px TOP PADDING IS HEADER CLEARANCE, NOT TASTE. .ch-header is
             position:fixed, 64px tall at z-index 50, and the hero starts at
             y=0, so it overlays the top of the lockup. Anything less than 64
             here puts the eyebrow underneath the wordmark — this shipped once
             at 34px and the eyebrow rendered straight through COLLATERAL and
             MENU. 96 clears the header by 32px, which is the gap the mockup
             shows. Do not trim this to tighten the stack; take it out of the
             margins below the eyebrow instead. */
          .clt-lockup{
            position:relative;inset:auto;
            justify-content:flex-start;align-items:stretch;text-align:left;
            /* Inline inset matched to the sections so the hero headline and every
               section heading share one left margin on a phone. */
            padding:96px clamp(20px,5.5vw,90px) 30px;max-width:none;z-index:2;
          }
          /* Rule moves to the LEFT of the label so the eyebrow starts on the
             same margin as everything below it. */
          .clt-eyebrow{font-size:9px;gap:10px;letter-spacing:.18em}
          .clt-eyebrow::after{display:none}
          .clt-eyebrow::before{display:block;width:26px;height:1px}
          /* The desktop rule already sets --text-serif, weight 400 and
             text-transform:none, so the caps problem is solved upstream. Two
             things still need saying here.

             WEIGHT GOES TO 700 ON MOBILE ONLY. Newsreader carries an optical
             size axis, and 400 that reads composed at 4.55cqw reads thin and
             underset at 34px. This is optical compensation, not a different
             voice, and it is what the mockup shows.

             LETTER-SPACING WAS STILL POSITIVE HERE. The old value was .02em,
             left over from Trajan, which is inscriptional and wants air. On a
             text serif it just loosens the line. Matched to desktop at -.012em.

             src/mobile.css:521 forces font-size, line-height AND letter-spacing
             on a bare h1 with !important for every view under 768px. An
             !important at lower specificity beats a plain declaration at higher
             specificity, so those three need !important here or they silently
             lose — that is how mobile ended up with NEGATIVE tracking once
             already. font-family, weight and text-transform are not in that
             rule, so they do not need it. */
          .clt .clt-hero h1{
            font-weight:700;
            margin-top:18px;
            font-size:clamp(33px,10.6vw,44px) !important;
            line-height:1.1 !important;
            letter-spacing:-.012em !important;
          }
          /* #4A4035 -> #383028, forced by the clouds now running full strength
             across the type. The cloud darkens by up to its whole .26 opacity,
             which takes the old colour on the graded gold from 6.66:1 down to
             3.64:1 — under the 4.5:1 AA floor for body text. #383028 measures
             4.67:1 at the worst point of the cycle and is still clearly lighter
             than the #2B2118 headline, so the hierarchy survives.
             If the mask ever comes back, this can go back with it. */
          .clt-sub{font-size:16px;line-height:1.55;max-width:36ch;color:#383028}
          /* Raised to match the desktop rule above, which had to go to two
             classes to beat a global p-margin. At one class this would now
             lose to it. */
          .clt .clt-sub{margin-top:16px}
          .clt-cta{margin-top:26px;gap:16px;flex-direction:column;align-items:stretch}
          /* Full-width button. min-height is the 44px touch target; the padding
             alone came to 43. The offset drop-shadow the old rule added is
             dropped — it replaced the base inset hairlines wholesale, and the
             mockup shows the button flat. */
          .clt-btn{
            padding:17px 24px;min-height:44px;font-size:11px;
            justify-content:center;text-align:center;
          }
          /* The link must NOT stretch — align-items:stretch above would drag
             its underline the full width of the column. */
          .clt-link{align-self:flex-start;font-size:11px;padding-bottom:6px}
          /* Metrics sit side by side with a rule between them. They are the
             last thing before the artwork, so this doubles as the seam. */
          /* The label alpha goes .52 -> .88. This one was NOT caused by the
             clouds — it was already failing. rgba(43,33,24,.52) measured
             3.22:1 on the old cool paper and 2.96:1 on the gold, both under
             the AA floor, and full-strength cloud would have taken it to
             2.39:1. .88 measures 4.67:1 at the worst point.

             It reads darker than a caption "wants" to, and that is the honest
             cost of a 9px letterspaced label on a mid-tone ground. The colour
             is the only free variable here — the size and tracking are doing
             the work of making it a label, and shrinking the contrast further
             to keep it feeling secondary would just make it decorative text
             nobody can read. The same declaration on desktop is still at .52
             and still fails; that is a separate fix. */
          .clt-proof{
            margin-top:30px;padding-top:20px;gap:0;
            font-size:9px;letter-spacing:.15em;
            flex-wrap:nowrap;align-items:stretch;
            color:rgba(43,33,24,.88);
          }
          .clt-proof span{flex:1 1 0;min-width:0}
          .clt-proof span + span{
            border-left:1px solid rgba(43,33,24,.18);padding-left:20px;
          }
          /* Numbers follow the headline out of Trajan. Trajan regular beside a
             bold text serif read as two different voices stacked. */
          .clt-proof b{
            font-family:var(--text-serif);font-weight:700;
            font-size:3.05em;letter-spacing:-.01em;margin-bottom:7px;
          }
          /* The band restacks rather than shrinking. At 52px the four marks
             overflow a phone, so the gap closes, the label sits above the row
             instead of beside it, and the vertical rule goes — it separates two
             things that are no longer side by side. */
          /* THE BAND IS A STRIP, NOT A SECTION. It measured 195px tall on a
             phone, which is section height for what is a credit line.

             The label sits above the marks and the divider goes, because it
             separated two things that are no longer side by side. All four
             marks come down to a common 20px: on desktop they are optically
             balanced per brand at 19-29px, but at strip scale that spread stops
             reading as four brands and starts reading as four sizes, and the
             captions carry the identification anyway.

             nowrap is deliberate. Letting them wrap turns the strip back into a
             tall block, which is the thing being fixed. At 360px the four marks
             plus the minimum 20px gaps come to about 230px against 320px of
             available width, so they hold one row. */
          .clt-strip-in{padding:clamp(22px,7vw,28px) clamp(20px,5.5vw,90px)}
          .clt-strip-eyebrow{margin-bottom:14px;letter-spacing:.3em;font-size:9px}
          .clt-oracles{flex-direction:column;gap:14px}
          .clt-vline{display:none}
          .clt-live{transform:none;font-size:10px}
          .clt-logos{gap:clamp(20px,6vw,52px);flex-wrap:nowrap}
          .clt-logo{gap:8px}
          .clt-mark{height:20px}
          .clt-logo-stripe .clt-mark svg,
          .clt-logo-youtube .clt-mark svg,
          .clt-logo-shopify .clt-mark svg,
          .clt-logo-plaid .clt-mark svg{height:20px}
          .clt-name{font-size:9px;letter-spacing:.18em}
          /* Same gutter escape as the other sections — see ForkSection.js. */
          .clt-strip{width:100vw;margin-left:calc(50% - 50vw)}
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
            /* .08 -> .13. This is the animated layer's MEAN darkening, and it
               has to track the layer opacity or reduced-motion users get a
               differently lit hero. The noise averages about .5 alpha, so the
               mean is opacity x 0.5; .08 was correct when opacity was .16 and
               was left behind when it went to .26. */
            background-color:rgba(0,0,0,.13) !important;
            opacity:1 !important;
          }
        }
        /* ═════ THE CONTRACT DOCUMENT ══════════════════════════════════════════
           The card the three figures in the plate are signing, in its modern
           form. It is deliberately a DOCUMENT and not a dashboard panel: no
           glass, no gradient fills, no elevation stack, no bright UI colour.
           What holds it together is a hairline border, a paper ground half a
           shade off the hero's, and the same oxblood family as the headline.

           SCOPED --doc-* TOKENS. The hero's palette is tuned against the
           engraving and runs cooler (--paper #F1EEE8, --ox #781C22). This is a
           separate object lying ON the hero, so it carries its own warmer ivory
           and its own accent. Sharing the hero's tokens is what would make it
           read as part of the page rather than as a thing resting on it. */
        .clt .clt-doc-wrap{
          --doc-bg:#F8F2E6;
          --doc-edge:#D7C9AE;
          --doc-rule:#E2D7BF;
          --doc-ink:#2A2622;
          --doc-soft:#7A7060;
          --doc-ox:#6D1F2D;
          --doc-sage-bg:#EDF0E6;
          --doc-ox-bg:#F6EAE9;
          --doc-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          position:absolute;z-index:3;
          /* +36px. Two things wanted it lower: the magistrate's head is the
             highest thing on the right and should stay that way, and the card's
             lower third needs to reach the table front, measured at 77.5% of
             the plate = screen y 733 at 1512x945. At top:50% the card ran
             92-853 and its top edge sat above the tallest head (88). At +36 it
             runs 128-889: the head clears it by 40px, and 156px of card now
             overlaps the table slab rather than torsos. */
          right:5cqw;top:calc(50% + 36px);
          transform:translateY(-50%);
          width:min(520px,40cqw);
        }
        /* ── THE DISSOLVE ──────────────────────────────────────────────────────
           The artwork quietens where it passes under the document, so the two
           stop competing. THREE OVERLAPPING RADIALS, not one — a single radial
           is a soft ellipse and reads as a vignette, and a linear-gradient
           would read as exactly the rectangle the brief rules out. Three
           centres at different offsets and radii sum to an irregular field with
           no axis of symmetry, and the blur on top removes any edge either of
           them might still have. Ink going quiet in paper, rather than a scrim.

           It is inset NEGATIVE on all four sides so the softening starts well
           outside the card and there is no boundary coincident with the card's
           own edge — that coincidence is what makes a backing plate look like a
           backing plate. Detail stays sharp everywhere it is not needed. */
        .clt .clt-doc-wrap::before{
          content:"";position:absolute;z-index:-1;pointer-events:none;
          inset:-16% -14% -18% -20%;
          background:
            radial-gradient(58% 46% at 40% 34%, rgba(241,238,232,.90), rgba(241,238,232,0) 72%),
            radial-gradient(54% 56% at 70% 60%, rgba(241,238,232,.86), rgba(241,238,232,0) 74%),
            radial-gradient(48% 42% at 28% 76%, rgba(241,238,232,.82), rgba(241,238,232,0) 70%);
          filter:blur(16px);
        }
        .clt .clt-doc{
          position:relative;
          background:var(--doc-bg);
          border:1px solid var(--doc-edge);
          border-radius:9px;
          padding:26px 30px 16px;
          /* THREE shadows now, and the middle one is the point. A sheet lying
             on a table has a CONTACT shadow — tight, close, darker than the
             ambient one — and without it the card floats regardless of how soft
             the big shadow is. It is also warmer (74,54,30 against 60,46,28)
             because the surface catching it is parchment, not a grey ground.
             Still no glow and nothing hard-edged. */
          box-shadow:0 1px 2px rgba(60,46,28,.06),
                     0 10px 18px -8px rgba(74,54,30,.17),
                     0 30px 56px -18px rgba(60,46,28,.22);
          transition:transform 220ms cubic-bezier(.2,.8,.2,1),
                     box-shadow 220ms cubic-bezier(.2,.8,.2,1);
        }
        /* The bevel: 1px of inset highlight top-left, matching shade
           bottom-right. It is the whole difference between "printed sheet" and
           "rectangle with a border". */
        .clt .clt-doc::before{
          content:"";position:absolute;inset:0;border-radius:8px;pointer-events:none;
          box-shadow:inset 1px 1px 0 rgba(255,255,255,.7),
                     inset -1px -1px 0 rgba(120,100,70,.07),
                     /* Reflected warmth. The parchment under the card throws a
                        little of itself back onto the sheet's lower edge, which
                        is what stops the bottom of a light object reading as
                        cut out. Barely present at .12 and confined to the last
                        16px. */
                     inset 0 -16px 20px -16px rgba(196,156,98,.12);
        }
        /* Paper grain, finer and fainter than the section's — this is a better
           sheet than the ground it lies on. */
        .clt .clt-doc::after{
          content:"";position:absolute;inset:0;border-radius:8px;pointer-events:none;
          opacity:.34;mix-blend-mode:multiply;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)' opacity='.26'/%3E%3C/svg%3E");
        }
        .clt .clt-doc:hover{
          transform:translateY(-6px);
          box-shadow:0 1px 2px rgba(60,46,28,.06),
                     0 30px 56px -16px rgba(60,46,28,.26);
        }

        /* Engraved corner brackets. Half opacity so they are found rather than
           noticed. */
        .clt .clt-doc-corner{position:absolute;width:15px;height:15px;opacity:.5;
          color:var(--doc-edge);pointer-events:none;z-index:2}
        .clt .clt-doc-corner svg{width:100%;height:100%;display:block;
          fill:none;stroke:currentColor;stroke-width:1.2}
        .clt .clt-doc-c1{top:9px;left:9px}
        .clt .clt-doc-c2{top:9px;right:9px;transform:scaleX(-1)}
        .clt .clt-doc-c3{bottom:9px;left:9px;transform:scaleY(-1)}
        .clt .clt-doc-c4{bottom:9px;right:9px;transform:scale(-1,-1)}

        .clt .clt-doc-in{position:relative;z-index:1}
        .clt .clt-doc-head{display:flex;align-items:center;justify-content:space-between;gap:14px}
        .clt .clt-doc-kicker{font-family:var(--roman);font-size:11px;font-weight:700;
          letter-spacing:.25em;text-transform:uppercase;color:var(--doc-ink);
          padding-left:.25em}
        /* Olive border, muted dot. Never the stock #22C55E — a bright green is
           the single fastest way to make a document look like a status page. */
        .clt .clt-doc-live{display:inline-flex;align-items:center;gap:6px;
          background:#F3F5EC;border:1px solid #C3CBB0;border-radius:3px;
          padding:4px 9px;font-family:var(--doc-mono);
          font-size:9.5px;font-weight:500;letter-spacing:.16em;
          text-transform:uppercase;color:#5C6B4F}
        .clt .clt-doc-live i{width:5px;height:5px;border-radius:50%;
          background:#4E7A4A;display:block;flex:0 0 auto}

        /* The rule, with its ornament knocked out of the middle. */
        .clt .clt-doc-div{position:relative;height:1px;background:var(--doc-rule);
          margin:18px 0 22px}
        .clt .clt-doc-div span{position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%);background:var(--doc-bg);
          padding:0 9px;display:flex;align-items:center;gap:5px}
        .clt .clt-doc-div b{width:4.5px;height:4.5px;background:var(--doc-ox);
          opacity:.55;transform:rotate(45deg);display:block}
        .clt .clt-doc-div i{width:13px;height:1px;background:var(--doc-edge);display:block}

        .clt .clt-doc-title{font-family:var(--text-serif);font-weight:500;
          font-size:31px;line-height:1.14;color:var(--doc-ink);
          letter-spacing:-.005em;
          /* One pixel of white under the glyphs — what a letterpress bite looks
             like viewed straight on. */
          text-shadow:0 1px 0 rgba(255,255,255,.85)}
        .clt .clt-doc-verified{display:flex;align-items:center;gap:7px;margin-top:11px;
          font-family:var(--doc-mono);font-size:9.5px;
          letter-spacing:.15em;text-transform:uppercase;color:var(--doc-soft)}
        .clt .clt-doc-verified b{color:var(--doc-ink);font-weight:500}
        .clt .clt-doc-stripe{width:15px;height:15px;border-radius:50%;background:#635BFF;
          display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}
        .clt .clt-doc-stripe svg{width:8px;height:8px;fill:#fff;display:block}

        .clt .clt-doc-rows{margin-top:26px}
        .clt .clt-doc-row{display:flex;align-items:center;gap:15px;padding:16px 0;
          border-top:1px solid var(--doc-rule)}
        .clt .clt-doc-row:first-child{border-top:0;padding-top:4px}
        /* THE MEDALLIONS. A ring, a hairline inner ring, an oxblood glyph. The
           inner ring is the detail that stops these reading as app icons —
           struck metal has two edges, a filled circle has one. */
        .clt .clt-doc-ico{width:38px;height:38px;border-radius:50%;flex:0 0 auto;
          border:1px solid var(--doc-edge);background:#FCF8EF;
          display:flex;align-items:center;justify-content:center;
          box-shadow:inset 0 0 0 3px var(--doc-bg),
                     inset 0 0 0 3.9px rgba(190,170,135,.55)}
        .clt .clt-doc-ico svg{width:17px;height:17px;display:block;
          fill:none;stroke:var(--doc-ox);stroke-width:1.4;
          stroke-linecap:round;stroke-linejoin:round}
        .clt .clt-doc-lab{font-family:var(--doc-mono);
          font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;
          color:var(--doc-ink);flex:1 1 auto}
        .clt .clt-doc-val{text-align:right;font-family:var(--text-serif);
          font-size:21px;line-height:1.1;color:var(--doc-ink);white-space:nowrap}
        .clt .clt-doc-val small{display:block;margin-top:3px;
          font-family:var(--doc-mono);font-size:9px;
          letter-spacing:.14em;text-transform:uppercase;color:var(--doc-soft)}
        .clt .clt-doc-val.is-mono{font-family:var(--doc-mono);font-size:15px}

        /* The two outcomes, and the reason the card exists. */
        .clt .clt-doc-out{margin-top:22px;display:flex;flex-direction:column;gap:9px}
        .clt .clt-doc-o{display:flex;align-items:center;gap:13px;padding:16px;
          border-radius:6px;border:1px solid transparent}
        .clt .clt-doc-o-win{background:var(--doc-sage-bg);border-color:#CBD5B8}
        .clt .clt-doc-o-lose{background:var(--doc-ox-bg);border-color:#E3C7C4}
        .clt .clt-doc-o i{width:30px;height:30px;border-radius:50%;flex:0 0 auto;
          display:flex;align-items:center;justify-content:center;
          border:1px solid currentColor}
        .clt .clt-doc-o i svg{width:13px;height:13px;fill:none;stroke:currentColor;
          stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;display:block}
        .clt .clt-doc-o-win i{color:#5C7A4E}
        .clt .clt-doc-o-lose i{color:#8E4340}
        .clt .clt-doc-o-t{flex:1 1 auto;font-family:var(--doc-mono);
          font-size:11.5px;font-weight:500;letter-spacing:.14em;
          text-transform:uppercase;color:var(--doc-ink)}
        .clt .clt-doc-o-t small{display:block;margin-top:3px;font-size:9.5px;
          font-weight:400;letter-spacing:.13em;color:var(--doc-soft)}
        .clt .clt-doc-o-v{font-family:var(--text-serif);font-size:23px;white-space:nowrap}
        .clt .clt-doc-o-win .clt-doc-o-v{color:#3F6B3A}
        .clt .clt-doc-o-lose .clt-doc-o-v{color:#8E2B27}

        .clt .clt-doc-foot{display:flex;align-items:center;justify-content:center;
          gap:14px;margin-top:18px;padding-top:14px;
          border-top:1px solid var(--doc-rule);
          font-family:var(--doc-mono);font-size:9px;
          letter-spacing:.13em;text-transform:uppercase;color:var(--doc-soft)}
        .clt .clt-doc-foot span{display:inline-flex;align-items:center;gap:5px}
        .clt .clt-doc-foot svg{width:9px;height:9px;fill:none;stroke:currentColor;
          stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;display:block}
        .clt .clt-doc-foot em{width:1px;height:9px;background:var(--doc-edge);display:block}

        /* The card is a desktop object. Below 821 the hero is a stack whose
           three measurements are tuned to the crop, and dropping a 520px
           document into it would rebuild that layout — out of scope here. */
        @media (max-width:820px){ .clt .clt-doc-wrap{display:none} }
        /* Short desktop windows scale rather than reflow, so the document keeps
           its proportions. Anchored right so it never crosses the lockup. */
        @media (min-width:821px) and (max-height:880px){
          .clt .clt-doc-wrap{transform:translateY(-50%) scale(.88);transform-origin:100% 50%}
        }
        @media (min-width:821px) and (max-height:780px){
          .clt .clt-doc-wrap{transform:translateY(-50%) scale(.78);transform-origin:100% 50%}
        }
        @media (prefers-reduced-motion:reduce){
          .clt .clt-doc{transition:none !important}
          .clt .clt-doc:hover{transform:none !important}
        }
        </style>

        <div class="clt">
            <section class="clt-hero" data-plate="${PLATE_W}x${PLATE_H}">
                <div class="clt-sky" aria-hidden="true"><i></i></div>
                <div class="clt-press" aria-hidden="true"><i></i></div>
                ${renderContractDoc()}
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

            <!-- The terms line that used to sit here — VERIFICATION IS
                 AUTOMATIC / NO APPEALS / NO EXTENSIONS — is not lost. It is
                 still on the page, in the ledger section's footer, so removing
                 it from the band does not drop the claim from the document. -->
            <div class="clt-strip">
                <div class="clt-strip-in">
                    <div class="clt-strip-eyebrow">Every outcome, verified at the source</div>
                    <div class="clt-oracles">
                        <span class="clt-live"><span class="clt-dot" aria-hidden="true"></span> Live Oracles</span>
                        <span class="clt-vline" aria-hidden="true"></span>
                        <span class="clt-logos">
                            <!-- PLAID MARK — official, unmodified, not redrawn.

                                 SOURCE: the SVG plaid.com serves in its own page
                                 header, aria-label="Plaid", which already
                                 declares fill="currentColor". Their published
                                 brand kit could not be reached: plaid.com/brand
                                 404s and the press page carries no asset links.
                                 So this is Plaid's own live file rather than a
                                 media-kit download. If you obtain the kit it is
                                 worth swapping, but the geometry is theirs
                                 either way.

                                 THEIR FILE IS A LOCKUP. It carries two paths —
                                 the letterforms across x 33-77, and the symbol
                                 across x 0-28. Only the symbol is used here, so
                                 it matches the sibling icon marks and does not
                                 repeat the PLAID caption sitting under it. The
                                 viewBox is cropped from 0 0 77 29 to 0 0 28 29,
                                 which frames the symbol exactly (x 0-28,
                                 y 0.5-28.5). A crop, not a scale: the shape is
                                 untouched.

                                 The siblings are not from each brand's own kit
                                 either — Stripe, YouTube and Shopify are
                                 byte-identical to simple-icons, verified against
                                 the upstream files. Simple Icons has no Plaid
                                 entry, which is why this one had to come from
                                 Plaid directly. -->
                            <span class="clt-logo clt-logo-plaid" title="Plaid">
                                <span class="clt-mark"><svg viewBox="0 0 28 29" role="img" aria-label="Plaid"><path d="M25.7629 26.2628L28 17.5309L24.9691 14.5001L27.9999 11.4691L25.7628 2.73706L17.0309 0.5L14.0001 3.531L10.969 0.50014L2.23706 2.73734L0 11.4691L3.03128 14.4999L0.00014 17.531L2.2372 26.2629L10.9691 28.5L14.0001 25.469L17.031 28.4999L25.7629 26.2628ZM15.7321 23.7371L18.6186 20.8505L22.2912 24.5233L17.6956 25.7007L15.7321 23.7371ZM11.1136 9.88154L14.0003 6.99502L16.8868 9.8814L14.0001 12.7679L11.1136 9.88154ZM12.2682 14.5L9.38154 17.3865L6.49502 14.5L9.38154 11.6135L12.2682 14.5ZM18.6187 11.6133L21.5053 14.5L18.6186 17.3865L15.7321 14.5L18.6187 11.6133ZM16.8867 19.1186L14.0001 22.0051L11.1135 19.1185L14.0001 16.2319L16.8867 19.1186ZM10.3044 25.7007L5.70864 24.5233L9.38154 20.8504L12.2682 23.7371L10.3044 25.7007ZM4.76308 16.2319L7.6496 19.1185L3.9767 22.7914L2.7993 18.1957L4.76308 16.2319ZM3.9767 6.20836L7.64974 9.8814L4.76308 12.7681L2.7993 10.8041L3.9767 6.20836ZM12.2683 5.26294L9.38168 8.1496L5.70892 4.4767L10.3047 3.2993L12.2683 5.26294ZM17.6959 3.2993L22.2915 4.4767L18.6186 8.14946L15.7321 5.26294L17.6959 3.2993ZM23.2372 12.7681L20.3505 9.8814L24.0233 6.20878L25.2007 10.8046L23.2372 12.7681ZM24.0233 22.7914L20.3505 19.1186L23.2372 16.2321L25.2007 18.1957L24.0233 22.7914Z"/></svg></span>
                                <span class="clt-name">Plaid</span>
                            </span>
                            <span class="clt-logo clt-logo-stripe" title="Stripe">
                                <span class="clt-mark"><svg viewBox="0 0 24 24" role="img" aria-label="Stripe"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg></span>
                                <span class="clt-name">Stripe</span>
                            </span>
                            <span class="clt-logo clt-logo-youtube" title="YouTube">
                                <span class="clt-mark"><svg viewBox="0 0 24 24" role="img" aria-label="YouTube"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span>
                                <span class="clt-name">YouTube</span>
                            </span>
                            <span class="clt-logo clt-logo-shopify" title="Shopify">
                                <span class="clt-mark"><svg viewBox="0 0 24 24" role="img" aria-label="Shopify"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg></span>
                                <span class="clt-name">Shopify</span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>

        </div>
    `;
}
