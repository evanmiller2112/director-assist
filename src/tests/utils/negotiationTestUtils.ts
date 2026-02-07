/**
 * Negotiation Testing Utilities
 *
 * Helper functions for creating mock negotiation data for testing Negotiation components.
 * These utilities follow TDD RED phase - components will fail until implemented.
 */

import type {
	NegotiationSession,
	NegotiationArgument,
	NegotiationMotivation,
	NegotiationPitfall,
	MotivationType,
	ArgumentType,
	NegotiationTier,
	NegotiationStatus
} from '$lib/types/negotiation';

/**
 * Creates a mock negotiation motivation for testing
 */
export function createMockMotivation(
	overrides: Partial<NegotiationMotivation> = {}
): NegotiationMotivation {
	return {
		type: 'justice',
		description: 'Seeks fairness and equality',
		isKnown: false,
		timesUsed: 0,
		...overrides
	};
}

/**
 * Creates a mock negotiation pitfall for testing
 */
export function createMockPitfall(
	overrides: Partial<NegotiationPitfall> = {}
): NegotiationPitfall {
	return {
		description: 'Mentions of betrayal',
		isKnown: false,
		...overrides
	};
}

/**
 * Creates a mock negotiation argument for testing
 */
export function createMockArgument(
	overrides: Partial<NegotiationArgument> = {}
): NegotiationArgument {
	return {
		id: `arg-${Math.random().toString(36).substring(7)}`,
		type: 'motivation',
		tier: 2,
		description: 'Test argument',
		motivationType: 'justice',
		interestChange: 1,
		patienceChange: -1,
		playerName: 'Test Player',
		createdAt: new Date(),
		...overrides
	};
}

/**
 * Creates multiple mock arguments for testing
 */
export function createMockArguments(count: number, overrides: Partial<NegotiationArgument>[] = []): NegotiationArgument[] {
	return Array.from({ length: count }, (_, i) =>
		createMockArgument({
			id: `arg-${i}`,
			description: `Argument ${i + 1}`,
			...overrides[i]
		})
	);
}

/**
 * Creates a mock negotiation session for testing
 */
export function createMockNegotiationSession(
	overrides: Partial<NegotiationSession> = {}
): NegotiationSession {
	const now = new Date();
	return {
		id: `negotiation-${Math.random().toString(36).substring(7)}`,
		name: 'Test Negotiation',
		description: 'A test negotiation session',
		npcName: 'Test NPC',
		status: 'preparing',
		interest: 2,
		patience: 5,
		motivations: [],
		pitfalls: [],
		arguments: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

/**
 * Creates a preparing negotiation session for testing
 */
export function createPreparingNegotiationSession(): NegotiationSession {
	return createMockNegotiationSession({
		status: 'preparing',
		interest: 2,
		patience: 5,
		motivations: [
			createMockMotivation({ type: 'justice', description: 'Values fairness', isKnown: true }),
			createMockMotivation({ type: 'peace', description: 'Seeks harmony', isKnown: false })
		],
		pitfalls: [
			createMockPitfall({ description: 'Mentions of war', isKnown: true })
		]
	});
}

/**
 * Creates an active negotiation session for testing
 */
export function createActiveNegotiationSession(): NegotiationSession {
	const motivations = [
		createMockMotivation({ type: 'justice', description: 'Values fairness', isKnown: true, timesUsed: 2 }),
		createMockMotivation({ type: 'peace', description: 'Seeks harmony', isKnown: true, timesUsed: 1 }),
		createMockMotivation({ type: 'protection', description: 'Protects the weak', isKnown: false, timesUsed: 0 })
	];

	const pitfalls = [
		createMockPitfall({ description: 'Mentions of war', isKnown: true }),
		createMockPitfall({ description: 'Greed or bribery', isKnown: false })
	];

	const args = [
		createMockArgument({
			id: 'arg-1',
			type: 'motivation',
			tier: 2,
			description: 'Appeal to their sense of justice',
			motivationType: 'justice',
			interestChange: 1,
			patienceChange: -1,
			playerName: 'Hero 1'
		}),
		createMockArgument({
			id: 'arg-2',
			type: 'motivation',
			tier: 1,
			description: 'Suggest a peaceful resolution',
			motivationType: 'peace',
			interestChange: 1,
			patienceChange: -1,
			playerName: 'Hero 2'
		}),
		createMockArgument({
			id: 'arg-3',
			type: 'no_motivation',
			tier: 2,
			description: 'Generic appeal',
			interestChange: 0,
			patienceChange: -1,
			playerName: 'Hero 1'
		})
	];

	return createMockNegotiationSession({
		status: 'active',
		interest: 4,
		patience: 2,
		motivations,
		pitfalls,
		arguments: args
	});
}

/**
 * Creates a completed negotiation session for testing
 */
export function createCompletedNegotiationSession(): NegotiationSession {
	const session = createActiveNegotiationSession();
	session.status = 'completed';
	session.interest = 5;
	session.patience = 0;
	session.outcome = 'success_full';
	session.completedAt = new Date();
	return session;
}

/**
 * Creates a negotiation session with low patience for testing
 */
export function createLowPatienceNegotiationSession(): NegotiationSession {
	const session = createActiveNegotiationSession();
	session.patience = 1;
	session.interest = 2;
	return session;
}

/**
 * Creates a negotiation session with high interest for testing
 */
export function createHighInterestNegotiationSession(): NegotiationSession {
	const session = createActiveNegotiationSession();
	session.interest = 5;
	session.patience = 3;
	return session;
}

/**
 * Creates a negotiation session with pitfall triggered for testing
 */
export function createPitfallTriggeredNegotiationSession(): NegotiationSession {
	const session = createActiveNegotiationSession();
	session.arguments.push(
		createMockArgument({
			id: 'arg-pitfall',
			type: 'pitfall',
			tier: 2,
			description: 'Mentioned war and violence',
			interestChange: -1,
			patienceChange: -2,
			playerName: 'Hero 3'
		})
	);
	session.interest = 2;
	session.patience = 1;
	return session;
}

/**
 * Helper to get the current offer based on interest level
 */
export function getOfferForInterest(interest: number): string {
	switch (interest) {
		case 0:
			return 'Hostile - NPC refuses and may attack';
		case 1:
			return 'Rejection - NPC refuses the request';
		case 2:
			return 'Lesser Offer - NPC offers less than requested';
		case 3:
			return 'Compromise - NPC agrees with conditions';
		case 4:
			return 'Success - NPC fully agrees';
		case 5:
			return 'Full Success - NPC agrees plus bonus';
		default:
			return 'Unknown';
	}
}

/**
 * Helper to determine if negotiation can continue
 */
export function canContinueNegotiation(session: NegotiationSession): boolean {
	return session.status === 'active' && session.patience > 0;
}

/**
 * Helper to get motivation by type
 */
export function findMotivationByType(
	session: NegotiationSession,
	type: MotivationType
): NegotiationMotivation | undefined {
	return session.motivations.find(m => m.type === type);
}
