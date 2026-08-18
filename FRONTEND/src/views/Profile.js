// Profile — Identity Performance Terminal
// 10/10 Market-level institutional UI. All tabs. Receipt-grade.
import { signMessage } from '@wagmi/core';

export function renderProfile() {
    return `
        <style>
            /* ===== PROFILE TERMINAL — INSTITUTIONAL DESIGN ===== */
            .prf{background: #FAF4E6;min-height:calc(100vh - 64px);font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,-apple-system,sans-serif;color:#111;font-variant-numeric:tabular-nums}

            /* Header */
            .prf-header{background: #F5EDDA;border-bottom:1px solid #DCDCDC;padding:32px 32px 0}
            .prf-header-inner{max-width:1120px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:24px}
            .prf-name{font-size:26px;font-weight:700;color:#111111;font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,sans-serif;letter-spacing:-0.5px;margin:0 0 6px;display:flex;align-items:center;gap:10px}
            .prf-hash{font-size:11px;color:#8A8A8A;font-family:var(--font-data);letter-spacing:0.5px;text-transform:uppercase;display:flex;align-items:center;gap:8px}
            .prf-header-actions{display:flex;gap:8px;flex-shrink:0;align-items:center}
            .prf-btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background: #F5EDDA;border:1px solid rgba(70,55,35,.22);cursor:pointer;font-size:11px;font-weight:700;color:#444444;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);transition:all 0.12s}
            .prf-btn-ghost:hover{border-color:#DCDCDC;color:#111111}

            /* Tabs */
            .prf-tabs{display:flex;gap:0;padding:0 32px;border-bottom:1px solid #DCDCDC;background: #F5EDDA;position:sticky;top:56px;z-index:40}
            .prf-tab{padding:14px 18px;font-size:12px;font-weight:600;color:#444444;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,sans-serif;text-transform:uppercase;letter-spacing:0.3px;transition:color 0.12s;white-space:nowrap}
            .prf-tab:hover{color:#111111}
            .prf-tab.active{color:#111111;font-weight:700;border-bottom-color:#5C1414}
            .prf-tab-count{font-size:10px;background:#f3f4f6;color:#444444;padding:1px 6px;border-radius:999px;margin-left:6px;font-family:var(--font-data);font-weight:600}
            .prf-tab.active .prf-tab-count{background:#fef2f2;color:#5C1414}

            /* Metric Cards Row */
            .prf-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:1120px;margin:24px auto 0;padding:0 32px}
            .prf-mc{background: #F5EDDA;border:1px solid #DCDCDC;padding:20px 22px;position:relative;overflow:hidden;transition:all 0.15s}
            .prf-mc::after{content:'';position:absolute;top:14px;bottom:14px;left:0;width:3px;background:#f0f0f0;border-radius:0 2px 2px 0;transition:background 0.15s}
            .prf-mc:hover{border-color:#bbb;box-shadow:0 4px 12px rgba(0,0,0,0.04)}
            .prf-mc:hover::after{background:#5C1414}
            .prf-mc-label{font-size:10px;color:#6B6B6B;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);margin-bottom:10px}
            .prf-mc-value{font-size:26px;font-weight:700;color:#111111;letter-spacing:-0.5px}
            .prf-mc-value.red{color:#5C1414}
            .prf-mc-sub{font-size:10px;color:#8A8A8A;font-family:var(--font-data);margin-top:6px}

            /* Content */
            .prf-content{max-width:1120px;margin:24px auto 0;padding:0 32px 80px}
            .prf-grid{display:grid;grid-template-columns:1fr 340px;gap:18px}

            /* Card */
            .prf-card{background: #F5EDDA;border:1px solid #DCDCDC;overflow:hidden}
            .prf-card+.prf-card{margin-top:18px}
            .prf-card-hd{padding:14px 22px;border-bottom:1px solid rgba(70,55,35,.22);background: #FAF4E6;display:flex;justify-content:space-between;align-items:center}
            .prf-card-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6B6B6B;font-family:var(--font-data);margin:0}
            .prf-card-bd{padding:22px}

            /* Badge — universal */
            .prf-badge{font-size:10px;font-weight:600;height:22px;display:inline-flex;align-items:center;padding:0 8px;border-radius:4px;font-family:var(--font-data);letter-spacing:0.4px;text-transform:uppercase;line-height:1;white-space:nowrap}
            .prf-badge.active,.prf-badge.connected,.prf-badge.settled-success{background:#f0fdf4;color:#15803d}
            .prf-badge.locked,.prf-badge.elevated{background:#fff7ed;color:#9a3412}
            .prf-badge.forfeited,.prf-badge.maximum,.prf-badge.disconnected{background:#fef2f2;color:#5C1414}
            .prf-badge.settled,.prf-badge.controlled{background:#f5f5f5;color:#444444}
            .prf-badge.verifying,.prf-badge.limited{background:#eff6ff;color:#1e40af}
            .prf-badge.pending{background:#fefce8;color:#854d0e}
            .prf-badge.suspended{background:#fef2f2;color:#5C1414;border:1px solid #fecaca}
            .prf-badge.unverified{background:#f5f5f5;color:#9ca3af}

            /* Stat Grid */
            .prf-sg{display:grid;grid-template-columns:1fr 1fr;gap:0}
            .prf-sg-item{padding:16px 22px;border-bottom:1px solid #F0F0F0;border-right:1px solid #F0F0F0}
            .prf-sg-item:nth-child(2n){border-right:none}
            .prf-sg-item:nth-last-child(-n+2){border-bottom:none}
            .prf-sg-label{font-size:10px;color:#8A8A8A;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);margin-bottom:6px}
            .prf-sg-val{font-size:15px;font-weight:700;color:#111111}

            /* Activity Feed */
            .prf-feed-item{display:flex;align-items:center;gap:12px;padding:12px 22px;border-bottom:1px solid #f5f5f5;font-size:13px;transition:background 0.1s}
            .prf-feed-item:last-child{border-bottom:none}
            .prf-feed-item:hover{background: #FAF4E6}
            .prf-feed-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px}
            .prf-feed-icon.exec{background:#fef2f2;color:#752122}
            .prf-feed-icon.verify{background:#eff6ff;color:#1e40af}
            .prf-feed-icon.settle{background:#f0fdf4;color:#166534}
            .prf-feed-icon.forfeit{background:#fef2f2;color:#991b1b}
            .prf-feed-icon.source{background:#f5f5f5;color:#555}
            .prf-feed-text{flex:1;color:#444444;font-weight:500}
            .prf-feed-amt{font-weight:700;font-family:var(--font-data);font-size:12px;color:#111111}
            .prf-feed-time{font-size:10px;color:#8A8A8A;font-family:var(--font-data);white-space:nowrap}

            /* Identity panel */
            .prf-id-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #F0F0F0}
            .prf-id-row:last-child{border-bottom:none}
            .prf-id-label{font-size:10px;color:#8A8A8A;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);font-weight:600}
            .prf-id-val{font-size:13px;color:#111111;font-weight:600;display:flex;align-items:center;gap:6px;text-align:right}

            /* Score bars */
            .prf-score-row{margin-bottom:14px}
            .prf-score-row:last-child{margin-bottom:0}
            .prf-score-hd{display:flex;justify-content:space-between;font-size:10px;color:#8A8A8A;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);margin-bottom:6px}
            .prf-score-bar{height:5px;background:#f0f0f0;overflow:hidden}
            .prf-score-fill{height:100%;transition:width 0.6s ease-out}
            .prf-score-fill.green{background:#15803d}
            .prf-score-fill.red{background:#5C1414}
            .prf-score-fill.blue{background:#1e40af}

            /* Contract mini cards */
            .prf-cx{padding:16px 22px;border-bottom:1px solid rgba(70,55,35,.22);cursor:pointer;transition:all 0.12s;position:relative;overflow:hidden}
            .prf-cx::after{content:'';position:absolute;top:12px;bottom:12px;left:0;width:3px;background:transparent;border-radius:0 2px 2px 0;transition:background 0.12s}
            .prf-cx:hover{background: #FAF4E6}
            .prf-cx:hover::after{background:#5C1414}
            .prf-cx:last-child{border-bottom:none}
            .prf-cx-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
            .prf-cx-id{font-size:10px;color:#8A8A8A;font-family:var(--font-data);letter-spacing:0.5px}
            .prf-cx-title{font-size:14px;font-weight:700;color:#111111;margin-bottom:10px;line-height:1.35}
            .prf-cx-meta{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
            .prf-cx-mi{font-size:11px;color:#6B6B6B;font-family:var(--font-data)}
            .prf-cx-stake{font-size:15px;font-weight:700;color:#111111;letter-spacing:-0.3px;margin-left:auto}
            .prf-cx-progress{height:3px;background:#f0f0f0;margin-top:10px;overflow:hidden}
            .prf-cx-progress-fill{height:100%;background:#5C1414;transition:width 0.4s}
            .prf-cx-actions{display:flex;gap:8px;margin-top:12px}

            /* Provider dot */
            .prf-prov{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#4b5563;font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,sans-serif}
            .prf-prov-dot{width:6px;height:6px;border-radius:50%}
            .prf-prov-dot.stripe{background:#635bff}
            .prf-prov-dot.x{background:#0a0a0a}
            .prf-prov-dot.shopify{background:#96bf48}
            .prf-prov-dot.amazon{background:#ff9900}
            .prf-prov-dot.github{background:#333}

            /* Filter Bar */
            .prf-filters{display:flex;gap:6px;padding:14px 22px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;align-items:center;background: #FAF4E6}
            .prf-filter-label{font-size:10px;color:#9ca3af;text-transform:uppercase;font-family:var(--font-data);margin-right:4px;font-weight:600;letter-spacing:0.5px}
            .prf-pill{padding:5px 12px;font-size:11px;color:#4b5563;background: #F5EDDA;font-weight:500;border:1px solid rgba(70,55,35,.22);border-radius:999px;cursor:pointer;transition:all 0.15s;font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,sans-serif}
            .prf-pill:hover{border-color:#ccc;color:#111}
            .prf-pill.active{background: #F5EDDA;color:#111;border-color:#111;font-weight:600}

            /* CTA */
            .prf-cta{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 20px;height:44px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif,sans-serif;border-radius:0;cursor:pointer;transition:all 150ms ease;background: #F5EDDA;color:#111111;border:1px solid rgba(70,55,35,.22);box-shadow:none}
            .prf-cta:hover{border-color:#5C1414;color:#5C1414;transform:translateY(-1px)}
            .prf-cta:active{background:#5C1414;color:#ffffff;border-color:#5C1414;box-shadow:inset 0 2px 4px rgba(0,0,0,0.2);transform:translateY(0)}
            .prf-cta:focus-visible{outline:2px solid rgba(92,20,20,0.4);outline-offset:2px}
            .prf-cta.sm{height:32px;font-size:11px;padding:0 14px}
            .prf-cta.ghost{background: #F5EDDA;color:#555;border:1px solid rgba(70,55,35,.22);box-shadow:none}
            .prf-cta.ghost:hover{border-color:#bbb;color:#111;background: #FAF4E6;transform:none}
            .prf-cta.full{width:100%}

            /* Provider Cards */
            .prf-provider-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:22px}
            .prf-pcard{border:1px solid #DCDCDC;padding:20px;transition:all 0.12s;position:relative;overflow:hidden}
            .prf-pcard::after{content:'';position:absolute;top:14px;bottom:14px;left:0;width:3px;background:transparent;border-radius:0 2px 2px 0;transition:background 0.12s}
            .prf-pcard:hover{border-color:#bbb;box-shadow:0 4px 12px rgba(0,0,0,0.04)}
            .prf-pcard:hover::after{background:#5C1414}
            .prf-pcard.disconnected{opacity:0.6}
            .prf-pcard-icon{width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-weight:700;font-size:16px;color:#fff}
            .prf-pcard-name{font-size:14px;font-weight:700;color:#111111;margin-bottom:4px}
            .prf-pcard-scope{font-size:10px;color:#8A8A8A;font-family:var(--font-data);margin-bottom:12px}
            .prf-pcard-actions{display:flex;gap:6px;margin-top:14px}

            /* Timeline */
            .prf-tl{position:relative}
            .prf-tl-line{position:absolute;left:7px;top:0;bottom:0;width:1px;background:rgba(70,55,35,.22)}
            .prf-tl-day{font-size:10px;color:#8A8A8A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data);padding:16px 0 8px 28px;position:relative}
            .prf-tl-item{position:relative;padding:12px 0 12px 28px;border-bottom:1px solid #F0F0F0}
            .prf-tl-item:last-child{border-bottom:none}
            .prf-tl-dot{position:absolute;left:3px;top:16px;width:9px;height:9px;border-radius:50%;background:#d4d4d4;border:2px solid #fafafa}
            .prf-tl-dot.red{background:#921818}
            .prf-tl-dot.green{background:#15803d}
            .prf-tl-dot.blue{background:#1e40af}
            .prf-tl-dot.amber{background:#d97706}
            .prf-tl-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
            .prf-tl-desc{font-size:13px;font-weight:500;color:#444444;flex:1}
            .prf-tl-ref{font-size:10px;color:#8A8A8A;font-family:var(--font-data);cursor:pointer}
            .prf-tl-ref:hover{color:#921818}
            .prf-tl-amt{font-size:12px;font-weight:700;font-family:var(--font-data);color:#111111}
            .prf-tl-time{font-size:10px;color:#8A8A8A;font-family:var(--font-data);margin-left:auto;white-space:nowrap}

            /* Settlement row card */
            .prf-sr{border-bottom:1px solid #f0f0f0;transition:background 0.1s}
            .prf-sr:last-child{border-bottom:none}
            .prf-sr-main{display:flex;align-items:center;gap:14px;padding:14px 22px;cursor:pointer}
            .prf-sr-main:hover{background: #FAF4E6}
            .prf-sr-info{flex:1;min-width:0}
            .prf-sr-title{font-size:13px;font-weight:600;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .prf-sr-sub{font-size:10px;color:#8A8A8A;font-family:var(--font-data)}
            .prf-sr-right{text-align:right;flex-shrink:0}
            .prf-sr-amt{font-size:14px;font-weight:700;color:#111111;font-family: var(--font-content)}
            .prf-sr-date{font-size:10px;color:#8A8A8A;font-family:var(--font-data);margin-top:2px}
            .prf-sr-detail{display:none;padding:0 22px 16px;border-top:1px solid #F0F0F0}
            .prf-sr.expanded .prf-sr-detail{display:block}
            .prf-sr-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:14px 0}
            .prf-sr-detail-label{font-size:9px;color:#8A8A8A;text-transform:uppercase;letter-spacing:0.5px;font-family:var(--font-data)}
            .prf-sr-detail-val{font-size:12px;color:#444444;font-weight:600;margin-top:2px}

            /* Skeleton */
            @keyframes prf-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
            .prf-skel{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 37%,#f0f0f0 63%);background-size:800px 100%;animation:prf-shimmer 1.8s infinite;border-radius:4px}
            .prf-skel-line{height:12px;margin-bottom:8px}
            .prf-skel-block{height:64px;margin-bottom:12px;border-radius:6px}
            .prf-skel-card{background: #F5EDDA;border:1px solid rgba(70,55,35,.22);border-radius:8px;padding:22px;margin-bottom:14px}

            /* Empty */
            .prf-empty{padding:48px 20px;text-align:center}
            .prf-empty-icon{width:48px;height:48px;border:2px dashed rgba(70,55,35,.22);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#d4d4d4}
            .prf-empty-title{font-size:14px;font-weight:600;color:#333;margin-bottom:4px}
            .prf-empty-sub{font-size:11px;color:#9ca3af;font-family:var(--font-data);margin-bottom:20px}

            /* Footer micro */
            .prf-footer{max-width:1120px;margin:0 auto;padding:24px 32px;display:flex;align-items:center;gap:8px;font-size:10px;color:#d4d4d4;font-family:var(--font-data);text-transform:uppercase;letter-spacing:0.5px}
            .prf-footer-dot{width:5px;height:5px;background:#22c55e;border-radius:50%}

            /* Profile Avatar */
            .prf-avatar-wrap{position:relative;width:80px;height:80px;flex-shrink:0;cursor:pointer}
            .prf-avatar-wrap:hover .prf-avatar-overlay{opacity:1}
            .prf-avatar{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#111;overflow:hidden;border:2px solid rgba(70,55,35,.22);transition:border-color 0.15s}
            .prf-avatar-wrap:hover .prf-avatar{border-color:#5C1414}
            .prf-avatar-initial{font-family:var(--font-content),'Helvetica Neue',sans-serif;font-size: 22px;font-weight:700;color:#fff}
            .prf-avatar-img{width:100%;height:100%;object-fit:cover;image-rendering:auto}
            .prf-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.15s;border-radius:50%}
            .prf-avatar-overlay svg{color:#fff;opacity:0.9}

            /* Modal */
            .prf-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;display:none;justify-content:center;align-items:center;backdrop-filter:blur(2px)}
            .prf-modal-bg.open{display:flex}
            .prf-modal{background: #F5EDDA;border-radius:12px;width:440px;max-width:90vw;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:85vh;overflow-y:auto}
            .prf-modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
            .prf-modal-title{font-size:12px;font-weight:600;color:#111;font-family:var(--font-data);text-transform:uppercase;letter-spacing:0.5px}
            .prf-modal-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border:none;border-radius:6px;cursor:pointer;color:#666;font-size:16px}
            .prf-modal-close:hover{background:#eee}
            .prf-modal-rule{padding:10px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#333;display:flex;align-items:flex-start;gap:8px}
            .prf-modal-rule:last-child{border-bottom:none}
            .prf-modal-bullet{color:#752122;font-weight:700;flex-shrink:0}

            /* Responsive */
            @media(max-width:900px){
                .prf-metrics{grid-template-columns:repeat(2,1fr)}
                .prf-grid{grid-template-columns:1fr}
                .prf-header-inner{flex-direction:column;gap:16px}
                .prf-tabs{overflow-x:auto;padding:0 16px;-webkit-overflow-scrolling:touch}
                .prf-provider-grid{grid-template-columns:1fr}
                .prf-stat-grid{grid-template-columns:repeat(2,1fr)}
            }
            @media(max-width:500px){
                .prf-metrics{grid-template-columns:1fr 1fr}
                .prf-header{padding:20px 16px 0}
                .prf-content{padding:0 16px 60px}
                .prf-tabs{padding:0 12px}
                .prf-mc-value{font-size:20px}
                .prf-mc{padding:14px 16px}
                .prf-tab{padding:12px 12px;font-size:11px}
                .prf-cx{padding:12px 14px}
                .prf-cx-stake{font-size:14px}
                .prf-stat-grid{grid-template-columns:1fr 1fr}
                .prf-pcard{padding:16px}
                .prf-cta.full{font-size:11px;height:42px}
                .prf-score-row{flex-direction:column;gap:12px}
            }

            .tab-panel.hidden{display:none}
        </style>

        <div class="prf">
            <!-- Header -->
            <div class="prf-header" data-reveal>
                <div class="prf-header-inner">
                    <div style="display:flex;align-items:center;gap:18px">
                        <!-- Avatar Upload -->
                        <div class="prf-avatar-wrap" id="avatar-upload-trigger" title="Change profile picture">
                            <div class="prf-avatar" id="profile-avatar">
                                <span class="prf-avatar-initial" id="profile-avatar-initial">—</span>
                            </div>
                            <div class="prf-avatar-overlay">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            </div>
                            <input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp" style="display:none" />
                        </div>
                        <div>
                            <h1 class="prf-name">
                                <span id="identity-name">—</span>
                                <span class="prf-badge active" id="identity-status-badge">Active</span>
                            </h1>
                            <div class="prf-hash">
                                <span>Identity Record</span>
                                <span style="color:#d4d4d4">·</span>
                                <span id="identity-hash">USR-00000</span>
                            </div>
                        </div>
                    </div>
                    <div class="prf-header-actions">
                        <button class="prf-btn-ghost" id="copy-record-btn">
                            <i data-lucide="link" style="width:13px;height:13px"></i> Copy Record Link
                        </button>
                        <button class="prf-btn-ghost" id="export-csv-btn">
                            <i data-lucide="download" style="width:13px;height:13px"></i> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="prf-tabs">
                <button class="prf-tab active" data-tab="overview">Overview</button>
                <button class="prf-tab" data-tab="contracts">Active Contracts<span class="prf-tab-count" id="tab-active-count">0</span></button>
                <button class="prf-tab" data-tab="history">Settlements</button>
                <button class="prf-tab" data-tab="sources">Verified Sources</button>
                <button class="prf-tab" data-tab="timeline">Ledger Timeline</button>
            </div>

            <!-- KPI Metrics -->
            <div class="prf-metrics" id="metrics-row">
                <div class="prf-mc">
                    <div class="prf-mc-label">Settlement Rate</div>
                    <div class="prf-mc-value" id="kpi-rate">—</div>
                    <div class="prf-mc-sub" id="kpi-rate-sub">Loading...</div>
                </div>
                <div class="prf-mc">
                    <div class="prf-mc-label">Executed Contracts</div>
                    <div class="prf-mc-value" id="kpi-total">—</div>
                    <div class="prf-mc-sub" id="kpi-total-sub">Loading...</div>
                </div>
                <div class="prf-mc">
                    <div class="prf-mc-label">Total Value Settled</div>
                    <div class="prf-mc-value" id="kpi-tvl">—</div>
                    <div class="prf-mc-sub">Cumulative</div>
                </div>
                <div class="prf-mc">
                    <div class="prf-mc-label">Forfeiture Events</div>
                    <div class="prf-mc-value red" id="kpi-forfeit">—</div>
                    <div class="prf-mc-sub" id="kpi-forfeit-sub">Loading...</div>
                </div>
            </div>

            <!-- Tab Content -->
            <div class="prf-content">

                <!-- ============ OVERVIEW TAB ============ -->
                <div id="tab-overview" class="tab-panel" data-reveal>
                    <div class="prf-grid">
                        <div>
                            <!-- Performance Record -->
                            <div class="prf-card">
                                <div class="prf-card-hd"><h3 class="prf-card-title">Performance Record</h3></div>
                                <div class="prf-sg">
                                    <div class="prf-sg-item"><div class="prf-sg-label">First Contract</div><div class="prf-sg-val" id="meta-first">—</div></div>
                                    <div class="prf-sg-item"><div class="prf-sg-label">Last Settlement</div><div class="prf-sg-val" id="meta-last">—</div></div>
                                    <div class="prf-sg-item"><div class="prf-sg-label">Total Value Locked</div><div class="prf-sg-val" id="meta-tvl">—</div></div>
                                    <div class="prf-sg-item"><div class="prf-sg-label">Active Contracts</div><div class="prf-sg-val" id="meta-active">—</div></div>
                                </div>
                            </div>
                            <!-- Recent Activity -->
                            <div class="prf-card">
                                <div class="prf-card-hd">
                                    <h3 class="prf-card-title">Recent Activity</h3>
                                    <span style="font-size:10px;color:#9ca3af;font-family:var(--font-data)" id="activity-count"></span>
                                </div>
                                <div id="activity-feed">
                                    <div class="prf-empty"><div class="prf-empty-sub">Loading activity...</div></div>
                                </div>
                            </div>
                        </div>
                        <!-- Right Sidebar -->
                        <div>
                            <!-- Verified Identity -->
                            <div class="prf-card">
                                <div class="prf-card-hd"><h3 class="prf-card-title">Verified Identity</h3></div>
                                <div class="prf-card-bd" style="padding:12px 22px">
                                    <div class="prf-id-row"><span class="prf-id-label">Account ID</span><span class="prf-id-val" id="id-account">—</span></div>
                                    <div class="prf-id-row"><span class="prf-id-label">Stripe</span><span class="prf-id-val" id="id-stripe">—</span></div>
                                    <div class="prf-id-row"><span class="prf-id-label">Funding</span><span class="prf-id-val">Stripe Connect</span></div>
                                    <div class="prf-id-row"><span class="prf-id-label">Currency</span><span class="prf-id-val">USD</span></div>
                                    <div class="prf-id-row"><span class="prf-id-label">Status</span><span class="prf-id-val" id="id-status"><span class="prf-badge active">Active</span></span></div>
                                    <div class="prf-id-row"><span class="prf-id-label">Created</span><span class="prf-id-val" id="id-created">—</span></div>
                                </div>
                            </div>
                            <!-- Linked Wallets -->
                            <div class="prf-card" style="margin-top:14px;">
                                <div class="prf-card-hd"><h3 class="prf-card-title">Linked Wallets</h3></div>
                                <div class="prf-card-bd" style="padding:16px 22px" id="linked-wallets-panel">
                                    <div class="prf-empty"><div class="prf-empty-sub">Loading wallets...</div></div>
                                </div>
                            </div>
                            <!-- Identity Score -->
                            <div class="prf-card">
                                <div class="prf-card-hd"><h3 class="prf-card-title">Identity Score</h3></div>
                                <div class="prf-card-bd">
                                    <div class="prf-score-row"><div class="prf-score-hd"><span>Win Rate</span><span id="sc-wr-v">—</span></div><div class="prf-score-bar"><div class="prf-score-fill green" id="sc-wr" style="width:0%"></div></div></div>
                                    <div class="prf-score-row"><div class="prf-score-hd"><span>Contract Volume</span><span id="sc-vol-v">—</span></div><div class="prf-score-bar"><div class="prf-score-fill blue" id="sc-vol" style="width:0%"></div></div></div>
                                    <div class="prf-score-row"><div class="prf-score-hd"><span>Capital Deployed</span><span id="sc-cap-v">—</span></div><div class="prf-score-bar"><div class="prf-score-fill red" id="sc-cap" style="width:0%"></div></div></div>
                                </div>
                            </div>
                            <!-- CTA -->
                            <button class="prf-cta full" style="margin-top:18px;height:48px;font-size:13px;background:#5C1414;color:#fff;border-color:#5C1414;font-weight:700;letter-spacing:1px" onclick="window.router.navigate('/market')">Execute Contract →</button>
                        </div>
                    </div>
                    <!-- System status micro footer -->
                    <div class="prf-footer"><div class="prf-footer-dot"></div><span>System Status</span><span style="color:#9ca3af">·</span><span>Operational</span></div>
                </div>

                <!-- ============ ACTIVE CONTRACTS TAB ============ -->
                <div id="tab-contracts" class="tab-panel hidden">
                    <!-- Filter Bar -->
                    <div class="prf-card" style="margin-bottom:18px">
                        <div class="prf-filters" id="contracts-filters">
                            <span class="prf-filter-label">Status</span>
                            <button class="prf-pill active" data-cfilter="all">All</button>
                            <button class="prf-pill" data-cfilter="locked">Locked</button>
                            <button class="prf-pill" data-cfilter="verifying">Verifying</button>
                            <button class="prf-pill" data-cfilter="active">Active</button>
                            <span style="width:1px;height:20px;background:rgba(70,55,35,.22);margin:0 6px"></span>
                            <span class="prf-filter-label">Sort</span>
                            <button class="prf-pill active" data-csort="newest">Newest</button>
                            <button class="prf-pill" data-csort="capital">Capital</button>
                            <button class="prf-pill" data-csort="time">Time Left</button>
                        </div>
                    </div>
                    <div id="active-contracts-list">
                        <div class="prf-skel-card"><div class="prf-skel prf-skel-block"></div><div class="prf-skel prf-skel-line" style="width:60%"></div></div>
                        <div class="prf-skel-card"><div class="prf-skel prf-skel-block"></div><div class="prf-skel prf-skel-line" style="width:40%"></div></div>
                    </div>
                </div>

                <!-- ============ SETTLEMENT HISTORY TAB ============ -->
                <div id="tab-history" class="tab-panel hidden">
                    <!-- Summary strip -->
                    <div class="prf-metrics" id="settlement-metrics" style="max-width:100%;padding:0;margin:0 0 18px">
                        <div class="prf-mc"><div class="prf-mc-label">Total Settled</div><div class="prf-mc-value" id="sh-total">—</div></div>
                        <div class="prf-mc"><div class="prf-mc-label">Wins</div><div class="prf-mc-value" id="sh-wins" style="color:#166534">—</div></div>
                        <div class="prf-mc"><div class="prf-mc-label">Forfeitures</div><div class="prf-mc-value red" id="sh-losses">—</div></div>
                        <div class="prf-mc"><div class="prf-mc-label">Last Settlement</div><div class="prf-mc-value" id="sh-last" style="font-size:16px">—</div></div>
                    </div>
                    <div class="prf-card">
                        <div class="prf-card-hd"><h3 class="prf-card-title">Settlement Records</h3><span style="font-size:10px;color:#9ca3af;font-family:var(--font-data)" id="sh-count"></span></div>
                        <div id="settlement-list">
                            <div class="prf-skel-card" style="border:none;border-radius:0"><div class="prf-skel prf-skel-line" style="width:70%"></div><div class="prf-skel prf-skel-line" style="width:40%"></div></div>
                        </div>
                    </div>
                </div>

                <!-- ============ CONNECTED SOURCES TAB ============ -->
                <div id="tab-sources" class="tab-panel hidden">
                    <div class="prf-card">
                        <div class="prf-card-hd"><h3 class="prf-card-title">Verification Sources</h3></div>
                        <div id="sources-grid" class="prf-provider-grid">
                            <div class="prf-skel-card"><div class="prf-skel prf-skel-block"></div></div>
                            <div class="prf-skel-card"><div class="prf-skel prf-skel-block"></div></div>
                        </div>
                    </div>
                    <p style="font-size:10px;color:#d4d4d4;font-family:var(--font-data);margin-top:12px;text-transform:uppercase;letter-spacing:0.5px">
                        Verification sources are immutably bound to this identity.
                    </p>
                </div>

                <!-- ============ LEDGER TIMELINE TAB ============ -->
                <div id="tab-timeline" class="tab-panel hidden">
                    <!-- Filter bar -->
                    <div class="prf-card" style="margin-bottom:18px">
                        <div class="prf-filters" id="timeline-filters">
                            <span class="prf-filter-label">Event</span>
                            <button class="prf-pill active" data-tfilter="all">All</button>
                            <button class="prf-pill" data-tfilter="execution">Execution</button>
                            <button class="prf-pill" data-tfilter="verification">Verification</button>
                            <button class="prf-pill" data-tfilter="settlement">Settlement</button>
                            <button class="prf-pill" data-tfilter="forfeiture">Forfeiture</button>
                        </div>
                    </div>
                    <div class="prf-card">
                        <div class="prf-card-hd">
                            <h3 class="prf-card-title">Immutable Event Record</h3>
                            <span style="font-size:10px;color:#9ca3af;font-family:var(--font-data);text-transform:uppercase">All Events Are Final</span>
                        </div>
                        <div class="prf-card-bd" style="padding:0 22px 22px">
                            <div id="timeline-list" class="prf-tl">
                                <div class="prf-tl-line"></div>
                                <div class="prf-skel prf-skel-line" style="margin:16px 0 0 28px;width:60%"></div>
                                <div class="prf-skel prf-skel-line" style="margin:8px 0 0 28px;width:40%"></div>
                                <div class="prf-skel prf-skel-line" style="margin:8px 0 0 28px;width:50%"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Verification Rules Modal -->
        <div class="prf-modal-bg" id="rules-modal" onclick="if(event.target===this)this.classList.remove('open')">
            <div class="prf-modal">
                <div class="prf-modal-hd">
                    <span class="prf-modal-title">Verification Rules</span>
                    <button class="prf-modal-close" onclick="document.getElementById('rules-modal').classList.remove('open')">✕</button>
                </div>
                <div id="rules-modal-content">
                    <div class="prf-modal-rule"><span class="prf-modal-bullet">→</span> Revenue and follower counts are verified against platform APIs at settlement time.</div>
                    <div class="prf-modal-rule"><span class="prf-modal-bullet">→</span> Only organic growth counts. Purchased followers, bot traffic, and refunded transactions are excluded.</div>
                    <div class="prf-modal-rule"><span class="prf-modal-bullet">→</span> Verification is fail-closed: if the platform API is unavailable, verification fails.</div>
                    <div class="prf-modal-rule"><span class="prf-modal-bullet">→</span> Source disconnection during an active contract voids the contract and triggers forfeiture.</div>
                    <div class="prf-modal-rule"><span class="prf-modal-bullet">→</span> All verification decisions are final and cannot be appealed.</div>
                </div>
            </div>
        </div>
    `;
}

export async function initProfile() {
    if (window.lucide) window.lucide.createIcons();

    // ── Helpers ──
    const $ = id => document.getElementById(id);
    const fmtUSD = c => '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
    const fmtDateShort = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    const fmtTime = d => { if (!d) return ''; return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };
    const fmtBigUSD = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(0) + 'K' : '$' + v.toLocaleString();
    const dayKey = d => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeAgo = d => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };

    const statusClass = s => {
        if (['FORFEITED', 'SETTLED_FAILURE'].includes(s)) return 'forfeited';
        if (['SETTLED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(s)) return 'settled';
        if (['VERIFYING', 'VERIFIED'].includes(s)) return 'verifying';
        if (['FUNDS_LOCKED', 'LOCKED'].includes(s)) return 'locked';
        if (['ACTIVE', 'EXECUTION_CONFIRMED'].includes(s)) return 'active';
        return 'pending';
    };
    const statusLabel = s => {
        const m = { CREATED: 'Pending', FUNDS_AUTHORIZED: 'Authorized', FUNDS_LOCKED: 'Locked', LOCKED: 'Locked', ACTIVE: 'Active', EXECUTION_CONFIRMED: 'Confirmed', VERIFIED: 'Verified', VERIFYING: 'Verifying', SETTLED: 'Settled', SETTLED_SUCCESS: 'Settled', SETTLED_FAILURE: 'Failed', FORFEITED: 'Forfeited', PAYOUT_COMPLETE: 'Settled', COMPLETED: 'Completed' };
        return m[s] || s;
    };
    const provClass = p => { if (!p) return ''; const l = p.toLowerCase(); if (l.includes('stripe')) return 'stripe'; if (l.includes('x') || l.includes('twitter')) return 'x'; if (l.includes('shopify')) return 'shopify'; if (l.includes('amazon')) return 'amazon'; if (l.includes('github')) return 'github'; return ''; };
    const daysLeft = d => { if (!d) return ''; const diff = Math.ceil((new Date(d) - Date.now()) / 86400000); return diff > 0 ? diff + 'd left' : 'expired'; };
    const progressPct = (created, deadline) => { if (!created || !deadline) return 0; const total = new Date(deadline) - new Date(created); const elapsed = Date.now() - new Date(created); return Math.min(Math.max((elapsed / total) * 100, 0), 100); };
    const windowDays = (created, deadline) => { if (!created || !deadline) return null; return Math.round((new Date(deadline) - new Date(created)) / 86400000); };
    const describeContract = c => {
        if (c.description) return c.description;
        if (c.title) return c.title;
        const pNames = { X: 'X', STRIPE: 'Stripe Revenue', GITHUB: 'GitHub', SHOPIFY: 'Shopify Sales', AMAZON: 'Amazon Sales', YOUTUBE: 'YouTube' };
        const mNames = { FOLLOWERS: 'Follower Growth', REVENUE: 'Revenue Target', MRR: 'MRR Growth', SUBSCRIBERS: 'Subscriber Growth', VIEWS: 'View Count', COMMITS: 'Commit Count', PRS_MERGED: 'PRs Merged', STARS_GAINED: 'Stars Gained', GROSS_SALES: 'Gross Sales', ORDER_COUNT: 'Order Volume', CHARGE_VOLUME: 'Charge Volume', IMPRESSIONS: 'Impressions', ENGAGEMENT_RATE: 'Engagement Rate' };
        const p = pNames[c.platform] || c.platform || 'Performance';
        const m = mNames[c.metricType] || c.metricType || 'Contract';
        return `${p} — ${m}`;
    };

    // ── Tab switching ──
    document.querySelectorAll('.prf-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.prf-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            const target = $('tab-' + tab.getAttribute('data-tab'));
            if (target) target.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        });
    });

    // ── Copy record link ──
    const copyBtn = $('copy-record-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            copyBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px"></i> Copied!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => { copyBtn.innerHTML = '<i data-lucide="link" style="width:13px;height:13px"></i> Copy Record Link'; if (window.lucide) window.lucide.createIcons(); }, 2000);
        });
    });

    // ── Export CSV ──
    const exportBtn = $('export-csv-btn');
    if (exportBtn) exportBtn.addEventListener('click', () => {
        try {
            const rows = [['Contract ID', 'Platform', 'Metric', 'Stake (USD)', 'State', 'Risk Tier', 'Created', 'Deadline']];
            contracts.forEach(c => {
                const st = c.derivedState || c.state;
                rows.push([
                    c.id,
                    c.platform || '',
                    c.metricType || '',
                    (c.lockAmountUsdCents / 100).toFixed(2),
                    st,
                    c.riskTier || '',
                    c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
                    c.deadlineUtc ? new Date(c.deadlineUtc).toISOString().split('T')[0] : ''
                ]);
            });
            const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collateral-contracts-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            exportBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px"></i> Downloaded!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => { exportBtn.innerHTML = '<i data-lucide="download" style="width:13px;height:13px"></i> Export CSV'; if (window.lucide) window.lucide.createIcons(); }, 2000);
        } catch (e) { console.error('[CSV]', e); window.CollateralModal.showAlert('Export failed: ' + e.message, { type: 'error' }); }
    });

    // ── Fetch data ──
    try {
        const [profile, contractsRes] = await Promise.all([
            window.api.getProfile(),
            window.api.getContracts()
        ]);
        if (profile.error) { console.error('[Profile] Failed:', profile.error); return; }

        const contracts = contractsRes?.contracts || [];
        const active = contracts.filter(c => !c.isTerminal);
        const settled = contracts.filter(c => c.isTerminal);
        const wins = settled.filter(c => ['SETTLED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(c.derivedState || c.state));
        const forfeits = settled.filter(c => ['FORFEITED', 'SETTLED_FAILURE'].includes(c.derivedState || c.state));

        // ── HEADER ──
        const nameEl = $('identity-name');
        if (nameEl) nameEl.textContent = profile.identity?.displayName || profile.identity?.username || 'unclaimed';
        const hashEl = $('identity-hash');
        if (hashEl && profile.user?.id) hashEl.textContent = 'USR-' + profile.user.id.substring(0, 8).toUpperCase();

        // ── AVATAR ──
        const avatarEl = $('profile-avatar');
        const avatarInitial = $('profile-avatar-initial');
        if (avatarEl) {
            const name = profile.identity?.displayName || profile.identity?.username || '?';
            if (profile.identity?.photoUrl) {
                avatarEl.innerHTML = `<img class="prf-avatar-img" src="${profile.identity.photoUrl}" alt="" />`;
            } else if (avatarInitial) {
                avatarInitial.textContent = name.charAt(0).toUpperCase();
            }
        }

        // Avatar upload handler
        const avatarTrigger = $('avatar-upload-trigger');
        const avatarInput = $('avatar-file-input');
        if (avatarTrigger && avatarInput) {
            avatarTrigger.addEventListener('click', (e) => {
                if (e.target.closest('input')) return;
                avatarInput.click();
            });
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                    // Show uploading state
                    const avatarDiv = $('profile-avatar');
                    if (avatarDiv) avatarDiv.style.opacity = '0.5';

                    const result = await window.api.uploadAvatar(file);
                    console.log('[Profile] Avatar uploaded:', result);

                    // Update avatar display immediately
                    if (avatarDiv && result.identity?.photoUrl) {
                        avatarDiv.innerHTML = `<img class="prf-avatar-img" src="${result.identity.photoUrl}" alt="" />`;
                        avatarDiv.style.opacity = '1';
                    }

                    // Update appState and re-hydrate panel
                    window.appState.photoUrl = result.identity?.photoUrl;
                    if (window.app?.updateMobileAuthUI) window.app.updateMobileAuthUI();

                    // Store in localStorage
                    const stored = window.api.getStoredUser() || {};
                    stored.photoUrl = result.identity?.photoUrl;
                    window.api.setStoredUser(stored);
                } catch (err) {
                    console.error('[Profile] Avatar upload failed:', err);
                    const avatarDiv = $('profile-avatar');
                    if (avatarDiv) avatarDiv.style.opacity = '1';
                    alert(err.message || 'Failed to upload image');
                }
                avatarInput.value = ''; // Reset for re-upload
            });
        }

        // ── KPI METRICS ──
        const rate = settled.length > 0 ? ((wins.length / settled.length) * 100).toFixed(1) : '—';
        const rateEl = $('kpi-rate');
        if (rateEl) rateEl.textContent = rate === '—' ? '—' : rate + '%';
        const rateSubEl = $('kpi-rate-sub');
        if (rateSubEl) rateSubEl.textContent = wins.length + ' of ' + contracts.length + ' settled successfully';

        const totalEl = $('kpi-total');
        if (totalEl) totalEl.textContent = contracts.length.toString();
        const totalSubEl = $('kpi-total-sub');
        if (totalSubEl && contracts.length > 0) {
            const earliest = contracts.reduce((m, c) => c.createdAt < m ? c.createdAt : m, contracts[0].createdAt);
            totalSubEl.textContent = 'Since ' + fmtDate(earliest);
        }

        const tvlEl = $('kpi-tvl');
        if (tvlEl) tvlEl.textContent = fmtBigUSD(profile.stats?.tvlSettledUsd || 0);

        const forfEl = $('kpi-forfeit');
        if (forfEl) {
            const forfVal = profile.stats?.forfeitedValueUsd != null ? profile.stats.forfeitedValueUsd : (forfeits.reduce((s, c) => s + (c.lockAmountUsdCents || 0), 0) / 100);
            forfEl.textContent = fmtBigUSD(forfVal);
        }
        const forfSubEl = $('kpi-forfeit-sub');
        if (forfSubEl) forfSubEl.textContent = forfeits.length + ' forfeiture event' + (forfeits.length !== 1 ? 's' : '');

        // ── Tab count ──
        const tabCount = $('tab-active-count');
        if (tabCount) tabCount.textContent = active.length.toString();

        // ━━━ OVERVIEW TAB ━━━
        // Performance Record
        if (contracts.length > 0) {
            const earliest = contracts.reduce((m, c) => c.createdAt < m ? c.createdAt : m, contracts[0].createdAt);
            const metaFirst = $('meta-first'); if (metaFirst) metaFirst.textContent = fmtDate(earliest);
        }
        const metaLast = $('meta-last'); if (metaLast) metaLast.textContent = settled.length > 0 ? fmtDate(settled[0].createdAt) : '—';
        const metaTvl = $('meta-tvl'); if (metaTvl) metaTvl.textContent = fmtUSD(contracts.reduce((s, c) => s + (c.lockAmountUsdCents || 0), 0));
        const metaActive = $('meta-active'); if (metaActive) metaActive.textContent = active.length + ' Outstanding';

        // Activity Feed
        const feedEl = $('activity-feed');
        const feedCountEl = $('activity-count');
        if (feedEl) {
            const events = [];
            contracts.slice(0, 8).forEach(c => {
                const st = c.derivedState || c.state;
                let type = 'exec', icon = '⚡', label = 'Contract Executed';
                if (['VERIFYING', 'VERIFIED'].includes(st)) { type = 'verify'; icon = '🔍'; label = 'Verification Check'; }
                else if (['SETTLED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(st)) { type = 'settle'; icon = '✓'; label = 'Settlement Posted'; }
                else if (['FORFEITED', 'SETTLED_FAILURE'].includes(st)) { type = 'forfeit'; icon = '✕'; label = 'Capital Forfeited'; }
                events.push({ type, icon, label, amount: c.lockAmountUsdCents, date: c.createdAt, id: c.id });
            });

            if (events.length === 0) {
                feedEl.innerHTML = '<div class="prf-empty"><div class="prf-empty-icon"><i data-lucide="activity" style="width:20px;height:20px"></i></div><div class="prf-empty-title">No activity yet</div><div class="prf-empty-sub">Execute a contract to start building your record.</div></div>';
            } else {
                feedEl.innerHTML = events.map(e => `
                    <div class="prf-feed-item" onclick="window.router.navigate('/contracts/${e.id}')">
                        <div class="prf-feed-icon ${e.type}">${e.icon}</div>
                        <span class="prf-feed-text">${e.label}</span>
                        <span class="prf-feed-amt">${fmtUSD(e.amount)}</span>
                        <span class="prf-feed-time">${timeAgo(e.date)}</span>
                    </div>`).join('');
            }
            if (feedCountEl) feedCountEl.textContent = events.length + ' events';
        }

        // Identity Panel
        const accId = $('id-account');
        if (accId && profile.user?.id) {
            const shortId = 'USR-' + profile.user.id.substring(0, 8).toUpperCase();
            accId.innerHTML = shortId + ' <i data-lucide="copy" style="width:11px;height:11px;color:#d4d4d4;cursor:pointer" id="copy-account-id"></i>';
            setTimeout(() => {
                const copyIcon = document.getElementById('copy-account-id');
                if (copyIcon) copyIcon.addEventListener('click', () => {
                    navigator.clipboard.writeText(shortId);
                    copyIcon.style.color = '#5C1414';
                    setTimeout(() => { copyIcon.style.color = '#d4d4d4'; }, 1200);
                });
            }, 50);
        }
        const stripeId = $('id-stripe');
        if (stripeId) stripeId.innerHTML = profile.stripeConnection?.connected ? '<span class="prf-badge connected">Connected</span>' : '<span class="prf-badge disconnected">Not connected</span>';
        const createdId = $('id-created');
        if (createdId) createdId.textContent = fmtDate(profile.user?.createdAt);

        // Identity Score
        const wr = settled.length > 0 ? (wins.length / settled.length * 100) : 0;
        const volScore = Math.min(contracts.length / 20 * 100, 100);
        const totalCents = contracts.reduce((s, c) => s + (c.lockAmountUsdCents || 0), 0);
        const capScore = Math.min(totalCents / 5000000 * 100, 100);
        const setBar = (id, vid, pct, lbl) => {
            const bar = $(id); const val = $(vid);
            if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 100);
            if (val) val.textContent = lbl;
        };
        setBar('sc-wr', 'sc-wr-v', wr, wr.toFixed(0) + '%');
        setBar('sc-vol', 'sc-vol-v', volScore, contracts.length + ' contracts');
        setBar('sc-cap', 'sc-cap-v', capScore, fmtUSD(totalCents));

        // ━━━ ACTIVE CONTRACTS TAB ━━━
        const renderActive = (filterState = 'all', sortBy = 'newest') => {
            const list = $('active-contracts-list');
            if (!list) return;

            let filtered = [...active];
            if (filterState !== 'all') {
                filtered = filtered.filter(c => statusClass(c.derivedState || c.state) === filterState);
            }
            if (sortBy === 'capital') filtered.sort((a, b) => (b.lockAmountUsdCents || 0) - (a.lockAmountUsdCents || 0));
            else if (sortBy === 'time') filtered.sort((a, b) => new Date(a.deadlineUtc || 0) - new Date(b.deadlineUtc || 0));
            else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (filtered.length === 0) {
                list.innerHTML = '<div class="prf-card"><div class="prf-empty"><div class="prf-empty-icon"><i data-lucide="file-text" style="width:20px;height:20px"></i></div><div class="prf-empty-title">No active contracts</div><div class="prf-empty-sub">' + (active.length === 0 ? 'Execute a contract to see it here.' : 'No contracts match this filter.') + '</div><button class="prf-cta" onclick="window.router.navigate(\'/market\')">Browse Market Contracts →</button></div></div>';
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            list.innerHTML = '<div class="prf-card">' + filtered.map(c => {
                const st = c.derivedState || c.state;
                const cls = statusClass(st);
                const lbl = statusLabel(st);
                const pc = provClass(c.platform);
                const pct = progressPct(c.createdAt, c.deadlineUtc);
                const dl = daysLeft(c.deadlineUtc);
                const wd = windowDays(c.createdAt, c.deadlineUtc);
                return `<div class="prf-cx" onclick="window.router.navigate('/contracts/${c.id}')">
                    <div class="prf-cx-top">
                        <span class="prf-cx-id">CTR-${c.id.substring(0, 5).toUpperCase()}</span>
                        <span class="prf-badge ${cls}">${lbl}</span>
                    </div>
                    <div class="prf-cx-title">${describeContract(c)}</div>
                    <div class="prf-cx-meta">
                        ${pc ? '<span class="prf-prov"><span class="prf-prov-dot ' + pc + '"></span>' + c.platform + '</span>' : ''}
                        ${wd ? '<span class="prf-cx-mi">' + wd + 'd window</span>' : ''}
                        ${dl ? '<span class="prf-cx-mi">' + dl + '</span>' : ''}
                        <span class="prf-cx-stake">${fmtUSD(c.lockAmountUsdCents)}</span>
                    </div>
                    ${c.deadlineUtc ? '<div class="prf-cx-progress"><div class="prf-cx-progress-fill" style="width:' + pct.toFixed(0) + '%"></div></div>' : ''}
                    <div class="prf-cx-actions">
                        <button class="prf-cta sm" onclick="event.stopPropagation();window.router.navigate('/contracts/${c.id}')">View Contract</button>
                    </div>
                </div>`;
            }).join('') + '</div>';

        if (window.lucide) window.lucide.createIcons();
    };
    renderActive();

    // Filter bar events — contracts
    let cFilter = 'all', cSort = 'newest';
    document.querySelectorAll('[data-cfilter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-cfilter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cFilter = btn.getAttribute('data-cfilter');
            renderActive(cFilter, cSort);
        });
    });
    document.querySelectorAll('[data-csort]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-csort]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cSort = btn.getAttribute('data-csort');
            renderActive(cFilter, cSort);
        });
    });

        // ━━━ SETTLEMENT HISTORY TAB ━━━
        const shTotal = $('sh-total'); if (shTotal) shTotal.textContent = fmtBigUSD((profile.stats?.tvlSettledUsd || 0));
        const shWins = $('sh-wins'); if (shWins) shWins.textContent = wins.length.toString();
        const shLosses = $('sh-losses'); if (shLosses) shLosses.textContent = forfeits.length.toString();
        const shLast = $('sh-last'); if (shLast) shLast.textContent = settled.length > 0 ? fmtDate(settled[0].createdAt) : '—';
        const shCount = $('sh-count'); if (shCount) shCount.textContent = settled.length + ' records';

        const settleList = $('settlement-list');
        if (settleList) {
            if (settled.length === 0) {
                settleList.innerHTML = '<div class="prf-empty"><div class="prf-empty-icon"><i data-lucide="archive" style="width:20px;height:20px"></i></div><div class="prf-empty-title">No settlements yet</div><div class="prf-empty-sub">Completed contracts will appear here.</div></div>';
            } else {
                settleList.innerHTML = settled.map(c => {
                    const st = c.derivedState || c.state;
                    const cls = statusClass(st);
                    const lbl = statusLabel(st);
                    const wd = windowDays(c.createdAt, c.deadlineUtc);
                    return `<div class="prf-sr" id="sr-${c.id}">
                        <div class="prf-sr-main" onclick="document.getElementById('sr-${c.id}').classList.toggle('expanded')">
                            <div>
                                <span class="prf-badge ${cls}" style="margin-right:8px">${lbl}</span>
                            </div>
                            <div class="prf-sr-info">
                                <div class="prf-sr-title">${describeContract(c)}</div>
                                <div class="prf-sr-sub">${c.platform || ''} · CTR-${c.id.substring(0, 5).toUpperCase()}</div>
                            </div>
                            <div class="prf-sr-right">
                                <div class="prf-sr-amt">${fmtUSD(c.lockAmountUsdCents)}</div>
                                <div class="prf-sr-date">${fmtDateShort(c.deadlineUtc || c.createdAt)}</div>
                            </div>
                        </div>
                        <div class="prf-sr-detail">
                            <div class="prf-sr-detail-grid">
                                <div><div class="prf-sr-detail-label">Stake</div><div class="prf-sr-detail-val">${fmtUSD(c.lockAmountUsdCents)}</div></div>
                                <div><div class="prf-sr-detail-label">Window</div><div class="prf-sr-detail-val">${wd || '—'}d</div></div>
                                <div><div class="prf-sr-detail-label">Source</div><div class="prf-sr-detail-val">${c.platform || '—'}</div></div>
                                <div><div class="prf-sr-detail-label">Metric</div><div class="prf-sr-detail-val">${c.metricType || '—'}</div></div>
                                <div><div class="prf-sr-detail-label">Contract ID</div><div class="prf-sr-detail-val" style="font-family:var(--font-data);font-size:10px">${c.id}</div></div>
                                <div><div class="prf-sr-detail-label">State</div><div class="prf-sr-detail-val"><span class="prf-badge ${cls}">${st}</span></div></div>
                            </div>
                            <button class="prf-cta ghost sm" onclick="event.stopPropagation();navigator.clipboard.writeText(window.location.origin+'/contracts/${c.id}')">
                                <i data-lucide="link" style="width:11px;height:11px"></i> Copy receipt link
                            </button>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // ━━━ CONNECTED SOURCES TAB ━━━
        const srcGrid = $('sources-grid');
        if (srcGrid) {
            const brandLogos = {
                x: `<img src="https://cdn.simpleicons.org/x/000000" alt="X" width="20" height="20" style="display:block;" />`,
                stripe: `<img src="https://cdn.simpleicons.org/stripe/635BFF" alt="Stripe" width="20" height="20" style="display:block;" />`,
                shopify: `<img src="https://cdn.simpleicons.org/shopify/95BF47" alt="Shopify" width="20" height="20" style="display:block;" />`,
                amazon: `<svg viewBox="0 0 48 48" width="20" height="20"><path fill="#FF9900" d="M36.7 35.5c-11 8.1-26.9 4.9-26.9 4.9s-1.4-.5-.2-1.6c1.5-1 2.6-.9 2.6-.9 3.1-.3 6.3.7 9.2-.3 4.8-1.6 8.3-5.5 8.3-5.5s.6-.8 1.3-.3c1.3 1 .8 2.5-1.2 4.6-.3.3 3.3-1.1 6.9-4.3.4-.4.9-.2 1 .2.2.5-.1 1.7-1 3.2z"/><path fill="#FF9900" d="M39.5 33.1c-.6-.8-3.8-1-5.3-.5-.5.2-.4.6.1.6.5 0 2.6-.3 3.6.2.3.2.2.8-.4 1.4-.5.5-3.3 2.6-3.8 3-.3.2-.1.5.2.4 2.1-.8 4.3-2 5.1-2.9.6-.6.9-1.6.5-2.2z"/><path fill="#232F3E" d="M28.6 16.9c0-2.6.1-4.8-1.2-7.1-1.1-1.9-2.8-3-4.7-3-2.6 0-4.2 2-4.2 5 0 4.8 4.3 6.6 8.3 6.6h1.8v-1.5zm6.1 14.8c-.4.4-.9.4-1.4.1-1.9-1.6-2.2-2.3-3.3-3.8-3.1 3.2-5.3 4.1-9.4 4.1-4.8 0-8.5-3-8.5-8.9 0-4.6 2.5-7.8 6.1-9.3 3.1-1.3 7.4-1.6 10.7-1.9v-.7c0-1.3.1-2.9-.7-4.1-.7-1-2-1.4-3.2-1.4-2.2 0-4.1 1.1-4.6 3.4-.1.5-.5.9-1 .9l-5.5-.6c-.4-.1-.9-.5-.8-1.1C14.5 3.3 19.9 1.2 24.8 1.2c2.5 0 5.8.7 7.8 2.6 2.5 2.3 2.3 5.4 2.3 8.8v8c0 2.4 1 3.4 1.9 4.7.3.5.4 1 0 1.3-1.1.9-3 2.6-4.1 3.5v-.4z"/></svg>`,
                youtube: `<img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" width="20" height="20" style="display:block;" />`,
            };
            const sources = [
                { name: 'X / Twitter', key: 'x', connected: profile.xConnection?.connected, detail: profile.xConnection?.connected ? '@' + profile.xConnection.xUsername : 'Not connected', scopes: 'Read: followers, engagement' },
                { name: 'Stripe', key: 'stripe', connected: profile.stripeConnection?.connected, detail: profile.stripeConnection?.connected ? 'Account linked' : 'Not setup', scopes: 'Read: revenue, charges' },
                { name: 'Shopify', key: 'shopify', connected: !!profile.shopifyConnection?.connected, detail: profile.shopifyConnection?.connected ? (profile.shopifyConnection.shop || 'Store linked') : 'Not connected', scopes: 'Read: orders, revenue' },
                { name: 'Amazon', key: 'amazon', connected: false, detail: 'Coming Soon', scopes: 'Read: sales data', comingSoon: true },
                { name: 'YouTube', key: 'youtube', connected: !!profile.youtubeConnection?.connected, detail: profile.youtubeConnection?.connected ? (profile.youtubeConnection.channelTitle || 'Channel linked') : 'Not connected', scopes: 'Read: subscribers, views' }
            ];
            srcGrid.innerHTML = sources.map(s => {
                const statusBadge = s.comingSoon ? '<span class="prf-badge disconnected" style="opacity:0.5">Coming Soon</span>' : s.connected ? '<span class="prf-badge connected">Connected</span>' : '<span class="prf-badge disconnected">Disconnected</span>';
                const logo = brandLogos[s.key] || s.key[0].toUpperCase();
                const cardStyle = s.comingSoon ? 'opacity:0.4; filter:grayscale(100%); pointer-events:none;' : '';
                return `<div class="prf-pcard ${s.connected ? '' : 'disconnected'}" style="${cardStyle}">
                    <div class="prf-pcard-icon" style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;border-radius:10px;">${logo}</div>
                    <div class="prf-pcard-name">${s.name}</div>
                    <div style="margin-bottom:8px">${statusBadge}</div>
                    <div class="prf-pcard-scope">${s.scopes}</div>
                    <div class="prf-pcard-scope">${s.connected ? 'Detail: ' + s.detail : ''}</div>
                    <div class="prf-pcard-actions">
                        ${s.comingSoon ? '' : s.connected
                        ? '<button class="prf-cta ghost sm" onclick="event.stopPropagation();window.router.navigate(\'/sources\')">Manage</button><button class="prf-cta ghost sm" onclick="event.stopPropagation();document.getElementById(\'rules-modal\').classList.add(\'open\')">Rules</button>'
                        : '<button class="prf-cta sm" onclick="event.stopPropagation();window.router.navigate(\'/sources\')">Connect →</button>'}
                    </div>
                </div>`;
            }).join('');
        }

        // ━━━ LEDGER TIMELINE TAB ━━━
        let tFilter = 'all';
        const renderTimeline = (filter = 'all') => {
            const tlEl = $('timeline-list');
            if (!tlEl) return;

            // Build events from contracts
            const events = [];
            contracts.forEach(c => {
                const st = c.derivedState || c.state;
                let type = 'execution', dotCls = '', desc = 'Contract created';
                if (['FORFEITED', 'SETTLED_FAILURE'].includes(st)) { type = 'forfeiture'; dotCls = 'red'; desc = 'Capital forfeited'; }
                else if (['SETTLED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(st)) { type = 'settlement'; dotCls = 'green'; desc = 'Contract settled'; }
                else if (['VERIFYING', 'VERIFIED'].includes(st)) { type = 'verification'; dotCls = 'blue'; desc = 'Verification initiated'; }
                else if (['FUNDS_LOCKED', 'LOCKED', 'ACTIVE'].includes(st)) { type = 'execution'; dotCls = 'amber'; desc = 'Capital locked'; }
                events.push({ type, dotCls, desc, date: c.createdAt, amount: c.lockAmountUsdCents, id: c.id, state: st, platform: c.platform, title: describeContract(c) });
            });

            let filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (filtered.length === 0) {
                tlEl.innerHTML = '<div class="prf-empty"><div class="prf-empty-icon"><i data-lucide="clock" style="width:20px;height:20px"></i></div><div class="prf-empty-title">No ledger activity</div><div class="prf-empty-sub">Events will appear here as contracts execute.</div></div>';
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            // Group by day
            const grouped = {};
            filtered.forEach(e => { const dk = dayKey(e.date); if (!grouped[dk]) grouped[dk] = []; grouped[dk].push(e); });

            let html = '<div class="prf-tl-line"></div>';
            Object.keys(grouped).forEach(day => {
                html += '<div class="prf-tl-day">' + day + '</div>';
                grouped[day].forEach(e => {
                    html += `<div class="prf-tl-item">
                        <div class="prf-tl-dot ${e.dotCls}"></div>
                        <div class="prf-tl-row">
                            <span class="prf-badge ${statusClass(e.state)}" style="font-size:9px;height:18px;padding:0 6px">${e.type.toUpperCase()}</span>
                            <span class="prf-tl-desc">${e.desc} — ${e.title}</span>
                            <span class="prf-tl-amt ${e.type === 'forfeiture' ? 'style="color:#752122"' : ''}">${fmtUSD(e.amount)}</span>
                            <span class="prf-tl-ref" onclick="event.stopPropagation();navigator.clipboard.writeText('${e.id}')">CTR-${e.id.substring(0, 5).toUpperCase()} <i data-lucide="copy" style="width:9px;height:9px"></i></span>
                            <span class="prf-tl-time">${fmtTime(e.date)}</span>
                        </div>
                    </div>`;
                });
            });
            tlEl.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();
        };
        renderTimeline();

        // Timeline filter events
        document.querySelectorAll('[data-tfilter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-tfilter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tFilter = btn.getAttribute('data-tfilter');
                renderTimeline(tFilter);
            });
        });

        // ── Render Linked Wallets ──
        window.app.renderLinkedWallets = function () {
            const panel = $('linked-wallets-panel');
            if (!panel) return;

            const u = window.appState.unified;
            if (!u) {
                panel.innerHTML = '<div style="font-size: 11px; color: #9CA3AF; text-align: center; padding: 12px 0;">Authentication state missing.</div>';
                return;
            }

            const connected = u.connectedWallet;
            const linked = u.linkedWallets || [];

            let html = '';

            // 1. Connection Status display
            if (connected) {
                const shortAddr = connected.slice(0, 6) + '...' + connected.slice(-4);
                const isLinked = linked.some(w => w.walletAddress.toLowerCase() === connected);
                const chainName = u.chainId === 4663 ? 'Robinhood Mainnet' : ('Unknown Chain (' + u.chainId + ')');

                html += `
                    <div style="margin-bottom: 16px; padding: 12px; background: #FAF4E6; border: 1px solid rgba(70,55,35,.22); border-radius: 6px;">
                        <div style="font-size: 10px; font-weight: 700; color: #8A8A8A; font-family: var(--font-data); text-transform: uppercase; margin-bottom: 6px;">Connected Wallet</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-size: 13px; font-weight: 700; font-family: var(--font-data); color: #111;">${shortAddr}</span>
                            <span class="prf-badge ${isLinked ? 'connected' : 'pending'}">${isLinked ? 'Linked' : 'Not Linked'}</span>
                        </div>
                        <div style="font-size: 10px; color: #8A8A8A; font-family: var(--font-data);">
                            Network: <span style="font-weight: 600; color: ${u.chainId === 4663 ? '#10B981' : '#D82224'};">${chainName}</span>
                        </div>
                        ${!isLinked ? `
                            <button class="prf-cta sm" style="margin-top: 10px; width: 100%; justify-content: center; background: #5C1414; color: #fff; border-color: #5C1414;" onclick="window.app.promptLinkWallet('${connected}')">
                                Link Wallet to Account
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                html += `
                    <div style="margin-bottom: 16px; padding: 12px; background: #FAF4E6; border: 1px dashed rgba(70,55,35,.22); border-radius: 6px; text-align: center;">
                        <div style="font-size: 11px; color: #6B6B6B; font-family: var(--font-content); margin-bottom: 8px;">No wallet connected to session.</div>
                        <button class="prf-cta sm" style="width: 100%; justify-content: center;" onclick="window.appKit.open()">
                            Connect Wallet
                        </button>
                    </div>
                `;
            }

            // 2. Linked Wallets List
            html += `<div style="font-size: 10px; font-weight: 700; color: #8A8A8A; font-family: var(--font-data); text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid rgba(70,55,35,.18); padding-bottom: 6px;">Linked Wallets (${linked.length})</div>`;

            if (linked.length === 0) {
                html += `
                    <div style="font-size: 11px; color: #9CA3AF; text-align: center; padding: 12px 0; font-family: var(--font-content);">
                        No wallets linked to this account yet.
                    </div>
                `;
            } else {
                html += linked.map(w => {
                    const isPrimary = w.isPrimary;
                    const addr = w.walletAddress;
                    const short = addr.slice(0, 6) + '...' + addr.slice(-4);
                    const isCurrent = connected && connected === addr.toLowerCase();

                    return `
                        <div style="padding: 10px 0; border-bottom: 1px solid #F0F0F0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                    <span style="font-size: 13px; font-weight: 600; font-family: var(--font-data); color: #111;">${short}</span>
                                    ${isPrimary ? '<span class="prf-badge controlled" style="background: #FFF7ED; color: #C2410C;">Primary</span>' : ''}
                                    ${isCurrent ? '<span class="prf-badge active" style="font-size: 8px; height: 14px; padding: 0 4px;">Active</span>' : ''}
                                </div>
                                <div style="font-size: 10px; color: #8A8A8A; font-family: var(--font-data);">
                                    Linked: ${fmtDate(w.verifiedAt)}
                                </div>
                            </div>
                            <div style="display: flex; gap: 4px; flex-shrink: 0;">
                                ${!isPrimary ? `
                                    <button class="prf-cta ghost sm" style="height: 24px; padding: 0 8px; font-size: 9px;" onclick="event.stopPropagation(); window.app.setPrimaryWalletAction('${addr}')">
                                        Set Primary
                                    </button>
                                ` : ''}
                                <button class="prf-cta ghost sm" style="height: 24px; padding: 0 8px; font-size: 9px; color: #D82224; border-color: rgba(216,34,36,0.1);" onclick="event.stopPropagation(); window.app.unlinkWalletAction('${addr}')">
                                    Unlink
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            panel.innerHTML = html;
        };

        // Action handlers
        window.app.setPrimaryWalletAction = async function (address) {
            try {
                const res = await window.api.setPrimaryWallet(address);
                if (res && res.ok) {
                    await window.CollateralModal.showAlert('Primary wallet updated successfully!', { type: 'success', title: 'Wallet Updated' });
                    await window.app.syncUnifiedState();
                } else {
                    throw new Error(res.error || 'Failed to update primary wallet');
                }
            } catch (err) {
                window.CollateralModal.showAlert(err.message || 'Operation failed.', { type: 'error' });
            }
        };

        window.app.unlinkWalletAction = async function (address) {
            const confirm = await window.CollateralModal.showConfirm(
                `Are you sure you want to unlink wallet ${address.slice(0, 6)}...${address.slice(-4)}? This requires signature verification.`,
                {
                    title: 'Unlink Wallet',
                    confirmText: 'UNLINK',
                    danger: true
                }
            );

            if (!confirm) return;

            try {
                const nonceRes = await window.api.getWalletNonce();
                if (!nonceRes || !nonceRes.ok) {
                    throw new Error(nonceRes.error || 'Failed to fetch verification nonce');
                }

                const nonce = nonceRes.nonce;
                const messageText = `Collateral Wallet Verification\n\n` +
                    `Unlink wallet ${address} from your Collateral account.\n\n` +
                    `User ID: ${window.appState.userId}\n` +
                    `Domain: collateral.market\n` +
                    `Chain ID: 4663\n` +
                    `Nonce: ${nonce}\n` +
                    `Issued At: ${nonceRes.createdAt}\n` +
                    `Expiration Time: ${nonceRes.expiresAt}`;

                const signature = await signMessage(window.wagmiAdapter.wagmiConfig, {
                    message: messageText
                });

                const res = await window.api.unlinkWallet(address, signature, nonce);
                if (res && res.ok) {
                    await window.CollateralModal.showAlert('Wallet unlinked successfully!', { type: 'success', title: 'Wallet Unlinked' });
                    await window.app.syncUnifiedState();
                } else {
                    throw new Error(res.error || 'Failed to unlink wallet');
                }
            } catch (err) {
                window.CollateralModal.showAlert(err.message || 'Operation failed.', { type: 'error' });
            }
        };

        window.app.renderLinkedWallets();

        // ── Final icon pass ──
        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        console.error('[Profile] Error loading profile:', err);
    }
}
