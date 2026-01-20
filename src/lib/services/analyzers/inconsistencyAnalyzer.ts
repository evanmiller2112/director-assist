/**
 * Inconsistency Analyzer
 *
 * Detects data conflicts and inconsistencies across entities:
 * - Location conflicts: Entity references multiple incompatible locations
 * - Status conflicts: Active relationships with deceased/inactive entities
 * - Name duplicates: Similar entity names that might be duplicates
 * - Relationship asymmetry: Bidirectional relationships missing reverse link
 */

import type { EntityId } from '$lib/types';
import type {
	AnalysisConfig,
	AnalysisResult,
	EntityAnalysisContext,
	SuggestionAnalyzer
} from './types';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // deletion
				matrix[i][j - 1] + 1, // insertion
				matrix[i - 1][j - 1] + cost // substitution
			);
		}
	}

	return matrix[len1][len2];
}

/**
 * Check if two names are similar enough to potentially be duplicates
 */
function areNamesSimilar(name1: string, name2: string): boolean {
	const normalized1 = name1.toLowerCase().trim();
	const normalized2 = name2.toLowerCase().trim();

	// Exact match
	if (normalized1 === normalized2) return true;

	// Levenshtein distance check (allow small differences)
	const distance = levenshteinDistance(normalized1, normalized2);
	const maxLength = Math.max(normalized1.length, normalized2.length);
	const similarity = 1 - distance / maxLength;

	return similarity > 0.85; // 85% similarity threshold
}

/**
 * Check if a relationship verb is in past tense (historical)
 */
function isPastTense(relationship: string): boolean {
	const pastTenseIndicators = [
		'served',
		'was',
		'were',
		'had',
		'met',
		'knew',
		'worked',
		'fought',
		'loved',
		'hated'
	];
	const lower = relationship.toLowerCase();
	return pastTenseIndicators.some((indicator) => lower.includes(indicator));
}

/**
 * Check if entity has deceased/inactive status
 */
function isInactive(entity: any): boolean {
	const tags = entity.tags || [];
	const fields = entity.fields || {};

	// Check tags for deceased/inactive indicators
	if (tags.some((tag: string) => ['deceased', 'disbanded', 'destroyed'].includes(tag.toLowerCase()))) {
		return true;
	}

	// Check status field
	const status = fields.status?.toString().toLowerCase();
	if (status && ['deceased', 'disbanded', 'destroyed', 'inactive'].includes(status)) {
		return true;
	}

	return false;
}

/**
 * Check if two locations have a parent-child relationship
 */
function isNestedLocation(
	loc1Id: EntityId,
	loc2Id: EntityId,
	entityMap: Map<EntityId, any>
): boolean {
	const loc1 = entityMap.get(loc1Id);
	const loc2 = entityMap.get(loc2Id);

	if (!loc1 || !loc2) return false;

	// Check if one location references the other as parent
	const loc1Links = loc1.links || [];
	const loc2Links = loc2.links || [];

	for (const link of loc1Links) {
		if (
			link.targetId === loc2Id &&
			(link.relationship === 'located_in' || link.relationship === 'part_of')
		) {
			return true;
		}
	}

	for (const link of loc2Links) {
		if (
			link.targetId === loc1Id &&
			(link.relationship === 'located_in' || link.relationship === 'part_of')
		) {
			return true;
		}
	}

	return false;
}

/**
 * Detect entities that might be connected (family, faction members, etc.)
 */
function areEntitiesConnected(entity1: any, entity2: any): boolean {
	// Check for shared family tags
	const entity1Tags = new Set(entity1.tags || []);
	const entity2Tags = new Set(entity2.tags || []);

	const familyIndicators = ['family', 'blackwood-family', 'stormwind-family'];
	const hasFamilyTag = familyIndicators.some(
		(tag) => entity1Tags.has(tag) && entity2Tags.has(tag)
	);

	if (hasFamilyTag) return true;

	// Check for relationship between entities
	const entity1Links = entity1.links || [];
	const entity2Links = entity2.links || [];

	const hasRelationship =
		entity1Links.some((link: any) => link.targetId === entity2.id) ||
		entity2Links.some((link: any) => link.targetId === entity1.id);

	return hasRelationship;
}

/**
 * Inconsistency Analyzer implementation
 */
export const inconsistencyAnalyzer: SuggestionAnalyzer = {
	type: 'inconsistency',

	async analyze(
		context: EntityAnalysisContext,
		config: AnalysisConfig
	): Promise<AnalysisResult> {
		const startTime = Date.now();
		const suggestions: AnalysisResult['suggestions'] = [];

		// 1. Detect location conflicts
		for (const [entityId, locations] of context.locationsByEntity) {
			if (locations.length > 1) {
				// Check if locations are nested (which is acceptable)
				let hasConflict = false;
				for (let i = 0; i < locations.length; i++) {
					for (let j = i + 1; j < locations.length; j++) {
						if (!isNestedLocation(locations[i], locations[j], context.entityMap)) {
							hasConflict = true;
							break;
						}
					}
					if (hasConflict) break;
				}

				if (hasConflict) {
					const entity = context.entityMap.get(entityId);
					if (entity) {
						const locationNames = locations
							.map((locId) => context.entityMap.get(locId)?.name || locId)
							.join(', ');

						suggestions.push({
							type: 'inconsistency',
							title: `Location Conflict: ${entity.name}`,
							description: `${entity.name} is linked to multiple incompatible locations: ${locationNames}. This may indicate a data entry error or the entity needs to choose a primary location.`,
							relevanceScore: 75,
							affectedEntityIds: [entityId, ...locations]
						});
					}
				}
			}
		}

		// 2. Detect status conflicts
		for (const entity of context.entities) {
			const links = entity.links || [];
			for (const link of links) {
				const target = context.entityMap.get(link.targetId);
				if (!target) continue;

				// Skip if relationship is past tense (historical)
				if (isPastTense(link.relationship)) continue;

				// Check if target is inactive but relationship is active
				if (isInactive(target)) {
					const statusDesc = target.tags?.includes('deceased')
						? 'deceased'
						: target.tags?.includes('disbanded')
							? 'disbanded'
							: 'inactive';

					suggestions.push({
						type: 'inconsistency',
						title: `Status Conflict: ${entity.name} linked to ${statusDesc} entity`,
						description: `${entity.name} has an active relationship "${link.relationship}" with ${target.name}, which is marked as ${statusDesc}. Consider using past tense or removing the relationship.`,
						relevanceScore: 70,
						affectedEntityIds: [entity.id, target.id]
					});
				}
			}
		}

		// 3. Detect name duplicates
		const processedPairs = new Set<string>();
		for (let i = 0; i < context.entities.length; i++) {
			for (let j = i + 1; j < context.entities.length; j++) {
				const entity1 = context.entities[i];
				const entity2 = context.entities[j];

				const pairKey = [entity1.id, entity2.id].sort().join('-');
				if (processedPairs.has(pairKey)) continue;

				if (areNamesSimilar(entity1.name, entity2.name)) {
					// Don't flag if they're intentionally connected (family, etc.)
					if (areEntitiesConnected(entity1, entity2)) continue;

					processedPairs.add(pairKey);

					const isExactMatch = entity1.name.toLowerCase() === entity2.name.toLowerCase();
					const title = isExactMatch
						? `Duplicate Name: ${entity1.name}`
						: `Similar Names: ${entity1.name} / ${entity2.name}`;

					suggestions.push({
						type: 'inconsistency',
						title,
						description: `${entity1.name} and ${entity2.name} have ${isExactMatch ? 'identical' : 'very similar'} names. This might indicate duplicate entities that should be merged, or they may need more distinctive names.`,
						relevanceScore: isExactMatch ? 85 : 65,
						affectedEntityIds: [entity1.id, entity2.id]
					});
				}
			}
		}

		// Also check for entities sharing common name parts (via mentionedNames)
		for (const [namePart, entityIds] of context.mentionedNames) {
			if (entityIds.length <= 1) continue;
			if (namePart.length < 4) continue; // Skip very short names

			// Check pairs that share this name part
			for (let i = 0; i < entityIds.length; i++) {
				for (let j = i + 1; j < entityIds.length; j++) {
					const entity1 = context.entityMap.get(entityIds[i]);
					const entity2 = context.entityMap.get(entityIds[j]);
					if (!entity1 || !entity2) continue;

					const pairKey = [entity1.id, entity2.id].sort().join('-');
					if (processedPairs.has(pairKey)) continue; // Already processed
					processedPairs.add(pairKey);

					// Don't flag if full names are very different
					if (entity1.name.toLowerCase() === entity2.name.toLowerCase()) {
						// Exact match already handled above
						continue;
					}

					// Don't flag if they're intentionally connected
					if (areEntitiesConnected(entity1, entity2)) continue;

					suggestions.push({
						type: 'inconsistency',
						title: `Similar Names: ${entity1.name} / ${entity2.name}`,
						description: `${entity1.name} and ${entity2.name} share the name "${namePart}". This might indicate duplicate entities that should be merged, or they may need more distinctive names.`,
						relevanceScore: 60,
						affectedEntityIds: [entity1.id, entity2.id]
					});
				}
			}
		}

		// 4. Detect relationship asymmetry
		for (const entity of context.entities) {
			const links = entity.links || [];
			for (const link of links) {
				// Only check bidirectional links
				if (!link.bidirectional) continue;

				const target = context.entityMap.get(link.targetId);
				if (!target) continue;

				// Check if reverse link exists
				const targetLinks = target.links || [];
				const expectedReverseRel = link.reverseRelationship || link.relationship;

				const hasReverseLink = targetLinks.some(
					(targetLink) =>
						targetLink.targetId === entity.id &&
						targetLink.relationship === expectedReverseRel
				);

				if (!hasReverseLink) {
					suggestions.push({
						type: 'inconsistency',
						title: `Asymmetric Relationship: ${entity.name} ↔ ${target.name}`,
						description: `${entity.name} has a bidirectional "${link.relationship}" relationship with ${target.name}, but the reverse link is missing. Expected reverse relationship: "${expectedReverseRel}".`,
						relevanceScore: 80,
						affectedEntityIds: [entity.id, target.id],
						suggestedAction: {
							actionType: 'create-relationship',
							actionData: {
								sourceId: target.id,
								targetId: entity.id,
								relationship: expectedReverseRel,
								bidirectional: true
							}
						}
					});
				}
			}
		}

		// Filter by minimum relevance score and limit suggestions
		const filteredSuggestions = suggestions
			.filter((s) => s.relevanceScore >= config.minRelevanceScore)
			.sort((a, b) => b.relevanceScore - a.relevanceScore)
			.slice(0, config.maxSuggestionsPerType);

		return {
			type: 'inconsistency',
			suggestions: filteredSuggestions,
			analysisTimeMs: Date.now() - startTime,
			apiCallsMade: 0 // Heuristic analyzer makes no API calls
		};
	}
};
