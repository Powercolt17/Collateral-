// YouTube OAuth Callback Handler
// Handles: /youtube/callback?success=true&channel=xxx OR ?error=xxx
// Backend has already exchanged the code - we just display the result

export function renderYouTubeCallback() {
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
            .cb-btn svg { width: 14px; height: 14px; }
            .cb-footer { margin-top: 28px; font-family: var(--font-data); font-size: 9px; color: #ccc; text-transform: uppercase; letter-spacing: 0.1em; animation: cbFadeIn 0.4s 0.6s both; }
            .cb-error-icon { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #fef2f2, #fde8e8); display: flex; align-items: center; justify-content: center; }
            .cb-error-icon svg { width: 24px; height: 24px; color: #b91c1c; }
            .cb-error-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid #fde8e8; }
            .yt-hidden { display: none; }
        </style>
        <div class="cb-page">
            <div class="cb-card">
                <div id="youtube-cb-loading">
                    <div class="cb-icon-wrap">
                        <div style="width:20px;height:20px;border:2px solid rgba(70,55,35,.18);border-top-color:#111;border-radius:50%;animation:cbSlideUp 0.7s linear infinite;"></div>
                    </div>
                    <div class="cb-status-label" style="color:#999;">Verifying</div>
                    <h2 class="cb-title">Connecting YouTube</h2>
                    <p class="cb-desc">Establishing channel binding...</p>
                </div>

                <div id="youtube-cb-success" class="yt-hidden">
                    <div class="cb-icon-wrap">
                        <div class="cb-icon-ring"></div>
                        <div class="cb-icon-circle">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path class="cb-checkmark" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <div class="cb-status-label">Binding Established</div>
                    <h2 class="cb-title">YouTube Connected</h2>
                    <p id="youtube-channel-display" class="cb-username"></p>
                    <p class="cb-desc">Channel data is now available for contract verification and settlement.</p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/market')" class="cb-btn">
                        Continue to Market
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <div class="cb-footer">Read-only access · Encrypted at rest</div>
                </div>

                <div id="youtube-cb-error" class="yt-hidden">
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
                    <p id="youtube-error-message" class="cb-username" style="color:#b91c1c;"></p>
                    <div class="cb-divider"></div>
                    <button onclick="window.router.navigate('/sources')" class="cb-btn">
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function initYouTubeCallback() {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    const success = urlParams.get('success');
    const channel = urlParams.get('channel');
    const error = urlParams.get('error');

    const loadingEl = document.getElementById('youtube-cb-loading');
    const successEl = document.getElementById('youtube-cb-success');
    const errorEl = document.getElementById('youtube-cb-error');
    const errorMessageEl = document.getElementById('youtube-error-message');
    const channelDisplayEl = document.getElementById('youtube-channel-display');

    if (error) {
        console.log('[YouTubeCallback] Error from backend:', error);
        loadingEl.classList.add('yt-hidden');
        errorEl.classList.remove('yt-hidden');

        const errorMessages = {
            'missing_params': 'Missing authorization parameters. Please try again.',
            'invalid_state': 'Session expired or invalid. Please try again.',
            'state_expired': 'Your session has expired. Please try again.',
            'config_error': 'YouTube is not properly configured. Please contact support.',
            'exchange_failed': 'Failed to connect YouTube account. Please try again.',
            'server_error': 'Server error occurred. Please try again.',
        };

        errorMessageEl.textContent = errorMessages[error] || `Connection failed: ${decodeURIComponent(error)}`;

        if (window.opener) {
            setTimeout(() => window.close(), 3000);
        }
        return;
    }

    if (success === 'true') {
        console.log('[YouTubeCallback] Success! Channel:', channel);

        if (window.hydrateSession) {
            await window.hydrateSession();
        }

        if (window.opener) {
            console.log('[YouTubeCallback] Popup detected, closing...');
            window.close();
            return;
        }

        loadingEl.classList.add('yt-hidden');
        successEl.classList.remove('yt-hidden');

        if (channel) {
            channelDisplayEl.textContent = `Channel: ${decodeURIComponent(channel)}`;
        }

        setTimeout(() => {
            window.router.navigate('/market');
        }, 2000);

        return;
    }

    // Neither success nor error
    loadingEl.classList.add('yt-hidden');
    errorEl.classList.remove('yt-hidden');
    errorMessageEl.textContent = 'Invalid callback. Please try connecting again.';

    if (window.opener) {
        setTimeout(() => window.close(), 3000);
    }
}
