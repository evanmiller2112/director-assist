<script lang="ts">
	import { AlertTriangle, X } from 'lucide-svelte';
	import type { EntityTypeDefinition } from '$lib/types';

	interface Props {
		open: boolean;
		entityType: EntityTypeDefinition;
		entityCount: number;
		loading?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let { open = false, entityType, entityCount, loading = false, onconfirm, oncancel }: Props = $props();

	let confirmText = $state('');
	let dialogElement: HTMLDialogElement | null = $state(null);

	// Check if confirmation matches
	const isConfirmed = $derived(confirmText === entityType.label);

	// Handle modal open/close
	$effect(() => {
		if (open && dialogElement && !dialogElement.open) {
			dialogElement.showModal();
			// Focus the input after opening
			setTimeout(() => {
				const input = dialogElement?.querySelector('input[type="text"]') as HTMLInputElement;
				input?.focus();
			}, 0);
		} else if (!open && dialogElement?.open) {
			dialogElement.close();
			// Clear confirmation text when closing
			confirmText = '';
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
		if (!loading) {
			oncancel?.();
		}
	}

	function handleConfirm() {
		if (isConfirmed && !loading) {
			onconfirm?.();
		}
	}

	// Get entity count text (singular/plural)
	const entityCountText = $derived(
		entityCount === 0
			? `No entities`
			: entityCount === 1
				? `1 ${entityType.label}`
				: `${entityCount} ${entityType.labelPlural}`
	);
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="fixed inset-0 z-50 w-full max-w-md p-0 bg-transparent backdrop:bg-black/50"
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		aria-modal="true"
		aria-labelledby="delete-modal-title"
		aria-describedby="delete-modal-description"
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
					<h2 id="delete-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
						Delete {entityType.label}?
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
			<div id="delete-modal-description" class="p-6 space-y-4">
				<!-- Entity count warning -->
				<div class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
					<p class="text-sm font-medium text-red-900 dark:text-red-200">
						{entityCountText} will be permanently deleted
					</p>
				</div>

				<!-- Warning message -->
				<div class="space-y-2">
					<p class="text-sm text-red-600 dark:text-red-400 font-medium">
						This action cannot be undone.
					</p>
					<p class="text-sm text-slate-700 dark:text-slate-300">
						All entities of this type and their associated data will be permanently deleted.
					</p>
					<p class="text-sm text-red-600 dark:text-red-400 font-medium">
						You will lose all data for this entity type.
					</p>
				</div>

				<!-- Confirmation input -->
				<div>
					<label for="confirm-input" class="label">
						Type <span class="font-semibold">{entityType.label}</span> to confirm
					</label>
					<input
						id="confirm-input"
						type="text"
						class="input"
						bind:value={confirmText}
						placeholder={entityType.label}
						disabled={loading}
					/>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
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
					class="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleConfirm}
					disabled={!isConfirmed || loading}
					aria-busy={loading}
				>
					{loading ? 'Deleting...' : 'Delete'}
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
