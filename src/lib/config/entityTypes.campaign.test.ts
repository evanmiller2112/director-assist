import { describe, it, expect } from 'vitest';
import {
	BUILT_IN_ENTITY_TYPES,
	getEntityTypeDefinition,
	getAllEntityTypes
} from './entityTypes';
import type { EntityTypeDefinition } from '$lib/types';

/**
 * Tests for Campaign Entity Type - Issue #46: Refactor Campaign to first-class Entity type
 *
 * These tests verify that Campaign is properly registered as a built-in entity type
 * with the correct field definitions and configuration.
 *
 * RED PHASE: Some tests may pass already, but they document the expected behavior
 * for the Campaign entity type.
 */

describe('Campaign Entity Type - Issue #46', () => {
	describe('Campaign Registration as Built-in Entity Type', () => {
		it('should include campaign in BUILT_IN_ENTITY_TYPES', () => {
			const campaignType = BUILT_IN_ENTITY_TYPES.find(t => t.type === 'campaign');

			expect(campaignType).toBeDefined();
			expect(campaignType?.isBuiltIn).toBe(true);
		});

		it('should have campaign type definition accessible via getEntityTypeDefinition', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			expect(campaignType).toBeDefined();
			expect(campaignType?.type).toBe('campaign');
			expect(campaignType?.label).toBe('Campaign');
			expect(campaignType?.labelPlural).toBe('Campaigns');
		});

		it('should include campaign in getAllEntityTypes', () => {
			const allTypes = getAllEntityTypes();

			const campaignType = allTypes.find(t => t.type === 'campaign');
			expect(campaignType).toBeDefined();
		});

		it('should have correct icon and color for campaign', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			expect(campaignType?.icon).toBe('book-open');
			expect(campaignType?.color).toBe('campaign');
		});
	});

	describe('Campaign Field Definitions', () => {
		let campaignType: EntityTypeDefinition | undefined;

		beforeEach(() => {
			campaignType = getEntityTypeDefinition('campaign');
		});

		it('should have system field definition', () => {
			const systemField = campaignType?.fieldDefinitions.find(f => f.key === 'system');

			expect(systemField).toBeDefined();
			expect(systemField?.label).toBe('Game System');
			expect(systemField?.type).toBe('text');
			expect(systemField?.required).toBe(false);
		});

		it('should have setting field definition', () => {
			const settingField = campaignType?.fieldDefinitions.find(f => f.key === 'setting');

			expect(settingField).toBeDefined();
			expect(settingField?.label).toBe('Setting');
			expect(settingField?.type).toBe('text');
			expect(settingField?.required).toBe(false);
		});

		it('should have status field definition', () => {
			const statusField = campaignType?.fieldDefinitions.find(f => f.key === 'status');

			expect(statusField).toBeDefined();
			expect(statusField?.label).toBe('Status');
			expect(statusField?.type).toBe('select');
			expect(statusField?.required).toBe(false);
			expect(statusField?.options).toContain('active');
			expect(statusField?.options).toContain('paused');
			expect(statusField?.options).toContain('completed');
		});

		it('should have correct default value for status field', () => {
			const statusField = campaignType?.fieldDefinitions.find(f => f.key === 'status');

			expect(statusField?.defaultValue).toBe('active');
		});

		it('should have correct field ordering', () => {
			const fieldDefinitions = campaignType?.fieldDefinitions || [];

			// Extract field keys in order
			const orderedKeys = fieldDefinitions.sort((a, b) => a.order - b.order).map(f => f.key);

			// System should come before setting, setting before status
			const systemIndex = orderedKeys.indexOf('system');
			const settingIndex = orderedKeys.indexOf('setting');
			const statusIndex = orderedKeys.indexOf('status');

			expect(systemIndex).toBeLessThan(settingIndex);
			expect(settingIndex).toBeLessThan(statusIndex);
		});

		it('should have placeholders for text fields', () => {
			const systemField = campaignType?.fieldDefinitions.find(f => f.key === 'system');
			const settingField = campaignType?.fieldDefinitions.find(f => f.key === 'setting');

			expect(systemField?.placeholder).toBeDefined();
			expect(systemField?.placeholder).toContain('D&D');

			expect(settingField?.placeholder).toBeDefined();
		});
	});

	describe('Campaign Default Relationships', () => {
		it('should have default relationships defined', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			expect(campaignType?.defaultRelationships).toBeDefined();
			expect(campaignType?.defaultRelationships?.length).toBeGreaterThan(0);
		});

		it('should include "contains" relationship', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			expect(campaignType?.defaultRelationships).toContain('contains');
		});

		it('should include "features" relationship', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			expect(campaignType?.defaultRelationships).toContain('features');
		});
	});

	describe('Campaign Entity Type Behavior', () => {
		it('should not have any required fields except status', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			const requiredFields = campaignType?.fieldDefinitions.filter(f => f.required) || [];

			// Status is not required according to the type definition
			// Only checking that we don't have unexpected required fields
			expect(requiredFields.length).toBe(0);
		});

		it('should allow campaign entities to be created with minimal data', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			// Check that only name is truly required (from BaseEntity)
			// All campaign-specific fields are optional
			const requiredCampaignFields = campaignType?.fieldDefinitions.filter(
				f => f.required
			) || [];

			expect(requiredCampaignFields.length).toBe(0);
		});

		it('should have proper structure for forms and UI', () => {
			const campaignType = getEntityTypeDefinition('campaign');

			// Should have all required properties for entity type definition
			expect(campaignType).toHaveProperty('type');
			expect(campaignType).toHaveProperty('label');
			expect(campaignType).toHaveProperty('labelPlural');
			expect(campaignType).toHaveProperty('icon');
			expect(campaignType).toHaveProperty('color');
			expect(campaignType).toHaveProperty('fieldDefinitions');
			expect(campaignType).toHaveProperty('defaultRelationships');
			expect(campaignType).toHaveProperty('isBuiltIn');
		});
	});

	describe('Campaign Entity Type Overrides', () => {
		it('should support entity type overrides like other entity types', () => {
			const override = {
				type: 'campaign',
				additionalFields: [
					{
						key: 'customField',
						label: 'Custom Field',
						type: 'text' as const,
						required: false,
						order: 10
					}
				]
			};

			const overriddenType = getEntityTypeDefinition('campaign', [], [override]);

			expect(overriddenType).toBeDefined();

			// Should include the additional field
			const customField = overriddenType?.fieldDefinitions.find(f => f.key === 'customField');
			expect(customField).toBeDefined();
		});

		it('should support hiding fields through overrides', () => {
			const override = {
				type: 'campaign',
				hiddenFields: ['setting']
			};

			const overriddenType = getEntityTypeDefinition('campaign', [], [override]);

			expect(overriddenType).toBeDefined();

			// Setting field should be hidden
			const settingField = overriddenType?.fieldDefinitions.find(f => f.key === 'setting');
			expect(settingField).toBeUndefined();
		});

		it('should support custom field ordering through overrides', () => {
			const override = {
				type: 'campaign',
				fieldOrder: ['status', 'system', 'setting'] // Reverse order
			};

			const overriddenType = getEntityTypeDefinition('campaign', [], [override]);

			expect(overriddenType).toBeDefined();

			const fieldDefinitions = overriddenType?.fieldDefinitions || [];

			// Find indices based on override order
			const statusIndex = fieldDefinitions.findIndex(f => f.key === 'status');
			const systemIndex = fieldDefinitions.findIndex(f => f.key === 'system');
			const settingIndex = fieldDefinitions.findIndex(f => f.key === 'setting');

			// Custom order should be applied
			expect(statusIndex).toBeLessThan(systemIndex);
			expect(systemIndex).toBeLessThan(settingIndex);
		});
	});

	describe('Campaign Entity Type Comparison with Other Types', () => {
		it('should be treated the same as other built-in entity types', () => {
			const characterType = getEntityTypeDefinition('character');
			const campaignType = getEntityTypeDefinition('campaign');

			// Both should have same structure
			expect(campaignType).toHaveProperty('type');
			expect(campaignType).toHaveProperty('isBuiltIn');
			expect(campaignType?.isBuiltIn).toBe(characterType?.isBuiltIn);
		});

		it('should be includable in entity lists and filters', () => {
			const allTypes = getAllEntityTypes();

			// Campaign should be included like other types
			const campaignIncluded = allTypes.some(t => t.type === 'campaign');
			const characterIncluded = allTypes.some(t => t.type === 'character');

			expect(campaignIncluded).toBe(true);
			expect(characterIncluded).toBe(true);
		});

		it('should not be hidden from sidebar by default', () => {
			const allTypes = getAllEntityTypes();

			const campaignType = allTypes.find(t => t.type === 'campaign');

			expect(campaignType).toBeDefined();
		});
	});
});
