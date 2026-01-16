import Dexie, { type Table } from 'dexie';
import type { BaseEntity, Campaign, ChatMessage, AISuggestion } from '$lib/types';
import { migrateCampaignToEntity } from './migrations/migrateCampaignToEntity';

// App-level configuration stored in IndexedDB
export interface AppConfig {
	key: string;
	value: unknown;
}

class DMAssistantDB extends Dexie {
	entities!: Table<BaseEntity>;
	campaign!: Table<Campaign>;
	chatMessages!: Table<ChatMessage>;
	suggestions!: Table<AISuggestion>;
	appConfig!: Table<AppConfig>;

	constructor() {
		super('dm-assistant');

		// Version 1: Initial schema
		this.version(1).stores({
			// Primary key + indexed fields
			// 'id' is the primary key, others are indexed for queries
			// *tags creates a multi-entry index for array values
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			chatMessages: 'id, timestamp',
			suggestions: 'id, type, dismissed, createdAt'
		});

		// Version 2: Add appConfig table for app-level settings
		this.version(2).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			chatMessages: 'id, timestamp',
			suggestions: 'id, type, dismissed, createdAt',
			appConfig: 'key'
		});
	}
}

// Singleton database instance
export const db = new DMAssistantDB();

// Helper to check if we're in browser environment
export function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

// Track initialization state
let dbInitialized = false;
let dbInitializing: Promise<void> | null = null;

// Initialize database (call on app startup)
export async function initializeDatabase(): Promise<void> {
	if (!isBrowser()) {
		console.warn('IndexedDB not available - running in SSR mode');
		return;
	}

	// Return existing initialization promise if already initializing
	if (dbInitializing) {
		return dbInitializing;
	}

	// Return immediately if already initialized
	if (dbInitialized) {
		return;
	}

	dbInitializing = (async () => {
		try {
			await db.open();
			dbInitialized = true;
			console.log('Database initialized successfully');

			// Run migrations after database is ready
			await migrateCampaignToEntity();
		} catch (error) {
			console.error('Failed to initialize database:', error);
			dbInitializing = null; // Reset so we can retry
			throw error;
		}
	})();

	return dbInitializing;
}

// Ensure database is ready before any operation
export async function ensureDbReady(): Promise<void> {
	if (!dbInitialized && !dbInitializing) {
		await initializeDatabase();
	} else if (dbInitializing) {
		await dbInitializing;
	}
}
