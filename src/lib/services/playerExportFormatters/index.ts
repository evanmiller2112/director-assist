/**
 * Unified Player Export Formatter
 *
 * Routes to the appropriate formatter based on format option.
 */
import type { PlayerExport, PlayerExportOptions } from '$lib/types/playerExport';
import { formatAsJson } from './jsonFormatter';
import { formatAsHtml } from './htmlFormatter';
import { formatAsMarkdown } from './markdownFormatter';

/**
 * Formats a player export in the specified format
 * @param playerExport The player export data
 * @param options Export options including format
 * @returns Formatted string in the requested format
 * @throws Error if format is not supported
 */
export function formatPlayerExport(playerExport: PlayerExport, options: PlayerExportOptions): string {
	switch (options.format) {
		case 'json':
			return formatAsJson(playerExport, options);
		case 'html':
			return formatAsHtml(playerExport, options);
		case 'markdown':
			return formatAsMarkdown(playerExport, options);
		default:
			throw new Error(`Unknown export format: ${options.format}`);
	}
}
