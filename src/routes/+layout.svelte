<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Header, Sidebar } from '$lib/components/layout';
	import { ChatPanel } from '$lib/components/chat';
	import Toast from '$lib/components/ui/Toast.svelte';
	import BackupReminderBanner from '$lib/components/ui/BackupReminderBanner.svelte';
	import AiSetupBanner from '$lib/components/ui/AiSetupBanner.svelte';
	import { aiSettings, campaignStore, entitiesStore, uiStore } from '$lib/stores';
	import { initializeDatabase } from '$lib/db';
	import {
		shouldShowBackupReminder,
		getLastExportedAt,
		getLastBackupPromptDismissedAt,
		getLastMilestoneReached,
		setLastBackupPromptDismissedAt,
		getDaysSinceExport,
		isAiSetupDismissed,
		setAiSetupDismissed,
		hasAnyApiKey,
		shouldShowAiSetupBanner
	} from '$lib/services';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let headerComponent: ReturnType<typeof Header> | undefined = $state();

	// Reactive signal to force backup reminder state re-computation (Issue #423)
	// localStorage reads are not reactive, so we use this signal to trigger updates
	let backupDismissSignal = $state(0);

	// Backup reminder state
	const backupReminderState = $derived.by(() => {
		// Reference the reactive signal to force re-computation when dismissed
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		backupDismissSignal;

		// Get entity count (exclude campaign entities from count)
		const entityCount = entitiesStore.entities.filter((e) => e.type !== 'campaign').length;

		// Get saved state
		const lastExportedAt = getLastExportedAt();
		const lastDismissedAt = getLastBackupPromptDismissedAt();
		const lastMilestoneReached = getLastMilestoneReached();

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

	// AI setup reminder state
	const aiSetupReminderState = $derived.by(() => {
		const isDismissed = isAiSetupDismissed();
		const hasApiKey = hasAnyApiKey();
		const show = shouldShowAiSetupBanner(aiSettings.isEnabled, isDismissed, hasApiKey);

		return { show };
	});

	onMount(async () => {
		// Initialize database
		await initializeDatabase();

		// Load initial data
		await campaignStore.load();
		await entitiesStore.load();

		// Load AI settings
		await aiSettings.load();

		// Load theme preference
		uiStore.loadTheme();
	});

	function handleGlobalKeydown(e: KeyboardEvent) {
		// Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus search
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			headerComponent?.focusSearch();
		}
	}

	function handleBackupExport() {
		// Navigate to settings with action parameter to trigger export
		goto('/settings?action=export');
	}

	function handleBackupDismiss() {
		// Save dismiss time
		setLastBackupPromptDismissedAt(new Date());
		// Increment signal to trigger backupReminderState re-computation (Issue #423)
		backupDismissSignal++;
	}

	function handleAiSetupGetStarted() {
		// Navigate to settings (AI configuration section)
		goto('/settings');
	}

	function handleAiSetupPlayerDismiss() {
		// Player dismisses banner - don't disable AI, just hide banner
		setAiSetupDismissed();
	}

	function handleAiSetupDisableAi() {
		// Director not using AI - dismiss banner AND disable AI
		setAiSetupDismissed();
		aiSettings.setEnabled(false);
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="dashboard-layout">
	<Header bind:this={headerComponent} />
	<Sidebar />
	<main class="dashboard-main">
		<div class="flex-1 overflow-y-auto p-6">
			<!-- AI setup reminder banner -->
			{#if aiSetupReminderState.show}
				<div class="mb-6">
					<AiSetupBanner
						onGetStarted={handleAiSetupGetStarted}
						onPlayerDismiss={handleAiSetupPlayerDismiss}
						onDisableAi={handleAiSetupDisableAi}
					/>
				</div>
			{/if}

			<!-- Backup reminder banner -->
			{#if backupReminderState.show && backupReminderState.reason}
				<div class="mb-6">
					<BackupReminderBanner
						reason={backupReminderState.reason}
						entityCount={backupReminderState.entityCount}
						daysSinceExport={backupReminderState.daysSinceExport}
						onExportNow={handleBackupExport}
						onDismiss={handleBackupDismiss}
					/>
				</div>
			{/if}

			{@render children()}
		</div>

		<!-- Chat panel -->
		{#if aiSettings.isEnabled && uiStore.chatPanelOpen}
			<ChatPanel />
		{/if}
	</main>
	<Toast />
</div>
