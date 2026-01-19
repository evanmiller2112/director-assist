/**
 * Mistral Provider Adapter
 *
 * Implements Mistral AI models using the Vercel AI SDK.
 */

import { createMistral } from '@ai-sdk/mistral';
import type { AIModelInfo, ProviderConfig } from './types';
import type { LanguageModel } from 'ai';

// Re-export for test compatibility
export type { ProviderConfig };

/**
 * Available Mistral models
 */
export const MISTRAL_MODELS: AIModelInfo[] = [
	{
		id: 'mistral-large-latest',
		displayName: 'Mistral Large',
		provider: 'mistral',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'mistral-medium-latest',
		displayName: 'Mistral Medium',
		provider: 'mistral',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'balanced'
	},
	{
		id: 'mistral-small-latest',
		displayName: 'Mistral Small',
		provider: 'mistral',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'fast'
	},
	{
		id: 'open-mistral-7b',
		displayName: 'Open Mistral 7B',
		provider: 'mistral',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: false
		},
		tier: 'fast'
	},
	{
		id: 'open-mixtral-8x7b',
		displayName: 'Open Mixtral 8x7B',
		provider: 'mistral',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'balanced'
	}
];

/**
 * Create a Mistral model instance
 */
export function createMistralModel(modelId: string, config: ProviderConfig): LanguageModel {
	// Validate model ID
	const modelInfo = MISTRAL_MODELS.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Invalid Mistral model ID: ${modelId}`);
	}

	// Validate API key
	if (!config.apiKey || config.apiKey.trim() === '') {
		throw new Error('Mistral API key is required');
	}

	// Create Mistral client
	const mistral = createMistral({
		apiKey: config.apiKey
	});

	// Return the model instance
	return mistral(modelId) as LanguageModel;
}
