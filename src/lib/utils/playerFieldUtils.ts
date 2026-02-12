/**
 * Player Field Utilities
 * Issue #443: Read-only entity display components for player view
 *
 * Utilities for filtering and displaying entity fields in the player view.
 */

import type { PlayerEntity } from '$lib/types/playerExport';
import type { FieldDefinition, FieldValue } from '$lib/types/entities';

/**
 * Filter fields that should be displayed in player view.
 * - Only fields with non-empty values
 * - Excludes fields with section: 'hidden' (DM-only)
 * - Returns field definitions paired with their values, ordered by field.order
 */
export function getDisplayablePlayerFields(
	entity: PlayerEntity,
	fieldDefinitions: FieldDefinition[]
): Array<{ field: FieldDefinition; value: FieldValue }> {
	const results: Array<{ field: FieldDefinition; value: FieldValue }> = [];

	for (const fieldDef of fieldDefinitions) {
		// Skip hidden fields (DM-only)
		if (fieldDef.section === 'hidden') {
			continue;
		}

		// Get the value from the entity
		const value = entity.fields[fieldDef.key];

		// Skip if the field doesn't exist in the entity
		if (!(fieldDef.key in entity.fields)) {
			continue;
		}

		// Check if value is empty
		const isEmpty = isEmptyValue(value);

		// Include non-empty values (including boolean false)
		if (!isEmpty) {
			results.push({ field: fieldDef, value });
		}
	}

	// Sort by field order
	results.sort((a, b) => a.field.order - b.field.order);

	return results;
}

/**
 * Check if a field value is considered "empty" for display purposes.
 * - null/undefined → empty
 * - empty string → empty
 * - empty array → empty
 * - boolean false → NOT empty (explicit "No" value)
 */
function isEmptyValue(value: FieldValue): boolean {
	// null or undefined
	if (value === null || value === undefined) {
		return true;
	}

	// Empty string
	if (value === '') {
		return true;
	}

	// Empty array
	if (Array.isArray(value) && value.length === 0) {
		return true;
	}

	// Boolean false is NOT empty (it's an explicit value)
	if (typeof value === 'boolean') {
		return false;
	}

	return false;
}

/**
 * Resolve entity name from player data store for entity-ref fields.
 * Returns the entity name or 'Unknown' if not found.
 */
export function resolvePlayerEntityName(entityId: string, entities: PlayerEntity[]): string {
	if (!entityId) {
		return 'Unknown';
	}

	const entity = entities.find((e) => e.id === entityId);
	return entity ? entity.name : 'Unknown';
}

/**
 * Resolve entity type from player data store for entity-ref fields.
 * Returns the entity type or empty string if not found.
 */
export function resolvePlayerEntityType(entityId: string, entities: PlayerEntity[]): string {
	if (!entityId) {
		return '';
	}

	const entity = entities.find((e) => e.id === entityId);
	return entity ? entity.type : '';
}
