<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { ArrowLeft, Plus } from 'lucide-svelte';
	import RelationshipsFilter from '$lib/components/relationships/RelationshipsFilter.svelte';
	import RelationshipsTable from '$lib/components/relationships/RelationshipsTable.svelte';
	import BulkActionsBar from '$lib/components/relationships/BulkActionsBar.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import RelateCommand from '$lib/components/entity/RelateCommand.svelte';
	import type { RelationshipFilterOptions, RelationshipSortOptions } from '$lib/types/relationships';
	import type { BaseEntity, EntityLink } from '$lib/types';

	// Get entity from URL params
	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
	const typeDefinition = $derived(
		entityType
			? getEntityTypeDefinition(
					entityType,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);

	// Get all relationships for this entity
	const allRelationships = $derived(
		entity ? entitiesStore.getLinkedWithRelationships(entity.id) : []
	);

	// Filter state
	let filterOptions = $state<RelationshipFilterOptions>({});
	let sortOptions = $state<RelationshipSortOptions>({ field: 'targetName', direction: 'asc' });
	let selectedIds = $state<Set<string>>(new Set());
	let relateCommandOpen = $state(false);

	// Pagination state from URL
	const currentPage = $derived.by(() => {
		const pageParam = $page.url.searchParams.get('page');
		const parsed = parseInt(pageParam || '1', 10);
		return isNaN(parsed) || parsed < 1 ? 1 : parsed;
	});

	const perPage = $derived.by(() => {
		const perPageParam = $page.url.searchParams.get('perPage');
		const parsed = parseInt(perPageParam || '20', 10);
		return isNaN(parsed) || parsed < 1 ? 20 : parsed;
	});

	// Derive available filter options from relationships
	const availableRelationshipTypes = $derived.by(() => {
		const types = new Set<string>();
		allRelationships.forEach(({ link }) => {
			if (link.relationship) {
				types.add(link.relationship);
			}
		});
		return Array.from(types).sort();
	});

	const availableEntityTypes = $derived.by(() => {
		const types = new Set<string>();
		allRelationships.forEach(({ entity: linkedEntity }) => {
			types.add(linkedEntity.type);
		});
		return Array.from(types).sort();
	});

	// Filter relationships
	const filteredRelationships = $derived.by(() => {
		let result = allRelationships;

		// Filter by relationship type
		if (filterOptions.relationshipType) {
			result = result.filter(
				({ link }) => link.relationship === filterOptions.relationshipType
			);
		}

		// Filter by target entity type
		if (filterOptions.targetEntityType) {
			result = result.filter(
				({ entity: linkedEntity }) => linkedEntity.type === filterOptions.targetEntityType
			);
		}

		// Filter by strength
		if (filterOptions.strength && filterOptions.strength !== 'all') {
			result = result.filter(({ link }) => link.strength === filterOptions.strength);
		}

		// Filter by search query
		if (filterOptions.searchQuery) {
			const query = filterOptions.searchQuery.toLowerCase();
			result = result.filter(({ entity: linkedEntity, link }) => {
				const matchesName = linkedEntity.name.toLowerCase().includes(query);
				const matchesRelationship = link.relationship.toLowerCase().includes(query);
				const matchesNotes = link.notes?.toLowerCase().includes(query);
				const matchesTags = link.metadata?.tags?.some((tag: string) =>
					tag.toLowerCase().includes(query)
				);
				return matchesName || matchesRelationship || matchesNotes || matchesTags;
			});
		}

		return result;
	});

	// Sort relationships
	const sortedRelationships = $derived.by(() => {
		const result = [...filteredRelationships];

		result.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (sortOptions.field) {
				case 'targetName':
					aValue = a.entity.name.toLowerCase();
					bValue = b.entity.name.toLowerCase();
					break;
				case 'relationship':
					aValue = a.link.relationship.toLowerCase();
					bValue = b.link.relationship.toLowerCase();
					break;
				case 'strength':
					// Strength order: strong > moderate > weak > undefined
					const strengthOrder = { strong: 3, moderate: 2, weak: 1 };
					aValue = strengthOrder[a.link.strength as keyof typeof strengthOrder] ?? 0;
					bValue = strengthOrder[b.link.strength as keyof typeof strengthOrder] ?? 0;
					break;
				case 'createdAt':
					aValue = a.link.createdAt ?? 0;
					bValue = b.link.createdAt ?? 0;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
			return 0;
		});

		return result;
	});

	// Paginate relationships
	const totalPages = $derived(Math.ceil(sortedRelationships.length / perPage));
	const clampedPage = $derived.by(() => {
		if (sortedRelationships.length === 0) return 1;
		return Math.min(currentPage, Math.max(1, totalPages));
	});

	const paginatedRelationships = $derived.by(() => {
		const start = (clampedPage - 1) * perPage;
		const end = start + perPage;
		return sortedRelationships.slice(start, end);
	});

	const showPagination = $derived(sortedRelationships.length > perPage);

	// Handlers
	function handleFilterChange(options: RelationshipFilterOptions) {
		filterOptions = options;
		// Reset to page 1 when filters change
		const url = new URL($page.url);
		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function handleSort(options: RelationshipSortOptions) {
		sortOptions = options;
	}

	function handleSelect(linkId: string, selected: boolean) {
		const newSet = new Set(selectedIds);
		if (selected) {
			newSet.add(linkId);
		} else {
			newSet.delete(linkId);
		}
		selectedIds = newSet;
	}

	function handleSelectAll(selected: boolean) {
		if (selected) {
			selectedIds = new Set(paginatedRelationships.map((r) => r.link.id));
		} else {
			selectedIds = new Set();
		}
	}

	function handleClearSelection() {
		selectedIds = new Set();
	}

	async function handleRemove(linkId: string) {
		if (!entity) return;
		if (confirm('Remove this relationship?')) {
			// Find the link to get the targetId
			const relationship = allRelationships.find((r) => r.link.id === linkId);
			if (relationship) {
				await entitiesStore.removeLink(entity.id, relationship.entity.id);
				// Remove from selection if it was selected
				const newSet = new Set(selectedIds);
				newSet.delete(linkId);
				selectedIds = newSet;
			}
		}
	}

	async function handleBulkDelete() {
		if (!entity) return;
		const count = selectedIds.size;
		if (confirm(`Delete ${count} relationship${count !== 1 ? 's' : ''}?`)) {
			// Find all relationships to delete
			const toDelete = allRelationships.filter((r) => selectedIds.has(r.link.id));

			// Delete each one
			for (const relationship of toDelete) {
				await entitiesStore.removeLink(entity.id, relationship.entity.id);
			}

			// Clear selection
			selectedIds = new Set();
		}
	}

	async function handleBulkUpdateStrength(strength: 'strong' | 'moderate' | 'weak') {
		if (!entity) return;

		// Find all selected relationships
		const toUpdate = allRelationships.filter((r) => selectedIds.has(r.link.id));

		// Update each one
		for (const relationship of toUpdate) {
			await entitiesStore.updateLink(entity.id, relationship.link.id, { strength });
		}

		// Clear selection
		selectedIds = new Set();
	}

	async function handleBulkAddTag(tag: string) {
		if (!entity) return;

		// Find all selected relationships
		const toUpdate = allRelationships.filter((r) => selectedIds.has(r.link.id));

		// Update each one by adding the tag to existing tags
		for (const relationship of toUpdate) {
			const existingTags = relationship.link.metadata?.tags ?? [];
			const newTags = [...existingTags, tag];

			await entitiesStore.updateLink(entity.id, relationship.link.id, {
				metadata: {
					...relationship.link.metadata,
					tags: newTags
				}
			});
		}

		// Clear selection
		selectedIds = new Set();
	}

	function handlePageChange(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		url.searchParams.set('perPage', perPage.toString());
		goto(url.toString());
	}

	function handlePerPageChange(newPerPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', '1'); // Reset to page 1 when changing perPage
		url.searchParams.set('perPage', newPerPage.toString());
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>{entity?.name ?? 'Entity'} - Relationships - Director Assist</title>
</svelte:head>

{#if entity}
	<div class="max-w-6xl mx-auto">
		<!-- Back link -->
		<a
			href="/entities/{entityType}/{entity.id}"
			class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to {entity.name}
		</a>

		<!-- Header -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">
					Relationships
				</h1>
				<p class="text-slate-500 dark:text-slate-400">
					{entity.name} &bull; {allRelationships.length} relationship{allRelationships.length !== 1 ? 's' : ''}
				</p>
			</div>

			<button onclick={() => (relateCommandOpen = true)} class="btn btn-primary">
				<Plus class="w-4 h-4" />
				Quick Add
			</button>
		</div>

		<!-- Filter -->
		<RelationshipsFilter
			{filterOptions}
			{availableRelationshipTypes}
			{availableEntityTypes}
			onFilterChange={handleFilterChange}
		/>

		<!-- Table -->
		{#if allRelationships.length === 0}
			<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
				<p class="text-slate-500 dark:text-slate-400 mb-4">
					No relationships yet.
				</p>
				<button onclick={() => (relateCommandOpen = true)} class="btn btn-primary">
					<Plus class="w-4 h-4" />
					Add Relationship
				</button>
			</div>
		{:else if filteredRelationships.length === 0}
			<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
				<p class="text-slate-500 dark:text-slate-400">
					No relationships match your filters.
				</p>
			</div>
		{:else}
			<div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
				<RelationshipsTable
					relationships={paginatedRelationships}
					{selectedIds}
					{sortOptions}
					onSelect={handleSelect}
					onSelectAll={handleSelectAll}
					onSort={handleSort}
					onRemove={handleRemove}
				/>
			</div>

			{#if showPagination}
				<Pagination
					currentPage={clampedPage}
					totalItems={sortedRelationships.length}
					{perPage}
					onPageChange={handlePageChange}
					onPerPageChange={handlePerPageChange}
				/>
			{/if}
		{/if}

		<!-- Bulk Actions Bar -->
		<BulkActionsBar
			selectedCount={selectedIds.size}
			onBulkDelete={handleBulkDelete}
			onBulkUpdateStrength={handleBulkUpdateStrength}
			onBulkAddTag={handleBulkAddTag}
			onClearSelection={handleClearSelection}
		/>
	</div>

	<!-- Relate Command Modal -->
	<RelateCommand sourceEntity={entity} bind:open={relateCommandOpen} />
{:else}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Entity not found</p>
		<a href="/entities/{entityType}" class="btn btn-secondary mt-4">
			<ArrowLeft class="w-4 h-4" />
			Back to list
		</a>
	</div>
{/if}
