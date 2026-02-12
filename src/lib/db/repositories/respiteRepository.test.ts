/**
 * Tests for Respite Repository
 *
 * Draw Steel Respite System - TDD RED Phase
 *
 * This repository manages respite sessions in IndexedDB, providing functionality
 * for respite lifecycle, hero management, activity tracking, VP conversion, and kit swaps.
 *
 * Testing Strategy:
 * - Helper functions for transition validation and VP calculation
 * - CRUD operations for respite sessions
 * - Respite lifecycle (start, complete)
 * - Hero management (add, update, remove, duplicate prevention)
 * - Activity management (record, update, complete)
 * - VP conversion (math, prevent over-conversion)
 * - Kit swap recording (hero association, from/to tracking)
 * - Svelte 5 proxy handling (JSON.parse(JSON.stringify()) before IndexedDB)
 *
 * Draw Steel Respite Specifics:
 * - Respite requires 24+ hours in a safe location
 * - Heroes regain recoveries during respite
 * - Victory points can be converted to XP
 * - Heroes may swap kits during respite
 * - Various downtime activities can be undertaken
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { respiteRepository } from './respiteRepository';
import { db } from '../index';
import type { RespiteSession } from '$lib/types/respite';

describe('RespiteRepository - Helper Functions', () => {
	describe('isValidTransition', () => {
		it('should allow preparing -> active', () => {
			expect(respiteRepository.isValidTransition('preparing', 'active')).toBe(true);
		});

		it('should allow active -> completed', () => {
			expect(respiteRepository.isValidTransition('active', 'completed')).toBe(true);
		});

		it('should not allow preparing -> completed', () => {
			expect(respiteRepository.isValidTransition('preparing', 'completed')).toBe(false);
		});

		it('should not allow completed -> active', () => {
			expect(respiteRepository.isValidTransition('completed', 'active')).toBe(false);
		});

		it('should not allow completed -> preparing', () => {
			expect(respiteRepository.isValidTransition('completed', 'preparing')).toBe(false);
		});

		it('should not allow active -> preparing', () => {
			expect(respiteRepository.isValidTransition('active', 'preparing')).toBe(false);
		});
	});

	describe('calculateRemainingVP', () => {
		it('should return available minus converted', () => {
			expect(respiteRepository.calculateRemainingVP(10, 3)).toBe(7);
		});

		it('should return 0 when all converted', () => {
			expect(respiteRepository.calculateRemainingVP(5, 5)).toBe(0);
		});

		it('should return 0 when over-converted (safety)', () => {
			expect(respiteRepository.calculateRemainingVP(3, 5)).toBe(0);
		});

		it('should return full amount when none converted', () => {
			expect(respiteRepository.calculateRemainingVP(10, 0)).toBe(10);
		});
	});
});

describe('RespiteRepository - CRUD Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('create', () => {
		it('should create a respite session with defaults', async () => {
			const respite = await respiteRepository.create({
				name: 'Camp at the Inn'
			});

			expect(respite.id).toBeDefined();
			expect(respite.name).toBe('Camp at the Inn');
			expect(respite.status).toBe('preparing');
			expect(respite.heroes).toEqual([]);
			expect(respite.victoryPointsAvailable).toBe(0);
			expect(respite.victoryPointsConverted).toBe(0);
			expect(respite.activities).toEqual([]);
			expect(respite.kitSwaps).toEqual([]);
			expect(respite.createdAt).toBeInstanceOf(Date);
			expect(respite.updatedAt).toBeInstanceOf(Date);
		});

		it('should create a respite session with heroes', async () => {
			const respite = await respiteRepository.create({
				name: 'Forest Rest',
				heroes: [
					{ name: 'Valora', recoveries: { current: 3, max: 8 } },
					{ name: 'Kael', recoveries: { current: 5, max: 6 } }
				],
				victoryPointsAvailable: 12
			});

			expect(respite.heroes).toHaveLength(2);
			expect(respite.heroes[0].name).toBe('Valora');
			expect(respite.heroes[0].recoveries.current).toBe(3);
			expect(respite.heroes[0].recoveries.max).toBe(8);
			expect(respite.heroes[0].recoveries.gained).toBe(0);
			expect(respite.heroes[1].name).toBe('Kael');
			expect(respite.victoryPointsAvailable).toBe(12);
		});

		it('should create with description', async () => {
			const respite = await respiteRepository.create({
				name: 'Mountain Camp',
				description: 'A quiet night in the mountains'
			});

			expect(respite.description).toBe('A quiet night in the mountains');
		});
	});

	describe('getById', () => {
		it('should return a respite session by ID', async () => {
			const created = await respiteRepository.create({ name: 'Test Respite' });
			const fetched = await respiteRepository.getById(created.id);

			expect(fetched).toBeDefined();
			expect(fetched!.name).toBe('Test Respite');
		});

		it('should return undefined for non-existent ID', async () => {
			const result = await respiteRepository.getById('non-existent');
			expect(result).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should update name', async () => {
			const created = await respiteRepository.create({ name: 'Old Name' });
			const updated = await respiteRepository.update(created.id, { name: 'New Name' });

			expect(updated.name).toBe('New Name');
		});

		it('should update description', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.update(created.id, {
				description: 'Updated desc'
			});

			expect(updated.description).toBe('Updated desc');
		});

		it('should update victoryPointsAvailable', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.update(created.id, {
				victoryPointsAvailable: 15
			});

			expect(updated.victoryPointsAvailable).toBe(15);
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.update('non-existent', { name: 'Nope' })
			).rejects.toThrow('Respite session non-existent not found');
		});

		it('should update updatedAt timestamp', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const originalUpdatedAt = created.updatedAt;

			// Small delay to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));
			const updated = await respiteRepository.update(created.id, { name: 'Updated' });

			expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
				new Date(originalUpdatedAt).getTime()
			);
		});
	});

	describe('delete', () => {
		it('should delete a respite session', async () => {
			const created = await respiteRepository.create({ name: 'To Delete' });
			await respiteRepository.delete(created.id);

			const result = await respiteRepository.getById(created.id);
			expect(result).toBeUndefined();
		});
	});
});

describe('RespiteRepository - Lifecycle Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('startRespite', () => {
		it('should transition preparing -> active', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const started = await respiteRepository.startRespite(created.id);

			expect(started.status).toBe('active');
		});

		it('should throw if already active', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.startRespite(created.id);

			await expect(respiteRepository.startRespite(created.id)).rejects.toThrow(
				'Respite is already active'
			);
		});

		it('should throw if completed', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.startRespite(created.id);
			await respiteRepository.completeRespite(created.id);

			await expect(respiteRepository.startRespite(created.id)).rejects.toThrow(
				'Cannot start a completed respite'
			);
		});

		it('should throw for non-existent respite', async () => {
			await expect(respiteRepository.startRespite('non-existent')).rejects.toThrow(
				'Respite session non-existent not found'
			);
		});
	});

	describe('completeRespite', () => {
		it('should transition active -> completed', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.startRespite(created.id);
			const completed = await respiteRepository.completeRespite(created.id);

			expect(completed.status).toBe('completed');
			expect(completed.completedAt).toBeDefined();
		});

		it('should throw if not active', async () => {
			const created = await respiteRepository.create({ name: 'Test' });

			await expect(respiteRepository.completeRespite(created.id)).rejects.toThrow(
				'Respite is not active'
			);
		});

		it('should throw for non-existent respite', async () => {
			await expect(respiteRepository.completeRespite('non-existent')).rejects.toThrow(
				'Respite session non-existent not found'
			);
		});
	});
});

describe('RespiteRepository - Hero Management', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('addHero', () => {
		it('should add a hero to the respite', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			expect(updated.heroes).toHaveLength(1);
			expect(updated.heroes[0].name).toBe('Valora');
			expect(updated.heroes[0].recoveries.gained).toBe(0);
			expect(updated.heroes[0].id).toBeDefined();
		});

		it('should prevent duplicate heroes by name (case-insensitive)', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			await expect(
				respiteRepository.addHero(created.id, {
					name: 'valora',
					recoveries: { current: 5, max: 8 }
				})
			).rejects.toThrow('Hero "valora" is already in this respite');
		});

		it('should add hero with heroId link', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.addHero(created.id, {
				name: 'Kael',
				heroId: 'hero-123',
				recoveries: { current: 2, max: 6 }
			});

			expect(updated.heroes[0].heroId).toBe('hero-123');
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.addHero('non-existent', {
					name: 'Test',
					recoveries: { current: 3, max: 8 }
				})
			).rejects.toThrow('Respite session non-existent not found');
		});
	});

	describe('updateHero', () => {
		it('should update hero recoveries', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.updateHero(
				created.id,
				withHero.heroes[0].id,
				{ recoveries: { current: 6, max: 8, gained: 3 } }
			);

			expect(updated.heroes[0].recoveries.current).toBe(6);
			expect(updated.heroes[0].recoveries.gained).toBe(3);
		});

		it('should update hero notes', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.updateHero(
				created.id,
				withHero.heroes[0].id,
				{ notes: 'Resting well' }
			);

			expect(updated.heroes[0].notes).toBe('Resting well');
		});

		it('should update hero conditions', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.updateHero(
				created.id,
				withHero.heroes[0].id,
				{ conditions: ['exhausted', 'wounded'] }
			);

			expect(updated.heroes[0].conditions).toEqual(['exhausted', 'wounded']);
		});

		it('should throw for non-existent hero', async () => {
			const created = await respiteRepository.create({ name: 'Test' });

			await expect(
				respiteRepository.updateHero(created.id, 'non-existent', { notes: 'test' })
			).rejects.toThrow('Hero non-existent not found in respite');
		});
	});

	describe('removeHero', () => {
		it('should remove a hero from the respite', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.removeHero(
				created.id,
				withHero.heroes[0].id
			);

			expect(updated.heroes).toHaveLength(0);
		});

		it('should throw for non-existent hero', async () => {
			const created = await respiteRepository.create({ name: 'Test' });

			await expect(
				respiteRepository.removeHero(created.id, 'non-existent')
			).rejects.toThrow('Hero non-existent not found in respite');
		});
	});
});

describe('RespiteRepository - Activity Management', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('recordActivity', () => {
		it('should record an activity with defaults', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.recordActivity(created.id, {
				name: 'Research ancient texts',
				type: 'investigation'
			});

			expect(updated.activities).toHaveLength(1);
			expect(updated.activities[0].name).toBe('Research ancient texts');
			expect(updated.activities[0].type).toBe('investigation');
			expect(updated.activities[0].status).toBe('pending');
			expect(updated.activities[0].id).toBeDefined();
			expect(updated.activities[0].createdAt).toBeDefined();
		});

		it('should record an activity with hero assignment', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.recordActivity(created.id, {
				name: 'Train with sword',
				type: 'training',
				heroId: withHero.heroes[0].id,
				description: 'Practicing sword forms',
				notes: 'Focus on parrying'
			});

			expect(updated.activities[0].heroId).toBe(withHero.heroes[0].id);
			expect(updated.activities[0].description).toBe('Practicing sword forms');
			expect(updated.activities[0].notes).toBe('Focus on parrying');
		});

		it('should add multiple activities', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.recordActivity(created.id, {
				name: 'Research',
				type: 'investigation'
			});
			const updated = await respiteRepository.recordActivity(created.id, {
				name: 'Crafting',
				type: 'crafting'
			});

			expect(updated.activities).toHaveLength(2);
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.recordActivity('non-existent', {
					name: 'Test',
					type: 'other'
				})
			).rejects.toThrow('Respite session non-existent not found');
		});
	});

	describe('updateActivity', () => {
		it('should update activity status', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withActivity = await respiteRepository.recordActivity(created.id, {
				name: 'Research',
				type: 'investigation'
			});

			const updated = await respiteRepository.updateActivity(
				created.id,
				withActivity.activities[0].id,
				{ status: 'in_progress' }
			);

			expect(updated.activities[0].status).toBe('in_progress');
		});

		it('should update activity name and notes', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withActivity = await respiteRepository.recordActivity(created.id, {
				name: 'Research',
				type: 'investigation'
			});

			const updated = await respiteRepository.updateActivity(
				created.id,
				withActivity.activities[0].id,
				{ name: 'Deep Research', notes: 'Found something' }
			);

			expect(updated.activities[0].name).toBe('Deep Research');
			expect(updated.activities[0].notes).toBe('Found something');
		});

		it('should throw for non-existent activity', async () => {
			const created = await respiteRepository.create({ name: 'Test' });

			await expect(
				respiteRepository.updateActivity(created.id, 'non-existent', {
					status: 'completed'
				})
			).rejects.toThrow('Activity non-existent not found in respite');
		});
	});

	describe('completeActivity', () => {
		it('should complete an activity with outcome', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withActivity = await respiteRepository.recordActivity(created.id, {
				name: 'Research',
				type: 'investigation'
			});

			const updated = await respiteRepository.completeActivity(
				created.id,
				withActivity.activities[0].id,
				'Discovered a hidden map'
			);

			expect(updated.activities[0].status).toBe('completed');
			expect(updated.activities[0].outcome).toBe('Discovered a hidden map');
		});

		it('should complete an activity without outcome', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withActivity = await respiteRepository.recordActivity(created.id, {
				name: 'Socializing',
				type: 'socializing'
			});

			const updated = await respiteRepository.completeActivity(
				created.id,
				withActivity.activities[0].id
			);

			expect(updated.activities[0].status).toBe('completed');
			expect(updated.activities[0].outcome).toBeUndefined();
		});
	});
});

describe('RespiteRepository - VP Conversion', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('convertVictoryPoints', () => {
		it('should convert VP successfully', async () => {
			const created = await respiteRepository.create({
				name: 'Test',
				victoryPointsAvailable: 10
			});

			const updated = await respiteRepository.convertVictoryPoints(created.id, 5);

			expect(updated.victoryPointsConverted).toBe(5);
		});

		it('should convert VP incrementally', async () => {
			const created = await respiteRepository.create({
				name: 'Test',
				victoryPointsAvailable: 10
			});

			await respiteRepository.convertVictoryPoints(created.id, 3);
			const updated = await respiteRepository.convertVictoryPoints(created.id, 4);

			expect(updated.victoryPointsConverted).toBe(7);
		});

		it('should prevent over-conversion', async () => {
			const created = await respiteRepository.create({
				name: 'Test',
				victoryPointsAvailable: 5
			});

			await expect(
				respiteRepository.convertVictoryPoints(created.id, 6)
			).rejects.toThrow('Cannot convert 6 VP: only 5 VP remaining');
		});

		it('should prevent conversion of zero or negative amount', async () => {
			const created = await respiteRepository.create({
				name: 'Test',
				victoryPointsAvailable: 5
			});

			await expect(
				respiteRepository.convertVictoryPoints(created.id, 0)
			).rejects.toThrow('Conversion amount must be positive');
		});

		it('should allow converting exact remaining amount', async () => {
			const created = await respiteRepository.create({
				name: 'Test',
				victoryPointsAvailable: 5
			});

			await respiteRepository.convertVictoryPoints(created.id, 3);
			const updated = await respiteRepository.convertVictoryPoints(created.id, 2);

			expect(updated.victoryPointsConverted).toBe(5);
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.convertVictoryPoints('non-existent', 5)
			).rejects.toThrow('Respite session non-existent not found');
		});
	});
});

describe('RespiteRepository - Kit Swap Recording', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
	});

	describe('recordKitSwap', () => {
		it('should record a kit swap for a hero', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.recordKitSwap(created.id, {
				heroId: withHero.heroes[0].id,
				from: 'Shining Armor',
				to: 'Shadow Cloak',
				reason: 'Stealth mission ahead'
			});

			expect(updated.kitSwaps).toHaveLength(1);
			expect(updated.kitSwaps[0].heroId).toBe(withHero.heroes[0].id);
			expect(updated.kitSwaps[0].from).toBe('Shining Armor');
			expect(updated.kitSwaps[0].to).toBe('Shadow Cloak');
			expect(updated.kitSwaps[0].reason).toBe('Stealth mission ahead');
			expect(updated.kitSwaps[0].id).toBeDefined();
			expect(updated.kitSwaps[0].createdAt).toBeDefined();
		});

		it('should record a kit swap without reason', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			const updated = await respiteRepository.recordKitSwap(created.id, {
				heroId: withHero.heroes[0].id,
				from: 'Shining Armor',
				to: 'Shadow Cloak'
			});

			expect(updated.kitSwaps[0].reason).toBeUndefined();
		});

		it('should throw for non-existent hero in respite', async () => {
			const created = await respiteRepository.create({ name: 'Test' });

			await expect(
				respiteRepository.recordKitSwap(created.id, {
					heroId: 'non-existent',
					from: 'A',
					to: 'B'
				})
			).rejects.toThrow('Hero non-existent not found in respite');
		});

		it('should record multiple kit swaps', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const withHero = await respiteRepository.addHero(created.id, {
				name: 'Valora',
				recoveries: { current: 3, max: 8 }
			});

			await respiteRepository.recordKitSwap(created.id, {
				heroId: withHero.heroes[0].id,
				from: 'Shining Armor',
				to: 'Shadow Cloak'
			});

			const updated = await respiteRepository.recordKitSwap(created.id, {
				heroId: withHero.heroes[0].id,
				from: 'Shadow Cloak',
				to: 'Battle Plate'
			});

			expect(updated.kitSwaps).toHaveLength(2);
		});
	});
});
