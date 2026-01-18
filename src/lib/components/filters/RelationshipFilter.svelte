<script lang="ts">
	import type { BaseEntity } from '$lib/types';

	interface Props {
		relatedToEntityId: string | undefined;
		relationshipType: string | undefined;
		hasRelationships: boolean | undefined;
		availableEntities: BaseEntity[];
		availableRelationshipTypes: string[];
		onFilterChange: (filters: {
			relatedToEntityId: string | undefined;
			relationshipType: string | undefined;
			hasRelationships: boolean | undefined;
		}) => void;
	}

	let {
		relatedToEntityId = undefined,
		relationshipType = undefined,
		hasRelationships = undefined,
		availableEntities,
		availableRelationshipTypes,
		onFilterChange
	}: Props = $props();

	// Local state for controlled inputs
	let selectedEntityId = $state('');
	let selectedRelType = $state('');
	let hasRelsChecked = $state(false);

	// Sync local state with props using $effect
	$effect(() => {
		selectedEntityId = relatedToEntityId ?? '';
		selectedRelType = relationshipType ?? '';
		hasRelsChecked = hasRelationships ?? false;
	});

	// Group entities by type
	const entitiesByType = $derived.by(() => {
		const groups: Record<string, BaseEntity[]> = {};
		for (const entity of availableEntities) {
			if (!groups[entity.type]) {
				groups[entity.type] = [];
			}
			groups[entity.type].push(entity);
		}
		return groups;
	});

	// Format relationship type label to be more readable
	// Returns with spaces instead of underscores for better readability
	function formatRelationshipLabel(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Capitalize entity type for optgroup labels
	function capitalizeType(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1) + 's';
	}

	function handleEntityChange(e: Event) {
		const selectElement = e.target as HTMLSelectElement;
		const value = selectElement.value;

		// Skip if value hasn't changed from local state
		if (value === selectedEntityId) {
			return;
		}

		selectedEntityId = value;
		onFilterChange({
			relatedToEntityId: value || undefined,
			relationshipType: selectedRelType || undefined,
			hasRelationships: hasRelsChecked ? true : undefined
		});
	}

	function handleRelationshipTypeChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		// Only call onFilterChange if value actually changed
		if (value === selectedRelType) return;

		selectedRelType = value;
		onFilterChange({
			relatedToEntityId: selectedEntityId || undefined,
			relationshipType: value || undefined,
			hasRelationships: hasRelsChecked ? true : undefined
		});
	}

	function handleHasRelationshipsChange(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		hasRelsChecked = checked;
		onFilterChange({
			relatedToEntityId: selectedEntityId || undefined,
			relationshipType: selectedRelType || undefined,
			hasRelationships: checked
		});
	}

	function clearFilters() {
		selectedEntityId = '';
		selectedRelType = '';
		hasRelsChecked = false;
		onFilterChange({
			relatedToEntityId: undefined,
			relationshipType: undefined,
			hasRelationships: undefined
		});
	}

	const hasActiveFilters = $derived(
		!!selectedEntityId || !!selectedRelType || hasRelsChecked
	);
</script>

<div
	class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4"
>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Related To Entity Filter -->
		<div>
			<label
				for="related-to-filter"
				class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
			>
				Related To
			</label>
			<select
				id="related-to-filter"
				value={selectedEntityId}
				onchange={handleEntityChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
				aria-label="Related to"
			>
				<option value="">All Entities</option>
				{#each Object.keys(entitiesByType).sort() as type}
					<optgroup label={capitalizeType(type)}>
						{#each entitiesByType[type] as entity}
							<option value={entity.id}>Filter: {entity.name}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</div>

		<!-- Relationship Type Filter -->
		<div>
			<label
				for="relationship-type-filter"
				class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
			>
				Relationship Type
			</label>
			<select
				id="relationship-type-filter"
				value={selectedRelType}
				onchange={handleRelationshipTypeChange}
				class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
				aria-label="Relationship type"
			>
				<option value="">All Types</option>
				{#each availableRelationshipTypes as type}
					<option value={type}>{type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
				{/each}
			</select>
		</div>

		<!-- Has Relationships Filter -->
		<div class="flex items-end">
			<label class="flex items-center space-x-2 cursor-pointer pb-2">
				<input
					type="checkbox"
					checked={hasRelsChecked}
					onchange={handleHasRelationshipsChange}
					class="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
					aria-label="Has relationships"
				/>
				<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
					Has Relationships
				</span>
			</label>
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
