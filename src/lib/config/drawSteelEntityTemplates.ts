/**
 * Draw Steel Entity Type Templates (Issue #164)
 *
 * Pre-configured entity type templates for common Draw Steel mechanics.
 * These templates help Directors quickly create custom entities for their campaigns
 * with fields tailored to Draw Steel's game systems.
 *
 * Templates:
 * 1. Monster/Threat - Enemies and creatures for encounters
 * 2. Ability/Power - Class abilities and kit powers
 * 3. Condition - Status effects and temporary states
 * 4. Negotiation Outcome - Negotiation encounter outcomes
 * 5. Spell/Ritual - Magic spells and rituals
 * 6. Encounter - Encounter planning and management (Issue #219)
 * 7. Treasure/Loot - Treasure and loot items for rewards (Issue #220)
 */

import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

/**
 * EntityTypeTemplate Interface
 * Defines structure for entity type templates with metadata
 */
export interface EntityTypeTemplate {
	id: string; // Unique template identifier (e.g., 'ds-monster-threat')
	name: string; // Display name (e.g., 'Monster/Threat')
	description: string; // Template description and use case
	category: string; // Category for organization (e.g., 'draw-steel')
	template: EntityTypeDefinition; // Complete entity type definition
	exampleValues?: Record<string, unknown>; // Example field values (Issue #222)
}

// =============================================================================
// Template 1: Monster/Threat Entity Template
// =============================================================================

const monsterThreatTemplate: EntityTypeTemplate = {
	id: 'ds-monster-threat',
	name: 'Monster/Threat',
	description:
		'Track enemies, creatures, and threats for encounters with full Draw Steel combat statistics including threat level, role, AC, HP, movement, and special abilities.',
	category: 'draw-steel',
	template: {
		type: 'ds-monster-threat',
		label: 'Monster/Threat',
		labelPlural: 'Monsters/Threats',
		icon: 'skull',
		color: 'red',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'threat_level',
				label: 'Threat Level',
				type: 'select',
				required: false,
				options: ['minion', 'standard', 'boss'],
				order: 1
			},
			{
				key: 'role',
				label: 'Role',
				type: 'select',
				required: false,
				options: ['ambusher', 'brute', 'defender', 'hexer', 'striker', 'support'],
				order: 2
			},
			{
				key: 'ac',
				label: 'AC',
				type: 'number',
				required: false,
				order: 3
			},
			{
				key: 'hp',
				label: 'HP',
				type: 'number',
				required: false,
				order: 4
			},
			{
				key: 'movement',
				label: 'Movement',
				type: 'number',
				required: false,
				order: 5
			},
			{
				key: 'abilities',
				label: 'Abilities',
				type: 'richtext',
				required: false,
				order: 6
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		threat_level: 'standard',
		role: 'striker',
		ac: 14,
		hp: 32,
		movement: 6,
		abilities: 'Shadow Strike: Make a melee attack. On a hit, deal 2d6 damage and teleport 2 squares to an unoccupied space adjacent to the target.'
	}
};

// =============================================================================
// Template 2: Ability/Power Entity Template
// =============================================================================

const abilityPowerTemplate: EntityTypeTemplate = {
	id: 'ds-ability-power',
	name: 'Ability/Power',
	description:
		'Document class abilities, kit powers, and special actions for use in Draw Steel encounters with action cost, resource requirements, damage formulas, range, and targeting information.',
	category: 'draw-steel',
	template: {
		type: 'ds-ability-power',
		label: 'Ability/Power',
		labelPlural: 'Abilities/Powers',
		icon: 'zap',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'action_cost',
				label: 'Action Cost',
				type: 'select',
				required: false,
				options: ['action', 'maneuver', 'triggered'],
				order: 1
			},
			{
				key: 'heroic_resource_cost',
				label: 'Heroic Resource Cost',
				type: 'text',
				required: false,
				order: 2
			},
			{
				key: 'damage_formula',
				label: 'Damage Formula',
				type: 'text',
				required: false,
				order: 3
			},
			{
				key: 'range',
				label: 'Range',
				type: 'select',
				required: false,
				options: ['melee', 'ranged-5', 'ranged-10', 'self', 'special'],
				order: 4
			},
			{
				key: 'targets',
				label: 'Targets',
				type: 'select',
				required: false,
				options: ['single', 'burst-1', 'burst-2', 'line', 'cube', 'wall'],
				order: 5
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		action_cost: 'action',
		heroic_resource_cost: '2 Heroic Resources',
		damage_formula: '3d6 + Might',
		range: 'melee',
		targets: 'single'
	}
};

// =============================================================================
// Template 3: Condition Entity Template
// =============================================================================

const conditionTemplate: EntityTypeTemplate = {
	id: 'ds-condition',
	name: 'Condition',
	description:
		'Track status effects, temporary states, and conditions for use in Draw Steel encounters including duration, stacking behavior, and mechanical effects.',
	category: 'draw-steel',
	template: {
		type: 'ds-condition',
		label: 'Condition',
		labelPlural: 'Conditions',
		icon: 'flame',
		color: 'orange',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'duration',
				label: 'Duration',
				type: 'text',
				required: false,
				order: 1
			},
			{
				key: 'stacking',
				label: 'Stacking',
				type: 'boolean',
				required: false,
				order: 2
			},
			{
				key: 'description',
				label: 'Description',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'effect_text',
				label: 'Effect Text',
				type: 'richtext',
				required: false,
				order: 4
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		duration: 'End of next turn',
		stacking: false,
		description: 'The target is wreathed in spectral flames that hinder their movements and attacks.',
		effect_text: 'While burning, the target takes 1d6 fire damage at the start of each of their turns and has disadvantage on attack rolls.'
	}
};

// =============================================================================
// Template 4: Negotiation Outcome Entity Template
// =============================================================================

const negotiationOutcomeTemplate: EntityTypeTemplate = {
	id: 'ds-negotiation-outcome',
	name: 'Negotiation Outcome',
	description:
		'Document possible outcomes for negotiation encounters tracking position shifts, morale impacts, and treaty terms for use in Draw Steel social encounters.',
	category: 'draw-steel',
	template: {
		type: 'ds-negotiation-outcome',
		label: 'Negotiation Outcome',
		labelPlural: 'Negotiation Outcomes',
		icon: 'drama',
		color: 'purple',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'position_shift',
				label: 'Position Shift',
				type: 'select',
				required: false,
				options: ['hostile', 'unfavorable', 'neutral', 'favorable', 'friendly'],
				order: 1
			},
			{
				key: 'morale_impact',
				label: 'Morale Impact',
				type: 'text',
				required: false,
				order: 2
			},
			{
				key: 'treaty_terms',
				label: 'Treaty Terms',
				type: 'richtext',
				required: false,
				order: 3
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		position_shift: 'favorable',
		morale_impact: '+2 to party morale',
		treaty_terms: 'The merchant guild agrees to provide safe passage through their territory and a 15% discount on all trade goods for the next month in exchange for clearing the bandit camp to the east.'
	}
};

// =============================================================================
// Template 5: Spell/Ritual Entity Template
// =============================================================================

const spellRitualTemplate: EntityTypeTemplate = {
	id: 'ds-spell-ritual',
	name: 'Spell/Ritual',
	description:
		'Reference magic spells and rituals for use in Draw Steel campaigns with level, schools, casting time, range, and duration information.',
	category: 'draw-steel',
	template: {
		type: 'ds-spell-ritual',
		label: 'Spell/Ritual',
		labelPlural: 'Spells/Rituals',
		icon: 'sparkles',
		color: 'blue',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'level',
				label: 'Level',
				type: 'number',
				required: false,
				order: 1,
				helpText: 'Enter the power tier of the spell (0 for cantrips, 1-9 for leveled spells).'
			},
			{
				key: 'schools',
				label: 'Schools',
				type: 'multi-select',
				required: false,
				options: [
					'abjuration',
					'conjuration',
					'divination',
					'enchantment',
					'evocation',
					'illusion',
					'necromancy',
					'transmutation'
				],
				order: 2,
				helpText: 'Select magic schools for this spell. Customize these for your campaign.'
			},
			{
				key: 'casting_time',
				label: 'Casting Time',
				type: 'text',
				required: false,
				order: 3,
				helpText: 'Describe how long it takes to cast, such as 1 action, 1 maneuver, or 10 minutes for rituals.'
			},
			{
				key: 'range',
				label: 'Range',
				type: 'text',
				required: false,
				order: 4,
				helpText: 'Specify maximum distance for targeting, like self, touch, 5 squares, or 10 squares.'
			},
			{
				key: 'duration',
				label: 'Duration',
				type: 'text',
				required: false,
				order: 5,
				helpText: 'How long the spell effect lasts (e.g., instant, 1 round, concentration).'
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		level: 3,
		schools: ['evocation', 'illusion'],
		casting_time: '1 action',
		range: '10 squares',
		duration: 'Concentration, up to 1 minute'
	}
};

// =============================================================================
// Template 6: Encounter Entity Template (Issue #219)
// =============================================================================

const encounterTemplate: EntityTypeTemplate = {
	id: 'ds-encounter',
	name: 'Encounter',
	description:
		'Plan and organize combat encounters for Draw Steel campaigns including difficulty ratings, creature lists, environmental features, objectives, rewards, and tactical notes for Directors.',
	category: 'draw-steel',
	template: {
		type: 'ds-encounter',
		label: 'Encounter',
		labelPlural: 'Encounters',
		icon: 'swords',
		color: 'green',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'encounter_name',
				label: 'Encounter Name',
				type: 'text',
				required: false,
				order: 1
			},
			{
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				options: ['trivial', 'easy', 'medium', 'hard', 'deadly'],
				order: 2
			},
			{
				key: 'creatures',
				label: 'Creatures/Enemies',
				type: 'richtext',
				required: false,
				order: 3
			},
			{
				key: 'environment',
				label: 'Environment',
				type: 'textarea',
				required: false,
				order: 4
			},
			{
				key: 'objectives',
				label: 'Objectives',
				type: 'richtext',
				required: false,
				order: 5
			},
			{
				key: 'rewards',
				label: 'Rewards',
				type: 'richtext',
				required: false,
				order: 6
			},
			{
				key: 'tactics_notes',
				label: 'Tactics Notes',
				type: 'richtext',
				required: false,
				order: 7
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		encounter_name: 'Ambush at the Old Mill',
		difficulty: 'medium',
		creatures: '4 Goblin Strikers (standard), 1 Hobgoblin Brute (boss). The goblins use hit-and-run tactics while the hobgoblin holds the center position.',
		environment: 'An abandoned water mill with a broken wheel, rotting wooden platforms at different heights, and a fast-moving stream running underneath. Difficult terrain on the platforms.',
		objectives: 'Primary: Defeat the ambushers and recover the stolen supplies. Secondary: Prevent any enemies from escaping to alert their camp. Bonus: Save the captured merchant.',
		rewards: '250 gold worth of recovered trade goods, a +1 weapon taken from the hobgoblin leader, and information about the goblin camp location carved into a crude map.',
		tactics_notes: 'Goblins focus on ranged attacks from elevated positions and use their movement to stay out of melee range. The hobgoblin tries to block access to the platforms and protect the archer positions. If reduced below half HP, the hobgoblin sounds a horn to call for reinforcements (arriving in 3 rounds).'
	}
};

// =============================================================================
// Template 7: Treasure/Loot Entity Template (Issue #220)
// =============================================================================

const treasureLootTemplate: EntityTypeTemplate = {
	id: 'ds-treasure-loot',
	name: 'Treasure/Loot',
	description:
		'Track treasure, loot items, and rewards for Draw Steel campaigns including item value, rarity tiers, magical properties, descriptions, and origin stories for narrative context.',
	category: 'draw-steel',
	template: {
		type: 'ds-treasure-loot',
		label: 'Treasure/Loot',
		labelPlural: 'Treasure/Loot',
		icon: 'gem',
		color: 'cyan',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'name',
				label: 'Name',
				type: 'text',
				required: false,
				order: 1
			},
			{
				key: 'value',
				label: 'Value',
				type: 'text',
				required: false,
				order: 2
			},
			{
				key: 'rarity',
				label: 'Rarity',
				type: 'select',
				required: false,
				options: ['common', 'uncommon', 'rare', 'very rare', 'legendary'],
				order: 3
			},
			{
				key: 'description',
				label: 'Description',
				type: 'richtext',
				required: false,
				order: 4
			},
			{
				key: 'properties',
				label: 'Properties',
				type: 'richtext',
				required: false,
				order: 5
			},
			{
				key: 'origin',
				label: 'Origin',
				type: 'textarea',
				required: false,
				order: 6
			}
		],
		defaultRelationships: []
	},
	exampleValues: {
		name: 'Cloak of the Midnight Veil',
		value: '800 gold',
		rarity: 'rare',
		description: 'A deep indigo cloak that seems to absorb light around its edges, creating an aura of shadow that clings to the wearer like morning mist.',
		properties: 'While wearing this cloak, you gain advantage on Agility tests made to hide in dim light or darkness. Once per encounter, you can use a maneuver to become invisible until the end of your next turn or until you make an attack.',
		origin: 'Woven by the shadow elves of the Deepwood from threads of captured starlight and darkness, this cloak was a gift to their most skilled scouts and spies. The magical weaving technique has been lost for over three centuries.'
	}
};

// =============================================================================
// Export All Templates
// =============================================================================

export const DRAW_STEEL_ENTITY_TEMPLATES: EntityTypeTemplate[] = [
	monsterThreatTemplate,
	abilityPowerTemplate,
	conditionTemplate,
	negotiationOutcomeTemplate,
	spellRitualTemplate,
	encounterTemplate,
	treasureLootTemplate
];
