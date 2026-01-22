/**
 * Montage Challenge Tracker Types for Draw Steel RPG
 *
 * This module defines the type system for the Montage Challenge Tracker,
 * implementing Draw Steel's montage mechanics:
 * - Player count-based challenge limits
 * - Success/failure tracking across two rounds
 * - Difficulty-based outcome calculations
 * - Victory point awards
 */

// ============================================================================
// Montage Difficulty
// ============================================================================

/**
 * Montage difficulty level.
 * Determines success/failure limits and victory point rewards.
 */
export type MontageDifficulty = 'easy' | 'moderate' | 'hard';

// ============================================================================
// Montage Outcome
// ============================================================================

/**
 * Outcome of a montage challenge.
 * - Total Success: Success limit reached before failure limit
 * - Partial Success: Failure limit reached, but successes >= failures + 2
 * - Total Failure: Failure limit reached without enough successes
 */
export type MontageOutcome = 'total_success' | 'partial_success' | 'total_failure';

// ============================================================================
// Montage Status
// ============================================================================

/**
 * Current status of the montage.
 * - preparing: Setup phase, challenges not yet started
 * - active: Challenges in progress
 * - completed: Montage finished with an outcome
 */
export type MontageStatus = 'preparing' | 'active' | 'completed';

// ============================================================================
// Challenge Result
// ============================================================================

/**
 * Result of an individual challenge.
 * - success: Challenge succeeded
 * - failure: Challenge failed
 * - skip: Challenge skipped (counts as neither success nor failure)
 * - pending: Challenge not yet attempted
 */
export type ChallengeResult = 'success' | 'failure' | 'skip' | 'pending';

// ============================================================================
// Montage Challenge
// ============================================================================

/**
 * Individual challenge within a montage.
 * Two rounds of challenges, tracked separately.
 */
export interface MontageChallenge {
	id: string;
	round: 1 | 2;
	result: ChallengeResult;
	description?: string;
	playerName?: string; // Hero who attempted this challenge
	notes?: string;
}

// ============================================================================
// Montage Victory Points
// ============================================================================

/**
 * Victory point configuration for a montage difficulty.
 */
export interface MontageVictoryPoints {
	totalSuccess: number;
	partialSuccess: number;
}

// ============================================================================
// Montage Limits
// ============================================================================

/**
 * Success and failure limits for a montage.
 * Calculated based on player count and difficulty.
 */
export interface MontageLimits {
	successLimit: number;
	failureLimit: number;
}

// ============================================================================
// Montage Session
// ============================================================================

/**
 * Complete montage session.
 */
export interface MontageSession {
	id: string;
	name: string;
	description?: string;
	status: MontageStatus;
	difficulty: MontageDifficulty;
	playerCount: number;
	successLimit: number;
	failureLimit: number;
	challenges: MontageChallenge[];
	successCount: number;
	failureCount: number;
	currentRound: 1 | 2;
	outcome?: MontageOutcome;
	victoryPoints: number;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
}

// ============================================================================
// Input Types for Repository Operations
// ============================================================================

/**
 * Input for creating a new montage session.
 */
export interface CreateMontageInput {
	name: string;
	description?: string;
	difficulty: MontageDifficulty;
	playerCount: number;
}

/**
 * Input for updating montage session fields.
 */
export interface UpdateMontageInput {
	name?: string;
	description?: string;
	difficulty?: MontageDifficulty;
	playerCount?: number;
}

/**
 * Input for recording a challenge result.
 */
export interface RecordChallengeResultInput {
	result: ChallengeResult;
	description?: string;
	playerName?: string;
	notes?: string;
}
