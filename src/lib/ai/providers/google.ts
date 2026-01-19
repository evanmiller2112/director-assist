/**
 * Google Gemini Provider Adapter
 *
 * Implements Google Gemini models using the Vercel AI SDK.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIModelInfo, ProviderConfig } from './types';
import type { LanguageModel } from 'ai';

// Re-export for test compatibility
export type { ProviderConfig };

/**
 * Available Google Gemini models
 */
export const GOOGLE_MODELS: AIModelInfo[] = [
	{
		id: 'gemini-1.5-pro',
		displayName: 'Gemini 1.5 Pro',
		provider: 'google',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'powerful'
	},
	{
		id: 'gemini-1.5-flash',
		displayName: 'Gemini 1.5 Flash',
		provider: 'google',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'fast'
	},
	{
		id: 'gemini-pro',
		displayName: 'Gemini Pro',
		provider: 'google',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'balanced'
	},
	{
		id: 'gemini-flash',
		displayName: 'Gemini Flash',
		provider: 'google',
		capabilities: {
			streaming: true,
			maxTokens: 8192,
			supportsTools: true
		},
		tier: 'fast'
	}
];

/**
 * Create a Google Gemini model instance
 */
export function createGoogleModel(modelId: string, config: ProviderConfig): LanguageModel {
	// Validate model ID
	const modelInfo = GOOGLE_MODELS.find((m) => m.id === modelId);
	if (!modelInfo) {
		throw new Error(`Invalid Google model ID: ${modelId}`);
	}

	// Validate API key
	if (!config.apiKey || config.apiKey.trim() === '') {
		throw new Error('Google API key is required');
	}

	// Create Google client
	const google = createGoogleGenerativeAI({
		apiKey: config.apiKey
	});

	// Return the model instance
	return google(modelId) as LanguageModel;
}
