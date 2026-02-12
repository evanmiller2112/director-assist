/**
 * Respite Store (Svelte 5 Runes)
 *
 * Reactive state management for Draw Steel respite sessions.
 *
 * Features:
 * - Reactive respite list with live queries
 * - Active respite selection
 * - Derived values for UI (filtered lists, hero stats, activity stats)
 * - All repository operations wrapped with reactive state updates
 * - Loading and error state management
 */

import { respiteRepository } from '$lib/db/repositories/respiteRepository';
import type {
	RespiteSession,
	CreateRespiteInput,
	UpdateRespiteInput,
	RecordActivityInput,
	RespiteHero,
	RespiteActivity
} from '$lib/types/respite';

function createRespiteStore() {
	// ========================================================================
	// State
	// ========================================================================

	let respites = $state<RespiteSession[]>([]);
	let activeRespite = $state<RespiteSession | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// ========================================================================
	// Initialize live query subscription
	// ========================================================================

	let unsubscribe: (() => void) | undefined;

	// Subscribe to all respites
	const subscription = respiteRepository.getAll().subscribe({
		next: (data) => {
			respites = data;
			isLoading = false;
		},
		error: (err) => {
			console.error('Respite store subscription error:', err);
			error = err.message;
			isLoading = false;
		}
	});

	unsubscribe = () => subscription.unsubscribe();

	// ========================================================================
	// Derived Values
	// ========================================================================

	/**
	 * Active respites (status: active).
	 */
	const activeRespites = $derived.by(() => {
		return respites.filter((r) => r.status === 'active');
	});

	/**
	 * Preparing respites (status: preparing).
	 */
	const preparingRespites = $derived.by(() => {
		return respites.filter((r) => r.status === 'preparing');
	});

	/**
	 * Completed respites (status: completed).
	 */
	const completedRespites = $derived.by(() => {
		return respites.filter((r) => r.status === 'completed');
	});

	/**
	 * Total heroes in the active respite.
	 */
	const heroCount = $derived.by((): number => {
		if (!activeRespite) return 0;
		return activeRespite.heroes.length;
	});

	/**
	 * Heroes who have gained all recoveries (fully rested).
	 */
	const fullyRestedHeroes = $derived.by((): RespiteHero[] => {
		if (!activeRespite) return [];
		return activeRespite.heroes.filter(
			(h) => h.recoveries.current >= h.recoveries.max
		);
	});

	/**
	 * Victory points remaining to convert.
	 */
	const vpRemaining = $derived.by((): number => {
		if (!activeRespite) return 0;
		return Math.max(
			0,
			activeRespite.victoryPointsAvailable - activeRespite.victoryPointsConverted
		);
	});

	/**
	 * VP conversion percentage.
	 */
	const vpConversionPercent = $derived.by((): number => {
		if (!activeRespite || activeRespite.victoryPointsAvailable === 0) return 0;
		return (activeRespite.victoryPointsConverted / activeRespite.victoryPointsAvailable) * 100;
	});

	/**
	 * Activities by status.
	 */
	const pendingActivities = $derived.by((): RespiteActivity[] => {
		if (!activeRespite) return [];
		return activeRespite.activities.filter((a) => a.status === 'pending');
	});

	const inProgressActivities = $derived.by((): RespiteActivity[] => {
		if (!activeRespite) return [];
		return activeRespite.activities.filter((a) => a.status === 'in_progress');
	});

	const completedActivities = $derived.by((): RespiteActivity[] => {
		if (!activeRespite) return [];
		return activeRespite.activities.filter((a) => a.status === 'completed');
	});

	/**
	 * Kit swaps in the active respite.
	 */
	const kitSwapHistory = $derived.by(() => {
		if (!activeRespite) return [];
		return activeRespite.kitSwaps ?? [];
	});

	// ========================================================================
	// Analytics Derived Values
	// ========================================================================

	/**
	 * Total VP converted across all completed respites.
	 */
	const totalVPConverted = $derived.by((): number => {
		return respites
			.filter((r) => r.status === 'completed')
			.reduce((sum, r) => sum + r.victoryPointsConverted, 0);
	});

	/**
	 * Total activities completed across all respites.
	 */
	const totalActivitiesCompleted = $derived.by((): number => {
		return respites.reduce(
			(sum, r) => sum + r.activities.filter((a) => a.status === 'completed').length,
			0
		);
	});

	/**
	 * Activity type distribution across all respites.
	 */
	const activityTypeDistribution = $derived.by((): Record<string, number> => {
		const dist: Record<string, number> = {};
		for (const r of respites) {
			for (const a of r.activities) {
				dist[a.type] = (dist[a.type] || 0) + 1;
			}
		}
		return dist;
	});

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Update active respite if it matches the updated respite ID.
	 */
	function updateActiveRespiteIfMatch(updated: RespiteSession) {
		if (activeRespite && activeRespite.id === updated.id) {
			activeRespite = updated;
		}
	}

	/**
	 * Clear active respite if it matches the respite ID.
	 */
	function clearActiveRespiteIfMatch(respiteId: string) {
		if (activeRespite && activeRespite.id === respiteId) {
			activeRespite = null;
		}
	}

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	async function createRespite(input: CreateRespiteInput): Promise<RespiteSession> {
		try {
			error = null;
			isLoading = true;
			const respite = await respiteRepository.create(input);
			return respite;
		} catch (err: any) {
			error = err.message;
			throw err;
		} finally {
			isLoading = false;
		}
	}

	async function selectRespite(id: string): Promise<void> {
		try {
			error = null;
			isLoading = true;
			const respite = await respiteRepository.getById(id);
			activeRespite = respite || null;
		} catch (err: any) {
			error = err.message;
			activeRespite = null;
		} finally {
			isLoading = false;
		}
	}

	async function updateRespite(
		id: string,
		input: UpdateRespiteInput
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.update(id, input);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function deleteRespite(id: string): Promise<void> {
		try {
			error = null;
			await respiteRepository.delete(id);
			clearActiveRespiteIfMatch(id);
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Lifecycle Operations
	// ========================================================================

	async function startRespite(id: string): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.startRespite(id);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function completeRespite(id: string): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.completeRespite(id);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Hero Management
	// ========================================================================

	async function addHero(
		id: string,
		hero: { name: string; heroId?: string; recoveries: { current: number; max: number } }
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.addHero(id, hero);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function updateHero(
		id: string,
		heroId: string,
		updates: Partial<Pick<RespiteHero, 'name' | 'recoveries' | 'conditions' | 'notes'>>
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.updateHero(id, heroId, updates);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function removeHero(id: string, heroId: string): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.removeHero(id, heroId);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Activity Management
	// ========================================================================

	async function recordActivity(
		id: string,
		input: RecordActivityInput
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.recordActivity(id, input);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function updateActivity(
		id: string,
		activityId: string,
		updates: Partial<Pick<RespiteActivity, 'name' | 'description' | 'status' | 'outcome' | 'notes'>>
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.updateActivity(id, activityId, updates);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function completeActivity(
		id: string,
		activityId: string,
		outcome?: string
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.completeActivity(id, activityId, outcome);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// VP Conversion
	// ========================================================================

	async function convertVictoryPoints(
		id: string,
		amount: number
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.convertVictoryPoints(id, amount);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Kit Swap Recording
	// ========================================================================

	async function recordKitSwap(
		id: string,
		swap: { heroId: string; from: string; to: string; reason?: string }
	): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.recordKitSwap(id, swap);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Helper Methods for UI
	// ========================================================================

	function clearError(): void {
		error = null;
	}

	// ========================================================================
	// Return Store API
	// ========================================================================

	return {
		// State (reactive)
		get respites() {
			return respites;
		},
		get activeRespite() {
			return activeRespite;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		// Derived values (reactive)
		get activeRespites() {
			return activeRespites;
		},
		get preparingRespites() {
			return preparingRespites;
		},
		get completedRespites() {
			return completedRespites;
		},
		get heroCount() {
			return heroCount;
		},
		get fullyRestedHeroes() {
			return fullyRestedHeroes;
		},
		get vpRemaining() {
			return vpRemaining;
		},
		get vpConversionPercent() {
			return vpConversionPercent;
		},
		get pendingActivities() {
			return pendingActivities;
		},
		get inProgressActivities() {
			return inProgressActivities;
		},
		get completedActivities() {
			return completedActivities;
		},
		get kitSwapHistory() {
			return kitSwapHistory;
		},

		// Analytics
		get totalVPConverted() {
			return totalVPConverted;
		},
		get totalActivitiesCompleted() {
			return totalActivitiesCompleted;
		},
		get activityTypeDistribution() {
			return activityTypeDistribution;
		},

		// CRUD
		createRespite,
		selectRespite,
		updateRespite,
		deleteRespite,

		// Lifecycle
		startRespite,
		completeRespite,

		// Hero Management
		addHero,
		updateHero,
		removeHero,

		// Activity Management
		recordActivity,
		updateActivity,
		completeActivity,

		// VP Conversion
		convertVictoryPoints,

		// Kit Swap
		recordKitSwap,

		// Helpers
		clearError,

		// Cleanup
		destroy: () => {
			if (unsubscribe) {
				unsubscribe();
			}
		}
	};
}

export const respiteStore = createRespiteStore();
