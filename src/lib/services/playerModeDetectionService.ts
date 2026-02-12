/**
 * Player Mode Detection Service (Issue #445)
 *
 * This service detects whether the app should run in player-only mode by
 * checking if a published player_data.json file exists in the static directory.
 *
 * Features:
 * - HEAD request to /player_data.json to check file existence
 * - Returns true on HTTP 200 (file exists)
 * - Returns false on HTTP 404 (file not found)
 * - Returns false on network errors
 * - Returns false on other HTTP errors (500, 403, etc.)
 * - Custom URL support
 * - Result caching per URL
 * - Cache reset function for testing
 */

// Cache for detection results (per URL)
let cache: Map<string, boolean> = new Map();

/**
 * Detect if player mode should be enabled by checking if player_data.json exists.
 *
 * Makes a HEAD request to the specified URL (default: /player_data.json).
 * Returns true if the file exists (HTTP 200), false otherwise.
 * Caches the result per URL to avoid repeated network requests.
 *
 * @param url URL to check (default: /player_data.json)
 * @returns true if file exists, false otherwise
 */
export async function detectPlayerMode(url: string = '/player_data.json'): Promise<boolean> {
	// Check cache first
	if (cache.has(url)) {
		return cache.get(url)!;
	}

	try {
		const response = await fetch(url, { method: 'HEAD' });
		const result = response.ok;
		cache.set(url, result);
		return result;
	} catch {
		// Network error or other exception - treat as file not found
		cache.set(url, false);
		return false;
	}
}

/**
 * Reset the detection cache.
 * Useful for testing or when you know the file state has changed.
 */
export function resetDetectionCache(): void {
	cache = new Map();
}
