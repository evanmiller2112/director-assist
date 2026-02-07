/**
 * Test Suite: Creature Template Types and Type Guards
 *
 * Issue #305: Creature Templates for Monsters - TDD RED Phase
 *
 * This file tests the type definitions and type guard functions for creature templates
 * used in the monster database. Tests will FAIL until the types are implemented.
 *
 * Testing Strategy:
 * 1. Type definitions compile correctly (TypeScript validation)
 * 2. Type guards correctly identify creature roles
 * 3. Helper functions for creature template management
 * 4. Validation of required and optional fields
 * 5. Draw Steel-specific mechanics (threat levels, roles, abilities)
 *
 * Key Creature Template Features:
 * - Threat levels: 1 (minion/standard), 2 (elite), 3 (boss/solo)
 * - Creature roles: Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Leader, Mount, Support
 * - Tags for categorization and filtering
 * - Abilities for reference during combat
 * - Templates can be saved from ad-hoc combat creatures
 */

import { describe, it, expect } from 'vitest';
import type {
	CreatureTemplate,
	CreateCreatureTemplateInput,
	ThreatLevel,
	CreatureRole,
	CreatureAbility
} from './creature';
import { isValidThreatLevel, isValidCreatureRole } from './creature';

describe('Creature Types - Type Safety', () => {
	describe('ThreatLevel Type', () => {
		it('should allow valid threat level values', () => {
			const minion: ThreatLevel = 1;
			const elite: ThreatLevel = 2;
			const boss: ThreatLevel = 3;

			expect(minion).toBe(1);
			expect(elite).toBe(2);
			expect(boss).toBe(3);
		});
	});

	describe('CreatureRole Type', () => {
		it('should allow valid creature role values', () => {
			const roles: CreatureRole[] = [
				'Ambusher',
				'Artillery',
				'Brute',
				'Controller',
				'Defender',
				'Harrier',
				'Hexer',
				'Leader',
				'Mount',
				'Support'
			];

			roles.forEach(role => {
				expect(role).toBeTruthy();
			});
		});
	});

	describe('CreatureAbility Type Structure', () => {
		it('should have all required fields', () => {
			const ability: CreatureAbility = {
				name: 'Firebolt',
				description: 'Ranged attack dealing 2d6 fire damage',
				type: 'action'
			};

			expect(ability.name).toBe('Firebolt');
			expect(ability.description).toBe('Ranged attack dealing 2d6 fire damage');
			expect(ability.type).toBe('action');
		});

		it('should allow different ability types', () => {
			const action: CreatureAbility = {
				name: 'Attack',
				description: 'Melee attack',
				type: 'action'
			};

			const maneuver: CreatureAbility = {
				name: 'Dash',
				description: 'Move quickly',
				type: 'maneuver'
			};

			const triggered: CreatureAbility = {
				name: 'Reactive Strike',
				description: 'Attack when hit',
				type: 'triggered'
			};

			const villain: CreatureAbility = {
				name: 'Lair Action',
				description: 'Boss-level ability',
				type: 'villain'
			};

			expect(action.type).toBe('action');
			expect(maneuver.type).toBe('maneuver');
			expect(triggered.type).toBe('triggered');
			expect(villain.type).toBe('villain');
		});
	});

	describe('CreatureTemplate Type Structure', () => {
		it('should have all required fields', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-1',
				name: 'Goblin Warrior',
				hp: 20,
				maxHp: 20,
				threat: 1,
				role: 'Brute',
				tags: ['goblinoid', 'humanoid'],
				abilities: [
					{
						name: 'Shortsword',
						description: 'Melee attack: +4 to hit, 1d6+2 damage',
						type: 'action'
					}
				],
				createdAt: now,
				updatedAt: now
			};

			expect(template.id).toBe('creature-1');
			expect(template.name).toBe('Goblin Warrior');
			expect(template.hp).toBe(20);
			expect(template.maxHp).toBe(20);
			expect(template.threat).toBe(1);
			expect(template.role).toBe('Brute');
			expect(template.tags).toEqual(['goblinoid', 'humanoid']);
			expect(template.abilities.length).toBe(1);
			expect(template.createdAt).toBeInstanceOf(Date);
			expect(template.updatedAt).toBeInstanceOf(Date);
		});

		it('should allow optional fields', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-2',
				name: 'Dragon',
				description: 'Ancient red dragon',
				hp: 300,
				maxHp: 300,
				ac: 22,
				threat: 3,
				role: 'Leader',
				tags: ['dragon', 'fire'],
				abilities: [],
				notes: 'Breathes fire, high intelligence',
				createdAt: now,
				updatedAt: now
			};

			expect(template.description).toBe('Ancient red dragon');
			expect(template.ac).toBe(22);
			expect(template.notes).toBe('Breathes fire, high intelligence');
		});

		it('should allow empty tags and abilities arrays', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-3',
				name: 'Simple Creature',
				hp: 10,
				maxHp: 10,
				threat: 1,
				role: 'Brute',
				tags: [],
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.tags).toEqual([]);
			expect(template.abilities).toEqual([]);
		});

		it('should support multiple abilities', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-4',
				name: 'Elite Guard',
				hp: 50,
				maxHp: 50,
				threat: 2,
				role: 'Defender',
				tags: ['humanoid', 'guard'],
				abilities: [
					{
						name: 'Shield Bash',
						description: 'Push target 5 feet',
						type: 'action'
					},
					{
						name: 'Defensive Stance',
						description: '+2 AC until next turn',
						type: 'maneuver'
					},
					{
						name: 'Parry',
						description: 'Negate one melee attack',
						type: 'triggered'
					}
				],
				createdAt: now,
				updatedAt: now
			};

			expect(template.abilities.length).toBe(3);
			expect(template.abilities[0].name).toBe('Shield Bash');
			expect(template.abilities[1].type).toBe('maneuver');
			expect(template.abilities[2].type).toBe('triggered');
		});
	});

	describe('CreateCreatureTemplateInput Type Structure', () => {
		it('should have all required fields for creation', () => {
			const input: CreateCreatureTemplateInput = {
				name: 'Orc Raider',
				hp: 25,
				maxHp: 25,
				threat: 1,
				role: 'Ambusher',
				tags: ['orc', 'raider'],
				abilities: []
			};

			expect(input.name).toBe('Orc Raider');
			expect(input.hp).toBe(25);
			expect(input.maxHp).toBe(25);
			expect(input.threat).toBe(1);
			expect(input.role).toBe('Ambusher');
			expect(input.tags).toEqual(['orc', 'raider']);
			expect(input.abilities).toEqual([]);
		});

		it('should allow optional fields on creation', () => {
			const input: CreateCreatureTemplateInput = {
				name: 'Skeleton',
				description: 'Undead warrior',
				hp: 15,
				maxHp: 15,
				ac: 13,
				threat: 1,
				role: 'Brute',
				tags: ['undead'],
				abilities: [],
				notes: 'Vulnerable to bludgeoning'
			};

			expect(input.description).toBe('Undead warrior');
			expect(input.ac).toBe(13);
			expect(input.notes).toBe('Vulnerable to bludgeoning');
		});

		it('should not require id or timestamps on creation', () => {
			const input: CreateCreatureTemplateInput = {
				name: 'Kobold',
				hp: 5,
				maxHp: 5,
				threat: 1,
				role: 'Harrier',
				tags: [],
				abilities: []
			};

			// These fields should not exist on CreateCreatureTemplateInput
			expect('id' in input).toBe(false);
			expect('createdAt' in input).toBe(false);
			expect('updatedAt' in input).toBe(false);
		});
	});
});

describe('Creature Type Guards', () => {
	describe('isValidThreatLevel', () => {
		it('should return true for valid threat levels', () => {
			expect(isValidThreatLevel(1)).toBe(true);
			expect(isValidThreatLevel(2)).toBe(true);
			expect(isValidThreatLevel(3)).toBe(true);
		});

		it('should return false for invalid threat levels', () => {
			expect(isValidThreatLevel(0)).toBe(false);
			expect(isValidThreatLevel(4)).toBe(false);
			expect(isValidThreatLevel(-1)).toBe(false);
			expect(isValidThreatLevel(1.5)).toBe(false);
		});

		it('should return false for non-number values', () => {
			expect(isValidThreatLevel('1' as unknown as number)).toBe(false);
			expect(isValidThreatLevel(null as unknown as number)).toBe(false);
			expect(isValidThreatLevel(undefined as unknown as number)).toBe(false);
		});
	});

	describe('isValidCreatureRole', () => {
		it('should return true for valid creature roles', () => {
			expect(isValidCreatureRole('Ambusher')).toBe(true);
			expect(isValidCreatureRole('Artillery')).toBe(true);
			expect(isValidCreatureRole('Brute')).toBe(true);
			expect(isValidCreatureRole('Controller')).toBe(true);
			expect(isValidCreatureRole('Defender')).toBe(true);
			expect(isValidCreatureRole('Harrier')).toBe(true);
			expect(isValidCreatureRole('Hexer')).toBe(true);
			expect(isValidCreatureRole('Leader')).toBe(true);
			expect(isValidCreatureRole('Mount')).toBe(true);
			expect(isValidCreatureRole('Support')).toBe(true);
		});

		it('should return false for invalid creature roles', () => {
			expect(isValidCreatureRole('Tank')).toBe(false);
			expect(isValidCreatureRole('DPS')).toBe(false);
			expect(isValidCreatureRole('brute')).toBe(false); // case sensitive
			expect(isValidCreatureRole('AMBUSHER')).toBe(false); // case sensitive
		});

		it('should return false for non-string values', () => {
			expect(isValidCreatureRole(1 as unknown as string)).toBe(false);
			expect(isValidCreatureRole(null as unknown as string)).toBe(false);
			expect(isValidCreatureRole(undefined as unknown as string)).toBe(false);
		});
	});
});

describe('Creature Template - Edge Cases', () => {
	describe('Threat Level Boundaries', () => {
		it('should handle minion threat level (1)', () => {
			const threat: ThreatLevel = 1;
			expect(threat).toBe(1);
			expect(isValidThreatLevel(threat)).toBe(true);
		});

		it('should handle elite threat level (2)', () => {
			const threat: ThreatLevel = 2;
			expect(threat).toBe(2);
			expect(isValidThreatLevel(threat)).toBe(true);
		});

		it('should handle boss threat level (3)', () => {
			const threat: ThreatLevel = 3;
			expect(threat).toBe(3);
			expect(isValidThreatLevel(threat)).toBe(true);
		});
	});

	describe('HP Values', () => {
		it('should handle zero HP template', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-5',
				name: 'Defeated Creature',
				hp: 0,
				maxHp: 20,
				threat: 1,
				role: 'Brute',
				tags: [],
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.hp).toBe(0);
			expect(template.maxHp).toBe(20);
		});

		it('should handle high HP boss template', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-6',
				name: 'Ancient Dragon',
				hp: 500,
				maxHp: 500,
				threat: 3,
				role: 'Leader',
				tags: ['dragon'],
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.hp).toBe(500);
			expect(template.maxHp).toBe(500);
		});
	});

	describe('String Fields', () => {
		it('should handle special characters in name', () => {
			const now = new Date();
			const template: CreatureTemplate = {
				id: 'creature-7',
				name: "Troll's Wrath & Fury (Elite)",
				hp: 50,
				maxHp: 50,
				threat: 2,
				role: 'Brute',
				tags: [],
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.name).toBe("Troll's Wrath & Fury (Elite)");
		});

		it('should handle long description text', () => {
			const now = new Date();
			const longDescription = 'A'.repeat(1000);
			const template: CreatureTemplate = {
				id: 'creature-8',
				name: 'Verbose Creature',
				description: longDescription,
				hp: 20,
				maxHp: 20,
				threat: 1,
				role: 'Brute',
				tags: [],
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.description).toBe(longDescription);
			expect(template.description?.length).toBe(1000);
		});
	});

	describe('Array Fields', () => {
		it('should handle many tags', () => {
			const now = new Date();
			const manyTags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
			const template: CreatureTemplate = {
				id: 'creature-9',
				name: 'Heavily Tagged Creature',
				hp: 20,
				maxHp: 20,
				threat: 1,
				role: 'Brute',
				tags: manyTags,
				abilities: [],
				createdAt: now,
				updatedAt: now
			};

			expect(template.tags.length).toBe(20);
			expect(template.tags[0]).toBe('tag-0');
			expect(template.tags[19]).toBe('tag-19');
		});

		it('should handle many abilities', () => {
			const now = new Date();
			const manyAbilities: CreatureAbility[] = Array.from({ length: 15 }, (_, i) => ({
				name: `Ability ${i}`,
				description: `Description ${i}`,
				type: 'action' as const
			}));

			const template: CreatureTemplate = {
				id: 'creature-10',
				name: 'Complex Creature',
				hp: 100,
				maxHp: 100,
				threat: 3,
				role: 'Leader',
				tags: [],
				abilities: manyAbilities,
				createdAt: now,
				updatedAt: now
			};

			expect(template.abilities.length).toBe(15);
			expect(template.abilities[0].name).toBe('Ability 0');
			expect(template.abilities[14].name).toBe('Ability 14');
		});
	});
});
