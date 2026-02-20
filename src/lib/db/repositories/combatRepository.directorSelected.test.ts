/**
 * Tests for Director-Selected Turn Mode (Issue #501)
 *
 * Draw Steel Combat - Alternating Turn Dynamics
 *
 * This test suite covers the director-selected turn mode where the director
 * chooses who acts next, implementing Draw Steel's alternating turn system.
 *
 * Key Features:
 * - Director selects who goes next from eligible combatants
 * - Creatures at 0 HP hidden from selection
 * - Heroes at 0 HP still shown (can be stabilized/healed)
 * - Round auto-advances when all eligible have acted
 * - Sequential mode remains for backwards compatibility
 *
 * Testing Strategy:
 * - Helper functions (getEligibleCombatants, getSuggestedSide)
 * - selectCombatantTurn validation and state changes
 * - endCombatantTurn tracking and round advancement
 * - Backward compatibility with sequential mode
 * - Edge cases (all acted, dead combatants, etc.)
 *
 * TDD RED Phase - These tests will FAIL until implementation is complete.
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { combatRepository, getEligibleCombatants, getSuggestedSide } from './combatRepository';
import { db } from '../index';
import type { CombatSession } from '$lib/types/combat';

describe('CombatRepository - Director-Selected Turn Mode', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		await db.combatSessions.clear();
	});

	describe('create with turnMode', () => {
		it('should default to director-selected mode', async () => {
			const combat = await combatRepository.create({
				name: 'New Combat'
			});

			expect(combat.turnMode).toBe('director-selected');
			expect(combat.actedCombatantIds).toEqual([]);
			expect(combat.activeCombatantId).toBeUndefined();
		});

		it('should create with sequential mode when specified', async () => {
			const combat = await combatRepository.create({
				name: 'Sequential Combat',
				turnMode: 'sequential'
			});

			expect(combat.turnMode).toBe('sequential');
			expect(combat.actedCombatantIds).toEqual([]);
			expect(combat.activeCombatantId).toBeUndefined();
		});

		it('should create with director-selected mode when specified', async () => {
			const combat = await combatRepository.create({
				name: 'Director Combat',
				turnMode: 'director-selected'
			});

			expect(combat.turnMode).toBe('director-selected');
		});
	});

	describe('startCombat with director-selected mode', () => {
		it('should initialize actedCombatantIds as empty array', async () => {
			const combat = await combatRepository.create({
				name: 'Test Combat',
				turnMode: 'director-selected'
			});

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const started = await combatRepository.startCombat(combat.id);

			expect(started.status).toBe('active');
			expect(started.currentRound).toBe(1);
			expect(started.actedCombatantIds).toEqual([]);
			expect(started.activeCombatantId).toBeUndefined();
		});
	});

	describe('getEligibleCombatants', () => {
		it('should return combatants not in actedCombatantIds', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			const hero1 = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero 1',
				hp: 50,
				maxHp: 50
			});

			const hero2 = await combatRepository.addHeroCombatant(hero1.id, {
				name: 'Hero 2',
				hp: 50,
				maxHp: 50
			});

			const creature = await combatRepository.addCreatureCombatant(hero2.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			// Mark hero1 as acted
			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const withActed = {
				...updated,
				actedCombatantIds: [updated.combatants[0].id]
			};
			await db.combatSessions.put(withActed);

			const eligible = getEligibleCombatants(withActed);

			expect(eligible).toHaveLength(2);
			expect(eligible.find(c => c.name === 'Hero 1')).toBeUndefined();
			expect(eligible.find(c => c.name === 'Hero 2')).toBeDefined();
			expect(eligible.find(c => c.name === 'Creature')).toBeDefined();
		});

		it('should exclude creatures at 0 HP', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const withCreature = await combatRepository.addCreatureCombatant(combat.id, {
				name: 'Dead Creature',
				hp: 0,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.addCreatureCombatant(withCreature.id, {
				name: 'Alive Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const eligible = getEligibleCombatants(updated);

			expect(eligible).toHaveLength(2);
			expect(eligible.find(c => c.name === 'Dead Creature')).toBeUndefined();
			expect(eligible.find(c => c.name === 'Hero')).toBeDefined();
			expect(eligible.find(c => c.name === 'Alive Creature')).toBeDefined();
		});

		it('should include heroes at 0 HP (can be stabilized)', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Downed Hero',
				hp: 0,
				maxHp: 50
			});

			const withCreature = await combatRepository.addCreatureCombatant(combat.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const eligible = getEligibleCombatants(updated);

			expect(eligible).toHaveLength(2);
			expect(eligible.find(c => c.name === 'Downed Hero')).toBeDefined();
			expect(eligible.find(c => c.name === 'Creature')).toBeDefined();
		});

		it('should return empty array when all have acted', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const allActed = {
				...updated,
				actedCombatantIds: [updated.combatants[0].id]
			};
			await db.combatSessions.put(allActed);

			const eligible = getEligibleCombatants(allActed);

			expect(eligible).toEqual([]);
		});

		it('should handle combatants with 0 HP and already acted', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			await combatRepository.addCreatureCombatant(combat.id, {
				name: 'Dead Acted Creature',
				hp: 0,
				maxHp: 30,
				threat: 1
			});

			const withHero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			// Mark both as acted (dead creature should already be excluded)
			const allActed = {
				...updated,
				actedCombatantIds: updated.combatants.map(c => c.id)
			};

			const eligible = getEligibleCombatants(allActed);

			expect(eligible).toEqual([]);
		});
	});

	describe('getSuggestedSide', () => {
		it('should return "creature" when last acted was a hero', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const withCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			// Last acted was hero
			const withHeroActed = {
				...updated,
				actedCombatantIds: [updated.combatants[0].id]
			};

			const suggested = getSuggestedSide(withHeroActed);

			expect(suggested).toBe('creature');
		});

		it('should return "hero" when last acted was a creature', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const withCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			// Last acted was creature
			const withCreatureActed = {
				...updated,
				actedCombatantIds: [updated.combatants[1].id]
			};

			const suggested = getSuggestedSide(withCreatureActed);

			expect(suggested).toBe('hero');
		});

		it('should return null when no one has acted yet', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const suggested = getSuggestedSide(updated);

			expect(suggested).toBeNull();
		});

		it('should return null when actedCombatantIds is empty', async () => {
			const combat = await combatRepository.create({ name: 'Test' });

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			const suggested = getSuggestedSide(updated);

			expect(suggested).toBeNull();
		});
	});

	describe('selectCombatantTurn', () => {
		it('should set activeCombatantId and log the turn', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);

			const heroId = hero.combatants[0].id;
			const updated = await combatRepository.selectCombatantTurn(combat.id, heroId);

			expect(updated.activeCombatantId).toBe(heroId);
			expect(updated.log).toContainEqual(
				expect.objectContaining({
					message: expect.stringContaining("Hero's turn"),
					type: 'system'
				})
			);
		});

		it('should throw error if combatant not eligible (already acted)', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			// Manually mark as acted
			const updated = await db.combatSessions.get(combat.id);
			if (!updated) throw new Error('Combat not found');

			await db.combatSessions.put({
				...updated,
				actedCombatantIds: [heroId]
			});

			await expect(
				combatRepository.selectCombatantTurn(combat.id, heroId)
			).rejects.toThrow('not eligible');
		});

		it('should throw error if combatant is a dead creature', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const creature = await combatRepository.addCreatureCombatant(combat.id, {
				name: 'Dead Creature',
				hp: 0,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.startCombat(combat.id);
			const creatureId = creature.combatants[0].id;

			await expect(
				combatRepository.selectCombatantTurn(combat.id, creatureId)
			).rejects.toThrow('not eligible');
		});

		it('should allow selecting a hero at 0 HP', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Downed Hero',
				hp: 0,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			const updated = await combatRepository.selectCombatantTurn(combat.id, heroId);

			expect(updated.activeCombatantId).toBe(heroId);
		});

		it('should throw error if combat is not active', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const heroId = hero.combatants[0].id;

			await expect(
				combatRepository.selectCombatantTurn(combat.id, heroId)
			).rejects.toThrow('not active');
		});

		it('should throw error if combatant does not exist', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			await combatRepository.startCombat(combat.id);

			await expect(
				combatRepository.selectCombatantTurn(combat.id, 'non-existent-id')
			).rejects.toThrow('not found');
		});
	});

	describe('endCombatantTurn', () => {
		it('should add activeCombatantId to actedCombatantIds', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			// Add a second combatant so round doesn't auto-advance
			const withCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.startCombat(combat.id);
			const heroId = withCreature.combatants[0].id;

			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const updated = await combatRepository.endCombatantTurn(combat.id);

			expect(updated.actedCombatantIds).toContain(heroId);
		});

		it('should clear activeCombatantId after ending turn', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const updated = await combatRepository.endCombatantTurn(combat.id);

			expect(updated.activeCombatantId).toBeUndefined();
		});

		it('should auto-advance round when all eligible have acted', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const withCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.startCombat(combat.id);

			const combatants = withCreature.combatants;
			const heroId = combatants[0].id;
			const creatureId = combatants[1].id;

			// Hero acts
			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const afterHero = await combatRepository.endCombatantTurn(combat.id);

			expect(afterHero.currentRound).toBe(1);
			expect(afterHero.actedCombatantIds).toContain(heroId);

			// Creature acts (last one)
			await combatRepository.selectCombatantTurn(combat.id, creatureId);
			const afterCreature = await combatRepository.endCombatantTurn(combat.id);

			// Should advance to round 2
			expect(afterCreature.currentRound).toBe(2);
			expect(afterCreature.actedCombatantIds).toEqual([]);
		});

		it('should skip dead creatures when checking round completion', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			const withDeadCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Dead Creature',
				hp: 0,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.startCombat(combat.id);

			const heroId = withDeadCreature.combatants[0].id;

			// Only hero is eligible, should advance round after hero acts
			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const updated = await combatRepository.endCombatantTurn(combat.id);

			expect(updated.currentRound).toBe(2);
			expect(updated.actedCombatantIds).toEqual([]);
		});

		it('should log round advancement', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const updated = await combatRepository.endCombatantTurn(combat.id);

			expect(updated.log).toContainEqual(
				expect.objectContaining({
					message: expect.stringContaining('Round 2'),
					type: 'system'
				})
			);
		});

		it('should throw error if no active combatant', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			await combatRepository.startCombat(combat.id);

			await expect(
				combatRepository.endCombatantTurn(combat.id)
			).rejects.toThrow('No active combatant');
		});

		it('should throw error if combat is not active', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			await expect(
				combatRepository.endCombatantTurn(combat.id)
			).rejects.toThrow('not active');
		});
	});

	describe('nextTurn in director-selected mode', () => {
		it('should delegate to endCombatantTurn when in director-selected mode', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			// Add a second combatant so round doesn't auto-advance
			const withCreature = await combatRepository.addCreatureCombatant(hero.id, {
				name: 'Creature',
				hp: 30,
				maxHp: 30,
				threat: 1
			});

			await combatRepository.startCombat(combat.id);
			const heroId = withCreature.combatants[0].id;

			await combatRepository.selectCombatantTurn(combat.id, heroId);
			const updated = await combatRepository.nextTurn(combat.id);

			expect(updated.actedCombatantIds).toContain(heroId);
			expect(updated.activeCombatantId).toBeUndefined();
		});
	});

	describe('previousTurn in director-selected mode', () => {
		it('should undo last turn by removing from actedCombatantIds', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			await combatRepository.selectCombatantTurn(combat.id, heroId);
			await combatRepository.endCombatantTurn(combat.id);

			const updated = await combatRepository.previousTurn(combat.id);

			expect(updated.actedCombatantIds).not.toContain(heroId);
		});

		it('should handle going back across round boundaries', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			// Complete round 1
			await combatRepository.selectCombatantTurn(combat.id, heroId);
			await combatRepository.endCombatantTurn(combat.id);

			// Now in round 2 with empty actedCombatantIds
			const afterRound1 = await db.combatSessions.get(combat.id);
			expect(afterRound1?.currentRound).toBe(2);

			// Go back
			const updated = await combatRepository.previousTurn(combat.id);

			expect(updated.currentRound).toBe(1);
			expect(updated.actedCombatantIds).toEqual([]);
		});

		it('should not go before round 1', async () => {
			const combat = await combatRepository.create({
				name: 'Test',
				turnMode: 'director-selected'
			});

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);

			const updated = await combatRepository.previousTurn(combat.id);

			expect(updated.currentRound).toBe(1);
			expect(updated.actedCombatantIds).toEqual([]);
		});
	});

	describe('Backward Compatibility - Sequential Mode', () => {
		it('should use traditional nextTurn behavior in sequential mode', async () => {
			const combat = await combatRepository.create({
				name: 'Sequential Combat',
				turnMode: 'sequential'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero 1',
				hp: 50,
				maxHp: 50
			});

			const withHero2 = await combatRepository.addHeroCombatant(hero.id, {
				name: 'Hero 2',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);

			// In sequential mode, nextTurn advances currentTurn
			const updated = await combatRepository.nextTurn(combat.id);

			expect(updated.currentTurn).toBe(1);
			expect(updated.actedCombatantIds).toEqual([]);
			expect(updated.activeCombatantId).toBeUndefined();
		});

		it('should use traditional previousTurn behavior in sequential mode', async () => {
			const combat = await combatRepository.create({
				name: 'Sequential Combat',
				turnMode: 'sequential'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero 1',
				hp: 50,
				maxHp: 50
			});

			const withHero2 = await combatRepository.addHeroCombatant(hero.id, {
				name: 'Hero 2',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			await combatRepository.nextTurn(combat.id);

			const updated = await combatRepository.previousTurn(combat.id);

			expect(updated.currentTurn).toBe(0);
			expect(updated.actedCombatantIds).toEqual([]);
		});

		it('should not use selectCombatantTurn in sequential mode', async () => {
			const combat = await combatRepository.create({
				name: 'Sequential Combat',
				turnMode: 'sequential'
			});

			const hero = await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);
			const heroId = hero.combatants[0].id;

			// Should throw error in sequential mode
			await expect(
				combatRepository.selectCombatantTurn(combat.id, heroId)
			).rejects.toThrow('sequential');
		});

		it('should not use endCombatantTurn in sequential mode', async () => {
			const combat = await combatRepository.create({
				name: 'Sequential Combat',
				turnMode: 'sequential'
			});

			await combatRepository.addHeroCombatant(combat.id, {
				name: 'Hero',
				hp: 50,
				maxHp: 50
			});

			await combatRepository.startCombat(combat.id);

			// Should throw error in sequential mode
			await expect(
				combatRepository.endCombatantTurn(combat.id)
			).rejects.toThrow('sequential');
		});
	});
});
