// ActiveContracts.js — Collateral Execution Queue (Market View)
// Mechanical Weight & Consequence Interactions (Stamp Press, Odometer, Live Commit Ticker, Hover Position, Truthful Fill States)

// Market-listing and execution-modal imports removed with the contract catalog:
// the source picker fetches nothing, and terms are derived after the examination.

// The Contract Structures section is no longer rendered on this route — it
// belongs to the landing page now. Its import is removed with it rather than
// left dangling.

/**
 * ONE SOURCE OF TRUTH FOR THE MARKET FIGURES.
 *
 * This exists because the page was contradicting itself in public. The hero
 * printed "312 ACTIVE CONTRACTS" as a hardcoded string while the board's
 * odometer animated to 528 OPEN CONTRACTS about forty pixels below it, and
 * "$8,700,000 CAPITAL LOCKED" sat above "$633.6k OPEN CAPITAL". On a product
 * whose entire promise is "verified at the source and permanently recorded",
 * two disagreeing numbers at the top of the page discredit the thing being sold
 * before the reader has done anything.
 *
 * The masthead status line and the board's odometers both read from here now,
 * so they cannot drift apart again regardless of who edits which.
 *
 * NONE OF THIS IS LIVE YET, and that should be fixed before anyone trades on
 * it. There is no contracts feed on this route — the only real network calls
 * are the source-connection checks (Plaid, Stripe, Shopify, YouTube), and the
 * rivalry board renders mockRivalries. When a real endpoint exists, replace
 * this object's values at the call site in initActiveContracts and both
 * surfaces update together.
 */
export const MARKET_STATS = {
    openContracts: 528,
    openCapital: 633600,
    dailyVolume: 148200,
    /* Pre-formatted for the masthead, which has room for a rounded figure and
       not for six digits. Derived rather than typed, so it cannot disagree with
       openCapital above. */
    get openCapitalLabel() {
        return '$' + Math.round(this.openCapital / 1000) + 'K';
    },
};

export function renderActiveContracts() {
    return `
        <style>
            /* ══════════════════════════════════════════════════════════════
               ROOT DESIGN TOKEN BLOCK (HOMEPAGE PARITY)
               ══════════════════════════════════════════════════════════════ */
            :root {
              --paper: #F7F4ED;
              --paper-alt: #EFEAE0;
              --paper-deep: #E7E1D4;
              --plate: #FFFDF9;
              --notch: #F7F4ED;
              --ink: #0E1420;
              --ink-2: #4A5464;
              --ink-3: #6E7686;
              --ink-4: #9AA0AC;
              --blood: #7A1C29;
              --blood-deep: #54111B;
              --blood-mid: #9B3341;
              --blood-tint: #F5E6E8;
              --blood-wash: #FBF3F4;
              --win: #186B4A;
              --win-tint: #E6F1EA;
              --win-wash: #F2F8F4;
              --gilt: #A8854E;
              --rule: #DCD5C6;
              --rule-soft: #EAE4D8;
              --rule-strong: #BDB3A0;
              --display: "Archivo", system-ui, sans-serif;
              --wordmark: "Archivo", system-ui, sans-serif;
              --body: "Public Sans", system-ui, sans-serif;
              --mono: "IBM Plex Mono", ui-monospace, monospace;
              --r: 2px;
              --lift: 0 1px 2px rgba(14,20,32,.04), 0 12px 28px -18px rgba(14,20,32,.22);
            }

            /* ONE CREAM ACROSS THE WHOLE PRODUCT. This page read var(--paper) =
               #F7F4ED while the landing hero and the header bar had both been
               moved to #F1E8D3, so navigating from home to /market changed the
               paper under the reader by four points of warmth. That is the kind
               of inconsistency nobody can name and everybody feels.

               #F1E8D3 IS SET HERE RATHER THAN ON THE TOKEN, deliberately. --paper
               is read by six other views; retuning it would have repainted the
               entire app from inside a hero commit. The page ground and the band
               behind it are what meet the header, so they are what changes. The
               inner surfaces — cards, modals, the rivalry board — keep --paper
               on purpose: they are meant to sit ON the paper, not to be it. */
            .eq {
                background: #F1E8D3;
                min-height: 100vh;
                font-family: var(--body, 'Public Sans', sans-serif);
                color: var(--ink, #0E1420);
                padding-bottom: 100px;
                position: relative;
                font-variant-numeric: tabular-nums;
            }

            /* Fixed Grain Overlay */
            .cl-grain {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 9999;
                opacity: .035;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }

            /* Clerical Mono Label Utility */
            .mono-lbl {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                letter-spacing: .16em;
                text-transform: uppercase;
                color: var(--ink-3, #6E7686);
            }

            /* ══════════════════════════════════════════════════════════════
               THE EXCHANGE HERO

               Ported from the supplied hero_exchange_final.html. Three things
               about that file could not ship as authored:

                 ITS TOPBAR. It renders its own COLLATERAL wordmark, balance,
                 health, HOW IT WORKS and hamburger. This app already has a real
                 one — renderHeader, wired to the router and to updateAuthUI —
                 and a second static copy would have sat 92px above the live one
                 showing figures that never update.

                 ITS 402KB INLINE BASE64. The banner artwork was a data: URI in
                 the markup, which means it is parsed on every render, cannot be
                 cached, and cannot be fetched in parallel with the document. It
                 is now /assets/images/trading-hall.webp at 1792x874, 294KB, and
                 the browser treats it like an image.

                 ITS GLOBAL RESET. A universal margin/padding reset plus bare
                 h1 and body rules would have reached every other section on
                 this page. All of the below is scoped under .xh.

               THE CARD STRADDLES THE SEAM ON PURPOSE. It is pulled up 150px so
               it crosses the boundary between the banner and the parchment,
               which is what makes the two read as one composition rather than
               as an image with a section under it. ═════════════════════════ */

            /* THE WHITE BAR UNDER THE HEADER WAS NEVER THE HEADER. The bar is
               background:transparent at rest — what was showing through it is
               #app, which carries Tailwind's pt-24 (96px) on every route, over a
               body painted with --bg-page. So the top of this page was 96px of
               white, then 92px of parchment from the rule below, and only then
               the hall.

               Two things fall out of that:

                 THE SEAM. Fixed by painting the page's own paper behind #app,
                 further down this block, so the strip and the sheet are one
                 value and the header genuinely disappears into it.

                 188px OF CLEARANCE FOR A 92px HEADER. #app's 96px already
                 clears the bar; this rule was adding a second, nearly equal
                 offset on top of it. Removing it takes 92px of dead parchment
                 out of the hero on its own — the single largest cut in this
                 pass, and it costs nothing, because it was never doing
                 anything. */
            .xh { position: relative; padding-top: 0; }

            /* ONE SHEET, FROM THE TOP EDGE DOWN. #app is where the page's
               background has to be set — .eq starts BELOW its padding, so
               painting .eq alone can never reach the strip the header sits on.
               Scoped through :has() to this route only, so no other view's
               ground is touched by a market-hero commit. */
            body:has(.eq) { background: #F1E8D3; }
            body:has(.eq) #app { background: #F1E8D3; }

            /* ---- the hall, as a masthead ----
               ~150px, down from ~306. It was an establishing shot when this
               page opened with a story; the page no longer tells one, so the
               plate's job changes from "hold long enough to be a place" to
               "identify the institution and get out of the way".
               Still viewport-relative, because the reason for that has not
               changed: the thing it has to fit inside is not a fixed size. */
            .xh-band {
                position: relative;
                width: 100%;
                height: clamp(132px, 17vh, 178px);
                overflow: hidden;
                /* Must be the page's exact ground, not the token: the plate
                   multiplies against this, so any difference between the band's
                   paper and the page's would print as a visible rectangle
                   exactly where the dissolve is trying to hide one. */
                background: #F1E8D3;
                /* The art and the depth layers blend with the band's own paper
                   and stop there. Without this, multiply would reach through to
                   whatever the page puts behind the band. */
                isolation: isolate;
            }

            /* ══ INK ON PAPER, NOT ARTWORK UNDER FOG ══════════════════════════
               THE FOG WAS A LAYER OF PARCHMENT-COLOURED PAINT ON TOP. The old
               veil ended with a linear-gradient from rgba(247,244,237,.12) to
               itself — a flat 12% wash across the entire band —
               plus 55% washes down both sides and a 75% wash across the bottom.
               That is a scrim, and a scrim is exactly what "Photoshop feather"
               describes: the engraving keeps its full ink and something milky
               sits between it and the reader.

               THE FIX IS TWO PROPERTIES, AND NEITHER OF THEM PAINTS ANYTHING.

               mix-blend-mode: multiply makes the plate behave like INK. Multiply
               can only ever darken, so the engraving's light areas become the
               page's own parchment rather than a second, slightly different
               beige laid over it — which is what made the plate read as a
               rectangle even where the fade was working.

               mask-image REMOVES INK RATHER THAN COVERING IT. As the mask alpha
               falls, less ink is deposited; the line work thins and pales in
               place, keeping every stroke it had, exactly the way a copperplate
               prints lighter as the plate runs dry. Nothing is added on top, so
               there is nothing to read as mist.

               The stops are asymmetric on purpose: a long, slow bottom fall
               through the last 42% so the trading counter dissolves into the
               parchment the headline sits on, a short top fall so the ceiling
               arrives immediately, and gentle side falls that stop well short of
               opaque so the hall keeps running past the frame. */
            /* 66px OF HEADROOM ABOVE THE BAND, halved with the band itself.
               This is a parallax requirement rather than a framing one: the
               plate translates DOWN as the page scrolls up, so starting flush
               with the band's top edge would drag that edge into view within the
               first hundred pixels of scroll and expose the frame it is meant to
               dissolve out of.
               The masthead is visible for roughly 275px of scroll now (96px of
               #app padding plus a 178px band at its tallest) and the rate is
               0.12, so the furthest it travels while anyone can see it is ~33px.
               The scroll clamp below caps it at 48px regardless. Both sit well
               inside the 66. */
            .xh-band-art {
                position: absolute;
                inset: -66px -1% 0;
                /* CROPPED IN ON THE DESK, which is the one compositional change
                   available without repainting the plate.

                   background-size:cover was showing the ENTIRE width of a
                   1792px panorama, so
                   the frame contained the whole institution and the central
                   transaction was one incident among many. 128% width shows
                   about 78% of the plate horizontally and 48% vertically — a
                   22% tighter crop that walks the far-left desk and the outer
                   archive bays off the edges and leaves the operator, the desk
                   and the scribe holding the middle.

                   THE VERTICAL ANCHOR IS 48%, NOT CENTRE. The temple has to
                   survive above the desk or the hall stops being a hall, and
                   the counter has to land low enough that the dissolve and the
                   contract card both meet it. 48% puts the visible window at
                   roughly a quarter to three-quarters of the plate: ceiling at
                   the top, counter across the bottom third.

                   This is a crop, not a fix. The plate is still a panorama being
                   asked to behave like a portrait of one transaction, and the
                   real answer is a purpose-built engraving. */
                background: url("/assets/images/trading-hall.webp") 50% 48% / 128% auto no-repeat;
                mix-blend-mode: multiply;
                /* AN ASYMMETRIC DISSOLVE, BECAUSE THE TWO SIDES HAVE DIFFERENT
                   JOBS. One ellipse centred at 50% produced a boundary that was
                   a perfect mirror — deepest at the middle, identical at both
                   edges — and a symmetrical fall on all four sides is the
                   definition of a vignette, which is what it read as.

                   The page is not symmetrical. The headline sits bottom-LEFT and
                   needs paper under it; the contract card sits bottom-RIGHT and
                   provides its own separation, so ink there is wanted rather
                   than tolerated. So:

                     THE MAIN ELLIPSE MOVES RIGHT, 50% -> 58%, which carries the
                     deepest ink under the desk and the card instead of under
                     the middle of nothing.

                     A SECOND ELLIPSE at 66%/14% takes the left side down
                     further. Because the layers intersect, the boundary is the
                     LOWER ENVELOPE of two curves rather than one smooth arc, so
                     it acquires an inflection where they cross — which is the
                     thing that stops it reading as a shape.

                     THE FIRST PAIR I TRIED WAS BACKWARDS. An ellipse anchored
                     LEFT cuts the RIGHT side, which took ink out from under the
                     card and left it under the headline: the exact inverse of
                     the brief. The envelope was simulated before shipping rather
                     than eyeballed. The corrected pair measures 70 / 76 / 83 /
                     87 / 89 across the left half, peaks at 58% under the desk,
                     and holds 12-16 points more ink on the right than at the
                     mirrored left column.

                     THE RIGHT SIDE FADE SHRINKS, 13% -> 6%. The card is already
                     a hard edge there; fading the plate as well was separating
                     two things that were separate.

                   Four layers, all intersect, so alpha is simply the minimum of
                   four shapes. Mixing composite operators is where masks start
                   behaving differently across engines; min() cannot surprise
                   anyone. */
                -webkit-mask-image:
                    radial-gradient(118% 74% at 58% 28%, #000 82%, rgba(0,0,0,.55) 93%, transparent 100%),
                    radial-gradient(110% 86% at 66% 14%, #000 80%, rgba(0,0,0,.45) 92%, transparent 100%),
                    linear-gradient(to bottom, transparent 0%, #000 8%, #000 100%),
                    linear-gradient(to right, transparent 0%, #000 12%, #000 94%, transparent 100%);
                -webkit-mask-composite: source-in, source-in, source-in, source-in;
                mask-image:
                    radial-gradient(118% 74% at 58% 28%, #000 82%, rgba(0,0,0,.55) 93%, transparent 100%),
                    radial-gradient(110% 86% at 66% 14%, #000 80%, rgba(0,0,0,.45) 92%, transparent 100%),
                    linear-gradient(to bottom, transparent 0%, #000 8%, #000 100%),
                    linear-gradient(to right, transparent 0%, #000 12%, #000 94%, transparent 100%);
                mask-composite: intersect, intersect, intersect, intersect;
                will-change: transform;
            }

            /* ══ DEPTH ══════════════════════════════════════════════════════
               Three planes out of one flat plate, by taking ink AWAY from the
               far one rather than adding haze to it.

               The top third — temple, ceiling, upper architecture — loses
               density, so it recedes the way distance actually works in an
               engraving: fewer, lighter lines. The archive wall on the right
               gains it, because that corner is the deepest shadow in the hall
               and holding it dark is what gives the counter something to be
               brighter than. */
            .xh-band-depth {
                position: absolute;
                inset: 0;
                pointer-events: none;
                mix-blend-mode: multiply;
                background:
                    radial-gradient(110% 78% at 82% 44%, rgba(74,58,36,.17), rgba(74,58,36,0) 56%),
                    /* THE WINGS FALL OFF. A tenth of a stop of extra ink down
                       the outer 24% of each side, so the hall darkens toward the
                       frame and the eye is left with one bright place to go.
                       This is the other half of the focal point — brightening
                       the desk alone raises the whole scene's midpoint; taking
                       the edges down is what makes the desk read as brighter
                       THAN something. */
                    linear-gradient(to right, rgba(70,55,35,.11) 0%, rgba(70,55,35,0) 24%, rgba(70,55,35,0) 76%, rgba(70,55,35,.11) 100%),
                    linear-gradient(to bottom, rgba(70,55,35,.05) 0%, rgba(70,55,35,0) 34%);
            }
            /* ══ LIGHT ══════════════════════════════════════════════════════
               The brightest point in the hall falls on the counter, where the
               contract is laid. screen only ever lightens, and at .34 over a
               tightened ellipse it is a change in exposure across the desk, not
               a glow with an edge — there is no ring anywhere to find.
               .30 -> .34 and the ellipse pulled in from 58%x46% to 52%x42%: the
               same light, concentrated on less, which is what raises the desk
               about a tenth of a stop above everything around it. */
            .xh-band-light {
                position: absolute;
                inset: 0;
                pointer-events: none;
                mix-blend-mode: screen;
                background: radial-gradient(48% 40% at 54% 68%, rgba(255,246,226,.36), rgba(255,246,226,0) 72%);
                /* THE ONE THING THAT MOVES. The hall's light breathes between
                   90% and 100% over fifteen seconds — about three points of
                   actual alpha on a .30 layer, which is under the threshold at
                   which anyone can point to it and say what changed. Nothing
                   else in the scene animates, and that is the whole design: one
                   slow sign of life reads as a real room, two reads as a screen
                   saver. Opacity only, so it composites and never repaints. */
                animation: xh-lamp 15s ease-in-out infinite alternate;
            }
            @keyframes xh-lamp { from { opacity: .90; } to { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) {
                .xh-band-light { animation: none; }
            }
            /* ══ ATMOSPHERE ═════════════════════════════════════════════════
               A FURTHER 12% OF CONTRAST OUT OF THE FAR CROWD, and it is done by
               LIFTING BLACKS rather than by laying haze over them. screen raises
               the darkest values and leaves the lightest alone, which compresses
               the range from below — which is precisely what distance does to
               contrast in air, and precisely what an engraver imitates with
               thinner, wider-spaced lines in the background.

               That is a different operation from the fog this hero started with:
               fog reduced everything uniformly toward beige and flattened the
               scene; this reduces only the far plane and therefore INCREASES the
               separation between it and the counter. The crowd falls back toward
               texture and the foreground figures gain the room to dominate,
               which is what makes the hall read as big.

               Shaped to miss the desk entirely — the ellipse is centred at 46%
               height and fades out well above the counter, so nothing the reader
               is meant to look at loses a single step of contrast. */
            .xh-band-air {
                position: absolute;
                inset: 0;
                pointer-events: none;
                mix-blend-mode: screen;
                background:
                    radial-gradient(90% 52% at 50% 30%, rgba(246,238,221,.20), rgba(246,238,221,0) 72%),
                    linear-gradient(to bottom, rgba(246,238,221,.13) 0%, rgba(246,238,221,.06) 38%, rgba(246,238,221,0) 62%);
            }
            /* THE FOUR OVERLAY LABELS ARE GONE — kicker, reference block, motto
               and charter. They were set over the engraving itself, and once the
               plate was cropped in 22% there was no quiet ground left under any
               of them: at 10-12px on a busy sepia field they measured as unread
               marks rather than text, which is worse than absent. The engraving
               now carries no type at all, and everything those lines said is
               said better by the headline directly beneath it.
               .xh-band-inner went with them, since it existed only to hold them.
               .xh-mark stays — the contract card still uses it. */
            /* The rotated square with an inner hairline — the same positional
               glyph the drawer and the fork section use. */
            .xh-mark {
                width: 9px; height: 9px; background: #5E1420;
                transform: rotate(45deg); display: inline-block; position: relative; flex: none;
            }
            .xh-mark::after { content: ""; position: absolute; inset: 2.2px; border: .5px solid rgba(255,246,228,.30); }
            .xh-mark.sm { width: 7px; height: 7px; }
            .xh-mark.sm::after { inset: 1.6px; }

            /* ---- the status line, printed on the plate ----
               THE BAND EARNS ITS PLACE BY SAYING SOMETHING TRUE. Every figure
               here comes from MARKET_STATS, the same object the board's
               odometers read, so the top of the page and the middle of it
               cannot print different numbers for the same fact.

               It sits on the plate rather than under it because the masthead is
               150px and a separate strip below would cost another 40 — the band
               has quiet paper at its lower left where the dissolve has already
               taken the ink out, which is exactly where type wants to be. */
            .xh-status {
                position: absolute;
                left: 60px; bottom: 22px; z-index: 2;
                display: flex; align-items: center; gap: 16px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase;
                color: #4A4234;
            }
            .xh-live { display: inline-flex; align-items: center; gap: 9px; color: #3F5A31; }
            /* The one moving thing in the masthead, and it is 6px wide. A live
               market should have a pulse; two would be a dashboard. */
            .xh-live i {
                width: 6px; height: 6px; border-radius: 50%; background: #4E6B3E;
                box-shadow: 0 0 0 0 rgba(78,107,62,.4);
                animation: xh-pulse 2.6s ease-out infinite;
            }
            @keyframes xh-pulse {
                0%   { box-shadow: 0 0 0 0 rgba(78,107,62,.4); }
                70%  { box-shadow: 0 0 0 6px rgba(78,107,62,0); }
                100% { box-shadow: 0 0 0 0 rgba(78,107,62,0); }
            }
            @media (prefers-reduced-motion: reduce) { .xh-live i { animation: none; } }
            .xh-sep { width: 1px; height: 11px; background: rgba(70,55,35,.30); display: block; }
            .xh-stat { color: #4A4234; }
            /* The figure is the message; the noun after it is the caption. Serif
               at 14 against mono at 10.5 is enough separation without a second
               colour. */
            .xh-stat b {
                font-family: "Cormorant Garamond", Georgia, serif;
                font-size: 14px; font-weight: 600; letter-spacing: .04em;
                color: var(--ink, #211B12); margin-right: 5px;
            }

            /* ---- actions ---- */
            .xh-actions {
                max-width: 1440px; margin: 0 auto;
                padding: 26px 60px 30px;
                display: flex; align-items: center; gap: 26px;
            }
            .xh-btn {
                display: inline-flex; align-items: center; gap: 12px;
                background: #7C1D2B; color: #F6EEDD;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11.5px; letter-spacing: .22em; text-transform: uppercase;
                padding: 15px 28px; border: 1px solid #5E1420; border-radius: 2px;
                text-decoration: none; cursor: pointer;
                box-shadow: 0 8px 20px rgba(94,20,32,.20);
                transition: background .2s ease, transform .2s ease, box-shadow .2s ease;
            }
            .xh-btn:hover { background: #5E1420; transform: translateY(-1px); box-shadow: 0 12px 26px rgba(94,20,32,.26); }
            .xh-btn:active { transform: translateY(0); }
            .xh-btn .a { opacity: .8; }
            .xh-learn {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
                color: #574E3D; text-decoration: none;
                border-bottom: 1px solid rgba(70,55,35,.30); padding-bottom: 4px;
                background: none; border-left: 0; border-right: 0; border-top: 0; cursor: pointer;
                transition: color .2s ease, border-color .2s ease;
            }
            .xh-learn:hover { color: #211B12; border-bottom-color: #7C1D2B; }
            .xh-learn .a { color: #7C1D2B; }

            /* ---- responsive ----
               No column collapse to manage any more: the masthead is a band and
               a row of buttons, so the only things that move are the gutters and
               the band's height. */
            @media (max-width: 1180px) {
                .xh-actions { padding: 24px 40px 28px; }
                .xh-status { left: 40px; }
            }
            @media (max-width: 1000px) {
                .xh-actions { padding: 22px 32px 26px; }
                .xh-status { left: 32px; bottom: 18px; gap: 13px; font-size: 10px; letter-spacing: .16em; }
                .xh-stat b { font-size: 13px; }
            }
            @media (max-width: 700px) {
                /* The escrow figure goes first on a phone — the open-contract
                   count is the one a trader checks, and three figures plus two
                   rules will not sit on 360px without shrinking the type past
                   readable. The number is still on the board below. */
                .xh-status { left: 22px; bottom: 14px; gap: 10px; font-size: 9px; letter-spacing: .14em; }
                .xh-status .xh-sep:last-of-type, .xh-status .xh-stat:last-of-type { display: none; }
                .xh-stat b { font-size: 12px; margin-right: 4px; }
                .xh-actions { flex-direction: column; align-items: stretch; gap: 14px; padding: 20px 22px 24px; }
                .xh-btn { justify-content: center; }
                .xh-learn { text-align: center; }
            }

            /* Oxblood Buttons — #7A1C29 background, #FFF8F5 text, #54111B hover */
            .eq .eq-btn-primary,
            .eq button.eq-btn-primary,
            .eq button[class*="-cta"] {
                background: #7A1C29 !important;
                color: #FFF8F5 !important;
                padding: 14px 28px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: .16em;
                text-transform: uppercase;
                border: 1px solid #7A1C29 !important;
                cursor: pointer;
                border-radius: var(--r, 2px);
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(122, 28, 41, 0.2);
            }
            .eq .eq-btn-primary:hover,
            .eq button.eq-btn-primary:hover,
            .eq button[class*="-cta"]:hover {
                background: #54111B !important;
                border-color: #54111B !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(84, 17, 27, 0.3);
            }
            /* .eq-link-more went with the old hero. Its replacement is
               .xh-learn, which is a button rather than an anchor because it
               scrolls the page rather than navigating anywhere -- an href="#"
               that a handler cancels is a link that lies about where it goes. */

            /* --- MARKET SECTION HEADER & RECONCILED STATS --- */
            .eq-market-header {
                padding: 40px 32px 24px;
                max-width: 1300px;
                margin: 0 auto;
            }
            .eq-market-title {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 36px;
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                margin-bottom: 12px;
            }
            .eq-market-title strong { font-weight: 800; color: var(--blood, #7A1C29); }
            .eq-market-live {
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                color: var(--ink-3, #6E7686);
                text-transform: uppercase;
                letter-spacing: .16em;
                margin-bottom: 32px;
            }
            .eq-market-dot {
                width: 6px; height: 6px;
                background: var(--win, #186B4A);
                border-radius: 50%;
                animation: dotPulse 2s ease-in-out infinite;
            }
            @keyframes dotPulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            /* Mechanical Odometer Stat Strip */
            .eq-stats-strip {
                display: flex;
                gap: 64px;
                margin-bottom: 40px;
                padding: 20px 32px;
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                box-shadow: var(--lift);
            }
            .eq-stat-group { display: flex; flex-direction: column; gap: 6px; }
            .eq-stat-val {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 30px;
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                font-variant-numeric: tabular-nums;
            }
            .eq-stat-lbl {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                text-transform: uppercase;
                letter-spacing: .16em;
                color: var(--ink-3, #6E7686);
            }

            /* --- CONTROLS & TABS --- */
            .eq-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 14px;
                border-bottom: 1px solid var(--rule, #DCD5C6);
                margin-bottom: 24px;
            }
            .eq-tabs { display: flex; gap: 24px; }
            .eq-tab {
                padding: 8px 0;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                color: var(--ink-3, #6E7686);
                background: none;
                border: none;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: .16em;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
            }
            .eq-tab.active {
                color: var(--ink, #0E1420) !important;
                border-bottom-color: var(--blood, #7A1C29) !important;
            }
            .eq-tab:hover { color: var(--ink, #0E1420); }

            /* ═══ SOLO SOURCE PICKER ═══ */
            .ss { --ss-ease: cubic-bezier(.22,1,.36,1); margin: 0 0 8px; }
            .ss * { box-sizing: border-box; }
            .ss p, .ss h2, .ss ul { margin: 0; }
            .ss-eyebrow { display:flex; align-items:center; font-family:var(--mono,'JetBrains Mono',monospace); font-size:10px; letter-spacing:.2em; color:var(--ink-3,#8C877B); margin-bottom:18px; }
            .ss-mark { display:inline-block; width:26px; height:6px; margin-right:11px; border-top:2px solid var(--blood,#7A1C29); border-bottom:2px solid var(--blood,#7A1C29); }
            .ss-title { font-family:var(--display,'Archivo',sans-serif); font-weight:700; font-size:clamp(28px,4.6vw,46px); letter-spacing:-.032em; line-height:1.02; margin-bottom:18px; max-width:none; color:var(--ink,#1A1A18); }
            .ss-title em { font-style:normal; color:var(--blood,#7A1C29); }
            .ss-lede { font-family:var(--display,'Archivo',sans-serif); font-weight:500; font-size:15px; line-height:1.72; color:var(--ink-2,#4A463E); max-width:56ch; margin-bottom:38px; }

            .ss-step, .ss-metric {
                display:flex; flex-direction:column; text-decoration:none; color:inherit;
                background:var(--plate,#FBFAF6); padding:22px 20px 20px;
                border-left:1px solid var(--rule-soft,#E6E1D6);
                opacity:0; transform:translateY(16px);
                transition:opacity 620ms var(--ss-ease) var(--d,0ms), transform 620ms var(--ss-ease) var(--d,0ms), background 280ms var(--ss-ease);
            }
            /* Reveal ADDS motion to content that is already in the DOM; it is never
               what makes the content exist. The JS forces data-seen="true" on a
               timeout so a missed observer can't leave a blank bordered box. */
            .ss[data-seen="true"] .ss-step, .ss-metric { opacity:1; transform:none; }
            /* Last-resort paint. If the transition never actually ran — throttled
               tab, paused animation timeline, sleeping compositor — the cards must
               still be on screen. Skips the transition entirely rather than
               waiting on one that may never tick. */
            .ss.ss-forced .ss-step, .ss-metric { opacity:1 !important; transform:none !important; transition:none !important; }



            .ss-foot { margin-top:auto; border-top:1px solid var(--rule,#DCD5C6); padding-top:14px; }
            .ss-oracle { display:block; font-family:var(--mono,'JetBrains Mono',monospace); font-size:9.5px; letter-spacing:.11em; color:var(--ink-3,#8C877B); margin-bottom:10px; }
            .ss-go { display:inline-block; font-family:var(--mono,'JetBrains Mono',monospace); font-size:12px; color:var(--blood,#7A1C29); border-bottom:1px solid var(--blood,#7A1C29); padding-bottom:3px; transition:transform 260ms var(--ss-ease), opacity 200ms ease; }
            .ss-metric:hover .ss-go { transform:translateX(4px); opacity:.75; }

            /* ── Bank-first steps ── */
            .ss-step {
                display:grid; grid-template-columns:240px 1fr; gap:28px;
                border:1px solid var(--rule,#DCD5C6); background:var(--plate,#FBFAF6);
                padding:28px; margin-top:16px;
            }
            .ss-step-side { display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
            .ss-step-main { min-width:0; }
            .ss-step-hd { font-family:var(--display,'Archivo',sans-serif); font-weight:700; font-size:20px; letter-spacing:-.025em; line-height:1.15; color:var(--ink,#1A1A18); margin:0; }
            .ss-step-n { font-family:var(--mono,'JetBrains Mono',monospace); font-size:10px; letter-spacing:.16em; color:var(--blood,#7A1C29); }
            .ss-step-body { font-size:13.5px; line-height:1.7; color:var(--ink-2,#4A463E); max-width:74ch; margin:0 0 18px; }
            .ss-primary-wrap { padding:6px 0 2px; }
            .ss-primary { display:inline-flex !important; width:max-content; max-width:100%; align-items:center; gap:10px; background:var(--blood,#7A1C29); color:#fff; border:none; cursor:pointer; font-family:var(--mono,'JetBrains Mono',monospace); font-size:12px; letter-spacing:.08em; text-transform:uppercase; padding:14px 22px; transition:background 200ms ease, transform 200ms ease; }
            .ss-primary:hover { background:#54111B; transform:translateY(-1px); }
            .ss-primary-sub { font-size:9.5px; letter-spacing:.1em; opacity:.72; text-transform:none; }
            .ss .ss-micro { margin-top:18px; font-family:var(--display,'Archivo',sans-serif); font-size:12.5px; line-height:1.7; color:var(--ink-2,#4A463E); }

            /* Step 03 is unreachable until the bank is connected: no metric can be
               chosen before the source that settles it exists. Visual dimming AND a
               pointer-events block, so it cannot be clicked through. */
            /* Step 03 renders at full opacity. The NEEDS STRIPE / NEEDS SHOPIFY tags
               already communicate locking per-card, and dimming the whole block hid
               "Money received" — the one metric that is ready the moment they
               connect. Only the pointer-events block remains, so a metric still
               cannot be chosen before the bank that settles it exists. */
            .ss-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:stretch; gap:1px; background:var(--rule,#DCD5C6); border:1px solid var(--rule,#DCD5C6); margin-top:4px; }
            /* The gate is behavioural only — no dimming, so "Money received" (ready
               the moment they connect) stays legible. */
            .ss-gated .ss-metrics { pointer-events:none; }
            /* BANK VERIFIED is a tag, not a second title: 9px, letterspaced, green. */
            .ss-tag { font-family:var(--mono,'JetBrains Mono',monospace); font-size:9px; letter-spacing:.13em; color:var(--win,#186B4A); border:1px solid #9AC0AE; background:#E9F1ED; padding:3px 6px; white-space:nowrap; }
            .ss-gate-badge { font-family:var(--mono,'JetBrains Mono',monospace); font-size:8.5px; letter-spacing:.13em; color:var(--ink-3,#8C877B); border:1px solid var(--rule,#DCD5C6); padding:3px 6px; white-space:nowrap; }
            .ss[data-bank="connected"] .ss-gated { opacity:1; }
            .ss[data-bank="connected"] .ss-gated .ss-metrics { pointer-events:auto; filter:none; }
            .ss[data-bank="connected"] .ss-gate-badge { display:none; }

            .ss-sources { display:flex; gap:16px; flex-wrap:wrap; margin-top:24px; padding:16px 20px; border:1px solid var(--rule,#DCD5C6); background:var(--plate-alt,#F5F2EA); }
            .ss-sources-k { flex:0 0 auto; font-family:var(--mono,'JetBrains Mono',monospace); font-size:9.5px; letter-spacing:.15em; color:var(--blood,#7A1C29); padding-top:2px; }
            .ss-sources-v { flex:1 1 320px; font-size:12px; line-height:1.7; color:var(--ink-2,#4A463E); }
            /* The "nothing here commits you" promise. Display face, not mono fine
               print — it was the least readable line on the page. */
            .ss-promise { margin-top:16px; font-family:var(--display,'Archivo',sans-serif); font-size:12.5px; line-height:1.7; color:var(--ink-2,#4A463E); max-width:64ch; }

            /* ── Metric choices ── */
            .ss-metric { background:var(--plate,#FBFAF6); padding:18px; display:block; align-self:stretch; }
            .ss-metric.ready { background:#F7ECEE; }
            .ss-m-top { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; min-height:20px; }
            .ss-m-name { font-family:var(--display,'Archivo',sans-serif); font-weight:700; font-size:17px; letter-spacing:-.02em; }
            .ss-metric.ready .ss-m-name { color:var(--blood,#7A1C29); }
            .ss-m-req { font-family:var(--mono,'JetBrains Mono',monospace); font-size:8.5px; letter-spacing:.13em; color:var(--ink-3,#8C877B); border:1px solid var(--rule,#DCD5C6); padding:3px 6px; white-space:nowrap; }
            .ss-m-what { font-size:12px; line-height:1.6; color:var(--ink-2,#4A463E); margin-bottom:14px; }
            .ss-m-foot { margin-top:14px; border-top:1px dotted var(--rule,#DCD5C6); padding-top:12px; }
            /* State line carries the user's ACTUAL position once connected
               ("4 of 6 months — unlocks in March"), not the generic rule. */
            .ss-m-state { display:block; font-family:var(--mono,'JetBrains Mono',monospace); font-size:10px; line-height:1.6; color:var(--ink-3,#8C877B); margin-bottom:10px; }
            .ss-metric.ready .ss-m-state { color:var(--win,#186B4A); }
            .ss-m-state:empty { display:none; margin:0; }
            /* Never a dead end: a locked metric states the door that is open. */
            .ss-m-alt { margin-top:10px; font-family:var(--mono,'JetBrains Mono',monospace); font-size:9.5px; line-height:1.6; color:var(--ink-3,#8C877B); border-left:2px solid var(--rule,#DCD5C6); padding-left:8px; }

            @media (max-width:760px) {
                .ss-step { grid-template-columns:1fr; gap:14px; padding:20px; }
                .ss-metrics { grid-template-columns:1fr; }
            }
            @media (prefers-reduced-motion:reduce) {
                .ss-step, .ss-metric, .ss-go { transition:none !important; }
                .ss-step, .ss-metric { opacity:1; transform:none; }
            }

            .eq-search-wrap {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .eq-search-box {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 10px 16px;
                font-size: 13px;
                width: 320px;
                max-width: 100%;
                font-family: var(--body, 'Public Sans', sans-serif);
                color: var(--ink, #0E1420);
                transition: border-color 0.2s ease;
            }
            .eq-search-box:focus {
                outline: none;
                border-color: var(--ink, #0E1420);
            }
            .eq-btn-rules {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                padding: 10px 18px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                cursor: pointer;
                color: var(--ink-2, #4A5464);
                transition: all 0.2s ease;
            }
            .eq-btn-rules:hover {
                border-color: var(--ink, #0E1420);
                color: var(--ink, #0E1420);
            }

            /* --- DOMAIN FILTER BAR --- */
            .eq-filter-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 28px;
            }
            /* Wrap rather than run off-screen: at 390px the four pills need ~409px,
               which pushed FINANCE outside the viewport and made it unclickable. */
            .eq-pills { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .eq-filter-lbl {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                color: var(--ink-3, #6E7686);
                text-transform: uppercase;
                letter-spacing: .16em;
                margin-right: 12px;
            }
            .eq-pill {
                padding: 6px 16px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                font-weight: 600;
                letter-spacing: .12em;
                text-transform: uppercase;
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                background: var(--plate, #FFFDF9);
                cursor: pointer;
                color: var(--ink-2, #4A5464);
                transition: all 0.2s ease;
            }
            /* Active "ALL" pill set to #0E1420, NOT black */
            .eq-pill.active {
                background: #0E1420 !important;
                color: #FFFDF9 !important;
                border-color: #0E1420 !important;
            }
            .eq-pill:hover:not(.active) {
                border-color: var(--ink-3, #6E7686);
                color: var(--ink, #0E1420);
            }

            .eq-status-operational {
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: .16em;
                color: var(--ink-3, #6E7686);
            }
            .eq-status-operational .dot { width: 5px; height: 5px; background: var(--win, #186B4A); border-radius: 50%; }

            /* --- UNIVERSAL GRID BANNER --- */
            .eq-grid-banner {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px 24px;
                background: rgba(226, 219, 208, 0.35);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                margin-bottom: 16px;
                text-align: center;
            }
            .eq-grid-banner .mono {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                letter-spacing: .16em;
                text-transform: uppercase;
                color: var(--ink-2, #4A5464);
            }

            /* --- LIVE COMMIT TICKER --- */
            .eq-commit-ticker {
                display: flex;
                align-items: center;
                padding: 10px 20px;
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                margin-bottom: 28px;
                height: 38px;
                overflow: hidden;
            }
            .eq-ticker-label {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px;
                font-weight: 700;
                letter-spacing: .16em;
                text-transform: uppercase;
                color: var(--blood, #7A1C29);
                margin-right: 16px;
                padding-right: 16px;
                border-right: 1px solid var(--rule, #DCD5C6);
                white-space: nowrap;
            }
            .eq-ticker-body {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                letter-spacing: .14em;
                color: var(--ink-2, #4A5464);
                text-transform: uppercase;
                transition: transform 380ms cubic-bezier(.22,.85,.26,1), opacity 380ms ease;
                white-space: nowrap;
            }

            /* --- CARD GRID & PLATES --- */
            .eq-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 24px;
            }
            .eq-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                box-shadow: var(--lift);
                padding: 24px;
                display: flex;
                flex-direction: column;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            .eq-card:hover {
                transform: translateY(-2px);
                border-color: var(--blood, #7A1C29);
                box-shadow: 0 4px 16px rgba(14, 20, 32, 0.08);
            }
            .eq-card.is-committed {
                border-color: #7A1C29 !important;
                border-width: 1.5px !important;
            }
            .eq-card.is-filled {
                background: var(--paper-alt, #EFEAE0) !important;
                border-color: var(--rule, #DCD5C6) !important;
            }
            .eq-card.is-filled .eq-card-title,
            .eq-card.is-filled .eq-stake-val {
                color: var(--ink-3, #6E7686) !important;
            }

            /* Seal Stamp Overlay (Item 1 & Item 5) */
            .cl-seal-stamp {
                position: absolute;
                top: 42%; right: 12px;
                pointer-events: none;
                z-index: 20;
                border: 2px double #7A1C29;
                color: #7A1C29;
                padding: 6px 12px;
                text-align: center;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-weight: 700;
                letter-spacing: .16em;
                text-transform: uppercase;
                border-radius: 2px;
                background: rgba(247, 244, 237, 0.92);
                display: none;
                flex-direction: column;
                align-items: center;
                line-height: 1.2;
            }
            .cl-seal-stamp.filled-stamp {
                border-color: var(--ink-3, #6E7686);
                color: var(--ink-3, #6E7686);
            }
            .cl-seal-stamp.active {
                display: flex;
                animation: clPress 460ms cubic-bezier(.22,.85,.26,1) forwards;
            }
            @keyframes clPress {
                0% { transform: scale(2.6) rotate(-13deg); opacity: 0; }
                70% { transform: scale(0.95) rotate(-13deg); opacity: 0.9; }
                100% { transform: scale(1) rotate(-13deg); opacity: 0.78; }
            }

            /* Restructured 2-line Card Header */
            .eq-card-header-line1 {
                display: flex;
                justify-content: flex-start;
                margin-bottom: 8px;
            }
            .eq-card-header-line2 {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                margin-bottom: 16px;
            }

            .eq-card-title {
                font-family: var(--display, 'Archivo', sans-serif);
                font-weight: 700;
                letter-spacing: -.026em;
                color: var(--ink, #0E1420);
                font-size: 18px;
                margin: 0 0 12px;
                line-height: 1.25;
            }
            .eq-card-provider {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
            }

            /* Monochromatic platform dots */
            .eq-platform-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--ink-3, #6E7686);
            }

            .eq-tier-badge {
                padding: 3px 8px;
                font-size: 9.5px;
                font-weight: 700;
                border-radius: 2px;
                text-transform: uppercase;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                letter-spacing: .12em;
            }
            .eq-tier-badge.controlled { background: rgba(24, 107, 74, 0.08); color: #186B4A; border: 1px solid rgba(24, 107, 74, 0.2); }
            .eq-tier-badge.elevated { background: rgba(154, 52, 18, 0.08); color: #9A3412; border: 1px solid rgba(154, 52, 18, 0.2); }
            .eq-tier-badge.maximum { background: rgba(122, 28, 41, 0.08); color: #7A1C29; border: 1px solid rgba(122, 28, 41, 0.2); }

            .eq-card-divider {
                border-bottom: 1px dotted var(--rule, #DCD5C6);
                margin: 16px 0;
            }

            .eq-card-stake-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            .eq-stake-val {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 20px;
                font-weight: 700;
                letter-spacing: -.02em;
                color: var(--ink, #0E1420);
                font-variant-numeric: tabular-nums;
            }
            .eq-stake-separator {
                width: 1px;
                height: 28px;
                background: var(--rule, #DCD5C6);
            }

            /* Item 4: Hover reveals position line (smooth max-height reveal within existing space) */
            .eq-position-info {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: max-height 260ms cubic-bezier(.22,.85,.26,1), opacity 260ms ease, margin 260ms ease;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px;
                letter-spacing: .12em;
                color: var(--ink-3, #6E7686);
                text-transform: uppercase;
                text-align: center;
                margin-top: 0;
                white-space: nowrap;
            }
            .eq-card:hover .eq-position-info {
                max-height: 24px;
                opacity: 1;
                margin-top: 8px;
                margin-bottom: 12px;
            }

            /* Card CTA Button — Oxblood #7A1C29, text #FFF8F5, hover #54111B */
            .eq-card-cta {
                background: #7A1C29 !important;
                color: #FFF8F5 !important;
                border: 1px solid #7A1C29 !important;
                padding: 14px 20px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .16em;
                width: 100%;
                cursor: pointer;
                border-radius: var(--r, 2px);
                margin-top: auto;
                transition: all 0.2s ease, transform 90ms ease, background-color 90ms ease;
                box-shadow: 0 1px 3px rgba(122, 28, 41, 0.2);
            }
            .eq-card-cta:hover:not(:disabled) {
                background: #54111B !important;
                border-color: #54111B !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(84, 17, 27, 0.3);
            }
            .eq-card-cta:active:not(:disabled) {
                transform: translateY(2px) !important;
                background: #54111B !important;
            }
            .eq-card-cta:disabled {
                opacity: 0.75;
                cursor: not-allowed;
            }

            /* The .eq-paths / .eq-path-card / .eq-path-cta block was removed
               with the "Two ways to compete." cards it styled. Those cards used
               --plate #FFFDF9, a WHITE fill — the one thing the single-document
               pass took off the rest of the site — and this page was the last
               place it survived. StructuresSection carries its own scoped
               styles, so nothing here replaces them. */

            /* --- MECHANISM SECTION --- */
            .eq-mechanism {
                max-width: 1300px; margin: 0 auto;
                padding: 60px 32px;
                border-top: 1px solid var(--rule, #DCD5C6);
            }
            .eq-mechanism-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
            }
            .eq-mech-card {
                padding: 36px 24px;
                background: var(--plate, #FFFDF9);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
            }
            .eq-mech-num {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 40px; font-weight: 700;
                color: var(--ink-4, #9AA0AC);
                line-height: 1; margin-bottom: 16px;
            }
            .eq-mech-label {
                font-family: var(--display, 'Archivo', sans-serif);
                font-size: 18px; font-weight: 700;
                margin-bottom: 10px; color: var(--ink, #0E1420);
            }
            .eq-mech-desc {
                font-size: 13.5px; color: var(--ink-2, #4A5464); line-height: 1.6;
            }

            /* --- RULES MODAL --- */
            .eq-modal-backdrop {
                display: none; position: fixed; inset: 0;
                background: rgba(14, 20, 32, 0.4); z-index: 1000;
                align-items: center; justify-content: center;
            }
            .eq-modal-backdrop.open { display: flex; }
            .eq-modal {
                background: var(--paper, #F7F4ED);
                border: 1px solid var(--rule, #DCD5C6);
                border-radius: var(--r, 2px);
                width: 540px; max-width: 90vw; max-height: 85vh;
                overflow-y: auto; padding: 32px;
                box-shadow: 0 16px 48px rgba(14, 20, 32, 0.15);
            }
            .eq-modal-header {
                display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
            }
            .eq-modal-title { font-family: var(--display, 'Archivo', sans-serif); font-size: 18px; font-weight: 700; color: var(--ink, #0E1420); }
            .eq-modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--ink-3, #6E7686); }

            /* Prefers-reduced-motion */
            
/* ═══════════ RIVALRIES SECTION STYLES ═══════════ */
.rv-section{position:relative;padding:48px 0;overflow:hidden}
.rv-ghost{position:absolute;top:100px;right:28px;color:var(--ink, #0E1420);opacity:.035;pointer-events:none;user-select:none}
@media(max-width:1140px){.rv-ghost{display:none}}
 
.rv-header{margin-bottom:34px}
.rv-eyebrow{display:flex;align-items:center;gap:11px;margin:0 0 22px;font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:10.5px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--blood, #7A1C29)}
 
.rv-stats{display:flex;flex-wrap:wrap;gap:20px 56px;padding:22px 26px;background:var(--plate, #FFFDF9);border:1px solid var(--rule, #DCD5C6);border-radius:var(--r,2px);box-shadow:var(--lift);margin-bottom:26px}
.rv-stat-val{margin:0 0 7px;font-family:var(--display, 'Archivo', sans-serif);font-size:30px;font-weight:700;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--ink, #0E1420)}
.rv-stat-val--win{color:var(--win, #186B4A)}
 
.rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(276px,1fr));gap:22px}
 
.rv-card{display:flex;flex-direction:column;background:var(--plate, #FFFDF9);border:1px solid var(--rule, #DCD5C6);border-radius:var(--r,2px);padding:20px 22px;box-shadow:var(--lift);transition:transform .32s ease,border-color .32s ease,box-shadow .32s ease}
.rv-card:hover{transform:translateY(-4px);border-color:var(--rule-strong, #BDB3A0);box-shadow:0 2px 4px rgba(14,20,32,.05),0 30px 56px -30px rgba(14,20,32,.4)}
.rv-card--open{border-color:var(--rule-strong, #BDB3A0);}
 
.rv-head{margin-bottom:14px}
.rv-badge{display:inline-block;padding:4px 10px;border-radius:20px;font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:9px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
.rv-badge--open{background:var(--blood-wash, #FBF3F4);color:var(--blood, #7A1C29);border:1px solid var(--blood-tint, #F5E6E8)}
.rv-badge--live{background:var(--win-wash, #F2F8F4);color:var(--win, #186B4A);border:1px solid var(--win-tint, #E6F1EA)}
 
.rv-meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
.rv-meta .mono{white-space:nowrap}
 
.rv-title{margin:0 0 8px;font-family:var(--display, 'Archivo', sans-serif);font-size:17px;font-weight:700;line-height:1.22;letter-spacing:-.026em;color:var(--ink, #0E1420);min-height:42px;}
.rv-domain{display:flex;align-items:center;gap:8px;margin:0}
.rv-dot{width:5px;height:5px;border-radius:50%;background:var(--ink-3, #6E7686);flex:none}
 
.rv-vs{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;margin:20px 0 12px;padding-top:16px;border-top:1px dotted var(--rule, #DCD5C6)}
.rv-side{min-width:0;display:flex;flex-direction:column;gap:4px}
.rv-handle{font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:12px;letter-spacing:.02em;color:var(--ink, #0E1420);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rv-handle--empty{color:var(--ink-4, #9AA0AC)}
.rv-delta{font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:17px;font-weight:500;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.rv-delta--lead{color:var(--win, #186B4A)}
.rv-delta--trail{color:var(--ink, #0E1420)}
.rv-delta--empty{color:var(--ink-4, #9AA0AC)}
 
.rv-divider{display:flex;flex-direction:column;align-items:center;gap:5px;flex:none}
.rv-vs-rule{width:1px;height:10px;background:var(--rule-strong, #BDB3A0)}
.rv-vs-label{font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:8.5px;letter-spacing:.2em;color:var(--ink-4, #9AA0AC)}
 
.rv-bar{display:flex;height:4px;overflow:hidden;background:var(--paper-deep,#E7E1D4)}
.rv-bar-a{background:var(--win, #186B4A)}
.rv-bar-gap{width:2px;background:var(--plate, #FFFDF9);flex:none}
.rv-bar-b{flex:1;background:var(--blood, #7A1C29)}
.rv-card--open .rv-bar-b{background:var(--paper-deep,#E7E1D4)}
 
.rv-stake{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px dotted var(--rule, #DCD5C6)}
.rv-per{margin:0;font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:16px;font-weight:500;font-variant-numeric:tabular-nums;color:var(--ink, #0E1420);white-space:nowrap}
.rv-per span{font-size:12px;color:var(--ink-3, #6E7686)}
.rv-pool{margin:4px 0 0;white-space:nowrap;font-family:var(--mono, 'IBM Plex Mono', monospace);font-size:10px;color:var(--ink-3, #6E7686);text-transform:uppercase;letter-spacing:.08em}
.rv-rail{flex:none;padding:4px 9px;border:1px solid var(--rule, #DCD5C6);border-radius:var(--r,2px);font-size:9px;font-family:var(--mono, 'IBM Plex Mono', monospace);letter-spacing:.12em;white-space:nowrap;color:var(--ink-3, #6E7686)}
 
.rv-cta{width:100%;margin-top:auto;padding-top:0;min-height:44px;margin-block-start:18px}
.rv-issue{width:100%;margin-top:22px;min-height:56px}
 
@media(max-width:480px){
  .rv-vs{gap:8px}
  .rv-delta{font-size:15px}
  .rv-handle{font-size:11px}
  .rv-stake{flex-direction:column;gap:10px}
  .rv-rail{align-self:flex-start}
  .rv-stats{gap:18px 32px;padding:18px 20px}
}

            @media (prefers-reduced-motion: reduce) {
                *, ::before, ::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }

            /* Responsive */
            @media (max-width: 1200px) {
                .eq-grid { grid-template-columns: repeat(2, 1fr); }
                .eq-mechanism-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 768px) {
                .eq-grid { grid-template-columns: 1fr; }
                .eq-mechanism-grid { grid-template-columns: 1fr; }
                .eq-stats-strip { flex-direction: column; gap: 20px; padding: 20px; }
            }
        </style>

        <div class="cl-grain" aria-hidden="true"></div>

        <div class="eq">
            <!-- Section 1: Masthead.
                 NOT A HERO, AND THAT IS THE WHOLE CHANGE. /market is in
                 protectedPaths — every reader is signed in and has capital in
                 escrow. The headline, the lede and the specimen contract were
                 selling a product to someone already using it, which is the
                 homepage's job and not this page's.

                 The band survives because it is the only thing carrying brand
                 continuity between the two surfaces; it just stops costing a
                 viewport. 306px -> 150px, and the mask, depth, light and
                 parallax layers are unchanged underneath. -->
            <div class="xh">
                <div class="xh-band">
                    <div class="xh-band-art" data-xh-par="0.12" aria-hidden="true"></div>
                    <div class="xh-band-depth" aria-hidden="true"></div>
                    <div class="xh-band-air" aria-hidden="true"></div>
                    <div class="xh-band-light" aria-hidden="true"></div>

                    <!-- THE BAND NOW SAYS SOMETHING TRUE INSTEAD OF SOMETHING
                         SALESY. Every figure here is read from MARKET_STATS,
                         the same constant the board's odometers use further
                         down, so the two can never disagree the way 312 and 528
                         did. One object, one source of truth. -->
                    <div class="xh-status">
                        <span class="xh-live"><i></i>Live Exchange</span>
                        <span class="xh-sep" aria-hidden="true"></span>
                        <span class="xh-stat"><b>${MARKET_STATS.openContracts}</b> Open</span>
                        <span class="xh-sep" aria-hidden="true"></span>
                        <span class="xh-stat"><b>${MARKET_STATS.openCapitalLabel}</b> in Escrow</span>
                    </div>
                </div>

                <!-- Two actions, both of which go somewhere that exists. The
                     primary is CREATE, not "Enter Exchange" — that scrolled to
                     a section of the page the reader was already on, which is a
                     scroll button wearing a CTA's clothes. /contracts/execute
                     is the job a signed-in reader came here to do and nothing
                     previously linked to it. -->
                <div class="xh-actions">
                    <button class="xh-btn" onclick="window.router.navigate('/contracts/execute')">Create Contract <span class="a" aria-hidden="true">&rarr;</span></button>
                    <button class="xh-learn" onclick="window.router.navigate('/market?type=rivalry')">Rivalry contracts <span class="a" aria-hidden="true">&rarr;</span></button>
                </div>
            </div>

            <!-- The Contract Structures section is REMOVED FROM THIS ROUTE.
                 It still renders on the landing page and the mobile landing —
                 StructuresSection.js is a shared component and is untouched.
                 Only this call site is gone, so /market drops straight from the
                 hero into the live board.

                 .ss-promise goes with it. It is the revocation notice that
                 belonged to the sources block inside that section; on its own,
                 between a hero and a market table, it is a sentence about bank
                 connections with nothing around it to attach to. The same notice
                 is still carried by the landing page's copy of the section. -->


            <!-- Section 3: Live Market Header & Mechanical Odometer Stats -->
            <section class="eq-market-header" id="live-market">
                <div class="mono-lbl" style="margin-bottom: 8px;">LIVE CLEARINGHOUSE</div>
                <h2 class="eq-market-title">Collateral <strong>Market.</strong></h2>
                <div class="eq-market-live">
                    <div class="eq-market-dot"></div>
                    Live — Updated <span id="last-updated" style="font-variant-numeric: tabular-nums;">04:20:00 PM</span>
                </div>

                <!-- Odometer Statistic Strip -->
                <div class="eq-stats-strip">
                    <div class="eq-stat-group">
                        <div class="eq-stat-val">$<span id="stat-capital">0</span>k</div>
                        <div class="eq-stat-lbl">OPEN CAPITAL</div>
                    </div>
                    <div class="eq-stat-group">
                        <div class="eq-stat-val" id="stat-contracts">0</div>
                        <div class="eq-stat-lbl">OPEN CONTRACTS</div>
                    </div>
                    <div class="eq-stat-group">
                        <div class="eq-stat-val">$<span id="stat-pool">0</span>k</div>
                        <div class="eq-stat-lbl">DAILY VOLUME</div>
                    </div>
                </div>

                <!-- Controls — sort tabs and DOMAIN filters relocated above the
                     Rivalry grid, which is the only thing they drive now that the
                     contract catalog is gone. -->
                <div class="eq-controls">
                    <div class="eq-search-wrap">
                        <button class="eq-btn-rules" id="btn-rules">Rules</button>
                    </div>
                    <div class="eq-status-operational">
                        SYSTEM STATUS <div class="dot"></div> OPERATIONAL
                    </div>
                </div>
            </section>

            <!-- ═══ SOLO SOURCE PICKER ═══
                 Replaces the old pre-priced contract catalog. No targets, no
                 multipliers, no stake ranges: every term is derived per person from
                 their own verified history after the examination, so any number
                 printed here would be decoration or a bait-and-switch.

                 Each source answers a different question, so nothing overlaps.
                 Bullets list only metrics with a real backing metric_type. -->
            <div class="eq-grid-container" style="padding: 0 32px; max-width: 1300px; margin: 0 auto;">
                <!-- Universal Clause Line -->
                <div class="eq-grid-banner">
                    <span class="mono">§ 3.1 &middot; ALL CONTRACTS FEATURE AUTOMATIC ORACLE TRACKING &middot; DEPOSITS RETURNED UPON VERIFIED GOAL SETTLEMENT</span>
                </div>

                <section class="ss" id="ss-root" data-seen="false" aria-labelledby="ss-title">
                    <p class="ss-eyebrow"><span class="ss-mark"></span>SOLO CONTRACTS</p>
                    <h2 class="ss-title" id="ss-title">Connect your bank.<br>Then choose <em>what you&rsquo;re measured on.</em></h2>
                    <p class="ss-lede">
                        Connect your bank and Collateral reads twelve months of your own history
                        before it offers you anything. Your target, your difficulty, and your
                        payout multiplier all come out of your numbers &mdash; not a menu.
                    </p>

                    <div class="ss-step" data-step="01">
                        <div class="ss-step-side">
                            <span class="ss-step-n">01</span>
                            <h3 class="ss-step-hd">Connect your bank</h3>
                        </div>
                        <div class="ss-step-main">
                            <p class="ss-step-body">
                                Read-only, through Plaid. Stripe and Shopify payouts land here too, so the
                                bank settles anything measured in dollars.
                            </p>
                            <div class="ss-primary-wrap">
                                <button class="ss-primary" id="ss-connect-bank" data-source="bank">
                                    Connect bank <span class="ss-primary-sub">Plaid &middot; read-only</span>
                                </button>
                            </div>
                            <p class="ss-micro">Nothing here commits you to a contract. Access is revocable at any time.</p>
                        </div>
                    </div>

                    <div class="ss-step ss-gated" data-step="02" id="ss-step-metrics">
                        <div class="ss-step-side">
                            <span class="ss-step-n">02</span>
                            <h3 class="ss-step-hd">Choose what you&rsquo;re measured on</h3>
                        </div>
                        <div class="ss-step-main">
                            <p class="ss-step-body">
                                Money is ready as soon as your bank is connected. The rest are counts, not money.
                            </p>

                            <div class="ss-metrics" id="ss-metrics">
                                <div class="ss-metric ready" data-metric="money" data-source="bank">
                                    <div class="ss-m-top">
                                        <span class="ss-m-name">Money received</span>
                                        <span class="ss-tag">BANK VERIFIED</span>
                                    </div>
                                    <p class="ss-m-what">Income that landed in your account, net of fees.</p>
                                    <div class="ss-m-foot">
                                        <span class="ss-m-state"></span>
                                        <span class="ss-go">Write this contract &rarr;</span>
                                    </div>
                                </div>

                                <div class="ss-metric locked" data-metric="mrr" data-source="mrr" data-platform="Stripe">
                                    <div class="ss-m-top">
                                        <span class="ss-m-name">MRR</span>
                                        <span class="ss-m-req">NEEDS STRIPE</span>
                                    </div>
                                    <p class="ss-m-what">Recurring revenue. Your bank can&rsquo;t see it.</p>
                                    <div class="ss-m-foot">
                                        <span class="ss-m-state"></span>
                                        <span class="ss-go">Connect Stripe &rarr;</span>
                                    </div>
                                </div>

                                <div class="ss-metric locked" data-metric="orders" data-source="orders" data-platform="Shopify">
                                    <div class="ss-m-top">
                                        <span class="ss-m-name">Orders</span>
                                        <span class="ss-m-req">NEEDS SHOPIFY</span>
                                    </div>
                                    <p class="ss-m-what">Order counts. Not a dollar figure.</p>
                                    <div class="ss-m-foot">
                                        <span class="ss-m-state"></span>
                                        <span class="ss-go">Connect Shopify &rarr;</span>
                                    </div>
                                </div>

                                <div class="ss-metric locked" data-metric="views" data-source="views" data-platform="YouTube">
                                    <div class="ss-m-top">
                                        <span class="ss-m-name">Views</span>
                                        <span class="ss-m-req">NEEDS YOUTUBE</span>
                                    </div>
                                    <p class="ss-m-what">Views. Never denominated in dollars.</p>
                                    <div class="ss-m-foot">
                                        <span class="ss-m-state"></span>
                                        <span class="ss-go">Connect YouTube &rarr;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ss-sources">
                        <span class="ss-sources-k">&sect; HOW SOURCES WORK</span>
                        <span class="ss-sources-v">
                            Your bank settles every contract. Stripe, Shopify and YouTube only
                            unlock metrics a bank statement can&rsquo;t see.
                        </span>
                    </div>

                    <p class="ss-promise">
                        No terms exist until your bank is connected and examined. Nothing here
                        commits you to a contract, and read access can be revoked at any time.
                    </p>
                </section>
            </div>

            <!-- Mechanism Section -->
            
            <!-- Open Rivalries Section -->
            <section style="max-width: 1300px; margin: 64px auto 0; padding: 0 32px;">
                <div style="border-top: 1px solid var(--rule, #DCD5C6); padding-top: 40px; margin-bottom: 24px;">
                    
<div style="position:relative;">
    <!-- Ghosted Background Mark (~120px, 3% opacity) -->
    <div style="position:absolute; right:0; top:-20px; pointer-events:none; opacity:0.03; color:var(--blood, #7A1C29);">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="M13 19l6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 13l2 2" />
            <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
            <path d="M11 19l-6-6" />
            <path d="M8 16l-4 4" />
            <path d="M5 13l-2 2" />
        </svg>
    </div>
    <div class="mono-lbl" style="margin-bottom: 8px; display:flex; align-items:center; gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blood, #7A1C29)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="M13 19l6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 13l2 2" />
            <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
            <path d="M11 19l-6-6" />
            <path d="M8 16l-4 4" />
            <path d="M5 13l-2 2" />
        </svg>
        OPEN RIVALRIES
    </div>
</div>
                    <h2 class="eq-market-title" style="font-size: 32px; margin-bottom: 8px;">Somebody has to <strong>lose.</strong></h2>
                    <p style="font-size: 14.5px; color: var(--ink-2, #4A5464); max-width: 580px; line-height: 1.6; margin: 0 0 24px;">Two operators, matched capital, one oracle. Join an open challenge or issue your own.</p>
                </div>

                <!-- Rivalry Stat Strip (Reconciled Subset of Page Totals) -->
                <div style="display: flex; gap: 48px; padding: 18px 28px; background: var(--plate, #FFFDF9); border: 1px solid var(--rule, #DCD5C6); border-radius: var(--r, 2px); box-shadow: var(--lift); margin-bottom: 28px;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="font-family: var(--display, 'Archivo', sans-serif); font-size: 24px; font-weight: 700; color: var(--ink, #0E1420); font-variant-numeric: tabular-nums;">4</div>
                        <div class="mono-lbl">OPEN CHALLENGES</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="font-family: var(--display, 'Archivo', sans-serif); font-size: 24px; font-weight: 700; color: var(--ink, #0E1420); font-variant-numeric: tabular-nums;">$184.2k</div>
                        <div class="mono-lbl">MATCHED CAPITAL</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="font-family: var(--display, 'Archivo', sans-serif); font-size: 24px; font-weight: 700; color: var(--win, #186B4A); font-variant-numeric: tabular-nums;">18</div>
                        <div class="mono-lbl">DUELS SETTLED THIS WEEK</div>
                    </div>
                </div>

                <!-- Sort tabs + DOMAIN filters. Relocated here from the page header:
                     they only drive the Rivalry board, and above the source picker
                     they read as picker filters that do nothing. -->
                <div class="eq-controls">
                    <div class="eq-tabs" id="eq-tabs">
                        <button class="eq-tab active" data-sort="trending_24h">TRENDING</button>
                        <button class="eq-tab" data-sort="new">NEW</button>
                        <button class="eq-tab" data-sort="closing_soon">CLOSING SOON</button>
                        <button class="eq-tab" data-sort="volume_24h">HIGH VOLUME</button>
                    </div>
                </div>
                <div class="eq-filter-bar">
                    <div class="eq-pills" id="eq-filters">
                        <span class="eq-filter-lbl">DOMAIN</span>
                        <button class="eq-pill active" data-category="all">ALL</button>
                        <button class="eq-pill" data-category="social">SOCIAL</button>
                        <button class="eq-pill" data-category="commerce">COMMERCE</button>
                        <button class="eq-pill" data-category="finance">FINANCE</button>
                    </div>
                </div>

                <!-- Rivalry Cards Grid -->
                <div class="eq-grid" id="rivalry-grid" style="margin-bottom: 28px;">
                    <!-- Rendered dynamically -->
                </div>

                <!-- Issue a Challenge CTA -->
                <button class="eq-btn-primary" style="width: 100%; text-align: center; padding: 16px;" onclick="window.router.navigate('/rivalry')">ISSUE A CHALLENGE &rarr;</button>
            </section>

            <section class="eq-mechanism">
                <div style="margin-bottom: 32px;">
                    <div class="mono-lbl" style="margin-bottom: 8px;">DETERMINISTIC PROTOCOL</div>
                    <h2 class="eq-market-title">Four steps to <strong>settlement.</strong></h2>
                </div>
                <div class="eq-mechanism-grid">
                    <div class="eq-mech-card">
                        <div class="eq-mech-num">01</div>
                        <div class="eq-mech-label">Commit</div>
                        <div class="eq-mech-desc">Stake capital against specific, measurable performance targets. Lock funds in custody.</div>
                    </div>
                    <div class="eq-mech-card">
                        <div class="eq-mech-num">02</div>
                        <div class="eq-mech-label">Monitor</div>
                        <div class="eq-mech-desc">Metrics are tracked in real-time through verified data adapters connected to authoritative sources.</div>
                    </div>
                    <div class="eq-mech-card">
                        <div class="eq-mech-num">03</div>
                        <div class="eq-mech-label">Verify</div>
                        <div class="eq-mech-desc">Automated oracle verification at the deadline. Deterministic. Transparent. No appeals.</div>
                    </div>
                    <div class="eq-mech-card">
                        <div class="eq-mech-num">04</div>
                        <div class="eq-mech-label">Settle</div>
                        <div class="eq-mech-desc">Variance is calculated against target. Capital is released to winner or returned upon verification.</div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Rules Modal -->
        <div class="eq-modal-backdrop" id="rules-modal" onclick="if(event.target===this) this.classList.remove('open')">
            <div class="eq-modal">
                <div class="eq-modal-header">
                    <span class="eq-modal-title">Execution Rules</span>
                    <button class="eq-modal-close" onclick="document.getElementById('rules-modal').classList.remove('open')">✕</button>
                </div>

                <div class="mono-lbl" style="margin-bottom: 12px; border-bottom: 1px solid var(--rule, #DCD5C6); padding-bottom: 6px;">ENFORCEMENT</div>
                <div style="font-size: 13px; color: var(--ink-2); display: flex; flex-direction: column; gap: 8px;">
                    <div>✓ Verified Only (Fail-Closed)</div>
                    <div>✓ Immutable Terms</div>
                    <div>✓ No Appeals</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Parallax for the Exchange masthead.
 *
 * ONE LAYER LEFT, and that is a consequence of the page losing its hero rather
 * than a change of mind. The hall still moves at 0.12 of scroll; the band's own
 * inscriptions (0.06) and the specimen contract (-0.02) went with the markup
 * that carried them. On a ~150px masthead 0.12 is about 33px of travel while
 * the plate is on screen — felt as depth, never seen as motion.
 *
 * ONLY transform, ONLY on elements already promoted by will-change, and only
 * inside one rAF per frame — the handler itself does nothing but set a flag, so
 * a fast scroll cannot queue work. Nothing here reads layout: the offsets come
 * from scrollY and the band's cached top, so there is no forced reflow in the
 * scroll path.
 *
 * It disables itself entirely under prefers-reduced-motion, and below 1000px,
 * where the card has stacked out of the band and parallax between two things
 * that no longer overlap is just drift.
 */
function initXhParallax() {
    const band = document.querySelector('.xh-band');
    if (!band) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia && window.matchMedia('(max-width: 1000px)').matches) return;

    const layers = [...document.querySelectorAll('[data-xh-par]')].map((el) => ({
        el, rate: parseFloat(el.getAttribute('data-xh-par')) || 0,
    }));
    if (!layers.length) return;

    let ticking = false;
    const apply = () => {
        ticking = false;
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        /* Past the band's own height there is nothing left to parallax against,
           so the transform is clamped rather than left to run away down the
           page. 400 x 0.12 = 48px, inside the 66px of headroom the plate
           has above the band, so the top edge can never be dragged into view.
           It was 900 when the band was 600px tall. */
        const t = Math.min(y, 400);
        for (const { el, rate } of layers) {
            el.style.transform = `translate3d(0, ${(t * rate).toFixed(2)}px, 0)`;
        }
    };
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(apply);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
}

export function initActiveContracts() {
    initXhParallax();

    // Sort + domain filters now drive the Rivalry board only.
    let activeSort = 'trending_24h';
    let activeCategory = 'all';

    // Item 2: Mechanical Odometer count-up on first paint
    function animateOdometer(el, endVal, suffix = '', duration = 1400) {
        if (!el) return;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            const current = endVal * ease;
            el.textContent = (current >= 1000 ? (current / 1000).toFixed(1) : Math.round(current).toString()) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    /* Read from MARKET_STATS, not from literals. The masthead's status line
       reads the same object, which is what stops the top of the page and the
       middle of it printing different numbers for the same fact. */
    animateOdometer(document.getElementById('stat-capital'), MARKET_STATS.openCapital);
    animateOdometer(document.getElementById('stat-contracts'), MARKET_STATS.openContracts);
    animateOdometer(document.getElementById('stat-pool'), MARKET_STATS.dailyVolume);



    
    // Mock Rivalries Data (Open challenges sorted above Live duels)
    const mockRivalries = [
        {
            id: 'RVL-9981-A',
            title: 'Shopify Revenue Growth (30d)',
            domain: 'commerce',
            platform: 'SHOPIFY',
            rail: 'USD · CUSTODIAL',
            state: 'open', // OPEN CHALLENGE (Sorted first!)
            receipt: 'RCPT-9981',
            days_left: 14,
            stake_per_side: 500,
            total_pool: 1000,
            op1: { handle: '@northloop', delta: '+22.4%', is_leader: true },
            op2: { handle: 'AWAITING COUNTERPARTY', delta: '—', is_leader: false }
        },
        {
            id: 'RVL-4412-B',
            title: 'X Follower Sprint (14d)',
            domain: 'social',
            platform: 'X API',
            rail: 'CLTR · ON-CHAIN',
            state: 'open', // OPEN CHALLENGE (Sorted first!)
            receipt: 'RCPT-4412',
            days_left: 7,
            stake_per_side: 1000,
            total_pool: 2000,
            op1: { handle: '@solomon_k', delta: '+14.2%', is_leader: true },
            op2: { handle: 'AWAITING COUNTERPARTY', delta: '—', is_leader: false }
        },
        {
            id: 'RVL-7710-C',
            title: 'Monthly Recurring Revenue Duel',
            domain: 'finance',
            platform: 'STRIPE',
            rail: 'USD · CUSTODIAL',
            state: 'live', // LIVE DUEL
            receipt: 'RCPT-7710',
            days_left: 10,
            stake_per_side: 2500,
            total_pool: 5000,
            op1: { handle: '@vance_cap', delta: '+34.8%', is_leader: true },
            op2: { handle: '@meridian', delta: '+19.2%', is_leader: false }
        },
        {
            id: 'RVL-3341-D',
            title: 'YouTube Subscriber Growth',
            domain: 'social',
            platform: 'YOUTUBE',
            rail: 'CLTR · ON-CHAIN',
            state: 'live', // LIVE DUEL
            receipt: 'RCPT-3341',
            days_left: 3,
            stake_per_side: 750,
            total_pool: 1500,
            op1: { handle: '@atlas_v', delta: '+8.6%', is_leader: true },
            op2: { handle: '@kodiak', delta: '+5.1%', is_leader: false }
        }
    ];

    function renderRivalries() {
        const rGrid = document.getElementById('rivalry-grid');
        if (!rGrid) return;
        rGrid.innerHTML = '';

        let list = [...mockRivalries];
        if (activeCategory !== 'all') {
            list = list.filter(r => r.domain.toLowerCase() === activeCategory.toLowerCase());
        }

        // Sort Open challenges first
        list.sort((a, b) => (a.state === 'open' ? -1 : b.state === 'open' ? 1 : 0));

        list.forEach(r => {
            const card = document.createElement('div');
            const isOpen = r.state === 'open';
            card.className = 'rv-card ' + (isOpen ? 'rv-card--open' : '');

            const badgeClass = isOpen ? 'rv-badge--open' : 'rv-badge--live';
            const badgeText = isOpen ? 'OPEN CHALLENGE' : 'LIVE DUEL';

            // Calculate Leader vs Trailer dynamically from numeric delta
            const d1 = parseFloat(r.op1.delta) || 0;
            const d2 = parseFloat(r.op2.delta) || 0;
            const op1IsLead = d1 >= d2;
            const op2IsLead = d2 > d1;

            const op1DeltaClass = isOpen ? 'rv-delta--lead' : (op1IsLead ? 'rv-delta--lead' : 'rv-delta--trail');
            const op2DeltaClass = isOpen ? 'rv-delta--empty' : (op2IsLead ? 'rv-delta--lead' : 'rv-delta--trail');

            const op2HandleText = isOpen ? 'Open slot' : r.op2.handle;
            const op2HandleClass = isOpen ? 'rv-handle--empty' : '';
            const op2DeltaText = isOpen ? '—' : r.op2.delta;

            const ctaBtn = isOpen
                ? '<button class="eq-card-cta rv-cta" style="background:#7A1C29 !important; color:#FFF8F5 !important;">ACCEPT CHALLENGE</button>'
                : '<button class="eq-card-cta rv-cta" style="background:transparent !important; color:#0E1420 !important; border:1px solid #0E1420 !important;">VIEW DUEL &rarr;</button>';

            card.innerHTML = `
                <div class="rv-head">
                    <span class="rv-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="rv-meta">
                    <span class="mono-lbl">${r.receipt}</span>
                    <span class="mono-lbl" style="font-variant-numeric: tabular-nums;">${r.days_left}d left</span>
                </div>
                <h3 class="rv-title">${r.title}</h3>
                <div class="rv-domain">
                    <span class="rv-dot"></span>
                    <span class="mono-lbl">${r.domain.toUpperCase()} &middot; ${r.platform}</span>
                </div>

                <!-- 3-Column VS Competitor Grid (Fixes Text Truncation & Overlap) -->
                <div class="rv-vs">
                    <div class="rv-side">
                        <span class="rv-handle">${r.op1.handle}</span>
                        <span class="rv-delta ${op1DeltaClass}">${r.op1.delta}</span>
                    </div>
                    <div class="rv-divider">
                        <div class="rv-vs-rule"></div>
                        <span class="rv-vs-label">VS</span>
                        <div class="rv-vs-rule"></div>
                    </div>
                    <div class="rv-side" style="text-align:right;">
                        <span class="rv-handle ${op2HandleClass}">${op2HandleText}</span>
                        <span class="rv-delta ${op2DeltaClass}">${op2DeltaText}</span>
                    </div>
                </div>

                <!-- Proportional Share Bar -->
                <div class="rv-bar">
                    <div class="rv-bar-a" style="width: ${isOpen ? '50%' : (op1IsLead ? '60%' : '40%')};"></div>
                    <div class="rv-bar-gap"></div>
                    <div class="rv-bar-b" style="width: ${isOpen ? '50%' : (op2IsLead ? '60%' : '40%')};"></div>
                </div>

                <!-- Stake & Pool Info with $ prefix -->
                <div class="rv-stake">
                    <div>
                        <p class="rv-per">$${r.stake_per_side.toLocaleString()} <span>/ side</span></p>
                        <p class="rv-pool">$${r.total_pool.toLocaleString()} TOTAL POOL</p>
                    </div>
                    <span class="rv-rail">${r.rail}</span>
                </div>

                ${ctaBtn}
            `;
            rGrid.appendChild(card);
        });
    }



    // Tabs listener
    const tabsContainer = document.getElementById('eq-tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.eq-tab');
            if (!tab) return;
            tabsContainer.querySelectorAll('.eq-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeSort = tab.dataset.sort;
            renderRivalries();
        });
    }

    // Filters (Domain) listener
    const filtersContainer = document.getElementById('eq-filters');
    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            const pill = e.target.closest('.eq-pill');
            if (!pill) return;
            filtersContainer.querySelectorAll('.eq-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCategory = pill.dataset.category;
            renderRivalries();
        });
    }


    // Rules modal listener
    const rulesBtn = document.getElementById('btn-rules');
    const rulesModal = document.getElementById('rules-modal');
    if (rulesBtn && rulesModal) {
        rulesBtn.addEventListener('click', () => rulesModal.classList.add('open'));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && rulesModal.classList.contains('open')) rulesModal.classList.remove('open');
        });
    }

    // ═══ SOLO SOURCE PICKER ═══
    // Entrance motion only. The content is already in the DOM; this just animates
    // it in. Three independent guarantees that it becomes visible:
    //   1. threshold 0 + negative rootMargin — fires even for a section taller
    //      than the viewport, which a high threshold can never satisfy
    //   2. a 1200ms timeout that forces the reveal regardless of the observer
    //   3. reduced-motion / no-IO environments are marked seen immediately
    // We shipped a blank bordered box once because an observer threshold couldn't
    // be met. Do not remove the timeout.
    const ssRoot = document.getElementById('ss-root');
    if (ssRoot) {
        const reveal = () => ssRoot.setAttribute('data-seen', 'true');
        // Hard fallback: paint the final state with no transition at all.
        const forceVisible = () => ssRoot.classList.add('ss-forced');
        const prefersReduced = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduced || typeof IntersectionObserver === 'undefined') {
            reveal();
            forceVisible();
        } else {
            const io = new IntersectionObserver((entries) => {
                if (entries.some(e => e.isIntersecting)) { reveal(); io.disconnect(); }
            }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
            io.observe(ssRoot);

            setTimeout(() => {
                reveal();
                io.disconnect();
                // Setting data-seen only starts a transition. If that transition
                // never ticks (throttled tab, paused timeline), elements sit at
                // opacity 0 forever — the blank bordered box we shipped once.
                //
                // Probe EVERY revealed element, not a representative one. A child
                // can report opacity 1 while its parent sits at 0, so sampling a
                // nested .ss-metric reports "visible" for a picker nobody can see.
                const revealed = ssRoot.querySelectorAll('.ss-step, .ss-metric');
                const anyUnpainted = revealed.length === 0 || [...revealed].some(
                    el => parseFloat(getComputedStyle(el).opacity) < 0.9
                );
                if (anyUnpainted) forceVisible();
            }, 1200);
        }

        // One route, source as a param. The bank button and every metric tile
        // funnel through the same destination — platform connects are progressive
        // disclosure, not separate flows.
        ssRoot.querySelectorAll('[data-source]').forEach((el) => {
            el.addEventListener('click', (e) => {
                const source = el.getAttribute('data-source');
                if (!source) return;
                e.preventDefault();

                // Bank connect happens in an embedded Plaid Link modal — the user
                // keeps their place on /market and the card re-renders on success.
                if (el.id === 'ss-connect-bank') {
                    if (window.app && typeof window.app.connectBank === 'function') {
                        window.app.connectBank(() => { loadSourceState(); });
                    }
                    return;
                }

                if (!window.router) return;
                // Metric selection requires the bank. Without it there is no
                // baseline and no settlement rail, so the click cannot proceed —
                // this is the bait-and-switch guard, not decoration.
                const gated = el.closest('.ss-gated');
                if (gated && ssRoot.getAttribute('data-bank') !== 'connected') {
                    document.getElementById('ss-connect-bank')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                window.router.navigate('/solo/new?source=' + encodeURIComponent(source));
            });
        });

        // Flip once the bank connection is confirmed.
        window.app = window.app || {};
        window.app.setBankConnected = function (connected) {
            ssRoot.setAttribute('data-bank', connected ? 'connected' : 'none');
        };

        /**
         * Read REAL connection state and render each card accordingly.
         *
         * Two states are supported today: ready (source connected) and not
         * connected (show connect). The third — connected but short on history —
         * needs a history-depth endpoint that does not exist yet, so a connected
         * source falls back to "ready" and the examination catches insufficient
         * history. Honest, because the examination genuinely does check, and far
         * better than showing "Connect Stripe" to someone who connected last week.
         */
        async function loadSourceState() {
            if (!window.api) return;

            const read = async (fn) => {
                try { return await fn(); } catch { return { connected: false }; }
            };

            const [bank, history, stripe, shopify, youtube] = await Promise.all([
                read(() => window.api.getPlaidStatus()),
                read(() => window.api.getPlaidHistory()),
                read(() => window.api.getStripeStatus()),
                read(() => window.api.getShopifyStatus()),
                read(() => window.api.getYouTubeStatus()),
            ]);

            const bankConnected = !!(bank && bank.connected);
            ssRoot.setAttribute('data-bank', bankConnected ? 'connected' : 'none');

            // EVERY metric needs the bank: it produces the underwriting baseline
            // whichever metric is chosen, and settles anything denominated in
            // dollars. A platform connection alone is not enough — marking MRR
            // "ready" with no bank would send the user to a builder that cannot
            // price anything.
            // STATE 3 — connected, but the bank does not yet have six months.
            // Tier availability gates on bank history, so a short history blocks
            // every metric. Say the real position rather than showing "ready" and
            // letting the examination reject them after they have granted access.
            const shortHistory = bankConnected && history
                && history.connected && history.ready === false
                && typeof history.monthsAvailable === 'number';

            if (shortHistory) {
                const label = formatUnlock(history.unlocksAt);
                ['money', 'mrr', 'orders', 'views'].forEach(m => {
                    applyCardState(m, false, m === 'money' ? 'bank' : null);
                    setCardState(m,
                        history.monthsAvailable + ' of ' + history.monthsRequired + ' months'
                        + (label ? ' — unlocks ' + label : ''));
                    const tile = ssRoot.querySelector('.ss-metric[data-metric="' + m + '"]');
                    const badge = tile && (tile.querySelector('.ss-m-req') || tile.querySelector('.ss-tag'));
                    if (badge) {
                        badge.textContent = history.monthsAvailable + ' OF ' + history.monthsRequired + ' MONTHS';
                        badge.classList.remove('ss-tag');
                        badge.classList.add('ss-m-req');
                    }
                    const go = tile && tile.querySelector('.ss-go');
                    // Not a link: there is nothing to click, only time to pass.
                    if (go) go.textContent = label ? 'Unlocks ' + label : 'Not enough history yet';
                });
                return;
            }

            applyCardState('money', bankConnected, 'bank');
            applyCardState('mrr', bankConnected && !!(stripe && stripe.connected), 'Stripe');
            applyCardState('orders', bankConnected && !!(shopify && shopify.connected), 'Shopify');
            applyCardState('views', bankConnected && !!(youtube && youtube.connected), 'YouTube');
        }

        function setCardState(metric, text) {
            const tile = ssRoot.querySelector('.ss-metric[data-metric="' + metric + '"]');
            const state = tile && tile.querySelector('.ss-m-state');
            if (state) state.textContent = text || '';
        }

        /** "2026-03" -> "in March" */
        function formatUnlock(ym) {
            if (!ym || typeof ym !== 'string') return '';
            const [y, m] = ym.split('-').map(Number);
            if (!y || !m) return '';
            const names = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
            return 'in ' + names[m - 1];
        }

        function applyCardState(metric, connected, platform) {
            const tile = ssRoot.querySelector('.ss-metric[data-metric="' + metric + '"]');
            if (!tile) return;
            const go = tile.querySelector('.ss-go');
            const req = tile.querySelector('.ss-m-req');

            if (connected) {
                tile.classList.remove('locked');
                tile.classList.add('ready');
                if (go) go.textContent = 'Write this contract →';
                if (req) req.remove();
            } else {
                tile.classList.add('locked');
                tile.classList.remove('ready');
                // Name the action that actually unblocks this card. Without a bank
                // that is always the bank, whatever the platform.
                if (go) {
                    const bankMissing = ssRoot.getAttribute('data-bank') !== 'connected';
                    go.textContent = (bankMissing || platform === 'bank')
                        ? 'Connect bank →'
                        : 'Connect ' + platform + ' →';
                }
            }
        }

        loadSourceState();


        // Once a platform is attached we know exactly how much history exists, so
        // replace the generic rule with the user's ACTUAL position — "4 of 6
        // months, unlocks in March" beats repeating the requirement back at them.
        // Falls back to the up-front wording when we have nothing specific.
        window.app = window.app || {};
        window.app.setMetricHistoryState = function (metric, monthsHave, monthsNeed, unlocksLabel) {
            const tile = ssRoot.querySelector('.ss-metric[data-metric="' + metric + '"]');
            if (!tile) return;
            const state = tile.querySelector('.ss-m-state');
            const go = tile.querySelector('.ss-go');
            if (!state) return;
            if (monthsHave >= monthsNeed) {
                tile.classList.remove('locked');
                tile.classList.add('ready');
                state.textContent = 'Ready — ' + monthsHave + ' months of history';
                if (go) go.textContent = 'Write this contract →';
                const req = tile.querySelector('.ss-m-req');
                if (req) req.remove();
                const alt = tile.querySelector('.ss-m-alt');
                if (alt) alt.remove();
            } else {
                state.textContent = monthsHave + ' of ' + monthsNeed + ' months'
                    + (unlocksLabel ? ' — unlocks ' + unlocksLabel : '');
            }
        };
    }

    // Initial render
    renderRivalries();
}
