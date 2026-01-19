<script lang="ts">
	import { Download, X } from 'lucide-svelte';
	import type { BackupReminderReason } from '$lib/types';

	interface Props {
		reason: BackupReminderReason;
		entityCount: number;
		daysSinceExport?: number | null;
		onExportNow?: () => void;
		onDismiss?: () => void;
	}

	let { reason, entityCount, daysSinceExport, onExportNow, onDismiss }: Props = $props();

	// Generate message based on reason
	const message = $derived.by(() => {
		switch (reason) {
			case 'first-time':
				return `You've created ${entityCount} entities! It's a good time to start backing up your campaign data.`;
			case 'milestone':
				return `Great progress! You've reached ${entityCount} entities. Time for a backup?`;
			case 'time-based':
				return `It's been ${daysSinceExport} days since your last backup. Keep your data safe!`;
			default:
				return 'Time to backup your campaign data!';
		}
	});

	function handleExport() {
		onExportNow?.();
	}

	function handleDismiss() {
		onDismiss?.();
	}
</script>

<div
	role="alert"
	aria-live="polite"
	class="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
>
	<!-- Icon -->
	<div class="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
		<Download class="w-5 h-5 text-amber-600 dark:text-amber-400" />
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<p class="text-sm text-amber-900 dark:text-amber-100 mb-3">
			{message}
		</p>

		<!-- Action buttons -->
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white border-0 focus:ring-amber-500 text-sm px-3 py-1.5"
				onclick={handleExport}
			>
				Backup Now
			</button>
			<button
				type="button"
				class="btn btn-secondary border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-sm px-3 py-1.5"
				onclick={handleDismiss}
			>
				Remind Me Later
			</button>
		</div>
	</div>

	<!-- Close button -->
	<button
		type="button"
		class="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
		onclick={handleDismiss}
		aria-label="Close"
	>
		<X class="w-5 h-5" />
	</button>
</div>
