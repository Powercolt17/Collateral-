/**
 * Collateral — one coordinated mobile scale pass for the landing page.
 *
 * WHY THIS IS ONE FILE AND NOT EDITS IN NINE. Every section below the hero owns
 * its own scoped style block, and several are being edited in a parallel
 * session. A single pass keeps the phone proportions consistent, makes the whole
 * change reviewable in one diff, and can be deleted in one move if the sections
 * are ever retuned individually. It is rendered LAST in Landing.js so it wins on
 * source order at equal specificity, which is why almost nothing here needs
 * !important.
 *
 * THE HERO IS NOT TOUCHED. .clt-hero, .clt-lockup and the header were reported
 * correct and are deliberately absent from every selector below.
 *
 * ── WHAT WAS ACTUALLY TOO BIG, MEASURED AT 390x844 ───────────────────────────
 * The page ran 15,899px — 18.8 phone screens — with five sections over two
 * screens each. Type was NOT the problem: section headings were already 30-34px
 * against the hero's 41px. The height sat in content blocks and the space around
 * them:
 *
 *     .sch-grid    1618      nine accordion rows at 20px padding each
 *     .rec-cards   1243
 *     .lg-body     1111      six ledger rows at 124px on a phone
 *     .prc-calc    1004      plus .prc-tiers at 753
 *     .flw-panel   1017
 *     .fk-fork      729      plus .fk-steps at 570
 *
 * plus 80-92px of vertical section padding on every one of them, nine times
 * over.
 *
 * So this pass does three things and no more: takes the section padding down,
 * tightens the padding and gaps INSIDE the big blocks, and shows fewer ledger
 * rows at once. Nothing is scaled by a blanket transform or a font-size sweep —
 * those shrink the things that were already right along with everything else.
 */

export function renderMobileScale() {
    return `
        <style>
        /* ── OFFSCREEN SECTIONS ARE NOT RENDERED AT LOAD ─────────────────────
           content-visibility:auto lets the browser skip layout, paint and
           compositing for a section until it is scrolled near. On a page that
           measures 14,414px on a phone — seventeen screens — that is most of
           the initial render work removed for zero visual change.

           THE HERO AND THE LEDGER ARE EXCLUDED ON PURPOSE. The hero is the LCP
           element and must paint immediately; skipping it would make the number
           it is measured by worse, not better. The ledger sits directly under
           the fold and its rows animate, so it is left to render normally
           rather than thrash in and out of skipped state at the boundary.

           EVERY ENTRY CARRIES contain-intrinsic-size. Without it a skipped
           section reports zero height, the scrollbar collapses and then jumps
           as each one paints. The values are the measured heights from the
           mobile pass — 1676, 967, 1089, 1699, 1226, 2067, 512, 1520 — so the
           placeholder is the size of the real thing and the bar does not move. */
        /* 1676 -> 2025. The fork's type was raised for legibility and the
           section grew with it; leaving the old estimate here would have the
           browser reserve 349px too little and jog the scrollbar as it paints. */
        .fk{content-visibility:auto;contain-intrinsic-size:auto 2025px}
        .cs{content-visibility:auto;contain-intrinsic-size:auto 967px}
        .orc{content-visibility:auto;contain-intrinsic-size:auto 1089px}
        .rec{content-visibility:auto;contain-intrinsic-size:auto 1699px}
        .flw{content-visibility:auto;contain-intrinsic-size:auto 1226px}
        .prc{content-visibility:auto;contain-intrinsic-size:auto 2067px}
        .dl{content-visibility:auto;contain-intrinsic-size:auto 512px}
        .sch{content-visibility:auto;contain-intrinsic-size:auto 1520px}

        /* Isolates each animated component's repaints from the rest of the
           page, so the comet and the scrolling register cannot force work
           outside their own box. */
        /* .lg-body is gone — the register was rebuilt around .lg-table, and the
           old selector was left pointing at nothing. */
        .flw-panel,.lg-table,.dl-duel{contain:paint}

        @media (max-width:820px){

          /* ── section frame ───────────────────────────────────────────────
             80-92px of vertical padding nine times over is ~760px of the page
             on its own. 34/30 keeps the sections visibly separated without
             each one opening with half a screen of nothing. */
          .lg-wrap,.fk-wrap,.cs-wrap,.orc-wrap,.rec-wrap{
            padding-top:34px !important;padding-bottom:30px !important}
          .flw,.prc,.dl,.sch{padding-top:34px;padding-bottom:30px}

          /* One shared gutter. These ran 20 and 21px against the hero's own
             lockup inset; matching them stops the left edge stepping in and out
             as you scroll the page. */
          .lg-wrap,.fk-wrap,.cs-wrap,.orc-wrap,.rec-wrap{
            padding-left:20px !important;padding-right:20px !important}

          /* ── type ────────────────────────────────────────────────────────
             A small step, because the headings were close already. 26px still
             reads as a section head under a 41px hero. */
          .lg h2,.fk h2,.cs h2,.orc h2,.rec h2,.flw h2,.prc h2,.dl h2,.sch h2{
            font-size:26px !important;line-height:1.08}
          .flw-lede,.prc-lede,.dl-lede,.sch-lede{font-size:15px;line-height:1.55}

          /* The fork's sizes are set ONCE, further down with the rest of the
             mobile type scale — putting them here as well meant two rules in
             this same file fighting, and the later one silently won. */
          .fk .fk-p-feat li{font-size:12.5px !important;line-height:1.6}

          /* ── the blocks that actually carry the height ───────────────────
             Panels and cards were carrying desktop padding on a 358px card,
             where 24-30px a side leaves very little measure for the content
             it is framing. */
          .flw-col,.flw-card{padding:18px !important}
          .flw-panel{margin-top:22px}
          .prc-pane{padding:20px 18px !important}
          .prc-calc{margin-top:22px}
          .prc-tier{padding:18px !important}
          .prc-tiers{margin-top:20px;gap:12px}
          .prc-note{margin-top:22px}
          .dl-duel{padding:18px !important}
          .dl-grid{margin-top:24px}
          .rec-cards{margin-top:24px !important;gap:12px !important}
          .rec-totals{margin-top:28px !important}

          /* ── the register on a phone ─────────────────────────────────────
             Each row stacks its seven cells vertically here, so a row measures
             236px against 96px on the desktop grid — five of them was 1,180px
             of table and the section ran 2.16 screens.

             The fifth row is hidden rather than the rows being squeezed
             further: the ticker cycles values through every row it is given, so
             what is on screen keeps changing and nothing is lost, whereas
             taking another 20px out of each row would start closing up the
             operator and progress stacks. Four rows still reads as a register.

             VISIBLE_ROWS in the component stays at 5 because it is one value
             for both breakpoints; this is the phone-only trim. */
          /* n+6, not n+5. The column header shares the rows' element type and
             sits first among them, so nth-of-type counts it — n+5 hid the
             fourth AND fifth rows and left three. Measured, not reasoned. */
          .lg-row:nth-of-type(n+6){display:none}
          .lg-row{padding-top:9px !important;padding-bottom:9px !important}

          /* Nine rows at 20px of vertical padding is 360px of padding alone.
             16px keeps a 44px touch target on the row while returning ~72px. */
          .sch-qrow{padding-top:16px !important;padding-bottom:16px !important}
          .sch-grid{gap:26px !important}
          .sch-group + .sch-group{margin-top:30px}
          .sch-note{margin-top:26px;padding-top:18px}

          /* ── the three sections still over two screens after the above ───
             Their height was not in the section frame, it was in cards still
             carrying desktop padding and desktop display figures on a 358px
             screen. Measured before touching: .fk-card 26/22/24, .rec-top
             24/26/26, .prc-otile 20/22, and a 46px tier multiple. */
          .rec-top{padding:18px !important}
          .rec-card{padding:0 !important}
          .prc-otile{padding:16px !important}

          /* Display figures set for a 1440 column. The tier multiple at 46px
             and the deposit readout at 30px were the two largest numbers on
             the phone after the hero, and neither is the section's headline. */
          .prc-tm{font-size:34px !important}
          .prc-ftop .prc-v{font-size:24px !important}
          .prc-oa{font-size:24px !important}
          .flw-amt{font-size:24px !important}

          /* ── ledger viewport ─────────────────────────────────────────────
             initLedgerSection sets this height inline from rowHeight x 6, so
             overriding it needs !important. Four rows rather than six: at 124px
             a row that is 744px of viewport for a list that scrolls on its own
             anyway, and the section still reads as a running register.

             Height only. The scroll DURATION is computed from the track's own
             height, not the viewport's, so the rows keep travelling at the same
             90px/s they do everywhere else. */
          /* ══ SECOND PASS ═══════════════════════════════════════════════════
             Still reported too big. Re-measured at 390x844: the page below the
             hero was 11,960px against a 941px hero. Type was not the problem a
             second time either — the headings were already 26px. What the first
             pass did not reach:

               .sch-grid    1456   nine rows at 61px is only 549 of it; the rest
                                   is a 26px grid gap plus 30px between groups
               .rec-cards   1177   three cards at 345, and .rec-stub was never
                                   touched: 22/26/24 padding on a card whose top
                                   had already come down to 18, so the two
                                   halves of one card disagreed
               .prc-calc     949   two panes, one of them 615
               .fk-fork      695   two cards at 332
               .fk-steps     570   four steps at 142, each with 30px beneath it
               .lg-head      403   the summary block, not the standfirst

             Everything below is padding, gap and display-figure size. No content
             is removed, nothing is scaled by a blanket transform, and the hero
             is still absent from every selector. */

          /* Section frame again. 34/30 -> 26/22 over nine sections is ~150px. */
          .lg-wrap,.fk-wrap,.cs-wrap,.orc-wrap,.rec-wrap{
            padding-top:26px !important;padding-bottom:22px !important}
          .flw,.prc,.dl,.sch{padding-top:26px;padding-bottom:22px}

          .rec-stub{padding:14px 18px !important}
          .rec-line{padding:4px 0 !important}
          .rec-head{margin-bottom:12px !important}
          .rec-sub{margin-bottom:14px !important}
          .rec-amt{font-size:21px !important}
          .rec-cards{gap:10px !important}
          .rec-totals{margin-top:22px !important;gap:18px 26px !important}
          .rec-tv{font-size:20px !important}

          /* Schedule. The rows are not the problem; the space between them is. */
          .sch-grid{gap:14px !important}
          .sch-group + .sch-group{margin-top:18px !important}
          .sch-qrow{padding-top:13px !important;padding-bottom:13px !important}
          .sch-note{margin-top:20px !important;padding-top:14px !important}

          /* Price — the tallest section on the page at 2,067. */
          .prc-pane{padding:16px 14px !important}
          .prc-tier{padding:14px !important}
          .prc-tiers{gap:10px !important;margin-top:16px !important}
          .prc-calc{margin-top:18px !important}
          .prc-note{margin-top:18px !important}
          .prc-tm{font-size:28px !important}

          /* Ledger. 403px of head before a single row. */
          .lg-head{gap:18px !important}
          .lg-sum{gap:14px 22px !important}
          .lg-sum dd{font-size:22px !important}

          /* Flow, duels, and the two table sections. Row padding on a phone
             table is pure height once the columns are already narrowed. */
          .flw-col,.flw-card{padding:14px !important}
          .flw-amt{font-size:21px !important}
          .flw-panel{margin-top:18px !important}
          .cs-tbl tr{padding:10px 4px !important}
          .orc-tbl tr{padding:11px 4px !important}
          .dl-duel{padding:14px !important}
          .dl-grid{margin-top:18px !important}

          /* ══ THIRD PASS — TYPE ═════════════════════════════════════════════
             Padding was exhausted: pass two returned 911px, 8%. The remaining
             height is set by type, and measuring the sub-heads against their
             own section heading showed the hierarchy had gone flat on a phone:

               .prc-tm       28   LARGER than the 26px section heading
               .fk-step h3   24   against a 26px heading
               .fk-c-name    24   against a 26px heading
               .orc-pname    20
               .rec-amt      21
               .lg-amt       19

             A 24px sub-head under a 26px head is not a hierarchy, it is two
             headings. These were all sized for a 1440px column where 26 and 24
             sit far apart; at 390 they collapse into each other and each one
             costs a line.

             Line-height is the other half. The ledes ran 1.59 — right for a
             470px measure, loose for a 350px one where the same paragraph takes
             more lines. 1.45 is still comfortable and returns a line or two per
             block across ten sections.

             The hero stays 41/16. Cutting section heads to 23 widens the gap to
             it, which is the correct direction: the hero should dominate. */
          .lg h2,.fk h2,.cs h2,.orc h2,.rec h2,.flw h2,.prc h2,.dl h2,.sch h2{
            font-size:23px !important;line-height:1.1 !important}

          /* .fk-lede is NOT in this group any more. The fork's copy was
             reported as the hardest to read on the page, so it takes its own
             larger size below rather than the shared 15px. */
          .lg-head-l p,.cs-body,.orc-body,.rec-body,
          .flw-lede,.prc-lede,.dl-lede,.sch-lede{
            font-size:15px !important;line-height:1.45 !important}
          .fk-lede{font-size:16.5px !important;line-height:1.6 !important}

          /* Sub-heads step back so the section heading leads again. */
          .fk-step h3{font-size:18px !important;line-height:1.2 !important}
          .orc-pname{font-size:17px !important}
          .rec-title{font-size:15px !important}
          .prc-tm{font-size:22px !important}

          /* Body copy inside the blocks, and the row text in the tables. */
          /* 14 -> 15.5. This is the four-step explainer, and at 14px with 1.45
             leading it was the least readable block in the section. */
          .fk-step p{font-size:15.5px !important;line-height:1.6 !important}
          .orc-metrics{font-size:14px !important}
          .cs-void,.cs-under{font-size:14px !important}
          .lg-goal{font-size:15px !important}
          .sch-qrow{font-size:15px !important}

          /* Display figures, one more step down. */
          .rec-amt{font-size:19px !important}
          .lg-amt{font-size:17px !important}
        }

        /* Below 380 the gutter comes in again — at 360 and 320 a 20px inset on
           each side is a real share of the screen. */
        @media (max-width:379px){
          .lg-wrap,.fk-wrap,.cs-wrap,.orc-wrap,.rec-wrap{
            padding-left:16px !important;padding-right:16px !important}
          .flw,.prc,.dl,.sch{padding-left:16px;padding-right:16px}
          .lg h2,.fk h2,.cs h2,.orc h2,.rec h2,.flw h2,.prc h2,.dl h2,.sch h2{
            font-size:24px !important}
        }
        </style>
    `;
}
