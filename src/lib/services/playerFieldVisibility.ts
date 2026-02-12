/**
 * Player Field Visibility Service
 * GitHub Issue #436: Data model for player export field visibility configuration
 *
 * Resolves whether a specific entity field should be included in a player export
 * using a three-level cascade:
 *   1. Per-entity override (entity.metadata.playerExportFieldOverrides[fieldKey])
 *   2. Per-category default (config.fieldVisibility[entityType][fieldKey])
 *   3. Hardcoded rules (notes=false, hidden section=false, preparation on sessions=false, else true)
 */

import type { BaseEntity, FieldDefinition } from '$lib/types/entities';
import type { PlayerExportFieldConfig, PlayerExportFieldOverrides } from '$lib/types/playerFieldVisibility';
import { PLAYER_EXPORT_FIELD_OVERRIDES_KEY } from '$lib/types/playerFieldVisibility';

/**
 * Determine whether a field should be visible in a player export.
 *
 * @param fieldKey - The key of the field to check
 * @param fieldDef - The field definition (undefined for orphaned/unknown fields)
 * @param entityType - The entity type string
 * @param entity - The entity instance (for per-entity overrides in metadata)
 * @param config - The campaign-level field visibility config (undefined = no config)
 * @returns true if the field should be included in the player export
 */
export function isFieldPlayerVisible(
	fieldKey: string,
	fieldDef: FieldDefinition | undefined,
	entityType: string,
	entity: BaseEntity,
	config: PlayerExportFieldConfig | undefined
): boolean {
	// Level 1: Per-entity override (highest priority)
	const overrides = entity.metadata?.[PLAYER_EXPORT_FIELD_OVERRIDES_KEY] as
		| PlayerExportFieldOverrides
		| undefined;

	if (overrides && fieldKey in overrides) {
		return overrides[fieldKey];
	}

	// Level 2: Per-category default
	if (config?.fieldVisibility) {
		const categoryConfig = config.fieldVisibility[entityType];
		if (categoryConfig && fieldKey in categoryConfig) {
			return categoryConfig[fieldKey];
		}
	}

	// Level 3: Hardcoded rules (backward compatibility)
	return applyHardcodedRules(fieldKey, fieldDef, entityType);
}

/**
 * Apply the original hardcoded field visibility rules.
 * This preserves backward compatibility when no config or overrides exist.
 */
function applyHardcodedRules(
	fieldKey: string,
	fieldDef: FieldDefinition | undefined,
	entityType: string
): boolean {
	// 'notes' field is always hidden
	if (fieldKey === 'notes') {
		return false;
	}

	// Fields with section: 'hidden' are hidden
	if (fieldDef?.section === 'hidden') {
		return false;
	}

	// 'preparation' field on session entities is hidden
	if (fieldKey === 'preparation' && entityType === 'session') {
		return false;
	}

	// Everything else is visible by default
	return true;
}
