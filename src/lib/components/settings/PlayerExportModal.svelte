<script lang="ts">
	import { Download, X, Users, FileJson, FileText, FileCode } from 'lucide-svelte';
	import { downloadPlayerExport, getPlayerExportPreview } from '$lib/services/playerExportService';
	import type { PlayerExportFormat, PlayerExportOptions, PlayerExportPreview } from '$lib/types/playerExport';
	import { notificationStore } from '$lib/stores/notifications.svelte';

	interface Props {
		open: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let isExporting = $state(false);
	let isLoadingPreview = $state(false);
	let preview: PlayerExportPreview | null = $state(null);

	// Export options
	let selectedFormat = $state<PlayerExportFormat>('json');
	let includeTimestamps = $state(true);
	let includeImages = $state(true);
	let groupByType = $state(true);

	// Build options object
	const exportOptions = $derived<PlayerExportOptions>({
		format: selectedFormat,
		includeTimestamps,
		includeImages,
		groupByType
	});

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
		if (!isExporting) {
			onclose?.();
		}
	}

	async function handleExport() {
		isExporting = true;
		try {
			await downloadPlayerExport(exportOptions);
			notificationStore.success('Player export downloaded successfully');
			handleClose();
		} catch (err) {
			console.error('Export failed:', err);
			notificationStore.error('Failed to export: ' + (err instanceof Error ? err.message : 'Unknown error'));
		} finally {
			isExporting = false;
		}
	}

	// Get icon for format
	function getFormatIcon(format: PlayerExportFormat) {
		switch (format) {
			case 'json':
				return FileJson;
			case 'html':
				return FileText;
			case 'markdown':
				return FileCode;
		}
	}

	// Format descriptions
	const formatDescriptions: Record<PlayerExportFormat, string> = {
		json: 'Structured data for importing into other tools',
		html: 'Nicely formatted, printable reference document',
		markdown: 'For pasting into wikis, notes apps, etc.'
	};
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-lg p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="export-modal-title"
		aria-describedby="export-modal-description"
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
				<div class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
					<Users class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
				</div>
				<div class="flex-1">
					<h2 id="export-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Export for Players
					</h2>
					<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
						Create a player-safe export of your campaign data
					</p>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleClose}
					disabled={isExporting}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div id="export-modal-description" class="p-6 space-y-6">
				<!-- Info box -->
				<div class="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
					<p class="text-sm text-indigo-900 dark:text-indigo-200">
						This export will filter out all DM-only content including private notes, secrets, hidden entities, and chat history.
					</p>
				</div>

				<!-- Format selection -->
				<div>
					<label for="export-format-group" class="label mb-2">Export Format</label>
					<div id="export-format-group" role="group" aria-labelledby="export-format-group" class="grid grid-cols-3 gap-3">
						{#each (['json', 'html', 'markdown'] as const) as format}
							{@const Icon = getFormatIcon(format)}
							<button
								type="button"
								class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
									{selectedFormat === format
										? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
										: 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}"
								onclick={() => selectedFormat = format}
							>
								<Icon class="w-6 h-6 {selectedFormat === format ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}" />
								<span class="text-sm font-medium {selectedFormat === format ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}">
									{format.toUpperCase()}
								</span>
							</button>
						{/each}
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
						{formatDescriptions[selectedFormat]}
					</p>
				</div>

				<!-- Options -->
				<div>
					<span class="label mb-2">Options</span>
					<div class="space-y-3">
						<label for="option-group-by-type" class="flex items-center gap-3">
							<input
								id="option-group-by-type"
								type="checkbox"
								bind:checked={groupByType}
								class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
							/>
							<span class="text-sm text-slate-700 dark:text-slate-300">Group entities by type</span>
						</label>
						<label for="option-include-timestamps" class="flex items-center gap-3">
							<input
								id="option-include-timestamps"
								type="checkbox"
								bind:checked={includeTimestamps}
								class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
							/>
							<span class="text-sm text-slate-700 dark:text-slate-300">Include timestamps</span>
						</label>
						<label for="option-include-images" class="flex items-center gap-3">
							<input
								id="option-include-images"
								type="checkbox"
								bind:checked={includeImages}
								class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
							/>
							<span class="text-sm text-slate-700 dark:text-slate-300">Include image URLs</span>
						</label>
					</div>
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
					disabled={isExporting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary inline-flex items-center gap-2"
					onclick={handleExport}
					disabled={isExporting || !preview || preview.totalEntities === 0}
					aria-busy={isExporting}
				>
					<Download class="w-4 h-4" />
					{isExporting ? 'Exporting...' : 'Export for Players'}
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
