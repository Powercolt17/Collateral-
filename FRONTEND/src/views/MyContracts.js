/**
 * Collateral — "Active Contracts", the operator's own portfolio. /my-contracts
 *
 * ── THE CHECKLIST WAS A DECORATION ───────────────────────────────────────────
 * "Getting Started · 1 OF 4 COMPLETE" shipped as literal markup: a green tick
 * beside Identity Verified, a green tick beside Source Connected, and a
 * progress bar hardcoded to 50% under a label that said 1 of 4. Every visitor
 * was told their identity was verified and a source was attached whether or
 * not either was true, and the bar disagreed with its own caption.
 *
 * On a product whose claim is that nothing on screen is asserted without a
 * record behind it, a fabricated onboarding state is the first thing a new
 * operator sees. Every step now reads real state — the stored identity, the
 * live Plaid/Stripe/Shopify/YouTube status, the contract list — and the count
 * and the bar are computed from the same array, so they cannot disagree again.
 *
 * ── THE PALETTE WAS THE OLD ONE, AND IT WAS GLOBAL ───────────────────────────
 * This file opened with a bare :root block redefining --paper, --ink, --blood
 * and twenty more to the pre-migration blue-grey scheme (#0E1420 ink on a
 * #FFFDF9 plate). :root from a view stylesheet is not scoped to the view — it
 * repainted whatever else was mounted alongside it. It is now the house
 * parchment, scoped under .myc.
 *
 * ── THE SUGGESTIONS ARE TEMPLATES, AND SAY SO ────────────────────────────────
 * The six cards are prompts for the create flow, not contracts anyone holds.
 * They carry no stake, no multiplier, no operator and no progress — nothing
 * that could be mistaken for a record — and each opens the real wizard.
 */

const TEMPLATES = [
    { plat: 'YouTube', cat: 'Creators', title: 'Reach 10,000 subscribers',
      desc: 'Stake on growing your channel to a subscriber milestone, verified at the deadline.',
      src: 'YouTube API' },
    { plat: 'Stripe', cat: 'Finance', title: 'Generate $10,000 in monthly revenue',
      desc: 'Commit to a monthly recurring revenue target read straight from Stripe.',
      src: 'Stripe API' },
    { plat: 'YouTube', cat: 'Creators', title: 'Reach 50,000 video views',
      desc: 'Set a public view-count milestone and let the channel record settle it.',
      src: 'YouTube API' },
    { plat: 'Shopify', cat: 'Commerce', title: 'Complete 100 orders',
      desc: 'Stake on fulfilling a paid-order threshold in your connected store.',
      src: 'Shopify API' },
    { plat: 'X', cat: 'Social', title: 'Grow to 5,000 followers',
      desc: 'Commit to a public follower milestone, verified from your X profile.',
      src: 'X API' },
    { plat: 'Amazon', cat: 'Commerce', title: 'Fulfill 200 orders',
      desc: 'Stake on an order-volume target read from your seller account.',
      src: 'Amazon Seller API' },
];

function esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Whole dollars with separators, the site rule: cents only when the record has
   them. Nothing is rounded into existence — a null stays a dash. */
function money(n) {
    if (n == null || !isFinite(Number(n))) return '—';
    const v = Number(n);
    return '$' + v.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
    });
}

export function renderMyContracts() {
    const cards = TEMPLATES.map((t) => `
        <article class="myc-card">
            <div class="myc-c-top">
                <span class="myc-plat"><span class="d"></span>${esc(t.plat)}</span>
                <span class="myc-cat">${esc(t.cat)}</span>
            </div>
            <h4>${esc(t.title)}</h4>
            <p class="myc-c-desc">${esc(t.desc)}</p>
            <div class="myc-c-src"><span class="myc-mark sm"></span> Verified by &middot; <b>${esc(t.src)}</b></div>
            <button type="button" class="myc-c-btn">Create contract &rarr;</button>
        </article>`).join('');

    return `
        <style>
        /* SCOPED. The sheet this is built from styles bare *, body and h1, and
           the file it replaces redefined :root globally. Everything here sits
           under .myc and uses the house tokens. */
        .myc {
            --myc-parch:#EEE5D8; --myc-paper:#F5EDDA; --myc-paper2:#FAF4E6;
            --myc-ink:#211B12; --myc-ink-soft:#574E3D; --myc-muted:#7A6E52;
            --myc-faint:#B4A98C; --myc-ox:#7C1D2B; --myc-ox-deep:#5E1420;
            --myc-win:#4E6B3E;
            --myc-line:rgba(70,55,35,.18); --myc-line-soft:rgba(70,55,35,.10);
            --myc-line-firm:rgba(70,55,35,.28);
            --myc-mono:var(--font-data);
            background:var(--myc-parch); color:var(--myc-ink);
            font-family:var(--font-content); -webkit-font-smoothing:antialiased;
            min-height:100vh; box-sizing:border-box;
            margin-top:-96px; padding-top:96px; position:relative;
        }
        .myc *, .myc *::before, .myc *::after { box-sizing:border-box; }
        .myc::before{
            content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
            background:repeating-linear-gradient(0deg,transparent 0 29px,rgba(70,55,35,.025) 29px 30px);
        }
        .myc-wrap{max-width:1200px;margin:0 auto;padding:46px clamp(20px,5vw,60px) 72px;position:relative;z-index:1}
        .myc-mark{width:8px;height:8px;background:var(--myc-ox-deep);transform:rotate(45deg);display:inline-block;flex:none}
        .myc-mark.sm{width:6px;height:6px}

        .myc-phead{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:34px;flex-wrap:wrap}
        .myc-kick{display:inline-flex;align-items:center;gap:12px;font-family:var(--myc-mono);
            font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--myc-ox);
            font-weight:500;margin-bottom:16px}
        .myc-kick .r{height:1px;width:28px;background:var(--myc-ox);opacity:.75}
        .myc h1{font-family:var(--font-display);font-size:clamp(34px,5vw,50px);font-weight:400;
            line-height:1;margin:0 0 14px}
        .myc h1 .ox{color:var(--myc-ox)}
        .myc-lead{font-size:16px;line-height:1.55;color:var(--myc-ink-soft);max-width:540px;margin:0}
        .myc-pact{display:flex;gap:12px;flex:none;flex-wrap:wrap}
        .myc-btn{font-family:var(--myc-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
            padding:13px 22px;white-space:nowrap;display:inline-flex;align-items:center;gap:9px;cursor:pointer}
        .myc-btn.out{border:1px solid var(--myc-ink);background:var(--myc-paper2);color:var(--myc-ink)}
        .myc-btn.out:hover{background:var(--myc-paper)}
        .myc-btn.ox{background:var(--myc-ox);border:1px solid var(--myc-ox);color:var(--myc-paper2);
            box-shadow:0 8px 20px rgba(124,29,43,.15)}
        .myc-btn.ox:hover{background:var(--myc-ox-deep);border-color:var(--myc-ox-deep)}

        /* ── WEIGHT, DELIBERATELY UNEQUAL ────────────────────────────────────
           The page ran as four consecutive cream rectangles of near-identical
           weight — register, progress, empty state, cards — so the eye had
           nothing to descend by. Each band now carries a different amount:

             the register   a closed plate under a heavy ink rule   (heaviest)
             the progress   an open band between two hairlines      (lightest)
             the cards      closed plates again, but smaller        (medium)

           Nothing was restyled to achieve it; the progress band simply stopped
           being a card, which is the one change that separates the three. */
        .myc-statreg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--myc-line-firm);
            border-top:2px solid var(--myc-ink);background:var(--myc-paper);margin-bottom:30px}
        /* COMPRESSED. 22/26 with a 16px rule lead ran the strip to 127px while
           every figure in it was an em-dash — a tall plate saying nothing. The
           type is untouched; only the air around it is smaller. */
        .myc-stat{padding:15px 22px 14px;border-left:1px solid var(--myc-line-soft);min-width:0}
        .myc-stat:first-child{border-left:0}
        .myc-stat .v{font-family:var(--font-content);font-variant-numeric:tabular-nums;
            font-size:clamp(28px,3.2vw,38px);font-weight:600;line-height:1}
        .myc-stat .v.win{color:var(--myc-win)}
        /* A figure with no record behind it is a rule, not a zero — zero is a
           measurement, and these have not been measured. */
        .myc-stat .eln{display:inline-block;width:30px;height:2px;background:var(--myc-faint);
            vertical-align:middle;margin:14px 0 2px}
        .myc-stat .k{font-family:var(--myc-mono);font-size:9px;letter-spacing:.18em;
            text-transform:uppercase;color:var(--myc-ink-soft);margin-top:8px}
        .myc-stat .s{font-size:12.5px;color:var(--myc-muted);margin-top:4px}

        /* An open band, not a panel: hairline above and below, the parchment
           itself showing through. It is a marginal note on the register above
           it, and it should not weigh the same as one. */
        .myc-gs{border-top:1px solid var(--myc-line-firm);border-bottom:1px solid var(--myc-line-soft);
            padding:20px 2px 22px;margin-bottom:40px}
        .myc-gstop{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:16px;flex-wrap:wrap}
        .myc-gstop .l{font-family:var(--myc-mono);font-size:10px;letter-spacing:.22em;
            text-transform:uppercase;color:var(--myc-ox);font-weight:500}
        .myc-gstop .c{font-family:var(--myc-mono);font-size:10px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--myc-muted)}
        .myc-gstop .c b{color:var(--myc-ink);font-weight:500}
        .myc-gsrow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
        .myc-gstep{display:flex;align-items:center;gap:12px;padding-right:16px;min-width:0}
        /* THE MARK IS THE HOUSE DIAMOND, NOT A TICK IN A CIRCLE.
           A green circle with a ✓ is the onboarding checklist every product
           ships. The seal mark this site already uses everywhere — a filled
           square turned 45° — says the same thing in the building's own hand:
           struck for done, outlined for the step in hand, a hairline ghost for
           what has not been reached. Green is kept for settlement, where a gain
           is actually being reported. */
        .myc-gstep .m{width:9px;height:9px;flex:none;transform:rotate(45deg);
            border-radius:0;display:block;font-size:0}
        .myc-gstep.done .m{background:var(--myc-ox-deep);border:0}
        .myc-gstep.next .m{background:transparent;border:1.5px solid var(--myc-ox);
            box-shadow:0 0 0 3px rgba(124,29,43,.10)}
        .myc-gstep.wait .m{background:transparent;border:1px solid var(--myc-faint)}
        .myc-gstep .t{font-family:var(--myc-mono);font-size:10px;letter-spacing:.1em;
            text-transform:uppercase;line-height:1.4}
        .myc-gstep.done .t{color:var(--myc-ink-soft)}
        .myc-gstep.next{cursor:pointer}
        .myc-gstep.next .t{color:var(--myc-ink);font-weight:500}
        .myc-gstep.wait .t{color:var(--myc-faint)}
        .myc-gstep .nx{font-family:var(--myc-mono);font-size:8px;letter-spacing:.14em;
            border:1px solid rgba(124,29,43,.4);color:var(--myc-ox);
            padding:2px 6px;margin-left:8px;white-space:nowrap}
        /* One hairline, struck to the position reached. A 2px bar on a page of
           1px rules was the loudest line in the section. */
        .myc-gsbar{height:1px;background:var(--myc-line);margin-top:20px;position:relative}
        .myc-gsbar .f{position:absolute;left:0;top:0;height:1px;background:var(--myc-ox);
            transition:width .5s cubic-bezier(.22,1,.36,1)}

        /* The notice was 44px of padding around three lines and then 44px more
           before the next heading — a third of a screen to say "nothing here
           yet". Tightened, and the run into Suggested Contracts closed up. */
        .myc-none{border:1px solid var(--myc-line-firm);background:var(--myc-paper);
            padding:30px 32px 28px;text-align:center;margin-bottom:30px}
        .myc-none .seal{width:30px;height:30px;margin:0 auto 13px;display:block}
        .myc-none h3{font-family:var(--font-display);font-size:25px;font-weight:400;margin:0 0 10px}
        .myc-none p{font-size:14.5px;line-height:1.6;color:var(--myc-ink-soft);max-width:520px;margin:0 auto}
        .myc-none p b{color:var(--myc-ink);font-weight:600}
        .myc-none-act{display:flex;gap:14px;justify-content:center;margin-top:20px;flex-wrap:wrap}

        .myc-shead{display:flex;align-items:center;gap:18px;margin-bottom:18px}
        .myc-shead .l{font-family:var(--myc-mono);font-size:11px;letter-spacing:.24em;
            text-transform:uppercase;color:var(--myc-ox);font-weight:500;white-space:nowrap}
        .myc-shead .ln{flex:1;height:1px;background:linear-gradient(90deg,var(--myc-line-firm),var(--myc-line-soft))}
        .myc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .myc-card{border:1px solid var(--myc-line-firm);background:var(--myc-paper);
            padding:24px 24px 22px;display:flex;flex-direction:column;min-width:0;cursor:pointer;
            position:relative;transition:border-color .18s ease, background-color .18s ease}
        /* HOVER IS A RULE, NOT A LIFT. The card carried a 24px drop shadow on
           hover — the one soft edge on a page built from hairlines. The border
           takes the oxblood, the stock lightens a shade, and a struck rule
           appears down the left edge: the same gesture the selected row uses. */
        .myc-card::before{content:"";position:absolute;left:-1px;top:-1px;bottom:-1px;width:2px;
            background:var(--myc-ox);opacity:0;transition:opacity .18s ease}
        .myc-card:hover{border-color:var(--myc-line-firm);background:var(--myc-paper2)}
        .myc-card:hover::before{opacity:1}
        .myc-c-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
        .myc-plat{display:flex;align-items:center;gap:9px;font-family:var(--myc-mono);
            font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--myc-ink-soft)}
        .myc-plat .d{width:6px;height:6px;background:var(--myc-ox);flex:none;transform:rotate(45deg)}
        .myc-cat{font-family:var(--myc-mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;
            color:var(--myc-muted);border:1px solid var(--myc-line-soft);padding:3px 8px;white-space:nowrap}
        /* The title is the card. Everything else steps down from it. */
        .myc-card h4{font-family:var(--font-content);font-size:21px;font-weight:600;
            line-height:1.18;letter-spacing:-.005em;margin:0 0 8px;color:var(--myc-ink)}
        .myc-c-desc{font-size:13.5px;line-height:1.55;color:var(--myc-muted);margin:0 0 18px;flex:1}
        .myc-c-src{display:flex;align-items:center;gap:8px;font-family:var(--myc-mono);font-size:8.5px;
            letter-spacing:.14em;text-transform:uppercase;color:var(--myc-faint);
            padding-top:13px;border-top:1px solid var(--myc-line-soft);margin-bottom:16px}
        .myc-c-src b{color:var(--myc-ink-soft);font-weight:500}
        .myc-c-btn{font-family:var(--myc-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;
            color:var(--myc-paper2);background:var(--myc-ox);border:1px solid var(--myc-ox);
            padding:13px 0;text-align:center;display:block;width:100%;cursor:pointer;
            transition:background-color .18s ease, border-color .18s ease}
        .myc-c-btn:hover, .myc-card:hover .myc-c-btn{background:var(--myc-ox-deep);border-color:var(--myc-ox-deep)}

        /* The operator's own open contracts, once there are any. */
        .myc-list{display:flex;flex-direction:column;border-top:2px solid var(--myc-ink);margin-bottom:44px}
        .myc-row{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,.8fr);
            gap:16px;align-items:center;padding:18px 12px;border-bottom:1px solid var(--myc-line-soft);
            background:var(--myc-paper);cursor:pointer}
        .myc-row:hover{background:var(--myc-paper2)}
        .myc-row .mt{font-family:var(--font-content);font-size:19px;font-weight:600;line-height:1.1}
        .myc-row .ms{font-family:var(--myc-mono);font-size:9.5px;letter-spacing:.12em;
            text-transform:uppercase;color:var(--myc-muted);margin-top:5px}
        .myc-row .amt{font-family:var(--myc-mono);font-size:14px;color:var(--myc-ink);font-variant-numeric:tabular-nums}
        .myc-row .lb{font-family:var(--myc-mono);font-size:8.5px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--myc-muted);display:block;margin-bottom:4px}
        .myc-row .pill{font-family:var(--myc-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;
            padding:5px 10px;border:1px solid var(--myc-line-firm);color:var(--myc-muted);justify-self:start}
        .myc-row .pill.live{color:var(--myc-ox);border-color:rgba(124,29,43,.4)}
        .myc-row .pill.won{color:var(--myc-win);border-color:rgba(78,107,62,.5);background:rgba(78,107,62,.10)}
        .myc-row .pill.lost{color:var(--myc-ox);background:rgba(124,29,43,.06)}

        .myc-err{border:1px solid rgba(124,29,43,.4);background:rgba(124,29,43,.06);
            padding:16px 20px;margin-bottom:44px;font-size:14px;line-height:1.55;color:var(--myc-ink-soft)}
        .myc-err b{color:var(--myc-ink);font-weight:600}

        @media (max-width:900px){
            .myc-statreg{grid-template-columns:repeat(2,minmax(0,1fr))}
            .myc-stat:nth-child(3){border-left:0}
            .myc-stat:nth-child(n+3){border-top:1px solid var(--myc-line-soft)}
            .myc-gsrow{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
            .myc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
            .myc-row{grid-template-columns:minmax(0,1fr) auto;row-gap:10px}
        }
        @media (max-width:620px){
            .myc-statreg,.myc-gsrow,.myc-grid{grid-template-columns:minmax(0,1fr)}
            .myc-stat{border-left:0;border-top:1px solid var(--myc-line-soft)}
            .myc-stat:first-child{border-top:0}
        }
        @media (prefers-reduced-motion:reduce){
            .myc-gsbar .f, .myc-card, .myc-card::before, .myc-c-btn{transition:none}
        }
        </style>

        <section class="myc">
            <div class="myc-wrap">
                <div class="myc-phead">
                    <div>
                        <div class="myc-kick"><span class="r"></span> Your portfolio</div>
                        <h1>Active <span class="ox">Contracts.</span></h1>
                        <p class="myc-lead">Every contract you open lives here. Meet a goal and your
                            locked capital returns with your payout &mdash; and your verified track
                            record grows.</p>
                    </div>
                    <div class="myc-pact">
                        <button type="button" class="myc-btn out" id="myc-identity">View identity</button>
                        <button type="button" class="myc-btn ox" id="myc-new">New contract &rarr;</button>
                    </div>
                </div>

                <div class="myc-statreg">
                    <div class="myc-stat">
                        <div class="v" id="myc-locked"><span class="eln"></span></div>
                        <div class="k">Total locked</div>
                        <div class="s" id="myc-locked-s">Reading your record&hellip;</div>
                    </div>
                    <div class="myc-stat">
                        <div class="v" id="myc-active"><span class="eln"></span></div>
                        <div class="k">Active contracts</div>
                        <div class="s" id="myc-active-s">Reading your record&hellip;</div>
                    </div>
                    <div class="myc-stat">
                        <div class="v" id="myc-rate"><span class="eln"></span></div>
                        <div class="k">Settlement rate</div>
                        <div class="s" id="myc-rate-s">Reading your record&hellip;</div>
                    </div>
                    <div class="myc-stat">
                        <div class="v" id="myc-payout"><span class="eln"></span></div>
                        <div class="k">Total payout</div>
                        <div class="s" id="myc-payout-s">Reading your record&hellip;</div>
                    </div>
                </div>

                <div class="myc-gs">
                    <div class="myc-gstop">
                        <span class="l">Getting started</span>
                        <span class="c" id="myc-gs-count"><b>&mdash;</b> of 4 complete</span>
                    </div>
                    <div class="myc-gsrow" id="myc-gs-row"></div>
                    <div class="myc-gsbar"><div class="f" id="myc-gs-bar" style="width:0%"></div></div>
                </div>

                <div id="myc-content"></div>

                <div class="myc-shead"><span class="l">Suggested contracts</span><span class="ln"></span></div>
                <div class="myc-grid">${cards}</div>
            </div>
        </section>
    `;
}

const SEAL = '<svg class="seal" viewBox="0 0 40 40" fill="none" aria-hidden="true">'
    + '<circle cx="20" cy="20" r="15" fill="#7C1D2B"/>'
    + '<circle cx="20" cy="20" r="15" stroke="#5E1420" stroke-width="1.4"/>'
    + '<circle cx="20" cy="20" r="11" stroke="rgba(255,240,225,.35)" stroke-width=".8"/>'
    + '<text x="20" y="26" font-size="16" font-weight="700" fill="#F0DAC7" text-anchor="middle">C</text></svg>';

export async function initMyContracts() {
    const root = document.querySelector('.myc');
    if (!root) return;
    const go = (path) => { if (window.router) window.router.navigate(path); };

    const nb = document.getElementById('myc-new');
    if (nb) nb.addEventListener('click', () => go('/market'));
    const ib = document.getElementById('myc-identity');
    if (ib) ib.addEventListener('click', () => go('/profile'));
    root.querySelectorAll('.myc-card').forEach((c) => {
        c.addEventListener('click', () => go('/market'));
    });

    /* Read the record, then say what it says. Every request is wrapped
       separately: one unreachable status endpoint must not decide that the
       operator has no contracts, and a failed contract read must not be drawn
       as an empty portfolio — an operator with capital locked who is shown
       "no active contracts" would reasonably think their money had gone. */
    const safe = async (fn) => { try { return await fn(); } catch { return null; } };
    const api = window.api || {};

    const [contractsRes, bank, stripe, shopify, youtube] = await Promise.all([
        safe(() => (api.getContracts ? api.getContracts() : null)),
        safe(() => (api.getPlaidStatus ? api.getPlaidStatus() : null)),
        safe(() => (api.getStripeStatus ? api.getStripeStatus() : null)),
        safe(() => (api.getShopifyStatus ? api.getShopifyStatus() : null)),
        safe(() => (api.getYouTubeStatus ? api.getYouTubeStatus() : null)),
    ]);

    const failed = contractsRes == null;
    const contracts = (contractsRes && contractsRes.contracts) || [];

    // ---- the four figures, all from the one array ------------------------
    const cents = (v) => (v == null ? 0 : Number(v) || 0);
    const isSettled = (k) => k.result === 'WIN' || k.result === 'LOSS'
        || k.status === 'SETTLED_SUCCESS' || k.status === 'SETTLED_FAILURE';
    const isWin = (k) => k.result === 'WIN' || k.status === 'SETTLED_SUCCESS';
    const isLive = (k) => !isSettled(k) && k.status !== 'DRAFT';

    const live = contracts.filter(isLive);
    const settled = contracts.filter(isSettled);
    const won = settled.filter(isWin);
    const lockedUsd = live.reduce((s, k) => s + cents(k.lockAmountUsdCents), 0) / 100;
    const paidUsd = won.reduce((s, k) => s + cents(k.payoutAmountUsdCents), 0) / 100;

    const setStat = (id, value, sub) => {
        const v = document.getElementById(id);
        const s = document.getElementById(id + '-s');
        if (v) {
            if (value == null) v.innerHTML = '<span class="eln"></span>';
            else v.textContent = value;
        }
        if (s && sub != null) s.textContent = sub;
    };

    if (failed) {
        ['myc-locked', 'myc-active', 'myc-rate', 'myc-payout']
            .forEach((id) => setStat(id, null, 'Could not be read'));
    } else {
        setStat('myc-locked', live.length ? money(lockedUsd) : null,
            live.length
                ? 'Across ' + live.length + (live.length === 1 ? ' contract' : ' contracts')
                : 'No capital committed');
        setStat('myc-active', String(live.length),
            live.length ? 'Settling automatically' : 'Ready to open your first');
        setStat('myc-rate', settled.length ? Math.round((won.length / settled.length) * 100) + '%' : null,
            settled.length ? won.length + ' of ' + settled.length + ' met' : 'No settlements yet');
        setStat('myc-payout', won.length ? money(paidUsd) : null,
            won.length ? 'Returned to you' : 'No payouts yet');
        const rate = document.getElementById('myc-rate');
        if (rate && settled.length && won.length === settled.length) rate.classList.add('win');
    }

    // ---- the checklist, every step a real reading ------------------------
    const user = api.getStoredUser ? api.getStoredUser() : null;
    const identityOk = !!(user && (user.username || user.displayName));
    const sourceOk = !!((bank && bank.connected) || (stripe && stripe.connected)
        || (shopify && shopify.connected) || (youtube && youtube.connected));

    const steps = [
        { t: 'Identity verified', done: identityOk, go: '/profile' },
        { t: 'Source connected', done: sourceOk, go: '/sources' },
        { t: 'Open your first contract', done: contracts.length > 0, go: '/market' },
        { t: 'Complete first settlement', done: settled.length > 0, go: null },
    ];
    /* The FIRST unfinished step is the next one, and only that one is marked.
       The bar and the count both come from this same array, so a bar drawn at
       50% under a caption reading "1 of 4" cannot happen again. */
    const nextIdx = steps.findIndex((s) => !s.done);
    const doneCount = steps.filter((s) => s.done).length;

    const row = document.getElementById('myc-gs-row');
    if (row) {
        row.innerHTML = '';
        steps.forEach((s, i) => {
            const state = s.done ? 'done' : (i === nextIdx ? 'next' : 'wait');
            const d = document.createElement('div');
            d.className = 'myc-gstep ' + state;
            /* The mark is the house diamond, drawn in CSS — no glyph inside it.
               A ✓ set in a 9px rotated square renders as a smear, and the
               struck/outlined/ghost states already carry the meaning. The step
               is still named in words beside it, so nothing rests on shape
               alone. */
            const m = document.createElement('span');
            m.className = 'm';
            m.setAttribute('aria-hidden', 'true');
            d.appendChild(m);
            d.setAttribute('data-state', state);
            const t = document.createElement('span');
            t.className = 't';
            t.appendChild(document.createTextNode(s.t));
            if (state === 'next') {
                const nx = document.createElement('span');
                nx.className = 'nx';
                nx.textContent = 'Next';
                t.appendChild(nx);
            }
            d.appendChild(t);
            if (state === 'next' && s.go) d.addEventListener('click', () => go(s.go));
            row.appendChild(d);
        });
    }
    const cnt = document.getElementById('myc-gs-count');
    if (cnt) {
        cnt.innerHTML = '';
        const b = document.createElement('b');
        b.textContent = String(doneCount);
        cnt.appendChild(b);
        cnt.appendChild(document.createTextNode(' of ' + steps.length + ' complete'));
    }
    const bar = document.getElementById('myc-gs-bar');
    if (bar) bar.style.width = (doneCount / steps.length * 100) + '%';

    // ---- the portfolio itself -------------------------------------------
    const container = document.getElementById('myc-content');
    if (!container) return;
    container.innerHTML = '';

    if (failed) {
        const e = document.createElement('div');
        e.className = 'myc-err';
        const b = document.createElement('b');
        b.textContent = 'Your contracts could not be loaded. ';
        e.appendChild(b);
        e.appendChild(document.createTextNode(
            'This is a read problem, not a change to your position — nothing has been altered. '
            + 'Reload to try again.'));
        container.appendChild(e);
        return;
    }

    if (!contracts.length) {
        const n = document.createElement('div');
        n.className = 'myc-none';
        n.innerHTML = SEAL;
        const h = document.createElement('h3');
        h.textContent = 'No active contracts yet.';
        n.appendChild(h);
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(
            'Prove you can do what you say you will. Lock a small stake behind a goal, hit it by '
            + 'the deadline, and your capital returns with a payout. '));
        const b = document.createElement('b');
        b.textContent = 'Miss it, and the stake settles to the pool.';
        p.appendChild(b);
        n.appendChild(p);
        const act = document.createElement('div');
        act.className = 'myc-none-act';
        const primary = document.createElement('button');
        primary.type = 'button';
        primary.className = 'myc-btn ox';
        primary.textContent = 'Open your first contract →';
        primary.addEventListener('click', () => go('/market'));
        act.appendChild(primary);
        n.appendChild(act);
        container.appendChild(n);
        return;
    }

    const list = document.createElement('div');
    list.className = 'myc-list';
    contracts.forEach((k) => {
        const r = document.createElement('div');
        r.className = 'myc-row';

        const left = document.createElement('div');
        const mt = document.createElement('div');
        mt.className = 'mt';
        mt.textContent = String(k.metricType || 'Contract').replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, (ch) => ch.toUpperCase());
        left.appendChild(mt);
        const ms = document.createElement('div');
        ms.className = 'ms';
        ms.textContent = String(k.platform || '').toUpperCase();
        left.appendChild(ms);
        r.appendChild(left);

        const stake = document.createElement('div');
        const sl = document.createElement('span');
        sl.className = 'lb';
        sl.textContent = 'At risk';
        stake.appendChild(sl);
        const sv = document.createElement('span');
        sv.className = 'amt';
        sv.textContent = money(cents(k.lockAmountUsdCents) / 100);
        stake.appendChild(sv);
        r.appendChild(stake);

        /* Labelled "you receive", and the total — the same split the
           certificate makes. A bare payout figure beside a stake is the
           total-versus-profit ambiguity all over again. */
        const pay = document.createElement('div');
        const pl = document.createElement('span');
        pl.className = 'lb';
        pl.textContent = 'If met · you receive';
        pay.appendChild(pl);
        const pv = document.createElement('span');
        pv.className = 'amt';
        pv.textContent = k.payoutAmountUsdCents != null
            ? money(cents(k.payoutAmountUsdCents) / 100) + ' total'
            : '—';
        pay.appendChild(pv);
        r.appendChild(pay);

        const pill = document.createElement('span');
        const st = isSettled(k) ? (isWin(k) ? 'won' : 'lost') : 'live';
        pill.className = 'pill ' + st;
        pill.textContent = st === 'won' ? 'Met' : st === 'lost' ? 'Missed' : 'Live';
        r.appendChild(pill);

        if (k.id) r.addEventListener('click', () => go('/contract/' + encodeURIComponent(k.id)));
        list.appendChild(r);
    });
    container.appendChild(list);
}
