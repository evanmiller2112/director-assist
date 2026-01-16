<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { entitiesStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition, getAllEntityTypes } from '$lib/config/entityTypes';
	import { getIconComponent } from '$lib/utils';
	import type { BaseEntity } from '$lib/types';

	let searchInput = $state('');
	let isOpen = $state(false);
	let selectedIndex = $state(0);
	let inputElement: HTMLInputElement | undefined = $state();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Get all entity types for display
	const allTypes = $derived(
		getAllEntityTypes(campaignStore.customEntityTypes, campaignStore.entityTypeOverrides)
	);

	// Group filtered results by type
	const groupedResults = $derived.by(() => {
		if (!searchInput.trim()) return {};

		const filtered = entitiesStore.filteredEntities;
		const groups: Record<string, BaseEntity[]> = {};

		for (const entity of filtered) {
			if (!groups[entity.type]) {
				groups[entity.type] = [];
			}
			// Limit to 5 per type
			if (groups[entity.type].length < 5) {
				groups[entity.type].push(entity);
			}
		}

		return groups;
	});

	// Flatten results for keyboard navigation
	const flatResults = $derived.by(() => {
		const results: BaseEntity[] = [];
		for (const type of Object.keys(groupedResults)) {
			results.push(...groupedResults[type]);
		}
		return results;
	});

	const hasResults = $derived(flatResults.length > 0);
	const totalResults = $derived(entitiesStore.filteredEntities.length);

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchInput = value;

		// Debounce the store update
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			entitiesStore.setSearchQuery(value);
		}, 150);

		if (value.trim()) {
			isOpen = true;
			selectedIndex = 0;
		} else {
			isOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' && searchInput.trim()) {
				isOpen = true;
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, flatResults.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				e.preventDefault();
				if (flatResults[selectedIndex]) {
					navigateToEntity(flatResults[selectedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				closeDropdown();
				break;
			case 'Tab':
				closeDropdown();
				break;
		}
	}

	function navigateToEntity(entity: BaseEntity) {
		closeDropdown();
		goto(`/entities/${entity.type}/${entity.id}`);
	}

	function closeDropdown() {
		isOpen = false;
		searchInput = '';
		entitiesStore.setSearchQuery('');
	}

	function handleFocus() {
		if (searchInput.trim()) {
			isOpen = true;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.search-container')) {
			closeDropdown();
		}
	}

	function getTypeDefinition(type: string) {
		return (
			getEntityTypeDefinition(
				type,
				campaignStore.customEntityTypes,
				campaignStore.entityTypeOverrides
			) ?? { label: type, labelPlural: type, icon: 'package', color: 'slate' }
		);
	}

	// Expose focus method for global keyboard shortcut
	export function focus() {
		inputElement?.focus();
	}

	$effect(() => {
		// Add click outside listener when dropdown is open
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="search-container relative hidden sm:block">
	<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
	<input
		bind:this={inputElement}
		type="text"
		placeholder="Search entities... (⌘K)"
		class="input pl-10 w-64"
		value={searchInput}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onfocus={handleFocus}
		aria-label="Search entities"
		aria-expanded={isOpen}
		aria-controls="search-results"
		role="combobox"
		autocomplete="off"
	/>

	{#if isOpen && searchInput.trim()}
		<div
			id="search-results"
			class="search-dropdown"
			role="listbox"
			aria-label="Search results"
		>
			{#if hasResults}
				{#each Object.entries(groupedResults) as [type, entities], groupIndex}
					{@const typeDef = getTypeDefinition(type)}
					{@const IconComponent = getIconComponent(typeDef.icon)}
					<div class="search-type-group">
						<div class="search-type-header">
							<IconComponent class="w-3.5 h-3.5 text-{typeDef.color}" />
							<span>{typeDef.labelPlural}</span>
						</div>
						{#each entities as entity, entityIndex}
							{@const flatIndex = flatResults.indexOf(entity)}
							<button
								type="button"
								class="search-result-item {flatIndex === selectedIndex ? 'selected' : ''}"
								onclick={() => navigateToEntity(entity)}
								onmouseenter={() => (selectedIndex = flatIndex)}
								role="option"
								aria-selected={flatIndex === selectedIndex}
							>
								<span class="font-medium text-slate-900 dark:text-white truncate">
									{entity.name}
								</span>
								{#if entity.description}
									<span class="text-sm text-slate-500 dark:text-slate-400 truncate">
										{entity.description.slice(0, 60)}{entity.description.length > 60 ? '...' : ''}
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{/each}

				{#if totalResults > flatResults.length}
					<div class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center border-t border-slate-200 dark:border-slate-700">
						Showing {flatResults.length} of {totalResults} results
					</div>
				{/if}
			{:else}
				<div class="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
					No results found for "{searchInput}"
				</div>
			{/if}
		</div>
	{/if}
</div>
