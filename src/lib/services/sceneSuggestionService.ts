/**
 * Scene Suggestion Service
 *
 * Returns suggested NPCs/characters that might plausibly be present at a given
 * location, ranked by confidence using a three-layer query strategy:
 *
 *   1. Direct   (high)   – entity has `located_at` -> location,
 *                          or location has `contains` -> entity
 *   2. Indirect (medium) – entity has `serves`, `works_for`, `knows`, or
 *                          `member_of` pointing at a direct npc/character
 *   3. Sub-location (low)– entity is at a child location (`part_of` the queried location)
 *
 * @module sceneSuggestionService
 */

import { entityRepository } from '$lib/db/repositories/entityRepository';
import type { BaseEntity } from '$lib/types';

/** Entity types that represent people who can be present at a scene */
const PERSON_TYPES = new Set(['npc', 'character']);

/** Relationship types that qualify for the indirect (1-hop) layer */
const INDIRECT_RELATIONSHIPS = new Set(['serves', 'works_for', 'knows', 'member_of']);

/** Confidence tier ranking — higher index = lower confidence */
const CONFIDENCE_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * A suggested entity for a scene, with an explanation and confidence level.
 */
export interface EntitySuggestion {
	/** The entity being suggested */
	entity: BaseEntity;
	/** Human-readable explanation of why this entity might be present */
	reason: string;
	/** How confident we are that this entity is at the location */
	confidence: 'high' | 'medium' | 'low';
	/** The relationship type that caused this suggestion */
	sourceRelationship: string;
}

/**
 * Options for `getSceneSuggestions`.
 */
export interface SceneSuggestionOptions {
	/** Entity IDs to omit from the results */
	excludeIds?: string[];
}

/**
 * Return suggested NPCs/characters for a location, ordered by confidence.
 *
 * @param locationId - The ID of the location to query
 * @param options    - Optional filters (e.g. excludeIds)
 * @returns Array of EntitySuggestion objects sorted high -> medium -> low
 */
export async function getSceneSuggestions(
	locationId: string,
	options: SceneSuggestionOptions = {}
): Promise<EntitySuggestion[]> {
	const { excludeIds = [] } = options;
	const excludeSet = new Set(excludeIds);

	// --- Load the location entity ----------------------------------------
	const location = await entityRepository.getById(locationId);
	if (!location) return [];

	// We use a Map to deduplicate: entity id -> best suggestion so far
	const best = new Map<string, EntitySuggestion>();

	/**
	 * Attempt to record a suggestion; only keeps the highest-confidence entry.
	 */
	function record(
		entity: BaseEntity,
		confidence: 'high' | 'medium' | 'low',
		reason: string,
		sourceRelationship: string
	): void {
		if (excludeSet.has(entity.id)) return;
		if (!PERSON_TYPES.has(entity.type)) return;

		const existing = best.get(entity.id);
		if (existing && CONFIDENCE_RANK[existing.confidence] <= CONFIDENCE_RANK[confidence]) {
			// Already have an equal or better suggestion — keep it
			return;
		}

		best.set(entity.id, { entity, reason, confidence, sourceRelationship });
	}

	// =========================================================================
	// Layer 1 — Direct (high confidence)
	// =========================================================================

	// 1a. Entities that link TO the location via `located_at`
	const linkingEntities = await entityRepository.getEntitiesLinkingTo(locationId);
	for (const entity of linkingEntities) {
		const hasLocatedAt = entity.links.some(
			(l) => l.targetId === locationId && l.relationship === 'located_at'
		);
		if (hasLocatedAt) {
			record(entity, 'high', `Located at ${location.name}`, 'located_at');
		}
	}

	// 1b. Entities that the location `contains`
	const containsLinks = location.links.filter((l) => l.relationship === 'contains');
	if (containsLinks.length > 0) {
		const containedIds = containsLinks.map((l) => l.targetId);
		const containedEntities = await entityRepository.getByIds(containedIds);
		for (const entity of containedEntities) {
			record(entity, 'high', `Located at ${location.name}`, 'contains');
		}
	}

	// Collect the set of direct npc/character IDs for the indirect hop filter
	const directPersonIds = new Set<string>(
		Array.from(best.values())
			.filter((s) => s.confidence === 'high' && PERSON_TYPES.has(s.entity.type))
			.map((s) => s.entity.id)
	);

	// =========================================================================
	// Layer 2 & 3 — Use the full entity list for the remaining layers
	// =========================================================================

	const allEntities = await entityRepository.getAllArray();

	// Build a quick lookup: id -> entity
	const entityById = new Map<string, BaseEntity>(allEntities.map((e) => [e.id, e]));

	// =========================================================================
	// Layer 2 — Indirect, 1-hop (medium confidence)
	// Only follow hops from direct npc/character entities found in Layer 1
	// =========================================================================

	for (const entity of allEntities) {
		if (!PERSON_TYPES.has(entity.type)) continue;
		if (entity.id === locationId) continue;

		for (const link of entity.links) {
			if (!INDIRECT_RELATIONSHIPS.has(link.relationship)) continue;
			if (!directPersonIds.has(link.targetId)) continue;

			// This entity has an indirect relationship to a direct person at the location
			const directEntity = entityById.get(link.targetId);
			const directName = directEntity?.name ?? link.targetId;

			record(
				entity,
				'medium',
				`${link.relationship.replace('_', ' ')} ${directName}`,
				link.relationship
			);
			break; // One matching link per entity is enough to establish the suggestion
		}
	}

	// =========================================================================
	// Layer 3 — Sub-locations (low confidence)
	// Find child locations (part_of -> this location), then their inhabitants
	// =========================================================================

	// Find sub-locations: entities whose `part_of` link targets this location
	const subLocations = allEntities.filter(
		(e) =>
			e.type === 'location' &&
			e.links.some((l) => l.targetId === locationId && l.relationship === 'part_of')
	);

	const subLocationIds = new Set(subLocations.map((e) => e.id));
	const subLocationById = new Map(subLocations.map((e) => [e.id, e]));

	// Find entities that are `located_at` a sub-location
	for (const entity of allEntities) {
		if (!PERSON_TYPES.has(entity.type)) continue;

		for (const link of entity.links) {
			if (link.relationship !== 'located_at') continue;
			if (!subLocationIds.has(link.targetId)) continue;

			const subLocation = subLocationById.get(link.targetId);
			const subLocationName = subLocation?.name ?? link.targetId;

			record(
				entity,
				'low',
				`Located at ${subLocationName} (sub-location)`,
				'part_of'
			);
			break;
		}
	}

	// =========================================================================
	// Sort and return: high -> medium -> low
	// =========================================================================

	return Array.from(best.values()).sort(
		(a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
	);
}
