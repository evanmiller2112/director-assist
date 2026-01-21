<script lang="ts">
	import { campaignStore } from '$lib/stores';
	import { entityRepository } from '$lib/db/repositories';
	import { notificationStore } from '$lib/stores';
	import BulkCampaignLinkingModal from './BulkCampaignLinkingModal.svelte';
	import type { BaseEntity } from '$lib/types';

	// Reactive state
	let enabled = $state(false);
	let selectedDefaultCampaign = $state('');
	let showBulkModal = $state(false);
	let unlinkedEntities = $state<BaseEntity[]>([]);
	let isLoading = $state(false);

	// Derived values
	const campaign = $derived(campaignStore.campaign);
	const allCampaigns = $derived(campaignStore.allCampaigns);
	const hasNoCampaigns = $derived(allCampaigns.length === 0);
	const hasMultipleCampaigns = $derived(allCampaigns.length > 1);

	// Initialize values from store
	$effect(() => {
		if (campaign) {
			enabled = campaignStore.enforceCampaignLinking ?? false;
			selectedDefaultCampaign =
				campaignStore.defaultCampaignId || campaign.id;
		}
	});

	async function handleToggle() {
		if (isLoading) return;

		try {
			const newValue = !enabled;

			if (newValue) {
				// Enabling - check for unlinked entities
				isLoading = true;
				unlinkedEntities = await entityRepository.getEntitiesWithoutCampaignLink();

				if (unlinkedEntities.length > 0) {
					// Show modal
					showBulkModal = true;
					// Don't update the toggle yet - wait for user decision
					return;
				}

				// No unlinked entities - just enable
				const targetCampaignId = hasMultipleCampaigns
					? selectedDefaultCampaign
					: campaign?.id;
				await campaignStore.setEnforceCampaignLinking(true, targetCampaignId);
				enabled = true;
			} else {
				// Disabling - just update
				await campaignStore.setEnforceCampaignLinking(false);
				enabled = false;
			}
		} catch (error) {
			console.error('Failed to toggle campaign linking:', error);
			notificationStore.error('Failed to update campaign linking setting');
		} finally {
			isLoading = false;
		}
	}

	async function handleDefaultCampaignChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newValue = target.value;
		selectedDefaultCampaign = newValue;

		try {
			await campaignStore.setDefaultCampaignId(newValue);
		} catch (error) {
			console.error('Failed to update default campaign:', error);
			notificationStore.error('Failed to update default campaign');
		}
	}

	function handleModalConfirm(linkedCount: number) {
		// User confirmed and entities were linked
		enabled = true;
		showBulkModal = false;
		notificationStore.success(`Successfully linked ${linkedCount} entities to campaign`);
	}

	function handleModalSkip() {
		// User wants to enable without linking existing entities
		enabled = true;
		showBulkModal = false;
	}

	function handleModalCancel() {
		// User cancelled - don't enable the setting
		enabled = false;
		showBulkModal = false;
	}
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-lg font-semibold mb-2">Campaign Linking</h3>
		<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
			Automatically link all new entities to campaigns when this setting is enabled.
		</p>
	</div>

	<div class="flex items-center gap-3">
		<input
			type="checkbox"
			id="enforce-campaign-linking"
			class="checkbox"
			checked={enabled}
			disabled={hasNoCampaigns || isLoading}
			onclick={(e) => { e.preventDefault(); handleToggle(); }}
			aria-label="Enforce Campaign Linking"
			aria-disabled={hasNoCampaigns ? 'true' : 'false'}
		/>
		<label for="enforce-campaign-linking" class="text-sm font-medium">
			Enforce Campaign Linking
		</label>
	</div>

	{#if hasNoCampaigns}
		<p class="text-sm text-slate-500 dark:text-slate-400 italic">
			Please create a campaign first to enable this feature.
		</p>
	{/if}

	{#if hasMultipleCampaigns && !hasNoCampaigns}
		<div class="space-y-2">
			<label for="default-campaign" class="text-sm font-medium">Default Campaign</label>
			<select
				id="default-campaign"
				class="input w-full"
				value={selectedDefaultCampaign}
				onchange={handleDefaultCampaignChange}
				aria-label="Default Campaign"
			>
				{#each allCampaigns as camp}
					<option value={camp.id}>{camp.name}</option>
				{/each}
			</select>
			<p class="text-xs text-slate-500 dark:text-slate-400">
				New entities will be automatically linked to this campaign.
			</p>
		</div>
	{/if}
</div>

{#if showBulkModal}
	<BulkCampaignLinkingModal
		open={showBulkModal}
		{unlinkedEntities}
		campaigns={allCampaigns}
		defaultCampaignId={selectedDefaultCampaign}
		onConfirm={handleModalConfirm}
		onSkip={handleModalSkip}
		onCancel={handleModalCancel}
	/>
{/if}

<style>
	.checkbox {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.checkbox:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.input {
		padding: 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		background-color: white;
	}

	:global(.dark) .input {
		background-color: #1e293b;
		border-color: #475569;
		color: white;
	}
</style>
