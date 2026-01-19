/**
 * Unified AI Client
 *
 * Provides a unified interface for text generation across all AI providers.
 * Handles provider selection, error handling, and streaming.
 */

import { generateText, streamText } from 'ai';
import { getProviderModel } from './providers';
import { getAISettings } from './config/storage';
import type { GenerationOptions, GenerationResult, StreamCallback } from './providers/types';

// Re-export types for convenience
export type { GenerationOptions, GenerationResult, StreamCallback } from './providers/types';

/**
 * Generate text using the active provider and model
 */
export async function generate(
	prompt: string,
	options: GenerationOptions = {}
): Promise<GenerationResult> {
	try {
		// Get current AI settings
		const settings = await getAISettings();
		const { activeProvider, activeModel, providers } = settings;

		// Get provider config
		const providerConfig = providers[activeProvider];

		// Check if provider is enabled
		if (!providerConfig.enabled) {
			return {
				success: false,
				error: `Provider ${activeProvider} is not enabled`
			};
		}

		// Check if provider is configured
		if (activeProvider === 'ollama') {
			if (!providerConfig.baseUrl) {
				return {
					success: false,
					error: `Provider ${activeProvider} is not configured (baseUrl missing)`
				};
			}
		} else {
			if (!providerConfig.apiKey) {
				return {
					success: false,
					error: `Provider ${activeProvider} is not configured (API key missing)`
				};
			}
		}

		// Get model instance
		const model = getProviderModel(activeProvider, activeModel, providerConfig);

		// Generate text
		const result = await generateText({
			model,
			prompt,
			temperature: options.temperature,
			system: options.systemPrompt
		});

		// Return success result
		return {
			success: true,
			content: result.text,
			usage:
				result.usage && 'promptTokens' in result.usage && 'completionTokens' in result.usage
					? {
							promptTokens: result.usage.promptTokens as number,
							completionTokens: result.usage.completionTokens as number
						}
					: undefined
		};
	} catch (error: any) {
		// Handle different error types
		let errorMessage = 'Unknown error occurred';

		if (error?.status === 401) {
			errorMessage = 'Invalid API key or authentication failed';
		} else if (error?.status === 429) {
			errorMessage = 'rate limit exceeded - please try again later';
		} else if (error?.status === 500) {
			errorMessage = 'Server error - please try again later';
		} else if (error?.message) {
			errorMessage = error.message;
		} else if (typeof error === 'string') {
			errorMessage = error;
		}

		return {
			success: false,
			error: errorMessage
		};
	}
}

/**
 * Generate text with streaming using the active provider and model
 */
export async function generateStream(
	prompt: string,
	options: GenerationOptions = {}
): Promise<GenerationResult> {
	try {
		// Get current AI settings
		const settings = await getAISettings();
		const { activeProvider, activeModel, providers } = settings;

		// Get provider config
		const providerConfig = providers[activeProvider];

		// Check if provider is enabled
		if (!providerConfig.enabled) {
			return {
				success: false,
				error: `Provider ${activeProvider} is not enabled`
			};
		}

		// Check if provider is configured
		if (activeProvider === 'ollama') {
			if (!providerConfig.baseUrl) {
				return {
					success: false,
					error: `Provider ${activeProvider} is not configured (baseUrl missing)`
				};
			}
		} else {
			if (!providerConfig.apiKey) {
				return {
					success: false,
					error: `Provider ${activeProvider} is not configured (API key missing)`
				};
			}
		}

		// Get model instance
		const model = getProviderModel(activeProvider, activeModel, providerConfig);

		// Stream text
		const result = streamText({
			model,
			prompt,
			temperature: options.temperature,
			system: options.systemPrompt
		});

		// Handle streaming chunks if callback provided
		let fullText = '';
		if (options.onStream) {
			try {
				for await (const chunk of result.textStream) {
					try {
						options.onStream(chunk);
						fullText += chunk;
					} catch (error) {
						// Silently catch errors in user callback to avoid breaking the stream
						console.error('Error in onStream callback:', error);
					}
				}
			} catch (streamError) {
				// If the stream itself errors, try to get text from the promise
				// If that also fails, the error will be caught by the outer try-catch
				fullText = await result.text;
			}
		} else {
			// If no callback, just wait for the full text
			fullText = await result.text;
		}

		// Get usage after streaming is complete
		const usage = await result.usage;

		// Return success result
		return {
			success: true,
			content: fullText,
			usage:
				usage && 'promptTokens' in usage && 'completionTokens' in usage
					? {
							promptTokens: usage.promptTokens as number,
							completionTokens: usage.completionTokens as number
						}
					: undefined
		};
	} catch (error: any) {
		// Handle different error types
		let errorMessage = 'Unknown error occurred';

		if (error?.status === 401) {
			errorMessage = 'Invalid API key or authentication failed';
		} else if (error?.status === 429) {
			errorMessage = 'rate limit exceeded - please try again later';
		} else if (error?.status === 500) {
			errorMessage = 'Server error - please try again later';
		} else if (error?.message) {
			errorMessage = error.message;
		} else if (typeof error === 'string') {
			errorMessage = error;
		}

		return {
			success: false,
			error: errorMessage
		};
	}
}
