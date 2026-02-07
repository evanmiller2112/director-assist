/**
 * Entity Duplication Service (GitHub Issue #221)
 *
 * Service for duplicating entities with template-based field structure preservation.
 * Enables quick creation of similar entities (NPCs, locations, monsters) with
 * shared field configurations while allowing customization.
 *
 * Key Features:
 * - Duplicate entities with new IDs and timestamps
 * - Preserve field structure and values
 * - Configurable entity-ref field handling (clear or preserve)
 * - Configurable relationship handling (clear or preserve)
 * - Deep cloning to prevent reference issues
 * - Integration with entity type definitions
 *
 * Usage:
 * ```typescript
 * // Basic duplication with default name
 * const copy = await duplicateEntity(sourceEntityId);
 *
 * // Custom name and preserve relationships
 * const copy = await duplicateEntity(sourceEntityId, {
 *   newName: 'Guard Captain Marcus',
 *   preserveRelationships: true
 * });
 * ```
 */

import type { BaseEntity, EntityLink, FieldDefinition } from '$lib/types';
import { db } from '$lib/db';
import { entityRepository } from '$lib/db/repositories/entityRepository';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';
import { campaignStore } from '$lib/stores';
import { nanoid } from 'nanoid';

/**
 * Options for entity duplication
 */
export interface DuplicateEntityOptions {
	/**
	 * Custom name for the duplicated entity.
	 * If not provided, defaults to "{originalName} (Copy)"
	 */
	newName?: string;

	/**
	 * Whether to preserve entity-ref and entity-refs field values.
	 * If false (default), entity reference fields are cleared (set to null or []).
	 * If true, entity reference field values are copied to the duplicate.
	 */
	preserveEntityRefs?: boolean;

	/**
	 * Whether to preserve relationships (links) to other entities.
	 * If false (default), the links array is cleared.
	 * If true, relationships are copied with new link IDs and updated sourceId.
	 * Note: Bidirectional relationships do NOT automatically create reverse links.
	 */
	preserveRelationships?: boolean;
}

/**
 * Deep clone a value, preserving arrays and handling null/undefined
 */
function deepClone<T>(value: T): T {
	if (value === null || value === undefined) {
		return value;
	}

	// Handle Date objects
	if (value instanceof Date) {
		return new Date(value.getTime()) as T;
	}

	// Handle arrays
	if (Array.isArray(value)) {
		return value.map(item => deepClone(item)) as T;
	}

	// Handle objects
	if (typeof value === 'object') {
		const cloned: Record<string, unknown> = {};
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				cloned[key] = deepClone((value as Record<string, unknown>)[key]);
			}
		}
		return cloned as T;
	}

	// Primitives (string, number, boolean)
	return value;
}

/**
 * Checks if a value looks like an entity ID
 * Entity IDs in this app are nanoid strings or follow patterns like 'type-id'
 *
 * Key characteristics of entity IDs:
 * - Contain a hyphen (e.g., 'npc-1', 'char-frodo', 'target-1')
 * - Or are long alphanumeric strings (nanoid format, typically 10+ chars)
 * - No spaces
 * - Lowercase with hyphens/underscores
 */
function looksLikeEntityId(value: unknown): boolean {
	if (typeof value !== 'string') {
		return false;
	}

	// Empty strings are not entity IDs
	if (value.length === 0) {
		return false;
	}

	// Must not contain spaces (entity IDs never have spaces)
	if (value.includes(' ')) {
		return false;
	}

	// Pattern 1: Contains a hyphen (type-id format like 'npc-1', 'char-frodo')
	// This is the most common pattern in the tests
	if (value.includes('-')) {
		// Should be alphanumeric with hyphens/underscores
		const typeIdPattern = /^[a-zA-Z0-9_-]+$/;
		return typeIdPattern.test(value);
	}

	// Pattern 2: Long alphanumeric string (nanoid format)
	// nanoid strings are typically 21 characters, all alphanumeric (no spaces, no special chars)
	// We use a high threshold (20+) to avoid false positives with regular words
	if (value.length >= 20) {
		const nanoidPattern = /^[a-zA-Z0-9_]+$/;
		return nanoidPattern.test(value);
	}

	// If neither pattern matches, it's not an entity ID
	return false;
}

/**
 * Identifies if a field is an entity-ref or entity-refs field
 * Uses two strategies:
 * 1. Check entity type definition for fields with type 'entity-ref' or 'entity-refs'
 * 2. Use heuristics: check if field values look like entity IDs (for dynamic/undefined fields)
 */
function getEntityRefFields(
	fields: Record<string, any>,
	entityType: string,
	customEntityTypes: any[],
	entityTypeOverrides: any[]
): { singleRefFields: Set<string>; multiRefFields: Set<string> } {
	const singleRefFields = new Set<string>();
	const multiRefFields = new Set<string>();

	// Strategy 1: Check entity type definition
	const typeDef = getEntityTypeDefinition(entityType, customEntityTypes, entityTypeOverrides);
	if (typeDef) {
		for (const fieldDef of typeDef.fieldDefinitions) {
			if (fieldDef.type === 'entity-ref') {
				singleRefFields.add(fieldDef.key);
			} else if (fieldDef.type === 'entity-refs') {
				multiRefFields.add(fieldDef.key);
			}
		}
	}

	// Strategy 2: Heuristic detection for fields not in type definition
	// This handles cases where entities have dynamic fields that reference other entities
	const definedFieldKeys = new Set(typeDef?.fieldDefinitions.map(fd => fd.key) || []);

	for (const [fieldKey, fieldValue] of Object.entries(fields)) {
		// Skip if already identified by type definition
		if (singleRefFields.has(fieldKey) || multiRefFields.has(fieldKey)) {
			continue;
		}

		// Skip if this field is defined in the type definition as a non-ref field
		if (definedFieldKeys.has(fieldKey)) {
			continue;
		}

		// Check if it's a single entity reference (string that looks like an ID)
		if (looksLikeEntityId(fieldValue)) {
			singleRefFields.add(fieldKey);
		}
		// Check if it's multiple entity references (array of ID-like strings)
		else if (Array.isArray(fieldValue) && fieldValue.length > 0) {
			// If all elements look like entity IDs, treat as entity-refs field
			const allLookLikeIds = fieldValue.every(item => looksLikeEntityId(item));
			if (allLookLikeIds) {
				multiRefFields.add(fieldKey);
			}
		}
	}

	return { singleRefFields, multiRefFields };
}

/**
 * Duplicates an entity using it as a template for the new entity.
 *
 * Creates a new entity with:
 * - New unique ID
 * - New timestamps (createdAt, updatedAt)
 * - Copied field structure and values
 * - Configurable handling of entity-ref fields
 * - Configurable handling of relationships
 * - Preserved metadata, tags, description, notes, etc.
 *
 * Entity-ref fields (type 'entity-ref' or 'entity-refs') are identified by
 * looking up the entity type definition and checking field types.
 *
 * @param sourceEntityId - ID of the entity to duplicate
 * @param options - Configuration options for duplication behavior
 * @returns Promise resolving to the newly created duplicate entity
 * @throws Error if source entity is not found
 *
 * @example
 * ```typescript
 * // Duplicate a guard NPC template to create multiple guards
 * const guard1 = await duplicateEntity(templateId, { newName: 'Guard Marcus' });
 * const guard2 = await duplicateEntity(templateId, { newName: 'Guard Elena' });
 *
 * // Duplicate a character but keep their faction membership
 * const copy = await duplicateEntity(characterId, {
 *   newName: 'Twin Brother',
 *   preserveRelationships: true
 * });
 * ```
 */
export async function duplicateEntity(
	sourceEntityId: string,
	options?: DuplicateEntityOptions
): Promise<BaseEntity> {
	// Fetch the source entity from the database
	const sourceEntity = await db.entities.get(sourceEntityId);

	if (!sourceEntity) {
		throw new Error('Source entity not found');
	}

	// Generate new ID and timestamps
	const now = new Date();
	const newId = nanoid();

	// Determine the new name
	const newName = options?.newName ?? `${sourceEntity.name} (Copy)`;

	// Get entity type definition to identify entity-ref fields
	const customEntityTypes = campaignStore.customEntityTypes;
	const entityTypeOverrides = campaignStore.entityTypeOverrides;

	// Deep clone the fields object
	const clonedFields = deepClone(sourceEntity.fields);

	// Handle entity-ref fields based on options
	if (!options?.preserveEntityRefs) {
		// Identify entity-ref fields (both from type definition and heuristics)
		const { singleRefFields, multiRefFields } = getEntityRefFields(
			sourceEntity.fields,
			sourceEntity.type,
			customEntityTypes,
			entityTypeOverrides
		);

		// Clear single entity-ref fields
		for (const fieldKey of singleRefFields) {
			if (fieldKey in clonedFields) {
				clonedFields[fieldKey] = null;
			}
		}

		// Clear multiple entity-refs fields
		for (const fieldKey of multiRefFields) {
			if (fieldKey in clonedFields) {
				clonedFields[fieldKey] = [];
			}
		}
	}

	// Handle relationships based on options
	let newLinks: EntityLink[] = [];

	if (options?.preserveRelationships && sourceEntity.links.length > 0) {
		// Preserve relationships with new IDs and updated sourceId
		newLinks = sourceEntity.links.map((link) => {
			const newLink: EntityLink = {
				...deepClone(link),
				id: nanoid(),
				sourceId: newId,
				createdAt: now,
				updatedAt: now
			};
			return newLink;
		});
	}

	// Create the duplicated entity
	const duplicatedEntity: BaseEntity = {
		...deepClone(sourceEntity),
		id: newId,
		name: newName,
		fields: clonedFields,
		links: newLinks,
		createdAt: now,
		updatedAt: now
	};

	// Persist to database using entityRepository
	await db.entities.add(duplicatedEntity);

	return duplicatedEntity;
}
