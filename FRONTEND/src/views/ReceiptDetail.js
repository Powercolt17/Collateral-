// Contract Receipt Detail Page - Immutable Record View
// Route: /receipts/:id
// Fetches real contract data from API

export function renderReceiptDetail() {
    return `
        <div class="min-h-screen bg-white" id="receipt-container">
            <!-- Loading state -->
            <div class="flex items-center justify-center min-h-screen">
                <p class="text-sm font-mono text-neutral-400">Loading receipt...</p>
            </div>
        </div>
    `;
}

export async function initReceiptDetail(params) {
    const container = document.getElementById('receipt-container');
    const contractId = params?.id;

    if (!contractId) {
        container.innerHTML = `
            <div class="min-h-screen bg-white flex items-center justify-center">
                <div class="text-center">
                    <p class="font-mono text-sm text-neutral-600 mb-4">
                        CONTRACT NOT FOUND
                    </p>
                    <a href="javascript:window.router.navigate('/receipts')" 
                       class="font-mono text-xs text-neutral-900 underline decoration-1 underline-offset-2">
                        Return to Records
                    </a>
                </div>
            </div>
        `;
        return;
    }

    // Format helpers
    function formatUSDC(cents) {
        if (cents === null || cents === undefined) return '0 USDC';
        const amount = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        return amount + ' USDC';
    }

    function formatDateTime(isoString) {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    }

    function formatContractId(id) {
        if (!id) return '-';
        const year = new Date().getFullYear();
        const shortId = id.slice(0, 4).toUpperCase();
        const hash = id.slice(-4).toUpperCase();
        return `CTX-${year}-${shortId}-${hash}`;
    }

    function formatNumber(num) {
        return num?.toLocaleString('en-US') ?? '-';
    }

    try {
        // Fetch contract data from API
        console.log('[Receipt] Fetching contract:', contractId);
        const response = await window.api.getContract(contractId);

        if (!response?.contract) {
            throw new Error('Contract not found');
        }

        const contract = response.contract;
        const events = response.events || [];

        // Determine status
        const state = contract.state || 'UNKNOWN';
        const isSuccess = ['LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED', 'SETTLED_SUCCESS', 'PAYOUT_COMPLETE', 'COMPLETED'].includes(state);
        const isForfeited = ['SETTLED_FAILURE', 'FORFEITED', 'EXPIRED', 'CANCELLED'].includes(state);

        // Status display
        const statusMap = {
            'CREATED': 'AWAITING EXECUTION',
            'FUNDS_AUTHORIZED': 'AWAITING EXECUTION',
            'FUNDS_LOCKED': 'ACTIVE',
            'LOCKED': 'ACTIVE',
            'ACTIVE': 'ACTIVE',
            'EXECUTION_CONFIRMED': 'ACTIVE',
            'VERIFIED': 'ACTIVE',
            'VERIFYING': 'ACTIVE',
            'SETTLED_SUCCESS': 'SETTLED — SUCCESS',
            'SETTLED': 'SETTLED — SUCCESS',
            'SETTLED_FAILURE': 'SETTLED — FORFEITED',
            'FORFEITED': 'SETTLED — FORFEITED',
            'PAYOUT_COMPLETE': 'SETTLED — SUCCESS',
            'COMPLETED': 'SETTLED — SUCCESS',
        };
        const statusDisplay = statusMap[state] || state;

        // Platform info
        const platform = contract.platform || 'Unknown';
        const platformNames = { 'X': 'Twitter', 'STRIPE': 'GitHub', 'GITHUB': 'GitHub' };
        const platformDisplay = platformNames[platform] || platform;

        const metricType = contract.metricType || 'Unknown';
        const metricNames = { 'FOLLOWERS': 'Repository Stars', 'REVENUE': 'Net Revenue', 'STARS': 'Repository Stars' };
        const metricDisplay = metricNames[metricType] || metricType;

        // Baseline info
        const baseline = contract.baseline || {};
        const baselineCount = baseline.followerCount || baseline.starCount || baseline.value || 0;
        const baselineValue = formatNumber(baselineCount) + ' stars';

        // Condition/target
        const condition = contract.conditionJson || {};
        const targetValue = formatNumber(condition.threshold || 0) + ' stars';

        // Payout amount
        const payoutAmount = isForfeited ? 0 : (contract.payoutAmountUsdCents || contract.lockAmountUsdCents);

        // Build timeline with richer event descriptions
        let timelineHtml = '';
        const sortedEvents = events.length > 0
            ? [...events].sort((a, b) => new Date(a.timestampUtc || a.createdAt).getTime() - new Date(b.timestampUtc || b.createdAt).getTime())
            : [];

        // Default timeline if no events
        if (sortedEvents.length === 0) {
            timelineHtml = `
                <div class="flex gap-4 mb-4">
                    <div class="flex-shrink-0 mt-1.5">
                        <div class="w-2 h-2 bg-neutral-500 rounded-full"></div>
                    </div>
                    <div class="flex-1">
                        <div class="font-mono text-xs text-neutral-400 mb-1">
                            ${formatDateTime(contract.createdAt)}
                        </div>
                        <div class="font-mono text-sm text-white">
                            Contract created and capital locked
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Build timeline from actual events
            const eventDescriptions = {
                'CONTRACT_CREATED': 'Contract created and capital locked',
                'BASELINE_SNAPSHOTTED': `Baseline snapshot recorded: ${baselineValue}`,
                'FUNDS_AUTHORIZED': 'Payment authorized',
                'FUNDS_LOCKED': 'Funds locked in escrow',
                'EXECUTION_REQUESTED': 'Execution requested',
                'EXECUTION_CONFIRMED': 'Execution confirmed',
                'LOCKED': 'Capital locked',
                'TARGET_REACHED': `Target reached: ${formatNumber(condition.threshold)} stars`,
                'SETTLEMENT_INITIATED': 'Settlement initiated',
                'SETTLED_SUCCESS': 'Contract settled: SUCCESS',
                'SETTLED_FAILURE': 'Contract settled: FORFEITED',
                'EXPIRED': 'Contract expired',
                'CANCELLED': 'Contract cancelled'
            };

            timelineHtml = sortedEvents.map(evt => `
                <div class="flex gap-4 mb-4 last:mb-0">
                    <div class="flex-shrink-0 mt-1.5">
                        <div class="w-2 h-2 bg-neutral-500 rounded-full"></div>
                    </div>
                    <div class="flex-1">
                        <div class="font-mono text-xs text-neutral-400 mb-1">
                            ${formatDateTime(evt.timestampUtc || evt.createdAt)}
                        </div>
                        <div class="font-mono text-sm text-white">
                            ${eventDescriptions[evt.eventType] || evt.eventType}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Status message
        const statusMessages = {
            'ACTIVE': 'Capital is locked. Outcome will be verified at deadline.',
            'AWAITING EXECUTION': 'Contract created. Awaiting capital lock.',
            'SETTLED — SUCCESS': 'Target achieved. Capital is released to the beneficiary within one business day of settlement.',
            'SETTLED — FORFEITED': 'Target not achieved. Capital forfeited.',
        };
        const statusMessage = statusMessages[statusDisplay] || 'Status pending.';

        // Verification method
        const verificationMethod = platformDisplay + ' API v3';

        // Render the receipt
        container.innerHTML = `
            <!-- Header -->
            <div class="border-b border-neutral-200">
                <div class="max-w-4xl mx-auto px-8 py-8">
                    <h1 class="text-2xl font-semibold tracking-tight text-neutral-900 mb-3" style="font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        CONTRACT EXECUTION RECEIPT
                    </h1>
                    <p class="text-sm text-neutral-600 mb-4">
                        This document certifies the execution of an immutable performance contract on the Collateral platform.
                    </p>
                    <p class="text-xs font-mono tracking-widest uppercase" style="color: #B22222;">
                        THIS RECORD CANNOT BE ALTERED.
                    </p>
                </div>
            </div>

            <div class="max-w-4xl mx-auto px-8 py-8">
                <!-- Metadata Block -->
                <div class="border border-neutral-200 p-6 mb-10">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <div class="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mb-1">
                                Contract ID
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-sm text-neutral-900">
                                    ${formatContractId(contractId)}
                                </span>
                                <button onclick="navigator.clipboard.writeText('${contractId}')" 
                                        class="p-0.5 hover:bg-neutral-100 transition-colors"
                                        aria-label="Copy Contract ID">
                                    <i data-lucide="copy" class="w-3 h-3 text-neutral-400"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <div class="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mb-1">
                                Status
                            </div>
                            <div class="font-mono text-sm text-neutral-900">
                                ${statusDisplay}
                            </div>
                        </div>
                        <div>
                            <div class="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mb-1">
                                Created (UTC)
                            </div>
                            <div class="font-mono text-sm text-neutral-900">
                                ${formatDateTime(contract.createdAt)}
                            </div>
                        </div>
                        <div>
                            <div class="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mb-1">
                                Deadline
                            </div>
                            <div class="font-mono text-sm text-neutral-900">
                                ${formatDateTime(contract.deadlineUtc || condition.deadline)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contract Terms -->
                <div class="mb-10">
                    <h2 class="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-3" style="font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        CONTRACT TERMS
                    </h2>
                    <div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Platform
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${platformDisplay}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Metric
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${metricDisplay}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Baseline Snapshot
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${baselineValue}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Target
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${targetValue}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Time Window
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                30 days
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Capital Locked
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${formatUSDC(contract.lockAmountUsdCents)}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Payout Amount
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${formatUSDC(payoutAmount)}
                            </span>
                        </div>
                        <div class="flex justify-between py-3 border-b border-neutral-100">
                            <span class="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                                Verification Method
                            </span>
                            <span class="font-mono text-sm text-neutral-900">
                                ${verificationMethod}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Execution Timeline -->
                <div class="mb-10">
                    <h2 class="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-3" style="font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        EXECUTION TIMELINE
                    </h2>
                    <div class="bg-neutral-900 p-6">
                        ${timelineHtml}
                    </div>
                </div>

                <!-- Contract Status -->
                <div class="mb-10">
                    <div class="border ${isForfeited ? 'border-red-200 bg-red-50' : 'border-neutral-200'} p-6">
                        <div class="text-[11px] font-mono tracking-widest text-neutral-500 uppercase mb-2">
                            STATUS: ${statusDisplay}
                        </div>
                        <div class="font-mono text-sm text-neutral-900">
                            ${statusMessage}
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="mb-10">
                    <div class="flex gap-3 flex-wrap">
                        <button id="btn-copy-id"
                                class="px-4 py-2 border border-neutral-300 font-mono text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">
                            Copy Contract ID
                        </button>
                        <button id="btn-view-ledger"
                                class="px-4 py-2 border border-neutral-300 font-mono text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">
                            View Ledger
                        </button>
                        <button id="btn-create-another"
                                class="px-4 py-2 border border-neutral-300 font-mono text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">
                            Create Another Contract
                        </button>
                    </div>
                </div>

                <!-- Dev Tools (non-production only) -->
                ${window.location.hostname !== 'collateral.market' ? `
                    <div class="border border-neutral-200 bg-neutral-50 p-4 mb-10">
                        <div class="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3">
                            DEVELOPMENT UTILITIES
                        </div>
                        <div class="flex gap-2">
                            <button id="btn-export-json" class="px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-100">
                                Export JSON
                            </button>
                            <button id="btn-debug-mode" class="px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-100">
                                Debug Mode
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Footer Finality Statement -->
            <div class="border-t border-neutral-200">
                <div class="max-w-4xl mx-auto px-8 py-8">
                    <p class="text-xs font-mono text-neutral-500 text-center">
                        All contracts settle publicly. Outcomes are permanent. No appeals. No overrides.
                    </p>
                </div>
            </div>
        `;

        // Initialize lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Bind button events
        document.getElementById('btn-copy-id')?.addEventListener('click', () => {
            navigator.clipboard.writeText(contractId);
            const btn = document.getElementById('btn-copy-id');
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy Contract ID', 2000);
        });

        document.getElementById('btn-view-ledger')?.addEventListener('click', () => {
            window.router.navigate('/receipts');
        });

        document.getElementById('btn-create-another')?.addEventListener('click', () => {
            window.router.navigate('/market');
        });

        document.getElementById('btn-export-json')?.addEventListener('click', () => {
            const data = JSON.stringify({ contract, events }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contract-${formatContractId(contractId)}.json`;
            a.click();
        });

        document.getElementById('btn-debug-mode')?.addEventListener('click', () => {
            console.log('[Debug] Contract:', contract);
            console.log('[Debug] Events:', events);
            window.CollateralModal.showAlert('Debug info logged to console', { type: 'info', title: 'Debug' });
        });

        console.log('[Receipt] Loaded', { contractId, state });

    } catch (error) {
        console.error('[Receipt] Error loading contract:', error);
        container.innerHTML = `
            <div class="min-h-screen bg-white flex items-center justify-center">
                <div class="text-center">
                    <p class="font-mono text-sm text-neutral-600 mb-4">
                        CONTRACT NOT FOUND
                    </p>
                    <p class="font-mono text-xs text-neutral-400 mb-4">
                        ${error.message || 'The requested receipt does not exist.'}
                    </p>
                    <a href="javascript:window.router.navigate('/receipts')" 
                       class="font-mono text-xs text-neutral-900 underline decoration-1 underline-offset-2">
                        Return to Records
                    </a>
                </div>
            </div>
        `;
    }
}
