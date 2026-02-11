<script lang="ts">
	/**
	 * Test fixture component that simulates the backup reminder logic from +layout.svelte
	 *
	 * This component replicates the exact issue:
	 * - Uses $derived.by() to compute banner state
	 * - Reads from localStorage (non-reactive)
	 * - handleDismiss writes to localStorage but doesn't trigger re-computation
	 *
	 * This component will exhibit the bug in RED phase, demonstrating that
	 * the banner doesn't disappear when dismissed.
	 */

	import {
		shouldShowBackupReminder,
		getLastBackupPromptDismissedAt,
		setLastBackupPromptDismissedAt,
		getDaysSinceExport
	} from '$lib/services/backupReminderService';

	interface Props {
		entityCount: number;
		lastExportedAt: Date | null;
		lastMilestoneReached: number;
		onStateComputed?: () => void;
		exposeReactiveSignal?: boolean;
	}

	let {
		entityCount = $bindable(5),
		lastExportedAt = $bindable(null),
		lastMilestoneReached = $bindable(0),
		onStateComputed,
		exposeReactiveSignal = false
	}: Props = $props();

	// Reactive signal to force re-computation when dismiss is called
	// This fixes Issue #423 by making localStorage reads reactive
	let dismissSignal = $state(0);

	// This now includes the reactive fix for Issue #423
	// By referencing dismissSignal, the derived state re-computes when it changes
	const backupReminderState = $derived.by(() => {
		// Reference the reactive signal to force re-computation
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		dismissSignal;

		// Notify test that state is being computed
		onStateComputed?.();

		// Get saved state from localStorage (now reactive via dismissSignal)
		const lastDismissedAt = getLastBackupPromptDismissedAt();

		// Check if should show
		const result = shouldShowBackupReminder(
			entityCount,
			lastExportedAt,
			lastDismissedAt,
			lastMilestoneReached
		);

		// Calculate days since export for time-based message
		const daysSinceExport = getDaysSinceExport(lastExportedAt);

		return {
			show: result.show,
			reason: result.reason,
			entityCount,
			daysSinceExport
		};
	});

	// Simulates handleBackupDismiss from +layout.svelte
	function handleDismiss() {
		// Save dismiss time to localStorage
		setLastBackupPromptDismissedAt(new Date());

		// Increment the reactive signal to trigger re-computation
		dismissSignal++;
	}
</script>

<!-- Conditionally render banner based on backupReminderState -->
{#if backupReminderState.show && backupReminderState.reason}
	<div data-testid="backup-banner" class="backup-reminder-banner">
		<div class="banner-content">
			<p>Backup reminder: {backupReminderState.reason}</p>
			<p>Entity count: {backupReminderState.entityCount}</p>
			{#if backupReminderState.daysSinceExport !== null}
				<p>Days since export: {backupReminderState.daysSinceExport}</p>
			{/if}
		</div>

		<div class="banner-actions">
			<button
				type="button"
				data-testid="dismiss-button"
				onclick={handleDismiss}
			>
				Remind Me Later
			</button>

			<button
				type="button"
				data-testid="close-button"
				onclick={handleDismiss}
				aria-label="Close"
			>
				X
			</button>
		</div>
	</div>
{/if}

<!-- Expose reactive signal for testing (after fix is implemented) -->
{#if exposeReactiveSignal}
	<div data-testid="reactive-signal" style="display: none;">
		{dismissSignal}
	</div>
{/if}

<style>
	.backup-reminder-banner {
		padding: 1rem;
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.banner-content {
		margin-bottom: 0.5rem;
	}

	.banner-actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #d97706;
		background: white;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	button:hover {
		background: #fef3c7;
	}
</style>
