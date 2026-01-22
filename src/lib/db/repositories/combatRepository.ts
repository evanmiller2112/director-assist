/**
 * Combat Repository
 *
 * Manages combat sessions in IndexedDB for Draw Steel RPG combat tracking.
 *
 * Features:
 * - Combat lifecycle (start, pause, resume, end)
 * - Combatant management (add, update, remove)
 * - Initiative rolling (2d10 for Draw Steel)
 * - Turn management with round tracking
 * - HP/damage/healing with temporary HP
 * - Conditions with duration tracking
 * - Hero points (shared party resource)
 * - Victory points for objectives
 * - Combat logging with metadata
 * - Power roll integration
 */

import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type {
	CombatSession,
	CreateCombatInput,
	UpdateCombatInput,
	AddHeroCombatantInput,
	AddCreatureCombatantInput,
	AddQuickCombatantInput,
	UpdateCombatantInput,
	HeroCombatant,
	CreatureCombatant,
	Combatant,
	CombatCondition,
	AddConditionInput,
	CombatLogEntry,
	AddLogEntryInput,
	LogPowerRollInput
} from '$lib/types/combat';
import { nanoid } from 'nanoid';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Roll 2d10 for Draw Steel initiative.
 */
function roll2d10(): [number, number] {
	const roll1 = Math.floor(Math.random() * 10) + 1;
	const roll2 = Math.floor(Math.random() * 10) + 1;
	return [roll1, roll2];
}

/**
 * Create a log entry with current combat state.
 */
function createLogEntry(
	combat: CombatSession,
	message: string,
	type: CombatLogEntry['type'],
	combatantId?: string,
	metadata?: Record<string, unknown>
): CombatLogEntry {
	return {
		id: nanoid(),
		round: combat.currentRound,
		turn: combat.currentTurn,
		timestamp: new Date(),
		message,
		type,
		combatantId,
		metadata
	};
}

/**
 * Apply damage to a combatant, absorbing with temp HP first.
 */
function applyDamageToCombatant(combatant: Combatant, damage: number): Combatant {
	let remainingDamage = damage;

	// Absorb with temporary HP first
	if (combatant.tempHp > 0) {
		if (combatant.tempHp >= remainingDamage) {
			return { ...combatant, tempHp: combatant.tempHp - remainingDamage };
		} else {
			remainingDamage -= combatant.tempHp;
			combatant = { ...combatant, tempHp: 0 };
		}
	}

	// Apply remaining damage to HP
	const newHp = Math.max(0, combatant.hp - remainingDamage);
	return { ...combatant, hp: newHp };
}

/**
 * Decrement condition durations at end of round.
 * Removes expired conditions (duration reaches 0).
 * Permanent conditions (duration -1) are not decremented.
 */
function decrementConditionDurations(combatant: Combatant): Combatant {
	const updatedConditions = combatant.conditions
		.map((condition) => {
			// Permanent conditions (duration -1) are not decremented
			if (condition.duration === -1) {
				return condition;
			}
			// Duration 0 means "until end of combat" - don't decrement
			if (condition.duration === 0) {
				return condition;
			}
			// Decrement positive durations
			return { ...condition, duration: condition.duration - 1 };
		})
		.filter((condition) => {
			// Remove conditions that have expired (duration reached 0)
			// Keep permanent (-1) and combat-duration (0) conditions
			return condition.duration !== 0 || combatant.conditions.find((c) => c === condition)?.duration === 0;
		});

	return { ...combatant, conditions: updatedConditions };
}

// ============================================================================
// Combat Repository
// ============================================================================

export const combatRepository = {
	// ========================================================================
	// CRUD Operations
	// ========================================================================

	/**
	 * Get all combat sessions as a live query (reactive).
	 */
	getAll(): Observable<CombatSession[]> {
		return liveQuery(() => db.combatSessions.toArray());
	},

	/**
	 * Get single combat session by ID.
	 */
	async getById(id: string): Promise<CombatSession | undefined> {
		await ensureDbReady();
		return db.combatSessions.get(id);
	},

	/**
	 * Get active combats (status: active or paused).
	 */
	async getActiveCombats(): Promise<CombatSession[]> {
		await ensureDbReady();
		return db.combatSessions.where('status').anyOf('active', 'paused').toArray();
	},

	/**
	 * Create a new combat session.
	 */
	async create(input: CreateCombatInput): Promise<CombatSession> {
		await ensureDbReady();

		const now = new Date();
		const combat: CombatSession = {
			id: nanoid(),
			name: input.name,
			description: input.description,
			status: 'preparing',
			currentRound: 0,
			currentTurn: 0,
			combatants: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: now,
			updatedAt: now
		};

		await db.combatSessions.add(combat);
		return combat;
	},

	/**
	 * Update combat session fields.
	 */
	async update(id: string, input: UpdateCombatInput): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		const updated: CombatSession = {
			...combat,
			...input,
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Delete combat session.
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.combatSessions.delete(id);
	},

	// ========================================================================
	// Combat Lifecycle
	// ========================================================================

	/**
	 * Start combat (preparing -> active).
	 */
	async startCombat(id: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		if (combat.status === 'active') {
			throw new Error('Combat is already active');
		}

		if (combat.status === 'completed') {
			throw new Error('Cannot start a completed combat');
		}

		const updated: CombatSession = {
			...combat,
			status: 'active',
			currentRound: 1,
			log: [
				...combat.log,
				createLogEntry(combat, 'Combat started', 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Pause active combat.
	 */
	async pauseCombat(id: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		if (combat.status !== 'active') {
			throw new Error('Combat is not active');
		}

		const updated: CombatSession = {
			...combat,
			status: 'paused',
			log: [
				...combat.log,
				createLogEntry(combat, 'Combat paused', 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Resume paused combat.
	 */
	async resumeCombat(id: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		if (combat.status !== 'paused') {
			throw new Error('Combat is not paused');
		}

		const updated: CombatSession = {
			...combat,
			status: 'active',
			log: [
				...combat.log,
				createLogEntry(combat, 'Combat resumed', 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * End combat (active/paused -> completed).
	 */
	async endCombat(id: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		if (combat.status === 'preparing') {
			throw new Error('Cannot end combat that has not started');
		}

		const updated: CombatSession = {
			...combat,
			status: 'completed',
			log: [
				...combat.log,
				createLogEntry(combat, 'Combat ended', 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Reopen completed combat (completed -> paused).
	 */
	async reopenCombat(id: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(id);
		if (!combat) {
			throw new Error(`Combat session ${id} not found`);
		}

		if (combat.status !== 'completed') {
			throw new Error('Combat is not completed');
		}

		const updated: CombatSession = {
			...combat,
			status: 'paused',
			log: [
				...combat.log,
				createLogEntry(combat, 'Combat reopened', 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Combatant Management
	// ========================================================================

	/**
	 * Add hero combatant to combat.
	 */
	async addHeroCombatant(combatId: string, input: AddHeroCombatantInput): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		// Validate that at least one of hp or maxHp is provided
		if (input.hp === undefined && input.maxHp === undefined) {
			throw new Error('Either hp or maxHp must be provided');
		}

		const hero: HeroCombatant = {
			id: nanoid(),
			type: 'hero',
			name: input.name,
			entityId: input.entityId,
			initiative: 0,
			initiativeRoll: [0, 0],
			hp: input.hp ?? input.maxHp!,
			maxHp: input.maxHp,
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			heroicResource: input.heroicResource
		};

		const updated: CombatSession = {
			...combat,
			combatants: [...combat.combatants, hero],
			log: [
				...combat.log,
				createLogEntry(combat, `${hero.name} joined the combat`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Add creature combatant to combat.
	 */
	async addCreatureCombatant(
		combatId: string,
		input: AddCreatureCombatantInput
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		// Validate that at least one of hp or maxHp is provided
		if (input.hp === undefined && input.maxHp === undefined) {
			throw new Error('Either hp or maxHp must be provided');
		}

		const creature: CreatureCombatant = {
			id: nanoid(),
			type: 'creature',
			name: input.name,
			entityId: input.entityId,
			initiative: 0,
			initiativeRoll: [0, 0],
			hp: input.hp ?? input.maxHp!,
			maxHp: input.maxHp,
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			threat: input.threat ?? 1,
			isAdHoc: !input.entityId // Mark as ad-hoc when no entityId provided
		};

		const updated: CombatSession = {
			...combat,
			combatants: [...combat.combatants, creature],
			log: [
				...combat.log,
				createLogEntry(combat, `${creature.name} joined the combat`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Add quick ad-hoc combatant to combat (Issue #233).
	 *
	 * Simplified combatant entry requiring only name and HP.
	 *
	 * Features:
	 * - Auto-numbers duplicate names ("Goblin" → "Goblin 1" → "Goblin 2")
	 * - Sets isAdHoc flag to indicate no entity link
	 * - No maxHp required - tracks current HP only
	 *
	 * @param combatId - ID of the combat session
	 * @param input - Quick combatant input (name, type, hp required)
	 * @returns Updated combat session with new combatant added
	 *
	 * @example
	 * ```typescript
	 * await combatRepository.addQuickCombatant('combat-123', {
	 *   name: 'Goblin',
	 *   type: 'creature',
	 *   hp: 12,
	 *   ac: 14,
	 *   threat: 1
	 * });
	 * ```
	 */
	async addQuickCombatant(
		combatId: string,
		input: AddQuickCombatantInput
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		// Auto-number duplicate names
		let finalName = input.name;
		const baseNamePattern = new RegExp(`^${input.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\d+)?$`);
		const existingWithSameName = combat.combatants.filter(c => baseNamePattern.test(c.name));

		if (existingWithSameName.length > 0) {
			// Find the highest number already used
			let highestNumber = 0;
			existingWithSameName.forEach(c => {
				const match = c.name.match(/ (\d+)$/);
				if (match) {
					const num = parseInt(match[1], 10);
					if (num > highestNumber) {
						highestNumber = num;
					}
				}
			});
			finalName = `${input.name} ${highestNumber + 1}`;
		}

		// Create the combatant based on type
		const baseCombatant = {
			id: nanoid(),
			name: finalName,
			initiative: 0,
			initiativeRoll: [0, 0] as [number, number],
			hp: input.hp,
			maxHp: undefined as number | undefined,
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			isAdHoc: true
		};

		let newCombatant: Combatant;
		if (input.type === 'hero') {
			newCombatant = {
				...baseCombatant,
				type: 'hero'
			} as HeroCombatant;
		} else {
			newCombatant = {
				...baseCombatant,
				type: 'creature',
				threat: input.threat ?? 1
			} as CreatureCombatant;
		}

		const updated: CombatSession = {
			...combat,
			combatants: [...combat.combatants, newCombatant],
			log: [
				...combat.log,
				createLogEntry(combat, `${newCombatant.name} joined the combat`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Update combatant properties.
	 */
	async updateCombatant(
		combatId: string,
		combatantId: string,
		input: UpdateCombatantInput
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...updatedCombatants[combatantIndex],
			...input
		};

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Move combatant to a specific position in the initiative order.
	 * Position is 0-indexed.
	 */
	async moveCombatantToPosition(
		combatId: string,
		combatantId: string,
		newPosition: number
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const currentIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (currentIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		// Clamp position to valid range
		const clampedPosition = Math.max(0, Math.min(newPosition, combat.combatants.length - 1));

		if (currentIndex === clampedPosition) {
			return combat; // No change needed
		}

		// Remove from current position and insert at new position
		const updatedCombatants = [...combat.combatants];
		const [combatant] = updatedCombatants.splice(currentIndex, 1);
		updatedCombatants.splice(clampedPosition, 0, combatant);

		// Adjust currentTurn if needed
		let newCurrentTurn = combat.currentTurn;
		if (combat.status === 'active') {
			// If the moved combatant was the current turn holder, follow them
			if (currentIndex === combat.currentTurn) {
				newCurrentTurn = clampedPosition;
			}
			// If moved from before current to after (or vice versa), adjust
			else if (currentIndex < combat.currentTurn && clampedPosition >= combat.currentTurn) {
				newCurrentTurn = combat.currentTurn - 1;
			} else if (currentIndex > combat.currentTurn && clampedPosition <= combat.currentTurn) {
				newCurrentTurn = combat.currentTurn + 1;
			}
		}

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			currentTurn: newCurrentTurn,
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Remove combatant from combat.
	 */
	async removeCombatant(combatId: string, combatantId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatant = combat.combatants.find((c) => c.id === combatantId);
		if (!combatant) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const updated: CombatSession = {
			...combat,
			combatants: combat.combatants.filter((c) => c.id !== combatantId),
			log: [
				...combat.log,
				createLogEntry(combat, `${combatant.name} removed from combat`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Initiative
	// ========================================================================

	/**
	 * Roll initiative for a single combatant (2d10 for Draw Steel).
	 */
	async rollInitiative(
		combatId: string,
		combatantId: string,
		modifier: number = 0
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const roll = roll2d10();
		const total = roll[0] + roll[1] + modifier;

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...updatedCombatants[combatantIndex],
			initiative: total,
			initiativeRoll: roll
		};

		const combatant = updatedCombatants[combatantIndex];
		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(
					combat,
					`${combatant.name} rolled initiative: ${total} (${roll[0]} + ${roll[1]}${modifier ? ` + ${modifier}` : ''})`,
					'initiative',
					combatantId
				)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Roll initiative for all combatants and sort by initiative descending.
	 */
	async rollInitiativeForAll(combatId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const updatedCombatants = combat.combatants.map((combatant) => {
			const roll = roll2d10();
			const total = roll[0] + roll[1];
			return {
				...combatant,
				initiative: total,
				initiativeRoll: roll
			};
		});

		// Sort by initiative descending
		updatedCombatants.sort((a, b) => b.initiative - a.initiative);

		// Create log entries for all rolls
		const logEntries = updatedCombatants.map((combatant) =>
			createLogEntry(
				combat,
				`${combatant.name} rolled initiative: ${combatant.initiative} (${combatant.initiativeRoll[0]} + ${combatant.initiativeRoll[1]})`,
				'initiative',
				combatant.id
			)
		);

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [...combat.log, ...logEntries],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Turn Management
	// ========================================================================

	/**
	 * Advance to next turn.
	 */
	async nextTurn(combatId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		if (combat.status !== 'active') {
			throw new Error('Combat is not active');
		}

		let nextTurn = combat.currentTurn + 1;
		let nextRound = combat.currentRound;
		let updatedCombatants = combat.combatants;
		const newLogEntries: CombatLogEntry[] = [];

		// Check if we've completed a round
		if (nextTurn >= combat.combatants.length) {
			nextTurn = 0;
			nextRound++;

			// Decrement condition durations at end of round
			updatedCombatants = combat.combatants.map(decrementConditionDurations);

			newLogEntries.push(
				createLogEntry(combat, `Round ${nextRound} begins`, 'system')
			);
		}

		// Log turn change
		const currentCombatant = updatedCombatants[nextTurn];
		if (currentCombatant) {
			newLogEntries.push(
				createLogEntry(
					{ ...combat, currentRound: nextRound, currentTurn: nextTurn },
					`${currentCombatant.name}'s turn`,
					'system',
					currentCombatant.id
				)
			);
		}

		const updated: CombatSession = {
			...combat,
			currentTurn: nextTurn,
			currentRound: nextRound,
			combatants: updatedCombatants,
			log: [...combat.log, ...newLogEntries],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Go back to previous turn.
	 */
	async previousTurn(combatId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		let prevTurn = combat.currentTurn - 1;
		let prevRound = combat.currentRound;

		// Check if we need to go back to previous round
		if (prevTurn < 0) {
			if (prevRound > 1) {
				prevRound--;
				prevTurn = combat.combatants.length - 1;
			} else {
				// Can't go before round 1, turn 0
				prevTurn = 0;
			}
		}

		const currentCombatant = combat.combatants[prevTurn];
		const updated: CombatSession = {
			...combat,
			currentTurn: prevTurn,
			currentRound: prevRound,
			log: [
				...combat.log,
				createLogEntry(
					{ ...combat, currentRound: prevRound, currentTurn: prevTurn },
					`Back to ${currentCombatant?.name}'s turn`,
					'system',
					currentCombatant?.id
				)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// HP, Damage, and Healing
	// ========================================================================

	/**
	 * Apply damage to combatant (absorbs with temp HP first).
	 */
	async applyDamage(
		combatId: string,
		combatantId: string,
		damage: number,
		source?: string
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		const updatedCombatant = applyDamageToCombatant(combatant, damage);

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = updatedCombatant;

		const message = source
			? `${combatant.name} takes ${damage} damage from ${source}`
			: `${combatant.name} takes ${damage} damage`;

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(combat, message, 'damage', combatantId)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Apply healing to combatant (caps at max HP if maxHp is defined, no cap if undefined).
	 */
	async applyHealing(
		combatId: string,
		combatantId: string,
		healing: number,
		source?: string
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		// Only cap at maxHp if maxHp is defined
		const newHp = combatant.maxHp !== undefined
			? Math.min(combatant.hp + healing, combatant.maxHp)
			: combatant.hp + healing;

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...combatant,
			hp: newHp
		};

		const message = source
			? `${combatant.name} heals ${healing} HP from ${source}`
			: `${combatant.name} heals ${healing} HP`;

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(combat, message, 'healing', combatantId)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Add temporary HP to combatant (takes higher value, doesn't stack).
	 */
	async addTemporaryHp(
		combatId: string,
		combatantId: string,
		tempHp: number
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		const newTempHp = Math.max(combatant.tempHp, tempHp);

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...combatant,
			tempHp: newTempHp
		};

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(
					combat,
					`${combatant.name} gains ${tempHp} temporary HP`,
					'healing',
					combatantId
				)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Conditions
	// ========================================================================

	/**
	 * Add condition to combatant.
	 */
	async addCondition(
		combatId: string,
		combatantId: string,
		condition: AddConditionInput
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		const newCondition: CombatCondition = {
			name: condition.name,
			description: condition.description,
			source: condition.source,
			duration: condition.duration
		};

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...combatant,
			conditions: [...combatant.conditions, newCondition]
		};

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(
					combat,
					`${combatant.name} is now ${condition.name}`,
					'condition',
					combatantId
				)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Remove condition from combatant (removes first matching condition by name).
	 */
	async removeCondition(
		combatId: string,
		combatantId: string,
		conditionName: string
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		const conditionIndex = combatant.conditions.findIndex((c) => c.name === conditionName);

		// If condition doesn't exist, return unchanged
		if (conditionIndex === -1) {
			return combat;
		}

		const updatedConditions = [...combatant.conditions];
		updatedConditions.splice(conditionIndex, 1);

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...combatant,
			conditions: updatedConditions
		};

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			log: [
				...combat.log,
				createLogEntry(
					combat,
					`${conditionName} removed from ${combatant.name}`,
					'condition',
					combatantId
				)
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Hero Points
	// ========================================================================

	/**
	 * Add hero points to the pool.
	 */
	async addHeroPoints(combatId: string, points: number): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const updated: CombatSession = {
			...combat,
			heroPoints: combat.heroPoints + points,
			log: [
				...combat.log,
				createLogEntry(combat, `${points} Hero Points added (total: ${combat.heroPoints + points})`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Spend a hero point from the pool.
	 */
	async spendHeroPoint(combatId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		if (combat.heroPoints <= 0) {
			throw new Error('No hero points available to spend');
		}

		const updated: CombatSession = {
			...combat,
			heroPoints: combat.heroPoints - 1,
			log: [
				...combat.log,
				createLogEntry(combat, `Hero Point spent (remaining: ${combat.heroPoints - 1})`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Victory Points
	// ========================================================================

	/**
	 * Add victory points.
	 */
	async addVictoryPoints(
		combatId: string,
		points: number,
		reason?: string
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const message = reason
			? `${points} Victory Points earned: ${reason} (total: ${combat.victoryPoints + points})`
			: `${points} Victory Points earned (total: ${combat.victoryPoints + points})`;

		const updated: CombatSession = {
			...combat,
			victoryPoints: combat.victoryPoints + points,
			log: [
				...combat.log,
				createLogEntry(combat, message, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Remove victory points (cannot go below 0).
	 */
	async removeVictoryPoints(
		combatId: string,
		points: number,
		reason?: string
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const newTotal = Math.max(0, combat.victoryPoints - points);
		const message = reason
			? `${points} Victory Points lost: ${reason} (total: ${newTotal})`
			: `${points} Victory Points lost (total: ${newTotal})`;

		const updated: CombatSession = {
			...combat,
			victoryPoints: newTotal,
			log: [
				...combat.log,
				createLogEntry(combat, message, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	// ========================================================================
	// Combat Log
	// ========================================================================

	/**
	 * Add custom log entry.
	 */
	async addLogEntry(combatId: string, input: AddLogEntryInput): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const logEntry = createLogEntry(
			combat,
			input.message,
			input.type,
			input.combatantId,
			input.metadata
		);

		const updated: CombatSession = {
			...combat,
			log: [...combat.log, logEntry],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Log power roll result.
	 */
	async logPowerRoll(combatId: string, input: LogPowerRollInput): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const tierText = input.critical ? 'Critical Success' : `Tier ${input.tier}`;
		const message = `${input.combatantName} ${input.action} - power roll ${tierText} (${input.roll1} + ${input.roll2} = ${input.total})`;

		const logEntry = createLogEntry(
			combat,
			message,
			'action',
			input.combatantId,
			{
				roll1: input.roll1,
				roll2: input.roll2,
				total: input.total,
				tier: input.tier,
				critical: input.critical,
				action: input.action
			}
		);

		const updated: CombatSession = {
			...combat,
			log: [...combat.log, logEntry],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	}
};
