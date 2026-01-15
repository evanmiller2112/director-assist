import type { EntityId } from './entities';

// Chat message in conversation history
export interface ChatMessage {
	id: EntityId;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;

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
	model: 'claude-sonnet-4-20250514',
	maxTokens: 4096,
	temperature: 0.7
};
