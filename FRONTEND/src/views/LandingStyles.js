// Collateral — Landing Styles (Institutional Document Design System & Motion Tokens)
import { revealStyles } from "./LandingMotion";

export const landingCSS = `
/* ═══════════ TOKENS ═══════════ */

/* ═══════════ REMOVE DOTS / SLASHES IN ZERO (GLOBAL) ═══════════ */
.cl-root, .cl-root *, .cl-root *::before, .cl-root *::after {
  font-feature-settings: "zero" 0, "cv01" 0, "cv02" 0, "tnum" 1 !important;
  -webkit-font-feature-settings: "zero" 0, "cv01" 0, "cv02" 0, "tnum" 1 !important;
  -moz-font-feature-settings: "zero" 0, "cv01" 0, "cv02" 0, "tnum" 1 !important;
  font-variant-numeric: lining-nums tabular-nums !important;
}

.cl-root {
  --paper: #F7F4ED;
  --paper-alt: #EFEAE0;
  --paper-deep: #E7E1D4;
  --plate: #FFFDF9;
  --notch: #F7F4ED;
  --ink: #0E1420;
  --ink-2: #4A5464;
  --ink-3: #6E7686;
  --ink-4: #9AA0AC;
  --blood: #7A1C29;
  --blood-deep: #54111B;
  --blood-mid: #9B3341;
  --blood-tint: #F5E6E8;
  --blood-wash: #FBF3F4;
  --win: #186B4A;
  --win-tint: #E6F1EA;
  --win-wash: #F2F8F4;
  --gilt: #A8854E;
  --rule: #DCD5C6;
  --rule-soft: #EAE4D8;
  --rule-strong: #BDB3A0;
  --display: "Archivo", system-ui, sans-serif;
  --wordmark: "Archivo", system-ui, sans-serif;
  --body: "Public Sans", system-ui, sans-serif;
  --mono: "Roboto Mono", "Segoe UI Mono", "Cascadia Code", system-ui, monospace;
  --shell: 1240px;
  --gutter: 28px;
  --section-y: 132px;
  --r: 2px;
  --lift: 0 1px 2px rgba(14,20,32,.04), 0 12px 28px -18px rgba(14,20,32,.22);
  --lift-lg: 0 2px 4px rgba(14,20,32,.05), 0 40px 80px -44px rgba(14,20,32,.42);
  --ease: cubic-bezier(.22,.85,.26,1);
}

@media(max-width:900px){
  .cl-root { --section-y: 84px; --gutter: 20px }
}

.cl-root *, .cl-root *::before, .cl-root *::after {
  box-sizing: border-box;
}

html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
}

:target, section[id], div[id], .section, [id] {
  scroll-margin-top: 84px;
}
@media (max-width: 760px) {
  :target, section[id], div[id], .section, [id] {
    scroll-margin-top: 76px;
  }
}

.cl-root {
  position: relative;
  background: var(--paper) !important;
  color: var(--ink);
  font-family: var(--body);
  font-size: 17px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  min-height: 100vh;
  opacity: 1;
}

.cl-root svg { display: block; max-width: 100%; }
.cl-root a { color: inherit; }
.cl-root h1, .cl-root h2, .cl-root h3, .cl-root p, .cl-root dl, .cl-root dd,
.cl-root figure, .cl-root blockquote, .cl-root ul { margin: 0; }

.cl-grain {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: .5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E");
}

.cl-root > *:not(.cl-grain) {
  position: relative;
  z-index: 2;
}

.shell {
  max-width: var(--shell);
  margin: 0 auto;
  padding-inline: var(--gutter);
}

.section {
  padding-block: var(--section-y);
  position: relative;
}

.alt {
  background: var(--paper-alt);
  --notch: #EFEAE0;
}

.alt::before, .alt::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--rule-strong) 12%, var(--rule-strong) 88%, transparent);
}

.alt::before { top: 0; }
.alt::after { bottom: 0; }

/* ═══════════ CLERICAL VOICE ═══════════ */
.mono {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-feature-settings: "tnum" 1;
}

.mono-b { color: var(--blood); }

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--win);
  flex: none;
  box-shadow: 0 0 0 3px rgba(24,107,74,.14);
}

.dots {
  flex: 1;
  border-bottom: 1px dotted var(--rule-strong);
  transform: translateY(-3px);
  opacity: .75;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 22px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--blood);
}

.eyebrow::before {
  content: "";
  width: 26px;
  height: 3px;
  flex: none;
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
}

.eyebrow--live { color: var(--ink-2); }
.eyebrow--live::before {
  width: 5px;
  height: 5px;
  border: 0;
  border-radius: 50%;
  background: var(--win);
  box-shadow: 0 0 0 3px rgba(24,107,74,.14);
}

.eyebrow--c { justify-content: center; }

.title {
  margin: 0 0 26px !important;
  font-family: var(--display);
  font-size: clamp(30px, 4.3vw, 50px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -.034em;
  max-width: 17ch;
  text-wrap: balance;
}

.title--c {
  max-width: 21ch;
  margin-inline: auto;
  text-align: center;
}

.lede {
  margin: 0;
  font-size: 17.5px;
  line-height: 1.68;
  color: var(--ink-2);
  max-width: 54ch;
  text-wrap: pretty;
}

.lede--c {
  margin-inline: auto;
  text-align: center;
}

.link {
  position: relative;
  font-size: 14px;
  font-weight: 600;
  color: var(--blood);
  text-decoration: none;
  padding-bottom: 3px;
  display: inline-block;
}

.link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: currentColor;
  transform-origin: left;
  transition: transform .35s var(--ease);
}

.link:hover::after { transform: scaleX(.4); }

.cl-root :where(a, button, input, [tabindex]):focus-visible {
  outline: 1px solid var(--blood);
  outline-offset: 4px;
}

/* ═══════════ PLATE ═══════════ */
.plate {
  position: relative;
  background: var(--plate);
  border: 1px solid var(--ink);
  border-radius: var(--r);
  box-shadow: var(--lift);
}

.plate::after {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1px solid var(--rule-soft);
  pointer-events: none;
}

.plate-quiet {
  position: relative;
  background: var(--plate);
  border: 1px solid var(--rule);
  border-radius: var(--r);
  box-shadow: var(--lift);
}

.ticks::before, .ticks::after {
  content: "";
  position: absolute;
  width: 11px;
  height: 11px;
  background: transparent !important;
  pointer-events: none;
  opacity: .75;
  z-index: 3;
}

.ticks::before {
  top: 1px;
  left: 1px;
  border-top: 1px solid var(--gilt);
  border-left: 1px solid var(--gilt);
  border-bottom: none !important;
  border-right: none !important;
}

.ticks::after {
  bottom: 1px;
  right: 1px;
  border-bottom: 1px solid var(--gilt);
  border-right: 1px solid var(--gilt);
  border-top: none !important;
  border-left: none !important;
}

/* ═══════════ GLOBAL BANNER HIDE ON LANDING ═══════════ */
#global-banner {
  display: none !important;
}

/* ═══════════ HEADER ═══════════ */
.ln {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 60;
  background: rgba(247,244,237,.95);
  backdrop-filter: saturate(1.6) blur(14px);
  -webkit-backdrop-filter: saturate(1.6) blur(14px);
  border-bottom: 1px solid var(--rule-soft);
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.ln.nav-scrolled {
  background: rgba(255,255,255,0.96) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.03);
}

.ln-in {
  width: 100%;
  max-width: 100%;
  padding: 0 24px 0 48px;
  height: 68px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ln-brand {
  font-family: 'Nevera', 'Aquire', 'Cinzel', sans-serif !important;
  font-size: 21px !important;
  font-weight: 700 !important;
  letter-spacing: .14em !important;
  color: #0E1420 !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  text-transform: uppercase;
  transition: opacity 0.2s ease;
}

.ln-brand:hover {
  opacity: 0.85;
}

.logo-wordmark {
  font-family: 'Trajan Pro', 'Nevera', 'Aquire', 'Cinzel', sans-serif !important;
  color: #0E1420 !important;
  /* 400 and no synthesis: Trajan Pro ships one weight, and a 700 request makes
     the browser fake a bold by smearing the outlines. */
  font-weight: 400 !important;
  font-synthesis: none;
  letter-spacing: .14em !important;
  text-transform: uppercase !important;
}

footer .logo-wordmark,
footer .logo-wordmark-light,
#global-footer .logo-wordmark,
#global-footer .logo-wordmark-light {
  color: #FFFFFF !important;
}

.ln-right-group {
  display: flex;
  align-items: center;
  gap: 28px;
}

.ln-cta {
  background: transparent !important;
  color: var(--ink) !important;
  font-family: var(--body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 9px 20px;
  border: 1px solid var(--ink) !important;
  border-radius: 4px;
  cursor: pointer;
  transition: all .2s ease;
}

.ln-cta:hover {
  background: var(--paper-alt) !important;
  color: var(--ink) !important;
}

.ch-hamburger {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.ch-hamburger:hover {
  opacity: 0.7;
}

.ch-hamburger-lines {
  width: 18px;
  height: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ch-hamburger-lines span {
  display: block;
  width: 100%;
  height: 1.5px;
  background: #111;
  border-radius: 1px;
  transition: transform 0.3s ease, opacity 0.3s ease, width 0.3s ease;
  transform-origin: center;
}

.ch-hamburger-lines span:nth-child(2) {
  width: 12px;
  margin-left: auto;
}

@media(max-width:760px){
  .ln-in { padding: 0 16px; height: 60px; }
  .ln-right-group { gap: 16px; }
}

/* ═══════════ BUTTONS & ACTIONS ═══════════ */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 28px;
  border: 1px solid transparent;
  border-radius: var(--r);
  font-family: var(--body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background .25s var(--ease), color .25s var(--ease), border-color .25s var(--ease), box-shadow .25s var(--ease), transform .25s var(--ease);
}

.btn:active { transform: translateY(1px); }

.btn-fill {
  background: var(--blood);
  color: #FFF8F5 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 10px 24px -16px rgba(122,28,41,.85);
}

.btn-fill:hover {
  background: var(--blood-deep);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 16px 32px -16px rgba(122,28,41,.9);
}

.btn-out {
  background: transparent !important;
  border: 1px solid var(--ink) !important;
  color: var(--ink) !important;
}

.btn-out:hover {
  background: var(--ink) !important;
  color: var(--paper) !important;
  box-shadow: 0 12px 26px -18px rgba(14,20,32,.8);
}

/* ═══════════ SECTION INDEX MARK ═══════════ */
.idx-mark {
  position: absolute;
  top: calc(var(--section-y) - 30px);
  right: max(var(--gutter), calc((100vw - var(--shell)) / 2));
  font-family: var(--display);
  font-size: 136px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.06em;
  color: var(--ink);
  opacity: .035;
  pointer-events: none;
  user-select: none;
}

@media(max-width:1280px){
  .idx-mark { display: none; }
}

/* ═══════════ HERO (authoritative block) ═══════════ */
.hero { padding-block: 88px 104px; }
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(0, .96fr);
  gap: 64px;
  align-items: center;
}

@media(max-width:1020px){
  .hero-grid { grid-template-columns: 1fr; gap: 52px; }
  .hero { padding-block: 52px 72px; }
}

.h1 {
  font-family: var(--display);
  font-size: clamp(44px, 7.2vw, 92px);
  font-weight: 700;
  line-height: .9;
  letter-spacing: -.046em;
  text-transform: uppercase;
  color: var(--ink);
}

.h1 .em { color: var(--blood); }
.hero-copy { margin: 32px 0 0; max-width: 42ch; color: var(--ink-2); font-size: 17.5px; line-height: 1.68; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 48px; }

.oracles {
  position: relative;
  margin-top: 42px;
  padding-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 26px;
  align-items: center;
}

.oracles a {
  text-decoration: none;
  color: var(--ink);
  border-bottom: 1px solid transparent;
  padding-bottom: 2px;
  transition: border-color .3s var(--ease), color .3s var(--ease);
}

.oracles a:hover {
  border-color: var(--blood);
  color: var(--blood);
}

.rule-top {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  border-top: 1px solid var(--rule-strong);
  border-bottom: 1px solid var(--rule-soft);
}

/* ═══════════ LIVE TAPE ═══════════ */
.tape {
  position: relative;
  background: var(--plate);
  border: 1px solid var(--ink);
  border-radius: var(--r);
  overflow: hidden;
  box-shadow: var(--lift-lg);
}

.tape-head {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--rule);
  background: linear-gradient(180deg, #FFFEFB, #FBF8F2);
}

.pulse { position: relative; }
.pulse::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid var(--win);
  animation: cl-ring 2.6s ease-out infinite;
}

@keyframes cl-ring {
  0% { transform: scale(.6); opacity: .85; }
  100% { transform: scale(2.4); opacity: 0; }
}

.tape-meters {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  border-bottom: 1px solid var(--rule);
}

.meter { padding: 17px 20px; }
.meter .mono { display: block; margin-bottom: 8px; }
.meter-val {
  font-family: var(--mono);
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.022em;
  font-weight: 500;
}

.meter-val.blood { color: var(--blood); }
.meter-val.win { color: var(--win); }
.meter-div { background: var(--rule); }

.tape-rows {
  position: relative;
  min-height: 150px;
}

.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13.5px 20px;
  border-bottom: 1px dotted var(--rule);
  overflow: hidden;
  transition: background .55s var(--ease), opacity .45s var(--ease), transform .45s var(--ease);
}

.row:last-child { border-bottom: 0; }
.row-main { min-width: 0; flex: 1; }

.row-goal {
  font-family: var(--display);
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -.014em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-src {
  margin-top: 3px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .09em;
  color: var(--ink-4);
}

.row-right { text-align: right; flex: none; }
.row-amt { font-family: var(--mono); font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 500; }
.row-state {
  display: block;
  margin-top: 4px;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-4);
  transition: opacity .2s ease;
}

.row.won { background: var(--win-wash); }
.row.lost { background: var(--blood-wash); }
.row.won .row-amt { color: var(--win); }
.row.lost .row-amt { color: var(--blood); }
.row.exiting { opacity: 0; transform: translateY(-10px); }
.row.settled .row-state { opacity: 0; }

.stamp {
  position: absolute;
  right: 86px;
  top: 50%;
  border: 2px solid currentColor;
  border-radius: 2px;
  padding: 4px 9px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  pointer-events: none;
  transform-origin: center;
  animation: cl-press .46s cubic-bezier(.18,.92,.24,1) forwards;
}

/* Static stamp: rendered at mount, not triggered by settleTop — skip animation */
.stamp.static {
  animation: none;
  opacity: .78;
  transform: translateY(-50%) rotate(-11deg) scale(1);
}

.stamp.won { color: var(--win); }
.stamp.lost { color: var(--blood); }

@keyframes cl-press {
  0% { transform: translateY(-50%) rotate(-15deg) scale(2.6); opacity: 0; }
  55% { opacity: .98; }
  80% { transform: translateY(-50%) rotate(-13deg) scale(.93); opacity: .88; }
  100% { transform: translateY(-50%) rotate(-11deg) scale(1); opacity: .78; }
}

@keyframes cl-fade-in {
  0% { opacity: 0; }
  100% { opacity: 0.85; }
}

@media(max-width:760px) {
  .row {
    position: relative !important;
    padding: 13.5px 16px !important;
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 4px 12px !important;
  }
  .row-main {
    flex: 1 1 100% !important;
    min-width: 0 !important;
  }
  .row-right {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    min-width: 0 !important;
    text-align: left !important;
    margin-top: 2px !important;
  }
  .row.settled .row-state {
    display: none !important;
  }
  .stamp, .stamp.static {
    position: static !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    margin: 0 0 0 auto !important;
    transform: rotate(-4deg) !important;
    animation: cl-fade-in 0.3s ease forwards !important;
    font-size: 9px !important;
    padding: 2px 6px !important;
    line-height: 1.2 !important;
    letter-spacing: 0.12em !important;
    border-width: 1.5px !important;
    flex-shrink: 0 !important;
    display: inline-block !important;
    vertical-align: middle !important;
    box-sizing: border-box !important;
  }
}

.tape-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--rule);
  background: #FBF8F2;
}

/* ═══════════ TWO-PANEL MODE COMPARISON ═══════════ */
.modes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, .8fr);
  gap: 36px;
  margin-top: 52px;
  align-items: stretch;
}

@media(max-width:1020px){
  .modes { grid-template-columns: 1fr; }
}

.plates {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  overflow: hidden;
  border-radius: var(--r, 2px);
  border: 1px solid var(--rule, #DCD5C6);
  background: var(--paper, #FFFDF9);
}

.vrule {
  background: var(--blood, #7A1C29);
  width: 1px;
  height: 100%;
}

@media(max-width:767px){
  .plates { grid-template-columns: 1fr; }
  .vrule { height: 1px; width: 100%; }
}

.leaf {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

/* CREAM PANEL TOKENS: ink=#0E1420, muted=#6E7686, accent=#7A1C29, paper=#FFFDF9 */
.leaf--cream {
  background: var(--paper, #FFFDF9);
  color: var(--ink, #0E1420);
}

/* MAROON PANEL TOKENS: ink=#FFF8F5, muted=rgba(255,248,245,0.70), accent=#F0C493 (pale gold), bg=#6E1723 */
.leaf--dark {
  background: #6E1723 !important;
  color: #FFF8F5 !important;
}

/* FULL-BLEED ILLUSTRATIONS */
.leaf-art {
  position: relative;
  width: 100%;
  height: 180px;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  flex: none;
}

.leaf--cream .leaf-art {
  background: var(--paper, #FFFDF9);
}
.leaf--dark .leaf-art {
  background: #6E1723;
}

.leaf-.media-cover img, .card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.4s ease;
}
.leaf:hover .leaf-img {
  transform: scale(1.03);
}

/* CARD CHROME STARTS BELOW IMAGE */
.leaf-body {
  padding: 24px 26px 26px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.leaf-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.leaf--cream .leaf-mode-tag, .leaf--cream .leaf-form-ref {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--blood, #7A1C29);
}

.leaf--dark .leaf-mode-tag, .leaf--dark .leaf-form-ref {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
  color: #F0C493 !important; /* Pale gold accent */
}

/* SHARED HEADLINE BASELINE GRID */
.leaf-name {
  margin: 0 0 6px;
  font-family: var(--display, 'Archivo', sans-serif);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -.028em;
  min-height: 52px;
}
.leaf--cream .leaf-name { color: var(--ink, #0E1420); }
.leaf--dark .leaf-name { color: #FFF8F5 !important; }

/* ═══════════ CONTRACT MODES STYLING & ANIMATION ═══════════ */
.cm-root, .cm-root * {
  box-sizing: border-box;
}

.cm-root p, .cm-root h2, .cm-root ul {
  margin: 0;
}

.cm-root {
  display: block !important;
  width: 100%;
  padding: 48px 0 56px !important;
}

.cm-band {
  height: 165px;
  overflow: hidden;
  display: block;
}

.cm-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transition: transform 540ms cubic-bezier(0.22, 1, 0.36, 1);
}

.cm-term {
  position: relative;
  padding: 4px 0 4px 18px;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 12.5px;
  line-height: 1.5;
}

/* Staggered Animations */
.cm-rise, .cm-panel, .cm-block, .cm-step {
  opacity: 0;
  transition:
    opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

.cm-rise { transform: translateY(10px); }
.cm-panel, .cm-block, .cm-step { transform: translateY(24px); }

/* Mode Hero Title Display (SOLO / RIVALRY) */
.cm-hero-title {
  font-family: var(--display, 'Archivo', sans-serif);
  font-weight: 700;
  font-size: clamp(36px, 6.2vw, 72px);
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 14px 0 24px 0 !important;
  opacity: 0;
  clip-path: inset(0 0 100% 0);
  transform: translateY(6px);
  transition:
    opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    clip-path 720ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

.leaf--cream .cm-hero-title { color: #1A1A18; }
.leaf--dark .cm-hero-title { color: #E8B4B4 !important; }

/* Demoted Single Inline Versus Line */
.cm-vs-line {
  font-family: var(--display, 'Archivo', sans-serif);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.06em;
  margin: 0 0 28px 0 !important;
  opacity: 0;
  transition: opacity 540ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

.leaf--cream .cm-vs-line { color: #1A1A18; }
.leaf--dark .cm-vs-line { color: #F0E3D8; }

.cm-vs-tag {
  font-size: 11px;
  letter-spacing: 0.2em;
  margin: 0 8px;
  font-weight: 500;
}

.leaf--cream .cm-vs-tag { color: #8C877B; }
.leaf--dark .cm-vs-tag { color: rgba(240, 227, 216, 0.5); }

.cm-them {
  color: #E8B4B4 !important;
}

/* ═══════════ UNIFIED HOMEPAGE MOTION FRAMEWORK ═══════════ */
.clip-wipe,
.clip-reveal {
  opacity: 0;
  clip-path: inset(0 0 100% 0);
  transform: translateY(6px);
  transition:
    opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    clip-path 720ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

.rise,
.cm-rise,
.r-item {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

.card-rise,
.cm-panel,
.cm-block,
.cm-step,
.r-plate,
.receipt,
.duel {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms),
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms);
}

/* Revealed Animation States */
.is-in .clip-wipe,
.is-in .clip-reveal,
.reveal.is-in .clip-wipe,
.reveal.is-in .clip-reveal,
.is-in.clip-wipe,
.is-in.clip-reveal {
  opacity: 1;
  clip-path: inset(0 0 0 0);
  transform: translateY(0);
}

.is-in .rise,
.is-in .cm-rise,
.is-in .r-item,
.reveal.is-in .rise,
.reveal.is-in .cm-rise,
.reveal.is-in .r-item,
.is-in.rise,
.is-in.r-item {
  opacity: 1;
  transform: translateY(0);
}

.is-in .card-rise,
.is-in .cm-panel,
.is-in .cm-block,
.is-in .cm-step,
.is-in .r-plate,
.is-in .receipt,
.is-in .faq .item,
.is-in .duel,
.reveal.is-in .card-rise,
.reveal.is-in .cm-panel,
.reveal.is-in .cm-block,
.reveal.is-in .cm-step,
.reveal.is-in .r-plate,
.reveal.is-in .receipt,
.reveal.is-in .faq .item,
.reveal.is-in .duel {
  opacity: 1;
  transform: translateY(0);
}

/* ═══════════ HERO LINE 4-BEAT ANIMATION SYSTEM ═══════════ */
@keyframes hl-strike {
  from { clip-path: inset(0 0 100% 0); transform: translateY(6px); }
  to   { clip-path: inset(0 0 0 0);    transform: translateY(0); }
}

@keyframes hl-draw {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

@keyframes hl-tick {
  0%   { opacity: 0; transform: translateY(-16px) scaleY(0.5); }
  62%  { opacity: 1; transform: translateY(3px)  scaleY(1.12); }
  100% { opacity: 1; transform: translateY(0)    scaleY(1); }
}

@keyframes hl-fill {
  from { width: 0%; }
  to   { width: var(--fill, 66%); }
}

@keyframes hl-fade {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hl-headline {
  position: relative;
  font-family: var(--display, 'Archivo', sans-serif);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.08;
  color: var(--ink, #0E1420);
  margin: 0 0 1rem 0 !important;
}

.hl-w {
  display: inline-block;
  clip-path: inset(0 0 100% 0);
  animation: hl-strike 420ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms) forwards;
}

.hl-anchor {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}

.hl-rule {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.12em;
  height: 0.085em;
  background: var(--rule, #DED9CC);
  transform: scaleX(0);
  transform-origin: left;
  animation: hl-draw 560ms cubic-bezier(0.22, 1, 0.36, 1) 920ms forwards;
}

.hl-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--blood, #7A1C29);
  animation: hl-fill 780ms cubic-bezier(0.22, 1, 0.36, 1) 1580ms forwards;
}

.hl-tick {
  position: absolute;
  right: 0;
  top: -0.11em;
  bottom: -0.11em;
  width: 2px;
  background: var(--ink, #0E1420);
  opacity: 0;
  animation: hl-tick 430ms cubic-bezier(0.34, 1.4, 0.64, 1) 1420ms forwards;
}

.hl-meta {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--slate, #8C877B);
  margin: 0 0 24px 0 !important;
  opacity: 0;
  animation: hl-fade 540ms cubic-bezier(0.22, 1, 0.36, 1) 2200ms forwards;
}

@media (prefers-reduced-motion: reduce) {
  .hl-w, .hl-rule, .hl-fill, .hl-tick, .hl-meta {
    animation: none !important;
  }
  .hl-w {
    clip-path: none !important;
    transform: none !important;
  }
  .hl-rule {
    transform: scaleX(1) !important;
  }
  .hl-fill {
    width: var(--fill, 66%) !important;
  }
  .hl-tick, .hl-meta {
    opacity: 1 !important;
    transform: none !important;
  }
}

.cm-live .cm-hero-title, .reveal.is-in .cm-hero-title {
  opacity: 1;
  clip-path: inset(0 0 0 0);
  transform: translateY(0);
}

.cm-live .cm-vs-line, .reveal.is-in .cm-vs-line {
  opacity: 1;
}

/* Bordered Frame */
.cm-frame {
  border: 1px solid #1A1A18;
  overflow: hidden;
}

.cm-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.cm-grid > article:first-child {
  border-right: 1px solid #1A1A18;
}

.cm-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.leaf--cream {
  background: #FBFAF6;
  color: #1A1A18;
}

.leaf--dark {
  background: #5E1E2E !important;
  color: #F0E3D8 !important;
}

.cm-panel-body {
  padding: 16px 20px 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cm-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 10px;
  letter-spacing: 0.15em;
  margin-bottom: 0;
}

.leaf--cream .cm-meta-row span:first-child { color: #8C877B; }
.leaf--cream .cm-meta-row span:last-child { color: #8C877B; }

.leaf--dark .cm-meta-row span:first-child { color: rgba(240, 227, 216, 0.5); }
.leaf--dark .cm-meta-row span:last-child { color: rgba(240, 227, 216, 0.45); }

.cm-terms-list {
  list-style: none;
  margin: 0 !important;
  padding: 16px 0 0 !important;
  border-top: 1px solid #D8D3C6;
}

.leaf--dark .cm-terms-list {
  border-top-color: rgba(240, 227, 216, 0.25);
}

.cm-term {
  position: relative;
  padding: 5px 0 5px 22px;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 13.5px !important;
  line-height: 1.55;
  font-weight: 500;
}

.leaf--cream .cm-term {
  color: #1A1A18 !important;
}

.leaf--dark .cm-term {
  color: #FFF8F5 !important;
}

.cm-bullet {
  position: absolute;
  left: 0;
  top: 5px;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-weight: 700;
  font-size: 14px;
}

.leaf--cream .cm-bullet { color: #7A1C29 !important; }
.leaf--dark .cm-bullet { color: #F0C493 !important; }

.cm-cta-wrap {
  margin-top: auto;
  padding: 16px 20px 18px;
}

.cm-cta-link {
  display: inline-block;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: #2F4370;
  padding-bottom: 3px;
  border-bottom: 1px solid #2F4370;
  transition: opacity 160ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.leaf--dark .cm-cta-link {
  color: #E8B4B4;
  border-bottom-color: #E8B4B4;
}

.cm-panel:hover .cm-cta-link {
  opacity: 0.7;
  transform: translateX(4px);
}

.cm-panel:hover .cm-img {
  transform: scale(1.05);
}

/* Bottom Settlement Band */
.cm-settle {
  border-top: 1px solid #1A1A18;
  background: #FBFAF6;
}

.cm-settle-head {
  padding: 14px 20px 12px;
  border-bottom: 1px solid #D8D3C6;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.cm-settle-title {
  font-family: var(--display, 'Archivo', sans-serif);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: #1A1A18;
}

.cm-settle-tag {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #8C877B;
  text-transform: uppercase;
}

.cm-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cm-step {
  padding: 16px 20px;
  border-left: 1px solid #D8D3C6;
  text-align: left;
}

.cm-step:first-child {
  border-left: none;
}

.cm-step-n {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 10px;
  letter-spacing: 0.16em;
  color: #2F4370;
  margin-bottom: 6px;
}

.cm-step-title {
  font-family: var(--display, 'Archivo', sans-serif);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.01em;
  color: #1A1A18;
  margin-bottom: 4px;
}

.cm-step-body {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 13px !important;
  line-height: 1.6;
  color: #2D2B26 !important;
  font-weight: 450;
}

.cm-lede {
  max-width: 480px;
}

@media (max-width: 760px) {
  .cm-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .cm-grid > article:first-child {
    border-right: none;
    border-bottom: 1px solid #1A1A18;
  }
  .cm-steps {
    grid-template-columns: minmax(0, 1fr);
  }
  .cm-step {
    border-left: none;
    border-top: 1px solid #D8D3C6;
  }
  .cm-step:first-child {
    border-top: none;
  }
  .cm-band {
    height: 155px;
  }
  .cm-hero-title {
    font-size: clamp(34px, 8.5vw, 56px);
    margin: 12px 0 18px 0 !important;
  }
  .cm-vs-line {
    margin: 0 0 20px 0 !important;
  }
  .cm-panel-body {
    padding: 16px 16px 0;
  }
  .cm-cta-wrap {
    padding: 16px 16px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cm-rise, .cm-vs, .cm-word, .cm-panel, .cm-block, .cm-step, .cm-img, .cm-cta-link, .cm-word-them {
    transition: none !important;
  }
  .cm-rise, .cm-vs, .cm-word, .cm-panel, .cm-block, .cm-step {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
  .cm-vs { letter-spacing: 0.26em !important; }
}

/* SPEC SUBLINES MATCHING TYPOGRAPHY */
.leaf-spec-line {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 16px;
  min-height: 14px;
}
.leaf--cream .leaf-spec-line { color: var(--ink-3, #6E7686); }
.leaf--dark .leaf-spec-line { color: rgba(255, 248, 245, 0.70) !important; }

/* BULLET LIST (Uniform Row Height & Separators) */
.leaf-list {
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
}

.leaf-list li {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 0;
  font-size: 14px;
  line-height: 1.45;
  min-height: 48px;
  box-sizing: border-box;
}

.leaf--cream .leaf-list li {
  border-bottom: 1px dotted var(--rule, #DCD5C6);
  color: var(--ink-2, #4A5464);
}
.leaf--dark .leaf-list li {
  border-bottom: 1px dotted rgba(240, 196, 147, 0.35);
  color: #FFF8F5 !important;
}

.leaf-list li::before {
  content: "§";
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 11px;
  flex: none;
  padding-top: 2px;
}
.leaf--cream .leaf-list li::before { color: var(--blood, #7A1C29); }
.leaf--dark .leaf-list li::before { color: #F0C493 !important; }

/* CTA LINKS */
.leaf-cta {
  margin-top: auto !important;
  align-self: flex-start;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  position: relative;
  padding-bottom: 3px;
  display: inline-block;
  transition: opacity 150ms ease;
}
.leaf--cream .leaf-cta {
  color: var(--blood, #7A1C29);
}
.leaf--dark .leaf-cta {
  color: #F0C493 !important; /* Pale gold accent */
}
.leaf-cta::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: currentColor;
  transform-origin: left;
  transition: transform .35s ease;
}
.leaf-cta:hover::after { transform: scaleX(.4); }

/* ═══════════ SPECIMEN PANEL ═══════════ */
.demo {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.demo-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.demo-center-block {
  text-align: center;
  margin-bottom: 16px;
}

.demo-you {
  font-family: var(--display);
  font-size: clamp(44px, 6vw, 72px);
  font-weight: 800;
  line-height: .88;
  letter-spacing: -.052em;
  text-transform: uppercase;
  color: var(--ink) !important;
  text-align: center;
}

.demo-vs {
  margin: 10px 0;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .52em;
  color: var(--blood);
  text-indent: .52em;
  text-align: center;
}

.demo-amt {
  margin: 18px 0 4px;
  font-family: var(--mono);
  font-size: 32px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--blood) !important;
  letter-spacing: -.02em;
  text-align: center;
}

.demo-sub {
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
}

.demo-ledger {
  margin-top: auto;
  padding: 18px 0 14px;
  border-top: 1px solid var(--rule);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-ledger .t-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  margin: 0;
}

.demo-ledger .t-row dt {
  color: var(--ink-3);
  font-weight: 400;
}

.demo-ledger .t-row .dots {
  flex: 1;
  border-bottom: 1px dotted var(--rule-strong);
}

.demo-ledger .t-row dd {
  margin: 0;
  font-weight: 500;
  color: var(--ink);
}

.demo-ledger .t-row dd.win {
  color: var(--win) !important;
  font-weight: 600;
}

.demo-ledger .t-row dd.blood {
  color: var(--blood) !important;
  font-weight: 600;
}

.demo-foot-bar {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  text-align: center;
  font-size: 10px;
  letter-spacing: .14em;
  color: var(--ink-3);
}

/* Section 02 explicit overrides */
#modes .title {
  margin-bottom: 26px !important;
}

#modes .idx-mark {
  top: calc(var(--section-y) + 12px) !important;
}

/* ═══════════ CASE ═══════════ */
#case {
  position: relative;
  padding-block: var(--section-y);
}

.argue {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 72px;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}

@media(max-width:900px){
  .argue {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

.argue-note {
  margin: 28px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--rule-strong);
  max-width: 46ch;
}

.argue-note p {
  margin: 6px 0 0;
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.85;
  color: var(--ink-2);
}

.cmp-caption, .reg-caption {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 12px;
  display: block;
}

.cmp { width: 100%; border-collapse: collapse; margin-top: 0; }

.cmp th {
  text-align: left;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ink);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.cmp th:first-child { width: 58px; color: var(--ink-4); }

.cmp td {
  padding: 14px 20px;
  border-bottom: 1px dotted var(--rule);
  font-size: 15px;
  color: var(--ink-2);
}

.cmp td:first-child { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; color: var(--ink-4); }

.void {
  color: var(--ink-3);
  text-decoration: line-through;
  text-decoration-color: var(--blood-mid);
  text-decoration-thickness: 1px;
}

.cmp tr:last-child td { border-bottom: 0; font-weight: 600; color: var(--ink); padding-block: 18px; }
.cmp tr:last-child .void { font-weight: 400; color: var(--ink-3); }
.cmp tr:last-child .won-txt {
  font-weight: 700;
  font-size: 16.5px;
  color: var(--win) !important;
  letter-spacing: -.01em;
}

/* ═══════════ ORACLE REGISTER ═══════════ */
.oracles-head {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 48px;
  align-items: end;
  margin-bottom: 24px;
}

@media(max-width:960px){
  .oracles-head {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.marg-note-top {
  border-top: 2px solid var(--ink);
  padding-top: 14px;
  max-width: 44ch;
  justify-self: end;
}

.marg-note-top p {
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.85;
  letter-spacing: .01em;
  text-transform: none;
  color: var(--ink-2);
}

.reg { width: 100%; border-collapse: collapse; margin-top: 0; }

.reg th {
  text-align: left;
  padding: 15px 22px;
  border-bottom: 1px solid var(--ink);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-2);
  white-space: nowrap;
}

.reg td { padding: 18px 22px; border-bottom: 1px dotted var(--rule); font-size: 14.5px; color: var(--ink-2); }
.reg tr:last-child td { border-bottom: 0; }
.reg tbody tr { transition: background .25s var(--ease); }
.reg tbody tr:hover { background: var(--paper-alt); }

.reg-name { display: flex; align-items: center; gap: 14px; }
.reg-mark {
  width: 34px;
  height: 34px;
  flex: none;
  border: 1px solid var(--rule-strong);
  display: grid;
  place-items: center;
  background: var(--paper);
  border-radius: var(--r);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
}

.reg-logo {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: grayscale(1) brightness(0.2);
}

.dot-live {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--win);
  margin-right: 6px;
  vertical-align: middle;
}

#oracles .title {
  margin-bottom: 26px !important;
}

.reg-plat {
  font-family: var(--display);
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -.022em;
  white-space: nowrap;
}

.reg-num {
  font-family: var(--mono);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  letter-spacing: .04em;
}

.reg-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--win);
}

@media(max-width:780px){
  .reg, .reg tbody, .reg tr, .reg td { display: block; width: auto; }
  .reg thead { display: none; }
  .reg tr { border-bottom: 1px solid var(--rule); padding: 10px 0; }
  .reg tr:last-child { border-bottom: 0; }
  .reg td { border-bottom: 0; padding: 7px 18px; display: flex; gap: 14px; align-items: baseline; }
  .reg td::before {
    content: attr(data-label);
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-4);
    flex: none;
    min-width: 88px;
  }
  .reg td:first-child::before { display: none; }
}

/* ═══════════ RECEIPTS ═══════════ */
.receipts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(266px, 1fr));
  gap: 26px;
  margin-top: 48px;
}

.receipt {
  position: relative;
  background: var(--plate);
  border: 1px solid var(--rule);
  border-radius: var(--r);
  box-shadow: var(--lift);
  transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .35s var(--ease);
}

.receipt:hover {
  transform: translateY(-5px);
  border-color: var(--rule-strong);
  box-shadow: 0 2px 4px rgba(14,20,32,.05), 0 30px 56px -30px rgba(14,20,32,.4);
}

.r-top { padding: 20px 22px 22px; }
.r-meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 15px; }

.r-goal {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -.026em;
}

.r-src { margin-top: 6px; font-family: var(--mono); font-size: 10.5px; letter-spacing: .06em; color: var(--ink-4); }

.r-fields { margin-top: 17px; padding-top: 15px; border-top: 1px dotted var(--rule); }

.r-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
}

.r-row dt {
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ink-4);
  white-space: nowrap;
}

.r-row dd {
  font-family: var(--mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.perf {
  position: relative;
  border-top: 2px dashed var(--rule-strong);
  height: 0;
}

.perf::before, .perf::after {
  content: "";
  position: absolute;
  top: -12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--notch);
  box-shadow: inset -1px 1px 2px rgba(14,20,32,.08);
}

.perf::before { left: -12px; }
.perf::after { right: -12px; }

.r-bottom { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 21px 22px; }
.r-bottom.won { background: var(--win-tint); }
.r-bottom.lost { background: var(--blood-tint); }

.r-amt {
  font-family: var(--mono);
  font-size: 24px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -.02em;
}

.won .r-amt { color: var(--win); }
.lost .r-amt { color: var(--blood); }

.r-note {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-4);
}

.r-stamp {
  flex: none;
  transform: rotate(-10deg);
  border: 2px solid currentColor;
  border-radius: 2px;
  padding: 5px 11px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  opacity: .76;
}

.r-stamp.won { color: var(--win); }
.r-stamp.lost { color: var(--blood); }

#record {
  padding-bottom: 52px !important;
}

.footing {
  margin-top: 56px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.f-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px dotted var(--rule);
}

.f-row dt {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-2);
}

.f-row dd {
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--blood);
  letter-spacing: -.02em;
}

.f-total {
  margin-top: 8px;
  padding-top: 17px;
  border-top: 2px solid var(--ink);
  border-bottom: 0;
}

.f-total dt { color: var(--ink); font-weight: 500; }
.f-total dd { font-size: 26px; }

/* ═══════════ COUNTERPARTY ═══════════ */
.cp {
  display: block;
  margin-top: 56px;
}

.cp-portrait { padding: 16px; }
.cp-cap { margin-top: 14px; padding-top: 12px; border-top: 1px dotted var(--rule); text-align: center; }

.cp-quote {
  font-family: var(--display);
  font-size: clamp(22px, 3vw, 33px);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -.03em;
  text-indent: -.44em;
  text-wrap: pretty;
}

.cp-quote em { font-style: normal; color: var(--blood); }

.cp-attrib {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  align-items: baseline;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 2px solid var(--ink);
}

.cp-name { font-family: var(--display); font-size: 16px; font-weight: 700; letter-spacing: -.02em; }

.cp-receipt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-top: 24px;
  padding: 16px 18px;
  border: 1px solid var(--blood);
  border-radius: var(--r);
  background: var(--blood-tint);
}

.cp-receipt .amt {
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--blood);
  letter-spacing: -.02em;
}

.cp-stamp {
  margin-left: auto;
  transform: rotate(-8deg);
  border: 2px solid var(--blood);
  border-radius: 2px;
  padding: 3px 10px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--blood);
  opacity: .76;
}

/* ═══════════ FORFEIT FLOW ═══════════ */
.flow-wrap { margin-top: 48px; overflow: hidden; }

.flow-head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  justify-content: space-between;
  padding: 15px 22px;
  border-bottom: 1px solid var(--rule);
  background: #FBF8F2;
}

.flow-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 1fr) minmax(0, 1fr);
}

@media(max-width:900px){
  .flow-stage { grid-template-columns: 1fr; }
}

.stage-col { padding: 30px 24px; }

.stage-mid {
  position: relative;
  border-inline: 1px dotted var(--rule);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.stage-mid::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 20px;
  right: 20px;
  height: 1px;
  background: var(--blood);
  opacity: .4;
  z-index: 1;
}

.stage-mid::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid var(--blood);
  opacity: .6;
  z-index: 1;
}

@media(max-width:900px){
  .stage-mid {
    border-inline: 0;
    border-block: 1px dotted var(--rule);
    min-height: 120px;
  }
  .stage-mid::before, .stage-mid::after { display: none; }
}

.loser {
  border: 1px solid var(--blood);
  border-radius: var(--r);
  padding: 20px;
  background: var(--blood-tint);
  margin-top: 14px;
}

.loser-amt {
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 30px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--blood);
  line-height: 1;
  letter-spacing: -.024em;
}

.loser-goal { margin-top: 8px; font-size: 14px; color: var(--ink-2); }

.track { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }

.coin {
  position: absolute;
  top: 50%;
  left: -14px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid var(--blood);
  background: var(--blood-tint);
  opacity: 0;
  box-shadow: 0 1px 3px rgba(122,28,41,.3);
}

.coin.go { animation: cl-travel 1.55s cubic-bezier(.5, 0, .5, 1) forwards; }

@keyframes cl-travel {
  0% { opacity: 0; transform: translate(0, -50%) scale(.5); }
  12% { opacity: 1; transform: translate(12%, -50%) scale(1); }
  88% { opacity: 1; }
  100% { opacity: 0; transform: translate(760%, -50%) scale(.5); }
}

@media(max-width:900px){
  .coin.go { animation-name: cl-travel-v; }
}

@keyframes cl-travel-v {
  0% { opacity: 0; transform: translate(0, -50%) scale(.5); }
  12% { opacity: 1; transform: translate(0, -20%) scale(1); }
  88% { opacity: 1; }
  100% { opacity: 0; transform: translate(0, 420%) scale(.5); }
}

.mid-label {
  position: relative;
  z-index: 2;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--blood);
  text-align: center;
  padding: 6px 14px;
  line-height: 1.6;
  background: var(--paper);
  border: 1px solid var(--blood-mid);
  border-radius: var(--r);
  box-shadow: 0 1px 3px rgba(122,28,41,.08);
}

.pool {
  border: 1px solid var(--win);
  border-radius: var(--r);
  padding: 20px;
  background: var(--win-tint);
  margin-top: 14px;
}

.pool-amt {
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 30px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--win);
  line-height: 1;
  letter-spacing: -.024em;
}

.pool-bar { height: 5px; background: #C9DED2; margin-top: 16px; overflow: hidden; }

.pool-bar i {
  display: block;
  height: 100%;
  width: 0;
  background: var(--win);
  transition: width 1.5s cubic-bezier(.28, .82, .3, 1);
}

.winners { margin-top: 20px; padding-top: 16px; border-top: 1px dotted var(--rule); }

.winner {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0;
  font-family: var(--mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: .22;
  transition: opacity .6s var(--ease);
}

.winner.paid { opacity: 1; }
.winner .amt { margin-left: auto; color: var(--win); }

.flow-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  padding: 15px 22px;
  border-top: 1px solid var(--rule);
  background: #FBF8F2;
}

.replay {
  margin-left: auto;
  background: none;
  border: 1px solid var(--rule-strong);
  border-radius: var(--r);
  padding: 9px 16px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-2);
  transition: border-color .3s var(--ease), color .3s var(--ease);
}

.replay:hover { border-color: var(--ink); color: var(--ink); }

.sch {
  margin-top: 36px;
  padding: clamp(18px, 2.8vw, 32px);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.sch-head, .sch-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 26px;
  justify-content: space-between;
}

.sch-head { padding-bottom: 15px; margin-bottom: 24px; border-bottom: 1px solid var(--rule); }
.sch-foot { padding-top: 17px; margin-top: 20px; border-top: 1px solid var(--rule); }

.reg-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--win);
}

@media (max-width: 760px) {
  .oracles-table-wrap, .cmp-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
    width: 100%;
    display: block;
  }

  .reg caption {
    display: block;
    width: 100%;
    text-align: left;
    margin-bottom: 12px;
    font-size: 11px;
    padding: 0 4px;
    line-height: 1.4;
  }

  .reg, .reg tbody, .reg tr, .reg td,
  .cmp, .cmp tbody, .cmp tr, .cmp td {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .reg thead, .cmp thead {
    display: none !important;
  }

  .reg tr, .cmp tr {
    padding: 14px 16px !important;
    border-bottom: 1px solid var(--rule) !important;
  }
  .reg tr:last-child, .cmp tr:last-child {
    border-bottom: none !important;
  }

  .reg td {
    padding: 6px 0 !important;
    border-bottom: none !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    font-size: 13.5px !important;
    gap: 12px !important;
  }

  .reg td::before {
    content: attr(data-label);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-4);
    flex: none;
  }
  .reg td:first-child::before {
    content: "Platform";
  }

  .cmp td {
    padding: 5px 0 !important;
    border-bottom: none !important;
    font-size: 13.5px !important;
  }
  .cmp td:first-child {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: .14em;
    color: var(--blood);
    margin-bottom: 4px;
  }
  .cmp td.void::before {
    content: "WITHOUT STAKES: ";
    font-family: var(--mono);
    font-size: 9.5px;
    color: var(--ink-4);
    letter-spacing: .1em;
    display: block;
    margin-bottom: 2px;
  }
  .cmp td:last-child:not(:first-child)::before {
    content: "UNDER CONTRACT: ";
    font-family: var(--mono);
    font-size: 9.5px;
    color: var(--win);
    letter-spacing: .1em;
    display: block;
    margin-top: 6px;
    margin-bottom: 2px;
  }
}

.legend {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--ink-2);
}

.swatch { width: 24px; height: 0; border-top: 2px solid currentColor; flex: none; }
.swatch.dash { border-top-style: dashed; }

.sch-mobile { display: none; }
@media(max-width:780px){
  .sch svg {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    width: 0 !important;
  }
  .sch-mobile {
    display: block !important;
    position: relative;
    z-index: 2;
  }
  .sch-foot .legend:last-child { margin-left: 0; }
}

.sm-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px dotted var(--rule);
}

.sm-row:last-child { border-bottom: 0; }
.sm-row dt {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ink-4);
  white-space: nowrap;
}

.sm-row dd { font-family: var(--mono); font-size: 14px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sm-row.win dd { color: var(--win); }
.sm-row.blood dd { color: var(--blood); }

/* ═══════════ CALCULATOR ═══════════ */
.calc {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.04fr);
  margin-top: 48px;
  overflow: hidden;
}

@media(max-width:940px){
  .calc { grid-template-columns: 1fr; }
}

.calc-left {
  padding: 32px;
  border-right: 1px solid var(--rule);
  background: #FCFAF5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.calc-left-foot {
  margin-top: 32px;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-4);
}

@media(max-width:940px){
  .calc-left { border-right: 0; border-bottom: 1px solid var(--rule); }
}

.field { margin-top: 24px; }
.field-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.field-val {
  font-family: var(--mono);
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  color: var(--blood);
  font-weight: 500;
  letter-spacing: -.024em;
}

.cl-root input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  background: transparent;
  cursor: pointer;
  margin: 0;
}

.cl-root input[type=range]::-webkit-slider-runnable-track { height: 4px; background: var(--ink-3); border-radius: 2px; opacity: .45; }
.cl-root input[type=range]::-moz-range-track { height: 4px; background: var(--ink-3); border-radius: 2px; opacity: .45; }
.cl-root input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--blood);
  margin-top: -8px;
  border: 2px solid var(--plate);
  box-shadow: 0 2px 8px -2px rgba(122,28,41,.7);
}
.cl-root input[type=range]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--blood);
  border: 2px solid var(--plate);
  box-shadow: 0 2px 8px -2px rgba(122,28,41,.7);
}

.scale { display: flex; justify-content: space-between; margin-top: 9px; }

.seg {
  display: flex;
  border: 1px solid var(--rule-strong);
  border-radius: var(--r);
  overflow: hidden;
}

.seg button {
  flex: 1;
  padding: 14px 8px;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--ink-2);
  border-right: 1px solid var(--rule);
  transition: background .28s var(--ease), color .28s var(--ease);
}

.seg button:last-child { border-right: 0; }
.seg button:hover { background: var(--paper-alt); }
.seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }

.calc-right { padding: 32px; display: flex; flex-direction: column; }

.outcomes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--rule-strong);
  border-radius: var(--r);
  overflow: hidden;
  margin-top: 18px;
}

.outcome { padding: 26px 22px; }
.outcome:first-child { border-right: 1px solid var(--rule-strong); background: var(--win-tint); }
.outcome:last-child { background: var(--blood-tint); }

.outcome-val {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: clamp(26px, 3.4vw, 37px);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -.032em;
}

.outcome:first-child .outcome-val { color: var(--win); }
.outcome:last-child .outcome-val { color: var(--blood); }

.outcome-note {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 9.5px;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--ink-4);
}

.terms { margin-top: 24px; padding-top: 18px; border-top: 2px solid var(--ink); }

.t-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dotted var(--rule);
}

.t-row:last-child { border-bottom: 0; }
.t-row dt {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--ink-4);
  white-space: nowrap;
}

.t-row dd { font-family: var(--mono); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }

.calc-cta { margin-top: auto; padding-top: 24px; }
.calc-cta .btn { width: 100%; }

.tiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(244px, 1fr));
  gap: 22px;
  margin-top: 34px;
}

.tier {
  position: relative;
  background: var(--plate);
  border: 1px solid var(--rule);
  border-radius: var(--r);
  padding: 26px 24px;
  cursor: pointer;
  box-shadow: var(--lift);
  text-align: left;
  font: inherit;
  width: 100%;
  transition: border-color .32s var(--ease), background .32s var(--ease),
    transform .32s var(--ease), box-shadow .32s var(--ease);
}

.tier:hover { transform: translateY(-3px); border-color: var(--rule-strong); }
.tier[data-active="true"] {
  border-color: var(--blood);
  background: var(--blood-wash);
  box-shadow: 0 2px 4px rgba(122,28,41,.06), 0 26px 50px -30px rgba(122,28,41,.5);
}

.tier-tab {
  position: absolute;
  top: -10px;
  left: 24px;
  background: var(--blood);
  color: #FFF8F5;
  padding: 5px 13px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity .32s var(--ease), transform .32s var(--ease);
}

.tier[data-active="true"] .tier-tab { opacity: 1; transform: none; }

.tier-mult {
  margin: 10px 0 6px;
  font-family: var(--display);
  font-size: 48px;
  font-weight: 700;
  line-height: .9;
  letter-spacing: -.055em;
  color: var(--blood);
}

.tier-mult small { font-size: .4em; font-weight: 500; }

.tier-rows { margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--ink); }

/* ═══════════ DUELS ═══════════ */
.duels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(304px, 1fr));
  gap: 22px;
  margin-top: 44px;
}

.duel {
  display: block;
  width: 100%;
  text-align: left;
  cursor: pointer;
  background: var(--plate);
  border: 1px solid var(--rule);
  border-radius: var(--r);
  padding: 20px 22px;
  font: inherit;
  box-shadow: var(--lift);
  transition: transform .32s var(--ease), border-color .32s var(--ease), box-shadow .32s var(--ease);
}

.duel:hover {
  transform: translateY(-4px);
  border-color: var(--ink);
  box-shadow: 0 2px 4px rgba(14,20,32,.05), 0 30px 56px -30px rgba(14,20,32,.42);
}

.duel:hover .duel-cta { color: var(--blood); }
.duel:hover .duel-cta span { transform: translateX(4px); }

.duel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }

.duel-badge {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 20px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.badge-live { background: var(--win-tint); color: var(--win); }
.badge-settle { background: var(--blood-tint); color: var(--blood); }

.duel-vs { display: flex; align-items: flex-end; gap: 14px; margin-bottom: 14px; }
.duel-side { flex: 1; min-width: 0; }
.duel-side.r { text-align: right; }
.duel-handle { font-family: var(--mono); font-size: 12.5px; letter-spacing: .03em; }

.duel-delta {
  margin-top: 5px;
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -.026em;
}

.lead { color: var(--win); }
.trail { color: var(--ink); }

.duel-mid { font-family: var(--mono); font-size: 9px; letter-spacing: .22em; color: var(--ink-4); padding-bottom: 5px; }

.bar { display: flex; height: 4px; overflow: hidden; background: var(--paper-deep); }
.bar .a { background: var(--win); }
.bar .g { width: 2px; background: var(--plate); flex: none; }
.bar .b { flex: 1; background: var(--blood); }

.duel-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dotted var(--rule);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .06em;
}

.duel-cta {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-2);
  transition: color .3s var(--ease);
}

.duel-cta span { transition: transform .3s var(--ease); }

/* ═══════════ REFACTORED SIGNATURE SECTION ═══════════ */

/* ═══════════ BLIND-EMBOSSED DEEP PAPER IMPRESSION ═══════════ */
.blind-emboss-seal {
  position: absolute;
  top: 60%;
  left: 58%;
  transform: translate(-50%, -50%);
  width: 360px;
  max-width: 90%;
  height: auto;
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  filter: none !important;
  mix-blend-mode: multiply;
  display: block;
}

@media (max-width: 767px) {
  .blind-emboss-seal {
    display: none !important;
  }
}

@media (prefers-reduced-transparency: reduce), (forced-colors: active) {
  .blind-emboss-seal {
    display: none !important;
  }
}

.sign {
  position: relative;
  padding: clamp(48px, 6vw, 76px) clamp(24px, 4vw, 56px);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sign-title {
  margin: 0 auto 20px auto !important;
  font-family: var(--display) !important;
  font-size: clamp(32px, 4.5vw, 44px) !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  letter-spacing: -0.03em !important;
  text-align: center !important;
  max-width: 22ch !important;
}

.sign-copy {
  margin: 0 auto 36px auto !important;
  max-width: 460px !important;
  color: var(--ink-2, #4A5464) !important;
  font-size: 16px !important;
  line-height: 1.6 !important;
  text-align: center !important;
  text-wrap: balance !important;
}

.sign .btn-fill,
.sign .btn-flat {
  box-shadow: none !important;
  filter: none !important;
  margin: 0 auto 48px auto !important;
}

.sign-lines {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  text-align: left;
}

.sign-cell {
  position: relative;
  display: flex;
  flex-direction: column;
}

.sign-script-area {
  height: 48px;
  display: flex;
  align-items: flex-end;
  position: relative;
}

.sign-script {
  font-family: var(--wordmark, var(--display, 'Archivo', sans-serif));
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--ink, #0E1420);
  line-height: 1;
  padding-bottom: 4px;
}

.custodian-seal-stamp {
  position: absolute;
  left: 156px; /* 28px clearance after final 'l' of Collateral */
  bottom: -15px; /* Overlaps continuous rule by ~1/3 of seal height */
  width: 48px; /* 1.5x larger: crisp legible C mark and wax texture */
  height: 48px;
  transform: rotate(4deg);
  filter: none !important;
  background: transparent !important;
  object-fit: contain;
  pointer-events: none;
  z-index: 10;
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease;
}

.sign-rule {
  width: 100%;
  height: 1px;
  background: var(--rule, #DCD5C6);
  margin: 0 0 8px 0;
}

.sign-custodian-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}
.sign-sub-label {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3, #6E7686);
}
.sign-date-stamp {
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ink-3, #6E7686);
}

.sign .disclosure {
  width: 100%;
  max-width: 640px;
  margin: 48px auto 0 auto !important;
  text-align: left;
  font-family: var(--mono, 'IBM Plex Mono', monospace);
  font-size: 12px !important;
  line-height: 1.75 !important;
  color: #333F51 !important;
  opacity: 1 !important;
}

.custodian-seal-stamp.seal-pressing {
  opacity: 0;
  transform: scale(1.06) rotate(4deg);
}
.custodian-seal-stamp.seal-pressed {
  opacity: 1;
  transform: scale(1) rotate(4deg);
}

@media (prefers-reduced-motion: reduce) {
  .custodian-seal-stamp, .custodian-seal-stamp.seal-pressing, .custodian-seal-stamp.seal-pressed {
    opacity: 1 !important;
    transform: rotate(4deg) !important;
    transition: none !important;
    animation: none !important;
  }
}
/* ═══════════ MARGINALIA ═══════════ */
.marg { display: flex; gap: 16px; align-items: flex-start; max-width: 660px; margin: 0; }
.marg-mark {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: .18em;
  color: var(--blood);
  white-space: nowrap;
  padding-top: 4px;
  flex: none;
}

.marg p { font-family: var(--mono); font-size: 11.5px; line-height: 1.85; color: var(--ink-2); }
.marg-strip { border-top: 1px solid var(--rule-strong); border-bottom: 1px solid var(--rule-strong); padding-block: 22px; }

/* ═══════════ FIRST PAINT ═══════════ */
@keyframes cl-rise { to { opacity: 1; transform: none; } }
@keyframes cl-draw { to { transform: scaleX(1); } }
@keyframes cl-seat { to { opacity: 1; transform: none; } }
@keyframes cl-strike {
  0% { opacity: 0; transform: rotate(-9deg) scale(2); }
  60% { opacity: 1; }
  100% { opacity: 1; transform: rotate(0) scale(1); }
}

.js-load .rise {
  opacity: 0;
  transform: translateY(16px);
  animation: cl-rise .72s var(--ease) forwards;
  animation-delay: var(--d, 0ms);
}

.js-load .draw {
  transform: scaleX(0);
  transform-origin: left;
  animation: cl-draw .78s var(--ease) forwards;
  animation-delay: var(--d, 0ms);
}

.js-load .seat {
  opacity: 0;
  transform: translateY(24px) scale(.985);
  animation: cl-seat .88s var(--ease) forwards;
  animation-delay: var(--d, 0ms);
}

.strike { animation: cl-strike .52s cubic-bezier(.18,.92,.24,1) forwards; }

/* ═══════════ MOBILE ═══════════ */
@media(max-width:580px){
  .h1 { font-size: clamp(34px, 10.5vw, 50px); }
  .row { padding: 14px 15px; gap: 11px; }
  .row-goal {
    font-size: 13.5px;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .row-amt { font-size: 13.5px; }
  .tape-rows { min-height: 0; }
  .meter-val { font-size: 21px; }
  .stamp { right: 11px; font-size: 10px; padding: 4px 8px; }
  .outcomes { grid-template-columns: 1fr; }
  .outcome:first-child { border-right: 0; border-bottom: 1px solid var(--rule-strong); }
  .calc-left, .calc-right { padding: 22px; }
  .demo { padding: 28px 20px; }
  .cp-quote { text-indent: 0; }
  .sign-lines { gap: 26px; }
  .stage-col { padding: 24px 18px; }
}


/* ═══════════════════════════════════════════════════════════
   Collateral — Dramatic Schematic Tracer & Impact Pulses
   ═══════════════════════════════════════════════════════════ */
.sch .tracer{
  fill:none;
  stroke-linecap:round;
  opacity:0;
  pointer-events:none;
  stroke-dasharray:22 100;
  stroke-dashoffset:22;
  animation-duration:6.5s;
  animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1);
  animation-iteration-count:infinite;
}

/* Leg 1 — Deposit → Escrow : 0–14% */
.sch .t1{
  animation-name:cl-t1;
  stroke-width: 3.5px;
  filter: drop-shadow(0 0 3px rgba(14, 20, 32, 0.35));
}
@keyframes cl-t1{
  0%              { stroke-dashoffset:22;   opacity:0 }
  1%              { opacity:1 }
  13%             { opacity:1 }
  14%             { stroke-dashoffset:-100; opacity:0 }
  14.01%,100%     { stroke-dashoffset:22;   opacity:0 }
}

/* Escrow Vault Arrival Flash : 13–18% */
.sch .vault-box-pulse{
  fill:none;
  stroke:#7A1220;
  opacity:0;
  animation:cl-vault-land 6.5s linear infinite;
}
@keyframes cl-vault-land{
  0%,13%     { opacity:0; stroke-width:1; }
  15%        { opacity:0.85; stroke-width:2.8; }
  18%        { opacity:0; stroke-width:1; }
  18.01%,100%{ opacity:0; stroke-width:1; }
}

/* Leg 2 — Escrow → Oracle : 18–32% */
.sch .t2{
  animation-name:cl-t2;
  stroke-width: 3.5px;
  filter: drop-shadow(0 0 3px rgba(14, 20, 32, 0.35));
}
@keyframes cl-t2{
  0%,18%          { stroke-dashoffset:22;   opacity:0 }
  19%             { opacity:1 }
  31%             { opacity:1 }
  32%             { stroke-dashoffset:-100; opacity:0 }
  32.01%,100%     { stroke-dashoffset:22;   opacity:0 }
}

/* Oracle API Arrival Flash : 31–36% */
.sch .oracle-box-pulse{
  fill:none;
  stroke:#0E1420;
  opacity:0;
  animation:cl-oracle-land 6.5s linear infinite;
}
@keyframes cl-oracle-land{
  0%,31%     { opacity:0; stroke-width:1; }
  33%        { opacity:0.8; stroke-width:2.8; }
  36%        { opacity:0; stroke-width:1; }
  36.01%,100%{ opacity:0; stroke-width:1; }
}

/* Leg 3 — Oracle → Junction : 36–48% */
.sch .t3{
  animation-name:cl-t3;
  stroke-width: 3.5px;
  filter: drop-shadow(0 0 3px rgba(14, 20, 32, 0.35));
}
@keyframes cl-t3{
  0%,36%          { stroke-dashoffset:22;   opacity:0 }
  37%             { opacity:1 }
  47%             { opacity:1 }
  48%             { stroke-dashoffset:-100; opacity:0 }
  48.01%,100%     { stroke-dashoffset:22;   opacity:0 }
}

/* Leg 4 — Junction → Win Box : 48–70% (Bolder Green + Glow) */
.sch .t-win{
  animation-name:cl-twin;
  stroke-dasharray:26 100;
  stroke-dashoffset:26;
  stroke-width: 4.2px;
  filter: drop-shadow(0 0 6px rgba(24, 107, 74, 0.7));
}
@keyframes cl-twin{
  0%,48%          { stroke-dashoffset:26;   opacity:0 }
  49%             { opacity:1 }
  68%             { opacity:1 }
  70%             { stroke-dashoffset:-100; opacity:0 }
  70.01%,100%     { stroke-dashoffset:26;   opacity:0 }
}

/* Win Box Impact Pulse : 70–82% */
.sch .win-box-pulse{
  fill:none;
  stroke:#186B4A;
  opacity:0;
  animation:cl-win-land 6.5s linear infinite;
  filter: drop-shadow(0 0 6px rgba(24, 107, 74, 0.5));
}
@keyframes cl-win-land{
  0%,69%     { opacity:0;  stroke-width:1 }
  72%        { opacity:1;  stroke-width:3.6 }
  78%        { opacity:0.4; stroke-width:2.0 }
  82%,100%   { opacity:0;  stroke-width:1 }
}

/* Leg 5 — Forfeited Recirculation Loop : 72–90% (Crimson Dashed Pulse) */
.sch .t-forfeit{
  animation-name:cl-tforfeit;
  stroke-dasharray:24 100;
  stroke-dashoffset:24;
  stroke-width: 3.4px;
  filter: drop-shadow(0 0 4px rgba(122, 28, 41, 0.6));
}
@keyframes cl-tforfeit{
  0%,72%          { stroke-dashoffset:24;   opacity:0 }
  73%             { opacity:1 }
  89%             { opacity:1 }
  90%             { stroke-dashoffset:-100; opacity:0 }
  90.01%,100%     { stroke-dashoffset:24;   opacity:0 }
}

@media(prefers-reduced-motion:reduce){
  .sch .tracer, .sch .win-box-pulse, .sch .vault-box-pulse, .sch .oracle-box-pulse{ display:none !important; animation:none !important }
}

@media(prefers-reduced-motion:reduce){
  .cl-root * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  .js-load .rise, .js-load .draw, .js-load .seat {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
  .pulse::after { opacity: 0; }
  .stamp { transform: translateY(-50%) rotate(-11deg); opacity: .78; }
  .coin { display: none; }

${revealStyles}



/* ═══════════════════════════════════════════════════════════════════════════
   INSTITUTIONAL MOTION SYSTEM STYLES (PHASE 1)
   ═══════════════════════════════════════════════════════════════════════════ */

/* Rule 6: Numeric stability — tabular nums & fixed alignment */
.meter-val, .row-amt, .demo-amt, .demo-ledger dd, #m-escrow, #m-settled, #m-count, #clock {
    font-variant-numeric: tabular-nums !important;
    display: inline-block;
}

/* Rule 1: LIVE status dot pulses ONCE for 500ms when a settlement resolves */
.pulse { position: relative; }
.pulse::after {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid var(--win, #186B4A);
    opacity: 0;
    transform: scale(.6);
    pointer-events: none;
}
.pulse.pulse-flash::after {
    animation: cl-ring-once 500ms ease-out forwards;
}
@keyframes cl-ring-once {
    0% { transform: scale(.6); opacity: .95; }
    100% { transform: scale(2.2); opacity: 0; }
}

/* Rule 5: NO-JS FALLBACK — default CSS state is 100% VISIBLE (opacity 1, transform none) */
.reveal .r-item, .reveal .r-plate, .reveal tbody tr, .receipt-card {
    opacity: 1;
    transform: none;
}

/* Start states ONLY apply when html has .js-motion-active class */
html.js-motion-active .reveal .r-item {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 350ms cubic-bezier(.22,.85,.26,1) calc(var(--i,0) * 60ms),
                transform 350ms cubic-bezier(.22,.85,.26,1) calc(var(--i,0) * 60ms);
    will-change: opacity, transform;
}
html.js-motion-active .reveal.is-in .r-item {
    opacity: 1;
    transform: translateY(0);
}

html.js-motion-active .reveal .r-plate {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 400ms cubic-bezier(.22,.85,.26,1) calc(var(--i,0) * 60ms),
                transform 400ms cubic-bezier(.22,.85,.26,1) calc(var(--i,0) * 60ms);
    will-change: opacity, transform;
}
html.js-motion-active .reveal.is-in .r-plate {
    opacity: 1;
    transform: translateY(0);
}

/* Rule 2: Decorative rules draw on entry */
html.js-motion-active .reveal .r-rule {
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 500ms cubic-bezier(.65,0,.35,1) calc(var(--i,0) * 60ms);
}
html.js-motion-active .reveal.is-in .r-rule {
    transform: scaleX(1);
}

/* Rule 9: Hover States gated behind @media (hover: hover) */
@media (hover: hover) {
    .card-inner, .r-plate-inner {
        transition: transform 180ms ease-out, box-shadow 180ms ease-out;
    }
    .card-inner:hover, .r-plate-inner:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 24px rgba(14, 20, 32, 0.08);
    }
    .btn {
        transition: transform 120ms ease, background 120ms ease;
    }
    .btn:active {
        transform: translateY(1px);
    }
    .link::after {
        transition: transform 150ms ease;
    }
}

/* Rule 10: Universal Focus-Visible (2px accent outline with offset) */
.cl-root :where(a, button, input, [tabindex]):focus-visible {
    outline: 2px solid var(--blood, #7A1C29) !important;
    outline-offset: -2px !important;
}

/* Table Row Hover & Value Flash */
.table-row-flash {
    animation: cell-flash 400ms ease-out;
}
@keyframes cell-flash {
    0% { background: rgba(24, 107, 74, 0.12); }
    100% { background: transparent; }
}

/* Prefers Reduced Motion override */
@media (prefers-reduced-motion: reduce) {
    .reveal .r-item, .reveal .r-plate, .reveal .r-rule, .pulse::after, .row {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
        animation: none !important;
    }
}



/* ═══════════ CLOSING SIGNATURE SECTION (.cs) ═══════════ */



}








@media (hover: hover) { .cs-cta:hover { background: var(--cs-accent-press); } }
.cs-cta:active { transform: translateY(1px); }
.cs-cta:focus-visible { outline: 2px solid var(--cs-accent); outline-offset: 3px; }













.cs-mark, .cs-label--signed { opacity: 1; }


.cs-mark[data-armed="1"] { opacity: 0; transform: translateY(6px); }
.cs-label--signed[data-armed="1"] { opacity: 0; }

.cs-mark[data-armed="1"][data-pressed="1"] {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 320ms var(--cs-ease), transform 320ms var(--cs-ease);
}
.cs-label--signed[data-armed="1"][data-pressed="1"] {
  opacity: 1;
  transition: opacity 320ms var(--cs-ease) 80ms;
}

@media (prefers-reduced-motion: reduce) {
  .cs-cta, .cs-mark, .cs-label--signed { transition: none !important; }
  .cs-mark, .cs-label--signed { opacity: 1 !important; }
  
}

@media (max-width: 760px) {
  
  
  
  
}


  /* ═══════════ FAQ / SCHEDULE OF COMMON QUESTIONS ═══════════ */
  .faq {
    --bg: #FAF7F1;
    --ink: #1A1A18;
    --body: #55534E;
    --muted: #6B6862;
    --accent: #7A1F2B;
    --rule: #D8D2C6;
    --rule-soft: #E4DFD5;
    --mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    --sans: system-ui, -apple-system, "Segoe UI", sans-serif;
    --ease: cubic-bezier(.16,.84,.44,1);
    background: var(--bg);
    font-family: var(--sans);
    color: var(--ink);
    padding: 118px 24px 126px;
    border-top: 1px solid var(--rule);
    width: 100%;
    box-sizing: border-box;
  }

  .faq-grid {
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 0 88px;
    align-items: start;
  }

  /* ---------- left rail ---------- */
  .faq .rail {
    position: sticky;
    top: 104px;
    text-align: left;
  }
  .faq .eyebrow {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .14em;
    color: var(--accent);
  }
  .faq .eyebrow::before {
    content: "";
    width: 26px;
    height: 4px;
    border-top: 1px solid var(--accent);
    border-bottom: 1px solid var(--accent);
  }
  .faq .rail h2 {
    margin: 20px 0 0;
    font-size: 46px;
    line-height: 1.1;
    letter-spacing: -.022em;
    font-weight: 700;
    color: var(--ink);
  }
  .faq .rail p {
    margin: 22px 0 0;
    max-width: 34ch;
    color: var(--body);
    font-size: 16.5px;
    line-height: 1.62;
  }
  .faq .note {
    margin-top: 38px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
    text-align: left;
  }
  .faq .note b {
    display: block;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .13em;
    color: var(--accent);
    font-weight: 400;
  }
  .faq .note span {
    display: block;
    margin-top: 12px;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 1.85;
    color: var(--body);
  }

  /* ---------- schedule ---------- */
  .faq .sched {
    border-top: 1px solid var(--ink);
    text-align: left;
    display: block !important;
  }
  .faq .group {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: .15em;
    color: var(--muted);
    padding: 26px 0 10px;
    opacity: 1 !important;
    transform: none !important;
  }
  .faq .group:first-of-type {
    padding-top: 20px;
  }

  /* Zero-gap accordion items */
  .faq .item {
    display: block !important;
    border-bottom: 1px solid var(--rule-soft) !important;
    opacity: 1 !important;
    transform: none !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
  }
  .faq .q {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: 62px 1fr 22px !important;
    align-items: start !important;
    gap: 0 16px !important;
    text-align: left !important;
    background: none !important;
    border: 0 !important;
    margin: 0 !important;
    padding: 16px 10px 0 0 !important;
    font: inherit !important;
    cursor: pointer !important;
    color: inherit !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    transition: background-color 150ms var(--ease) !important;
  }
  @media (hover: hover) {
    .faq .q:hover {
      background: rgba(26,26,24,.028) !important;
    }
  }
  .faq .q:focus-visible {
    outline: 2px solid var(--accent) !important;
    outline-offset: -2px !important;
  }
  .faq .clause {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    padding-top: 3px;
  }
  .faq .qt {
    font-size: 16.5px;
    line-height: 1.45;
    font-weight: 500;
    color: var(--ink);
  }
  .faq .sign {
    position: relative;
    width: 11px;
    height: 11px;
    margin: 6px 0 0 auto;
    display: block;
  }
  .faq .sign::before, .faq .sign::after {
    content: "";
    position: absolute;
    background: var(--muted);
  }
  .faq .sign::before {
    left: 0;
    top: 5px;
    width: 11px;
    height: 1px;
  }
  .faq .sign::after {
    left: 5px;
    top: 0;
    width: 1px;
    height: 11px;
    transition: transform 200ms var(--ease);
    transform-origin: center;
  }
  .faq .q[aria-expanded="true"] .sign::after,
  .faq .item.open .sign::after {
    transform: scaleY(0);
  }
  .faq .q[aria-expanded="true"] .qt,
  .faq .item.open .qt {
    color: var(--accent);
  }

  /* Smooth max-height & opacity toggle with zero top gap */
  .faq .a {
    display: block !important;
    max-height: 0 !important;
    overflow: hidden !important;
    opacity: 0 !important;
    transition: max-height 280ms var(--ease), opacity 200ms var(--ease) !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    min-height: 0 !important;
    height: auto !important;
  }
  .faq .item.open .a,
  .faq .q[aria-expanded="true"] + .a,
  .faq .q[aria-expanded="true"] ~ .a {
    max-height: 400px !important;
    opacity: 1 !important;
  }

  .faq .a > div {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
  }

  .faq .a p {
    display: block !important;
    margin: 0 !important;
    padding: 0px 44px 20px 78px !important;
    max-width: 62ch !important;
    color: var(--body) !important;
    font-size: 15.5px !important;
    line-height: 1.72 !important;
    text-align: left !important;
    height: auto !important;
    min-height: 0 !important;
    transform: none !important;
  }

  .faq .tail {
    margin-top: 34px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    text-align: left;
  }
  .faq .tail a {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid currentColor;
    padding-bottom: 2px;
  }

  @media (max-width: 1000px) {
    .faq-grid {
      grid-template-columns: 1fr;
      gap: 56px 0;
    }
    .faq .rail {
      position: static;
    }
    .faq .rail h2 {
      font-size: 38px;
    }
  }
  @media (max-width: 640px) {
    .faq {
      padding: 84px 20px 90px;
    }
    .faq .q {
      grid-template-columns: 50px 1fr 20px !important;
      gap: 0 12px !important;
    }
    .faq .a p {
      padding: 0px 22px 18px 62px !important;
    }
    .faq .rail h2 {
      font-size: 32px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .faq .a, .faq .sign::after, .faq .q {
      transition: none !important;
    }
  }

`;
