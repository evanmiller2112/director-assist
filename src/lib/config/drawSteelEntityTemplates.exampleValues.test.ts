/**
 * Unit Tests for Template Example Values (Issue #222)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until exampleValues are added to all entity type templates.
 *
 * Test Strategy:
 * 1. Template Structure Tests - Verify exampleValues property exists on all templates
 * 2. Field Coverage Tests - Ensure examples cover all template fields
 * 3. Value Quality Tests - Validate examples are meaningful and helpful
 * 4. Field Type Tests - Ensure examples match field type requirements
 * 5. Cross-Template Tests - Validate consistency across all templates
 *
 * Requirements from Issue #222:
 * - Add exampleValues property to each EntityTypeTemplate
 * - Examples should show sample field values for each template
 * - Values should be meaningful, not empty or placeholder text
 * - Examples help users understand what to enter when using a template
 * - Example values should match the template's field keys exactly
 *
 * Template Coverage:
 * 1. Monster/Threat - Combat statistics example
 * 2. Ability/Power - Class ability example
 * 3. Condition - Status effect example
 * 4. Negotiation Outcome - Social encounter example
 * 5. Spell/Ritual - Magic spell example
 * 6. Encounter - Combat encounter example
 * 7. Treasure/Loot - Item reward example
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DRAW_STEEL_ENTITY_TEMPLATES } from './drawSteelEntityTemplates';
import type { EntityTypeTemplate } from './drawSteelEntityTemplates';
import type { FieldType } from '$lib/types';

// Type definition for exampleValues (to be added to EntityTypeTemplate)
type ExampleValues = Record<string, unknown>;

// Extended interface for template with exampleValues
interface TemplateWithExamples extends EntityTypeTemplate {
	exampleValues?: ExampleValues;
}

describe('Template Example Values (Issue #222)', () => {
	// =============================================================================
	// Template Structure Tests - exampleValues Property
	// =============================================================================

	describe('Template Structure - exampleValues Property', () => {
		it('should have exampleValues property on all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				expect(templateWithExamples.exampleValues).toBeDefined();
				expect(templateWithExamples.exampleValues).not.toBeNull();
			});
		});

		it('should have exampleValues as an object (not array or primitive)', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				expect(typeof templateWithExamples.exampleValues).toBe('object');
				expect(Array.isArray(templateWithExamples.exampleValues)).toBe(false);
			});
		});

		it('should have non-empty exampleValues for all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleKeys = Object.keys(templateWithExamples.exampleValues || {});
				expect(exampleKeys.length).toBeGreaterThan(0);
			});
		});

		it('should have all 7 templates with exampleValues', () => {
			const templatesWithExamples = DRAW_STEEL_ENTITY_TEMPLATES.filter((template) => {
				const t = template as TemplateWithExamples;
				return t.exampleValues && Object.keys(t.exampleValues).length > 0;
			});

			expect(templatesWithExamples.length).toBe(7);
		});
	});

	// =============================================================================
	// Field Coverage Tests - All Fields Have Examples
	// =============================================================================

	describe('Field Coverage - Example Values Match Template Fields', () => {
		it('should have example values for all field keys in each template', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const fieldKeys = template.template.fieldDefinitions.map((f) => f.key);
				const exampleKeys = Object.keys(templateWithExamples.exampleValues || {});

				// All field keys should have corresponding examples
				fieldKeys.forEach((fieldKey) => {
					expect(exampleKeys).toContain(fieldKey);
				});
			});
		});

		it('should not have extra example keys that are not in field definitions', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const fieldKeys = template.template.fieldDefinitions.map((f) => f.key);
				const exampleKeys = Object.keys(templateWithExamples.exampleValues || {});

				// All example keys should match field keys
				exampleKeys.forEach((exampleKey) => {
					expect(fieldKeys).toContain(exampleKey);
				});
			});
		});

		it('should have example values count matching field definitions count', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const fieldCount = template.template.fieldDefinitions.length;
				const exampleCount = Object.keys(templateWithExamples.exampleValues || {}).length;

				expect(exampleCount).toBe(fieldCount);
			});
		});
	});

	// =============================================================================
	// Value Quality Tests - Meaningful Examples
	// =============================================================================

	describe('Value Quality - Examples Are Meaningful', () => {
		it('should have non-null example values for all fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				Object.entries(exampleValues).forEach(([key, value]) => {
					// Value should be defined (can be false, 0, empty array, but not null/undefined)
					expect(value).toBeDefined();
				});
			});
		});

		it('should have non-empty string values for text/textarea/richtext fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (
						field.type === 'text' ||
						field.type === 'textarea' ||
						field.type === 'richtext'
					) {
						const value = exampleValues[field.key];
						expect(typeof value).toBe('string');
						expect((value as string).trim().length).toBeGreaterThan(0);
					}
				});
			});
		});

		it('should have meaningful example text (not just placeholders)', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (
						field.type === 'text' ||
						field.type === 'textarea' ||
						field.type === 'richtext'
					) {
						const value = exampleValues[field.key] as string;
						const lowerValue = value.toLowerCase();

						// Should not be generic placeholders
						expect(lowerValue).not.toMatch(/^placeholder$/);
						expect(lowerValue).not.toMatch(/^example$/);
						expect(lowerValue).not.toMatch(/^sample$/);
						expect(lowerValue).not.toMatch(/^test$/);
						expect(lowerValue).not.toMatch(/^todo$/);
						expect(lowerValue).not.toMatch(/^tbd$/);
						expect(lowerValue).not.toMatch(/^xxx$/);
					}
				});
			});
		});

		it('should have valid numbers for number fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'number') {
						const value = exampleValues[field.key];
						expect(typeof value).toBe('number');
						expect(Number.isFinite(value)).toBe(true);
						expect(Number.isNaN(value)).toBe(false);
					}
				});
			});
		});

		it('should have boolean values for boolean fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'boolean') {
						const value = exampleValues[field.key];
						expect(typeof value).toBe('boolean');
					}
				});
			});
		});

		it('should have valid option values for select fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'select' && field.options) {
						const value = exampleValues[field.key];
						expect(typeof value).toBe('string');
						expect(field.options).toContain(value);
					}
				});
			});
		});

		it('should have valid array of options for multi-select fields', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'multi-select' && field.options) {
						const value = exampleValues[field.key];
						expect(Array.isArray(value)).toBe(true);
						expect((value as unknown[]).length).toBeGreaterThan(0);

						// All values should be valid options
						(value as string[]).forEach((selectedValue) => {
							expect(field.options).toContain(selectedValue);
						});
					}
				});
			});
		});
	});

	// =============================================================================
	// Template 1: Monster/Threat Example Values
	// =============================================================================

	describe('Monster/Threat Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-monster-threat'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have threat_level example from valid options', () => {
			const value = template.exampleValues?.threat_level;
			expect(value).toBeDefined();
			expect(['minion', 'standard', 'boss']).toContain(value);
		});

		it('should have role example from valid options', () => {
			const value = template.exampleValues?.role;
			expect(value).toBeDefined();
			expect(['ambusher', 'brute', 'defender', 'hexer', 'striker', 'support']).toContain(
				value
			);
		});

		it('should have numeric AC example', () => {
			const value = template.exampleValues?.ac;
			expect(typeof value).toBe('number');
			expect(value as number).toBeGreaterThan(0);
			expect(value as number).toBeLessThan(30); // Reasonable AC range
		});

		it('should have numeric HP example', () => {
			const value = template.exampleValues?.hp;
			expect(typeof value).toBe('number');
			expect(value as number).toBeGreaterThan(0);
			expect(value as number).toBeLessThan(1000); // Reasonable HP range
		});

		it('should have numeric movement example', () => {
			const value = template.exampleValues?.movement;
			expect(typeof value).toBe('number');
			expect(value as number).toBeGreaterThan(0);
			expect(value as number).toBeLessThan(20); // Reasonable movement range
		});

		it('should have meaningful abilities text example', () => {
			const value = template.exampleValues?.abilities;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);

			// Should describe actual abilities, not placeholders
			const lowerValue = (value as string).toLowerCase();
			expect(lowerValue).not.toBe('abilities');
			expect(lowerValue).not.toBe('tbd');
		});
	});

	// =============================================================================
	// Template 2: Ability/Power Example Values
	// =============================================================================

	describe('Ability/Power Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-ability-power'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have action_cost example from valid options', () => {
			const value = template.exampleValues?.action_cost;
			expect(value).toBeDefined();
			expect(['action', 'maneuver', 'triggered']).toContain(value);
		});

		it('should have heroic_resource_cost example', () => {
			const value = template.exampleValues?.heroic_resource_cost;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have damage_formula example', () => {
			const value = template.exampleValues?.damage_formula;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);

			// Should look like a formula (contain numbers or dice notation)
			const valueStr = value as string;
			const hasDiceOrNumbers = /\d|d\d/.test(valueStr);
			expect(hasDiceOrNumbers).toBe(true);
		});

		it('should have range example from valid options', () => {
			const value = template.exampleValues?.range;
			expect(value).toBeDefined();
			expect(['melee', 'ranged-5', 'ranged-10', 'self', 'special']).toContain(value);
		});

		it('should have targets example from valid options', () => {
			const value = template.exampleValues?.targets;
			expect(value).toBeDefined();
			expect(['single', 'burst-1', 'burst-2', 'line', 'cube', 'wall']).toContain(value);
		});
	});

	// =============================================================================
	// Template 3: Condition Example Values
	// =============================================================================

	describe('Condition Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-condition'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have duration example', () => {
			const value = template.exampleValues?.duration;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have stacking boolean example', () => {
			const value = template.exampleValues?.stacking;
			expect(typeof value).toBe('boolean');
		});

		it('should have meaningful description example', () => {
			const value = template.exampleValues?.description;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have meaningful effect_text example', () => {
			const value = template.exampleValues?.effect_text;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});
	});

	// =============================================================================
	// Template 4: Negotiation Outcome Example Values
	// =============================================================================

	describe('Negotiation Outcome Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-negotiation-outcome'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have position_shift example from valid options', () => {
			const value = template.exampleValues?.position_shift;
			expect(value).toBeDefined();
			expect(['hostile', 'unfavorable', 'neutral', 'favorable', 'friendly']).toContain(
				value
			);
		});

		it('should have morale_impact example', () => {
			const value = template.exampleValues?.morale_impact;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have treaty_terms example', () => {
			const value = template.exampleValues?.treaty_terms;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});
	});

	// =============================================================================
	// Template 5: Spell/Ritual Example Values
	// =============================================================================

	describe('Spell/Ritual Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-spell-ritual'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have numeric level example', () => {
			const value = template.exampleValues?.level;
			expect(typeof value).toBe('number');
			expect(value as number).toBeGreaterThanOrEqual(0);
			expect(value as number).toBeLessThanOrEqual(9); // Standard spell levels 0-9
		});

		it('should have schools multi-select example', () => {
			const value = template.exampleValues?.schools;
			expect(Array.isArray(value)).toBe(true);
			expect((value as unknown[]).length).toBeGreaterThan(0);

			const validSchools = [
				'abjuration',
				'conjuration',
				'divination',
				'enchantment',
				'evocation',
				'illusion',
				'necromancy',
				'transmutation'
			];

			(value as string[]).forEach((school) => {
				expect(validSchools).toContain(school);
			});
		});

		it('should have casting_time example', () => {
			const value = template.exampleValues?.casting_time;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have range example', () => {
			const value = template.exampleValues?.range;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have duration example', () => {
			const value = template.exampleValues?.duration;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});
	});

	// =============================================================================
	// Template 6: Encounter Example Values
	// =============================================================================

	describe('Encounter Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-encounter'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have encounter_name example', () => {
			const value = template.exampleValues?.encounter_name;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have difficulty example from valid options', () => {
			const value = template.exampleValues?.difficulty;
			expect(value).toBeDefined();
			expect(['trivial', 'easy', 'medium', 'hard', 'deadly']).toContain(value);
		});

		it('should have creatures example', () => {
			const value = template.exampleValues?.creatures;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have environment example', () => {
			const value = template.exampleValues?.environment;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have objectives example', () => {
			const value = template.exampleValues?.objectives;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have rewards example', () => {
			const value = template.exampleValues?.rewards;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have tactics_notes example', () => {
			const value = template.exampleValues?.tactics_notes;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});
	});

	// =============================================================================
	// Template 7: Treasure/Loot Example Values
	// =============================================================================

	describe('Treasure/Loot Template Examples', () => {
		let template: TemplateWithExamples;

		beforeEach(() => {
			template = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-treasure-loot'
			) as TemplateWithExamples;
		});

		it('should have exampleValues property', () => {
			expect(template.exampleValues).toBeDefined();
			expect(template.exampleValues).not.toBeNull();
		});

		it('should have name example', () => {
			const value = template.exampleValues?.name;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have value example', () => {
			const value = template.exampleValues?.value;
			expect(typeof value).toBe('string');
			expect((value as string).trim().length).toBeGreaterThan(0);
		});

		it('should have rarity example from valid options', () => {
			const value = template.exampleValues?.rarity;
			expect(value).toBeDefined();
			expect(['common', 'uncommon', 'rare', 'very rare', 'legendary']).toContain(value);
		});

		it('should have description example', () => {
			const value = template.exampleValues?.description;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have properties example', () => {
			const value = template.exampleValues?.properties;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});

		it('should have origin example', () => {
			const value = template.exampleValues?.origin;
			expect(typeof value).toBe('string');
			expect((value as string).length).toBeGreaterThan(10);
		});
	});

	// =============================================================================
	// Cross-Template Validation
	// =============================================================================

	describe('Cross-Template Validation', () => {
		it('should have consistent example value quality across all templates', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				// All templates should have some examples
				expect(Object.keys(exampleValues).length).toBeGreaterThan(0);

				// All examples should be defined
				Object.values(exampleValues).forEach((value) => {
					expect(value).toBeDefined();
				});
			});
		});

		it('should have examples that demonstrate realistic use cases', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					const value = exampleValues[field.key];

					// String values should be substantive
					if (typeof value === 'string') {
						expect(value.trim().length).toBeGreaterThan(0);

						// For longer text fields, expect more detailed examples
						if (
							field.type === 'textarea' ||
							field.type === 'richtext'
						) {
							expect(value.length).toBeGreaterThan(5);
						}
					}

					// Number values should be reasonable
					if (typeof value === 'number') {
						expect(Number.isFinite(value)).toBe(true);
						expect(value).toBeGreaterThanOrEqual(0);
					}

					// Array values should have content
					if (Array.isArray(value)) {
						expect(value.length).toBeGreaterThan(0);
					}
				});
			});
		});

		it('should have example values that help users understand field purpose', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				// Check that examples are contextual and helpful
				template.template.fieldDefinitions.forEach((field) => {
					const value = exampleValues[field.key];

					if (field.type === 'text' || field.type === 'textarea' || field.type === 'richtext') {
						const valueStr = value as string;

						// Examples should not be too generic
						expect(valueStr.toLowerCase()).not.toBe(field.key.toLowerCase());
						expect(valueStr.toLowerCase()).not.toBe(field.label.toLowerCase());

						// Examples should have some specificity
						expect(valueStr.trim().split(/\s+/).length).toBeGreaterThan(1);
					}
				});
			});
		});

		it('should maintain type consistency for same field types across templates', () => {
			// Collect all fields by type across all templates
			const fieldsByType: Map<FieldType, Array<{ template: string; field: string; value: unknown }>> = new Map();

			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				template.template.fieldDefinitions.forEach((field) => {
					if (!fieldsByType.has(field.type)) {
						fieldsByType.set(field.type, []);
					}
					fieldsByType.get(field.type)!.push({
						template: template.id,
						field: field.key,
						value: exampleValues[field.key]
					});
				});
			});

			// Verify type consistency
			fieldsByType.forEach((fields, fieldType) => {
				fields.forEach(({ template, field, value }) => {
					switch (fieldType) {
						case 'text':
						case 'textarea':
						case 'richtext':
							expect(typeof value).toBe('string');
							break;
						case 'number':
							expect(typeof value).toBe('number');
							break;
						case 'boolean':
							expect(typeof value).toBe('boolean');
							break;
						case 'select':
							expect(typeof value).toBe('string');
							break;
						case 'multi-select':
							expect(Array.isArray(value)).toBe(true);
							break;
					}
				});
			});
		});
	});

	// =============================================================================
	// User Experience Tests
	// =============================================================================

	describe('User Experience - Example Value Helpfulness', () => {
		it('should provide examples that are inspirational, not prescriptive', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				// Examples should be specific enough to be helpful
				// but not so generic that they feel like requirements
				Object.entries(exampleValues).forEach(([key, value]) => {
					if (typeof value === 'string') {
						// Should not contain instructional language
						const lowerValue = value.toLowerCase();
						expect(lowerValue).not.toContain('enter your');
						expect(lowerValue).not.toContain('fill in');
						expect(lowerValue).not.toContain('type here');
						expect(lowerValue).not.toContain('add description');
					}
				});
			});
		});

		it('should use Draw Steel-appropriate terminology in examples', () => {
			// Monster/Threat template should use Draw Steel terms
			const monsterTemplate = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-monster-threat'
			) as TemplateWithExamples;

			if (monsterTemplate.exampleValues?.abilities) {
				const abilities = monsterTemplate.exampleValues.abilities as string;
				// Should demonstrate Draw Steel mechanics (not D&D-specific terms)
				// This is a quality check, not strict validation
				expect(abilities.length).toBeGreaterThan(15);
			}
		});

		it('should provide examples that showcase template versatility', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;
				const exampleValues = templateWithExamples.exampleValues || {};

				// Examples should demonstrate the template's full potential
				// Check that richtext fields have substantial examples
				template.template.fieldDefinitions.forEach((field) => {
					if (field.type === 'richtext') {
						const value = exampleValues[field.key] as string;
						// Richtext examples should be detailed
						expect(value.length).toBeGreaterThan(20);
					}
				});
			});
		});
	});

	// =============================================================================
	// Integration Tests
	// =============================================================================

	describe('Integration - Template Structure Preservation', () => {
		it('should not modify existing template properties when adding exampleValues', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				// Verify core properties remain unchanged
				expect(template.id).toBeDefined();
				expect(template.name).toBeDefined();
				expect(template.description).toBeDefined();
				expect(template.category).toBe('draw-steel');
				expect(template.template).toBeDefined();
				expect(template.template.fieldDefinitions).toBeDefined();
			});
		});

		it('should maintain field definition integrity', () => {
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				template.template.fieldDefinitions.forEach((field) => {
					expect(field.key).toBeDefined();
					expect(field.label).toBeDefined();
					expect(field.type).toBeDefined();
					expect(field.order).toBeGreaterThan(0);
					expect(typeof field.required).toBe('boolean');
				});
			});
		});

		it('should be compatible with TypeScript type system', () => {
			// This test validates that exampleValues can be typed properly
			DRAW_STEEL_ENTITY_TEMPLATES.forEach((template) => {
				const templateWithExamples = template as TemplateWithExamples;

				// Should be able to access exampleValues without type errors
				const examples: ExampleValues | undefined = templateWithExamples.exampleValues;

				if (examples) {
					expect(typeof examples).toBe('object');
				}
			});
		});
	});
});
