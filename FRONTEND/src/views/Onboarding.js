// Onboarding — First-time user guided setup wizard
// Only shown once after signup, tracked via localStorage

export function renderOnboarding() {
    return `
        <style>
            .ob { min-height: 100vh; background: #F5EDDA; display: flex; align-items: center; justify-content: center; padding: 40px 20px; font-family: 'Sora', sans-serif; }
            .ob-card { max-width: 560px; width: 100%; }

            /* Progress bar */
            .ob-progress { display: flex; align-items: center; gap: 0; margin-bottom: 48px; }
            .ob-progress-step {
                flex: 1; height: 4px; background: #eee; position: relative; transition: background 0.4s ease;
            }
            .ob-progress-step.done { background: #5C1414; }
            .ob-progress-step.active { background: linear-gradient(90deg, #5C1414 50%, #eee 50%); animation: ob-fill 0.6s ease forwards; }
            @keyframes ob-fill { to { background: #5C1414; } }

            .ob-progress-labels {
                display: flex; justify-content: space-between; margin-bottom: 8px;
            }
            .ob-progress-label {
                font-family: 'JetBrains Mono', monospace; font-size: 9px;
                letter-spacing: 1px; text-transform: uppercase; color: #ccc;
                transition: color 0.3s;
            }
            .ob-progress-label.active { color: #5C1414; font-weight: 600; }
            .ob-progress-label.done { color: #111; }

            /* Step content */
            .ob-step { display: none; animation: ob-fadeIn 0.4s ease; }
            .ob-step.active { display: block; }

            .ob-icon {
                width: 64px; height: 64px; background: #fef2f2; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin-bottom: 28px; font-size: 22px;
            }
            .ob-title {
                font-size: 22px; font-weight: 800; color: #111; margin-bottom: 12px;
                letter-spacing: -0.5px;
            }
            .ob-subtitle {
                font-size: 15px; color: #777; line-height: 1.7; margin-bottom: 32px;
            }

            /* Action cards */
            .ob-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
            .ob-action {
                display: flex; align-items: center; gap: 16px;
                padding: 20px; border: 1px solid rgba(70,55,35,.18); cursor: pointer;
                transition: all 0.2s ease; background: #F5EDDA;
            }
            .ob-action:hover { border-color: #5C1414; transform: translateX(4px); }
            .ob-action-icon {
                width: 44px; height: 44px; background: #f8f8f8;
                display: flex; align-items: center; justify-content: center;
                font-size: 20px; flex-shrink: 0;
            }
            .ob-action-text { flex: 1; }
            .ob-action-title { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 2px; }
            .ob-action-desc { font-size: 12px; color: #999; }
            .ob-action-arrow { color: #ccc; font-size: 18px; }

            /* Buttons */
            .ob-btn-primary {
                width: 100%; padding: 18px; background: #5C1414; color: #fff;
                border: none; font-size: 14px; font-weight: 700;
                letter-spacing: 1px; text-transform: uppercase; cursor: pointer;
                font-family: 'Sora', sans-serif; transition: all 0.3s;
            }
            .ob-btn-primary:hover { background: #6e1c1c; }
            .ob-btn-skip {
                display: block; width: 100%; text-align: center;
                margin-top: 16px; font-size: 12px; color: #bbb;
                background: none; border: none; cursor: pointer;
                font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;
            }
            .ob-btn-skip:hover { color: #888; }

            /* Checklist */
            .ob-checklist { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
            .ob-check-item {
                display: flex; align-items: center; gap: 14px; padding: 16px;
                background: #FAF4E6; border: 1px solid #f0f0f0;
            }
            .ob-check-icon {
                width: 28px; height: 28px; border-radius: 50%;
                border: 2px solid rgba(70,55,35,.26); display: flex; align-items: center;
                justify-content: center; flex-shrink: 0; font-size: 14px;
                transition: all 0.3s;
            }
            .ob-check-item.completed .ob-check-icon {
                background: #5C1414; border-color: #5C1414; color: #fff;
            }
            .ob-check-label { font-size: 14px; color: #333; }
            .ob-check-item.completed .ob-check-label { text-decoration: line-through; color: #aaa; }

            @keyframes ob-fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

            /* Mobile */
            @media (max-width: 768px) {
                .ob { padding: 24px 16px; align-items: flex-start; padding-top: 60px; }
                .ob-title { font-size: 24px; }
                .ob-subtitle { font-size: 14px; }
                .ob-icon { width: 52px; height: 52px; font-size: 24px; margin-bottom: 24px; }
                .ob-action { padding: 16px; }
            }
        </style>

        <div class="ob">
            <div class="ob-card">
                <!-- Progress Labels -->
                <div class="ob-progress-labels">
                    <span class="ob-progress-label active" data-ob-label="0">Welcome</span>
                    <span class="ob-progress-label" data-ob-label="1">Connect</span>
                    <span class="ob-progress-label" data-ob-label="2">Fund</span>
                    <span class="ob-progress-label" data-ob-label="3">Create</span>
                </div>
                <!-- Progress Bar -->
                <div class="ob-progress">
                    <div class="ob-progress-step active" data-ob-bar="0"></div>
                    <div class="ob-progress-step" data-ob-bar="1"></div>
                    <div class="ob-progress-step" data-ob-bar="2"></div>
                    <div class="ob-progress-step" data-ob-bar="3"></div>
                </div>

                <!-- Step 1: Welcome -->
                <div class="ob-step active" data-ob-step="0">
                    <div class="ob-icon">🎯</div>
                    <div class="ob-title">Welcome to Collateral.</div>
                    <div class="ob-subtitle">
                        You just made the first move. Here's how it works: you lock real money against a growth target. 
                        Hit it — you get paid. Miss it — you lose your stake.<br><br>
                        Let's get you set up in 3 steps.
                    </div>

                    <div class="ob-checklist">
                        <div class="ob-check-item completed">
                            <div class="ob-check-icon">✓</div>
                            <div class="ob-check-label">Create your account</div>
                        </div>
                        <div class="ob-check-item">
                            <div class="ob-check-icon">2</div>
                            <div class="ob-check-label">Connect a revenue or growth source</div>
                        </div>
                        <div class="ob-check-item">
                            <div class="ob-check-icon">3</div>
                            <div class="ob-check-label">Add a funding method</div>
                        </div>
                        <div class="ob-check-item">
                            <div class="ob-check-icon">4</div>
                            <div class="ob-check-label">Execute your first contract</div>
                        </div>
                    </div>

                    <button class="ob-btn-primary" id="ob-next-0">Let's Go →</button>
                    <button class="ob-btn-skip" id="ob-skip">I'll figure it out myself</button>
                </div>

                <!-- Step 2: Connect Source -->
                <div class="ob-step" data-ob-step="1">
                    <div class="ob-icon">🔗</div>
                    <div class="ob-title">Connect your source.</div>
                    <div class="ob-subtitle">
                        We need read-only access to verify your growth. Pick the platform you want to bet on — your data is never shared or stored.
                    </div>

                    <div class="ob-actions">
                        <div class="ob-action" onclick="window.router.navigate('/sources'); localStorage.setItem('ob_step','2');">
                            <div class="ob-action-icon">💳</div>
                            <div class="ob-action-text">
                                <div class="ob-action-title">Stripe</div>
                                <div class="ob-action-desc">Revenue growth verification</div>
                            </div>
                            <div class="ob-action-arrow">→</div>
                        </div>
                        <div class="ob-action" onclick="window.router.navigate('/sources'); localStorage.setItem('ob_step','2');">
                            <div class="ob-action-icon">𝕏</div>
                            <div class="ob-action-text">
                                <div class="ob-action-title">X (Twitter)</div>
                                <div class="ob-action-desc">Follower growth verification</div>
                            </div>
                            <div class="ob-action-arrow">→</div>
                        </div>
                        <div class="ob-action" onclick="window.router.navigate('/sources'); localStorage.setItem('ob_step','2');">
                            <div class="ob-action-icon">🛍</div>
                            <div class="ob-action-text">
                                <div class="ob-action-title">Shopify</div>
                                <div class="ob-action-desc">Order & sales verification</div>
                            </div>
                            <div class="ob-action-arrow">→</div>
                        </div>
                        <div class="ob-action" onclick="window.router.navigate('/sources'); localStorage.setItem('ob_step','2');">
                            <div class="ob-action-icon">📦</div>
                            <div class="ob-action-text">
                                <div class="ob-action-title">Amazon</div>
                                <div class="ob-action-desc">Seller revenue verification</div>
                            </div>
                            <div class="ob-action-arrow">→</div>
                        </div>
                    </div>

                    <button class="ob-btn-skip" id="ob-skip-1">Skip for now — I'll connect later</button>
                </div>

                <!-- Step 3: Add Funding -->
                <div class="ob-step" data-ob-step="2">
                    <div class="ob-icon">💰</div>
                    <div class="ob-title">Add your funding method.</div>
                    <div class="ob-subtitle">
                        Your card is only charged when you execute a contract. No hidden fees, no subscriptions. 
                        Capital is held securely through Stripe until settlement.
                    </div>

                    <button class="ob-btn-primary" id="ob-add-card">Add Payment Method →</button>
                    <button class="ob-btn-skip" id="ob-skip-2">Skip — I'll add it when I'm ready</button>
                </div>

                <!-- Step 4: Create Contract + Referral -->
                <div class="ob-step" data-ob-step="3">
                    <div class="ob-icon">🚀</div>
                    <div class="ob-title">You're ready.</div>
                    <div class="ob-subtitle">
                        Browse live contracts, pick a growth target, and lock your capital. 
                        The protocol handles everything else — verification, settlement, payout.
                        <br><br>
                        <strong style="color:#111;">This is where talk stops and results start.</strong>
                    </div>

                    <button class="ob-btn-primary" id="ob-go-market">Browse Contracts →</button>
                    <button class="ob-btn-skip" id="ob-go-rivalry">Or start a Rivalry duel instead</button>

                    <!-- Referral invite -->
                    <div style="margin-top:40px;padding-top:32px;border-top:1px solid #f0f0f0;">
                        <div style="font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin-bottom:16px;">── Invite & Earn</div>
                        <div style="font-size:14px;color:#555;line-height:1.6;margin-bottom:20px;">
                            Share your referral link and earn a <strong style="color:#5C1414;">profit boost</strong> on every contract. 
                            The more people you refer, the higher your payout multiplier.
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;" id="ob-ref-row">
                            <input type="text" id="ob-ref-link" readonly 
                                style="flex:1;padding:14px;border:1px solid rgba(70,55,35,.18);font-family:'JetBrains Mono',monospace;font-size:12px;color:#555;background: #FAF4E6;outline:none;"
                                value="Loading...">
                            <button id="ob-ref-copy" 
                                style="padding:14px 20px;background:#111;color:#fff;border:none;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:'Sora',sans-serif;white-space:nowrap;">
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initOnboarding() {
    const steps = document.querySelectorAll('[data-ob-step]');
    const bars = document.querySelectorAll('[data-ob-bar]');
    const labels = document.querySelectorAll('[data-ob-label]');
    let current = 0;

    function goTo(step) {
        current = step;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i === step);
        });
        bars.forEach((b, i) => {
            b.classList.remove('done', 'active');
            if (i < step) b.classList.add('done');
            if (i === step) b.classList.add('active');
        });
        labels.forEach((l, i) => {
            l.classList.remove('done', 'active');
            if (i < step) l.classList.add('done');
            if (i === step) l.classList.add('active');
        });
        localStorage.setItem('ob_step', step.toString());
    }

    // Step 1 → Step 2
    const next0 = document.getElementById('ob-next-0');
    if (next0) next0.addEventListener('click', () => goTo(1));

    // Skip from step 2 → step 3
    const skip1 = document.getElementById('ob-skip-1');
    if (skip1) skip1.addEventListener('click', () => goTo(2));

    // Step 3: add card
    const addCard = document.getElementById('ob-add-card');
    if (addCard) addCard.addEventListener('click', () => {
        if (window.app.openCardModal) window.app.openCardModal();
        goTo(3);
    });

    // Skip from step 3 → step 4
    const skip2 = document.getElementById('ob-skip-2');
    if (skip2) skip2.addEventListener('click', () => goTo(3));

    // Final step: go to market
    const goMarket = document.getElementById('ob-go-market');
    if (goMarket) goMarket.addEventListener('click', () => {
        completeOnboarding();
        window.router.navigate('/market');
    });

    // Final step: go to rivalry
    const goRivalry = document.getElementById('ob-go-rivalry');
    if (goRivalry) goRivalry.addEventListener('click', () => {
        completeOnboarding();
        window.router.navigate('/market?type=rivalry');
    });

    // Skip entire onboarding
    const skip = document.getElementById('ob-skip');
    if (skip) skip.addEventListener('click', () => {
        completeOnboarding();
        window.router.navigate('/market');
    });

    // Track GA4
    if (window.trackEvent) {
        window.trackEvent('onboarding_started');
    }

    // Referral link — fetch user's code and populate
    const refInput = document.getElementById('ob-ref-link');
    const refCopy = document.getElementById('ob-ref-copy');

    (async () => {
        try {
            const api = (await import('../api.js')).default;
            const profile = await api.getProfile();
            if (profile?.ok && profile.user?.referralCode) {
                const link = `${window.location.origin}/#/r/${profile.user.referralCode}`;
                if (refInput) refInput.value = link;
            } else {
                if (refInput) refInput.value = 'Sign in to get your link';
            }
        } catch {
            if (refInput) refInput.value = 'collateral.market';
        }
    })();

    if (refCopy) refCopy.addEventListener('click', () => {
        const input = document.getElementById('ob-ref-link');
        if (input) {
            navigator.clipboard.writeText(input.value).then(() => {
                refCopy.textContent = 'Copied!';
                setTimeout(() => { refCopy.textContent = 'Copy'; }, 2000);
                if (window.trackEvent) window.trackEvent('referral_link_copied', { source: 'onboarding' });
            });
        }
    });
}

export function completeOnboarding() {
    localStorage.setItem('ob_completed', 'true');
    localStorage.removeItem('ob_step');
    if (window.trackEvent) {
        window.trackEvent('onboarding_completed');
    }
}

export function shouldShowOnboarding() {
    return localStorage.getItem('ob_completed') !== 'true';
}
