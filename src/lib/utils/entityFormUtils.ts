import {
	getEntityTypeDefinition,
	getEntityTypeDefinitionWithSystem
} from '$lib/config/entityTypes';
import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';
import type { SystemProfile } from '$lib/types/systems';

/**
 * Get entity type definition with system-aware modifications applied.
 *
 * This function retrieves the base entity type definition and applies any
 * system-specific modifications from the provided system profile. It's the
 * primary function to use in entity forms to get the correct field definitions
 * based on the active campaign's system profile.
 *
 * @param entityType - The entity type identifier (e.g., 'character', 'npc')
 * @param systemProfile - The system profile to apply modifications from (can be null/undefined)
 * @param customTypes - Optional custom entity type definitions from campaign
 * @param overrides - Optional entity type overrides from campaign
 * @returns The entity type definition with system modifications applied, or undefined if type not found
 *
 * @example
 * ```typescript
 * // Get Draw Steel character definition with ancestry, class, kit fields
 * const typeDefinition = getSystemAwareEntityType(
 *   'character',
 *   campaignStore.getCurrentSystemProfile(),
 *   campaignStore.customEntityTypes,
 *   campaignStore.entityTypeOverrides
 * );
 * ```
 */
export function getSystemAwareEntityType(
	entityType: string,
	systemProfile: SystemProfile | null | undefined,
	customTypes?: EntityTypeDefinition[],
	overrides?: EntityTypeOverride[]
): EntityTypeDefinition | undefined {
	// Get the base entity type definition WITHOUT overrides
	// Overrides (including fieldOrder) must be applied AFTER system modifications
	// because applySystemModifications sorts by .order property
	const baseDefinition = getEntityTypeDefinition(
		entityType,
		customTypes ?? [],
		[] // Don't apply overrides here
	);

	// If no base definition found, return undefined
	if (!baseDefinition) {
		return undefined;
	}

	// If no system profile provided or it's null, apply overrides directly
	if (!systemProfile) {
		return getEntityTypeDefinition(
			entityType,
			customTypes ?? [],
			overrides ?? []
		);
	}

	// Apply system modifications AND overrides
	// Overrides are applied last so fieldOrder isn't undone by system's sort
	return getEntityTypeDefinitionWithSystem(
		entityType as any, // Cast to EntityType - getEntityTypeDefinitionWithSystem expects this
		baseDefinition,
		systemProfile,
		customTypes ?? [],
		overrides ?? [] // Apply overrides AFTER system modifications
	);
}
