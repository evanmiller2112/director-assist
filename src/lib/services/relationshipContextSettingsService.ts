/**
 * Relationship Context Settings Service
 *
 * Manages settings for relationship context behavior in AI generation.
 * Settings are stored in localStorage and merged with defaults.
 */

const STORAGE_KEY = 'relationship-context-settings';

export interface RelationshipContextSettings {
	enabled: boolean;                    // default: true
	maxRelatedEntities: number;          // default: 20, range: 1-50
	maxCharacters: number;               // default: 4000, range: 1000-10000
	contextBudgetAllocation: number;     // default: 50, range: 0-100
	autoGenerateSummaries: boolean;      // default: false
}

export const DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS: RelationshipContextSettings = {
	enabled: true,
	maxRelatedEntities: 20,
	maxCharacters: 4000,
	contextBudgetAllocation: 50,
	autoGenerateSummaries: false
};

/**
 * Get relationship context settings from localStorage, merged with defaults.
 * Returns defaults when no settings stored, in SSR context, or on error.
 */
export function getRelationshipContextSettings(): RelationshipContextSettings {
	// Handle SSR
	if (typeof window === 'undefined') {
		return { ...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		// Return defaults if nothing stored or empty string
		if (!stored) {
			return { ...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS };
		}

		// Parse stored settings
		const parsed = JSON.parse(stored);

		// Return defaults if parsed is not a valid object
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { ...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS };
		}

		// Merge with defaults and ensure numeric fields are numbers
		const merged = {
			...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS,
			...parsed
		};

		// Convert numeric string values to actual numbers
		if (typeof merged.maxRelatedEntities === 'string') {
			merged.maxRelatedEntities = Number(merged.maxRelatedEntities);
		}
		if (typeof merged.maxCharacters === 'string') {
			merged.maxCharacters = Number(merged.maxCharacters);
		}
		if (typeof merged.contextBudgetAllocation === 'string') {
			merged.contextBudgetAllocation = Number(merged.contextBudgetAllocation);
		}

		return merged;
	} catch (error) {
		// Return defaults on any error (parse error, localStorage access denied, etc.)
		return { ...DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS };
	}
}

/**
 * Save relationship context settings to localStorage.
 * Accepts partial settings which will be merged with existing settings.
 * Handles SSR gracefully by doing nothing.
 */
export function setRelationshipContextSettings(settings: Partial<RelationshipContextSettings>): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		// Silently handle errors (quota exceeded, access denied, etc.)
		// The function signature doesn't throw, so we absorb the error
	}
}

/**
 * Reset relationship context settings by removing them from localStorage.
 * After reset, getRelationshipContextSettings() will return defaults.
 * Handles SSR gracefully by doing nothing.
 */
export function resetRelationshipContextSettings(): void {
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
