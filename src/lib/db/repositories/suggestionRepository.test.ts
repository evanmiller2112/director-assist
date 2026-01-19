/**
 * Tests for Suggestion Repository
 *
 * This repository manages AI-generated suggestions stored in IndexedDB, providing
 * functionality for storing, retrieving, querying, and managing proactive AI insights.
 *
 * Covers:
 * - CRUD operations (add, getById, getAll, update, delete, clearAll)
 * - Status management (dismiss, accept, getByStatus, getPendingCount)
 * - Query operations (getByType, getByAffectedEntity, getByAffectedEntities, query)
 * - Expiration handling (getExpired, deleteExpired, isExpired, getActive)
 * - Utility operations (bulkAdd, getStats)
 * - Edge cases (expired suggestions, relevance scores, empty filters)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { suggestionRepository } from './suggestionRepository';
import { db } from '../index';
import type { AISuggestion } from '$lib/types/ai';

describe('SuggestionRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear suggestions table before each test
		await db.suggestions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.suggestions.clear();
	});

	// Helper function to create a mock suggestion
	const createMockSuggestion = (overrides: Partial<AISuggestion> = {}): AISuggestion => ({
		id: `suggestion-${Date.now()}-${Math.random()}`,
		type: 'relationship',
		title: 'Test Suggestion',
		description: 'This is a test suggestion',
		relevanceScore: 75,
		affectedEntityIds: ['entity-1'],
		status: 'pending',
		createdAt: new Date(),
		...overrides
	});

	describe('add', () => {
		it('should add a new suggestion to the database', async () => {
			const suggestion = createMockSuggestion();

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored).toBeDefined();
			expect(stored?.id).toBe(suggestion.id);
			expect(stored?.title).toBe('Test Suggestion');
		});

		it('should store all suggestion properties correctly', async () => {
			const suggestion = createMockSuggestion({
				type: 'inconsistency',
				title: 'Data Inconsistency',
				description: 'Found conflicting information',
				relevanceScore: 90,
				affectedEntityIds: ['entity-1', 'entity-2'],
				status: 'pending'
			});

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.type).toBe('inconsistency');
			expect(stored?.title).toBe('Data Inconsistency');
			expect(stored?.description).toBe('Found conflicting information');
			expect(stored?.relevanceScore).toBe(90);
			expect(stored?.affectedEntityIds).toEqual(['entity-1', 'entity-2']);
			expect(stored?.status).toBe('pending');
			expect(stored?.createdAt).toBeInstanceOf(Date);
		});

		it('should store suggestion with suggestedAction', async () => {
			const suggestion = createMockSuggestion({
				suggestedAction: {
					actionType: 'create-relationship',
					actionData: {
						sourceId: 'entity-1',
						targetId: 'entity-2',
						relationship: 'allied_with'
					}
				}
			});

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.suggestedAction).toBeDefined();
			expect(stored?.suggestedAction?.actionType).toBe('create-relationship');
			expect(stored?.suggestedAction?.actionData).toEqual({
				sourceId: 'entity-1',
				targetId: 'entity-2',
				relationship: 'allied_with'
			});
		});

		it('should store suggestion with expiresAt date', async () => {
			const expiresAt = new Date('2025-12-31T23:59:59Z');
			const suggestion = createMockSuggestion({ expiresAt });

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.expiresAt).toBeDefined();
			expect(stored?.expiresAt?.getTime()).toBe(expiresAt.getTime());
		});

		it('should handle suggestions without expiresAt (never expires)', async () => {
			const suggestion = createMockSuggestion({ expiresAt: undefined });

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.expiresAt).toBeUndefined();
		});

		it('should handle empty affectedEntityIds array', async () => {
			const suggestion = createMockSuggestion({ affectedEntityIds: [] });

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.affectedEntityIds).toEqual([]);
		});

		it('should handle multiple affectedEntityIds', async () => {
			const entityIds = ['entity-1', 'entity-2', 'entity-3', 'entity-4'];
			const suggestion = createMockSuggestion({ affectedEntityIds: entityIds });

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.affectedEntityIds).toEqual(entityIds);
		});

		it('should handle all suggestion types', async () => {
			const types = ['relationship', 'plot_thread', 'inconsistency', 'enhancement', 'recommendation'] as const;

			for (const type of types) {
				const suggestion = createMockSuggestion({ id: `suggestion-${type}`, type });
				await suggestionRepository.add(suggestion);

				const stored = await db.suggestions.get(`suggestion-${type}`);
				expect(stored?.type).toBe(type);
			}
		});

		it('should handle all action types in suggestedAction', async () => {
			const actionTypes = ['create-relationship', 'edit-entity', 'create-entity', 'flag-for-review'] as const;

			for (const actionType of actionTypes) {
				const suggestion = createMockSuggestion({
					id: `suggestion-action-${actionType}`,
					suggestedAction: {
						actionType,
						actionData: { test: 'data' }
					}
				});

				await suggestionRepository.add(suggestion);

				const stored = await db.suggestions.get(`suggestion-action-${actionType}`);
				expect(stored?.suggestedAction?.actionType).toBe(actionType);
			}
		});

		it('should handle relevance score boundaries (0-100)', async () => {
			const minScoreSuggestion = createMockSuggestion({ id: 'min-score', relevanceScore: 0 });
			const maxScoreSuggestion = createMockSuggestion({ id: 'max-score', relevanceScore: 100 });

			await suggestionRepository.add(minScoreSuggestion);
			await suggestionRepository.add(maxScoreSuggestion);

			const minStored = await db.suggestions.get('min-score');
			const maxStored = await db.suggestions.get('max-score');

			expect(minStored?.relevanceScore).toBe(0);
			expect(maxStored?.relevanceScore).toBe(100);
		});

		it('should handle unicode characters in title and description', async () => {
			const suggestion = createMockSuggestion({
				title: 'Suggestion 世界 🐉 ñ ü é',
				description: 'Description with special chars: <>&"\' и я'
			});

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.title).toBe('Suggestion 世界 🐉 ñ ü é');
			expect(stored?.description).toBe('Description with special chars: <>&"\' и я');
		});

		it('should increment count after adding suggestion', async () => {
			const countBefore = await db.suggestions.count();
			await suggestionRepository.add(createMockSuggestion());
			const countAfter = await db.suggestions.count();

			expect(countAfter).toBe(countBefore + 1);
		});
	});

	describe('getById', () => {
		it('should retrieve suggestion by ID', async () => {
			const suggestion = createMockSuggestion({ title: 'Find Me' });
			await db.suggestions.add(suggestion);

			const retrieved = await suggestionRepository.getById(suggestion.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(suggestion.id);
			expect(retrieved?.title).toBe('Find Me');
		});

		it('should return undefined for non-existent ID', async () => {
			const retrieved = await suggestionRepository.getById('non-existent-id');

			expect(retrieved).toBeUndefined();
		});

		it('should return suggestion with all properties intact', async () => {
			const suggestion = createMockSuggestion({
				type: 'enhancement',
				title: 'Complete Suggestion',
				description: 'Full details',
				relevanceScore: 85,
				affectedEntityIds: ['entity-1', 'entity-2'],
				suggestedAction: {
					actionType: 'edit-entity',
					actionData: { field: 'value' }
				},
				status: 'pending',
				expiresAt: new Date('2025-12-31')
			});

			await db.suggestions.add(suggestion);

			const retrieved = await suggestionRepository.getById(suggestion.id);

			expect(retrieved?.type).toBe('enhancement');
			expect(retrieved?.title).toBe('Complete Suggestion');
			expect(retrieved?.description).toBe('Full details');
			expect(retrieved?.relevanceScore).toBe(85);
			expect(retrieved?.affectedEntityIds).toEqual(['entity-1', 'entity-2']);
			expect(retrieved?.suggestedAction).toBeDefined();
			expect(retrieved?.status).toBe('pending');
			expect(retrieved?.expiresAt).toBeInstanceOf(Date);
			expect(retrieved?.createdAt).toBeInstanceOf(Date);
		});

		it('should return correct suggestion when multiple exist', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1', title: 'First' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2', title: 'Second' });
			const suggestion3 = createMockSuggestion({ id: 'sug-3', title: 'Third' });

			await db.suggestions.bulkAdd([suggestion1, suggestion2, suggestion3]);

			const retrieved = await suggestionRepository.getById('sug-2');

			expect(retrieved?.id).toBe('sug-2');
			expect(retrieved?.title).toBe('Second');
		});
	});

	describe('getAll', () => {
		it('should return observable', () => {
			const observable = suggestionRepository.getAll();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return empty array when no suggestions exist', async () => {
			return new Promise<void>((resolve) => {
				const observable = suggestionRepository.getAll();

				const subscription = observable.subscribe((suggestions) => {
					expect(suggestions).toEqual([]);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return all suggestions', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1', title: 'First' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2', title: 'Second' });
			const suggestion3 = createMockSuggestion({ id: 'sug-3', title: 'Third' });

			await db.suggestions.bulkAdd([suggestion1, suggestion2, suggestion3]);

			return new Promise<void>((resolve) => {
				const observable = suggestionRepository.getAll();
				const subscription = observable.subscribe((suggestions) => {
					expect(suggestions).toHaveLength(3);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return suggestions with all properties intact', async () => {
			const suggestion = createMockSuggestion({ title: 'Test Suggestion' });
			await db.suggestions.add(suggestion);

			return new Promise<void>((resolve) => {
				const observable = suggestionRepository.getAll();
				const subscription = observable.subscribe((suggestions) => {
					expect(suggestions).toHaveLength(1);
					expect(suggestions[0].id).toBe(suggestion.id);
					expect(suggestions[0].title).toBe('Test Suggestion');
					expect(suggestions[0].createdAt).toBeInstanceOf(Date);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return updated results when suggestions are added', async () => {
			const observable = suggestionRepository.getAll();
			const results: AISuggestion[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((suggestions) => {
					results.push(suggestions);

					if (results.length === 1) {
						// First emission: empty
						expect(suggestions).toHaveLength(0);
						// Add a suggestion
						suggestionRepository.add(createMockSuggestion({ title: 'New Suggestion' }));
					} else if (results.length === 2) {
						// Second emission: after adding suggestion
						expect(suggestions).toHaveLength(1);
						expect(suggestions[0].title).toBe('New Suggestion');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should handle large number of suggestions', async () => {
			const suggestions: AISuggestion[] = [];
			for (let i = 0; i < 50; i++) {
				suggestions.push(createMockSuggestion({ id: `sug-${i}`, title: `Suggestion ${i}` }));
			}

			await db.suggestions.bulkAdd(suggestions);

			return new Promise<void>((resolve) => {
				const observable = suggestionRepository.getAll();
				const subscription = observable.subscribe((retrievedSuggestions) => {
					expect(retrievedSuggestions).toHaveLength(50);
					subscription.unsubscribe();
					resolve();
				});
			});
		});
	});

	describe('update', () => {
		it('should update suggestion title', async () => {
			const suggestion = createMockSuggestion({ title: 'Original Title' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, { title: 'Updated Title' });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.title).toBe('Updated Title');
		});

		it('should update suggestion description', async () => {
			const suggestion = createMockSuggestion({ description: 'Original Description' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, { description: 'Updated Description' });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.description).toBe('Updated Description');
		});

		it('should update relevance score', async () => {
			const suggestion = createMockSuggestion({ relevanceScore: 50 });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, { relevanceScore: 95 });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.relevanceScore).toBe(95);
		});

		it('should update status', async () => {
			const suggestion = createMockSuggestion({ status: 'pending' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, { status: 'accepted' });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should update affectedEntityIds', async () => {
			const suggestion = createMockSuggestion({ affectedEntityIds: ['entity-1'] });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, { affectedEntityIds: ['entity-2', 'entity-3'] });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.affectedEntityIds).toEqual(['entity-2', 'entity-3']);
		});

		it('should update suggestedAction', async () => {
			const suggestion = createMockSuggestion({ suggestedAction: undefined });
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, {
				suggestedAction: {
					actionType: 'create-relationship',
					actionData: { test: 'data' }
				}
			});

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.suggestedAction?.actionType).toBe('create-relationship');
		});

		it('should update expiresAt', async () => {
			const suggestion = createMockSuggestion({ expiresAt: undefined });
			await db.suggestions.add(suggestion);

			const newExpiresAt = new Date('2026-01-01');
			await suggestionRepository.update(suggestion.id, { expiresAt: newExpiresAt });

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.expiresAt?.getTime()).toBe(newExpiresAt.getTime());
		});

		it('should update multiple properties at once', async () => {
			const suggestion = createMockSuggestion({
				title: 'Original',
				description: 'Original Desc',
				relevanceScore: 50
			});
			await db.suggestions.add(suggestion);

			await suggestionRepository.update(suggestion.id, {
				title: 'Updated',
				description: 'Updated Desc',
				relevanceScore: 90
			});

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.title).toBe('Updated');
			expect(updated?.description).toBe('Updated Desc');
			expect(updated?.relevanceScore).toBe(90);
		});

		it('should not affect other suggestions', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1', title: 'First' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2', title: 'Second' });
			await db.suggestions.bulkAdd([suggestion1, suggestion2]);

			await suggestionRepository.update('sug-1', { title: 'Updated First' });

			const retrieved1 = await db.suggestions.get('sug-1');
			const retrieved2 = await db.suggestions.get('sug-2');
			expect(retrieved1?.title).toBe('Updated First');
			expect(retrieved2?.title).toBe('Second');
		});

		it('should throw or handle update of non-existent suggestion', async () => {
			await expect(
				suggestionRepository.update('non-existent-id', { title: 'New Title' })
			).rejects.toThrow();
		});
	});

	describe('delete', () => {
		it('should delete suggestion by ID', async () => {
			const suggestion = createMockSuggestion();
			await db.suggestions.add(suggestion);

			await suggestionRepository.delete(suggestion.id);

			const retrieved = await db.suggestions.get(suggestion.id);
			expect(retrieved).toBeUndefined();
		});

		it('should only delete specified suggestion', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2' });
			await db.suggestions.bulkAdd([suggestion1, suggestion2]);

			await suggestionRepository.delete('sug-1');

			const retrieved1 = await db.suggestions.get('sug-1');
			const retrieved2 = await db.suggestions.get('sug-2');
			expect(retrieved1).toBeUndefined();
			expect(retrieved2).toBeDefined();
		});

		it('should not throw error when deleting non-existent suggestion', async () => {
			await expect(suggestionRepository.delete('non-existent-id')).resolves.not.toThrow();
		});

		it('should reduce count after deletion', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2' });
			await db.suggestions.bulkAdd([suggestion1, suggestion2]);

			let count = await db.suggestions.count();
			expect(count).toBe(2);

			await suggestionRepository.delete('sug-1');

			count = await db.suggestions.count();
			expect(count).toBe(1);
		});
	});

	describe('clearAll', () => {
		it('should delete all suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1' }),
				createMockSuggestion({ id: 'sug-2' }),
				createMockSuggestion({ id: 'sug-3' })
			];
			await db.suggestions.bulkAdd(suggestions);

			await suggestionRepository.clearAll();

			const count = await db.suggestions.count();
			expect(count).toBe(0);
		});

		it('should work when table is already empty', async () => {
			await expect(suggestionRepository.clearAll()).resolves.not.toThrow();

			const count = await db.suggestions.count();
			expect(count).toBe(0);
		});
	});

	describe('dismiss', () => {
		it('should change status to dismissed', async () => {
			const suggestion = createMockSuggestion({ status: 'pending' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.dismiss(suggestion.id);

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('dismissed');
		});

		it('should dismiss already dismissed suggestion without error', async () => {
			const suggestion = createMockSuggestion({ status: 'dismissed' });
			await db.suggestions.add(suggestion);

			await expect(suggestionRepository.dismiss(suggestion.id)).resolves.not.toThrow();

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('dismissed');
		});

		it('should dismiss accepted suggestion', async () => {
			const suggestion = createMockSuggestion({ status: 'accepted' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.dismiss(suggestion.id);

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('dismissed');
		});

		it('should not affect other suggestions', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1', status: 'pending' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2', status: 'pending' });
			await db.suggestions.bulkAdd([suggestion1, suggestion2]);

			await suggestionRepository.dismiss('sug-1');

			const updated1 = await db.suggestions.get('sug-1');
			const updated2 = await db.suggestions.get('sug-2');
			expect(updated1?.status).toBe('dismissed');
			expect(updated2?.status).toBe('pending');
		});
	});

	describe('accept', () => {
		it('should change status to accepted', async () => {
			const suggestion = createMockSuggestion({ status: 'pending' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.accept(suggestion.id);

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should accept already accepted suggestion without error', async () => {
			const suggestion = createMockSuggestion({ status: 'accepted' });
			await db.suggestions.add(suggestion);

			await expect(suggestionRepository.accept(suggestion.id)).resolves.not.toThrow();

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should accept dismissed suggestion', async () => {
			const suggestion = createMockSuggestion({ status: 'dismissed' });
			await db.suggestions.add(suggestion);

			await suggestionRepository.accept(suggestion.id);

			const updated = await db.suggestions.get(suggestion.id);
			expect(updated?.status).toBe('accepted');
		});

		it('should not affect other suggestions', async () => {
			const suggestion1 = createMockSuggestion({ id: 'sug-1', status: 'pending' });
			const suggestion2 = createMockSuggestion({ id: 'sug-2', status: 'pending' });
			await db.suggestions.bulkAdd([suggestion1, suggestion2]);

			await suggestionRepository.accept('sug-1');

			const updated1 = await db.suggestions.get('sug-1');
			const updated2 = await db.suggestions.get('sug-2');
			expect(updated1?.status).toBe('accepted');
			expect(updated2?.status).toBe('pending');
		});
	});

	describe('getByStatus', () => {
		it('should return all pending suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending' }),
				createMockSuggestion({ id: 'sug-2', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-3', status: 'pending' }),
				createMockSuggestion({ id: 'sug-4', status: 'dismissed' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const pending = await suggestionRepository.getByStatus('pending');

			expect(pending).toHaveLength(2);
			expect(pending.every(s => s.status === 'pending')).toBe(true);
		});

		it('should return all accepted suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending' }),
				createMockSuggestion({ id: 'sug-2', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-3', status: 'accepted' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const accepted = await suggestionRepository.getByStatus('accepted');

			expect(accepted).toHaveLength(2);
			expect(accepted.every(s => s.status === 'accepted')).toBe(true);
		});

		it('should return all dismissed suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'dismissed' }),
				createMockSuggestion({ id: 'sug-2', status: 'pending' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const dismissed = await suggestionRepository.getByStatus('dismissed');

			expect(dismissed).toHaveLength(1);
			expect(dismissed[0].status).toBe('dismissed');
		});

		it('should return empty array when no suggestions match status', async () => {
			const suggestion = createMockSuggestion({ status: 'pending' });
			await db.suggestions.add(suggestion);

			const accepted = await suggestionRepository.getByStatus('accepted');

			expect(accepted).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const pending = await suggestionRepository.getByStatus('pending');

			expect(pending).toEqual([]);
		});
	});

	describe('getPendingCount', () => {
		it('should return count of pending suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending' }),
				createMockSuggestion({ id: 'sug-2', status: 'pending' }),
				createMockSuggestion({ id: 'sug-3', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-4', status: 'dismissed' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const count = await suggestionRepository.getPendingCount();

			expect(count).toBe(2);
		});

		it('should return 0 when no pending suggestions exist', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-2', status: 'dismissed' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const count = await suggestionRepository.getPendingCount();

			expect(count).toBe(0);
		});

		it('should return 0 when table is empty', async () => {
			const count = await suggestionRepository.getPendingCount();

			expect(count).toBe(0);
		});
	});

	describe('getByType', () => {
		it('should return suggestions of specified type', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', type: 'relationship' }),
				createMockSuggestion({ id: 'sug-2', type: 'plot_thread' }),
				createMockSuggestion({ id: 'sug-3', type: 'relationship' }),
				createMockSuggestion({ id: 'sug-4', type: 'inconsistency' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const relationships = await suggestionRepository.getByType('relationship');

			expect(relationships).toHaveLength(2);
			expect(relationships.every(s => s.type === 'relationship')).toBe(true);
		});

		it('should return all suggestion types correctly', async () => {
			const types = ['relationship', 'plot_thread', 'inconsistency', 'enhancement', 'recommendation'] as const;

			for (const type of types) {
				await db.suggestions.clear();
				const suggestion = createMockSuggestion({ id: `sug-${type}`, type });
				await db.suggestions.add(suggestion);

				const results = await suggestionRepository.getByType(type);

				expect(results).toHaveLength(1);
				expect(results[0].type).toBe(type);
			}
		});

		it('should return empty array when no suggestions of type exist', async () => {
			const suggestion = createMockSuggestion({ type: 'relationship' });
			await db.suggestions.add(suggestion);

			const plotThreads = await suggestionRepository.getByType('plot_thread');

			expect(plotThreads).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const relationships = await suggestionRepository.getByType('relationship');

			expect(relationships).toEqual([]);
		});
	});

	describe('getByAffectedEntity', () => {
		it('should return suggestions affecting specific entity', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', affectedEntityIds: ['entity-1'] }),
				createMockSuggestion({ id: 'sug-2', affectedEntityIds: ['entity-2'] }),
				createMockSuggestion({ id: 'sug-3', affectedEntityIds: ['entity-1', 'entity-2'] })
			];
			await db.suggestions.bulkAdd(suggestions);

			const forEntity1 = await suggestionRepository.getByAffectedEntity('entity-1');

			expect(forEntity1).toHaveLength(2);
			expect(forEntity1.every(s => s.affectedEntityIds.includes('entity-1'))).toBe(true);
		});

		it('should return suggestions where entity is in affectedEntityIds array', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', affectedEntityIds: ['entity-1', 'entity-2', 'entity-3'] }),
				createMockSuggestion({ id: 'sug-2', affectedEntityIds: ['entity-4'] })
			];
			await db.suggestions.bulkAdd(suggestions);

			const forEntity2 = await suggestionRepository.getByAffectedEntity('entity-2');

			expect(forEntity2).toHaveLength(1);
			expect(forEntity2[0].id).toBe('sug-1');
		});

		it('should return empty array when no suggestions affect entity', async () => {
			const suggestion = createMockSuggestion({ affectedEntityIds: ['entity-1'] });
			await db.suggestions.add(suggestion);

			const forEntity2 = await suggestionRepository.getByAffectedEntity('entity-2');

			expect(forEntity2).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const forEntity1 = await suggestionRepository.getByAffectedEntity('entity-1');

			expect(forEntity1).toEqual([]);
		});

		it('should not return suggestions with empty affectedEntityIds', async () => {
			const suggestion = createMockSuggestion({ affectedEntityIds: [] });
			await db.suggestions.add(suggestion);

			const forEntity1 = await suggestionRepository.getByAffectedEntity('entity-1');

			expect(forEntity1).toEqual([]);
		});
	});

	describe('getByAffectedEntities', () => {
		it('should return suggestions affecting any of the specified entities', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', affectedEntityIds: ['entity-1'] }),
				createMockSuggestion({ id: 'sug-2', affectedEntityIds: ['entity-2'] }),
				createMockSuggestion({ id: 'sug-3', affectedEntityIds: ['entity-3'] }),
				createMockSuggestion({ id: 'sug-4', affectedEntityIds: ['entity-4'] })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.getByAffectedEntities(['entity-1', 'entity-3']);

			expect(results).toHaveLength(2);
			const ids = results.map(s => s.id).sort();
			expect(ids).toEqual(['sug-1', 'sug-3']);
		});

		it('should not return duplicate suggestions if entity appears multiple times', async () => {
			const suggestion = createMockSuggestion({
				id: 'sug-1',
				affectedEntityIds: ['entity-1', 'entity-2']
			});
			await db.suggestions.add(suggestion);

			const results = await suggestionRepository.getByAffectedEntities(['entity-1', 'entity-2']);

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('sug-1');
		});

		it('should handle empty entity array', async () => {
			const suggestion = createMockSuggestion();
			await db.suggestions.add(suggestion);

			const results = await suggestionRepository.getByAffectedEntities([]);

			expect(results).toEqual([]);
		});

		it('should return empty array when no suggestions match', async () => {
			const suggestion = createMockSuggestion({ affectedEntityIds: ['entity-1'] });
			await db.suggestions.add(suggestion);

			const results = await suggestionRepository.getByAffectedEntities(['entity-2', 'entity-3']);

			expect(results).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const results = await suggestionRepository.getByAffectedEntities(['entity-1', 'entity-2']);

			expect(results).toEqual([]);
		});
	});

	describe('query', () => {
		it('should filter by types', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', type: 'relationship' }),
				createMockSuggestion({ id: 'sug-2', type: 'plot_thread' }),
				createMockSuggestion({ id: 'sug-3', type: 'inconsistency' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				types: ['relationship', 'inconsistency']
			});

			expect(results).toHaveLength(2);
			expect(results.every(s => s.type === 'relationship' || s.type === 'inconsistency')).toBe(true);
		});

		it('should filter by statuses', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending' }),
				createMockSuggestion({ id: 'sug-2', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-3', status: 'dismissed' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				statuses: ['pending', 'accepted']
			});

			expect(results).toHaveLength(2);
			expect(results.every(s => s.status === 'pending' || s.status === 'accepted')).toBe(true);
		});

		it('should filter by affectedEntityIds', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', affectedEntityIds: ['entity-1'] }),
				createMockSuggestion({ id: 'sug-2', affectedEntityIds: ['entity-2'] }),
				createMockSuggestion({ id: 'sug-3', affectedEntityIds: ['entity-1', 'entity-3'] })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				affectedEntityIds: ['entity-1']
			});

			expect(results).toHaveLength(2);
			expect(results.every(s => s.affectedEntityIds.includes('entity-1'))).toBe(true);
		});

		it('should filter by minRelevanceScore', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', relevanceScore: 30 }),
				createMockSuggestion({ id: 'sug-2', relevanceScore: 70 }),
				createMockSuggestion({ id: 'sug-3', relevanceScore: 90 })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				minRelevanceScore: 60
			});

			expect(results).toHaveLength(2);
			expect(results.every(s => s.relevanceScore >= 60)).toBe(true);
		});

		it('should exclude expired suggestions by default', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-3', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({});

			expect(results).toHaveLength(2);
			expect(results.find(s => s.id === 'sug-1')).toBeUndefined();
		});

		it('should include expired suggestions when includeExpired is true', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60);

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				includeExpired: true
			});

			expect(results).toHaveLength(2);
		});

		it('should combine multiple filters (AND logic)', async () => {
			const suggestions = [
				createMockSuggestion({
					id: 'sug-1',
					type: 'relationship',
					status: 'pending',
					relevanceScore: 80
				}),
				createMockSuggestion({
					id: 'sug-2',
					type: 'relationship',
					status: 'dismissed',
					relevanceScore: 90
				}),
				createMockSuggestion({
					id: 'sug-3',
					type: 'plot_thread',
					status: 'pending',
					relevanceScore: 85
				}),
				createMockSuggestion({
					id: 'sug-4',
					type: 'relationship',
					status: 'pending',
					relevanceScore: 50
				})
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				types: ['relationship'],
				statuses: ['pending'],
				minRelevanceScore: 70
			});

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('sug-1');
		});

		it('should return all suggestions when no filters provided', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1' }),
				createMockSuggestion({ id: 'sug-2' }),
				createMockSuggestion({ id: 'sug-3' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({});

			expect(results).toHaveLength(3);
		});

		it('should return empty array when no suggestions match filters', async () => {
			const suggestion = createMockSuggestion({ type: 'relationship' });
			await db.suggestions.add(suggestion);

			const results = await suggestionRepository.query({
				types: ['plot_thread']
			});

			expect(results).toEqual([]);
		});

		it('should handle complex multi-filter query', async () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestions = [
				createMockSuggestion({
					id: 'sug-1',
					type: 'relationship',
					status: 'pending',
					affectedEntityIds: ['entity-1'],
					relevanceScore: 85,
					expiresAt: futureDate
				}),
				createMockSuggestion({
					id: 'sug-2',
					type: 'plot_thread',
					status: 'pending',
					affectedEntityIds: ['entity-1'],
					relevanceScore: 75,
					expiresAt: futureDate
				}),
				createMockSuggestion({
					id: 'sug-3',
					type: 'relationship',
					status: 'accepted',
					affectedEntityIds: ['entity-1'],
					relevanceScore: 90,
					expiresAt: futureDate
				})
			];
			await db.suggestions.bulkAdd(suggestions);

			const results = await suggestionRepository.query({
				types: ['relationship', 'plot_thread'],
				statuses: ['pending'],
				affectedEntityIds: ['entity-1'],
				minRelevanceScore: 80
			});

			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('sug-1');
		});
	});

	describe('getExpired', () => {
		it('should return suggestions with expiresAt in the past', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-3', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const expired = await suggestionRepository.getExpired();

			expect(expired).toHaveLength(1);
			expect(expired[0].id).toBe('sug-1');
		});

		it('should return empty array when no expired suggestions exist', async () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestion = createMockSuggestion({ expiresAt: futureDate });
			await db.suggestions.add(suggestion);

			const expired = await suggestionRepository.getExpired();

			expect(expired).toEqual([]);
		});

		it('should not return suggestions without expiresAt', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: undefined }),
				createMockSuggestion({ id: 'sug-2', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const expired = await suggestionRepository.getExpired();

			expect(expired).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const expired = await suggestionRepository.getExpired();

			expect(expired).toEqual([]);
		});

		it('should handle suggestions expiring exactly now', async () => {
			const now = new Date();
			const suggestion = createMockSuggestion({ expiresAt: now });
			await db.suggestions.add(suggestion);

			// Wait a tiny bit to ensure it's in the past
			await new Promise(resolve => setTimeout(resolve, 10));

			const expired = await suggestionRepository.getExpired();

			expect(expired).toHaveLength(1);
		});
	});

	describe('deleteExpired', () => {
		it('should delete all expired suggestions', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60);
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60);

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-3', expiresAt: futureDate })
			];
			await db.suggestions.bulkAdd(suggestions);

			await suggestionRepository.deleteExpired();

			const remaining = await db.suggestions.toArray();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe('sug-3');
		});

		it('should not delete suggestions without expiresAt', async () => {
			const pastDate = new Date(Date.now() - 1000 * 60 * 60);
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			await suggestionRepository.deleteExpired();

			const remaining = await db.suggestions.toArray();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe('sug-2');
		});

		it('should work when no expired suggestions exist', async () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestion = createMockSuggestion({ expiresAt: futureDate });
			await db.suggestions.add(suggestion);

			await expect(suggestionRepository.deleteExpired()).resolves.not.toThrow();

			const count = await db.suggestions.count();
			expect(count).toBe(1);
		});

		it('should work when table is empty', async () => {
			await expect(suggestionRepository.deleteExpired()).resolves.not.toThrow();
		});
	});

	describe('isExpired', () => {
		it('should return true for suggestion with past expiresAt', () => {
			const pastDate = new Date(Date.now() - 1000 * 60 * 60);
			const suggestion = createMockSuggestion({ expiresAt: pastDate });

			const result = suggestionRepository.isExpired(suggestion);

			expect(result).toBe(true);
		});

		it('should return false for suggestion with future expiresAt', () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestion = createMockSuggestion({ expiresAt: futureDate });

			const result = suggestionRepository.isExpired(suggestion);

			expect(result).toBe(false);
		});

		it('should return false for suggestion without expiresAt', () => {
			const suggestion = createMockSuggestion({ expiresAt: undefined });

			const result = suggestionRepository.isExpired(suggestion);

			expect(result).toBe(false);
		});

		it('should handle edge case of exactly current time', () => {
			const now = new Date();
			const suggestion = createMockSuggestion({ expiresAt: now });

			// Should be false or true depending on exact millisecond timing
			// The implementation should treat equal times consistently
			const result = suggestionRepository.isExpired(suggestion);

			expect(typeof result).toBe('boolean');
		});
	});

	describe('getActive', () => {
		it('should return non-expired pending suggestions', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60);
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60);

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-2', status: 'pending', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-3', status: 'accepted', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-4', status: 'pending', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const active = await suggestionRepository.getActive();

			expect(active).toHaveLength(2);
			const ids = active.map(s => s.id).sort();
			expect(ids).toEqual(['sug-1', 'sug-4']);
		});

		it('should not return dismissed suggestions', async () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-2', status: 'dismissed', expiresAt: futureDate })
			];
			await db.suggestions.bulkAdd(suggestions);

			const active = await suggestionRepository.getActive();

			expect(active).toHaveLength(1);
			expect(active[0].id).toBe('sug-1');
		});

		it('should not return accepted suggestions', async () => {
			const futureDate = new Date(Date.now() + 1000 * 60 * 60);
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-2', status: 'accepted', expiresAt: futureDate })
			];
			await db.suggestions.bulkAdd(suggestions);

			const active = await suggestionRepository.getActive();

			expect(active).toHaveLength(1);
			expect(active[0].id).toBe('sug-1');
		});

		it('should return empty array when no active suggestions exist', async () => {
			const pastDate = new Date(Date.now() - 1000 * 60 * 60);
			const suggestions = [
				createMockSuggestion({ status: 'pending', expiresAt: pastDate }),
				createMockSuggestion({ status: 'dismissed', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const active = await suggestionRepository.getActive();

			expect(active).toEqual([]);
		});

		it('should return empty array when table is empty', async () => {
			const active = await suggestionRepository.getActive();

			expect(active).toEqual([]);
		});

		it('should include pending suggestions without expiresAt', async () => {
			const suggestion = createMockSuggestion({ status: 'pending', expiresAt: undefined });
			await db.suggestions.add(suggestion);

			const active = await suggestionRepository.getActive();

			expect(active).toHaveLength(1);
			expect(active[0].id).toBe(suggestion.id);
		});
	});

	describe('bulkAdd', () => {
		it('should add multiple suggestions at once', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', title: 'First' }),
				createMockSuggestion({ id: 'sug-2', title: 'Second' }),
				createMockSuggestion({ id: 'sug-3', title: 'Third' })
			];

			await suggestionRepository.bulkAdd(suggestions);

			const count = await db.suggestions.count();
			expect(count).toBe(3);
		});

		it('should store all properties correctly for bulk added suggestions', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', type: 'relationship', relevanceScore: 80 }),
				createMockSuggestion({ id: 'sug-2', type: 'plot_thread', relevanceScore: 90 })
			];

			await suggestionRepository.bulkAdd(suggestions);

			const sug1 = await db.suggestions.get('sug-1');
			const sug2 = await db.suggestions.get('sug-2');

			expect(sug1?.type).toBe('relationship');
			expect(sug1?.relevanceScore).toBe(80);
			expect(sug2?.type).toBe('plot_thread');
			expect(sug2?.relevanceScore).toBe(90);
		});

		it('should handle empty array', async () => {
			await expect(suggestionRepository.bulkAdd([])).resolves.not.toThrow();

			const count = await db.suggestions.count();
			expect(count).toBe(0);
		});

		it('should handle large bulk additions', async () => {
			const suggestions: AISuggestion[] = [];
			for (let i = 0; i < 100; i++) {
				suggestions.push(createMockSuggestion({ id: `sug-${i}`, title: `Suggestion ${i}` }));
			}

			await suggestionRepository.bulkAdd(suggestions);

			const count = await db.suggestions.count();
			expect(count).toBe(100);
		});
	});

	describe('getStats', () => {
		it('should return correct total count', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1' }),
				createMockSuggestion({ id: 'sug-2' }),
				createMockSuggestion({ id: 'sug-3' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const stats = await suggestionRepository.getStats();

			expect(stats.total).toBe(3);
		});

		it('should return correct byStatus counts', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', status: 'pending' }),
				createMockSuggestion({ id: 'sug-2', status: 'pending' }),
				createMockSuggestion({ id: 'sug-3', status: 'accepted' }),
				createMockSuggestion({ id: 'sug-4', status: 'dismissed' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const stats = await suggestionRepository.getStats();

			expect(stats.byStatus.pending).toBe(2);
			expect(stats.byStatus.accepted).toBe(1);
			expect(stats.byStatus.dismissed).toBe(1);
		});

		it('should return correct byType counts', async () => {
			const suggestions = [
				createMockSuggestion({ id: 'sug-1', type: 'relationship' }),
				createMockSuggestion({ id: 'sug-2', type: 'relationship' }),
				createMockSuggestion({ id: 'sug-3', type: 'plot_thread' }),
				createMockSuggestion({ id: 'sug-4', type: 'inconsistency' }),
				createMockSuggestion({ id: 'sug-5', type: 'enhancement' }),
				createMockSuggestion({ id: 'sug-6', type: 'recommendation' })
			];
			await db.suggestions.bulkAdd(suggestions);

			const stats = await suggestionRepository.getStats();

			expect(stats.byType.relationship).toBe(2);
			expect(stats.byType.plot_thread).toBe(1);
			expect(stats.byType.inconsistency).toBe(1);
			expect(stats.byType.enhancement).toBe(1);
			expect(stats.byType.recommendation).toBe(1);
		});

		it('should return correct expiredCount', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60);
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60);

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-2', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-3', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-4', expiresAt: undefined })
			];
			await db.suggestions.bulkAdd(suggestions);

			const stats = await suggestionRepository.getStats();

			expect(stats.expiredCount).toBe(2);
		});

		it('should return zeros for empty table', async () => {
			const stats = await suggestionRepository.getStats();

			expect(stats.total).toBe(0);
			expect(stats.byStatus.pending).toBe(0);
			expect(stats.byStatus.accepted).toBe(0);
			expect(stats.byStatus.dismissed).toBe(0);
			expect(stats.byType.relationship).toBe(0);
			expect(stats.byType.plot_thread).toBe(0);
			expect(stats.byType.inconsistency).toBe(0);
			expect(stats.byType.enhancement).toBe(0);
			expect(stats.byType.recommendation).toBe(0);
			expect(stats.expiredCount).toBe(0);
		});

		it('should handle missing statuses in byStatus', async () => {
			const suggestion = createMockSuggestion({ status: 'pending' });
			await db.suggestions.add(suggestion);

			const stats = await suggestionRepository.getStats();

			expect(stats.byStatus.pending).toBe(1);
			expect(stats.byStatus.accepted).toBe(0);
			expect(stats.byStatus.dismissed).toBe(0);
		});

		it('should handle missing types in byType', async () => {
			const suggestion = createMockSuggestion({ type: 'relationship' });
			await db.suggestions.add(suggestion);

			const stats = await suggestionRepository.getStats();

			expect(stats.byType.relationship).toBe(1);
			expect(stats.byType.plot_thread).toBe(0);
			expect(stats.byType.inconsistency).toBe(0);
			expect(stats.byType.enhancement).toBe(0);
			expect(stats.byType.recommendation).toBe(0);
		});

		it('should return comprehensive stats for complex data set', async () => {
			const now = new Date();
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60);
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60);

			const suggestions = [
				createMockSuggestion({ id: 'sug-1', type: 'relationship', status: 'pending', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-2', type: 'relationship', status: 'accepted', expiresAt: undefined }),
				createMockSuggestion({ id: 'sug-3', type: 'plot_thread', status: 'pending', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-4', type: 'inconsistency', status: 'dismissed', expiresAt: pastDate }),
				createMockSuggestion({ id: 'sug-5', type: 'enhancement', status: 'pending', expiresAt: futureDate }),
				createMockSuggestion({ id: 'sug-6', type: 'recommendation', status: 'accepted', expiresAt: futureDate })
			];
			await db.suggestions.bulkAdd(suggestions);

			const stats = await suggestionRepository.getStats();

			expect(stats.total).toBe(6);
			expect(stats.byStatus.pending).toBe(3);
			expect(stats.byStatus.accepted).toBe(2);
			expect(stats.byStatus.dismissed).toBe(1);
			expect(stats.byType.relationship).toBe(2);
			expect(stats.byType.plot_thread).toBe(1);
			expect(stats.byType.inconsistency).toBe(1);
			expect(stats.byType.enhancement).toBe(1);
			expect(stats.byType.recommendation).toBe(1);
			expect(stats.expiredCount).toBe(2);
		});
	});

	describe('Edge Cases and Validation', () => {
		it('should handle rapid successive operations', async () => {
			const promises = [];
			for (let i = 0; i < 10; i++) {
				promises.push(suggestionRepository.add(createMockSuggestion({ id: `sug-${i}` })));
			}

			await Promise.all(promises);

			const count = await db.suggestions.count();
			expect(count).toBe(10);
		});

		it('should handle mixed operations in sequence', async () => {
			// Create
			const sug1 = createMockSuggestion({ id: 'sug-1', status: 'pending' });
			const sug2 = createMockSuggestion({ id: 'sug-2', status: 'pending' });
			await db.suggestions.bulkAdd([sug1, sug2]);

			// Update
			await suggestionRepository.update('sug-1', { title: 'Updated' });

			// Dismiss
			await suggestionRepository.dismiss('sug-2');

			// Delete
			await suggestionRepository.delete('sug-1');

			// Create another
			await suggestionRepository.add(createMockSuggestion({ id: 'sug-3' }));

			const count = await db.suggestions.count();
			expect(count).toBe(2);

			const remaining = await db.suggestions.toArray();
			expect(remaining.find(s => s.id === 'sug-2')?.status).toBe('dismissed');
		});

		it('should handle very long strings in title and description', async () => {
			const longString = 'A'.repeat(10000);
			const suggestion = createMockSuggestion({
				title: longString,
				description: longString
			});

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.title.length).toBe(10000);
			expect(stored?.description.length).toBe(10000);
		});

		it('should handle suggestion with many affectedEntityIds', async () => {
			const entityIds = Array.from({ length: 100 }, (_, i) => `entity-${i}`);
			const suggestion = createMockSuggestion({ affectedEntityIds: entityIds });

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.affectedEntityIds).toHaveLength(100);
		});

		it('should handle complex nested actionData in suggestedAction', async () => {
			const suggestion = createMockSuggestion({
				suggestedAction: {
					actionType: 'create-entity',
					actionData: {
						entity: {
							name: 'Test',
							type: 'character',
							fields: {
								field1: 'value1',
								field2: { nested: 'value2' },
								field3: [1, 2, 3]
							}
						},
						metadata: {
							tags: ['tag1', 'tag2'],
							source: 'AI'
						}
					}
				}
			});

			await suggestionRepository.add(suggestion);

			const stored = await db.suggestions.get(suggestion.id);
			expect(stored?.suggestedAction?.actionData).toBeDefined();
			expect(stored?.suggestedAction?.actionData.entity).toBeDefined();
		});

		it('should handle timestamps at edge of JavaScript Date range', async () => {
			const veryOldDate = new Date('1970-01-01T00:00:00Z');
			const veryNewDate = new Date('2099-12-31T23:59:59Z');

			const suggestions = [
				createMockSuggestion({
					id: 'sug-1',
					createdAt: veryOldDate,
					expiresAt: veryOldDate
				}),
				createMockSuggestion({
					id: 'sug-2',
					createdAt: veryNewDate,
					expiresAt: veryNewDate
				})
			];

			await db.suggestions.bulkAdd(suggestions);

			const stored1 = await db.suggestions.get('sug-1');
			const stored2 = await db.suggestions.get('sug-2');

			expect(stored1?.createdAt.getTime()).toBe(veryOldDate.getTime());
			expect(stored2?.expiresAt?.getTime()).toBe(veryNewDate.getTime());
		});

		it('should maintain data integrity across concurrent queries', async () => {
			const suggestions = Array.from({ length: 20 }, (_, i) =>
				createMockSuggestion({
					id: `sug-${i}`,
					type: i % 2 === 0 ? 'relationship' : 'plot_thread',
					status: i % 3 === 0 ? 'pending' : 'accepted'
				})
			);
			await db.suggestions.bulkAdd(suggestions);

			// Run multiple queries concurrently
			const [byType, byStatus, stats, all] = await Promise.all([
				suggestionRepository.getByType('relationship'),
				suggestionRepository.getByStatus('pending'),
				suggestionRepository.getStats(),
				suggestionRepository.query({})
			]);

			expect(byType.length).toBeGreaterThan(0);
			expect(byStatus.length).toBeGreaterThan(0);
			expect(stats.total).toBe(20);
			expect(all.length).toBe(20);
		});
	});
});
