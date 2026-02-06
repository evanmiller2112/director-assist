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
 * Deep clone an object, preserving Date instances
 * This is used instead of JSON.parse/stringify to maintain Date objects
 */
function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== 'object') return obj;
	if (obj instanceof Date) return new Date(obj.getTime()) as T;
	if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T;

	const cloned: Record<string, unknown> = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
		}
	}
	return cloned as T;
}

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
		fieldTemplates: metadata?.fieldTemplates ?? [],
		settings: metadata?.settings ?? { ...DEFAULT_CAMPAIGN_SETTINGS },
		tableMap: metadata?.tableMap
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
	let isLoading = $state(true); // Start as true since campaigns haven't been loaded yet
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
		 * Returns 'draw-steel' as default for new campaigns (this is a Draw Steel-focused tool)
		 */
		get systemId(): string | null {
			if (!campaign) return null;
			const metadata = getCampaignMetadata(campaign);
			return metadata.systemId ?? 'draw-steel';
		},

		/**
		 * Get the full system profile for the current campaign
		 * Returns null if no campaign is loaded
		 * Falls back to draw-steel if the system is not found
		 */
		getCurrentSystemProfile(): SystemProfile | null {
			if (!campaign) return null;

			const metadata = getCampaignMetadata(campaign);
			const systemId = metadata.systemId ?? 'draw-steel';

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
				const clonedMetadata = deepClone(updatedMetadata);

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
		 * Get the enforceCampaignLinking setting (Issue #48)
		 * Returns false by default if not set
		 */
		get enforceCampaignLinking(): boolean | undefined {
			return getCampaignMetadata(campaign).settings.enforceCampaignLinking ?? false;
		},

		/**
		 * Get the defaultCampaignId setting (Issue #48)
		 * Returns undefined if not set
		 */
		get defaultCampaignId(): string | undefined {
			return getCampaignMetadata(campaign).settings.defaultCampaignId;
		},

		/**
		 * Set the enforceCampaignLinking setting (Issue #48)
		 * Optionally set a default campaign ID for multi-campaign scenarios
		 */
		async setEnforceCampaignLinking(enabled: boolean, defaultCampaignId?: string): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			try {
				const metadata = getCampaignMetadata(campaign);
				const updatedSettings: CampaignSettings = {
					...metadata.settings,
					enforceCampaignLinking: enabled
				};

				// Set defaultCampaignId if provided
				if (defaultCampaignId !== undefined) {
					updatedSettings.defaultCampaignId = defaultCampaignId;
				}

				const updatedMetadata: CampaignMetadata = {
					...metadata,
					settings: updatedSettings
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
				error = e instanceof Error ? e.message : 'Failed to set enforce campaign linking';
				console.error('Failed to set enforce campaign linking:', e);
				throw e;
			}
		},

		/**
		 * Set the defaultCampaignId setting (Issue #48)
		 */
		async setDefaultCampaignId(campaignId: string | undefined): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			try {
				const metadata = getCampaignMetadata(campaign);
				const updatedSettings: CampaignSettings = {
					...metadata.settings,
					defaultCampaignId: campaignId
				};

				const updatedMetadata: CampaignMetadata = {
					...metadata,
					settings: updatedSettings
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
				error = e instanceof Error ? e.message : 'Failed to set default campaign ID';
				console.error('Failed to set default campaign ID:', e);
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

				// Clear error on successful load
				error = null;
			} catch (e) {
				error = e instanceof Error ? `Failed to load campaigns: ${e.message}` : 'Failed to load campaigns';
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

			// Check if this is the first campaign by querying the database
			// (not just in-memory state, which may be stale)
			const campaignCount = await db.entities.where('type').equals('campaign').count();
			if (campaignCount === 1) {
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
				const clonedMetadata = deepClone(updatedMetadata);

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
				const clonedMetadata = deepClone(updatedMetadata);

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
				const clonedMetadata = deepClone(updatedMetadata);

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
				const clonedMetadata = deepClone(updatedMetadata);

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
				const clonedMetadata = deepClone(updatedMetadata);

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
				const clonedMetadata = deepClone(updatedMetadata);

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

		// Field Template CRUD methods (GitHub Issue #210)

		/**
		 * Get all field templates for the current campaign
		 */
		get fieldTemplates() {
			if (!campaign) return [];
			const metadata = getCampaignMetadata(campaign);
			// Return deep cloned array to prevent mutation
			return deepClone(metadata.fieldTemplates ?? []);
		},

		/**
		 * Get a field template by ID
		 */
		getFieldTemplate(id: string) {
			if (!campaign) return undefined;
			const metadata = getCampaignMetadata(campaign);
			const template = (metadata.fieldTemplates ?? []).find((t) => t.id === id);
			// Return deep clone to prevent mutation
			return template ? deepClone(template) : undefined;
		},

		/**
		 * Add a field template to the campaign
		 */
		async addFieldTemplate(template: import('$lib/types').FieldTemplate): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			const metadata = getCampaignMetadata(campaign);
			const existing = (metadata.fieldTemplates ?? []).find((t) => t.id === template.id);
			if (existing) {
				throw new Error(`Field template "${template.id}" already exists`);
			}

			try {
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					fieldTemplates: [...(metadata.fieldTemplates ?? []), template]
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = deepClone(updatedMetadata);

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
				error = e instanceof Error ? e.message : 'Failed to add field template';
				console.error('Failed to add field template:', e);
				throw e;
			}
		},

		/**
		 * Update an existing field template
		 */
		async updateFieldTemplate(
			id: string,
			updates: Partial<Omit<import('$lib/types').FieldTemplate, 'id'>>
		): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			const metadata = getCampaignMetadata(campaign);
			const index = (metadata.fieldTemplates ?? []).findIndex((t) => t.id === id);
			if (index === -1) {
				throw new Error(`Field template "${id}" not found`);
			}

			try {
				const updatedTemplates = [...(metadata.fieldTemplates ?? [])];
				updatedTemplates[index] = {
					...updatedTemplates[index],
					...updates,
					id, // Ensure id cannot be changed
					updatedAt: new Date() // Update timestamp
				};

				const updatedMetadata: CampaignMetadata = {
					...metadata,
					fieldTemplates: updatedTemplates
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = deepClone(updatedMetadata);

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
				error = e instanceof Error ? e.message : 'Failed to update field template';
				console.error('Failed to update field template:', e);
				throw e;
			}
		},

		/**
		 * Delete a field template
		 */
		async deleteFieldTemplate(id: string): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			const metadata = getCampaignMetadata(campaign);
			const index = (metadata.fieldTemplates ?? []).findIndex((t) => t.id === id);
			if (index === -1) {
				throw new Error(`Field template "${id}" not found`);
			}

			try {
				const updatedMetadata: CampaignMetadata = {
					...metadata,
					fieldTemplates: (metadata.fieldTemplates ?? []).filter((t) => t.id !== id)
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = deepClone(updatedMetadata);

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
				error = e instanceof Error ? e.message : 'Failed to delete field template';
				console.error('Failed to delete field template:', e);
				throw e;
			}
		},

		// Table Map methods (GitHub Issue #318)

		/**
		 * Get the table map for the current campaign
		 * Returns undefined if no table map exists
		 */
		get tableMap() {
			if (!campaign) return undefined;
			const metadata = getCampaignMetadata(campaign);
			// Return deep clone to prevent mutation
			return metadata.tableMap ? deepClone(metadata.tableMap) : undefined;
		},

		/**
		 * Update the table map for the current campaign
		 * Pass undefined to remove the table map
		 */
		async updateTableMap(tableMap?: import('$lib/types').TableMap): Promise<void> {
			if (!campaign) {
				throw new Error('No campaign loaded');
			}

			try {
				const currentMetadata = getCampaignMetadata(campaign);
				const updatedMetadata: CampaignMetadata = {
					...currentMetadata,
					tableMap
				};

				// Deep clone to remove Svelte 5 Proxy wrappers
				const clonedMetadata = deepClone(updatedMetadata);

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
				error = e instanceof Error ? e.message : 'Failed to update table map';
				console.error('Failed to update table map:', e);
				throw e;
			}
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

				// If deleting the default campaign for auto-linking, clear it (Issue #48)
				const currentMetadata = getCampaignMetadata(campaign);
				if (currentMetadata.settings.defaultCampaignId === id) {
					await this.setDefaultCampaignId(undefined);
				}

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
		 * Reset store to initial state (mainly for testing)
		 */
		reset() {
			activeCampaignId = null;
			campaign = null;
			allCampaigns = [];
			isLoading = true;
			error = null;
		},

		/**
		 * Reset the store state for testing purposes (alias for reset)
		 * @internal
		 */
		_resetForTesting() {
			this.reset();
		}
	};
}

export const campaignStore = createCampaignStore();
