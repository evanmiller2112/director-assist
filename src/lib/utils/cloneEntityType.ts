/**
 * Clone Entity Type Utility (GitHub Issue #210)
 *
 * Provides deep cloning functionality for EntityTypeDefinition objects.
 * Used when users want to clone existing entity types as a starting point for new custom types.
 *
 * Key behaviors:
 * - Deep clones all properties (fieldDefinitions, defaultRelationships, etc.)
 * - Resets type to empty string (user must provide new unique key)
 * - Forces isBuiltIn to false (clones are always custom types)
 * - Appends "(Copy)" to labels for clarity
 * - Ensures immutability (modifications to clone don't affect original)
 */

import type { EntityTypeDefinition } from '$lib/types';

/**
 * Creates a deep clone of an entity type definition suitable for creating a new custom type.
 *
 * The cloned entity type will have:
 * - `type` set to empty string (user must provide new unique key)
 * - `isBuiltIn` set to false (all clones are custom types)
 * - Labels suffixed with "(Copy)" to indicate it's a clone
 * - All nested objects/arrays deep cloned for immutability
 *
 * @param original - The entity type definition to clone
 * @returns A new entity type definition ready to be customized
 *
 * @example
 * ```ts
 * const characterType = getEntityType('character');
 * const cloned = cloneEntityType(characterType);
 * cloned.type = 'hero'; // User provides new key
 * cloned.label = 'Hero'; // User can customize
 * ```
 */
export function cloneEntityType(original: EntityTypeDefinition): EntityTypeDefinition {
	// Deep clone using structuredClone (modern browser API)
	// This handles nested objects, arrays, dates, etc. properly
	const cloned = structuredClone(original);

	// Reset type to empty string - user must provide new unique key
	cloned.type = '';

	// Always set isBuiltIn to false - clones are custom types
	cloned.isBuiltIn = false;

	// Append "(Copy)" to label
	cloned.label = `${original.label} (Copy)`;

	// Append "(Copy)" to labelPlural if it exists
	if (original.labelPlural) {
		cloned.labelPlural = `${original.labelPlural} (Copy)`;
	}

	return cloned;
}
