import type { BaseEntity, EntityId } from '$lib/types';
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
}

const DEFAULT_OPTIONS: Required<ContextOptions> = {
	maxEntities: 50,
	maxCharacters: 8000,
	includeLinked: true,
	entityIds: [],
	entityTypes: []
};

/**
 * Build context from entity summaries for chat AI injection.
 * Respects token/character limits and can filter by entity types.
 */
export async function buildContext(options: ContextOptions = {}): Promise<BuiltContext> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const result: BuiltContext = {
		entities: [],
		totalCharacters: 0,
		truncated: false
	};

	// Get entities based on options
	let entities: BaseEntity[] = [];

	if (opts.entityIds && opts.entityIds.length > 0) {
		// Get specific entities
		entities = await entityRepository.getByIds(opts.entityIds);

		// Optionally include linked entities
		if (opts.includeLinked) {
			const linkedIds = new Set<string>();
			for (const entity of entities) {
				for (const link of entity.links) {
					// Don't include already-selected entities
					if (!opts.entityIds.includes(link.targetId)) {
						linkedIds.add(link.targetId);
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

	// Only include entities with summaries
	entities = entities.filter((e) => e.summary && e.summary.trim() !== '');

	// Build context entries
	for (const entity of entities) {
		if (result.entities.length >= opts.maxEntities) {
			result.truncated = true;
			break;
		}

		const typeDefinition = getEntityTypeDefinition(entity.type);
		const contextEntry: EntityContext = {
			id: entity.id,
			type: typeDefinition?.label ?? entity.type,
			name: entity.name,
			summary: entity.summary!
		};

		const entryText = formatContextEntry(contextEntry);
		const newTotal = result.totalCharacters + entryText.length + 1; // +1 for newline

		if (newTotal > opts.maxCharacters) {
			result.truncated = true;
			break;
		}

		result.entities.push(contextEntry);
		result.totalCharacters = newTotal;
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
	if (context.entities.length === 0) {
		return '';
	}

	const header = '=== Campaign Context ===\n';
	const entries = context.entities.map(formatContextEntry).join('\n');
	const footer = context.truncated
		? '\n(Additional entities available but not included due to context limits)'
		: '';

	return header + entries + footer;
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
