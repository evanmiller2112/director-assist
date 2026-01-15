import Dexie, { type Table } from 'dexie';
import type { BaseEntity, Campaign, ChatMessage, AISuggestion } from '$lib/types';

class DMAssistantDB extends Dexie {
	entities!: Table<BaseEntity>;
	campaign!: Table<Campaign>;
	chatMessages!: Table<ChatMessage>;
	suggestions!: Table<AISuggestion>;

	constructor() {
		super('dm-assistant');

		this.version(1).stores({
			// Primary key + indexed fields
			// 'id' is the primary key, others are indexed for queries
			// *tags creates a multi-entry index for array values
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			chatMessages: 'id, timestamp',
			suggestions: 'id, type, dismissed, createdAt'
		});
	}
}

// Singleton database instance
export const db = new DMAssistantDB();

// Helper to check if we're in browser environment
export function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

// Initialize database (call on app startup)
export async function initializeDatabase(): Promise<void> {
	if (!isBrowser()) {
		console.warn('IndexedDB not available - running in SSR mode');
		return;
	}

	try {
		await db.open();
		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
}
