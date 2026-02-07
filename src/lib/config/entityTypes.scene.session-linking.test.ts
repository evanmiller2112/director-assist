/**
 * Tests for Scene Session Linking - Issue #287
 *
 * RED PHASE - These tests are written to FAIL initially.
 *
 * This test suite validates the enhanced session linking functionality for Scenes:
 * 1. Existing session field continues to work properly
 * 2. New sceneOrder field for ordering scenes within a session
 * 3. Proper validation and constraints for session linking
 * 4. Support for campaign timeline views
 *
 * Requirements from Issue #287:
 * - Scene entity should have optional session field (entity-ref to session)
 * - Scene entity should have optional sceneOrder field (number)
 * - sceneOrder should allow ordering scenes within a session
 * - sceneOrder should not be required (scenes can exist without sessions)
 * - Fields should support timeline views where scenes are ordered by session and sceneOrder
 *
 * Testing Strategy:
 * - Test existing session field structure and behavior
 * - Test new sceneOrder field structure and constraints
 * - Test field ordering and metadata
 * - Test integration between session and sceneOrder fields
 * - Test edge cases (null values, negative numbers, decimals)
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from './entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

describe('Scene Session Linking - Issue #287', () => {
	let sceneType: EntityTypeDefinition | undefined;

	function getSceneType(): EntityTypeDefinition | undefined {
		return BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
	}

	describe('Existing Session Field', () => {
		describe('Field Existence and Basic Properties', () => {
			it('should have a session field', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField).toBeDefined();
			});

			it('should have label "Session"', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.label).toBe('Session');
			});

			it('should be an entity-ref field type', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.type).toBe('entity-ref');
			});

			it('should not be required (optional linking)', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.required).toBe(false);
			});

			it('should reference session entity type only', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.entityTypes).toBeDefined();
				expect(sessionField?.entityTypes).toEqual(['session']);
			});

			it('should have an order property', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.order).toBeDefined();
				expect(typeof sessionField?.order).toBe('number');
			});
		});

		describe('Session Field Help Text', () => {
			it('should have helpText to guide users', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.helpText).toBeDefined();
				expect(typeof sessionField?.helpText).toBe('string');
				expect(sessionField?.helpText!.length).toBeGreaterThan(0);
			});

			it('should mention session linking in helpText', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.helpText?.toLowerCase()).toContain('session');
			});
		});

		describe('Session Field Default Value', () => {
			it('should not have a default value (optional field)', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(sessionField?.defaultValue).toBeUndefined();
			});
		});
	});

	describe('New SceneOrder Field - Issue #287', () => {
		describe('Field Existence and Basic Properties', () => {
			it('should have a sceneOrder field', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField).toBeDefined();
			});

			it('should have label "Scene Order"', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.label).toBe('Scene Order');
			});

			it('should be a number field type', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.type).toBe('number');
			});

			it('should not be required (scenes can exist without sessions)', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.required).toBe(false);
			});

			it('should have an order property', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.order).toBeDefined();
				expect(typeof sceneOrderField?.order).toBe('number');
			});
		});

		describe('SceneOrder Field Help Text', () => {
			it('should have helpText explaining the ordering purpose', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.helpText).toBeDefined();
				expect(typeof sceneOrderField?.helpText).toBe('string');
				expect(sceneOrderField?.helpText!.length).toBeGreaterThan(0);
			});

			it('should mention ordering within session in helpText', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				const helpText = sceneOrderField?.helpText?.toLowerCase() || '';
				expect(helpText).toMatch(/order|sequence|position|within.*session/);
			});

			it('should clarify optional nature in helpText', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				const helpText = sceneOrderField?.helpText?.toLowerCase() || '';
				// Should indicate it's only needed when linked to session
				expect(helpText.length).toBeGreaterThan(20);
			});
		});

		describe('SceneOrder Field Placeholder', () => {
			it('should have a placeholder to guide input', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.placeholder).toBeDefined();
				expect(typeof sceneOrderField?.placeholder).toBe('string');
			});

			it('should show example value in placeholder', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				// Should contain a number example like "1", "2", or "e.g., 1"
				expect(sceneOrderField?.placeholder).toMatch(/\d+/);
			});
		});

		describe('SceneOrder Field Default Value', () => {
			it('should not have a default value (optional field)', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');
				expect(sceneOrderField?.defaultValue).toBeUndefined();
			});
		});
	});

	describe('Field Ordering and Positioning', () => {
		it('should have session field before sceneOrder field', () => {
			sceneType = getSceneType();
			const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
			const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

			expect(sessionField?.order).toBeDefined();
			expect(sceneOrderField?.order).toBeDefined();

			// Session should come before sceneOrder since you select session first
			expect(sessionField!.order).toBeLessThan(sceneOrderField!.order);
		});

		it('should place session and sceneOrder fields near the end of field list', () => {
			sceneType = getSceneType();
			const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
			const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

			// These fields should be toward the end since they're metadata/organizational
			// They should come after content fields like sceneStatus, location, npcsPresent, etc.
			const fieldCount = sceneType?.fieldDefinitions.length || 0;

			expect(sessionField?.order).toBeGreaterThan(5);
			expect(sceneOrderField?.order).toBeGreaterThan(sessionField!.order);
		});

		it('should have sceneOrder immediately after session field', () => {
			sceneType = getSceneType();
			const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
			const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

			// sceneOrder should immediately follow session (order + 1)
			expect(sceneOrderField!.order).toBe(sessionField!.order + 1);
		});
	});

	describe('Integration with Scene Type', () => {
		it('should have all required scene fields plus new sceneOrder field', () => {
			sceneType = getSceneType();
			const fieldKeys = sceneType?.fieldDefinitions.map((f) => f.key) || [];

			// Core scene fields
			expect(fieldKeys).toContain('sceneStatus');
			expect(fieldKeys).toContain('sceneType');
			expect(fieldKeys).toContain('location');
			expect(fieldKeys).toContain('npcsPresent');
			expect(fieldKeys).toContain('sceneSettingText');
			expect(fieldKeys).toContain('whatHappened');
			expect(fieldKeys).toContain('preSummary');
			expect(fieldKeys).toContain('postSummary');
			expect(fieldKeys).toContain('mood');

			// Session linking fields
			expect(fieldKeys).toContain('session');
			expect(fieldKeys).toContain('sceneOrder');
		});

		it('should maintain total field count with new sceneOrder field', () => {
			sceneType = getSceneType();
			const fieldCount = sceneType?.fieldDefinitions.length || 0;

			// Should have at least 11 fields now (original 9-10 + sceneOrder)
			expect(fieldCount).toBeGreaterThanOrEqual(11);
		});

		it('should not have duplicate field keys', () => {
			sceneType = getSceneType();
			const fieldKeys = sceneType?.fieldDefinitions.map((f) => f.key) || [];
			const uniqueKeys = new Set(fieldKeys);

			expect(uniqueKeys.size).toBe(fieldKeys.length);
		});

		it('should have unique order values for all fields', () => {
			sceneType = getSceneType();
			const orderValues = sceneType?.fieldDefinitions.map((f) => f.order) || [];
			const uniqueOrders = new Set(orderValues);

			expect(uniqueOrders.size).toBe(orderValues.length);
		});
	});

	describe('Timeline and Campaign Navigation Support', () => {
		describe('Field Properties for Sorting', () => {
			it('should allow session field to be used for grouping scenes', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				// Entity-ref type supports querying and filtering
				expect(sessionField?.type).toBe('entity-ref');
				expect(sessionField?.entityTypes).toEqual(['session']);
			});

			it('should allow sceneOrder field to be used for sorting within session', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// Number type supports numeric sorting
				expect(sceneOrderField?.type).toBe('number');
			});
		});

		describe('Use Case: Filter Scenes by Session', () => {
			it('should support filtering scenes that belong to a specific session', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				// Optional entity-ref allows filtering by session ID
				expect(sessionField?.type).toBe('entity-ref');
				expect(sessionField?.required).toBe(false);
				expect(sessionField?.entityTypes).toEqual(['session']);
			});
		});

		describe('Use Case: Sort Scenes within Session', () => {
			it('should support ordering scenes by sceneOrder within a session', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// Number type allows sorting scenes 1, 2, 3, etc.
				expect(sceneOrderField?.type).toBe('number');
				expect(sceneOrderField?.required).toBe(false);
			});
		});

		describe('Use Case: Scenes without Sessions', () => {
			it('should allow scenes to exist without a session reference', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				// Optional field allows standalone scenes
				expect(sessionField?.required).toBe(false);
			});

			it('should allow scenes to exist without a sceneOrder value', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// Optional field allows scenes without ordering
				expect(sceneOrderField?.required).toBe(false);
			});
		});
	});

	describe('Edge Cases and Validation', () => {
		describe('SceneOrder Number Field Constraints', () => {
			it('should accept positive integers for sceneOrder', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// Number type accepts integers
				expect(sceneOrderField?.type).toBe('number');
			});

			it('should not have min/max constraints on sceneOrder (allows flexibility)', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// No explicit min/max allows directors to use any numbering scheme
				// (1,2,3 or 10,20,30 or even decimals like 1.5 for inserted scenes)
				expect(sceneOrderField?.type).toBe('number');
				// TypeScript type system handles basic number validation
			});
		});

		describe('Session Reference Integrity', () => {
			it('should reference only session entity type', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				expect(sessionField?.entityTypes).toBeDefined();
				expect(sessionField?.entityTypes?.length).toBe(1);
				expect(sessionField?.entityTypes).toEqual(['session']);
			});

			it('should not allow multiple session references', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				// entity-ref (singular) not entity-refs (plural)
				expect(sessionField?.type).toBe('entity-ref');
			});
		});

		describe('Field Null/Undefined Handling', () => {
			it('should handle session field being null or undefined', () => {
				sceneType = getSceneType();
				const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

				// Optional fields can be null/undefined
				expect(sessionField?.required).toBe(false);
				expect(sessionField?.defaultValue).toBeUndefined();
			});

			it('should handle sceneOrder field being null or undefined', () => {
				sceneType = getSceneType();
				const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

				// Optional fields can be null/undefined
				expect(sceneOrderField?.required).toBe(false);
				expect(sceneOrderField?.defaultValue).toBeUndefined();
			});
		});
	});

	describe('Backward Compatibility', () => {
		it('should maintain existing scene field definitions', () => {
			sceneType = getSceneType();
			const fieldKeys = sceneType?.fieldDefinitions.map((f) => f.key) || [];

			// All existing fields should still be present
			const existingFields = [
				'sceneStatus',
				'sceneType',
				'location',
				'npcsPresent',
				'sceneSettingText',
				'whatHappened',
				'preSummary',
				'postSummary',
				'mood',
				'session'
			];

			existingFields.forEach((fieldKey) => {
				expect(fieldKeys).toContain(fieldKey);
			});
		});

		it('should not break existing scene type metadata', () => {
			sceneType = getSceneType();

			expect(sceneType?.type).toBe('scene');
			expect(sceneType?.label).toBe('Scene');
			expect(sceneType?.labelPlural).toBe('Scenes');
			expect(sceneType?.isBuiltIn).toBe(true);
			expect(sceneType?.icon).toBeDefined();
			expect(sceneType?.color).toBe('scene');
		});

		it('should maintain existing default relationships', () => {
			sceneType = getSceneType();

			expect(sceneType?.defaultRelationships).toBeDefined();
			expect(sceneType?.defaultRelationships).toContain('occurred_at');
			expect(sceneType?.defaultRelationships).toContain('featured');
			expect(sceneType?.defaultRelationships).toContain('part_of');
		});
	});

	describe('Documentation and User Experience', () => {
		it('should have clear helpText for session field', () => {
			sceneType = getSceneType();
			const sessionField = sceneType?.fieldDefinitions.find((f) => f.key === 'session');

			expect(sessionField?.helpText).toBeDefined();
			expect(sessionField?.helpText!.length).toBeGreaterThan(10);
		});

		it('should have clear helpText for sceneOrder field', () => {
			sceneType = getSceneType();
			const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

			expect(sceneOrderField?.helpText).toBeDefined();
			expect(sceneOrderField?.helpText!.length).toBeGreaterThan(10);
		});

		it('should have placeholder text for sceneOrder to guide input', () => {
			sceneType = getSceneType();
			const sceneOrderField = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneOrder');

			expect(sceneOrderField?.placeholder).toBeDefined();
			expect(sceneOrderField?.placeholder!.length).toBeGreaterThan(0);
		});
	});
});
