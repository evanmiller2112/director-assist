import type { EntityId } from './entities';

// Conversation containing chat messages
export interface Conversation {
	id: EntityId;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

// Conversation with additional metadata
export interface ConversationWithMetadata extends Conversation {
	messageCount: number;
	lastMessageTime?: Date;
}

// Chat message in conversation history
export interface ChatMessage {
	id: EntityId;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;

	// Optional conversation reference (for backward compatibility)
	conversationId?: EntityId;

	// Context that was used for this message
	contextEntities?: EntityId[];

	// If this was a generation request
	generationType?: GenerationType;
	generatedEntityId?: EntityId;
}

// Types of content that can be generated
export type GenerationType =
	| 'npc'
	| 'location'
	| 'plot_hook'
	| 'encounter'
	| 'item'
	| 'faction'
	| 'session_prep'
	| 'custom';

// Request for generating content
export interface GenerationRequest {
	type: GenerationType;
	prompt: string;
	contextEntityIds: EntityId[];
	constraints?: Record<string, string>;
}

// AI-generated suggestion
export interface AISuggestion {
	id: EntityId;
	type: 'relationship' | 'plot_thread' | 'inconsistency' | 'enhancement';
	title: string;
	description: string;
	entityIds: EntityId[];
	suggestedAction?: string;
	dismissed: boolean;
	createdAt: Date;
}

// Settings for AI integration
export interface AISettings {
	apiKey?: string;
	model: string;
	maxTokens: number;
	temperature: number;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
	model: 'claude-haiku-4-5-20250514',
	maxTokens: 4096,
	temperature: 0.7
};

// Model information from Anthropic API
export interface ModelInfo {
	id: string;
	display_name: string;
	created_at: string;
	type: 'model';
}

// Response from /v1/models endpoint
export interface ModelsListResponse {
	data: ModelInfo[];
	has_more: boolean;
	first_id: string;
	last_id: string;
}

// Cached models with timestamp
export interface ModelCache {
	models: ModelInfo[];
	timestamp: number;
}

// Relationship context settings
export interface RelationshipContextSettings {
	enabled: boolean;                    // default: true
	maxRelatedEntities: number;          // default: 20, range: 1-50
	maxCharacters: number;               // default: 4000, range: 1000-10000
	contextBudgetAllocation: number;     // default: 50, range: 0-100
	autoGenerateSummaries: boolean;      // default: false
}

export const DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS: RelationshipContextSettings = {
	enabled: true,
	maxRelatedEntities: 20,
	maxCharacters: 4000,
	contextBudgetAllocation: 50,
	autoGenerateSummaries: false
};
