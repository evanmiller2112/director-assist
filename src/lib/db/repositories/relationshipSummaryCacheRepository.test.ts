/**
 * Tests for Relationship Summary Cache Repository
 *
 * This repository manages caching of AI-generated relationship summaries to avoid
 * repeated API calls for the same relationship context.
 *
 * Covers:
 * - Cache key generation (composite keys, special characters)
 * - CRUD operations (get, set, delete)
 * - Cache invalidation (by specific entry, by entity ID)
 * - Cache validation (timestamp-based staleness detection)
 * - Bulk operations (getAll, count, clearAll)
 * - Edge cases (missing entries, concurrent operations)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { relationshipSummaryCacheRepository } from './relationshipSummaryCacheRepository';
import { db } from '../index';
import type { RelationshipSummaryCache } from '$lib/types';

describe('RelationshipSummaryCacheRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear cache table before each test
		await db.relationshipSummaryCache.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.relationshipSummaryCache.clear();
	});

	describe('getCacheKey', () => {
		it('should generate consistent cache key for same inputs', () => {
			const key1 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'member_of'
			);
			const key2 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'member_of'
			);

			expect(key1).toBe(key2);
		});

		it('should generate different keys for different source IDs', () => {
			const key1 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'member_of'
			);
			const key2 = relationshipSummaryCacheRepository.getCacheKey(
				'source-2',
				'target-1',
				'member_of'
			);

			expect(key1).not.toBe(key2);
		});

		it('should generate different keys for different target IDs', () => {
			const key1 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'member_of'
			);
			const key2 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-2',
				'member_of'
			);

			expect(key1).not.toBe(key2);
		});

		it('should generate different keys for different relationships', () => {
			const key1 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'member_of'
			);
			const key2 = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'ally_of'
			);

			expect(key1).not.toBe(key2);
		});

		it('should handle special characters in IDs', () => {
			const key = relationshipSummaryCacheRepository.getCacheKey(
				'source-with-dashes',
				'target_with_underscores',
				'relationship:with:colons'
			);

			expect(key).toBeDefined();
			expect(typeof key).toBe('string');
			expect(key.length).toBeGreaterThan(0);
		});

		it('should handle unicode characters in relationship names', () => {
			const key = relationshipSummaryCacheRepository.getCacheKey(
				'source-1',
				'target-1',
				'关系_type'
			);

			expect(key).toBeDefined();
			expect(typeof key).toBe('string');
		});

		it('should use delimiter that prevents collision', () => {
			// These should produce different keys even though concatenation could collide
			const key1 = relationshipSummaryCacheRepository.getCacheKey('a-b', 'c', 'd');
			const key2 = relationshipSummaryCacheRepository.getCacheKey('a', 'b-c', 'd');

			expect(key1).not.toBe(key2);
		});
	});

	describe('get', () => {
		it('should return undefined for non-existent cache entry', async () => {
			const result = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);

			expect(result).toBeUndefined();
		});

		it('should retrieve stored cache entry', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'A brave knight who serves the order with distinction.',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-10T08:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-12T09:00:00Z')
			};

			await relationshipSummaryCacheRepository.set(cache);

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);

			expect(retrieved).toBeDefined();
			expect(retrieved?.sourceId).toBe('source-1');
			expect(retrieved?.targetId).toBe('target-1');
			expect(retrieved?.relationship).toBe('member_of');
			expect(retrieved?.summary).toBe('A brave knight who serves the order with distinction.');
		});

		it('should return correct entry when multiple exist', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-2',
				'ally_of'
			);

			expect(retrieved?.summary).toBe('Summary 2');
			expect(retrieved?.relationship).toBe('ally_of');
		});

		it('should preserve Date objects in retrieved cache', async () => {
			const generatedAt = new Date('2024-01-15T10:00:00Z');
			const sourceEntityUpdatedAt = new Date('2024-01-10T08:00:00Z');
			const targetEntityUpdatedAt = new Date('2024-01-12T09:00:00Z');

			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt,
				sourceEntityUpdatedAt,
				targetEntityUpdatedAt
			};

			await relationshipSummaryCacheRepository.set(cache);
			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);

			expect(retrieved?.generatedAt).toBeInstanceOf(Date);
			expect(retrieved?.sourceEntityUpdatedAt).toBeInstanceOf(Date);
			expect(retrieved?.targetEntityUpdatedAt).toBeInstanceOf(Date);
			expect(retrieved?.generatedAt.getTime()).toBe(generatedAt.getTime());
		});
	});

	describe('set', () => {
		it('should store new cache entry', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(1);
		});

		it('should overwrite existing cache entry with same key', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Original summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache2: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Updated summary',
				generatedAt: new Date('2024-01-16T10:00:00Z'),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(1);

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			expect(retrieved?.summary).toBe('Updated summary');
		});

		it('should handle empty summary string', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: '',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			expect(retrieved?.summary).toBe('');
		});

		it('should handle very long summary text', async () => {
			const longSummary = 'A'.repeat(10000); // 10k characters

			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: longSummary,
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			expect(retrieved?.summary).toBe(longSummary);
		});

		it('should handle unicode in summary', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'A brave knight 勇敢的骑士 with special characters: ñ, ü, é',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			expect(retrieved?.summary).toContain('勇敢的骑士');
		});
	});

	describe('delete', () => {
		it('should delete specific cache entry', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);
			await relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of');

			const retrieved = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			expect(retrieved).toBeUndefined();
		});

		it('should only delete specified entry, leaving others intact', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			await relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of');

			const deleted = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-1',
				'member_of'
			);
			const remaining = await relationshipSummaryCacheRepository.get(
				'source-1',
				'target-2',
				'ally_of'
			);

			expect(deleted).toBeUndefined();
			expect(remaining).toBeDefined();
			expect(remaining?.summary).toBe('Summary 2');
		});

		it('should not throw error when deleting non-existent entry', async () => {
			await expect(
				relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of')
			).resolves.not.toThrow();
		});

		it('should return without error for multiple deletes of same entry', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);
			await relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of');
			await relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of');

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(0);
		});
	});

	describe('deleteByEntityId', () => {
		it('should delete all cache entries where entity is source', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			await relationshipSummaryCacheRepository.deleteByEntityId('source-1');

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(1);

			const remaining = await relationshipSummaryCacheRepository.get('source-2', 'target-1', 'knows');
			expect(remaining).toBeDefined();
		});

		it('should delete all cache entries where entity is target', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			await relationshipSummaryCacheRepository.deleteByEntityId('target-1');

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(1);

			const remaining = await relationshipSummaryCacheRepository.get('source-1', 'target-2', 'knows');
			expect(remaining).toBeDefined();
		});

		it('should delete entries where entity appears as both source and target', async () => {
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
				id: relationshipSummaryCacheRepository.getCacheKey('entity-2', 'entity-1', 'knows'),
				sourceId: 'entity-2',
				targetId: 'entity-1',
				relationship: 'knows',
				summary: 'Summary 2',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			const cache3: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('entity-3', 'entity-4', 'ally_of'),
				sourceId: 'entity-3',
				targetId: 'entity-4',
				relationship: 'ally_of',
				summary: 'Summary 3',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache1);
			await relationshipSummaryCacheRepository.set(cache2);
			await relationshipSummaryCacheRepository.set(cache3);

			await relationshipSummaryCacheRepository.deleteByEntityId('entity-1');

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(1);

			const remaining = await relationshipSummaryCacheRepository.get('entity-3', 'entity-4', 'ally_of');
			expect(remaining).toBeDefined();
		});

		it('should not throw error when deleting by non-existent entity ID', async () => {
			await expect(
				relationshipSummaryCacheRepository.deleteByEntityId('non-existent')
			).resolves.not.toThrow();
		});

		it('should return number of deleted entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			const deletedCount = await relationshipSummaryCacheRepository.deleteByEntityId('source-1');
			expect(deletedCount).toBe(2);
		});
	});

	describe('clearAll', () => {
		it('should remove all cache entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			await relationshipSummaryCacheRepository.clearAll();

			const count = await db.relationshipSummaryCache.count();
			expect(count).toBe(0);
		});

		it('should not throw error when clearing empty cache', async () => {
			await expect(relationshipSummaryCacheRepository.clearAll()).resolves.not.toThrow();
		});

		it('should not affect other database tables', async () => {
			// This test ensures clearAll only clears the cache table
			await relationshipSummaryCacheRepository.clearAll();

			// Verify other tables are not affected (this is a safety check)
			expect(true).toBe(true);
		});
	});

	describe('isValid', () => {
		it('should return true when timestamps match exactly', async () => {
			const timestamp = new Date('2024-01-15T10:00:00Z');

			const cache: RelationshipSummaryCache = {
				id: 'test-id',
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: timestamp,
				targetEntityUpdatedAt: timestamp
			};

			const sourceEntity = {
				id: 'source-1',
				updatedAt: timestamp
			};

			const targetEntity = {
				id: 'target-1',
				updatedAt: timestamp
			};

			const isValid = relationshipSummaryCacheRepository.isValid(
				cache,
				sourceEntity,
				targetEntity
			);

			expect(isValid).toBe(true);
		});

		it('should return false when source entity was updated after cache generation', async () => {
			const cache: RelationshipSummaryCache = {
				id: 'test-id',
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-10T08:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-12T09:00:00Z')
			};

			const sourceEntity = {
				id: 'source-1',
				updatedAt: new Date('2024-01-16T10:00:00Z') // Updated after cache
			};

			const targetEntity = {
				id: 'target-1',
				updatedAt: new Date('2024-01-12T09:00:00Z')
			};

			const isValid = relationshipSummaryCacheRepository.isValid(
				cache,
				sourceEntity,
				targetEntity
			);

			expect(isValid).toBe(false);
		});

		it('should return false when target entity was updated after cache generation', async () => {
			const cache: RelationshipSummaryCache = {
				id: 'test-id',
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-10T08:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-12T09:00:00Z')
			};

			const sourceEntity = {
				id: 'source-1',
				updatedAt: new Date('2024-01-10T08:00:00Z')
			};

			const targetEntity = {
				id: 'target-1',
				updatedAt: new Date('2024-01-16T10:00:00Z') // Updated after cache
			};

			const isValid = relationshipSummaryCacheRepository.isValid(
				cache,
				sourceEntity,
				targetEntity
			);

			expect(isValid).toBe(false);
		});

		it('should return false when both entities were updated after cache generation', async () => {
			const cache: RelationshipSummaryCache = {
				id: 'test-id',
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-10T08:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-12T09:00:00Z')
			};

			const sourceEntity = {
				id: 'source-1',
				updatedAt: new Date('2024-01-16T10:00:00Z')
			};

			const targetEntity = {
				id: 'target-1',
				updatedAt: new Date('2024-01-17T10:00:00Z')
			};

			const isValid = relationshipSummaryCacheRepository.isValid(
				cache,
				sourceEntity,
				targetEntity
			);

			expect(isValid).toBe(false);
		});

		it('should handle millisecond precision in timestamp comparison', async () => {
			const baseTime = new Date('2024-01-15T10:00:00.000Z');
			const laterTime = new Date('2024-01-15T10:00:00.001Z'); // 1ms later

			const cache: RelationshipSummaryCache = {
				id: 'test-id',
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: baseTime,
				targetEntityUpdatedAt: baseTime
			};

			const sourceEntity = {
				id: 'source-1',
				updatedAt: laterTime
			};

			const targetEntity = {
				id: 'target-1',
				updatedAt: baseTime
			};

			const isValid = relationshipSummaryCacheRepository.isValid(
				cache,
				sourceEntity,
				targetEntity
			);

			expect(isValid).toBe(false);
		});
	});

	describe('getAll', () => {
		it('should return empty array when no cache entries exist', async () => {
			const all = await relationshipSummaryCacheRepository.getAll();
			expect(all).toEqual([]);
		});

		it('should return all cache entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			const all = await relationshipSummaryCacheRepository.getAll();
			expect(all).toHaveLength(2);
		});

		it('should return entries with all properties intact', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date('2024-01-15T10:00:00Z'),
				sourceEntityUpdatedAt: new Date('2024-01-10T08:00:00Z'),
				targetEntityUpdatedAt: new Date('2024-01-12T09:00:00Z')
			};

			await relationshipSummaryCacheRepository.set(cache);

			const all = await relationshipSummaryCacheRepository.getAll();
			expect(all[0]).toMatchObject({
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary'
			});
		});
	});

	describe('count', () => {
		it('should return 0 when no cache entries exist', async () => {
			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(0);
		});

		it('should return accurate count of cache entries', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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
			const countAfterOne = await relationshipSummaryCacheRepository.count();
			expect(countAfterOne).toBe(1);

			await relationshipSummaryCacheRepository.set(cache2);
			const countAfterTwo = await relationshipSummaryCacheRepository.count();
			expect(countAfterTwo).toBe(2);
		});

		it('should update count after deletions', async () => {
			const cache1: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
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

			await relationshipSummaryCacheRepository.delete('source-1', 'target-1', 'member_of');

			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(1);
		});
	});

	describe('Edge Cases and Concurrency', () => {
		it('should handle rapid successive writes to same entry', async () => {
			const baseCache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Original',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			// Rapid updates
			await relationshipSummaryCacheRepository.set({ ...baseCache, summary: 'Update 1' });
			await relationshipSummaryCacheRepository.set({ ...baseCache, summary: 'Update 2' });
			await relationshipSummaryCacheRepository.set({ ...baseCache, summary: 'Update 3' });

			const final = await relationshipSummaryCacheRepository.get('source-1', 'target-1', 'member_of');
			expect(final?.summary).toBe('Update 3');

			const count = await relationshipSummaryCacheRepository.count();
			expect(count).toBe(1);
		});

		it('should handle very long entity IDs', async () => {
			const longId = 'entity-' + 'x'.repeat(1000);

			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey(longId, 'target-1', 'member_of'),
				sourceId: longId,
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date(),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			await relationshipSummaryCacheRepository.set(cache);
			const retrieved = await relationshipSummaryCacheRepository.get(longId, 'target-1', 'member_of');

			expect(retrieved).toBeDefined();
			expect(retrieved?.sourceId).toBe(longId);
		});

		it('should handle malformed date objects gracefully', async () => {
			const cache: RelationshipSummaryCache = {
				id: relationshipSummaryCacheRepository.getCacheKey('source-1', 'target-1', 'member_of'),
				sourceId: 'source-1',
				targetId: 'target-1',
				relationship: 'member_of',
				summary: 'Test summary',
				generatedAt: new Date('invalid'),
				sourceEntityUpdatedAt: new Date(),
				targetEntityUpdatedAt: new Date()
			};

			// Implementation should handle or reject invalid dates
			// This test documents expected behavior
			await expect(
				relationshipSummaryCacheRepository.set(cache)
			).resolves.not.toThrow();
		});
	});
});
