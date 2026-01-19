<!--
  @component ConfirmDialog

  A reusable modal dialog for confirming potentially destructive actions.

  @prop {boolean} [open=false] - Controls dialog visibility
  @prop {string} [title] - Dialog title (optional)
  @prop {string} message - Warning/confirmation message to display
  @prop {string} [confirmText='Confirm'] - Text for confirm button
  @prop {string} [cancelText='Cancel'] - Text for cancel button
  @prop {'default' | 'warning' | 'danger'} [variant='default'] - Visual variant
  @prop {boolean} [loading=false] - Loading state (disables buttons)
  @prop {Function} [onConfirm] - Callback when user confirms
  @prop {Function} [onCancel] - Callback when user cancels

  @example
  ```svelte
  <ConfirmDialog
    open={showConfirm}
    title="Replace Content?"
    message="This will overwrite your existing content. This action cannot be undone."
    variant="warning"
    confirmText="Generate"
    cancelText="Cancel"
    onConfirm={handleGenerate}
    onCancel={() => showConfirm = false}
  />
  ```
-->
<script lang="ts">
	import { AlertTriangle, AlertCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'default' | 'warning' | 'danger';
		loading?: boolean;
		onConfirm?: () => void;
		onCancel?: () => void;
	}

	let {
		open = false,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		loading = false,
		onConfirm,
		onCancel
	}: Props = $props();

	let dialogRef: HTMLDivElement | undefined = $state();
	let confirmButtonRef: HTMLButtonElement | undefined = $state();

	// Handle keyboard events
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open && onCancel) {
			onCancel();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget && onCancel) {
			onCancel();
		}
	}

	// Handle confirm action
	function handleConfirm() {
		if (onConfirm && !loading) {
			onConfirm();
		}
	}

	// Handle cancel action
	function handleCancel() {
		if (onCancel && !loading) {
			onCancel();
		}
	}

	// Handle keyboard events on confirm button
	function handleConfirmKeyDown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === ' ') && !loading) {
			e.preventDefault();
			handleConfirm();
		}
	}

	// Handle keyboard events on cancel button
	function handleCancelKeyDown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === ' ') && !loading) {
			e.preventDefault();
			handleCancel();
		}
	}

	// Focus management - focus confirm button when dialog opens
	$effect(() => {
		if (open && confirmButtonRef) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				confirmButtonRef?.focus();
			}, 0);
		}
	});

	// Get variant-specific classes
	const variantClasses = $derived(
		variant === 'danger'
			? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white focus:ring-red-500'
			: variant === 'warning'
				? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white focus:ring-amber-500'
				: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white focus:ring-slate-500'
	);

	// Get icon for variant
	const Icon = $derived(
		variant === 'danger' || variant === 'warning' ? AlertTriangle : AlertCircle
	);

	// Generate unique IDs for accessibility
	const titleId = `confirm-dialog-title-${Math.random().toString(36).substring(2, 9)}`;
	const messageId = `confirm-dialog-message-${Math.random().toString(36).substring(2, 9)}`;
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		bind:this={dialogRef}
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		aria-describedby={messageId}
	>
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Content -->
			<div class="p-6">
				<!-- Icon and Title -->
				<div class="flex items-start gap-4 mb-4">
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {variant ===
						'danger'
							? 'bg-red-100 dark:bg-red-900/30'
							: variant === 'warning'
								? 'bg-amber-100 dark:bg-amber-900/30'
								: 'bg-slate-100 dark:bg-slate-700'}"
					>
						<Icon
							class="w-5 h-5 {variant === 'danger'
								? 'text-red-600 dark:text-red-400'
								: variant === 'warning'
									? 'text-amber-600 dark:text-amber-400'
									: 'text-slate-600 dark:text-slate-400'}"
						/>
					</div>
					<div class="flex-1">
						{#if title}
							<h2 id={titleId} class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
								{title}
							</h2>
						{/if}
						<p id={messageId} class="text-sm text-slate-600 dark:text-slate-300">
							{message}
						</p>
					</div>
				</div>

				<!-- Buttons -->
				<div class="flex gap-3 justify-end mt-6">
					<button
						type="button"
						onclick={handleCancel}
						onkeydown={handleCancelKeyDown}
						disabled={loading}
						class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{cancelText}
					</button>
					<button
						bind:this={confirmButtonRef}
						type="button"
						onclick={handleConfirm}
						onkeydown={handleConfirmKeyDown}
						disabled={loading}
						aria-busy={loading}
						class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors {variantClasses}"
					>
						{#if loading}
							<span class="flex items-center gap-2">
								<svg
									class="animate-spin h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								{confirmText}
							</span>
						{:else}
							{confirmText}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
