/**
 * Tests for Campaign Store
 *
 * These tests verify the campaign store functionality which manages:
 * - Campaign initialization and loading
 * - Campaign CRUD operations (create, update, delete, setActive)
 * - Custom entity type management (add, update, delete)
 * - Entity type override management (set, remove)
 * - Default campaign creation
 * - Campaign metadata handling
 *
 * Test Coverage:
 * - Initial state (isLoading true, null activeCampaignId, empty allCampaigns)
 * - load() method (load from database, create default if none, set active, handle errors)
 * - create() method (create entity, add to array, set as active if first, include metadata)
 * - setActiveCampaign() method (update activeCampaignId, update reference, persist, throw if not found)
 * - update() method (update name, description, fields, updatedAt timestamp)
 * - Custom entity types (add, update, delete, duplicate validation)
 * - Entity type overrides (set, update, remove)
 * - Edge cases (empty values, concurrent operations, error handling)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { db } from '$lib/db';
import type { BaseEntity, EntityTypeDefinition, EntityTypeOverride } from '$lib/types';

describe('Campaign Store', () => {
	let campaignStore: any;
	let mockAppConfigRepository: any;

	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		vi.clearAllMocks();

		// Clear database tables
		await db.entities.clear();
		await db.appConfig.clear();

		// Create mock appConfigRepository
		mockAppConfigRepository = {
			getActiveCampaignId: vi.fn(async () => null),
			setActiveCampaignId: vi.fn(async (id: string) => {
				// Actually persist to database for testing
				await db.appConfig.put({ key: 'activeCampaignId', value: id });
			})
		};

		// Mock the repositories module
		vi.doMock('$lib/db/repositories', () => ({
			entityRepository: {
				delete: vi.fn(async (id: string) => {
					// Actually delete from database for testing
					await db.entities.delete(id);
				})
			},
			appConfigRepository: mockAppConfigRepository
		}));

		// Import fresh store instance
		vi.resetModules();
		const module = await import('./campaign.svelte');
		campaignStore = module.campaignStore;
	});

	afterEach(async () => {
		// Clean up database
		await db.entities.clear();
		await db.appConfig.clear();
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should initialize with isLoading true', () => {
			expect(campaignStore.isLoading).toBe(true);
		});

		it('should initialize with activeCampaignId null', () => {
			expect(campaignStore.activeCampaignId).toBeNull();
		});

		it('should initialize with empty allCampaigns array', () => {
			expect(campaignStore.allCampaigns).toBeDefined();
			expect(Array.isArray(campaignStore.allCampaigns)).toBe(true);
			expect(campaignStore.allCampaigns.length).toBe(0);
		});

		it('should initialize with null campaign', () => {
			expect(campaignStore.campaign).toBeNull();
		});

		it('should initialize with null error', () => {
			expect(campaignStore.error).toBeNull();
		});

		it('should have all state properties defined', () => {
			expect(campaignStore).toHaveProperty('activeCampaignId');
			expect(campaignStore).toHaveProperty('campaign');
			expect(campaignStore).toHaveProperty('allCampaigns');
			expect(campaignStore).toHaveProperty('isLoading');
			expect(campaignStore).toHaveProperty('error');
			expect(campaignStore).toHaveProperty('customEntityTypes');
			expect(campaignStore).toHaveProperty('entityTypeOverrides');
			expect(campaignStore).toHaveProperty('settings');
		});

		it('should have all methods defined', () => {
			expect(campaignStore).toHaveProperty('load');
			expect(campaignStore).toHaveProperty('create');
			expect(campaignStore).toHaveProperty('setActiveCampaign');
			expect(campaignStore).toHaveProperty('update');
			expect(campaignStore).toHaveProperty('updateSettings');
			expect(campaignStore).toHaveProperty('addCustomEntityType');
			expect(campaignStore).toHaveProperty('updateCustomEntityType');
			expect(campaignStore).toHaveProperty('deleteCustomEntityType');
			expect(campaignStore).toHaveProperty('getCustomEntityType');
			expect(campaignStore).toHaveProperty('setEntityTypeOverride');
			expect(campaignStore).toHaveProperty('removeEntityTypeOverride');
			expect(campaignStore).toHaveProperty('getEntityTypeOverride');
			expect(campaignStore).toHaveProperty('deleteCampaign');
			expect(campaignStore).toHaveProperty('reload');
		});
	});

	describe('load() Method', () => {
		describe('Empty Database', () => {
			it('should create default campaign when none exists', async () => {
				await campaignStore.load();

				expect(campaignStore.allCampaigns.length).toBe(1);
				expect(campaignStore.allCampaigns[0].name).toBe('My Campaign');
				expect(campaignStore.allCampaigns[0].type).toBe('campaign');
			});

			it('should set default campaign as active when none exists', async () => {
				await campaignStore.load();

				expect(campaignStore.activeCampaignId).toBeDefined();
				expect(campaignStore.activeCampaignId).not.toBeNull();
				expect(campaignStore.campaign).toBeDefined();
				expect(campaignStore.campaign?.name).toBe('My Campaign');
			});

			it('should persist active campaign ID when creating default', async () => {
				await campaignStore.load();

				expect(mockAppConfigRepository.setActiveCampaignId).toHaveBeenCalledWith(
					expect.any(String)
				);
			});

			it('should include default metadata in created campaign', async () => {
				await campaignStore.load();

				const campaign = campaignStore.campaign;
				expect(campaign.metadata).toBeDefined();
				expect(campaign.metadata.customEntityTypes).toEqual([]);
				expect(campaign.metadata.entityTypeOverrides).toEqual([]);
				expect(campaign.metadata.settings).toBeDefined();
			});

			it('should include default fields in created campaign', async () => {
				await campaignStore.load();

				const campaign = campaignStore.campaign;
				expect(campaign.fields).toBeDefined();
				expect(campaign.fields.system).toBe('System Agnostic');
				expect(campaign.fields.status).toBe('active');
			});
		});

		describe('Existing Campaigns', () => {
			it('should load existing campaigns from database', async () => {
				// Create a campaign directly in database
				const testCampaign: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: 'Test description',
					tags: [],
					fields: { system: 'D&D 5e', setting: 'Forgotten Realms', status: 'active' },
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {
						customEntityTypes: [],
						entityTypeOverrides: [],
						settings: {}
					}
				};
				await db.entities.add(testCampaign);

				await campaignStore.load();

				expect(campaignStore.allCampaigns.length).toBe(1);
				expect(campaignStore.allCampaigns[0].id).toBe('campaign-1');
				expect(campaignStore.allCampaigns[0].name).toBe('Test Campaign');
			});

			it('should load multiple campaigns', async () => {
				// Create multiple campaigns
				const campaign1: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Campaign 1',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				const campaign2: BaseEntity = {
					id: 'campaign-2',
					type: 'campaign',
					name: 'Campaign 2',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				await db.entities.bulkAdd([campaign1, campaign2]);

				await campaignStore.load();

				expect(campaignStore.allCampaigns.length).toBe(2);
			});

			it('should set active campaign from app config', async () => {
				// Create campaigns
				const campaign1: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'Campaign 1',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				const campaign2: BaseEntity = {
					id: 'campaign-2',
					type: 'campaign',
					name: 'Campaign 2',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				await db.entities.bulkAdd([campaign1, campaign2]);

				// Mock app config to return campaign-2 as active
				mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-2');

				await campaignStore.load();

				expect(campaignStore.activeCampaignId).toBe('campaign-2');
				expect(campaignStore.campaign?.name).toBe('Campaign 2');
			});

			it('should set first campaign as active if no active campaign set', async () => {
				const campaign1: BaseEntity = {
					id: 'campaign-1',
					type: 'campaign',
					name: 'First Campaign',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				await db.entities.add(campaign1);

				mockAppConfigRepository.getActiveCampaignId.mockResolvedValue(null);

				await campaignStore.load();

				expect(campaignStore.activeCampaignId).toBe('campaign-1');
				expect(mockAppConfigRepository.setActiveCampaignId).toHaveBeenCalledWith('campaign-1');
			});
		});

		describe('Loading State', () => {
			it('should set isLoading to false after load completes successfully', async () => {
				await campaignStore.load();

				expect(campaignStore.isLoading).toBe(false);
			});

			it('should set isLoading to false after load fails', async () => {
				// Mock database error
				const originalWhere = db.entities.where;
				db.entities.where = vi.fn(() => {
					throw new Error('Database error');
				}) as any;

				await campaignStore.load();

				expect(campaignStore.isLoading).toBe(false);

				// Restore
				db.entities.where = originalWhere;
			});
		});

		describe('Error Handling', () => {
			it('should set error when load fails', async () => {
				// Create a fresh store instance to test error handling
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');

				// Mock database error after the import but before load
				const originalWhere = db.entities.where;
				db.entities.where = vi.fn(() => {
					throw new Error('Database connection failed');
				}) as any;

				await freshStore.load();

				expect(freshStore.error).toBe('Database connection failed');

				// Restore
				db.entities.where = originalWhere;
			});

			it('should set generic error for non-Error exceptions', async () => {
				// Create a fresh store instance
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');

				const originalWhere = db.entities.where;
				db.entities.where = vi.fn(() => {
					throw 'String error';
				}) as any;

				await freshStore.load();

				expect(freshStore.error).toBe('Failed to load campaigns');

				// Restore
				db.entities.where = originalWhere;
			});

			it('should clear previous error on successful load', async () => {
				// Create a fresh store instance
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');

				// First load with error
				const originalWhere = db.entities.where;
				db.entities.where = vi.fn(() => {
					throw new Error('First error');
				}) as any;
				await freshStore.load();
				expect(freshStore.error).toBe('First error');

				// Restore and load successfully
				db.entities.where = originalWhere;
				await freshStore.load();

				expect(freshStore.error).toBeNull();
			});
		});

		describe('Multiple Loads', () => {
			it('should handle multiple load calls', async () => {
				await campaignStore.load();
				await campaignStore.load();
				await campaignStore.load();

				expect(campaignStore.allCampaigns.length).toBeGreaterThan(0);
				expect(campaignStore.isLoading).toBe(false);
			});

			it('should reload campaigns from database', async () => {
				await campaignStore.load();
				const initialCount = campaignStore.allCampaigns.length;

				// Add campaign directly to database
				const newCampaign: BaseEntity = {
					id: 'campaign-new',
					type: 'campaign',
					name: 'New Campaign',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				await db.entities.add(newCampaign);

				await campaignStore.load();

				expect(campaignStore.allCampaigns.length).toBe(initialCount + 1);
			});
		});
	});

	describe('create() Method', () => {
		beforeEach(async () => {
			// Don't load, just clear database to start fresh
			await db.entities.clear();
		});

		it('should create new campaign entity', async () => {
			const campaign = await campaignStore.create('New Campaign');

			expect(campaign).toBeDefined();
			expect(campaign.id).toBeDefined();
			expect(campaign.name).toBe('New Campaign');
			expect(campaign.type).toBe('campaign');
		});

		it('should add campaign to allCampaigns array', async () => {
			const initialCount = campaignStore.allCampaigns.length;

			await campaignStore.create('Test Campaign');

			expect(campaignStore.allCampaigns.length).toBe(initialCount + 1);
		});

		it('should store campaign in database', async () => {
			const campaign = await campaignStore.create('Database Test');

			const stored = await db.entities.get(campaign.id);
			expect(stored).toBeDefined();
			expect(stored?.name).toBe('Database Test');
		});

		it('should set as active campaign if first campaign', async () => {
			const campaign = await campaignStore.create('First Campaign');

			expect(campaignStore.activeCampaignId).toBe(campaign.id);
			expect(campaignStore.campaign?.id).toBe(campaign.id);
		});

		it('should not set as active if not first campaign', async () => {
			const first = await campaignStore.create('First');
			const second = await campaignStore.create('Second');

			expect(campaignStore.activeCampaignId).toBe(first.id);
			expect(campaignStore.campaign?.id).toBe(first.id);
		});

		it('should include metadata with defaults', async () => {
			const campaign = await campaignStore.create('Test');

			expect(campaign.metadata).toBeDefined();
			expect(campaign.metadata.customEntityTypes).toEqual([]);
			expect(campaign.metadata.entityTypeOverrides).toEqual([]);
			expect(campaign.metadata.settings).toBeDefined();
		});

		it('should include default system in fields', async () => {
			const campaign = await campaignStore.create('Test');

			expect(campaign.fields.system).toBe('System Agnostic');
		});

		it('should set createdAt and updatedAt timestamps', async () => {
			const before = new Date();
			const campaign = await campaignStore.create('Test');
			const after = new Date();

			expect(campaign.createdAt).toBeDefined();
			expect(campaign.updatedAt).toBeDefined();
			expect(campaign.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(campaign.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		describe('Optional Parameters', () => {
			it('should accept description option', async () => {
				const campaign = await campaignStore.create('Test', {
					description: 'Epic fantasy adventure'
				});

				expect(campaign.description).toBe('Epic fantasy adventure');
			});

			it('should accept system option', async () => {
				const campaign = await campaignStore.create('Test', {
					system: 'D&D 5e'
				});

				expect(campaign.fields.system).toBe('D&D 5e');
			});

			it('should accept setting option', async () => {
				const campaign = await campaignStore.create('Test', {
					setting: 'Forgotten Realms'
				});

				expect(campaign.fields.setting).toBe('Forgotten Realms');
			});

			it('should accept all options together', async () => {
				const campaign = await campaignStore.create('Complete Campaign', {
					description: 'A complete test',
					system: 'Pathfinder',
					setting: 'Golarion'
				});

				expect(campaign.description).toBe('A complete test');
				expect(campaign.fields.system).toBe('Pathfinder');
				expect(campaign.fields.setting).toBe('Golarion');
			});

			it('should use default values when options not provided', async () => {
				const campaign = await campaignStore.create('Minimal');

				expect(campaign.description).toBe('');
				expect(campaign.fields.system).toBe('System Agnostic');
				expect(campaign.fields.setting).toBe('');
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty campaign name', async () => {
				const campaign = await campaignStore.create('');

				expect(campaign.name).toBe('');
			});

			it('should handle very long campaign name', async () => {
				const longName = 'Campaign '.repeat(100);
				const campaign = await campaignStore.create(longName);

				expect(campaign.name).toBe(longName);
			});

			it('should handle unicode characters in name', async () => {
				const campaign = await campaignStore.create('测试 Campaign ñ é');

				expect(campaign.name).toBe('测试 Campaign ñ é');
			});

			it('should handle special characters in name', async () => {
				const campaign = await campaignStore.create('Campaign: <Test> & "Special"');

				expect(campaign.name).toBe('Campaign: <Test> & "Special"');
			});

			it('should create unique IDs for each campaign', async () => {
				const campaign1 = await campaignStore.create('Campaign 1');
				const campaign2 = await campaignStore.create('Campaign 2');

				expect(campaign1.id).not.toBe(campaign2.id);
			});
		});
	});

	describe('setActiveCampaign() Method', () => {
		let campaign1: BaseEntity;
		let campaign2: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();

			campaign1 = await campaignStore.create('Campaign 1');
			campaign2 = await campaignStore.create('Campaign 2');
		});

		it('should update activeCampaignId', async () => {
			await campaignStore.setActiveCampaign(campaign2.id);

			expect(campaignStore.activeCampaignId).toBe(campaign2.id);
		});

		it('should update campaign reference', async () => {
			await campaignStore.setActiveCampaign(campaign2.id);

			expect(campaignStore.campaign?.id).toBe(campaign2.id);
			expect(campaignStore.campaign?.name).toBe('Campaign 2');
		});

		it('should persist to app config', async () => {
			await campaignStore.setActiveCampaign(campaign2.id);

			expect(mockAppConfigRepository.setActiveCampaignId).toHaveBeenCalledWith(campaign2.id);
		});

		it('should throw error if campaign not found', async () => {
			await expect(campaignStore.setActiveCampaign('non-existent-id')).rejects.toThrow(
				'Campaign non-existent-id not found'
			);
		});

		it('should handle switching between campaigns', async () => {
			await campaignStore.setActiveCampaign(campaign1.id);
			expect(campaignStore.activeCampaignId).toBe(campaign1.id);

			await campaignStore.setActiveCampaign(campaign2.id);
			expect(campaignStore.activeCampaignId).toBe(campaign2.id);

			await campaignStore.setActiveCampaign(campaign1.id);
			expect(campaignStore.activeCampaignId).toBe(campaign1.id);
		});

		it('should handle setting same campaign as active', async () => {
			await campaignStore.setActiveCampaign(campaign1.id);
			await campaignStore.setActiveCampaign(campaign1.id);

			expect(campaignStore.activeCampaignId).toBe(campaign1.id);
		});
	});

	describe('update() Method', () => {
		let campaign: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();
			campaign = await campaignStore.create('Test Campaign', {
				description: 'Original description',
				system: 'Original System',
				setting: 'Original Setting'
			});
		});

		it('should update campaign name', async () => {
			await campaignStore.update({ name: 'Updated Name' });

			expect(campaignStore.campaign?.name).toBe('Updated Name');
		});

		it('should update campaign description', async () => {
			await campaignStore.update({ description: 'Updated description' });

			expect(campaignStore.campaign?.description).toBe('Updated description');
		});

		it('should update campaign system', async () => {
			await campaignStore.update({ system: 'D&D 5e' });

			expect(campaignStore.campaign?.fields.system).toBe('D&D 5e');
		});

		it('should update campaign setting', async () => {
			await campaignStore.update({ setting: 'Forgotten Realms' });

			expect(campaignStore.campaign?.fields.setting).toBe('Forgotten Realms');
		});

		it('should update updatedAt timestamp', async () => {
			const originalUpdatedAt = campaignStore.campaign?.updatedAt;

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			await campaignStore.update({ name: 'New Name' });

			expect(campaignStore.campaign?.updatedAt).toBeDefined();
			expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt?.getTime() || 0
			);
		});

		it('should persist updates to database', async () => {
			await campaignStore.update({ name: 'Persisted Name' });

			const stored = await db.entities.get(campaign.id);
			expect(stored?.name).toBe('Persisted Name');
		});

		it('should update local allCampaigns array', async () => {
			await campaignStore.update({ name: 'Array Updated' });

			const updated = campaignStore.allCampaigns.find((c: BaseEntity) => c.id === campaign.id);
			expect(updated?.name).toBe('Array Updated');
		});

		it('should handle multiple field updates', async () => {
			await campaignStore.update({
				name: 'Multi Update',
				description: 'Multi description',
				system: 'Multi System',
				setting: 'Multi Setting'
			});

			expect(campaignStore.campaign?.name).toBe('Multi Update');
			expect(campaignStore.campaign?.description).toBe('Multi description');
			expect(campaignStore.campaign?.fields.system).toBe('Multi System');
			expect(campaignStore.campaign?.fields.setting).toBe('Multi Setting');
		});

		it('should handle partial updates', async () => {
			await campaignStore.update({ name: 'Only Name' });

			expect(campaignStore.campaign?.name).toBe('Only Name');
			expect(campaignStore.campaign?.description).toBe('Original description');
			expect(campaignStore.campaign?.fields.system).toBe('Original System');
		});

		it('should do nothing when no active campaign', async () => {
			// Create a fresh store with no campaign
			vi.resetModules();
			const { campaignStore: freshStore } = await import('./campaign.svelte');
			// Don't call load, so no campaign exists
			expect(freshStore.campaign).toBeNull();

			// Should not throw, but also should not do anything
			await expect(freshStore.update({ name: 'Test' })).resolves.not.toThrow();
		});

		describe('Error Handling', () => {
			it('should set error on update failure', async () => {
				// Create a fresh store instance
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				await freshStore.load();
				await db.entities.clear();
				await freshStore.create('Test');

				// Mock database error
				const originalUpdate = db.entities.update;
				db.entities.update = vi.fn(() => {
					throw new Error('Update failed');
				}) as any;

				await freshStore.update({ name: 'Fail' });

				expect(freshStore.error).toBe('Update failed');

				// Restore
				db.entities.update = originalUpdate;
			});

			it('should set generic error for non-Error exceptions', async () => {
				// Create a fresh store instance
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				await freshStore.load();
				await db.entities.clear();
				await freshStore.create('Test');

				const originalUpdate = db.entities.update;
				db.entities.update = vi.fn(() => {
					throw 'String error';
				}) as any;

				await freshStore.update({ name: 'Fail' });

				expect(freshStore.error).toBe('Failed to update campaign');

				// Restore
				db.entities.update = originalUpdate;
			});
		});
	});

	describe('Custom Entity Types', () => {
		let campaign: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();
			campaign = await campaignStore.create('Test Campaign');
		});

		describe('addCustomEntityType()', () => {
			it('should add custom entity type', async () => {
				const entityType: EntityTypeDefinition = {
					type: 'custom_npc',
					label: 'Custom NPC',
					pluralLabel: 'Custom NPCs',
					icon: 'user',
					color: '#ff0000',
					isBuiltIn: false,
					fields: []
				};

				await campaignStore.addCustomEntityType(entityType);

				expect(campaignStore.customEntityTypes).toContainEqual(entityType);
			});

			it('should persist custom entity type to database', async () => {
				const entityType: EntityTypeDefinition = {
					type: 'vehicle',
					label: 'Vehicle',
					pluralLabel: 'Vehicles',
					icon: 'truck',
					color: '#00ff00',
					isBuiltIn: false,
					fields: []
				};

				await campaignStore.addCustomEntityType(entityType);

				// Reload the store from database to verify persistence
				await campaignStore.reload();

				// After reload, the custom entity type should still be present
				expect(campaignStore.customEntityTypes).toContainEqual(entityType);
			});

			it('should throw error on duplicate type', async () => {
				const entityType: EntityTypeDefinition = {
					type: 'duplicate',
					label: 'Duplicate',
					pluralLabel: 'Duplicates',
					icon: 'copy',
					color: '#0000ff',
					isBuiltIn: false,
					fields: []
				};

				await campaignStore.addCustomEntityType(entityType);

				await expect(campaignStore.addCustomEntityType(entityType)).rejects.toThrow(
					'Entity type "duplicate" already exists'
				);
			});

			it('should update updatedAt timestamp', async () => {
				const originalUpdatedAt = campaignStore.campaign?.updatedAt;

				await new Promise((resolve) => setTimeout(resolve, 10));

				const entityType: EntityTypeDefinition = {
					type: 'test_type',
					label: 'Test',
					pluralLabel: 'Tests',
					icon: 'test',
					color: '#ffffff',
					isBuiltIn: false,
					fields: []
				};

				await campaignStore.addCustomEntityType(entityType);

				expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt?.getTime() || 0
				);
			});

			it('should handle entity type with fields', async () => {
				const entityType: EntityTypeDefinition = {
					type: 'complex',
					label: 'Complex',
					pluralLabel: 'Complexes',
					icon: 'box',
					color: '#aaaaaa',
					isBuiltIn: false,
					fields: [
						{ key: 'field1', label: 'Field 1', type: 'text', required: true },
						{ key: 'field2', label: 'Field 2', type: 'number', required: false }
					]
				};

				await campaignStore.addCustomEntityType(entityType);

				expect(campaignStore.customEntityTypes).toContainEqual(entityType);
			});

			it('should do nothing when no active campaign', async () => {
				// Create a fresh store with no campaign
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				expect(freshStore.campaign).toBeNull();

				const entityType: EntityTypeDefinition = {
					type: 'test',
					label: 'Test',
					pluralLabel: 'Tests',
					icon: 'test',
					color: '#000000',
					isBuiltIn: false,
					fields: []
				};

				await expect(freshStore.addCustomEntityType(entityType)).resolves.not.toThrow();
			});
		});

		describe('updateCustomEntityType()', () => {
			const originalType: EntityTypeDefinition = {
				type: 'original',
				label: 'Original',
				pluralLabel: 'Originals',
				icon: 'circle',
				color: '#111111',
				isBuiltIn: false,
				fields: []
			};

			beforeEach(async () => {
				await campaignStore.addCustomEntityType(originalType);
			});

			it('should update entity type label', async () => {
				await campaignStore.updateCustomEntityType('original', {
					label: 'Updated Label'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.label).toBe('Updated Label');
			});

			it('should update entity type pluralLabel', async () => {
				await campaignStore.updateCustomEntityType('original', {
					pluralLabel: 'Updated Plurals'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.pluralLabel).toBe('Updated Plurals');
			});

			it('should update entity type icon', async () => {
				await campaignStore.updateCustomEntityType('original', {
					icon: 'square'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.icon).toBe('square');
			});

			it('should update entity type color', async () => {
				await campaignStore.updateCustomEntityType('original', {
					color: '#ff00ff'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.color).toBe('#ff00ff');
			});

			it('should update entity type fields', async () => {
				const newFields = [
					{ key: 'newField', label: 'New Field', type: 'text', required: true }
				];

				await campaignStore.updateCustomEntityType('original', {
					fields: newFields
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.fields).toEqual(newFields);
			});

			it('should not allow changing type', async () => {
				await campaignStore.updateCustomEntityType('original', {
					label: 'Updated'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.type).toBe('original');
			});

			it('should ensure isBuiltIn stays false', async () => {
				await campaignStore.updateCustomEntityType('original', {
					label: 'Updated'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.isBuiltIn).toBe(false);
			});

			it('should throw error if type not found', async () => {
				await expect(
					campaignStore.updateCustomEntityType('non-existent', { label: 'Test' })
				).rejects.toThrow('Entity type "non-existent" not found');
			});

			it('should persist updates to database', async () => {
				await campaignStore.updateCustomEntityType('original', {
					label: 'Persisted Update'
				});

				// Reload the store to verify persistence
				await campaignStore.reload();

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.label).toBe('Persisted Update');
			});

			it('should update multiple fields at once', async () => {
				await campaignStore.updateCustomEntityType('original', {
					label: 'Multi',
					pluralLabel: 'Multis',
					icon: 'multi-icon',
					color: '#123456'
				});

				const updated = campaignStore.customEntityTypes.find(
					(t: EntityTypeDefinition) => t.type === 'original'
				);
				expect(updated?.label).toBe('Multi');
				expect(updated?.pluralLabel).toBe('Multis');
				expect(updated?.icon).toBe('multi-icon');
				expect(updated?.color).toBe('#123456');
			});
		});

		describe('deleteCustomEntityType()', () => {
			const testType: EntityTypeDefinition = {
				type: 'deletable',
				label: 'Deletable',
				pluralLabel: 'Deletables',
				icon: 'trash',
				color: '#999999',
				isBuiltIn: false,
				fields: []
			};

			beforeEach(async () => {
				await campaignStore.addCustomEntityType(testType);
			});

			it('should delete custom entity type', async () => {
				await campaignStore.deleteCustomEntityType('deletable');

				expect(
					campaignStore.customEntityTypes.find((t: EntityTypeDefinition) => t.type === 'deletable')
				).toBeUndefined();
			});

			it('should persist deletion to database', async () => {
				await campaignStore.deleteCustomEntityType('deletable');

				// Reload the store to verify persistence
				await campaignStore.reload();

				expect(
					campaignStore.customEntityTypes.find((t: EntityTypeDefinition) => t.type === 'deletable')
				).toBeUndefined();
			});

			it('should throw error if type not found', async () => {
				await expect(campaignStore.deleteCustomEntityType('non-existent')).rejects.toThrow(
					'Entity type "non-existent" not found'
				);
			});

			it('should not affect other custom entity types', async () => {
				const other: EntityTypeDefinition = {
					type: 'other',
					label: 'Other',
					pluralLabel: 'Others',
					icon: 'other',
					color: '#888888',
					isBuiltIn: false,
					fields: []
				};
				await campaignStore.addCustomEntityType(other);

				await campaignStore.deleteCustomEntityType('deletable');

				expect(
					campaignStore.customEntityTypes.find((t: EntityTypeDefinition) => t.type === 'other')
				).toBeDefined();
			});

			it('should update updatedAt timestamp', async () => {
				const originalUpdatedAt = campaignStore.campaign?.updatedAt;

				await new Promise((resolve) => setTimeout(resolve, 10));

				await campaignStore.deleteCustomEntityType('deletable');

				expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt?.getTime() || 0
				);
			});
		});

		describe('getCustomEntityType()', () => {
			it('should return custom entity type if found', async () => {
				const testType: EntityTypeDefinition = {
					type: 'findable',
					label: 'Findable',
					pluralLabel: 'Findables',
					icon: 'search',
					color: '#777777',
					isBuiltIn: false,
					fields: []
				};
				await campaignStore.addCustomEntityType(testType);

				const found = campaignStore.getCustomEntityType('findable');

				expect(found).toEqual(testType);
			});

			it('should return undefined if not found', () => {
				const found = campaignStore.getCustomEntityType('non-existent');

				expect(found).toBeUndefined();
			});

			it('should work with no active campaign', async () => {
				// Create a fresh store with no campaign
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				expect(freshStore.campaign).toBeNull();

				const found = freshStore.getCustomEntityType('any');

				expect(found).toBeUndefined();
			});
		});
	});

	describe('Entity Type Overrides', () => {
		let campaign: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();
			campaign = await campaignStore.create('Test Campaign');
		});

		describe('setEntityTypeOverride()', () => {
			it('should set entity type override', async () => {
				const override: EntityTypeOverride = {
					type: 'character',
					label: 'Hero',
					pluralLabel: 'Heroes'
				};

				await campaignStore.setEntityTypeOverride(override);

				expect(campaignStore.entityTypeOverrides).toContainEqual(override);
			});

			it('should update existing override', async () => {
				const override1: EntityTypeOverride = {
					type: 'character',
					label: 'Hero',
					pluralLabel: 'Heroes'
				};
				const override2: EntityTypeOverride = {
					type: 'character',
					label: 'Champion',
					pluralLabel: 'Champions'
				};

				await campaignStore.setEntityTypeOverride(override1);
				await campaignStore.setEntityTypeOverride(override2);

				expect(campaignStore.entityTypeOverrides).toHaveLength(1);
				expect(campaignStore.entityTypeOverrides[0].label).toBe('Champion');
			});

			it('should persist override to database', async () => {
				const override: EntityTypeOverride = {
					type: 'location',
					label: 'Place',
					pluralLabel: 'Places'
				};

				await campaignStore.setEntityTypeOverride(override);

				// Reload the store to verify persistence
				await campaignStore.reload();

				expect(campaignStore.entityTypeOverrides).toContainEqual(override);
			});

			it('should handle override with icon', async () => {
				const override: EntityTypeOverride = {
					type: 'faction',
					label: 'Guild',
					pluralLabel: 'Guilds',
					icon: 'users'
				};

				await campaignStore.setEntityTypeOverride(override);

				expect(campaignStore.entityTypeOverrides).toContainEqual(override);
			});

			it('should handle override with color', async () => {
				const override: EntityTypeOverride = {
					type: 'item',
					label: 'Artifact',
					pluralLabel: 'Artifacts',
					color: '#ffd700'
				};

				await campaignStore.setEntityTypeOverride(override);

				expect(campaignStore.entityTypeOverrides).toContainEqual(override);
			});

			it('should update updatedAt timestamp', async () => {
				const originalUpdatedAt = campaignStore.campaign?.updatedAt;

				await new Promise((resolve) => setTimeout(resolve, 10));

				const override: EntityTypeOverride = {
					type: 'test',
					label: 'Test',
					pluralLabel: 'Tests'
				};

				await campaignStore.setEntityTypeOverride(override);

				expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt?.getTime() || 0
				);
			});

			it('should do nothing when no active campaign', async () => {
				// Create a fresh store with no campaign
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				expect(freshStore.campaign).toBeNull();

				const override: EntityTypeOverride = {
					type: 'test',
					label: 'Test',
					pluralLabel: 'Tests'
				};

				await expect(freshStore.setEntityTypeOverride(override)).resolves.not.toThrow();
			});
		});

		describe('removeEntityTypeOverride()', () => {
			const testOverride: EntityTypeOverride = {
				type: 'character',
				label: 'Hero',
				pluralLabel: 'Heroes'
			};

			beforeEach(async () => {
				await campaignStore.setEntityTypeOverride(testOverride);
			});

			it('should remove entity type override', async () => {
				await campaignStore.removeEntityTypeOverride('character');

				expect(
					campaignStore.entityTypeOverrides.find(
						(o: EntityTypeOverride) => o.type === 'character'
					)
				).toBeUndefined();
			});

			it('should persist removal to database', async () => {
				await campaignStore.removeEntityTypeOverride('character');

				// Reload the store to verify persistence
				await campaignStore.reload();

				expect(
					campaignStore.entityTypeOverrides.find((o: EntityTypeOverride) => o.type === 'character')
				).toBeUndefined();
			});

			it('should not throw error if override does not exist', async () => {
				await expect(
					campaignStore.removeEntityTypeOverride('non-existent')
				).resolves.not.toThrow();
			});

			it('should not affect other overrides', async () => {
				const other: EntityTypeOverride = {
					type: 'location',
					label: 'Place',
					pluralLabel: 'Places'
				};
				await campaignStore.setEntityTypeOverride(other);

				await campaignStore.removeEntityTypeOverride('character');

				expect(
					campaignStore.entityTypeOverrides.find((o: EntityTypeOverride) => o.type === 'location')
				).toBeDefined();
			});

			it('should update updatedAt timestamp', async () => {
				const originalUpdatedAt = campaignStore.campaign?.updatedAt;

				await new Promise((resolve) => setTimeout(resolve, 10));

				await campaignStore.removeEntityTypeOverride('character');

				expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt?.getTime() || 0
				);
			});
		});

		describe('getEntityTypeOverride()', () => {
			it('should return override if found', async () => {
				const override: EntityTypeOverride = {
					type: 'findable',
					label: 'Found',
					pluralLabel: 'Founds'
				};
				await campaignStore.setEntityTypeOverride(override);

				const found = campaignStore.getEntityTypeOverride('findable');

				expect(found).toEqual(override);
			});

			it('should return undefined if not found', () => {
				const found = campaignStore.getEntityTypeOverride('non-existent');

				expect(found).toBeUndefined();
			});

			it('should work with no active campaign', async () => {
				// Create a fresh store with no campaign
				vi.resetModules();
				const { campaignStore: freshStore } = await import('./campaign.svelte');
				expect(freshStore.campaign).toBeNull();

				const found = freshStore.getEntityTypeOverride('any');

				expect(found).toBeUndefined();
			});
		});
	});

	describe('deleteCampaign() Method', () => {
		let campaign1: BaseEntity;
		let campaign2: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();
			campaign1 = await campaignStore.create('Campaign 1');
			campaign2 = await campaignStore.create('Campaign 2');
		});

		it('should delete campaign', async () => {
			await campaignStore.deleteCampaign(campaign2.id);

			expect(
				campaignStore.allCampaigns.find((c: BaseEntity) => c.id === campaign2.id)
			).toBeUndefined();
		});

		it('should throw error when deleting last campaign', async () => {
			await campaignStore.deleteCampaign(campaign2.id);

			await expect(campaignStore.deleteCampaign(campaign1.id)).rejects.toThrow(
				'Cannot delete the last campaign'
			);
		});

		it('should switch to another campaign if deleting active', async () => {
			await campaignStore.setActiveCampaign(campaign1.id);

			await campaignStore.deleteCampaign(campaign1.id);

			expect(campaignStore.activeCampaignId).toBe(campaign2.id);
			expect(campaignStore.campaign?.id).toBe(campaign2.id);
		});

		it('should not switch active if deleting non-active', async () => {
			await campaignStore.setActiveCampaign(campaign1.id);

			await campaignStore.deleteCampaign(campaign2.id);

			expect(campaignStore.activeCampaignId).toBe(campaign1.id);
		});
	});

	describe('reload() Method', () => {
		it('should reload campaigns from database', async () => {
			await campaignStore.load();
			const initialCount = campaignStore.allCampaigns.length;

			// Add campaign directly to database
			const newCampaign: BaseEntity = {
				id: 'external-campaign',
				type: 'campaign',
				name: 'External Campaign',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(newCampaign);

			await campaignStore.reload();

			expect(campaignStore.allCampaigns.length).toBe(initialCount + 1);
		});

		it('should be equivalent to calling load', async () => {
			await campaignStore.load();
			const loadedState = { ...campaignStore };

			await campaignStore.reload();
			const reloadedState = { ...campaignStore };

			expect(reloadedState.allCampaigns.length).toBe(loadedState.allCampaigns.length);
		});
	});

	describe('Derived State', () => {
		let campaign: BaseEntity;

		beforeEach(async () => {
			await campaignStore.load();
			await db.entities.clear();
			campaign = await campaignStore.create('Test Campaign');
		});

		it('should expose customEntityTypes from campaign metadata', async () => {
			const testType: EntityTypeDefinition = {
				type: 'custom',
				label: 'Custom',
				pluralLabel: 'Customs',
				icon: 'test',
				color: '#000000',
				isBuiltIn: false,
				fields: []
			};

			await campaignStore.addCustomEntityType(testType);

			expect(campaignStore.customEntityTypes).toContainEqual(testType);
		});

		it('should expose entityTypeOverrides from campaign metadata', async () => {
			const testOverride: EntityTypeOverride = {
				type: 'character',
				label: 'Hero',
				pluralLabel: 'Heroes'
			};

			await campaignStore.setEntityTypeOverride(testOverride);

			expect(campaignStore.entityTypeOverrides).toContainEqual(testOverride);
		});

		it('should expose settings from campaign metadata', () => {
			expect(campaignStore.settings).toBeDefined();
			expect(typeof campaignStore.settings).toBe('object');
		});

		it('should return empty arrays when no active campaign', async () => {
			// Create a fresh store with no campaign
			vi.resetModules();
			const { campaignStore: freshStore } = await import('./campaign.svelte');
			expect(freshStore.campaign).toBeNull();

			expect(freshStore.customEntityTypes).toEqual([]);
			expect(freshStore.entityTypeOverrides).toEqual([]);
		});

		it('should return default settings when no active campaign', async () => {
			// Create a fresh store with no campaign
			vi.resetModules();
			const { campaignStore: freshStore } = await import('./campaign.svelte');
			expect(freshStore.campaign).toBeNull();

			expect(freshStore.settings).toBeDefined();
		});
	});
});
