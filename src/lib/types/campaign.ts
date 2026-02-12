import type {
	EntityId,
	EntityTypeDefinition,
	EntityTypeOverride,
	BaseEntity,
	FieldDefinition
} from './entities';
import type { ChatMessage } from './ai';
import type { PlayerExportFieldConfig } from './playerFieldVisibility';
import type { CombatSession } from './combat';
import type { MontageSession } from './montage';
import type { NegotiationSession } from './negotiation';

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
 * Seat Assignment Interface (GitHub Issue #318)
 *
 * Represents the assignment of a character to a specific seat at the table map.
 * The player name is retrieved from the character's 'playerName' field.
 */
export interface SeatAssignment {
	seatIndex: number; // Index of the seat (0-9)
	characterId: string; // ID of the character assigned to this seat
}

/**
 * Table Map Interface (GitHub Issue #318)
 *
 * Represents a visual seating chart for in-person sessions showing
 * player/character assignments at each seat.
 */
export interface TableMap {
	seats: number; // Number of seats (4-10)
	shape: 'oval' | 'rectangular'; // Shape of the table
	dmPosition?: number; // Seat index where the DM sits (optional)
	assignments: SeatAssignment[]; // Array of seat assignments
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
	tableMap?: TableMap; // Visual seating chart for in-person sessions (Issue #318)
	playerExportFieldConfig?: PlayerExportFieldConfig; // Per-category field visibility for player exports (Issue #436)
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
	negotiationSessions?: NegotiationSession[]; // Issue #392: Negotiation sessions for backup/restore
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
