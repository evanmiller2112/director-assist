import { db } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { ChatMessage, EntityId } from '$lib/types';
import { nanoid } from 'nanoid';

export const chatRepository = {
	// Get all messages as a live query
	getAll(): Observable<ChatMessage[]> {
		return liveQuery(() => db.chatMessages.orderBy('timestamp').toArray());
	},

	// Get recent messages
	getRecent(limit: number = 50): Observable<ChatMessage[]> {
		return liveQuery(() =>
			db.chatMessages.orderBy('timestamp').reverse().limit(limit).toArray()
		);
	},

	// Get messages for a specific conversation
	getByConversation(conversationId: EntityId): Observable<ChatMessage[]> {
		return liveQuery(() =>
			db.chatMessages.where('conversationId').equals(conversationId).sortBy('timestamp')
		);
	},

	// Get recent messages for a specific conversation
	getRecentByConversation(
		conversationId: EntityId,
		limit: number = 50
	): Observable<ChatMessage[]> {
		return liveQuery(async () => {
			const messages = await db.chatMessages
				.where('conversationId')
				.equals(conversationId)
				.reverse()
				.sortBy('timestamp');
			return messages.slice(0, limit);
		});
	},

	// Add a new message (with optional conversationId)
	async add(
		role: 'user' | 'assistant',
		content: string,
		contextEntities?: string[],
		conversationId?: EntityId
	): Promise<ChatMessage> {
		const message: ChatMessage = {
			id: nanoid(),
			conversationId,
			role,
			content,
			timestamp: new Date(),
			contextEntities
		};

		await db.chatMessages.add(message);
		return message;
	},

	// Clear all messages
	async clearAll(): Promise<void> {
		await db.chatMessages.clear();
	},

	// Clear messages for a specific conversation
	async clearByConversation(conversationId: EntityId): Promise<void> {
		await db.chatMessages.where('conversationId').equals(conversationId).delete();
	},

	// Bulk add messages (for import)
	async bulkAdd(messages: ChatMessage[]): Promise<void> {
		await db.chatMessages.bulkAdd(messages);
	}
};
