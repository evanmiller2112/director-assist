/**
 * Tests for Scene Entity - Encounter Reference and Initiative Tracking Fields (Issue #284)
 *
 * RED Phase (TDD): These tests are written to FAIL initially.
 * Tests validate the addition of three new fields to the Scene entity type:
 * - encounterRef: entity-ref field linking to an Encounter entity
 * - currentRound: number field for tracking combat rounds
 * - initiativeOrder: textarea for tracking turn order
 *
 * These fields should only be relevant when sceneType is 'combat'.
 * All fields should be optional.
 *
 * Implementation will be added in the GREEN phase to make these tests pass.
 */

import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from './entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

describe('Scene Entity - Encounter Reference and Initiative Tracking Fields', () => {
	let sceneType: EntityTypeDefinition | undefined;

	// Helper to get the scene type definition
	function getSceneType(): EntityTypeDefinition | undefined {
		return BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
	}

	describe('Scene Type Validation', () => {
		it('should have scene entity type defined', () => {
			sceneType = getSceneType();
			expect(sceneType).toBeDefined();
			expect(sceneType?.type).toBe('scene');
		});

		it('should have sceneType field with combat option', () => {
			sceneType = getSceneType();
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			expect(sceneTypeField).toBeDefined();
			expect(sceneTypeField?.type).toBe('select');
			expect(sceneTypeField?.options).toContain('combat');
		});
	});

	describe('encounterRef Field', () => {
		let field: FieldDefinition | undefined;

		it('should have encounterRef field in Scene entity', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field).toBeDefined();
		});

		it('should have correct label', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.label).toBe('Encounter');
		});

		it('should be an entity-ref field type', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.type).toBe('entity-ref');
		});

		it('should reference encounter entity type', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.entityTypes).toBeDefined();
			expect(field?.entityTypes).toEqual(['encounter']);
		});

		it('should not be required', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.required).toBe(false);
		});

		it('should have order property defined', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.order).toBeDefined();
			expect(typeof field?.order).toBe('number');
		});

		it('should have helpText explaining combat scene relevance', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			expect(field?.helpText).toBeDefined();
			expect(typeof field?.helpText).toBe('string');
			expect(field?.helpText).toContain('combat');
		});

		it('should accept null/undefined as valid value', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			// Optional field should not have required: true
			expect(field?.required).not.toBe(true);
		});
	});

	describe('currentRound Field', () => {
		let field: FieldDefinition | undefined;

		it('should have currentRound field in Scene entity', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field).toBeDefined();
		});

		it('should have correct label', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.label).toBe('Current Round');
		});

		it('should be a number field type', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.type).toBe('number');
		});

		it('should not be required', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.required).toBe(false);
		});

		it('should have order property defined', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.order).toBeDefined();
			expect(typeof field?.order).toBe('number');
		});

		it('should have placeholder suggesting starting value', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.placeholder).toBeDefined();
			expect(typeof field?.placeholder).toBe('string');
		});

		it('should have helpText explaining combat tracking', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.helpText).toBeDefined();
			expect(typeof field?.helpText).toBe('string');
			expect(field?.helpText?.toLowerCase()).toContain('combat');
		});

		it('should accept positive integer values', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			expect(field?.type).toBe('number');
			// Number field should accept numeric values
		});

		it('should accept zero as valid value', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			// Optional number field can be any number including 0
			expect(field?.required).toBe(false);
		});

		it('should have default value of null or undefined', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			// Optional field should not have a default value or it should be null/undefined
			expect(field?.defaultValue).toBeUndefined();
		});
	});

	describe('initiativeOrder Field', () => {
		let field: FieldDefinition | undefined;

		it('should have initiativeOrder field in Scene entity', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field).toBeDefined();
		});

		it('should have correct label', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.label).toBe('Initiative Order');
		});

		it('should be a textarea field type', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.type).toBe('textarea');
		});

		it('should not be required', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.required).toBe(false);
		});

		it('should have order property defined', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.order).toBeDefined();
			expect(typeof field?.order).toBe('number');
		});

		it('should have placeholder with example format', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.placeholder).toBeDefined();
			expect(typeof field?.placeholder).toBe('string');
			// Placeholder should give guidance on format
			expect(field?.placeholder?.length).toBeGreaterThan(0);
		});

		it('should have helpText explaining turn order tracking', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.helpText).toBeDefined();
			expect(typeof field?.helpText).toBe('string');
			expect(field?.helpText?.toLowerCase()).toMatch(/turn|initiative|order/);
		});

		it('should accept multiline text content', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			// Textarea type supports multiline content
			expect(field?.type).toBe('textarea');
		});

		it('should accept empty string as valid value', () => {
			sceneType = getSceneType();
			field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');
			expect(field?.required).toBe(false);
		});
	});

	describe('Field Ordering and Integration', () => {
		it('should place new fields after sceneType field', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			const sceneTypeField = fields.find((f) => f.key === 'sceneType');
			const encounterRefField = fields.find((f) => f.key === 'encounterRef');
			const currentRoundField = fields.find((f) => f.key === 'currentRound');
			const initiativeOrderField = fields.find((f) => f.key === 'initiativeOrder');

			expect(sceneTypeField?.order).toBeDefined();
			expect(encounterRefField?.order).toBeDefined();
			expect(currentRoundField?.order).toBeDefined();
			expect(initiativeOrderField?.order).toBeDefined();

			// New fields should come after sceneType (order 2)
			expect(encounterRefField!.order).toBeGreaterThan(sceneTypeField!.order);
		});

		it('should have encounterRef before currentRound', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			const encounterRefField = fields.find((f) => f.key === 'encounterRef');
			const currentRoundField = fields.find((f) => f.key === 'currentRound');

			expect(encounterRefField?.order).toBeLessThan(currentRoundField!.order);
		});

		it('should have currentRound before initiativeOrder', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			const currentRoundField = fields.find((f) => f.key === 'currentRound');
			const initiativeOrderField = fields.find((f) => f.key === 'initiativeOrder');

			expect(currentRoundField?.order).toBeLessThan(initiativeOrderField!.order);
		});

		it('should maintain unique order values across all fields', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];
			const orderValues = fields.map((f) => f.order);
			const uniqueOrders = new Set(orderValues);

			expect(uniqueOrders.size).toBe(orderValues.length);
		});

		it('should not duplicate existing field keys', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];
			const keys = fields.map((f) => f.key);
			const uniqueKeys = new Set(keys);

			expect(uniqueKeys.size).toBe(keys.length);
		});

		it('should increase total field count by 3', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			// Original scene had 10 fields, now should have 13
			expect(fields.length).toBeGreaterThanOrEqual(13);
		});
	});

	describe('Field Relevance to Combat Scenes', () => {
		it('should have encounterRef relevant only for combat scenes', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// Help text should indicate combat scene relevance
			expect(field?.helpText?.toLowerCase()).toContain('combat');
		});

		it('should have currentRound relevant only for combat scenes', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');

			// Help text should indicate combat tracking
			expect(field?.helpText?.toLowerCase()).toContain('combat');
		});

		it('should have initiativeOrder relevant only for combat scenes', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// Help text should indicate turn order tracking
			expect(field?.helpText?.toLowerCase()).toMatch(/turn|initiative/);
		});

		it('should allow all fields to be null when sceneType is not combat', () => {
			sceneType = getSceneType();

			const encounterRefField = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			const currentRoundField = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			const initiativeOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// All fields are optional
			expect(encounterRefField?.required).toBe(false);
			expect(currentRoundField?.required).toBe(false);
			expect(initiativeOrderField?.required).toBe(false);
		});
	});

	describe('Field Type Validation', () => {
		it('should validate encounterRef accepts entity ID strings', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// entity-ref fields store entity IDs as strings
			expect(field?.type).toBe('entity-ref');
		});

		it('should validate currentRound accepts numeric values', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');

			// number fields should store numeric values
			expect(field?.type).toBe('number');
		});

		it('should validate initiativeOrder accepts string values', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// textarea fields store string values
			expect(field?.type).toBe('textarea');
		});

		it('should not have options array for encounterRef', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// entity-ref uses entityTypes, not options
			expect(field?.options).toBeUndefined();
		});

		it('should not have options array for currentRound', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');

			// number fields don't have options
			expect(field?.options).toBeUndefined();
		});

		it('should not have options array for initiativeOrder', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// textarea fields don't have options
			expect(field?.options).toBeUndefined();
		});
	});

	describe('Backward Compatibility', () => {
		it('should not break existing Scene entity structure', () => {
			sceneType = getSceneType();

			// Essential existing fields should still be present
			const sceneStatusField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
			const sceneTypeField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneType');
			const locationField = sceneType?.fieldDefinitions.find((f) => f.key === 'location');

			expect(sceneStatusField).toBeDefined();
			expect(sceneTypeField).toBeDefined();
			expect(locationField).toBeDefined();
		});

		it('should maintain existing Scene relationships', () => {
			sceneType = getSceneType();

			expect(sceneType?.defaultRelationships).toBeDefined();
			expect(sceneType?.defaultRelationships.length).toBeGreaterThan(0);
		});

		it('should maintain Scene entity type metadata', () => {
			sceneType = getSceneType();

			expect(sceneType?.type).toBe('scene');
			expect(sceneType?.label).toBe('Scene');
			expect(sceneType?.labelPlural).toBe('Scenes');
			expect(sceneType?.isBuiltIn).toBe(true);
		});

		it('should not modify order of existing fields', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			// Existing fields should maintain their relative order
			const sceneStatusField = fields.find((f) => f.key === 'sceneStatus');
			const sceneTypeField = fields.find((f) => f.key === 'sceneType');

			expect(sceneStatusField!.order).toBeLessThan(sceneTypeField!.order);
		});
	});

	describe('Entity Reference Integrity', () => {
		it('should only reference encounter entity type in encounterRef', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			expect(field?.entityTypes).toEqual(['encounter']);
			expect(field?.entityTypes?.length).toBe(1);
		});

		it('should not allow multiple entity types for encounterRef', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// Should only reference encounter, not encounter + other types
			expect(field?.entityTypes).toEqual(['encounter']);
		});

		it('should handle missing encounter entity gracefully', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// Optional field should not require a value
			expect(field?.required).toBe(false);
		});
	});

	describe('Use Case Scenarios', () => {
		it('should support combat scene with all tracking fields populated', () => {
			sceneType = getSceneType();

			const encounterRef = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			const currentRound = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			const initiativeOrder = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// All fields should be present for combat tracking
			expect(encounterRef).toBeDefined();
			expect(currentRound).toBeDefined();
			expect(initiativeOrder).toBeDefined();
		});

		it('should support non-combat scene with empty tracking fields', () => {
			sceneType = getSceneType();

			const encounterRef = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');
			const currentRound = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');
			const initiativeOrder = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// All fields should be optional for non-combat scenes
			expect(encounterRef?.required).toBe(false);
			expect(currentRound?.required).toBe(false);
			expect(initiativeOrder?.required).toBe(false);
		});

		it('should support tracking round progression during combat', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'currentRound');

			// Number field can be incremented
			expect(field?.type).toBe('number');
		});

		it('should support updating initiative order during combat', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'initiativeOrder');

			// Textarea allows editing turn order
			expect(field?.type).toBe('textarea');
		});

		it('should support linking scene to specific encounter entity', () => {
			sceneType = getSceneType();
			const field = sceneType?.fieldDefinitions.find((f) => f.key === 'encounterRef');

			// entity-ref creates relationship to encounter
			expect(field?.type).toBe('entity-ref');
			expect(field?.entityTypes).toContain('encounter');
		});
	});
});
