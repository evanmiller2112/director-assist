import { campaignRepository } from '$lib/db/repositories';
import type { Campaign } from '$lib/types';
import { createCampaign } from '$lib/types';

// Campaign store using Svelte 5 runes
function createCampaignStore() {
	let campaign = $state<Campaign | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	return {
		get campaign() {
			return campaign;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		async load() {
			isLoading = true;
			error = null;

			try {
				const existing = await campaignRepository.getCurrentSync();
				if (existing) {
					campaign = existing;
				} else {
					// Create a default campaign if none exists
					const newCampaign = await campaignRepository.save({
						name: 'My Campaign',
						description: 'A new adventure begins...',
						system: 'System Agnostic',
						setting: ''
					});
					campaign = newCampaign;
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load campaign';
				console.error('Failed to load campaign:', e);
			} finally {
				isLoading = false;
			}
		},

		async update(changes: Partial<Campaign>) {
			if (!campaign) return;

			try {
				const updated = await campaignRepository.save({
					...campaign,
					...changes
				});
				campaign = updated;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update campaign';
				console.error('Failed to update campaign:', e);
			}
		},

		async updateSettings(settings: Partial<Campaign['settings']>) {
			if (!campaign) return;

			try {
				await campaignRepository.updateSettings(settings);
				campaign = {
					...campaign,
					settings: { ...campaign.settings, ...settings }
				};
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update settings';
				console.error('Failed to update settings:', e);
			}
		}
	};
}

export const campaignStore = createCampaignStore();
