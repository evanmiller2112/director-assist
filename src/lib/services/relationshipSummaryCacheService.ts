import { relationshipSummaryCacheRepository } from '$lib/db/repositories/relationshipSummaryCacheRepository';
import {
	generateRelationshipSummary,
	type RelationshipSummaryContext,
	type RelationshipSummaryResult
} from './relationshipSummaryService';
import type {
	RelationshipSummaryCache,
	CacheStatus,
	RelationshipSummaryCacheStats,
	BaseEntity,
	EntityLink,
	EntityId
} from '$lib/types';

/**
 * Result from getting or generating a cached relationship summary.
 * Extends the base result with cache metadata.
 */
export interface CachedRelationshipSummaryResult extends RelationshipSummaryResult {
	/**
	 * Whether this result came from cache (true) or was newly generated (false)
	 */
	fromCache: boolean;

	/**
	 * When the summary was generated (for both cached and new summaries)
	 */
	generatedAt?: Date;

	/**
	 * The cache key for this relationship summary
	 */
	cacheKey?: string;
}

/**
 * Service for managing relationship summary caching.
 *
 * Provides intelligent caching of AI-generated relationship summaries to:
 * - Reduce API calls and costs
 * - Improve response times for repeated requests
 * - Automatically invalidate stale caches when entities are updated
 * - Support force regeneration when needed
 */
export const relationshipSummaryCacheService = {
	/**
	 * Get a relationship summary from cache or generate a new one.
	 *
	 * Flow:
	 * 1. Check if valid cache exists (matching entity timestamps)
	 * 2. If valid cache found, return it immediately
	 * 3. If no cache or stale cache, generate new summary via AI
	 * 4. Store newly generated summary in cache
	 * 5. Return result with cache metadata
	 *
	 * @param sourceEntity - Source entity
	 * @param targetEntity - Target entity
	 * @param relationship - Relationship link
	 * @param context - Optional campaign context
	 * @param forceRegenerate - If true, bypass cache and regenerate
	 * @returns Relationship summary result with cache metadata
	 */
	async getOrGenerate(
		sourceEntity: BaseEntity,
		targetEntity: BaseEntity,
		relationship: EntityLink,
		context?: RelationshipSummaryContext,
		forceRegenerate = false
	): Promise<CachedRelationshipSummaryResult> {
		const cacheKey = relationshipSummaryCacheRepository.getCacheKey(
			sourceEntity.id,
			targetEntity.id,
			relationship.relationship
		);

		// Check cache if not forcing regeneration
		if (!forceRegenerate) {
			try {
				const cached = await relationshipSummaryCacheRepository.get(
					sourceEntity.id,
					targetEntity.id,
					relationship.relationship
				);

				// If cache exists, validate it
				if (cached) {
					const isValid = relationshipSummaryCacheRepository.isValid(
						cached,
						sourceEntity,
						targetEntity
					);

					if (isValid) {
						// Return cached summary
						return {
							success: true,
							summary: cached.summary,
							fromCache: true,
							generatedAt: cached.generatedAt,
							cacheKey: cached.id
						};
					}
				}
			} catch (error) {
				// If cache read fails, fall through to generation
				console.warn('Cache read error, falling back to generation:', error);
			}
		}

		// Generate new summary
		const result = await generateRelationshipSummary(
			sourceEntity,
			targetEntity,
			relationship,
			context
		);

		// If generation failed, return error result
		if (!result.success) {
			return {
				...result,
				fromCache: false
			};
		}

		// Store in cache
		const now = new Date();
		const cacheEntry: RelationshipSummaryCache = {
			id: cacheKey,
			sourceId: sourceEntity.id,
			targetId: targetEntity.id,
			relationship: relationship.relationship,
			summary: result.summary!,
			generatedAt: now,
			sourceEntityUpdatedAt: sourceEntity.updatedAt,
			targetEntityUpdatedAt: targetEntity.updatedAt
		};

		try {
			await relationshipSummaryCacheRepository.set(cacheEntry);
		} catch (error) {
			// If cache write fails, still return the generated result
			console.warn('Failed to cache relationship summary:', error);
		}

		return {
			success: true,
			summary: result.summary,
			fromCache: false,
			generatedAt: now,
			cacheKey
		};
	},

	/**
	 * Invalidate a specific cached relationship summary.
	 *
	 * @param sourceId - Source entity ID
	 * @param targetId - Target entity ID
	 * @param relationship - Relationship type
	 */
	async invalidate(sourceId: EntityId, targetId: EntityId, relationship: string): Promise<void> {
		await relationshipSummaryCacheRepository.delete(sourceId, targetId, relationship);
	},

	/**
	 * Invalidate all cached summaries for a specific entity.
	 * Useful when an entity is updated or deleted.
	 *
	 * @param entityId - Entity ID to invalidate caches for
	 * @returns Number of cache entries invalidated
	 */
	async invalidateByEntity(entityId: EntityId): Promise<number> {
		return await relationshipSummaryCacheRepository.deleteByEntityId(entityId);
	},

	/**
	 * Check if a valid cache exists for a relationship.
	 *
	 * @param sourceEntity - Source entity
	 * @param targetEntity - Target entity
	 * @param relationship - Relationship type
	 * @returns True if valid cache exists, false otherwise
	 */
	async hasValidCache(
		sourceEntity: BaseEntity,
		targetEntity: BaseEntity,
		relationship: string
	): Promise<boolean> {
		const cached = await relationshipSummaryCacheRepository.get(
			sourceEntity.id,
			targetEntity.id,
			relationship
		);

		if (!cached) {
			return false;
		}

		return relationshipSummaryCacheRepository.isValid(cached, sourceEntity, targetEntity);
	},

	/**
	 * Get the cache status for a relationship.
	 *
	 * @param sourceId - Source entity ID
	 * @param targetId - Target entity ID
	 * @param relationship - Relationship type
	 * @param sourceUpdatedAt - Current source entity updatedAt timestamp
	 * @param targetUpdatedAt - Current target entity updatedAt timestamp
	 * @returns Cache status: 'valid', 'stale', or 'missing'
	 */
	async getCacheStatus(
		sourceId: EntityId,
		targetId: EntityId,
		relationship: string,
		sourceUpdatedAt: Date,
		targetUpdatedAt: Date
	): Promise<CacheStatus> {
		const cached = await relationshipSummaryCacheRepository.get(
			sourceId,
			targetId,
			relationship
		);

		if (!cached) {
			return 'missing';
		}

		const isValid = relationshipSummaryCacheRepository.isValid(
			cached,
			{ updatedAt: sourceUpdatedAt },
			{ updatedAt: targetUpdatedAt }
		);

		return isValid ? 'valid' : 'stale';
	},

	/**
	 * Get statistics about the relationship summary cache.
	 *
	 * @returns Cache statistics
	 */
	async getStats(): Promise<RelationshipSummaryCacheStats> {
		const allCaches = await relationshipSummaryCacheRepository.getAll();

		if (allCaches.length === 0) {
			return {
				totalCount: 0,
				uniqueSourceCount: 0,
				uniqueTargetCount: 0,
				averageAgeMs: 0,
				oldestEntry: undefined,
				newestEntry: undefined
			};
		}

		// Count unique sources and targets
		const uniqueSources = new Set(allCaches.map((c) => c.sourceId));
		const uniqueTargets = new Set(allCaches.map((c) => c.targetId));

		// Calculate age statistics
		const now = new Date().getTime();
		const ages = allCaches.map((c) => now - c.generatedAt.getTime());
		const averageAgeMs = ages.reduce((sum, age) => sum + age, 0) / ages.length;

		// Find oldest and newest entries
		const sortedByDate = [...allCaches].sort(
			(a, b) => a.generatedAt.getTime() - b.generatedAt.getTime()
		);
		const oldestEntry = sortedByDate[0]?.generatedAt;
		const newestEntry = sortedByDate[sortedByDate.length - 1]?.generatedAt;

		return {
			totalCount: allCaches.length,
			uniqueSourceCount: uniqueSources.size,
			uniqueTargetCount: uniqueTargets.size,
			averageAgeMs,
			oldestEntry,
			newestEntry
		};
	},

	/**
	 * Clear all cached relationship summaries.
	 */
	async clearAll(): Promise<void> {
		await relationshipSummaryCacheRepository.clearAll();
	}
};
