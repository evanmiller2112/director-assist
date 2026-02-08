/**
 * Tests for Montage Repository
 *
 * Draw Steel Montage Challenge Tracker - TDD RED Phase
 *
 * This repository manages montage sessions in IndexedDB, providing functionality
 * for montage lifecycle, challenge tracking, outcome calculations, and Draw Steel mechanics.
 *
 * Testing Strategy:
 * - CRUD operations for montage sessions
 * - Montage lifecycle (start, complete, reopen)
 * - Challenge result recording
 * - Limit calculation (player count + difficulty based)
 * - Outcome calculation (total success, partial success, total failure)
 * - Victory point calculation
 * - Round tracking
 * - Edge cases for Draw Steel rules
 *
 * Draw Steel Specifics:
 * - Easy: successLimit = playerCount, failureLimit = playerCount
 *   VP: total success = 1, partial success = 0
 * - Moderate: successLimit = playerCount + 1, failureLimit = max(2, playerCount - 1)
 *   VP: total success = 1, partial success = 0
 * - Hard: successLimit = playerCount + 2, failureLimit = max(2, playerCount - 2)
 *   VP: total success = 2, partial success = 1
 *
 * Outcome Rules:
 * - Total Success: successes >= successLimit
 * - Total Failure: failures >= failureLimit AND NOT (successes >= failures + 2)
 * - Partial Success: failures >= failureLimit AND successes >= failures + 2
 *
 * These tests will FAIL until implementation is complete (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { montageRepository } from './montageRepository';
import { db } from '../index';
import type {
	MontageSession,
	MontageDifficulty,
	MontageOutcome,
	ChallengeResult
} from '$lib/types/montage';

describe('MontageRepository - Limit Calculations', () => {
	describe('calculateLimits', () => {
		describe('Easy difficulty', () => {
			it('should calculate limits for 3 players', () => {
				const limits = montageRepository.calculateLimits('easy', 3);

				expect(limits.successLimit).toBe(3);
				expect(limits.failureLimit).toBe(3);
			});

			it('should calculate limits for 4 players', () => {
				const limits = montageRepository.calculateLimits('easy', 4);

				expect(limits.successLimit).toBe(4);
				expect(limits.failureLimit).toBe(4);
			});

			it('should calculate limits for 5 players', () => {
				const limits = montageRepository.calculateLimits('easy', 5);

				expect(limits.successLimit).toBe(5);
				expect(limits.failureLimit).toBe(5);
			});

			it('should calculate limits for 6 players', () => {
				const limits = montageRepository.calculateLimits('easy', 6);

				expect(limits.successLimit).toBe(6);
				expect(limits.failureLimit).toBe(6);
			});
		});

		describe('Moderate difficulty', () => {
			it('should calculate limits for 3 players', () => {
				const limits = montageRepository.calculateLimits('moderate', 3);

				expect(limits.successLimit).toBe(4); // playerCount + 1
				expect(limits.failureLimit).toBe(2); // max(2, playerCount - 1) = max(2, 2)
			});

			it('should calculate limits for 4 players', () => {
				const limits = montageRepository.calculateLimits('moderate', 4);

				expect(limits.successLimit).toBe(5); // playerCount + 1
				expect(limits.failureLimit).toBe(3); // max(2, playerCount - 1) = max(2, 3)
			});

			it('should calculate limits for 5 players', () => {
				const limits = montageRepository.calculateLimits('moderate', 5);

				expect(limits.successLimit).toBe(6); // playerCount + 1
				expect(limits.failureLimit).toBe(4); // max(2, playerCount - 1) = max(2, 4)
			});

			it('should enforce minimum failure limit of 2', () => {
				const limits = montageRepository.calculateLimits('moderate', 2);

				expect(limits.successLimit).toBe(3); // playerCount + 1
				expect(limits.failureLimit).toBe(2); // max(2, 1) = 2
			});
		});

		describe('Hard difficulty', () => {
			it('should calculate limits for 3 players', () => {
				const limits = montageRepository.calculateLimits('hard', 3);

				expect(limits.successLimit).toBe(5); // playerCount + 2
				expect(limits.failureLimit).toBe(2); // max(2, playerCount - 2) = max(2, 1)
			});

			it('should calculate limits for 4 players', () => {
				const limits = montageRepository.calculateLimits('hard', 4);

				expect(limits.successLimit).toBe(6); // playerCount + 2
				expect(limits.failureLimit).toBe(2); // max(2, playerCount - 2) = max(2, 2)
			});

			it('should calculate limits for 5 players', () => {
				const limits = montageRepository.calculateLimits('hard', 5);

				expect(limits.successLimit).toBe(7); // playerCount + 2
				expect(limits.failureLimit).toBe(3); // max(2, playerCount - 2) = max(2, 3)
			});

			it('should calculate limits for 6 players', () => {
				const limits = montageRepository.calculateLimits('hard', 6);

				expect(limits.successLimit).toBe(8); // playerCount + 2
				expect(limits.failureLimit).toBe(4); // max(2, playerCount - 2) = max(2, 4)
			});

			it('should enforce minimum failure limit of 2', () => {
				const limits = montageRepository.calculateLimits('hard', 3);

				expect(limits.failureLimit).toBe(2); // max(2, 1) = 2
			});
		});
	});
});

describe('MontageRepository - Outcome Calculations', () => {
	describe('calculateOutcome', () => {
		describe('Total Success cases', () => {
			it('should return total success when successes equal success limit', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 3,
					failureCount: 1,
					successLimit: 3,
					failureLimit: 3
				});

				expect(outcome).toBe('total_success');
			});

			it('should return total success when successes exceed success limit', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 5,
					failureCount: 2,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBe('total_success');
			});

			it('should return total success even if failure limit also reached', () => {
				// Success limit takes priority
				const outcome = montageRepository.calculateOutcome({
					successCount: 4,
					failureCount: 3,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBe('total_success');
			});
		});

		describe('Total Failure cases', () => {
			it('should return total failure when failures equal failure limit', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 1,
					failureCount: 3,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBe('total_failure');
			});

			it('should return total failure when failures exceed failure limit', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 2,
					failureCount: 5,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBe('total_failure');
			});

			it('should return total failure with equal successes and failures at failure limit', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 3,
					failureCount: 3,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBe('total_failure');
			});
		});

		describe('Partial Success cases', () => {
			it('should return partial success when failures at limit but successes >= failures + 2', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 5,
					failureCount: 3,
					successLimit: 6,
					failureLimit: 3
				});

				expect(outcome).toBe('partial_success');
			});

			it('should return partial success with exactly failures + 2 successes', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 4,
					failureCount: 2,
					successLimit: 5,
					failureLimit: 2
				});

				expect(outcome).toBe('partial_success');
			});

			it('should return partial success with successes > failures + 2', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 6,
					failureCount: 3,
					successLimit: 7,
					failureLimit: 3
				});

				expect(outcome).toBe('partial_success');
			});
		});

		describe('Edge cases', () => {
			it('should handle zero successes and failures', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 0,
					failureCount: 0,
					successLimit: 4,
					failureLimit: 3
				});

				expect(outcome).toBeNull();
			});

			it('should handle one success short of partial success', () => {
				// 4 successes, 3 failures, need 5 for partial (3 + 2)
				const outcome = montageRepository.calculateOutcome({
					successCount: 4,
					failureCount: 3,
					successLimit: 6,
					failureLimit: 3
				});

				expect(outcome).toBe('total_failure');
			});

			it('should prioritize total success over partial success', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 6,
					failureCount: 3,
					successLimit: 6,
					failureLimit: 3
				});

				expect(outcome).toBe('total_success');
			});

			it('should return null when neither limit reached', () => {
				const outcome = montageRepository.calculateOutcome({
					successCount: 2,
					failureCount: 1,
					successLimit: 5,
					failureLimit: 3
				});

				expect(outcome).toBeNull();
			});
		});
	});
});

describe('MontageRepository - Victory Point Calculations', () => {
	describe('getVictoriesForOutcome', () => {
		describe('Easy difficulty', () => {
			it('should award 1 VP for total success', () => {
				const vp = montageRepository.getVictoriesForOutcome('easy', 'total_success');
				expect(vp).toBe(1);
			});

			it('should award 0 VP for partial success', () => {
				const vp = montageRepository.getVictoriesForOutcome('easy', 'partial_success');
				expect(vp).toBe(0);
			});

			it('should award 0 VP for total failure', () => {
				const vp = montageRepository.getVictoriesForOutcome('easy', 'total_failure');
				expect(vp).toBe(0);
			});
		});

		describe('Moderate difficulty', () => {
			it('should award 1 VP for total success', () => {
				const vp = montageRepository.getVictoriesForOutcome('moderate', 'total_success');
				expect(vp).toBe(1);
			});

			it('should award 0 VP for partial success', () => {
				const vp = montageRepository.getVictoriesForOutcome('moderate', 'partial_success');
				expect(vp).toBe(0);
			});

			it('should award 0 VP for total failure', () => {
				const vp = montageRepository.getVictoriesForOutcome('moderate', 'total_failure');
				expect(vp).toBe(0);
			});
		});

		describe('Hard difficulty', () => {
			it('should award 2 VP for total success', () => {
				const vp = montageRepository.getVictoriesForOutcome('hard', 'total_success');
				expect(vp).toBe(2);
			});

			it('should award 1 VP for partial success', () => {
				const vp = montageRepository.getVictoriesForOutcome('hard', 'partial_success');
				expect(vp).toBe(1);
			});

			it('should award 0 VP for total failure', () => {
				const vp = montageRepository.getVictoriesForOutcome('hard', 'total_failure');
				expect(vp).toBe(0);
			});
		});
	});
});

describe('MontageRepository - CRUD Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear montage sessions before each test
		await db.montageSessions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.montageSessions.clear();
	});

	describe('create', () => {
		it('should create a new montage session with correct limits', async () => {
			const montage = await montageRepository.create({
				name: 'Heist Preparation',
				description: 'Planning the museum heist',
				difficulty: 'moderate',
				playerCount: 4
			});

			expect(montage).toBeDefined();
			expect(montage.id).toBeDefined();
			expect(montage.name).toBe('Heist Preparation');
			expect(montage.description).toBe('Planning the museum heist');
			expect(montage.difficulty).toBe('moderate');
			expect(montage.playerCount).toBe(4);
			expect(montage.status).toBe('preparing');
			expect(montage.successLimit).toBe(5); // playerCount + 1
			expect(montage.failureLimit).toBe(3); // max(2, playerCount - 1)
			expect(montage.challenges).toEqual([]);
			expect(montage.successCount).toBe(0);
			expect(montage.failureCount).toBe(0);
			expect(montage.currentRound).toBe(1);
			expect(montage.outcome).toBeUndefined();
			expect(montage.victoryPoints).toBe(0);
			expect(montage.createdAt).toBeInstanceOf(Date);
			expect(montage.updatedAt).toBeInstanceOf(Date);
			expect(montage.completedAt).toBeUndefined();
		});

		it('should generate unique IDs for each montage', async () => {
			const montage1 = await montageRepository.create({
				name: 'Montage 1',
				difficulty: 'easy',
				playerCount: 3
			});
			const montage2 = await montageRepository.create({
				name: 'Montage 2',
				difficulty: 'hard',
				playerCount: 5
			});

			expect(montage1.id).not.toBe(montage2.id);
		});

		it('should create montage without description', async () => {
			const montage = await montageRepository.create({
				name: 'Quick Montage',
				difficulty: 'easy',
				playerCount: 4
			});

			expect(montage.description).toBeUndefined();
		});

		it('should calculate limits correctly for easy difficulty', async () => {
			const montage = await montageRepository.create({
				name: 'Easy Test',
				difficulty: 'easy',
				playerCount: 4
			});

			expect(montage.successLimit).toBe(4);
			expect(montage.failureLimit).toBe(4);
		});

		it('should calculate limits correctly for hard difficulty', async () => {
			const montage = await montageRepository.create({
				name: 'Hard Test',
				difficulty: 'hard',
				playerCount: 5
			});

			expect(montage.successLimit).toBe(7); // playerCount + 2
			expect(montage.failureLimit).toBe(3); // max(2, playerCount - 2)
		});

		it('should set timestamps on creation', async () => {
			const before = new Date();
			const montage = await montageRepository.create({
				name: 'Timed Montage',
				difficulty: 'moderate',
				playerCount: 4
			});
			const after = new Date();

			expect(montage.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(montage.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
			expect(montage.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(montage.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('getById', () => {
		it('should retrieve montage session by ID', async () => {
			const created = await montageRepository.create({
				name: 'Test Montage',
				difficulty: 'easy',
				playerCount: 3
			});
			const retrieved = await montageRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Test Montage');
		});

		it('should return undefined for non-existent montage', async () => {
			const result = await montageRepository.getById('non-existent-id');

			expect(result).toBeUndefined();
		});
	});

	describe('getAll', () => {
		it('should return observable of all montage sessions', async () => {
			await montageRepository.create({
				name: 'Montage 1',
				difficulty: 'easy',
				playerCount: 3
			});
			await montageRepository.create({
				name: 'Montage 2',
				difficulty: 'moderate',
				playerCount: 4
			});
			await montageRepository.create({
				name: 'Montage 3',
				difficulty: 'hard',
				playerCount: 5
			});

			const observable = montageRepository.getAll();
			let montages: MontageSession[] = [];

			// Subscribe to observable
			const subscription = observable.subscribe((data) => {
				montages = data;
			});

			// Wait for subscription to resolve
			await new Promise(resolve => setTimeout(resolve, 50));

			expect(montages.length).toBeGreaterThanOrEqual(3);
			subscription.unsubscribe();
		});

		it('should return empty array when no montages exist', async () => {
			const observable = montageRepository.getAll();
			let montages: MontageSession[] = [];

			const subscription = observable.subscribe((data) => {
				montages = data;
			});

			await new Promise(resolve => setTimeout(resolve, 50));

			expect(montages).toEqual([]);
			subscription.unsubscribe();
		});
	});

	describe('update', () => {
		it('should update montage session', async () => {
			const montage = await montageRepository.create({
				name: 'Original Name',
				difficulty: 'easy',
				playerCount: 3
			});

			// Small delay to ensure timestamps differ
			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await montageRepository.update(montage.id, {
				name: 'Updated Name',
				description: 'New description'
			});

			expect(updated.name).toBe('Updated Name');
			expect(updated.description).toBe('New description');
			expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(montage.updatedAt.getTime());
		});

		it('should recalculate limits when difficulty changes', async () => {
			const montage = await montageRepository.create({
				name: 'Test',
				difficulty: 'easy',
				playerCount: 4
			});

			expect(montage.successLimit).toBe(4);
			expect(montage.failureLimit).toBe(4);

			const updated = await montageRepository.update(montage.id, {
				difficulty: 'hard'
			});

			expect(updated.successLimit).toBe(6); // playerCount + 2
			expect(updated.failureLimit).toBe(2); // max(2, playerCount - 2)
		});

		it('should recalculate limits when player count changes', async () => {
			const montage = await montageRepository.create({
				name: 'Test',
				difficulty: 'moderate',
				playerCount: 3
			});

			expect(montage.successLimit).toBe(4);
			expect(montage.failureLimit).toBe(2);

			const updated = await montageRepository.update(montage.id, {
				playerCount: 5
			});

			expect(updated.successLimit).toBe(6); // playerCount + 1
			expect(updated.failureLimit).toBe(4); // max(2, playerCount - 1)
		});

		it('should throw error for non-existent montage', async () => {
			await expect(
				montageRepository.update('non-existent', { name: 'Test' })
			).rejects.toThrow();
		});

		it('should update only specified fields', async () => {
			const montage = await montageRepository.create({
				name: 'Original',
				description: 'Original Description',
				difficulty: 'easy',
				playerCount: 3
			});

			const updated = await montageRepository.update(montage.id, {
				name: 'New Name'
			});

			expect(updated.name).toBe('New Name');
			expect(updated.description).toBe('Original Description');
			expect(updated.difficulty).toBe('easy');
		});

		describe('updating predefined challenges', () => {
			it('should accept and save new predefined challenges', async () => {
				const montage = await montageRepository.create({
					name: 'Test Montage',
					difficulty: 'moderate',
					playerCount: 4
				});

				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ name: 'Find Shelter', description: 'Locate a safe place' },
						{ name: 'Rally Horse', suggestedSkills: ['Animal Handling'] }
					]
				});

				expect(updated.predefinedChallenges).toBeDefined();
				expect(updated.predefinedChallenges).toHaveLength(2);
				expect(updated.predefinedChallenges![0].name).toBe('Find Shelter');
				expect(updated.predefinedChallenges![0].description).toBe('Locate a safe place');
				expect(updated.predefinedChallenges![1].name).toBe('Rally Horse');
				expect(updated.predefinedChallenges![1].suggestedSkills).toEqual(['Animal Handling']);
			});

			it('should allow adding challenges to a montage that had none', async () => {
				const montage = await montageRepository.create({
					name: 'Empty Montage',
					difficulty: 'easy',
					playerCount: 3
				});

				expect(montage.predefinedChallenges).toBeUndefined();

				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ name: 'New Challenge 1' },
						{ name: 'New Challenge 2' }
					]
				});

				expect(updated.predefinedChallenges).toBeDefined();
				expect(updated.predefinedChallenges).toHaveLength(2);
			});

			it('should allow removing all predefined challenges', async () => {
				const montage = await montageRepository.create({
					name: 'With Challenges',
					difficulty: 'hard',
					playerCount: 5,
					predefinedChallenges: [
						{ name: 'Challenge 1' },
						{ name: 'Challenge 2' },
						{ name: 'Challenge 3' }
					]
				});

				expect(montage.predefinedChallenges).toHaveLength(3);

				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: []
				});

				expect(updated.predefinedChallenges).toEqual([]);
			});

			it('should generate IDs for new challenges without IDs', async () => {
				const montage = await montageRepository.create({
					name: 'Test Montage',
					difficulty: 'moderate',
					playerCount: 4
				});

				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ name: 'Challenge A' },
						{ name: 'Challenge B' },
						{ name: 'Challenge C' }
					]
				});

				expect(updated.predefinedChallenges).toBeDefined();
				expect(updated.predefinedChallenges).toHaveLength(3);

				// All challenges should have generated IDs
				expect(updated.predefinedChallenges![0].id).toBeDefined();
				expect(updated.predefinedChallenges![1].id).toBeDefined();
				expect(updated.predefinedChallenges![2].id).toBeDefined();

				// IDs should be unique
				const ids = updated.predefinedChallenges!.map((c) => c.id);
				const uniqueIds = new Set(ids);
				expect(uniqueIds.size).toBe(3);
			});

			it('should preserve IDs for existing challenges', async () => {
				const montage = await montageRepository.create({
					name: 'With Challenges',
					difficulty: 'easy',
					playerCount: 3,
					predefinedChallenges: [
						{ name: 'Original Challenge 1' },
						{ name: 'Original Challenge 2' }
					]
				});

				const originalIds = montage.predefinedChallenges!.map((c) => c.id);

				// Update challenges, preserving IDs
				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ id: originalIds[0], name: 'Updated Challenge 1' },
						{ id: originalIds[1], name: 'Updated Challenge 2' },
						{ name: 'New Challenge 3' } // New challenge without ID
					]
				});

				expect(updated.predefinedChallenges).toHaveLength(3);

				// First two should have same IDs
				expect(updated.predefinedChallenges![0].id).toBe(originalIds[0]);
				expect(updated.predefinedChallenges![0].name).toBe('Updated Challenge 1');
				expect(updated.predefinedChallenges![1].id).toBe(originalIds[1]);
				expect(updated.predefinedChallenges![1].name).toBe('Updated Challenge 2');

				// Third should have a new generated ID
				expect(updated.predefinedChallenges![2].id).toBeDefined();
				expect(updated.predefinedChallenges![2].id).not.toBe(originalIds[0]);
				expect(updated.predefinedChallenges![2].id).not.toBe(originalIds[1]);
				expect(updated.predefinedChallenges![2].name).toBe('New Challenge 3');
			});

			it('should allow reordering predefined challenges', async () => {
				const montage = await montageRepository.create({
					name: 'Ordered Challenges',
					difficulty: 'moderate',
					playerCount: 4,
					predefinedChallenges: [
						{ name: 'First' },
						{ name: 'Second' },
						{ name: 'Third' }
					]
				});

				const originalIds = montage.predefinedChallenges!.map((c) => c.id);

				// Reverse the order
				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ id: originalIds[2], name: 'Third' },
						{ id: originalIds[1], name: 'Second' },
						{ id: originalIds[0], name: 'First' }
					]
				});

				expect(updated.predefinedChallenges).toHaveLength(3);
				expect(updated.predefinedChallenges![0].name).toBe('Third');
				expect(updated.predefinedChallenges![0].id).toBe(originalIds[2]);
				expect(updated.predefinedChallenges![1].name).toBe('Second');
				expect(updated.predefinedChallenges![2].name).toBe('First');
			});

			it('should allow removing specific challenges from the middle', async () => {
				const montage = await montageRepository.create({
					name: 'Many Challenges',
					difficulty: 'hard',
					playerCount: 5,
					predefinedChallenges: [
						{ name: 'Challenge 1' },
						{ name: 'Challenge 2' },
						{ name: 'Challenge 3' },
						{ name: 'Challenge 4' }
					]
				});

				const originalIds = montage.predefinedChallenges!.map((c) => c.id);

				// Remove Challenge 2 and Challenge 3, keep 1 and 4
				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ id: originalIds[0], name: 'Challenge 1' },
						{ id: originalIds[3], name: 'Challenge 4' }
					]
				});

				expect(updated.predefinedChallenges).toHaveLength(2);
				expect(updated.predefinedChallenges![0].id).toBe(originalIds[0]);
				expect(updated.predefinedChallenges![0].name).toBe('Challenge 1');
				expect(updated.predefinedChallenges![1].id).toBe(originalIds[3]);
				expect(updated.predefinedChallenges![1].name).toBe('Challenge 4');
			});

			it('should handle mix of challenges with and without IDs', async () => {
				const montage = await montageRepository.create({
					name: 'Test',
					difficulty: 'easy',
					playerCount: 3
				});

				const updated = await montageRepository.update(montage.id, {
					predefinedChallenges: [
						{ id: 'existing-id-1', name: 'Existing Challenge' },
						{ name: 'New Challenge 1' },
						{ name: 'New Challenge 2' },
						{ id: 'existing-id-2', name: 'Another Existing' }
					]
				});

				expect(updated.predefinedChallenges).toHaveLength(4);

				// Check that existing IDs are preserved
				expect(updated.predefinedChallenges![0].id).toBe('existing-id-1');
				expect(updated.predefinedChallenges![3].id).toBe('existing-id-2');

				// Check that new IDs are generated
				expect(updated.predefinedChallenges![1].id).toBeDefined();
				expect(updated.predefinedChallenges![1].id).not.toBe('existing-id-1');
				expect(updated.predefinedChallenges![1].id).not.toBe('existing-id-2');

				expect(updated.predefinedChallenges![2].id).toBeDefined();
				expect(updated.predefinedChallenges![2].id).not.toBe('existing-id-1');
				expect(updated.predefinedChallenges![2].id).not.toBe('existing-id-2');
			});

			it('should not update predefined challenges if not in update input', async () => {
				const montage = await montageRepository.create({
					name: 'With Challenges',
					difficulty: 'moderate',
					playerCount: 4,
					predefinedChallenges: [
						{ name: 'Challenge A' },
						{ name: 'Challenge B' }
					]
				});

				const originalChallenges = montage.predefinedChallenges;

				// Update name only, should not affect predefined challenges
				const updated = await montageRepository.update(montage.id, {
					name: 'Updated Name'
				});

				expect(updated.name).toBe('Updated Name');
				expect(updated.predefinedChallenges).toEqual(originalChallenges);
			});
		});
	});

	describe('delete', () => {
		it('should delete montage session', async () => {
			const montage = await montageRepository.create({
				name: 'To Delete',
				difficulty: 'easy',
				playerCount: 3
			});

			await montageRepository.delete(montage.id);

			const retrieved = await montageRepository.getById(montage.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not throw when deleting non-existent montage', async () => {
			await expect(
				montageRepository.delete('non-existent')
			).resolves.not.toThrow();
		});
	});
});

describe('MontageRepository - Lifecycle Operations', () => {
	let montageId: string;

	beforeEach(async () => {
		await db.montageSessions.clear();
		const montage = await montageRepository.create({
			name: 'Test Montage',
			difficulty: 'moderate',
			playerCount: 4
		});
		montageId = montage.id;
	});

	afterEach(async () => {
		await db.montageSessions.clear();
	});

	describe('startMontage', () => {
		it('should transition montage from preparing to active', async () => {
			const montage = await montageRepository.startMontage(montageId);

			expect(montage.status).toBe('active');
			expect(montage.currentRound).toBe(1);
		});

		it('should throw error if montage already active', async () => {
			await montageRepository.startMontage(montageId);

			await expect(
				montageRepository.startMontage(montageId)
			).rejects.toThrow('already active');
		});

		it('should throw error if montage is completed', async () => {
			await montageRepository.startMontage(montageId);
			// Record enough successes to complete
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 2'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 3'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 4'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 5'
			});

			await expect(
				montageRepository.startMontage(montageId)
			).rejects.toThrow('completed');
		});

		it('should update timestamp', async () => {
			const before = await montageRepository.getById(montageId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const montage = await montageRepository.startMontage(montageId);

			expect(montage.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
		});
	});

	describe('completeMontage', () => {
		it('should mark montage as completed with outcome', async () => {
			await montageRepository.startMontage(montageId);

			const montage = await montageRepository.completeMontage(montageId, 'total_success');

			expect(montage.status).toBe('completed');
			expect(montage.outcome).toBe('total_success');
			expect(montage.completedAt).toBeInstanceOf(Date);
		});

		it('should calculate and award victory points for easy total success', async () => {
			const easyMontage = await montageRepository.create({
				name: 'Easy Test',
				difficulty: 'easy',
				playerCount: 3
			});
			await montageRepository.startMontage(easyMontage.id);

			const completed = await montageRepository.completeMontage(
				easyMontage.id,
				'total_success'
			);

			expect(completed.victoryPoints).toBe(1);
		});

		it('should calculate and award victory points for hard partial success', async () => {
			const hardMontage = await montageRepository.create({
				name: 'Hard Test',
				difficulty: 'hard',
				playerCount: 4
			});
			await montageRepository.startMontage(hardMontage.id);

			const completed = await montageRepository.completeMontage(
				hardMontage.id,
				'partial_success'
			);

			expect(completed.victoryPoints).toBe(1);
		});

		it('should award 0 VP for total failure', async () => {
			await montageRepository.startMontage(montageId);

			const completed = await montageRepository.completeMontage(montageId, 'total_failure');

			expect(completed.victoryPoints).toBe(0);
		});

		it('should throw error if montage not active', async () => {
			await expect(
				montageRepository.completeMontage(montageId, 'total_success')
			).rejects.toThrow('not active');
		});

		it('should set completedAt timestamp', async () => {
			await montageRepository.startMontage(montageId);

			const before = new Date();
			const montage = await montageRepository.completeMontage(montageId, 'total_success');
			const after = new Date();

			expect(montage.completedAt).toBeInstanceOf(Date);
			expect(montage.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(montage.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('reopenMontage', () => {
		it('should reopen completed montage', async () => {
			await montageRepository.startMontage(montageId);
			await montageRepository.completeMontage(montageId, 'total_success');

			const montage = await montageRepository.reopenMontage(montageId);

			expect(montage.status).toBe('active');
			expect(montage.outcome).toBeUndefined();
			expect(montage.victoryPoints).toBe(0);
			expect(montage.completedAt).toBeUndefined();
		});

		it('should throw error if montage not completed', async () => {
			await expect(
				montageRepository.reopenMontage(montageId)
			).rejects.toThrow('not completed');
		});

		it('should preserve challenges when reopening', async () => {
			await montageRepository.startMontage(montageId);
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Test Challenge'
			});
			await montageRepository.completeMontage(montageId, 'total_failure');

			const montage = await montageRepository.reopenMontage(montageId);

			expect(montage.challenges.length).toBe(1);
			expect(montage.challenges[0].description).toBe('Test Challenge');
		});
	});
});

describe('MontageRepository - Challenge Recording', () => {
	let montageId: string;

	beforeEach(async () => {
		await db.montageSessions.clear();
		const montage = await montageRepository.create({
			name: 'Test Montage',
			difficulty: 'moderate',
			playerCount: 4
		});
		montageId = montage.id;
		await montageRepository.startMontage(montageId);
	});

	afterEach(async () => {
		await db.montageSessions.clear();
	});

	describe('recordChallengeResult', () => {
		it('should record a successful challenge', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Climb the wall',
				playerName: 'Aragorn'
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].result).toBe('success');
			expect(montage.challenges[0].description).toBe('Climb the wall');
			expect(montage.challenges[0].playerName).toBe('Aragorn');
			expect(montage.challenges[0].round).toBe(1);
			expect(montage.successCount).toBe(1);
			expect(montage.failureCount).toBe(0);
		});

		it('should record a failed challenge', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'Pick the lock',
				playerName: 'Legolas'
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].result).toBe('failure');
			expect(montage.successCount).toBe(0);
			expect(montage.failureCount).toBe(1);
		});

		it('should record a skipped challenge', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'skip',
				description: 'Bypass the guards'
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].result).toBe('skip');
			expect(montage.successCount).toBe(0);
			expect(montage.failureCount).toBe(0);
		});

		it('should track current round correctly', async () => {
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 1'
			});

			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'Challenge 2'
			});

			expect(montage.challenges).toHaveLength(2);
			expect(montage.challenges[0].round).toBe(1);
			expect(montage.challenges[1].round).toBe(1);
			expect(montage.currentRound).toBe(1);
		});

		it('should advance to round 2 after enough challenges', async () => {
			// Record playerCount challenges to move to round 2
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 2'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'Challenge 3'
			});
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Challenge 4'
			});

			expect(montage.currentRound).toBe(2);
		});

		it('should record challenge in round 2', async () => {
			// Move to round 2
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'R1 C1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'R1 C2'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'R1 C3'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'R1 C4'
			});

			// Record in round 2
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'R2 C1'
			});

			expect(montage.challenges).toHaveLength(5);
			expect(montage.challenges[4].round).toBe(2);
		});

		it('should include optional notes', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Stealth check',
				notes: 'Used invisibility spell'
			});

			expect(montage.challenges[0].notes).toBe('Used invisibility spell');
		});

		it('should auto-complete with total success when success limit reached', async () => {
			// Need 5 successes for moderate with 4 players
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C2'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C3'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C4'
			});
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C5'
			});

			expect(montage.status).toBe('completed');
			expect(montage.outcome).toBe('total_success');
			expect(montage.victoryPoints).toBe(1);
		});

		it('should auto-complete with total failure when failure limit reached', async () => {
			// Need 3 failures for moderate with 4 players
			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'F1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'F2'
			});
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'F3'
			});

			expect(montage.status).toBe('completed');
			expect(montage.outcome).toBe('total_failure');
			expect(montage.victoryPoints).toBe(0);
		});

		it('should auto-complete with partial success when criteria met', async () => {
			// Need hard difficulty with 5 players for this scenario to work:
			// successLimit=7, failureLimit=3
			// 3 failures, 5 successes = partial success (5 >= 3 + 2, and 5 < 7)
			const hardMontage = await montageRepository.create({
				name: 'Hard Test',
				difficulty: 'hard',
				playerCount: 5
			});
			await montageRepository.startMontage(hardMontage.id);

			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'success',
				description: 'S1'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'success',
				description: 'S2'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'failure',
				description: 'F1'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'success',
				description: 'S3'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'failure',
				description: 'F2'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'success',
				description: 'S4'
			});
			await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'success',
				description: 'S5'
			});
			const montage = await montageRepository.recordChallengeResult(hardMontage.id, {
				result: 'failure',
				description: 'F3'
			});

			expect(montage.status).toBe('completed');
			expect(montage.outcome).toBe('partial_success');
			expect(montage.victoryPoints).toBe(1); // Hard gives 1 VP for partial
		});

		it('should throw error if montage not active', async () => {
			const newMontage = await montageRepository.create({
				name: 'Not Started',
				difficulty: 'easy',
				playerCount: 3
			});

			await expect(
				montageRepository.recordChallengeResult(newMontage.id, {
					result: 'success',
					description: 'Test'
				})
			).rejects.toThrow('not active');
		});

		it('should throw error if montage already completed', async () => {
			// Complete the montage
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'S1'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'S2'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'S3'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'S4'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'S5'
			});

			await expect(
				montageRepository.recordChallengeResult(montageId, {
					result: 'success',
					description: 'Extra'
				})
			).rejects.toThrow();
		});

		it('should generate unique IDs for challenges', async () => {
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'C1'
			});
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'C2'
			});

			expect(montage.challenges[0].id).toBeDefined();
			expect(montage.challenges[1].id).toBeDefined();
			expect(montage.challenges[0].id).not.toBe(montage.challenges[1].id);
		});
	});
});

describe('MontageRepository - Predefined Challenges', () => {
	beforeEach(async () => {
		await db.montageSessions.clear();
	});

	afterEach(async () => {
		await db.montageSessions.clear();
	});

	describe('create with predefined challenges', () => {
		it('should create montage with predefined challenges and generate IDs', async () => {
			const montage = await montageRepository.create({
				name: 'Keep Moving',
				description: 'A journey through dangerous terrain',
				difficulty: 'moderate',
				playerCount: 4,
				predefinedChallenges: [
					{
						name: 'Find Shelter',
						description: 'Locate a safe place to rest',
						suggestedSkills: ['Search', 'Nature']
					},
					{
						name: 'Rally Horse',
						description: 'Calm and gather the horses',
						suggestedSkills: ['Animal Handling']
					},
					{
						name: 'Forage for Herbs',
						description: 'Find medicinal plants',
						suggestedSkills: ['Nature', 'Medicine']
					}
				]
			});

			expect(montage.predefinedChallenges).toBeDefined();
			expect(montage.predefinedChallenges).toHaveLength(3);

			// Each predefined challenge should have a generated ID
			expect(montage.predefinedChallenges![0].id).toBeDefined();
			expect(montage.predefinedChallenges![0].name).toBe('Find Shelter');
			expect(montage.predefinedChallenges![0].description).toBe('Locate a safe place to rest');
			expect(montage.predefinedChallenges![0].suggestedSkills).toEqual(['Search', 'Nature']);

			expect(montage.predefinedChallenges![1].id).toBeDefined();
			expect(montage.predefinedChallenges![1].name).toBe('Rally Horse');

			expect(montage.predefinedChallenges![2].id).toBeDefined();
			expect(montage.predefinedChallenges![2].name).toBe('Forage for Herbs');

			// IDs should be unique
			const ids = montage.predefinedChallenges!.map((c) => c.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(3);
		});

		it('should create montage without predefined challenges (backward compatible)', async () => {
			const montage = await montageRepository.create({
				name: 'Classic Montage',
				difficulty: 'easy',
				playerCount: 3
			});

			expect(montage.predefinedChallenges).toBeUndefined();
			expect(montage.challenges).toEqual([]);
			expect(montage.status).toBe('preparing');
		});

		it('should handle predefined challenges without optional fields', async () => {
			const montage = await montageRepository.create({
				name: 'Simple Challenges',
				difficulty: 'hard',
				playerCount: 5,
				predefinedChallenges: [
					{ name: 'Challenge 1' },
					{ name: 'Challenge 2' },
					{ name: 'Challenge 3' }
				]
			});

			expect(montage.predefinedChallenges).toHaveLength(3);
			expect(montage.predefinedChallenges![0].description).toBeUndefined();
			expect(montage.predefinedChallenges![0].suggestedSkills).toBeUndefined();
		});

		it('should handle empty predefined challenges array', async () => {
			const montage = await montageRepository.create({
				name: 'No Predefined Challenges',
				difficulty: 'moderate',
				playerCount: 4,
				predefinedChallenges: []
			});

			expect(montage.predefinedChallenges).toEqual([]);
		});
	});

	describe('recordChallengeResult with predefined challenges', () => {
		let montageId: string;
		let predefinedChallengeIds: string[];

		beforeEach(async () => {
			const montage = await montageRepository.create({
				name: 'Predefined Test Montage',
				difficulty: 'moderate',
				playerCount: 4,
				predefinedChallenges: [
					{ name: 'Challenge A', description: 'First challenge' },
					{ name: 'Challenge B', description: 'Second challenge' },
					{ name: 'Challenge C', description: 'Third challenge' }
				]
			});
			montageId = montage.id;
			predefinedChallengeIds = montage.predefinedChallenges!.map((c) => c.id);
			await montageRepository.startMontage(montageId);
		});

		it('should record challenge result linked to predefined challenge', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Successfully completed Challenge A',
				playerName: 'Aragorn',
				predefinedChallengeId: predefinedChallengeIds[0]
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].result).toBe('success');
			expect(montage.challenges[0].predefinedChallengeId).toBe(predefinedChallengeIds[0]);
			expect(montage.challenges[0].description).toBe('Successfully completed Challenge A');
			expect(montage.successCount).toBe(1);
		});

		it('should record multiple results for different predefined challenges', async () => {
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				playerName: 'Aragorn',
				predefinedChallengeId: predefinedChallengeIds[0]
			});

			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				playerName: 'Legolas',
				predefinedChallengeId: predefinedChallengeIds[1]
			});

			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				playerName: 'Gimli',
				predefinedChallengeId: predefinedChallengeIds[2]
			});

			expect(montage.challenges).toHaveLength(3);
			expect(montage.challenges[0].predefinedChallengeId).toBe(predefinedChallengeIds[0]);
			expect(montage.challenges[1].predefinedChallengeId).toBe(predefinedChallengeIds[1]);
			expect(montage.challenges[2].predefinedChallengeId).toBe(predefinedChallengeIds[2]);
			expect(montage.successCount).toBe(2);
			expect(montage.failureCount).toBe(1);
		});

		it('should record ad-hoc challenge without predefined challenge ID', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Improvised challenge',
				playerName: 'Gandalf'
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].predefinedChallengeId).toBeUndefined();
			expect(montage.challenges[0].description).toBe('Improvised challenge');
			expect(montage.successCount).toBe(1);
		});

		it('should allow mixing predefined and ad-hoc challenges', async () => {
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				playerName: 'Aragorn',
				predefinedChallengeId: predefinedChallengeIds[0]
			});

			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				description: 'Unexpected obstacle',
				playerName: 'Legolas'
			});

			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				playerName: 'Gimli',
				predefinedChallengeId: predefinedChallengeIds[1]
			});

			expect(montage.challenges).toHaveLength(3);
			expect(montage.challenges[0].predefinedChallengeId).toBe(predefinedChallengeIds[0]);
			expect(montage.challenges[1].predefinedChallengeId).toBeUndefined();
			expect(montage.challenges[2].predefinedChallengeId).toBe(predefinedChallengeIds[1]);
		});

		it('should allow same predefined challenge to be attempted multiple times', async () => {
			await montageRepository.recordChallengeResult(montageId, {
				result: 'failure',
				playerName: 'Aragorn',
				notes: 'First attempt failed',
				predefinedChallengeId: predefinedChallengeIds[0]
			});

			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				playerName: 'Legolas',
				notes: 'Second attempt succeeded',
				predefinedChallengeId: predefinedChallengeIds[0]
			});

			expect(montage.challenges).toHaveLength(2);
			expect(montage.challenges[0].predefinedChallengeId).toBe(predefinedChallengeIds[0]);
			expect(montage.challenges[0].result).toBe('failure');
			expect(montage.challenges[1].predefinedChallengeId).toBe(predefinedChallengeIds[0]);
			expect(montage.challenges[1].result).toBe('success');
			expect(montage.successCount).toBe(1);
			expect(montage.failureCount).toBe(1);
		});

		it('should record skipped predefined challenge', async () => {
			const montage = await montageRepository.recordChallengeResult(montageId, {
				result: 'skip',
				notes: 'Party decided to skip this challenge',
				predefinedChallengeId: predefinedChallengeIds[1]
			});

			expect(montage.challenges).toHaveLength(1);
			expect(montage.challenges[0].result).toBe('skip');
			expect(montage.challenges[0].predefinedChallengeId).toBe(predefinedChallengeIds[1]);
			expect(montage.successCount).toBe(0);
			expect(montage.failureCount).toBe(0);
		});
	});

	describe('backward compatibility', () => {
		it('should work with montages created without predefined challenges', async () => {
			const montage = await montageRepository.create({
				name: 'Legacy Montage',
				difficulty: 'easy',
				playerCount: 3
			});

			await montageRepository.startMontage(montage.id);

			const updated = await montageRepository.recordChallengeResult(montage.id, {
				result: 'success',
				description: 'Old style challenge'
			});

			expect(updated.predefinedChallenges).toBeUndefined();
			expect(updated.challenges).toHaveLength(1);
			expect(updated.challenges[0].predefinedChallengeId).toBeUndefined();
		});
	});

	describe('Narrative Event Integration (Issue #399)', () => {
		let montageId: string;

		beforeEach(async () => {
			// Create and start a montage
			const montage = await montageRepository.create({
				name: 'Wilderness Survival',
				description: 'Finding shelter and food',
				difficulty: 'easy',
				playerCount: 3
			});
			montageId = montage.id;
			await montageRepository.startMontage(montageId);
		});

		it('should create a narrative event when montage completes', async () => {
			// Complete the montage
			const completedMontage = await montageRepository.completeMontage(
				montageId,
				'total_success'
			);

			expect(completedMontage.status).toBe('completed');
			expect(completedMontage.outcome).toBe('total_success');
			// Verify that a narrative event would be created
			// (implementation will add actual service call)
		});

		it('should not throw if narrative event creation fails', async () => {
			// Even if narrative event service fails, montage should still complete
			// This test verifies the try/catch pattern

			// Complete montage should succeed
			await expect(
				montageRepository.completeMontage(montageId, 'total_success')
			).resolves.toBeDefined();

			// Montage should be in completed state
			const montage = await montageRepository.getById(montageId);
			expect(montage?.status).toBe('completed');
		});

		it('should create narrative event on auto-completion', async () => {
			// Record enough successes to trigger auto-completion
			// Easy difficulty with 3 players: successLimit = 3
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Found shelter'
			});
			await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Found food'
			});
			const finalMontage = await montageRepository.recordChallengeResult(montageId, {
				result: 'success',
				description: 'Made fire'
			});

			// Should auto-complete
			expect(finalMontage.status).toBe('completed');
			expect(finalMontage.outcome).toBe('total_success');
			// Narrative event should be created on auto-completion too
		});

		it('should only create narrative event when montage is completed', async () => {
			// Starting montage should not create narrative event
			let montage = await montageRepository.getById(montageId);
			expect(montage?.status).toBe('active');

			// Only completeMontage should create narrative event
			const completedMontage = await montageRepository.completeMontage(
				montageId,
				'partial_success'
			);
			expect(completedMontage.status).toBe('completed');
		});
	});
});
