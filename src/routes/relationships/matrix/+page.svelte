<script lang="ts">
	import { onMount } from 'svelte';
	import { entitiesStore, campaignStore, notificationStore } from '$lib/stores';
	import { entityRepository } from '$lib/db/repositories/entityRepository';
	import { buildMatrixData, sortMatrixData } from '$lib/utils/matrixUtils';
	import MatrixControls from '$lib/components/relationships/MatrixControls.svelte';
	import RelationshipMatrix from '$lib/components/relationships/RelationshipMatrix.svelte';
	import RelateCommand from '$lib/components/entity/RelateCommand.svelte';
	import EditRelationshipModal from '$lib/components/entity/EditRelationshipModal.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import type { MatrixFilterOptions, MatrixSortOptions, MatrixData } from '$lib/types/matrix';
	import type { RelationshipMap } from '$lib/db/repositories/entityRepository';
	import type { BaseEntity, EntityLink } from '$lib/types';

	// State for relationship map data
	let relationshipMap = $state<RelationshipMap>({ nodes: [], edges: [] });
	let isLoading = $state(true);

	// Filter and sort options
	let filterOptions = $state<MatrixFilterOptions>({
		rowEntityType: 'character',
		columnEntityType: 'character',
		hideEmptyRows: false,
		hideEmptyColumns: false
	});

	let sortOptions = $state<MatrixSortOptions>({
		rowSort: 'alphabetical',
		columnSort: 'alphabetical',
		rowDirection: 'asc',
		columnDirection: 'asc'
	});

	// Modal state
	let relateCommandOpen = $state(false);
	let editModalOpen = $state(false);
	let selectedRowEntityId = $state<string | null>(null);
	let selectedColumnEntityId = $state<string | null>(null);

	// Derived state for modal entities
	const selectedRowEntity = $derived(
		selectedRowEntityId ? entitiesStore.getById(selectedRowEntityId) : null
	);
	const selectedColumnEntity = $derived(
		selectedColumnEntityId ? entitiesStore.getById(selectedColumnEntityId) : null
	);

	// Get existing link between selected entities (for edit modal)
	const existingLink = $derived.by(() => {
		if (!selectedRowEntity || !selectedColumnEntity) return null;

		// Find link from row to column or vice versa
		const linkFromRow = selectedRowEntity.links.find(
			(link) => link.targetId === selectedColumnEntity.id
		);
		if (linkFromRow) return linkFromRow;

		const linkFromColumn = selectedColumnEntity.links.find(
			(link) => link.targetId === selectedRowEntity.id
		);
		return linkFromColumn ?? null;
	});

	// Build and sort matrix data
	const matrixData = $derived.by(() => {
		const filtered = buildMatrixData(relationshipMap, filterOptions);
		return sortMatrixData(filtered, sortOptions);
	});

	// Extract available relationship types from the relationship map
	const availableRelationshipTypes = $derived.by(() => {
		const types = new Set<string>();
		relationshipMap.edges.forEach((edge) => {
			types.add(edge.relationship);
		});
		return Array.from(types).sort();
	});

	// Load relationship map on mount
	onMount(async () => {
		try {
			isLoading = true;
			relationshipMap = await entityRepository.getRelationshipMap();
		} catch (error) {
			console.error('Failed to load relationship map:', error);
			notificationStore.error('Failed to load relationship data', 5000);
		} finally {
			isLoading = false;
		}
	});

	function handleFilterChange(newFilterOptions: MatrixFilterOptions) {
		filterOptions = newFilterOptions;
	}

	function handleSortChange(newSortOptions: MatrixSortOptions) {
		sortOptions = newSortOptions;
	}

	function handleCellClick(rowEntityId: string, columnEntityId: string) {
		selectedRowEntityId = rowEntityId;
		selectedColumnEntityId = columnEntityId;

		// If there's an existing relationship, open edit modal
		// Otherwise, open relate command to create new relationship
		if (existingLink) {
			editModalOpen = true;
		} else {
			relateCommandOpen = true;
		}
	}

	function handleCloseRelateCommand() {
		relateCommandOpen = false;
		selectedRowEntityId = null;
		selectedColumnEntityId = null;
	}

	function handleCloseEditModal() {
		editModalOpen = false;
		selectedRowEntityId = null;
		selectedColumnEntityId = null;
	}

	async function handleSaveEdit(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
	}) {
		if (!selectedRowEntity || !selectedColumnEntity || !existingLink) return;

		try {
			// Update the link
			await entitiesStore.updateLink(
				existingLink.sourceId ?? selectedRowEntity.id,
				existingLink.id,
				changes
			);

			notificationStore.success('Relationship updated successfully', 3000);

			// Reload relationship map
			relationshipMap = await entityRepository.getRelationshipMap();

			handleCloseEditModal();
		} catch (error) {
			console.error('Failed to update relationship:', error);
			throw error; // Let the modal handle the error display
		}
	}

	// Watch for changes in entities store and reload relationship map
	$effect(() => {
		// Subscribe to entities store changes
		const entities = entitiesStore.entities;

		// Reload relationship map when entities change (but not on initial load)
		if (!isLoading && entities.length > 0) {
			entityRepository.getRelationshipMap().then((map) => {
				relationshipMap = map;
			});
		}
	});
</script>

<svelte:head>
	<title>Relationship Matrix - Director Assist</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-screen-2xl">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<a
				href="/entities"
				class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
				aria-label="Back to entities"
			>
				<ArrowLeft class="w-6 h-6" />
			</a>
			<div>
				<h1 class="text-3xl font-bold text-slate-900 dark:text-white">
					Relationship Matrix
				</h1>
				<p class="text-slate-600 dark:text-slate-400 mt-1">
					Visualize relationships between entities in a 2D matrix
				</p>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p class="text-slate-600 dark:text-slate-400 mt-4">Loading relationship data...</p>
			</div>
		</div>
	{:else}
		<!-- Controls -->
		<MatrixControls
			{filterOptions}
			{sortOptions}
			{availableRelationshipTypes}
			onFilterChange={handleFilterChange}
			onSortChange={handleSortChange}
		/>

		<!-- Matrix View -->
		<div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
			<RelationshipMatrix
				{matrixData}
				onCellClick={handleCellClick}
			/>
		</div>

		<!-- Stats -->
		<div class="mt-6 text-sm text-slate-600 dark:text-slate-400 text-center">
			Showing {matrixData.rowEntities.length} rows × {matrixData.columnEntities.length} columns
			{#if matrixData.cells.size > 0}
				with {matrixData.cells.size} relationships
			{/if}
		</div>
	{/if}
</div>

<!-- Modals -->
{#if selectedRowEntity && selectedColumnEntity}
	{#if relateCommandOpen}
		<RelateCommand
			sourceEntity={selectedRowEntity}
			bind:open={relateCommandOpen}
			onClose={handleCloseRelateCommand}
		/>
	{/if}

	{#if editModalOpen && existingLink}
		<EditRelationshipModal
			sourceEntity={selectedRowEntity}
			targetEntity={selectedColumnEntity}
			link={existingLink}
			bind:open={editModalOpen}
			onClose={handleCloseEditModal}
			onSave={handleSaveEdit}
		/>
	{/if}
{/if}
