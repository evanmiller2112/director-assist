/**
 * Tests for Sidebar Order Service (Issue #121)
 *
 * This service manages the custom ordering of entity types in the sidebar,
 * allowing users to drag-and-drop to reorder entity type sections.
 *
 * Covers:
 * - Getting saved order from localStorage
 * - Setting custom order to localStorage
 * - Resetting order (removing from localStorage)
 * - Getting default order (campaign first)
 * - Handling invalid/corrupted localStorage data
 * - Edge cases (null, undefined, empty arrays)
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	getSidebarEntityTypeOrder,
	setSidebarEntityTypeOrder,
	resetSidebarEntityTypeOrder,
	getDefaultOrder
} from './sidebarOrderService';

describe('sidebarOrderService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let mockStore: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		mockStore = {};
		originalLocalStorage = global.localStorage;

		global.localStorage = {
			getItem: vi.fn((key: string) => mockStore[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStore[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStore[key];
			}),
			clear: vi.fn(() => {
				Object.keys(mockStore).forEach((key) => delete mockStore[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('getSidebarEntityTypeOrder', () => {
		describe('No Saved Order', () => {
			it('should return null when no order is saved', () => {
				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null when localStorage is empty', () => {
				mockStore = {};
				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null when key does not exist', () => {
				mockStore['some-other-key'] = 'value';
				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});
		});

		describe('Valid Saved Order', () => {
			it('should return saved order when one exists', () => {
				const savedOrder = ['campaign', 'character', 'npc', 'location'];
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(savedOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(savedOrder);
			});

			it('should return order with all built-in types', () => {
				const savedOrder = [
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
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(savedOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(savedOrder);
			});

			it('should return order with custom types included', () => {
				const savedOrder = ['campaign', 'character', 'custom_creature', 'npc'];
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(savedOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(savedOrder);
			});

			it('should preserve exact ordering from localStorage', () => {
				const savedOrder = ['npc', 'character', 'campaign', 'location'];
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(savedOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(savedOrder);
			});

			it('should handle single entity type in order', () => {
				const savedOrder = ['campaign'];
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(savedOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(savedOrder);
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return null for corrupted JSON', () => {
				mockStore['dm-assist-sidebar-entity-order'] = 'invalid-json{]';

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for non-array JSON', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify({ order: ['campaign'] });

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for JSON string instead of array', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify('campaign,character,npc');

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for JSON number', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(12345);

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for empty string in localStorage', () => {
				mockStore['dm-assist-sidebar-entity-order'] = '';

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for whitespace-only string', () => {
				mockStore['dm-assist-sidebar-entity-order'] = '   ';

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for null in localStorage', () => {
				mockStore['dm-assist-sidebar-entity-order'] = 'null';

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should return null for undefined in localStorage', () => {
				mockStore['dm-assist-sidebar-entity-order'] = 'undefined';

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty array as valid order', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify([]);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual([]);
			});

			it('should handle array with non-string elements gracefully', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(['campaign', 123, 'npc']);

				const order = getSidebarEntityTypeOrder();
				// Should return null for invalid array content
				expect(order).toBeNull();
			});

			it('should handle array with null elements', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(['campaign', null, 'npc']);

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should handle array with empty strings', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(['campaign', '', 'npc']);

				const order = getSidebarEntityTypeOrder();
				// May accept or reject depending on implementation - documenting expected behavior
				expect(order).toBeNull();
			});

			it('should handle very long array', () => {
				const longOrder = Array.from({ length: 100 }, (_, i) => `type_${i}`);
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(longOrder);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(longOrder);
			});

			it('should handle duplicate entity types in array', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify([
					'campaign',
					'character',
					'campaign'
				]);

				const order = getSidebarEntityTypeOrder();
				// May accept duplicates or reject - documenting expected behavior
				expect(order).toBeNull();
			});
		});

		describe('SSR Context Handling', () => {
			it('should return null in SSR context (window undefined)', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getSidebarEntityTypeOrder()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setSidebarEntityTypeOrder', () => {
		describe('Setting Valid Order', () => {
			it('should save order to localStorage', () => {
				const order = ['campaign', 'character', 'npc'];
				setSidebarEntityTypeOrder(order);

				expect(mockStore['dm-assist-sidebar-entity-order']).toBeDefined();
				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});

			it('should save empty array', () => {
				setSidebarEntityTypeOrder([]);

				expect(mockStore['dm-assist-sidebar-entity-order']).toBeDefined();
				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual([]);
			});

			it('should save single entity type', () => {
				const order = ['campaign'];
				setSidebarEntityTypeOrder(order);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});

			it('should save all built-in types', () => {
				const order = [
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
				setSidebarEntityTypeOrder(order);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});

			it('should save order with custom types', () => {
				const order = ['campaign', 'custom_creature', 'character', 'npc'];
				setSidebarEntityTypeOrder(order);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});

			it('should preserve exact ordering', () => {
				const order = ['npc', 'location', 'campaign', 'character'];
				setSidebarEntityTypeOrder(order);

				const saved = JSON.parse(mockStore['dm-assist-sidebar-entity-order']);
				expect(saved[0]).toBe('npc');
				expect(saved[1]).toBe('location');
				expect(saved[2]).toBe('campaign');
				expect(saved[3]).toBe('character');
			});
		});

		describe('Overwriting Existing Order', () => {
			it('should overwrite existing order', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(['old', 'order']);

				const newOrder = ['new', 'order'];
				setSidebarEntityTypeOrder(newOrder);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(newOrder);
			});

			it('should handle multiple updates', () => {
				setSidebarEntityTypeOrder(['first']);
				setSidebarEntityTypeOrder(['second']);
				setSidebarEntityTypeOrder(['third']);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(['third']);
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long arrays', () => {
				const longOrder = Array.from({ length: 100 }, (_, i) => `type_${i}`);
				setSidebarEntityTypeOrder(longOrder);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(longOrder);
			});

			it('should handle entity types with special characters', () => {
				const order = ['custom-type', 'custom_type', 'custom.type', 'custom type'];
				setSidebarEntityTypeOrder(order);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});

			it('should handle entity types with unicode characters', () => {
				const order = ['campaign', 'キャラクター', 'персонаж'];
				setSidebarEntityTypeOrder(order);

				expect(JSON.parse(mockStore['dm-assist-sidebar-entity-order'])).toEqual(order);
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setSidebarEntityTypeOrder(['campaign'])).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setSidebarEntityTypeOrder(['campaign']);

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-sidebar-entity-order']).toBeUndefined();
			});
		});
	});

	describe('resetSidebarEntityTypeOrder', () => {
		describe('Removing Saved Order', () => {
			it('should remove order from localStorage', () => {
				mockStore['dm-assist-sidebar-entity-order'] = JSON.stringify(['campaign', 'character']);

				resetSidebarEntityTypeOrder();

				expect(mockStore['dm-assist-sidebar-entity-order']).toBeUndefined();
			});

			it('should not throw when no order exists', () => {
				expect(() => resetSidebarEntityTypeOrder()).not.toThrow();
			});

			it('should remove order even if corrupted', () => {
				mockStore['dm-assist-sidebar-entity-order'] = 'corrupted-data';

				resetSidebarEntityTypeOrder();

				expect(mockStore['dm-assist-sidebar-entity-order']).toBeUndefined();
			});
		});

		describe('Verification After Reset', () => {
			it('should return null from getSidebarEntityTypeOrder after reset', () => {
				setSidebarEntityTypeOrder(['campaign', 'character']);
				resetSidebarEntityTypeOrder();

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});

			it('should allow setting new order after reset', () => {
				setSidebarEntityTypeOrder(['campaign']);
				resetSidebarEntityTypeOrder();
				setSidebarEntityTypeOrder(['character']);

				const order = getSidebarEntityTypeOrder();
				expect(order).toEqual(['character']);
			});
		});

		describe('Edge Cases', () => {
			it('should handle multiple resets', () => {
				setSidebarEntityTypeOrder(['campaign']);
				resetSidebarEntityTypeOrder();
				resetSidebarEntityTypeOrder();
				resetSidebarEntityTypeOrder();

				const order = getSidebarEntityTypeOrder();
				expect(order).toBeNull();
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => resetSidebarEntityTypeOrder()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('getDefaultOrder', () => {
		describe('Default Order Structure', () => {
			it('should return array of entity type keys', () => {
				const order = getDefaultOrder();
				expect(Array.isArray(order)).toBe(true);
				expect(order.length).toBeGreaterThan(0);
			});

			it('should have campaign as first type', () => {
				const order = getDefaultOrder();
				expect(order[0]).toBe('campaign');
			});

			it('should include all built-in entity types', () => {
				const order = getDefaultOrder();

				const expectedTypes = [
					'campaign',
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
					'player_profile'
				];

				expectedTypes.forEach((type) => {
					expect(order).toContain(type);
				});
			});

			it('should include scene type', () => {
				const order = getDefaultOrder();
				expect(order).toContain('scene');
			});

			it('should return same order on multiple calls', () => {
				const order1 = getDefaultOrder();
				const order2 = getDefaultOrder();
				expect(order1).toEqual(order2);
			});

			it('should not be affected by localStorage state', () => {
				setSidebarEntityTypeOrder(['custom', 'order']);
				const order1 = getDefaultOrder();

				resetSidebarEntityTypeOrder();
				const order2 = getDefaultOrder();

				expect(order1).toEqual(order2);
			});
		});

		describe('Order Content Validation', () => {
			it('should contain only strings', () => {
				const order = getDefaultOrder();
				order.forEach((type) => {
					expect(typeof type).toBe('string');
				});
			});

			it('should not contain duplicates', () => {
				const order = getDefaultOrder();
				const uniqueTypes = new Set(order);
				expect(uniqueTypes.size).toBe(order.length);
			});

			it('should not contain empty strings', () => {
				const order = getDefaultOrder();
				order.forEach((type) => {
					expect(type.length).toBeGreaterThan(0);
				});
			});

			it('should not contain null or undefined', () => {
				const order = getDefaultOrder();
				order.forEach((type) => {
					expect(type).not.toBeNull();
					expect(type).not.toBeUndefined();
				});
			});
		});

		describe('Expected Count', () => {
			it('should return exactly 12 built-in types', () => {
				const order = getDefaultOrder();
				expect(order.length).toBe(12);
			});
		});

		describe('Edge Cases', () => {
			it('should return new array instance each time (not shared reference)', () => {
				const order1 = getDefaultOrder();
				const order2 = getDefaultOrder();

				order1.push('modified');

				expect(order2).not.toContain('modified');
			});

			it('should work in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getDefaultOrder()).not.toThrow();

				const order = getDefaultOrder();
				expect(Array.isArray(order)).toBe(true);
				expect(order[0]).toBe('campaign');

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('Integration Scenarios', () => {
		it('should persist and retrieve custom order', () => {
			const customOrder = ['npc', 'character', 'campaign', 'location'];
			setSidebarEntityTypeOrder(customOrder);

			const retrieved = getSidebarEntityTypeOrder();
			expect(retrieved).toEqual(customOrder);
		});

		it('should fall back to null after reset', () => {
			setSidebarEntityTypeOrder(['campaign', 'character']);
			resetSidebarEntityTypeOrder();

			const order = getSidebarEntityTypeOrder();
			expect(order).toBeNull();
		});

		it('should handle set -> get -> reset -> get cycle', () => {
			setSidebarEntityTypeOrder(['custom', 'order']);
			expect(getSidebarEntityTypeOrder()).toEqual(['custom', 'order']);

			resetSidebarEntityTypeOrder();
			expect(getSidebarEntityTypeOrder()).toBeNull();
		});

		it('should not affect default order when custom order is set', () => {
			const defaultBefore = getDefaultOrder();

			setSidebarEntityTypeOrder(['custom', 'order']);

			const defaultAfter = getDefaultOrder();
			expect(defaultAfter).toEqual(defaultBefore);
		});

		it('should handle rapid updates', () => {
			setSidebarEntityTypeOrder(['order1']);
			setSidebarEntityTypeOrder(['order2']);
			setSidebarEntityTypeOrder(['order3']);
			setSidebarEntityTypeOrder(['order4']);

			const retrieved = getSidebarEntityTypeOrder();
			expect(retrieved).toEqual(['order4']);
		});
	});
});
