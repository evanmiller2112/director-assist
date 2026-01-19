/**
 * Tests for Conversation Store
 *
 * These tests verify the conversation store functionality which manages:
 * - Conversations list (loading, creating, deleting)
 * - Active conversation selection
 * - Conversation renaming
 * - Loading state during async operations
 * - Error handling for conversation operations
 *
 * Test Coverage:
 * - Initial state (empty conversations, null activeConversationId, loading)
 * - load() method (subscribe to repository, handle observable updates/errors)
 * - create() method (create via repository, set as active, handle errors)
 * - setActive() method (change active conversation, persist to appConfig)
 * - rename() method (update conversation name via repository)
 * - delete() method (remove conversation, handle deleting active, switch to next)
 * - activeConversation derived state (returns correct conversation object)
 * - Edge cases (rapid operations, concurrent operations)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Conversation Store', () => {
	let conversationStore: any;
	let mockConversationRepository: any;
	let mockAppConfigRepository: any;
	let mockObservable: any;
	let observerCallback: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.clearAllTimers();

		// Create mock observer callback capture
		observerCallback = null;

		// Mock conversation repository with observable
		mockObservable = {
			subscribe: vi.fn((observer: any) => {
				observerCallback = observer;
				return { unsubscribe: vi.fn() };
			})
		};

		mockConversationRepository = {
			getAll: vi.fn(() => mockObservable),
			create: vi.fn(async (name?: string) => ({
				id: `conv-${Date.now()}`,
				name: name || `New Conversation ${Date.now()}`,
				createdAt: new Date(),
				updatedAt: new Date()
			})),
			update: vi.fn(async (id: string, name: string) => {}),
			delete: vi.fn(async (id: string, deleteMessages?: boolean) => {})
		};

		mockAppConfigRepository = {
			getActiveConversationId: vi.fn(async () => null),
			setActiveConversationId: vi.fn(async (id: string) => {}),
			clearActiveConversationId: vi.fn(async () => {})
		};

		// Mock the dependencies
		vi.doMock('$lib/db/repositories', () => ({
			conversationRepository: mockConversationRepository,
			appConfigRepository: mockAppConfigRepository
		}));

		// Import fresh store instance
		vi.resetModules();
		const module = await import('./conversation.svelte');
		conversationStore = module.conversationStore;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should initialize with empty conversations array', () => {
			expect(conversationStore.conversations).toBeDefined();
			expect(Array.isArray(conversationStore.conversations)).toBe(true);
			expect(conversationStore.conversations.length).toBe(0);
		});

		it('should initialize with null activeConversationId', () => {
			expect(conversationStore.activeConversationId).toBe(null);
		});

		it('should initialize with isLoading true', () => {
			expect(conversationStore.isLoading).toBe(true);
		});

		it('should initialize with null error', () => {
			expect(conversationStore.error).toBe(null);
		});

		it('should have all state properties defined', () => {
			expect(conversationStore).toHaveProperty('conversations');
			expect(conversationStore).toHaveProperty('activeConversationId');
			expect(conversationStore).toHaveProperty('isLoading');
			expect(conversationStore).toHaveProperty('error');
		});

		it('should have all methods defined', () => {
			expect(conversationStore).toHaveProperty('load');
			expect(conversationStore).toHaveProperty('create');
			expect(conversationStore).toHaveProperty('setActive');
			expect(conversationStore).toHaveProperty('rename');
			expect(conversationStore).toHaveProperty('delete');
		});

		it('should have activeConversation derived property', () => {
			expect(conversationStore).toHaveProperty('activeConversation');
		});
	});

	describe('load() Method', () => {
		it('should call conversationRepository.getAll', async () => {
			await conversationStore.load();

			expect(mockConversationRepository.getAll).toHaveBeenCalled();
		});

		it('should subscribe to observable', async () => {
			await conversationStore.load();

			expect(mockObservable.subscribe).toHaveBeenCalled();
		});

		it('should set isLoading to false after initial load', async () => {
			await conversationStore.load();

			// Simulate observable next
			observerCallback.next([]);

			expect(conversationStore.isLoading).toBe(false);
		});

		it('should update conversations when observable emits', async () => {
			await conversationStore.load();

			const testConversations = [
				{
					id: 'conv-1',
					name: 'First Conversation',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: 'conv-2',
					name: 'Second Conversation',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			// Simulate observable next
			observerCallback.next(testConversations);

			expect(conversationStore.conversations).toEqual(testConversations);
			expect(conversationStore.conversations.length).toBe(2);
		});

		it('should update conversations to empty array when observable emits empty', async () => {
			await conversationStore.load();

			// Set initial conversations
			observerCallback.next([
				{ id: 'conv-1', name: 'Test', createdAt: new Date(), updatedAt: new Date() }
			]);

			// Now emit empty
			observerCallback.next([]);

			expect(conversationStore.conversations).toEqual([]);
			expect(conversationStore.conversations.length).toBe(0);
		});

		it('should load active conversation ID from appConfig', async () => {
			mockAppConfigRepository.getActiveConversationId.mockResolvedValue('conv-123');

			await conversationStore.load();

			expect(mockAppConfigRepository.getActiveConversationId).toHaveBeenCalled();
			expect(conversationStore.activeConversationId).toBe('conv-123');
		});

		it('should set error when observable emits error', async () => {
			await conversationStore.load();

			const testError = new Error('Failed to load conversations');
			observerCallback.error(testError);

			expect(conversationStore.error).toBe('Failed to load conversations');
		});

		it('should set error with generic message when error is not Error instance', async () => {
			await conversationStore.load();

			observerCallback.error('String error');

			expect(conversationStore.error).toBe('Failed to load conversations');
		});

		it('should handle load errors from catch block', async () => {
			mockConversationRepository.getAll.mockImplementation(() => {
				throw new Error('Repository error');
			});

			await conversationStore.load();

			expect(conversationStore.error).toBe('Repository error');
		});

		it('should handle multiple observable updates', async () => {
			await conversationStore.load();

			const conversations1 = [
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() }
			];
			observerCallback.next(conversations1);
			expect(conversationStore.conversations.length).toBe(1);

			const conversations2 = [
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() }
			];
			observerCallback.next(conversations2);
			expect(conversationStore.conversations.length).toBe(2);
		});
	});

	describe('create() Method', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([]);
		});

		it('should call conversationRepository.create', async () => {
			await conversationStore.create();

			expect(mockConversationRepository.create).toHaveBeenCalled();
		});

		it('should create conversation with provided name', async () => {
			await conversationStore.create('My Custom Conversation');

			expect(mockConversationRepository.create).toHaveBeenCalledWith('My Custom Conversation');
		});

		it('should create conversation without name when not provided', async () => {
			await conversationStore.create();

			expect(mockConversationRepository.create).toHaveBeenCalledWith(undefined);
		});

		it('should set created conversation as active', async () => {
			const createdConv = {
				id: 'conv-new',
				name: 'New Conversation',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			mockConversationRepository.create.mockResolvedValue(createdConv);

			await conversationStore.create('New Conversation');

			expect(mockAppConfigRepository.setActiveConversationId).toHaveBeenCalledWith('conv-new');
			expect(conversationStore.activeConversationId).toBe('conv-new');
		});

		it('should handle creation errors', async () => {
			mockConversationRepository.create.mockRejectedValue(new Error('Create failed'));

			await conversationStore.create('Test');

			expect(conversationStore.error).toBe('Create failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockConversationRepository.create.mockRejectedValue('String error');

			await conversationStore.create('Test');

			expect(conversationStore.error).toBe('Failed to create conversation');
		});

		it('should clear error before creating', async () => {
			// Set an error first
			mockConversationRepository.create.mockRejectedValue(new Error('First error'));
			await conversationStore.create('Fail');
			expect(conversationStore.error).toBe('First error');

			// Now create successfully
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-new',
				name: 'Success',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			const createPromise = conversationStore.create('Success');

			// Error should be cleared immediately
			expect(conversationStore.error).toBe(null);

			await createPromise;
		});

		it('should handle empty string name', async () => {
			await conversationStore.create('');

			expect(mockConversationRepository.create).toHaveBeenCalledWith('');
		});

		it('should handle unicode characters in name', async () => {
			await conversationStore.create('世界 🐉 ñ');

			expect(mockConversationRepository.create).toHaveBeenCalledWith('世界 🐉 ñ');
		});
	});

	describe('setActive() Method', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() }
			]);
		});

		it('should set activeConversationId', async () => {
			await conversationStore.setActive('conv-1');

			expect(conversationStore.activeConversationId).toBe('conv-1');
		});

		it('should persist to appConfig', async () => {
			await conversationStore.setActive('conv-2');

			expect(mockAppConfigRepository.setActiveConversationId).toHaveBeenCalledWith('conv-2');
		});

		it('should handle switching between conversations', async () => {
			await conversationStore.setActive('conv-1');
			expect(conversationStore.activeConversationId).toBe('conv-1');

			await conversationStore.setActive('conv-2');
			expect(conversationStore.activeConversationId).toBe('conv-2');
		});

		it('should handle setting to null', async () => {
			await conversationStore.setActive('conv-1');
			await conversationStore.setActive(null);

			expect(conversationStore.activeConversationId).toBe(null);
			expect(mockAppConfigRepository.clearActiveConversationId).toHaveBeenCalled();
		});

		it('should handle errors when setting active', async () => {
			mockAppConfigRepository.setActiveConversationId.mockRejectedValue(
				new Error('Set active failed')
			);

			await conversationStore.setActive('conv-1');

			expect(conversationStore.error).toBe('Set active failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockAppConfigRepository.setActiveConversationId.mockRejectedValue('String error');

			await conversationStore.setActive('conv-1');

			expect(conversationStore.error).toBe('Failed to set active conversation');
		});
	});

	describe('rename() Method', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'Original Name', createdAt: new Date(), updatedAt: new Date() }
			]);
		});

		it('should call conversationRepository.update', async () => {
			await conversationStore.rename('conv-1', 'New Name');

			expect(mockConversationRepository.update).toHaveBeenCalledWith('conv-1', 'New Name');
		});

		it('should handle rename errors', async () => {
			mockConversationRepository.update.mockRejectedValue(new Error('Rename failed'));

			await conversationStore.rename('conv-1', 'New Name');

			expect(conversationStore.error).toBe('Rename failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockConversationRepository.update.mockRejectedValue('String error');

			await conversationStore.rename('conv-1', 'New Name');

			expect(conversationStore.error).toBe('Failed to rename conversation');
		});

		it('should handle empty string name', async () => {
			await conversationStore.rename('conv-1', '');

			expect(mockConversationRepository.update).toHaveBeenCalledWith('conv-1', '');
		});

		it('should handle unicode characters', async () => {
			await conversationStore.rename('conv-1', '世界 🐉');

			expect(mockConversationRepository.update).toHaveBeenCalledWith('conv-1', '世界 🐉');
		});
	});

	describe('delete() Method', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-3', name: 'Third', createdAt: new Date(), updatedAt: new Date() }
			]);
		});

		it('should call conversationRepository.delete', async () => {
			await conversationStore.delete('conv-2');

			expect(mockConversationRepository.delete).toHaveBeenCalledWith('conv-2', true);
		});

		it('should delete with messages by default', async () => {
			await conversationStore.delete('conv-1');

			expect(mockConversationRepository.delete).toHaveBeenCalledWith('conv-1', true);
		});

		it('should not change activeConversationId when deleting non-active conversation', async () => {
			await conversationStore.setActive('conv-1');

			await conversationStore.delete('conv-2');

			expect(conversationStore.activeConversationId).toBe('conv-1');
		});

		it('should switch to next conversation when deleting active conversation', async () => {
			await conversationStore.setActive('conv-2');

			// After deleting conv-2, should switch to conv-3 (next in list)
			await conversationStore.delete('conv-2');

			// The observable will update with the new list
			observerCallback.next([
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-3', name: 'Third', createdAt: new Date(), updatedAt: new Date() }
			]);

			// Should switch to the next conversation (conv-3) or first if it was last
			expect(conversationStore.activeConversationId).not.toBe('conv-2');
			expect(mockAppConfigRepository.setActiveConversationId).toHaveBeenCalled();
		});

		it('should switch to previous conversation when deleting last active conversation', async () => {
			await conversationStore.setActive('conv-3');

			await conversationStore.delete('conv-3');

			// Should switch to previous conversation (conv-2)
			expect(conversationStore.activeConversationId).not.toBe('conv-3');
		});

		it('should set activeConversationId to null when deleting only conversation', async () => {
			// Set up with only one conversation
			observerCallback.next([
				{ id: 'conv-1', name: 'Only', createdAt: new Date(), updatedAt: new Date() }
			]);
			await conversationStore.setActive('conv-1');

			await conversationStore.delete('conv-1');

			// After deletion, list is empty
			observerCallback.next([]);

			expect(conversationStore.activeConversationId).toBe(null);
			expect(mockAppConfigRepository.clearActiveConversationId).toHaveBeenCalled();
		});

		it('should handle delete errors', async () => {
			mockConversationRepository.delete.mockRejectedValue(new Error('Delete failed'));

			await conversationStore.delete('conv-1');

			expect(conversationStore.error).toBe('Delete failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockConversationRepository.delete.mockRejectedValue('String error');

			await conversationStore.delete('conv-1');

			expect(conversationStore.error).toBe('Failed to delete conversation');
		});

		it('should handle deleting non-existent conversation', async () => {
			await expect(conversationStore.delete('non-existent')).resolves.not.toThrow();
		});
	});

	describe('activeConversation Derived State', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() }
			]);
		});

		it('should return undefined when no active conversation', () => {
			expect(conversationStore.activeConversation).toBeUndefined();
		});

		it('should return active conversation object', async () => {
			await conversationStore.setActive('conv-1');

			expect(conversationStore.activeConversation).toBeDefined();
			expect(conversationStore.activeConversation?.id).toBe('conv-1');
			expect(conversationStore.activeConversation?.name).toBe('First');
		});

		it('should update when active conversation changes', async () => {
			await conversationStore.setActive('conv-1');
			expect(conversationStore.activeConversation?.name).toBe('First');

			await conversationStore.setActive('conv-2');
			expect(conversationStore.activeConversation?.name).toBe('Second');
		});

		it('should return undefined when active conversation ID not in list', async () => {
			await conversationStore.setActive('non-existent');

			expect(conversationStore.activeConversation).toBeUndefined();
		});

		it('should update when conversations list changes', async () => {
			await conversationStore.setActive('conv-1');
			expect(conversationStore.activeConversation?.name).toBe('First');

			// Update conversation list with renamed conversation
			observerCallback.next([
				{ id: 'conv-1', name: 'First Updated', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() }
			]);

			expect(conversationStore.activeConversation?.name).toBe('First Updated');
		});
	});

	describe('State Independence', () => {
		it('should not affect other state when loading', async () => {
			const initialError = conversationStore.error;
			const initialActive = conversationStore.activeConversationId;

			await conversationStore.load();

			// isLoading will change, but error and active should remain
			expect(conversationStore.error).toBe(initialError);
		});

		it('should not affect other state when creating conversation', async () => {
			await conversationStore.load();
			observerCallback.next([]);

			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-new',
				name: 'New',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await conversationStore.create('New');

			// Only activeConversationId should change
			expect(conversationStore.activeConversationId).toBe('conv-new');
		});
	});

	describe('Edge Cases and Concurrency', () => {
		beforeEach(async () => {
			await conversationStore.load();
			observerCallback.next([]);
		});

		it('should handle rapid conversation creation', async () => {
			const promises = [];
			for (let i = 0; i < 5; i++) {
				promises.push(conversationStore.create(`Rapid ${i}`));
			}

			await Promise.all(promises);

			expect(mockConversationRepository.create).toHaveBeenCalledTimes(5);
		});

		it('should handle mixed operations', async () => {
			// Create
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-1',
				name: 'First',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await conversationStore.create('First');

			// Set active
			await conversationStore.setActive('conv-1');

			// Rename
			await conversationStore.rename('conv-1', 'First Updated');

			// Create another
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-2',
				name: 'Second',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await conversationStore.create('Second');

			expect(conversationStore.activeConversationId).toBe('conv-2');
		});

		it('should handle state reset scenario', async () => {
			// Setup initial state
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-1',
				name: 'Test',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await conversationStore.create('Test');

			// Reset by deleting
			await conversationStore.delete('conv-1');
			observerCallback.next([]);

			// Verify clean state
			expect(conversationStore.conversations).toEqual([]);
			expect(conversationStore.activeConversationId).toBe(null);
			expect(conversationStore.error).toBe(null);
		});

		it('should handle all operations in sequence', async () => {
			// Load
			await conversationStore.load();
			expect(mockConversationRepository.getAll).toHaveBeenCalled();

			// Create
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-1',
				name: 'First',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await conversationStore.create('First');
			expect(conversationStore.activeConversationId).toBe('conv-1');

			// Rename
			await conversationStore.rename('conv-1', 'First Updated');

			// Create another
			mockConversationRepository.create.mockResolvedValue({
				id: 'conv-2',
				name: 'Second',
				createdAt: new Date(),
				updatedAt: new Date()
			});
			await conversationStore.create('Second');

			// Switch active
			await conversationStore.setActive('conv-1');
			expect(conversationStore.activeConversationId).toBe('conv-1');

			// Delete non-active
			await conversationStore.delete('conv-2');

			// Delete active
			await conversationStore.delete('conv-1');
		});
	});

	describe('Reactivity', () => {
		it('should update conversations array when observable emits', async () => {
			await conversationStore.load();

			const conversations = [
				{ id: 'conv-1', name: 'Test', createdAt: new Date(), updatedAt: new Date() }
			];

			observerCallback.next(conversations);

			expect(conversationStore.conversations).toEqual(conversations);
		});

		it('should update error when observable emits error', async () => {
			await conversationStore.load();

			observerCallback.error(new Error('Test error'));

			expect(conversationStore.error).toBe('Test error');
		});

		it('should update activeConversationId when setting active', async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'Test', createdAt: new Date(), updatedAt: new Date() }
			]);

			await conversationStore.setActive('conv-1');

			expect(conversationStore.activeConversationId).toBe('conv-1');
		});

		it('should update activeConversation when activeConversationId changes', async () => {
			await conversationStore.load();
			observerCallback.next([
				{ id: 'conv-1', name: 'First', createdAt: new Date(), updatedAt: new Date() },
				{ id: 'conv-2', name: 'Second', createdAt: new Date(), updatedAt: new Date() }
			]);

			await conversationStore.setActive('conv-1');
			expect(conversationStore.activeConversation?.name).toBe('First');

			await conversationStore.setActive('conv-2');
			expect(conversationStore.activeConversation?.name).toBe('Second');
		});
	});
});
