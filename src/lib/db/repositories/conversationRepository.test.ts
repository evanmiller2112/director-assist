/**
 * Tests for Conversation Repository
 *
 * This repository manages conversations stored in IndexedDB, providing
 * functionality for storing, retrieving, and managing multiple conversation threads.
 *
 * Covers:
 * - Conversation creation (ID generation, timestamps, name handling)
 * - Live query observables (getAll, getAllWithMetadata)
 * - Conversation retrieval (getById, getWithMetadata)
 * - Updates (rename, timestamp updates)
 * - Deletion (with/without message cleanup)
 * - Metadata computation (message counts, last message time)
 * - Ordering (by updatedAt descending)
 * - Edge cases (empty state, default names, unicode)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { conversationRepository } from './conversationRepository';
import { db } from '../index';
import type { Conversation } from '$lib/types';

describe('ConversationRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear conversations and chat messages before each test
		await db.conversations.clear();
		await db.chatMessages.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.conversations.clear();
		await db.chatMessages.clear();
	});

	describe('create', () => {
		it('should create conversation with generated ID', async () => {
			const conversation = await conversationRepository.create();

			expect(conversation).toBeDefined();
			expect(conversation.id).toBeDefined();
			expect(conversation.id.length).toBeGreaterThan(0);
		});

		it('should generate unique IDs for each conversation', async () => {
			const conv1 = await conversationRepository.create();
			const conv2 = await conversationRepository.create();

			expect(conv1.id).not.toBe(conv2.id);
		});

		it('should set createdAt timestamp automatically', async () => {
			const before = new Date();
			const conversation = await conversationRepository.create();
			const after = new Date();

			expect(conversation.createdAt).toBeInstanceOf(Date);
			expect(conversation.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(conversation.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should set updatedAt timestamp automatically', async () => {
			const before = new Date();
			const conversation = await conversationRepository.create();
			const after = new Date();

			expect(conversation.updatedAt).toBeInstanceOf(Date);
			expect(conversation.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(conversation.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should set createdAt and updatedAt to same time initially', async () => {
			const conversation = await conversationRepository.create();

			expect(conversation.createdAt.getTime()).toBe(conversation.updatedAt.getTime());
		});

		it('should create conversation with provided name', async () => {
			const conversation = await conversationRepository.create('My Custom Conversation');

			expect(conversation.name).toBe('My Custom Conversation');
		});

		it('should generate default name when name not provided', async () => {
			const conversation = await conversationRepository.create();

			expect(conversation.name).toBeDefined();
			expect(conversation.name.length).toBeGreaterThan(0);
			expect(conversation.name).toMatch(/^New Conversation/);
		});

		it('should generate unique default names', async () => {
			const conv1 = await conversationRepository.create();
			const conv2 = await conversationRepository.create();

			// Both should have default names but they should be distinct
			expect(conv1.name).toMatch(/^New Conversation/);
			expect(conv2.name).toMatch(/^New Conversation/);
			// Default names should include timestamps or counters to be unique
			expect(conv1.name).not.toBe(conv2.name);
		});

		it('should persist conversation to database', async () => {
			const conversation = await conversationRepository.create('Test Conversation');

			const stored = await db.conversations.get(conversation.id);
			expect(stored).toBeDefined();
			expect(stored?.name).toBe('Test Conversation');
		});

		it('should handle empty string name', async () => {
			const conversation = await conversationRepository.create('');

			expect(conversation.name).toBe('');
			expect(conversation.id).toBeDefined();
		});

		it('should handle very long names', async () => {
			const longName = 'A'.repeat(500);
			const conversation = await conversationRepository.create(longName);

			expect(conversation.name).toBe(longName);
			expect(conversation.name.length).toBe(500);
		});

		it('should handle unicode characters in name', async () => {
			const unicodeName = 'Conversation 世界 🐉 ñ ü é';
			const conversation = await conversationRepository.create(unicodeName);

			expect(conversation.name).toBe(unicodeName);
		});

		it('should handle special characters in name', async () => {
			const specialName = 'Conversation <>&"\' with special chars';
			const conversation = await conversationRepository.create(specialName);

			expect(conversation.name).toBe(specialName);
		});

		it('should increment count after creating conversation', async () => {
			const countBefore = await db.conversations.count();
			await conversationRepository.create('Test');
			const countAfter = await db.conversations.count();

			expect(countAfter).toBe(countBefore + 1);
		});
	});

	describe('getAll', () => {
		it('should return observable', () => {
			const observable = conversationRepository.getAll();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return empty array when no conversations exist', async () => {
			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAll();

				const subscription = observable.subscribe((conversations) => {
					expect(conversations).toEqual([]);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return all conversations ordered by updatedAt descending', async () => {
			// Create conversations with specific timestamps
			const conv1: Conversation = {
				id: 'conv-1',
				name: 'First Conversation',
				createdAt: new Date('2024-01-15T10:00:00Z'),
				updatedAt: new Date('2024-01-15T10:00:00Z')
			};
			const conv2: Conversation = {
				id: 'conv-2',
				name: 'Second Conversation',
				createdAt: new Date('2024-01-15T11:00:00Z'),
				updatedAt: new Date('2024-01-15T12:00:00Z')
			};
			const conv3: Conversation = {
				id: 'conv-3',
				name: 'Third Conversation',
				createdAt: new Date('2024-01-15T09:00:00Z'),
				updatedAt: new Date('2024-01-15T14:00:00Z')
			};

			await db.conversations.bulkAdd([conv1, conv2, conv3]);

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAll();
				const subscription = observable.subscribe((conversations) => {
					expect(conversations).toHaveLength(3);
					// Most recently updated first
					expect(conversations[0].name).toBe('Third Conversation');
					expect(conversations[1].name).toBe('Second Conversation');
					expect(conversations[2].name).toBe('First Conversation');
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return conversations with all properties intact', async () => {
			const conv = await conversationRepository.create('Test Conversation');

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAll();
				const subscription = observable.subscribe((conversations) => {
					expect(conversations).toHaveLength(1);
					expect(conversations[0].id).toBe(conv.id);
					expect(conversations[0].name).toBe('Test Conversation');
					expect(conversations[0].createdAt).toBeInstanceOf(Date);
					expect(conversations[0].updatedAt).toBeInstanceOf(Date);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return updated results when conversations are added', async () => {
			const observable = conversationRepository.getAll();
			const results: Conversation[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((conversations) => {
					results.push(conversations);

					if (results.length === 1) {
						// First emission: empty
						expect(conversations).toHaveLength(0);
						// Add a conversation
						conversationRepository.create('New Conversation');
					} else if (results.length === 2) {
						// Second emission: after adding conversation
						expect(conversations).toHaveLength(1);
						expect(conversations[0].name).toBe('New Conversation');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should handle large number of conversations', async () => {
			// Add 50 conversations
			const conversations: Conversation[] = [];
			for (let i = 0; i < 50; i++) {
				conversations.push({
					id: `conv-${i}`,
					name: `Conversation ${i}`,
					createdAt: new Date(Date.now() + i * 1000),
					updatedAt: new Date(Date.now() + i * 1000)
				});
			}

			await db.conversations.bulkAdd(conversations);

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAll();
				const subscription = observable.subscribe((retrievedConversations) => {
					expect(retrievedConversations).toHaveLength(50);
					// Verify ordering (most recent first)
					for (let i = 0; i < 49; i++) {
						expect(retrievedConversations[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
							retrievedConversations[i + 1].updatedAt.getTime()
						);
					}
					subscription.unsubscribe();
					resolve();
				});
			});
		});
	});

	describe('getById', () => {
		it('should return conversation by ID', async () => {
			const created = await conversationRepository.create('Test Conversation');

			const retrieved = await conversationRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Test Conversation');
		});

		it('should return undefined for non-existent ID', async () => {
			const retrieved = await conversationRepository.getById('non-existent-id');

			expect(retrieved).toBeUndefined();
		});

		it('should return conversation with all properties', async () => {
			const created = await conversationRepository.create('Full Test');

			const retrieved = await conversationRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Full Test');
			expect(retrieved?.createdAt).toBeInstanceOf(Date);
			expect(retrieved?.updatedAt).toBeInstanceOf(Date);
		});

		it('should return correct conversation when multiple exist', async () => {
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');
			const conv3 = await conversationRepository.create('Conversation 3');

			const retrieved = await conversationRepository.getById(conv2.id);

			expect(retrieved?.id).toBe(conv2.id);
			expect(retrieved?.name).toBe('Conversation 2');
		});
	});

	describe('update', () => {
		it('should update conversation name', async () => {
			const conversation = await conversationRepository.create('Original Name');

			await conversationRepository.update(conversation.id, 'Updated Name');

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.name).toBe('Updated Name');
		});

		it('should update updatedAt timestamp', async () => {
			const conversation = await conversationRepository.create('Test');
			const originalUpdatedAt = conversation.updatedAt;

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			await conversationRepository.update(conversation.id, 'New Name');

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
		});

		it('should not change createdAt timestamp', async () => {
			const conversation = await conversationRepository.create('Test');
			const originalCreatedAt = conversation.createdAt;

			await new Promise((resolve) => setTimeout(resolve, 10));

			await conversationRepository.update(conversation.id, 'New Name');

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
		});

		it('should handle empty string name', async () => {
			const conversation = await conversationRepository.create('Original');

			await conversationRepository.update(conversation.id, '');

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.name).toBe('');
		});

		it('should handle unicode characters', async () => {
			const conversation = await conversationRepository.create('Original');

			await conversationRepository.update(conversation.id, '世界 🐉 ñ');

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.name).toBe('世界 🐉 ñ');
		});

		it('should handle very long names', async () => {
			const conversation = await conversationRepository.create('Original');
			const longName = 'B'.repeat(500);

			await conversationRepository.update(conversation.id, longName);

			const updated = await db.conversations.get(conversation.id);
			expect(updated?.name).toBe(longName);
		});

		it('should not affect other conversations', async () => {
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');

			await conversationRepository.update(conv1.id, 'Updated Conversation 1');

			const retrieved2 = await db.conversations.get(conv2.id);
			expect(retrieved2?.name).toBe('Conversation 2');
		});

		it('should throw or handle update of non-existent conversation', async () => {
			// Should either throw error or silently fail - test should verify behavior
			await expect(
				conversationRepository.update('non-existent-id', 'New Name')
			).rejects.toThrow();
		});
	});

	describe('delete', () => {
		it('should delete conversation', async () => {
			const conversation = await conversationRepository.create('Test');

			await conversationRepository.delete(conversation.id);

			const retrieved = await db.conversations.get(conversation.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not delete messages by default', async () => {
			const conversation = await conversationRepository.create('Test');
			// Add messages to this conversation
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: conversation.id,
				role: 'user',
				content: 'Test message',
				timestamp: new Date()
			});

			await conversationRepository.delete(conversation.id);

			const messages = await db.chatMessages.where('conversationId').equals(conversation.id).toArray();
			expect(messages).toHaveLength(1); // Messages should remain
		});

		it('should delete messages when deleteMessages is true', async () => {
			const conversation = await conversationRepository.create('Test');
			// Add messages to this conversation
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: conversation.id,
				role: 'user',
				content: 'Test message',
				timestamp: new Date()
			});

			await conversationRepository.delete(conversation.id, true);

			const messages = await db.chatMessages.where('conversationId').equals(conversation.id).toArray();
			expect(messages).toHaveLength(0); // Messages should be deleted
		});

		it('should only delete specified conversation', async () => {
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');

			await conversationRepository.delete(conv1.id);

			const retrieved1 = await db.conversations.get(conv1.id);
			const retrieved2 = await db.conversations.get(conv2.id);
			expect(retrieved1).toBeUndefined();
			expect(retrieved2).toBeDefined();
		});

		it('should only delete messages from specified conversation when deleteMessages is true', async () => {
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');

			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: conv1.id,
				role: 'user',
				content: 'Message 1',
				timestamp: new Date()
			});
			await db.chatMessages.add({
				id: 'msg-2',
				conversationId: conv2.id,
				role: 'user',
				content: 'Message 2',
				timestamp: new Date()
			});

			await conversationRepository.delete(conv1.id, true);

			const conv1Messages = await db.chatMessages.where('conversationId').equals(conv1.id).toArray();
			const conv2Messages = await db.chatMessages.where('conversationId').equals(conv2.id).toArray();
			expect(conv1Messages).toHaveLength(0);
			expect(conv2Messages).toHaveLength(1);
		});

		it('should not throw error when deleting non-existent conversation', async () => {
			await expect(conversationRepository.delete('non-existent-id')).resolves.not.toThrow();
		});

		it('should reduce count after deletion', async () => {
			const conv1 = await conversationRepository.create('Test 1');
			const conv2 = await conversationRepository.create('Test 2');

			let count = await db.conversations.count();
			expect(count).toBe(2);

			await conversationRepository.delete(conv1.id);

			count = await db.conversations.count();
			expect(count).toBe(1);
		});
	});

	describe('getWithMetadata', () => {
		it('should return conversation with message count', async () => {
			const conversation = await conversationRepository.create('Test');
			// Add messages
			await db.chatMessages.bulkAdd([
				{
					id: 'msg-1',
					conversationId: conversation.id,
					role: 'user',
					content: 'Message 1',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					conversationId: conversation.id,
					role: 'assistant',
					content: 'Message 2',
					timestamp: new Date()
				},
				{
					id: 'msg-3',
					conversationId: conversation.id,
					role: 'user',
					content: 'Message 3',
					timestamp: new Date()
				}
			]);

			const result = await conversationRepository.getWithMetadata(conversation.id);

			expect(result).toBeDefined();
			expect(result?.messageCount).toBe(3);
		});

		it('should return zero message count for conversation with no messages', async () => {
			const conversation = await conversationRepository.create('Empty');

			const result = await conversationRepository.getWithMetadata(conversation.id);

			expect(result).toBeDefined();
			expect(result?.messageCount).toBe(0);
		});

		it('should return last message time', async () => {
			const conversation = await conversationRepository.create('Test');
			const lastMessageTime = new Date('2024-01-15T14:00:00Z');
			await db.chatMessages.bulkAdd([
				{
					id: 'msg-1',
					conversationId: conversation.id,
					role: 'user',
					content: 'First',
					timestamp: new Date('2024-01-15T10:00:00Z')
				},
				{
					id: 'msg-2',
					conversationId: conversation.id,
					role: 'assistant',
					content: 'Last',
					timestamp: lastMessageTime
				}
			]);

			const result = await conversationRepository.getWithMetadata(conversation.id);

			expect(result).toBeDefined();
			expect(result?.lastMessageTime).toBeDefined();
			expect(result?.lastMessageTime?.getTime()).toBe(lastMessageTime.getTime());
		});

		it('should return undefined lastMessageTime when no messages', async () => {
			const conversation = await conversationRepository.create('Empty');

			const result = await conversationRepository.getWithMetadata(conversation.id);

			expect(result).toBeDefined();
			expect(result?.lastMessageTime).toBeUndefined();
		});

		it('should return undefined for non-existent conversation', async () => {
			const result = await conversationRepository.getWithMetadata('non-existent-id');

			expect(result).toBeUndefined();
		});

		it('should include all conversation properties', async () => {
			const conversation = await conversationRepository.create('Full Test');

			const result = await conversationRepository.getWithMetadata(conversation.id);

			expect(result).toBeDefined();
			expect(result?.id).toBe(conversation.id);
			expect(result?.name).toBe('Full Test');
			expect(result?.createdAt).toBeInstanceOf(Date);
			expect(result?.updatedAt).toBeInstanceOf(Date);
		});

		it('should only count messages from specified conversation', async () => {
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');

			await db.chatMessages.bulkAdd([
				{
					id: 'msg-1',
					conversationId: conv1.id,
					role: 'user',
					content: 'Conv1 Message 1',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					conversationId: conv1.id,
					role: 'assistant',
					content: 'Conv1 Message 2',
					timestamp: new Date()
				},
				{
					id: 'msg-3',
					conversationId: conv2.id,
					role: 'user',
					content: 'Conv2 Message 1',
					timestamp: new Date()
				}
			]);

			const result = await conversationRepository.getWithMetadata(conv1.id);

			expect(result?.messageCount).toBe(2);
		});
	});

	describe('getAllWithMetadata', () => {
		it('should return observable', () => {
			const observable = conversationRepository.getAllWithMetadata();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return empty array when no conversations exist', async () => {
			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAllWithMetadata();

				const subscription = observable.subscribe((conversations) => {
					expect(conversations).toEqual([]);
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return all conversations with metadata ordered by updatedAt descending', async () => {
			const conv1 = await conversationRepository.create('First');
			await new Promise((resolve) => setTimeout(resolve, 10));
			const conv2 = await conversationRepository.create('Second');

			// Add messages
			await db.chatMessages.bulkAdd([
				{
					id: 'msg-1',
					conversationId: conv1.id,
					role: 'user',
					content: 'Message',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					conversationId: conv2.id,
					role: 'user',
					content: 'Message',
					timestamp: new Date()
				},
				{
					id: 'msg-3',
					conversationId: conv2.id,
					role: 'assistant',
					content: 'Response',
					timestamp: new Date()
				}
			]);

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAllWithMetadata();
				const subscription = observable.subscribe((conversations) => {
					if (conversations.length === 2) {
						// Most recently updated first (conv2)
						expect(conversations[0].id).toBe(conv2.id);
						expect(conversations[0].messageCount).toBe(2);
						expect(conversations[1].id).toBe(conv1.id);
						expect(conversations[1].messageCount).toBe(1);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should include lastMessageTime for each conversation', async () => {
			const conv = await conversationRepository.create('Test');
			const messageTime = new Date('2024-01-15T12:00:00Z');
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: conv.id,
				role: 'user',
				content: 'Message',
				timestamp: messageTime
			});

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAllWithMetadata();
				const subscription = observable.subscribe((conversations) => {
					if (conversations.length === 1) {
						expect(conversations[0].lastMessageTime).toBeDefined();
						expect(conversations[0].lastMessageTime?.getTime()).toBe(messageTime.getTime());
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should handle conversations with no messages', async () => {
			await conversationRepository.create('Empty Conversation');

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAllWithMetadata();
				const subscription = observable.subscribe((conversations) => {
					if (conversations.length === 1) {
						expect(conversations[0].messageCount).toBe(0);
						expect(conversations[0].lastMessageTime).toBeUndefined();
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should update when conversations are added', async () => {
			const observable = conversationRepository.getAllWithMetadata();
			const results: any[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((conversations) => {
					results.push(conversations);

					if (results.length === 1) {
						// First emission: empty
						expect(conversations).toHaveLength(0);
						conversationRepository.create('New Conversation');
					} else if (results.length === 2) {
						// Second emission: after adding
						expect(conversations).toHaveLength(1);
						expect(conversations[0].name).toBe('New Conversation');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should update when messages are added to conversations', async () => {
			const conv = await conversationRepository.create('Test');

			const observable = conversationRepository.getAllWithMetadata();
			const results: any[][] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((conversations) => {
					results.push(conversations);

					if (results.length === 1) {
						// Initial: no messages
						expect(conversations[0].messageCount).toBe(0);
						// Add a message
						db.chatMessages.add({
							id: 'msg-1',
							conversationId: conv.id,
							role: 'user',
							content: 'New message',
							timestamp: new Date()
						});
					} else if (results.length === 2) {
						// After adding message
						expect(conversations[0].messageCount).toBe(1);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});

	describe('Edge Cases and Concurrency', () => {
		it('should handle rapid successive conversation creation', async () => {
			const promises = [];
			for (let i = 0; i < 10; i++) {
				promises.push(conversationRepository.create(`Rapid ${i}`));
			}

			await Promise.all(promises);

			const count = await db.conversations.count();
			expect(count).toBe(10);
		});

		it('should handle mixed operations', async () => {
			// Create
			const conv1 = await conversationRepository.create('Conversation 1');
			const conv2 = await conversationRepository.create('Conversation 2');

			// Update
			await conversationRepository.update(conv1.id, 'Updated 1');

			// Delete
			await conversationRepository.delete(conv2.id);

			// Create another
			await conversationRepository.create('Conversation 3');

			const count = await db.conversations.count();
			expect(count).toBe(2);
		});

		it('should handle timestamp edge cases', async () => {
			const veryOldDate = new Date('1970-01-01T00:00:00Z');
			const veryNewDate = new Date('2099-12-31T23:59:59Z');

			const conversations: Conversation[] = [
				{
					id: 'conv-old',
					name: 'Old Conversation',
					createdAt: veryOldDate,
					updatedAt: veryOldDate
				},
				{
					id: 'conv-new',
					name: 'New Conversation',
					createdAt: veryNewDate,
					updatedAt: veryNewDate
				}
			];

			await db.conversations.bulkAdd(conversations);

			return new Promise<void>((resolve) => {
				const observable = conversationRepository.getAll();
				const subscription = observable.subscribe((convs) => {
					if (convs.length === 2) {
						expect(convs[0].name).toBe('New Conversation'); // Most recent first
						expect(convs[1].name).toBe('Old Conversation');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});
});
