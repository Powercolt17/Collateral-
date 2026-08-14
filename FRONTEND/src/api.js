// =============================================================================
// API CLIENT - Collateral Backend Integration
// =============================================================================

// API Base URL - Default to Railway production, override with VITE_API_BASE_URL for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://collateral-production.up.railway.app';

// Startup log - Makes environment mistakes instantly obvious
console.log(`[API] 🔗 Base URL: ${API_BASE_URL}`);

// Export for UI debugging (e.g. show in footer)
export function getApiEnvironment() {
    const isLocal = API_BASE_URL.includes('localhost');
    return {
        url: API_BASE_URL,
        env: isLocal ? 'LOCAL' : 'PRODUCTION',
        display: isLocal ? 'localhost:3000' : new URL(API_BASE_URL).hostname,
    };
}

// =============================================================================
// AUTH TOKEN MANAGEMENT
// =============================================================================

const TOKEN_KEY = 'collateral_auth_token';
const USER_KEY = 'collateral_user';

export function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function hasAuthToken() {
    return !!getAuthToken();
}

export function getStoredUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// =============================================================================
// HTTP HELPERS
// =============================================================================

function getHeaders(includeAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

async function handleResponse(response) {
    // Handle 204 No Content without trying to parse
    const isNoContent = response.status === 204;
    const data = isNoContent ? {} : await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || data.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.code = data.code;
        error.data = data;
        throw error;
    }

    return data;
}

// Bulletproof POST helper
// - undefined: sends {} (default, prevents empty body errors)
// - null: sends NO body (escape hatch for strict APIs)
// - object: sends JSON body
async function post(path, body) {
    const init = {
        method: 'POST',
        headers: getHeaders(),
    };

    if (body === undefined) {
        init.body = JSON.stringify({});
    } else if (body !== null) {
        init.body = JSON.stringify(body);
    }
    // body === null means no body at all

    const response = await fetch(`${API_BASE_URL}${path}`, init);
    return handleResponse(response);
}

// POST helper for unauthenticated endpoints (login, signup)
async function postPublic(path, body) {
    const init = {
        method: 'POST',
        headers: getHeaders(false),
    };

    if (body === undefined) {
        init.body = JSON.stringify({});
    } else if (body !== null) {
        init.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, init);
    return handleResponse(response);
}

// Response cache for short-lived GET deduplication
const _cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

function getCached(key) {
    const entry = _cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    _cache.delete(key);
    return null;
}

function setCache(key, data) {
    _cache.set(key, { data, ts: Date.now() });
    // Prevent unbounded growth
    if (_cache.size > 100) {
        const oldest = _cache.keys().next().value;
        _cache.delete(oldest);
    }
}

// Inflight deduplication — prevents duplicate parallel requests for same endpoint
const _inflight = new Map();

// GET helper for consistency
async function get(path) {
    // Check cache first
    const cached = getCached(path);
    if (cached) return cached;

    // Deduplicate inflight requests
    if (_inflight.has(path)) return _inflight.get(path);

    const promise = fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: getHeaders(),
    }).then(r => handleResponse(r)).then(data => {
        setCache(path, data);
        _inflight.delete(path);
        return data;
    }).catch(err => {
        _inflight.delete(path);
        throw err;
    });

    _inflight.set(path, promise);
    return promise;
}

// PATCH helper
async function patch(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(response);
}

// GET helper for unauthenticated endpoints
async function getPublic(path) {
    const cached = getCached('pub:' + path);
    if (cached) return cached;

    if (_inflight.has('pub:' + path)) return _inflight.get('pub:' + path);

    const promise = fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        headers: getHeaders(false),
    }).then(r => handleResponse(r)).then(data => {
        setCache('pub:' + path, data);
        _inflight.delete('pub:' + path);
        return data;
    }).catch(err => {
        _inflight.delete('pub:' + path);
        throw err;
    });

    _inflight.set('pub:' + path, promise);
    return promise;
}

// =============================================================================
// API METHODS
// =============================================================================

// --- AUTH ---

/**
 * Login with email + password
 * Calls /v1/auth/login - does NOT create user
 */
export async function login(email, password) {
    console.log('[API] login called with email:', email);

    const data = await postPublic('/v1/auth/login', { email, password });
    console.log('[API] login response:', data);

    if (data.accessToken) {
        setAuthToken(data.accessToken);
        setStoredUser({
            email: data.user?.email || email,
            userId: data.user?.id,
            displayName: data.identity?.displayName || null,
            username: data.identity?.username || null,
        });
        console.log('[API] ✅ Login complete, identity:', data.identity?.displayName);
    }

    return data;
}

/**
 * Signup with email, password, username
 * Creates user + identity in one call
 */
export async function signup(email, password, username, displayName = null) {
    console.log('[API] signup called:', { email, username, displayName });

    // Attach UTM attribution if present
    let utmData = null;
    try { utmData = JSON.parse(localStorage.getItem('collateral_utm') || 'null'); } catch(e) {}

    const data = await postPublic('/v1/auth/signup', {
        email,
        password,
        username,
        displayName: displayName || username,
        referralCode: getReferralCode() || undefined,
        utm: utmData || undefined
    });
    console.log('[API] signup response:', data);

    if (data.accessToken) {
        setAuthToken(data.accessToken);
        setStoredUser({
            email: data.user?.email || email,
            userId: data.user?.id,
            displayName: data.identity?.displayName,
            username: data.identity?.username,
        });
        console.log('[API] ✅ Signup complete, identity:', data.identity?.displayName);
    }

    return data;
}

/**
 * Authenticate or register using a wallet signature (SIWE login)
 */
export async function loginWithWallet(walletAddress, signature, nonce) {
    console.log('[API] loginWithWallet called for:', walletAddress);

    const data = await postPublic('/v1/auth/wallet/login', {
        walletAddress,
        signature,
        nonce,
        referralCode: getReferralCode() || undefined
    });
    console.log('[API] loginWithWallet response:', data);

    if (data.accessToken) {
        setAuthToken(data.accessToken);
        setStoredUser({
            email: data.user?.email,
            userId: data.user?.id,
            displayName: data.identity?.displayName,
            username: data.identity?.username,
        });
        console.log('[API] ✅ Wallet login complete, identity:', data.identity?.displayName);
    }

    return data;
}

/**
 * Dev login (DEPRECATED - dev mode only)
 * Blocked in production for security
 */
export async function devLogin(email, displayName = null) {
    // Block in production
    if (import.meta.env.PROD) {
        throw new Error('devLogin is disabled in production. Use login() instead.');
    }

    console.log('[API] devLogin (deprecated) called');

    const data = await postPublic('/auth/login', { email, displayName });
    if (data.accessToken) {
        setAuthToken(data.accessToken);
        setStoredUser({
            email,
            userId: data.user?.id,
            displayName: data.identity?.displayName || displayName || null,
            username: data.identity?.username || null,
        });
    }
    return data;
}

export async function logout() {
    clearAuthToken();
}

// --- X OAUTH (NEW) ---

export async function startXOAuth() {
    console.log('[API] startXOAuth called');
    return get('/v1/connect/x/oauth/start');
}

export async function getXStatus() {
    return get('/v1/connect/x/status');
}

export async function disconnectX() {
    return post('/v1/connect/x/disconnect');
}

// --- DEPRECATED: X VERIFICATION (bio challenge) ---
// These are kept for backward compatibility but should not be used

export async function startXVerification(xUsername) {
    console.warn('[API] startXVerification is DEPRECATED. Use startXOAuth instead.');
    return post('/v1/connect/x/start', { username: xUsername });
}

export async function verifyX() {
    console.warn('[API] verifyX is DEPRECATED. Use startXOAuth instead.');
    return post('/v1/connect/x/verify');
}

// --- STRIPE CONNECT ---

export async function startStripeConnect() {
    const token = getAuthToken();
    console.log('[API] startStripeConnect called');

    // If no token, throw immediately with clear error
    if (!token) {
        throw new Error('Login required to connect Stripe. Please log in first.');
    }

    return get('/v1/connect/stripe/start');
}

export async function completeStripeConnect(code, state) {
    console.log('[API] completeStripeConnect called');
    return post('/v1/connect/stripe/callback', { code, state });
}

export async function getStripeStatus() {
    return get('/v1/connect/stripe/status');
}

// --- SHOPIFY CONNECT ---

export async function startShopifyConnect(shop) {
    const token = getAuthToken();
    console.log('[API] startShopifyConnect called for shop:', shop);
    if (!token) {
        throw new Error('Login required to connect Shopify. Please log in first.');
    }
    return get(`/v1/connect/shopify/start?shop=${encodeURIComponent(shop)}`);
}

export async function getShopifyStatus() {
    return get('/v1/connect/shopify/status');
}

export async function disconnectShopify() {
    return post('/v1/connect/shopify/disconnect');
}


// --- PLAID BANK CONNECT ---
// Plaid Link is an embedded modal, not an OAuth redirect: there is no popup and
// nothing to poll. Link returns a public_token to onSuccess, which is exchanged
// server-side. The access_token never reaches the browser.

export async function createPlaidLinkToken() {
    return post('/v1/connect/plaid/link-token');
}

export async function exchangePlaidPublicToken(publicToken, accountId) {
    return post('/v1/connect/plaid/exchange', { publicToken, accountId });
}

export async function getPlaidStatus() {
    return get('/v1/connect/plaid/status');
}

export async function getPlaidHistory() {
    return get('/v1/connect/plaid/history');
}

export async function getPlaidStreams() {
    return get('/v1/connect/plaid/streams');
}

export async function selectPlaidStream(streamId) {
    return post('/v1/connect/plaid/select-stream', { streamId });
}

export async function disconnectPlaid() {
    return post('/v1/connect/plaid/disconnect');
}

// --- AMAZON CONNECT ---

export async function startAmazonConnect() {
    const token = getAuthToken();
    console.log('[API] startAmazonConnect called');
    if (!token) {
        throw new Error('Login required to connect Amazon. Please log in first.');
    }
    return get('/v1/connect/amazon/start');
}

export async function getAmazonStatus() {
    return get('/v1/connect/amazon/status');
}

export async function disconnectAmazon() {
    return post('/v1/connect/amazon/disconnect');
}

// --- YOUTUBE CONNECT ---

export async function startYouTubeConnect() {
    const token = getAuthToken();
    console.log('[API] startYouTubeConnect called');
    if (!token) {
        throw new Error('Login required to connect YouTube. Please log in first.');
    }
    return get('/v1/connect/youtube/start');
}

export async function getYouTubeStatus() {
    return get('/v1/connect/youtube/status');
}

export async function disconnectYouTube() {
    return post('/v1/connect/youtube/disconnect');
}

// --- CONTRACTS ---

export async function createContract(params) {
    return post('/v1/contracts', params);
}

export async function getContracts() {
    return get('/v1/contracts');
}

export async function getContract(contractId) {
    return get(`/v1/contracts/${contractId}`);
}

export async function getContractMetric(contractId) {
    return get(`/v1/contracts/${contractId}/metric`);
}

export async function getContractMetricPreview(contractId) {
    return get(`/v1/contracts/${contractId}/preview_baseline`);
}

export async function getProviderPreview(provider, metricKey, tier) {
    let url = `/v1/oracle/preview?provider=${encodeURIComponent(provider)}`;
    if (metricKey) {
        url += `&metric=${encodeURIComponent(metricKey)}`;
    }
    if (tier) {
        url += `&tier=${encodeURIComponent(tier)}`;
    }
    return get(url);
}

export async function getMarketFeed(params = {}) {
    const query = new URLSearchParams(params).toString();
    return getPublic(`/v1/market/contracts?${query}`);
}

export async function getMarketListings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return getPublic(`/v1/market/listings?${query}`);
}

// --- MARKET (Public Templates) ---

export async function getMarketContract(id) {
    return getPublic(`/v1/market/contracts/${id}`);
}

export async function getMarketQuote(id, stake) {
    return postPublic(`/v1/market/contracts/${id}/quote`, { stake });
}

// --- FUNDING ---

export async function createFundingIntent(contractId, transactionHash) {
    return post(`/v1/contracts/${contractId}/funding-intent`, { transactionHash });
}

// --- BILLING (Card Verification) ---

export async function createCardSetupIntent() {
    return post('/v1/billing/card/setup_intent');
}

export async function getBillingStatus() {
    return get('/v1/billing/status');
}

export async function confirmCard(setupIntentId, paymentMethodId) {
    return post('/v1/billing/card/confirm', { setupIntentId, paymentMethodId });
}

export async function removeCard() {
    return post('/v1/billing/card/remove');
}

export async function addFunds(amountCents) {
    return post('/v1/billing/add-funds', { amountCents });
}

// --- EXECUTE ---

export async function executeContract(contractId) {
    console.log('[API] executeContract called for:', contractId);
    return post(`/v1/contracts/${contractId}/execute`);
}

// --- DEV-ONLY: Simulate Success ---
export async function devSimulateSuccess(contractId) {
    console.warn('[API][DEV] Simulating contract success:', contractId);
    return post(`/v1/contracts/${contractId}/dev/simulate-success`);
}


// --- CONNECTED ACCOUNTS ---

export async function getConnectedAccounts() {
    return get('/v1/me/connected-accounts');
}

export async function getConnectionStatus() {
    return get('/v1/connect/status');
}

export async function getProfile() {
    return get('/v1/me/profile');
}

// --- AVATAR UPLOAD ---

/**
 * Upload a profile picture.
 * Reads the file client-side as base64, then PATCHes identity.
 * Max 2MB, JPEG/PNG/WebP only.
 */
export async function uploadAvatar(file) {
    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
        throw new Error('Invalid file type. Use JPEG, PNG, or WebP.');
    }
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be under 2MB.');
    }

    // Read as base64 data URI
    const dataUri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });

    // PATCH identity with photoUrl
    return patch('/identity/me', { photoUrl: dataUri });
}

/**
 * Remove profile picture.
 */
export async function removeAvatar() {
    return patch('/identity/me', { photoUrl: null });
}

// --- LEDGER ---

export async function getLedgerEvents(contractId) {
    return get(`/v1/contracts/${contractId}/events`);
}

export async function getPublicLedger() {
    return getPublic('/v1/ledger');
}

export async function getPublicResults() {
    return getPublic('/v1/results');
}

// --- PAYOUTS (Stripe Connect Express for Payouts) ---

// Start Stripe Connect Express onboarding for payouts
// Creates a Stripe Express account and returns onboarding URL
export async function startPayoutOnboard() {
    console.log('[API] startPayoutOnboard called');
    return post('/v1/payouts/onboard');
}

export async function createConnectAccount() {
    return post('/v1/payouts/connect/create');
}

export async function getConnectStatus() {
    return get('/v1/payouts/connect/status');
}

export async function runPayouts() {
    return post('/v1/payouts/run');
}

// --- LOCK & SETTLE ---

export async function lockContract(contractId, amountCents) {
    return post(`/v1/contracts/${contractId}/lock`, { amountCents });
}

export async function settleContract(contractId, outcome) {
    return post(`/v1/contracts/${contractId}/settle`, { outcome });
}

// --- SOCIAL SHARE BONUS ---

export async function submitSocialBonus(contractId, tweetUrl) {
    return post(`/contracts/${contractId}/social-bonus`, { tweetUrl });
}

export async function removeSocialBonus(contractId) {
    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/social-bonus`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    return handleResponse(response);
}

// --- REFERRAL SYSTEM ---

export async function getReferralStats() {
    return get('/me/referrals');
}

export async function validateReferralCode(code) {
    return getPublic(`/r/${encodeURIComponent(code)}`);
}

// Referral code storage — cookie (30 day) + localStorage for persistence
export function setReferralCode(code) {
    if (!code) return;
    const val = code.toLowerCase();
    localStorage.setItem('collateral_referral', val);
    // Set 30-day cookie
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `collateral_ref=${encodeURIComponent(val)};expires=${expires};path=/;SameSite=Lax`;
}

export function getReferralCode() {
    // Check localStorage first, then cookie
    const ls = localStorage.getItem('collateral_referral');
    if (ls) return ls;
    // Parse cookie
    const match = document.cookie.match(/(?:^|;\s*)collateral_ref=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function clearReferralCode() {
    localStorage.removeItem('collateral_referral');
    document.cookie = 'collateral_ref=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
}

// --- WALLET LINKING ---

export async function getWalletNonce() {
    return post('/v1/auth/wallet/nonce');
}

export async function linkWallet(walletAddress, signature, nonce) {
    return post('/v1/auth/wallet/link', { walletAddress, signature, nonce });
}

export async function unlinkWallet(walletAddress, signature, nonce) {
    return post('/v1/auth/wallet/unlink', { walletAddress, signature, nonce });
}

export async function setPrimaryWallet(walletAddress) {
    return post('/v1/auth/wallet/primary', { walletAddress });
}

export async function getLinkedWallets() {
    return get('/v1/auth/wallet/list');
}

// --- HEALTH ---

export async function checkHealth() {
    const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
    });

    return handleResponse(response);
}

// =============================================================================
// RIVALRY MODE
// =============================================================================

function createRivalry(params) { return post('/v1/rivalries', params); }
function getRivalries(params = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    const qs = q.toString();
    return getPublic(`/v1/rivalries${qs ? '?' + qs : ''}`);
}
// limit/offset are forwarded here too. They were dropped, so /me silently
// returned the server's default page however large a caller asked for — the
// market pages through both feeds and would have stopped short on this one.
function getMyRivalries(params = {}) {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    const qs = q.toString();
    return get(`/v1/rivalries/me${qs ? '?' + qs : ''}`);
}
function getRivalryStats() { return getPublic('/v1/rivalries/stats'); }
function getRivalry(id) { return getPublic(`/v1/rivalries/${id}`); }
function acceptRivalry(id) { return post(`/v1/rivalries/${id}/accept`, {}); }
function declineRivalry(id) { return post(`/v1/rivalries/${id}/decline`, {}); }
function fundRivalry(id) { return post(`/v1/rivalries/${id}/fund`, {}); }
function getRivalryEvents(id) { return getPublic(`/v1/rivalries/${id}/events`); }
function getRivalryMetrics(id) { return getPublic(`/v1/rivalries/${id}/metrics`); }
function getRivalryShare(id) { return getPublic(`/v1/rivalries/${id}/share`); }

export function getHomepageStats() {
    return getPublic('/v1/market/homepage-stats');
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    // Auth
    login,
    signup,
    loginWithWallet,
    devLogin,
    logout,
    getAuthToken,
    setAuthToken,
    getHomepageStats,
    hasAuthToken,
    clearAuthToken,
    getStoredUser,
    setStoredUser,

    // X (OAuth - recommended)
    startXOAuth,
    getXStatus,
    disconnectX,
    // X (deprecated bio challenge)
    startXVerification,
    verifyX,

    // Stripe Connect
    startStripeConnect,
    completeStripeConnect,
    getStripeStatus,

    // Shopify Connect
    startShopifyConnect,
    getShopifyStatus,
    createPlaidLinkToken,
    exchangePlaidPublicToken,
    getPlaidStatus,
    getPlaidHistory,
    getPlaidStreams,
    selectPlaidStream,
    disconnectPlaid,
    disconnectShopify,

    // Amazon Connect
    startAmazonConnect,
    getAmazonStatus,
    disconnectAmazon,

    // YouTube Connect
    startYouTubeConnect,
    getYouTubeStatus,
    disconnectYouTube,

    // Contracts
    createContract,
    getContracts,
    getContract,
    getContractMetric,
    getContractMetricPreview,
    getProviderPreview,
    getMarketFeed,
    getMarketListings,
    getMarketContract,
    getMarketQuote,

    // Funding
    createFundingIntent,

    // Billing (Card Verification)
    createCardSetupIntent,
    getBillingStatus,
    confirmCard,
    removeCard,
    addFunds,

    // Execute
    executeContract,

    // DEV-only
    devSimulateSuccess,

    // Connected Accounts
    getConnectedAccounts,
    getConnectionStatus,
    getProfile,

    // Avatar
    uploadAvatar,
    removeAvatar,

    // Ledger
    getLedgerEvents,
    getPublicLedger,
    getPublicResults,

    // Payouts (Stripe Connect Express)
    startPayoutOnboard,
    createConnectAccount,
    getConnectStatus,
    runPayouts,

    lockContract,
    settleContract,

    // Social Share Bonus
    submitSocialBonus,
    removeSocialBonus,

    // Referral System
    getReferralStats,
    validateReferralCode,
    setReferralCode,
    getReferralCode,
    clearReferralCode,

    // Wallet linking
    getWalletNonce,
    linkWallet,
    unlinkWallet,
    setPrimaryWallet,
    getLinkedWallets,

    // Health
    checkHealth,

    // Waitlist (pre-launch)
    joinWaitlist: (email, intendedUse) => post('/v1/waitlist/join', { email, intendedUse }),
    getWaitlistCount: () => get('/v1/waitlist/count'),

    // Rivalry Mode
    createRivalry,
    getRivalries,
    getMyRivalries,
    getRivalryStats,
    getRivalry,
    acceptRivalry,
    declineRivalry,
    fundRivalry,
    getRivalryEvents,
    getRivalryMetrics,
    getRivalryShare,

    // Notifications
    getNotifications: () => get('/v1/notifications'),
    getNotificationCount: () => get('/v1/notifications/count'),
    markNotificationRead: (id) => post(`/v1/notifications/${id}/read`, null),
    markAllNotificationsRead: () => post('/v1/notifications/read-all', null),
};
