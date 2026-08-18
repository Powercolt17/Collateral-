// Stripe OAuth Callback Handler
// Handles: /stripe/callback?success=true&account=xxx OR ?error=xxx
// Backend has already exchanged the code - we just display the result

export function renderStripeCallback() {
    return `
        <style>
            .cb-page { min-height: calc(100vh - 72px); background: #FAF4E6; display: flex; align-items: center; justify-content: center; font-family: var(--font-content); position: relative; overflow: hidden; }
            .cb-page::before { content: ''; position: absolute; top: -40%; left: -20%; width: 140%; height: 140%; background: radial-gradient(ellipse at center, rgba(92,20,20,0.03) 0%, transparent 70%); pointer-events: none; }
            .cb-card { position: relative; background: #F5EDDA; border: 1px solid rgba(70,55,35,.22); width: 100%; max-width: 480px; padding: 56px 48px 48px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03); animation: cbSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
            @keyframes cbSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
            .cb-icon-wrap { width: 72px; height: 72px; margin: 0 auto 28px; position: relative; display: flex; align-items: center; justify-content: center; }
            .cb-icon-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid #e8f4ed; animation: cbRingPulse 2s ease-in-out infinite; }
            @keyframes cbRingPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.6; } }
            .cb-icon-circle { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #f0faf4, #e2f5ea); display: flex; align-items: center; justify-content: center; animation: cbFadeIn 0.6s 0.2s both; }
            @keyframes cbFadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            .cb-icon-circle svg { width: 24px; height: 24px; color: #1a8a4a; }
            .cb-checkmark { stroke-dasharray: 30; stroke-dashoffset: 30; animation: cbCheck 0.5s 0.5s ease forwards; }
            @keyframes cbCheck { to { stroke-dashoffset: 0; } }
            .cb-status-label { font-family: var(--font-data); font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #1a8a4a; margin-bottom: 10px; animation: cbFadeIn 0.4s 0.3s both; }
            .cb-title { font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px; letter-spacing: -0.5px; animation: cbFadeIn 0.4s 0.35s both; }
            .cb-username { font-family: var(--font-data); font-size: 14px; font-weight: 500; color: #5C1414; margin-bottom: 8px; animation: cbFadeIn 0.4s 0.4s both; }
            .cb-desc { font-size: 13px; color: #999; line-height: 1.7; margin-bottom: 32px; animation: cbFadeIn 0.4s 0.45s both; }
            .cb-divider { width: 48px; height: 1px; background: #eee; margin: 0 auto 32px; animation: cbFadeIn 0.4s 0.5s both; }
            .cb-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 36px; background: #0a0a0a; color: #fff; font-family: var(--font-data); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; animation: cbFadeIn 0.4s 0.55s both; }
            .cb-btn:hover { background: #5C1414; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(92,20,20,0.25); }
            .cb-btn:active { transform: translateY(0) scale(0.97); transition: all 0.08s ease; }
            .cb-btn::after { content: ''; position: absolute; top: -50%; left: -100%; width: 60%; height: 200%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); transform: skewX(-25deg); transition: left 0.5s ease; }
            .cb-btn:hover::after { left: 150%; }
            .cb-btn svg { width: 14px; height: 14px; }
            .cb-footer { margin-top: 28px; font-family: var(--font-data); font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 0.1em; animation: cbFadeIn 0.4s 0.6s both; }
            .cb-error-icon { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #fef2f2, #fde8e8); display: flex; align-items: center; justify-content: center; }
            .cb-error-icon svg { width: 24px; height: 24px; color: #b91c1c; }
            .cb-error-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid #fde8e8; }
        </style>
        <div class="cb-page">
            <div class="cb-card">
                <div id="stripe-callback-loading">
                    <div class="cb-icon-wrap">
                        <div style="width:20px;height:20px;border:2px solid rgba(70,55,35,.18);border-top-color:#111;border-radius:50%;animation:cbFadeIn 0.7s linear infinite;"></div>
                    </div>
                    <div class="cb-status-label" style="color:#999;">Verifying</div>
                    <h2 class="cb-title">Connecting Stripe</h2>
                    <p class="cb-desc">Establishing revenue binding...</p>
                </div>

                <div id="stripe-callback-success" class="hidden">
                    <div class="cb-icon-wrap">
                        <div class="cb-icon-ring"></div>
                        <div class="cb-icon-circle">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path class="cb-checkmark" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div class="cb-status-label">Binding Established</div>
                    <h2 class="cb-title">Stripe Connected</h2>
                    <p id="stripe-account-display" class="cb-username"></p>
                    <p class="cb-desc">Revenue data is now available for contract verification and settlement.</p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/market')" class="cb-btn">
                        Continue to Market
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <div class="cb-footer">Read-only access · Encrypted at rest</div>
                </div>

                <div id="stripe-callback-error" class="hidden">
                    <div class="cb-icon-wrap">
                        <div class="cb-error-ring"></div>
                        <div class="cb-error-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </div>
                    </div>
                    <div class="cb-status-label" style="color:#b91c1c;">Connection Failed</div>
                    <h2 class="cb-title">Unable to Connect</h2>
                    <p id="stripe-error-message" class="cb-username" style="color:#b91c1c;"></p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/sources')" class="cb-btn">
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function initStripeCallback() {
    // Hash-based SPA: params are inside the hash fragment, NOT in window.location.search
    // URL: /stripe/callback?success=true&account=xxx
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    const paramStr = qIdx !== -1 ? hash.substring(qIdx + 1) : '';
    // Also check window.location.search as fallback (non-hash routers)
    const urlParams = new URLSearchParams(paramStr || window.location.search);

    const success = urlParams.get('success');
    const account = urlParams.get('account');
    const error = urlParams.get('error');

    console.log('[StripeCallback] Parsed params — success:', success, 'account:', account, 'error:', error, 'hash:', hash);

    const loadingEl = document.getElementById('stripe-callback-loading');
    const successEl = document.getElementById('stripe-callback-success');
    const errorEl = document.getElementById('stripe-callback-error');
    const errorMessageEl = document.getElementById('stripe-error-message');
    const accountDisplayEl = document.getElementById('stripe-account-display');

    // Clean up stored OAuth state
    localStorage.removeItem('stripe_oauth_flow');
    localStorage.removeItem('stripe_oauth_state');

    // Handle error from backend
    if (error) {
        console.log('[StripeCallback] Error from backend:', error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');

        // Map error codes to user-friendly messages
        const errorMessages = {
            'missing_params': 'Missing authorization code or state. Please try again.',
            'invalid_state': 'Session expired or invalid. Please try again.',
            'state_expired': 'Your session has expired. Please try again.',
            'state_mismatch': 'Session mismatch detected. Please try again.',
            'config_error': 'Stripe is not properly configured. Please contact support.',
            'exchange_failed': 'Failed to connect Stripe account. Please try again.',
            'no_account_id': 'No account ID returned from Stripe. Please try again.',
            'server_error': 'Server error occurred. Please try again.',
            'access_denied': 'Access was denied. Please try again.',
            'no_revenue': 'Your Stripe account has $0 in revenue. Process at least one payment to connect.',
            'test_mode': 'Test mode Stripe accounts cannot be used. Connect a live Stripe account with real transactions.',
        };

        errorMessageEl.textContent = errorMessages[error] || `Connection failed: ${error}`;

        // If popup, still close it after showing error briefly
        if (window.opener) {
            setTimeout(() => window.close(), 3000);
        }
        return;
    }

    // Handle success from backend
    if (success === 'true') {
        console.log('[StripeCallback] Success! Account:', account);

        // Re-hydrate session to sync connected sources
        if (window.hydrateSession) {
            console.log('[StripeCallback] Hydrating session...');
            await window.hydrateSession();
        }

        // If popup, close immediately - parent window is polling
        if (window.opener) {
            console.log('[StripeCallback] Popup detected, closing...');
            window.close();
            return;
        }

        // Show success UI in main window
        loadingEl.classList.add('hidden');
        successEl.classList.remove('hidden');

        if (account) {
            accountDisplayEl.textContent = `Account: ${account}`;
        }

        // Auto-redirect after 2 seconds
        setTimeout(() => {
            window.router.navigate('/market');
        }, 2000);

        return;
    }

    // Neither success nor error - show error state
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorMessageEl.textContent = 'Invalid callback. Please try connecting again.';

    if (window.opener) {
        setTimeout(() => window.close(), 3000);
    }
}
