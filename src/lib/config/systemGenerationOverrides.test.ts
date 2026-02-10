/**
 * Tests for System Generation Overrides (TDD RED Phase)
 *
 * Issue #156: Generation types should be system-aware
 *
 * This test suite covers the system-specific override registry that allows
 * game systems like Draw Steel to enhance base generation types with
 * system-specific prompt content, structure guidance, and type fields.
 *
 * Coverage:
 * - SYSTEM_GENERATION_OVERRIDES registry
 * - getSystemGenerationOverride() function
 * - mergeGenerationConfig() function
 * - Draw Steel specific overrides
 * - System-agnostic fallback behavior
 * - Edge cases and validation
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect } from 'vitest';
import type { GenerationType } from '$lib/types';
import type { GenerationTypeConfig } from './generationTypes';
import {
	SYSTEM_GENERATION_OVERRIDES,
	getSystemGenerationOverride,
	mergeGenerationConfig,
	type SystemGenerationOverride
} from './systemGenerationOverrides';

describe('systemGenerationOverrides', () => {
	describe('SYSTEM_GENERATION_OVERRIDES registry', () => {
		it('should be defined as an object', () => {
			expect(SYSTEM_GENERATION_OVERRIDES).toBeDefined();
			expect(typeof SYSTEM_GENERATION_OVERRIDES).toBe('object');
		});

		it('should have draw-steel entry', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']).toBeDefined();
			expect(typeof SYSTEM_GENERATION_OVERRIDES['draw-steel']).toBe('object');
		});

		it('should have system-agnostic entry', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['system-agnostic']).toBeDefined();
		});

		it('should have empty overrides for system-agnostic', () => {
			const agnosticOverrides = SYSTEM_GENERATION_OVERRIDES['system-agnostic'];
			expect(Object.keys(agnosticOverrides)).toHaveLength(0);
		});

		it('should have at least 4 Draw Steel overrides', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];
			const overrideKeys = Object.keys(drawSteelOverrides);
			expect(overrideKeys.length).toBeGreaterThanOrEqual(4);
		});

		it('should have Draw Steel NPC override', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']['npc']).toBeDefined();
		});

		it('should have Draw Steel combat override', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']['combat']).toBeDefined();
		});

		it('should have Draw Steel session_prep override', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']['session_prep']).toBeDefined();
		});

		it('should have Draw Steel plot_hook override', () => {
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']['plot_hook']).toBeDefined();
		});

		it('should NOT have Draw Steel custom override', () => {
			// Custom type should not have system-specific overrides
			expect(SYSTEM_GENERATION_OVERRIDES['draw-steel']['custom']).toBeUndefined();
		});
	});

	describe('getSystemGenerationOverride function', () => {
		it('should be defined', () => {
			expect(getSystemGenerationOverride).toBeDefined();
			expect(typeof getSystemGenerationOverride).toBe('function');
		});

		it('should return override for valid system and type', () => {
			const override = getSystemGenerationOverride('draw-steel', 'npc');
			expect(override).not.toBeNull();
			expect(typeof override).toBe('object');
		});

		it('should return null for system-agnostic system', () => {
			const override = getSystemGenerationOverride('system-agnostic', 'npc');
			expect(override).toBeNull();
		});

		it('should return null for unknown system', () => {
			// @ts-expect-error - Testing invalid input
			const override = getSystemGenerationOverride('unknown-system', 'npc');
			expect(override).toBeNull();
		});

		it('should return null for null systemId', () => {
			const override = getSystemGenerationOverride(null, 'npc');
			expect(override).toBeNull();
		});

		it('should return null for undefined systemId', () => {
			const override = getSystemGenerationOverride(undefined, 'npc');
			expect(override).toBeNull();
		});

		it('should return null for type without override in system', () => {
			const override = getSystemGenerationOverride('draw-steel', 'custom');
			expect(override).toBeNull();
		});

		it('should return override for all Draw Steel types that have them', () => {
			const typesWithOverrides: GenerationType[] = ['npc', 'combat', 'session_prep', 'plot_hook'];

			for (const type of typesWithOverrides) {
				const override = getSystemGenerationOverride('draw-steel', type);
				expect(override).not.toBeNull();
			}
		});

		it('should return object with SystemGenerationOverride structure', () => {
			const override = getSystemGenerationOverride('draw-steel', 'npc');
			expect(override).not.toBeNull();

			// Should be an object with optional properties
			if (override) {
				const validKeys = ['promptAddendum', 'structureAddendum', 'additionalTypeFields', 'typeFieldOverrides'];
				const overrideKeys = Object.keys(override);
				overrideKeys.forEach(key => {
					expect(validKeys).toContain(key);
				});
			}
		});
	});

	describe('mergeGenerationConfig function', () => {
		const mockBaseConfig: GenerationTypeConfig = {
			id: 'npc',
			label: 'NPC',
			description: 'Generic NPC',
			icon: 'user',
			promptTemplate: 'Generate an NPC.',
			suggestedStructure: '## Name\n## Description',
			typeFields: []
		};

		it('should be defined', () => {
			expect(mergeGenerationConfig).toBeDefined();
			expect(typeof mergeGenerationConfig).toBe('function');
		});

		it('should return base config when override is null', () => {
			const result = mergeGenerationConfig(mockBaseConfig, null);
			expect(result).toBeDefined();
			expect(result.id).toBe('npc');
			expect(result.promptTemplate).toBe('Generate an NPC.');
		});

		it('should not mutate original base config', () => {
			const override: SystemGenerationOverride = {
				promptAddendum: 'Additional prompt'
			};

			const originalPrompt = mockBaseConfig.promptTemplate;
			mergeGenerationConfig(mockBaseConfig, override);

			expect(mockBaseConfig.promptTemplate).toBe(originalPrompt);
		});

		it('should append promptAddendum to base promptTemplate', () => {
			const override: SystemGenerationOverride = {
				promptAddendum: 'Consider Draw Steel mechanics.'
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.promptTemplate).toContain('Generate an NPC.');
			expect(result.promptTemplate).toContain('Consider Draw Steel mechanics.');
		});

		it('should append structureAddendum to base suggestedStructure', () => {
			const override: SystemGenerationOverride = {
				structureAddendum: '\n## Draw Steel Stats'
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.suggestedStructure).toContain('## Name');
			expect(result.suggestedStructure).toContain('## Draw Steel Stats');
		});

		it('should add additionalTypeFields to base typeFields', () => {
			const override: SystemGenerationOverride = {
				additionalTypeFields: [
					{
						key: 'ancestry',
						label: 'Ancestry',
						type: 'select',
						options: [{ value: 'human', label: 'Human' }],
						promptTemplate: 'Ancestry: {value}'
					}
				]
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.typeFields).toBeDefined();
			expect(result.typeFields?.length).toBeGreaterThan(0);
			expect(result.typeFields?.find(f => f.key === 'ancestry')).toBeDefined();
		});

		it('should handle override with only promptAddendum', () => {
			const override: SystemGenerationOverride = {
				promptAddendum: 'Only prompt'
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.promptTemplate).toContain('Only prompt');
			expect(result.suggestedStructure).toBe(mockBaseConfig.suggestedStructure);
		});

		it('should handle override with only structureAddendum', () => {
			const override: SystemGenerationOverride = {
				structureAddendum: '\n## Extra'
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.promptTemplate).toBe(mockBaseConfig.promptTemplate);
			expect(result.suggestedStructure).toContain('## Extra');
		});

		it('should handle override with all properties', () => {
			const override: SystemGenerationOverride = {
				promptAddendum: 'Prompt addition',
				structureAddendum: '\n## Structure addition',
				additionalTypeFields: [
					{
						key: 'testField',
						label: 'Test',
						type: 'select',
						options: [],
						promptTemplate: 'Test: {value}'
					}
				]
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.promptTemplate).toContain('Prompt addition');
			expect(result.suggestedStructure).toContain('Structure addition');
			expect(result.typeFields?.find(f => f.key === 'testField')).toBeDefined();
		});

		it('should preserve base config fields not affected by override', () => {
			const override: SystemGenerationOverride = {
				promptAddendum: 'Additional'
			};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.id).toBe(mockBaseConfig.id);
			expect(result.label).toBe(mockBaseConfig.label);
			expect(result.description).toBe(mockBaseConfig.description);
			expect(result.icon).toBe(mockBaseConfig.icon);
		});

		it('should handle empty override object', () => {
			const override: SystemGenerationOverride = {};

			const result = mergeGenerationConfig(mockBaseConfig, override);

			expect(result.promptTemplate).toBe(mockBaseConfig.promptTemplate);
			expect(result.suggestedStructure).toBe(mockBaseConfig.suggestedStructure);
		});
	});

	describe('Draw Steel NPC override', () => {
		const npcOverride = SYSTEM_GENERATION_OVERRIDES['draw-steel']['npc'];

		it('should have promptAddendum mentioning ancestries', () => {
			expect(npcOverride).toBeDefined();
			expect(npcOverride?.promptAddendum).toBeDefined();
			expect(npcOverride?.promptAddendum?.toLowerCase()).toMatch(/ancestry|ancestries/);
		});

		it('should mention Draw Steel classes', () => {
			expect(npcOverride?.promptAddendum?.toLowerCase()).toMatch(/class|classes/);
		});

		it('should use "Director" terminology', () => {
			const text = (npcOverride?.promptAddendum || '') + (npcOverride?.structureAddendum || '');
			expect(text.toLowerCase()).toMatch(/director/);
		});

		it('should not use "DM" or "GM" terminology', () => {
			const text = (npcOverride?.promptAddendum || '') + (npcOverride?.structureAddendum || '');
			// Should use Director, not DM/GM
			expect(text).not.toMatch(/\bDM\b|\bGM\b/);
		});

		it('should mention threat levels from Draw Steel', () => {
			const text = npcOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/threat|minion|elite|boss|solo/);
		});

		it('should mention combat roles from Draw Steel', () => {
			const text = npcOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/role|brute|controller|support/);
		});
	});

	describe('Draw Steel combat override', () => {
		const combatOverride = SYSTEM_GENERATION_OVERRIDES['draw-steel']['combat'];

		it('should have promptAddendum mentioning Victory Points', () => {
			expect(combatOverride).toBeDefined();
			expect(combatOverride?.promptAddendum).toBeDefined();
			expect(combatOverride?.promptAddendum?.toLowerCase()).toMatch(/victory point/);
		});

		it('should mention Negotiation encounters', () => {
			expect(combatOverride?.promptAddendum?.toLowerCase()).toMatch(/negotiation/);
		});

		it('should mention Montage scenes', () => {
			expect(combatOverride?.promptAddendum?.toLowerCase()).toMatch(/montage/);
		});

		it('should use "Director" terminology', () => {
			const text = (combatOverride?.promptAddendum || '') + (combatOverride?.structureAddendum || '');
			expect(text.toLowerCase()).toMatch(/director/);
		});

		it('should reference Draw Steel tactical mechanics', () => {
			const text = combatOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/tactical|grid|square/);
		});
	});

	describe('Draw Steel session_prep override', () => {
		const sessionPrepOverride = SYSTEM_GENERATION_OVERRIDES['draw-steel']['session_prep'];

		it('should have promptAddendum referencing Draw Steel mechanics', () => {
			expect(sessionPrepOverride).toBeDefined();
			expect(sessionPrepOverride?.promptAddendum).toBeDefined();
			expect(sessionPrepOverride?.promptAddendum?.toLowerCase()).toMatch(/draw steel/);
		});

		it('should use "Director" terminology', () => {
			const text = (sessionPrepOverride?.promptAddendum || '') + (sessionPrepOverride?.structureAddendum || '');
			expect(text.toLowerCase()).toMatch(/director/);
		});

		it('should mention XP and rewards', () => {
			const text = sessionPrepOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/xp|experience|reward/);
		});

		it('should reference encounter types', () => {
			const text = sessionPrepOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/encounter|combat|negotiation|montage/);
		});
	});

	describe('Draw Steel plot_hook override', () => {
		const plotHookOverride = SYSTEM_GENERATION_OVERRIDES['draw-steel']['plot_hook'];

		it('should have promptAddendum mentioning heroic fantasy', () => {
			expect(plotHookOverride).toBeDefined();
			expect(plotHookOverride?.promptAddendum).toBeDefined();
			expect(plotHookOverride?.promptAddendum?.toLowerCase()).toMatch(/heroic|hero|fantasy/);
		});

		it('should use "Director" terminology', () => {
			const text = (plotHookOverride?.promptAddendum || '') + (plotHookOverride?.structureAddendum || '');
			expect(text.toLowerCase()).toMatch(/director/);
		});

		it('should mention tactical elements', () => {
			const text = plotHookOverride?.promptAddendum || '';
			expect(text.toLowerCase()).toMatch(/tactical|combat|encounter/);
		});
	});

	describe('All Draw Steel overrides', () => {
		it('should all use "Director" instead of DM/GM', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];

			for (const [type, override] of Object.entries(drawSteelOverrides)) {
				const text = (override?.promptAddendum || '') + (override?.structureAddendum || '');

				if (text.length > 0) {
					expect(text.toLowerCase()).toMatch(/director/);
					expect(text).not.toMatch(/\bDM\b|\bGM\b/);
				}
			}
		});

		it('should all have non-empty promptAddendum', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];

			for (const [type, override] of Object.entries(drawSteelOverrides)) {
				expect(override.promptAddendum).toBeDefined();
				expect(override.promptAddendum!.length).toBeGreaterThan(10);
			}
		});

		it('should reference Draw Steel or system-specific mechanics', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];

			for (const [type, override] of Object.entries(drawSteelOverrides)) {
				const text = (override?.promptAddendum || '').toLowerCase();

				// Should mention at least one Draw Steel specific concept
				const hasDrawSteelConcepts =
					text.includes('draw steel') ||
					text.includes('victory point') ||
					text.includes('ancestry') ||
					text.includes('negotiation') ||
					text.includes('montage') ||
					text.includes('director') ||
					text.includes('heroic resource');

				expect(hasDrawSteelConcepts).toBe(true);
			}
		});
	});

	describe('Edge cases', () => {
		it('should handle invalid system IDs gracefully', () => {
			// @ts-expect-error - Testing invalid input
			const override = getSystemGenerationOverride('invalid-system-id', 'npc');
			expect(override).toBeNull();
		});

		it('should handle invalid generation types gracefully', () => {
			// @ts-expect-error - Testing invalid input
			const override = getSystemGenerationOverride('draw-steel', 'invalid-type');
			expect(override).toBeNull();
		});

		it('should handle empty strings gracefully', () => {
			// @ts-expect-error - Testing invalid input
			const override = getSystemGenerationOverride('', '');
			expect(override).toBeNull();
		});

		it('should handle mergeGenerationConfig with config lacking optional fields', () => {
			const minimalConfig: GenerationTypeConfig = {
				id: 'custom',
				label: 'Custom',
				description: 'Test',
				icon: 'sparkles',
				promptTemplate: 'Test'
			};

			const override: SystemGenerationOverride = {
				structureAddendum: '## Extra'
			};

			const result = mergeGenerationConfig(minimalConfig, override);

			expect(result).toBeDefined();
			expect(result.suggestedStructure).toContain('## Extra');
		});

		it('should preserve typeFields array reference integrity', () => {
			const baseWithFields: GenerationTypeConfig = {
				id: 'npc',
				label: 'NPC',
				description: 'Test',
				icon: 'user',
				promptTemplate: 'Test',
				typeFields: [
					{
						key: 'existing',
						label: 'Existing',
						type: 'select',
						options: [],
						promptTemplate: 'test'
					}
				]
			};

			const override: SystemGenerationOverride = {
				additionalTypeFields: [
					{
						key: 'new',
						label: 'New',
						type: 'select',
						options: [],
						promptTemplate: 'test'
					}
				]
			};

			const result = mergeGenerationConfig(baseWithFields, override);

			// Should have both fields
			expect(result.typeFields?.length).toBe(2);
			expect(result.typeFields?.find(f => f.key === 'existing')).toBeDefined();
			expect(result.typeFields?.find(f => f.key === 'new')).toBeDefined();

			// Original should not be mutated
			expect(baseWithFields.typeFields.length).toBe(1);
		});
	});

	describe('Integration with base generation types', () => {
		it('should have overrides for generation types that benefit from system context', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];

			// These types should have Draw Steel overrides
			expect(drawSteelOverrides['npc']).toBeDefined();
			expect(drawSteelOverrides['combat']).toBeDefined();

			// Plot hooks and session prep also benefit from system context
			expect(drawSteelOverrides['plot_hook']).toBeDefined();
			expect(drawSteelOverrides['session_prep']).toBeDefined();
		});

		it('should not override custom/general type', () => {
			const drawSteelOverrides = SYSTEM_GENERATION_OVERRIDES['draw-steel'];

			// Custom should remain generic
			expect(drawSteelOverrides['custom']).toBeUndefined();
		});

		it('should maintain compatibility with base GenerationTypeConfig', () => {
			const baseConfig: GenerationTypeConfig = {
				id: 'npc',
				label: 'NPC',
				description: 'Test',
				icon: 'user',
				promptTemplate: 'Base prompt',
				suggestedStructure: 'Base structure'
			};

			const override = getSystemGenerationOverride('draw-steel', 'npc');
			const merged = mergeGenerationConfig(baseConfig, override);

			// Merged config should still be a valid GenerationTypeConfig
			expect(merged.id).toBeDefined();
			expect(merged.label).toBeDefined();
			expect(merged.description).toBeDefined();
			expect(merged.icon).toBeDefined();
			expect(merged.promptTemplate).toBeDefined();
		});
	});
});
