/**
 * Enhancement Analyzer
 *
 * Detects entities that could be improved:
 * - Sparse entities: Minimal description/fields filled
 * - Missing summaries: Important entities without AI summaries
 * - Orphan entities: No relationships to other entities
 * - Missing core fields: Required-like fields that are empty
 */

import type { EntityId } from '$lib/types';
import type {
	AnalysisConfig,
	AnalysisResult,
	EntityAnalysisContext,
	SuggestionAnalyzer
} from './types';

/**
 * Core fields expected for each entity type
 */
const CORE_FIELDS_BY_TYPE: Record<string, string[]> = {
	character: ['class', 'level', 'alignment', 'background'],
	npc: ['role', 'personality'],
	location: ['region', 'type'],
	faction: ['leader', 'headquarters', 'goals'],
	item: ['type', 'rarity']
};

/**
 * Entity types that can naturally be orphaned (no relationships required)
 */
const ORPHAN_EXEMPT_TYPES = ['session', 'timeline_event', 'note'];

/**
 * Calculate sparsity score for an entity (0-100, higher = sparser)
 */
function calculateSparsityScore(entity: any): number {
	let score = 0;

	// Check description length
	const descLength = (entity.description || '').trim().length;
	if (descLength === 0) {
		score += 60; // Empty description is very sparse
	} else if (descLength < 20) {
		score += 40; // Very short description
	} else if (descLength < 50) {
		score += 20; // Short description
	}

	// Check field count
	const fields = entity.fields || {};
	const fieldCount = Object.keys(fields).length;
	if (fieldCount === 0) {
		score += 30;
	} else if (fieldCount <= 2) {
		score += 15;
	}

	// Check tags
	const tags = entity.tags || [];
	if (tags.length === 0) {
		score += 10;
	}

	return Math.min(score, 100);
}

/**
 * Calculate importance score for an entity (0-100, higher = more important)
 */
function calculateImportanceScore(
	entity: any,
	context: EntityAnalysisContext
): number {
	let score = 0;

	// Entity types have different base importance
	const typeImportance: Record<string, number> = {
		character: 40,
		npc: 30,
		location: 25,
		faction: 30,
		item: 20,
		session: 15
	};
	score += typeImportance[entity.type] || 20;

	// Number of relationships increases importance
	const relationshipCount = (entity.links || []).length;
	score += Math.min(relationshipCount * 5, 30);

	// Tags like "important", "major", "player" increase importance
	const tags = entity.tags || [];
	if (tags.some((tag: string) => ['important', 'major', 'player', 'key'].includes(tag.toLowerCase()))) {
		score += 20;
	}

	// Longer, detailed descriptions suggest importance
	const descLength = (entity.description || '').length;
	if (descLength > 200) {
		score += 10;
	}

	return Math.min(score, 100);
}

/**
 * Check if entity has incoming relationships (is referenced by others)
 */
function hasIncomingRelationships(
	entityId: EntityId,
	context: EntityAnalysisContext
): boolean {
	return context.relationshipMap.edges.some((edge) => edge.target === entityId);
}

/**
 * Get missing core fields for an entity
 */
function getMissingCoreFields(entity: any): string[] {
	const coreFields = CORE_FIELDS_BY_TYPE[entity.type] || [];
	const fields = entity.fields || {};
	return coreFields.filter((field) => !fields[field] || fields[field].toString().trim() === '');
}

/**
 * Enhancement Analyzer implementation
 */
export const enhancementAnalyzer: SuggestionAnalyzer = {
	type: 'enhancement',

	async analyze(
		context: EntityAnalysisContext,
		config: AnalysisConfig
	): Promise<AnalysisResult> {
		const startTime = Date.now();
		const suggestions: AnalysisResult['suggestions'] = [];

		for (const entity of context.entities) {
			// 1. Detect sparse entities
			const sparsityScore = calculateSparsityScore(entity);
			if (sparsityScore >= 50) {
				// Only flag if significantly sparse
				const descLength = (entity.description || '').trim().length;
				const fieldCount = Object.keys(entity.fields || {}).length;

				let description = `${entity.name} has minimal information recorded. `;
				if (descLength === 0) {
					description += 'Add a description to provide context. ';
				} else if (descLength < 20) {
					description += 'Expand the description with more detail. ';
				}
				if (fieldCount === 0) {
					description += 'Consider adding relevant fields like role, personality, or background.';
				} else if (fieldCount <= 2) {
					description += 'Add more fields to flesh out this entity.';
				}

				suggestions.push({
					type: 'enhancement',
					title: `Sparse Entity: ${entity.name}`,
					description: description.trim(),
					relevanceScore: sparsityScore,
					affectedEntityIds: [entity.id],
					suggestedAction: {
						actionType: 'edit-entity',
						actionData: {
							entityId: entity.id,
							suggestedFields: getMissingCoreFields(entity)
						}
					}
				});
			}

			// 2. Detect missing summaries on important entities
			const importance = calculateImportanceScore(entity, context);
			const hasSummary = entity.summary && entity.summary.trim().length > 0;
			const isMinor = entity.tags?.includes('minor');

			if (!hasSummary && !isMinor && importance > 50) {
				suggestions.push({
					type: 'enhancement',
					title: `Missing Summary: ${entity.name}`,
					description: `${entity.name} is an important entity but lacks an AI-generated summary. A summary helps quickly understand key information and relationships.`,
					relevanceScore: importance * 0.6, // Scale importance to relevance
					affectedEntityIds: [entity.id],
					suggestedAction: {
						actionType: 'edit-entity',
						actionData: {
							entityId: entity.id,
							action: 'generate-summary'
						}
					}
				});
			}

			// 3. Detect orphan entities
			const hasOutgoingLinks = (entity.links || []).length > 0;
			const hasIncoming = hasIncomingRelationships(entity.id, context);
			const isOrphanExempt = ORPHAN_EXEMPT_TYPES.includes(entity.type);

			if (!hasOutgoingLinks && !hasIncoming && !isOrphanExempt) {
				const importance = calculateImportanceScore(entity, context);
				// Scale importance to relevance, with minimum of 40 for orphans
				const relevance = Math.max(40, importance * 0.7);
				suggestions.push({
					type: 'enhancement',
					title: `Orphan Entity: ${entity.name}`,
					description: `${entity.name} has no relationships to other entities. Consider linking it to related NPCs, locations, or factions to integrate it into your campaign.`,
					relevanceScore: relevance,
					affectedEntityIds: [entity.id]
				});
			}

			// 4. Detect missing core fields
			const missingFields = getMissingCoreFields(entity);
			if (missingFields.length > 0) {
				const fieldList = missingFields.join(', ');
				suggestions.push({
					type: 'enhancement',
					title: `Missing Core Fields: ${entity.name}`,
					description: `${entity.name} is missing typical ${entity.type} fields: ${fieldList}. Adding these fields will make the entity more complete and useful.`,
					relevanceScore: Math.min(85, 50 + calculateImportanceScore(entity, context) * 0.6),
					affectedEntityIds: [entity.id],
					suggestedAction: {
						actionType: 'edit-entity',
						actionData: {
							entityId: entity.id,
							suggestedFields: missingFields
						}
					}
				});
			}
		}

		// Filter by minimum relevance score and limit suggestions
		const filteredSuggestions = suggestions
			.filter((s) => s.relevanceScore >= config.minRelevanceScore)
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, config.maxSuggestionsPerType);

		return {
			type: 'enhancement',
			suggestions: filteredSuggestions,
			analysisTimeMs: Date.now() - startTime,
			apiCallsMade: 0 // Heuristic analyzer makes no API calls
		};
	}
};
