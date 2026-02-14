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
 * categoryVisibility controls entire entity categories (GitHub Issue #520):
 *   entityType -> visible (true/false)
 *
 * Fields not listed fall through to hardcoded rules.
 */
export interface PlayerExportFieldConfig {
	fieldVisibility: Record<string, Record<string, boolean>>;
	categoryVisibility?: Record<string, boolean>;
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

/**
 * Virtual keys for core BaseEntity fields (GitHub Issue #522).
 * These keys use the __core_ prefix to distinguish them from custom fields.
 * All default to visible (backward compatible).
 */
export const CORE_FIELD_KEYS = {
	DESCRIPTION: '__core_description',
	SUMMARY: '__core_summary',
	TAGS: '__core_tags',
	IMAGE_URL: '__core_imageUrl',
	CREATED_AT: '__core_createdAt',
	UPDATED_AT: '__core_updatedAt',
	RELATIONSHIPS: '__core_relationships',
} as const;

export type CoreFieldKey = (typeof CORE_FIELD_KEYS)[keyof typeof CORE_FIELD_KEYS];

/**
 * Human-readable labels for core fields (for UI display).
 */
export const CORE_FIELD_LABELS: Record<CoreFieldKey, string> = {
	'__core_description': 'Description',
	'__core_summary': 'Summary',
	'__core_tags': 'Tags',
	'__core_imageUrl': 'Image',
	'__core_createdAt': 'Created Date',
	'__core_updatedAt': 'Updated Date',
	'__core_relationships': 'Relationships',
};

/**
 * Check if a field key is a core field key.
 */
export function isCoreFieldKey(key: string): key is CoreFieldKey {
	return key.startsWith('__core_');
}
