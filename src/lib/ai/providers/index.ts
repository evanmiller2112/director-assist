/**
 * AI Provider Registry
 *
 * Central registry for all AI providers. Provides unified access to
 * provider models and configuration.
 */

import type { LanguageModel } from 'ai';
import { ANTHROPIC_MODELS, createAnthropicModel } from './anthropic';
import { OPENAI_MODELS, createOpenAIModel } from './openai';
import { GOOGLE_MODELS, createGoogleModel } from './google';
import { MISTRAL_MODELS, createMistralModel } from './mistral';
import { OLLAMA_MODELS, createOllamaModel } from './ollama';
import type { AIProvider, AIModelInfo, ProviderConfig } from './types';

// Re-export types
export type { AIProvider, AIModelInfo, ProviderConfig, ModelTier } from './types';

/**
 * Provider adapter interface
 */
interface ProviderAdapter {
	name: AIProvider;
	models: AIModelInfo[];
	createModel: (modelId: string, config: ProviderConfig) => LanguageModel;
}

/**
 * Provider registry map
 */
const PROVIDER_REGISTRY: Record<AIProvider, ProviderAdapter> = {
	anthropic: {
		name: 'anthropic',
		models: ANTHROPIC_MODELS,
		createModel: createAnthropicModel
	},
	openai: {
		name: 'openai',
		models: OPENAI_MODELS,
		createModel: createOpenAIModel
	},
	google: {
		name: 'google',
		models: GOOGLE_MODELS,
		createModel: createGoogleModel
	},
	mistral: {
		name: 'mistral',
		models: MISTRAL_MODELS,
		createModel: createMistralModel
	},
	ollama: {
		name: 'ollama',
		models: OLLAMA_MODELS,
		createModel: createOllamaModel
	}
};

/**
 * Get provider adapter by name
 */
export function getProvider(provider: AIProvider): ProviderAdapter {
	const adapter = PROVIDER_REGISTRY[provider];
	if (!adapter) {
		throw new Error(`Unknown provider: ${provider}`);
	}
	return adapter;
}

/**
 * Get available models for a provider
 */
export function getProviderModels(provider: AIProvider): AIModelInfo[] {
	return getProvider(provider).models;
}

/**
 * Create a model instance for a specific provider and model ID
 */
export function getProviderModel(
	provider: AIProvider,
	modelId: string,
	config: ProviderConfig
): LanguageModel {
	const adapter = getProvider(provider);

	// Validate that model ID exists for this provider
	const modelInfo = adapter.models.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Model ${modelId} not found for provider ${provider}`);
	}

	return adapter.createModel(modelId, config);
}

/**
 * Check if a provider is configured (has required credentials)
 */
export function isProviderConfigured(provider: AIProvider): boolean {
	try {
		// Check if running in browser
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return false;
		}

		// Ollama uses baseUrl instead of apiKey
		if (provider === 'ollama') {
			const baseUrl = localStorage.getItem('ai-provider-ollama-baseurl');
			return baseUrl !== null && baseUrl.trim() !== '';
		}

		// Other providers use API keys
		const apiKey = localStorage.getItem(`ai-provider-${provider}-apikey`);
		return apiKey !== null && apiKey.trim() !== '';
	} catch (error) {
		// If localStorage access fails, provider is not configured
		return false;
	}
}
