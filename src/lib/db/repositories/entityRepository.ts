import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { BaseEntity, EntityType, NewEntity } from '$lib/types';
import { nanoid } from 'nanoid';

export const entityRepository = {
	// Get all entities as a live query (reactive)
	getAll(): Observable<BaseEntity[]> {
		return liveQuery(() => db.entities.toArray());
	},

	// Get entities by type as a live query
	getByType(type: EntityType): Observable<BaseEntity[]> {
		return liveQuery(() => db.entities.where('type').equals(type).toArray());
	},

	// Get single entity by ID
	async getById(id: string): Promise<BaseEntity | undefined> {
		await ensureDbReady();
		return db.entities.get(id);
	},

	// Get multiple entities by IDs
	async getByIds(ids: string[]): Promise<BaseEntity[]> {
		return db.entities.where('id').anyOf(ids).toArray();
	},

	// Search entities by name, description, or tags
	search(query: string): Observable<BaseEntity[]> {
		const lowerQuery = query.toLowerCase();
		return liveQuery(() =>
			db.entities
				.filter(
					(entity) =>
						entity.name.toLowerCase().includes(lowerQuery) ||
						entity.description.toLowerCase().includes(lowerQuery) ||
						entity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
				)
				.toArray()
		);
	},

	// Get entities linked to a specific entity
	async getLinkedEntities(entityId: string): Promise<BaseEntity[]> {
		const entity = await db.entities.get(entityId);
		if (!entity || entity.links.length === 0) return [];

		const linkedIds = entity.links.map((link) => link.targetId);
		return db.entities.where('id').anyOf(linkedIds).toArray();
	},

	// Get entities that link TO a specific entity (reverse lookup)
	async getEntitiesLinkingTo(entityId: string): Promise<BaseEntity[]> {
		return db.entities
			.filter((entity) => entity.links.some((link) => link.targetId === entityId))
			.toArray();
	},

	// Create a new entity
	async create(newEntity: NewEntity): Promise<BaseEntity> {
		await ensureDbReady();

		const now = new Date();
		const entity: BaseEntity = {
			...newEntity,
			id: nanoid(),
			createdAt: now,
			updatedAt: now
		};

		await db.entities.add(entity);
		return entity;
	},

	// Update an existing entity
	async update(id: string, changes: Partial<BaseEntity>): Promise<void> {
		await ensureDbReady();
		await db.entities.update(id, {
			...changes,
			updatedAt: new Date()
		});
	},

	// Delete an entity and clean up references
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.transaction('rw', db.entities, async () => {
			// Remove links from other entities pointing to this one
			const allEntities = await db.entities.toArray();
			const entitiesToUpdate = allEntities.filter((e) =>
				e.links.some((l) => l.targetId === id)
			);

			for (const entity of entitiesToUpdate) {
				await db.entities.update(entity.id, {
					links: entity.links.filter((l) => l.targetId !== id),
					updatedAt: new Date()
				});
			}

			// Delete the entity itself
			await db.entities.delete(id);
		});
	},

	// Bulk create entities (for import)
	async bulkCreate(entities: BaseEntity[]): Promise<void> {
		await db.entities.bulkAdd(entities);
	},

	// Clear all entities
	async clearAll(): Promise<void> {
		await db.entities.clear();
	},

	// Get entity count by type
	async countByType(type: EntityType): Promise<number> {
		return db.entities.where('type').equals(type).count();
	},

	// Get recently updated entities
	getRecent(limit: number = 10): Observable<BaseEntity[]> {
		return liveQuery(() =>
			db.entities.orderBy('updatedAt').reverse().limit(limit).toArray()
		);
	}
};
