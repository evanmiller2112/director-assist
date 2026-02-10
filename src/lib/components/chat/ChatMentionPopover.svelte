<script lang="ts">
	import type { EntityStub } from '$lib/services/mentionDetectionService';
	import { resolvePartialMention } from '$lib/services/mentionDetectionService';

	interface Props {
		entities: EntityStub[];
		searchText: string;
		visible: boolean;
		onSelect?: (entity: EntityStub) => void;
		onClose?: () => void;
	}

	let { entities, searchText, visible, onSelect, onClose }: Props = $props();

	// Track highlighted index for keyboard navigation
	let highlightedIndex = $state(0);

	// Filter entities using the mentionDetectionService
	const filteredEntities = $derived.by(() => {
		// If searchText is empty, return all entities in original order
		if (!searchText.trim()) {
			return entities.slice(0, 10);
		}
		const filtered = resolvePartialMention(searchText, entities);
		// Limit to 10 results as per tests
		return filtered.slice(0, 10);
	});

	// Reset highlighted index when filtered results change
	$effect(() => {
		// Watch for changes in filteredEntities
		filteredEntities;
		highlightedIndex = 0;
	});

	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (filteredEntities.length > 0) {
					highlightedIndex = (highlightedIndex + 1) % filteredEntities.length;
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (filteredEntities.length > 0) {
					highlightedIndex = (highlightedIndex - 1 + filteredEntities.length) % filteredEntities.length;
				}
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredEntities.length > 0) {
					const selected = filteredEntities[highlightedIndex];
					if (selected) {
						onSelect?.(selected);
					}
				}
				break;
			case 'Escape':
				event.preventDefault();
				onClose?.();
				break;
		}
	}

	function handleClick(entity: EntityStub) {
		onSelect?.(entity);
	}

	function handleMouseEnter(index: number) {
		highlightedIndex = index;
	}
</script>

{#if visible}
	<div
		role="listbox"
		aria-label="Mention suggestions"
		class="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-auto max-h-64"
		onkeydown={handleKeyDown}
		tabindex="-1"
	>
		{#if filteredEntities.length === 0}
			<div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
				No matches found
			</div>
		{:else}
			{#each filteredEntities as entity, index (entity.id)}
				<button
					type="button"
					role="option"
					aria-selected={index === highlightedIndex}
					class="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between {index === highlightedIndex ? 'bg-slate-100 dark:bg-slate-700' : ''}"
					onclick={() => handleClick(entity)}
					onmouseenter={() => handleMouseEnter(index)}
				>
					<span class="text-sm text-slate-900 dark:text-white">
						{entity.name}
					</span>
					<span class="text-xs text-slate-500 dark:text-slate-400 ml-2">
						{entity.type}
					</span>
				</button>
			{/each}
		{/if}
	</div>
{/if}
