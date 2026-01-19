/**
 * Ollama Provider Adapter
 *
 * Implements local Ollama models using the Vercel AI SDK.
 */

import { createOllama } from 'ollama-ai-provider';
import type { AIModelInfo, ProviderConfig } from './types';
import type { LanguageModel } from 'ai';

// Re-export for test compatibility
export type { ProviderConfig };

/**
 * Available Ollama models (common local models)
 */
export const OLLAMA_MODELS: AIModelInfo[] = [
	{
		id: 'llama3',
		displayName: 'Llama 3',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: false
		},
		tier: 'balanced'
	},
	{
		id: 'llama3:70b',
		displayName: 'Llama 3 70B',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: false
		},
		tier: 'powerful'
	},
	{
		id: 'llama3:7b',
		displayName: 'Llama 3 7B',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: false
		},
		tier: 'fast'
	},
	{
		id: 'mistral',
		displayName: 'Mistral',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: false
		},
		tier: 'balanced'
	},
	{
		id: 'phi3',
		displayName: 'Phi-3',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: false
		},
		tier: 'fast'
	},
	{
		id: 'gemma',
		displayName: 'Gemma',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: false
		},
		tier: 'fast'
	},
	{
		id: 'codellama',
		displayName: 'Code Llama',
		provider: 'ollama',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: false
		},
		tier: 'balanced'
	}
];

/**
 * Create an Ollama model instance
 */
export function createOllamaModel(modelId: string, config: ProviderConfig): LanguageModel {
	// Validate model ID
	const modelInfo = OLLAMA_MODELS.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Invalid Ollama model ID: ${modelId}`);
	}

	// Validate baseUrl
	if (!config.baseUrl || config.baseUrl.trim() === '') {
		throw new Error('Ollama baseUrl is required');
	}

	// Create Ollama client
	const ollama = createOllama({
		baseURL: config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl
	});

	// Return the model instance
	return ollama(modelId) as unknown as LanguageModel;
}
