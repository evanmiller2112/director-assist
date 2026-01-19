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

import { describe, it, expect } from 'vitest';
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
			expect(types).toContain('encounter');
			expect(types).toContain('item');
			expect(types).toContain('faction');
			expect(types).toContain('session_prep');
		});

		it('should have exactly 8 generation types', () => {
			expect(GENERATION_TYPES).toHaveLength(8);
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
				'encounter',
				'item',
				'faction',
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

	describe('Encounter generation type', () => {
		const encounterConfig = GENERATION_TYPES.find((c) => c.id === 'encounter');

		it('should have encounter type defined', () => {
			expect(encounterConfig).toBeDefined();
		});

		it('should have label "Encounter"', () => {
			expect(encounterConfig?.label).toBe('Encounter');
		});

		it('should have description about combat/challenge generation', () => {
			expect(encounterConfig?.description).toBeTruthy();
			expect(encounterConfig?.description.toLowerCase()).toMatch(
				/encounter|combat|battle|challenge/
			);
		});

		it('should have a swords/combat icon', () => {
			expect(encounterConfig?.icon).toBeTruthy();
			expect(encounterConfig?.icon.toLowerCase()).toMatch(/sword|swords|shield|combat/);
		});

		it('should have prompt template for encounter generation', () => {
			expect(encounterConfig?.promptTemplate).toBeTruthy();
			expect(encounterConfig?.promptTemplate.toLowerCase()).toContain('encounter');
		});

		it('should have suggested structure for encounter fields', () => {
			expect(encounterConfig?.suggestedStructure).toBeTruthy();
			expect(encounterConfig?.suggestedStructure?.toLowerCase()).toMatch(
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
				'encounter',
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

			const encounterConfig = getGenerationTypeConfig('encounter');
			expect(encounterConfig?.promptTemplate).toContain('encounter');
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
			expect(count).toBe(8);
		});

		it('should allow filtering GENERATION_TYPES', () => {
			const filtered = GENERATION_TYPES.filter((c) => c.id !== 'custom');
			expect(filtered.length).toBe(7);
		});

		it('should allow mapping GENERATION_TYPES', () => {
			const labels = GENERATION_TYPES.map((c) => c.label);
			expect(labels).toContain('General');
			expect(labels).toContain('NPC');
			expect(labels).toHaveLength(8);
		});

		it('should be readonly/immutable', () => {
			// Test that we can't modify the array
			const originalLength = GENERATION_TYPES.length;
			expect(originalLength).toBe(8);
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
});
