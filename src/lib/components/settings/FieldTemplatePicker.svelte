<script lang="ts">
	import { X, Search, ChevronDown, ChevronUp, Package } from 'lucide-svelte';
	import { campaignStore } from '$lib/stores/campaign.svelte';
	import type { FieldTemplate } from '$lib/types';

	interface Props {
		open: boolean;
		onselect?: (template: FieldTemplate) => void;
		oncancel?: () => void;
	}

	let { open = false, onselect, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let searchQuery = $state('');
	let expandedTemplateId: string | null = $state(null);

	// Filter templates based on search
	const filteredTemplates = $derived(
		campaignStore.fieldTemplates.filter(
			(template) =>
				template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				template.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const hasTemplates = $derived(campaignStore.fieldTemplates.length > 0);
	const hasResults = $derived(filteredTemplates.length > 0);

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
			expandedTemplateId = null;
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

	function selectTemplate(template: FieldTemplate) {
		onselect?.(template);
	}

	function toggleExpand(templateId: string) {
		expandedTemplateId = expandedTemplateId === templateId ? null : templateId;
	}

	function getCategoryLabel(category: string): string {
		return category === 'draw-steel' ? 'Draw Steel' : 'User';
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-3xl p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="template-picker-title"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<h2 id="template-picker-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Select Field Template
				</h2>
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
			{#if hasTemplates}
				<div class="p-4 border-b border-slate-200 dark:border-slate-700">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
						<input
							type="text"
							class="input pl-10"
							placeholder="Search templates..."
							bind:value={searchQuery}
						/>
					</div>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if !hasTemplates}
					<!-- Empty state -->
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
							<Package class="w-8 h-8 text-slate-400" />
						</div>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
							No Field Templates
						</h3>
						<p class="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
							Create your first field template to get started. Templates let you quickly reuse common field configurations.
						</p>
					</div>
				{:else if !hasResults}
					<!-- No search results -->
					<div class="text-center py-12">
						<p class="text-slate-600 dark:text-slate-400">
							No templates found matching "{searchQuery}"
						</p>
					</div>
				{:else}
					<!-- Templates list -->
					<div class="space-y-3">
						{#each filteredTemplates as template}
							{@const isExpanded = expandedTemplateId === template.id}
							<div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
								<!-- Template Card -->
								<div class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
									<div class="flex items-start justify-between gap-3">
										<button
											type="button"
											class="flex-1 min-w-0 text-left"
											onclick={() => selectTemplate(template)}
											aria-label="Select {template.name} template"
										>
											<h3 class="font-semibold text-slate-900 dark:text-white mb-1">
												{template.name}
											</h3>
											{#if template.description}
												<p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
													{template.description}
												</p>
											{/if}
											<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
												<span class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
													{getCategoryLabel(template.category)}
												</span>
												<span>
													{template.fieldDefinitions.length} {template.fieldDefinitions.length === 1 ? 'field' : 'fields'}
												</span>
											</div>
										</button>
										<button
											type="button"
											class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
											onclick={(e) => {
												e.stopPropagation();
												toggleExpand(template.id);
											}}
											aria-label="{isExpanded ? 'Hide' : 'Show'} fields preview"
											aria-expanded={isExpanded}
										>
											{#if isExpanded}
												<ChevronUp class="w-5 h-5" />
											{:else}
												<ChevronDown class="w-5 h-5" />
											{/if}
										</button>
									</div>
								</div>

								<!-- Expanded Field Preview -->
								{#if isExpanded}
									<div class="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
										<div class="mt-3 space-y-2">
											{#each template.fieldDefinitions as field}
												<div class="flex items-start gap-2 text-sm">
													<div class="flex-1">
														<span class="font-medium text-slate-900 dark:text-white">
															{field.label}
														</span>
														<span class="text-slate-500 dark:text-slate-400">
															({field.type})
														</span>
													</div>
													{#if field.required}
														<span class="text-xs text-red-600 dark:text-red-400">
															Required
														</span>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
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
			</div>
		</div>
	</dialog>
{/if}
