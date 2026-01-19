import { entityRepository, appConfigRepository } from '$lib/db/repositories';
import { db } from '$lib/db';
import type {
	BaseEntity,
	EntityTypeDefinition,
	EntityTypeOverride,
	CampaignMetadata,
	CampaignSettings,
	SystemProfile
} from '$lib/types';
import { DEFAULT_CAMPAIGN_METADATA, DEFAULT_CAMPAIGN_SETTINGS } from '$lib/types';
import { getSystemProfile } from '$lib/config/systems';
import { nanoid } from 'nanoid';

/**
 * Helper to get campaign metadata from a campaign entity
 */
function getCampaignMetadata(entity: BaseEntity | null): CampaignMetadata {
	if (!entity) return { ...DEFAULT_CAMPAIGN_METADATA };
	const metadata = entity.metadata as unknown as CampaignMetadata | undefined;
	return {
		systemId: metadata?.systemId,
		customEntityTypes: metadata?.customEntityTypes ?? [],
		entityTypeOverrides: metadata?.entityTypeOverrides ?? [],
		settings: metadata?.settings ?? { ...DEFAULT_CAMPAIGN_SETTINGS }
	};
}

/**
 * Campaign store using Svelte 5 runes
 * Now works with Campaign as a BaseEntity stored in the entities table
 */
function createCampaignStore() {
	let activeCampaignId = $state<string | null>(null);
	let campaign = $state<BaseEntity | null>(null);
	let allCampaigns = $state<BaseEntity[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	return {
		// State getters
		get activeCampaignId() {
			return activeCampaignId;
		},
		get campaign() {
			return campaign;
		},
		get allCampaigns() {
			return allCampaigns;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		// Derived getters that maintain API compatibility
		get customEntityTypes(): EntityTypeDefinition[] {
			return getCampaignMetadata(campaign).customEntityTypes;
		},

		get entityTypeOverrides(): EntityTypeOverride[] {
			return getCampaignMetadata(campaign).entityTypeOverrides;
		},

		get settings(): CampaignSettings {
			return getCampaignMetadata(campaign).settings;
		},

		/**
		 * Get the system ID for the current campaign
		 * Returns 'system-agnostic' as default for backwards compatibility
		 */
		get systemId(): string | null {
			if (!campaign) return null;
			const metadata = getCampaignMetadata(campaign);
			return metadata.systemId ?? 'system-agnostic';
		},

		/**
		 * Get the full system profile for the current campaign
		 * Returns null if no campaign is loaded
		 * Falls back to system-agnostic if the system is not found
		 */
		getCurrentSystemProfile(): SystemProfile | null {
			if (!campaign) return null;

			const metadata = getCampaignMetadata(campaign);
			const systemId = metadata.systemId ?? 'system-agnostic';

			// Try to get the system profile
			const profile = getSystemProfile(systemId);

			// If not found (e.g., unknown system), fall back to system-agnostic
			if (!profile) {
				return getSystemProfile('system-agnostic') ?? null;
			}

			return profile;
		},

		/**
		 * Set the system profile for the current campaign
		 * Updates the campaign metadata with the new system ID
		 */
		async setSystemProfile(systemId: string): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			try {
				const metadata = getCampaignMetadata(campaign);
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					systemId
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to set system profile';
				console.error('Failed to set system profile:', e);
				throw e;
			}
		},

		/**
		 * Load campaigns from database
		 * If no campaigns exist, creates a default one
		 */
		async load() {
			isLoading = true;
			error = null;

			try {
				// Load all campaigns from entities table
				const campaigns = await db.entities.where('type').equals('campaign').toArray();
				allCampaigns = campaigns;

				// Get active campaign ID from app config
				let activeId = await appConfigRepository.getActiveCampaignId();

				// If no active campaign set, use the first one (or create a default)
				if (!activeId && campaigns.length > 0) {
					activeId = campaigns[0].id;
					await appConfigRepository.setActiveCampaignId(activeId);
				}

				// If still no campaigns, create a default one
				if (campaigns.length === 0) {
					const defaultCampaign = await this.create('My Campaign', {
						description: 'A new adventure begins...',
						system: 'System Agnostic',
						setting: ''
					});
					activeId = defaultCampaign.id;
					allCampaigns = [defaultCampaign];
				}

				// Set active campaign
				activeCampaignId = activeId;
				campaign = allCampaigns.find((c) => c.id === activeId) ?? null;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load campaigns';
				console.error('Failed to load campaigns:', e);
			} finally {
				isLoading = false;
			}
		},

		/**
		 * Create a new campaign
		 */
		async create(
			name: string,
			options: { description?: string; system?: string; setting?: string } = {}
		): Promise<BaseEntity> {
			const now = new Date();
			const newCampaign: BaseEntity = {
				id: nanoid(),
				type: 'campaign',
				name,
				description: options.description ?? '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: options.system ?? 'System Agnostic',
					setting: options.setting ?? '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: now,
				updatedAt: now,
				metadata: { ...DEFAULT_CAMPAIGN_METADATA }
			};

			await db.entities.add(newCampaign);
			allCampaigns = [...allCampaigns, newCampaign];

			// Set as active if it's the first one
			if (allCampaigns.length === 1) {
				await this.setActiveCampaign(newCampaign.id);
			}

			return newCampaign;
		},

		/**
		 * Set the active campaign
		 */
		async setActiveCampaign(id: string) {
			const newActiveCampaign = allCampaigns.find((c) => c.id === id);
			if (!newActiveCampaign) {
				throw new Error(`Campaign ${id} not found`);
			}

			await appConfigRepository.setActiveCampaignId(id);
			activeCampaignId = id;
			campaign = newActiveCampaign;
		},

		/**
		 * Update the active campaign's basic fields
		 */
		async update(changes: {
			name?: string;
			description?: string;
			system?: string;
			setting?: string;
		}) {
			if (!campaign) return;

			try {
				const updates: Partial<BaseEntity> = {
					updatedAt: new Date()
				};

				if (changes.name !== undefined) updates.name = changes.name;
				if (changes.description !== undefined) updates.description = changes.description;

				// Handle fields
				if (changes.system !== undefined || changes.setting !== undefined) {
					updates.fields = {
						...campaign.fields,
						...(changes.system !== undefined && { system: changes.system }),
						...(changes.setting !== undefined && { setting: changes.setting })
					};
				}

				await db.entities.update(campaign.id, updates);

				// Update local state
				campaign = { ...campaign, ...updates };
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update campaign';
				console.error('Failed to update campaign:', e);
			}
		},

		/**
		 * Update campaign settings
		 */
		async updateSettings(settings: Partial<CampaignSettings>) {
			if (!campaign) return;

			try {
				const currentMetadata = getCampaignMetadata(campaign);
				const updatedMetadata: CampaignMetadata = {
					...currentMetadata,
					settings: { ...currentMetadata.settings, ...settings }
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update settings';
				console.error('Failed to update settings:', e);
			}
		},

		// Custom entity type CRUD methods

		async addCustomEntityType(entityType: EntityTypeDefinition): Promise<void> {
			if (!campaign) return;

			const metadata = getCampaignMetadata(campaign);
			const existing = metadata.customEntityTypes.find((t) => t.type === entityType.type);
			if (existing) {
				throw new Error(`Entity type "${entityType.type}" already exists`);
			}

			try {
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					customEntityTypes: [...metadata.customEntityTypes, entityType]
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
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

			const metadata = getCampaignMetadata(campaign);
			const index = metadata.customEntityTypes.findIndex((t) => t.type === type);
			if (index === -1) {
				throw new Error(`Entity type "${type}" not found`);
			}

			try {
				const updatedTypes = [...metadata.customEntityTypes];
				updatedTypes[index] = {
					...updatedTypes[index],
					...updates,
					type, // Ensure type cannot be changed
					isBuiltIn: false // Ensure isBuiltIn stays false
				};

				const updatedMetadata: CampaignMetadata = {
					...metadata,
					customEntityTypes: updatedTypes
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update custom entity type';
				console.error('Failed to update custom entity type:', e);
				throw e;
			}
		},

		async deleteCustomEntityType(type: string): Promise<void> {
			if (!campaign) return;

			const metadata = getCampaignMetadata(campaign);
			const index = metadata.customEntityTypes.findIndex((t) => t.type === type);
			if (index === -1) {
				throw new Error(`Entity type "${type}" not found`);
			}

			try {
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					customEntityTypes: metadata.customEntityTypes.filter((t) => t.type !== type)
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete custom entity type';
				console.error('Failed to delete custom entity type:', e);
				throw e;
			}
		},

		getCustomEntityType(type: string): EntityTypeDefinition | undefined {
			return getCampaignMetadata(campaign).customEntityTypes.find((t) => t.type === type);
		},

		// Entity type override CRUD methods

		async setEntityTypeOverride(override: EntityTypeOverride): Promise<void> {
			if (!campaign) return;

			try {
				const metadata = getCampaignMetadata(campaign);
				const existingIndex = metadata.entityTypeOverrides.findIndex(
					(o) => o.type === override.type
				);

				let updatedOverrides: EntityTypeOverride[];
				if (existingIndex >= 0) {
					updatedOverrides = [...metadata.entityTypeOverrides];
					updatedOverrides[existingIndex] = override;
				} else {
					updatedOverrides = [...metadata.entityTypeOverrides, override];
				}

				const updatedMetadata: CampaignMetadata = {
					...metadata,
					entityTypeOverrides: updatedOverrides
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to save entity type override';
				console.error('Failed to save entity type override:', e);
				throw e;
			}
		},

		async removeEntityTypeOverride(type: string): Promise<void> {
			if (!campaign) return;

			try {
				const metadata = getCampaignMetadata(campaign);
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					entityTypeOverrides: metadata.entityTypeOverrides.filter((o) => o.type !== type)
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = JSON.parse(JSON.stringify(updatedMetadata));

				await db.entities.update(campaign.id, {
					metadata: clonedMetadata,
					updatedAt: new Date()
				});

				// Update local state
				campaign = {
					...campaign,
					metadata: clonedMetadata,
					updatedAt: new Date()
				};
				allCampaigns = allCampaigns.map((c) => (c.id === campaign!.id ? campaign! : c));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to remove entity type override';
				console.error('Failed to remove entity type override:', e);
				throw e;
			}
		},

		getEntityTypeOverride(type: string): EntityTypeOverride | undefined {
			return getCampaignMetadata(campaign).entityTypeOverrides.find((o) => o.type === type);
		},

		/**
		 * Delete a campaign
		 */
		async deleteCampaign(id: string): Promise<void> {
			if (allCampaigns.length <= 1) {
				throw new Error('Cannot delete the last campaign');
			}

			try {
				await entityRepository.delete(id);
				allCampaigns = allCampaigns.filter((c) => c.id !== id);

				// If deleting active campaign, switch to another
				if (activeCampaignId === id) {
					const newActive = allCampaigns[0];
					if (newActive) {
						await this.setActiveCampaign(newActive.id);
					}
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete campaign';
				console.error('Failed to delete campaign:', e);
				throw e;
			}
		},

		/**
		 * Reload campaigns from database
		 * Useful after import or other external changes
		 */
		async reload() {
			await this.load();
		},

		/**
		 * Reset the store state (for testing purposes)
		 * @internal
		 */
		_resetForTesting() {
			activeCampaignId = null;
			campaign = null;
			allCampaigns = [];
			isLoading = false;
			error = null;
		}
	};
}

export const campaignStore = createCampaignStore();
