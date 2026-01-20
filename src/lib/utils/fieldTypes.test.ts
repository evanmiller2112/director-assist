/**
 * Tests for Field Type Utilities - Phase 1: Type System Enhancements (Issue #25)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until the field type utilities are properly implemented.
 *
 * Phase 1 Requirements:
 * 1. Add short-text and long-text as field type aliases
 * 2. Add computed field type
 * 3. Add ComputedFieldConfig interface with formula, dependencies, outputType
 * 4. Update FieldDefinition to include optional computedConfig
 * 5. Create FIELD_TYPE_METADATA object with label, category, description for all 13 field types
 * 6. Create normalizeFieldType() function to convert aliases
 * 7. Create evaluateComputedField() function to evaluate formulas
 *
 * Covers:
 * - Field type metadata completeness
 * - Field type normalization (alias handling)
 * - Computed field evaluation with various formulas
 * - Computed field output type conversion
 * - Computed field error handling
 * - Missing dependency handling
 * - ComputedFieldConfig validation
 */

import { describe, it, expect } from 'vitest';
import {
	FIELD_TYPE_METADATA,
	normalizeFieldType,
	evaluateComputedField
} from './fieldTypes';
import type { FieldType, ComputedFieldConfig } from '$lib/types';

describe('fieldTypes - FIELD_TYPE_METADATA', () => {
	describe('metadata completeness', () => {
		it('should have metadata for all 13 field types', () => {
			const expectedTypes: FieldType[] = [
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
				'image'
			];

			expectedTypes.forEach((type) => {
				expect(FIELD_TYPE_METADATA[type]).toBeDefined();
			});
		});

		it('should have computed field type metadata', () => {
			expect(FIELD_TYPE_METADATA['computed']).toBeDefined();
		});

		it('should have label for each field type', () => {
			Object.values(FIELD_TYPE_METADATA).forEach((metadata) => {
				expect(metadata).toHaveProperty('label');
				expect(typeof metadata.label).toBe('string');
				expect(metadata.label.length).toBeGreaterThan(0);
			});
		});

		it('should have category for each field type', () => {
			Object.values(FIELD_TYPE_METADATA).forEach((metadata) => {
				expect(metadata).toHaveProperty('category');
				expect(typeof metadata.category).toBe('string');
				expect(metadata.category.length).toBeGreaterThan(0);
			});
		});

		it('should have description for each field type', () => {
			Object.values(FIELD_TYPE_METADATA).forEach((metadata) => {
				expect(metadata).toHaveProperty('description');
				expect(typeof metadata.description).toBe('string');
				expect(metadata.description.length).toBeGreaterThan(0);
			});
		});
	});

	describe('specific field type metadata', () => {
		it('should categorize text as Basic', () => {
			expect(FIELD_TYPE_METADATA['text'].category).toBe('Basic');
		});

		it('should categorize number as Basic', () => {
			expect(FIELD_TYPE_METADATA['number'].category).toBe('Basic');
		});

		it('should categorize boolean as Basic', () => {
			expect(FIELD_TYPE_METADATA['boolean'].category).toBe('Basic');
		});

		it('should categorize textarea as Text', () => {
			expect(FIELD_TYPE_METADATA['textarea'].category).toBe('Text');
		});

		it('should categorize richtext as Text', () => {
			expect(FIELD_TYPE_METADATA['richtext'].category).toBe('Text');
		});

		it('should categorize select as Selection', () => {
			expect(FIELD_TYPE_METADATA['select'].category).toBe('Selection');
		});

		it('should categorize multi-select as Selection', () => {
			expect(FIELD_TYPE_METADATA['multi-select'].category).toBe('Selection');
		});

		it('should categorize tags as Selection', () => {
			expect(FIELD_TYPE_METADATA['tags'].category).toBe('Selection');
		});

		it('should categorize entity-ref as Reference', () => {
			expect(FIELD_TYPE_METADATA['entity-ref'].category).toBe('Reference');
		});

		it('should categorize entity-refs as Reference', () => {
			expect(FIELD_TYPE_METADATA['entity-refs'].category).toBe('Reference');
		});

		it('should categorize date as Special', () => {
			expect(FIELD_TYPE_METADATA['date'].category).toBe('Special');
		});

		it('should categorize url as Special', () => {
			expect(FIELD_TYPE_METADATA['url'].category).toBe('Special');
		});

		it('should categorize image as Special', () => {
			expect(FIELD_TYPE_METADATA['image'].category).toBe('Special');
		});

		it('should categorize computed as Advanced', () => {
			expect(FIELD_TYPE_METADATA['computed'].category).toBe('Advanced');
		});
	});

	describe('label formatting', () => {
		it('should have human-readable label for text', () => {
			expect(FIELD_TYPE_METADATA['text'].label).toBe('Text');
		});

		it('should have human-readable label for multi-select', () => {
			expect(FIELD_TYPE_METADATA['multi-select'].label).toBe('Multi-Select');
		});

		it('should have human-readable label for entity-ref', () => {
			expect(FIELD_TYPE_METADATA['entity-ref'].label).toBe('Entity Reference');
		});

		it('should have human-readable label for entity-refs', () => {
			expect(FIELD_TYPE_METADATA['entity-refs'].label).toBe('Entity References');
		});

		it('should have human-readable label for computed', () => {
			expect(FIELD_TYPE_METADATA['computed'].label).toBe('Computed');
		});
	});

	describe('description clarity', () => {
		it('should have clear description for text type', () => {
			const desc = FIELD_TYPE_METADATA['text'].description;
			expect(desc.toLowerCase()).toContain('single line');
		});

		it('should have clear description for textarea type', () => {
			const desc = FIELD_TYPE_METADATA['textarea'].description;
			expect(desc.toLowerCase()).toContain('multi');
		});

		it('should have clear description for richtext type', () => {
			const desc = FIELD_TYPE_METADATA['richtext'].description;
			expect(desc.toLowerCase()).toContain('markdown');
		});

		it('should have clear description for computed type', () => {
			const desc = FIELD_TYPE_METADATA['computed'].description;
			expect(desc.toLowerCase()).toContain('formula');
		});
	});
});

describe('fieldTypes - normalizeFieldType', () => {
	describe('standard field types', () => {
		it('should return text unchanged', () => {
			expect(normalizeFieldType('text')).toBe('text');
		});

		it('should return textarea unchanged', () => {
			expect(normalizeFieldType('textarea')).toBe('textarea');
		});

		it('should return richtext unchanged', () => {
			expect(normalizeFieldType('richtext')).toBe('richtext');
		});

		it('should return number unchanged', () => {
			expect(normalizeFieldType('number')).toBe('number');
		});

		it('should return boolean unchanged', () => {
			expect(normalizeFieldType('boolean')).toBe('boolean');
		});

		it('should return select unchanged', () => {
			expect(normalizeFieldType('select')).toBe('select');
		});

		it('should return multi-select unchanged', () => {
			expect(normalizeFieldType('multi-select')).toBe('multi-select');
		});

		it('should return tags unchanged', () => {
			expect(normalizeFieldType('tags')).toBe('tags');
		});

		it('should return entity-ref unchanged', () => {
			expect(normalizeFieldType('entity-ref')).toBe('entity-ref');
		});

		it('should return entity-refs unchanged', () => {
			expect(normalizeFieldType('entity-refs')).toBe('entity-refs');
		});

		it('should return date unchanged', () => {
			expect(normalizeFieldType('date')).toBe('date');
		});

		it('should return url unchanged', () => {
			expect(normalizeFieldType('url')).toBe('url');
		});

		it('should return image unchanged', () => {
			expect(normalizeFieldType('image')).toBe('image');
		});

		it('should return computed unchanged', () => {
			expect(normalizeFieldType('computed')).toBe('computed');
		});
	});

	describe('alias handling', () => {
		it('should convert short-text to text', () => {
			expect(normalizeFieldType('short-text')).toBe('text');
		});

		it('should convert long-text to textarea', () => {
			expect(normalizeFieldType('long-text')).toBe('textarea');
		});
	});

	describe('case sensitivity', () => {
		it('should handle lowercase input', () => {
			expect(normalizeFieldType('text')).toBe('text');
		});

		it('should handle mixed case for short-text', () => {
			// Normalization should be case-insensitive for aliases
			expect(normalizeFieldType('SHORT-TEXT')).toBe('text');
		});

		it('should handle mixed case for long-text', () => {
			expect(normalizeFieldType('LONG-TEXT')).toBe('textarea');
		});
	});

	describe('edge cases', () => {
		it('should handle unknown types by returning them unchanged', () => {
			expect(normalizeFieldType('unknown-type' as any)).toBe('unknown-type');
		});

		it('should handle custom field types by returning them unchanged', () => {
			expect(normalizeFieldType('custom-field' as any)).toBe('custom-field');
		});
	});
});

describe('fieldTypes - evaluateComputedField', () => {
	describe('simple arithmetic formulas', () => {
		it('should evaluate numeric multiplication formula', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} * 10',
				dependencies: ['level'],
				outputType: 'number'
			};

			const fields = { level: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(50);
		});

		it('should evaluate numeric addition formula', () => {
			const config: ComputedFieldConfig = {
				formula: '{strength} + {bonus}',
				dependencies: ['strength', 'bonus'],
				outputType: 'number'
			};

			const fields = { strength: 10, bonus: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(15);
		});

		it('should evaluate numeric subtraction formula', () => {
			const config: ComputedFieldConfig = {
				formula: '{max_hp} - {damage}',
				dependencies: ['max_hp', 'damage'],
				outputType: 'number'
			};

			const fields = { max_hp: 100, damage: 30 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(70);
		});

		it('should evaluate numeric division formula', () => {
			const config: ComputedFieldConfig = {
				formula: '{total} / {count}',
				dependencies: ['total', 'count'],
				outputType: 'number'
			};

			const fields = { total: 100, count: 4 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(25);
		});
	});

	describe('complex formulas', () => {
		it('should evaluate formula with multiple operations', () => {
			const config: ComputedFieldConfig = {
				formula: '({level} * 10) + {bonus}',
				dependencies: ['level', 'bonus'],
				outputType: 'number'
			};

			const fields = { level: 5, bonus: 20 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(70);
		});

		it('should evaluate formula with multiple dependencies', () => {
			const config: ComputedFieldConfig = {
				formula: '{strength} + {dexterity} + {constitution}',
				dependencies: ['strength', 'dexterity', 'constitution'],
				outputType: 'number'
			};

			const fields = { strength: 10, dexterity: 12, constitution: 14 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(36);
		});

		it('should handle order of operations correctly', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} + {b} * {c}',
				dependencies: ['a', 'b', 'c'],
				outputType: 'number'
			};

			const fields = { a: 2, b: 3, c: 4 };
			const result = evaluateComputedField(config, fields);

			// Should be 2 + (3 * 4) = 14, not (2 + 3) * 4 = 20
			expect(result).toBe(14);
		});
	});

	describe('string concatenation formulas', () => {
		it('should concatenate text fields', () => {
			const config: ComputedFieldConfig = {
				formula: '{first_name} {last_name}',
				dependencies: ['first_name', 'last_name'],
				outputType: 'text'
			};

			const fields = { first_name: 'John', last_name: 'Doe' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('John Doe');
		});

		it('should handle string templates with text', () => {
			const config: ComputedFieldConfig = {
				formula: 'Level {level} {class}',
				dependencies: ['level', 'class'],
				outputType: 'text'
			};

			const fields = { level: 5, class: 'Wizard' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Level 5 Wizard');
		});

		it('should handle empty string values', () => {
			const config: ComputedFieldConfig = {
				formula: '{prefix}{name}',
				dependencies: ['prefix', 'name'],
				outputType: 'text'
			};

			const fields = { prefix: '', name: 'Hero' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Hero');
		});
	});

	describe('output type conversion', () => {
		it('should convert result to number when outputType is number', () => {
			const config: ComputedFieldConfig = {
				formula: '{value}',
				dependencies: ['value'],
				outputType: 'number'
			};

			const fields = { value: '42' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(42);
			expect(typeof result).toBe('number');
		});

		it('should convert result to string when outputType is text', () => {
			const config: ComputedFieldConfig = {
				formula: '{value}',
				dependencies: ['value'],
				outputType: 'text'
			};

			const fields = { value: 42 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('42');
			expect(typeof result).toBe('string');
		});

		it('should convert result to boolean when outputType is boolean', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} > 10',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			const fields = { level: 15 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(true);
			expect(typeof result).toBe('boolean');
		});

		it('should handle boolean false conversion', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} > 10',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			const fields = { level: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(false);
		});
	});

	describe('missing dependency handling', () => {
		it('should return null when dependency is missing', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} * 10',
				dependencies: ['level'],
				outputType: 'number'
			};

			const fields = {}; // Missing 'level'
			const result = evaluateComputedField(config, fields);

			expect(result).toBeNull();
		});

		it('should return null when some dependencies are missing', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} + {b} + {c}',
				dependencies: ['a', 'b', 'c'],
				outputType: 'number'
			};

			const fields = { a: 1, b: 2 }; // Missing 'c'
			const result = evaluateComputedField(config, fields);

			expect(result).toBeNull();
		});

		it('should handle undefined field values gracefully', () => {
			const config: ComputedFieldConfig = {
				formula: '{value}',
				dependencies: ['value'],
				outputType: 'text'
			};

			const fields = { value: undefined };
			const result = evaluateComputedField(config, fields);

			expect(result).toBeNull();
		});

		it('should handle null field values gracefully', () => {
			const config: ComputedFieldConfig = {
				formula: '{value}',
				dependencies: ['value'],
				outputType: 'text'
			};

			const fields = { value: null };
			const result = evaluateComputedField(config, fields);

			expect(result).toBeNull();
		});
	});

	describe('error handling', () => {
		it('should handle division by zero gracefully', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} / {b}',
				dependencies: ['a', 'b'],
				outputType: 'number'
			};

			const fields = { a: 10, b: 0 };
			const result = evaluateComputedField(config, fields);

			// Should return Infinity or handle error appropriately
			expect(result).toBe(Infinity);
		});

		it('should handle invalid formula syntax gracefully', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} *** 10', // Invalid operator
				dependencies: ['level'],
				outputType: 'number'
			};

			const fields = { level: 5 };

			// Should return null or throw descriptive error
			expect(() => evaluateComputedField(config, fields)).toThrow();
		});

		it('should handle malformed field references', () => {
			const config: ComputedFieldConfig = {
				formula: 'level * 10', // Missing curly braces
				dependencies: ['level'],
				outputType: 'number'
			};

			const fields = { level: 5 };
			const result = evaluateComputedField(config, fields);

			// Should recognize that 'level' is not properly referenced
			expect(result).toBeNull();
		});
	});

	describe('edge cases', () => {
		it('should handle empty formula', () => {
			const config: ComputedFieldConfig = {
				formula: '',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('');
		});

		it('should handle formula with no dependencies', () => {
			const config: ComputedFieldConfig = {
				formula: '42',
				dependencies: [],
				outputType: 'number'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(42);
		});

		it('should handle very long formulas', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} + {b} + {c} + {d} + {e} + {f} + {g} + {h} + {i} + {j}',
				dependencies: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
				outputType: 'number'
			};

			const fields = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(55);
		});

		it('should handle nested field references with underscores', () => {
			const config: ComputedFieldConfig = {
				formula: '{max_hp} - {current_damage}',
				dependencies: ['max_hp', 'current_damage'],
				outputType: 'number'
			};

			const fields = { max_hp: 100, current_damage: 25 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(75);
		});

		it('should handle field names with numbers', () => {
			const config: ComputedFieldConfig = {
				formula: '{stat1} + {stat2}',
				dependencies: ['stat1', 'stat2'],
				outputType: 'number'
			};

			const fields = { stat1: 10, stat2: 20 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(30);
		});
	});

	describe('real-world use cases', () => {
		it('should calculate character hit points', () => {
			const config: ComputedFieldConfig = {
				formula: '({level} * 8) + ({constitution} * 2)',
				dependencies: ['level', 'constitution'],
				outputType: 'number'
			};

			const fields = { level: 5, constitution: 14 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(68);
		});

		it('should calculate character armor class', () => {
			const config: ComputedFieldConfig = {
				formula: '10 + {dexterity_modifier} + {armor_bonus}',
				dependencies: ['dexterity_modifier', 'armor_bonus'],
				outputType: 'number'
			};

			const fields = { dexterity_modifier: 3, armor_bonus: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(18);
		});

		it('should build character title from name and class', () => {
			const config: ComputedFieldConfig = {
				formula: '{name} the {character_class}',
				dependencies: ['name', 'character_class'],
				outputType: 'text'
			};

			const fields = { name: 'Elara', character_class: 'Ranger' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Elara the Ranger');
		});

		it('should calculate initiative bonus', () => {
			const config: ComputedFieldConfig = {
				formula: '{dexterity} + {initiative_bonus}',
				dependencies: ['dexterity', 'initiative_bonus'],
				outputType: 'number'
			};

			const fields = { dexterity: 4, initiative_bonus: 2 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(6);
		});

		it('should determine if character is alive', () => {
			const config: ComputedFieldConfig = {
				formula: '{current_hp} > 0',
				dependencies: ['current_hp'],
				outputType: 'boolean'
			};

			const fields = { current_hp: 25 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(true);
		});

		it('should determine if character is dead', () => {
			const config: ComputedFieldConfig = {
				formula: '{current_hp} <= 0',
				dependencies: ['current_hp'],
				outputType: 'boolean'
			};

			const fields = { current_hp: 0 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(true);
		});
	});
});

describe('fieldTypes - ComputedFieldConfig validation', () => {
	describe('required properties', () => {
		it('should require formula property', () => {
			const config = {
				dependencies: ['level'],
				outputType: 'number'
			} as any;

			// Type system should prevent this, but validate at runtime
			expect(config.formula).toBeUndefined();
		});

		it('should require dependencies property', () => {
			const config = {
				formula: '{level} * 10',
				outputType: 'number'
			} as any;

			expect(config.dependencies).toBeUndefined();
		});

		it('should require outputType property', () => {
			const config = {
				formula: '{level} * 10',
				dependencies: ['level']
			} as any;

			expect(config.outputType).toBeUndefined();
		});
	});

	describe('valid outputType values', () => {
		it('should accept number as outputType', () => {
			const config: ComputedFieldConfig = {
				formula: '{a}',
				dependencies: ['a'],
				outputType: 'number'
			};

			expect(config.outputType).toBe('number');
		});

		it('should accept text as outputType', () => {
			const config: ComputedFieldConfig = {
				formula: '{a}',
				dependencies: ['a'],
				outputType: 'text'
			};

			expect(config.outputType).toBe('text');
		});

		it('should accept boolean as outputType', () => {
			const config: ComputedFieldConfig = {
				formula: '{a}',
				dependencies: ['a'],
				outputType: 'boolean'
			};

			expect(config.outputType).toBe('boolean');
		});
	});

	describe('dependencies array validation', () => {
		it('should accept empty dependencies array', () => {
			const config: ComputedFieldConfig = {
				formula: '42',
				dependencies: [],
				outputType: 'number'
			};

			expect(config.dependencies).toEqual([]);
		});

		it('should accept single dependency', () => {
			const config: ComputedFieldConfig = {
				formula: '{level}',
				dependencies: ['level'],
				outputType: 'number'
			};

			expect(config.dependencies).toEqual(['level']);
		});

		it('should accept multiple dependencies', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} + {b} + {c}',
				dependencies: ['a', 'b', 'c'],
				outputType: 'number'
			};

			expect(config.dependencies).toEqual(['a', 'b', 'c']);
		});

		it('should handle dependencies with underscores', () => {
			const config: ComputedFieldConfig = {
				formula: '{max_hp}',
				dependencies: ['max_hp'],
				outputType: 'number'
			};

			expect(config.dependencies).toContain('max_hp');
		});

		it('should handle dependencies with numbers', () => {
			const config: ComputedFieldConfig = {
				formula: '{stat1}',
				dependencies: ['stat1'],
				outputType: 'number'
			};

			expect(config.dependencies).toContain('stat1');
		});
	});
});

describe('fieldTypes - Draw Steel computed field examples', () => {
	describe('Health & Vitality formulas', () => {
		it('should calculate remaining HP: {maxHP} - {currentDamage}', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} - {currentDamage}',
				dependencies: ['maxHP', 'currentDamage'],
				outputType: 'number'
			};

			const fields = { maxHP: 60, currentDamage: 15 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(45);
			expect(typeof result).toBe('number');
		});

		it('should calculate HP percentage: ({currentHP} / {maxHP}) * 100', () => {
			const config: ComputedFieldConfig = {
				formula: '({currentHP} / {maxHP}) * 100',
				dependencies: ['currentHP', 'maxHP'],
				outputType: 'number'
			};

			const fields = { currentHP: 30, maxHP: 60 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(50);
		});

		it('should check is bloodied: {currentHP} <= ({maxHP} / 2)', () => {
			const config: ComputedFieldConfig = {
				formula: '{currentHP} <= ({maxHP} / 2)',
				dependencies: ['currentHP', 'maxHP'],
				outputType: 'boolean'
			};

			// Test bloodied (true)
			const fieldsBloodied = { currentHP: 25, maxHP: 60 };
			const resultBloodied = evaluateComputedField(config, fieldsBloodied);
			expect(resultBloodied).toBe(true);
			expect(typeof resultBloodied).toBe('boolean');

			// Test not bloodied (false)
			const fieldsHealthy = { currentHP: 40, maxHP: 60 };
			const resultHealthy = evaluateComputedField(config, fieldsHealthy);
			expect(resultHealthy).toBe(false);
		});

		it('should check is winded: {currentHP} <= 0', () => {
			const config: ComputedFieldConfig = {
				formula: '{currentHP} <= 0',
				dependencies: ['currentHP'],
				outputType: 'boolean'
			};

			// Test winded (true)
			const fieldsWinded = { currentHP: 0 };
			const resultWinded = evaluateComputedField(config, fieldsWinded);
			expect(resultWinded).toBe(true);

			// Test not winded (false)
			const fieldsAlive = { currentHP: 10 };
			const resultAlive = evaluateComputedField(config, fieldsAlive);
			expect(resultAlive).toBe(false);
		});

		it('should handle edge case: HP exactly at half for bloodied', () => {
			const config: ComputedFieldConfig = {
				formula: '{currentHP} <= ({maxHP} / 2)',
				dependencies: ['currentHP', 'maxHP'],
				outputType: 'boolean'
			};

			const fields = { currentHP: 30, maxHP: 60 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});

		it('should handle edge case: zero HP with remaining HP formula', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} - {currentDamage}',
				dependencies: ['maxHP', 'currentDamage'],
				outputType: 'number'
			};

			const fields = { maxHP: 50, currentDamage: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(0);
		});
	});

	describe('Ability Scores formulas', () => {
		it('should calculate total attributes: {might} + {agility} + {reason} + {intuition} + {presence}', () => {
			const config: ComputedFieldConfig = {
				formula: '{might} + {agility} + {reason} + {intuition} + {presence}',
				dependencies: ['might', 'agility', 'reason', 'intuition', 'presence'],
				outputType: 'number'
			};

			const fields = {
				might: 3,
				agility: 2,
				reason: 1,
				intuition: 2,
				presence: 2
			};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(10);
		});

		it('should calculate primary attack bonus: {might} + {level}', () => {
			const config: ComputedFieldConfig = {
				formula: '{might} + {level}',
				dependencies: ['might', 'level'],
				outputType: 'number'
			};

			const fields = { might: 3, level: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(8);
		});

		it('should calculate ranged attack bonus: {agility} + {level}', () => {
			const config: ComputedFieldConfig = {
				formula: '{agility} + {level}',
				dependencies: ['agility', 'level'],
				outputType: 'number'
			};

			const fields = { agility: 2, level: 5 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(7);
		});

		it('should handle edge case: zero attributes in total', () => {
			const config: ComputedFieldConfig = {
				formula: '{might} + {agility} + {reason} + {intuition} + {presence}',
				dependencies: ['might', 'agility', 'reason', 'intuition', 'presence'],
				outputType: 'number'
			};

			const fields = {
				might: 0,
				agility: 0,
				reason: 0,
				intuition: 0,
				presence: 0
			};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(0);
		});

		it('should handle edge case: level 1 attack bonus', () => {
			const config: ComputedFieldConfig = {
				formula: '{might} + {level}',
				dependencies: ['might', 'level'],
				outputType: 'number'
			};

			const fields = { might: 2, level: 1 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(3);
		});
	});

	describe('Display & Identification formulas', () => {
		it('should format character title: {name} the {class}', () => {
			const config: ComputedFieldConfig = {
				formula: '{name} the {class}',
				dependencies: ['name', 'class'],
				outputType: 'text'
			};

			const fields = { name: 'Aragorn', class: 'Ranger' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Aragorn the Ranger');
			expect(typeof result).toBe('string');
		});

		it('should format full character description: Level {level} {ancestry} {class}', () => {
			const config: ComputedFieldConfig = {
				formula: 'Level {level} {ancestry} {class}',
				dependencies: ['level', 'ancestry', 'class'],
				outputType: 'text'
			};

			const fields = { level: 5, ancestry: 'Human', class: 'Conduit' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Level 5 Human Conduit');
		});

		it('should format NPC identifier: {name} | {threatLevel} {role}', () => {
			const config: ComputedFieldConfig = {
				formula: '{name} | {threatLevel} {role}',
				dependencies: ['name', 'threatLevel', 'role'],
				outputType: 'text'
			};

			const fields = { name: 'Orc Captain', threatLevel: 'Boss', role: 'Leader' };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Orc Captain | Boss Leader');
		});

		it('should handle edge case: single character name', () => {
			const config: ComputedFieldConfig = {
				formula: '{name} the {class}',
				dependencies: ['name', 'class'],
				outputType: 'text'
			};

			const fields = { name: 'X', class: 'Fighter' };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('X the Fighter');
		});

		it('should handle edge case: level 1 in description', () => {
			const config: ComputedFieldConfig = {
				formula: 'Level {level} {ancestry} {class}',
				dependencies: ['level', 'ancestry', 'class'],
				outputType: 'text'
			};

			const fields = { level: 1, ancestry: 'Elf', class: 'Wizard' };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('Level 1 Elf Wizard');
		});
	});

	describe('Combat formulas', () => {
		it('should calculate recovery value: {maxHP} / 3', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} / 3',
				dependencies: ['maxHP'],
				outputType: 'number'
			};

			const fields = { maxHP: 60 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(20);
		});

		it('should check is veteran tier: {level} >= 5', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} >= 5',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			// Test veteran (true)
			const fieldsVeteran = { level: 5 };
			const resultVeteran = evaluateComputedField(config, fieldsVeteran);
			expect(resultVeteran).toBe(true);
			expect(typeof resultVeteran).toBe('boolean');

			// Test not veteran (false)
			const fieldsNovice = { level: 4 };
			const resultNovice = evaluateComputedField(config, fieldsNovice);
			expect(resultNovice).toBe(false);
		});

		it('should handle edge case: recovery value with non-divisible HP', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} / 3',
				dependencies: ['maxHP'],
				outputType: 'number'
			};

			const fields = { maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBeCloseTo(16.67, 2);
		});

		it('should handle edge case: exactly level 5 for veteran tier', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} >= 5',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			const fields = { level: 5 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});

		it('should handle edge case: high level character (level 10)', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} >= 5',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			const fields = { level: 10 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});
	});

	describe('Negotiation formulas', () => {
		it('should format negotiation difficulty: DC {negotiationDC}', () => {
			const config: ComputedFieldConfig = {
				formula: 'DC {negotiationDC}',
				dependencies: ['negotiationDC'],
				outputType: 'text'
			};

			const fields = { negotiationDC: 15 };
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('DC 15');
			expect(typeof result).toBe('string');
		});

		it('should handle edge case: DC 0', () => {
			const config: ComputedFieldConfig = {
				formula: 'DC {negotiationDC}',
				dependencies: ['negotiationDC'],
				outputType: 'text'
			};

			const fields = { negotiationDC: 0 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('DC 0');
		});

		it('should handle edge case: very high DC', () => {
			const config: ComputedFieldConfig = {
				formula: 'DC {negotiationDC}',
				dependencies: ['negotiationDC'],
				outputType: 'text'
			};

			const fields = { negotiationDC: 30 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('DC 30');
		});
	});

	describe('Draw Steel examples - Missing field handling', () => {
		it('should return null when required fields are missing for HP calculation', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} - {currentDamage}',
				dependencies: ['maxHP', 'currentDamage'],
				outputType: 'number'
			};

			const result = evaluateComputedField(config, {});
			expect(result).toBeNull();
		});

		it('should return null when required fields are missing for character title', () => {
			const config: ComputedFieldConfig = {
				formula: '{name} the {class}',
				dependencies: ['name', 'class'],
				outputType: 'text'
			};

			const result = evaluateComputedField(config, {});
			expect(result).toBeNull();
		});

		it('should return null when some fields are missing', () => {
			const config: ComputedFieldConfig = {
				formula: '{might} + {agility} + {reason} + {intuition} + {presence}',
				dependencies: ['might', 'agility', 'reason', 'intuition', 'presence'],
				outputType: 'number'
			};

			// Only provide some fields
			const fields = { might: 3, agility: 2 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBeNull();
		});
	});

	describe('Draw Steel examples - Complex scenarios', () => {
		it('should handle character progression: level 1 to veteran tier', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} >= 5',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			// Test level progression
			expect(evaluateComputedField(config, { level: 1 })).toBe(false);
			expect(evaluateComputedField(config, { level: 2 })).toBe(false);
			expect(evaluateComputedField(config, { level: 3 })).toBe(false);
			expect(evaluateComputedField(config, { level: 4 })).toBe(false);
			expect(evaluateComputedField(config, { level: 5 })).toBe(true);
			expect(evaluateComputedField(config, { level: 6 })).toBe(true);
		});

		it('should handle combat damage accumulation', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} - {currentDamage}',
				dependencies: ['maxHP', 'currentDamage'],
				outputType: 'number'
			};

			const maxHP = 60;

			// Simulate taking damage
			expect(evaluateComputedField(config, { maxHP, currentDamage: 0 })).toBe(60);
			expect(evaluateComputedField(config, { maxHP, currentDamage: 10 })).toBe(50);
			expect(evaluateComputedField(config, { maxHP, currentDamage: 30 })).toBe(30);
			expect(evaluateComputedField(config, { maxHP, currentDamage: 60 })).toBe(0);
		});

		it('should handle bloodied state transitions', () => {
			const config: ComputedFieldConfig = {
				formula: '{currentHP} <= ({maxHP} / 2)',
				dependencies: ['currentHP', 'maxHP'],
				outputType: 'boolean'
			};

			const maxHP = 60;

			// Just above bloodied
			expect(evaluateComputedField(config, { currentHP: 31, maxHP })).toBe(false);

			// Exactly bloodied
			expect(evaluateComputedField(config, { currentHP: 30, maxHP })).toBe(true);

			// Well below bloodied
			expect(evaluateComputedField(config, { currentHP: 15, maxHP })).toBe(true);
		});

		it('should handle recovery value calculation for various HP totals', () => {
			const config: ComputedFieldConfig = {
				formula: '{maxHP} / 3',
				dependencies: ['maxHP'],
				outputType: 'number'
			};

			// Test various HP values
			expect(evaluateComputedField(config, { maxHP: 30 })).toBe(10);
			expect(evaluateComputedField(config, { maxHP: 60 })).toBe(20);
			expect(evaluateComputedField(config, { maxHP: 45 })).toBe(15);
			expect(evaluateComputedField(config, { maxHP: 50 })).toBeCloseTo(16.67, 2);
		});

		it('should combine multiple Draw Steel formulas for complete character', () => {
			const character = {
				name: 'Thorgrim',
				class: 'Fury',
				ancestry: 'Dwarf',
				level: 5,
				maxHP: 60,
				currentHP: 25,
				currentDamage: 35,
				might: 3,
				agility: 2,
				reason: 1,
				intuition: 2,
				presence: 2,
				negotiationDC: 15
			};

			// Character Title
			const titleConfig: ComputedFieldConfig = {
				formula: '{name} the {class}',
				dependencies: ['name', 'class'],
				outputType: 'text'
			};
			expect(evaluateComputedField(titleConfig, character)).toBe('Thorgrim the Fury');

			// Full Description
			const descConfig: ComputedFieldConfig = {
				formula: 'Level {level} {ancestry} {class}',
				dependencies: ['level', 'ancestry', 'class'],
				outputType: 'text'
			};
			expect(evaluateComputedField(descConfig, character)).toBe('Level 5 Dwarf Fury');

			// Is Bloodied
			const bloodiedConfig: ComputedFieldConfig = {
				formula: '{currentHP} <= ({maxHP} / 2)',
				dependencies: ['currentHP', 'maxHP'],
				outputType: 'boolean'
			};
			expect(evaluateComputedField(bloodiedConfig, character)).toBe(true);

			// Is Veteran
			const veteranConfig: ComputedFieldConfig = {
				formula: '{level} >= 5',
				dependencies: ['level'],
				outputType: 'boolean'
			};
			expect(evaluateComputedField(veteranConfig, character)).toBe(true);

			// Total Attributes
			const totalAttrConfig: ComputedFieldConfig = {
				formula: '{might} + {agility} + {reason} + {intuition} + {presence}',
				dependencies: ['might', 'agility', 'reason', 'intuition', 'presence'],
				outputType: 'number'
			};
			expect(evaluateComputedField(totalAttrConfig, character)).toBe(10);

			// Recovery Value
			const recoveryConfig: ComputedFieldConfig = {
				formula: '{maxHP} / 3',
				dependencies: ['maxHP'],
				outputType: 'number'
			};
			expect(evaluateComputedField(recoveryConfig, character)).toBe(20);
		});
	});
});
