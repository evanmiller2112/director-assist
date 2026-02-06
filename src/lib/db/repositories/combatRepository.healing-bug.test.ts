/**
 * Tests for Issue #241: Uncapped Healing for Quick-Add Combatants
 *
 * TDD RED Phase - These tests SHOULD FAIL
 *
 * Bug Description:
 * Quick-add combatants (ad-hoc creatures added via addQuickCombatant) are created
 * without a maxHp value. The current healing logic (applyHealing) does not cap
 * healing when maxHp is undefined, allowing combatants to be healed to unlimited HP.
 *
 * Expected Behavior:
 * - Healing should ALWAYS be capped at maxHP
 * - For quick-add combatants (maxHp undefined), the starting HP becomes the effective max
 * - Healing at max HP should have no effect
 * - Healing when already at max should keep HP at max
 * - Negative healing values should be treated as 0 (no effect)
 *
 * Testing Strategy:
 * 1. Quick-add combatant healing scenarios
 * 2. Edge cases: healing at max, healing beyond max, multiple heals
 * 3. Negative healing attempts
 * 4. Mixed scenarios: damage then heal
 * 5. Verify maxHp remains undefined but HP is still capped
 * 6. Compare with standard combatants (maxHp defined) behavior
 *
 * These tests will FAIL until the healing logic is fixed to cap at starting HP
 * when maxHp is undefined.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { combatRepository } from './combatRepository';
import { db } from '../index';
import type { Combatant, CreatureCombatant, HeroCombatant } from '$lib/types/combat';

describe('Issue #241: Uncapped Healing Bug for Quick-Add Combatants', () => {
	let combatId: string;

	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Healing Bug Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('Quick-Add Combatant Healing - Core Bug', () => {
		it('should NOT allow healing beyond starting HP for quick-add combatant', async () => {
			// Add quick-add combatant with 20 HP (no maxHp defined)
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 20,
				type: 'creature'
			});

			const goblinId = added.combatants[0].id;

			// Attempt to heal beyond starting HP
			const healed = await combatRepository.applyHealing(combatId, goblinId, 30);

			const goblin = healed.combatants.find(c => c.id === goblinId);
			expect(goblin?.hp).toBe(20); // Should cap at starting HP, not 50
			expect(goblin?.maxHp).toBeUndefined(); // maxHp should remain undefined
		});

		it('should cap healing at starting HP even with large healing values', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Bandit',
				hp: 15,
				type: 'creature'
			});

			const banditId = added.combatants[0].id;

			// Attempt massive heal
			const healed = await combatRepository.applyHealing(combatId, banditId, 1000);

			const bandit = healed.combatants.find(c => c.id === banditId);
			expect(bandit?.hp).toBe(15); // Should cap at starting HP
		});

		it('should allow normal healing after damage, but cap at starting HP', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Orc',
				hp: 25,
				type: 'creature'
			});

			const orcId = added.combatants[0].id;

			// Damage first
			await combatRepository.applyDamage(combatId, orcId, 10);

			// Heal back
			const healed = await combatRepository.applyHealing(combatId, orcId, 15);

			const orc = healed.combatants.find(c => c.id === orcId);
			expect(orc?.hp).toBe(25); // Should cap at starting HP (25), not go to 30
		});
	});

	describe('Edge Cases - Healing at Maximum', () => {
		it('should have no effect when healing a quick-add combatant already at starting HP', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Guard',
				hp: 30,
				type: 'creature'
			});

			const guardId = added.combatants[0].id;

			// Already at max (starting HP), try to heal
			const healed = await combatRepository.applyHealing(combatId, guardId, 10);

			const guard = healed.combatants.find(c => c.id === guardId);
			expect(guard?.hp).toBe(30); // Should remain at starting HP
		});

		it('should cap at starting HP for partial healing from damaged state', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Soldier',
				hp: 40,
				type: 'creature'
			});

			const soldierId = added.combatants[0].id;

			// Take 5 damage
			await combatRepository.applyDamage(combatId, soldierId, 5);

			// Try to heal 10 (which would go 35 + 10 = 45)
			const healed = await combatRepository.applyHealing(combatId, soldierId, 10);

			const soldier = healed.combatants.find(c => c.id === soldierId);
			expect(soldier?.hp).toBe(40); // Should cap at 40, not reach 45
		});
	});

	describe('Multiple Healing Operations', () => {
		it('should cap accumulated healing at starting HP', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Wolf',
				hp: 18,
				type: 'creature'
			});

			const wolfId = added.combatants[0].id;

			// Damage first
			await combatRepository.applyDamage(combatId, wolfId, 12); // Down to 6 HP

			// Multiple heals
			await combatRepository.applyHealing(combatId, wolfId, 5); // 11 HP
			await combatRepository.applyHealing(combatId, wolfId, 5); // Should cap at 18, not go to 16
			const final = await combatRepository.applyHealing(combatId, wolfId, 5); // Still 18

			const wolf = final.combatants.find(c => c.id === wolfId);
			expect(wolf?.hp).toBe(18); // Capped at starting HP
		});

		it('should properly heal to starting HP in steps', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Troll',
				hp: 50,
				type: 'creature'
			});

			const trollId = added.combatants[0].id;

			// Damage significantly
			await combatRepository.applyDamage(combatId, trollId, 30); // Down to 20 HP

			// Heal in increments
			const heal1 = await combatRepository.applyHealing(combatId, trollId, 10);
			expect(heal1.combatants.find(c => c.id === trollId)?.hp).toBe(30);

			const heal2 = await combatRepository.applyHealing(combatId, trollId, 10);
			expect(heal2.combatants.find(c => c.id === trollId)?.hp).toBe(40);

			const heal3 = await combatRepository.applyHealing(combatId, trollId, 10);
			expect(heal3.combatants.find(c => c.id === trollId)?.hp).toBe(50); // At cap

			// Further healing should not increase
			const heal4 = await combatRepository.applyHealing(combatId, trollId, 10);
			expect(heal4.combatants.find(c => c.id === trollId)?.hp).toBe(50); // Still capped
		});
	});

	describe('Negative Healing Values', () => {
		it('should treat negative healing as no healing (not damage)', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Kobold',
				hp: 12,
				type: 'creature'
			});

			const koboldId = added.combatants[0].id;

			// Attempt negative healing
			const healed = await combatRepository.applyHealing(combatId, koboldId, -5);

			const kobold = healed.combatants.find(c => c.id === koboldId);
			expect(kobold?.hp).toBe(12); // Should remain unchanged, not take damage
		});

		it('should treat zero healing as no change', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Rat',
				hp: 5,
				type: 'creature'
			});

			const ratId = added.combatants[0].id;

			// Damage first
			await combatRepository.applyDamage(combatId, ratId, 2); // Down to 3

			// Zero healing
			const healed = await combatRepository.applyHealing(combatId, ratId, 0);

			const rat = healed.combatants.find(c => c.id === ratId);
			expect(rat?.hp).toBe(3); // Should remain at 3
		});
	});

	describe('Hero-Type Quick-Add Combatants', () => {
		it('should cap healing for quick-add heroes at starting HP', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Temporary Ally',
				hp: 35,
				type: 'hero',
				ac: 15
			});

			const allyId = added.combatants[0].id;

			// Attempt to heal beyond starting HP
			const healed = await combatRepository.applyHealing(combatId, allyId, 20);

			const ally = healed.combatants.find(c => c.id === allyId);
			expect(ally?.hp).toBe(35); // Should cap at starting HP
			expect(ally?.type).toBe('hero');
		});

		it('should maintain maxHp as undefined for quick-add heroes', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Guest Hero',
				hp: 40,
				type: 'hero'
			});

			const guestId = added.combatants[0].id;
			const combat = await combatRepository.getById(combatId);
			const guest = combat?.combatants.find(c => c.id === guestId);

			expect(guest?.maxHp).toBeUndefined();
		});
	});

	describe('Comparison: Quick-Add vs Standard Combatants', () => {
		it('should cap both quick-add and standard combatants at their respective maxHP', async () => {
			// Add quick-add combatant
			const quickAdded = await combatRepository.addQuickCombatant(combatId, {
				name: 'Quick Goblin',
				hp: 20,
				type: 'creature'
			});
			const quickGoblinId = quickAdded.combatants[0].id;

			// Add standard combatant with explicit maxHp
			const standardAdded = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Standard Goblin',
				entityId: 'entity-goblin',
				hp: 20,
				maxHp: 20,
				threat: 1
			});
			const standardGoblinId = standardAdded.combatants.find(
				c => c.name === 'Standard Goblin'
			)!.id;

			// Heal both beyond their max
			await combatRepository.applyHealing(combatId, quickGoblinId, 30);
			const healed = await combatRepository.applyHealing(combatId, standardGoblinId, 30);

			const quickGoblin = healed.combatants.find(c => c.id === quickGoblinId);
			const standardGoblin = healed.combatants.find(c => c.id === standardGoblinId);

			// Both should be capped at 20
			expect(quickGoblin?.hp).toBe(20);
			expect(standardGoblin?.hp).toBe(20);

			// maxHp differs
			expect(quickGoblin?.maxHp).toBeUndefined();
			expect(standardGoblin?.maxHp).toBe(20);
		});

		it('should correctly differentiate starting HP vs maxHp', async () => {
			// Standard combatant starting below maxHp
			const standardAdded = await combatRepository.addCreatureCombatant(combatId, {
				name: 'Wounded Orc',
				entityId: 'entity-orc',
				hp: 15, // Starting HP
				maxHp: 30, // Max HP
				threat: 1
			});
			const orcId = standardAdded.combatants[0].id;

			// Heal to maxHp
			const healed = await combatRepository.applyHealing(combatId, orcId, 20);

			const orc = healed.combatants.find(c => c.id === orcId);
			expect(orc?.hp).toBe(30); // Should reach maxHp (30), not cap at starting HP (15)
			expect(orc?.maxHp).toBe(30);
		});
	});

	describe('Combat Log Verification', () => {
		it('should log healing correctly even when capped', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Skeleton',
				hp: 25,
				type: 'creature'
			});

			const skeletonId = added.combatants[0].id;

			// Attempt to heal beyond cap
			const healed = await combatRepository.applyHealing(combatId, skeletonId, 40, 'Potion');

			// Check that log entry exists
			const healingLog = healed.log.find(
				l => l.type === 'healing' && l.combatantId === skeletonId
			);

			expect(healingLog).toBeDefined();
			expect(healingLog?.message).toContain('Skeleton');
			expect(healingLog?.message).toContain('40'); // Log should show attempted amount
		});
	});

	describe('Starting HP as Effective MaxHP', () => {
		it('should use starting HP as the effective maximum for all healing calculations', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Zombie',
				hp: 28,
				type: 'creature'
			});

			const zombieId = added.combatants[0].id;

			// Verify initial state
			const initial = await combatRepository.getById(combatId);
			const zombie = initial?.combatants.find(c => c.id === zombieId);
			expect(zombie?.hp).toBe(28);
			expect(zombie?.maxHp).toBeUndefined();

			// Damage significantly
			await combatRepository.applyDamage(combatId, zombieId, 20); // Down to 8

			// Heal exactly to starting HP
			const healed = await combatRepository.applyHealing(combatId, zombieId, 20);

			const healedZombie = healed.combatants.find(c => c.id === zombieId);
			expect(healedZombie?.hp).toBe(28); // Should cap at starting HP

			// maxHp should STILL be undefined
			expect(healedZombie?.maxHp).toBeUndefined();
		});

		it('should maintain starting HP as cap across combat session', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Spider',
				hp: 16,
				type: 'creature'
			});

			const spiderId = added.combatants[0].id;

			// Multiple damage/heal cycles
			await combatRepository.applyDamage(combatId, spiderId, 8); // 8 HP
			await combatRepository.applyHealing(combatId, spiderId, 12); // Should cap at 16
			await combatRepository.applyDamage(combatId, spiderId, 4); // 12 HP
			const final = await combatRepository.applyHealing(combatId, spiderId, 10); // Should cap at 16

			const spider = final.combatants.find(c => c.id === spiderId);
			expect(spider?.hp).toBe(16); // Always capped at starting HP
			expect(spider?.maxHp).toBeUndefined();
		});
	});

	describe('Auto-Numbered Duplicate Quick-Add Combatants', () => {
		it('should cap healing independently for each auto-numbered duplicate', async () => {
			// Add three goblins with different starting HP
			const goblin1 = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 15,
				type: 'creature'
			});

			const goblin2 = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 20,
				type: 'creature'
			});

			const goblin3 = await combatRepository.addQuickCombatant(combatId, {
				name: 'Goblin',
				hp: 18,
				type: 'creature'
			});

			const goblin1Id = goblin1.combatants[0].id;
			const goblin2Id = goblin2.combatants[1].id;
			const goblin3Id = goblin3.combatants[2].id;

			// Damage all
			await combatRepository.applyDamage(combatId, goblin1Id, 10);
			await combatRepository.applyDamage(combatId, goblin2Id, 10);
			await combatRepository.applyDamage(combatId, goblin3Id, 10);

			// Heal all with same amount
			await combatRepository.applyHealing(combatId, goblin1Id, 25);
			await combatRepository.applyHealing(combatId, goblin2Id, 25);
			const healed = await combatRepository.applyHealing(combatId, goblin3Id, 25);

			// Each should cap at their own starting HP
			expect(healed.combatants.find(c => c.id === goblin1Id)?.hp).toBe(15);
			expect(healed.combatants.find(c => c.id === goblin2Id)?.hp).toBe(20);
			expect(healed.combatants.find(c => c.id === goblin3Id)?.hp).toBe(18);
		});
	});

	describe('Healing with Temporary HP', () => {
		it('should cap regular HP at starting HP, temp HP unaffected', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Berserker',
				hp: 30,
				type: 'creature'
			});

			const berserkerId = added.combatants[0].id;

			// Add temp HP
			await combatRepository.addTemporaryHp(combatId, berserkerId, 10);

			// Damage temp HP only
			await combatRepository.applyDamage(combatId, berserkerId, 5);

			// Try to heal regular HP beyond cap
			const healed = await combatRepository.applyHealing(combatId, berserkerId, 20);

			const berserker = healed.combatants.find(c => c.id === berserkerId);
			expect(berserker?.hp).toBe(30); // Capped at starting HP
			expect(berserker?.tempHp).toBe(5); // Temp HP unaffected by healing
		});
	});

	describe('Edge Case: Zero Starting HP', () => {
		it('should handle quick-add combatant with 1 HP correctly', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Weak Creature',
				hp: 1,
				type: 'creature'
			});

			const creatureId = added.combatants[0].id;

			// Attempt to heal
			const healed = await combatRepository.applyHealing(combatId, creatureId, 100);

			const creature = healed.combatants.find(c => c.id === creatureId);
			expect(creature?.hp).toBe(1); // Should cap at 1
		});
	});
});

describe('Issue #241: Verify Current HP is Always <= MaxHP Invariant', () => {
	let combatId: string;

	beforeEach(async () => {
		await db.combatSessions.clear();
		const combat = await combatRepository.create({ name: 'Invariant Test' });
		combatId = combat.id;
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	describe('HP Invariant: currentHP <= maxHP (or starting HP)', () => {
		it('should never allow currentHP > startingHP for quick-add combatants', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Test Creature',
				hp: 25,
				type: 'creature'
			});

			const creatureId = added.combatants[0].id;
			const startingHp = added.combatants[0].hp;

			// Series of operations
			await combatRepository.applyDamage(combatId, creatureId, 10);
			await combatRepository.applyHealing(combatId, creatureId, 50);
			await combatRepository.applyDamage(combatId, creatureId, 5);
			const final = await combatRepository.applyHealing(combatId, creatureId, 100);

			const creature = final.combatants.find(c => c.id === creatureId);

			// Invariant: HP should never exceed starting HP
			expect(creature?.hp).toBeLessThanOrEqual(startingHp);
			expect(creature?.hp).toBe(25); // Should be exactly at starting HP
		});

		it('should maintain invariant across all healing operations', async () => {
			const added = await combatRepository.addQuickCombatant(combatId, {
				name: 'Invariant Test',
				hp: 40,
				type: 'creature'
			});

			const creatureId = added.combatants[0].id;
			const startingHp = 40;

			// Random sequence of damage and healing
			const operations = [
				() => combatRepository.applyDamage(combatId, creatureId, 15),
				() => combatRepository.applyHealing(combatId, creatureId, 30),
				() => combatRepository.applyDamage(combatId, creatureId, 8),
				() => combatRepository.applyHealing(combatId, creatureId, 20),
				() => combatRepository.applyDamage(combatId, creatureId, 25),
				() => combatRepository.applyHealing(combatId, creatureId, 100)
			];

			let result;
			for (const op of operations) {
				result = await op();
				const creature = result.combatants.find(c => c.id === creatureId);
				// After every operation, HP should never exceed starting HP
				expect(creature?.hp).toBeLessThanOrEqual(startingHp);
			}
		});
	});
});
