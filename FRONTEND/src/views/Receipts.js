// Active Contract Receipts Page
// Route: /receipts
// Shows receipts for user's active contracts, or empty state if none

export function renderReceipts() {
    return `
        <div class="min-h-screen bg-white">
            <!-- Header -->
            <div class="border-b border-neutral-200" data-reveal>
                <div class="max-w-5xl mx-auto px-8 py-8">
                    <div class="flex items-center gap-2 mb-6">
                        <span class="font-mono text-[11px] tracking-widest text-neutral-400 uppercase cursor-pointer hover:text-neutral-900 transition-colors"
                              onclick="window.router.navigate('/my-contracts')">My Contracts</span>
                        <i data-lucide="chevron-right" class="w-3 h-3 text-neutral-300"></i>
                        <span class="font-mono text-[11px] tracking-widest text-neutral-900 uppercase">Receipts</span>
                    </div>
                    <h1 class="text-2xl font-semibold tracking-tight text-neutral-900 mb-2" style="font-family: var(--font-content);">
                        ACTIVE RECEIPTS
                    </h1>
                    <p class="text-sm font-mono text-neutral-500">
                        Execution receipts for your currently active contracts.
                    </p>
                </div>
            </div>

            <!-- Content Container -->
            <div class="max-w-5xl mx-auto px-8 py-10">
                <div id="receipts-content">
                    <!-- Populated by JS -->
                    <div class="py-12 text-center">
                        <p class="text-sm font-mono text-neutral-400">Loading receipts...</p>
                    </div>
                </div>
            </div>

            <!-- Footer Notice -->
            <div class="border-t border-neutral-200" data-reveal>
                <div class="max-w-5xl mx-auto px-8 py-6">
                    <p class="text-xs font-mono text-neutral-400 text-center">
                        Receipts reflect the current state of active contracts. Records are immutable once settled.
                    </p>
                </div>
            </div>
        </div>
    `;
}

export async function initReceipts() {
    const container = document.getElementById('receipts-content');

    // Re-init lucide icons for breadcrumb
    if (window.lucide) window.lucide.createIcons();

    try {
        const response = await window.api.getContracts();
        const allContracts = response?.contracts || [];

        // Filter to only active contracts (not yet settled/forfeited/completed)
        const activeStates = new Set([
            'CREATED', 'FUNDS_AUTHORIZED', 'FUNDS_LOCKED',
            'LOCKED', 'ACTIVE', 'EXECUTION_CONFIRMED',
            'VERIFIED', 'VERIFYING'
        ]);
        const activeContracts = allContracts.filter(c => activeStates.has(c.state));

        console.log('[Receipts] Loaded', { total: allContracts.length, active: activeContracts.length });

        // ── Empty State ──
        if (activeContracts.length === 0) {
            container.innerHTML = `
                <div class="py-20 flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-full border-2 border-dashed border-neutral-200 flex items-center justify-center mb-6">
                        <i data-lucide="file-text" class="w-7 h-7 text-neutral-300"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-2" style="font-family: var(--font-content);">
                        No Active Contracts
                    </h3>
                    <p class="text-sm text-neutral-500 max-w-sm mb-1">
                        You don't have any active contracts right now. Receipts will appear here once you execute a contract.
                    </p>
                    <p class="text-xs font-mono text-neutral-400 mb-8">
                        Execute a contract to generate your first receipt.
                    </p>
                    <div class="flex items-center gap-3">
                        <button onclick="window.router.navigate('/market')"
                            class="px-5 py-2.5 bg-neutral-900 text-white text-[11px] font-medium uppercase tracking-widest hover:bg-black transition-colors">
                            Browse Contracts
                        </button>
                        <button onclick="window.router.navigate('/my-contracts')"
                            class="px-5 py-2.5 border border-neutral-200 text-neutral-600 text-[11px] font-medium uppercase tracking-widest hover:border-neutral-400 transition-colors">
                            My Contracts
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // ── Format Helpers ──
        function formatUSD(cents) {
            if (!cents) return '$0';
            return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }

        function formatDateTime(isoString) {
            if (!isoString) return '-';
            const d = new Date(isoString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} · ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`;
        }

        function formatContractId(id) {
            if (!id) return '-';
            const shortId = id.slice(0, 6).toUpperCase();
            return `RCPT-${shortId}`;
        }

        function getStateLabel(state) {
            const map = {
                'CREATED': 'Pending',
                'FUNDS_AUTHORIZED': 'Funds Authorized',
                'FUNDS_LOCKED': 'Capital Locked',
                'LOCKED': 'Capital Locked',
                'ACTIVE': 'Active',
                'EXECUTION_CONFIRMED': 'Execution Confirmed',
                'VERIFIED': 'Verified',
                'VERIFYING': 'Verifying',
            };
            return map[state] || state;
        }

        function getStateColor(state) {
            if (['ACTIVE', 'VERIFIED', 'EXECUTION_CONFIRMED'].includes(state)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            if (['FUNDS_LOCKED', 'LOCKED'].includes(state)) return 'bg-amber-50 text-amber-700 border-amber-100';
            if (['VERIFYING'].includes(state)) return 'bg-blue-50 text-blue-700 border-blue-100';
            return 'bg-neutral-50 text-neutral-600 border-neutral-200';
        }

        function getPlatformIcon(platform) {
            if (!platform) return 'globe';
            const p = platform.toLowerCase();
            if (p.includes('github')) return 'github';
            if (p.includes('twitter') || p.includes('x')) return 'twitter';
            if (p.includes('stripe')) return 'credit-card';
            return 'globe';
        }

        function getTimeRemaining(deadline) {
            if (!deadline) return null;
            const now = new Date();
            const end = new Date(deadline);
            const diff = end - now;
            if (diff <= 0) return 'Expired';
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (days > 0) return `${days}d ${hours}h remaining`;
            return `${hours}h remaining`;
        }

        // ── Summary Bar ──
        const totalLocked = activeContracts.reduce((sum, c) => sum + (c.lockAmountUsdCents || 0), 0);
        let html = `
            <div class="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
                <div class="flex items-center gap-6">
                    <div>
                        <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Active Receipts</span>
                        <span class="text-xl font-semibold text-neutral-900" style="font-family: var(--font-content);">${activeContracts.length}</span>
                    </div>
                    <div class="w-px h-10 bg-neutral-200"></div>
                    <div>
                        <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Total Capital Locked</span>
                        <span class="text-xl font-semibold text-neutral-900" style="font-family: var(--font-content);">${formatUSD(totalLocked)}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span class="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Live</span>
                </div>
            </div>
        `;

        // ── Receipt Cards ──
        html += `<div class="grid grid-cols-1 gap-4">`;

        activeContracts.forEach(contract => {
            const receiptId = formatContractId(contract.id);
            const capital = formatUSD(contract.lockAmountUsdCents);
            const executed = formatDateTime(contract.createdAt);
            const stateLabel = getStateLabel(contract.state);
            const stateColor = getStateColor(contract.state);
            const platform = contract.platform || contract.oracleType || '';
            const platformIcon = getPlatformIcon(platform);
            const timeRemaining = getTimeRemaining(contract.deadlineAt || contract.expiresAt);
            const payout = contract.maxPayoutUsdCents ? formatUSD(contract.maxPayoutUsdCents) : null;
            const title = contract.title || contract.description || contract.commitment || 'Contract';

            html += `
                <div class="border border-neutral-200 bg-white hover:border-neutral-300 transition-all cursor-pointer group"
                     onclick="window.router.navigate('/contracts/${contract.id}')">

                    <!-- Receipt Header -->
                    <div class="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="font-mono text-[11px] text-neutral-900 font-medium">${receiptId}</span>
                            <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide border ${stateColor}">
                                ${stateLabel}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i data-lucide="${platformIcon}" class="w-3.5 h-3.5 text-neutral-400"></i>
                            <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">${platform || 'Manual'}</span>
                        </div>
                    </div>

                    <!-- Receipt Body -->
                    <div class="px-6 py-5">
                        <h3 class="text-sm font-medium text-neutral-900 mb-4">${title}</h3>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Capital Locked</span>
                                <span class="text-sm font-semibold text-neutral-900">${capital}</span>
                            </div>
                            ${payout ? `
                            <div>
                                <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Max Payout</span>
                                <span class="text-sm font-semibold text-emerald-700">${payout}</span>
                            </div>` : ''}
                            <div>
                                <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Executed</span>
                                <span class="text-sm text-neutral-600">${executed}</span>
                            </div>
                            ${timeRemaining ? `
                            <div>
                                <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">Deadline</span>
                                <span class="text-sm text-neutral-600">${timeRemaining}</span>
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Receipt Footer -->
                    <div class="px-6 py-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                        <span class="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                            Receipt generated ${formatDateTime(contract.createdAt)}
                        </span>
                        <span class="font-mono text-[10px] text-neutral-500 group-hover:text-neutral-900 flex items-center gap-1 uppercase tracking-wide transition-colors">
                            View Details <i data-lucide="arrow-right" class="w-3 h-3"></i>
                        </span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        container.innerHTML = html;

        // Init lucide icons inside the rendered content
        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error('[Receipts] Error loading contracts:', error);
        container.innerHTML = `
            <div class="py-20 flex flex-col items-center text-center">
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-red-400"></i>
                </div>
                <p class="text-sm font-medium text-neutral-900 mb-1">
                    Unable to load receipts
                </p>
                <p class="text-xs font-mono text-neutral-400">
                    ${error.message || 'Please try again later.'}
                </p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}
