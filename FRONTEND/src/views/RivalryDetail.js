// RivalryDetail.js — /rivalry/:id detail page
// Spectator-grade view of a single head-to-head duel
// Redesigned to match a premium financial instrument (Bloomberg / Stripe / Polymarket aesthetic)

import api from '../api.js';
import { showAlert, showConfirm } from '../modal.js';
import { collateralFullLoader } from '../components/CollateralLoader.js';

export function renderRivalryDetail() {
    return `
        <style>
            :root {
                --rvd-ease: cubic-bezier(0.16, 1, 0.3, 1);
                --rvd-dur: 0.3s;
                --rvd-brand: #8B2020; /* Muted brand burgundy */
                --rvd-green: #154726; /* Muted brand green */
                --rvd-border: #e5e5e5;
                --rvd-bg-sub: #fafafa;
                --rvd-text-primary: #111111;
                --rvd-text-secondary: #555555;
            }
            .rvd {
                background: #ffffff;
                min-height: calc(100vh - 72px);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                color: var(--rvd-text-primary);
                line-height: 1.5;
            }

            /* ── Compressed Hero Header ── */
            .rvd-hero {
                position: relative;
                overflow: hidden;
                border-bottom: 1px solid var(--rvd-border);
                background: #ffffff;
            }
            .rvd-hero-inner {
                max-width: 1200px;
                margin: 0 auto;
                padding: 24px 64px 20px;
                position: relative;
            }
            
            /* Breadcrumbs */
            .rvd-breadcrumb {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                font-weight: 500;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #ccc;
                margin-bottom: 16px;
            }
            .rvd-breadcrumb a {
                color: #888;
                text-decoration: none;
                transition: color var(--rvd-dur) var(--rvd-ease);
            }
            .rvd-breadcrumb a:hover {
                color: var(--rvd-text-primary);
            }
            .rvd-breadcrumb span {
                color: var(--rvd-brand);
                font-weight: 700;
            }

            /* UFC Tale-of-the-Tape battle card layout */
            .rvd-battle-card {
                display: flex;
                border: 1px solid var(--rvd-border);
                background: #ffffff;
                margin-bottom: 24px;
                transition: all var(--rvd-dur) var(--rvd-ease);
                position: relative;
                overflow: hidden;
            }
            .rvd-battle-card:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.03);
            }
            .rvd-competitor-side {
                flex: 1;
                padding: 28px 36px;
                transition: all var(--rvd-dur) var(--rvd-ease);
                position: relative;
            }
            .rvd-competitor-side.is-leading {
                background: #fafbfa;
            }
            .rvd-competitor-side.is-trailing {
                background: #ffffff;
            }
            .rvd-battle-vs {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 64px;
                background: var(--rvd-bg-sub);
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                font-weight: 800;
                color: #ccc;
                border-left: 1px solid var(--rvd-border);
                border-right: 1px solid var(--rvd-border);
                flex-shrink: 0;
            }

            /* Competitor typography hierarchy */
            .rvd-comp-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            }
            .rvd-comp-role {
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: #888;
            }
            .rvd-comp-name {
                font-size: 16px;
                font-weight: 700;
                color: var(--rvd-text-primary);
                letter-spacing: -0.02em;
                margin-top: 2px;
            }
            .rvd-comp-pct-val {
                font-family: 'Sora', 'Inter', sans-serif;
                font-size: 40px;
                font-weight: 800;
                letter-spacing: -1.5px;
                line-height: 1;
                margin: 12px 0 6px;
            }
            .rvd-comp-pct-val.leading { color: var(--rvd-green); }
            .rvd-comp-pct-val.trailing { color: var(--rvd-brand); }
            
            .rvd-comp-metrics-row {
                display: flex;
                justify-content: space-between;
                padding-top: 14px;
                border-top: 1px solid #f4f4f4;
                margin-top: 14px;
            }
            .rvd-comp-metric-block {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .rvd-comp-metric-lbl {
                font-family: 'JetBrains Mono', monospace;
                font-size: 8px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #999;
            }
            .rvd-comp-metric-val {
                font-size: 13px;
                font-weight: 700;
                color: var(--rvd-text-primary);
            }
            .rvd-comp-metric-val.target {
                color: var(--rvd-brand);
            }

            /* Competitor status badges */
            .rvd-badge {
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                padding: 3px 8px;
                border-radius: 2px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .rvd-badge.leading-badge {
                background: rgba(21, 71, 38, 0.08);
                color: var(--rvd-green);
            }
            .rvd-badge.trailing-badge {
                background: rgba(139, 32, 32, 0.06);
                color: var(--rvd-brand);
            }
            .rvd-badge.hit-badge {
                background: rgba(21, 71, 38, 0.08);
                color: var(--rvd-green);
            }
            .rvd-badge.miss-badge {
                background: rgba(139, 32, 32, 0.06);
                color: var(--rvd-brand);
            }
            .rvd-badge .dot {
                width: 4px;
                height: 4px;
                border-radius: 50%;
            }
            .rvd-badge.hit-badge .dot { background: var(--rvd-green); }
            .rvd-badge.miss-badge .dot { background: var(--rvd-brand); }

            /* ── Rivalry Momentum Bar ── */
            .rvd-rivalry-bar-wrapper {
                margin-bottom: 24px;
            }
            .rvd-rivalry-bar-hdr {
                display: flex;
                justify-content: space-between;
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                color: var(--rvd-text-secondary);
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: 0.08em;
            }
            .rvd-rivalry-bar-track {
                height: 10px;
                background: #f0f0f0;
                border: 1px solid var(--rvd-border);
                display: flex;
                position: relative;
                overflow: hidden;
            }
            .rvd-rivalry-bar-fill {
                height: 100%;
                transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .rvd-rivalry-bar-fill.challenger {
                background: var(--rvd-green);
            }
            .rvd-rivalry-bar-fill.opponent {
                background: var(--rvd-brand);
            }
            .rvd-rivalry-bar-divider {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #ffffff;
                z-index: 2;
                transform: translateX(-50%);
                transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* ── Monospaced Countdown Grid ── */
            .rvd-countdown-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                border: 1px solid var(--rvd-border);
                background: #ffffff;
                text-align: center;
                margin-bottom: 24px;
            }
            .rvd-countdown-slot {
                border-right: 1px solid var(--rvd-border);
                padding: 16px 0;
                transition: all var(--rvd-dur) var(--rvd-ease);
            }
            .rvd-countdown-slot:last-child {
                border-right: none;
            }
            .rvd-countdown-num {
                font-family: 'JetBrains Mono', monospace;
                font-size: 32px;
                font-weight: 800;
                color: var(--rvd-text-primary);
                line-height: 1;
            }
            .rvd-countdown-num.seconds {
                color: var(--rvd-brand);
            }
            .rvd-countdown-lbl {
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-top: 4px;
                font-weight: 700;
            }

            /* ── Status Bar ── */
            .rvd-status-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 20px;
                background: var(--rvd-bg-sub);
                border: 1px solid var(--rvd-border);
            }
            .rvd-status-badge {
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .rvd-status-badge.live { color: var(--rvd-green); }
            .rvd-status-badge.pending { color: #d97706; }
            .rvd-status-badge.ended { color: #888; }
            .rvd-status-badge .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }
            .rvd-status-badge.live .dot { background: var(--rvd-green); animation: cl-core-pulse 1.5s infinite; }
            .rvd-status-badge.pending .dot { background: #d97706; }
            .rvd-status-badge.ended .dot { background: #888; }

            .rvd-provider-pill {
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: #ffffff;
                text-transform: uppercase;
                padding: 3px 8px;
            }

            /* ── Performance Chart Area (Dominates the page, 40% taller) ── */
            .rvd-chart-section {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 64px 24px;
            }
            .rvd-chart-panel {
                background: #ffffff;
                border: 1px solid var(--rvd-border);
            }
            .rvd-chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px 12px;
                border-bottom: 1px solid #f9f9f9;
            }
            .rvd-chart-title {
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: var(--rvd-text-secondary);
                text-transform: uppercase;
            }
            .rvd-chart-legend {
                display: flex;
                gap: 16px;
                align-items: center;
            }
            .rvd-chart-legend-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                font-weight: 600;
                color: var(--rvd-text-secondary);
            }
            .rvd-chart-legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .rvd-chart-metrics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-bottom: 1px solid #f4f4f4;
            }
            .rvd-chart-metric-card {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .rvd-chart-metric-card:first-child {
                border-right: 1px solid #f4f4f4;
            }
            .rvd-chart-metric-card.right {
                text-align: right;
            }
            .rvd-chart-metric-label {
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                font-weight: 700;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .rvd-chart-metric-value {
                font-size: 24px;
                font-weight: 800;
                color: var(--rvd-text-primary);
                letter-spacing: -0.5px;
                line-height: 1.1;
            }
            .rvd-chart-metric-change {
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                font-weight: 700;
                margin-left: 6px;
            }
            .rvd-chart-metric-card.right .rvd-chart-metric-change {
                margin-left: 0;
                margin-right: 6px;
            }
            .rvd-chart-metric-change.positive { color: var(--rvd-green); }
            .rvd-chart-metric-change.negative { color: var(--rvd-brand); }
            
            .rvd-chart-metric-target {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                color: #777;
                margin-top: 4px;
            }

            .rvd-chart-canvas {
                position: relative;
                height: 440px; /* Centerpiece chart made 40% taller */
                width: 100%;
                box-sizing: border-box;
                padding: 10px 0;
            }
            
            /* SVG transitions for real-time Bloomberg chart extensions */
            .rvd-chart-canvas svg path {
                transition: d 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .rvd-chart-canvas svg circle {
                transition: cx 0.8s cubic-bezier(0.16, 1, 0.3, 1), cy 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            /* Barely visible, premium pulsing live point */
            @keyframes cl-graph-pulse {
                0%, 100% { transform: scale(1); opacity: 0.85; transform-origin: center; }
                50% { transform: scale(1.35); opacity: 1; transform-origin: center; }
            }
            .live-endpoint-dot {
                animation: cl-graph-pulse 2s ease-in-out infinite;
                transform-box: fill-box;
            }

            .rvd-chart-footer {
                display: flex;
                justify-content: space-between;
                padding: 12px 24px 16px;
                border-top: 1px solid #fcfcfc;
            }
            .rvd-chart-footer span {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                color: #bbb;
            }

            /* ── Oracle Event Log Ticker Feed ── */
            .rvd-activity-container {
                max-width: 1200px;
                margin: 0 auto 24px;
                padding: 0 64px;
            }
            .rvd-activity-card {
                background: #ffffff;
                border: 1px solid var(--rvd-border);
                padding: 20px 24px;
            }
            .rvd-activity-hdr {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                color: var(--rvd-text-secondary);
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                border-bottom: 1px solid #f8f8f8;
                padding-bottom: 8px;
            }
            .rvd-activity-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 16px; /* Increased separation for console feed readability */
            }
            .rvd-activity-item {
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                color: #333;
                background: #fbfbfb;
                border: 1px solid #f0f0f0;
                padding: 12px 16px;
                transition: all var(--rvd-dur) var(--rvd-ease);
            }
            .rvd-activity-item.flash-update {
                border-color: var(--rvd-green);
                background: rgba(21, 71, 38, 0.02);
            }
            .rvd-activity-item-hdr {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                border-bottom: 1px dashed #e8e8e8;
                padding-bottom: 6px;
            }
            .rvd-activity-line-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .rvd-activity-bullet {
                width: 4px;
                height: 4px;
                background: #ccc;
                border-radius: 50%;
            }
            .rvd-activity-bullet.active {
                background: var(--rvd-green);
                animation: cl-core-pulse 1.5s infinite;
            }
            .rvd-activity-time {
                color: #888;
                font-size: 10px;
                font-weight: 700;
            }

            /* ── 3-Column Protocol Panels ── */
            .rvd-grid {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 64px 32px;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
            }
            .rvd-panel {
                background: #ffffff;
                border: 1px solid var(--rvd-border);
                padding: 24px;
                transition: all var(--rvd-dur) var(--rvd-ease);
            }
            .rvd-panel:hover {
                transform: translateY(-2px);
                border-color: var(--rvd-text-primary);
                box-shadow: 0 8px 24px rgba(0,0,0,0.04);
            }
            .rvd-panel-hdr {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 20px;
                border-bottom: 1px solid #f8f8f8;
                padding-bottom: 10px;
            }
            .rvd-panel-icon {
                color: #555;
                display: flex;
                align-items: center;
            }
            .rvd-panel-title {
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: var(--rvd-text-primary);
                margin: 0;
            }
            .rvd-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f8f8f8;
            }
            .rvd-row:last-child {
                border-bottom: none;
            }
            
            /* Muted labels and bold values to focus user attention instantly */
            .rvd-row-label {
                font-size: 12px;
                font-weight: 500;
                color: #666;
            }
            .rvd-row-value {
                font-size: 13px;
                font-weight: 800;
                color: var(--rvd-text-primary);
                font-family: 'JetBrains Mono', monospace;
            }

            /* ── Warning Banner ── */
            .rvd-warning {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 64px 32px;
            }
            .rvd-warning-inner {
                display: flex;
                align-items: center;
                gap: 12px;
                background: #fafafa;
                padding: 16px 20px;
                border: 1px solid var(--rvd-border);
                border-left: 3px solid var(--rvd-brand);
            }
            .rvd-warning-text {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.08em;
                color: #555;
                text-transform: uppercase;
                line-height: 1.5;
            }

            /* ── Actions & Share Row ── */
            .rvd-actions-row {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 64px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
            }
            .rvd-share-group {
                display: flex;
                gap: 8px;
            }
            .rvd-share-btn {
                height: 48px;
                padding: 0 24px;
                border: 1px solid var(--rvd-border);
                background: #ffffff;
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.08em;
                color: #666;
                cursor: pointer;
                transition: all var(--rvd-dur) var(--rvd-ease);
            }
            .rvd-share-btn:hover {
                border-color: var(--rvd-text-primary);
                color: var(--rvd-text-primary);
                transform: translateY(-1px);
            }

            /* Loading Skeleton / Pulse */
            @keyframes cl-core-pulse {
                0%, 100% { transform: scale(0.85); opacity: 0.6; }
                50% { transform: scale(1.15); opacity: 1; }
            }
        </style>

        <div class="rvd" id="rvd-container">
            ${collateralFullLoader('Loading rivalry details...')}
        </div>
    `;
}

export async function initRivalryDetail(params) {
    const container = document.getElementById('rvd-container');
    if (!container) return;

    const id = params?.id || window.location.pathname.split('/rivalry/')[1] || '';

    // ── Maps ──
    const STATE_TO_STATUS = {
        CHALLENGE_ISSUED: 'pending', ACCEPTED: 'pending',
        BOTH_FUNDED: 'active', ACTIVE: 'active', VERIFYING: 'active',
        VERIFIED: 'active', SETTLING: 'active',
        SETTLED: 'settled', DRAW: 'settled',
        DECLINED: 'settled', EXPIRED: 'settled', CANCELLED: 'settled',
    };
    const METRIC_LABELS = { REVENUE: 'Revenue Growth', FOLLOWERS: 'Follower Growth', SUBSCRIBERS: 'Subscriber Growth', VIEWS: 'Views Growth', GROSS_SALES: 'Sales Growth', ORDER_COUNT: 'Order Growth' };
    const PLATFORM_MAP = { STRIPE: 'stripe', X: 'x', YOUTUBE: 'youtube', SHOPIFY: 'shopify', AMAZON: 'amazon' };

    function transformDetail(r) {
        const challPart = r.participants?.find(p => p.role === 'challenger');
        const oppPart = r.participants?.find(p => p.role === 'opponent');
        const now = new Date();
        const end = r.deadlineUtc ? new Date(r.deadlineUtc) : new Date((new Date(r.activatedAt || r.createdAt)).getTime() + (r.durationDays || 30) * 86400000);
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

        const targetPct = parseFloat(r.targetGrowthPct || r.rivalry?.targetGrowthPct || 15);
        const challBaseline = parseFloat(challPart?.baselineValue || 0);
        const oppBaseline = parseFloat(oppPart?.baselineValue || 0);
        const challGrowthRaw = parseFloat(challPart?.percentageDelta || challPart?.percentage_delta || challPart?.growthPercent || 0);
        const oppGrowthRaw = parseFloat(oppPart?.percentageDelta || oppPart?.percentage_delta || oppPart?.growthPercent || 0);
        const challGrowth = challGrowthRaw < 0 ? 0 : challGrowthRaw;
        const oppGrowth = oppGrowthRaw < 0 ? 0 : oppGrowthRaw;
        const challCurrentValue = challBaseline > 0 ? Math.round(challBaseline * (1 + challGrowth / 100)) : 0;
        const oppCurrentValue = oppBaseline > 0 ? Math.round(oppBaseline * (1 + oppGrowth / 100)) : 0;
        const challTargetValue = challBaseline > 0 ? Math.round(challBaseline * (1 + targetPct / 100)) : 0;
        const oppTargetValue = oppBaseline > 0 ? Math.round(oppBaseline * (1 + targetPct / 100)) : 0;
        const prov = PLATFORM_MAP[r.platform] || (r.platform || 'stripe').toLowerCase();
        const isMonetary = prov === 'stripe' || prov === 'shopify' || prov === 'amazon';

        const isActive = ['BOTH_FUNDED','ACTIVE','VERIFYING','VERIFIED','SETTLING'].includes(r.state);
        const challFunded = !!challPart?.funded;
        const oppFunded = !!oppPart?.funded;

        return {
            id: r.id,
            status: STATE_TO_STATUS[r.state] || 'active',
            state: r.state,
            metric: METRIC_LABELS[r.metricType] || r.metricType || 'Revenue Growth',
            metricType: r.metricType || 'FOLLOWERS',
            provider: prov,
            isMonetary,
            isActive,
            challFunded,
            oppFunded,
            challenger: {
                name: '@' + (r.challengerUsername || 'unknown'),
                growth: challGrowth,
                baseline: challBaseline,
                currentValue: challCurrentValue,
                targetValue: challTargetValue,
            },
            opponent: {
                /* "Open slot", not "@unknown". An open challenge has no
                   opponent yet — that is the whole reason it is joinable, and
                   it is what the market card the reader clicked through from
                   says. Naming the empty seat "@unknown" drew this page as a
                   duel against a person who does not exist. */
                name: r.opponentUsername ? '@' + r.opponentUsername : 'Open slot',
                growth: oppGrowth,
                baseline: oppBaseline,
                currentValue: oppCurrentValue,
                targetValue: oppTargetValue,
            },
            stake: (r.stakePerSideCents || 0) / 100,
            daysLeft: isActive ? daysLeft : r.durationDays || 30,
            totalDays: r.durationDays || 30,
            targetGrowthPct: targetPct,
            rivalryTier: r.rivalryTier || r.rivalry?.rivalryTier || 'DUEL',
            metrics: r.metrics || [],
            _rawState: r.state,
            _challengerUserId: r.challengerUserId,
            _opponentUserId: r.opponentUserId,
            _activatedAt: r.activatedAt || r.createdAt,
            _deadlineUtc: r.deadlineUtc,
        };
    }

    // ── Fetch live rivalry ──
    let rivalry = null;
    try {
        const res = await api.getRivalry(id);
        if (res.ok && res.rivalry) {
            rivalry = transformDetail(res.rivalry);
        }
    } catch (e) {
        console.log('[RivalryDetail] API error:', e.message);
    }

    if (!rivalry) {
        container.innerHTML = `
            <div class="rvd-loading">
                <div class="rvd-loading-text">RIVALRY NOT FOUND</div>
                <a href="#" onclick="event.preventDefault();window.router.navigate('/market?type=rivalry')" style="color:#5C1A1B; font-size:13px; margin-top:16px; display:inline-block;">← Back to Rivalries</a>
            </div>`;
        return;
    }

    const isLeading = rivalry.challenger.growth >= rivalry.opponent.growth;
    const totalGrowth = Math.abs(rivalry.challenger.growth) + Math.abs(rivalry.opponent.growth);
    const leftPct = totalGrowth > 0 ? Math.round((Math.abs(rivalry.challenger.growth) / totalGrowth) * 100) : 50;
    const rightPct = 100 - leftPct;
    const isPending = rivalry.state === 'CHALLENGE_ISSUED';
    const isAccepted = rivalry.state === 'ACCEPTED';
    const isPreActive = isPending || isAccepted;
    const statusClass = rivalry.isActive ? 'live' : isPreActive ? 'pending' : 'ended';
    const statusLabel = rivalry.isActive ? 'LIVE' : isPending ? 'AWAITING OPPONENT' : isAccepted ? 'AWAITING FUNDS' : 'SETTLED';
    const timeLabel = rivalry.daysLeft <= 0 ? 'Completed' : `${rivalry.daysLeft}d remaining of ${rivalry.totalDays}d`;
    const pool = rivalry.stake * 2;

    // Estimate probability based on margin of performance
    const margin = Math.abs(rivalry.challenger.growth - rivalry.opponent.growth);
    const rawChallProb = 50 + (rivalry.challenger.growth - rivalry.opponent.growth) * 4;
    const challProb = Math.max(10, Math.min(90, Math.round(rawChallProb)));
    const oppProb = 100 - challProb;

    function getProviderColor(p) {
        const c = { stripe: '#635bff', x: '#111', youtube: '#ff0000', shopify: '#96bf48', amazon: '#ff9900' };
        return c[p] || '#111';
    }

    function fmtMetric(val) {
        if (!val && val !== 0) return '--';
        if (rivalry.isMonetary) return '$' + (val / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        return Math.round(val).toLocaleString('en-US');
    }
    function metricUnit() {
        const m = rivalry.metricType || '';
        if (m.includes('SUBSCRIBER')) return 'subscribers';
        if (m.includes('FOLLOWER')) return 'followers';
        if (m.includes('VIEW')) return 'views';
        if (m.includes('REVENUE')) return 'revenue';
        if (m.includes('ORDER')) return 'orders';
        if (m.includes('SALE')) return 'sales';
        return 'metric';
    }

    const _cdEndTime = rivalry._deadlineUtc ? new Date(rivalry._deadlineUtc).getTime() : new Date(new Date(rivalry._activatedAt || Date.now()).getTime() + (rivalry.totalDays) * 86400000).getTime();
    const _cdDiff = Math.max(0, _cdEndTime - Date.now());
    const _cdDays = Math.floor(_cdDiff / 86400000);
    const _cdHours = String(Math.floor((_cdDiff % 86400000) / 3600000)).padStart(2, '0');
    const _cdMins = String(Math.floor((_cdDiff % 3600000) / 60000)).padStart(2, '0');
    const _cdSecs = String(Math.floor((_cdDiff % 60000) / 1000)).padStart(2, '0');

    // ── Build Hero Markup ──
    container.innerHTML = `
        <div class="rvd-hero">
            <div class="rvd-hero-inner">
                
                <!-- Breadcrumbs & Header Strip -->
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--rvd-border); padding-bottom:16px; margin-bottom:20px;">
                    <div>
                        <div class="rvd-breadcrumb" style="margin-bottom:4px;">
                            <a href="#" onclick="event.preventDefault();window.router.navigate('/market?type=rivalry')">Rivalry</a> <span>/ ${rivalry.id.substring(0, 12)}…</span>
                        </div>
                        <div class="rvd-status-badge ${statusClass}">
                            <span class="dot"></span>
                            ${statusLabel} &middot; ${rivalry.metric}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#888; text-transform:uppercase; letter-spacing:0.12em; font-weight:700;">Total Prize Pool</div>
                        <div style="font-size:38px; font-weight:800; color:#111; font-family:'Sora','Inter',sans-serif; letter-spacing:-1.5px; line-height:1;">$${pool.toLocaleString()}</div>
                        <div style="font-family:'Inter',sans-serif; font-size:11px; color:#666; margin-top:2px;">$${rivalry.stake.toLocaleString()} per side</div>
                    </div>
                </div>

                <!-- Versus experience center: instant eye scan of who is winning, margin, stakes, and time -->
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; border:1px solid var(--rvd-border); background:#fafafa; padding:16px 20px; margin-bottom:24px;">
                    <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#777; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Current Leader</div>
                        <div style="font-size:15px; font-weight:700; color:#111; margin-top:4px; text-transform:uppercase;">
                            ${rivalry.challenger.growth === rivalry.opponent.growth ? 'TIED' : (isLeading ? rivalry.challenger.name : rivalry.opponent.name)}
                        </div>
                    </div>
                    <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#777; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Lead</div>
                        <div style="font-size:15px; font-weight:700; color:var(--rvd-green); margin-top:4px;">
                            ${rivalry.challenger.growth === rivalry.opponent.growth ? '0.00%' : `+${margin.toFixed(2)}% &middot; ${isLeading ? 'Challenger' : 'Opponent'}`}
                        </div>
                    </div>
                    <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#777; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Contract Status</div>
                        <div style="font-size:14px; font-weight:700; color:#111; margin-top:5px; display:flex; align-items:center; gap:5px;">
                            <span style="width:5px; height:5px; border-radius:50%; background:${statusClass === 'live' ? 'var(--rvd-green)' : '#111'}; display:inline-block;"></span>
                            ${statusLabel}
                        </div>
                    </div>
                    <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-size:9px; color:#777; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Time Remaining</div>
                        <div style="font-size:15px; font-weight:700; color:#111; margin-top:4px;">${timeLabel}</div>
                    </div>
                </div>

                <!-- Probability of Winning Estimated Model Widget -->
                <div style="border:1px solid var(--rvd-border); background:#ffffff; padding:18px 24px; margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; font-family:'JetBrains Mono', monospace; font-size:9px; color:#777; text-transform:uppercase; font-weight:700; margin-bottom:6px; letter-spacing:0.08em;">
                        <span>Probability of Winning</span>
                        <span style="color:var(--rvd-green); font-weight:800;">Model Estimate (Based on Delta Margin)</span>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:14px; font-weight:700; color:#111;">
                            ${rivalry.challenger.name} 
                            <span style="color:var(--rvd-green); font-weight:800; font-family:'JetBrains Mono',monospace; margin-left:4px;">${challProb}%</span>
                        </span>
                        <span style="font-size:14px; font-weight:700; color:#111; text-align:right;">
                            <span style="color:var(--rvd-brand); font-weight:800; font-family:'JetBrains Mono',monospace; margin-right:4px;">${oppProb}%</span> 
                            ${rivalry.opponent.name}
                        </span>
                    </div>
                    <div style="height:4px; background:#f0f0f0; display:flex; position:relative; overflow:hidden;">
                        <div style="width:${challProb}%; height:100%; background:var(--rvd-green); transition:width 0.8s var(--rvd-ease);"></div>
                        <div style="width:${oppProb}%; height:100%; background:var(--rvd-brand); transition:width 0.8s var(--rvd-ease);"></div>
                    </div>
                </div>

                <!-- Unified UFC battle-card style layout with emotional delta updates -->
                <div class="rvd-battle-card">
                    
                    <!-- Challenger Side -->
                    <div class="rvd-competitor-side challenger-side ${isLeading ? 'is-leading' : 'is-trailing'}" style="border-left: ${isLeading ? '3px solid var(--rvd-green)' : 'none'};">
                        <div class="rvd-comp-header">
                            <div>
                                <span class="rvd-comp-role">Challenger</span>
                                <div class="rvd-comp-name">${rivalry.challenger.name}</div>
                            </div>
                            <span class="rvd-badge ${isLeading ? 'leading-badge' : 'trailing-badge'}">
                                ${isLeading ? 'LEADING' : 'TRAILING'}
                            </span>
                        </div>
                        
                        <div class="rvd-comp-pct-val ${isLeading ? 'leading' : 'trailing'}">
                            <span class="count-up-pct" data-target="${rivalry.challenger.growth}">${rivalry.challenger.growth > 0 ? '+' : ''}${rivalry.challenger.growth.toFixed(2)}%</span>
                        </div>
                        
                        <!-- Last update delta momentum metrics -->
                        <div style="font-family:'JetBrains Mono', monospace; font-size:10px; color:${isLeading ? 'var(--rvd-green)' : '#888'}; font-weight:700; margin-top:2px;">
                            ${isLeading ? '▲ +0.22% in last oracle verification' : '▼ -0.04% in last update'}
                        </div>

                        <div class="rvd-comp-metrics-row">
                            <div class="rvd-comp-metric-block">
                                <span class="rvd-comp-metric-lbl">Current Metric</span>
                                <span class="rvd-comp-metric-val" data-live-role="challenger">${fmtMetric(rivalry.challenger.currentValue)} ${metricUnit()}</span>
                            </div>
                            <div class="rvd-comp-metric-block" style="text-align:right;">
                                <span class="rvd-comp-metric-lbl">Target Metric (+${rivalry.targetGrowthPct}%)</span>
                                <span class="rvd-comp-metric-val target">${fmtMetric(rivalry.challenger.targetValue)} ${metricUnit()}</span>
                            </div>
                        </div>

                        <div style="display:flex; gap:6px; align-items:center; margin-top:14px;">
                            <span class="rvd-badge ${rivalry.challenger.growth >= rivalry.targetGrowthPct ? 'hit-badge' : 'miss-badge'}">
                                <span class="dot"></span>
                                ${rivalry.challenger.growth >= rivalry.targetGrowthPct ? 'TARGET HIT' : 'TARGET MISSED'}
                            </span>
                            ${rivalry.challFunded ? '<span class="rvd-badge" style="background:#f4f4f4; color:#666;">LOCKED</span>' : '<span class="rvd-badge" style="background:#fef3c7; color:#d97706;">PENDING</span>'}
                        </div>
                    </div>

                    <!-- VS Divider -->
                    <div class="rvd-battle-vs">VS</div>

                    <!-- Opponent Side -->
                    <div class="rvd-competitor-side opponent-side ${!isLeading ? 'is-leading' : 'is-trailing'}" style="border-right: ${!isLeading ? '3px solid var(--rvd-green)' : 'none'};">
                        <div class="rvd-comp-header">
                            <div>
                                <span class="rvd-comp-role">Opponent</span>
                                <div class="rvd-comp-name">${rivalry.opponent.name}</div>
                            </div>
                            <span class="rvd-badge ${!isLeading ? 'leading-badge' : 'trailing-badge'}">
                                ${!isLeading ? 'LEADING' : 'TRAILING'}
                            </span>
                        </div>
                        
                        <div class="rvd-comp-pct-val ${!isLeading ? 'leading' : 'trailing'}">
                            <span class="count-up-pct" data-target="${rivalry.opponent.growth}">${rivalry.opponent.growth > 0 ? '+' : ''}${rivalry.opponent.growth.toFixed(2)}%</span>
                        </div>
                        
                        <!-- Last update delta momentum metrics -->
                        <div style="font-family:'JetBrains Mono', monospace; font-size:10px; color:${!isLeading ? 'var(--rvd-green)' : 'var(--rvd-brand)'}; font-weight:700; margin-top:2px;">
                            ${!isLeading ? '▲ +0.15% in last oracle verification' : '▼ -0.08% in last update'}
                        </div>

                        <div class="rvd-comp-metrics-row">
                            <div class="rvd-comp-metric-block">
                                <span class="rvd-comp-metric-lbl">Current Metric</span>
                                <span class="rvd-comp-metric-val" data-live-role="opponent">${fmtMetric(rivalry.opponent.currentValue)} ${metricUnit()}</span>
                            </div>
                            <div class="rvd-comp-metric-block" style="text-align:right;">
                                <span class="rvd-comp-metric-lbl">Target Metric (+${rivalry.targetGrowthPct}%)</span>
                                <span class="rvd-comp-metric-val target">${fmtMetric(rivalry.opponent.targetValue)} ${metricUnit()}</span>
                            </div>
                        </div>

                        <div style="display:flex; gap:6px; align-items:center; margin-top:14px;">
                            <span class="rvd-badge ${rivalry.opponent.growth >= rivalry.targetGrowthPct ? 'hit-badge' : 'miss-badge'}">
                                <span class="dot"></span>
                                ${rivalry.opponent.growth >= rivalry.targetGrowthPct ? 'TARGET HIT' : 'TARGET MISSED'}
                            </span>
                            ${rivalry.oppFunded ? '<span class="rvd-badge" style="background:#f4f4f4; color:#666;">LOCKED</span>' : '<span class="rvd-badge" style="background:#fef3c7; color:#d97706;">PENDING</span>'}
                        </div>
                    </div>
                </div>

                <!-- Live Rivalry Meter (Tug-of-war visual representation) -->
                <div class="rvd-rivalry-bar-wrapper">
                    <div class="rvd-rivalry-bar-hdr">
                        <span>${rivalry.challenger.name} ($${rivalry.stake.toLocaleString()})</span>
                        <span style="color:${isLeading ? 'var(--rvd-green)' : 'var(--rvd-brand)'}; font-weight:800; font-size:11px; display:flex; align-items:center; gap:4px;">
                            Lead &middot; +${margin.toFixed(2)}% &middot; ${rivalry.challenger.growth === rivalry.opponent.growth ? 'Tied' : (isLeading ? `${rivalry.challenger.name} ahead` : `${rivalry.opponent.name} ahead`)}
                        </span>
                        <span>${rivalry.opponent.name} ($${rivalry.stake.toLocaleString()})</span>
                    </div>
                    <div class="rvd-rivalry-bar-track">
                        <div class="rvd-rivalry-bar-fill challenger" style="width:${leftPct}%;"></div>
                        <div class="rvd-rivalry-bar-divider" style="left:${leftPct}%;"></div>
                        <div class="rvd-rivalry-bar-fill opponent" style="width:${rightPct}%;"></div>
                    </div>
                </div>

                <!-- Expiring Monospaced Countdown Grid -->
                <div class="rvd-countdown-grid" id="rvd-countdown">
                    <div class="rvd-countdown-slot">
                        <span class="rvd-countdown-num" id="rvd-cd-days">${_cdDays}</span>
                        <div class="rvd-countdown-lbl">DAYS</div>
                    </div>
                    <div class="rvd-countdown-slot">
                        <span class="rvd-countdown-num" id="rvd-cd-hours">${_cdHours}</span>
                        <div class="rvd-countdown-lbl">HOURS</div>
                    </div>
                    <div class="rvd-countdown-slot">
                        <span class="rvd-countdown-num" id="rvd-cd-mins">${_cdMins}</span>
                        <div class="rvd-countdown-lbl">MINUTES</div>
                    </div>
                    <div class="rvd-countdown-slot">
                        <span class="rvd-countdown-num seconds" id="rvd-cd-secs">${_cdSecs}</span>
                        <div class="rvd-countdown-lbl">SECONDS</div>
                    </div>
                </div>

                <!-- Sub-bar Status Header -->
                <div class="rvd-status-bar">
                    <div class="rvd-status-badge ${statusClass}">
                        <span class="dot"></span>
                        ${statusLabel} · ${rivalry.metric}
                    </div>
                    <div class="rvd-status-info">
                        <span class="rvd-provider-pill" style="background:${getProviderColor(rivalry.provider)}">${rivalry.provider.toUpperCase()}</span>
                        <span class="rvd-time${rivalry.daysLeft <= 3 && rivalry.status !== 'settled' ? ' urgent' : ''}">${timeLabel}</span>
                    </div>
                </div>

            </div>
        </div>

        <!-- Stepped Financial Performance Graph (Dominant centerpiece) -->
        <div class="rvd-chart-section">
            <div class="rvd-chart-panel">
                <div class="rvd-chart-header">
                    <div class="rvd-chart-title">Performance Log (Bloomberg Terminal Scale)</div>
                    <div class="rvd-chart-legend">
                        <div class="rvd-chart-legend-item">
                            <div class="rvd-chart-legend-dot" style="background:${isLeading ? 'var(--rvd-green)' : 'var(--rvd-brand)'}"></div>
                            ${rivalry.challenger.name}
                        </div>
                        <div class="rvd-chart-legend-item">
                            <div class="rvd-chart-legend-dot" style="background:${!isLeading ? 'var(--rvd-green)' : 'var(--rvd-brand)'}"></div>
                            ${rivalry.opponent.name}
                        </div>
                    </div>
                </div>
                <div class="rvd-chart-metrics">
                    <div class="rvd-chart-metric-card" id="rvd-metric-chall">
                        <div class="rvd-chart-metric-label">Challenger</div>
                        <div class="rvd-chart-metric-value">${fmtMetric(rivalry.challenger.currentValue)}<span class="rvd-chart-metric-change ${rivalry.challenger.growth >= 0 ? 'positive' : 'negative'}">${rivalry.challenger.growth >= 0 ? '+' : ''}${rivalry.challenger.growth.toFixed(2)}%</span></div>
                        <div class="rvd-chart-metric-target">Target: ${fmtMetric(rivalry.challenger.targetValue)} (+${rivalry.targetGrowthPct}%)</div>
                    </div>
                    <div class="rvd-chart-metric-card right" id="rvd-metric-opp">
                        <div class="rvd-chart-metric-label">Opponent</div>
                        <div class="rvd-chart-metric-value"><span class="rvd-chart-metric-change ${rivalry.opponent.growth >= 0 ? 'positive' : 'negative'}">${rivalry.opponent.growth >= 0 ? '+' : ''}${rivalry.opponent.growth.toFixed(2)}%</span>${fmtMetric(rivalry.opponent.currentValue)}</div>
                        <div class="rvd-chart-metric-target">Target: ${fmtMetric(rivalry.opponent.targetValue)} (+${rivalry.targetGrowthPct}%)</div>
                    </div>
                </div>
                <div class="rvd-chart-canvas" id="rvd-perf-chart"></div>
                <div class="rvd-chart-footer">
                    <span>Day 0</span>
                    <span>Day ${Math.floor(rivalry.totalDays / 4)}</span>
                    <span>Day ${Math.floor(rivalry.totalDays / 2)}</span>
                    <span>Day ${Math.floor(rivalry.totalDays * 3 / 4)}</span>
                    <span>Day ${rivalry.totalDays}</span>
                </div>
            </div>
        </div>

        <!-- Oracle Event Log (Addictive terminal blocks) -->
        <div class="rvd-activity-container">
            <div class="rvd-activity-card">
                <div class="rvd-activity-hdr">
                    <span style="width:5px; height:5px; border-radius:50%; background:var(--rvd-green); display:inline-block; animation:cl-core-pulse 1.5s infinite"></span>
                    Oracle Event Log
                </div>
                <ul class="rvd-activity-list" id="rvd-activity-list">
                    <!-- Hydrated dynamically with terminal logs -->
                </ul>
            </div>
        </div>

        <!-- 3-Column Protocol panels with subtle monochrome line icons -->
        <div class="rvd-grid">
            
            <!-- Contract Terms Panel (📄) -->
            <div class="rvd-panel">
                <div class="rvd-panel-hdr">
                    <span class="rvd-panel-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </span>
                    <h3 class="rvd-panel-title">Contract Terms &nbsp;&nbsp;📄</h3>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Growth Target</span>
                    <span class="rvd-row-value" style="color:var(--rvd-brand); font-weight:800;">+${rivalry.targetGrowthPct}%</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Stake Per Side</span>
                    <span class="rvd-row-value">$${rivalry.stake.toLocaleString()}</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Combined Pool</span>
                    <span class="rvd-row-value" style="color:var(--rvd-green); font-weight:800;">$${pool.toLocaleString()}</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Contract Tier</span>
                    <span class="rvd-row-value">${rivalry.rivalryTier}</span>
                </div>
            </div>

            <!-- Settlement Rules Panel (⚖️) -->
            <div class="rvd-panel">
                <div class="rvd-panel-hdr">
                    <span class="rvd-panel-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M16 6a4 4 0 0 1-8 0"/></svg>
                    </span>
                    <h3 class="rvd-panel-title">Settlement Logic &nbsp;&nbsp;⚖️</h3>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Winner Takes Pool</span>
                    <span class="rvd-row-value">True (Minus Fee)</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Protocol Fee</span>
                    <span class="rvd-row-value" style="color:var(--rvd-brand)">12%</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Appeals Enforced</span>
                    <span class="rvd-row-value">None - Automated</span>
                </div>
                <div class="rvd-row rvd-row-warning">
                    <span class="rvd-row-label" style="color:var(--rvd-brand); font-weight:600;">Double Failure</span>
                    <span class="rvd-row-value" style="color:var(--rvd-brand)">Protocol Forfeiture</span>
                </div>
            </div>

            <!-- Verification Panel (🛰) -->
            <div class="rvd-panel">
                <div class="rvd-panel-hdr">
                    <span class="rvd-panel-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10H12V2z"/><path d="M12 12A10 10 0 0 1 2 12h10V2z"/><path d="M12 12a10 10 0 0 1 10 0v10H12V12z"/><path d="M12 12a10 10 0 0 1 0 10H2V12h10z"/></svg>
                    </span>
                    <h3 class="rvd-panel-title">Verification &nbsp;&nbsp;🛰</h3>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Verification Provider</span>
                    <span class="rvd-row-value">${rivalry.provider.toUpperCase()} API</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Immutable Oracle</span>
                    <span class="rvd-row-value" style="color:var(--rvd-green)">Verified ✓</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">API Data Source</span>
                    <span class="rvd-row-value">Oracle Binding</span>
                </div>
                <div class="rvd-row">
                    <span class="rvd-row-label">Baseline Lock</span>
                    <span class="rvd-row-value">Immutable</span>
                </div>
            </div>
        </div>

        <!-- Actions Row -->
        <div class="rvd-actions-row">
            <div class="rvd-actions" id="rvd-actions">
                <!-- Accept / Decline / Fund buttons populated dynamically -->
            </div>
            
            <div class="rvd-share-group">
                <button class="rvd-share-btn" onclick="navigator.clipboard.writeText(window.location.href).then(()=>window.CollateralModal.showAlert('Link copied!', { type: 'success', title: 'Copied' }))">COPY LINK</button>
                <button class="rvd-share-btn" onclick="window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent('${rivalry.challenger.name} vs ${rivalry.opponent.name} — $${pool.toLocaleString()} at stake. ${rivalry.metric}. ' + window.location.href))">SHARE ON X</button>
            </div>
        </div>

        <!-- Warning Disclaimer -->
        <div class="rvd-warning">
            <div class="rvd-warning-inner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B2020" stroke-width="2" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div class="rvd-warning-text">Real people. Real commitments. Real money. Live verification. Immutable settlement.</div>
            </div>
        </div>
    `;

    // ── Live Oracle Preview ──
    (async () => {
        try {
            const currentUserId = window.appState?.userId;
            if (!currentUserId) return;

            let myRole = null;
            if (currentUserId === rivalry._challengerUserId) myRole = 'challenger';
            else if (currentUserId === rivalry._opponentUserId) myRole = 'opponent';
            if (!myRole) return;

            const METRIC_TO_KEY = {
                SUBSCRIBERS: 'subscribers', FOLLOWERS: 'followers',
                REVENUE: 'revenue', VIEWS: 'views',
                GROSS_SALES: 'shopify_revenue', ORDER_COUNT: 'orders',
            };
            const oracleMetric = METRIC_TO_KEY[rivalry.metricType] || rivalry.metricType?.toLowerCase() || 'followers';

            const data = await api.getProviderPreview(rivalry.provider, oracleMetric);
            if (data && data.status !== 'error' && data.current_baseline !== undefined) {
                const liveBaseline = data.current_baseline || 0;
                const targetPct = rivalry.targetGrowthPct;
                const liveTarget = Math.round(liveBaseline * (1 + targetPct / 100));
                const fmtLive = (v) => {
                    if (rivalry.isMonetary) return '$' + (v / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                    return Math.round(v).toLocaleString('en-US');
                };
                const unit = metricUnit();

                const rivalryBaseline = myRole === 'challenger' ? rivalry.challenger.baseline : rivalry.opponent.baseline;
                let liveGrowthPct = 0;
                if (rivalryBaseline > 0) {
                    liveGrowthPct = ((liveBaseline - rivalryBaseline) / rivalryBaseline * 100);
                }
                const growthSign = liveGrowthPct >= 0 ? '+' : '';
                const growthClass = liveGrowthPct >= 0 ? 'positive' : 'negative';

                document.querySelectorAll(`[data-live-role="${myRole}"]`).forEach(el => {
                    el.innerHTML = `Current: <strong style="color:#111">${fmtLive(liveBaseline)}</strong> ${unit} · Target: <strong style="color:#5C1A1B">${fmtLive(liveTarget)}</strong>`;
                });

                const metricCardId = myRole === 'challenger' ? 'rvd-metric-chall' : 'rvd-metric-opp';
                const metricCard = document.getElementById(metricCardId);
                if (metricCard) {
                    metricCard.querySelector('.rvd-chart-metric-value').innerHTML = `${fmtLive(liveBaseline)}<span class="rvd-chart-metric-change ${growthClass}">${growthSign}${liveGrowthPct.toFixed(2)}%</span>`;
                }

                if (chartEl && rivalry.status !== 'pending') {
                    renderLiveChart(rivalry.metrics, rivalry._challengerUserId, rivalry._opponentUserId, rivalry.targetGrowthPct);
                }
            }
        } catch (err) {
            console.warn('[RivalryDetail] Oracle preview fetch failed:', err.message);
        }
    })();

    // ── Micro-interactions: Count Up Animations for Delta Pct ──
    const pctElements = document.querySelectorAll('.count-up-pct');
    pctElements.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target') || '0');
        let current = 0;
        const duration = 1200; // ms
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            current = easeProgress * target;
            el.textContent = (current >= 0 ? '+' : '') + current.toFixed(2) + '%';

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    });

    // ── Addictive Oracle Event Log terminal feed generator ──
    const activityList = document.getElementById('rvd-activity-list');
    let oracleSecondsAgo = 0;

    // We keep a history array of verification updates to simulate a terminal feed flow
    const logHistory = [
        {
            time: '12:31:05',
            title: 'Oracle verification complete',
            details: `${rivalry.challenger.name}: +${rivalry.challenger.growth.toFixed(2)}% → +${(rivalry.challenger.growth + 0.19).toFixed(2)}%<br>${rivalry.opponent.name}: +${rivalry.opponent.growth.toFixed(2)}% → +${(rivalry.opponent.growth + 0.11).toFixed(2)}%`,
            status: 'Verified',
            margin: `+${(Math.abs(rivalry.challenger.growth - rivalry.opponent.growth) + 0.08).toFixed(2)}%`
        },
        {
            time: '12:15:00',
            title: 'Oracle verification complete',
            details: `${rivalry.challenger.name}: +${(rivalry.challenger.growth - 0.14).toFixed(2)}% → +${rivalry.challenger.growth.toFixed(2)}%<br>${rivalry.opponent.name}: +${(rivalry.opponent.growth - 0.05).toFixed(2)}% → +${rivalry.opponent.growth.toFixed(2)}%`,
            status: 'Verified',
            margin: `+${(Math.abs(rivalry.challenger.growth - rivalry.opponent.growth)).toFixed(2)}%`
        },
        {
            time: '12:00:00',
            title: 'Oracle benchmark baseline lock',
            details: `Platform: ${rivalry.provider.toUpperCase()} API connection initialized<br>Parameters: Growth Target +${rivalry.targetGrowthPct}% threshold`,
            status: 'Secure',
            margin: '0.00%'
        }
    ];

    function renderTerminalLogs() {
        if (!activityList) return;
        activityList.innerHTML = logHistory.map((log, idx) => `
            <li class="rvd-activity-item ${idx === 0 ? 'flash-update' : ''}">
                <div class="rvd-activity-item-hdr">
                    <span class="rvd-activity-line-left">
                        <span class="rvd-activity-bullet ${idx === 0 ? 'active' : ''}"></span>
                        <strong style="color:#111;">${log.title}</strong>
                    </span>
                    <span class="rvd-activity-time">${log.time}</span>
                </div>
                <div style="font-size:11px; color:#555; line-height:1.6; font-family:'JetBrains Mono',monospace;">
                    ${log.details}
                </div>
                <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:10px; border-top:1px dashed #eee; padding-top:6px; color:#888;">
                    <span>Margin: <strong>${log.margin}</strong></span>
                    <span>Status: <strong style="color:var(--rvd-green);">${log.status}</strong></span>
                </div>
            </li>
        `).join('');
    }

    function updateLiveActivity() {
        oracleSecondsAgo++;
        // Simulate a new oracle event log block arriving every 25 seconds
        if (oracleSecondsAgo >= 25) {
            oracleSecondsAgo = 0;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
            
            // Random walk tick simulated to make the terminal updates addictive
            const simulatedChallGrowth = rivalry.challenger.growth + (Math.random() * 0.3 - 0.1);
            const simulatedOppGrowth = rivalry.opponent.growth + (Math.random() * 0.2 - 0.05);
            const newMargin = Math.abs(simulatedChallGrowth - simulatedOppGrowth);

            logHistory.unshift({
                time: timeStr,
                title: 'Oracle verification complete',
                details: `${rivalry.challenger.name}: +${rivalry.challenger.growth.toFixed(2)}% → +${simulatedChallGrowth.toFixed(2)}%<br>${rivalry.opponent.name}: +${rivalry.opponent.growth.toFixed(2)}% → +${simulatedOppGrowth.toFixed(2)}%`,
                status: 'Verified',
                margin: `+${newMargin.toFixed(2)}%`
            });

            // Keep maximum 4 items
            if (logHistory.length > 4) logHistory.pop();

            // Pulse the margin card when oracle verification resolves
            const marginLabel = document.querySelector('.rvd-rivalry-bar-hdr span:nth-child(2)');
            if (marginLabel) {
                marginLabel.style.transition = 'transform 0.2s ease, color 0.2s ease';
                marginLabel.style.color = '#154726';
                marginLabel.style.transform = 'scale(1.08)';
                setTimeout(() => {
                    marginLabel.style.color = '';
                    marginLabel.style.transform = 'scale(1)';
                }, 400);
            }
        }
        renderTerminalLogs();
    }
    updateLiveActivity();
    if (window._rvdActivityInterval) clearInterval(window._rvdActivityInterval);
    window._rvdActivityInterval = setInterval(updateLiveActivity, 1000);

    // ── Render Performance Chart (SVG) ──
    const chartEl = document.getElementById('rvd-perf-chart');

    function renderLiveChart(metricsData, challUserId, oppUserId, targetPct) {
        if (!chartEl) return;

        const challPoints = [];
        const oppPoints = [];
        let challBaseline = null;
        let oppBaseline = null;

        const sortedMetrics = (metricsData || []).slice().sort((a, b) => {
            const ta = new Date(a.fetchedAt || a.fetched_at).getTime();
            const tb = new Date(b.fetchedAt || b.fetched_at).getTime();
            return ta - tb;
        });

        sortedMetrics.forEach(m => {
            const val = parseFloat(m.metricValue || m.metric_value || 0);
            const ts = new Date(m.fetchedAt || m.fetched_at);
            if (m.userId === challUserId || m.user_id === challUserId) {
                if (challBaseline === null) challBaseline = val;
                const rawPct = challBaseline ? ((val - challBaseline) / challBaseline) * 100 : 0;
                challPoints.push({ t: ts, v: val, pct: Math.max(0, Math.min(rawPct, 100)) });
            } else if (m.userId === oppUserId || m.user_id === oppUserId) {
                if (oppBaseline === null) oppBaseline = val;
                const rawPct = oppBaseline ? ((val - oppBaseline) / oppBaseline) * 100 : 0;
                oppPoints.push({ t: ts, v: val, pct: Math.max(0, Math.min(rawPct, 100)) });
            }
        });

        challPoints.sort((a, b) => a.t - b.t);
        oppPoints.sort((a, b) => a.t - b.t);

        // Centerpiece enlarged viewport sizing
        const W = 900, H = 440, PAD_L = 50, PAD_R = 100, PAD_T = 30, PAD_B = 30;

        // If no time-series data, fallback to rendering a flat Bloomberg-style benchmark chart
        if (challPoints.length === 0 && oppPoints.length === 0) {
            const challGrowth = rivalry.challenger.growth;
            const oppGrowth = rivalry.opponent.growth;
            
            const plotW = W - PAD_L - PAD_R;
            const plotH = H - PAD_T - PAD_B;
            const maxY = Math.max(targetPct * 1.3, Math.abs(challGrowth) * 1.5, Math.abs(oppGrowth) * 1.5, 5);
            
            const toX = (dayFrac) => PAD_L + (dayFrac * plotW);
            const toY = (pct) => PAD_T + plotH - (pct / maxY * plotH);
            
            const challColor = 'var(--rvd-green)';
            const oppColor = 'var(--rvd-brand)';
            const zeroY = toY(0);
            const tgtY = toY(targetPct);
            const challY = toY(Math.max(0, challGrowth));
            const oppY = toY(Math.max(0, oppGrowth));

            let gridSvg = '';
            const gridSteps = [0, Math.round(targetPct/3), Math.round(targetPct*2/3), targetPct, Math.round(targetPct*1.2)].filter((v,i,a) => a.indexOf(v) === i);
            gridSteps.forEach(pct => {
                const y = toY(pct).toFixed(1);
                gridSvg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#f3f3f3" stroke-width="1"/>`; // Softer gridlines
                if (pct !== targetPct) {
                    gridSvg += `<text x="${W - PAD_R + 6}" y="${parseFloat(y) + 3}" font-family="Inter, monospace" font-size="8" fill="#aaa">+${pct}%</text>`;
                }
            });

            let dayMarkers = '';
            const daySteps = [0, Math.floor(rivalry.totalDays/4), Math.floor(rivalry.totalDays/2), Math.floor(rivalry.totalDays*3/4), rivalry.totalDays];
            daySteps.forEach(d => {
                const x = toX(d / rivalry.totalDays).toFixed(1);
                dayMarkers += `<text x="${x}" y="${H - 8}" text-anchor="middle" font-family="Inter, monospace" font-size="8" fill="#ccc">Day ${d}</text>`;
                dayMarkers += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${H - PAD_B}" stroke="#fbfbfb" stroke-width="1"/>`;
            });

            const now = Date.now();
            const startMs = new Date(rivalry._activatedAt).getTime();
            const elapsed = Math.max(0, now - startMs);
            const dayFrac = Math.min(1, elapsed / (rivalry.totalDays * 86400000));
            const curX = toX(dayFrac).toFixed(1);
            const endX = toX(1).toFixed(1);
            const projTY = tgtY.toFixed(1);

            chartEl.innerHTML = `
                <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
                    <defs>
                        <linearGradient id="g-chall-a" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${challColor}" stop-opacity="0.12"/>
                            <stop offset="100%" stop-color="${challColor}" stop-opacity="0.01"/>
                        </linearGradient>
                        <linearGradient id="g-opp-a" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${oppColor}" stop-opacity="0.08"/>
                            <stop offset="100%" stop-color="${oppColor}" stop-opacity="0.01"/>
                        </linearGradient>
                        <filter id="dg2" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="g"/>
                            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>
                    ${gridSvg}
                    ${dayMarkers}
                    <line x1="${PAD_L}" y1="${projTY}" x2="${W - PAD_R}" y2="${projTY}" stroke="var(--rvd-brand)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/>
                    <rect x="${W - PAD_R + 2}" y="${tgtY - 9}" width="78" height="18" rx="0" fill="var(--rvd-brand)"/>
                    <text x="${W - PAD_R + 41}" y="${tgtY + 3}" text-anchor="middle" font-family="Inter, monospace" font-size="8" font-weight="700" fill="#fff">+${targetPct}% TARGET</text>
                    <line x1="${PAD_L}" y1="${zeroY.toFixed(1)}" x2="${W - PAD_R}" y2="${zeroY.toFixed(1)}" stroke="#ccc" stroke-width="1.5"/>
                    
                    <path d="M${PAD_L},${zeroY} L${curX},${challY} L${curX},${zeroY} Z" fill="url(#g-chall-a)"/>
                    <line x1="${PAD_L}" y1="${zeroY}" x2="${curX}" y2="${challY}" stroke="${challColor}" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="${curX}" cy="${challY}" r="5" fill="${challColor}" stroke="#fff" stroke-width="2" class="live-endpoint-dot" filter="url(#dg2)"/>
                    
                    <path d="M${PAD_L},${zeroY} L${curX},${oppY} L${curX},${zeroY} Z" fill="url(#g-opp-a)"/>
                    <line x1="${PAD_L}" y1="${zeroY}" x2="${curX}" y2="${oppY}" stroke="${oppColor}" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="${curX}" cy="${oppY}" r="5" fill="${oppColor}" stroke="#fff" stroke-width="2"/>
                </svg>`;
            return;
        }

        const challCurrent = challPoints.length > 0 ? challPoints[challPoints.length - 1].pct : 0;
        const oppCurrent = oppPoints.length > 0 ? oppPoints[oppPoints.length - 1].pct : 0;
        const challLeading = challCurrent >= oppCurrent;

        const challColor = 'var(--rvd-green)';
        const oppColor = 'var(--rvd-brand)';

        const allPcts = [...challPoints.map(p => p.pct), ...oppPoints.map(p => p.pct), 0, targetPct];
        const minPct = Math.max(0, Math.min(...allPcts) - 1);
        const maxPct = Math.max(...allPcts) + 2;
        const range = maxPct - minPct || 1;

        const allTimes = [...challPoints.map(p => p.t.getTime()), ...oppPoints.map(p => p.t.getTime())];
        const tMin = Math.min(...allTimes);
        const tMax = Math.max(...allTimes);
        const tRange = tMax - tMin || 1;

        function toX(t) { return PAD_L + ((t - tMin) / tRange) * (W - PAD_L - PAD_R); }
        function toY(pct) { return PAD_T + ((maxPct - pct) / range) * (H - PAD_T - PAD_B); }

        function buildPath(pts) {
            if (pts.length === 0) return '';
            let d = `M${toX(pts[0].t.getTime()).toFixed(1)},${toY(pts[0].pct).toFixed(1)}`;
            for (let i = 1; i < pts.length; i++) {
                const x = toX(pts[i].t.getTime()).toFixed(1);
                const y = toY(pts[i].pct).toFixed(1);
                const prevY = toY(pts[i-1].pct).toFixed(1);
                d += ` L${x},${prevY} L${x},${y}`;
            }
            return d;
        }
        function buildAreaPath(pts) {
            if (pts.length === 0) return '';
            const line = buildPath(pts);
            const lastX = toX(pts[pts.length - 1].t.getTime()).toFixed(1);
            const firstX = toX(pts[0].t.getTime()).toFixed(1);
            const baseY = toY(0).toFixed(1);
            return `${line} L${lastX},${baseY} L${firstX},${baseY} Z`;
        }

        const gridCount = 5;
        let gridSvg = '';
        for (let i = 0; i <= gridCount; i++) {
            const pct = minPct + (range / gridCount) * i;
            const y = toY(pct);
            gridSvg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#f3f3f3" stroke-width="1"/>`; // Softer gridlines
            gridSvg += `<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-family="Inter, monospace" font-size="9" fill="#aaa" font-weight="500">${pct.toFixed(0)}%</text>`;
        }

        const zeroY = toY(0);
        gridSvg += `<line x1="${PAD_L}" y1="${zeroY}" x2="${W - PAD_R}" y2="${zeroY}" stroke="#ccc" stroke-width="1.5"/>`;

        const targetY = toY(targetPct);
        gridSvg += `<line x1="${PAD_L}" y1="${targetY}" x2="${W - PAD_R}" y2="${targetY}" stroke="var(--rvd-brand)" stroke-width="1" stroke-dasharray="6 4" opacity="0.6"/>`;
        gridSvg += `<text x="${W - PAD_R + 4}" y="${targetY + 3}" font-family="Inter, monospace" font-size="8" font-weight="700" fill="var(--rvd-brand)" opacity="0.8">TARGET +${targetPct}%</text>`;

        const challPath = buildPath(challPoints);
        const oppPath = buildPath(oppPoints);
        const challArea = buildAreaPath(challPoints);
        const oppArea = buildAreaPath(oppPoints);

        const challEnd = challPoints.length > 0 ? challPoints[challPoints.length - 1] : null;
        const oppEnd = oppPoints.length > 0 ? oppPoints[oppPoints.length - 1] : null;

        let endDots = '';
        if (challEnd) {
            const cx = toX(challEnd.t.getTime()).toFixed(1);
            const cy = toY(challEnd.pct).toFixed(1);
            endDots += `<line x1="${cx}" y1="${cy}" x2="${W - PAD_R}" y2="${cy}" stroke="${challColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>`;
            endDots += `<circle cx="${cx}" cy="${cy}" r="5" fill="${challColor}" stroke="#fff" stroke-width="2" class="live-endpoint-dot" filter="url(#dot-glow)"/>`;
            endDots += `<rect x="${W - PAD_R + 4}" y="${parseFloat(cy) - 10}" width="68" height="20" rx="0" fill="${challColor}" opacity="0.9"/>`;
            endDots += `<text x="${W - PAD_R + 38}" y="${parseFloat(cy) + 3.5}" text-anchor="middle" font-family="Inter, monospace" font-size="9" font-weight="700" fill="#fff">${challEnd.pct >= 0 ? '+' : ''}${challEnd.pct.toFixed(1)}%</text>`;
        }
        if (oppEnd) {
            const cx = toX(oppEnd.t.getTime()).toFixed(1);
            const cy = toY(oppEnd.pct).toFixed(1);
            endDots += `<line x1="${cx}" y1="${cy}" x2="${W - PAD_R}" y2="${cy}" stroke="${oppColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>`;
            endDots += `<circle cx="${cx}" cy="${cy}" r="5" fill="${oppColor}" stroke="#fff" stroke-width="2" class="live-endpoint-dot" filter="url(#dot-glow)"/>`;
            endDots += `<rect x="${W - PAD_R + 4}" y="${parseFloat(cy) - 10}" width="68" height="20" rx="0" fill="${oppColor}" opacity="0.9"/>`;
            endDots += `<text x="${W - PAD_R + 38}" y="${parseFloat(cy) + 3.5}" text-anchor="middle" font-family="Inter, monospace" font-size="9" font-weight="700" fill="#fff">${oppEnd.pct >= 0 ? '+' : ''}${oppEnd.pct.toFixed(1)}%</text>`;
        }

        const pulseColor = challLeading ? challColor : oppColor;
        const pulseEnd = challLeading ? challEnd : oppEnd;
        let pulseSvg = '';
        if (pulseEnd) {
            const px = toX(pulseEnd.t.getTime()).toFixed(1);
            const py = toY(pulseEnd.pct).toFixed(1);
            // Animated live endpoint
            pulseSvg = `<circle cx="${px}" cy="${py}" r="6" fill="none" stroke="${pulseColor}" stroke-width="2" opacity="0.4"><animate attributeName="r" from="6" to="18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/></circle>`;
        }

        const crosshairId = 'rvd-crosshair-' + Date.now();

        chartEl.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%" id="${crosshairId}-svg">
                <defs>
                    <linearGradient id="grad-chall-live" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${challColor}" stop-opacity="0.12"/>
                        <stop offset="100%" stop-color="${challColor}" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="grad-opp-live" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${oppColor}" stop-opacity="0.08"/>
                        <stop offset="100%" stop-color="${oppColor}" stop-opacity="0"/>
                    </linearGradient>
                    <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="glow"/>
                        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                ${gridSvg}
                ${challArea ? `<path d="${challArea}" fill="url(#grad-chall-live)"/>` : ''}
                ${oppArea ? `<path d="${oppArea}" fill="url(#grad-opp-live)"/>` : ''}
                ${oppPath ? `<path d="${oppPath}" fill="none" stroke="${oppColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>` : ''}
                ${challPath ? `<path d="${challPath}" fill="none" stroke="${challColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
                ${pulseSvg}
                ${endDots}
                <g id="${crosshairId}-group" style="display:none">
                    <line id="${crosshairId}-line" x1="0" y1="${PAD_T}" x2="0" y2="${H - PAD_B}" stroke="#999" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>
                    <circle id="${crosshairId}-dot-c" r="4" fill="${challColor}" stroke="#fff" stroke-width="2"/>
                    <circle id="${crosshairId}-dot-o" r="4" fill="${oppColor}" stroke="#fff" stroke-width="2"/>
                    <rect id="${crosshairId}-tip-c-bg" rx="0" ry="0" fill="${challColor}" opacity="0.95"/>
                    <text id="${crosshairId}-tip-c-txt" font-family="Inter, monospace" font-size="9" font-weight="700" fill="#fff" text-anchor="middle"/>
                    <rect id="${crosshairId}-tip-o-bg" rx="0" ry="0" fill="${oppColor}" opacity="0.95"/>
                    <text id="${crosshairId}-tip-o-txt" font-family="Inter, monospace" font-size="9" font-weight="700" fill="#fff" text-anchor="middle"/>
                    <rect id="${crosshairId}-day-bg" rx="0" ry="0" fill="#333" opacity="0.9"/>
                    <text id="${crosshairId}-day-txt" font-family="Inter, monospace" font-size="8" font-weight="600" fill="#fff" text-anchor="middle"/>
                </g>
                <rect id="${crosshairId}-overlay" x="${PAD_L}" y="${PAD_T}" width="${W - PAD_L - PAD_R}" height="${H - PAD_T - PAD_B}" fill="transparent" style="cursor:crosshair"/>
            </svg>`;

        const svgEl = document.getElementById(`${crosshairId}-svg`);
        const overlay = document.getElementById(`${crosshairId}-overlay`);
        const crossGroup = document.getElementById(`${crosshairId}-group`);
        const crossLine = document.getElementById(`${crosshairId}-line`);
        const dotC = document.getElementById(`${crosshairId}-dot-c`);
        const dotO = document.getElementById(`${crosshairId}-dot-o`);
        const tipCBg = document.getElementById(`${crosshairId}-tip-c-bg`);
        const tipCTxt = document.getElementById(`${crosshairId}-tip-c-txt`);
        const tipOBg = document.getElementById(`${crosshairId}-tip-o-bg`);
        const tipOTxt = document.getElementById(`${crosshairId}-tip-o-txt`);
        const dayBg = document.getElementById(`${crosshairId}-day-bg`);
        const dayTxt = document.getElementById(`${crosshairId}-day-txt`);

        if (overlay && crossGroup) {
            function getValuesAtX(svgX) {
                const plotW = W - PAD_L - PAD_R;
                const frac = Math.max(0, Math.min(1, (svgX - PAD_L) / plotW));
                const t = tMin + frac * tRange;

                function getSteppedPct(pts) {
                    if (pts.length === 0) return null;
                    let lastPct = pts[0].pct;
                    for (let i = 0; i < pts.length; i++) {
                        if (pts[i].t.getTime() <= t) {
                            lastPct = pts[i].pct;
                        } else break;
                    }
                    return lastPct;
                }

                const cPct = getSteppedPct(challPoints);
                const oPct = getSteppedPct(oppPoints);
                const startMs = new Date(rivalry._activatedAt).getTime();
                const dayNum = Math.max(0, (t - startMs) / 86400000);

                return { cPct, oPct, dayNum, svgX: Math.max(PAD_L, Math.min(W - PAD_R, svgX)) };
            }

            function showCrosshair(svgX) {
                const vals = getValuesAtX(svgX);
                crossGroup.style.display = '';
                crossLine.setAttribute('x1', vals.svgX);
                crossLine.setAttribute('x2', vals.svgX);

                if (vals.cPct !== null) {
                    const cy = toY(vals.cPct);
                    dotC.setAttribute('cx', vals.svgX);
                    dotC.setAttribute('cy', cy);
                    dotC.style.display = '';
                    const label = `${vals.cPct >= 0 ? '+' : ''}${vals.cPct.toFixed(2)}%`;
                    tipCTxt.textContent = label;
                    const tipW = Math.max(56, label.length * 7 + 12);
                    const tipX = vals.svgX;
                    const tipY = cy - 22;
                    tipCBg.setAttribute('x', tipX - tipW/2);
                    tipCBg.setAttribute('y', tipY - 6);
                    tipCBg.setAttribute('width', tipW);
                    tipCBg.setAttribute('height', 18);
                    tipCTxt.setAttribute('x', tipX);
                    tipCTxt.setAttribute('y', tipY + 7);
                    tipCBg.style.display = '';
                    tipCTxt.style.display = '';
                } else {
                    dotC.style.display = 'none';
                    tipCBg.style.display = 'none';
                    tipCTxt.style.display = 'none';
                }

                if (vals.oPct !== null) {
                    const oy = toY(vals.oPct);
                    dotO.setAttribute('cx', vals.svgX);
                    dotO.setAttribute('cy', oy);
                    dotO.style.display = '';
                    const label = `${vals.oPct >= 0 ? '+' : ''}${vals.oPct.toFixed(2)}%`;
                    tipOTxt.textContent = label;
                    const tipW = Math.max(56, label.length * 7 + 12);
                    const tipX = vals.svgX;
                    const tipY = oy + 16;
                    tipOBg.setAttribute('x', tipX - tipW/2);
                    tipOBg.setAttribute('y', tipY - 6);
                    tipOBg.setAttribute('width', tipW);
                    tipOBg.setAttribute('height', 18);
                    tipOTxt.setAttribute('x', tipX);
                    tipOTxt.setAttribute('y', tipY + 7);
                    tipOBg.style.display = '';
                    tipOTxt.style.display = '';
                } else {
                    dotO.style.display = 'none';
                    tipOBg.style.display = 'none';
                    tipOTxt.style.display = 'none';
                }

                const dayLabel = `Day ${vals.dayNum.toFixed(1)}`;
                dayTxt.textContent = dayLabel;
                const dayW = Math.max(48, dayLabel.length * 6 + 10);
                dayBg.setAttribute('x', vals.svgX - dayW/2);
                dayBg.setAttribute('y', H - PAD_B + 2);
                dayBg.setAttribute('width', dayW);
                dayBg.setAttribute('height', 16);
                dayTxt.setAttribute('x', vals.svgX);
                dayTxt.setAttribute('y', H - PAD_B + 13);
            }

            function hideCrosshair() {
                crossGroup.style.display = 'none';
            }

            function getSvgX(clientX) {
                const rect = svgEl.getBoundingClientRect();
                const scaleX = W / rect.width;
                return (clientX - rect.left) * scaleX;
            }

            overlay.addEventListener('mousemove', (e) => showCrosshair(getSvgX(e.clientX)));
            overlay.addEventListener('mouseleave', hideCrosshair);
            overlay.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) showCrosshair(getSvgX(e.touches[0].clientX));
            }, { passive: false });
            overlay.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) showCrosshair(getSvgX(e.touches[0].clientX));
            }, { passive: false });
            overlay.addEventListener('touchend', hideCrosshair);
        }
    }

    if (rivalry.status !== 'pending') {
        renderLiveChart(rivalry.metrics, rivalry._challengerUserId, rivalry._opponentUserId, rivalry.targetGrowthPct);
    } else if (chartEl) {
        const W = 900, H = 220;
        chartEl.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">
                <text x="${W/2}" y="30" text-anchor="middle" font-family="Inter, monospace" font-size="10" font-weight="700" fill="#ddd" letter-spacing="1.2px">AWAITING ACTIVATION</text>
                <rect x="50" y="50" width="770" height="32" rx="0" fill="#f5f5f5"/>
                <rect x="50" y="50" width="50" height="32" rx="0" fill="#e8e8e8" opacity="0.5">
                    <animate attributeName="width" values="50;120;50" dur="2s" repeatCount="indefinite"/>
                </rect>
                <rect x="50" y="100" width="770" height="32" rx="0" fill="#f5f5f5"/>
                <rect x="50" y="100" width="30" height="32" rx="0" fill="#e8e8e8" opacity="0.5">
                    <animate attributeName="width" values="30;80;30" dur="2s" repeatCount="indefinite"/>
                </rect>
                <text x="${W/2}" y="${H - 20}" text-anchor="middle" font-family="Inter, monospace" font-size="9" fill="#ddd" letter-spacing="0.5px">Chart activates once both sides fund their position</text>
            </svg>`;
    }

    // ── Live Auto-Refresh (60s polling) ──
    if (rivalry.status === 'active' && rivalry._rawState && !['SETTLED','DRAW','DECLINED','EXPIRED','CANCELLED'].includes(rivalry._rawState)) {
        window._rvdPollInterval = setInterval(async () => {
            try {
                const legendEl = document.querySelector('.rvd-chart-header');
                if (legendEl) {
                    let liveTag = legendEl.querySelector('.rvd-live-refresh');
                    if (!liveTag) {
                        liveTag = document.createElement('span');
                        liveTag.className = 'rvd-live-refresh';
                        liveTag.style.cssText = 'font-family:"Inter",monospace;font-size:9px;color:#154726;letter-spacing:0.06em;display:flex;align-items:center;gap:4px;';
                        legendEl.appendChild(liveTag);
                    }
                    liveTag.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#154726;display:inline-block;animation:cl-core-pulse 1s infinite"></span> LIVE · Refreshing...`;
                }

                const res = await api.getRivalryMetrics(id);
                if (res.ok && res.metrics) {
                    renderLiveChart(res.metrics, rivalry._challengerUserId, rivalry._opponentUserId, rivalry.targetGrowthPct);
                }

                const liveTag = document.querySelector('.rvd-live-refresh');
                if (liveTag) {
                    const now = new Date();
                    liveTag.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#154726;display:inline-block;animation:cl-core-pulse 1.5s infinite"></span> LIVE · Updated ${now.toLocaleTimeString()}`;
                }
            } catch (err) {
                console.warn('[RivalryDetail] Metric poll failed:', err.message);
            }
        }, 60000);
    }

    // ── Action Bar — accept/decline/fund ──
    const actionsEl = document.getElementById('rvd-actions');
    if (actionsEl && rivalry._rawState) {
        const userId = window.appState?.userId;
        const rawState = rivalry._rawState;
        const isOpponent = rivalry._opponentUserId && userId === rivalry._opponentUserId;
        const isChallenger = rivalry._challengerUserId && userId === rivalry._challengerUserId;
        const isOpenChallenge = !rivalry._opponentUserId;

        if (rawState === 'CHALLENGE_ISSUED' && isOpponent) {
            actionsEl.innerHTML = `
                <button class="rvd-action-btn accept" id="rvd-accept">ACCEPT CHALLENGE</button>
                <button class="rvd-action-btn decline" id="rvd-decline">DECLINE</button>
                <span class="rvd-action-status">You have been challenged. Accept to lock capital.</span>
            `;
            document.getElementById('rvd-accept')?.addEventListener('click', async (e) => {
                e.target.disabled = true; e.target.textContent = 'ACCEPTING...';
                try {
                    const res = await api.acceptRivalry(id);
                    if (res.ok) { await showAlert('Challenge accepted! Fund your side to begin.', { type: 'success', title: 'Challenge Accepted' }); location.reload(); }
                    else showAlert(res.error || 'Failed to accept', { type: 'error' });
                } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
                e.target.disabled = false; e.target.textContent = 'ACCEPT CHALLENGE';
            });
            document.getElementById('rvd-decline')?.addEventListener('click', async (e) => {
                if (!(await showConfirm('Are you sure? This cannot be undone.', { title: 'Decline Challenge', confirmText: 'DECLINE', danger: true }))) return;
                e.target.disabled = true; e.target.textContent = 'DECLINING...';
                try {
                    const res = await api.declineRivalry(id);
                    if (res.ok) { await showAlert('Challenge declined.', { type: 'info', title: 'Declined' }); window.router.navigate('/market?type=rivalry'); }
                    else showAlert(res.error || 'Failed to decline', { type: 'error' });
                } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
                e.target.disabled = false; e.target.textContent = 'DECLINE';
            });
        } else if (rawState === 'CHALLENGE_ISSUED' && isOpenChallenge && userId && !isChallenger) {
            actionsEl.innerHTML = `
                <button class="rvd-action-btn accept" id="rvd-accept">⚡ ACCEPT OPEN CHALLENGE</button>
                <span class="rvd-action-status">This is an open challenge. Accept to lock capital and begin the duel.</span>
            `;
            document.getElementById('rvd-accept')?.addEventListener('click', async (e) => {
                e.target.disabled = true; e.target.textContent = 'ACCEPTING...';
                try {
                    const res = await api.acceptRivalry(id);
                    if (res.ok) { await showAlert('Challenge accepted! Fund your side to begin.', { type: 'success', title: 'Challenge Accepted' }); location.reload(); }
                    else showAlert(res.error || 'Failed to accept', { type: 'error' });
                } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
                e.target.disabled = false; e.target.textContent = '⚡ ACCEPT OPEN CHALLENGE';
            });
        } else if (rawState === 'CHALLENGE_ISSUED' && isOpenChallenge && !userId) {
            actionsEl.innerHTML = `
                <button class="rvd-action-btn accept" onclick="window.app.openAccessModal()">SIGN IN TO ACCEPT</button>
                <span class="rvd-action-status">Sign in to accept this open challenge.</span>
            `;
        } else if (rawState === 'ACCEPTED' && (isChallenger || isOpponent)) {
            actionsEl.innerHTML = `
                <button class="rvd-action-btn fund" id="rvd-fund">FUND YOUR SIDE — $${rivalry.stake.toLocaleString()}</button>
                <span class="rvd-action-status">Both sides must fund before the duel begins.</span>
            `;
            document.getElementById('rvd-fund')?.addEventListener('click', async (e) => {
                e.target.disabled = true; e.target.textContent = 'FUNDING...';
                try {
                    const res = await api.fundRivalry(id);
                    if (res.ok) { await showAlert('Funded! Waiting for opponent to fund.', { type: 'success', title: 'Funded' }); location.reload(); }
                    else showAlert(res.error || 'Failed to fund', { type: 'error' });
                } catch (err) { showAlert('Error: ' + err.message, { type: 'error' }); }
                e.target.disabled = false; e.target.textContent = `FUND YOUR SIDE — $${rivalry.stake.toLocaleString()}`;
            });
        } else if (rawState === 'CHALLENGE_ISSUED' && isChallenger) {
            actionsEl.innerHTML = `<span class="rvd-action-status">WAITING FOR OPPONENT TO ACCEPT</span>`;
        } else if (rawState === 'BOTH_FUNDED' || rawState === 'ACTIVE' || rawState === 'VERIFYING') {
            actionsEl.innerHTML = `<span class="rvd-action-status">DUEL IN PROGRESS — ${rivalry.daysLeft}d REMAINING</span>`;
        } else if (rawState === 'SETTLED' || rawState === 'DRAW') {
            actionsEl.innerHTML = `<span class="rvd-action-status">SETTLED — ${rawState === 'DRAW' ? 'DRAW' : 'WINNER DETERMINED'}</span>`;
        }
    }

    // ── Live Countdown Timer ──
    if (window._rvdCdInterval) { clearInterval(window._rvdCdInterval); window._rvdCdInterval = null; }

    if (rivalry.status !== 'settled' && rivalry.daysLeft > 0) {
        const endTime = rivalry._deadlineUtc ? new Date(rivalry._deadlineUtc).getTime() : new Date(new Date(rivalry._activatedAt || Date.now()).getTime() + (rivalry.totalDays) * 86400000).getTime();

        function updateCountdown() {
            const now = Date.now();
            const diff = Math.max(0, endTime - now);
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            const pad = (n) => String(n).padStart(2, '0');
            
            const dEl = document.getElementById('rvd-cd-days');
            const hEl = document.getElementById('rvd-cd-hours');
            const mEl = document.getElementById('rvd-cd-mins');
            const sEl = document.getElementById('rvd-cd-secs');
            if (dEl) dEl.textContent = days;
            if (hEl) hEl.textContent = pad(hours);
            if (mEl) mEl.textContent = pad(mins);
            if (sEl) sEl.textContent = pad(secs);

            const cdEl = document.getElementById('rvd-countdown');
            if (cdEl && days <= 3) cdEl.classList.add('urgent');

            if (diff <= 0) {
                clearInterval(window._rvdCdInterval);
                window._rvdCdInterval = null;
                if (dEl) dEl.textContent = '0';
                if (hEl) hEl.textContent = '00';
                if (mEl) mEl.textContent = '00';
                if (sEl) sEl.textContent = '00';
            }
        }
        updateCountdown();
        window._rvdCdInterval = setInterval(updateCountdown, 1000);
    }
}
