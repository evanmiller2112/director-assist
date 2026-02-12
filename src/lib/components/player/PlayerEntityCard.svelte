<script lang="ts">
	/**
	 * PlayerEntityCard Component
	 * Issue #443: Read-only entity display components for player view
	 *
	 * Compact card for entity lists in player view.
	 * Shows: name, type icon/badge, image thumbnail, truncated description, tags as chips.
	 * Click navigates to entity detail page.
	 */

	import type { PlayerEntity } from '$lib/types/playerExport';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { getIconComponent } from '$lib/utils/icons';

	interface Props {
		entity: PlayerEntity;
	}

	let { entity }: Props = $props();

	const typeDef = $derived(getEntityTypeDefinition(entity.type));
	const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));

	// Truncate description to ~200 characters
	const truncatedDescription = $derived.by(() => {
		const desc = entity.summary || entity.description;
		if (!desc) return '';
		if (desc.length <= 200) return desc;
		return desc.substring(0, 197) + '...';
	});
</script>

<a
	href="/player/entity/{entity.id}"
	class="entity-card block"
	data-type={entity.type}
>
	<div class="flex gap-3">
		<!-- Type Icon -->
		<div
			class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700 flex-shrink-0"
		>
			<Icon
				class="w-5 h-5"
				style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)"
			/>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<!-- Name and Type Badge -->
			<div class="flex items-start justify-between gap-2 mb-1">
				<h3 class="font-semibold text-slate-900 dark:text-white truncate">
					{entity.name}
				</h3>
				{#if typeDef}
					<span
						class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex-shrink-0"
					>
						{typeDef.label}
					</span>
				{/if}
			</div>

			<!-- Image Thumbnail (if present) -->
			{#if entity.imageUrl}
				<div class="mb-2">
					<img
						src={entity.imageUrl}
						alt={entity.name}
						class="w-full h-32 object-cover rounded border border-slate-200 dark:border-slate-600"
					/>
				</div>
			{/if}

			<!-- Description -->
			{#if truncatedDescription}
				<p class="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
					{truncatedDescription}
				</p>
			{/if}

			<!-- Tags -->
			{#if entity.tags.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each entity.tags.slice(0, 5) as tag}
						<span
							class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full"
						>
							{tag}
						</span>
					{/each}
					{#if entity.tags.length > 5}
						<span
							class="text-xs text-slate-500 dark:text-slate-400 px-2 py-0.5"
						>
							+{entity.tags.length - 5} more
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</a>
