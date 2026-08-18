import { hasAuthToken } from '../api.js';
import { getAccount, readContract, simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseUnits } from 'viem';
import { wagmiAdapter } from '../web3.js';

const cleanAddress = (addr) => (addr || '').replace(/['"]/g, '').trim();

const CLTR_TOKEN_ADDRESS = cleanAddress(import.meta.env.VITE_CLTR_TOKEN) || '0x7b69C7E57d7004EB2374E5Aabb9db5334aE73B9f';
const STAKING_ADDRESS = cleanAddress(import.meta.env.VITE_STAKING) || '0x6A95484e05dD7139C7A4De192dd2f26A2a91F69e';

const ERC20_ABI = [
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }
];

const STAKING_ABI = [
    { name: 'stake', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'duration', type: 'uint256' }], outputs: [] }
];

let _modalEl = null;

function ensureModal() {
    if (_modalEl) return _modalEl;

    const wrapper = document.createElement('div');
    wrapper.id = 'exec-modal-root';
    wrapper.innerHTML = `
        <style>
            #exec-modal-root { display: none; }
            #exec-modal-root.open { display: block; }

            .exec-backdrop {
                position: fixed; inset: 0; z-index: 200;
                background: rgba(0,0,0,0.50);
                backdrop-filter: blur(4px);
                animation: exec-fade 150ms ease forwards;
            }
            @keyframes exec-fade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .exec-modal {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0.98);
                z-index: 201;
                width: 100%; max-width: 480px;
                background: #F5EDDA;
                border: 1px solid #d4d4d4;
                border-top: 2px solid #752122;
                border-radius: 6px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.03);
                animation: exec-scale 180ms ease forwards;
                overflow: hidden;
            }
            @keyframes exec-scale {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.98); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            /* Header */
            .exec-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(70,55,35,.22);
                background: #FAF4E6;
            }
            .exec-header-title {
                font-size: 11px; font-weight: 600; color: #374151;
                font-family: 'Inter', var(--font-data);
                text-transform: uppercase; letter-spacing: 0.08em;
            }
            .exec-header-id {
                font-size: 10px; color: #9ca3af;
                font-family: var(--font-data);
                letter-spacing: 0.04em;
            }

            /* Body */
            .exec-body { padding: 20px; }

            /* ── Stake Picker ── */
            .exec-tier-row {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 14px;
            }
            .exec-tier-label {
                font-size: 11px; font-weight: 600; color: #374151;
                font-family: var(--font-data);
                text-transform: uppercase; letter-spacing: 0.06em;
            }
            .exec-tier-badge {
                font-size: 11px; font-weight: 700; color: #111;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                text-transform: uppercase; letter-spacing: 0.04em;
            }
            .exec-stake-presets {
                display: flex; gap: 0; margin-bottom: 20px;
                border: 1px solid #d4d4d4; border-radius: 6px; overflow: hidden;
            }
            .exec-stake-btn {
                flex: 1; padding: 10px 0; border: none;
                background: #F5EDDA; color: #374151;
                font-size: 13px; font-weight: 600;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                cursor: pointer; transition: all 120ms ease;
                border-right: 1px solid rgba(70,55,35,.22);
                font-variant-numeric: tabular-nums;
            }
            .exec-stake-btn:last-child { border-right: none; }
            .exec-stake-btn:hover { background: #f5f5f5; }
            .exec-stake-btn.active {
                background: #111; color: #fff;
            }
            .exec-stake-btn.active:hover { background: #222; }

            /* Outcome Rows */
            .exec-outcome {
                display: flex; justify-content: space-between; align-items: center;
                padding: 11px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .exec-outcome:last-of-type { border-bottom: none; }
            .exec-outcome-label {
                font-size: 11px; color: #6b7280;
                text-transform: uppercase; letter-spacing: 0.06em;
                font-family: var(--font-data); font-weight: 500;
            }
            .exec-outcome-value {
                font-size: 16px; font-weight: 700;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                letter-spacing: -0.01em;
                font-variant-numeric: tabular-nums;
            }
            .exec-outcome-value.capital { font-size: 18px; color: #0a0a0a; }
            .exec-outcome-value.success { color: #166534; }
            .exec-outcome-value.failure { color: #752122; opacity: 0.85; }

            /* Divider */
            .exec-div {
                border: none; border-top: 1px solid rgba(70,55,35,.22);
                margin: 16px 0;
            }

            /* Escrow */
            .exec-escrow {
                font-size: 10px; color: #9ca3af; text-align: center;
                font-family: var(--font-data);
                letter-spacing: 0.02em;
                margin-bottom: 16px;
            }

            /* Risk Row */
            .exec-risk-row {
                display: flex; align-items: flex-start; gap: 10px;
                margin-bottom: 20px; cursor: pointer; user-select: none;
            }
            .exec-risk-row input[type="checkbox"] {
                width: 15px; height: 15px; margin-top: 1px;
                accent-color: #752122; cursor: pointer; flex-shrink: 0;
            }
            .exec-risk-text {
                font-size: 12px; color: #374151; line-height: 1.5;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }

            /* ── Primary Button — Dual-State ── */
            .exec-btn-primary {
                width: 100%; height: 48px;
                background: #F5EDDA; color: #111111;
                border: 1px solid rgba(70,55,35,.22);
                font-size: 12px; font-weight: 600;
                text-transform: uppercase; letter-spacing: 0.06em;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                cursor: pointer; overflow: hidden;
                transition: all 150ms ease;
                box-shadow: none;
                border-radius: 6px;
            }
            .exec-btn-primary:hover:not(:disabled) {
                border-color: #7f1d1d;
                color: #7f1d1d;
            }
            .exec-btn-primary:active:not(:disabled) {
                background: #7f1d1d;
                color: #ffffff;
                border-color: #7f1d1d;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
            }
            .exec-btn-primary:focus-visible {
                outline: 2px solid rgba(127,29,29,0.4);
                outline-offset: 2px;
            }
            .exec-btn-primary:disabled {
                opacity: 0.30; cursor: not-allowed;
            }
            /* Executing state — red fill while processing */
            .exec-btn-primary.executing {
                background: #7f1d1d;
                color: #ffffff;
                border-color: #7f1d1d;
                cursor: wait;
            }

            /* Cancel */
            .exec-btn-cancel {
                width: 100%; border: none; background: transparent;
                color: #9ca3af; font-size: 11px; font-weight: 500;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                cursor: pointer; padding: 8px; margin-top: 4px;
                transition: color 150ms; letter-spacing: 0.02em;
            }
            .exec-btn-cancel:hover { color: #4b5563; }

            /* Error */
            .exec-error {
                background: #fef2f2; border: 1px solid #e5c5c5;
                padding: 10px 14px; margin-top: 12px;
                font-size: 11px; color: #752122;
                font-family: var(--font-data);
                border-radius: 4px; display: none;
            }

            /* Success State */
            .exec-success { text-align: center; padding: 16px 0; }
            .exec-success-icon { font-size: 24px; margin-bottom: 8px; }
            .exec-success-title {
                font-size: 11px; font-weight: 700; color: #166534;
                text-transform: uppercase; letter-spacing: 0.06em;
                font-family: var(--font-data);
                margin-bottom: 4px;
            }
            .exec-success-sub {
                font-size: 10px; color: #9ca3af;
                font-family: var(--font-data);
            }
            .exec-success-actions {
                display: flex; gap: 8px; margin-top: 16px;
            }
            .exec-success-btn {
                flex: 1; padding: 12px; border: none;
                font-size: 11px; font-weight: 600;
                text-transform: uppercase; letter-spacing: 0.04em;
                font-family: var(--font-content), 'Helvetica Neue', Helvetica, Arial, sans-serif;
                cursor: pointer; transition: all 150ms;
                border-radius: 4px;
            }
            .exec-success-btn.primary {
                background: #166534; color: #fff;
            }
            .exec-success-btn.primary:hover { background: #14532d; }
            .exec-success-btn.secondary {
                background: #f5f5f5; color: #374151; border: 1px solid #d4d4d4;
            }
            .exec-success-btn.secondary:hover { background: #eee; }

            @keyframes exec-spin { to { transform: rotate(360deg); } }

            @media (max-width: 520px) {
                .exec-modal { max-width: calc(100% - 32px); }
                .exec-stake-btn { font-size: 11px; padding: 8px 0; }
            }
        </style>

        <div class="exec-backdrop" id="exec-backdrop"></div>
        <div class="exec-modal" id="exec-modal-panel">
            <div class="exec-header">
                <span class="exec-header-title">Execute Contract</span>
                <span class="exec-header-id" id="exec-m-id"></span>
            </div>
            <div class="exec-body" id="exec-modal-body"></div>
        </div>
    `;

    document.body.appendChild(wrapper);
    _modalEl = wrapper;

    wrapper.querySelector('#exec-backdrop').addEventListener('click', closeExecutionModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wrapper.classList.contains('open')) {
            closeExecutionModal();
        }
    });

    return wrapper;
}

export function openExecutionModal(contractData) {
    const modal = ensureModal();
    const body = modal.querySelector('#exec-modal-body');
    const idEl = modal.querySelector('#exec-m-id');

    const {
        id, title, tier, provider, platform,
        min_stake, max_stake, multiplier,
        fee_bps, window_days, target_hint, goal
    } = contractData;

    const shortId = (id || '').split('-')[0].slice(0, 4).toUpperCase();
    idEl.textContent = `RCP-${shortId}`;

    const rawTier = (tier || 'controlled').toUpperCase();
    const displayTier = {CONTROLLED:'PLEDGE',ELEVATED:'STAKE',MAXIMUM:'ALL-IN',PLEDGE:'PLEDGE',STAKE:'STAKE','ALL-IN':'ALL-IN'}[rawTier] || rawTier;
    const windowDays = window_days || 30;
    const mult = multiplier || (rawTier === 'MAXIMUM' || rawTier === 'ALL-IN' ? 4.0 : rawTier === 'ELEVATED' || rawTier === 'STAKE' ? 2.5 : 1.5);
    const targetDisplay = target_hint || goal || '+15%';

    // ── Build stake presets from min/max ──
    const minS = min_stake > 0 ? min_stake : 100;
    const maxS = max_stake > 0 ? max_stake : 10000;
    const allPresets = [100, 250, 500, 1000, 1500, 2000, 3000, 5000, 10000];
    const presets = allPresets.filter(p => p >= minS && p <= maxS);
    if (presets.length === 0) presets.push(minS);
    // Cap at 5 presets for layout
    const displayPresets = presets.length > 5 ? presets.slice(0, 5) : presets;

    let selectedStake = displayPresets[0];
    let selectedMethod = 'USD_CARD';

    // ── Referral bonus state ──
    let referralBonusPct = 0;

    const fmtStake = (v) => {
        if (selectedMethod === 'CRYPTO') {
            return v >= 1000 ? (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }).replace(/\.0$/, '') + 'K CLTR' : v.toLocaleString() + ' CLTR';
        }
        return v >= 1000 ? '$' + (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }).replace(/\.0$/, '') + 'K' : '$' + v.toLocaleString();
    };

    const fmtDollar = (v) => {
        if (selectedMethod === 'CRYPTO') {
            return v.toLocaleString() + ' CLTR';
        }
        return '$' + v.toLocaleString();
    };

    const renderBody = () => {
        const basePayout = Math.round(selectedStake * mult);
        const bonusAmount = referralBonusPct > 0 ? Math.round(basePayout * referralBonusPct / 100) : 0;
        const totalPayout = basePayout + bonusAmount;

        const bonusHtml = referralBonusPct > 0 ? `
            <div class="exec-outcome" style="background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;margin:-2px 0 2px;">
                <span class="exec-outcome-label" style="color:#15803d;font-weight:600;">🎁 Referral Bonus (+${referralBonusPct}%)</span>
                <span class="exec-outcome-value success" style="color:#15803d;">+${fmtDollar(bonusAmount)}</span>
            </div>` : '';

        body.innerHTML = `
            <!-- Lock Method Selector Toggle -->
            <div style="display: flex; gap: 8px; margin-bottom: 20px; background: #f3f4f6; padding: 4px; border-radius: 6px;">
                <button class="exec-method-btn" id="exec-method-usd" style="flex: 1; padding: 8px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; background: ${selectedMethod === 'USD_CARD' ? '#fff' : 'transparent'}; color: ${selectedMethod === 'USD_CARD' ? '#111' : '#666'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: ${selectedMethod === 'USD_CARD' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'}; transition: all 0.15s;">
                    🔒 USD Card (Stripe)
                </button>
                <button class="exec-method-btn" id="exec-method-cltr" style="flex: 1; padding: 8px; font-size: 11px; font-weight: 600; border: none; border-radius: 4px; background: ${selectedMethod === 'CRYPTO' ? '#fff' : 'transparent'}; color: ${selectedMethod === 'CRYPTO' ? '#111' : '#666'}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: ${selectedMethod === 'CRYPTO' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'}; transition: all 0.15s;">
                    🪙 CLTR Staking (Web3)
                </button>
            </div>

            <div class="exec-tier-row">
                <span class="exec-tier-label">Selected Tier</span>
                <span class="exec-tier-badge">${displayTier}</span>
            </div>

            <div class="exec-stake-presets" id="exec-presets">
                ${displayPresets.map(p => `
                    <button class="exec-stake-btn${p === selectedStake ? ' active' : ''}" data-stake="${p}">
                        ${fmtStake(p)}
                    </button>
                `).join('')}
            </div>

            <div class="exec-outcome">
                <span class="exec-outcome-label">Capital Locked</span>
                <span class="exec-outcome-value capital" id="exec-out-locked">${fmtDollar(selectedStake)}</span>
            </div>
            <div class="exec-outcome">
                <span class="exec-outcome-label">If Successful</span>
                <span class="exec-outcome-value success" id="exec-out-success">+${fmtDollar(totalPayout)}</span>
            </div>
            ${bonusHtml}
            <div class="exec-outcome">
                <span class="exec-outcome-label">If Failed</span>
                <span class="exec-outcome-value failure" id="exec-out-fail">-${fmtDollar(selectedStake)}</span>
            </div>

            <hr class="exec-div">

            <div class="exec-escrow">${selectedMethod === 'CRYPTO' ? 'CLTR is locked on-chain in the Commitment Staking contract until settlement.' : 'Capital is held in escrow until settlement.'}</div>

            <label class="exec-risk-row">
                <input type="checkbox" id="exec-risk-check">
                <span class="exec-risk-text">I understand capital is at risk and settlement is binary.</span>
            </label>

            <button class="exec-btn-primary" id="exec-btn-lock" disabled>
                LOCK ${fmtDollar(selectedStake)} CAPITAL →
            </button>

            <button class="exec-btn-cancel" id="exec-btn-cancel">Cancel</button>

            <div class="exec-error" id="exec-error-msg"></div>
        `;

        // ── Wire method buttons ──
        body.querySelector('#exec-method-usd').addEventListener('click', () => {
            if (selectedMethod === 'USD_CARD') return;
            selectedMethod = 'USD_CARD';
            renderBody();
        });
        body.querySelector('#exec-method-cltr').addEventListener('click', () => {
            if (selectedMethod === 'CRYPTO') return;
            selectedMethod = 'CRYPTO';
            renderBody();
        });

        // ── Wire preset buttons ──
        body.querySelectorAll('.exec-stake-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedStake = parseInt(btn.dataset.stake);
                renderBody();
            });
        });

        // ── Wire checkbox ──
        const checkbox = body.querySelector('#exec-risk-check');
        const lockBtn = body.querySelector('#exec-btn-lock');
        const cancelBtn = body.querySelector('#exec-btn-cancel');

        checkbox.addEventListener('change', () => {
            lockBtn.disabled = !checkbox.checked;
        });

        cancelBtn.addEventListener('click', closeExecutionModal);

        lockBtn.addEventListener('click', async () => {
            await runExecution(contractData, selectedStake, mult, lockBtn, body, selectedMethod);
        });
    };

    renderBody();
    modal.classList.add('open');

    // TikTok funnel — AddToCart (user opened execution modal)
    if (typeof ttq !== 'undefined') ttq.track('AddToCart', { content_id: id, content_name: title || goal });

    // Fetch referral bonus asynchronously and re-render if available
    if (window.api && window.api.getReferralStats && window.appState?.isLoggedIn) {
        window.api.getReferralStats().then(stats => {
            if (stats && stats.firstBonusAvailable && stats.firstBonusPct > 0) {
                referralBonusPct = stats.firstBonusPct;
                renderBody();
            }
        }).catch(() => { /* silently ignore */ });
    }
}

export function closeExecutionModal() {
    if (_modalEl) {
        _modalEl.classList.remove('open');
    }
}

async function runExecution(contractData, stake, multiplier, btnEl, bodyEl, fundingMethod = 'USD_CARD') {
    // Auth gate — require login before execution
    if (!hasAuthToken()) {
        const errorEl = bodyEl.querySelector('#exec-error-msg');
        if (errorEl) {
            errorEl.innerHTML = 'Sign in required to execute contracts. <a href="#" onclick="event.preventDefault();window.app.handleAuthClick();" style="color:#752122;text-decoration:underline;font-weight:600;">Sign In →</a>';
            errorEl.style.display = 'block';
        }
        return;
    }

    const id = contractData.id;
    const provider = contractData.provider || contractData.platform || 'stripe';
    const tier = (contractData.tier || 'controlled').toUpperCase();
    const riskTier = (tier === 'ELEVATED' || tier === 'STAKE') ? 'ADVANCED' : (tier === 'MAXIMUM' || tier === 'ALL-IN') ? 'ELITE' : 'STANDARD';
    const goal = contractData.title || contractData.goal || '';
    const thresholdMatch = goal.match(/(\d+)%/);
    const threshold = thresholdMatch ? parseInt(thresholdMatch[1]) : 15;
    const platform = provider.toUpperCase();
    const metricType = (platform === 'X' || platform === 'TWITTER') ? 'FOLLOWERS' : 'REVENUE';

    btnEl.disabled = true;
    btnEl.classList.add('executing');
    
    const errorEl = bodyEl.querySelector('#exec-error-msg');
    if (errorEl) errorEl.style.display = 'none';

    let txHash = null;

    if (fundingMethod === 'CRYPTO') {
        btnEl.innerHTML = 'Connecting Wallet...';
        const account = getAccount(wagmiAdapter.wagmiConfig);
        if (!account.isConnected || !account.address) {
            btnEl.innerHTML = 'Awaiting Wallet Connection';
            try {
                await window.modal.open();
                await sleep(2000);
            } catch (e) {
                btnEl.disabled = false;
                btnEl.innerHTML = `STAKE ${stake.toLocaleString()} CLTR via WEB3 →`;
                if (errorEl) {
                    errorEl.textContent = 'Please connect your MetaMask wallet.';
                    errorEl.style.display = 'block';
                }
                return;
            }
        }

        const freshAccount = getAccount(wagmiAdapter.wagmiConfig);
        if (!freshAccount.isConnected || !freshAccount.address) {
            btnEl.disabled = false;
            btnEl.innerHTML = `STAKE ${stake.toLocaleString()} CLTR via WEB3 →`;
            if (errorEl) {
                errorEl.textContent = 'Wallet connection required.';
                errorEl.style.display = 'block';
            }
            return;
        }

        const userAddress = freshAccount.address;
        const amountBig = parseUnits(stake.toString(), 18);
        const windowDays = contractData.window_days || 30;

        try {
            // Check allowance
            btnEl.innerHTML = 'Checking CLTR Allowance...';
            const allowance = await readContract(wagmiAdapter.wagmiConfig, {
                address: CLTR_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [userAddress, STAKING_ADDRESS]
            });

            if (allowance < amountBig) {
                btnEl.innerHTML = 'Approve CLTR in Wallet...';
                const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
                    address: CLTR_TOKEN_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [STAKING_ADDRESS, amountBig]
                });

                const appTx = await writeContract(wagmiAdapter.wagmiConfig, request);
                btnEl.innerHTML = 'Awaiting Approval Confirmation...';
                await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: appTx });
            }

            // Stake
            btnEl.innerHTML = 'Sign Stake in Wallet...';
            const durationSec = windowDays * 24 * 60 * 60;
            const { request: stakeRequest } = await simulateContract(wagmiAdapter.wagmiConfig, {
                address: STAKING_ADDRESS,
                abi: STAKING_ABI,
                functionName: 'stake',
                args: [amountBig, BigInt(durationSec)]
            });

            const stakeTx = await writeContract(wagmiAdapter.wagmiConfig, stakeRequest);
            btnEl.innerHTML = 'Awaiting Blockchain Confirmation...';
            const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash: stakeTx });
            txHash = receipt.transactionHash;

        } catch (err) {
            console.error('Web3 Staking transaction failed:', err);
            btnEl.disabled = false;
            btnEl.innerHTML = `STAKE ${stake.toLocaleString()} CLTR via WEB3 →`;
            if (errorEl) {
                errorEl.textContent = err.message || 'Transaction rejected or failed.';
                errorEl.style.display = 'block';
            }
            return;
        }
    } else {
        btnEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:exec-spin 0.7s linear infinite;display:inline-block;"></span>Processing</span>';
    }

    // TikTok funnel — InitiateCheckout
    if (typeof ttq !== 'undefined') ttq.track('InitiateCheckout', { value: stake, currency: fundingMethod === 'CRYPTO' ? 'CLTR' : 'USD' });

    try {
        await sleep(800);

        const createResult = await window.api.createContract({
            platform,
            metricType,
            condition: {
                operator: 'GTE',
                threshold,
                deadline: (contractData.deadline && contractData.deadline !== 'undefined' && !isNaN(new Date(contractData.deadline).getTime()))
                    ? contractData.deadline
                    : new Date(Date.now() + 30 * 86400000).toISOString(),
            },
            lockAmountUsdCents: Math.round(stake * 100),
            payoutAmountUsdCents: Math.round(stake * multiplier * 100),
            riskTier,
            marketInstanceId: id,
            fundingMethod: fundingMethod
        });

        const realContractId = createResult.contract?.id || createResult.id;

        if (realContractId) {
            await window.api.createFundingIntent(realContractId, txHash);
            await window.api.executeContract(realContractId);
        }

        // Conversion tracking — Contract Execution
        if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5u', {});
        if (typeof gtag === 'function') gtag('event', 'conversion', { send_to: 'AW-18147195908/contract_executed', value: stake, currency: fundingMethod === 'CRYPTO' ? 'CLTR' : 'USD' });
        if (typeof fbq === 'function') fbq('track', 'Purchase', { value: stake, currency: fundingMethod === 'CRYPTO' ? 'CLTR' : 'USD' });
        if (typeof ttq !== 'undefined') ttq.track('CompletePayment', { value: stake, currency: fundingMethod === 'CRYPTO' ? 'CLTR' : 'USD' });

        showSuccess(bodyEl, stake, multiplier, realContractId || id, fundingMethod);

    } catch (err) {
        console.error('[Exec] Error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'Execution failed.';
            errorEl.style.display = 'block';
        }
        btnEl.disabled = false;
        btnEl.classList.remove('executing');
        btnEl.textContent = fundingMethod === 'CRYPTO' ? `STAKE ${stake.toLocaleString()} CLTR via WEB3 →` : `LOCK $${stake.toLocaleString()} CAPITAL →`;
    }
}

function showSuccess(bodyEl, stake, multiplier, contractId, fundingMethod = 'USD_CARD') {
    const payout = Math.round(stake * multiplier);
    const profit = payout - stake;
    const bonusProfit = Math.round(profit * 0.05);
    const bonusPayout = payout + bonusProfit;
    const shortId = (contractId || '').split('-')[0].slice(0, 4).toUpperCase();

    const fmt = (v) => fundingMethod === 'CRYPTO' ? `${v.toLocaleString()} CLTR` : `$${v.toLocaleString()}`;
    const stakeText = fundingMethod === 'CRYPTO' ? `${stake.toLocaleString()} CLTR` : `$${stake.toLocaleString()}`;

    bodyEl.innerHTML = `
        <div class="exec-success">
            <div class="exec-success-icon">✅</div>
            <div class="exec-success-title">Execution Confirmed</div>
            <div class="exec-success-sub">RCPT-${shortId} · Capital locked until settlement</div>

            <div style="background: #FAF4E6;border:1px solid rgba(70,55,35,.22);border-radius:6px;padding:16px;margin:20px 0 12px;text-align:left;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <span style="font-size:16px;">🐦</span>
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-family:var(--font-data);color:#111;">Boost Your Payout</span>
                </div>
                <div style="font-size:12px;color:#374151;line-height:1.5;margin-bottom:12px;font-family:var(--font-content),'Helvetica Neue',sans-serif;">
                    Share your contract on X to earn <strong>+5% extra profit</strong> if you succeed.
                </div>
                <div style="display:flex;gap:6px;font-size:10px;color:#6b7280;font-family:var(--font-data);margin-bottom:14px;">
                    <span>Normal: ${fmt(payout)}</span>
                    <span>→</span>
                    <span style="color:#166534;font-weight:600;">Boosted: ${fmt(bonusPayout)} (+${fmt(bonusProfit)})</span>
                </div>
                <button id="exec-share-x" style="width:100%;padding:10px;background:#0f1419;color:#fff;border:none;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;cursor:pointer;font-family:var(--font-content);display:flex;align-items:center;justify-content:center;gap:8px;transition:background 150ms;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share on X
                </button>
            </div>

            <div id="exec-tweet-verify" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px;margin-bottom:12px;text-align:left;">
                <div style="font-size:11px;font-weight:600;color:#166534;margin-bottom:8px;font-family:var(--font-data);text-transform:uppercase;letter-spacing:0.04em;">Paste Your Tweet URL</div>
                <input id="exec-tweet-url" type="text" placeholder="https://x.com/you/status/..." style="width:100%;padding:8px 10px;border:1px solid #d4d4d4;border-radius:4px;font-size:12px;font-family:var(--font-data);margin-bottom:8px;box-sizing:border-box;">
                <button id="exec-verify-tweet" style="width:100%;padding:8px;background:#166534;color:#fff;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;text-transform:uppercase;letter-spacing:0.04em;font-family:var(--font-content);">Verify & Activate Bonus</button>
                <div id="exec-tweet-status" style="font-size:10px;color:#6b7280;margin-top:6px;font-family:var(--font-data);display:none;"></div>
            </div>

            <div id="exec-bonus-confirmed" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;margin-bottom:12px;text-align:center;">
                <div style="font-size:13px;font-weight:700;color:#166534;">🐦 +5% Bonus Activated</div>
                <div style="font-size:10px;color:#6b7280;margin-top:4px;font-family:var(--font-data);">Tweet must stay live until settlement</div>
            </div>

            <div class="exec-success-actions">
                <button class="exec-success-btn primary" id="exec-view-receipt">View Contract →</button>
                <button class="exec-success-btn secondary" id="exec-return-market">Return to Market</button>
            </div>
        </div>
    `;

    // Generate tweet text
    const tweetText = `I just locked ${stakeText} on @CollateralMkt that I hit my performance target in the next 30 days.\n\nIf I fail I lose the stake.\nIf I succeed I get paid.\n\nhttps://collateral.market/c/${contractId}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    // Wire Share on X button
    bodyEl.querySelector('#exec-share-x').addEventListener('click', () => {
        window.open(tweetUrl, '_blank', 'width=600,height=400');
        setTimeout(() => {
            const verifySection = bodyEl.querySelector('#exec-tweet-verify');
            if (verifySection) verifySection.style.display = 'block';
        }, 1500);
    });

    // Wire tweet verification
    bodyEl.querySelector('#exec-verify-tweet')?.addEventListener('click', async () => {
        const urlInput = bodyEl.querySelector('#exec-tweet-url');
        const statusEl = bodyEl.querySelector('#exec-tweet-status');
        const tweetUrlValue = urlInput?.value?.trim();

        if (!tweetUrlValue) {
            statusEl.textContent = 'Please paste your tweet URL';
            statusEl.style.display = 'block';
            statusEl.style.color = '#752122';
            return;
        }

        // Validate URL format
        if (!tweetUrlValue.match(/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/)) {
            statusEl.textContent = 'Invalid tweet URL format';
            statusEl.style.display = 'block';
            statusEl.style.color = '#752122';
            return;
        }

        const verifyBtn = bodyEl.querySelector('#exec-verify-tweet');
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        statusEl.style.display = 'block';
        statusEl.style.color = '#6b7280';
        statusEl.textContent = 'Submitting tweet for verification...';

        try {
            await window.api.submitSocialBonus(contractId, tweetUrlValue);
            // Success!
            bodyEl.querySelector('#exec-tweet-verify').style.display = 'none';
            bodyEl.querySelector('#exec-share-x').parentElement.style.display = 'none';
            bodyEl.querySelector('#exec-bonus-confirmed').style.display = 'block';
        } catch (err) {
            statusEl.textContent = err.message || 'Failed to verify tweet';
            statusEl.style.color = '#752122';
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify & Activate Bonus';
        }
    });

    bodyEl.querySelector('#exec-view-receipt').addEventListener('click', () => {
        closeExecutionModal();
        window.router.navigate('/contracts/' + contractId);
    });

    bodyEl.querySelector('#exec-return-market').addEventListener('click', () => {
        closeExecutionModal();
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
