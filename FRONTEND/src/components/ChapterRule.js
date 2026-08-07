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
        .lp .clt,.lp .clt-hero,.lp .lg,.lp .fk,.lp .cs,.lp .orc,.lp .rec,
        .lp .flw,.lp .prc,.lp .dl,.lp .sch{background-color:#F3EADB}

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

        /* ── THE ONE DELIBERATE EXCEPTION TO THE SINGLE PAPER ────────────────
           The oracle band under the hero, #EBE0C6: a hair deeper and warmer
           than the page. Everything else on this page is one paper on purpose,
           and this is the single strip that is allowed not to be.

           It is not a leftover panel. The band already carries a 1px hairline
           on both edges, so with a slightly deeper ground it reads as a struck
           seal-of-authenticity strip rather than as another stacked section —
           the same way a printed instrument tints the block that carries its
           attestations. Warmer rather than merely darker, which is what takes
           the green cast off it.

           It is .clt-strip, INSIDE the hero wrapper, not .orc. .orc is the
           802px oracle register further down the page and is untouched. */
        .lp .clt-strip{background-color:#EBE0C6}

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
          padding:50px 51px;
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
          .cl-rule{padding:34px 20px;gap:11px;margin:0}
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
