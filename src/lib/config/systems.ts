import type { SystemProfile, SystemId } from '$lib/types/systems';

/**
 * Draw Steel game system profile
 * https://mcdmproductions.com/
 */
export const DRAW_STEEL_PROFILE: SystemProfile = {
	id: 'draw-steel',
	name: 'Draw Steel',
	description: 'MCDM Productions tactical fantasy RPG',
	entityTypeModifications: {
		character: {
			additionalFields: [
				{
					key: 'ancestry',
					label: 'Ancestry',
					type: 'select',
					options: [
						'Devil',
						'Dragon Knight',
						'Dwarf',
						'Hakaan',
						'High Elf',
						'Human',
						'Memonek',
						'Orc',
						'Polder',
						'Revenant',
						'Time Raider',
						'Wode Elf'
					],
					required: false,
					order: 10
				},
				{
					key: 'class',
					label: 'Class',
					type: 'select',
					options: [
						'Censor',
						'Conduit',
						'Elementalist',
						'Fury',
						'Null',
						'Shadow',
						'Tactician',
						'Talent',
						'Troubadour'
					],
					required: false,
					order: 11
				},
				{
					key: 'kit',
					label: 'Kit',
					type: 'text',
					required: false,
					order: 12
				},
				// Identity Fields
				{
					key: 'heritage',
					label: 'Heritage',
					type: 'text',
					helpText: 'Your character\'s specific subspecies or cultural variant within their ancestry',
					required: false,
					order: 14
				},
				{
					key: 'ancestryTrait',
					label: 'Ancestry Trait',
					type: 'richtext',
					helpText: 'The mechanical benefit granted by your ancestry',
					required: false,
					order: 15
				},
				// Ability Scores
				{
					key: 'might',
					label: 'Might',
					type: 'number',
					helpText: 'Physical power and strength (typically ranges from -2 to +4)',
					required: false,
					order: 20
				},
				{
					key: 'agility',
					label: 'Agility',
					type: 'number',
					helpText: 'Speed, reflexes, and coordination',
					required: false,
					order: 21
				},
				{
					key: 'reason',
					label: 'Reason',
					type: 'number',
					helpText: 'Logic, education, and mental acuity',
					required: false,
					order: 22
				},
				{
					key: 'intuition',
					label: 'Intuition',
					type: 'number',
					helpText: 'Instincts, experience, and awareness',
					required: false,
					order: 23
				},
				{
					key: 'presence',
					label: 'Presence',
					type: 'number',
					helpText: 'Personality, charisma, and social influence',
					required: false,
					order: 24
				},
				// Skills
				{
					key: 'skills',
					label: 'Skills',
					type: 'richtext',
					helpText: 'List your skills with their training levels (Trained, Expert, Master)',
					required: false,
					order: 30
				},
				// Health & Vitality
				{
					key: 'maxHP',
					label: 'Max HP',
					type: 'number',
					required: false,
					order: 40
				},
				{
					key: 'currentHP',
					label: 'Current HP',
					type: 'number',
					required: false,
					order: 41
				},
				{
					key: 'vitality',
					label: 'Vitality',
					type: 'number',
					required: false,
					order: 42
				},
				{
					key: 'conditions',
					label: 'Conditions',
					type: 'tags',
					helpText: 'Active conditions affecting the character',
					required: false,
					order: 43
				},
				// Resources
				{
					key: 'xp',
					label: 'XP',
					type: 'number',
					required: false,
					order: 50
				},
				{
					key: 'gold',
					label: 'Gold',
					type: 'number',
					required: false,
					order: 51
				},
				{
					key: 'weapons',
					label: 'Weapons',
					type: 'richtext',
					required: false,
					order: 52
				},
				{
					key: 'armor',
					label: 'Armor',
					type: 'richtext',
					required: false,
					order: 53
				},
				// Class Features
				{
					key: 'classFeatures',
					label: 'Class Features',
					type: 'richtext',
					required: false,
					order: 60
				},
				{
					key: 'heroicResource',
					label: 'Heroic Resource',
					type: 'richtext',
					required: false,
					order: 61
				}
			]
		},
		npc: {
			additionalFields: [
				{
					key: 'threatLevel',
					label: 'Threat Level',
					type: 'select',
					options: ['minion', 'standard', 'elite', 'boss', 'solo'],
					required: false,
					order: 10
				},
				{
					key: 'role',
					label: 'Combat Role',
					type: 'select',
					options: [
						'ambusher',
						'artillery',
						'brute',
						'controller',
						'defender',
						'harrier',
						'hexer',
						'leader',
						'mount',
						'support'
					],
					required: false,
					order: 11
				}
			]
		},
		encounter: {
			additionalFields: [
				{
					key: 'victoryPoints',
					label: 'Victory Points',
					type: 'number',
					required: false,
					order: 10
				},
				{
					key: 'negotiationDC',
					label: 'Negotiation DC',
					type: 'number',
					required: false,
					order: 11
				},
				{
					key: 'challengeLevel',
					label: 'Challenge Level',
					type: 'number',
					required: false,
					order: 12
				},
				{
					key: 'threats',
					label: 'Threats',
					type: 'entity-refs',
					entityTypes: ['npc'],
					required: false,
					order: 13
				},
				{
					key: 'environment',
					label: 'Environment',
					type: 'richtext',
					required: false,
					order: 14
				},
				{
					key: 'victoryConditions',
					label: 'Victory Conditions',
					type: 'richtext',
					required: false,
					order: 15
				},
				{
					key: 'defeatConditions',
					label: 'Defeat Conditions',
					type: 'richtext',
					required: false,
					order: 16
				},
				{
					key: 'readAloudText',
					label: 'Read-Aloud Text',
					type: 'richtext',
					required: false,
					order: 17
				},
				{
					key: 'tacticalNotes',
					label: 'Tactical Notes',
					type: 'richtext',
					required: false,
					order: 18
				},
				{
					key: 'treasureRewards',
					label: 'Treasure & Rewards',
					type: 'richtext',
					required: false,
					order: 19
				},
				{
					key: 'negotiationPosition',
					label: 'Negotiation Position',
					type: 'select',
					options: ['hostile', 'unfavorable', 'neutral', 'favorable', 'friendly'],
					required: false,
					order: 20
				},
				{
					key: 'negotiationMotivations',
					label: 'Negotiation Motivations',
					type: 'richtext',
					required: false,
					order: 21
				}
			],
			fieldOptionOverrides: {
				encounterType: [
					'combat',
					'negotiation',
					'montage',
					'exploration',
					'social',
					'puzzle',
					'trap'
				]
			}
		},
		session: {
			additionalFields: [
				{
					key: 'sessionDuration',
					label: 'Session Duration',
					type: 'text',
					required: false,
					order: 10
				},
				{
					key: 'inWorldDate',
					label: 'In-World Date',
					type: 'text',
					required: false,
					order: 11
				},
				{
					key: 'partyPresent',
					label: 'Party Present',
					type: 'entity-refs',
					entityTypes: ['character'],
					required: false,
					order: 12
				},
				{
					key: 'xpAwarded',
					label: 'XP Awarded',
					type: 'number',
					required: false,
					order: 13
				},
				{
					key: 'gloryAwarded',
					label: 'Glory Awarded',
					type: 'richtext',
					required: false,
					order: 14
				},
				{
					key: 'treasureAwarded',
					label: 'Treasure Awarded',
					type: 'richtext',
					required: false,
					order: 15
				},
				{
					key: 'keyDecisions',
					label: 'Key Decisions',
					type: 'richtext',
					required: false,
					order: 16
				},
				{
					key: 'characterDevelopment',
					label: 'Character Development',
					type: 'richtext',
					required: false,
					order: 17
				},
				{
					key: 'campaignMilestones',
					label: 'Campaign Milestones',
					type: 'tags',
					required: false,
					order: 18
				},
				{
					key: 'powerRollOutcomes',
					label: 'Power Roll Outcomes',
					type: 'richtext',
					required: false,
					order: 19
				},
				{
					key: 'negotiationOutcomes',
					label: 'Negotiation Outcomes',
					type: 'richtext',
					required: false,
					order: 20
				},
				{
					key: 'initiativeOrder',
					label: 'Initiative Order',
					type: 'richtext',
					required: false,
					order: 21
				},
				{
					key: 'encountersRun',
					label: 'Encounters Run',
					type: 'entity-refs',
					entityTypes: ['encounter'],
					required: false,
					order: 22
				}
			]
		}
	},
	aiContext: {
		systemDescription:
			'Draw Steel is a tactical fantasy RPG with hero-focused combat, tactical positioning, and narrative flexibility.',
		keyMechanics: [
			'Characteristics: Might, Agility, Reason, Intuition, Presence (typically ranging from -2 to +4)',
			'Heroic resources for unique character abilities',
			'Skills with training levels: Trained, Expert, Master',
			'HP (hit points), Vitality for recovering damage',
			'Conditions for status effects',
			'Victory points for dynamic combat objectives',
			'Negotiation encounters with DC-based resolution',
			'Montage scenes for downtime activities',
			'Threat levels: Minion, Standard, Elite, Boss, Solo',
			'Combat roles: Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Leader, Mount, Support',
			'Character identity: Ancestry, Heritage, Ancestry Traits',
			'Class features and Kits for character customization'
		],
		preferredTerms: {
			gm: 'Director',
			dm: 'Director'
		}
	},
	terminology: {
		gm: 'Director'
	}
};

/**
 * System-agnostic profile (default/fallback)
 */
export const SYSTEM_AGNOSTIC_PROFILE: SystemProfile = {
	id: 'system-agnostic',
	name: 'System Agnostic',
	description: 'Generic system with no game-specific customizations',
	entityTypeModifications: {},
	terminology: {
		gm: 'GM'
	}
};

/**
 * All built-in system profiles
 */
export const BUILT_IN_SYSTEMS: SystemProfile[] = [
	SYSTEM_AGNOSTIC_PROFILE,
	DRAW_STEEL_PROFILE
];

/**
 * Get a system profile by ID
 * Returns undefined if the system is not found
 */
export function getSystemProfile(systemId: SystemId | null | undefined): SystemProfile | undefined {
	if (!systemId) return undefined;
	return BUILT_IN_SYSTEMS.find((system) => system.id === systemId);
}

/**
 * Get all available system profiles (built-in + custom)
 * Custom systems can override built-in systems by using the same ID
 */
export function getAllSystemProfiles(customSystems: SystemProfile[] = []): SystemProfile[] {
	// Create a map to handle overrides (custom systems take precedence)
	const systemMap = new Map<SystemId, SystemProfile>();

	// Add built-in systems first
	for (const system of BUILT_IN_SYSTEMS) {
		systemMap.set(system.id, system);
	}

	// Add/override with custom systems
	for (const system of customSystems) {
		systemMap.set(system.id, system);
	}

	// Return all systems as array
	return Array.from(systemMap.values());
}
