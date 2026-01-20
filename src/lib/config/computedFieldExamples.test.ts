/**
 * Tests for Draw Steel Computed Field Examples (Issue #165)
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * Tests should FAIL until computedFieldExamples.ts is created with the 13 Draw Steel examples.
 *
 * This file tests:
 * 1. The DRAW_STEEL_EXAMPLES configuration structure
 * 2. Each of the 13 Draw Steel computed field examples
 * 3. Formula evaluation with sample data
 * 4. Edge cases (zero values, missing fields)
 * 5. Output type validation (number, text, boolean)
 *
 * Example Categories:
 * - Health & Vitality: HP calculations, bloodied/winded states
 * - Ability Scores: Total attributes, attack bonuses
 * - Display & Identification: Character titles, descriptions
 * - Combat: Recovery values, tier checks
 * - Negotiation: DC formatting
 */

import { describe, it, expect } from 'vitest';
import { DRAW_STEEL_EXAMPLES } from './computedFieldExamples';
import { evaluateComputedField } from '$lib/utils/fieldTypes';
import type { ComputedFieldConfig } from '$lib/types';

describe('computedFieldExamples - Structure', () => {
	describe('configuration completeness', () => {
		it('should export DRAW_STEEL_EXAMPLES array', () => {
			expect(DRAW_STEEL_EXAMPLES).toBeDefined();
			expect(Array.isArray(DRAW_STEEL_EXAMPLES)).toBe(true);
		});

		it('should have exactly 13 Draw Steel examples', () => {
			expect(DRAW_STEEL_EXAMPLES).toHaveLength(13);
		});

		it('should have all required properties for each example', () => {
			DRAW_STEEL_EXAMPLES.forEach((example, index) => {
				expect(example, `Example ${index} missing name`).toHaveProperty('name');
				expect(example, `Example ${index} missing category`).toHaveProperty('category');
				expect(example, `Example ${index} missing formula`).toHaveProperty('formula');
				expect(example, `Example ${index} missing outputType`).toHaveProperty('outputType');
				expect(example, `Example ${index} missing description`).toHaveProperty('description');
				expect(example, `Example ${index} missing sampleFields`).toHaveProperty('sampleFields');
				expect(example, `Example ${index} missing expectedResult`).toHaveProperty('expectedResult');
			});
		});

		it('should have valid outputType values', () => {
			const validOutputTypes = ['number', 'text', 'boolean'];
			DRAW_STEEL_EXAMPLES.forEach((example) => {
				expect(validOutputTypes).toContain(example.outputType);
			});
		});

		it('should have non-empty names', () => {
			DRAW_STEEL_EXAMPLES.forEach((example) => {
				expect(example.name.length).toBeGreaterThan(0);
			});
		});

		it('should have non-empty formulas', () => {
			DRAW_STEEL_EXAMPLES.forEach((example) => {
				expect(example.formula.length).toBeGreaterThan(0);
			});
		});

		it('should have non-empty descriptions', () => {
			DRAW_STEEL_EXAMPLES.forEach((example) => {
				expect(example.description.length).toBeGreaterThan(0);
			});
		});
	});

	describe('category distribution', () => {
		it('should have Health & Vitality category examples', () => {
			const healthExamples = DRAW_STEEL_EXAMPLES.filter((ex) => ex.category === 'Health & Vitality');
			expect(healthExamples.length).toBeGreaterThan(0);
		});

		it('should have Ability Scores category examples', () => {
			const abilityExamples = DRAW_STEEL_EXAMPLES.filter((ex) => ex.category === 'Ability Scores');
			expect(abilityExamples.length).toBeGreaterThan(0);
		});

		it('should have Display & Identification category examples', () => {
			const displayExamples = DRAW_STEEL_EXAMPLES.filter((ex) => ex.category === 'Display & Identification');
			expect(displayExamples.length).toBeGreaterThan(0);
		});

		it('should have Combat category examples', () => {
			const combatExamples = DRAW_STEEL_EXAMPLES.filter((ex) => ex.category === 'Combat');
			expect(combatExamples.length).toBeGreaterThan(0);
		});

		it('should have Negotiation category examples', () => {
			const negotiationExamples = DRAW_STEEL_EXAMPLES.filter((ex) => ex.category === 'Negotiation');
			expect(negotiationExamples.length).toBeGreaterThan(0);
		});
	});
});

describe('computedFieldExamples - Health & Vitality Examples', () => {
	describe('Example 1: Remaining HP', () => {
		it('should calculate remaining HP correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Remaining HP');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{maxHP} - {currentDamage}');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Health & Vitality');
		});

		it('should evaluate remaining HP with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Remaining HP')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});

		it('should handle zero damage', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Remaining HP')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { maxHP: 50, currentDamage: 0 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(50);
		});

		it('should handle maximum damage', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Remaining HP')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { maxHP: 50, currentDamage: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(0);
		});
	});

	describe('Example 2: HP Percentage', () => {
		it('should calculate HP percentage correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'HP Percentage');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('({currentHP} / {maxHP}) * 100');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Health & Vitality');
		});

		it('should evaluate HP percentage with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'HP Percentage')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});

		it('should handle 100% HP', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'HP Percentage')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 50, maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(100);
		});

		it('should handle 0% HP', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'HP Percentage')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 0, maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(0);
		});
	});

	describe('Example 3: Is Bloodied', () => {
		it('should check bloodied status correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Bloodied');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{currentHP} <= ({maxHP} / 2)');
			expect(example!.outputType).toBe('boolean');
			expect(example!.category).toBe('Health & Vitality');
		});

		it('should evaluate bloodied status with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Bloodied')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('boolean');
		});

		it('should return true when exactly at half HP', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Bloodied')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 25, maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});

		it('should return false when above half HP', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Bloodied')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 40, maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(false);
		});
	});

	describe('Example 4: Is Winded', () => {
		it('should check winded status correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Winded');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{currentHP} <= 0');
			expect(example!.outputType).toBe('boolean');
			expect(example!.category).toBe('Health & Vitality');
		});

		it('should evaluate winded status with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Winded')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('boolean');
		});

		it('should return true when HP is 0', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Winded')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 0 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});

		it('should return false when HP is above 0', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Winded')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { currentHP: 1 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(false);
		});
	});
});

describe('computedFieldExamples - Ability Scores Examples', () => {
	describe('Example 5: Total Attributes', () => {
		it('should sum all ability scores correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Total Attributes');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{might} + {agility} + {reason} + {intuition} + {presence}');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Ability Scores');
		});

		it('should evaluate total attributes with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Total Attributes')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});

		it('should handle all zero attributes', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Total Attributes')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { might: 0, agility: 0, reason: 0, intuition: 0, presence: 0 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(0);
		});
	});

	describe('Example 6: Primary Attack Bonus', () => {
		it('should calculate primary attack bonus correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Primary Attack Bonus');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{might} + {level}');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Ability Scores');
		});

		it('should evaluate primary attack bonus with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Primary Attack Bonus')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});

		it('should handle level 1 character', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Primary Attack Bonus')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { might: 2, level: 1 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(3);
		});
	});

	describe('Example 7: Ranged Attack Bonus', () => {
		it('should calculate ranged attack bonus correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Ranged Attack Bonus');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{agility} + {level}');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Ability Scores');
		});

		it('should evaluate ranged attack bonus with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Ranged Attack Bonus')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});
	});
});

describe('computedFieldExamples - Display & Identification Examples', () => {
	describe('Example 8: Character Title', () => {
		it('should format character title correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Character Title');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{name} the {class}');
			expect(example!.outputType).toBe('text');
			expect(example!.category).toBe('Display & Identification');
		});

		it('should evaluate character title with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Character Title')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('string');
		});

		it('should handle different character names and classes', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Character Title')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { name: 'Gandalf', class: 'Wizard' };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('Gandalf the Wizard');
		});
	});

	describe('Example 9: Full Character Description', () => {
		it('should format full description correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Full Character Description');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('Level {level} {ancestry} {class}');
			expect(example!.outputType).toBe('text');
			expect(example!.category).toBe('Display & Identification');
		});

		it('should evaluate full description with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Full Character Description')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('string');
		});

		it('should handle level 1 character', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Full Character Description')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { level: 1, ancestry: 'Human', class: 'Fighter' };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('Level 1 Human Fighter');
		});
	});

	describe('Example 10: NPC Identifier', () => {
		it('should format NPC identifier correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'NPC Identifier');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{name} | {threatLevel} {role}');
			expect(example!.outputType).toBe('text');
			expect(example!.category).toBe('Display & Identification');
		});

		it('should evaluate NPC identifier with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'NPC Identifier')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('string');
		});

		it('should handle different threat levels and roles', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'NPC Identifier')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { name: 'Goblin Warrior', threatLevel: 'Standard', role: 'Grunt' };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('Goblin Warrior | Standard Grunt');
		});
	});
});

describe('computedFieldExamples - Combat Examples', () => {
	describe('Example 11: Recovery Value', () => {
		it('should calculate recovery value correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Recovery Value');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{maxHP} / 3');
			expect(example!.outputType).toBe('number');
			expect(example!.category).toBe('Combat');
		});

		it('should evaluate recovery value with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Recovery Value')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
		});

		it('should handle HP that does not divide evenly by 3', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Recovery Value')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { maxHP: 50 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBeCloseTo(16.67, 1);
		});
	});

	describe('Example 12: Is Veteran Tier', () => {
		it('should check veteran tier correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Veteran Tier');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('{level} >= 5');
			expect(example!.outputType).toBe('boolean');
			expect(example!.category).toBe('Combat');
		});

		it('should evaluate veteran tier with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Veteran Tier')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('boolean');
		});

		it('should return true at exactly level 5', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Veteran Tier')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { level: 5 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(true);
		});

		it('should return false below level 5', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Is Veteran Tier')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { level: 4 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe(false);
		});
	});
});

describe('computedFieldExamples - Negotiation Examples', () => {
	describe('Example 13: Negotiation Difficulty', () => {
		it('should format negotiation DC correctly', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Negotiation Difficulty');
			expect(example).toBeDefined();
			expect(example!.formula).toBe('DC {negotiationDC}');
			expect(example!.outputType).toBe('text');
			expect(example!.category).toBe('Negotiation');
		});

		it('should evaluate negotiation difficulty with sample data', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Negotiation Difficulty')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);
			expect(result).toBe(example.expectedResult);
			expect(typeof result).toBe('string');
		});

		it('should handle different DC values', () => {
			const example = DRAW_STEEL_EXAMPLES.find((ex) => ex.name === 'Negotiation Difficulty')!;
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const fields = { negotiationDC: 20 };
			const result = evaluateComputedField(config, fields);
			expect(result).toBe('DC 20');
		});
	});
});

describe('computedFieldExamples - Integration Tests', () => {
	it('should evaluate all examples without errors', () => {
		DRAW_STEEL_EXAMPLES.forEach((example) => {
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			expect(() => {
				evaluateComputedField(config, example.sampleFields);
			}).not.toThrow();
		});
	});

	it('should match expected results for all examples', () => {
		DRAW_STEEL_EXAMPLES.forEach((example) => {
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);

			// For numbers, use toBeCloseTo to handle floating point precision
			if (example.outputType === 'number' && typeof example.expectedResult === 'number') {
				expect(result).toBeCloseTo(example.expectedResult, 2);
			} else {
				expect(result).toBe(example.expectedResult);
			}
		});
	});

	it('should have correct output type for all results', () => {
		DRAW_STEEL_EXAMPLES.forEach((example) => {
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			const result = evaluateComputedField(config, example.sampleFields);

			switch (example.outputType) {
				case 'number':
					expect(typeof result).toBe('number');
					break;
				case 'text':
					expect(typeof result).toBe('string');
					break;
				case 'boolean':
					expect(typeof result).toBe('boolean');
					break;
			}
		});
	});

	it('should handle missing fields gracefully', () => {
		DRAW_STEEL_EXAMPLES.forEach((example) => {
			const config: ComputedFieldConfig = {
				formula: example.formula,
				dependencies: Object.keys(example.sampleFields),
				outputType: example.outputType
			};

			// Provide empty fields object
			const result = evaluateComputedField(config, {});
			expect(result).toBeNull();
		});
	});
});
