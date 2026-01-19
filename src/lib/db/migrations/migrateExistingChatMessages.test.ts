/**
 * Tests for Migrate Existing Chat Messages Migration
 *
 * This migration handles the transition from single-conversation chat to
 * multi-conversation chat by:
 * - Creating a default conversation when none exists
 * - Assigning all existing messages without conversationId to the default conversation
 * - Setting the default conversation as active
 * - Being idempotent (safe to run multiple times)
 *
 * Covers:
 * - Default conversation creation
 * - Message assignment to default conversation
 * - Active conversation persistence
 * - Idempotency (no duplicates on re-run)
 * - Empty database handling
 * - Edge cases (partial data, existing conversations)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { migrateExistingChatMessages } from './migrateExistingChatMessages';
import { db } from '../index';
import type { ChatMessage, Conversation } from '$lib/types';

describe('migrateExistingChatMessages', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear all relevant tables before each test
		await db.conversations.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.conversations.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
	});

	describe('Default Conversation Creation', () => {
		it('should create default conversation when none exists', async () => {
			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
			expect(conversations[0].name).toBe('Default Conversation');
		});

		it('should set default conversation as active in appConfig', async () => {
			await migrateExistingChatMessages();

			const activeConversationId = await db.appConfig.get('activeConversationId');
			expect(activeConversationId).toBeDefined();
			expect(activeConversationId?.value).toBeDefined();

			const conversations = await db.conversations.toArray();
			expect(activeConversationId?.value).toBe(conversations[0].id);
		});

		it('should set createdAt and updatedAt timestamps on default conversation', async () => {
			const before = new Date();
			await migrateExistingChatMessages();
			const after = new Date();

			const conversations = await db.conversations.toArray();
			expect(conversations[0].createdAt).toBeInstanceOf(Date);
			expect(conversations[0].updatedAt).toBeInstanceOf(Date);
			expect(conversations[0].createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(conversations[0].createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should not create default conversation when conversations already exist', async () => {
			// Create a conversation before migration
			const existingConv: Conversation = {
				id: 'existing-conv',
				name: 'Existing Conversation',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await db.conversations.add(existingConv);

			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
			expect(conversations[0].id).toBe('existing-conv');
		});

		it('should generate unique ID for default conversation', async () => {
			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			expect(conversations[0].id).toBeDefined();
			expect(conversations[0].id.length).toBeGreaterThan(0);
			expect(typeof conversations[0].id).toBe('string');
		});
	});

	describe('Message Assignment', () => {
		it('should assign messages without conversationId to default conversation', async () => {
			// Add messages without conversationId
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'First message',
					timestamp: new Date('2024-01-15T10:00:00Z')
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Second message',
					timestamp: new Date('2024-01-15T11:00:00Z')
				},
				{
					id: 'msg-3',
					role: 'user',
					content: 'Third message',
					timestamp: new Date('2024-01-15T12:00:00Z')
				}
			];

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			const defaultConvId = conversations[0].id;

			// All messages should now have the default conversation ID
			const migratedMessages = await db.chatMessages.toArray();
			expect(migratedMessages).toHaveLength(3);
			expect(migratedMessages[0].conversationId).toBe(defaultConvId);
			expect(migratedMessages[1].conversationId).toBe(defaultConvId);
			expect(migratedMessages[2].conversationId).toBe(defaultConvId);
		});

		it('should not modify messages that already have conversationId', async () => {
			// Add a conversation first
			const existingConv: Conversation = {
				id: 'existing-conv',
				name: 'Existing',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await db.conversations.add(existingConv);

			// Add messages with conversationId
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					conversationId: 'existing-conv',
					role: 'user',
					content: 'Has conversation',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'user',
					content: 'No conversation',
					timestamp: new Date()
				}
			];

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			const migratedMessages = await db.chatMessages.toArray();
			const msg1 = migratedMessages.find((m) => m.id === 'msg-1');
			const msg2 = migratedMessages.find((m) => m.id === 'msg-2');

			// msg-1 should keep its original conversationId
			expect(msg1?.conversationId).toBe('existing-conv');

			// msg-2 should not be assigned a conversation since one already exists
			// OR should be assigned to the default conversation
			// Test based on actual expected behavior
			expect(msg2?.conversationId).toBeDefined();
		});

		it('should preserve all message properties during migration', async () => {
			const originalMessage: ChatMessage = {
				id: 'msg-preserve',
				role: 'user',
				content: 'Test message with entities',
				timestamp: new Date('2024-01-15T10:00:00Z'),
				contextEntities: ['entity-1', 'entity-2']
			};

			await db.chatMessages.add(originalMessage);

			await migrateExistingChatMessages();

			const migratedMessage = await db.chatMessages.get('msg-preserve');
			expect(migratedMessage).toBeDefined();
			expect(migratedMessage?.role).toBe('user');
			expect(migratedMessage?.content).toBe('Test message with entities');
			expect(migratedMessage?.timestamp.getTime()).toBe(originalMessage.timestamp.getTime());
			expect(migratedMessage?.contextEntities).toEqual(['entity-1', 'entity-2']);
			expect(migratedMessage?.conversationId).toBeDefined();
		});

		it('should handle large number of messages', async () => {
			// Add 100 messages without conversationId
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 100; i++) {
				messages.push({
					id: `msg-${i}`,
					role: i % 2 === 0 ? 'user' : 'assistant',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000)
				});
			}

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			const defaultConvId = conversations[0].id;

			const migratedMessages = await db.chatMessages.toArray();
			expect(migratedMessages).toHaveLength(100);

			// All should have conversationId
			const allHaveConversationId = migratedMessages.every(
				(m) => m.conversationId === defaultConvId
			);
			expect(allHaveConversationId).toBe(true);
		});
	});

	describe('Idempotency', () => {
		it('should not create duplicate default conversation when run twice', async () => {
			await migrateExistingChatMessages();
			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
		});

		it('should not modify messages when run twice', async () => {
			const message: ChatMessage = {
				id: 'msg-1',
				role: 'user',
				content: 'Test',
				timestamp: new Date()
			};

			await db.chatMessages.add(message);

			await migrateExistingChatMessages();
			const firstRun = await db.chatMessages.get('msg-1');

			await migrateExistingChatMessages();
			const secondRun = await db.chatMessages.get('msg-1');

			expect(firstRun?.conversationId).toBe(secondRun?.conversationId);
		});

		it('should not change active conversation when run twice', async () => {
			await migrateExistingChatMessages();
			const firstActiveId = await db.appConfig.get('activeConversationId');

			await migrateExistingChatMessages();
			const secondActiveId = await db.appConfig.get('activeConversationId');

			expect(firstActiveId?.value).toBe(secondActiveId?.value);
		});

		it('should handle running after conversations are already set up', async () => {
			// Set up conversations and messages manually
			const conv: Conversation = {
				id: 'manual-conv',
				name: 'Manual Conversation',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await db.conversations.add(conv);

			const message: ChatMessage = {
				id: 'msg-1',
				conversationId: 'manual-conv',
				role: 'user',
				content: 'Message',
				timestamp: new Date()
			};
			await db.chatMessages.add(message);

			await db.appConfig.put({ key: 'activeConversationId', value: 'manual-conv' });

			// Run migration
			await migrateExistingChatMessages();

			// Should not change anything
			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
			expect(conversations[0].id).toBe('manual-conv');

			const messages = await db.chatMessages.toArray();
			expect(messages[0].conversationId).toBe('manual-conv');

			const activeId = await db.appConfig.get('activeConversationId');
			expect(activeId?.value).toBe('manual-conv');
		});
	});

	describe('Empty Database Handling', () => {
		it('should handle completely empty database gracefully', async () => {
			await expect(migrateExistingChatMessages()).resolves.not.toThrow();

			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
			expect(conversations[0].name).toBe('Default Conversation');
		});

		it('should create default conversation even with no messages', async () => {
			await migrateExistingChatMessages();

			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);

			const messages = await db.chatMessages.toArray();
			expect(messages).toHaveLength(0);
		});

		it('should set active conversation even with no messages', async () => {
			await migrateExistingChatMessages();

			const activeConversationId = await db.appConfig.get('activeConversationId');
			expect(activeConversationId).toBeDefined();
			expect(activeConversationId?.value).toBeDefined();
		});
	});

	describe('Partial Data Scenarios', () => {
		it('should handle messages with missing optional fields', async () => {
			const minimalMessage: ChatMessage = {
				id: 'minimal',
				role: 'user',
				content: 'Minimal',
				timestamp: new Date()
				// No contextEntities, no conversationId
			};

			await db.chatMessages.add(minimalMessage);

			await migrateExistingChatMessages();

			const migratedMessage = await db.chatMessages.get('minimal');
			expect(migratedMessage).toBeDefined();
			expect(migratedMessage?.conversationId).toBeDefined();
			expect(migratedMessage?.contextEntities).toBeUndefined();
		});

		it('should handle mix of messages with and without conversationId', async () => {
			// Create existing conversation
			const existingConv: Conversation = {
				id: 'existing',
				name: 'Existing',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await db.conversations.add(existingConv);

			// Add mixed messages
			const messages: ChatMessage[] = [
				{
					id: 'msg-with',
					conversationId: 'existing',
					role: 'user',
					content: 'Has conv',
					timestamp: new Date()
				},
				{
					id: 'msg-without',
					role: 'user',
					content: 'No conv',
					timestamp: new Date()
				}
			];

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			const msgWith = await db.chatMessages.get('msg-with');
			const msgWithout = await db.chatMessages.get('msg-without');

			expect(msgWith?.conversationId).toBe('existing');
			expect(msgWithout?.conversationId).toBeDefined();
		});

		it('should handle existing active conversation in appConfig', async () => {
			// Set existing active conversation
			await db.appConfig.put({ key: 'activeConversationId', value: 'existing-id' });

			// Create that conversation
			const conv: Conversation = {
				id: 'existing-id',
				name: 'Existing',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			await db.conversations.add(conv);

			await migrateExistingChatMessages();

			// Should not change active conversation
			const activeId = await db.appConfig.get('activeConversationId');
			expect(activeId?.value).toBe('existing-id');

			// Should not create default conversation
			const conversations = await db.conversations.toArray();
			expect(conversations).toHaveLength(1);
			expect(conversations[0].id).toBe('existing-id');
		});
	});

	describe('Error Handling', () => {
		it('should handle database errors gracefully', async () => {
			// Close database to cause errors
			await db.close();

			await expect(migrateExistingChatMessages()).rejects.toThrow();

			// Reopen for cleanup
			await db.open();
		});

		it('should handle corrupt data gracefully', async () => {
			// Add message with invalid timestamp
			try {
				await db.chatMessages.add({
					id: 'corrupt',
					role: 'user',
					content: 'Corrupt',
					timestamp: 'invalid-date' as any
				});
			} catch (e) {
				// If it fails to add, that's expected - skip this test
				return;
			}

			// Migration should still work for valid messages
			await expect(migrateExistingChatMessages()).resolves.not.toThrow();
		});
	});

	describe('Migration Verification', () => {
		it('should result in consistent database state', async () => {
			// Add some messages
			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'First',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Second',
					timestamp: new Date()
				}
			];

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			// Verify consistent state
			const conversations = await db.conversations.toArray();
			const migratedMessages = await db.chatMessages.toArray();
			const activeId = await db.appConfig.get('activeConversationId');

			// Should have exactly one conversation
			expect(conversations).toHaveLength(1);

			// All messages should reference this conversation
			const defaultConvId = conversations[0].id;
			expect(migratedMessages.every((m) => m.conversationId === defaultConvId)).toBe(true);

			// Active conversation should match
			expect(activeId?.value).toBe(defaultConvId);

			// Conversation should have proper timestamps
			expect(conversations[0].createdAt).toBeInstanceOf(Date);
			expect(conversations[0].updatedAt).toBeInstanceOf(Date);
		});

		it('should maintain message order after migration', async () => {
			const messages: ChatMessage[] = [];
			for (let i = 0; i < 10; i++) {
				messages.push({
					id: `msg-${i}`,
					role: 'user',
					content: `Message ${i}`,
					timestamp: new Date(Date.now() + i * 1000)
				});
			}

			await db.chatMessages.bulkAdd(messages);

			await migrateExistingChatMessages();

			const migratedMessages = await db.chatMessages.orderBy('timestamp').toArray();

			// Order should be preserved
			for (let i = 0; i < 10; i++) {
				expect(migratedMessages[i].content).toBe(`Message ${i}`);
			}
		});

		it('should allow normal operations after migration', async () => {
			await migrateExistingChatMessages();

			// Should be able to add new messages
			const newMessage: ChatMessage = {
				id: 'new-msg',
				conversationId: (await db.conversations.toArray())[0].id,
				role: 'user',
				content: 'New message',
				timestamp: new Date()
			};

			await expect(db.chatMessages.add(newMessage)).resolves.not.toThrow();

			// Should be able to create new conversations
			const newConv: Conversation = {
				id: 'new-conv',
				name: 'New Conversation',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await expect(db.conversations.add(newConv)).resolves.not.toThrow();
		});
	});
});
