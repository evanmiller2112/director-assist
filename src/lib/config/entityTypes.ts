import type {
	EntityTypeDefinition,
	EntityTypeOverride,
	FieldDefinition,
	EntityType
} from '$lib/types';
import type { SystemProfile, SystemEntityModification } from '$lib/types/systems';

export const BUILT_IN_ENTITY_TYPES: EntityTypeDefinition[] = [
	{
		type: 'character',
		label: 'Player Character',
		labelPlural: 'Player Characters',
		icon: 'user',
		color: 'character',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'playerName',
				label: 'Player Name',
				type: 'text',
				required: true,
				order: 1,
				placeholder: 'Who plays this character?',
				aiGenerate: false
			},
			{
				key: 'concept',
				label: 'Character Concept',
				type: 'text',
				required: false,
				order: 2,
				placeholder: 'e.g., Grizzled veteran seeking redemption',
				helpText: 'Brief summary of the character idea in one sentence'
			},
			{
				key: 'ancestry',
				label: 'Ancestry',
				type: 'text',
				required: false,
				order: 3,
				placeholder: 'e.g., Human, Elf, Dwarf'
			},
			{
				key: 'culture',
				label: 'Culture',
				type: 'text',
				required: false,
				order: 4,
				placeholder: 'e.g., Nomadic, Urban, Monastic'
			},
			{
				key: 'career',
				label: 'Career',
				type: 'text',
				required: false,
				order: 5,
				placeholder: 'e.g., Soldier, Scholar, Craftsperson'
			},
			{
				key: 'heroClass',
				label: 'Class',
				type: 'text',
				required: false,
				order: 6,
				placeholder: 'e.g., Fury, Tactician, Shadow'
			},
			{
				key: 'subclass',
				label: 'Subclass',
				type: 'text',
				required: false,
				order: 7,
				placeholder: 'e.g., Reaver, Vanguard, Stormwight'
			},
			{
				key: 'background',
				label: 'Background',
				type: 'richtext',
				required: false,
				order: 8
			},
			{
				key: 'personality',
				label: 'Personality',
				type: 'richtext',
				required: false,
				order: 9
			},
			{
				key: 'goals',
				label: 'Goals & Motivations',
				type: 'richtext',
				required: false,
				order: 10,
				helpText: 'What drives this character? What do they want to achieve?'
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 11,
				section: 'hidden',
				helpText: 'Hidden aspects of their backstory. Private DM notes about what players might discover.'
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['active', 'inactive', 'deceased'],
				required: true,
				defaultValue: 'active',
				order: 12
			}
		],
		defaultRelationships: ['knows', 'allied_with', 'enemy_of', 'member_of']
	},
	{
		type: 'npc',
		label: 'NPC',
		labelPlural: 'NPCs',
		icon: 'users',
		color: 'npc',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'role',
				label: 'Role/Occupation',
				type: 'text',
				required: false,
				order: 1,
				placeholder: 'e.g., Innkeeper, Guard Captain, Merchant'
			},
			{
				key: 'personality',
				label: 'Personality',
				type: 'richtext',
				required: false,
				order: 2,
				helpText: 'Key traits, behaviors, and quirks that define this character'
			},
			{
				key: 'appearance',
				label: 'Appearance',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'voice',
				label: 'Voice/Mannerisms',
				type: 'text',
				required: false,
				order: 4,
				placeholder: 'e.g., Deep gravelly voice, speaks slowly'
			},
			{
				key: 'greetings',
				label: 'Greetings',
				type: 'textarea',
				required: false,
				order: 5,
				placeholder: 'e.g., \'Well met, traveler! What brings ye to these parts?\'',
				helpText: 'What the NPC says when first meeting players'
			},
			{
				key: 'motivation',
				label: 'Motivation',
				type: 'richtext',
				required: false,
				order: 6,
				helpText: 'What drives this NPC? What goals or desires motivate their actions?'
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 7,
				section: 'hidden',
				helpText: 'Hidden information about this NPC that players might discover through interaction'
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['alive', 'deceased', 'unknown'],
				required: true,
				defaultValue: 'alive',
				order: 8
			},
			{
				key: 'importance',
				label: 'Importance',
				type: 'select',
				options: ['major', 'minor', 'background'],
				required: false,
				defaultValue: 'minor',
				order: 9
			}
		],
		defaultRelationships: ['located_at', 'member_of', 'serves', 'worships', 'knows']
	},
	{
		type: 'location',
		label: 'Location',
		labelPlural: 'Locations',
		icon: 'map-pin',
		color: 'location',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'locationType',
				label: 'Type',
				type: 'select',
				options: [
					'city',
					'town',
					'village',
					'dungeon',
					'wilderness',
					'building',
					'region',
					'plane',
					'other'
				],
				required: false,
				order: 1
			},
			{
				key: 'atmosphere',
				label: 'Atmosphere',
				type: 'richtext',
				required: false,
				order: 2,
				helpText: 'What does it feel like to be here?'
			},
			{
				key: 'features',
				label: 'Notable Features',
				type: 'richtext',
				required: false,
				order: 3,
				helpText: 'Landmarks and distinguishing characteristics that stand out about this place'
			},
			{
				key: 'history',
				label: 'History',
				type: 'richtext',
				required: false,
				order: 4,
				helpText: 'Past events and origins of this location. How was it founded or created?'
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 5,
				section: 'hidden',
				helpText: 'Hidden aspects of this location that players might discover through exploration. DM notes.'
			},
			{
				key: 'parentLocation',
				label: 'Part Of',
				type: 'entity-ref',
				entityTypes: ['location'],
				required: false,
				order: 6
			}
		],
		defaultRelationships: ['contains', 'part_of', 'near', 'connected_to']
	},
	{
		type: 'faction',
		label: 'Faction',
		labelPlural: 'Factions',
		icon: 'flag',
		color: 'faction',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'factionType',
				label: 'Type',
				type: 'select',
				options: ['guild', 'religion', 'government', 'criminal', 'military', 'secret', 'other'],
				required: false,
				order: 1
			},
			{
				key: 'goals',
				label: 'Goals',
				type: 'richtext',
				required: false,
				order: 2,
				helpText: 'What objectives does this faction seek to achieve?'
			},
			{
				key: 'values',
				label: 'Values & Beliefs',
				type: 'richtext',
				required: false,
				order: 3,
				helpText: 'Core principles and beliefs that are important to this faction'
			},
			{
				key: 'resources',
				label: 'Resources & Power',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 5,
				section: 'hidden',
				helpText: 'Hidden agendas and secret information about this faction. DM notes.'
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['active', 'disbanded', 'secret'],
				required: true,
				defaultValue: 'active',
				order: 6
			}
		],
		defaultRelationships: ['allied_with', 'enemy_of', 'controls', 'based_at']
	},
	{
		type: 'item',
		label: 'Item',
		labelPlural: 'Items',
		icon: 'package',
		color: 'item',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'itemType',
				label: 'Type',
				type: 'select',
				options: ['weapon', 'armor', 'artifact', 'consumable', 'tool', 'treasure', 'other'],
				required: false,
				order: 1
			},
			{
				key: 'properties',
				label: 'Properties',
				type: 'richtext',
				required: false,
				order: 2
			},
			{
				key: 'history',
				label: 'History/Lore',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'currentOwner',
				label: 'Current Owner',
				type: 'entity-ref',
				entityTypes: ['character', 'npc', 'faction'],
				required: false,
				order: 4
			},
			{
				key: 'location',
				label: 'Location',
				type: 'entity-ref',
				entityTypes: ['location'],
				required: false,
				order: 5
			},
			{
				key: 'rarity',
				label: 'Rarity',
				type: 'select',
				options: ['common', 'uncommon', 'rare', 'legendary', 'unique'],
				required: false,
				order: 6
			}
		],
		defaultRelationships: ['owned_by', 'located_at', 'created_by']
	},
	{
		type: 'session',
		label: 'Session',
		labelPlural: 'Sessions',
		icon: 'calendar',
		color: 'session',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'sessionNumber',
				label: 'Session Number',
				type: 'number',
				required: true,
				order: 1
			},
			{
				key: 'date',
				label: 'Date Played',
				type: 'date',
				required: false,
				order: 2
			},
			{
				key: 'summary',
				label: 'Summary',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'preparation',
				label: 'Preparation Notes',
				type: 'richtext',
				required: false,
				order: 4,
				section: 'prep'
			},
			{
				key: 'plotThreads',
				label: 'Plot Threads',
				type: 'richtext',
				required: false,
				order: 5
			},
			{
				key: 'playerActions',
				label: 'Notable Player Actions',
				type: 'richtext',
				required: false,
				order: 6
			},
			{
				key: 'nextSession',
				label: 'Next Session Hooks',
				type: 'richtext',
				required: false,
				order: 7
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['planned', 'completed'],
				required: true,
				defaultValue: 'planned',
				order: 8
			}
		],
		defaultRelationships: ['involved', 'took_place_at']
	},
	{
		type: 'scene',
		label: 'Scene',
		labelPlural: 'Scenes',
		icon: 'theater',
		color: 'scene',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'sceneStatus',
				label: 'Status',
				type: 'select',
				options: ['planned', 'in_progress', 'completed'],
				required: true,
				defaultValue: 'planned',
				order: 1
			},
			{
				key: 'sceneType',
				label: 'Scene Type',
				type: 'select',
				options: ['combat', 'negotiation', 'exploration', 'montage', 'social', 'investigation'],
				required: false,
				order: 2
			},
			{
				key: 'encounterRef',
				label: 'Encounter',
				type: 'entity-ref',
				entityTypes: ['encounter'],
				required: false,
				order: 3,
				helpText: 'Link to an encounter entity for combat scenes'
			},
			{
				key: 'currentRound',
				label: 'Current Round',
				type: 'number',
				required: false,
				order: 4,
				placeholder: '1',
				helpText: 'Track the current combat round'
			},
			{
				key: 'initiativeOrder',
				label: 'Initiative Order',
				type: 'textarea',
				required: false,
				order: 5,
				placeholder: 'Character 1 (15)\nEnemy A (12)\nCharacter 2 (8)',
				helpText: 'Track turn order and initiative values'
			},
			{
				key: 'location',
				label: 'Location',
				type: 'entity-ref',
				entityTypes: ['location'],
				required: false,
				order: 6
			},
			{
				key: 'npcsPresent',
				label: 'NPCs Present',
				type: 'entity-refs',
				entityTypes: ['npc'],
				required: false,
				order: 7
			},
			{
				key: 'sceneSettingText',
				label: 'Scene Setting (Read-Aloud)',
				type: 'richtext',
				required: false,
				order: 8,
				helpText: 'Vivid description of the scene. Can be AI-generated from location and NPCs.'
			},
			{
				key: 'whatHappened',
				label: 'What Happened',
				type: 'richtext',
				required: false,
				order: 9,
				helpText: 'Record what actually happened during the scene.'
			},
			{
				key: 'preSummary',
				label: 'Pre-Scene Summary',
				type: 'richtext',
				required: false,
				order: 10,
				helpText: 'Brief summary of the scene setup (1-2 sentences). Can be AI-generated.'
			},
			{
				key: 'postSummary',
				label: 'Post-Scene Summary',
				type: 'richtext',
				required: false,
				order: 11,
				helpText: 'Brief summary of what happened (1-2 sentences). Can be AI-generated.'
			},
			{
				key: 'mood',
				label: 'Mood',
				type: 'select',
				options: ['tense', 'relaxed', 'mysterious', 'celebratory', 'somber', 'chaotic', 'peaceful', 'ominous', 'triumphant', 'desperate', 'exhilarating'],
				required: false,
				order: 12
			},
			{
				key: 'session',
				label: 'Session',
				type: 'entity-ref',
				entityTypes: ['session'],
				required: false,
				order: 13,
				helpText: 'Link this scene to a game session for campaign timeline organization'
			},
			{
				key: 'sceneOrder',
				label: 'Scene Order',
				type: 'number',
				required: false,
				order: 14,
				placeholder: 'e.g., 1',
				helpText: 'Order this scene within its session (only needed when linked to a session)'
			}
		],
		defaultRelationships: ['occurred_at', 'featured', 'part_of', 'leads_to', 'follows']
	},
	{
		type: 'deity',
		label: 'Deity',
		labelPlural: 'Deities',
		icon: 'sun',
		color: 'deity',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'domains',
				label: 'Domains/Portfolios',
				type: 'tags',
				required: false,
				order: 1,
				placeholder: 'e.g., War, Justice, Healing'
			},
			{
				key: 'alignment',
				label: 'Alignment/Nature',
				type: 'text',
				required: false,
				order: 2
			},
			{
				key: 'symbols',
				label: 'Symbols',
				type: 'text',
				required: false,
				order: 3
			},
			{
				key: 'worship',
				label: 'Worship Practices',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'relationships',
				label: 'Divine Relationships',
				type: 'richtext',
				required: false,
				order: 5
			},
			{
				key: 'secrets',
				label: 'Secrets',
				type: 'richtext',
				required: false,
				order: 6,
				section: 'hidden'
			}
		],
		defaultRelationships: ['worshipped_by', 'enemy_of', 'allied_with']
	},
	{
		type: 'timeline_event',
		label: 'Timeline Event',
		labelPlural: 'Timeline Events',
		icon: 'clock',
		color: 'timeline',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'eventDate',
				label: 'In-World Date',
				type: 'text',
				required: false,
				order: 1,
				placeholder: 'e.g., Year 1042, Third Age'
			},
			{
				key: 'era',
				label: 'Era/Age',
				type: 'text',
				required: false,
				order: 2
			},
			{
				key: 'significance',
				label: 'Significance',
				type: 'richtext',
				required: false,
				order: 3,
				helpText: 'Why was this event important? What impact did it have on the world?'
			},
			{
				key: 'consequences',
				label: 'Consequences',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'knownBy',
				label: 'Known By',
				type: 'select',
				options: ['common_knowledge', 'scholarly', 'secret', 'lost'],
				required: false,
				order: 5
			},
			{
				key: 'sortOrder',
				label: 'Sort Order',
				type: 'number',
				required: false,
				order: 6,
				helpText: 'Used to order events chronologically'
			}
		],
		defaultRelationships: ['involved', 'caused_by', 'led_to']
	},
	{
		type: 'world_rule',
		label: 'World Rule',
		labelPlural: 'World Rules',
		icon: 'book',
		color: 'rule',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'category',
				label: 'Category',
				type: 'select',
				options: ['magic', 'cosmology', 'society', 'nature', 'history', 'other'],
				required: false,
				order: 1
			},
			{
				key: 'rule',
				label: 'Rule/Law',
				type: 'richtext',
				required: true,
				order: 2
			},
			{
				key: 'implications',
				label: 'Implications',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'exceptions',
				label: 'Exceptions',
				type: 'richtext',
				required: false,
				order: 4
			}
		],
		defaultRelationships: ['affects', 'related_to']
	},
	{
		type: 'player_profile',
		label: 'Player Profile',
		labelPlural: 'Player Profiles',
		icon: 'user-circle',
		color: 'player',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'realName',
				label: 'Real Name',
				type: 'text',
				required: true,
				order: 1
			},
			{
				key: 'preferences',
				label: 'Play Preferences',
				type: 'richtext',
				required: false,
				order: 2,
				helpText: 'What kind of gameplay do they enjoy?'
			},
			{
				key: 'boundaries',
				label: 'Lines & Veils',
				type: 'richtext',
				required: false,
				order: 3,
				helpText: 'Topics to avoid or handle carefully'
			},
			{
				key: 'schedule',
				label: 'Availability',
				type: 'text',
				required: false,
				order: 4
			},
			{
				key: 'contact',
				label: 'Contact Info',
				type: 'text',
				required: false,
				order: 5
			}
		],
		defaultRelationships: ['plays']
	},
	{
		type: 'campaign',
		label: 'Campaign',
		labelPlural: 'Campaigns',
		icon: 'book-open',
		color: 'campaign',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'system',
				label: 'Game System',
				type: 'text',
				required: false,
				order: 1,
				placeholder: 'e.g., D&D 5e, Pathfinder, Draw Steel'
			},
			{
				key: 'setting',
				label: 'Setting',
				type: 'text',
				required: false,
				order: 2,
				placeholder: 'e.g., Forgotten Realms, Homebrew World'
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['active', 'paused', 'completed'],
				required: false,
				defaultValue: 'active',
				order: 3
			}
		],
		defaultRelationships: ['contains', 'features']
	}
];

// Apply an override to a built-in entity type definition
export function applyOverrideToType(
	typeDef: EntityTypeDefinition,
	override: EntityTypeOverride
): EntityTypeDefinition {
	let fieldDefs = [...typeDef.fieldDefinitions];

	// Add additional fields from override
	if (override.additionalFields && override.additionalFields.length > 0) {
		fieldDefs = [...fieldDefs, ...override.additionalFields];
	}

	// Filter out hidden fields
	if (override.hiddenFields && override.hiddenFields.length > 0) {
		fieldDefs = fieldDefs.filter((f) => !override.hiddenFields!.includes(f.key));
	}

	// Apply custom field ordering if specified
	if (override.fieldOrder && override.fieldOrder.length > 0) {
		const orderMap = new Map(override.fieldOrder.map((key, index) => [key, index]));
		fieldDefs = fieldDefs.sort((a, b) => {
			const orderA = orderMap.get(a.key) ?? 999;
			const orderB = orderMap.get(b.key) ?? 999;
			if (orderA !== orderB) return orderA - orderB;
			// Fall back to original order for fields not in the order list
			return a.order - b.order;
		});
	}

	return {
		...typeDef,
		fieldDefinitions: fieldDefs
	};
}

// Get an entity type definition by type string
// Optionally accepts custom types and overrides
export function getEntityTypeDefinition(
	type: string,
	customTypes: EntityTypeDefinition[] = [],
	overrides: EntityTypeOverride[] = []
): EntityTypeDefinition | undefined {
	// Check built-in types first
	const builtIn = BUILT_IN_ENTITY_TYPES.find((t) => t.type === type);
	if (builtIn) {
		// Apply override if one exists
		const override = overrides.find((o) => o.type === type);
		return override ? applyOverrideToType(builtIn, override) : builtIn;
	}

	// Then check custom types
	return customTypes.find((t) => t.type === type);
}

// Get all available entity types (built-in + custom)
// Applies overrides to built-in types and filters hidden ones
export function getAllEntityTypes(
	customTypes: EntityTypeDefinition[] = [],
	overrides: EntityTypeOverride[] = []
): EntityTypeDefinition[] {
	// Apply overrides to built-in types
	const builtInWithOverrides = BUILT_IN_ENTITY_TYPES.map((typeDef) => {
		const override = overrides.find((o) => o.type === typeDef.type);
		return override ? applyOverrideToType(typeDef, override) : typeDef;
	}).filter((typeDef) => {
		// Filter out types hidden from sidebar
		const override = overrides.find((o) => o.type === typeDef.type);
		return !override?.hiddenFromSidebar;
	});

	return [...builtInWithOverrides, ...customTypes];
}

// Get override for a specific type
export function getOverrideForType(
	type: string,
	overrides: EntityTypeOverride[]
): EntityTypeOverride | undefined {
	return overrides.find((o) => o.type === type);
}

// Default relationship types used across entities
export const DEFAULT_RELATIONSHIPS = [
	'knows',
	'allied_with',
	'enemy_of',
	'member_of',
	'located_at',
	'part_of',
	'serves',
	'worships',
	'owns',
	'created_by',
	'controls',
	'near',
	'connected_to',
	'contains',
	'involved',
	'caused_by',
	'led_to',
	'affects',
	'plays'
];

/**
 * Apply system modifications to field definitions
 * This is the internal helper that merges system-specific modifications
 *
 * @param baseFields - The base field definitions from the entity type
 * @param modification - The system-specific modifications to apply
 * @returns Modified field definitions
 */
export function applySystemModifications(
	baseFields: FieldDefinition[],
	modification: SystemEntityModification
): FieldDefinition[] {
	// Start with a copy of base fields
	let fields = [...baseFields];

	// Apply hidden fields filter
	if (modification.hiddenFields && modification.hiddenFields.length > 0) {
		fields = fields.filter((f) => !modification.hiddenFields!.includes(f.key));
	}

	// Apply field option overrides
	if (modification.fieldOptionOverrides) {
		fields = fields.map((field) => {
			const override = modification.fieldOptionOverrides?.[field.key];
			if (override) {
				return { ...field, options: override };
			}
			return field;
		});
	}

	// Add additional fields
	// If an additional field has the same key as a base field, replace the base field
	if (modification.additionalFields && modification.additionalFields.length > 0) {
		const additionalFieldKeys = new Set(modification.additionalFields.map((f) => f.key));

		// Remove base fields that will be replaced
		fields = fields.filter((f) => !additionalFieldKeys.has(f.key));

		// Add additional fields
		fields = [...fields, ...modification.additionalFields];
	}

	// Sort by order
	fields.sort((a, b) => a.order - b.order);

	return fields;
}

/**
 * Get entity type definition with system modifications applied
 * This function takes a base entity type and applies system-specific customizations
 *
 * @param type - The entity type identifier
 * @param baseDefinition - The base entity type definition (can be from BUILT_IN_ENTITY_TYPES or custom)
 * @param systemProfile - Optional system profile to apply modifications from
 * @param customTypes - Optional custom entity types
 * @param overrides - Optional entity type overrides
 * @returns Entity type definition with system modifications applied
 */
export function getEntityTypeDefinitionWithSystem(
	type: EntityType,
	baseDefinition: EntityTypeDefinition,
	systemProfile?: SystemProfile | null,
	customTypes: EntityTypeDefinition[] = [],
	overrides: EntityTypeOverride[] = []
): EntityTypeDefinition {
	// Start with the base definition
	let result = { ...baseDefinition };

	// Apply system modifications if a system profile is provided
	if (systemProfile && systemProfile.entityTypeModifications[type]) {
		const modification = systemProfile.entityTypeModifications[type];
		result = {
			...result,
			fieldDefinitions: applySystemModifications(result.fieldDefinitions, modification)
		};
	}

	// Apply entity type overrides (for backwards compatibility and additional customization)
	const override = overrides.find((o) => o.type === type);
	if (override) {
		result = applyOverrideToType(result, override);
	}

	return result;
}

/**
 * Get the default order for entity types, with campaign first.
 * Returns a new array instance each time to prevent shared references.
 */
export function getDefaultEntityTypeOrder(): string[] {
	return [
		'campaign',
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'session',
		'scene',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile'
	];
}

/**
 * Get entity types in a specific order.
 * Applies custom ordering to built-in types, handles overrides, and filters hidden types.
 *
 * Order logic:
 * 1. Built-in types appear first, in the order specified by customOrder (or default order if null)
 * 2. Types in customOrder that don't exist are skipped
 * 3. Built-in types not in customOrder are appended in default order
 * 4. Custom types always appear after all built-in types, in their defined order
 * 5. If custom types appear in customOrder, they respect that order among themselves
 *
 * @param customTypes User-defined entity types
 * @param overrides Overrides for built-in types
 * @param customOrder Custom ordering of entity type keys (null/undefined for default order)
 * @returns Ordered array of entity type definitions
 */
export function getOrderedEntityTypes(
	customTypes: EntityTypeDefinition[] = [],
	overrides: EntityTypeOverride[] = [],
	customOrder: string[] | null | undefined
): EntityTypeDefinition[] {
	// Get all entity types (with overrides applied, hidden filtered)
	const allTypes = getAllEntityTypes(customTypes, overrides);

	// Separate built-in and custom types
	const builtInTypes = allTypes.filter((t) => t.isBuiltIn);
	const customTypesFiltered = allTypes.filter((t) => !t.isBuiltIn);

	// If no custom order, use default order
	const orderToUse = customOrder && customOrder.length > 0 ? customOrder : getDefaultEntityTypeOrder();

	// Create a map for quick lookup
	const typeMap = new Map<string, EntityTypeDefinition>();
	builtInTypes.forEach((t) => typeMap.set(t.type, t));

	// Order built-in types according to customOrder
	const orderedBuiltIn: EntityTypeDefinition[] = [];
	const processedTypes = new Set<string>();

	// First pass: add types that are in the custom order
	orderToUse.forEach((typeKey) => {
		const typeDef = typeMap.get(typeKey);
		if (typeDef && !processedTypes.has(typeKey)) {
			orderedBuiltIn.push(typeDef);
			processedTypes.add(typeKey);
		}
	});

	// Second pass: add remaining built-in types not in custom order (in default order)
	const defaultOrder = getDefaultEntityTypeOrder();
	defaultOrder.forEach((typeKey) => {
		const typeDef = typeMap.get(typeKey);
		if (typeDef && !processedTypes.has(typeKey)) {
			orderedBuiltIn.push(typeDef);
			processedTypes.add(typeKey);
		}
	});

	// Handle custom types ordering
	let orderedCustom: EntityTypeDefinition[] = [];

	if (customOrder && customOrder.length > 0) {
		// If custom types are in the order, respect that order
		const customTypeMap = new Map<string, EntityTypeDefinition>();
		customTypesFiltered.forEach((t) => customTypeMap.set(t.type, t));

		const processedCustom = new Set<string>();

		// Add custom types that appear in customOrder
		customOrder.forEach((typeKey) => {
			const typeDef = customTypeMap.get(typeKey);
			if (typeDef && !processedCustom.has(typeKey)) {
				orderedCustom.push(typeDef);
				processedCustom.add(typeKey);
			}
		});

		// Add remaining custom types in their original order
		customTypesFiltered.forEach((typeDef) => {
			if (!processedCustom.has(typeDef.type)) {
				orderedCustom.push(typeDef);
			}
		});
	} else {
		// No custom order, use original order
		orderedCustom = customTypesFiltered;
	}

	// Combine: built-in types first, then custom types
	return [...orderedBuiltIn, ...orderedCustom];
}
