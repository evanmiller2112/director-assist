/**
 * Smart Field Detection Utility for Relationship Context
 *
 * Determines which fields should include relationship context in per-field AI generation.
 * Uses field type analysis and entity type relevance to make intelligent decisions.
 *
 * Priority Levels:
 * - High: Fields where relationships are core to content (personality, motivation, goals, etc.)
 * - Medium: Fields where relationships provide valuable context (background, description, etc.)
 * - Low: Fields where relationships have minimal relevance (appearance, tactics, etc.)
 * - None: Fields where relationships should not be included (equipment, stats, etc.)
 */

import type { EntityType } from '$lib/types';

/**
 * Priority level for relationship context inclusion
 */
export type ContextPriority = 'high' | 'medium' | 'low' | 'none';

/**
 * Field names that should include relationship context at high priority
 */
const HIGH_PRIORITY_FIELDS = [
	'personality',
	'motivation',
	'goals',
	'relationships',
	'alliances',
	'enemies'
];

/**
 * Field names that should include relationship context at medium priority
 */
const MEDIUM_PRIORITY_FIELDS = [
	'background',
	'description',
	'history',
	'role',
	'occupation',
	'atmosphere',
	'values',
	'resources'
];

/**
 * Field names that should include relationship context at low priority
 */
const LOW_PRIORITY_FIELDS = [
	'appearance',
	'physical_description',
	'tactics',
	'combat_behavior'
];

/**
 * Entity types that are "social" and benefit most from relationship context
 */
const SOCIAL_ENTITY_TYPES: EntityType[] = ['npc', 'character', 'faction'];

/**
 * Entity types that benefit from relationship context for certain fields
 */
const CONTEXTUAL_ENTITY_TYPES: EntityType[] = ['location'];

/**
 * Get the priority level for a field with respect to relationship context.
 *
 * Uses partial string matching to handle variations like:
 * - "social_background" contains "background"
 * - "character_motivation" contains "motivation"
 * - "npc_personality" contains "personality"
 *
 * Important: Checks low priority fields first to avoid conflicts
 * (e.g., "physical_description" should match "physical_description" not "description")
 *
 * @param fieldKey - The field key to check
 * @returns The priority level for relationship context
 *
 * @example
 * ```typescript
 * getRelationshipContextPriority('personality')         // 'high'
 * getRelationshipContextPriority('character_motivation') // 'high'
 * getRelationshipContextPriority('background')          // 'medium'
 * getRelationshipContextPriority('appearance')          // 'low'
 * getRelationshipContextPriority('equipment')           // 'none'
 * ```
 */
export function getRelationshipContextPriority(fieldKey: string): ContextPriority {
	const normalizedKey = fieldKey.toLowerCase().trim();

	// Check low priority fields FIRST to avoid conflicts with partial matches
	// For example, "physical_description" should match LOW priority, not MEDIUM "description"
	for (const field of LOW_PRIORITY_FIELDS) {
		if (normalizedKey === field || normalizedKey.includes(field)) {
			return 'low';
		}
	}

	// Check high priority fields (exact match or contains)
	for (const field of HIGH_PRIORITY_FIELDS) {
		if (normalizedKey === field || normalizedKey.includes(field)) {
			return 'high';
		}
	}

	// Check medium priority fields (exact match or contains)
	for (const field of MEDIUM_PRIORITY_FIELDS) {
		if (normalizedKey === field || normalizedKey.includes(field)) {
			return 'medium';
		}
	}

	// Default to none for unknown fields
	return 'none';
}

/**
 * Determine if a field should include relationship context based on field type and entity type.
 *
 * Decision logic:
 * 1. Check if field is empty/invalid → false
 * 2. Get field priority
 * 3. Check entity type relevance
 * 4. Return true if priority is medium/high AND entity type is relevant
 *
 * Entity type relevance:
 * - Social entities (NPC, Character, Faction): High/Medium priority fields
 * - Contextual entities (Location): Description-related fields
 * - Other entities: Conservative (only description-related fields)
 *
 * @param fieldKey - The field key to check
 * @param entityType - The type of entity
 * @returns True if relationship context should be included for this field
 *
 * @example
 * ```typescript
 * shouldIncludeRelationshipContext('personality', 'npc')      // true
 * shouldIncludeRelationshipContext('personality', 'item')     // false
 * shouldIncludeRelationshipContext('description', 'location') // true
 * shouldIncludeRelationshipContext('equipment', 'character')  // false
 * ```
 */
export function shouldIncludeRelationshipContext(
	fieldKey: string,
	entityType: EntityType
): boolean {
	// Handle empty or invalid field keys
	const trimmedKey = fieldKey.trim();
	if (!trimmedKey) {
		return false;
	}

	// Get the priority for this field
	const priority = getRelationshipContextPriority(fieldKey);

	// None priority fields never include context
	if (priority === 'none') {
		return false;
	}

	// For social entity types (NPC, Character, Faction)
	if (SOCIAL_ENTITY_TYPES.includes(entityType)) {
		// Include context for high and medium priority fields
		return priority === 'high' || priority === 'medium';
	}

	// For contextual entity types (Location)
	if (CONTEXTUAL_ENTITY_TYPES.includes(entityType)) {
		// Include context for description-related fields (medium priority or higher)
		const normalizedKey = fieldKey.toLowerCase();
		const isDescriptionRelated =
			normalizedKey.includes('description') ||
			normalizedKey.includes('atmosphere') ||
			normalizedKey.includes('history') ||
			normalizedKey === 'description' ||
			normalizedKey === 'atmosphere' ||
			normalizedKey === 'history';

		return isDescriptionRelated && (priority === 'high' || priority === 'medium');
	}

	// For other/custom entity types, only include for description field
	const normalizedKey = fieldKey.toLowerCase();
	return normalizedKey === 'description' || normalizedKey.includes('description');
}

/**
 * Calculate the character budget for relationship context based on field priority.
 *
 * Budget allocation:
 * - High priority: 75% of base budget
 * - Medium priority: 50% of base budget
 * - Low priority: 25% of base budget
 * - None priority: 0 (no budget)
 *
 * @param fieldKey - The field key to calculate budget for
 * @param baseBudget - The base character budget available
 * @returns The allocated character budget for this field
 *
 * @example
 * ```typescript
 * getFieldRelationshipContextBudget('personality', 4000)  // 3000 (75%)
 * getFieldRelationshipContextBudget('background', 4000)   // 2000 (50%)
 * getFieldRelationshipContextBudget('appearance', 4000)   // 1000 (25%)
 * getFieldRelationshipContextBudget('equipment', 4000)    // 0
 * ```
 */
export function getFieldRelationshipContextBudget(
	fieldKey: string,
	baseBudget: number
): number {
	// Handle negative budgets
	if (baseBudget < 0) {
		return 0;
	}

	const priority = getRelationshipContextPriority(fieldKey);

	switch (priority) {
		case 'high':
			return Math.floor(baseBudget * 0.75);
		case 'medium':
			return Math.floor(baseBudget * 0.5);
		case 'low':
			return Math.floor(baseBudget * 0.25);
		case 'none':
			return 0;
		default:
			return 0;
	}
}
