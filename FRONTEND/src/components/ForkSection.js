/**
 * Collateral — "Who holds you to it".
 *
 * EDITORIAL PASS. The brief was to take roughly 40% of the visual noise out and
 * let the type and the plates do the work: no cards, no bordered boxes, no
 * timeline graphic, no connectors, no icons.
 *
 * WHAT WAS REMOVED, which is most of what this file used to be:
 *
 *   the travelling node   four 13px discs on a hairline rail with a staggered
 *                         8s pulse. It was the most SaaS thing on the page — a
 *                         progress tracker for a process nobody is progressing
 *                         through while they read it.
 *   the rail              .fk-steps::before, the 1px line joining the steps.
 *   the two fork cards    panel background, 1px border, 2px top rule, hover lift
 *                         and a 40px shadow. Now two open columns.
 *   the clauses           three bulleted clauses per mode, each with a section
 *                         mark. Replaced by one line per mode.
 *
 * Step copy is cut to a single idea each; the longest is eleven words. Nothing
 * is bold — weight does no work here that size and space cannot do better.
 *
 * ── THE TWO PLATES ─────────────────────────────────────────────────────────
 * Purpose-drawn companions, supplied together:
 *
 *   plate-solo.jpg      one climber, one stair, the temple above him
 *   plate-rivalry.jpg   two climbers on separate stairs, the same temple
 *
 * The subject is the same climb either way, which is the whole argument of the
 * section — the rival does not change the summit, only who else is on the hill.
 *
 * Both are re-encoded to an IDENTICAL 1400x933 frame. The sources differed by a
 * pixel (1536x1024 against 1537x1023); left alone that lands as a half-pixel
 * disagreement in the height of two images sitting side by side, which is
 * exactly the kind of thing that reads as "slightly off" without being
 * findable. Same frame, same quality, so the pair matches by construction.
 *
 * The plates BLEED: no frame, no radius, no shadow. A radial mask dissolves the
 * edges into the parchment, the same gesture the hero uses where its artwork
 * meets the page.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * Everything is under .fk. h2 not h1 — the hero owns the page's h1.
 *
 * ── MOTION ───────────────────────────────────────────────────────────────────
 * One fade and rise on scroll: 700ms, 12px, staggered 90ms. No parallax, no
 * float, no hover gimmick — the links move their arrow 4px and nothing else.
 * Under prefers-reduced-motion everything is simply present.
 */

const STEPS = [
    { n: '01', name: 'Connect', body: 'Live data, read straight from the source. Nothing you type.' },
    { n: '02', name: 'Choose', body: 'Stake against your own record, or against someone else.' },
    { n: '03', name: 'Lock', body: 'Capital sits in escrow until the deadline. No early exit.' },
    { n: '04', name: 'Settle', body: 'The oracle reports. The record updates, permanently.' },
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
        alt: 'Engraving: two figures each carrying a purse up separate stone stairs toward the same temple.',
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
                            <h3>${escapeHtml(step.name)}</h3>
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
                                     loading="lazy" decoding="async" width="1400" height="933" />
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
          --fk-parch:#F1E8D3;
          --fk-ink:#211B12;
          --fk-ink-soft:#5B5140;
          --fk-muted:#9A8C6F;
          --fk-ox:#7C1D2B;
          --fk-line:rgba(60,48,30,.18);
          --fk-serif:"EB Garamond",Georgia,serif;
          --fk-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --fk-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--fk-parch);
          color:var(--fk-ink);
          font-family:var(--fk-serif);
          -webkit-font-smoothing:antialiased;
        }
        .fk *{box-sizing:border-box;margin:0;padding:0}
        /* Deliberately generous. Most of the noise reduction in this pass is
           space rather than deletion. */
        .fk-wrap{width:100%;max-width:1440px;margin:0 auto;padding:104px 90px 96px}

        /* ---- masthead and the four steps, one band ---- */
        .fk-top{display:grid;grid-template-columns:minmax(0,.86fr) minmax(0,1.5fr);
          gap:80px;align-items:start}
        .fk-kicker{font-family:var(--fk-mono);font-size:10px;letter-spacing:.34em;
          text-transform:uppercase;color:var(--fk-muted);margin-bottom:26px}
        .fk h2{font-family:var(--fk-display);font-weight:600;color:var(--fk-ox);
          font-size:clamp(34px,4.4vw,62px);line-height:1.02;letter-spacing:.008em;
          text-transform:uppercase;font-variant:small-caps;margin-bottom:28px}
        /* The only two rules in the section: this one reads as part of the
           masthead, and .fk-div separates the explanation from the plates. */
        .fk-mark{width:54px;height:1px;background:var(--fk-ox);opacity:.5;margin-bottom:26px}
        .fk-lede{font-size:17.5px;line-height:1.62;color:var(--fk-ink-soft);max-width:44ch}

        /* No rail, no nodes, no connectors — the columns are the sequence. */
        .fk-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:44px}
        .fk-step{padding-top:4px}
        .fk-num{font-family:var(--fk-mono);font-size:11px;letter-spacing:.2em;
          color:var(--fk-ox);opacity:.75;margin-bottom:14px}
        .fk-step h3{font-family:var(--fk-display);font-weight:600;font-size:23px;
          line-height:1.1;letter-spacing:.06em;text-transform:uppercase;
          font-variant:small-caps;color:var(--fk-ink);margin-bottom:12px}
        .fk-step p{font-size:14.5px;line-height:1.6;color:var(--fk-ink-soft);max-width:24ch}

        .fk-div{height:1px;background:var(--fk-line);margin:88px 0 78px}

        /* ---- solo / rivalry ---- */
        .fk-paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:88px}
        .fk-path{display:flex;flex-direction:column;align-items:center;text-align:center}
        .fk-p-name{font-family:var(--fk-display);font-weight:600;
          font-size:clamp(26px,2.4vw,34px);line-height:1;letter-spacing:.1em;
          text-transform:uppercase;font-variant:small-caps;color:var(--fk-ink);
          margin-bottom:10px}
        .fk-rival .fk-p-name{color:var(--fk-ox)}
        .fk-p-rule{font-family:var(--fk-mono);font-size:10px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--fk-muted);margin-bottom:30px}

        /* THE PLATES BLEED. No box, no radius, no shadow — the mask dissolves
           all four edges into the parchment. A frame would put the engraving
           behind glass; the brief asked for the opposite. */
        .fk-plate{width:100%;margin-bottom:26px}
        .fk-plate img{display:block;width:100%;height:auto;
          -webkit-mask-image:radial-gradient(118% 108% at 50% 46%,#000 52%,transparent 96%);
          mask-image:radial-gradient(118% 108% at 50% 46%,#000 52%,transparent 96%)}

        .fk-p-cap{font-family:var(--fk-display);font-style:italic;
          font-size:clamp(19px,1.6vw,23px);line-height:1.35;color:var(--fk-ink);
          margin-bottom:22px}
        .fk-p-cta{background:none;border:0;cursor:pointer;padding:0;
          font-family:var(--fk-mono);font-size:10.5px;letter-spacing:.24em;
          text-transform:uppercase;color:var(--fk-ink-soft);transition:color 200ms ease}
        .fk-arw{color:var(--fk-ox);display:inline-block;margin-left:8px;
          transition:transform 200ms ease}
        .fk-p-cta:hover{color:var(--fk-ink)}
        .fk-p-cta:hover .fk-arw{transform:translateX(4px)}
        .fk-p-cta:focus-visible{outline:2px solid var(--fk-ox);outline-offset:4px}

        /* ---- the inscription ---- */
        .fk-close{margin-top:92px;text-align:center;font-family:var(--fk-mono);
          font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;
          color:var(--fk-ox);opacity:.8}

        /* ---- motion: one fade and rise, nothing else ---- */
        @media (prefers-reduced-motion:no-preference){
          .fk-step,.fk-path{opacity:0;transform:translateY(12px);
            transition:opacity 700ms ease,transform 700ms cubic-bezier(.22,1,.36,1);
            transition-delay:calc(var(--i,0) * 90ms)}
          .fk-in .fk-step,.fk-in .fk-path{opacity:1;transform:none}
        }

        @media (max-width:1080px){
          .fk-wrap{padding:76px 44px 72px}
          .fk-top{grid-template-columns:minmax(0,1fr);gap:46px}
          .fk-steps{gap:32px}
          .fk-paths{gap:56px}
        }
        /* Phone. The section frame and heading sizes come from the shared mobile
           pass in views/LandingMobile.js; only what is specific to this layout
           is set here. Two by two rather than four across — a single column puts
           a couple of hundred pixels of scrolling between CONNECT and SETTLE and
           loses the sense that they are one sequence. */
        @media (max-width:760px){
          .fk-steps{grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 22px}
          .fk-step h3{font-size:19px}
          .fk-step p{font-size:13.5px;max-width:none}
          .fk-lede{max-width:none}
          .fk-div{margin:44px 0 40px}
          .fk-paths{grid-template-columns:minmax(0,1fr);gap:48px}
          .fk-p-rule{margin-bottom:22px}
          .fk-close{margin-top:48px;letter-spacing:.3em;font-size:9.5px}
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
                        <div class="fk-mark" aria-hidden="true"></div>
                        <p class="fk-lede">Every contract runs the same four steps. Only one of them
                            gives you a choice &mdash; whether you stake against your own record, or
                            against someone who wants it as badly as you claim to.</p>
                    </div>
                    <div class="fk-steps">${STEPS.map(renderStep).join('')}
                    </div>
                </div>

                <div class="fk-div" aria-hidden="true"></div>

                <div class="fk-paths">${PATHS.map((p, i) => renderPath(p, onSelectPath, i + 4)).join('')}
                </div>

                <div class="fk-close">No judges. No voting. Only the record.</div>
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
