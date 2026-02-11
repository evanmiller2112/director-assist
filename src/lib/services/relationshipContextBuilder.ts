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

/**
 * Information about a single relationship (for grouped context)
 */
export interface RelationshipInfo {
	relationship: string;
	direction: 'outgoing' | 'incoming';
	depth: number;
	strength?: 'strong' | 'moderate' | 'weak';
	notes?: string;
}

/**
 * A related entity with all its relationships grouped together
 */
export interface GroupedRelatedEntityContext {
	entityId: EntityId;
	entityType: EntityType;
	name: string;
	summary: string;
	relationships: RelationshipInfo[];
}

/**
 * Complete grouped relationship context for an entity
 */
export interface GroupedRelationshipContext {
	sourceEntityId: EntityId;
	sourceEntityName: string;
	relatedEntities: GroupedRelatedEntityContext[];
	totalCharacters: number;
	truncated: boolean;
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

	const relatedEntitiesMap = new Map<string, RelatedEntityContext>();

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

					// Create composite key: entityId|relationship|direction
					const compositeKey = `${link.targetId}|${link.relationship}|outgoing`;

					// Skip if already visited (at this or shallower depth)
					const existingEntry = relatedEntitiesMap.get(compositeKey);
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

					relatedEntitiesMap.set(compositeKey, entry);

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

				// Create composite key: entityId|relationship|direction
				const compositeKey = `${incomingEntity.id}|${link.relationship}|incoming`;

				// Skip if already exists with this relationship
				if (relatedEntitiesMap.has(compositeKey)) {
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

				relatedEntitiesMap.set(compositeKey, entry);
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

/**
 * Build grouped relationship context for an entity.
 * Groups multiple relationships to the same entity together, avoiding duplicate entity data.
 */
export async function buildGroupedRelationshipContext(
	sourceEntityId: EntityId,
	options: RelationshipContextOptions = {}
): Promise<GroupedRelationshipContext> {
	// First, get the full relationship context with high limits and no character limit
	// We'll apply our own limits based on the grouped format
	const fullContext = await buildRelationshipContext(sourceEntityId, {
		...options,
		maxRelatedEntities: 1000, // High limit to get all relationships
		maxCharacters: 1000000 // Very high limit, we'll apply our own
	});

	// Group relationships by entity ID
	const entityGroups = new Map<EntityId, GroupedRelatedEntityContext>();

	for (const relatedEntity of fullContext.relatedEntities) {
		let grouped = entityGroups.get(relatedEntity.entityId);

		if (!grouped) {
			// Create new grouped entry
			grouped = {
				entityId: relatedEntity.entityId,
				entityType: relatedEntity.entityType,
				name: relatedEntity.name,
				summary: relatedEntity.summary,
				relationships: []
			};
			entityGroups.set(relatedEntity.entityId, grouped);
		}

		// Add relationship info
		const relationshipInfo: RelationshipInfo = {
			relationship: relatedEntity.relationship,
			direction: relatedEntity.direction,
			depth: relatedEntity.depth
		};

		if (relatedEntity.strength) {
			relationshipInfo.strength = relatedEntity.strength;
		}

		if (relatedEntity.notes) {
			relationshipInfo.notes = relatedEntity.notes;
		}

		grouped.relationships.push(relationshipInfo);
	}

	// Convert map to array
	const allGroupedEntities = Array.from(entityGroups.values());

	// Apply maxRelatedEntities limit (now it's unique entity count)
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let entitiesToInclude = allGroupedEntities;
	let truncated = false;

	if (allGroupedEntities.length > opts.maxRelatedEntities) {
		entitiesToInclude = allGroupedEntities.slice(0, opts.maxRelatedEntities);
		truncated = true;
	}

	// Apply maxCharacters limit based on grouped format
	const finalEntities: GroupedRelatedEntityContext[] = [];

	// Calculate header and potential footer lengths
	const header = `=== Relationships for ${fullContext.sourceEntityName} ===\n`;
	const footer =
		'\n(Context truncated - additional relationships available but not included due to limits)';

	let runningTotal = header.length;

	// Try to fit entities within the character limit
	for (const groupedEntity of entitiesToInclude) {
		const formatted = formatGroupedEntityEntry(groupedEntity);
		const entryLength = formatted.length + 1; // +1 for newline separator

		// Calculate remaining budget
		const remainingBudget = opts.maxCharacters - runningTotal - footer.length;

		// Check if adding this entity would exceed the limit
		if (entryLength > remainingBudget) {
			// If we haven't added any entities yet, truncate this one to fit
			if (finalEntities.length === 0) {
				// Truncate the summary to fit within budget
				const maxSummaryLength = Math.max(50, remainingBudget - 200); // Reserve space for other parts
				const truncatedEntity = {
					...groupedEntity,
					summary:
						groupedEntity.summary.length > maxSummaryLength
							? groupedEntity.summary.substring(0, maxSummaryLength) + '...'
							: groupedEntity.summary
				};
				finalEntities.push(truncatedEntity);
				const truncatedFormatted = formatGroupedEntityEntry(truncatedEntity);
				runningTotal += truncatedFormatted.length + 1;
				truncated = true;
			} else {
				// We have other entities, just stop here
				truncated = true;
			}
			break;
		} else {
			finalEntities.push(groupedEntity);
			runningTotal += entryLength;
		}
	}

	// Add footer length if truncated
	const totalCharacters = truncated ? runningTotal + footer.length : runningTotal;

	return {
		sourceEntityId: fullContext.sourceEntityId,
		sourceEntityName: fullContext.sourceEntityName,
		relatedEntities: finalEntities,
		totalCharacters,
		truncated
	};
}

/**
 * Format a single grouped entity entry for display.
 * Format: Name (Type) - Relationships: rel1, rel2, rel3
 *   Summary: summary...
 *   [Strength: strong] [Notes: notes] (per relationship if applicable)
 */
export function formatGroupedEntityEntry(entry: GroupedRelatedEntityContext): string {
	const typeDefinition = getEntityTypeDefinition(entry.entityType);
	const typeName = typeDefinition?.label ?? capitalizeFirstLetter(entry.entityType);

	// Format relationship list
	const relationshipsList = entry.relationships.map((r) => r.relationship).join(', ');

	// Remove entity name from summary to avoid duplication
	// buildPrivacySafeSummary includes the name at the start
	let summary = entry.summary;
	if (summary.startsWith(entry.name + '. ')) {
		summary = summary.substring(entry.name.length + 2);
	} else if (summary.startsWith(entry.name + ', ')) {
		summary = summary.substring(entry.name.length + 2);
	} else if (summary === entry.name) {
		summary = '(No additional details)';
	}

	let formatted = `${entry.name} (${typeName}) - Relationships: ${relationshipsList}\n`;
	formatted += `  Summary: ${summary}`;

	// Add strength and notes for each relationship if present
	for (const rel of entry.relationships) {
		if (rel.strength || rel.notes) {
			formatted += '\n  ';
			const details: string[] = [];

			if (rel.strength) {
				details.push(`[Strength: ${rel.strength}]`);
			}

			if (rel.notes) {
				details.push(`[Notes: ${rel.notes}]`);
			}

			formatted += `${rel.relationship}: ${details.join(' ')}`;
		}
	}

	return formatted;
}

/**
 * Format complete grouped relationship context for AI prompt injection.
 */
export function formatGroupedRelationshipContextForPrompt(
	context: GroupedRelationshipContext
): string {
	const header = `=== Relationships for ${context.sourceEntityName} ===\n`;

	if (context.relatedEntities.length === 0) {
		return header + 'No relationships found.\n';
	}

	const entries = context.relatedEntities
		.map((entry) => formatGroupedEntityEntry(entry))
		.join('\n');

	const footer = context.truncated
		? '\n(Context truncated - additional relationships available but not included due to limits)'
		: '';

	return header + entries + footer;
}
