/**
 * OpenAI Provider Adapter
 *
 * Implements OpenAI GPT models using the Vercel AI SDK.
 */

import { createOpenAI } from '@ai-sdk/openai';
import type { AIModelInfo, ProviderConfig } from './types';
import type { LanguageModel } from 'ai';

// Re-export for test compatibility
export type { ProviderConfig };

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS: AIModelInfo[] = [
	{
		id: 'gpt-4-turbo-preview',
		displayName: 'GPT-4 Turbo',
		provider: 'openai',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'gpt-4',
		displayName: 'GPT-4',
		provider: 'openai',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'gpt-4-turbo',
		displayName: 'GPT-4 Turbo',
		provider: 'openai',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'balanced'
	},
	{
		id: 'gpt-3.5-turbo',
		displayName: 'GPT-3.5 Turbo',
		provider: 'openai',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'fast'
	},
	{
		id: 'gpt-3.5-turbo-16k',
		displayName: 'GPT-3.5 Turbo 16K',
		provider: 'openai',
		capabilities: {
			streaming: true,
			maxTokens: 16384,
			supportsTools: true
		},
		tier: 'fast'
	}
];

/**
 * Create an OpenAI model instance
 */
export function createOpenAIModel(modelId: string, config: ProviderConfig): LanguageModel {
	// Validate model ID
	const modelInfo = OPENAI_MODELS.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Invalid OpenAI model ID: ${modelId}`);
	}

	// Validate API key
	if (!config.apiKey || config.apiKey.trim() === '') {
		throw new Error('OpenAI API key is required');
	}

	// Create OpenAI client
	const openai = createOpenAI({
		apiKey: config.apiKey
	});

	// Return the model instance
	return openai(modelId) as LanguageModel;
}
