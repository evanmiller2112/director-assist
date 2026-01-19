import type { FieldDefinition, EntityType } from './entities';

/**
 * System identifiers for built-in game systems
 */
export type SystemId = 'draw-steel' | 'system-agnostic' | string;

/**
 * Modifications to apply to an entity type for a specific game system
 */
export interface SystemEntityModification {
	/** Additional fields to add to this entity type */
	additionalFields?: FieldDefinition[];
	/** Field keys to hide from this entity type */
	hiddenFields?: string[];
	/** Override options for select/multi-select fields */
	fieldOptionOverrides?: Record<string, string[]>;
}

/**
 * AI-specific context for a game system
 */
export interface SystemAIContext {
	/** Description of the game system for AI context */
	systemDescription?: string;
	/** Key mechanics or concepts the AI should know about */
	keyMechanics?: string[];
	/** Preferred terminology for common concepts */
	preferredTerms?: Record<string, string>;
}

/**
 * UI terminology overrides for a game system
 */
export interface SystemTerminology {
	/** Term for the game master/dungeon master */
	gm?: string;
	/** Term for player character */
	player?: string;
	/** Additional custom term mappings */
	[key: string]: string | undefined;
}

/**
 * Complete profile for a game system
 */
export interface SystemProfile {
	/** Unique identifier for this system */
	id: SystemId;
	/** Display name */
	name: string;
	/** Optional description */
	description?: string;
	/** Entity type modifications for this system */
	entityTypeModifications: Record<EntityType, SystemEntityModification>;
	/** AI context for this system */
	aiContext?: SystemAIContext;
	/** UI terminology overrides */
	terminology: SystemTerminology;
}
