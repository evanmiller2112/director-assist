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
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
import { isFieldPlayerVisible } from './playerFieldVisibility';

/**
 * Check if entity should be included in player export
 *
 * Entities are excluded if:
 * - playerVisible === false (entity-level override takes highest precedence)
 * - type is 'player_profile' (hardcoded rule - cannot be overridden)
 * - type is 'timeline_event' AND fields.knownBy is 'secret' or 'lost' (hardcoded rule - cannot be overridden)
 * - config.categoryVisibility[entity.type] === false (category-level hiding, can be overridden by playerVisible: true)
 *
 * Precedence order:
 * 1. entity.playerVisible === false → force hide (highest precedence)
 * 2. Hardcoded rules (player_profile always hidden, timeline_event knownBy secret/lost always hidden)
 * 3. entity.playerVisible === true → force show (overrides categoryVisibility)
 * 4. config?.categoryVisibility[entity.type] === false → hide category
 * 5. Default visible
 */
export function isEntityPlayerVisible(entity: BaseEntity, config?: PlayerExportFieldConfig): boolean {
	// Check entity-level playerVisible flag for explicit hiding (highest precedence)
	if (entity.playerVisible === false) {
		return false;
	}

	// Always hide player_profile entities (hardcoded rule - cannot be overridden)
	if (entity.type === 'player_profile') {
		return false;
	}

	// Filter timeline_event by knownBy field (hardcoded rule - cannot be overridden)
	if (entity.type === 'timeline_event') {
		const knownBy = entity.fields.knownBy;
		// Only hide if knownBy is exactly 'secret' or 'lost' (case-sensitive strings)
		if (knownBy === 'secret' || knownBy === 'lost') {
			return false;
		}
	}

	// If playerVisible is explicitly true, show (overrides categoryVisibility)
	if (entity.playerVisible === true) {
		return true;
	}

	// Check category visibility setting (GitHub Issue #520)
	if (config?.categoryVisibility?.[entity.type] === false) {
		return false;
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
 * When config is provided (or entity has per-entity overrides), uses the
 * isFieldPlayerVisible() cascade: per-entity override → per-category default → hardcoded rules.
 *
 * When config is undefined and no per-entity overrides exist, falls back to
 * the original hardcoded behavior for backward compatibility:
 * - 'notes' field (always removed)
 * - Fields in hiddenKeys array
 * - 'preparation' field (only if isSession is true)
 *
 * Does not mutate the original fields object.
 */
export function filterFieldsForPlayer(
	fields: Record<string, FieldValue>,
	hiddenKeys: string[],
	isSession: boolean,
	entityType?: string,
	entity?: BaseEntity,
	fieldDefinitions?: FieldDefinition[],
	config?: PlayerExportFieldConfig
): Record<string, FieldValue> {
	const filtered: Record<string, FieldValue> = {};

	// Use isFieldPlayerVisible cascade when config-aware parameters are provided
	if (entityType !== undefined && entity !== undefined) {
		// Build a lookup map for field definitions
		const fieldDefMap = new Map<string, FieldDefinition>();
		if (fieldDefinitions) {
			for (const fd of fieldDefinitions) {
				fieldDefMap.set(fd.key, fd);
			}
		}

		for (const [key, value] of Object.entries(fields)) {
			const fieldDef = fieldDefMap.get(key);
			if (isFieldPlayerVisible(key, fieldDef, entityType, entity, config)) {
				filtered[key] = value;
			}
		}

		return filtered;
	}

	// Legacy path: original hardcoded behavior (backward compatibility)
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
 * When config is provided, uses the isFieldPlayerVisible() cascade for field filtering.
 * When config is undefined, falls back to the original hardcoded behavior.
 *
 * Does not mutate the original entity.
 */
export function filterEntityForPlayer(
	entity: BaseEntity,
	typeDefinition: EntityTypeDefinition | undefined,
	config?: PlayerExportFieldConfig
): PlayerEntity | null {
	// Check if entity should be visible at all (pass config for categoryVisibility check)
	if (!isEntityPlayerVisible(entity, config)) {
		return null;
	}

	// Get hidden field keys from type definition
	const hiddenKeys = typeDefinition ? getHiddenFieldKeys(typeDefinition.fieldDefinitions) : [];

	// Determine if this is a session entity
	const isSession = entity.type === 'session';

	// Get field definitions from type definition
	const fieldDefinitions = typeDefinition ? typeDefinition.fieldDefinitions : [];

	// Filter fields and links - use config-aware path
	const filteredFields = filterFieldsForPlayer(
		entity.fields,
		hiddenKeys,
		isSession,
		entity.type,
		entity,
		fieldDefinitions,
		config
	);
	const filteredLinks = filterLinksForPlayer(entity.links);

	// Helper to check core field visibility (GitHub Issue #522)
	const isCoreVisible = (coreKey: string): boolean => {
		return isFieldPlayerVisible(coreKey, undefined, entity.type, entity, config);
	};

	// Create player entity (excluding notes, metadata, playerVisible)
	// Core fields are conditionally included based on visibility settings
	const playerEntity: PlayerEntity = {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		description: isCoreVisible('__core_description') ? entity.description : '',
		tags: isCoreVisible('__core_tags') ? entity.tags : [],
		fields: filteredFields,
		links: isCoreVisible('__core_relationships') ? filteredLinks : [],
	};

	// Include optional properties if they exist and are visible
	if (entity.summary !== undefined && isCoreVisible('__core_summary')) {
		playerEntity.summary = entity.summary;
	}
	if (entity.imageUrl !== undefined && isCoreVisible('__core_imageUrl')) {
		playerEntity.imageUrl = entity.imageUrl;
	}
	if (isCoreVisible('__core_createdAt')) {
		playerEntity.createdAt = entity.createdAt;
	}
	if (isCoreVisible('__core_updatedAt')) {
		playerEntity.updatedAt = entity.updatedAt;
	}

	return playerEntity;
}

/**
 * Main function: filter all entities for player export
 *
 * Filters entities based on visibility rules and removes sensitive information.
 * Returns an array of PlayerEntity objects.
 *
 * When config is provided, uses the isFieldPlayerVisible() cascade for field filtering.
 * When config is undefined, falls back to the original hardcoded behavior.
 *
 * Does not mutate the original arrays.
 */
export function filterEntitiesForPlayer(
	entities: BaseEntity[],
	entityTypeDefinitions: EntityTypeDefinition[],
	config?: PlayerExportFieldConfig
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
		const playerEntity = filterEntityForPlayer(entity, typeDef, config);
		if (playerEntity !== null) {
			playerEntities.push(playerEntity);
		}
	}

	return playerEntities;
}
