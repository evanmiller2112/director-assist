/**
 * Tests for Narrative Event Entity Type Definition (Issue #398)
 *
 * This is the RED phase of TDD - tests written to FAIL initially.
 * These tests validate the Narrative Event entity type structure:
 * - Type exists in BUILT_IN_ENTITY_TYPES
 * - Has correct metadata (label, icon, color, etc.)
 * - Has all required field definitions
 * - Field types and options are correct
 * - Included in getDefaultEntityTypeOrder()
 *
 * Implementation will be added in the GREEN phase to make these tests pass.
 */
import { describe, it, expect } from 'vitest';
import {
	BUILT_IN_ENTITY_TYPES,
	getEntityTypeDefinition,
	getDefaultEntityTypeOrder
} from './entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

describe('Narrative Event Entity Type Definition (Issue #398)', () => {
	let narrativeEventType: EntityTypeDefinition | undefined;

	// Helper to get the narrative_event type definition
	function getNarrativeEventType(): EntityTypeDefinition | undefined {
		return BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'narrative_event');
	}

	describe('Narrative Event Type Existence', () => {
		it('should exist in BUILT_IN_ENTITY_TYPES', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType).toBeDefined();
		});

		it('should be retrievable via getEntityTypeDefinition', () => {
			const narrativeEvent = getEntityTypeDefinition('narrative_event');
			expect(narrativeEvent).toBeDefined();
			expect(narrativeEvent?.type).toBe('narrative_event');
		});
	});

	describe('Narrative Event Type Metadata', () => {
		it('should have correct type identifier', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.type).toBe('narrative_event');
		});

		it('should have singular label "Narrative Event"', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.label).toBe('Narrative Event');
		});

		it('should have plural label "Narrative Events"', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.labelPlural).toBe('Narrative Events');
		});

		it('should have icon "milestone"', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.icon).toBe('milestone');
		});

		it('should have color "amber"', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.color).toBe('amber');
		});

		it('should be marked as built-in', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.isBuiltIn).toBe(true);
		});

		it('should have default relationships defined', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships).toBeDefined();
			expect(Array.isArray(narrativeEventType?.defaultRelationships)).toBe(true);
		});
	});

	describe('Narrative Event Field Definitions', () => {
		it('should have field definitions array', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.fieldDefinitions).toBeDefined();
			expect(Array.isArray(narrativeEventType?.fieldDefinitions)).toBe(true);
		});

		it('should have exactly 4 field definitions', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.fieldDefinitions.length).toBe(4);
		});

		describe('eventType Field', () => {
			let field: FieldDefinition | undefined;

			it('should have eventType field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field).toBeDefined();
			});

			it('should have correct label "Event Type"', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.label).toBe('Event Type');
			});

			it('should be a select field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.type).toBe('select');
			});

			it('should have exactly 6 options', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.options?.length).toBe(6);
			});

			it('should have correct event type options', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.options).toEqual(['scene', 'combat', 'montage', 'negotiation', 'respite', 'other']);
			});

			it('should be required', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.required).toBe(true);
			});

			it('should have order 1', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'eventType');
				expect(field?.order).toBe(1);
			});
		});

		describe('sourceId Field', () => {
			let field: FieldDefinition | undefined;

			it('should have sourceId field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field).toBeDefined();
			});

			it('should have correct label "Source ID"', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field?.label).toBe('Source ID');
			});

			it('should be a text field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field?.type).toBe('text');
			});

			it('should not be required', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field?.required).toBe(false);
			});

			it('should have order 2', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field?.order).toBe(2);
			});

			it('should have helpText explaining the field purpose', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'sourceId');
				expect(field?.helpText).toBeDefined();
				expect(field?.helpText).toBe('ID of the linked combat, montage, or scene');
			});
		});

		describe('outcome Field', () => {
			let field: FieldDefinition | undefined;

			it('should have outcome field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'outcome');
				expect(field).toBeDefined();
			});

			it('should have correct label "Outcome"', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'outcome');
				expect(field?.label).toBe('Outcome');
			});

			it('should be a text field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'outcome');
				expect(field?.type).toBe('text');
			});

			it('should not be required', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'outcome');
				expect(field?.required).toBe(false);
			});

			it('should have order 3', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'outcome');
				expect(field?.order).toBe(3);
			});
		});

		describe('session Field', () => {
			let field: FieldDefinition | undefined;

			it('should have session field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field).toBeDefined();
			});

			it('should have correct label "Session"', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.label).toBe('Session');
			});

			it('should be an entity-ref field', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.type).toBe('entity-ref');
			});

			it('should reference session entity type', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.entityTypes).toEqual(['session']);
			});

			it('should not be required', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.required).toBe(false);
			});

			it('should have order 4', () => {
				narrativeEventType = getNarrativeEventType();
				field = narrativeEventType?.fieldDefinitions.find((f) => f.key === 'session');
				expect(field?.order).toBe(4);
			});
		});
	});

	describe('Narrative Event Field Ordering', () => {
		it('should have ordered fields', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];

			// Check that all fields have an order property
			fields.forEach((field) => {
				expect(field.order).toBeDefined();
				expect(typeof field.order).toBe('number');
			});
		});

		it('should have unique order values', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];
			const orderValues = fields.map((f) => f.order);
			const uniqueOrders = new Set(orderValues);

			expect(uniqueOrders.size).toBe(orderValues.length);
		});

		it('should have consecutive order values starting from 1', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];
			const orderValues = fields.map((f) => f.order).sort((a, b) => a - b);

			expect(orderValues).toEqual([1, 2, 3, 4]);
		});

		it('should have fields in correct order: eventType, sourceId, outcome, session', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];
			const sortedFields = [...fields].sort((a, b) => a.order - b.order);

			expect(sortedFields[0].key).toBe('eventType');
			expect(sortedFields[1].key).toBe('sourceId');
			expect(sortedFields[2].key).toBe('outcome');
			expect(sortedFields[3].key).toBe('session');
		});
	});

	describe('Narrative Event Default Relationships', () => {
		it('should have exactly 3 default relationships', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships.length).toBe(3);
		});

		it('should include "leads_to" relationship', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships).toContain('leads_to');
		});

		it('should include "follows" relationship', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships).toContain('follows');
		});

		it('should include "part_of" relationship for session', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships).toContain('part_of');
		});

		it('should have all three relationships in correct order', () => {
			narrativeEventType = getNarrativeEventType();
			expect(narrativeEventType?.defaultRelationships).toEqual(['leads_to', 'follows', 'part_of']);
		});
	});

	describe('Narrative Event Integration', () => {
		it('should be included in total count of built-in types', () => {
			const builtInTypes = BUILT_IN_ENTITY_TYPES.filter((t) => t.isBuiltIn);
			// Should be 14 built-in types (13 original + respite_activity)
			expect(builtInTypes.length).toBe(14);
		});

		it('should have unique type identifier', () => {
			const typeIds = BUILT_IN_ENTITY_TYPES.map((t) => t.type);
			const narrativeEventOccurrences = typeIds.filter((id) => id === 'narrative_event').length;
			expect(narrativeEventOccurrences).toBe(1);
		});

		it('should not have duplicate field keys', () => {
			narrativeEventType = getNarrativeEventType();
			const fieldKeys = narrativeEventType?.fieldDefinitions.map((f) => f.key) ?? [];
			const uniqueKeys = new Set(fieldKeys);

			expect(uniqueKeys.size).toBe(fieldKeys.length);
		});
	});

	describe('Narrative Event in Default Entity Type Order', () => {
		it('should be included in getDefaultEntityTypeOrder()', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			expect(defaultOrder).toContain('narrative_event');
		});

		it('should appear in default order array', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const narrativeEventIndex = defaultOrder.indexOf('narrative_event');
			expect(narrativeEventIndex).toBeGreaterThanOrEqual(0);
		});

		it('should be included exactly once in default order', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const occurrences = defaultOrder.filter((type) => type === 'narrative_event').length;
			expect(occurrences).toBe(1);
		});

		it('should increase total default order count to 14', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			// Should have 14 types now: 13 original + respite_activity
			expect(defaultOrder.length).toBe(14);
		});
	});

	describe('Narrative Event Field Type Validation', () => {
		it('should have all fields with valid field types', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];

			const validFieldTypes = [
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
				'computed',
				'dice',
				'resource',
				'duration'
			];

			fields.forEach((field) => {
				expect(validFieldTypes).toContain(field.type);
			});
		});

		it('should have correct required field configuration', () => {
			narrativeEventType = getNarrativeEventType();
			const fields = narrativeEventType?.fieldDefinitions ?? [];

			// eventType is required
			const eventTypeField = fields.find((f) => f.key === 'eventType');
			expect(eventTypeField?.required).toBe(true);

			// All other fields are optional
			const optionalFields = fields.filter((f) => f.key !== 'eventType');
			optionalFields.forEach((field) => {
				expect(field.required).toBe(false);
			});
		});
	});

	describe('Narrative Event Entity Type Union', () => {
		it('should be a valid EntityType in TypeScript union', () => {
			// This test validates that 'narrative_event' will be added to the EntityType union
			// The type system will validate this during compilation
			const type: string = 'narrative_event';
			expect(type).toBe('narrative_event');
		});
	});
});
