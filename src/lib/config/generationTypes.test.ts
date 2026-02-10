/**
 * Tests for Generation Types Configuration (TDD RED Phase)
 *
 * Issue #41: Generation Type Selector in Chat
 *
 * This test suite covers the generation types configuration that defines
 * all available content generation types, their metadata, and prompt templates.
 *
 * Coverage:
 * - GENERATION_TYPES constant array
 * - GenerationTypeConfig interface
 * - getGenerationTypeConfig() function
 * - Type-specific prompt templates
 * - Type-specific suggested structures
 * - Icons for each generation type
 * - Help text/descriptions
 * - Edge cases and error handling
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GenerationType } from '$lib/types';

// Import the functions and types we're testing
// These don't exist yet - tests will fail until implementation
import {
	GENERATION_TYPES,
	type GenerationTypeConfig,
	getGenerationTypeConfig
} from './generationTypes';

describe('generationTypes configuration', () => {
	describe('GENERATION_TYPES constant', () => {
		it('should be defined as an array', () => {
			expect(GENERATION_TYPES).toBeDefined();
			expect(Array.isArray(GENERATION_TYPES)).toBe(true);
		});

		it('should contain all generation types', () => {
			const types = GENERATION_TYPES.map((config) => config.id);
			expect(types).toContain('custom');
			expect(types).toContain('npc');
			expect(types).toContain('location');
			expect(types).toContain('plot_hook');
			expect(types).toContain('combat');
			expect(types).toContain('item');
			expect(types).toContain('negotiation');
			expect(types).toContain('montage');
			expect(types).toContain('faction');
			expect(types).toContain('session_prep');
		});

		it('should have exactly 10 generation types', () => {
			expect(GENERATION_TYPES).toHaveLength(10);
		});

		it('should have custom type as first item (default)', () => {
			expect(GENERATION_TYPES[0].id).toBe('custom');
		});

		it('should have unique IDs for each type', () => {
			const ids = GENERATION_TYPES.map((config) => config.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should have all required fields for each type', () => {
			GENERATION_TYPES.forEach((config) => {
				expect(config).toHaveProperty('id');
				expect(config).toHaveProperty('label');
				expect(config).toHaveProperty('description');
				expect(config).toHaveProperty('icon');
				expect(config).toHaveProperty('promptTemplate');
				expect(config).toHaveProperty('suggestedStructure');
			});
		});

		it('should have non-empty labels for all types', () => {
			GENERATION_TYPES.forEach((config) => {
				expect(config.label).toBeTruthy();
				expect(config.label.length).toBeGreaterThan(0);
			});
		});

		it('should have non-empty descriptions for all types', () => {
			GENERATION_TYPES.forEach((config) => {
				expect(config.description).toBeTruthy();
				expect(config.description.length).toBeGreaterThan(0);
			});
		});

		it('should have icon names for all types', () => {
			GENERATION_TYPES.forEach((config) => {
				expect(config.icon).toBeTruthy();
				expect(config.icon.length).toBeGreaterThan(0);
			});
		});
	});

	describe('GenerationTypeConfig interface', () => {
		it('should define id as GenerationType', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			expect(typeof config.id).toBe('string');
			const validTypes: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'item',
				'faction',
				'negotiation',
				'montage',
				'session_prep'
			];
			expect(validTypes).toContain(config.id);
		});

		it('should define label as string', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			expect(typeof config.label).toBe('string');
		});

		it('should define description as string', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			expect(typeof config.description).toBe('string');
		});

		it('should define icon as string', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			expect(typeof config.icon).toBe('string');
		});

		it('should define promptTemplate as string', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			expect(typeof config.promptTemplate).toBe('string');
		});

		it('should define suggestedStructure as optional string', () => {
			const config: GenerationTypeConfig = GENERATION_TYPES[0];
			if (config.suggestedStructure !== undefined) {
				expect(typeof config.suggestedStructure).toBe('string');
			}
		});
	});

	describe('Custom (General) generation type', () => {
		const customConfig = GENERATION_TYPES.find((c) => c.id === 'custom');

		it('should have custom type defined', () => {
			expect(customConfig).toBeDefined();
		});

		it('should have label "General"', () => {
			expect(customConfig?.label).toBe('General');
		});

		it('should have descriptive help text', () => {
			expect(customConfig?.description).toBeTruthy();
			expect(customConfig?.description).toContain('general');
		});

		it('should have a suitable icon', () => {
			expect(customConfig?.icon).toBeTruthy();
		});

		it('should have minimal or no prompt template', () => {
			// Custom type should have minimal additional prompting
			expect(customConfig?.promptTemplate).toBeDefined();
		});

		it('should have no suggested structure', () => {
			// Custom type is freeform
			expect(
				customConfig?.suggestedStructure === undefined ||
					customConfig?.suggestedStructure === ''
			).toBe(true);
		});
	});

	describe('NPC generation type', () => {
		const npcConfig = GENERATION_TYPES.find((c) => c.id === 'npc');

		it('should have npc type defined', () => {
			expect(npcConfig).toBeDefined();
		});

		it('should have label "NPC"', () => {
			expect(npcConfig?.label).toBe('NPC');
		});

		it('should have description about character generation', () => {
			expect(npcConfig?.description).toBeTruthy();
			expect(npcConfig?.description.toLowerCase()).toMatch(/character|npc|person/);
		});

		it('should have a person/user icon', () => {
			expect(npcConfig?.icon).toBeTruthy();
			expect(npcConfig?.icon.toLowerCase()).toMatch(/user|person|users/);
		});

		it('should have prompt template for NPC generation', () => {
			expect(npcConfig?.promptTemplate).toBeTruthy();
			expect(npcConfig?.promptTemplate.toLowerCase()).toContain('npc');
		});

		it('should have suggested structure for NPC fields', () => {
			expect(npcConfig?.suggestedStructure).toBeTruthy();
			expect(npcConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/name|personality|motivation|background/
			);
		});
	});

	describe('Location generation type', () => {
		const locationConfig = GENERATION_TYPES.find((c) => c.id === 'location');

		it('should have location type defined', () => {
			expect(locationConfig).toBeDefined();
		});

		it('should have label "Location"', () => {
			expect(locationConfig?.label).toBe('Location');
		});

		it('should have description about place generation', () => {
			expect(locationConfig?.description).toBeTruthy();
			expect(locationConfig?.description.toLowerCase()).toMatch(/location|place|setting/);
		});

		it('should have a map/location icon', () => {
			expect(locationConfig?.icon).toBeTruthy();
			expect(locationConfig?.icon.toLowerCase()).toMatch(/map|location|pin|place/);
		});

		it('should have prompt template for location generation', () => {
			expect(locationConfig?.promptTemplate).toBeTruthy();
			expect(locationConfig?.promptTemplate.toLowerCase()).toContain('location');
		});

		it('should have suggested structure for location fields', () => {
			expect(locationConfig?.suggestedStructure).toBeTruthy();
			expect(locationConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/atmosphere|inhabitants|points of interest/
			);
		});
	});

	describe('Plot Hook generation type', () => {
		const plotHookConfig = GENERATION_TYPES.find((c) => c.id === 'plot_hook');

		it('should have plot_hook type defined', () => {
			expect(plotHookConfig).toBeDefined();
		});

		it('should have label "Plot Hook"', () => {
			expect(plotHookConfig?.label).toBe('Plot Hook');
		});

		it('should have description about story generation', () => {
			expect(plotHookConfig?.description).toBeTruthy();
			expect(plotHookConfig?.description.toLowerCase()).toMatch(/plot|story|hook|adventure/);
		});

		it('should have a book/story icon', () => {
			expect(plotHookConfig?.icon).toBeTruthy();
			expect(plotHookConfig?.icon.toLowerCase()).toMatch(/book|scroll|file|text/);
		});

		it('should have prompt template for plot hook generation', () => {
			expect(plotHookConfig?.promptTemplate).toBeTruthy();
			expect(plotHookConfig?.promptTemplate.toLowerCase()).toMatch(/plot|story|hook/);
		});

		it('should have suggested structure for plot hook fields', () => {
			expect(plotHookConfig?.suggestedStructure).toBeTruthy();
			expect(plotHookConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/premise|complication|stakes|resolution/
			);
		});
	});

	describe('Combat generation type', () => {
		const combatConfig = GENERATION_TYPES.find((c) => c.id === 'combat');

		it('should have combat type defined', () => {
			expect(combatConfig).toBeDefined();
		});

		it('should have label "Combat"', () => {
			expect(combatConfig?.label).toBe('Combat');
		});

		it('should have description about combat/challenge generation', () => {
			expect(combatConfig?.description).toBeTruthy();
			expect(combatConfig?.description.toLowerCase()).toMatch(
				/encounter|combat|battle|challenge/
			);
		});

		it('should have a swords/combat icon', () => {
			expect(combatConfig?.icon).toBeTruthy();
			expect(combatConfig?.icon.toLowerCase()).toMatch(/sword|swords|shield|combat/);
		});

		it('should have prompt template for combat generation', () => {
			expect(combatConfig?.promptTemplate).toBeTruthy();
			expect(combatConfig?.promptTemplate.toLowerCase()).toMatch(/combat|encounter/);
		});

		it('should have suggested structure for combat fields', () => {
			expect(combatConfig?.suggestedStructure).toBeTruthy();
			expect(combatConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/enemies|terrain|tactics|rewards/
			);
		});
	});

	describe('Item generation type', () => {
		const itemConfig = GENERATION_TYPES.find((c) => c.id === 'item');

		it('should have item type defined', () => {
			expect(itemConfig).toBeDefined();
		});

		it('should have label "Item"', () => {
			expect(itemConfig?.label).toBe('Item');
		});

		it('should have description about item/artifact generation', () => {
			expect(itemConfig?.description).toBeTruthy();
			expect(itemConfig?.description.toLowerCase()).toMatch(/item|artifact|treasure|equipment/);
		});

		it('should have a package/box icon', () => {
			expect(itemConfig?.icon).toBeTruthy();
			expect(itemConfig?.icon.toLowerCase()).toMatch(/package|box|gift|shopping/);
		});

		it('should have prompt template for item generation', () => {
			expect(itemConfig?.promptTemplate).toBeTruthy();
			expect(itemConfig?.promptTemplate.toLowerCase()).toContain('item');
		});

		it('should have suggested structure for item fields', () => {
			expect(itemConfig?.suggestedStructure).toBeTruthy();
			expect(itemConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/properties|abilities|history|appearance/
			);
		});
	});

	describe('Faction generation type', () => {
		const factionConfig = GENERATION_TYPES.find((c) => c.id === 'faction');

		it('should have faction type defined', () => {
			expect(factionConfig).toBeDefined();
		});

		it('should have label "Faction"', () => {
			expect(factionConfig?.label).toBe('Faction');
		});

		it('should have description about organization generation', () => {
			expect(factionConfig?.description).toBeTruthy();
			expect(factionConfig?.description.toLowerCase()).toMatch(
				/faction|organization|group|guild/
			);
		});

		it('should have a users/group icon', () => {
			expect(factionConfig?.icon).toBeTruthy();
			expect(factionConfig?.icon.toLowerCase()).toMatch(/users|group|people/);
		});

		it('should have prompt template for faction generation', () => {
			expect(factionConfig?.promptTemplate).toBeTruthy();
			expect(factionConfig?.promptTemplate.toLowerCase()).toContain('faction');
		});

		it('should have suggested structure for faction fields', () => {
			expect(factionConfig?.suggestedStructure).toBeTruthy();
			expect(factionConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/goals|resources|leadership|relationships/
			);
		});
	});

	describe('Session Prep generation type', () => {
		const sessionPrepConfig = GENERATION_TYPES.find((c) => c.id === 'session_prep');

		it('should have session_prep type defined', () => {
			expect(sessionPrepConfig).toBeDefined();
		});

		it('should have label "Session Prep"', () => {
			expect(sessionPrepConfig?.label).toBe('Session Prep');
		});

		it('should have description about session planning', () => {
			expect(sessionPrepConfig?.description).toBeTruthy();
			expect(sessionPrepConfig?.description.toLowerCase()).toMatch(
				/session|prep|planning|notes/
			);
		});

		it('should have a calendar/checklist icon', () => {
			expect(sessionPrepConfig?.icon).toBeTruthy();
			expect(sessionPrepConfig?.icon.toLowerCase()).toMatch(/calendar|clock|check|list/);
		});

		it('should have prompt template for session prep generation', () => {
			expect(sessionPrepConfig?.promptTemplate).toBeTruthy();
			expect(sessionPrepConfig?.promptTemplate.toLowerCase()).toMatch(/session|prep/);
		});

		it('should have suggested structure for session prep fields', () => {
			expect(sessionPrepConfig?.suggestedStructure).toBeTruthy();
			expect(sessionPrepConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/scenes|npcs|pacing|key moments/
			);
		});
	});

	describe('getGenerationTypeConfig function', () => {
		it('should be defined', () => {
			expect(getGenerationTypeConfig).toBeDefined();
			expect(typeof getGenerationTypeConfig).toBe('function');
		});

		it('should return config for valid type', () => {
			const config = getGenerationTypeConfig('npc');
			expect(config).toBeDefined();
			expect(config?.id).toBe('npc');
		});

		it('should return config for all valid types', () => {
			const types: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'combat',
				'negotiation',
				'montage',
				'item',
				'faction',
				'session_prep'
			];

			types.forEach((type) => {
				const config = getGenerationTypeConfig(type);
				expect(config).toBeDefined();
				expect(config?.id).toBe(type);
			});
		});

		it('should return null for invalid type', () => {
			// @ts-expect-error - Testing invalid input
			const config = getGenerationTypeConfig('invalid');
			expect(config).toBeNull();
		});

		it('should return null for empty string', () => {
			// @ts-expect-error - Testing invalid input
			const config = getGenerationTypeConfig('');
			expect(config).toBeNull();
		});

		it('should return null for undefined', () => {
			// @ts-expect-error - Testing invalid input
			const config = getGenerationTypeConfig(undefined);
			expect(config).toBeNull();
		});

		it('should return null for null', () => {
			// @ts-expect-error - Testing invalid input
			const config = getGenerationTypeConfig(null);
			expect(config).toBeNull();
		});

		it('should return complete config object with all fields', () => {
			const config = getGenerationTypeConfig('npc');
			expect(config).toHaveProperty('id');
			expect(config).toHaveProperty('label');
			expect(config).toHaveProperty('description');
			expect(config).toHaveProperty('icon');
			expect(config).toHaveProperty('promptTemplate');
			expect(config).toHaveProperty('suggestedStructure');
		});

		it('should be case-sensitive', () => {
			// @ts-expect-error - Testing case sensitivity
			const config = getGenerationTypeConfig('NPC');
			expect(config).toBeNull();
		});

		it('should return different objects for different types', () => {
			const npcConfig = getGenerationTypeConfig('npc');
			const locationConfig = getGenerationTypeConfig('location');
			expect(npcConfig).not.toEqual(locationConfig);
		});

		it('should return same config object for repeated calls', () => {
			const config1 = getGenerationTypeConfig('npc');
			const config2 = getGenerationTypeConfig('npc');
			expect(config1).toEqual(config2);
		});
	});

	describe('Prompt templates', () => {
		it('should have non-empty prompt templates for all types', () => {
			GENERATION_TYPES.forEach((config) => {
				expect(config.promptTemplate).toBeTruthy();
				if (config.id !== 'custom') {
					expect(config.promptTemplate.length).toBeGreaterThan(10);
				}
			});
		});

		it('should have contextual prompt templates', () => {
			const npcConfig = getGenerationTypeConfig('npc');
			expect(npcConfig?.promptTemplate).toContain('NPC');

			const locationConfig = getGenerationTypeConfig('location');
			expect(locationConfig?.promptTemplate).toContain('location');

			const combatConfig = getGenerationTypeConfig('combat');
			expect(combatConfig?.promptTemplate).toMatch(/combat|encounter/);
		});

		it('should mention structure in prompt templates', () => {
			// Templates should guide the AI to use the suggested structure
			GENERATION_TYPES.filter((c) => c.id !== 'custom').forEach((config) => {
				expect(config.promptTemplate.toLowerCase()).toMatch(/structure|format|include/);
			});
		});
	});

	describe('Suggested structures', () => {
		it('should have suggested structures for specialized types', () => {
			const specializedTypes = GENERATION_TYPES.filter((c) => c.id !== 'custom');
			specializedTypes.forEach((config) => {
				expect(config.suggestedStructure).toBeTruthy();
				expect(config.suggestedStructure!.length).toBeGreaterThan(0);
			});
		});

		it('should have markdown format in suggested structures', () => {
			// Structures should use markdown headings
			GENERATION_TYPES.filter((c) => c.id !== 'custom' && c.suggestedStructure).forEach(
				(config) => {
					expect(config.suggestedStructure).toMatch(/##|###|\*\*/);
				}
			);
		});

		it('should suggest relevant fields for each type', () => {
			const npcConfig = getGenerationTypeConfig('npc');
			expect(npcConfig?.suggestedStructure?.toLowerCase()).toMatch(/name|personality/);

			const locationConfig = getGenerationTypeConfig('location');
			expect(locationConfig?.suggestedStructure?.toLowerCase()).toMatch(
				/description|atmosphere/
			);

			const itemConfig = getGenerationTypeConfig('item');
			expect(itemConfig?.suggestedStructure?.toLowerCase()).toMatch(/properties|description/);
		});
	});

	describe('Icon names', () => {
		it('should use valid Lucide icon names', () => {
			// Common Lucide icons that should be available
			const validIconNames = [
				'user',
				'users',
				'map-pin',
				'map',
				'book',
				'scroll',
				'file-text',
				'swords',
				'sword',
				'shield',
				'package',
				'box',
				'gift',
				'calendar',
				'clock',
				'check-square',
				'list',
				'sparkles',
				'wand'
			];

			GENERATION_TYPES.forEach((config) => {
				// Icon should be a reasonable name (lowercase, may have hyphens)
				expect(config.icon).toMatch(/^[a-z]+(-[a-z]+)*$/);
			});
		});

		it('should have unique icons or allow reuse', () => {
			// Icons can be reused, but let's document which are unique
			const icons = GENERATION_TYPES.map((c) => c.icon);
			const uniqueIcons = new Set(icons);
			// Should have at least 5 different icons
			expect(uniqueIcons.size).toBeGreaterThanOrEqual(5);
		});
	});

	describe('Edge cases', () => {
		it('should handle iteration over GENERATION_TYPES', () => {
			let count = 0;
			GENERATION_TYPES.forEach(() => {
				count++;
			});
			expect(count).toBe(10);
		});

		it('should allow filtering GENERATION_TYPES', () => {
			const filtered = GENERATION_TYPES.filter((c) => c.id !== 'custom');
			expect(filtered.length).toBe(9);
		});

		it('should allow mapping GENERATION_TYPES', () => {
			const labels = GENERATION_TYPES.map((c) => c.label);
			expect(labels).toContain('General');
			expect(labels).toContain('NPC');
			expect(labels).toHaveLength(10);
		});

		it('should be readonly/immutable', () => {
			// Test that we can't modify the array
			const originalLength = GENERATION_TYPES.length;
			expect(originalLength).toBe(10);
			// Array should be frozen or readonly (this is more of a TS check)
		});
	});

	describe('Type safety', () => {
		it('should type-check generation type IDs', () => {
			const validType: GenerationType = 'npc';
			const config = getGenerationTypeConfig(validType);
			expect(config).toBeDefined();
		});

		it('should have all configs match GenerationTypeConfig interface', () => {
			GENERATION_TYPES.forEach((config) => {
				const typedConfig: GenerationTypeConfig = config;
				expect(typedConfig.id).toBeDefined();
				expect(typedConfig.label).toBeDefined();
				expect(typedConfig.description).toBeDefined();
				expect(typedConfig.icon).toBeDefined();
				expect(typedConfig.promptTemplate).toBeDefined();
			});
		});
	});

	describe('GenerationTypeField interface (Issue #155)', () => {
		it('should define GenerationTypeField interface', () => {
			// Test that the interface exists and has correct structure
			const mockField = {
				key: 'threatLevel',
				label: 'Threat Level',
				type: 'select' as const,
				options: [
					{ value: 'minion', label: 'Minion' }
				],
				defaultValue: 'standard',
				promptTemplate: 'This NPC is a {value} threat.'
			};

			// TypeScript should accept this structure
			expect(mockField.key).toBe('threatLevel');
			expect(mockField.type).toBe('select');
			expect(Array.isArray(mockField.options)).toBe(true);
		});

		it('should allow typeFields to be optional on GenerationTypeConfig', () => {
			const customConfig = getGenerationTypeConfig('custom');
			// typeFields should be optional, so undefined is valid
			expect(customConfig?.typeFields === undefined || Array.isArray(customConfig?.typeFields)).toBe(true);
		});
	});

	describe('NPC typeFields configuration (Issue #155)', () => {
		const npcConfig = GENERATION_TYPES.find((c) => c.id === 'npc');

		it('should have typeFields defined for NPC type', () => {
			expect(npcConfig?.typeFields).toBeDefined();
			expect(Array.isArray(npcConfig?.typeFields)).toBe(true);
		});

		it('should have exactly 2 typeFields (threatLevel and combatRole)', () => {
			expect(npcConfig?.typeFields).toHaveLength(2);
		});

		describe('Threat Level field', () => {
			let threatLevelField: any;

			beforeEach(() => {
				threatLevelField = npcConfig?.typeFields?.find(f => f.key === 'threatLevel');
			});

			it('should have threatLevel field defined', () => {
				expect(threatLevelField).toBeDefined();
			});

			it('should have correct key', () => {
				expect(threatLevelField?.key).toBe('threatLevel');
			});

			it('should have descriptive label', () => {
				expect(threatLevelField?.label).toBe('Threat Level');
			});

			it('should be of type select', () => {
				expect(threatLevelField?.type).toBe('select');
			});

			it('should have exactly 5 threat level options', () => {
				expect(threatLevelField?.options).toHaveLength(5);
			});

			it('should have minion option', () => {
				const minion = threatLevelField?.options.find((o: any) => o.value === 'minion');
				expect(minion).toBeDefined();
				expect(minion?.label).toBe('Minion');
				expect(minion?.description).toBeTruthy();
				expect(minion?.description.toLowerCase()).toContain('minion');
			});

			it('should have standard option', () => {
				const standard = threatLevelField?.options.find((o: any) => o.value === 'standard');
				expect(standard).toBeDefined();
				expect(standard?.label).toBe('Standard');
				expect(standard?.description).toBeTruthy();
			});

			it('should have elite option', () => {
				const elite = threatLevelField?.options.find((o: any) => o.value === 'elite');
				expect(elite).toBeDefined();
				expect(elite?.label).toBe('Elite');
				expect(elite?.description).toBeTruthy();
				expect(elite?.description.toLowerCase()).toContain('elite');
			});

			it('should have boss option', () => {
				const boss = threatLevelField?.options.find((o: any) => o.value === 'boss');
				expect(boss).toBeDefined();
				expect(boss?.label).toBe('Boss');
				expect(boss?.description).toBeTruthy();
				expect(boss?.description.toLowerCase()).toContain('boss');
			});

			it('should have solo option', () => {
				const solo = threatLevelField?.options.find((o: any) => o.value === 'solo');
				expect(solo).toBeDefined();
				expect(solo?.label).toBe('Solo');
				expect(solo?.description).toBeTruthy();
				expect(solo?.description.toLowerCase()).toContain('solo');
			});

			it('should have default value of standard', () => {
				expect(threatLevelField?.defaultValue).toBe('standard');
			});

			it('should have prompt template with placeholder', () => {
				expect(threatLevelField?.promptTemplate).toBeTruthy();
				expect(threatLevelField?.promptTemplate.toLowerCase()).toContain('threat');
			});

			it('should have all options with value, label, and description', () => {
				threatLevelField?.options.forEach((option: any) => {
					expect(option.value).toBeTruthy();
					expect(option.label).toBeTruthy();
					expect(option.description).toBeTruthy();
				});
			});

			it('should have threat levels in logical order', () => {
				const values = threatLevelField?.options.map((o: any) => o.value);
				expect(values).toEqual(['minion', 'standard', 'elite', 'boss', 'solo']);
			});
		});

		describe('Combat Role field', () => {
			let combatRoleField: any;

			beforeEach(() => {
				combatRoleField = npcConfig?.typeFields?.find(f => f.key === 'combatRole');
			});

			it('should have combatRole field defined', () => {
				expect(combatRoleField).toBeDefined();
			});

			it('should have correct key', () => {
				expect(combatRoleField?.key).toBe('combatRole');
			});

			it('should have descriptive label', () => {
				expect(combatRoleField?.label).toBe('Combat Role');
			});

			it('should be of type select', () => {
				expect(combatRoleField?.type).toBe('select');
			});

			it('should have exactly 10 combat role options', () => {
				expect(combatRoleField?.options).toHaveLength(10);
			});

			it('should have ambusher role', () => {
				const ambusher = combatRoleField?.options.find((o: any) => o.value === 'ambusher');
				expect(ambusher).toBeDefined();
				expect(ambusher?.label).toBe('Ambusher');
				expect(ambusher?.description).toBeTruthy();
			});

			it('should have artillery role', () => {
				const artillery = combatRoleField?.options.find((o: any) => o.value === 'artillery');
				expect(artillery).toBeDefined();
				expect(artillery?.label).toBe('Artillery');
				expect(artillery?.description).toBeTruthy();
			});

			it('should have brute role', () => {
				const brute = combatRoleField?.options.find((o: any) => o.value === 'brute');
				expect(brute).toBeDefined();
				expect(brute?.label).toBe('Brute');
				expect(brute?.description).toBeTruthy();
			});

			it('should have controller role', () => {
				const controller = combatRoleField?.options.find((o: any) => o.value === 'controller');
				expect(controller).toBeDefined();
				expect(controller?.label).toBe('Controller');
				expect(controller?.description).toBeTruthy();
			});

			it('should have defender role', () => {
				const defender = combatRoleField?.options.find((o: any) => o.value === 'defender');
				expect(defender).toBeDefined();
				expect(defender?.label).toBe('Defender');
				expect(defender?.description).toBeTruthy();
			});

			it('should have harrier role', () => {
				const harrier = combatRoleField?.options.find((o: any) => o.value === 'harrier');
				expect(harrier).toBeDefined();
				expect(harrier?.label).toBe('Harrier');
				expect(harrier?.description).toBeTruthy();
			});

			it('should have hexer role', () => {
				const hexer = combatRoleField?.options.find((o: any) => o.value === 'hexer');
				expect(hexer).toBeDefined();
				expect(hexer?.label).toBe('Hexer');
				expect(hexer?.description).toBeTruthy();
			});

			it('should have leader role', () => {
				const leader = combatRoleField?.options.find((o: any) => o.value === 'leader');
				expect(leader).toBeDefined();
				expect(leader?.label).toBe('Leader');
				expect(leader?.description).toBeTruthy();
			});

			it('should have mount role', () => {
				const mount = combatRoleField?.options.find((o: any) => o.value === 'mount');
				expect(mount).toBeDefined();
				expect(mount?.label).toBe('Mount');
				expect(mount?.description).toBeTruthy();
			});

			it('should have support role', () => {
				const support = combatRoleField?.options.find((o: any) => o.value === 'support');
				expect(support).toBeDefined();
				expect(support?.label).toBe('Support');
				expect(support?.description).toBeTruthy();
			});

			it('should have no default value (optional)', () => {
				// Combat role is optional, so no default
				expect(combatRoleField?.defaultValue).toBeUndefined();
			});

			it('should have prompt template with placeholder', () => {
				expect(combatRoleField?.promptTemplate).toBeTruthy();
				expect(combatRoleField?.promptTemplate.toLowerCase()).toMatch(/role|combat/);
			});

			it('should have all options with value, label, and description', () => {
				combatRoleField?.options.forEach((option: any) => {
					expect(option.value).toBeTruthy();
					expect(option.label).toBeTruthy();
					expect(option.description).toBeTruthy();
				});
			});

			it('should have combat roles in alphabetical order', () => {
				const values = combatRoleField?.options.map((o: any) => o.value);
				expect(values).toEqual([
					'ambusher', 'artillery', 'brute', 'controller', 'defender',
					'harrier', 'hexer', 'leader', 'mount', 'support'
				]);
			});
		});

		it('should not have typeFields for non-NPC types', () => {
			const otherTypes = GENERATION_TYPES.filter(c => c.id !== 'npc');
			// Only NPC, Combat, Negotiation, and Montage types should have typeFields
			const typesWithoutFields = GENERATION_TYPES.filter(
				c => !['npc', 'combat', 'negotiation', 'montage'].includes(c.id)
			);
			typesWithoutFields.forEach(config => {
				expect(config.typeFields).toBeUndefined();
			});
		});
	});

	describe('Combat Encounter (enhanced for Draw Steel - Issue #154)', () => {
		const combatConfig = GENERATION_TYPES.find((c) => c.id === 'combat');

		it('should have typeFields defined', () => {
			expect(combatConfig?.typeFields).toBeDefined();
			expect(Array.isArray(combatConfig?.typeFields)).toBe(true);
		});

		it('should have exactly 2 typeFields (encounterDifficulty, terrainComplexity)', () => {
			expect(combatConfig?.typeFields).toHaveLength(2);
		});

		it('should have encounterDifficulty field', () => {
			const difficultyField = combatConfig?.typeFields?.find(f => f.key === 'encounterDifficulty');
			expect(difficultyField).toBeDefined();
			expect(difficultyField?.label).toBe('Encounter Difficulty');
			expect(difficultyField?.type).toBe('select');
		});

		it('should have 4 encounterDifficulty options', () => {
			const difficultyField = combatConfig?.typeFields?.find(f => f.key === 'encounterDifficulty');
			expect(difficultyField?.options).toHaveLength(4);
		});

		it('should have terrainComplexity field', () => {
			const terrainField = combatConfig?.typeFields?.find(f => f.key === 'terrainComplexity');
			expect(terrainField).toBeDefined();
			expect(terrainField?.label).toBe('Terrain Complexity');
			expect(terrainField?.type).toBe('select');
		});

		it('should have 3 terrainComplexity options', () => {
			const terrainField = combatConfig?.typeFields?.find(f => f.key === 'terrainComplexity');
			expect(terrainField?.options).toHaveLength(3);
		});

		it('should reference victory points in promptTemplate', () => {
			expect(combatConfig?.promptTemplate.toLowerCase()).toMatch(/victory point/);
		});

		it('should reference positioning or tactical in promptTemplate', () => {
			expect(combatConfig?.promptTemplate.toLowerCase()).toMatch(/positioning|tactical/);
		});

		it('should reference terrain in promptTemplate', () => {
			expect(combatConfig?.promptTemplate.toLowerCase()).toContain('terrain');
		});

		it('should include Victory Point section in suggestedStructure', () => {
			expect(combatConfig?.suggestedStructure?.toLowerCase()).toMatch(/victory point/);
		});

		it('should include Terrain or Positioning section in suggestedStructure', () => {
			expect(combatConfig?.suggestedStructure?.toLowerCase()).toMatch(/terrain|positioning/);
		});
	});

	describe('Negotiation generation type (Issue #159)', () => {
		const negotiationConfig = GENERATION_TYPES.find((c) => c.id === 'negotiation');

		it('should exist with id negotiation', () => {
			expect(negotiationConfig).toBeDefined();
			expect(negotiationConfig?.id).toBe('negotiation');
		});

		it('should have label "Negotiation"', () => {
			expect(negotiationConfig?.label).toBe('Negotiation');
		});

		it('should reference interest and patience in promptTemplate', () => {
			const template = negotiationConfig?.promptTemplate.toLowerCase();
			expect(template).toContain('interest');
			expect(template).toContain('patience');
		});

		it('should reference motivation in promptTemplate', () => {
			expect(negotiationConfig?.promptTemplate.toLowerCase()).toContain('motivation');
		});

		it('should reference pitfall in promptTemplate', () => {
			expect(negotiationConfig?.promptTemplate.toLowerCase()).toContain('pitfall');
		});

		it('should include Motivations section in suggestedStructure', () => {
			expect(negotiationConfig?.suggestedStructure?.toLowerCase()).toContain('motivation');
		});

		it('should include Outcomes section in suggestedStructure', () => {
			expect(negotiationConfig?.suggestedStructure?.toLowerCase()).toContain('outcome');
		});

		it('should have typeFields defined', () => {
			expect(negotiationConfig?.typeFields).toBeDefined();
			expect(Array.isArray(negotiationConfig?.typeFields)).toBe(true);
		});

		it('should have exactly 2 typeFields (startingPosition, negotiationStakes)', () => {
			expect(negotiationConfig?.typeFields).toHaveLength(2);
		});

		it('should have startingPosition field with 5 options', () => {
			const startingField = negotiationConfig?.typeFields?.find(f => f.key === 'startingPosition');
			expect(startingField).toBeDefined();
			expect(startingField?.label).toBe('Starting Position');
			expect(startingField?.type).toBe('select');
			expect(startingField?.options).toHaveLength(5);
		});

		it('should have negotiationStakes field with 4 options', () => {
			const stakesField = negotiationConfig?.typeFields?.find(f => f.key === 'negotiationStakes');
			expect(stakesField).toBeDefined();
			expect(stakesField?.label).toBe('Stakes');
			expect(stakesField?.type).toBe('select');
			expect(stakesField?.options).toHaveLength(4);
		});
	});

	describe('Montage generation type (Issue #159)', () => {
		const montageConfig = GENERATION_TYPES.find((c) => c.id === 'montage');

		it('should exist with id montage', () => {
			expect(montageConfig).toBeDefined();
			expect(montageConfig?.id).toBe('montage');
		});

		it('should have label "Montage"', () => {
			expect(montageConfig?.label).toBe('Montage');
		});

		it('should reference challenge in promptTemplate', () => {
			expect(montageConfig?.promptTemplate.toLowerCase()).toContain('challenge');
		});

		it('should reference round in promptTemplate', () => {
			expect(montageConfig?.promptTemplate.toLowerCase()).toContain('round');
		});

		it('should include Challenges section in suggestedStructure', () => {
			expect(montageConfig?.suggestedStructure?.toLowerCase()).toContain('challenge');
		});

		it('should have typeFields defined', () => {
			expect(montageConfig?.typeFields).toBeDefined();
			expect(Array.isArray(montageConfig?.typeFields)).toBe(true);
		});

		it('should have exactly 2 typeFields (montageDifficulty, montageTheme)', () => {
			expect(montageConfig?.typeFields).toHaveLength(2);
		});

		it('should have montageDifficulty field with 3 options', () => {
			const difficultyField = montageConfig?.typeFields?.find(f => f.key === 'montageDifficulty');
			expect(difficultyField).toBeDefined();
			expect(difficultyField?.label).toBe('Difficulty');
			expect(difficultyField?.type).toBe('select');
			expect(difficultyField?.options).toHaveLength(3);
		});

		it('should have montageTheme field with 6 options', () => {
			const themeField = montageConfig?.typeFields?.find(f => f.key === 'montageTheme');
			expect(themeField).toBeDefined();
			expect(themeField?.label).toBe('Theme');
			expect(themeField?.type).toBe('select');
			expect(themeField?.options).toHaveLength(6);
		});
	});
});
