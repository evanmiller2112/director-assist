<!--
  @component IntegrityRecoveryDialog

  A modal dialog shown when major database integrity issues are detected.
  Offers three recovery paths:
  - Attempt automatic repair
  - Export data (safety backup before drastic action)
  - Full database reset (requires two-click confirmation to prevent accidents)

  The reset action uses a confirmation gate: first click enters a confirmation
  state, and the user must explicitly confirm before onReset is called.

  @prop {boolean} open - Controls dialog visibility
  @prop {IntegrityIssue[]} issues - The list of detected integrity issues
  @prop {boolean} [loading=false] - Disables action buttons and shows spinner
  @prop {Function} [onRepair] - Called when user confirms repair
  @prop {Function} [onExport] - Called when user clicks "Export Data"
  @prop {Function} [onReset] - Called when user confirms the reset action
  @prop {Function} [onClose] - Called when user dismisses the dialog
-->
<script lang="ts">
	import { AlertTriangle, Download, RotateCcw, WrenchIcon, X } from 'lucide-svelte';
	import type { IntegrityIssue } from '$lib/types/dbIntegrity';

	interface Props {
		open: boolean;
		issues: IntegrityIssue[];
		loading?: boolean;
		onRepair?: () => void;
		onExport?: () => void;
		onReset?: () => void;
		onClose?: () => void;
	}

	let {
		open,
		issues,
		loading = false,
		onRepair,
		onExport,
		onReset,
		onClose
	}: Props = $props();

	// Two-click confirmation gate for the destructive reset action
	let confirmingReset = $state(false);

	// Unique IDs for accessibility
	const titleId = `integrity-dialog-title-${Math.random().toString(36).substring(2, 9)}`;

	function handleRepair() {
		onRepair?.();
	}

	function handleExport() {
		onExport?.();
	}

	function handleResetFirstClick() {
		// First click: enter confirmation state, do NOT call onReset yet
		confirmingReset = true;
	}

	function handleResetConfirm() {
		confirmingReset = false;
		onReset?.();
	}

	function handleResetCancel() {
		confirmingReset = false;
	}

	function handleClose() {
		confirmingReset = false;
		onClose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop / overlay -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		aria-busy={loading}
	>
		<!-- Dialog panel -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
			}}
		>
			<!-- Header -->
			<div class="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
						<AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
					</div>
					<div>
						<h2 id={titleId} class="text-lg font-semibold text-slate-900 dark:text-white">
							Database Integrity Problem
						</h2>
						<p class="text-sm text-slate-500 dark:text-slate-400">
							{issues.length} {issues.length === 1 ? 'item' : 'items'} found
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={handleClose}
					class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded"
					aria-label="Close"
				>
					<X class="w-5 h-5" aria-hidden="true" />
				</button>
			</div>

			<!-- Issues list -->
			<div class="p-6">
				{#if issues.length > 0}
					<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
						What was found:
					</h3>
					<ul class="space-y-2 mb-6 max-h-48 overflow-y-auto">
						{#each issues as issue}
							<li class="flex items-start gap-2 text-sm">
								<span
									class="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {issue.severity === 'major'
										? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
										: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}"
								>
									{issue.severity}
								</span>
								<span class="text-slate-700 dark:text-slate-300">{issue.message}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-slate-500 dark:text-slate-400 mb-6">No issues to display.</p>
				{/if}

				<!-- Reset confirmation banner (shown after first reset click) -->
				{#if confirmingReset}
					<div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-sm text-red-700 dark:text-red-300 mb-3">
							This action cannot be undone. All data will be permanently deleted.
						</p>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={handleResetConfirm}
								class="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								Yes, Reset
							</button>
							<button
								type="button"
								onclick={handleResetCancel}
								class="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
							>
								No, Cancel
							</button>
						</div>
					</div>
				{/if}

				<!-- Action buttons -->
				<div class="flex flex-wrap gap-3">
					<!-- Attempt Repair -->
					<button
						type="button"
						onclick={handleRepair}
						disabled={loading}
						class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if loading}
							<svg
								class="animate-spin h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{:else}
							<WrenchIcon class="w-4 h-4" aria-hidden="true" />
						{/if}
						Attempt Repair
					</button>

					<!-- Export Data -->
					<button
						type="button"
						onclick={handleExport}
						class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
					>
						<Download class="w-4 h-4" aria-hidden="true" />
						Export Data
					</button>

					<!-- Reset Database (first click enters confirmation state) -->
					<button
						type="button"
						onclick={handleResetFirstClick}
						disabled={loading}
						class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<RotateCcw class="w-4 h-4" aria-hidden="true" />
						Reset All Data
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
