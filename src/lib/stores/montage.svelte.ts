/**
 * Montage Store (Svelte 5 Runes)
 *
 * Reactive state management for Draw Steel montage sessions.
 *
 * Features:
 * - Reactive montage list with live queries
 * - Active montage selection
 * - Derived values for UI (current challenge, progress, outcome status, etc.)
 * - All repository operations wrapped with reactive state updates
 * - Loading and error state management
 */

import { montageRepository } from '$lib/db/repositories';
import type {
	MontageSession,
	CreateMontageInput,
	UpdateMontageInput,
	RecordChallengeResultInput,
	MontageOutcome,
	MontageChallenge
} from '$lib/types/montage';
import { getErrorMessage } from '$lib/utils/errors';

function createMontageStore() {
	// ========================================================================
	// State
	// ========================================================================

	let montages = $state<MontageSession[]>([]);
	let activeMontage = $state<MontageSession | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// ========================================================================
	// Initialize live query subscription
	// ========================================================================

	let unsubscribe: (() => void) | undefined;

	// Subscribe to all montages
	const subscription = montageRepository.getAll().subscribe({
		next: (data) => {
			montages = data;
			isLoading = false;
		},
		error: (err) => {
			console.error('Montage store subscription error:', err);
			error = err.message;
			isLoading = false;
		}
	});

	unsubscribe = () => subscription.unsubscribe();

	// ========================================================================
	// Derived Values
	// ========================================================================

	/**
	 * Active montages (status: active).
	 */
	const activeMontages = $derived.by(() => {
		return montages.filter((m) => m.status === 'active');
	});

	/**
	 * Current challenge number (1-based index).
	 */
	const currentChallengeIndex = $derived.by((): number => {
		if (!activeMontage) {
			return 1;
		}
		return activeMontage.challenges.length + 1;
	});

	/**
	 * Current challenge (always returns info for next challenge).
	 */
	const currentChallenge = $derived.by((): { round: 1 | 2; number: number } | null => {
		if (!activeMontage) {
			return null;
		}
		return {
			round: activeMontage.currentRound,
			number: currentChallengeIndex
		};
	});

	/**
	 * Progress percentage (0-100).
	 * Based on whichever is closer to completion (success or failure).
	 */
	const progressPercent = $derived.by((): number => {
		if (!activeMontage) {
			return 0;
		}

		const successPercent = (activeMontage.successCount / activeMontage.successLimit) * 100;
		const failurePercent = (activeMontage.failureCount / activeMontage.failureLimit) * 100;
		const maxPercent = Math.max(successPercent, failurePercent);

		return Math.min(maxPercent, 100);
	});

	/**
	 * Whether an outcome has been reached.
	 */
	const isOutcomeReached = $derived.by((): boolean => {
		if (!activeMontage) {
			return false;
		}

		return (
			activeMontage.successCount >= activeMontage.successLimit ||
			activeMontage.failureCount >= activeMontage.failureLimit
		);
	});

	/**
	 * Challenges from round 1.
	 */
	const round1Challenges = $derived.by((): MontageChallenge[] => {
		if (!activeMontage) {
			return [];
		}
		return activeMontage.challenges.filter((c) => c.round === 1);
	});

	/**
	 * Challenges from round 2.
	 */
	const round2Challenges = $derived.by((): MontageChallenge[] => {
		if (!activeMontage) {
			return [];
		}
		return activeMontage.challenges.filter((c) => c.round === 2);
	});

	/**
	 * Predefined challenges that have not been resolved yet.
	 * A challenge is considered resolved if it has been attempted at least once.
	 */
	const unresolvedPredefinedChallenges = $derived.by(() => {
		if (!activeMontage?.predefinedChallenges) {
			return [];
		}
		const resolvedIds = new Set(
			activeMontage.challenges
				.filter((c) => c.predefinedChallengeId)
				.map((c) => c.predefinedChallengeId)
		);
		return activeMontage.predefinedChallenges.filter((pc) => !resolvedIds.has(pc.id));
	});

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Update active montage if it matches the updated montage ID.
	 */
	function updateActiveMontageIfMatch(updated: MontageSession) {
		if (activeMontage && activeMontage.id === updated.id) {
			activeMontage = updated;
		}
	}

	/**
	 * Clear active montage if it matches the montage ID.
	 */
	function clearActiveMontageIfMatch(montageId: string) {
		if (activeMontage && activeMontage.id === montageId) {
			activeMontage = null;
		}
	}

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	async function createMontage(input: CreateMontageInput): Promise<MontageSession> {
		try {
			error = null;
			isLoading = true;
			const montage = await montageRepository.create(input);
			return montage;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		} finally {
			isLoading = false;
		}
	}

	async function selectMontage(id: string): Promise<void> {
		try {
			error = null;
			isLoading = true;
			const montage = await montageRepository.getById(id);
			activeMontage = montage || null;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			activeMontage = null;
		} finally {
			isLoading = false;
		}
	}

	async function updateMontage(id: string, input: UpdateMontageInput): Promise<MontageSession> {
		try {
			error = null;
			const updated = await montageRepository.update(id, input);
			updateActiveMontageIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function deleteMontage(id: string): Promise<void> {
		try {
			error = null;
			await montageRepository.delete(id);
			clearActiveMontageIfMatch(id);
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	// ========================================================================
	// Lifecycle Operations
	// ========================================================================

	async function startMontage(id: string): Promise<MontageSession> {
		try {
			error = null;
			const updated = await montageRepository.startMontage(id);
			updateActiveMontageIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function completeMontage(id: string, outcome: MontageOutcome): Promise<MontageSession> {
		try {
			error = null;
			const updated = await montageRepository.completeMontage(id, outcome);
			updateActiveMontageIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function reopenMontage(id: string): Promise<MontageSession> {
		try {
			error = null;
			const updated = await montageRepository.reopenMontage(id);
			updateActiveMontageIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	// ========================================================================
	// Challenge Recording
	// ========================================================================

	async function recordChallengeResult(
		id: string,
		input: RecordChallengeResultInput
	): Promise<MontageSession> {
		try {
			error = null;
			const updated = await montageRepository.recordChallengeResult(id, input);
			updateActiveMontageIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	// ========================================================================
	// Helper Methods for UI
	// ========================================================================

	function getChallengeById(challengeId: string): MontageChallenge | undefined {
		if (!activeMontage) {
			return undefined;
		}
		return activeMontage.challenges.find((c) => c.id === challengeId);
	}

	function canRecordChallenge(): boolean {
		return activeMontage?.status === 'active';
	}

	function getRemainingChallenges(): { success: number; failure: number } {
		if (!activeMontage) {
			return { success: 0, failure: 0 };
		}

		return {
			success: Math.max(0, activeMontage.successLimit - activeMontage.successCount),
			failure: Math.max(0, activeMontage.failureLimit - activeMontage.failureCount)
		};
	}

	function clearError(): void {
		error = null;
	}

	/**
	 * Get the status of a predefined challenge.
	 * Returns the most recent challenge result for the given predefined challenge ID.
	 */
	function getPredefinedChallengeStatus(predefinedChallengeId: string): MontageChallenge | undefined {
		if (!activeMontage) {
			return undefined;
		}
		// Return the most recent result for this predefined challenge
		const matches = activeMontage.challenges.filter(
			(c) => c.predefinedChallengeId === predefinedChallengeId
		);
		return matches.length > 0 ? matches[matches.length - 1] : undefined;
	}

	// ========================================================================
	// Return Store API
	// ========================================================================

	return {
		// State (reactive)
		get montages() {
			return montages;
		},
		get activeMontage() {
			return activeMontage;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		// Derived values (reactive)
		get activeMontages() {
			return activeMontages;
		},
		get currentChallengeIndex() {
			return currentChallengeIndex;
		},
		get currentChallenge() {
			return currentChallenge;
		},
		get progressPercent() {
			return progressPercent;
		},
		get isOutcomeReached() {
			return isOutcomeReached;
		},
		get round1Challenges() {
			return round1Challenges;
		},
		get round2Challenges() {
			return round2Challenges;
		},
		get unresolvedPredefinedChallenges() {
			return unresolvedPredefinedChallenges;
		},

		// CRUD
		createMontage,
		selectMontage,
		updateMontage,
		deleteMontage,

		// Lifecycle
		startMontage,
		completeMontage,
		reopenMontage,

		// Challenge Recording
		recordChallengeResult,

		// Helpers
		getChallengeById,
		canRecordChallenge,
		getRemainingChallenges,
		getPredefinedChallengeStatus,
		clearError,

		// Cleanup
		destroy: () => {
			if (unsubscribe) {
				unsubscribe();
			}
		}
	};
}

export const montageStore = createMontageStore();
