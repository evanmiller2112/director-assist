<script lang="ts">
	import { X, ArrowRight, ArrowLeftRight } from 'lucide-svelte';
	import { entitiesStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';
	import type { PendingRelationship } from '$lib/types';

	interface Props {
		relationships: PendingRelationship[];
		onRemove: (tempId: string) => void;
	}

	let { relationships, onRemove }: Props = $props();

	function getEntityName(entityId: string): string {
		const entity = entitiesStore.getById(entityId);
		return entity?.name || '(Unknown)';
	}

	function getEntityType(entityId: string): string {
		const entity = entitiesStore.getById(entityId);
		if (!entity) return '';
		const typeDef = getEntityTypeDefinition(
			entity.type,
			campaignStore.customEntityTypes,
			campaignStore.entityTypeOverrides
		);
		return typeDef?.label ?? entity.type;
	}

	function getStrengthClasses(strength: 'strong' | 'moderate' | 'weak' | undefined): string {
		switch (strength) {
			case 'strong':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'moderate':
				return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
			case 'weak':
				return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
			default:
				return '';
		}
	}
</script>

{#if relationships.length === 0}
	<div class="text-center py-8 text-slate-500 dark:text-slate-400">
		<p>No relationships added yet</p>
		<p class="text-sm mt-1">Add relationships to link this entity when it's created</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each relationships as rel}
			<div
				class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow group relative"
			>
				<!-- Header with entity name and type -->
				<div class="flex items-start justify-between mb-2">
					<div class="flex-1 min-w-0">
						<div class="text-base font-semibold text-slate-900 dark:text-white">
							{getEntityName(rel.targetId)}
						</div>
						<div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
							{getEntityType(rel.targetId)}
						</div>
					</div>

					<!-- Remove button -->
					<button
						onclick={() => onRemove(rel.tempId)}
						class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
						aria-label="Remove relationship"
						type="button"
					>
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Relationship -->
				<div class="flex items-center gap-2 mb-2">
					<span class="text-sm font-medium text-slate-600 dark:text-slate-400">
						{rel.relationship}
					</span>

					{#if rel.bidirectional}
						{#if rel.reverseRelationship && rel.reverseRelationship !== rel.relationship}
							<span title="Bidirectional asymmetric">
								<ArrowLeftRight class="w-3.5 h-3.5 text-blue-500" />
							</span>
							<span class="text-xs text-blue-500 dark:text-blue-400">
								{rel.reverseRelationship}
							</span>
						{:else}
							<span title="Bidirectional">
								<ArrowLeftRight class="w-3.5 h-3.5 text-slate-400" />
							</span>
						{/if}
					{:else}
						<span title="Unidirectional">
							<ArrowRight class="w-3.5 h-3.5 text-slate-400" />
						</span>
					{/if}
				</div>

				<!-- Strength badge -->
				{#if rel.strength}
					<div class="mb-2">
						<span
							class="inline-block px-2 py-1 rounded-md text-xs font-medium {getStrengthClasses(
								rel.strength
							)}"
						>
							{rel.strength}
						</span>
					</div>
				{/if}

				<!-- Notes -->
				{#if rel.notes && rel.notes.trim()}
					<div class="mb-2">
						<p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
							{rel.notes}
						</p>
					</div>
				{/if}

				<!-- Tags -->
				{#if rel.metadata?.tags && rel.metadata.tags.length > 0}
					<div class="mb-2">
						<div class="flex flex-wrap gap-1.5">
							{#each rel.metadata.tags as tag}
								<span
									class="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
								>
									{tag}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Tension indicator -->
				{#if rel.metadata?.tension !== undefined && rel.metadata.tension !== null}
					<div class="mb-2">
						<div class="flex items-center justify-between text-xs mb-1">
							<span class="font-medium text-slate-500 dark:text-slate-400">Tension</span>
							<span class="font-semibold text-slate-700 dark:text-slate-300"
								>{rel.metadata.tension}</span
							>
						</div>
						<div
							class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
						>
							<div
								class="h-full rounded-full transition-all duration-300"
								class:bg-green-500={rel.metadata.tension < 30}
								class:bg-yellow-500={rel.metadata.tension >= 30 && rel.metadata.tension < 70}
								class:bg-red-500={rel.metadata.tension >= 70}
								style="width: {rel.metadata.tension}%"
							></div>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
