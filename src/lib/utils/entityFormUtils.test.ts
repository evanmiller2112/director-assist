/**
 * Tests for Entity Form Utilities
 *
 * Issue #5 Phase 2: System-Aware Entity Form Utilities
 *
 * These utilities provide helper functions for working with entity type definitions
 * in a system-aware context. The primary function `getSystemAwareEntityType()` returns
 * entity type definitions with system-specific modifications applied (e.g., Draw Steel
 * character fields like ancestry, class, kit).
 *
 * Test Coverage:
 * - getSystemAwareEntityType with no system (base entity type)
 * - getSystemAwareEntityType with Draw Steel system
 * - System-specific field additions
 * - Field ordering and integration
 * - Error handling and edge cases
 */

import { describe, it, expect } from 'vitest';
import { getSystemAwareEntityType } from './entityFormUtils';
import type { BaseEntity } from '$lib/types';
import { DRAW_STEEL_PROFILE, SYSTEM_AGNOSTIC_PROFILE } from '$lib/config/systems';

describe('getSystemAwareEntityType - Basic Functionality', () => {
	it('should return base character definition when no system profile provided', () => {
		const result = getSystemAwareEntityType('character', null);
		expect(result).toBeDefined();
		expect(result?.type).toBe('character');
		// Base character has ancestry and heroClass, but not Draw Steel-specific kit/heroicResource
		const fields = result?.fieldDefinitions || [];
		expect(fields.find((f) => f.key === 'ancestry')).toBeDefined();
		expect(fields.find((f) => f.key === 'heroClass')).toBeDefined();
		expect(fields.find((f) => f.key === 'kit')).toBeUndefined();
		expect(fields.find((f) => f.key === 'heroicResource')).toBeUndefined();
	});

	it('should return base NPC definition when no system profile provided', () => {
		const result = getSystemAwareEntityType('npc', null);
		expect(result).toBeDefined();
		expect(result?.type).toBe('npc');
		// Should not have Draw Steel fields
		const fields = result?.fieldDefinitions || [];
		expect(fields.find((f) => f.key === 'threatLevel')).toBeUndefined();
	});

	it('should return undefined for non-existent encounter entity type', () => {
		const result = getSystemAwareEntityType('encounter', null);
		// encounter entity type doesn't exist in built-in types
		expect(result).toBeUndefined();
	});

	it('should return undefined for unknown entity type', () => {
		const result = getSystemAwareEntityType('unknown_type', null);
		expect(result).toBeUndefined();
	});

	it('should handle undefined system profile gracefully', () => {
		const result = getSystemAwareEntityType('character', undefined);
		expect(result).toBeDefined();
		expect(result?.type).toBe('character');
	});
});

describe('getSystemAwareEntityType - System Agnostic', () => {
	it('should return base definition for system-agnostic character', () => {
		const result = getSystemAwareEntityType('character', SYSTEM_AGNOSTIC_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('character');
		// System-agnostic has no modifications, but base character has ancestry
		const fields = result?.fieldDefinitions || [];
		expect(fields.find((f) => f.key === 'ancestry')).toBeDefined();
		// Should be text type from base, not select from Draw Steel
		expect(fields.find((f) => f.key === 'ancestry')?.type).toBe('text');
	});

	it('should return base definition for system-agnostic NPC', () => {
		const result = getSystemAwareEntityType('npc', SYSTEM_AGNOSTIC_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('npc');
	});

	it('should not add any extra fields for system-agnostic', () => {
		const baseResult = getSystemAwareEntityType('character', null);
		const agnosticResult = getSystemAwareEntityType('character', SYSTEM_AGNOSTIC_PROFILE);
		// Both should have same field count since system-agnostic doesn't add modifications
		expect(baseResult?.fieldDefinitions.length).toBe(agnosticResult?.fieldDefinitions.length);
	});
});

describe('getSystemAwareEntityType - Draw Steel Character', () => {
	it('should add Draw Steel character fields when system is draw-steel', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		const fields = result?.fieldDefinitions || [];
		// Base character has ancestry and heroClass fields
		expect(fields.find((f) => f.key === 'ancestry')).toBeDefined();
		expect(fields.find((f) => f.key === 'heroClass')).toBeDefined();
		// Draw Steel system adds kit and heroicResource
		expect(fields.find((f) => f.key === 'kit')).toBeDefined();
		expect(fields.find((f) => f.key === 'heroicResource')).toBeDefined();
	});

	it('should include ancestry field in Draw Steel character', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const ancestryField = result?.fieldDefinitions.find((f) => f.key === 'ancestry');
		expect(ancestryField).toBeDefined();
		expect(ancestryField?.label).toBe('Ancestry');
		// Draw Steel system overrides base text field with select field
		expect(ancestryField?.type).toBe('select');
		expect(ancestryField?.options).toContain('Human');
		expect(ancestryField?.options).toContain('Dwarf');
		expect(ancestryField?.options).toContain('High Elf');
	});

	it('should include class field in Draw Steel character', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const classField = result?.fieldDefinitions.find((f) => f.key === 'heroClass');
		expect(classField).toBeDefined();
		expect(classField?.label).toBe('Class');
		// Draw Steel system overrides base text field with select field
		expect(classField?.type).toBe('select');
		expect(classField?.options).toContain('Tactician');
		expect(classField?.options).toContain('Fury');
		expect(classField?.options).toContain('Shadow');
	});

	it('should include kit field in Draw Steel character', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const kitField = result?.fieldDefinitions.find((f) => f.key === 'kit');
		expect(kitField).toBeDefined();
		expect(kitField?.label).toBe('Kit');
		expect(kitField?.type).toBe('text');
	});

	it('should include heroicResource field in Draw Steel character', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const heroicResourceField = result?.fieldDefinitions.find((f) => f.key === 'heroicResource');
		expect(heroicResourceField).toBeDefined();
		expect(heroicResourceField?.label).toBe('Heroic Resource');
		expect(heroicResourceField?.type).toBe('richtext');
	});

	it('should maintain base character fields alongside Draw Steel fields', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const fields = result?.fieldDefinitions || [];
		// Check for base fields
		expect(fields.find((f) => f.key === 'playerName')).toBeDefined();
		expect(fields.find((f) => f.key === 'concept')).toBeDefined();
		expect(fields.find((f) => f.key === 'background')).toBeDefined();
		expect(fields.find((f) => f.key === 'personality')).toBeDefined();
	});

	it('should mark Draw Steel character fields as not required by default', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const ancestryField = result?.fieldDefinitions.find((f) => f.key === 'ancestry');
		const classField = result?.fieldDefinitions.find((f) => f.key === 'heroClass');
		const kitField = result?.fieldDefinitions.find((f) => f.key === 'kit');
		const heroicResourceField = result?.fieldDefinitions.find((f) => f.key === 'heroicResource');

		// All fields should not be required
		expect(ancestryField?.required).toBe(false);
		expect(classField?.required).toBe(false);
		expect(kitField?.required).toBe(false);
		expect(heroicResourceField?.required).toBe(false);
	});
});

describe('getSystemAwareEntityType - Draw Steel NPC', () => {
	it('should add Draw Steel NPC fields when system is draw-steel', () => {
		const result = getSystemAwareEntityType('npc', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		const fields = result?.fieldDefinitions || [];
		expect(fields.find((f) => f.key === 'threatLevel')).toBeDefined();
		expect(fields.find((f) => f.key === 'role')).toBeDefined();
	});

	it('should include threatLevel field in Draw Steel NPC', () => {
		const result = getSystemAwareEntityType('npc', DRAW_STEEL_PROFILE);
		const threatLevelField = result?.fieldDefinitions.find((f) => f.key === 'threatLevel');
		expect(threatLevelField).toBeDefined();
		expect(threatLevelField?.label).toBe('Threat Level');
		expect(threatLevelField?.type).toBe('select');
		expect(threatLevelField?.options).toContain('minion');
		expect(threatLevelField?.options).toContain('standard');
		expect(threatLevelField?.options).toContain('elite');
		expect(threatLevelField?.options).toContain('boss');
		expect(threatLevelField?.options).toContain('solo');
	});

	it('should include role field in Draw Steel NPC', () => {
		const result = getSystemAwareEntityType('npc', DRAW_STEEL_PROFILE);
		const roleField = result?.fieldDefinitions.find((f) => f.key === 'role');
		expect(roleField).toBeDefined();
		// Check if it's the combat role or the base role
		// The system should add a combat role field
		const combatRoleField = result?.fieldDefinitions.filter((f) => f.key === 'role' && f.label === 'Combat Role')[0];
		if (combatRoleField) {
			expect(combatRoleField.type).toBe('select');
			expect(combatRoleField.options).toContain('ambusher');
			expect(combatRoleField.options).toContain('artillery');
		}
	});

	it('should maintain base NPC fields alongside Draw Steel fields', () => {
		const result = getSystemAwareEntityType('npc', DRAW_STEEL_PROFILE);
		const fields = result?.fieldDefinitions || [];
		// Base NPC has role (occupation), personality, appearance
		expect(fields.find((f) => f.key === 'personality')).toBeDefined();
		expect(fields.find((f) => f.key === 'appearance')).toBeDefined();
	});

	it('should mark Draw Steel NPC fields as not required by default', () => {
		const result = getSystemAwareEntityType('npc', DRAW_STEEL_PROFILE);
		const threatLevelField = result?.fieldDefinitions.find((f) => f.key === 'threatLevel');
		expect(threatLevelField?.required).toBe(false);
	});
});

describe('getSystemAwareEntityType - Draw Steel Encounter', () => {
	it('should return undefined for non-existent encounter entity type with Draw Steel', () => {
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		// encounter entity type doesn't exist in built-in types
		// system modifications cannot be applied to non-existent types
		expect(result).toBeUndefined();
	});

	it.skip('should include victoryPoints field in Draw Steel encounter', () => {
		// Skipped: encounter entity type doesn't exist yet
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		const victoryPointsField = result?.fieldDefinitions.find((f) => f.key === 'victoryPoints');
		expect(victoryPointsField).toBeDefined();
		expect(victoryPointsField?.label).toBe('Victory Points');
		expect(victoryPointsField?.type).toBe('number');
	});

	it.skip('should include negotiationDC field in Draw Steel encounter', () => {
		// Skipped: encounter entity type doesn't exist yet
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		const negotiationDCField = result?.fieldDefinitions.find((f) => f.key === 'negotiationDC');
		expect(negotiationDCField).toBeDefined();
		expect(negotiationDCField?.label).toBe('Negotiation DC');
		expect(negotiationDCField?.type).toBe('number');
	});

	it.skip('should override encounterType options for Draw Steel', () => {
		// Skipped: encounter entity type doesn't exist yet
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		const encounterTypeField = result?.fieldDefinitions.find((f) => f.key === 'encounterType');
		if (encounterTypeField?.options) {
			expect(encounterTypeField.options).toContain('combat');
			expect(encounterTypeField.options).toContain('negotiation');
			expect(encounterTypeField.options).toContain('montage');
		}
	});

	it.skip('should maintain base encounter fields', () => {
		// Skipped: encounter entity type doesn't exist yet
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		const fields = result?.fieldDefinitions || [];
		expect(fields.find((f) => f.key === 'encounterType')).toBeDefined();
	});

	it.skip('should mark Draw Steel encounter fields as not required by default', () => {
		// Skipped: encounter entity type doesn't exist yet
		const result = getSystemAwareEntityType('encounter', DRAW_STEEL_PROFILE);
		const victoryPointsField = result?.fieldDefinitions.find((f) => f.key === 'victoryPoints');
		const negotiationDCField = result?.fieldDefinitions.find((f) => f.key === 'negotiationDC');
		expect(victoryPointsField?.required).toBe(false);
		expect(negotiationDCField?.required).toBe(false);
	});
});

describe('getSystemAwareEntityType - Other Entity Types', () => {
	it('should not modify location entity type for Draw Steel', () => {
		const result = getSystemAwareEntityType('location', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('location');
	});

	it('should not modify faction entity type for Draw Steel', () => {
		const result = getSystemAwareEntityType('faction', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('faction');
	});

	it('should not modify item entity type for Draw Steel', () => {
		const result = getSystemAwareEntityType('item', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('item');
	});

	it('should not modify session entity type for Draw Steel', () => {
		const result = getSystemAwareEntityType('session', DRAW_STEEL_PROFILE);
		expect(result).toBeDefined();
		expect(result?.type).toBe('session');
	});
});

describe('getSystemAwareEntityType - Custom Entity Types', () => {
	const customType = {
		type: 'custom_monster',
		label: 'Custom Monster',
		labelPlural: 'Custom Monsters',
		icon: 'skull',
		color: 'red',
		isBuiltIn: false,
		fieldDefinitions: [
			{
				key: 'hit_points',
				label: 'Hit Points',
				type: 'number' as const,
				required: true,
				order: 1
			}
		],
		defaultRelationships: []
	};

	it('should return custom entity type definition when type is custom', () => {
		const result = getSystemAwareEntityType('custom_monster', null, [customType]);
		expect(result).toBeDefined();
		expect(result?.type).toBe('custom_monster');
		expect(result?.label).toBe('Custom Monster');
	});

	it('should not apply system modifications to custom entity types', () => {
		const result = getSystemAwareEntityType('custom_monster', DRAW_STEEL_PROFILE, [customType]);
		expect(result).toBeDefined();
		// Custom types should not get Draw Steel modifications
		const fields = result?.fieldDefinitions || [];
		expect(fields.length).toBe(1);
		expect(fields[0].key).toBe('hit_points');
	});
});

describe('getSystemAwareEntityType - Performance and Edge Cases', () => {
	it('should return consistent results for same inputs', () => {
		const result1 = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		const result2 = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		expect(result1?.type).toBe(result2?.type);
		expect(result1?.fieldDefinitions.length).toBe(result2?.fieldDefinitions.length);
	});

	it('should handle multiple calls efficiently', () => {
		const startTime = Date.now();
		for (let i = 0; i < 100; i++) {
			getSystemAwareEntityType('character', DRAW_STEEL_PROFILE);
		}
		const endTime = Date.now();
		// Should complete 100 calls quickly (< 100ms)
		expect(endTime - startTime).toBeLessThan(100);
	});

	it('should handle null system profile', () => {
		const result = getSystemAwareEntityType('character', null);
		expect(result).toBeDefined();
	});

	it('should handle undefined system profile', () => {
		const result = getSystemAwareEntityType('character', undefined);
		expect(result).toBeDefined();
	});

	it('should handle empty custom types array', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE, []);
		expect(result).toBeDefined();
	});

	it('should handle undefined custom types', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE, undefined);
		expect(result).toBeDefined();
	});

	it('should handle empty overrides array', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE, [], []);
		expect(result).toBeDefined();
	});

	it('should handle undefined overrides', () => {
		const result = getSystemAwareEntityType('character', DRAW_STEEL_PROFILE, [], undefined);
		expect(result).toBeDefined();
	});
});
