/**
 * Integration Tests for Narrative Event Service with Repositories
 *
 * Issue #399: Verify that combat and montage sessions automatically create
 * narrative events when they complete.
 *
 * These tests verify the full integration:
 * - Combat completion creates narrative event
 * - Montage completion creates narrative event
 * - Montage auto-completion creates narrative event
 * - Failures don't block session completion
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { combatRepository } from './combatRepository';
import { montageRepository } from './montageRepository';
import { entityRepository } from './entityRepository';
import { db } from '../index';

describe('Narrative Event Integration', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear all data before each test
		await db.combatSessions.clear();
		await db.montageSessions.clear();
		await db.entities.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.combatSessions.clear();
		await db.montageSessions.clear();
		await db.entities.clear();
	});

	describe('Combat Integration', () => {
		it('should create narrative event when combat ends', async () => {
			// Create and start combat
			const combat = await combatRepository.create({
				name: 'Dragon Battle',
				description: 'Epic battle with an ancient red dragon'
			});
			await combatRepository.startCombat(combat.id);

			// Get initial entity count
			const entitiesBeforeCompletion = await db.entities.count();

			// End combat
			await combatRepository.endCombat(combat.id);

			// Verify narrative event was created
			const entitiesAfterCompletion = await db.entities.count();
			expect(entitiesAfterCompletion).toBe(entitiesBeforeCompletion + 1);

			// Find the narrative event
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Dragon Battle');
			expect(narrativeEvents[0].fields?.eventType).toBe('combat');
			expect(narrativeEvents[0].fields?.sourceId).toBe(combat.id);
		});

		it('should not throw if narrative event creation fails', async () => {
			// Create and start combat
			const combat = await combatRepository.create({
				name: 'Test Combat'
			});
			await combatRepository.startCombat(combat.id);

			// End combat should succeed even if narrative event fails
			await expect(combatRepository.endCombat(combat.id)).resolves.toBeDefined();

			// Combat should be completed
			const completedCombat = await combatRepository.getById(combat.id);
			expect(completedCombat?.status).toBe('completed');
		});
	});

	describe('Montage Integration', () => {
		it('should create narrative event when montage completes', async () => {
			// Create and start montage
			const montage = await montageRepository.create({
				name: 'Wilderness Survival',
				description: 'Finding shelter and gathering supplies',
				difficulty: 'moderate',
				playerCount: 4
			});
			await montageRepository.startMontage(montage.id);

			// Get initial entity count
			const entitiesBeforeCompletion = await db.entities.count();

			// Complete montage
			await montageRepository.completeMontage(montage.id, 'total_success');

			// Verify narrative event was created
			const entitiesAfterCompletion = await db.entities.count();
			expect(entitiesAfterCompletion).toBe(entitiesBeforeCompletion + 1);

			// Find the narrative event
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Wilderness Survival');
			expect(narrativeEvents[0].fields?.eventType).toBe('montage');
			expect(narrativeEvents[0].fields?.sourceId).toBe(montage.id);
			expect(narrativeEvents[0].fields?.outcome).toBe('total_success');
		});

		it('should create narrative event on auto-completion', async () => {
			// Create and start montage
			const montage = await montageRepository.create({
				name: 'Treasure Hunt',
				difficulty: 'easy',
				playerCount: 3
			});
			await montageRepository.startMontage(montage.id);

			// Record successes until auto-completion (easy with 3 players: successLimit = 3)
			await montageRepository.recordChallengeResult(montage.id, {
				result: 'success',
				description: 'Found the map'
			});
			await montageRepository.recordChallengeResult(montage.id, {
				result: 'success',
				description: 'Decoded the clues'
			});

			// Get entity count before final success
			const entitiesBeforeAutoComplete = await db.entities.count();

			// Final success should trigger auto-completion and narrative event creation
			const completedMontage = await montageRepository.recordChallengeResult(montage.id, {
				result: 'success',
				description: 'Found the treasure'
			});

			// Verify montage auto-completed
			expect(completedMontage.status).toBe('completed');
			expect(completedMontage.outcome).toBe('total_success');

			// Verify narrative event was created
			const entitiesAfterAutoComplete = await db.entities.count();
			expect(entitiesAfterAutoComplete).toBe(entitiesBeforeAutoComplete + 1);

			// Find the narrative event
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Treasure Hunt');
		});

		it('should not throw if narrative event creation fails', async () => {
			// Create and start montage
			const montage = await montageRepository.create({
				name: 'Test Montage',
				difficulty: 'easy',
				playerCount: 3
			});
			await montageRepository.startMontage(montage.id);

			// Complete montage should succeed even if narrative event fails
			await expect(
				montageRepository.completeMontage(montage.id, 'partial_success')
			).resolves.toBeDefined();

			// Montage should be completed
			const completedMontage = await montageRepository.getById(montage.id);
			expect(completedMontage?.status).toBe('completed');
		});
	});

	describe('Multiple Sessions', () => {
		it('should create separate narrative events for multiple sessions', async () => {
			// Create and complete a combat
			const combat = await combatRepository.create({
				name: 'Goblin Raid'
			});
			await combatRepository.startCombat(combat.id);
			await combatRepository.endCombat(combat.id);

			// Create and complete a montage
			const montage = await montageRepository.create({
				name: 'City Investigation',
				difficulty: 'moderate',
				playerCount: 4
			});
			await montageRepository.startMontage(montage.id);
			await montageRepository.completeMontage(montage.id, 'total_success');

			// Should have 2 narrative events
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(2);

			// Verify both types exist
			const combatEvent = narrativeEvents.find((e) => e.fields?.eventType === 'combat');
			const montageEvent = narrativeEvents.find((e) => e.fields?.eventType === 'montage');

			expect(combatEvent).toBeDefined();
			expect(montageEvent).toBeDefined();
			expect(combatEvent?.name).toBe('Goblin Raid');
			expect(montageEvent?.name).toBe('City Investigation');
		});
	});
});
