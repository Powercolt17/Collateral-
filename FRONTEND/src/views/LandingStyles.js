// Landing CSS — Elite fintech conversion page
export const landingCSS = `
.lp{--bg:#FAFAFA;--p:#FFF;--t1:#111;--t2:#444;--t3:#888;--d:#E5E5E5;--r:#5C1414;--rh:#6B1212;--g:#145c14;min-height:100vh;background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;opacity:0;transform:translateY(10px);transition:opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)}
.lp.v{opacity:1;transform:translateY(0)}
.lp *{box-sizing:border-box}
.lloading-bar{position:fixed;top:0;left:0;height:2px;background:var(--r);z-index:1000;width:0;transition:width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;box-shadow:0 0 8px var(--r)}

/* Entry Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.97) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-scale-in { animation: scaleIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) both; }
.delay-1 { animation-delay: 120ms; }
.delay-2 { animation-delay: 240ms; }
.delay-3 { animation-delay: 360ms; }
.delay-4 { animation-delay: 480ms; }

/* Promo Bar */
@keyframes textShine {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.lpromo-bar{position:fixed;top:0;left:0;right:0;height:32px;background-color:var(--r);display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;z-index:60;box-shadow:0 2px 12px rgba(92,20,20,.4)}
.promo-text{background:linear-gradient(to right, rgba(255,255,255,0.6) 20%, #fff 40%, #fff 60%, rgba(255,255,255,0.6) 80%);background-size:200% auto;color:transparent;-webkit-background-clip:text;background-clip:text;animation:textShine 4s linear infinite;text-shadow: 0 1px 1px rgba(0,0,0,0.1)}

/* Nav */
.ln{position:fixed;top:32px;left:0;right:0;z-index:50;background:rgba(250,250,250,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.04)}
.ln-in{max-width:none;width:100%;padding:0 48px;height:72px;display:flex;justify-content:space-between;align-items:center}
.ln-brand{font-family:'Inter Tight',sans-serif;font-size:16px;font-weight:800;letter-spacing:3.5px;color:var(--t1);text-decoration:none;display:inline-flex;align-items:center;gap:14px}
.ln-logo{width:32px;height:32px;color:var(--r);fill:currentColor;flex-shrink:0}
.ln-cta{background:var(--r) !important;color:#fff !important;font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;padding:12px 24px;border:none;cursor:pointer;transition:all .3s cubic-bezier(.16, 1, 0.3, 1)}
.ln-cta:hover{background:var(--rh) !important;transform:scale(1.02)}
.ln-cta::after{content:'→';opacity:0;transform:translateX(-6px);transition:all .25s cubic-bezier(.16, 1, 0.3, 1);display:inline-block;width:0;margin-left:0}
.ln-cta:hover::after{opacity:1;transform:translateX(0);width:auto;margin-left:8px}
.ch-hamburger { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; cursor: pointer; position: relative; transition: border-color 0.2s, background 0.2s; flex-shrink: 0; margin-left: 16px; }
.ch-hamburger:hover { border-color: #e5e5e5; background: #fafafa; }
.ch-hamburger-lines { width: 18px; height: 14px; display: flex; flex-direction: column; justify-content: space-between; }
.ch-hamburger-lines span { display: block; width: 100%; height: 1.5px; background: #333; transition: transform 0.3s ease, opacity 0.3s ease, width 0.3s ease; transform-origin: center; }
.ch-hamburger-lines span:nth-child(2) { width: 12px; margin-left: auto; }

/* Shared */
.lw{max-width:1080px;margin:0 auto;padding:0 24px;position:relative;z-index:1}
.lhr{height:1px;background:var(--d);width:100%}
.lmono{font-family:'Inter',sans-serif;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--t2)}
.lred-dash{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.lred-dash::before{content:'';width:28px;height:2px;background:var(--r)}
[data-r]{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
[data-r].v{opacity:1;transform:none}

/* ═══ HERO ═══ */
.lhero-section{position:relative;overflow:hidden}
.lhero-section::before{content:'';position:absolute;top:-20%;right:-10%;width:700px;height:700px;background:radial-gradient(circle, rgba(92,20,20,0.04) 0%, rgba(92,20,20,0.02) 30%, transparent 70%);border-radius:50%;pointer-events:none;animation:heroOrb 12s ease-in-out infinite}
.lhero-section::after{content:'';position:absolute;bottom:-30%;left:-5%;width:500px;height:500px;background:radial-gradient(circle, rgba(92,20,20,0.03) 0%, transparent 60%);border-radius:50%;pointer-events:none;animation:heroOrb 15s ease-in-out infinite reverse}
@keyframes heroOrb {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  33% { transform: translate(30px, -20px) scale(1.05); opacity: 0.7; }
  66% { transform: translate(-20px, 15px) scale(0.95); opacity: 0.4; }
}
.lhero-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:48px;align-items:center;padding:160px 0 80px}
.lh1{font-family:'Inter Tight',sans-serif;font-weight:400;font-size:clamp(48px,6vw,72px);line-height:.95;letter-spacing:-1.5px;color:var(--t1);margin:0 0 24px;max-width:600px}
.lh1 em{font-style:normal;color:var(--r);font-weight:600;letter-spacing:-1.5px}
.lh-nobrk{display:inline}
.lh-br{display:none}
@media(min-width:768px){
  .lh-nobrk{white-space:nowrap}
  .lh-br{display:block}
}
.lsub{font-size:20px;color:var(--t2);line-height:1.5;margin:0 0 40px;max-width:680px;letter-spacing:-.2px}
.lctas{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.lbtn{height:56px;padding:0 32px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:all .4s cubic-bezier(.16, 1, 0.3, 1);position:relative;overflow:hidden}
.lbtn-r{background:var(--r) !important;color:#fff !important;box-shadow:0 8px 24px -6px rgba(92,20,20,.4);font-size:14px;font-weight:800;padding:0 40px;height:60px;animation:btnPulse 3s ease-in-out infinite}
.lbtn-r:hover{background:var(--rh) !important;box-shadow:0 16px 40px -8px rgba(92,20,20,.5);transform:translateY(-3px) scale(1.03)}
.lbtn-r::after{content:'→';opacity:0;transform:translateX(-8px);transition:all .3s cubic-bezier(.16, 1, 0.3, 1);display:inline-block;width:0;margin-left:0}
.lbtn-r:hover::after{opacity:1;transform:translateX(0);width:auto;margin-left:10px}
@keyframes btnPulse {
  0%, 100% { box-shadow: 0 8px 24px -6px rgba(92,20,20,.4); }
  50% { box-shadow: 0 8px 32px -4px rgba(92,20,20,.55); }
}
.lbtn-g{background:var(--p);color:var(--t2);border:1px solid var(--d)}
.lbtn-g:hover{border-color:#bbb;color:var(--t1);transform:translateY(-1px)}
.lcta-match{font-size:14px;color:var(--t1);margin-top:16px;font-weight:700;display:flex;align-items:center;gap:8px;letter-spacing:-.1px}
.lcta-match::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--r)}
.ltrust-bar{font-size:11px;color:var(--t2);margin-top:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.ltrust-bar::before{content:'✓';color:var(--g);font-weight:bold;font-size:12px}

/* ═══ PREVIEW CONTRACT CARD ═══ */
@keyframes premiumFloat {
  0%, 100% { 
    transform: translateY(0) rotateX(0deg) rotateY(0deg);
    box-shadow: 0 20px 60px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03);
  }
  50% { 
    transform: translateY(-10px) rotateX(1deg) rotateY(-1deg);
    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03);
  }
}
@keyframes heroGlow {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.05); opacity: 0.5; }
}
@keyframes cardSheen {
  0%, 20% { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
  25% { opacity: 0.4; }
  30%, 100% { transform: translateX(150%) skewX(-20deg); opacity: 0; }
}
.lhero-right{display:flex;justify-content:center;align-items:center;position:relative;perspective:1200px}
.lhero-right::before{content:'';position:absolute;width:450px;height:450px;background:radial-gradient(circle, rgba(92,20,20,0.08) 0%, transparent 65%);z-index:0;animation:heroGlow 8s ease-in-out infinite;border-radius:50%}
.lpreview-card{background:var(--p);border:1px solid rgba(0,0,0,0.06);width:100%;max-width:400px;position:relative;overflow:hidden;border-radius:16px;animation:premiumFloat 8s ease-in-out infinite;transform-style:preserve-3d;will-change:transform,box-shadow;z-index:1;backdrop-filter:blur(20px)}
.lpreview-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--r),#8B2020,var(--r));z-index:10}
.lpreview-card::after{content:'';position:absolute;top:0;left:-50%;width:150%;height:100%;background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);z-index:5;animation:cardSheen 8s ease-in-out infinite;pointer-events:none}

.lpcard-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0}
.lpcard-type{font-family:'Inter Tight',sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.8px;color:var(--t1)}
.lpcard-status{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--g);background:rgba(20,92,20,.06);border:1px solid rgba(20,92,20,.15);padding:3px 8px;border-radius:2px}
.lpcard-status-dot{width:5px;height:5px;border-radius:50%;background:var(--g);animation:statusPulse 2s ease-in-out infinite}
@keyframes statusPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(20,92,20,.4)}50%{opacity:.7;box-shadow:0 0 0 4px rgba(20,92,20,0)}}
.lpcard-divider{height:1px;background:var(--d);margin:12px 20px}
.lpcard-title{font-family:'Inter Tight',sans-serif;font-size:18px;font-weight:700;color:var(--t1);padding:0 20px 14px;letter-spacing:-.3px}

.lpcard-terms{padding:0 20px 16px}
.lpcard-term{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(229,229,229,.5)}
.lpcard-term:last-child{border-bottom:none}
.lpcard-term-k{font-size:12px;color:var(--t3);font-weight:500}
.lpcard-term-v{font-size:13px;font-weight:700;color:var(--t1);font-family:'SF Mono','Fira Code','Consolas',monospace;letter-spacing:-.2px}
.lpcard-term-highlight{color:var(--t1);background:rgba(17,17,17,.04);padding:2px 6px;border-radius:2px;font-weight:800}

.lpcard-outcome{padding:12px 20px 16px;border-top:1px solid var(--d)}
.lpcard-outcome-row{display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:4px;border-radius:2px;font-size:12px;font-weight:600}
.lpcard-outcome-row:last-child{margin-bottom:0}
.lpcard-outcome-hit{background:rgba(20,92,20,.04);border:1px solid rgba(20,92,20,.1)}
.lpcard-outcome-miss{background:rgba(92,20,20,.03);border:1px solid rgba(92,20,20,.08)}
.lpcard-outcome-icon{font-size:13px;font-weight:700;line-height:1}
.lpcard-outcome-hit .lpcard-outcome-icon{color:var(--g)}
.lpcard-outcome-miss .lpcard-outcome-icon{color:var(--r)}
.lpcard-outcome-text{flex:1;color:var(--t2);font-weight:500}
.lpcard-outcome-result{font-family:'SF Mono','Fira Code','Consolas',monospace;font-weight:700;letter-spacing:-.3px}
.lpcard-outcome-hit .lpcard-outcome-result{color:var(--g)}
.lpcard-outcome-miss .lpcard-outcome-result{color:var(--r)}



/* ═══ FLOATING BADGES ═══ */
.lbadge-glass {
    position: absolute;
    background: rgba(92, 20, 20, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 32px rgba(92, 20, 20, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 6px;
    z-index: 20;
    animation: premiumFloat 6s ease-in-out infinite;
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
}
.lbadge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: pulseDot 2s infinite;
}
@keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
}
.lbadge-num {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    font-weight: 700;
    color: #FFF;
    letter-spacing: -0.2px;
}
.lbadge-txt {
    font-family: 'Inter Tight', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #FFF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ═══ LIVE TOAST NOTIFICATIONS ═══ */
#l-toast-container{position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none}
.l-toast{background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.08);padding:14px 20px;border-radius:12px;display:flex;align-items:center;gap:12px;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:12px;font-weight:600;color:var(--t2);pointer-events:auto;will-change:transform,opacity}
.lticker-time{color:var(--t3);font-weight:500;font-size:11px}
.lticker-action{color:var(--t1);font-family:'Inter',sans-serif}
.lticker-amt{font-weight:700}
.lticker-amt.positive{color:var(--g)}
.lticker-amt.negative{color:var(--r)}
.lticker-amt.locked{color:var(--t1)}
.animate-slide-up{animation:toastSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards}
.animate-slide-down{animation:toastSlideDown 0.5s cubic-bezier(0.16,1,0.3,1) forwards}
@keyframes toastSlideUp{0%{opacity:0;transform:translateY(24px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastSlideDown{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(24px) scale(0.95)}}

/* ═══ EXAMPLE CONTRACT ═══ */
.lex{padding:0 0 40px}
.lex-box{background:var(--p);border:1px solid var(--d);padding:28px 32px;max-width:760px;box-shadow:0 12px 36px rgba(0,0,0,.04);position:relative;overflow:hidden}
.lex-box::before{content:'';position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--r)}
.lex .lred-dash{margin-bottom:14px}
.lex-body{font-family:'Inter Tight',sans-serif;font-size:24px;line-height:1.35;letter-spacing:-.5px;color:var(--t1);margin:0 0 16px;max-width:660px}
.lex-small{font-size:13px;color:var(--t2);font-weight:600;letter-spacing:.1px}

/* ═══ LIVE CONTRACTS ═══ */
.lcontracts{padding:40px 0 64px;background:var(--p);border-top:1px solid var(--d)}
.lcontracts .lw{max-width:1280px}
.lcards{display:grid;grid-template-columns:repeat(4,1fr);gap:32px}
.lcard{border:1px solid var(--d);padding:36px 32px;display:flex;flex-direction:column;transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1);background:var(--p);position:relative;overflow:hidden}
.lcard::before{content:'';position:absolute;top:-1px;left:0;right:0;height:2px;background:var(--r);transform:scaleX(0);transform-origin:left;transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)}
.lcard:hover::before{transform:scaleX(1)}
.lcard:hover{border-color:#bbb;box-shadow:0 16px 40px rgba(0,0,0,.08);transform:translateY(-6px)}
.lcard-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.lcard-src{font-family:'Inter',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--t3)}
.lcard-tier{font-family:'Inter',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px}
.tier-pledge{color:var(--g);background:rgba(20,92,20,.06);border:1px solid rgba(20,92,20,.15)}
.tier-stake{color:#B45309;background:rgba(180,83,9,.06);border:1px solid rgba(180,83,9,.15)}
.tier-allin{color:var(--r);background:rgba(92,20,20,.05);border:1px solid rgba(92,20,20,.12)}
.lcard-title{font-family:'Inter Tight',sans-serif;font-size:19px;font-weight:600;color:var(--t1);margin-bottom:6px;letter-spacing:-.3px}
.lcard-target{font-size:13px;color:var(--t2);margin-bottom:24px;line-height:1.4}
.lcard-row{display:flex;justify-content:space-between;font-size:12px;padding:8px 0;border-bottom:1px solid rgba(229,229,229,.5)}
.lcard-row:last-of-type{border:none}
.lcard-row .k{color:var(--t3)}
.lcard-row .v{font-weight:600;color:var(--t1)}
.lcard-btn{margin-top:auto;padding-top:20px}
.lcard-btn button{width:100%;height:44px;background:var(--t1);color:#fff;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border:none;cursor:pointer;transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center}
.lcard-btn button:hover{background:var(--r);transform:scale(1.02)}
.lcard-btn button::after{content:'→';opacity:0;transform:translateX(-6px);transition:all .25s cubic-bezier(.16, 1, 0.3, 1);display:inline-block;width:0;margin-left:0}
.lcard-btn button:hover::after{opacity:1;transform:translateX(0);width:auto;margin-left:6px}

/* ═══ HOW IT WORKS ═══ */
.lhow{padding:100px 0}
.lhow-h{font-family:'Inter Tight',sans-serif;font-size:clamp(32px,5vw,56px);font-weight:400;letter-spacing:-1px;margin-bottom:16px}
.lhow-h strong{font-weight:700;color:var(--r)}
.lhow-sub{font-size:18px;color:var(--t2);margin-bottom:64px;max-width:640px;line-height:1.6}
.lsteps{display:grid;grid-template-columns:repeat(4,1fr);gap:40px;background:transparent;border:none}
.lstep{padding:32px 0 0 0;border:none;border-top:1px solid rgba(0,0,0,0.08);transition:all 0.3s ease}
.lstep:hover{border-top-color:var(--r)}
.lstep-num{font-family:'Inter Tight',sans-serif;font-size: 42px;font-weight:400;color:var(--r) !important;opacity:0.3;line-height:1;margin-bottom:24px;letter-spacing:-2px;transition:opacity 0.3s ease}
.lstep:hover .lstep-num{opacity:0.6}
.lstep-h{font-family:'Inter Tight',sans-serif;font-size:22px;font-weight:600;color:var(--t1);margin-bottom:12px;letter-spacing:-.4px}
.lstep-p{font-size:16px;color:var(--t2);line-height:1.65}

/* Mini CTA Block */
.lmini-cta{text-align:center;background:transparent;border:none;padding:100px 0;margin:0 auto;max-width:800px}
.lmini-cta-h{font-family:'Inter Tight',sans-serif;font-size: 30px;font-weight:600;margin-bottom:16px;letter-spacing:-1px;color:var(--t1)}
.lmini-cta-p{font-size:18px;color:var(--t2);margin-bottom:40px;line-height:1.6}
.lmini-cta-micro{font-size:12px;color:var(--t3);margin-top:20px;font-weight:500;text-transform:uppercase;letter-spacing:2px}

/* ═══ LOGO MARQUEE CAROUSEL ═══ */
.lmarquee{padding:32px 0;background:var(--p);overflow:hidden;position:relative}
.lmarquee-label{text-align:center;margin-bottom:16px}
.lmarquee-track{display:flex;overflow:hidden;width:100%;position:relative}
.lmarquee-track::before,.lmarquee-track::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
.lmarquee-track::before{left:0;background:linear-gradient(to right,var(--p),transparent)}
.lmarquee-track::after{right:0;background:linear-gradient(to left,var(--p),transparent)}
.lmarquee-slide{display:flex;align-items:center;gap:180px;padding:4px 180px 4px 0;animation:marquee 28s linear infinite;flex-shrink:0}
.lmarquee-slide img{opacity:.55;transition:opacity .3s;flex-shrink:0;filter:grayscale(1)}
.lmarquee-slide img:hover{opacity:.9}
.lmarquee-slide img.logo-stripe{height:50px}
.lmarquee-slide img.logo-x{height:34px;margin:0 8px}
.lmarquee-slide img.logo-shopify{height:52px}
.lmarquee-slide img.logo-youtube{height:44px}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}

@media(max-width:767px){
  .lmarquee{padding:20px 0}
  .lmarquee-slide{gap:100px;padding-right:100px;animation-duration:18s}
  .lmarquee-slide img.logo-stripe{height:36px}
  .lmarquee-slide img.logo-x{height:24px;margin:0 6px}
  .lmarquee-slide img.logo-shopify{height:38px}
  .lmarquee-slide img.logo-youtube{height:32px}
}

/* ═══ CONTRACT TYPES ═══ */
.ltypes{padding:100px 0}
.ltypes-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px}
.ltype{background:transparent;border:none;padding:40px 0 0 0;border-top:1px solid rgba(0,0,0,0.08);transition:border-color 0.3s ease}
.ltype:hover{border-top-color:var(--r)}
.ltype-badge{font-family:'Inter',monospace;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:24px;display:inline-block;padding:0;background:transparent!important;border:none!important}
.ltype-h{font-family:'Inter Tight',sans-serif;font-size: 28px;font-weight:600;letter-spacing:-1px;margin-bottom:16px}
.ltype-p{font-size:18px;color:var(--t2);line-height:1.65;margin-bottom:32px}
.ltype-detail{font-size:15px;color:var(--t2);line-height:1.6;padding-top:24px;border-top:1px dashed rgba(0,0,0,0.08)}



/* ═══ FAQ ═══ */
.lfaq{padding:48px 0;text-align:center}
.lfaq-wrap{max-width:640px;margin:0 auto;text-align:left}
.lfaq .lred-dash{justify-content:center}
.fq{border-bottom:1px solid var(--d)}.fq-q{padding:18px 0;font-family:'Inter Tight',sans-serif;font-size:15px;font-weight:600;color:var(--t1);cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;transition:color 0.2s ease}.fq-q:hover{color:var(--r)}.fq-q::after{content:'+';font-size:16px;color:var(--t3);transition:transform 0.3s ease}.fq.open .fq-q::after{content:'\\2212';transform:rotate(180deg)}.fq-a{max-height:0;overflow:hidden;transition:max-height .3s;font-size:13px;color:var(--t2);line-height:1.6}.fq.open .fq-a{max-height:400px;padding-bottom:18px}.fq-a strong{color:var(--t1);font-weight:600}

/* ═══ FINAL CTA ═══ */
.lfoot{background:var(--t1);text-align:center;padding:100px 24px 120px;position:relative;overflow:hidden}
.lfoot::before{content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:800px;height:800px;background:radial-gradient(circle, rgba(92,20,20,0.15) 0%, transparent 60%);pointer-events:none;border-radius:50%;animation:heroOrb 10s ease-in-out infinite}
.lfoot-h{font-family:'Inter Tight',sans-serif;font-size:clamp(24px,4vw,36px);font-weight:400;color:#fff;letter-spacing:-.5px;line-height:1.1;margin-bottom:8px;position:relative;z-index:1}
.lfoot-h em{font-style:normal;color:var(--r);font-weight:500}
.lfoot-sub{font-size:14px;color:rgba(255,255,255,.85);font-weight:600;margin-bottom:24px;position:relative;z-index:1}
.lfoot-btn{display:inline-flex;height:52px;padding:0 36px;align-items:center;justify-content:center;background:var(--r) !important;color:#fff !important;font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;border:none;cursor:pointer;transition:all .3s cubic-bezier(.16, 1, 0.3, 1);position:relative;overflow:hidden;z-index:1}
.lfoot-btn:hover{background:var(--rh) !important;transform:scale(1.04);box-shadow:0 8px 32px rgba(92,20,20,0.5)}
.lfoot-btn::after{content:'→';opacity:0;transform:translateX(-6px);transition:all .25s cubic-bezier(.16, 1, 0.3, 1);display:inline-block;width:0;margin-left:0}
.lfoot-btn:hover::after{opacity:1;transform:translateX(0);width:auto;margin-left:8px}
.lfoot-micro{font-size:12px;color:rgba(255,255,255,.6);margin-top:16px;font-weight:500;letter-spacing:.5px;position:relative;z-index:1}
.lfoot-line{margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);font-size:10px;color:rgba(255,255,255,.15);font-family:'Inter',monospace;text-transform:uppercase;letter-spacing:1.5px;position:relative;z-index:1}

/* ═══ RESPONSIVE ═══ */
@media(max-width:768px){
  .lpromo-bar { height: auto; min-height: 32px; padding: 6px 10px; line-height: 1.3; font-size: 9px; }
  .ln { top: 32px; }
  .lmain { padding-top: 84px; }
  .lhide-mobile{display:none !important}
  .ln-in{padding:0 16px; height: 60px;}
  .ln-cta{padding:6px 10px; font-size:8.5px; letter-spacing:0.5px}
  .lhero-grid{grid-template-columns:1fr;gap:32px;padding:130px 0 24px}
  .lhero-right{display:none}
  .lh1{font-size:clamp(38px, 11vw, 48px);line-height:1.05;letter-spacing:-1px}
  .lsub{font-size:16px;margin-bottom:24px}
  .lbtn{height:48px;padding:0 24px;font-size:11px}
  .lbtn-r{height:52px;font-size:12px;padding:0 28px}
  .lcards{grid-template-columns:1fr 1fr;gap:16px}
  .lcard{padding:20px;min-height:auto}
  .lcard-title{font-size:17px;margin-bottom:4px}
  .lcard-target{font-size:12px;margin-bottom:16px}
  .lcard-row{padding:6px 0;font-size:11px}
  .lcard-btn{padding-top:16px}
  .lcontracts{padding:32px 0 48px}
  .lhow{padding:48px 0}
  .lhow-h{font-size: 22px}
  .lhow-sub{margin-bottom:32px;font-size:14px}
  .lsteps{grid-template-columns:1fr;gap:24px}
  .lstep{padding:24px 0 0 0;border-top:1px solid rgba(0,0,0,0.08)}
  .lstep-num{font-size: 24px;margin-bottom:12px}
  .lstep-h{font-size:16px}
  .lstep-p{font-size:14px}
  .lmini-cta{padding:48px 20px;margin:24px auto}
  .lmini-cta-h{font-size:24px}
  .lmini-cta-p{font-size:14px;margin-bottom:24px}
  .lmini-cta-micro{font-size:11px}
  .ltypes{padding:48px 0}
  .ltypes-grid{grid-template-columns:1fr;gap:32px}
  .ltype{padding:24px 0 0 0}
  .ltype-badge{font-size:11px;margin-bottom:16px}
  .ltype-h{font-size:22px;margin-bottom:8px}
  .ltype-p{font-size:14px;margin-bottom:20px}
  .ltype-detail{font-size:13px;padding-top:16px}
  .lex{padding:0 0 32px}
  .lex-box{margin:0 auto;padding:24px}
  .lex-body{font-size:18px}
  .lfaq{padding:32px 0}
  .fq-q{font-size:14px;padding:14px 0}
  .lfoot{padding:48px 20px 64px}
  .lctas{flex-direction:column}.lbtn{width:100%;justify-content:center}
}
@media(max-width:540px){
  .lcards{grid-template-columns:1fr;gap:16px}
  .lsteps{grid-template-columns:1fr}
  .lstep{border-right:none!important;border-bottom:1px solid var(--d)!important}
  .lstep:last-child{border-bottom:none!important}
}

/* ═══ SLIDE-OUT PANEL ═══ */
.pnl-overlay { position: fixed; inset: 0; background: rgba(10,10,10,0.35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 90; opacity: 0; visibility: hidden; transition: opacity 0.35s ease, visibility 0.35s ease; }
.pnl-overlay.open { opacity: 1; visibility: visible; }
.pnl-drawer { position: fixed; top: 0; right: 0; width: 380px; max-width: 90vw; height: 100%; background: #ffffff; z-index: 100; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: -24px 0 80px rgba(0,0,0,0.08); border-left: 1px solid #f0f0f0; }
.pnl-drawer.open { transform: translateX(0); }
.pnl-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.pnl-header-left { display: flex; align-items: center; gap: 10px; }
.pnl-header-title { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #999; }
.pnl-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; cursor: pointer; color: #999; transition: all 0.15s; }
.pnl-close:hover { border-color: #e5e5e5; background: #fafafa; color: #333; }
.pnl-body { flex: 1; overflow-y: auto; padding: 0; }
.pnl-section-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #ccc; padding: 20px 28px 10px; }
.pnl-nav-link { display: flex; align-items: center; gap: 14px; padding: 14px 28px; font-size: 14px; font-weight: 500; color: #555; text-decoration: none; font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 0.04em; transition: all 0.15s ease; border-left: 3px solid transparent; opacity: 0; transform: translateX(12px); animation: pnlSlideIn 0.35s ease forwards; }
.pnl-nav-link:hover { background: #fafafa; color: #111; border-left-color: #e5e5e5; }
.pnl-nav-indicator { width: 3px; height: 3px; background: #d4d4d4; flex-shrink: 0; transition: all 0.15s; }
.pnl-nav-link:hover .pnl-nav-indicator { background: #888; }
.pnl-connect-section { padding: 20px 28px; flex-shrink: 0; }
.pnl-connect-btn { width: 100%; padding: 14px 24px; font-size: 12px; font-weight: 700; color: #fff; background: #111; border: none; cursor: pointer; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; text-transform: uppercase; transition: background 0.15s; }
.pnl-connect-btn:hover { background: #5C1414; }
.pnl-footer { border-top: 1px solid #f0f0f0; padding: 20px 28px; background: #fafafa; flex-shrink: 0; }
.pnl-status { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.pnl-status-dot { width: 5px; height: 5px; border-radius: 50%; background: #145c14; box-shadow: 0 0 6px rgba(20,92,20,0.4); }
.pnl-status-text { font-size: 10px; font-weight: 500; color: #aaa; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; }
.pnl-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.pnl-meta-item { display: flex; flex-direction: column; gap: 2px; }
.pnl-meta-label { font-size: 8px; font-weight: 700; color: #ccc; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.12em; }
.pnl-meta-value { font-size: 11px; font-weight: 500; color: #777; font-family: 'Sora', 'IBM Plex Sans', sans-serif; }
.pnl-legal { display: flex; gap: 16px; padding-top: 12px; border-top: 1px solid #eee; }
.pnl-legal a { font-size: 10px; color: #ccc; text-decoration: none; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; transition: color 0.12s; }
.pnl-legal a:hover { color: #888; }
@keyframes pnlSlideIn { to { opacity: 1; transform: translateX(0); } }
@media (max-width: 767px) { .pnl-drawer { width: 100%; max-width: 100%; border-left: none; } }
`;
