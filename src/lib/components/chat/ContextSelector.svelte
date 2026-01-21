<script lang="ts">
	import { ChevronDown, ChevronUp, Search, X, Link } from 'lucide-svelte';
	import { entitiesStore, chatStore } from '$lib/stores';
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';

	let isExpanded = $state(false);
	let searchQuery = $state('');

	const allEntities = $derived(entitiesStore.entities);
	const selectedIds = $derived(chatStore.contextEntityIds);
	const includeLinked = $derived(chatStore.includeLinkedEntities);

	const filteredEntities = $derived.by(() => {
		if (!searchQuery) return allEntities;
		const query = searchQuery.toLowerCase();
		return allEntities.filter(
			(e) =>
				e.name.toLowerCase().includes(query) ||
				e.type.toLowerCase().includes(query) ||
				e.tags.some((t) => t.toLowerCase().includes(query))
		);
	});

	const selectedEntities = $derived(
		allEntities.filter((e) => selectedIds.includes(e.id))
	);

	// Estimate context size
	const contextStats = $derived.by(() => {
		let charCount = 0;
		for (const entity of selectedEntities) {
			if (entity.summary) {
				charCount += entity.summary.length + entity.name.length + 20; // rough estimate
			}
		}
		return {
			entityCount: selectedEntities.length,
			charCount,
			estimatedTokens: Math.ceil(charCount / 4)
		};
	});

	function toggleEntity(id: string) {
		if (selectedIds.includes(id)) {
			chatStore.removeContextEntity(id);
		} else {
			chatStore.addContextEntity(id);
		}
	}

	function clearAll() {
		chatStore.clearContextEntities();
	}

	function getTypeLabel(type: string): string {
		const def = getEntityTypeDefinition(
			type,
			campaignStore.customEntityTypes,
			campaignStore.entityTypeOverrides
		);
		return def?.label ?? type;
	}
</script>

<div class="border-b border-slate-200 dark:border-slate-700">
	<!-- Header / Toggle -->
	<button
		type="button"
		class="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<span class="flex items-center gap-2">
			<Link class="w-4 h-4" />
			Entity Selection
			{#if selectedIds.length > 0}
				<span class="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
					{selectedIds.length} selected
				</span>
			{/if}
		</span>
		{#if isExpanded}
			<ChevronUp class="w-4 h-4" />
		{:else}
			<ChevronDown class="w-4 h-4" />
		{/if}
	</button>

	<!-- Expanded content -->
	{#if isExpanded}
		<div class="px-4 pb-3 space-y-3">
			<!-- Search -->
			<div class="relative">
				<Search class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
				<input
					type="text"
					placeholder="Search entities..."
					class="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
					bind:value={searchQuery}
				/>
			</div>

			<!-- Include linked toggle -->
			<label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
				<input
					type="checkbox"
					checked={includeLinked}
					onchange={(e) => chatStore.setIncludeLinkedEntities(e.currentTarget.checked)}
					class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
				/>
				Include linked entities
			</label>

			<!-- Entity list -->
			<div class="max-h-48 overflow-y-auto space-y-1">
				{#each filteredEntities as entity}
					<label
						class="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
					>
						<input
							type="checkbox"
							checked={selectedIds.includes(entity.id)}
							onchange={() => toggleEntity(entity.id)}
							class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
						/>
						<span class="flex-1 text-sm text-slate-900 dark:text-white truncate">
							{entity.name}
						</span>
						<span class="text-xs text-slate-400 dark:text-slate-500">
							{getTypeLabel(entity.type)}
						</span>
						{#if !entity.summary}
							<span class="text-xs text-amber-500" title="No summary - won't provide context">
								!
							</span>
						{/if}
					</label>
				{:else}
					<p class="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
						{searchQuery ? 'No matching entities' : 'No entities yet'}
					</p>
				{/each}
			</div>

			<!-- Stats and clear -->
			{#if selectedIds.length > 0}
				<div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
					<span>~{contextStats.estimatedTokens} tokens</span>
					<button
						type="button"
						class="flex items-center gap-1 text-red-500 hover:text-red-600"
						onclick={clearAll}
					>
						<X class="w-3 h-3" />
						Clear all
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
