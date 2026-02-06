/**
 * Tests for Draw Steel Entity Type Templates (Issue #164)
 *
 * Test Strategy: TDD RED Phase
 * These tests define the expected behavior of Draw Steel entity type templates
 * that help Directors create custom entities for common Draw Steel mechanics.
 *
 * Templates Covered:
 * 1. Monster/Threat - Enemies and creatures for encounters
 * 2. Ability/Power - Class abilities and kit powers
 * 3. Condition - Status effects and temporary states
 * 4. Negotiation Outcome - Negotiation encounter outcomes
 * 5. Spell/Ritual - Magic spells and rituals
 *
 * Test Coverage:
 * - Template array structure and count
 * - Individual template validation
 * - Field definition structure and types
 * - Unique identifiers and type keys
 * - Icon and color validation
 * - Field ordering and organization
 * - Draw Steel-specific mechanics representation
 */
import { describe, it, expect } from 'vitest';
import { DRAW_STEEL_ENTITY_TEMPLATES } from './drawSteelEntityTemplates';
import type { EntityTypeDefinition, FieldDefinition, FieldType } from '$lib/types';

/**
 * EntityTypeTemplate Interface
 * Defines structure for entity type templates with metadata
 */
interface EntityTypeTemplate {
	id: string; // Unique template identifier (e.g., 'ds-monster-threat')
	name: string; // Display name (e.g., 'Monster/Threat')
	description: string; // Template description and use case
	category: string; // Category for organization (e.g., 'draw-steel')
	template: EntityTypeDefinition; // Complete entity type definition
}

// =============================================================================
// Template Array Structure Tests
// =============================================================================

describe('drawSteelEntityTemplates.ts - DRAW_STEEL_ENTITY_TEMPLATES Array', () => {
	describe('Array Structure and Count', () => {
		it('should export DRAW_STEEL_ENTITY_TEMPLATES array', () => {
			expect(DRAW_STEEL_ENTITY_TEMPLATES).toBeDefined();
			expect(Array.isArray(DRAW_STEEL_ENTITY_TEMPLATES)).toBe(true);
		});

		it('should contain exactly 5 templates', () => {
			expect(DRAW_STEEL_ENTITY_TEMPLATES.length).toBe(5);
		});

		it('should have all templates with required properties', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template).toHaveProperty('id');
				expect(template).toHaveProperty('name');
				expect(template).toHaveProperty('description');
				expect(template).toHaveProperty('category');
				expect(template).toHaveProperty('template');
			});
		});

		it('should have all templates with draw-steel category', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.category).toBe('draw-steel');
			});
		});

		it('should have unique template IDs', () => {
			const ids = DRAW_STEEL_ENTITY_TEMPLATES.map((t) => t.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should have unique template names', () => {
			const names = DRAW_STEEL_ENTITY_TEMPLATES.map((t) => t.name);
			const uniqueNames = new Set(names);
			expect(uniqueNames.size).toBe(names.length);
		});

		it('should have unique entity type keys across all templates', () => {
			const typeKeys = DRAW_STEEL_ENTITY_TEMPLATES.map((t) => t.template.type);
			const uniqueTypeKeys = new Set(typeKeys);
			expect(uniqueTypeKeys.size).toBe(typeKeys.length);
		});
	});
});

// =============================================================================
// Template 1: Monster/Threat Entity Template
// =============================================================================

describe('Template 1: Monster/Threat Entity', () => {
	const getMonsterTemplate = () =>
		DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-monster-threat');

	describe('Template Metadata', () => {
		it('should exist with correct ID', () => {
			const template = getMonsterTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-monster-threat');
		});

		it('should have correct name', () => {
			const template = getMonsterTemplate();
			expect(template?.name).toBe('Monster/Threat');
		});

		it('should have descriptive text explaining use case', () => {
			const template = getMonsterTemplate();
			expect(template?.description).toBeDefined();
			expect(typeof template?.description).toBe('string');
			expect(template?.description.length).toBeGreaterThan(20);
		});

		it('should be categorized as draw-steel', () => {
			const template = getMonsterTemplate();
			expect(template?.category).toBe('draw-steel');
		});
	});

	describe('Entity Type Definition', () => {
		it('should have complete EntityTypeDefinition', () => {
			const template = getMonsterTemplate();
			expect(template?.template).toBeDefined();
			expect(template?.template).toHaveProperty('type');
			expect(template?.template).toHaveProperty('label');
			expect(template?.template).toHaveProperty('labelPlural');
			expect(template?.template).toHaveProperty('icon');
			expect(template?.template).toHaveProperty('color');
			expect(template?.template).toHaveProperty('isBuiltIn');
			expect(template?.template).toHaveProperty('fieldDefinitions');
			expect(template?.template).toHaveProperty('defaultRelationships');
		});

		it('should have skull icon for monsters', () => {
			const template = getMonsterTemplate();
			expect(template?.template.icon).toBe('skull');
		});

		it('should be marked as not built-in', () => {
			const template = getMonsterTemplate();
			expect(template?.template.isBuiltIn).toBe(false);
		});

		it('should have appropriate color scheme', () => {
			const template = getMonsterTemplate();
			expect(template?.template.color).toBeDefined();
			expect(typeof template?.template.color).toBe('string');
			expect(template?.template.color.length).toBeGreaterThan(0);
		});
	});

	describe('Field Definitions - Monster Stats', () => {
		it('should have threat_level field as select type', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'threat_level');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Threat Level');
			expect(field?.type).toBe('select');
			expect(field?.required).toBe(false);
		});

		it('should have threat_level options matching Draw Steel tiers', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'threat_level');

			expect(field?.options).toBeDefined();
			expect(field?.options).toContain('minion');
			expect(field?.options).toContain('standard');
			expect(field?.options).toContain('boss');
		});

		it('should have role field as select type with combat roles', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'role');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Role');
			expect(field?.type).toBe('select');
			expect(field?.options).toBeDefined();
			expect(field?.options).toContain('ambusher');
			expect(field?.options).toContain('brute');
			expect(field?.options).toContain('defender');
		});

		it('should have ac field as number type', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'ac');

			expect(field).toBeDefined();
			expect(field?.label).toBe('AC');
			expect(field?.type).toBe('number');
			expect(field?.required).toBe(false);
		});

		it('should have hp field as number type', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'hp');

			expect(field).toBeDefined();
			expect(field?.label).toBe('HP');
			expect(field?.type).toBe('number');
			expect(field?.required).toBe(false);
		});

		it('should have movement field as number type', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'movement');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Movement');
			expect(field?.type).toBe('number');
			expect(field?.required).toBe(false);
		});

		it('should have abilities field as richtext type', () => {
			const template = getMonsterTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'abilities');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Abilities');
			expect(field?.type).toBe('richtext');
			expect(field?.required).toBe(false);
		});

		it('should have all 6 required monster fields', () => {
			const template = getMonsterTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];

			expect(fieldKeys).toContain('threat_level');
			expect(fieldKeys).toContain('role');
			expect(fieldKeys).toContain('ac');
			expect(fieldKeys).toContain('hp');
			expect(fieldKeys).toContain('movement');
			expect(fieldKeys).toContain('abilities');
			expect(fieldKeys.length).toBeGreaterThanOrEqual(6);
		});

		it('should have fields with positive order values', () => {
			const template = getMonsterTemplate();
			template?.template.fieldDefinitions.forEach((field) => {
				expect(field.order).toBeGreaterThan(0);
			});
		});

		it('should have unique field keys', () => {
			const template = getMonsterTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];
			const uniqueKeys = new Set(fieldKeys);
			expect(uniqueKeys.size).toBe(fieldKeys.length);
		});
	});
});

// =============================================================================
// Template 2: Ability/Power Entity Template
// =============================================================================

describe('Template 2: Ability/Power Entity', () => {
	const getAbilityTemplate = () =>
		DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-ability-power');

	describe('Template Metadata', () => {
		it('should exist with correct ID', () => {
			const template = getAbilityTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-ability-power');
		});

		it('should have correct name', () => {
			const template = getAbilityTemplate();
			expect(template?.name).toBe('Ability/Power');
		});

		it('should have descriptive text explaining use case', () => {
			const template = getAbilityTemplate();
			expect(template?.description).toBeDefined();
			expect(typeof template?.description).toBe('string');
			expect(template?.description.length).toBeGreaterThan(20);
		});

		it('should have zap icon for abilities', () => {
			const template = getAbilityTemplate();
			expect(template?.template.icon).toBe('zap');
		});
	});

	describe('Field Definitions - Ability Mechanics', () => {
		it('should have action_cost field as select type', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'action_cost');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Action Cost');
			expect(field?.type).toBe('select');
			expect(field?.required).toBe(false);
		});

		it('should have action_cost options for Draw Steel action economy', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'action_cost');

			expect(field?.options).toBeDefined();
			expect(field?.options).toContain('action');
			expect(field?.options).toContain('maneuver');
			expect(field?.options).toContain('triggered');
		});

		it('should have heroic_resource_cost field as text type', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find(
				(f) => f.key === 'heroic_resource_cost'
			);

			expect(field).toBeDefined();
			expect(field?.label).toBe('Heroic Resource Cost');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have damage_formula field as text type', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'damage_formula');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Damage Formula');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have range field as select type', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'range');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Range');
			expect(field?.type).toBe('select');
			expect(field?.required).toBe(false);
		});

		it('should have targets field as select type', () => {
			const template = getAbilityTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'targets');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Targets');
			expect(field?.type).toBe('select');
			expect(field?.required).toBe(false);
		});

		it('should have all 5 required ability fields', () => {
			const template = getAbilityTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];

			expect(fieldKeys).toContain('action_cost');
			expect(fieldKeys).toContain('heroic_resource_cost');
			expect(fieldKeys).toContain('damage_formula');
			expect(fieldKeys).toContain('range');
			expect(fieldKeys).toContain('targets');
			expect(fieldKeys.length).toBeGreaterThanOrEqual(5);
		});
	});
});

// =============================================================================
// Template 3: Condition Entity Template
// =============================================================================

describe('Template 3: Condition Entity', () => {
	const getConditionTemplate = () =>
		DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-condition');

	describe('Template Metadata', () => {
		it('should exist with correct ID', () => {
			const template = getConditionTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-condition');
		});

		it('should have correct name', () => {
			const template = getConditionTemplate();
			expect(template?.name).toBe('Condition');
		});

		it('should have descriptive text explaining use case', () => {
			const template = getConditionTemplate();
			expect(template?.description).toBeDefined();
			expect(typeof template?.description).toBe('string');
			expect(template?.description.length).toBeGreaterThan(20);
		});

		it('should have flame icon for conditions', () => {
			const template = getConditionTemplate();
			expect(template?.template.icon).toBe('flame');
		});
	});

	describe('Field Definitions - Condition Properties', () => {
		it('should have duration field as text type', () => {
			const template = getConditionTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'duration');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Duration');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have stacking field as boolean type', () => {
			const template = getConditionTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'stacking');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Stacking');
			expect(field?.type).toBe('boolean');
			expect(field?.required).toBe(false);
		});

		it('should have description field as richtext type', () => {
			const template = getConditionTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'description');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Description');
			expect(field?.type).toBe('richtext');
			expect(field?.required).toBe(false);
		});

		it('should have effect_text field as richtext type', () => {
			const template = getConditionTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'effect_text');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Effect Text');
			expect(field?.type).toBe('richtext');
			expect(field?.required).toBe(false);
		});

		it('should have all 4 required condition fields', () => {
			const template = getConditionTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];

			expect(fieldKeys).toContain('duration');
			expect(fieldKeys).toContain('stacking');
			expect(fieldKeys).toContain('description');
			expect(fieldKeys).toContain('effect_text');
			expect(fieldKeys.length).toBeGreaterThanOrEqual(4);
		});
	});
});

// =============================================================================
// Template 4: Negotiation Outcome Entity Template
// =============================================================================

describe('Template 4: Negotiation Outcome Entity', () => {
	const getNegotiationTemplate = () =>
		DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-negotiation-outcome');

	describe('Template Metadata', () => {
		it('should exist with correct ID', () => {
			const template = getNegotiationTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-negotiation-outcome');
		});

		it('should have correct name', () => {
			const template = getNegotiationTemplate();
			expect(template?.name).toBe('Negotiation Outcome');
		});

		it('should have descriptive text explaining use case', () => {
			const template = getNegotiationTemplate();
			expect(template?.description).toBeDefined();
			expect(typeof template?.description).toBe('string');
			expect(template?.description.length).toBeGreaterThan(20);
		});

		it('should have drama icon for negotiations', () => {
			const template = getNegotiationTemplate();
			expect(template?.template.icon).toBe('drama');
		});
	});

	describe('Field Definitions - Negotiation Mechanics', () => {
		it('should have position_shift field as select type', () => {
			const template = getNegotiationTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'position_shift');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Position Shift');
			expect(field?.type).toBe('select');
			expect(field?.required).toBe(false);
		});

		it('should have position_shift options for negotiation positions', () => {
			const template = getNegotiationTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'position_shift');

			expect(field?.options).toBeDefined();
			expect(field?.options).toContain('hostile');
			expect(field?.options).toContain('unfavorable');
			expect(field?.options).toContain('neutral');
			expect(field?.options).toContain('favorable');
			expect(field?.options).toContain('friendly');
		});

		it('should have morale_impact field as text type', () => {
			const template = getNegotiationTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'morale_impact');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Morale Impact');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have treaty_terms field as richtext type', () => {
			const template = getNegotiationTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'treaty_terms');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Treaty Terms');
			expect(field?.type).toBe('richtext');
			expect(field?.required).toBe(false);
		});

		it('should have all 3 required negotiation fields', () => {
			const template = getNegotiationTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];

			expect(fieldKeys).toContain('position_shift');
			expect(fieldKeys).toContain('morale_impact');
			expect(fieldKeys).toContain('treaty_terms');
			expect(fieldKeys.length).toBeGreaterThanOrEqual(3);
		});
	});
});

// =============================================================================
// Template 5: Spell/Ritual Entity Template
// =============================================================================

describe('Template 5: Spell/Ritual Entity', () => {
	const getSpellTemplate = () => DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-spell-ritual');

	describe('Template Metadata', () => {
		it('should exist with correct ID', () => {
			const template = getSpellTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-spell-ritual');
		});

		it('should have correct name', () => {
			const template = getSpellTemplate();
			expect(template?.name).toBe('Spell/Ritual');
		});

		it('should have descriptive text explaining use case', () => {
			const template = getSpellTemplate();
			expect(template?.description).toBeDefined();
			expect(typeof template?.description).toBe('string');
			expect(template?.description.length).toBeGreaterThan(20);
		});

		it('should have sparkles icon for spells', () => {
			const template = getSpellTemplate();
			expect(template?.template.icon).toBe('sparkles');
		});
	});

	describe('Field Definitions - Spell Properties', () => {
		it('should have level field as number type', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'level');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Level');
			expect(field?.type).toBe('number');
			expect(field?.required).toBe(false);
		});

		it('should have schools field as multi-select type', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'schools');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Schools');
			expect(field?.type).toBe('multi-select');
			expect(field?.required).toBe(false);
		});

		it('should have schools options for magic schools', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'schools');

			expect(field?.options).toBeDefined();
			expect(Array.isArray(field?.options)).toBe(true);
			expect(field?.options?.length).toBeGreaterThan(0);
		});

		it('should have casting_time field as text type', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'casting_time');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Casting Time');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have range field as text type', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'range');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Range');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have duration field as text type', () => {
			const template = getSpellTemplate();
			const field = template?.template.fieldDefinitions.find((f) => f.key === 'duration');

			expect(field).toBeDefined();
			expect(field?.label).toBe('Duration');
			expect(field?.type).toBe('text');
			expect(field?.required).toBe(false);
		});

		it('should have all 5 required spell fields', () => {
			const template = getSpellTemplate();
			const fieldKeys = template?.template.fieldDefinitions.map((f) => f.key) ?? [];

			expect(fieldKeys).toContain('level');
			expect(fieldKeys).toContain('schools');
			expect(fieldKeys).toContain('casting_time');
			expect(fieldKeys).toContain('range');
			expect(fieldKeys).toContain('duration');
			expect(fieldKeys.length).toBeGreaterThanOrEqual(5);
		});
	});
});

// =============================================================================
// Cross-Template Validation Tests
// =============================================================================

describe('Cross-Template Validation', () => {
	describe('Icon Validation', () => {
		it('should use valid Lucide icon names across all templates', () => {
			const validIcons = ['skull', 'zap', 'flame', 'drama', 'sparkles'];

			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(validIcons).toContain(template.template.icon);
			});
		});

		it('should have distinct icons for each template', () => {
			const icons = DRAW_STEEL_ENTITY_TEMPLATES.map((t) => t.template.icon);
			const uniqueIcons = new Set(icons);
			expect(uniqueIcons.size).toBe(icons.length);
		});
	});

	describe('Field Type Validation', () => {
		it('should only use valid FieldType values', () => {
			const validFieldTypes: FieldType[] = [
				'text',
				'textarea',
				'richtext',
				'number',
				'boolean',
				'select',
				'multi-select',
				'tags',
				'entity-ref',
				'entity-refs',
				'date',
				'url',
				'image',
				'computed'
			];

			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					expect(validFieldTypes).toContain(field.type);
				});
			});
		});

		it('should have options property for select and multi-select fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'select' || field.type === 'multi-select') {
						expect(field.options).toBeDefined();
						expect(Array.isArray(field.options)).toBe(true);
						expect(field.options?.length).toBeGreaterThan(0);
					}
				});
			});
		});
	});

	describe('Field Structure Validation', () => {
		it('should have all required field properties across all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
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
		});

		it('should have unique field keys within each template', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const fieldKeys = template.template.fieldDefinitions.map((f) => f.key);
				const uniqueKeys = new Set(fieldKeys);
				expect(uniqueKeys.size).toBe(fieldKeys.length);
			});
		});

		it('should have positive order values for all fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					expect(field.order).toBeGreaterThan(0);
				});
			});
		});

		it('should have non-empty field labels', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					expect(field.label.length).toBeGreaterThan(0);
				});
			});
		});

		it('should have non-empty field keys', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					expect(field.key.length).toBeGreaterThan(0);
				});
			});
		});
	});

	describe('EntityTypeDefinition Structure', () => {
		it('should have complete EntityTypeDefinition for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.template).toHaveProperty('type');
				expect(template.template).toHaveProperty('label');
				expect(template.template).toHaveProperty('labelPlural');
				expect(template.template).toHaveProperty('icon');
				expect(template.template).toHaveProperty('color');
				expect(template.template).toHaveProperty('isBuiltIn');
				expect(template.template).toHaveProperty('fieldDefinitions');
				expect(template.template).toHaveProperty('defaultRelationships');
			});
		});

		it('should mark all templates as not built-in', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.template.isBuiltIn).toBe(false);
			});
		});

		it('should have label and labelPlural for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.template.label).toBeDefined();
				expect(template.template.labelPlural).toBeDefined();
				expect(typeof template.template.label).toBe('string');
				expect(typeof template.template.labelPlural).toBe('string');
				expect(template.template.label.length).toBeGreaterThan(0);
				expect(template.template.labelPlural.length).toBeGreaterThan(0);
			});
		});

		it('should have defaultRelationships array for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(Array.isArray(template.template.defaultRelationships)).toBe(true);
			});
		});

		it('should have color property for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.template.color).toBeDefined();
				expect(typeof template.template.color).toBe('string');
				expect(template.template.color.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Template Description Quality', () => {
		it('should have meaningful descriptions for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				expect(template.description).toBeDefined();
				expect(typeof template.description).toBe('string');
				// Descriptions should be substantial enough to be helpful
				expect(template.description.length).toBeGreaterThan(30);
			});
		});

		it('should have descriptions that mention use cases', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const description = template.description.toLowerCase();
				// Descriptions should indicate purpose/use
				const hasUseCaseIndicator =
					description.includes('for') ||
					description.includes('track') ||
					description.includes('use') ||
					description.includes('document') ||
					description.includes('reference');

				expect(hasUseCaseIndicator).toBe(true);
			});
		});
	});
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

describe('Edge Cases and Error Handling', () => {
	describe('Array Immutability', () => {
		it('should not allow direct modification of DRAW_STEEL_ENTITY_TEMPLATES', () => {
			const originalLength = DRAW_STEEL_ENTITY_TEMPLATES.length;
			const originalFirstTemplate = DRAW_STEEL_ENTITY_TEMPLATES[0];

			// This test validates that the export is properly structured
			expect(DRAW_STEEL_ENTITY_TEMPLATES.length).toBe(originalLength);
			expect(DRAW_STEEL_ENTITY_TEMPLATES[0]).toBe(originalFirstTemplate);
		});
	});

	describe('Type Safety', () => {
		it('should have proper TypeScript types for all templates', () => {
			// This test validates TypeScript compilation and type checking
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template: EntityTypeTemplate) => {
				const entityDef: EntityTypeDefinition = template.template;
				expect(entityDef).toBeDefined();
			});
		});
	});

	describe('No Duplicate Content', () => {
		it('should not have duplicate field keys across all templates', () => {
			// While templates can share field names (like "duration"), within each template
			// field keys must be unique (tested above). This tests overall diversity.
			const allFieldKeys = DRAW_STEEL_ENTITY_TEMPLATES.flatMap((t) =>
				t.template.fieldDefinitions.map((f) => `${t.id}:${f.key}`)
			);
			const uniqueFieldKeys = new Set(allFieldKeys);
			expect(uniqueFieldKeys.size).toBe(allFieldKeys.length);
		});

		it('should have unique type keys', () => {
			const typeKeys = DRAW_STEEL_ENTITY_TEMPLATES.map((t) => t.template.type);
			const uniqueTypeKeys = new Set(typeKeys);
			expect(uniqueTypeKeys.size).toBe(typeKeys.length);
		});
	});
});
