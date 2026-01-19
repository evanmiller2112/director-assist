import type { EntityId } from './entities';

/**
 * Relationship Summary Cache Entry
 *
 * Stores AI-generated summaries for entity relationships to avoid repeated API calls.
 * Cache entries are invalidated when either source or target entity is updated.
 */
export interface RelationshipSummaryCache {
	/**
	 * Composite ID: `${sourceId}-${targetId}-${relationship}`
	 * Ensures unique cache entry per relationship direction
	 */
	id: string;

	/**
	 * Source entity ID (entity from which the relationship originates)
	 */
	sourceId: EntityId;

	/**
	 * Target entity ID (entity to which the relationship points)
	 */
	targetId: EntityId;

	/**
	 * Relationship type (e.g., 'member_of', 'ally_of', 'enemy_of')
	 */
	relationship: string;

	/**
	 * The generated AI summary describing the relationship
	 */
	summary: string;

	/**
	 * When this summary was generated
	 */
	generatedAt: Date;

	/**
	 * updatedAt timestamp of source entity when summary was generated
	 * Used for cache invalidation detection
	 */
	sourceEntityUpdatedAt: Date;

	/**
	 * updatedAt timestamp of target entity when summary was generated
	 * Used for cache invalidation detection
	 */
	targetEntityUpdatedAt: Date;
}

/**
 * Cache status for a relationship summary
 */
export type CacheStatus = 'valid' | 'stale' | 'missing';

/**
 * Statistics about the relationship summary cache
 */
export interface RelationshipSummaryCacheStats {
	/**
	 * Total number of cached summaries
	 */
	totalCount: number;

	/**
	 * Number of unique source entities with cached summaries
	 */
	uniqueSourceCount: number;

	/**
	 * Number of unique target entities with cached summaries
	 */
	uniqueTargetCount: number;

	/**
	 * Average age of cache entries in milliseconds
	 */
	averageAgeMs: number;

	/**
	 * Oldest cache entry timestamp
	 */
	oldestEntry?: Date;

	/**
	 * Newest cache entry timestamp
	 */
	newestEntry?: Date;
}
