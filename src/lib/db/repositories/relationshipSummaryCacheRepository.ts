import { db } from '../index';
import type { RelationshipSummaryCache } from '$lib/types';
import type { EntityId } from '$lib/types';

/**
 * Repository for managing relationship summary cache entries.
 *
 * Handles:
 * - CRUD operations for cache entries
 * - Cache key generation and validation
 * - Cache invalidation by entity ID
 * - Timestamp-based staleness detection
 */
export const relationshipSummaryCacheRepository = {
	/**
	 * Generate a consistent composite cache key from relationship components.
	 *
	 * Format: `${sourceId}|||${targetId}|||${relationship}`
	 * Uses `|||` delimiter to prevent collision issues.
	 *
	 * @param sourceId - Source entity ID
	 * @param targetId - Target entity ID
	 * @param relationship - Relationship type
	 * @returns Composite cache key
	 */
	getCacheKey(sourceId: EntityId, targetId: EntityId, relationship: string): string {
		return `${sourceId}|||${targetId}|||${relationship}`;
	},

	/**
	 * Retrieve a cached relationship summary.
	 *
	 * @param sourceId - Source entity ID
	 * @param targetId - Target entity ID
	 * @param relationship - Relationship type
	 * @returns Cached summary or undefined if not found
	 */
	async get(
		sourceId: EntityId,
		targetId: EntityId,
		relationship: string
	): Promise<RelationshipSummaryCache | undefined> {
		const key = this.getCacheKey(sourceId, targetId, relationship);
		return await db.relationshipSummaryCache.get(key);
	},

	/**
	 * Store or update a cache entry.
	 *
	 * @param cache - Cache entry to store
	 */
	async set(cache: RelationshipSummaryCache): Promise<void> {
		await db.relationshipSummaryCache.put(cache);
	},

	/**
	 * Delete a specific cache entry.
	 *
	 * @param sourceId - Source entity ID
	 * @param targetId - Target entity ID
	 * @param relationship - Relationship type
	 */
	async delete(sourceId: EntityId, targetId: EntityId, relationship: string): Promise<void> {
		const key = this.getCacheKey(sourceId, targetId, relationship);
		await db.relationshipSummaryCache.delete(key);
	},

	/**
	 * Delete all cache entries where the specified entity appears as source or target.
	 *
	 * @param entityId - Entity ID to invalidate caches for
	 * @returns Number of cache entries deleted
	 */
	async deleteByEntityId(entityId: EntityId): Promise<number> {
		// Find all caches where entity is source or target
		const cachesToDelete = await db.relationshipSummaryCache
			.where('sourceId')
			.equals(entityId)
			.or('targetId')
			.equals(entityId)
			.toArray();

		// Delete each cache entry
		const deletePromises = cachesToDelete.map((cache) =>
			db.relationshipSummaryCache.delete(cache.id)
		);
		await Promise.all(deletePromises);

		return cachesToDelete.length;
	},

	/**
	 * Clear all cache entries.
	 */
	async clearAll(): Promise<void> {
		await db.relationshipSummaryCache.clear();
	},

	/**
	 * Check if a cache entry is still valid based on entity timestamps.
	 *
	 * A cache is valid if both entities' current updatedAt timestamps match
	 * the timestamps stored in the cache entry.
	 *
	 * @param cache - Cache entry to validate
	 * @param sourceEntity - Current source entity (must have updatedAt)
	 * @param targetEntity - Current target entity (must have updatedAt)
	 * @returns True if cache is valid, false if stale
	 */
	isValid(
		cache: RelationshipSummaryCache,
		sourceEntity: { updatedAt: Date },
		targetEntity: { updatedAt: Date }
	): boolean {
		// Compare timestamps - cache is valid only if both timestamps match exactly
		const sourceMatch =
			cache.sourceEntityUpdatedAt.getTime() === sourceEntity.updatedAt.getTime();
		const targetMatch =
			cache.targetEntityUpdatedAt.getTime() === targetEntity.updatedAt.getTime();

		return sourceMatch && targetMatch;
	},

	/**
	 * Get all cache entries.
	 *
	 * @returns Array of all cache entries
	 */
	async getAll(): Promise<RelationshipSummaryCache[]> {
		return await db.relationshipSummaryCache.toArray();
	},

	/**
	 * Get count of cache entries.
	 *
	 * @returns Total number of cache entries
	 */
	async count(): Promise<number> {
		return await db.relationshipSummaryCache.count();
	}
};
