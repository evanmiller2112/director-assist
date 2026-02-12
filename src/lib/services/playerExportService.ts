/**
 * Player Export Service
 *
 * Orchestrates the player export process:
 * 1. Fetches all entities from the database
 * 2. Gets campaign information
 * 3. Gets entity type definitions
 * 4. Filters entities for player visibility
 * 5. Formats the output
 * 6. Triggers file download
 */

import { db } from '$lib/db';
import { appConfigRepository } from '$lib/db/repositories';
import { getAllEntityTypes, BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
import { filterEntitiesForPlayer } from './playerExportFilterService';
import { formatPlayerExport } from './playerExportFormatters';
import type { BaseEntity, EntityTypeDefinition, CampaignMetadata } from '$lib/types';
import type {
	PlayerExport,
	PlayerExportOptions,
	PlayerExportResult,
	PlayerExportPreview,
	PLAYER_EXPORT_VERSION
} from '$lib/types/playerExport';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';

// Re-export the version constant
export { PLAYER_EXPORT_VERSION } from '$lib/types/playerExport';

/**
 * Get campaign metadata from a campaign entity
 */
function getCampaignMetadata(entity: BaseEntity | null): CampaignMetadata | null {
	if (!entity) return null;
	return entity.metadata as unknown as CampaignMetadata | null;
}

/**
 * Get all entity type definitions for the current campaign
 */
function getEntityTypeDefinitions(campaign: BaseEntity | null): EntityTypeDefinition[] {
	const metadata = getCampaignMetadata(campaign);
	if (!metadata) {
		return BUILT_IN_ENTITY_TYPES;
	}
	return getAllEntityTypes(metadata.customEntityTypes ?? [], metadata.entityTypeOverrides ?? []);
}

/**
 * Build a PlayerExport structure from filtered entities
 */
export async function buildPlayerExport(): Promise<PlayerExport> {
	// Get all entities
	const entities = await db.entities.toArray();

	// Get active campaign
	const activeCampaignId = await appConfigRepository.getActiveCampaignId();
	const campaign = entities.find((e) => e.type === 'campaign' && e.id === activeCampaignId) ?? null;

	if (!campaign) {
		throw new Error('No active campaign found');
	}

	// Get entity type definitions
	const typeDefinitions = getEntityTypeDefinitions(campaign);

	// Get player export field config from campaign metadata
	const metadata = getCampaignMetadata(campaign);
	const playerExportFieldConfig: PlayerExportFieldConfig | undefined =
		metadata?.playerExportFieldConfig;

	// Filter out campaign entities from the list to filter
	const nonCampaignEntities = entities.filter((e) => e.type !== 'campaign');

	// Filter entities for player visibility
	const filteredEntities = filterEntitiesForPlayer(
		nonCampaignEntities,
		typeDefinitions,
		playerExportFieldConfig
	);

	return {
		version: '1.0.0',
		exportedAt: new Date(),
		campaignName: campaign.name,
		campaignDescription: campaign.description,
		entities: filteredEntities
	};
}

/**
 * Get a preview of what would be exported (entity counts)
 */
export async function getPlayerExportPreview(): Promise<PlayerExportPreview> {
	// Get all entities
	const entities = await db.entities.toArray();

	// Get active campaign
	const activeCampaignId = await appConfigRepository.getActiveCampaignId();
	const campaign = entities.find((e) => e.type === 'campaign' && e.id === activeCampaignId) ?? null;

	// Get entity type definitions
	const typeDefinitions = getEntityTypeDefinitions(campaign);

	// Get player export field config from campaign metadata
	const previewMetadata = getCampaignMetadata(campaign);
	const previewFieldConfig: PlayerExportFieldConfig | undefined =
		previewMetadata?.playerExportFieldConfig;

	// Filter out campaign entities
	const nonCampaignEntities = entities.filter((e) => e.type !== 'campaign');

	// Filter entities for player visibility
	const filteredEntities = filterEntitiesForPlayer(
		nonCampaignEntities,
		typeDefinitions,
		previewFieldConfig
	);

	// Calculate counts by type
	const byType: Record<string, { included: number; excluded: number }> = {};

	// Count all entities by type
	for (const entity of nonCampaignEntities) {
		if (!byType[entity.type]) {
			byType[entity.type] = { included: 0, excluded: 0 };
		}
	}

	// Count included entities
	for (const entity of filteredEntities) {
		if (!byType[entity.type]) {
			byType[entity.type] = { included: 0, excluded: 0 };
		}
		byType[entity.type].included++;
	}

	// Calculate excluded (total - included)
	for (const entity of nonCampaignEntities) {
		const isIncluded = filteredEntities.some((f) => f.id === entity.id);
		if (!isIncluded) {
			byType[entity.type].excluded++;
		}
	}

	return {
		totalEntities: filteredEntities.length,
		excludedEntities: nonCampaignEntities.length - filteredEntities.length,
		byType
	};
}

/**
 * Export player data with the specified options
 */
export async function exportPlayerData(options: PlayerExportOptions): Promise<PlayerExportResult> {
	const playerExport = await buildPlayerExport();
	const formattedData = formatPlayerExport(playerExport, options);

	// Determine filename and mime type based on format
	const campaignSlug = playerExport.campaignName.replace(/\s+/g, '-').toLowerCase();
	const dateStr = playerExport.exportedAt.toISOString().split('T')[0];

	let filename: string;
	let mimeType: string;

	switch (options.format) {
		case 'json':
			filename = `${campaignSlug}-player-export-${dateStr}.json`;
			mimeType = 'application/json';
			break;
		case 'html':
			filename = `${campaignSlug}-player-export-${dateStr}.html`;
			mimeType = 'text/html';
			break;
		case 'markdown':
			filename = `${campaignSlug}-player-export-${dateStr}.md`;
			mimeType = 'text/markdown';
			break;
		default:
			throw new Error(`Unknown export format: ${options.format}`);
	}

	return {
		data: formattedData,
		filename,
		mimeType
	};
}

/**
 * Export and download player data
 */
export async function downloadPlayerExport(options: PlayerExportOptions): Promise<void> {
	const result = await exportPlayerData(options);

	// Create blob and download
	const blob = new Blob([result.data], { type: result.mimeType });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = result.filename;
	a.click();

	URL.revokeObjectURL(url);
}
