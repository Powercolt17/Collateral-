// RivalryDetail.js — /rivalry/:id
//
// A spectator view of one head-to-head duel, in the same wine-and-cream
// ledger system as the market board.
//
// EVERY FIGURE ON THIS PAGE IS DERIVED FROM THE CONTRACT OR THE ORACLE.
// The record carries baselines, per-side percentage deltas, the growth
// target and a full verification series, so the standings, the chart, the
// countdown and the event log are all reads. Two things the previous version
// printed are gone rather than kept:
//
//   - THE WIN-PROBABILITY BAR. It was computed as
//         50 + (challengerGrowth - opponentGrowth) * 4, clamped to 10..90
//     and labelled "MODEL ESTIMATE". There is no model — that is a straight
//     line through the current margin with an arbitrary slope, and no part of
//     the backend produces or records it. On a page whose whole claim is
//     "verified at the source", a made-up probability next to real oracle
//     readings is the most expensive thing that could be on it. The lead
//     margin it was derived from IS real and is stated plainly instead.
//
//   - "ORACLE · EVERY 6H" as a constant. The cadence is measured from the
//     gaps between actual verifications.
//
// Tokens are scoped to .rv for the same reason the board's are scoped to .mb:
// declaring --paper/--ink on :root would silently repaint every other view.

import api from '../api.js';
import { showAlert, showConfirm } from '../modal.js';
import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderRivalryDetail() {
    return `
        <style>
            /* FULL BLEED, AND BEHIND THE HEADER.
               #app carries pt-24 (96px) to clear the fixed masthead, so a
               section that simply paints its own background stops at the top of
               the content and leaves the header sitting on the near-white
               --bg-page above a tan page. Pulling up by that 96 and padding it
               back is how /market already does it, so the two routes join
               under the same header without a seam. */
            .rv-page {
                background: #F1E8D3;
                min-height: 100vh;
                box-sizing: border-box;
                margin-top: -96px;
                /* 90, not 96: #app reserves 96 for a masthead that measures a
                   little under it, so the last few pixels were dead air rather
                   than clearance. The opening loses ~50px between the nav and
                   the eyebrow without the content ever tucking under. */
                padding-top: 90px;
                padding-bottom: 80px;
            }
            .rv {
                /* The same field the market board uses, so moving between the
                   two is one continuous sheet of paper. */
                --rv-parch: #F1E8D3;
                --rv-paper: #F5EDDA;
                --rv-paper2: #FAF4E6;
                --rv-ink: #211B12;
                --rv-ink-soft: #574E3D;
                /* MEASURED, NOT PICKED. The reference's #7A6E52 lands at 4.12:1
                   on this cream — under the 4.5 floor — and it carries every
                   label, timestamp and status on the page. #695F47 is the same
                   hue walked down until it clears on both grounds used here:
                   5.17 on parchment, 5.41 on card paper. */
                --rv-muted: #63593F;
                /* Was #8A7C5E, which sat at about 3.4:1 on this cream and
                   carried axis labels, tick values and the seal-line captions.
                   Still clearly secondary, now legible. */
                --rv-faint: #7A6C4E;
                --rv-ox: #7C1D2B;
                --rv-ox-deep: #5E1420;
                --rv-win: #4E6B3E;
                --rv-line: rgba(70,55,35,.18);
                --rv-line-soft: rgba(70,55,35,.10);
                --rv-line-firm: rgba(70,55,35,.28);
                --rv-wintint: rgba(78,107,62,.08);
                --rv-oxtint: rgba(124,29,43,.06);
                --rv-gutter: clamp(20px, 5vw, 60px);
                position: relative;
                max-width: 1160px;
                margin: 0 auto;
                padding: 4px var(--rv-gutter) 20px;
                font-family: "EB Garamond", Georgia, serif;
                color: var(--rv-ink);
                -webkit-font-smoothing: antialiased;
            }
            /* The ledger ruling, the same 3% warm grey the board uses. It rides
               on the full-bleed field rather than the column so the lines run
               edge to edge instead of stopping at 1160px. */
            .rv-page::before {
                content: "";
                position: absolute; inset: 0;
                pointer-events: none; z-index: 0;
                background: repeating-linear-gradient(0deg, transparent 0 29px, rgba(70,55,35,.03) 29px 30px);
            }
            .rv-page { position: relative; }
            .rv > * { position: relative; z-index: 1; }
            .rv-mono { font-family: var(--mono, 'IBM Plex Mono', monospace); }

            .rv-mark {
                width: 8px; height: 8px; background: var(--rv-ox-deep);
                transform: rotate(45deg); display: inline-block; flex: none;
            }
            .rv-livedot {
                width: 8px; height: 8px; border-radius: 50%; background: var(--rv-win);
                display: inline-block; flex: none; box-shadow: 0 0 0 3px rgba(78,107,62,.18);
            }
            .rv-livedot.ox { background: var(--rv-ox); box-shadow: 0 0 0 3px rgba(124,29,43,.16); }
            .rv-livedot.mut { background: var(--rv-faint); box-shadow: none; }
            /* Screen-reader text for marks that are otherwise a glyph alone. */
            .rv-sr {
                position: absolute; width: 1px; height: 1px;
                overflow: hidden; clip-path: inset(50%); white-space: nowrap;
            }

            /* ---- header ---- */
            .rv-kick {
                display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .28em; text-transform: uppercase;
                color: var(--rv-ox); font-weight: 500; margin-bottom: 16px;
            }
            .rv-kick .r { height: 1px; width: 28px; background: var(--rv-ox); opacity: .75; }
            .rv-kick .st { display: inline-flex; align-items: center; gap: 7px; color: var(--rv-win); }
            .rv-kick .st.ox { color: var(--rv-ox); }
            .rv-kick .st.mut { color: var(--rv-muted); }

            /* The pool reads as part of the matchup rather than as something
               parked at the far edge: the left block is allowed to grow, so on
               a wide screen the two are separated by one deliberate gap instead
               of by however much room happened to be left over. */
            .rv-head {
                display: flex; align-items: flex-start; justify-content: space-between;
                gap: 28px; flex-wrap: wrap;
                padding-bottom: 20px; border-bottom: 1px solid var(--rv-line-firm);
            }
            .rv-head-left { flex: 1 1 auto; min-width: 0; }
            .rv-matchup { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
            /* The handles are IDENTITIES, so they are set in the mono face the
               rest of the site uses for identity and data, never the display
               serif — the serif is for the figures. */
            .rv-mh {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: clamp(21px, 3vw, 31px); font-weight: 500; letter-spacing: .01em; line-height: 1;
            }
            .rv-mh.lead { color: var(--rv-win); }
            .rv-mh.trail { color: var(--rv-ox); }
            .rv-mh.even { color: var(--rv-ink); }
            .rv-vsd { display: flex; flex-direction: column; align-items: center; gap: 5px; }
            .rv-vsd .d { width: 8px; height: 8px; background: var(--rv-ox-deep); transform: rotate(45deg); }
            .rv-vsd span { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: .2em; color: var(--rv-muted); }
            .rv-sub {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .1em; color: var(--rv-muted); margin-top: 12px;
            }
            /* max-width caps how far the figure can drift from the names it
               belongs to; margin-top lifts the eyebrow onto the matchup's line
               rather than leaving it floating above one. */
            .rv-pool { text-align: right; flex: 0 0 auto; max-width: 260px; margin-top: 2px; }
            .rv-pool .k { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--rv-muted); }
            .rv-pool .v { font-family: "Cormorant Garamond", Georgia, serif; font-size: clamp(34px, 4.4vw, 46px); font-weight: 600; line-height: 1; margin-top: 6px; }
            .rv-pool .s { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .06em; color: var(--rv-muted); margin-top: 6px; }

            /* ---- facts register ----
               METADATA ONLY. "Current leader" deliberately does not appear
               here: the duel below states it, and a page that answers "who is
               winning" in three places will eventually answer it three
               different ways. */
            .rv-facts {
                display: grid; grid-template-columns: repeat(4, 1fr);
                border: 1px solid var(--rv-line); margin: 20px 0 8px; background: var(--rv-paper2);
            }
            .rv-fact { padding: 13px 20px; border-left: 1px solid var(--rv-line-soft); min-width: 0; }
            .rv-fact:first-child { border-left: 0; }
            .rv-fact .k {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
                color: var(--rv-muted); margin-bottom: 7px;
            }
            .rv-fact .v {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 14px; letter-spacing: .02em; color: var(--rv-ink); font-weight: 500;
                display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
            }
            /* THIS is where the contract's status lives, so the dot that says
               "still moving" lives here too — restrained, the same oxblood as
               the rest of the page, no warning colour. */
            .rv-fact .v .rv-livedot.beat { animation: rv-blink 2200ms ease-in-out infinite; }
            .rv-fact .v.win { color: var(--rv-win); }
            .rv-fact .v.ox { color: var(--rv-ox); }

            /* ---- section heads ---- */
            /* 30/18, down from 44/20 — the sections were reading as separate
               pages rather than as parts of one document. */
            .rv-shead { display: flex; align-items: center; gap: 20px; margin: 30px 0 18px; }
            .rv-shead.hero { margin-top: 26px; }
            .rv-shead .lab {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .26em; text-transform: uppercase;
                color: var(--rv-ox); font-weight: 500; white-space: nowrap;
                display: flex; align-items: center; gap: 11px;
            }
            /* The rule starts AFTER the label rather than under it: a
               letterspaced label whose last character sits on a hairline is the
               kind of collision that reads as a bug. */
            .rv-shead .ln { flex: 1; height: 1px; min-width: 24px; background: linear-gradient(90deg, var(--rv-line-firm), var(--rv-line-soft)); }
            .rv-shead .rt {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--rv-muted);
                white-space: nowrap;
            }

            /* ---- the duel, which is the page ---- */
            .rv-duelbox {
                border: 1px solid var(--rv-line-firm); background: var(--rv-paper);
                box-shadow: 0 22px 48px rgba(60,40,20,.10); padding: 28px 30px 24px;
            }
            .rv-leadby {
                text-align: center; font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
                color: var(--rv-muted); padding-bottom: 4px;
            }
            .rv-leadby b { font-weight: 600; }
            .rv-leadby b.win { color: var(--rv-win); }
            .rv-leadby b.ox { color: var(--rv-ox); }

            .rv-duel { display: grid; grid-template-columns: 1fr 96px 1fr; align-items: stretch; margin-top: 20px; }
            .rv-side {
                position: relative; background: var(--rv-paper2);
                border: 1px solid var(--rv-line-firm); padding: 26px 28px; min-width: 0;
            }
            .rv-side.lead { border-top: 3px solid var(--rv-win); }
            .rv-side.trail { border-top: 3px solid var(--rv-ox); }
            .rv-side.even { border-top: 3px solid var(--rv-line-firm); }
            .rv-side .reg { position: absolute; width: 11px; height: 11px; border: 1.2px solid var(--rv-faint); opacity: .8; }
            .rv-side .reg.bl { bottom: 12px; left: 12px; border-right: 0; border-top: 0; }
            .rv-s-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
            .rv-s-role { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--rv-muted); }
            .rv-s-badge {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 500;
                padding: 4px 11px; white-space: nowrap;
            }
            .rv-s-badge.lead { color: var(--rv-win); background: var(--rv-wintint); border: 1px solid rgba(78,107,62,.4); }
            .rv-s-badge.trail { color: var(--rv-ox); background: var(--rv-oxtint); border: 1px solid rgba(124,29,43,.4); }
            .rv-s-badge.even { color: var(--rv-muted); border: 1px solid var(--rv-line-firm); }
            .rv-s-name { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 20px; font-weight: 500; margin-bottom: 6px; color: var(--rv-ink); overflow-wrap: anywhere; }
            .rv-s-pct { font-family: "Cormorant Garamond", Georgia, serif; font-size: clamp(46px, 6vw, 66px); font-weight: 600; line-height: .92; letter-spacing: -.01em; }
            .rv-s-pct.win { color: var(--rv-win); }
            .rv-s-pct.los { color: var(--rv-ox); }
            .rv-s-pct.mut { color: var(--rv-muted); }
            .rv-s-delta { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .04em; color: var(--rv-muted); margin-top: 9px; }
            .rv-s-delta .up { color: var(--rv-win); }
            .rv-s-delta .dn { color: var(--rv-ox); }
            .rv-s-metrics { display: flex; justify-content: space-between; gap: 16px; margin: 22px 0 12px; padding-top: 16px; border-top: 1px solid var(--rv-line-soft); }
            .rv-s-metrics .m { min-width: 0; }
            .rv-s-metrics .m .mk { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--rv-muted); margin-bottom: 5px; }
            .rv-s-metrics .m .mv { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 15px; color: var(--rv-ink); font-weight: 500; }
            .rv-s-metrics .m.r { text-align: right; }
            .rv-s-metrics .m.r .mv { color: var(--rv-ox); }
            .rv-s-prog { height: 6px; background: rgba(70,55,35,.1); overflow: hidden; margin-bottom: 13px; }
            .rv-s-prog .f { height: 100%; transition: width 180ms ease; }
            .rv-side.lead .rv-s-prog .f { background: var(--rv-win); }
            .rv-side.trail .rv-s-prog .f { background: var(--rv-ox); }
            .rv-side.even .rv-s-prog .f { background: var(--rv-muted); }
            .rv-s-tag {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--rv-muted);
                display: inline-flex; align-items: center; gap: 7px;
            }
            .rv-s-tag .d { width: 5px; height: 5px; border-radius: 50%; background: var(--rv-faint); flex: none; }
            .rv-vscol { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 0 6px; }
            .rv-vscol .m { width: 10px; height: 10px; background: var(--rv-ox-deep); transform: rotate(45deg); }
            .rv-vscol .vt { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: .2em; color: var(--rv-muted); }
            /* One line about the money, under both panels — not repeated inside
               each one, where it read as two different facts. */
            .rv-escrow {
                text-align: center; font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--rv-muted);
                margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
            }
            .rv-escrow.paid { color: var(--rv-win); }
            .rv-escrow .hash { color: var(--rv-faint); letter-spacing: .04em; overflow-wrap: anywhere; }

            /* ---- chart ---- */
            .rv-chartcard { border: 1px solid var(--rv-line-firm); background: var(--rv-paper); padding: 22px 26px 18px; box-shadow: 0 10px 24px rgba(60,40,20,.05); }
            .rv-chart-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
            .rv-legend { display: flex; gap: 20px; flex-wrap: wrap; }
            .rv-lg { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--rv-ink-soft); }
            .rv-lg .sw { width: 14px; height: 3px; flex: none; }
            .rv-lg .sw.g { background: var(--rv-win); }
            .rv-lg .sw.o { background: var(--rv-ox); }
            /* SCROLLS RATHER THAN SHRINKS. Squeezing the plot below about 640
               takes the axis labels under the legibility floor; the reader can
               push it sideways instead. */
            .rv-chart-scroll { overflow-x: auto; position: relative; }
            .rv-chart { display: block; width: 100%; min-width: 640px; height: auto; }
            .rv-chart .hit { fill: transparent; cursor: crosshair; }
            /* The crosshair and the two read-out dots are hidden until the
               pointer is actually over the plot, so a static screenshot of this
               page shows the series and nothing else. */
            .rv-cross { opacity: 0; transition: opacity 140ms ease; pointer-events: none; }
            .rv-chart-scroll.on .rv-cross { opacity: 1; }
            /* The live end-dots breathe, because the series behind them is
               still being written. */
            @keyframes rv-pulse {
                0%   { r: 7; opacity: .38; }
                70%  { r: 13; opacity: 0; }
                100% { r: 13; opacity: 0; }
            }
            .rv-halo { animation: rv-pulse 2600ms ease-out infinite; transform-origin: center; }
            .rv-tip {
                position: absolute; top: 12px; pointer-events: none;
                background: var(--rv-paper2); border: 1px solid var(--rv-line-firm);
                box-shadow: 0 10px 24px rgba(60,40,20,.14);
                padding: 10px 13px; min-width: 172px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                opacity: 0; transform: translateY(-3px);
                transition: opacity 140ms ease, transform 140ms ease;
            }
            .rv-chart-scroll.on .rv-tip { opacity: 1; transform: none; }
            .rv-tip .when { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--rv-muted); margin-bottom: 7px; }
            .rv-tip .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; font-size: 12px; color: var(--rv-ink-soft); padding: 2px 0; }
            .rv-tip .row .sw { width: 10px; height: 3px; flex: none; margin-right: 7px; }
            .rv-tip .row .sw.g { background: var(--rv-win); }
            .rv-tip .row .sw.o { background: var(--rv-ox); }
            .rv-tip .row b { color: var(--rv-ink); }
            .rv-tip .mg { margin-top: 7px; padding-top: 7px; border-top: 1px solid var(--rv-line-soft); font-size: 12px; color: var(--rv-muted); }
            .rv-livechip {
                display: inline-flex; align-items: center; gap: 8px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--rv-win);
            }
            .rv-livechip .p { width: 6px; height: 6px; border-radius: 50%; background: var(--rv-win); flex: none; animation: rv-blink 2200ms ease-in-out infinite; }
            @keyframes rv-blink { 0%,100% { opacity: 1; } 50% { opacity: .28; } }
            .rv-chart-empty {
                padding: 44px 8px; text-align: center; color: var(--rv-muted);
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
            }

            /* ---- oracle log ---- */
            .rv-olog { display: flex; flex-direction: column; gap: 10px; }
            .rv-oev { border: 1px solid rgba(78,107,62,.5); background: var(--rv-paper2); padding: 16px 20px; box-shadow: 0 0 0 1px rgba(78,107,62,.1); }
            .rv-oev-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
            .rv-oev-title { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .08em; color: var(--rv-ink); font-weight: 500; display: inline-flex; align-items: center; gap: 9px; }
            .rv-oev-time { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--rv-muted); }
            .rv-oev-body { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; line-height: 1.8; color: var(--rv-ink-soft); }
            .rv-oev-body .ar { color: var(--rv-muted); }
            .rv-oev-body b.win { color: var(--rv-win); }
            .rv-oev-body b.ox { color: var(--rv-ox); }
            .rv-oev-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--rv-line-soft); }
            .rv-oev-margin { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--rv-muted); }
            .rv-oev-status { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 500; color: var(--rv-win); display: inline-flex; align-items: center; gap: 7px; }
            /* 176px, because the stamp now carries the date as well as the
               clock — at 88 every row wrapped onto two lines. */
            .rv-oevc { display: grid; grid-template-columns: 176px 1fr max-content; align-items: center; gap: 20px; border: 1px solid var(--rv-line); background: var(--rv-paper2); padding: 13px 20px; }
            .rv-oevc .t { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--rv-muted); }
            .rv-oevc .d { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; color: var(--rv-ink-soft); overflow-wrap: anywhere; }
            .rv-oevc .d b { color: var(--rv-ink); }
            .rv-oevc .s { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--rv-win); white-space: nowrap; }
            .rv-oevc.secure .s { color: var(--rv-ox); }
            .rv-oevc.settle .s { color: var(--rv-ox); }
            /* The log opens on the latest reading plus three; the rest are in
               the DOM from the start, so opening them is a state change and not
               a fetch. grid-template-rows animates because the number of hidden
               rows is not known at author time. */
            .rv-more {
                display: grid; grid-template-rows: 0fr;
                transition: grid-template-rows 200ms ease, opacity 200ms ease;
                opacity: 0;
            }
            .rv-more > div { overflow: hidden; display: flex; flex-direction: column; gap: 10px; }
            .rv-olog.open .rv-more { grid-template-rows: 1fr; opacity: 1; }
            .rv-olog.open .rv-more > div { padding-top: 10px; }
            .rv-toggle {
                align-self: center; margin-top: 4px;
                min-height: 44px; padding: 12px 22px;
                background: none; border: 1px solid var(--rv-line-firm); cursor: pointer;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
                color: var(--rv-ink-soft);
                transition: background 160ms ease, color 160ms ease;
            }
            .rv-toggle:hover { background: rgba(70,55,35,.05); color: var(--rv-ink); }

            /* ---- actions (pre-active states keep their controls) ---- */
            .rv-actions {
                display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
                margin-top: 24px; padding: 18px 22px;
                border: 1px solid var(--rv-line-firm); background: var(--rv-paper);
            }
            .rv-abtn {
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
                padding: 13px 24px; border: 0; cursor: pointer;
                transition: background 160ms ease, transform 140ms ease;
            }
            .rv-abtn.accept, .rv-abtn.fund { background: var(--rv-ox); color: #F6EEDD; box-shadow: 0 12px 26px rgba(94,20,32,.2); }
            .rv-abtn.accept:hover, .rv-abtn.fund:hover { background: var(--rv-ox-deep); transform: translateY(-1px); }
            .rv-abtn.accept:active, .rv-abtn.fund:active { transform: none; }
            .rv-abtn.decline { background: none; color: var(--rv-ink-soft); border: 1px solid var(--rv-line-firm); }
            .rv-abtn.decline:hover { background: rgba(70,55,35,.06); }
            .rv-abtn[disabled] { opacity: .45; cursor: not-allowed; transform: none; }
            .rv-astatus { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--rv-muted); }

            /* ---- footer ---- */
            /* THE CONCLUDING MOMENT. A 2px oxblood rule across the top gives it
               the weight of a closing statement without a filled banner —
               nothing here should read as a celebration while the result is
               still awaiting its final verification. */
            .rv-foot {
                margin-top: 32px; display: flex; align-items: center; justify-content: space-between;
                gap: 28px; flex-wrap: wrap; padding: 26px 30px;
                border: 1px solid var(--rv-line-firm); border-top: 2px solid var(--rv-ox);
                background: var(--rv-paper);
            }
            .rv-foot .t { font-family: "Cormorant Garamond", Georgia, serif; font-size: 25px; font-weight: 600; line-height: 1.1; }
            .rv-foot .s { font-family: var(--mono, 'IBM Plex Mono', monospace); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--rv-muted); margin-top: 8px; }
            .rv-foot .seal { width: 55px; height: 55px; flex: none; align-self: center; }
            .rv-foot .seal svg { display: block; width: 100%; height: 100%; }
            .rv-back {
                display: inline-flex; align-items: center; gap: 9px; margin-top: 26px;
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
                color: var(--rv-muted); background: none; border: 0; cursor: pointer;
            }
            .rv-back:hover { color: var(--rv-ox); }
            .rv-notice {
                padding: 60px 8px; text-align: center; color: var(--rv-muted);
                font-family: var(--mono, 'IBM Plex Mono', monospace);
                font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
            }

            .rv a:focus-visible, .rv button:focus-visible { outline: 2px solid var(--rv-ox); outline-offset: 2px; }

            /* ---- responsive ---- */
            @media (max-width: 900px) {
                .rv-facts { grid-template-columns: repeat(2, 1fr); }
                .rv-fact:nth-child(3) { border-left: 0; }
                .rv-fact:nth-child(n+3) { border-top: 1px solid var(--rv-line-soft); }
                .rv-s-metrics { flex-direction: column; gap: 12px; }
                .rv-s-metrics .m.r { text-align: left; }
                /* The pool drops under the matchup and reads left-to-right with
                   it, rather than staying right-aligned against nothing. */
                .rv-head { flex-direction: column; gap: 16px; }
                .rv-pool { text-align: left; max-width: none; margin-top: 0; }
            }
            @media (max-width: 760px) {
                /* The two panels stack and the VS column becomes a rule between
                   them — a 96px gutter with a diamond in it is a desktop idea. */
                .rv-duel { grid-template-columns: 1fr; }
                .rv-vscol { flex-direction: row; gap: 14px; padding: 14px 0; }
                .rv-vscol::before, .rv-vscol::after { content: ""; flex: 1; height: 1px; background: var(--rv-line-firm); }
                .rv-head { gap: 22px; }
                .rv-pool { text-align: left; }
                .rv-oevc { grid-template-columns: 1fr; gap: 8px; }
                .rv-duelbox { padding: 20px 18px 18px; }
                .rv-chartcard { padding: 18px 16px 14px; }
            }
            @media (prefers-reduced-motion: reduce) {
                .rv-abtn, .rv-s-prog .f, .rv-cross, .rv-tip { transition: none; }
                .rv-abtn.accept:hover, .rv-abtn.fund:hover { transform: none; }
                /* The halo and the blink are ambience; the crosshair is not, so
                   it keeps working while these stop. */
                .rv-halo, .rv-livechip .p { animation: none; }
                .rv-halo { opacity: 0; }
            }
        </style>

        <div class="rv-page">
            <div class="rv" id="rvd-container">
                ${collateralFullLoader('Loading rivalry…')}
            </div>
        </div>
    `;
}

export async function initRivalryDetail(params) {
    const container = document.getElementById('rvd-container');
    if (!container) return;

    const id = params?.id || window.location.pathname.split('/rivalry/')[1] || '';

    if (window._rvdCdInterval) { clearInterval(window._rvdCdInterval); window._rvdCdInterval = null; }
    if (window._rvdPoll) { clearInterval(window._rvdPoll); window._rvdPoll = null; }

    const reduceMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const METRIC_LABELS = {
        REVENUE: 'Revenue Growth', MRR: 'Recurring Revenue', FOLLOWERS: 'Follower Growth',
        SUBSCRIBERS: 'Subscriber Growth', VIEWS: 'Views Growth', IMPRESSIONS: 'Impression Growth',
        GROSS_SALES: 'Sales Growth', ORDER_COUNT: 'Order Growth', CHARGE_VOLUME: 'Charge Volume',
        NET_INCOME_DEPOSITS: 'Income Received',
    };
    const MONETARY = ['REVENUE', 'MRR', 'GROSS_SALES', 'CHARGE_VOLUME', 'NET_INCOME_DEPOSITS'];
    const UNIT_NOUN = {
        REVENUE: 'revenue', MRR: 'MRR', GROSS_SALES: 'sales', CHARGE_VOLUME: 'volume',
        NET_INCOME_DEPOSITS: 'received', FOLLOWERS: 'followers', SUBSCRIBERS: 'subscribers',
        VIEWS: 'views', IMPRESSIONS: 'impressions', ORDER_COUNT: 'orders',
    };

    // ── tiny DOM helpers; every value goes in as text, never as markup ──
    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    };
    const svgEl = (tag, attrs) => {
        const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attrs || {}).forEach(k => n.setAttribute(k, String(attrs[k])));
        return n;
    };
    /** A ✓ is decoration; the word beside it is what gets read out. */
    const withMark = (parent, word, glyph) => {
        parent.appendChild(document.createTextNode(word + ' '));
        const g = el('span', null, glyph);
        g.setAttribute('aria-hidden', 'true');
        parent.appendChild(g);
        return parent;
    };

    const pad2 = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) { return '—'; }
    };
    const fmtClock = (d) => {
        try {
            const t = new Date(d);
            return pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ':' + pad2(t.getSeconds());
        } catch (e) { return '—'; }
    };
    /* DATE AND CLOCK, because the cadence is daily. Printing the time alone
       gave every row in the log the identical stamp — eight verifications that
       all read 15:10:46 and looked like one event repeated. */
    const fmtStamp = (d) => fmtDate(d) + ' · ' + fmtClock(d);
    const ago = (d) => {
        const ms = Date.now() - new Date(d).getTime();
        if (!isFinite(ms) || ms < 0) return '';
        const h = Math.floor(ms / 3600000);
        if (h < 1) return Math.max(1, Math.floor(ms / 60000)) + 'm ago';
        if (h < 48) return h + 'h ago';
        return Math.floor(h / 24) + 'd ago';
    };
    const pct2 = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%';

    // ═══════════════════════════════════════════════════════════════════
    // Fetch. The contract and its verification series are two reads and
    // neither blocks the other; a dead metrics endpoint costs the chart and
    // the log, not the page.
    // ═══════════════════════════════════════════════════════════════════
    let raw = null;
    let series = [];
    const [rRes, mRes] = await Promise.allSettled([
        api.getRivalry(id),
        api.getRivalryMetrics(id),
    ]);
    if (rRes.status === 'fulfilled' && rRes.value && rRes.value.rivalry) raw = rRes.value.rivalry;
    if (mRes.status === 'fulfilled' && mRes.value && Array.isArray(mRes.value.metrics)) series = mRes.value.metrics;

    if (!raw) {
        container.innerHTML = '';
        const n = el('div', 'rv-notice', 'Rivalry not found');
        container.appendChild(n);
        const back = el('button', 'rv-back', '← Back to the market');
        back.type = 'button';
        back.addEventListener('click', () => window.router && window.router.navigate('/market'));
        container.appendChild(back);
        return;
    }

    /* ── the derived model ───────────────────────────────────────────────
       Everything the page prints comes out of here, and everything here
       comes out of the record or the oracle series. */
    function build(r, metrics) {
        const parts = r.participants || [];
        const chall = parts.find(p => p.role === 'challenger') || {};
        const opp = parts.find(p => p.role === 'opponent') || {};
        const metricType = r.metricType || 'REVENUE';
        const monetary = MONETARY.indexOf(metricType) !== -1;
        const targetPct = parseFloat(r.targetGrowthPct || 0) || 0;
        const meta = r.settlementMetadata || {};

        const fmtVal = (v) => {
            if (v == null || !isFinite(v)) return '—';
            return monetary
                ? '$' + Math.round(v / 100).toLocaleString('en-US')
                : Math.round(v).toLocaleString('en-US');
        };

        // one entry per verification instant, both sides together
        const byTime = new Map();
        metrics.forEach((m) => {
            const t = new Date(m.fetchedAt).getTime();
            if (!isFinite(t)) return;
            if (!byTime.has(t)) byTime.set(t, {});
            byTime.get(t)[m.userId] = Number(m.metricValue);
        });
        const stamps = Array.from(byTime.keys()).sort((a, b) => a - b);

        const sideOf = (part, userId, role) => {
            const baseline = parseFloat(part.baselineValue || 0) || 0;
            const growth = parseFloat(part.percentageDelta || 0) || 0;
            const points = stamps.map((t) => {
                const v = byTime.get(t)[userId];
                if (v == null || !isFinite(v) || baseline <= 0) return null;
                return { t: t, v: v, pct: ((v - baseline) / baseline) * 100 };
            }).filter(Boolean);
            // The current figure prefers the LATEST VERIFICATION over the
            // stored delta: the series is what the oracle last said, and the
            // stored column can lag it by a cycle.
            const last = points.length ? points[points.length - 1] : null;
            const prev = points.length > 1 ? points[points.length - 2] : null;
            const pctNow = last ? last.pct : growth;
            const current = last ? last.v : (baseline > 0 ? baseline * (1 + growth / 100) : null);
            const target = (meta.targetRevenue && meta.targetRevenue[role] != null)
                ? Number(meta.targetRevenue[role])
                : (baseline > 0 ? Math.round(baseline * (1 + targetPct / 100)) : null);
            return {
                role: role,
                userId: userId,
                handle: '@' + (role === 'challenger' ? (r.challengerUsername || 'challenger') : (r.opponentUsername || 'opponent')),
                baseline: baseline,
                pct: pctNow,
                delta: (last && prev) ? (last.pct - prev.pct) : null,
                current: current,
                target: target,
                points: points,
                payoutCents: part.payoutCents == null ? null : Number(part.payoutCents),
                outcome: part.outcome || null,
                funded: !!part.funded,
                // how far still to run, and how much of the way there
                toTarget: targetPct > 0 ? Math.max(0, targetPct - pctNow) : null,
                ofWay: targetPct > 0 ? Math.max(0, Math.min(100, (pctNow / targetPct) * 100)) : null,
            };
        };

        const a = sideOf(chall, r.challengerUserId, 'challenger');
        const b = sideOf(opp, r.opponentUserId, 'opponent');

        // cadence, MEASURED from the gaps rather than asserted
        let cadence = null;
        if (stamps.length > 1) {
            const gaps = [];
            for (let i = 1; i < stamps.length; i++) gaps.push(stamps[i] - stamps[i - 1]);
            gaps.sort((x, y) => x - y);
            const median = gaps[Math.floor(gaps.length / 2)];
            const hours = median / 3600000;
            cadence = hours >= 23 && hours <= 25
                ? 'every 24h'
                : (hours >= 1 ? 'every ' + Math.round(hours) + 'h' : 'every ' + Math.round(median / 60000) + 'm');
        }

        const state = String(r.state || '').toUpperCase();
        const deadline = r.deadlineUtc ? new Date(r.deadlineUtc).getTime() : null;
        const overdue = deadline != null && Date.now() > deadline;
        let phase = 'pre';
        if (state === 'SETTLED' || state === 'DRAW') phase = 'settled';
        else if (state === 'SETTLING' || (overdue && ['ACTIVE', 'BOTH_FUNDED', 'VERIFYING', 'VERIFIED'].indexOf(state) !== -1)) phase = 'settling';
        else if (['ACTIVE', 'BOTH_FUNDED', 'VERIFYING', 'VERIFIED'].indexOf(state) !== -1) phase = 'live';

        const winner = r.winnerUserId || null;
        const draw = state === 'DRAW';
        const margin = a.pct - b.pct;

        return {
            id: r.id,
            recordHash: r.recordHash || '',
            state: state,
            phase: phase,
            draw: draw,
            winnerUserId: winner,
            metricType: metricType,
            metricLabel: METRIC_LABELS[metricType] || metricType,
            unit: UNIT_NOUN[metricType] || '',
            platform: String(r.platform || '').toUpperCase(),
            monetary: monetary,
            fmtVal: fmtVal,
            targetPct: targetPct,
            perSide: (Number(r.stakePerSideCents) || 0) / 100,
            pool: (Number(r.poolCents) || (Number(r.stakePerSideCents) || 0) * 2) / 100,
            openedAt: r.activatedAt || r.acceptedAt || r.challengeIssuedAt || r.createdAt,
            deadline: deadline,
            settledAt: r.settledAt,
            verifications: stamps.length,
            cadence: cadence,
            stamps: stamps,
            byTime: byTime,
            a: a, b: b,
            margin: margin,
            leader: Math.abs(margin) < 0.005 ? null : (margin > 0 ? a : b),
            challengerUserId: r.challengerUserId,
            opponentUserId: r.opponentUserId,
        };
    }

    let m = build(raw, series);

    // ═══════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════
    function statusText(model) {
        if (model.phase === 'settled') return model.draw ? 'Draw' : 'Settled';
        if (model.phase === 'settling') return 'Settling';
        if (model.phase === 'live') return 'Live';
        if (model.state === 'CHALLENGE_ISSUED') return 'Awaiting opponent';
        if (model.state === 'ACCEPTED') return 'Awaiting funds';
        return model.state.replace(/_/g, ' ').toLowerCase();
    }
    function statusTone(model) {
        if (model.phase === 'live') return 'win';
        if (model.phase === 'settled') return model.draw ? 'mut' : 'win';
        return 'ox';
    }

    function sectionHead(label, right) {
        const h = el('div', 'rv-shead');
        const lab = el('span', 'lab');
        lab.appendChild(el('span', 'rv-mark'));
        lab.appendChild(document.createTextNode(label));
        h.appendChild(lab);
        h.appendChild(el('span', 'ln'));
        if (right) h.appendChild(el('span', 'rt', right));
        return h;
    }

    function renderHeader(model) {
        const frag = document.createDocumentFragment();

        /* CATEGORY AND METRIC ONLY. The status used to be said here, again in
           the facts panel and a third time in the footer; three copies of one
           fact is three chances to disagree. The panel below owns it. */
        const kick = el('div', 'rv-kick');
        kick.appendChild(el('span', 'r'));
        kick.appendChild(document.createTextNode('Rivalry · ' + model.metricLabel));
        frag.appendChild(kick);

        const head = el('div', 'rv-head');
        const left = el('div', 'rv-head-left');
        const matchup = el('div', 'rv-matchup');
        const aLead = model.leader === model.a;
        const bLead = model.leader === model.b;
        matchup.appendChild(el('span', 'rv-mh ' + (model.leader == null ? 'even' : (aLead ? 'lead' : 'trail')), model.a.handle));
        const vsd = el('span', 'rv-vsd');
        vsd.appendChild(el('span', 'd'));
        vsd.appendChild(el('span', null, 'VS'));
        matchup.appendChild(vsd);
        matchup.appendChild(el('span', 'rv-mh ' + (model.leader == null ? 'even' : (bLead ? 'lead' : 'trail')), model.b.handle));
        left.appendChild(matchup);

        // The contract's own id, formatted the way the ledger prints it.
        const idStr = String(model.id || '');
        const label = idStr.length >= 12
            ? idStr.slice(0, 8).toUpperCase() + '·' + idStr.slice(9, 12).toUpperCase()
            : idStr.toUpperCase();
        left.appendChild(el('div', 'rv-sub',
            'Contract No. ' + label + ' · Head-to-head · Opened ' + fmtDate(model.openedAt)));
        head.appendChild(left);

        const pool = el('div', 'rv-pool');
        pool.appendChild(el('div', 'k', model.phase === 'settled' ? 'Settled pool' : 'Total prize pool'));
        pool.appendChild(el('div', 'v', '$' + model.pool.toLocaleString('en-US')));
        pool.appendChild(el('div', 's', '$' + model.perSide.toLocaleString('en-US') + ' per side'));
        head.appendChild(pool);
        frag.appendChild(head);

        // ---- facts: metadata only
        const facts = el('div', 'rv-facts');
        const fact = (k, v, tone, dotCls) => {
            const f = el('div', 'rv-fact');
            f.appendChild(el('div', 'k', k));
            const val = el('div', 'v' + (tone ? ' ' + tone : ''));
            if (dotCls) {
                const d = el('span', dotCls);
                d.setAttribute('style', 'width:7px;height:7px');
                val.appendChild(d);
            }
            val.appendChild(document.createTextNode(v));
            f.appendChild(val);
            return f;
        };
        // The dot beats while the contract is still moving — live or settling —
        // and rests once it is settled.
        const beating = model.phase === 'live' || model.phase === 'settling';
        facts.appendChild(fact('Contract status', statusText(model),
            statusTone(model) === 'win' ? 'win' : 'ox',
            'rv-livedot'
                + (model.phase === 'live' ? '' : (model.phase === 'settled' ? ' mut' : ' ox'))
                + (beating ? ' beat' : '')));

        let settles = '—';
        if (model.phase === 'settled' && model.settledAt) settles = fmtDate(model.settledAt);
        else if (model.deadline != null) {
            const d = Math.ceil((model.deadline - Date.now()) / 86400000);
            settles = fmtDate(model.deadline) + ' · ' + (d > 0 ? d + 'd left' : 'deadline passed');
        }
        const settleFact = fact('Settles', settles);
        settleFact.querySelector('.v').id = 'rv-settles';
        facts.appendChild(settleFact);

        facts.appendChild(fact('Oracle',
            (model.platform || '—') + (model.cadence ? ' · ' + model.cadence : '')));
        facts.appendChild(fact('Verifications',
            model.verifications ? model.verifications + ' · read-only' : 'None yet'));
        frag.appendChild(facts);

        return frag;
    }

    function renderDuel(model) {
        const frag = document.createDocumentFragment();
        frag.appendChild(sectionHead('Head-to-Head',
            model.phase === 'settled' ? 'Final standings'
                : (model.phase === 'settling' ? 'Awaiting final verification' : 'Live standings')));

        const box = el('div', 'rv-duelbox');

        /* WHERE THE PROBABILITY BAR WAS.
           The margin is a real subtraction of two verified percentages, so it
           is stated. A win probability is not — nothing computes one — and the
           bar that used to sit here filled itself from 50 + margin*4. */
        const lead = el('div', 'rv-leadby');
        if (model.phase === 'settled') {
            if (model.draw) lead.textContent = 'Settled as a draw — neither side took the pool';
            else {
                const w = model.winnerUserId === model.a.userId ? model.a
                    : (model.winnerUserId === model.b.userId ? model.b : null);
                if (w) {
                    lead.appendChild(document.createTextNode('Won by '));
                    lead.appendChild(el('b', 'win', w.handle));
                    lead.appendChild(document.createTextNode(' by ' + Math.abs(model.margin).toFixed(2) + '% margin'));
                } else lead.textContent = 'Settled';
            }
        } else if (model.leader == null) {
            lead.textContent = model.verifications ? 'Level — no margin between the two' : 'No verification yet';
        } else {
            lead.appendChild(document.createTextNode(''));
            lead.appendChild(el('b', 'win', model.leader.handle));
            lead.appendChild(document.createTextNode(' leads by '));
            lead.appendChild(el('b', 'win', '+' + Math.abs(model.margin).toFixed(2) + '%'));
            lead.appendChild(document.createTextNode(' margin'));
        }
        box.appendChild(lead);

        const duel = el('div', 'rv-duel');
        duel.appendChild(sidePanel(model, model.a));
        const vs = el('div', 'rv-vscol');
        vs.appendChild(el('span', 'm'));
        vs.appendChild(el('span', 'vt', 'VS'));
        vs.appendChild(el('span', 'm'));
        duel.appendChild(vs);
        duel.appendChild(sidePanel(model, model.b));
        box.appendChild(duel);

        // ---- the money, once
        const escrow = el('div', 'rv-escrow');
        escrow.appendChild(el('span', 'rv-mark'));
        if (model.phase === 'settled' && !model.draw) {
            const w = model.winnerUserId === model.a.userId ? model.a
                : (model.winnerUserId === model.b.userId ? model.b : null);
            const paid = w && w.payoutCents != null ? w.payoutCents / 100 : model.pool;
            escrow.classList.add('paid');
            escrow.appendChild(document.createTextNode(
                '$' + paid.toLocaleString('en-US') + ' paid to ' + (w ? w.handle : 'the winner') + ' · '));
            escrow.appendChild(el('span', 'hash', (model.recordHash || model.id).slice(0, 16)));
        } else if (model.phase === 'settling') {
            escrow.appendChild(document.createTextNode(
                'Both stakes — $' + model.perSide.toLocaleString('en-US')
                + ' per side — held pending final verification'));
        } else {
            escrow.appendChild(document.createTextNode(
                'Both stakes — $' + model.perSide.toLocaleString('en-US')
                + ' per side — locked in escrow until settlement'));
        }
        box.appendChild(escrow);

        frag.appendChild(box);
        return frag;
    }

    function sidePanel(model, s) {
        const isLeader = model.leader === s;
        const settled = model.phase === 'settled';
        const won = settled && !model.draw && model.winnerUserId === s.userId;
        const lost = settled && !model.draw && model.winnerUserId && model.winnerUserId !== s.userId;

        let tone = 'even';
        if (settled) tone = won ? 'lead' : (lost ? 'trail' : 'even');
        else if (model.leader != null) tone = isLeader ? 'lead' : 'trail';

        const side = el('div', 'rv-side ' + tone);
        side.appendChild(el('span', 'reg bl'));

        const top = el('div', 'rv-s-top');
        top.appendChild(el('span', 'rv-s-role', s.role === 'challenger' ? 'Challenger' : 'Opponent'));
        let badgeText = 'Even';
        if (settled) badgeText = model.draw ? 'Draw' : (won ? 'Won' : (lost ? 'Lost' : 'Settled'));
        else if (model.leader != null) badgeText = isLeader ? 'Leading' : 'Trailing';
        else if (model.phase === 'pre') badgeText = s.funded ? 'Funded' : 'Unfunded';
        top.appendChild(el('span', 'rv-s-badge ' + tone, badgeText));
        side.appendChild(top);

        side.appendChild(el('div', 'rv-s-name', s.handle));

        const pctCls = tone === 'lead' ? 'win' : (tone === 'trail' ? 'los' : 'mut');
        const pctEl = el('div', 'rv-s-pct ' + pctCls,
            model.verifications ? pct2(s.pct) : '—');
        pctEl.setAttribute('data-side', s.role);
        side.appendChild(pctEl);

        const d = el('div', 'rv-s-delta');
        if (s.delta == null) {
            d.textContent = model.verifications < 2 ? 'No prior verification to compare' : 'Unchanged since last verification';
        } else {
            const up = s.delta >= 0;
            d.appendChild(el('span', up ? 'up' : 'dn', (up ? '▲ +' : '▼ −') + Math.abs(s.delta).toFixed(2) + '%'));
            d.appendChild(document.createTextNode(' since last verification'));
        }
        side.appendChild(d);

        const mets = el('div', 'rv-s-metrics');
        const mk = (k, v, right) => {
            const c = el('div', 'm' + (right ? ' r' : ''));
            c.appendChild(el('div', 'mk', k));
            c.appendChild(el('div', 'mv', v));
            return c;
        };
        const unit = model.unit ? ' ' + model.unit : '';
        mets.appendChild(mk('Current metric', model.fmtVal(s.current) + unit));
        mets.appendChild(mk('Target (+' + model.targetPct + '%)', model.fmtVal(s.target) + unit, true));
        side.appendChild(mets);

        const prog = el('div', 'rv-s-prog');
        const fill = el('div', 'f');
        fill.setAttribute('style', 'width:' + (s.ofWay == null ? 0 : s.ofWay.toFixed(1)) + '%');
        prog.appendChild(fill);
        side.appendChild(prog);

        const tag = el('span', 'rv-s-tag');
        tag.appendChild(el('span', 'd'));
        if (s.toTarget == null || !model.verifications) {
            tag.appendChild(document.createTextNode('Target not measured yet'));
        } else if (s.toTarget <= 0) {
            tag.appendChild(document.createTextNode('Target met · ' + s.pct.toFixed(1) + '% of ' + model.targetPct + '%'));
        } else {
            tag.appendChild(document.createTextNode(
                s.toTarget.toFixed(1) + '% from target · ' + Math.round(s.ofWay) + '% of the way'));
        }
        side.appendChild(tag);
        return side;
    }

    /* ── the performance log ─────────────────────────────────────────────
       Step interpolation, because a verification is a reading taken at an
       instant and the value HOLDS until the next one — sloping between two
       readings would draw growth that was never measured. */
    function renderChart(model) {
        const frag = document.createDocumentFragment();
        frag.appendChild(sectionHead('Performance Log',
            'Verified oracle series' + (model.platform ? ' · ' + model.platform : '')));

        const card = el('div', 'rv-chartcard');
        const top = el('div', 'rv-chart-top');
        const legend = el('div', 'rv-legend');
        const lg = (cls, handle, pct) => {
            const s = el('span', 'rv-lg');
            s.appendChild(el('span', 'sw ' + cls));
            s.appendChild(document.createTextNode(handle + (pct == null ? '' : ' · ' + pct2(pct))));
            return s;
        };
        legend.appendChild(lg('g', model.a.handle, model.verifications ? model.a.pct : null));
        legend.appendChild(lg('o', model.b.handle, model.verifications ? model.b.pct : null));
        top.appendChild(legend);
        const rightSide = el('span');
        rightSide.setAttribute('style', 'display:flex;align-items:center;gap:16px;flex-wrap:wrap');
        if (model.phase === 'live' || model.phase === 'settling') {
            // The series is still being written, and the page says so rather
            // than leaving the reader to wonder whether it is a snapshot.
            const chip = el('span', 'rv-livechip');
            chip.appendChild(el('span', 'p'));
            chip.appendChild(document.createTextNode(
                model.cadence ? 'Live · ' + model.cadence : 'Live'));
            rightSide.appendChild(chip);
        }
        rightSide.appendChild(el('span', 'rv-oev-time', 'Growth vs baseline'));
        top.appendChild(rightSide);
        card.appendChild(top);

        if (!model.a.points.length && !model.b.points.length) {
            card.appendChild(el('div', 'rv-chart-empty', 'No verifications recorded yet'));
            frag.appendChild(card);
            return frag;
        }

        // PAD_R 100, not 66: the last reading now carries its value beside it,
        // and at 66 that label ran past the right edge of the viewBox.
        const W = 1060, H = 300, PAD_L = 52, PAD_R = 100, PAD_T = 36, PAD_B = 22;
        const all = model.a.points.concat(model.b.points);
        const maxPct = Math.max(model.targetPct, ...all.map(p => p.pct));
        const minPct = Math.min(0, ...all.map(p => p.pct));
        // Headroom so the target line sits near the top with room for its label.
        const yMax = Math.max(model.targetPct, maxPct * 1.05) || 1;
        const yMin = minPct;
        const range = (yMax - yMin) || 1;
        const tMin = model.stamps[0];
        const tMax = model.stamps[model.stamps.length - 1];
        const tRange = (tMax - tMin) || 1;
        const toX = (t) => PAD_L + ((t - tMin) / tRange) * (W - PAD_L - PAD_R);
        const toY = (p) => PAD_T + ((yMax - p) / range) * (H - PAD_T - PAD_B);

        const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'rv-chart', role: 'img' });
        const title = svgEl('title', {});
        title.textContent = model.a.handle + ' ' + pct2(model.a.pct) + ' versus '
            + model.b.handle + ' ' + pct2(model.b.pct) + ', against a target of +' + model.targetPct + '%';
        svg.appendChild(title);

        /* ABOUT FOUR GRIDLINES, on a round number. A fixed ladder of
           thresholds put eight lines behind a 15% range and the plot read as
           graph paper — the lines started competing with the two series they
           exist to measure. */
        const rawStep = range / 4;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
        const norm = (rawStep || 1) / mag;
        const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
        for (let g = Math.ceil(yMin / step) * step; g <= yMax + 0.001; g += step) {
            const y = toY(g);
            svg.appendChild(svgEl('line', { x1: PAD_L, y1: y.toFixed(1), x2: W - PAD_R + 60, y2: y.toFixed(1),
                stroke: 'rgba(70,55,35,.11)', 'stroke-width': 1 }));
            const t = svgEl('text', { x: PAD_L - 9, y: (y + 3).toFixed(1), 'font-family': 'IBM Plex Mono,monospace',
                'font-size': 11, fill: '#8A7C5E', 'text-anchor': 'end' });
            t.textContent = g + '%';
            svg.appendChild(t);
        }

        // the target line
        const ty = toY(model.targetPct);
        svg.appendChild(svgEl('line', { x1: PAD_L, y1: ty.toFixed(1), x2: W - PAD_R + 60, y2: ty.toFixed(1),
            stroke: '#7C1D2B', 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: '.55' }));
        const tl = svgEl('text', { x: W - PAD_R + 60, y: (ty - 6).toFixed(1), 'font-family': 'IBM Plex Mono,monospace',
            'font-size': 10, 'letter-spacing': 1, fill: '#7C1D2B', 'text-anchor': 'end' });
        tl.textContent = 'TARGET · +' + model.targetPct + '%';
        svg.appendChild(tl);

        const stepPath = (pts, close) => {
            if (!pts.length) return '';
            let d = 'M' + toX(pts[0].t).toFixed(1) + ' ' + toY(pts[0].pct).toFixed(1);
            for (let i = 1; i < pts.length; i++) {
                d += ' L' + toX(pts[i].t).toFixed(1) + ' ' + toY(pts[i - 1].pct).toFixed(1);
                d += ' L' + toX(pts[i].t).toFixed(1) + ' ' + toY(pts[i].pct).toFixed(1);
            }
            if (close) {
                const base = toY(Math.max(yMin, 0)).toFixed(1);
                d += ' L' + toX(pts[pts.length - 1].t).toFixed(1) + ' ' + base;
                d += ' L' + toX(pts[0].t).toFixed(1) + ' ' + base + ' Z';
            }
            return d;
        };

        /* THE MARGIN, DRAWN. The gap between the two step-lines is the lead —
           the single number the page is about — so it is filled rather than
           left as two lines the reader has to measure by eye. Built from the
           leader's path forward and the trailer's back, both stepped, so the
           band has the same shape as the data and not a smoothed version. */
        const bandPath = () => {
            const A = model.a.points, B = model.b.points;
            if (A.length < 2 || B.length < 2) return '';
            let d = 'M' + toX(A[0].t).toFixed(1) + ' ' + toY(A[0].pct).toFixed(1);
            for (let i = 1; i < A.length; i++) {
                d += ' L' + toX(A[i].t).toFixed(1) + ' ' + toY(A[i - 1].pct).toFixed(1);
                d += ' L' + toX(A[i].t).toFixed(1) + ' ' + toY(A[i].pct).toFixed(1);
            }
            for (let i = B.length - 1; i > 0; i--) {
                d += ' L' + toX(B[i].t).toFixed(1) + ' ' + toY(B[i].pct).toFixed(1);
                d += ' L' + toX(B[i].t).toFixed(1) + ' ' + toY(B[i - 1].pct).toFixed(1);
            }
            d += ' L' + toX(B[0].t).toFixed(1) + ' ' + toY(B[0].pct).toFixed(1) + ' Z';
            return d;
        };
        const band = bandPath();
        if (band) svg.appendChild(svgEl('path', { d: band, fill: 'rgba(70,55,35,.07)', stroke: 'none' }));

        const draw = (pts, stroke, fill, width) => {
            if (!pts.length) return;
            svg.appendChild(svgEl('path', { d: stepPath(pts, true), fill: fill, stroke: 'none' }));
            svg.appendChild(svgEl('path', { d: stepPath(pts, false), fill: 'none', stroke: stroke,
                'stroke-width': width, 'stroke-linejoin': 'round' }));
        };
        draw(model.b.points, '#7C1D2B', 'rgba(124,29,43,.05)', 2.6);
        draw(model.a.points, '#4E6B3E', 'rgba(78,107,62,.07)', 2.9);

        /* THE HEADROOM ANNOTATION. The space above the two lines is the
           distance still to run, so it is labelled as that rather than left
           as dead air: a dotted riser from each end dot up to the target. */
        const riser = (pts, colour, dx, opacity) => {
            if (!pts.length) return;
            const p = pts[pts.length - 1];
            const x = toX(p.t) + dx;
            if (toY(p.pct) - ty < 6) return;
            svg.appendChild(svgEl('line', { x1: x.toFixed(1), y1: toY(p.pct).toFixed(1), x2: x.toFixed(1), y2: ty.toFixed(1),
                stroke: colour, 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: opacity }));
        };
        riser(model.a.points, '#4E6B3E', 0, '.5');
        riser(model.b.points, '#7C1D2B', -14, '.4');

        /* The notes sit ON a plate. Gridlines run underneath them, and reading
           "6.9% to target" through a rule crossing the middle of the words is
           the sort of thing that makes a chart feel unfinished. */
        const note = (yOff, colour, handle, remaining) => {
            if (remaining == null) return;
            const label = handle + ' — ' + (remaining <= 0 ? 'target met' : remaining.toFixed(1) + '% to target');
            const w = 22 + label.length * 6.7;
            const g = svgEl('g', { 'font-family': 'IBM Plex Mono,monospace', 'font-size': 11 });
            g.appendChild(svgEl('rect', {
                x: PAD_L + 14, y: (PAD_T + yOff - 4).toFixed(1), width: w.toFixed(0), height: 18,
                fill: '#F5EDDA', opacity: '.92',
            }));
            g.appendChild(svgEl('rect', { x: PAD_L + 20, y: (PAD_T + yOff + 1).toFixed(1), width: 8, height: 8, fill: colour }));
            const t = svgEl('text', { x: PAD_L + 34, y: (PAD_T + yOff + 9).toFixed(1), fill: '#574E3D' });
            t.textContent = handle + ' — ';
            const s = svgEl('tspan', { fill: colour });
            s.textContent = remaining <= 0 ? 'target met' : remaining.toFixed(1) + '% to target';
            t.appendChild(s);
            g.appendChild(t);
            svg.appendChild(g);
        };
        note(16, '#4E6B3E', model.a.handle, model.a.toTarget);
        note(40, '#7C1D2B', model.b.handle, model.b.toTarget);

        /* The end dot carries a halo while the contract is still running: the
           series has not finished being written, and the last reading is the
           live edge of it rather than a final value. It stops on settlement. */
        const live = model.phase === 'live' || model.phase === 'settling';
        /* The last reading is the one that matters, so it is the one that is
           labelled — the reader should not have to trace a line back to the
           legend to find out where a side currently stands. */
        const dot = (pts, colour) => {
            if (!pts.length) return;
            const p = pts[pts.length - 1];
            const cx = toX(p.t), cy = toY(p.pct);
            if (live) {
                const halo = svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 7, fill: colour, opacity: '.3' });
                halo.setAttribute('class', 'rv-halo');
                svg.appendChild(halo);
            }
            svg.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 5.5,
                fill: colour, stroke: '#F5EDDA', 'stroke-width': 2 }));
            const lab = svgEl('text', {
                x: (cx + 12).toFixed(1), y: (cy + 4).toFixed(1),
                'font-family': 'IBM Plex Mono,monospace', 'font-size': 13,
                'font-weight': 500, fill: colour,
            });
            lab.textContent = pct2(p.pct);
            svg.appendChild(lab);
        };
        dot(model.a.points, '#4E6B3E');
        dot(model.b.points, '#7C1D2B');

        /* ---- the crosshair ----
           Reads the series at whichever verification the pointer is nearest —
           it snaps to a reading rather than interpolating between two, because
           the value between two verifications was never measured. */
        const cross = svgEl('g', {});
        cross.setAttribute('class', 'rv-cross');
        const vline = svgEl('line', { x1: 0, y1: PAD_T - 10, x2: 0, y2: H - PAD_B,
            stroke: 'rgba(70,55,35,.45)', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
        cross.appendChild(vline);
        const ring = (colour) => svgEl('circle', { cx: -20, cy: -20, r: 5, fill: colour, stroke: '#F5EDDA', 'stroke-width': 2 });
        const ringA = ring('#4E6B3E'), ringB = ring('#7C1D2B');
        cross.appendChild(ringA); cross.appendChild(ringB);
        svg.appendChild(cross);

        const hit = svgEl('rect', { x: PAD_L, y: 0, width: (W - PAD_L - PAD_R + 60).toFixed(0), height: H });
        hit.setAttribute('class', 'hit');
        svg.appendChild(hit);

        const scroll = el('div', 'rv-chart-scroll');
        scroll.appendChild(svg);

        const tip = el('div', 'rv-tip');
        const tipWhen = el('div', 'when');
        tip.appendChild(tipWhen);
        const tipRow = (cls, handle) => {
            const row = el('div', 'row');
            const lhs = el('span');
            const sw = el('span', 'sw ' + cls);
            lhs.appendChild(sw);
            lhs.appendChild(document.createTextNode(handle));
            row.appendChild(lhs);
            const v = el('b', null, '—');
            row.appendChild(v);
            return { row: row, value: v };
        };
        const rowA = tipRow('g', model.a.handle);
        const rowB = tipRow('o', model.b.handle);
        tip.appendChild(rowA.row);
        tip.appendChild(rowB.row);
        const tipMargin = el('div', 'mg', '');
        tip.appendChild(tipMargin);
        scroll.appendChild(tip);

        const at = (side, i) => (side.points[i] ? side.points[i].pct : null);
        const show = (clientX) => {
            const box = svg.getBoundingClientRect();
            if (!box.width) return;
            // client px -> viewBox units
            const vx = ((clientX - box.left) / box.width) * W;
            let best = 0, bestD = Infinity;
            for (let i = 0; i < model.stamps.length; i++) {
                const d = Math.abs(toX(model.stamps[i]) - vx);
                if (d < bestD) { bestD = d; best = i; }
            }
            const x = toX(model.stamps[best]);
            vline.setAttribute('x1', x.toFixed(1));
            vline.setAttribute('x2', x.toFixed(1));
            const pa = at(model.a, best), pb = at(model.b, best);
            const place = (r, p) => {
                if (p == null) { r.setAttribute('cx', -20); r.setAttribute('cy', -20); return; }
                r.setAttribute('cx', x.toFixed(1));
                r.setAttribute('cy', toY(p).toFixed(1));
            };
            place(ringA, pa); place(ringB, pb);
            tipWhen.textContent = fmtStamp(model.stamps[best]);
            rowA.value.textContent = pa == null ? '—' : pct2(pa);
            rowB.value.textContent = pb == null ? '—' : pct2(pb);
            tipMargin.textContent = (pa == null || pb == null)
                ? 'Margin not computable'
                : 'Margin ' + (pa - pb >= 0 ? '+' : '−') + Math.abs(pa - pb).toFixed(2) + '%';
            // keep the card inside the plot rather than letting it hang off
            const frac = x / W;
            const left = frac > 0.62
                ? Math.max(8, (frac * box.width) - 190)
                : Math.min(box.width - 190, (frac * box.width) + 18);
            tip.style.left = left.toFixed(0) + 'px';
            scroll.classList.add('on');
        };
        const hide = () => scroll.classList.remove('on');
        hit.addEventListener('mousemove', (e) => show(e.clientX));
        hit.addEventListener('mouseleave', hide);
        hit.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) show(e.touches[0].clientX);
        }, { passive: true });
        hit.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) show(e.touches[0].clientX);
        }, { passive: true });
        hit.addEventListener('touchend', hide);

        card.appendChild(scroll);
        frag.appendChild(card);
        return frag;
    }

    /* ── the oracle event log ────────────────────────────────────────────
       One row per verification instant, newest first, built from the same
       series the chart is drawn from. The earliest instant is the baseline
       lock rather than a reading. */
    function renderLog(model) {
        const frag = document.createDocumentFragment();
        frag.appendChild(sectionHead('Oracle Event Log',
            (model.cadence ? model.cadence.charAt(0).toUpperCase() + model.cadence.slice(1) : 'Per verification') + ' · read-only'));

        const log = el('div', 'rv-olog');
        if (!model.stamps.length) {
            log.appendChild(el('div', 'rv-chart-empty', 'No oracle events recorded yet'));
            frag.appendChild(log);
            return frag;
        }

        const pctAt = (side, i) => (side.points[i] ? side.points[i].pct : null);
        const idx = model.stamps.length - 1;

        // latest, as a full card
        if (idx >= 1) {
            const card = el('div', 'rv-oev');
            const top = el('div', 'rv-oev-top');
            const title = el('span', 'rv-oev-title');
            const d = el('span', 'rv-livedot');
            d.setAttribute('style', 'width:6px;height:6px;box-shadow:none');
            title.appendChild(d);
            title.appendChild(document.createTextNode('Latest verification'));
            top.appendChild(title);
            const when = model.stamps[idx];
            top.appendChild(el('span', 'rv-oev-time', fmtStamp(when) + ' · ' + ago(when)));
            card.appendChild(top);

            const body = el('div', 'rv-oev-body');
            const line = (side, cls) => {
                const from = pctAt(side, idx - 1);
                const to = pctAt(side, idx);
                body.appendChild(document.createTextNode(side.handle + ' '));
                if (from != null) {
                    const a = el('span', 'ar', pct2(from) + ' →');
                    body.appendChild(a);
                    body.appendChild(document.createTextNode(' '));
                }
                body.appendChild(el('b', cls, to == null ? '—' : pct2(to)));
                body.appendChild(document.createElement('br'));
            };
            line(model.a, 'win');
            line(model.b, 'ox');
            card.appendChild(body);

            const foot = el('div', 'rv-oev-foot');
            const ma = pctAt(model.a, idx), mb = pctAt(model.b, idx);
            const mg = (ma != null && mb != null) ? ma - mb : null;
            foot.appendChild(el('span', 'rv-oev-margin', mg == null
                ? 'Margin not computable'
                : 'Margin ' + (mg >= 0 ? '+' : '−') + Math.abs(mg).toFixed(2) + '% · '
                  + (mg >= 0 ? 'challenger' : 'opponent')));
            const stat = el('span', 'rv-oev-status');
            withMark(stat, 'Verified', '✓');
            foot.appendChild(stat);
            card.appendChild(foot);
            log.appendChild(card);
        }

        /* THREE PRIOR READINGS, then the rest behind a control. A daily series
           runs to dozens of rows and the log was pushing the settlement footer
           off the bottom of the page. Every row is built here and none is
           fetched later, so opening is a state change. */
        const priorRow = (i) => {
            const row = el('div', 'rv-oevc');
            row.appendChild(el('span', 't', fmtStamp(model.stamps[i])));
            const desc = el('span', 'd');
            const pa = pctAt(model.a, i), pb = pctAt(model.b, i);
            desc.appendChild(document.createTextNode(model.a.handle + ' '));
            desc.appendChild(el('b', null, pa == null ? '—' : pct2(pa)));
            desc.appendChild(document.createTextNode(' · ' + model.b.handle + ' '));
            desc.appendChild(el('b', null, pb == null ? '—' : pct2(pb)));
            if (pa != null && pb != null) {
                const g = pa - pb;
                desc.appendChild(document.createTextNode(
                    ' · margin ' + (g >= 0 ? '+' : '−') + Math.abs(g).toFixed(2) + '%'));
            }
            row.appendChild(desc);
            const s = el('span', 's');
            withMark(s, 'Verified', '✓');
            row.appendChild(s);
            return row;
        };

        const priors = [];
        for (let i = idx - 1; i >= 1; i--) priors.push(i);
        const SHOWN = 3;
        priors.slice(0, SHOWN).forEach((i) => log.appendChild(priorRow(i)));

        const hidden = priors.slice(SHOWN);
        if (hidden.length) {
            const more = el('div', 'rv-more');
            const inner = el('div');
            more.appendChild(inner);
            const moreId = 'rv-more-rows';
            more.id = moreId;
            hidden.forEach((i) => inner.appendChild(priorRow(i)));
            log.appendChild(more);

            const toggle = el('button', 'rv-toggle',
                'View all ' + model.verifications + ' verifications');
            toggle.type = 'button';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-controls', moreId);
            toggle.addEventListener('click', () => {
                const open = log.classList.toggle('open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                toggle.textContent = open
                    ? 'Show fewer verifications'
                    : 'View all ' + model.verifications + ' verifications';
            });
            log.appendChild(toggle);
        }

        // the baseline lock
        const base = el('div', 'rv-oevc secure');
        base.appendChild(el('span', 't', fmtStamp(model.stamps[0])));
        base.appendChild(el('span', 'd',
            'Baseline lock · ' + model.platform + ' · growth target +' + model.targetPct + '% threshold'));
        const bs = el('span', 's');
        withMark(bs, 'Secure', '✓');
        base.appendChild(bs);
        log.appendChild(base);

        // the settlement, when there is one
        if (model.phase === 'settled' && model.settledAt) {
            const st = el('div', 'rv-oevc settle');
            st.appendChild(el('span', 't', fmtStamp(model.settledAt)));
            const w = model.winnerUserId === model.a.userId ? model.a
                : (model.winnerUserId === model.b.userId ? model.b : null);
            st.appendChild(el('span', 'd', model.draw
                ? 'Settled as a draw · stakes returned'
                : 'Settled · pool paid to ' + (w ? w.handle : 'the winner')));
            const ss = el('span', 's');
            withMark(ss, 'Settled', '✓');
            st.appendChild(ss);
            log.appendChild(st);
        }

        frag.appendChild(log);
        return frag;
    }

    function renderFooter(model) {
        const foot = el('div', 'rv-foot');
        const left = el('div');
        if (model.phase === 'settled') {
            left.appendChild(el('div', 't', model.draw
                ? 'Settled as a draw.'
                : 'The $' + model.pool.toLocaleString('en-US') + ' pool has been paid.'));
            left.appendChild(el('div', 's', 'Settled at the deadline · recorded on the public ledger · no appeals'));
        } else if (model.phase === 'settling') {
            left.appendChild(el('div', 't', 'Winner takes the $' + model.pool.toLocaleString('en-US') + ' pool.'));
            left.appendChild(el('div', 's', 'Deadline reached · awaiting final verification'));
        } else {
            left.appendChild(el('div', 't', 'Winner takes the $' + model.pool.toLocaleString('en-US') + ' pool.'));
            left.appendChild(el('div', 's', 'Settled automatically at the deadline · recorded on the public ledger · no appeals'));
        }
        foot.appendChild(left);

        const seal = el('div', 'seal');
        const svg = svgEl('svg', { viewBox: '0 0 60 60', role: 'img' });
        const t = svgEl('title', {});
        t.textContent = 'Collateral seal';
        svg.appendChild(t);
        svg.appendChild(svgEl('path', {
            d: 'M30 4 C40 4 47 12 50 22 C53 30 56 34 54 42 C52 50 44 56 34 56 C22 57 12 52 8 42 C4 33 6 24 10 17 C14 10 20 4 30 4 Z',
            fill: '#5E1420',
        }));
        svg.appendChild(svgEl('circle', { cx: 30, cy: 30, r: 16.5, fill: 'none', stroke: 'rgba(255,235,220,.16)', 'stroke-width': 1 }));
        const c = svgEl('text', { x: 30, y: 37, 'font-family': 'Cormorant Garamond,serif', 'font-size': 21,
            'font-weight': 700, fill: '#F0DAC7', 'text-anchor': 'middle' });
        c.textContent = 'C';
        svg.appendChild(c);
        seal.appendChild(svg);
        foot.appendChild(seal);
        return foot;
    }

    function paint(model) {
        container.innerHTML = '';
        container.appendChild(renderHeader(model));
        container.appendChild(renderDuel(model));
        container.appendChild(renderChart(model));
        container.appendChild(renderLog(model));
        const acts = el('div', 'rv-actions');
        acts.id = 'rv-actions';
        acts.hidden = true;
        container.appendChild(acts);
        container.appendChild(renderFooter(model));
        const back = el('button', 'rv-back', '← Back to the market');
        back.type = 'button';
        back.addEventListener('click', () => window.router && window.router.navigate('/market'));
        container.appendChild(back);
        wireActions(model);
    }

    /* ── the controls a pre-active rivalry still needs ───────────────────
       The reference is a LIVE duel and so shows none of these, but a rivalry
       that cannot be accepted or funded is a dead page. Same handlers as
       before; only their setting is new. */
    function wireActions(model) {
        const host = document.getElementById('rv-actions');
        if (!host) return;
        host.innerHTML = '';

        let userId = null;
        try {
            const u = api.getStoredUser && api.getStoredUser();
            userId = u && (u.id || u.userId);
        } catch (e) { /* signed out */ }

        const isOpponent = model.opponentUserId && userId === model.opponentUserId;
        const isChallenger = model.challengerUserId && userId === model.challengerUserId;
        const isOpen = !model.opponentUserId;
        const state = model.state;

        const status = (text) => host.appendChild(el('span', 'rv-astatus', text));
        const button = (cls, text, onClick) => {
            const b = el('button', 'rv-abtn ' + cls, text);
            b.type = 'button';
            b.addEventListener('click', onClick);
            host.appendChild(b);
            return b;
        };
        const run = async (btn, busyText, idleText, fn) => {
            btn.disabled = true;
            const was = btn.textContent;
            btn.textContent = busyText;
            try { await fn(); } finally {
                btn.disabled = false;
                btn.textContent = idleText || was;
            }
        };
        const accept = async (btn, label) => run(btn, 'Accepting…', label, async () => {
            try {
                const res = await api.acceptRivalry(model.id);
                if (res && res.ok) {
                    await showAlert('Challenge accepted. Fund your side to begin.', { type: 'success', title: 'Challenge Accepted' });
                    location.reload();
                } else showAlert((res && res.error) || 'Failed to accept', { type: 'error' });
            } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
        });

        if (state === 'CHALLENGE_ISSUED' && isOpponent) {
            const a = button('accept', 'Accept challenge', () => accept(a, 'Accept challenge'));
            button('decline', 'Decline', async (e) => {
                const btn = e.currentTarget;
                if (!(await showConfirm('Are you sure? This cannot be undone.', { title: 'Decline Challenge', confirmText: 'DECLINE', danger: true }))) return;
                await run(btn, 'Declining…', 'Decline', async () => {
                    try {
                        const res = await api.declineRivalry(model.id);
                        if (res && res.ok) {
                            await showAlert('Challenge declined.', { type: 'info', title: 'Declined' });
                            window.router.navigate('/market');
                        } else showAlert((res && res.error) || 'Failed to decline', { type: 'error' });
                    } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
                });
            });
            status('You have been challenged. Accept to lock capital.');
        } else if (state === 'CHALLENGE_ISSUED' && isOpen && userId && !isChallenger) {
            const a = button('accept', 'Accept open challenge', () => accept(a, 'Accept open challenge'));
            status('This is an open challenge. Accept to lock capital and begin the duel.');
        } else if (state === 'CHALLENGE_ISSUED' && isOpen && !userId) {
            button('accept', 'Sign in to accept', () => window.app && window.app.openAccessModal());
            status('Sign in to accept this open challenge.');
        } else if (state === 'ACCEPTED' && (isChallenger || isOpponent)) {
            const label = 'Fund your side — $' + model.perSide.toLocaleString('en-US');
            const f = button('fund', label, () => run(f, 'Funding…', label, async () => {
                try {
                    const res = await api.fundRivalry(model.id);
                    if (res && res.ok) {
                        await showAlert('Funded. Waiting for the opponent to fund.', { type: 'success', title: 'Funded' });
                        location.reload();
                    } else showAlert((res && res.error) || 'Failed to fund', { type: 'error' });
                } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
            }));
            status('Both sides must fund before the duel begins.');
        } else if (state === 'CHALLENGE_ISSUED' && isChallenger) {
            status('Waiting for the opponent to accept.');
        } else {
            host.hidden = true;
            return;
        }
        host.hidden = false;
    }

    paint(m);

    // ── the countdown, in the facts strip ──
    if (m.phase !== 'settled' && m.deadline != null) {
        const tick = () => {
            const cell = document.getElementById('rv-settles');
            if (!cell) return;
            const diff = m.deadline - Date.now();
            if (diff <= 0) {
                cell.textContent = fmtDate(m.deadline) + ' · deadline passed';
                clearInterval(window._rvdCdInterval);
                window._rvdCdInterval = null;
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            cell.textContent = fmtDate(m.deadline) + ' · '
                + (days > 0 ? days + 'd ' + pad2(hours) + 'h left' : pad2(hours) + 'h ' + pad2(mins) + 'm left');
        };
        tick();
        window._rvdCdInterval = setInterval(tick, 30000);
    }

    /* ── live refresh ────────────────────────────────────────────────────
       The standings, the chart and the log all read the same series, so one
       poll keeps all three honest rather than letting the header drift away
       from the log under it. Repaints only when the oracle has actually
       said something new. */
    if (m.phase === 'live' || m.phase === 'settling') {
        window._rvdPoll = setInterval(async () => {
            if (document.hidden) return;
            if (!document.getElementById('rvd-container')) {
                clearInterval(window._rvdPoll); window._rvdPoll = null; return;
            }
            try {
                const [r2, m2] = await Promise.all([api.getRivalry(id), api.getRivalryMetrics(id)]);
                const nextRaw = r2 && r2.rivalry;
                const nextSeries = (m2 && m2.metrics) || [];
                if (!nextRaw) return;
                const next = build(nextRaw, nextSeries);
                if (next.verifications === m.verifications && next.state === m.state) return;
                m = next;
                paint(m);
            } catch (e) {
                // A failed refresh leaves the last verified reading on screen.
                console.warn('[RivalryDetail] refresh failed:', e && e.message);
            }
        }, reduceMotion ? 180000 : 90000);
    }
}
