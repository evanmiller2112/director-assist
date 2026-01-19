import { db } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { Conversation, ConversationWithMetadata } from '$lib/types';
import { nanoid } from 'nanoid';

export const conversationRepository = {
	// Create a new conversation
	async create(name?: string): Promise<Conversation> {
		const now = new Date();
		const id = nanoid();
		const conversation: Conversation = {
			id,
			name: name !== undefined ? name : `New Conversation ${id.substring(0, 8)}`,
			createdAt: now,
			updatedAt: now
		};

		await db.conversations.add(conversation);
		return conversation;
	},

	// Get all conversations as live query, ordered by updatedAt descending
	getAll(): Observable<Conversation[]> {
		return liveQuery(() => db.conversations.orderBy('updatedAt').reverse().toArray());
	},

	// Get a single conversation by ID
	async getById(id: string): Promise<Conversation | undefined> {
		return await db.conversations.get(id);
	},

	// Update conversation name and updatedAt timestamp
	async update(id: string, name: string): Promise<void> {
		const conversation = await db.conversations.get(id);
		if (!conversation) {
			throw new Error(`Conversation with id ${id} not found`);
		}

		await db.conversations.update(id, {
			name,
			updatedAt: new Date()
		});
	},

	// Delete conversation, optionally delete associated messages
	async delete(id: string, deleteMessages: boolean = false): Promise<void> {
		// Delete the conversation
		await db.conversations.delete(id);

		// Delete associated messages if requested
		if (deleteMessages) {
			await db.chatMessages.where('conversationId').equals(id).delete();
		}
	},

	// Get conversation with metadata (message count, last message time)
	async getWithMetadata(id: string): Promise<ConversationWithMetadata | undefined> {
		const conversation = await db.conversations.get(id);
		if (!conversation) {
			return undefined;
		}

		// Get message count for this conversation
		const messageCount = await db.chatMessages.where('conversationId').equals(id).count();

		// Get last message time
		const messages = await db.chatMessages
			.where('conversationId')
			.equals(id)
			.reverse()
			.sortBy('timestamp');

		const lastMessageTime = messages.length > 0 ? messages[0].timestamp : undefined;

		return {
			...conversation,
			messageCount,
			lastMessageTime
		};
	},

	// Get all conversations with metadata as live query
	getAllWithMetadata(): Observable<ConversationWithMetadata[]> {
		return liveQuery(async () => {
			// Get all conversations ordered by updatedAt descending
			const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();

			// Enrich with metadata
			const conversationsWithMetadata = await Promise.all(
				conversations.map(async (conversation) => {
					// Get message count for this conversation
					const messageCount = await db.chatMessages
						.where('conversationId')
						.equals(conversation.id)
						.count();

					// Get last message time
					const messages = await db.chatMessages
						.where('conversationId')
						.equals(conversation.id)
						.reverse()
						.sortBy('timestamp');

					const lastMessageTime = messages.length > 0 ? messages[0].timestamp : undefined;

					return {
						...conversation,
						messageCount,
						lastMessageTime
					};
				})
			);

			return conversationsWithMetadata;
		});
	}
};
