import { entityRepository } from '$lib/db/repositories';
import type { BaseEntity, EntityType, NewEntity } from '$lib/types';

// Entities store using Svelte 5 runes
function createEntitiesStore() {
	let entities = $state<BaseEntity[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let relationshipFilter = $state<{
		relatedToEntityId: string | undefined;
		relationshipType: string | undefined;
		hasRelationships: boolean | undefined;
	}>({
		relatedToEntityId: undefined,
		relationshipType: undefined,
		hasRelationships: undefined
	});

	// Derived: available relationship types from all entities
	const availableRelationshipTypes = $derived.by(() => {
		const types = new Set<string>();
		for (const entity of entities) {
			for (const link of entity.links) {
				types.add(link.relationship);
			}
		}
		return Array.from(types).sort();
	});

	// Derived: entities filtered by search and relationship filters
	const filteredEntities = $derived.by(() => {
		let result = entities;

		// Apply relationship filters first
		const { relatedToEntityId, relationshipType, hasRelationships } = relationshipFilter;

		// Filter by "has relationships"
		if (hasRelationships === true) {
			result = result.filter((e) => e.links.length > 0);
		} else if (hasRelationships === false) {
			result = result.filter((e) => e.links.length === 0);
		}

		// Filter by relationship type
		if (relationshipType) {
			const typeLower = relationshipType.toLowerCase();
			result = result.filter((e) =>
				e.links.some((link) => link.relationship.toLowerCase() === typeLower)
			);
		}

		// Filter by related to entity
		if (relatedToEntityId) {
			const relatedEntity = entities.find((e) => e.id === relatedToEntityId);
			if (relatedEntity) {
				// Get entities that this entity links to
				const forwardLinkedIds = relatedEntity.links.map((l) => l.targetId);

				// Get entities that link to this entity (reverse links)
				const reverseLinkedIds = entities
					.filter((e) => e.links.some((l) => l.targetId === relatedToEntityId))
					.map((e) => e.id);

				// Combine both directions
				const allRelatedIds = new Set([...forwardLinkedIds, ...reverseLinkedIds]);

				result = result.filter((e) => allRelatedIds.has(e.id));
			} else {
				// Entity not found - return empty
				result = [];
			}
		}

		// Apply text search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(e) =>
					e.name.toLowerCase().includes(query) ||
					e.description.toLowerCase().includes(query) ||
					e.tags.some((t) => t.toLowerCase().includes(query))
			);
		}

		return result;
	});

	// Derived: entities grouped by type
	const entitiesByType = $derived.by(() => {
		return entities.reduce(
			(acc, entity) => {
				if (!acc[entity.type]) {
					acc[entity.type] = [];
				}
				acc[entity.type].push(entity);
				return acc;
			},
			{} as Record<string, BaseEntity[]>
		);
	});

	return {
		get entities() {
			return entities;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get searchQuery() {
			return searchQuery;
		},
		get filteredEntities() {
			return filteredEntities;
		},
		get entitiesByType() {
			return entitiesByType;
		},
		get relationshipFilter() {
			return relationshipFilter;
		},
		get availableRelationshipTypes() {
			return availableRelationshipTypes;
		},

		setSearchQuery(query: string) {
			searchQuery = query;
		},

		setRelationshipFilter(filter: {
			relatedToEntityId?: string;
			relationshipType?: string;
			hasRelationships?: boolean;
		}) {
			relationshipFilter = {
				relatedToEntityId: filter.relatedToEntityId ?? relationshipFilter.relatedToEntityId,
				relationshipType: filter.relationshipType ?? relationshipFilter.relationshipType,
				hasRelationships: filter.hasRelationships ?? relationshipFilter.hasRelationships
			};
		},

		clearRelationshipFilter() {
			relationshipFilter = {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined
			};
		},

		filterByRelatedTo(entityId: string | undefined) {
			relationshipFilter = {
				...relationshipFilter,
				relatedToEntityId: entityId
			};
		},

		filterByRelationshipType(type: string | undefined) {
			relationshipFilter = {
				...relationshipFilter,
				relationshipType: type ? type.toLowerCase() : undefined
			};
		},

		filterByHasRelationships(hasRels: boolean | undefined) {
			relationshipFilter = {
				...relationshipFilter,
				hasRelationships: hasRels
			};
		},

		async load() {
			isLoading = true;
			error = null;

			try {
				// Subscribe to live query
				const observable = entityRepository.getAll();
				observable.subscribe({
					next: (data) => {
						entities = data;
						isLoading = false;
					},
					error: (e) => {
						error = e instanceof Error ? e.message : 'Failed to load entities';
						isLoading = false;
					}
				});
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load entities';
				isLoading = false;
			}
		},

		async create(newEntity: NewEntity): Promise<BaseEntity> {
			const entity = await entityRepository.create(newEntity);
			// The live query will automatically update the entities array
			return entity;
		},

		async update(id: string, changes: Partial<BaseEntity>): Promise<void> {
			await entityRepository.update(id, changes);
		},

		async delete(id: string): Promise<void> {
			await entityRepository.delete(id);
		},

		getById(id: string): BaseEntity | undefined {
			return entities.find((e) => e.id === id);
		},

		getByType(type: EntityType): BaseEntity[] {
			return entities.filter((e) => e.type === type);
		},

		getLinked(entityId: string): BaseEntity[] {
			const entity = entities.find((e) => e.id === entityId);
			if (!entity) return [];

			// Get forward links
			const forwardIds = entity.links.map((l) => l.targetId);

			// Get reverse links (entities that link to this one)
			const reverseIds = entities
				.filter((e) => e.links.some((l) => l.targetId === entityId))
				.map((e) => e.id);

			// Combine and deduplicate
			const allLinkedIds = [...new Set([...forwardIds, ...reverseIds])];

			return entities.filter((e) => allLinkedIds.includes(e.id));
		},

		// Get linked entities with relationship info
		getLinkedWithRelationships(entityId: string): Array<{
			entity: BaseEntity;
			link: import('$lib/types').EntityLink;
			isReverse: boolean;
		}> {
			const entity = entities.find((e) => e.id === entityId);
			if (!entity) return [];

			const result: Array<{
				entity: BaseEntity;
				link: import('$lib/types').EntityLink;
				isReverse: boolean;
			}> = [];

			// Add forward links
			entity.links.forEach((link) => {
				const linkedEntity = entities.find((e) => e.id === link.targetId);
				if (linkedEntity) {
					result.push({
						entity: linkedEntity,
						link: link,
						isReverse: false
					});
				}
			});

			// Add reverse links from other entities pointing to this one
			// Include both unidirectional and bidirectional links
			entities.forEach((e) => {
				if (e.id === entityId) return; // Skip self
				const linkToThisEntity = e.links.find((l) => l.targetId === entityId);
				if (linkToThisEntity) {
					result.push({
						entity: e,
						link: linkToThisEntity,
						isReverse: true
					});
				}
			});

			return result;
		},

		async addLink(
			sourceId: string,
			targetId: string,
			relationship: string,
			bidirectional: boolean = false,
			notes?: string,
			strength?: 'strong' | 'moderate' | 'weak',
			metadata?: { tags?: string[]; tension?: number; [key: string]: unknown },
			reverseRelationship?: string
		): Promise<void> {
			await entityRepository.addLink(
				sourceId,
				targetId,
				relationship,
				bidirectional,
				notes,
				strength,
				metadata,
				reverseRelationship
			);
		},

		async updateLink(
			sourceId: string,
			linkId: string,
			changes: {
				notes?: string;
				relationship?: string;
				strength?: 'strong' | 'moderate' | 'weak';
				metadata?: { tags?: string[]; tension?: number; [key: string]: unknown };
			}
		): Promise<void> {
			await entityRepository.updateLink(sourceId, linkId, changes);
		},

		async removeLink(sourceId: string, targetId: string): Promise<void> {
			await entityRepository.removeLink(sourceId, targetId);
		},

		// Testing utility - allows tests to set entities directly
		// Also resets filters to ensure clean state for tests
		_setEntities(newEntities: BaseEntity[]): void {
			entities = newEntities;
			// Reset filters to ensure clean state between tests
			searchQuery = '';
			relationshipFilter = {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined
			};
		},

		// Testing utility - resets all filters
		_resetFilters(): void {
			searchQuery = '';
			relationshipFilter = {
				relatedToEntityId: undefined,
				relationshipType: undefined,
				hasRelationships: undefined
			};
		}
	};
}

export const entitiesStore = createEntitiesStore();
