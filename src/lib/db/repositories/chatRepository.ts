import { db } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { ChatMessage } from '$lib/types';
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

	// Add a new message
	async add(
		role: 'user' | 'assistant',
		content: string,
		contextEntities?: string[]
	): Promise<ChatMessage> {
		const message: ChatMessage = {
			id: nanoid(),
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

	// Bulk add messages (for import)
	async bulkAdd(messages: ChatMessage[]): Promise<void> {
		await db.chatMessages.bulkAdd(messages);
	}
};
