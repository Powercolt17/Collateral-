// X OAuth Callback Handler
// Handles: /x/callback?success=true&username=... or /x/callback?error=...

export function renderXCallback() {
    return `
        <style>
            .cb-page {
                min-height: calc(100vh - 72px);
                background: #FAF4E6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: var(--font-content);
                position: relative;
                overflow: hidden;
            }
            .cb-page::before {
                content: '';
                position: absolute;
                top: -40%;
                left: -20%;
                width: 140%;
                height: 140%;
                background: radial-gradient(ellipse at center, rgba(92,20,20,0.03) 0%, transparent 70%);
                pointer-events: none;
            }
            .cb-card {
                position: relative;
                background: #F5EDDA;
                border: 1px solid rgba(70,55,35,.22);
                width: 100%;
                max-width: 480px;
                padding: 56px 48px 48px;
                text-align: center;
                box-shadow: 0 4px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03);
                animation: cbSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            @keyframes cbSlideUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .cb-icon-wrap {
                width: 72px;
                height: 72px;
                margin: 0 auto 28px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cb-icon-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #e8f4ed;
                animation: cbRingPulse 2s ease-in-out infinite;
            }
            @keyframes cbRingPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.08); opacity: 0.6; }
            }
            .cb-icon-circle {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #f0faf4, #e2f5ea);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: cbFadeIn 0.6s 0.2s both;
            }
            @keyframes cbFadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            .cb-icon-circle svg {
                width: 24px;
                height: 24px;
                color: #1a8a4a;
            }
            .cb-checkmark {
                stroke-dasharray: 30;
                stroke-dashoffset: 30;
                animation: cbCheck 0.5s 0.5s ease forwards;
            }
            @keyframes cbCheck {
                to { stroke-dashoffset: 0; }
            }
            .cb-status-label {
                font-family: var(--font-data);
                font-size: 10px;
                font-weight: 600;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #1a8a4a;
                margin-bottom: 10px;
                animation: cbFadeIn 0.4s 0.3s both;
            }
            .cb-title {
                font-size: 22px;
                font-weight: 700;
                color: #111;
                margin: 0 0 8px;
                letter-spacing: -0.5px;
                animation: cbFadeIn 0.4s 0.35s both;
            }
            .cb-username {
                font-family: var(--font-data);
                font-size: 14px;
                font-weight: 500;
                color: #5C1414;
                margin-bottom: 8px;
                animation: cbFadeIn 0.4s 0.4s both;
            }
            .cb-desc {
                font-size: 13px;
                color: #999;
                line-height: 1.7;
                margin-bottom: 32px;
                animation: cbFadeIn 0.4s 0.45s both;
            }
            .cb-divider {
                width: 48px;
                height: 1px;
                background: #eee;
                margin: 0 auto 32px;
                animation: cbFadeIn 0.4s 0.5s both;
            }
            .cb-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 14px 36px;
                background: #0a0a0a;
                color: #fff;
                font-family: var(--font-data);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                border: none;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden;
                animation: cbFadeIn 0.4s 0.55s both;
            }
            .cb-btn:hover {
                background: #5C1414;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(92,20,20,0.25);
            }
            .cb-btn:active {
                transform: translateY(0) scale(0.97);
                transition: all 0.08s ease;
            }
            .cb-btn::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -100%;
                width: 60%;
                height: 200%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
                transform: skewX(-25deg);
                transition: left 0.5s ease;
            }
            .cb-btn:hover::after { left: 150%; }
            .cb-btn svg { width: 14px; height: 14px; }
            .cb-footer {
                margin-top: 28px;
                font-family: var(--font-data);
                font-size: 9px;
                color: #ccc;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                animation: cbFadeIn 0.4s 0.6s both;
            }

            /* Error state */
            .cb-error-icon {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #fef2f2, #fde8e8);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cb-error-icon svg { width: 24px; height: 24px; color: #b91c1c; }
            .cb-error-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #fde8e8;
            }
        </style>
        <div class="cb-page">
            <div class="cb-card">
                <div id="x-callback-loading">
                    <div class="cb-icon-wrap">
                        <div style="width:20px;height:20px;border:2px solid rgba(70,55,35,.18);border-top-color:#111;border-radius:50%;animation:src-spin 0.7s linear infinite;"></div>
                    </div>
                    <div class="cb-status-label">Verifying</div>
                    <h2 class="cb-title">Processing X Connection</h2>
                    <p class="cb-desc">Establishing authority binding...</p>
                </div>

                <div id="x-callback-success" class="hidden">
                    <div class="cb-icon-wrap">
                        <div class="cb-icon-ring"></div>
                        <div class="cb-icon-circle">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path class="cb-checkmark" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div class="cb-status-label">Binding Established</div>
                    <h2 class="cb-title">X Account Connected</h2>
                    <p id="x-username-display" class="cb-username"></p>
                    <p class="cb-desc">Authority binding verified. Your X metrics are now available for contract verification.</p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/market')" class="cb-btn">
                        Continue to Market
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <div class="cb-footer">Read-only access · Encrypted at rest</div>
                </div>

                <div id="x-callback-error" class="hidden">
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
                    <p id="x-error-message" class="cb-username" style="color:#b91c1c;"></p>
                    <p id="x-error-hint" class="cb-desc"></p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/sources')" class="cb-btn">
                        Try Again
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function initXCallback() {
    // Parse URL params - for hash routing, params are in the hash (e.g. #/x/callback?error=...)
    // First try window.location.search (path-based), then fall back to parsing from hash
    let urlParams;
    if (window.location.search) {
        urlParams = new URLSearchParams(window.location.search);
    } else {
        // Hash routing: extract query string from hash (e.g. "#/x/callback?error=already_bound")
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        const queryString = queryIndex !== -1 ? hash.substring(queryIndex) : '';
        urlParams = new URLSearchParams(queryString);
    }
    const success = urlParams.get('success');
    const username = urlParams.get('username');
    const error = urlParams.get('error');

    const loadingEl = document.getElementById('x-callback-loading');
    const successEl = document.getElementById('x-callback-success');
    const errorEl = document.getElementById('x-callback-error');
    const errorMessageEl = document.getElementById('x-error-message');
    const errorHintEl = document.getElementById('x-error-hint');
    const usernameDisplayEl = document.getElementById('x-username-display');

    // Small delay for UX (loading spinner feels more intentional)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Handle success - VERIFY with backend before trusting URL param
    if (success === 'true') {
        try {
            // Fail-closed: verify status with backend
            const status = await window.api.getXStatus();
            console.log('[XCallback] Status check:', status);

            if (status.connected) {
                loadingEl.classList.add('hidden');
                successEl.classList.remove('hidden');

                const displayUsername = status.xUsername || (username ? decodeURIComponent(username) : null);
                if (displayUsername) {
                    usernameDisplayEl.textContent = `@${displayUsername}`;
                } else {
                    usernameDisplayEl.textContent = 'Account Connected';
                }

                // Re-hydrate session to sync connected sources
                if (window.hydrateSession) {
                    await window.hydrateSession();
                }

                // If opened as popup, close window after brief success message
                // Parent window is polling and will detect the connection
                setTimeout(() => {
                    if (window.opener) {
                        // We're in a popup - close it
                        window.close();
                    } else {
                        // We're in main window (fallback) - redirect to contracts
                        window.router.navigate('/market');
                    }
                }, 1500);

                return;
            } else {
                // Backend says not connected despite ?success=true
                console.error('[XCallback] Status check failed - not actually connected');
                loadingEl.classList.add('hidden');
                errorEl.classList.remove('hidden');
                errorMessageEl.textContent = 'Connection incomplete';
                errorHintEl.textContent = 'The X account binding did not complete. Please try again.';
                return;
            }
        } catch (err) {
            console.error('[XCallback] Status check error:', err);
            loadingEl.classList.add('hidden');
            errorEl.classList.remove('hidden');
            errorMessageEl.textContent = 'Verification failed';
            errorHintEl.textContent = 'Could not verify connection status. Please try again.';
            return;
        }
    }

    // Handle errors
    if (error) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');

        // Map error codes to user-friendly messages
        const errorMessages = {
            'denied': {
                message: 'Authorization Denied',
                hint: 'You declined the connection. Try again below.'
            },
            'protected': {
                message: 'Account Is Protected',
                hint: 'Only public accounts can be verified.'
            },
            'already_bound': {
                message: 'Already Linked',
                hint: 'This X account is connected to another user.'
            },
            'verification_failed': {
                message: 'Verification Failed',
                hint: 'Could not verify your account. Try again.'
            },
            'expired': {
                message: 'Session Expired',
                hint: 'Authorization timed out. Try again.'
            }
        };

        const errorInfo = errorMessages[error] || {
            message: 'Something Went Wrong',
            hint: 'Please try again.'
        };

        errorMessageEl.textContent = errorInfo.message;
        errorHintEl.textContent = errorInfo.hint;

        return;
    }

    // No success or error - unexpected state
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorMessageEl.textContent = 'Invalid callback state';
    errorHintEl.textContent = 'No success or error parameter received. Please try connecting again.';
}
