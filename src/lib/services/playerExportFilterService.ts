/**
 * Player Export Filter Service
 *
 * Filters campaign data to create player-safe exports by:
 * 1. Filtering out entire entities based on visibility rules
 * 2. Removing sensitive fields (notes, hidden section fields, preparation)
 * 3. Filtering entity links (removing DM-only links and sensitive link properties)
 */

import type {
	BaseEntity,
	EntityLink,
	EntityTypeDefinition,
	FieldDefinition,
	FieldValue
} from '$lib/types/entities';
import type { PlayerEntity, PlayerEntityLink } from '$lib/types/playerExport';

/**
 * Check if entity should be included in player export
 *
 * Entities are excluded if:
 * - playerVisible === false
 * - type is 'player_profile'
 * - type is 'timeline_event' AND fields.knownBy is 'secret' or 'lost'
 */
export function isEntityPlayerVisible(entity: BaseEntity): boolean {
	// Check playerVisible flag (false = hidden, undefined/true = visible)
	if (entity.playerVisible === false) {
		return false;
	}

	// Always hide player_profile entities
	if (entity.type === 'player_profile') {
		return false;
	}

	// Filter timeline_event by knownBy field
	if (entity.type === 'timeline_event') {
		const knownBy = entity.fields.knownBy;
		// Only hide if knownBy is exactly 'secret' or 'lost' (case-sensitive strings)
		if (knownBy === 'secret' || knownBy === 'lost') {
			return false;
		}
	}

	return true;
}

/**
 * Get field keys that should be hidden from player view
 *
 * Returns field keys where FieldDefinition has section: 'hidden'
 */
export function getHiddenFieldKeys(fieldDefinitions: FieldDefinition[]): string[] {
	return fieldDefinitions
		.filter((def) => def.section === 'hidden')
		.map((def) => def.key);
}

/**
 * Filter fields for player view
 *
 * Removes:
 * - 'notes' field (always)
 * - Fields in hiddenKeys array
 * - 'preparation' field (only if isSession is true)
 *
 * Does not mutate the original fields object.
 */
export function filterFieldsForPlayer(
	fields: Record<string, FieldValue>,
	hiddenKeys: string[],
	isSession: boolean
): Record<string, FieldValue> {
	const filtered: Record<string, FieldValue> = {};

	// Build set of keys to exclude for efficient lookup
	const excludeKeys = new Set<string>(['notes', ...hiddenKeys]);
	if (isSession) {
		excludeKeys.add('preparation');
	}

	// Copy only non-excluded fields
	for (const [key, value] of Object.entries(fields)) {
		if (!excludeKeys.has(key)) {
			filtered[key] = value;
		}
	}

	return filtered;
}

/**
 * Filter links for player view
 *
 * Removes:
 * - Links where playerVisible === false
 *
 * For kept links, removes:
 * - notes, metadata, playerVisible, createdAt, updatedAt, sourceId
 *
 * Keeps:
 * - id, targetId, targetType, relationship, bidirectional, reverseRelationship, strength
 *
 * Does not mutate the original links array.
 */
export function filterLinksForPlayer(links: EntityLink[]): PlayerEntityLink[] {
	return links
		.filter((link) => link.playerVisible !== false)
		.map((link) => {
			// Create new object with only player-visible properties
			const playerLink: PlayerEntityLink = {
				id: link.id,
				targetId: link.targetId,
				targetType: link.targetType,
				relationship: link.relationship,
				bidirectional: link.bidirectional
			};

			// Include optional properties if they are present in the source link
			// (even if explicitly undefined, per test requirements)
			if ('reverseRelationship' in link) {
				playerLink.reverseRelationship = link.reverseRelationship;
			}
			if ('strength' in link) {
				playerLink.strength = link.strength;
			}

			return playerLink;
		});
}

/**
 * Filter a single entity for player view
 *
 * Returns null if entity should not be visible to players.
 * Otherwise returns a PlayerEntity with filtered fields and links.
 *
 * Does not mutate the original entity.
 */
export function filterEntityForPlayer(
	entity: BaseEntity,
	typeDefinition: EntityTypeDefinition | undefined
): PlayerEntity | null {
	// Check if entity should be visible at all
	if (!isEntityPlayerVisible(entity)) {
		return null;
	}

	// Get hidden field keys from type definition
	const hiddenKeys = typeDefinition ? getHiddenFieldKeys(typeDefinition.fieldDefinitions) : [];

	// Determine if this is a session entity
	const isSession = entity.type === 'session';

	// Filter fields and links
	const filteredFields = filterFieldsForPlayer(entity.fields, hiddenKeys, isSession);
	const filteredLinks = filterLinksForPlayer(entity.links);

	// Create player entity (excluding notes, metadata, playerVisible)
	const playerEntity: PlayerEntity = {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		description: entity.description,
		tags: entity.tags,
		fields: filteredFields,
		links: filteredLinks,
		createdAt: entity.createdAt,
		updatedAt: entity.updatedAt
	};

	// Include optional properties if they exist
	if (entity.summary !== undefined) {
		playerEntity.summary = entity.summary;
	}
	if (entity.imageUrl !== undefined) {
		playerEntity.imageUrl = entity.imageUrl;
	}

	return playerEntity;
}

/**
 * Main function: filter all entities for player export
 *
 * Filters entities based on visibility rules and removes sensitive information.
 * Returns an array of PlayerEntity objects.
 *
 * Does not mutate the original arrays.
 */
export function filterEntitiesForPlayer(
	entities: BaseEntity[],
	entityTypeDefinitions: EntityTypeDefinition[]
): PlayerEntity[] {
	// Create a lookup map for type definitions
	const typeDefMap = new Map<string, EntityTypeDefinition>();
	for (const typeDef of entityTypeDefinitions) {
		typeDefMap.set(typeDef.type, typeDef);
	}

	// Filter and transform each entity
	const playerEntities: PlayerEntity[] = [];
	for (const entity of entities) {
		const typeDef = typeDefMap.get(entity.type);
		const playerEntity = filterEntityForPlayer(entity, typeDef);
		if (playerEntity !== null) {
			playerEntities.push(playerEntity);
		}
	}

	return playerEntities;
}
