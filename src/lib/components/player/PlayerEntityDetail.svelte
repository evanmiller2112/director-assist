<script lang="ts">
	/**
	 * PlayerEntityDetail Component
	 * Issue #443: Read-only entity display components for player view
	 *
	 * Full entity detail view for player context.
	 * Shows: name heading, image, description (markdown), all populated fields, relationships.
	 */

	import type { PlayerEntity } from '$lib/types/playerExport';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { getDisplayablePlayerFields } from '$lib/utils/playerFieldUtils';
	import MarkdownViewer from '$lib/components/markdown/MarkdownViewer.svelte';
	import PlayerFieldDisplay from './PlayerFieldDisplay.svelte';
	import PlayerRelationships from './PlayerRelationships.svelte';

	interface Props {
		entity: PlayerEntity;
	}

	let { entity }: Props = $props();

	const typeDef = $derived(getEntityTypeDefinition(entity.type));

	// Get displayable fields (filtered and ordered)
	const displayableFields = $derived.by(() => {
		if (!typeDef) return [];
		return getDisplayablePlayerFields(entity, typeDef.fieldDefinitions);
	});
</script>

<div class="space-y-6">
	<!-- Image (if present) -->
	{#if entity.imageUrl}
		<div class="w-full">
			<img
				src={entity.imageUrl}
				alt={entity.name}
				class="w-full max-h-96 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
			/>
		</div>
	{/if}

	<!-- Tags -->
	{#if entity.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each entity.tags as tag}
				<span
					class="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-700 dark:text-slate-300"
				>
					{tag}
				</span>
			{/each}
		</div>
	{/if}

	<!-- Description (as markdown) -->
	{#if entity.description}
		<div>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">
				Description
			</h2>
			<div class="prose dark:prose-invert max-w-none">
				<MarkdownViewer content={entity.description} />
			</div>
		</div>
	{/if}

	<!-- Fields -->
	{#if displayableFields.length > 0}
		<div>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">
				Details
			</h2>
			<div class="grid gap-4 md:grid-cols-2">
				{#each displayableFields as { field, value }}
					<div>
						<PlayerFieldDisplay {field} {value} allFields={entity.fields} />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Relationships -->
	{#if entity.links.length > 0}
		<div>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">
				Relationships
			</h2>
			<PlayerRelationships links={entity.links} />
		</div>
	{/if}

	<!-- Summary (if different from description) -->
	{#if entity.summary && entity.summary !== entity.description}
		<div>
			<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">
				Summary
			</h2>
			<p class="text-slate-700 dark:text-slate-300">
				{entity.summary}
			</p>
		</div>
	{/if}
</div>
