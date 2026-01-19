import { describe, it, expect } from 'vitest';
import {
	getSystemProfile,
	getAllSystemProfiles,
	type SystemProfile
} from './systems';

/**
 * Test Strategy: System Profiles Configuration
 *
 * RED Phase (TDD): These tests define the expected behavior of the system profile
 * configuration before implementation. Tests will FAIL until the systems.ts module
 * is implemented.
 *
 * System profiles provide game-system-specific customizations (Draw Steel, D&D 5e, etc.)
 * that modify entity types, add system-specific fields, and customize terminology.
 *
 * Key Test Scenarios:
 * 1. Built-in system profiles exist and are properly structured
 * 2. Draw Steel profile has specific entity type modifications
 * 3. System-agnostic profile acts as a passthrough (no modifications)
 * 4. Unknown system IDs return undefined
 * 5. Custom systems can be retrieved alongside built-in systems
 * 6. Draw Steel uses correct terminology ("Director" instead of "GM")
 */

describe('systems.ts - System Profile Configuration', () => {
	describe('getSystemProfile()', () => {
		describe('Built-in System: draw-steel', () => {
			it('should return Draw Steel system profile', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile).toBeDefined();
				expect(profile?.id).toBe('draw-steel');
				expect(profile?.name).toBe('Draw Steel');
			});

			it('should have entityTypeModifications for character type', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile?.entityTypeModifications).toBeDefined();
				expect(profile?.entityTypeModifications?.character).toBeDefined();
			});

			it('should add Draw Steel character-specific fields (ancestry, class, kit, heroicResource)', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;

				expect(characterMods?.additionalFields).toBeDefined();
				const fieldKeys = characterMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('ancestry');
				expect(fieldKeys).toContain('class');
				expect(fieldKeys).toContain('kit');
				expect(fieldKeys).toContain('heroicResource');
			});

			it('should add Draw Steel NPC-specific fields (threatLevel, role)', () => {
				const profile = getSystemProfile('draw-steel');
				const npcMods = profile?.entityTypeModifications?.npc;

				expect(npcMods?.additionalFields).toBeDefined();
				const fieldKeys = npcMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('threatLevel');
				expect(fieldKeys).toContain('role');
			});

			it('should add Draw Steel encounter-specific fields (victoryPoints, negotiationDC)', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;

				expect(encounterMods?.additionalFields).toBeDefined();
				const fieldKeys = encounterMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('victoryPoints');
				expect(fieldKeys).toContain('negotiationDC');
			});

			it('should override encounter type options with Draw Steel-specific types', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;

				expect(encounterMods?.fieldOptionOverrides).toBeDefined();
				expect(encounterMods?.fieldOptionOverrides?.encounterType).toBeDefined();

				const encounterTypeOptions = encounterMods?.fieldOptionOverrides?.encounterType;
				expect(encounterTypeOptions).toContain('combat');
				expect(encounterTypeOptions).toContain('negotiation');
				expect(encounterTypeOptions).toContain('montage');
				expect(encounterTypeOptions).toContain('exploration');
				expect(encounterTypeOptions).toContain('social');
				expect(encounterTypeOptions).toContain('puzzle');
				expect(encounterTypeOptions).toContain('trap');
			});

			it('should use "Director" terminology instead of "GM"', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile?.terminology).toBeDefined();
				expect(profile?.terminology?.gm).toBe('Director');
			});

			it('should have ancestry field as select type with Draw Steel ancestries', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const ancestryField = characterMods?.additionalFields?.find((f) => f.key === 'ancestry');

				expect(ancestryField).toBeDefined();
				expect(ancestryField?.label).toBe('Ancestry');
				expect(ancestryField?.type).toBe('select');
				expect(ancestryField?.options).toContain('Human');
				expect(ancestryField?.options).toContain('Dwarf');
				expect(ancestryField?.options).toContain('Elf');
				expect(ancestryField?.options).toContain('Orc');
				expect(ancestryField?.options).toContain('Dragon Knight');
				expect(ancestryField?.options).toContain('Revenant');
				expect(ancestryField?.required).toBe(false);
				expect(ancestryField?.order).toBeGreaterThan(0);
			});

			it('should have class field as select type with Draw Steel classes', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const classField = characterMods?.additionalFields?.find((f) => f.key === 'class');

				expect(classField).toBeDefined();
				expect(classField?.label).toBe('Class');
				expect(classField?.type).toBe('select');
				expect(classField?.options).toContain('Tactician');
				expect(classField?.options).toContain('Fury');
				expect(classField?.options).toContain('Shadow');
				expect(classField?.options).toContain('Elementalist');
				expect(classField?.options).toContain('Talent');
				expect(classField?.options).toContain('Censor');
				expect(classField?.options).toContain('Conduit');
				expect(classField?.options).toContain('Null');
			});

			it('should have heroicResource field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const heroicResourceField = characterMods?.additionalFields?.find(
					(f) => f.key === 'heroicResource'
				);

				expect(heroicResourceField).toBeDefined();
				expect(heroicResourceField?.type).toBe('richtext');
			});

			it('should have threatLevel field as select type with specific options', () => {
				const profile = getSystemProfile('draw-steel');
				const npcMods = profile?.entityTypeModifications?.npc;
				const threatLevelField = npcMods?.additionalFields?.find((f) => f.key === 'threatLevel');

				expect(threatLevelField).toBeDefined();
				expect(threatLevelField?.type).toBe('select');
				expect(threatLevelField?.options).toBeDefined();
				expect(threatLevelField?.options).toContain('minion');
				expect(threatLevelField?.options).toContain('standard');
				expect(threatLevelField?.options).toContain('boss');
			});

			it('should have victoryPoints field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const victoryPointsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'victoryPoints'
				);

				expect(victoryPointsField).toBeDefined();
				expect(victoryPointsField?.type).toBe('number');
			});

			it('should have negotiationDC field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationDCField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationDC'
				);

				expect(negotiationDCField).toBeDefined();
				expect(negotiationDCField?.type).toBe('number');
			});
		});

		describe('Built-in System: system-agnostic', () => {
			it('should return system-agnostic profile', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile).toBeDefined();
				expect(profile?.id).toBe('system-agnostic');
				expect(profile?.name).toBe('System Agnostic');
			});

			it('should have no entity type modifications', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile?.entityTypeModifications).toEqual({});
			});

			it('should use standard "GM" terminology', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile?.terminology).toBeDefined();
				expect(profile?.terminology?.gm).toBe('GM');
			});
		});

		describe('Unknown System IDs', () => {
			it('should return undefined for unknown system ID', () => {
				const profile = getSystemProfile('unknown-system');

				expect(profile).toBeUndefined();
			});

			it('should return undefined for empty string', () => {
				const profile = getSystemProfile('');

				expect(profile).toBeUndefined();
			});

			it('should return undefined for null (type coercion test)', () => {
				const profile = getSystemProfile(null as any);

				expect(profile).toBeUndefined();
			});
		});

		describe('Case Sensitivity', () => {
			it('should be case-sensitive for system IDs', () => {
				const profile = getSystemProfile('Draw-Steel');

				expect(profile).toBeUndefined();
			});

			it('should match exact case for draw-steel', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile).toBeDefined();
			});
		});
	});

	describe('getAllSystemProfiles()', () => {
		it('should return array of all built-in system profiles', () => {
			const profiles = getAllSystemProfiles();

			expect(Array.isArray(profiles)).toBe(true);
			expect(profiles.length).toBeGreaterThanOrEqual(2); // At least draw-steel and system-agnostic
		});

		it('should include draw-steel profile', () => {
			const profiles = getAllSystemProfiles();
			const drawSteelProfile = profiles.find((p) => p.id === 'draw-steel');

			expect(drawSteelProfile).toBeDefined();
		});

		it('should include system-agnostic profile', () => {
			const profiles = getAllSystemProfiles();
			const agnosticProfile = profiles.find((p) => p.id === 'system-agnostic');

			expect(agnosticProfile).toBeDefined();
		});

		it('should return only built-in systems when no custom systems provided', () => {
			const profiles = getAllSystemProfiles();

			profiles.forEach((profile) => {
				expect(profile).toHaveProperty('id');
				expect(profile).toHaveProperty('name');
				expect(profile).toHaveProperty('entityTypeModifications');
			});
		});

		it('should include custom systems when provided', () => {
			const customSystem: SystemProfile = {
				id: 'custom-system',
				name: 'Custom System',
				entityTypeModifications: {},
				terminology: { gm: 'Narrator' }
			};

			const profiles = getAllSystemProfiles([customSystem]);
			const customProfile = profiles.find((p) => p.id === 'custom-system');

			expect(customProfile).toBeDefined();
			expect(customProfile?.name).toBe('Custom System');
		});

		it('should combine built-in and custom systems', () => {
			const customSystem: SystemProfile = {
				id: 'custom-system',
				name: 'Custom System',
				entityTypeModifications: {},
				terminology: { gm: 'Storyteller' }
			};

			const profiles = getAllSystemProfiles([customSystem]);

			expect(profiles.length).toBeGreaterThanOrEqual(3); // Built-ins + custom
			expect(profiles.find((p) => p.id === 'draw-steel')).toBeDefined();
			expect(profiles.find((p) => p.id === 'system-agnostic')).toBeDefined();
			expect(profiles.find((p) => p.id === 'custom-system')).toBeDefined();
		});

		it('should not mutate the original custom systems array', () => {
			const customSystems: SystemProfile[] = [
				{
					id: 'custom-1',
					name: 'Custom 1',
					entityTypeModifications: {},
					terminology: { gm: 'GM' }
				}
			];

			const originalLength = customSystems.length;
			getAllSystemProfiles(customSystems);

			expect(customSystems.length).toBe(originalLength);
		});

		it('should allow custom system to override built-in system ID (custom takes precedence)', () => {
			const customDrawSteel: SystemProfile = {
				id: 'draw-steel',
				name: 'Custom Draw Steel',
				entityTypeModifications: {},
				terminology: { gm: 'Custom Director' }
			};

			const profiles = getAllSystemProfiles([customDrawSteel]);
			const drawSteelProfiles = profiles.filter((p) => p.id === 'draw-steel');

			// Custom system should replace built-in
			expect(drawSteelProfiles.length).toBe(1);
			expect(drawSteelProfiles[0].name).toBe('Custom Draw Steel');
		});
	});

	describe('SystemProfile Type Structure', () => {
		it('should have all required properties', () => {
			const profile = getSystemProfile('draw-steel');

			expect(profile).toHaveProperty('id');
			expect(profile).toHaveProperty('name');
			expect(profile).toHaveProperty('entityTypeModifications');
			expect(profile).toHaveProperty('terminology');
		});

		it('should have entityTypeModifications as object', () => {
			const profile = getSystemProfile('draw-steel');

			expect(typeof profile?.entityTypeModifications).toBe('object');
		});

		it('should have terminology object with gm property', () => {
			const profile = getSystemProfile('draw-steel');

			expect(profile?.terminology).toBeDefined();
			expect(typeof profile?.terminology?.gm).toBe('string');
		});

		it('should support optional description field', () => {
			const profile = getSystemProfile('draw-steel');

			// Description is optional, but if present should be a string
			if (profile?.description !== undefined) {
				expect(typeof profile.description).toBe('string');
			}
		});
	});

	describe('Field Definition Structure in Modifications', () => {
		it('should have properly structured field definitions', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fields = characterMods?.additionalFields ?? [];

			fields.forEach((field) => {
				expect(field).toHaveProperty('key');
				expect(field).toHaveProperty('label');
				expect(field).toHaveProperty('type');
				expect(field).toHaveProperty('required');
				expect(field).toHaveProperty('order');

				expect(typeof field.key).toBe('string');
				expect(typeof field.label).toBe('string');
				expect(typeof field.type).toBe('string');
				expect(typeof field.required).toBe('boolean');
				expect(typeof field.order).toBe('number');
			});
		});

		it('should have unique field keys within each entity type', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fieldKeys = characterMods?.additionalFields?.map((f) => f.key) ?? [];
			const uniqueKeys = new Set(fieldKeys);

			expect(fieldKeys.length).toBe(uniqueKeys.size);
		});

		it('should have positive order values', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fields = characterMods?.additionalFields ?? [];

			fields.forEach((field) => {
				expect(field.order).toBeGreaterThan(0);
			});
		});
	});

	describe('Edge Cases and Defensive Checks', () => {
		it('should handle missing entityTypeModifications gracefully', () => {
			const profile = getSystemProfile('system-agnostic');

			expect(profile?.entityTypeModifications).toBeDefined();
			expect(profile?.entityTypeModifications).toEqual({});
		});

		it('should handle undefined additionalFields array', () => {
			const profile = getSystemProfile('system-agnostic');
			const characterMods = profile?.entityTypeModifications?.character;

			// Should either be undefined or an empty array
			expect(characterMods?.additionalFields === undefined || Array.isArray(characterMods?.additionalFields)).toBe(true);
		});

		it('should return consistent objects on multiple calls', () => {
			const profile1 = getSystemProfile('draw-steel');
			const profile2 = getSystemProfile('draw-steel');

			expect(profile1?.id).toBe(profile2?.id);
			expect(profile1?.name).toBe(profile2?.name);
		});
	});
});
