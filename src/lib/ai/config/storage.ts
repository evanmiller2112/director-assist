/**
 * AI Provider Settings Storage
 *
 * Manages storage and retrieval of AI provider settings.
 * - API keys stored in localStorage (browser-only, not synced)
 * - Provider settings stored in IndexedDB via appConfigRepository
 */

import { appConfigRepository } from '$lib/db/repositories/appConfigRepository';
import type { AIProvider, AIProviderSettings, ProviderConfig } from '../providers/types';

// Re-export types for convenience
export type { AIProvider, AIProviderSettings, ProviderConfig } from '../providers/types';

/**
 * Storage key for provider settings in appConfig
 */
const PROVIDER_SETTINGS_KEY = 'ai-provider-settings';

/**
 * Get API key or baseUrl for a provider from localStorage
 */
export function getApiKey(provider: AIProvider): string | null {
	try {
		// Check if running in browser
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return null;
		}

		// Ollama uses baseUrl instead of apiKey
		const key =
			provider === 'ollama'
				? `ai-provider-${provider}-baseurl`
				: `ai-provider-${provider}-apikey`;

		const value = localStorage.getItem(key);

		// Return null for empty/whitespace-only values
		if (!value || value.trim() === '') {
			return null;
		}

		return value.trim();
	} catch (error) {
		// If localStorage access fails, return null
		return null;
	}
}

/**
 * Set API key or baseUrl for a provider in localStorage
 */
export function setApiKey(provider: AIProvider, value: string): void {
	try {
		// Check if running in browser
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return;
		}

		// Ollama uses baseUrl instead of apiKey
		const key =
			provider === 'ollama'
				? `ai-provider-${provider}-baseurl`
				: `ai-provider-${provider}-apikey`;

		localStorage.setItem(key, value);
	} catch (error) {
		// Silently fail if localStorage is not available
		console.error('Failed to set API key:', error);
	}
}

/**
 * Delete API key or baseUrl for a provider from localStorage
 */
export function deleteApiKey(provider: AIProvider): void {
	try {
		// Check if running in browser
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return;
		}

		// Ollama uses baseUrl instead of apiKey
		const key =
			provider === 'ollama'
				? `ai-provider-${provider}-baseurl`
				: `ai-provider-${provider}-apikey`;

		localStorage.removeItem(key);
	} catch (error) {
		// Silently fail if localStorage is not available
		console.error('Failed to delete API key:', error);
	}
}

/**
 * Get default provider settings
 */
function getDefaultProviderSettings(): AIProviderSettings {
	return {
		activeProvider: 'anthropic',
		activeModel: 'claude-3-5-sonnet-20241022',
		providers: {
			anthropic: {
				provider: 'anthropic',
				enabled: false
			},
			openai: {
				provider: 'openai',
				enabled: false
			},
			google: {
				provider: 'google',
				enabled: false
			},
			mistral: {
				provider: 'mistral',
				enabled: false
			},
			ollama: {
				provider: 'ollama',
				enabled: false
			}
		}
	};
}

/**
 * Get provider settings from IndexedDB
 */
export async function getProviderSettings(): Promise<AIProviderSettings> {
	const settings = await appConfigRepository.get<AIProviderSettings>(PROVIDER_SETTINGS_KEY);
	return settings ?? getDefaultProviderSettings();
}

/**
 * Save provider settings to IndexedDB
 */
export async function setProviderSettings(settings: AIProviderSettings): Promise<void> {
	await appConfigRepository.set(PROVIDER_SETTINGS_KEY, settings);
}

/**
 * Get complete AI settings (provider settings + API keys)
 */
export async function getAISettings(): Promise<AIProviderSettings> {
	// Get base settings from IndexedDB
	const settings = await getProviderSettings();

	// Merge in API keys/baseUrls from localStorage
	const providers: AIProvider[] = ['anthropic', 'openai', 'google', 'mistral', 'ollama'];

	providers.forEach((provider) => {
		const credential = getApiKey(provider);
		if (credential) {
			if (provider === 'ollama') {
				settings.providers[provider].baseUrl = credential;
			} else {
				settings.providers[provider].apiKey = credential;
			}
		}
	});

	return settings;
}
