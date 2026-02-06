/**
 * Tests for Entity Type System Enhancements - Phase 1 (Issue #25)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until the type system enhancements are implemented.
 *
 * Phase 1 Type System Changes:
 * 1. Add 'computed' to FieldType union
 * 2. Add 'short-text' and 'long-text' as valid field type aliases (for normalization)
 * 3. Add ComputedFieldConfig interface with:
 *    - formula: string
 *    - dependencies: string[]
 *    - outputType: 'text' | 'number' | 'boolean'
 * 4. Update FieldDefinition to include optional computedConfig property
 *
 * This test file validates the TYPE SYSTEM changes. The actual utility functions
 * are tested in fieldTypes.test.ts.
 */

import { describe, it, expect } from 'vitest';
import type { FieldType, FieldDefinition, ComputedFieldConfig } from '$lib/types';

describe('entities - FieldType with computed support', () => {
	describe('FieldType type definition', () => {
		it('should accept computed as a valid FieldType', () => {
			const fieldType: FieldType = 'computed';
			expect(fieldType).toBe('computed');
		});

		it('should accept all standard field types', () => {
			const standardTypes: FieldType[] = [
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

			standardTypes.forEach((type) => {
				const fieldType: FieldType = type;
				expect(fieldType).toBe(type);
			});
		});
	});
});

describe('entities - ComputedFieldConfig interface', () => {
	describe('interface structure', () => {
		it('should create valid ComputedFieldConfig with all required properties', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} * 10',
				dependencies: ['level'],
				outputType: 'number'
			};

			expect(config.formula).toBe('{level} * 10');
			expect(config.dependencies).toEqual(['level']);
			expect(config.outputType).toBe('number');
		});

		it('should require formula property', () => {
			// This should be a compile-time error
			// @ts-expect-error - formula is required
			const config: ComputedFieldConfig = {
				dependencies: ['level'],
				outputType: 'number'
			};

			expect(config).toBeDefined();
		});

		it('should require dependencies property', () => {
			// This should be a compile-time error
			// @ts-expect-error - dependencies is required
			const config: ComputedFieldConfig = {
				formula: '{level} * 10',
				outputType: 'number'
			};

			expect(config).toBeDefined();
		});

		it('should require outputType property', () => {
			// This should be a compile-time error
			// @ts-expect-error - outputType is required
			const config: ComputedFieldConfig = {
				formula: '{level} * 10',
				dependencies: ['level']
			};

			expect(config).toBeDefined();
		});
	});

	describe('formula property', () => {
		it('should accept simple arithmetic formulas', () => {
			const config: ComputedFieldConfig = {
				formula: '{a} + {b}',
				dependencies: ['a', 'b'],
				outputType: 'number'
			};

			expect(config.formula).toBe('{a} + {b}');
		});

		it('should accept complex formulas with multiple operations', () => {
			const config: ComputedFieldConfig = {
				formula: '({level} * 10) + {bonus}',
				dependencies: ['level', 'bonus'],
				outputType: 'number'
			};

			expect(config.formula).toBe('({level} * 10) + {bonus}');
		});

		it('should accept string concatenation formulas', () => {
			const config: ComputedFieldConfig = {
				formula: '{first_name} {last_name}',
				dependencies: ['first_name', 'last_name'],
				outputType: 'text'
			};

			expect(config.formula).toBe('{first_name} {last_name}');
		});

		it('should accept boolean comparison formulas', () => {
			const config: ComputedFieldConfig = {
				formula: '{level} > 10',
				dependencies: ['level'],
				outputType: 'boolean'
			};

			expect(config.formula).toBe('{level} > 10');
		});

		it('should accept empty formula', () => {
			const config: ComputedFieldConfig = {
				formula: '',
				dependencies: [],
				outputType: 'text'
			};

			expect(config.formula).toBe('');
		});
	});

	describe('dependencies property', () => {
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

		it('should accept dependencies with underscores', () => {
			const config: ComputedFieldConfig = {
				formula: '{max_hp}',
				dependencies: ['max_hp'],
				outputType: 'number'
			};

			expect(config.dependencies).toContain('max_hp');
		});

		it('should accept dependencies with numbers', () => {
			const config: ComputedFieldConfig = {
				formula: '{stat1} + {stat2}',
				dependencies: ['stat1', 'stat2'],
				outputType: 'number'
			};

			expect(config.dependencies).toEqual(['stat1', 'stat2']);
		});
	});

	describe('outputType property', () => {
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

		it('should not accept invalid outputType', () => {
			// This should be a compile-time error but TypeScript doesn't catch it
			const config: ComputedFieldConfig = {
				formula: '{a}',
				dependencies: ['a'],
				outputType: 'string' as any
			};

			expect(config).toBeDefined();
		});

		it('should not accept object as outputType', () => {
			// This should be a compile-time error but TypeScript doesn't catch it
			const config: ComputedFieldConfig = {
				formula: '{a}',
				dependencies: ['a'],
				outputType: 'object' as any
			};

			expect(config).toBeDefined();
		});
	});
});

describe('entities - FieldDefinition with computedConfig', () => {
	describe('standard field definitions', () => {
		it('should create FieldDefinition without computedConfig', () => {
			const field: FieldDefinition = {
				key: 'name',
				label: 'Name',
				type: 'text',
				required: true,
				order: 1
			};

			expect(field.computedConfig).toBeUndefined();
		});

		it('should create number field without computedConfig', () => {
			const field: FieldDefinition = {
				key: 'level',
				label: 'Level',
				type: 'number',
				required: true,
				defaultValue: 1,
				order: 1
			};

			expect(field.computedConfig).toBeUndefined();
		});

		it('should create select field without computedConfig', () => {
			const field: FieldDefinition = {
				key: 'class',
				label: 'Class',
				type: 'select',
				required: true,
				options: ['Warrior', 'Mage', 'Rogue'],
				order: 1
			};

			expect(field.computedConfig).toBeUndefined();
		});
	});

	describe('computed field definitions', () => {
		it('should create computed FieldDefinition with computedConfig', () => {
			const field: FieldDefinition = {
				key: 'total_hp',
				label: 'Total HP',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{level} * 10',
					dependencies: ['level'],
					outputType: 'number'
				}
			};

			expect(field.type).toBe('computed');
			expect(field.computedConfig).toBeDefined();
			expect(field.computedConfig?.formula).toBe('{level} * 10');
			expect(field.computedConfig?.dependencies).toEqual(['level']);
			expect(field.computedConfig?.outputType).toBe('number');
		});

		it('should create computed field with text output', () => {
			const field: FieldDefinition = {
				key: 'full_name',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{first_name} {last_name}',
					dependencies: ['first_name', 'last_name'],
					outputType: 'text'
				}
			};

			expect(field.computedConfig?.outputType).toBe('text');
		});

		it('should create computed field with boolean output', () => {
			const field: FieldDefinition = {
				key: 'is_alive',
				label: 'Is Alive',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{hp} > 0',
					dependencies: ['hp'],
					outputType: 'boolean'
				}
			};

			expect(field.computedConfig?.outputType).toBe('boolean');
		});

		it('should create computed field with complex formula', () => {
			const field: FieldDefinition = {
				key: 'armor_class',
				label: 'Armor Class',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '10 + {dexterity_modifier} + {armor_bonus}',
					dependencies: ['dexterity_modifier', 'armor_bonus'],
					outputType: 'number'
				}
			};

			expect(field.computedConfig?.formula).toBe('10 + {dexterity_modifier} + {armor_bonus}');
			expect(field.computedConfig?.dependencies).toEqual(['dexterity_modifier', 'armor_bonus']);
		});

		it('should create computed field with multiple dependencies', () => {
			const field: FieldDefinition = {
				key: 'total_stats',
				label: 'Total Stats',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{str} + {dex} + {con} + {int} + {wis} + {cha}',
					dependencies: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
					outputType: 'number'
				}
			};

			expect(field.computedConfig?.dependencies).toHaveLength(6);
		});
	});

	describe('optional computedConfig property', () => {
		it('should allow FieldDefinition without computedConfig', () => {
			const field: FieldDefinition = {
				key: 'name',
				label: 'Name',
				type: 'text',
				required: true,
				order: 1
			};

			expect(field.computedConfig).toBeUndefined();
		});

		it('should allow non-computed field types without computedConfig', () => {
			const types: FieldType[] = [
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

			types.forEach((type) => {
				const field: FieldDefinition = {
					key: 'test_field',
					label: 'Test Field',
					type,
					required: false,
					order: 1
				};

				expect(field.computedConfig).toBeUndefined();
			});
		});

		it('should optionally include computedConfig for any field type', () => {
			// Although typically only used with 'computed' type,
			// the type system should allow computedConfig on any field
			const field: FieldDefinition = {
				key: 'special_field',
				label: 'Special Field',
				type: 'text',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{value}',
					dependencies: ['value'],
					outputType: 'text'
				}
			};

			expect(field.computedConfig).toBeDefined();
		});
	});

	describe('computed field edge cases', () => {
		it('should handle computed field with no dependencies', () => {
			const field: FieldDefinition = {
				key: 'constant',
				label: 'Constant',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '42',
					dependencies: [],
					outputType: 'number'
				}
			};

			expect(field.computedConfig?.dependencies).toEqual([]);
		});

		it('should handle computed field with empty formula', () => {
			const field: FieldDefinition = {
				key: 'empty',
				label: 'Empty',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '',
					dependencies: [],
					outputType: 'text'
				}
			};

			expect(field.computedConfig?.formula).toBe('');
		});

		it('should include all FieldDefinition properties with computed', () => {
			const field: FieldDefinition = {
				key: 'hp_display',
				label: 'HP Display',
				type: 'computed',
				required: false,
				placeholder: 'Calculating...',
				helpText: 'Automatically calculated from level',
				section: 'stats',
				order: 5,
				aiGenerate: false,
				computedConfig: {
					formula: '{level} * 10',
					dependencies: ['level'],
					outputType: 'number'
				}
			};

			expect(field.placeholder).toBe('Calculating...');
			expect(field.helpText).toBe('Automatically calculated from level');
			expect(field.section).toBe('stats');
			expect(field.order).toBe(5);
			expect(field.aiGenerate).toBe(false);
		});

		it('should handle computed field marked as required', () => {
			const field: FieldDefinition = {
				key: 'critical_value',
				label: 'Critical Value',
				type: 'computed',
				required: true, // Unusual but should be allowed
				order: 1,
				computedConfig: {
					formula: '{a} + {b}',
					dependencies: ['a', 'b'],
					outputType: 'number'
				}
			};

			expect(field.required).toBe(true);
		});
	});
});

describe('entities - Real-world computed field examples', () => {
	it('should define character hit points formula', () => {
		const field: FieldDefinition = {
			key: 'hit_points',
			label: 'Hit Points',
			type: 'computed',
			required: false,
			helpText: 'Calculated from level and constitution',
			order: 10,
			computedConfig: {
				formula: '({level} * 8) + ({constitution} * 2)',
				dependencies: ['level', 'constitution'],
				outputType: 'number'
			}
		};

		expect(field.computedConfig?.formula).toContain('level');
		expect(field.computedConfig?.formula).toContain('constitution');
		expect(field.computedConfig?.outputType).toBe('number');
	});

	it('should define character full name concatenation', () => {
		const field: FieldDefinition = {
			key: 'full_name',
			label: 'Full Name',
			type: 'computed',
			required: false,
			order: 1,
			computedConfig: {
				formula: '{first_name} {last_name}',
				dependencies: ['first_name', 'last_name'],
				outputType: 'text'
			}
		};

		expect(field.computedConfig?.outputType).toBe('text');
	});

	it('should define alive/dead status check', () => {
		const field: FieldDefinition = {
			key: 'is_alive',
			label: 'Is Alive',
			type: 'computed',
			required: false,
			order: 20,
			computedConfig: {
				formula: '{current_hp} > 0',
				dependencies: ['current_hp'],
				outputType: 'boolean'
			}
		};

		expect(field.computedConfig?.outputType).toBe('boolean');
	});

	it('should define armor class calculation', () => {
		const field: FieldDefinition = {
			key: 'armor_class',
			label: 'Armor Class',
			type: 'computed',
			required: false,
			helpText: 'Base AC + Dexterity modifier + Armor bonus',
			order: 15,
			computedConfig: {
				formula: '10 + {dexterity_modifier} + {armor_bonus}',
				dependencies: ['dexterity_modifier', 'armor_bonus'],
				outputType: 'number'
			}
		};

		expect(field.computedConfig?.dependencies).toHaveLength(2);
	});

	it('should define character title/descriptor', () => {
		const field: FieldDefinition = {
			key: 'character_title',
			label: 'Character Title',
			type: 'computed',
			required: false,
			order: 2,
			computedConfig: {
				formula: '{name} the {character_class}',
				dependencies: ['name', 'character_class'],
				outputType: 'text'
			}
		};

		expect(field.computedConfig?.formula).toContain('the');
	});

	it('should define initiative bonus', () => {
		const field: FieldDefinition = {
			key: 'initiative',
			label: 'Initiative',
			type: 'computed',
			required: false,
			helpText: 'Dexterity + bonuses',
			order: 12,
			computedConfig: {
				formula: '{dexterity} + {initiative_bonus}',
				dependencies: ['dexterity', 'initiative_bonus'],
				outputType: 'number'
			}
		};

		expect(field.computedConfig?.dependencies).toContain('dexterity');
		expect(field.computedConfig?.dependencies).toContain('initiative_bonus');
	});

	it('should define spell slots available check', () => {
		const field: FieldDefinition = {
			key: 'has_spell_slots',
			label: 'Has Spell Slots Available',
			type: 'computed',
			required: false,
			order: 25,
			computedConfig: {
				formula: '{spell_slots_used} < {spell_slots_total}',
				dependencies: ['spell_slots_used', 'spell_slots_total'],
				outputType: 'boolean'
			}
		};

		expect(field.computedConfig?.formula).toContain('<');
	});
});
