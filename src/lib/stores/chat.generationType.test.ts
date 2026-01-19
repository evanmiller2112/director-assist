/**
 * Tests for Chat Store - Generation Type Extension (TDD RED Phase)
 *
 * Issue #41: Generation Type Selector in Chat
 *
 * This test suite covers the new generation type functionality added to the chat store.
 * It extends the existing chat store with:
 * - generationType state
 * - setGenerationType() method
 * - Integration with sendMessage() to pass generationType to chatService
 *
 * Coverage:
 * - Initial state (defaults to 'custom')
 * - setGenerationType() method
 * - sendMessage() integration with generationType
 * - State independence
 * - Edge cases and validation
 *
 * These tests are expected to FAIL initially (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GenerationType } from '$lib/types';

describe('Chat Store - Generation Type Extension', () => {
	let chatStore: any;
	let mockChatRepository: any;
	let mockSendChatMessage: any;
	let mockObservable: any;
	let observerCallback: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.clearAllTimers();

		// Create mock observer callback capture
		observerCallback = null;

		// Mock chat repository with observable
		mockObservable = {
			subscribe: vi.fn((observer: any) => {
				observerCallback = observer;
				return { unsubscribe: vi.fn() };
			})
		};

		mockChatRepository = {
			getAll: vi.fn(() => mockObservable),
			add: vi.fn(async (role: string, content: string, contextEntities?: string[]) => ({
				id: `msg-${Date.now()}`,
				role,
				content,
				timestamp: new Date(),
				contextEntities
			})),
			clearAll: vi.fn(async () => {})
		};

		mockSendChatMessage = vi.fn(async () => 'AI response');

		// Mock the dependencies
		vi.doMock('$lib/db/repositories', () => ({
			chatRepository: mockChatRepository
		}));

		vi.doMock('$lib/services/chatService', () => ({
			sendChatMessage: mockSendChatMessage
		}));

		// Import fresh store instance
		vi.resetModules();
		const module = await import('./chat.svelte');
		chatStore = module.chatStore;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should have generationType property defined', () => {
			expect(chatStore).toHaveProperty('generationType');
		});

		it('should initialize with generationType as "custom"', () => {
			expect(chatStore.generationType).toBe('custom');
		});

		it('should have setGenerationType method defined', () => {
			expect(chatStore).toHaveProperty('setGenerationType');
			expect(typeof chatStore.setGenerationType).toBe('function');
		});

		it('should not affect other initial state', () => {
			expect(chatStore.messages).toBeDefined();
			expect(chatStore.isLoading).toBe(false);
			expect(chatStore.error).toBe(null);
			expect(chatStore.contextEntityIds).toBeDefined();
		});
	});

	describe('setGenerationType() Method', () => {
		it('should set generationType to "npc"', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');
		});

		it('should set generationType to "location"', () => {
			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');
		});

		it('should set generationType to "plot_hook"', () => {
			chatStore.setGenerationType('plot_hook');
			expect(chatStore.generationType).toBe('plot_hook');
		});

		it('should set generationType to "encounter"', () => {
			chatStore.setGenerationType('encounter');
			expect(chatStore.generationType).toBe('encounter');
		});

		it('should set generationType to "item"', () => {
			chatStore.setGenerationType('item');
			expect(chatStore.generationType).toBe('item');
		});

		it('should set generationType to "faction"', () => {
			chatStore.setGenerationType('faction');
			expect(chatStore.generationType).toBe('faction');
		});

		it('should set generationType to "session_prep"', () => {
			chatStore.setGenerationType('session_prep');
			expect(chatStore.generationType).toBe('session_prep');
		});

		it('should set generationType back to "custom"', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			chatStore.setGenerationType('custom');
			expect(chatStore.generationType).toBe('custom');
		});

		it('should allow changing generationType multiple times', () => {
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');

			chatStore.setGenerationType('encounter');
			expect(chatStore.generationType).toBe('encounter');
		});

		it('should not affect other state when changing generationType', () => {
			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);

			chatStore.setGenerationType('npc');

			expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			expect(chatStore.includeLinkedEntities).toBe(false);
			expect(chatStore.isLoading).toBe(false);
			expect(chatStore.error).toBe(null);
		});

		it('should persist generationType across multiple operations', () => {
			chatStore.setGenerationType('npc');

			chatStore.setContextEntities(['entity-1']);
			expect(chatStore.generationType).toBe('npc');

			chatStore.clearContextEntities();
			expect(chatStore.generationType).toBe('npc');
		});

		it('should handle setting same generationType multiple times', () => {
			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('npc');

			expect(chatStore.generationType).toBe('npc');
		});
	});

	describe('sendMessage() Integration with generationType', () => {
		beforeEach(async () => {
			await chatStore.load();
		});

		it('should pass generationType to sendChatMessage', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Generate an NPC');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate an NPC',
				expect.any(Array),
				expect.any(Boolean),
				expect.any(Function),
				'npc' // generationType should be passed as 5th argument
			);
		});

		it('should pass "custom" generationType by default', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			await chatStore.sendMessage('Test message');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Test message',
				expect.any(Array),
				expect.any(Boolean),
				expect.any(Function),
				'custom'
			);
		});

		it('should pass correct generationType for each type', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			const types: GenerationType[] = [
				'npc',
				'location',
				'plot_hook',
				'encounter',
				'item',
				'faction',
				'session_prep'
			];

			for (const type of types) {
				mockSendChatMessage.mockClear();
				chatStore.setGenerationType(type);
				await chatStore.sendMessage(`Generate a ${type}`);

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					expect.any(String),
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function),
					type
				);
			}
		});

		it('should pass generationType along with contextEntityIds', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Generate NPC');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate NPC',
				['entity-1', 'entity-2'],
				expect.any(Boolean),
				expect.any(Function),
				'npc'
			);
		});

		it('should pass generationType along with includeLinkedEntities', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setIncludeLinkedEntities(false);
			chatStore.setGenerationType('location');
			await chatStore.sendMessage('Generate location');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate location',
				expect.any(Array),
				false,
				expect.any(Function),
				'location'
			);
		});

		it('should pass generationType with streaming callback', async () => {
			mockSendChatMessage.mockImplementation(
				async (
					content: string,
					entityIds: string[],
					includeLinked: boolean,
					onStream: Function,
					generationType: GenerationType
				) => {
					onStream('Streaming...');
					expect(generationType).toBe('encounter');
					return 'Response';
				}
			);

			chatStore.setGenerationType('encounter');
			await chatStore.sendMessage('Generate encounter');

			expect(mockSendChatMessage).toHaveBeenCalled();
		});

		it('should maintain current generationType after sending message', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Test');

			expect(chatStore.generationType).toBe('npc');
		});

		it('should use updated generationType if changed before message completes', async () => {
			mockSendChatMessage.mockImplementation(async () => {
				// Simulate delay
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'Response';
			});

			chatStore.setGenerationType('npc');
			const sendPromise = chatStore.sendMessage('Test');

			// Change generationType while message is being sent
			chatStore.setGenerationType('location');

			await sendPromise;

			// The message should have been sent with 'npc' (captured at send time)
			// But current state should be 'location'
			expect(chatStore.generationType).toBe('location');
		});

		it('should handle errors without affecting generationType', async () => {
			mockSendChatMessage.mockRejectedValue(new Error('API error'));

			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('Test');

			expect(chatStore.generationType).toBe('npc');
			expect(chatStore.error).toBe('API error');
		});

		it('should ignore empty messages regardless of generationType', async () => {
			chatStore.setGenerationType('npc');
			await chatStore.sendMessage('');

			expect(mockSendChatMessage).not.toHaveBeenCalled();
		});

		it('should ignore whitespace messages regardless of generationType', async () => {
			chatStore.setGenerationType('location');
			await chatStore.sendMessage('   ');

			expect(mockSendChatMessage).not.toHaveBeenCalled();
		});
	});

	describe('State Independence', () => {
		it('should not affect loading state when changing generationType', () => {
			const initialLoading = chatStore.isLoading;

			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('location');
			chatStore.setGenerationType('custom');

			expect(chatStore.isLoading).toBe(initialLoading);
		});

		it('should not affect error state when changing generationType', () => {
			expect(chatStore.error).toBe(null);

			chatStore.setGenerationType('npc');
			chatStore.setGenerationType('location');

			expect(chatStore.error).toBe(null);
		});

		it('should not affect messages when changing generationType', async () => {
			await chatStore.load();
			observerCallback.next([
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			]);

			expect(chatStore.messages.length).toBe(1);

			chatStore.setGenerationType('npc');

			expect(chatStore.messages.length).toBe(1);
		});

		it('should not affect streaming content when changing generationType', () => {
			expect(chatStore.streamingContent).toBe('');

			chatStore.setGenerationType('npc');

			expect(chatStore.streamingContent).toBe('');
		});

		it('should not reset contextEntityIds when changing generationType', () => {
			chatStore.setContextEntities(['entity-1', 'entity-2']);

			chatStore.setGenerationType('npc');

			expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
		});

		it('should not reset includeLinkedEntities when changing generationType', () => {
			chatStore.setIncludeLinkedEntities(false);

			chatStore.setGenerationType('location');

			expect(chatStore.includeLinkedEntities).toBe(false);
		});
	});

	describe('Integration with other store operations', () => {
		it('should preserve generationType when loading messages', async () => {
			chatStore.setGenerationType('npc');

			await chatStore.load();

			expect(chatStore.generationType).toBe('npc');
		});

		it('should preserve generationType when clearing history', async () => {
			chatStore.setGenerationType('location');

			await chatStore.clearHistory();

			expect(chatStore.generationType).toBe('location');
		});

		it('should preserve generationType when setting context entities', () => {
			chatStore.setGenerationType('encounter');

			chatStore.setContextEntities(['entity-1']);
			chatStore.addContextEntity('entity-2');
			chatStore.removeContextEntity('entity-1');

			expect(chatStore.generationType).toBe('encounter');
		});

		it('should preserve generationType when toggling includeLinkedEntities', () => {
			chatStore.setGenerationType('item');

			chatStore.setIncludeLinkedEntities(false);
			chatStore.setIncludeLinkedEntities(true);

			expect(chatStore.generationType).toBe('item');
		});

		it('should support complete workflow with generationType', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			// Load
			await chatStore.load();

			// Set generation type
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');

			// Set context
			chatStore.setContextEntities(['entity-1']);

			// Send message
			await chatStore.sendMessage('Generate NPC');
			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Generate NPC',
				['entity-1'],
				expect.any(Boolean),
				expect.any(Function),
				'npc'
			);

			// Change generation type
			chatStore.setGenerationType('location');
			expect(chatStore.generationType).toBe('location');

			// Send another message
			await chatStore.sendMessage('Generate location');
			expect(mockSendChatMessage).toHaveBeenLastCalledWith(
				'Generate location',
				['entity-1'],
				expect.any(Boolean),
				expect.any(Function),
				'location'
			);

			// Clear history shouldn't affect type
			await chatStore.clearHistory();
			expect(chatStore.generationType).toBe('location');
		});
	});

	describe('Reactivity', () => {
		it('should update generationType reactively', () => {
			expect(chatStore.generationType).toBe('custom');

			chatStore.setGenerationType('npc');

			expect(chatStore.generationType).toBe('npc');
		});

		it('should be observable in Svelte components', () => {
			// Test that accessing generationType returns current value
			const type1 = chatStore.generationType;
			expect(type1).toBe('custom');

			chatStore.setGenerationType('location');

			const type2 = chatStore.generationType;
			expect(type2).toBe('location');
			expect(type2).not.toBe(type1);
		});

		it('should support rapid changes', () => {
			const types: GenerationType[] = [
				'npc',
				'location',
				'plot_hook',
				'encounter',
				'item',
				'faction',
				'session_prep',
				'custom'
			];

			types.forEach((type) => {
				chatStore.setGenerationType(type);
				expect(chatStore.generationType).toBe(type);
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle setting generationType before loading', () => {
			// Don't call load()
			chatStore.setGenerationType('npc');
			expect(chatStore.generationType).toBe('npc');
		});

		it('should handle setting generationType during message send', async () => {
			mockSendChatMessage.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'Response';
			});

			chatStore.setGenerationType('npc');
			const sendPromise = chatStore.sendMessage('Test');

			chatStore.setGenerationType('location');

			await sendPromise;

			expect(chatStore.generationType).toBe('location');
		});

		it('should handle rapid generationType changes', () => {
			for (let i = 0; i < 100; i++) {
				chatStore.setGenerationType(i % 2 === 0 ? 'npc' : 'location');
			}

			// Last iteration is i=99, which is odd, so 'location' is set last
			expect(chatStore.generationType).toBe('location');
		});

		it('should handle complete state reset including generationType', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			// Setup state
			chatStore.setGenerationType('npc');
			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);
			await chatStore.sendMessage('Test');

			// Reset to defaults
			chatStore.setGenerationType('custom');
			chatStore.clearContextEntities();
			chatStore.setIncludeLinkedEntities(true);
			await chatStore.clearHistory();

			// Verify clean state
			expect(chatStore.generationType).toBe('custom');
			expect(chatStore.contextEntityIds).toEqual([]);
			expect(chatStore.includeLinkedEntities).toBe(true);
			expect(chatStore.messages).toEqual([]);
		});
	});

	describe('Type Safety', () => {
		it('should accept all valid GenerationType values', () => {
			const validTypes: GenerationType[] = [
				'custom',
				'npc',
				'location',
				'plot_hook',
				'encounter',
				'item',
				'faction',
				'session_prep'
			];

			validTypes.forEach((type) => {
				expect(() => chatStore.setGenerationType(type)).not.toThrow();
			});
		});

		it('should have generationType as GenerationType type', () => {
			chatStore.setGenerationType('npc');
			const type: GenerationType = chatStore.generationType;
			expect(type).toBe('npc');
		});
	});
});
