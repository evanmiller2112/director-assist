/**
 * Respite Activity Tracker Types for Draw Steel RPG
 *
 * This module defines the type system for the Respite Activity Tracker,
 * implementing Draw Steel's respite mechanics:
 * - Respite sessions (24+ hours of downtime in a safe location)
 * - Hero recovery tracking (regain recoveries)
 * - Victory point to XP conversion
 * - Kit swapping
 * - Downtime activities (project, crafting, socializing, training, investigation, other)
 */

// ============================================================================
// Respite Status
// ============================================================================

/**
 * Current status of the respite session.
 * - preparing: Setup phase, selecting heroes and configuring options
 * - active: Respite in progress, activities being tracked
 * - completed: Respite finished, all activities resolved
 */
export type RespiteStatus = 'preparing' | 'active' | 'completed';

// ============================================================================
// Activity Type
// ============================================================================

/**
 * Type of downtime activity during a respite.
 * Draw Steel canonical activity types.
 */
export type RespiteActivityType =
	| 'project'
	| 'crafting'
	| 'socializing'
	| 'training'
	| 'investigation'
	| 'other';

// ============================================================================
// Activity Status
// ============================================================================

/**
 * Status of an individual respite activity.
 * - pending: Not yet started
 * - in_progress: Currently being worked on
 * - completed: Finished with an outcome
 */
export type RespiteActivityStatus = 'pending' | 'in_progress' | 'completed';

// ============================================================================
// Respite Hero
// ============================================================================

/**
 * Hero participating in a respite session.
 * Tracks recovery status and individual hero notes.
 */
export interface RespiteHero {
	id: string;
	name: string;
	heroId?: string;
	recoveries: {
		current: number;
		max: number;
		gained: number;
	};
	conditions?: string[];
	notes?: string;
}

// ============================================================================
// Respite Activity (Deprecated - now managed as entities)
// ============================================================================

/**
 * @deprecated Use the entity system instead.
 * Individual activity undertaken during a respite.
 * Records the type, assignment, status, and outcome of each activity.
 *
 * This interface is deprecated in favor of respite_activity entities.
 * Activities are now created as entities with type 'respite_activity'.
 */
export interface RespiteActivity {
	id: string;
	name: string;
	description?: string;
	type: RespiteActivityType;
	heroId?: string;
	status: RespiteActivityStatus;
	outcome?: string;
	notes?: string;
	createdAt: Date;
}

// ============================================================================
// Kit Swap
// ============================================================================

/**
 * Record of a hero swapping their kit during respite.
 * Tracks which hero changed kits and what they changed from/to.
 */
export interface KitSwap {
	id: string;
	heroId: string;
	from: string;
	to: string;
	reason?: string;
	createdAt: Date;
}

// ============================================================================
// Respite Session
// ============================================================================

/**
 * Complete respite session.
 * Tracks the full state of a respite including heroes, activities,
 * victory point conversion, and kit swaps.
 */
export interface RespiteSession {
	id: string;
	name: string;
	description?: string;
	status: RespiteStatus;
	heroes: RespiteHero[];
	victoryPointsAvailable: number;
	victoryPointsConverted: number;
	activityIds: string[]; // References to respite_activity entities
	kitSwaps: KitSwap[];
	campaignId?: string;
	characterIds?: string[];
	linkedSessionIds?: string[];
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
}

// ============================================================================
// Input Types for Repository Operations
// ============================================================================

/**
 * Input for creating a new respite session.
 */
export interface CreateRespiteInput {
	name: string;
	description?: string;
	heroes?: Array<{
		name: string;
		heroId?: string;
		recoveries: { current: number; max: number };
	}>;
	victoryPointsAvailable?: number;
}

/**
 * Input for updating respite session fields.
 */
export interface UpdateRespiteInput {
	name?: string;
	description?: string;
	victoryPointsAvailable?: number;
}

/**
 * @deprecated Use CreateRespiteActivityInput instead.
 * Input for recording an activity in the respite.
 */
export interface RecordActivityInput {
	name: string;
	description?: string;
	type: RespiteActivityType;
	heroId?: string;
	notes?: string;
}

/**
 * Input for creating a new respite activity entity.
 * Used when creating respite_activity entities through the entity system.
 */
export interface CreateRespiteActivityInput {
	name: string;
	description?: string;
	activityType: RespiteActivityType;
	heroId?: string;
	notes?: string;
}
