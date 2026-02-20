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
	RespiteHero,
	RespiteActivityStatus,
	CreateRespiteActivityInput
} from '$lib/types/respite';
import type { BaseEntity } from '$lib/types';
import * as respiteActivityService from '$lib/services/respiteActivityService';
import { getErrorMessage } from '$lib/utils/errors';

function createRespiteStore() {
	// ========================================================================
	// State
	// ========================================================================

	let respites = $state<RespiteSession[]>([]);
	let activeRespite = $state<RespiteSession | null>(null);
	let activityEntities = $state<BaseEntity[]>([]);
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
	// Helper to Load Activity Entities
	// ========================================================================

	/**
	 * Load activity entities for the active respite.
	 * Called internally after respite selection or activity modifications.
	 */
	async function loadActivityEntities(respite: RespiteSession | null): Promise<void> {
		if (!respite || respite.activityIds.length === 0) {
			activityEntities = [];
			return;
		}

		try {
			const entities = await respiteActivityService.getActivitiesForRespite(
				respite.activityIds
			);
			activityEntities = entities;
		} catch (err) {
			console.error('Failed to load activity entities:', err);
			activityEntities = [];
		}
	}

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
	 * Activities by status (from loaded entity state).
	 */
	const pendingActivities = $derived.by((): BaseEntity[] => {
		return activityEntities.filter((a) => a.fields.activityStatus === 'pending');
	});

	const inProgressActivities = $derived.by((): BaseEntity[] => {
		return activityEntities.filter((a) => a.fields.activityStatus === 'in_progress');
	});

	const completedActivities = $derived.by((): BaseEntity[] => {
		return activityEntities.filter((a) => a.fields.activityStatus === 'completed');
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
	 * NOTE: This is now an approximation based on activityIds count.
	 * For accurate stats, activities should be loaded as entities.
	 */
	const totalActivitiesCompleted = $derived.by((): number => {
		// This is a placeholder - to get accurate count, we'd need to load all activity entities
		// For now, just count total activity IDs in completed respites
		return respites
			.filter((r) => r.status === 'completed')
			.reduce((sum, r) => sum + r.activityIds.length, 0);
	});

	/**
	 * Activity type distribution across all respites.
	 * NOTE: This requires loading all activity entities for accuracy.
	 * Currently returns empty distribution - should be computed when needed.
	 */
	const activityTypeDistribution = $derived.by((): Record<string, number> => {
		// This is a placeholder - requires loading all activity entities
		// For proper implementation, consider a dedicated service method
		return {};
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
			await loadActivityEntities(activeRespite);
		} catch (err: unknown) {
			error = getErrorMessage(err);
			activeRespite = null;
			activityEntities = [];
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function deleteRespite(id: string): Promise<void> {
		try {
			error = null;
			await respiteRepository.delete(id);
			clearActiveRespiteIfMatch(id);
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function completeRespite(id: string): Promise<RespiteSession> {
		try {
			error = null;
			// Use the service method that handles narrative event creation
			await respiteActivityService.completeRespiteWithNarrative(id);

			// Reload respite to get updated state
			const updated = await respiteRepository.getById(id);
			if (!updated) {
				throw new Error(`Respite ${id} not found after completion`);
			}

			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function removeHero(id: string, heroId: string): Promise<RespiteSession> {
		try {
			error = null;
			const updated = await respiteRepository.removeHero(id, heroId);
			updateActiveRespiteIfMatch(updated);
			return updated;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	// ========================================================================
	// Activity Management
	// ========================================================================

	async function createActivity(
		respiteId: string,
		input: CreateRespiteActivityInput,
		campaignId: string
	): Promise<BaseEntity> {
		try {
			error = null;
			const entity = await respiteActivityService.createRespiteActivity(
				respiteId,
				input,
				campaignId
			);

			// Reload active respite to update activityIds and activity entities
			if (activeRespite && activeRespite.id === respiteId) {
				const updated = await respiteRepository.getById(respiteId);
				if (updated) {
					activeRespite = updated;
					await loadActivityEntities(activeRespite);
				}
			}

			return entity;
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function updateActivityStatus(
		activityEntityId: string,
		status: RespiteActivityStatus,
		outcome?: string
	): Promise<void> {
		try {
			error = null;
			await respiteActivityService.updateActivityStatus(activityEntityId, status, outcome);

			// Reload activity entities to reflect the change
			await loadActivityEntities(activeRespite);
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function updateActivityProgress(activityEntityId: string, progress: string): Promise<void> {
		try {
			error = null;
			await respiteActivityService.updateActivityProgress(activityEntityId, progress);

			// Reload activity entities to reflect the change
			await loadActivityEntities(activeRespite);
		} catch (err: unknown) {
			error = getErrorMessage(err);
			throw err;
		}
	}

	async function deleteActivity(respiteId: string, activityEntityId: string): Promise<void> {
		try {
			error = null;
			await respiteActivityService.deleteRespiteActivity(respiteId, activityEntityId);

			// Reload active respite to update activityIds and activity entities
			if (activeRespite && activeRespite.id === respiteId) {
				const updated = await respiteRepository.getById(respiteId);
				if (updated) {
					activeRespite = updated;
					await loadActivityEntities(activeRespite);
				}
			}
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		} catch (err: unknown) {
			error = getErrorMessage(err);
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
		get activityEntities() {
			return activityEntities;
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
		createActivity,
		updateActivityStatus,
		updateActivityProgress,
		deleteActivity,

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
