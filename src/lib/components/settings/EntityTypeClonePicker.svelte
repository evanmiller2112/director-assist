<script lang="ts">
	import { X, Copy, Search } from 'lucide-svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import { cloneEntityType } from '$lib/utils/cloneEntityType';
	import { getIconComponent } from '$lib/utils/icons';
	import type { EntityTypeDefinition } from '$lib/types';

	interface Props {
		open: boolean;
		onselect?: (entityType: EntityTypeDefinition) => void;
		oncancel?: () => void;
	}

	let { open = false, onselect, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let searchQuery = $state('');
	let selectedType: EntityTypeDefinition | null = $state(null);

	// Filter entity types based on search
	const filteredBuiltIn = $derived(
		BUILT_IN_ENTITY_TYPES.filter((type) =>
			type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
			type.labelPlural.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredCustom = $derived(
		campaignStore.customEntityTypes.filter((type) =>
			type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
			type.labelPlural.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const hasResults = $derived(filteredBuiltIn.length > 0 || filteredCustom.length > 0);

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
			// Focus search input after opening
			setTimeout(() => {
				const input = dialogElement?.querySelector('input[type="text"]') as HTMLInputElement;
				input?.focus();
			}, 0);
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
			// Reset state when closing
			searchQuery = '';
			selectedType = null;
		}
	});

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		const rect = dialogElement?.getBoundingClientRect();
		if (
			rect &&
			(e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom)
		) {
			handleCancel();
		}
	}

	// Handle Escape key
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleCancel();
		}
	}

	function handleCancel() {
		oncancel?.();
	}

	function selectType(type: EntityTypeDefinition) {
		selectedType = type;
	}

	function handleClone() {
		if (selectedType) {
			try {
				const cloned = cloneEntityType(selectedType);
				onselect?.(cloned);
			} catch (error) {
				// Fallback for environments that don't support structuredClone (like test env)
				const cloned = JSON.parse(JSON.stringify(selectedType));
				cloned.type = '';
				cloned.isBuiltIn = false;
				cloned.label = `${selectedType.label} (Copy)`;
				if (selectedType.labelPlural) {
					cloned.labelPlural = `${selectedType.labelPlural} (Copy)`;
				}
				onselect?.(cloned);
			}
		}
	}

	// Get color classes for entity type cards
	function getColorClasses(color: string, isSelected: boolean): string {
		const baseClasses = isSelected
			? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
			: 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
		return `border-2 ${baseClasses}`;
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-3xl p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		oncancel={(e) => {
			e.preventDefault();
			handleCancel();
		}}
		aria-modal="true"
		aria-labelledby="clone-picker-title"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.stopPropagation();
				}
			}}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
						<Copy class="w-5 h-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h2 id="clone-picker-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Clone Entity Type
					</h2>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleCancel}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Search -->
			<div class="p-4 border-b border-slate-200 dark:border-slate-700">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
					<input
						type="text"
						class="input pl-10"
						placeholder="Search entity types..."
						bind:value={searchQuery}
					/>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				{#if !hasResults}
					<div class="text-center py-12">
						<p class="text-slate-600 dark:text-slate-400">
							No entity types found matching "{searchQuery}"
						</p>
					</div>
				{:else}
					<!-- Built-in Types -->
					{#if filteredBuiltIn.length > 0}
						<section>
							<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
								Built-in Types
							</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each filteredBuiltIn as type}
									{@const Icon = getIconComponent(type.icon)}
									{@const isSelected = selectedType?.type === type.type}
									<button
										type="button"
										class="text-left rounded-lg p-4 transition-all {getColorClasses(type.color, isSelected)}"
										onclick={() => selectType(type)}
										aria-label="Select {type.label} to clone"
									>
										<div class="flex items-start gap-3">
											<div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
												<Icon class="w-5 h-5" role="img" aria-hidden="true" />
											</div>
											<div class="flex-1 min-w-0">
												<h4 class="font-medium text-slate-900 dark:text-white mb-1">
													{type.label}
												</h4>
												<p class="text-xs text-slate-500 dark:text-slate-400">
													{type.fieldDefinitions.length} {type.fieldDefinitions.length === 1 ? 'field' : 'fields'}
												</p>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</section>
					{/if}

					<!-- Custom Types -->
					{#if filteredCustom.length > 0}
						<section>
							<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
								Custom Types
							</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each filteredCustom as type}
									{@const Icon = getIconComponent(type.icon)}
									{@const isSelected = selectedType?.type === type.type}
									<button
										type="button"
										class="text-left rounded-lg p-4 transition-all {getColorClasses(type.color, isSelected)}"
										onclick={() => selectType(type)}
										aria-label="Select {type.label} to clone"
									>
										<div class="flex items-start gap-3">
											<div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
												<Icon class="w-5 h-5" role="img" aria-hidden="true" />
											</div>
											<div class="flex-1 min-w-0">
												<h4 class="font-medium text-slate-900 dark:text-white mb-1">
													{type.label}
												</h4>
												<p class="text-xs text-slate-500 dark:text-slate-400">
													{type.fieldDefinitions.length} {type.fieldDefinitions.length === 1 ? 'field' : 'fields'}
												</p>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</section>
					{:else if searchQuery === ''}
						<section>
							<h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
								Custom Types
							</h3>
							<p class="text-sm text-slate-500 dark:text-slate-400 italic">
								No custom entity types yet
							</p>
						</section>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleClone}
					disabled={!selectedType}
				>
					Clone Selected
				</button>
			</div>
		</div>
	</dialog>
{/if}
