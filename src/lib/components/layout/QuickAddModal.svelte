<script lang="ts">
	import { getAllEntityTypes } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';
	import { getIconComponent } from '$lib/utils/icons';
	import { goto } from '$app/navigation';
	import { X, Search } from 'lucide-svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	let searchQuery = $state('');
	let searchInputRef: HTMLInputElement | undefined = $state();

	// Get all entity types
	const allEntityTypes = $derived(
		getAllEntityTypes(campaignStore.customEntityTypes, campaignStore.entityTypeOverrides)
	);

	// Filter entity types based on search query
	const filteredEntityTypes = $derived.by(() => {
		if (!searchQuery.trim()) {
			return allEntityTypes;
		}

		const query = searchQuery.toLowerCase();
		return allEntityTypes.filter((type) => {
			return type.label.toLowerCase().includes(query) || type.labelPlural.toLowerCase().includes(query);
		});
	});

	// Focus search input when modal opens
	$effect(() => {
		if (open && searchInputRef) {
			// Use setTimeout to ensure the DOM is ready
			setTimeout(() => {
				searchInputRef?.focus();
			}, 0);
		}
	});

	// Clear search when modal is closed
	$effect(() => {
		if (!open) {
			searchQuery = '';
		}
	});

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		// Only close if clicking the backdrop itself, not the content
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	async function handleEntityTypeClick(entityType: string) {
		await goto(`/entities/${entityType}/new`);
		handleClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="quick-add-modal-title"
			tabindex="-1"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"
			>
				<h2 id="quick-add-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Add Entity
				</h2>
				<button
					onclick={handleClose}
					class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 flex-1 overflow-y-auto">
				<!-- Search Input -->
				<div class="mb-4">
					<label for="entity-search" class="sr-only">Search entity types</label>
					<div class="relative">
						<Search
							class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
						/>
						<input
							id="entity-search"
							type="text"
							bind:value={searchQuery}
							bind:this={searchInputRef}
							placeholder="Search entity types..."
							class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							aria-label="Search entity types"
						/>
					</div>
				</div>

				<!-- Entity Type Grid -->
				{#if filteredEntityTypes.length === 0 && allEntityTypes.length === 0}
					<p class="text-center text-slate-500 dark:text-slate-400 py-8">
						No entity types available.
					</p>
				{:else if filteredEntityTypes.length === 0}
					<p class="text-center text-slate-500 dark:text-slate-400 py-8">
						No entity types found matching your search.
					</p>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						{#each filteredEntityTypes as entityType}
							{@const Icon = getIconComponent(entityType.icon)}
							<button
								onclick={() => handleEntityTypeClick(entityType.type)}
								class="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
							>
								<div
									class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
									style="background-color: var(--color-{entityType.color}, #94a3b8); opacity: 0.2;"
								>
									<Icon
										class="w-6 h-6"
										style="color: var(--color-{entityType.color}, currentColor)"
									/>
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-slate-900 dark:text-white truncate">
										{entityType.label}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex gap-2 justify-end p-4 border-t border-slate-200 dark:border-slate-700">
				<button onclick={handleClose} class="btn btn-ghost">Cancel</button>
			</div>
		</div>
	</div>
{/if}
