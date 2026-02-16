/**
 * Valibot Schemas for Campaign Validation (Issue #504)
 *
 * Runtime validation schemas for Campaign types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// CampaignSettings schema
export const CampaignSettingsSchema = v.looseObject({
	customRelationships: v.array(v.string()),
	enabledEntityTypes: v.array(v.string()),
	theme: v.optional(v.union([v.literal('light'), v.literal('dark'), v.literal('system')])),
	enforceCampaignLinking: v.optional(v.boolean()),
	defaultCampaignId: v.optional(v.string())
});

// CampaignMetadata schema
export const CampaignMetadataSchema = v.looseObject({
	systemId: v.optional(v.string()),
	customEntityTypes: v.array(v.unknown()),
	entityTypeOverrides: v.array(v.unknown()),
	fieldTemplates: v.optional(v.array(v.unknown())),
	settings: CampaignSettingsSchema,
	tableMap: v.optional(v.unknown()),
	playerExportFieldConfig: v.optional(v.unknown())
});
