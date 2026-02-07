import Dexie, { type Table } from 'dexie';
import type {
	BaseEntity,
	Campaign,
	ChatMessage,
	Conversation,
	AISuggestion,
	RelationshipSummaryCache,
	CombatSession,
	MontageSession
} from '$lib/types';
import type { CreatureTemplate } from '$lib/types/creature';
import type { FieldSuggestion } from '$lib/types/ai';
import { migrateCampaignToEntity } from './migrations/migrateCampaignToEntity';
import { migrateExistingChatMessages } from './migrations/migrateExistingChatMessages';

// App-level configuration stored in IndexedDB
export interface AppConfig {
	key: string;
	value: unknown;
}

class DMAssistantDB extends Dexie {
	entities!: Table<BaseEntity>;
	campaign!: Table<Campaign>;
	conversations!: Table<Conversation>;
	chatMessages!: Table<ChatMessage>;
	suggestions!: Table<AISuggestion>;
	appConfig!: Table<AppConfig>;
	relationshipSummaryCache!: Table<RelationshipSummaryCache>;
	combatSessions!: Table<CombatSession>;
	montageSessions!: Table<MontageSession>;
	creatureTemplates!: Table<CreatureTemplate>;
	fieldSuggestions!: Table<FieldSuggestion>;

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

		// Version 3: Add relationshipSummaryCache table for caching AI-generated summaries
		this.version(3).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			chatMessages: 'id, timestamp',
			suggestions: 'id, type, dismissed, createdAt',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt'
		});

		// Version 4: Add conversations table and update chatMessages index for conversation support
		this.version(4).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, dismissed, createdAt',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt'
		});

		// Version 5: Update suggestions table for new AISuggestion interface
		this.version(5).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt'
		});

		// Version 6: Add combatSessions table for Draw Steel combat tracking
		this.version(6).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt',
			combatSessions: 'id, status, createdAt, updatedAt'
		});

		// Version 7: Add montageSessions table for Draw Steel montage tracking
		this.version(7).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt',
			combatSessions: 'id, status, createdAt, updatedAt',
			montageSessions: 'id, status, createdAt, updatedAt'
		});

		// Version 8: Add creatureTemplates table for creature template library
		this.version(8).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt',
			combatSessions: 'id, status, createdAt, updatedAt',
			montageSessions: 'id, status, createdAt, updatedAt',
			creatureTemplates: 'id, name, threat, *tags, createdAt, updatedAt'
		});

		// Version 9: Add fieldSuggestions table for field-level AI suggestions
		this.version(9).stores({
			entities: 'id, type, name, *tags, createdAt, updatedAt',
			campaign: 'id',
			conversations: 'id, name, updatedAt',
			chatMessages: 'id, conversationId, timestamp',
			suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
			appConfig: 'key',
			relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt',
			combatSessions: 'id, status, createdAt, updatedAt',
			montageSessions: 'id, status, createdAt, updatedAt',
			creatureTemplates: 'id, name, threat, *tags, createdAt, updatedAt',
			fieldSuggestions: 'id, entityId, entityType, status, createdAt'
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
			await migrateExistingChatMessages();
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
