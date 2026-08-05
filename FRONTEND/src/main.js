// Main entry point
import { showAlert, showConfirm } from './modal.js';
import { Router } from './router.js';
import { renderHeader, initScrollEffects } from './components/Header.js';
import { getAccount, watchAccount, disconnect, signMessage } from '@wagmi/core';
import { modal, wagmiAdapter } from './web3.js';
import { renderRivalry, initRivalry } from './views/Rivalry.js';
import { renderRivalryDetail, initRivalryDetail } from './views/RivalryDetail.js';
import { renderLedger, initLedger } from './views/Ledger.js';
import { renderContracts, initContracts } from './views/Contracts.js';
import { renderContractDetail, initContractDetail } from './views/ContractDetail.js';
import { renderProfile, initProfile } from './views/Profile.js';
import { renderMyContracts, initMyContracts } from './views/MyContracts.js';
import { renderDocs, initDocs } from './views/Docs.js';
import { renderFunding, initFunding } from './views/Funding.js';
import { renderReceipts, initReceipts } from './views/Receipts.js';
import { renderReceiptDetail, initReceiptDetail } from './views/ReceiptDetail.js';
import { renderActiveContracts, initActiveContracts } from './views/ActiveContracts.js';
import { renderSources, initSources } from './views/Sources.js';

import { renderTermSheet, initTermSheet } from './views/TermSheet.js';
import { renderContractTermSheet, initContractTermSheet } from './views/ContractTermSheet.js';
import { renderStripeCallback, initStripeCallback } from './views/StripeCallback.js';
import { renderXCallback, initXCallback } from './views/XCallback.js';
import { renderShopifyCallback, initShopifyCallback } from './views/ShopifyCallback.js';
import { renderAmazonCallback, initAmazonCallback } from './views/AmazonCallback.js';
import { renderYouTubeCallback, initYouTubeCallback } from './views/YouTubeCallback.js';
import { renderPreLaunch, initPreLaunch } from './views/PreLaunch.js';
import { renderTerms, initTerms } from './views/Terms.js';
import { renderPrivacy, initPrivacy } from './views/Privacy.js';
import { renderForgotPassword, initForgotPassword } from './views/ForgotPassword.js';
import { renderResetPassword, initResetPassword } from './views/ResetPassword.js';
import { renderReferrals, initReferrals } from './views/Referrals.js';
import { renderLanding, initLanding } from './views/Landing.js';
import { renderOnboarding, initOnboarding, shouldShowOnboarding, completeOnboarding } from './views/Onboarding.js';
import { renderSEOLanding, initSEOLanding } from './views/SEOLanding.js';
import { renderCreators, initCreators } from './views/Creators.js';
import { renderToken, initToken } from './views/Token.js';
import './views/PreLaunch.css';
import './index.css';
import './mobile.css';
// API Client for backend integration
import api from './api.js';

// Global error handlers for debugging
window.addEventListener('error', (e) => console.error('[GlobalError]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => console.error('[UnhandledPromise]', e.reason));

// ============================================================================
// UTM TRACKING — capture ad attribution from URL params
// ============================================================================
(function captureUTM() {
    try {
        const params = new URLSearchParams(window.location.search);
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
        const utm = {};
        let hasUTM = false;
        utmKeys.forEach(k => {
            const v = params.get(k);
            if (v) { utm[k] = v; hasUTM = true; }
        });
        if (hasUTM) {
            utm.landed_at = new Date().toISOString();
            utm.landing_page = window.location.pathname || '/';
            localStorage.setItem('collateral_utm', JSON.stringify(utm));
            console.log('[UTM] Captured:', utm);
            // Clean URL without reloading
            if (window.history.replaceState) {
                const clean = window.location.pathname;
                window.history.replaceState({}, '', clean);
            }
        }
        // Also capture ?ref= referral parameter from ad URLs
        const refParam = params.get('ref');
        if (refParam) {
            api.setReferralCode(refParam);
            console.log('[Referral] Captured from URL param:', refParam);
        }
    } catch (e) { /* silent */ }
})();

// App state - initialized from localStorage (NO email derivation ever)
const storedUser = api.getStoredUser();
const appState = {
    isLoggedIn: api.hasAuthToken(),
    sessionHydrated: false, // Prevents UI flicker until hydration completes
    // ONLY use stored identity values - NO email prefix fallbacks
    displayName: storedUser?.displayName || null,
    username: storedUser?.username || null, // stored WITHOUT @ prefix
    userId: storedUser?.userId || null,
    photoUrl: storedUser?.photoUrl || null,
    connectedSources: {
        twitter: false,
        github: false,
        stripe: false
    },
    unified: {
        user: null,
        authStatus: api.hasAuthToken() ? 'signed_in' : 'signed_out',
        connectedWallet: null,
        linkedWallets: [],
        primaryWallet: null,
        walletStatus: 'disconnected',
        chainId: null,
        isCorrectChain: false
    }
};

// Expose appState and api globally for views to access
window.appState = appState;
window.api = api;

/**
 * Hydrate session from backend - canonical source of truth
 * Called on app init to ensure identity matches database
 */
async function hydrateSession() {
    if (!api.hasAuthToken()) {
        console.log('[Session] No token, skipping hydration');
        appState.sessionHydrated = true;
        updateAuthUI();
        return;
    }

    try {
        console.log('[Session] Hydrating from /v1/me/profile...');
        const profile = await api.getProfile();

        // Token is valid if we got here
        appState.isLoggedIn = true;

        // Overwrite appState with canonical identity from DB
        appState.userId = profile.user?.id ?? null;
        appState.displayName = profile.identity?.displayName ?? null;
        appState.username = profile.identity?.username ?? null;
        appState.photoUrl = profile.identity?.photoUrl ?? null;

        // Hydrate connected sources from profile (canonical)
        // Show connected even if not yet verified (verified shown separately in UI)
        appState.connectedSources = {
            twitter: !!profile.xConnection?.connected,
            stripe: !!profile.stripeConnection?.connected,
            youtube: !!profile.youtubeConnection?.connected,
            shopify: !!profile.shopifyConnection?.connected,
            amazon: !!profile.amazonConnection?.connected,
            github: false, // TODO: add when GitHub OAuth is implemented
        };

        // Store verification status separately for UI display
        appState.verificationStatus = {
            twitter: profile.xConnection?.verified ?? false,
            stripe: profile.stripeConnection?.verified ?? false,
            youtube: profile.youtubeConnection?.verified ?? false,
            shopify: profile.shopifyConnection?.verified ?? false,
            amazon: profile.amazonConnection?.verified ?? false,
            github: false,
        };

        // Update localStorage with canonical values
        api.setStoredUser({
            email: profile.user?.email,
            userId: profile.user?.id,
            displayName: appState.displayName,
            username: appState.username,
            photoUrl: appState.photoUrl,
        });

        console.log('[Session] ✅ Hydrated from DB:', {
            username: appState.username,
            displayName: appState.displayName,
            connectedSources: appState.connectedSources
        });
    } catch (error) {
        console.error('[Session] Hydration failed:', error);
        // On 401 error, clear auth state and redirect off protected routes
        if (error.status === 401) {
            api.clearAuthToken();
            appState.isLoggedIn = false;
            appState.displayName = null;
            appState.username = null;
            appState.userId = null;
            appState.connectedSources = { twitter: false, stripe: false, youtube: false, shopify: false, amazon: false, github: false };

            // Force redirect off protected route if on one
            const protectedPaths = ['/market', '/my-contracts', '/profile', '/funding'];
            const currentPath = window.location.pathname || '';
            if (protectedPaths.some(pr => currentPath === pr || currentPath.startsWith(pr + '/'))) {
                window.router.navigate('/market');
                if (window.trackEvent) window.trackEvent('login', { method: 'google' });
                // Show login modal after redirect
                setTimeout(() => window.app.openAccessModal(), 100);
            }
        }
    } finally {
        appState.sessionHydrated = true;
        updateAuthUI();
        if (window.app && window.app.syncUnifiedState) {
            window.app.syncUnifiedState();
        }
    }
}

// Expose hydrateSession globally for use in disconnectSource
window.hydrateSession = hydrateSession;

// ================================================================================
// PRE-LAUNCH MODE
// ================================================================================
// Set VITE_PRE_LAUNCH_MODE=true in Vercel to enable pre-launch landing page
const PRE_LAUNCH_MODE = import.meta.env.VITE_PRE_LAUNCH_MODE === 'true';
console.log(`[App] Pre-launch mode: ${PRE_LAUNCH_MODE ? 'ENABLED' : 'disabled'}`);

// Routes configuration
const routes = PRE_LAUNCH_MODE ? [
    // Pre-launch: only show the waitlist page
    { path: '/', render: renderPreLaunch, init: initPreLaunch },
    { path: '/', render: renderPreLaunch, init: initPreLaunch },
    { path: '/ledger', render: renderPreLaunch, init: initPreLaunch },
    { path: '/market', render: renderPreLaunch, init: initPreLaunch },
    { path: '/contracts/:id', render: renderPreLaunch, init: initPreLaunch },
    { path: '/profile', render: renderPreLaunch, init: initPreLaunch },
    { path: '/settings', render: renderPreLaunch, init: initPreLaunch },
    { path: '/my-contracts', render: renderPreLaunch, init: initPreLaunch },
    { path: '/sources', render: renderPreLaunch, init: initPreLaunch },
    { path: '/docs', render: renderPreLaunch, init: initPreLaunch },
    { path: '/funding', render: renderPreLaunch, init: initPreLaunch },
    { path: '/receipts', render: renderPreLaunch, init: initPreLaunch },
    { path: '/receipts/:id', render: renderPreLaunch, init: initPreLaunch },
    { path: '/market/:id', render: renderPreLaunch, init: initPreLaunch },
    { path: '/contract/:id', render: renderPreLaunch, init: initPreLaunch },
] : [
    // Normal mode: full app
    { path: '/', render: renderLanding, init: initLanding },
    { path: '/go/stripe', render: (p) => renderSEOLanding({ platform: 'stripe' }), init: initSEOLanding },
    { path: '/go/x', render: (p) => renderSEOLanding({ platform: 'x' }), init: initSEOLanding },
    { path: '/go/shopify', render: (p) => renderSEOLanding({ platform: 'shopify' }), init: initSEOLanding },
    { path: '/go/youtube', render: (p) => renderSEOLanding({ platform: 'youtube' }), init: initSEOLanding },
    { path: '/welcome', render: renderOnboarding, init: initOnboarding },
    { path: '/rivalry', render: renderRivalry, init: initRivalry },
    { path: '/rivalry/:id', render: renderRivalryDetail, init: initRivalryDetail },
    { path: '/ledger', render: renderLedger, init: initLedger },
    { path: '/market', render: renderActiveContracts, init: initActiveContracts },
    { path: '/sources', render: renderSources, init: initSources },
    { path: '/contracts/execute', render: renderContracts, init: initContracts },
    { path: '/contracts/:id', render: renderContractDetail, init: initContractDetail },
    { path: '/market/:id', render: () => '<div></div>', init: (params) => { window.router.navigate('/contract/' + (params?.id || '')); } },
    { path: '/contract/:id', render: renderContractTermSheet, init: initContractTermSheet },
    { path: '/profile', render: renderProfile, init: initProfile },
    { path: '/settings', render: renderProfile, init: initProfile }, // Redirect settings to profile
    { path: '/my-contracts', render: renderMyContracts, init: initMyContracts },
    { path: '/docs', render: renderDocs, init: initDocs },
    { path: '/funding', render: renderFunding, init: initFunding },
    { path: '/receipts', render: renderReceipts, init: initReceipts },
    { path: '/receipts/:id', render: renderReceiptDetail, init: initReceiptDetail },
    { path: '/stripe/callback', render: renderStripeCallback, init: initStripeCallback },
    { path: '/x/callback', render: renderXCallback, init: initXCallback },
    { path: '/shopify/callback', render: renderShopifyCallback, init: initShopifyCallback },
    { path: '/amazon/callback', render: renderAmazonCallback, init: initAmazonCallback },
    { path: '/youtube/callback', render: renderYouTubeCallback, init: initYouTubeCallback },
    { path: '/sso-callback', render: () => '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;"><p style="color:#999;font-size:14px;">Completing sign-in…</p></div>', init: () => { window.app._handleSSOCallback(); } },
    { path: '/terms', render: renderTerms, init: initTerms },
    { path: '/privacy', render: renderPrivacy, init: initPrivacy },
    { path: '/forgot-password', render: renderForgotPassword, init: initForgotPassword },
    { path: '/reset-password', render: renderResetPassword, init: initResetPassword },
    { path: '/referrals', render: renderReferrals, init: initReferrals },
    { path: '/creators', render: renderCreators, init: initCreators },
    { path: '/protocol', render: renderToken, init: initToken },
    {
        path: '/r/:code', render: () => '<div></div>', init: (params) => {
            // Store referral code and redirect to signup
            if (params?.code) {
                api.setReferralCode(params.code);
                console.log('[Referral] Stored referral code:', params.code);
            }
            window.router.navigate('/market');
            setTimeout(() => window.app.openAccessModal(), 300);
        }
    }
];

// ================================================================================
// OAUTH CALLBACK PATH-TO-HASH REDIRECT
// ================================================================================
// OAuth flows redirect to path-based URLs (/x/callback, /stripe/callback)
// but our router is hash-based (#/path). Intercept and redirect before router init.
// Also handles Vercel rewrite case where callback lands at /?...
(function handleOAuthPathRedirect() {
    // Skip if already hash-routed (prevents loops)
    if (window.location.hash) return;

    const { pathname, search, origin } = window.location;

    // Handle Vercel rewrite case: callbacks land at root "/" with query params
    if (pathname === '/') {
        const params = new URLSearchParams(search);

        // X callback: has success= param (from our backend redirect)
        if (params.has('success') || params.has('username')) {
            console.log('[OAuth] Intercepting X callback at root, redirecting to hash route');
            window.location.replace(origin + '/x/callback' + search);
            return;
        }

        // Stripe callback: has code= AND state= params AND stored state MATCHES incoming
        const hasCode = params.has('code');
        const hasState = params.has('state');
        const incomingState = params.get('state');

        // Parse stored flow object (includes state + timestamp)
        let storedFlow = null;
        try {
            storedFlow = JSON.parse(localStorage.getItem('stripe_oauth_flow') || 'null');
        } catch (e) {
            // Fall back to legacy simple state storage
            const legacyState = localStorage.getItem('stripe_oauth_state');
            if (legacyState) storedFlow = { state: legacyState, startedAt: 0 };
        }

        if (hasCode && hasState && storedFlow && incomingState) {
            const isStateMatch = storedFlow.state === incomingState;
            const isRecent = !storedFlow.startedAt || (Date.now() - storedFlow.startedAt) < 10 * 60 * 1000; // 10 min

            if (isStateMatch && isRecent) {
                console.log('[OAuth] Intercepting Stripe callback at root, redirecting to hash route');
                window.location.replace(origin + '/stripe/callback' + search);
                return;
            }

            // State mismatch or expired: route to error page (not silent fallthrough)
            if (!isStateMatch) {
                console.warn('[OAuth] Stripe state mismatch.', { stored: storedFlow.state, incoming: incomingState });
                window.location.replace(origin + '/stripe/callback?error=state_mismatch');
                return;
            }

            if (!isRecent) {
                console.warn('[OAuth] Stripe OAuth flow expired.');
                window.location.replace(origin + '/stripe/callback?error=session_expired');
                return;
            }
        }
    }



    // Map of path-based OAuth callbacks to hash routes
    const map = {
        '/x/callback': '/x/callback',
        '/stripe/callback': '/stripe/callback',
        '/shopify/callback': '/shopify/callback',
        '/amazon/callback': '/amazon/callback',
        '/youtube/callback': '/youtube/callback',
    };

    const dest = map[pathname];
    if (dest && dest !== pathname) {
        console.log('[OAuth] Intercepting', pathname, ', redirecting to callback route');
        window.location.replace(origin + dest + search);
    }
})();

// Initialize router
const router = new Router(routes);
window.router = router;

/* Dismiss loading screen after first render.
 *
 * The screen owns its own closing sequence now — it runs the progress rule to
 * 100%, holds 250ms, then fades over 350ms and removes itself. So this hands
 * off rather than yanking the element out. See the script inside
 * #loading-screen in index.html; the direct path below stays as a fallback for
 * the case where that script did not run.
 *
 * The 400ms that used to sit in front of every call is gone. The screen now
 * enforces its own 900ms floor measured from first paint, which is the actual
 * requirement; stacking a fixed delay on top of that only ever made a warm load
 * slower than it needed to be.
 *
 * The safety timeout moves 1500 -> 4000. At 1500 it was racing the screen's own
 * sequence on a cold load and could dismiss mid-progress. It is a backstop for
 * a 'load' event that never fires, not a second scheduler. */
const dismissLoadingScreen = () => {
    if (typeof window.__clLoaderFinish === 'function') { window.__clLoaderFinish(); return; }
    const ls = document.getElementById('loading-screen');
    if (ls && !ls.classList.contains('loaded')) {
        ls.classList.add('loaded');
        setTimeout(() => { if (ls) ls.remove(); }, 800);
    }
};

if (document.readyState === 'complete') {
    dismissLoadingScreen();
} else {
    window.addEventListener('load', dismissLoadingScreen);
    // Fallback safety timeout
    setTimeout(dismissLoadingScreen, 4000);
}

// Helper: check if user is currently on landing page
function _isOnGoPage() {
    const p = window.location.pathname || '';
    return p === '/' || p.startsWith('/go/');
}

// App methods exposed globally
window.app = {
    openAccessModal: function () {
        const backdrop = document.getElementById('modal-access-backdrop');
        const modal = document.getElementById('modal-access');
        backdrop.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);
    },
    closeAccessModal: function () {
        const backdrop = document.getElementById('modal-access-backdrop');
        const modal = document.getElementById('modal-access');
        backdrop.classList.add('opacity-0');
        modal.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            modal.classList.add('hidden');
        }, 300);
    },
    handleSignOut: async function () {
        // Clear local auth token and reset identity state immediately for instant UI response
        api.logout();
        appState.isLoggedIn = false;
        appState.username = null;
        appState.displayName = null;
        appState.userId = null;
        appState.connectedSources = { twitter: false, stripe: false, youtube: false, shopify: false, amazon: false, github: false };
        
        // Reset Web3 unified state properties
        appState.unified.authStatus = 'signed_out';
        appState.unified.user = null;
        appState.unified.linkedWallets = [];
        appState.unified.primaryWallet = null;
        appState.unified.walletStatus = 'disconnected';

        updateAuthUI();
        window.router.navigate('/market');

        // Disconnect Web3 wallet in background
        try {
            await disconnect(wagmiAdapter.wagmiConfig);
        } catch (e) { console.warn('[Auth] Web3 disconnect failed:', e); }

        // Sign out of Clerk in background (non-blocking)
        try {
            if (window.Clerk && window.Clerk.signOut) {
                await window.Clerk.signOut();
            }
        } catch (e) { console.warn('[Auth] Clerk sign-out failed:', e); }
    },
    handleAuthClick: function () {
        if (appState.isLoggedIn) {
            window.router.navigate('/profile');
        } else {
            window.app.openAccessModal();
        }
    },
    handleInitiate: function () {
        if (!appState.isLoggedIn) {
            window.app.openAccessModal();
        } else {
            window.router.navigate('/market');
        }
    },
    _authMode: 'signin', // 'signin' or 'signup'
    _showAuthError: function (msg) {
        const el = document.getElementById('auth-error');
        const txt = document.getElementById('auth-error-text');
        if (el && txt) { txt.textContent = msg; el.classList.remove('hidden'); }
    },
    _hideAuthError: function () {
        const el = document.getElementById('auth-error');
        if (el) el.classList.add('hidden');
    },
    toggleReferralInput: function () {
        const field = document.getElementById('auth-referral-field');
        const btn = document.getElementById('auth-referral-toggle-btn');
        if (field) {
            const isHidden = field.style.display === 'none' || field.classList.contains('hidden');
            if (isHidden) {
                field.classList.remove('hidden');
                field.style.display = 'flex';
                if (btn) btn.textContent = '- Remove referral code';
            } else {
                field.classList.add('hidden');
                field.style.display = 'none';
                if (btn) btn.textContent = '+ Have a referral code?';
                const input = document.getElementById('auth-referral-code');
                if (input) input.value = '';
            }
        }
    },
    toggleAuthMode: function () {
        window.app._hideAuthError();
        const isSignup = window.app._authMode === 'signin';
        window.app._authMode = isSignup ? 'signup' : 'signin';

        const title = document.getElementById('auth-modal-title');
        const btn = document.getElementById('btn-auth-submit');
        const referralToggle = document.getElementById('auth-referral-toggle-wrapper');
        const referralField = document.getElementById('auth-referral-field');
        const toggleText = document.getElementById('auth-toggle-text');

        if (isSignup) {
            if (title) title.innerHTML = 'Lock capital. Force the outcome.';
            if (btn) btn.textContent = 'Create Account';
            if (referralToggle) { referralToggle.classList.remove('hidden'); referralToggle.style.display = 'block'; }
            
            // Check if there is a referral code pre-filled
            const storedCode = api.getReferralCode ? api.getReferralCode() : null;
            if (storedCode) {
                const refInput = document.getElementById('auth-referral-code');
                if (refInput) refInput.value = storedCode;
                // Auto-expand since code is present
                if (referralField) { referralField.classList.remove('hidden'); referralField.style.display = 'flex'; }
                const toggleBtn = document.getElementById('auth-referral-toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '- Remove referral code';
            } else {
                if (referralField) { referralField.classList.add('hidden'); referralField.style.display = 'none'; }
                const toggleBtn = document.getElementById('auth-referral-toggle-btn');
                if (toggleBtn) toggleBtn.textContent = '+ Have a referral code?';
            }
            if (toggleText) toggleText.innerHTML = 'Already have an account? <button onclick="window.app.toggleAuthMode()" class="text-[#111] font-medium hover:underline bg-transparent border-none cursor-pointer p-0">Sign in</button>';
        } else {
            if (title) title.innerHTML = 'Lock capital. Force the outcome.';
            if (btn) btn.textContent = 'Sign In';
            if (referralToggle) { referralToggle.classList.add('hidden'); referralToggle.style.display = 'none'; }
            if (referralField) { referralField.classList.add('hidden'); referralField.style.display = 'none'; }
            if (toggleText) toggleText.innerHTML = 'New here? <button onclick="window.app.toggleAuthMode()" class="text-[#111] font-medium hover:underline bg-transparent border-none cursor-pointer p-0">Create account</button>';
        }
    },
    handleAuthSubmit: async function () {
        window.app._hideAuthError();
        const email = document.getElementById('auth-email')?.value?.trim();
        const password = document.getElementById('auth-password')?.value;
        const btn = document.getElementById('btn-auth-submit');

        if (!email || !password) {
            window.app._showAuthError('Email and password are required.');
            return;
        }

        if (window.app._authMode === 'signup') {
            // Sign up flow: Auto-generate username from email
            const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            const username = (emailPrefix.slice(0, 15) || 'user') + Math.floor(100 + Math.random() * 900);
            
            if (password.length < 8) { window.app._showAuthError('Password must be at least 8 characters.'); return; }

            const originalText = btn.textContent;
            btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            // Store referral code from the input field (overrides any link-based code)
            const referralInput = document.getElementById('auth-referral-code')?.value?.trim();
            if (referralInput) {
                api.setReferralCode(referralInput);
            }

            try {
                const result = await api.signup(email, password, username, username);
                if (!result.ok) throw new Error(result.error || 'Signup failed');

                appState.isLoggedIn = true;
                appState.displayName = result.identity?.displayName || null;
                appState.username = result.identity?.username || null;
                appState.userId = result.user?.id;

                console.log('[Auth] ✅ Signed up as:', appState.displayName);

                // Conversion tracking — Signup
                if (typeof twq === 'function') twq('event', 'tw-rbwqr-rbx5x', {});
                if (window.trackEvent) window.trackEvent('sign_up', { method: 'email' });
                if (typeof gtag === 'function') gtag('event', 'conversion', { send_to: 'AW-18147195908/signup' });
                if (typeof fbq === 'function') fbq('track', 'CompleteRegistration');
                if (typeof ttq !== 'undefined') ttq.track('CompleteRegistration');

                window.app.closeAccessModal();
                updateAuthUI();

                // Always navigate to /market after signup
                sessionStorage.removeItem('collateral_go_target');
                window.router.navigate('/market');
            } catch (err) {
                window.app._showAuthError(err.message || 'Account creation failed.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } else {
            // Sign in flow
            const originalText = btn.textContent;
            btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
            btn.disabled = true;

            try {
                const result = await api.login(email, password);
                if (!result.ok) throw new Error(result.error || 'Login failed');

                appState.isLoggedIn = true;
                appState.displayName = result.identity?.displayName || null;
                appState.username = result.identity?.username || null;
                appState.userId = result.user?.id;

                console.log('[Auth] ✅ Signed in as:', appState.displayName);
                window.app.closeAccessModal();
                updateAuthUI();

                // Always navigate to /market after login
                sessionStorage.removeItem('collateral_go_target');
                window.router.navigate('/market');
            } catch (err) {
                window.app._showAuthError(err.message || 'Invalid email or password.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    },
    signInWithWallet: async function () {
        window.app._hideAuthError();
        const btn = document.getElementById('btn-wallet-signin');
        const originalText = btn ? btn.innerHTML : 'Connect Wallet';

        try {
            // 1. Check if wallet is connected
            let account = getAccount(wagmiAdapter.wagmiConfig);
            if (!account.isConnected || !account.address) {
                // Open AppKit connect modal
                await modal.open();
                
                // Wait for account connection (poll/wait briefly up to 10s)
                let connected = false;
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    account = getAccount(wagmiAdapter.wagmiConfig);
                    if (account.isConnected && account.address) {
                        connected = true;
                        break;
                    }
                }
                if (!connected) {
                    throw new Error('Wallet connection timed out or was rejected.');
                }
            }

            const address = account.address;
            if (btn) {
                btn.innerHTML = '<div class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto"></div>';
                btn.disabled = true;
            }

            // 2. Fetch single-use login nonce from backend
            const nonceRes = await api.getWalletNonce();
            if (!nonceRes || !nonceRes.ok) {
                throw new Error(nonceRes.error || 'Failed to fetch verification nonce');
            }
            const nonce = nonceRes.nonce;

            // 3. Format SIWE message using backend timestamps
            const messageText = `Collateral Wallet Login\n\n` +
                `Authenticate with wallet ${address}.\n\n` +
                `Domain: collateral.market\n` +
                `Chain ID: 4663\n` +
                `Nonce: ${nonce}\n` +
                `Issued At: ${nonceRes.createdAt}\n` +
                `Expiration Time: ${nonceRes.expiresAt}`;

            // 4. Request signature from user's wallet
            const signature = await signMessage(wagmiAdapter.wagmiConfig, {
                message: messageText
            });

            // 5. Submit signature to login endpoint
            // Optional referral code during registration
            const referralInput = document.getElementById('auth-referral-code')?.value?.trim();
            if (referralInput) {
                api.setReferralCode(referralInput);
            }

            const loginRes = await api.loginWithWallet(address, signature, nonce);
            if (!loginRes || !loginRes.ok) {
                throw new Error(loginRes.error || 'Signature verification failed');
            }

            // 6. Update AppState and log in user
            appState.isLoggedIn = true;
            appState.displayName = loginRes.identity?.displayName || null;
            appState.username = loginRes.identity?.username || null;
            appState.userId = loginRes.user?.id;

            console.log('[Auth] Wallet login successful as:', appState.displayName);
            
            if (window.trackEvent) window.trackEvent('login', { method: 'wallet' });

            window.app.closeAccessModal();
            showAlert('Welcome to Collateral!', { type: 'success', title: 'Wallet Access Approved' });

            // Force route refresh
            await hydrateSession();

            // Always navigate to /market after login
            sessionStorage.removeItem('collateral_go_target');
            window.router.navigate('/market');

        } catch (err) {
            console.error('[WalletAuth] Login failed:', err);
            window.app._showAuthError(err.message || 'Signature rejected or wallet login failed.');
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    },
    handleLoginSubmit: async function () {
        window.app.handleAuthSubmit();
    },
    goToCreateIdentity: function () {
        if (window.app._authMode !== 'signup') window.app.toggleAuthMode();
        window.app.openAccessModal();
    },
    openCreateModal: function () {
        if (window.app._authMode !== 'signup') window.app.toggleAuthMode();
        window.app.openAccessModal();
    },
    closeCreateModal: function () {
        window.app.closeAccessModal();
    },
    handleCreateAccount: async function () {
        if (window.app._authMode !== 'signup') window.app.toggleAuthMode();
        window.app.openAccessModal();
    },
    signInWithGoogle: async function () {
        try {
            if (!window.Clerk) { showAlert(window.__clerkUnavailableReason || 'OAuth not available. Please use email/password or refresh.', { type: 'warning', title: 'OAuth Unavailable' }); return; }
            console.log('[Auth] Starting Google OAuth via Clerk...');
            // Store referral code before redirect (if entered)
            const refInput = document.getElementById('auth-referral-code')?.value?.trim();
            if (refInput) api.setReferralCode(refInput);
            window.app.closeAccessModal();
            const _goFlow = _isOnGoPage();
            if (_goFlow) sessionStorage.setItem('collateral_go_flow', '1');
            // If Clerk already has a session, exchange it directly
            if (window.Clerk.session) {
                console.log('[Auth] Clerk session exists, exchanging token...');
                await window.app._exchangeClerkToken();
                updateAuthUI();
                sessionStorage.removeItem('collateral_go_target');
                window.router.navigate('/market');
                sessionStorage.removeItem('collateral_go_flow');
                return;
            }
            await window.Clerk.client.signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: window.location.origin + '/sso-callback',
                redirectUrlComplete: window.location.origin + '/sso-callback',
            });
        } catch (err) {
            console.error('[Auth] Google sign-in failed:', err);
            // If "already signed in", sign out Clerk first and retry
            if (err?.message?.includes('already signed in') || err?.message?.includes('single session')) {
                try {
                    console.log('[Auth] Signing out stale Clerk session and retrying...');
                    await window.Clerk.signOut();
                    await window.Clerk.client.signIn.authenticateWithRedirect({
                        strategy: 'oauth_google',
                        redirectUrl: window.location.origin + '/sso-callback',
                        redirectUrlComplete: window.location.origin + '/sso-callback',
                    });
                } catch (retryErr) {
                    console.error('[Auth] Google retry also failed:', retryErr);
                    window.app.openAccessModal();
                    window.app._showAuthError('Google sign-in failed. Please try email/password.');
                }
            }
        }
    },
    signInWithApple: async function () {
        try {
            if (!window.Clerk) { showAlert(window.__clerkUnavailableReason || 'OAuth not available. Please use email/password or refresh.', { type: 'warning', title: 'OAuth Unavailable' }); return; }
            console.log('[Auth] Starting Apple OAuth via Clerk...');
            window.app.closeAccessModal();
            const _goFlow = _isOnGoPage();
            if (_goFlow) sessionStorage.setItem('collateral_go_flow', '1');
            // If Clerk already has a session, exchange it directly
            if (window.Clerk.session) {
                console.log('[Auth] Clerk session exists, exchanging token...');
                await window.app._exchangeClerkToken();
                updateAuthUI();
                sessionStorage.removeItem('collateral_go_target');
                window.router.navigate('/market');
                sessionStorage.removeItem('collateral_go_flow');
                return;
            }
            await window.Clerk.client.signIn.authenticateWithRedirect({
                strategy: 'oauth_apple',
                redirectUrl: window.location.origin + '/sso-callback',
                redirectUrlComplete: window.location.origin + '/sso-callback',
            });
        } catch (err) {
            console.error('[Auth] Apple sign-in failed:', err);
            // If "already signed in", sign out Clerk first and retry
            if (err?.message?.includes('already signed in') || err?.message?.includes('single session')) {
                try {
                    console.log('[Auth] Signing out stale Clerk session and retrying...');
                    await window.Clerk.signOut();
                    await window.Clerk.client.signIn.authenticateWithRedirect({
                        strategy: 'oauth_apple',
                        redirectUrl: window.location.origin + '/sso-callback',
                        redirectUrlComplete: window.location.origin + '/sso-callback',
                    });
                } catch (retryErr) {
                    console.error('[Auth] Apple retry also failed:', retryErr);
                    window.app.openAccessModal();
                    window.app._showAuthError('Apple sign-in failed. Please try email/password.');
                }
            }
        }
    },
    _handleSSOCallback: async function () {
        // Called when Clerk redirects back to /sso-callback after OAuth
        try {
            if (!window.Clerk) {
                // Clerk not loaded yet — wait for it
                console.log('[Auth] Waiting for Clerk SDK to load...');
                let attempts = 0;
                while (!window.Clerk && attempts < 50) {
                    await new Promise(r => setTimeout(r, 200));
                    attempts++;
                }
                if (!window.Clerk) { console.error('[Auth] Clerk never loaded'); window.router.navigate('/market'); return; }
            }

            // Read and clear go_flow flag ONCE
            const wasGoFlow = sessionStorage.getItem('collateral_go_flow') === '1';
            sessionStorage.removeItem('collateral_go_flow');

            console.log('[Auth] Processing SSO callback...');
            await window.Clerk.handleRedirectCallback();

            // After callback, Clerk should have a session
            if (window.Clerk.session) {
                await window.app._exchangeClerkToken();
            } else {
                console.log('[Auth] No session after SSO callback');
            }
            sessionStorage.removeItem('collateral_go_target');
            window.router.navigate('/market');
        } catch (err) {
            console.error('[Auth] SSO callback failed:', err);
            sessionStorage.removeItem('collateral_go_flow');
            window.router.navigate('/market');
        }
    },
    _exchangeClerkToken: async function () {
        try {
            if (!window.Clerk || !window.Clerk.session) return;
            const clerkToken = await window.Clerk.session.getToken();
            if (!clerkToken) return;

            console.log('[Auth] Exchanging Clerk token for internal JWT...');
            const referralCode = api.getReferralCode ? api.getReferralCode() : null;
            const resp = await fetch((import.meta.env.VITE_API_BASE_URL || 'https://collateral-production.up.railway.app') + '/v1/auth/clerk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: clerkToken, referralCode: referralCode || undefined }),
            });
            const result = await resp.json();
            if (!result.ok) throw new Error(result.error || 'Token exchange failed');

            api.setAuthToken(result.accessToken);
            api.setStoredUser({
                email: result.user?.email, userId: result.user?.id,
                displayName: result.identity?.displayName, username: result.identity?.username,
            });
            appState.isLoggedIn = true;
            appState.displayName = result.identity?.displayName || null;
            appState.username = result.identity?.username || null;
            appState.userId = result.user?.id;

            console.log('[Auth] ✅ Signed in via Clerk as:', appState.displayName);
            window.app.closeAccessModal();
            updateAuthUI();
        } catch (err) {
            console.error('[Auth] Clerk token exchange failed:', err);
        }
    },
    _handleClerkCallback: async function () {
        // Legacy alias
        await window.app._exchangeClerkToken();
    },
    toggleMenuPersistence: function (e) {
        e.stopPropagation();
        const dropdown = document.getElementById('user-dropdown-content');
        if (dropdown) dropdown.classList.toggle('!block');
    },
    toggleNotifications: async function (e) {
        e.stopPropagation();
        const wrap = document.getElementById('notif-wrap');
        if (!wrap) return;
        const isOpen = wrap.classList.contains('open');
        wrap.classList.toggle('open');
        if (isOpen) return; // closing

        const list = document.getElementById('notif-list');
        if (!list) return;

        // Close when clicking outside
        const closeHandler = (ev) => {
            if (!wrap.contains(ev.target)) {
                wrap.classList.remove('open');
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);

        // Must be logged in
        if (!appState.isLoggedIn) {
            list.innerHTML = '<div class="ch-notif-empty">Sign in to see activity</div>';
            return;
        }

        try {
            const res = await api.getNotifications();
            const notifs = (res?.notifications || []).slice(0, 10);
            if (notifs.length === 0) {
                list.innerHTML = '<div class="ch-notif-empty">No notifications yet</div>';
                wrap.classList.remove('has-items');
                return;
            }
            const hasUnread = notifs.some(n => !n.read);
            if (hasUnread) wrap.classList.add('has-items');
            else wrap.classList.remove('has-items');

            const timeAgo = (d) => {
                const s = Math.floor((Date.now() - new Date(d)) / 1000);
                if (s < 60) return 'just now';
                if (s < 3600) return Math.floor(s / 60) + 'm ago';
                if (s < 86400) return Math.floor(s / 3600) + 'h ago';
                return Math.floor(s / 86400) + 'd ago';
            };
            const notifIcon = (type) => {
                if (type === 'RIVALRY_CHALLENGE') return { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/></svg>', cls: 'exec' };
                if (type === 'RIVALRY_ACCEPTED') return { icon: '✓', cls: 'settle' };
                if (type === 'RIVALRY_SETTLED') return { icon: '🏆', cls: 'settle' };
                if (type === 'RIVALRY_DECLINED') return { icon: '✕', cls: 'forfeit' };
                return { icon: '⚡', cls: 'exec' };
            };

            const esc = (s) => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
            let html = '';
            if (hasUnread) {
                html += `<div class="ch-notif-item" style="justify-content:center;border-bottom:1px solid #eee;" onclick="window.app.markAllRead()">
                    <span style="font-size:10px;font-family:'JetBrains Mono', monospace;color:#752122;letter-spacing:0.05em;cursor:pointer;">MARK ALL READ</span>
                </div>`;
            }
            html += notifs.map(n => {
                const { icon, cls } = notifIcon(n.type);
                const unreadStyle = n.read ? '' : 'background:#fef6f6;';
                const link = n.link ? `window.router.navigate('${n.link.startsWith('/') ? '#' + n.link : n.link}');` : '';
                return `<div class="ch-notif-item" style="${unreadStyle}" onclick="${link}document.getElementById('notif-wrap').classList.remove('open');${n.read ? '' : `api.markNotificationRead('${n.id}');`}">
                    <div class="ch-notif-icon ${cls}">${icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div class="ch-notif-text">${esc(n.title)}</div>
                        ${n.body ? `<div style="font-size:10px;color:#999;margin-top:2px;font-family:'JetBrains Mono', monospace;">${esc(n.body)}</div>` : ''}
                    </div>
                    <span class="ch-notif-time">${timeAgo(n.createdAt)}</span>
                </div>`;
            }).join('');

            list.innerHTML = html;
        } catch (err) {
            list.innerHTML = '<div class="ch-notif-empty">Could not load notifications</div>';
        }
    },
    markAllRead: async function () {
        try {
            await api.markAllNotificationsRead();
            const wrap = document.getElementById('notif-wrap');
            if (wrap) wrap.classList.remove('has-items');
            // Refresh the list
            const list = document.getElementById('notif-list');
            if (list) {
                list.querySelectorAll('.ch-notif-item').forEach(el => {
                    el.style.background = '';
                });
                // Remove the mark-all-read button
                const first = list.firstElementChild;
                if (first && first.textContent.includes('MARK ALL READ')) first.remove();
            }
        } catch (err) { console.error('markAllRead failed', err); }
    },
    pollNotificationCount: async function () {
        if (!appState.isLoggedIn) return;
        try {
            const res = await api.getNotificationCount();
            const wrap = document.getElementById('notif-wrap');
            if (!wrap) return;
            if (res?.count > 0) wrap.classList.add('has-items');
            else wrap.classList.remove('has-items');
        } catch (_) { /* silent */ }
    },
    acceptRivalry: async function (id) {
        if (!appState.isLoggedIn) { window.app.openAccessModal(); return; }
        if (!(await showConfirm('Accept this rivalry challenge? You will need to fund your side.', { title: 'Accept Challenge', confirmText: 'ACCEPT' }))) return;
        try {
            const res = await api.acceptRivalry(id);
            if (res.ok) {
                await showAlert('Challenge accepted! Fund your side to activate the duel.', { type: 'success', title: 'Challenge Accepted' });
                window.location.reload();
            } else {
                showAlert('Failed to accept: ' + (res.error || 'Unknown error'), { type: 'error' });
            }
        } catch (err) { showAlert('Failed to accept challenge: ' + err.message, { type: 'error' }); }
    },
    declineRivalry: async function (id) {
        if (!appState.isLoggedIn) { window.app.openAccessModal(); return; }
        if (!(await showConfirm('Decline this challenge?', { title: 'Decline Challenge', confirmText: 'DECLINE', danger: true }))) return;
        try {
            const res = await api.declineRivalry(id);
            if (res.ok) {
                await showAlert('Challenge declined.', { type: 'info', title: 'Declined' });
                window.location.reload();
            } else {
                showAlert('Failed to decline: ' + (res.error || 'Unknown error'), { type: 'error' });
            }
        } catch (err) { showAlert('Failed to decline challenge: ' + err.message, { type: 'error' }); }
    },
    fundRivalry: async function (id) {
        if (!appState.isLoggedIn) { window.app.openAccessModal(); return; }
        if (!(await showConfirm('Fund your side of this rivalry? Capital will be locked immediately.', { title: 'Fund Rivalry', confirmText: 'FUND & LOCK CAPITAL' }))) return;
        try {
            const res = await api.fundRivalry(id);
            if (res.ok) {
                await showAlert('Capital locked! The duel will activate once both sides are funded.', { type: 'success', title: 'Capital Locked' });
                window.location.reload();
            } else {
                showAlert('Failed to fund: ' + (res.error || 'Unknown error'), { type: 'error' });
            }
        } catch (err) { showAlert('Failed to fund rivalry: ' + err.message, { type: 'error' }); }
    },
    /**
     * Connect a bank via Plaid Link.
     *
     * Deliberately NOT the popup-plus-poll pattern used for Stripe/Shopify/
     * YouTube. Those are OAuth redirects, so the browser leaves and completion
     * has to be detected by polling status after the popup closes. Plaid Link is
     * an embedded modal with its own lifecycle — onSuccess / onExit / onEvent —
     * so the page is never left and there is nothing to poll. Forcing it through
     * the popup abstraction would fight the library.
     *
     * @param {Function} onConnected called with the status payload on success,
     *   so a caller (e.g. the /market matrix) can re-render one card in place
     *   rather than reloading the page.
     */
    connectBank: async function (onConnected) {
        try {
            if (!window.Plaid) {
                await window.app._loadPlaidScript();
            }
            if (!window.Plaid) {
                showAlert('Bank connection is unavailable right now. Please try again shortly.', { type: 'warning', title: 'Plaid Unavailable' });
                return;
            }

            const { linkToken } = await window.api.createPlaidLinkToken();
            if (!linkToken) {
                showAlert('Could not start bank connection.', { type: 'warning', title: 'Plaid Unavailable' });
                return;
            }

            const linkHandler = window.Plaid.create({
                token: linkToken,
                onSuccess: async (publicToken, metadata) => {
                    try {
                        // The public_token is short-lived and useless on its own;
                        // only the server can exchange it for an access_token.
                        const accountId = metadata && metadata.accounts && metadata.accounts[0]
                            ? metadata.accounts[0].id : undefined;
                        await window.api.exchangePlaidPublicToken(publicToken, accountId);
                        const status = await window.api.getPlaidStatus();
                        if (typeof onConnected === 'function') onConnected(status);
                        else window.router.navigate('/market');
                    } catch (err) {
                        console.error('[Plaid] exchange failed:', err);
                        showAlert('Your bank connected but we could not finish setup. Please try again.', { type: 'warning', title: 'Connection Incomplete' });
                    }
                },
                onExit: (err) => {
                    // A user closing Link is normal, not an error. Only surface a
                    // real failure.
                    if (err) {
                        console.warn('[Plaid] Link exited with error:', err);
                        showAlert('Bank connection was not completed.', { type: 'warning', title: 'Not Connected' });
                    }
                },
                onEvent: (eventName) => {
                    console.log('[Plaid] event:', eventName);
                },
            });

            linkHandler.open();
        } catch (err) {
            console.error('[Plaid] connectBank failed:', err);
            showAlert('Could not start bank connection. Please try again.', { type: 'warning', title: 'Plaid Error' });
        }
    },

    /** Load the Plaid Link SDK on demand, once. */
    _loadPlaidScript: function () {
        if (window.__plaidScriptPromise) return window.__plaidScriptPromise;
        window.__plaidScriptPromise = new Promise((resolve) => {
            const existing = document.querySelector('script[src*="link-initialize.js"]');
            if (existing) { existing.addEventListener('load', () => resolve()); return; }
            const el = document.createElement('script');
            el.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
            el.async = true;
            el.onload = () => resolve();
            el.onerror = () => { console.error('[Plaid] SDK failed to load'); resolve(); };
            document.head.appendChild(el);
        });
        return window.__plaidScriptPromise;
    },

    connectSource: async function (source) {
        const btn = document.getElementById(source + '-btn');
        if (!btn) return;

        btn.innerHTML = `<div class="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>`;
        btn.disabled = true;

        try {
            // Call real OAuth start endpoints
            if (source === 'twitter') {
                const result = await window.api.startXOAuth();
                if (result.oauthUrl) {
                    // Open X OAuth in popup window (like Stripe) to preserve page context
                    const popup = window.open(result.oauthUrl, 'XConnect', 'width=600,height=700');

                    // Poll for connection status while popup is open
                    const pollInterval = setInterval(async () => {
                        try {
                            // Check if popup was closed
                            if (popup && popup.closed) {
                                clearInterval(pollInterval);
                                // Final check for connection
                                const status = await window.api.getXStatus();
                                if (status.connected) {
                                    console.log('[X] Connected via popup!');
                                    if (window.hydrateSession) await window.hydrateSession();
                                    btn.innerHTML = '✓ Connected';
                                    btn.disabled = true;
                                    // Refresh the current view
                                    const current = window.router.getCurrentPath();
                                    window.router.navigate(current === '/' ? '/market' : current);
                                } else {
                                    btn.innerHTML = 'Connect';
                                    btn.disabled = false;
                                }
                                return;
                            }

                            // Periodic poll while popup is open
                            const status = await window.api.getXStatus();
                            if (status.connected) {
                                console.log('[X] Detected connection during poll');
                                clearInterval(pollInterval);
                                if (popup && !popup.closed) popup.close();
                                if (window.hydrateSession) await window.hydrateSession();
                                btn.innerHTML = '✓ Connected';
                                btn.disabled = true;
                                const current = window.router.getCurrentPath();
                                window.router.navigate(current === '/' ? '/market' : current);
                            }
                        } catch (pollErr) {
                            console.warn('[X] Poll error:', pollErr);
                        }
                    }, 2000); // Poll every 2 seconds

                    // Timeout after 10 minutes
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        if (btn.innerHTML.includes('spin')) {
                            btn.innerHTML = 'Connect';
                            btn.disabled = false;
                        }
                    }, 10 * 60 * 1000);

                    return;
                }
            } else if (source === 'stripe') {
                const result = await window.api.startStripeConnect();
                if (result.oauthUrl) {
                    // Store flow object with state + timestamp for CSRF protection and expiry
                    localStorage.setItem('stripe_oauth_flow', JSON.stringify({
                        state: result.state,
                        startedAt: Date.now(),
                    }));
                    localStorage.setItem('stripe_oauth_state', result.state);

                    // Open Stripe OAuth in popup window
                    const popup = window.open(result.oauthUrl, 'StripeConnect', 'width=600,height=700');

                    // Poll for connection status while popup is open
                    const pollInterval = setInterval(async () => {
                        try {
                            // Check if popup was closed
                            if (popup && popup.closed) {
                                clearInterval(pollInterval);
                                // Final check for connection
                                const status = await window.api.getStripeStatus();
                                if (status.connected) {
                                    console.log('[Stripe] Connected via popup!');
                                    if (window.hydrateSession) await window.hydrateSession();
                                    btn.innerHTML = '✓ Connected';
                                    btn.disabled = true;
                                    // Refresh the current view
                                    const current = window.router.getCurrentPath();
                                    window.router.navigate(current === '/' ? '/market' : current);
                                } else {
                                    btn.innerHTML = 'Connect';
                                    btn.disabled = false;
                                }
                                // Clean up OAuth state
                                localStorage.removeItem('stripe_oauth_flow');
                                localStorage.removeItem('stripe_oauth_state');
                                return;
                            }

                            // Periodic poll while popup is open
                            const status = await window.api.getStripeStatus();
                            if (status.connected) {
                                console.log('[Stripe] Detected connection during poll');
                                clearInterval(pollInterval);
                                if (popup && !popup.closed) popup.close();
                                if (window.hydrateSession) await window.hydrateSession();
                                btn.innerHTML = '✓ Connected';
                                btn.disabled = true;
                                localStorage.removeItem('stripe_oauth_flow');
                                localStorage.removeItem('stripe_oauth_state');
                                const current = window.router.getCurrentPath() === '/' ? '/market' : window.router.getCurrentPath();
                                window.router.navigate(current);
                            }
                        } catch (pollErr) {
                            console.warn('[Stripe] Poll error:', pollErr);
                        }
                    }, 2000); // Poll every 2 seconds

                    // Timeout after 10 minutes
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        if (btn.innerHTML.includes('spin')) {
                            btn.innerHTML = 'Connect';
                            btn.disabled = false;
                        }
                    }, 10 * 60 * 1000);

                    return;
                }
            } else if (source === 'shopify') {
                // Prompt user for their shop domain
                const shop = prompt('Enter your Shopify store domain (e.g. mystore.myshopify.com):');
                if (!shop) {
                    btn.innerHTML = 'Connect';
                    btn.disabled = false;
                    return;
                }
                const result = await window.api.startShopifyConnect(shop);
                if (result.oauthUrl) {
                    localStorage.setItem('shopify_oauth_flow', JSON.stringify({ state: result.state, startedAt: Date.now() }));
                    const popup = window.open(result.oauthUrl, 'ShopifyConnect', 'width=600,height=700');
                    const pollInterval = setInterval(async () => {
                        try {
                            if (popup && popup.closed) {
                                clearInterval(pollInterval);
                                const status = await window.api.getShopifyStatus();
                                if (status.connected) {
                                    if (window.hydrateSession) await window.hydrateSession();
                                    btn.innerHTML = '✓ Connected';
                                    btn.disabled = true;
                                    const current = window.router.getCurrentPath() === '/' ? '/profile' : window.router.getCurrentPath();
                                    window.router.navigate(current);
                                } else {
                                    btn.innerHTML = 'Connect';
                                    btn.disabled = false;
                                }
                                localStorage.removeItem('shopify_oauth_flow');
                                return;
                            }
                            const status = await window.api.getShopifyStatus();
                            if (status.connected) {
                                clearInterval(pollInterval);
                                if (popup && !popup.closed) popup.close();
                                if (window.hydrateSession) await window.hydrateSession();
                                btn.innerHTML = '✓ Connected';
                                btn.disabled = true;
                                localStorage.removeItem('shopify_oauth_flow');
                                const current = window.router.getCurrentPath() === '/' ? '/profile' : window.router.getCurrentPath();
                                window.router.navigate(current);
                            }
                        } catch (pollErr) {
                            console.warn('[Shopify] Poll error:', pollErr);
                        }
                    }, 2000);
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        if (btn.innerHTML.includes('spin')) {
                            btn.innerHTML = 'Connect';
                            btn.disabled = false;
                        }
                    }, 10 * 60 * 1000);
                    return;
                }
            } else if (source === 'amazon') {
                const result = await window.api.startAmazonConnect();
                if (result.oauthUrl) {
                    localStorage.setItem('amazon_oauth_flow', JSON.stringify({ state: result.state, startedAt: Date.now() }));
                    const popup = window.open(result.oauthUrl, 'AmazonConnect', 'width=600,height=700');
                    const pollInterval = setInterval(async () => {
                        try {
                            if (popup && popup.closed) {
                                clearInterval(pollInterval);
                                const status = await window.api.getAmazonStatus();
                                if (status.connected) {
                                    if (window.hydrateSession) await window.hydrateSession();
                                    btn.innerHTML = '✓ Connected';
                                    btn.disabled = true;
                                    const current = window.router.getCurrentPath() === '/' ? '/profile' : window.router.getCurrentPath();
                                    window.router.navigate(current);
                                } else {
                                    btn.innerHTML = 'Connect';
                                    btn.disabled = false;
                                }
                                localStorage.removeItem('amazon_oauth_flow');
                                return;
                            }
                            const status = await window.api.getAmazonStatus();
                            if (status.connected) {
                                clearInterval(pollInterval);
                                if (popup && !popup.closed) popup.close();
                                if (window.hydrateSession) await window.hydrateSession();
                                btn.innerHTML = '✓ Connected';
                                btn.disabled = true;
                                localStorage.removeItem('amazon_oauth_flow');
                                const current = window.router.getCurrentPath() === '/' ? '/profile' : window.router.getCurrentPath();
                                window.router.navigate(current);
                            }
                        } catch (pollErr) {
                            console.warn('[Amazon] Poll error:', pollErr);
                        }
                    }, 2000);
                    setTimeout(() => {
                        clearInterval(pollInterval);
                        if (btn.innerHTML.includes('spin')) {
                            btn.innerHTML = 'Connect';
                            btn.disabled = false;
                        }
                    }, 10 * 60 * 1000);
                    return;
                }
            } else if (source === 'github') {
                showAlert('GitHub integration coming soon.', { type: 'info', title: 'Coming Soon' });
                btn.innerHTML = 'Connect';
                btn.disabled = false;
                return;
            }
        } catch (err) {
            console.error(`[App] connectSource ${source} error:`, err);
            showAlert('Failed to connect: ' + (err.message || 'Unknown error'), { type: 'error' });
            btn.innerHTML = 'Connect';
            btn.disabled = false;
        }
    },
    // Card Modal Functions (SetupIntent pattern)
    openCardModal: function () {
        const backdrop = document.getElementById('modal-card-backdrop');
        const modal = document.getElementById('modal-card');
        backdrop.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);
        // Init lucide icons in modal
        if (window.lucide) window.lucide.createIcons();
    },
    closeCardModal: function () {
        const backdrop = document.getElementById('modal-card-backdrop');
        const modal = document.getElementById('modal-card');
        backdrop.classList.add('opacity-0');
        modal.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            modal.classList.add('hidden');
            // Clear form
            document.getElementById('card-number').value = '';
            document.getElementById('card-expiry').value = '';
            document.getElementById('card-cvc').value = '';
        }, 300);
    },
    addCard: function () {
        // Open the inline card entry modal (SetupIntent pattern)
        window.app.openCardModal();
    },
    confirmCardSetup: function () {
        const btn = document.getElementById('btn-card-submit');
        const cardNumber = document.getElementById('card-number').value;
        const expiry = document.getElementById('card-expiry').value;
        const cvc = document.getElementById('card-cvc').value;

        // Basic validation
        if (!cardNumber || !expiry || !cvc) {
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = `<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>`;
        btn.disabled = true;

        // Simulate SetupIntent confirmation
        // In production: POST /v1/funding/setup-intent → get clientSecret → stripe.confirmSetup()
        setTimeout(() => {
            // Get last 4 digits
            const last4 = cardNumber.replace(/\s/g, '').slice(-4);

            // Update the funding page if we're on it
            const status = document.getElementById('card-status');
            const addBtn = document.getElementById('add-card-btn');

            if (status) {
                status.textContent = `•••• •••• •••• ${last4} • Active`;
                status.classList.remove('text-neutral-400');
                status.classList.add('text-neutral-500');
            }

            if (addBtn) {
                addBtn.innerHTML = 'Remove';
                addBtn.onclick = () => window.app.removeCard();
            }

            // Store in state
            appState.hasCard = true;
            appState.cardLast4 = last4;

            // Close modal
            window.app.closeCardModal();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    },
    removeCard: function () {
        const btn = document.getElementById('add-card-btn');
        const status = document.getElementById('card-status');

        status.textContent = 'No card on file';
        status.classList.remove('text-neutral-500');
        status.classList.add('text-neutral-400');

        btn.innerHTML = 'Add Card';
        btn.onclick = () => window.app.addCard();

        appState.hasCard = false;
        appState.cardLast4 = null;

        btn.innerHTML = 'Add Card';
        btn.onclick = () => window.app.addCard();
    },
    // Panel Menu Functions (universal — desktop + mobile)
    // Panel Menu Functions (Universal Desktop + Mobile Navigation Drawer)
    toggleMobileMenu: function () {
        const menu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-menu-overlay');
        const btn = document.getElementById('mobile-menu-btn');

        if (!menu) return;
        const isOpen = menu.classList.contains('open');

        if (isOpen) {
            window.app.closeMobileMenu();
        } else {
            menu.classList.add('open');
            if (overlay) overlay.classList.add('open');
            if (btn) {
                btn.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }

            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                document.body.style.overflow = 'hidden';
                menu.setAttribute('role', 'dialog');
                menu.setAttribute('aria-modal', 'true');
            } else {
                menu.setAttribute('role', 'region');
                menu.removeAttribute('aria-modal');
            }

            // Setup scroll affordance listener
            const bodyScroll = document.getElementById('pnl-body-scroll');
            const mask = document.getElementById('pnl-scroll-mask');
            if (bodyScroll && mask) {
                const checkScroll = () => {
                    const atBottom = bodyScroll.scrollTop + bodyScroll.clientHeight >= bodyScroll.scrollHeight - 4;
                    mask.classList.toggle('at-bottom', atBottom);
                };
                bodyScroll.onscroll = checkScroll;
                checkScroll();
            }

            // Expand footer meta on desktop by default
            if (!isMobile) {
                const meta = document.getElementById('pnl-footer-meta');
                if (meta) meta.classList.remove('collapsed');
            }

            // Trap focus on mobile dialog
            if (isMobile) {
                window.app._trapFocus(menu);
            }
        }
    },
    closeMobileMenu: function () {
        const menu = document.getElementById('mobile-menu');
        const overlay = document.getElementById('mobile-menu-overlay');
        const btn = document.getElementById('mobile-menu-btn');

        if (!menu) return;

        menu.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (btn) {
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            btn.focus();
        }
        document.body.style.overflow = '';
        if (window.app._focusHandler) {
            document.removeEventListener('keydown', window.app._focusHandler);
            window.app._focusHandler = null;
        }
    },
    toggleNavSection: function (btnEl) {
        const group = btnEl.closest('.pnl-nav-group');
        if (!group) return;

        const isMobile = window.innerWidth < 768;
        const isExpanded = group.classList.contains('expanded');

        if (isMobile && !isExpanded) {
            // Single-open accordion on mobile: collapse all other groups first
            document.querySelectorAll('.pnl-nav-group').forEach(g => {
                g.classList.remove('expanded');
                const b = g.querySelector('.pnl-nav-link');
                if (b) b.setAttribute('aria-expanded', 'false');
            });
        }

        group.classList.toggle('expanded', !isExpanded);
        btnEl.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
    },
    toggleFooterMeta: function () {
        const meta = document.getElementById('pnl-footer-meta');
        if (meta) {
            meta.classList.toggle('collapsed');
        }
    },
    _trapFocus: function (container) {
        if (window.app._focusHandler) document.removeEventListener('keydown', window.app._focusHandler);
        
        window.app._focusHandler = function (e) {
            if (e.key === 'Escape') {
                window.app.closeMobileMenu();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusables = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (!focusables.length) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', window.app._focusHandler);
    },
    updateMobileAuthUI: function () {
        const headerCapitalArea = document.getElementById('header-capital-area');
        const btnAuthHeader = document.getElementById('btn-auth');

        const mobileUserSection = document.getElementById('mobile-user-section');
        const mobileCapitalSummary = document.getElementById('mobile-capital-summary');
        const mobileAccountLinks = document.getElementById('mobile-account-links');
        const mobileConnectSection = document.getElementById('mobile-connect-section');
        const signoutBtn = document.getElementById('pnl-signout-btn');

        const mobileInitial = document.getElementById('mobile-menu-initial');
        const mobileUsername = document.getElementById('mobile-menu-username');
        const mobileAvatar = document.getElementById('mobile-menu-avatar');
        const mobileBadge = document.querySelector('.pnl-user-badge');

        if (appState.isLoggedIn) {
            // Header: Show capital balance, hide sign-in button
            if (headerCapitalArea) headerCapitalArea.style.display = 'flex';
            if (btnAuthHeader) btnAuthHeader.style.display = 'none';

            // Drawer: Show user profile + capital block + account links + signout, HIDE sign-in callout
            if (mobileUserSection) mobileUserSection.style.display = 'flex';
            if (mobileCapitalSummary) mobileCapitalSummary.style.display = 'grid';
            if (mobileAccountLinks) mobileAccountLinks.style.display = 'block';
            if (signoutBtn) signoutBtn.style.display = 'flex';
            if (mobileConnectSection) mobileConnectSection.style.display = 'none';

            if (mobileUsername && appState.username) {
                mobileUsername.textContent = '@' + appState.username;
            }
            if (mobileInitial && appState.displayName) {
                mobileInitial.textContent = appState.displayName.charAt(0).toUpperCase();
            }

            if (appState.photoUrl && mobileAvatar) {
                mobileAvatar.src = appState.photoUrl;
                mobileAvatar.style.display = 'block';
                if (mobileInitial) mobileInitial.style.display = 'none';
                if (mobileBadge) mobileBadge.style.background = 'transparent';
            } else {
                if (mobileAvatar) mobileAvatar.style.display = 'none';
                if (mobileInitial) mobileInitial.style.display = '';
                if (mobileBadge) mobileBadge.style.background = '#0E1420';
            }
        } else {
            // Header: Show sign-in button, hide capital balance
            if (headerCapitalArea) headerCapitalArea.style.display = 'none';
            if (btnAuthHeader) btnAuthHeader.style.display = 'inline-block';

            // Drawer: Show sign-in callout row, HIDE profile + capital block + account section
            if (mobileUserSection) mobileUserSection.style.display = 'none';
            if (mobileCapitalSummary) mobileCapitalSummary.style.display = 'none';
            if (mobileAccountLinks) mobileAccountLinks.style.display = 'none';
            if (signoutBtn) signoutBtn.style.display = 'none';
            if (mobileConnectSection) mobileConnectSection.style.display = 'block';
        }
    },
    setupPayout: async function () {
        console.log('Initiating Stripe Connect Express for payout...');
        const btn = document.getElementById('manage-bank-btn') || document.getElementById('setup-payout-btn') || document.getElementById('manage-payout-btn');
        let originalText = '';

        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = `<div class="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>`;
            btn.disabled = true;
        }

        try {
            // Call the payout onboarding endpoint (creates Stripe Express account)
            const response = await window.api.startPayoutOnboard();
            if (response.onboardingUrl) {
                // Redirect to Stripe's Express onboarding flow
                window.location.href = response.onboardingUrl;
            } else if (response.alreadyConnected) {
                await showAlert('Your payout account is already connected!', { type: 'success', title: 'Already Connected' });
                window.location.reload();
            } else {
                throw new Error('No onboarding URL returned');
            }
        } catch (err) {
            console.error('Failed to start payout onboarding:', err);
            showAlert('Error setting up payout: ' + err.message, { type: 'error' });
            if (btn) {
                btn.innerHTML = originalText || 'Manage';
                btn.disabled = false;
            }
        }
    },
    // Settings Modal Functions
    openSettingsModal: function () {
        const backdrop = document.getElementById('modal-settings-backdrop');
        const modal = document.getElementById('modal-settings');
        backdrop.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            modal.classList.remove('scale-95', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Update settings username from state
        const usernameEl = document.getElementById('settings-username');
        if (usernameEl && appState.username) {
            usernameEl.textContent = appState.username;
        }

        // Populate connected sources
        window.app.populateSettingsSources();

        // Init lucide icons and tabs
        if (window.lucide) window.lucide.createIcons();
        window.app.initSettingsTabs();
    },
    closeSettingsModal: function () {
        const backdrop = document.getElementById('modal-settings-backdrop');
        const modal = document.getElementById('modal-settings');
        backdrop.classList.add('opacity-0');
        modal.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            modal.classList.add('hidden');
            // Reset to first tab
            window.app.switchSettingsTab('account');
        }, 300);
    },
    initSettingsTabs: function () {
        const tabs = document.querySelectorAll('.settings-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.getAttribute('data-settings-tab');
                window.app.switchSettingsTab(tabName);
            };
        });
    },
    switchSettingsTab: function (tabName) {
        const tabs = document.querySelectorAll('.settings-tab');
        const panels = document.querySelectorAll('.settings-panel');

        // Update tab styles - Aura pattern
        tabs.forEach(t => {
            t.classList.remove('bg-neutral-100', 'bg-red-50', 'text-neutral-900');
            t.classList.add('text-neutral-500');
            if (t.getAttribute('data-settings-tab') === 'danger') {
                t.classList.add('text-[#B91C1C]');
                t.classList.remove('text-neutral-500');
            }
        });

        const activeTab = document.querySelector(`[data-settings-tab="${tabName}"]`);
        if (activeTab) {
            if (tabName === 'danger') {
                activeTab.classList.add('bg-red-50');
            } else {
                activeTab.classList.add('bg-neutral-100', 'text-neutral-900');
                activeTab.classList.remove('text-neutral-500');
            }
        }

        // Show/hide panels
        panels.forEach(p => p.classList.add('hidden'));
        const activePanel = document.getElementById('settings-panel-' + tabName);
        if (activePanel) activePanel.classList.remove('hidden');

        if (window.lucide) window.lucide.createIcons();
    },
    populateSettingsSources: function () {
        const container = document.getElementById('settings-sources-list');
        if (!container) return;

        const sources = [
            { id: 'stripe', name: 'Stripe', icon: 'credit-card', connected: appState.connectedSources?.stripe },
            { id: 'github', name: 'GitHub', icon: 'github', connected: appState.connectedSources?.github },
            { id: 'twitter', name: 'X (Twitter)', icon: 'twitter', connected: appState.connectedSources?.twitter }
        ];

        container.innerHTML = sources.map(s => `
            <div class="border border-neutral-200 p-4 rounded-[2px] flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center">
                        <i data-lucide="${s.icon}" class="w-5 h-5 text-neutral-500"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-neutral-900">${s.name}</p>
                        <p class="font-mono text-[10px] ${s.connected ? 'text-[#1F7A4D]' : 'text-neutral-400'} flex items-center gap-1">
                            ${s.connected ? '<span class="w-1.5 h-1.5 bg-[#1F7A4D] rounded-full"></span> CONNECTED' : '• DISCONNECTED'}
                        </p>
                    </div>
                </div>
                <button data-source-btn="${s.id}" onclick="window.app.${s.connected ? 'disconnect' : 'connect'}Source('${s.id}')" class="px-3 py-1.5 border border-neutral-200 text-[11px] font-mono uppercase tracking-wide text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    ${s.connected ? 'Disconnect' : 'Connect'}
                </button>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    },
    disconnectSource: async function (source) {
        const btn = document.querySelector(`button[data-source-btn="${source}"]`);
        const originalLabel = btn?.innerHTML;

        // Show loading state
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '...';
        }

        try {
            if (source === 'twitter') {
                await window.api.disconnectX();

                // 1) Re-hydrate canonical state from backend (identity + connections)
                if (window.hydrateSession) await window.hydrateSession();

                // 2) Refresh settings UI
                window.app.populateSettingsSources();

                // 3) Force router to re-render current page (prevents blank view)
                const current = window.router.getCurrentPath();
                window.router.navigate(current === '/' ? '/market' : current);

                return;
            }

            showAlert('Not implemented yet.', { type: 'info', title: 'Coming Soon' });
        } catch (err) {
            console.error('[App] disconnectSource error:', err);
            showAlert('Failed to disconnect: ' + (err.message || 'Unknown error'), { type: 'error' });
            // Only restore button on failure (no re-render happened)
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalLabel || 'Disconnect';
            }
        }
    }
};

// ============================================================================
// UNIFIED WALLET LINKING SYSTEM
// ============================================================================
window.app.syncUnifiedState = async function () {
    const account = getAccount(wagmiAdapter.wagmiConfig);
    const hasToken = api.hasAuthToken();

    appState.unified.authStatus = hasToken ? 'signed_in' : 'signed_out';
    appState.unified.user = hasToken ? {
        id: appState.userId,
        email: storedUser?.email || '',
        displayName: appState.displayName || appState.username || ''
    } : null;

    if (account.isConnected && account.address) {
        appState.unified.connectedWallet = account.address.toLowerCase();
        appState.unified.chainId = account.chainId;
        appState.unified.isCorrectChain = account.chainId === 4663;
    } else {
        appState.unified.connectedWallet = null;
        appState.unified.chainId = null;
        appState.unified.isCorrectChain = false;
    }

    if (hasToken) {
        try {
            const res = await api.getLinkedWallets();
            if (res && res.ok) {
                appState.unified.linkedWallets = res.wallets || [];
                appState.unified.primaryWallet = appState.unified.linkedWallets.find(w => w.isPrimary) || null;
            }
        } catch (err) {
            console.error('[UnifiedState] Failed to fetch linked wallets:', err);
        }

        if (appState.unified.connectedWallet) {
            const isLinked = appState.unified.linkedWallets.some(
                w => w.walletAddress.toLowerCase() === appState.unified.connectedWallet
            );
            appState.unified.walletStatus = isLinked ? 'connected_linked' : 'connected_not_linked';

            // Auto-trigger link prompt if logged in, wallet is connected, but not linked
            if (!isLinked && !window.app._linkingPromptActive) {
                window.app.promptLinkWallet(appState.unified.connectedWallet);
            }
        } else {
            appState.unified.walletStatus = 'disconnected';
        }
    } else {
        appState.unified.linkedWallets = [];
        appState.unified.primaryWallet = null;
        appState.unified.walletStatus = 'disconnected';
    }

    console.log('[UnifiedState] Synced state:', JSON.stringify(appState.unified));

    // Notify active views/components to re-render
    if (window.app.renderLinkedWallets) {
        window.app.renderLinkedWallets();
    }
    
    // Update connected banner in Token view if active
    if (window.app.updateTokenConnectedState) {
        window.app.updateTokenConnectedState();
    }
};

window.app._linkingPromptActive = false;
window.app.promptLinkWallet = async function (address) {
    if (window.app._linkingPromptActive) return;
    window.app._linkingPromptActive = true;

    try {
        const accept = await showConfirm(
            `Link connected wallet ${address.slice(0, 6)}...${address.slice(-4)} to your Collateral account?`,
            {
                title: 'Link Wallet Identity',
                confirmText: 'LINK WALLET',
                cancelText: 'NOT NOW'
            }
        );

        if (!accept) {
            window.app._linkingPromptActive = false;
            return;
        }

        // Fetch nonce
        const nonceRes = await api.getWalletNonce();
        if (!nonceRes || !nonceRes.ok) {
            throw new Error(nonceRes.error || 'Failed to fetch verification nonce');
        }

        const nonce = nonceRes.nonce;
        const messageText = `Collateral Wallet Verification\n\n` +
            `Link wallet ${address} to your Collateral account.\n\n` +
            `User ID: ${appState.userId}\n` +
            `Domain: collateral.market\n` +
            `Chain ID: 4663\n` +
            `Nonce: ${nonce}\n` +
            `Issued At: ${nonceRes.createdAt}\n` +
            `Expiration Time: ${nonceRes.expiresAt}`;

        // Request signature
        const signature = await signMessage(wagmiAdapter.wagmiConfig, {
            message: messageText
        });

        // Submit signature to backend
        const linkRes = await api.linkWallet(address, signature, nonce);
        if (!linkRes || !linkRes.ok) {
            throw new Error(linkRes.error || 'Failed to link wallet');
        }

        await showAlert('Wallet linked successfully!', { type: 'success', title: 'Identity Verified' });

        // Force reload / re-fetch profile/stats
        await window.app.syncUnifiedState();

    } catch (err) {
        console.error('[WalletLink] Linking failed:', err);
        showAlert(err.message || 'Signature rejected or verification failed.', { type: 'error', title: 'Linking Failed' });
    } finally {
        window.app._linkingPromptActive = false;
    }
};

// Watch account connection changes
watchAccount(wagmiAdapter.wagmiConfig, {
    onChange(account) {
        console.log('[Web3] Account changed:', account.address);
        if (window.app && window.app.syncUnifiedState) {
            window.app.syncUnifiedState();
        }
    }
});

function updateAuthUI() {
    if (!appState.sessionHydrated) return;

    const btnAuth = document.getElementById('btn-auth');
    // Signed-out primary action. Tracks btnAuth exactly — both are the
    // signed-out pair, and toggling one without the other leaves GET STARTED
    // sitting beside a signed-in avatar.
    const btnGetStarted = document.getElementById('btn-get-started');
    const capitalArea = document.getElementById('header-capital-area');
    const headerAvatarTrigger = document.getElementById('header-avatar-trigger');
    const headerAvatarDivider = document.getElementById('header-avatar-divider');
    const headerAvatarInitial = document.getElementById('header-avatar-initial');
    const headerAvatarImg = document.getElementById('header-avatar-img');

    if (appState.isLoggedIn) {
        if (btnAuth) btnAuth.style.display = 'none';
        if (btnGetStarted) btnGetStarted.style.display = 'none';
        if (capitalArea) {
            capitalArea.style.display = 'flex';
            window.api.getBillingStatus().then(res => {
                const availCents = res?.balances?.availableBalanceUsdCents || 0;
                const capEl = document.getElementById('header-avail-cap');
                if (capEl) {
                    const dollars = (!availCents || availCents <= 300) ? 2500 : Math.round(availCents / 100);
                    capEl.textContent = '$' + dollars.toLocaleString();
                }
            }).catch(e => console.error('[Auth] Failed to fetch balance for header:', e));
        }

        // Header Avatar Indicator & Divider Sync
        if (headerAvatarTrigger) headerAvatarTrigger.style.display = 'flex';
        if (headerAvatarDivider) headerAvatarDivider.style.display = 'block';
        if (headerAvatarInitial && appState.displayName) {
            headerAvatarInitial.textContent = appState.displayName.charAt(0).toUpperCase();
        }
        if (appState.photoUrl && headerAvatarImg) {
            headerAvatarImg.src = appState.photoUrl;
            headerAvatarImg.style.display = 'block';
            if (headerAvatarInitial) headerAvatarInitial.style.display = 'none';
        } else {
            if (headerAvatarImg) headerAvatarImg.style.display = 'none';
            if (headerAvatarInitial) headerAvatarInitial.style.display = '';
        }

        console.log('[Auth] UI updated, showing:', appState.username);
    } else {
        if (btnAuth) btnAuth.style.display = 'inline-block';
        if (btnGetStarted) btnGetStarted.style.display = 'inline-block';
        if (capitalArea) capitalArea.style.display = 'none';
        if (headerAvatarTrigger) headerAvatarTrigger.style.display = 'none';
        if (headerAvatarDivider) headerAvatarDivider.style.display = 'none';
    }

    if (window.app && window.app.updateMobileAuthUI) {
        window.app.updateMobileAuthUI();
    }
}
const protectedRoutes = ['/market', '/contracts/execute', '/my-contracts', '/profile', '/funding', '/sources', '/rivalry', '/ledger', '/contract'];

// Route change handler
router.onRouteChange = function (route, path) {
    // GA4: Track SPA page view on every route change
    if (window.trackPageView) window.trackPageView(path);
    // Cleanup rivalry poll if navigating away
    if (window._rivalryPollCleanup) window._rivalryPollCleanup();
    // Pre-launch mode: hide header, footer, and status bar
    if (PRE_LAUNCH_MODE) {
        const headerMount = document.getElementById('header-mount');
        const statusBar = document.querySelector('.fixed.bottom-0');
        const appMount = document.getElementById('app');

        if (headerMount) headerMount.innerHTML = '';
        if (statusBar) statusBar.style.display = 'none';
        if (appMount) {
            appMount.classList.remove('pt-24');
            appMount.innerHTML = route.render(route.params);
        }

        if (route.init) {
            setTimeout(() => route.init(route.params), 0);
        }
        return;
    }

    // Check if route requires authentication
    const isProtected = protectedRoutes.some(pr => path === pr || path.startsWith(pr + '/'));

    if (isProtected && !appState.isLoggedIn) {
        // Show login modal
        window.app.openAccessModal();
        // Redirect to public landing page to prevent unauthorized access
        window.router.navigate('/');
        return;
    }

    // Landing page: clean full-page layout + mount mobile drawer menu for hamburger
    const headerMount = document.getElementById('header-mount');
    const appMount = document.getElementById('app');
    // Universal Header across ALL routes
    if (headerMount) {
        headerMount.innerHTML = renderHeader(path);
    }
    if (appMount) {
        appMount.classList.add('pt-20');
    }

    // Render header with current route
    appMount.classList.add('pt-24');
    headerMount.innerHTML = renderHeader(path);

    // Render view content
    appMount.innerHTML = route.render(route.params);

    // Initialize view (pass route params for parameterized routes like /receipts/:id)
    if (route.init) {
        setTimeout(() => route.init(route.params), 0);
    }

    // Reinitialize Lucide icons
    if (window.lucide) {
        setTimeout(() => window.lucide.createIcons(), 10);
    }

    // Initialize scroll effects AFTER view content is rendered
    // (data-reveal elements are in the view HTML, not the header)
    setTimeout(() => initScrollEffects(), 20);

    // Update auth UI
    updateAuthUI();
    setTimeout(() => handleGlobalScroll(), 10);
};

// Global scroll handler for premium header transitions (RAF-throttled)
let _scrollTicking = false;
function handleGlobalScroll() {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const isScrolled = scrollY > 20;

    if (isScrolled) {
        document.body.classList.add('nav-scrolled');
    } else {
        document.body.classList.remove('nav-scrolled');
    }

    const banner = document.getElementById('global-banner');
    if (banner) {
        if (isScrolled) {
            banner.classList.add('nav-scrolled');
        } else {
            banner.classList.remove('nav-scrolled');
        }
    }

    const header = document.querySelector('.ch-header');
    if (header) {
        /* THE BAR ONLY TAKES A FILL ONCE IT IS OVER CONTENT.
           scrollY > 20 is the right threshold for every other route, but on a
           page with a full-height hero it turns the bar into a flat panel 20px
           into the scroll — while the artwork is still directly behind it. On
           the phone that reads as a lighter band ruled across the plate, which
           is the seam that was reported: the hero's ground is graded parchment
           and the fill is a single flat value, so they cannot match.

           Gated on the hero's own bottom edge instead. While any part of the
           hero is still behind the bar it stays transparent and the artwork
           runs straight up through it; once the hero has passed, the fill
           engages and keeps the wordmark legible over the sections below.
           Routes with no hero are unaffected and still use scrollY > 20. */
        const hero = document.querySelector('.clt-hero');
        const overContent = hero
            ? hero.getBoundingClientRect().bottom <= header.getBoundingClientRect().height
            : isScrolled;

        if (overContent) {
            header.classList.add('nav-scrolled');
        } else {
            header.classList.remove('nav-scrolled');
        }
    }

    const ln = document.querySelector('.ln');
    if (ln) {
        if (isScrolled) {
            ln.classList.add('nav-scrolled');
        } else {
            ln.classList.remove('nav-scrolled');
        }
    }
    _scrollTicking = false;
}
window.addEventListener('scroll', () => {
    if (!_scrollTicking) {
        _scrollTicking = true;
        requestAnimationFrame(handleGlobalScroll);
    }
}, { passive: true });
window.addEventListener('load', handleGlobalScroll);

// Handle default route (but NEVER override OAuth callback queries)
const { pathname: defaultPathname, search: defaultSearch } = window.location;
const isOAuthLanding =
    defaultPathname === '/' &&
    (defaultSearch.includes('success=') || defaultSearch.includes('code=') || defaultSearch.includes('state='));

if (!window.location.hash && !isOAuthLanding) {
    // Router handles default route via handleRoute()
}

// Hydrate session from backend on app init
// This ensures identity is always canonical from DB, even if localStorage is stale
hydrateSession();

// =============================================================================
// CLERK SDK INITIALIZATION
// =============================================================================
(async function initClerk() {
    const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!clerkPubKey) {
        // Record WHY OAuth is unavailable. Without this the sign-in button shows a
        // dead-end "OAuth not available" with nothing to act on, which reads like a
        // Google/network fault when it is actually one missing env var.
        window.__clerkUnavailableReason =
            'VITE_CLERK_PUBLISHABLE_KEY is not set. Add it to FRONTEND/.env and restart the dev server ' +
            '(Vite only reads .env at startup).';
        console.warn('[Clerk] ' + window.__clerkUnavailableReason);
        return;
    }
    try {
        // Dynamically import Clerk JS
        const { Clerk } = await import('https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/+esm');
        const clerk = new Clerk(clerkPubKey);
        await clerk.load();
        window.Clerk = clerk;
        console.log('[Clerk] ✅ SDK loaded, session:', !!clerk.session);

        // If user has Clerk session, reflect it on the frontend
        if (clerk.session && clerk.user) {
            // Immediately show user as logged in from Clerk data
            const clerkUser = clerk.user;
            const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
            const firstName = clerkUser.firstName || '';
            const lastName = clerkUser.lastName || '';
            const displayName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0] || 'User';

            appState.isLoggedIn = true;
            appState.displayName = displayName;
            appState.username = email.split('@')[0] || displayName.toLowerCase().replace(/\s/g, '');
            console.log('[Clerk] ✅ Showing user as logged in:', displayName);
            updateAuthUI();

            // Then try backend token exchange in background (for internal JWT)
            if (!api.hasAuthToken()) {
                console.log('[Clerk] Exchanging token with backend...');
                try {
                    await window.app._exchangeClerkToken();
                } catch (e) {
                    console.warn('[Clerk] Backend token exchange failed (user still shown as logged in):', e.message);
                }
            }
        }
    } catch (err) {
        // Key was present but the SDK never came up — CDN blocked, offline, bad key.
        // Distinguish this from "not configured" so the two aren't debugged as one.
        window.__clerkUnavailableReason =
            'Clerk SDK failed to load (' + (err && err.message ? err.message : String(err)) + '). ' +
            'Check the network tab for cdn.jsdelivr.net and any blocking extension.';
        console.error('[Clerk] SDK init failed:', err);
    }
})();

// Notification badge polling — check for unread every 30s
if (api.hasAuthToken()) {
    window.app.pollNotificationCount();
}
setInterval(() => {
    if (api.hasAuthToken()) window.app.pollNotificationCount();
}, 30000);

// --- Terminal Decoder Animation ---
function runDecoderAnimation() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    document.querySelectorAll('.cl-decode-text:not(.decoded)').forEach(el => {
        el.classList.add('decoded');
        const targetText = el.getAttribute('data-target') || 'Collateral';
        let iterations = 0;
        const maxIterations = 15;
        const interval = setInterval(() => {
            el.innerText = targetText.split('').map((letter, index) => {
                if(index < iterations / 1.5) {
                    return targetText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            
            if(iterations >= maxIterations * 1.5) {
                clearInterval(interval);
                el.innerText = targetText;
                
                // Restart animation loop for the loader specifically
                if(el.classList.contains('cl-loop-decode')) {
                    setTimeout(() => {
                        el.classList.remove('decoded');
                    }, 2000);
                }
            }
            iterations++;
        }, 50);
    });
}
setInterval(runDecoderAnimation, 500);
