/**
 * Collateral — "Connect Data Sources". /sources
 *
 * ── WHAT THE DESIGN ASKED FOR THAT DOES NOT EXIST ────────────────────────────
 * The sheet this is built from ships a register of figures per connection —
 * 8,240 VERIFIED DATA POINTS at 99.98% ACCURACY for Stripe, 4,240 at 99.95%
 * for YouTube — over a summary bar reading 12,480 verified data points and
 * 99.98% ORACLE HEALTH.
 *
 * None of those exist. The connection endpoints return `connected`,
 * `connectedAt`, `verificationStatus`, and for YouTube a channel title and
 * subscriber count. There is no counter of observations, no accuracy metric,
 * and nothing computing oracle health. An accuracy figure is also the single
 * most load-bearing number that could sit on this page: it is the claim a
 * person weighs before letting the oracle decide whether they keep their
 * money. Invented, it is the worst number on the site.
 *
 * So the four tiles carry what the record actually knows: sources connected,
 * providers live, the platform's settled-contract count from
 * /v1/market/homepage-stats, and the real poll cadence. Each connection row
 * states when it was authorised and what it reads — both true — instead of a
 * hit rate nothing measures.
 *
 * ── AND WHAT THE COPY CLAIMED ────────────────────────────────────────────────
 * The sheet's principles panel reads "By binding settlement to cryptographic
 * API signatures, execution is objective and tamper-proof", with a pipeline
 * step called "Cryptographic proof" and a flow card reading "Signed TLS
 * payload". There is no signature verification in services/oracle.ts. TLS does
 * authenticate the transport, but describing ordinary HTTPS as a cryptographic
 * settlement guarantee is a security claim the code does not make good on, and
 * this is a page about why the numbers can be trusted.
 *
 * What IS true, and is what the copy says now: contracts are polled on a fixed
 * per-provider cadence (services/oracle.ts DEFAULT_CADENCE_MS — 1h for X and
 * YouTube, 6h for Stripe and Shopify), the threshold is evaluated server-side
 * with no operator input, and every settled contract is written with a SHA-256
 * record hash (services/contracts.ts computeRecordHash) that anyone can check
 * against the public ledger. That is a real integrity story and it does not
 * need an invented one on top.
 *
 * CLTR settlement is left in: the rail is real (rivalries carry settlementRail,
 * and services/indexer.ts watches the CLTR token on Robinhood Chain).
 */

import api from '../api.js';

/* Every provider the product knows about, and which of them can be authorised
   today. `live: false` is a roadmap entry and is drawn as one — no connect
   button, because there is nothing behind it to connect to. */
const PROVIDERS = [
    { key: 'stripe',   name: 'Stripe API',            cat: 'Finance',   live: true,
      reads: 'read-only revenue telemetry',
      desc: 'Authorize revenue and subscription telemetry for MRR and net-revenue contracts.',
      example: '+20% MRR in 30 days', cadence: '6h' },
    { key: 'youtube',  name: 'YouTube Data API v3',   cat: 'Creators',  live: true,
      reads: 'subscriber & view-count telemetry',
      desc: 'Authorize public channel telemetry for subscriber and view-count contracts.',
      example: '10,000 subscribers', cadence: '1h' },
    { key: 'plaid',    name: 'Bank via Plaid',        cat: 'Banking',   live: true,
      reads: 'read-only deposit history',
      desc: 'Authorize read-only deposit history. Sets the baseline every contract is priced from.',
      example: 'Income target this window', cadence: '—' },
    { key: 'shopify',  name: 'Shopify Admin API',     cat: 'Commerce',  live: true,
      reads: 'paid order-count telemetry',
      desc: 'Connect your store for order-volume contracts.',
      example: '100 orders in 30 days', cadence: '6h' },
    { key: 'x',        name: 'X API',                 cat: 'Social',    live: true,
      reads: 'public follower telemetry',
      desc: 'Authorize public profile telemetry for follower-growth contracts.',
      example: '5,000 followers', cadence: '1h' },
    { key: 'amazon',   name: 'Amazon Seller API',     cat: 'Commerce',  live: false,
      reads: 'order-volume telemetry',
      desc: 'Order-volume and gross-merchandise adapters. Not yet available to authorize.',
      example: '200-order volume threshold', cadence: '—' },
];

const MARKS = {
    stripe: '<svg viewBox="0 0 24 24"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    shopify: '<svg viewBox="0 0 24 24"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
    plaid: '<span class="src-mono-mark">P</span>',
    amazon: '<span class="src-mono-mark">A</span>',
};

const PIPELINE = [
    ['01', 'Authorize read-only API'],
    ['02', 'Scheduled poll'],
    ['03', 'Server-side reading'],
    ['04', 'Threshold evaluation'],
    ['05', 'Escrow release'],
];

function esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "14d ago" from a real timestamp, or nothing when there is no timestamp. */
function since(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return '';
    const days = Math.floor((Date.now() - t) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return '1d ago';
    if (days < 30) return days + 'd ago';
    const months = Math.floor(days / 30);
    return months === 1 ? '1mo ago' : months + 'mo ago';
}

export function renderSources() {
    const providerCards = PROVIDERS.map((p) => `
        <article class="src-pv${p.live ? '' : ' soon'}" data-provider="${esc(p.key)}">
            <div class="src-pv-t">
                <span class="src-pn"><span class="d"></span>${esc(p.name)}</span>
                <span class="src-tag">${esc(p.live ? p.cat : 'Pipeline')}</span>
            </div>
            <p class="src-pd">${esc(p.desc)}</p>
            <div class="src-ex">
                <div class="src-exk">Supported contract example</div>
                <div class="src-exv">${esc(p.example)}</div>
            </div>
            ${p.live
                ? `<button type="button" class="src-cbtn ox" data-connect="${esc(p.key)}">Connect &rarr;</button>`
                : '<span class="src-cbtn soonb">Not yet available</span>'}
        </article>`).join('');

    const pipeline = PIPELINE.map(([n, label], i) => `
        ${i ? '<span class="src-parrow" aria-hidden="true">&rarr;</span>' : ''}
        <div class="src-pstep">
            <span class="src-pnode">${n}</span>
            <span class="src-plab">${esc(label)}</span>
        </div>`).join('');

    return `
        <style>
        /* SCOPED under .src. The sheet styles bare *, body and h1, and the file
           this replaces redefined :root globally — both would repaint whatever
           else is mounted. */
        .src {
            --src-parch:#EEE5D8; --src-paper:#F5EDDA; --src-paper2:#FAF4E6;
            --src-ink:#211B12; --src-ink-soft:#574E3D; --src-muted:#7A6E52;
            --src-faint:#B4A98C; --src-ox:#7C1D2B; --src-ox-deep:#5E1420;
            --src-win:#4E6B3E;
            --src-line:rgba(70,55,35,.18); --src-line-soft:rgba(70,55,35,.10);
            --src-line-firm:rgba(70,55,35,.28);
            --src-mono:var(--font-data);
            background:var(--src-parch); color:var(--src-ink);
            font-family:var(--font-content); -webkit-font-smoothing:antialiased;
            min-height:100vh; box-sizing:border-box;
            margin-top:-96px; padding-top:96px; position:relative;
        }
        .src *, .src *::before, .src *::after { box-sizing:border-box; }
        .src::before{
            content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
            background:repeating-linear-gradient(0deg,transparent 0 29px,rgba(70,55,35,.025) 29px 30px);
        }
        .src-wrap{max-width:1200px;margin:0 auto;padding:46px clamp(20px,5vw,60px) 72px;position:relative;z-index:1}
        .src-mark{width:8px;height:8px;background:var(--src-ox-deep);transform:rotate(45deg);display:inline-block;flex:none}
        .src-mark.sm{width:6px;height:6px}
        .src-mono-mark{font-family:var(--src-mono);font-weight:600;font-size:13px;color:var(--src-ink-soft)}

        .src-kick{display:inline-flex;align-items:center;gap:12px;font-family:var(--src-mono);
            font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--src-ox);
            font-weight:500;margin-bottom:16px}
        .src-kick .r{height:1px;width:28px;background:var(--src-ox);opacity:.75}
        .src h1{font-family:var(--font-display);font-size:clamp(34px,5vw,50px);font-weight:400;
            line-height:1;margin:0 0 14px}
        .src h1 .ox{color:var(--src-ox)}
        .src-lead{font-size:16px;line-height:1.55;color:var(--src-ink-soft);max-width:560px;margin:0 0 34px}

        .src-statreg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
            border:1px solid var(--src-line-firm);border-top:2px solid var(--src-ink);
            background:var(--src-paper);margin-bottom:44px}
        .src-stat{padding:19px 24px 18px;border-left:1px solid var(--src-line-soft);min-width:0}
        .src-stat:first-child{border-left:0}
        .src-stat .v{font-family:var(--font-content);font-variant-numeric:lining-nums tabular-nums;
            font-size:clamp(28px,3.2vw,38px);font-weight:600;line-height:1}
        .src-stat .v.win{color:var(--src-win)}
        .src-stat .eln{display:inline-block;width:30px;height:2px;background:var(--src-faint);
            vertical-align:middle;margin:14px 0 2px}
        .src-stat .k{font-family:var(--src-mono);font-size:9px;letter-spacing:.18em;
            text-transform:uppercase;color:var(--src-ink-soft);margin-top:9px}

        .src-shead{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 20px}
        .src-shead .l{font-family:var(--src-mono);font-size:11px;letter-spacing:.24em;
            text-transform:uppercase;color:var(--src-ox);font-weight:500;white-space:nowrap;
            display:flex;align-items:center;gap:12px}
        .src-shead .r{font-family:var(--src-mono);font-size:10px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--src-muted)}
        .src-shead .r b{color:var(--src-ink);font-weight:500}
        .src-sect{margin-bottom:44px}

        .src-conns{border-top:2px solid var(--src-ink)}
        .src-conn{display:grid;grid-template-columns:44px minmax(0,1fr) auto auto;
            gap:24px;align-items:center;padding:20px 4px;border-bottom:1px solid var(--src-line-soft)}
        .src-badge{width:40px;height:40px;border:1px solid var(--src-line-firm);background:var(--src-paper2);
            display:flex;align-items:center;justify-content:center;flex:none;color:var(--src-ink-soft)}
        .src-badge svg{width:20px;height:20px;fill:currentColor;display:block}
        .src-nm{font-family:var(--font-content);font-size:21px;font-weight:600;line-height:1;margin-bottom:6px}
        .src-meta{font-family:var(--src-mono);font-size:10px;letter-spacing:.03em;color:var(--src-muted)}
        .src-col{text-align:right;min-width:0}
        .src-cv{font-family:var(--font-content);font-variant-numeric:lining-nums tabular-nums;
            font-size:23px;font-weight:600;line-height:1}
        .src-ck{font-family:var(--src-mono);font-size:8px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--src-faint);margin-top:5px}
        .src-auth{font-family:var(--src-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;
            color:var(--src-win);border:1px solid rgba(78,107,62,.5);background:rgba(78,107,62,.10);
            padding:8px 13px;white-space:nowrap;justify-self:end}
        .src-auth.pending{color:var(--src-ox);border-color:rgba(124,29,43,.45);background:rgba(124,29,43,.06)}
        .src-none{padding:34px 4px;font-family:var(--src-mono);font-size:11px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--src-muted);border-bottom:1px solid var(--src-line-soft)}
        .src-none .sub{display:block;margin-top:10px;letter-spacing:.01em;text-transform:none;
            font-family:var(--font-content);font-size:15px;color:var(--src-ink-soft)}

        .src-panel{border:1px solid var(--src-line-firm);background:var(--src-paper);padding:30px 34px}
        .src-pipe{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
        .src-pstep{display:flex;flex-direction:column;align-items:center;text-align:center;flex:1;gap:14px;min-width:0}
        .src-pnode{width:42px;height:42px;border-radius:50%;border:1px solid var(--src-ox);
            display:flex;align-items:center;justify-content:center;
            font-family:var(--font-content);font-variant-numeric:lining-nums tabular-nums;
            font-size:13px;color:var(--src-ox);font-weight:600;flex:none}
        .src-plab{font-family:var(--src-mono);font-size:10px;letter-spacing:.12em;
            text-transform:uppercase;color:var(--src-ink-soft);line-height:1.5;max-width:140px}
        .src-parrow{color:var(--src-faint);font-size:18px;padding-top:11px;flex:none}

        .src-prin h3{font-family:var(--font-content);font-size:27px;font-weight:600;margin:0 0 16px}
        .src-prin p{font-size:15.5px;line-height:1.6;color:var(--src-ink-soft);margin:0 0 14px;max-width:960px}
        .src-prin p b{color:var(--src-ink);font-weight:600}
        .src-flow{display:flex;align-items:stretch;gap:8px;margin-top:26px}
        .src-fcard{flex:1;border:1px solid var(--src-line-firm);background:var(--src-paper2);
            padding:20px 18px;text-align:center;display:flex;flex-direction:column;justify-content:center;min-width:0}
        .src-fcard.ink{background:var(--src-ink);border-color:var(--src-ink)}
        .src-fcard h5{font-family:var(--font-content);font-size:19px;font-weight:600;margin:0 0 6px}
        .src-fcard.ink h5{color:var(--src-paper2)}
        .src-fcard .fs{font-family:var(--src-mono);font-size:9px;letter-spacing:.08em;
            text-transform:uppercase;color:var(--src-muted)}
        .src-fcard.ink .fs{color:var(--src-faint)}
        .src-farrow{display:flex;align-items:center;color:var(--src-faint);font-size:18px;flex:none}

        .src-pgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .src-pv{border:1px solid var(--src-line-firm);background:var(--src-paper);
            padding:22px 22px 20px;display:flex;flex-direction:column;min-width:0}
        .src-pv.soon{background:var(--src-paper2)}
        /* A connected provider is stated on the row above; the card marks it so
           the two halves of the page cannot disagree. */
        .src-pv.done{border-color:rgba(78,107,62,.45)}
        .src-pv-t{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
        .src-pn{display:flex;align-items:center;gap:9px;font-family:var(--font-content);
            font-size:19px;font-weight:600;min-width:0}
        .src-pn .d{width:7px;height:7px;background:var(--src-ox);flex:none;transform:rotate(45deg)}
        .src-pv.soon .src-pn .d{background:var(--src-faint)}
        .src-pv.done .src-pn .d{background:var(--src-win)}
        .src-tag{font-family:var(--src-mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;
            color:var(--src-muted);border:1px solid var(--src-line-soft);padding:3px 8px;white-space:nowrap}
        .src-pd{font-size:14px;line-height:1.55;color:var(--src-muted);margin:0 0 16px;flex:1}
        .src-ex{padding-top:13px;border-top:1px solid var(--src-line-soft);margin-bottom:16px}
        .src-exk{font-family:var(--src-mono);font-size:8.5px;letter-spacing:.14em;
            text-transform:uppercase;color:var(--src-faint);margin-bottom:6px}
        .src-exv{font-family:var(--src-mono);font-size:12px;color:var(--src-ink);font-weight:500}
        .src-cbtn{font-family:var(--src-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
            padding:12px 0;text-align:center;display:block;width:100%;
            transition:background-color .18s ease,border-color .18s ease}
        .src-cbtn.ox{background:var(--src-ox);border:1px solid var(--src-ox);color:var(--src-paper2);cursor:pointer}
        .src-cbtn.ox:hover{background:var(--src-ox-deep);border-color:var(--src-ox-deep)}
        .src-cbtn.ox.done{background:transparent;border-color:rgba(78,107,62,.5);color:var(--src-win)}
        .src-cbtn.soonb{background:transparent;border:1px solid var(--src-line-firm);color:var(--src-faint);cursor:not-allowed}

        @media (max-width:900px){
            .src-statreg{grid-template-columns:repeat(2,minmax(0,1fr))}
            .src-stat:nth-child(3){border-left:0}
            .src-stat:nth-child(n+3){border-top:1px solid var(--src-line-soft)}
            .src-conn{grid-template-columns:44px minmax(0,1fr);row-gap:14px}
            .src-col,.src-auth{grid-column:2;text-align:left;justify-self:start}
            .src-pipe,.src-flow{flex-direction:column;align-items:stretch;gap:14px}
            .src-parrow,.src-farrow{display:none}
            .src-pstep{flex-direction:row;gap:14px;text-align:left}
            .src-plab{max-width:none}
            .src-pgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
        @media (max-width:620px){
            .src-statreg,.src-pgrid{grid-template-columns:minmax(0,1fr)}
            .src-stat{border-left:0;border-top:1px solid var(--src-line-soft)}
            .src-stat:first-child{border-top:0}
        }
        @media (prefers-reduced-motion:reduce){ .src-cbtn{transition:none} }
        </style>

        <section class="src">
            <div class="src-wrap">
                <div class="src-kick"><span class="r"></span> Verification engine</div>
                <h1>Connect <span class="ox">Data Sources.</span></h1>
                <p class="src-lead">Authorize read-only access to the platform APIs that verify your
                    goals &mdash; so every contract settles on numbers you never touch.</p>

                <div class="src-statreg">
                    <div class="src-stat">
                        <div class="v" id="src-connected"><span class="eln"></span></div>
                        <div class="k">Connected sources</div>
                    </div>
                    <div class="src-stat">
                        <div class="v" id="src-available">${PROVIDERS.filter((p) => p.live).length}</div>
                        <div class="k">Providers available</div>
                    </div>
                    <div class="src-stat">
                        <div class="v" id="src-settled"><span class="eln"></span></div>
                        <div class="k">Contracts settled</div>
                    </div>
                    <div class="src-stat">
                        <div class="v">1&ndash;6h</div>
                        <div class="k">Verification cadence</div>
                    </div>
                </div>

                <div class="src-sect">
                    <div class="src-shead">
                        <span class="l"><span class="src-mark sm"></span> Active connections</span>
                        <span class="r" id="src-count">&mdash;</span>
                    </div>
                    <div class="src-conns" id="src-conns">
                        <div class="src-none">Reading your authorizations&hellip;</div>
                    </div>
                </div>

                <div class="src-sect">
                    <div class="src-shead">
                        <span class="l"><span class="src-mark sm"></span> Verification pipeline</span>
                    </div>
                    <div class="src-panel">
                        <div class="src-pipe">${pipeline}</div>
                    </div>
                </div>

                <div class="src-sect">
                    <div class="src-shead">
                        <span class="l"><span class="src-mark sm"></span> Verification principles</span>
                    </div>
                    <div class="src-panel src-prin">
                        <h3>Why platform verification matters</h3>
                        <p>Collateral never asks you to report your own results. Every contract settles on
                            <b>read-only telemetry pulled directly from the platform where the goal lives</b>
                            &mdash; the same numbers your own dashboard already shows you.</p>
                        <p><b>USD contracts</b> settle through custodial escrow via Stripe Connect.
                            <b>CLTR contracts</b> settle on the CLTR rail on Robinhood Chain.</p>
                        <p>Each contract is polled on a fixed schedule for its provider &mdash; hourly for X
                            and YouTube, every six hours for Stripe and Shopify. The threshold is evaluated
                            server-side against the reading, with no operator input at any point, and every
                            settled contract is written to the public ledger with a
                            <b>SHA-256 record hash</b> you can check against it. No manual submissions,
                            no dispute period, no human bias.</p>
                        <div class="src-flow">
                            <div class="src-fcard"><h5>Platform API</h5><div class="fs">Authoritative metric source</div></div>
                            <span class="src-farrow" aria-hidden="true">&rarr;</span>
                            <div class="src-fcard"><h5>Read-only telemetry</h5><div class="fs">Scheduled poll</div></div>
                            <span class="src-farrow" aria-hidden="true">&rarr;</span>
                            <div class="src-fcard"><h5>Oracle verifier</h5><div class="fs">Threshold computation</div></div>
                            <span class="src-farrow" aria-hidden="true">&rarr;</span>
                            <div class="src-fcard ink"><h5>Execution engine</h5><div class="fs">Deterministic escrow release</div></div>
                        </div>
                    </div>
                </div>

                <div class="src-sect">
                    <div class="src-shead">
                        <span class="l"><span class="src-mark sm"></span> Available providers</span>
                    </div>
                    <div class="src-pgrid" id="src-pgrid">${providerCards}</div>
                </div>
            </div>
        </section>
    `;
}

export async function initSources() {
    const root = document.querySelector('.src');
    if (!root) return;

    const safe = async (fn) => { try { return await fn(); } catch { return null; } };

    const readers = {
        stripe: () => api.getStripeStatus && api.getStripeStatus(),
        youtube: () => api.getYouTubeStatus && api.getYouTubeStatus(),
        plaid: () => api.getPlaidStatus && api.getPlaidStatus(),
        shopify: () => api.getShopifyStatus && api.getShopifyStatus(),
        x: () => api.getXStatus && api.getXStatus(),
        amazon: () => api.getAmazonStatus && api.getAmazonStatus(),
    };

    const live = PROVIDERS.filter((p) => p.live);
    const [statuses, stats] = await Promise.all([
        Promise.all(live.map((p) => safe(readers[p.key]))),
        safe(() => api.getHomepageStats && api.getHomepageStats()),
    ]);

    const state = live.map((p, i) => ({ p: p, s: statuses[i] || null }));
    const connected = state.filter((r) => r.s && r.s.connected);

    // ---- the register --------------------------------------------------
    const setStat = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (value == null) el.innerHTML = '<span class="eln"></span>';
        else el.textContent = String(value);
    };
    setStat('src-connected', connected.length);
    if (stats && stats.contractsSettled != null) {
        setStat('src-settled', Number(stats.contractsSettled).toLocaleString('en-US'));
    } else {
        setStat('src-settled', null);
    }

    const count = document.getElementById('src-count');
    if (count) {
        count.innerHTML = '';
        const b = document.createElement('b');
        b.textContent = String(connected.length);
        count.appendChild(b);
        count.appendChild(document.createTextNode(' of ' + live.length + ' authorized'));
    }

    // ---- active connections --------------------------------------------
    const host = document.getElementById('src-conns');
    if (host) {
        host.innerHTML = '';
        if (!connected.length) {
            const n = document.createElement('div');
            n.className = 'src-none';
            n.appendChild(document.createTextNode('No sources authorized yet'));
            const sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = 'Authorize one below. Nothing is read until you do, and access stays read-only.';
            n.appendChild(sub);
            host.appendChild(n);
        }
        connected.forEach(({ p, s }) => {
            const row = document.createElement('div');
            row.className = 'src-conn';

            const badge = document.createElement('span');
            badge.className = 'src-badge';
            badge.innerHTML = MARKS[p.key] || '';
            row.appendChild(badge);

            const mid = document.createElement('div');
            const nm = document.createElement('div');
            nm.className = 'src-nm';
            // YouTube reports the channel it is actually reading; say which one.
            nm.textContent = p.key === 'youtube' && s.channelTitle
                ? s.channelTitle
                : (p.key === 'plaid' && s.institutionName ? s.institutionName : p.name);
            mid.appendChild(nm);
            const meta = document.createElement('div');
            meta.className = 'src-meta';
            const when = since(s.connectedAt);
            meta.textContent = (when ? 'Connected ' + when + ' · ' : '') + p.reads;
            mid.appendChild(meta);
            row.appendChild(mid);

            /* THE ONLY FIGURE A CONNECTION CAN REPORT is one the provider
               actually returned. YouTube gives a subscriber count; nothing else
               gives a number, so nothing else prints one. The cadence column is
               the real DEFAULT_CADENCE_MS for that provider. */
            const col = document.createElement('div');
            col.className = 'src-col';
            const cv = document.createElement('div');
            cv.className = 'src-cv';
            const ck = document.createElement('div');
            ck.className = 'src-ck';
            if (p.key === 'youtube' && s.subscriberCount != null) {
                cv.textContent = Number(s.subscriberCount).toLocaleString('en-US');
                ck.textContent = 'Subscribers';
            } else {
                cv.textContent = p.cadence;
                ck.textContent = p.cadence === '—' ? 'On demand' : 'Poll cadence';
            }
            col.appendChild(cv); col.appendChild(ck);
            row.appendChild(col);

            /* "Authorized" is the account being attached. Plaid additionally
               needs a stream chosen before anything can be priced from it, and
               saying "Authorized" while that is outstanding would send someone
               to a builder that cannot quote. */
            const pill = document.createElement('span');
            const pending = p.key === 'plaid' && s.streamSelected === false;
            pill.className = 'src-auth' + (pending ? ' pending' : '');
            pill.textContent = pending ? 'Select income stream' : '✓ Authorized';
            row.appendChild(pill);

            host.appendChild(row);
        });
    }

    // ---- provider cards mirror the same state --------------------------
    const byKey = {};
    state.forEach((r) => { byKey[r.p.key] = r.s; });
    root.querySelectorAll('.src-pv[data-provider]').forEach((card) => {
        const key = card.getAttribute('data-provider');
        const s = byKey[key];
        const btn = card.querySelector('[data-connect]');
        if (s && s.connected) {
            card.classList.add('done');
            if (btn) { btn.classList.add('done'); btn.textContent = '✓ Connected'; }
        }
        if (btn) {
            btn.addEventListener('click', () => {
                if (key === 'plaid') {
                    if (window.app && typeof window.app.connectBank === 'function') {
                        window.app.connectBank(() => initSources());
                    }
                    return;
                }
                if (window.app && typeof window.app.connectSource === 'function') {
                    window.app.connectSource(key);
                }
            });
        }
    });
}
