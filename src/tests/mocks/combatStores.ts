/**
 * Mock Combat Stores for Testing
 *
 * Provides mock implementations of combat stores for component testing.
 * These mocks follow TDD RED phase - actual stores will be implemented in GREEN phase.
 */

import { vi } from 'vitest';
import type {
	CombatSession,
	Combatant,
	AddHeroCombatantInput,
	AddCreatureCombatantInput,
	AddConditionInput,
	AddLogEntryInput,
	UpdateCombatantInput
} from '$lib/types/combat';

/**
 * Creates a mock combat store for testing
 */
export function createMockCombatStore(initialSessions: CombatSession[] = []) {
	let _sessions = initialSessions;
	let _activeCombatId: string | null = initialSessions.length > 0 ? initialSessions[0].id : null;

	const getActiveCombat = () => {
		if (!_activeCombatId) return null;
		return _sessions.find(s => s.id === _activeCombatId) || null;
	};

	return {
		// State
		get sessions() {
			return _sessions;
		},
		get activeCombatId() {
			return _activeCombatId;
		},
		get activeCombat() {
			return getActiveCombat();
		},

		// Session Management
		createCombat: vi.fn(async (name: string, description?: string): Promise<CombatSession> => {
			const newCombat: CombatSession = {
				id: `combat-${Date.now()}`,
				name,
				description,
				status: 'preparing',
				currentRound: 0,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 3,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};
			_sessions.push(newCombat);
			return newCombat;
		}),

		loadCombats: vi.fn(async (): Promise<void> => {
			// Mock load - sessions already set
		}),

		deleteCombat: vi.fn(async (combatId: string): Promise<void> => {
			_sessions = _sessions.filter(s => s.id !== combatId);
			if (_activeCombatId === combatId) {
				_activeCombatId = null;
			}
		}),

		setActiveCombat: vi.fn((combatId: string | null): void => {
			_activeCombatId = combatId;
		}),

		updateCombatName: vi.fn(async (combatId: string, name: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.name = name;
				combat.updatedAt = new Date();
			}
		}),

		updateCombatDescription: vi.fn(async (combatId: string, description: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.description = description;
				combat.updatedAt = new Date();
			}
		}),

		// Combat State Management
		startCombat: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.status = 'active';
				combat.currentRound = 1;
				combat.currentTurn = 0;
				combat.updatedAt = new Date();
			}
		}),

		pauseCombat: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.status = 'paused';
				combat.updatedAt = new Date();
			}
		}),

		resumeCombat: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.status = 'active';
				combat.updatedAt = new Date();
			}
		}),

		endCombat: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.status = 'completed';
				combat.updatedAt = new Date();
			}
		}),

		// Turn Management
		nextTurn: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat && combat.combatants.length > 0) {
				combat.currentTurn++;
				if (combat.currentTurn >= combat.combatants.length) {
					combat.currentTurn = 0;
					combat.currentRound++;
				}
				combat.updatedAt = new Date();
			}
		}),

		previousTurn: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat && combat.combatants.length > 0) {
				combat.currentTurn--;
				if (combat.currentTurn < 0) {
					combat.currentTurn = combat.combatants.length - 1;
					if (combat.currentRound > 1) {
						combat.currentRound--;
					}
				}
				combat.updatedAt = new Date();
			}
		}),

		goToTurn: vi.fn(async (combatId: string, turnIndex: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat && turnIndex >= 0 && turnIndex < combat.combatants.length) {
				combat.currentTurn = turnIndex;
				combat.updatedAt = new Date();
			}
		}),

		// Combatant Management
		addHeroCombatant: vi.fn(async (combatId: string, input: AddHeroCombatantInput): Promise<Combatant> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (!combat) throw new Error('Combat not found');

			const hero: Combatant = {
				id: `hero-${Date.now()}`,
				type: 'hero',
				name: input.name,
				entityId: input.entityId ?? '',
				initiative: 0,
				initiativeRoll: [0, 0],
				hp: input.maxHp ?? 0,
				maxHp: input.maxHp ?? 0,
				tempHp: 0,
				ac: typeof input.ac === 'number' ? input.ac : undefined,
				conditions: [],
				heroicResource: input.heroicResource
			} as unknown as Combatant;

			combat.combatants.push(hero);
			combat.updatedAt = new Date();
			return hero;
		}),

		addCreatureCombatant: vi.fn(async (combatId: string, input: AddCreatureCombatantInput): Promise<Combatant> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (!combat) throw new Error('Combat not found');

			const creature: Combatant = {
				id: `creature-${Date.now()}`,
				type: 'creature',
				name: input.name,
				entityId: input.entityId ?? '',
				initiative: 0,
				initiativeRoll: [0, 0],
				hp: input.maxHp ?? 0,
				maxHp: input.maxHp ?? 0,
				tempHp: 0,
				ac: typeof input.ac === 'number' ? input.ac : undefined,
				conditions: [],
				threat: (input.threat as 'boss' | 'captain' | 'troop' | undefined) ?? 'troop'
			} as unknown as Combatant;

			combat.combatants.push(creature);
			combat.updatedAt = new Date();
			return creature;
		}),

		removeCombatant: vi.fn(async (combatId: string, combatantId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.combatants = combat.combatants.filter(c => c.id !== combatantId);
				// Adjust turn if needed
				if (combat.currentTurn >= combat.combatants.length) {
					combat.currentTurn = Math.max(0, combat.combatants.length - 1);
				}
				combat.updatedAt = new Date();
			}
		}),

		updateCombatant: vi.fn(async (combatId: string, combatantId: string, updates: UpdateCombatantInput): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					Object.assign(combatant, updates);
					combat.updatedAt = new Date();
				}
			}
		}),

		rollInitiative: vi.fn(async (combatId: string, combatantId: string, roll1: number, roll2: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					combatant.initiativeRoll = [roll1, roll2];
					combatant.initiative = roll1 + roll2;
					combat.updatedAt = new Date();
				}
			}
		}),

		sortByInitiative: vi.fn(async (combatId: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.combatants.sort((a, b) => b.initiative - a.initiative);
				combat.updatedAt = new Date();
			}
		}),

		// HP Management
		applyDamage: vi.fn(async (combatId: string, combatantId: string, amount: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					// Apply to temp HP first
					if (combatant.tempHp > 0) {
						const tempDamage = Math.min(amount, combatant.tempHp);
						combatant.tempHp -= tempDamage;
						amount -= tempDamage;
					}
					// Then to regular HP
					if (amount > 0) {
						combatant.hp = Math.max(0, combatant.hp - amount);
					}
					combat.updatedAt = new Date();
				}
			}
		}),

		applyHealing: vi.fn(async (combatId: string, combatantId: string, amount: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					combatant.hp = Math.min(combatant.maxHp ?? 0, (combatant.hp ?? 0) + amount);
					combat.updatedAt = new Date();
				}
			}
		}),

		setTempHp: vi.fn(async (combatId: string, combatantId: string, amount: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					combatant.tempHp = Math.max(0, amount);
					combat.updatedAt = new Date();
				}
			}
		}),

		// Condition Management
		addCondition: vi.fn(async (combatId: string, combatantId: string, condition: AddConditionInput): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					combatant.conditions.push(condition);
					combat.updatedAt = new Date();
				}
			}
		}),

		removeCondition: vi.fn(async (combatId: string, combatantId: string, conditionName: string): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					combatant.conditions = combatant.conditions.filter(c => c.name !== conditionName);
					combat.updatedAt = new Date();
				}
			}
		}),

		updateConditionDuration: vi.fn(async (combatId: string, combatantId: string, conditionName: string, duration: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const combatant = combat.combatants.find(c => c.id === combatantId);
				if (combatant) {
					const condition = combatant.conditions.find(c => c.name === conditionName);
					if (condition) {
						condition.duration = duration;
						combat.updatedAt = new Date();
					}
				}
			}
		}),

		// Party Resources
		updateHeroPoints: vi.fn(async (combatId: string, amount: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.heroPoints = Math.max(0, amount);
				combat.updatedAt = new Date();
			}
		}),

		updateVictoryPoints: vi.fn(async (combatId: string, amount: number): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				combat.victoryPoints = Math.max(0, amount);
				combat.updatedAt = new Date();
			}
		}),

		// Combat Log
		addLogEntry: vi.fn(async (combatId: string, entry: AddLogEntryInput): Promise<void> => {
			const combat = _sessions.find(s => s.id === combatId);
			if (combat) {
				const logEntry = {
					id: `log-${Date.now()}`,
					round: combat.currentRound,
					turn: combat.currentTurn,
					timestamp: new Date(),
					...entry
				};
				combat.log.push(logEntry);
				combat.updatedAt = new Date();
			}
		}),

		// Test Helpers
		_setSessions: (sessions: CombatSession[]) => {
			_sessions = sessions;
		},
		_setActiveCombatId: (id: string | null) => {
			_activeCombatId = id;
		}
	};
}
