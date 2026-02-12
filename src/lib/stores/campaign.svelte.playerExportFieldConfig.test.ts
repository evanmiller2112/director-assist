/**
 * Tests for Player Export Field Config - Campaign Store Integration (GitHub Issue #514)
 *
 * RED Phase (TDD): These tests define the expected behavior for player export field
 * visibility configuration management in the campaign store. Tests will FAIL until the
 * implementation is complete.
 *
 * Feature: Wire up player export field visibility controls to UI by integrating the
 * PlayerExportFieldConfig with the campaign store.
 *
 * Data Model (stored in campaign.metadata.playerExportFieldConfig):
 * - fieldVisibility: Record<entityType, Record<fieldKey, boolean>>
 *   Controls which fields are visible in player exports for each entity type
 *
 * Key Test Scenarios:
 * 1. playerExportFieldConfig getter returns undefined when no config exists
 * 2. playerExportFieldConfig getter returns the config when it exists
 * 3. updatePlayerExportFieldConfig() saves config to campaign metadata
 * 4. updatePlayerExportFieldConfig() preserves other campaign metadata
 * 5. getCampaignMetadata() includes playerExportFieldConfig (BUG FIX)
 * 6. Throws error when no campaign is loaded
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { BaseEntity, CampaignMetadata } from '$lib/types';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';

// Mock the database and repositories
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getAll: vi.fn(() => ({
			subscribe: vi.fn()
		})),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	},
	appConfigRepository: {
		getActiveCampaignId: vi.fn(),
		setActiveCampaignId: vi.fn()
	}
}));

vi.mock('$lib/db', () => ({
	db: {
		entities: {
			where: vi.fn(() => ({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => []),
					count: vi.fn(async () => 0)
				}))
			})),
			add: vi.fn(),
			update: vi.fn()
		}
	}
}));

vi.mock('$lib/config/systems', () => ({
	getSystemProfile: vi.fn(() => ({
		id: 'draw-steel',
		name: 'Draw Steel',
		entityTypeModifications: {},
		terminology: { gm: 'Director' }
	}))
}));

describe('campaignStore - Player Export Field Config (Issue #514)', () => {
	let campaignStore: any;
	let mockDb: any;
	let mockAppConfigRepository: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		const { db } = await import('$lib/db');
		mockDb = db;

		const { appConfigRepository } = await import('$lib/db/repositories');
		mockAppConfigRepository = appConfigRepository;

		// Import fresh store instance
		const module = await import('$lib/stores/campaign.svelte');
		campaignStore = module.campaignStore;
		campaignStore.reset();
	});

	afterEach(() => {
		campaignStore.reset();
	});

	describe('playerExportFieldConfig getter', () => {
		it('should return undefined when no campaign is loaded', () => {
			// Arrange: No campaign loaded
			expect(campaignStore.campaign).toBeNull();

			// Act & Assert
			expect(campaignStore.playerExportFieldConfig).toBeUndefined();
		});

		it('should return undefined when campaign has no config in metadata', async () => {
			// Arrange: Create campaign without playerExportFieldConfig
			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
					// No playerExportFieldConfig property
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign
			await campaignStore.load();

			// Assert: playerExportFieldConfig should be undefined
			expect(campaignStore.playerExportFieldConfig).toBeUndefined();
		});

		it('should return the config when it exists in campaign metadata', async () => {
			// Arrange: Create campaign with playerExportFieldConfig
			const expectedConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true,
						inventory: false,
						notes: false
					},
					npc: {
						name: true,
						alignment: false,
						notes: false
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: expectedConfig
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign
			await campaignStore.load();

			// Assert: playerExportFieldConfig should match expected data
			expect(campaignStore.playerExportFieldConfig).toEqual(expectedConfig);
		});

		it('should return a deep clone of the config to prevent mutation', async () => {
			// Arrange: Create campaign with playerExportFieldConfig
			const configData: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: configData
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign and get config twice
			await campaignStore.load();
			const config1 = campaignStore.playerExportFieldConfig;
			const config2 = campaignStore.playerExportFieldConfig;

			// Assert: Should be different object references (deep clone)
			expect(config1).not.toBe(config2);
			expect(config1).toEqual(config2);
		});

		it('should handle empty fieldVisibility object', async () => {
			// Arrange: Config with empty fieldVisibility
			const emptyConfig: PlayerExportFieldConfig = {
				fieldVisibility: {}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: emptyConfig
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign
			await campaignStore.load();

			// Assert: Should return empty config
			expect(campaignStore.playerExportFieldConfig).toEqual(emptyConfig);
			expect(campaignStore.playerExportFieldConfig.fieldVisibility).toEqual({});
		});
	});

	describe('updatePlayerExportFieldConfig()', () => {
		beforeEach(async () => {
			// Setup: Create and load a campaign
			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');
			vi.mocked(mockDb.entities.update).mockResolvedValue(1);

			await campaignStore.load();
		});

		it('should exist as a method on campaign store', () => {
			expect(campaignStore.updatePlayerExportFieldConfig).toBeDefined();
			expect(typeof campaignStore.updatePlayerExportFieldConfig).toBe('function');
		});

		it('should throw error when no campaign is loaded', async () => {
			// Arrange: Reset store to have no campaign
			campaignStore.reset();

			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			// Act & Assert: Should throw error
			await expect(campaignStore.updatePlayerExportFieldConfig(newConfig)).rejects.toThrow(
				'No campaign loaded'
			);
		});

		it('should save config to campaign metadata', async () => {
			// Arrange: Create new config
			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true,
						inventory: false,
						notes: false
					},
					npc: {
						name: true,
						alignment: false
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(newConfig);

			// Assert: db.entities.update should have been called with config in metadata
			expect(mockDb.entities.update).toHaveBeenCalledWith(
				'campaign-1',
				expect.objectContaining({
					metadata: expect.objectContaining({
						playerExportFieldConfig: newConfig
					}),
					updatedAt: expect.any(Date)
				})
			);
		});

		it('should preserve other campaign metadata when updating config', async () => {
			// Arrange: Campaign with existing metadata
			const existingMetadata: CampaignMetadata = {
				systemId: 'draw-steel',
				customEntityTypes: [
					{
						type: 'quest',
						label: 'Quest',
						labelPlural: 'Quests',
						icon: 'target',
						color: 'custom',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					}
				],
				entityTypeOverrides: [
					{
						type: 'npc',
						additionalFields: [
							{ key: 'faction', label: 'Faction', type: 'text', required: false, order: 1 }
						]
					}
				],
				fieldTemplates: [
					{
						id: 'template-1',
						name: 'Template 1',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				],
				settings: {
					customRelationships: ['allies', 'rivals'],
					enabledEntityTypes: ['character', 'npc']
				},
				tableMap: {
					seats: 6,
					shape: 'oval',
					dmPosition: 0,
					assignments: []
				}
			};

			// Update campaign with this metadata
			const campaignWithMetadata: BaseEntity = {
				...campaignStore.campaign,
				metadata: existingMetadata
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [campaignWithMetadata]),
					count: vi.fn(async () => 1)
				}))
			});

			await campaignStore.load();

			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(newConfig);

			// Assert: All existing metadata should be preserved
			expect(mockDb.entities.update).toHaveBeenCalledWith(
				'campaign-1',
				expect.objectContaining({
					metadata: expect.objectContaining({
						systemId: 'draw-steel',
						customEntityTypes: existingMetadata.customEntityTypes,
						entityTypeOverrides: existingMetadata.entityTypeOverrides,
						fieldTemplates: existingMetadata.fieldTemplates,
						settings: existingMetadata.settings,
						tableMap: existingMetadata.tableMap,
						playerExportFieldConfig: newConfig
					})
				})
			);
		});

		it('should update local state after saving config', async () => {
			// Arrange: Create new config
			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(newConfig);

			// Assert: Local state should be updated
			expect(campaignStore.playerExportFieldConfig).toEqual(newConfig);
		});

		it('should handle updating from undefined to a new config', async () => {
			// Arrange: Campaign has no config initially
			expect(campaignStore.playerExportFieldConfig).toBeUndefined();

			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			// Act: Set config for first time
			await campaignStore.updatePlayerExportFieldConfig(newConfig);

			// Assert: Config should be set
			expect(campaignStore.playerExportFieldConfig).toEqual(newConfig);
		});

		it('should handle updating an existing config', async () => {
			// Arrange: Set initial config
			const initialConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			await campaignStore.updatePlayerExportFieldConfig(initialConfig);

			// Update to new config
			const updatedConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true,
						inventory: false
					},
					npc: {
						name: true
					}
				}
			};

			// Act: Update to new configuration
			await campaignStore.updatePlayerExportFieldConfig(updatedConfig);

			// Assert: Config should be updated
			expect(campaignStore.playerExportFieldConfig).toEqual(updatedConfig);
		});

		it('should handle removing config by setting to undefined', async () => {
			// Arrange: Set initial config
			const initialConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			await campaignStore.updatePlayerExportFieldConfig(initialConfig);
			expect(campaignStore.playerExportFieldConfig).toEqual(initialConfig);

			// Act: Remove config
			await campaignStore.updatePlayerExportFieldConfig(undefined);

			// Assert: Config should be undefined
			expect(campaignStore.playerExportFieldConfig).toBeUndefined();
		});

		it('should use deep clone to remove Svelte 5 Proxy wrappers', async () => {
			// Arrange: Create config (simulates reactive state)
			const newConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(newConfig);

			// Assert: db.entities.update should be called with plain objects (no proxies)
			const updateCall = vi.mocked(mockDb.entities.update).mock.calls[0];
			const savedMetadata = updateCall[1].metadata;

			// Verify it's a plain object (not a Proxy)
			expect(Object.getPrototypeOf(savedMetadata)).toBe(Object.prototype);
			if (savedMetadata.playerExportFieldConfig) {
				expect(Object.getPrototypeOf(savedMetadata.playerExportFieldConfig)).toBe(Object.prototype);
			}
		});

		it('should handle config with multiple entity types', async () => {
			// Arrange: Config with multiple entity types
			const multiTypeConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true,
						inventory: false
					},
					npc: {
						name: true,
						alignment: false,
						notes: false
					},
					location: {
						name: true,
						description: true,
						secrets: false
					},
					item: {
						name: true,
						value: false,
						description: true
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(multiTypeConfig);

			// Assert: Should save successfully
			expect(campaignStore.playerExportFieldConfig).toEqual(multiTypeConfig);
			expect(Object.keys(campaignStore.playerExportFieldConfig.fieldVisibility)).toHaveLength(4);
		});

		it('should handle config with many fields per entity type', async () => {
			// Arrange: Config with many fields
			const manyFieldsConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: true,
						maxHp: true,
						ac: true,
						speed: true,
						strength: false,
						dexterity: false,
						constitution: false,
						intelligence: false,
						wisdom: false,
						charisma: false,
						inventory: false,
						notes: false,
						secrets: false
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(manyFieldsConfig);

			// Assert: Should save successfully
			expect(campaignStore.playerExportFieldConfig).toEqual(manyFieldsConfig);
			expect(
				Object.keys(campaignStore.playerExportFieldConfig.fieldVisibility.character)
			).toHaveLength(14);
		});

		it('should handle config with all fields hidden for an entity type', async () => {
			// Arrange: Config with all fields set to false
			const allHiddenConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						name: false,
						description: false,
						alignment: false,
						notes: false
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(allHiddenConfig);

			// Assert: Should save successfully
			const config = campaignStore.playerExportFieldConfig;
			expect(config.fieldVisibility.npc.name).toBe(false);
			expect(config.fieldVisibility.npc.description).toBe(false);
		});

		it('should handle config with all fields visible for an entity type', async () => {
			// Arrange: Config with all fields set to true
			const allVisibleConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						description: true,
						hp: true,
						notes: true
					}
				}
			};

			// Act: Update config
			await campaignStore.updatePlayerExportFieldConfig(allVisibleConfig);

			// Assert: Should save successfully
			const config = campaignStore.playerExportFieldConfig;
			expect(config.fieldVisibility.character.name).toBe(true);
			expect(config.fieldVisibility.character.description).toBe(true);
		});
	});

	describe('getCampaignMetadata() bug fix', () => {
		it('should include playerExportFieldConfig in returned metadata', async () => {
			// Arrange: Create campaign with playerExportFieldConfig
			const expectedConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true,
						hp: false
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: expectedConfig
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign
			await campaignStore.load();

			// Use the getter which internally calls getCampaignMetadata
			const config = campaignStore.playerExportFieldConfig;

			// Assert: Config should be present (proves getCampaignMetadata includes it)
			expect(config).toEqual(expectedConfig);
		});

		it('should preserve playerExportFieldConfig when updating other metadata', async () => {
			// Arrange: Campaign with playerExportFieldConfig
			const existingConfig: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: existingConfig
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			await campaignStore.load();

			// Act: Update settings (which uses getCampaignMetadata internally)
			await campaignStore.updateSettings({ theme: 'dark' });

			// Assert: playerExportFieldConfig should be preserved
			const updateCall = vi.mocked(mockDb.entities.update).mock.calls[0];
			expect(updateCall[1].metadata.playerExportFieldConfig).toEqual(existingConfig);
		});

		it('should handle campaigns without playerExportFieldConfig in getCampaignMetadata', async () => {
			// Arrange: Campaign without playerExportFieldConfig
			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					}
					// No playerExportFieldConfig
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign
			await campaignStore.load();

			// Assert: Config should be undefined (not throw error)
			expect(campaignStore.playerExportFieldConfig).toBeUndefined();
		});
	});

	describe('Integration with other campaign store features', () => {
		it('should not interfere with tableMap operations', async () => {
			// Arrange: Campaign with both tableMap and playerExportFieldConfig
			const tableMapData = {
				seats: 6,
				shape: 'oval' as const,
				dmPosition: 0,
				assignments: []
			};

			const configData: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					tableMap: tableMapData,
					playerExportFieldConfig: configData
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			await campaignStore.load();

			// Assert: Both features should coexist
			expect(campaignStore.tableMap).toEqual(tableMapData);
			expect(campaignStore.playerExportFieldConfig).toEqual(configData);
		});

		it('should not interfere with fieldTemplates operations', async () => {
			// Arrange: Campaign with both fieldTemplates and playerExportFieldConfig
			const templateData = {
				id: 'template-1',
				name: 'Test Template',
				category: 'user',
				fieldDefinitions: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const configData: PlayerExportFieldConfig = {
				fieldVisibility: {
					character: {
						name: true
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [],
					entityTypeOverrides: [],
					fieldTemplates: [templateData],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: configData
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			await campaignStore.load();

			// Assert: Both features should coexist
			expect(campaignStore.fieldTemplates).toHaveLength(1);
			expect(campaignStore.playerExportFieldConfig).toEqual(configData);
		});

		it('should work alongside custom entity types', async () => {
			// Arrange: Campaign with custom entity type and playerExportFieldConfig
			const customEntityType = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'target',
				color: 'custom',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const configData: PlayerExportFieldConfig = {
				fieldVisibility: {
					quest: {
						name: true,
						description: true,
						status: false
					}
				}
			};

			const mockCampaign: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [customEntityType],
					entityTypeOverrides: [],
					fieldTemplates: [],
					settings: {
						customRelationships: [],
						enabledEntityTypes: []
					},
					playerExportFieldConfig: configData
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			await campaignStore.load();

			// Assert: Both features should work together
			expect(campaignStore.customEntityTypes).toHaveLength(1);
			expect(campaignStore.playerExportFieldConfig.fieldVisibility.quest).toBeDefined();
		});
	});
});
