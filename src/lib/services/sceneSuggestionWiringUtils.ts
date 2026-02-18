/**
 * Scene Suggestion Wiring Utilities (Issue #548)
 *
 * Pure helper functions that connect the scene form fields (location,
 * npcsPresent) to the suggestion service and manage the resulting state.
 * These are plain functions — no Svelte reactivity — so they are trivially
 * unit-testable without a DOM environment.
 */

import { getSceneSuggestions, type EntitySuggestion } from '$lib/services/sceneSuggestionService';

/**
 * Called when the scene form's `location` field changes.
 *
 * - Returns [] immediately when locationId is falsy (empty string, undefined,
 *   null) so that clearing the location also clears the suggestion list.
 * - Delegates to getSceneSuggestions, passing the currently-selected NPC IDs
 *   as excludeIds so they are omitted from suggestions.
 * - Returns [] on any service error or null result to keep the UI safe.
 */
export async function handleLocationChange(
	locationId: string,
	selectedNpcIds: string[]
): Promise<EntitySuggestion[]> {
	if (!locationId) return [];

	try {
		const result = await getSceneSuggestions(locationId, { excludeIds: selectedNpcIds });
		return result ?? [];
	} catch {
		return [];
	}
}

/**
 * Adds a single suggested NPC ID to the npcsPresent list.
 *
 * - Never mutates the original array.
 * - Never adds a duplicate.
 */
export function addSuggestedNpc(currentIds: string[], newId: string): string[] {
	if (currentIds.includes(newId)) {
		return [...currentIds];
	}
	return [...currentIds, newId];
}

/**
 * Adds all suggested entity IDs to the npcsPresent list at once.
 *
 * - Never mutates the original array.
 * - Deduplicates against both existing selections and suggestion IDs.
 */
export function addAllSuggestedNpcs(
	currentIds: string[],
	suggestions: EntitySuggestion[]
): string[] {
	const seen = new Set(currentIds);
	const result = [...currentIds];

	for (const suggestion of suggestions) {
		const id = suggestion.entity.id;
		if (!seen.has(id)) {
			seen.add(id);
			result.push(id);
		}
	}

	return result;
}
