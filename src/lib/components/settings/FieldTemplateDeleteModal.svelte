<script lang="ts">
	import { X, AlertTriangle } from 'lucide-svelte';
	import type { FieldTemplate } from '$lib/types';

	interface Props {
		open: boolean;
		template: FieldTemplate;
		loading?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let { open = false, template, loading = false, onconfirm, oncancel }: Props = $props();

	let dialogElement: HTMLDialogElement | null = $state(null);

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
			// Focus delete button after opening
			setTimeout(() => {
				const deleteButton = dialogElement?.querySelector('button[data-delete]') as HTMLButtonElement;
				deleteButton?.focus();
			}, 0);
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
		}
	});

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (loading) return;

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
		if (!loading) {
			oncancel?.();
		}
	}

	function handleConfirm() {
		if (!loading) {
			onconfirm?.();
		}
	}
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-md p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="delete-template-title"
		aria-describedby="delete-template-description"
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[90vh] overflow-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-start gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
					<AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
				</div>
				<div class="flex-1">
					<h2 id="delete-template-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Delete Template?
					</h2>
				</div>
				<button
					type="button"
					class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
					onclick={handleCancel}
					disabled={loading}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-4">
				<p id="delete-template-description" class="text-sm text-slate-700 dark:text-slate-300">
					Are you sure you want to delete the field template <strong class="font-semibold">{template.name}</strong>?
				</p>

				<p class="text-sm text-red-600 dark:text-red-400 font-medium">
					This action cannot be undone.
				</p>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
				<button
					type="button"
					class="btn btn-secondary"
					onclick={handleCancel}
					disabled={loading}
				>
					Cancel
				</button>
				<button
					type="button"
					data-delete
					class="btn bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 disabled:bg-red-400 disabled:border-red-400 dark:bg-red-600 dark:hover:bg-red-700"
					onclick={handleConfirm}
					disabled={loading}
					aria-busy={loading}
				>
					{loading ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</div>
	</dialog>
{/if}
