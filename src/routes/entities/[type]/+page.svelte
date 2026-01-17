<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { Plus, Search, Link } from 'lucide-svelte';
	import RelateCommand from '$lib/components/entity/RelateCommand.svelte';
	import LoadingSkeleton from '$lib/components/ui/LoadingSkeleton.svelte';
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

	let searchQuery = $state('');
	let relateCommandOpen = $state(false);
	let selectedEntityForLink = $state<BaseEntity | null>(null);

	const filteredEntities: BaseEntity[] = $derived.by(() => {
		if (!searchQuery) return entities;
		const query = searchQuery.toLowerCase();
		return entities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.description.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
	});

	function openLinkModal(entity: BaseEntity, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		selectedEntityForLink = entity;
		relateCommandOpen = true;
	}
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

		<button onclick={() => goto(`/entities/${entityType}/new`)} class="btn btn-primary">
			<Plus class="w-4 h-4" />
			Add {typeDefinition?.label ?? 'Entity'}
		</button>
	</div>

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
		<div class="grid gap-3">
			{#each filteredEntities as entity}
				<a
					href="/entities/{entityType}/{entity.id}"
					class="entity-card group flex items-start gap-4"
					data-type={entityType}
				>
					<div class="flex-1 min-w-0">
						<div class="font-medium text-slate-900 dark:text-white truncate">
							{entity.name}
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
						<div class="text-xs text-slate-400 whitespace-nowrap">
							{new Date(entity.updatedAt).toLocaleDateString()}
						</div>
						<button
							onclick={(e) => openLinkModal(entity, e)}
							class="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
							aria-label="Link {entity.name}"
							title="Link entity"
							data-testid="link-button-{entity.id}"
						>
							<Link class="w-4 h-4 text-slate-600 dark:text-slate-400" />
						</button>
					</div>
				</a>
			{/each}
		</div>
	{/if}
{#if selectedEntityForLink}
	<RelateCommand
		sourceEntity={selectedEntityForLink}
		bind:open={relateCommandOpen}
		onClose={() => { selectedEntityForLink = null; }}
	/>
{/if}
</div>
