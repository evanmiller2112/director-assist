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
	LogPowerRollInput,
	CombatantGroup,
	CreateGroupInput
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
 * Sort combatants by turnOrder ascending.
 * Used to maintain consistent ordering after turnOrder changes.
 */
function sortByTurnOrder(combatants: Combatant[]): Combatant[] {
	return [...combatants].sort((a, b) => a.turnOrder - b.turnOrder);
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
			groups: [],
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
			turnOrder: combat.combatants.length + 1,
			hp: input.hp ?? input.maxHp!,
			maxHp: input.maxHp,
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			heroicResource: input.heroicResource,
			tokenIndicator: input.tokenIndicator
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
			turnOrder: combat.combatants.length + 1,
			hp: input.hp ?? input.maxHp!,
			maxHp: input.maxHp,
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			threat: input.threat ?? 1,
			isAdHoc: !input.entityId, // Mark as ad-hoc when no entityId provided
			tokenIndicator: input.tokenIndicator
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
			turnOrder: combat.combatants.length + 1,
			hp: input.hp,
			maxHp: undefined as number | undefined,
			startingHp: input.hp, // Track starting HP for healing cap when maxHp is undefined
			tempHp: 0,
			ac: input.ac,
			conditions: [],
			isAdHoc: true,
			tokenIndicator: input.tokenIndicator
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
	 * Update a combatant's turn order and re-sort the array.
	 * Adjusts currentTurn to follow the current combatant after re-sort.
	 */
	async updateTurnOrder(
		combatId: string,
		combatantId: string,
		newTurnOrder: number
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

		// Track the current turn holder's ID before re-sorting
		const currentTurnHolderId = combat.combatants[combat.currentTurn]?.id;

		// Update the combatant's turnOrder
		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...updatedCombatants[combatantIndex],
			turnOrder: newTurnOrder
		};

		// Re-sort by turnOrder
		const sortedCombatants = sortByTurnOrder(updatedCombatants);

		// Find the new index of the current turn holder
		let newCurrentTurn = combat.currentTurn;
		if (currentTurnHolderId) {
			const newIndex = sortedCombatants.findIndex((c) => c.id === currentTurnHolderId);
			if (newIndex !== -1) {
				newCurrentTurn = newIndex;
			}
		}

		const updated: CombatSession = {
			...combat,
			combatants: sortedCombatants,
			currentTurn: newCurrentTurn,
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Remove combatant from combat.
	 * If combatant is in a group, removes from group and auto-dissolves if only 1 member remains.
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

		let updatedGroups = combat.groups;
		const logEntries: CombatLogEntry[] = [
			createLogEntry(combat, `${combatant.name} removed from combat`, 'system')
		];

		// If combatant is in a group, update the group
		if (combatant.groupId) {
			const group = combat.groups.find((g) => g.id === combatant.groupId);
			if (group) {
				const newMemberIds = group.memberIds.filter((id) => id !== combatantId);

				// Auto-dissolve if only 1 member remains
				if (newMemberIds.length === 1) {
					updatedGroups = combat.groups.filter((g) => g.id !== group.id);

					// Update remaining member to be standalone
					const remainingMemberId = newMemberIds[0];
					const updatedCombatantsWithRemaining = combat.combatants
						.filter((c) => c.id !== combatantId)
						.map((c) => {
							if (c.id === remainingMemberId) {
								return {
									...c,
									groupId: undefined,
									turnOrder: Math.floor(c.turnOrder)
								};
							}
							return c;
						});

					logEntries.push(
						createLogEntry(combat, `Group "${group.name}" dissolved (only 1 member remaining)`, 'system')
					);

					const updated: CombatSession = {
						...combat,
						combatants: updatedCombatantsWithRemaining,
						groups: updatedGroups,
						log: [...combat.log, ...logEntries],
						updatedAt: new Date()
					};

					await db.combatSessions.put(updated);
					return updated;
				}

				// Update group with new member list
				updatedGroups = combat.groups.map((g) => {
					if (g.id === group.id) {
						return {
							...g,
							memberIds: newMemberIds
						};
					}
					return g;
				});
			}
		}

		const updated: CombatSession = {
			...combat,
			combatants: combat.combatants.filter((c) => c.id !== combatantId),
			groups: updatedGroups,
			log: [...combat.log, ...logEntries],
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
	 * Assigns turnOrder based on sorted position (1, 2, 3, etc.).
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

		// Assign turnOrder based on sorted position (1-indexed)
		const combatantsWithTurnOrder = updatedCombatants.map((combatant, index) => ({
			...combatant,
			turnOrder: index + 1
		}));

		// Create log entries for all rolls
		const logEntries = combatantsWithTurnOrder.map((combatant) =>
			createLogEntry(
				combat,
				`${combatant.name} rolled initiative: ${combatant.initiative} (${combatant.initiativeRoll[0]} + ${combatant.initiativeRoll[1]})`,
				'initiative',
				combatant.id
			)
		);

		const updated: CombatSession = {
			...combat,
			combatants: combatantsWithTurnOrder,
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

		// Treat negative healing as no healing (not damage)
		const effectiveHealing = Math.max(0, healing);

		// Determine the effective maximum HP for capping
		let effectiveMaxHp: number;
		if (combatant.maxHp !== undefined) {
			// Standard combatants: use maxHp
			effectiveMaxHp = combatant.maxHp;
		} else if (combatant.startingHp !== undefined) {
			// Quick-add combatants: use startingHp as cap
			effectiveMaxHp = combatant.startingHp;
		} else {
			// Fallback: no cap (shouldn't happen with proper quick-add setup)
			effectiveMaxHp = combatant.hp + effectiveHealing;
		}

		// Apply healing with cap
		const newHp = Math.min(combatant.hp + effectiveHealing, effectiveMaxHp);

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

	/**
	 * Update max HP for combatant (Issue #301).
	 * Validates newMaxHp > 0 and clamps current HP if necessary.
	 */
	async updateMaxHp(
		combatId: string,
		combatantId: string,
		newMaxHp: number
	): Promise<CombatSession> {
		await ensureDbReady();

		// Validate newMaxHp is positive
		if (newMaxHp <= 0) {
			throw new Error('Max HP must be greater than 0');
		}

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatantIndex = combat.combatants.findIndex((c) => c.id === combatantId);
		if (combatantIndex === -1) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		const combatant = combat.combatants[combatantIndex];
		const oldMaxHp = combatant.maxHp;
		const oldHp = combatant.hp;

		// Clamp current HP if new max is lower than current HP
		const newHp = Math.min(combatant.hp, newMaxHp);

		const updatedCombatants = [...combat.combatants];
		updatedCombatants[combatantIndex] = {
			...combatant,
			maxHp: newMaxHp,
			hp: newHp
		};

		// Create log entries
		const logEntries: CombatLogEntry[] = [];

		// Determine if HP was clamped
		const wasClamped = newHp < oldHp;

		// Log max HP change with optional clamping info
		const maxHpMessage = wasClamped
			? `${combatant.name}'s max HP changed from ${oldMaxHp ?? 'none'} to ${newMaxHp} (HP clamped from ${oldHp} to ${newHp})`
			: `${combatant.name}'s max HP changed from ${oldMaxHp ?? 'none'} to ${newMaxHp}`;

		const metadata: Record<string, unknown> = {
			oldMaxHp,
			newMaxHp
		};

		// Include HP clamping info in metadata if it occurred
		if (wasClamped) {
			metadata.oldHp = oldHp;
			metadata.newHp = newHp;
		}

		logEntries.push(
			createLogEntry(
				combat,
				maxHpMessage,
				'system',
				combatantId,
				metadata
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
	},

	// ========================================================================
	// Group Management (Issue #263)
	// ========================================================================

	/**
	 * Create a group from selected combatants.
	 * Members share initiative and act sequentially with fractional turnOrder.
	 */
	async createGroup(combatId: string, input: CreateGroupInput): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		// Validate all members exist
		for (const memberId of input.memberIds) {
			const combatant = combat.combatants.find((c) => c.id === memberId);
			if (!combatant) {
				throw new Error(`Combatant ${memberId} not found`);
			}
			// Validate member is not already in a group
			if (combatant.groupId) {
				throw new Error(`Combatant ${memberId} is already in a group`);
			}
		}

		// Determine group initiative (use custom or first member's)
		const firstMember = combat.combatants.find((c) => c.id === input.memberIds[0])!;
		const groupInitiative = input.initiative ?? firstMember.initiative;
		const groupInitiativeRoll = input.initiative ? roll2d10() : firstMember.initiativeRoll;

		// Create the group
		const group: CombatantGroup = {
			id: nanoid(),
			name: input.name,
			memberIds: [...input.memberIds],
			initiative: groupInitiative,
			initiativeRoll: groupInitiativeRoll,
			turnOrder: firstMember.turnOrder
		};

		// Update all members to have groupId and fractional turnOrder
		const updatedCombatants = combat.combatants.map((combatant) => {
			const memberIndex = input.memberIds.indexOf(combatant.id);
			if (memberIndex !== -1) {
				return {
					...combatant,
					groupId: group.id,
					initiative: groupInitiative,
					initiativeRoll: groupInitiativeRoll,
					turnOrder: group.turnOrder + (memberIndex + 1) * 0.1
				};
			}
			return combatant;
		});

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			groups: [...combat.groups, group],
			log: [
				...combat.log,
				createLogEntry(combat, `Group "${input.name}" created with ${input.memberIds.length} members`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Add a combatant to an existing group.
	 * The combatant inherits the group's initiative and gets a fractional turnOrder.
	 */
	async addToGroup(combatId: string, combatantId: string, groupId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const group = combat.groups.find((g) => g.id === groupId);
		if (!group) {
			throw new Error(`Group ${groupId} not found`);
		}

		const combatant = combat.combatants.find((c) => c.id === combatantId);
		if (!combatant) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		if (combatant.groupId) {
			throw new Error(`Combatant ${combatantId} is already in a group`);
		}

		// Calculate new member's fractional turnOrder
		const currentMemberCount = group.memberIds.length;
		const newTurnOrder = group.turnOrder + (currentMemberCount + 1) * 0.1;

		// Update combatant
		const updatedCombatants = combat.combatants.map((c) => {
			if (c.id === combatantId) {
				return {
					...c,
					groupId: group.id,
					initiative: group.initiative,
					initiativeRoll: group.initiativeRoll,
					turnOrder: newTurnOrder
				};
			}
			return c;
		});

		// Update group memberIds
		const updatedGroups = combat.groups.map((g) => {
			if (g.id === groupId) {
				return {
					...g,
					memberIds: [...g.memberIds, combatantId]
				};
			}
			return g;
		});

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			groups: updatedGroups,
			log: [
				...combat.log,
				createLogEntry(combat, `${combatant.name} added to group "${group.name}"`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Remove a combatant from its group.
	 * Auto-dissolves the group if only 1 member remains.
	 */
	async removeFromGroup(combatId: string, combatantId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatant = combat.combatants.find((c) => c.id === combatantId);
		if (!combatant) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		if (!combatant.groupId) {
			throw new Error(`Combatant ${combatantId} is not in a group`);
		}

		const group = combat.groups.find((g) => g.id === combatant.groupId);
		if (!group) {
			throw new Error(`Group ${combatant.groupId} not found`);
		}

		// Remove combatant from group
		const newMemberIds = group.memberIds.filter((id) => id !== combatantId);

		// Update combatant to be standalone with integer turnOrder
		const updatedCombatants = combat.combatants.map((c) => {
			if (c.id === combatantId) {
				return {
					...c,
					groupId: undefined,
					turnOrder: Math.floor(c.turnOrder)
				};
			}
			return c;
		});

		const logEntries: CombatLogEntry[] = [
			createLogEntry(combat, `${combatant.name} removed from group "${group.name}"`, 'system')
		];

		let updatedGroups = combat.groups;

		// Auto-dissolve if only 1 member remains
		if (newMemberIds.length === 1) {
			const remainingMemberId = newMemberIds[0];

			// Remove group and make last member standalone
			updatedGroups = combat.groups.filter((g) => g.id !== group.id);

			// Update remaining member to be standalone
			const updatedCombatantsWithRemaining = updatedCombatants.map((c) => {
				if (c.id === remainingMemberId) {
					return {
						...c,
						groupId: undefined,
						turnOrder: Math.floor(c.turnOrder)
					};
				}
				return c;
			});

			logEntries.push(
				createLogEntry(combat, `Group "${group.name}" dissolved (only 1 member remaining)`, 'system')
			);

			const updated: CombatSession = {
				...combat,
				combatants: updatedCombatantsWithRemaining,
				groups: updatedGroups,
				log: [...combat.log, ...logEntries],
				updatedAt: new Date()
			};

			await db.combatSessions.put(updated);
			return updated;
		}

		// Update group with new member list
		updatedGroups = combat.groups.map((g) => {
			if (g.id === group.id) {
				return {
					...g,
					memberIds: newMemberIds
				};
			}
			return g;
		});

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			groups: updatedGroups,
			log: [...combat.log, ...logEntries],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Split a combatant from its group into a standalone combatant.
	 * Group continues to exist with remaining members.
	 */
	async splitFromGroup(
		combatId: string,
		combatantId: string,
		newInitiative?: number
	): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const combatant = combat.combatants.find((c) => c.id === combatantId);
		if (!combatant) {
			throw new Error(`Combatant ${combatantId} not found`);
		}

		if (!combatant.groupId) {
			throw new Error(`Combatant ${combatantId} is not in a group`);
		}

		const group = combat.groups.find((g) => g.id === combatant.groupId);
		if (!group) {
			throw new Error(`Group ${combatant.groupId} not found`);
		}

		// Determine new initiative for split combatant
		const initiative = newInitiative ?? combatant.initiative;
		const initiativeRoll = newInitiative ? roll2d10() : combatant.initiativeRoll;

		// Update combatant to be standalone
		const updatedCombatants = combat.combatants.map((c) => {
			if (c.id === combatantId) {
				return {
					...c,
					groupId: undefined,
					initiative,
					initiativeRoll,
					turnOrder: Math.floor(c.turnOrder)
				};
			}
			return c;
		});

		// Remove from group's member list
		const updatedGroups = combat.groups.map((g) => {
			if (g.id === group.id) {
				return {
					...g,
					memberIds: g.memberIds.filter((id) => id !== combatantId)
				};
			}
			return g;
		});

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			groups: updatedGroups,
			log: [
				...combat.log,
				createLogEntry(combat, `${combatant.name} split from group "${group.name}"`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	},

	/**
	 * Dissolve a group, making all members standalone combatants.
	 */
	async dissolveGroup(combatId: string, groupId: string): Promise<CombatSession> {
		await ensureDbReady();

		const combat = await db.combatSessions.get(combatId);
		if (!combat) {
			throw new Error(`Combat session ${combatId} not found`);
		}

		const group = combat.groups.find((g) => g.id === groupId);
		if (!group) {
			throw new Error(`Group ${groupId} not found`);
		}

		// Update all members to be standalone with integer turnOrder
		const updatedCombatants = combat.combatants.map((c) => {
			if (c.groupId === groupId) {
				return {
					...c,
					groupId: undefined,
					turnOrder: Math.floor(c.turnOrder)
				};
			}
			return c;
		});

		// Remove the group
		const updatedGroups = combat.groups.filter((g) => g.id !== groupId);

		const updated: CombatSession = {
			...combat,
			combatants: updatedCombatants,
			groups: updatedGroups,
			log: [
				...combat.log,
				createLogEntry(combat, `Group "${group.name}" dissolved`, 'system')
			],
			updatedAt: new Date()
		};

		await db.combatSessions.put(updated);
		return updated;
	}
};
