<script lang="ts">
	import { getAllEntityTypes } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';
	import type { MatrixFilterOptions, MatrixSortOptions } from '$lib/types/matrix';
	import type { EntityType } from '$lib/types';

	interface Props {
		filterOptions: MatrixFilterOptions;
		sortOptions: MatrixSortOptions;
		availableRelationshipTypes: string[];
		onFilterChange: (options: MatrixFilterOptions) => void;
		onSortChange: (options: MatrixSortOptions) => void;
	}

	let { filterOptions, sortOptions, availableRelationshipTypes, onFilterChange, onSortChange }: Props = $props();

	// Get all entity types
	const allEntityTypes = $derived(
		getAllEntityTypes(campaignStore.customEntityTypes, campaignStore.entityTypeOverrides)
	);

	// Local state for controlled inputs
	let rowEntityType = $state(filterOptions.rowEntityType);
	let columnEntityType = $state(filterOptions.columnEntityType);
	let relationshipType = $state(filterOptions.relationshipType ?? '');
	let hideEmptyRows = $state(filterOptions.hideEmptyRows ?? false);
	let hideEmptyColumns = $state(filterOptions.hideEmptyColumns ?? false);

	let rowSort = $state(sortOptions.rowSort);
	let columnSort = $state(sortOptions.columnSort);
	let rowDirection = $state(sortOptions.rowDirection);
	let columnDirection = $state(sortOptions.columnDirection);

	// Update local state when props change
	$effect(() => {
		rowEntityType = filterOptions.rowEntityType;
		columnEntityType = filterOptions.columnEntityType;
		relationshipType = filterOptions.relationshipType ?? '';
		hideEmptyRows = filterOptions.hideEmptyRows ?? false;
		hideEmptyColumns = filterOptions.hideEmptyColumns ?? false;
	});

	$effect(() => {
		rowSort = sortOptions.rowSort;
		columnSort = sortOptions.columnSort;
		rowDirection = sortOptions.rowDirection;
		columnDirection = sortOptions.columnDirection;
	});

	function handleRowEntityTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as EntityType;
		rowEntityType = value;
		onFilterChange({ ...filterOptions, rowEntityType: value });
	}

	function handleColumnEntityTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as EntityType;
		columnEntityType = value;
		onFilterChange({ ...filterOptions, columnEntityType: value });
	}

	function handleRelationshipTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		relationshipType = value;
		onFilterChange({ ...filterOptions, relationshipType: value || undefined });
	}

	function handleHideEmptyRowsChange(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		hideEmptyRows = checked;
		onFilterChange({ ...filterOptions, hideEmptyRows: checked });
	}

	function handleHideEmptyColumnsChange(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		hideEmptyColumns = checked;
		onFilterChange({ ...filterOptions, hideEmptyColumns: checked });
	}

	function handleRowSortChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'alphabetical' | 'connectionCount';
		rowSort = value;
		onSortChange({ ...sortOptions, rowSort: value });
	}

	function handleColumnSortChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'alphabetical' | 'connectionCount';
		columnSort = value;
		onSortChange({ ...sortOptions, columnSort: value });
	}

	function handleRowDirectionChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'asc' | 'desc';
		rowDirection = value;
		onSortChange({ ...sortOptions, rowDirection: value });
	}

	function handleColumnDirectionChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as 'asc' | 'desc';
		columnDirection = value;
		onSortChange({ ...sortOptions, columnDirection: value });
	}
</script>

<div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-6">
	<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Matrix Controls</h2>

	<!-- Entity Type Selectors -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
		<div>
			<label for="row-entity-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Row Entity Type
			</label>
			<select
				id="row-entity-type"
				value={rowEntityType}
				onchange={handleRowEntityTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				{#each allEntityTypes as entityType}
					<option value={entityType.type}>{entityType.labelPlural}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="column-entity-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Column Entity Type
			</label>
			<select
				id="column-entity-type"
				value={columnEntityType}
				onchange={handleColumnEntityTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				{#each allEntityTypes as entityType}
					<option value={entityType.type}>{entityType.labelPlural}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Filters -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
		<div>
			<label for="relationship-type-filter" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Relationship Type
			</label>
			<select
				id="relationship-type-filter"
				value={relationshipType}
				onchange={handleRelationshipTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="">All Types</option>
				{#each availableRelationshipTypes as relType}
					<option value={relType}>{relType}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-end">
			<label class="flex items-center space-x-2 cursor-pointer">
				<input
					type="checkbox"
					checked={hideEmptyRows}
					onchange={handleHideEmptyRowsChange}
					class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Hide empty rows</span>
			</label>
		</div>

		<div class="flex items-end">
			<label class="flex items-center space-x-2 cursor-pointer">
				<input
					type="checkbox"
					checked={hideEmptyColumns}
					onchange={handleHideEmptyColumnsChange}
					class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Hide empty columns</span>
			</label>
		</div>
	</div>

	<!-- Sort Controls -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div>
			<label for="row-sort" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Row Sort
			</label>
			<select
				id="row-sort"
				value={rowSort}
				onchange={handleRowSortChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="alphabetical">Alphabetical</option>
				<option value="connectionCount">Connection Count</option>
			</select>
		</div>

		<div>
			<label for="row-direction" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Row Direction
			</label>
			<select
				id="row-direction"
				value={rowDirection}
				onchange={handleRowDirectionChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="asc">Ascending</option>
				<option value="desc">Descending</option>
			</select>
		</div>

		<div>
			<label for="column-sort" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Column Sort
			</label>
			<select
				id="column-sort"
				value={columnSort}
				onchange={handleColumnSortChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="alphabetical">Alphabetical</option>
				<option value="connectionCount">Connection Count</option>
			</select>
		</div>

		<div>
			<label for="column-direction" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
				Column Direction
			</label>
			<select
				id="column-direction"
				value={columnDirection}
				onchange={handleColumnDirectionChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="asc">Ascending</option>
				<option value="desc">Descending</option>
			</select>
		</div>
	</div>
</div>
