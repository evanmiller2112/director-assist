<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, campaignStore, notificationStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { Plus, Search, Link, EyeOff, Check, Circle, Upload } from 'lucide-svelte';
	import RelateCommand from '$lib/components/entity/RelateCommand.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import LoadingSkeleton from '$lib/components/ui/LoadingSkeleton.svelte';
	import { RelationshipFilter } from '$lib/components/filters';
	import ForgeSteelImportModal from '$lib/components/settings/ForgeSteelImportModal.svelte';
	import type { BaseEntity } from '$lib/types';

	const entityType = $derived($page?.params?.type ?? '');
	const typeDefinition = $derived(
		entityType
			? getEntityTypeDefinition(
					entityType,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);
	const entities = $derived(entityType ? entitiesStore.getByType(entityType) : []);
	const isCampaignPage = $derived(entityType === 'campaign');

	let searchQuery = $state('');
	let relateCommandOpen = $state(false);
	let selectedEntityForLink = $state<BaseEntity | null>(null);
	let isInitialLoad = $state(true);
	let forgeSteelModalOpen = $state(false);

	// Read pagination parameters from URL
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

	// Read relationship filter parameters from URL
	const urlRelatedTo = $derived($page.url.searchParams.get('relatedTo') || undefined);
	const urlRelType = $derived($page.url.searchParams.get('relType') || undefined);
	const urlHasRels = $derived.by(() => {
		const param = $page.url.searchParams.get('hasRels');
		return param === 'true' ? true : param === 'false' ? false : undefined;
	});

	// Initialize filters from URL on load
	$effect(() => {
		if (urlRelatedTo || urlRelType || urlHasRels !== undefined) {
			entitiesStore.setRelationshipFilter({
				relatedToEntityId: urlRelatedTo,
				relationshipType: urlRelType,
				hasRelationships: urlHasRels
			});
		}
	});

	// Use the store's filtered entities (which includes relationship filters)
	const storeFilteredEntities = $derived(
		entityType ? entitiesStore.filteredEntities.filter((e) => e.type === entityType) : []
	);

	// Apply local search query on top of store filters
	const filteredEntities: BaseEntity[] = $derived.by(() => {
		if (!searchQuery) return storeFilteredEntities;
		const query = searchQuery.toLowerCase();
		return storeFilteredEntities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.description.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
	});

	// Calculate total pages and clamp current page to valid range
	const totalPages = $derived(Math.ceil(filteredEntities.length / perPage));
	const clampedPage = $derived.by(() => {
		if (filteredEntities.length === 0) return 1;
		return Math.min(currentPage, Math.max(1, totalPages));
	});

	// Paginate filtered entities
	const paginatedEntities: BaseEntity[] = $derived.by(() => {
		const start = (clampedPage - 1) * perPage;
		const end = start + perPage;
		return filteredEntities.slice(start, end);
	});

	// Show pagination when total items exceed perPage
	const showPagination = $derived(filteredEntities.length > perPage);

	function openLinkModal(entity: BaseEntity, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		selectedEntityForLink = entity;
		relateCommandOpen = true;
	}

	async function setAsActiveCampaign(entity: BaseEntity, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (entity.id === campaignStore.activeCampaignId) return;

		try {
			await campaignStore.setActiveCampaign(entity.id);
			notificationStore.success(`Switched to campaign: ${entity.name}`);
			// Reload page to refresh all data for new campaign
			window.location.reload();
		} catch (error) {
			console.error('Failed to set active campaign:', error);
			notificationStore.error('Failed to set active campaign');
		}
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

	function handleRelationshipFilterChange(filters: {
		relatedToEntityId: string | undefined;
		relationshipType: string | undefined;
		hasRelationships: boolean | undefined;
	}) {
		// Update store
		entitiesStore.setRelationshipFilter(filters);

		// Update URL params
		const url = new URL($page.url);
		url.searchParams.set('page', '1'); // Reset to page 1

		if (filters.relatedToEntityId) {
			url.searchParams.set('relatedTo', filters.relatedToEntityId);
		} else {
			url.searchParams.delete('relatedTo');
		}

		if (filters.relationshipType) {
			url.searchParams.set('relType', filters.relationshipType);
		} else {
			url.searchParams.delete('relType');
		}

		if (filters.hasRelationships !== undefined) {
			url.searchParams.set('hasRels', filters.hasRelationships.toString());
		} else {
			url.searchParams.delete('hasRels');
		}

		goto(url.toString());
	}

	// Reset to page 1 when search changes (but not on initial load)
	$effect(() => {
		if (searchQuery && !isInitialLoad) {
			const url = new URL($page.url);
			url.searchParams.set('page', '1');
			url.searchParams.set('perPage', perPage.toString());
			goto(url.toString());
		}
		if (isInitialLoad) {
			isInitialLoad = false;
		}
	});
</script>

<svelte:head>
	<title>{typeDefinition?.labelPlural ?? 'Entities'} - Director Assist</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white">
				{typeDefinition?.labelPlural ?? 'Entities'}
			</h1>
			<p class="text-slate-500 dark:text-slate-400">
				{entities.length}
				{entities.length === 1 ? 'entry' : 'entries'}
			</p>
		</div>

		<div class="flex items-center gap-2">
			{#if entityType === 'character'}
				<button onclick={() => forgeSteelModalOpen = true} class="btn btn-secondary">
					<Upload class="w-4 h-4" />
					Import from Forge Steel
				</button>
			{/if}
			<a href="/entities/{entityType}/new" class="btn btn-primary">
				<Plus class="w-4 h-4" />
				Add {typeDefinition?.label ?? 'Entity'}
			</a>
		</div>
	</div>

	<!-- Relationship Filter -->
	<RelationshipFilter
		relatedToEntityId={entitiesStore.relationshipFilter.relatedToEntityId}
		relationshipType={entitiesStore.relationshipFilter.relationshipType}
		hasRelationships={entitiesStore.relationshipFilter.hasRelationships}
		availableEntities={entitiesStore.entities}
		availableRelationshipTypes={entitiesStore.availableRelationshipTypes}
		onFilterChange={handleRelationshipFilterChange}
	/>

	<!-- Search -->
	<div class="relative mb-6">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
		<input
			type="text"
			placeholder="Search {typeDefinition?.labelPlural?.toLowerCase() ?? 'entities'}..."
			class="input pl-10"
			bind:value={searchQuery}
		/>
	</div>

	<!-- Entity List -->
	{#if entitiesStore.isLoading}
		<LoadingSkeleton variant="entityCard" count={5} />
	{:else if filteredEntities.length === 0}
		<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
			{#if searchQuery}
				<p class="text-slate-500 dark:text-slate-400">
					No {typeDefinition?.labelPlural?.toLowerCase() ?? 'entities'} match your search.
				</p>
			{:else}
				<p class="text-slate-500 dark:text-slate-400 mb-4">
					No {typeDefinition?.labelPlural?.toLowerCase() ?? 'entities'} yet.
				</p>
				<button onclick={() => goto(`/entities/${entityType}/new`)} class="btn btn-primary">
					<Plus class="w-4 h-4" />
					Create Your First {typeDefinition?.label ?? 'Entity'}
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid gap-3" data-testid="entity-list">
			{#each paginatedEntities as entity}
				<a
					href="/entities/{entityType}/{entity.id}"
					class="entity-card group flex items-start gap-4"
					data-type={entityType}
					data-testid="entity-card"
				>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<div class="font-medium text-slate-900 dark:text-white truncate">
								{entity.name}
							</div>
							{#if isCampaignPage && entity.id === campaignStore.activeCampaignId}
								<span
									class="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
									title="Active campaign"
								>
									<Check class="w-3 h-3" />
									Active
								</span>
							{/if}
						</div>
						{#if entity.description}
							<p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
								{entity.description}
							</p>
						{/if}
						{#if entity.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each entity.tags.slice(0, 5) as tag}
									<span
										class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded"
									>
										{tag}
									</span>
								{/each}
								{#if entity.tags.length > 5}
									<span class="text-xs text-slate-400">
										+{entity.tags.length - 5} more
									</span>
								{/if}
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if entity.playerVisible === false}
							<span title="Hidden from players"><EyeOff class="w-4 h-4 text-amber-500" /></span>
						{/if}
						<div class="text-xs text-slate-400 whitespace-nowrap">
							{new Date(entity.updatedAt).toLocaleDateString()}
						</div>
						{#if isCampaignPage && entity.id !== campaignStore.activeCampaignId}
							<button
								onclick={(e) => setAsActiveCampaign(entity, e)}
								class="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white"
								aria-label="Set {entity.name} as active campaign"
								title="Set as active campaign"
								data-testid="set-active-button-{entity.id}"
							>
								Set as Active
							</button>
						{/if}
						{#if !isCampaignPage}
							<button
								onclick={(e) => openLinkModal(entity, e)}
								class="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
								aria-label="Link {entity.name}"
								title="Link entity"
								data-testid="link-button-{entity.id}"
							>
								<Link class="w-4 h-4 text-slate-600 dark:text-slate-400" />
							</button>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		{#if showPagination}
			<Pagination
				currentPage={clampedPage}
				totalItems={filteredEntities.length}
				perPage={perPage}
				onPageChange={handlePageChange}
				onPerPageChange={handlePerPageChange}
			/>
		{/if}
	{/if}
{#if selectedEntityForLink}
	<RelateCommand
		sourceEntity={selectedEntityForLink}
		bind:open={relateCommandOpen}
		onClose={() => { selectedEntityForLink = null; }}
	/>
{/if}

{#if entityType === 'character'}
	<ForgeSteelImportModal
		bind:open={forgeSteelModalOpen}
		onimport={() => { forgeSteelModalOpen = false; }}
		oncancel={() => { forgeSteelModalOpen = false; }}
	/>
{/if}
</div>
