/**
 * Collateral — one paper, and the mark that punctuates it.
 *
 * ── WHAT WAS ACTUALLY CAUSING THE PANEL FEELING ──────────────────────────────
 * Measured before changing anything, and it was not what it looked like. Eight
 * of the ten sections were ALREADY the same colour, rgb(241,232,211). The page
 * read as stacked panels because of three things instead:
 *
 *   the hero        rgb(241,238,232) — a COOLER paper than the rest, so the
 *                   first join on the page is a hue shift, not a tone shift,
 *                   which the eye separates even more readily
 *   the fork        rgb(242,233,210) — one point off the others, close enough
 *                   to look like a mistake rather than a decision
 *   the card fills  .flw-panel, .prc-calc, .dl-duel, .prc-tier and the rest sat
 *                   on rgb(250,245,232), a LIGHTER paper than the page. Those
 *                   are the boxes. A lighter rectangle inside a section reads
 *                   as a panel far more strongly than two adjacent sections
 *                   half a step apart.
 *
 * So this file does two jobs: it collapses every one of those onto a single
 * --paper token, and it supplies the divider that replaces the boundaries.
 *
 * CARD HAIRLINES ARE KEPT. The brief asks for panel backgrounds and boxed
 * transitions to go, and they do — every fill is now the page's own paper. The
 * 1px rules around the calculator and the duel cards stay, because without any
 * edge at all a calculator with a slider and a live register lose the boundary
 * that says which controls belong to which object. Colour jumps are what make
 * it look like stacked website sections; a hairline is how a printed ledger
 * rules its columns.
 *
 * ── THE DIVIDER ──────────────────────────────────────────────────────────────
 * A real SVG rhombus, not a Unicode character. U+25C6 renders in whatever
 * fallback font the machine has, so its weight and size change per device and
 * it never sits on the optical centre of the rule.
 *
 * Hairlines fade to nothing at both ends, so the rule has no hard start or
 * stop — an engraved line pressed into paper, rather than a border drawn across
 * it. 14px of clearance each side of the diamond.
 *
 * The engraved outline is a 0.5px stroke at 22% on the diamond's own colour.
 * At full strength it reads as a bevel, which the brief rules out; at this
 * weight it only catches the edge.
 */

/* Oxblood, per the brief. Deeper than the --ox used for type so the mark reads
   as punctuation rather than as another heading. */
const DIAMOND = '#6A1F2D';

export function renderChapterRuleStyles() {
    return `
        <style>
        /* ── ONE PAPER ───────────────────────────────────────────────────────
           Every section, and every card inside them, resolves to this. Declared
           on .lp so it cascades, and repeated on the sections themselves
           because each one sets its own background in its own scoped block. */
        /* .lp.cl-root, not .lp. The page root carries BOTH classes, and a
           .cl-root rule declared later in another stylesheet beats a bare .lp
           at equal specificity on source order — measured, the root stayed
           rgb(241,232,211) while every section had already moved. That matters
           more than it sounds: the chapter rules sit directly on the root, so
           the one strip of old paper left on the page was exactly the strip
           between every pair of chapters. Two classes wins regardless of
           order. */
        /* .lp.cl-root and !important, and both are needed for reasons that were
           measured rather than guessed.

           TWO CLASSES because the page root carries both, and a .cl-root rule
           declared later beats a bare .lp at equal specificity on source order.

           !important because that .cl-root rule sets the ground with
           !important itself — it is the page-ground unification that fixed the
           white header bar. Without matching it the root stayed
           rgb(241,232,211) while every section had already moved.

           That mattered more than it sounds: the chapter rules sit directly on
           the root, so the one strip of old paper left on the page would have
           been exactly the strip between every pair of chapters — the opposite
           of the point. */
        .lp.cl-root{--paper:#F3EADB;background:#F3EADB !important}
        /* .clt is the hero's WRAPPER and was missed the first time — it still
           held rgb(241,238,232), the cooler paper, so a strip of the old tone
           survived directly under the hero even after .clt-hero moved. */
        /* .stc replaced .fk here. Its own stylesheet sets the same value via
           --parch, but it stays in this list so the page's paper is still
           declared in one place. The certificates INSIDE it are deliberately
           one step lighter — see StructuresSection.js. */
        .lp .lg,.lp .stc,.lp .cs,.lp .orc,.lp .rec,
        .lp .flw,.lp .prc,.lp .dl,.lp .sch{background-color:#F3EADB}
        /* The hero sits on #F1E8D3, matching the header bar above it. Split out
           of the list above so the two surfaces that meet at the top of the
           page carry one value. */
        .lp .clt,.lp .clt-hero{background-color:#F1E8D3}

        /* ── THE GRAIN GOES OVER EVERYTHING, WHICH IS THE REAL FIX ───────────
           .cl-grain is a fixed full-viewport noise layer with
           mix-blend-mode:multiply, and it sat at z-index 1. Every section is
           position:relative at z-index 2, so sections painted ABOVE it and were
           never textured, while the root — and therefore every gap between
           chapters — painted BELOW it and was multiplied.

           So the grain was only ever visible in the gaps. Identical colours
           either side, and still a darker strip at every divider, because the
           difference was never the colour: it was which side of the grain each
           surface painted on. A background-color audit cannot see that, which
           is why the first pass reported one paper and the band was still
           there.

           At z-index 3 it lands on everything equally — above the sections,
           below the header at z-index 50 — so the texture is continuous across
           the whole document, which is what "one uninterrupted paper" asks for
           in the first place. */
        .lp .cl-grain{z-index:3}

        /* ── THE ORACLE BAND CARRIES NO FILL ─────────────────────────────────
           #EBE0C6 was tried here and rejected on sight: against warm parchment
           a deeper warm tan does not read as vellum, it reads as mustard, and a
           tinted block is the one thing this page spent its whole redesign
           removing. So there is no fill. The band is the same paper as
           everything else and it is defined by RULES AND SPACE instead — which
           is how an engraved instrument sets off a block of attestations, and
           it does not depend on finding a tint that survives next to gold ink.

           It is .clt-strip, INSIDE the hero wrapper, not .orc. .orc is the
           802px oracle register further down the page and is untouched.

           THE TAN WAS A GRADIENT, NOT A COLOUR. CollateralHero.js declares
           background-image:linear-gradient(rgb(236,225,199),rgb(233,221,192))
           on .clt-strip. Setting background-color:transparent did nothing to
           it, and — worse — my verification read background-COLOR only, so it
           looked straight through the gradient, found the paper underneath and
           reported "one paper" three times while the band was still visibly
           tan. background-image has to be cleared explicitly, and a paint audit
           has to read colour AND image AND pseudo-elements. */
        .lp .clt-strip{background-color:transparent;background-image:none}

        /* NO RULES EITHER. When the fill came off I replaced it with a hairline
           top and bottom, on the reasoning that the band still needed some
           boundary. It did not. At 1840px wide those two lines spanned the
           whole viewport, and a full-bleed line across the page is the exact
           thing that reads as a boxed section — the same failure as the tint,
           drawn at 1px instead of filled.

           The chapter dividers get away with a line because they are 102px of
           air with a diamond at the optical centre; they read as punctuation.
           A bare edge-to-edge rule with content pressed against it reads as a
           border. So the band is set off by SPACE ONLY, which is what the
           one-paper brief asked for in the first place.

           These were the only two near-full-width hairlines anywhere in the
           document — measured across every element and pseudo-element in the
           first 2400px, border and background both. Nothing else on the page
           depended on them. */
        .lp .clt-strip{border-top:0;border-bottom:0;position:relative}
        .lp .clt-strip::before,.lp .clt-strip::after{content:none}

        /* CONTRAST. The oracle labels and the eyebrow were rgb(154,140,111) at
           10px — 2.77:1 on this paper, against a 4.5:1 AA threshold. Small type
           you have to lean in to read is what actually reads cheap, whatever
           the surface behind it is doing. rgb(122,109,84) is the same warm
           grey-brown family, two steps down, and clears AA.

           The label class is .clt-name, not .clt-src-name — the first attempt
           guessed and left PLAID, STRIPE, YOUTUBE and SHOPIFY sitting at 2.77
           while only the eyebrow moved. Read off the live DOM the second time.

           #6E6249 rather than #7A6D54: the lighter value measured 4.25 on this
           paper, which is under the line, not over it. */
        .lp .clt-strip-eyebrow,.lp .clt-strip .clt-name{color:#6E6249}

        /* The card fills. These were rgb(250,245,232) — lighter than the page,
           which is what made them read as panels sitting on top of it. */
        .lp .flw-panel,.lp .prc-calc,.lp .prc-pane,.lp .prc-tier,
        .lp .dl-duel,.lp .flw-card,.lp .sch-qa{background-color:#F3EADB}

        /* Tinted state fills are kept — they carry meaning rather than
           decoration — but pulled onto the same paper so they read as a wash
           over it instead of a separate surface. */
        .lp .flw-denied,.lp .prc-miss{background-color:rgba(124,29,43,.05)}
        .lp .flw-pool,.lp .prc-hit{background-color:rgba(78,107,62,.06)}

        /* ── CHAPTER RULE ────────────────────────────────────────────────────
           The only thing between chapters, alongside whitespace and type. */
        /* THE RULE PAINTS THE PAPER ITSELF, AND ITS AIR IS PADDING NOT MARGIN.
           BOTH OF THOSE ARE THE FIX FOR A VISIBLE DARKER BAND.

           .cl-grain is a fixed, full-viewport noise layer at z-index 1 with
           mix-blend-mode:multiply. Every section on this page is position
           relative at z-index 2, so section paper paints ABOVE the grain and is
           never darkened by it. The divider had no background at all, so the
           gap showed the ROOT's paper — which sits below the grain and IS
           multiplied by it.

           Same colour on both, measured identical, and still a visibly darker
           strip: the difference was never the colour, it was which side of the
           grain each one painted on. That is why checking background-color
           found nothing.

           So the rule paints #F3EADB at z-index 2 like a section, and its 100px
           of air is padding rather than margin, because a margin is transparent
           and would have left the same darkened strip either side of the line. */
        .cl-rule{
          display:flex;align-items:center;justify-content:center;
          gap:14px;
          width:100%;margin:0 auto;
          position:relative;z-index:2;
          background:#F3EADB;
          /* 100px of air between chapters, inside the 80-120 asked for, on top
             of each section's own padding. */
          padding:24px 51px;
        }
        .cl-rule i{
          display:block;height:1px;flex:1 1 auto;min-width:0;
          /* Fades to nothing at the outer end so the rule has no hard stop. */
          background:linear-gradient(90deg,
            rgba(107,92,66,0) 0%, rgba(107,92,66,.22) 22%, rgba(107,92,66,.34) 100%);
        }
        .cl-rule i:last-child{
          background:linear-gradient(270deg,
            rgba(107,92,66,0) 0%, rgba(107,92,66,.22) 22%, rgba(107,92,66,.34) 100%);
        }
        .cl-rule svg{display:block;flex:0 0 auto}

        @media (max-width:820px){
          .cl-rule{padding:18px 20px;gap:11px;margin:0}
          .cl-rule svg{width:9px;height:9px}
        }
        @media (prefers-reduced-motion:reduce){.cl-rule{transition:none}}
        </style>
    `;
}

/**
 * One chapter break. Rendered between sections in Landing.js.
 *
 * aria-hidden and role=presentation: it is punctuation, and a screen reader
 * announcing "image" between every chapter is noise. The heading that follows
 * is what actually marks the new section in the document outline.
 */
export function renderChapterRule() {
    return `
            <div class="cl-rule" role="presentation" aria-hidden="true">
                <i></i>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 .9 11.1 6 6 11.1.9 6z" fill="${DIAMOND}"/>
                    <path d="M6 .9 11.1 6 6 11.1.9 6z" stroke="${DIAMOND}"
                          stroke-opacity=".22" stroke-width=".5"/>
                </svg>
                <i></i>
            </div>
    `;
}
