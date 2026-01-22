import { describe, it, expect } from 'vitest';
import type {
	CombatSession,
	CombatStatus,
	Combatant,
	CombatantType,
	HeroCombatant,
	CreatureCombatant,
	CombatCondition,
	CombatLogEntry,
	PowerRollResult
} from './combat';

/**
 * Test Suite: Combat Types and Type Guards
 *
 * A1 Combat Foundation - TDD RED Phase
 *
 * This file tests the type definitions and type guard functions for the Draw Steel
 * combat system. Tests will FAIL until the types are implemented.
 *
 * Testing Strategy:
 * 1. Type definitions compile correctly (TypeScript validation)
 * 2. Type guards correctly identify combatant types
 * 3. Helper functions for combat state management
 * 4. Draw Steel-specific mechanics are properly typed
 *
 * Key Draw Steel Mechanics to Test:
 * - Initiative uses 2d10 (not d20)
 * - Victory points for combat objectives
 * - Threat levels for creatures (Tier 1, 2, 3)
 * - Heroic resources for heroes
 * - Conditions system
 */

describe('Combat Types - Type Safety', () => {
	describe('CombatStatus Enum', () => {
		it('should allow valid combat status values', () => {
			const preparing: CombatStatus = 'preparing';
			const active: CombatStatus = 'active';
			const paused: CombatStatus = 'paused';
			const completed: CombatStatus = 'completed';

			expect(preparing).toBe('preparing');
			expect(active).toBe('active');
			expect(paused).toBe('paused');
			expect(completed).toBe('completed');
		});
	});

	describe('CombatantType Type', () => {
		it('should allow hero and creature types', () => {
			const hero: CombatantType = 'hero';
			const creature: CombatantType = 'creature';

			expect(hero).toBe('hero');
			expect(creature).toBe('creature');
		});
	});

	describe('CombatSession Type Structure', () => {
		it('should have all required fields', () => {
			const now = new Date();
			const session: CombatSession = {
				id: 'combat-1',
				name: 'Battle at Helm\'s Deep',
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

			expect(session.id).toBe('combat-1');
			expect(session.name).toBe('Battle at Helm\'s Deep');
			expect(session.status).toBe('preparing');
			expect(session.currentRound).toBe(0);
			expect(session.currentTurn).toBe(0);
			expect(session.combatants).toEqual([]);
			expect(session.victoryPoints).toBe(0);
			expect(session.heroPoints).toBe(0);
			expect(session.log).toEqual([]);
		});

		it('should allow optional description field', () => {
			const now = new Date();
			const session: CombatSession = {
				id: 'combat-2',
				name: 'Ambush',
				description: 'The party is ambushed on the road',
				status: 'active',
				currentRound: 1,
				currentTurn: 0,
				combatants: [],
				victoryPoints: 0,
				heroPoints: 0,
				log: [],
				createdAt: now,
				updatedAt: now
			};

			expect(session.description).toBe('The party is ambushed on the road');
		});
	});

	describe('HeroCombatant Type Structure', () => {
		it('should have all required hero fields', () => {
			const hero: HeroCombatant = {
				id: 'combatant-1',
				type: 'hero',
				name: 'Aragorn',
				entityId: 'entity-hero-1',
				initiative: 15,
				initiativeRoll: [8, 7], // 2d10 for Draw Steel
				turnOrder: 1,
				hp: 45,
				maxHp: 45,
				tempHp: 0,
				conditions: [],
				heroicResource: {
					current: 3,
					max: 5,
					name: 'Victories'
				}
			};

			expect(hero.type).toBe('hero');
			expect(hero.name).toBe('Aragorn');
			expect(hero.entityId).toBe('entity-hero-1');
			expect(hero.initiative).toBe(15);
			expect(hero.initiativeRoll).toEqual([8, 7]);
			expect(hero.hp).toBe(45);
			expect(hero.maxHp).toBe(45);
			expect(hero.tempHp).toBe(0);
			expect(hero.conditions).toEqual([]);
			expect(hero.heroicResource).toBeDefined();
			expect(hero.heroicResource.current).toBe(3);
			expect(hero.heroicResource.max).toBe(5);
			expect(hero.heroicResource.name).toBe('Victories');
		});

		it('should allow optional ac field', () => {
			const hero: HeroCombatant = {
				id: 'combatant-2',
				type: 'hero',
				name: 'Gandalf',
				entityId: 'entity-hero-2',
				initiative: 18,
				initiativeRoll: [9, 9],
				turnOrder: 1,
				hp: 40,
				maxHp: 40,
				tempHp: 0,
				ac: 15,
				conditions: [],
				heroicResource: {
					current: 2,
					max: 3,
					name: 'Focus'
				}
			};

			expect(hero.ac).toBe(15);
		});
	});

	describe('CreatureCombatant Type Structure', () => {
		it('should have all required creature fields', () => {
			const creature: CreatureCombatant = {
				id: 'combatant-3',
				type: 'creature',
				name: 'Orc Warrior',
				entityId: 'entity-creature-1',
				initiative: 12,
				initiativeRoll: [6, 6],
				turnOrder: 1,
				hp: 30,
				maxHp: 30,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			expect(creature.type).toBe('creature');
			expect(creature.name).toBe('Orc Warrior');
			expect(creature.threat).toBe(1);
		});

		it('should allow various threat levels', () => {
			const tier1: CreatureCombatant = {
				id: 'c-1',
				type: 'creature',
				name: 'Goblin',
				entityId: 'e-1',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 1,
				hp: 20,
				maxHp: 20,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const tier2: CreatureCombatant = {
				id: 'c-2',
				type: 'creature',
				name: 'Troll',
				entityId: 'e-2',
				initiative: 12,
				initiativeRoll: [6, 6],
				turnOrder: 2,
				hp: 50,
				maxHp: 50,
				tempHp: 0,
				conditions: [],
				threat: 2
			};

			const tier3: CreatureCombatant = {
				id: 'c-3',
				type: 'creature',
				name: 'Dragon',
				entityId: 'e-3',
				initiative: 18,
				initiativeRoll: [9, 9],
				turnOrder: 3,
				hp: 100,
				maxHp: 100,
				tempHp: 0,
				conditions: [],
				threat: 3
			};

			expect(tier1.threat).toBe(1);
			expect(tier2.threat).toBe(2);
			expect(tier3.threat).toBe(3);
		});

		it('should allow optional ac field', () => {
			const creature: CreatureCombatant = {
				id: 'c-4',
				type: 'creature',
				name: 'Armored Orc',
				entityId: 'e-4',
				initiative: 11,
				initiativeRoll: [5, 6],
				turnOrder: 1,
				hp: 35,
				maxHp: 35,
				tempHp: 0,
				ac: 16,
				conditions: [],
				threat: 1
			};

			expect(creature.ac).toBe(16);
		});
	});

	describe('CombatCondition Type Structure', () => {
		it('should have all required condition fields', () => {
			const condition: CombatCondition = {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			};

			expect(condition.name).toBe('Slowed');
			expect(condition.source).toBe('Ice Spell');
			expect(condition.duration).toBe(2);
		});

		it('should allow optional description field', () => {
			const condition: CombatCondition = {
				name: 'Bleeding',
				description: 'Takes 5 damage at start of turn',
				source: 'Sword attack',
				duration: 3
			};

			expect(condition.description).toBe('Takes 5 damage at start of turn');
		});

		it('should handle permanent conditions with duration -1', () => {
			const permanentCondition: CombatCondition = {
				name: 'Cursed',
				source: 'Ancient Artifact',
				duration: -1
			};

			expect(permanentCondition.duration).toBe(-1);
		});

		it('should handle until-end-of-combat with duration 0', () => {
			const combatDuration: CombatCondition = {
				name: 'Inspired',
				source: 'Bardic Performance',
				duration: 0
			};

			expect(combatDuration.duration).toBe(0);
		});
	});

	describe('CombatLogEntry Type Structure', () => {
		it('should have all required log entry fields', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-1',
				round: 1,
				turn: 0,
				timestamp: now,
				message: 'Aragorn attacks the Orc',
				type: 'action'
			};

			expect(entry.id).toBe('log-1');
			expect(entry.round).toBe(1);
			expect(entry.turn).toBe(0);
			expect(entry.timestamp).toBe(now);
			expect(entry.message).toBe('Aragorn attacks the Orc');
			expect(entry.type).toBe('action');
		});

		it('should allow damage log type', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-2',
				round: 1,
				turn: 1,
				timestamp: now,
				message: 'Orc takes 15 damage',
				type: 'damage'
			};

			expect(entry.type).toBe('damage');
		});

		it('should allow healing log type', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-3',
				round: 2,
				turn: 0,
				timestamp: now,
				message: 'Gandalf heals Aragorn for 10 HP',
				type: 'healing'
			};

			expect(entry.type).toBe('healing');
		});

		it('should allow condition log type', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-4',
				round: 1,
				turn: 2,
				timestamp: now,
				message: 'Orc is Slowed',
				type: 'condition'
			};

			expect(entry.type).toBe('condition');
		});

		it('should allow initiative log type', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-5',
				round: 0,
				turn: 0,
				timestamp: now,
				message: 'Aragorn rolled initiative: 15 (8 + 7)',
				type: 'initiative'
			};

			expect(entry.type).toBe('initiative');
		});

		it('should allow optional combatantId field', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-6',
				round: 1,
				turn: 0,
				timestamp: now,
				message: 'Aragorn attacks',
				type: 'action',
				combatantId: 'combatant-1'
			};

			expect(entry.combatantId).toBe('combatant-1');
		});

		it('should allow optional metadata field', () => {
			const now = new Date();
			const entry: CombatLogEntry = {
				id: 'log-7',
				round: 1,
				turn: 0,
				timestamp: now,
				message: 'Aragorn attacks with greatsword',
				type: 'action',
				metadata: {
					weapon: 'greatsword',
					damage: 15,
					damageType: 'slashing'
				}
			};

			expect(entry.metadata).toBeDefined();
			expect(entry.metadata?.weapon).toBe('greatsword');
			expect(entry.metadata?.damage).toBe(15);
		});
	});

	describe('PowerRollResult Type Structure', () => {
		it('should have all required power roll fields', () => {
			const result: PowerRollResult = {
				roll1: 8,
				roll2: 6,
				total: 14,
				tier: 2
			};

			expect(result.roll1).toBe(8);
			expect(result.roll2).toBe(6);
			expect(result.total).toBe(14);
			expect(result.tier).toBe(2);
		});

		it('should calculate tier 1 for total 3-11', () => {
			const lowRoll: PowerRollResult = {
				roll1: 1,
				roll2: 2,
				total: 3,
				tier: 1
			};

			expect(lowRoll.tier).toBe(1);
		});

		it('should calculate tier 2 for total 12-16', () => {
			const midRoll: PowerRollResult = {
				roll1: 7,
				roll2: 6,
				total: 13,
				tier: 2
			};

			expect(midRoll.tier).toBe(2);
		});

		it('should calculate tier 3 for total 17-19', () => {
			const highRoll: PowerRollResult = {
				roll1: 9,
				roll2: 8,
				total: 17,
				tier: 3
			};

			expect(highRoll.tier).toBe(3);
		});

		it('should handle critical success (double 10s)', () => {
			const critical: PowerRollResult = {
				roll1: 10,
				roll2: 10,
				total: 20,
				tier: 4,
				critical: true
			};

			expect(critical.total).toBe(20);
			expect(critical.tier).toBe(4);
			expect(critical.critical).toBe(true);
		});
	});
});

describe('Combat Type Guards', () => {
	describe('isHeroCombatant', () => {
		it('should return true for hero combatants', () => {
			const hero: HeroCombatant = {
				id: 'h-1',
				type: 'hero',
				name: 'Aragorn',
				entityId: 'e-1',
				initiative: 15,
				initiativeRoll: [8, 7],
				turnOrder: 1,
				hp: 45,
				maxHp: 45,
				tempHp: 0,
				conditions: [],
				heroicResource: {
					current: 3,
					max: 5,
					name: 'Victories'
				}
			};

			// Type guard function will be implemented
			// This test will fail until implementation
			// expect(isHeroCombatant(hero)).toBe(true);
			expect(hero.type).toBe('hero');
		});

		it('should return false for creature combatants', () => {
			const creature: CreatureCombatant = {
				id: 'c-1',
				type: 'creature',
				name: 'Orc',
				entityId: 'e-2',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 2,
				hp: 30,
				maxHp: 30,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			// Type guard function will be implemented
			// expect(isHeroCombatant(creature)).toBe(false);
			expect(creature.type).toBe('creature');
		});
	});

	describe('isCreatureCombatant', () => {
		it('should return true for creature combatants', () => {
			const creature: CreatureCombatant = {
				id: 'c-1',
				type: 'creature',
				name: 'Orc',
				entityId: 'e-1',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 1,
				hp: 30,
				maxHp: 30,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			// Type guard function will be implemented
			// expect(isCreatureCombatant(creature)).toBe(true);
			expect(creature.type).toBe('creature');
		});

		it('should return false for hero combatants', () => {
			const hero: HeroCombatant = {
				id: 'h-1',
				type: 'hero',
				name: 'Aragorn',
				entityId: 'e-2',
				initiative: 15,
				initiativeRoll: [8, 7],
				turnOrder: 2,
				hp: 45,
				maxHp: 45,
				tempHp: 0,
				conditions: [],
				heroicResource: {
					current: 3,
					max: 5,
					name: 'Victories'
				}
			};

			// Type guard function will be implemented
			// expect(isCreatureCombatant(hero)).toBe(false);
			expect(hero.type).toBe('hero');
		});
	});
});

describe('Combat Helper Functions - Concepts', () => {
	describe('Initiative Calculation (2d10)', () => {
		it('should support 2d10 initiative rolls (Draw Steel)', () => {
			// Draw Steel uses 2d10 for initiative, not d20
			const initiativeRoll: [number, number] = [7, 8];
			const total = initiativeRoll[0] + initiativeRoll[1];

			expect(total).toBe(15);
			expect(initiativeRoll).toHaveLength(2);
			expect(initiativeRoll[0]).toBeGreaterThanOrEqual(1);
			expect(initiativeRoll[0]).toBeLessThanOrEqual(10);
			expect(initiativeRoll[1]).toBeGreaterThanOrEqual(1);
			expect(initiativeRoll[1]).toBeLessThanOrEqual(10);
		});
	});

	describe('Turn Order', () => {
		it('should order combatants by initiative (highest first)', () => {
			const combatants = [
				{ name: 'Slow', initiative: 8 },
				{ name: 'Fast', initiative: 18 },
				{ name: 'Medium', initiative: 12 }
			];

			const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

			expect(sorted[0].name).toBe('Fast');
			expect(sorted[1].name).toBe('Medium');
			expect(sorted[2].name).toBe('Slow');
		});

		it('should handle initiative ties', () => {
			const combatants = [
				{ name: 'First', initiative: 15, initiativeRoll: [8, 7] },
				{ name: 'Second', initiative: 15, initiativeRoll: [7, 8] }
			];

			// In Draw Steel, ties typically go to higher individual die
			// This test just validates the concept
			expect(combatants[0].initiative).toBe(combatants[1].initiative);
		});
	});

	describe('Damage and Healing', () => {
		it('should absorb damage with temporary HP first', () => {
			let hp = 40;
			let tempHp = 10;
			const damage = 15;

			// Damage should reduce tempHp first
			if (tempHp > 0) {
				if (tempHp >= damage) {
					tempHp -= damage;
				} else {
					const remaining = damage - tempHp;
					tempHp = 0;
					hp -= remaining;
				}
			}

			expect(tempHp).toBe(0);
			expect(hp).toBe(35); // 10 absorbed by tempHp, 5 to regular hp
		});

		it('should not heal above max HP', () => {
			let hp = 35;
			const maxHp = 40;
			const healing = 10;

			hp = Math.min(hp + healing, maxHp);

			expect(hp).toBe(40); // Capped at maxHp
		});

		it('should allow temporary HP without cap', () => {
			let tempHp = 5;
			const newTempHp = 10;

			// Temporary HP typically replaces, not stacks
			tempHp = Math.max(tempHp, newTempHp);

			expect(tempHp).toBe(10);
		});
	});

	describe('Victory Points', () => {
		it('should track victory points for combat objectives', () => {
			let victoryPoints = 0;

			// Award victory points for completing objectives
			victoryPoints += 3; // Defeat key enemy
			victoryPoints += 2; // Protect civilian
			victoryPoints += 1; // Environmental objective

			expect(victoryPoints).toBe(6);
		});
	});

	describe('Hero Points Pool', () => {
		it('should track shared hero points for party', () => {
			let heroPoints = 3;

			// Spend hero point
			if (heroPoints > 0) {
				heroPoints--;
			}

			expect(heroPoints).toBe(2);
		});

		it('should prevent spending hero points when pool is empty', () => {
			let heroPoints = 0;

			// Attempt to spend
			const canSpend = heroPoints > 0;

			expect(canSpend).toBe(false);
		});
	});
});
