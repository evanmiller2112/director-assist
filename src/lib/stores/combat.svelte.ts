/**
 * Combat Store (Svelte 5 Runes)
 *
 * Reactive state management for Draw Steel combat sessions.
 *
 * Features:
 * - Reactive combat list with live queries
 * - Active combat selection
 * - Derived values for UI (current combatant, initiative list, etc.)
 * - All repository operations wrapped with reactive state updates
 * - Loading and error state management
 */

import { combatRepository } from '$lib/db/repositories';
import type {
	CombatSession,
	CreateCombatInput,
	UpdateCombatInput,
	AddHeroCombatantInput,
	AddCreatureCombatantInput,
	AddQuickCombatantInput,
	UpdateCombatantInput,
	Combatant,
	AddConditionInput,
	AddLogEntryInput,
	LogPowerRollInput
} from '$lib/types/combat';

function createCombatStore() {
	// ========================================================================
	// State
	// ========================================================================

	let combats = $state<CombatSession[]>([]);
	let activeCombat = $state<CombatSession | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// ========================================================================
	// Initialize live query subscription
	// ========================================================================

	let unsubscribe: (() => void) | undefined;

	// Subscribe to all combats
	const subscription = combatRepository.getAll().subscribe({
		next: (data) => {
			combats = data;
			isLoading = false;
		},
		error: (err) => {
			console.error('Combat store subscription error:', err);
			error = err.message;
			isLoading = false;
		}
	});

	unsubscribe = () => subscription.unsubscribe();

	// ========================================================================
	// Derived Values
	// ========================================================================

	/**
	 * Active combats (status: active or paused).
	 */
	const activeCombats = $derived.by(() => {
		return combats.filter((c) => c.status === 'active' || c.status === 'paused');
	});

	/**
	 * Current combatant in active combat.
	 */
	const currentCombatant = $derived.by((): Combatant | null => {
		if (!activeCombat || activeCombat.combatants.length === 0) {
			return null;
		}
		return activeCombat.combatants[activeCombat.currentTurn] || null;
	});

	/**
	 * Combatants sorted by initiative (highest first).
	 */
	const sortedCombatants = $derived.by((): Combatant[] => {
		if (!activeCombat) {
			return [];
		}
		return [...activeCombat.combatants].sort((a, b) => b.initiative - a.initiative);
	});

	/**
	 * Hero combatants in active combat.
	 */
	const heroes = $derived.by((): Combatant[] => {
		if (!activeCombat) {
			return [];
		}
		return activeCombat.combatants.filter((c) => c.type === 'hero');
	});

	/**
	 * Creature combatants in active combat.
	 */
	const creatures = $derived.by((): Combatant[] => {
		if (!activeCombat) {
			return [];
		}
		return activeCombat.combatants.filter((c) => c.type === 'creature');
	});

	// ========================================================================
	// Helper Methods
	// ========================================================================

	/**
	 * Update active combat if it matches the updated combat ID.
	 */
	function updateActiveCombatIfMatch(updated: CombatSession) {
		if (activeCombat && activeCombat.id === updated.id) {
			activeCombat = updated;
		}
	}

	/**
	 * Clear active combat if it matches the combat ID.
	 */
	function clearActiveCombatIfMatch(combatId: string) {
		if (activeCombat && activeCombat.id === combatId) {
			activeCombat = null;
		}
	}

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	async function createCombat(input: CreateCombatInput): Promise<CombatSession> {
		try {
			error = null;
			isLoading = true;
			const combat = await combatRepository.create(input);
			return combat;
		} catch (err: any) {
			error = err.message;
			throw err;
		} finally {
			isLoading = false;
		}
	}

	async function selectCombat(id: string): Promise<void> {
		try {
			error = null;
			isLoading = true;
			const combat = await combatRepository.getById(id);
			activeCombat = combat || null;
		} catch (err: any) {
			error = err.message;
			activeCombat = null;
		} finally {
			isLoading = false;
		}
	}

	async function updateCombat(id: string, input: UpdateCombatInput): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.update(id, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function deleteCombat(id: string): Promise<void> {
		try {
			error = null;
			await combatRepository.delete(id);
			clearActiveCombatIfMatch(id);
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Combat Lifecycle
	// ========================================================================

	async function startCombat(id: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.startCombat(id);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function pauseCombat(id: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.pauseCombat(id);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function resumeCombat(id: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.resumeCombat(id);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function endCombat(id: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.endCombat(id);
			if (activeCombat && activeCombat.id === id) {
				activeCombat = null;
			}
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function reopenCombat(id: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.reopenCombat(id);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Combatant Management
	// ========================================================================

	async function addHero(combatId: string, input: AddHeroCombatantInput): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addHeroCombatant(combatId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function addCreature(
		combatId: string,
		input: AddCreatureCombatantInput
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addCreatureCombatant(combatId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	/**
	 * Add quick combatant with minimal information (Issue #233).
	 *
	 * Simplified entry requiring only name and HP.
	 * Auto-numbers duplicates and sets isAdHoc flag.
	 *
	 * @param combatId - Combat session ID
	 * @param input - Quick combatant data (name, type, hp required)
	 * @returns Updated combat session
	 */
	async function addQuickCombatant(
		combatId: string,
		input: AddQuickCombatantInput
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addQuickCombatant(combatId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function updateCombatant(
		combatId: string,
		combatantId: string,
		input: UpdateCombatantInput
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.updateCombatant(combatId, combatantId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function removeCombatant(combatId: string, combatantId: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.removeCombatant(combatId, combatantId);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function moveCombatantToPosition(
		combatId: string,
		combatantId: string,
		newPosition: number
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.moveCombatantToPosition(
				combatId,
				combatantId,
				newPosition
			);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function rollInitiative(
		combatId: string,
		combatantId: string,
		modifier?: number
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.rollInitiative(combatId, combatantId, modifier);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function rollInitiativeForAll(combatId: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.rollInitiativeForAll(combatId);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Turn Management
	// ========================================================================

	async function nextTurn(combatId: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.nextTurn(combatId);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function previousTurn(combatId: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.previousTurn(combatId);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// HP Management
	// ========================================================================

	async function applyDamage(
		combatId: string,
		combatantId: string,
		damage: number,
		source?: string
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.applyDamage(combatId, combatantId, damage, source);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function applyHealing(
		combatId: string,
		combatantId: string,
		healing: number,
		source?: string
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.applyHealing(
				combatId,
				combatantId,
				healing,
				source
			);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function addTemporaryHp(
		combatId: string,
		combatantId: string,
		tempHp: number
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addTemporaryHp(combatId, combatantId, tempHp);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Condition Management
	// ========================================================================

	async function addCondition(
		combatId: string,
		combatantId: string,
		condition: AddConditionInput
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addCondition(combatId, combatantId, condition);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function removeCondition(
		combatId: string,
		combatantId: string,
		conditionName: string
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.removeCondition(combatId, combatantId, conditionName);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Hero Points
	// ========================================================================

	async function addHeroPoints(combatId: string, points: number): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addHeroPoints(combatId, points);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function spendHeroPoint(combatId: string): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.spendHeroPoint(combatId);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Victory Points
	// ========================================================================

	async function addVictoryPoints(
		combatId: string,
		points: number,
		reason?: string
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addVictoryPoints(combatId, points, reason);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function removeVictoryPoints(
		combatId: string,
		points: number,
		reason?: string
	): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.removeVictoryPoints(combatId, points, reason);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Combat Log
	// ========================================================================

	async function addLogEntry(combatId: string, input: AddLogEntryInput): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.addLogEntry(combatId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	async function logPowerRoll(combatId: string, input: LogPowerRollInput): Promise<CombatSession> {
		try {
			error = null;
			const updated = await combatRepository.logPowerRoll(combatId, input);
			updateActiveCombatIfMatch(updated);
			return updated;
		} catch (err: any) {
			error = err.message;
			throw err;
		}
	}

	// ========================================================================
	// Helper Methods for UI
	// ========================================================================

	function getCombatantById(combatantId: string): Combatant | undefined {
		if (!activeCombat) {
			return undefined;
		}
		return activeCombat.combatants.find((c) => c.id === combatantId);
	}

	function isHeroTurn(): boolean {
		return currentCombatant?.type === 'hero';
	}

	function clearError(): void {
		error = null;
	}

	// ========================================================================
	// Return Store API
	// ========================================================================

	return {
		// State (reactive)
		get combats() {
			return combats;
		},
		getAll: () => combats,
		get activeCombat() {
			return activeCombat;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		// Derived values (reactive)
		get activeCombats() {
			return activeCombats;
		},
		get currentCombatant() {
			return currentCombatant;
		},
		get sortedCombatants() {
			return sortedCombatants;
		},
		get heroes() {
			return heroes;
		},
		get creatures() {
			return creatures;
		},

		// CRUD
		createCombat,
		selectCombat,
		updateCombat,
		deleteCombat,

		// Lifecycle
		startCombat,
		pauseCombat,
		resumeCombat,
		endCombat,
		reopenCombat,

		// Combatants
		addHero,
		addCreature,
		addQuickCombatant,
		updateCombatant,
		removeCombatant,
		moveCombatantToPosition,
		rollInitiative,
		rollInitiativeForAll,

		// Turns
		nextTurn,
		previousTurn,

		// HP
		applyDamage,
		applyHealing,
		addTemporaryHp,

		// Conditions
		addCondition,
		removeCondition,

		// Hero Points
		addHeroPoints,
		spendHeroPoint,

		// Victory Points
		addVictoryPoints,
		removeVictoryPoints,

		// Log
		addLogEntry,
		logPowerRoll,

		// Helpers
		getCombatantById,
		isHeroTurn,
		clearError,

		// Cleanup
		destroy: () => {
			if (unsubscribe) {
				unsubscribe();
			}
		},

		/**
		 * Reset store to initial state
		 * Used when clearing all data or resetting application state
		 */
		reset: () => {
			combats = [];
			activeCombat = null;
			isLoading = true;
			error = null;
		},

		/**
		 * Load combats from database
		 * Re-subscribes to the live query
		 */
		load: async () => {
			// The live query subscription is already active from initialization
			// This method exists for consistency with other stores
			// The subscription will automatically update the combats array
			// No additional action needed
			return Promise.resolve();
		}
	};
}

export const combatStore = createCombatStore();
