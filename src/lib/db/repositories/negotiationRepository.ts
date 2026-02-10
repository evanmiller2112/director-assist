/**
 * Negotiation Repository
 *
 * Manages negotiation sessions in IndexedDB for Draw Steel RPG negotiation tracking.
 *
 * Features:
 * - Negotiation lifecycle (preparing, active, completed)
 * - Argument recording with interest/patience calculations
 * - Draw Steel negotiation mechanics (motivations, pitfalls, tiers)
 * - Auto-completion when interest hits 0/5 or patience hits 0
 * - Motivation and pitfall tracking
 */

import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import { nanoid } from 'nanoid';
import type {
	NegotiationSession,
	NegotiationArgument,
	NegotiationMotivation,
	NegotiationPitfall,
	CreateNegotiationInput,
	UpdateNegotiationInput,
	RecordArgumentInput,
	ArgumentType,
	NegotiationTier,
	NegotiationOutcome,
	MotivationType
} from '$lib/types/negotiation';
import { createFromNegotiation } from '$lib/services/narrativeEventService';

// ============================================================================
// Helper Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate interest change based on argument type and tier.
 *
 * Draw Steel Rules:
 * - Motivation appeal: Tier 1 = 0, Tier 2 = +1, Tier 3 = +1
 * - No motivation: Tier 1 = -1, Tier 2 = 0, Tier 3 = +1
 * - Pitfall: Always -1
 */
export function calculateInterestChange(argumentType: ArgumentType, tier: NegotiationTier): number {
	if (argumentType === 'pitfall') {
		return -1;
	}

	if (argumentType === 'motivation') {
		if (tier === 1) return 0;
		if (tier === 2) return 1;
		if (tier === 3) return 1;
	}

	if (argumentType === 'no_motivation') {
		if (tier === 1) return -1;
		if (tier === 2) return 0;
		if (tier === 3) return 1;
	}

	return 0;
}

/**
 * Calculate patience change based on argument type and tier.
 *
 * Draw Steel Rules:
 * - Motivation appeal: Tier 1 = -1, Tier 2 = -1, Tier 3 = 0
 * - No motivation: Tier 1 = -1, Tier 2 = -1, Tier 3 = -1
 * - Pitfall: Always -1
 */
export function calculatePatienceChange(
	argumentType: ArgumentType,
	tier: NegotiationTier
): number {
	if (argumentType === 'pitfall') {
		return -1;
	}

	if (argumentType === 'motivation') {
		if (tier === 1) return -1;
		if (tier === 2) return -1;
		if (tier === 3) return 0;
	}

	if (argumentType === 'no_motivation') {
		return -1; // All tiers
	}

	return 0;
}

/**
 * Map interest level to negotiation outcome.
 *
 * Outcomes:
 * - 0-1: failure
 * - 2: minor_favor
 * - 3-4: major_favor
 * - 5: alliance
 */
export function getOutcomeForInterest(interest: number): NegotiationOutcome {
	if (interest <= 1) return 'failure';
	if (interest === 2) return 'minor_favor';
	if (interest <= 4) return 'major_favor';
	return 'alliance'; // interest === 5
}

// ============================================================================
// Negotiation Repository
// ============================================================================

export const negotiationRepository = {
	// Export helper functions for testing
	calculateInterestChange,
	calculatePatienceChange,
	getOutcomeForInterest,

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	/**
	 * Get all negotiation sessions as a live query (reactive).
	 */
	getAll(): Observable<NegotiationSession[]> {
		return liveQuery(() => db.negotiationSessions.toArray());
	},

	/**
	 * Get single negotiation session by ID.
	 */
	async getById(id: string): Promise<NegotiationSession | undefined> {
		await ensureDbReady();
		return db.negotiationSessions.get(id);
	},

	/**
	 * Create a new negotiation session.
	 * Defaults: interest=2, patience=5, status='preparing'
	 */
	async create(input: CreateNegotiationInput): Promise<NegotiationSession> {
		await ensureDbReady();

		const now = new Date();

		// Initialize motivations with isKnown=false and timesUsed=0
		const motivations: NegotiationMotivation[] = input.motivations.map((m) => ({
			type: m.type,
			description: m.description,
			isKnown: false,
			timesUsed: 0
		}));

		// Initialize pitfalls with isKnown=false
		const pitfalls: NegotiationPitfall[] = input.pitfalls.map((p) => ({
			description: p.description,
			isKnown: false
		}));

		const negotiation: NegotiationSession = {
			id: nanoid(),
			name: input.name,
			description: input.description,
			npcName: input.npcName,
			status: 'preparing',
			interest: 2,
			patience: 5,
			motivations,
			pitfalls,
			arguments: [],
			createdAt: now,
			updatedAt: now
		};

		await db.negotiationSessions.add(negotiation);
		return negotiation;
	},

	/**
	 * Update negotiation session fields.
	 */
	async update(id: string, input: UpdateNegotiationInput): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		const updated: NegotiationSession = {
			...negotiation,
			...input,
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	},

	/**
	 * Delete negotiation session.
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.negotiationSessions.delete(id);
	},

	// ========================================================================
	// Lifecycle Operations
	// ========================================================================

	/**
	 * Start negotiation (preparing -> active).
	 */
	async startNegotiation(id: string): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (negotiation.status === 'active') {
			throw new Error('Negotiation is already active');
		}

		if (negotiation.status === 'completed') {
			throw new Error('Cannot start a completed negotiation');
		}

		const updated: NegotiationSession = {
			...negotiation,
			status: 'active',
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	},

	/**
	 * Complete negotiation (active -> completed).
	 * Sets outcome based on current interest level.
	 * Creates narrative event (wrapped in try/catch to prevent blocking completion).
	 */
	async completeNegotiation(id: string): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (negotiation.status !== 'active') {
			throw new Error('Negotiation is not active');
		}

		const outcome = getOutcomeForInterest(negotiation.interest);

		const updated: NegotiationSession = {
			...negotiation,
			status: 'completed',
			outcome,
			completedAt: new Date(),
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);

		// Create narrative event (non-blocking)
		try {
			await createFromNegotiation(updated);
		} catch (error) {
			console.error('Failed to create narrative event for negotiation:', error);
		}

		return updated;
	},

	/**
	 * Reopen completed negotiation (completed -> active).
	 * Clears outcome and completedAt, preserves arguments and interest/patience.
	 */
	async reopenNegotiation(id: string): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (negotiation.status !== 'completed') {
			throw new Error('Negotiation is not completed');
		}

		const updated: NegotiationSession = {
			...negotiation,
			status: 'active',
			outcome: undefined,
			completedAt: undefined,
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Argument Recording
	// ========================================================================

	/**
	 * Record an argument in the negotiation.
	 * Updates interest and patience based on argument type and tier.
	 * Auto-completes if interest hits 0/5 or patience hits 0.
	 */
	async recordArgument(id: string, input: RecordArgumentInput): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (negotiation.status !== 'active') {
			throw new Error('Negotiation is not active');
		}

		// Calculate changes
		const interestChange = calculateInterestChange(input.type, input.tier);
		const patienceChange = calculatePatienceChange(input.type, input.tier);

		// Create argument record
		const argument: NegotiationArgument = {
			id: nanoid(),
			type: input.type,
			tier: input.tier,
			description: input.description,
			motivationType: input.motivationType,
			interestChange,
			patienceChange,
			playerName: input.playerName,
			notes: input.notes,
			createdAt: new Date()
		};

		// Update interest and patience (with bounds 0-5)
		let newInterest = negotiation.interest + interestChange;
		let newPatience = negotiation.patience + patienceChange;

		// Clamp values
		newInterest = Math.max(0, Math.min(5, newInterest));
		newPatience = Math.max(0, Math.min(5, newPatience));

		// Add argument to list
		const updatedArguments = [...negotiation.arguments, argument];

		// Check for auto-completion
		const shouldAutoComplete = newInterest === 0 || newInterest === 5 || newPatience === 0;

		let updated: NegotiationSession;

		if (shouldAutoComplete) {
			// Auto-complete with outcome based on current interest
			const outcome = getOutcomeForInterest(newInterest);
			updated = {
				...negotiation,
				arguments: updatedArguments,
				interest: newInterest,
				patience: newPatience,
				status: 'completed',
				outcome,
				completedAt: new Date(),
				updatedAt: new Date()
			};
		} else {
			// Continue negotiation
			updated = {
				...negotiation,
				arguments: updatedArguments,
				interest: newInterest,
				patience: newPatience,
				updatedAt: new Date()
			};
		}

		await db.negotiationSessions.put(updated);

		// Create narrative event if auto-completed (non-blocking)
		if (shouldAutoComplete) {
			try {
				await createFromNegotiation(updated);
			} catch (error) {
				console.error('Failed to create narrative event for auto-completed negotiation:', error);
			}
		}

		return updated;
	},

	// ========================================================================
	// Motivation and Pitfall Management
	// ========================================================================

	/**
	 * Reveal a motivation (mark as known).
	 */
	async revealMotivation(id: string, index: number): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (index < 0 || index >= negotiation.motivations.length) {
			throw new Error(`Invalid motivation index: ${index}`);
		}

		const motivations = [...negotiation.motivations];
		motivations[index] = {
			...motivations[index],
			isKnown: true
		};

		const updated: NegotiationSession = {
			...negotiation,
			motivations,
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	},

	/**
	 * Reveal a pitfall (mark as known).
	 */
	async revealPitfall(id: string, index: number): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		if (index < 0 || index >= negotiation.pitfalls.length) {
			throw new Error(`Invalid pitfall index: ${index}`);
		}

		const pitfalls = [...negotiation.pitfalls];
		pitfalls[index] = {
			...pitfalls[index],
			isKnown: true
		};

		const updated: NegotiationSession = {
			...negotiation,
			pitfalls,
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	},

	/**
	 * Mark a motivation as used (increment timesUsed).
	 */
	async markMotivationUsed(id: string, motivationType: MotivationType): Promise<NegotiationSession> {
		await ensureDbReady();

		const negotiation = await db.negotiationSessions.get(id);
		if (!negotiation) {
			throw new Error(`Negotiation session ${id} not found`);
		}

		const motivationIndex = negotiation.motivations.findIndex((m) => m.type === motivationType);
		if (motivationIndex === -1) {
			throw new Error(`Motivation type ${motivationType} not found in negotiation`);
		}

		const motivations = [...negotiation.motivations];
		motivations[motivationIndex] = {
			...motivations[motivationIndex],
			timesUsed: motivations[motivationIndex].timesUsed + 1
		};

		const updated: NegotiationSession = {
			...negotiation,
			motivations,
			updatedAt: new Date()
		};

		await db.negotiationSessions.put(updated);
		return updated;
	}
};
