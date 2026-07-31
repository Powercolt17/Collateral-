/**
 * Shopify Revenue Adapter (HARDENED)
 * 
 * Handles Shopify store revenue verification via Admin API.
 * 
 * INVARIANTS (NON-NEGOTIABLE):
 * - Fail-closed: Missing data or API errors = verification failure
 * - Only net revenue counts (gross - discounts - refunds)
 * - Only PAID orders with cancelled_at = null qualify
 * - All money in USD cents
 * - OAuth required before any API calls
 * - Full cursor-based pagination (no data loss)
 * - Provider identity validated at connect time
 * 
 * ANTI-GAMING:
 * - Baseline window ends strictly at execution_time (no overlap)
 * - Minimum baseline window enforced (14 days)
 * - Minimum baseline amount required per tier
 * - Currency locked at snapshot time
 */

import { createHash } from 'crypto';
import { db } from '../db/client.js';
import { connectedAccounts, type ConnectedAccount } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { CommerceError, CommerceErrorCode, fromAdapterError } from '../invariants/commerce-errors.js';

// =============================================================================
// CONSTANTS
// =============================================================================

export const SHOPIFY_API_VERSION = '2024-01';
export const SHOPIFY_ALLOWED_FINANCIAL_STATUS = ['paid', 'partially_paid'];
export const SHOPIFY_WINDOW_DAYS = 30;
export const SHOPIFY_MIN_WINDOW_DAYS = 14;
export const SHOPIFY_MIN_BASELINE_CENTS = 10000; // $100 minimum baseline
export const SHOPIFY_DELTA_FLOOR_PERCENTAGE = 0.15; // 15% growth required
export const SHOPIFY_REQUEST_TIMEOUT_MS = 30000;
export const SHOPIFY_MAX_PAGES = 100; // Safety limit for pagination

/** Required scopes for revenue verification */
export const SHOPIFY_REQUIRED_SCOPES = ['read_orders'];

// =============================================================================
// ERROR TYPES (Legacy - use CommerceError going forward)
// =============================================================================

export class ShopifyAdapterError extends Error {
    constructor(
        message: string,
        public readonly retryable: boolean,
        public readonly category: 'RATE_LIMIT' | 'AUTH' | 'API' | 'CONFIG' | 'ELIGIBILITY',
        public readonly code?: string
    ) {
        super(message);
        this.name = 'ShopifyAdapterError';
    }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ShopifyCredentials {
    shopDomain: string;      // e.g., "my-store.myshopify.com"
    accessToken: string;     // OAuth access token
}

export interface ShopifyOrder {
    id: number;
    financialStatus: string;
    fulfillmentStatus: string | null;
    cancelledAt: string | null;
    totalPriceCents: number;
    subtotalPriceCents: number;
    totalDiscountsCents: number;
    totalTaxCents: number;
    totalShippingCents: number;
    refundedAmountCents: number;
    currency: string;
    createdAt: string;
    processedAt: string | null;
}

export interface ShopifyRevenueSummary {
    grossRevenueCents: number;
    discountsCents: number;
    taxCents: number;
    shippingCents: number;
    refundedCents: number;
    netRevenueCents: number;
    orderCount: number;
    fulfilledOrderCount: number;
    windowStart: string;
    windowEnd: string;
    lastOrderId: string | null;
    pagesProcessed: number;
    currency: string;
}

export interface ShopifyConnectionValidation {
    valid: boolean;
    shopId: string;
    shopDomain: string;
    shopName: string;
    currency: string;
    timezone: string;
    scopes: string[];
    scopesHash: string;
    errorCode?: CommerceErrorCode;
    errorMessage?: string;
}

export interface ShopifyBaselineSnapshot {
    snapshotAt: string;
    provider: 'shopify';
    storeRef: string;
    windowStart: string;
    windowEnd: string;
    // Breakdown totals (all in cents)
    grossCents: number;
    discountsCents: number;
    refundsCents: number;
    shippingCents: number;
    taxCents: number;
    netCents: number;
    // Verification metadata
    orderCount: number;
    fulfilledOrderCount: number;
    lastOrderId: string | null;
    pagesProcessed: number;
    // Filters used (for reproducibility)
    financialStatusFilter: string[];
    currencyFilter: string;
    apiVersion: string;
    dataHash: string;
}

// =============================================================================
// CLIENT ABSTRACTION
// =============================================================================

export interface ShopifyClient {
    healthCheck(credentials: ShopifyCredentials): Promise<{ ok: boolean; shop: string }>;
    validateConnection(credentials: ShopifyCredentials): Promise<ShopifyConnectionValidation>;
    getOrders(credentials: ShopifyCredentials, startDate: Date, endDate: Date): Promise<ShopifyOrder[]>;
    getRevenueSummary(credentials: ShopifyCredentials, startDate: Date, endDate: Date): Promise<ShopifyRevenueSummary>;
}

// =============================================================================
// MOCK CLIENT (Tests/Dev)
// =============================================================================

export class MockShopifyClient implements ShopifyClient {
    constructor(
        private fixedRevenueCents: number = 500000, // $5,000
        private fixedOrderCount: number = 50
    ) { }

    async healthCheck(_credentials: ShopifyCredentials): Promise<{ ok: boolean; shop: string }> {
        return { ok: true, shop: 'mock-store.myshopify.com' };
    }

    async validateConnection(_credentials: ShopifyCredentials): Promise<ShopifyConnectionValidation> {
        return {
            valid: true,
            shopId: 'mock-shop-id-12345',
            shopDomain: 'mock-store.myshopify.com',
            shopName: 'Mock Store',
            currency: 'USD',
            timezone: 'America/New_York',
            scopes: ['read_orders'],
            scopesHash: createHash('sha256').update('read_orders').digest('hex').slice(0, 16),
        };
    }

    async getOrders(_credentials: ShopifyCredentials, _startDate: Date, _endDate: Date): Promise<ShopifyOrder[]> {
        return [];
    }

    async getRevenueSummary(_credentials: ShopifyCredentials, startDate: Date, endDate: Date): Promise<ShopifyRevenueSummary> {
        return {
            grossRevenueCents: this.fixedRevenueCents,
            discountsCents: 0,
            taxCents: 0,
            shippingCents: 0,
            refundedCents: 0,
            netRevenueCents: this.fixedRevenueCents,
            orderCount: this.fixedOrderCount,
            fulfilledOrderCount: this.fixedOrderCount,
            windowStart: startDate.toISOString(),
            windowEnd: endDate.toISOString(),
            lastOrderId: null,
            pagesProcessed: 1,
            currency: 'USD',
        };
    }
}

// =============================================================================
// REAL SHOPIFY CLIENT (Production - HARDENED)
// =============================================================================

export class RealShopifyClient implements ShopifyClient {
    private apiVersion = SHOPIFY_API_VERSION;

    /**
     * Make authenticated request to Shopify Admin API
     * CRITICAL: No secrets in error messages
     */
    private async request<T>(
        credentials: ShopifyCredentials,
        endpoint: string,
        params?: Record<string, string>
    ): Promise<{ data: T; linkHeader: string | null }> {
        const url = new URL(`https://${credentials.shopDomain}/admin/api/${this.apiVersion}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SHOPIFY_REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'X-Shopify-Access-Token': credentials.accessToken,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
                throw new CommerceError(CommerceErrorCode.API_RATE_LIMIT);
            }

            if (response.status === 401 || response.status === 403) {
                throw new CommerceError(CommerceErrorCode.AUTH_REVOKED);
            }

            if (response.status >= 500) {
                throw new CommerceError(CommerceErrorCode.API_SERVER_ERROR);
            }

            if (!response.ok) {
                throw new CommerceError(
                    CommerceErrorCode.API_RESPONSE_INVALID,
                    `Shopify API error (${response.status})`
                );
            }

            const data = await response.json() as T;
            const linkHeader = response.headers.get('Link');

            return { data, linkHeader };
        } catch (err) {
            clearTimeout(timeoutId);

            if (err instanceof CommerceError) throw err;

            if (err instanceof Error && err.name === 'AbortError') {
                throw new CommerceError(CommerceErrorCode.API_TIMEOUT_TRANSIENT);
            }

            throw fromAdapterError(err instanceof Error ? err : new Error(String(err)), 'shopify');
        }
    }

    /**
     * Parse Link header for cursor-based pagination
     */
    private parseLinkHeader(linkHeader: string | null): { next: string | null; prev: string | null } {
        if (!linkHeader) {
            return { next: null, prev: null };
        }

        const links: { next: string | null; prev: string | null } = { next: null, prev: null };

        const parts = linkHeader.split(',');
        for (const part of parts) {
            const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
            if (match) {
                const [, url, rel] = match;
                if (rel === 'next') {
                    // Extract page_info from URL
                    const urlObj = new URL(url);
                    links.next = urlObj.searchParams.get('page_info');
                } else if (rel === 'previous') {
                    const urlObj = new URL(url);
                    links.prev = urlObj.searchParams.get('page_info');
                }
            }
        }

        return links;
    }

    async healthCheck(credentials: ShopifyCredentials): Promise<{ ok: boolean; shop: string }> {
        interface ShopResponse {
            shop: { name: string; domain: string };
        }

        try {
            const { data } = await this.request<ShopResponse>(credentials, '/shop.json');
            return { ok: true, shop: data.shop.domain };
        } catch (err) {
            if (err instanceof CommerceError) throw err;
            return { ok: false, shop: '' };
        }
    }

    /**
     * Validate connection with full scope and identity check
     * CRITICAL: Called at connect time to ensure required scopes
     */
    async validateConnection(credentials: ShopifyCredentials): Promise<ShopifyConnectionValidation> {
        interface ShopResponse {
            shop: {
                id: number;
                name: string;
                domain: string;
                primary_domain: { host: string };
                currency: string;
                timezone: string;
            };
        }

        try {
            const { data } = await this.request<ShopResponse>(credentials, '/shop.json');

            // Get access scopes
            interface AccessScopesResponse {
                access_scopes: Array<{ handle: string }>;
            }

            const { data: scopesData } = await this.request<AccessScopesResponse>(
                credentials,
                '/access_scopes.json'
            );

            const scopes = scopesData.access_scopes.map(s => s.handle);
            const scopesHash = createHash('sha256')
                .update(scopes.sort().join(','))
                .digest('hex')
                .slice(0, 16);

            // Validate required scopes
            const missingScopes = SHOPIFY_REQUIRED_SCOPES.filter(s => !scopes.includes(s));
            if (missingScopes.length > 0) {
                return {
                    valid: false,
                    shopId: String(data.shop.id),
                    shopDomain: data.shop.domain,
                    shopName: data.shop.name,
                    currency: data.shop.currency,
                    timezone: data.shop.timezone,
                    scopes,
                    scopesHash,
                    errorCode: CommerceErrorCode.AUTH_SCOPE_MISSING,
                    errorMessage: `Missing required scopes: ${missingScopes.join(', ')}`,
                };
            }

            return {
                valid: true,
                shopId: String(data.shop.id),
                shopDomain: data.shop.domain,
                shopName: data.shop.name,
                currency: data.shop.currency,
                timezone: data.shop.timezone,
                scopes,
                scopesHash,
            };
        } catch (err) {
            if (err instanceof CommerceError) {
                return {
                    valid: false,
                    shopId: '',
                    shopDomain: credentials.shopDomain,
                    shopName: '',
                    currency: '',
                    timezone: '',
                    scopes: [],
                    scopesHash: '',
                    errorCode: err.code,
                    errorMessage: err.message,
                };
            }

            return {
                valid: false,
                shopId: '',
                shopDomain: credentials.shopDomain,
                shopName: '',
                currency: '',
                timezone: '',
                scopes: [],
                scopesHash: '',
                errorCode: CommerceErrorCode.API_RESPONSE_INVALID,
                errorMessage: 'Failed to validate Shopify connection',
            };
        }
    }

    /**
     * Get all orders with FULL cursor-based pagination
     * CRITICAL: Must retrieve ALL pages or fail closed
     */
    async getOrders(credentials: ShopifyCredentials, startDate: Date, endDate: Date): Promise<ShopifyOrder[]> {
        interface OrdersResponse {
            orders: Array<{
                id: number;
                financial_status: string;
                fulfillment_status: string | null;
                cancelled_at: string | null;
                total_price: string;
                subtotal_price: string;
                total_discounts: string;
                total_tax: string;
                total_shipping_price_set?: { shop_money: { amount: string } };
                total_refunded_set?: { shop_money: { amount: string } };
                currency: string;
                created_at: string;
                processed_at: string | null;
            }>;
        }

        const orders: ShopifyOrder[] = [];
        let pageInfo: string | null = null;
        let pagesProcessed = 0;

        do {
            if (pagesProcessed >= SHOPIFY_MAX_PAGES) {
                throw new CommerceError(
                    CommerceErrorCode.API_INCOMPLETE_PAGINATION,
                    `Exceeded max pages (${SHOPIFY_MAX_PAGES}). Data may be incomplete.`
                );
            }

            const params: Record<string, string> = {
                created_at_min: startDate.toISOString(),
                created_at_max: endDate.toISOString(),
                status: 'any',
                limit: '250',
            };

            if (pageInfo) {
                // When using page_info, only limit is allowed
                const { data, linkHeader } = await this.request<OrdersResponse>(
                    credentials,
                    '/orders.json',
                    { page_info: pageInfo, limit: '250' }
                );

                for (const order of data.orders) {
                    orders.push(this.parseOrder(order));
                }

                const links = this.parseLinkHeader(linkHeader);
                pageInfo = links.next;
            } else {
                const { data, linkHeader } = await this.request<OrdersResponse>(
                    credentials,
                    '/orders.json',
                    params
                );

                for (const order of data.orders) {
                    orders.push(this.parseOrder(order));
                }

                const links = this.parseLinkHeader(linkHeader);
                pageInfo = links.next;
            }

            pagesProcessed++;
        } while (pageInfo);

        return orders;
    }

    private parseOrder(order: {
        id: number;
        financial_status: string;
        fulfillment_status: string | null;
        cancelled_at: string | null;
        total_price: string;
        subtotal_price: string;
        total_discounts: string;
        total_tax: string;
        total_shipping_price_set?: { shop_money: { amount: string } };
        total_refunded_set?: { shop_money: { amount: string } };
        currency: string;
        created_at: string;
        processed_at: string | null;
    }): ShopifyOrder {
        return {
            id: order.id,
            financialStatus: order.financial_status,
            fulfillmentStatus: order.fulfillment_status,
            cancelledAt: order.cancelled_at,
            totalPriceCents: Math.round(parseFloat(order.total_price) * 100),
            subtotalPriceCents: Math.round(parseFloat(order.subtotal_price) * 100),
            totalDiscountsCents: Math.round(parseFloat(order.total_discounts) * 100),
            totalTaxCents: Math.round(parseFloat(order.total_tax) * 100),
            totalShippingCents: order.total_shipping_price_set
                ? Math.round(parseFloat(order.total_shipping_price_set.shop_money.amount) * 100)
                : 0,
            refundedAmountCents: order.total_refunded_set
                ? Math.round(parseFloat(order.total_refunded_set.shop_money.amount) * 100)
                : 0,
            currency: order.currency,
            createdAt: order.created_at,
            processedAt: order.processed_at,
        };
    }

    /**
     * Get revenue summary with hardened filtering
     * CRITICAL: Deterministic filters, fail-closed on ambiguity
     */
    async getRevenueSummary(credentials: ShopifyCredentials, startDate: Date, endDate: Date): Promise<ShopifyRevenueSummary> {
        const allOrders = await this.getOrders(credentials, startDate, endDate);

        let grossRevenueCents = 0;
        let discountsCents = 0;
        let taxCents = 0;
        let shippingCents = 0;
        let refundedCents = 0;
        let orderCount = 0;
        let fulfilledOrderCount = 0;
        let lastOrderId: string | null = null;
        let currency: string = 'USD';
        let currencyMismatch = false;

        for (const order of allOrders) {
            // FILTER 1: Only paid orders
            if (!SHOPIFY_ALLOWED_FINANCIAL_STATUS.includes(order.financialStatus)) {
                continue;
            }

            // FILTER 2: Exclude cancelled orders (ANTI-GAMING)
            if (order.cancelledAt !== null) {
                continue;
            }

            // FILTER 3: Currency validation (fail-closed on mismatch)
            if (orderCount === 0) {
                currency = order.currency.toUpperCase();
            } else if (order.currency.toUpperCase() !== currency) {
                currencyMismatch = true;
                continue; // Skip orders with different currency
            }

            orderCount++;
            grossRevenueCents += order.totalPriceCents;
            discountsCents += order.totalDiscountsCents;
            taxCents += order.totalTaxCents;
            shippingCents += order.totalShippingCents;
            refundedCents += order.refundedAmountCents;
            lastOrderId = String(order.id);

            if (order.fulfillmentStatus === 'fulfilled' || order.fulfillmentStatus === 'partial') {
                fulfilledOrderCount++;
            }
        }

        // FAIL-CLOSED: If currency mismatch detected, throw error
        if (currencyMismatch && orderCount > 0) {
            throw new CommerceError(
                CommerceErrorCode.CURRENCY_UNSUPPORTED,
                'Multi-currency orders detected. Cannot compute deterministic net revenue.'
            );
        }

        // Net revenue: gross - refunds
        // Note: discounts are usually already reflected in total_price
        const netRevenueCents = grossRevenueCents - refundedCents;

        return {
            grossRevenueCents,
            discountsCents,
            taxCents,
            shippingCents,
            refundedCents,
            netRevenueCents,
            orderCount,
            fulfilledOrderCount,
            windowStart: startDate.toISOString(),
            windowEnd: endDate.toISOString(),
            lastOrderId,
            pagesProcessed: Math.ceil(allOrders.length / 250) || 1,
            currency,
        };
    }
}

// =============================================================================
// CLIENT SINGLETON
// =============================================================================

let shopifyClientInstance: ShopifyClient | null = null;

export function getShopifyClient(): ShopifyClient {
    if (shopifyClientInstance) {
        return shopifyClientInstance;
    }

    const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
    const useMock = process.env.USE_MOCK_SHOPIFY === 'true';

    if (isTest || useMock) {
        console.log('[Shopify Client] Using MockShopifyClient');
        shopifyClientInstance = new MockShopifyClient();
        return shopifyClientInstance;
    }

    console.log('[Shopify Client] Using RealShopifyClient');
    shopifyClientInstance = new RealShopifyClient();
    return shopifyClientInstance;
}

export function setShopifyClient(client: ShopifyClient) {
    shopifyClientInstance = client;
}

export function resetShopifyClient() {
    shopifyClientInstance = null;
}

// =============================================================================
// TOKEN RESOLUTION
// =============================================================================

/**
 * Resolve Shopify access token from connected account.
 * The connect route stores the token in metadataJson.accessToken,
 * but we also check accessTokenEnc for backwards compatibility.
 */
function resolveAccessToken(account: ConnectedAccount): string {
    // Primary: dedicated column
    if (account.accessTokenEnc) {
        return account.accessTokenEnc;
    }
    // Fallback: stored in metadataJson during OAuth
    const meta = account.metadataJson as Record<string, any> | null;
    if (meta?.accessToken) {
        return meta.accessToken;
    }
    return '';
}

// =============================================================================
// CONNECTED ACCOUNT HELPERS
// =============================================================================

export async function getShopifyConnectedAccount(userId: string): Promise<ConnectedAccount | null> {
    const [account] = await db
        .select()
        .from(connectedAccounts)
        .where(
            and(
                eq(connectedAccounts.userId, userId),
                eq(connectedAccounts.platform, 'SHOPIFY'),
                eq(connectedAccounts.status, 'ACTIVE')
            )
        )
        .limit(1);

    return account || null;
}

export async function getVerifiedShopifyAccount(userId: string): Promise<ConnectedAccount | null> {
    const account = await getShopifyConnectedAccount(userId);

    if (!account) {
        return null;
    }

    if (account.verificationStatus !== 'VERIFIED') {
        return null;
    }

    return account;
}

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Neutral baseline snapshot shared by ALL verification sources.
 *
 * Only the fields every source can honestly produce are required. Source-specific
 * fields (commerce order data, bank income stream data) are optional so each
 * adapter fills in what its rail actually supports.
 *
 * ShopifyBaselineSnapshot is structurally assignable to this type, so the
 * Shopify and Amazon adapters satisfy it without any change to their code.
 */
export interface IncomeBaselineSnapshot {
    // ---- Neutral core (every source) ----
    snapshotAt: string;
    provider: string;           // widened from the 'shopify' literal
    windowStart: string;
    windowEnd: string;
    netCents: number;           // the one universal money figure
    apiVersion: string;
    dataHash: string;

    // ---- Commerce-specific (Shopify / Amazon) ----
    storeRef?: string;
    grossCents?: number;
    discountsCents?: number;
    refundsCents?: number;
    shippingCents?: number;
    taxCents?: number;
    orderCount?: number;
    fulfilledOrderCount?: number;
    lastOrderId?: string | null;
    pagesProcessed?: number;
    financialStatusFilter?: string[];
    currencyFilter?: string;

    // ---- Bank-income-specific (Plaid) ----
    // Bank rails verify MONEY RECEIVED (deposits), never sales made.
    streamId?: string;
    streamLabel?: string;
    depositCount?: number;
    cadence?: string;
    medianDepositCents?: number;
    trailingAvgCents?: number;
    monthsOfHistory?: number;
    graceDays?: number;
}

export interface CommerceAdapter {
    platform: 'SHOPIFY' | 'AMAZON' | 'PLAID';
    healthCheck(userId: string): Promise<{ ok: boolean; shop?: string }>;
    validateConnection(userId: string): Promise<ShopifyConnectionValidation | { valid: boolean; errorCode?: CommerceErrorCode }>;
    snapshotBaseline(userId: string, windowDays?: number, executionTime?: Date): Promise<IncomeBaselineSnapshot>;
    evaluate(userId: string, baselineRevenueCents: number, targetDeltaCents: number, windowStart: Date, windowEnd: Date): Promise<{
        pass: boolean;
        currentRevenueCents: number;
        deltaCents: number;
        targetDeltaCents: number;
        evidence: Record<string, unknown>;
    }>;
}

// =============================================================================
// SHOPIFY ADAPTER (HARDENED)
// =============================================================================

export const shopifyAdapter: CommerceAdapter = {
    platform: 'SHOPIFY',

    async healthCheck(userId: string) {
        const account = await getShopifyConnectedAccount(userId);
        if (!account) {
            return { ok: false };
        }

        const credentials: ShopifyCredentials = {
            shopDomain: account.externalAccountId,
            accessToken: resolveAccessToken(account),
        };

        if (!credentials.accessToken) {
            return { ok: false };
        }

        const client = getShopifyClient();
        return client.healthCheck(credentials);
    },

    async validateConnection(userId: string): Promise<ShopifyConnectionValidation> {
        const account = await getShopifyConnectedAccount(userId);
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

        const credentials: ShopifyCredentials = {
            shopDomain: account.externalAccountId,
            accessToken: resolveAccessToken(account),
        };

        if (!credentials.accessToken) {
            return {
                valid: false,
                shopId: '',
                shopDomain: account.externalAccountId,
                shopName: '',
                currency: '',
                timezone: '',
                scopes: [],
                scopesHash: '',
                errorCode: CommerceErrorCode.CREDENTIALS_INVALID,
            };
        }

        const client = getShopifyClient();
        return client.validateConnection(credentials);
    },

    /**
     * Snapshot baseline with HARDENED invariants:
     * - Window ends at executionTime (strictly before, no overlap)
     * - Minimum window length enforced
     * - Minimum baseline amount enforced
     * - Currency locked
     * - All totals stored for reproducibility
     */
    async snapshotBaseline(userId: string, windowDays: number = SHOPIFY_WINDOW_DAYS, executionTime?: Date): Promise<ShopifyBaselineSnapshot> {
        // Enforce minimum window
        if (windowDays < SHOPIFY_MIN_WINDOW_DAYS) {
            throw new CommerceError(
                CommerceErrorCode.BASELINE_WINDOW_TOO_SHORT,
                `Baseline window must be at least ${SHOPIFY_MIN_WINDOW_DAYS} days. Got: ${windowDays}`
            );
        }

        const account = await getVerifiedShopifyAccount(userId);
        if (!account) {
            throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
        }

        const credentials: ShopifyCredentials = {
            shopDomain: account.externalAccountId,
            accessToken: resolveAccessToken(account),
        };

        if (!credentials.accessToken) {
            throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
        }

        const client = getShopifyClient();

        // ANTI-GAMING: Window ends at execution time (strictly before)
        const windowEnd = executionTime || new Date();
        const windowStart = new Date(windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

        const summary = await client.getRevenueSummary(credentials, windowStart, windowEnd);

        // Eligibility check: minimum baseline
        if (summary.netRevenueCents < SHOPIFY_MIN_BASELINE_CENTS) {
            throw new CommerceError(
                CommerceErrorCode.BASELINE_TOO_LOW,
                `Baseline revenue too low: $${(summary.netRevenueCents / 100).toFixed(2)}. ` +
                `Minimum required: $${(SHOPIFY_MIN_BASELINE_CENTS / 100).toFixed(2)}`
            );
        }

        // Compute data hash for integrity
        const dataHash = createHash('sha256')
            .update(JSON.stringify({
                windowStart: summary.windowStart,
                windowEnd: summary.windowEnd,
                netCents: summary.netRevenueCents,
                orderCount: summary.orderCount,
                lastOrderId: summary.lastOrderId,
            }))
            .digest('hex')
            .slice(0, 16);

        return {
            snapshotAt: new Date().toISOString(),
            provider: 'shopify',
            storeRef: credentials.shopDomain,
            windowStart: summary.windowStart,
            windowEnd: summary.windowEnd,
            grossCents: summary.grossRevenueCents,
            discountsCents: summary.discountsCents,
            refundsCents: summary.refundedCents,
            shippingCents: summary.shippingCents,
            taxCents: summary.taxCents,
            netCents: summary.netRevenueCents,
            orderCount: summary.orderCount,
            fulfilledOrderCount: summary.fulfilledOrderCount,
            lastOrderId: summary.lastOrderId,
            pagesProcessed: summary.pagesProcessed,
            financialStatusFilter: SHOPIFY_ALLOWED_FINANCIAL_STATUS,
            currencyFilter: summary.currency,
            apiVersion: SHOPIFY_API_VERSION,
            dataHash,
        };
    },

    async evaluate(userId: string, baselineRevenueCents: number, targetDeltaCents: number, windowStart: Date, windowEnd: Date) {
        const account = await getVerifiedShopifyAccount(userId);
        if (!account) {
            throw new CommerceError(CommerceErrorCode.PROVIDER_NOT_CONNECTED);
        }

        const credentials: ShopifyCredentials = {
            shopDomain: account.externalAccountId,
            accessToken: resolveAccessToken(account),
        };

        if (!credentials.accessToken) {
            throw new CommerceError(CommerceErrorCode.CREDENTIALS_INVALID);
        }

        const client = getShopifyClient();
        const summary = await client.getRevenueSummary(credentials, windowStart, windowEnd);

        const currentRevenueCents = summary.netRevenueCents;
        const deltaCents = currentRevenueCents - baselineRevenueCents;
        const pass = deltaCents >= targetDeltaCents;

        return {
            pass,
            currentRevenueCents,
            deltaCents,
            targetDeltaCents,
            evidence: {
                source: 'SHOPIFY',
                shopDomain: credentials.shopDomain,
                baselineRevenueCents,
                currentRevenueCents,
                deltaCents,
                targetDeltaCents,
                windowStart: windowStart.toISOString(),
                windowEnd: windowEnd.toISOString(),
                grossRevenueCents: summary.grossRevenueCents,
                refundedCents: summary.refundedCents,
                orderCount: summary.orderCount,
                fulfilledOrderCount: summary.fulfilledOrderCount,
                pagesProcessed: summary.pagesProcessed,
                currency: summary.currency,
            },
        };
    },
};
