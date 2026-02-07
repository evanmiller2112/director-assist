/**
 * Tests for Combat Repository
 *
 * A1 Combat Foundation - TDD RED Phase
 *
 * This repository manages combat sessions in IndexedDB, providing functionality
 * for combat lifecycle, combatant management, turn tracking, and Draw Steel mechanics.
 *
 * Testing Strategy:
 * - CRUD operations for combat sessions
 * - Combat lifecycle (start, pause, resume, end)
 * - Combatant management (add, update, remove, initiative)
 * - Turn management (next, previous, round transitions)
 * - HP/Damage/Healing with temporary HP
 * - Draw Steel conditions system
 * - Hero points pool (shared party resource)
 * - Victory points tracking
 * - Combat logging with metadata
 * - Power roll integration
 *
 * Draw Steel Specifics:
 * - Initiative uses 2d10 (stored as [number, number])
 * - Threat levels for creatures (1-3)
 * - Heroic resources for heroes
 * - Conditions with duration tracking
 * - Victory points for objectives
 * - Hero points as shared party resource
 *
 * These tests will FAIL until implementation is complete (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { combatRepository } from './combatRepository';
import { db } from '../index';
import type {
	CombatSession,
	HeroCombatant,
	CreatureCombatant,
	CombatCondition
} from '$lib/types/combat';

describe('CombatRepository - CRUD Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear combat sessions before each test
		await db.combatSessions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.combatSessions.clear();
	});

	describe('create', () => {
		it('should create a new combat session', async () => {
			const combat = await combatRepository.create({
				name: 'Battle at Helm\'s Deep',
				description: 'Epic siege defense'
			});

			expect(combat).toBeDefined();
			expect(combat.id).toBeDefined();
			expect(combat.name).toBe('Battle at Helm\'s Deep');
			expect(combat.description).toBe('Epic siege defense');
			expect(combat.status).toBe('preparing');
			expect(combat.currentRound).toBe(0);
			expect(combat.currentTurn).toBe(0);
			expect(combat.combatants).toEqual([]);
			expect(combat.victoryPoints).toBe(0);
			expect(combat.heroPoints).toBe(0);
			expect(combat.log).toEqual([]);
			expect(combat.createdAt).toBeInstanceOf(Date);
			expect(combat.updatedAt).toBeInstanceOf(Date);
		});

		it('should generate unique IDs for each combat', async () => {
			const combat1 = await combatRepository.create({ name: 'Combat 1' });
			const combat2 = await combatRepository.create({ name: 'Combat 2' });

			expect(combat1.id).not.toBe(combat2.id);
		});

		it('should create combat without description', async () => {
			const combat = await combatRepository.create({ name: 'Quick Fight' });

			expect(combat.description).toBeUndefined();
		});

		it('should set timestamps on creation', async () => {
			const before = new Date();
			const combat = await combatRepository.create({ name: 'Timed Combat' });
			const after = new Date();

			expect(combat.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(combat.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
			expect(combat.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(combat.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('getById', () => {
		it('should retrieve combat session by ID', async () => {
			const created = await combatRepository.create({ name: 'Test Combat' });
			const retrieved = await combatRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Test Combat');
		});

		it('should return undefined for non-existent combat', async () => {
			const result = await combatRepository.getById('non-existent-id');

			expect(result).toBeUndefined();
		});
	});

	describe('getAll', () => {
		it('should return observable of all combat sessions', async () => {
			await combatRepository.create({ name: 'Combat 1' });
			await combatRepository.create({ name: 'Combat 2' });
			await combatRepository.create({ name: 'Combat 3' });

			const observable = combatRepository.getAll();
			let combats: CombatSession[] = [];

			// Subscribe to observable
			const subscription = observable.subscribe((data) => {
				combats = data;
			});

			// Wait for subscription to resolve
			await new Promise(resolve => setTimeout(resolve, 50));

			expect(combats.length).toBeGreaterThanOrEqual(3);
			subscription.unsubscribe();
		});

		it('should return empty array when no combats exist', async () => {
			const observable = combatRepository.getAll();
			let combats: CombatSession[] = [];

			const subscription = observable.subscribe((data) => {
				combats = data;
			});

			await new Promise(resolve => setTimeout(resolve, 50));

			expect(combats).toEqual([]);
			subscription.unsubscribe();
		});
	});

	describe('getActiveCombats', () => {
		it('should return only active combats', async () => {
			const combat1 = await combatRepository.create({ name: 'Active 1' });
			const combat2 = await combatRepository.create({ name: 'Completed' });
			const combat3 = await combatRepository.create({ name: 'Active 2' });

			await combatRepository.startCombat(combat1.id);
			await combatRepository.startCombat(combat3.id);
			await combatRepository.startCombat(combat2.id);
			await combatRepository.endCombat(combat2.id);

			const activeCombats = await combatRepository.getActiveCombats();

			expect(activeCombats).toHaveLength(2);
			expect(activeCombats.every(c => c.status === 'active')).toBe(true);
		});

		it('should include paused combats in active list', async () => {
			const combat = await combatRepository.create({ name: 'Paused Combat' });
			await combatRepository.startCombat(combat.id);
			await combatRepository.pauseCombat(combat.id);

			const activeCombats = await combatRepository.getActiveCombats();

			expect(activeCombats.some(c => c.id === combat.id && c.status === 'paused')).toBe(true);
		});

		it('should not include preparing combats', async () => {
			const combat = await combatRepository.create({ name: 'Preparing' });

			const activeCombats = await combatRepository.getActiveCombats();

			expect(activeCombats.some(c => c.id === combat.id)).toBe(false);
		});

		it('should not include completed combats', async () => {
			const combat = await combatRepository.create({ name: 'Finished' });
			await combatRepository.startCombat(combat.id);
			await combatRepository.endCombat(combat.id);

			const activeCombats = await combatRepository.getActiveCombats();

			expect(activeCombats.some(c => c.id === combat.id)).toBe(false);
		});
	});

	describe('update', () => {
		it('should update combat session', async () => {
			const combat = await combatRepository.create({ name: 'Original Name' });

			// Small delay to ensure timestamps differ
			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await combatRepository.update(combat.id, {
				name: 'Updated Name',
				description: 'New description'
			});

			expect(updated.name).toBe('Updated Name');
			expect(updated.description).toBe('New description');
			expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(combat.updatedAt.getTime());
		});

		it('should throw error for non-existent combat', async () => {
			await expect(
				combatRepository.update('non-existent', { name: 'Test' })
			).rejects.toThrow();
		});

		it('should update only specified fields', async () => {
			const combat = await combatRepository.create({
				name: 'Original',
				description: 'Original Description'
			});

			const updated = await combatRepository.update(combat.id, {
				name: 'New Name'
			});

			expect(updated.name).toBe('New Name');
			expect(updated.description).toBe('Original Description');
		});
	});

	describe('delete', () => {
		it('should delete combat session', async () => {
			const combat = await combatRepository.create({ name: 'To Delete' });

			await combatRepository.delete(combat.id);

			const retrieved = await combatRepository.getById(combat.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not throw when deleting non-existent combat', async () => {
			await expect(
				combatRepository.delete('non-existent')
			).resolves.not.toThrow();
		});
	});
});

describe('CombatRepository - Combat Lifecycle', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Test Combat' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('startCombat', () => {
		it('should transition combat from preparing to active', async () => {
			const combat = await combatRepository.startCombat(combatId);

			expect(combat.status).toBe('active');
			expect(combat.currentRound).toBe(1);
		});

		it('should create log entry for combat start', async () => {
			const combat = await combatRepository.startCombat(combatId);

			expect(combat.log.length).toBeGreaterThan(0);
			expect(combat.log[0].type).toBe('system');
			expect(combat.log[0].message).toContain('started');
		});

		it('should throw error if combat already active', async () => {
			await combatRepository.startCombat(combatId);

			await expect(
				combatRepository.startCombat(combatId)
			).rejects.toThrow('already active');
		});

		it('should throw error if combat is completed', async () => {
			await combatRepository.startCombat(combatId);
			await combatRepository.endCombat(combatId);

			await expect(
				combatRepository.startCombat(combatId)
			).rejects.toThrow('completed');
		});
	});

	describe('pauseCombat', () => {
		it('should pause active combat', async () => {
			await combatRepository.startCombat(combatId);
			const paused = await combatRepository.pauseCombat(combatId);

			expect(paused.status).toBe('paused');
		});

		it('should create log entry for pause', async () => {
			await combatRepository.startCombat(combatId);
			const paused = await combatRepository.pauseCombat(combatId);

			const pauseLog = paused.log.find(l => l.message.includes('paused'));
			expect(pauseLog).toBeDefined();
		});

		it('should throw error if combat not active', async () => {
			await expect(
				combatRepository.pauseCombat(combatId)
			).rejects.toThrow('not active');
		});
	});

	describe('resumeCombat', () => {
		it('should resume paused combat', async () => {
			await combatRepository.startCombat(combatId);
			await combatRepository.pauseCombat(combatId);
			const resumed = await combatRepository.resumeCombat(combatId);

			expect(resumed.status).toBe('active');
		});

		it('should create log entry for resume', async () => {
			await combatRepository.startCombat(combatId);
			await combatRepository.pauseCombat(combatId);
			const resumed = await combatRepository.resumeCombat(combatId);

			const resumeLog = resumed.log.find(l => l.message.includes('resumed'));
			expect(resumeLog).toBeDefined();
		});

		it('should throw error if combat not paused', async () => {
			await combatRepository.startCombat(combatId);

			await expect(
				combatRepository.resumeCombat(combatId)
			).rejects.toThrow('not paused');
		});
	});

	describe('endCombat', () => {
		it('should end active combat', async () => {
			await combatRepository.startCombat(combatId);
			const ended = await combatRepository.endCombat(combatId);

			expect(ended.status).toBe('completed');
		});

		it('should create log entry for combat end', async () => {
			await combatRepository.startCombat(combatId);
			const ended = await combatRepository.endCombat(combatId);

			const endLog = ended.log.find(l => l.message.includes('ended'));
			expect(endLog).toBeDefined();
		});

		it('should allow ending paused combat', async () => {
			await combatRepository.startCombat(combatId);
			await combatRepository.pauseCombat(combatId);
			const ended = await combatRepository.endCombat(combatId);

			expect(ended.status).toBe('completed');
		});

		it('should throw error if combat not started', async () => {
			await expect(
				combatRepository.endCombat(combatId)
			).rejects.toThrow();
		});
	});
});

describe('CombatRepository - Combatant Management', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Test Combat' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addHeroCombatant', () => {
		it('should add hero combatant to combat', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Aragorn',
				entityId: 'entity-hero-1',
				maxHp: 45,
				heroicResource: {
					current: 3,
					max: 5,
					name: 'Victories'
				}
			});

			expect(combat.combatants).toHaveLength(1);
			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.type).toBe('hero');
			expect(hero.name).toBe('Aragorn');
			expect(hero.hp).toBe(45);
			expect(hero.maxHp).toBe(45);
			expect(hero.tempHp).toBe(0);
			expect(hero.conditions).toEqual([]);
			expect(hero.heroicResource?.current).toBe(3);
		});

		it('should generate unique ID for combatant', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Gandalf',
				entityId: 'entity-hero-2',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			const hero = combat.combatants[0];
			expect(hero.id).toBeDefined();
			expect(hero.id.length).toBeGreaterThan(0);
		});

		it('should set initiative to 0 initially', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Legolas',
				entityId: 'entity-hero-3',
				maxHp: 38,
				heroicResource: { current: 3, max: 4, name: 'Focus' }
			});

			const hero = combat.combatants[0];
			expect(hero.initiative).toBe(0);
			expect(hero.initiativeRoll).toEqual([0, 0]);
		});

		it('should accept optional AC', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Gimli',
				entityId: 'entity-hero-4',
				maxHp: 50,
				ac: 18,
				heroicResource: { current: 2, max: 4, name: 'Fury' }
			});

			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.ac).toBe(18);
		});

		it('should create log entry for adding hero', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Boromir',
				entityId: 'entity-hero-5',
				maxHp: 48,
				heroicResource: { current: 3, max: 4, name: 'Resolve' }
			});

			const addLog = combat.log.find(l => l.message.includes('Boromir joined'));
			expect(addLog).toBeDefined();
		});
	});

	describe('addCreatureCombatant', () => {
		it('should add creature combatant to combat', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc Warrior',
				entityId: 'entity-creature-1',
				maxHp: 30,
				threat: 1
			});

			expect(combat.combatants).toHaveLength(1);
			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.type).toBe('creature');
			expect(creature.name).toBe('Orc Warrior');
			expect(creature.hp).toBe(30);
			expect(creature.threat).toBe(1);
		});

		it('should support different threat levels', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin',
				entityId: 'e-1',
				maxHp: 20,
				threat: 1
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Troll',
				entityId: 'e-2',
				maxHp: 50,
				threat: 2
			});

			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Dragon',
				entityId: 'e-3',
				maxHp: 100,
				threat: 3
			});

			expect(combat.combatants).toHaveLength(3);
			expect((combat.combatants[0] as CreatureCombatant).threat).toBe(1);
			expect((combat.combatants[1] as CreatureCombatant).threat).toBe(2);
			expect((combat.combatants[2] as CreatureCombatant).threat).toBe(3);
		});

		it('should accept optional AC', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Armored Orc',
				entityId: 'e-4',
				maxHp: 35,
				ac: 16,
				threat: 1
			});

			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.ac).toBe(16);
		});

		it('should create log entry for adding creature', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Cave Troll',
				entityId: 'e-5',
				maxHp: 60,
				threat: 2
			});

			const addLog = combat.log.find(l => l.message.includes('Cave Troll joined'));
			expect(addLog).toBeDefined();
		});
	});

	describe('updateCombatant', () => {
		it('should update combatant properties', async () => {
			const added = await combatRepository.addHeroCombatant(combatId, {
				name: 'Aragorn',
				entityId: 'e-1',
				maxHp: 45,
				heroicResource: { current: 3, max: 5, name: 'Victories' }
			});

			const heroId = added.combatants[0].id;
			const updated = await combatRepository.updateCombatant(combatId, heroId, {
				hp: 30,
				tempHp: 5
			});

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(30);
			expect(hero?.tempHp).toBe(5);
		});

		it('should update only specified fields', async () => {
			const added = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				entityId: 'e-1',
				maxHp: 30,
				threat: 1
			});

			const orcId = added.combatants[0].id;
			const updated = await combatRepository.updateCombatant(combatId, orcId, {
				hp: 15
			});

			const orc = updated.combatants.find(c => c.id === orcId);
			expect(orc?.hp).toBe(15);
			expect(orc?.name).toBe('Orc'); // Unchanged
		});

		it('should throw error for non-existent combatant', async () => {
			await expect(
				combatRepository.updateCombatant(combatId, 'non-existent', { hp: 10 })
			).rejects.toThrow('not found');
		});
	});

	describe('removeCombatant', () => {
		it('should remove combatant from combat', async () => {
			const added = await combatRepository.addHeroCombatant(combatId, {
				name: 'Temporary Hero',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			const heroId = added.combatants[0].id;
			const removed = await combatRepository.removeCombatant(combatId, heroId);

			expect(removed.combatants).toHaveLength(0);
		});

		it('should create log entry for removal', async () => {
			const added = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Defeated Orc',
				entityId: 'e-1',
				maxHp: 30,
				threat: 1
			});

			const orcId = added.combatants[0].id;
			const removed = await combatRepository.removeCombatant(combatId, orcId);

			const removeLog = removed.log.find(l => l.message.includes('removed'));
			expect(removeLog).toBeDefined();
		});

		it('should throw error for non-existent combatant', async () => {
			await expect(
				combatRepository.removeCombatant(combatId, 'non-existent')
			).rejects.toThrow();
		});
	});

	describe('rollInitiative', () => {
		it('should roll 2d10 initiative for combatant', async () => {
			const added = await combatRepository.addHeroCombatant(combatId, {
				name: 'Aragorn',
				entityId: 'e-1',
				maxHp: 45,
				heroicResource: { current: 3, max: 5, name: 'Victories' }
			});

			const heroId = added.combatants[0].id;
			const rolled = await combatRepository.rollInitiative(combatId, heroId);

			const hero = rolled.combatants.find(c => c.id === heroId);
			expect(hero?.initiativeRoll).toHaveLength(2);
			expect(hero?.initiativeRoll[0]).toBeGreaterThanOrEqual(1);
			expect(hero?.initiativeRoll[0]).toBeLessThanOrEqual(10);
			expect(hero?.initiativeRoll[1]).toBeGreaterThanOrEqual(1);
			expect(hero?.initiativeRoll[1]).toBeLessThanOrEqual(10);
			expect(hero?.initiative).toBe(hero!.initiativeRoll[0] + hero!.initiativeRoll[1]);
		});

		it('should create log entry with initiative roll', async () => {
			const added = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				entityId: 'e-1',
				maxHp: 30,
				threat: 1
			});

			const orcId = added.combatants[0].id;
			const rolled = await combatRepository.rollInitiative(combatId, orcId);

			const initLog = rolled.log.find(l => l.type === 'initiative' && l.message.includes('Orc'));
			expect(initLog).toBeDefined();
			expect(initLog?.message).toContain('rolled initiative');
		});

		it('should allow modifier to initiative roll', async () => {
			const added = await combatRepository.addHeroCombatant(combatId, {
				name: 'Fast Hero',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			const heroId = added.combatants[0].id;
			const modifier = 3;
			const rolled = await combatRepository.rollInitiative(combatId, heroId, modifier);

			const hero = rolled.combatants.find(c => c.id === heroId);
			const expectedInit = hero!.initiativeRoll[0] + hero!.initiativeRoll[1] + modifier;
			expect(hero?.initiative).toBe(expectedInit);
		});
	});

	describe('rollInitiativeForAll', () => {
		it('should roll initiative for all combatants', async () => {
			await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero 1',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero 2',
				entityId: 'e-2',
				maxHp: 45,
				heroicResource: { current: 3, max: 4, name: 'Resolve' }
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 1',
				entityId: 'e-3',
				maxHp: 30,
				threat: 1
			});

			const rolled = await combatRepository.rollInitiativeForAll(combatId);

			expect(rolled.combatants.every(c => c.initiative > 0)).toBe(true);
			expect(rolled.combatants.every(c => c.initiativeRoll[0] >= 1 && c.initiativeRoll[0] <= 10)).toBe(true);
			expect(rolled.combatants.every(c => c.initiativeRoll[1] >= 1 && c.initiativeRoll[1] <= 10)).toBe(true);
		});

		it('should sort combatants by initiative descending', async () => {
			await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero 1',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 1',
				entityId: 'e-2',
				maxHp: 30,
				threat: 1
			});

			const rolled = await combatRepository.rollInitiativeForAll(combatId);

			for (let i = 0; i < rolled.combatants.length - 1; i++) {
				expect(rolled.combatants[i].initiative).toBeGreaterThanOrEqual(
					rolled.combatants[i + 1].initiative
				);
			}
		});

		it('should create log entries for all rolls', async () => {
			await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero 1',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				entityId: 'e-2',
				maxHp: 30,
				threat: 1
			});

			const rolled = await combatRepository.rollInitiativeForAll(combatId);

			const initLogs = rolled.log.filter(l => l.type === 'initiative');
			expect(initLogs.length).toBe(2);
		});
	});
});

describe('CombatRepository - Turn Management', () => {
	let combatId: string;
	let hero1Id: string;
	let hero2Id: string;
	let creatureId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Turn Test' });
		combatId = combat.id;

		// Add combatants
		const withHero1 = await combatRepository.addHeroCombatant(combatId, {
			name: 'Hero 1',
			entityId: 'e-1',
			maxHp: 40,
			heroicResource: { current: 2, max: 3, name: 'Focus' }
		});
		hero1Id = withHero1.combatants[0].id;

		const withHero2 = await combatRepository.addHeroCombatant(combatId, {
			name: 'Hero 2',
			entityId: 'e-2',
			maxHp: 45,
			heroicResource: { current: 3, max: 4, name: 'Resolve' }
		});
		hero2Id = withHero2.combatants[1].id;

		const withCreature = await combatRepository.addCreatureCombatant(combatId, {
			name: 'Orc',
			entityId: 'e-3',
			maxHp: 30,
			threat: 1
		});
		creatureId = withCreature.combatants[2].id;

		// Roll initiative and start
		await combatRepository.rollInitiativeForAll(combatId);
		await combatRepository.startCombat(combatId);
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('nextTurn', () => {
		it('should advance to next combatant', async () => {
			const advanced = await combatRepository.nextTurn(combatId);

			expect(advanced.currentTurn).toBe(1);
			expect(advanced.currentRound).toBe(1);
		});

		it('should wrap to next round after last combatant', async () => {
			await combatRepository.nextTurn(combatId); // Turn 1
			await combatRepository.nextTurn(combatId); // Turn 2
			const wrapped = await combatRepository.nextTurn(combatId); // Back to turn 0, round 2

			expect(wrapped.currentTurn).toBe(0);
			expect(wrapped.currentRound).toBe(2);
		});

		it('should create log entry for turn change', async () => {
			const advanced = await combatRepository.nextTurn(combatId);

			const turnLog = advanced.log.find(l => l.message.includes('turn'));
			expect(turnLog).toBeDefined();
		});

		it('should create log entry for new round', async () => {
			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId);
			const newRound = await combatRepository.nextTurn(combatId);

			const roundLog = newRound.log.find(l => l.message.includes('Round 2'));
			expect(roundLog).toBeDefined();
		});

		it('should decrement condition durations on new round', async () => {
			// Add condition to first combatant
			await combatRepository.addCondition(combatId, hero1Id, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			// Complete round
			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId);
			const newRound = await combatRepository.nextTurn(combatId);

			const hero = newRound.combatants.find(c => c.id === hero1Id);
			const condition = hero?.conditions.find(c => c.name === 'Slowed');
			expect(condition?.duration).toBe(1);
		});

		it('should remove expired conditions', async () => {
			await combatRepository.addCondition(combatId, hero1Id, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 1
			});

			// Complete round
			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId);
			const newRound = await combatRepository.nextTurn(combatId);

			const hero = newRound.combatants.find(c => c.id === hero1Id);
			const hasCondition = hero?.conditions.some(c => c.name === 'Slowed');
			expect(hasCondition).toBe(false);
		});

		it('should not decrement permanent conditions (duration -1)', async () => {
			await combatRepository.addCondition(combatId, hero1Id, {
				name: 'Cursed',
				source: 'Ancient Artifact',
				duration: -1
			});

			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId);
			const newRound = await combatRepository.nextTurn(combatId);

			const hero = newRound.combatants.find(c => c.id === hero1Id);
			const condition = hero?.conditions.find(c => c.name === 'Cursed');
			expect(condition?.duration).toBe(-1);
		});

		it('should throw error if combat not active', async () => {
			await combatRepository.pauseCombat(combatId);

			await expect(
				combatRepository.nextTurn(combatId)
			).rejects.toThrow('not active');
		});
	});

	describe('previousTurn', () => {
		it('should go back to previous combatant', async () => {
			await combatRepository.nextTurn(combatId); // Turn 1
			const back = await combatRepository.previousTurn(combatId);

			expect(back.currentTurn).toBe(0);
		});

		it('should wrap to previous round when at turn 0', async () => {
			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId);
			await combatRepository.nextTurn(combatId); // Round 2, turn 0

			const back = await combatRepository.previousTurn(combatId);

			expect(back.currentRound).toBe(1);
			expect(back.currentTurn).toBe(2); // Last turn of previous round
		});

		it('should not go below round 1', async () => {
			const back = await combatRepository.previousTurn(combatId);

			expect(back.currentRound).toBe(1);
			expect(back.currentTurn).toBe(0);
		});

		it('should create log entry for turn change', async () => {
			await combatRepository.nextTurn(combatId);
			const back = await combatRepository.previousTurn(combatId);

			const turnLog = back.log[back.log.length - 1];
			expect(turnLog.message).toContain('turn');
		});
	});
});

describe('CombatRepository - HP, Damage, and Healing', () => {
	let combatId: string;
	let heroId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'HP Test' });
		combatId = combat.id;

		const withHero = await combatRepository.addHeroCombatant(combatId, {
			name: 'Test Hero',
			entityId: 'e-1',
			maxHp: 40,
			heroicResource: { current: 2, max: 3, name: 'Focus' }
		});
		heroId = withHero.combatants[0].id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('applyDamage', () => {
		it('should reduce HP by damage amount', async () => {
			const damaged = await combatRepository.applyDamage(combatId, heroId, 15);

			const hero = damaged.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(25); // 40 - 15
		});

		it('should absorb damage with temporary HP first', async () => {
			// Add temp HP
			await combatRepository.updateCombatant(combatId, heroId, { tempHp: 10 });

			const damaged = await combatRepository.applyDamage(combatId, heroId, 15);

			const hero = damaged.combatants.find(c => c.id === heroId);
			expect(hero?.tempHp).toBe(0); // All 10 used
			expect(hero?.hp).toBe(35); // 5 damage to real HP (40 - 5)
		});

		it('should only reduce temp HP if damage is less than temp HP', async () => {
			await combatRepository.updateCombatant(combatId, heroId, { tempHp: 20 });

			const damaged = await combatRepository.applyDamage(combatId, heroId, 10);

			const hero = damaged.combatants.find(c => c.id === heroId);
			expect(hero?.tempHp).toBe(10); // 20 - 10
			expect(hero?.hp).toBe(40); // No damage to real HP
		});

		it('should not reduce HP below 0', async () => {
			const damaged = await combatRepository.applyDamage(combatId, heroId, 100);

			const hero = damaged.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(0);
		});

		it('should create damage log entry', async () => {
			const damaged = await combatRepository.applyDamage(combatId, heroId, 15);

			const damageLog = damaged.log.find(
				l => l.type === 'damage' && l.combatantId === heroId
			);
			expect(damageLog).toBeDefined();
			expect(damageLog?.message).toContain('15 damage');
		});

		it('should allow optional damage source in log', async () => {
			const damaged = await combatRepository.applyDamage(combatId, heroId, 15, 'Orc attack');

			const damageLog = damaged.log.find(l => l.type === 'damage');
			expect(damageLog?.message).toContain('Orc attack');
		});
	});

	describe('applyHealing', () => {
		it('should increase HP by healing amount', async () => {
			// Damage first
			await combatRepository.applyDamage(combatId, heroId, 20);

			const healed = await combatRepository.applyHealing(combatId, heroId, 10);

			const hero = healed.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(30); // (40 - 20) + 10
		});

		it('should not heal above max HP', async () => {
			await combatRepository.applyDamage(combatId, heroId, 5);

			const healed = await combatRepository.applyHealing(combatId, heroId, 20);

			const hero = healed.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(40); // Capped at maxHp
		});

		it('should create healing log entry', async () => {
			const healed = await combatRepository.applyHealing(combatId, heroId, 10);

			const healLog = healed.log.find(
				l => l.type === 'healing' && l.combatantId === heroId
			);
			expect(healLog).toBeDefined();
			expect(healLog?.message).toContain('10');
		});

		it('should allow optional healing source in log', async () => {
			const healed = await combatRepository.applyHealing(combatId, heroId, 10, 'Healing potion');

			const healLog = healed.log.find(l => l.type === 'healing');
			expect(healLog?.message).toContain('Healing potion');
		});
	});

	describe('addTemporaryHp', () => {
		it('should add temporary HP', async () => {
			const updated = await combatRepository.addTemporaryHp(combatId, heroId, 10);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.tempHp).toBe(10);
		});

		it('should replace temp HP if new amount is higher', async () => {
			await combatRepository.addTemporaryHp(combatId, heroId, 5);
			const updated = await combatRepository.addTemporaryHp(combatId, heroId, 10);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.tempHp).toBe(10); // Replaced with higher value
		});

		it('should keep existing temp HP if new amount is lower', async () => {
			await combatRepository.addTemporaryHp(combatId, heroId, 15);
			const updated = await combatRepository.addTemporaryHp(combatId, heroId, 10);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.tempHp).toBe(15); // Kept higher value
		});

		it('should create log entry', async () => {
			const updated = await combatRepository.addTemporaryHp(combatId, heroId, 10);

			const tempHpLog = updated.log.find(l => l.message.includes('temporary HP'));
			expect(tempHpLog).toBeDefined();
		});
	});
});

describe('CombatRepository - Conditions (Draw Steel)', () => {
	let combatId: string;
	let heroId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Condition Test' });
		combatId = combat.id;

		const withHero = await combatRepository.addHeroCombatant(combatId, {
			name: 'Test Hero',
			entityId: 'e-1',
			maxHp: 40,
			heroicResource: { current: 2, max: 3, name: 'Focus' }
		});
		heroId = withHero.combatants[0].id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addCondition', () => {
		it('should add condition to combatant', async () => {
			const updated = await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions).toHaveLength(1);
			expect(hero?.conditions[0].name).toBe('Slowed');
			expect(hero?.conditions[0].source).toBe('Ice Spell');
			expect(hero?.conditions[0].duration).toBe(2);
		});

		it('should allow multiple conditions on same combatant', async () => {
			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const updated = await combatRepository.addCondition(combatId, heroId, {
				name: 'Bleeding',
				source: 'Sword attack',
				duration: 3
			});

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions).toHaveLength(2);
		});

		it('should allow same condition from different sources', async () => {
			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const updated = await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Entangle',
				duration: 3
			});

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions).toHaveLength(2);
			expect(hero?.conditions.filter(c => c.name === 'Slowed')).toHaveLength(2);
		});

		it('should support permanent conditions (duration -1)', async () => {
			const updated = await combatRepository.addCondition(combatId, heroId, {
				name: 'Cursed',
				source: 'Ancient Artifact',
				duration: -1
			});

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions[0].duration).toBe(-1);
		});

		it('should create log entry for condition', async () => {
			const updated = await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const conditionLog = updated.log.find(
				l => l.type === 'condition' && l.combatantId === heroId
			);
			expect(conditionLog).toBeDefined();
			expect(conditionLog?.message).toContain('Slowed');
		});
	});

	describe('removeCondition', () => {
		it('should remove specific condition', async () => {
			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const updated = await combatRepository.removeCondition(combatId, heroId, 'Slowed');

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions).toHaveLength(0);
		});

		it('should remove only first matching condition when multiple exist', async () => {
			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Entangle',
				duration: 3
			});

			const updated = await combatRepository.removeCondition(combatId, heroId, 'Slowed');

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.conditions).toHaveLength(1);
			expect(hero?.conditions[0].source).toBe('Entangle');
		});

		it('should create log entry for condition removal', async () => {
			await combatRepository.addCondition(combatId, heroId, {
				name: 'Slowed',
				source: 'Ice Spell',
				duration: 2
			});

			const updated = await combatRepository.removeCondition(combatId, heroId, 'Slowed');

			const removeLog = updated.log[updated.log.length - 1];
			expect(removeLog.message).toContain('removed');
			expect(removeLog.message).toContain('Slowed');
		});

		it('should not error if condition does not exist', async () => {
			await expect(
				combatRepository.removeCondition(combatId, heroId, 'NonExistent')
			).resolves.not.toThrow();
		});
	});
});

describe('CombatRepository - Hero Points (Draw Steel)', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Hero Points Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addHeroPoints', () => {
		it('should add hero points to pool', async () => {
			const updated = await combatRepository.addHeroPoints(combatId, 3);

			expect(updated.heroPoints).toBe(3);
		});

		it('should accumulate hero points', async () => {
			await combatRepository.addHeroPoints(combatId, 2);
			const updated = await combatRepository.addHeroPoints(combatId, 1);

			expect(updated.heroPoints).toBe(3);
		});

		it('should create log entry', async () => {
			const updated = await combatRepository.addHeroPoints(combatId, 2);

			const heroPointLog = updated.log.find(l => l.message.includes('Hero Points'));
			expect(heroPointLog).toBeDefined();
		});
	});

	describe('spendHeroPoint', () => {
		it('should spend hero point from pool', async () => {
			await combatRepository.addHeroPoints(combatId, 3);
			const updated = await combatRepository.spendHeroPoint(combatId);

			expect(updated.heroPoints).toBe(2);
		});

		it('should create log entry', async () => {
			await combatRepository.addHeroPoints(combatId, 3);
			const updated = await combatRepository.spendHeroPoint(combatId);

			const spendLog = updated.log[updated.log.length - 1];
			expect(spendLog.message).toContain('spent');
		});

		it('should throw error if no hero points available', async () => {
			await expect(
				combatRepository.spendHeroPoint(combatId)
			).rejects.toThrow('No hero points');
		});
	});
});

describe('CombatRepository - Victory Points', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Victory Points Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addVictoryPoints', () => {
		it('should add victory points', async () => {
			const updated = await combatRepository.addVictoryPoints(combatId, 3);

			expect(updated.victoryPoints).toBe(3);
		});

		it('should accumulate victory points', async () => {
			await combatRepository.addVictoryPoints(combatId, 2);
			const updated = await combatRepository.addVictoryPoints(combatId, 3);

			expect(updated.victoryPoints).toBe(5);
		});

		it('should create log entry with reason', async () => {
			const updated = await combatRepository.addVictoryPoints(combatId, 3, 'Defeated boss');

			const vpLog = updated.log.find(l => l.message.includes('Victory Points'));
			expect(vpLog).toBeDefined();
			expect(vpLog?.message).toContain('Defeated boss');
		});
	});

	describe('removeVictoryPoints', () => {
		it('should remove victory points', async () => {
			await combatRepository.addVictoryPoints(combatId, 5);
			const updated = await combatRepository.removeVictoryPoints(combatId, 2);

			expect(updated.victoryPoints).toBe(3);
		});

		it('should not go below 0', async () => {
			await combatRepository.addVictoryPoints(combatId, 3);
			const updated = await combatRepository.removeVictoryPoints(combatId, 5);

			expect(updated.victoryPoints).toBe(0);
		});

		it('should create log entry', async () => {
			await combatRepository.addVictoryPoints(combatId, 5);
			const updated = await combatRepository.removeVictoryPoints(combatId, 2, 'Failed objective');

			const vpLog = updated.log[updated.log.length - 1];
			expect(vpLog.message).toContain('Victory Points');
			expect(vpLog.message).toContain('Failed objective');
		});
	});
});

describe('CombatRepository - Combat Log', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Log Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addLogEntry', () => {
		it('should add custom log entry', async () => {
			const updated = await combatRepository.addLogEntry(combatId, {
				message: 'Custom event occurred',
				type: 'action'
			});

			const customLog = updated.log.find(l => l.message === 'Custom event occurred');
			expect(customLog).toBeDefined();
			expect(customLog?.type).toBe('action');
		});

		it('should set round and turn from current state', async () => {
			await combatRepository.startCombat(combatId);
			const updated = await combatRepository.addLogEntry(combatId, {
				message: 'Test event',
				type: 'action'
			});

			const log = updated.log.find(l => l.message === 'Test event');
			expect(log?.round).toBe(1);
			expect(log?.turn).toBe(0);
		});

		it('should allow optional combatantId', async () => {
			const withHero = await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero',
				entityId: 'e-1',
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});
			const heroId = withHero.combatants[0].id;

			const updated = await combatRepository.addLogEntry(combatId, {
				message: 'Hero takes action',
				type: 'action',
				combatantId: heroId
			});

			const log = updated.log.find(l => l.message === 'Hero takes action');
			expect(log?.combatantId).toBe(heroId);
		});

		it('should allow optional metadata', async () => {
			const updated = await combatRepository.addLogEntry(combatId, {
				message: 'Attack with sword',
				type: 'action',
				metadata: {
					weapon: 'longsword',
					damage: 15,
					damageType: 'slashing'
				}
			});

			const log = updated.log.find(l => l.message === 'Attack with sword');
			expect(log?.metadata).toBeDefined();
			expect(log?.metadata?.weapon).toBe('longsword');
		});
	});

	describe('getLog', () => {
		it('should retrieve full combat log', async () => {
			await combatRepository.startCombat(combatId);
			await combatRepository.addLogEntry(combatId, {
				message: 'Event 1',
				type: 'action'
			});
			await combatRepository.addLogEntry(combatId, {
				message: 'Event 2',
				type: 'action'
			});

			const combat = await combatRepository.getById(combatId);
			const log = combat?.log || [];

			expect(log.length).toBeGreaterThanOrEqual(3); // Start + 2 events
		});

		it('should order log by timestamp', async () => {
			await combatRepository.addLogEntry(combatId, {
				message: 'First',
				type: 'action'
			});
			await new Promise(resolve => setTimeout(resolve, 10));
			await combatRepository.addLogEntry(combatId, {
				message: 'Second',
				type: 'action'
			});

			const combat = await combatRepository.getById(combatId);
			const log = combat?.log || [];

			for (let i = 0; i < log.length - 1; i++) {
				expect(log[i].timestamp.getTime()).toBeLessThanOrEqual(
					log[i + 1].timestamp.getTime()
				);
			}
		});
	});
});

describe('CombatRepository - Power Roll Integration', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Power Roll Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('logPowerRoll', () => {
		it('should log power roll result', async () => {
			const updated = await combatRepository.logPowerRoll(combatId, {
				combatantName: 'Aragorn',
				roll1: 8,
				roll2: 7,
				total: 15,
				tier: 2,
				action: 'attacks with sword'
			});

			const rollLog = updated.log.find(l => l.message.includes('power roll'));
			expect(rollLog).toBeDefined();
			expect(rollLog?.message).toContain('Aragorn');
			expect(rollLog?.message).toContain('Tier 2');
		});

		it('should include roll details in metadata', async () => {
			const updated = await combatRepository.logPowerRoll(combatId, {
				combatantName: 'Gandalf',
				roll1: 9,
				roll2: 9,
				total: 18,
				tier: 3,
				action: 'casts fireball'
			});

			const rollLog = updated.log.find(l => l.message.includes('power roll'));
			expect(rollLog?.metadata?.roll1).toBe(9);
			expect(rollLog?.metadata?.roll2).toBe(9);
			expect(rollLog?.metadata?.total).toBe(18);
			expect(rollLog?.metadata?.tier).toBe(3);
		});

		it('should mark critical success', async () => {
			const updated = await combatRepository.logPowerRoll(combatId, {
				combatantName: 'Legolas',
				roll1: 10,
				roll2: 10,
				total: 20,
				tier: 4,
				critical: true,
				action: 'shoots arrow'
			});

			const rollLog = updated.log.find(l => l.message.includes('power roll'));
			expect(rollLog?.message).toContain('Critical');
			expect(rollLog?.metadata?.critical).toBe(true);
		});
	});
});

describe('CombatRepository - Quick-Add Combatants (Issue #233)', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Quick Add Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addQuickCombatant', () => {
		it('should add ad-hoc combatant with just name and HP', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 15,
				type: 'creature'
			});

			expect(combat.combatants).toHaveLength(1);
			const combatant = combat.combatants[0];
			expect(combatant.name).toBe('Goblin');
			expect(combatant.hp).toBe(15);
			expect(combatant.type).toBe('creature');
		});

		it('should create combatant with isAdHoc flag set to true', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Guard',
				hp: 20,
				type: 'creature'
			});

			const combatant = combat.combatants[0] as any;
			expect(combatant.isAdHoc).toBe(true);
		});

		it('should not require entityId for ad-hoc combatant', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Bandit',
				hp: 18,
				type: 'creature'
			});

			const combatant = combat.combatants[0];
			expect(combatant.entityId).toBeUndefined();
		});

		it('should auto-number duplicate names', async () => {
			await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 15,
				type: 'creature'
			});

			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 15,
				type: 'creature'
			});

			expect(combat.combatants).toHaveLength(2);
			expect(combat.combatants[0].name).toBe('Goblin');
			expect(combat.combatants[1].name).toBe('Goblin 1');
		});

		it('should auto-number multiple duplicates sequentially', async () => {
			await combatRepository.addQuickCombatant(combatId, {
				name: 'Orc',
				hp: 20,
				type: 'creature'
			});

			await combatRepository.addQuickCombatant(combatId, {
				name: 'Orc',
				hp: 20,
				type: 'creature'
			});

			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Orc',
				hp: 20,
				type: 'creature'
			});

			expect(combat.combatants).toHaveLength(3);
			expect(combat.combatants[0].name).toBe('Orc');
			expect(combat.combatants[1].name).toBe('Orc 1');
			expect(combat.combatants[2].name).toBe('Orc 2');
		});

		it('should allow optional AC for ad-hoc combatant', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Armored Guard',
				hp: 25,
				type: 'creature',
				ac: 16
			});

			const combatant = combat.combatants[0];
			expect(combatant.ac).toBe(16);
		});

		it('should support hero type for ad-hoc combatants', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Ally NPC',
				hp: 30,
				type: 'hero'
			});

			const combatant = combat.combatants[0];
			expect(combatant.type).toBe('hero');
		});

		it('should initialize combatant with default values', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Simple Minion',
				hp: 10,
				type: 'creature'
			});

			const combatant = combat.combatants[0];
			expect(combatant.initiative).toBe(0);
			expect(combatant.initiativeRoll).toEqual([0, 0]);
			expect(combatant.tempHp).toBe(0);
			expect(combatant.conditions).toEqual([]);
		});

		it('should create log entry for quick-add combatant', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Surprise Enemy',
				hp: 15,
				type: 'creature'
			});

			const addLog = combat.log.find(l => l.message.includes('Surprise Enemy joined'));
			expect(addLog).toBeDefined();
		});
	});
});

describe('CombatRepository - Optional Hero Fields (Issue #233)', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Optional Fields Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addHeroCombatant - optional maxHp', () => {
		it('should allow adding hero without maxHp', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Flexible Hero',
				entityId: 'entity-1',
				hp: 25,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			expect(combat.combatants).toHaveLength(1);
			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.hp).toBe(25);
			expect(hero.maxHp).toBeUndefined();
		});

		it('should still accept maxHp when provided', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Standard Hero',
				entityId: 'entity-2',
				hp: 30,
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});

			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.hp).toBe(30);
			expect(hero.maxHp).toBe(40);
		});
	});

	describe('addHeroCombatant - optional heroicResource', () => {
		it('should allow adding hero without heroicResource', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Resourceless Hero',
				entityId: 'entity-3',
				hp: 35
			});

			expect(combat.combatants).toHaveLength(1);
			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.name).toBe('Resourceless Hero');
			expect(hero.heroicResource).toBeUndefined();
		});

		it('should still accept heroicResource when provided', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Resourceful Hero',
				entityId: 'entity-4',
				hp: 35,
				heroicResource: { current: 3, max: 5, name: 'Victories' }
			});

			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.heroicResource).toBeDefined();
			expect(hero.heroicResource?.name).toBe('Victories');
		});
	});

	describe('addCreatureCombatant - optional entityId', () => {
		it('should allow adding creature without entityId (ad-hoc)', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Random Creature',
				hp: 20,
				threat: 1
			});

			expect(combat.combatants).toHaveLength(1);
			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.name).toBe('Random Creature');
			expect(creature.entityId).toBeUndefined();
		});

		it('should mark creature as ad-hoc when no entityId provided', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Ad-hoc Monster',
				hp: 25,
				threat: 2
			});

			const creature = combat.combatants[0] as any;
			expect(creature.isAdHoc).toBe(true);
		});

		it('should still accept entityId when provided', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Templated Creature',
				entityId: 'entity-5',
				hp: 30,
				threat: 2
			});

			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.entityId).toBe('entity-5');
		});
	});
});

describe('CombatRepository - Optional Max HP Healing (Issue #233)', () => {
	let combatId: string;
	let heroId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Uncapped Healing Test' });
		combatId = combat.id;

		const withHero = await combatRepository.addHeroCombatant(combatId, {
			name: 'No Max Hero',
			entityId: 'entity-1',
			hp: 30
		});
		heroId = withHero.combatants[0].id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('applyHealing - no cap when maxHp undefined', () => {
		it('should allow healing beyond original HP when maxHp is undefined', async () => {
			// Start at 30 HP
			const healed = await combatRepository.applyHealing(combatId, heroId, 20);

			const hero = healed.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(50); // 30 + 20, not capped
		});

		it('should allow multiple healings to stack when no maxHp', async () => {
			await combatRepository.applyHealing(combatId, heroId, 10);
			const healed = await combatRepository.applyHealing(combatId, heroId, 15);

			const hero = healed.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(55); // 30 + 10 + 15
		});

		it('should still cap healing when maxHp is defined', async () => {
			// Add a hero WITH maxHp
			const withMaxHp = await combatRepository.addHeroCombatant(combatId, {
				name: 'Capped Hero',
				entityId: 'entity-2',
				hp: 35,
				maxHp: 40,
				heroicResource: { current: 2, max: 3, name: 'Focus' }
			});
			const cappedHeroId = withMaxHp.combatants[1].id;

			const healed = await combatRepository.applyHealing(combatId, cappedHeroId, 20);

			const hero = healed.combatants.find(c => c.id === cappedHeroId);
			expect(hero?.hp).toBe(40); // Capped at maxHp
		});

		it('should heal from damaged state when no maxHp', async () => {
			// Damage first
			await combatRepository.applyDamage(combatId, heroId, 15);

			const healed = await combatRepository.applyHealing(combatId, heroId, 20);

			const hero = healed.combatants.find(c => c.id === heroId);
			expect(hero?.hp).toBe(35); // (30 - 15) + 20 = 35
		});
	});
});

describe('CombatRepository - Update Max HP (Issue #301)', () => {
	let combatId: string;
	let heroId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Max HP Update Test' });
		combatId = combat.id;

		const withHero = await combatRepository.addHeroCombatant(combatId, {
			name: 'Test Hero',
			entityId: 'entity-1',
			hp: 30,
			maxHp: 40,
			heroicResource: { current: 2, max: 3, name: 'Focus' }
		});
		heroId = withHero.combatants[0].id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('updateMaxHp', () => {
		it('should update maxHp for combatant', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 50);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(50);
		});

		it('should clamp currentHP when maxHP reduced below it', async () => {
			// Hero has 30/40 HP
			// Reduce maxHP to 25 (below current HP of 30)
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 25);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(25);
			expect(hero?.hp).toBe(25); // Clamped from 30 to 25
		});

		it('should not change currentHP when maxHP increased', async () => {
			// Hero has 30/40 HP
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 60);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(60);
			expect(hero?.hp).toBe(30); // Unchanged
		});

		it('should not change currentHP when maxHP reduced but still above current', async () => {
			// Hero has 30/40 HP
			// Reduce maxHP to 35 (still above current HP of 30)
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 35);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(35);
			expect(hero?.hp).toBe(30); // Unchanged
		});

		it('should log maxHP change', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 50);

			const maxHpLog = updated.log.find(
				l => l.combatantId === heroId && l.message.includes('max')
			);
			expect(maxHpLog).toBeDefined();
			expect(maxHpLog?.message).toContain('50');
		});

		it('should log HP clamping when maxHP reduced below current', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 25);

			const clampLog = updated.log.find(
				l => l.combatantId === heroId && (
					l.message.includes('clamped') ||
					l.message.includes('reduced') ||
					l.message.includes('adjusted')
				)
			);
			expect(clampLog).toBeDefined();
		});

		it('should allow setting maxHP for combatant with undefined maxHP', async () => {
			// Add ad-hoc combatant without maxHP
			const withAdHoc = await combatRepository.addQuickCombatant(combatId, {
				name: 'Ad-hoc Monster',
				hp: 20,
				type: 'creature'
			});
			const adHocId = withAdHoc.combatants[1].id;

			const updated = await combatRepository.updateMaxHp(combatId, adHocId, 30);

			const combatant = updated.combatants.find(c => c.id === adHocId);
			expect(combatant?.maxHp).toBe(30);
			expect(combatant?.hp).toBe(20); // Unchanged
		});

		it('should validate maxHP must be positive', async () => {
			await expect(
				combatRepository.updateMaxHp(combatId, heroId, 0)
			).rejects.toThrow(/positive|greater than 0/i);
		});

		it('should validate maxHP must not be negative', async () => {
			await expect(
				combatRepository.updateMaxHp(combatId, heroId, -10)
			).rejects.toThrow(/positive|greater than 0/i);
		});

		it('should throw error for non-existent combatant', async () => {
			await expect(
				combatRepository.updateMaxHp(combatId, 'non-existent', 50)
			).rejects.toThrow('not found');
		});

		it('should update timestamp on maxHP change', async () => {
			const before = await combatRepository.getById(combatId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await combatRepository.updateMaxHp(combatId, heroId, 50);

			expect(updated.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
		});

		it('should include old and new maxHP values in log metadata', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 50);

			const maxHpLog = updated.log.find(
				l => l.combatantId === heroId && l.message.includes('max')
			);
			expect(maxHpLog?.metadata).toBeDefined();
			expect(maxHpLog?.metadata?.oldMaxHp).toBe(40);
			expect(maxHpLog?.metadata?.newMaxHp).toBe(50);
		});

		it('should include clamped HP value in log metadata when HP reduced', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 25);

			const clampLog = updated.log.find(
				l => l.combatantId === heroId && l.message.includes('max')
			);
			expect(clampLog?.metadata).toBeDefined();
			expect(clampLog?.metadata?.oldHp).toBe(30);
			expect(clampLog?.metadata?.newHp).toBe(25);
		});

		it('should allow multiple maxHP updates', async () => {
			await combatRepository.updateMaxHp(combatId, heroId, 45);
			await combatRepository.updateMaxHp(combatId, heroId, 50);
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 55);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(55);
		});

		it('should handle edge case of setting maxHP equal to current HP', async () => {
			// Hero has 30/40 HP
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 30);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(30);
			expect(hero?.hp).toBe(30); // Equal, not clamped
		});

		it('should clamp HP to maxHP when combatant is at 0 HP', async () => {
			// Damage hero to 0 HP
			await combatRepository.applyDamage(combatId, heroId, 30);

			// Update maxHP to 20
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 20);

			const hero = updated.combatants.find(c => c.id === heroId);
			expect(hero?.maxHp).toBe(20);
			expect(hero?.hp).toBe(0); // Still 0, can't go negative
		});

		it('should work with creature combatants', async () => {
			const withCreature = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				entityId: 'entity-2',
				hp: 25,
				maxHp: 30,
				threat: 1
			});
			const creatureId = withCreature.combatants[1].id;

			const updated = await combatRepository.updateMaxHp(combatId, creatureId, 40);

			const creature = updated.combatants.find(c => c.id === creatureId);
			expect(creature?.maxHp).toBe(40);
		});

		it('should preserve other combatant properties when updating maxHP', async () => {
			const updated = await combatRepository.updateMaxHp(combatId, heroId, 50);

			const hero = updated.combatants.find(c => c.id === heroId) as HeroCombatant;
			expect(hero.name).toBe('Test Hero');
			expect(hero.type).toBe('hero');
			expect(hero.entityId).toBe('entity-1');
			expect(hero.tempHp).toBe(0);
			expect(hero.conditions).toEqual([]);
			expect(hero.heroicResource).toBeDefined();
		});
	});
});

describe('CombatRepository - Token Indicator Support (Issue #300)', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Token Test Combat' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('addHeroCombatant with tokenIndicator', () => {
		it('should save hero with tokenIndicator', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero with Token',
				hp: 30,
				maxHp: 40,
				tokenIndicator: 'A'
			});

			expect(combat.combatants).toHaveLength(1);
			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.tokenIndicator).toBe('A');
		});

		it('should save hero without tokenIndicator when not provided', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero without Token',
				hp: 30,
				maxHp: 40
			});

			expect(combat.combatants).toHaveLength(1);
			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.tokenIndicator).toBeUndefined();
		});

		it('should accept numeric tokenIndicator', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Player 1',
				hp: 35,
				tokenIndicator: '1'
			});

			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.tokenIndicator).toBe('1');
		});

		it('should accept complex tokenIndicator strings', async () => {
			const combat = await combatRepository.addHeroCombatant(combatId, {
				name: 'Special Hero',
				hp: 30,
				tokenIndicator: 'Red-Alpha-12'
			});

			const hero = combat.combatants[0] as HeroCombatant;
			expect(hero.tokenIndicator).toBe('Red-Alpha-12');
		});
	});

	describe('addCreatureCombatant with tokenIndicator', () => {
		it('should save creature with tokenIndicator', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin',
				hp: 15,
				threat: 1,
				tokenIndicator: 'G1'
			});

			expect(combat.combatants).toHaveLength(1);
			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.tokenIndicator).toBe('G1');
		});

		it('should save creature without tokenIndicator when not provided', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Dragon',
				hp: 100,
				threat: 3
			});

			expect(combat.combatants).toHaveLength(1);
			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.tokenIndicator).toBeUndefined();
		});

		it('should support single-character tokenIndicator', async () => {
			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				hp: 20,
				tokenIndicator: 'B'
			});

			const creature = combat.combatants[0] as CreatureCombatant;
			expect(creature.tokenIndicator).toBe('B');
		});
	});

	describe('addQuickCombatant with tokenIndicator', () => {
		it('should save quick combatant with tokenIndicator', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Quick Enemy',
				type: 'creature',
				hp: 12,
				tokenIndicator: 'Q1'
			});

			expect(combat.combatants).toHaveLength(1);
			const combatant = combat.combatants[0];
			expect(combatant.tokenIndicator).toBe('Q1');
			expect(combatant.isAdHoc).toBe(true);
		});

		it('should save quick combatant without tokenIndicator when not provided', async () => {
			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Simple Minion',
				type: 'creature',
				hp: 10
			});

			expect(combat.combatants).toHaveLength(1);
			const combatant = combat.combatants[0];
			expect(combatant.tokenIndicator).toBeUndefined();
		});

		it('should preserve tokenIndicator through auto-numbering', async () => {
			await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				type: 'creature',
				hp: 12,
				tokenIndicator: 'G'
			});

			const combat = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				type: 'creature',
				hp: 12,
				tokenIndicator: 'H'
			});

			expect(combat.combatants).toHaveLength(2);
			expect(combat.combatants[0].name).toBe('Goblin');
			expect(combat.combatants[0].tokenIndicator).toBe('G');
			expect(combat.combatants[1].name).toBe('Goblin 1');
			expect(combat.combatants[1].tokenIndicator).toBe('H');
		});
	});

	describe('updateCombatant with tokenIndicator', () => {
		it('should update tokenIndicator on existing combatant', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc',
				hp: 25,
				tokenIndicator: 'O1'
			});

			const combatantId = created.combatants[0].id;

			const updated = await combatRepository.updateCombatant(combatId, combatantId, {
				tokenIndicator: 'O-Updated'
			});

			const combatant = updated.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('O-Updated');
		});

		it('should add tokenIndicator to combatant that did not have one', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Troll',
				hp: 50
			});

			const combatantId = created.combatants[0].id;

			const updated = await combatRepository.updateCombatant(combatId, combatantId, {
				tokenIndicator: 'T1'
			});

			const combatant = updated.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('T1');
		});

		it('should remove tokenIndicator when set to undefined', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Zombie',
				hp: 18,
				tokenIndicator: 'Z1'
			});

			const combatantId = created.combatants[0].id;

			const updated = await combatRepository.updateCombatant(combatId, combatantId, {
				tokenIndicator: undefined
			});

			const combatant = updated.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBeUndefined();
		});

		it('should preserve tokenIndicator when updating other fields', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Skeleton',
				hp: 15,
				tokenIndicator: 'SK1'
			});

			const combatantId = created.combatants[0].id;

			const updated = await combatRepository.updateCombatant(combatId, combatantId, {
				hp: 10
			});

			const combatant = updated.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('SK1');
			expect(combatant?.hp).toBe(10);
		});
	});

	describe('tokenIndicator persistence', () => {
		it('should persist tokenIndicator through damage', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin Archer',
				hp: 20,
				tokenIndicator: 'GA1'
			});

			const combatantId = created.combatants[0].id;

			const damaged = await combatRepository.applyDamage(combatId, combatantId, 5);

			const combatant = damaged.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('GA1');
			expect(combatant?.hp).toBe(15);
		});

		it('should persist tokenIndicator through healing', async () => {
			const created = await combatRepository.addHeroCombatant(combatId, {
				name: 'Cleric',
				hp: 25,
				maxHp: 40,
				tokenIndicator: 'PC1'
			});

			const combatantId = created.combatants[0].id;

			const healed = await combatRepository.applyHealing(combatId, combatantId, 10);

			const combatant = healed.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('PC1');
			expect(combatant?.hp).toBe(35);
		});

		it('should persist tokenIndicator through initiative roll', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf',
				hp: 18,
				tokenIndicator: 'W1'
			});

			const combatantId = created.combatants[0].id;

			const rolled = await combatRepository.rollInitiative(combatId, combatantId, 2);

			const combatant = rolled.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('W1');
			expect(combatant?.initiative).toBeGreaterThan(0);
		});

		it('should persist tokenIndicator through combat lifecycle', async () => {
			const created = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Boss',
				hp: 100,
				threat: 3,
				tokenIndicator: 'BOSS'
			});

			const combatantId = created.combatants[0].id;

			await combatRepository.startCombat(combatId);
			await combatRepository.pauseCombat(combatId);
			const resumed = await combatRepository.resumeCombat(combatId);

			const combatant = resumed.combatants.find(c => c.id === combatantId);
			expect(combatant?.tokenIndicator).toBe('BOSS');
		});
	});

	describe('multiple combatants with tokenIndicators', () => {
		it('should maintain different tokenIndicators for multiple combatants', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin A',
				hp: 12,
				tokenIndicator: 'A'
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin B',
				hp: 12,
				tokenIndicator: 'B'
			});

			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin C',
				hp: 12,
				tokenIndicator: 'C'
			});

			expect(combat.combatants).toHaveLength(3);
			expect(combat.combatants[0].tokenIndicator).toBe('A');
			expect(combat.combatants[1].tokenIndicator).toBe('B');
			expect(combat.combatants[2].tokenIndicator).toBe('C');
		});

		it('should handle mix of combatants with and without tokenIndicators', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Marked Enemy',
				hp: 15,
				tokenIndicator: 'M1'
			});

			const combat = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Unmarked Enemy',
				hp: 15
			});

			expect(combat.combatants).toHaveLength(2);
			expect(combat.combatants[0].tokenIndicator).toBe('M1');
			expect(combat.combatants[1].tokenIndicator).toBeUndefined();
		});
	});
});

// ============================================================================
// Group Management Tests (Issue #263)
// ============================================================================

describe('CombatRepository - Group Management (Issue #263)', () => {
	let combatId: string;

	beforeEach(async () => {
		const combat = await combatRepository.create({
			name: 'Group Test Combat'
		});
		combatId = combat.id;
	});

	describe('createGroup', () => {
		it('should create a group from selected combatants', async () => {
			// Add some creatures
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 1',
				hp: 8
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 2',
				hp: 8
			});
			const combatBefore = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 3',
				hp: 8
			});

			const memberIds = combatBefore.combatants.map(c => c.id);

			// Create group from all three goblins
			const combat = await combatRepository.createGroup(combatId, {
				name: 'Goblin Squad',
				memberIds
			});

			// Should have a group
			expect(combat.groups).toBeDefined();
			expect(combat.groups).toHaveLength(1);

			const group = combat.groups[0];
			expect(group.name).toBe('Goblin Squad');
			expect(group.memberIds).toHaveLength(3);
			expect(group.memberIds).toEqual(expect.arrayContaining(memberIds));

			// All members should have the groupId set
			combat.combatants.forEach(c => {
				expect(c.groupId).toBe(group.id);
			});

			// Group should share initiative from first member
			expect(group.initiative).toBe(combat.combatants[0].initiative);
		});

		it('should assign fractional turnOrder to group members', async () => {
			// Add creatures
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 1',
				hp: 15
			});
			const combatBefore = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 2',
				hp: 15
			});

			const memberIds = combatBefore.combatants.map(c => c.id);

			const combat = await combatRepository.createGroup(combatId, {
				name: 'Orc Band',
				memberIds
			});

			const group = combat.groups[0];

			// Group should have integer turnOrder
			expect(group.turnOrder).toBe(Math.floor(group.turnOrder));

			// Members should have fractional turnOrder (group.turnOrder + 0.1, 0.2, etc.)
			const members = combat.combatants.filter(c => c.groupId === group.id);
			members.forEach((member, index) => {
				const expectedTurnOrder = group.turnOrder + (index + 1) * 0.1;
				expect(member.turnOrder).toBeCloseTo(expectedTurnOrder, 1);
			});
		});

		it('should use custom initiative if provided', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 1',
				hp: 12
			});
			const combatBefore = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 2',
				hp: 12
			});

			const memberIds = combatBefore.combatants.map(c => c.id);

			const combat = await combatRepository.createGroup(combatId, {
				name: 'Custom Init Group',
				memberIds,
				initiative: 18
			});

			const group = combat.groups[0];
			expect(group.initiative).toBe(18);

			// All members should have the custom initiative
			combat.combatants.forEach(c => {
				expect(c.initiative).toBe(18);
			});
		});

		it('should log group creation', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Minion 1',
				hp: 5
			});
			const combatBefore = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Minion 2',
				hp: 5
			});

			const memberIds = combatBefore.combatants.map(c => c.id);

			const combat = await combatRepository.createGroup(combatId, {
				name: 'Minion Swarm',
				memberIds
			});

			// Should have log entry for group creation
			const logEntry = combat.log.find(entry =>
				entry.message.includes('Minion Swarm') && entry.message.includes('created')
			);
			expect(logEntry).toBeDefined();
			expect(logEntry?.type).toBe('system');
		});

		it('should throw error if combat not found', async () => {
			await expect(
				combatRepository.createGroup('invalid-id', {
					name: 'Test Group',
					memberIds: ['member-1']
				})
			).rejects.toThrow('Combat session invalid-id not found');
		});

		it('should throw error if member not found', async () => {
			await expect(
				combatRepository.createGroup(combatId, {
					name: 'Invalid Group',
					memberIds: ['invalid-member-id']
				})
			).rejects.toThrow('Combatant invalid-member-id not found');
		});

		it('should throw error if trying to group already grouped combatant', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 1',
				hp: 10
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 2',
				hp: 10
			});
			const combatBefore = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 3',
				hp: 10
			});

			const memberIds = combatBefore.combatants.map(c => c.id);

			// Create first group
			await combatRepository.createGroup(combatId, {
				name: 'Group 1',
				memberIds: [memberIds[0], memberIds[1]]
			});

			// Try to create second group with a member that's already grouped
			await expect(
				combatRepository.createGroup(combatId, {
					name: 'Group 2',
					memberIds: [memberIds[0], memberIds[2]] // memberIds[0] is already grouped
				})
			).rejects.toThrow('already in a group');
		});
	});

	describe('addToGroup', () => {
		it('should add a combatant to an existing group', async () => {
			// Create initial group
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 1',
				hp: 8
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 2',
				hp: 8
			});
			const combatWithCombatants = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 3',
				hp: 8
			});

			const initialMemberIds = [
				combatWithCombatants.combatants[0].id,
				combatWithCombatants.combatants[1].id
			];

			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Goblin Squad',
				memberIds: initialMemberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const newMemberId = combatWithCombatants.combatants[2].id;

			// Add third goblin to the group
			const combat = await combatRepository.addToGroup(combatId, newMemberId, groupId);

			const group = combat.groups.find(g => g.id === groupId);
			expect(group).toBeDefined();
			expect(group!.memberIds).toHaveLength(3);
			expect(group!.memberIds).toContain(newMemberId);

			// New member should have groupId set
			const newMember = combat.combatants.find(c => c.id === newMemberId);
			expect(newMember?.groupId).toBe(groupId);

			// New member should inherit group's initiative
			expect(newMember?.initiative).toBe(group!.initiative);
		});

		it('should assign appropriate fractional turnOrder to new member', async () => {
			// Create group with 2 members
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 1',
				hp: 15
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 2',
				hp: 15
			});

			const initialMemberIds = combatWith2.combatants.map(c => c.id);

			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Orc Band',
				memberIds: initialMemberIds
			});

			// Add a third member
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 3',
				hp: 15
			});

			const groupId = combatWithGroup.groups[0].id;
			const newMemberId = combatWith3.combatants[combatWith3.combatants.length - 1].id;

			const combat = await combatRepository.addToGroup(combatId, newMemberId, groupId);

			const group = combat.groups.find(g => g.id === groupId)!;
			const members = combat.combatants.filter(c => c.groupId === groupId);

			// Should now have 3 members
			expect(members).toHaveLength(3);

			// New member should be at end with appropriate fractional turnOrder
			const newMember = combat.combatants.find(c => c.id === newMemberId)!;
			expect(newMember.turnOrder).toBeCloseTo(group.turnOrder + 0.3, 1);
		});

		it('should log addition to group', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Skeleton 1',
				hp: 10
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Skeleton 2',
				hp: 10
			});

			const memberIds = [combatWith2.combatants[0].id];
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Undead Squad',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const newMemberId = combatWith2.combatants[1].id;

			const combat = await combatRepository.addToGroup(combatId, newMemberId, groupId);

			const logEntry = combat.log.find(entry =>
				entry.message.includes('Skeleton 2') && entry.message.includes('Undead Squad')
			);
			expect(logEntry).toBeDefined();
			expect(logEntry?.type).toBe('system');
		});

		it('should throw error if combatant already in a group', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 1',
				hp: 10
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 2',
				hp: 10
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Creature 3',
				hp: 10
			});

			const memberIds = combatWith3.combatants.map(c => c.id);

			// Create first group with first two creatures
			const combatWithGroup1 = await combatRepository.createGroup(combatId, {
				name: 'Group 1',
				memberIds: [memberIds[0], memberIds[1]]
			});

			// Create second group with third creature
			const combatWithGroup2 = await combatRepository.createGroup(combatId, {
				name: 'Group 2',
				memberIds: [memberIds[2]]
			});

			const group1Id = combatWithGroup1.groups[0].id;
			const group2MemberId = memberIds[2];

			// Try to add creature from group 2 to group 1
			await expect(
				combatRepository.addToGroup(combatId, group2MemberId, group1Id)
			).rejects.toThrow('already in a group');
		});
	});

	describe('removeFromGroup', () => {
		it('should remove a member from a group', async () => {
			// Create group with 3 members
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 1',
				hp: 8
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 2',
				hp: 8
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 3',
				hp: 8
			});

			const memberIds = combatWith3.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Goblin Squad',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const memberToRemove = memberIds[1];

			// Remove one member
			const combat = await combatRepository.removeFromGroup(combatId, memberToRemove);

			const group = combat.groups.find(g => g.id === groupId)!;
			expect(group.memberIds).toHaveLength(2);
			expect(group.memberIds).not.toContain(memberToRemove);

			// Removed member should not have groupId
			const removedMember = combat.combatants.find(c => c.id === memberToRemove);
			expect(removedMember?.groupId).toBeUndefined();

			// Removed member should have standalone integer turnOrder
			expect(removedMember?.turnOrder).toBe(Math.floor(removedMember!.turnOrder));
		});

		it('should auto-dissolve group when only 1 member remains', async () => {
			// Create group with 2 members
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 1',
				hp: 15
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 2',
				hp: 15
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Orc Pair',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const memberToRemove = memberIds[0];

			// Remove one member, leaving only 1
			const combat = await combatRepository.removeFromGroup(combatId, memberToRemove);

			// Group should be dissolved
			expect(combat.groups.find(g => g.id === groupId)).toBeUndefined();

			// Remaining member should not have groupId
			const remainingMember = combat.combatants.find(c => c.id === memberIds[1]);
			expect(remainingMember?.groupId).toBeUndefined();

			// Both members should have standalone turnOrder
			combat.combatants.forEach(c => {
				expect(c.turnOrder).toBe(Math.floor(c.turnOrder));
			});
		});

		it('should log removal and auto-dissolution', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Skeleton 1',
				hp: 10
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Skeleton 2',
				hp: 10
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Undead Duo',
				memberIds
			});

			const memberToRemove = memberIds[0];
			const combat = await combatRepository.removeFromGroup(combatId, memberToRemove);

			// Should log removal
			const removalLog = combat.log.find(entry =>
				entry.message.includes('Skeleton 1') && entry.message.includes('removed')
			);
			expect(removalLog).toBeDefined();

			// Should log auto-dissolution
			const dissolutionLog = combat.log.find(entry =>
				entry.message.includes('Undead Duo') && entry.message.includes('dissolved')
			);
			expect(dissolutionLog).toBeDefined();
		});

		it('should throw error if combatant not in a group', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Standalone',
				hp: 12
			});

			const combat = await combatRepository.getById(combatId);
			const combatantId = combat!.combatants[0].id;

			await expect(
				combatRepository.removeFromGroup(combatId, combatantId)
			).rejects.toThrow('not in a group');
		});
	});

	describe('splitFromGroup', () => {
		it('should split a member into standalone combatant', async () => {
			// Create group with 3 members
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf 1',
				hp: 11
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf 2',
				hp: 11
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf 3',
				hp: 11
			});

			const memberIds = combatWith3.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Wolf Pack',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const memberToSplit = memberIds[1];

			// Split one wolf from the pack
			const combat = await combatRepository.splitFromGroup(combatId, memberToSplit);

			// Group should still exist with 2 members
			const group = combat.groups.find(g => g.id === groupId)!;
			expect(group).toBeDefined();
			expect(group.memberIds).toHaveLength(2);
			expect(group.memberIds).not.toContain(memberToSplit);

			// Split member should be standalone
			const splitMember = combat.combatants.find(c => c.id === memberToSplit)!;
			expect(splitMember.groupId).toBeUndefined();
			expect(splitMember.turnOrder).toBe(Math.floor(splitMember.turnOrder));
		});

		it('should allow specifying new initiative for split member', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Bandit 1',
				hp: 14
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Bandit 2',
				hp: 14
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Bandit Gang',
				memberIds
			});

			const memberToSplit = memberIds[0];

			const combat = await combatRepository.splitFromGroup(combatId, memberToSplit, 16);

			const splitMember = combat.combatants.find(c => c.id === memberToSplit)!;
			expect(splitMember.initiative).toBe(16);
		});

		it('should log the split action', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Thug 1',
				hp: 12
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Thug 2',
				hp: 12
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Thug 3',
				hp: 12
			});

			const memberIds = combatWith3.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Thug Crew',
				memberIds
			});

			const memberToSplit = memberIds[0];
			const combat = await combatRepository.splitFromGroup(combatId, memberToSplit);

			const logEntry = combat.log.find(entry =>
				entry.message.includes('Thug 1') && entry.message.includes('split from')
			);
			expect(logEntry).toBeDefined();
			expect(logEntry?.type).toBe('system');
		});
	});

	describe('dissolveGroup', () => {
		it('should dissolve a group and make all members standalone', async () => {
			// Create group
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Kobold 1',
				hp: 5
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Kobold 2',
				hp: 5
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Kobold 3',
				hp: 5
			});

			const memberIds = combatWith3.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Kobold Mob',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;

			// Dissolve the group
			const combat = await combatRepository.dissolveGroup(combatId, groupId);

			// Group should be removed
			expect(combat.groups.find(g => g.id === groupId)).toBeUndefined();

			// All former members should be standalone
			combat.combatants.forEach(c => {
				expect(c.groupId).toBeUndefined();
				expect(c.turnOrder).toBe(Math.floor(c.turnOrder));
			});
		});

		it('should log group dissolution', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Imp 1',
				hp: 7
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Imp 2',
				hp: 7
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Imp Swarm',
				memberIds
			});

			const groupId = combatWithGroup.groups[0].id;
			const combat = await combatRepository.dissolveGroup(combatId, groupId);

			const logEntry = combat.log.find(entry =>
				entry.message.includes('Imp Swarm') && entry.message.includes('dissolved')
			);
			expect(logEntry).toBeDefined();
			expect(logEntry?.type).toBe('system');
		});

		it('should throw error if group not found', async () => {
			await expect(
				combatRepository.dissolveGroup(combatId, 'invalid-group-id')
			).rejects.toThrow('Group invalid-group-id not found');
		});
	});

	describe('nextTurn with groups', () => {
		it('should advance through group members sequentially', async () => {
			// Create combat with hero and grouped enemies
			await combatRepository.addHeroCombatant(combatId, {
				name: 'Hero',
				hp: 40,
				maxHp: 40
			});

			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 1',
				hp: 8
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 2',
				hp: 8
			});
			const combatWith3Creatures = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Goblin 3',
				hp: 8
			});

			// Roll initiative for all
			const combatWithInit = await combatRepository.rollInitiativeForAll(combatId);

			// Group the goblins
			const goblinIds = combatWithInit.combatants
				.filter(c => c.name.startsWith('Goblin'))
				.map(c => c.id);

			const combatWithGroup = await combatRepository.createGroup(combatId, {
				name: 'Goblin Squad',
				memberIds: goblinIds
			});

			// Start combat
			let combat = await combatRepository.startCombat(combatId);

			// Turn 0: Should be first combatant
			const firstCombatant = combat.combatants[0];

			// Next turn
			combat = await combatRepository.nextTurn(combatId);
			expect(combat.currentTurn).toBe(1);

			// If first was hero, next should be first goblin
			// If first was goblin, next should be second goblin
			const secondCombatant = combat.combatants[combat.currentTurn];
			expect(secondCombatant).toBeDefined();

			// Continue through the group
			combat = await combatRepository.nextTurn(combatId);
			const thirdCombatant = combat.combatants[combat.currentTurn];
			expect(thirdCombatant).toBeDefined();
		});

		it('should handle groups at round boundary', async () => {
			// Create simple combat with just grouped creatures
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 1',
				hp: 15
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Orc 2',
				hp: 15
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			await combatRepository.createGroup(combatId, {
				name: 'Orc Band',
				memberIds
			});

			await combatRepository.rollInitiativeForAll(combatId);
			let combat = await combatRepository.startCombat(combatId);

			const totalCombatants = combat.combatants.length;

			// Advance through all turns
			for (let i = 0; i < totalCombatants - 1; i++) {
				combat = await combatRepository.nextTurn(combatId);
			}

			// Next turn should wrap to round 2
			combat = await combatRepository.nextTurn(combatId);
			expect(combat.currentRound).toBe(2);
			expect(combat.currentTurn).toBe(0);
		});
	});

	describe('previousTurn with groups', () => {
		it('should go back through group members', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf 1',
				hp: 11
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wolf 2',
				hp: 11
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			await combatRepository.createGroup(combatId, {
				name: 'Wolf Pack',
				memberIds
			});

			await combatRepository.rollInitiativeForAll(combatId);
			let combat = await combatRepository.startCombat(combatId);

			// Advance one turn
			combat = await combatRepository.nextTurn(combatId);
			const currentTurnAfterNext = combat.currentTurn;

			// Go back one turn
			combat = await combatRepository.previousTurn(combatId);
			expect(combat.currentTurn).toBe(currentTurnAfterNext - 1);
		});
	});

	describe('Group edge cases', () => {
		it('should handle removing defeated combatant from group', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Bandit 1',
				hp: 10
			});
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Bandit 2',
				hp: 10
			});
			const combatWith3 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Bandit 3',
				hp: 10
			});

			const memberIds = combatWith3.combatants.map(c => c.id);
			let combat = await combatRepository.createGroup(combatId, {
				name: 'Bandit Gang',
				memberIds
			});

			const groupId = combat.groups[0].id;
			const victimId = memberIds[0];

			// Deal lethal damage
			combat = await combatRepository.applyDamage(combatId, victimId, 10);

			// Remove the defeated combatant
			combat = await combatRepository.removeCombatant(combatId, victimId);

			// Group should still exist with remaining members
			const group = combat.groups.find(g => g.id === groupId);
			expect(group).toBeDefined();
			expect(group!.memberIds).toHaveLength(2);
			expect(group!.memberIds).not.toContain(victimId);
		});

		it('should dissolve group when removing second-to-last member', async () => {
			await combatRepository.addCreatureCombatant(combatId, {
				name: 'Thug 1',
				hp: 12
			});
			const combatWith2 = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Thug 2',
				hp: 12
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			let combat = await combatRepository.createGroup(combatId, {
				name: 'Thug Duo',
				memberIds
			});

			const groupId = combat.groups[0].id;
			const victimId = memberIds[0];

			// Remove one member (leaving 1)
			combat = await combatRepository.removeCombatant(combatId, victimId);

			// Group should be auto-dissolved
			expect(combat.groups.find(g => g.id === groupId)).toBeUndefined();

			// Remaining member should be standalone
			const remainingMember = combat.combatants[0];
			expect(remainingMember.groupId).toBeUndefined();
		});

		it('should handle heroes in groups', async () => {
			await combatRepository.addHeroCombatant(combatId, {
				name: 'Ranger 1',
				hp: 30,
				maxHp: 30
			});
			const combatWith2 = await combatRepository.addHeroCombatant(combatId, {
				name: 'Ranger 2',
				hp: 30,
				maxHp: 30
			});

			const memberIds = combatWith2.combatants.map(c => c.id);
			const combat = await combatRepository.createGroup(combatId, {
				name: 'Ranger Team',
				memberIds
			});

			const group = combat.groups[0];
			expect(group.name).toBe('Ranger Team');
			expect(group.memberIds).toHaveLength(2);

			// Both heroes should be in the group
			combat.combatants.forEach(c => {
				expect(c.type).toBe('hero');
				expect(c.groupId).toBe(group.id);
			});
		});
	});
});
