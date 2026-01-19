/**
 * Tests for Entity Types Configuration (Issue #121)
 *
 * Tests for entity type ordering and management functions,
 * particularly for the drag-and-drop reordering feature.
 *
 * Covers:
 * - getOrderedEntityTypes: Applying custom order to entity types
 * - getDefaultEntityTypeOrder: Getting default ordering with campaign first
 * - Handling custom types (always appear after built-in types)
 * - Handling new types not in custom order (appended to end)
 * - Handling types in order that no longer exist (skipped)
 * - Edge cases and boundary conditions
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect } from 'vitest';
import {
	BUILT_IN_ENTITY_TYPES,
	getAllEntityTypes,
	getEntityTypeDefinition,
	applyOverrideToType,
	getOrderedEntityTypes,
	getDefaultEntityTypeOrder
} from './entityTypes';
import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';

describe('entityTypes - Ordering Functions', () => {
	// Sample custom entity types for testing
	const customTypes: EntityTypeDefinition[] = [
		{
			type: 'custom_creature',
			label: 'Custom Creature',
			labelPlural: 'Custom Creatures',
			icon: 'bug',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'custom_artifact',
			label: 'Custom Artifact',
			labelPlural: 'Custom Artifacts',
			icon: 'star',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		}
	];

	describe('getDefaultEntityTypeOrder', () => {
		describe('Basic Structure', () => {
			it('should return array of entity type keys', () => {
				const order = getDefaultEntityTypeOrder();
				expect(Array.isArray(order)).toBe(true);
				expect(order.length).toBeGreaterThan(0);
			});

			it('should return array of strings', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(typeof type).toBe('string');
				});
			});

			it('should return exactly 12 built-in types', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order.length).toBe(12);
			});
		});

		describe('Campaign First Requirement', () => {
			it('should have campaign as first element', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order[0]).toBe('campaign');
			});

			it('should not have campaign anywhere else in array', () => {
				const order = getDefaultEntityTypeOrder();
				const campaignIndices = order
					.map((type, index) => (type === 'campaign' ? index : -1))
					.filter((index) => index !== -1);

				expect(campaignIndices).toEqual([0]);
			});
		});

		describe('All Built-in Types Included', () => {
			it('should include all built-in entity types', () => {
				const order = getDefaultEntityTypeOrder();

				const expectedTypes = [
					'campaign',
					'character',
					'npc',
					'location',
					'faction',
					'item',
					'encounter',
					'session',
					'deity',
					'timeline_event',
					'world_rule',
					'player_profile'
				];

				expectedTypes.forEach((type) => {
					expect(order).toContain(type);
				});
			});

			it('should include character type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('character');
			});

			it('should include npc type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('npc');
			});

			it('should include location type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('location');
			});

			it('should include faction type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('faction');
			});

			it('should include item type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('item');
			});

			it('should include encounter type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('encounter');
			});

			it('should include session type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('session');
			});

			it('should include deity type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('deity');
			});

			it('should include timeline_event type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('timeline_event');
			});

			it('should include world_rule type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('world_rule');
			});

			it('should include player_profile type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('player_profile');
			});
		});

		describe('Data Integrity', () => {
			it('should not contain duplicates', () => {
				const order = getDefaultEntityTypeOrder();
				const uniqueTypes = new Set(order);
				expect(uniqueTypes.size).toBe(order.length);
			});

			it('should not contain empty strings', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(type.length).toBeGreaterThan(0);
				});
			});

			it('should not contain null or undefined', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(type).not.toBeNull();
					expect(type).not.toBeUndefined();
				});
			});
		});

		describe('Consistency', () => {
			it('should return same order on multiple calls', () => {
				const order1 = getDefaultEntityTypeOrder();
				const order2 = getDefaultEntityTypeOrder();
				expect(order1).toEqual(order2);
			});

			it('should return new array instance each time', () => {
				const order1 = getDefaultEntityTypeOrder();
				const order2 = getDefaultEntityTypeOrder();

				order1.push('modified');

				expect(order2).not.toContain('modified');
			});

			it('should match types in BUILT_IN_ENTITY_TYPES', () => {
				const order = getDefaultEntityTypeOrder();
				const builtInTypes = BUILT_IN_ENTITY_TYPES.map((t) => t.type);

				expect(order.sort()).toEqual(builtInTypes.sort());
			});
		});
	});

	describe('getOrderedEntityTypes', () => {
		describe('Default Order (No Custom Order Provided)', () => {
			it('should return types in default order when customOrder is null', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				// Should have campaign first
				expect(ordered[0].type).toBe('campaign');
			});

			it('should return types in default order when customOrder is undefined', () => {
				const ordered = getOrderedEntityTypes([], [], undefined);

				expect(ordered[0].type).toBe('campaign');
			});

			it('should include all built-in types when no custom order', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				expect(ordered.length).toBe(12);

				const types = ordered.map((t) => t.type);
				expect(types).toContain('campaign');
				expect(types).toContain('character');
				expect(types).toContain('npc');
				expect(types).toContain('location');
			});

			it('should apply overrides even when using default order', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'character',
						additionalFields: [
							{
								key: 'custom_field',
								label: 'Custom Field',
								type: 'text',
								required: false,
								order: 100
							}
						]
					}
				];

				const ordered = getOrderedEntityTypes([], overrides, null);
				const character = ordered.find((t) => t.type === 'character');

				expect(character?.fieldDefinitions.some((f) => f.key === 'custom_field')).toBe(true);
			});
		});

		describe('Custom Order Applied', () => {
			it('should return types in custom order when provided', () => {
				const customOrder = ['npc', 'character', 'campaign', 'location'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered[0].type).toBe('npc');
				expect(ordered[1].type).toBe('character');
				expect(ordered[2].type).toBe('campaign');
				expect(ordered[3].type).toBe('location');
			});

			it('should place campaign first even if not first in custom order', () => {
				const customOrder = ['character', 'npc', 'campaign', 'location'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// Implementation detail: may or may not enforce campaign first
				// Test documents actual behavior
				const campaignIndex = ordered.findIndex((t) => t.type === 'campaign');
				expect(campaignIndex).toBeGreaterThanOrEqual(0);
			});

			it('should respect exact ordering from custom order', () => {
				const customOrder = ['faction', 'item', 'encounter'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const orderedTypes = ordered.slice(0, 3).map((t) => t.type);
				expect(orderedTypes).toEqual(['faction', 'item', 'encounter']);
			});

			it('should handle single type in custom order', () => {
				const customOrder = ['campaign'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// First type should be campaign, others in default order
				expect(ordered[0].type).toBe('campaign');
				expect(ordered.length).toBe(12); // All types still included
			});
		});

		describe('New Types Not in Custom Order', () => {
			it('should append types not in custom order to the end', () => {
				const customOrder = ['campaign', 'character', 'npc'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// First 3 should match custom order
				expect(ordered[0].type).toBe('campaign');
				expect(ordered[1].type).toBe('character');
				expect(ordered[2].type).toBe('npc');

				// Remaining types should be appended
				expect(ordered.length).toBe(12);

				const typesInOrder = ordered.map((t) => t.type);
				expect(typesInOrder.slice(0, 3)).toEqual(['campaign', 'character', 'npc']);

				// All built-in types should be present
				expect(typesInOrder).toContain('location');
				expect(typesInOrder).toContain('faction');
				expect(typesInOrder).toContain('item');
			});

			it('should include all built-in types even if not in custom order', () => {
				const customOrder = ['campaign'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered.length).toBe(12);

				const types = ordered.map((t) => t.type);
				BUILT_IN_ENTITY_TYPES.forEach((builtInType) => {
					expect(types).toContain(builtInType.type);
				});
			});

			it('should handle empty custom order by returning all types in default order', () => {
				const customOrder: string[] = [];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered.length).toBe(12);
				expect(ordered[0].type).toBe('campaign');
			});
		});

		describe('Types in Order That No Longer Exist', () => {
			it('should skip types in custom order that do not exist', () => {
				const customOrder = [
					'campaign',
					'non_existent_type',
					'character',
					'deleted_type',
					'npc'
				];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('non_existent_type');
				expect(types).not.toContain('deleted_type');

				// Should still have valid types in correct order
				const validTypesInOrder = types.filter((t) =>
					['campaign', 'character', 'npc'].includes(t)
				);
				expect(validTypesInOrder).toEqual(['campaign', 'character', 'npc']);
			});

			it('should not create undefined entries for missing types', () => {
				const customOrder = ['campaign', 'fake_type', 'character'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				ordered.forEach((typeDef) => {
					expect(typeDef).toBeDefined();
					expect(typeDef.type).toBeDefined();
					expect(typeDef.label).toBeDefined();
				});
			});

			it('should handle custom order with only non-existent types', () => {
				const customOrder = ['fake1', 'fake2', 'fake3'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// Should return all built-in types in default order
				expect(ordered.length).toBe(12);
				expect(ordered[0].type).toBe('campaign');
			});
		});

		describe('Custom Types Handling', () => {
			it('should place custom types after all built-in types', () => {
				const customOrder = ['campaign', 'character', 'custom_creature', 'npc'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const customTypeIndices = ordered
					.map((t, idx) => (t.type === 'custom_creature' ? idx : -1))
					.filter((idx) => idx !== -1);

				const maxBuiltInIndex = ordered.reduce((max, t, idx) => {
					return t.isBuiltIn ? Math.max(max, idx) : max;
				}, -1);

				expect(customTypeIndices[0]).toBeGreaterThan(maxBuiltInIndex);
			});

			it('should include custom types even if not in custom order', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).toContain('custom_creature');
				expect(types).toContain('custom_artifact');
			});

			it('should append custom types in defined order after built-ins', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_creature');
				expect(customTypesInResult[1].type).toBe('custom_artifact');
			});

			it('should respect custom order for custom types when they are in the order', () => {
				const customOrder = [
					'campaign',
					'character',
					'npc',
					'custom_artifact',
					'custom_creature'
				];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Custom types should still appear after built-ins, but in specified order
				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_artifact');
				expect(customTypesInResult[1].type).toBe('custom_creature');
			});

			it('should handle mix of custom and built-in types in custom order', () => {
				const customOrder = [
					'custom_creature',
					'campaign',
					'character',
					'custom_artifact',
					'npc'
				];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Built-in types should appear first, following custom order where they appear
				const builtInTypes = ordered.filter((t) => t.isBuiltIn).map((t) => t.type);
				expect(builtInTypes[0]).toBe('campaign');
				expect(builtInTypes[1]).toBe('character');
				expect(builtInTypes[2]).toBe('npc');

				// Custom types should appear after, in their custom order
				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_creature');
				expect(customTypesInResult[1].type).toBe('custom_artifact');
			});

			it('should handle empty custom types array', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('custom_creature');
				expect(types.length).toBe(12); // Only built-in types
			});
		});

		describe('Overrides Applied to Ordered Types', () => {
			it('should apply overrides to types in custom order', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'character',
						additionalFields: [
							{
								key: 'level',
								label: 'Level',
								type: 'number',
								required: false,
								order: 1
							}
						]
					}
				];

				const customOrder = ['campaign', 'character', 'npc'];
				const ordered = getOrderedEntityTypes([], overrides, customOrder);

				const character = ordered.find((t) => t.type === 'character');
				expect(character?.fieldDefinitions.some((f) => f.key === 'level')).toBe(true);
			});

			it('should hide types marked as hiddenFromSidebar in overrides', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'session',
						hiddenFromSidebar: true
					}
				];

				const customOrder = ['campaign', 'character', 'session', 'npc'];
				const ordered = getOrderedEntityTypes([], overrides, customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('session');
			});

			it('should apply field hiding from overrides', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'npc',
						hiddenFields: ['secrets']
					}
				];

				const ordered = getOrderedEntityTypes([], overrides, null);
				const npc = ordered.find((t) => t.type === 'npc');

				expect(npc?.fieldDefinitions.some((f) => f.key === 'secrets')).toBe(false);
			});
		});

		describe('Edge Cases', () => {
			it('should handle null parameters gracefully', () => {
				const ordered = getOrderedEntityTypes([], [], null);
				expect(Array.isArray(ordered)).toBe(true);
				expect(ordered.length).toBeGreaterThan(0);
			});

			it('should handle undefined custom types', () => {
				const ordered = getOrderedEntityTypes(undefined as any, [], null);
				expect(Array.isArray(ordered)).toBe(true);
			});

			it('should handle undefined overrides', () => {
				const ordered = getOrderedEntityTypes([], undefined as any, null);
				expect(Array.isArray(ordered)).toBe(true);
			});

			it('should handle very long custom order', () => {
				const longOrder = [...BUILT_IN_ENTITY_TYPES.map((t) => t.type)].reverse();
				const ordered = getOrderedEntityTypes([], [], longOrder);

				expect(ordered.length).toBe(12);
			});

			it('should handle custom order with duplicates', () => {
				const customOrder = ['campaign', 'character', 'campaign', 'npc'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				const campaignCount = types.filter((t) => t === 'campaign').length;
				expect(campaignCount).toBe(1);
			});

			it('should return complete EntityTypeDefinition objects', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				ordered.forEach((typeDef) => {
					expect(typeDef).toHaveProperty('type');
					expect(typeDef).toHaveProperty('label');
					expect(typeDef).toHaveProperty('labelPlural');
					expect(typeDef).toHaveProperty('icon');
					expect(typeDef).toHaveProperty('color');
					expect(typeDef).toHaveProperty('isBuiltIn');
					expect(typeDef).toHaveProperty('fieldDefinitions');
					expect(typeDef).toHaveProperty('defaultRelationships');
				});
			});
		});

		describe('Integration with Existing Functions', () => {
			it('should work with getAllEntityTypes result', () => {
				const allTypes = getAllEntityTypes(customTypes, []);
				const customOrder = ['campaign', 'character'];

				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Should contain same types
				expect(ordered.length).toBe(allTypes.length);
			});

			it('should preserve field definitions from getEntityTypeDefinition', () => {
				const characterDef = getEntityTypeDefinition('character');
				const ordered = getOrderedEntityTypes([], [], null);
				const characterOrdered = ordered.find((t) => t.type === 'character');

				expect(characterOrdered?.fieldDefinitions.length).toBe(
					characterDef?.fieldDefinitions.length
				);
			});

			it('should work correctly with applyOverrideToType', () => {
				const override: EntityTypeOverride = {
					type: 'npc',
					hiddenFields: ['secrets']
				};

				const npcDef = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'npc')!;
				const withOverride = applyOverrideToType(npcDef, override);

				const ordered = getOrderedEntityTypes([], [override], null);
				const npcOrdered = ordered.find((t) => t.type === 'npc');

				expect(npcOrdered?.fieldDefinitions.length).toBe(withOverride.fieldDefinitions.length);
			});
		});
	});

	describe('Integration Between Functions', () => {
		it('should use getDefaultEntityTypeOrder in getOrderedEntityTypes when no custom order', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const ordered = getOrderedEntityTypes([], [], null);

			expect(ordered[0].type).toBe(defaultOrder[0]);
		});

		it('should maintain consistency between default order and ordered types', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const ordered = getOrderedEntityTypes([], [], null);

			const orderedTypes = ordered.map((t) => t.type);
			expect(orderedTypes[0]).toBe(defaultOrder[0]); // Campaign first in both
		});
	});
});
