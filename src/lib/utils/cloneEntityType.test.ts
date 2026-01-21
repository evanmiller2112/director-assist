/**
 * Tests for Clone Entity Type Utility (TDD RED Phase)
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * Tests the cloneEntityType utility function that creates deep copies of
 * EntityTypeDefinition objects for cloning existing entity types.
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 *
 * Covers:
 * - Cloning built-in entity types
 * - Cloning custom entity types
 * - Type key reset to empty string
 * - Label suffix "(Copy)" addition
 * - isBuiltIn forced to false
 * - Deep copying of fieldDefinitions and defaultRelationships
 * - Immutability (modifications don't affect original)
 */

import { describe, it, expect } from 'vitest';
import { cloneEntityType } from './cloneEntityType';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

describe('cloneEntityType', () => {
	describe('Basic Cloning Behavior', () => {
		it('should clone a built-in entity type', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				description: 'Player characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'class',
						label: 'Class',
						type: 'text',
						required: false,
						order: 1
					}
				],
				defaultRelationships: ['member_of', 'knows']
			};

			const cloned = cloneEntityType(original);

			expect(cloned).toBeDefined();
			expect(cloned.type).toBe('');
			expect(cloned.label).toBe('Character (Copy)');
			expect(cloned.labelPlural).toBe('Characters (Copy)');
			expect(cloned.isBuiltIn).toBe(false);
			expect(cloned.icon).toBe('user');
			expect(cloned.color).toBe('blue');
			expect(cloned.description).toBe('Player characters');
		});

		it('should clone a custom entity type', () => {
			const original: EntityTypeDefinition = {
				type: 'custom_monster',
				label: 'Custom Monster',
				labelPlural: 'Custom Monsters',
				icon: 'skull',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'threat_level',
						label: 'Threat Level',
						type: 'select',
						required: false,
						options: ['low', 'medium', 'high'],
						order: 1
					}
				],
				defaultRelationships: ['located_at']
			};

			const cloned = cloneEntityType(original);

			expect(cloned).toBeDefined();
			expect(cloned.type).toBe('');
			expect(cloned.label).toBe('Custom Monster (Copy)');
			expect(cloned.labelPlural).toBe('Custom Monsters (Copy)');
			expect(cloned.isBuiltIn).toBe(false);
		});

		it('should set type to empty string', () => {
			const original: EntityTypeDefinition = {
				type: 'npc',
				label: 'NPC',
				labelPlural: 'NPCs',
				icon: 'users',
				color: 'green',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.type).toBe('');
		});

		it('should always set isBuiltIn to false regardless of original', () => {
			const builtIn: EntityTypeDefinition = {
				type: 'location',
				label: 'Location',
				labelPlural: 'Locations',
				icon: 'map-pin',
				color: 'purple',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const custom: EntityTypeDefinition = {
				type: 'custom_type',
				label: 'Custom Type',
				labelPlural: 'Custom Types',
				icon: 'star',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const clonedBuiltIn = cloneEntityType(builtIn);
			const clonedCustom = cloneEntityType(custom);

			expect(clonedBuiltIn.isBuiltIn).toBe(false);
			expect(clonedCustom.isBuiltIn).toBe(false);
		});
	});

	describe('Label Suffix Behavior', () => {
		it('should append "(Copy)" to label', () => {
			const original: EntityTypeDefinition = {
				type: 'item',
				label: 'Item',
				labelPlural: 'Items',
				icon: 'package',
				color: 'orange',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.label).toBe('Item (Copy)');
		});

		it('should append "(Copy)" to labelPlural', () => {
			const original: EntityTypeDefinition = {
				type: 'faction',
				label: 'Faction',
				labelPlural: 'Factions',
				icon: 'flag',
				color: 'indigo',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.labelPlural).toBe('Factions (Copy)');
		});

		it('should handle labels with existing parentheses', () => {
			const original: EntityTypeDefinition = {
				type: 'test',
				label: 'Test (Beta)',
				labelPlural: 'Tests (Beta)',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.label).toBe('Test (Beta) (Copy)');
			expect(cloned.labelPlural).toBe('Tests (Beta) (Copy)');
		});

		it('should handle labels with multiple words', () => {
			const original: EntityTypeDefinition = {
				type: 'timeline_event',
				label: 'Timeline Event',
				labelPlural: 'Timeline Events',
				icon: 'calendar',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.label).toBe('Timeline Event (Copy)');
			expect(cloned.labelPlural).toBe('Timeline Events (Copy)');
		});

		it('should handle labels that already end with "(Copy)"', () => {
			const original: EntityTypeDefinition = {
				type: 'test',
				label: 'Test (Copy)',
				labelPlural: 'Tests (Copy)',
				icon: 'copy',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			// Should append another (Copy) - user can edit if needed
			expect(cloned.label).toBe('Test (Copy) (Copy)');
			expect(cloned.labelPlural).toBe('Tests (Copy) (Copy)');
		});
	});

	describe('Field Definitions Deep Copy', () => {
		it('should deep copy fieldDefinitions array', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'level',
						label: 'Level',
						type: 'number',
						required: true,
						defaultValue: 1,
						order: 1
					},
					{
						key: 'class',
						label: 'Class',
						type: 'select',
						required: true,
						options: ['Warrior', 'Mage', 'Rogue'],
						order: 2
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.fieldDefinitions).toEqual(original.fieldDefinitions);
			expect(cloned.fieldDefinitions).not.toBe(original.fieldDefinitions);
			expect(cloned.fieldDefinitions[0]).not.toBe(original.fieldDefinitions[0]);
			expect(cloned.fieldDefinitions[1]).not.toBe(original.fieldDefinitions[1]);
		});

		it('should preserve all field properties in deep copy', () => {
			const original: EntityTypeDefinition = {
				type: 'monster',
				label: 'Monster',
				labelPlural: 'Monsters',
				icon: 'skull',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'abilities',
						label: 'Abilities',
						type: 'richtext',
						required: false,
						placeholder: 'Enter abilities',
						helpText: 'List special abilities',
						section: 'combat',
						order: 1,
						aiGenerate: true
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			const clonedField = cloned.fieldDefinitions[0];
			expect(clonedField.key).toBe('abilities');
			expect(clonedField.label).toBe('Abilities');
			expect(clonedField.type).toBe('richtext');
			expect(clonedField.required).toBe(false);
			expect(clonedField.placeholder).toBe('Enter abilities');
			expect(clonedField.helpText).toBe('List special abilities');
			expect(clonedField.section).toBe('combat');
			expect(clonedField.order).toBe(1);
			expect(clonedField.aiGenerate).toBe(true);
		});

		it('should deep copy field options array', () => {
			const original: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'skills',
						label: 'Skills',
						type: 'multi-select',
						required: false,
						options: ['Stealth', 'Combat', 'Magic'],
						order: 1
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.fieldDefinitions[0].options).toEqual(['Stealth', 'Combat', 'Magic']);
			expect(cloned.fieldDefinitions[0].options).not.toBe(original.fieldDefinitions[0].options);
		});

		it('should deep copy entity types array in field definitions', () => {
			const original: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'amber',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'npcs',
						label: 'Related NPCs',
						type: 'entity-refs',
						required: false,
						entityTypes: ['npc', 'character'],
						order: 1
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.fieldDefinitions[0].entityTypes).toEqual(['npc', 'character']);
			expect(cloned.fieldDefinitions[0].entityTypes).not.toBe(
				original.fieldDefinitions[0].entityTypes
			);
		});

		it('should handle computed field config deep copy', () => {
			const original: EntityTypeDefinition = {
				type: 'stat_block',
				label: 'Stat Block',
				labelPlural: 'Stat Blocks',
				icon: 'calculator',
				color: 'cyan',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'total_power',
						label: 'Total Power',
						type: 'computed',
						required: false,
						order: 1,
						computedConfig: {
							formula: '{strength} + {intelligence}',
							dependencies: ['strength', 'intelligence'],
							outputType: 'number'
						}
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.fieldDefinitions[0].computedConfig).toEqual({
				formula: '{strength} + {intelligence}',
				dependencies: ['strength', 'intelligence'],
				outputType: 'number'
			});
			expect(cloned.fieldDefinitions[0].computedConfig).not.toBe(
				original.fieldDefinitions[0].computedConfig
			);
			expect(cloned.fieldDefinitions[0].computedConfig?.dependencies).not.toBe(
				original.fieldDefinitions[0].computedConfig?.dependencies
			);
		});

		it('should handle empty fieldDefinitions array', () => {
			const original: EntityTypeDefinition = {
				type: 'simple',
				label: 'Simple',
				labelPlural: 'Simples',
				icon: 'circle',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.fieldDefinitions).toEqual([]);
			expect(cloned.fieldDefinitions).not.toBe(original.fieldDefinitions);
		});
	});

	describe('Default Relationships Deep Copy', () => {
		it('should deep copy defaultRelationships array', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: ['member_of', 'knows', 'located_at']
			};

			const cloned = cloneEntityType(original);

			expect(cloned.defaultRelationships).toEqual(['member_of', 'knows', 'located_at']);
			expect(cloned.defaultRelationships).not.toBe(original.defaultRelationships);
		});

		it('should handle empty defaultRelationships array', () => {
			const original: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.defaultRelationships).toEqual([]);
			expect(cloned.defaultRelationships).not.toBe(original.defaultRelationships);
		});

		it('should handle single relationship in array', () => {
			const original: EntityTypeDefinition = {
				type: 'item',
				label: 'Item',
				labelPlural: 'Items',
				icon: 'package',
				color: 'orange',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: ['owned_by']
			};

			const cloned = cloneEntityType(original);

			expect(cloned.defaultRelationships).toEqual(['owned_by']);
			expect(cloned.defaultRelationships).not.toBe(original.defaultRelationships);
		});
	});

	describe('Immutability - Modifying Clone Should Not Affect Original', () => {
		it('should not affect original when modifying cloned basic properties', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			// Modify clone
			cloned.type = 'new_type';
			cloned.label = 'New Label';
			cloned.icon = 'new-icon';
			cloned.color = 'red';

			// Original should be unchanged
			expect(original.type).toBe('character');
			expect(original.label).toBe('Character');
			expect(original.icon).toBe('user');
			expect(original.color).toBe('blue');
		});

		it('should not affect original when modifying cloned fieldDefinitions', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'level',
						label: 'Level',
						type: 'number',
						required: false,
						order: 1
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			// Modify cloned fieldDefinitions
			cloned.fieldDefinitions[0].label = 'Modified Level';
			cloned.fieldDefinitions.push({
				key: 'new_field',
				label: 'New Field',
				type: 'text',
				required: false,
				order: 2
			});

			// Original should be unchanged
			expect(original.fieldDefinitions).toHaveLength(1);
			expect(original.fieldDefinitions[0].label).toBe('Level');
		});

		it('should not affect original when modifying field options', () => {
			const original: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'class',
						label: 'Class',
						type: 'select',
						required: false,
						options: ['Warrior', 'Mage'],
						order: 1
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			// Modify cloned options
			cloned.fieldDefinitions[0].options?.push('Rogue');

			// Original should be unchanged
			expect(original.fieldDefinitions[0].options).toEqual(['Warrior', 'Mage']);
		});

		it('should not affect original when modifying defaultRelationships', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: ['member_of']
			};

			const cloned = cloneEntityType(original);

			// Modify cloned relationships
			cloned.defaultRelationships.push('knows');
			cloned.defaultRelationships.push('located_at');

			// Original should be unchanged
			expect(original.defaultRelationships).toEqual(['member_of']);
		});

		it('should not affect original when modifying computed config', () => {
			const original: EntityTypeDefinition = {
				type: 'stat_block',
				label: 'Stat Block',
				labelPlural: 'Stat Blocks',
				icon: 'calculator',
				color: 'cyan',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'total',
						label: 'Total',
						type: 'computed',
						required: false,
						order: 1,
						computedConfig: {
							formula: '{a} + {b}',
							dependencies: ['a', 'b'],
							outputType: 'number'
						}
					}
				],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			// Modify cloned computed config
			cloned.fieldDefinitions[0].computedConfig!.formula = '{a} + {b} + {c}';
			cloned.fieldDefinitions[0].computedConfig!.dependencies.push('c');

			// Original should be unchanged
			expect(original.fieldDefinitions[0].computedConfig?.formula).toBe('{a} + {b}');
			expect(original.fieldDefinitions[0].computedConfig?.dependencies).toEqual(['a', 'b']);
		});
	});

	describe('Optional Description Field', () => {
		it('should preserve description when present', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				description: 'A player character in the game',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.description).toBe('A player character in the game');
		});

		it('should handle undefined description', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);

			expect(cloned.description).toBeUndefined();
		});

		it('should not affect original when modifying description', () => {
			const original: EntityTypeDefinition = {
				type: 'character',
				label: 'Character',
				labelPlural: 'Characters',
				description: 'Original description',
				icon: 'user',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const cloned = cloneEntityType(original);
			cloned.description = 'Modified description';

			expect(original.description).toBe('Original description');
		});
	});

	describe('Complex Entity Type Cloning', () => {
		it('should clone a complex entity type with all features', () => {
			const original: EntityTypeDefinition = {
				type: 'ds-monster-threat',
				label: 'Monster/Threat',
				labelPlural: 'Monsters/Threats',
				description: 'Track enemies and creatures for encounters',
				icon: 'skull',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'threat_level',
						label: 'Threat Level',
						type: 'select',
						required: false,
						options: ['minion', 'standard', 'boss'],
						order: 1
					},
					{
						key: 'role',
						label: 'Role',
						type: 'select',
						required: false,
						options: ['ambusher', 'brute', 'defender'],
						order: 2
					},
					{
						key: 'ac',
						label: 'AC',
						type: 'number',
						required: false,
						order: 3
					},
					{
						key: 'hp',
						label: 'HP',
						type: 'number',
						required: false,
						order: 4
					},
					{
						key: 'abilities',
						label: 'Abilities',
						type: 'richtext',
						required: false,
						order: 5,
						aiGenerate: true
					}
				],
				defaultRelationships: ['located_at', 'part_of']
			};

			const cloned = cloneEntityType(original);

			// Verify all aspects were cloned correctly
			expect(cloned.type).toBe('');
			expect(cloned.label).toBe('Monster/Threat (Copy)');
			expect(cloned.labelPlural).toBe('Monsters/Threats (Copy)');
			expect(cloned.description).toBe('Track enemies and creatures for encounters');
			expect(cloned.icon).toBe('skull');
			expect(cloned.color).toBe('red');
			expect(cloned.isBuiltIn).toBe(false);
			expect(cloned.fieldDefinitions).toHaveLength(5);
			expect(cloned.defaultRelationships).toEqual(['located_at', 'part_of']);

			// Verify deep copy
			expect(cloned.fieldDefinitions).not.toBe(original.fieldDefinitions);
			expect(cloned.defaultRelationships).not.toBe(original.defaultRelationships);
		});
	});
});
