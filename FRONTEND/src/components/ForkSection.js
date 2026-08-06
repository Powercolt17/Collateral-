/**
 * Collateral — "Who holds you to it".
 *
 * Built to the supplied comp. The previous editorial pass stripped the section
 * to type plus two plates; the comp puts a measured amount back, and every
 * piece of it is doing a job:
 *
 *   the four icon plates   a small engraved emblem above each step — temple,
 *                          signpost, safe, wax seal. They are the only pictures
 *                          in the top band and they carry the sequence at a
 *                          glance, before any of the copy is read.
 *   the step hairlines     a 1px rule on the LEFT of each step, suppressed on
 *                          the first. Four columns divided by three lines, not
 *                          boxed by eight — the band still reads as one object.
 *   the OR gutter          a real column, 66px, with a vertical hairline and the
 *                          word sitting on it. Solo and Rivalry are alternatives
 *                          and the layout should say so; a plain gap does not.
 *   the two inscribed rules  the divider above the plates and the closing line
 *                          both carry their text ON the rule, knocked out of it
 *                          with a parchment-coloured pad. Same gesture twice.
 *
 * ── THE TWO PLATES ─────────────────────────────────────────────────────────
 *
 *   plate-solo.jpg      the lone figure climbing toward the temple
 *   plate-rivalry.jpg   two chariots racing for the same temple steps
 *
 * Both encoded to an IDENTICAL 1000x666 frame at q88. Two images sitting side
 * by side must agree exactly on height or the pair reads as "slightly off"
 * without being findable, so they match by construction rather than by CSS.
 *
 * Both are GRADED, not used as delivered — FRONTEND/tools/grade-plates.ps1.
 * The sources are dark painterly washes whose highlights top out around L=195,
 * so the paper inside the engraving read as dull tan and the plates sat on the
 * page like photographs of drawings. The grade re-maps each onto a single ramp
 * from warm ink to the EXACT --fk-parch value, which is what lets a third of
 * each plate be literally the same colour as the page behind it. No mask can
 * hide a background two shades off, so this is load-bearing for the dissolve as
 * well as for the look.
 *
 * The frame is 3:2 because the rivalry plate is. It was 708x332 (2.13:1), and
 * cropping the chariots into that would have taken 151px off the top — which
 * decapitates the temple — and 151px off the bottom, which cuts the two "C"
 * money bags. Both are the subject. Re-framing the PAIR to 3:2 crops neither by
 * more than a pixel, since the solo source is natively 3:2 as well.
 *
 * If the plate proportions change again, the two .fk-or offsets must be
 * re-derived. They are the only geometry in the file that does not follow.
 *
 * They have no edge at all. Each is masked by a generated per-pixel alpha map
 * that dissolves it irregularly into the parchment — see the note on .fk-plate
 * for how the two layers work, and FRONTEND/tools/gen-plate-masks.ps1 for the
 * generator. Re-run that script if either plate is replaced; the masks are
 * sized to the 1000x666 frame and seeded per plate.
 *
 * ── TYPE ────────────────────────────────────────────────────────────────────
 * All of it is Garamond. The earlier pass set the small labels in IBM Plex Mono;
 * the comp has no monospace anywhere. Letter-spacing and weight do that work.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * Everything is under .fk. h2 not h1 — the hero owns the page's h1.
 *
 * ── MOTION ───────────────────────────────────────────────────────────────────
 * One fade and rise on scroll: 700ms, 12px, staggered 90ms. The links move their
 * arrow 4px and nothing else. Under prefers-reduced-motion everything is simply
 * present.
 */

const STEPS = [
    {
        n: '01', name: 'Connect',
        icon: '/assets/images/fork-step-01.png',
        iconAlt: 'Engraved emblem: a temple front.',
        body: 'We read your business data live. Nothing to type, nothing to upload.',
    },
    {
        n: '02', name: 'Choose',
        icon: '/assets/images/fork-step-02.png',
        iconAlt: 'Engraved emblem: a two-armed signpost.',
        body: 'You pick the path: your own record, or a rival.',
    },
    {
        n: '03', name: 'Lock',
        icon: '/assets/images/fork-step-03.png',
        iconAlt: 'Engraved emblem: a strongbox.',
        body: 'Capital sits in escrow for the full window. No early exit.',
    },
    {
        n: '04', name: 'Settle',
        icon: '/assets/images/fork-step-04.png',
        iconAlt: 'Engraved emblem: a wax seal.',
        body: 'The oracle reports on the deadline. The record is permanent.',
    },
];

const PATHS = [
    {
        key: 'solo', name: 'Solo',
        def: 'Compete against yourself.',
        plate: '/assets/images/plate-solo.jpg',
        mask: '/assets/images/plate-solo-mask.png',
        edge: '/assets/images/plate-solo-edge.png',
        alt: 'Engraving: a lone figure carrying a purse up a long stone stair toward a temple on the summit.',
        caption: 'Only your execution decides the outcome.',
        feats: ['One participant', 'One deposit', 'One deadline', 'Oracle settlement'],
        cta: 'Choose Solo',
    },
    {
        key: 'rival', name: 'Rivalry',
        def: 'Compete against another operator.',
        plate: '/assets/images/plate-rivalry.jpg',
        mask: '/assets/images/plate-rivalry-mask.png',
        edge: '/assets/images/plate-rivalry-edge.png',
        alt: 'Engraving: two chariots racing abreast up a paved course toward a temple, each with a purse lashed to the car.',
        caption: 'Better execution takes the escrow.',
        feats: ['Two participants', 'Equal deposits', 'Same deadline', 'Winner takes escrow'],
        cta: 'Choose Rivalry',
    },
];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** The landing page's existing behaviour: gate on auth before contract creation. */
const DEFAULT_PATH_ACTION =
    "if(window.app &amp;&amp; window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;";

function renderStep(step, i) {
    return `
                        <div class="fk-step" style="--i:${i}">
                            <div class="fk-num">${escapeHtml(step.n)}</div>
                            <img class="fk-icon" src="${escapeHtml(step.icon)}" alt="${escapeHtml(step.iconAlt)}"
                                 loading="lazy" decoding="async" width="128" height="128" />
                            <h3>${escapeHtml(step.name)}</h3>
                            <span class="fk-dia fk-step-dia" aria-hidden="true"></span>
                            <p>${escapeHtml(step.body)}</p>
                        </div>`;
}

function renderPath(path, onSelectPath, i) {
    const action = onSelectPath ? onSelectPath(path.key) : DEFAULT_PATH_ACTION;
    const feats = path.feats.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
    return `
                        <div class="fk-path fk-${escapeHtml(path.key)}" style="--i:${i}">
                            <h3 class="fk-p-name">${escapeHtml(path.name)}</h3>
                            <p class="fk-p-def">${escapeHtml(path.def)}</p>
                            <div class="fk-plate" style="--pl:url('${escapeHtml(path.plate)}');--pl-mask:url('${escapeHtml(path.mask)}');--pl-edge:url('${escapeHtml(path.edge)}')">
                                <img src="${escapeHtml(path.plate)}" alt="${escapeHtml(path.alt)}"
                                     loading="lazy" decoding="async" width="1000" height="666" />
                            </div>
                            <p class="fk-p-cap">${escapeHtml(path.caption)}</p>
                            <ul class="fk-p-feat">${feats}</ul>
                            <button type="button" class="fk-p-cta"${action ? ` onclick="${action}"` : ''}>${escapeHtml(path.cta)} <span class="fk-arw" aria-hidden="true">&rarr;</span></button>
                        </div>`;
}

/**
 * @param {object} [options]
 * @param {(key: string) => string} [options.onSelectPath] Given "solo" or
 *   "rival", returns the inline handler for that path's CTA. Called at render
 *   time. Omit to keep the landing page's existing auth-gated behaviour.
 */
export function renderForkSection(options = {}) {
    const { onSelectPath } = options;

    return `
        <style>
        .fk{
          --fk-parch:#F2E9D2;
          --fk-ink:#2A2118;
          /* Was #5B5140, which measured 6.1:1 on the parchment. Every piece of
             body copy in this section is set in it, so it is the single highest
             leverage value in the file: 8.3:1 at no cost to the palette. */
          --fk-ink-soft:#4A4132;
          /* Was #8B7E64, which is 3.30:1 on the parchment and fails AA outright.
             It now carries only the schedule, set at 10.2px, where 3.3:1 was the
             single least readable thing in the section. #6B5F49 is 5.21:1 and
             still reads as the quiet voice. */
          --fk-muted:#6B5F49;
          --fk-ox:#7C1D2B;
          --fk-line:rgba(70,55,35,.22);
          --fk-line-soft:rgba(70,55,35,.14);
          --fk-serif:"EB Garamond",Georgia,serif;
          --fk-display:"Cormorant Garamond","EB Garamond",Georgia,serif;

          background:var(--fk-parch);
          color:var(--fk-ink);
          font-family:var(--fk-serif);
          -webkit-font-smoothing:antialiased;
        }
        .fk *{box-sizing:border-box;margin:0;padding:0}
        .fk-wrap{width:100%;max-width:1305.6px;margin:0 auto;padding:61.2px 52.7px 47.6px}

        /* The section's one repeated ornament. Rotated square, not a glyph —
           a real diamond character sits differently in every serif we might
           fall back to. */
        .fk-dia{width:6px;height:6px;background:var(--fk-ox);
          transform:rotate(45deg);display:inline-block}

        /* ---- masthead and the four steps, one band ---- */
        /* The masthead gives up width to the steps and the gap narrows. Four
           columns of centred prose live or die on measure, and every pixel
           taken from here goes straight into theirs. */
        .fk-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.2fr);
          gap:39.1px;align-items:start}
        .fk-kicker{font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;
          color:var(--fk-ink-soft);font-weight:600;margin-bottom:17px}
        .fk h2{font-family:var(--fk-display);font-weight:600;color:var(--fk-ox);
          font-size:clamp(32.3px,3.48vw,52.7px);line-height:.98;letter-spacing:.015em;
          text-transform:uppercase;margin-bottom:17px}
        .fk-mark{display:flex;align-items:center;gap:10.2px;margin-bottom:17px}
        .fk-mark i{height:1px;width:34px;background:var(--fk-ox);opacity:.7;display:block}
        .fk-lede{font-size:17.5px;line-height:1.62;color:var(--fk-ink-soft);max-width:44ch}

        /* Four columns divided by three hairlines. The rule is on the left of
           each step and suppressed on the first, so the band has no outer
           border and does not become a box. */
        .fk-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
        .fk-step{text-align:center;padding:0 11.9px;border-left:1px solid var(--fk-line-soft)}
        .fk-step:first-child{border-left:0}
        .fk-num{font-family:var(--fk-display);font-size:22.1px;font-weight:600;
          color:var(--fk-ox);line-height:1;margin-bottom:11.9px}
        /* multiply, not a mask: the emblems are drawn on their own cream ground
           and this drops that ground into the parchment without an alpha
           channel to maintain. */
        .fk-icon{height:62.9px;width:auto;display:block;margin:0 auto 13.6px;
          mix-blend-mode:multiply}
        .fk-step h3{font-family:var(--fk-display);font-weight:600;font-size:18.5px;
          line-height:1.1;letter-spacing:.14em;text-transform:uppercase;
          color:var(--fk-ink);margin-bottom:10.2px}
        .fk-step-dia{width:5.1px;height:5.1px;opacity:.85;margin:0 auto 11.9px;display:block}
        /* Centred text has a ragged edge on BOTH sides, so it costs more per
           line than flush-left does and punishes a short measure twice over.
           At 11.5px in 134.3px this ran five choppy lines per step. Bigger type
           in a wider column, on copy cut to about eleven words, lands each of
           them in three. */
        .fk-step p{font-size:16px;line-height:1.62;color:var(--fk-ink-soft);
          max-width:161.5px;margin:0 auto}

        /* ---- the inscribed divider, which now names what follows ---- */
        /* Same knockout as .fk-close, and the same rule about it: the text sits
           on .fk-choose-t, never on a bare descendant selector, so the diamond
           below can never be caught by it. */
        .fk-choose{position:relative;height:1px;background:var(--fk-line);margin:34px 0 0}
        .fk-choose-t{position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%);background:var(--fk-parch);padding:0 17px;
          font-size:12px;letter-spacing:.2em;text-transform:uppercase;
          color:var(--fk-ox);font-weight:600;white-space:nowrap}
        .fk-choose-dia{text-align:center;margin:22.1px 0 37.4px}
        .fk-choose-dia .fk-dia{width:8.5px;height:8.5px;opacity:.95}

        /* ---- solo / rivalry ---- */
        /* stretch, not start: the gutter column has to be as tall as the panels
           for its rule to run their full height. */
        .fk-paths{display:grid;grid-template-columns:minmax(0,1fr) 81.6px minmax(0,1fr);
          align-items:stretch}
        .fk-path{text-align:center}
        /* ── A SELECTOR TRAP THAT COST THE WHOLE SECTION ITS SPACING ──────────
           The page's global stylesheet carries

             .cl-root h1, .cl-root h2, .cl-root h3, .cl-root p, .cl-root dl,
             .cl-root dd, .cl-root figure, .cl-root blockquote, .cl-root ul
               { margin: 0 }

           at specificity (0,1,1), and this section renders inside .cl-root. A
           bare class on a p, h3 or ul is (0,1,0) and LOSES to it, silently: the
           declaration is simply dropped and there is nothing in the source to
           suggest it. Four rules here were being zeroed — .fk-p-name asked for
           20.4px and got 0, .fk-p-def 34 got 0, .fk-p-cap 30 got 0, .fk-p-feat 32
           got 0 AND lost the auto margins that centre it, which is why the
           schedule sat flush left under a centred CTA.

           So every rule in this block that targets a p, h3 or ul is written
           ".fk .fk-x" — (0,2,0), which outranks it. .fk-step h3 and .fk-step p
           were always fine because they were already descendant selectors; that
           is why only the panel styles were affected.

           Check computed margins against the live page, not the source, when
           adding anything here. ───────────────────────────────────────────────

           HIERARCHY. Name, definition, plate, statement, schedule, way in. The
           plate is the third thing, not the first — it reinforces a choice the
           type has already made legible. Every gap below is in the 24-34px
           band; the section should read as unhurried.

           A terms block used to sit between the definition and the plate,
           stating the contract in three phrases. It repeated three of the four
           schedule items almost verbatim a couple of hundred pixels away, which
           read as repetition rather than as the summary/schedule convention it
           was meant to be. One list, and it is the one under the plate where it
           can be compared across the gutter. */
        .fk .fk-p-name{font-family:var(--fk-display);font-weight:600;
          font-size:clamp(25.5px,2.3vw,34px);line-height:1;letter-spacing:.09em;
          text-transform:uppercase;color:var(--fk-ox);margin-bottom:20.4px}
        .fk .fk-p-def{font-family:var(--fk-display);font-weight:500;
          font-size:clamp(17.5px,1.5vw,21px);line-height:1.35;color:var(--fk-ink);
          margin-bottom:28.9px}

        /* THE PLATES DISSOLVE INTO THE PAPER. No box, no radius, no vignette,
           no feather. Two layers, each carrying a baked per-pixel alpha mask:

             img        the engraving at full sharpness, masked by *-mask.png.
                        Alpha is exactly 1 across the whole interior, so nothing
                        inside the plate is touched — no blur, no opacity loss.
             ::before   the same file, blurred, masked by *-edge.png, which is a
                        BUMP: zero where the plate is solid, zero where it is
                        gone, non-zero only across the transition. That is what
                        confines the blur to the outermost edge.

           Both multiply, and the two masks are complementary, so ink density
           never doubles up in the middle.

           The masks are generated, not drawn: per-edge base depths that differ
           by 3x, contrast-stretched long-period noise putting two or three
           zones on each edge (some nearly crisp, some dissolving 102px), a
           displaced contour so the boundary itself wanders, mid-frequency
           mottling for pigment loss, low-frequency blooms that move the
           boundary rather than dim it, and high-frequency grit for dry-brush
           breakup at the extreme outside. Two different seeds, and different
           corners opened on each, so the pair never reads as one stamp.

           The three urls come from inline custom properties on .fk-plate. */
        /* 90% of the column: the plates come down about a tenth and the paper
           around them goes up, which is most of what demotes them from hero to
           support. */
        .fk-plate{position:relative;width:90%;margin:0 auto 30.6px}
        .fk-plate img{display:block;width:100%;height:auto;position:relative;
          -webkit-mask-image:var(--pl-mask);mask-image:var(--pl-mask);
          -webkit-mask-size:100% 100%;mask-size:100% 100%;
          -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
          mix-blend-mode:multiply}
        .fk-plate::before{content:"";position:absolute;inset:0;
          background-image:var(--pl);background-size:100% 100%;
          background-repeat:no-repeat;filter:blur(3.4px);
          -webkit-mask-image:var(--pl-edge);mask-image:var(--pl-edge);
          -webkit-mask-size:100% 100%;mask-size:100% 100%;
          -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
          mix-blend-mode:multiply;pointer-events:none}

        /* Roman, not italic. The captions state a fact about the contract now
           rather than speaking in the operator's voice, and italic was doing
           the voice. */
        .fk .fk-p-cap{font-family:var(--fk-display);font-weight:500;
          font-size:clamp(18.7px,1.7vw,23px);line-height:1.35;color:var(--fk-ink);
          margin-bottom:25.5px}

        /* The schedule. Two columns, mono, small and quiet — it is there to be
           compared across the gutter at a glance, not read as prose. The rules
           above and below hold it as one block without boxing it.

           340px, not 330: the longest item is WINNER TAKES ESCROW, which needs
           about 140.2px set like this. At 330 it wrapped to two lines, which made
           the rivalry schedule a row taller than solo's and pushed the two CTAs
           out of line with each other — the one alignment in the section a
           reader is guaranteed to notice, because the buttons sit side by side.
           nowrap keeps that honest if the copy grows.

           SELECTOR: .fk .fk-p-feat, not .fk-p-feat. See the note at the top of
           the panel styles — a bare class on a ul loses its margins here, and
           the auto margins are what centre this block. */
        .fk .fk-p-feat{list-style:none;display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:11px 18.7px;text-align:left;margin:0 auto 27.2px;max-width:340px;
          padding:18.7px 0;border-top:1px solid var(--fk-line-soft);
          border-bottom:1px solid var(--fk-line-soft)}
        /* 10.2px, not 10.5, and the tracking eased with it. This is the smallest
           type in the section and it was set in the lowest-contrast colour;
           both of those are fixed rather than one. */
        .fk .fk-p-feat li{font-family:var(--fk-mono);font-size:13px;line-height:1.6;
          letter-spacing:.06em;text-transform:uppercase;color:var(--fk-muted);
          display:flex;align-items:baseline;gap:7.6px;
          /* WRAPS NOW, and that is the trade for the larger size. These sat at
             10.2px with nowrap, which fitted the 161px column exactly and was
             the least readable text in the section. At 13px the longest label
             measures 183px against that column, so holding one line would mean
             going back to a size nobody can read. Wrapping to a second line at
             1.6 leading costs a few pixels of card height and nothing else. */
          white-space:normal}
        .fk .fk-p-feat li::before{content:"\\2713";color:var(--fk-ox);
          font-size:11.5px;flex:0 0 auto;opacity:.85}

        .fk-p-cta{background:none;border:0;cursor:pointer;padding:0;
          font-family:var(--fk-mono);font-size:11.5px;letter-spacing:.18em;
          text-transform:uppercase;font-weight:500;color:var(--fk-ink);
          display:inline-flex;align-items:center;gap:8.5px;
          transition:color 200ms ease}
        .fk-arw{color:var(--fk-ox);display:inline-block;transition:transform 200ms ease}
        .fk-p-cta:hover{color:var(--fk-ox)}
        .fk-p-cta:hover .fk-arw{transform:translateX(3.4px)}
        .fk-p-cta:focus-visible{outline:2px solid var(--fk-ox);outline-offset:3.4px}

        /* The gutter. A full-height rule dividing the two panels, with OR on
           the plates' centre line between two diamonds. It carries more weight
           than it did — 2px rather than 1, a wider column, and the ornament —
           because it is the moment the section is actually about.

           THE TWO OFFSETS ARE SET BY JS, not by hand. Nothing in this column
           can derive where the plates start and stop: that lives in the sibling
           columns, and it moves with the copy, the breakpoint and the fonts.
           Three previous passes hard-coded pixels here and all three went stale
           the next time the panels changed. syncGutter() measures instead. The
           values below are the no-JS fallback and only need to be plausible. */
        .fk-or{position:relative;--or-drop:255px;--or-line-end:161.5px}
        .fk-or::before{content:"";position:absolute;top:0;bottom:var(--or-line-end);
          left:50%;transform:translateX(-50%);width:2px;background:var(--fk-line)}
        /* .fk-or .fk-or-mark, not .fk-or-mark: the ornament is a bare <span>,
           and a single class loses to any ".fk-or span" style — which is
           exactly the rule this replaced. Two classes puts it out of reach. */
        .fk-or .fk-or-mark{position:absolute;left:50%;top:var(--or-drop);
          transform:translate(-50%,-50%);background:var(--fk-parch);
          padding:11.9px 5.1px;display:flex;flex-direction:column;align-items:center;
          gap:10.2px;margin:0}
        .fk-or .fk-or-mark b{font-family:var(--fk-mono);font-size:10px;
          letter-spacing:.22em;text-transform:uppercase;color:var(--fk-ox);
          font-weight:500}
        .fk-or .fk-or-mark .fk-dia{width:6.8px;height:6.8px;opacity:.9}

        /* ---- the closing inscription, knocked out of a rule ---- */
        /* The knockout is on .fk-close-t, NOT on ".fk-close span". That
           descendant selector also matched the two .fk-dia spans INSIDE the
           line: both were absolutely positioned to the same centre, given 18.7px
           of padding and a parchment background, and painted a 37.4px block over
           the word VOTING. Anything nested here must not be reachable by the
           knockout's own selector. */
        .fk-close{position:relative;height:1px;background:var(--fk-line);margin-top:35.7px}
        .fk-close-t{position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%);background:var(--fk-parch);padding:0 18.7px;
          font-size:13.5px;letter-spacing:.15em;text-transform:uppercase;
          color:var(--fk-ink);font-weight:600;white-space:nowrap;
          display:flex;align-items:center;gap:13.6px}

        /* ---- motion: one fade and rise, nothing else ---- */
        @media (prefers-reduced-motion:no-preference){
          .fk-step,.fk-path{opacity:0;transform:translateY(10.2px);
            transition:opacity 700ms ease,transform 700ms cubic-bezier(.22,1,.36,1);
            transition-delay:calc(var(--i,0) * 90ms)}
          .fk-in .fk-step,.fk-in .fk-path{opacity:1;transform:none}
        }

        @media (max-width:1180px){
          .fk-wrap{padding:54.4px 37.4px 44.2px}
          .fk-top{grid-template-columns:minmax(0,1fr);gap:37.4px}
          .fk-lede{max-width:none}
          .fk-step{padding:0 8.5px}
          .fk-paths{grid-template-columns:minmax(0,1fr) 61.2px minmax(0,1fr)}
          /* No gutter offsets here — syncGutter() measures them per breakpoint. */
        }
        /* Phone. Two by two rather than four across — a single column puts a
           couple of hundred pixels of scrolling between CONNECT and SETTLE and
           loses the sense that they are one sequence. The steps in the second
           row need their own top hairline, and the third step starts that row,
           so its left border is the one to drop. */
        @media (max-width:760px){
          .fk-wrap{padding:44.2px 20.4px 37.4px}
          .fk-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:25.5px}
          .fk-step{padding:0 10.2px}
          .fk-step:nth-child(3){border-left:0}
          .fk-step:nth-child(n+3){padding-top:25.5px;border-top:1px solid var(--fk-line-soft)}
          .fk-icon{height:51px}
          .fk-step h3{font-size:16.5px}
          /* A half-width phone column is a wider measure than the desktop
             quarter, so this can hold full size rather than shrink. */
          .fk-step p{font-size:15px;max-width:none}
          .fk-choose{margin-top:27.2px}
          .fk-choose-t{font-size:11.5px;letter-spacing:.14em;padding:0 11.9px}
          .fk-choose-dia{margin:15.3px 0 20.4px}

          /* The gutter cannot be a column once the paths stack, so it becomes a
             rule between them with OR on it — the same idea turned 90 degrees. */
          .fk-paths{grid-template-columns:minmax(0,1fr);row-gap:0}
          .fk-or{margin:37.4px 0;height:2px;background:var(--fk-line);display:block;
            position:relative}
          .fk-or::before{display:none}
          .fk-or .fk-or-mark{position:absolute;left:50%;top:50%;
            transform:translate(-50%,-50%);flex-direction:row;gap:11.9px;
            padding:0 15.3px}
          .fk .fk-p-name{margin-bottom:15.3px}
          .fk .fk-p-def{margin-bottom:23.8px}
          .fk-plate{width:100%;margin-bottom:23.8px}
          .fk .fk-p-cap{margin-bottom:20.4px}
          .fk .fk-p-feat{max-width:none;gap:8.5px 15.3px;padding:15.3px 0;margin-bottom:22.1px}
          /* nowrap exists to keep the two schedules the same height so the CTAs
             line up, and that only matters while the panels are side by side.
             Stacked, a wrap costs nothing — and the longest item needs 141.1px in
             a 141.1px column here, which is no margin at all if the mono face is
             slow and a fallback measures wider. */
          .fk .fk-p-feat li{white-space:normal;letter-spacing:.03em;font-size:12px}
          /* The knockout needs one unbroken line, and this one is 38 characters
             — it does not fit a phone at any size worth reading. So the rule
             goes and the inscription becomes plain centred text that may wrap,
             rather than shrinking to 8.5px to defend a hairline nobody will
             miss. */
          .fk-close{margin-top:30.6px;height:auto;background:none}
          .fk-close-t{position:static;transform:none;display:block;
            white-space:normal;padding:0;font-size:11.5px;letter-spacing:.1em;
            line-height:1.7}
        }
        @media (max-width:768px){
          .fk{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){.fk *{transition:none !important}}
        </style>

        <section class="fk" id="fk-section" aria-labelledby="fk-title">
            <div class="fk-wrap">
                <div class="fk-top">
                    <div>
                        <div class="fk-kicker">How it settles</div>
                        <h2 id="fk-title">Who holds<br />you to it</h2>
                        <div class="fk-mark" aria-hidden="true"><span class="fk-dia"></span><i></i></div>
                        <p class="fk-lede">Every contract runs the same four steps. Only one of them
                            gives you a choice &mdash; whether you're staking against your own record,
                            or against someone who wants it as badly as you claim to.</p>
                    </div>
                    <div class="fk-steps">${STEPS.map(renderStep).join('')}
                    </div>
                </div>

                <div class="fk-choose">
                    <span class="fk-choose-t">Choose your contract</span>
                </div>
                <div class="fk-choose-dia" aria-hidden="true"><span class="fk-dia"></span></div>

                <div class="fk-paths">${renderPath(PATHS[0], onSelectPath, 4)}
                        <div class="fk-or" aria-hidden="true"><span class="fk-or-mark"><i class="fk-dia"></i><b>Or</b><i class="fk-dia"></i></span></div>${renderPath(PATHS[1], onSelectPath, 5)}
                </div>

                <div class="fk-close">
                    <span class="fk-close-t"><span class="fk-dia" aria-hidden="true"></span> No judges. No voting. Only the record. <span class="fk-dia" aria-hidden="true"></span></span>
                </div>
            </div>
        </section>
    `;
}

/**
 * Reveals the steps and plates when the section is reached. Safe to call when
 * the section is absent.
 *
 * IntersectionObserver rather than a scroll handler, and it disconnects on the
 * first hit — this fires once and then costs nothing. With no observer, or when
 * the reader has asked for reduced motion, the class goes on immediately and
 * everything is simply present.
 */
/**
 * Puts the gutter's rule and its OR ornament onto the plates.
 *
 * The gutter is its own grid column and cannot see where the plates begin or
 * end — that lives in the sibling columns, and it moves with the copy, the
 * breakpoint, the plate proportions and whether the webfonts have landed. Three
 * passes hard-coded pixels here and all three went stale the next time the
 * panels changed, so it measures now.
 *
 * --or-drop     the plates' vertical centre, from the top of the row.
 * --or-line-end how much of the row sits BELOW the plates, which is where the
 *               rule stops: it divides the artwork, not the schedules.
 *
 * Above the stacking breakpoint only. Once the paths stack the gutter is a
 * horizontal rule and the CSS handles it.
 */
function syncGutter(section) {
    const or = section.querySelector('.fk-or');
    const plate = section.querySelector('.fk-plate');
    if (!or || !plate) return;

    if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
        or.style.removeProperty('--or-drop');
        or.style.removeProperty('--or-line-end');
        return;
    }
    const o = or.getBoundingClientRect();
    const p = plate.getBoundingClientRect();
    if (!o.height || !p.height) return;

    or.style.setProperty('--or-drop', `${Math.round(p.top + p.height / 2 - o.top)}px`);
    or.style.setProperty('--or-line-end', `${Math.round(o.bottom - p.bottom)}px`);
}

export function initForkSection() {
    const section = document.getElementById('fk-section');
    if (!section) return;

    syncGutter(section);
    /* The plates are lazy and the webfonts are swapped in, and both change the
       row height after first paint. Re-measure when either lands. */
    section.querySelectorAll('.fk-plate img').forEach((img) => {
        if (img.complete) return;
        img.addEventListener('load', () => syncGutter(section), { once: true });
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => syncGutter(section)).catch(() => {});
    }
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => syncGutter(section));
        ro.observe(section);
    } else {
        window.addEventListener('resize', () => syncGutter(section));
    }

    const reduce = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
        section.classList.add('fk-in');
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            section.classList.add('fk-in');
            io.disconnect();
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(section);
}
