// @ts-nocheck
/**
 * Rivalry State Derivation Service
 * 
 * Pure function that derives rivalry state from ordered ledger events.
 * This is the ONLY source of truth for rivalry state.
 * No state is ever stored or cached — always derived from the event chain.
 * 
 * Mirrors the existing state-derivation.ts pattern for standard contracts.
 */

import { type RivalryLedgerEvent, RivalryStatus, RivalryEventType, type RivalryStatusType } from '../db/schema.js';

// Event type → resulting state mapping
const RIVALRY_EVENT_TO_STATE: Record<string, RivalryStatusType> = {
    [RivalryEventType.RIVALRY_CREATED]: RivalryStatus.CHALLENGE_ISSUED,
    [RivalryEventType.RIVALRY_ACCEPTED]: RivalryStatus.ACCEPTED,
    [RivalryEventType.RIVALRY_DECLINED]: RivalryStatus.DECLINED,
    [RivalryEventType.RIVALRY_EXPIRED]: RivalryStatus.EXPIRED,
    [RivalryEventType.RIVALRY_BOTH_FUNDED]: RivalryStatus.BOTH_FUNDED,
    [RivalryEventType.RIVALRY_CANCELLED]: RivalryStatus.CANCELLED,
    [RivalryEventType.RIVALRY_ACTIVATED]: RivalryStatus.ACTIVE,
    [RivalryEventType.RIVALRY_VERIFICATION_STARTED]: RivalryStatus.VERIFYING,
    [RivalryEventType.RIVALRY_VERIFIED]: RivalryStatus.VERIFIED,
    [RivalryEventType.RIVALRY_SETTLEMENT_STARTED]: RivalryStatus.SETTLING,
    [RivalryEventType.RIVALRY_SETTLED]: RivalryStatus.SETTLED,
    [RivalryEventType.RIVALRY_DRAW]: RivalryStatus.DRAW,
};

// Allowed state transitions
const RIVALRY_STATE_TRANSITIONS: Record<RivalryStatusType, RivalryStatusType[]> = {
    [RivalryStatus.CHALLENGE_ISSUED]: [RivalryStatus.ACCEPTED, RivalryStatus.DECLINED, RivalryStatus.EXPIRED],
    [RivalryStatus.ACCEPTED]: [RivalryStatus.BOTH_FUNDED, RivalryStatus.CANCELLED],
    [RivalryStatus.BOTH_FUNDED]: [RivalryStatus.ACTIVE],
    [RivalryStatus.ACTIVE]: [RivalryStatus.VERIFYING],
    [RivalryStatus.VERIFYING]: [RivalryStatus.VERIFIED],
    [RivalryStatus.VERIFIED]: [RivalryStatus.SETTLING],
    [RivalryStatus.SETTLING]: [RivalryStatus.SETTLED, RivalryStatus.DRAW],
    // Terminal states — no transitions out
    [RivalryStatus.DECLINED]: [],
    [RivalryStatus.EXPIRED]: [],
    [RivalryStatus.CANCELLED]: [],
    [RivalryStatus.SETTLED]: [],
    [RivalryStatus.DRAW]: [],
};

// Terminal states
const RIVALRY_TERMINAL_STATES: RivalryStatusType[] = [
    RivalryStatus.DECLINED,
    RivalryStatus.EXPIRED,
    RivalryStatus.CANCELLED,
    RivalryStatus.SETTLED,
    RivalryStatus.DRAW,
];

export class InvalidRivalryTransitionError extends Error {
    constructor(
        public readonly fromState: RivalryStatusType | string,
        public readonly toState: RivalryStatusType | string,
        public readonly eventType: string
    ) {
        super(`Invalid rivalry transition: ${fromState} → ${toState} (event: ${eventType})`);
        this.name = 'InvalidRivalryTransitionError';
    }
}

export class TerminalRivalryStateError extends Error {
    constructor(
        public readonly currentState: RivalryStatusType,
        public readonly action: string
    ) {
        super(`Cannot ${action}: rivalry is in terminal state ${currentState}`);
        this.name = 'TerminalRivalryStateError';
    }
}

/**
 * Check if a rivalry state transition is valid
 */
export function canRivalryTransition(from: RivalryStatusType, to: RivalryStatusType): boolean {
    if (from === to) return true; // allow no-ops
    return RIVALRY_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Check if a rivalry state is terminal
 */
export function isRivalryTerminal(state: RivalryStatusType | null): boolean {
    if (state === null) return false;
    return RIVALRY_TERMINAL_STATES.includes(state);
}

/**
 * Validate that rivalry is not in a terminal state
 */
export function validateRivalryNotTerminal(
    currentState: RivalryStatusType | null,
    action: string
): void {
    if (currentState && isRivalryTerminal(currentState)) {
        throw new TerminalRivalryStateError(currentState, action);
    }
}

/**
 * Validate that the current state allows a specific action
 */
export function validateRivalryFromState(
    currentState: RivalryStatusType | null,
    allowedFromStates: RivalryStatusType[],
    actionName: string
): void {
    if (currentState === null || !allowedFromStates.includes(currentState)) {
        const stateStr = currentState ?? 'NULL';
        throw new InvalidRivalryTransitionError(
            stateStr,
            'UNKNOWN',
            `${actionName} requires state to be one of: ${allowedFromStates.join(', ')}. Current: ${stateStr}`
        );
    }
}

/**
 * Derive current rivalry state from ordered ledger events.
 * 
 * @param events - Rivalry ledger events ordered by timestampUtc ascending
 * @returns Current derived state, or null if no events
 * @throws InvalidRivalryTransitionError if event sequence contains invalid transition
 */
export function deriveRivalryState(events: RivalryLedgerEvent[]): RivalryStatusType | null {
    if (events.length === 0) {
        return null;
    }

    let currentState: RivalryStatusType | null = null;

    for (const event of events) {
        const nextState = RIVALRY_EVENT_TO_STATE[event.eventType];

        // Skip events that don't affect state (e.g., RIVALRY_BASELINE_CAPTURED, RIVALRY_METRIC_RECORDED)
        if (!nextState) {
            continue;
        }

        // First state-affecting event sets initial state
        if (currentState === null) {
            currentState = nextState;
            continue;
        }

        // Validate transition
        if (!canRivalryTransition(currentState, nextState)) {
            throw new InvalidRivalryTransitionError(currentState, nextState, event.eventType);
        }

        currentState = nextState;
    }

    return currentState;
}

/**
 * Derive state for READING, never for writing.
 *
 * deriveRivalryState() throws the moment a chain contains a transition the
 * table does not allow, and every caller that reads a list swallowed that throw
 * and dropped the row. A rivalry with one out-of-order event then existed in
 * the table and was invisible everywhere — which is how a market carrying
 * several contracts renders one card.
 *
 * Production chains hit this for reasons that are not corruption. Nothing in
 * production performs ACTIVE → VERIFYING → VERIFIED (see the note in
 * jobs/rivalry-cron.ts), so a settlement writes RIVALRY_SETTLEMENT_STARTED
 * straight onto an ACTIVE chain and every later read of that rivalry throws
 * forever.
 *
 * So: the newest state-affecting event still wins — that is what actually
 * happened to the contract — and the transitions that were not permitted are
 * RETURNED rather than thrown, so a caller can surface them. Writers keep
 * using the strict function; nothing here weakens the guard on append.
 */
export function deriveRivalryStateLenient(events: RivalryLedgerEvent[]): {
    state: RivalryStatusType | null;
    invalidTransitions: Array<{ from: RivalryStatusType; to: RivalryStatusType; eventType: string }>;
} {
    const invalidTransitions: Array<{ from: RivalryStatusType; to: RivalryStatusType; eventType: string }> = [];
    let currentState: RivalryStatusType | null = null;

    for (const event of events) {
        const nextState = RIVALRY_EVENT_TO_STATE[event.eventType];
        if (!nextState) continue;

        if (currentState === null) {
            currentState = nextState;
            continue;
        }

        if (!canRivalryTransition(currentState, nextState)) {
            invalidTransitions.push({ from: currentState, to: nextState, eventType: event.eventType });
        }

        currentState = nextState;
    }

    return { state: currentState, invalidTransitions };
}

/**
 * Derive state with validation but without throwing
 */
export function deriveRivalryStateWithValidation(events: RivalryLedgerEvent[]): {
    state: RivalryStatusType | null;
    isValid: boolean;
    error?: string;
} {
    try {
        const state = deriveRivalryState(events);
        return { state, isValid: true };
    } catch (err) {
        if (err instanceof InvalidRivalryTransitionError) {
            return {
                state: null,
                isValid: false,
                error: err.message,
            };
        }
        throw err;
    }
}
