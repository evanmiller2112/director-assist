import { entityRepository } from '$lib/db/repositories';
import type { BaseEntity, EntityType, NewEntity } from '$lib/types';

// Entities store using Svelte 5 runes
function createEntitiesStore() {
	let entities = $state<BaseEntity[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Derived: entities filtered by search
	const filteredEntities = $derived.by(() => {
		if (!searchQuery) return entities;
		const query = searchQuery.toLowerCase();
		return entities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.description.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
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

		setSearchQuery(query: string) {
			searchQuery = query;
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

			// Add reverse links (only if they're not already in forward links as bidirectional)
			entities.forEach((e) => {
				const linkToThisEntity = e.links.find((l) => l.targetId === entityId);
				if (linkToThisEntity && !linkToThisEntity.bidirectional) {
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
		}
	};
}

export const entitiesStore = createEntitiesStore();
