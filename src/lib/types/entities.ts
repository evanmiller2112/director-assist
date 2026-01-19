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
	sourceId?: EntityId; // Explicit source reference (optional for backward compat)
	targetId: EntityId;
	targetType: EntityType;
	relationship: string; // "member_of", "located_at", "knows", custom...
	bidirectional: boolean;
	reverseRelationship?: string; // For asymmetric bidirectional links (e.g., patron_of/client_of)
	notes?: string;
	strength?: 'strong' | 'moderate' | 'weak'; // Relationship strength
	playerVisible?: boolean; // Whether players can see this relationship (undefined = true)
	createdAt?: Date; // When link was created
	updatedAt?: Date; // When link was last updated
	metadata?: {
		// Extensible metadata for additional link properties
		tags?: string[];
		tension?: number;
		[key: string]: unknown; // Allow additional custom fields
	};
}

// Base entity interface - all entities extend this
export interface BaseEntity {
	id: EntityId;
	type: EntityType;
	name: string;
	description: string; // Rich text (markdown)
	summary?: string; // AI-generated brief summary for context injection
	tags: string[];
	imageUrl?: string;
	fields: Record<string, FieldValue>;
	links: EntityLink[];
	notes: string; // Private DM notes
	playerVisible?: boolean; // Whether players can see this entity (undefined = true)
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
	| 'image'
	| 'computed'; // Computed field based on formula

// Configuration for computed fields
export interface ComputedFieldConfig {
	formula: string; // Formula with {fieldName} placeholders
	dependencies: string[]; // Field keys this formula depends on
	outputType: 'text' | 'number' | 'boolean'; // Type of the computed result
}

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
	aiGenerate?: boolean; // Explicitly enable/disable AI generation for this field (default: enabled for text-based fields)
	computedConfig?: ComputedFieldConfig; // Configuration for computed fields
}

// Entity type definition (defines what fields an entity type has)
export interface EntityTypeDefinition {
	type: EntityType;
	label: string;
	labelPlural: string;
	description?: string;
	icon: string;
	color: string;
	isBuiltIn: boolean;
	fieldDefinitions: FieldDefinition[];
	defaultRelationships: string[];
}

// Overrides for customizing built-in entity types
export interface EntityTypeOverride {
	type: EntityType; // The built-in type being customized
	hiddenFromSidebar?: boolean; // Hide this type from sidebar navigation
	hiddenFields?: string[]; // Field keys to hide from forms/display
	fieldOrder?: string[]; // Custom field ordering (field keys in order)
	additionalFields?: FieldDefinition[]; // Custom fields added to this built-in type
}

// Helper type for creating new entities
export type NewEntity = Omit<BaseEntity, 'id' | 'createdAt' | 'updatedAt'>;

// Relationship chain types for graph traversal
export interface ChainNode {
	entity: BaseEntity;
	depth: number;
	path: EntityLink[];
}

export interface RelationshipChainOptions {
	maxDepth?: number; // Maximum traversal depth (default: 3)
	relationshipTypes?: string[]; // Filter by specific relationship types
	entityTypes?: EntityType[]; // Filter by entity types to include
	direction?: 'outgoing' | 'incoming' | 'both'; // Direction to traverse (default: 'both')
}

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
