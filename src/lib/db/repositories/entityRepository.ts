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
		notes?: string,
		strength?: 'strong' | 'moderate' | 'weak',
		metadata?: { tags?: string[]; tension?: number; [key: string]: unknown },
		reverseRelationship?: string
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

			const now = new Date();

			// Create the forward link
			const forwardLink: BaseEntity['links'][0] = {
				id: nanoid(),
				sourceId: sourceId,
				targetId,
				targetType: targetEntity.type,
				relationship,
				bidirectional,
				notes: notes || undefined,
				strength,
				createdAt: now,
				updatedAt: now,
				metadata,
				...(bidirectional && reverseRelationship ? { reverseRelationship } : {})
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
					sourceId: targetId,
					targetId: sourceId,
					targetType: sourceEntity.type,
					relationship: reverseRelationship || this.getInverseRelationship(relationship),
					bidirectional: true,
					strength,
					createdAt: now,
					updatedAt: now,
					metadata,
					...(reverseRelationship ? { reverseRelationship: relationship } : {})
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

	// Update an existing link
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
		await ensureDbReady();

		await db.transaction('rw', db.entities, async () => {
			const sourceEntity = await db.entities.get(sourceId);
			if (!sourceEntity) {
				throw new Error('Source entity not found');
			}

			// Find the link to update
			const linkIndex = sourceEntity.links.findIndex((l) => l.id === linkId);
			if (linkIndex === -1) {
				throw new Error('Link not found');
			}

			const link = sourceEntity.links[linkIndex];
			const now = new Date();

			// Update the link with changes
			const updatedLink = {
				...link,
				...changes,
				updatedAt: now
			};

			// Update the source entity's links array
			const updatedLinks = [...sourceEntity.links];
			updatedLinks[linkIndex] = updatedLink;

			const serializedLinks = JSON.parse(JSON.stringify(updatedLinks));

			await db.entities.update(sourceId, {
				links: serializedLinks,
				updatedAt: new Date()
			});

			// If bidirectional and relationship/strength/metadata changed, update reverse link
			if (link.bidirectional) {
				const targetEntity = await db.entities.get(link.targetId);
				if (targetEntity) {
					// Find the reverse link
					const reverseLinkIndex = targetEntity.links.findIndex((l) => l.targetId === sourceId);

					if (reverseLinkIndex !== -1) {
						const reverseLink = targetEntity.links[reverseLinkIndex];
						const updatedReverseLink = {
							...reverseLink,
							updatedAt: now
						};

						// Update relationship if it changed (use inverse)
						if (changes.relationship !== undefined) {
							updatedReverseLink.relationship = this.getInverseRelationship(changes.relationship);
						}

						// Update strength if it changed
						if (changes.strength !== undefined) {
							updatedReverseLink.strength = changes.strength;
						}

						// Update metadata if it changed
						if (changes.metadata !== undefined) {
							updatedReverseLink.metadata = changes.metadata;
						}

						// Note: Do NOT update notes - notes are link-specific

						const updatedTargetLinks = [...targetEntity.links];
						updatedTargetLinks[reverseLinkIndex] = updatedReverseLink;

						const serializedTargetLinks = JSON.parse(JSON.stringify(updatedTargetLinks));

						await db.entities.update(link.targetId, {
							links: serializedTargetLinks,
							updatedAt: new Date()
						});
					}
				}
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
	},

	// Query entities by relationship type (Issue #71)
	async queryByRelationship(relationship: string): Promise<BaseEntity[]> {
		await ensureDbReady();
		return db.entities.filter((entity) => entity.links.some((link) => link.relationship === relationship)).toArray();
	},

	// Get entities related to a specific entity with a given relationship type (Issue #71)
	async getEntitiesWithRelationshipType(
		entityId: string,
		relationship: string,
		options?: { direction?: 'outgoing' | 'incoming' | 'both' }
	): Promise<BaseEntity[]> {
		await ensureDbReady();

		const direction = options?.direction || 'both';
		const entity = await db.entities.get(entityId);
		if (!entity) return [];

		let targetIds: string[] = [];

		// Handle outgoing relationships
		if (direction === 'outgoing' || direction === 'both') {
			const outgoingIds = entity.links
				.filter((link) => link.relationship === relationship)
				.map((link) => link.targetId);
			targetIds.push(...outgoingIds);
		}

		// Handle incoming relationships
		if (direction === 'incoming' || direction === 'both') {
			const entitiesLinkingHere = await db.entities
				.filter((e) => e.links.some((link) => link.targetId === entityId && link.relationship === relationship))
				.toArray();
			const incomingIds = entitiesLinkingHere.map((e) => e.id);
			targetIds.push(...incomingIds);
		}

		// Deduplicate IDs
		const uniqueIds = [...new Set(targetIds)];

		// Fetch and return entities
		if (uniqueIds.length === 0) return [];
		return db.entities.where('id').anyOf(uniqueIds).toArray();
	},

	// Get all unique relationship types used in the system (Issue #71)
	async getRelationshipTypes(): Promise<string[]> {
		await ensureDbReady();

		const allEntities = await db.entities.toArray();
		const relationshipSet = new Set<string>();

		for (const entity of allEntities) {
			for (const link of entity.links) {
				relationshipSet.add(link.relationship);
			}
		}

		return Array.from(relationshipSet).sort();
	},

	// Get relationship statistics (count by type) (Issue #71)
	async getRelationshipStats(): Promise<Record<string, number>> {
		await ensureDbReady();

		const allEntities = await db.entities.toArray();
		const stats: Record<string, number> = {};

		for (const entity of allEntities) {
			for (const link of entity.links) {
				stats[link.relationship] = (stats[link.relationship] || 0) + 1;
			}
		}

		return stats;
	}
};
