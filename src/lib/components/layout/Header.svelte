<script lang="ts">
	import { MessageSquare, Settings, Menu, ChevronDown, Check } from 'lucide-svelte';
	import { aiSettings, campaignStore, uiStore, notificationStore } from '$lib/stores';
	import { refreshAfterCampaignSwitch } from '$lib/services';
	import HeaderSearch from './HeaderSearch.svelte';

	let campaignDropdownOpen = $state(false);
	let searchComponent: ReturnType<typeof HeaderSearch> | undefined = $state();

	// Expose method to focus search from parent (for global keyboard shortcut)
	export function focusSearch() {
		searchComponent?.focus();
	}

	function toggleCampaignDropdown() {
		campaignDropdownOpen = !campaignDropdownOpen;
	}

	function closeCampaignDropdown() {
		campaignDropdownOpen = false;
	}

	async function switchCampaign(id: string) {
		if (id === campaignStore.activeCampaignId) {
			closeCampaignDropdown();
			return;
		}
		try {
			await campaignStore.setActiveCampaign(id);
			notificationStore.success('Switched campaign');
			// Refresh all data for new campaign
			await refreshAfterCampaignSwitch({ navigateTo: '/' });
		} catch (error) {
			console.error('Failed to switch campaign:', error);
			notificationStore.error('Failed to switch campaign');
		}
		closeCampaignDropdown();
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

		<!-- Campaign Selector -->
		<div class="relative">
			<button
				class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
				onclick={toggleCampaignDropdown}
				aria-label="Select campaign"
				aria-expanded={campaignDropdownOpen}
			>
				<h1 class="text-xl font-bold text-slate-900 dark:text-white">
					{campaignStore.campaign?.name ?? 'Director Assist'}
				</h1>
				{#if campaignStore.campaign?.fields?.system}
					<span class="text-sm text-slate-500 dark:text-slate-400">
						({campaignStore.campaign.fields.system})
					</span>
				{/if}
				{#if campaignStore.allCampaigns.length > 1}
					<ChevronDown class="w-4 h-4 text-slate-500 transition-transform {campaignDropdownOpen ? 'rotate-180' : ''}" />
				{/if}
			</button>

			<!-- Dropdown Menu -->
			{#if campaignDropdownOpen && campaignStore.allCampaigns.length > 0}
				<!-- Backdrop to close dropdown -->
				<button
					class="fixed inset-0 z-40 bg-transparent"
					onclick={closeCampaignDropdown}
					aria-label="Close campaign dropdown"
				></button>

				<div class="absolute left-0 top-full mt-1 z-50 min-w-[200px] max-w-[300px] bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1">
					<!-- Campaign List -->
					{#each campaignStore.allCampaigns as camp}
						<button
							class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
							onclick={() => switchCampaign(camp.id)}
						>
							<span class="flex-1 truncate">
								<span class="font-medium text-slate-900 dark:text-white">{camp.name}</span>
								{#if camp.fields?.system}
									<span class="text-xs text-slate-500 dark:text-slate-400 ml-1">
										({camp.fields.system})
									</span>
								{/if}
							</span>
							{#if camp.id === campaignStore.activeCampaignId}
								<Check class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
							{/if}
						</button>
					{/each}

					<!-- Divider and Manage Link -->
					<div class="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
						<a
							href="/entities/campaign"
							class="block w-full px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
							onclick={closeCampaignDropdown}
						>
							Manage Campaigns...
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-2">
		<!-- Search -->
		<HeaderSearch bind:this={searchComponent} />

		<!-- Chat toggle -->
		{#if aiSettings.isEnabled}
			<button
				class="btn btn-ghost p-2"
				onclick={() => uiStore.toggleChatPanel()}
				aria-label="Toggle AI chat"
				title="AI Assistant"
			>
				<MessageSquare class="w-5 h-5 text-slate-700 dark:text-slate-300" />
			</button>
		{/if}

		<!-- Settings -->
		<a href="/settings" class="btn btn-ghost p-2" aria-label="Settings" title="Settings">
			<Settings class="w-5 h-5 text-slate-700 dark:text-slate-300" />
		</a>
	</div>
</header>
