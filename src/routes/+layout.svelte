<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Header, Sidebar } from '$lib/components/layout';
	import { ChatPanel } from '$lib/components/chat';
	import Toast from '$lib/components/ui/Toast.svelte';
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

		<!-- Chat panel -->
		{#if uiStore.chatPanelOpen}
			<ChatPanel />
		{/if}
	</main>
	<Toast />
</div>
