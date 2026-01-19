/**
 * Tests for Chat Repository
 *
 * This repository manages chat messages stored in IndexedDB, providing
 * functionality for storing, retrieving, and managing conversation history.
 *
 * Covers:
 * - Live query observables (getAll, getRecent)
 * - Message ordering (by timestamp, ascending/descending)
 * - Message creation (user/assistant, auto-ID, auto-timestamp)
 * - Context entity tracking (optional contextEntities field)
 * - Bulk operations (bulkAdd with ID preservation, clearAll)
 * - Limit behavior (getRecent default and custom limits)
 * - Edge cases (empty state, unicode, long content, special characters)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { chatRepository } from './chatRepository';
import { db } from '../index';
import type { ChatMessage } from '$lib/types';

describe('ChatRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear chat messages table before each test
		await db.chatMessages.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.chatMessages.clear();
	});

	describe('add', () => {
		it('should add user message', async () => {
			const message = await chatRepository.add('user', 'Hello, assistant!');

			expect(message).toBeDefined();
			expect(message.role).toBe('user');
			expect(message.content).toBe('Hello, assistant!');
			expect(message.id).toBeDefined();
			expect(message.id.length).toBeGreaterThan(0);
			expect(message.timestamp).toBeInstanceOf(Date);
		});

		it('should add assistant message', async () => {
			const message = await chatRepository.add('assistant', 'Hello, user!');

			expect(message).toBeDefined();
			expect(message.role).toBe('assistant');
			expect(message.content).toBe('Hello, user!');
			expect(message.id).toBeDefined();
			expect(message.timestamp).toBeInstanceOf(Date);
		});

		it('should generate unique id for each message', async () => {
			const message1 = await chatRepository.add('user', 'Message 1');
			const message2 = await chatRepository.add('user', 'Message 2');

			expect(message1.id).not.toBe(message2.id);
		});

		it('should set timestamp automatically', async () => {
			const before = new Date();
			const message = await chatRepository.add('user', 'Test message');
			const after = new Date();

			expect(message.timestamp).toBeInstanceOf(Date);
			expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(message.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should handle optional contextEntities', async () => {
			const message = await chatRepository.add(
				'user',
				'Tell me about the dragon',
				['entity-1', 'entity-2']
			);

			expect(message.contextEntities).toBeDefined();
			expect(message.contextEntities).toEqual(['entity-1', 'entity-2']);
		});

		it('should add message without contextEntities when not provided', async () => {
			const message = await chatRepository.add('user', 'Simple message');

			expect(message.contextEntities).toBeUndefined();
		});

		it('should handle empty contextEntities array', async () => {
			const message = await chatRepository.add('user', 'Message with empty context', []);

			expect(message.contextEntities).toEqual([]);
		});

		it('should persist message to database', async () => {
			const message = await chatRepository.add('user', 'Persist test');

			const stored = await db.chatMessages.get(message.id);
			expect(stored).toBeDefined();
			expect(stored?.content).toBe('Persist test');
			expect(stored?.role).toBe('user');
		});

		it('should handle empty string content', async () => {
			const message = await chatRepository.add('user', '');

			expect(message.content).toBe('');
			expect(message.id).toBeDefined();
		});

		it('should handle very long content', async () => {
			const longContent = 'A'.repeat(50000); // 50k characters
			const message = await chatRepository.add('user', longContent);

			expect(message.content).toBe(longContent);
			expect(message.content.length).toBe(50000);
		});

		it('should handle unicode characters in content', async () => {
			const unicodeContent = 'Hello 世界 🐉 ñ ü é';
			const message = await chatRepository.add('user', unicodeContent);

			expect(message.content).toBe(unicodeContent);
		});

		it('should handle newlines and special characters in content', async () => {
			const specialContent = 'Line 1\nLine 2\tTabbed\r\nWindows line';
			const message = await chatRepository.add('user', specialContent);

			expect(message.content).toBe(specialContent);
		});

		it('should handle markdown in content', async () => {
			const markdownContent = '# Heading\n\n**Bold** and *italic*\n\n- List item';
			const message = await chatRepository.add('assistant', markdownContent);

			expect(message.content).toBe(markdownContent);
		});

		it('should handle code blocks in content', async () => {
			const codeContent = '```typescript\nconst x = 42;\n```';
			const message = await chatRepository.add('assistant', codeContent);

			expect(message.content).toBe(codeContent);
		});

		it('should handle JSON in content', async () => {
			const jsonContent = JSON.stringify({ key: 'value', nested: { data: true } });
			const message = await chatRepository.add('assistant', jsonContent);

			expect(message.content).toBe(jsonContent);
		});

		it('should handle multiple contextEntities', async () => {
			const entities = ['entity-1', 'entity-2', 'entity-3', 'entity-4', 'entity-5'];
			const message = await chatRepository.add('user', 'Multi-entity message', entities);

			expect(message.contextEntities).toEqual(entities);
		});

		it('should handle special characters in contextEntities', async () => {
			const entities = ['entity-with-dashes', 'entity_with_underscores', 'entity:with:colons'];
			const message = await chatRepository.add('user', 'Test', entities);

			expect(message.contextEntities).toEqual(entities);
		});

		it('should increment count after adding message', async () => {
			const countBefore = await db.chatMessages.count();
			await chatRepository.add('user', 'Test');
			const countAfter = await db.chatMessages.count();

			expect(countAfter).toBe(countBefore + 1);
		});

		it('should maintain correct order when adding multiple messages', async () => {
			const message1 = await chatRepository.add('user', 'First');
			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 5));
			const message2 = await chatRepository.add('assistant', 'Second');
			await new Promise((resolve) => setTimeout(resolve, 5));
			const message3 = await chatRepository.add('user', 'Third');

			expect(message2.timestamp.getTime()).toBeGreaterThan(message1.timestamp.getTime());
			expect(message3.timestamp.getTime()).toBeGreaterThan(message2.timestamp.getTime());
		});
	});

	describe('getAll', () => {
		it('should return observable', () => {
			const observable = chatRepository.getAll();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return empty array when no messages exist', async () => {
			return new Promise<void>((resolve) => {
				const observable = chatRepository.getAll();

				const subscription = observable.subscribe((messages) => {
					expect(messages).toEqual([]);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return all messages ordered by timestamp ascending', async () => {
			// Add messages with specific timestamps
			const message1: ChatMessage = {
				id: 'msg-1',
				role: 'user',
				content: 'First message',
				timestamp: new Date('2024-01-15T10:00:00Z')
			};
			const message2: ChatMessage = {
				id: 'msg-2',
				role: 'assistant',
				content: 'Second message',
				timestamp: new Date('2024-01-15T11:00:00Z')
			};
			const message3: ChatMessage = {
				id: 'msg-3',
				role: 'user',
				content: 'Third message',
				timestamp: new Date('2024-01-15T12:00:00Z')
			};

			await db.chatMessages.bulkAdd([message3, message1, message2]); // Add out of order

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getAll();
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(3);
					expect(messages[0].content).toBe('First message');
					expect(messages[1].content).toBe('Second message');
					expect(messages[2].content).toBe('Third message');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return messages with all properties intact', async () => {
			const message = await chatRepository.add(
				'user',
				'Test message',
				['entity-1', 'entity-2']
			);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getAll();
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(1);
					expect(messages[0].id).toBe(message.id);
					expect(messages[0].role).toBe('user');
					expect(messages[0].content).toBe('Test message');
					expect(messages[0].timestamp).toBeInstanceOf(Date);
					expect(messages[0].contextEntities).toEqual(['entity-1', 'entity-2']);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return updated results when messages are added', async () => {
			const observable = chatRepository.getAll();
			const results: ChatMessage[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((messages) => {
					results.push(messages);

					if (results.length === 1) {
						// First emission: empty
						expect(messages).toHaveLength(0);
						// Add a message
						chatRepository.add('user', 'New message');
					} else if (results.length === 2) {
						// Second emission: after adding message
						expect(messages).toHaveLength(1);
						expect(messages[0].content).toBe('New message');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should handle large number of messages', async () => {
			// Add 100 messages
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 100; i++) {
				messages.push({
					id: `msg-${i}`,
					role: i % 2 === 0 ? 'user' : 'assistant',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000) // 1 second apart
				});
			}

			await db.chatMessages.bulkAdd(messages);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getAll();
				const subscription = observable.subscribe((retrievedMessages) => {
					expect(retrievedMessages).toHaveLength(100);
					// Verify ordering
					for (let i = 0; i < 99; i++) {
						expect(retrievedMessages[i].timestamp.getTime()).toBeLessThanOrEqual(
							retrievedMessages[i + 1].timestamp.getTime()
						);
					}
					subscription.unsubscribe();
					resolve();
				});
			});
		});
	});

	describe('getRecent', () => {
		it('should return observable', () => {
			const observable = chatRepository.getRecent();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return empty array when no messages exist', async () => {
			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent();

				const subscription = observable.subscribe((messages) => {
					expect(messages).toEqual([]);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should default to 50 messages limit', async () => {
			// Add 60 messages
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 60; i++) {
				messages.push({
					id: `msg-${i}`,
					role: 'user',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000)
				});
			}

			await db.chatMessages.bulkAdd(messages);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(); // No limit specified
				const subscription = observable.subscribe((retrievedMessages) => {
					expect(retrievedMessages).toHaveLength(50); // Should return default 50
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return most recent messages up to limit', async () => {
			// Add 20 messages
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 20; i++) {
				messages.push({
					id: `msg-${i}`,
					role: 'user',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000)
				});
			}

			await db.chatMessages.bulkAdd(messages);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(10);
				const subscription = observable.subscribe((retrievedMessages) => {
					expect(retrievedMessages).toHaveLength(10);
					// Should return messages 10-19 (most recent)
					expect(retrievedMessages[0].content).toContain('19'); // Most recent first
					expect(retrievedMessages[9].content).toContain('10');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should order by timestamp descending', async () => {
			const message1: ChatMessage = {
				id: 'msg-1',
				role: 'user',
				content: 'First message',
				timestamp: new Date('2024-01-15T10:00:00Z')
			};
			const message2: ChatMessage = {
				id: 'msg-2',
				role: 'assistant',
				content: 'Second message',
				timestamp: new Date('2024-01-15T11:00:00Z')
			};
			const message3: ChatMessage = {
				id: 'msg-3',
				role: 'user',
				content: 'Third message',
				timestamp: new Date('2024-01-15T12:00:00Z')
			};

			await db.chatMessages.bulkAdd([message1, message2, message3]);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(10);
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(3);
					expect(messages[0].content).toBe('Third message'); // Most recent first
					expect(messages[1].content).toBe('Second message');
					expect(messages[2].content).toBe('First message');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return all messages when limit exceeds total count', async () => {
			await chatRepository.add('user', 'Message 1');
			await chatRepository.add('assistant', 'Message 2');
			await chatRepository.add('user', 'Message 3');

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(100); // Limit > actual count
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(3);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return single message when limit is 1', async () => {
			await chatRepository.add('user', 'Oldest');
			await new Promise((resolve) => setTimeout(resolve, 5));
			await chatRepository.add('user', 'Middle');
			await new Promise((resolve) => setTimeout(resolve, 5));
			await chatRepository.add('user', 'Newest');

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(1);
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(1);
					expect(messages[0].content).toBe('Newest');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should handle limit of 0', async () => {
			await chatRepository.add('user', 'Test message');

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(0);
				const subscription = observable.subscribe((messages) => {
					expect(messages).toHaveLength(0);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should include contextEntities in returned messages', async () => {
			await chatRepository.add('user', 'Message 1', ['entity-1']);
			// Small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 5));
			await chatRepository.add('user', 'Message 2', ['entity-2', 'entity-3']);

			// Wait a bit for IndexedDB to commit
			await new Promise((resolve) => setTimeout(resolve, 10));

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getRecent(10);
				const subscription = observable.subscribe((messages) => {
					if (messages.length === 2) {
						expect(messages[0].contextEntities).toEqual(['entity-2', 'entity-3']); // Most recent
						expect(messages[1].contextEntities).toEqual(['entity-1']);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should return updated results when messages are added', async () => {
			await chatRepository.add('user', 'Initial message');

			const observable = chatRepository.getRecent(10);
			const results: ChatMessage[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((messages) => {
					results.push(messages);

					if (results.length === 1) {
						// First emission: one message
						expect(messages).toHaveLength(1);
						// Add another message
						chatRepository.add('assistant', 'New message');
					} else if (results.length === 2) {
						// Second emission: after adding message
						expect(messages).toHaveLength(2);
						expect(messages[0].content).toBe('New message'); // Most recent first
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});

	describe('clearAll', () => {
		it('should remove all messages', async () => {
			await chatRepository.add('user', 'Message 1');
			await chatRepository.add('assistant', 'Message 2');
			await chatRepository.add('user', 'Message 3');

			await chatRepository.clearAll();

			const count = await db.chatMessages.count();
			expect(count).toBe(0);
		});

		it('should not throw error when clearing empty table', async () => {
			await expect(chatRepository.clearAll()).resolves.not.toThrow();
		});

		it('should allow adding messages after clearing', async () => {
			await chatRepository.add('user', 'Before clear');
			await chatRepository.clearAll();
			await chatRepository.add('user', 'After clear');

			const count = await db.chatMessages.count();
			expect(count).toBe(1);
		});

		it('should not affect other database tables', async () => {
			await chatRepository.add('user', 'Test message');
			await chatRepository.clearAll();

			// Verify chat messages cleared
			const chatCount = await db.chatMessages.count();
			expect(chatCount).toBe(0);

			// Verify other tables still accessible
			expect(db.entities).toBeDefined();
			expect(db.campaign).toBeDefined();
			expect(db.appConfig).toBeDefined();
		});

		it('should clear large number of messages', async () => {
			// Add 100 messages
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 100; i++) {
				messages.push({
					id: `msg-${i}`,
					role: 'user',
					content: `Message ${i}`,
					timestamp: new Date()
				});
			}

			await db.chatMessages.bulkAdd(messages);

			const countBefore = await db.chatMessages.count();
			expect(countBefore).toBe(100);

			await chatRepository.clearAll();

			const countAfter = await db.chatMessages.count();
			expect(countAfter).toBe(0);
		});

		it('should clear messages with contextEntities', async () => {
			await chatRepository.add('user', 'Message 1', ['entity-1', 'entity-2']);
			await chatRepository.add('user', 'Message 2', ['entity-3']);

			await chatRepository.clearAll();

			const count = await db.chatMessages.count();
			expect(count).toBe(0);
		});

		it('should trigger observable updates after clearing', async () => {
			await chatRepository.add('user', 'Message 1');
			await chatRepository.add('user', 'Message 2');

			const observable = chatRepository.getAll();
			const results: ChatMessage[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((messages) => {
					results.push(messages);

					if (results.length === 1) {
						// First emission: two messages
						expect(messages).toHaveLength(2);
						// Clear all messages
						chatRepository.clearAll();
					} else if (results.length === 2) {
						// Second emission: after clearing
						expect(messages).toHaveLength(0);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});

	describe('bulkAdd', () => {
		it('should add multiple messages at once', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Message 1',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Message 2',
					timestamp: new Date()
				},
				{
					id: 'msg-3',
					role: 'user',
					content: 'Message 3',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const count = await db.chatMessages.count();
			expect(count).toBe(3);
		});

		it('should preserve message ids', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'custom-id-1',
					role: 'user',
					content: 'Message 1',
					timestamp: new Date()
				},
				{
					id: 'custom-id-2',
					role: 'assistant',
					content: 'Message 2',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const retrieved1 = await db.chatMessages.get('custom-id-1');
			const retrieved2 = await db.chatMessages.get('custom-id-2');

			expect(retrieved1).toBeDefined();
			expect(retrieved1?.content).toBe('Message 1');
			expect(retrieved2).toBeDefined();
			expect(retrieved2?.content).toBe('Message 2');
		});

		it('should preserve timestamps', async () => {
			const timestamp1 = new Date('2024-01-15T10:00:00Z');
			const timestamp2 = new Date('2024-01-15T11:00:00Z');

			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Message 1',
					timestamp: timestamp1
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Message 2',
					timestamp: timestamp2
				}
			];

			await chatRepository.bulkAdd(messages);

			const retrieved1 = await db.chatMessages.get('msg-1');
			const retrieved2 = await db.chatMessages.get('msg-2');

			expect(retrieved1?.timestamp.getTime()).toBe(timestamp1.getTime());
			expect(retrieved2?.timestamp.getTime()).toBe(timestamp2.getTime());
		});

		it('should preserve contextEntities', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Message 1',
					timestamp: new Date(),
					contextEntities: ['entity-1', 'entity-2']
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Message 2',
					timestamp: new Date(),
					contextEntities: ['entity-3']
				}
			];

			await chatRepository.bulkAdd(messages);

			const retrieved1 = await db.chatMessages.get('msg-1');
			const retrieved2 = await db.chatMessages.get('msg-2');

			expect(retrieved1?.contextEntities).toEqual(['entity-1', 'entity-2']);
			expect(retrieved2?.contextEntities).toEqual(['entity-3']);
		});

		it('should handle empty array', async () => {
			await expect(chatRepository.bulkAdd([])).resolves.not.toThrow();

			const count = await db.chatMessages.count();
			expect(count).toBe(0);
		});

		it('should handle single message', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Single message',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const count = await db.chatMessages.count();
			expect(count).toBe(1);
		});

		it('should handle large bulk import', async () => {
			// Create 100 messages
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 100; i++) {
				messages.push({
					id: `msg-${i}`,
					role: i % 2 === 0 ? 'user' : 'assistant',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000)
				});
			}

			await chatRepository.bulkAdd(messages);

			const count = await db.chatMessages.count();
			expect(count).toBe(100);
		});

		it('should handle messages with unicode content', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Hello 世界 🐉',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Bonjour ñ ü é',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const retrieved1 = await db.chatMessages.get('msg-1');
			const retrieved2 = await db.chatMessages.get('msg-2');

			expect(retrieved1?.content).toContain('世界');
			expect(retrieved2?.content).toContain('ñ');
		});

		it('should not overwrite existing messages with different IDs', async () => {
			await chatRepository.add('user', 'Existing message');

			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Bulk message 1',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'user',
					content: 'Bulk message 2',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const count = await db.chatMessages.count();
			expect(count).toBe(3); // 1 existing + 2 bulk added
		});

		it('should trigger observable updates after bulk add', async () => {
			const observable = chatRepository.getAll();
			const results: ChatMessage[][] = [];

			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Message 1',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Message 2',
					timestamp: new Date()
				}
			];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((msgs) => {
					results.push(msgs);

					if (results.length === 1) {
						// First emission: empty
						expect(msgs).toHaveLength(0);
						// Bulk add messages
						chatRepository.bulkAdd(messages);
					} else if (results.length === 2) {
						// Second emission: after bulk add
						expect(msgs).toHaveLength(2);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});

	describe('Edge Cases and Concurrency', () => {
		it('should handle rapid successive additions', async () => {
			const promises = [];
			for (let i = 0; i < 10; i++) {
				promises.push(chatRepository.add('user', `Rapid message ${i}`));
			}

			await Promise.all(promises);

			const count = await db.chatMessages.count();
			expect(count).toBe(10);
		});

		it('should handle mixed operations', async () => {
			// Add initial messages
			await chatRepository.add('user', 'Message 1');
			await chatRepository.add('assistant', 'Message 2');

			// Bulk add
			await chatRepository.bulkAdd([
				{
					id: 'bulk-1',
					role: 'user',
					content: 'Bulk message',
					timestamp: new Date()
				}
			]);

			// Add another message
			await chatRepository.add('user', 'Message 3');

			const count = await db.chatMessages.count();
			expect(count).toBe(4);
		});

		it('should handle very long entity IDs in contextEntities', async () => {
			const longId = 'entity-' + 'x'.repeat(1000);
			const message = await chatRepository.add('user', 'Test message', [longId]);

			expect(message.contextEntities).toEqual([longId]);
		});

		it('should handle timestamp edge cases', async () => {
			const veryOldDate = new Date('1970-01-01T00:00:00Z');
			const veryNewDate = new Date('2099-12-31T23:59:59Z');

			const messages: ChatMessage[] = [
				{
					id: 'msg-old',
					role: 'user',
					content: 'Old message',
					timestamp: veryOldDate
				},
				{
					id: 'msg-new',
					role: 'user',
					content: 'New message',
					timestamp: veryNewDate
				}
			];

			await chatRepository.bulkAdd(messages);

			return new Promise<void>((resolve) => {
				const observable = chatRepository.getAll();
				const subscription = observable.subscribe((msgs) => {
					expect(msgs).toHaveLength(2);
					expect(msgs[0].content).toBe('Old message'); // Older first in ascending order
					expect(msgs[1].content).toBe('New message');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should handle messages without contextEntities in bulkAdd', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Message without context',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const retrieved = await db.chatMessages.get('msg-1');
			expect(retrieved?.contextEntities).toBeUndefined();
		});

		it('should throw error on duplicate IDs in bulkAdd', async () => {
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Original content',
					timestamp: new Date()
				}
			];

			await chatRepository.bulkAdd(messages);

			const duplicateMessages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'assistant',
					content: 'Duplicate content',
					timestamp: new Date()
				}
			];

			// bulkAdd with same ID should throw constraint error
			await expect(chatRepository.bulkAdd(duplicateMessages)).rejects.toThrow();

			// Original message should still exist unchanged
			const count = await db.chatMessages.count();
			expect(count).toBe(1);

			const retrieved = await db.chatMessages.get('msg-1');
			expect(retrieved?.content).toBe('Original content');
			expect(retrieved?.role).toBe('user');
		});

		it('should preserve message integrity through multiple operations', async () => {
			// Add initial message
			const message1 = await chatRepository.add('user', 'Initial', ['entity-1']);

			// Clear and add new messages
			await chatRepository.clearAll();
			await chatRepository.add('assistant', 'After clear');

			// Bulk add
			await chatRepository.bulkAdd([
				{
					id: 'bulk-msg',
					role: 'user',
					content: 'Bulk message',
					timestamp: new Date(),
					contextEntities: ['entity-2', 'entity-3']
				}
			]);

			// Verify final state
			const all = await db.chatMessages.toArray();
			expect(all).toHaveLength(2);
			expect(all.find((m) => m.id === 'bulk-msg')?.contextEntities).toEqual([
				'entity-2',
				'entity-3'
			]);
		});
	});
});
