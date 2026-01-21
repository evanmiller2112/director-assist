/**
 * Debug Settings Service
 *
 * Manages debug console settings in localStorage.
 * Used by debug.svelte.ts store to persist debug mode state.
 */

const STORAGE_KEY = 'dm-assist-debug-enabled';

/**
 * Check if debug mode is enabled.
 * Returns false by default, true only if explicitly enabled in localStorage.
 * Handles SSR gracefully by returning false.
 */
export function isDebugEnabled(): boolean {
	// Handle SSR
	if (typeof window === 'undefined') {
		return false;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		// Return true only if stored value is exactly "true"
		return stored === 'true';
	} catch (error) {
		// Return false on any error (localStorage access denied, etc.)
		return false;
	}
}

/**
 * Set debug mode enabled state.
 * When true, stores "true" in localStorage.
 * When false, removes the key from localStorage.
 * Handles SSR gracefully by doing nothing.
 */
export function setDebugEnabled(enabled: boolean): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		if (enabled) {
			localStorage.setItem(STORAGE_KEY, 'true');
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch (error) {
		// Silently handle errors (quota exceeded, access denied, etc.)
		// The function signature doesn't throw, so we absorb the error
	}
}
