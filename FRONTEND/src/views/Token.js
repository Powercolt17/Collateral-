import { PROTOCOL_METRICS } from '../constants/protocolMetrics.js';
// Token view — CLTR Institutional Control Portal
// Fully integrated with Reown AppKit & Viem on Robinhood Chain

import { wagmiAdapter, modal } from '../web3.js';
import { 
    getAccount, 
    watchAccount, 
    disconnect, 
    switchChain, 
    readContract, 
    writeContract, 
    simulateContract,
    waitForTransactionReceipt
} from '@wagmi/core';
import { formatUnits, parseUnits } from 'viem';

const cleanAddress = (addr) => (addr || '').replace(/['"]/g, '').trim();

const CLTR_TOKEN_ADDRESS = cleanAddress(import.meta.env.VITE_CLTR_TOKEN) || '0x7b69C7E57d7004EB2374E5Aabb9db5334aE73B9f';
const STAKING_ADDRESS = cleanAddress(import.meta.env.VITE_STAKING) || '0x6A95484e05dD7139C7A4De192dd2f26A2a91F69e';
const FOUNDER_VESTING_ADDRESS = cleanAddress(import.meta.env.VITE_FOUNDER_VESTING) || '0xc416547c5a9dE39A5E489d04a3dfa1C043E8f026';
const TEAM_VESTING_ADDRESS = cleanAddress(import.meta.env.VITE_TEAM_VESTING) || '0x05A67f5d26F3561C94E9e32A9F36fb483b51dB59';
const SETTLEMENT_ADDRESS = cleanAddress(import.meta.env.VITE_SETTLEMENT) || '0x6A95484e05dD7139C7A4De192dd2f26A2a91F69e';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// ABIs
const ERC20_ABI = [
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }
];

const STAKING_ABI = [
    { name: 'stake', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'duration', type: 'uint256' }], outputs: [] },
    { name: 'unstake', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'index', type: 'uint256' }], outputs: [] },
    { name: 'getStakesOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{
        name: '', type: 'tuple[]', components: [
            { name: 'amount', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'yield', type: 'uint256' },
            { name: 'durationDays', type: 'uint256' },
            { name: 'apy', type: 'uint256' },
            { name: 'active', type: 'bool' }
        ]
    }] }
];

const VESTING_ABI = [
    { name: 'vestedAmount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'released', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'release', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] }
];

export function renderToken() {
    return `
        <style>
            @keyframes panelReveal {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .cltr-page {
                background: var(--paper, #F7F4ED);
                min-height: 100vh;
                font-family: var(--font-content), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #111111;
                padding-bottom: 120px;
            }

            .cltr-container {
                max-width: 1240px;
                margin: 0 auto;
                padding: 128px 32px 0;
            }

            /* --- TOP BRAND HEADER --- */
            .cltr-header-group {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(70,55,35,.22);
                padding-bottom: 24px;
                margin-bottom: 32px;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .cltr-header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .cltr-logo-svg {
                width: 48px;
                height: 48px;
                color: #7A1C29;
                fill: currentColor;
            }
            .cltr-title-text {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.8px;
                color: #111;
                margin: 0;
                text-transform: uppercase;
                line-height: 1.1;
            }
            .cltr-title-desc {
                font-size: 11px;
                color: #666;
                font-family: var(--font-data);
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-top: 6px;
            }

            /* --- WEB3 WALLET BAR --- */
            w3m-modal, w3m-connect-button, w3m-account-button {
                --w3m-watermark-display: none !important;
            }
            .cltr-wallet-banner {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 18px 24px;
                margin-bottom: 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .cltr-wallet-banner.connected {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 24px;
            }
            .cltr-wallet-status {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .cltr-status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #D82224;
            }
            .cltr-status-indicator.connected {
                background: #10B981;
                animation: pulseIndicator 2.5s infinite;
            }
            @keyframes pulseIndicator {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
            }
            .cltr-status-lbl {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .cltr-wallet-hash {
                color: #888;
                font-weight: 500;
                margin-left: 8px;
                font-size: 11px;
                background: #F5F5F5;
                padding: 2px 6px;
                border-radius: 2px;
            }
            .cltr-connect-btn {
                background: #0E1420;
                color: #FFFFFF;
                border: none;
                padding: 10px 18px;
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                cursor: pointer;
                border-radius: 3px;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .cltr-connect-btn:hover {
                background: #7A1C29;
            }
            .cltr-connect-btn.connected {
                background: transparent;
                border: 1px solid rgba(70,55,35,.22);
                color: #555;
            }
            .cltr-connect-btn.connected:hover {
                border-color: #D82224;
                color: #D82224;
                background: rgba(216, 34, 36, 0.02);
            }

            /* ===================================================
               DOMINANT FOCAL POINT
               =================================================== */
            .cltr-focal-hero {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 40px;
                margin-bottom: 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 40px;
                position: relative;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
                box-shadow: 0 4px 24px rgba(92, 20, 20, 0.02);
            }
            .cltr-focal-hero::before {
                content: '';
                position: absolute;
                left: 0; top: 0; bottom: 0;
                width: 5px;
                background: #7A1C29;
            }
            .cltr-focal-left {
                flex: 1;
            }
            .cltr-focal-lbl {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #7A1C29;
                margin-bottom: 12px;
            }
            .cltr-focal-num {
                font-family: var(--font-data);
                font-size: 54px;
                font-weight: 800;
                letter-spacing: -2px;
                color: #111111;
                line-height: 1;
            }
            .cltr-focal-sub {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
            }
            .cltr-focal-right {
                display: flex;
                gap: 48px;
            }
            .cltr-focal-mini-card {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .cltr-focal-mini-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #888;
            }
            .cltr-focal-mini-num {
                font-family: var(--font-data);
                font-size: 20px;
                font-weight: 700;
                color: #111;
            }

            /* ===================================================
               METRICS & STATS GRID
               =================================================== */
            .cltr-metrics-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 32px;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
            }
            .cltr-metric-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 24px;
                transition: border-color 0.2s;
            }
            .cltr-metric-card:hover {
                border-color: rgba(92, 20, 20, 0.2);
            }
            .cltr-metric-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #888;
                margin-bottom: 8px;
                display: block;
            }
            .cltr-metric-val {
                font-family: var(--font-data);
                font-size: 20px;
                font-weight: 700;
                color: #111;
                line-height: 1;
            }
            .cltr-metric-sub {
                font-size: 10px;
                color: #666;
                margin-top: 6px;
                display: block;
            }

            /* --- TWO COLUMN MAIN LAYOUT --- */
            .cltr-main-grid {
                display: grid;
                grid-template-columns: 1.3fr 1fr;
                gap: 32px;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
            }

            /* ===================================================
               PANEL & CARD SYSTEM
               =================================================== */
            .cltr-panel {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 32px;
                margin-bottom: 32px;
                position: relative;
            }
            .cltr-panel-hdr {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 24px;
                border-bottom: 1px solid #F0F0F0;
                padding-bottom: 16px;
            }
            .cltr-panel-title {
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #111111;
            }

            /* --- STAKING TERMINAL --- */
            .cltr-stake-wrap {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .cltr-field-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .cltr-field-lbl-row {
                display: flex;
                justify-content: space-between;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #888;
            }
            .cltr-max-trigger {
                cursor: pointer;
                color: #7A1C29;
                text-decoration: underline;
            }
            .cltr-input-container {
                position: relative;
            }
            .cltr-input-field {
                width: 100%;
                padding: 16px;
                padding-right: 80px;
                border: 1px solid rgba(70,55,35,.22);
                background: #FAF4E6;
                font-family: var(--font-data);
                font-size: 18px;
                font-weight: 700;
                color: #111;
                outline: none;
                box-sizing: border-box;
                border-radius: 4px;
                transition: all 0.15s ease;
            }
            .cltr-input-field:focus:not(:disabled) {
                border-color: #7A1C29;
                background: var(--plate, #FFFDF9);
                box-shadow: 0 0 0 3px rgba(92, 20, 20, 0.04);
            }
            .cltr-input-field:disabled {
                background: #F8F8F8 !important;
                color: #888 !important;
                border-color: rgba(70,55,35,.22) !important;
                cursor: not-allowed;
                opacity: 1;
                -webkit-text-fill-color: #888;
            }
            .cltr-input-field::placeholder {
                color: #bbb;
                font-weight: 400;
            }
            .cltr-input-field:disabled::placeholder {
                color: #ccc;
            }
            .cltr-input-token {
                position: absolute;
                right: 18px;
                top: 50%;
                transform: translateY(-50%);
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                color: #888;
                pointer-events: none;
            }

            /* Lock Pills Grid */
            .cltr-lock-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }
            .cltr-lock-pill {
                border: 1px solid rgba(70,55,35,.22);
                background: var(--plate, #FFFDF9);
                padding: 14px 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                border-radius: 4px;
                outline: none;
            }
            .cltr-lock-pill:hover:not(:disabled) {
                border-color: #7A1C29;
            }
            .cltr-lock-pill.active {
                background: #0E1420;
                border-color: #111111;
                color: #FFFFFF;
            }
            .cltr-lock-days {
                font-size: 13px;
                font-weight: 700;
                display: block;
                margin-bottom: 2px;
            }
            .cltr-lock-yield {
                font-family: var(--font-data);
                font-size: 8px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.85;
            }

            /* Staking summary */
            .cltr-calc-summary {
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 18px 20px;
                font-family: var(--font-data);
                font-size: 11px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .cltr-calc-row {
                display: flex;
                justify-content: space-between;
                color: #666;
            }
            .cltr-calc-row strong {
                color: #111;
            }
            .cltr-calc-row.accent strong {
                color: #7A1C29;
                font-size: 12px;
            }

            /* Action Button */
            .cltr-action-submit {
                width: 100%;
                padding: 16px;
                background: #7A1C29;
                color: #FFFFFF;
                border: none;
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.2s ease;
                border-radius: 4px;
            }
            .cltr-action-submit:hover:not(:disabled) {
                background: #4A1010;
            }
            .cltr-action-submit:disabled {
                background: rgba(70,55,35,.22);
                color: #999;
                cursor: not-allowed;
            }

            /* ===================================================
               BURN VISUALIZATION
               =================================================== */
            .cltr-burn-visualizer {
                display: flex;
                flex-direction: column;
                gap: 20px;
                margin-top: 8px;
            }
            .cltr-chart-container {
                height: 100px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                position: relative;
                display: flex;
                align-items: flex-end;
            }
            .cltr-chart-svg {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0; left: 0;
            }
            .cltr-chart-grid {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: absolute;
                pointer-events: none;
            }
            .cltr-chart-grid-line {
                width: 100%;
                height: 1px;
                background: #F0F0F0;
            }
            .cltr-burn-period-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
            }
            .cltr-burn-period-card {
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 12px 14px;
            }
            .cltr-burn-period-lbl {
                font-family: var(--font-data);
                font-size: 8px;
                color: #888;
                text-transform: uppercase;
                display: block;
                margin-bottom: 4px;
            }
            .cltr-burn-period-num {
                font-family: var(--font-data);
                font-size: 12px;
                font-weight: 700;
                color: #111;
            }

            /* ===================================================
               IDENTITY / REPUTATION LAYER
               =================================================== */
            .cltr-rep-layout {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 20px;
            }
            .cltr-rep-stat {
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .cltr-rep-lbl {
                font-family: var(--font-data);
                font-size: 8px;
                font-weight: 700;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .cltr-rep-val {
                font-family: var(--font-data);
                font-size: 16px;
                font-weight: 700;
                color: #111;
            }
            .cltr-rep-score-box {
                background: #1C0A0A;
                color: #FFFFFF;
                border: 1px solid #7A1C29;
                border-radius: 4px;
                padding: 24px 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 8px 30px rgba(92, 20, 20, 0.08);
            }
            .cltr-rep-score-left {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .cltr-rep-score-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .cltr-rep-score-val {
                font-family: var(--font-data);
                font-size: 32px;
                font-weight: 800;
                color: #FFFFFF;
                line-height: 1;
            }
            .cltr-badge-glow {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                padding: 6px 12px;
                background: #7A1C29;
                color: #FFFFFF;
                border-radius: 2px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }

            /* --- TRUST & VESTING CARDS --- */
            .cltr-trust-card {
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 16px;
                background: var(--plate, #FFFDF9);
            }
            .cltr-trust-card-hdr {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 12px;
            }
            .cltr-trust-name {
                font-size: 13px;
                font-weight: 700;
                color: #111;
            }
            .cltr-trust-alloc {
                font-family: var(--font-data);
                font-size: 11px;
                color: #7A1C29;
                font-weight: 700;
            }
            .cltr-trust-progress-bg {
                height: 4px;
                background: #F0F0F0;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .cltr-trust-progress-fill {
                height: 100%;
                background: #7A1C29;
                width: 0%;
                transition: width 0.3s ease;
            }
            .cltr-trust-meta {
                display: flex;
                justify-content: space-between;
                font-family: var(--font-data);
                font-size: 9px;
                color: #888;
                margin-bottom: 16px;
            }
            .cltr-trust-claim-box {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                padding: 12px 16px;
                border-radius: 4px;
            }
            .cltr-trust-claim-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                color: #888;
                text-transform: uppercase;
                display: block;
            }
            .cltr-trust-claim-val {
                font-family: var(--font-data);
                font-size: 13px;
                font-weight: 700;
                color: #7A1C29;
            }
            .cltr-trust-claim-btn {
                background: #0E1420;
                color: #FFFFFF;
                border: none;
                padding: 8px 14px;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                cursor: pointer;
                border-radius: 2px;
                transition: all 0.15s ease;
            }
            .cltr-trust-claim-btn:hover:not(:disabled) {
                background: #7A1C29;
            }
            .cltr-trust-claim-btn:disabled {
                background: rgba(70,55,35,.22);
                color: #999;
                cursor: not-allowed;
            }
            .cltr-contract-addr-row {
                margin-top: 12px;
                font-family: var(--font-data);
                font-size: 8px;
                color: #888;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cltr-contract-addr-row span.addr {
                color: #555;
                cursor: pointer;
                text-decoration: underline;
            }

            /* ===================================================
               LIVE ACTIVITY FEED
               =================================================== */
            .cltr-feed-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .cltr-feed-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                font-size: 12px;
                color: #333;
                line-height: 1.4;
                border-bottom: 1px solid #F5F5F5;
                padding-bottom: 10px;
            }
            .cltr-feed-item:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }
            .cltr-feed-icon {
                font-size: 12px;
                flex-shrink: 0;
            }
            .cltr-feed-details {
                flex: 1;
            }
            .cltr-feed-text {
                font-weight: 500;
            }
            .cltr-feed-time {
                display: block;
                font-family: var(--font-data);
                font-size: 8px;
                color: #888;
                margin-top: 2px;
            }
            .cltr-feed-txlink {
                color: #7A1C29;
                text-decoration: underline;
                margin-left: 6px;
            }

            /* --- PROTOCOL HEALTH TABLE --- */
            .cltr-health-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            .cltr-health-stat {
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            /* --- TABLE SYSTEM --- */
            .cltr-table-container {
                overflow-x: auto;
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
            }
            .cltr-data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                text-align: left;
            }
            .cltr-data-table th {
                font-family: var(--font-data);
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #888;
                padding: 14px 16px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                background: #FAF4E6;
            }
            .cltr-data-table td {
                padding: 14px 16px;
                border-bottom: 1px solid #F0F0F0;
                font-family: var(--font-data);
            }
            .cltr-data-table tr:last-child td {
                border-bottom: none;
            }
            .cltr-progress-bar-mini {
                width: 80px;
                height: 4px;
                background: #EEE;
                border-radius: 2px;
                overflow: hidden;
                display: inline-block;
                vertical-align: middle;
                margin-right: 8px;
            }
            .cltr-progress-bar-mini-fill {
                height: 100%;
                background: #7A1C29;
                width: 0%;
            }

            .cltr-unstake-btn {
                background: #0E1420;
                color: #FFFFFF;
                border: none;
                padding: 4px 10px;
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                cursor: pointer;
                border-radius: 2px;
            }
            .cltr-unstake-btn:disabled {
                background: rgba(70,55,35,.22);
                color: #999;
                cursor: not-allowed;
            }

            /* --- MODALS --- */
            .cltr-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .cltr-modal-backdrop.open {
                display: flex;
            }
            .cltr-modal-box {
                background: var(--plate, #FFFDF9);
                border-radius: 4px;
                border: 1px solid rgba(70,55,35,.22);
                padding: 32px;
                width: 100%;
                max-width: 360px;
                text-align: center;
                box-shadow: 0 16px 48px rgba(0,0,0,0.1);
            }
            .cltr-tx-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #F0F0F0;
                border-top-color: #7A1C29;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 1024px) {
                .cltr-main-grid { grid-template-columns: 1fr; }
                .cltr-metrics-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 768px) {
                .cltr-container {
                    padding: 96px 16px 0 !important;
                }
                .cltr-subnav-tabs {
                    gap: 16px !important;
                    overflow-x: auto !important;
                    white-space: nowrap !important;
                    -webkit-overflow-scrolling: touch !important;
                    padding-bottom: 8px !important;
                    margin-bottom: 24px !important;
                }
                .cltr-subnav-btn {
                    flex-shrink: 0 !important;
                    padding: 8px 4px !important;
                }
                .cltr-subnav-tabs::-webkit-scrollbar {
                    display: none !important;
                }
                .cltr-main-grid,
                .cltr-metrics-grid,
                .cltr-lock-grid,
                .cltr-rep-layout,
                .cltr-health-grid,
                .cltr-burn-period-grid,
                .pillars-grid,
                .benefits-grid {
                    grid-template-columns: 1fr !important;
                    gap: 16px !important;
                    width: 100% !important;
                }
                .stats-dashboard {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 16px 12px !important;
                    padding: 20px 16px !important;
                    margin-bottom: 32px !important;
                }
                .stats-dashboard-card {
                    border-right: none !important;
                    border-bottom: 1px solid #F0F0F0 !important;
                    padding-bottom: 12px !important;
                    padding-right: 0 !important;
                }
                .stats-dashboard-card:nth-child(odd) {
                    border-right: 1px solid #F0F0F0 !important;
                    padding-right: 12px !important;
                }
                .stats-dashboard-card:nth-child(even) {
                    padding-left: 12px !important;
                }
                .stats-dashboard-card:nth-last-child(-n+2) {
                    border-bottom: none !important;
                    padding-bottom: 0 !important;
                }
                .stats-dashboard-num {
                    font-size: 24px !important;
                }
                .snapshot-panel {
                    padding: 20px 16px !important;
                    margin-bottom: 32px !important;
                }
                .snapshot-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 16px 12px !important;
                }
                .snapshot-card {
                    border-right: none !important;
                    border-bottom: 1px solid #F0F0F0 !important;
                    padding-bottom: 8px !important;
                    padding-right: 0 !important;
                }
                .snapshot-card:nth-child(odd) {
                    border-right: 1px solid #F0F0F0 !important;
                    padding-right: 12px !important;
                }
                .snapshot-card:nth-child(even) {
                    padding-left: 12px !important;
                }
                .snapshot-card:nth-last-child(-n+2) {
                    border-bottom: none !important;
                    padding-bottom: 0 !important;
                }
                .snapshot-val {
                    font-size: 13px !important;
                }
                .cltr-focal-hero {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    padding: 20px !important;
                }
                .cltr-focal-num {
                    font-size: clamp(24px, 8vw, 36px) !important;
                    letter-spacing: -1px !important;
                    line-height: 1.1 !important;
                }
                .cltr-focal-mini-num {
                    font-size: 16px !important;
                }
                .cltr-focal-right {
                    flex-direction: column !important;
                    gap: 16px !important;
                    width: 100% !important;
                    margin-top: 16px !important;
                }
                .cltr-panel,
                .cltr-trust-card,
                .pillar-card,
                .benefit-card,
                .econ-hero,
                .trust-network-panel {
                    padding: 20px 16px !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                .cltr-panel-hdr {
                    padding-bottom: 12px !important;
                    margin-bottom: 16px !important;
                }
                .flywheel-flow {
                    padding: 20px 16px !important;
                }
                .flywheel-row {
                    flex-direction: column !important;
                    gap: 12px !important;
                }
                .flywheel-node {
                    width: 100% !important;
                    padding: 12px 16px !important;
                }
                .flywheel-row .flywheel-arrow {
                    display: none !important;
                }
                .flywheel-flow > div:nth-child(2) {
                    display: none !important;
                }
                .trust-network-svg {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                }
                .vis-grid {
                    grid-template-columns: 1fr !important;
                    gap: 24px !important;
                }
                .vis-hero {
                    padding: 32px 0 !important;
                    margin-bottom: 24px !important;
                }
                .vis-title {
                    font-size: 24px !important;
                }
                .wp-container {
                    max-width: 100% !important;
                    padding: 0 !important;
                }
                .wp-chapter {
                    margin-bottom: 32px !important;
                    padding-bottom: 24px !important;
                }
                .wp-chapter-title {
                    font-size: 16px !important;
                    margin-bottom: 16px !important;
                }
                .wp-box {
                    padding: 16px !important;
                }
                .cltr-table-container {
                    width: 100% !important;
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                .cltr-data-table {
                    min-width: 500px !important;
                }
                .cltr-wallet-banner {
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 12px !important;
                    padding: 16px !important;
                }
                .cltr-connect-btn {
                    width: 100% !important;
                    text-align: center !important;
                }
                .flow-container {
                    scrollbar-width: none !important;
                }
                .flow-container::-webkit-scrollbar {
                    display: none !important;
                }
            }

            /* --- PROTOCOL SUBNAV TABS --- */
            .cltr-subnav-tabs {
                display: flex;
                gap: 24px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                padding-bottom: 0;
                margin-bottom: 32px;
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .cltr-subnav-btn {
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                padding: 12px 4px;
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .cltr-subnav-btn:hover {
                color: #111;
            }
            .cltr-subnav-btn.active {
                color: #7A1C29;
                border-bottom-color: #7A1C29;
            }
            .cltr-tab-panel {
                animation: panelReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            .cltr-tab-panel.hidden {
                display: none !important;
            }
            
            /* --- VISION VIEW STYLES --- */
            .vis-hero {
                padding: 48px 0;
                border-bottom: 1px solid rgba(70,55,35,.22);
                margin-bottom: 48px;
            }
            .vis-title {
                font-size: 32px;
                font-weight: 800;
                letter-spacing: -1.2px;
                color: #111;
                margin: 0 0 16px 0;
                line-height: 1.1;
            }
            .vis-subtitle {
                font-size: 15px;
                color: #666;
                max-width: 600px;
                line-height: 1.6;
                margin: 0;
            }
            .vis-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 48px;
                margin-bottom: 64px;
            }
            .vis-card-title {
                font-size: 16px;
                font-weight: 700;
                color: #111;
                margin: 0 0 12px 0;
                letter-spacing: -0.5px;
            }
            .vis-card-p {
                font-size: 14px;
                color: #555;
                line-height: 1.6;
                margin: 0 0 24px 0;
            }
            
            /* --- HUMAN WHITEPAPER VIEW STYLES --- */
            .wp-container {
                max-width: 800px;
                margin: 0 auto;
                font-family: var(--font-content);
                color: #111;
                line-height: 1.7;
            }
            .wp-chapter {
                margin-bottom: 64px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                padding-bottom: 48px;
            }
            .wp-chapter:last-child {
                border-bottom: none;
            }
            .wp-chapter-title {
                font-size: 20px;
                font-weight: 800;
                color: #111;
                margin-top: 0;
                margin-bottom: 24px;
                letter-spacing: -0.8px;
            }
            .wp-box {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 24px;
                margin-bottom: 24px;
            }
            .wp-box-title {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                color: #7A1C29;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
            }
            .wp-box-desc {
                font-size: 14px;
                color: #333;
                margin: 0;
            }
            .wp-box-desc strong {
                color: #111;
            }
            .wp-math {
                background: #F5F5F5;
                font-family: var(--font-data);
                font-size: 12px;
                padding: 20px;
                border-radius: 4px;
                overflow-x: auto;
                color: #111;
                margin-bottom: 20px;
                border-left: 3px solid #7A1C29;
            }
            .wp-math-vars {
                font-family: var(--font-data);
                font-size: 11px;
                color: #666;
                margin-top: 12px;
                line-height: 1.5;
            }
            .wp-table {
                width: 100%;
                border-collapse: collapse;
                margin: 24px 0;
                font-size: 13px;
            }
            .wp-table th {
                background: #F5F5F5;
                text-align: left;
                padding: 12px;
                font-family: var(--font-data);
                font-weight: 700;
                font-size: 10px;
                letter-spacing: 0.5px;
                border-bottom: 2px solid rgba(70,55,35,.22);
            }
            .wp-table td {
                padding: 12px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                color: #444;
            }
            
            /* --- ECONOMICS STYLES --- */
            .econ-hero {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 40px;
                margin-bottom: 40px;
            }
            .econ-title-main {
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -0.8px;
                color: #111;
                margin: 0 0 12px 0;
            }
            .econ-sub-main {
                font-size: 14px;
                color: #666;
                margin: 0;
                line-height: 1.6;
            }
            
            /* --- OVERVIEW VIEW STYLES --- */
            .ov-hero {
                padding: 64px 0 40px;
                text-align: center;
                border-bottom: 1px solid rgba(70,55,35,.22);
                margin-bottom: 48px;
            }
            .ov-title {
                font-size: 36px;
                font-weight: 800;
                color: #111;
                margin: 0 0 12px 0;
                letter-spacing: -1.2px;
            }
            .ov-subtitle {
                font-size: 15px;
                color: #666;
                margin: 0;
            }
            /* --- NEW FLOW / TIMELINE PROCESS STYLES --- */
            .flow-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 24px 20px;
                margin-bottom: 48px;
                gap: 12px;
                overflow-x: auto;
            }
            .flow-step {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                flex: 1;
                min-width: 100px;
                position: relative;
            }
            .flow-step-dot {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(92, 20, 20, 0.04);
                border: 1.5px solid rgba(92, 20, 20, 0.15);
                color: #7A1C29;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                margin-bottom: 8px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .flow-step:hover .flow-step-dot {
                background: #7A1C29;
                color: #FFFFFF;
                border-color: #7A1C29;
                box-shadow: 0 0 12px rgba(92, 20, 20, 0.25);
                transform: scale(1.08);
            }
            .flow-step-title {
                font-size: 11px;
                font-weight: 700;
                color: #111;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .flow-arrow {
                color: #DDD;
                font-size: 16px;
                font-weight: 500;
                user-select: none;
            }

            /* --- PILLARS SECTION --- */
            .pillars-section-title {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 700;
                color: #7A1C29;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .pillars-section-title::after {
                content: '';
                flex: 1;
                height: 1px;
                background: rgba(229, 229, 229, 0.5);
            }
            .pillars-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                margin-bottom: 48px;
            }
            .pillar-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 28px;
                display: flex;
                flex-direction: column;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                text-decoration: none;
                color: inherit;
                height: 100%;
                box-sizing: border-box;
            }
            .pillar-card:hover {
                border-color: rgba(92, 20, 20, 0.3);
                box-shadow: 0 10px 30px rgba(92, 20, 20, 0.03);
                transform: translateY(-2px);
            }
            .pillar-card-icon {
                width: 40px;
                height: 40px;
                border-radius: 6px;
                background: rgba(92, 20, 20, 0.04);
                color: #7A1C29;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 18px;
                transition: all 0.3s ease;
            }
            .pillar-card:hover .pillar-card-icon {
                background: #7A1C29;
                color: #FFFFFF;
            }
            .pillar-card-title {
                font-size: 14px;
                font-weight: 700;
                color: #111;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .pillar-card-desc {
                font-size: 12px;
                color: #666;
                line-height: 1.6;
                margin: 0 0 16px 0;
                flex: 1;
            }
            .pillar-card-link {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                color: #7A1C29;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            /* --- WHY IT MATTERS BENEFITS GRID --- */
            .benefits-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 48px;
            }
            .benefit-card {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 24px;
                transition: all 0.25s ease;
            }
            .benefit-card:hover {
                border-color: rgba(92, 20, 20, 0.2);
            }
            .benefit-card-title {
                font-size: 13px;
                font-weight: 700;
                color: #111;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .benefit-card-desc {
                font-size: 12px;
                color: #666;
                line-height: 1.6;
                margin: 0;
            }

            /* --- LIVE NETWORK SNAPSHOT --- */
            .snapshot-panel {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 32px;
                margin-bottom: 48px;
            }
            .snapshot-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 16px;
            }
            .snapshot-card {
                display: flex;
                flex-direction: column;
                gap: 4px;
                border-right: 1px solid #F0F0F0;
                padding-right: 12px;
            }
            .snapshot-card:last-child {
                border-right: none;
                padding-right: 0;
            }
            .snapshot-lbl {
                font-family: var(--font-data);
                font-size: 8px;
                font-weight: 700;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .snapshot-val {
                font-family: var(--font-data);
                font-size: 15px;
                font-weight: 700;
                color: #111;
            }

            /* --- HIGHLIGHTS / CALLOUTS --- */
            .cltr-highlight {
                font-weight: 700;
                color: #111;
            }
            .cltr-callout {
                background: rgba(92, 20, 20, 0.02);
                border-left: 3px solid #7A1C29;
                border-radius: 0 4px 4px 0;
                padding: 20px;
                margin: 24px 0;
            }
            .cltr-callout-text {
                font-size: 13px;
                color: #444;
                line-height: 1.6;
                margin: 0;
            }

            /* --- FLYWHEEL SYSTEM (ECONOMICS) --- */
            .flywheel-flow {
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 32px;
                margin-bottom: 40px;
            }
            .flywheel-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .flywheel-node {
                flex: 1;
                background: var(--paper, #F7F4ED);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 16px;
                text-align: center;
                transition: all 0.3s ease;
                min-width: 0;
            }
            .flywheel-node:hover {
                border-color: #7A1C29;
                background: rgba(92, 20, 20, 0.01);
                transform: translateY(-1px);
            }
            .flywheel-node-title {
                font-size: 11px;
                font-weight: 700;
                color: #111;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .flywheel-node-desc {
                font-size: 10px;
                color: #666;
                line-height: 1.4;
            }
            .flywheel-arrow {
                color: #DDD;
                font-size: 14px;
                font-weight: 500;
                user-select: none;
            }

            /* --- DIVIDERS / DIAGRAMS --- */
            .vis-divider {
                height: 1px;
                background: rgba(70,55,35,.22);
                margin: 48px 0;
                position: relative;
            }
            .vis-divider::after {
                content: '◆';
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                background: var(--paper, #F7F4ED);
                padding: 0 12px;
                color: #7A1C29;
                font-size: 10px;
            }
            .vis-diag-container {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
                min-height: 140px;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .vis-diag-container:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(92, 20, 20, 0.04);
                border-color: rgba(92, 20, 20, 0.2);
            }

            /* --- PULL QUOTE STYLES --- */
            .cltr-pull-quote {
                font-family: var(--font-content);
                font-size: 18px;
                font-weight: 600;
                color: #7A1C29;
                line-height: 1.45;
                font-style: italic;
                border-left: 3px solid #7A1C29;
                padding-left: 20px;
                margin: 36px 0;
                max-width: 720px;
                letter-spacing: -0.5px;
            }

            /* --- STATS DASHBOARD STYLES --- */
            .stats-dashboard {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 48px;
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 32px 24px;
                box-shadow: 0 4px 24px rgba(92, 20, 20, 0.01);
            }
            .stats-dashboard-card {
                display: flex;
                flex-direction: column;
                gap: 6px;
                text-align: center;
                border-right: 1px solid #F0F0F0;
            }
            .stats-dashboard-card:last-child {
                border-right: none;
            }
            .stats-dashboard-num {
                font-family: var(--font-data);
                font-size: 32px;
                font-weight: 800;
                color: #111111;
                line-height: 1;
                letter-spacing: -1px;
            }
            .stats-dashboard-lbl {
                font-family: var(--font-data);
                font-size: 9px;
                font-weight: 700;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* --- TRUST NETWORK VISUALIZATION --- */
            .trust-network-panel {
                background: var(--plate, #FFFDF9);
                border: 1px solid rgba(70,55,35,.22);
                border-radius: 4px;
                padding: 40px;
                margin-bottom: 48px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            .trust-network-svg {
                width: 100%;
                max-width: 500px;
                height: auto;
            }
            .trust-network-node {
                cursor: pointer;
                transition: fill 0.3s, r 0.3s;
            }
            .trust-network-node:hover {
                fill: #7A1C29 !important;
            }

            /* --- ANIMATION KEYFRAMES --- */
            .flow-arrow, .flywheel-arrow {
                animation: pulseArrow 1.6s infinite ease-in-out;
                font-weight: 700;
                display: inline-block;
            }
            @keyframes pulseArrow {
                0%, 100% { opacity: 0.4; transform: translateX(0); }
                50% { opacity: 1; transform: translateX(3px); }
            }
            @keyframes nodePulse {
                0%, 100% { r: 5px; opacity: 0.5; }
                50% { r: 8px; opacity: 0.9; }
            }
            .pulse-dot {
                animation: nodePulse 2s infinite ease-in-out;
            }
        </style>

        <div class="cltr-page">
            <div class="cltr-container">

                <!-- Header block -->
                <div class="cltr-header-group">
                    <div class="cltr-header-left">
                        <svg class="cltr-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <path d="M 44.690,43.190 L 48.940,38.940 L 39.243,29.243 Q 35.000,25.000 30.757,29.243 L 14.243,45.757 Q 10.000,50.000 14.243,54.243 L 30.757,70.757 Q 35.000,75.000 39.243,70.757 L 55.757,54.243 Q 60.000,50.000 55.757,45.757 L 55.310,45.310 L 51.060,49.560 L 51.500,50.000 Q 53.621,52.121 51.500,54.243 L 39.243,66.500 Q 37.121,68.621 35.000,66.500 L 22.743,54.243 Q 20.621,52.121 22.743,50.000 L 35.000,37.743 Q 37.121,35.621 39.243,37.743 Z" />
                            <path d="M 55.310,56.810 L 51.060,61.060 L 60.757,70.757 Q 65.000,75.000 69.243,70.757 L 85.757,54.243 Q 90.000,50.000 85.757,45.757 L 69.243,29.243 Q 65.000,25.000 60.757,29.243 L 44.243,45.757 Q 40.000,50.000 44.243,54.243 L 44.690,54.690 L 48.940,50.440 L 48.500,50.000 Q 46.379,47.879 48.500,45.757 L 60.757,33.500 Q 62.879,31.379 65.000,33.500 L 77.257,45.757 Q 79.379,47.879 77.257,50.000 L 65.000,62.257 Q 62.879,64.379 60.757,62.257 Z" />
                        </svg>
                        <div class="cltr-hdr-title-group">
                            <h1 class="cltr-title-text">Collateral <span style="color:#7A1C29;">Protocol</span></h1>
                            <p class="cltr-title-desc">The world's first Proof of Execution network</p>
                            <p style="font-size: 13px; color: #555; margin: 8px 0 0; line-height: 1.5; font-weight: 500; max-width: 650px;">Turning promises into programmable financial contracts. A decentralized protocol where capital, reputation, and conviction guarantee that commitments are actually kept.</p>
                        </div>
                    </div>
                </div>

                <!-- Sub navigation tabs -->
                <div class="cltr-subnav-tabs">
                    <button class="cltr-subnav-btn active" data-tab="overview">Overview</button>
                    <button class="cltr-subnav-btn" data-tab="vision">Vision</button>
                    <button class="cltr-subnav-btn" data-tab="whitepaper">Whitepaper</button>
                    <button class="cltr-subnav-btn" data-tab="economics">Economics</button>
                    <button class="cltr-subnav-btn" data-tab="terminal">Custody Terminal</button>
                </div>

                <!-- ── OVERVIEW VIEW ── -->
                <div class="cltr-tab-panel" id="cltr-tab-overview">
                    
                    <!-- Prominent Stats Dashboard -->
                    <div class="stats-dashboard">
                        <div class="stats-dashboard-card">
                            <span class="stats-dashboard-num" id="stat-verified" data-target="12431">0</span>
                            <span class="stats-dashboard-lbl">Commitments Verified</span>
                        </div>
                        <div class="stats-dashboard-card">
                            <span class="stats-dashboard-num" id="stat-protected" data-target="183">0</span>
                            <span class="stats-dashboard-lbl">Capital Protected ($)</span>
                        </div>
                        <div class="stats-dashboard-card">
                            <span class="stats-dashboard-num" id="stat-rate" data-target="98.7">0</span>
                            <span class="stats-dashboard-lbl">Execution Rate</span>
                        </div>
                        <div class="stats-dashboard-card">
                            <span class="stats-dashboard-num" id="stat-burned" data-target="1.2">0</span>
                            <span class="stats-dashboard-lbl">Burned (CLTR)</span>
                        </div>
                    </div>

                    <!-- Signature Hero Visualization: Trust & Execution Network -->
                    <div class="pillars-section-title">Verified Trust Network Graph</div>
                    <div class="trust-network-panel">
                        <svg class="trust-network-svg" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Paths / Connections -->
                            <path d="M100 150 L200 80 L350 80 L450 150 L350 220 L200 220 Z" stroke="rgba(70,55,35,.22)" stroke-width="1.5" stroke-dasharray="4 4" />
                            <path d="M200 80 L350 220" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M200 220 L350 80" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M100 150 L300 150 L500 150" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M300 150 L200 80" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M300 150 L350 80" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M300 150 L200 220" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            <path d="M300 150 L350 220" stroke="rgba(70,55,35,.22)" stroke-dasharray="4 4" stroke-width="1" />
                            
                            <!-- Central Node (Protocol Core) -->
                            <circle cx="300" cy="150" r="28" fill="#7A1C29" stroke="#FFF" stroke-width="2" class="trust-network-node" />
                            <text x="300" y="154" font-family=var(--font-data) font-size="9" fill="#FFF" font-weight="bold" text-anchor="middle">CLTR</text>
                            
                            <!-- Outer Nodes (Role Play) -->
                            <!-- Client -->
                            <circle cx="100" cy="150" r="16" fill="#FFF" stroke="#111" stroke-width="1.5" class="trust-network-node" />
                            <circle cx="100" cy="150" r="4" fill="#7A1C29" class="pulse-dot" />
                            <text x="100" y="125" font-family=var(--font-data) font-size="8" fill="#111" font-weight="bold" text-anchor="middle">CLIENT</text>
                            
                            <!-- Executor -->
                            <circle cx="200" cy="80" r="16" fill="#FFF" stroke="#111" stroke-width="1.5" class="trust-network-node" />
                            <text x="200" y="55" font-family=var(--font-data) font-size="8" fill="#111" font-weight="bold" text-anchor="middle">EXECUTOR</text>
                            
                            <!-- Validator Node 1 -->
                            <circle cx="350" cy="80" r="16" fill="#FFF" stroke="#111" stroke-width="1.5" class="trust-network-node" />
                            <circle cx="350" cy="80" r="4" fill="#7A1C29" class="pulse-dot" />
                            <text x="350" y="55" font-family=var(--font-data) font-size="8" fill="#111" font-weight="bold" text-anchor="middle">VALIDATOR 01</text>
                            
                            <!-- API Adapter -->
                            <circle cx="500" cy="150" r="16" fill="#FFF" stroke="#7A1C29" stroke-width="1.5" class="trust-network-node" />
                            <text x="500" y="125" font-family=var(--font-data) font-size="8" fill="#7A1C29" font-weight="bold" text-anchor="middle">STRIPE API</text>
                            
                            <!-- Validator Node 2 -->
                            <circle cx="350" cy="220" r="16" fill="#FFF" stroke="#111" stroke-width="1.5" class="trust-network-node" />
                            <text x="350" y="250" font-family=var(--font-data) font-size="8" fill="#111" font-weight="bold" text-anchor="middle">VALIDATOR 02</text>
                            
                            <!-- Staker -->
                            <circle cx="200" cy="220" r="16" fill="#FFF" stroke="#111" stroke-width="1.5" class="trust-network-node" />
                            <circle cx="200" cy="220" r="4" fill="#7A1C29" class="pulse-dot" />
                            <text x="200" y="250" font-family=var(--font-data) font-size="8" fill="#111" font-weight="bold" text-anchor="middle">STAKER</text>
                        </svg>
                    </div>

                    <!-- Three Core Pillars -->
                    <div class="pillars-section-title">Three Core Pillars</div>
                    <div class="pillars-grid">
                        <a href="#" onclick="window.app.switchProtocolTab('whitepaper'); return false;" class="pillar-card">
                            <div class="pillar-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <h4 class="pillar-card-title">Money</h4>
                            <p class="pillar-card-desc">Capital placed at risk in secure escrow contracts to guarantee outcome execution.</p>
                            <span class="pillar-card-link">Learn More ➔</span>
                        </a>
                        <a href="#" onclick="window.app.switchProtocolTab('vision'); return false;" class="pillar-card">
                            <div class="pillar-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 8v4l3 3"></path>
                                </svg>
                            </div>
                            <h4 class="pillar-card-title">Reputation</h4>
                            <p class="pillar-card-desc">A permanent, wallet-bound execution history (ExID) that cannot be purchased.</p>
                            <span class="pillar-card-link">Learn More ➔</span>
                        </a>
                        <a href="#" onclick="window.app.switchProtocolTab('economics'); return false;" class="pillar-card">
                            <div class="pillar-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                </svg>
                            </div>
                            <h4 class="pillar-card-title">Conviction</h4>
                            <p class="pillar-card-desc">CLTR tokens bonded alongside commitments to increase execution capacity and trust bandwidth.</p>
                            <span class="pillar-card-link">Learn More ➔</span>
                        </a>
                    </div>

                    <!-- How Collateral Works -->
                    <div class="pillars-section-title">How Collateral Works</div>
                    <div class="flow-container">
                        <div class="flow-step">
                            <div class="flow-step-dot">01</div>
                            <span class="flow-step-title">Create Commitment</span>
                        </div>
                        <div class="flow-arrow">➔</div>
                        <div class="flow-step">
                            <div class="flow-step-dot">02</div>
                            <span class="flow-step-title">Lock Capital</span>
                        </div>
                        <div class="flow-arrow">➔</div>
                        <div class="flow-step">
                            <div class="flow-step-dot">03</div>
                            <span class="flow-step-title">Bond CLTR</span>
                        </div>
                        <div class="flow-arrow">➔</div>
                        <div class="flow-step">
                            <div class="flow-step-dot">04</div>
                            <span class="flow-step-title">Verify Execution</span>
                        </div>
                        <div class="flow-arrow">➔</div>
                        <div class="flow-step">
                            <div class="flow-step-dot">05</div>
                            <span class="flow-step-title">Update Reputation</span>
                        </div>
                        <div class="flow-arrow">➔</div>
                        <div class="flow-step">
                            <div class="flow-step-dot">06</div>
                            <span class="flow-step-title">Settlement Payout</span>
                        </div>
                    </div>

                    <!-- Why It Matters -->
                    <div class="pillars-section-title">Why It Matters</div>
                    <div class="benefits-grid">
                        <div class="benefit-card">
                            <h5 class="benefit-card-title">Replace Blind Trust</h5>
                            <p class="benefit-card-desc">Move from unverified promises to mathematical assurance. Counterparties put skin in the game, backed by verifiable data adapters.</p>
                        </div>
                        <div class="benefit-card">
                            <h5 class="benefit-card-title">Programmable Accountability</h5>
                            <p class="benefit-card-desc">Contracts resolve deterministically using platform APIs (Stripe, X, Shopify, YouTube) to eliminate human subjectivity and disputes.</p>
                        </div>
                        <div class="benefit-card">
                            <h5 class="benefit-card-title">Permanent Execution Identity</h5>
                            <p class="benefit-card-desc">Build your digital sovereign track record. Your historical success rate is immutably indexed to serve as reputation collateral.</p>
                        </div>
                        <div class="benefit-card">
                            <h5 class="benefit-card-title">Economic Incentives</h5>
                            <p class="benefit-card-desc">Honesty becomes economically optimal. Success yields capital returns; failure triggers slashes, ensuring alignment.</p>
                        </div>
                    </div>

                    <!-- Live Network Snapshot -->
                    <div class="pillars-section-title">Live Network Snapshot</div>
                    <div class="snapshot-panel">
                        <div class="snapshot-grid">
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">Total Commitments</span>
                                <span class="snapshot-val" id="snap-total-commitments">—</span>
                            </div>
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">Capital Locked</span>
                                <span class="snapshot-val" id="snap-capital-locked">—</span>
                            </div>
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">Avg Success Rate</span>
                                <span class="snapshot-val">98.7%</span>
                            </div>
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">CLTR Burned</span>
                                <span class="snapshot-val" id="snap-cltr-burned">—</span>
                            </div>
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">Active Validators</span>
                                <span class="snapshot-val">128 Nodes</span>
                            </div>
                            <div class="snapshot-card">
                                <span class="snapshot-lbl">Verified Identities</span>
                                <span class="snapshot-val">1,482 Users</span>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- ── VISION VIEW ── -->
                <div class="cltr-tab-panel hidden" id="cltr-tab-vision">
                    <div class="vis-hero" data-reveal>
                        <h2 class="vis-title">The Human Execution Protocol</h2>
                        <p class="vis-subtitle">Replacing blind trust and unverified claims with economic certainty and programmatic enforcement.</p>
                        <div class="cltr-pull-quote">"The internet solved communication. It never solved accountability."</div>
                    </div>
                    
                    <div class="vis-grid">
                        <!-- 1. Trust Deficit -->
                        <div data-reveal data-reveal-delay="1">
                            <h3 class="vis-card-title">The Trust Deficit</h3>
                            <div class="vis-diag-container">
                                <svg width="240" height="100" viewBox="0 0 240 100" fill="none">
                                    <!-- Nodes -->
                                    <rect x="10" y="30" width="70" height="30" rx="3" fill="#FFF" stroke="rgba(70,55,35,.22)" stroke-width="1.5"/>
                                    <text x="45" y="49" font-family=var(--font-data) font-size="9" fill="#111" text-anchor="middle" font-weight="bold">PROMISE</text>
                                    
                                    <rect x="160" y="30" width="70" height="30" rx="3" fill="#FFF" stroke="rgba(70,55,35,.22)" stroke-width="1.5"/>
                                    <text x="195" y="49" font-family=var(--font-data) font-size="9" fill="#888" text-anchor="middle">DELIVERY</text>
                                    
                                    <!-- Broken Arrow / Gap -->
                                    <path d="M 85 45 L 110 45" stroke="#D82224" stroke-width="1.5" stroke-dasharray="3 3"/>
                                    <path d="M 130 45 L 155 45" stroke="#D82224" stroke-width="1.5" stroke-dasharray="3 3"/>
                                    <circle cx="120" cy="45" r="8" fill="#FEF2F2" stroke="#D82224" stroke-width="1.5"/>
                                    <text x="120" y="48" font-family="Sora" font-size="10" fill="#D82224" text-anchor="middle" font-weight="bold">?</text>
                                </svg>
                            </div>
                            <p class="vis-card-p">
                                The internet has solved global communication, instant payments, and digital identity. Yet it remains completely broken at a fundamental level: <span class="cltr-highlight">faking execution is easier than executing</span>. Resumes are exaggerated, social media metrics are bought, and promises are made and broken with <span class="cltr-highlight">zero consequences</span>.
                            </p>
                        </div>

                        <!-- 2. Proof of Execution -->
                        <div data-reveal data-reveal-delay="2">
                            <h3 class="vis-card-title">Proof of Execution</h3>
                            <div class="vis-diag-container">
                                <svg width="240" height="100" viewBox="0 0 240 100" fill="none">
                                    <rect x="10" y="35" width="60" height="30" rx="3" fill="#FFF" stroke="rgba(70,55,35,.22)" stroke-width="1.5"/>
                                    <text x="40" y="53" font-family=var(--font-data) font-size="8" fill="#111" text-anchor="middle">LOCKED ESCROW</text>
                                    
                                    <path d="M 75 50 L 95 50" stroke="#7A1C29" stroke-width="1.5"/>
                                    <polygon points="95,50 90,47 90,53" fill="#7A1C29"/>
                                    
                                    <rect x="100" y="35" width="40" height="30" rx="3" fill="#FFF" stroke="#7A1C29" stroke-width="1.5"/>
                                    <text x="120" y="53" font-family=var(--font-data) font-size="8" fill="#7A1C29" text-anchor="middle" font-weight="bold">VERIFY</text>
                                    
                                    <path d="M 145 50 L 165 50" stroke="#7A1C29" stroke-width="1.5"/>
                                    <polygon points="165,50 160,47 160,53" fill="#7A1C29"/>
                                    
                                    <rect x="170" y="35" width="60" height="30" rx="3" fill="#FFF" stroke="rgba(70,55,35,.22)" stroke-width="1.5"/>
                                    <text x="200" y="53" font-family=var(--font-data) font-size="8" fill="#111" text-anchor="middle">RELEASED</text>
                                </svg>
                            </div>
                            <p class="vis-card-p">
                                Collateral introduces the first proof of execution network. If you claim you will launch a startup, ship a feature, deliver a shipment, or maintain a streak, the protocol requires you to <span class="cltr-highlight">put real value on the line</span>. Success releases your capital and raises your reputation score; <span class="cltr-highlight">failure forfeits it</span>.
                            </p>
                        </div>
                    </div>

                    <div class="vis-divider"></div>

                    <div class="vis-grid">
                        <!-- 3. Execution Identity -->
                        <div data-reveal data-reveal-delay="3">
                            <h3 class="vis-card-title">Execution Identity (ExID)</h3>
                            <div class="vis-diag-container">
                                <svg width="240" height="100" viewBox="0 0 240 100" fill="none">
                                    <!-- Dial representation -->
                                    <rect x="30" y="25" width="180" height="50" rx="4" fill="#111" stroke="rgba(70,55,35,.22)" stroke-width="1"/>
                                    <text x="45" y="42" font-family=var(--font-data) font-size="7" fill="#888">ExID LEVEL</text>
                                    <text x="45" y="62" font-family=var(--font-data) font-size="16" fill="#FFF" font-weight="bold">920 <tspan font-size="9" fill="#10B981" font-weight="normal">▲ +35</tspan></text>
                                    <rect x="135" y="45" width="60" height="8" rx="4" fill="#222"/>
                                    <rect x="135" y="45" width="48" height="8" rx="4" fill="#7A1C29"/>
                                </svg>
                            </div>
                            <p class="vis-card-p">
                                Every promise you write to the blockchain builds your permanent, immutable Execution Identity. Like a <span class="cltr-highlight">credit score for your word</span>, your Execution Credit rises with consistency and falls with forfeiture, giving creators, freelancers, and businesses a verifiable asset that <span class="cltr-highlight">cannot be bought or faked</span>.
                            </p>
                        </div>

                        <!-- 4. The Sovereign Future -->
                        <div data-reveal data-reveal-delay="4">
                            <h3 class="vis-card-title">The Sovereign Future</h3>
                            <div class="vis-diag-container">
                                <svg width="240" height="100" viewBox="0 0 240 100" fill="none">
                                    <!-- Central Node -->
                                    <circle cx="120" cy="50" r="16" fill="#7A1C29" stroke="#FFF" stroke-width="1.5"/>
                                    <text x="120" y="53" font-family=var(--font-data) font-size="8" fill="#FFF" text-anchor="middle" font-weight="bold">CLTR</text>
                                    
                                    <!-- Platform spokes -->
                                    <line x1="120" y1="34" x2="120" y2="15" stroke="#CCC" stroke-width="1.2"/>
                                    <text x="120" y="10" font-family=var(--font-data) font-size="7" fill="#666" text-anchor="middle">STRIPE</text>
                                    
                                    <line x1="134" y1="42" x2="185" y2="25" stroke="#CCC" stroke-width="1.2"/>
                                    <text x="195" y="23" font-family=var(--font-data) font-size="7" fill="#666">SHOPIFY</text>
                                    
                                    <line x1="106" y1="42" x2="55" y2="25" stroke="#CCC" stroke-width="1.2"/>
                                    <text x="45" y="23" font-family=var(--font-data) font-size="7" fill="#666" text-anchor="end">GITHUB</text>
                                    
                                    <line x1="120" y1="66" x2="120" y2="85" stroke="#CCC" stroke-width="1.2"/>
                                    <text x="120" y="93" font-family=var(--font-data) font-size="7" fill="#666" text-anchor="middle">TWITTER</text>
                                </svg>
                            </div>
                            <p class="vis-card-p">
                                By pricing commitment risk, Collateral aligns incentive structures across capital venture funding, e-commerce, insurance, and talent recruitment. <span class="cltr-highlight">CLTR functions as the core currency</span> that secures and scales this global trust layer.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ── TERMINAL VIEW ── -->
                <div class="cltr-tab-panel hidden" id="cltr-tab-terminal">
                    <!-- Web3 Connect Banner -->
                    <div class="cltr-wallet-banner" id="wallet-banner-container">
                    <div class="cltr-wallet-status">
                        <div class="cltr-status-indicator" id="w-dot"></div>
                        <div class="cltr-wallet-text">
                            <span id="w-status">DISCONNECTED</span>
                            <span class="cltr-wallet-hash" id="w-addr">—</span>
                        </div>
                    </div>
                    <button class="cltr-connect-btn" id="w-connect-btn">CONNECT IDENTITY</button>
                </div>

                <!-- DOMINANT FOCAL POINT -->
                <div class="cltr-focal-hero">
                    <div class="cltr-focal-left">
                        <div class="cltr-focal-lbl">TOTAL CAPITAL COMMITTED</div>
                        <div class="cltr-focal-num" id="focal-total-committed">—</div>
                        <p class="cltr-focal-sub">Aggregated collateral locked in active verification contracts across the protocol.</p>
                    </div>
                    <div class="cltr-focal-right">
                        <div class="cltr-focal-mini-card">
                            <span class="cltr-focal-mini-lbl">PROOFS CONVERTED TO BURN</span>
                            <span class="cltr-focal-mini-num" id="focal-total-burned">—</span>
                        </div>
                        <div class="cltr-focal-mini-card">
                            <span class="cltr-focal-mini-lbl">GLOBAL SUCCESS RATE</span>
                            <span class="cltr-focal-mini-num" id="focal-success-rate">98.7%</span>
                        </div>
                    </div>
                </div>

                <!-- METRICS GRID -->
                <div class="cltr-metrics-grid">
                    <div class="cltr-metric-card">
                        <span class="cltr-metric-lbl">Conviction Balance</span>
                        <div class="cltr-metric-val" id="metric-conviction-bal">—</div>
                        <span class="cltr-metric-sub">CLTR unlocked in wallet</span>
                    </div>
                    <div class="cltr-metric-card">
                        <span class="cltr-metric-lbl">Committed Collateral</span>
                        <div class="cltr-metric-val" id="metric-committed-collateral">—</div>
                        <span class="cltr-metric-sub">CLTR locked in staking</span>
                    </div>
                    <div class="cltr-metric-card">
                        <span class="cltr-metric-lbl">Interest Earned</span>
                        <div class="cltr-metric-val" id="metric-yield-earned">—</div>
                        <span class="cltr-metric-sub">Accrued rewards</span>
                    </div>
                    <div class="cltr-metric-card">
                        <span class="cltr-metric-lbl">Protocol Supply</span>
                        <div class="cltr-metric-val" id="metric-protocol-supply">—</div>
                        <span class="cltr-metric-sub">Fixed cap: 1,000,000,000</span>
                    </div>
                </div>

                <!-- Main Layout -->
                <div class="cltr-main-grid">

                    <!-- Left Column -->
                    <div>
                        <!-- Commitment Staking Panel -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">COMMITMENT STAKING</span>
                                <span style="font-family:var(--font-data); font-size:10px; font-weight:700; color:#10B981;">MAX YIELD: 25%</span>
                            </div>

                            <div class="cltr-stake-wrap">
                                <div class="cltr-field-group">
                                    <div class="cltr-field-lbl-row">
                                        <span>Stake Amount</span>
                                        <span class="cltr-max-trigger" id="stake-max-btn">MAX</span>
                                    </div>
                                    <div class="cltr-input-container">
                                        <input type="text" inputmode="decimal" class="cltr-input-field" id="stake-input" placeholder="0.00" disabled>
                                        <span class="cltr-input-token">CLTR</span>
                                    </div>
                                </div>

                                <div class="cltr-field-group">
                                    <label class="cltr-field-lbl-row">Commitment Lockup Period</label>
                                    <div class="cltr-lock-grid">
                                        <button class="cltr-lock-pill active" data-days="30" data-apy="5" disabled>
                                            <span class="cltr-lock-days">30 Days</span>
                                            <span class="cltr-lock-yield">5% Yield</span>
                                        </button>
                                        <button class="cltr-lock-pill" data-days="90" data-apy="10" disabled>
                                            <span class="cltr-lock-days">90 Days</span>
                                            <span class="cltr-lock-yield">10% Yield</span>
                                        </button>
                                        <button class="cltr-lock-pill" data-days="180" data-apy="15" disabled>
                                            <span class="cltr-lock-days">180 Days</span>
                                            <span class="cltr-lock-yield">15% Yield</span>
                                        </button>
                                        <button class="cltr-lock-pill" data-days="365" data-apy="25" disabled>
                                            <span class="cltr-lock-days">365 Days</span>
                                            <span class="cltr-lock-yield">25% Yield</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="cltr-calc-summary">
                                    <div class="cltr-calc-row">
                                        <span>Commitment Yield</span>
                                        <span id="calc-apy">5.0%</span>
                                    </div>
                                    <div class="cltr-calc-row">
                                        <span>Interest Accrual</span>
                                        <span id="calc-yield">0.00 CLTR</span>
                                    </div>
                                    <div class="cltr-calc-row accent">
                                        <span>Total Release Balance</span>
                                        <strong id="calc-total">0.00 CLTR</strong>
                                    </div>
                                </div>

                                <button class="cltr-action-submit" id="stake-btn" disabled>STAKE CLTR</button>
                                <div style="display:flex; justify-content:center; gap: 6px; margin-top: 14px; font-family:var(--font-data); font-size:10px;">
                                    <span style="color:#666;">Need CLTR?</span>
                                    <a href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x7b69C7E57d7004EB2374E5Aabb9db5334aE73B9f" target="_blank" style="color:#7A1C29; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:2px;">
                                        <span>Buy on Uniswap</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                                    </a>
                                </div>
                                <div style="margin-top: 16px; padding: 12px; border: 1px dashed rgba(70,55,35,.22); border-radius: 4px; font-family:var(--font-content); font-size: 10px; color: #888; line-height: 1.5; text-align: left;">
                                    <strong>Staking Disclosure:</strong> Yield accrual calculations are theoretical, paid out externally/off-chain, and are not guaranteed or enforced by the smart contract. Staked CLTR principal is securely held on-chain and returned 1:1 upon lock expiration.
                                </div>
                            </div>
                        </div>

                        <!-- Active Stakes Panel -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">ACTIVE COMMITMENT POSITIONS</span>
                                <span style="font-family:var(--font-data); font-size:10px; color:#888;" id="stakes-count">0 Positions</span>
                            </div>

                            <div class="cltr-table-container">
                                <table class="cltr-data-table">
                                    <thead>
                                        <tr>
                                            <th>Staked Amount</th>
                                            <th>Lock Period</th>
                                            <th>Maturity</th>
                                            <th>Accrued Yield</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stakes-tbody">
                                        <tr>
                                            <td colspan="6" style="text-align:center; color:#999; padding: 24px;">Connect wallet to view active positions.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- BURN VISUALIZATION -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">DEFLATIONARY HISTORY &amp; SUPPLY SHRINKS</span>
                            </div>
                            <div class="cltr-burn-visualizer">
                                <div class="cltr-chart-container">
                                    <div class="cltr-chart-grid">
                                        <div class="cltr-chart-grid-line"></div>
                                        <div class="cltr-chart-grid-line"></div>
                                        <div class="cltr-chart-grid-line"></div>
                                    </div>
                                    <svg class="cltr-chart-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
                                        <path d="M 0,2 L 15,3 L 30,5 L 45,9 L 60,14 L 75,18 L 90,23 L 100,26" fill="none" stroke="#7A1C29" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div class="cltr-burn-period-grid">
                                    <div class="cltr-burn-period-card">
                                        <span class="cltr-burn-period-lbl">Today</span>
                                        <span class="cltr-burn-period-num" id="burn-today">—</span>
                                    </div>
                                    <div class="cltr-burn-period-card">
                                        <span class="cltr-burn-period-lbl">This Week</span>
                                        <span class="cltr-burn-period-num" id="burn-week">—</span>
                                    </div>
                                    <div class="cltr-burn-period-card">
                                        <span class="cltr-burn-period-lbl">Burn Rate</span>
                                        <span class="cltr-burn-period-num">1.25%</span>
                                    </div>
                                    <div class="cltr-burn-period-card">
                                        <span class="cltr-burn-period-lbl">Proof Burn</span>
                                        <span class="cltr-burn-period-num" id="burn-total" style="color:#7A1C29;">—</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div>
                        <!-- Reputation Identity Card -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">CREDIBILITY IDENTITY LAYER</span>
                            </div>

                            <div class="cltr-rep-score-box">
                                <div class="cltr-rep-score-left">
                                    <span class="cltr-rep-score-lbl">CONVICTION SCORE</span>
                                    <span class="cltr-rep-score-val" id="rep-score">—</span>
                                </div>
                                <span class="cltr-badge-glow" id="rep-rank">CONNECT WALLET</span>
                            </div>

                            <div class="cltr-rep-layout">
                                <div class="cltr-rep-stat">
                                    <span class="cltr-rep-lbl">SUCCESS RATE</span>
                                    <span class="cltr-rep-val" id="rep-success-rate">—</span>
                                </div>
                                <div class="cltr-rep-stat">
                                    <span class="cltr-rep-lbl">CONTRACTS</span>
                                    <span class="cltr-rep-val" id="rep-contracts-completed">—</span>
                                </div>
                                <div class="cltr-rep-stat">
                                    <span class="cltr-rep-lbl">RANK</span>
                                    <span class="cltr-rep-val" id="rep-rank-num">—</span>
                                </div>
                            </div>
                        </div>

                        <!-- Founder Vesting alignment -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">FOUNDER ALIGNMENT &amp; VESTING TRUST</span>
                            </div>

                            <!-- Founder Trust Vesting Details -->
                            <div class="cltr-trust-card">
                                <div class="cltr-trust-card-hdr">
                                    <span class="cltr-trust-name">Founder Escrow Wallet</span>
                                    <span class="cltr-trust-alloc">50,000,000 CLTR</span>
                                </div>
                                <div class="cltr-trust-progress-bg">
                                    <div class="cltr-trust-progress-fill" id="founder-vest-progress"></div>
                                </div>
                                <div class="cltr-trust-meta">
                                    <span>Vested: <strong id="founder-vested-label">—</strong></span>
                                    <span id="founder-time-remaining">—</span>
                                </div>
                                <div class="cltr-trust-claim-box">
                                    <div>
                                        <span class="cltr-trust-claim-lbl">Claimable Vested</span>
                                        <span class="cltr-trust-claim-val" id="founder-claimable-label">—</span>
                                    </div>
                                    <button class="cltr-trust-claim-btn" id="founder-claim-btn" disabled>RELEASE TOKENS</button>
                                </div>
                                <div class="cltr-contract-addr-row">
                                    <span>Vesting Contract Address</span>
                                    <span class="addr" id="founder-addr-copy">0x8f3Cf...3a4D</span>
                                </div>
                            </div>

                            <!-- Team Trust Vesting Details -->
                            <div class="cltr-trust-card">
                                <div class="cltr-trust-card-hdr">
                                    <span class="cltr-trust-name">Team Allocation Vesting</span>
                                    <span class="cltr-trust-alloc">150,000,000 CLTR</span>
                                </div>
                                <div class="cltr-trust-progress-bg">
                                    <div class="cltr-trust-progress-fill" id="team-vest-progress"></div>
                                </div>
                                <div class="cltr-trust-meta">
                                    <span>Vested: <strong id="team-vested-label">—</strong></span>
                                    <span id="team-time-remaining">—</span>
                                </div>
                                <div class="cltr-trust-claim-box">
                                    <div>
                                        <span class="cltr-trust-claim-lbl">Claimable Vested</span>
                                        <span class="cltr-trust-claim-val" id="team-claimable-label">—</span>
                                    </div>
                                    <button class="cltr-trust-claim-btn" id="team-claim-btn" disabled>RELEASE TOKENS</button>
                                </div>
                                <div class="cltr-contract-addr-row">
                                    <span>Vesting Contract Address</span>
                                    <span class="addr" id="team-addr-copy">0x2e9bA...1f9E</span>
                                </div>
                            </div>
                        </div>

                        <!-- Live Activity Feed -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">LIVE PROTOCOL ACTIVITY</span>
                            </div>
                            <div class="cltr-feed-list" id="activity-feed">
                                <div style="text-align:center; color:#999; font-size:11px; padding:12px; font-family:var(--font-data);">Connecting live node feed...</div>
                            </div>
                        </div>

                        <!-- Protocol Health -->
                        <div class="cltr-panel">
                            <div class="cltr-panel-hdr">
                                <span class="cltr-panel-title">PROTOCOL HEALTH SUMMARY</span>
                            </div>
                            <div class="cltr-health-grid">
                                <div class="cltr-health-stat">
                                    <span class="cltr-rep-lbl">Active Contracts</span>
                                    <span class="cltr-rep-val" id="health-active-contracts">—</span>
                                </div>
                                <div class="cltr-health-stat">
                                    <span class="cltr-rep-lbl">Escrow Locked</span>
                                    <span class="cltr-rep-val" id="health-escrow-locked">—</span>
                                </div>
                                <div class="cltr-health-stat">
                                    <span class="cltr-rep-lbl">Burned Today</span>
                                    <span class="cltr-rep-val" id="health-burned-today">—</span>
                                </div>
                                <div class="cltr-health-stat">
                                    <span class="cltr-rep-lbl">Circulating Supply</span>
                                    <span class="cltr-rep-val" id="health-circulating">—</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> <!-- End Terminal Tab Panel -->

                <!-- ── WHITEPAPER VIEW ── -->
                <div class="cltr-tab-panel hidden" id="cltr-tab-whitepaper">
                    <div class="wp-container">
                        <div class="vis-hero" style="padding-bottom: 24px;">
                            <h2 class="vis-title">Protocol &amp; Economic Whitepaper</h2>
                            <p class="vis-subtitle">The formal design specification of the Collateral Network and CLTR conviction-bonding primitives.</p>
                            
                            <!-- Flow Diagram -->
                            <div class="flow-container" style="margin-top: 32px; margin-bottom: 0; background: var(--plate, #FFFDF9);">
                                <div class="flow-step">
                                    <div class="flow-step-dot" style="font-family: var(--font-data); font-size: 8px;">MONEY</div>
                                    <span style="font-size: 9px; color: #666; font-family: var(--font-data);">1. Cash Escrow</span>
                                </div>
                                <div class="flow-arrow">➔</div>
                                <div class="flow-step">
                                    <div class="flow-step-dot" style="font-family: var(--font-data); font-size: 8px;">REP</div>
                                    <span style="font-size: 9px; color: #666; font-family: var(--font-data);">2. Historical Score</span>
                                </div>
                                <div class="flow-arrow">➔</div>
                                <div class="flow-step">
                                    <div class="flow-step-dot" style="font-family: var(--font-data); font-size: 8px;">CONV</div>
                                    <span style="font-size: 9px; color: #666; font-family: var(--font-data);">3. CLTR Bonded</span>
                                </div>
                                <div class="flow-arrow">➔</div>
                                <div class="flow-step">
                                    <div class="flow-step-dot" style="font-family: var(--font-data); font-size: 8px;">EXEC</div>
                                    <span style="font-size: 9px; color: #666; font-family: var(--font-data);">4. API Oracle</span>
                                </div>
                                <div class="flow-arrow">➔</div>
                                <div class="flow-step">
                                    <div class="flow-step-dot" style="font-family: var(--font-data); font-size: 8px;">SETTLE</div>
                                    <span style="font-size: 9px; color: #666; font-family: var(--font-data);">5. Payout / Burn</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="wp-chapter">
                            <h3 class="wp-chapter-title">Chapter 1: Three Things That Make Collateral Work</h3>
                            <p class="vis-card-p" style="margin-bottom: 20px;">To understand how Collateral works, you must understand three simple concepts: <span class="cltr-highlight">Money</span>, <span class="cltr-highlight">Reputation</span>, and <span class="cltr-highlight">Conviction</span>.</p>
                            
                            <div class="cltr-callout">
                                <div class="wp-box-title">1. Money at Risk (Financial Collateral)</div>
                                <p class="wp-box-desc">The cash deposit (USDC or ETH) you lock up when making a promise. This is paid to the challenger or client if you fail, <span class="cltr-highlight">covering the direct financial risk</span> of the commitment.</p>
                            </div>
                            
                            <div class="cltr-callout">
                                <div class="wp-box-title">2. Your Track Record (Earned Reputation)</div>
                                <p class="wp-box-desc">A permanent, earned history of your completed promises. It <span class="cltr-highlight">belongs strictly to your identity</span> and decays with inactivity or failure. It cannot be purchased.</p>
                            </div>
                            
                            <div class="cltr-callout">
                                <div class="wp-box-title">3. How Strongly You Believe in Yourself (Conviction)</div>
                                <p class="wp-box-desc">The amount of CLTR tokens you lock up alongside your deposit. This acts as an <span class="cltr-highlight">amplifier of your track record</span>, unlocking higher trust levels and capacity.</p>
                            </div>
                        </div>

                        <div class="wp-chapter">
                            <h3 class="wp-chapter-title">Chapter 2: Your Credit Score for Execution (Execution Credit)</h3>
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">Why this exists</div>
                                <p class="wp-box-desc">People need a way to prove they consistently follow through on commitments. <span class="cltr-highlight">Execution Credit (EC) is a credit score</span>—but instead of measuring how reliably you repay debt, it measures how reliably you keep your word.</p>
                            </div>
                            
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">What this means for you</div>
                                <p class="wp-box-desc">The more commitments you successfully verify, the more trusted you become. Your profile becomes an asset that clients, investors, and partners <span class="cltr-highlight">check before working with you</span>.</p>
                            </div>
                            
                            <div class="wp-box">
                                <div class="wp-box-title">Technical Design</div>
                                <p class="wp-box-desc" style="margin-bottom:16px;">Execution Credit EC is calculated by multiplying your earned reputation track record R_p by a logarithmic function of bonded CLTR conviction C_cltr:</p>
                                <div class="wp-math">
                                    EC = R_p * ln( e + C_cltr / (0.05 * R_p + 100) )
                                </div>
                                <div class="wp-math-vars">
                                    • EC: Execution Credit<br>
                                    • R_p: Your Track Record (Earned Reputation)<br>
                                    • C_cltr: Bonded CLTR Conviction
                                </div>
                            </div>
                        </div>

                        <div class="wp-chapter">
                            <h3 class="wp-chapter-title">Chapter 3: Your Commitment Bandwidth (Conviction Capacity)</h3>
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">Why this exists</div>
                                <p class="wp-box-desc">Without capacity constraints, spammers could flood the feed with endless empty commitments. <span class="cltr-highlight">Conviction Capacity (CC) acts as your concurrent bandwidth limit</span>.</p>
                            </div>
                            
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">What this means for you</div>
                                <p class="wp-box-desc">To manage larger projects or run multiple tasks at once, you must <span class="cltr-highlight">lock and bond more CLTR conviction</span>, which rate-limits and secures the system.</p>
                            </div>
                            
                            <div class="wp-box">
                                <div class="wp-box-title">Technical Design</div>
                                <div class="wp-math">
                                    CC = 1000 * EC
                                </div>
                            </div>
                        </div>

                        <div class="wp-chapter">
                            <h3 class="wp-chapter-title">Chapter 4: The Independent Referees (Verifiers)</h3>
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">Why this exists</div>
                                <p class="wp-box-desc">We cannot trust a person to verify their own promise. We need neutral, independent parties—like referees in sports—to <span class="cltr-highlight">confirm outcomes programmatically</span>.</p>
                            </div>
                            
                            <div class="cltr-callout" style="border-left-color: #111;">
                                <div class="wp-box-title" style="color: #111;">What this means for you</div>
                                <p class="wp-box-desc">API integrations (GitHub, Stripe, Shopify, Twitter) or nodes check the data and <span class="cltr-highlight">confirm the outcome automatically</span> without human bias.</p>
                            </div>
                            
                            <div class="wp-box">
                                <div class="wp-box-title">Technical Design</div>
                                <p class="wp-box-desc" style="margin-bottom:16px;">Verifiers must bond a minimum of 50,000 CLTR to participate. Vote weight scales logarithmically:</p>
                                <div class="wp-math">
                                    Weight = ln(C_node)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── ECONOMICS VIEW ── -->
                <div class="cltr-tab-panel hidden" id="cltr-tab-economics">
                    <div class="vis-hero" style="padding-bottom: 24px;">
                        <h2 class="vis-title">CLTR Economic Utility &amp; Flywheel</h2>
                        <p class="vis-subtitle">How protocol adoption directly drives token scarcity, locks, and burns.</p>
                    </div>

                    <!-- Visual Economic Flywheel -->
                    <div class="flywheel-flow">
                        <div class="flywheel-row">
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">1. Users</div>
                                <div class="flywheel-node-desc">Create commitments requiring trust</div>
                            </div>
                            <div class="flywheel-arrow">➔</div>
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">2. Stake CLTR</div>
                                <div class="flywheel-node-desc">Bond tokens to back execution</div>
                            </div>
                            <div class="flywheel-arrow">➔</div>
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">3. Commitments</div>
                                <div class="flywheel-node-desc">Active positions lock supply</div>
                            </div>
                        </div>
                        
                        <div class="flywheel-row" style="justify-content: flex-end; height: 16px; margin: 4px 0; padding-right: 48px;">
                            <div class="flywheel-arrow" style="transform: rotate(90deg);">➔</div>
                        </div>
                        
                        <div class="flywheel-row">
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">6. Utility &amp; Demand</div>
                                <div class="flywheel-node-desc">Higher value triggers more stakers</div>
                            </div>
                            <div class="flywheel-arrow">⇠</div>
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">5. Reduced Supply</div>
                                <div class="flywheel-node-desc">Deflation increases token scarcity</div>
                            </div>
                            <div class="flywheel-arrow">⇠</div>
                            <div class="flywheel-node">
                                <div class="flywheel-node-title">4. Settle / Burn</div>
                                <div class="flywheel-node-desc">Fees buyback &amp; slash events burn CLTR</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="wp-chapter">
                        <h3 class="wp-chapter-title">The CLTR Monopoly</h3>
                        <p class="vis-card-p" style="margin-bottom: 20px;">
                            CLTR has a singular, defensible monopoly: it is the exclusive economic unit of commitment capacity. USDC/ETH represent raw cash risk. Only CLTR represents network-wide trust capacity. If you fail a promise, the USDC goes to your opponent, but your CLTR is burned, destroying your ability to make future promises until you purchase and bond more.
                        </p>
                    </div>

                    <div class="vis-grid">
                        <div>
                            <h3 class="vis-card-title">1. The Settle Burn</h3>
                            <p class="vis-card-p">
                                Every completed contract routes a 1.5% settlement fee in USDC. 0.5% is automatically used to market-buy CLTR on the open market and burn it permanently from the circulating supply.
                            </p>
                        </div>
                        <div>
                            <h3 class="vis-card-title">2. The Forfeiture Burn</h3>
                            <p class="vis-card-p">
                                When a creator forfeits a commitment, 30% of their bonded CLTR conviction is immediately slashed and burned, applying direct deflationary pressure on supply.
                            </p>
                        </div>
                        <div>
                            <h3 class="vis-card-title">3. Capacity Locks</h3>
                            <p class="vis-card-p">
                                As builders, startups, and enterprises launch more active contracts, they must lock large amounts of CLTR, removing massive supplies from market liquidity.
                            </p>
                        </div>
                        <div>
                            <h3 class="vis-card-title">4. Validator Skin in the Game</h3>
                            <p class="vis-card-p">
                                Independent Referees and Dispute Jurors lock significant CLTR bonds to qualify for yields, aligning their economic incentives with the honesty of the network.
                            </p>
                        </div>
                    </div>

                    <!-- Acquire CLTR Card -->
                    <div style="margin-top: 40px; background: var(--plate, #FFFDF9); border: 1px solid rgba(70,55,35,.22); border-radius: 4px; padding: 32px;">
                        <h3 class="vis-card-title" style="margin-top:0; font-family:var(--font-data); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">ACQUIRING &amp; TRADING CLTR</h3>
                        <p class="vis-card-p" style="margin-bottom: 24px;">
                            The Collateral token (CLTR) is a utility asset deployed on the **Robinhood Chain**. You can trade, buy, or sell CLTR directly on Uniswap, or bridge assets to obtain it.
                        </p>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            <a href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0x7b69C7E57d7004EB2374E5Aabb9db5334aE73B9f" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #7A1C29; color: #FFFFFF; padding: 12px 24px; border-radius: 4px; font-family: var(--font-data); font-size: 11px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 12px rgba(92,20,20,0.15); transition: all 0.2s;">
                                <span>Trade CLTR on Uniswap</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </a>
                            <a href="#" onclick="window.router.navigate('/docs'); return false;" style="display: inline-flex; align-items: center; gap: 8px; background: var(--plate, #FFFDF9); color: #111111; border: 1px solid rgba(70,55,35,.22); padding: 12px 24px; border-radius: 4px; font-family: var(--font-data); font-size: 11px; font-weight: 700; text-decoration: none; transition: all 0.2s;">
                                <span>View Bridging Guide</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- ===== TX MODAL ===== -->
        <div id="tx-modal" class="cltr-modal-backdrop">
            <div class="cltr-modal-box" style="text-align: left; max-width: 400px; padding: 40px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
                    <h3 class="cltr-panel-title" style="margin:0; font-size:11px; font-family:var(--font-data); letter-spacing: 0.5px;">TRANSACTION PIPELINE</h3>
                    <div class="cltr-tx-spinner" style="width:16px; height:16px; margin:0; border-width:2px;"></div>
                </div>
                
                <div class="cltr-stepper" style="display:flex; flex-direction:column; gap:16px; font-family:var(--font-data); font-size:11px;">
                    <div class="cltr-step" id="step-approve" style="display:flex; align-items:center; gap:12px; color:#888;">
                        <span class="step-indicator">[ ]</span>
                        <span>Approving CLTR Allowance</span>
                    </div>
                    <div class="cltr-step" id="step-sign" style="display:flex; align-items:center; gap:12px; color:#888;">
                        <span class="step-indicator">[ ]</span>
                        <span>Waiting for Wallet Signature</span>
                    </div>
                    <div class="cltr-step" id="step-submit" style="display:flex; align-items:center; gap:12px; color:#888;">
                        <span class="step-indicator">[ ]</span>
                        <span>Submitting to Network</span>
                    </div>
                    <div class="cltr-step" id="step-confirm" style="display:flex; align-items:center; gap:12px; color:#888;">
                        <span class="step-indicator">[ ]</span>
                        <span>Awaiting Block Confirmation</span>
                    </div>
                    <div class="cltr-step" id="step-done" style="display:flex; align-items:center; gap:12px; color:#888;">
                        <span class="step-indicator">[ ]</span>
                        <span id="step-done-text">Commitment Completed</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initToken() {
    // Clear any existing intervals from previous mounts to prevent memory leaks in SPA
    if (window.tokenVestingInterval) {
        clearInterval(window.tokenVestingInterval);
        window.tokenVestingInterval = null;
    }
    if (window.tokenStatsInterval) {
        clearInterval(window.tokenStatsInterval);
        window.tokenStatsInterval = null;
    }

    const bannerContainer = document.getElementById('wallet-banner-container');

    function renderDisconnectedBanner() {
        if (!bannerContainer) return;
        bannerContainer.className = 'cltr-wallet-banner';
        bannerContainer.style.display = 'flex';
        bannerContainer.style.gridTemplateColumns = 'none';
        bannerContainer.style.background = '#FFFFFF';
        bannerContainer.style.border = '1px solid rgba(70,55,35,.22)';
        bannerContainer.style.borderRadius = '4px';
        bannerContainer.style.padding = '18px 24px';
        bannerContainer.style.marginBottom = '32px';
        bannerContainer.style.alignItems = 'center';
        bannerContainer.style.justifyContent = 'space-between';
        bannerContainer.style.gap = '20px';

        bannerContainer.innerHTML = `
            <div class="cltr-wallet-status">
                <div class="cltr-status-indicator" id="w-dot" style="background:#D82224;"></div>
                <div class="cltr-wallet-text">
                    <span id="w-status" style="font-family:var(--font-data); font-size:10px; font-weight:700; color:#111; letter-spacing:0.5px; text-transform:uppercase;">DISCONNECTED</span>
                    <span class="cltr-wallet-hash" id="w-addr">—</span>
                </div>
            </div>
            <button class="cltr-connect-btn" id="w-connect-btn">CONNECT IDENTITY</button>
        `;
    }

    function renderConnectedBanner(address, formattedBalance) {
        if (!bannerContainer) return;
        bannerContainer.className = 'cltr-wallet-banner connected';
        bannerContainer.style.display = 'grid';
        bannerContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        bannerContainer.style.background = '#FFFFFF';
        bannerContainer.style.border = '1px solid rgba(70,55,35,.22)';
        bannerContainer.style.borderRadius = '4px';
        bannerContainer.style.padding = '18px 24px';
        bannerContainer.style.marginBottom = '32px';
        bannerContainer.style.alignItems = 'center';
        bannerContainer.style.gap = '24px';

        const shortAddr = address.slice(0, 6) + '...' + address.slice(-4);

        bannerContainer.innerHTML = `
            <div class="cltr-wallet-status" style="border-right: 1px solid rgba(70,55,35,.22); padding-right:24px;">
                <div class="cltr-status-indicator connected" style="background:#10B981; animation: pulseIndicator 2.5s infinite;"></div>
                <div class="cltr-wallet-text">
                    <span style="font-family:var(--font-data); font-size:10px; font-weight:700; color:#10B981; letter-spacing:0.5px; display:block;">CONNECTED</span>
                    <span class="cltr-wallet-hash" style="display:block; font-size:11px; margin-top:2px; margin-left:0; background:none; padding:0; color:#555;" id="w-addr">${shortAddr}</span>
                </div>
            </div>
            <div style="border-right: 1px solid rgba(70,55,35,.22); padding-right:24px;">
                <span style="font-family:var(--font-data); font-size:8px; color:#888; text-transform:uppercase; display:block; letter-spacing:0.5px;">Conviction Balance</span>
                <span style="font-family:var(--font-data); font-size:13px; font-weight:700; color:#111; display:block; margin-top:2px;" id="banner-balance">${formattedBalance} CLTR</span>
            </div>
            <div style="border-right: 1px solid rgba(70,55,35,.22); padding-right:24px;">
                <span style="font-family:var(--font-data); font-size:8px; color:#888; text-transform:uppercase; display:block; letter-spacing:0.5px;">Network</span>
                <span style="font-family:var(--font-data); font-size:12px; font-weight:700; color:#7A1C29; display:block; margin-top:2px;">Robinhood Mainnet</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-family:var(--font-data); font-size:8px; color:#888; text-transform:uppercase; display:block; letter-spacing:0.5px;">Identity status</span>
                    <span style="font-family:var(--font-data); font-size:11px; font-weight:700; color:#10B981; display:block; margin-top:2px;">Verified Identity</span>
                </div>
                <button class="cltr-connect-btn connected" id="w-disconnect-btn" style="padding: 6px 12px; font-size: 8px;">DISCONNECT</button>
            </div>
        `;
    }

    function updateTxStep(stepId, status) {
        const el = document.getElementById(stepId);
        if (!el) return;
        const indicator = el.querySelector('.step-indicator');
        if (status === 'pending') {
            el.style.color = '#7A1C29';
            el.style.fontWeight = '700';
            if (indicator) indicator.innerText = '[/]';
        } else if (status === 'success') {
            el.style.color = '#10B981';
            el.style.fontWeight = '700';
            if (indicator) indicator.innerText = '[x]';
        } else {
            el.style.color = '#888';
            el.style.fontWeight = 'normal';
            if (indicator) indicator.innerText = '[ ]';
        }
    }

    function resetTxSteps(hasApprove = false, completionText = "Commitment Completed") {
        const stepApproveEl = document.getElementById('step-approve');
        if (stepApproveEl) {
            stepApproveEl.style.display = hasApprove ? 'flex' : 'none';
        }
        const stepDoneTextEl = document.getElementById('step-done-text');
        if (stepDoneTextEl) {
            stepDoneTextEl.innerText = completionText;
        }

        updateTxStep('step-approve', 'inactive');
        updateTxStep('step-sign', 'inactive');
        updateTxStep('step-submit', 'inactive');
        updateTxStep('step-confirm', 'inactive');
        updateTxStep('step-done', 'inactive');
    }

    const focalTotalCommitted = document.getElementById('focal-total-committed');
    const focalTotalBurned = document.getElementById('focal-total-burned');

    const metricConvictionBal = document.getElementById('metric-conviction-bal');
    const metricCommittedCollateral = document.getElementById('metric-committed-collateral');
    const metricYieldEarned = document.getElementById('metric-yield-earned');
    const metricProtocolSupply = document.getElementById('metric-protocol-supply');

    const stakeInput = document.getElementById('stake-input');
    const maxBtn = document.getElementById('stake-max-btn');
    const stakeBtn = document.getElementById('stake-btn');
    const lockPills = document.querySelectorAll('.cltr-lock-pill');
    const calcApy = document.getElementById('calc-apy');
    const calcYield = document.getElementById('calc-yield');
    const calcTotal = document.getElementById('calc-total');

    const stakesCount = document.getElementById('stakes-count');
    const stakesTbody = document.getElementById('stakes-tbody');

    const txModal = document.getElementById('tx-modal');
    const txTitle = document.getElementById('tx-title');
    const txSub = document.getElementById('tx-sub');

    // Reputation
    const repScore = document.getElementById('rep-score');
    const repRank = document.getElementById('rep-rank');
    const repSuccessRate = document.getElementById('rep-success-rate');
    const repContractsCompleted = document.getElementById('rep-contracts-completed');
    const repRankNum = document.getElementById('rep-rank-num');

    // Vesting elements
    const founderProgress = document.getElementById('founder-vest-progress');
    const founderVestedLabel = document.getElementById('founder-vested-label');
    const founderTimeRemaining = document.getElementById('founder-time-remaining');
    const founderClaimableLabel = document.getElementById('founder-claimable-label');
    const founderClaimBtn = document.getElementById('founder-claim-btn');

    const teamProgress = document.getElementById('team-vest-progress');
    const teamVestedLabel = document.getElementById('team-vested-label');
    const teamTimeRemaining = document.getElementById('team-time-remaining');
    const teamClaimableLabel = document.getElementById('team-claimable-label');
    const teamClaimBtn = document.getElementById('team-claim-btn');

    // Health elements
    const healthActiveContracts = document.getElementById('health-active-contracts');
    const healthEscrowLocked = document.getElementById('health-escrow-locked');
    const healthBurnedToday = document.getElementById('health-burned-today');
    const healthCirculating = document.getElementById('health-circulating');

    const burnToday = document.getElementById('burn-today');
    const burnWeek = document.getElementById('burn-week');
    const burnTotal = document.getElementById('burn-total');

    const activityFeed = document.getElementById('activity-feed');

    // Copy Address Click events
    const founderAddrCopy = document.getElementById('founder-addr-copy');
    if (founderAddrCopy) {
        founderAddrCopy.innerText = FOUNDER_VESTING_ADDRESS.slice(0, 6) + '...' + FOUNDER_VESTING_ADDRESS.slice(-4);
        founderAddrCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(FOUNDER_VESTING_ADDRESS);
            alert('Founder Vesting address copied!');
        });
    }
    const teamAddrCopy = document.getElementById('team-addr-copy');
    if (teamAddrCopy) {
        teamAddrCopy.innerText = TEAM_VESTING_ADDRESS.slice(0, 6) + '...' + TEAM_VESTING_ADDRESS.slice(-4);
        teamAddrCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(TEAM_VESTING_ADDRESS);
            alert('Team Vesting address copied!');
        });
    }

    // Local state variables
    let userAddress;
    let balance = 0n;
    let stakedBalance = 0n;
    let activeAPY = 5;
    let activeDuration = 30;
    let activeStakesList = [];

    // Vesting stats variables
    const vestingStart = 1717171200; // June 1, 2024
    const vestingDuration = 4 * 365 * 24 * 60 * 60; // 4 Years
    const vestingCliff = 365 * 24 * 60 * 60; // 1 Year

    function getAPY(days) {
        if (days === 30) return 5;
        if (days === 90) return 10;
        if (days === 180) return 15;
        if (days === 365) return 25;
        return 5;
    }

    function formatNumber(num) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 1. Fetch live protocol stats (Loads even without wallet)
    async function loadPublicStats() {
        try {
            const res = await fetch(`${API_BASE_URL}/v1/token/stats`);
            const data = await res.json();
            if (data.ok) {
                const s = data.stats;
                focalTotalCommitted.innerText = formatNumber(s.capitalCommitted) + ' CLTR';
                focalTotalBurned.innerText = formatNumber(s.totalBurned) + ' CLTR';
                metricProtocolSupply.innerText = formatNumber(s.circulatingSupply);

                // Health card aggregates
                healthActiveContracts.innerText = s.activeContracts.toString();
                healthEscrowLocked.innerText = formatNumber(s.capitalCommitted) + ' CLTR';
                healthBurnedToday.innerText = '14,210 CLTR'; // Daily Burn constant target
                healthCirculating.innerText = formatNumber(s.circulatingSupply) + ' CLTR';

                // Burn period grid
                burnToday.innerText = '14,210';
                burnWeek.innerText = '98,420';
                burnTotal.innerText = formatNumber(s.totalBurned);

                // Update Overview snapshot if elements exist
                const snapCommitments = document.getElementById('snap-total-commitments');
                const snapLocked = document.getElementById('snap-capital-locked');
                const snapBurned = document.getElementById('snap-cltr-burned');
                if (snapCommitments) snapCommitments.innerText = s.activeContracts.toString();
                if (snapLocked) snapLocked.innerText = formatNumber(s.capitalCommitted) + ' CLTR';
                if (snapBurned) snapBurned.innerText = formatNumber(s.totalBurned) + ' CLTR';
            }
        } catch (err) {
            console.error('Failed loading live public stats:', err);
        }
    }

    // 2. Fetch live blockchain indexed activity
    async function loadLiveActivity() {
        try {
            const res = await fetch(`${API_BASE_URL}/v1/token/activity`);
            const data = await res.json();
            if (data.ok && data.events.length > 0) {
                activityFeed.innerHTML = data.events.map(ev => {
                    let text = '';
                    if (ev.eventType === 'BURN') text = `Burned ${formatNumber(parseFloat(ev.amount))} CLTR from protocol execution fees.`;
                    if (ev.eventType === 'STAKE') text = `Committed ${formatNumber(parseFloat(ev.amount))} CLTR lockup.`;
                    if (ev.eventType === 'UNSTAKE') text = `Unstaked ${formatNumber(parseFloat(ev.amount))} CLTR commitment.`;
                    if (ev.eventType === 'VESTING_RELEASE') text = `Released ${formatNumber(parseFloat(ev.amount))} CLTR vested tokens.`;
                    if (ev.eventType === 'SETTLEMENT') text = `Settled self-betting contract escrow payout.`;

                    const dateStr = new Date(ev.blockTimestamp).toLocaleTimeString('en-US', { hour12: false });
                    const expLink = `https://explorer.mainnet.chain.robinhood.com/tx/${ev.txHash}`;

                    return `
                        <div class="cltr-feed-item">
                            <span class="cltr-feed-icon">${ev.eventType === 'BURN' ? '' : '✓'}</span>
                            <div class="cltr-feed-details">
                                <span class="cltr-feed-text">${text}</span>
                                <span class="cltr-feed-time">${dateStr} UTC <a href="${expLink}" target="_blank" class="cltr-feed-txlink">View</a></span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activityFeed.innerHTML = '<div style="text-align:center; color:#999; font-size:11px; padding:12px;">No recent block transactions found.</div>';
            }
        } catch (err) {
            console.error('Failed loading live activity log:', err);
        }
    }

    // 3. Update Staking Calculator
    function updateStakingCalc() {
        const val = parseFloat(stakeInput.value) || 0;
        const interest = val * (activeAPY / 100) * (activeDuration / 365);
        calcApy.innerText = `${activeAPY.toFixed(1)}%`;
        calcYield.innerText = `${formatNumber(interest)} CLTR`;
        calcTotal.innerText = `${formatNumber(val + interest)} CLTR`;

        if (userAddress && val > 0 && parseUnits(stakeInput.value, 18) <= balance) {
            stakeBtn.removeAttribute('disabled');
        } else {
            stakeBtn.setAttribute('disabled', 'true');
        }
    }

    // 4. Load Active Stake Positions
    async function loadStakingPositions() {
        if (!userAddress || STAKING_ADDRESS === '0x0000000000000000000000000000000000000000') {
            stakesTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; color:#999; padding: 24px;">Connect wallet to view active positions.</td>
                </tr>
            `;
            stakesCount.innerText = '0 Positions';
            return;
        }

        try {
            const rawStakes = await readContract(wagmiAdapter.wagmiConfig, {
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'getStakesOf',
                args: [userAddress]
            });

            activeStakesList = rawStakes.map((item, idx) => ({
                index: idx,
                amount: item.amount,
                startTime: Number(item.startTime) * 1000,
                endTime: Number(item.endTime) * 1000,
                yield: item.yield,
                durationDays: Number(item.durationDays),
                apy: Number(item.apy),
                active: item.active
            })).filter(item => item.active);

            stakesCount.innerText = `${activeStakesList.length} Position${activeStakesList.length === 1 ? '' : 's'}`;

            if (activeStakesList.length === 0) {
                stakesTbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; color:#999; padding: 24px;">No active stakes on-chain.</td>
                    </tr>
                `;
                return;
            }

            const now = Date.now();
            stakesTbody.innerHTML = activeStakesList.map(item => {
                const elapsed = now - item.startTime;
                const totalDur = item.endTime - item.startTime;
                const progress = Math.min(100, Math.max(0, (elapsed / totalDur) * 100));
                const isMatured = now >= item.endTime;

                const endDateStr = new Date(item.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
                const statusBadge = isMatured 
                    ? `<span class="cltr-badge matured" style="color:#10B981; font-weight:700;">Matured</span>` 
                    : `<span class="cltr-badge locked" style="color:#888;">Locked</span>`;

                return `
                    <tr>
                        <td><strong>${formatNumber(parseFloat(formatUnits(item.amount, 18)))} CLTR</strong></td>
                        <td>${item.durationDays} Days @ ${item.apy}%</td>
                        <td>
                            <div class="cltr-progress-bar-mini">
                                <div class="cltr-progress-bar-mini-fill" style="width: ${progress}%"></div>
                            </div>
                            ${endDateStr}
                        </td>
                        <td style="color:#10B981;">+${formatNumber(parseFloat(formatUnits(item.yield, 18)))}</td>
                        <td>${statusBadge}</td>
                        <td><button class="cltr-unstake-btn" data-idx="${item.index}" ${isMatured ? '' : 'disabled'}>Unstake</button></td>
                    </tr>
                `;
            }).join('');

            // Wire up unstake click events
            document.querySelectorAll('.cltr-unstake-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const idx = parseInt(this.getAttribute('data-idx') || '0');
                    await unstakeTokens(idx);
                });
            });

        } catch (err) {
            console.error('Failed reading stakes from on-chain:', err);
        }
    }

    // 5. Vesting calculations ticker
    async function loadVestingEscrows() {
        if (!userAddress) return;

        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const elapsed = nowSec - vestingStart;

            // Founder calculations
            const founderTotal = 50000000n;
            let founderVested = 0n;
            let founderReleased = 0n;
            let founderClaimable = 0n;
            let founderTimeText = '';
            let founderPct = 0;

            if (FOUNDER_VESTING_ADDRESS !== '0x0000000000000000000000000000000000000000') {
                founderReleased = await readContract(wagmiAdapter.wagmiConfig, {
                    address: FOUNDER_VESTING_ADDRESS,
                    abi: VESTING_ABI,
                    functionName: 'released'
                });

                const rawVested = await readContract(wagmiAdapter.wagmiConfig, {
                    address: FOUNDER_VESTING_ADDRESS,
                    abi: VESTING_ABI,
                    functionName: 'vestedAmount'
                });
                founderVested = rawVested;
                founderClaimable = founderVested - founderReleased;
            }

            if (elapsed >= vestingCliff) {
                founderPct = (elapsed / vestingDuration) * 100;
                if (elapsed >= vestingDuration) {
                    founderTimeText = 'Escrow Finished';
                    founderPct = 100;
                } else {
                    const daysLeft = Math.ceil((vestingDuration - elapsed) / (24 * 60 * 60));
                    founderTimeText = `${daysLeft} days left`;
                }
            } else {
                founderTimeText = 'Locked (Cliff: 1 Year)';
                founderPct = (elapsed / vestingCliff) * 25;
            }

            founderProgress.style.width = `${Math.min(100, founderPct)}%`;
            founderVestedLabel.innerText = `${formatNumber(parseFloat(formatUnits(founderVested, 18)))} CLTR`;
            founderTimeRemaining.innerText = founderTimeText;
            founderClaimableLabel.innerText = `${formatNumber(parseFloat(formatUnits(founderClaimable, 18)))} CLTR`;
            if (founderClaimable > 0n) {
                founderClaimBtn.removeAttribute('disabled');
            } else {
                founderClaimBtn.setAttribute('disabled', 'true');
            }

            // Team calculations
            const teamTotal = 150000000n;
            let teamVested = 0n;
            let teamReleased = 0n;
            let teamClaimable = 0n;
            let teamTimeText = '';
            let teamPct = 0;

            if (TEAM_VESTING_ADDRESS !== '0x0000000000000000000000000000000000000000') {
                teamReleased = await readContract(wagmiAdapter.wagmiConfig, {
                    address: TEAM_VESTING_ADDRESS,
                    abi: VESTING_ABI,
                    functionName: 'released'
                });

                const rawVested = await readContract(wagmiAdapter.wagmiConfig, {
                    address: TEAM_VESTING_ADDRESS,
                    abi: VESTING_ABI,
                    functionName: 'vestedAmount'
                });
                teamVested = rawVested;
                teamClaimable = teamVested - teamReleased;
            }

            if (elapsed >= vestingCliff) {
                teamPct = (elapsed / vestingDuration) * 100;
                if (elapsed >= vestingDuration) {
                    teamTimeText = 'Escrow Finished';
                    teamPct = 100;
                } else {
                    const daysLeft = Math.ceil((vestingDuration - elapsed) / (24 * 60 * 60));
                    teamTimeText = `${daysLeft} days left`;
                }
            } else {
                teamTimeText = 'Locked (Cliff: 1 Year)';
                teamPct = (elapsed / vestingCliff) * 25;
            }

            teamProgress.style.width = `${Math.min(100, teamPct)}%`;
            teamVestedLabel.innerText = `${formatNumber(parseFloat(formatUnits(teamVested, 18)))} CLTR`;
            teamTimeRemaining.innerText = teamTimeText;
            teamClaimableLabel.innerText = `${formatNumber(parseFloat(formatUnits(teamClaimable, 18)))} CLTR`;
            if (teamClaimable > 0n) {
                teamClaimBtn.removeAttribute('disabled');
            } else {
                teamClaimBtn.setAttribute('disabled', 'true');
            }

        } catch (err) {
            console.error('Failed reading vesting contracts:', err);
        }
    }

    function startVestingTicker() {
        if (window.tokenVestingInterval) clearInterval(window.tokenVestingInterval);
        loadVestingEscrows();
        window.tokenVestingInterval = setInterval(loadVestingEscrows, 10000);
    }

    // 6. Connect Account & Chain Gating
    async function loadAccountData() {
        if (!userAddress) return;

        try {
            // Read balances
            if (CLTR_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000') {
                const bal = await readContract(wagmiAdapter.wagmiConfig, {
                    address: CLTR_TOKEN_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [userAddress]
                });
                balance = bal;
                const formattedBal = formatNumber(parseFloat(formatUnits(balance, 18)));
                metricConvictionBal.innerText = formattedBal;
                
                // Keep connected banner in sync
                const bannerBalEl = document.getElementById('banner-balance');
                if (bannerBalEl) {
                    bannerBalEl.innerText = `${formattedBal} CLTR`;
                } else {
                    renderConnectedBanner(userAddress, formattedBal);
                }
            }

            if (STAKING_ADDRESS !== '0x0000000000000000000000000000000000000000') {
                const totalStaked = activeStakesList.reduce((sum, item) => sum + item.amount, 0n);
                stakedBalance = totalStaked;
                metricCommittedCollateral.innerText = formatNumber(parseFloat(formatUnits(stakedBalance, 18)));

                const accruedRewards = activeStakesList.reduce((sum, item) => sum + item.yield, 0n);
                metricYieldEarned.innerText = formatNumber(parseFloat(formatUnits(accruedRewards, 18)));
            }

            // Reputation metrics derivation - Load from authenticated account if logged in
            if (window.api.hasAuthToken()) {
                try {
                    const [profile, contractsRes] = await Promise.all([
                        window.api.getProfile(),
                        window.api.getContracts()
                    ]);

                    const contracts = contractsRes?.contracts || [];
                    const settled = contracts.filter(c => c.isTerminal);
                    const wins = settled.filter(c => ['SETTLED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(c.derivedState || c.state));
                    
                    const winRate = settled.length > 0 ? (wins.length / settled.length) : 1;
                    const successPct = (winRate * 100).toFixed(1) + '%';
                    const completedCount = settled.length;

                    // Derive rep score out of 1000
                    const score = Math.round(500 + (winRate * 300) + Math.min(completedCount * 20, 200));
                    
                    let rankLabel = 'Tier III Candidate';
                    if (score >= 850) rankLabel = 'Tier I Guardian';
                    else if (score >= 650) rankLabel = 'Tier II Custodian';

                    // Determine global ranking index based on completed count
                    const globalRankIndex = Math.max(1, 1000 - (completedCount * 12));

                    repScore.innerText = `${score} / 1000`;
                    repRank.innerText = rankLabel;
                    repSuccessRate.innerText = successPct;
                    repContractsCompleted.innerText = completedCount.toString();
                    repRankNum.innerText = `#${globalRankIndex} Global`;

                } catch (profileErr) {
                    console.error('Failed loading authenticated profile details for reputation:', profileErr);
                    // Fallback to standard defaults
                    repScore.innerText = '500 / 1000';
                    repRank.innerText = 'Tier III Candidate';
                    repSuccessRate.innerText = '100%';
                    repContractsCompleted.innerText = '0';
                    repRankNum.innerText = '#999 Global';
                }
            } else {
                // Not logged in to Collateral account - show placeholder indicating it requires connection
                repScore.innerText = '—';
                repRank.innerText = 'AUTH REQUIRED';
                repSuccessRate.innerText = '—';
                repContractsCompleted.innerText = '—';
                repRankNum.innerText = '—';
            }

            stakeInput.removeAttribute('disabled');
            lockPills.forEach(p => p.removeAttribute('disabled'));

            startVestingTicker();
        } catch (err) {
            console.error('Failed loading account details:', err);
        }
    }

    function resetUIData() {
        renderDisconnectedBanner();

        metricConvictionBal.innerText = '—';
        metricCommittedCollateral.innerText = '—';
        metricYieldEarned.innerText = '—';

        repScore.innerText = '—';
        repRank.innerText = 'CONNECT WALLET';
        repSuccessRate.innerText = '—';
        repContractsCompleted.innerText = '—';
        repRankNum.innerText = '—';

        stakeInput.setAttribute('disabled', 'true');
        stakeInput.value = '';
        lockPills.forEach(p => p.setAttribute('disabled', 'true'));
        stakeBtn.setAttribute('disabled', 'true');

        if (window.tokenVestingInterval) clearInterval(window.tokenVestingInterval);
        
        founderVestedLabel.innerText = '—';
        founderTimeRemaining.innerText = '—';
        founderClaimableLabel.innerText = '—';
        founderProgress.style.width = '0%';
        founderClaimBtn.setAttribute('disabled', 'true');

        teamVestedLabel.innerText = '—';
        teamTimeRemaining.innerText = '—';
        teamClaimableLabel.innerText = '—';
        teamProgress.style.width = '0%';
        teamClaimBtn.setAttribute('disabled', 'true');

        renderStakesTable();
    }

    function checkChainNetwork(account) {
        const chainId = account.chainId;
        if (chainId !== 4663) {
            resetTxSteps(false, "Switch to Robinhood Chain");
            updateTxStep('step-sign', 'pending');
            txModal.classList.add('open');
            
            // Try to auto-switch network
            switchChain(wagmiAdapter.wagmiConfig, { chainId: 4663 }).catch(() => {
                console.warn('Auto network switch rejected by user wallet.');
            });
            return false;
        } else {
            txModal.classList.remove('open');
            return true;
        }
    }

    // Watch account connection using Wagmi
    window.app.updateTokenConnectedState = async function () {
        const account = getAccount(wagmiAdapter.wagmiConfig);
        if (account.isConnected && account.address) {
            userAddress = account.address;
            const formattedBal = formatNumber(parseFloat(formatUnits(balance, 18)));
            renderConnectedBanner(userAddress, formattedBal);

            if (checkChainNetwork(account)) {
                await loadStakingPositions();
                await loadAccountData();
            }
        } else {
            userAddress = undefined;
            resetUIData();
        }
    };

    watchAccount(wagmiAdapter.wagmiConfig, {
        async onChange(account) {
            if (window.app.updateTokenConnectedState) {
                await window.app.updateTokenConnectedState();
            }
        }
    });

    // Connect trigger via event delegation on parent banner
    if (bannerContainer) {
        bannerContainer.addEventListener('click', async (e) => {
            if (e.target && (e.target.id === 'w-connect-btn' || e.target.closest('#w-connect-btn'))) {
                modal.open();
            } else if (e.target && (e.target.id === 'w-disconnect-btn' || e.target.closest('#w-disconnect-btn'))) {
                await disconnect(wagmiAdapter.wagmiConfig);
                userAddress = undefined;
                resetUIData();
            }
        });
    }

    // Max stake amount selection
    maxBtn.addEventListener('click', () => {
        if (!userAddress) return;
        stakeInput.value = formatUnits(balance, 18);
        updateStakingCalc();
    });

    stakeInput.addEventListener('input', (e) => {
        let cleaned = e.target.value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
        }
        if (e.target.value !== cleaned) {
            e.target.value = cleaned;
        }
        updateStakingCalc();
    });

    // Duration pills
    lockPills.forEach(pill => {
        pill.addEventListener('click', function() {
            if (!userAddress) return;
            lockPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            activeDuration = parseInt(this.getAttribute('data-days') || '30');
            activeAPY = getAPY(activeDuration);
            updateStakingCalc();
        });
    });

    // 7. Write Transactions: Staking Token
    stakeBtn.addEventListener('click', async () => {
        const val = parseFloat(stakeInput.value) || 0;
        if (!userAddress || val <= 0) return;

        const amountBig = parseUnits(stakeInput.value, 18);

        try {
            const allowance = await readContract(wagmiAdapter.wagmiConfig, {
                address: CLTR_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [userAddress, STAKING_ADDRESS]
            });

            const needsApprove = allowance < amountBig;
            resetTxSteps(needsApprove, "Commitment Created");
            txModal.classList.add('open');

            if (needsApprove) {
                // 1. Approving CLTR
                updateTxStep('step-approve', 'pending');
                updateTxStep('step-sign', 'pending');

                const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
                    address: CLTR_TOKEN_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [STAKING_ADDRESS, amountBig]
                });

                const appTx = await writeContract(wagmiAdapter.wagmiConfig, request);
                updateTxStep('step-sign', 'success');
                updateTxStep('step-submit', 'pending');
                updateTxStep('step-confirm', 'pending');

                await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: appTx });
                updateTxStep('step-approve', 'success');
                updateTxStep('step-submit', 'success');
                updateTxStep('step-confirm', 'success');
            }

            // 2. Staking
            updateTxStep('step-sign', 'pending');
            updateTxStep('step-submit', 'inactive');
            updateTxStep('step-confirm', 'inactive');

            const { request: stakeRequest } = await simulateContract(wagmiAdapter.wagmiConfig, {
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [amountBig, BigInt(activeDuration)]
            });

            const stakeTx = await writeContract(wagmiAdapter.wagmiConfig, stakeRequest);
            updateTxStep('step-sign', 'success');
            updateTxStep('step-submit', 'pending');
            updateTxStep('step-confirm', 'pending');

            await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: stakeTx });
            updateTxStep('step-submit', 'success');
            updateTxStep('step-confirm', 'success');
            updateTxStep('step-done', 'success');

            setTimeout(async () => {
                txModal.classList.remove('open');
                stakeInput.value = '';
                await loadStakingPositions();
                await loadAccountData();
                await loadPublicStats();
                await loadLiveActivity();
            }, 2000);

        } catch (err) {
            console.error('Stake transaction failed:', err);
            // Mark failed indicator
            const activeStep = document.querySelector('.cltr-step[style*="font-weight: 700"]');
            if (activeStep) {
                const indicator = activeStep.querySelector('.step-indicator');
                if (indicator) indicator.innerText = '[!]';
                activeStep.style.color = '#D82224';
            }
            setTimeout(() => txModal.classList.remove('open'), 4000);
        }
    });

    async function unstakeTokens(idx) {
        if (!userAddress) return;

        resetTxSteps(false, "Escrow Released");
        updateTxStep('step-sign', 'pending');
        txModal.classList.add('open');

        try {
            // Pre-flight simulation
            const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'unstake',
                args: [BigInt(idx)]
            });

            const tx = await writeContract(wagmiAdapter.wagmiConfig, request);
            updateTxStep('step-sign', 'success');
            updateTxStep('step-submit', 'pending');
            updateTxStep('step-confirm', 'pending');

            await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: tx });
            updateTxStep('step-submit', 'success');
            updateTxStep('step-confirm', 'success');
            updateTxStep('step-done', 'success');

            setTimeout(async () => {
                txModal.classList.remove('open');
                await loadStakingPositions();
                await loadAccountData();
                await loadPublicStats();
                await loadLiveActivity();
            }, 2000);

        } catch (err) {
            console.error('Unstake transaction failed:', err);
            const activeStep = document.querySelector('.cltr-step[style*="font-weight: 700"]');
            if (activeStep) {
                const indicator = activeStep.querySelector('.step-indicator');
                if (indicator) indicator.innerText = '[!]';
                activeStep.style.color = '#D82224';
            }
            setTimeout(() => txModal.classList.remove('open'), 4000);
        }
    }

    // 9. Write Transactions: Vesting Claims
    founderClaimBtn.addEventListener('click', async () => {
        if (!userAddress) return;

        resetTxSteps(false, "Tokens Released");
        updateTxStep('step-sign', 'pending');
        txModal.classList.add('open');

        try {
            // Pre-flight simulation
            const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
                address: FOUNDER_VESTING_ADDRESS,
                abi: VESTING_ABI,
                functionName: 'release'
            });

            const tx = await writeContract(wagmiAdapter.wagmiConfig, request);
            updateTxStep('step-sign', 'success');
            updateTxStep('step-submit', 'pending');
            updateTxStep('step-confirm', 'pending');

            await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: tx });
            updateTxStep('step-submit', 'success');
            updateTxStep('step-confirm', 'success');
            updateTxStep('step-done', 'success');

            setTimeout(async () => {
                txModal.classList.remove('open');
                await loadAccountData();
                await loadPublicStats();
                await loadLiveActivity();
            }, 2000);

        } catch (err) {
            console.error('Founder release transaction failed:', err);
            const activeStep = document.querySelector('.cltr-step[style*="font-weight: 700"]');
            if (activeStep) {
                const indicator = activeStep.querySelector('.step-indicator');
                if (indicator) indicator.innerText = '[!]';
                activeStep.style.color = '#D82224';
            }
            setTimeout(() => txModal.classList.remove('open'), 4000);
        }
    });

    teamClaimBtn.addEventListener('click', async () => {
        if (!userAddress) return;

        resetTxSteps(false, "Tokens Released");
        updateTxStep('step-sign', 'pending');
        txModal.classList.add('open');

        try {
            // Pre-flight simulation
            const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
                address: TEAM_VESTING_ADDRESS,
                abi: VESTING_ABI,
                functionName: 'release'
            });

            const tx = await writeContract(wagmiAdapter.wagmiConfig, request);
            updateTxStep('step-sign', 'success');
            updateTxStep('step-submit', 'pending');
            updateTxStep('step-confirm', 'pending');

            await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: tx });
            updateTxStep('step-submit', 'success');
            updateTxStep('step-confirm', 'success');
            updateTxStep('step-done', 'success');

            setTimeout(async () => {
                txModal.classList.remove('open');
                await loadAccountData();
                await loadPublicStats();
                await loadLiveActivity();
            }, 2000);

        } catch (err) {
            console.error('Team release transaction failed:', err);
            const activeStep = document.querySelector('.cltr-step[style*="font-weight: 700"]');
            if (activeStep) {
                const indicator = activeStep.querySelector('.step-indicator');
                if (indicator) indicator.innerText = '[!]';
                activeStep.style.color = '#D82224';
            }
            setTimeout(() => txModal.classList.remove('open'), 4000);
        }
    });

    function renderStakesTable() {
        stakesTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#999; padding: 24px;">Connect wallet to view active locked positions.</td>
            </tr>
        `;
        stakesCount.innerText = '0 Positions';
    }

    // Init views on launch
    loadPublicStats();
    loadLiveActivity();
    
    // Refresh stats & activity feed every 20s
    window.tokenStatsInterval = setInterval(() => {
        loadPublicStats();
        loadLiveActivity();
    }, 20000);

    const initialAccount = getAccount(wagmiAdapter.wagmiConfig);
    if (initialAccount.isConnected && initialAccount.address) {
        userAddress = initialAccount.address;
        renderConnectedBanner(userAddress, '—');

        if (checkChainNetwork(initialAccount)) {
            loadStakingPositions();
            loadAccountData();
        }
    } else {
        resetUIData();
    }

    // ── Count-up Statistics Animations ──
    function animateValue(obj, start, end, duration, formatFn) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = formatFn(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function triggerStatsCountUp() {
        const verifiedEl = document.getElementById('stat-verified');
        const protectedEl = document.getElementById('stat-protected');
        const rateEl = document.getElementById('stat-rate');
        const burnedEl = document.getElementById('stat-burned');

        if (verifiedEl) {
            animateValue(verifiedEl, 0, 12431, 1000, (v) => Math.floor(v).toLocaleString('en-US'));
        }
        if (protectedEl) {
            animateValue(protectedEl, 0, 183, 1000, (v) => '$' + Math.floor(v) + 'M');
        }
        if (rateEl) {
            animateValue(rateEl, 0, 98.7, 1000, (v) => v.toFixed(1) + '%');
        }
        if (burnedEl) {
            animateValue(burnedEl, 0, 1.2, 1000, (v) => v.toFixed(1) + 'M CLTR');
        }
    }

    // ── Sub-tabs logic ──
    const subtabs = document.querySelectorAll('.cltr-subnav-btn');
    const panels = document.querySelectorAll('.cltr-tab-panel');

    function switchTab(tabId) {
        subtabs.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        panels.forEach(p => {
            if (p.id === `cltr-tab-${tabId}`) {
                p.classList.remove('hidden');
            } else {
                p.classList.add('hidden');
            }
        });
        if (tabId === 'overview') {
            triggerStatsCountUp();
        }
    }

    window.app.switchProtocolTab = function(tabId) {
        switchTab(tabId);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabId);
        window.history.pushState({}, '', url.toString());
    };

    subtabs.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
            // Push query parameter to history
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tabId);
            window.history.pushState({}, '', url.toString());
        });
    });

    // Read initial tab parameter
    const searchParams = new URLSearchParams(window.location.search);
    const defaultTab = searchParams.get('tab') || 'overview';
    switchTab(defaultTab);
}
