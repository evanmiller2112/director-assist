/**
 * HTML Formatter for Player Exports
 *
 * Produces a complete, printable HTML document with:
 * - Proper document structure
 * - Embedded CSS styling
 * - Campaign metadata
 * - Entity sections (optionally grouped by type)
 */
import type { PlayerExport, PlayerExportOptions, PlayerEntity, PlayerEntityLink } from '$lib/types/playerExport';
import type { FieldValue } from '$lib/types';

/**
 * Formats a player export as HTML
 * @param playerExport The player export data
 * @param options Export options
 * @returns HTML document string
 */
export function formatAsHtml(playerExport: PlayerExport, options: PlayerExportOptions): string {
	const parts: string[] = [];

	// Document structure
	parts.push('<!DOCTYPE html>');
	parts.push('<html lang="en">');
	parts.push('<head>');
	parts.push('<meta charset="utf-8">');
	parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
	parts.push(`<title>${escapeHtml(playerExport.campaignName)}</title>`);
	parts.push(getStyles());
	parts.push('</head>');
	parts.push('<body>');

	// Campaign header
	parts.push('<header>');
	parts.push(`<h1>${escapeHtml(playerExport.campaignName)}</h1>`);
	parts.push(`<p class="campaign-description">${escapeHtml(playerExport.campaignDescription)}</p>`);
	parts.push('<div class="export-metadata">');
	parts.push(`<p>Export Version: ${escapeHtml(playerExport.version)}</p>`);
	parts.push(`<p>Exported: ${formatDate(playerExport.exportedAt)}</p>`);
	parts.push('</div>');
	parts.push('</header>');

	// Main content
	parts.push('<main>');

	if (playerExport.entities.length === 0) {
		parts.push('<p class="empty-message">No entities to display.</p>');
	} else {
		if (options.groupByType) {
			parts.push(renderEntitiesGrouped(playerExport.entities, options));
		} else {
			parts.push(renderEntitiesFlat(playerExport.entities, options));
		}
	}

	parts.push('</main>');
	parts.push('</body>');
	parts.push('</html>');

	return parts.join('\n');
}

/**
 * Renders entities grouped by type
 */
function renderEntitiesGrouped(entities: PlayerEntity[], options: PlayerExportOptions): string {
	const grouped = groupByType(entities);
	const parts: string[] = [];

	for (const [type, typeEntities] of Object.entries(grouped)) {
		parts.push(`<section class="entity-type-section">`);
		parts.push(`<h2>${escapeHtml(capitalizeType(type))}</h2>`);

		for (const entity of typeEntities) {
			parts.push(renderEntity(entity, options));
		}

		parts.push('</section>');
	}

	return parts.join('\n');
}

/**
 * Renders entities in flat list
 */
function renderEntitiesFlat(entities: PlayerEntity[], options: PlayerExportOptions): string {
	return entities.map(entity => renderEntity(entity, options)).join('\n');
}

/**
 * Renders a single entity
 */
function renderEntity(entity: PlayerEntity, options: PlayerExportOptions): string {
	const parts: string[] = [];

	parts.push('<article class="entity">');

	// Entity name
	parts.push(`<h3 class="entity-name">${escapeHtml(entity.name)}</h3>`);
	parts.push(`<p class="entity-type-badge">Type: ${escapeHtml(entity.type)} | ID: ${escapeHtml(entity.id)}</p>`);

	// Image
	if (options.includeImages !== false && entity.imageUrl) {
		parts.push(`<img src="${escapeHtml(entity.imageUrl)}" alt="${escapeHtml(entity.name)}" class="entity-image">`);
	}

	// Description (only render if non-empty)
	if (entity.description) {
		parts.push(`<p class="entity-description">${escapeHtml(entity.description)}</p>`);
	}

	// Summary
	if (entity.summary) {
		parts.push(`<p class="entity-summary"><em>${escapeHtml(entity.summary)}</em></p>`);
	}

	// Tags
	if (entity.tags.length > 0) {
		parts.push('<div class="entity-tags">');
		parts.push('<strong>Tags:</strong> ');
		parts.push(entity.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(', '));
		parts.push('</div>');
	}

	// Fields
	if (Object.keys(entity.fields).length > 0) {
		parts.push('<div class="entity-fields">');
		parts.push('<h4>Fields</h4>');
		parts.push('<dl>');
		for (const [key, value] of Object.entries(entity.fields)) {
			parts.push(`<dt>${escapeHtml(key)}</dt>`);
			parts.push(`<dd>${escapeHtml(formatFieldValue(value))}</dd>`);
		}
		parts.push('</dl>');
		parts.push('</div>');
	}

	// Links
	if (entity.links.length > 0) {
		parts.push('<div class="entity-links">');
		parts.push('<h4>Relationships</h4>');
		parts.push('<ul>');
		for (const link of entity.links) {
			parts.push('<li>');
			parts.push(renderLink(link));
			parts.push('</li>');
		}
		parts.push('</ul>');
		parts.push('</div>');
	}

	// Timestamps (guard against undefined)
	if (options.includeTimestamps !== false && entity.createdAt && entity.updatedAt) {
		parts.push('<div class="entity-timestamps">');
		parts.push(`<p><small>Created: ${formatDate(entity.createdAt)} | Updated: ${formatDate(entity.updatedAt)}</small></p>`);
		parts.push('</div>');
	}

	parts.push('</article>');

	return parts.join('\n');
}

/**
 * Renders a link/relationship
 */
function renderLink(link: PlayerEntityLink): string {
	const parts: string[] = [];

	parts.push(`<strong>${escapeHtml(link.relationship)}</strong>`);
	parts.push(` → ${escapeHtml(link.targetType)}: ${escapeHtml(link.targetId)}`);

	if (link.bidirectional && link.reverseRelationship) {
		parts.push(` (↔ ${escapeHtml(link.reverseRelationship)})`);
	}

	if (link.strength) {
		parts.push(` [${escapeHtml(link.strength)}]`);
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
function formatFieldValue(value: FieldValue): string {
	if (value === null || value === undefined) {
		return '';
	}
	if (Array.isArray(value)) {
		return value.join(', ');
	}
	if (typeof value === 'object') {
		// Handle ResourceValue and DurationValue objects
		if ('current' in value && 'max' in value) {
			return `${value.current}/${value.max}`;
		}
		if ('unit' in value) {
			return value.value ? `${value.value} ${value.unit}` : value.unit;
		}
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
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Returns embedded CSS styles
 */
function getStyles(): string {
	return `<style>
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	line-height: 1.6;
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	background: #f5f5f5;
	color: #333;
}

header {
	background: white;
	padding: 30px;
	margin-bottom: 30px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
	margin: 0 0 15px 0;
	color: #2c3e50;
	font-size: 2.5em;
}

h2 {
	color: #34495e;
	border-bottom: 2px solid #3498db;
	padding-bottom: 10px;
	margin-top: 30px;
}

h3 {
	color: #2c3e50;
	margin: 0 0 10px 0;
}

h4 {
	color: #34495e;
	margin: 15px 0 10px 0;
}

.campaign-description {
	font-size: 1.2em;
	color: #555;
	margin: 10px 0;
}

.export-metadata {
	margin-top: 15px;
	padding-top: 15px;
	border-top: 1px solid #ddd;
	color: #777;
	font-size: 0.9em;
}

.export-metadata p {
	margin: 5px 0;
}

main {
	background: white;
	padding: 30px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.entity {
	margin-bottom: 40px;
	padding-bottom: 30px;
	border-bottom: 1px solid #eee;
}

.entity:last-child {
	border-bottom: none;
}

.entity-name {
	font-size: 1.8em;
	margin-bottom: 5px;
}

.entity-type-badge {
	color: #777;
	font-size: 0.9em;
	margin: 5px 0 15px 0;
}

.entity-image {
	max-width: 400px;
	height: auto;
	margin: 15px 0;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.entity-description {
	margin: 15px 0;
	font-size: 1.05em;
}

.entity-summary {
	margin: 10px 0;
	color: #555;
}

.entity-tags {
	margin: 15px 0;
}

.tag {
	background: #e3f2fd;
	color: #1976d2;
	padding: 3px 10px;
	border-radius: 12px;
	font-size: 0.9em;
}

.entity-fields {
	margin: 20px 0;
	background: #f9f9f9;
	padding: 15px;
	border-radius: 4px;
}

.entity-fields dl {
	margin: 10px 0;
}

.entity-fields dt {
	font-weight: bold;
	color: #555;
	margin-top: 10px;
}

.entity-fields dd {
	margin: 5px 0 0 20px;
}

.entity-links {
	margin: 20px 0;
}

.entity-links ul {
	list-style: none;
	padding: 0;
}

.entity-links li {
	margin: 8px 0;
	padding: 8px;
	background: #f0f7ff;
	border-left: 3px solid #3498db;
	padding-left: 12px;
}

.entity-timestamps {
	margin-top: 15px;
	color: #999;
}

.empty-message {
	text-align: center;
	color: #999;
	font-style: italic;
	padding: 40px;
}

.entity-type-section {
	margin-bottom: 40px;
}

@media print {
	body {
		background: white;
	}

	header, main {
		box-shadow: none;
	}

	.entity {
		page-break-inside: avoid;
	}

	h2 {
		page-break-after: avoid;
	}
}
</style>`;
}
