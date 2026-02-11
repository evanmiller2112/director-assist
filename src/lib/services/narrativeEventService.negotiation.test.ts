/**
 * Tests for Narrative Event Service - Negotiation Support (TDD RED Phase - Issue #426)
 *
 * This test suite verifies that narrative events can be created from completed
 * negotiation sessions, following the same pattern as combat and montage.
 *
 * These tests should FAIL initially as createFromNegotiation() doesn't exist yet.
 *
 * Testing Strategy:
 * - Successful creation from completed negotiation
 * - Proper mapping of negotiation data to narrative event fields
 * - Error handling for non-completed negotiations
 * - Edge cases for different negotiation outcomes
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFromNegotiation } from './narrativeEventService';
import type { NegotiationSession } from '$lib/types/negotiation';
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

describe('narrativeEventService - createFromNegotiation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Successful Creation', () => {
		it('should create narrative event with type "narrative_event"', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-123',
				name: 'Bargain with the Mayor',
				description: 'Negotiating for town support',
				npcName: 'Mayor Aldric',
				status: 'completed',
				interest: 4,
				patience: 2,
				motivations: [
					{
						type: 'legacy',
						description: 'Wants to be seen as a fair leader',
						isKnown: true,
						timesUsed: 2
					}
				],
				pitfalls: [{ description: 'Hates being rushed', isKnown: true }],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-02'),
				completedAt: new Date('2025-01-02')
			};

			const createdEntity: BaseEntity = {
				id: 'event-123',
				type: 'narrative_event',
				name: 'Bargain with the Mayor',
				description: 'Negotiating for town support',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-123',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.type).toBe('narrative_event');
		});

		it('should set eventType field to "negotiation"', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-456',
				name: 'Peace Treaty Discussion',
				npcName: 'War Chief',
				status: 'completed',
				interest: 5,
				patience: 1,
				motivations: [
					{
						type: 'harmony',
						description: 'Wants to end the conflict',
						isKnown: true,
						timesUsed: 1
					}
				],
				pitfalls: [],
				arguments: [],
				outcome: 'alliance',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-456',
				type: 'narrative_event',
				name: 'Peace Treaty Discussion',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-456',
					outcome: 'alliance'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.fields.eventType).toBe('negotiation');
		});

		it('should set sourceId to negotiation.id', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-unique-789',
				name: 'Trade Agreement',
				npcName: 'Merchant Guild Master',
				status: 'completed',
				interest: 3,
				patience: 3,
				motivations: [
					{
						type: 'wealth',
						description: 'Always seeking profit',
						isKnown: false,
						timesUsed: 0
					}
				],
				pitfalls: [],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-789',
				type: 'narrative_event',
				name: 'Trade Agreement',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-unique-789',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.fields.sourceId).toBe('negotiation-unique-789');
		});

		it('should set outcome to negotiation outcome value', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-outcome',
				name: 'Minor Concession',
				npcName: 'Guard Captain',
				status: 'completed',
				interest: 2,
				patience: 0,
				motivations: [
					{
						type: 'justice',
						description: 'Believes in law and order',
						isKnown: true,
						timesUsed: 1
					}
				],
				pitfalls: [],
				arguments: [],
				outcome: 'minor_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-outcome',
				type: 'narrative_event',
				name: 'Minor Concession',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-outcome',
					outcome: 'minor_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.fields.outcome).toBe('minor_favor');
		});

		it('should use negotiation name as entity name', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-name',
				name: 'The Grand Alliance',
				npcName: 'High Priest',
				status: 'completed',
				interest: 5,
				patience: 3,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'alliance',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-name',
				type: 'narrative_event',
				name: 'The Grand Alliance',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-name',
					outcome: 'alliance'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.name).toBe('The Grand Alliance');
		});

		it('should use negotiation description if provided', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-desc',
				name: 'Forest Pact',
				description: 'Negotiating safe passage through the ancient woods',
				npcName: 'Elf Elder',
				status: 'completed',
				interest: 4,
				patience: 2,
				motivations: [
					{
						type: 'protection',
						description: 'Protects the forest',
						isKnown: true,
						timesUsed: 2
					}
				],
				pitfalls: [],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-desc',
				type: 'narrative_event',
				name: 'Forest Pact',
				description: 'Negotiating safe passage through the ancient woods',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-desc',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.description).toBe('Negotiating safe passage through the ancient woods');
		});

		it('should handle all four outcome types', async () => {
			const outcomes: Array<'failure' | 'minor_favor' | 'major_favor' | 'alliance'> = [
				'failure',
				'minor_favor',
				'major_favor',
				'alliance'
			];

			for (const outcome of outcomes) {
				const negotiation: NegotiationSession = {
					id: `negotiation-${outcome}`,
					name: `Test ${outcome}`,
					npcName: 'Test NPC',
					status: 'completed',
					interest: outcome === 'failure' ? 0 : outcome === 'minor_favor' ? 2 : outcome === 'major_favor' ? 3 : 5,
					patience: 1,
					motivations: [],
					pitfalls: [],
					arguments: [],
					outcome,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedAt: new Date()
				};

				const createdEntity: BaseEntity = {
					id: `event-${outcome}`,
					type: 'narrative_event',
					name: `Test ${outcome}`,
					description: '',
					tags: [],
					fields: {
						eventType: 'negotiation',
						sourceId: `negotiation-${outcome}`,
						outcome
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

				const result = await createFromNegotiation(negotiation);

				expect(result.fields.outcome).toBe(outcome);
			}
		});

		it('should call entityRepository.create with correct structure', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-call-test',
				name: 'Test Negotiation',
				description: 'Test description',
				npcName: 'Test NPC',
				status: 'completed',
				interest: 3,
				patience: 2,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-call-test',
				type: 'narrative_event',
				name: 'Test Negotiation',
				description: 'Test description',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-call-test',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			await createFromNegotiation(negotiation);

			expect(entityRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'narrative_event',
					name: 'Test Negotiation',
					description: 'Test description',
					fields: expect.objectContaining({
						eventType: 'negotiation',
						sourceId: 'negotiation-call-test',
						outcome: 'major_favor'
					})
				})
			);
		});
	});

	describe('Error Handling', () => {
		it('should fail if negotiation is not completed', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-active',
				name: 'Active Negotiation',
				npcName: 'Active NPC',
				status: 'active',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [],
				arguments: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await expect(createFromNegotiation(negotiation)).rejects.toThrow(
				'Cannot create narrative event from negotiation that is not completed'
			);
		});

		it('should fail if negotiation status is "preparing"', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-preparing',
				name: 'Preparing Negotiation',
				npcName: 'Preparing NPC',
				status: 'preparing',
				interest: 2,
				patience: 5,
				motivations: [],
				pitfalls: [],
				arguments: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await expect(createFromNegotiation(negotiation)).rejects.toThrow(
				'Cannot create narrative event from negotiation that is not completed'
			);
		});

		it('should throw error when repository creation fails', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-fail',
				name: 'Failed Negotiation',
				npcName: 'Failed NPC',
				status: 'completed',
				interest: 3,
				patience: 2,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			vi.mocked(entityRepository.create).mockRejectedValue(new Error('Database error'));

			await expect(createFromNegotiation(negotiation)).rejects.toThrow('Database error');
		});
	});

	describe('Edge Cases', () => {
		it('should handle negotiation with empty description', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-no-desc',
				name: 'Simple Negotiation',
				npcName: 'Simple NPC',
				status: 'completed',
				interest: 2,
				patience: 3,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'minor_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-no-desc',
				type: 'narrative_event',
				name: 'Simple Negotiation',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-no-desc',
					outcome: 'minor_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.description).toBe('');
		});

		it('should handle negotiation with undefined description', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-undefined-desc',
				name: 'Undefined Description',
				npcName: 'Test NPC',
				status: 'completed',
				interest: 4,
				patience: 1,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-undefined-desc',
				type: 'narrative_event',
				name: 'Undefined Description',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-undefined-desc',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.description).toBe('');
		});

		it('should handle negotiation with zero interest (failure)', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-zero-interest',
				name: 'Failed Negotiation',
				npcName: 'Hostile NPC',
				status: 'completed',
				interest: 0,
				patience: 0,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'failure',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-zero-interest',
				type: 'narrative_event',
				name: 'Failed Negotiation',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-zero-interest',
					outcome: 'failure'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.fields.outcome).toBe('failure');
		});

		it('should handle negotiation with maximum interest (alliance)', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-max-interest',
				name: 'Perfect Alliance',
				npcName: 'Allied Leader',
				status: 'completed',
				interest: 5,
				patience: 4,
				motivations: [],
				pitfalls: [],
				arguments: [],
				outcome: 'alliance',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-max-interest',
				type: 'narrative_event',
				name: 'Perfect Alliance',
				description: '',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-max-interest',
					outcome: 'alliance'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result.fields.outcome).toBe('alliance');
		});

		it('should handle negotiation with complex motivations and pitfalls', async () => {
			const negotiation: NegotiationSession = {
				id: 'negotiation-complex',
				name: 'Complex Negotiation',
				description: 'Multi-faceted discussion',
				npcName: 'Complex Character',
				status: 'completed',
				interest: 4,
				patience: 1,
				motivations: [
					{
						type: 'power',
						description: 'Seeks control',
						isKnown: true,
						timesUsed: 2
					},
					{
						type: 'wealth',
						description: 'Wants riches',
						isKnown: false,
						timesUsed: 0
					},
					{
						type: 'legacy',
						description: 'Cares about image',
						isKnown: true,
						timesUsed: 1
					}
				],
				pitfalls: [
					{ description: 'Hates being mocked', isKnown: true },
					{ description: 'Distrusts outsiders', isKnown: false }
				],
				arguments: [
					{
						id: 'arg-1',
						type: 'motivation',
						tier: 3,
						description: 'Appealed to power',
						motivationType: 'power',
						interestChange: 1,
						patienceChange: 0,
						createdAt: new Date()
					}
				],
				outcome: 'major_favor',
				createdAt: new Date(),
				updatedAt: new Date(),
				completedAt: new Date()
			};

			const createdEntity: BaseEntity = {
				id: 'event-complex',
				type: 'narrative_event',
				name: 'Complex Negotiation',
				description: 'Multi-faceted discussion',
				tags: [],
				fields: {
					eventType: 'negotiation',
					sourceId: 'negotiation-complex',
					outcome: 'major_favor'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.create).mockResolvedValue(createdEntity);

			const result = await createFromNegotiation(negotiation);

			expect(result).toBeDefined();
			expect(result.fields.eventType).toBe('negotiation');
		});
	});
});
