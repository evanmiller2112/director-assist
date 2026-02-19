<!--
  @component IntegrityWarningBanner

  A non-blocking warning banner surfaced when minor database integrity issues
  are detected. Gives the user three actions: back up their data, view the full
  recovery dialog, or dismiss the notice.

  @prop {IntegrityIssue[]} issues - The list of detected integrity issues
  @prop {Function} [onExport] - Called when "Back Up Now" is clicked
  @prop {Function} [onViewDetails] - Called when "View Details" is clicked
  @prop {Function} [onDismiss] - Called when "Dismiss" is clicked
-->
<script lang="ts">
	import { AlertTriangle, Download, Info, X } from 'lucide-svelte';
	import type { IntegrityIssue } from '$lib/types/dbIntegrity';

	interface Props {
		issues: IntegrityIssue[];
		onExport?: () => void;
		onViewDetails?: () => void;
		onDismiss?: () => void;
	}

	let { issues, onExport, onViewDetails, onDismiss }: Props = $props();

	const count = $derived(issues.length);

	function handleExport() {
		onExport?.();
	}

	function handleViewDetails() {
		onViewDetails?.();
	}

	function handleDismiss() {
		onDismiss?.();
	}
</script>

{#if count > 0}
	<div
		role="alert"
		aria-live="polite"
		class="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
	>
		<!-- Warning icon -->
		<div
			class="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center"
		>
			<AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<p class="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
				Database integrity warning: {count}
				{count === 1 ? 'item' : 'items'} found
			</p>
			<p class="text-sm text-amber-800 dark:text-amber-200 mb-3">
				Minor database problems were detected. Back up your data now to keep it safe, or
				view details to learn more.
			</p>

			<!-- Action buttons -->
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white border-0 focus:ring-amber-500 text-sm px-3 py-1.5"
					onclick={handleExport}
				>
					<Download class="w-4 h-4 mr-1 inline" aria-hidden="true" />
					Back Up Now
				</button>
				<button
					type="button"
					class="btn btn-secondary border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-sm px-3 py-1.5"
					onclick={handleViewDetails}
				>
					<Info class="w-4 h-4 mr-1 inline" aria-hidden="true" />
					View Details
				</button>
			</div>
		</div>

		<!-- Dismiss button -->
		<button
			type="button"
			class="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
			onclick={handleDismiss}
			aria-label="Dismiss"
		>
			<X class="w-5 h-5" aria-hidden="true" />
		</button>
	</div>
{/if}
