<script lang="ts">
	/**
	 * PlayerRelationships Component
	 * Issue #443: Read-only entity display components for player view
	 *
	 * Shows linked entities with relationship labels.
	 * Clickable navigation to /player/entity/{id}.
	 */

	import type { PlayerEntityLink } from '$lib/types/playerExport';
	import { playerDataStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { getIconComponent } from '$lib/utils/icons';

	interface Props {
		links: PlayerEntityLink[];
	}

	let { links }: Props = $props();

	// Format relationship labels (replace underscores with spaces)
	function formatRelationship(relationship: string): string {
		return relationship.replace(/_/g, ' ');
	}
</script>

{#if links.length > 0}
	<div class="space-y-2">
		{#each links as link}
			{@const linkedEntity = playerDataStore.getEntityById(link.targetId)}
			{@const typeDef = linkedEntity ? getEntityTypeDefinition(linkedEntity.type) : undefined}
			{@const Icon = getIconComponent(typeDef?.icon ?? 'package')}

			<a
				href="/player/entity/{link.targetId}"
				class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
			>
				<!-- Entity Icon -->
				<div
					class="w-8 h-8 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-700 flex-shrink-0"
				>
					<Icon
						class="w-4 h-4"
						style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)"
					/>
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0">
					<div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
						{formatRelationship(link.relationship)}
					</div>
					<div class="font-medium text-slate-900 dark:text-white truncate">
						{linkedEntity?.name ?? 'Unknown Entity'}
					</div>
					{#if typeDef}
						<div class="text-xs text-slate-500 dark:text-slate-400">
							{typeDef.label}
						</div>
					{/if}
				</div>

				<!-- Bidirectional indicator (optional) -->
				{#if link.bidirectional && link.reverseRelationship}
					<div class="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
						↔ {formatRelationship(link.reverseRelationship)}
					</div>
				{/if}
			</a>
		{/each}
	</div>
{:else}
	<p class="text-sm text-slate-500 dark:text-slate-400 italic">
		No relationships to display.
	</p>
{/if}
