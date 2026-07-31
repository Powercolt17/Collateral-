/**
 * Verification Worker
 * 
 * Background job that runs at deadline:
 * - Finds contracts in LOCKED state past deadline
 * - Evaluates via platform adapter
 * - Settles or forfeits based on result
 * 
 * No manual override endpoints. Fully automatic.
 * State is NEVER stored - derived from ledger events.
 */

import { db } from '../db/client.js';
import { contracts, ContractStatus, EventType } from '../db/schema.js';
import { getContract, getContractWithState, getContractsDueForVerification, getEffectiveSettlementAt } from '../services/contracts.js';
import { appendEvent, getEventsForContract } from '../services/ledger.js';
import { deriveState } from '../services/state-derivation.js';

// Placeholder for adapters - will be wired later
interface PlatformAdapter {
    platform: string;
    evaluate(contract: any): Promise<{
        pass: boolean;
        observedValue: number;
        threshold: number;
        operator: string;
        evidence: Record<string, unknown>;
    }>;
}

const adapters: Map<string, PlatformAdapter> = new Map();

function getAdapter(platform: string): PlatformAdapter | undefined {
    return adapters.get(platform);
}

export function registerAdapter(adapter: PlatformAdapter): void {
    adapters.set(adapter.platform, adapter);
}

/**
 * Process a single contract through verification
 */
async function verifyContract(contractId: string): Promise<void> {
    const result = await getContractWithState(contractId);

    if (!result) {
        console.error(`Contract not found: ${contractId}`);
        return;
    }

    const { contract, state } = result;

    // Must be LOCKED to verify
    if (state !== ContractStatus.LOCKED) {
        console.log(`Skipping contract ${contractId}: state is ${state}`);
        return;
    }

    // Check settlement date has passed (deadline + posting-lag grace for income contracts)
    if (getEffectiveSettlementAt(contract) > new Date()) {
        console.log(`Skipping contract ${contractId}: settlement date not reached`);
        return;
    }

    console.log(`🔍 Verifying contract ${contractId}...`);

    try {
        // Step 1: Append VERIFICATION_STARTED
        await appendEvent({
            contractId,
            actor: 'SYSTEM',
            eventType: EventType.VERIFICATION_STARTED,
            metadata: { startedAt: new Date().toISOString() },
        });

        // Step 2: Get adapter and evaluate
        const adapter = getAdapter(contract.platform);
        if (!adapter) {
            throw new Error(`No adapter for platform: ${contract.platform}`);
        }

        const evaluationResult = await adapter.evaluate(contract);

        // Step 3: Append VERIFICATION_RESULT
        await appendEvent({
            contractId,
            actor: 'SYSTEM',
            eventType: EventType.VERIFICATION_RESULT,
            metadata: {
                pass: evaluationResult.pass,
                observedValue: evaluationResult.observedValue,
                threshold: evaluationResult.threshold,
                operator: evaluationResult.operator,
                evidence: evaluationResult.evidence,
            },
        });

        // Step 4: Append CONTRACT_VERIFIED
        await appendEvent({
            contractId,
            actor: 'SYSTEM',
            eventType: EventType.CONTRACT_VERIFIED,
            metadata: {
                pass: evaluationResult.pass,
                verifiedAt: new Date().toISOString(),
            },
        });

        // Step 5: Settle or Forfeit
        if (evaluationResult.pass) {
            // SUCCESS: Return capital + optional upside
            await appendEvent({
                contractId,
                actor: 'SYSTEM',
                eventType: EventType.CONTRACT_SETTLED,
                amountUsdCents: contract.lockAmountUsdCents,
                metadata: {
                    outcome: 'SUCCESS',
                    observedValue: evaluationResult.observedValue,
                    settledAt: new Date().toISOString(),
                },
            });
            console.log(`✅ Contract ${contractId} SETTLED (SUCCESS)`);
        } else {
            // FAILURE: Forfeit capital irreversibly
            await appendEvent({
                contractId,
                actor: 'SYSTEM',
                eventType: EventType.CONTRACT_FORFEITED,
                amountUsdCents: contract.lockAmountUsdCents,
                metadata: {
                    outcome: 'FAILURE',
                    observedValue: evaluationResult.observedValue,
                    forfeitedAt: new Date().toISOString(),
                    noAppeals: true,
                },
            });
            console.log(`❌ Contract ${contractId} FORFEITED (FAILURE)`);
        }

        // Step 6: Issue receipt
        await appendEvent({
            contractId,
            actor: 'SYSTEM',
            eventType: EventType.RECEIPT_ISSUED,
            amountUsdCents: contract.lockAmountUsdCents,
            metadata: {
                outcome: evaluationResult.pass ? 'SETTLED' : 'FORFEITED',
                immutable: true,
                receiptIssuedAt: new Date().toISOString(),
            },
        });

    } catch (err: any) {
        console.error(`Error verifying contract ${contractId}:`, err.message);
        // In production: add to dead letter queue for investigation
    }
}

/**
 * Run verification for all due contracts
 */
export async function runVerificationJob(): Promise<void> {
    console.log('🚀 Starting verification job...');

    const dueContracts = await getContractsDueForVerification();

    console.log(`Found ${dueContracts.length} contracts due for verification`);

    for (const contract of dueContracts) {
        await verifyContract(contract.id);
    }

    console.log('✅ Verification job complete');
}

// If run directly
if (process.argv[1].includes('verification')) {
    runVerificationJob()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
