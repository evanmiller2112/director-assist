<script lang="ts">
	/**
	 * NetworkFilterPanel Component
	 *
	 * Issue #74: Network Diagram Visualization
	 * Filter panel for entity types and relationship types
	 */
	import type { NetworkFilterOptions } from '$lib/types/network';
	import type { EntityType } from '$lib/types';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	interface Props {
		filters: NetworkFilterOptions;
		onFilterChange?: (filters: NetworkFilterOptions) => void;
		availableRelationships?: string[];
	}

	let { filters, onFilterChange, availableRelationships }: Props = $props();

	// All possible entity types
	const allEntityTypes: EntityType[] = [
		'character',
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'session',
		'deity',
		'timeline_event',
		'world_rule',
		'player_profile',
		'campaign'
	];

	// Collapsible section state
	let entityTypesExpanded = $state(true);
	let relationshipTypesExpanded = $state(true);

	// Selected entity types (all selected by default if no filter)
	let selectedEntityTypes = $state(new Set<EntityType>(allEntityTypes));

	// Selected relationship types (all selected by default if no filter)
	let selectedRelationshipTypes = $state(new Set<string>());

	// Initialize from filters prop
	$effect(() => {
		if (filters?.entityTypes) {
			selectedEntityTypes.clear();
			filters.entityTypes.forEach((type) => selectedEntityTypes.add(type));
		} else {
			selectedEntityTypes.clear();
			allEntityTypes.forEach((type) => selectedEntityTypes.add(type));
		}
	});

	$effect(() => {
		const rels = availableRelationships || [];
		if (filters?.relationshipTypes) {
			selectedRelationshipTypes.clear();
			filters.relationshipTypes.forEach((rel) => selectedRelationshipTypes.add(rel));
		} else {
			selectedRelationshipTypes.clear();
			rels.forEach((rel) => selectedRelationshipTypes.add(rel));
		}
	});

	// Format entity type for display
	function formatLabel(text: string): string {
		return text
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Handle entity type checkbox change
	function toggleEntityType(type: EntityType) {
		if (selectedEntityTypes.has(type)) {
			selectedEntityTypes.delete(type);
		} else {
			selectedEntityTypes.add(type);
		}
		emitFilterChange();
	}

	// Handle relationship type checkbox change
	function toggleRelationshipType(rel: string) {
		if (selectedRelationshipTypes.has(rel)) {
			selectedRelationshipTypes.delete(rel);
		} else {
			selectedRelationshipTypes.add(rel);
		}
		emitFilterChange();
	}

	// Select all entity types
	function selectAllEntityTypes() {
		allEntityTypes.forEach((type) => selectedEntityTypes.add(type));
		emitFilterChange();
	}

	// Deselect all entity types
	function deselectAllEntityTypes() {
		selectedEntityTypes.clear();
		emitFilterChange();
	}

	// Select all relationship types
	function selectAllRelationshipTypes() {
		(availableRelationships || []).forEach((rel) => selectedRelationshipTypes.add(rel));
		emitFilterChange();
	}

	// Deselect all relationship types
	function deselectAllRelationshipTypes() {
		selectedRelationshipTypes.clear();
		emitFilterChange();
	}

	// Reset all filters
	function resetFilters() {
		onFilterChange?.({});
	}

	// Emit filter change event
	function emitFilterChange() {
		if (!onFilterChange) return;

		const newFilters: NetworkFilterOptions = {};

		if (selectedEntityTypes.size > 0 && selectedEntityTypes.size < allEntityTypes.length) {
			newFilters.entityTypes = Array.from(selectedEntityTypes);
		}

		if (
			availableRelationships &&
			selectedRelationshipTypes.size > 0 &&
			selectedRelationshipTypes.size < availableRelationships.length
		) {
			newFilters.relationshipTypes = Array.from(selectedRelationshipTypes);
		}

		onFilterChange(newFilters);
	}

	// Deduplicate available relationships
	const uniqueRelationships = $derived(
		availableRelationships ? [...new Set(availableRelationships)] : []
	);
</script>

<div data-testid="network-filter-panel" class="space-y-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
	<!-- Entity Types Section -->
	<section data-testid="entity-types-section">
		<button
			type="button"
			class="flex items-center justify-between w-full text-left font-medium text-slate-900 dark:text-white mb-2"
			onclick={() => (entityTypesExpanded = !entityTypesExpanded)}
		>
			<span>
				Entity Types
				{#if selectedEntityTypes.size < allEntityTypes.length}
					({selectedEntityTypes.size})
				{/if}
			</span>
			{#if entityTypesExpanded}
				<ChevronDown class="w-4 h-4" />
			{:else}
				<ChevronRight class="w-4 h-4" />
			{/if}
		</button>

		{#if entityTypesExpanded}
			<div class="space-y-2">
				<div class="flex gap-2 mb-2">
					<button
						type="button"
						class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
						onclick={selectAllEntityTypes}
						aria-label="Select all entity types"
					>
						All
					</button>
					<button
						type="button"
						class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
						onclick={deselectAllEntityTypes}
						aria-label="Deselect all entity types"
					>
						None
					</button>
				</div>

				{#each allEntityTypes as type}
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={selectedEntityTypes.has(type)}
							onchange={() => toggleEntityType(type)}
							class="rounded border-slate-300 dark:border-slate-600"
						/>
						<span class="text-slate-700 dark:text-slate-300">{formatLabel(type)}</span>
					</label>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Relationship Types Section -->
	<section data-testid="relationship-types-section">
		{#if uniqueRelationships.length > 0}
			<button
				type="button"
				class="flex items-center justify-between w-full text-left font-medium text-slate-900 dark:text-white mb-2"
				onclick={() => (relationshipTypesExpanded = !relationshipTypesExpanded)}
			>
				<span>
					Relationship Types
					{#if selectedRelationshipTypes.size < uniqueRelationships.length}
						({selectedRelationshipTypes.size})
					{/if}
				</span>
				{#if relationshipTypesExpanded}
					<ChevronDown class="w-4 h-4" />
				{:else}
					<ChevronRight class="w-4 h-4" />
				{/if}
			</button>

			{#if relationshipTypesExpanded}
				<div class="space-y-2">
					<div class="flex gap-2 mb-2">
						<button
							type="button"
							class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
							onclick={selectAllRelationshipTypes}
							aria-label="Select all relationship types"
						>
							All
						</button>
						<button
							type="button"
							class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
							onclick={deselectAllRelationshipTypes}
							aria-label="Deselect all relationship types"
						>
							None
						</button>
					</div>

					{#each uniqueRelationships as rel}
						<label class="flex items-center gap-2 text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={selectedRelationshipTypes.has(rel)}
								onchange={() => toggleRelationshipType(rel)}
								class="rounded border-slate-300 dark:border-slate-600"
							/>
							<span class="text-slate-700 dark:text-slate-300">{formatLabel(rel)}</span>
						</label>
					{/each}
				</div>
			{/if}
		{/if}
	</section>

	<!-- Reset Button -->
	<button
		type="button"
		class="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
		onclick={resetFilters}
	>
		Reset Filters
	</button>
</div>
