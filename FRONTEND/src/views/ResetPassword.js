/**
 * Reset Password View
 * 
 * Handles the reset password form when user clicks the email link.
 * Reads token from URL query params.
 */

export function renderResetPassword() {
    return `
    <div class="rp-container">
        <div class="rp-card">
            <div class="rp-brand">
                <div class="rp-brand-bar"></div>
                <span class="rp-brand-text">Collateral</span>
            </div>

            <h1 class="rp-title">Set New Password</h1>
            <p class="rp-subtitle">Choose a new password for your account. Must be at least 8 characters.</p>

            <form id="rp-form" class="rp-form">
                <div class="rp-field">
                    <label class="rp-label">NEW PASSWORD</label>
                    <input type="password" id="rp-password" class="rp-input" placeholder="Enter new password" required minlength="8" autocomplete="new-password" />
                </div>

                <div class="rp-field">
                    <label class="rp-label">CONFIRM PASSWORD</label>
                    <input type="password" id="rp-confirm" class="rp-input" placeholder="Confirm new password" required minlength="8" autocomplete="new-password" />
                </div>

                <div id="rp-message" class="rp-message" style="display:none;"></div>

                <button type="submit" id="rp-submit" class="rp-button">
                    Update Password →
                </button>
            </form>

            <div class="rp-back">
                <a href="#" onclick="window.router.navigate('/market'); setTimeout(()=>window.app&&window.app.openAccessModal(),300); return false;" class="rp-back-link">← Back to Sign In</a>
            </div>
        </div>
    </div>

    <style>
        .rp-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FAF4E6;
            padding: 20px;
        }
        .rp-card {
            width: 100%;
            max-width: 420px;
            background: #F5EDDA;
            border: 1px solid rgba(70,55,35,.22);
            padding: 48px 40px;
        }
        .rp-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 40px;
        }
        .rp-brand-bar {
            width: 3px;
            height: 18px;
            background: #752122;
        }
        .rp-brand-text {
            font-size: 12px;
            font-weight: 800;
            color: #111;
            letter-spacing: 0.1em;
            font-family: 'JetBrains Mono', monospace;
        }
        .rp-title {
            font-size: 24px;
            font-weight: 700;
            color: #111;
            margin: 0 0 8px 0;
            letter-spacing: -0.3px;
        }
        .rp-subtitle {
            font-size: 13px;
            color: #888;
            margin: 0 0 32px 0;
            line-height: 1.6;
        }
        .rp-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .rp-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .rp-label {
            font-size: 10px;
            font-weight: 700;
            color: #888;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-family: 'JetBrains Mono', monospace;
        }
        .rp-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid rgba(70,55,35,.26);
            background: #FAF4E6;
            font-size: 14px;
            color: #111;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .rp-input:focus {
            border-color: #111;
            background: #F5EDDA;
        }
        .rp-message {
            padding: 12px 14px;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid;
        }
        .rp-message.success {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #15803d;
        }
        .rp-message.error {
            background: #fef2f2;
            border-color: #fecaca;
            color: #991b1b;
        }
        .rp-button {
            width: 100%;
            padding: 14px;
            background: #111;
            color: #fff;
            border: none;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            transition: opacity 0.2s;
            font-family: 'JetBrains Mono', monospace;
        }
        .rp-button:hover { opacity: 0.85; }
        .rp-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .rp-back {
            margin-top: 24px;
            text-align: center;
        }
        .rp-back-link {
            font-size: 12px;
            color: #888;
            text-decoration: none;
            transition: color 0.2s;
        }
        .rp-back-link:hover { color: #111; }
    </style>
    `;
}

export function initResetPassword() {
    const form = document.getElementById('rp-form');
    if (!form) return;

    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        const messageEl = document.getElementById('rp-message');
        messageEl.className = 'rp-message error';
        messageEl.textContent = 'Invalid reset link. No token found.';
        messageEl.style.display = 'block';
        document.getElementById('rp-submit').disabled = true;
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordInput = document.getElementById('rp-password');
        const confirmInput = document.getElementById('rp-confirm');
        const submitBtn = document.getElementById('rp-submit');
        const messageEl = document.getElementById('rp-message');
        const password = passwordInput?.value;
        const confirm = confirmInput?.value;

        // Validate match
        if (password !== confirm) {
            messageEl.className = 'rp-message error';
            messageEl.textContent = 'Passwords do not match.';
            messageEl.style.display = 'block';
            return;
        }

        if (password.length < 8) {
            messageEl.className = 'rp-message error';
            messageEl.textContent = 'Password must be at least 8 characters.';
            messageEl.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        messageEl.style.display = 'none';

        try {
            const API_BASE = window.api?.getApiEnvironment?.()?.url || 'https://collateral-production.up.railway.app';
            const res = await fetch(`${API_BASE}/v1/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const response = await res.json().catch(() => ({}));

            if (response.ok) {
                messageEl.className = 'rp-message success';
                messageEl.textContent = 'Password updated! Redirecting to sign in...';
                messageEl.style.display = 'block';
                submitBtn.textContent = 'Updated ✓';

                // Redirect to homepage and pop up sign-in modal
                setTimeout(() => {
                    window.router.navigate('/market');
                    setTimeout(() => {
                        if (window.app?.openAccessModal) {
                            window.app.openAccessModal();
                        }
                    }, 300);
                }, 1500);
            } else {
                messageEl.className = 'rp-message error';
                messageEl.textContent = response.error || 'Failed to reset password.';
                messageEl.style.display = 'block';
                submitBtn.textContent = 'Update Password →';
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('[ResetPassword] Request failed:', err);
            messageEl.className = 'rp-message error';
            messageEl.textContent = err.message || 'Failed to reset password. Please try again.';
            messageEl.style.display = 'block';
            submitBtn.textContent = 'Update Password →';
            submitBtn.disabled = false;
        }
    });
}
