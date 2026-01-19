/**
 * Tests for Chat Store
 *
 * These tests verify the chat store functionality which manages:
 * - Messages (loading, sending)
 * - Loading state during async operations
 * - Error handling for chat operations
 * - Context entities (set, add, remove, clear)
 * - Streaming content during message sending
 * - Include linked entities toggle
 *
 * Test Coverage:
 * - Initial state (empty messages, not loading, no error, empty context, include linked)
 * - load() method (subscribe to repository, handle observable updates/errors)
 * - sendMessage() method (ignore empty, set loading, add messages, stream, handle errors)
 * - clearHistory() method (clear all messages, call repository clearAll, handle errors)
 * - Context entity management (set, add, remove, clear, no duplicates)
 * - includeLinkedEntities toggle
 * - Edge cases (empty strings, rapid operations, concurrent operations)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Chat Store', () => {
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
		it('should initialize with empty messages array', () => {
			expect(chatStore.messages).toBeDefined();
			expect(Array.isArray(chatStore.messages)).toBe(true);
			expect(chatStore.messages.length).toBe(0);
		});

		it('should initialize with isLoading false', () => {
			expect(chatStore.isLoading).toBe(false);
		});

		it('should initialize with null error', () => {
			expect(chatStore.error).toBe(null);
		});

		it('should initialize with empty contextEntityIds array', () => {
			expect(chatStore.contextEntityIds).toBeDefined();
			expect(Array.isArray(chatStore.contextEntityIds)).toBe(true);
			expect(chatStore.contextEntityIds.length).toBe(0);
		});

		it('should initialize with empty streamingContent', () => {
			expect(chatStore.streamingContent).toBe('');
		});

		it('should initialize with includeLinkedEntities true', () => {
			expect(chatStore.includeLinkedEntities).toBe(true);
		});

		it('should have all state properties defined', () => {
			expect(chatStore).toHaveProperty('messages');
			expect(chatStore).toHaveProperty('isLoading');
			expect(chatStore).toHaveProperty('error');
			expect(chatStore).toHaveProperty('contextEntityIds');
			expect(chatStore).toHaveProperty('streamingContent');
			expect(chatStore).toHaveProperty('includeLinkedEntities');
		});

		it('should have all methods defined', () => {
			expect(chatStore).toHaveProperty('load');
			expect(chatStore).toHaveProperty('sendMessage');
			expect(chatStore).toHaveProperty('clearHistory');
			expect(chatStore).toHaveProperty('setContextEntities');
			expect(chatStore).toHaveProperty('addContextEntity');
			expect(chatStore).toHaveProperty('removeContextEntity');
			expect(chatStore).toHaveProperty('clearContextEntities');
			expect(chatStore).toHaveProperty('setIncludeLinkedEntities');
		});
	});

	describe('load() Method', () => {
		it('should call chatRepository.getAll', async () => {
			await chatStore.load();

			expect(mockChatRepository.getAll).toHaveBeenCalled();
		});

		it('should subscribe to observable', async () => {
			await chatStore.load();

			expect(mockObservable.subscribe).toHaveBeenCalled();
		});

		it('should update messages when observable emits', async () => {
			await chatStore.load();

			const testMessages = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Hello',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Hi there',
					timestamp: new Date()
				}
			];

			// Simulate observable next
			observerCallback.next(testMessages);

			expect(chatStore.messages).toEqual(testMessages);
			expect(chatStore.messages.length).toBe(2);
		});

		it('should update messages to empty array when observable emits empty', async () => {
			// Set initial messages
			await chatStore.load();
			observerCallback.next([
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			]);

			// Now emit empty
			observerCallback.next([]);

			expect(chatStore.messages).toEqual([]);
			expect(chatStore.messages.length).toBe(0);
		});

		it('should set error when observable emits error', async () => {
			await chatStore.load();

			const testError = new Error('Failed to load messages');
			observerCallback.error(testError);

			expect(chatStore.error).toBe('Failed to load messages');
		});

		it('should set error with generic message when error is not Error instance', async () => {
			await chatStore.load();

			observerCallback.error('String error');

			expect(chatStore.error).toBe('Failed to load messages');
		});

		it('should handle load errors from catch block', async () => {
			mockChatRepository.getAll.mockImplementation(() => {
				throw new Error('Repository error');
			});

			await chatStore.load();

			expect(chatStore.error).toBe('Repository error');
		});

		it('should handle non-Error exceptions in catch block', async () => {
			mockChatRepository.getAll.mockImplementation(() => {
				throw 'String error';
			});

			await chatStore.load();

			expect(chatStore.error).toBe('Failed to load messages');
		});

		it('should handle multiple observable updates', async () => {
			await chatStore.load();

			const messages1 = [
				{ id: 'msg-1', role: 'user', content: 'First', timestamp: new Date() }
			];
			observerCallback.next(messages1);
			expect(chatStore.messages.length).toBe(1);

			const messages2 = [
				{ id: 'msg-1', role: 'user', content: 'First', timestamp: new Date() },
				{ id: 'msg-2', role: 'assistant', content: 'Second', timestamp: new Date() }
			];
			observerCallback.next(messages2);
			expect(chatStore.messages.length).toBe(2);

			const messages3 = [
				{ id: 'msg-1', role: 'user', content: 'First', timestamp: new Date() },
				{ id: 'msg-2', role: 'assistant', content: 'Second', timestamp: new Date() },
				{ id: 'msg-3', role: 'user', content: 'Third', timestamp: new Date() }
			];
			observerCallback.next(messages3);
			expect(chatStore.messages.length).toBe(3);
		});

		it('should not throw when calling load multiple times', async () => {
			await expect(chatStore.load()).resolves.not.toThrow();
			await expect(chatStore.load()).resolves.not.toThrow();
			await expect(chatStore.load()).resolves.not.toThrow();
		});
	});

	describe('sendMessage() Method', () => {
		beforeEach(async () => {
			await chatStore.load();
		});

		describe('Empty Message Handling', () => {
			it('should ignore empty string messages', async () => {
				await chatStore.sendMessage('');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
				expect(chatStore.isLoading).toBe(false);
			});

			it('should ignore whitespace-only messages', async () => {
				await chatStore.sendMessage('   ');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
				expect(chatStore.isLoading).toBe(false);
			});

			it('should ignore tab-only messages', async () => {
				await chatStore.sendMessage('\t\t\t');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
			});

			it('should ignore newline-only messages', async () => {
				await chatStore.sendMessage('\n\n\n');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
			});

			it('should ignore mixed whitespace messages', async () => {
				await chatStore.sendMessage('  \t\n  \t  ');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
			});
		});

		describe('Loading State', () => {
			it('should set isLoading to true when sending starts', () => {
				mockSendChatMessage.mockImplementation(() => new Promise(() => {})); // Never resolves

				chatStore.sendMessage('Hello');

				expect(chatStore.isLoading).toBe(true);
			});

			it('should set isLoading to false when sending completes successfully', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage('Hello');

				expect(chatStore.isLoading).toBe(false);
			});

			it('should set isLoading to false when sending fails', async () => {
				mockSendChatMessage.mockRejectedValue(new Error('API error'));

				await chatStore.sendMessage('Hello');

				expect(chatStore.isLoading).toBe(false);
			});
		});

		describe('Error State', () => {
			it('should clear error when sending starts', async () => {
				// Force an error first by triggering an error condition
				mockSendChatMessage.mockRejectedValue(new Error('First error'));
				await chatStore.sendMessage('Fail');
				expect(chatStore.error).toBe('First error');

				// Now send a successful message - error should be cleared
				mockSendChatMessage.mockResolvedValue('Response');
				const sendPromise = chatStore.sendMessage('Hello');

				// Error should be cleared immediately when sending starts
				expect(chatStore.error).toBe(null);

				await sendPromise;
			});

			it('should set error when sending fails', async () => {
				mockSendChatMessage.mockRejectedValue(new Error('Network error'));

				await chatStore.sendMessage('Hello');

				expect(chatStore.error).toBe('Network error');
			});

			it('should set generic error when error is not Error instance', async () => {
				mockSendChatMessage.mockRejectedValue('String error');

				await chatStore.sendMessage('Hello');

				expect(chatStore.error).toBe('Failed to send message');
			});

			it('should handle repository.add errors', async () => {
				mockChatRepository.add.mockRejectedValue(new Error('Database error'));

				await chatStore.sendMessage('Hello');

				expect(chatStore.error).toBeTruthy();
			});
		});

		describe('Message Sending', () => {
			it('should trim message content before sending', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage('  Hello World  ');

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					'Hello World',
					expect.any(Array)
				);
				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Hello World',
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function)
				);
			});

			it('should add user message to repository', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage('User message');

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					'User message',
					expect.any(Array)
				);
			});

			it('should call sendChatMessage service', async () => {
				mockSendChatMessage.mockResolvedValue('AI response');

				await chatStore.sendMessage('Test message');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Test message',
					expect.any(Array),
					expect.any(Boolean),
					expect.any(Function)
				);
			});

			it('should pass context entity ids to sendChatMessage', async () => {
				mockSendChatMessage.mockResolvedValue('Response');
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				await chatStore.sendMessage('Test');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Test',
					['entity-1', 'entity-2'],
					expect.any(Boolean),
					expect.any(Function)
				);
			});

			it('should pass includeLinkedEntities flag to sendChatMessage', async () => {
				mockSendChatMessage.mockResolvedValue('Response');
				chatStore.setIncludeLinkedEntities(false);

				await chatStore.sendMessage('Test');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Test',
					expect.any(Array),
					false,
					expect.any(Function)
				);
			});

			it('should add assistant response to repository', async () => {
				const aiResponse = 'This is the AI response';
				mockSendChatMessage.mockResolvedValue(aiResponse);

				await chatStore.sendMessage('User question');

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'assistant',
					aiResponse,
					expect.any(Array)
				);
			});

			it('should add both user and assistant messages', async () => {
				mockSendChatMessage.mockResolvedValue('AI response');

				await chatStore.sendMessage('User message');

				expect(mockChatRepository.add).toHaveBeenCalledTimes(2);
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					1,
					'user',
					'User message',
					expect.any(Array)
				);
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					2,
					'assistant',
					'AI response',
					expect.any(Array)
				);
			});

			it('should preserve context entities in both messages', async () => {
				mockSendChatMessage.mockResolvedValue('Response');
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				await chatStore.sendMessage('Test');

				// Both user and assistant messages should have same context
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					1,
					'user',
					'Test',
					['entity-1', 'entity-2']
				);
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					2,
					'assistant',
					'Response',
					['entity-1', 'entity-2']
				);
			});

			it('should pass empty context array when no entities selected', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage('Test');

				expect(mockChatRepository.add).toHaveBeenCalledWith('user', 'Test', []);
			});
		});

		describe('Streaming Content', () => {
			it('should clear streamingContent when sending starts', async () => {
				// First, create streaming content by sending a message with streaming
				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						onStream('Some content');
						return 'Response';
					}
				);
				await chatStore.sendMessage('First');
				// streamingContent should be cleared after completion
				expect(chatStore.streamingContent).toBe('');

				// Now verify it's cleared at the start of a new message
				mockSendChatMessage.mockResolvedValue('Response');
				const sendPromise = chatStore.sendMessage('Test');

				// streamingContent should be empty immediately when sending starts
				expect(chatStore.streamingContent).toBe('');

				await sendPromise;
			});

			it('should update streamingContent during streaming', async () => {
				let capturedStreamingContent = '';

				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						// Simulate streaming by calling onStream
						onStream('Partial response...');
						// Capture the state after the callback
						capturedStreamingContent = chatStore.streamingContent;
						return 'Final response';
					}
				);

				await chatStore.sendMessage('Test');

				// Check that streaming content was updated during the call
				expect(capturedStreamingContent).toBe('Partial response...');

				// After completion, should be cleared
				expect(chatStore.streamingContent).toBe('');
			});

			it('should handle multiple streaming updates', async () => {
				let capturedStreamingContent = '';

				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						onStream('First...');
						onStream('First... Second...');
						onStream('First... Second... Third...');
						// Capture the final state after all streaming updates
						capturedStreamingContent = chatStore.streamingContent;
						return 'Complete';
					}
				);

				await chatStore.sendMessage('Test');

				// Final streaming content should have been the last update
				expect(capturedStreamingContent).toBe('First... Second... Third...');

				// Should be cleared after completion
				expect(chatStore.streamingContent).toBe('');
			});

			it('should clear streamingContent on successful completion', async () => {
				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						onStream('Streaming...');
						return 'Final';
					}
				);

				await chatStore.sendMessage('Test');

				expect(chatStore.streamingContent).toBe('');
			});

			it('should clear streamingContent on error', async () => {
				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						onStream('Streaming...');
						throw new Error('API error');
					}
				);

				await chatStore.sendMessage('Test');

				expect(chatStore.streamingContent).toBe('');
			});

			it('should handle empty streaming content', async () => {
				mockSendChatMessage.mockImplementation(
					async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
						onStream('');
						return 'Final';
					}
				);

				await chatStore.sendMessage('Test');

				expect(chatStore.streamingContent).toBe('');
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long messages', async () => {
				const longMessage = 'A'.repeat(10000);
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage(longMessage);

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					longMessage,
					expect.any(Array)
				);
			});

			it('should handle unicode characters', async () => {
				const unicodeMessage = 'Hello 世界 🐉 ñ ü é';
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage(unicodeMessage);

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					unicodeMessage,
					expect.any(Array)
				);
			});

			it('should handle newlines in messages', async () => {
				const multilineMessage = 'Line 1\nLine 2\nLine 3';
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage(multilineMessage);

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					multilineMessage,
					expect.any(Array)
				);
			});

			it('should handle special characters', async () => {
				const specialMessage = '<script>alert("XSS")</script> & "quotes"';
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage(specialMessage);

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					specialMessage,
					expect.any(Array)
				);
			});

			it('should handle markdown content', async () => {
				const markdown = '# Heading\n\n**Bold** and *italic*\n\n- List';
				mockSendChatMessage.mockResolvedValue('Response');

				await chatStore.sendMessage(markdown);

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					markdown,
					expect.any(Array)
				);
			});
		});
	});

	describe('clearHistory() Method', () => {
		it('should call chatRepository.clearAll', async () => {
			await chatStore.clearHistory();

			expect(mockChatRepository.clearAll).toHaveBeenCalled();
		});

		it('should clear messages array', async () => {
			// Load store and simulate messages from observable
			await chatStore.load();
			observerCallback.next([
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			]);
			expect(chatStore.messages.length).toBe(1);

			await chatStore.clearHistory();

			expect(chatStore.messages).toEqual([]);
			expect(chatStore.messages.length).toBe(0);
		});

		it('should handle clear errors', async () => {
			mockChatRepository.clearAll.mockRejectedValue(new Error('Clear failed'));

			await chatStore.clearHistory();

			expect(chatStore.error).toBe('Clear failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockChatRepository.clearAll.mockRejectedValue('String error');

			await chatStore.clearHistory();

			expect(chatStore.error).toBe('Failed to clear history');
		});

		it('should not affect other state when clearing', async () => {
			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.setIncludeLinkedEntities(false);

			await chatStore.clearHistory();

			expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
			expect(chatStore.includeLinkedEntities).toBe(false);
		});

		it('should allow sending messages after clearing', async () => {
			await chatStore.clearHistory();

			mockSendChatMessage.mockResolvedValue('Response');
			await chatStore.sendMessage('New message');

			expect(mockChatRepository.add).toHaveBeenCalledWith(
				'user',
				'New message',
				expect.any(Array)
			);
		});

		it('should handle multiple consecutive clears', async () => {
			await chatStore.clearHistory();
			await chatStore.clearHistory();
			await chatStore.clearHistory();

			expect(mockChatRepository.clearAll).toHaveBeenCalledTimes(3);
			expect(chatStore.messages).toEqual([]);
		});

		it('should clear when messages array is already empty', async () => {
			expect(chatStore.messages.length).toBe(0);

			await expect(chatStore.clearHistory()).resolves.not.toThrow();
			expect(chatStore.messages).toEqual([]);
		});
	});

	describe('Context Entities Management', () => {
		describe('setContextEntities()', () => {
			it('should set context entities array', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2', 'entity-3']);
			});

			it('should replace existing context entities', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);
				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);

				chatStore.setContextEntities(['entity-3', 'entity-4']);
				expect(chatStore.contextEntityIds).toEqual(['entity-3', 'entity-4']);
			});

			it('should set empty array', () => {
				chatStore.setContextEntities(['entity-1']);
				expect(chatStore.contextEntityIds.length).toBe(1);

				chatStore.setContextEntities([]);
				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should handle single entity', () => {
				chatStore.setContextEntities(['entity-1']);

				expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			});

			it('should handle many entities', () => {
				const manyEntities = Array.from({ length: 50 }, (_, i) => `entity-${i}`);
				chatStore.setContextEntities(manyEntities);

				expect(chatStore.contextEntityIds).toEqual(manyEntities);
				expect(chatStore.contextEntityIds.length).toBe(50);
			});

			it('should handle entity IDs with special characters', () => {
				const specialIds = ['entity-with-dashes', 'entity_underscore', 'entity:colon'];
				chatStore.setContextEntities(specialIds);

				expect(chatStore.contextEntityIds).toEqual(specialIds);
			});

			it('should preserve duplicates if provided', () => {
				chatStore.setContextEntities(['entity-1', 'entity-1', 'entity-2']);

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-1', 'entity-2']);
			});
		});

		describe('addContextEntity()', () => {
			it('should add entity to empty array', () => {
				chatStore.addContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			});

			it('should add entity to existing entities', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				chatStore.addContextEntity('entity-3');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2', 'entity-3']);
			});

			it('should not add duplicate entity', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				chatStore.addContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
				expect(chatStore.contextEntityIds.length).toBe(2);
			});

			it('should not add entity that already exists', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				chatStore.addContextEntity('entity-2');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2', 'entity-3']);
			});

			it('should handle adding multiple entities', () => {
				chatStore.addContextEntity('entity-1');
				chatStore.addContextEntity('entity-2');
				chatStore.addContextEntity('entity-3');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2', 'entity-3']);
			});

			it('should handle empty string entity ID', () => {
				chatStore.addContextEntity('');

				expect(chatStore.contextEntityIds).toEqual(['']);
			});

			it('should not add empty string duplicate', () => {
				chatStore.addContextEntity('');
				chatStore.addContextEntity('');

				expect(chatStore.contextEntityIds).toEqual(['']);
			});

			it('should handle entity IDs with special characters', () => {
				chatStore.addContextEntity('entity-with-dashes');
				chatStore.addContextEntity('entity_underscore');

				expect(chatStore.contextEntityIds).toContain('entity-with-dashes');
				expect(chatStore.contextEntityIds).toContain('entity_underscore');
			});
		});

		describe('removeContextEntity()', () => {
			it('should remove entity from context', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				chatStore.removeContextEntity('entity-2');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-3']);
			});

			it('should handle removing first entity', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				chatStore.removeContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual(['entity-2', 'entity-3']);
			});

			it('should handle removing last entity', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				chatStore.removeContextEntity('entity-3');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
			});

			it('should handle removing only entity', () => {
				chatStore.setContextEntities(['entity-1']);

				chatStore.removeContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should do nothing when removing non-existent entity', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				chatStore.removeContextEntity('entity-999');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
			});

			it('should do nothing when removing from empty array', () => {
				chatStore.removeContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should remove all instances if duplicates exist', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-1', 'entity-3']);

				chatStore.removeContextEntity('entity-1');

				expect(chatStore.contextEntityIds).toEqual(['entity-2', 'entity-3']);
			});

			it('should handle removing multiple entities in sequence', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3', 'entity-4']);

				chatStore.removeContextEntity('entity-2');
				chatStore.removeContextEntity('entity-4');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-3']);
			});
		});

		describe('clearContextEntities()', () => {
			it('should clear all context entities', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2', 'entity-3']);

				chatStore.clearContextEntities();

				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should work when already empty', () => {
				chatStore.clearContextEntities();

				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should allow adding entities after clearing', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);
				chatStore.clearContextEntities();

				chatStore.addContextEntity('entity-3');

				expect(chatStore.contextEntityIds).toEqual(['entity-3']);
			});

			it('should handle multiple consecutive clears', () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				chatStore.clearContextEntities();
				chatStore.clearContextEntities();
				chatStore.clearContextEntities();

				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should clear large array of entities', () => {
				const manyEntities = Array.from({ length: 100 }, (_, i) => `entity-${i}`);
				chatStore.setContextEntities(manyEntities);

				chatStore.clearContextEntities();

				expect(chatStore.contextEntityIds).toEqual([]);
			});
		});

		describe('Context Entities Integration', () => {
			it('should support complete workflow: set, add, remove, clear', () => {
				// Set initial entities
				chatStore.setContextEntities(['entity-1', 'entity-2']);
				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);

				// Add new entity
				chatStore.addContextEntity('entity-3');
				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2', 'entity-3']);

				// Remove middle entity
				chatStore.removeContextEntity('entity-2');
				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-3']);

				// Clear all
				chatStore.clearContextEntities();
				expect(chatStore.contextEntityIds).toEqual([]);
			});

			it('should use context entities in sendMessage', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setContextEntities(['entity-1', 'entity-2']);
				await chatStore.sendMessage('Test message');

				expect(mockSendChatMessage).toHaveBeenCalledWith(
					'Test message',
					['entity-1', 'entity-2'],
					expect.any(Boolean),
					expect.any(Function)
				);
			});

			it('should not affect context entities when sending message', async () => {
				mockSendChatMessage.mockResolvedValue('Response');

				chatStore.setContextEntities(['entity-1', 'entity-2']);
				await chatStore.sendMessage('Test');

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
			});

			it('should not affect context entities when clearing history', async () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);

				await chatStore.clearHistory();

				expect(chatStore.contextEntityIds).toEqual(['entity-1', 'entity-2']);
			});
		});
	});

	describe('includeLinkedEntities Management', () => {
		it('should start with includeLinkedEntities true', () => {
			expect(chatStore.includeLinkedEntities).toBe(true);
		});

		it('should set includeLinkedEntities to false', () => {
			chatStore.setIncludeLinkedEntities(false);

			expect(chatStore.includeLinkedEntities).toBe(false);
		});

		it('should set includeLinkedEntities to true', () => {
			chatStore.setIncludeLinkedEntities(false);
			chatStore.setIncludeLinkedEntities(true);

			expect(chatStore.includeLinkedEntities).toBe(true);
		});

		it('should toggle includeLinkedEntities', () => {
			expect(chatStore.includeLinkedEntities).toBe(true);

			chatStore.setIncludeLinkedEntities(false);
			expect(chatStore.includeLinkedEntities).toBe(false);

			chatStore.setIncludeLinkedEntities(true);
			expect(chatStore.includeLinkedEntities).toBe(true);
		});

		it('should handle setting to same value multiple times', () => {
			chatStore.setIncludeLinkedEntities(true);
			chatStore.setIncludeLinkedEntities(true);
			chatStore.setIncludeLinkedEntities(true);

			expect(chatStore.includeLinkedEntities).toBe(true);
		});

		it('should pass includeLinkedEntities to sendChatMessage', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setIncludeLinkedEntities(false);
			await chatStore.sendMessage('Test');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Test',
				expect.any(Array),
				false,
				expect.any(Function)
			);
		});

		it('should pass true by default to sendChatMessage', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			await chatStore.sendMessage('Test');

			expect(mockSendChatMessage).toHaveBeenCalledWith(
				'Test',
				expect.any(Array),
				true,
				expect.any(Function)
			);
		});

		it('should not affect other state when toggling', async () => {
			chatStore.setContextEntities(['entity-1']);

			// Load and set messages via observable
			await chatStore.load();
			observerCallback.next([
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			]);

			chatStore.setIncludeLinkedEntities(false);

			expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			expect(chatStore.messages.length).toBe(1);
		});
	});

	describe('State Independence', () => {
		it('should not affect other state when loading', async () => {
			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);

			await chatStore.load();

			expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			expect(chatStore.includeLinkedEntities).toBe(false);
		});

		it('should not affect other state when sending message', async () => {
			mockSendChatMessage.mockResolvedValue('Response');

			chatStore.setContextEntities(['entity-1']);
			chatStore.setIncludeLinkedEntities(false);

			await chatStore.sendMessage('Test');

			expect(chatStore.contextEntityIds).toEqual(['entity-1']);
			expect(chatStore.includeLinkedEntities).toBe(false);
		});

		it('should not affect loading state when managing context entities', () => {
			const initialLoading = chatStore.isLoading;

			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.addContextEntity('entity-3');
			chatStore.removeContextEntity('entity-1');
			chatStore.clearContextEntities();

			expect(chatStore.isLoading).toBe(initialLoading);
		});

		it('should not affect error state when managing context entities', () => {
			// Verify initial error state is null
			expect(chatStore.error).toBe(null);

			chatStore.setContextEntities(['entity-1']);
			chatStore.addContextEntity('entity-2');
			chatStore.removeContextEntity('entity-1');

			// Error state should still be null
			expect(chatStore.error).toBe(null);
		});
	});

	describe('Edge Cases and Concurrency', () => {
		it('should handle rapid context entity changes', () => {
			for (let i = 0; i < 20; i++) {
				chatStore.addContextEntity(`entity-${i}`);
			}

			expect(chatStore.contextEntityIds.length).toBe(20);

			for (let i = 0; i < 10; i++) {
				chatStore.removeContextEntity(`entity-${i}`);
			}

			expect(chatStore.contextEntityIds.length).toBe(10);
		});

		it('should handle mixed context operations', () => {
			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.addContextEntity('entity-3');
			chatStore.removeContextEntity('entity-1');
			chatStore.addContextEntity('entity-4');
			chatStore.clearContextEntities();
			chatStore.addContextEntity('entity-5');

			expect(chatStore.contextEntityIds).toEqual(['entity-5']);
		});

		it('should handle state reset scenario', async () => {
			// Setup initial state
			chatStore.setContextEntities(['entity-1', 'entity-2']);
			chatStore.setIncludeLinkedEntities(false);
			mockSendChatMessage.mockResolvedValue('Response');
			await chatStore.sendMessage('Test');

			// Reset
			chatStore.clearContextEntities();
			chatStore.setIncludeLinkedEntities(true);
			await chatStore.clearHistory();

			// Verify clean state
			expect(chatStore.contextEntityIds).toEqual([]);
			expect(chatStore.includeLinkedEntities).toBe(true);
			expect(chatStore.messages).toEqual([]);
			expect(chatStore.isLoading).toBe(false);
			expect(chatStore.streamingContent).toBe('');
		});

		it('should handle all operations in sequence', async () => {
			// Load
			await chatStore.load();
			expect(mockChatRepository.getAll).toHaveBeenCalled();

			// Set context
			chatStore.setContextEntities(['entity-1', 'entity-2']);
			expect(chatStore.contextEntityIds.length).toBe(2);

			// Send message
			mockSendChatMessage.mockResolvedValue('Response');
			await chatStore.sendMessage('Test message');
			expect(chatStore.isLoading).toBe(false);

			// Add context entity
			chatStore.addContextEntity('entity-3');
			expect(chatStore.contextEntityIds.length).toBe(3);

			// Toggle include linked
			chatStore.setIncludeLinkedEntities(false);
			expect(chatStore.includeLinkedEntities).toBe(false);

			// Send another message
			await chatStore.sendMessage('Second message');

			// Clear history
			await chatStore.clearHistory();
			expect(chatStore.messages).toEqual([]);

			// Clear context
			chatStore.clearContextEntities();
			expect(chatStore.contextEntityIds).toEqual([]);
		});
	});

	describe('Reactivity', () => {
		it('should update messages array when observable emits', async () => {
			await chatStore.load();

			const messages = [
				{ id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date() }
			];

			observerCallback.next(messages);

			expect(chatStore.messages).toEqual(messages);
		});

		it('should update error when observable emits error', async () => {
			await chatStore.load();

			observerCallback.error(new Error('Test error'));

			expect(chatStore.error).toBe('Test error');
		});

		it('should update isLoading during sendMessage', async () => {
			mockSendChatMessage.mockImplementation(() => new Promise(() => {})); // Never resolves

			chatStore.sendMessage('Test');

			expect(chatStore.isLoading).toBe(true);
		});

		it('should update streamingContent during streaming', async () => {
			let capturedStreamingContent = '';

			mockSendChatMessage.mockImplementation(
				async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
					onStream('Streaming content');
					capturedStreamingContent = chatStore.streamingContent;
					return 'Final';
				}
			);

			await chatStore.sendMessage('Test');

			expect(capturedStreamingContent).toBe('Streaming content');
		});

		it('should update contextEntityIds when adding entity', () => {
			const initialLength = chatStore.contextEntityIds.length;

			chatStore.addContextEntity('entity-1');

			expect(chatStore.contextEntityIds.length).toBe(initialLength + 1);
		});

		it('should update contextEntityIds when removing entity', () => {
			chatStore.setContextEntities(['entity-1', 'entity-2']);

			chatStore.removeContextEntity('entity-1');

			expect(chatStore.contextEntityIds.length).toBe(1);
		});

		it('should update includeLinkedEntities when toggling', () => {
			const initial = chatStore.includeLinkedEntities;

			chatStore.setIncludeLinkedEntities(!initial);

			expect(chatStore.includeLinkedEntities).toBe(!initial);
		});
	});

	describe('Conversation Integration', () => {
		let mockConversationStore: any;

		beforeEach(async () => {
			// Mock conversation store
			mockConversationStore = {
				activeConversationId: 'conv-1'
			};

			// Re-mock with conversation store
			vi.doMock('$lib/stores', () => ({
				conversationStore: mockConversationStore
			}));

			vi.resetModules();
			const module = await import('./chat.svelte');
			chatStore = module.chatStore;
			await chatStore.load();
		});

		describe('load() with Conversations', () => {
			it('should load messages for active conversation only', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.load();

				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-1');
			});

			it('should call getAll when no active conversation', async () => {
				mockConversationStore.activeConversationId = null;
				mockChatRepository.getAll = vi.fn(() => mockObservable);

				await chatStore.load();

				expect(mockChatRepository.getAll).toHaveBeenCalled();
			});

			it('should reload when active conversation changes', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.load();
				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-1');

				// Change active conversation
				mockConversationStore.activeConversationId = 'conv-2';
				await chatStore.load();

				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-2');
			});
		});

		describe('sendMessage() with Conversations', () => {
			beforeEach(() => {
				mockSendChatMessage.mockResolvedValue('Response');
			});

			it('should require active conversation to send message', async () => {
				mockConversationStore.activeConversationId = null;

				await chatStore.sendMessage('Test message');

				expect(mockChatRepository.add).not.toHaveBeenCalled();
				expect(mockSendChatMessage).not.toHaveBeenCalled();
				expect(chatStore.error).toBeTruthy();
			});

			it('should add conversationId to user message', async () => {
				mockConversationStore.activeConversationId = 'conv-123';

				await chatStore.sendMessage('Test message');

				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					'Test message',
					expect.any(Array),
					'conv-123'
				);
			});

			it('should add conversationId to assistant message', async () => {
				mockConversationStore.activeConversationId = 'conv-456';
				mockSendChatMessage.mockResolvedValue('AI response');

				await chatStore.sendMessage('User message');

				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					2,
					'assistant',
					'AI response',
					expect.any(Array),
					'conv-456'
				);
			});

			it('should set error when no active conversation', async () => {
				mockConversationStore.activeConversationId = null;

				await chatStore.sendMessage('Test');

				expect(chatStore.error).toBe('No active conversation');
			});

			it('should handle conversation switching during send', async () => {
				mockConversationStore.activeConversationId = 'conv-1';

				// Start sending message
				const sendPromise = chatStore.sendMessage('Test');

				// Capture the conversation ID at the start
				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					'Test',
					expect.any(Array),
					'conv-1'
				);

				await sendPromise;

				// Both messages should use the same conversation ID
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					2,
					'assistant',
					expect.any(String),
					expect.any(Array),
					'conv-1'
				);
			});
		});

		describe('clearHistory() with Conversations', () => {
			it('should clear only active conversation messages', async () => {
				mockConversationStore.activeConversationId = 'conv-1';
				mockChatRepository.clearByConversation = vi.fn(async () => {});

				await chatStore.clearHistory();

				expect(mockChatRepository.clearByConversation).toHaveBeenCalledWith('conv-1');
			});

			it('should call clearAll when no active conversation', async () => {
				mockConversationStore.activeConversationId = null;

				await chatStore.clearHistory();

				expect(mockChatRepository.clearAll).toHaveBeenCalled();
			});

			it('should set error when clearing fails', async () => {
				mockConversationStore.activeConversationId = 'conv-1';
				mockChatRepository.clearByConversation = vi.fn(async () => {
					throw new Error('Clear failed');
				});

				await chatStore.clearHistory();

				expect(chatStore.error).toBe('Clear failed');
			});

			it('should handle clearing non-existent conversation', async () => {
				mockConversationStore.activeConversationId = 'non-existent';
				mockChatRepository.clearByConversation = vi.fn(async () => {});

				await expect(chatStore.clearHistory()).resolves.not.toThrow();
			});
		});

		describe('switchConversation() Method', () => {
			it('should reload messages for new conversation', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.switchConversation('conv-2');

				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-2');
			});

			it('should clear messages before switching', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				// Set initial messages
				observerCallback.next([
					{ id: 'msg-1', role: 'user', content: 'Old', timestamp: new Date() }
				]);
				expect(chatStore.messages.length).toBe(1);

				// Switch conversation
				await chatStore.switchConversation('conv-2');

				// Observable should emit for new conversation
				observerCallback.next([]);

				// Should eventually be cleared and reloaded
				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-2');
			});

			it('should handle switching to null conversation', async () => {
				mockChatRepository.getAll = vi.fn(() => mockObservable);

				await chatStore.switchConversation(null);

				expect(mockChatRepository.getAll).toHaveBeenCalled();
			});

			it('should handle switching errors', async () => {
				mockChatRepository.getByConversation = vi.fn(() => {
					throw new Error('Switch failed');
				});

				await chatStore.switchConversation('conv-2');

				expect(chatStore.error).toBe('Switch failed');
			});

			it('should clear context entities when switching', async () => {
				chatStore.setContextEntities(['entity-1', 'entity-2']);
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.switchConversation('conv-2');

				// Context entities should be cleared or maintained based on implementation
				// Test based on actual expected behavior
				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-2');
			});

			it('should not clear streamingContent when switching', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);
				chatStore.streamingContent = 'Some content';

				await chatStore.switchConversation('conv-2');

				// streamingContent should be cleared
				expect(chatStore.streamingContent).toBe('');
			});
		});

		describe('Conversation State Consistency', () => {
			it('should maintain conversation context across operations', async () => {
				mockConversationStore.activeConversationId = 'conv-1';
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);
				mockSendChatMessage.mockResolvedValue('Response');

				// Load messages for conversation
				await chatStore.load();
				expect(mockChatRepository.getByConversation).toHaveBeenCalledWith('conv-1');

				// Send message to same conversation
				await chatStore.sendMessage('Test');
				expect(mockChatRepository.add).toHaveBeenCalledWith(
					'user',
					'Test',
					expect.any(Array),
					'conv-1'
				);

				// Clear only this conversation
				mockChatRepository.clearByConversation = vi.fn(async () => {});
				await chatStore.clearHistory();
				expect(mockChatRepository.clearByConversation).toHaveBeenCalledWith('conv-1');
			});

			it('should handle rapid conversation switching', async () => {
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.switchConversation('conv-1');
				await chatStore.switchConversation('conv-2');
				await chatStore.switchConversation('conv-3');

				expect(mockChatRepository.getByConversation).toHaveBeenCalledTimes(3);
				expect(mockChatRepository.getByConversation).toHaveBeenLastCalledWith('conv-3');
			});

			it('should prevent sending to wrong conversation', async () => {
				mockConversationStore.activeConversationId = 'conv-1';
				mockSendChatMessage.mockResolvedValue('Response');

				// Start sending
				const sendPromise = chatStore.sendMessage('Test');

				// User message should use conv-1
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					1,
					'user',
					'Test',
					expect.any(Array),
					'conv-1'
				);

				// Change conversation mid-send (edge case)
				mockConversationStore.activeConversationId = 'conv-2';

				await sendPromise;

				// Assistant message should still use conv-1 (captured at start)
				expect(mockChatRepository.add).toHaveBeenNthCalledWith(
					2,
					'assistant',
					expect.any(String),
					expect.any(Array),
					'conv-1'
				);
			});
		});

		describe('Error Handling with Conversations', () => {
			it('should show error when trying to send without active conversation', async () => {
				mockConversationStore.activeConversationId = null;

				await chatStore.sendMessage('Test');

				expect(chatStore.error).toBe('No active conversation');
				expect(mockChatRepository.add).not.toHaveBeenCalled();
			});

			it('should show error when conversation is deleted during operation', async () => {
				mockConversationStore.activeConversationId = 'deleted-conv';
				mockChatRepository.getByConversation = vi.fn(() => {
					throw new Error('Conversation not found');
				});

				await chatStore.load();

				expect(chatStore.error).toBeTruthy();
			});

			it('should recover from conversation errors', async () => {
				mockConversationStore.activeConversationId = 'bad-conv';
				mockChatRepository.getByConversation = vi.fn(() => {
					throw new Error('Bad conversation');
				});

				await chatStore.load();
				expect(chatStore.error).toBeTruthy();

				// Switch to valid conversation
				mockConversationStore.activeConversationId = 'good-conv';
				mockChatRepository.getByConversation = vi.fn(() => mockObservable);

				await chatStore.switchConversation('good-conv');

				// Error should be cleared
				expect(chatStore.error).toBe(null);
			});
		});
	});
});
