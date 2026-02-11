import type { BaseEntity } from '$lib/types';
import type { RelationshipTimelineEvent, TimelineFilterOptions } from '$lib/types/relationshipTimeline';

/**
 * Build timeline events from entity relationships.
 * Creates "created" and optionally "modified" events for each relationship link.
 * Deduplicates bidirectional links and sorts by timestamp (newest first).
 */
export function buildTimelineEvents(entities: BaseEntity[]): RelationshipTimelineEvent[] {
	if (!entities || entities.length === 0) {
		return [];
	}

	// Create a map to find entities by ID
	const entityMap = new Map<string, BaseEntity>();
	for (const entity of entities) {
		entityMap.set(entity.id, entity);
	}

	// Track processed bidirectional pairs to avoid duplicates
	// Key format: "id1|id2|relationship" where id1 < id2 lexicographically
	const processedBidirectional = new Set<string>();

	const events: RelationshipTimelineEvent[] = [];

	for (const entity of entities) {
		if (!entity.links || entity.links.length === 0) {
			continue;
		}

		for (const link of entity.links) {
			const targetEntity = entityMap.get(link.targetId);
			if (!targetEntity) {
				continue;
			}

			// Handle bidirectional deduplication
			if (link.bidirectional) {
				// Create a normalized key using lexicographic ordering
				const ids = [entity.id, link.targetId].sort();
				const dedupeKey = `${ids[0]}|${ids[1]}|${link.relationship}`;

				if (processedBidirectional.has(dedupeKey)) {
					continue; // Skip, already processed the reverse
				}
				processedBidirectional.add(dedupeKey);
			}

			// Determine timestamps with fallback to entity.createdAt
			const createdAt = link.createdAt || entity.createdAt;
			const updatedAt = link.updatedAt;

			// Create the "created" event
			const createdEvent: RelationshipTimelineEvent = {
				id: `${link.id}-created`,
				eventType: 'created',
				timestamp: createdAt,
				sourceEntity: {
					id: entity.id,
					name: entity.name,
					type: entity.type
				},
				targetEntity: {
					id: targetEntity.id,
					name: targetEntity.name,
					type: targetEntity.type
				},
				relationship: link.relationship,
				bidirectional: link.bidirectional,
				linkCreatedAt: link.createdAt
			};

			// Add optional fields
			if (link.reverseRelationship) {
				createdEvent.reverseRelationship = link.reverseRelationship;
			}
			if (link.strength) {
				createdEvent.strength = link.strength;
			}
			if (link.notes) {
				createdEvent.notes = link.notes;
			}
			if (link.metadata) {
				createdEvent.metadata = link.metadata;
			}

			events.push(createdEvent);

			// Create "modified" event if updatedAt differs from createdAt
			if (updatedAt && link.createdAt && updatedAt.getTime() !== link.createdAt.getTime()) {
				const modifiedEvent: RelationshipTimelineEvent = {
					id: `${link.id}-modified`,
					eventType: 'modified',
					timestamp: updatedAt,
					sourceEntity: {
						id: entity.id,
						name: entity.name,
						type: entity.type
					},
					targetEntity: {
						id: targetEntity.id,
						name: targetEntity.name,
						type: targetEntity.type
					},
					relationship: link.relationship,
					bidirectional: link.bidirectional,
					linkCreatedAt: link.createdAt,
					linkUpdatedAt: updatedAt
				};

				// Add optional fields
				if (link.reverseRelationship) {
					modifiedEvent.reverseRelationship = link.reverseRelationship;
				}
				if (link.strength) {
					modifiedEvent.strength = link.strength;
				}
				if (link.notes) {
					modifiedEvent.notes = link.notes;
				}
				if (link.metadata) {
					modifiedEvent.metadata = link.metadata;
				}

				events.push(modifiedEvent);
			}
		}
	}

	// Sort by timestamp descending (newest first)
	events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

	return events;
}

/**
 * Filter timeline events based on various criteria.
 * All filters are combined with AND logic.
 */
export function filterTimelineEvents(
	events: RelationshipTimelineEvent[],
	filters: TimelineFilterOptions
): RelationshipTimelineEvent[] {
	let filtered = events;

	// Filter by entityId (matches source or target)
	if (filters.entityId) {
		filtered = filtered.filter(
			(event) =>
				event.sourceEntity.id === filters.entityId || event.targetEntity.id === filters.entityId
		);
	}

	// Filter by entityType (matches source or target)
	if (filters.entityType) {
		filtered = filtered.filter(
			(event) =>
				event.sourceEntity.type === filters.entityType ||
				event.targetEntity.type === filters.entityType
		);
	}

	// Filter by relationshipType
	if (filters.relationshipType) {
		filtered = filtered.filter((event) => event.relationship === filters.relationshipType);
	}

	// Filter by strength
	if (filters.strength && filters.strength !== 'all') {
		filtered = filtered.filter((event) => event.strength === filters.strength);
	}

	// Filter by date range (from)
	if (filters.dateFrom) {
		filtered = filtered.filter((event) => event.timestamp >= filters.dateFrom!);
	}

	// Filter by date range (to)
	if (filters.dateTo) {
		filtered = filtered.filter((event) => event.timestamp <= filters.dateTo!);
	}

	// Filter by eventType
	if (filters.eventType && filters.eventType !== 'all') {
		filtered = filtered.filter((event) => event.eventType === filters.eventType);
	}

	// Filter by searchQuery (searches entity names and notes, case-insensitive)
	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter((event) => {
			const sourceName = event.sourceEntity.name.toLowerCase();
			const targetName = event.targetEntity.name.toLowerCase();
			const notes = (event.notes || '').toLowerCase();

			return sourceName.includes(query) || targetName.includes(query) || notes.includes(query);
		});
	}

	return filtered;
}

/**
 * Extract available filter options from a set of events.
 * Returns unique entity types, relationship types, and entities.
 */
export function getAvailableFilterOptions(events: RelationshipTimelineEvent[]): {
	entityTypes: string[];
	relationshipTypes: string[];
	entities: Array<{ id: string; name: string; type: string }>;
} {
	if (!events || events.length === 0) {
		return {
			entityTypes: [],
			relationshipTypes: [],
			entities: []
		};
	}

	const entityTypesSet = new Set<string>();
	const relationshipTypesSet = new Set<string>();
	const entitiesMap = new Map<string, { id: string; name: string; type: string }>();

	for (const event of events) {
		// Collect entity types
		entityTypesSet.add(event.sourceEntity.type);
		entityTypesSet.add(event.targetEntity.type);

		// Collect relationship types
		relationshipTypesSet.add(event.relationship);

		// Collect unique entities
		if (!entitiesMap.has(event.sourceEntity.id)) {
			entitiesMap.set(event.sourceEntity.id, {
				id: event.sourceEntity.id,
				name: event.sourceEntity.name,
				type: event.sourceEntity.type
			});
		}
		if (!entitiesMap.has(event.targetEntity.id)) {
			entitiesMap.set(event.targetEntity.id, {
				id: event.targetEntity.id,
				name: event.targetEntity.name,
				type: event.targetEntity.type
			});
		}
	}

	return {
		entityTypes: Array.from(entityTypesSet),
		relationshipTypes: Array.from(relationshipTypesSet),
		entities: Array.from(entitiesMap.values())
	};
}
