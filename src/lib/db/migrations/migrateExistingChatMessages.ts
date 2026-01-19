import { db } from '../index';
import { nanoid } from 'nanoid';
import type { Conversation } from '$lib/types';

/**
 * Migration to support multi-conversation chat system
 *
 * This migration:
 * 1. Creates a "Default Conversation" if no conversations exist
 * 2. Assigns all messages without conversationId to the default conversation
 * 3. Sets the default conversation as active
 * 4. Is idempotent (safe to run multiple times)
 */
export async function migrateExistingChatMessages(): Promise<void> {
	// Get all messages without conversationId
	const messagesWithoutConversation = await db.chatMessages
		.filter((msg) => !msg.conversationId)
		.toArray();

	// If no messages need migration, we're done
	if (messagesWithoutConversation.length === 0) {
		// Still need to create default conversation if none exist
		const conversationCount = await db.conversations.count();
		if (conversationCount === 0) {
			const now = new Date();
			const defaultConversation: Conversation = {
				id: nanoid(),
				name: 'Default Conversation',
				createdAt: now,
				updatedAt: now
			};
			await db.conversations.add(defaultConversation);
			await db.appConfig.put({
				key: 'activeConversationId',
				value: defaultConversation.id
			});
		}
		return;
	}

	// Check if any conversations exist
	const conversationCount = await db.conversations.count();
	let defaultConversationId: string;

	if (conversationCount === 0) {
		// Create default conversation
		const now = new Date();
		const defaultConversation: Conversation = {
			id: nanoid(),
			name: 'Default Conversation',
			createdAt: now,
			updatedAt: now
		};
		await db.conversations.add(defaultConversation);
		defaultConversationId = defaultConversation.id;

		// Set default conversation as active
		await db.appConfig.put({
			key: 'activeConversationId',
			value: defaultConversation.id
		});
	} else {
		// Use the first existing conversation (most recently updated)
		const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
		defaultConversationId = conversations[0].id;
	}

	// Assign all messages without conversationId to default conversation
	await Promise.all(
		messagesWithoutConversation.map((msg) =>
			db.chatMessages.update(msg.id, {
				conversationId: defaultConversationId
			})
		)
	);
}
