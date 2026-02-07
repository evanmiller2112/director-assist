/**
 * Tests for Field Suggestion Repository
 *
 * This repository manages field-level AI suggestions stored in IndexedDB, providing
 * functionality for storing, retrieving, and managing suggestions for specific entity fields.
 *
 * Covers:
 * - CRUD operations (create, getById, updateStatus, deleteById, deleteByEntityId)
 * - Query operations (getByEntityId, getByEntityType, getPendingForEntity)
 * - Status management (pending, accepted, dismissed transitions)
 * - Entity associations (with and without entityId)
 * - Edge cases (missing entityId, various entity types, unicode values)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { fieldSuggestionRepository } from './fieldSuggestionRepository';
import { db } from '../index';
import type { FieldSuggestion } from '$lib/types/ai';

describe('FieldSuggestionRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear field suggestions table before each test
		await db.fieldSuggestions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.fieldSuggestions.clear();
	});

	// Helper function to create a mock field suggestion
	const createMockSuggestion = (
		overrides: Partial<FieldSuggestion> = {}
	): FieldSuggestion => ({
		id: `fs-${Date.now()}-${Math.random()}`,
		entityType: 'character',
		fieldKey: 'description',
		suggestedValue: 'A mysterious wanderer from the north',
		status: 'pending',
		createdAt: new Date(),
		...overrides
	});

	describe('create', () => {
		it('should create field suggestion with all required fields', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Eldric the Brave'
			});

			expect(suggestion).toBeDefined();
			expect(suggestion.id).toBeDefined();
			expect(suggestion.id.length).toBeGreaterThan(0);
			expect(suggestion.entityType).toBe('character');
			expect(suggestion.fieldKey).toBe('name');
			expect(suggestion.suggestedValue).toBe('Eldric the Brave');
			expect(suggestion.status).toBe('pending');
			expect(suggestion.createdAt).toBeInstanceOf(Date);
		});

		it('should create suggestion with entityId', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityId: 'character-123',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'A noble knight'
			});

			expect(suggestion.entityId).toBe('character-123');
			expect(suggestion.entityType).toBe('character');
		});

		it('should create suggestion without entityId', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'location',
				fieldKey: 'atmosphere',
				suggestedValue: 'Dark and foreboding'
			});

			expect(suggestion.entityId).toBeUndefined();
			expect(suggestion.entityType).toBe('location');
		});

		it('should generate unique ID for each suggestion', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Value 1'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Value 2'
			});

			expect(suggestion1.id).not.toBe(suggestion2.id);
		});

		it('should set createdAt timestamp automatically', async () => {
			const before = new Date();
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'item',
				fieldKey: 'description',
				suggestedValue: 'A magical sword'
			});
			const after = new Date();

			expect(suggestion.createdAt).toBeInstanceOf(Date);
			expect(suggestion.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(suggestion.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should default status to pending', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'faction',
				fieldKey: 'goals',
				suggestedValue: 'Seek power'
			});

			expect(suggestion.status).toBe('pending');
		});

		it('should persist suggestion to database', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'backstory',
				suggestedValue: 'Born in a small village'
			});

			const stored = await db.fieldSuggestions.get(suggestion.id);
			expect(stored).toBeDefined();
			expect(stored?.entityId).toBe('char-1');
			expect(stored?.suggestedValue).toBe('Born in a small village');
		});

		it('should handle various entity types', async () => {
			const types = ['character', 'location', 'faction', 'item', 'plot_hook'];

			for (const type of types) {
				const suggestion = await fieldSuggestionRepository.create({
					entityType: type,
					fieldKey: 'description',
					suggestedValue: `Description for ${type}`
				});

				expect(suggestion.entityType).toBe(type);
			}
		});

		it('should handle various field keys', async () => {
			const fieldKeys = ['name', 'description', 'backstory', 'goals', 'relationships'];

			for (const key of fieldKeys) {
				const suggestion = await fieldSuggestionRepository.create({
					entityType: 'character',
					fieldKey: key,
					suggestedValue: `Value for ${key}`
				});

				expect(suggestion.fieldKey).toBe(key);
			}
		});

		it('should handle empty string suggestedValue', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'notes',
				suggestedValue: ''
			});

			expect(suggestion.suggestedValue).toBe('');
		});

		it('should handle very long suggestedValue', async () => {
			const longValue = 'A'.repeat(5000);
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'location',
				fieldKey: 'description',
				suggestedValue: longValue
			});

			expect(suggestion.suggestedValue).toBe(longValue);
			expect(suggestion.suggestedValue.length).toBe(5000);
		});

		it('should handle unicode characters in suggestedValue', async () => {
			const unicodeValue = 'Description 世界 🐉 ñ ü é';
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: unicodeValue
			});

			expect(suggestion.suggestedValue).toBe(unicodeValue);
		});

		it('should handle special characters in entityId', async () => {
			const specialId = 'entity-with-dashes_and_underscores.123';
			const suggestion = await fieldSuggestionRepository.create({
				entityId: specialId,
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			expect(suggestion.entityId).toBe(specialId);
		});

		it('should handle markdown in suggestedValue', async () => {
			const markdownValue = '# Heading\n\n**Bold** and *italic*\n\n- List item';
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'location',
				fieldKey: 'description',
				suggestedValue: markdownValue
			});

			expect(suggestion.suggestedValue).toBe(markdownValue);
		});

		it('should increment count after creating suggestion', async () => {
			const countBefore = await db.fieldSuggestions.count();
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});
			const countAfter = await db.fieldSuggestions.count();

			expect(countAfter).toBe(countBefore + 1);
		});
	});

	describe('getById', () => {
		it('should retrieve suggestion by ID', async () => {
			const created = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Thorin'
			});

			const retrieved = await fieldSuggestionRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.suggestedValue).toBe('Thorin');
		});

		it('should return undefined for non-existent ID', async () => {
			const retrieved = await fieldSuggestionRepository.getById('non-existent-id');

			expect(retrieved).toBeUndefined();
		});

		it('should return suggestion with all properties intact', async () => {
			const created = await fieldSuggestionRepository.create({
				entityId: 'loc-1',
				entityType: 'location',
				fieldKey: 'description',
				suggestedValue: 'A dark forest'
			});

			const retrieved = await fieldSuggestionRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.entityId).toBe('loc-1');
			expect(retrieved?.entityType).toBe('location');
			expect(retrieved?.fieldKey).toBe('description');
			expect(retrieved?.suggestedValue).toBe('A dark forest');
			expect(retrieved?.status).toBe('pending');
			expect(retrieved?.createdAt).toBeInstanceOf(Date);
		});

		it('should return suggestion without entityId when not set', async () => {
			const created = await fieldSuggestionRepository.create({
				entityType: 'faction',
				fieldKey: 'goals',
				suggestedValue: 'Dominate the realm'
			});

			const retrieved = await fieldSuggestionRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.entityId).toBeUndefined();
			expect(retrieved?.entityType).toBe('faction');
		});

		it('should return correct suggestion when multiple exist', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'First'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Second'
			});
			const suggestion3 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Third'
			});

			const retrieved = await fieldSuggestionRepository.getById(suggestion2.id);

			expect(retrieved?.id).toBe(suggestion2.id);
			expect(retrieved?.suggestedValue).toBe('Second');
		});
	});

	describe('getByEntityId', () => {
		it('should return all suggestions for specific entity', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Aragorn'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'A ranger from the north'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-2',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Gandalf'
			});

			const results = await fieldSuggestionRepository.getByEntityId('char-1');

			expect(results).toHaveLength(2);
			expect(results.every((s) => s.entityId === 'char-1')).toBe(true);
		});

		it('should return empty array when no suggestions exist for entity', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			const results = await fieldSuggestionRepository.getByEntityId('char-2');

			expect(results).toEqual([]);
		});

		it('should not return suggestions without entityId', async () => {
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'No entity'
			});

			const results = await fieldSuggestionRepository.getByEntityId('char-1');

			expect(results).toEqual([]);
		});

		it('should return suggestions with different statuses', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Pending'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Accepted'
			});

			await fieldSuggestionRepository.updateStatus(suggestion2.id, 'accepted');

			const results = await fieldSuggestionRepository.getByEntityId('char-1');

			expect(results).toHaveLength(2);
			expect(results.find((s) => s.id === suggestion1.id)?.status).toBe('pending');
			expect(results.find((s) => s.id === suggestion2.id)?.status).toBe('accepted');
		});

		it('should handle entity ID with special characters', async () => {
			const specialId = 'entity:with-special_chars.123';
			await fieldSuggestionRepository.create({
				entityId: specialId,
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			const results = await fieldSuggestionRepository.getByEntityId(specialId);

			expect(results).toHaveLength(1);
		});
	});

	describe('getByEntityType', () => {
		it('should return all suggestions for specific entity type', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character 1'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-2',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character 2'
			});
			await fieldSuggestionRepository.create({
				entityId: 'loc-1',
				entityType: 'location',
				fieldKey: 'name',
				suggestedValue: 'Location 1'
			});

			const results = await fieldSuggestionRepository.getByEntityType('character');

			expect(results).toHaveLength(2);
			expect(results.every((s) => s.entityType === 'character')).toBe(true);
		});

		it('should return empty array when no suggestions exist for entity type', async () => {
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character'
			});

			const results = await fieldSuggestionRepository.getByEntityType('location');

			expect(results).toEqual([]);
		});

		it('should include suggestions with and without entityId', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'With ID'
			});
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Without ID'
			});

			const results = await fieldSuggestionRepository.getByEntityType('character');

			expect(results).toHaveLength(2);
		});

		it('should return suggestions with different statuses', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'location',
				fieldKey: 'name',
				suggestedValue: 'Pending location'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'location',
				fieldKey: 'description',
				suggestedValue: 'Dismissed location'
			});

			await fieldSuggestionRepository.updateStatus(suggestion2.id, 'dismissed');

			const results = await fieldSuggestionRepository.getByEntityType('location');

			expect(results).toHaveLength(2);
			expect(results.find((s) => s.id === suggestion1.id)?.status).toBe('pending');
			expect(results.find((s) => s.id === suggestion2.id)?.status).toBe('dismissed');
		});

		it('should handle all common entity types', async () => {
			const types = ['character', 'location', 'faction', 'item', 'plot_hook'];

			for (const type of types) {
				await fieldSuggestionRepository.create({
					entityType: type,
					fieldKey: 'test',
					suggestedValue: `Test ${type}`
				});

				const results = await fieldSuggestionRepository.getByEntityType(type);
				expect(results.length).toBeGreaterThan(0);
			}
		});
	});

	describe('getPendingForEntity', () => {
		it('should return pending suggestions for specific entity', async () => {
			const pending1 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Pending name'
			});
			const accepted = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Accepted description'
			});
			const pending2 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'backstory',
				suggestedValue: 'Pending backstory'
			});

			await fieldSuggestionRepository.updateStatus(accepted.id, 'accepted');

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'char-1',
				'character'
			);

			expect(results).toHaveLength(2);
			expect(results.every((s) => s.status === 'pending')).toBe(true);
			expect(results.every((s) => s.entityId === 'char-1')).toBe(true);
			expect(results.every((s) => s.entityType === 'character')).toBe(true);
		});

		it('should return empty array when no pending suggestions exist', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'char-1',
				'character'
			);

			expect(results).toEqual([]);
		});

		it('should not return suggestions from different entity', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character 1'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-2',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character 2'
			});

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'char-1',
				'character'
			);

			expect(results).toHaveLength(1);
			expect(results[0].entityId).toBe('char-1');
		});

		it('should not return suggestions from different entity type', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'entity-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Character'
			});
			await fieldSuggestionRepository.create({
				entityId: 'entity-1',
				entityType: 'location',
				fieldKey: 'name',
				suggestedValue: 'Location'
			});

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'entity-1',
				'character'
			);

			expect(results).toHaveLength(1);
			expect(results[0].entityType).toBe('character');
		});

		it('should not return dismissed suggestions', async () => {
			const pending = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Pending'
			});
			const dismissed = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Dismissed'
			});

			await fieldSuggestionRepository.updateStatus(dismissed.id, 'dismissed');

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'char-1',
				'character'
			);

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe(pending.id);
		});

		it('should return empty array when entity has no entityId', async () => {
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'No entity ID'
			});

			const results = await fieldSuggestionRepository.getPendingForEntity(
				'char-1',
				'character'
			);

			expect(results).toEqual([]);
		});
	});

	describe('updateStatus', () => {
		it('should update status to accepted', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');

			const updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should update status to dismissed', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'dismissed');

			const updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('dismissed');
		});

		it('should update status from accepted back to pending', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');
			await fieldSuggestionRepository.updateStatus(suggestion.id, 'pending');

			const updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('pending');
		});

		it('should not affect other suggestions', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'First'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Second'
			});

			await fieldSuggestionRepository.updateStatus(suggestion1.id, 'accepted');

			const updated1 = await db.fieldSuggestions.get(suggestion1.id);
			const updated2 = await db.fieldSuggestions.get(suggestion2.id);

			expect(updated1?.status).toBe('accepted');
			expect(updated2?.status).toBe('pending');
		});

		it('should not change other properties when updating status', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Original value'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');

			const updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.entityId).toBe('char-1');
			expect(updated?.entityType).toBe('character');
			expect(updated?.fieldKey).toBe('name');
			expect(updated?.suggestedValue).toBe('Original value');
			expect(updated?.createdAt.getTime()).toBe(suggestion.createdAt.getTime());
		});

		it('should handle updating already accepted suggestion to accepted', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');
			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');

			const updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should throw error when updating non-existent suggestion', async () => {
			await expect(
				fieldSuggestionRepository.updateStatus('non-existent-id', 'accepted')
			).rejects.toThrow();
		});
	});

	describe('deleteById', () => {
		it('should delete suggestion by ID', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			await fieldSuggestionRepository.deleteById(suggestion.id);

			const retrieved = await db.fieldSuggestions.get(suggestion.id);
			expect(retrieved).toBeUndefined();
		});

		it('should only delete specified suggestion', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'First'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Second'
			});

			await fieldSuggestionRepository.deleteById(suggestion1.id);

			const retrieved1 = await db.fieldSuggestions.get(suggestion1.id);
			const retrieved2 = await db.fieldSuggestions.get(suggestion2.id);

			expect(retrieved1).toBeUndefined();
			expect(retrieved2).toBeDefined();
		});

		it('should not throw error when deleting non-existent suggestion', async () => {
			await expect(
				fieldSuggestionRepository.deleteById('non-existent-id')
			).resolves.not.toThrow();
		});

		it('should reduce count after deletion', async () => {
			const suggestion1 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'First'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Second'
			});

			let count = await db.fieldSuggestions.count();
			expect(count).toBe(2);

			await fieldSuggestionRepository.deleteById(suggestion1.id);

			count = await db.fieldSuggestions.count();
			expect(count).toBe(1);
		});
	});

	describe('deleteByEntityId', () => {
		it('should delete all suggestions for specific entity', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Name'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Description'
			});
			await fieldSuggestionRepository.create({
				entityId: 'char-2',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Other'
			});

			await fieldSuggestionRepository.deleteByEntityId('char-1');

			const char1Suggestions = await fieldSuggestionRepository.getByEntityId('char-1');
			const char2Suggestions = await fieldSuggestionRepository.getByEntityId('char-2');

			expect(char1Suggestions).toHaveLength(0);
			expect(char2Suggestions).toHaveLength(1);
		});

		it('should not delete suggestions without entityId', async () => {
			await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'With ID'
			});
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Without ID'
			});

			await fieldSuggestionRepository.deleteByEntityId('char-1');

			const all = await db.fieldSuggestions.toArray();
			expect(all).toHaveLength(1);
			expect(all[0].entityId).toBeUndefined();
		});

		it('should not throw error when deleting from non-existent entity', async () => {
			await expect(
				fieldSuggestionRepository.deleteByEntityId('non-existent-entity')
			).resolves.not.toThrow();
		});

		it('should delete suggestions with different statuses', async () => {
			const pending = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Pending'
			});
			const accepted = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Accepted'
			});

			await fieldSuggestionRepository.updateStatus(accepted.id, 'accepted');
			await fieldSuggestionRepository.deleteByEntityId('char-1');

			const all = await db.fieldSuggestions.toArray();
			expect(all).toHaveLength(0);
		});

		it('should handle deleting large number of suggestions', async () => {
			for (let i = 0; i < 50; i++) {
				await fieldSuggestionRepository.create({
					entityId: 'char-1',
					entityType: 'character',
					fieldKey: `field-${i}`,
					suggestedValue: `Value ${i}`
				});
			}

			await fieldSuggestionRepository.deleteByEntityId('char-1');

			const count = await db.fieldSuggestions.count();
			expect(count).toBe(0);
		});
	});

	describe('Edge Cases and Validation', () => {
		it('should handle rapid successive operations', async () => {
			const promises = [];
			for (let i = 0; i < 10; i++) {
				promises.push(
					fieldSuggestionRepository.create({
						entityType: 'character',
						fieldKey: 'name',
						suggestedValue: `Rapid ${i}`
					})
				);
			}

			await Promise.all(promises);

			const count = await db.fieldSuggestions.count();
			expect(count).toBe(10);
		});

		it('should handle mixed operations in sequence', async () => {
			// Create
			const suggestion1 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'First'
			});
			const suggestion2 = await fieldSuggestionRepository.create({
				entityId: 'char-1',
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: 'Second'
			});

			// Update status
			await fieldSuggestionRepository.updateStatus(suggestion1.id, 'accepted');

			// Delete one
			await fieldSuggestionRepository.deleteById(suggestion2.id);

			// Create another
			await fieldSuggestionRepository.create({
				entityId: 'char-2',
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Third'
			});

			const count = await db.fieldSuggestions.count();
			expect(count).toBe(2);

			const char1Suggestions = await fieldSuggestionRepository.getByEntityId('char-1');
			expect(char1Suggestions).toHaveLength(1);
			expect(char1Suggestions[0].status).toBe('accepted');
		});

		it('should handle timestamp edge cases', async () => {
			const veryOldDate = new Date('1970-01-01T00:00:00Z');
			const veryNewDate = new Date('2099-12-31T23:59:59Z');

			const suggestion1 = createMockSuggestion({
				id: 'fs-old',
				createdAt: veryOldDate
			});
			const suggestion2 = createMockSuggestion({
				id: 'fs-new',
				createdAt: veryNewDate
			});

			await db.fieldSuggestions.bulkAdd([suggestion1, suggestion2]);

			const stored1 = await db.fieldSuggestions.get('fs-old');
			const stored2 = await db.fieldSuggestions.get('fs-new');

			expect(stored1?.createdAt.getTime()).toBe(veryOldDate.getTime());
			expect(stored2?.createdAt.getTime()).toBe(veryNewDate.getTime());
		});

		it('should handle very long field keys', async () => {
			const longKey = 'field_' + 'x'.repeat(500);
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: longKey,
				suggestedValue: 'Test'
			});

			expect(suggestion.fieldKey).toBe(longKey);
		});

		it('should handle newlines in suggestedValue', async () => {
			const valueWithNewlines = 'Line 1\nLine 2\nLine 3';
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'description',
				suggestedValue: valueWithNewlines
			});

			expect(suggestion.suggestedValue).toBe(valueWithNewlines);
		});

		it('should handle JSON in suggestedValue', async () => {
			const jsonValue = JSON.stringify({ key: 'value', nested: { data: true } });
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'metadata',
				suggestedValue: jsonValue
			});

			expect(suggestion.suggestedValue).toBe(jsonValue);
		});

		it('should maintain data integrity across multiple queries', async () => {
			const entityId = 'char-1';
			const entityType = 'character';

			await fieldSuggestionRepository.create({
				entityId,
				entityType,
				fieldKey: 'name',
				suggestedValue: 'Pending 1'
			});
			const accepted = await fieldSuggestionRepository.create({
				entityId,
				entityType,
				fieldKey: 'description',
				suggestedValue: 'Accepted 1'
			});
			await fieldSuggestionRepository.create({
				entityId,
				entityType,
				fieldKey: 'backstory',
				suggestedValue: 'Pending 2'
			});

			await fieldSuggestionRepository.updateStatus(accepted.id, 'accepted');

			const [byEntityId, byEntityType, pending] = await Promise.all([
				fieldSuggestionRepository.getByEntityId(entityId),
				fieldSuggestionRepository.getByEntityType(entityType),
				fieldSuggestionRepository.getPendingForEntity(entityId, entityType)
			]);

			expect(byEntityId).toHaveLength(3);
			expect(byEntityType).toHaveLength(3);
			expect(pending).toHaveLength(2);
		});

		it('should handle empty table operations', async () => {
			const byEntityId = await fieldSuggestionRepository.getByEntityId('char-1');
			const byEntityType = await fieldSuggestionRepository.getByEntityType('character');
			const pending = await fieldSuggestionRepository.getPendingForEntity('char-1', 'character');

			expect(byEntityId).toEqual([]);
			expect(byEntityType).toEqual([]);
			expect(pending).toEqual([]);
		});

		it('should handle all status transition combinations', async () => {
			const suggestion = await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Test'
			});

			// pending -> accepted
			await fieldSuggestionRepository.updateStatus(suggestion.id, 'accepted');
			let updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');

			// accepted -> dismissed
			await fieldSuggestionRepository.updateStatus(suggestion.id, 'dismissed');
			updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('dismissed');

			// dismissed -> pending
			await fieldSuggestionRepository.updateStatus(suggestion.id, 'pending');
			updated = await db.fieldSuggestions.get(suggestion.id);
			expect(updated?.status).toBe('pending');
		});

		it('should handle case-sensitive entity types', async () => {
			await fieldSuggestionRepository.create({
				entityType: 'Character',
				fieldKey: 'name',
				suggestedValue: 'Uppercase'
			});
			await fieldSuggestionRepository.create({
				entityType: 'character',
				fieldKey: 'name',
				suggestedValue: 'Lowercase'
			});

			const uppercase = await fieldSuggestionRepository.getByEntityType('Character');
			const lowercase = await fieldSuggestionRepository.getByEntityType('character');

			expect(uppercase).toHaveLength(1);
			expect(lowercase).toHaveLength(1);
		});
	});
});
