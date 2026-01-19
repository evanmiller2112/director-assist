// AI Settings store using Svelte 5 runes
let aiEnabled = $state(false);

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
 * Load AI settings from localStorage
 */
async function load(): Promise<void> {
	if (typeof localStorage === 'undefined') {
		aiEnabled = false;
		return;
	}

	try {
		const stored = localStorage.getItem('dm-assist-ai-enabled');

		// If explicitly set, use that value (trim whitespace and check)
		if (stored !== null && stored.trim() !== '') {
			aiEnabled = stored.trim() === 'true';
		} else {
			// Default to enabled if API key exists
			aiEnabled = hasApiKey();
		}
	} catch (error) {
		console.error('Failed to load AI settings:', error);
		aiEnabled = false;
	}
}

/**
 * Set AI enabled state and persist to localStorage
 */
async function setEnabled(enabled: boolean): Promise<void> {
	aiEnabled = enabled;

	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem('dm-assist-ai-enabled', String(enabled));
		} catch (error) {
			console.error('Failed to save AI settings:', error);
		}
	}
}

/**
 * Toggle AI enabled state
 */
async function toggle(): Promise<void> {
	await setEnabled(!aiEnabled);
}

export const aiSettings = {
	get aiEnabled() {
		return aiEnabled;
	},
	get isEnabled() {
		return aiEnabled;
	},
	load,
	setEnabled,
	toggle
};
