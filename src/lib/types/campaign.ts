import type { EntityId, EntityTypeDefinition, EntityTypeOverride, BaseEntity } from './entities';
import type { ChatMessage } from './ai';

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
}

/**
 * Campaign-specific metadata stored in the entity's metadata field.
 * This is used when Campaign is stored as a BaseEntity.
 */
export interface CampaignMetadata {
	customEntityTypes: EntityTypeDefinition[];
	entityTypeOverrides: EntityTypeOverride[];
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
