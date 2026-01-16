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
	},

	// Helper to generate inverse relationship name
	getInverseRelationship(relationship: string): string {
		const inverseMap: Record<string, string> = {
			member_of: 'has_member',
			has_member: 'member_of',
			located_at: 'contains',
			contains: 'located_at',
			owns: 'owned_by',
			owned_by: 'owns',
			allied_with: 'allied_with',
			enemy_of: 'enemy_of',
			parent_of: 'child_of',
			child_of: 'parent_of',
			knows: 'knows',
			friend_of: 'friend_of'
		};

		return inverseMap[relationship] || `inverse_of_${relationship}`;
	},

	// Add a link between entities (with optional bidirectional support)
	async addLink(
		sourceId: string,
		targetId: string,
		relationship: string,
		bidirectional: boolean = false,
		notes?: string
	): Promise<void> {
		await ensureDbReady();

		await db.transaction('rw', db.entities, async () => {
			const sourceEntity = await db.entities.get(sourceId);
			const targetEntity = await db.entities.get(targetId);

			if (!sourceEntity || !targetEntity) {
				throw new Error('Source or target entity not found');
			}

			// Check if link already exists
			const existingLink = sourceEntity.links.find((l) => l.targetId === targetId);
			if (existingLink) {
				throw new Error('Link already exists');
			}

			// Create the forward link
			const forwardLink: BaseEntity['links'][0] = {
				id: nanoid(),
				targetId,
				targetType: targetEntity.type,
				relationship,
				bidirectional,
				notes: notes || undefined
			};

			// Parse and stringify to avoid Proxy serialization errors
			const updatedSourceLinks = JSON.parse(
				JSON.stringify([...sourceEntity.links, forwardLink])
			);

			await db.entities.update(sourceId, {
				links: updatedSourceLinks,
				updatedAt: new Date()
			});

			// If bidirectional, create reverse link on target
			if (bidirectional) {
				const reverseLink: BaseEntity['links'][0] = {
					id: nanoid(),
					targetId: sourceId,
					targetType: sourceEntity.type,
					relationship: this.getInverseRelationship(relationship),
					bidirectional: true
				};

				const updatedTargetLinks = JSON.parse(
					JSON.stringify([...targetEntity.links, reverseLink])
				);

				await db.entities.update(targetId, {
					links: updatedTargetLinks,
					updatedAt: new Date()
				});
			}
		});
	},

	// Remove a link between entities (handles bidirectional)
	async removeLink(sourceId: string, targetId: string): Promise<void> {
		await ensureDbReady();

		await db.transaction('rw', db.entities, async () => {
			const sourceEntity = await db.entities.get(sourceId);
			if (!sourceEntity) return;

			// Find the link to remove
			const linkToRemove = sourceEntity.links.find((l) => l.targetId === targetId);
			if (!linkToRemove) return;

			// Remove from source
			const updatedSourceLinks = JSON.parse(
				JSON.stringify(sourceEntity.links.filter((l) => l.targetId !== targetId))
			);

			await db.entities.update(sourceId, {
				links: updatedSourceLinks,
				updatedAt: new Date()
			});

			// If bidirectional, remove reverse link from target
			if (linkToRemove.bidirectional) {
				const targetEntity = await db.entities.get(targetId);
				if (targetEntity) {
					const updatedTargetLinks = JSON.parse(
						JSON.stringify(targetEntity.links.filter((l) => l.targetId !== sourceId))
					);

					await db.entities.update(targetId, {
						links: updatedTargetLinks,
						updatedAt: new Date()
					});
				}
			}
		});
	},

	// Get all linked entity IDs (both forward and reverse)
	async getAllLinkedIds(entityId: string): Promise<string[]> {
		await ensureDbReady();

		const entity = await db.entities.get(entityId);
		if (!entity) return [];

		// Get forward links
		const forwardIds = entity.links.map((l) => l.targetId);

		// Get reverse links (entities that link to this one)
		const entitiesLinkingHere = await db.entities
			.filter((e) => e.links.some((l) => l.targetId === entityId))
			.toArray();

		const reverseIds = entitiesLinkingHere.map((e) => e.id);

		// Combine and deduplicate
		return [...new Set([...forwardIds, ...reverseIds])];
	}
};
