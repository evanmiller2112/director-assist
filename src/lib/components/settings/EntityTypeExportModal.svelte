<script lang="ts">
	import { X, Download } from 'lucide-svelte';
	import { getIconComponent } from '$lib/utils/icons';
	import { exportEntityType } from '$lib/services/entityTypeExportService';
	import type { EntityTypeDefinition } from '$lib/types';

	interface Props {
		open: boolean;
		entityType: EntityTypeDefinition;
		onclose?: () => void;
	}

	let { open = false, entityType, onclose }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);
	let author = $state('');
	let license = $state('');
	let sourceUrl = $state('');

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
			// Reset state when closing
			author = '';
			license = '';
			sourceUrl = '';
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
		onclose?.();
	}

	function handleDownload() {
		// Prepare metadata
		const metadata = {
			...(author ? { author: author.trim() } : {}),
			...(license ? { license: license.trim() } : {}),
			...(sourceUrl ? { sourceUrl: sourceUrl.trim() } : {})
		};

		// Export the entity type
		const exported = exportEntityType(entityType, metadata);

		// Create JSON blob
		const json = JSON.stringify(exported, null, 2);
		const blob = new Blob([json], { type: 'application/json' });

		// Create download link
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${entityType.type}-entity-type.json`;

		// Trigger download
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up
		URL.revokeObjectURL(url);

		// Close modal
		handleClose();
	}

	const Icon = $derived(getIconComponent(entityType.icon));
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-2xl p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="export-modal-title"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
						<Download class="w-5 h-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h2 id="export-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Export Entity Type
					</h2>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleClose}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- Entity Type Preview -->
				<div>
					<h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">
						Preview
					</h3>
					<div class="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
								<Icon class="w-6 h-6" />
							</div>
							<div class="flex-1">
								<h4 class="font-semibold text-slate-900 dark:text-white mb-1">
									{entityType.label}
								</h4>
								<p class="text-sm text-slate-600 dark:text-slate-400">
									{entityType.fieldDefinitions.length} {entityType.fieldDefinitions.length === 1 ? 'field' : 'fields'}
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Export Format Info -->
				<div class="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
					<p class="text-sm text-blue-900 dark:text-blue-200">
						<strong>Export Format:</strong> JSON
					</p>
					<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
						This file can be imported into other Director Assist campaigns or shared with other users.
					</p>
				</div>

				<!-- Metadata (Optional) -->
				<div class="space-y-4">
					<h3 class="text-sm font-semibold text-slate-900 dark:text-white">
						Metadata (Optional)
					</h3>

					<!-- Author -->
					<div>
						<label for="export-author" class="label">
							Author
						</label>
						<input
							id="export-author"
							type="text"
							class="input"
							bind:value={author}
							placeholder="Your name"
						/>
					</div>

					<!-- License -->
					<div>
						<label for="export-license" class="label">
							License
						</label>
						<input
							id="export-license"
							type="text"
							class="input"
							bind:value={license}
							placeholder="e.g., CC-BY-4.0, MIT"
						/>
					</div>

					<!-- Source URL -->
					<div>
						<label for="export-source-url" class="label">
							Source URL
						</label>
						<input
							id="export-source-url"
							type="url"
							class="input"
							bind:value={sourceUrl}
							placeholder="https://example.com/source"
						/>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleClose}
				>
					Close
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleDownload}
				>
					<Download class="w-4 h-4 mr-2" />
					Download
				</button>
			</div>
		</div>
	</dialog>
{/if}
