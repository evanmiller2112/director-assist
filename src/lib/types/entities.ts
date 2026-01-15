// Core entity type identifiers
export type EntityType =
	| 'character'
	| 'npc'
	| 'location'
	| 'faction'
	| 'item'
	| 'encounter'
	| 'session'
	| 'deity'
	| 'timeline_event'
	| 'world_rule'
	| 'player_profile'
	| string; // Allow custom types

// Unique identifier type (nanoid-generated)
export type EntityId = string;

// Field value types (primitive values that can be stored in fields)
export type FieldValue =
	| string
	| number
	| boolean
	| string[] // Multi-select, tags
	| null
	| undefined;

// Entity relationship/link
export interface EntityLink {
	id: EntityId;
	targetId: EntityId;
	targetType: EntityType;
	relationship: string; // "member_of", "located_at", "knows", custom...
	bidirectional: boolean;
	notes?: string;
}

// Base entity interface - all entities extend this
export interface BaseEntity {
	id: EntityId;
	type: EntityType;
	name: string;
	description: string; // Rich text (markdown)
	tags: string[];
	imageUrl?: string;
	fields: Record<string, FieldValue>;
	links: EntityLink[];
	notes: string; // Private DM notes
	createdAt: Date;
	updatedAt: Date;
	metadata: Record<string, unknown>;
}

// Field types supported by the dynamic field system
export type FieldType =
	| 'text'
	| 'textarea'
	| 'richtext' // Markdown
	| 'number'
	| 'boolean'
	| 'select'
	| 'multi-select'
	| 'tags'
	| 'entity-ref' // Single entity reference
	| 'entity-refs' // Multiple entity references
	| 'date'
	| 'url'
	| 'image';

// Field definition for entity schemas
export interface FieldDefinition {
	key: string;
	label: string;
	type: FieldType;
	required: boolean;
	defaultValue?: FieldValue;
	options?: string[]; // For select/multi-select
	entityTypes?: EntityType[]; // For entity reference fields
	placeholder?: string;
	helpText?: string;
	section?: string; // For grouping fields in UI (e.g., "hidden" for secrets)
	order: number;
}

// Entity type definition (defines what fields an entity type has)
export interface EntityTypeDefinition {
	type: EntityType;
	label: string;
	labelPlural: string;
	icon: string;
	color: string;
	isBuiltIn: boolean;
	fieldDefinitions: FieldDefinition[];
	defaultRelationships: string[];
}

// Helper type for creating new entities
export type NewEntity = Omit<BaseEntity, 'id' | 'createdAt' | 'updatedAt'>;

// Helper to create a new entity with defaults
export function createEntity(
	type: EntityType,
	name: string,
	overrides: Partial<Omit<BaseEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>> = {}
): NewEntity {
	return {
		type,
		name,
		description: '',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		metadata: {},
		...overrides
	};
}
