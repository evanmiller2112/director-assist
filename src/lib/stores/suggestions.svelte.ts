/**
 * Suggestions Store (Svelte 5 Runes Implementation)
 *
 * Manages AI suggestions state and actions using Svelte 5 runes.
 * Implements functionality for loading, filtering, accepting, dismissing, and executing suggestions.
 */

import { suggestionRepository } from '$lib/db/repositories';
import { executeAction as executeActionService, getActionHistory } from '$lib/services/suggestionActionService';
import type { AISuggestion, SuggestionQueryFilters } from '$lib/types';

function createSuggestionsStore() {
	let suggestions = $state<AISuggestion[]>([]);
	let loading = $state(false);
	let filters = $state<SuggestionQueryFilters>({});
	let actionHistory = $state<any[]>([]);

	// Derived state for filtered suggestions
	const filteredSuggestions = $derived.by(() => {
		let result = suggestions;

		if (filters.types && filters.types.length > 0) {
			result = result.filter(s => filters.types!.includes(s.type));
		}

		if (filters.statuses && filters.statuses.length > 0) {
			result = result.filter(s => filters.statuses!.includes(s.status));
		}

		if (filters.minRelevanceScore !== undefined) {
			result = result.filter(s => s.relevanceScore >= filters.minRelevanceScore!);
		}

		if (filters.affectedEntityIds && filters.affectedEntityIds.length > 0) {
			result = result.filter(s =>
				s.affectedEntityIds.some(id => filters.affectedEntityIds!.includes(id))
			);
		}

		return result;
	});

	return {
		get suggestions() {
			return suggestions;
		},
		get filteredSuggestions() {
			return filteredSuggestions;
		},
		get loading() {
			return loading;
		},
		get filters() {
			return filters;
		},
		get actionHistory() {
			return actionHistory;
		},

		async loadSuggestions(): Promise<void> {
			loading = true;
			try {
				// Subscribe to the observable and get the initial data
				const observable = suggestionRepository.getAll();
				observable.subscribe({
					next: (data) => {
						suggestions = data;
						loading = false;
					},
					error: (e) => {
						console.error('Failed to load suggestions:', e);
						loading = false;
						throw e;
					}
				});
			} catch (e) {
				console.error('Failed to load suggestions:', e);
				loading = false;
				throw e;
			}
		},

		async dismissSuggestion(id: string): Promise<void> {
			try {
				await suggestionRepository.dismiss(id);
				// Update local state
				const index = suggestions.findIndex(s => s.id === id);
				if (index !== -1) {
					suggestions[index] = { ...suggestions[index], status: 'dismissed' as const };
				}
			} catch (e) {
				console.error('Failed to dismiss suggestion:', e);
				throw e;
			}
		},

		async acceptSuggestion(id: string): Promise<void> {
			try {
				await suggestionRepository.accept(id);
				// Update local state
				const index = suggestions.findIndex(s => s.id === id);
				if (index !== -1) {
					suggestions[index] = { ...suggestions[index], status: 'accepted' as const };
				}
			} catch (e) {
				console.error('Failed to accept suggestion:', e);
			}
		},

		filterSuggestions(newFilters: SuggestionQueryFilters): void {
			// If empty object, clear filters
			if (Object.keys(newFilters).length === 0) {
				filters = {};
			} else {
				filters = { ...filters, ...newFilters };
			}
		},

		async executeAction(suggestion: AISuggestion): Promise<any> {
			loading = true;
			try {
				// Check if suggestion has a suggested action
				if (!suggestion.suggestedAction) {
					return { success: false, error: 'No action to execute' };
				}

				// Execute the action
				const result = await executeActionService(suggestion);

				// If successful, update suggestion status to accepted
				if (result.success) {
					await this.acceptSuggestion(suggestion.id);
				}

				// Refresh action history
				await this.refreshActionHistory();

				return result;
			} catch (e) {
				console.error('Failed to execute action:', e);
				return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
			} finally {
				loading = false;
			}
		},

		async bulkDismiss(suggestionIds: string[]): Promise<number> {
			loading = true;
			let successCount = 0;

			try {
				for (const id of suggestionIds) {
					try {
						await this.dismissSuggestion(id);
						successCount++;
					} catch (e) {
						// Continue with other suggestions even if one fails
						console.error(`Failed to dismiss suggestion ${id}:`, e);
					}
				}
			} finally {
				loading = false;
			}

			return successCount;
		},

		async refreshActionHistory(): Promise<void> {
			try {
				const history = await getActionHistory();
				actionHistory = history;
			} catch (e) {
				console.error('Failed to refresh action history:', e);
			}
		}
	};
}

export const suggestionsStore = createSuggestionsStore();
