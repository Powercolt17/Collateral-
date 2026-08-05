// Landing Page — Collateral Financial Document System with Paper Grain & Scoped Styling
import api from '../api.js';
import { landingCSS } from './LandingStyles.js';
import { motionController, animateValue, initEntranceObservers, revealStyles } from './LandingMotion.js';
import { renderCollateralHero } from '../components/CollateralHero.js';
import { renderForkSection } from '../components/ForkSection.js';
import { renderCaseSection } from '../components/CaseSection.js';
import { renderOracleSection } from '../components/OracleSection.js';
import { renderRecordSection, initRecordSection } from '../components/RecordSection.js';
import { renderFlowSection, initFlowSection } from '../components/FlowSection.js';
import { renderPriceSection, initPriceSection } from '../components/PriceSection.js';
import { renderDuelSection, initDuelSection } from '../components/DuelSection.js';
import { renderScheduleSection, initScheduleSection } from '../components/ScheduleSection.js';
import { renderLedgerSection, initLedgerSection } from '../components/LedgerSection.js';

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
            ${renderCaseSection()}

            <!-- ═════ 3b · ORACLE REGISTER ═════ -->
            ${renderOracleSection()}

            <!-- ═════ 4 · RECORD ═════ -->
            ${renderRecordSection()}


            <!-- ═════ 5 · FORFEIT FLOW ═════ -->
            ${renderFlowSection()}

            ${renderPriceSection()}

            ${renderDuelSection()}

            ${renderScheduleSection()}

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
    /* The ledger takes over its own rows from the live API. Fire and forget: it
       resolves on its own and never rejects into here, and if it fails the rows
       rendered at build time stay on screen rather than the section emptying. */
    initLedgerSection();
    initFlowSection();
    initPriceSection();
    initDuelSection();
    initScheduleSection();
    initRecordSection();

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

                    /* The count-up to 8700000 that lived here is gone with the
                       markup it animated. It was a hardcoded figure counting to
                       a total capital settled of .7M against a real
                       totalPaidOut of 0. RecordSection now reads its own totals
                       from the register. */
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
