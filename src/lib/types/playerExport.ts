import type { EntityId, EntityType, FieldValue } from './entities';

/**
 * Player Export Types
 *
 * These types define the structure for filtered player-safe exports
 * that exclude DM-only information (notes, secrets, hidden entities, etc.)
 */

// Available export formats
export type PlayerExportFormat = 'json' | 'html' | 'markdown';

// Filtered link for player view (excludes DM-only properties)
export interface PlayerEntityLink {
	id: EntityId;
	targetId: EntityId;
	targetType: EntityType;
	relationship: string;
	bidirectional: boolean;
	reverseRelationship?: string;
	strength?: 'strong' | 'moderate' | 'weak';
	// EXCLUDED: notes, metadata, playerVisible, createdAt, updatedAt
}

// Filtered entity for player view (removes sensitive fields)
export interface PlayerEntity {
	id: EntityId;
	type: EntityType;
	name: string;
	description: string;
	summary?: string;
	tags: string[];
	imageUrl?: string;
	fields: Record<string, FieldValue>; // Filtered: no hidden section fields
	links: PlayerEntityLink[]; // Filtered: only playerVisible links
	createdAt?: Date; // Optional: controlled by __core_createdAt visibility
	updatedAt?: Date; // Optional: controlled by __core_updatedAt visibility
	// EXCLUDED: notes, metadata, playerVisible
}

// Complete player export structure
export interface PlayerExport {
	version: string;
	exportedAt: Date;
	campaignName: string;
	campaignDescription: string;
	entities: PlayerEntity[];
	// EXCLUDED: chatHistory, activeCampaignId, selectedModel, preparation fields
}

// Export configuration options
export interface PlayerExportOptions {
	format: PlayerExportFormat;
	includeTimestamps?: boolean; // Include createdAt/updatedAt (default: true)
	includeImages?: boolean; // Include imageUrl references (default: true)
	groupByType?: boolean; // Group entities by type in output (default: true)
}

// Export result returned from the export service
export interface PlayerExportResult {
	data: string;
	filename: string;
	mimeType: string;
}

// Statistics about what's being exported (for UI preview)
export interface PlayerExportPreview {
	totalEntities: number;
	excludedEntities: number;
	byType: Record<string, { included: number; excluded: number }>;
}

// Default export options
export const DEFAULT_PLAYER_EXPORT_OPTIONS: PlayerExportOptions = {
	format: 'json',
	includeTimestamps: true,
	includeImages: true,
	groupByType: true
};

// Current player export format version
export const PLAYER_EXPORT_VERSION = '1.0.0';
