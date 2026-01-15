<script lang="ts">
	import { Search, MessageSquare, Settings, Menu } from 'lucide-svelte';
	import { campaignStore, uiStore, entitiesStore } from '$lib/stores';

	let searchInput = $state('');

	function handleSearch(e: Event) {
		const target = e.target as HTMLInputElement;
		entitiesStore.setSearchQuery(target.value);
	}
</script>

<header class="dashboard-header flex items-center justify-between px-4 bg-white dark:bg-surface-dark">
	<div class="flex items-center gap-4">
		<button
			class="btn btn-ghost p-2 lg:hidden"
			onclick={() => uiStore.toggleSidebar()}
			aria-label="Toggle sidebar"
		>
			<Menu class="w-5 h-5 text-slate-700 dark:text-slate-300" />
		</button>

		<div class="flex items-center gap-2">
			<h1 class="text-xl font-bold text-slate-900 dark:text-white">
				{campaignStore.campaign?.name ?? 'Director Assist'}
			</h1>
			{#if campaignStore.campaign?.system}
				<span class="text-sm text-slate-500 dark:text-slate-400">
					({campaignStore.campaign.system})
				</span>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-2">
		<!-- Search -->
		<div class="relative hidden sm:block">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
			<input
				type="text"
				placeholder="Search entities..."
				class="input pl-10 w-64"
				bind:value={searchInput}
				oninput={handleSearch}
			/>
		</div>

		<!-- Chat toggle -->
		<button
			class="btn btn-ghost p-2"
			onclick={() => uiStore.toggleChatPanel()}
			aria-label="Toggle AI chat"
			title="AI Assistant"
		>
			<MessageSquare class="w-5 h-5 text-slate-700 dark:text-slate-300" />
		</button>

		<!-- Settings -->
		<a href="/settings" class="btn btn-ghost p-2" aria-label="Settings" title="Settings">
			<Settings class="w-5 h-5 text-slate-700 dark:text-slate-300" />
		</a>
	</div>
</header>
