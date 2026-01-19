/**
 * Tests for Relationship Summary Cache Service
 *
 * This service provides a high-level API for caching AI-generated relationship summaries.
 * It orchestrates the cache repository and relationship summary generation service,
 * implementing intelligent cache invalidation and cache-or-generate logic.
 *
 * Covers:
 * - Cache hit scenarios (return cached summary, no API call)
 * - Cache miss scenarios (generate new summary, store in cache)
 * - Cache invalidation (stale detection based on entity updates)
 * - Force regeneration (bypass cache, update cache)
 * - Invalidation operations (specific entry, all for entity)
 * - Cache status checking (valid, stale, missing)
 * - Statistics and monitoring
 * - Error handling (API failures, database errors)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
	relationshipSummaryCacheService,
	type CachedRelationshipSummaryResult
} from './relationshipSummaryCacheService';
import { relationshipSummaryCacheRepository } from '$lib/db/repositories/relationshipSummaryCacheRepository';
import { generateRelationshipSummary } from './relationshipSummaryService';
import { db } from '$lib/db';
import type { BaseEntity, EntityLink, RelationshipSummaryCache } from '$lib/types';

// Mock the relationship summary service
vi.mock('./relationshipSummaryService', () => ({
	generateRelationshipSummary: vi.fn()
}));

// Mock the model service (required by relationshipSummaryService)
vi.mock('./modelService', () => ({
	getSelectedModel: vi.fn().mockReturnValue('claude-3-5-sonnet-20241022')
}));

describe('RelationshipSummaryCacheService', () => {
	// Mock entities
	const mockSourceEntity: BaseEntity = {
		id: 'source-1',
		type: 'npc',
		name: 'Aldric the Brave',
		description: 'A noble knight',
		summary: 'A knight serving the crown',
		tags: ['knight'],
		fields: { role: 'Knight Commander' },
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01T10:00:00Z'),
		updatedAt: new Date('2024-01-10T10:00:00Z'),
		metadata: {}
	};

	const mockTargetEntity: BaseEntity = {
		id: 'target-1',
		type: 'faction',
		name: 'Order of the Silver Dawn',
		description: 'A religious order',
		summary: 'A religious order fighting evil',
		tags: ['religious'],
		fields: { alignment: 'lawful good' },
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01T10:00:00Z'),
		updatedAt: new Date('2024-01-12T10:00:00Z'),
		metadata: {}
	};

	const mockRelationship: EntityLink = {
		id: 'link-1',
		sourceId: 'source-1',
		targetId: 'target-1',
		targetType: 'faction',
		relationship: 'member_of',
		bidirectional: false,
		strength: 'strong',
		notes: 'Sworn in 5 years ago'
	};

	beforeAll(async () => {
		// Open database
		await db.open();
	});

	afterAll(async () => {
		// Close database
		await db.close();
	});

	beforeEach(async () => {
		// Clear cache before each test
		await db.relationshipSummaryCache.clear();

		// Reset mocks
		vi.clearAllMocks();

		// Setup default mock for API key
		global.localStorage = {
			getItem: vi.fn((key: string) => {
				if (key === 'dm-assist-api-key') return 'test-api-key';
				return null;
			}),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			length: 0,
			key: vi.fn()
		};

		// Default successful generation mock
		vi.mocked(generateRelationshipSummary).mockResolvedValue({
			success: true,
			summary: 'A detailed AI-generated relationship summary.'
		});
	});

	afterEach(async () => {
		// Clean up
		await db.relationshipSummaryCache.clear();
		// Restore all mocks and spies to prevent interference between tests
		vi.restoreAllMocks();
	});

	describe('getOrGenerate - Cache Hit', () => {
		it('should return cached summary when valid cache exists', async () => {
			// Setup valid cache entry
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Cached summary from previous generation',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.success).toBe(true);
			expect(result.fromCache).toBe(true);
			expect(result.summary).toBe('Cached summary from previous generation');
			expect(result.generatedAt).toEqual(cache.generatedAt);
			expect(generateRelationshipSummary).not.toHaveBeenCalled();
		});

		it('should include cache key in result when returning cached summary', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Cached summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.cacheKey).toBeDefined();
			expect(result.cacheKey).toBe(cache.id);
		});

		it('should not make API call when valid cache exists', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Cached summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(generateRelationshipSummary).not.toHaveBeenCalled();
		});

		it('should handle multiple cache hits efficiently', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Cached summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			// Request same summary multiple times
			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);
			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);
			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			// Should never call API
			expect(generateRelationshipSummary).not.toHaveBeenCalled();
		});
	});

	describe('getOrGenerate - Cache Miss', () => {
		it('should generate new summary when no cache exists', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Newly generated summary'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.success).toBe(true);
			expect(result.fromCache).toBe(false);
			expect(result.summary).toBe('Newly generated summary');
			expect(generateRelationshipSummary).toHaveBeenCalledOnce();
		});

		it('should store generated summary in cache', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Newly generated summary'
			});

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			const cached = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(cached).toBeDefined();
			expect(cached?.summary).toBe('Newly generated summary');
			expect(cached?.sourceEntityUpdatedAt).toEqual(mockSourceEntity.updatedAt);
			expect(cached?.targetEntityUpdatedAt).toEqual(mockTargetEntity.updatedAt);
		});

		it('should pass relationship context to generation service', async () => {
			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(generateRelationshipSummary).toHaveBeenCalledWith(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship,
				undefined
			);
		});

		it('should pass campaign context to generation service when provided', async () => {
			const campaignContext = {
				campaignName: 'Test Campaign',
				campaignSetting: 'Fantasy',
				campaignSystem: 'Draw Steel'
			};

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship,
				campaignContext
			);

			expect(generateRelationshipSummary).toHaveBeenCalledWith(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship,
				campaignContext
			);
		});

		it('should set generatedAt timestamp on new cache entry', async () => {
			const beforeGenerate = new Date();

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			const afterGenerate = new Date();

			const cached = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(cached?.generatedAt).toBeDefined();
			expect(cached!.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeGenerate.getTime());
			expect(cached!.generatedAt.getTime()).toBeLessThanOrEqual(afterGenerate.getTime());
		});
	});

	describe('getOrGenerate - Stale Cache Detection', () => {
		it('should regenerate when source entity was updated after cache creation', async () => {
			// Create cache with old source timestamp
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Old cached summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-05T10:00:00Z'), // Older than entity
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Regenerated summary'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.fromCache).toBe(false);
			expect(result.summary).toBe('Regenerated summary');
			expect(generateRelationshipSummary).toHaveBeenCalledOnce();
		});

		it('should regenerate when target entity was updated after cache creation', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Old cached summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: new Date('2024-01-05T10:00:00Z') // Older than entity
			};

			await relationshipSummaryCacheRepository.set(cache);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Regenerated summary'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.fromCache).toBe(false);
			expect(result.summary).toBe('Regenerated summary');
			expect(generateRelationshipSummary).toHaveBeenCalledOnce();
		});

		it('should update cache with new timestamps after regeneration', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Old cached summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-05T10:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-05T10:00:00Z')
			};

			await relationshipSummaryCacheRepository.set(cache);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Regenerated summary'
			});

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			const updated = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(updated?.sourceEntityUpdatedAt).toEqual(mockSourceEntity.updatedAt);
			expect(updated?.targetEntityUpdatedAt).toEqual(mockTargetEntity.updatedAt);
			expect(updated?.summary).toBe('Regenerated summary');
		});
	});

	describe('getOrGenerate - Force Regeneration', () => {
		it('should bypass cache when forceRegenerate is true', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Valid cached summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Forced regeneration'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship,
				undefined,
				true // forceRegenerate
			);

			expect(result.fromCache).toBe(false);
			expect(result.summary).toBe('Forced regeneration');
			expect(generateRelationshipSummary).toHaveBeenCalledOnce();
		});

		it('should update cache after forced regeneration', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Old summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Forced new summary'
			});

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship,
				undefined,
				true
			);

			const updated = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(updated?.summary).toBe('Forced new summary');
		});
	});

	describe('invalidate', () => {
		it('should remove specific cache entry', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Cached summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			await relationshipSummaryCacheService.invalidate(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			const retrieved = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(retrieved).toBeUndefined();
		});

		it('should not throw error when invalidating non-existent cache', async () => {
			await expect(
				relationshipSummaryCacheService.invalidate('non-existent-1', 'non-existent-2', 'knows')
			).resolves.not.toThrow();
		});

		it('should only invalidate specified relationship, leaving others intact', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					'member_of'
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: 'member_of',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					'ally_of'
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			await relationshipSummaryCacheService.invalidate(
				mockSourceEntity.id,
				mockTargetEntity.id,
				'member_of'
			);

			const invalidated = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				'member_of'
			);
			const remaining = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				'ally_of'
			);

			expect(invalidated).toBeUndefined();
			expect(remaining).toBeDefined();
		});
	});

	describe('invalidateByEntity', () => {
		it('should invalidate all caches where entity is source', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-1', 'entity-2', 'knows'),
				sourceId: 'entity-1',
				targetId: 'entity-2',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-1', 'entity-3', 'ally_of'),
				sourceId: 'entity-1',
				targetId: 'entity-3',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache3: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-2', 'entity-3', 'knows'),
				sourceId: 'entity-2',
				targetId: 'entity-3',
				relationship: 'knows',
				summary: 'Summary 3',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);
			await relationshipSummaryCacheRepository.set(cache3);

			const deletedCount = await relationshipSummaryCacheService.invalidateByEntity('entity-1');

			expect(deletedCount).toBe(2);

			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(1);
		});

		it('should invalidate all caches where entity is target', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-1', 'entity-2', 'knows'),
				sourceId: 'entity-1',
				targetId: 'entity-2',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-3', 'entity-2', 'ally_of'),
				sourceId: 'entity-3',
				targetId: 'entity-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			const deletedCount = await relationshipSummaryCacheService.invalidateByEntity('entity-2');

			expect(deletedCount).toBe(2);
		});

		it('should return 0 when no caches exist for entity', async () => {
			const deletedCount = await relationshipSummaryCacheService.invalidateByEntity(
				'non-existent'
			);
			expect(deletedCount).toBe(0);
		});
	});

	describe('hasValidCache', () => {
		it('should return true when valid cache exists', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Valid cache',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const hasValid = await relationshipSummaryCacheService.hasValidCache(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship.relationship
			);

			expect(hasValid).toBe(true);
		});

		it('should return false when no cache exists', async () => {
			const hasValid = await relationshipSummaryCacheService.hasValidCache(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship.relationship
			);

			expect(hasValid).toBe(false);
		});

		it('should return false when cache is stale', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Stale cache',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-05T10:00:00Z'), // Older than entity
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const hasValid = await relationshipSummaryCacheService.hasValidCache(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship.relationship
			);

			expect(hasValid).toBe(false);
		});
	});

	describe('getCacheStatus', () => {
		it('should return "valid" when cache is current', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Valid cache',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const status = await relationshipSummaryCacheService.getCacheStatus(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship,
				mockSourceEntity.updatedAt,
				mockTargetEntity.updatedAt
			);

			expect(status).toBe('valid');
		});

		it('should return "stale" when source entity was updated', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Stale cache',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-05T10:00:00Z'),
				targetEntityUpdatedAt: mockTargetEntity.updatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);

			const status = await relationshipSummaryCacheService.getCacheStatus(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship,
				mockSourceEntity.updatedAt,
				mockTargetEntity.updatedAt
			);

			expect(status).toBe('stale');
		});

		it('should return "stale" when target entity was updated', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(
					mockSourceEntity.id,
					mockTargetEntity.id,
					mockRelationship.relationship
				),
				sourceId: mockSourceEntity.id,
				targetId: mockTargetEntity.id,
				relationship: mockRelationship.relationship,
				summary: 'Stale cache',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: mockSourceEntity.updatedAt,
				targetEntityUpdatedAt: new Date('2024-01-05T10:00:00Z')
			};

			await relationshipSummaryCacheRepository.set(cache);

			const status = await relationshipSummaryCacheService.getCacheStatus(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship,
				mockSourceEntity.updatedAt,
				mockTargetEntity.updatedAt
			);

			expect(status).toBe('stale');
		});

		it('should return "missing" when no cache exists', async () => {
			const status = await relationshipSummaryCacheService.getCacheStatus(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship,
				mockSourceEntity.updatedAt,
				mockTargetEntity.updatedAt
			);

			expect(status).toBe('missing');
		});
	});

	describe('getStats', () => {
		it('should return zero stats when cache is empty', async () => {
			const stats = await relationshipSummaryCacheService.getStats();

			expect(stats.totalCount).toBe(0);
			expect(stats.uniqueSourceCount).toBe(0);
			expect(stats.uniqueTargetCount).toBe(0);
			expect(stats.averageAgeMs).toBe(0);
			expect(stats.oldestEntry).toBeUndefined();
			expect(stats.newestEntry).toBeUndefined();
		});

		it('should count total cache entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-2', 'ally_of'),
				sourceId: 'source-1',
				targetId: 'target-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			const stats = await relationshipSummaryCacheService.getStats();

			expect(stats.totalCount).toBe(2);
		});

		it('should count unique source entities', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-2', 'ally_of'),
				sourceId: 'source-1',
				targetId: 'target-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache3: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-2', 'target-1', 'knows'),
				sourceId: 'source-2',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 3',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);
			await relationshipSummaryCacheRepository.set(cache3);

			const stats = await relationshipSummaryCacheService.getStats();

			expect(stats.uniqueSourceCount).toBe(2);
		});

		it('should count unique target entities', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-2', 'target-1', 'ally_of'),
				sourceId: 'source-2',
				targetId: 'target-1',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache3: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-2', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-2',
				relationship: 'knows',
				summary: 'Summary 3',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);
			await relationshipSummaryCacheRepository.set(cache3);

			const stats = await relationshipSummaryCacheService.getStats();

			expect(stats.uniqueTargetCount).toBe(2);
		});

		it('should calculate average age of cache entries', async () => {
			const now = new Date();
			const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
			const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: oneHourAgo,
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-2', 'target-2', 'ally_of'),
				sourceId: 'source-2',
				targetId: 'target-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: twoHoursAgo,
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			const stats = await relationshipSummaryCacheService.getStats();

			// Average should be around 1.5 hours (90 minutes)
			expect(stats.averageAgeMs).toBeGreaterThan(60 * 60 * 1000); // > 1 hour
			expect(stats.averageAgeMs).toBeLessThan(2 * 60 * 60 * 1000); // < 2 hours
		});

		it('should identify oldest and newest entries', async () => {
			const oldest = new Date('2024-01-10T10:00:00Z');
			const middle = new Date('2024-01-15T10:00:00Z');
			const newest = new Date('2024-01-20T10:00:00Z');

			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: middle,
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-2', 'target-2', 'ally_of'),
				sourceId: 'source-2',
				targetId: 'target-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: oldest,
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache3: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-3', 'target-3', 'knows'),
				sourceId: 'source-3',
				targetId: 'target-3',
				relationship: 'knows',
				summary: 'Summary 3',
				generatedAt: newest,
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);
			await relationshipSummaryCacheRepository.set(cache3);

			const stats = await relationshipSummaryCacheService.getStats();

			expect(stats.oldestEntry).toEqual(oldest);
			expect(stats.newestEntry).toEqual(newest);
		});
	});

	describe('clearAll', () => {
		it('should remove all cache entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'knows'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'knows',
				summary: 'Summary 1',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-2', 'target-2', 'ally_of'),
				sourceId: 'source-2',
				targetId: 'target-2',
				relationship: 'ally_of',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			await relationshipSummaryCacheService.clearAll();

			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(0);
		});

		it('should not throw error when clearing empty cache', async () => {
			await expect(relationshipSummaryCacheService.clearAll()).resolves.not.toThrow();
		});
	});

	describe('Error Handling', () => {
		it('should return error when generation service fails', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: false,
				error: 'API request failed'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe('API request failed');
			expect(result.fromCache).toBe(false);
		});

		it('should not cache failed generation attempts', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: false,
				error: 'API request failed'
			});

			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			const cached = await relationshipSummaryCacheRepository.get(
				mockSourceEntity.id,
				mockTargetEntity.id,
				mockRelationship.relationship
			);

			expect(cached).toBeUndefined();
		});

		it('should handle API key not configured error', async () => {
			global.localStorage.getItem = vi.fn(() => null);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: false,
				error: 'API key not configured'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('API key');
		});

		it('should handle database errors gracefully during cache read', async () => {
			// Mock database error
			vi.spyOn(relationshipSummaryCacheRepository, 'get').mockRejectedValue(
				new Error('Database error')
			);

			// Should fall back to generation
			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			// Should attempt generation rather than crashing
			expect(generateRelationshipSummary).toHaveBeenCalled();
		});

		it('should handle database errors gracefully during cache write', async () => {
			vi.spyOn(relationshipSummaryCacheRepository, 'set').mockRejectedValue(
				new Error('Database error')
			);

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Generated summary'
			});

			const result = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			// Should still return generated result even if caching fails
			expect(result.success).toBe(true);
			expect(result.summary).toBe('Generated summary');
		});

		it('should handle missing entity updatedAt timestamps', async () => {
			const entityWithoutTimestamp = {
				...mockSourceEntity,
				updatedAt: undefined as any
			};

			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Generated summary'
			});

			// Should handle gracefully and generate new summary
			const result = await relationshipSummaryCacheService.getOrGenerate(
				entityWithoutTimestamp,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.success).toBe(true);
		});
	});

	describe('Integration Scenarios', () => {
		it('should use cache for repeated requests within same session', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Generated once'
			});

			// First request - should generate
			const result1 = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result1.fromCache).toBe(false);
			expect(generateRelationshipSummary).toHaveBeenCalledTimes(1);

			// Second request - should use cache
			const result2 = await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result2.fromCache).toBe(true);
			expect(generateRelationshipSummary).toHaveBeenCalledTimes(1); // Still only 1 call
		});

		it('should regenerate after entity update invalidates cache', async () => {
			vi.mocked(generateRelationshipSummary)
				.mockResolvedValueOnce({
					success: true,
					summary: 'First generation'
				})
				.mockResolvedValueOnce({
					success: true,
					summary: 'Second generation after update'
				});

			// First generation
			await relationshipSummaryCacheService.getOrGenerate(
				mockSourceEntity,
				mockTargetEntity,
				mockRelationship
			);

			// Simulate entity update
			const updatedEntity = {
				...mockSourceEntity,
				updatedAt: new Date('2024-01-20T10:00:00Z')
			};

			// Should detect stale cache and regenerate
			const result = await relationshipSummaryCacheService.getOrGenerate(
				updatedEntity,
				mockTargetEntity,
				mockRelationship
			);

			expect(result.fromCache).toBe(false);
			expect(result.summary).toBe('Second generation after update');
			expect(generateRelationshipSummary).toHaveBeenCalledTimes(2);
		});

		it('should handle concurrent requests for different relationships', async () => {
			vi.mocked(generateRelationshipSummary).mockResolvedValue({
				success: true,
				summary: 'Generated summary'
			});

			const relationship1 = { ...mockRelationship, relationship: 'member_of' };
			const relationship2 = { ...mockRelationship, relationship: 'ally_of' };
			const relationship3 = { ...mockRelationship, relationship: 'knows' };

			// Concurrent requests
			const [result1, result2, result3] = await Promise.all([
				relationshipSummaryCacheService.getOrGenerate(
					mockSourceEntity,
					mockTargetEntity,
					relationship1
				),
				relationshipSummaryCacheService.getOrGenerate(
					mockSourceEntity,
					mockTargetEntity,
					relationship2
				),
				relationshipSummaryCacheService.getOrGenerate(
					mockSourceEntity,
					mockTargetEntity,
					relationship3
				)
			]);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			expect(result3.success).toBe(true);

			// All three should be cached separately
			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(3);
		});
	});
});
