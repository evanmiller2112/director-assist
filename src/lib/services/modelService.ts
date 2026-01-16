import type { ModelInfo, ModelsListResponse, ModelCache } from '$lib/types';

const STORAGE_KEY = 'dm-assist-selected-model';
const CACHE_KEY = 'dm-assist-models-cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
const DEFAULT_MODEL = 'claude-haiku-4-5-20250514';

// Fallback models when API fetch fails
const FALLBACK_MODELS: ModelInfo[] = [
	{
		id: 'claude-haiku-4-5-20250514',
		display_name: 'Claude Haiku 4.5',
		created_at: '',
		type: 'model'
	},
	{
		id: 'claude-sonnet-4-20250514',
		display_name: 'Claude Sonnet 4',
		created_at: '',
		type: 'model'
	},
	{
		id: 'claude-opus-4-5-20250514',
		display_name: 'Claude Opus 4.5',
		created_at: '',
		type: 'model'
	}
];

/**
 * Extract 8-digit date (YYYYMMDD) from model ID.
 * Returns parsed integer or null if no date found.
 *
 * @param id Model ID (e.g., "claude-haiku-4-5-20250514")
 * @returns Date as integer (e.g., 20250514) or null
 */
export function extractDateFromModelId(id: string): number | null {
	// Match exactly 8 consecutive digits (not preceded or followed by another digit)
	const match = id.match(/(?<!\d)(\d{8})(?!\d)/);
	if (!match) return null;
	return parseInt(match[1], 10);
}

/**
 * Find the latest Haiku model from a list of models.
 * Sorting priority:
 * 1. Date in model ID (descending)
 * 2. created_at field (descending)
 * 3. Reverse alphabetical by ID
 *
 * @param models Array of ModelInfo objects
 * @returns Latest Haiku model or null if none found
 */
export function findLatestHaikuModel(models: ModelInfo[]): ModelInfo | null {
	// Filter to only Haiku models (case-insensitive)
	const haikuModels = models.filter(m => m.id.toLowerCase().includes('haiku'));

	if (haikuModels.length === 0) return null;

	// Sort by priority: date in ID > created_at > alphabetical
	const sorted = haikuModels.sort((a, b) => {
		const dateA = extractDateFromModelId(a.id);
		const dateB = extractDateFromModelId(b.id);

		// Priority 1: Both have dates in ID - compare dates
		if (dateA !== null && dateB !== null) {
			if (dateA !== dateB) return dateB - dateA; // Descending
			// Same date, fall through to alphabetical
		}

		// Priority 2: Only one has date in ID - prioritize the one with date
		if (dateA !== null && dateB === null) return -1;
		if (dateA === null && dateB !== null) return 1;

		// Priority 3: Neither has date, try created_at
		const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
		const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

		if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
			return timeB - timeA; // Descending
		}

		// Priority 4: Alphabetical descending (reverse)
		return b.id.localeCompare(a.id);
	});

	return sorted[0];
}

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
 * Priority:
 * 1. Stored user selection (localStorage)
 * 2. Latest Haiku from cached models
 * 3. DEFAULT_MODEL fallback
 */
export function getSelectedModel(): string {
	if (typeof window === 'undefined') return DEFAULT_MODEL;

	// Priority 1: Return stored selection if exists
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && stored.trim()) {
		return stored;
	}

	// Priority 2: Auto-select latest Haiku from cache
	const cached = getCachedModels();
	if (cached && cached.length > 0) {
		const latestHaiku = findLatestHaikuModel(cached);
		if (latestHaiku) {
			return latestHaiku.id;
		}
	}

	// Priority 3: Fall back to default
	return DEFAULT_MODEL;
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
