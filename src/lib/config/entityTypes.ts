import type { EntityTypeDefinition, EntityTypeOverride, FieldDefinition } from '$lib/types';

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
				placeholder: 'Who plays this character?'
			},
			{
				key: 'concept',
				label: 'Character Concept',
				type: 'text',
				required: false,
				order: 2,
				placeholder: 'e.g., Grizzled veteran seeking redemption'
			},
			{
				key: 'background',
				label: 'Background',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'personality',
				label: 'Personality',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'goals',
				label: 'Goals & Motivations',
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
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['active', 'inactive', 'deceased'],
				required: true,
				defaultValue: 'active',
				order: 7
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
				order: 2
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
				key: 'motivation',
				label: 'Motivation',
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
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['alive', 'deceased', 'unknown'],
				required: true,
				defaultValue: 'alive',
				order: 7
			},
			{
				key: 'importance',
				label: 'Importance',
				type: 'select',
				options: ['major', 'minor', 'background'],
				required: false,
				defaultValue: 'minor',
				order: 8
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
				order: 3
			},
			{
				key: 'history',
				label: 'History',
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
				section: 'hidden'
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
				order: 2
			},
			{
				key: 'values',
				label: 'Values & Beliefs',
				type: 'richtext',
				required: false,
				order: 3
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
				section: 'hidden'
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
		type: 'encounter',
		label: 'Encounter',
		labelPlural: 'Encounters',
		icon: 'swords',
		color: 'encounter',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'encounterType',
				label: 'Type',
				type: 'select',
				options: ['combat', 'social', 'exploration', 'puzzle', 'trap', 'event'],
				required: false,
				order: 1
			},
			{
				key: 'setup',
				label: 'Setup/Hook',
				type: 'richtext',
				required: false,
				order: 2
			},
			{
				key: 'challenge',
				label: 'Challenge',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'resolution',
				label: 'Possible Resolutions',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'rewards',
				label: 'Rewards',
				type: 'richtext',
				required: false,
				order: 5
			},
			{
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				options: ['trivial', 'easy', 'moderate', 'hard', 'deadly'],
				required: false,
				order: 6
			},
			{
				key: 'status',
				label: 'Status',
				type: 'select',
				options: ['planned', 'ready', 'used', 'scrapped'],
				required: true,
				defaultValue: 'planned',
				order: 7
			}
		],
		defaultRelationships: ['located_at', 'involves']
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
				order: 3
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
