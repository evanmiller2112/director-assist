/**
 * Tests for Scene Entity Type Definition
 *
 * This is the RED phase of TDD - tests written to FAIL initially.
 * These tests validate the Scene entity type structure:
 * - Type exists in BUILT_IN_ENTITY_TYPES
 * - Has correct metadata (label, icon, color, etc.)
 * - Has all required field definitions
 * - Field types and options are correct
 *
 * Implementation will be added in the GREEN phase to make these tests pass.
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from './entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

describe('Scene Entity Type Definition', () => {
	let sceneType: EntityTypeDefinition | undefined;

	// Helper to get the scene type definition
	function getSceneType(): EntityTypeDefinition | undefined {
		return BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'scene');
	}

	describe('Scene Type Existence', () => {
		it('should exist in BUILT_IN_ENTITY_TYPES', () => {
			sceneType = getSceneType();
			expect(sceneType).toBeDefined();
		});

		it('should be retrievable via getEntityTypeDefinition', () => {
			const scene = getEntityTypeDefinition('scene');
			expect(scene).toBeDefined();
			expect(scene?.type).toBe('scene');
		});
	});

	describe('Scene Type Metadata', () => {
		it('should have correct type identifier', () => {
			sceneType = getSceneType();
			expect(sceneType?.type).toBe('scene');
		});

		it('should have singular label "Scene"', () => {
			sceneType = getSceneType();
			expect(sceneType?.label).toBe('Scene');
		});

		it('should have plural label "Scenes"', () => {
			sceneType = getSceneType();
			expect(sceneType?.labelPlural).toBe('Scenes');
		});

		it('should have an icon defined', () => {
			sceneType = getSceneType();
			expect(sceneType?.icon).toBeDefined();
			expect(typeof sceneType?.icon).toBe('string');
			expect(sceneType?.icon.length).toBeGreaterThan(0);
		});

		it('should have color "scene"', () => {
			sceneType = getSceneType();
			expect(sceneType?.color).toBe('scene');
		});

		it('should be marked as built-in', () => {
			sceneType = getSceneType();
			expect(sceneType?.isBuiltIn).toBe(true);
		});

		it('should have default relationships defined', () => {
			sceneType = getSceneType();
			expect(sceneType?.defaultRelationships).toBeDefined();
			expect(Array.isArray(sceneType?.defaultRelationships)).toBe(true);
		});
	});

	describe('Scene Field Definitions', () => {
		it('should have field definitions array', () => {
			sceneType = getSceneType();
			expect(sceneType?.fieldDefinitions).toBeDefined();
			expect(Array.isArray(sceneType?.fieldDefinitions)).toBe(true);
		});

		it('should have at least 9 field definitions', () => {
			sceneType = getSceneType();
			expect(sceneType?.fieldDefinitions.length).toBeGreaterThanOrEqual(9);
		});

		describe('sceneStatus Field', () => {
			let field: FieldDefinition | undefined;

			it('should have sceneStatus field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.label).toBe('Status');
			});

			it('should be a select field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.type).toBe('select');
			});

			it('should have exactly 3 options', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.options?.length).toBe(3);
			});

			it('should have correct status options', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.options).toEqual(['planned', 'in_progress', 'completed']);
			});

			it('should be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.required).toBe(true);
			});

			it('should have default value "planned"', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneStatus');
				expect(field?.defaultValue).toBe('planned');
			});
		});

		describe('location Field', () => {
			let field: FieldDefinition | undefined;

			it('should have location field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
				expect(field?.label).toBe('Location');
			});

			it('should be an entity-ref field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
				expect(field?.type).toBe('entity-ref');
			});

			it('should reference location entity type', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
				expect(field?.entityTypes).toEqual(['location']);
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'location');
				expect(field?.required).toBe(false);
			});
		});

		describe('npcsPresent Field', () => {
			let field: FieldDefinition | undefined;

			it('should have npcsPresent field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'npcsPresent');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'npcsPresent');
				expect(field?.label).toBe('NPCs Present');
			});

			it('should be an entity-refs field for multiple references', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'npcsPresent');
				expect(field?.type).toBe('entity-refs');
			});

			it('should reference npc entity type', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'npcsPresent');
				expect(field?.entityTypes).toEqual(['npc']);
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'npcsPresent');
				expect(field?.required).toBe(false);
			});
		});

		describe('sceneSettingText Field', () => {
			let field: FieldDefinition | undefined;

			it('should have sceneSettingText field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneSettingText');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneSettingText');
				expect(field?.label).toBe('Scene Setting (Read-Aloud)');
			});

			it('should be a richtext field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneSettingText');
				expect(field?.type).toBe('richtext');
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneSettingText');
				expect(field?.required).toBe(false);
			});

			it('should have helpText indicating AI generation', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'sceneSettingText');
				expect(field?.helpText).toBeDefined();
				expect(field?.helpText).toContain('AI');
			});
		});

		describe('whatHappened Field', () => {
			let field: FieldDefinition | undefined;

			it('should have whatHappened field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'whatHappened');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'whatHappened');
				expect(field?.label).toBe('What Happened');
			});

			it('should be a richtext field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'whatHappened');
				expect(field?.type).toBe('richtext');
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'whatHappened');
				expect(field?.required).toBe(false);
			});

			it('should have helpText for recording events', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'whatHappened');
				expect(field?.helpText).toBeDefined();
				expect(typeof field?.helpText).toBe('string');
			});
		});

		describe('preSummary Field', () => {
			let field: FieldDefinition | undefined;

			it('should have preSummary field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'preSummary');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'preSummary');
				expect(field?.label).toBe('Pre-Scene Summary');
			});

			it('should be a richtext field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'preSummary');
				expect(field?.type).toBe('richtext');
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'preSummary');
				expect(field?.required).toBe(false);
			});

			it('should have helpText indicating AI summary', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'preSummary');
				expect(field?.helpText).toBeDefined();
				expect(field?.helpText).toContain('AI');
			});
		});

		describe('postSummary Field', () => {
			let field: FieldDefinition | undefined;

			it('should have postSummary field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'postSummary');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'postSummary');
				expect(field?.label).toBe('Post-Scene Summary');
			});

			it('should be a richtext field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'postSummary');
				expect(field?.type).toBe('richtext');
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'postSummary');
				expect(field?.required).toBe(false);
			});

			it('should have helpText indicating AI summary', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'postSummary');
				expect(field?.helpText).toBeDefined();
				expect(field?.helpText).toContain('AI');
			});
		});

		describe('mood Field', () => {
			let field: FieldDefinition | undefined;

			it('should have mood field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field?.label).toBe('Mood');
			});

			it('should be a select field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field?.type).toBe('select');
			});

			it('should have exactly 8 mood options', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field?.options?.length).toBe(11);
			});

			it('should have correct mood options', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field?.options).toEqual([
					'tense',
					'relaxed',
					'mysterious',
					'celebratory',
					'somber',
					'chaotic',
					'peaceful',
					'ominous',
					'triumphant',
					'desperate',
					'exhilarating'
				]);
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'mood');
				expect(field?.required).toBe(false);
			});
		});

		describe('session Field', () => {
			let field: FieldDefinition | undefined;

			it('should have session field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field).toBeDefined();
			});

			it('should have correct label', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.label).toBe('Session');
			});

			it('should be an entity-ref field', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.type).toBe('entity-ref');
			});

			it('should reference session entity type', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.entityTypes).toEqual(['session']);
			});

			it('should not be required', () => {
				sceneType = getSceneType();
				field = sceneType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.required).toBe(false);
			});
		});
	});

	describe('Scene Field Ordering', () => {
		it('should have ordered fields', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];

			// Check that all fields have an order property
			fields.forEach(field => {
				expect(field.order).toBeDefined();
				expect(typeof field.order).toBe('number');
			});
		});

		it('should have unique order values', () => {
			sceneType = getSceneType();
			const fields = sceneType?.fieldDefinitions ?? [];
			const orderValues = fields.map(f => f.order);
			const uniqueOrders = new Set(orderValues);

			expect(uniqueOrders.size).toBe(orderValues.length);
		});
	});

	describe('Scene Default Relationships', () => {
		it('should have at least one default relationship', () => {
			sceneType = getSceneType();
			expect(sceneType?.defaultRelationships.length).toBeGreaterThan(0);
		});

		it('should include "occurred_at" relationship for location', () => {
			sceneType = getSceneType();
			expect(sceneType?.defaultRelationships).toContain('occurred_at');
		});

		it('should include "featured" relationship for NPCs/characters', () => {
			sceneType = getSceneType();
			expect(sceneType?.defaultRelationships).toContain('featured');
		});

		it('should include "part_of" relationship for session', () => {
			sceneType = getSceneType();
			expect(sceneType?.defaultRelationships).toContain('part_of');
		});
	});

	describe('Scene Integration', () => {
		it('should be included in total count of built-in types', () => {
			const builtInTypes = BUILT_IN_ENTITY_TYPES.filter(t => t.isBuiltIn);
			// Should be 13 now (12 original + scene)
			expect(builtInTypes.length).toBe(13);
		});

		it('should have unique type identifier', () => {
			const typeIds = BUILT_IN_ENTITY_TYPES.map(t => t.type);
			const sceneOccurrences = typeIds.filter(id => id === 'scene').length;
			expect(sceneOccurrences).toBe(1);
		});

		it('should not have duplicate field keys', () => {
			sceneType = getSceneType();
			const fieldKeys = sceneType?.fieldDefinitions.map(f => f.key) ?? [];
			const uniqueKeys = new Set(fieldKeys);

			expect(uniqueKeys.size).toBe(fieldKeys.length);
		});
	});
});
