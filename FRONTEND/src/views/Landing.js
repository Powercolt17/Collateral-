// Landing Page — Collateral Financial Document System with Paper Grain & Scoped Styling
import api from '../api.js';
import { landingCSS } from './LandingStyles.js';
import { motionController, animateValue, initEntranceObservers, revealStyles } from './LandingMotion.js';
import { renderCollateralHero } from '../components/CollateralHero.js';
import { renderForkSection } from '../components/ForkSection.js';
import { renderLedgerSection } from '../components/LedgerSection.js';

// Inject LandingCSS once into document head
if (!document.getElementById('lp-injected-styles')) {
    const style = document.createElement('style');
    style.id = 'lp-injected-styles';
    style.textContent = landingCSS;
    document.head.appendChild(style);
}

export function renderLanding() {
    return `
        <div class="lp cl-root">
            <div class="cl-grain" aria-hidden="true"></div>

            

            <!-- ═════ 1 · HERO (engraved plate) ═════ -->
            ${renderCollateralHero({
        onWriteContract: "if(window.app &amp;&amp; window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;",
        onWatchFlow: "document.getElementById('flow') &amp;&amp; document.getElementById('flow').scrollIntoView({behavior:'smooth'}); return false;",
    })}

            <!-- ═════ 1b · LEDGER (settled in public) ═════ -->
            ${renderLedgerSection({
        onSeeFullLedger: "window.router.navigate('/ledger'); return false;",
    })}

            <!-- ═════ 2 · FORK (how it settles) ═════ -->
            ${renderForkSection()}

            <!-- ═════ 3 · CASE ═════ -->
            <section class="section reveal" id="case">
                <div class="shell">
                    <div class="argue">
                        <div>
                            <p class="eyebrow rise" style="--d:40ms">Why it works</p>
                            <h2 class="title clip-wipe" style="--d:120ms">A plan without stakes is just a comfortable wish</h2>
                            <p class="lede rise" style="--d:220ms; margin-top:18px; max-width:46ch">You already know what the next step is. You've
                                known for months. What you don't have is a reason it has to happen this week instead of
                                some other week, because missing it costs a feeling, and feelings are cheap enough to
                                absorb forever.</p>
                            <aside class="argue-note rise" style="--d:340ms">
                                <span class="mono mono-b" style="color:var(--blood)">&sect; 3.1 &middot; Clerk's note</span>
                                <p class="mono">The median contract is opened at 11:40pm on a Sunday. We have theories about why,
                                    and none of them are flattering.</p>
                            </aside>
                        </div>

                        <div>
                            <p class="cmp-caption mono rise" style="--d:280ms">Same goal, recorded two ways</p>
                            <div class="cmp-table-wrap card-rise" style="--d:360ms; overflow-x:auto; -webkit-overflow-scrolling:touch; max-width:100%;">
                            <table class="cmp plate-quiet">
                                <thead>
                                    <tr><th scope="col">Wk</th><th scope="col">Without stakes &middot; VOID</th><th scope="col">Under contract</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>01</td><td class="void">Announce the goal</td><td>Lock the deposit</td></tr>
                                    <tr><td>02</td><td class="void">Something urgent comes up</td><td>Something urgent comes up anyway</td></tr>
                                    <tr><td>03</td><td class="void">Move the deadline, quietly</td><td>The deadline does not move</td></tr>
                                    <tr><td>04</td><td class="void">Decide it wasn't the right time</td><td>Ship it at 2am, badly, on time</td></tr>
                                    <tr><td>&mdash;</td><td class="void">Nothing at risk, nothing changed</td>
                                        <td class="won-txt">Money back. And the thing exists.</td></tr>
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ═════ 3b · ORACLE REGISTER ═════ -->
            <section class="section reveal" id="oracles" style="padding-top:0">
                <div class="shell">
                    <div class="oracles-head">
                        <div class="oracles-title-block">
                            <p class="eyebrow rise" style="--d:40ms">Verification sources</p>
                            <h2 class="title clip-wipe" style="--d:120ms">Four APIs decide every contract</h2>
                            <p class="lede rise" style="--d:220ms">Collateral does not score you. It reads the same numbers your platform
                                already reports, on a fixed schedule, and settles on whatever it finds there.</p>
                        </div>
                        <aside class="marg-note-top rise" style="--d:320ms">
                            <span class="mono mono-b" style="color:var(--blood)">&sect; 3.4</span>
                            <p class="mono">Read-only scopes only. Collateral cannot post, message, refund, or change a single
                                setting on any account you connect, and the token can be revoked from your side at any
                                time without affecting an open contract's settlement.</p>
                        </aside>
                    </div>

                    <div class="oracles-table-wrap card-rise" style="--d:360ms">
                        <p class="reg-caption mono rise" style="--d:300ms">Register of accepted oracles &middot; read-only scopes</p>

                        <table class="reg plate">
                            <caption>Accepted verification oracles and reading parameters</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Platform</th>
                                    <th scope="col">Metrics read</th>
                                    <th scope="col">Poll cadence</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span class="reg-name">
                                            <span class="reg-mark" aria-hidden="true">
                                                <svg fill="currentColor" role="img" viewBox="0 0 24 24" class="reg-logo"><title>Stripe</title><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/></svg>
                                            </span>
                                            <span class="reg-plat">Stripe</span>
                                        </span>
                                    </td>
                                    <td data-label="Metrics read">Net revenue, MRR, order volume</td>
                                    <td data-label="Poll cadence"><span class="reg-num">Every 6h</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="reg-name">
                                            <span class="reg-mark" aria-hidden="true">
                                                <svg fill="currentColor" role="img" viewBox="0 0 24 24" class="reg-logo"><title>X</title><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>
                                            </span>
                                            <span class="reg-plat">X</span>
                                        </span>
                                    </td>
                                    <td data-label="Metrics read">Followers, impressions, post reach</td>
                                    <td data-label="Poll cadence"><span class="reg-num">Every 1h</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="reg-name">
                                            <span class="reg-mark" aria-hidden="true">
                                                <svg fill="currentColor" role="img" viewBox="0 0 24 24" class="reg-logo"><title>YouTube</title><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                            </span>
                                            <span class="reg-plat">YouTube</span>
                                        </span>
                                    </td>
                                    <td data-label="Metrics read">Subscribers, views, watch time</td>
                                    <td data-label="Poll cadence"><span class="reg-num">Every 12h</span></td>
                                </tr>
                                <tr>
                                    <td>
                                        <span class="reg-name">
                                            <span class="reg-mark" aria-hidden="true">
                                                <svg fill="currentColor" role="img" viewBox="0 0 24 24" class="reg-logo"><title>Shopify</title><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"/></svg>
                                            </span>
                                            <span class="reg-plat">Shopify</span>
                                        </span>
                                    </td>
                                    <td data-label="Metrics read">Orders, revenue, average order value</td>
                                    <td data-label="Poll cadence"><span class="reg-num">Every 6h</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- ═════ 4 · RECORD ═════ -->
            <section class="section alt reveal" id="record" style="padding-bottom: 52px;">
                <span class="idx-mark" aria-hidden="true">05</span>
                <div class="shell">
                    <p class="eyebrow rise" style="--d:40ms">Settlement record</p>
                    <h2 class="title clip-wipe" style="--d:120ms">The receipts, including the ones that hurt</h2>
                    <p class="lede rise" style="--d:220ms">Most sites show you the wins. Every contract here settles on the same
                        telemetry whether it went well or not, and we publish both, because a record with no
                        losses in it isn't a record.</p>

                    <div class="receipts">
                        <article class="receipt card-rise" style="--d:320ms">
                            <div class="r-top">
                                <div class="r-meta"><span class="mono">Settlement receipt</span><span class="mono">№ C&ndash;34D6</span></div>
                                <h3 class="r-goal">+20% revenue in 30 days</h3>
                                <p class="r-src">@revpilot &middot; via Stripe API</p>
                                <dl class="r-fields">
                                    <div class="r-row"><dt>Capital staked</dt><span class="dots"></span><dd>$2,000.00</dd></div>
                                    <div class="r-row"><dt>Verified by</dt><span class="dots"></span><dd>Stripe oracle</dd></div>
                                    <div class="r-row"><dt>Settled on</dt><span class="dots"></span><dd>14 Mar 2026</dd></div>
                                </dl>
                            </div>
                            <div class="perf" aria-hidden="true"></div>
                            <div class="r-bottom won">
                                <div><p class="r-amt">+$2,240.00</p><p class="r-note">Stake + payout returned</p></div>
                                <span class="r-stamp won">Approved</span>
                            </div>
                        </article>

                        <article class="receipt card-rise" style="--d:420ms">
                            <div class="r-top">
                                <div class="r-meta"><span class="mono">Settlement receipt</span><span class="mono">№ C&ndash;9F21</span></div>
                                <h3 class="r-goal">50,000 subscribers in 60 days</h3>
                                <p class="r-src">@deltacreator &middot; via YouTube API</p>
                                <dl class="r-fields">
                                    <div class="r-row"><dt>Capital staked</dt><span class="dots"></span><dd>$1,000.00</dd></div>
                                    <div class="r-row"><dt>Verified by</dt><span class="dots"></span><dd>YouTube oracle</dd></div>
                                    <div class="r-row"><dt>Settled on</dt><span class="dots"></span><dd>09 Mar 2026</dd></div>
                                </dl>
                            </div>
                            <div class="perf" aria-hidden="true"></div>
                            <div class="r-bottom won">
                                <div><p class="r-amt">+$1,120.00</p><p class="r-note">Stake + payout returned</p></div>
                                <span class="r-stamp won">Approved</span>
                            </div>
                        </article>

                        <article class="receipt card-rise" style="--d:520ms">
                            <div class="r-top">
                                <div class="r-meta"><span class="mono">Settlement receipt</span><span class="mono">№ C&ndash;780B</span></div>
                                <h3 class="r-goal">25,000 followers in 30 days</h3>
                                <p class="r-src">@marcusk &middot; via X API</p>
                                <dl class="r-fields">
                                    <div class="r-row"><dt>Capital staked</dt><span class="dots"></span><dd>$1,500.00</dd></div>
                                    <div class="r-row"><dt>Verified by</dt><span class="dots"></span><dd>X oracle</dd></div>
                                    <div class="r-row"><dt>Settled on</dt><span class="dots"></span><dd>02 Mar 2026</dd></div>
                                </dl>
                            </div>
                            <div class="perf" aria-hidden="true"></div>
                            <div class="r-bottom lost">
                                <div><p class="r-amt">&minus;$1,500.00</p><p class="r-note">Forfeited to match pool</p></div>
                                <span class="r-stamp lost">Denied</span>
                            </div>
                        </article>
                    </div>

                    <div class="footing card-rise" style="--d:500ms">
                        <p class="mono" style="margin:0 0 6px">Book totals &middot; inception to date</p>
                        <dl style="margin:0">
                            <div class="f-row"><dt>Contracts won</dt><span class="dots"></span><dd>74%</dd></div>
                            <div class="f-row"><dt>Verified counterparties</dt><span class="dots"></span><dd>812</dd></div>
                            <div class="f-row"><dt>Average time to target</dt><span class="dots"></span><dd>18 days</dd></div>
                            <div class="f-row f-total"><dt>Total capital settled</dt><span class="dots"></span><dd id="book-total-amt">$8,700,000</dd></div>
                        </dl>
                    </div>
                </div>
            </section>

            <!-- ═════ 5 · FORFEIT FLOW + SCHEMATIC ═════ -->
            <section class="section reveal" id="flow">
                <span class="idx-mark" aria-hidden="true">06</span>
                <div class="shell">
                    <p class="eyebrow rise" style="--d:40ms">Where forfeited money goes</p>
                    <h2 class="title clip-wipe" style="--d:120ms">Losers pay winners. That is the whole engine.</h2>
                    <p class="lede rise" style="--d:220ms">Marcus's fifteen hundred dollars did not vanish into a house account. Watch
                        where it actually went, then read the full path underneath.</p>

                    <div class="flow-wrap plate card-rise" style="--d:320ms" id="flowwrap">
                        <div class="flow-head">
                            <span class="mono">Cycle 2026&ndash;W12 &middot; recirculation</span>
                            <span class="mono">Settled 14 Mar 2026</span>
                        </div>
                        <div class="flow-stage">
                            <div class="stage-col">
                                <span class="mono">Contract denied</span>
                                <div class="loser">
                                    <span class="mono" style="color:var(--blood)">№ C&ndash;780B &middot; @marcusk</span>
                                    <p class="loser-amt">&minus;$1,500</p>
                                    <p class="loser-goal">Missed 25,000 followers in 30 days</p>
                                </div>
                            </div>
                            <div class="stage-mid">
                                <div class="track" id="track" aria-hidden="true"></div>
                                <p class="mid-label">Forfeited deposit<br>recirculates &rarr;</p>
                            </div>
                            <div class="stage-col">
                                <span class="mono">Match pool</span>
                                <div class="pool">
                                    <span class="mono" style="color:var(--win)">Funds this cycle's winners</span>
                                    <p class="pool-amt" id="pool-amt">$0</p>
                                    <div class="pool-bar"><i id="pool-bar"></i></div>
                                    <div class="winners" id="winners">
                                        <div class="winner"><span>@revpilot</span><span class="amt">+$240</span></div>
                                        <div class="winner"><span>@deltacreator</span><span class="amt">+$120</span></div>
                                        <div class="winner"><span>@quietbuild</span><span class="amt">+$180</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flow-foot">
                            <span class="mono">3.8% of deposits forfeit &middot; 100% recirculates</span>
                            <button class="replay" id="replay">Replay</button>
                        </div>
                    </div>

                    <div class="marg marg-strip rise" style="--d:420ms; margin-top:34px">
                        <span class="marg-mark">&sect; 4.1</span>
                        <p>We take half a percent and nothing else. There is no spread, no rake on the match
                            pool, and no scenario in which Collateral profits more when you miss.</p>
                    </div>

                    <div class="sch plate-quiet r-plate" style="--i:5; margin-top:34px">
                        <div class="sch-head">
                            <span class="mono">Drawing 01 &middot; full settlement path</span>
                            <span class="mono">Rev. 2026.03</span>
                        </div>
                        <svg viewBox="0 0 1080 400" role="img"
                             aria-label="Schematic: deposits enter custodial escrow, are verified by platform APIs, then split into returned capital, forfeited deposits which recirculate, and a protocol fee.">
                            <defs>
                                <marker id="cl-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                    <path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </marker>
                            </defs>
                            <g fill="none" stroke="#0E1420" stroke-width="1">
                                <rect x="20" y="150" width="180" height="86" rx="2"/>
                                <rect x="290" y="150" width="180" height="86" rx="2" stroke-width="1.7"/>
                                <rect x="560" y="150" width="180" height="86" rx="2"/>
                            </g>
                            <g font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1.6" fill="#6E7686">
                                <text x="34" y="172">INPUT</text>
                                <text x="304" y="172">CUSTODY</text>
                                <text x="574" y="172">VERIFICATION</text>
                            </g>
                            <g font-family="Archivo, sans-serif" font-size="14" font-weight="600" fill="#0E1420">
                                <text x="34" y="197">Deposit in</text>
                                <text x="304" y="197">Escrow vault</text>
                                <text x="574" y="197">Oracle API stream</text>
                            </g>
                            <g font-family="IBM Plex Mono, monospace" font-size="14" fill="#7A1C29">
                                <text x="34" y="221">$8,700,000</text>
                                <text x="304" y="221">$8.7M locked</text>
                                <text x="574" y="221">96.2% hit rate</text>
                            </g>
                            <g stroke-width="1" marker-end="url(#cl-ar)" fill="none">
                                <line x1="204" y1="193" x2="282" y2="193" stroke="#0E1420"/>
                                <line x1="474" y1="193" x2="552" y2="193" stroke="#0E1420"/>
                                <path d="M744 193 L800 193 L800 78 L856 78" stroke="#186B4A" stroke-width="1.5"/>
                                <path d="M744 193 L820 193 L856 193" stroke="#7A1C29" stroke-dasharray="5 4"/>
                                <path d="M744 193 L800 193 L800 310 L856 310" stroke="#6E7686" stroke-dasharray="2 4"/>
                            </g>
                            <g fill="none" stroke-width="1">
                                <rect x="860" y="40" width="200" height="76" rx="2" stroke="#186B4A"/>
                                <rect x="860" y="155" width="200" height="76" rx="2" stroke="#7A1C29"/>
                                <rect x="860" y="272" width="200" height="76" rx="2" stroke="#DCD5C6"/>
                            </g>
                            <g font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1.6">
                                <text x="874" y="62" fill="#186B4A">WIN PATH &middot; 95.7%</text>
                                <text x="874" y="177" fill="#7A1C29">FORFEITED &middot; 3.8%</text>
                                <text x="874" y="294" fill="#6E7686">PROTOCOL FEE &middot; 0.5%</text>
                            </g>
                            <g font-family="Archivo, sans-serif" font-size="13" font-weight="600" fill="#0E1420">
                                <text x="874" y="84">Returned to creator</text>
                                <text x="874" y="199">Feeds winner match pool</text>
                                <text x="874" y="316">Operations</text>
                            </g>
                            <g font-family="IBM Plex Mono, monospace" font-size="14">
                                <text x="874" y="106" fill="#186B4A">$8,326,200</text>
                                <text x="874" y="221" fill="#7A1C29">$330,600</text>
                                <text x="874" y="338" fill="#6E7686">$43,200</text>
                            </g>
                            <path d="M960 235 L960 372 L380 372 L380 240" fill="none" stroke="#7A1C29" stroke-width="1" stroke-dasharray="5 4" marker-end="url(#cl-ar)"/>
                            <text x="670" y="366" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1.6" fill="#7A1C29" text-anchor="middle">FORFEITED DEPOSITS RECIRCULATE TO ESCROW VAULT</text>
                            <g stroke="#6E7686" stroke-width=".6"><path d="M20 268 v10 M200 268 v10 M20 273 h180"/></g>
                            <text x="110" y="290" font-family="IBM Plex Mono, monospace" font-size="9.5" letter-spacing="1.4" fill="#6E7686" text-anchor="middle">STRIPE CONNECT CUSTODY</text>
                        
                            <!-- ═══ SCHEMATIC TRACER OVERLAY ═══ -->
                            <g class="tracer-group" aria-hidden="true">
                              <!-- Deposit in → Escrow vault -->
                              <line class="tracer t1" pathLength="100"
                                    x1="204" y1="193" x2="282" y2="193"
                                    fill="none" stroke="#0E1420" stroke-width="3.5" />

                              <!-- Escrow Vault Impact Pulse -->
                              <rect class="vault-box-pulse"
                                    x="290" y="150" width="180" height="86" rx="2"
                                    fill="none" stroke="#7A1C29" />

                              <!-- Escrow vault → Oracle API stream -->
                              <line class="tracer t2" pathLength="100"
                                    x1="474" y1="193" x2="552" y2="193"
                                    fill="none" stroke="#0E1420" stroke-width="3.5" />

                              <!-- Oracle Stream Impact Pulse -->
                              <rect class="oracle-box-pulse"
                                    x="560" y="150" width="180" height="86" rx="2"
                                    fill="none" stroke="#0E1420" />

                              <!-- Oracle API stream → junction -->
                              <line class="tracer t3" pathLength="100"
                                    x1="744" y1="193" x2="800" y2="193"
                                    fill="none" stroke="#0E1420" stroke-width="3.5" />

                              <!-- Junction → win box (the payoff leg) -->
                              <path class="tracer t-win" pathLength="100"
                                    d="M800 193 L800 78 L856 78"
                                    fill="none" stroke="#186B4A" stroke-width="4.2" />

                              <!-- Win box receives the pulse -->
                              <rect class="win-box-pulse"
                                    x="860" y="40" width="200" height="76" rx="2"
                                    fill="none" stroke="#186B4A" />

                              <!-- Forfeited Recirculation Loop (Crimson Tracer) -->
                              <path class="tracer t-forfeit" pathLength="100"
                                    d="M960 235 L960 372 L380 372 L380 240"
                                    fill="none" stroke="#7A1C29" stroke-width="3.4" />
                            </g>
                        </svg>
                        <dl class="sch-mobile">
                            <div class="sm-row"><dt>Deposits in</dt><span class="dots"></span><dd>$8,700,000</dd></div>
                            <div class="sm-row"><dt>Escrow vault</dt><span class="dots"></span><dd>Stripe Connect</dd></div>
                            <div class="sm-row"><dt>Oracle hit rate</dt><span class="dots"></span><dd>96.2%</dd></div>
                            <div class="sm-row win"><dt>Returned &middot; 95.7%</dt><span class="dots"></span><dd>$8,326,200</dd></div>
                            <div class="sm-row blood"><dt>Forfeited &middot; 3.8%</dt><span class="dots"></span><dd>$330,600</dd></div>
                            <div class="sm-row"><dt>Protocol fee &middot; 0.5%</dt><span class="dots"></span><dd>$43,200</dd></div>
                        </dl>
                        <div class="sch-foot">
                            <span class="legend"><span class="swatch" style="color:#186B4A"></span>Returned capital</span>
                            <span class="legend"><span class="swatch dash" style="color:#7A1C29"></span>Forfeited &amp; recirculated</span>
                            <span class="legend"><span class="swatch dash" style="color:#6E7686"></span>Protocol fee</span>
                            <span class="legend" style="margin-left:auto">Sums to deposits in</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ═════ 6 · CALCULATOR + TIERS ═════ -->
            <section class="section alt reveal" id="terms">
                <span class="idx-mark" aria-hidden="true">07</span>
                <div class="shell">
                    <p class="eyebrow rise" style="--d:40ms">Price your own contract</p>
                    <h2 class="title clip-wipe" style="--d:120ms">Name a number that would actually hurt to lose</h2>
                    <p class="lede rise" style="--d:220ms">Too small and you'll shrug it off in week two. Too large and you'll talk
                        yourself out of signing at all. The right number is the one you flinch at slightly.</p>

                    <div class="calc plate card-rise" style="--d:320ms">
                        <div class="calc-left">
                            <div>
                                <span class="mono">Contract parameters</span>
                                <div class="field">
                                    <div class="field-top">
                                        <label class="mono" for="dep" style="color:var(--ink-2)">Deposit</label>
                                        <span class="field-val" id="dep-out">$1,000</span>
                                    </div>
                                    <input type="range" id="dep" min="100" max="10000" step="50" value="1000">
                                    <div class="scale"><span class="mono">$100</span><span class="mono">$10,000</span></div>
                                </div>
                                <div class="field" style="margin-top:30px">
                                    <div class="field-top">
                                        <span class="mono" style="color:var(--ink-2)">Execution window</span>
                                    </div>
                                    <div class="seg" id="seg" role="group" aria-label="Execution window">
                                        <button type="button" data-days="14" aria-pressed="false">14 days</button>
                                        <button type="button" data-days="30" aria-pressed="true">30 days</button>
                                        <button type="button" data-days="60" aria-pressed="false">60 days</button>
                                    </div>
                                </div>
                            </div>

                            <div class="calc-left-foot">
                                <span class="mono">Parameters lock on signature</span>
                            </div>
                        </div>

                        <div class="calc-right">
                            <span class="mono">Settlement outcomes</span>
                            <div class="outcomes">
                                <div class="outcome">
                                    <span class="mono" style="color:var(--win)">If you hit target</span>
                                    <p class="outcome-val" id="o-win">$2,500</p>
                                    <p class="outcome-note">Stake plus matching payout</p>
                                </div>
                                <div class="outcome">
                                    <span class="mono" style="color:var(--blood)">If you miss</span>
                                    <p class="outcome-val" id="o-lose">&minus;$1,000</p>
                                    <p class="outcome-note">Forfeited to match pool</p>
                                </div>
                            </div>
                            <dl class="terms">
                                <div class="t-row"><dt>Tier</dt><span class="dots"></span><dd id="t-tier">Stake</dd></div>
                                <div class="t-row"><dt>Match multiplier</dt><span class="dots"></span><dd id="t-mult">2.5&times;</dd></div>
                                <div class="t-row"><dt>Est. match on success</dt><span class="dots"></span><dd id="t-net">+$1,500</dd></div>
                                <div class="t-row"><dt>On miss</dt><span class="dots"></span><dd id="t-miss">Full forfeit</dd></div>
                            </dl>
                            <div class="calc-cta">
                                <button class="btn btn-fill" type="button" id="calc-go" onclick="if(window.app && window.app.openAccessModal){ window.app.openAccessModal('signup'); } else { window.router.navigate('/signin'); } return false;">Lock $1,000 for 30 days</button>
                            </div>
                        </div>
                    </div>

                    <div class="tiers" id="tiers">
                        <button type="button" class="tier card-rise" style="--d:400ms" data-tier="14">
                            <span class="tier-tab">Your selection</span>
                            <span class="mono">Schedule A &middot; All-in</span>
                            <p class="tier-mult">4.0<small>&times;</small></p>
                            <span class="mono">14-day window</span>
                            <dl class="tier-rows">
                                <div class="t-row"><dt>Deposit</dt><span class="dots"></span><dd>$500 &ndash; $10,000</dd></div>
                                <div class="t-row"><dt>On miss</dt><span class="dots"></span><dd>Full forfeit</dd></div>
                            </dl>
                        </button>
                        <button type="button" class="tier card-rise" style="--d:480ms" data-tier="30" data-active="true">
                            <span class="tier-tab">Your selection</span>
                            <span class="mono">Schedule A &middot; Stake</span>
                            <p class="tier-mult">2.5<small>&times;</small></p>
                            <span class="mono">30-day window</span>
                            <dl class="tier-rows">
                                <div class="t-row"><dt>Deposit</dt><span class="dots"></span><dd>$250 &ndash; $3,000</dd></div>
                                <div class="t-row"><dt>On miss</dt><span class="dots"></span><dd>Full forfeit</dd></div>
                            </dl>
                        </button>
                        <button type="button" class="tier card-rise" style="--d:560ms" data-tier="60">
                            <span class="tier-tab">Your selection</span>
                            <span class="mono">Schedule A &middot; Pledge</span>
                            <p class="tier-mult">1.5<small>&times;</small></p>
                            <span class="mono">60-day window</span>
                            <dl class="tier-rows">
                                <div class="t-row"><dt>Deposit</dt><span class="dots"></span><dd>$100 &ndash; $1,500</dd></div>
                                <div class="t-row"><dt>On miss</dt><span class="dots"></span><dd>Grace period</dd></div>
                            </dl>
                        </button>
                    </div>

                    <div class="marg rise" style="--d:620ms; margin-top:34px">
                        <span class="marg-mark">&sect; 6.2</span>
                        <p>Shorter windows pay more because they are harder, not because we are being generous.
                            Fourteen days is chosen by people who have already started.</p>
                    </div>
                </div>
            </section>

            <!-- ═════ 7 · DUELS ═════ -->
            <section class="section reveal" id="duels">
                <span class="idx-mark" aria-hidden="true">08</span>
                <div class="shell">
                    <p class="eyebrow eyebrow--live rise" style="--d:40ms">Live rivalry duels</p>
                    <h2 class="title clip-wipe" style="--d:120ms">Open right now, and somebody is behind</h2>
                    <p class="lede rise" style="--d:220ms">Real capital, real clocks, updated every oracle poll. Open a duel to see
                        the full position.</p>

                    <div class="duels card-rise" style="--d:320ms">
                        <button class="duel ticks" type="button" onclick="if(window.app && window.app.openAccessModal){ window.app.openAccessModal('login'); } else { window.router.navigate('/signin'); } return false;">
                            <span class="duel-head">
                                <span class="mono">Audience &middot; X API</span>
                                <span class="duel-badge badge-live">Live &middot; 14d left</span>
                            </span>
                            <span class="duel-vs">
                                <span class="duel-side"><span class="duel-handle">@jakevoss</span>
                                    <span class="duel-delta lead">+12.4%</span></span>
                                <span class="duel-mid">VS</span>
                                <span class="duel-side r"><span class="duel-handle">@marcus</span>
                                    <span class="duel-delta trail">+9.2%</span></span>
                            </span>
                            <span class="bar"><span class="a" style="width:57%"></span><span class="g"></span><span class="b"></span></span>
                            <span class="duel-foot">
                                <span>$5,000 pool</span>
                                <span class="duel-cta">View duel <span>&rarr;</span></span>
                            </span>
                        </button>

                        <button class="duel ticks" type="button" onclick="if(window.app && window.app.openAccessModal){ window.app.openAccessModal('login'); } else { window.router.navigate('/signin'); } return false;">
                            <span class="duel-head">
                                <span class="mono">Revenue &middot; Stripe API</span>
                                <span class="duel-badge badge-settle">Settling</span>
                            </span>
                            <span class="duel-vs">
                                <span class="duel-side"><span class="duel-handle">@revpilot</span>
                                    <span class="duel-delta lead">+8.1%</span></span>
                                <span class="duel-mid">VS</span>
                                <span class="duel-side r"><span class="duel-handle">@quotaops</span>
                                    <span class="duel-delta trail">+5.4%</span></span>
                            </span>
                            <span class="bar"><span class="a" style="width:60%"></span><span class="g"></span><span class="b"></span></span>
                            <span class="duel-foot">
                                <span>$2,000 pool</span>
                                <span class="duel-cta">View results <span>&rarr;</span></span>
                            </span>
                        </button>
                    </div>
                </div>
            </section>

                        <!-- ═════ 7b · FAQ / SCHEDULE OF COMMON QUESTIONS ═════ -->
            <section class="faq reveal" id="terms" aria-labelledby="faq-h">
                <div class="faq-grid">
                    <div class="rail">
                        <div class="eyebrow rise" style="--d:40ms">SCHEDULE OF COMMON QUESTIONS</div>
                        <h2 id="faq-h" class="clip-wipe" style="--d:120ms">Everything a contract<br />does to your money</h2>
                        <p class="rise" style="--d:220ms">Nine clauses covering custody, the window, settlement, and what Collateral can see on the accounts you connect.</p>
                        <div class="note rise" style="--d:320ms">
                            <b>CLERK'S NOTE</b>
                            <span>If a question is not answered here, it is answered in the full terms. Nothing material is kept off this page.</span>
                        </div>
                    </div>

                    <div class="sched" id="sched">
                        <div class="group rise" style="--d:160ms">&sect; 1 &nbsp;CUSTODY</div>

                        <div class="item open" style="--d:240ms">
                            <button class="q" aria-expanded="true" aria-controls="a11">
                                <span class="clause">&sect; 1.1</span>
                                <span class="qt">What happens to my deposit?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a11" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">It moves to a third-party custodian on Stripe Connect the moment the contract opens. Collateral never holds it. Hit your target and it returns to your card with the matched payout. Miss, and it settles to the forfeiture pool.</p>
                                </div>
                            </div>
                        </div>

                        <div class="item" style="--d:320ms">
                            <button class="q" aria-expanded="false" aria-controls="a12">
                                <span class="clause">&sect; 1.2</span>
                                <span class="qt">Who decides whether I hit the target?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a12" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">The API you named in the contract. Collateral reads the same numbers your platform already reports, on the cadence listed in the register, and settles on whatever it finds. Nobody here reviews your work, and neither you nor a counterparty gets a vote.</p>
                                </div>
                            </div>
                        </div>

                        <div class="item" style="--d:400ms">
                            <button class="q" aria-expanded="false" aria-controls="a13">
                                <span class="clause">&sect; 1.3</span>
                                <span class="qt">What if the API is down at settlement?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a13" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">Settlement waits for the next successful read within a 72-hour grace window. If the platform still has not reported by then, the contract voids and your deposit returns in full. A broken oracle is never treated as a miss.</p>
                                </div>
                            </div>
                        </div>

                        <div class="group">&sect; 2 &nbsp;THE WINDOW</div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a21">
                                <span class="clause">&sect; 2.1</span>
                                <span class="qt">Can I move the deadline?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a21" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">No. The date is fixed when the contract opens and cannot be extended, paused, or renegotiated by either party. That constraint is the product.</p>
                                </div>
                            </div>
                        </div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a22">
                                <span class="clause">&sect; 2.2</span>
                                <span class="qt">Can I cancel?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a22" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">Within one hour of opening, yes, in full. After that the deposit is committed until the window closes.</p>
                                </div>
                            </div>
                        </div>

                        <div class="group">&sect; 3 &nbsp;THE POOL</div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a31">
                                <span class="clause">&sect; 3.1</span>
                                <span class="qt">Where does forfeited money go?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a31" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">Into the pool that funds matched payouts for people who hit their targets in the same period. Your miss pays someone else's win. Collateral takes a fee on settled contracts, disclosed before you sign, and takes nothing from the pool itself.</p>
                                </div>
                            </div>
                        </div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a32">
                                <span class="clause">&sect; 3.2</span>
                                <span class="qt">Is this gambling?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a32" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">The outcome depends on your own conduct against a target you set, measured by a source you nominate &mdash; not on chance or on an event outside your control. That is the distinction regulators draw, and it is why Collateral is not a broker, dealer, or exchange. It is also why we cannot promise you a return.</p>
                                </div>
                            </div>
                        </div>

                        <div class="group">&sect; 4 &nbsp;ACCESS</div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a41">
                                <span class="clause">&sect; 4.1</span>
                                <span class="qt">What can Collateral see on my accounts?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a41" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">Read-only scopes on the specific metrics listed in your contract, and nothing else. Collateral cannot post, message, refund, or change a setting on any account you connect, and you can revoke the token at any time without affecting an open contract's settlement.</p>
                                </div>
                            </div>
                        </div>

                        <div class="item">
                            <button class="q" aria-expanded="false" aria-controls="a42">
                                <span class="clause">&sect; 4.2</span>
                                <span class="qt">What if I disconnect the platform mid-contract?</span>
                                <span class="sign" aria-hidden="true"></span>
                            </button>
                            <div class="a" style="margin:0 !important; padding:0 !important; border:none !important; min-height:0 !important;" id="a42" role="region">
                                <div>
                                    <p style="margin:0 !important; padding:0 44px 20px 78px !important; line-height:1.72 !important; display:block !important; text-align:left !important;">The contract settles as a miss at the end of its window. Disconnecting removes the only source of truth it has, and an unverifiable target is treated the same as an unmet one. Reconnect before the window closes and settlement proceeds normally.</p>
                                </div>
                            </div>
                        </div>

                        <div class="tail">Full terms and settlement rules &mdash; <a href="/docs/terms">read the instrument</a></div>
                    </div>
                </div>
            </section>

            <!-- ═════ SITE FOOTER ═════ -->
            <footer class="site-footer" style="background:var(--bg, #FAF7F1); border-top:1px solid var(--rule, #D8D2C6); padding:64px 24px 72px; text-align:center; box-sizing:border-box; width:100%;">
                <div class="footer-inner" style="max-width:720px; margin:0 auto;">
                    <p class="footer-disclaimer" style="margin:0 0 28px; color:#55534E; font-family:ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size:12px; line-height:1.75; letter-spacing:0.01em; text-align:center;">
                        Deposits are held by a third-party custodian via Stripe Connect and are not held by Collateral. Outcomes are determined solely by read-only telemetry from the connected platform API named in the contract. Matching payouts are funded from forfeited deposits and sponsor contributions, is not interest, and is not guaranteed. Collateral is not a broker, dealer, exchange, investment adviser, or deposit institution. Forfeited capital is not recoverable. The settlement feed shows recently settled contracts and may be delayed. Figures shown are book totals as of 25 July 2026.
                    </p>
                    <div class="footer-meta mono" style="font-family:ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size:11px; letter-spacing:0.12em; color:#6B6862; text-transform:uppercase; display:flex; justify-content:center; align-items:center; gap:24px; flex-wrap:wrap;">
                        <span>&copy; 2026 COLLATERAL INC.</span>
                        <span>ALL RIGHTS RESERVED</span>
                        <a href="/docs/terms" style="color:#7A1F2B; text-decoration:none; border-bottom:1px solid currentColor; padding-bottom:1px;">TERMS OF SERVICE</a>
                    </div>
                </div>
            </footer>
        </div>
    `;
}

export function initLanding() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function money(n) {
        return '$' + Math.round(n).toLocaleString('en-US');
    }

    /* ── Motion System (Section Reveal Observers) ── */
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('is-in');
                    e.target.querySelectorAll('.r-item, .r-plate, .r-rule, .clip-wipe, .clip-reveal, .rise, .cm-rise, .card-rise, .item, .duel').forEach(child => {
                        child.classList.add('is-in');
                    });
                    revealObserver.unobserve(e.target);

                    // Count up book totals when Section 05 becomes active
                    if (e.target.id === 'record') {
                        const bookTotalEl = document.getElementById('book-total-amt');
                        countUp(bookTotalEl, 8700000, money);
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

        document.querySelectorAll('section, .reveal, .hero').forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            if (reduce || (rect.top < window.innerHeight * 0.95 && rect.bottom > 0)) {
                sec.classList.add('is-in');
                sec.querySelectorAll('.r-item, .r-plate, .r-rule, .clip-wipe, .clip-reveal, .rise, .cm-rise, .card-rise, .item, .duel').forEach(child => {
                    child.classList.add('is-in');
                });
                if (sec.id === 'record') {
                    countUp(document.getElementById('book-total-amt'), 8700000, money);
                }
            } else {
                revealObserver.observe(sec);
            }
        });
    } else {
        document.querySelectorAll('section, .reveal, .hero').forEach((sec) => {
            sec.classList.add('is-in');
            sec.querySelectorAll('.r-item, .r-plate, .r-rule, .clip-wipe, .clip-reveal, .rise, .cm-rise, .card-rise, .item, .duel').forEach(child => {
                child.classList.add('is-in');
            });
        });
    }

    function countUp(el, target, formatFn) {
        if (!el || reduce) {
            if (el) el.textContent = formatFn(target);
            return;
        }
        let start = null;
        const duration = 1500;
        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        function step(ts) {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            el.textContent = formatFn(target * easeOutQuart(p));
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ── 1 · Live Hero Tape Engine ── */
    var rowsEl = document.getElementById('rows');
    var escrowEl = document.getElementById('m-escrow');
    var settledEl = document.getElementById('m-settled');
    var countEl = document.getElementById('m-count');
    var clockEl = document.getElementById('clock');

    var SAMPLE_GOALS = [
        { g: '+20% revenue in 30 days',       u: '@revpilot',   p: 'Stripe API',   a: 2000, w: true  },
        { g: '50,000 subscribers in 60 days', u: '@deltacreator', p: 'YouTube API', a: 1000, w: true  },
        { g: '25,000 followers in 30 days',   u: '@marcusk',     p: 'X API',       a: 1500, w: false },
        { g: '$100k ARR in 90 days',          u: '@saasfounder', p: 'Stripe API',   a: 5000, w: true  },
        { g: '10,000 email leads in 30 days', u: '@growthlead',  p: 'Shopify API',  a: 1200, w: true  },
        { g: '100k views on launch video',    u: '@indiehacker', p: 'YouTube API', a: 800,  w: false }
    ];

    var escrow = 8700000;
    var settledToday = 34200;
    var settledCount = 48;
    var rowCounter = 100;
    var pickIndex = 4;

    function paint() {
        if (escrowEl)  escrowEl.textContent  = money(escrow);
        if (settledEl) settledEl.textContent = money(settledToday);
        if (countEl)   countEl.textContent   = settledCount + ' settled today';
    }

    function makeRow(data) {
        rowCounter++;
        var div = document.createElement('div');
        div.className = 'row';
        div.dataset.amt = data.a;
        div.dataset.win = data.w ? '1' : '0';
        div.innerHTML =
            '<div class="row-main">' +
                '<p class="row-goal"><span class="row-id" style="font-family:var(--mono);font-size:10px;opacity:.6;margin-right:8px">№ ' + rowCounter + '</span>' + data.g + '</p>' +
                '<p class="row-src">' + data.u + ' &middot; via ' + data.p + '</p>' +
            '</div>' +
            '<div class="row-right" style="min-width:90px;text-align:right">' +
                '<span class="row-amt">' + money(data.a) + '</span>' +
                '<span class="row-state"><span class="dot-live"></span>Pending</span>' +
            '</div>';
        return div;
    }

    if (rowsEl && rowsEl.children.length === 0) {
        for (var i = 0; i < 4; i++) {
            var item = SAMPLE_GOALS[i % SAMPLE_GOALS.length];
            var r = makeRow(item);
            if (i === 2) {
                r.classList.add('settled', 'won');
                var s = document.createElement('span');
                s.className = 'stamp static won';
                s.textContent = 'Approved';
                r.appendChild(s);
            }
            rowsEl.appendChild(r);
        }
    }

    function pick() {
        var item = SAMPLE_GOALS[pickIndex % SAMPLE_GOALS.length];
        pickIndex++;
        return item;
    }

    function settleTop() {
        if (!rowsEl || rowsEl.children.length === 0) return;
        var firstSettled = rowsEl.querySelector('.row.settled');
        if (firstSettled) {
            firstSettled.classList.add('exiting');
            setTimeout(function(){
                if (firstSettled.parentNode) firstSettled.parentNode.removeChild(firstSettled);
                while (rowsEl.children.length < 4) {
                    rowsEl.appendChild(makeRow(pick()));
                }
                paint();
            }, 420);
            return;
        }

        var row = rowsEl.children[0];
        if (row.classList.contains('settled')) {
            row.classList.add('exiting');
            setTimeout(function(){
                if (row.parentNode) row.parentNode.removeChild(row);
                while (rowsEl.children.length < 4) {
                    rowsEl.appendChild(makeRow(pick()));
                }
                paint();
            }, 420);
            return;
        }

        var amt = +row.dataset.amt, won = row.dataset.win === '1';
        row.classList.add('settled', won ? 'won' : 'lost');
        var stamp = document.createElement('span');
        stamp.className = 'stamp ' + (won ? 'won' : 'lost');
        stamp.textContent = won ? 'Approved' : 'Denied';
        row.appendChild(stamp);
        escrow -= amt;
        settledToday += won ? Math.round(amt * 1.12) : amt;
        if (settledCount < 54) settledCount++;
        paint();
        setTimeout(function(){
            row.classList.add('exiting');
            setTimeout(function(){
                if (row.parentNode) row.parentNode.removeChild(row);
                while (rowsEl.children.length < 4) {
                    rowsEl.appendChild(makeRow(pick()));
                }
                escrow += amt;
                escrow = Math.max(8400000, Math.min(8900000, escrow));
                paint();
            }, 420);
        }, 1500);
    }

    function tickClock(){
        if (!clockEl) return;
        var d = new Date();
        clockEl.textContent = String(d.getHours()).padStart(2,'0') + ':' +
            String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
    }

    paint();
    tickClock();

    if (window._lpClockInterval) clearInterval(window._lpClockInterval);
    if (window._lpSettleInterval) clearInterval(window._lpSettleInterval);

    window._lpClockInterval = setInterval(tickClock, 1000);
    window._lpSettleInterval = setInterval(settleTop, 4200);
    setTimeout(settleTop, 2400);

    /* ── 2 · Calculator Engine & Tiers Synchronizer ── */
    var depEl = document.getElementById('dep');
    var seg   = document.getElementById('seg');
    var tiers = document.getElementById('tiers');
    var days  = 30;
    var TIERS = {
        14:{name:'All-in', mult:4.0, miss:'Full forfeit'},
        30:{name:'Stake',  mult:2.5, miss:'Full forfeit'},
        60:{name:'Pledge', mult:1.5, miss:'Grace period'}
    };

    function calc(){
        if (!depEl) return;
        var dep = +depEl.value, t = TIERS[days], ret = dep * t.mult;
        const depOut = document.getElementById('dep-out');
        const winOut = document.getElementById('win-out');
        const oWin = document.getElementById('o-win');
        const oLose = document.getElementById('o-lose');
        const tTier = document.getElementById('t-tier');
        const tMult = document.getElementById('t-mult');
        const tNet = document.getElementById('t-net');
        const tMiss = document.getElementById('t-miss');
        const calcGo = document.getElementById('calc-go');

        if (depOut) depOut.textContent = money(dep);
        if (winOut) winOut.textContent = days + 'd';
        if (oWin) oWin.textContent   = money(ret);
        if (oLose) oLose.textContent  = '\u2212' + money(dep);
        if (tTier) tTier.textContent  = t.name;
        if (tMult) tMult.textContent  = t.mult.toFixed(1) + '\u00D7';
        if (tNet) tNet.textContent   = '+' + money(ret - dep);
        if (tMiss) tMiss.textContent  = t.miss;
        if (calcGo) calcGo.textContent = 'Lock ' + money(dep) + ' for ' + days + ' days';
        
        if (tiers) {
            tiers.querySelectorAll('.tier').forEach(function(card){
                card.dataset.active = (+card.dataset.tier === days) ? 'true' : 'false';
            });
        }
    }

    if (depEl) depEl.addEventListener('input', calc);
    if (seg) {
        seg.addEventListener('click', function(e){
            var b = e.target.closest('button[data-days]'); if (!b) return;
            days = +b.dataset.days;
            seg.querySelectorAll('button').forEach(function(x){
                x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
            });
            calc();
        });
    }
    if (tiers) {
        tiers.addEventListener('click', function(e){
            var card = e.target.closest('.tier'); if (!card) return;
            days = +card.dataset.tier;
            if (seg) {
                seg.querySelectorAll('button').forEach(function(x){
                    x.setAttribute('aria-pressed', +x.dataset.days === days ? 'true' : 'false');
                });
            }
            calc();
        });
    }
    calc();

    /* ── 3 · Forfeit Recirculation Flow ── */
    var track   = document.getElementById('track');
    var poolBar = document.getElementById('pool-bar');
    var poolAmt = document.getElementById('pool-amt');
    var winners = document.getElementById('winners') ? document.getElementById('winners').querySelectorAll('.winner') : [];
    var played  = false;

    function runFlow(){
        if (!track || !poolBar || !poolAmt) return;
        track.innerHTML = '';
        poolBar.style.width = '0%';
        poolAmt.textContent = '$0';
        winners.forEach(function(w){ w.classList.remove('paid'); });

        if (!reduce) {
            for (var i = 0; i < 10; i++) (function(i){
                var c = document.createElement('span');
                c.className = 'coin';
                c.style.top = (32 + Math.random()*36) + '%';
                track.appendChild(c);
                setTimeout(function(){ c.classList.add('go'); }, i * 150);
            })(i);
        }

        var delay = reduce ? 0 : 700;
        setTimeout(function(){
            poolBar.style.width = '100%';
            if (reduce) { poolAmt.textContent = money(1500); return; }
            countUp(poolAmt, 1500, money);
        }, delay);

        winners.forEach(function(w, i){
            setTimeout(function(){ w.classList.add('paid'); }, delay + 1300 + i * 260);
        });
    }

    const replayBtn = document.getElementById('replay');
    if (replayBtn) replayBtn.addEventListener('click', runFlow);

    const flowWrap = document.getElementById('flowwrap');
    if (flowWrap && 'IntersectionObserver' in window) {
        new IntersectionObserver(function(entries){
            entries.forEach(function(en){
                if (en.isIntersecting && !played) { played = true; runFlow(); }
            });
        }, {threshold:0.35}).observe(flowWrap);
    } else {
        runFlow();
    }

    
}


    /* ── Modes Section Switcher ── */
    (function initModesSection() {
        var MODES = {
            solo: {
                kind: "SOLO CONTRACT", a: "YOU", b: "YOU", amount: "$1,000",
                under: "LOCKED BY YOU, AGAINST YOU",
                rows: [["DEPOSIT","$1,000",""],["WINDOW","30 days",""],
                       ["ON SUCCESS","$2,500","win"],["ON MISS","\u2212$1,000","blood"]]
            },
            rivalry: {
                kind: "RIVALRY CONTRACT", a: "YOU", b: "THEM", amount: "$1,000",
                under: "MATCHED BY COUNTERPARTY",
                rows: [["DEPOSIT","$1,000",""],["WINDOW","30 days",""],
                       ["ON WIN","$2,000","win"],["ON LOSS","\u2212$1,000","blood"]]
            }
        };
        var ORDER = ["solo","rivalry"], INTERVAL = 7000, FADE = 320;

        var root = document.getElementById("modes"),
            card = document.getElementById("specimen"),
            tabs = { solo: document.getElementById("tab-solo"),
                     rivalry: document.getElementById("tab-rivalry") };

        if (!root || !card || !tabs.solo || !tabs.rivalry) {
            console.warn("[ModesSwitcher] Missing root or tab elements, aborting switcher init.");
            return;
        }

        var rowsEl = card.querySelector('[data-f="rows"]');
        if (!rowsEl) {
            console.warn("[ModesSwitcher] Missing [data-f='rows'] element in specimen card.");
        }

        var current = "solo", timer = null, stopped = false, paused = false;
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function paint(key) {
            try {
                var m = MODES[key];
                if (!m) return;
                var kindEl = card.querySelector('[data-f="kind"]');
                var aEl = card.querySelector('[data-f="a"]');
                var bEl = card.querySelector('[data-f="b"]');
                var amtEl = card.querySelector('[data-f="amount"]');
                var underEl = card.querySelector('[data-f="under"]');

                if (kindEl) kindEl.textContent = m.kind;
                if (aEl) aEl.textContent = m.a;
                if (bEl) bEl.textContent = m.b;
                if (amtEl) amtEl.textContent = m.amount;
                if (underEl) underEl.textContent = m.under;

                if (rowsEl) {
                    rowsEl.innerHTML = m.rows.map(function (r) {
                        return '<div class="t-row"><dt>' + r[0] + '</dt><span class="dots"></span>' +
                               '<dd class="' + r[2] + '">' + r[1] + '</dd></div>';
                    }).join("");
                }

                ORDER.forEach(function (k) {
                    if (tabs[k]) {
                        var isSel = (k === key);
                        tabs[k].setAttribute("aria-selected", String(isSel));
                    }
                });
                card.setAttribute("aria-labelledby", "tab-" + key);
                current = key;
            } catch (err) {
                console.error("[ModesSwitcher] Error during paint:", err);
            }
        }

        function show(key) {
            if (key === current) return;
            if (reduce) { paint(key); return; }
            card.classList.add("is-swapping");
            setTimeout(function () {
                paint(key);
                card.classList.remove("is-swapping");
            }, FADE);
        }

        function tick() {
            if (paused || stopped || document.hidden) return;
            show(current === "solo" ? "rivalry" : "solo");
        }

        function start() {
            if (!stopped && !reduce && !timer) {
                console.log("[ModesSwitcher] 7s Auto-advance timer started.");
                timer = setInterval(tick, INTERVAL);
            }
        }

        function halt() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        ORDER.forEach(function (k) {
            if (!tabs[k]) return;
            tabs[k].addEventListener("click", function (e) {
                if (e.target.closest("a")) return;
                stopped = true;
                halt();
                show(k);
            });
            tabs[k].addEventListener("keydown", function (e) {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                e.preventDefault();
                var next = k === "solo" ? "rivalry" : "solo";
                stopped = true;
                halt();
                show(next);
                tabs[next].focus();
            });
        });

        // Pointer & focus event handlers to ensure paused state is robust
        root.addEventListener("pointerenter",  function () { paused = true; });
        root.addEventListener("pointerleave",  function () { paused = false; });
        root.addEventListener("pointercancel", function () { paused = false; });
        root.addEventListener("focusin",        function () { paused = true; });
        root.addEventListener("focusout",       function (e) {
            if (!root.contains(e.relatedTarget)) paused = false;
        });
        window.addEventListener("blur",         function () { paused = false; });

        document.addEventListener("visibilitychange", function () {
            document.hidden ? halt() : start();
        });

        // Initial paint to render default Solo rows
        paint("solo");

        // Asynchronously measure height after layout settles to avoid reflow glitches
        setTimeout(function() {
            try {
                var hSolo = card.offsetHeight;
                paint("rivalry");
                var hRivalry = card.offsetHeight;
                paint("solo");
                var maxH = Math.max(hSolo, hRivalry);
                if (maxH > 0) {
                    card.style.setProperty("--spec-h", maxH + "px");
                }
            } catch (e) {
                console.error("[ModesSwitcher] Height measure error:", e);
            }
        }, 100);

        start();
    })();


    /* ── Section 3 Comparison Row Motion Observer ── */
    (function initComparisonMotion() {
        var cmpTable = document.querySelector('#case .cmp');
        if (!cmpTable) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        if ('IntersectionObserver' in window) {
            var cmpIo = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        cmpTable.classList.add('is-animated');
                        cmpIo.disconnect();
                    }
                });
            }, { threshold: 0.25 });
            cmpIo.observe(cmpTable);
        } else {
            cmpTable.classList.add('is-animated');
        }
    })();


    /* ── Schedule of Common Questions Accordion Controller (Delegated & Global) ── */
    (function initFaqAccordion() {
        if (window.__faqAccordionHandler) {
            document.removeEventListener("click", window.__faqAccordionHandler, true);
        }

        window.__faqAccordionHandler = function (e) {
            var btn = e.target && e.target.closest && e.target.closest(".faq .q, #sched .q");
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            var item = btn.closest(".item");
            var isExpanded = btn.getAttribute("aria-expanded") === "true";
            var nextState = !isExpanded;

            btn.setAttribute("aria-expanded", String(nextState));

            if (item) {
                item.classList.toggle("open", nextState);
            }
        };

        document.addEventListener("click", window.__faqAccordionHandler, true);
    })();



export const initLandingEvents = initLanding;
