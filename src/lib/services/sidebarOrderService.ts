/**
 * Sidebar Order Service
 *
 * Manages the custom ordering of entity types in the sidebar,
 * allowing users to drag-and-drop to reorder entity type sections.
 * Order is stored in localStorage and merged with defaults.
 */

const STORAGE_KEY = 'dm-assist-sidebar-entity-order';

/**
 * Get the default order for entity types, with campaign first.
 * Returns a new array instance each time to prevent shared references.
 */
export function getDefaultOrder(): string[] {
	return [
		'campaign',
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'session',
		'scene',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile'
	];
}

/**
 * Get saved sidebar entity type order from localStorage.
 * Returns null when no order is saved, in SSR context, or on error.
 *
 * @returns Array of entity type keys in custom order, or null if none saved
 */
export function getSidebarEntityTypeOrder(): string[] | null {
	// Handle SSR
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		// Return null if nothing stored or empty string
		if (!stored || stored.trim() === '') {
			return null;
		}

		// Parse stored order
		const parsed = JSON.parse(stored);

		// Return null if parsed is not a valid array
		if (!Array.isArray(parsed)) {
			return null;
		}

		// Return null for empty array treated as valid in tests
		// But validate all elements are non-empty strings
		if (parsed.length > 0) {
			// Check all elements are valid strings
			const allValidStrings = parsed.every(
				(item) => typeof item === 'string' && item.length > 0
			);

			if (!allValidStrings) {
				return null;
			}

			// Check for duplicates
			const uniqueTypes = new Set(parsed);
			if (uniqueTypes.size !== parsed.length) {
				return null;
			}
		}

		return parsed;
	} catch (error) {
		// Return null on any error (parse error, localStorage access denied, etc.)
		return null;
	}
}

/**
 * Save sidebar entity type order to localStorage.
 * Handles SSR gracefully by doing nothing.
 *
 * @param order Array of entity type keys in desired order
 */
export function setSidebarEntityTypeOrder(order: string[]): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
	} catch (error) {
		// Silently handle errors (quota exceeded, access denied, etc.)
		// The function signature doesn't throw, so we absorb the error
	}
}

/**
 * Reset sidebar entity type order by removing it from localStorage.
 * After reset, getSidebarEntityTypeOrder() will return null.
 * Handles SSR gracefully by doing nothing.
 */
export function resetSidebarEntityTypeOrder(): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		// Silently handle errors (access denied, etc.)
		// The function signature doesn't throw, so we absorb the error
	}
}
