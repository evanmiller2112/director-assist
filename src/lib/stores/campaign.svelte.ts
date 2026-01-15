import { campaignRepository } from '$lib/db/repositories';
import type { Campaign, EntityTypeDefinition, EntityTypeOverride } from '$lib/types';
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
		},

		// Custom entity type CRUD methods
		get customEntityTypes(): EntityTypeDefinition[] {
			return campaign?.customEntityTypes ?? [];
		},

		async addCustomEntityType(entityType: EntityTypeDefinition): Promise<void> {
			if (!campaign) return;

			// Validate type doesn't already exist
			const existing = campaign.customEntityTypes.find((t) => t.type === entityType.type);
			if (existing) {
				throw new Error(`Entity type "${entityType.type}" already exists`);
			}

			try {
				// Deep clone everything to remove Svelte 5 Proxy wrappers before saving to IndexedDB
				const clonedType = JSON.parse(JSON.stringify(entityType)) as EntityTypeDefinition;
				const clonedCampaign = JSON.parse(JSON.stringify(campaign)) as Campaign;
				clonedCampaign.customEntityTypes = [...clonedCampaign.customEntityTypes, clonedType];

				await campaignRepository.save(clonedCampaign);
				campaign = clonedCampaign;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to add custom entity type';
				console.error('Failed to add custom entity type:', e);
				throw e;
			}
		},

		async updateCustomEntityType(
			type: string,
			updates: Partial<Omit<EntityTypeDefinition, 'type' | 'isBuiltIn'>>
		): Promise<void> {
			if (!campaign) return;

			const index = campaign.customEntityTypes.findIndex((t) => t.type === type);
			if (index === -1) {
				throw new Error(`Entity type "${type}" not found`);
			}

			try {
				// Deep clone everything to remove Svelte 5 Proxy wrappers before saving to IndexedDB
				const clonedUpdates = JSON.parse(JSON.stringify(updates));
				const clonedCampaign = JSON.parse(JSON.stringify(campaign)) as Campaign;
				clonedCampaign.customEntityTypes[index] = {
					...clonedCampaign.customEntityTypes[index],
					...clonedUpdates,
					type, // Ensure type cannot be changed
					isBuiltIn: false // Ensure isBuiltIn stays false
				};

				await campaignRepository.save(clonedCampaign);
				campaign = clonedCampaign;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update custom entity type';
				console.error('Failed to update custom entity type:', e);
				throw e;
			}
		},

		async deleteCustomEntityType(type: string): Promise<void> {
			if (!campaign) return;

			const index = campaign.customEntityTypes.findIndex((t) => t.type === type);
			if (index === -1) {
				throw new Error(`Entity type "${type}" not found`);
			}

			try {
				// Deep clone to remove Svelte 5 Proxy wrappers before saving to IndexedDB
				const clonedCampaign = JSON.parse(JSON.stringify(campaign)) as Campaign;
				clonedCampaign.customEntityTypes = clonedCampaign.customEntityTypes.filter(
					(t) => t.type !== type
				);

				await campaignRepository.save(clonedCampaign);
				campaign = clonedCampaign;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete custom entity type';
				console.error('Failed to delete custom entity type:', e);
				throw e;
			}
		},

		getCustomEntityType(type: string): EntityTypeDefinition | undefined {
			return campaign?.customEntityTypes.find((t) => t.type === type);
		},

		// Entity type override CRUD methods (for customizing built-in types)
		get entityTypeOverrides(): EntityTypeOverride[] {
			return campaign?.entityTypeOverrides ?? [];
		},

		async setEntityTypeOverride(override: EntityTypeOverride): Promise<void> {
			if (!campaign) return;

			try {
				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedOverride = JSON.parse(JSON.stringify(override)) as EntityTypeOverride;
				const clonedCampaign = JSON.parse(JSON.stringify(campaign)) as Campaign;

				// Initialize array if not present (for existing campaigns)
				if (!clonedCampaign.entityTypeOverrides) {
					clonedCampaign.entityTypeOverrides = [];
				}

				// Find existing override or add new one
				const existingIndex = clonedCampaign.entityTypeOverrides.findIndex(
					(o) => o.type === override.type
				);
				if (existingIndex >= 0) {
					clonedCampaign.entityTypeOverrides[existingIndex] = clonedOverride;
				} else {
					clonedCampaign.entityTypeOverrides.push(clonedOverride);
				}

				await campaignRepository.save(clonedCampaign);
				campaign = clonedCampaign;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to save entity type override';
				console.error('Failed to save entity type override:', e);
				throw e;
			}
		},

		async removeEntityTypeOverride(type: string): Promise<void> {
			if (!campaign) return;

			try {
				const clonedCampaign = JSON.parse(JSON.stringify(campaign)) as Campaign;
				clonedCampaign.entityTypeOverrides = (clonedCampaign.entityTypeOverrides ?? []).filter(
					(o) => o.type !== type
				);

				await campaignRepository.save(clonedCampaign);
				campaign = clonedCampaign;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to remove entity type override';
				console.error('Failed to remove entity type override:', e);
				throw e;
			}
		},

		getEntityTypeOverride(type: string): EntityTypeOverride | undefined {
			return campaign?.entityTypeOverrides?.find((o) => o.type === type);
		}
	};
}

export const campaignStore = createCampaignStore();
