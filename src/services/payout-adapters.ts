/**
 * Payout Adapters — one queue, many destinations.
 *
 * USD and crypto payouts drain the SAME PAYOUT_QUEUED events. There is exactly
 * one settlement path; only the destination differs, chosen per user at payout
 * time. Building two settlement paths would mean two places for a payout to be
 * decided, and eventually two different answers for the same contract.
 *
 * Every adapter owns:
 *   · resolving the user's destination (and failing loudly when there isn't one)
 *   · sending, under a DETERMINISTIC idempotency key
 *   · classifying its own errors as TRANSIENT or TERMINAL
 *
 * NON-NEGOTIABLE RULES (see payout-job.ts for enforcement):
 *   · idempotency keys derive from the origin event id, never a random UUID
 *   · a missing destination PARKS, it never retries forever and never marks sent
 *   · the ledger records PAYOUT_SENT only after the provider confirms
 */

import { db } from '../db/client.js';
import { userWallets, connectAccounts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export type PayoutRail = 'USD' | 'CRYPTO';

/** Transient errors are worth retrying; terminal ones will never succeed. */
export type ErrorClass = 'TRANSIENT' | 'TERMINAL';

export type DestinationResult =
    | { ok: true; destination: string }
    | { ok: false; reason: string; code: string };

export interface SendParams {
    destination: string;
    amountCents: number;
    /** Deterministic. Derived from the origin ledger event id. */
    idempotencyKey: string;
    metadata: Record<string, string>;
}

export interface PayoutAdapter {
    readonly rail: PayoutRail;
    /** Where does this user get paid? Fails closed when unknown. */
    resolveDestination(userId: string): Promise<DestinationResult>;
    /** Sends. Must be safe to call twice with the same idempotencyKey. */
    send(params: SendParams): Promise<{ providerRef: string }>;
    /** Decides retry vs park. Unknown errors are TRANSIENT so we never park a recoverable payout. */
    classifyError(err: unknown): ErrorClass;
}

// =============================================================================
// USD — Stripe Connect
// =============================================================================

export class StripeUsdPayoutAdapter implements PayoutAdapter {
    readonly rail = 'USD' as const;

    async resolveDestination(userId: string): Promise<DestinationResult> {
        const [acct] = await db
            .select()
            .from(connectAccounts)
            .where(eq(connectAccounts.userId, userId))
            .limit(1);

        if (!acct) {
            return { ok: false, code: 'NO_CONNECT_ACCOUNT', reason: 'User has not completed Stripe Connect onboarding' };
        }
        const destination = (acct as any).stripeConnectAccountId;
        if (!destination) {
            return { ok: false, code: 'NO_CONNECT_ACCOUNT_ID', reason: 'Connect account row exists but has no Stripe account id' };
        }
        if ((acct as any).payoutsEnabled !== true) {
            return { ok: false, code: 'PAYOUTS_DISABLED', reason: 'Stripe reports payouts are not enabled for this account' };
        }
        return { ok: true, destination };
    }

    async send({ destination, amountCents, idempotencyKey, metadata }: SendParams) {
        // Goes through the existing StripeClient abstraction so tests run against
        // MockStripeClient and never touch a real Stripe account.
        const { getStripeClient } = await import('./stripe-client.js');
        const result = await getStripeClient().createTransfer({
            amountUsdCents: amountCents,
            destinationAccountId: destination,
            contractId: metadata.contractId || 'n/a',
            idempotencyKey,
        });

        if (!result.success) {
            const err: any = new Error(result.error || 'Transfer failed');
            // The client already tells us whether this is worth retrying; honour
            // it rather than re-deriving from a string.
            err.retryable = result.retryable;
            err.code = result.error;
            throw err;
        }
        return { providerRef: result.id! };
    }

    classifyError(err: unknown): ErrorClass {
        const e = err as any;
        // StripeClient already classifies; trust it when present.
        if (e?.retryable === true) return 'TRANSIENT';
        if (e?.retryable === false) return 'TERMINAL';

        const status = e?.statusCode ?? e?.status;
        const type = e?.type;
        const code = e?.code;

        // Will never succeed on retry — park immediately.
        const terminalCodes = [
            'account_invalid', 'account_closed', 'balance_insufficient',
            'transfers_not_allowed', 'parameter_invalid_integer',
        ];
        if (terminalCodes.includes(code)) return 'TERMINAL';
        if (type === 'StripeInvalidRequestError') return 'TERMINAL';
        if (typeof status === 'number' && status >= 400 && status < 500 && status !== 429) return 'TERMINAL';

        // 429, 5xx, network — worth retrying. Unknown also retries: better to
        // retry a doomed payout five times than to park a recoverable one.
        return 'TRANSIENT';
    }
}

// =============================================================================
// CRYPTO — wallet address
// =============================================================================

export class CryptoPayoutAdapter implements PayoutAdapter {
    readonly rail = 'CRYPTO' as const;

    async resolveDestination(userId: string): Promise<DestinationResult> {
        const [wallet] = await db
            .select()
            .from(userWallets)
            .where(eq(userWallets.userId, userId))
            .limit(1);

        if (!wallet) {
            return { ok: false, code: 'NO_WALLET', reason: 'User has not linked a wallet address' };
        }
        const address = (wallet as any).walletAddress || (wallet as any).address;
        if (!address) {
            return { ok: false, code: 'NO_WALLET_ADDRESS', reason: 'Wallet row exists but has no address' };
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return { ok: false, code: 'INVALID_WALLET_ADDRESS', reason: `Wallet address is not a valid EVM address: ${address}` };
        }
        return { ok: true, destination: address };
    }

    async send(_params: SendParams): Promise<{ providerRef: string }> {
        // Deliberately not implemented. An adapter that silently no-ops would
        // let the job write PAYOUT_SENT for money that never moved — the exact
        // failure this whole design exists to prevent. Throwing TERMINAL parks
        // the payout visibly instead.
        const err: any = new Error('Crypto payout rail is not implemented yet');
        err.terminal = true;
        err.code = 'CRYPTO_RAIL_NOT_IMPLEMENTED';
        throw err;
    }

    classifyError(err: unknown): ErrorClass {
        const e = err as any;
        if (e?.terminal === true) return 'TERMINAL';
        if (e?.code === 'INSUFFICIENT_FUNDS' || e?.code === 'INVALID_ADDRESS') return 'TERMINAL';
        return 'TRANSIENT';
    }
}

// =============================================================================
// SELECTION
// =============================================================================

const adapters: Record<PayoutRail, PayoutAdapter> = {
    USD: new StripeUsdPayoutAdapter(),
    CRYPTO: new CryptoPayoutAdapter(),
};

export function getPayoutAdapter(rail: PayoutRail): PayoutAdapter {
    return adapters[rail];
}

/**
 * Which rail does this user get paid on?
 *
 * Defaults to USD. There is no stored per-user preference column yet, so this
 * reads intent from what the user has actually connected: a Connect account
 * means USD. Crypto is opt-in and currently unimplemented, so defaulting to it
 * would park every payout.
 */
export async function resolveUserRail(userId: string): Promise<PayoutRail> {
    const [acct] = await db
        .select()
        .from(connectAccounts)
        .where(eq(connectAccounts.userId, userId))
        .limit(1);
    if (acct) return 'USD';
    return 'USD';
}

export function setPayoutAdapterForTests(rail: PayoutRail, adapter: PayoutAdapter) {
    adapters[rail] = adapter;
}
