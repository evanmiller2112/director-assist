<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Header, Sidebar } from '$lib/components/layout';
	import { ChatPanel } from '$lib/components/chat';
	import Toast from '$lib/components/ui/Toast.svelte';
	import BackupReminderBanner from '$lib/components/ui/BackupReminderBanner.svelte';
	import AiSetupBanner from '$lib/components/ui/AiSetupBanner.svelte';
	import IntegrityWarningBanner from '$lib/components/ui/IntegrityWarningBanner.svelte';
	import IntegrityRecoveryDialog from '$lib/components/ui/IntegrityRecoveryDialog.svelte';
	import { ErrorBoundary } from '$lib/components/ui';
	import { aiSettings, campaignStore, entitiesStore, uiStore, integrityCheckStore } from '$lib/stores';
	import { initializeDatabase, db } from '$lib/db';
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
		shouldShowAiSetupBanner,
		detectPlayerMode,
		scheduleIntegrityCheck,
		runIntegrityCheck
	} from '$lib/services';
	import { goto, afterNavigate } from '$app/navigation';

	// Close mobile sidebar on navigation
	afterNavigate(() => {
		uiStore.closeMobileSidebar();
	});

	let { children } = $props();
	let headerComponent: ReturnType<typeof Header> | undefined = $state();

	// App mode state
	let appMode = $state<'loading' | 'director' | 'player'>('loading');

	// Reactive signal to force backup reminder state re-computation (Issue #423)
	// localStorage reads are not reactive, so we use this signal to trigger updates
	let backupDismissSignal = $state(0);

	// Reactive signal to force AI setup reminder state re-computation (Issue #490)
	// localStorage reads are not reactive, so we use this signal to trigger updates
	let aiDismissSignal = $state(0);

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
		// Reference the reactive signal to force re-computation when dismissed (Issue #490)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		aiDismissSignal;

		const isDismissed = isAiSetupDismissed();
		const hasApiKey = hasAnyApiKey();
		const show = shouldShowAiSetupBanner(aiSettings.isEnabled, isDismissed, hasApiKey);

		return { show };
	});

	onMount(async () => {
		// Check if this is a player-mode deployment
		// (player_data.json exists at the server root)
		const isPlayerMode = await detectPlayerMode();

		if (isPlayerMode) {
			appMode = 'player';
			// Load theme for player mode
			uiStore.loadTheme();
			// If not already on /player route, redirect
			if (!window.location.pathname.startsWith('/player')) {
				goto('/player/', { replaceState: true });
			}
			return; // Skip director initialization
		}

		appMode = 'director';

		// Initialize database
		await initializeDatabase();

		// Load initial data
		await campaignStore.load();
		await entitiesStore.load();

		// Load AI settings
		await aiSettings.load();

		// Load theme preference
		uiStore.loadTheme();

		// Schedule background integrity check (non-blocking, runs after idle)
		scheduleIntegrityCheck(
			() => runIntegrityCheck(db),
			(result) => {
				integrityCheckStore.result = result;
				if (result.hasMajorIssues) {
					integrityCheckStore.showRecoveryDialog = true;
				} else if (result.hasMinorIssues) {
					integrityCheckStore.showWarning = true;
				}
			},
			(error) => {
				console.error('Integrity check failed:', error);
			}
		);
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
		// Increment signal to trigger aiSetupReminderState re-computation (Issue #490)
		aiDismissSignal++;
	}

	function handleAiSetupDisableAi() {
		// Director not using AI - dismiss banner AND disable AI
		setAiSetupDismissed();
		aiSettings.setEnabled(false);
		// Increment signal to trigger aiSetupReminderState re-computation (Issue #490)
		aiDismissSignal++;
	}

	// Integrity check handlers (Issue #511)
	function handleIntegrityExport() {
		goto('/settings?action=export');
	}

	function handleIntegrityViewDetails() {
		integrityCheckStore.dismissWarning();
		integrityCheckStore.openRecoveryDialog();
	}

	function handleIntegrityDismissWarning() {
		integrityCheckStore.dismissWarning();
	}

	async function handleIntegrityRepair() {
		await integrityCheckStore.repair();
	}

	async function handleIntegrityReset() {
		await integrityCheckStore.reset();
	}

	function handleIntegrityCloseDialog() {
		integrityCheckStore.closeRecoveryDialog();
	}

	// Handle global keydown only in director mode
	function handleGlobalKeydownWrapper(e: KeyboardEvent) {
		if (appMode === 'director') {
			handleGlobalKeydown(e);
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydownWrapper} />

{#if appMode === 'loading'}
	<!-- Brief loading state while detecting mode -->
	<div class="h-screen flex items-center justify-center bg-white dark:bg-slate-900">
		<div class="inline-block w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
	</div>
{:else if appMode === 'player'}
	<!-- Player mode: just render children (the /player/ routes handle everything) -->
	{@render children()}
{:else}
	<!-- Director mode: full layout -->
	<div class="dashboard-layout">
		<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2">
			Skip to main content
		</a>
		<Header bind:this={headerComponent} />
		<Sidebar mobileOpen={uiStore.mobileSidebarOpen} />

		<!-- Mobile sidebar backdrop -->
		{#if uiStore.mobileSidebarOpen}
			<button
				class="sidebar-backdrop lg:hidden"
				onclick={() => uiStore.closeMobileSidebar()}
				aria-label="Close sidebar"
			></button>
		{/if}

		<main id="main-content" class="dashboard-main">
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

				<!-- Integrity warning banner (minor issues) -->
				{#if integrityCheckStore.showWarning}
					<div class="mb-6">
						<IntegrityWarningBanner
							issues={integrityCheckStore.result?.issues ?? []}
							onExport={handleIntegrityExport}
							onViewDetails={handleIntegrityViewDetails}
							onDismiss={handleIntegrityDismissWarning}
						/>
					</div>
				{/if}

				{@render children()}
			</div>

			<!-- Chat panel -->
			{#if aiSettings.isEnabled && uiStore.chatPanelOpen}
				<ErrorBoundary
					context="chat-panel"
					fallbackTitle="Chat Error"
					fallbackDescription="The chat assistant encountered an error."
				>
					{#snippet children()}
						<ChatPanel />
					{/snippet}
				</ErrorBoundary>
			{/if}
		</main>
		<!-- Integrity recovery dialog (major issues) -->
		<IntegrityRecoveryDialog
			open={integrityCheckStore.showRecoveryDialog}
			issues={integrityCheckStore.result?.issues ?? []}
			loading={integrityCheckStore.isChecking}
			onRepair={handleIntegrityRepair}
			onExport={handleIntegrityExport}
			onReset={handleIntegrityReset}
			onClose={handleIntegrityCloseDialog}
		/>

		<Toast />
	</div>
{/if}
