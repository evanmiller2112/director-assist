import type { BaseEntity, EntityId, Campaign } from '$lib/types';
import { entityRepository } from '$lib/db/repositories';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';

export interface ContextOptions {
	/** Maximum entities to include */
	maxEntities?: number;
	/** Maximum total character count for context */
	maxCharacters?: number;
	/** Include linked entities automatically */
	includeLinked?: boolean;
	/** Specific entity IDs to include */
	entityIds?: EntityId[];
	/** Filter by entity types */
	entityTypes?: string[];
	/** Send all entities instead of just selected IDs */
	sendAll?: boolean;
	/** Detail level for entity context */
	detailLevel?: 'summary' | 'full';
	/** Campaign metadata to include */
	campaign?: Campaign;
}

export interface EntityContext {
	id: EntityId;
	type: string;
	name: string;
	summary: string;
}

export interface BuiltContext {
	entities: EntityContext[];
	totalCharacters: number;
	truncated: boolean;
	campaignContext?: string;
	relationshipContext?: string;
}

const DEFAULT_OPTIONS: Required<Omit<ContextOptions, 'campaign'>> & { campaign?: Campaign } = {
	maxEntities: 50,
	maxCharacters: 8000,
	includeLinked: true,
	entityIds: [],
	entityTypes: [],
	sendAll: false,
	detailLevel: 'summary',
	campaign: undefined
};

/**
 * Build context from entity summaries for chat AI injection.
 * Respects token/character limits and can filter by entity types.
 */
export async function buildContext(options: ContextOptions = {}): Promise<BuiltContext> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Adjust maxCharacters based on detail level if not explicitly provided
	const maxCharacters = options.maxCharacters !== undefined
		? options.maxCharacters
		: (opts.detailLevel === 'full' ? 30000 : 6000);

	const result: BuiltContext = {
		entities: [],
		totalCharacters: 0,
		truncated: false
	};

	// Get entities based on options
	let entities: BaseEntity[] = [];

	if (opts.sendAll) {
		// Get all entities from database
		entities = await entityRepository.getAllArray();
	} else if (opts.entityIds && opts.entityIds.length > 0) {
		// Get specific entities
		entities = await entityRepository.getByIds(opts.entityIds);

		// Optionally include linked entities
		if (opts.includeLinked) {
			const linkedIds = new Set<string>();
			for (const entity of entities) {
				// Get all linked entity IDs (both forward and reverse)
				const allLinked = await entityRepository.getAllLinkedIds(entity.id);
				for (const linkedId of allLinked) {
					// Don't include already-selected entities
					if (!opts.entityIds.includes(linkedId)) {
						linkedIds.add(linkedId);
					}
				}
			}
			if (linkedIds.size > 0) {
				const linkedEntities = await entityRepository.getByIds([...linkedIds]);
				entities = [...entities, ...linkedEntities];
			}
		}
	}

	// Filter by type if specified
	if (opts.entityTypes && opts.entityTypes.length > 0) {
		entities = entities.filter((e) => opts.entityTypes!.includes(e.type));
	}

	// Build campaign context if provided
	if (opts.campaign) {
		const campaignContext = buildCampaignMetadataContext(opts.campaign);
		result.campaignContext = campaignContext;
		result.totalCharacters += campaignContext.length;
	}

	// Build context entries
	const fullEntities: BaseEntity[] = [];
	for (const entity of entities) {
		// In summary mode, skip entities without summaries
		if (opts.detailLevel === 'summary' && (!entity.summary || entity.summary.trim() === '')) {
			continue;
		}

		if (result.entities.length >= opts.maxEntities) {
			result.truncated = true;
			break;
		}

		const typeDefinition = getEntityTypeDefinition(entity.type);
		const contextEntry: EntityContext = {
			id: entity.id,
			type: typeDefinition?.label ?? entity.type,
			name: entity.name,
			summary: entity.summary || ''
		};

		const entryText = opts.detailLevel === 'full'
			? buildFullEntityContext(entity)
			: formatContextEntry(contextEntry);
		const newTotal = result.totalCharacters + entryText.length + 1; // +1 for newline

		if (newTotal > maxCharacters) {
			result.truncated = true;
			break;
		}

		result.entities.push(contextEntry);
		result.totalCharacters = newTotal;
		fullEntities.push(entity);
	}

	// Build relationship context
	if (fullEntities.length > 0) {
		const relationshipContext = buildRelationshipGraphContext(fullEntities);
		if (relationshipContext) {
			result.relationshipContext = relationshipContext;
			result.totalCharacters += relationshipContext.length;
		}
	}

	return result;
}

/**
 * Format a single entity context entry for display/injection.
 */
export function formatContextEntry(entry: EntityContext): string {
	return `[${entry.type}] ${entry.name}: ${entry.summary}`;
}

/**
 * Format the full context for injection into a chat prompt.
 */
export function formatContextForPrompt(context: BuiltContext): string {
	const sections: string[] = [];

	// Add campaign metadata if present
	if (context.campaignContext) {
		sections.push('=== Campaign Information ===\n' + context.campaignContext);
	}

	// Add entity context
	if (context.entities.length > 0) {
		const header = '=== Campaign Context ===\n';
		const entries = context.entities.map(formatContextEntry).join('\n');
		const footer = context.truncated
			? '\n(Additional entities available but not included due to context limits)'
			: '';
		sections.push(header + entries + footer);
	}

	// Add relationship context if present
	if (context.relationshipContext) {
		sections.push('=== Relationships ===\n' + context.relationshipContext);
	}

	return sections.join('\n\n');
}

/**
 * Get a summary of how much context is being used.
 */
export function getContextStats(context: BuiltContext): {
	entityCount: number;
	characterCount: number;
	estimatedTokens: number;
	truncated: boolean;
} {
	return {
		entityCount: context.entities.length,
		characterCount: context.totalCharacters,
		// Rough estimate: ~4 characters per token
		estimatedTokens: Math.ceil(context.totalCharacters / 4),
		truncated: context.truncated
	};
}

/**
 * Build full entity context with all details.
 */
export function buildFullEntityContext(entity: BaseEntity): string {
	const typeDefinition = getEntityTypeDefinition(entity.type);
	const typeLabel = typeDefinition?.label ?? entity.type;

	const parts: string[] = [];

	// Name and type
	parts.push(`[${typeLabel}] ${entity.name}`);

	// Summary
	if (entity.summary && entity.summary.trim()) {
		parts.push(`Summary: ${entity.summary}`);
	}

	// Description
	if (entity.description && entity.description.trim()) {
		parts.push(`Description: ${entity.description}`);
	}

	// Fields
	if (entity.fields && Object.keys(entity.fields).length > 0) {
		const fieldEntries: string[] = [];
		for (const [key, value] of Object.entries(entity.fields)) {
			if (value !== null && value !== undefined) {
				fieldEntries.push(`  ${key}: ${formatFieldValue(value)}`);
			}
		}
		if (fieldEntries.length > 0) {
			parts.push(`Fields:\n${fieldEntries.join('\n')}`);
		}
	}

	// Notes
	if (entity.notes && entity.notes.trim()) {
		parts.push(`Notes: ${entity.notes}`);
	}

	return parts.join('\n');
}

/**
 * Format a field value for display.
 */
function formatFieldValue(value: any): string {
	if (Array.isArray(value)) {
		return value.join(', ');
	} else if (typeof value === 'object' && value !== null) {
		// Handle ResourceValue-like objects
		if ('current' in value && 'max' in value) {
			return `${value.current}/${value.max}`;
		}
		return JSON.stringify(value);
	}
	return String(value);
}

/**
 * Build campaign metadata context.
 */
export function buildCampaignMetadataContext(campaign: Campaign): string {
	const parts: string[] = [];

	if (campaign.name && campaign.name.trim()) {
		parts.push(`Campaign: ${campaign.name}`);
	}

	if (campaign.system && campaign.system.trim()) {
		parts.push(`System: ${campaign.system}`);
	}

	if (campaign.setting && campaign.setting.trim()) {
		parts.push(`Setting: ${campaign.setting}`);
	}

	if (campaign.description && campaign.description.trim()) {
		parts.push(`Description: ${campaign.description}`);
	}

	return parts.join('\n');
}

/**
 * Build relationship graph context showing connections between entities.
 */
export function buildRelationshipGraphContext(entities: BaseEntity[]): string {
	if (entities.length === 0) {
		return '';
	}

	const entityIds = new Set(entities.map(e => e.id));
	const entityMap = new Map(entities.map(e => [e.id, e]));
	const relationships: string[] = [];
	const processedPairs = new Set<string>();

	for (const entity of entities) {
		if (!entity.links || entity.links.length === 0) {
			continue;
		}

		for (const link of entity.links) {
			// Only include links to entities in our context
			if (!entityIds.has(link.targetId)) {
				continue;
			}

			// Create a canonical pair ID to detect duplicates
			const pairId = [entity.id, link.targetId].sort().join('|');

			// For bidirectional links, only show once
			if (link.bidirectional) {
				if (processedPairs.has(pairId)) {
					continue;
				}
				processedPairs.add(pairId);

				const targetEntity = entityMap.get(link.targetId);
				if (targetEntity) {
					if (link.reverseRelationship) {
						// Show both directions for asymmetric bidirectional
						relationships.push(
							`${entity.name} [${link.relationship}] ${targetEntity.name}`,
							`${targetEntity.name} [${link.reverseRelationship}] ${entity.name}`
						);
					} else {
						// Show single line for symmetric bidirectional
						relationships.push(`${entity.name} [${link.relationship}] ${targetEntity.name}`);
					}
				}
			} else {
				// Unidirectional link
				const targetEntity = entityMap.get(link.targetId);
				if (targetEntity) {
					relationships.push(`${entity.name} [${link.relationship}] ${targetEntity.name}`);
				}
			}
		}
	}

	return relationships.length > 0 ? relationships.join('\n') : '';
}
