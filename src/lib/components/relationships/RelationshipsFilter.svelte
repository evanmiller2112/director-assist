<script lang="ts">
	import type { RelationshipFilterOptions } from '$lib/types/relationships';

	interface Props {
		filterOptions: RelationshipFilterOptions;
		availableRelationshipTypes: string[];
		availableEntityTypes: string[];
		onFilterChange: (options: RelationshipFilterOptions) => void;
	}

	let { filterOptions = {}, availableRelationshipTypes, availableEntityTypes, onFilterChange }: Props = $props();

	// Local state for controlled inputs
	let relationshipType = $state(filterOptions?.relationshipType ?? '');
	let targetEntityType = $state(filterOptions?.targetEntityType ?? '');
	let strength = $state(filterOptions?.strength ?? 'all');
	let searchQuery = $state(filterOptions?.searchQuery ?? '');

	// Update local state when props change
	$effect(() => {
		relationshipType = filterOptions?.relationshipType ?? '';
		targetEntityType = filterOptions?.targetEntityType ?? '';
		strength = filterOptions?.strength ?? 'all';
		searchQuery = filterOptions?.searchQuery ?? '';
	});

	function handleRelationshipTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		relationshipType = value;
		updateFilters({ relationshipType: value || undefined });
	}

	function handleEntityTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		targetEntityType = value;
		updateFilters({ targetEntityType: value || undefined });
	}

	function handleStrengthChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'strong' | 'moderate' | 'weak' | 'all';
		// Don't call if value hasn't changed
		if (value === strength) return;
		strength = value;
		updateFilters({ strength: value });
	}

	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;
		updateFilters({ searchQuery: value });
	}

	function updateFilters(changes: Partial<RelationshipFilterOptions>) {
		onFilterChange({
			...filterOptions,
			...changes
		});
	}

	function clearFilters() {
		relationshipType = '';
		targetEntityType = '';
		strength = 'all';
		searchQuery = '';
		onFilterChange({});
	}
</script>

<div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<!-- Relationship Type Filter -->
		<div>
			<label for="relationship-type-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
				Relationship Type
			</label>
			<select
				id="relationship-type-filter"
				value={relationshipType}
				onchange={handleRelationshipTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
			>
				{#if availableRelationshipTypes.length > 0}
					<option value="">Any</option>
				{/if}
				{#each availableRelationshipTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<!-- Entity Type Filter -->
		<div>
			<label for="entity-type-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
				Entity Type
			</label>
			<select
				id="entity-type-filter"
				value={targetEntityType}
				onchange={handleEntityTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
			>
				{#if availableEntityTypes.length > 0}
					<option value="">All</option>
				{/if}
				{#each availableEntityTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>

		<!-- Strength Filter -->
		<div>
			<label for="strength-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
				Strength
			</label>
			<select
				id="strength-filter"
				value={strength}
				onchange={handleStrengthChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
			>
				{#if availableRelationshipTypes.length === 0 && availableEntityTypes.length === 0}
					<option value="all">All</option>
				{:else}
					<option value="all">-</option>
				{/if}
				<option value="strong">Strong</option>
				<option value="moderate">Moderate</option>
				<option value="weak">Weak</option>
			</select>
		</div>

		<!-- Search Input -->
		<div>
			<label for="search-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
				Search
			</label>
			<input
				id="search-filter"
				type="text"
				value={searchQuery}
				oninput={handleSearchInput}
				placeholder="Search relationships..."
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
			/>
		</div>
	</div>

	<!-- Clear Filters Button -->
	<div class="mt-4 flex justify-end">
		<button
			type="button"
			onclick={clearFilters}
			class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
		>
			Clear Filters
		</button>
	</div>
</div>
