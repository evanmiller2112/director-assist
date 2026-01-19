/**
 * Field Relationship Context Service
 *
 * Builds relationship context specifically for per-field AI generation.
 * Determines when to include context, formats it appropriately, and provides
 * reasons for inclusion/exclusion decisions.
 *
 * This service acts as a bridge between the smart field detection utility
 * and the existing relationship context builder, applying field-specific
 * budget and relevance rules.
 */

import type { EntityId, EntityType } from '$lib/types';
import {
	buildRelationshipContext,
	formatRelationshipContextForPrompt
} from './relationshipContextBuilder';
import { getRelationshipContextSettings } from './relationshipContextSettingsService';
import {
	shouldIncludeRelationshipContext,
	getFieldRelationshipContextBudget
} from '../utils/relationshipContextFields';

/**
 * Options for building field-specific relationship context
 */
export interface FieldRelationshipContextOptions {
	/** The entity to build context for */
	entityId: EntityId;
	/** The type of entity */
	entityType: EntityType;
	/** The field being generated */
	targetField: string;
	/** Force inclusion even for non-relevant fields (default: false) */
	forceInclude?: boolean;
}

/**
 * Reason for context inclusion/exclusion
 */
export type FieldRelationshipContextReason =
	| 'disabled'           // Relationship context is disabled in settings
	| 'no_entity'          // No entity ID provided
	| 'field_not_relevant' // Field type doesn't benefit from relationship context
	| 'no_relationships'   // Entity has no relationships
	| 'included';          // Context successfully included

/**
 * Result of building field relationship context
 */
export interface FieldRelationshipContextResult {
	/** Whether relationship context was included */
	included: boolean;
	/** Formatted context string (empty if not included) */
	formattedContext: string;
	/** Total character count of formatted context */
	characterCount: number;
	/** Reason for inclusion/exclusion */
	reason: FieldRelationshipContextReason;
}

/**
 * Build relationship context for a specific field during AI generation.
 *
 * This function:
 * 1. Checks if relationship context is enabled in settings
 * 2. Validates that an entity ID is provided
 * 3. Determines if the field is relevant for relationship context
 * 4. Calculates field-specific budget based on priority
 * 5. Builds and formats relationship context
 * 6. Returns result with inclusion status and reason
 *
 * @param options - Configuration for context building
 * @returns Promise resolving to context result with inclusion status
 *
 * @example
 * ```typescript
 * // High priority field for social entity
 * const result = await buildFieldRelationshipContext({
 *   entityId: 'npc-123',
 *   entityType: 'npc',
 *   targetField: 'personality'
 * });
 * // result.included === true (if entity has relationships)
 * // result.characterCount === 250
 * // result.reason === 'included'
 *
 * // Low priority field
 * const result2 = await buildFieldRelationshipContext({
 *   entityId: 'npc-123',
 *   entityType: 'npc',
 *   targetField: 'appearance'
 * });
 * // result2.included === false
 * // result2.reason === 'field_not_relevant'
 * ```
 */
export async function buildFieldRelationshipContext(
	options: FieldRelationshipContextOptions
): Promise<FieldRelationshipContextResult> {
	const { entityId, entityType, targetField, forceInclude = false } = options;

	// 1. Check if relationship context is enabled
	const settings = getRelationshipContextSettings();
	if (!settings.enabled) {
		return {
			included: false,
			formattedContext: '',
			characterCount: 0,
			reason: 'disabled'
		};
	}

	// 2. Validate entity ID
	if (!entityId || entityId === '' || entityId === null || entityId === undefined) {
		return {
			included: false,
			formattedContext: '',
			characterCount: 0,
			reason: 'no_entity'
		};
	}

	// 3. Check field relevance (unless forceInclude is true)
	if (!forceInclude && !shouldIncludeRelationshipContext(targetField, entityType)) {
		return {
			included: false,
			formattedContext: '',
			characterCount: 0,
			reason: 'field_not_relevant'
		};
	}

	// 4. Calculate field-specific budget
	const baseBudget = settings.maxCharacters;
	const fieldBudget = getFieldRelationshipContextBudget(targetField, baseBudget);

	// 5. Build relationship context with field-specific budget
	try {
		const relationshipContext = await buildRelationshipContext(entityId, {
			maxCharacters: fieldBudget,
			maxRelatedEntities: settings.maxRelatedEntities
		});

		// 6. Check if entity has any relationships
		if (relationshipContext.relatedEntities.length === 0) {
			return {
				included: false,
				formattedContext: '',
				characterCount: 0,
				reason: 'no_relationships'
			};
		}

		// 7. Format context for prompt
		const formattedContext = formatRelationshipContextForPrompt(relationshipContext);

		// 8. Return successful result
		return {
			included: true,
			formattedContext,
			characterCount: formattedContext.length,
			reason: 'included'
		};
	} catch (error) {
		// Handle errors gracefully - treat as no relationships
		return {
			included: false,
			formattedContext: '',
			characterCount: 0,
			reason: 'no_relationships'
		};
	}
}
