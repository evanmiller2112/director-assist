<script lang="ts">
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { AISuggestionType, AISuggestionStatus } from '$lib/types/ai';

	interface Props {
		selectedTypes?: AISuggestionType[];
		selectedStatuses?: AISuggestionStatus[];
		minRelevance?: number;
		typeCounts?: Partial<Record<AISuggestionType, number>>;
		onTypesChange?: (types: AISuggestionType[]) => void;
		onStatusesChange?: (statuses: AISuggestionStatus[]) => void;
		onMinRelevanceChange?: (minRelevance: number) => void;
		onReset?: () => void;
	}

	let {
		selectedTypes = [],
		selectedStatuses = [],
		minRelevance = 0,
		typeCounts,
		onTypesChange,
		onStatusesChange,
		onMinRelevanceChange,
		onReset
	}: Props = $props();

	// Collapsible section state
	let typeExpanded = $state(true);
	let statusExpanded = $state(true);

	// All available types
	const allTypes: AISuggestionType[] = [
		'relationship',
		'plot_thread',
		'inconsistency',
		'enhancement',
		'recommendation'
	];

	// All available statuses
	const allStatuses: AISuggestionStatus[] = ['pending', 'accepted', 'dismissed'];

	// Check if filters are active
	const hasActiveFilters = $derived(
		selectedTypes.length > 0 || selectedStatuses.length > 0 || minRelevance > 0
	);

	// Handle type checkbox change
	function handleTypeChange(type: AISuggestionType, checked: boolean) {
		if (!onTypesChange) return;

		let newTypes: AISuggestionType[];
		if (checked) {
			newTypes = [...selectedTypes, type];
		} else {
			newTypes = selectedTypes.filter(t => t !== type);
		}
		onTypesChange(newTypes);
	}

	// Handle status checkbox change
	function handleStatusChange(status: AISuggestionStatus, checked: boolean) {
		if (!onStatusesChange) return;

		let newStatuses: AISuggestionStatus[];
		if (checked) {
			newStatuses = [...selectedStatuses, status];
		} else {
			newStatuses = selectedStatuses.filter(s => s !== status);
		}
		onStatusesChange(newStatuses);
	}

	// Handle relevance slider change
	function handleRelevanceChange(event: Event) {
		if (!onMinRelevanceChange) return;

		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value, 10);
		onMinRelevanceChange(value);
	}

	// Select all types
	function handleSelectAllTypes() {
		if (onTypesChange) {
			onTypesChange([...allTypes]);
		}
	}

	// Clear all types
	function handleClearAllTypes() {
		if (onTypesChange) {
			onTypesChange([]);
		}
	}

	// Reset all filters
	function handleReset() {
		if (onReset) {
			onReset();
		}
	}

	// Format type label
	function formatTypeLabel(type: AISuggestionType): string {
		return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	}

	// Format status label
	function formatStatusLabel(status: AISuggestionStatus): string {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="space-y-4 p-4 border-b border-slate-200 dark:border-slate-700">
	<!-- Type Filters -->
	<div>
		<button
			type="button"
			class="flex items-center justify-between w-full text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
			onclick={() => (typeExpanded = !typeExpanded)}
			aria-expanded={typeExpanded}
		>
			<span>Type</span>
			{#if typeExpanded}
				<ChevronUp class="w-4 h-4" />
			{:else}
				<ChevronDown class="w-4 h-4" />
			{/if}
		</button>

		{#if typeExpanded}
			<div class="space-y-2">
				<!-- All/None buttons -->
				<div class="flex gap-2 mb-2">
					<button
						type="button"
						class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
						onclick={handleSelectAllTypes}
					>
						All
					</button>
					<button
						type="button"
						class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
						onclick={handleClearAllTypes}
					>
						None
					</button>
				</div>

				<!-- Type checkboxes -->
				{#each allTypes as type}
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={selectedTypes.includes(type)}
							onchange={(e) => handleTypeChange(type, e.currentTarget.checked)}
							class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
							aria-label={formatTypeLabel(type)}
						/>
						<span class="flex-1 text-slate-700 dark:text-slate-300">
							{formatTypeLabel(type)}
						</span>
						{#if typeCounts && typeCounts[type] !== undefined}
							<span class="text-xs text-slate-500 dark:text-slate-400">
								{typeCounts[type]}
							</span>
						{/if}
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Status Filters -->
	<div>
		<button
			type="button"
			class="flex items-center justify-between w-full text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
			onclick={() => (statusExpanded = !statusExpanded)}
			aria-expanded={statusExpanded}
		>
			<span>Status</span>
			{#if statusExpanded}
				<ChevronUp class="w-4 h-4" />
			{:else}
				<ChevronDown class="w-4 h-4" />
			{/if}
		</button>

		{#if statusExpanded}
			<div class="space-y-2">
				{#each allStatuses as status}
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={selectedStatuses.includes(status)}
							onchange={(e) => handleStatusChange(status, e.currentTarget.checked)}
							class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
							aria-label={formatStatusLabel(status)}
						/>
						<span class="text-slate-700 dark:text-slate-300">
							{formatStatusLabel(status)}
						</span>
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Relevance Slider -->
	<div>
		<label for="relevance-slider" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
			Relevance
		</label>
		<div class="space-y-2">
			<div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
				<span>Min: {minRelevance}</span>
			</div>
			<input
				id="relevance-slider"
				type="range"
				min="0"
				max="100"
				value={minRelevance}
				oninput={handleRelevanceChange}
				class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
				aria-label="Minimum relevance score"
			/>
		</div>
	</div>

	<!-- Reset Button -->
	<div>
		<button
			type="button"
			class="w-full px-3 py-2 text-sm font-medium rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
			onclick={handleReset}
			disabled={!hasActiveFilters}
		>
			Reset
		</button>
	</div>
</div>
