import type {
	EntityId,
	EntityTypeDefinition,
	EntityTypeOverride,
	BaseEntity,
	FieldDefinition
} from './entities';
import type { ChatMessage } from './ai';
import type { CombatSession } from './combat';
import type { MontageSession } from './montage';

// Campaign model
export interface Campaign {
	id: EntityId;
	name: string;
	description: string;
	system: string; // "D&D 5e", "Draw Steel", "System Agnostic", etc.
	setting: string; // Campaign setting name
	createdAt: Date;
	updatedAt: Date;

	// Custom entity type definitions (user-created)
	customEntityTypes: EntityTypeDefinition[];

	// Customizations for built-in entity types
	entityTypeOverrides: EntityTypeOverride[];

	// Campaign-level settings
	settings: CampaignSettings;
}

export interface CampaignSettings {
	customRelationships: string[]; // Custom relationship types beyond defaults
	enabledEntityTypes: string[]; // Which entity types to show in UI
	theme?: 'light' | 'dark' | 'system';
	enforceCampaignLinking?: boolean; // Issue #48: Automatically link all new entities to campaigns
	defaultCampaignId?: string; // Issue #48: Default campaign for auto-linking (when multiple campaigns exist)
}

/**
 * Field Template Interface (GitHub Issue #210)
 *
 * Represents a reusable collection of field definitions that can be applied
 * to custom entity types. Field templates allow users to save and share
 * common field configurations.
 */
export interface FieldTemplate {
	id: string; // Unique identifier
	name: string; // Display name
	description?: string; // Usage description
	category: string; // Organization category (e.g., 'draw-steel', 'user')
	fieldDefinitions: FieldDefinition[]; // Field definitions in this template
	createdAt: Date; // When template was created
	updatedAt: Date; // When template was last updated
}

/**
 * Campaign-specific metadata stored in the entity's metadata field.
 * This is used when Campaign is stored as a BaseEntity.
 * Index signature added to satisfy Record<string, unknown> compatibility for BaseEntity.metadata
 */
export interface CampaignMetadata {
	[key: string]: unknown; // Index signature for Record<string, unknown> compatibility
	systemId?: string; // Game system identifier (e.g., 'draw-steel', 'system-agnostic')
	customEntityTypes: EntityTypeDefinition[];
	entityTypeOverrides: EntityTypeOverride[];
	fieldTemplates?: FieldTemplate[]; // User-created field templates (Issue #210)
	settings: CampaignSettings;
}

// For backup/restore
export interface CampaignBackup {
	version: string; // Backup format version
	exportedAt: Date;
	campaign?: Campaign; // Old format (deprecated, for backward compat)
	entities: BaseEntity[];
	chatHistory: ChatMessage[];
	activeCampaignId?: string; // New: which campaign was active
	selectedModel?: string; // Issue #34: User's selected Claude model preference
	combatSessions?: CombatSession[]; // Issue #310: Combat sessions for backup/restore
	montageSessions?: MontageSession[]; // Issue #310: Montage sessions for backup/restore
}

// Issue #152: Backup reminder system types
export type BackupReminderReason = 'first-time' | 'milestone' | 'time-based';

export interface BackupReminderResult {
	show: boolean;
	reason: BackupReminderReason | null;
}

// Default campaign settings
export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
	customRelationships: [],
	enabledEntityTypes: [
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'session',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile'
	],
	theme: 'system'
};

/**
 * Default campaign metadata for new campaigns
 */
export const DEFAULT_CAMPAIGN_METADATA: CampaignMetadata = {
	customEntityTypes: [],
	entityTypeOverrides: [],
	settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
};

// Helper to create a new campaign
export function createCampaign(
	name: string,
	overrides: Partial<Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name,
		description: '',
		system: 'System Agnostic',
		setting: '',
		customEntityTypes: [],
		entityTypeOverrides: [],
		settings: { ...DEFAULT_CAMPAIGN_SETTINGS },
		...overrides
	};
}
