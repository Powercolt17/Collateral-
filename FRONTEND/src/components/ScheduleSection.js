/**
 * Collateral — "Everything a contract does to your money".
 *
 * BUILT ON A SUPPLIED HTML SHEET. No React here, so the sheet becomes a render
 * function and its inline script becomes initScheduleSection.
 *
 * ── DO NOT PUT A BACKTICK IN THESE CSS COMMENTS ──────────────────────────────
 * The style block is inside a template literal; one backtick kills the page.
 *
 * ── THE DESIGN IS THE SHEET'S. THE CONTENT IS THE PAGE'S, DELIBERATELY ───────
 * The sheet ships five questions in two groups under a lede that reads "Nine
 * clauses". Shipping it as authored would have put a visible miscount at the
 * top of the section, and would have deleted four answers.
 *
 * It would also have traded down on substance. Where both versions answer the
 * same question the existing copy is materially more specific, and the API
 * clause is the clearest case:
 *
 *   sheet     "Settlement waits for the next clean oracle read. The clock
 *              pauses rather than resolving on missing or partial data."
 *   existing  "Settlement waits for the next successful read within a 72-hour
 *              grace window. If the platform still has not reported by then,
 *              the contract voids and your deposit returns in full."
 *
 * One states a posture; the other states a term someone could hold us to. All
 * nine existing clauses are carried over verbatim, grouped into the sheet's
 * numbered-schedule structure.
 *
 * ONE CLAUSE WAS NOT TAKEN FROM THE SHEET ON PURPOSE. Its § 1.2 reads "No one
 * at Collateral reviews, approves, or can override the result." Verification is
 * automatic, but DISBURSEMENT is manually gated — which is why every other
 * surface on this site says funds are released "after review, typically within
 * one business day". "Approves" reads across both, so the sheet's wording
 * contradicts copy that was already corrected. The existing answer is kept: it
 * speaks to who judges the target, which is the question actually asked.
 *
 * ── THE DUPLICATE id="terms" IS RESOLVED HERE ────────────────────────────────
 * This section and the calculator both carried id="terms", which is invalid and
 * means getElementById returns whichever comes first. Checked for inbound links
 * before changing it: nothing in src/ targets #terms except a comment in
 * LandingStyles. This section is now id="faq"; the calculator keeps #terms.
 *
 * ── SCOPING ──────────────────────────────────────────────────────────────────
 * The sheet styles bare *, body, h1, .section, .grid, .left, .group, .note and
 * .body — .body and .note alone would reach other sections. Namespaced under
 * .sch. It is an h2, not the sheet's h1.
 *
 * The accordion is the same grid-template-rows 0fr to 1fr technique used in the
 * drawer, and it carries the same requirement: the padding lives on the INNER
 * element, never on the animated row or the grid item, or the panel refuses to
 * collapse past its own padding.
 */

const GROUPS = [
    {
        label: '§ 1 &middot; Custody',
        items: [
            {
                q: 'What happens to my deposit?',
                a: 'It moves to a third-party custodian on Stripe Connect the moment the contract opens. Collateral never holds it. Hit your target and it returns to your card with the matched payout. Miss, and it settles to the forfeiture pool.',
            },
            {
                q: 'Who decides whether I hit the target?',
                a: 'The API you named in the contract. Collateral reads the same numbers your platform already reports, on the cadence listed in the register, and settles on whatever it finds. Nobody here reviews your work, and neither you nor a counterparty gets a vote.',
            },
            {
                q: 'What if the API is down at settlement?',
                a: 'Settlement waits for the next successful read within a 72-hour grace window. If the platform still has not reported by then, the contract voids and your deposit returns in full. A broken oracle is never treated as a miss.',
            },
        ],
    },
    {
        label: '§ 2 &middot; The Window',
        items: [
            {
                q: 'Can I move the deadline?',
                a: 'No. The date is fixed when the contract opens and cannot be extended, paused, or renegotiated by either party. That constraint is the product.',
            },
            {
                q: 'Can I cancel?',
                a: 'Within one hour of opening, yes, in full. After that the deposit is committed until the window closes.',
            },
        ],
    },
    {
        label: '§ 3 &middot; Settlement',
        items: [
            {
                q: 'Where does forfeited money go?',
                a: 'Into the pool that funds matched payouts for people who hit their targets in the same period. Your miss pays someone else&rsquo;s win. Collateral takes a fee on settled contracts, disclosed before you sign, and takes nothing from the pool itself.',
            },
            {
                q: 'Is this gambling?',
                a: 'The outcome depends on your own conduct against a target you set, measured by a source you nominate &mdash; not on chance or on an event outside your control. That is the distinction regulators draw, and it is why Collateral is not a broker, dealer, or exchange. It is also why we cannot promise you a return.',
            },
        ],
    },
    {
        label: '§ 4 &middot; Your Accounts',
        items: [
            {
                q: 'What can Collateral see on my accounts?',
                a: 'Read-only scopes on the specific metrics listed in your contract, and nothing else. Collateral cannot post, message, refund, or change a setting on any account you connect, and you can revoke the token at any time without affecting an open contract&rsquo;s settlement.',
            },
            {
                q: 'What if I disconnect the platform mid-contract?',
                a: 'The contract settles as a miss at the end of its window. Disconnecting removes the only source of truth it has, and an unverifiable target is treated the same as an unmet one. Reconnect before the window closes and settlement proceeds normally.',
            },
        ],
    },
];

export function renderScheduleSection() {
    let n = 0;
    const groups = GROUPS.map((g, gi) => {
        const rows = g.items.map((it, ii) => {
            const id = 'sch-a-' + (++n);
            const open = gi === 0 && ii === 0;
            return `
                    <div class="sch-qa${open ? ' is-open' : ''}">
                        <button type="button" class="sch-qrow" aria-expanded="${open}" aria-controls="${id}">
                            <span class="sch-qnum">&sect; ${gi + 1}.${ii + 1}</span>
                            <span class="sch-qtext">${it.q}</span>
                            <span class="sch-ic" aria-hidden="true"></span>
                        </button>
                        <div class="sch-wrap" id="${id}" role="region">
                            <div class="sch-inner"><div class="sch-ans">${it.a}</div></div>
                        </div>
                    </div>`;
        }).join('');
        return `
                <div class="sch-group">
                    <div class="sch-glabel">${g.label}</div>
                    ${rows}
                </div>`;
    }).join('');

    return `
        <style>
        .sch{
          --parch:#F1E8D3; --ink:#211B12; --ink-soft:#5B5140; --muted:#9A8C6F;
          --ox:#7C1D2B; --line:rgba(60,48,30,.16); --line-soft:rgba(60,48,30,.10);
          --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
          --serif:"EB Garamond",Georgia,serif;
          --display:"Cormorant Garamond",Georgia,serif;
          width:100%;max-width:1440px;margin:0 auto;padding:76px 90px 80px;
          background:var(--parch);color:var(--ink);font-family:var(--serif);
          -webkit-font-smoothing:antialiased;
        }
        .sch *{box-sizing:border-box;margin:0;padding:0}
        .sch-grid{display:grid;grid-template-columns:.72fr 1.28fr;gap:80px;align-items:start}
        .sch-left{position:sticky;top:60px}

        .sch-kicker{display:flex;align-items:center;gap:12px;font-family:var(--mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--ox);
          font-weight:500;margin-bottom:22px}
        .sch-kicker i{height:1px;width:26px;background:var(--ox);opacity:.7;flex:none}
        .sch h2{font-family:var(--display);font-weight:600;font-size:48px;line-height:1.04;
          color:var(--ink);margin-bottom:24px;max-width:420px}
        .sch-lede{font-size:18px;line-height:1.6;color:var(--ink-soft);max-width:400px}
        .sch-note{margin-top:40px;padding-top:22px;border-top:1px solid var(--line);max-width:400px}
        .sch-nl{font-family:var(--mono);font-size:11px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--ox);font-weight:500;margin-bottom:10px}
        .sch-nt{font-family:var(--mono);font-size:12px;line-height:1.7;letter-spacing:.02em;
          text-transform:uppercase;color:var(--muted)}

        .sch-glabel{font-family:var(--mono);font-size:11px;letter-spacing:.22em;
          text-transform:uppercase;color:var(--muted);font-weight:500;
          padding-bottom:14px;border-bottom:2px solid var(--ink)}
        .sch-group + .sch-group{margin-top:44px}

        .sch-qa{border-bottom:1px solid var(--line-soft)}
        .sch-qrow{display:grid;grid-template-columns:66px 1fr 24px;align-items:center;
          gap:14px;padding:24px 2px;cursor:pointer;background:none;border:0;width:100%;
          text-align:left;font-family:inherit;color:inherit}
        .sch-qrow:focus-visible{outline:2px solid var(--ox);outline-offset:-2px}
        .sch-qnum{font-family:var(--mono);font-size:12px;color:var(--ox);letter-spacing:.02em}
        .sch-qtext{font-family:var(--display);font-size:22px;font-weight:600;color:var(--ink);
          letter-spacing:.01em;transition:color .2s ease}
        .sch-qa.is-open .sch-qtext{color:var(--ox)}
        .sch-ic{position:relative;width:16px;height:16px;justify-self:end}
        .sch-ic::before,.sch-ic::after{content:"";position:absolute;background:var(--ink-soft);
          transition:transform .3s cubic-bezier(.22,1,.36,1),background-color .2s ease}
        .sch-ic::before{top:7px;left:0;width:16px;height:2px}
        .sch-ic::after{left:7px;top:0;width:2px;height:16px}
        .sch-qa.is-open .sch-ic::after{transform:scaleY(0)}
        .sch-qa.is-open .sch-ic::before,.sch-qa.is-open .sch-ic::after{background:var(--ox)}

        /* 0fr to 1fr animates to the answer's real height without anyone
           hardcoding it. The padding MUST sit on .sch-inner: on the row or on
           the grid item it is added outside the animated track and the panel
           never collapses past it. That was measured the hard way in the
           navigation drawer. */
        .sch-wrap{display:grid;grid-template-rows:0fr;
          transition:grid-template-rows .42s cubic-bezier(.22,1,.36,1)}
        .sch-qa.is-open .sch-wrap{grid-template-rows:1fr}
        .sch-inner{overflow:hidden;min-height:0}
        .sch-ans{padding:0 90px 26px 80px;font-size:16.5px;line-height:1.65;
          color:var(--ink-soft);max-width:640px}

        @media (max-width:1100px){
          .sch{padding:60px 40px 60px}
          .sch-grid{gap:48px}
          .sch h2{font-size:38px}
          .sch-ans{padding-right:40px}
        }
        @media (max-width:820px){
          .sch{padding:48px 20px 44px}
          /* The left column stops being sticky before it stacks: a sticky block
             above the content it describes pins the heading over the answers. */
          .sch-grid{grid-template-columns:1fr;gap:34px}
          .sch-left{position:static}
          .sch h2{font-size:30px;max-width:none}
          .sch-lede,.sch-note{max-width:none}
          .sch-qrow{grid-template-columns:52px 1fr 18px;gap:10px;padding:20px 2px}
          .sch-qtext{font-size:18px}
          .sch-qnum{font-size:11px}
          /* 80px of indent on a 320px screen leaves 200px of measure. */
          .sch-ans{padding:0 0 22px 52px;font-size:15.5px}
        }
        @media (prefers-reduced-motion:reduce){
          .sch-wrap,.sch-ic::before,.sch-ic::after,.sch-qtext{transition:none}
        }
        </style>

        <section class="sch" id="faq" aria-labelledby="sch-h">
            <div class="sch-grid">
                <div class="sch-left">
                    <div class="sch-kicker"><i aria-hidden="true"></i> Schedule of Common Questions</div>
                    <h2 id="sch-h">Everything a contract does to your money</h2>
                    <p class="sch-lede">Nine clauses covering custody, the window, settlement, and what Collateral can see on the accounts you connect.</p>
                    <div class="sch-note">
                        <div class="sch-nl">Clerk&rsquo;s Note</div>
                        <div class="sch-nt">If a question is not answered here, it is answered in the full terms. Nothing material is kept off this page.</div>
                    </div>
                </div>
                <div class="sch-right">${groups}</div>
            </div>
        </section>
    `;
}

/**
 * Accordion. One listener on the container rather than one per row, and the
 * aria-expanded state is kept in step with the class — the sheet's script
 * toggled only the class, which leaves a screen reader announcing every panel
 * as collapsed no matter what is on screen.
 */
export function initScheduleSection() {
    const root = document.getElementById('faq');
    if (!root) return;

    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.sch-qrow');
        if (!btn || !root.contains(btn)) return;
        const qa = btn.parentElement;
        const open = qa.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
    });
}
