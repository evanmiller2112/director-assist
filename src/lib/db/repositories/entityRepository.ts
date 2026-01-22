import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { BaseEntity, EntityType, NewEntity } from '$lib/types';
import { nanoid } from 'nanoid';

// Relationship Map interfaces for graph visualization

/**
 * Represents a node (entity) in the relationship graph.
 *
 * Compatible with D3.js, vis.js, and Cytoscape.js graph libraries.
 */
export interface RelationshipMapNode {
	/** Unique entity identifier */
	id: string;
	/** Entity type (e.g., 'character', 'location', 'faction') */
	type: EntityType;
	/** Display name of the entity */
	name: string;
	/** Optional numeric ID for graph library compatibility */
	entityId?: number;
	/**
	 * Total count of relationships (links) for this entity.
	 *
	 * Calculation rules:
	 * - Outgoing unidirectional links: +1 for source entity
	 * - Incoming unidirectional links: +1 for target entity
	 * - Bidirectional links: +1 for both source and target entities
	 * - Self-referencing links: +1 (counted once, not doubled)
	 *
	 * Note: Bidirectional links do not double-count. Each bidirectional
	 * relationship adds exactly 1 to the count for each participating entity.
	 */
	linkCount: number;
}

/**
 * Represents an edge (relationship) in the relationship graph.
 *
 * Compatible with D3.js, vis.js, and Cytoscape.js graph libraries.
 *
 * Edge deduplication behavior:
 * - Bidirectional links are deduplicated to prevent duplicate edges
 * - The lexicographically smaller entity ID is used as the source
 * - Edge key format for bidirectional: `{source}-{target}-{relationship}`
 * - Edge key format for unidirectional: `{source}-{target}-{relationship}-uni`
 * - Multiple different relationships between the same entities are allowed
 */
export interface RelationshipMapEdge {
	/** Unique numeric edge identifier */
	id: number;
	/** Source entity ID */
	source: string;
	/** Target entity ID */
	target: string;
	/** Relationship type (e.g., 'member_of', 'located_at', 'knows') */
	relationship: string;
	/** Whether the relationship is bidirectional (mutual) */
	bidirectional: boolean;
	/** Optional relationship strength indicator */
	strength?: 'strong' | 'moderate' | 'weak';
	/** Optional metadata (tags, tension, custom fields) */
	metadata?: Record<string, unknown>;
}

/**
 * Complete relationship graph data structure.
 *
 * Compatible with D3.js, vis.js, and Cytoscape.js graph libraries.
 * Use this structure to visualize entity relationships in graph visualizations.
 */
export interface RelationshipMap {
	/** Array of all entity nodes in the graph */
	nodes: RelationshipMapNode[];
	/** Array of all relationship edges in the graph */
	edges: RelationshipMapEdge[];
}

/**
 * Options for filtering the relationship map.
 */
export interface RelationshipMapOptions {
	/**
	 * Filter graph to only include specific entity types.
	 * When specified, only entities of the given types will be included as nodes,
	 * and only links between those entities will be included as edges.
	 *
	 * Example: `{ entityTypes: ['character', 'faction'] }` will return only
	 * characters, factions, and relationships between them.
	 */
	entityTypes?: EntityType[];
}

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

		// Serialize to strip any reactive proxies (Issue #256)
		const plainEntity = JSON.parse(JSON.stringify(newEntity));

		const now = new Date();
		const entity: BaseEntity = {
			...plainEntity,
			id: nanoid(),
			createdAt: now,
			updatedAt: now
		};

		await db.entities.add(entity);
		return entity;
	},

	// Create a new entity with relationships (Issue #124)
	async createWithLinks(
		newEntity: NewEntity,
		pendingLinks: import('$lib/types').PendingRelationship[]
	): Promise<BaseEntity> {
		await ensureDbReady();

		// Serialize to strip any reactive proxies (Issue #256)
		const plainEntity = JSON.parse(JSON.stringify(newEntity));

		return await db.transaction('rw', db.entities, async () => {
			const now = new Date();
			const entityId = nanoid();

			// Validate all target entities exist before creating anything
			for (const pendingLink of pendingLinks) {
				const targetExists = await db.entities.get(pendingLink.targetId);
				if (!targetExists) {
					throw new Error(`Target entity ${pendingLink.targetId} not found`);
				}
			}

			// Build EntityLink array from pending relationships
			const links: BaseEntity['links'] = pendingLinks.map((pending) => {
				const link: BaseEntity['links'][0] = {
					id: nanoid(),
					sourceId: entityId,
					targetId: pending.targetId,
					targetType: pending.targetType,
					relationship: pending.relationship,
					bidirectional: pending.bidirectional,
					createdAt: now,
					updatedAt: now
				};

				// Add optional fields if present
				if (pending.notes !== undefined) {
					link.notes = pending.notes;
				}
				if (pending.strength !== undefined) {
					link.strength = pending.strength;
				}
				if (pending.metadata !== undefined) {
					link.metadata = pending.metadata;
				}
				if (pending.playerVisible !== undefined) {
					link.playerVisible = pending.playerVisible;
				}
				if (pending.bidirectional && pending.reverseRelationship) {
					link.reverseRelationship = pending.reverseRelationship;
				}

				return link;
			});

			// Create the entity with its links
			const entity: BaseEntity = {
				...plainEntity,
				id: entityId,
				links,
				createdAt: now,
				updatedAt: now
			};

			await db.entities.add(entity);

			// Handle bidirectional relationships - create reverse links on target entities
			for (let i = 0; i < pendingLinks.length; i++) {
				const pending = pendingLinks[i];
				if (pending.bidirectional) {
					const targetEntity = await db.entities.get(pending.targetId);
					if (!targetEntity) continue;

					// Create reverse link
					const reverseLink: BaseEntity['links'][0] = {
						id: nanoid(),
						sourceId: pending.targetId,
						targetId: entityId,
						targetType: entity.type,
						relationship: pending.reverseRelationship || this.getInverseRelationship(pending.relationship),
						bidirectional: true,
						createdAt: now,
						updatedAt: now
					};

					// Add strength and metadata to reverse link (but not notes)
					if (pending.strength !== undefined) {
						reverseLink.strength = pending.strength;
					}
					if (pending.metadata !== undefined) {
						reverseLink.metadata = pending.metadata;
					}
					if (pending.playerVisible !== undefined) {
						reverseLink.playerVisible = pending.playerVisible;
					}
					// Set reverse relationship metadata if forward had reverseRelationship
					if (pending.reverseRelationship) {
						reverseLink.reverseRelationship = pending.relationship;
					}

					// Update target entity with reverse link
					const updatedTargetLinks = JSON.parse(
						JSON.stringify([...targetEntity.links, reverseLink])
					);

					await db.entities.update(pending.targetId, {
						links: updatedTargetLinks,
						updatedAt: now
					});
				}
			}

			return entity;
		});
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
			// Check if this is a campaign entity
			const entityToDelete = await db.entities.get(id);
			if (entityToDelete && entityToDelete.type === 'campaign') {
				// Count total campaigns
				const campaignCount = await db.entities.where('type').equals('campaign').count();
				if (campaignCount <= 1) {
					throw new Error('Cannot delete the last campaign');
				}
			}

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
		reverseRelationship?: string,
		playerVisible?: boolean
	): Promise<void> {
		await ensureDbReady();

		await db.transaction('rw', db.entities, async () => {
			const sourceEntity = await db.entities.get(sourceId);
			const targetEntity = await db.entities.get(targetId);

			if (!sourceEntity || !targetEntity) {
				throw new Error('Source or target entity not found');
			}

			// Check if link with same relationship already exists
			const existingLink = sourceEntity.links.find((l) => l.targetId === targetId && l.relationship === relationship);
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
				playerVisible,
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
					playerVisible,
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
			bidirectional?: boolean;
			playerVisible?: boolean;
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
			const wasBidirectional = link.bidirectional;
			const willBeBidirectional = changes.bidirectional !== undefined ? changes.bidirectional : link.bidirectional;

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

			const targetEntity = await db.entities.get(link.targetId);
			if (!targetEntity) {
				return;
			}

			// Handle bidirectional status change
			if (wasBidirectional && !willBeBidirectional) {
				// Turning OFF bidirectional - remove reverse link
				const updatedTargetLinks = JSON.parse(
					JSON.stringify(targetEntity.links.filter((l) => l.targetId !== sourceId))
				);

				await db.entities.update(link.targetId, {
					links: updatedTargetLinks,
					updatedAt: new Date()
				});
			} else if (!wasBidirectional && willBeBidirectional) {
				// Turning ON bidirectional - create reverse link
				const reverseLink: BaseEntity['links'][0] = {
					id: nanoid(),
					sourceId: link.targetId,
					targetId: sourceId,
					targetType: sourceEntity.type,
					relationship: this.getInverseRelationship(updatedLink.relationship),
					bidirectional: true,
					strength: updatedLink.strength,
					createdAt: now,
					updatedAt: now,
					metadata: updatedLink.metadata
				};

				const updatedTargetLinks = JSON.parse(
					JSON.stringify([...targetEntity.links, reverseLink])
				);

				await db.entities.update(link.targetId, {
					links: updatedTargetLinks,
					updatedAt: new Date()
				});
			} else if (wasBidirectional && willBeBidirectional) {
				// Still bidirectional - update reverse link if relationship/strength/metadata changed
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

					// Update playerVisible if it changed
					if (changes.playerVisible !== undefined) {
						updatedReverseLink.playerVisible = changes.playerVisible;
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

	/**
	 * Query all entities that have a specific relationship type.
	 *
	 * Finds all entities that have at least one link with the specified relationship,
	 * regardless of direction (outgoing or incoming).
	 *
	 * @param relationship - The relationship type to search for (e.g., 'member_of', 'knows', 'located_at')
	 * @returns Promise resolving to array of entities that have this relationship type
	 *
	 * @example
	 * ```typescript
	 * // Find all entities with 'member_of' relationships
	 * const members = await entityRepository.queryByRelationship('member_of');
	 * ```
	 */
	async queryByRelationship(relationship: string): Promise<BaseEntity[]> {
		await ensureDbReady();
		return db.entities.filter((entity) => entity.links.some((link) => link.relationship === relationship)).toArray();
	},

	/**
	 * Get all entities related to a specific entity with a given relationship type.
	 *
	 * Filters relationships by direction (outgoing, incoming, or both) and returns
	 * the entities on the other end of those relationships.
	 *
	 * @param entityId - The entity ID to query relationships for
	 * @param relationship - The relationship type to filter by
	 * @param options - Query options
	 * @param options.direction - Direction filter: 'outgoing' (from entity), 'incoming' (to entity), or 'both' (default: 'both')
	 * @returns Promise resolving to array of related entities
	 *
	 * @example
	 * ```typescript
	 * // Find all factions this character is a member of
	 * const factions = await entityRepository.getEntitiesWithRelationshipType(
	 *   characterId,
	 *   'member_of',
	 *   { direction: 'outgoing' }
	 * );
	 *
	 * // Find all characters who are members of this faction
	 * const members = await entityRepository.getEntitiesWithRelationshipType(
	 *   factionId,
	 *   'member_of',
	 *   { direction: 'incoming' }
	 * );
	 * ```
	 */
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

	/**
	 * Get all unique relationship types used in the campaign.
	 *
	 * Scans all entities and returns a sorted list of distinct relationship types
	 * currently in use. Useful for populating relationship type dropdowns or
	 * analytics dashboards.
	 *
	 * @returns Promise resolving to sorted array of unique relationship type strings
	 *
	 * @example
	 * ```typescript
	 * const types = await entityRepository.getRelationshipTypes();
	 * console.log(types); // ['allied_with', 'enemy_of', 'knows', 'located_at', 'member_of']
	 * ```
	 */
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

	/**
	 * Get relationship statistics showing usage count by type.
	 *
	 * Counts how many times each relationship type is used across all entities.
	 * Useful for analytics, reports, or understanding relationship patterns in
	 * your campaign.
	 *
	 * @returns Promise resolving to object mapping relationship types to their count
	 *
	 * @example
	 * ```typescript
	 * const stats = await entityRepository.getRelationshipStats();
	 * console.log(stats);
	 * // {
	 * //   'member_of': 15,
	 * //   'knows': 42,
	 * //   'located_at': 8,
	 * //   'enemy_of': 5
	 * // }
	 * ```
	 */
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
	},

	/**
	 * Get relationship map for graph visualization.
	 *
	 * Returns a graph data structure containing all entities as nodes and their
	 * relationships as edges. The output format is compatible with popular graph
	 * visualization libraries including D3.js, vis.js, and Cytoscape.js.
	 *
	 * @param options - Optional filtering options
	 * @param options.entityTypes - Array of entity types to include (e.g., ['character', 'faction'])
	 *                               When provided, only entities of these types and links between
	 *                               them will be included in the result.
	 *
	 * @returns Promise resolving to a RelationshipMap with nodes and edges arrays
	 *
	 * @example
	 * ```typescript
	 * // Get all entities and relationships
	 * const fullMap = await entityRepository.getRelationshipMap();
	 * console.log(fullMap.nodes.length); // All entities
	 * console.log(fullMap.edges.length); // All relationships
	 *
	 * // Get only characters and factions
	 * const filteredMap = await entityRepository.getRelationshipMap({
	 *   entityTypes: ['character', 'faction']
	 * });
	 * ```
	 *
	 * Edge Deduplication:
	 * - Bidirectional links appear only once in the edges array
	 * - The lexicographically smaller ID is used as the source
	 * - Unidirectional links maintain their specified direction
	 * - Multiple relationships between the same entities are preserved
	 *
	 * Link Count Calculation:
	 * - Each outgoing link adds 1 to the source entity's linkCount
	 * - Each incoming unidirectional link adds 1 to the target entity's linkCount
	 * - Bidirectional links do NOT double-count (add 1 to each entity, not 2)
	 * - Self-referencing links add 1 (not doubled)
	 *
	 * Graph Library Compatibility:
	 * - D3.js: Use nodes and edges directly with force-directed layouts
	 * - vis.js: Map to { nodes: [...], edges: [...] } format
	 * - Cytoscape.js: Transform to { nodes: [...], edges: [...] } with data wrappers
	 *
	 * Performance:
	 * - Processes all entities and links in a single pass
	 * - Uses Map for O(1) edge deduplication
	 * - Efficient for graphs with thousands of entities
	 *
	 * @see {@link RelationshipMap}
	 * @see {@link RelationshipMapNode}
	 * @see {@link RelationshipMapEdge}
	 * @see {@link RelationshipMapOptions}
	 */
	async getRelationshipMap(options?: RelationshipMapOptions): Promise<RelationshipMap> {
		await ensureDbReady();

		// Get all entities
		let allEntities = await db.entities.toArray();

		// Filter by entity types if specified
		if (options?.entityTypes && options.entityTypes.length > 0) {
			const typeSet = new Set(options.entityTypes);
			allEntities = allEntities.filter((entity) => typeSet.has(entity.type));
		}

		// Create a set of valid entity IDs for filtering edges
		const validEntityIds = new Set(allEntities.map((e) => e.id));

		// Build nodes from entities
		const nodes: RelationshipMapNode[] = allEntities.map((entity) => ({
			id: entity.id,
			type: entity.type,
			name: entity.name,
			linkCount: 0 // Will be calculated later
		}));

		// Build edges from links
		const edgeMap = new Map<string, RelationshipMapEdge>();
		let edgeIdCounter = 0;

		for (const entity of allEntities) {
			for (const link of entity.links) {
				// Skip links to entities that don't exist or are filtered out
				if (!validEntityIds.has(link.targetId)) {
					continue;
				}

				const sourceId = link.sourceId || entity.id;
				const targetId = link.targetId;

				// For bidirectional links, deduplicate by using lexicographically smaller ID as source
				let edgeKey: string;
				let actualSource: string;
				let actualTarget: string;

				if (link.bidirectional) {
					// Sort IDs to ensure consistent direction
					if (sourceId < targetId) {
						actualSource = sourceId;
						actualTarget = targetId;
					} else {
						actualSource = targetId;
						actualTarget = sourceId;
					}
					// Use relationship in the key to allow multiple bidirectional relationships between same entities
					edgeKey = `${actualSource}-${actualTarget}-${link.relationship}`;
				} else {
					actualSource = sourceId;
					actualTarget = targetId;
					// For unidirectional, direction matters
					edgeKey = `${actualSource}-${actualTarget}-${link.relationship}-uni`;
				}

				// Only add edge if not already added (for bidirectional deduplication)
				if (!edgeMap.has(edgeKey)) {
					const edge: RelationshipMapEdge = {
						id: edgeIdCounter++,
						source: actualSource,
						target: actualTarget,
						relationship: link.relationship,
						bidirectional: link.bidirectional
					};

					// Add optional fields if present
					if (link.strength) {
						edge.strength = link.strength;
					}
					if (link.metadata) {
						edge.metadata = link.metadata;
					}

					edgeMap.set(edgeKey, edge);
				}
			}
		}

		const edges = Array.from(edgeMap.values());

		// Calculate linkCount for each node
		const linkCounts = new Map<string, number>();

		// Initialize all nodes with 0
		for (const entity of allEntities) {
			linkCounts.set(entity.id, 0);
		}

		// Count links from entities (outgoing)
		for (const entity of allEntities) {
			for (const link of entity.links) {
				// Only count if target exists in our filtered set
				if (!validEntityIds.has(link.targetId)) {
					continue;
				}

				const sourceId = link.sourceId || entity.id;
				linkCounts.set(sourceId, (linkCounts.get(sourceId) || 0) + 1);
			}
		}

		// Count incoming links
		for (const entity of allEntities) {
			for (const link of entity.links) {
				// Only count if target exists in our filtered set
				if (!validEntityIds.has(link.targetId)) {
					continue;
				}

				const targetId = link.targetId;
				const sourceId = link.sourceId || entity.id;

				// For bidirectional links, don't double count on the same node
				if (!link.bidirectional) {
					linkCounts.set(targetId, (linkCounts.get(targetId) || 0) + 1);
				}
			}
		}

		// Update nodes with calculated linkCount
		for (const node of nodes) {
			node.linkCount = linkCounts.get(node.id) || 0;
		}

		return {
			nodes,
			edges
		};
	},
	// Get relationship chain using BFS traversal (Issue #69)
	async getRelationshipChain(
		startId: string,
		options?: {
			maxDepth?: number;
			relationshipTypes?: string[];
			entityTypes?: EntityType[];
			direction?: 'outgoing' | 'incoming' | 'both';
		}
	): Promise<Array<{ entity: BaseEntity; depth: number; path: BaseEntity['links'] }>> {
		await ensureDbReady();

		// Get the starting entity
		const startEntity = await db.entities.get(startId);
		if (!startEntity) {
			return [];
		}

		// Parse options with defaults
		const maxDepth = options?.maxDepth ?? 3;
		const relationshipTypes = options?.relationshipTypes;
		const entityTypes = options?.entityTypes;
		const direction = options?.direction ?? 'both';

		// Handle maxDepth = 0 edge case
		if (maxDepth === 0) {
			return [];
		}

		// Handle empty filter arrays (should match nothing)
		if (relationshipTypes && relationshipTypes.length === 0) {
			return [];
		}
		if (entityTypes && entityTypes.length === 0) {
			return [];
		}

		// BFS queue: [entityId, depth, path]
		const queue: Array<[string, number, BaseEntity['links']]> = [[startId, 0, []]];
		const visited = new Set<string>([startId]);
		const results: Array<{ entity: BaseEntity; depth: number; path: BaseEntity['links'] }> = [];

		// Pre-fetch all entities for efficient lookup
		const allEntities = await db.entities.toArray();
		const entityMap = new Map(allEntities.map((e) => [e.id, e]));

		// Build reverse link map for incoming relationships
		const incomingLinksMap = new Map<string, BaseEntity['links']>();
		if (direction === 'incoming' || direction === 'both') {
			for (const entity of allEntities) {
				for (const link of entity.links) {
					if (!incomingLinksMap.has(link.targetId)) {
						incomingLinksMap.set(link.targetId, []);
					}
					incomingLinksMap.get(link.targetId)!.push(link);
				}
			}
		}

		while (queue.length > 0) {
			const [currentId, currentDepth, currentPath] = queue.shift()!;

			// Stop if we've reached max depth
			if (currentDepth >= maxDepth) {
				continue;
			}

			const currentEntity = entityMap.get(currentId);
			if (!currentEntity) {
				continue;
			}

			const nextDepth = currentDepth + 1;
			const neighbors: Array<{ link: BaseEntity['links'][0]; targetId: string }> = [];

			// Collect outgoing relationships
			if (direction === 'outgoing' || direction === 'both') {
				for (const link of currentEntity.links) {
					// Filter by relationship type if specified
					if (relationshipTypes && !relationshipTypes.includes(link.relationship)) {
						continue;
					}
					neighbors.push({ link, targetId: link.targetId });
				}
			}

			// Collect incoming relationships
			if (direction === 'incoming' || direction === 'both') {
				const incomingLinks = incomingLinksMap.get(currentId) || [];
				for (const link of incomingLinks) {
					// Filter by relationship type if specified
					if (relationshipTypes && !relationshipTypes.includes(link.relationship)) {
						continue;
					}
					neighbors.push({ link, targetId: link.sourceId! });
				}
			}

			// Process each neighbor
			for (const { link, targetId } of neighbors) {
				// Skip if already visited (prevents cycles)
				if (visited.has(targetId)) {
					continue;
				}

				const targetEntity = entityMap.get(targetId);
				if (!targetEntity) {
					continue;
				}

				// Mark as visited
				visited.add(targetId);

				// Build the path to this entity
				const newPath = [...currentPath, link];

				// Check if this entity matches the entity type filter
				const matchesEntityType = !entityTypes || entityTypes.includes(targetEntity.type);

				// Add to results if it matches the entity type filter
				if (matchesEntityType) {
					results.push({
						entity: targetEntity,
						depth: nextDepth,
						path: newPath
					});
				}

				// Continue traversal through this entity (even if filtered out)
				queue.push([targetId, nextDepth, newPath]);
			}
		}

		// Sort results by depth first, then by entity name
		results.sort((a, b) => {
			if (a.depth !== b.depth) {
				return a.depth - b.depth;
			}
			return a.entity.name.localeCompare(b.entity.name);
		});

		return results;
	},

	/**
	 * Get all entities that don't have a 'belongs_to_campaign' link (Issue #48)
	 * Excludes campaign entities themselves
	 */
	async getEntitiesWithoutCampaignLink(): Promise<BaseEntity[]> {
		await ensureDbReady();

		return db.entities
			.filter((entity) => {
				// Exclude campaign entities
				if (entity.type === 'campaign') {
					return false;
				}

				// Check if entity has a belongs_to_campaign link
				const hasCampaignLink = entity.links.some(
					(link) => link.relationship === 'belongs_to_campaign'
				);

				return !hasCampaignLink;
			})
			.toArray();
	},

	/**
	 * Bulk link multiple entities to a campaign (Issue #48)
	 * Creates unidirectional 'belongs_to_campaign' relationships
	 * Skips entities already linked to that campaign
	 * Returns count of entities successfully linked
	 */
	async bulkLinkToCampaign(entityIds: string[], campaignId: string): Promise<number> {
		await ensureDbReady();

		return await db.transaction('rw', db.entities, async () => {
			// Verify campaign exists
			const campaign = await db.entities.get(campaignId);
			if (!campaign) {
				throw new Error(`Campaign ${campaignId} not found`);
			}

			let linkedCount = 0;
			const now = new Date();

			for (const entityId of entityIds) {
				const entity = await db.entities.get(entityId);
				if (!entity) {
					// Skip non-existent entities
					continue;
				}

				// Check if already linked to this campaign
				const alreadyLinked = entity.links.some(
					(link) =>
						link.relationship === 'belongs_to_campaign' && link.targetId === campaignId
				);

				if (alreadyLinked) {
					// Skip - already linked
					continue;
				}

				// Create the campaign link
				const newLink: BaseEntity['links'][0] = {
					id: nanoid(),
					sourceId: entityId,
					targetId: campaignId,
					targetType: 'campaign',
					relationship: 'belongs_to_campaign',
					bidirectional: false,
					createdAt: now,
					updatedAt: now
				};

				// Add link to entity
				const updatedLinks = JSON.parse(JSON.stringify([...entity.links, newLink]));

				await db.entities.update(entityId, {
					links: updatedLinks,
					updatedAt: now
				});

				linkedCount++;
			}

			return linkedCount;
		});
	}
};
