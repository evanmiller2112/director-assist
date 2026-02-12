/**
 * Player Export Field Visibility Configuration Types
 * GitHub Issue #436: Data model for player export field visibility configuration
 *
 * Provides per-category default visibility and per-entity override support
 * for controlling which fields appear in player exports.
 */

/**
 * Per-category field visibility defaults.
 *
 * Stored at the campaign level (in CampaignMetadata).
 * Controls which fields are visible in player exports for each entity type.
 *
 * fieldVisibility is a nested record:
 *   entityType -> fieldKey -> visible (true/false)
 *
 * Fields not listed fall through to hardcoded rules.
 */
export interface PlayerExportFieldConfig {
	fieldVisibility: Record<string, Record<string, boolean>>;
}

/**
 * Metadata key for per-entity field visibility overrides.
 *
 * Stored in entity.metadata.playerExportFieldOverrides as Record<string, boolean>.
 * key = field key, value = true (force include) / false (force exclude).
 * Fields not listed fall back to category default, then hardcoded rules.
 */
export const PLAYER_EXPORT_FIELD_OVERRIDES_KEY = 'playerExportFieldOverrides' as const;

/**
 * Type for the per-entity overrides stored in entity.metadata.
 */
export type PlayerExportFieldOverrides = Record<string, boolean>;
