/**
 * Tests for Scene Type Field (Issue #283)
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * Tests will FAIL until the sceneType field is added to the Scene entity definition.
 *
 * Requirements:
 * 1. Add sceneType field to Scene entity type definition
 * 2. Field should be a select dropdown with options: combat, negotiation, exploration, montage, social, investigation
 * 3. Field should be optional (scenes can exist without a type)
 * 4. Field should appear in the Scene entity form
 *
 * Test Coverage:
 * - Scene type field exists in Scene entity definition
 * - Field has correct type (select)
 * - Field has all required options
 * - Field is optional (required: false)
 * - Field has appropriate order placement
 * - Field validation behavior
 * - Field integration with existing Scene fields
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from './entityTypes';
import type { FieldDefinition } from '$lib/types';

describe('entityTypes.ts - Scene Type Field (Issue #283)', () => {
	// Get the Scene entity type from built-in types
	const getSceneEntityType = () => {
		return BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
	};

	describe('Scene Type Field Existence', () => {
		it('should have a sceneType field in Scene entity definition', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField).toBeDefined();
		});

		it('should make sceneType field accessible via getEntityTypeDefinition', () => {
			const sceneType = getEntityTypeDefinition('scene');
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField).toBeDefined();
		});

		it('should not break existing Scene entity definition', () => {
			const sceneType = getSceneEntityType();

			expect(sceneType).toBeDefined();
			expect(sceneType?.type).toBe('scene');
			expect(sceneType?.label).toBe('Scene');
			expect(sceneType?.labelPlural).toBe('Scenes');
		});
	});

	describe('Scene Type Field Configuration', () => {
		it('should have correct field type as select', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.type).toBe('select');
		});

		it('should have label "Scene Type"', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.label).toBe('Scene Type');
		});

		it('should be optional (required: false)', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.required).toBe(false);
		});

		it('should have order value defined', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.order).toBeDefined();
			expect(typeof sceneTypeField?.order).toBe('number');
		});
	});

	describe('Scene Type Field Options', () => {
		it('should have options array defined', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toBeDefined();
			expect(Array.isArray(sceneTypeField?.options)).toBe(true);
		});

		it('should have exactly 6 scene type options', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options?.length).toBe(6);
		});

		it('should include "combat" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('combat');
		});

		it('should include "negotiation" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('negotiation');
		});

		it('should include "exploration" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('exploration');
		});

		it('should include "montage" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('montage');
		});

		it('should include "social" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('social');
		});

		it('should include "investigation" as an option', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.options).toContain('investigation');
		});

		it('should have all required options in array', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const expectedOptions = [
				'combat',
				'negotiation',
				'exploration',
				'montage',
				'social',
				'investigation'
			];

			expectedOptions.forEach((option) => {
				expect(sceneTypeField?.options).toContain(option);
			});
		});

		it('should not have duplicate options', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const options = sceneTypeField?.options ?? [];
			const uniqueOptions = new Set(options);

			expect(uniqueOptions.size).toBe(options.length);
		});

		it('should only contain the specified options (no extras)', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const expectedOptions = [
				'combat',
				'negotiation',
				'exploration',
				'montage',
				'social',
				'investigation'
			];

			const options = sceneTypeField?.options ?? [];

			expect(options.sort()).toEqual(expectedOptions.sort());
		});
	});

	describe('Scene Type Field Placement', () => {
		it('should be positioned before location field', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const locationField = sceneType?.fieldDefinitions.find((f) => f.key === 'location');

			expect(sceneTypeField?.order).toBeDefined();
			expect(locationField?.order).toBeDefined();
			expect(sceneTypeField!.order).toBeLessThan(locationField!.order);
		});

		it('should be positioned after sceneStatus field', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const sceneStatusField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');

			expect(sceneTypeField?.order).toBeDefined();
			expect(sceneStatusField?.order).toBeDefined();
			expect(sceneTypeField!.order).toBeGreaterThan(sceneStatusField!.order);
		});

		it('should maintain logical field ordering in Scene entity', () => {
			const sceneType = getSceneEntityType();
			const fields = sceneType?.fieldDefinitions ?? [];

			// Sort fields by order
			const sortedFields = [...fields].sort((a, b) => a.order - b.order);

			// Find sceneType position
			const sceneTypeIndex = sortedFields.findIndex((f) => f.key === 'sceneType');
			const sceneStatusIndex = sortedFields.findIndex((f) => f.key === 'sceneStatus');
			const locationIndex = sortedFields.findIndex((f) => f.key === 'location');

			// Verify logical order: sceneStatus < sceneType < location
			expect(sceneStatusIndex).toBeLessThan(sceneTypeIndex);
			expect(sceneTypeIndex).toBeLessThan(locationIndex);
		});
	});

	describe('Scene Type Field Integration', () => {
		it('should not conflict with existing Scene fields', () => {
			const sceneType = getSceneEntityType();
			const fieldKeys = sceneType?.fieldDefinitions.map((f) => f.key) ?? [];

			// Count sceneType occurrences (should be exactly 1)
			const sceneTypeCount = fieldKeys.filter((key) => key === 'sceneType').length;
			expect(sceneTypeCount).toBe(1);
		});

		it('should preserve all existing Scene fields', () => {
			const sceneType = getSceneEntityType();
			const fieldKeys = sceneType?.fieldDefinitions.map((f) => f.key) ?? [];

			const expectedExistingFields = [
				'sceneStatus',
				'location',
				'npcsPresent',
				'sceneSettingText',
				'whatHappened',
				'preSummary',
				'postSummary',
				'mood',
				'session'
			];

			expectedExistingFields.forEach((fieldKey) => {
				expect(fieldKeys).toContain(fieldKey);
			});
		});

		it('should increase total Scene field count by 1', () => {
			const sceneType = getSceneEntityType();
			const fields = sceneType?.fieldDefinitions ?? [];

			// Scene originally has 9 fields, should now have 14
			expect(fields.length).toBe(14);
		});

		it('should work with existing Scene entity methods', () => {
			const sceneTypeDef = getEntityTypeDefinition('scene');
			const sceneTypeField = sceneTypeDef?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField).toBeDefined();
			expect(sceneTypeDef?.type).toBe('scene');
		});
	});

	describe('Scene Type Field Validation', () => {
		it('should allow empty/null value since field is optional', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			// Optional field should not require a value
			expect(sceneTypeField?.required).toBe(false);
		});

		it('should accept any of the defined options as valid values', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const validOptions = sceneTypeField?.options ?? [];

			// Each option should be a valid string
			validOptions.forEach((option) => {
				expect(typeof option).toBe('string');
				expect(option.length).toBeGreaterThan(0);
			});
		});

		it('should not have a default value', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			// No default value should be set for this optional field
			expect(sceneTypeField?.defaultValue).toBeUndefined();
		});
	});

	describe('Scene Type Field Properties', () => {
		it('should not have placeholder text', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			// Select fields typically don't have placeholders
			expect(sceneTypeField?.placeholder).toBeUndefined();
		});

		it('should not have help text', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			// Field purpose should be clear from label
			expect(sceneTypeField?.helpText).toBeUndefined();
		});

		it('should not have a section specified', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			// Field should appear in main section, not hidden or separate
			expect(sceneTypeField?.section).toBeUndefined();
		});

		it('should have key exactly as "sceneType"', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.key).toBe('sceneType');
		});
	});

	describe('Scene Type Field Type Safety', () => {
		it('should have valid FieldDefinition structure', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find(
				(f) => f.key === 'sceneType'
			) as FieldDefinition | undefined;

			expect(sceneTypeField).toBeDefined();
			expect(sceneTypeField?.key).toBeTruthy();
			expect(sceneTypeField?.label).toBeTruthy();
			expect(sceneTypeField?.type).toBeTruthy();
			expect(typeof sceneTypeField?.required).toBe('boolean');
			expect(typeof sceneTypeField?.order).toBe('number');
		});

		it('should have options as string array', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(Array.isArray(sceneTypeField?.options)).toBe(true);

			sceneTypeField?.options?.forEach((option) => {
				expect(typeof option).toBe('string');
			});
		});

		it('should not have entityTypes property (only for entity-ref fields)', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.entityTypes).toBeUndefined();
		});

		it('should not have computedConfig property', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			expect(sceneTypeField?.computedConfig).toBeUndefined();
		});
	});

	describe('Scene Type Field Options Case', () => {
		it('should have all options in lowercase', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const options = sceneTypeField?.options ?? [];

			options.forEach((option) => {
				expect(option).toBe(option.toLowerCase());
			});
		});

		it('should not have spaces in option values', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');

			const options = sceneTypeField?.options ?? [];

			options.forEach((option) => {
				expect(option).not.toContain(' ');
			});
		});
	});

	describe('Scene Entity Type Integrity', () => {
		it('should maintain Scene entity isBuiltIn property', () => {
			const sceneType = getSceneEntityType();

			expect(sceneType?.isBuiltIn).toBe(true);
		});

		it('should maintain Scene entity icon', () => {
			const sceneType = getSceneEntityType();

			expect(sceneType?.icon).toBe('theater');
		});

		it('should maintain Scene entity color', () => {
			const sceneType = getSceneEntityType();

			expect(sceneType?.color).toBe('scene');
		});

		it('should maintain Scene entity default relationships', () => {
			const sceneType = getSceneEntityType();

			const expectedRelationships = ['occurred_at', 'featured', 'part_of', 'leads_to', 'follows'];

			expectedRelationships.forEach((rel) => {
				expect(sceneType?.defaultRelationships).toContain(rel);
			});
		});

		it('should not modify other Scene fields during addition', () => {
			const sceneType = getSceneEntityType();

			// Verify critical existing fields remain unchanged
			const sceneStatusField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
			const locationField = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
			const moodField = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');

			expect(sceneStatusField?.type).toBe('select');
			expect(locationField?.type).toBe('entity-ref');
			expect(moodField?.type).toBe('select');
		});
	});

	describe('Scene Type Field Comparison with Similar Fields', () => {
		it('should follow same pattern as mood field (select with options)', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const moodField = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');

			expect(sceneTypeField?.type).toBe(moodField?.type); // Both select
			expect(Array.isArray(sceneTypeField?.options)).toBe(true);
			expect(Array.isArray(moodField?.options)).toBe(true);
		});

		it('should be optional like mood field', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const moodField = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');

			expect(sceneTypeField?.required).toBe(moodField?.required); // Both optional
		});

		it('should differ from sceneStatus which is required', () => {
			const sceneType = getSceneEntityType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const sceneStatusField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');

			expect(sceneTypeField?.required).toBe(false);
			expect(sceneStatusField?.required).toBe(true);
		});
	});
});
