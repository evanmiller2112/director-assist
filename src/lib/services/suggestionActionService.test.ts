/**
 * Tests for Suggestion Action Service (TDD RED Phase)
 *
 * Phase B4 of Issue #43: AI Suggestions System
 *
 * This service executes the actions suggested by AI suggestions.
 * Each AISuggestion has a suggestedAction field with:
 * - actionType: 'create-relationship' | 'edit-entity' | 'create-entity' | 'flag-for-review'
 * - actionData: object with relevant data
 *
 * Methods:
 * - executeAction(suggestion: AISuggestion): Promise<ActionResult>
 * - getActionHistory(): Promise<ActionHistoryEntry[]>
 * - undoLastAction(historyEntryId: string): Promise<boolean>
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	executeAction,
	getActionHistory,
	undoLastAction,
	clearActionHistory
} from './suggestionActionService';
import type { AISuggestion } from '$lib/types';

// Mock dependencies
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getById: vi.fn(),
		update: vi.fn(),
		create: vi.fn(),
		addLink: vi.fn(),
		removeLink: vi.fn()
	},
	suggestionRepository: {
		update: vi.fn(),
		accept: vi.fn()
	}
}));

import { entityRepository, suggestionRepository } from '$lib/db/repositories';

describe('suggestionActionService', () => {
	let mockSuggestion: AISuggestion;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create a base mock suggestion
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1', 'entity-2'],
			status: 'pending',
			createdAt: new Date()
		};

		// Default mock implementations
		vi.mocked(entityRepository.getById).mockResolvedValue({
			id: 'entity-1',
			name: 'Test Entity',
			type: 'character',
			description: '',
			tags: [],
			notes: '',
			metadata: {},
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		});

		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		vi.mocked(entityRepository.create).mockResolvedValue({
			id: 'new-entity-1',
			name: 'New Entity',
			type: 'character',
			description: '',
			tags: [],
			notes: '',
			metadata: {},
			fields: {},
			links: [],
			createdAt: new Date(),
			updatedAt: new Date()
		});
		vi.mocked(entityRepository.addLink).mockResolvedValue({
			id: 'link-1',
			sourceId: 'entity-1',
			targetId: 'entity-2',
			targetType: 'character',
			relationship: 'knows',
			bidirectional: true,
			createdAt: new Date(),
			updatedAt: new Date()
		} as any);
		vi.mocked(entityRepository.removeLink).mockResolvedValue(undefined);
		vi.mocked(suggestionRepository.accept).mockResolvedValue(undefined);
	});

	afterEach(async () => {
		vi.clearAllMocks();
		// Clear action history between tests to prevent isolation issues
		await clearActionHistory();
	});

	describe('Service Structure', () => {
		it('should expose executeAction method', () => {
			expect(typeof executeAction).toBe('function');
		});

		it('should expose getActionHistory method', () => {
			expect(typeof getActionHistory).toBe('function');
		});

		it('should expose undoLastAction method', () => {
			expect(typeof undoLastAction).toBe('function');
		});

		it('should expose clearActionHistory method', () => {
			expect(typeof clearActionHistory).toBe('function');
		});
	});

	describe('executeAction - create-relationship', () => {
		beforeEach(() => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-1',
					targetId: 'entity-2',
					relationship: 'allies_with',
					bidirectional: true,
					notes: 'They fought together in the battle'
				}
			};
		});

		it('should create relationship between entities', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(true);
			expect(result.message).toMatch(/relationship.*created/i);
			expect(entityRepository.addLink).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					targetId: 'entity-2',
					relationship: 'allies_with',
					bidirectional: true
				})
			);
		});

		it('should include affected entity IDs in result', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.affectedEntityIds).toContain('entity-1');
			expect(result.affectedEntityIds).toContain('entity-2');
		});

		it('should mark suggestion as accepted', async () => {
			await executeAction(mockSuggestion);

			expect(suggestionRepository.accept).toHaveBeenCalledWith('suggestion-1');
		});

		it('should handle relationship creation failure', async () => {
			vi.mocked(entityRepository.addLink).mockRejectedValue(new Error('Entity not found'));

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/failed|error/i);
		});

		it('should include relationship metadata in link', async () => {
			mockSuggestion.suggestedAction!.actionData.strength = 'strong';
			mockSuggestion.suggestedAction!.actionData.tags = ['alliance', 'military'];

			await executeAction(mockSuggestion);

			expect(entityRepository.addLink).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					notes: 'They fought together in the battle',
					metadata: expect.objectContaining({
						strength: 'strong',
						tags: ['alliance', 'military']
					})
				})
			);
		});

		it('should handle bidirectional vs unidirectional relationships', async () => {
			mockSuggestion.suggestedAction!.actionData.bidirectional = false;

			await executeAction(mockSuggestion);

			expect(entityRepository.addLink).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					bidirectional: false
				})
			);
		});
	});

	describe('executeAction - edit-entity', () => {
		beforeEach(() => {
			mockSuggestion.suggestedAction = {
				actionType: 'edit-entity',
				actionData: {
					entityId: 'entity-1',
					updates: {
						fields: {
							description: 'Updated character description',
							alignment: 'Lawful Good'
						}
					}
				}
			};
		});

		it('should update entity with suggested changes', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(true);
			expect(result.message).toMatch(/entity.*updated/i);
			expect(entityRepository.update).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					fields: expect.objectContaining({
						description: 'Updated character description',
						alignment: 'Lawful Good'
					})
				})
			);
		});

		it('should include affected entity ID in result', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.affectedEntityIds).toContain('entity-1');
		});

		it('should mark suggestion as accepted', async () => {
			await executeAction(mockSuggestion);

			expect(suggestionRepository.accept).toHaveBeenCalledWith('suggestion-1');
		});

		it('should handle entity update failure', async () => {
			vi.mocked(entityRepository.update).mockRejectedValue(new Error('Entity not found'));

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/failed|error/i);
		});

		it('should support partial field updates', async () => {
			mockSuggestion.suggestedAction!.actionData.updates = {
				fields: {
					description: 'New description'
					// Only updating description, not alignment
				}
			};

			await executeAction(mockSuggestion);

			expect(entityRepository.update).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					fields: expect.objectContaining({
						description: 'New description'
					})
				})
			);
		});

		it('should support updating entity name', async () => {
			mockSuggestion.suggestedAction!.actionData.updates = {
				name: 'Updated Entity Name'
			};

			await executeAction(mockSuggestion);

			expect(entityRepository.update).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					name: 'Updated Entity Name'
				})
			);
		});
	});

	describe('executeAction - create-entity', () => {
		beforeEach(() => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-entity',
				actionData: {
					type: 'npc',
					name: 'Suggested NPC',
					fields: {
						description: 'A mysterious stranger',
						role: 'Quest Giver'
					}
				}
			};
		});

		it('should create new entity with suggested data', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(true);
			expect(result.message).toMatch(/entity.*created/i);
			expect(entityRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'npc',
					name: 'Suggested NPC',
					fields: expect.objectContaining({
						description: 'A mysterious stranger',
						role: 'Quest Giver'
					})
				})
			);
		});

		it('should include new entity ID in result', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.affectedEntityIds).toContain('new-entity-1');
		});

		it('should mark suggestion as accepted', async () => {
			await executeAction(mockSuggestion);

			expect(suggestionRepository.accept).toHaveBeenCalledWith('suggestion-1');
		});

		it('should handle entity creation failure', async () => {
			vi.mocked(entityRepository.create).mockRejectedValue(new Error('Invalid entity type'));

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/failed|error/i);
		});

		it('should support creating entity with links', async () => {
			mockSuggestion.suggestedAction!.actionData.links = [
				{
					targetId: 'entity-1',
					relationship: 'knows',
					bidirectional: true
				}
			];

			await executeAction(mockSuggestion);

			expect(entityRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Suggested NPC',
					links: expect.arrayContaining([
						expect.objectContaining({
							targetId: 'entity-1',
							relationship: 'knows'
						})
					])
				})
			);
		});
	});

	describe('executeAction - flag-for-review', () => {
		beforeEach(() => {
			mockSuggestion.suggestedAction = {
				actionType: 'flag-for-review',
				actionData: {
					entityIds: ['entity-1', 'entity-2'],
					reason: 'Potential inconsistency detected',
					priority: 'high'
				}
			};
		});

		it('should flag entities for review', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(true);
			expect(result.message).toMatch(/flagged.*review/i);
		});

		it('should include flagged entity IDs in result', async () => {
			const result = await executeAction(mockSuggestion);

			expect(result.affectedEntityIds).toContain('entity-1');
			expect(result.affectedEntityIds).toContain('entity-2');
		});

		it('should mark suggestion as accepted', async () => {
			await executeAction(mockSuggestion);

			expect(suggestionRepository.accept).toHaveBeenCalledWith('suggestion-1');
		});

		it('should add review metadata to entities', async () => {
			await executeAction(mockSuggestion);

			expect(entityRepository.update).toHaveBeenCalledWith(
				'entity-1',
				expect.objectContaining({
					metadata: expect.objectContaining({
						flaggedForReview: true,
						reviewReason: 'Potential inconsistency detected',
						reviewPriority: 'high'
					})
				})
			);
		});

		it('should handle different priority levels', async () => {
			mockSuggestion.suggestedAction!.actionData.priority = 'low';

			await executeAction(mockSuggestion);

			expect(entityRepository.update).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					metadata: expect.objectContaining({
						reviewPriority: 'low'
					})
				})
			);
		});
	});

	describe('executeAction - error handling', () => {
		it('should reject suggestion without suggestedAction', async () => {
			delete mockSuggestion.suggestedAction;

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/no.*action/i);
		});

		it('should handle unknown action types', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'unknown-action' as any,
				actionData: {}
			};

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/unknown.*action.*type/i);
		});

		it('should handle missing actionData', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {} as any // Missing required fields
			};

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toMatch(/invalid|missing/i);
		});

		it('should not mark suggestion as accepted on failure', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {}
			};

			await executeAction(mockSuggestion);

			expect(suggestionRepository.accept).not.toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'edit-entity',
				actionData: { entityId: 'entity-1', updates: { name: 'New Name' } }
			};

			vi.mocked(entityRepository.update).mockRejectedValue(new Error('Database error'));

			const result = await executeAction(mockSuggestion);

			expect(result.success).toBe(false);
			expect(result.message).toContain('error');
		});
	});

	describe('getActionHistory', () => {
		it('should return empty array when no actions executed', async () => {
			const history = await getActionHistory();

			expect(history).toEqual([]);
		});

		it('should return action history entries', async () => {
			// Execute some actions first
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-1',
					targetId: 'entity-2',
					relationship: 'knows'
				}
			};

			await executeAction(mockSuggestion);

			const history = await getActionHistory();

			expect(history).toHaveLength(1);
			expect(history[0]).toHaveProperty('id');
			expect(history[0]).toHaveProperty('suggestionId', 'suggestion-1');
			expect(history[0]).toHaveProperty('actionType', 'create-relationship');
			expect(history[0]).toHaveProperty('timestamp');
			expect(history[0]).toHaveProperty('result');
		});

		it('should return multiple history entries in chronological order', async () => {
			// Execute multiple actions
			const suggestion1 = { ...mockSuggestion, id: 'sug-1', suggestedAction: {
				actionType: 'create-relationship' as const,
				actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
			}};
			const suggestion2 = { ...mockSuggestion, id: 'sug-2', suggestedAction: {
				actionType: 'edit-entity' as const,
				actionData: { entityId: 'e1', updates: {} }
			}};

			await executeAction(suggestion1);
			await executeAction(suggestion2);

			const history = await getActionHistory();

			expect(history).toHaveLength(2);
			expect(history[0].suggestionId).toBe('sug-1');
			expect(history[1].suggestionId).toBe('sug-2');
		});

		it('should include action result in history entry', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-1',
					targetId: 'entity-2',
					relationship: 'knows'
				}
			};

			await executeAction(mockSuggestion);
			const history = await getActionHistory();

			expect(history[0].result).toHaveProperty('success');
			expect(history[0].result).toHaveProperty('message');
			expect(history[0].result).toHaveProperty('affectedEntityIds');
		});

		it('should include failed actions in history', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {} // Invalid, will fail
			};

			await executeAction(mockSuggestion);
			const history = await getActionHistory();

			expect(history).toHaveLength(1);
			expect(history[0].result.success).toBe(false);
		});

		it('should persist history across service calls', async () => {
			mockSuggestion.suggestedAction = {
				actionType: 'flag-for-review',
				actionData: { entityIds: ['e1'], reason: 'test' }
			};

			await executeAction(mockSuggestion);

			const history1 = await getActionHistory();
			const history2 = await getActionHistory();

			expect(history1).toEqual(history2);
		});
	});

	describe('undoLastAction', () => {
		let historyEntryId: string;

		beforeEach(async () => {
			// Execute an action to have something to undo
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-1',
					targetId: 'entity-2',
					relationship: 'knows',
					bidirectional: true
				}
			};

			await executeAction(mockSuggestion);
			const history = await getActionHistory();
			historyEntryId = history[0].id;
		});

		it('should undo create-relationship action', async () => {
			const result = await undoLastAction(historyEntryId);

			expect(result).toBe(true);
			expect(entityRepository.removeLink).toHaveBeenCalled();
		});

		it('should remove link that was created', async () => {
			await undoLastAction(historyEntryId);

			expect(entityRepository.removeLink).toHaveBeenCalledWith(
				'entity-1',
				expect.any(String) // link ID
			);
		});

		it('should return true on successful undo', async () => {
			const result = await undoLastAction(historyEntryId);

			expect(result).toBe(true);
		});

		it('should return false for non-existent history entry', async () => {
			const result = await undoLastAction('non-existent-id');

			expect(result).toBe(false);
		});

		it('should handle undo failure gracefully', async () => {
			vi.mocked(entityRepository.removeLink).mockRejectedValue(new Error('Link not found'));

			const result = await undoLastAction(historyEntryId);

			expect(result).toBe(false);
		});

		it('should undo edit-entity action', async () => {
			// Create a new action to undo
			const editSuggestion = {
				...mockSuggestion,
				id: 'sug-edit',
				suggestedAction: {
					actionType: 'edit-entity' as const,
					actionData: {
						entityId: 'entity-1',
						updates: { name: 'New Name' }
					}
				}
			};

			// Mock getById to return entity with original state
			vi.mocked(entityRepository.getById).mockResolvedValue({
				id: 'entity-1',
				name: 'Original Name',
				type: 'character',
				description: '',
				tags: [],
				notes: '',
				metadata: {},
				fields: {},
				links: [],
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await executeAction(editSuggestion);
			const history = await getActionHistory();
			const editHistoryId = history.find(h => h.suggestionId === 'sug-edit')!.id;

			const result = await undoLastAction(editHistoryId);

			expect(result).toBe(true);
			expect(entityRepository.update).toHaveBeenCalled();
		});

		it('should revert suggestion status from accepted to pending', async () => {
			await undoLastAction(historyEntryId);

			expect(suggestionRepository.update).toHaveBeenCalledWith(
				'suggestion-1',
				{ status: 'pending' }
			);
		});

		it('should not be able to undo same action twice', async () => {
			const firstUndo = await undoLastAction(historyEntryId);
			expect(firstUndo).toBe(true);

			const secondUndo = await undoLastAction(historyEntryId);
			expect(secondUndo).toBe(false);
		});

		it('should mark history entry as undone', async () => {
			await undoLastAction(historyEntryId);

			const history = await getActionHistory();
			const entry = history.find(h => h.id === historyEntryId);

			expect(entry?.undone).toBe(true);
		});
	});

	describe('clearActionHistory', () => {
		beforeEach(async () => {
			// Execute some actions
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
			};

			await executeAction(mockSuggestion);
			await executeAction({ ...mockSuggestion, id: 'sug-2' });
		});

		it('should clear all action history', async () => {
			const beforeClear = await getActionHistory();
			expect(beforeClear.length).toBeGreaterThan(0);

			await clearActionHistory();

			const afterClear = await getActionHistory();
			expect(afterClear).toEqual([]);
		});

		it('should not affect existing entities', async () => {
			await clearActionHistory();

			// Entities and relationships should still exist
			expect(entityRepository.removeLink).not.toHaveBeenCalled();
		});
	});

	describe('Integration Tests', () => {
		it('should support complete workflow: execute, record, undo', async () => {
			// Execute action
			mockSuggestion.suggestedAction = {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-1',
					targetId: 'entity-2',
					relationship: 'allies_with'
				}
			};

			const executeResult = await executeAction(mockSuggestion);
			expect(executeResult.success).toBe(true);

			// Check history
			const history = await getActionHistory();
			expect(history).toHaveLength(1);
			expect(history[0].actionType).toBe('create-relationship');

			// Undo action
			const undoResult = await undoLastAction(history[0].id);
			expect(undoResult).toBe(true);

			// Verify undo was recorded
			const updatedHistory = await getActionHistory();
			expect(updatedHistory[0].undone).toBe(true);
		});

		it('should handle multiple action types in sequence', async () => {
			// Create relationship
			await executeAction({
				...mockSuggestion,
				id: 'sug-1',
				suggestedAction: {
					actionType: 'create-relationship',
					actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
				}
			});

			// Edit entity
			await executeAction({
				...mockSuggestion,
				id: 'sug-2',
				suggestedAction: {
					actionType: 'edit-entity',
					actionData: { entityId: 'e1', updates: { name: 'Updated' } }
				}
			});

			// Flag for review
			await executeAction({
				...mockSuggestion,
				id: 'sug-3',
				suggestedAction: {
					actionType: 'flag-for-review',
					actionData: { entityIds: ['e1'], reason: 'test' }
				}
			});

			const history = await getActionHistory();
			expect(history).toHaveLength(3);
			expect(history.map(h => h.actionType)).toEqual([
				'create-relationship',
				'edit-entity',
				'flag-for-review'
			]);
		});
	});
});
