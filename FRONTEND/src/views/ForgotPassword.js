/**
 * Forgot Password View
 * 
 * Simple form to request a password reset email.
 * Only for email/password accounts.
 */

export function renderForgotPassword() {
    return `
    <div class="fp-container">
        <div class="fp-card">
            <div class="fp-brand">
                <div class="fp-brand-bar"></div>
                <span class="fp-brand-text">Collateral</span>
            </div>

            <h1 class="fp-title">Reset Password</h1>
            <p class="fp-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

            <form id="fp-form" class="fp-form">
                <div class="fp-field">
                    <label class="fp-label">EMAIL ADDRESS</label>
                    <input type="email" id="fp-email" class="fp-input" placeholder="you@example.com" required autocomplete="email" />
                </div>

                <div id="fp-message" class="fp-message" style="display:none;"></div>

                <button type="submit" id="fp-submit" class="fp-button">
                    Send Reset Link →
                </button>
            </form>

            <div class="fp-back">
                <a href="#" onclick="window.router.navigate('/market'); setTimeout(()=>window.app&&window.app.openAccessModal(),300); return false;" class="fp-back-link">← Back to Sign In</a>
            </div>
        </div>
    </div>

    <style>
        .fp-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FAF4E6;
            padding: 20px;
        }
        .fp-card {
            width: 100%;
            max-width: 420px;
            background: #F5EDDA;
            border: 1px solid rgba(70,55,35,.22);
            padding: 48px 40px;
        }
        .fp-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 40px;
        }
        .fp-brand-bar {
            width: 3px;
            height: 18px;
            background: #752122;
        }
        .fp-brand-text {
            font-size: 12px;
            font-weight: 800;
            color: #111;
            letter-spacing: 0.1em;
            font-family: 'JetBrains Mono', monospace;
        }
        .fp-title {
            font-size: 24px;
            font-weight: 700;
            color: #111;
            margin: 0 0 8px 0;
            letter-spacing: -0.3px;
        }
        .fp-subtitle {
            font-size: 13px;
            color: #888;
            margin: 0 0 32px 0;
            line-height: 1.6;
        }
        .fp-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .fp-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .fp-label {
            font-size: 10px;
            font-weight: 700;
            color: #888;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-family: 'JetBrains Mono', monospace;
        }
        .fp-input {
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
        .fp-input:focus {
            border-color: #111;
            background: #F5EDDA;
        }
        .fp-message {
            padding: 12px 14px;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid;
        }
        .fp-message.success {
            background: #f0fdf4;
            border-color: #bbf7d0;
            color: #15803d;
        }
        .fp-message.error {
            background: #fef2f2;
            border-color: #fecaca;
            color: #991b1b;
        }
        .fp-button {
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
        .fp-button:hover { opacity: 0.85; }
        .fp-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .fp-back {
            margin-top: 24px;
            text-align: center;
        }
        .fp-back-link {
            font-size: 12px;
            color: #888;
            text-decoration: none;
            transition: color 0.2s;
        }
        .fp-back-link:hover { color: #111; }
    </style>
    `;
}

export function initForgotPassword() {
    const form = document.getElementById('fp-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('fp-email');
        const submitBtn = document.getElementById('fp-submit');
        const messageEl = document.getElementById('fp-message');
        const email = emailInput?.value?.trim();

        if (!email) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        messageEl.style.display = 'none';

        try {
            const API_BASE = window.api?.getApiEnvironment?.()?.url || 'https://collateral-production.up.railway.app';
            const res = await fetch(`${API_BASE}/v1/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));

            messageEl.className = 'fp-message success';
            messageEl.textContent = data.message || 'If an account exists with that email, a reset link has been sent.';
            messageEl.style.display = 'block';
            submitBtn.textContent = 'Sent ✓';
        } catch (err) {
            console.error('[ForgotPassword] Request failed:', err);
            messageEl.className = 'fp-message error';
            messageEl.textContent = 'Something went wrong. Please try again.';
            messageEl.style.display = 'block';
            submitBtn.textContent = 'Send Reset Link →';
            submitBtn.disabled = false;
        }
    });
}
