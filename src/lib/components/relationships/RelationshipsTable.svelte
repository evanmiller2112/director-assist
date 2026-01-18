<script lang="ts">
	import type { BaseEntity, EntityLink } from '$lib/types';
	import type { RelationshipSortOptions } from '$lib/types/relationships';
	import RelationshipRow from './RelationshipRow.svelte';
	import { ChevronUp, ChevronDown } from 'lucide-svelte';

	interface Props {
		relationships: Array<{ entity: BaseEntity; link: EntityLink; isReverse: boolean }>;
		selectedIds: Set<string>;
		sortOptions: RelationshipSortOptions;
		onSelect: (linkId: string, selected: boolean) => void;
		onSelectAll: (selected: boolean) => void;
		onSort: (options: RelationshipSortOptions) => void;
		onRemove: (linkId: string) => void;
	}

	let { relationships, selectedIds, sortOptions, onSelect, onSelectAll, onSort, onRemove }: Props = $props();

	// Determine checkbox state
	const allSelected = $derived(
		relationships.length > 0 && relationships.every(r => selectedIds.has(r.link.id))
	);
	const someSelected = $derived(
		!allSelected && relationships.some(r => selectedIds.has(r.link.id))
	);

	// Reference for indeterminate checkbox state
	let selectAllCheckbox: HTMLInputElement;

	$effect(() => {
		if (selectAllCheckbox) {
			selectAllCheckbox.indeterminate = someSelected;
		}
	});

	function handleSelectAllChange() {
		onSelectAll(!allSelected);
	}

	function handleSort(field: RelationshipSortOptions['field']) {
		const newDirection = sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc';
		onSort({ field, direction: newDirection });
	}

	function getSortIcon(field: RelationshipSortOptions['field']) {
		if (sortOptions.field !== field) return null;
		return sortOptions.direction === 'asc' ? ChevronUp : ChevronDown;
	}

	function getSortIndicator(field: RelationshipSortOptions['field']): string {
		if (sortOptions.field !== field) return '';
		return sortOptions.direction === 'asc' ? ' ▲' : ' ▼';
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse">
		<thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
			<tr>
				<!-- Select All Checkbox -->
				<th class="px-4 py-3 text-left w-12">
					<input
						bind:this={selectAllCheckbox}
						type="checkbox"
						checked={allSelected}
						onchange={handleSelectAllChange}
						class="rounded border-slate-300 dark:border-slate-600"
						aria-label="Select all"
					/>
				</th>

				<!-- Target Name (sortable) -->
				<th
					class="px-4 py-3 text-left cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
					onclick={() => handleSort('targetName')}
					role="columnheader"
				>
					Target{getSortIndicator('targetName')}
				</th>

				<!-- Type (non-sortable) -->
				<th class="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
					Type
				</th>

				<!-- Relationship (sortable) -->
				<th
					class="px-4 py-3 text-left cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
					onclick={() => handleSort('relationship')}
					role="columnheader"
				>
					Relationship{getSortIndicator('relationship')}
				</th>

				<!-- Strength (sortable) -->
				<th
					class="px-4 py-3 text-left cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
					onclick={() => handleSort('strength')}
					role="columnheader"
				>
					Strength{getSortIndicator('strength')}
				</th>

				<!-- Actions -->
				<th class="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
					Actions
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200 dark:divide-slate-700">
			{#if relationships.length === 0}
				<tr>
					<td colspan="6" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
						No relationships found
					</td>
				</tr>
			{:else}
				{#each relationships as { entity, link, isReverse } (link.id)}
					<RelationshipRow
						linkedEntity={entity}
						{link}
						{isReverse}
						selected={selectedIds.has(link.id)}
						onSelect={(selected) => onSelect(link.id, selected)}
						onRemove={() => onRemove(link.id)}
					/>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
