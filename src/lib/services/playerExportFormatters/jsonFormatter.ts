/**
 * JSON Formatter for Player Exports
 *
 * Produces valid, formatted JSON output suitable for:
 * - Importing into other tools
 * - Programmatic access
 * - Data interchange
 */
import type { PlayerExport, PlayerExportOptions, PlayerEntity } from '$lib/types/playerExport';

/**
 * Formats a player export as JSON
 * @param playerExport The player export data
 * @param options Export options
 * @returns JSON string representation
 */
export function formatAsJson(playerExport: PlayerExport, options: PlayerExportOptions): string {
	// Create a clean copy of the export data
	const exportData: any = {
		version: playerExport.version,
		exportedAt: playerExport.exportedAt.toISOString(),
		campaignName: playerExport.campaignName,
		campaignDescription: playerExport.campaignDescription,
		entities: playerExport.entities.map(entity => filterEntity(entity, options))
	};

	// Pretty-print with 2-space indentation
	return JSON.stringify(exportData, null, 2);
}

/**
 * Filters an entity based on export options
 */
function filterEntity(entity: PlayerEntity, options: PlayerExportOptions): any {
	const filtered: any = {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		description: entity.description
	};

	// Optional summary field
	if (entity.summary !== undefined) {
		filtered.summary = entity.summary;
	}

	// Always include tags, fields, and links
	filtered.tags = entity.tags;
	filtered.fields = entity.fields;
	filtered.links = entity.links;

	// Include imageUrl if option is set and entity has it
	if (options.includeImages !== false && entity.imageUrl !== undefined) {
		filtered.imageUrl = entity.imageUrl;
	}

	// Include timestamps if option is set
	if (options.includeTimestamps !== false) {
		filtered.createdAt = entity.createdAt.toISOString();
		filtered.updatedAt = entity.updatedAt.toISOString();
	}

	return filtered;
}
