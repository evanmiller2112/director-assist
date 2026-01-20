import { suggestionRepository } from '$lib/db/repositories/suggestionRepository';
import type { AISuggestion, AISuggestionType, AISuggestionStatus } from '$lib/types/ai';

// Suggestion store using Svelte 5 runes
function createSuggestionStore() {
	let suggestions = $state<AISuggestion[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let panelOpen = $state(false);

	// Filter state
	let filterTypes = $state<AISuggestionType[]>([]);
	let filterStatuses = $state<AISuggestionStatus[]>([]);
	let filterMinRelevance = $state(0);

	// Sort state
	let sortBy = $state<'relevance' | 'date' | 'type'>('relevance');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	// Derived state: filtered and sorted suggestions
	const filteredSuggestions = $derived.by(() => {
		let result = [...suggestions];

		// Apply type filter
		if (filterTypes.length > 0) {
			const typeSet = new Set(filterTypes);
			result = result.filter(s => typeSet.has(s.type));
		}

		// Apply status filter
		if (filterStatuses.length > 0) {
			const statusSet = new Set(filterStatuses);
			result = result.filter(s => statusSet.has(s.status));
		}

		// Apply relevance filter
		if (filterMinRelevance > 0) {
			result = result.filter(s => s.relevanceScore >= filterMinRelevance);
		}

		// Sort
		result.sort((a, b) => {
			let comparison = 0;

			if (sortBy === 'relevance') {
				comparison = a.relevanceScore - b.relevanceScore;
			} else if (sortBy === 'date') {
				comparison = a.createdAt.getTime() - b.createdAt.getTime();
			} else if (sortBy === 'type') {
				comparison = a.type.localeCompare(b.type);
			}

			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return result;
	});

	// Derived state: count of pending suggestions
	const pendingCount = $derived.by(() => {
		return suggestions.filter(s => s.status === 'pending').length;
	});

	// Derived state: count by type
	const statsByType = $derived.by(() => {
		const stats: Partial<Record<AISuggestionType, number>> = {};
		for (const suggestion of suggestions) {
			stats[suggestion.type] = (stats[suggestion.type] || 0) + 1;
		}
		return stats;
	});

	return {
		get suggestions() {
			return suggestions;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get panelOpen() {
			return panelOpen;
		},
		get filterTypes() {
			return filterTypes;
		},
		get filterStatuses() {
			return filterStatuses;
		},
		get filterMinRelevance() {
			return filterMinRelevance;
		},
		get sortBy() {
			return sortBy;
		},
		get sortOrder() {
			return sortOrder;
		},
		get filteredSuggestions() {
			return filteredSuggestions;
		},
		get pendingCount() {
			return pendingCount;
		},
		get statsByType() {
			return statsByType;
		},

		// Actions
		async load() {
			isLoading = true;
			error = null;

			try {
				// getAll() returns an Observable, subscribe to it
				const result = suggestionRepository.getAll();

				// Handle both Observable (production) and Promise (tests)
				if (result && typeof result.subscribe === 'function') {
					// Observable pattern (production with liveQuery)
					result.subscribe({
						next: (results) => {
							suggestions = results;
							isLoading = false;
						},
						error: (e) => {
							error = e instanceof Error ? e.message : 'Failed to load suggestions';
							isLoading = false;
						}
					});
				} else if (result && typeof (result as unknown as Promise<AISuggestion[]>).then === 'function') {
					// Promise pattern (tests) - use type assertion for test compatibility
					const data = await (result as unknown as Promise<AISuggestion[]>);
					suggestions = data;
					isLoading = false;
				} else {
					throw new Error('Unexpected return type from getAll()');
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load suggestions';
				isLoading = false;
			}
		},

		async accept(id: string) {
			try {
				error = null;
				await suggestionRepository.update(id, { status: 'accepted' });
				await this.load();
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to accept suggestion';
			}
		},

		async dismiss(id: string) {
			try {
				error = null;
				await suggestionRepository.update(id, { status: 'dismissed' });
				await this.load();
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to dismiss suggestion';
			}
		},

		// Panel control
		openPanel() {
			panelOpen = true;
		},

		closePanel() {
			panelOpen = false;
		},

		togglePanel() {
			panelOpen = !panelOpen;
		},

		// Filter controls
		setFilterTypes(types: AISuggestionType[]) {
			filterTypes = types;
		},

		setFilterStatuses(statuses: AISuggestionStatus[]) {
			filterStatuses = statuses;
		},

		setFilterMinRelevance(min: number) {
			filterMinRelevance = min;
		},

		clearFilters() {
			filterTypes = [];
			filterStatuses = [];
			filterMinRelevance = 0;
		},

		// Sort controls
		setSortBy(field: 'relevance' | 'date' | 'type') {
			sortBy = field;
		},

		setSortOrder(order: 'asc' | 'desc') {
			sortOrder = order;
		},

		toggleSortOrder() {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		}
	};
}

export const suggestionStore = createSuggestionStore();
