/**
 * Suggestion Settings Service
 *
 * Manages settings for the AI Suggestions system using localStorage.
 * Settings control auto-analysis behavior, frequency, relevance thresholds,
 * and which suggestion types are enabled.
 */

import type { AISuggestionType } from '$lib/types';

const STORAGE_KEY = 'ai-suggestion-settings';

export interface SuggestionSettings {
	enableAutoAnalysis: boolean;
	analysisFrequencyHours: number;
	minRelevanceScore: number;
	enabledSuggestionTypes: AISuggestionType[];
	maxSuggestionsPerType: number;
}

export const DEFAULT_SUGGESTION_SETTINGS: SuggestionSettings = {
	enableAutoAnalysis: true,
	analysisFrequencyHours: 24,
	minRelevanceScore: 30,
	enabledSuggestionTypes: ['relationship', 'plot_thread', 'inconsistency', 'enhancement', 'recommendation'],
	maxSuggestionsPerType: 10
};

const VALID_SUGGESTION_TYPES: AISuggestionType[] = [
	'relationship',
	'plot_thread',
	'inconsistency',
	'enhancement',
	'recommendation'
];

/**
 * Get current suggestion settings from localStorage.
 * Returns defaults if no settings are stored or in SSR context.
 */
export async function getSettings(): Promise<SuggestionSettings> {
	// Handle SSR context (no window)
	if (typeof window === 'undefined') {
		return { ...DEFAULT_SUGGESTION_SETTINGS };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		// Return defaults if nothing stored or empty string
		if (!stored) {
			return { ...DEFAULT_SUGGESTION_SETTINGS };
		}

		// Parse stored settings
		const parsed = JSON.parse(stored);

		// Validate that parsed value is an object
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			return { ...DEFAULT_SUGGESTION_SETTINGS };
		}

		// Merge with defaults to ensure all properties exist
		const merged: SuggestionSettings = {
			enableAutoAnalysis: parsed.enableAutoAnalysis ?? DEFAULT_SUGGESTION_SETTINGS.enableAutoAnalysis,
			analysisFrequencyHours: parsed.analysisFrequencyHours ?? DEFAULT_SUGGESTION_SETTINGS.analysisFrequencyHours,
			minRelevanceScore: parsed.minRelevanceScore ?? DEFAULT_SUGGESTION_SETTINGS.minRelevanceScore,
			enabledSuggestionTypes: parsed.enabledSuggestionTypes ?? DEFAULT_SUGGESTION_SETTINGS.enabledSuggestionTypes,
			maxSuggestionsPerType: parsed.maxSuggestionsPerType ?? DEFAULT_SUGGESTION_SETTINGS.maxSuggestionsPerType
		};

		return merged;
	} catch (error) {
		// Return defaults on any error (JSON parse error, etc.)
		return { ...DEFAULT_SUGGESTION_SETTINGS };
	}
}

/**
 * Update suggestion settings with partial changes.
 * Validates input and persists to localStorage.
 */
export async function updateSettings(partial: Partial<SuggestionSettings>): Promise<SuggestionSettings> {
	// Validate inputs
	if (partial.analysisFrequencyHours !== undefined) {
		if (partial.analysisFrequencyHours <= 0) {
			throw new Error('Analysis frequency must be a positive number');
		}
	}

	if (partial.minRelevanceScore !== undefined) {
		if (partial.minRelevanceScore < 0 || partial.minRelevanceScore > 100) {
			throw new Error('Relevance score must be between 0 and 100');
		}
	}

	if (partial.maxSuggestionsPerType !== undefined) {
		if (partial.maxSuggestionsPerType < 0) {
			throw new Error('Max suggestions per type must be a positive number');
		}
	}

	if (partial.enabledSuggestionTypes !== undefined) {
		// Validate all types are valid
		for (const type of partial.enabledSuggestionTypes) {
			if (!VALID_SUGGESTION_TYPES.includes(type)) {
				throw new Error(`Invalid suggestion type: ${type}`);
			}
		}
	}

	// Get current settings
	const current = await getSettings();

	// Merge with partial updates
	const updated: SuggestionSettings = {
		...current,
		...partial
	};

	// Persist to localStorage
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	}

	return updated;
}

/**
 * Reset all settings to default values.
 */
export async function resetToDefaults(): Promise<SuggestionSettings> {
	const defaults = { ...DEFAULT_SUGGESTION_SETTINGS };

	// Persist to localStorage
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
	}

	return defaults;
}
