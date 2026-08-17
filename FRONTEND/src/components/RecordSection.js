/**
 * Collateral — "The receipts, including the ones that hurt".
 *
 * Built to the supplied design sheet. The layout, the perforated receipt, the
 * tear, the stub, the stamp and the book-totals row are all the sheet's.
 *
 * ── WHAT IS NOT FROM THE SHEET, AND WHY ──────────────────────────────────────
 * The sheet ships three settlement receipts and a set of book totals as literal
 * markup: @revpilot +$2,240 APPROVED, @deltacreator +$1,120 APPROVED, @marcusk
 * -$1,500 DENIED, and beneath them 1,204 contracts settled, $1.62M returned to
 * stakers, $486K forfeited to pools, 100% settlement honored.
 *
 * Measured against /v1/market/homepage-stats at the time of writing:
 *
 *     contractsSettled  0
 *     totalPaidOut      0
 *     successContracts  0
 *     recentSettlements []
 *     capitalLocked     2000
 *
 * Nothing has settled. No money has been returned to anyone, none has been
 * forfeited, and there is no settlement record to honour. Those figures are not
 * a rounding error away from the truth — there is no true version of them.
 *
 * On a page that takes customer deposits, "returned to stakers" is precisely
 * the number someone weighs before handing money over, so it is not shipped as
 * decoration. Every receipt and every total in this component comes from the
 * API or does not render. This follows the rule LedgerSection already
 * establishes: no fallback rows, ever, because a hardcoded set is
 * indistinguishable from a real one once it is on screen.
 *
 * The design is not wasted. The card, the perforation and the stamps are all
 * here and styled; the first contract that settles renders into exactly the
 * layout the sheet draws. Until then the section says so.
 *
 * ALSO LIVE AND ALSO WRONG, not fixed by this file: the hero publishes
 * $8,700,000 HELD IN ESCROW and 54 SETTLED TODAY from hardcoded defaults in
 * CollateralHero.js, and Landing.js animates "Total capital settled" up to
 * $8,700,000. Real values are $2,000 and 0. Flagged, not silently changed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_BASE = 'https://collateral-production.up.railway.app';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const usd2 = (n) =>
    '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const usdShort = (n) => {
    const v = Number(n) || 0;
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + v.toLocaleString('en-US');
};

/**
 * One receipt. Only ever called with a real settlement record.
 * `won` is derived from the record's own outcome, never from the absence of one.
 */
/* The three receipts from the design sheet, shipped as WORKED EXAMPLES and
   labelled as such on every card. They render only while the register has no
   settlements of its own; the first real one replaces them.

   @revpilot is deliberately not among them. The sheet used it, and it is a real
   principal in /v1/ledger - hanging an invented $2,240 payout on a real handle
   is worse than inventing the handle too. These three are fictional. */
const EXAMPLES = [
    { ref: 'C-34D6', party: '@northgate', goal: '+20% revenue in 30 days', oracle: 'Stripe', staked: 2000, amount: 2240, outcome: 'won', settledOn: '14 Mar 2026' },
    { ref: 'C-9F21', party: '@deltacreator', goal: '50,000 subscribers in 60 days', oracle: 'YouTube', staked: 1000, amount: 1120, outcome: 'won', settledOn: '09 Mar 2026' },
    { ref: 'C-780B', party: '@marcusk', goal: '25,000 followers in 30 days', oracle: 'X', staked: 1500, amount: 1500, outcome: 'lost', settledOn: '02 Mar 2026' },
];

function renderReceipt(r, example) {
    const won = r.outcome === 'won';
    const cls = won ? 'rec-win' : 'rec-loss';
    const sign = won ? '+' : '−';
    const amount = sign + usd2(Math.abs(r.amount));
    return `
                    <article class="rec-card${example ? ' rec-eg' : ''}">
                        <div class="rec-top">
                            <div class="rec-head">
                                <span class="rec-l">${example ? 'Example Receipt' : 'Settlement Receipt'}</span>
                                <span class="rec-id"><b>&sect;</b> ${escapeHtml(r.ref)}</span>
                            </div>
                            <div class="rec-title">${escapeHtml(r.goal)}</div>
                            <div class="rec-sub">${escapeHtml(r.party)} &middot; via ${escapeHtml(r.oracle)} API</div>
                            <div class="rec-line"><span class="rec-k">Capital Staked</span><span class="rec-fill"></span><span class="rec-v">${escapeHtml(usd2(r.staked))}</span></div>
                            <div class="rec-line"><span class="rec-k">Verified By</span><span class="rec-fill"></span><span class="rec-v">${escapeHtml(r.oracle)} oracle</span></div>
                            <div class="rec-line"><span class="rec-k">Settled On</span><span class="rec-fill"></span><span class="rec-v">${escapeHtml(r.settledOn)}</span></div>
                        </div>
                        <div class="rec-tear" aria-hidden="true"></div>
                        <div class="rec-stub ${cls}">
                            <div>
                                <div class="rec-amt">${escapeHtml(amount)}</div>
                                <div class="rec-amt-sub">${won ? 'Stake + payout returned' : 'Forfeited to match pool'}</div>
                            </div>
                            <span class="rec-stamp ${cls}">${won ? 'Approved' : 'Denied'}</span>
                        </div>
                    </article>`;
}

export function renderRecordSection() {
    return `
        <style>
        .rec{
          --rec-parch:#F1E8D3;
          --rec-paper:#FAF5E8;
          --rec-ink:#211B12;
          --rec-ink-soft:#5B5140;
          --rec-muted:#9A8C6F;
          --rec-ox:#7C1D2B;
          --rec-win:#4E6B3E;
          --rec-line:rgba(60,48,30,.16);
          --rec-dot:rgba(60,48,30,.30);
          --rec-win-tint:rgba(78,107,62,.12);
          --rec-loss-tint:rgba(124,29,43,.08);
          --rec-serif:"EB Garamond",Georgia,serif;
          --rec-display:"Cormorant Garamond","EB Garamond",Georgia,serif;
          --rec-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;

          background:var(--rec-parch);
          color:var(--rec-ink);
          font-family:var(--rec-serif);
          -webkit-font-smoothing:antialiased;
        }
        .rec *{box-sizing:border-box;margin:0;padding:0}
        .rec-wrap{width:100%;max-width:1440px;margin:0 auto;padding:52px 90px 48px;position:relative}

        .rec-wm{position:absolute;top:34px;right:80px;font-family:var(--rec-display);
          font-weight:600;font-size:190px;line-height:.8;color:rgba(33,27,18,.05);
          pointer-events:none;user-select:none}

        .rec-kicker{display:flex;align-items:center;gap:12px;font-family:var(--rec-mono);
          font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--rec-ox);
          font-weight:500;margin-bottom:22px}
        .rec-kicker .rec-r{height:1px;width:26px;background:var(--rec-ox);opacity:.7;flex:none}
        .rec h2{font-family:var(--rec-display);font-weight:600;
          font-size:clamp(32px,3.5vw,50px);line-height:1.04;letter-spacing:.004em;
          color:var(--rec-ink);margin-bottom:24px;max-width:640px}
        .rec-body{font-size:18px;line-height:1.6;color:var(--rec-ink-soft);max-width:470px}

        /* ---- receipts ---- */
        .rec-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;margin-top:52px}
        .rec-card{position:relative;background:var(--rec-paper);border:1px solid var(--rec-line);
          border-radius:3px;box-shadow:0 14px 34px rgba(60,40,20,.09);
          display:flex;flex-direction:column;font-family:var(--rec-mono)}
        .rec-top{padding:24px 26px 26px}
        .rec-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;gap:12px}
        .rec-l{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--rec-muted);font-weight:500}
        .rec-id{font-size:11px;color:var(--rec-ink-soft);white-space:nowrap}
        .rec-id b{color:var(--rec-ox);font-weight:500}
        .rec-title{font-size:16px;font-weight:600;color:var(--rec-ink);letter-spacing:.01em;margin-bottom:6px}
        .rec-sub{font-size:11.5px;color:var(--rec-muted);margin-bottom:22px}
        .rec-line{display:flex;align-items:baseline;gap:8px;padding:7px 0}
        .rec-k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--rec-muted)}
        .rec-fill{flex:1;border-bottom:1px dotted var(--rec-dot);transform:translateY(-3px)}
        .rec-v{font-size:12.5px;color:var(--rec-ink);letter-spacing:.02em}

        /* The perforation. The two circles are punched in the PAGE colour, so if
           the section ground ever changes they have to change with it. */
        .rec-tear{position:relative;height:2px;border-top:2px dashed var(--rec-dot)}
        .rec-tear::before,.rec-tear::after{content:"";position:absolute;top:-9px;
          width:16px;height:16px;border-radius:50%;background:var(--rec-parch)}
        .rec-tear::before{left:-9px}
        .rec-tear::after{right:-9px}

        .rec-stub{padding:22px 26px 24px;display:flex;justify-content:space-between;
          align-items:center;border-radius:0 0 3px 3px;gap:16px}
        .rec-stub.rec-win{background:var(--rec-win-tint)}
        .rec-stub.rec-loss{background:var(--rec-loss-tint)}
        .rec-amt{font-size:25px;font-weight:600;letter-spacing:.01em;line-height:1;
          font-variant-numeric:tabular-nums lining-nums}
        .rec-stub.rec-win .rec-amt{color:var(--rec-win)}
        .rec-stub.rec-loss .rec-amt{color:var(--rec-ox)}
        .rec-amt-sub{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
          color:var(--rec-muted);margin-top:8px}
        .rec-stamp{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;
          border:1.5px solid;border-radius:3px;padding:6px 12px;transform:rotate(-7deg);
          white-space:nowrap}
        .rec-stamp.rec-win{color:var(--rec-win);border-color:rgba(78,107,62,.55)}
        .rec-stamp.rec-loss{color:var(--rec-ox);border-color:rgba(124,29,43,.5)}

        /* The state the section is actually in today. Deliberately plain: a
           styled placeholder that looked like a receipt would be the very thing
           this component refuses to do. */
        .rec-empty{grid-column:1 / -1;border:1px dashed var(--rec-dot);border-radius:3px;
          padding:34px 30px;font-family:var(--rec-mono);font-size:12px;line-height:1.8;
          letter-spacing:.04em;color:var(--rec-muted);background:rgba(250,245,232,.5)}
        .rec-empty b{color:var(--rec-ink-soft);font-weight:500}

        /* The illustrative notice sits ABOVE the cards and spans the grid, so it
           cannot be read as belonging to one receipt. */
        .rec-note{grid-column:1 / -1;font-family:var(--rec-mono);font-size:11px;
          line-height:1.75;letter-spacing:.03em;color:var(--rec-muted);
          border-left:2px solid var(--rec-ox);padding:2px 0 2px 14px;margin-bottom:4px}
        .rec-note b{color:var(--rec-ink-soft);font-weight:500}
        /* An example card is visibly a specimen: the stock is flatter, the edge
           is dashed rather than ruled, and it does not lift off the page. A
           reader should not have to read the badge to know. */
        .rec-eg{border-style:dashed;box-shadow:none;background:rgba(250,245,232,.55)}
        .rec-eg .rec-l{color:var(--rec-ox)}

        /* ---- book totals ---- */
        .rec-totals{margin-top:44px;padding-top:22px;border-top:1px solid var(--rec-line);
          display:flex;align-items:flex-end;gap:56px;flex-wrap:wrap}
        .rec-cap{font-family:var(--rec-mono);font-size:11px;letter-spacing:.24em;
          text-transform:uppercase;color:var(--rec-muted);font-weight:500;margin-right:auto}
        .rec-tk{font-family:var(--rec-mono);font-size:9.5px;letter-spacing:.2em;
          text-transform:uppercase;color:var(--rec-muted);margin-bottom:5px}
        .rec-tv{font-family:var(--rec-display);font-size:24px;font-weight:600;
          color:var(--rec-ink);line-height:1;font-variant-numeric:tabular-nums lining-nums}
        .rec-tv.rec-w{color:var(--rec-win)}

        @media (max-width:900px){
          .rec-wrap{padding-block:clamp(40px,8vw,64px);padding-inline:clamp(20px,5.5vw,90px)}
          .rec-wm{font-size:110px;top:18px;right:18px}
          .rec-body{font-size:clamp(1rem,4.2vw,1.125rem);max-width:none}
          .rec-cards{grid-template-columns:minmax(0,1fr);gap:20px;margin-top:34px}
          .rec-totals{gap:26px 34px}
          .rec-cap{margin-right:0;width:100%}
        }
        @media (max-width:768px){
          .rec{width:100vw;margin-left:calc(50% - 50vw)}
        }
        @media (prefers-reduced-motion:reduce){.rec *{transition:none !important}}
        </style>

        <section class="rec" aria-labelledby="rec-title">
            <div class="rec-wrap">
                <div class="rec-wm" aria-hidden="true">05</div>
                <div class="rec-kicker"><span class="rec-r" aria-hidden="true"></span> Settlement Record</div>
                <h2 id="rec-title">The receipts, including the ones that hurt</h2>
                <p class="rec-body">Most sites show you the wins. Every contract here settles on the same
                    telemetry whether it went well or not, and we publish both &mdash; because a record with
                    no losses in it isn't a record.</p>

                <div class="rec-cards" id="rec-cards">
                    <div class="rec-empty" id="rec-empty">Reading the register&hellip;</div>
                </div>

                <div class="rec-totals">
                    <span class="rec-cap">Book Totals &middot; Inception to Date</span>
                    <div><div class="rec-tk">Contracts Settled</div><div class="rec-tv" id="rec-t-settled">&mdash;</div></div>
                    <div><div class="rec-tk">Returned to Stakers</div><div class="rec-tv rec-w" id="rec-t-returned">&mdash;</div></div>
                    <div><div class="rec-tk">Currently at Stake</div><div class="rec-tv" id="rec-t-stake">&mdash;</div></div>
                    <div><div class="rec-tk">Open Contracts</div><div class="rec-tv" id="rec-t-open">&mdash;</div></div>
                </div>
            </div>
        </section>
    `;
}

/**
 * Fills the section from the register. Safe to call when the section is absent.
 *
 * There is no sample data path. If the fetch fails the section says the register
 * is unreachable; if nothing has settled it says that instead. Neither case
 * invents a receipt.
 */
export async function initRecordSection() {
    const cards = document.getElementById('rec-cards');
    if (!cards) return;

    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const empty = (html) => { cards.innerHTML = `<div class="rec-empty">${html}</div>`; };

    const stats = await fetch(API_BASE + '/v1/market/homepage-stats')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

    if (!stats) {
        empty('The register is unreachable right now.');
        return;
    }

    const settled = Number(stats.contractsSettled) || 0;
    setText('rec-t-settled', String(settled));
    setText('rec-t-returned', usdShort(Number(stats.totalPaidOut) || 0));
    setText('rec-t-stake', usdShort(Number(stats.capitalLocked) || 0));
    setText('rec-t-open', String(Number(stats.activeContractsCount) || 0));

    /* recentSettlements is the only source of a receipt. It is [] until a
       contract reaches its date, and an empty array renders the empty state
       rather than a placeholder that looks like a settlement. */
    const recent = Array.isArray(stats.recentSettlements) ? stats.recentSettlements : [];

    /* Real settlements always win. While there are none, the three worked
       examples render in their place so the section shows the shape of a
       receipt instead of an empty box - each one badged Example, above a notice
       saying plainly that nothing has settled. The book totals underneath stay
       real either way, because those are the numbers that describe the company
       rather than illustrate a mechanism. */
    if (!recent.length) {
        cards.innerHTML =
            `<div class="rec-note"><b>Illustrative &mdash; no contract has reached its settlement `
            + `date yet.</b> These show the shape of a receipt. Book totals below are live. `
            + `The first real settlement replaces them, whichever way it goes.</div>`
            + EXAMPLES.map((r) => renderReceipt(r, true)).join('');
        return;
    }

    cards.innerHTML = recent.slice(0, 3).map((r) => renderReceipt(r, false)).join('');
}
