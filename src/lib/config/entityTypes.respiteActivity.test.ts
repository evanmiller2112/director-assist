import { describe, it, expect, beforeEach } from 'vitest';
import {
	BUILT_IN_ENTITY_TYPES,
	getEntityTypeDefinition,
	getDefaultEntityTypeOrder
} from './entityTypes';
import type { EntityTypeDefinition } from '$lib/types';

/**
 * Tests for Respite Activity Entity Type Registration
 *
 * Issue #493 Phase 1: Entity Type Registration
 *
 * These tests validate that the 'respite_activity' entity type is properly
 * registered in the entity system with correct field definitions.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the entity type is registered.
 */

describe('Respite Activity Entity Type Registration', () => {
	it('should include respite_activity in BUILT_IN_ENTITY_TYPES', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		expect(respiteActivityType).toBeDefined();
	});

	it('should have correct basic metadata', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		expect(respiteActivityType?.label).toBe('Respite Activity');
		expect(respiteActivityType?.labelPlural).toBe('Respite Activities');
		expect(respiteActivityType?.icon).toBe('coffee');
		expect(respiteActivityType?.color).toBe('amber');
		expect(respiteActivityType?.isBuiltIn).toBe(true);
	});

	it('should have activityType field with correct options', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const activityTypeField = respiteActivityType?.fieldDefinitions.find(
			(f) => f.key === 'activityType'
		);

		expect(activityTypeField).toBeDefined();
		expect(activityTypeField?.label).toBe('Activity Type');
		expect(activityTypeField?.type).toBe('select');
		expect(activityTypeField?.required).toBe(false);
		expect(activityTypeField?.options).toEqual([
			'project',
			'crafting',
			'socializing',
			'training',
			'investigation',
			'other'
		]);
	});

	it('should have heroId field as entity-ref to character', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const heroIdField = respiteActivityType?.fieldDefinitions.find((f) => f.key === 'heroId');

		expect(heroIdField).toBeDefined();
		expect(heroIdField?.label).toBe('Hero');
		expect(heroIdField?.type).toBe('entity-ref');
		expect(heroIdField?.entityTypes).toEqual(['character']);
		expect(heroIdField?.required).toBe(false);
	});

	it('should have activityStatus field with correct options', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const statusField = respiteActivityType?.fieldDefinitions.find(
			(f) => f.key === 'activityStatus'
		);

		expect(statusField).toBeDefined();
		expect(statusField?.label).toBe('Status');
		expect(statusField?.type).toBe('select');
		expect(statusField?.required).toBe(true);
		expect(statusField?.defaultValue).toBe('pending');
		expect(statusField?.options).toEqual(['pending', 'in_progress', 'completed']);
	});

	it('should have outcome field as richtext', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const outcomeField = respiteActivityType?.fieldDefinitions.find((f) => f.key === 'outcome');

		expect(outcomeField).toBeDefined();
		expect(outcomeField?.label).toBe('Outcome');
		expect(outcomeField?.type).toBe('richtext');
		expect(outcomeField?.required).toBe(false);
		expect(outcomeField?.helpText).toBe('Describe the result when the activity is completed');
	});

	it('should have progress field as richtext', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const progressField = respiteActivityType?.fieldDefinitions.find((f) => f.key === 'progress');

		expect(progressField).toBeDefined();
		expect(progressField?.label).toBe('Progress');
		expect(progressField?.type).toBe('richtext');
		expect(progressField?.required).toBe(false);
		expect(progressField?.helpText).toBe('Record ongoing progress and developments');
	});

	it('should have appropriate default relationships', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		expect(respiteActivityType?.defaultRelationships).toContain('assigned_to');
		expect(respiteActivityType?.defaultRelationships).toContain('part_of');
	});

	it('should be retrievable via getEntityTypeDefinition', () => {
		const definition = getEntityTypeDefinition('respite_activity');
		expect(definition).toBeDefined();
		expect(definition?.type).toBe('respite_activity');
	});

	it('should be included in default entity type order', () => {
		const defaultOrder = getDefaultEntityTypeOrder();
		expect(defaultOrder).toContain('respite_activity');
	});

	it('should have all fields ordered correctly', () => {
		const respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
		const fields = respiteActivityType?.fieldDefinitions;

		expect(fields).toBeDefined();
		if (fields) {
			// Check that order values are sequential and make sense
			const orders = fields.map((f) => f.order);
			const sortedOrders = [...orders].sort((a, b) => a - b);
			expect(orders).toEqual(sortedOrders);

			// Check that all required fields come before optional ones (within reason)
			// activityStatus should be near the top since it's required
			const statusField = fields.find((f) => f.key === 'activityStatus');
			expect(statusField?.order).toBeLessThanOrEqual(3);
		}
	});
});

describe('Respite Activity Field Definitions', () => {
	let respiteActivityType: EntityTypeDefinition | undefined;

	beforeEach(() => {
		respiteActivityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'respite_activity');
	});

	it('should have exactly 5 custom fields (excluding name/description from base)', () => {
		// activityType, heroId, activityStatus, outcome, progress
		expect(respiteActivityType?.fieldDefinitions).toHaveLength(5);
	});

	it('should have activityType as first field', () => {
		const fields = respiteActivityType?.fieldDefinitions;
		const activityTypeField = fields?.find((f) => f.key === 'activityType');
		expect(activityTypeField?.order).toBe(1);
	});

	it('should have heroId as second field', () => {
		const fields = respiteActivityType?.fieldDefinitions;
		const heroIdField = fields?.find((f) => f.key === 'heroId');
		expect(heroIdField?.order).toBe(2);
	});

	it('should have activityStatus as third field', () => {
		const fields = respiteActivityType?.fieldDefinitions;
		const statusField = fields?.find((f) => f.key === 'activityStatus');
		expect(statusField?.order).toBe(3);
	});

	it('should have progress as fourth field', () => {
		const fields = respiteActivityType?.fieldDefinitions;
		const progressField = fields?.find((f) => f.key === 'progress');
		expect(progressField?.order).toBe(4);
	});

	it('should have outcome as fifth field', () => {
		const fields = respiteActivityType?.fieldDefinitions;
		const outcomeField = fields?.find((f) => f.key === 'outcome');
		expect(outcomeField?.order).toBe(5);
	});
});
