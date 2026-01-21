/**
 * AI Setup Reminder Service (Issue #195)
 *
 * Manages the AI setup reminder banner that prompts users to configure AI
 * when they haven't set up any API keys yet.
 *
 * Features:
 * - Check if user has dismissed the setup banner permanently
 * - Check if user has configured any API key (legacy or provider-specific)
 * - Check if user has configured Ollama
 * - Determine when to show the AI setup banner based on:
 *   - AI enabled state (never show if disabled)
 *   - API key existence (never show if configured)
 *   - Dismissal state (never show if permanently dismissed)
 * - SSR-safe: gracefully handles server-side rendering
 */

// localStorage keys
const AI_SETUP_DISMISSED_KEY = 'dm-assist-ai-setup-dismissed';
const LEGACY_API_KEY = 'dm-assist-api-key';
const AI_ENABLED_KEY = 'dm-assist-ai-enabled';

// Provider-specific API keys
const PROVIDER_KEYS = [
	'ai-provider-anthropic-apikey',
	'ai-provider-openai-apikey',
	'ai-provider-google-apikey',
	'ai-provider-mistral-apikey'
];

// Ollama configuration
const OLLAMA_BASEURL_KEY = 'ai-provider-ollama-baseurl';

/**
 * Check if the AI setup banner has been permanently dismissed.
 * Returns false in SSR context or if not set.
 * Only returns true for exact string "true".
 */
export function isAiSetupDismissed(): boolean {
	// Handle SSR
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		const stored = localStorage.getItem(AI_SETUP_DISMISSED_KEY);

		// Only return true for exact string "true"
		return stored === 'true';
	} catch (error) {
		return false;
	}
}

/**
 * Mark the AI setup banner as permanently dismissed.
 * Handles SSR gracefully by doing nothing.
 */
export function setAiSetupDismissed(): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(AI_SETUP_DISMISSED_KEY, 'true');
	} catch (error) {
		// Silently handle errors
	}
}

/**
 * Check if user has any API key configured.
 * Returns true if:
 * - Legacy API key exists and is non-empty
 * - Any provider-specific API key exists and is non-empty
 * - Ollama baseUrl is configured and is non-empty
 * Returns false in SSR context.
 */
export function hasAnyApiKey(): boolean {
	// Handle SSR
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		// Check legacy API key
		const legacyKey = localStorage.getItem(LEGACY_API_KEY);
		if (legacyKey && legacyKey.trim() !== '') {
			return true;
		}

		// Check provider-specific API keys
		for (const providerKey of PROVIDER_KEYS) {
			const apiKey = localStorage.getItem(providerKey);
			if (apiKey && apiKey.trim() !== '') {
				return true;
			}
		}

		// Check Ollama baseUrl
		const ollamaBaseUrl = localStorage.getItem(OLLAMA_BASEURL_KEY);
		if (ollamaBaseUrl && ollamaBaseUrl.trim() !== '') {
			return true;
		}

		return false;
	} catch (error) {
		return false;
	}
}

/**
 * Determine if the AI setup banner should be shown.
 *
 * Logic (checked in priority order):
 * 1. Never show if any API key exists (legacy, provider-specific, or Ollama)
 * 2. Never show if permanently dismissed
 * 3. Show if no API keys and not dismissed (regardless of aiEnabled state)
 *
 * ISSUE #214 FIX: Removed the aiEnabled check to fix catch-22 for new users.
 * New users have aiEnabled=false by default, but they need to see the banner
 * to configure AI. The banner now shows regardless of aiEnabled state.
 *
 * @param aiEnabled Whether AI features are enabled (not used, kept for compatibility)
 * @param isDismissed Whether the banner has been permanently dismissed
 * @param hasApiKey Whether any API key is configured
 * @returns True if the banner should be shown
 */
export function shouldShowAiSetupBanner(
	aiEnabled: boolean,
	isDismissed: boolean,
	hasApiKey: boolean
): boolean {
	// Never show if any API key exists
	if (hasApiKey) {
		return false;
	}

	// Never show if permanently dismissed
	if (isDismissed) {
		return false;
	}

	// Show if no API keys and not dismissed (regardless of aiEnabled state)
	return true;
}
