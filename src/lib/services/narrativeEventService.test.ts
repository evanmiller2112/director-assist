/**
 * Tests for Narrative Event Service (TDD RED Phase - Issue #399)
 *
 * This service creates narrative event entities from combat sessions,
 * montage sessions, and scenes, and manages timeline relationships.
 *
 * These tests should FAIL initially as the service doesn't exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createFromCombat,
	createFromMontage,
	createFromScene,
	linkEvents
} from './narrativeEventService';
import type { CombatSession } from '$lib/types/combat';
import type { MontageSession } from '$lib/types/montage';
import type { BaseEntity } from '$lib/types';

// Mock the entity repository
vi.mock('$lib/db/repositories/entityRepository', () => ({
	entityRepository: {
		create: vi.fn(),
		getById: vi.fn(),
		addLink: vi.fn()
	}
}));

import { entityRepository } from '$lib/db/repositories/entityRepository';

describe('narrativeEventService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createFromCombat', () => {
		describe('Successful Creation', () => {
			it('should create narrative event with type "narrative_event"', async () => {
				const combat: CombatSession = {
					id: 'combat-123',
					name: 'Battle at the Bridge',
					description: 'Epic battle against bandits',
					status: 'completed',
					currentRound: 5,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 3,
					heroPoints: 2,
					log: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01')
				};

				const createdEntity: BaseEntity = {
					id: 'event-123',
					type: 'narrative_event',
					name: 'Battle at the Bridge',
					description: 'Epic battle against bandits',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-123',
						outcome: 'Victory in 5 rounds, earned 3 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.type).toBe('narrative_event');
			});

			it('should set eventType field to "combat"', async () => {
				const combat: CombatSession = {
					id: 'combat-456',
					name: 'Goblin Ambush',
					status: 'completed',
					currentRound: 3,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 1,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-456',
					type: 'narrative_event',
					name: 'Goblin Ambush',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-456',
						outcome: 'Victory in 3 rounds, earned 1 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.fields.eventType).toBe('combat');
			});

			it('should set sourceId to combat.id', async () => {
				const combat: CombatSession = {
					id: 'combat-unique-789',
					name: 'Dragon Fight',
					status: 'completed',
					currentRound: 10,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 5,
					heroPoints: 3,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-789',
					type: 'narrative_event',
					name: 'Dragon Fight',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-unique-789',
						outcome: 'Victory in 10 rounds, earned 5 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.fields.sourceId).toBe('combat-unique-789');
			});

			it('should set outcome with combat summary including rounds and victory points', async () => {
				const combat: CombatSession = {
					id: 'combat-summary',
					name: 'Bandit Showdown',
					status: 'completed',
					currentRound: 7,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 4,
					heroPoints: 2,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-summary',
					type: 'narrative_event',
					name: 'Bandit Showdown',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-summary',
						outcome: 'Victory in 7 rounds, earned 4 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.fields.outcome).toContain('7 rounds');
				expect(result.fields.outcome).toContain('4 VP');
			});

			it('should use combat name as entity name', async () => {
				const combat: CombatSession = {
					id: 'combat-name',
					name: 'The Great Siege',
					status: 'completed',
					currentRound: 15,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 10,
					heroPoints: 5,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-name',
					type: 'narrative_event',
					name: 'The Great Siege',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-name',
						outcome: 'Victory in 15 rounds, earned 10 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.name).toBe('The Great Siege');
			});

			it('should use combat description if provided', async () => {
				const combat: CombatSession = {
					id: 'combat-desc',
					name: 'Forest Ambush',
					description: 'Bandits attacked from the trees',
					status: 'completed',
					currentRound: 4,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 2,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-desc',
					type: 'narrative_event',
					name: 'Forest Ambush',
					description: 'Bandits attacked from the trees',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-desc',
						outcome: 'Victory in 4 rounds, earned 2 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.description).toBe('Bandits attacked from the trees');
			});

			it('should call entityRepository.create with correct structure', async () => {
				const combat: CombatSession = {
					id: 'combat-call-test',
					name: 'Test Combat',
					description: 'Test description',
					status: 'completed',
					currentRound: 3,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 2,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-call-test',
					type: 'narrative_event',
					name: 'Test Combat',
					description: 'Test description',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-call-test',
						outcome: 'Victory in 3 rounds, earned 2 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				await createFromCombat(combat);

				expect(entityRepository.create).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'narrative_event',
						name: 'Test Combat',
						description: 'Test description',
						fields: expect.objectContaining({
							eventType: 'combat',
							sourceId: 'combat-call-test',
							outcome: expect.stringContaining('3 rounds')
						})
					})
				);
			});
		});

		describe('Error Handling', () => {
			it('should fail if combat is not completed', async () => {
				const combat: CombatSession = {
					id: 'combat-active',
					name: 'Active Combat',
					status: 'active',
					currentRound: 2,
					currentTurn: 1,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 0,
					heroPoints: 3,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(createFromCombat(combat)).rejects.toThrow(
					'Cannot create narrative event from combat that is not completed'
				);
			});

			it('should fail if combat status is "preparing"', async () => {
				const combat: CombatSession = {
					id: 'combat-preparing',
					name: 'Preparing Combat',
					status: 'preparing',
					currentRound: 0,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 0,
					heroPoints: 3,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(createFromCombat(combat)).rejects.toThrow(
					'Cannot create narrative event from combat that is not completed'
				);
			});

			it('should fail if combat status is "paused"', async () => {
				const combat: CombatSession = {
					id: 'combat-paused',
					name: 'Paused Combat',
					status: 'paused',
					currentRound: 3,
					currentTurn: 2,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 1,
					heroPoints: 2,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(createFromCombat(combat)).rejects.toThrow(
					'Cannot create narrative event from combat that is not completed'
				);
			});

			it('should throw error when repository creation fails', async () => {
				const combat: CombatSession = {
					id: 'combat-fail',
					name: 'Failed Combat',
					status: 'completed',
					currentRound: 1,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 0,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				vi.mocked(entityRepository.create).mockRejectedValue(
					new Error('Database error')
				);

				await expect(createFromCombat(combat)).rejects.toThrow('Database error');
			});
		});

		describe('Edge Cases', () => {
			it('should handle combat with zero victory points', async () => {
				const combat: CombatSession = {
					id: 'combat-zero-vp',
					name: 'No VP Combat',
					status: 'completed',
					currentRound: 2,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 0,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-zero-vp',
					type: 'narrative_event',
					name: 'No VP Combat',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-zero-vp',
						outcome: 'Victory in 2 rounds, earned 0 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.fields.outcome).toContain('0 VP');
			});

			it('should handle combat with only 1 round', async () => {
				const combat: CombatSession = {
					id: 'combat-one-round',
					name: 'Quick Combat',
					status: 'completed',
					currentRound: 1,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 1,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-one-round',
					type: 'narrative_event',
					name: 'Quick Combat',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-one-round',
						outcome: 'Victory in 1 rounds, earned 1 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.fields.outcome).toContain('1 rounds');
			});

			it('should handle combat with empty description', async () => {
				const combat: CombatSession = {
					id: 'combat-no-desc',
					name: 'No Description Combat',
					status: 'completed',
					currentRound: 3,
					currentTurn: 0,
					combatants: [],
					groups: [],
					turnMode: 'director-selected',
					actedCombatantIds: [],
					victoryPoints: 2,
					heroPoints: 1,
					log: [],
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-no-desc',
					type: 'narrative_event',
					name: 'No Description Combat',
					description: '',
					tags: [],
					fields: {
						eventType: 'combat',
						sourceId: 'combat-no-desc',
						outcome: 'Victory in 3 rounds, earned 2 VP'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromCombat(combat);

				expect(result.description).toBe('');
			});
		});
	});

	describe('createFromMontage', () => {
		describe('Successful Creation', () => {
			it('should create narrative event with type "narrative_event"', async () => {
				const montage: MontageSession = {
					id: 'montage-123',
					name: 'Journey to the Capital',
					description: 'Travel montage through wilderness',
					status: 'completed',
					difficulty: 'moderate',
					playerCount: 4,
					successLimit: 5,
					failureLimit: 3,
					challenges: [],
					successCount: 5,
					failureCount: 1,
					currentRound: 2,
					outcome: 'total_success',
					victoryPoints: 2,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-123',
					type: 'narrative_event',
					name: 'Journey to the Capital',
					description: 'Travel montage through wilderness',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-123',
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.type).toBe('narrative_event');
			});

			it('should set eventType field to "montage"', async () => {
				const montage: MontageSession = {
					id: 'montage-456',
					name: 'Gathering Supplies',
					status: 'completed',
					difficulty: 'easy',
					playerCount: 3,
					successLimit: 4,
					failureLimit: 2,
					challenges: [],
					successCount: 4,
					failureCount: 0,
					currentRound: 1,
					outcome: 'total_success',
					victoryPoints: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-456',
					type: 'narrative_event',
					name: 'Gathering Supplies',
					description: '',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-456',
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.fields.eventType).toBe('montage');
			});

			it('should set sourceId to montage.id', async () => {
				const montage: MontageSession = {
					id: 'montage-unique-789',
					name: 'Crafting Preparations',
					status: 'completed',
					difficulty: 'hard',
					playerCount: 5,
					successLimit: 6,
					failureLimit: 4,
					challenges: [],
					successCount: 6,
					failureCount: 2,
					currentRound: 2,
					outcome: 'total_success',
					victoryPoints: 3,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-789',
					type: 'narrative_event',
					name: 'Crafting Preparations',
					description: '',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-unique-789',
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.fields.sourceId).toBe('montage-unique-789');
			});

			it('should set outcome to montage outcome value', async () => {
				const montage: MontageSession = {
					id: 'montage-outcome',
					name: 'Mountain Crossing',
					status: 'completed',
					difficulty: 'hard',
					playerCount: 4,
					successLimit: 6,
					failureLimit: 4,
					challenges: [],
					successCount: 4,
					failureCount: 4,
					currentRound: 2,
					outcome: 'partial_success',
					victoryPoints: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-outcome',
					type: 'narrative_event',
					name: 'Mountain Crossing',
					description: '',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-outcome',
						outcome: 'partial_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.fields.outcome).toBe('partial_success');
			});

			it('should use montage name as entity name', async () => {
				const montage: MontageSession = {
					id: 'montage-name',
					name: 'Escape from the Dungeon',
					status: 'completed',
					difficulty: 'hard',
					playerCount: 4,
					successLimit: 6,
					failureLimit: 4,
					challenges: [],
					successCount: 3,
					failureCount: 4,
					currentRound: 2,
					outcome: 'total_failure',
					victoryPoints: 0,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-name',
					type: 'narrative_event',
					name: 'Escape from the Dungeon',
					description: '',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-name',
						outcome: 'total_failure'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.name).toBe('Escape from the Dungeon');
			});

			it('should handle all three outcome types', async () => {
				const outcomes: Array<'total_success' | 'partial_success' | 'total_failure'> = [
					'total_success',
					'partial_success',
					'total_failure'
				];

				for (const outcome of outcomes) {
					const montage: MontageSession = {
						id: `montage-${outcome}`,
						name: `Test ${outcome}`,
						status: 'completed',
						difficulty: 'moderate',
						playerCount: 4,
						successLimit: 5,
						failureLimit: 3,
						challenges: [],
						successCount: outcome === 'total_failure' ? 2 : 5,
						failureCount: outcome === 'total_failure' ? 3 : 1,
						currentRound: 2,
						outcome,
						victoryPoints: outcome === 'total_success' ? 2 : outcome === 'partial_success' ? 1 : 0,
						createdAt: new Date(),
						updatedAt: new Date()
					};

					const createdEntity: BaseEntity = {
						id: `event-${outcome}`,
						type: 'narrative_event',
						name: `Test ${outcome}`,
						description: '',
						tags: [],
						fields: {
							eventType: 'montage',
							sourceId: `montage-${outcome}`,
							outcome
						},
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					};

					vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

					const result = await createFromMontage(montage);

					expect(result.fields.outcome).toBe(outcome);
				}
			});
		});

		describe('Error Handling', () => {
			it('should fail if montage is not completed', async () => {
				const montage: MontageSession = {
					id: 'montage-active',
					name: 'Active Montage',
					status: 'active',
					difficulty: 'moderate',
					playerCount: 4,
					successLimit: 5,
					failureLimit: 3,
					challenges: [],
					successCount: 2,
					failureCount: 1,
					currentRound: 1,
					victoryPoints: 0,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(createFromMontage(montage)).rejects.toThrow(
					'Cannot create narrative event from montage that is not completed'
				);
			});

			it('should fail if montage status is "preparing"', async () => {
				const montage: MontageSession = {
					id: 'montage-preparing',
					name: 'Preparing Montage',
					status: 'preparing',
					difficulty: 'moderate',
					playerCount: 4,
					successLimit: 5,
					failureLimit: 3,
					challenges: [],
					successCount: 0,
					failureCount: 0,
					currentRound: 1,
					victoryPoints: 0,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				await expect(createFromMontage(montage)).rejects.toThrow(
					'Cannot create narrative event from montage that is not completed'
				);
			});

			it('should throw error when repository creation fails', async () => {
				const montage: MontageSession = {
					id: 'montage-fail',
					name: 'Failed Montage',
					status: 'completed',
					difficulty: 'easy',
					playerCount: 3,
					successLimit: 4,
					failureLimit: 2,
					challenges: [],
					successCount: 4,
					failureCount: 0,
					currentRound: 1,
					outcome: 'total_success',
					victoryPoints: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				vi.mocked(entityRepository.create).mockRejectedValue(
					new Error('Database error')
				);

				await expect(createFromMontage(montage)).rejects.toThrow('Database error');
			});
		});

		describe('Edge Cases', () => {
			it('should handle montage with description', async () => {
				const montage: MontageSession = {
					id: 'montage-desc',
					name: 'Wilderness Trek',
					description: 'A perilous journey through uncharted lands',
					status: 'completed',
					difficulty: 'moderate',
					playerCount: 4,
					successLimit: 5,
					failureLimit: 3,
					challenges: [],
					successCount: 5,
					failureCount: 1,
					currentRound: 2,
					outcome: 'total_success',
					victoryPoints: 2,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-desc',
					type: 'narrative_event',
					name: 'Wilderness Trek',
					description: 'A perilous journey through uncharted lands',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-desc',
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.description).toBe('A perilous journey through uncharted lands');
			});

			it('should handle montage with empty description', async () => {
				const montage: MontageSession = {
					id: 'montage-no-desc',
					name: 'Simple Montage',
					status: 'completed',
					difficulty: 'easy',
					playerCount: 3,
					successLimit: 4,
					failureLimit: 2,
					challenges: [],
					successCount: 4,
					failureCount: 0,
					currentRound: 1,
					outcome: 'total_success',
					victoryPoints: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: 'event-no-desc',
					type: 'narrative_event',
					name: 'Simple Montage',
					description: '',
					tags: [],
					fields: {
						eventType: 'montage',
						sourceId: 'montage-no-desc',
						outcome: 'total_success'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromMontage(montage);

				expect(result.description).toBe('');
			});
		});
	});

	describe('createFromScene', () => {
		describe('Successful Creation', () => {
			it('should create narrative event with type "narrative_event"', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-123',
					type: 'scene',
					name: 'Meeting at the Tavern',
					description: 'The party meets in a dimly lit tavern',
					tags: ['roleplay', 'intro'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-123',
					type: 'narrative_event',
					name: 'Meeting at the Tavern',
					description: 'The party meets in a dimly lit tavern',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-123'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-123');

				expect(result.type).toBe('narrative_event');
			});

			it('should set eventType field to "scene"', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-456',
					type: 'scene',
					name: 'Chase Through the Market',
					description: 'A thrilling chase scene',
					tags: ['action'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-456',
					type: 'narrative_event',
					name: 'Chase Through the Market',
					description: 'A thrilling chase scene',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-456'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-456');

				expect(result.fields.eventType).toBe('scene');
			});

			it('should set sourceId to scene entity id', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-unique-789',
					type: 'scene',
					name: 'Throne Room Confrontation',
					description: 'The party confronts the king',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-789',
					type: 'narrative_event',
					name: 'Throne Room Confrontation',
					description: 'The party confronts the king',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-unique-789'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-unique-789');

				expect(result.fields.sourceId).toBe('scene-unique-789');
			});

			it('should copy name from scene entity', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-name',
					type: 'scene',
					name: 'The Grand Revelation',
					description: 'The villain reveals their master plan',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-name',
					type: 'narrative_event',
					name: 'The Grand Revelation',
					description: 'The villain reveals their master plan',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-name'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-name');

				expect(result.name).toBe('The Grand Revelation');
			});

			it('should copy description from scene entity', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-desc',
					type: 'scene',
					name: 'Library Investigation',
					description: 'The party searches ancient tomes for clues',
					tags: ['investigation'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-desc',
					type: 'narrative_event',
					name: 'Library Investigation',
					description: 'The party searches ancient tomes for clues',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-desc'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-desc');

				expect(result.description).toBe('The party searches ancient tomes for clues');
			});

			it('should call entityRepository.getById with scene id', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-get-test',
					type: 'scene',
					name: 'Test Scene',
					description: 'Test description',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-get-test',
					type: 'narrative_event',
					name: 'Test Scene',
					description: 'Test description',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-get-test'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				await createFromScene('scene-get-test');

				expect(entityRepository.getById).toHaveBeenCalledWith('scene-get-test');
			});
		});

		describe('Error Handling', () => {
			it('should fail if scene entity does not exist', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValue(undefined);

				await expect(createFromScene('nonexistent-scene')).rejects.toThrow(
					'Scene entity not found'
				);
			});

			it('should fail if entity is not a scene type', async () => {
				const notAScene: BaseEntity = {
					id: 'not-scene',
					type: 'npc',
					name: 'A Character',
					description: 'Not a scene',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(notAScene);

				await expect(createFromScene('not-scene')).rejects.toThrow(
					'Entity is not a scene type'
				);
			});

			it('should throw error when repository creation fails', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-fail',
					type: 'scene',
					name: 'Failed Scene',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockRejectedValue(
					new Error('Database error')
				);

				await expect(createFromScene('scene-fail')).rejects.toThrow('Database error');
			});
		});

		describe('Edge Cases', () => {
			it('should handle scene with empty description', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-no-desc',
					type: 'scene',
					name: 'Simple Scene',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-no-desc',
					type: 'narrative_event',
					name: 'Simple Scene',
					description: '',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-no-desc'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-no-desc');

				expect(result.description).toBe('');
			});

			it('should handle scene with tags', async () => {
				const sceneEntity: BaseEntity = {
					id: 'scene-tags',
					type: 'scene',
					name: 'Tagged Scene',
					description: 'Scene with tags',
					tags: ['combat', 'roleplay', 'important'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const createdEntity: BaseEntity = {
					id: 'event-tags',
					type: 'narrative_event',
					name: 'Tagged Scene',
					description: 'Scene with tags',
					tags: [],
					fields: {
						eventType: 'scene',
						sourceId: 'scene-tags'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(sceneEntity);
				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromScene('scene-tags');

				expect(result).toBeDefined();
			});
		});
	});

	describe('linkEvents', () => {
		describe('Successful Linking', () => {
			it('should create bidirectional "leads_to" and "follows" relationships', async () => {
				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Event 1',
					description: 'First event',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Event 2',
					description: 'Second event',
					tags: [],
					fields: { eventType: 'combat' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(event1)
					.mockResolvedValueOnce(event2);

				await linkEvents('event-1', 'event-2');

				expect(entityRepository.addLink).toHaveBeenCalledWith(
					'event-1',
					'event-2',
					'leads_to',
					true,
					undefined,
					undefined,
					undefined,
					'follows',
					undefined
				);
			});

			it('should verify both entities exist before linking', async () => {
				const event1: BaseEntity = {
					id: 'event-check-1',
					type: 'narrative_event',
					name: 'Event Check 1',
					description: 'First check',
					tags: [],
					fields: { eventType: 'montage' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-check-2',
					type: 'narrative_event',
					name: 'Event Check 2',
					description: 'Second check',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(event1)
					.mockResolvedValueOnce(event2);

				await linkEvents('event-check-1', 'event-check-2');

				expect(entityRepository.getById).toHaveBeenCalledWith('event-check-1');
				expect(entityRepository.getById).toHaveBeenCalledWith('event-check-2');
			});

			it('should handle linking different event types', async () => {
				const combatEvent: BaseEntity = {
					id: 'combat-event',
					type: 'narrative_event',
					name: 'Combat Event',
					description: 'A battle',
					tags: [],
					fields: { eventType: 'combat' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const montageEvent: BaseEntity = {
					id: 'montage-event',
					type: 'narrative_event',
					name: 'Montage Event',
					description: 'A journey',
					tags: [],
					fields: { eventType: 'montage' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(combatEvent)
					.mockResolvedValueOnce(montageEvent);

				await linkEvents('combat-event', 'montage-event');

				expect(entityRepository.addLink).toHaveBeenCalled();
			});
		});

		describe('Error Handling', () => {
			it('should fail if source entity does not exist', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValue(undefined);

				await expect(linkEvents('nonexistent-1', 'event-2')).rejects.toThrow(
					'Source entity not found'
				);
			});

			it('should fail if target entity does not exist', async () => {
				const event1: BaseEntity = {
					id: 'event-exists',
					type: 'narrative_event',
					name: 'Existing Event',
					description: 'Test',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(event1)
					.mockResolvedValueOnce(undefined);

				await expect(linkEvents('event-exists', 'nonexistent-2')).rejects.toThrow(
					'Target entity not found'
				);
			});

			it('should fail if source entity is not narrative_event type', async () => {
				const notEvent: BaseEntity = {
					id: 'not-event',
					type: 'npc',
					name: 'An NPC',
					description: 'Not an event',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-2',
					type: 'narrative_event',
					name: 'Event 2',
					description: 'Valid event',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(notEvent)
					.mockResolvedValueOnce(event2);

				await expect(linkEvents('not-event', 'event-2')).rejects.toThrow(
					'Source entity is not a narrative_event type'
				);
			});

			it('should fail if target entity is not narrative_event type', async () => {
				const event1: BaseEntity = {
					id: 'event-1',
					type: 'narrative_event',
					name: 'Event 1',
					description: 'Valid event',
					tags: [],
					fields: { eventType: 'combat' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const notEvent: BaseEntity = {
					id: 'not-event-target',
					type: 'location',
					name: 'A Location',
					description: 'Not an event',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(event1)
					.mockResolvedValueOnce(notEvent);

				await expect(linkEvents('event-1', 'not-event-target')).rejects.toThrow(
					'Target entity is not a narrative_event type'
				);
			});

			it('should throw error when addLink fails', async () => {
				const event1: BaseEntity = {
					id: 'event-fail-1',
					type: 'narrative_event',
					name: 'Event Fail 1',
					description: 'Test',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const event2: BaseEntity = {
					id: 'event-fail-2',
					type: 'narrative_event',
					name: 'Event Fail 2',
					description: 'Test',
					tags: [],
					fields: { eventType: 'combat' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(event1)
					.mockResolvedValueOnce(event2);

				vi.mocked(entityRepository.addLink).mockRejectedValueOnce(
					new Error('Link already exists')
				);

				await expect(linkEvents('event-fail-1', 'event-fail-2')).rejects.toThrow(
					'Link already exists'
				);
			});
		});

		describe('Edge Cases', () => {
			it('should handle linking event to itself', async () => {
				const event: BaseEntity = {
					id: 'event-self',
					type: 'narrative_event',
					name: 'Self Event',
					description: 'Links to itself',
					tags: [],
					fields: { eventType: 'other' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById).mockResolvedValue(event);

				await linkEvents('event-self', 'event-self');

				expect(entityRepository.addLink).toHaveBeenCalledWith(
					'event-self',
					'event-self',
					'leads_to',
					true,
					undefined,
					undefined,
					undefined,
					'follows',
					undefined
				);
			});

			it('should preserve relationship direction (from -> to)', async () => {
				const eventA: BaseEntity = {
					id: 'event-a',
					type: 'narrative_event',
					name: 'Event A',
					description: 'First chronologically',
					tags: [],
					fields: { eventType: 'scene' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				const eventB: BaseEntity = {
					id: 'event-b',
					type: 'narrative_event',
					name: 'Event B',
					description: 'Second chronologically',
					tags: [],
					fields: { eventType: 'combat' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.getById)
					.mockResolvedValueOnce(eventA)
					.mockResolvedValueOnce(eventB);

				await linkEvents('event-a', 'event-b');

				// Verify that A leads_to B (not B leads_to A)
				expect(entityRepository.addLink).toHaveBeenCalledWith(
					'event-a',
					'event-b',
					'leads_to',
					true,
					undefined,
					undefined,
					undefined,
					'follows',
					undefined
				);
			});
		});
	});
});


