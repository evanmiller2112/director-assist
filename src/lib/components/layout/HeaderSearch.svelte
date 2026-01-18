<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { entitiesStore, campaignStore } from '$lib/stores';
	import { getEntityTypeDefinition, getAllEntityTypes } from '$lib/config/entityTypes';
	import { getIconComponent, parseCommandWithArgument, filterCommands } from '$lib/utils';
	import { COMMANDS } from '$lib/config/commands';
	import type { BaseEntity } from '$lib/types';
	import type { CommandDefinition } from '$lib/config/commands';

	let searchInput = $state('');
	let isOpen = $state(false);
	let selectedIndex = $state(0);
	let inputElement: HTMLInputElement | undefined = $state();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Command mode detection
	const isCommandMode = $derived(searchInput.startsWith('/'));

	// Get current entity from URL params
	const currentEntityId = $derived($page.params.id ?? null);
	const currentEntity = $derived(currentEntityId ? entitiesStore.getById(currentEntityId) : null);

	// Get all entity types for display
	const allTypes = $derived(
		getAllEntityTypes(campaignStore.customEntityTypes, campaignStore.entityTypeOverrides)
	);

	// Get all entities for relationship syntax parsing
	const entities = $derived(entitiesStore.entities);

	// Command filtering
	const filteredCommands = $derived.by(() => {
		if (!isCommandMode) return [];

		const { command } = parseCommandWithArgument(searchInput);
		const context = {
			currentEntityId,
			currentEntityType: currentEntity?.type ?? null
		};

		return filterCommands(command, COMMANDS, context);
	});

	// Group filtered results by type
	const groupedResults = $derived.by(() => {
		if (!searchInput.trim() || isCommandMode) return {};

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
	const flatResults = $derived.by((): (CommandDefinition | BaseEntity)[] => {
		if (isCommandMode) {
			return filteredCommands;
		}

		const results: BaseEntity[] = [];
		for (const type of Object.keys(groupedResults)) {
			results.push(...groupedResults[type]);
		}
		return results;
	});

	const hasResults = $derived(flatResults.length > 0);
	const totalResults = $derived(
		isCommandMode ? filteredCommands.length : entitiesStore.filteredEntities.length
	);

	function parseRelationshipSyntax(input: string): {
		relatedTo: string | undefined;
		relationshipType: string | undefined;
		remainingText: string;
	} {
		let relatedTo: string | undefined;
		let relationshipType: string | undefined;
		let text = input;

		// Parse all related: syntax occurrences (use last one)
		const relatedMatches = [...text.matchAll(/related:(?:"([^"]+)"|(\S+))/gi)];
		if (relatedMatches.length > 0) {
			const lastMatch = relatedMatches[relatedMatches.length - 1];
			relatedTo = lastMatch[1] || lastMatch[2];

			// Remove all occurrences from text
			for (const match of relatedMatches) {
				text = text.replace(match[0], '').trim();
			}

			// Try to resolve entity name to ID
			const entity = entities.find(
				(e) => e.name.toLowerCase() === relatedTo?.toLowerCase() || e.id === relatedTo
			);
			if (entity) {
				relatedTo = entity.id;
			}
		}

		// Parse all relationship: syntax occurrences (use last one)
		const relationshipMatches = [...text.matchAll(/relationship:(?:"([^"]+)"|(\S+))/gi)];
		if (relationshipMatches.length > 0) {
			const lastMatch = relationshipMatches[relationshipMatches.length - 1];
			relationshipType = (lastMatch[1] || lastMatch[2]).toLowerCase();

			// Remove all occurrences from text
			for (const match of relationshipMatches) {
				text = text.replace(match[0], '').trim();
			}
		}

		return {
			relatedTo,
			relationshipType,
			remainingText: text
		};
	}

	function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchInput = value;

		// In command mode, don't debounce and don't update entity search
		if (value.startsWith('/')) {
			// Command mode - show results immediately
			// Clear relationship filters when entering command mode
			entitiesStore.clearRelationshipFilter();

			if (value.trim()) {
				isOpen = true;
				selectedIndex = 0;
			} else {
				isOpen = false;
			}
		} else {
			// Search mode - check for relationship syntax first
			const { relatedTo, relationshipType, remainingText } = parseRelationshipSyntax(value);

			// Debounce the store update
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				// Apply relationship filters using individual methods
				if (relatedTo) {
					entitiesStore.filterByRelatedTo(relatedTo);
				} else {
					entitiesStore.filterByRelatedTo(undefined);
				}

				if (relationshipType) {
					entitiesStore.filterByRelationshipType(relationshipType);
				} else {
					entitiesStore.filterByRelationshipType(undefined);
				}

				// If no filters, ensure they're cleared
				if (!relatedTo && !relationshipType) {
					entitiesStore.clearRelationshipFilter();
				}

				// Apply text search with remaining text
				entitiesStore.setSearchQuery(remainingText);
			}, 150);

			if (value.trim()) {
				isOpen = true;
				selectedIndex = 0;
			} else {
				isOpen = false;
			}
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
				if (isCommandMode) {
					// Execute command
					const command = flatResults[selectedIndex] as CommandDefinition;
					if (command) {
						executeCommand(command);
					}
				} else {
					// Navigate to entity
					const entity = flatResults[selectedIndex] as BaseEntity;
					if (entity) {
						navigateToEntity(entity);
					}
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

	function executeCommand(command: CommandDefinition) {
		const { argument } = parseCommandWithArgument(searchInput);
		const context = {
			currentEntityId,
			currentEntityType: currentEntity?.type ?? null,
			goto
		};

		command.execute(context, argument);
		closeDropdown();
	}

	function closeDropdown() {
		isOpen = false;
		// Don't clear searchInput - allow user to keep their search and reopen dropdown
		// Only clear the store's search query to reset entity filtering
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
		placeholder={isCommandMode ? 'Enter command...' : 'Search entities... (⌘K)'}
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
			aria-label={isCommandMode ? 'Command suggestions' : 'Search results'}
		>
			{#if isCommandMode}
				{#if hasResults}
					{#each filteredCommands as command, index}
						{@const IconComponent = getIconComponent(command.icon)}
						<button
							type="button"
							class="command-item {index === selectedIndex ? 'selected' : ''}"
							onclick={() => executeCommand(command)}
							onmouseenter={() => (selectedIndex = index)}
							role="option"
							aria-selected={index === selectedIndex}
						>
							<IconComponent class="w-4 h-4 text-slate-500 dark:text-slate-400" />
							<div class="flex flex-col flex-1">
								<span class="font-medium text-slate-900 dark:text-white">
									/{command.id}
								</span>
								<span class="text-sm text-slate-500 dark:text-slate-400">
									{command.description}
								</span>
							</div>
						</button>
					{/each}
				{:else}
					<div class="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
						No commands found
					</div>
				{/if}
			{:else if hasResults}
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
