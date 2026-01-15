<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Header, Sidebar } from '$lib/components/layout';
	import { campaignStore, entitiesStore, uiStore } from '$lib/stores';
	import { initializeDatabase } from '$lib/db';

	let { children } = $props();

	onMount(async () => {
		// Initialize database
		await initializeDatabase();

		// Load initial data
		await campaignStore.load();
		await entitiesStore.load();

		// Load theme preference
		uiStore.loadTheme();
	});
</script>

<div class="dashboard-layout">
	<Header />
	<Sidebar />
	<main class="dashboard-main">
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>

		<!-- Chat panel would go here when open -->
		{#if uiStore.chatPanelOpen}
			<aside class="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark overflow-y-auto">
				<div class="p-4">
					<h2 class="text-lg font-semibold mb-4">AI Assistant</h2>
					<p class="text-slate-500 dark:text-slate-400 text-sm">
						Chat functionality coming soon. Configure your API key in Settings.
					</p>
				</div>
			</aside>
		{/if}
	</main>
</div>
