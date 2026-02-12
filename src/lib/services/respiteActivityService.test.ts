/**
 * Tests for Respite Activity Service
 *
 * This service orchestrates respite activity entity CRUD and respite linking.
 *
 * Testing Strategy:
 * - Activity entity creation and linking to respite
 * - Activity entity deletion and unlinking from respite
 * - Loading activity entities for a respite
 * - Updating activity status and progress
 * - Completing respite with narrative event creation
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import * as respiteActivityService from './respiteActivityService';
import { respiteRepository } from '$lib/db/repositories/respiteRepository';
import { entityRepository } from '$lib/db/repositories';
import { db } from '$lib/db';
import type { RespiteSession } from '$lib/types/respite';

describe('RespiteActivityService', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.respiteSessions.clear();
		await db.entities.clear();
	});

	afterEach(async () => {
		await db.respiteSessions.clear();
		await db.entities.clear();
	});

	describe('createRespiteActivity', () => {
		it('should create an activity entity and link it to respite', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });

			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research ancient texts',
					description: 'Looking for clues',
					activityType: 'investigation',
					notes: 'Focus on history section'
				},
				'campaign-123'
			);

			expect(entity.id).toBeDefined();
			expect(entity.type).toBe('respite_activity');
			expect(entity.name).toBe('Research ancient texts');
			expect(entity.description).toBe('Looking for clues');
			expect(entity.fields.activityType).toBe('investigation');
			expect(entity.fields.activityStatus).toBe('pending');
			expect(entity.notes).toBe('Focus on history section');
			expect(entity.metadata?.campaignId).toBe('campaign-123');
			expect(entity.metadata?.respiteId).toBe(respite.id);

			// Verify it's linked to the respite
			const updatedRespite = await respiteRepository.getById(respite.id);
			expect(updatedRespite?.activityIds).toContain(entity.id);
		});

		it('should create activity with heroId', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });

			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Train with sword',
					activityType: 'training',
					heroId: 'hero-123'
				},
				'campaign-123'
			);

			expect(entity.fields.heroId).toBe('hero-123');
		});

		it('should throw if respite does not exist', async () => {
			await expect(
				respiteActivityService.createRespiteActivity(
					'non-existent',
					{
						name: 'Test',
						activityType: 'other'
					},
					'campaign-123'
				)
			).rejects.toThrow('Respite session non-existent not found');
		});
	});

	describe('deleteRespiteActivity', () => {
		it('should delete activity entity and unlink from respite', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research',
					activityType: 'investigation'
				},
				'campaign-123'
			);

			await respiteActivityService.deleteRespiteActivity(respite.id, entity.id);

			// Verify entity is deleted
			const deletedEntity = await entityRepository.getById(entity.id);
			expect(deletedEntity).toBeUndefined();

			// Verify it's unlinked from respite
			const updatedRespite = await respiteRepository.getById(respite.id);
			expect(updatedRespite?.activityIds).not.toContain(entity.id);
		});
	});

	describe('getActivitiesForRespite', () => {
		it('should return all activity entities for a respite', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity1 = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Activity 1',
					activityType: 'project'
				},
				'campaign-123'
			);
			const entity2 = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Activity 2',
					activityType: 'crafting'
				},
				'campaign-123'
			);

			const updatedRespite = await respiteRepository.getById(respite.id);
			const activities = await respiteActivityService.getActivitiesForRespite(
				updatedRespite!.activityIds
			);

			expect(activities).toHaveLength(2);
			expect(activities.map((a) => a.name)).toContain('Activity 1');
			expect(activities.map((a) => a.name)).toContain('Activity 2');
		});

		it('should return empty array for no activities', async () => {
			const activities = await respiteActivityService.getActivitiesForRespite([]);
			expect(activities).toEqual([]);
		});

		it('should filter out deleted entities', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity1 = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Activity 1',
					activityType: 'project'
				},
				'campaign-123'
			);
			const entity2 = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Activity 2',
					activityType: 'crafting'
				},
				'campaign-123'
			);

			// Delete one entity directly (simulating orphaned reference)
			await entityRepository.delete(entity1.id);

			const updatedRespite = await respiteRepository.getById(respite.id);
			const activities = await respiteActivityService.getActivitiesForRespite(
				updatedRespite!.activityIds
			);

			// Should only return the existing entity
			expect(activities).toHaveLength(1);
			expect(activities[0].name).toBe('Activity 2');
		});
	});

	describe('updateActivityStatus', () => {
		it('should update activity status', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research',
					activityType: 'investigation'
				},
				'campaign-123'
			);

			await respiteActivityService.updateActivityStatus(entity.id, 'in_progress');

			const updated = await entityRepository.getById(entity.id);
			expect(updated?.fields.activityStatus).toBe('in_progress');
		});

		it('should update status with outcome', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research',
					activityType: 'investigation'
				},
				'campaign-123'
			);

			await respiteActivityService.updateActivityStatus(
				entity.id,
				'completed',
				'Found a hidden map'
			);

			const updated = await entityRepository.getById(entity.id);
			expect(updated?.fields.activityStatus).toBe('completed');
			expect(updated?.fields.outcome).toBe('Found a hidden map');
		});

		it('should throw if entity does not exist', async () => {
			await expect(
				respiteActivityService.updateActivityStatus('non-existent', 'completed')
			).rejects.toThrow('Activity entity non-existent not found');
		});
	});

	describe('updateActivityProgress', () => {
		it('should update activity progress', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			const entity = await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research',
					activityType: 'investigation'
				},
				'campaign-123'
			);

			await respiteActivityService.updateActivityProgress(
				entity.id,
				'Found several promising leads'
			);

			const updated = await entityRepository.getById(entity.id);
			expect(updated?.fields.progress).toBe('Found several promising leads');
		});

		it('should throw if entity does not exist', async () => {
			await expect(
				respiteActivityService.updateActivityProgress('non-existent', 'some progress')
			).rejects.toThrow('Activity entity non-existent not found');
		});
	});

	describe('completeRespiteWithNarrative', () => {
		it('should complete respite and attempt narrative event creation', async () => {
			const respite = await respiteRepository.create({ name: 'Test Respite' });
			await respiteRepository.startRespite(respite.id);

			await respiteActivityService.createRespiteActivity(
				respite.id,
				{
					name: 'Research',
					activityType: 'investigation'
				},
				'campaign-123'
			);

			// Complete the respite
			await respiteActivityService.completeRespiteWithNarrative(respite.id);

			// Verify respite is completed
			const completedRespite = await respiteRepository.getById(respite.id);
			expect(completedRespite?.status).toBe('completed');
			expect(completedRespite?.completedAt).toBeDefined();

			// Note: narrative event creation is wrapped in try/catch
			// so it won't fail the completion even if it errors
		});
	});
});
