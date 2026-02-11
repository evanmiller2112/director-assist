/**
 * Unit Tests for Entity Type Validation Utilities (TDD RED Phase - Issue #25)
 *
 * Phase 7: Validation and Error Handling
 *
 * These tests define the expected behavior for validating custom entity types
 * and field definitions. Tests should FAIL until validation utilities are implemented.
 *
 * Test Coverage:
 * - Entity type definition validation (unique typeKey, valid fields)
 * - Field definition validation (unique fieldKey, valid type, required options)
 * - Type key uniqueness across custom and built-in types
 * - Computed field formula validation (valid syntax, no circular references)
 * - Clear error messages for validation failures
 * - Edge cases and boundary conditions
 */
import { describe, it, expect } from 'vitest';
import type { EntityTypeDefinition, FieldDefinition, FieldType } from '$lib/types';
import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
import {
	validateEntityTypeDefinition,
	validateFieldDefinition,
	validateTypeKeyUniqueness,
	validateComputedFieldFormula,
	detectCircularDependencies,
	type ValidationResult
} from './entityTypeValidation';

describe('Entity Type Definition Validation', () => {
	describe('validateEntityTypeDefinition - Required Fields', () => {
		it('should accept valid entity type definition with all required fields', () => {
			const validType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(validType);
			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should reject entity type without type field', () => {
			const invalidType = {
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type must have a type key');
		});

		it('should reject entity type with empty type string', () => {
			const invalidType = {
				type: '',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type key cannot be empty');
		});

		it('should reject entity type without label', () => {
			const invalidType = {
				type: 'quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type must have a label');
		});

		it('should reject entity type without labelPlural', () => {
			const invalidType = {
				type: 'quest',
				label: 'Quest',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type must have a labelPlural');
		});

		it('should reject entity type without icon', () => {
			const invalidType = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type must have an icon');
		});

		it('should reject entity type without color', () => {
			const invalidType = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type must have a color');
		});

		it('should reject entity type with multiple missing fields and list all errors', () => {
			const invalidType = {
				type: ''
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
			expect(result.errors).toContain('Entity type key cannot be empty');
			expect(result.errors).toContain('Entity type must have a label');
		});
	});

	describe('validateEntityTypeDefinition - Type Key Format', () => {
		it('should accept valid snake_case type key', () => {
			const validType: EntityTypeDefinition = {
				type: 'custom_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(validType);
			expect(result.valid).toBe(true);
		});

		it('should accept valid kebab-case type key', () => {
			const validType: EntityTypeDefinition = {
				type: 'custom-quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(validType);
			expect(result.valid).toBe(true);
		});

		it('should reject type key with spaces', () => {
			const invalidType: Partial<EntityTypeDefinition> = {
				type: 'custom quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type key cannot contain spaces');
		});

		it('should reject type key with special characters', () => {
			const invalidType: Partial<EntityTypeDefinition> = {
				type: 'quest@type!',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Entity type key can only contain letters, numbers, hyphens, and underscores'
			);
		});

		it('should reject type key starting with number', () => {
			const invalidType: Partial<EntityTypeDefinition> = {
				type: '123quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type key must start with a letter');
		});

		it('should reject type key with uppercase letters', () => {
			const invalidType: Partial<EntityTypeDefinition> = {
				type: 'CustomQuest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type key must be lowercase');
		});
	});

	describe('validateEntityTypeDefinition - Field Definitions', () => {
		it('should accept entity type with valid field definitions', () => {
			const validType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'difficulty',
						label: 'Difficulty',
						type: 'select',
						required: false,
						options: ['easy', 'medium', 'hard'],
						order: 2
					}
				],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(validType);
			expect(result.valid).toBe(true);
		});

		it('should reject entity type with duplicate field keys', () => {
			const invalidType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'objective', // Duplicate
						label: 'Secondary Objective',
						type: 'text',
						required: false,
						order: 2
					}
				],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Duplicate field key: objective');
		});

		it('should reject entity type with invalid field definition', () => {
			const invalidType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: '', // Invalid field
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field key cannot be empty');
		});

		it('should validate all field definitions and collect all errors', () => {
			const invalidType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: '',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'status',
						label: '',
						type: 'select',
						required: false,
						order: 2
					}
				],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(invalidType);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('validateEntityTypeDefinition - Type Uniqueness', () => {
		it('should accept type key that does not conflict with existing custom types', () => {
			const existingTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			const newType: EntityTypeDefinition = {
				type: 'mission',
				label: 'Mission',
				labelPlural: 'Missions',
				icon: 'target',
				color: 'blue',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(newType, existingTypes);
			expect(result.valid).toBe(true);
		});

		it('should reject type key that conflicts with existing custom type', () => {
			const existingTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			const newType: EntityTypeDefinition = {
				type: 'quest', // Duplicate
				label: 'Quest v2',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'blue',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(newType, existingTypes);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity type key "quest" is already in use');
		});

		it('should reject type key that conflicts with built-in type', () => {
			const newType: EntityTypeDefinition = {
				type: 'character', // Built-in type
				label: 'Custom Character',
				labelPlural: 'Characters',
				icon: 'user',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const result = validateEntityTypeDefinition(newType);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Entity type key "character" conflicts with a built-in type'
			);
		});
	});
});

describe('Field Definition Validation', () => {
	describe('validateFieldDefinition - Required Fields', () => {
		it('should accept valid field definition', () => {
			const validField: FieldDefinition = {
				key: 'objective',
				label: 'Objective',
				type: 'text',
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it('should reject field without key', () => {
			const invalidField = {
				label: 'Objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field must have a key');
		});

		it('should reject field with empty key', () => {
			const invalidField = {
				key: '',
				label: 'Objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field key cannot be empty');
		});

		it('should reject field without label', () => {
			const invalidField = {
				key: 'objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field must have a label');
		});

		it('should reject field with empty label', () => {
			const invalidField = {
				key: 'objective',
				label: '',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field label cannot be empty');
		});

		it('should reject field without type', () => {
			const invalidField = {
				key: 'objective',
				label: 'Objective',
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field must have a type');
		});

		it('should reject field with invalid type', () => {
			const invalidField = {
				key: 'objective',
				label: 'Objective',
				type: 'invalid_type' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field has invalid type: invalid_type');
		});
	});

	describe('validateFieldDefinition - Field Key Format', () => {
		it('should accept valid snake_case field key', () => {
			const validField: FieldDefinition = {
				key: 'quest_objective',
				label: 'Objective',
				type: 'text',
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should accept valid camelCase field key', () => {
			const validField: FieldDefinition = {
				key: 'questObjective',
				label: 'Objective',
				type: 'text',
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should reject field key with spaces', () => {
			const invalidField = {
				key: 'quest objective',
				label: 'Objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field key cannot contain spaces');
		});

		it('should reject field key with special characters', () => {
			const invalidField = {
				key: 'quest-objective!',
				label: 'Objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Field key can only contain letters, numbers, and underscores'
			);
		});

		it('should reject field key starting with number', () => {
			const invalidField = {
				key: '1objective',
				label: 'Objective',
				type: 'text' as FieldType,
				required: true,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Field key must start with a letter');
		});
	});

	describe('validateFieldDefinition - Select Fields', () => {
		it('should accept select field with valid options', () => {
			const validField: FieldDefinition = {
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				options: ['easy', 'medium', 'hard'],
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should reject select field without options', () => {
			const invalidField: FieldDefinition = {
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Select field "difficulty" must have options');
		});

		it('should reject select field with empty options array', () => {
			const invalidField: FieldDefinition = {
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				options: [],
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Select field "difficulty" must have at least one option');
		});

		it('should reject select field with duplicate options', () => {
			const invalidField: FieldDefinition = {
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				options: ['easy', 'medium', 'easy'], // Duplicate
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Select field "difficulty" has duplicate option: easy');
		});

		it('should reject select field with empty string option', () => {
			const invalidField: FieldDefinition = {
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				required: false,
				options: ['easy', '', 'hard'],
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Select field "difficulty" has empty option');
		});
	});

	describe('validateFieldDefinition - Multi-Select Fields', () => {
		it('should accept multi-select field with valid options', () => {
			const validField: FieldDefinition = {
				key: 'skills',
				label: 'Skills',
				type: 'multi-select',
				required: false,
				options: ['stealth', 'combat', 'magic'],
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should reject multi-select field without options', () => {
			const invalidField: FieldDefinition = {
				key: 'skills',
				label: 'Skills',
				type: 'multi-select',
				required: false,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Multi-select field "skills" must have options');
		});

		it('should reject multi-select field with empty options array', () => {
			const invalidField: FieldDefinition = {
				key: 'skills',
				label: 'Skills',
				type: 'multi-select',
				required: false,
				options: [],
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Multi-select field "skills" must have at least one option');
		});
	});

	describe('validateFieldDefinition - Entity Reference Fields', () => {
		it('should accept entity-ref field with valid entityTypes', () => {
			const validField: FieldDefinition = {
				key: 'location',
				label: 'Location',
				type: 'entity-ref',
				required: false,
				entityTypes: ['location'],
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should accept entity-refs field with multiple entity types', () => {
			const validField: FieldDefinition = {
				key: 'participants',
				label: 'Participants',
				type: 'entity-refs',
				required: false,
				entityTypes: ['character', 'npc'],
				order: 1
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should reject entity-ref field without entityTypes', () => {
			const invalidField: FieldDefinition = {
				key: 'location',
				label: 'Location',
				type: 'entity-ref',
				required: false,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Entity reference field "location" must have entityTypes');
		});

		it('should reject entity-refs field with empty entityTypes array', () => {
			const invalidField: FieldDefinition = {
				key: 'participants',
				label: 'Participants',
				type: 'entity-refs',
				required: false,
				entityTypes: [],
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'Entity reference field "participants" must have at least one entity type'
			);
		});
	});

	describe('validateFieldDefinition - Computed Fields', () => {
		it('should accept computed field with valid formula and dependencies', () => {
			const validField: FieldDefinition = {
				key: 'fullName',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{firstName} {lastName}',
					dependencies: ['firstName', 'lastName'],
					outputType: 'text'
				}
			};

			const result = validateFieldDefinition(validField);
			expect(result.valid).toBe(true);
		});

		it('should reject computed field without computedConfig', () => {
			const invalidField: FieldDefinition = {
				key: 'fullName',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Computed field "fullName" must have computedConfig');
		});

		it('should reject computed field with empty formula', () => {
			const invalidField: FieldDefinition = {
				key: 'fullName',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '',
					dependencies: ['firstName'],
					outputType: 'text'
				}
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Computed field "fullName" formula cannot be empty');
		});

		it('should reject computed field without dependencies array', () => {
			const invalidField: FieldDefinition = {
				key: 'fullName',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{firstName} {lastName}',
					dependencies: undefined as any,
					outputType: 'text'
				}
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Computed field "fullName" must have dependencies array');
		});

		it('should reject computed field without outputType', () => {
			const invalidField: FieldDefinition = {
				key: 'fullName',
				label: 'Full Name',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{firstName} {lastName}',
					dependencies: ['firstName', 'lastName'],
					outputType: undefined as any
				}
			};

			const result = validateFieldDefinition(invalidField);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Computed field "fullName" must have outputType');
		});
	});
});

describe('Type Key Uniqueness Validation', () => {
	it('should accept type key that does not conflict', () => {
		const result = validateTypeKeyUniqueness('quest', []);
		expect(result.valid).toBe(true);
	});

	it('should reject type key that matches built-in type', () => {
		const result = validateTypeKeyUniqueness('character', []);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Type key "character" conflicts with a built-in type');
	});

	it('should reject type key that matches existing custom type', () => {
		const existingTypes: EntityTypeDefinition[] = [
			{
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			}
		];

		const result = validateTypeKeyUniqueness('quest', existingTypes);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Type key "quest" is already in use');
	});

	it('should validate against all built-in types', () => {
		const builtInTypes = [
			'character',
			'npc',
			'location',
			'faction',
			'item',
			'session',
			'scene',
			'deity',
			'timeline_event',
			'world_rule',
			'player_profile',
			'campaign',
			'narrative_event'
		];

		builtInTypes.forEach((typeKey) => {
			const result = validateTypeKeyUniqueness(typeKey, []);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(`Type key "${typeKey}" conflicts with a built-in type`);
		});
	});

	it('should perform case-sensitive comparison', () => {
		const result = validateTypeKeyUniqueness('Character', []); // Uppercase
		// Should still pass validation (different from lowercase 'character')
		// But will fail format validation (must be lowercase)
		expect(result.valid).toBe(true);
	});
});

describe('Computed Field Formula Validation', () => {
	describe('validateComputedFieldFormula - Syntax Validation', () => {
		it('should accept valid formula with single placeholder', () => {
			const result = validateComputedFieldFormula('Hello {name}', ['name'], ['name']);
			expect(result.valid).toBe(true);
		});

		it('should accept valid formula with multiple placeholders', () => {
			const result = validateComputedFieldFormula(
				'{firstName} {lastName}',
				['firstName', 'lastName'],
				['firstName', 'lastName']
			);
			expect(result.valid).toBe(true);
		});

		it('should accept formula with repeated placeholders', () => {
			const result = validateComputedFieldFormula(
				'{name} aka {name}',
				['name'],
				['name', 'alias']
			);
			expect(result.valid).toBe(true);
		});

		it('should reject formula with unclosed placeholder', () => {
			const result = validateComputedFieldFormula('{firstName lastName}', ['firstName'], ['firstName', 'lastName']);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Formula has invalid placeholder syntax');
		});

		it('should reject formula with mismatched braces', () => {
			const result = validateComputedFieldFormula(
				'{firstName} {lastName',
				['firstName', 'lastName'],
				['firstName', 'lastName']
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Formula has unclosed placeholder');
		});

		it('should reject formula referencing undefined field', () => {
			const result = validateComputedFieldFormula(
				'{firstName} {lastName}',
				['firstName', 'lastName'],
				['firstName'] // lastName not in available fields
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Formula references undefined field: lastName');
		});

		it('should reject formula with dependencies not in formula', () => {
			const result = validateComputedFieldFormula(
				'{firstName}',
				['firstName', 'lastName'], // lastName in dependencies but not in formula
				['firstName', 'lastName']
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Dependency "lastName" is not used in formula');
		});

		it('should reject formula missing declared dependencies', () => {
			const result = validateComputedFieldFormula(
				'{firstName} {lastName}',
				['firstName'], // Missing lastName in dependencies
				['firstName', 'lastName']
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Formula uses field "lastName" not in dependencies');
		});
	});

	describe('validateComputedFieldFormula - Mathematical Formulas', () => {
		it('should accept formula with arithmetic operations', () => {
			const result = validateComputedFieldFormula(
				'{level} * 10 + {bonus}',
				['level', 'bonus'],
				['level', 'bonus']
			);
			expect(result.valid).toBe(true);
		});

		it('should accept formula with parentheses', () => {
			const result = validateComputedFieldFormula(
				'({strength} + {dexterity}) / 2',
				['strength', 'dexterity'],
				['strength', 'dexterity']
			);
			expect(result.valid).toBe(true);
		});

		it('should reject formula with unbalanced parentheses', () => {
			const result = validateComputedFieldFormula(
				'({strength} + {dexterity} / 2',
				['strength', 'dexterity'],
				['strength', 'dexterity']
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Formula has unbalanced parentheses');
		});
	});

	describe('validateComputedFieldFormula - Edge Cases', () => {
		it('should accept formula with no placeholders (static value)', () => {
			const result = validateComputedFieldFormula('Static Value', [], ['field1']);
			expect(result.valid).toBe(true);
		});

		it('should accept formula with special characters in text', () => {
			const result = validateComputedFieldFormula(
				'{name} (a.k.a. "The Great")',
				['name'],
				['name']
			);
			expect(result.valid).toBe(true);
		});

		it('should handle empty dependencies array', () => {
			const result = validateComputedFieldFormula('Static Text', [], ['field1']);
			expect(result.valid).toBe(true);
		});

		it('should handle empty allFieldKeys array (no other fields)', () => {
			const result = validateComputedFieldFormula('Static Text', [], []);
			expect(result.valid).toBe(true);
		});
	});
});

describe('Circular Dependency Detection', () => {
	describe('detectCircularDependencies - No Circular Dependencies', () => {
		it('should detect no circular dependencies in simple field chain', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'firstName',
					label: 'First Name',
					type: 'text',
					required: false,
					order: 1
				},
				{
					key: 'lastName',
					label: 'Last Name',
					type: 'text',
					required: false,
					order: 2
				},
				{
					key: 'fullName',
					label: 'Full Name',
					type: 'computed',
					required: false,
					order: 3,
					computedConfig: {
						formula: '{firstName} {lastName}',
						dependencies: ['firstName', 'lastName'],
						outputType: 'text'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(false);
		});

		it('should detect no circular dependencies in multi-level chain', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'base',
					label: 'Base',
					type: 'number',
					required: false,
					order: 1
				},
				{
					key: 'multiplier',
					label: 'Multiplier',
					type: 'number',
					required: false,
					order: 2
				},
				{
					key: 'calculated',
					label: 'Calculated',
					type: 'computed',
					required: false,
					order: 3,
					computedConfig: {
						formula: '{base} * {multiplier}',
						dependencies: ['base', 'multiplier'],
						outputType: 'number'
					}
				},
				{
					key: 'final',
					label: 'Final',
					type: 'computed',
					required: false,
					order: 4,
					computedConfig: {
						formula: '{calculated} + 10',
						dependencies: ['calculated'],
						outputType: 'number'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(false);
		});
	});

	describe('detectCircularDependencies - Circular Dependencies', () => {
		it('should detect direct circular dependency (A → B → A)', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'fieldA',
					label: 'Field A',
					type: 'computed',
					required: false,
					order: 1,
					computedConfig: {
						formula: '{fieldB}',
						dependencies: ['fieldB'],
						outputType: 'text'
					}
				},
				{
					key: 'fieldB',
					label: 'Field B',
					type: 'computed',
					required: false,
					order: 2,
					computedConfig: {
						formula: '{fieldA}',
						dependencies: ['fieldA'],
						outputType: 'text'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(true);
			expect(result.cyclePath).toBeDefined();
			expect(result.cyclePath).toContain('fieldA');
			expect(result.cyclePath).toContain('fieldB');
		});

		it('should detect indirect circular dependency (A → B → C → A)', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'fieldA',
					label: 'Field A',
					type: 'computed',
					required: false,
					order: 1,
					computedConfig: {
						formula: '{fieldB}',
						dependencies: ['fieldB'],
						outputType: 'text'
					}
				},
				{
					key: 'fieldB',
					label: 'Field B',
					type: 'computed',
					required: false,
					order: 2,
					computedConfig: {
						formula: '{fieldC}',
						dependencies: ['fieldC'],
						outputType: 'text'
					}
				},
				{
					key: 'fieldC',
					label: 'Field C',
					type: 'computed',
					required: false,
					order: 3,
					computedConfig: {
						formula: '{fieldA}',
						dependencies: ['fieldA'],
						outputType: 'text'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(true);
			expect(result.cyclePath).toBeDefined();
			expect(result.cyclePath?.length).toBeGreaterThanOrEqual(3);
		});

		it('should detect self-referencing field (A → A)', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'fieldA',
					label: 'Field A',
					type: 'computed',
					required: false,
					order: 1,
					computedConfig: {
						formula: '{fieldA} + 1',
						dependencies: ['fieldA'],
						outputType: 'number'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(true);
			expect(result.cyclePath).toEqual(['fieldA', 'fieldA']);
		});

		it('should detect circular dependency in complex graph', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'base',
					label: 'Base',
					type: 'number',
					required: false,
					order: 1
				},
				{
					key: 'calc1',
					label: 'Calc 1',
					type: 'computed',
					required: false,
					order: 2,
					computedConfig: {
						formula: '{base} * 2',
						dependencies: ['base'],
						outputType: 'number'
					}
				},
				{
					key: 'calc2',
					label: 'Calc 2',
					type: 'computed',
					required: false,
					order: 3,
					computedConfig: {
						formula: '{calc1} + {calc3}',
						dependencies: ['calc1', 'calc3'],
						outputType: 'number'
					}
				},
				{
					key: 'calc3',
					label: 'Calc 3',
					type: 'computed',
					required: false,
					order: 4,
					computedConfig: {
						formula: '{calc2} - 5', // Circular: calc2 → calc3 → calc2
						dependencies: ['calc2'],
						outputType: 'number'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(true);
			expect(result.cyclePath).toContain('calc2');
			expect(result.cyclePath).toContain('calc3');
		});
	});

	describe('detectCircularDependencies - Edge Cases', () => {
		it('should handle fields with no computed fields', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'name',
					label: 'Name',
					type: 'text',
					required: false,
					order: 1
				},
				{
					key: 'age',
					label: 'Age',
					type: 'number',
					required: false,
					order: 2
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(false);
		});

		it('should handle empty field list', () => {
			const result = detectCircularDependencies([]);
			expect(result.hasCircular).toBe(false);
		});

		it('should handle computed field with no dependencies', () => {
			const fields: FieldDefinition[] = [
				{
					key: 'static',
					label: 'Static',
					type: 'computed',
					required: false,
					order: 1,
					computedConfig: {
						formula: 'Static Value',
						dependencies: [],
						outputType: 'text'
					}
				}
			];

			const result = detectCircularDependencies(fields);
			expect(result.hasCircular).toBe(false);
		});
	});
});

describe('Validation Error Messages', () => {
	it('should provide clear error message for empty type key', () => {
		const invalidType = {
			type: '',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'purple'
		};

		const result = validateEntityTypeDefinition(invalidType);
		expect(result.errors).toContain('Entity type key cannot be empty');
	});

	it('should provide clear error message for duplicate field key', () => {
		const invalidType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'objective',
					label: 'Objective',
					type: 'text',
					required: true,
					order: 1
				},
				{
					key: 'objective',
					label: 'Objective 2',
					type: 'text',
					required: false,
					order: 2
				}
			],
			defaultRelationships: []
		};

		const result = validateEntityTypeDefinition(invalidType);
		expect(result.errors).toContain('Duplicate field key: objective');
	});

	it('should provide clear error message for missing select options', () => {
		const invalidField: FieldDefinition = {
			key: 'difficulty',
			label: 'Difficulty',
			type: 'select',
			required: false,
			order: 1
		};

		const result = validateFieldDefinition(invalidField);
		expect(result.errors).toContain('Select field "difficulty" must have options');
	});

	it('should provide clear error message for formula circular dependency', () => {
		const fields: FieldDefinition[] = [
			{
				key: 'fieldA',
				label: 'Field A',
				type: 'computed',
				required: false,
				order: 1,
				computedConfig: {
					formula: '{fieldB}',
					dependencies: ['fieldB'],
					outputType: 'text'
				}
			},
			{
				key: 'fieldB',
				label: 'Field B',
				type: 'computed',
				required: false,
				order: 2,
				computedConfig: {
					formula: '{fieldA}',
					dependencies: ['fieldA'],
					outputType: 'text'
				}
			}
		];

		const result = detectCircularDependencies(fields);
		expect(result.hasCircular).toBe(true);
		expect(result.cyclePath).toBeDefined();
	});

	it('should collect multiple errors for invalid entity type', () => {
		const invalidType = {
			type: '', // Empty
			label: '', // Empty
			icon: '',  // Empty
			color: ''  // Empty
		};

		const result = validateEntityTypeDefinition(invalidType);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThanOrEqual(4);
	});
});
