import type { ModelInfo, ModelsListResponse, ModelCache } from '$lib/types';

const STORAGE_KEY = 'dm-assist-selected-model';
const CACHE_KEY = 'dm-assist-models-cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// Fallback models when API fetch fails
const FALLBACK_MODELS: ModelInfo[] = [
	{
		id: 'claude-sonnet-4-20250514',
		display_name: 'Claude Sonnet 4',
		created_at: '',
		type: 'model'
	},
	{
		id: 'claude-opus-4-20250514',
		display_name: 'Claude Opus 4',
		created_at: '',
		type: 'model'
	},
	{
		id: 'claude-3-5-haiku-20241022',
		display_name: 'Claude 3.5 Haiku',
		created_at: '',
		type: 'model'
	}
];

/**
 * Get cached models if still valid.
 */
function getCachedModels(): ModelInfo[] | null {
	if (typeof window === 'undefined') return null;

	const cached = localStorage.getItem(CACHE_KEY);
	if (!cached) return null;

	try {
		const parsed: ModelCache = JSON.parse(cached);
		if (Date.now() - parsed.timestamp < CACHE_DURATION) {
			return parsed.models;
		}
	} catch {
		// Invalid cache, ignore
	}
	return null;
}

/**
 * Cache models in localStorage.
 */
function setCachedModels(models: ModelInfo[]): void {
	if (typeof window === 'undefined') return;

	const cache: ModelCache = {
		models,
		timestamp: Date.now()
	};
	localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Fetch available models from Anthropic API.
 * Uses direct fetch since SDK doesn't expose models.list()
 */
export async function fetchModels(apiKey: string): Promise<ModelInfo[]> {
	// Check cache first
	const cached = getCachedModels();
	if (cached) {
		return cached;
	}

	const response = await fetch('https://api.anthropic.com/v1/models', {
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		}
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to fetch models: ${response.status} ${error}`);
	}

	const data: ModelsListResponse = await response.json();

	// Filter to only Claude models and sort by display name
	const claudeModels = data.data
		.filter((m) => m.id.startsWith('claude'))
		.sort((a, b) => a.display_name.localeCompare(b.display_name));

	// Cache the results
	setCachedModels(claudeModels);

	return claudeModels;
}

/**
 * Clear the models cache (useful when API key changes).
 */
export function clearModelsCache(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(CACHE_KEY);
}

/**
 * Get the currently selected model ID.
 */
export function getSelectedModel(): string {
	if (typeof window === 'undefined') return DEFAULT_MODEL;
	return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL;
}

/**
 * Save the selected model ID.
 */
export function setSelectedModel(modelId: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, modelId);
}

/**
 * Get fallback models for when API fetch fails.
 */
export function getFallbackModels(): ModelInfo[] {
	return FALLBACK_MODELS;
}
