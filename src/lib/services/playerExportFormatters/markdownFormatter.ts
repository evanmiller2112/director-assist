/**
 * Markdown Formatter for Player Exports
 *
 * Produces well-structured Markdown suitable for:
 * - Pasting into wikis (Notion, Obsidian, etc.)
 * - Version control (readable diffs)
 * - Note-taking applications
 */
import type { PlayerExport, PlayerExportOptions, PlayerEntity, PlayerEntityLink } from '$lib/types/playerExport';

/**
 * Formats a player export as Markdown
 * @param playerExport The player export data
 * @param options Export options
 * @returns Markdown string
 */
export function formatAsMarkdown(playerExport: PlayerExport, options: PlayerExportOptions): string {
	const parts: string[] = [];

	// Campaign header
	parts.push(`# ${escapeMd(playerExport.campaignName)}`);
	parts.push('');
	parts.push(escapeMd(playerExport.campaignDescription));
	parts.push('');

	// Export metadata
	parts.push('---');
	parts.push('');
	parts.push('**Export Information**');
	parts.push('');
	parts.push(`- Version: ${escapeMd(playerExport.version)}`);
	parts.push(`- Exported: ${formatDate(playerExport.exportedAt)}`);
	parts.push('');

	// Table of contents
	if (playerExport.entities.length > 0) {
		parts.push('---');
		parts.push('');
		parts.push('## Table of Contents');
		parts.push('');
		parts.push(renderTableOfContents(playerExport.entities, options));
		parts.push('');
	}

	parts.push('---');
	parts.push('');

	// Entity content
	if (playerExport.entities.length === 0) {
		parts.push('*No entities to display.*');
	} else {
		if (options.groupByType) {
			parts.push(renderEntitiesGrouped(playerExport.entities, options));
		} else {
			parts.push(renderEntitiesFlat(playerExport.entities, options));
		}
	}

	return parts.join('\n');
}

/**
 * Renders table of contents
 */
function renderTableOfContents(entities: PlayerEntity[], options: PlayerExportOptions): string {
	const parts: string[] = [];

	if (options.groupByType) {
		const grouped = groupByType(entities);

		for (const [type, typeEntities] of Object.entries(grouped)) {
			const typeAnchor = createAnchor(capitalizeType(type));
			parts.push(`- [${capitalizeType(type)}](#${typeAnchor})`);

			for (const entity of typeEntities) {
				const anchor = createAnchor(entity.name);
				parts.push(`  - [${escapeMd(entity.name)}](#${anchor})`);
			}
		}
	} else {
		for (const entity of entities) {
			const anchor = createAnchor(entity.name);
			parts.push(`- [${escapeMd(entity.name)}](#${anchor})`);
		}
	}

	return parts.join('\n');
}

/**
 * Renders entities grouped by type
 */
function renderEntitiesGrouped(entities: PlayerEntity[], options: PlayerExportOptions): string {
	const grouped = groupByType(entities);
	const parts: string[] = [];

	for (const [type, typeEntities] of Object.entries(grouped)) {
		parts.push(`## ${capitalizeType(type)}`);
		parts.push('');

		for (const entity of typeEntities) {
			parts.push(renderEntity(entity, options));
			parts.push('');
		}
	}

	return parts.join('\n');
}

/**
 * Renders entities in flat list
 */
function renderEntitiesFlat(entities: PlayerEntity[], options: PlayerExportOptions): string {
	return entities.map(entity => renderEntity(entity, options)).join('\n\n');
}

/**
 * Renders a single entity
 */
function renderEntity(entity: PlayerEntity, options: PlayerExportOptions): string {
	const parts: string[] = [];

	// Entity name and type
	parts.push(`### ${escapeMd(entity.name)}`);
	parts.push('');
	parts.push(`**Type:** ${escapeMd(entity.type)} | **ID:** ${escapeMd(entity.id)}`);
	parts.push('');

	// Image
	if (options.includeImages !== false && entity.imageUrl) {
		parts.push(`![${escapeMd(entity.name)}](${entity.imageUrl})`);
		parts.push('');
	}

	// Description (only render if non-empty)
	if (entity.description) {
		parts.push(escapeMd(entity.description));
		parts.push('');
	}

	// Summary
	if (entity.summary) {
		parts.push(`*${escapeMd(entity.summary)}*`);
		parts.push('');
	}

	// Tags
	if (entity.tags.length > 0) {
		parts.push(`**Tags:** ${entity.tags.map(tag => `\`${escapeMd(tag)}\``).join(', ')}`);
		parts.push('');
	}

	// Fields
	if (Object.keys(entity.fields).length > 0) {
		parts.push('**Fields:**');
		parts.push('');
		for (const [key, value] of Object.entries(entity.fields)) {
			parts.push(`- **${escapeMd(key)}:** ${escapeMd(formatFieldValue(value))}`);
		}
		parts.push('');
	}

	// Links
	if (entity.links.length > 0) {
		parts.push('**Relationships:**');
		parts.push('');
		for (const link of entity.links) {
			parts.push(`- ${renderLink(link)}`);
		}
		parts.push('');
	}

	// Timestamps (guard against undefined)
	if (options.includeTimestamps !== false && entity.createdAt && entity.updatedAt) {
		parts.push(`*Created: ${formatDate(entity.createdAt)} | Updated: ${formatDate(entity.updatedAt)}*`);
		parts.push('');
	}

	parts.push('---');

	return parts.join('\n');
}

/**
 * Renders a link/relationship
 */
function renderLink(link: PlayerEntityLink): string {
	const parts: string[] = [];

	parts.push(`**${escapeMd(link.relationship)}**`);
	parts.push(` → ${escapeMd(link.targetType)}: \`${escapeMd(link.targetId)}\``);

	if (link.bidirectional && link.reverseRelationship) {
		parts.push(` ↔ ${escapeMd(link.reverseRelationship)}`);
	}

	if (link.strength) {
		parts.push(` [${escapeMd(link.strength)}]`);
	}

	return parts.join('');
}

/**
 * Groups entities by type
 */
function groupByType(entities: PlayerEntity[]): Record<string, PlayerEntity[]> {
	const grouped: Record<string, PlayerEntity[]> = {};

	for (const entity of entities) {
		if (!grouped[entity.type]) {
			grouped[entity.type] = [];
		}
		grouped[entity.type].push(entity);
	}

	return grouped;
}

/**
 * Capitalizes entity type for display
 */
function capitalizeType(type: string): string {
	if (type === 'npc') return 'NPCs';
	return type.charAt(0).toUpperCase() + type.slice(1) + 's';
}

/**
 * Formats a field value for display
 */
function formatFieldValue(value: any): string {
	if (Array.isArray(value)) {
		return value.join(', ');
	}
	if (typeof value === 'object' && value !== null) {
		return JSON.stringify(value);
	}
	return String(value);
}

/**
 * Formats a date for display
 */
function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

/**
 * Creates an anchor link from text
 */
function createAnchor(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

/**
 * Escapes Markdown special characters
 * Protects: * _ [ ] # < > \ |
 * Note: Underscores in the middle of words (like field_name) don't need
 * escaping in modern markdown, as they only trigger emphasis when surrounded
 * by spaces or at word boundaries. We only escape truly problematic patterns.
 */
function escapeMd(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/\*/g, '\\*')
		// Only escape underscores that could trigger emphasis (at word boundaries)
		.replace(/\b_/g, '\\_')
		.replace(/_\b/g, '\\_')
		.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]')
		.replace(/#/g, '\\#')
		.replace(/</g, '\\<')
		.replace(/>/g, '\\>')
		.replace(/\|/g, '\\|');
}
