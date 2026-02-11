/**
 * Tests for Relationship Template Service (TDD RED Phase)
 *
 * Issue #146: Relationship Templates
 *
 * This service manages custom relationship templates using localStorage.
 * It provides CRUD operations and merges custom templates with built-in templates.
 *
 * The service follows the pattern established by suggestionSettingsService:
 * - localStorage-based persistence
 * - SSR-safe (handles window === undefined)
 * - Graceful error handling for corrupted data
 * - ID generation for new templates
 *
 * Methods:
 * - getCustomTemplates(): RelationshipTemplate[]
 * - saveCustomTemplate(input): RelationshipTemplate
 * - updateCustomTemplate(id, updates): RelationshipTemplate | undefined
 * - deleteCustomTemplate(id): boolean
 * - getAllTemplates(): RelationshipTemplate[] (built-in + custom)
 * - getTemplatesByCategory(): Map<string, RelationshipTemplate[]>
 * - resetCustomTemplates(): void
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	getCustomTemplates,
	saveCustomTemplate,
	updateCustomTemplate,
	deleteCustomTemplate,
	getAllTemplates,
	getTemplatesByCategory,
	resetCustomTemplates
} from './relationshipTemplateService';
import type {
	RelationshipTemplate,
	CreateRelationshipTemplateInput
} from '$lib/types/relationships';

describe('relationshipTemplateService', () => {
	let originalLocalStorage: Storage;
	let store: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		originalLocalStorage = global.localStorage;
		store = {};

		global.localStorage = {
			getItem: vi.fn((key: string) => store[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				Object.keys(store).forEach((key) => delete store[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
		vi.clearAllMocks();
	});

	describe('getCustomTemplates', () => {
		it('should return empty array when nothing stored', () => {
			const templates = getCustomTemplates();
			expect(Array.isArray(templates)).toBe(true);
			expect(templates.length).toBe(0);
		});

		it('should return empty array when localStorage is empty', () => {
			store['relationship-templates'] = '';
			const templates = getCustomTemplates();
			expect(templates.length).toBe(0);
		});

		it('should return stored templates', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Mentor/Student',
					relationship: 'mentors',
					reverseRelationship: 'student of',
					bidirectional: true,
					category: 'Professional',
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const result = getCustomTemplates();
			expect(result).toEqual(customTemplates);
			expect(result.length).toBe(1);
			expect(result[0].name).toBe('Mentor/Student');
		});

		it('should return multiple stored templates', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Mentor/Student',
					relationship: 'mentors',
					bidirectional: false,
					category: 'Professional',
					isBuiltIn: false
				},
				{
					id: 'custom-2',
					name: 'Lover',
					relationship: 'loves',
					bidirectional: true,
					category: 'Social',
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const result = getCustomTemplates();
			expect(result.length).toBe(2);
		});

		it('should handle corrupted JSON gracefully', () => {
			store['relationship-templates'] = 'invalid-json{]';
			const templates = getCustomTemplates();
			expect(templates).toEqual([]);
		});

		it('should handle non-array JSON gracefully', () => {
			store['relationship-templates'] = '{"id": "test"}';
			const templates = getCustomTemplates();
			expect(templates).toEqual([]);
		});

		it('should handle null value gracefully', () => {
			store['relationship-templates'] = 'null';
			const templates = getCustomTemplates();
			expect(templates).toEqual([]);
		});

		it('should return templates with all required fields', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Test',
					relationship: 'tests',
					bidirectional: false,
					category: 'Social',
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const result = getCustomTemplates();
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
			expect(result[0]).toHaveProperty('relationship');
			expect(result[0]).toHaveProperty('bidirectional');
			expect(result[0]).toHaveProperty('isBuiltIn');
		});
	});

	describe('saveCustomTemplate', () => {
		it('should create a template with generated ID', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Custom Relationship',
				relationship: 'custom relation',
				bidirectional: false,
				category: 'Social'
			};

			const result = saveCustomTemplate(input);

			expect(result.id).toBeTruthy();
			expect(typeof result.id).toBe('string');
			expect(result.id.length).toBeGreaterThan(0);
		});

		it('should set isBuiltIn to false for custom templates', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Custom',
				relationship: 'custom',
				bidirectional: false
			};

			const result = saveCustomTemplate(input);
			expect(result.isBuiltIn).toBe(false);
		});

		it('should preserve all input fields', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Mentor/Student',
				relationship: 'mentors',
				reverseRelationship: 'student of',
				bidirectional: true,
				strength: 'moderate',
				category: 'Professional',
				description: 'A teaching relationship'
			};

			const result = saveCustomTemplate(input);

			expect(result.name).toBe(input.name);
			expect(result.relationship).toBe(input.relationship);
			expect(result.reverseRelationship).toBe(input.reverseRelationship);
			expect(result.bidirectional).toBe(input.bidirectional);
			expect(result.strength).toBe(input.strength);
			expect(result.category).toBe(input.category);
			expect(result.description).toBe(input.description);
		});

		it('should persist to localStorage', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Test',
				relationship: 'tests',
				bidirectional: false
			};

			saveCustomTemplate(input);

			const stored = store['relationship-templates'];
			expect(stored).toBeDefined();

			const parsed = JSON.parse(stored!);
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed.length).toBe(1);
			expect(parsed[0].name).toBe('Test');
		});

		it('should append to existing templates', () => {
			const existing: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Existing',
					relationship: 'exists',
					bidirectional: false,
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(existing);

			const input: CreateRelationshipTemplateInput = {
				name: 'New',
				relationship: 'new',
				bidirectional: false
			};

			saveCustomTemplate(input);

			const stored = JSON.parse(store['relationship-templates']!);
			expect(stored.length).toBe(2);
			expect(stored[0].name).toBe('Existing');
			expect(stored[1].name).toBe('New');
		});

		it('should generate unique IDs for multiple templates', () => {
			const input1: CreateRelationshipTemplateInput = {
				name: 'First',
				relationship: 'first',
				bidirectional: false
			};

			const input2: CreateRelationshipTemplateInput = {
				name: 'Second',
				relationship: 'second',
				bidirectional: false
			};

			const result1 = saveCustomTemplate(input1);
			const result2 = saveCustomTemplate(input2);

			expect(result1.id).not.toBe(result2.id);
		});

		it('should handle optional fields being omitted', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Minimal',
				relationship: 'minimal',
				bidirectional: true
			};

			const result = saveCustomTemplate(input);

			expect(result.name).toBe('Minimal');
			expect(result.relationship).toBe('minimal');
			expect(result.bidirectional).toBe(true);
			expect(result.isBuiltIn).toBe(false);
		});
	});

	describe('updateCustomTemplate', () => {
		beforeEach(() => {
			const templates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Original',
					relationship: 'original',
					bidirectional: false,
					category: 'Social',
					isBuiltIn: false
				}
			];
			store['relationship-templates'] = JSON.stringify(templates);
		});

		it('should update an existing template', () => {
			const result = updateCustomTemplate('custom-1', { name: 'Updated' });

			expect(result).toBeDefined();
			expect(result?.name).toBe('Updated');
			expect(result?.relationship).toBe('original'); // Unchanged
		});

		it('should return undefined for non-existent ID', () => {
			const result = updateCustomTemplate('non-existent', { name: 'Test' });
			expect(result).toBeUndefined();
		});

		it('should update multiple fields at once', () => {
			const result = updateCustomTemplate('custom-1', {
				name: 'New Name',
				relationship: 'new relation',
				strength: 'strong'
			});

			expect(result?.name).toBe('New Name');
			expect(result?.relationship).toBe('new relation');
			expect(result?.strength).toBe('strong');
		});

		it('should preserve unmodified fields', () => {
			const result = updateCustomTemplate('custom-1', { name: 'Changed' });

			expect(result?.name).toBe('Changed');
			expect(result?.relationship).toBe('original');
			expect(result?.bidirectional).toBe(false);
			expect(result?.category).toBe('Social');
		});

		it('should persist updates to localStorage', () => {
			updateCustomTemplate('custom-1', { name: 'Persisted' });

			const stored = JSON.parse(store['relationship-templates']!);
			expect(stored[0].name).toBe('Persisted');
		});

		it('should not modify ID or isBuiltIn', () => {
			const result = updateCustomTemplate('custom-1', { name: 'Test' });

			expect(result?.id).toBe('custom-1');
			expect(result?.isBuiltIn).toBe(false);
		});

		it('should handle updating with empty object', () => {
			const result = updateCustomTemplate('custom-1', {});

			expect(result).toBeDefined();
			expect(result?.name).toBe('Original'); // Unchanged
		});

		it('should update strength field', () => {
			const result = updateCustomTemplate('custom-1', { strength: 'weak' });
			expect(result?.strength).toBe('weak');
		});

		it('should update bidirectional field', () => {
			const result = updateCustomTemplate('custom-1', { bidirectional: true });
			expect(result?.bidirectional).toBe(true);
		});

		it('should update reverseRelationship field', () => {
			const result = updateCustomTemplate('custom-1', {
				reverseRelationship: 'reverse relation'
			});
			expect(result?.reverseRelationship).toBe('reverse relation');
		});
	});

	describe('deleteCustomTemplate', () => {
		beforeEach(() => {
			const templates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'First',
					relationship: 'first',
					bidirectional: false,
					isBuiltIn: false
				},
				{
					id: 'custom-2',
					name: 'Second',
					relationship: 'second',
					bidirectional: false,
					isBuiltIn: false
				}
			];
			store['relationship-templates'] = JSON.stringify(templates);
		});

		it('should remove a template by ID', () => {
			const result = deleteCustomTemplate('custom-1');

			expect(result).toBe(true);

			const remaining = getCustomTemplates();
			expect(remaining.length).toBe(1);
			expect(remaining[0].id).toBe('custom-2');
		});

		it('should return false for non-existent ID', () => {
			const result = deleteCustomTemplate('non-existent');
			expect(result).toBe(false);
		});

		it('should persist deletion to localStorage', () => {
			deleteCustomTemplate('custom-1');

			const stored = JSON.parse(store['relationship-templates']!);
			expect(stored.length).toBe(1);
			expect(stored[0].id).toBe('custom-2');
		});

		it('should handle deleting last template', () => {
			deleteCustomTemplate('custom-1');
			deleteCustomTemplate('custom-2');

			const remaining = getCustomTemplates();
			expect(remaining.length).toBe(0);

			const stored = JSON.parse(store['relationship-templates']!);
			expect(stored).toEqual([]);
		});

		it('should not modify other templates when deleting one', () => {
			deleteCustomTemplate('custom-1');

			const remaining = getCustomTemplates();
			expect(remaining[0]).toEqual({
				id: 'custom-2',
				name: 'Second',
				relationship: 'second',
				bidirectional: false,
				isBuiltIn: false
			});
		});

		it('should handle deletion when no templates exist', () => {
			store['relationship-templates'] = '[]';
			const result = deleteCustomTemplate('any-id');
			expect(result).toBe(false);
		});
	});

	describe('getAllTemplates', () => {
		it('should return built-in templates when no custom templates exist', () => {
			const templates = getAllTemplates();

			expect(templates.length).toBeGreaterThan(0);

			const builtInCount = templates.filter((t) => t.isBuiltIn).length;
			expect(builtInCount).toBeGreaterThan(0);
		});

		it('should merge built-in and custom templates', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Custom',
					relationship: 'custom',
					bidirectional: false,
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const all = getAllTemplates();

			const builtIn = all.filter((t) => t.isBuiltIn);
			const custom = all.filter((t) => !t.isBuiltIn);

			expect(builtIn.length).toBeGreaterThan(0);
			expect(custom.length).toBe(1);
			expect(all.length).toBe(builtIn.length + custom.length);
		});

		it('should include all built-in templates', () => {
			const templates = getAllTemplates();
			const builtInTemplates = templates.filter((t) => t.isBuiltIn);

			// Should have at least 10 built-in templates per spec
			expect(builtInTemplates.length).toBeGreaterThanOrEqual(10);
		});

		it('should preserve template properties when merging', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Custom',
					relationship: 'custom',
					reverseRelationship: 'reverse custom',
					bidirectional: true,
					strength: 'strong',
					category: 'Social',
					description: 'Test description',
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const all = getAllTemplates();
			const custom = all.find((t) => t.id === 'custom-1');

			expect(custom).toBeDefined();
			expect(custom?.name).toBe('Custom');
			expect(custom?.reverseRelationship).toBe('reverse custom');
			expect(custom?.strength).toBe('strong');
			expect(custom?.description).toBe('Test description');
		});

		it('should not duplicate templates', () => {
			const templates = getAllTemplates();
			const ids = templates.map((t) => t.id);
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});
	});

	describe('getTemplatesByCategory', () => {
		it('should group templates by category', () => {
			const byCategory = getTemplatesByCategory();

			expect(byCategory instanceof Map).toBe(true);
			expect(byCategory.size).toBeGreaterThan(0);
		});

		it('should include Social category', () => {
			const byCategory = getTemplatesByCategory();
			const social = byCategory.get('Social');

			expect(social).toBeDefined();
			expect(Array.isArray(social)).toBe(true);
			expect(social!.length).toBeGreaterThan(0);
		});

		it('should include Professional category', () => {
			const byCategory = getTemplatesByCategory();
			const professional = byCategory.get('Professional');

			expect(professional).toBeDefined();
			expect(professional!.length).toBeGreaterThan(0);
		});

		it('should include Family category', () => {
			const byCategory = getTemplatesByCategory();
			const family = byCategory.get('Family');

			expect(family).toBeDefined();
			expect(family!.length).toBeGreaterThan(0);
		});

		it('should include Faction category', () => {
			const byCategory = getTemplatesByCategory();
			const faction = byCategory.get('Faction');

			expect(faction).toBeDefined();
			expect(faction!.length).toBeGreaterThan(0);
		});

		it('should group custom templates by category', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Custom Social',
					relationship: 'custom',
					bidirectional: false,
					category: 'Social',
					isBuiltIn: false
				},
				{
					id: 'custom-2',
					name: 'Custom Family',
					relationship: 'custom family',
					bidirectional: false,
					category: 'Family',
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			const byCategory = getTemplatesByCategory();

			const social = byCategory.get('Social');
			const family = byCategory.get('Family');

			expect(social?.some((t) => t.id === 'custom-1')).toBe(true);
			expect(family?.some((t) => t.id === 'custom-2')).toBe(true);
		});

		it('should handle templates without category', () => {
			const customTemplates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'No Category',
					relationship: 'no cat',
					bidirectional: false,
					isBuiltIn: false
				}
			];

			store['relationship-templates'] = JSON.stringify(customTemplates);

			// Should not throw
			expect(() => getTemplatesByCategory()).not.toThrow();

			const byCategory = getTemplatesByCategory();

			// Template with no category might be in 'Uncategorized' or similar
			const allTemplates = Array.from(byCategory.values()).flat();
			const noCatTemplate = allTemplates.find((t) => t.id === 'custom-1');

			// The template should exist somewhere in the categorized results
			expect(noCatTemplate || byCategory.get('Uncategorized')).toBeDefined();
		});

		it('should return all templates when flattened', () => {
			const byCategory = getTemplatesByCategory();
			const allFromMap = Array.from(byCategory.values()).flat();
			const allTemplates = getAllTemplates();

			expect(allFromMap.length).toBe(allTemplates.length);
		});
	});

	describe('resetCustomTemplates', () => {
		beforeEach(() => {
			const templates: RelationshipTemplate[] = [
				{
					id: 'custom-1',
					name: 'Custom',
					relationship: 'custom',
					bidirectional: false,
					isBuiltIn: false
				}
			];
			store['relationship-templates'] = JSON.stringify(templates);
		});

		it('should clear all custom templates', () => {
			expect(getCustomTemplates().length).toBe(1);

			resetCustomTemplates();

			const remaining = getCustomTemplates();
			expect(remaining.length).toBe(0);
		});

		it('should remove localStorage key', () => {
			expect(store['relationship-templates']).toBeDefined();

			resetCustomTemplates();

			expect(store['relationship-templates']).toBeUndefined();
		});

		it('should not affect built-in templates', () => {
			const beforeReset = getAllTemplates();
			const builtInCountBefore = beforeReset.filter((t) => t.isBuiltIn).length;

			resetCustomTemplates();

			const afterReset = getAllTemplates();
			const builtInCountAfter = afterReset.filter((t) => t.isBuiltIn).length;

			expect(builtInCountBefore).toBe(builtInCountAfter);
		});

		it('should work when no custom templates exist', () => {
			delete store['relationship-templates'];

			// Should not throw
			expect(() => resetCustomTemplates()).not.toThrow();
		});

		it('should be retrievable after reset', () => {
			resetCustomTemplates();

			const templates = getCustomTemplates();
			expect(templates).toEqual([]);
		});
	});

	describe('SSR Context Handling', () => {
		it('should handle window undefined in getCustomTemplates', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing SSR behavior
			delete global.window;

			const templates = getCustomTemplates();
			expect(templates).toEqual([]);

			global.window = originalWindow;
		});

		it('should handle window undefined in saveCustomTemplate', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing SSR behavior
			delete global.window;

			const input: CreateRelationshipTemplateInput = {
				name: 'Test',
				relationship: 'tests',
				bidirectional: false
			};

			// Should not throw
			expect(() => saveCustomTemplate(input)).not.toThrow();

			global.window = originalWindow;
		});

		it('should handle window undefined in getAllTemplates', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing SSR behavior
			delete global.window;

			const templates = getAllTemplates();
			// Should still return built-in templates
			expect(templates.length).toBeGreaterThan(0);

			global.window = originalWindow;
		});

		it('should handle window undefined in getTemplatesByCategory', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing SSR behavior
			delete global.window;

			// Should not throw
			expect(() => getTemplatesByCategory()).not.toThrow();

			global.window = originalWindow;
		});
	});

	describe('Error Handling', () => {
		it('should handle corrupted localStorage data in saveCustomTemplate', () => {
			store['relationship-templates'] = 'invalid-json{]';

			const input: CreateRelationshipTemplateInput = {
				name: 'Test',
				relationship: 'tests',
				bidirectional: false
			};

			// Should not throw, should replace corrupted data
			expect(() => saveCustomTemplate(input)).not.toThrow();

			const templates = getCustomTemplates();
			expect(templates.length).toBeGreaterThan(0);
		});

		it('should handle corrupted localStorage data in updateCustomTemplate', () => {
			store['relationship-templates'] = 'invalid-json{]';

			const result = updateCustomTemplate('any-id', { name: 'Test' });
			expect(result).toBeUndefined();
		});

		it('should handle corrupted localStorage data in deleteCustomTemplate', () => {
			store['relationship-templates'] = 'invalid-json{]';

			const result = deleteCustomTemplate('any-id');
			expect(result).toBe(false);
		});
	});

	describe('Integration Tests', () => {
		it('should support complete workflow: save, update, delete', () => {
			// Save
			const input: CreateRelationshipTemplateInput = {
				name: 'Original',
				relationship: 'original',
				bidirectional: false,
				category: 'Social'
			};

			const created = saveCustomTemplate(input);
			expect(created.id).toBeTruthy();
			expect(created.name).toBe('Original');

			// Update
			const updated = updateCustomTemplate(created.id, { name: 'Modified' });
			expect(updated?.name).toBe('Modified');
			expect(updated?.relationship).toBe('original');

			// Delete
			const deleted = deleteCustomTemplate(created.id);
			expect(deleted).toBe(true);

			// Verify
			const templates = getCustomTemplates();
			expect(templates.length).toBe(0);
		});

		it('should maintain consistency across operations', () => {
			const input1: CreateRelationshipTemplateInput = {
				name: 'First',
				relationship: 'first',
				bidirectional: false
			};

			const input2: CreateRelationshipTemplateInput = {
				name: 'Second',
				relationship: 'second',
				bidirectional: false
			};

			const t1 = saveCustomTemplate(input1);
			const t2 = saveCustomTemplate(input2);

			expect(getCustomTemplates().length).toBe(2);

			updateCustomTemplate(t1.id, { name: 'Updated First' });

			expect(getCustomTemplates().length).toBe(2);

			deleteCustomTemplate(t2.id);

			const remaining = getCustomTemplates();
			expect(remaining.length).toBe(1);
			expect(remaining[0].id).toBe(t1.id);
			expect(remaining[0].name).toBe('Updated First');
		});

		it('should handle rapid sequential operations', () => {
			const input: CreateRelationshipTemplateInput = {
				name: 'Test',
				relationship: 'test',
				bidirectional: false
			};

			const t1 = saveCustomTemplate(input);
			const t2 = saveCustomTemplate(input);
			const t3 = saveCustomTemplate(input);

			expect(getCustomTemplates().length).toBe(3);

			deleteCustomTemplate(t2.id);

			expect(getCustomTemplates().length).toBe(2);

			updateCustomTemplate(t1.id, { name: 'Updated' });

			const templates = getCustomTemplates();
			expect(templates.find((t) => t.id === t1.id)?.name).toBe('Updated');
		});
	});
});
