/**
 * AI Provider Types
 *
 * Core TypeScript interfaces for the multi-provider AI system.
 * These types are used across all provider implementations and client code.
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'ollama';

/**
 * Model performance tier
 * - fast: Quick responses, lower cost
 * - balanced: Good mix of speed and capability
 * - powerful: Best quality, slower/more expensive
 */
export type ModelTier = 'fast' | 'balanced' | 'powerful';

/**
 * Model capabilities
 */
export interface ModelCapabilities {
	/** Supports streaming responses */
	streaming: boolean;
	/** Maximum output tokens */
	maxTokens: number;
	/** Supports function/tool calling */
	supportsTools: boolean;
}

/**
 * AI model information
 */
export interface AIModelInfo {
	/** Model identifier (e.g., 'claude-3-5-sonnet-20241022') */
	id: string;
	/** Human-readable name */
	displayName: string;
	/** Provider this model belongs to */
	provider: AIProvider;
	/** Model capabilities */
	capabilities: ModelCapabilities;
	/** Performance tier */
	tier: ModelTier;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
	/** Provider name */
	provider: AIProvider;
	/** API key (not required for Ollama) */
	apiKey?: string;
	/** Base URL (required for Ollama, optional for others) */
	baseUrl?: string;
	/** Whether this provider is enabled */
	enabled: boolean;
}

/**
 * Complete AI provider settings
 */
export interface AIProviderSettings {
	/** Currently active provider */
	activeProvider: AIProvider;
	/** Currently active model ID */
	activeModel: string;
	/** Configuration for each provider */
	providers: Record<AIProvider, ProviderConfig>;
}

/**
 * Generation options
 */
export interface GenerationOptions {
	/** Maximum tokens to generate */
	maxTokens?: number;
	/** Temperature (0-1) */
	temperature?: number;
	/** System prompt */
	systemPrompt?: string;
	/** Streaming callback (for generateStream only) */
	onStream?: StreamCallback;
}

/**
 * Generation result
 */
export interface GenerationResult {
	/** Whether generation succeeded */
	success: boolean;
	/** Generated text (if successful) */
	content?: string;
	/** Error message (if failed) */
	error?: string;
	/** Token usage information */
	usage?: {
		promptTokens: number;
		completionTokens: number;
	};
}

/**
 * Stream callback function
 */
export type StreamCallback = (chunk: string) => void;
