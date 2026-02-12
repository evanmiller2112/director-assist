<script lang="ts">
	import { Globe, X } from 'lucide-svelte';
	import { getPlayerExportPreview } from '$lib/services/playerExportService';
	import { publishPlayerData } from '$lib/services';
	import type { PlayerExportPreview } from '$lib/types/playerExport';
	import { notificationStore } from '$lib/stores/notifications.svelte';

	interface Props {
		open: boolean;
		onclose?: () => void;
		onpublished?: (publishedAt: Date) => void;
	}

	let { open = $bindable(false), onclose, onpublished }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let isPublishing = $state(false);
	let isLoadingPreview = $state(false);
	let preview: PlayerExportPreview | null = $state(null);

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
			loadPreview();
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
		}
	});

	async function loadPreview() {
		isLoadingPreview = true;
		try {
			preview = await getPlayerExportPreview();
		} catch (err) {
			console.error('Failed to load preview:', err);
			preview = null;
		} finally {
			isLoadingPreview = false;
		}
	}

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
			handleClose();
		}
	}

	// Handle Escape key
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose();
		}
	}

	function handleClose() {
		if (!isPublishing) {
			onclose?.();
		}
	}

	async function handlePublish() {
		isPublishing = true;
		try {
			const result = await publishPlayerData();
			notificationStore.success('Player data published successfully');
			onpublished?.(result.publishedAt);
			handleClose();
		} catch (err) {
			console.error('Publish failed:', err);
			notificationStore.error('Failed to publish: ' + (err instanceof Error ? err.message : 'Unknown error'));
		} finally {
			isPublishing = false;
		}
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-lg p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="publish-modal-title"
		aria-describedby="publish-modal-description"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.stopPropagation();
				}
			}}
			role="button"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex items-start gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
					<Globe class="w-5 h-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div class="flex-1">
					<h2 id="publish-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Publish to Player View
					</h2>
					<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
						Generate player_data.json for your player-facing instance
					</p>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleClose}
					disabled={isPublishing}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div id="publish-modal-description" class="p-6 space-y-6">
				<!-- Info box -->
				<div class="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
					<p class="text-sm text-blue-900 dark:text-blue-200">
						This will generate a <code class="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-mono">player_data.json</code> file. Place it in the root directory of your player-facing Director Assist instance.
					</p>
				</div>

				<!-- Preview -->
				<div>
					<span class="label mb-2">Export Preview</span>
					<div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
						{#if isLoadingPreview}
							<p class="text-sm text-slate-500 dark:text-slate-400">Loading preview...</p>
						{:else if preview}
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-slate-600 dark:text-slate-400">Entities to export:</span>
									<span class="font-medium text-slate-900 dark:text-white">{preview.totalEntities}</span>
								</div>
								{#if preview.excludedEntities > 0}
									<div class="flex justify-between text-sm">
										<span class="text-slate-600 dark:text-slate-400">Hidden from players:</span>
										<span class="font-medium text-amber-600 dark:text-amber-400">{preview.excludedEntities}</span>
									</div>
								{/if}
								{#if Object.keys(preview.byType).length > 0}
									<div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
										{#each Object.entries(preview.byType) as [type, counts]}
											{#if counts.included > 0 || counts.excluded > 0}
												<div class="flex justify-between text-xs">
													<span class="text-slate-500 dark:text-slate-500 capitalize">{type.replace(/_/g, ' ')}:</span>
													<span class="text-slate-600 dark:text-slate-400">
														{counts.included} included
														{#if counts.excluded > 0}
															<span class="text-amber-600 dark:text-amber-400">({counts.excluded} hidden)</span>
														{/if}
													</span>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<p class="text-sm text-slate-500 dark:text-slate-400">Could not load preview</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleClose}
					disabled={isPublishing}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary inline-flex items-center gap-2"
					onclick={handlePublish}
					disabled={isPublishing || !preview || preview.totalEntities === 0}
					aria-busy={isPublishing}
				>
					<Globe class="w-4 h-4" />
					{isPublishing ? 'Publishing...' : 'Publish'}
				</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	dialog {
		border: none;
		outline: none;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
	}
</style>
