<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { entitiesStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { ArrowLeft, Edit, Trash2, Link } from 'lucide-svelte';
	import { EntitySummary } from '$lib/components/entity';

	const entityId = $derived($page.params.id ?? '');
	const entityType = $derived($page.params.type ?? '');
	const entity = $derived(entityId ? entitiesStore.getById(entityId) : undefined);
	const typeDefinition = $derived(entityType ? getEntityTypeDefinition(entityType) : undefined);
	const linkedEntities = $derived(entity ? entitiesStore.getLinked(entity.id) : []);

	async function handleDelete() {
		if (!entity) return;
		if (confirm(`Are you sure you want to delete "${entity.name}"?`)) {
			await entitiesStore.delete(entity.id);
			goto(`/entities/${entityType}`);
		}
	}
</script>

<svelte:head>
	<title>{entity?.name ?? 'Entity'} - Director Assist</title>
</svelte:head>

{#if entity}
	<div class="max-w-4xl mx-auto">
		<!-- Back link -->
		<a
			href="/entities/{entityType}"
			class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
		>
			<ArrowLeft class="w-4 h-4" />
			Back to {typeDefinition?.labelPlural ?? 'Entities'}
		</a>

		<!-- Header -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-1">
					{entity.name}
				</h1>
				<p class="text-slate-500 dark:text-slate-400">
					{typeDefinition?.label ?? entity.type}
				</p>
			</div>

			<div class="flex gap-2">
				<a href="/entities/{entityType}/{entity.id}/edit" class="btn btn-secondary">
					<Edit class="w-4 h-4" />
					Edit
				</a>
				<button class="btn btn-ghost text-red-600 hover:bg-red-50" onclick={handleDelete}>
					<Trash2 class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Tags -->
		{#if entity.tags.length > 0}
			<div class="flex flex-wrap gap-2 mb-6">
				{#each entity.tags as tag}
					<span class="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
						{tag}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Description -->
		{#if entity.description}
			<div class="prose dark:prose-invert max-w-none mb-8">
				<p class="whitespace-pre-wrap">{entity.description}</p>
			</div>
		{/if}

		<!-- AI Summary -->
		<div class="mb-8">
			<EntitySummary {entity} editable={true} />
		</div>

		<!-- Fields -->
		{#if Object.keys(entity.fields).length > 0}
			<div class="mb-8">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Details</h2>
				<div class="grid gap-4">
					{#each Object.entries(entity.fields) as [key, value]}
						{@const fieldDef = typeDefinition?.fieldDefinitions.find(
							(f) => f.key === key
						)}
						{#if value !== null && value !== undefined && value !== ''}
							<div
								class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4"
								class:border-l-4={fieldDef?.section === 'hidden'}
								class:border-l-amber-500={fieldDef?.section === 'hidden'}
							>
								<div class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
									{fieldDef?.label ?? key}
									{#if fieldDef?.section === 'hidden'}
										<span class="text-amber-600 dark:text-amber-400 ml-2">
											(Secret)
										</span>
									{/if}
								</div>
								<div class="text-slate-900 dark:text-white whitespace-pre-wrap">
									{#if Array.isArray(value)}
										{value.join(', ')}
									{:else}
										{value}
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Linked Entities -->
		{#if entity.links.length > 0}
			<div class="mb-8">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
					<Link class="w-5 h-5" />
					Relationships
				</h2>
				<div class="grid gap-2">
					{#each entity.links as link}
						{@const linkedEntity = entitiesStore.getById(link.targetId)}
						{#if linkedEntity}
							<a
								href="/entities/{linkedEntity.type}/{linkedEntity.id}"
								class="entity-card flex items-center gap-3"
								data-type={linkedEntity.type}
							>
								<span class="text-sm text-slate-500 dark:text-slate-400 w-24">
									{link.relationship.replace(/_/g, ' ')}
								</span>
								<span class="font-medium text-slate-900 dark:text-white">
									{linkedEntity.name}
								</span>
							</a>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- DM Notes -->
		{#if entity.notes}
			<div class="mb-8">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">DM Notes</h2>
				<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
					<p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
						{entity.notes}
					</p>
				</div>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="text-sm text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
			<p>Created: {new Date(entity.createdAt).toLocaleString()}</p>
			<p>Updated: {new Date(entity.updatedAt).toLocaleString()}</p>
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-slate-500 dark:text-slate-400">Entity not found</p>
		<a href="/entities/{entityType}" class="btn btn-secondary mt-4">
			<ArrowLeft class="w-4 h-4" />
			Back to list
		</a>
	</div>
{/if}
