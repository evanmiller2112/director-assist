// AI Settings store using Svelte 5 runes
import type { AIMode } from '$lib/types/ai';

let aiMode = $state<AIMode>('off');

/**
 * Check if any API key exists in localStorage
 */
function hasApiKey(): boolean {
	if (typeof localStorage === 'undefined') return false;

	// Check legacy location
	const legacyKey = localStorage.getItem('dm-assist-api-key');
	if (legacyKey) return true;

	// Check provider-specific keys
	const providers = ['anthropic', 'openai', 'google', 'mistral'];
	for (const provider of providers) {
		const key = localStorage.getItem(`ai-provider-${provider}-apikey`);
		if (key) return true;
	}

	// Check for Ollama baseUrl
	const ollamaBaseUrl = localStorage.getItem('ai-provider-ollama-baseurl');
	if (ollamaBaseUrl) return true;

	return false;
}

/**
 * Validate and normalize an AIMode value
 */
function isValidMode(value: string): value is AIMode {
	const normalized = value.trim().toLowerCase();
	return normalized === 'off' || normalized === 'suggestions' || normalized === 'full';
}

/**
 * Load AI settings from localStorage
 */
async function load(): Promise<void> {
	if (typeof localStorage === 'undefined') {
		aiMode = 'off';
		return;
	}

	try {
		// Check for new tri-state mode format first
		const storedMode = localStorage.getItem('dm-assist-ai-mode');

		if (storedMode !== null && storedMode.trim() !== '') {
			const normalized = storedMode.trim().toLowerCase();
			if (isValidMode(normalized)) {
				aiMode = normalized;
				return;
			}
			// If invalid mode, fall through to migration logic
		}

		// Migration: Check for old boolean format
		const storedBoolean = localStorage.getItem('dm-assist-ai-enabled');

		if (storedBoolean !== null && storedBoolean.trim() !== '') {
			// Migrate from boolean to tri-state
			const wasEnabled = storedBoolean.trim() === 'true';
			aiMode = wasEnabled ? 'full' : 'off';

			// Persist the migrated value
			localStorage.setItem('dm-assist-ai-mode', aiMode);
			return;
		}

		// No stored preference, use default based on API key presence
		aiMode = hasApiKey() ? 'full' : 'off';
	} catch (error) {
		console.error('Failed to load AI settings:', error);
		aiMode = 'off';
	}
}

/**
 * Set AI mode and persist to localStorage
 */
async function setMode(mode: AIMode): Promise<void> {
	aiMode = mode;

	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem('dm-assist-ai-mode', mode);
		} catch (error) {
			console.error('Failed to save AI settings:', error);
		}
	}
}

/**
 * Set AI enabled state and persist to localStorage
 * Legacy compatibility method - maps boolean to tri-state
 * @deprecated Use setMode() instead
 */
async function setEnabled(enabled: boolean): Promise<void> {
	const mode: AIMode = enabled ? 'full' : 'off';
	await setMode(mode);

	// Also update legacy localStorage key for backward compatibility
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem('dm-assist-ai-enabled', String(enabled));
		} catch (error) {
			console.error('Failed to save legacy AI settings:', error);
		}
	}
}

/**
 * Toggle AI enabled state
 * Legacy compatibility method - cycles through modes
 * @deprecated Use setMode() instead
 */
async function toggle(): Promise<void> {
	// Toggle logic: suggestions -> off -> full -> off -> full
	// If currently in suggestions mode, turn off
	// If off, turn to full
	// If full, turn off
	const newMode: AIMode = aiMode === 'off' ? 'full' : 'off';
	await setMode(newMode);

	// Also update legacy localStorage key for backward compatibility
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem('dm-assist-ai-enabled', String(newMode !== 'off'));
		} catch (error) {
			console.error('Failed to save legacy AI settings:', error);
		}
	}
}

export const aiSettings = {
	// Primary tri-state mode
	get aiMode() {
		return aiMode;
	},

	// Derived states
	get isEnabled() {
		return aiMode !== 'off';
	},
	get isSuggestionsMode() {
		return aiMode === 'suggestions';
	},
	get isFullMode() {
		return aiMode === 'full';
	},

	// Legacy compatibility - aiEnabled getter
	get aiEnabled() {
		return aiMode !== 'off';
	},

	// Methods
	load,
	setMode,
	setEnabled,
	toggle
};
