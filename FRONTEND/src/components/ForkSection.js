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
 * The frame is 3:2 because the rivalry plate is. It was 708x332 (2.13:1), and
 * cropping the chariots into that would have taken 151px off the top — which
 * decapitates the temple — and 151px off the bottom, which cuts the two "C"
 * money bags. Both are the subject. Re-framing the PAIR to 3:2 crops neither by
 * more than a pixel, since the solo source is natively 3:2 as well.
 *
 * If the plate proportions change again, the two .fk-or offsets must be
 * re-derived. They are the only geometry in the file that does not follow.
 *
 * Unlike the previous pass these do NOT bleed — the comp frames them as plates
 * with a hard edge and a 2px radius. No mask, no shadow.
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
        key: 'solo', name: 'Solo', rule: 'Stake against your own record.',
        plate: '/assets/images/plate-solo.jpg',
        alt: 'Engraving: a lone figure carrying a purse up a long stone stair toward a temple on the summit.',
        caption: 'I answer to myself.', cta: 'Learn more',
    },
    {
        key: 'rival', name: 'Rivalry', rule: 'Stake against someone else.',
        plate: '/assets/images/plate-rivalry.jpg',
        alt: 'Engraving: two rivals set their purses on a table while a magistrate seals the contract between them.',
        caption: 'We answer to the same rules.', cta: 'Learn more',
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
    return `
                        <div class="fk-path fk-${escapeHtml(path.key)}" style="--i:${i}">
                            <h3 class="fk-p-name">${escapeHtml(path.name)}</h3>
                            <p class="fk-p-rule">${escapeHtml(path.rule)}</p>
                            <div class="fk-plate">
                                <img src="${escapeHtml(path.plate)}" alt="${escapeHtml(path.alt)}"
                                     loading="lazy" decoding="async" width="1000" height="666" />
                            </div>
                            <p class="fk-p-cap">${escapeHtml(path.caption)}</p>
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
          --fk-muted:#8B7E64;
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
        .fk-wrap{width:100%;max-width:1536px;margin:0 auto;padding:72px 62px 56px}

        /* The section's one repeated ornament. Rotated square, not a glyph —
           a real diamond character sits differently in every serif we might
           fall back to. */
        .fk-dia{width:7px;height:7px;background:var(--fk-ox);
          transform:rotate(45deg);display:inline-block}

        /* ---- masthead and the four steps, one band ---- */
        /* The masthead gives up width to the steps and the gap narrows. Four
           columns of centred prose live or die on measure, and every pixel
           taken from here goes straight into theirs. */
        .fk-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.2fr);
          gap:46px;align-items:start}
        .fk-kicker{font-size:11.5px;letter-spacing:.3em;text-transform:uppercase;
          color:var(--fk-ink-soft);font-weight:600;margin-bottom:20px}
        .fk h2{font-family:var(--fk-display);font-weight:600;color:var(--fk-ox);
          font-size:clamp(38px,4.1vw,62px);line-height:.98;letter-spacing:.015em;
          text-transform:uppercase;margin-bottom:20px}
        .fk-mark{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .fk-mark i{height:1px;width:40px;background:var(--fk-ox);opacity:.7;display:block}
        .fk-lede{font-size:17.5px;line-height:1.68;color:var(--fk-ink-soft);max-width:44ch}

        /* Four columns divided by three hairlines. The rule is on the left of
           each step and suppressed on the first, so the band has no outer
           border and does not become a box. */
        .fk-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
        .fk-step{text-align:center;padding:0 14px;border-left:1px solid var(--fk-line-soft)}
        .fk-step:first-child{border-left:0}
        .fk-num{font-family:var(--fk-display);font-size:26px;font-weight:600;
          color:var(--fk-ox);line-height:1;margin-bottom:14px}
        /* multiply, not a mask: the emblems are drawn on their own cream ground
           and this drops that ground into the parchment without an alpha
           channel to maintain. */
        .fk-icon{height:74px;width:auto;display:block;margin:0 auto 16px;
          mix-blend-mode:multiply}
        .fk-step h3{font-family:var(--fk-display);font-weight:600;font-size:20px;
          line-height:1.1;letter-spacing:.14em;text-transform:uppercase;
          color:var(--fk-ink);margin-bottom:12px}
        .fk-step-dia{width:6px;height:6px;opacity:.85;margin:0 auto 14px;display:block}
        /* Centred text has a ragged edge on BOTH sides, so it costs more per
           line than flush-left does and punishes a short measure twice over.
           At 13.5px in 158px this ran five choppy lines per step. Bigger type
           in a wider column, on copy cut to about eleven words, lands each of
           them in three. */
        .fk-step p{font-size:15.5px;line-height:1.68;color:var(--fk-ink-soft);
          max-width:190px;margin:0 auto}

        /* ---- the inscribed divider ---- */
        .fk-div{position:relative;height:1px;background:var(--fk-line);margin:40px 0 36px}
        .fk-div .fk-dia{position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%) rotate(45deg);
          box-shadow:0 0 0 8px var(--fk-parch)}

        /* ---- solo / rivalry ---- */
        .fk-paths{display:grid;grid-template-columns:minmax(0,1fr) 66px minmax(0,1fr);
          align-items:start}
        .fk-path{text-align:center}
        .fk-p-name{font-family:var(--fk-display);font-weight:600;
          font-size:clamp(30px,2.7vw,40px);line-height:1;letter-spacing:.09em;
          text-transform:uppercase;color:var(--fk-ox);margin-bottom:12px}
        .fk-p-rule{font-size:12px;letter-spacing:.16em;text-transform:uppercase;
          color:var(--fk-ink);font-weight:600;margin-bottom:24px}

        /* Framed, not bled. The comp gives these a hard edge; the 2px radius is
           the only softening. */
        .fk-plate{margin-bottom:24px}
        .fk-plate img{display:block;width:100%;height:auto;border-radius:2px;
          mix-blend-mode:multiply}

        .fk-p-cap{font-family:var(--fk-display);font-style:italic;font-weight:500;
          font-size:clamp(22px,2vw,27px);line-height:1.35;color:var(--fk-ink);
          margin-bottom:18px}
        .fk-p-cta{background:none;border:0;cursor:pointer;padding:0;
          font-family:var(--fk-serif);font-size:12px;letter-spacing:.2em;
          text-transform:uppercase;font-weight:600;color:var(--fk-ink);
          display:inline-flex;align-items:center;gap:10px;
          transition:color 200ms ease}
        .fk-arw{color:var(--fk-ox);display:inline-block;transition:transform 200ms ease}
        .fk-p-cta:hover{color:var(--fk-ox)}
        .fk-p-cta:hover .fk-arw{transform:translateX(4px)}
        .fk-p-cta:focus-visible{outline:2px solid var(--fk-ox);outline-offset:4px}

        /* The gutter. This column has no content of its own to size against —
           it is as tall as the label plus whatever we push the label down by —
           so both numbers are set explicitly and both have to be re-derived
           whenever the plate's proportions change.

           --or-drop     pushes OR to 20px ABOVE the plate's vertical middle.
                         Dead centre reads as low, because the mass of type
                         sits above the plate and nothing sits below it.
           --or-line-end how far short of the bottom the hairline stops. Held at
                         roughly 30% of the column height, which lands the line
                         between the panel titles and the top of the plates —
                         a stub marking the split, not a full divider.

           Measured on the deployed page at 1440 and 1085. */
        .fk-or{position:relative;display:flex;align-items:center;justify-content:center;
          --or-drop:238px;--or-line-end:182px}
        .fk-or::before{content:"";position:absolute;top:8px;bottom:var(--or-line-end);
          left:50%;width:1px;background:var(--fk-line)}
        .fk-or span{position:relative;z-index:1;background:var(--fk-parch);
          padding:8px 0;margin-top:var(--or-drop);font-size:11px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--fk-ox);font-weight:600}

        /* ---- the closing inscription, knocked out of a rule ---- */
        /* The knockout is on .fk-close-t, NOT on ".fk-close span". That
           descendant selector also matched the two .fk-dia spans INSIDE the
           line: both were absolutely positioned to the same centre, given 22px
           of padding and a parchment background, and painted a 44px block over
           the word VOTING. Anything nested here must not be reachable by the
           knockout's own selector. */
        .fk-close{position:relative;height:1px;background:var(--fk-line);margin-top:42px}
        .fk-close-t{position:absolute;left:50%;top:50%;
          transform:translate(-50%,-50%);background:var(--fk-parch);padding:0 22px;
          font-size:13px;letter-spacing:.17em;text-transform:uppercase;
          color:var(--fk-ink);font-weight:600;white-space:nowrap;
          display:flex;align-items:center;gap:16px}

        /* ---- motion: one fade and rise, nothing else ---- */
        @media (prefers-reduced-motion:no-preference){
          .fk-step,.fk-path{opacity:0;transform:translateY(12px);
            transition:opacity 700ms ease,transform 700ms cubic-bezier(.22,1,.36,1);
            transition-delay:calc(var(--i,0) * 90ms)}
          .fk-in .fk-step,.fk-in .fk-path{opacity:1;transform:none}
        }

        @media (max-width:1180px){
          .fk-wrap{padding:64px 44px 52px}
          .fk-top{grid-template-columns:minmax(0,1fr);gap:44px}
          .fk-lede{max-width:none}
          .fk-step{padding:0 10px}
          .fk-paths{grid-template-columns:minmax(0,1fr) 48px minmax(0,1fr)}
          /* Narrower columns mean shorter plates, so both gutter offsets come
             down with them. See the note on .fk-or. */
          .fk-or{--or-drop:182px;--or-line-end:143px}
        }
        /* Phone. Two by two rather than four across — a single column puts a
           couple of hundred pixels of scrolling between CONNECT and SETTLE and
           loses the sense that they are one sequence. The steps in the second
           row need their own top hairline, and the third step starts that row,
           so its left border is the one to drop. */
        @media (max-width:760px){
          .fk-wrap{padding:52px 24px 44px}
          .fk-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:30px}
          .fk-step{padding:0 12px}
          .fk-step:nth-child(3){border-left:0}
          .fk-step:nth-child(n+3){padding-top:30px;border-top:1px solid var(--fk-line-soft)}
          .fk-icon{height:60px}
          .fk-step h3{font-size:18px}
          /* A half-width phone column is a wider measure than the desktop
             quarter, so this can hold full size rather than shrink. */
          .fk-step p{font-size:15px;max-width:none}
          .fk-div{margin:32px 0 30px}

          /* The gutter cannot be a column once the paths stack, so it becomes a
             rule between them with OR on it — the same idea turned 90 degrees. */
          .fk-paths{grid-template-columns:minmax(0,1fr);row-gap:0}
          .fk-or{margin:36px 0;height:1px;background:var(--fk-line);display:block;
            position:relative}
          .fk-or::before{display:none}
          .fk-or span{position:absolute;left:50%;top:50%;
            transform:translate(-50%,-50%);margin-top:0;padding:0 18px}
          /* The knockout needs one unbroken line, and this one is 38 characters
             — it does not fit a phone at any size worth reading. So the rule
             goes and the inscription becomes plain centred text that may wrap,
             rather than shrinking to 10px to defend a hairline nobody will
             miss. */
          .fk-close{margin-top:36px;height:auto;background:none}
          .fk-close-t{position:static;transform:none;display:block;
            white-space:normal;padding:0;font-size:12px;letter-spacing:.1em;
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

                <div class="fk-div" aria-hidden="true"><span class="fk-dia"></span></div>

                <div class="fk-paths">${renderPath(PATHS[0], onSelectPath, 4)}
                        <div class="fk-or" aria-hidden="true"><span>Or</span></div>${renderPath(PATHS[1], onSelectPath, 5)}
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
export function initForkSection() {
    const section = document.getElementById('fk-section');
    if (!section) return;

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
