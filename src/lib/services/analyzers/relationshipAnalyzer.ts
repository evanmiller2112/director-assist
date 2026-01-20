/**
 * Relationship Analyzer
 *
 * Suggests new relationships between entities using both:
 * - Local analysis: Find entities mentioned in text but not linked
 * - Common location analysis: Entities in the same location
 * - AI analysis: Semantic relationship inference (optional)
 */

import { generate } from '$lib/ai/client';
import type { EntityId } from '$lib/types';
import type {
	AnalysisConfig,
	AnalysisResult,
	EntityAnalysisContext,
	SuggestionAnalyzer
} from './types';

/**
 * Check if two entities already have a relationship
 */
function hasRelationship(entity1Id: EntityId, entity2Id: EntityId, context: EntityAnalysisContext): boolean {
	return context.relationshipMap.edges.some(
		(edge) =>
			(edge.source === entity1Id && edge.target === entity2Id) ||
			(edge.source === entity2Id && edge.target === entity1Id)
	);
}

/**
 * Find entity names mentioned in text
 */
function findMentions(text: string, mentionedNames: Map<string, EntityId[]>): EntityId[] {
	const mentions = new Set<EntityId>();
	const lowerText = text.toLowerCase();

	for (const [name, entityIds] of mentionedNames) {
		if (lowerText.includes(name)) {
			entityIds.forEach((id) => mentions.add(id));
		}
	}

	return Array.from(mentions);
}

/**
 * Calculate relevance score for a text mention relationship
 */
function calculateMentionScore(entity: any, mentionedEntity: any): number {
	// Base score for text mention
	let score = 60;

	// Higher score if the mention is in description vs just fields
	const descMention = (entity.description || '').toLowerCase().includes(mentionedEntity.name.toLowerCase());
	if (descMention) {
		score += 10;
	}

	// Higher score for more important entity types
	if (entity.type === 'character' || mentionedEntity.type === 'character') {
		score += 10;
	}

	return Math.min(score, 100);
}

/**
 * Calculate relevance for common location relationship
 */
function calculateLocationScore(locationId: EntityId, entityCount: number): number {
	// Smaller locations = higher likelihood entities know each other
	// Base score of 50
	let score = 50;

	if (entityCount <= 3) {
		score += 20; // Small location, very likely to know each other
	} else if (entityCount <= 5) {
		score += 10;
	} else if (entityCount > 20) {
		score -= 20; // Large location, less likely
	}

	return Math.max(30, Math.min(score, 100));
}

/**
 * Sleep for rate limiting
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Relationship Analyzer implementation
 */
export const relationshipAnalyzer: SuggestionAnalyzer = {
	type: 'relationship',

	async analyze(
		context: EntityAnalysisContext,
		config: AnalysisConfig
	): Promise<AnalysisResult> {
		const startTime = Date.now();
		const suggestions: AnalysisResult['suggestions'] = [];
		let apiCallsMade = 0;

		// 1. Detect text mentions
		for (const entity of context.entities) {
			// Check description for mentions
			const descriptionMentions = findMentions(entity.description || '', context.mentionedNames);

			// Check fields for mentions
			const fields = entity.fields || {};
			let fieldMentions: EntityId[] = [];
			for (const value of Object.values(fields)) {
				if (typeof value === 'string') {
					fieldMentions.push(...findMentions(value, context.mentionedNames));
				}
			}

			const allMentions = [...new Set([...descriptionMentions, ...fieldMentions])];

			for (const mentionedId of allMentions) {
				// Don't suggest self-relationships
				if (mentionedId === entity.id) continue;

				// Don't suggest if relationship already exists
				if (hasRelationship(entity.id, mentionedId, context)) continue;

				const mentionedEntity = context.entityMap.get(mentionedId);
				if (!mentionedEntity) continue;

				const score = calculateMentionScore(entity, mentionedEntity);

				suggestions.push({
					type: 'relationship',
					title: `Potential Relationship: ${entity.name} ↔ ${mentionedEntity.name}`,
					description: `${entity.name} mentions ${mentionedEntity.name} in its description or fields, but they are not linked. Consider creating a relationship to connect them.`,
					relevanceScore: score,
					affectedEntityIds: [entity.id, mentionedId],
					suggestedAction: {
						actionType: 'create-relationship',
						actionData: {
							sourceId: entity.id,
							targetId: mentionedId,
							relationship: 'knows',
							bidirectional: false
						}
					}
				});
			}
		}

		// 2. Detect common locations
		const locationGroups = new Map<EntityId, EntityId[]>();
		for (const [entityId, locations] of context.locationsByEntity) {
			for (const locationId of locations) {
				if (!locationGroups.has(locationId)) {
					locationGroups.set(locationId, []);
				}
				locationGroups.get(locationId)!.push(entityId);
			}
		}

		for (const [locationId, entityIds] of locationGroups) {
			// Only suggest for locations with 2-10 entities (too few or too many reduces likelihood)
			if (entityIds.length < 2 || entityIds.length > 20) continue;

			const score = calculateLocationScore(locationId, entityIds.length);

			// Check pairs of entities at this location
			for (let i = 0; i < entityIds.length && i < 10; i++) {
				// Limit pairs to avoid explosion
				for (let j = i + 1; j < entityIds.length && j < 10; j++) {
					const entity1Id = entityIds[i];
					const entity2Id = entityIds[j];

					// Don't suggest if relationship already exists
					if (hasRelationship(entity1Id, entity2Id, context)) continue;

					const entity1 = context.entityMap.get(entity1Id);
					const entity2 = context.entityMap.get(entity2Id);
					const location = context.entityMap.get(locationId);

					if (!entity1 || !entity2 || !location) continue;

					suggestions.push({
						type: 'relationship',
						title: `Same Location: ${entity1.name} & ${entity2.name}`,
						description: `${entity1.name} and ${entity2.name} are both located at ${location.name}. They may know each other or have interacted.`,
						relevanceScore: score,
						affectedEntityIds: [entity1Id, entity2Id],
						suggestedAction: {
							actionType: 'create-relationship',
							actionData: {
								sourceId: entity1Id,
								targetId: entity2Id,
								relationship: 'knows',
								bidirectional: true
							}
						}
					});
				}
			}
		}

		// 3. AI-powered semantic analysis (optional, rate-limited)
		if (config.enableAIAnalysis) {
			// Select a small sample of unlinked entity pairs for AI analysis
			const unlinkedPairs: Array<[any, any]> = [];
			const maxAIPairs = 5; // Limit AI calls

			for (let i = 0; i < context.entities.length && unlinkedPairs.length < maxAIPairs; i++) {
				for (
					let j = i + 1;
					j < context.entities.length && unlinkedPairs.length < maxAIPairs;
					j++
				) {
					const entity1 = context.entities[i];
					const entity2 = context.entities[j];

					// Skip if already have relationship
					if (hasRelationship(entity1.id, entity2.id, context)) continue;

					// Skip if already suggested via local analysis
					const alreadySuggested = suggestions.some(
						(s) =>
							s.affectedEntityIds.includes(entity1.id) &&
							s.affectedEntityIds.includes(entity2.id)
					);
					if (alreadySuggested) continue;

					// Only analyze pairs with substantial descriptions
					if (
						(entity1.description || '').length > 30 &&
						(entity2.description || '').length > 30
					) {
						unlinkedPairs.push([entity1, entity2]);
					}
				}
			}

			// Analyze selected pairs with AI
			for (const [entity1, entity2] of unlinkedPairs) {
				try {
					const prompt = `Analyze these two entities and determine if they might have a relationship:

Entity 1: ${entity1.name}
Type: ${entity1.type}
Description: ${entity1.description || 'No description'}

Entity 2: ${entity2.name}
Type: ${entity2.type}
Description: ${entity2.description || 'No description'}

If you detect a potential relationship based on their descriptions, respond with "YES" followed by a brief explanation (1 sentence).
If no clear relationship exists, respond with "NO".`;

					const result = await generate(prompt, { temperature: 0.3 });
					apiCallsMade++;

					if (result.success && result.content && result.content.toLowerCase().startsWith('yes')) {
						const explanation = result.content.substring(3).trim();

						suggestions.push({
							type: 'relationship',
							title: `AI-Detected Relationship: ${entity1.name} ↔ ${entity2.name}`,
							description: explanation || `These entities may be related based on their descriptions.`,
							relevanceScore: 65,
							affectedEntityIds: [entity1.id, entity2.id],
							suggestedAction: {
								actionType: 'create-relationship',
								actionData: {
									sourceId: entity1.id,
									targetId: entity2.id,
									relationship: 'related_to',
									bidirectional: true
								}
							}
						});
					}

					// Rate limiting
					if (apiCallsMade < unlinkedPairs.length) {
						await sleep(config.rateLimitMs);
					}
				} catch (error) {
					// Silently continue on AI errors
					console.error('AI relationship analysis error:', error);
				}
			}
		}

		// Filter by minimum relevance score and limit suggestions
		const filteredSuggestions = suggestions
			.filter((s) => s.relevanceScore >= config.minRelevanceScore)
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, config.maxSuggestionsPerType);

		return {
			type: 'relationship',
			suggestions: filteredSuggestions,
			analysisTimeMs: Date.now() - startTime,
			apiCallsMade
		};
	}
};
