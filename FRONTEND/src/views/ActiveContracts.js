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
 * IT IS LIVE NOW, and the difference was not small. These values were 528 open
 * contracts and $633.6k in escrow. /v1/market/homepage-stats reports 2 and
 * $2,000. A board carrying eight rivalries was printing a market 264 times the
 * size of the real one, next to a heading that promises settlement "against
 * live business data" — the single most damaging thing on the page, because it
 * is the claim the product is actually selling.
 *
 * Nothing here is a default that gets shown. Every field starts null, the strip
 * renders an em dash until the fetch lands, and a failed fetch stays an em dash
 * rather than falling back to a flattering number.
 */
export const MARKET_STATS = {
    openContracts: null,
    openCapital: null,
    avgSettlementDays: null,
    loaded: false,

    /* Pre-formatted for the hero strip, which has room for a rounded figure and
       not for six digits. Derived rather than typed, so it cannot disagree with
       openCapital above. Under $1k it shows dollars: rounding $2,000 to "$2K" is
       fine, rounding $400 to "$0K" is not. */
    get openCapitalLabel() {
        if (this.openCapital == null) return '—';
        return this.openCapital >= 1000
            ? '$' + Math.round(this.openCapital / 1000) + 'K'
            : '$' + Math.round(this.openCapital).toLocaleString();
    },
    get openContractsLabel() {
        return this.openContracts == null ? '—' : String(this.openContracts);
    },
    get settlementLabel() {
        return this.avgSettlementDays == null ? '—' : this.avgSettlementDays + 'd';
    },
};

/**
 * Fills MARKET_STATS from the real endpoint and repaints the hero strip.
 *
 * capitalLocked comes back in DOLLARS from this endpoint while the billing
 * balances are in cents — checked against the live response rather than
 * assumed, because guessing wrong here is a 100x error in public.
 */
export async function loadMarketStats() {
    try {
        /* RIVALRY STATS, NOT HOMEPAGE STATS. /v1/market/homepage-stats reports
           activeContractsCount, which counts solo contracts — the instrument
           this product no longer sells and which no longer appears on the board
           below. Reading it put "2 Active" above a board showing one rivalry.
           /v1/rivalries/stats counts the thing the page is actually about, and
           reports capital in CENTS where the homepage endpoint used dollars —
           checked against the live response, because guessing wrong there is a
           100x error in public. */
        const res = await window.api.getRivalryStats();
        const s = (res && res.stats) || {};
        if (!res || res.ok === false) return;
        MARKET_STATS.openContracts = Number(s.activeRivalries) || 0;
        MARKET_STATS.openCapital = Math.round((Number(s.totalCapitalLockedCents) || 0) / 100);
        MARKET_STATS.loaded = true;
    } catch (e) {
        console.error('[Market] stats unavailable:', e);
        return; // leave the dashes
    }
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    /* "LIVE", and it means the same thing the board's Live segment means:
       rivalries currently running with capital locked against them. The strip
       and the board now count the same population from the same product, so
       there is no second number on this page for a reader to reconcile. */
    set('mkh-open', MARKET_STATS.openContractsLabel + ' Live');
    set('mkh-escrow', MARKET_STATS.openCapitalLabel + ' in Escrow');
    // The settlement window is a property of each contract, not of the market,
    // and this endpoint does not report an average. It stays out of the strip
    // rather than being filled with a plausible "30d".
    const note = document.querySelector('.mkh-note');
    if (note && MARKET_STATS.loaded) note.remove();
}

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

            /* ---- create (solo) ----
               ONE CARD THAT ADVANCES IN PLACE, not three stacked sections.
               The previous layout printed all three steps at once down a 250px
               rail, which meant the terms builder and a contract preview were
               both on screen before a source existed to price either of them —
               so the only honest thing they could show was a worked example
               with a disclaimer under it. A wizard can ask for one thing at a
               time and therefore never has to invent the next thing. */
            .mb-solo { padding-top: 58px; }
            .mb-w-col { max-width: 920px; margin: 0 auto; }
            .mb-w-head { text-align: center; margin-bottom: 20px; }
            .mb-w-head .k {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .30em; text-transform: uppercase;
                color: var(--mb-ox); font-weight: 500;
            }
            .mb-w-head h2 {
                font-family: "Cormorant Garamond", Georgia, serif;
                font-weight: 600; font-size: clamp(30px, 3.4vw, 40px); line-height: 1.02;
                color: var(--mb-ink); margin: 9px 0 0;
            }
            .mb-w-head h2 .ox { color: var(--mb-ox); }
            .mb-lede { font-size: 16px; line-height: 1.55; color: var(--mb-ink-soft); margin: 10px 0 0; }

            .mb-wiz { background: var(--mb-paper); border: 1px solid var(--mb-line-firm); box-shadow: 0 26px 60px rgba(60,40,20,.16); }
            .mb-wiz-top {
                display: flex; align-items: center; justify-content: space-between; gap: 20px;
                padding: 18px 28px; border-bottom: 1px solid var(--mb-line);
            }
            .mb-wiz-brand { display: flex; align-items: center; gap: 13px; }
            .mb-wiz-brand img { height: 34px; width: auto; flex: none; }
            .mb-wiz-brand .nm { font-family: "Cormorant Garamond", Georgia, serif; font-size: 17px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
            .mb-wiz-brand .sb { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: var(--mb-ox); }

            /* The stepper is a list of the three steps, in order, with the
               current one marked — an <ol> with aria-current, so it is the same
               fact to a screen reader that the discs are to everyone else. */
            .mb-stp { display: flex; align-items: center; list-style: none; margin: 0; padding: 0; }
            .mb-stp .n { display: flex; align-items: center; gap: 9px; }
            .mb-stp .disc {
                width: 26px; height: 26px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px;
                border: 1.4px solid var(--mb-line-firm); color: var(--mb-muted); background: var(--mb-paper);
                flex: none; transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
            }
            .mb-stp .disc.done { background: var(--mb-win); border-color: var(--mb-win); color: #F1EAD8; }
            .mb-stp .disc.on { background: var(--mb-ox); border-color: var(--mb-ox); color: #F6EEDD; box-shadow: 0 0 0 4px rgba(124,29,43,.13); }
            .mb-stp .lb { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-stp .lb.act { color: var(--mb-ink); }
            .mb-stp .bar { width: 34px; height: 1px; background: var(--mb-line-firm); margin: 0 12px; flex: none; }

            .mb-wiz-body { padding: 26px 28px 8px; }
            /* min-width: 0, WITHOUT WHICH overflow-x: auto DOES NOTHING on the
               matrix inside. A flex/grid item's automatic minimum size is its
               content's min-content width, so the matrix's row floor would grow
               this container rather than letting the table scroll inside it —
               and body's overflow-x: hidden then silently CUTS the right-hand
               columns instead of showing a scrollbar. */
            .mb-wiz-body > * { min-width: 0; }
            .mb-wiz-foot {
                display: flex; align-items: center; justify-content: space-between; gap: 18px;
                padding: 18px 28px; border-top: 1px solid var(--mb-line); background: rgba(250,244,230,.5);
            }
            .mb-wstep { display: none; }
            .mb-wstep.on { display: block; }

            /* A finished step collapses to one line: the check, what was chosen,
               and the way back to it. */
            .mb-srow {
                display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
                padding: 13px 16px; border: 1px solid var(--mb-line);
                background: rgba(250,244,230,.75); margin-bottom: 12px;
            }
            .mb-srow .ic {
                width: 22px; height: 22px; border-radius: 50%; background: var(--mb-win); color: #F1EAD8;
                display: flex; align-items: center; justify-content: center; font-size: 12px; flex: none;
            }
            .mb-srow .lab {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-muted); width: 66px; flex: none;
            }
            .mb-srow .g { width: 17px; height: 17px; color: var(--mb-ink-soft); flex: none; }
            .mb-srow .val { font-family: "Cormorant Garamond", Georgia, serif; font-size: 19px; font-weight: 600; }
            .mb-srow .val small { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10px; font-weight: 400; color: var(--mb-muted); margin-left: 8px; }
            .mb-srow .edit {
                margin-left: auto; background: none; border: 0; cursor: pointer;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--mb-ox);
            }
            .mb-srow .edit:hover { text-decoration: underline; }

            .mb-act-head {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
                color: var(--mb-ox); margin: 6px 0 13px; font-weight: 500;
            }
            .mb-act-title { font-family: "Cormorant Garamond", Georgia, serif; font-size: 26px; font-weight: 600; margin: 0 0 4px; line-height: 1.05; }
            .mb-act-sub { font-size: 14px; line-height: 1.5; color: var(--mb-ink-soft); margin: 0 0 18px; }

            /* ---- the source matrix ----
               A TABLE, BECAUSE IT IS ONE. Metric down the side, source across
               the top, availability in the last column: the whole question a
               reader has here is "what can I actually be measured on", and a
               grid answers it in one look where four stacked cards did not. */
            /* SCROLLS AT EVERY WIDTH, not only on phones. Both of these are
               tables with fixed side columns, and they run out of room well
               before the 640px breakpoint the scroll rule used to live at — the
               ledger already overflows at 834. With body carrying
               overflow-x: hidden that overflow does not push the page or show a
               scrollbar; it just silently CUTS the right-hand columns off, which
               is the worst of the three outcomes. Above the point where they
               fit, auto is inert. */
            .mb-matrix, .mb-ltable { overflow-x: auto; }
            .mb-matrix { border-top: 2px solid var(--mb-ink); }
            /* NO GAP, AND THE PADDING LIVES IN THE CELLS. A column gap would cut
               the bank column's tint into four floating blocks; with the cells
               stretched edge to edge it reads as one continuous spine down the
               table, which is the point — the bank is the column every other
               row depends on. */
            .mb-mx-h, .mb-mx-r {
                display: grid;
                grid-template-columns: 1.9fr .74fr .74fr .74fr .74fr 1.32fr;
                align-items: center; gap: 0; padding: 0;
            }
            .mb-mx-h { border-bottom: 1px solid var(--mb-line); }
            .mb-mx-h span {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-muted); text-align: center;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                align-self: stretch; padding: 13px 8px;
            }
            .mb-mx-h span.l { text-align: left; align-items: flex-start; }
            .mb-mx-h span.rt { text-align: right; align-items: flex-end; }
            /* The chip states a fact, so it appears only when the fact is true.
               #ss-root already carries data-bank, set by loadSourceState(). */
            .mb-mx-h .conn { display: none; color: var(--mb-win); font-size: 8.5px; margin-top: 4px; letter-spacing: .12em; }
            #ss-root[data-bank="connected"] .mb-mx-h .conn { display: block; }
            .mb-mx-r { border-bottom: 1px solid var(--mb-line-soft); }
            .mb-mx-r:last-child { border-bottom: 0; }
            /* .ss-metric (the shared hook these rows still answer to) paints card
               stock and a left rule for the old two-up tiles. In the table the
               rows sit on the parchment itself, and .ready must not repaint the
               row pink — the READY badge in the last column carries that state. */
            .mb-matrix .mb-mx-r,
            .mb-matrix .mb-mx-r.ready { background: transparent; border-left: 0; }
            .mb-mx-metric { padding: 15px 8px; min-width: 0; }
            .mb-mn { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; font-weight: 600; color: var(--mb-ink); line-height: 1.05; }
            .mb-md {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
                color: var(--mb-muted); margin-top: 6px;
            }
            .mb-md:empty { display: none; }
            .mb-mx-cell { display: flex; justify-content: center; align-items: center; align-self: stretch; padding: 15px 6px; }
            /* Warm neutral, not green: the tint marks the column, it does not
               claim the bank is attached. That claim is the ✓ CONNECTED chip. */
            .mb-bankcol { background: rgba(70,55,35,.05); }
            /* Three states, and they are legible without colour: filled = the
               source is connected, ring = it is the one this metric needs, rule
               = not applicable. Colour alone would fail anyone who cannot see it. */
            .mb-dot { width: 11px; height: 11px; border-radius: 50%; background: var(--mb-win); flex: none; }
            .mb-dot-o { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--mb-ox); flex: none; }
            .mb-dot-e { width: 7px; height: 1px; background: var(--mb-line-firm); flex: none; }
            /* The key, above the table. Four rows of dots with no legend made the
               reader infer three states from context; naming them costs one line. */
            .mb-mx-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 9px 26px; margin: 16px 0 14px; }
            .mb-lg {
                display: inline-flex; align-items: center; gap: 9px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--mb-muted);
            }
            .mb-mx-avail {
                display: flex; justify-content: flex-end; align-items: center;
                padding: 11px 8px 11px 6px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
            }
            /* THE BRAND MARKS ARE BACKGROUNDS, NOT CHILD <svg>s. applyCardState()
               drives this button through textContent — "Connect Stripe →",
               "Ready ✓", "Bank required" — which replaces every child node. An
               inline icon would survive exactly until the first state refresh. */
            .mb-mx-avail .ss-go {
                display: inline-flex; align-items: center;
                color: var(--mb-ox); text-decoration: none; cursor: pointer;
                background-color: transparent; background-repeat: no-repeat;
                background-position: 14px 50%; background-size: 13px 13px;
                border: 1px solid rgba(124,29,43,.45); border-radius: 0;
                padding: 9px 15px; text-align: left;
                font: inherit; letter-spacing: inherit; text-transform: inherit;
                transition: background-color 150ms ease, border-color 150ms ease;
            }
            .mb-mx-avail .ss-go:hover { background-color: rgba(124,29,43,.08); border-color: var(--mb-ox); text-decoration: none; }
            /* .ss-metric:hover .ss-go nudges the old tile's text link sideways.
               A bordered button sliding out from under its own row is not that. */
            .ss-metric:hover .mb-mx-avail .ss-go { transform: none; opacity: 1; }
            .mb-mx-avail .ss-go[data-source="mrr"] {
                padding-left: 35px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237C1D2B'%3E%3Cpath d='M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z'/%3E%3C/svg%3E");
            }
            .mb-mx-avail .ss-go[data-source="orders"] {
                padding-left: 35px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237C1D2B'%3E%3Cpath d='M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z'/%3E%3C/svg%3E");
            }
            .mb-mx-avail .ss-go[data-source="views"] {
                padding-left: 35px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237C1D2B'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E");
            }
            /* Ready is a state, not an errand: green badge, no brand mark, no
               "connect" affordance to click through. */
            .mb-matrix .ss-metric.ready .mb-mx-avail .ss-go {
                color: var(--mb-win); border-color: rgba(63,90,49,.45);
                background-color: rgba(63,90,49,.09); background-image: none;
                padding-left: 15px;
            }
            .mb-matrix .ss-metric.ready .mb-mx-avail .ss-go:hover {
                background-color: rgba(63,90,49,.16); border-color: var(--mb-win);
            }
            /* Source attached but bank still missing, or waiting on history to
               accrue. Neither is an action on this row — it names the outstanding
               prerequisite — so neither gets a button's border or a brand mark. */
            .mb-matrix .ss-metric.needs-bank .mb-mx-avail .ss-go,
            .mb-matrix .ss-metric.waiting .mb-mx-avail .ss-go {
                color: var(--mb-muted); cursor: default; text-decoration: none;
                background: none; border-color: transparent; padding: 9px 0;
            }
            .mb-matrix .ss-metric.needs-bank .mb-mx-avail .ss-go:hover,
            .mb-matrix .ss-metric.waiting .mb-mx-avail .ss-go:hover {
                background: none; border-color: transparent; text-decoration: none;
            }
            .mb-mx-note {
                margin-top: 16px; display: flex; align-items: center; gap: 9px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--mb-muted);
            }

            /* ---- choosing a metric ----
               The spine is the selection, and it is on the LEFT edge of the row
               rather than a fill across it: the bank column already carries a
               tint, and two washes in one row stopped reading as two different
               facts. */
            .mb-mx-r.mb-selectable { cursor: pointer; }
            .mb-mx-r.mb-selectable:hover { background: rgba(70,55,35,.03); }
            .mb-matrix .mb-mx-r.sel,
            .mb-matrix .mb-mx-r.sel.ready { background: rgba(124,29,43,.05); position: relative; }
            .mb-mx-r.sel::before {
                content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                width: 3px; background: var(--mb-ox);
            }
            /* Chosen: solid, because it is the one row the footer's Continue is
               about. Ready-but-unchosen stays the green badge. */
            .mb-matrix .ss-metric.sel .mb-mx-avail .ss-go {
                background-color: var(--mb-ox); background-image: none;
                border-color: var(--mb-ox); color: #F6EEDD; padding-left: 15px;
            }
            .mb-matrix .ss-metric.sel .mb-mx-avail .ss-go:hover { background-color: var(--mb-ox-deep); border-color: var(--mb-ox-deep); }

            /* ---- terms ---- */
            .mb-field { margin-bottom: 22px; }
            .mb-flabel { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 10px; }
            .mb-flabel .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-flabel .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: 25px; font-weight: 600; line-height: 1; }
            .mb-hint { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9.5px; letter-spacing: .06em; color: var(--mb-muted); margin-top: 9px; }
            .mb-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(70,55,35,.14); outline: none; display: block; }
            .mb-range::-webkit-slider-thumb {
                -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
                background: var(--mb-ox); border: 2px solid var(--mb-paper);
                box-shadow: 0 2px 5px rgba(94,20,32,.3); cursor: pointer;
            }
            .mb-range::-moz-range-thumb {
                width: 16px; height: 16px; border-radius: 50%;
                background: var(--mb-ox); border: 2px solid var(--mb-paper); cursor: pointer;
            }
            .mb-ticks { display: flex; justify-content: space-between; margin-top: 9px; font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; color: var(--mb-faint); }
            .mb-pills { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
            .mb-pill {
                font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: .06em;
                color: var(--mb-ink-soft); border: 1px solid var(--mb-line-firm);
                padding: 9px 15px; background: rgba(250,244,230,.75); cursor: pointer;
                transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
            }
            .mb-pill.on { background: var(--mb-ink); color: #F6EEDD; border-color: var(--mb-ink); }
            /* Legible but inert: a window this tier does not run, or a stake
               below its floor. Not hidden — the reader should see the ladder. */
            .mb-pill[disabled] { opacity: .42; cursor: not-allowed; }
            .mb-stakein {
                display: inline-flex; align-items: center; border: 1px solid var(--mb-line-firm);
                background: rgba(250,244,230,.75); font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 13px; padding: 8px 12px;
            }
            .mb-stakein .cur { color: var(--mb-muted); margin-right: 3px; }
            .mb-stakein input {
                border: 0; background: transparent; font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 13px; width: 62px; outline: none; color: var(--mb-ink);
            }
            .mb-payout {
                display: flex; align-items: center; gap: 22px; flex-wrap: wrap; margin-top: 4px;
                padding: 15px 20px; border: 1px solid var(--mb-line-firm); background: rgba(250,244,230,.75);
            }
            .mb-payout .mult { font-family: "Cormorant Garamond", Georgia, serif; font-size: 34px; font-weight: 700; color: var(--mb-ox); line-height: 1; }
            .mb-payout .mk { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--mb-muted); margin-top: 4px; }
            .mb-payout .plain { flex: 1 1 260px; font-size: 14px; line-height: 1.45; color: var(--mb-ink-soft); }
            .mb-payout .plain b { color: var(--mb-ink); }
            .mb-payout .out { text-align: right; font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; line-height: 1.7; font-weight: 500; }
            .mb-payout .out .w { color: var(--mb-win); }
            .mb-payout .out .l { color: var(--mb-ox); }
            /* No price yet, or none that can be quoted. The strip says which,
               instead of showing a multiplier nothing produced. */
            .mb-payout.mb-unpriced { color: var(--mb-muted); }
            .mb-payout.mb-unpriced .mult { color: var(--mb-faint); }

            /* ---- the certificate ----
               ONE FRAME. Registration ticks at the corners, not a second border
               inside the first: a nested double border is a print effect this
               page uses nowhere else and it reads as a box in a box. */
            .mb-contract { position: relative; margin-top: 12px; padding: 26px 14px 10px; }
            .mb-contract .reg { position: absolute; width: 13px; height: 13px; border: 1.3px solid var(--mb-faint); opacity: .85; }
            .mb-contract .reg.tl { top: 0; left: 2px; border-right: 0; border-bottom: 0; }
            .mb-contract .reg.tr { top: 0; right: 2px; border-left: 0; border-bottom: 0; }
            .mb-contract .reg.bl { bottom: 2px; left: 2px; border-right: 0; border-top: 0; }
            .mb-contract .reg.br { bottom: 2px; right: 2px; border-left: 0; border-top: 0; }
            .mb-doc-h { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--mb-line-firm); padding-bottom: 11px; }
            .mb-doc-h .a { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; letter-spacing: .24em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-doc-h .f { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; letter-spacing: .2em; text-transform: uppercase; color: var(--mb-ox); }
            .mb-doc-title { font-family: "Cormorant Garamond", Georgia, serif; font-size: 28px; font-weight: 600; margin: 14px 0 3px; line-height: 1.05; }
            .mb-doc-sub { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--mb-ink-soft); margin-bottom: 14px; }
            .mb-dled { border-top: 1px solid var(--mb-line-soft); }
            .mb-drow { display: grid; grid-template-columns: 150px 1fr max-content; align-items: center; gap: 14px; padding: 8px 0; border-bottom: 1px solid var(--mb-line-soft); }
            .mb-drow .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-drow .lead { height: 1px; border-bottom: 1px dotted rgba(70,55,35,.3); }
            .mb-drow .v { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--mb-ink); font-weight: 500; text-align: right; }
            .mb-drow .v.ox { color: var(--mb-ox); }
            .mb-clauses { margin: 16px 0 4px; }
            .mb-citem {
                display: flex; gap: 12px; align-items: flex-start; width: 100%; text-align: left;
                padding: 9px 0; border: 0; border-bottom: 1px solid var(--mb-line-soft);
                background: none; cursor: pointer; font: inherit;
            }
            .mb-cbox {
                width: 16px; height: 16px; border: 1.4px solid var(--mb-line-firm);
                display: flex; align-items: center; justify-content: center;
                color: transparent; font-size: 11px; flex: none; margin-top: 2px;
            }
            .mb-citem.checked .mb-cbox { border-color: var(--mb-win); color: var(--mb-win); }
            .mb-ctxt { font-size: 14px; line-height: 1.45; color: var(--mb-ink-soft); }
            .mb-ctxt b { color: var(--mb-ink); font-weight: 600; }
            .mb-sign { display: flex; align-items: flex-end; justify-content: space-between; gap: 36px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--mb-line-firm); }
            .mb-sig { flex: 1; min-width: 0; }
            .mb-sig .line { border-bottom: 1px solid var(--mb-ink); padding: 4px 6px 5px; min-height: 38px; display: flex; align-items: flex-end; }
            .mb-sig .line .nm { font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-size: 27px; color: var(--mb-ink); }
            .mb-sig .line .ph { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--mb-faint); }
            .mb-sig .lb { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 8.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--mb-muted); margin-top: 7px; }
            .mb-docwax { width: 52px; height: 52px; flex: none; }
            .mb-docwax.empty { border: 1px dashed var(--mb-line-firm); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .mb-docwax.empty span { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 7px; letter-spacing: .1em; color: var(--mb-faint); text-align: center; line-height: 1.3; }
            .mb-docwax svg { display: block; width: 100%; height: 100%; animation: mb-stamp 260ms cubic-bezier(.2,.8,.3,1); }
            @keyframes mb-stamp { from { transform: scale(1.5) rotate(-8deg); opacity: 0; } to { transform: none; opacity: 1; } }

            /* ---- executed ---- */
            .mb-exec { position: relative; overflow: hidden; text-align: center; padding: 22px 20px 10px; }
            .mb-exec-wm {
                position: absolute; left: 50%; top: 56%; transform: translate(-50%,-50%);
                font-family: "Cormorant Garamond", Georgia, serif; font-weight: 700;
                font-size: 250px; line-height: 1; color: rgba(70,55,35,.05); pointer-events: none; z-index: 0;
            }
            .mb-exec > * { position: relative; z-index: 1; }
            .mb-exec .seal { width: 70px; height: 70px; margin: 0 auto 16px; }
            .mb-exec .et { font-family: "Cormorant Garamond", Georgia, serif; font-size: 30px; font-weight: 600; }
            .mb-exec .es { font-size: 15px; line-height: 1.5; color: var(--mb-ink-soft); margin-top: 8px; }
            .mb-exec .eline { display: inline-flex; gap: 22px; flex-wrap: wrap; justify-content: center; margin-top: 20px; padding: 14px 24px; border: 1px solid var(--mb-line); background: rgba(250,244,230,.75); }
            .mb-exec .eline .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 8.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--mb-muted); }
            .mb-exec .eline .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: 18px; font-weight: 600; margin-top: 3px; }
            .mb-exec-next {
                margin-top: 18px; font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .09em; text-transform: uppercase; color: var(--mb-muted);
                display: inline-flex; align-items: center; gap: 10px;
            }

            /* ---- wizard buttons ---- */
            .mb-wbtn {
                display: inline-flex; align-items: center; justify-content: center; gap: 11px;
                background: var(--mb-ox); color: #F6EEDD;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11.5px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
                padding: 14px 26px; border: 0; border-radius: 0; cursor: pointer;
                box-shadow: 0 12px 26px rgba(94,20,32,.2);
                transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
            }
            .mb-wbtn:hover { background: var(--mb-ox-deep); transform: translateY(-1px); }
            .mb-wbtn:active { transform: none; }
            .mb-wbtn[disabled] { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; background: var(--mb-ox); }
            /* The label is replaced while the write is in flight, so the width is
               pinned first — a button that shrinks mid-request moves the footer
               under the reader's cursor. */
            .mb-wbtn.mb-busy { pointer-events: none; opacity: .8; }
            .mb-gbtn {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
                color: var(--mb-ink-soft); background: none; border: 0; cursor: pointer;
                display: inline-flex; align-items: center; gap: 9px; padding: 6px 0;
            }
            .mb-gbtn:hover { color: var(--mb-ink); }
            .mb-footnote {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--mb-muted);
                display: flex; align-items: center; gap: 9px;
            }
            /* A failed write is reported where the action was taken, and the
               button stays available to try again. */
            .mb-werr {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 10px; letter-spacing: .06em; color: var(--mb-ox);
                display: flex; align-items: center; gap: 9px;
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
            .mb-sort {
                background: none; border: 0; cursor: pointer; padding: 4px 0;
                font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit;
                display: inline-flex; align-items: center; gap: 6px;
            }
            .mb-sort:hover { color: var(--mb-ink); }

            /* ---- listing cards ---- */
            .mb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
            /* The board's shape while it loads, so the section does not collapse
               to one line of text and then jump to four rows of cards. It is
               plainly empty — no shimmer pretending to be data. */
            .mb-skel { border: 1px solid var(--mb-line); background: rgba(250,244,230,.45); padding: 18px 20px; min-height: 300px; }
            .mb-skel span { display: block; background: rgba(70,55,35,.07); }
            .mb-skel .a { height: 14px; width: 45%; margin-bottom: 18px; }
            .mb-skel .b { height: 28px; width: 82%; margin-bottom: 10px; }
            .mb-skel .c { height: 12px; width: 60%; margin-bottom: 26px; }
            .mb-skel .d { height: 5px; width: 100%; margin-bottom: 26px; }
            .mb-skel .e { height: 20px; width: 40%; margin-bottom: 30px; }
            .mb-skel .f { height: 38px; width: 100%; }
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
            /* The ledger's own empty and unavailable states. An empty ledger on
               a settlement product is a real answer, so it gets the same weight
               as a row rather than being hidden. */
            .mb-ledger-note {
                padding: 34px 8px; color: var(--mb-muted);
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
                border-bottom: 1px solid var(--mb-line-soft);
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

            /* ---- the divider between the two ways in ---- */
            .mb-sep { display: flex; align-items: center; gap: 22px; margin: 60px auto 40px; max-width: 920px; }
            .mb-sep .ln { flex: 1; height: 1px; background: var(--mb-line-firm); }
            .mb-sep span { font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-size: 24px; color: var(--mb-ink-soft); }

            /* ---- states, motion, focus ---- */
            .mb-c-act, .mb-chip, .mb-seg button, .mb-issue .a {
                transition: background 160ms ease, color 160ms ease, transform 120ms ease, box-shadow 120ms ease;
            }
            .mb-c-act.accept:hover { background: var(--mb-ox-deep); transform: translateY(-1px); }
            .mb-c-act.accept:active { transform: none; box-shadow: none; }
            .mb-c-act.view:hover, .mb-chip:hover, .mb-seg button:hover { background: rgba(70,55,35,.06); }
            .mb a:focus-visible, .mb button:focus-visible, .mb input:focus-visible { outline: 2px solid var(--mb-ox); outline-offset: 2px; }
            @media (prefers-reduced-motion: reduce) {
                .mb-c-act, .mb-chip, .mb-seg button, .mb-issue .a,
                .mb-wbtn, .mb-pill, .mb-stp .disc, .mb-mx-avail .ss-go { transition: none; }
                .mb-c-act.accept:hover, .mb-wbtn:hover { transform: none; }
                /* The seal stamps in on signing. Under reduced motion it is
                   simply there — the fact is the seal, not the impact. */
                .mb-docwax svg { animation: none; }
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
                .mb-solo { padding-top: 44px; }
                .mb-board { padding-top: 46px; }
                /* The wizard stays a single centred column at every width — it
                   is already one, so tablet only loses padding, never structure. */
                .mb-wiz-top, .mb-wiz-body, .mb-wiz-foot { padding-left: 20px; padding-right: 20px; }
                .mb-sep { margin: 46px auto 32px; }
            }
            @media (max-width: 760px) {
                /* The stepper keeps its discs and drops its words: three labelled
                   nodes plus two rules do not fit beside the wordmark, and the
                   disc is the part that carries position. The <ol> still reads in
                   full to a screen reader. */
                .mb-stp .lb { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
                .mb-stp .bar { width: 20px; margin: 0 8px; }
                .mb-wiz-foot { flex-wrap: wrap; gap: 12px; }
                .mb-wiz-foot .mb-wbtn { flex: 1 1 100%; }
                .mb-sign { flex-direction: column; align-items: stretch; gap: 20px; }
                .mb-docwax { align-self: flex-end; }
            }
            @media (max-width: 640px) {
                .mb-grid { grid-template-columns: 1fr; }
                .mb-controls { gap: 14px; }
                /* Filters scroll sideways rather than stacking into a tall block
                   that pushes the board off the first screen. */
                .mb-chips, .mb-seg { overflow-x: auto; flex-wrap: nowrap; max-width: 100%; }
                /* A floor for the scroll containers above, so the columns keep
                   a readable width inside the scroll instead of crushing. */
                /* 760, not 560: the availability column now carries a bordered
                   button with a brand mark rather than a bare text link, and it
                   wraps to two lines under about 720. */
                .mb-mx-h, .mb-mx-r { min-width: 760px; }
                .mb-lrowh, .mb-lrow { min-width: 560px; }
                .mb-lrowh, .mb-lrow { grid-template-columns: 96px 1fr 110px 100px 100px 84px; }
                .mb-drow { grid-template-columns: 108px 1fr max-content; gap: 10px; }
                .mb-exec-wm { font-size: 170px; }
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
                            <!-- "Browse Rivalries", not "Rivalry Contracts": a
                                 verb to pair with Create Contract. The old label
                                 named a category and left the action to guess. -->
                            <button type="button" class="mkh-link" onclick="window.router.navigate('/market?type=rivalry')"><span class="t">Browse Rivalries</span> <span class="a" aria-hidden="true">&rarr;</span></button>
                        </div>
                    </div>
                </div>

                <!-- DASHES ON FIRST PAINT, then the real figures from
                     /v1/market/homepage-stats via loadMarketStats(). These were
                     interpolated constants reading 528 Open and $634K in Escrow;
                     the endpoint reports 2 and $2,000. The average-settlement
                     item is gone rather than filled with a plausible "30d" — it
                     is a property of each contract and this endpoint does not
                     report a market average. -->
                <div class="mkh-strip">
                    <div class="mkh-strip-in">
                        <span class="mkh-live"><i aria-hidden="true"></i>Live Exchange</span>
                        <span class="mkh-metrics">
                            <span id="mkh-open">&mdash; Live</span>
                            <i class="d" aria-hidden="true"></i>
                            <span id="mkh-escrow">&mdash; in Escrow</span>
                            <span class="mkh-note">Loading</span>
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
                 ONE CARD THAT ADVANCES IN PLACE.

                 #ss-root and the .ss-metric / .ss-go / .ss-m-state hooks are
                 kept EXACTLY as they were. The look is new; the wiring behind
                 step 1 is the existing loadSourceState(), which reads real
                 Plaid, Stripe, Shopify and YouTube connection status off the
                 API — the only genuinely live thing this section had, and it
                 would have been thrown away by rebuilding the markup fresh.

                 Every step past the first is EMPTY IN THE MARKUP. The terms and
                 the certificate are written by the wizard from the terms
                 preview the server returns for this operator, so there is no
                 pass where a stake, a multiplier or a payout exists in the HTML
                 before anything priced it. -->
            <section class="mb mb-solo" id="ss-root" data-bank="none">
                <div class="mb-w-col">
                    <div class="mb-w-head">
                        <div class="k">Create &middot; Solo Contract</div>
                        <h2>Stake on <span class="ox">your own goal.</span></h2>
                        <p class="mb-lede">Three steps &mdash; connect your source, set your terms, sign. Priced from your own record.</p>
                    </div>

                    <div class="mb-wiz" id="mb-wiz">
                        <div class="mb-wiz-top">
                            <div class="mb-wiz-brand">
                                <!-- The site's own oxblood seal, at 34px. -->
                                <img src="/assets/images/wax-seal-verification.png" alt="" aria-hidden="true" width="34" height="30">
                                <div>
                                    <div class="nm">Collateral</div>
                                    <div class="sb">Solo Contract</div>
                                </div>
                            </div>
                            <ol class="mb-stp" id="mb-stp" aria-label="Contract steps">
                                <li class="n" data-node="0"><span class="disc on" aria-hidden="true">1</span><span class="lb act">Connect</span></li>
                                <li class="bar" aria-hidden="true"></li>
                                <li class="n" data-node="1"><span class="disc" aria-hidden="true">2</span><span class="lb">Terms</span></li>
                                <li class="bar" aria-hidden="true"></li>
                                <li class="n" data-node="2"><span class="disc" aria-hidden="true">3</span><span class="lb">Sign</span></li>
                            </ol>
                        </div>

                        <div class="mb-wiz-body">
                            <!-- ── STEP 1 · connect & choose ── -->
                            <div class="mb-wstep on" data-step="1">
                                <div class="mb-act-head">Step 1 of 3 &middot; Connect &amp; choose</div>
                                <h3 class="mb-act-title">Connect your source, pick a metric</h3>
                                <p class="mb-act-sub">Money settles through your bank. Connect Stripe, Shopify or YouTube to unlock the counts a statement can&rsquo;t see.</p>

                                <div class="mb-mx-legend">
                                    <span class="mb-lg"><span class="mb-dot"></span> Verified &amp; ready</span>
                                    <span class="mb-lg"><span class="mb-dot-o"></span> Connect to unlock</span>
                                    <span class="mb-lg"><span class="mb-dot-e"></span> Not applicable</span>
                                </div>

                                <div class="mb-matrix">
                                    <div class="mb-mx-h">
                                        <span class="l">Metric</span>
                                        <span class="mb-bankcol">Bank<span class="conn" id="mb-bank-conn">&#10003; Connected</span></span>
                                        <span>Stripe</span>
                                        <span>Shopify</span>
                                        <span>YouTube</span>
                                        <span class="rt">Choose</span>
                                    </div>

                                    <!-- The static descriptor and the live state line are two
                                         different .mb-md rows. .ss-m-state is the one the JS
                                         writes ("4 of 6 months — unlocks in March") and it is
                                         :empty-collapsed until it has something to say, so the
                                         usual row shows one line, not a blank second one. -->
                                    <div class="mb-mx-r ss-metric locked" data-metric="money">
                                        <div class="mb-mx-metric"><div class="mb-mn">Money received</div><div class="mb-md">Income &middot; in dollars</div><div class="mb-md ss-m-state"></div></div>
                                        <div class="mb-mx-cell mb-bankcol"><span class="mb-dot-o" data-src="bank"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                        <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="money">Connect bank &rarr;</button></div>
                                    </div>

                                    <div class="mb-mx-r ss-metric locked ss-gated" data-metric="mrr">
                                        <div class="mb-mx-metric"><div class="mb-mn">MRR</div><div class="mb-md">Recurring revenue</div><div class="mb-md ss-m-state"></div></div>
                                        <div class="mb-mx-cell mb-bankcol"><span class="mb-dot-e" data-src="bank"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-o" data-src="stripe"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                        <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="mrr">Connect Stripe &rarr;</button></div>
                                    </div>

                                    <div class="mb-mx-r ss-metric locked ss-gated" data-metric="orders">
                                        <div class="mb-mx-metric"><div class="mb-mn">Orders</div><div class="mb-md">Order count</div><div class="mb-md ss-m-state"></div></div>
                                        <div class="mb-mx-cell mb-bankcol"><span class="mb-dot-e" data-src="bank"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-o" data-src="shopify"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="youtube"></span></div>
                                        <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="orders">Connect Shopify &rarr;</button></div>
                                    </div>

                                    <div class="mb-mx-r ss-metric locked ss-gated" data-metric="views">
                                        <div class="mb-mx-metric"><div class="mb-mn">Views</div><div class="mb-md">View count</div><div class="mb-md ss-m-state"></div></div>
                                        <div class="mb-mx-cell mb-bankcol"><span class="mb-dot-e" data-src="bank"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="stripe"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-e" data-src="shopify"></span></div>
                                        <div class="mb-mx-cell"><span class="mb-dot-o" data-src="youtube"></span></div>
                                        <div class="mb-mx-avail"><button type="button" class="ss-go" data-source="views">Connect YouTube &rarr;</button></div>
                                    </div>
                                </div>

                                <div class="mb-mx-note"><span class="mb-mark"></span> Your bank settles every contract. Stripe, Shopify and YouTube only unlock metrics a statement can&rsquo;t see.</div>
                            </div>

                            <!-- ── STEP 2 · terms ── written by the wizard -->
                            <div class="mb-wstep" data-step="2" id="mb-wstep-2"></div>

                            <!-- ── STEP 3 · review & sign ── written by the wizard -->
                            <div class="mb-wstep" data-step="3" id="mb-wstep-3"></div>

                            <!-- ── EXECUTED ── written from the created contract -->
                            <div class="mb-wstep" data-step="done" id="mb-wstep-done"></div>
                        </div>

                        <div class="mb-wiz-foot" id="mb-wiz-foot"></div>
                    </div>
                </div>
            </section>

            <div class="mb mb-sep">
                <span class="ln"></span>
                <span>Or &mdash; take on an open rival</span>
                <span class="ln"></span>
            </div>

            <!-- ── BOARD ── -->
            <section class="mb mb-board">
                <div class="mb-lhead">
                    <!-- "Rivalry Market", not "Open Rivalries": the board carries
                         live rivalries as well as open ones, so the heading was
                         contradicting the Open/Live segments directly under it. -->
                    <span class="lab"><span class="mb-mark"></span> Rivalry Market</span>
                    <span class="ln"></span>
                    <button type="button" class="act" id="btn-rules">Execution rules &rarr;</button>
                </div>

                <div class="mb-controls">
                    <div class="mb-seg" id="mb-seg">
                        <button type="button" class="on" data-state="all">All Rivalries</button>
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
                        <!-- A REAL CONTROL. This was static text with a ▾ on it,
                             which reads as a menu and did nothing when pressed;
                             it cycles the three orders the board can actually
                             put the cards in. -->
                        <button type="button" class="mb-sort" id="mb-sort">Sort: <b id="mb-sort-lbl">Trending</b> <span aria-hidden="true">&#9662;</span></button>
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
    // The three orders the board can actually put cards in. Only orders that
    // can be derived from fields every card carries are offered.
    const SORTS = [
        { key: 'trending', label: 'Trending' },
        { key: 'ending', label: 'Ending soonest' },
        { key: 'stake', label: 'Largest stake' },
    ];
    let activeSort = 'trending';

    /* THE ODOMETERS ARE GONE WITH THE SECOND MASTHEAD THEY LIVED IN. They
       animated #stat-capital / #stat-contracts / #stat-pool inside the old
       "Collateral Market." header, which duplicated the hero — so the page
       printed the same three figures twice. The hero's status strip is now the
       only place those numbers appear, and it still reads MARKET_STATS. */

    /* ═══════════════════════════════════════════════════════════════════
       REAL DATA, OR NOTHING.

       This route used to render a hardcoded board: eight rivalries, six
       settlements, 528 open contracts, $633.6k in escrow. The live API reports
       ONE rivalry, ZERO settlements, two open contracts and $2,000. A page
       whose headline promises settlement "against live business data" was
       inventing the data — the one failure that discredits everything else on
       it, because it is exactly the claim being sold.

       Nothing below falls back to a flattering number. Every surface has three
       honest states — loading, empty, unavailable — and an empty market says so.
       ═══════════════════════════════════════════════════════════════════ */

    let rivalries = [];
    let boardState = 'loading';   // loading | ready | error

    const PLATFORM_DOMAIN = {
        STRIPE: 'finance', SHOPIFY: 'commerce', AMAZON: 'commerce',
        YOUTUBE: 'social', X: 'social', TWITTER: 'social', PLAID: 'finance',
    };
    const RAIL_LABEL = { USD: 'USD · CUSTODIAL', CLTR: 'CLTR · ON-CHAIN' };

    const titleCase = (s) => String(s || '')
        .toLowerCase().replace(/_/g, ' ')
        .replace(/\b[a-z]/g, (c) => c.toUpperCase());

    /**
     * Whole days until an ISO deadline. NOT clamped at zero — a rivalry whose
     * deadline has passed but which is still ACTIVE is awaiting settlement, and
     * the live board has one in exactly that state right now. Clamping printed
     * "0D LEFT" on it: technically true, and it tells the reader the wrong
     * thing. The renderer uses the negative to say what is actually happening.
     */
    function daysLeft(iso) {
        if (!iso) return null;
        const ms = new Date(iso).getTime() - Date.now();
        if (!isFinite(ms)) return null;
        return Math.ceil(ms / 86400000);
    }

    /**
     * The API's lifecycle states collapse to the two the board filters on.
     * Anything already settled is not a market listing and is dropped — it
     * belongs in the ledger below.
     */
    function boardStateOf(state) {
        const s = String(state || '').toUpperCase();
        if (s === 'ACTIVE' || s === 'LIVE' || s === 'IN_PROGRESS') return 'live';
        if (s === 'SETTLED' || s === 'CANCELLED' || s === 'EXPIRED' || s === 'DECLINED') return null;
        return 'open';   // issued, awaiting acceptance, awaiting funding
    }

    /**
     * Growth against each side's own baseline, which is what the contract is
     * actually settled on. baselineValue rides along on the list payload;
     * current values need one metrics call per rivalry, so they are fetched in
     * parallel and only for what is on the board.
     *
     * WHERE THERE IS NO MEASUREMENT YET, THE CARD SAYS SO. A rivalry that has
     * been funded but not yet sampled has no progress to show, and printing
     * "+0.0%" would state a measurement that was never taken.
     */
    async function attachProgress(list) {
        await Promise.all(list.map(async (r) => {
            try {
                const res = await window.api.getRivalryMetrics(r.id);
                const metrics = (res && res.metrics) || [];
                const latest = {};
                metrics.forEach((m) => {
                    const prev = latest[m.userId];
                    if (!prev || new Date(m.fetchedAt) > new Date(prev.fetchedAt)) latest[m.userId] = m;
                });
                (r.participants || []).forEach((p) => {
                    const base = Number(p.baselineValue);
                    const now = latest[p.userId] && Number(latest[p.userId].metricValue);
                    if (!isFinite(base) || base <= 0 || !isFinite(now)) return;
                    const pct = ((now - base) / base) * 100;
                    r._growth = r._growth || {};
                    r._growth[p.role] = pct;
                });
            } catch (e) {
                /* leave progress unknown; the card renders a dash */
            }
        }));
        return list;
    }

    function fmtPct(v) {
        if (v == null || !isFinite(v)) return null;
        return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
    }

    /** API rivalry -> the shape the card renderer consumes. */
    function toCard(r) {
        const state = boardStateOf(r.state);
        if (!state) return null;
        const stake = Math.round((Number(r.stakePerSideCents) || 0) / 100);
        const g = r._growth || {};
        const rail = RAIL_LABEL[String(r.settlementRail || 'USD').toUpperCase()] || RAIL_LABEL.USD;
        return {
            kind: 'rivalry',
            id: r.id,
            title: titleCase(r.metricType) + (r.durationDays ? ' (' + r.durationDays + 'd)' : ''),
            domain: PLATFORM_DOMAIN[String(r.platform || '').toUpperCase()] || 'finance',
            platform: String(r.platform || '').toUpperCase(),
            rail: rail,
            state: state,
            // The record hash is the contract's own identifier; a made-up
            // sequential receipt number would be decoration.
            receipt: 'RCPT·' + String(r.recordHash || r.id || '').slice(0, 6).toUpperCase(),
            days_left: daysLeft(r.deadlineUtc),
            stake_per_side: stake,
            total_pool: stake * 2,
            op1: { handle: r.challengerUsername ? '@' + r.challengerUsername : 'Challenger',
                   delta: fmtPct(g.challenger) },
            op2: { handle: r.opponentUsername ? '@' + r.opponentUsername : null,
                   delta: fmtPct(g.opponent) },
        };
    }

    /**
     * RIVALRIES ONLY. /v1/market/listings is deliberately NOT read here.
     *
     * It returns 48 published solo contracts — target, multiplier, stake band,
     * capacity — and pulling them filled the board with an instrument the
     * product no longer sells. This is a rivalry market: two named operators,
     * matched capital, one oracle. A solo listing has no opponent and no
     * contest, so it does not belong on this board at any count.
     *
     * TWO SOURCES, BECAUSE THE PUBLIC FEED IS NOT THE WHOLE PICTURE.
     * /v1/rivalries is public and returns what the market can see;
     * /v1/rivalries/me returns the signed-in user's own, which can include ones
     * the public feed does not carry — issued but not yet accepted, or awaiting
     * funding. Someone looking at their own market should see their own
     * contracts. Merged and de-duplicated by id, so a rivalry appearing in both
     * renders once.
     */
    async function loadBoard() {
        const calls = [window.api.getRivalries({ limit: 50 })];
        // Only ask for "mine" when there is a session; unauthenticated it is a
        // guaranteed 401 and a console error for nothing.
        const signedIn = !!(window.api.hasAuthToken && window.api.hasAuthToken());
        if (signedIn) calls.push(window.api.getMyRivalries({ limit: 50 }));

        const settled = await Promise.allSettled(calls);
        let anyOk = false;
        const byId = new Map();

        settled.forEach((res, i) => {
            if (res.status !== 'fulfilled') {
                console.error('[Market] rivalry feed ' + (i === 0 ? 'public' : 'mine') + ' unavailable:', res.reason);
                return;
            }
            anyOk = true;
            ((res.value && res.value.rivalries) || []).forEach((r) => {
                if (r && r.id && !byId.has(r.id)) byId.set(r.id, r);
            });
        });

        if (!anyOk) {
            rivalries = [];
            boardState = 'error';
            renderRivalries();
            return;
        }

        const raw = Array.from(byId.values());
        await attachProgress(raw);
        rivalries = raw.map(toCard).filter(Boolean);
        boardState = 'ready';
        renderRivalries();
    }

    /* ---- settlements ----
       /v1/results is the same feed the Results view reads. It is currently
       returning 500 and the market reports zero settlements anyway, so the two
       states that matter here are "none yet" and "couldn't load" — and they are
       different sentences, because one is a fact about the market and the other
       is a fact about the request. */
    async function renderLedger() {
        const host = document.getElementById('mb-ledger-rows');
        if (!host) return;
        const note = (text) => {
            host.innerHTML = '';
            const n = document.createElement('div');
            n.className = 'mb-ledger-note';
            n.textContent = text;
            host.appendChild(n);
        };

        let results;
        try {
            const res = await window.api.getPublicResults();
            results = (res && res.results) || [];
        } catch (e) {
            console.error('[Market] results unavailable:', e);
            note('Settlement history is temporarily unavailable');
            return;
        }

        if (!results.length) {
            note('No contracts have settled yet');
            return;
        }

        host.innerHTML = '';
        results.slice(0, 8).forEach((s) => {
            const won = s.result === 'WIN';
            const lost = s.result === 'LOSS' || s.result === 'BOTH_MISS';
            const cls = won ? 'w' : (lost ? 'l' : '');
            const amount = Math.round((Number(s.stakeCents) || 0) / 100);
            const when = s.settledAt
                ? new Date(s.settledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—';
            const row = document.createElement('div');
            row.className = 'mb-lrow';
            const cell = (c, t) => {
                const n = document.createElement('span');
                n.className = c;
                n.textContent = t;
                return n;
            };
            row.appendChild(cell('rc', 'RCPT·' + String(s.id || '').slice(0, 6).toUpperCase()));
            row.appendChild(cell('ct', s.principal || 'Contract'));
            row.appendChild(cell('rs ' + cls, won ? 'Target met' : (lost ? 'Missed' : titleCase(s.result))));
            row.appendChild(cell('am ' + cls, (won ? '+' : (lost ? '−' : '')) + '$' + amount.toLocaleString()));
            row.appendChild(cell('sr', titleCase(s.platform)));
            row.appendChild(cell('tm', when));
            host.appendChild(row);
        });
    }

    /* THE BOARD IS BUILT WITHOUT A TEMPLATE LITERAL, ON PURPOSE. Handles and
       contract titles are data — they now come from /v1/rivalries, so
       interpolating them into an HTML string would be an injection. Structure
       is set as markup, every value is set with textContent, and the two never
       mix. */
    function renderRivalries() {
        const rGrid = document.getElementById('rivalry-grid');
        if (!rGrid) return;
        rGrid.innerHTML = '';

        const count = document.getElementById('mb-count');

        /* Three states before there is anything to draw, and they are three
           different sentences. "Nothing matches your filters" is a fact about
           the filters; "no open rivalries" is a fact about the market; "couldn't
           load" is a fact about the request. Collapsing them into one empty box
           tells the reader nothing about which is true. */
        const notice = (text) => {
            const n = document.createElement('div');
            n.className = 'mb-empty';
            n.textContent = text;
            rGrid.appendChild(n);
        };

        if (boardState === 'loading') {
            if (count) count.textContent = '—';
            /* The board's own shape while it loads. Four placeholders, because
               four is the grid — NOT because four rivalries are expected; the
               count beside them stays an em dash until the real length is
               known, so nothing here implies a number. */
            for (let i = 0; i < 4; i++) {
                const sk = document.createElement('div');
                sk.className = 'mb-skel';
                sk.setAttribute('aria-hidden', 'true');
                ['a', 'b', 'c', 'd', 'e', 'f'].forEach((c) => {
                    const s = document.createElement('span');
                    s.className = c;
                    sk.appendChild(s);
                });
                rGrid.appendChild(sk);
            }
            const live = document.createElement('div');
            live.className = 'mb-empty';
            live.setAttribute('role', 'status');
            live.setAttribute('style', 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)');
            live.textContent = 'Loading the board';
            rGrid.appendChild(live);
            return;
        }
        if (boardState === 'error') {
            if (count) count.textContent = '—';
            notice('The market is temporarily unavailable');
            return;
        }

        let list = rivalries.slice();
        if (activeCategory !== 'all') {
            list = list.filter(r => r.domain.toLowerCase() === activeCategory.toLowerCase());
        }
        if (activeState !== 'all') {
            list = list.filter(r => r.state === activeState);
        }

        /* Sorting runs on the WHOLE filtered list, not on a page of it, so the
           first card is the first card of the market and not of a slice.

           Trending is "open challenges first": they are the only ones a reader
           can act on. A live rivalry is somebody else's contest to watch; an
           open one is a seat at a table. Deadlines that have passed sort last
           under "ending soonest" rather than first — they are awaiting
           settlement, not urgent. */
        if (activeSort === 'ending') {
            list.sort((a, b) => {
                const av = a.days_left == null || a.days_left <= 0 ? Infinity : a.days_left;
                const bv = b.days_left == null || b.days_left <= 0 ? Infinity : b.days_left;
                return av - bv;
            });
        } else if (activeSort === 'stake') {
            list.sort((a, b) => (b.stake_per_side || 0) - (a.stake_per_side || 0));
        } else {
            list.sort((a, b) => (a.state === 'open' ? -1 : b.state === 'open' ? 1 : 0));
        }

        if (count) count.textContent = String(list.length);

        if (list.length === 0) {
            notice(rivalries.length === 0
                ? 'No rivalries have been issued yet — be the first'
                : 'No rivalries match these filters');
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
            /* MEASURED OR NOT — the distinction the old mock could not have.
               A funded rivalry that has not been sampled yet has no progress,
               and 0 is a measurement. null means "not measured", and every
               place that reads these treats the two differently. */
            const d1 = r.op1.delta == null ? null : parseFloat(r.op1.delta);
            const d2 = r.op2.delta == null ? null : parseFloat(r.op2.delta);
            const measured = d1 != null && d2 != null;

            const card = el('article', 'mb-card');
            const inner = el('div', 'mb-c-in');

            // ---- badge + receipt
            const top = el('div', 'mb-c-top');
            const badge = el('span', 'mb-badge ' + (isOpen ? 'open' : 'live'));
            if (!isOpen) badge.appendChild(el('span', 'd'));
            badge.appendChild(document.createTextNode(isOpen ? 'Open Rivalry' : 'Live Rivalry'));
            top.appendChild(badge);
            top.appendChild(el('span', 'mb-c-rcpt', r.receipt));
            inner.appendChild(top);

            // ---- deadline, title, domain
            const deadline = r.days_left == null
                ? 'NO DEADLINE SET'
                : (r.days_left <= 0 ? 'AWAITING SETTLEMENT' : r.days_left + 'D LEFT');
            inner.appendChild(el('span', 'mb-c-days', deadline));
            inner.appendChild(el('h3', 'mb-c-title', r.title));
            const dom = el('div', 'mb-c-dom');
            dom.appendChild(el('span', 'pd'));
            dom.appendChild(document.createTextNode(r.domain + ' · ' + r.platform));
            inner.appendChild(dom);

            // ---- the two sides
            const ops = el('div', 'mb-ops');
            const left = el('div', 'mb-op');
            left.appendChild(el('span', 'nm', r.op1.handle));
            left.appendChild(el('span', 'pc ' + (d1 == null ? 'mut' : 'up'),
                d1 == null ? '—' : r.op1.delta));
            ops.appendChild(left);
            ops.appendChild(el('span', 'mb-vs', 'VS'));
            const right = el('div', 'mb-op r');
            right.appendChild(el('span', 'nm', isOpen ? 'Open slot' : (r.op2.handle || 'Opponent')));
            right.appendChild(el('span', 'pc ' + (isOpen || d2 == null ? 'mut' : 'up'),
                isOpen || d2 == null ? '—' : r.op2.delta));
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
            if (isOpen || !measured) {
                /* Nothing to divide: either there is one side, or neither side
                   has been sampled. A hatched bar shows an undetermined contest
                   instead of drawing a 50/50 split that looks like a dead heat
                   somebody actually measured. */
                bar.appendChild(seg('e', 100));
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

    /* Cycles the order and re-renders from the same full list the filters read,
       so sorting never changes WHICH rivalries are on the board — only where
       they sit on it, and the results count is untouched. */
    const sortBtn = document.getElementById('mb-sort');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            const i = SORTS.findIndex(s => s.key === activeSort);
            const next = SORTS[(i + 1) % SORTS.length];
            activeSort = next.key;
            const lbl = document.getElementById('mb-sort-lbl');
            if (lbl) lbl.textContent = next.label;
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
            // The chip is also gated in CSS off #ss-root[data-bank]; setting the
            // attribute here keeps it correct if the stylesheet ever moves.
            const conn = document.getElementById('mb-bank-conn');
            if (conn) conn.hidden = !bank;
        }

        /* THE ROW CLICK USED TO NAVIGATE TO /solo/new. That route does not
           exist in the router and never has, so every metric in this table led
           to a blank page. The wizard below owns the click now: a ready metric
           is selected in place, an unconnected one starts its real connect
           flow, and nobody leaves /market to write a contract. */

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
                    // .waiting strips the button chrome so it does not offer one.
                    if (tile) tile.classList.add('waiting');
                    if (go) go.textContent = label ? 'Unlocks ' + label : 'Not enough history yet';
                });
                return;
            }

            /* EACH ROW NAMES ITS OWN SOURCE. Previously every row was passed
               bankConnected && platformConnected, and applyCardState then
               resolved any un-met state to "Connect bank →" — so with Stripe and
               YouTube genuinely connected, their rows showed filled green dots
               beside an instruction to connect a bank. The table contradicted
               itself in the same row.

               The bank IS still required — it sets the baseline and it is the
               settlement rail — but that is a different fact from "this metric's
               source is missing", and collapsing the two produced the nonsense.
               Availability now answers only "is this metric's own source
               attached", and the bank prerequisite is reported as itself. */
            applyCardState('money',  bankConnected, 'bank', bankConnected);
            applyCardState('mrr',    !!(stripe && stripe.connected),  'Stripe',  bankConnected);
            applyCardState('orders', !!(shopify && shopify.connected), 'Shopify', bankConnected);
            applyCardState('views',  !!(youtube && youtube.connected), 'YouTube', bankConnected);
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

        /**
         * @param sourceConnected  is THIS metric's own source attached
         * @param platform         the source this metric reads from
         * @param bankConnected    the shared prerequisite, reported separately
         *
         * Three states, and each one says the true thing about this row:
         *   source missing            -> "Connect {Platform} →"   (actionable)
         *   source attached, no bank  -> "Bank required"          (not "Ready")
         *   both                      -> "Ready ✓"
         *
         * The middle state is the one that matters. Saying "Ready" for MRR when
         * Stripe is attached but no bank exists would send someone to a builder
         * that cannot price anything — the bait-and-switch the old code was
         * guarding against, which it did by mislabelling the row instead.
         */
        function applyCardState(metric, sourceConnected, platform, bankConnected) {
            const tile = ssRoot.querySelector('.ss-metric[data-metric="' + metric + '"]');
            if (!tile) return;
            const go = tile.querySelector('.ss-go');
            const req = tile.querySelector('.ss-m-req');
            const ready = sourceConnected && bankConnected;

            tile.classList.toggle('ready', ready);
            tile.classList.toggle('locked', !ready);
            tile.classList.toggle('needs-bank', !!sourceConnected && !bankConnected);
            tile.classList.remove('waiting');

            // The dots are painted by paintSources() from the same fetch, so
            // they are not re-derived here — one mechanism, not two.

            if (ready) {
                // A chosen row says so. This runs again on every state refresh,
                // and overwriting "Selected ✓" with "Ready ✓" would silently
                // un-say the choice while leaving the wine spine drawn.
                if (go) go.textContent = tile.classList.contains('sel') ? 'Selected ✓' : 'Ready ✓';
                if (req) req.remove();
                return;
            }
            // Not ready any more: whatever was chosen here is no longer choosable.
            tile.classList.remove('sel');
            if (!go) return;
            if (!sourceConnected) {
                go.textContent = platform === 'bank'
                    ? 'Connect bank →'
                    : 'Connect ' + platform + ' →';
            } else {
                // Its own source is attached; the only thing left is the bank,
                // and that is step 01 rather than an action on this row.
                go.textContent = 'Bank required';
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

        /* ═══════════════════════════════════════════════════════════════
           THE SOLO CONTRACT WIZARD

           One card, three steps, one state object. Steps 2, 3 and the
           executed state are BUILT HERE rather than sitting in the markup,
           because none of them can be honestly drawn before something has
           been priced — and everything they show is priced by the server.

           WHAT IS ACTUALLY ADJUSTABLE, AND WHY IT IS NOT A FREE SLIDER.
           POST /v1/contracts system-calculates the payout and ignores any
           figure the client sends. The levers it honours are the risk tier
           (which fixes the target and the window) and the stake. A
           continuous 5–50% target with a multiplier of target/5 — the
           reference's placeholder — would have let someone set +12% over
           60 days at 2.4x and then be written a different contract at a
           different price. The slider is therefore the tier ladder: three
           stops, each carrying the real target, window and multiplier that
           GET /v1/contracts/terms-preview reports for THIS operator.

           For bank income that preview is derived from their own trailing
           months (their hit rate sets their multiplier, so no two people
           see the same line). For the platform metrics it is the fixed
           tier table. Either way the number on screen is the number the
           write path will apply.
           ═══════════════════════════════════════════════════════════════ */

        /** metric key -> what it is, and which API it settles against. */
        const WIZ_METRICS = {
            money: {
                label: 'Money received', short: 'Money Received',
                platform: 'PLAID', metricType: 'NET_INCOME_DEPOSITS',
                oracle: 'Bank · Plaid (read-only)', kind: 'money',
                verified: 'Bank verified', connectVia: 'bank',
            },
            /* REVENUE, not MRR. /v1/oracle/preview and the write path's Stripe
               branch both measure net settled revenue over the window — there
               is no MRR series behind this platform today. Writing the contract
               as MRR would name a quantity nothing on the settlement side
               computes, and it would settle on revenue anyway. */
            mrr: {
                label: 'MRR', short: 'Recurring revenue',
                platform: 'STRIPE', metricType: 'REVENUE', oracleMetric: 'revenue',
                oracle: 'Stripe · read-only', kind: 'money',
                verified: 'Stripe verified', connectVia: 'stripe',
            },
            /* NO ORACLE METRIC, AND THAT IS THE POINT. The Shopify adapter
               snapshots netCents — revenue — whatever metric is asked for; there
               is no order-count baseline anywhere in the system. Without one, a
               target order count would be a number this page made up, so the row
               connects and then says plainly that it cannot be priced yet. */
            orders: {
                label: 'Orders', short: 'Orders',
                platform: 'SHOPIFY', metricType: 'ORDER_COUNT', oracleMetric: null,
                noBaseline: 'Shopify reports revenue, not order count — this metric cannot be priced yet',
                oracle: 'Shopify · read-only', kind: 'count',
                verified: 'Shopify verified', connectVia: 'shopify',
            },
            views: {
                label: 'Views', short: 'Views',
                platform: 'YOUTUBE', metricType: 'VIEWS', oracleMetric: 'youtube_views',
                oracle: 'YouTube · read-only', kind: 'count',
                verified: 'YouTube verified', connectVia: 'youtube',
            },
        };

        const CLAUSES = [
            ['I authorize ', 'read-only', ' verification through my connected source.'],
            ['My capital is ', 'locked in escrow', ' until settlement — no early withdrawal.'],
            ['The outcome is ', 'read from my data and final', ' — no appeals.'],
        ];

        const wiz = {
            step: 1,
            metric: null,
            terms: null,        // the server's terms preview for this platform
            termsError: null,
            tierIdx: 0,
            stake: null,        // dollars
            baseline: null,     // absolute baseline for non-PLAID platforms
            clauses: [false, false, false],
            busy: false,
            signError: null,
            contract: null,     // what the server actually created
        };

        const wizBody = document.getElementById('mb-wiz');
        const wizFoot = document.getElementById('mb-wiz-foot');
        const wizStepEls = ssRoot.querySelectorAll('.mb-wstep');

        function wEl(tag, cls, text) {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text != null) n.textContent = text;
            return n;
        }
        const money0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
        const money2 = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const countFmt = (n) => Math.round(n).toLocaleString('en-US');

        /** The chosen tier's terms, or null while nothing has been priced. */
        function currentTier() {
            if (!wiz.terms || !wiz.terms.tiers) return null;
            return wiz.terms.tiers[wiz.tierIdx] || null;
        }

        /**
         * THE ONE PRICING FUNCTION. It does no arithmetic of its own beyond
         * stake × multiplier — the multiplier, the target and the window all
         * come from the server's preview, which is the same policy the write
         * path applies. Returns null when nothing has been priced yet, so
         * callers render an honest blank instead of a plausible number.
         */
        function price() {
            const t = currentTier();
            if (!t || !t.available || t.payoutMultiplier == null) return null;
            const stake = Number(wiz.stake);
            if (!isFinite(stake) || stake <= 0) return null;
            return {
                tier: t,
                multiplier: t.payoutMultiplier,
                windowDays: t.windowDays,
                // payout = the total returned; profit = what is won on top.
                payoutIfMet: Math.round(stake * t.payoutMultiplier),
                profitIfMet: Math.round(stake * t.payoutMultiplier) - Math.round(stake),
            };
        }

        /** The absolute figure this contract settles on, in the metric's own unit. */
        function targetDisplay() {
            const t = currentTier();
            if (!t) return null;
            const m = WIZ_METRICS[wiz.metric];
            if (t.targetCents != null) return money0(t.targetCents / 100) + ' this window';
            if (wiz.baseline != null && t.growthPct != null) {
                const abs = Math.ceil(wiz.baseline * (1 + t.growthPct / 100));
                return (m.kind === 'money' ? money0(abs / 100) : countFmt(abs))
                    + ' (+' + t.growthPct + '%)';
            }
            return t.growthPct != null ? '+' + t.growthPct + '%' : null;
        }

        /** The threshold POSTed with the contract, in the platform's own unit. */
        function targetThreshold() {
            const t = currentTier();
            if (!t) return null;
            if (t.targetCents != null) return t.targetCents;
            if (wiz.baseline != null && t.growthPct != null) {
                return Math.ceil(wiz.baseline * (1 + t.growthPct / 100));
            }
            return null;
        }

        function deadlineIso() {
            const t = currentTier();
            // Bank income settles on the operator's own pay cycle, which the
            // preview computes; everything else runs the tier's window.
            if (wiz.terms && wiz.terms.suggestedDeadlineUtc) return wiz.terms.suggestedDeadlineUtc;
            const days = (t && t.windowDays) || 30;
            return new Date(Date.now() + days * 86400000).toISOString();
        }

        function settleLabel(iso) {
            try {
                return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) { return '—'; }
        }

        // ---- step 1 · choosing -------------------------------------------------

        function metricRow(metric) {
            return ssRoot.querySelector('.ss-metric[data-metric="' + metric + '"]');
        }

        function selectMetric(metric) {
            wiz.metric = metric;
            // A different source prices differently, so nothing priced under the
            // old one survives the change.
            wiz.terms = null; wiz.termsError = null; wiz.stake = null; wiz.baseline = null; wiz.tierIdx = 0;
            ssRoot.querySelectorAll('.mb-mx-r').forEach((r) => r.classList.remove('sel'));
            const row = metricRow(metric);
            if (row) {
                row.classList.add('sel');
                const go = row.querySelector('.ss-go');
                if (go) go.textContent = 'Selected ✓';
            }
            // Any row that lost the selection goes back to stating its own state.
            ssRoot.querySelectorAll('.ss-metric.ready').forEach((r) => {
                if (r === row) return;
                const go = r.querySelector('.ss-go');
                if (go) go.textContent = 'Ready ✓';
            });
            renderFoot();
        }

        /**
         * One click, two meanings, decided by what is actually connected:
         * a ready row is chosen, an unconnected one starts its real connect
         * flow. Nothing here navigates away — /solo/new does not exist, and
         * sending someone to it was a dead end.
         */
        function metricAction(metric) {
            const row = metricRow(metric);
            if (!row) return;
            if (row.classList.contains('waiting')) return;   // history still accruing

            if (row.classList.contains('ready')) { selectMetric(metric); return; }

            // Its own source is attached but the bank is not: the bank is the
            // outstanding prerequisite, so that is the flow to start.
            const via = row.classList.contains('needs-bank')
                ? 'bank'
                : WIZ_METRICS[metric].connectVia;

            if (via === 'bank') {
                if (window.app && typeof window.app.connectBank === 'function') {
                    window.app.connectBank(() => { loadSourceState(); });
                }
                return;
            }
            // connectSource() owns the popup, the CSRF state and the polling for
            // every platform on this site; duplicating it here would be a second
            // OAuth implementation to keep in step with the first.
            if (window.app && typeof window.app.connectSource === 'function') {
                connectProxy(via);
                const go = row.querySelector('.ss-go');
                if (go) go.textContent = 'Opening ' + via + '…';
                window.app.connectSource(via);
            }
        }

        /**
         * connectSource() drives a button it finds by id, and it rewrites that
         * button's innerHTML with a spinner and then "✓ Connected". Pointing it
         * at the matrix cell would destroy the cell; pointing it at nothing makes
         * it return without starting the flow at all. So it is handed an
         * offscreen stand-in, and the row keeps saying what the row says.
         */
        function connectProxy(source) {
            let p = document.getElementById(source + '-btn');
            if (p) return p;
            p = document.createElement('button');
            p.type = 'button';
            p.id = source + '-btn';
            p.setAttribute('aria-hidden', 'true');
            p.setAttribute('tabindex', '-1');
            p.setAttribute('style', 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);');
            ssRoot.appendChild(p);
            return p;
        }

        ssRoot.querySelectorAll('.mb-mx-r.ss-metric').forEach((row) => {
            const metric = row.getAttribute('data-metric');
            row.classList.add('mb-selectable');
            row.addEventListener('click', () => metricAction(metric));
            const go = row.querySelector('.ss-go');
            if (go) {
                // The button is the keyboard-reachable control; the row is a
                // convenience on top of it, so the click must not run twice.
                go.addEventListener('click', (e) => { e.stopPropagation(); metricAction(metric); });
            }
        });

        // ---- pricing -----------------------------------------------------------

        /**
         * Reads the terms the write path will apply, plus the baseline for the
         * platforms whose target is a growth rate over one. Both are reads.
         */
        async function loadTerms() {
            const m = WIZ_METRICS[wiz.metric];
            wiz.terms = null; wiz.termsError = null; wiz.baseline = null;
            renderStep2();

            let res;
            try {
                res = await window.api.getTermsPreview(m.platform);
            } catch (e) {
                console.error('[Wizard] terms preview unavailable:', e);
                wiz.termsError = e && e.status === 401
                    ? 'Sign in to price a contract against your record'
                    : 'Terms are temporarily unavailable — try again in a moment';
                renderStep2(); renderFoot();
                return;
            }

            if (!res || res.ok === false) {
                wiz.termsError = res && res.code === 'INCOME_HISTORY_UNAVAILABLE'
                    ? 'Your bank history has not been read yet — reconnect or wait for the first sync'
                    : 'This source cannot be priced yet';
                renderStep2(); renderFoot();
                return;
            }
            // A growth target with nothing to grow from is not a target. Said
            // here rather than at the sign button, where it would be a dead end
            // three steps in.
            if (!res.pricedFromHistory && !m.oracleMetric) {
                wiz.termsError = m.noBaseline || 'This metric cannot be priced yet';
                renderStep2(); renderFoot();
                return;
            }
            wiz.terms = res;

            // First AVAILABLE tier, not simply the first: an operator whose
            // history does not support All In should not open on it.
            const firstOpen = (res.tiers || []).findIndex(t => t.available);
            wiz.tierIdx = firstOpen >= 0 ? firstOpen : 0;

            const t = currentTier();
            if (t && wiz.stake == null) wiz.stake = Math.round((t.minStakeUsdCents || 10000) / 100);

            // A growth target needs something to grow from.
            if (!res.pricedFromHistory && m.oracleMetric) {
                try {
                    const pv = await window.api.getProviderPreview(m.platform, m.oracleMetric);
                    const b = pv && (pv.current_baseline != null ? pv.current_baseline : pv.baseline_value);
                    if (typeof b === 'number' && isFinite(b)) wiz.baseline = b;
                } catch (e) {
                    console.warn('[Wizard] baseline preview unavailable:', e);
                }
                if (wiz.baseline == null) {
                    /* The target for these platforms is a growth rate, and the
                       threshold the contract settles on is baseline × (1+rate).
                       Without the baseline there is no threshold to agree to —
                       so this is said now, not at the sign button. */
                    wiz.termsError = 'Your ' + m.platform.toLowerCase()
                        + ' baseline could not be read — reconnect the source, or try again shortly';
                    renderStep2(); renderFoot();
                    return;
                }
            }
            renderStep2(); renderFoot();
        }

        function clampStake(v) {
            const t = currentTier();
            const min = t ? Math.round((t.minStakeUsdCents || 0) / 100) : 0;
            const max = t ? Math.round((t.maxStakeUsdCents || 0) / 100) : 0;
            let n = Math.round(Number(v) || 0);
            if (min && n < min) n = min;
            if (max && n > max) n = max;
            return n;
        }

        // ---- step 2 · terms ----------------------------------------------------

        function summaryRow(kind) {
            const m = WIZ_METRICS[wiz.metric];
            const row = wEl('div', 'mb-srow');
            const ic = wEl('span', 'ic', '✓');
            ic.setAttribute('aria-hidden', 'true');
            row.appendChild(ic);
            row.appendChild(wEl('span', 'lab', kind === 'source' ? 'Source' : 'Terms'));

            const val = wEl('span', 'val');
            if (kind === 'source') {
                // The mark is decorative; "Verified" is said in words beside it.
                val.appendChild(document.createTextNode(m.label));
                val.appendChild(wEl('small', null, m.verified));
            } else {
                const p = price();
                const t = currentTier();
                val.appendChild(document.createTextNode(
                    (t && t.label ? t.label : 'Terms') + ' · ' + ((t && t.windowDays) || '—') + ' days'));
                val.appendChild(wEl('small', null, p
                    ? money0(wiz.stake) + ' at risk · ' + p.multiplier.toFixed(1) + '×'
                    : 'not priced'));
            }
            row.appendChild(val);

            const edit = wEl('button', 'edit', 'Edit');
            edit.type = 'button';
            edit.addEventListener('click', () => goStep(kind === 'source' ? 1 : 2));
            row.appendChild(edit);
            return row;
        }

        function payoutStrip() {
            const strip = wEl('div', 'mb-payout');
            const p = price();
            const m = WIZ_METRICS[wiz.metric];

            const left = wEl('div');
            left.appendChild(wEl('div', 'mult', p ? p.multiplier.toFixed(1) + '×' : '—'));
            left.appendChild(wEl('div', 'mk', 'Payout'));
            strip.appendChild(left);

            const plain = wEl('div', 'plain');
            if (!p) {
                strip.classList.add('mb-unpriced');
                const t = currentTier();
                plain.textContent = t && !t.available
                    ? (t.unavailableReason || 'This tier is not available on your record yet.')
                    : 'Choose an amount to see what it returns.';
                strip.appendChild(plain);
                return strip;
            }

            const tgt = targetDisplay();
            plain.appendChild(document.createTextNode('Risk '));
            plain.appendChild(wEl('b', null, money0(wiz.stake)));
            plain.appendChild(document.createTextNode(' to earn '));
            plain.appendChild(wEl('b', null, money0(p.profitIfMet)));
            plain.appendChild(document.createTextNode(
                ' profit if ' + m.short + ' reaches ' + (tgt || 'the target')
                + ' in ' + p.windowDays + ' days.'));
            strip.appendChild(plain);

            const out = wEl('div', 'out');
            out.appendChild(wEl('div', 'w', '◆ Hit · +' + money0(p.profitIfMet)));
            out.appendChild(wEl('div', 'l', 'Miss · −' + money0(wiz.stake)));
            strip.appendChild(out);
            return strip;
        }

        function renderStep2() {
            const host = document.getElementById('mb-wstep-2');
            if (!host || !wiz.metric) return;
            host.innerHTML = '';
            host.appendChild(summaryRow('source'));
            host.appendChild(wEl('div', 'mb-act-head', 'Step 2 of 3 · Set your terms'));
            const h = wEl('h3', 'mb-act-title', 'Put capital on your target');
            host.appendChild(h);

            if (wiz.termsError) {
                host.appendChild(wEl('p', 'mb-act-sub', wiz.termsError));
                return;
            }
            if (!wiz.terms) {
                host.appendChild(wEl('p', 'mb-act-sub', 'Reading your record…'));
                return;
            }

            host.appendChild(wEl('p', 'mb-act-sub', wiz.terms.pricedFromHistory
                ? 'Priced from your last ' + (wiz.terms.monthsAnalyzed || 'twelve') + ' months — a harder target pays more.'
                : 'Priced from your verified record — a harder target pays more.'));

            const tiers = wiz.terms.tiers || [];
            const t = currentTier();

            // ---- the target ladder
            const f1 = wEl('div', 'mb-field');
            const l1 = wEl('div', 'mb-flabel');
            l1.appendChild(wEl('span', 'k', 'Target'));
            l1.appendChild(wEl('span', 'v', targetDisplay() || '—'));
            f1.appendChild(l1);
            const range = document.createElement('input');
            range.type = 'range'; range.className = 'mb-range';
            range.min = '0'; range.max = String(Math.max(0, tiers.length - 1)); range.step = '1';
            range.value = String(wiz.tierIdx);
            range.setAttribute('aria-label', 'Target difficulty');
            range.addEventListener('input', function () {
                wiz.tierIdx = Number(this.value) || 0;
                wiz.stake = clampStake(wiz.stake);
                renderStep2(); renderFoot();
            });
            f1.appendChild(range);
            const ticks = wEl('div', 'mb-ticks');
            tiers.forEach((tt) => ticks.appendChild(wEl('span', null,
                tt.label + (tt.growthPct != null ? ' +' + tt.growthPct + '%' : ''))));
            f1.appendChild(ticks);
            if (t && !t.available) {
                f1.appendChild(wEl('div', 'mb-hint', t.unavailableReason || 'Not available on your record yet'));
            }
            host.appendChild(f1);

            // ---- the window, which the tier sets
            const f2 = wEl('div', 'mb-field');
            const l2 = wEl('div', 'mb-flabel');
            l2.appendChild(wEl('span', 'k', 'Window'));
            f2.appendChild(l2);
            const wp = wEl('div', 'mb-pills');
            tiers.forEach((tt, i) => {
                const b = wEl('button', 'mb-pill' + (i === wiz.tierIdx ? ' on' : ''), tt.windowDays + ' Days');
                b.type = 'button';
                if (!tt.available) b.disabled = true;
                b.addEventListener('click', () => {
                    wiz.tierIdx = i; wiz.stake = clampStake(wiz.stake);
                    renderStep2(); renderFoot();
                });
                wp.appendChild(b);
            });
            f2.appendChild(wp);
            f2.appendChild(wEl('div', 'mb-hint',
                'The window comes with the target — a harder target runs shorter.'));
            host.appendChild(f2);

            // ---- the stake
            const f3 = wEl('div', 'mb-field');
            const l3 = wEl('div', 'mb-flabel');
            l3.appendChild(wEl('span', 'k', 'Amount at risk'));
            f3.appendChild(l3);
            const sp = wEl('div', 'mb-pills');
            const min = t ? Math.round((t.minStakeUsdCents || 0) / 100) : 0;
            const max = t ? Math.round((t.maxStakeUsdCents || 0) / 100) : 0;
            [100, 250, 500, 1000].forEach((v) => {
                const b = wEl('button', 'mb-pill' + (v === wiz.stake ? ' on' : ''), money0(v));
                b.type = 'button';
                if ((min && v < min) || (max && v > max)) b.disabled = true;
                b.addEventListener('click', () => { wiz.stake = clampStake(v); renderStep2(); renderFoot(); });
                sp.appendChild(b);
            });
            const box = wEl('span', 'mb-stakein');
            box.appendChild(wEl('span', 'cur', '$'));
            const inp = document.createElement('input');
            inp.type = 'text'; inp.inputMode = 'numeric';
            inp.value = wiz.stake == null ? '' : String(wiz.stake);
            inp.setAttribute('aria-label', 'Amount at risk in dollars');
            inp.addEventListener('input', function () {
                const digits = this.value.replace(/[^0-9]/g, '');
                wiz.stake = digits ? Number(digits) : null;
                // Not clamped ON INPUT: snapping "1" up to "100" mid-keystroke
                // makes the field impossible to type into. Clamped on blur.
                refreshPayoutOnly();
            });
            inp.addEventListener('blur', function () {
                wiz.stake = clampStake(wiz.stake);
                renderStep2(); renderFoot();
            });
            box.appendChild(inp);
            sp.appendChild(box);
            f3.appendChild(sp);
            if (min || max) {
                f3.appendChild(wEl('div', 'mb-hint',
                    'This tier takes ' + money0(min) + ' to ' + money0(max) + '.'));
            }
            host.appendChild(f3);

            host.appendChild(payoutStrip());
        }

        /** Retype the strip without rebuilding the field the caret is in. */
        function refreshPayoutOnly() {
            const host = document.getElementById('mb-wstep-2');
            if (!host) return;
            const old = host.querySelector('.mb-payout');
            if (old) host.replaceChild(payoutStrip(), old);
            renderFoot();
        }

        // ---- step 3 · review & sign -------------------------------------------

        function docRow(k, v, ox) {
            const r = wEl('div', 'mb-drow');
            r.appendChild(wEl('span', 'k', k));
            r.appendChild(wEl('span', 'lead'));
            r.appendChild(wEl('span', 'v' + (ox ? ' ox' : ''), v));
            return r;
        }

        function renderStep3() {
            const host = document.getElementById('mb-wstep-3');
            if (!host || !wiz.metric) return;
            const p = price();
            const m = WIZ_METRICS[wiz.metric];
            host.innerHTML = '';
            host.appendChild(summaryRow('source'));
            host.appendChild(summaryRow('terms'));
            host.appendChild(wEl('div', 'mb-act-head', 'Step 3 of 3 · Review & sign'));
            host.appendChild(wEl('h3', 'mb-act-title', 'Sign to execute'));
            host.appendChild(wEl('p', 'mb-act-sub',
                'Signing places your capital in escrow and records the contract on the public ledger.'));

            const doc = wEl('div', 'mb-contract');
            ['tl', 'tr', 'bl', 'br'].forEach((c) => {
                const s = wEl('span', 'reg ' + c);
                s.setAttribute('aria-hidden', 'true');
                doc.appendChild(s);
            });
            const dh = wEl('div', 'mb-doc-h');
            dh.appendChild(wEl('span', 'a', 'Performance Agreement · Solo'));
            dh.appendChild(wEl('span', 'f', 'Form S · 01'));
            doc.appendChild(dh);

            const t = currentTier();
            doc.appendChild(wEl('h4', 'mb-doc-title',
                m.short + ' · ' + (t && t.label ? t.label : '')));
            doc.appendChild(wEl('div', 'mb-doc-sub', 'Stake against your own verified record'));

            const led = wEl('div', 'mb-dled');
            led.appendChild(docRow('Stake at risk', wiz.stake != null ? money2(wiz.stake) : '—'));
            led.appendChild(docRow('Target',
                (targetDisplay() || '—') + (p ? ' in ' + p.windowDays + ' days' : '')));
            led.appendChild(docRow('Payout if met', p ? '+' + money2(p.payoutIfMet) : '—', true));
            led.appendChild(docRow('Oracle', m.oracle));
            led.appendChild(docRow('Settlement', 'Automatic · ' + settleLabel(deadlineIso())));
            doc.appendChild(led);

            const cl = wEl('div', 'mb-clauses');
            CLAUSES.forEach((parts, i) => {
                const b = wEl('button', 'mb-citem' + (wiz.clauses[i] ? ' checked' : ''));
                b.type = 'button';
                b.setAttribute('aria-pressed', wiz.clauses[i] ? 'true' : 'false');
                const box = wEl('span', 'mb-cbox', '✓');
                box.setAttribute('aria-hidden', 'true');
                b.appendChild(box);
                const txt = wEl('span', 'mb-ctxt');
                txt.appendChild(document.createTextNode(parts[0]));
                txt.appendChild(wEl('b', null, parts[1]));
                txt.appendChild(document.createTextNode(parts[2]));
                b.appendChild(txt);
                b.addEventListener('click', () => {
                    wiz.clauses[i] = !wiz.clauses[i];
                    b.classList.toggle('checked', wiz.clauses[i]);
                    b.setAttribute('aria-pressed', wiz.clauses[i] ? 'true' : 'false');
                    renderFoot();
                });
                cl.appendChild(b);
            });
            doc.appendChild(cl);

            const sign = wEl('div', 'mb-sign');
            const sig = wEl('div', 'mb-sig');
            const line = wEl('div', 'line');
            line.appendChild(wEl('span', 'ph', 'Sign to execute'));
            sig.appendChild(line);
            sig.appendChild(wEl('div', 'lb', 'Signature · Operator'));
            sign.appendChild(sig);
            const wax = wEl('div', 'mb-docwax empty');
            const ws = wEl('span');
            ws.appendChild(document.createTextNode('Seal on'));
            ws.appendChild(document.createElement('br'));
            ws.appendChild(document.createTextNode('signing'));
            wax.appendChild(ws);
            sign.appendChild(wax);
            doc.appendChild(sign);

            host.appendChild(doc);
        }

        /** The wax "C", drawn rather than fetched so it stamps in instantly. */
        function sealSvg(size) {
            const NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('viewBox', '0 0 60 60');
            svg.setAttribute('width', String(size));
            svg.setAttribute('height', String(size));
            svg.setAttribute('role', 'img');
            const title = document.createElementNS(NS, 'title');
            title.textContent = 'Sealed';
            svg.appendChild(title);
            const d = 'M30 4 C40 4 47 12 50 22 C53 30 56 34 54 42 C52 50 44 56 34 56 C22 57 12 52 8 42 C4 33 6 24 10 17 C14 10 20 4 30 4 Z';
            const body = document.createElementNS(NS, 'path');
            body.setAttribute('d', d); body.setAttribute('fill', '#5E1420');
            svg.appendChild(body);
            const edge = document.createElementNS(NS, 'path');
            edge.setAttribute('d', d); edge.setAttribute('fill', 'none');
            edge.setAttribute('stroke', '#4E0F19'); edge.setAttribute('stroke-width', '1.2');
            svg.appendChild(edge);
            const ring = document.createElementNS(NS, 'circle');
            ring.setAttribute('cx', '30'); ring.setAttribute('cy', '30'); ring.setAttribute('r', '16.5');
            ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'rgba(255,235,220,.16)');
            ring.setAttribute('stroke-width', '1');
            svg.appendChild(ring);
            const c = document.createElementNS(NS, 'text');
            c.setAttribute('x', '30'); c.setAttribute('y', '37');
            c.setAttribute('font-family', 'Cormorant Garamond,serif');
            c.setAttribute('font-size', '21'); c.setAttribute('font-weight', '700');
            c.setAttribute('fill', '#F0DAC7'); c.setAttribute('text-anchor', 'middle');
            c.textContent = 'C';
            svg.appendChild(c);
            return svg;
        }

        function operatorName() {
            try {
                const u = window.api.getStoredUser && window.api.getStoredUser();
                return (u && (u.displayName || u.username || u.email)) || 'Operator';
            } catch (e) { return 'Operator'; }
        }

        // ---- executed ----------------------------------------------------------

        function renderExecuted() {
            const host = document.getElementById('mb-wstep-done');
            const c = wiz.contract;
            if (!host || !c) return;
            host.innerHTML = '';
            const ex = wEl('div', 'mb-exec');
            const wm = wEl('div', 'mb-exec-wm', 'C');
            wm.setAttribute('aria-hidden', 'true');
            ex.appendChild(wm);
            const seal = wEl('div', 'seal');
            seal.appendChild(sealSvg(70));
            ex.appendChild(seal);
            ex.appendChild(wEl('div', 'et', 'Contract executed.'));
            ex.appendChild(wEl('div', 'es',
                'Your capital is in escrow. Settlement is automatic on '
                + settleLabel(c.deadline) + ' — no further action needed.'));

            const line = wEl('div', 'eline');
            const item = (k, v) => {
                const d = wEl('div');
                d.appendChild(wEl('div', 'k', k));
                d.appendChild(wEl('div', 'v', v));
                return d;
            };
            line.appendChild(item('Contract', c.receipt));
            line.appendChild(item('At risk', money2(c.stake)));
            line.appendChild(item('Payout if met', c.payout != null ? '+' + money2(c.payout) : '—'));
            line.appendChild(item('Settles', settleLabel(c.deadline)));
            ex.appendChild(line);

            const next = wEl('div', 'mb-exec-next');
            next.appendChild(wEl('span', 'mb-mark'));
            next.appendChild(document.createTextNode('Verified every 6 hours · You will be notified at settlement'));
            ex.appendChild(next);
            host.appendChild(ex);
        }

        /**
         * WRITE FIRST, CELEBRATE SECOND. The executed state is only shown once
         * the server has actually created the contract and returned its id and
         * deadline — a seal stamped on a request that failed would be the one
         * lie this product cannot afford.
         */
        async function signContract() {
            if (wiz.busy) return;
            const p = price();
            const threshold = targetThreshold();
            const m = WIZ_METRICS[wiz.metric];
            if (!p || threshold == null) {
                wiz.signError = 'These terms could not be priced — go back and choose again';
                renderFoot();
                return;
            }

            wiz.busy = true; wiz.signError = null;
            renderFoot();

            let res;
            try {
                res = await window.api.createContract({
                    platform: m.platform,
                    metricType: m.metricType,
                    condition: { operator: 'GTE', threshold: threshold, deadline: deadlineIso() },
                    lockAmountUsdCents: Math.round(wiz.stake * 100),
                    riskTier: p.tier.riskTier,
                });
            } catch (e) {
                console.error('[Wizard] contract create failed:', e);
                wiz.busy = false;
                wiz.signError = (e && e.message) ? e.message : 'The contract could not be created';
                renderFoot();
                return;
            }

            const created = res && (res.contract || res);
            if (!res || res.ok === false || !created || !created.id) {
                wiz.busy = false;
                wiz.signError = (res && (res.error || res.message)) || 'The contract could not be created';
                renderFoot();
                return;
            }

            // The signature and the seal go onto the document that was signed.
            const line = document.querySelector('#mb-wstep-3 .mb-sig .line');
            if (line) { line.innerHTML = ''; line.appendChild(wEl('span', 'nm', operatorName())); }
            const wax = document.querySelector('#mb-wstep-3 .mb-docwax');
            if (wax) { wax.className = 'mb-docwax'; wax.innerHTML = ''; wax.appendChild(sealSvg(52)); }

            wiz.busy = false;
            wiz.contract = {
                id: created.id,
                // The record hash is the contract's own identifier — the same one
                // the board prints on a card. A sequential "CM·S·0001" would be a
                // number this page invented.
                receipt: 'RCPT·' + String(created.recordHash || created.id || '').slice(0, 6).toUpperCase(),
                stake: (created.lockAmountUsdCents != null ? created.lockAmountUsdCents / 100 : wiz.stake),
                payout: (created.payoutAmountUsdCents != null ? created.payoutAmountUsdCents / 100 : p.payoutIfMet),
                deadline: created.deadline || created.deadlineUtc || deadlineIso(),
            };
            renderExecuted();
            goStep('done');
        }

        // ---- navigation & footer ----------------------------------------------

        function goStep(s) {
            wiz.step = s;
            if (s === 2) {
                // Re-price on every entry: the source may have changed, and a
                // stale multiplier is worse than a slow one.
                if (!wiz.terms && !wiz.termsError) loadTerms(); else renderStep2();
            }
            if (s === 3) renderStep3();
            render();
            if (wizBody && typeof wizBody.scrollIntoView === 'function') {
                wizBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function render() {
            wizStepEls.forEach((el) => {
                el.classList.toggle('on', el.getAttribute('data-step') === String(wiz.step));
            });
            const idx = wiz.step === 'done' ? 3 : wiz.step - 1;
            ssRoot.querySelectorAll('#mb-stp .n').forEach((node, i) => {
                const disc = node.querySelector('.disc');
                const lb = node.querySelector('.lb');
                disc.classList.remove('on', 'done');
                if (wiz.step === 'done' || i < idx) disc.classList.add('done');
                else if (i === idx) disc.classList.add('on');
                lb.classList.toggle('act', i === idx && wiz.step !== 'done');
                if (i === idx && wiz.step !== 'done') node.setAttribute('aria-current', 'step');
                else node.removeAttribute('aria-current');
            });
            renderFoot();
        }

        function footBtn(label, onClick, disabled) {
            const b = wEl('button', 'mb-wbtn', label);
            b.type = 'button';
            if (disabled) b.disabled = true;
            else b.addEventListener('click', onClick);
            return b;
        }
        function footGhost(label, onClick) {
            const b = wEl('button', 'mb-gbtn', label);
            b.type = 'button';
            b.addEventListener('click', onClick);
            return b;
        }
        function footNote(text) {
            const n = wEl('span', 'mb-footnote');
            n.appendChild(wEl('span', 'mb-mark'));
            n.appendChild(document.createTextNode(text));
            return n;
        }

        function renderFoot() {
            if (!wizFoot) return;
            wizFoot.innerHTML = '';

            if (wiz.step === 1) {
                wizFoot.appendChild(footNote('Read-only · revocable anytime'));
                wizFoot.appendChild(footBtn('Continue → Set terms',
                    () => goStep(2), !wiz.metric));
                return;
            }
            if (wiz.step === 2) {
                wizFoot.appendChild(footGhost('← Back', () => goStep(1)));
                wizFoot.appendChild(footBtn('Continue → Review',
                    () => goStep(3), !price()));
                return;
            }
            if (wiz.step === 3) {
                /* A failed write keeps BOTH the reason and the way back. The
                   button below stays live, so the retry is simply pressing it
                   again — nothing was written, so there is nothing to undo. */
                const left = wEl('span');
                left.setAttribute('style', 'display:flex;flex-direction:column;gap:6px;align-items:flex-start');
                left.appendChild(footGhost('← Back', () => goStep(2)));
                if (wiz.signError) {
                    const e = wEl('span', 'mb-werr');
                    e.appendChild(wEl('span', 'mb-mark'));
                    e.appendChild(document.createTextNode(wiz.signError));
                    e.setAttribute('role', 'status');
                    left.appendChild(e);
                }
                wizFoot.appendChild(left);
                const ready = wiz.clauses.every(Boolean) && !!price();
                const label = wiz.busy
                    ? 'Placing in escrow…'
                    : 'Sign & Seal · Place ' + (wiz.stake != null ? money0(wiz.stake) : '—') + ' in escrow';
                const b = footBtn(label, signContract, !ready || wiz.busy);
                if (wiz.busy) b.classList.add('mb-busy');
                wizFoot.appendChild(b);
                return;
            }
            wizFoot.appendChild(footNote('Recorded on the public ledger'));
            const group = wEl('span');
            group.setAttribute('style', 'display:flex;gap:22px;align-items:center');
            group.appendChild(footGhost('Create another →', () => {
                wiz.metric = null; wiz.terms = null; wiz.termsError = null;
                wiz.stake = null; wiz.baseline = null; wiz.tierIdx = 0;
                wiz.clauses = [false, false, false]; wiz.contract = null; wiz.signError = null;
                ssRoot.querySelectorAll('.mb-mx-r').forEach((r) => r.classList.remove('sel'));
                loadSourceState();
                goStep(1);
            }));
            const view = footBtn('View contract →', () => {
                if (window.router && wiz.contract) window.router.navigate('/contract/' + wiz.contract.id);
            });
            group.appendChild(view);
            wizFoot.appendChild(group);
        }

        render();
    }

    /* Paint the loading state first, then go and get the real thing. Each of
       the three fetches owns one surface and none of them blocks the others, so
       a slow or dead endpoint degrades only its own section. */
    renderRivalries();
    loadMarketStats();
    loadBoard();
    renderLedger();
}
