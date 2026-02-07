/**
 * Creature Template Testing Utilities
 *
 * Helper functions for creating mock creature templates for testing.
 * These utilities follow TDD RED phase - components will fail until implemented.
 *
 * Issue #305: Creature Templates for Monsters
 */

import type {
	CreatureTemplate,
	CreateCreatureTemplateInput,
	CreatureAbility,
	ThreatLevel,
	CreatureRole
} from '$lib/types/creature';

/**
 * Creates a mock creature ability for testing
 */
export function createMockAbility(
	overrides: Partial<CreatureAbility> = {}
): CreatureAbility {
	return {
		name: 'Test Ability',
		description: 'A test ability',
		type: 'action',
		...overrides
	};
}

/**
 * Creates multiple mock abilities for testing
 */
export function createMockAbilities(count: number, overrides: Partial<CreatureAbility>[] = []): CreatureAbility[] {
	return Array.from({ length: count }, (_, i) =>
		createMockAbility({
			name: `Ability ${i + 1}`,
			description: `Description for ability ${i + 1}`,
			...overrides[i]
		})
	);
}

/**
 * Creates a mock creature template for testing
 */
export function createMockCreatureTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	const now = new Date();
	return {
		id: `creature-${Math.random().toString(36).substring(7)}`,
		name: 'Test Creature',
		hp: 20,
		maxHp: 20,
		threat: 1,
		role: 'Brute',
		tags: [],
		abilities: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

/**
 * Creates multiple mock creature templates for testing
 */
export function createMockCreatureTemplates(
	count: number,
	overrides: Partial<CreatureTemplate>[] = []
): CreatureTemplate[] {
	return Array.from({ length: count }, (_, i) =>
		createMockCreatureTemplate({
			id: `creature-${i}`,
			name: `Creature ${i + 1}`,
			...overrides[i]
		})
	);
}

/**
 * Creates a mock creature template input for creation testing
 */
export function createMockCreatureInput(
	overrides: Partial<CreateCreatureTemplateInput> = {}
): CreateCreatureTemplateInput {
	return {
		name: 'New Creature',
		hp: 20,
		maxHp: 20,
		threat: 1,
		role: 'Brute',
		tags: [],
		abilities: [],
		...overrides
	};
}

/**
 * Creates a minion-level creature template (Threat 1)
 */
export function createMinionTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	return createMockCreatureTemplate({
		name: 'Goblin Minion',
		hp: 10,
		maxHp: 10,
		threat: 1,
		role: 'Harrier',
		tags: ['goblinoid', 'minion'],
		abilities: [
			createMockAbility({
				name: 'Dagger',
				description: 'Melee attack: +3 to hit, 1d4+1 damage',
				type: 'action'
			})
		],
		...overrides
	});
}

/**
 * Creates an elite-level creature template (Threat 2)
 */
export function createEliteTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	return createMockCreatureTemplate({
		name: 'Orc Champion',
		description: 'Elite warrior with enhanced abilities',
		hp: 50,
		maxHp: 50,
		ac: 16,
		threat: 2,
		role: 'Defender',
		tags: ['orc', 'elite', 'warrior'],
		abilities: [
			createMockAbility({
				name: 'Greataxe',
				description: 'Melee attack: +6 to hit, 2d6+4 damage',
				type: 'action'
			}),
			createMockAbility({
				name: 'Shield Wall',
				description: 'Grant +2 AC to adjacent allies',
				type: 'maneuver'
			})
		],
		...overrides
	});
}

/**
 * Creates a boss-level creature template (Threat 3)
 */
export function createBossTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	return createMockCreatureTemplate({
		name: 'Dragon Overlord',
		description: 'Legendary dragon with devastating power',
		hp: 300,
		maxHp: 300,
		ac: 22,
		threat: 3,
		role: 'Leader',
		tags: ['dragon', 'boss', 'legendary', 'fire'],
		abilities: [
			createMockAbility({
				name: 'Bite',
				description: 'Melee attack: +12 to hit, 3d8+8 damage',
				type: 'action'
			}),
			createMockAbility({
				name: 'Fire Breath',
				description: 'Cone attack: 6d10 fire damage, Agility save for half',
				type: 'action'
			}),
			createMockAbility({
				name: 'Frightful Presence',
				description: 'All enemies within 30ft must make Presence save or be frightened',
				type: 'maneuver'
			}),
			createMockAbility({
				name: 'Tail Sweep',
				description: 'When attacked, sweep tail to push attacker back',
				type: 'triggered'
			}),
			createMockAbility({
				name: 'Lair Action',
				description: 'Summon lava geysers at initiative 20',
				type: 'villain'
			})
		],
		notes: 'Immune to fire damage. Vulnerable to cold damage.',
		...overrides
	});
}

/**
 * Creates a creature template with specific role
 */
export function createCreatureWithRole(
	role: CreatureRole,
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	const roleConfigs: Record<CreatureRole, Partial<CreatureTemplate>> = {
		Ambusher: {
			name: 'Shadow Assassin',
			description: 'Strikes from the shadows',
			hp: 30,
			ac: 15,
			tags: ['stealth', 'ambush']
		},
		Artillery: {
			name: 'Archer Sentinel',
			description: 'Ranged attacker',
			hp: 25,
			ac: 13,
			tags: ['ranged', 'archer']
		},
		Brute: {
			name: 'Raging Berserker',
			description: 'Heavy damage dealer',
			hp: 45,
			ac: 12,
			tags: ['melee', 'damage']
		},
		Controller: {
			name: 'Mind Flayer',
			description: 'Controls the battlefield',
			hp: 35,
			ac: 14,
			tags: ['psychic', 'control']
		},
		Defender: {
			name: 'Shield Guardian',
			description: 'Protects allies',
			hp: 50,
			ac: 18,
			tags: ['tank', 'protection']
		},
		Harrier: {
			name: 'Swift Skirmisher',
			description: 'Mobile striker',
			hp: 20,
			ac: 16,
			tags: ['mobile', 'fast']
		},
		Hexer: {
			name: 'Curse Weaver',
			description: 'Debuffs enemies',
			hp: 30,
			ac: 13,
			tags: ['curse', 'debuff']
		},
		Leader: {
			name: 'War Chief',
			description: 'Commands and buffs allies',
			hp: 60,
			ac: 17,
			tags: ['leader', 'buff']
		},
		Mount: {
			name: 'War Horse',
			description: 'Carries riders into battle',
			hp: 40,
			ac: 12,
			tags: ['mount', 'animal']
		},
		Support: {
			name: 'Cleric',
			description: 'Heals and supports allies',
			hp: 35,
			ac: 14,
			tags: ['healer', 'support']
		}
	};

	return createMockCreatureTemplate({
		...roleConfigs[role],
		role,
		threat: 1,
		...overrides
	});
}

/**
 * Creates a creature template with specific tags
 */
export function createCreatureWithTags(
	tags: string[],
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	return createMockCreatureTemplate({
		name: 'Tagged Creature',
		tags,
		...overrides
	});
}

/**
 * Creates a creature template with specific threat level
 */
export function createCreatureWithThreat(
	threat: ThreatLevel,
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	const baseHp = threat === 1 ? 20 : threat === 2 ? 50 : 150;
	const baseAc = threat === 1 ? 13 : threat === 2 ? 16 : 20;

	return createMockCreatureTemplate({
		name: `Threat ${threat} Creature`,
		hp: baseHp,
		maxHp: baseHp,
		ac: baseAc,
		threat,
		...overrides
	});
}

/**
 * Creates a creature template with full details (all optional fields)
 */
export function createFullCreatureTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	return createMockCreatureTemplate({
		name: 'Complete Creature',
		description: 'A fully detailed creature with all fields',
		hp: 50,
		maxHp: 50,
		ac: 16,
		threat: 2,
		role: 'Leader',
		tags: ['test', 'complete', 'detailed'],
		abilities: [
			createMockAbility({
				name: 'Primary Attack',
				description: 'Main attack action',
				type: 'action'
			}),
			createMockAbility({
				name: 'Tactical Move',
				description: 'Maneuver ability',
				type: 'maneuver'
			}),
			createMockAbility({
				name: 'Counter',
				description: 'Triggered reaction',
				type: 'triggered'
			})
		],
		notes: 'Test notes with additional information',
		...overrides
	});
}

/**
 * Creates a minimal creature template (only required fields)
 */
export function createMinimalCreatureTemplate(
	overrides: Partial<CreatureTemplate> = {}
): CreatureTemplate {
	const now = new Date();
	return {
		id: `creature-${Math.random().toString(36).substring(7)}`,
		name: 'Minimal Creature',
		hp: 10,
		maxHp: 10,
		threat: 1,
		role: 'Brute',
		tags: [],
		abilities: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

/**
 * Helper to check if a creature is bloodied (HP <= 50% of max)
 */
export function isCreatureBloodied(template: CreatureTemplate): boolean {
	return template.hp <= template.maxHp / 2;
}

/**
 * Helper to check if a creature is defeated (HP <= 0)
 */
export function isCreatureDefeated(template: CreatureTemplate): boolean {
	return template.hp <= 0;
}

/**
 * Creates a library of mixed creature templates for testing
 */
export function createCreatureLibrary(): CreatureTemplate[] {
	return [
		createMinionTemplate({ id: 'lib-1', name: 'Goblin Scout' }),
		createMinionTemplate({ id: 'lib-2', name: 'Kobold Trapper' }),
		createEliteTemplate({ id: 'lib-3', name: 'Orc Berserker' }),
		createEliteTemplate({ id: 'lib-4', name: 'Troll Warrior' }),
		createBossTemplate({ id: 'lib-5', name: 'Ancient Dragon' }),
		createCreatureWithRole('Ambusher', { id: 'lib-6' }),
		createCreatureWithRole('Artillery', { id: 'lib-7' }),
		createCreatureWithRole('Controller', { id: 'lib-8' }),
		createCreatureWithRole('Defender', { id: 'lib-9' }),
		createCreatureWithRole('Support', { id: 'lib-10' })
	];
}
