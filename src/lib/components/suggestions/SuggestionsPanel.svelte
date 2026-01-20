<script lang="ts">
	import { onMount } from 'svelte';
	import { X, RefreshCw, Filter, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, AlertCircle } from 'lucide-svelte';
	import { suggestionStore } from '$lib/stores';
	import SuggestionCard from './SuggestionCard.svelte';
	import SuggestionFilters from './SuggestionFilters.svelte';

	let filtersVisible = $state(false);

	const isLoading = $derived(suggestionStore.isLoading);
	const error = $derived(suggestionStore.error);
	const filteredSuggestions = $derived(suggestionStore.filteredSuggestions);
	const pendingCount = $derived(suggestionStore.pendingCount);
	const sortBy = $derived(suggestionStore.sortBy);
	const sortOrder = $derived(suggestionStore.sortOrder);

	onMount(() => {
		suggestionStore.load();
	});

	function handleRefresh() {
		suggestionStore.load();
	}

	function handleClose() {
		suggestionStore.closePanel();
	}

	function toggleFilters() {
		filtersVisible = !filtersVisible;
	}

	function handleSortChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value as 'relevance' | 'date' | 'type';
		suggestionStore.setSortBy(value);
	}

	function toggleSortOrder() {
		suggestionStore.toggleSortOrder();
	}

	async function handleAccept(suggestion: any) {
		await suggestionStore.accept(suggestion.id);
	}

	async function handleDismiss(suggestion: any) {
		await suggestionStore.dismiss(suggestion.id);
	}

	function handleViewDetails(suggestion: any) {
		// TODO: Implement details view in future phase
		console.log('View details:', suggestion);
	}

	const SortIcon = $derived(sortOrder === 'asc' ? ArrowUp : ArrowDown);
</script>

<aside
	class="fixed right-0 top-0 h-full w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark flex flex-col z-40"
>
	<!-- Header -->
	<div
		class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700"
	>
		<div class="flex items-center gap-2">
			<h2 class="text-lg font-semibold text-slate-900 dark:text-white">AI Suggestions</h2>
			{#if pendingCount > 0}
				<span
					class="badge inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
				>
					{pendingCount > 99 ? '99+' : pendingCount}
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
				onclick={handleRefresh}
				disabled={isLoading}
				title="Refresh"
				aria-label="Refresh suggestions"
			>
				<RefreshCw class={isLoading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
			</button>
			<button
				type="button"
				class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
				onclick={toggleFilters}
				title="Toggle filters"
				aria-label="Toggle filters"
				aria-expanded={filtersVisible}
			>
				<Filter class="w-4 h-4" />
			</button>
			<button
				type="button"
				class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
				onclick={handleClose}
				title="Close"
				aria-label="Close suggestions panel"
			>
				<X class="w-5 h-5" />
			</button>
		</div>
	</div>

	<!-- Sort Controls -->
	<div class="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
		<label for="sort-by" class="text-sm text-slate-600 dark:text-slate-400">Sort by:</label>
		<select
			id="sort-by"
			value={sortBy}
			onchange={handleSortChange}
			class="flex-1 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
			aria-label="Sort suggestions by"
		>
			<option value="relevance">Relevance</option>
			<option value="date">Date</option>
			<option value="type">Type</option>
		</select>
		<button
			type="button"
			class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
			onclick={toggleSortOrder}
			title="Toggle sort order"
			aria-label="Toggle sort order - {sortOrder === 'asc' ? 'ascending' : 'descending'}"
		>
			<SortIcon class="w-4 h-4" />
		</button>
	</div>

	<!-- Filters (collapsible) -->
	{#if filtersVisible}
		<div aria-hidden={!filtersVisible}>
			<SuggestionFilters
				selectedTypes={suggestionStore.filterTypes}
				selectedStatuses={suggestionStore.filterStatuses}
				minRelevance={suggestionStore.filterMinRelevance}
				typeCounts={suggestionStore.statsByType}
				onTypesChange={(types) => suggestionStore.setFilterTypes(types)}
				onStatusesChange={(statuses) => suggestionStore.setFilterStatuses(statuses)}
				onMinRelevanceChange={(min) => suggestionStore.setFilterMinRelevance(min)}
				onReset={() => suggestionStore.clearFilters()}
			/>
		</div>
	{:else}
		<div aria-hidden="true"></div>
	{/if}

	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		{#if isLoading}
			<!-- Loading state -->
			<div class="p-4 space-y-4" role="status" aria-label="Loading suggestions">
				{#each Array(3) as _}
					<div class="animate-pulse border border-slate-200 dark:border-slate-700 rounded-lg p-4">
						<div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
						<div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
						<div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
					</div>
				{/each}
			</div>
		{:else if error}
			<!-- Error state -->
			<div class="flex flex-col items-center justify-center p-8 text-center">
				<AlertCircle class="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
				<h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
					Error Loading Suggestions
				</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">
					{error}
				</p>
				<button
					type="button"
					class="btn btn-primary text-sm"
					onclick={handleRefresh}
					aria-label="Try again"
				>
					Try Again
				</button>
			</div>
		{:else if filteredSuggestions.length === 0}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center p-8 text-center">
				<Sparkles class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
				<h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No Suggestions</h3>
				<p class="text-sm text-slate-500 dark:text-slate-400">
					Run an analysis to get AI-powered suggestions for your campaign. Check back later!
				</p>
			</div>
		{:else}
			<!-- Suggestion list -->
			<div class="p-4 space-y-3">
				{#each filteredSuggestions as suggestion (suggestion.id)}
					<SuggestionCard
						{suggestion}
						onAccept={handleAccept}
						onDismiss={handleDismiss}
						onViewDetails={handleViewDetails}
					/>
				{/each}
			</div>
		{/if}
	</div>
</aside>
