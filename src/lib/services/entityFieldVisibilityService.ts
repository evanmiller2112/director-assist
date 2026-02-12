/**
 * Entity Field Visibility Service
 * GitHub Issue #438: Per-entity field visibility toggle checkboxes in entity editor
 *
 * Helper functions for managing per-entity field visibility overrides.
 * These support the FieldVisibilityToggle component which provides a
 * three-state cycling UI: inherit -> force include -> force exclude -> inherit.
 *
 * Overrides are stored in entity.metadata.playerExportFieldOverrides
 * as Record<string, boolean>, where:
 *   - true = force include in player export
 *   - false = force exclude from player export
 *   - absent = inherit from category default / hardcoded rules
 */

import { PLAYER_EXPORT_FIELD_OVERRIDES_KEY } from '$lib/types/playerFieldVisibility';
import type { PlayerExportFieldOverrides } from '$lib/types/playerFieldVisibility';

/**
 * Get the current override state for a field on an entity.
 *
 * @param entityMetadata - The entity's metadata object
 * @param fieldKey - The field key to look up
 * @returns true (force include), false (force exclude), or undefined (inherit)
 */
export function getFieldOverrideState(
	entityMetadata: Record<string, unknown>,
	fieldKey: string
): boolean | undefined {
	const overrides = entityMetadata[PLAYER_EXPORT_FIELD_OVERRIDES_KEY] as
		| PlayerExportFieldOverrides
		| undefined;

	if (!overrides || !(fieldKey in overrides)) {
		return undefined;
	}

	return overrides[fieldKey];
}

/**
 * Compute the next state in the three-state cycle.
 *
 * Cycle: undefined (inherit) -> true (force include) -> false (force exclude) -> undefined
 *
 * @param current - The current override state
 * @returns The next state in the cycle
 */
export function cycleFieldOverrideState(current: boolean | undefined): boolean | undefined {
	if (current === undefined) {
		return true;
	}
	if (current === true) {
		return false;
	}
	// current === false
	return undefined;
}

/**
 * Apply a field override to entity metadata. Returns a new metadata object
 * without mutating the original.
 *
 * When value is undefined, the override for that field is removed.
 * If removing the last override, the entire playerExportFieldOverrides
 * key is removed from metadata to keep it clean.
 *
 * @param entityMetadata - The entity's current metadata object
 * @param fieldKey - The field key to set/remove
 * @param value - true (force include), false (force exclude), or undefined (remove override)
 * @returns A new metadata object with the override applied
 */
export function setFieldOverride(
	entityMetadata: Record<string, unknown>,
	fieldKey: string,
	value: boolean | undefined
): Record<string, unknown> {
	const existingOverrides = entityMetadata[PLAYER_EXPORT_FIELD_OVERRIDES_KEY] as
		| PlayerExportFieldOverrides
		| undefined;

	if (value === undefined) {
		// Remove the override for this field
		if (!existingOverrides || !(fieldKey in existingOverrides)) {
			// Nothing to remove; return a shallow copy without the overrides key if it doesn't exist
			const { [PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: _, ...rest } = entityMetadata;
			if (existingOverrides && Object.keys(existingOverrides).length > 0) {
				return { ...rest, [PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: { ...existingOverrides } };
			}
			return { ...rest };
		}

		const { [fieldKey]: _, ...remainingOverrides } = existingOverrides;

		if (Object.keys(remainingOverrides).length === 0) {
			// Last override removed; drop the key entirely
			const { [PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: __, ...restMetadata } = entityMetadata;
			return { ...restMetadata };
		}

		return {
			...entityMetadata,
			[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: remainingOverrides
		};
	}

	// Set or update the override
	const newOverrides: PlayerExportFieldOverrides = {
		...(existingOverrides || {}),
		[fieldKey]: value
	};

	return {
		...entityMetadata,
		[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: newOverrides
	};
}

/**
 * Get the resolved visibility for a field, considering the entity-level
 * override and the category default.
 *
 * @param entityMetadata - The entity's metadata object
 * @param fieldKey - The field key to resolve
 * @param categoryDefault - The category-level default visibility for this field
 * @returns An object with { visible: boolean, isOverridden: boolean }
 */
export function getResolvedFieldVisibility(
	entityMetadata: Record<string, unknown>,
	fieldKey: string,
	categoryDefault: boolean
): { visible: boolean; isOverridden: boolean } {
	const override = getFieldOverrideState(entityMetadata, fieldKey);

	if (override !== undefined) {
		return { visible: override, isOverridden: true };
	}

	return { visible: categoryDefault, isOverridden: false };
}
