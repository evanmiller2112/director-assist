/**
 * Player Export Field Config Service
 * GitHub Issue #437: Settings UI for per-category player export field defaults
 *
 * Pure service functions for managing per-category field visibility defaults
 * stored in CampaignMetadata.playerExportFieldConfig.
 *
 * All functions are pure (no side effects, no store access).
 * The component layer handles persistence.
 */

import type { CampaignMetadata } from '$lib/types/campaign';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
import type { FieldDefinition } from '$lib/types/entities';

/**
 * Get the current field visibility config from campaign metadata.
 * Returns an empty config if none is configured.
 */
export function getPlayerExportFieldConfig(
	campaignMetadata: CampaignMetadata
): PlayerExportFieldConfig {
	return campaignMetadata.playerExportFieldConfig ?? { fieldVisibility: {} };
}

/**
 * Get the visibility setting for a specific field in a category.
 *
 * @returns true (visible), false (hidden), or undefined (no config, use hardcoded default)
 */
export function getFieldVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string,
	fieldKey: string
): boolean | undefined {
	const entityConfig = config.fieldVisibility[entityType];
	if (!entityConfig || !(fieldKey in entityConfig)) {
		return undefined;
	}
	return entityConfig[fieldKey];
}

/**
 * Set the visibility for a field in a category.
 * Returns a new config object (does not mutate the original).
 */
export function setFieldVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string,
	fieldKey: string,
	visible: boolean
): PlayerExportFieldConfig {
	const existingEntityConfig = config.fieldVisibility[entityType] ?? {};
	return {
		...config,
		fieldVisibility: {
			...config.fieldVisibility,
			[entityType]: {
				...existingEntityConfig,
				[fieldKey]: visible
			}
		}
	};
}

/**
 * Remove a field visibility setting (returns new config, does not mutate).
 * Used for "reset to default" functionality on a single field.
 * Cleans up empty entity type entries.
 */
export function removeFieldVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string,
	fieldKey: string
): PlayerExportFieldConfig {
	const entityConfig = config.fieldVisibility[entityType];
	if (!entityConfig) {
		// Entity type not in config, nothing to remove
		return {
			...config,
			fieldVisibility: { ...config.fieldVisibility }
		};
	}

	// Create a shallow copy of the entity config without the target field
	const { [fieldKey]: _removed, ...remainingFields } = entityConfig;

	// If no fields remain, remove the entity type entry entirely
	if (Object.keys(remainingFields).length === 0) {
		const { [entityType]: _removedType, ...remainingTypes } = config.fieldVisibility;
		return {
			...config,
			fieldVisibility: remainingTypes
		};
	}

	return {
		...config,
		fieldVisibility: {
			...config.fieldVisibility,
			[entityType]: remainingFields
		}
	};
}

/**
 * Reset all field visibility settings for an entity type.
 * Returns a new config (does not mutate the original).
 */
export function resetEntityTypeConfig(
	config: PlayerExportFieldConfig,
	entityType: string
): PlayerExportFieldConfig {
	const { [entityType]: _removed, ...remainingTypes } = config.fieldVisibility;
	return {
		...config,
		fieldVisibility: remainingTypes
	};
}

/**
 * Get the hardcoded default visibility for a field (backward compatibility reference).
 *
 * These are the original rules that apply when no per-category or per-entity
 * overrides exist:
 *   - 'notes' field -> false (DM notes always hidden)
 *   - field.section === 'hidden' -> false (secret fields hidden)
 *   - 'preparation' on session entity type -> false (DM prep hidden)
 *   - Everything else -> true
 */
export function getHardcodedDefault(
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

/**
 * Get the visibility setting for an entire entity category.
 * GitHub Issue #520: Add option to exclude entire entity categories from player mode export.
 *
 * @returns true (visible), false (hidden), or undefined (no config, use default rules)
 */
export function getCategoryVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string
): boolean | undefined {
	if (!config.categoryVisibility || !(entityType in config.categoryVisibility)) {
		return undefined;
	}
	return config.categoryVisibility[entityType];
}

/**
 * Set the visibility for an entire entity category.
 * Returns a new config object (does not mutate the original).
 */
export function setCategoryVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string,
	visible: boolean
): PlayerExportFieldConfig {
	const existingCategoryVisibility = config.categoryVisibility ?? {};
	return {
		...config,
		categoryVisibility: {
			...existingCategoryVisibility,
			[entityType]: visible
		}
	};
}

/**
 * Remove a category visibility setting (returns new config, does not mutate).
 * Cleans up empty categoryVisibility object.
 */
export function removeCategoryVisibilitySetting(
	config: PlayerExportFieldConfig,
	entityType: string
): PlayerExportFieldConfig {
	const categoryVisibility = config.categoryVisibility;
	if (!categoryVisibility) {
		// No categoryVisibility, nothing to remove
		return {
			...config
		};
	}

	// Create a shallow copy of categoryVisibility without the target entity type
	const { [entityType]: _removed, ...remainingCategories } = categoryVisibility;

	// If no categories remain, remove categoryVisibility entirely
	if (Object.keys(remainingCategories).length === 0) {
		const { categoryVisibility: _removedProp, ...remainingConfig } = config;
		return remainingConfig;
	}

	return {
		...config,
		categoryVisibility: remainingCategories
	};
}

/**
 * Reset all category visibility settings.
 * Returns a new config (does not mutate the original).
 */
export function resetAllCategoryVisibility(
	config: PlayerExportFieldConfig
): PlayerExportFieldConfig {
	const { categoryVisibility: _removed, ...remainingConfig } = config;
	return remainingConfig;
}
