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
						'Human',
						'Dwarf',
						'Elf',
						'Wode Elf',
						'High Elf',
						'Orc',
						'Polder',
						'Dragon Knight',
						'Devil',
						'Hakaan',
						'Memonek',
						'Revenant',
						'Time Raider'
					],
					required: false,
					order: 10
				},
				{
					key: 'class',
					label: 'Class',
					type: 'select',
					options: [
						'Tactician',
						'Fury',
						'Shadow',
						'Elementalist',
						'Talent',
						'Censor',
						'Conduit',
						'Null'
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
				{
					key: 'heroicResource',
					label: 'Heroic Resource',
					type: 'richtext',
					required: false,
					order: 13
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
		}
	},
	aiContext: {
		systemDescription:
			'Draw Steel is a tactical fantasy RPG with hero-focused combat, tactical positioning, and narrative flexibility.',
		keyMechanics: [
			'Heroic resources for unique character abilities',
			'Victory points for dynamic combat objectives',
			'Negotiation encounters with DC-based resolution',
			'Montage scenes for downtime activities',
			'Threat levels: Minion, Standard, Elite, Boss, Solo',
			'Combat roles: Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Leader, Mount, Support'
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
