import { db } from '../index';
import { liveQuery, type Observable } from 'dexie';
import type { Campaign } from '$lib/types';
import { createCampaign } from '$lib/types';
import { nanoid } from 'nanoid';

export const campaignRepository = {
	// Get the current campaign (there's only one at a time)
	getCurrent(): Observable<Campaign | undefined> {
		return liveQuery(async () => {
			const campaigns = await db.campaign.toArray();
			return campaigns[0];
		});
	},

	// Get campaign synchronously
	async getCurrentSync(): Promise<Campaign | undefined> {
		const campaigns = await db.campaign.toArray();
		return campaigns[0];
	},

	// Create or update the campaign
	async save(campaign: Partial<Campaign> & { name: string }): Promise<Campaign> {
		const existing = await this.getCurrentSync();

		if (existing) {
			// Update existing
			const updated: Campaign = {
				...existing,
				...campaign,
				updatedAt: new Date()
			};
			await db.campaign.put(updated);
			return updated;
		} else {
			// Create new
			const now = new Date();
			const newCampaign: Campaign = {
				...createCampaign(campaign.name, campaign),
				id: nanoid(),
				createdAt: now,
				updatedAt: now
			};
			await db.campaign.add(newCampaign);
			return newCampaign;
		}
	},

	// Update campaign settings
	async updateSettings(
		settings: Partial<Campaign['settings']>
	): Promise<void> {
		const campaign = await this.getCurrentSync();
		if (!campaign) return;

		await db.campaign.update(campaign.id, {
			settings: { ...campaign.settings, ...settings },
			updatedAt: new Date()
		});
	},

	// Clear campaign (for import)
	async clear(): Promise<void> {
		await db.campaign.clear();
	}
};
