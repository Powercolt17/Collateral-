/**
 * Plaid Bank Income Adapter (HARDENED)
 *
 * Handles verification of INCOME RECEIVED via a user's connected bank account.
 *
 * ⚠️ WHAT THIS RAIL PROVES — READ BEFORE CHANGING ANY LABEL
 * Bank data proves MONEY ARRIVED IN AN ACCOUNT. It does NOT prove a sale was
 * made, a deal closed, or a commission was earned. A deposit is evidence of a
 * transfer, nothing more. Every metric, evidence key, and user-facing string in
 * this file therefore says INCOME or DEPOSITS — never "sales", "commission",
 * or "earnings". Keep it that way.
 *
 * INVARIANTS (NON-NEGOTIABLE):
 * - Fail-closed: missing data or API errors = verification failure
 * - Only INFLOWS (money received) count; outflows are never counted
 * - Only deposits belonging to the ONE frozen income stream count
 * - All money in USD cents (integers)
 * - Plaid Link required before any API calls
 * - Full pagination (no data loss)
 *
 * ANTI-GAMING:
 * - Baseline window ends strictly at execution_time (no overlap with verification)
 * - Minimum history + minimum deposit count enforced
 * - Stream identity frozen at baseline; settlement re-resolves the SAME stream
 * - Internal transfers between the user's own accounts are excluded
 * - Currency locked at snapshot time
 *
 * MEASUREMENT MODEL — measured by DEPOSIT DATE:
 * - We measure "income RECEIVED in the contract window", not "work done in the
 *   window that eventually paid". A deposit belongs to the window its DATE falls
 *   in. A deposit dated after the deadline belongs to the NEXT contract, never
 *   this one. Users absorb pay lag by setting the deadline to their own pay
 *   cadence.
 * - Windows are HALF-OPEN: [windowStart, windowEnd). A deposit therefore counts
 *   toward EXACTLY ONE contract window. No double-counting, ever.
 * - Settlement happens ONCE at deadline + graceDays (default 7). No re-check,
 *   no clawback.
 *
 * USER-FACING WORDING:
 * - Always "receive $X in income by [date]".
 * - Never "deals closed", "sales made", or "commission earned" — bank data
 *   cannot evidence any of those.
 */

import { createHash } from 'crypto';
import { db } from '../db/client.js';
import { connectedAccounts, type ConnectedAccount } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { CommerceError, CommerceErrorCode } from '../invariants/commerce-errors.js';
import type { CommerceAdapter, IncomeBaselineSnapshot, ShopifyConnectionValidation } from './shopify.js';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PLAID_API_VERSION = '2020-09-14';
export const PLAID_ALLOWED_CURRENCY = 'USD';

/** Contract window default (mirrors SHOPIFY_WINDOW_DAYS) */
export const PLAID_WINDOW_DAYS = 30;
export const PLAID_MIN_WINDOW_DAYS = 14;

/** History pulled for baseline: 6–12 months. We request 12 and require ≥6. */
export const PLAID_HISTORY_DAYS = 365;
export const PLAID_MIN_HISTORY_DAYS = 180;

/**
 * POSTING-LAG GRACE WINDOW
 *
 * Settlement runs ONCE at deadline + graceDays. This exists for exactly one
 * reason: to let a deposit that is DATED inside the contract window finish
 * posting at the bank before we read it.
 *
 * It does NOT cover pay lag. A deposit dated after the deadline belongs to the
 * NEXT contract window, never this one. Users absorb the "work now, paid later"
 * gap by setting the contract deadline to match their own pay cadence.
 *
 * Kept short deliberately: a long grace window would imply we count late-dated
 * pay, which we do not.
 */
export const PLAID_DEFAULT_GRACE_DAYS = 7;
export const PLAID_MIN_GRACE_DAYS = 3;
export const PLAID_MAX_GRACE_DAYS = 10;

/** Minimum baseline income to qualify ($100/mo, mirrors SHOPIFY_MIN_BASELINE_CENTS) */
export const PLAID_MIN_BASELINE_CENTS = 10000;

/** A stream must have at least this many deposits in history to be "recurring" */
export const PLAID_MIN_DEPOSITS_FOR_STREAM = 3;

/** Growth required over the user's OWN baseline (mirrors SHOPIFY_DELTA_FLOOR_PERCENTAGE) */
export const PLAID_DELTA_FLOOR_PERCENTAGE = 0.20;

export const PLAID_REQUEST_TIMEOUT_MS = 30000;
export const PLAID_MAX_PAGES = 100;

/** Required Plaid products/scopes for income verification */
export const PLAID_REQUIRED_PRODUCTS = ['transactions'];

/**
 * Descriptions that indicate a transfer between the user's own accounts rather
 * than income received from a third party. Excluded from every stream.
 */
/**
 * Tokens that carry no payer identity. Stripped before grouping so the same
 * payer collapses to one key regardless of per-deposit boilerplate.
 */
export const PLAID_NOISE_TOKENS = new Set([
    'DIRECT', 'DEP', 'DIRECTDEP', 'DD', 'ACH', 'DEPOSIT', 'DEPOSITS',
    'PPD', 'CCD', 'PAYMENT', 'PMT', 'TRN', 'REF', 'ID',
]);

export const PLAID_INTERNAL_TRANSFER_PATTERNS = [
    'TRANSFER FROM',
    'ONLINE TRANSFER',
    'INTERNAL TRANSFER',
    'MOBILE DEPOSIT',
    'ATM DEPOSIT',
    'CASH DEPOSIT',
    'ZELLE FROM',
    'VENMO CASHOUT',
];

// =============================================================================
// TYPES
// =============================================================================

export interface PlaidCredentials {
    accessToken: string;   // Plaid access_token (item-scoped)
    itemId: string;        // Plaid item_id
    accountId?: string;    // Optional: restrict to a single depository account
}

/**
 * A single INFLOW transaction (money received).
 * amountCents is ALWAYS POSITIVE here — sign normalisation happens in the client.
 */
export interface PlaidIncomeTransaction {
    transactionId: string;
    accountId: string;
    amountCents: number;      // positive = money received
    currency: string;
    date: string;             // ISO date the transaction is DATED (not posted)
    description: string;      // raw description / name
    merchantName: string | null;
    pending: boolean;
}

/** Cadence classification for a recurring deposit stream */
export type PlaidCadence = 'WEEKLY' | 'BIWEEKLY' | 'SEMIMONTHLY' | 'MONTHLY' | 'IRREGULAR';

/**
 * A candidate recurring income stream, surfaced to the user for SELECTION.
 * The user picks a stream from this list — they never type an exact name.
 */
export interface PlaidIncomeStream {
    streamId: string;            // stable hash — frozen into baselineJson
    label: string;               // human-readable, e.g. "ACME CORP PAYROLL"
    normalizedKey: string;       // matching key used to re-resolve at settlement
    payer: string | null;        // merchant/payer name when Plaid provides one
    cadence: PlaidCadence;
    depositCount: number;
    totalCents: number;
    medianDepositCents: number;
    averageDepositCents: number;
    firstDepositDate: string;
    lastDepositDate: string;
    accountIds: string[];
}

export interface PlaidIncomeSummary {
    totalCents: number;
    depositCount: number;
    windowStart: string;
    windowEnd: string;
    currency: string;
    pagesProcessed: number;
    lastTransactionId: string | null;
    transactions: PlaidIncomeTransaction[];
}

export interface PlaidConnectionValidation {
    valid: boolean;
    itemId: string;
    institutionName: string;
    currency: string;
    accountIds: string[];
    products: string[];
    productsHash: string;
    errorCode?: CommerceErrorCode;
    errorMessage?: string;
}

// =============================================================================
// CLIENT ABSTRACTION
// =============================================================================

export interface PlaidClient {
    /**
     * Create a short-lived link_token for Plaid Link.
     *
     * Link is an EMBEDDED modal with its own lifecycle (onSuccess/onExit), not an
     * OAuth redirect — so there is no popup and no polling. The browser never
     * leaves the page; Link hands back a public_token which is exchanged here.
     */
    createLinkToken(userId: string): Promise<{ linkToken: string; expiration: string }>;
    /** Exchange Link's public_token for the durable access_token. Server-side only. */
    exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }>;
    healthCheck(credentials: PlaidCredentials): Promise<{ ok: boolean; institution: string }>;
    validateConnection(credentials: PlaidCredentials): Promise<PlaidConnectionValidation>;
    /** Returns INFLOWS only, sign-normalised to positive cents. */
    getIncomeTransactions(
        credentials: PlaidCredentials,
        startDate: Date,
        endDate: Date
    ): Promise<PlaidIncomeSummary>;
}

// =============================================================================
// MOCK CLIENT (Tests/Dev)
// =============================================================================

export class MockPlaidClient implements PlaidClient {
    constructor(
        private monthlyIncomeCents: number = 400000, // $4,000/mo
        private payerLabel: string = 'ACME CORP PAYROLL',
        private fixedTransactions: PlaidIncomeTransaction[] | null = null
    ) { }

    async createLinkToken(_userId: string): Promise<{ linkToken: string; expiration: string }> {
        return {
            linkToken: 'link-sandbox-mock-token',
            expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
    }

    async exchangePublicToken(_publicToken: string): Promise<{ accessToken: string; itemId: string }> {
        return { accessToken: 'access-sandbox-mock', itemId: 'mock-item-id-12345' };
    }

    async healthCheck(_credentials: PlaidCredentials): Promise<{ ok: boolean; institution: string }> {
        return { ok: true, institution: 'Mock Bank' };
    }

    async validateConnection(_credentials: PlaidCredentials): Promise<PlaidConnectionValidation> {
        return {
            valid: true,
            itemId: 'mock-item-id-12345',
            institutionName: 'Mock Bank',
            currency: PLAID_ALLOWED_CURRENCY,
            accountIds: ['mock-account-1'],
            products: [...PLAID_REQUIRED_PRODUCTS],
            productsHash: createHash('sha256').update(PLAID_REQUIRED_PRODUCTS.join(',')).digest('hex').slice(0, 16),
        };
    }

    async getIncomeTransactions(
        _credentials: PlaidCredentials,
        startDate: Date,
        endDate: Date
    ): Promise<PlaidIncomeSummary> {
        const transactions = this.fixedTransactions ?? this.generateSemiMonthly(startDate, endDate);

        // Respect the requested window (callers rely on this for baseline vs. verification)
        const inWindow = transactions.filter(t => {
            const d = new Date(t.date).getTime();
            return d >= startDate.getTime() && d < endDate.getTime();
        });

        return {
            totalCents: inWindow.reduce((sum, t) => sum + t.amountCents, 0),
            depositCount: inWindow.length,
            windowStart: startDate.toISOString(),
            windowEnd: endDate.toISOString(),
            currency: PLAID_ALLOWED_CURRENCY,
            pagesProcessed: 1,
            lastTransactionId: inWindow.length > 0 ? inWindow[inWindow.length - 1].transactionId : null,
            transactions: inWindow,
        };
    }

    /** Deterministic semi-monthly deposits so tests are reproducible. */
    private generateSemiMonthly(startDate: Date, endDate: Date): PlaidIncomeTransaction[] {
        const out: PlaidIncomeTransaction[] = [];
        const perDeposit = Math.round(this.monthlyIncomeCents / 2);
        const cursor = new Date(startDate);
        let i = 0;

        while (cursor < endDate) {
            for (const day of [1, 15]) {
                const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), day));
                if (d < startDate || d >= endDate) continue;
                out.push({
                    transactionId: `mock-txn-${i++}`,
                    accountId: 'mock-account-1',
                    amountCents: perDeposit,
                    currency: PLAID_ALLOWED_CURRENCY,
                    date: d.toISOString().slice(0, 10),
                    description: `${this.payerLabel} DIRECT DEP 000${i}`,
                    merchantName: this.payerLabel,
                    pending: false,
                });
            }
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
        return out;
    }

    // Test helper
    setTransactions(txns: PlaidIncomeTransaction[]) {
        this.fixedTransactions = txns;
    }
}

// =============================================================================
// REAL CLIENT (Production)
// =============================================================================

export class RealPlaidClient implements PlaidClient {
    private clientId: string;
    private secret: string;
    private baseUrl: string;

    constructor() {
        // Secrets come from env only — never hard-coded, never logged.
        this.clientId = process.env.PLAID_CLIENT_ID || '';
        this.secret = process.env.PLAID_SECRET || '';
        const envName = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
        this.baseUrl = `https://${envName}.plaid.com`;
    }

    private assertConfigured(): void {
        if (!this.clientId || !this.secret) {
            throw new CommerceError(
                CommerceErrorCode.CREDENTIALS_INVALID,
                'Plaid credentials not configured (PLAID_CLIENT_ID / PLAID_SECRET)'
            );
        }
    }

    private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
        this.assertConfigured();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PLAID_REQUEST_TIMEOUT_MS);

        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'PLAID-CLIENT-ID': this.clientId,
                    'PLAID-SECRET': this.secret,
                    'Plaid-Version': PLAID_API_VERSION,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (res.status === 429) {
                throw new CommerceError(CommerceErrorCode.API_RATE_LIMIT, 'Plaid rate limit');
            }
            if (res.status === 401 || res.status === 403) {
                throw new CommerceError(CommerceErrorCode.AUTH_REVOKED, 'Plaid authorization revoked');
            }
            if (res.status >= 500) {
                throw new CommerceError(CommerceErrorCode.API_SERVER_ERROR, `Plaid server error ${res.status}`);
            }
            if (!res.ok) {
                throw new CommerceError(CommerceErrorCode.API_RESPONSE_INVALID, `Plaid error ${res.status}`);
            }

            return await res.json() as T;
        } catch (err) {
            if (err instanceof CommerceError) throw err;
            if ((err as Error).name === 'AbortError') {
                throw new CommerceError(CommerceErrorCode.API_TIMEOUT_TRANSIENT, 'Plaid request timed out');
            }
            throw new CommerceError(CommerceErrorCode.API_SERVER_ERROR, (err as Error).message);
        } finally {
            clearTimeout(timeout);
        }
    }

    async createLinkToken(userId: string): Promise<{ linkToken: string; expiration: string }> {
        const res = await this.post<{ link_token: string; expiration: string }>('/link/token/create', {
            user: { client_user_id: userId },
            client_name: 'Collateral',
            products: PLAID_REQUIRED_PRODUCTS,
            country_codes: ['US'],
            language: 'en',
        });
        return { linkToken: res.link_token, expiration: res.expiration };
    }

    async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
        const res = await this.post<{ access_token: string; item_id: string }>(
            '/item/public_token/exchange',
            { public_token: publicToken }
        );
        return { accessToken: res.access_token, itemId: res.item_id };
    }

    async healthCheck(credentials: PlaidCredentials): Promise<{ ok: boolean; institution: string }> {
        try {
            const validation = await this.validateConnection(credentials);
            return { ok: validation.valid, institution: validation.institutionName };
        } catch {
            return { ok: false, institution: '' };
        }
    }

    async validateConnection(credentials: PlaidCredentials): Promise<PlaidConnectionValidation> {
        const empty: PlaidConnectionValidation = {
            valid: false,
            itemId: '',
            institutionName: '',
            currency: '',
            accountIds: [],
            products: [],
            productsHash: '',
        };

        if (!credentials.accessToken) {
            return { ...empty, errorCode: CommerceErrorCode.CREDENTIALS_INVALID };
        }

        const accountsRes = await this.post<{
            accounts: { account_id: string; type: string; balances: { iso_currency_code: string | null } }[];
            item: { item_id: string; institution_id: string | null; products: string[] };
        }>('/accounts/get', { access_token: credentials.accessToken });

        // Only depository accounts can evidence income received
        const depository = accountsRes.accounts.filter(a => a.type === 'depository');
        if (depository.length === 0) {
            return { ...empty, errorCode: CommerceErrorCode.PROVIDER_NOT_CONNECTED, errorMessage: 'No depository account' };
        }

        const currency = depository[0].balances.iso_currency_code || PLAID_ALLOWED_CURRENCY;
        if (currency.toUpperCase() !== PLAID_ALLOWED_CURRENCY) {
            return { ...empty, errorCode: CommerceErrorCode.CURRENCY_UNSUPPORTED, errorMessage: `Currency ${currency}` };
        }

        const products = accountsRes.item.products || [];
        const missing = PLAID_REQUIRED_PRODUCTS.filter(p => !products.includes(p));
        if (missing.length > 0) {
            return { ...empty, errorCode: CommerceErrorCode.AUTH_SCOPE_MISSING, errorMessage: `Missing: ${missing.join(',')}` };
        }

        return {
            valid: true,
            itemId: accountsRes.item.item_id,
            institutionName: accountsRes.item.institution_id || 'Unknown institution',
            currency: currency.toUpperCase(),
            accountIds: depository.map(a => a.account_id),
            products,
            productsHash: createHash('sha256').update([...products].sort().join(',')).digest('hex').slice(0, 16),
        };
    }

    async getIncomeTransactions(
        credentials: PlaidCredentials,
        startDate: Date,
        endDate: Date
    ): Promise<PlaidIncomeSummary> {
        const transactions: PlaidIncomeTransaction[] = [];
        let offset = 0;
        let pagesProcessed = 0;
        let total: number | null = null;

        // Exclusive upper bound for half-open [start, end) attribution
        const endDateStr = endDate.toISOString().slice(0, 10);

        while (pagesProcessed < PLAID_MAX_PAGES) {
            const page = await this.post<{
                transactions: {
                    transaction_id: string;
                    account_id: string;
                    amount: number;
                    iso_currency_code: string | null;
                    date: string;
                    name: string;
                    merchant_name: string | null;
                    pending: boolean;
                }[];
                total_transactions: number;
            }>('/transactions/get', {
                access_token: credentials.accessToken,
                start_date: startDate.toISOString().slice(0, 10),
                end_date: endDate.toISOString().slice(0, 10),
                options: {
                    count: 500,
                    offset,
                    ...(credentials.accountId ? { account_ids: [credentials.accountId] } : {}),
                },
            });

            pagesProcessed++;
            total = page.total_transactions;

            for (const t of page.transactions) {
                // HALF-OPEN WINDOW [start, end): Plaid's end_date is INCLUSIVE, so a
                // deposit dated exactly on windowEnd would be returned here AND by the
                // next contract whose window starts that day. Dropping it enforces
                // exactly-one-window attribution — do not remove this.
                if (t.date >= endDateStr) continue;

                // PLAID SIGN CONVENTION: for depository accounts a POSITIVE amount
                // is money LEAVING the account. Inflows are NEGATIVE. We keep only
                // inflows and flip the sign so amountCents is positive = received.
                if (t.amount >= 0) continue;
                if (t.pending) continue; // pending deposits are not yet money received

                const currency = (t.iso_currency_code || PLAID_ALLOWED_CURRENCY).toUpperCase();
                if (currency !== PLAID_ALLOWED_CURRENCY) continue;

                transactions.push({
                    transactionId: t.transaction_id,
                    accountId: t.account_id,
                    amountCents: Math.round(Math.abs(t.amount) * 100),
                    currency,
                    date: t.date,
                    description: t.name,
                    merchantName: t.merchant_name,
                    pending: t.pending,
                });
            }

            offset += page.transactions.length;
            if (page.transactions.length === 0 || offset >= total) break;
        }

        // Fail closed if we could not read the full set
        if (total !== null && offset < total) {
            throw new CommerceError(
                CommerceErrorCode.API_INCOMPLETE_PAGINATION,
                `Plaid pagination incomplete: ${offset}/${total}`
            );
        }

        transactions.sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalCents: transactions.reduce((s, t) => s + t.amountCents, 0),
            depositCount: transactions.length,
            windowStart: startDate.toISOString(),
            windowEnd: endDate.toISOString(),
            currency: PLAID_ALLOWED_CURRENCY,
            pagesProcessed,
            lastTransactionId: transactions.length > 0 ? transactions[transactions.length - 1].transactionId : null,
            transactions,
        };
    }
}

// =============================================================================
// CLIENT SINGLETON
// =============================================================================

let plaidClientInstance: PlaidClient | null = null;

export function getPlaidClient(): PlaidClient {
    if (plaidClientInstance) {
        return plaidClientInstance;
    }

    const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
    const useMock = process.env.USE_MOCK_PLAID === 'true';

    if (isTest || useMock) {
        console.log('[Plaid Client] Using MockPlaidClient');
        plaidClientInstance = new MockPlaidClient();
        return plaidClientInstance;
    }

    console.log('[Plaid Client] Using RealPlaidClient');
    plaidClientInstance = new RealPlaidClient();
    return plaidClientInstance;
}

export function setPlaidClient(client: PlaidClient) {
    plaidClientInstance = client;
}

export function resetPlaidClient() {
    plaidClientInstance = null;
}

// =============================================================================
// TOKEN RESOLUTION
// =============================================================================

/**
 * Resolve the Plaid access token from a connected account.
 * Mirrors the Shopify/Amazon resolution order.
 */
function resolveCredentials(account: ConnectedAccount): PlaidCredentials {
    const meta = (account.metadataJson as Record<string, any> | null) || {};
    return {
        accessToken: account.accessTokenEnc || meta.accessToken || '',
        itemId: account.externalAccountId,
        accountId: meta.accountId,
    };
}

// =============================================================================
// CONNECTED ACCOUNT HELPERS
// =============================================================================

export async function getPlaidConnectedAccount(userId: string): Promise<ConnectedAccount | null> {
    const [account] = await db
        .select()
        .from(connectedAccounts)
        .where(
            and(
                eq(connectedAccounts.userId, userId),
                eq(connectedAccounts.platform, 'PLAID'),
                eq(connectedAccounts.status, 'ACTIVE')
            )
        )
        .limit(1);

    return account || null;
}

export async function getVerifiedPlaidAccount(userId: string): Promise<ConnectedAccount | null> {
    const account = await getPlaidConnectedAccount(userId);
    if (!account) return null;
    if (account.verificationStatus !== 'VERIFIED') return null;
    return account;
}

// =============================================================================
// STREAM DETECTION (recurring income identification)
// =============================================================================

/**
 * Normalise a bank description into a stable matching key.
 *
 * Bank descriptions carry per-deposit noise (dates, sequence numbers, trace IDs)
 * that would otherwise split one real stream into many. We strip that noise so
 * the SAME employer/payer collapses to one key across months — which is what
 * lets us re-resolve the identical stream at settlement.
 */
export function normalizeDescription(description: string): string {
    return description
        .toUpperCase()
        .replace(/\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b/g, ' ')  // embedded dates
        .split(/[^A-Z0-9]+/)                   // tokenize on non-alphanumeric
        .filter(t => t.length > 0)
        // Drop ANY token containing a digit — not merely pure-digit runs. Stripe's
        // per-payout reference is alphanumeric (ST-A1B2C3D4E5); stripping only the
        // digits left "ST A B C D E", which differed on every payout and split one
        // real stream into four. A fragmented stream yields a baseline built from a
        // fraction of the user's income, so this filter is load-bearing.
        .filter(t => !/[0-9]/.test(t))
        .filter(t => !/^X+$/.test(t))          // masked account tokens (XXXX)
        .filter(t => !PLAID_NOISE_TOKENS.has(t))
        .join(' ')
        .trim();
}

/**
 * Grouping basis for a deposit.
 *
 * Prefer merchantName when Plaid enriches it — it is stable across the per-payout
 * reference noise that fragments raw descriptors. The M:/D: prefixes stop a
 * merchant name from colliding with a description-derived key.
 *
 * KNOWN v1 BEHAVIOUR: two businesses paid through one processor share a merchant
 * name and therefore MERGE into a single stream. Acceptable because the user
 * explicitly selects their stream; asserted in tests so it stays a known
 * behaviour rather than a surprise.
 */
export function streamGroupingBasis(description: string, merchantName: string | null): string {
    const m = merchantName?.trim();
    if (m) return `M:${m.toUpperCase()}`;
    return `D:${normalizeDescription(description)}`;
}

/** True if this looks like the user moving their own money, not income received. */
export function isInternalTransfer(description: string): boolean {
    const upper = description.toUpperCase();
    return PLAID_INTERNAL_TRANSFER_PATTERNS.some(p => upper.includes(p));
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Classify cadence from the median gap between consecutive deposits. */
export function classifyCadence(dates: string[]): PlaidCadence {
    if (dates.length < 2) return 'IRREGULAR';

    const sorted = [...dates].sort();
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const days = Math.round(
            (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
        );
        if (days > 0) gaps.push(days);
    }
    if (gaps.length === 0) return 'IRREGULAR';

    const m = median(gaps);
    if (m >= 5 && m <= 9) return 'WEEKLY';

    if (m >= 12 && m <= 17) {
        // Biweekly (every 14 days) and semi-monthly (e.g. the 1st and 15th) have
        // nearly identical median gaps, so the gap alone cannot separate them.
        // The real difference: semi-monthly always lands on the same couple of
        // days each month, while biweekly drifts across the whole month.
        const daysOfMonth = new Set(sorted.map(d => new Date(d).getUTCDate()));
        return daysOfMonth.size <= 6 ? 'SEMIMONTHLY' : 'BIWEEKLY';
    }

    if (m >= 26 && m <= 35) return 'MONTHLY';
    return 'IRREGULAR';
}

/** Stable stream id — must be reproducible so settlement resolves the same stream. */
export function computeStreamId(groupingBasis: string): string {
    return createHash('sha256').update(groupingBasis).digest('hex').slice(0, 16);
}

/**
 * Group inflows into candidate recurring income streams.
 *
 * The user SELECTS one of these rather than typing a name: we match on
 * normalized description, payer, cadence, and amount.
 */
export function detectIncomeStreams(transactions: PlaidIncomeTransaction[]): PlaidIncomeStream[] {
    const groups = new Map<string, PlaidIncomeTransaction[]>();

    for (const txn of transactions) {
        if (isInternalTransfer(txn.description)) continue;

        const basis = streamGroupingBasis(txn.description, txn.merchantName);
        if (basis === 'D:') continue;   // nothing identifying survived normalisation

        const key = computeStreamId(basis);
        const existing = groups.get(key);
        if (existing) existing.push(txn);
        else groups.set(key, [txn]);
    }

    const streams: PlaidIncomeStream[] = [];

    for (const [streamId, txns] of groups) {
        if (txns.length < PLAID_MIN_DEPOSITS_FOR_STREAM) continue;

        const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
        const amounts = sorted.map(t => t.amountCents);
        const totalCents = amounts.reduce((s, a) => s + a, 0);
        const normalizedKey = normalizeDescription(sorted[0].description);

        streams.push({
            streamId,
            label: sorted[0].merchantName || normalizedKey,
            normalizedKey,
            payer: sorted[0].merchantName,
            cadence: classifyCadence(sorted.map(t => t.date)),
            depositCount: sorted.length,
            totalCents,
            medianDepositCents: median(amounts),
            averageDepositCents: Math.round(totalCents / sorted.length),
            firstDepositDate: sorted[0].date,
            lastDepositDate: sorted[sorted.length - 1].date,
            accountIds: [...new Set(sorted.map(t => t.accountId))],
        });
    }

    // Largest streams first — the user's primary income is nearly always on top
    return streams.sort((a, b) => b.totalCents - a.totalCents);
}

/** Filter a transaction set down to the ONE frozen stream. */
export function filterToStream(
    transactions: PlaidIncomeTransaction[],
    streamId: string
): PlaidIncomeTransaction[] {
    return transactions.filter(txn => {
        if (isInternalTransfer(txn.description)) return false;
        const basis = streamGroupingBasis(txn.description, txn.merchantName);
        if (basis === 'D:') return false;
        return computeStreamId(basis) === streamId;
    });
}

// =============================================================================
// PERSONALIZED BASELINE
// =============================================================================

/**
 * Compute the user's PERSONAL baseline income for one stream.
 *
 * Method: median of that stream's per-calendar-month totals, scaled to the
 * contract window. Median (not mean) so one unusually large or missing month
 * cannot move the number much.
 *
 * The result is specific to this user's own history — it is never a flat
 * dollar amount shared across users.
 */
export function computePersonalBaseline(
    streamTransactions: PlaidIncomeTransaction[],
    windowDays: number
): { baselineCents: number; monthlyMedianCents: number; trailingAvgCents: number; monthsOfHistory: number } {
    if (streamTransactions.length === 0) {
        return { baselineCents: 0, monthlyMedianCents: 0, trailingAvgCents: 0, monthsOfHistory: 0 };
    }

    const byMonth = new Map<string, number>();
    for (const txn of streamTransactions) {
        const monthKey = txn.date.slice(0, 7); // YYYY-MM
        byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + txn.amountCents);
    }

    const monthlyTotals = [...byMonth.values()];
    const monthsOfHistory = monthlyTotals.length;
    const monthlyMedianCents = median(monthlyTotals);
    const trailingAvgCents = Math.round(
        monthlyTotals.reduce((s, v) => s + v, 0) / monthsOfHistory
    );

    // Scale the monthly figure to the contract window length
    const baselineCents = Math.round(monthlyMedianCents * (windowDays / 30));

    return { baselineCents, monthlyMedianCents, trailingAvgCents, monthsOfHistory };
}

/**
 * Threshold as a PERCENTAGE OF THE USER'S OWN BASELINE.
 * e.g. baseline × 1.20 → delta = baseline × 0.20
 */
export function calculatePlaidDeltaFloor(
    baselineCents: number,
    tierPercentage: number = PLAID_DELTA_FLOOR_PERCENTAGE
): number {
    return Math.floor(baselineCents * tierPercentage);
}

/**
 * Clamp a requested posting-lag grace window into the supported range (3–10).
 * Missing/NaN falls back to the 7-day default — never to 0.
 */
export function resolveGraceDays(requested?: number): number {
    if (requested === undefined || Number.isNaN(requested)) return PLAID_DEFAULT_GRACE_DAYS;
    return Math.min(PLAID_MAX_GRACE_DAYS, Math.max(PLAID_MIN_GRACE_DAYS, Math.floor(requested)));
}

/**
 * The single settlement date for an income contract: deadline + posting-lag grace.
 *
 * This delays only WHEN we read the bank. It does NOT extend the measured
 * window — deposits dated after the deadline still belong to the next contract.
 * Settle ONCE. No re-check, no clawback.
 */
export function computeSettlementDate(deadlineUtc: Date, graceDays?: number): Date {
    const settleAt = new Date(deadlineUtc);
    settleAt.setUTCDate(settleAt.getUTCDate() + resolveGraceDays(graceDays));
    return settleAt;
}

// =============================================================================
// STREAM DISCOVERY (called by the connect/selection route)
// =============================================================================

/**
 * Pull 6–12 months of history and return the candidate recurring income streams
 * for the user to choose from. This is the SELECTION step — the user picks one,
 * and that choice is frozen into the baseline.
 */
export async function listIncomeStreams(
    userId: string,
    historyDays: number = PLAID_HISTORY_DAYS,
    now?: Date
): Promise<{ streams: PlaidIncomeStream[]; historyStart: string; historyEnd: string }> {
    const account = await getVerifiedPlaidAccount(userId);
    if (!account) {
        throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
    }

    const credentials = resolveCredentials(account);
    if (!credentials.accessToken) {
        throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
    }

    const historyEnd = now || new Date();
    const historyStart = new Date(historyEnd.getTime() - historyDays * 86400000);

    const client = getPlaidClient();
    const summary = await client.getIncomeTransactions(credentials, historyStart, historyEnd);

    return {
        streams: detectIncomeStreams(summary.transactions),
        historyStart: historyStart.toISOString(),
        historyEnd: historyEnd.toISOString(),
    };
}

/**
 * Fetch the deposits belonging to the user's SELECTED income stream, plus the
 * cadence and last deposit date needed to auto-suggest a deadline.
 *
 * Used at contract creation to derive terms SERVER-SIDE from the user's own
 * history. Client input is never trusted for targets, multipliers, or payouts.
 */
export async function getSelectedStreamDeposits(
    userId: string,
    historyDays: number = PLAID_HISTORY_DAYS,
    now?: Date
): Promise<{
    streamId: string;
    cadence: PlaidCadence;
    lastDepositDate: string;
    deposits: { date: string; amountCents: number }[];
}> {
    const account = await getVerifiedPlaidAccount(userId);
    if (!account) {
        throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
    }

    const credentials = resolveCredentials(account);
    if (!credentials.accessToken) {
        throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
    }

    const meta = (account.metadataJson as Record<string, any> | null) || {};
    const selectedStreamId: string | undefined = meta.selectedStreamId;
    if (!selectedStreamId) {
        throw new CommerceError(
            CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
            'No income stream selected. The user must select which recurring deposit stream to verify.'
        );
    }

    const historyEnd = now || new Date();
    const historyStart = new Date(historyEnd.getTime() - historyDays * 86400000);

    const client = getPlaidClient();
    const summary = await client.getIncomeTransactions(credentials, historyStart, historyEnd);

    const streamTxns = filterToStream(summary.transactions, selectedStreamId);
    if (streamTxns.length < PLAID_MIN_DEPOSITS_FOR_STREAM) {
        throw new CommerceError(
            CommerceErrorCode.WINDOW_HISTORY_INSUFFICIENT,
            `Selected income stream has only ${streamTxns.length} deposits. ` +
            `Minimum required: ${PLAID_MIN_DEPOSITS_FOR_STREAM}`
        );
    }

    const sorted = [...streamTxns].sort((a, b) => a.date.localeCompare(b.date));
    const detected = detectIncomeStreams(summary.transactions)
        .find(s => s.streamId === selectedStreamId);

    return {
        streamId: selectedStreamId,
        cadence: detected?.cadence ?? 'IRREGULAR',
        lastDepositDate: sorted[sorted.length - 1].date,
        deposits: sorted.map(t => ({ date: t.date, amountCents: t.amountCents })),
    };
}

/**
 * Read the frozen stream id for a contract out of its baseline JSON.
 * Decision: streamId lives in baselineJson — there is no dedicated column.
 */
export function getFrozenStreamId(baselineJson: unknown): string | null {
    const b = baselineJson as { streamId?: string } | null;
    return b?.streamId || null;
}

// =============================================================================
// PLAID INCOME ADAPTER
// =============================================================================

export const plaidIncomeAdapter: CommerceAdapter = {
    platform: 'PLAID',

    async healthCheck(userId: string) {
        const account = await getPlaidConnectedAccount(userId);
        if (!account) return { ok: false };

        const credentials = resolveCredentials(account);
        if (!credentials.accessToken) return { ok: false };

        const client = getPlaidClient();
        const result = await client.healthCheck(credentials);
        return { ok: result.ok, shop: result.institution };
    },

    async validateConnection(userId: string): Promise<ShopifyConnectionValidation> {
        const account = await getPlaidConnectedAccount(userId);
        if (!account) {
            return {
                valid: false,
                shopId: '',
                shopDomain: '',
                shopName: '',
                currency: '',
                timezone: '',
                scopes: [],
                scopesHash: '',
                errorCode: CommerceErrorCode.PROVIDER_NOT_CONNECTED,
            };
        }

        const credentials = resolveCredentials(account);
        if (!credentials.accessToken) {
            return {
                valid: false,
                shopId: account.externalAccountId,
                shopDomain: '',
                shopName: '',
                currency: '',
                timezone: '',
                scopes: [],
                scopesHash: '',
                errorCode: CommerceErrorCode.CREDENTIALS_INVALID,
            };
        }

        const client = getPlaidClient();
        const validation = await client.validateConnection(credentials);

        // Map onto the shared connection-validation shape used by the engine
        return {
            valid: validation.valid,
            shopId: validation.itemId,
            shopDomain: validation.institutionName,
            shopName: validation.institutionName,
            currency: validation.currency,
            timezone: 'UTC',
            scopes: validation.products,
            scopesHash: validation.productsHash,
            errorCode: validation.errorCode,
            errorMessage: validation.errorMessage,
        };
    },

    /**
     * Snapshot the user's PERSONAL income baseline.
     *
     * - Pulls 6–12 months of history
     * - Uses the stream the user SELECTED (frozen via metadataJson.selectedStreamId)
     * - Baseline = median monthly income for that stream, scaled to the window
     *
     * HARDENING (mirrors Shopify):
     * - window ends strictly at executionTime (no overlap with verification)
     * - minimum window, minimum history, and minimum baseline enforced
     * - all inputs hashed for reproducibility
     */
    async snapshotBaseline(
        userId: string,
        windowDays: number = PLAID_WINDOW_DAYS,
        executionTime?: Date
    ): Promise<IncomeBaselineSnapshot> {
        if (windowDays < PLAID_MIN_WINDOW_DAYS) {
            throw new CommerceError(
                CommerceErrorCode.BASELINE_WINDOW_TOO_SHORT,
                `Baseline window must be at least ${PLAID_MIN_WINDOW_DAYS} days. Got: ${windowDays}`
            );
        }

        const account = await getVerifiedPlaidAccount(userId);
        if (!account) {
            throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
        }

        const credentials = resolveCredentials(account);
        if (!credentials.accessToken) {
            throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
        }

        const meta = (account.metadataJson as Record<string, any> | null) || {};
        const selectedStreamId: string | undefined = meta.selectedStreamId;
        if (!selectedStreamId) {
            throw new CommerceError(
                CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
                'No income stream selected. The user must select which recurring deposit stream to verify.'
            );
        }

        // ANTI-GAMING: history window ends at execution time (strictly before)
        const windowEnd = executionTime || new Date();
        const windowStart = new Date(windowEnd.getTime() - PLAID_HISTORY_DAYS * 86400000);

        const client = getPlaidClient();
        const summary = await client.getIncomeTransactions(credentials, windowStart, windowEnd);

        const streamTxns = filterToStream(summary.transactions, selectedStreamId);
        if (streamTxns.length < PLAID_MIN_DEPOSITS_FOR_STREAM) {
            throw new CommerceError(
                CommerceErrorCode.WINDOW_HISTORY_INSUFFICIENT,
                `Selected income stream has only ${streamTxns.length} deposits. ` +
                `Minimum required: ${PLAID_MIN_DEPOSITS_FOR_STREAM}`
            );
        }

        const baseline = computePersonalBaseline(streamTxns, windowDays);

        // Require enough real history for the median to mean anything
        const observedDays = Math.round(
            (new Date(streamTxns[streamTxns.length - 1].date).getTime() -
                new Date(streamTxns[0].date).getTime()) / 86400000
        );
        if (observedDays < PLAID_MIN_HISTORY_DAYS) {
            throw new CommerceError(
                CommerceErrorCode.WINDOW_HISTORY_INSUFFICIENT,
                `Income history too short: ${observedDays} days. ` +
                `Minimum required: ${PLAID_MIN_HISTORY_DAYS} days.`
            );
        }

        if (baseline.baselineCents < PLAID_MIN_BASELINE_CENTS) {
            throw new CommerceError(
                CommerceErrorCode.BASELINE_TOO_LOW,
                `Baseline income too low: $${(baseline.baselineCents / 100).toFixed(2)}. ` +
                `Minimum required: $${(PLAID_MIN_BASELINE_CENTS / 100).toFixed(2)}`
            );
        }

        const streams = detectIncomeStreams(summary.transactions);
        const selected = streams.find(s => s.streamId === selectedStreamId);

        const dataHash = createHash('sha256')
            .update(JSON.stringify({
                windowStart: summary.windowStart,
                windowEnd: summary.windowEnd,
                streamId: selectedStreamId,
                netCents: baseline.baselineCents,
                depositCount: streamTxns.length,
                lastTransactionId: summary.lastTransactionId,
            }))
            .digest('hex')
            .slice(0, 16);

        return {
            snapshotAt: new Date().toISOString(),
            provider: 'plaid',
            windowStart: summary.windowStart,
            windowEnd: summary.windowEnd,

            // Verified INCOME RECEIVED — not sales, not commission
            netCents: baseline.baselineCents,
            apiVersion: PLAID_API_VERSION,
            dataHash,

            // Income-stream evidence (frozen — settlement re-resolves this stream)
            streamId: selectedStreamId,
            streamLabel: selected?.label || 'Selected income stream',
            depositCount: streamTxns.length,
            cadence: selected?.cadence || 'IRREGULAR',
            medianDepositCents: selected?.medianDepositCents ?? 0,
            trailingAvgCents: baseline.trailingAvgCents,
            monthsOfHistory: baseline.monthsOfHistory,
            graceDays: resolveGraceDays(meta.graceDays),

            currencyFilter: PLAID_ALLOWED_CURRENCY,
            lastOrderId: summary.lastTransactionId,
            pagesProcessed: summary.pagesProcessed,
        };
    },

    /**
     * Evaluate INCOME RECEIVED in the contract window.
     *
     * Counts deposits DATED inside the HALF-OPEN window [windowStart, windowEnd)
     * for the frozen stream, so each deposit counts toward exactly one contract.
     *
     * Settlement runs at deadline + graceDays, which lets a deposit dated inside
     * the window finish posting before we read it. A deposit dated AFTER the
     * deadline is not counted here — it belongs to the next contract window.
     *
     * Settles once; nothing is re-checked or clawed back.
     */
    async evaluate(
        userId: string,
        baselineIncomeCents: number,
        targetDeltaCents: number,
        windowStart: Date,
        windowEnd: Date
    ) {
        const account = await getVerifiedPlaidAccount(userId);
        if (!account) {
            throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
        }

        const credentials = resolveCredentials(account);
        if (!credentials.accessToken) {
            throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
        }

        const meta = (account.metadataJson as Record<string, any> | null) || {};
        const streamId: string | undefined = meta.selectedStreamId;
        if (!streamId) {
            throw new CommerceError(
                CommerceErrorCode.DATA_AMBIGUOUS_FAIL_CLOSED,
                'No frozen income stream for this contract'
            );
        }

        const client = getPlaidClient();
        const summary = await client.getIncomeTransactions(credentials, windowStart, windowEnd);

        const streamTxns = filterToStream(summary.transactions, streamId);
        const observedIncomeCents = streamTxns.reduce((s, t) => s + t.amountCents, 0);

        const targetTotalCents = baselineIncomeCents + targetDeltaCents;
        const pass = observedIncomeCents >= targetTotalCents;

        return {
            pass,
            // Engine-level field name is shared across sources; for this rail it
            // carries INCOME RECEIVED (deposits), not sales.
            currentRevenueCents: observedIncomeCents,
            deltaCents: observedIncomeCents - baselineIncomeCents,
            targetDeltaCents,
            evidence: {
                source: 'PLAID',
                metric: 'NET_INCOME_DEPOSITS',
                verifies: 'income_received',
                measuredAtUtc: new Date().toISOString(),
                windowStartUtc: windowStart.toISOString(),
                windowEndUtc: windowEnd.toISOString(),
                frozenStreamId: streamId,
                observedIncomeCents,
                baselineIncomeCents,
                targetDeltaCents,
                targetTotalCents,
                depositCount: streamTxns.length,
                depositIds: streamTxns.map(t => t.transactionId),
                currency: PLAID_ALLOWED_CURRENCY,
                pagesProcessed: summary.pagesProcessed,
                passCalculation: {
                    observed: observedIncomeCents,
                    baseline: baselineIncomeCents,
                    delta: targetDeltaCents,
                    target: targetTotalCents,
                    result: pass ? 'PASS' : 'FAIL',
                },
            },
        };
    },
};
