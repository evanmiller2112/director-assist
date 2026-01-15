import type { EntityId, EntityTypeDefinition, BaseEntity } from './entities';
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

	// Campaign-level settings
	settings: CampaignSettings;
}

export interface CampaignSettings {
	customRelationships: string[]; // Custom relationship types beyond defaults
	enabledEntityTypes: string[]; // Which entity types to show in UI
	theme?: 'light' | 'dark' | 'system';
}

// For backup/restore
export interface CampaignBackup {
	version: string; // Backup format version
	exportedAt: Date;
	campaign: Campaign;
	entities: BaseEntity[];
	chatHistory: ChatMessage[];
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
		settings: { ...DEFAULT_CAMPAIGN_SETTINGS },
		...overrides
	};
}
