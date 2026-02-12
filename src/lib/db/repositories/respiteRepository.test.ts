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
			expect(respite.activityIds).toEqual([]);
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

	describe('addActivityId', () => {
		it('should add an activity entity ID to the respite', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.addActivityId(created.id, 'activity-123');

			expect(updated.activityIds).toHaveLength(1);
			expect(updated.activityIds[0]).toBe('activity-123');
		});

		it('should add multiple activity IDs', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.addActivityId(created.id, 'activity-1');
			const updated = await respiteRepository.addActivityId(created.id, 'activity-2');

			expect(updated.activityIds).toHaveLength(2);
			expect(updated.activityIds).toContain('activity-1');
			expect(updated.activityIds).toContain('activity-2');
		});

		it('should prevent duplicate activity IDs', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.addActivityId(created.id, 'activity-123');

			await expect(
				respiteRepository.addActivityId(created.id, 'activity-123')
			).rejects.toThrow('Activity activity-123 is already linked to this respite');
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.addActivityId('non-existent', 'activity-123')
			).rejects.toThrow('Respite session non-existent not found');
		});
	});

	describe('removeActivityId', () => {
		it('should remove an activity entity ID from the respite', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.addActivityId(created.id, 'activity-123');
			const updated = await respiteRepository.removeActivityId(created.id, 'activity-123');

			expect(updated.activityIds).toHaveLength(0);
		});

		it('should only remove the specified activity ID', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			await respiteRepository.addActivityId(created.id, 'activity-1');
			await respiteRepository.addActivityId(created.id, 'activity-2');
			const updated = await respiteRepository.removeActivityId(created.id, 'activity-1');

			expect(updated.activityIds).toHaveLength(1);
			expect(updated.activityIds[0]).toBe('activity-2');
		});

		it('should not throw if activity ID does not exist', async () => {
			const created = await respiteRepository.create({ name: 'Test' });
			const updated = await respiteRepository.removeActivityId(created.id, 'non-existent');

			expect(updated.activityIds).toHaveLength(0);
		});

		it('should throw for non-existent respite', async () => {
			await expect(
				respiteRepository.removeActivityId('non-existent', 'activity-123')
			).rejects.toThrow('Respite session non-existent not found');
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
