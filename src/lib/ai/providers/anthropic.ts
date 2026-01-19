/**
 * Anthropic Provider Adapter
 *
 * Implements the Anthropic Claude models using the Vercel AI SDK.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import type { AIModelInfo, ProviderConfig } from './types';
import type { LanguageModel } from 'ai';

// Re-export for test compatibility
export type { ProviderConfig };

/**
 * Available Anthropic models
 */
export const ANTHROPIC_MODELS: AIModelInfo[] = [
	{
		id: 'claude-3-5-sonnet-20241022',
		displayName: 'Claude 3.5 Sonnet',
		provider: 'anthropic',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'claude-3-5-haiku-20241022',
		displayName: 'Claude 3.5 Haiku',
		provider: 'anthropic',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'fast'
	},
	{
		id: 'claude-3-opus-20240229',
		displayName: 'Claude 3 Opus',
		provider: 'anthropic',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'claude-3-sonnet-20240229',
		displayName: 'Claude 3 Sonnet',
		provider: 'anthropic',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'balanced'
	},
	{
		id: 'claude-3-haiku-20240307',
		displayName: 'Claude 3 Haiku',
		provider: 'anthropic',
		capabilities: {
			streaming: true,
			maxTokens: 4096,
			supportsTools: true
		},
		tier: 'fast'
	}
];

/**
 * Create an Anthropic model instance
 */
export function createAnthropicModel(modelId: string, config: ProviderConfig): LanguageModel {
	// Validate model ID
	const modelInfo = ANTHROPIC_MODELS.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Invalid Anthropic model ID: ${modelId}`);
	}

	// Validate API key
	if (!config.apiKey || config.apiKey.trim() === '') {
		throw new Error('Anthropic API key is required');
	}

	// Create Anthropic client with browser support
	const anthropic = createAnthropic({
		apiKey: config.apiKey
	});

	// Return the model instance
	return anthropic(modelId) as LanguageModel;
}
