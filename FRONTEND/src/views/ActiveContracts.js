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
    avgSettlementDays: 30,
    /* Pre-formatted for the hero strip, which has room for a rounded figure and
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
               on purpose: they are meant to sit ON the paper, not to be it.

               THE HEADER WASN'T THE WRONG COLOUR — IT HAD NOTHING BEHIND IT.
               .ch-header is fixed and transparent until you scroll, so the strip
               it occupies is painted by whatever is underneath, and #app carries
               a 96px pt-24 that left that band as bare body (#FAF8F5). The bar
               therefore read near-white against this page's cream while its own
               declared colour was already #F1E8D3.

               -96 THEN +96 IS THE WHOLE FIX. The landing page cancels the same
               offset with margin-top: -96px, but it can stop there because its
               hero is designed to run up under the bar. This page's hero is not,
               so the ground is pulled up and the content pushed straight back
               down: the band behind the header becomes page cream and not one
               element moves. border-box so the restored padding does not add
               96px to the 100vh floor. */
            .eq {
                background: #F1E8D3;
                min-height: 100vh;
                box-sizing: border-box;
                margin-top: -96px;
                padding-top: 96px;
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
            /* ══════════════════════════════════════════════════════════════
               THE MARKET HERO

               Rebuilt from the masthead. Two columns over a full-width ruled
               status strip, the clearinghouse engraving on the right.

               PREFIX IS mkh-, NOT xh-. Every .xh rule is deleted with the
               markup that used it; a fresh prefix means a stale rule cannot
               survive the rewrite and quietly apply to something. */
            .mkh {
                position: relative;
                /* 680, not 748. The composition was not too low — the BOX was too
                   tall, and align-items: center was faithfully centring a fixed
                   amount of content inside the surplus. Shortening the box moves
                   the centre up by half the difference, and the smaller top pad
                   moves it up by half of that: ~52px, without touching a single
                   position on the content itself. */
                min-height: 680px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                --mkh-gutter: clamp(24px, 6vw, 96px);
                --mkh-ox: #5E1E2E;
            }
            .mkh-inner {
                position: relative;
                flex: 1;
                display: flex;
                align-items: center;
                max-width: 1760px;
                width: 100%;
                margin: 0 auto;
                padding: 20px var(--mkh-gutter) 40px;
                box-sizing: border-box;
            }

            /* ---- the engraving ----
               THE PLATE IS FLATTENED ONTO THIS PAGE'S OWN CREAM, which is why
               it needs no alpha and shows no rectangle. The supplied file was a
               2.9MB 32-bit PNG whose transparency existed only to sit on a
               cream page; compositing it onto that cream first and shipping JPEG
               is 254KB for the same result. There is no boundary to hide because
               the plate's ground and the page's ground are the same value.

               THE TOP EDGE IS DISSOLVED IN THE ASSET, NOT IN CSS. The original's
               architecture ran straight off the top of its own canvas, leaving a
               hard horizontal cut — a rectangular asset boundary. A CSS gradient
               mask would have removed it, but a uniform fade reads as a digital
               wipe laid over an engraving. tools/make-clearinghouse-plate.ps1
               instead thresholds a two-octave noise field against depth, so the
               ink breaks up into speckle the way a copperplate does as the inked
               area runs out — the same character as the plate's left edge.

               THE ELEMENT REACHES LEFT UNDER THE COPY, and that is deliberate
               rather than sloppy: the plate's own left quarter is bare cream
               (measured — 0.0% ink coverage out to 25%), so extending the box
               lets the engraving render larger without the drawn part ever
               reaching the text. Only cream overlaps the copy column.

               WIDTH IS OVER-SET SO THE RIGHT ARCHITECTURE BLEEDS. Sized to fit,
               the plate would stop exactly at the viewport edge and read as a
               picture placed on the page rather than a hall continuing past it.
               The extra 160px runs under .mkh's overflow: hidden. It is bounded:
               ~86% of the plate stays visible at 1440, and the laurel C ends at
               81%, so the emblem, Victory, the principal columns and the
               operators are all clear of the cut. */
            .mkh-art {
                position: absolute;
                top: 0; bottom: 0; right: auto;
                left: calc(32% - 30px);
                width: calc(68% + 190px);
                background: url("/assets/images/market-clearinghouse.jpg") left calc(50% - 20px) / 100% auto no-repeat;
                pointer-events: none;
                z-index: 0;
            }

            .mkh-copy { position: relative; z-index: 1; width: 46%; max-width: 620px; }

            .mkh-eyebrow {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .3em; text-transform: uppercase;
                color: #6A5E48; margin-bottom: 26px;
            }
            /* Two lines by construction, not by luck: the break is a <br> in the
               markup rather than a max-width the browser might wrap differently
               at some intermediate size. */
            .mkh-h1 {
                font-family: "Cormorant Garamond", Georgia, serif;
                font-weight: 600;
                font-size: clamp(64px, 6.3vw, 96px);
                line-height: .96;
                letter-spacing: .004em;
                color: #1A1610;
                margin: 0 0 28px;
            }
            .mkh-h1 .ox { color: var(--mkh-ox); }
            /* MEASURE IS SET TO THE SECOND LINE, WHICH IS THE LONGEST. The wrap
               wanted is
                 Back verified operators—or stake on your own
                 performance. Every contract settles automatically
                 against live business data.
               so the measure has to clear "…settles automatically" and fall short
               of taking "against" up with it. Measured rather than guessed: that
               window is NARROW and lower than it looks. Measured in EB Garamond
               at 19px:
                 line 1 alone ................................. 335px
                 line 2 alone ................................. 354px  <- floor
                 line 1 + "performance." ...................... 435px
                 line 2 + "against" ........................... 408px  <- ceiling
               so the measure has to sit in 355–407, and 384 is the middle of it.
               Anything at or above 435 collapses to two lines and strands
               "Every" at the end of the first — which is exactly what the old
               500px was doing. */
            .mkh-lede {
                font-family: "EB Garamond", Georgia, serif;
                font-size: 19px; line-height: 1.58;
                color: #4A4232;
                max-width: 384px; margin: 0 0 28px;
            }

            .mkh-actions { display: flex; align-items: center; gap: 30px; }
            /* Square corners, flat oxblood, one hairline of depth. No gradient,
               no lift, no glow — the brief rules those out and they are what
               makes a button look like a SaaS pricing CTA. */
            .mkh-btn {
                display: inline-flex; align-items: center; gap: 14px;
                background: var(--mkh-ox); color: #F4EEE2;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11.5px; letter-spacing: .22em; text-transform: uppercase;
                padding: 19px 30px; border: 1px solid #4A1523; border-radius: 0;
                cursor: pointer;
                transition: background 200ms ease-out;
            }
            .mkh-btn:hover { background: #4A1523; }
            .mkh-btn .a { display: inline-block; transition: transform 200ms ease-out; }
            .mkh-btn:hover .a, .mkh-btn:focus-visible .a { transform: translateX(4px); }

            /* The secondary is a text action with a word-width rule, so the rule
               measures the words rather than the words plus a travelling arrow —
               the same reason the contract cards wrap their label in a span. */
            .mkh-link {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
                color: #3A3226; background: none; border: 0; cursor: pointer;
                display: inline-flex; align-items: center; gap: 12px; padding: 4px 0;
            }
            .mkh-link .t { position: relative; display: inline-block; }
            /* TWO RULES, BECAUSE ONE CANNOT DO BOTH JOBS. The resting underline
               is part of the design, and the wipe is the interaction — but
               scaleX from 1 to 1 is not a wipe. So ::before is the quiet resting
               hairline and ::after is the full-strength rule that wipes in over
               it from the left. Both live on .t, which wraps the label only, so
               they measure the words and not the words plus a travelling arrow. */
            .mkh-link .t::before,
            .mkh-link .t::after {
                content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 1px;
                background: var(--mkh-ox);
            }
            .mkh-link .t::before { opacity: .34; }
            .mkh-link .t::after {
                transform: scaleX(0); transform-origin: left center;
                transition: transform 260ms cubic-bezier(.22,.61,.36,1);
            }
            .mkh-link:hover .t::after, .mkh-link:focus-visible .t::after { transform: scaleX(1); }
            .mkh-link .a { color: var(--mkh-ox); display: inline-block; transition: transform 200ms ease-out; }
            .mkh-link:hover .a, .mkh-link:focus-visible .a { transform: translateX(4px); }

            .mkh-btn:focus-visible, .mkh-link:focus-visible {
                outline: 2px solid var(--mkh-ox); outline-offset: 4px;
            }
            @media (prefers-reduced-motion: reduce) {
                .mkh-btn, .mkh-btn .a, .mkh-link .a, .mkh-link .t::after { transition: none; }
            }

            /* ---- status strip ----
               One rule above, one below, full bleed. Mono at 11px so it clears
               the 10px floor with room, and both tones are checked against the
               page ground rather than assumed. */
            .mkh-strip {
                position: relative; z-index: 1;
                border-top: 1px solid rgba(70,55,35,.22);
                border-bottom: 1px solid rgba(70,55,35,.22);
            }
            .mkh-strip-in {
                max-width: 1760px; margin: 0 auto;
                padding: 17px var(--mkh-gutter);
                display: flex; align-items: center; justify-content: space-between;
                gap: 24px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
            }
            .mkh-live { display: inline-flex; align-items: center; gap: 11px; color: #4A4232; }
            .mkh-live i {
                width: 7px; height: 7px; border-radius: 50%; background: #4E6B3E;
                box-shadow: 0 0 0 0 rgba(78,107,62,.4);
                animation: mkh-pulse 2.8s ease-out infinite;
            }
            @keyframes mkh-pulse {
                0% { box-shadow: 0 0 0 0 rgba(78,107,62,.4); }
                70% { box-shadow: 0 0 0 7px rgba(78,107,62,0); }
                100% { box-shadow: 0 0 0 0 rgba(78,107,62,0); }
            }
            @media (prefers-reduced-motion: reduce) { .mkh-live i { animation: none; } }
            .mkh-metrics { display: flex; align-items: center; gap: 22px; color: #4A4232; }
            .mkh-metrics .d {
                width: 6px; height: 6px; background: var(--mkh-ox);
                transform: rotate(45deg); flex: none;
            }
            /* The illustrative marker. It is deliberately the quietest thing in
               the strip and deliberately still there: these figures are not fed
               by anything yet, and a market that has not wired its own numbers
               should not print them as though it had. Delete this span the same
               commit MARKET_STATS starts reading an endpoint. */
            .mkh-note {
                font-size: 10px; letter-spacing: .16em; color: #6F6350;
                border-left: 1px solid rgba(70,55,35,.22); padding-left: 22px;
            }

            /* ---- responsive ---- */
            @media (max-width: 1180px) {
                .mkh-copy { width: 50%; }
                /* Narrower viewport, so the plate steps right to stay off the
                   copy — and the bleed shrinks with it, because 190px of
                   overflow on a 1000px screen would cut into the emblem. */
                .mkh-art { left: calc(38% - 30px); width: calc(62% + 110px); }
            }
            @media (max-width: 900px) {
                /* Stacked: copy first, plate beneath the actions. The plate goes
                   back to normal flow with a fixed band of height, still contain,
                   so it never crops and never sits under the type. */
                .mkh { min-height: 0; }
                .mkh-inner { flex-direction: column; align-items: stretch; padding: 40px var(--mkh-gutter) 0; }
                /* ORDER, because the plate is FIRST in the DOM. It is absolutely
                   positioned on desktop so source order is irrelevant there; the
                   moment it returns to flow it renders ABOVE the headline.
                   Explicit order puts the copy first without moving the markup,
                   which leaves the desktop stacking context alone. */
                .mkh-copy { width: 100%; max-width: none; order: 1; }
                /* !important ANSWERS AN !important. mobile.css sets a bare
                   h1 { font-size: clamp(24px,7vw,36px) !important } below 768px,
                   which captured this headline at 27.3px — 7vw of 390 exactly.
                   No class outranks !important, so this replies in kind. */
                .mkh h1.mkh-h1 { font-size: clamp(44px, 9vw, 64px) !important; line-height: .98 !important; letter-spacing: .004em !important; }
                .mkh-lede { max-width: none; }
                /* EVERY DESKTOP OFFSET IS UNSET HERE, not adjusted — a calc()
                   left edge and a 190px bleed are the two things that clip at
                   narrow widths.
                   ORDER 2, because the plate is FIRST in the DOM: it is
                   absolutely positioned on desktop so source order is irrelevant
                   there, but the moment it returns to flow it renders ABOVE the
                   headline. Explicit order fixes that without moving the markup.
                   THE CROP TAKES ONLY CREAM. Fitting the whole 2:1 plate into a
                   phone's width leaves the architecture too small to read, so it
                   is scaled up and anchored right — and because the plate's left
                   22% is measured bare (0.0% ink out to 25%), that enlargement
                   cuts nothing but empty ground and leaves no hard edge. Victory,
                   the emblem and the operators all sit inside what remains.
                   aspect-ratio rather than a fixed height, so the box is exactly
                   as tall as the image at every width and never bands it with
                   dead cream. */
                .mkh-art {
                    position: relative; left: auto; right: auto; top: auto; bottom: auto;
                    order: 2;
                    width: 100%; height: auto; aspect-ratio: 1.5625;
                    background-size: 128% auto;
                    background-position: right center;
                    margin-top: 30px;
                }
                .mkh-strip-in { flex-direction: column; align-items: flex-start; gap: 13px; padding: 15px var(--mkh-gutter); }
                .mkh-metrics { flex-wrap: wrap; gap: 12px 16px; }
                .mkh-note { border-left: 0; padding-left: 0; }
            }
            @media (max-width: 560px) {
                .mkh-actions { flex-direction: column; align-items: stretch; gap: 18px; }
                .mkh-btn { justify-content: center; }
                .mkh-link { justify-content: center; }
                .mkh-metrics { font-size: 10px; letter-spacing: .14em; }
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

            /* ══════════════════════════════════════════════════════════════
               THE MARKET BOARD  —  everything on this route below the hero.

               EVERY CLASS IS PREFIXED mb-, AND THAT IS NOT STYLE PEDANTRY.
               The design this is built from names things .card, .grid, .btn,
               .step, .bar, .chip, .foot, .mark and .info. Those are global
               names; .eq- classes from this file are already read by
               mobile.css and Profile.js, and a bare .card rule here would
               reach into every other view that ships one. The prefix is what
               makes this section safe to add without auditing the whole app.

               ITS TOKENS ARE SCOPED TO .mb FOR THE SAME REASON. The source
               design declares --paper, --ink and --muted on :root; pasted in,
               it would silently repaint six other views. They live on .mb so
               they cannot escape it. */
            .mb {
                --mb-paper: #F5EDDA;
                --mb-ink: #211B12;
                --mb-ink-soft: #574E3D;
                /* MEASURED, NOT PICKED. The source design's #7A6E52 lands at
                   4.12:1 on this cream and 4.31:1 on card paper — under the 4.5
                   floor, and it carries the receipt numbers, deadlines, rail
                   tags, ledger heads and the footer. #695F47 is the same hue
                   walked down until it clears on all three grounds this section
                   uses: 5.17 page, 5.41 card paper, 4.55 active chip. */
                --mb-muted: #695F47;
                /* Only ever on 20px/600 text, which is large by WCAG, so it is
                   allowed to stay faint. The two places it sat on small text —
                   the Adjust hints at 8.5px and the VS marks at 9px — now take
                   --mb-muted, and both were raised to the 10px floor with the
                   seven other rules in here that were under it. */
                --mb-faint: #7A6E52;
                --mb-ox: #7C1D2B;
                --mb-ox-deep: #5E1420;
                --mb-win: #3F5A31;
                --mb-line: rgba(70,55,35,.18);
                --mb-line-soft: rgba(70,55,35,.10);
                --mb-line-firm: rgba(70,55,35,.28);
                --mb-gutter: clamp(24px, 6vw, 96px);
                position: relative;
                max-width: 1560px;
                margin: 0 auto;
                padding: 0 var(--mb-gutter);
                font-family: "EB Garamond", Georgia, serif;
                color: var(--mb-ink);
            }
            /* The ledger ruling. 3% of a warm grey over cream — it reads as
               laid paper rather than as lines, and it is the one texture that
               ties the board to the hero's engraving without competing. */
            .mb::before {
                content: "";
                position: absolute; inset: 0;
                pointer-events: none; z-index: 0;
                background: repeating-linear-gradient(0deg, transparent 0 29px, rgba(70,55,35,.03) 29px 30px);
            }
            .mb > * { position: relative; z-index: 1; }
            .mb-mono { font-family: var(--mono, 'IBM Plex Mono', monospace); }
            .mb-mark {
                width: 8px; height: 8px; background: var(--mb-ox-deep);
                transform: rotate(45deg); display: inline-block; flex: none;
            }

            /* ---- section headers ---- */
            .mb-lhead { display: flex; align-items: center; gap: 20px; margin-bottom: 26px; }
            .mb-lhead .lab {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11.5px; letter-spacing: .28em; text-transform: uppercase;
                color: var(--mb-ox); font-weight: 500; white-space: nowrap;
                display: flex; align-items: center; gap: 12px;
            }
            .mb-lhead .ln { flex: 1; height: 1px; background: linear-gradient(90deg, var(--mb-line-firm), var(--mb-line-soft)); }
            .mb-lhead .act {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-muted); white-space: nowrap;
                background: none; border: 0; padding: 0; cursor: pointer;
            }
            .mb-lhead .act:hover { color: var(--mb-ox); }

            /* ---- create (solo) ---- */
            .mb-solo { padding-top: 58px; }
            .mb-solo-top { display: flex; align-items: center; gap: 20px; }
            .mb-solo-emb { height: 56px; width: auto; flex: none; }
            .mb-kick {
                display: inline-flex; align-items: center; gap: 13px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .30em; text-transform: uppercase;
                color: var(--mb-ox); font-weight: 500; margin-bottom: 14px;
            }
            .mb-kick .r { height: 1px; width: 30px; background: var(--mb-ox); opacity: .75; }
            .mb-solo h2 {
                font-family: "Cormorant Garamond", Georgia, serif;
                font-weight: 600; font-size: clamp(32px, 3.6vw, 42px); line-height: 1.0;
                color: var(--mb-ink); margin: 0;
            }
            .mb-solo h2 .ox { color: var(--mb-ox); }
            .mb-lede { font-size: 17px; line-height: 1.55; color: var(--mb-ink-soft); max-width: 660px; margin: 16px 0 0; }

            .mb-step { display: grid; grid-template-columns: 250px 1fr; gap: 44px; padding: 26px 0; border-top: 1px solid var(--mb-line); }
            .mb-step:first-of-type { margin-top: 30px; }
            .mb-snum { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: .24em; color: var(--mb-ox); font-weight: 500; }
            .mb-stt { font-family: "Cormorant Garamond", Georgia, serif; font-size: 27px; font-weight: 600; margin-top: 12px; line-height: 1.05; }
            .mb-sdesc { font-size: 15px; line-height: 1.55; color: var(--mb-ink-soft); margin: 0 0 18px; max-width: 560px; }
            .mb-cbtn {
                display: inline-flex; align-items: center; gap: 12px;
                background: var(--mb-ox); color: #F6EEDD;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
                padding: 15px 24px; border: 0; border-radius: 0; cursor: pointer;
                box-shadow: 0 12px 26px rgba(94,20,32,.20);
            }
            .mb-cbtn .tag { font-size: 10px; letter-spacing: .05em; opacity: .78; text-transform: none; font-weight: 400; }
            .mb-reassure {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .06em; color: var(--mb-muted);
                margin-top: 14px; display: flex; align-items: center; gap: 9px;
            }

            /* ---- the source matrix ----
               A TABLE, BECAUSE IT IS ONE. Metric down the side, source across
               the top, availability in the last column: the whole question a
               reader has here is "what can I actually be measured on", and a
               grid answers it in one look where four stacked cards did not. */
            .mb-matrix { border-top: 2px solid var(--mb-ink); }
            .mb-mx-h, .mb-mx-r {
                display: grid;
                grid-template-columns: 1.7fr .62fr .62fr .62fr .62fr 1.25fr;
                align-items: center; gap: 14px; padding: 13px 8px;
            }
            .mb-mx-h { border-bottom: 1px solid var(--mb-line); }
            .mb-mx-h span {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-muted); text-align: center;
            }
            .mb-mx-h span.l { text-align: left; }
            .mb-mx-h span.rt { text-align: right; }
            .mb-mx-h .conn { display: block; color: var(--mb-win); font-size: 10px; margin-top: 3px; letter-spacing: .08em; }
            .mb-mx-r { border-bottom: 1px solid var(--mb-line-soft); }
            .mb-mn { font-family: "Cormorant Garamond", Georgia, serif; font-size: 19px; font-weight: 600; color: var(--mb-ink); }
            .mb-md {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .02em; color: var(--mb-muted); margin-top: 3px;
            }
            .mb-md:empty { display: none; }
            .mb-mx-cell { display: flex; justify-content: center; }
            /* Three states, and they are legible without colour: filled = the
               source is connected, ring = it is the one this metric needs, rule
               = not applicable. Colour alone would fail anyone who cannot see it. */
            .mb-dot { width: 11px; height: 11px; border-radius: 50%; background: var(--mb-win); }
            .mb-dot-o { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--mb-ox); }
            .mb-dot-e { width: 7px; height: 1px; background: var(--mb-line-firm); }
            .mb-mx-avail {
                text-align: right;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
            }
            .mb-mx-avail .ss-go { color: var(--mb-ox); text-decoration: none; background: none; border: 0; cursor: pointer; font: inherit; letter-spacing: inherit; text-transform: inherit; }
            .mb-mx-avail .ss-go:hover { text-decoration: underline; }
            .ss-metric.ready .mb-mx-avail .ss-go { color: var(--mb-win); cursor: pointer; }

            /* ---- the terms builder ---- */
            .mb-builder { display: grid; grid-template-columns: 1fr 356px; gap: 40px; align-items: center; }
            .mb-bnote { font-size: 15px; line-height: 1.58; color: var(--mb-ink-soft); max-width: 430px; }
            .mb-bnote .big { font-family: "Cormorant Garamond", Georgia, serif; font-size: 23px; color: var(--mb-ink); display: block; margin-bottom: 12px; font-weight: 600; line-height: 1.1; }
            .mb-bcard { position: relative; background: var(--mb-paper); border: 1px solid var(--mb-line-firm); padding: 20px 22px; box-shadow: 0 16px 34px rgba(60,40,20,.10); }
            .mb-bcard::after { content: ""; position: absolute; inset: 5px; border: 1px solid var(--mb-line-soft); pointer-events: none; }
            .mb-bh { position: relative; z-index: 2; }
            .mb-bt-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
            .mb-bt-k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-bt-title { font-family: "Cormorant Garamond", Georgia, serif; font-size: 25px; font-weight: 600; margin: 8px 0 4px; }
            .mb-brule { height: 1px; background: var(--mb-line-firm); margin: 10px 0 4px; }
            .mb-brow { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--mb-line-soft); }
            .mb-brow .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-brow .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; font-weight: 600; color: var(--mb-ink); }
            .mb-brow .v .adj { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--mb-muted); margin-left: 9px; }
            .mb-bmult { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--mb-line-soft); }
            .mb-bmult .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-bmult .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: 27px; font-weight: 700; color: var(--mb-ox); }
            .mb-bplain { font-size: 13.5px; line-height: 1.45; color: var(--mb-ink-soft); padding: 12px 0; border-bottom: 1px solid var(--mb-line-soft); }
            .mb-bout { display: flex; justify-content: space-between; gap: 10px; font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .04em; padding: 12px 0 2px; }
            .mb-bout .w { color: var(--mb-win); }
            .mb-bout .l { color: var(--mb-ox); }
            .mb-bcreate {
                display: block; width: 100%; text-align: center;
                background: var(--mb-ox); color: #F6EEDD;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
                padding: 13px; border: 0; border-radius: 0; cursor: pointer; margin-top: 15px;
            }
            /* THE FIGURES IN THIS CARD ARE A WORKED EXAMPLE, NOT A QUOTE. Real
               terms are priced per person from verified history, so the card
               says so rather than letting a reader take $250 -> $1,000 as an
               offer. Delete .mb-bex the same commit it renders a real draft. */
            .mb-bex {
                display: block; margin-top: 10px; text-align: center;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--mb-muted);
            }

            /* ---- board controls ---- */
            .mb-board { padding-top: 60px; }
            .mb-controls {
                display: flex; align-items: center; justify-content: space-between; gap: 24px;
                flex-wrap: wrap; padding-bottom: 22px;
                border-bottom: 1px solid var(--mb-line-firm); margin-bottom: 30px;
            }
            .mb-seg { display: inline-flex; border: 1px solid var(--mb-line-firm); }
            .mb-seg button {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-ink-soft); background: none;
                padding: 10px 18px; border: 0; border-right: 1px solid var(--mb-line-firm); cursor: pointer;
            }
            .mb-seg button:last-child { border-right: 0; }
            .mb-seg button.on { background: var(--mb-ink); color: #F7F1E2; font-weight: 600; }
            .mb-chips { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .mb-chip {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
                color: var(--mb-ink-soft); border: 1px solid var(--mb-line-firm);
                padding: 8px 15px; background: #FAF4E6; cursor: pointer;
            }
            .mb-chip.on { background: #E6DAC0; color: var(--mb-ink); }
            .mb-sortr {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
                color: var(--mb-muted); display: flex; align-items: center; gap: 16px;
            }
            .mb-sortr b { color: var(--mb-ink); font-weight: 500; }

            /* ---- listing cards ---- */
            .mb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
            .mb-card {
                position: relative; background: var(--mb-paper);
                border: 1px solid var(--mb-line-firm); padding: 18px 20px;
                display: flex; flex-direction: column;
                box-shadow: 0 10px 24px rgba(60,40,20,.06);
            }
            .mb-card::after { content: ""; position: absolute; inset: 5px; border: 1px solid var(--mb-line-soft); pointer-events: none; }
            .mb-c-in { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; }
            .mb-c-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px; }
            .mb-badge {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .14em; text-transform: uppercase; font-weight: 500;
                padding: 4px 9px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
            }
            .mb-badge.open { color: var(--mb-ox); border: 1px solid rgba(124,29,43,.4); }
            .mb-badge.live { color: var(--mb-win); border: 1px solid rgba(63,90,49,.45); }
            .mb-badge.live .d { width: 5px; height: 5px; border-radius: 50%; background: var(--mb-win); }
            .mb-c-rcpt { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .1em; color: var(--mb-muted); }
            .mb-c-days { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .12em; color: var(--mb-muted); display: block; margin-bottom: 6px; }
            .mb-c-title {
                font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600;
                font-size: 21px; line-height: 1.06; color: var(--mb-ink);
                margin: 0 0 8px; min-height: 44px;
            }
            .mb-c-dom {
                font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px;
                letter-spacing: .14em; text-transform: uppercase; color: var(--mb-muted);
                display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
            }
            .mb-c-dom .pd { width: 5px; height: 5px; border-radius: 50%; background: var(--mb-ox); opacity: .6; flex: none; }
            .mb-ops { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
            .mb-op { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .mb-op.r { align-items: flex-end; text-align: right; }
            .mb-op .nm { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .04em; color: var(--mb-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
            .mb-op .pc { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; font-weight: 600; }
            .mb-op .pc.up { color: var(--mb-win); }
            .mb-op .pc.mut { color: var(--mb-faint); }
            .mb-vs { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .1em; color: var(--mb-muted); flex: none; }
            .mb-bar { height: 5px; background: rgba(70,55,35,.10); display: flex; overflow: hidden; margin-bottom: 16px; }
            /* flex: none, or the two segments shrink off their set widths and
               the bar stops meaning anything. */
            .mb-bar > div { flex: none; }
            .mb-bar .a { background: var(--mb-win); }
            .mb-bar .b { background: var(--mb-ox); }
            .mb-bar .e { background: repeating-linear-gradient(45deg, rgba(70,55,35,.08) 0 4px, transparent 4px 8px); }
            .mb-c-fin { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-bottom: 14px; padding-top: 12px; border-top: 1px solid var(--mb-line-soft); }
            .mb-c-stake .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: 19px; font-weight: 600; color: var(--mb-ink); }
            .mb-c-stake .v small { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; font-weight: 400; color: var(--mb-muted); letter-spacing: .04em; }
            .mb-c-stake .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--mb-muted); margin-top: 4px; }
            .mb-settle { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--mb-muted); border: 1px solid var(--mb-line); padding: 5px 8px; white-space: nowrap; }
            .mb-c-act {
                margin-top: auto; width: 100%; text-align: center;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
                padding: 12px; border: 0; border-radius: 0; cursor: pointer; display: block;
            }
            .mb-c-act.accept { background: var(--mb-ox); color: #F6EEDD; }
            .mb-c-act.view { border: 1px solid var(--mb-line-firm); color: var(--mb-ink); background: none; }
            .mb-empty {
                grid-column: 1 / -1; text-align: center; padding: 46px 20px;
                border: 1px dashed var(--mb-line-firm); color: var(--mb-muted);
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
            }

            /* ---- issue band ---- */
            .mb-issue {
                margin-top: 34px; background: var(--mb-ox); color: #F3E7D6;
                display: flex; align-items: center; justify-content: center;
                gap: 26px; flex-wrap: wrap; padding: 22px;
                box-shadow: 0 14px 30px rgba(94,20,32,.20);
            }
            .mb-issue .t { font-family: "Cormorant Garamond", Georgia, serif; font-size: 23px; font-weight: 600; }
            .mb-issue .a {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .2em; text-transform: uppercase; font-weight: 500;
                border: 1px solid rgba(243,231,214,.5); padding: 12px 24px;
                color: #F3E7D6; background: none; cursor: pointer;
            }
            .mb-issue .a:hover { background: rgba(243,231,214,.12); }

            /* ---- settlements ledger ---- */
            .mb-ledger { padding-top: 56px; }
            .mb-ltable { border-top: 2px solid var(--mb-ink); }
            .mb-lrowh, .mb-lrow {
                display: grid; grid-template-columns: 110px 1fr 130px 120px 120px 96px;
                gap: 18px; align-items: center;
            }
            .mb-lrowh { padding: 11px 8px; border-bottom: 1px solid var(--mb-line); }
            .mb-lrowh span { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-lrowh .right { text-align: right; }
            .mb-lrow { padding: 14px 8px; border-bottom: 1px solid var(--mb-line-soft); }
            .mb-lrow .rc { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; color: var(--mb-muted); letter-spacing: .04em; }
            .mb-lrow .ct { font-family: "Cormorant Garamond", Georgia, serif; font-size: 18px; font-weight: 600; color: var(--mb-ink); }
            .mb-lrow .rs { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; }
            .mb-lrow .rs.w { color: var(--mb-win); }
            .mb-lrow .rs.l { color: var(--mb-ox); }
            .mb-lrow .am { font-family: "Cormorant Garamond", Georgia, serif; font-size: 19px; font-weight: 600; text-align: right; }
            .mb-lrow .am.w { color: var(--mb-win); }
            .mb-lrow .am.l { color: var(--mb-ox); }
            .mb-lrow .sr { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .06em; color: var(--mb-ink-soft); }
            .mb-lrow .tm { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .06em; color: var(--mb-muted); text-align: right; }
            .mb-foot {
                margin-top: 44px; padding-bottom: 12px; text-align: center;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--mb-muted);
                display: flex; align-items: center; justify-content: center; gap: 16px;
            }

            /* ---- states, motion, focus ---- */
            .mb-cbtn, .mb-bcreate, .mb-c-act, .mb-chip, .mb-seg button, .mb-issue .a {
                transition: background 160ms ease, color 160ms ease, transform 120ms ease, box-shadow 120ms ease;
            }
            .mb-cbtn:hover, .mb-bcreate:hover, .mb-c-act.accept:hover { background: var(--mb-ox-deep); transform: translateY(-1px); }
            .mb-cbtn:active, .mb-bcreate:active, .mb-c-act.accept:active { transform: none; box-shadow: none; }
            .mb-c-act.view:hover, .mb-chip:hover, .mb-seg button:hover { background: rgba(70,55,35,.06); }
            .mb a:focus-visible, .mb button:focus-visible { outline: 2px solid var(--mb-ox); outline-offset: 2px; }
            @media (prefers-reduced-motion: reduce) {
                .mb-cbtn, .mb-bcreate, .mb-c-act, .mb-chip, .mb-seg button, .mb-issue .a { transition: none; }
                .mb-cbtn:hover, .mb-bcreate:hover, .mb-c-act.accept:hover { transform: none; }
            }

            /* ---- responsive ----
               The matrix and the ledger SCROLL rather than reflow. Both are
               tables whose meaning is the alignment of a row against its
               column headers; stacking them into cards throws that away and
               leaves a list of labels nobody reads. */
            @media (max-width: 1180px) {
                .mb-grid { grid-template-columns: repeat(3, 1fr); }
            }
            @media (max-width: 900px) {
                .mb-grid { grid-template-columns: repeat(2, 1fr); }
                .mb-step { grid-template-columns: 1fr; gap: 16px; padding: 22px 0; }
                .mb-builder { grid-template-columns: 1fr; gap: 24px; }
                .mb-solo { padding-top: 44px; }
                .mb-board { padding-top: 46px; }
            }
            @media (max-width: 640px) {
                .mb-grid { grid-template-columns: 1fr; }
                .mb-controls { gap: 14px; }
                .mb-matrix, .mb-ltable { overflow-x: auto; }
                .mb-mx-h, .mb-mx-r, .mb-lrowh, .mb-lrow { min-width: 560px; }
                .mb-lrowh, .mb-lrow { grid-template-columns: 96px 1fr 110px 100px 100px 84px; }
                .mb-solo-emb { height: 44px; }
                .mb-issue { gap: 16px; }
                .mb-foot { letter-spacing: .16em; }
            }
        </style>

        <div class="cl-grain" aria-hidden="true"></div>

        <div class="eq">
            <!-- Section 1: Market hero.
                 Two columns over a full-bleed ruled status strip. The plate is
                 the right-hand subject and the architecture, not the people, is
                 what it is about — the homepage's magistrate and sealing
                 close-up are a different composition and stay on the homepage.

                 The engraving is decorative: the heading below carries the
                 page's meaning, so the plate is aria-hidden and the strip's
                 figures are read as text. -->
            <section class="mkh">
                <div class="mkh-inner">
                    <div class="mkh-art" aria-hidden="true"></div>

                    <div class="mkh-copy">
                        <div class="mkh-eyebrow">Live Clearinghouse</div>
                        <!-- The line break is markup, not a max-width: a measure
                             that happens to wrap in two places today will wrap in
                             three at some width nobody tested. -->
                        <h1 class="mkh-h1">The market for<br><span class="ox">execution.</span></h1>
                        <p class="mkh-lede">Back verified operators&mdash;or stake on your own performance. Every contract settles automatically against live business data.</p>
                        <div class="mkh-actions">
                            <button type="button" class="mkh-btn" onclick="window.router.navigate('/contracts/execute')">Create Contract <span class="a" aria-hidden="true">&rarr;</span></button>
                            <button type="button" class="mkh-link" onclick="window.router.navigate('/market?type=rivalry')"><span class="t">Rivalry Contracts</span> <span class="a" aria-hidden="true">&rarr;</span></button>
                        </div>
                    </div>
                </div>

                <!-- Figures come from MARKET_STATS, the same constant the board's
                     odometers read, so the hero and the board cannot disagree.
                     They are NOT live yet, which is why the row ends by saying
                     so — see the note on .mkh-note. -->
                <div class="mkh-strip">
                    <div class="mkh-strip-in">
                        <span class="mkh-live"><i aria-hidden="true"></i>Live Exchange</span>
                        <span class="mkh-metrics">
                            <span>${MARKET_STATS.openContracts} Open</span>
                            <i class="d" aria-hidden="true"></i>
                            <span>${MARKET_STATS.openCapitalLabel} in Escrow</span>
                            <i class="d" aria-hidden="true"></i>
                            <span>${MARKET_STATS.avgSettlementDays}d Avg. Settlement</span>
                            <span class="mkh-note">Illustrative</span>
                        </span>
                    </div>
                </div>
            </section>

            <!-- ═══════════════════════════════════════════════════════════
                 THE MARKET BOARD

                 THE REFERENCE'S MASTHEAD IS DELIBERATELY NOT HERE. It carried
                 the wordmark, "528 open · $633K in escrow" and a Create
                 Contract button — which is precisely what the hero above
                 already is. Rendering both would print the same headline twice
                 and the same two figures twice on one page, which is the exact
                 contradiction this route was cleaned up to remove. The hero is
                 that masthead; everything below is what follows it.
                 ═══════════════════════════════════════════════════════════ -->

            <!-- ── CREATE ──
                 #ss-root and the .ss-metric / .ss-go / .ss-m-state hooks are
                 kept EXACTLY as they were. The look is new; the wiring behind
                 it is the existing loadSourceState(), which reads real Plaid,
                 Stripe, Shopify and YouTube connection status off the API. That
                 logic is the only genuinely live thing on this route and it
                 would have been thrown away by rebuilding the markup fresh. -->
            <section class="mb mb-solo" id="ss-root" data-bank="none">
                <div class="mb-solo-top">
                    <img class="mb-solo-emb" src="/assets/images/solo-seal.webp" alt="" aria-hidden="true">
                    <div>
                        <div class="mb-kick"><span class="r"></span> Create</div>
                        <h2>Stake on <span class="ox">your own goal.</span></h2>
                    </div>
                </div>
                <p class="mb-lede">Three steps. Priced from your last twelve months &mdash; not a menu.</p>

                <div class="mb-step">
                    <div>
                        <div class="mb-snum">01</div>
                        <div class="mb-stt">Connect your bank</div>
                    </div>
                    <div>
                        <p class="mb-sdesc">Read-only, via Plaid.</p>
                        <button type="button" class="mb-cbtn" id="ss-connect-bank" data-source="bank">Connect Bank <span class="tag">Plaid &middot; read-only</span></button>
                        <div class="mb-reassure"><span class="mb-mark" style="width:7px;height:7px"></span> Revocable anytime.</div>
                    </div>
                </div>

                <div class="mb-step">
                    <div>
                        <div class="mb-snum">02</div>
                        <div class="mb-stt">Choose what you&rsquo;re measured on</div>
                    </div>
                    <div>
                        <p class="mb-sdesc">Money is ready once your bank connects. The rest need their own source.</p>
                        <div class="mb-matrix">
                            <div class="mb-mx-h">
                                <span class="l">Metric</span>
                                <span>Bank<span class="conn" id="mb-bank-conn" hidden>Connected</span></span>
                                <span>Stripe</span>
                                <span>Shopify</span>
                                <span>YouTube</span>
                                <span class="rt">Availability</span>
                            </div>

                            <div class="mb-mx-r ss-metric locked" data-metric="money">
                                <div><div class="mb-mn">Money received</div><div class="mb-md ss-m-state"></div></div>
                                <div class="mb-mx-cell"><span class="mb-dot-o" data-src="bank"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="money">Connect bank &rarr;</button></div>
                            </div>

                            <div class="mb-mx-r ss-metric locked ss-gated" data-metric="mrr">
                                <div><div class="mb-mn">MRR</div><div class="mb-md ss-m-state"></div></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="bank"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-o" data-src="stripe"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="mrr">Connect Stripe &rarr;</button></div>
                            </div>

                            <div class="mb-mx-r ss-metric locked ss-gated" data-metric="orders">
                                <div><div class="mb-mn">Orders</div><div class="mb-md ss-m-state"></div></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="bank"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-o" data-src="shopify"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="orders">Connect Shopify &rarr;</button></div>
                            </div>

                            <div class="mb-mx-r ss-metric locked ss-gated" data-metric="views">
                                <div><div class="mb-mn">Views</div><div class="mb-md ss-m-state"></div></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="bank"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                <div class="mb-mx-cell"><span class="mb-dot-o" data-src="youtube"></span></div>
                                <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="views">Connect YouTube &rarr;</button></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-step">
                    <div>
                        <div class="mb-snum">03</div>
                        <div class="mb-stt">Set your terms</div>
                    </div>
                    <div class="mb-builder">
                        <div class="mb-bnote">
                            <span class="big">Priced from your record.</span>
                            Your verified history sets the price. Choose the target, window, and amount at risk &mdash; the return updates automatically.
                        </div>
                        <!-- A WORKED EXAMPLE, AND IT SAYS SO. Every figure here is
                             priced per person from verified history after the
                             examination, so printing $250 -> $1,000 without the
                             marker below would read as an offer this page cannot
                             make. -->
                        <div class="mb-bcard">
                            <div class="mb-bh">
                                <div class="mb-bt-top">
                                    <span class="mb-bt-k">Solo Contract &middot; Example</span>
                                    <span class="mb-bt-k" id="mb-bt-verified">Bank required</span>
                                </div>
                                <div class="mb-bt-title">Money Received</div>
                                <div class="mb-brule"></div>
                                <div class="mb-brow"><span class="k">Target</span><span class="v">+20%<span class="adj">Adjust</span></span></div>
                                <div class="mb-brow"><span class="k">Window</span><span class="v">30 Days<span class="adj">Adjust</span></span></div>
                                <div class="mb-brow"><span class="k">Stake</span><span class="v">$250<span class="adj">Adjust</span></span></div>
                                <div class="mb-bmult"><span class="k">Payout Multiplier</span><span class="v">4.0&times;</span></div>
                                <div class="mb-bplain">Risk <b>$250</b> to earn <b>$1,000</b> profit if Money Received grows 20% in 30 days.</div>
                                <div class="mb-bout"><span class="w">&#9670; Hit target &middot; +$1,000</span><span class="l">Miss &middot; &minus;$250</span></div>
                                <button type="button" class="mb-bcreate" data-source="money">Create Contract &rarr;</button>
                                <span class="mb-bex">Illustrative &mdash; your terms are priced from your own history</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── BOARD ── -->
            <section class="mb mb-board">
                <div class="mb-lhead">
                    <span class="lab"><span class="mb-mark"></span> Open Rivalries</span>
                    <span class="ln"></span>
                    <button type="button" class="act" id="btn-rules">Execution rules &rarr;</button>
                </div>

                <div class="mb-controls">
                    <div class="mb-seg" id="mb-seg">
                        <button type="button" class="on" data-state="all">All Contracts</button>
                        <button type="button" data-state="open">Open</button>
                        <button type="button" data-state="live">Live</button>
                    </div>
                    <div class="mb-chips" id="eq-filters">
                        <button type="button" class="mb-chip on" data-category="all">All</button>
                        <button type="button" class="mb-chip" data-category="social">Social</button>
                        <button type="button" class="mb-chip" data-category="commerce">Commerce</button>
                        <button type="button" class="mb-chip" data-category="finance">Finance</button>
                    </div>
                    <!-- The count is the length of what is actually on the board.
                         The reference printed 528 next to eight cards; a results
                         count that disagrees with the results is the same class of
                         bug as the hero and the odometers disagreeing. -->
                    <div class="mb-sortr">
                        <span><b id="mb-count">0</b> results</span>
                        <span>Sort: <b id="mb-sort-lbl">Trending</b></span>
                    </div>
                </div>

                <div class="mb-grid" id="rivalry-grid"></div>

                <div class="mb-issue">
                    <span class="t">No match?</span>
                    <button type="button" class="a" onclick="window.router.navigate('/rivalry')">Create a Rivalry &rarr;</button>
                </div>
            </section>

            <!-- ── SETTLEMENTS ── -->
            <section class="mb mb-ledger">
                <div class="mb-lhead">
                    <span class="lab"><span class="mb-mark"></span> Recent Settlements</span>
                    <span class="ln"></span>
                    <button type="button" class="act" onclick="window.router.navigate('/receipts')">View full ledger &rarr;</button>
                </div>
                <div class="mb-ltable">
                    <div class="mb-lrowh">
                        <span>Receipt</span><span>Contract</span><span>Result</span>
                        <span class="right">Amount</span><span>Source</span><span class="right">Settled</span>
                    </div>
                    <div id="mb-ledger-rows"></div>
                </div>
                <div class="mb-foot">
                    <span class="mb-mark"></span> Capital at risk &middot; Outcomes are final <span class="mb-mark"></span>
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

/* initXhParallax is gone with the hero. It drove three layers — the plate, the
   band inscriptions and the specimen contract — and the last of those markup
   elements went with the masthead rewrite, so it was left scanning for
   [data-xh-par] and finding nothing. A 150px frieze does not want parallax
   anyway: 0.12 of scroll over the ~275px it is visible is 33px of travel,
   which is below the threshold of being felt and above the cost of the
   headroom and crop maths it forced on the plate. */


export function initActiveContracts() {
    // The board's own filters. Domain across, state down.
    let activeCategory = 'all';
    let activeState = 'all';

    /* THE ODOMETERS ARE GONE WITH THE SECOND MASTHEAD THEY LIVED IN. They
       animated #stat-capital / #stat-contracts / #stat-pool inside the old
       "Collateral Market." header, which duplicated the hero — so the page
       printed the same three figures twice. The hero's status strip is now the
       only place those numbers appear, and it still reads MARKET_STATS. */

    /* Settlements. One array, so a row cannot disagree with itself, and the
       shape is already what a ledger endpoint would return. Illustrative until
       it is fed — see the marker at the foot of the table. */
    const RECENT_SETTLEMENTS = [
        { receipt: 'RCPT-3901', contract: 'Net Revenue +20%',        won: true,  amount: 1000, source: 'Stripe',  ago: '2m ago',  result: 'Target met' },
        { receipt: 'RCPT-3888', contract: 'Follower Sprint',         won: false, amount: 500,  source: 'X API',   ago: '14m ago', result: 'Missed' },
        { receipt: 'RCPT-3877', contract: 'MRR Rivalry · @harbor won', won: true, amount: 2400, source: 'Stripe', ago: '31m ago', result: 'Settled' },
        { receipt: 'RCPT-3860', contract: 'Order Volume Target',     won: true,  amount: 750,  source: 'Shopify', ago: '1h ago',  result: 'Target met' },
        { receipt: 'RCPT-3852', contract: 'Watch-Time Rivalry',      won: false, amount: 1000, source: 'YouTube', ago: '2h ago',  result: 'Missed' },
        { receipt: 'RCPT-3844', contract: 'Subscriber Growth',       won: true,  amount: 1800, source: 'YouTube', ago: '3h ago',  result: 'Target met' },
    ];

    function renderLedger() {
        const host = document.getElementById('mb-ledger-rows');
        if (!host) return;
        host.innerHTML = '';
        RECENT_SETTLEMENTS.forEach((s) => {
            const row = document.createElement('div');
            row.className = 'mb-lrow';
            const cls = s.won ? 'w' : 'l';
            const sign = s.won ? '+' : '−';
            row.innerHTML =
                '<span class="rc">' + s.receipt + '</span>' +
                '<span class="ct"></span>' +
                '<span class="rs ' + cls + '">' + s.result + '</span>' +
                '<span class="am ' + cls + '">' + sign + '$' + s.amount.toLocaleString() + '</span>' +
                '<span class="sr" title="Verified at source">' + s.source + ' ✓</span>' +
                '<span class="tm">' + s.ago + '</span>';
            // textContent, not innerHTML: contract names are data and will come
            // from an endpoint, so they never get to carry markup.
            row.querySelector('.ct').textContent = s.contract;
            host.appendChild(row);
        });
    }


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
        },
        /* The four the reference board added. They go in the SAME array rather
           than into the markup as literal cards: the count, the domain chips
           and the state segments all derive from this list, so a card that
           lived in the HTML would be invisible to every filter and would make
           the results count lie. */
        {
            id: 'RVL-5567-E',
            title: 'MRR Sprint (30d)',
            domain: 'finance',
            platform: 'STRIPE',
            rail: 'CLTR · ON-CHAIN',
            state: 'open',
            receipt: 'RCPT-5567',
            days_left: 5,
            stake_per_side: 1500,
            total_pool: 3000,
            op1: { handle: '@quill', delta: '+11.0%', is_leader: true },
            op2: { handle: 'AWAITING COUNTERPARTY', delta: '—', is_leader: false }
        },
        {
            id: 'RVL-8820-F',
            title: 'Order Volume',
            domain: 'commerce',
            platform: 'SHOPIFY',
            rail: 'USD · CUSTODIAL',
            state: 'live',
            receipt: 'RCPT-8820',
            days_left: 12,
            stake_per_side: 1000,
            total_pool: 2000,
            op1: { handle: '@harbor', delta: '+41.0%', is_leader: true },
            op2: { handle: '@dune', delta: '+38.0%', is_leader: false }
        },
        {
            id: 'RVL-6034-G',
            title: 'Follower Growth (14d)',
            domain: 'social',
            platform: 'X API',
            rail: 'CLTR · ON-CHAIN',
            state: 'open',
            receipt: 'RCPT-6034',
            days_left: 2,
            stake_per_side: 300,
            total_pool: 600,
            op1: { handle: '@vela', delta: '+6.3%', is_leader: true },
            op2: { handle: 'AWAITING COUNTERPARTY', delta: '—', is_leader: false }
        },
        {
            id: 'RVL-4471-H',
            title: 'Watch-Time',
            domain: 'social',
            platform: 'YOUTUBE',
            rail: 'USD · CUSTODIAL',
            state: 'live',
            receipt: 'RCPT-4471',
            days_left: 18,
            stake_per_side: 2000,
            total_pool: 4000,
            op1: { handle: '@orion', delta: '+28.0%', is_leader: true },
            op2: { handle: '@pike', delta: '+25.0%', is_leader: false }
        }
    ];

    /* THE BOARD IS BUILT WITHOUT A TEMPLATE LITERAL, ON PURPOSE. Handles and
       contract titles are data; the moment they come from an endpoint instead
       of the array above, interpolating them into an HTML string is an
       injection. Structure is set as markup, every value is set with
       textContent, and the two never mix. */
    function renderRivalries() {
        const rGrid = document.getElementById('rivalry-grid');
        if (!rGrid) return;
        rGrid.innerHTML = '';

        let list = mockRivalries.slice();
        if (activeCategory !== 'all') {
            list = list.filter(r => r.domain.toLowerCase() === activeCategory.toLowerCase());
        }
        if (activeState !== 'all') {
            list = list.filter(r => r.state === activeState);
        }

        // Open challenges first: they are the only ones a reader can act on.
        list.sort((a, b) => (a.state === 'open' ? -1 : b.state === 'open' ? 1 : 0));

        const count = document.getElementById('mb-count');
        if (count) count.textContent = String(list.length);

        if (list.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'mb-empty';
            empty.textContent = 'No contracts match these filters';
            rGrid.appendChild(empty);
            return;
        }

        const el = (tag, cls, text) => {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text != null) n.textContent = text;
            return n;
        };

        list.forEach((r) => {
            const isOpen = r.state === 'open';
            const d1 = parseFloat(r.op1.delta) || 0;
            const d2 = parseFloat(r.op2.delta) || 0;
            const op1Lead = d1 >= d2;

            const card = el('article', 'mb-card');
            const inner = el('div', 'mb-c-in');

            // ---- badge + receipt
            const top = el('div', 'mb-c-top');
            const badge = el('span', 'mb-badge ' + (isOpen ? 'open' : 'live'));
            if (!isOpen) badge.appendChild(el('span', 'd'));
            badge.appendChild(document.createTextNode(isOpen ? 'Open Rivalry' : 'Live Rivalry'));
            top.appendChild(badge);
            top.appendChild(el('span', 'mb-c-rcpt', r.receipt.replace('-', '·')));
            inner.appendChild(top);

            // ---- deadline, title, domain
            inner.appendChild(el('span', 'mb-c-days', r.days_left + 'D LEFT'));
            inner.appendChild(el('h3', 'mb-c-title', r.title));
            const dom = el('div', 'mb-c-dom');
            dom.appendChild(el('span', 'pd'));
            dom.appendChild(document.createTextNode(r.domain + ' · ' + r.platform));
            inner.appendChild(dom);

            // ---- the two sides
            const ops = el('div', 'mb-ops');
            const left = el('div', 'mb-op');
            left.appendChild(el('span', 'nm', r.op1.handle));
            left.appendChild(el('span', 'pc up', r.op1.delta));
            ops.appendChild(left);
            ops.appendChild(el('span', 'mb-vs', 'VS'));
            const right = el('div', 'mb-op r');
            right.appendChild(el('span', 'nm', isOpen ? 'Open slot' : r.op2.handle));
            right.appendChild(el('span', 'pc ' + (isOpen ? 'mut' : 'up'), isOpen ? '—' : r.op2.delta));
            ops.appendChild(right);
            inner.appendChild(ops);

            /* The share bar is drawn from the two deltas, not from a literal.
               An open challenge has one side and no contest to show, so it gets
               a half-filled bar and a hatched remainder rather than a 50/50
               split implying an opponent who is not there. */
            const seg = (cls, pct) => {
                const n = el('div', cls);
                // setAttribute, not el.style = "...": assigning a string to the
                // style PROPERTY relies on a setter that is not universal.
                n.setAttribute('style', 'width:' + pct + '%');
                return n;
            };
            const bar = el('div', 'mb-bar');
            if (isOpen) {
                bar.appendChild(seg('a', 50));
                bar.appendChild(seg('e', 50));
            } else {
                const total = Math.abs(d1) + Math.abs(d2);
                const share = total > 0 ? Math.round((Math.abs(d1) / total) * 100) : 50;
                // Clamped: a 41% vs 0% duel would otherwise draw a full bar and
                // read as settled when it is still running.
                const lead = Math.min(80, Math.max(20, share));
                bar.appendChild(seg('a', lead));
                bar.appendChild(seg('b', 100 - lead));
            }
            inner.appendChild(bar);

            // ---- stake + rail
            const fin = el('div', 'mb-c-fin');
            const stake = el('div', 'mb-c-stake');
            const v = el('div', 'v');
            v.appendChild(document.createTextNode('$' + r.stake_per_side.toLocaleString() + ' '));
            v.appendChild(el('small', null, '/ side'));
            stake.appendChild(v);
            stake.appendChild(el('div', 'k', '$' + r.total_pool.toLocaleString() + ' Total Pool'));
            fin.appendChild(stake);
            fin.appendChild(el('span', 'mb-settle', r.rail));
            inner.appendChild(fin);

            // ---- action
            const act = el('button', 'mb-c-act ' + (isOpen ? 'accept' : 'view'),
                isOpen ? 'Join Rivalry' : 'View Rivalry →');
            act.type = 'button';
            act.addEventListener('click', () => {
                if (window.router) window.router.navigate('/rivalry');
            });
            inner.appendChild(act);

            card.appendChild(inner);
            rGrid.appendChild(card);
        });
    }



    /* State segments (All / Open / Live) and domain chips. Both filter the same
       list and both re-derive the results count, so the number beside "results"
       cannot drift away from the number of cards under it. */
    const segContainer = document.getElementById('mb-seg');
    if (segContainer) {
        segContainer.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-state]');
            if (!b) return;
            segContainer.querySelectorAll('button').forEach(x => x.classList.remove('on'));
            b.classList.add('on');
            activeState = b.dataset.state;
            renderRivalries();
        });
    }

    const filtersContainer = document.getElementById('eq-filters');
    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            const pill = e.target.closest('.mb-chip');
            if (!pill) return;
            filtersContainer.querySelectorAll('.mb-chip').forEach(p => p.classList.remove('on'));
            pill.classList.add('on');
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
    /* THE SCROLL-REVEAL IS GONE WITH THE CARDS IT ANIMATED. It faded in
       .ss-step / .ss-metric tiles from opacity 0, and it once shipped a blank
       bordered box when its observer threshold could not be met on a section
       taller than the viewport — which is why it had a timeout, a forced-paint
       fallback and a per-element opacity probe bolted onto it. The matrix
       replacing those tiles is a table that is simply painted, so there is no
       hidden state left to get stuck in. The three guarantees are unnecessary
       because the thing they guarded against cannot happen now. */
    const ssRoot = document.getElementById('ss-root');
    if (ssRoot) {
        /* THE DOTS AND THE AVAILABILITY COLUMN READ THE SAME REAL STATE.
           loadSourceState() below already fetches genuine Plaid/Stripe/Shopify/
           YouTube connection status; this paints it into the new matrix so the
           grid is not decoration sitting next to live text. */
        function paintSources(bank, stripe, shopify, youtube) {
            const state = { bank: bank, stripe: stripe, shopify: shopify, youtube: youtube };
            ssRoot.querySelectorAll('[data-src]').forEach((cell) => {
                const src = cell.getAttribute('data-src');
                // A ring means "this metric needs this source"; filled means it
                // is connected. Never downgrade a rule to a ring.
                const needed = cell.classList.contains('mb-dot-o') || cell.classList.contains('mb-dot');
                if (!needed) return;
                cell.className = state[src] ? 'mb-dot' : 'mb-dot-o';
                cell.setAttribute('data-src', src);
            });
            const conn = document.getElementById('mb-bank-conn');
            if (conn) conn.hidden = !bank;
            const verified = document.getElementById('mb-bt-verified');
            if (verified) {
                verified.textContent = bank ? 'Bank verified ✓' : 'Bank required';
                verified.style.color = bank ? 'var(--mb-win)' : '';
            }
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

            paintSources(
                bankConnected,
                !!(stripe && stripe.connected),
                !!(shopify && shopify.connected),
                !!(youtube && youtube.connected)
            );

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
                if (go) go.textContent = 'Ready ✓';
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
    renderLedger();
}
