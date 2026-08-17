// Amazon Seller OAuth Callback Handler
// Handles: /amazon/callback?success=true&seller=xxx OR ?error=xxx
// Backend has already exchanged the code - we just display the result

export function renderAmazonCallback() {
    return `
        <style>
            .amz-cb { min-height: 100vh; background: #FAF4E6; display: flex; align-items: center; justify-content: center; font-family: 'Sora', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .amz-cb-card { background: #F5EDDA; border: 1px solid rgba(70,55,35,.22); border-radius: 12px; padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; }
            @keyframes cl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes cl-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
            .amz-cb-spinner { position: relative; width: 48px; height: 48px; margin: 0 auto 20px; }
            @keyframes amz-spin { to { transform: rotate(360deg); } }
            .amz-cb-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; }
            .amz-cb-icon.success { background: rgba(22, 163, 74, 0.1); }
            .amz-cb-icon.error { background: rgba(220, 38, 38, 0.1); }
            .amz-cb h2 { font-size: 18px; font-weight: 600; color: #111; margin: 0 0 8px; }
            .amz-cb p { font-size: 14px; color: #737373; margin: 0 0 16px; }
            .amz-cb-detail { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #a3a3a3; margin-bottom: 24px; }
            .amz-cb-btn { display: inline-block; padding: 10px 24px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 150ms; }
            .amz-cb-btn:hover { background: #333; }
            .amz-cb-error-msg { font-size: 13px; color: #dc2626; margin-bottom: 20px; }
            .amz-hidden { display: none; }
        </style>
        <div class="amz-cb">
            <div class="amz-cb-card">
                <div id="amazon-cb-loading">
                    <div class="amz-cb-spinner">
                        <svg style="position:absolute;top:0;left:0;width:100%;height:100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="15.5" stroke="#3B0001" stroke-width="2"/><line x1="32" y1="19.5" x2="32" y2="44.5" stroke="#3B0001" stroke-width="1.5" stroke-linecap="round" style="animation:cl-pulse 1.6s ease-in-out infinite"/></svg>
                        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;animation:cl-spin 2.4s linear infinite;transform-origin:center center" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26.5" ry="7.5" stroke="#3B0001" stroke-width="1.1" fill="none" transform="rotate(-27 32 32)"/></svg>
                    </div>
                    <h2>Connecting Amazon Seller</h2>
                    <p>Please wait while we complete the connection...</p>
                </div>
                
                <div id="amazon-cb-success" class="amz-hidden">
                    <div class="amz-cb-icon success">✅</div>
                    <h2>Amazon Connected!</h2>
                    <p>Your Amazon Seller account has been successfully connected.</p>
                    <div id="amazon-seller-display" class="amz-cb-detail"></div>
                    <button onclick="window.router.navigate('/market')" class="amz-cb-btn">
                        Continue to Market
                    </button>
                </div>
                
                <div id="amazon-cb-error" class="amz-hidden">
                    <div class="amz-cb-icon error">❌</div>
                    <h2>Connection Failed</h2>
                    <p id="amazon-error-message" class="amz-cb-error-msg"></p>
                    <button onclick="window.router.navigate('/sources')" class="amz-cb-btn">
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function initAmazonCallback() {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    const success = urlParams.get('success');
    const seller = urlParams.get('seller');
    const error = urlParams.get('error');

    const loadingEl = document.getElementById('amazon-cb-loading');
    const successEl = document.getElementById('amazon-cb-success');
    const errorEl = document.getElementById('amazon-cb-error');
    const errorMessageEl = document.getElementById('amazon-error-message');
    const sellerDisplayEl = document.getElementById('amazon-seller-display');

    // Clean up stored OAuth state
    localStorage.removeItem('amazon_oauth_flow');

    if (error) {
        console.log('[AmazonCallback] Error from backend:', error);
        loadingEl.classList.add('amz-hidden');
        errorEl.classList.remove('amz-hidden');

        const errorMessages = {
            'missing_params': 'Missing authorization parameters. Please try again.',
            'invalid_state': 'Session expired or invalid. Please try again.',
            'state_expired': 'Your session has expired. Please try again.',
            'config_error': 'Amazon Seller is not properly configured. Please contact support.',
            'exchange_failed': 'Failed to connect Amazon account. Please try again.',
            'server_error': 'Server error occurred. Please try again.',
        };

        errorMessageEl.textContent = errorMessages[error] || `Connection failed: ${error}`;

        if (window.opener) {
            setTimeout(() => window.close(), 3000);
        }
        return;
    }

    if (success === 'true') {
        console.log('[AmazonCallback] Success! Seller:', seller);

        if (window.hydrateSession) {
            await window.hydrateSession();
        }

        if (window.opener) {
            console.log('[AmazonCallback] Popup detected, closing...');
            window.close();
            return;
        }

        loadingEl.classList.add('amz-hidden');
        successEl.classList.remove('amz-hidden');

        if (seller) {
            sellerDisplayEl.textContent = `Seller ID: ${seller}`;
        }

        setTimeout(() => {
            window.router.navigate('/market');
        }, 2000);

        return;
    }

    // Neither success nor error
    loadingEl.classList.add('amz-hidden');
    errorEl.classList.remove('amz-hidden');
    errorMessageEl.textContent = 'Invalid callback. Please try connecting again.';

    if (window.opener) {
        setTimeout(() => window.close(), 3000);
    }
}
