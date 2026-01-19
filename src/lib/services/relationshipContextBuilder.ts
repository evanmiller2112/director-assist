import type { BaseEntity, EntityId, EntityType } from '$lib/types';
import { entityRepository } from '$lib/db/repositories';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';

/**
 * Options for building relationship context
 */
export interface RelationshipContextOptions {
	/** Maximum number of related entities to include (default: 20) */
	maxRelatedEntities?: number;
	/** Maximum total character count for context (default: 4000) */
	maxCharacters?: number;
	/** Direction of relationships to include (default: 'both') */
	direction?: 'outgoing' | 'incoming' | 'both';
	/** Filter by specific relationship types */
	relationshipTypes?: string[];
	/** Filter by specific entity types */
	entityTypes?: EntityType[];
	/** Maximum depth of relationship traversal (default: 1) */
	maxDepth?: number;
	/** Include relationship strength (default: false) */
	includeStrength?: boolean;
	/** Include relationship notes (default: false) */
	includeNotes?: boolean;
}

/**
 * Context entry for a related entity
 */
export interface RelatedEntityContext {
	relationship: string;
	entityId: EntityId;
	entityType: EntityType;
	name: string;
	summary: string;
	direction: 'outgoing' | 'incoming';
	depth: number;
	strength?: 'strong' | 'moderate' | 'weak';
	notes?: string;
}

/**
 * Complete relationship context for an entity
 */
export interface RelationshipContext {
	sourceEntityId: EntityId;
	sourceEntityName: string;
	relatedEntities: RelatedEntityContext[];
	totalCharacters: number;
	truncated: boolean;
}

/**
 * Statistics about relationship context
 */
export interface RelationshipContextStats {
	relatedEntityCount: number;
	characterCount: number;
	estimatedTokens: number;
	truncated: boolean;
	relationshipBreakdown: Record<string, number>;
	entityTypeBreakdown: Record<string, number>;
}

const DEFAULT_OPTIONS: Required<RelationshipContextOptions> = {
	maxRelatedEntities: 20,
	maxCharacters: 4000,
	direction: 'both',
	relationshipTypes: [],
	entityTypes: [],
	maxDepth: 1,
	includeStrength: false,
	includeNotes: false
};

/**
 * Build relationship context for an entity.
 * Gathers related entities based on links with privacy protection.
 */
export async function buildRelationshipContext(
	sourceEntityId: EntityId,
	options: RelationshipContextOptions = {}
): Promise<RelationshipContext> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Get source entity
	const sourceEntity = await entityRepository.getById(sourceEntityId);
	if (!sourceEntity) {
		throw new Error(`Entity not found: ${sourceEntityId}`);
	}

	const result: RelationshipContext = {
		sourceEntityId,
		sourceEntityName: sourceEntity.name,
		relatedEntities: [],
		totalCharacters: 0,
		truncated: false
	};

	// Track visited entities to prevent circular references
	const visited = new Set<EntityId>([sourceEntityId]);

	// Collect related entities with depth traversal
	// We'll process the source entity first, then queue up deeper relationships
	const toProcess: Array<{ entity: BaseEntity; depth: number }> = [
		{ entity: sourceEntity, depth: 0 }
	];

	const relatedEntitiesMap = new Map<EntityId, RelatedEntityContext>();

	while (toProcess.length > 0) {
		const { entity, depth } = toProcess.shift()!;

		// Don't process entities beyond maxDepth-1, as they would create entries at maxDepth+1
		if (depth >= opts.maxDepth) {
			continue;
		}

		// Process outgoing relationships
		if (opts.direction === 'outgoing' || opts.direction === 'both') {
			// Only process if entity has links
			if (entity.links.length > 0) {
				// Collect all target IDs from links
				const targetIds = entity.links.map((link) => link.targetId);

				// Fetch all target entities in one call
				const targetEntities = await entityRepository.getByIds(targetIds);
				if (!targetEntities) continue; // Skip if fetch failed
				const targetEntitiesMap = new Map(targetEntities.map((e) => [e.id, e]));

				for (const link of entity.links) {
					// Apply relationship type filter
					if (
						opts.relationshipTypes.length > 0 &&
						!opts.relationshipTypes.includes(link.relationship)
					) {
						continue;
					}

					// Skip if already visited (at this or shallower depth)
					const existingEntry = relatedEntitiesMap.get(link.targetId);
					if (existingEntry && existingEntry.depth <= depth + 1) {
						continue;
					}

					// Get the target entity
					const targetEntity = targetEntitiesMap.get(link.targetId);
					if (!targetEntity) continue;

					// Apply entity type filter
					if (opts.entityTypes.length > 0 && !opts.entityTypes.includes(targetEntity.type)) {
						continue;
					}

					// Skip self-references at depth 1
					if (link.targetId === sourceEntityId && depth === 0) {
						continue;
					}

					// Build privacy-safe summary
					const summary = buildPrivacySafeSummary(targetEntity);

					// Create context entry
					const entry: RelatedEntityContext = {
						relationship: link.relationship,
						entityId: link.targetId,
						entityType: targetEntity.type,
						name: targetEntity.name,
						summary,
						direction: 'outgoing',
						depth: depth + 1
					};

					// Add optional fields
					if (opts.includeStrength && link.strength) {
						entry.strength = link.strength;
					}
					if (opts.includeNotes && link.notes) {
						entry.notes = link.notes;
					}

					relatedEntitiesMap.set(link.targetId, entry);

					// Add to processing queue if not visited and the new depth would be less than maxDepth
					// This allows processing at depth 1 to create depth 2 entries when maxDepth=2
					if (!visited.has(link.targetId) && depth + 1 < opts.maxDepth) {
						visited.add(link.targetId);
						toProcess.push({ entity: targetEntity, depth: depth + 1 });
					}
				}
			}
		}

		// Process incoming relationships (only at depth 0)
		if ((opts.direction === 'incoming' || opts.direction === 'both') && depth === 0) {
			const incomingEntities = await entityRepository.getEntitiesLinkingTo(entity.id);

			for (const incomingEntity of incomingEntities) {
				// Find the link that points to us
				const link = incomingEntity.links.find((l) => l.targetId === entity.id);
				if (!link) continue;

				// Apply relationship type filter
				if (
					opts.relationshipTypes.length > 0 &&
					!opts.relationshipTypes.includes(link.relationship)
				) {
					continue;
				}

				// Apply entity type filter
				if (opts.entityTypes.length > 0 && !opts.entityTypes.includes(incomingEntity.type)) {
					continue;
				}

				// Skip if already in outgoing
				if (relatedEntitiesMap.has(incomingEntity.id)) {
					continue;
				}

				// Build privacy-safe summary
				const summary = buildPrivacySafeSummary(incomingEntity);

				// Create context entry
				const entry: RelatedEntityContext = {
					relationship: link.relationship,
					entityId: incomingEntity.id,
					entityType: incomingEntity.type,
					name: incomingEntity.name,
					summary,
					direction: 'incoming',
					depth: 1
				};

				// Add optional fields
				if (opts.includeStrength && link.strength) {
					entry.strength = link.strength;
				}
				if (opts.includeNotes && link.notes) {
					entry.notes = link.notes;
				}

				relatedEntitiesMap.set(incomingEntity.id, entry);
			}
		}
	}

	// Convert map to array
	const allRelatedEntities = Array.from(relatedEntitiesMap.values());

	// Apply maxRelatedEntities limit
	let entitiesToInclude = allRelatedEntities;
	if (allRelatedEntities.length > opts.maxRelatedEntities) {
		entitiesToInclude = allRelatedEntities.slice(0, opts.maxRelatedEntities);
		result.truncated = true;
	}

	// Apply maxCharacters limit
	let runningTotal = 0;
	let finalEntities: RelatedEntityContext[] = [];

	for (let i = 0; i < entitiesToInclude.length; i++) {
		const entry = entitiesToInclude[i];
		let formatted = formatRelatedEntityEntry(entry);
		let entryLength = formatted.length + 1; // +1 for newline

		// Calculate remaining budget
		const remainingBudget = opts.maxCharacters - runningTotal;

		// If this entry would exceed the limit
		if (entryLength > remainingBudget) {
			// If we have no entries yet, truncate this one to fit
			if (finalEntities.length === 0) {
				const maxLength = Math.max(100, remainingBudget - 4); // -4 for "..." and newline
				formatted = formatted.substring(0, maxLength) + '...';
				entryLength = formatted.length + 1;
				finalEntities.push(entry);
				runningTotal += entryLength;
				result.truncated = true;
			} else {
				// We have other entries, just stop here
				result.truncated = true;
				break;
			}
		} else {
			// Entry fits within budget
			finalEntities.push(entry);
			runningTotal += entryLength;
		}
	}

	result.relatedEntities = finalEntities;
	result.totalCharacters = runningTotal;

	return result;
}

/**
 * Format a single related entity entry for display.
 * Format: [Relationship: member_of] Shadow Guild (Faction): summary...
 */
export function formatRelatedEntityEntry(entry: RelatedEntityContext): string {
	const typeDefinition = getEntityTypeDefinition(entry.entityType);
	const typeName = typeDefinition?.label ?? capitalizeFirstLetter(entry.entityType);

	let formatted = `[Relationship: ${entry.relationship}] ${entry.name} (${typeName}): ${entry.summary}`;

	if (entry.strength) {
		formatted += ` [Strength: ${entry.strength}]`;
	}

	if (entry.notes) {
		formatted += ` [Notes: ${entry.notes}]`;
	}

	return formatted;
}

/**
 * Format complete relationship context for AI prompt injection.
 */
export function formatRelationshipContextForPrompt(context: RelationshipContext): string {
	const header = `=== Relationships for ${context.sourceEntityName} ===\n`;

	if (context.relatedEntities.length === 0) {
		return header + 'No relationships found.\n';
	}

	const entries = context.relatedEntities.map((entry) => formatRelatedEntityEntry(entry)).join('\n');

	const footer = context.truncated
		? '\n(Context truncated - additional relationships available but not included due to limits)'
		: '';

	return header + entries + footer;
}

/**
 * Calculate statistics about the relationship context.
 */
export function getRelationshipContextStats(context: RelationshipContext): RelationshipContextStats {
	const relationshipBreakdown: Record<string, number> = {};
	const entityTypeBreakdown: Record<string, number> = {};

	for (const entry of context.relatedEntities) {
		// Count relationships
		relationshipBreakdown[entry.relationship] =
			(relationshipBreakdown[entry.relationship] || 0) + 1;

		// Count entity types
		entityTypeBreakdown[entry.entityType] = (entityTypeBreakdown[entry.entityType] || 0) + 1;
	}

	return {
		relatedEntityCount: context.relatedEntities.length,
		characterCount: context.totalCharacters,
		estimatedTokens: Math.ceil(context.totalCharacters / 4),
		truncated: context.truncated,
		relationshipBreakdown,
		entityTypeBreakdown
	};
}

/**
 * Build a privacy-safe summary of an entity.
 * Excludes hidden fields and secrets.
 */
export function buildPrivacySafeSummary(entity: BaseEntity): string {
	const typeDefinition = getEntityTypeDefinition(entity.type);
	const parts: string[] = [];

	// Start with entity name
	parts.push(entity.name);

	// Add summary if available
	if (entity.summary) {
		parts.push(entity.summary);
	}

	// Also add description if available (even if summary exists)
	if (entity.description) {
		const truncatedDesc =
			entity.description.length > 200
				? entity.description.substring(0, 200) + '...'
				: entity.description;
		parts.push(truncatedDesc);
	}

	// Add non-hidden, non-secret fields
	const fieldsToInclude: string[] = [];
	for (const [key, value] of Object.entries(entity.fields)) {
		// Skip empty values
		if (!value || value === '') continue;

		// Skip secrets field
		if (key === 'secrets') continue;

		// Skip notes field
		if (key === 'notes') continue;

		// Skip hidden section fields
		const fieldDef = typeDefinition?.fieldDefinitions.find((f) => f.key === key);
		if (fieldDef?.section === 'hidden') continue;

		const label = fieldDef?.label ?? key;
		const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
		fieldsToInclude.push(`${label}: ${displayValue}`);
	}

	if (fieldsToInclude.length > 0) {
		parts.push(fieldsToInclude.join(', '));
	}

	// Join parts
	let summary = parts.join('. ');

	// Truncate to reasonable length (500 chars max)
	if (summary.length > 500) {
		summary = summary.substring(0, 497) + '...';
	}

	return summary;
}

/**
 * Helper to capitalize first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
