/**
 * Montage Repository
 *
 * Manages montage sessions in IndexedDB for Draw Steel RPG montage tracking.
 *
 * Features:
 * - Montage lifecycle (start, complete, reopen)
 * - Challenge tracking with success/failure counts
 * - Limit calculation based on player count and difficulty
 * - Outcome calculation (total success, partial success, total failure)
 * - Victory point awards
 * - Round tracking (1-2 rounds of challenges)
 * - Auto-completion when outcome is reached
 */

import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type {
	MontageSession,
	CreateMontageInput,
	UpdateMontageInput,
	RecordChallengeResultInput,
	MontageDifficulty,
	MontageOutcome,
	MontageLimits,
	MontageChallenge,
	PredefinedChallenge
} from '$lib/types/montage';
import { nanoid } from 'nanoid';
import { createFromMontage } from '$lib/services/narrativeEventService';

// ============================================================================
// Helper Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate success and failure limits based on difficulty and player count.
 *
 * Draw Steel Rules:
 * - Easy: successLimit = playerCount, failureLimit = playerCount
 * - Moderate: successLimit = playerCount + 1, failureLimit = max(2, playerCount - 1)
 * - Hard: successLimit = playerCount + 2, failureLimit = max(2, playerCount - 2)
 */
export function calculateLimits(difficulty: MontageDifficulty, playerCount: number): MontageLimits {
	let successLimit: number;
	let failureLimit: number;

	switch (difficulty) {
		case 'easy':
			successLimit = playerCount;
			failureLimit = playerCount;
			break;
		case 'moderate':
			successLimit = playerCount + 1;
			failureLimit = Math.max(2, playerCount - 1);
			break;
		case 'hard':
			successLimit = playerCount + 2;
			failureLimit = Math.max(2, playerCount - 2);
			break;
	}

	return { successLimit, failureLimit };
}

/**
 * Calculate outcome based on current success/failure counts and limits.
 *
 * Rules:
 * - Total Success: successes >= successLimit (takes priority)
 * - Partial Success: failures >= failureLimit AND successes >= failures + 2
 * - Total Failure: failures >= failureLimit AND NOT (successes >= failures + 2)
 * - null: Neither limit reached yet
 */
export function calculateOutcome(params: {
	successCount: number;
	failureCount: number;
	successLimit: number;
	failureLimit: number;
}): MontageOutcome | null {
	const { successCount, failureCount, successLimit, failureLimit } = params;

	// Check total success first (priority)
	if (successCount >= successLimit) {
		return 'total_success';
	}

	// Check failure limit
	if (failureCount >= failureLimit) {
		// Check for partial success
		if (successCount >= failureCount + 2) {
			return 'partial_success';
		}
		// Otherwise total failure
		return 'total_failure';
	}

	// No outcome reached yet
	return null;
}

/**
 * Get victory points for an outcome based on difficulty.
 *
 * VP Awards:
 * - Easy: total success = 1, partial success = 0, total failure = 0
 * - Moderate: total success = 1, partial success = 0, total failure = 0
 * - Hard: total success = 2, partial success = 1, total failure = 0
 */
export function getVictoriesForOutcome(
	difficulty: MontageDifficulty,
	outcome: MontageOutcome
): number {
	if (outcome === 'total_failure') {
		return 0;
	}

	if (difficulty === 'hard') {
		return outcome === 'total_success' ? 2 : 1; // partial success = 1
	}

	// Easy and Moderate
	return outcome === 'total_success' ? 1 : 0; // partial success = 0
}

// ============================================================================
// Montage Repository
// ============================================================================

export const montageRepository = {
	// Export helper functions for testing
	calculateLimits,
	calculateOutcome,
	getVictoriesForOutcome,

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	/**
	 * Get all montage sessions as a live query (reactive).
	 */
	getAll(): Observable<MontageSession[]> {
		return liveQuery(() => db.montageSessions.toArray());
	},

	/**
	 * Get single montage session by ID.
	 */
	async getById(id: string): Promise<MontageSession | undefined> {
		await ensureDbReady();
		return db.montageSessions.get(id);
	},

	/**
	 * Create a new montage session.
	 */
	async create(input: CreateMontageInput): Promise<MontageSession> {
		await ensureDbReady();

		const limits = calculateLimits(input.difficulty, input.playerCount);
		const now = new Date();

		// Generate IDs for predefined challenges if provided
		let predefinedChallenges = undefined;
		if (input.predefinedChallenges !== undefined) {
			predefinedChallenges = input.predefinedChallenges.map((pc) => ({
				...pc,
				id: nanoid()
			}));
		}

		const montage: MontageSession = {
			id: nanoid(),
			name: input.name,
			description: input.description,
			status: 'preparing',
			difficulty: input.difficulty,
			playerCount: input.playerCount,
			successLimit: limits.successLimit,
			failureLimit: limits.failureLimit,
			challenges: [],
			successCount: 0,
			failureCount: 0,
			currentRound: 1,
			victoryPoints: 0,
			predefinedChallenges,
			createdAt: now,
			updatedAt: now
		};

		await db.montageSessions.add(montage);
		return montage;
	},

	/**
	 * Update montage session fields.
	 * Recalculates limits if difficulty or playerCount changes.
	 */
	async update(id: string, input: UpdateMontageInput): Promise<MontageSession> {
		await ensureDbReady();

		const montage = await db.montageSessions.get(id);
		if (!montage) {
			throw new Error(`Montage session ${id} not found`);
		}

		// Extract predefinedChallenges from input to handle separately
		const { predefinedChallenges: inputChallenges, ...otherInputs } = input;

		// Apply updates (excluding predefinedChallenges)
		const updated: MontageSession = {
			...montage,
			...otherInputs,
			updatedAt: new Date()
		};

		// Handle predefined challenges - generate IDs for those without, preserve existing IDs
		if (inputChallenges !== undefined) {
			const processedChallenges = inputChallenges.map((challenge) => {
				if ('id' in challenge && challenge.id) {
					return challenge as PredefinedChallenge;
				}
				return {
					...challenge,
					id: nanoid()
				};
			});
			updated.predefinedChallenges = processedChallenges;
		}

		// Recalculate limits if difficulty or playerCount changed
		if (input.difficulty !== undefined || input.playerCount !== undefined) {
			const limits = calculateLimits(updated.difficulty, updated.playerCount);
			updated.successLimit = limits.successLimit;
			updated.failureLimit = limits.failureLimit;
		}

		await db.montageSessions.put(updated);
		return updated;
	},

	/**
	 * Delete montage session.
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.montageSessions.delete(id);
	},

	// ========================================================================
	// Lifecycle Operations
	// ========================================================================

	/**
	 * Start montage (preparing -> active).
	 */
	async startMontage(id: string): Promise<MontageSession> {
		await ensureDbReady();

		const montage = await db.montageSessions.get(id);
		if (!montage) {
			throw new Error(`Montage session ${id} not found`);
		}

		if (montage.status === 'active') {
			throw new Error('Montage is already active');
		}

		if (montage.status === 'completed') {
			throw new Error('Cannot start a completed montage');
		}

		const updated: MontageSession = {
			...montage,
			status: 'active',
			updatedAt: new Date()
		};

		await db.montageSessions.put(updated);
		return updated;
	},

	/**
	 * Complete montage (active -> completed).
	 * Calculates and awards victory points based on outcome.
	 * Creates a narrative event from the completed montage (Issue #399).
	 */
	async completeMontage(id: string, outcome: MontageOutcome): Promise<MontageSession> {
		await ensureDbReady();

		const montage = await db.montageSessions.get(id);
		if (!montage) {
			throw new Error(`Montage session ${id} not found`);
		}

		if (montage.status !== 'active') {
			throw new Error('Montage is not active');
		}

		const victoryPoints = getVictoriesForOutcome(montage.difficulty, outcome);

		const updated: MontageSession = {
			...montage,
			status: 'completed',
			outcome,
			victoryPoints,
			completedAt: new Date(),
			updatedAt: new Date()
		};

		await db.montageSessions.put(updated);

		// Create narrative event from completed montage
		// Use try/catch so narrative event creation failure doesn't block montage completion
		try {
			await createFromMontage(updated);
		} catch (error) {
			console.error('Failed to create narrative event for montage:', error);
		}

		return updated;
	},

	/**
	 * Reopen completed montage (completed -> active).
	 * Clears outcome and victory points, preserves challenges.
	 */
	async reopenMontage(id: string): Promise<MontageSession> {
		await ensureDbReady();

		const montage = await db.montageSessions.get(id);
		if (!montage) {
			throw new Error(`Montage session ${id} not found`);
		}

		if (montage.status !== 'completed') {
			throw new Error('Montage is not completed');
		}

		const updated: MontageSession = {
			...montage,
			status: 'active',
			outcome: undefined,
			victoryPoints: 0,
			completedAt: undefined,
			updatedAt: new Date()
		};

		await db.montageSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Challenge Recording
	// ========================================================================

	/**
	 * Record a challenge result.
	 * Updates success/failure counts, advances rounds, and auto-completes if outcome is reached.
	 */
	async recordChallengeResult(
		id: string,
		input: RecordChallengeResultInput
	): Promise<MontageSession> {
		await ensureDbReady();

		const montage = await db.montageSessions.get(id);
		if (!montage) {
			throw new Error(`Montage session ${id} not found`);
		}

		if (montage.status !== 'active') {
			throw new Error('Montage is not active');
		}

		// Create new challenge
		const challenge: MontageChallenge = {
			id: nanoid(),
			round: montage.currentRound,
			result: input.result,
			description: input.description,
			playerName: input.playerName,
			notes: input.notes,
			predefinedChallengeId: input.predefinedChallengeId
		};

		// Update counts
		let successCount = montage.successCount;
		let failureCount = montage.failureCount;

		if (input.result === 'success') {
			successCount++;
		} else if (input.result === 'failure') {
			failureCount++;
		}
		// Skip doesn't affect counts

		// Add challenge to list
		const challenges = [...montage.challenges, challenge];

		// Calculate how many challenges in current round
		const challengesInCurrentRound = challenges.filter((c) => c.round === montage.currentRound).length;

		// Advance to round 2 after playerCount challenges in round 1
		let currentRound = montage.currentRound;
		if (currentRound === 1 && challengesInCurrentRound >= montage.playerCount) {
			currentRound = 2;
		}

		// Check if outcome is reached
		const outcome = calculateOutcome({
			successCount,
			failureCount,
			successLimit: montage.successLimit,
			failureLimit: montage.failureLimit
		});

		let updated: MontageSession;

		if (outcome) {
			// Auto-complete with outcome
			const victoryPoints = getVictoriesForOutcome(montage.difficulty, outcome);
			updated = {
				...montage,
				challenges,
				successCount,
				failureCount,
				currentRound,
				status: 'completed',
				outcome,
				victoryPoints,
				completedAt: new Date(),
				updatedAt: new Date()
			};
		} else {
			// Continue montage
			updated = {
				...montage,
				challenges,
				successCount,
				failureCount,
				currentRound,
				updatedAt: new Date()
			};
		}

		await db.montageSessions.put(updated);

		// Create narrative event if auto-completed
		if (outcome) {
			try {
				await createFromMontage(updated);
			} catch (error) {
				console.error('Failed to create narrative event for montage:', error);
			}
		}

		return updated;
	}
};
