/**
 * Tests for Table Map Feature - Campaign Store Integration (GitHub Issue #318)
 *
 * RED Phase (TDD): These tests define the expected behavior for table map data
 * management in the campaign store. Tests will FAIL until the implementation is complete.
 *
 * Feature: Visual seating chart for in-person sessions showing player/character
 * assignments at each seat.
 *
 * Data Model (stored in campaign.metadata.tableMap):
 * - seats: number (4-10 seats)
 * - shape: 'oval' | 'rectangular'
 * - dmPosition: number (optional)
 * - assignments: SeatAssignment[] (seatIndex, playerId?, characterId?)
 *
 * Key Test Scenarios:
 * 1. tableMap getter returns undefined when no table map exists
 * 2. tableMap getter returns the table map data when it exists
 * 3. updateTableMap() saves table map to campaign metadata
 * 4. updateTableMap() preserves other campaign metadata
 * 5. Throws error when no campaign is loaded
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { BaseEntity, CampaignMetadata } from '$lib/types';
import type { TableMap, SeatAssignment } from '$lib/types/campaign';

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

describe('campaignStore - Table Map Feature (Issue #318)', () => {
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

	describe('tableMap getter', () => {
		it('should return undefined when no campaign is loaded', () => {
			// Arrange: No campaign loaded
			expect(campaignStore.campaign).toBeNull();

			// Act & Assert
			expect(campaignStore.tableMap).toBeUndefined();
		});

		it('should return undefined when campaign has no table map in metadata', async () => {
			// Arrange: Create campaign without table map
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
					// No tableMap property
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

			// Assert: tableMap should be undefined
			expect(campaignStore.tableMap).toBeUndefined();
		});

		it('should return the table map data when it exists in campaign metadata', async () => {
			// Arrange: Create campaign with table map
			const expectedTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [
					{ seatIndex: 1, playerId: 'player-1', characterId: 'char-1' },
					{ seatIndex: 2, playerId: 'player-2', characterId: 'char-2' }
				]
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
					tableMap: expectedTableMap
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

			// Assert: tableMap should match expected data
			expect(campaignStore.tableMap).toEqual(expectedTableMap);
		});

		it('should return a deep clone of the table map to prevent mutation', async () => {
			// Arrange: Create campaign with table map
			const tableMapData: TableMap = {
				seats: 4,
				shape: 'rectangular',
				dmPosition: 0,
				assignments: [{ seatIndex: 1, playerId: 'player-1' }]
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
					tableMap: tableMapData
				}
			};

			vi.mocked(mockDb.entities.where).mockReturnValue({
				equals: vi.fn(() => ({
					toArray: vi.fn(async () => [mockCampaign]),
					count: vi.fn(async () => 1)
				}))
			});

			vi.mocked(mockAppConfigRepository.getActiveCampaignId).mockResolvedValue('campaign-1');

			// Act: Load campaign and get table map
			await campaignStore.load();
			const tableMap1 = campaignStore.tableMap;
			const tableMap2 = campaignStore.tableMap;

			// Assert: Should be different object references (deep clone)
			expect(tableMap1).not.toBe(tableMap2);
			expect(tableMap1).toEqual(tableMap2);
		});
	});

	describe('updateTableMap()', () => {
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

		it('should throw error when no campaign is loaded', async () => {
			// Arrange: Reset store to have no campaign
			campaignStore.reset();

			const newTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: []
			};

			// Act & Assert: Should throw error
			await expect(campaignStore.updateTableMap(newTableMap)).rejects.toThrow(
				'No campaign loaded'
			);
		});

		it('should save table map to campaign metadata', async () => {
			// Arrange: Create new table map
			const newTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [
					{ seatIndex: 1, playerId: 'player-1', characterId: 'char-1' },
					{ seatIndex: 2, playerId: 'player-2', characterId: 'char-2' }
				]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(newTableMap);

			// Assert: db.entities.update should have been called with table map in metadata
			expect(mockDb.entities.update).toHaveBeenCalledWith(
				'campaign-1',
				expect.objectContaining({
					metadata: expect.objectContaining({
						tableMap: newTableMap
					}),
					updatedAt: expect.any(Date)
				})
			);
		});

		it('should preserve other campaign metadata when updating table map', async () => {
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
						fieldDefinitions: []
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

			const newTableMap: TableMap = {
				seats: 8,
				shape: 'rectangular',
				dmPosition: 4,
				assignments: []
			};

			// Act: Update table map
			await campaignStore.updateTableMap(newTableMap);

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
						tableMap: newTableMap
					})
				})
			);
		});

		it('should update local state after saving table map', async () => {
			// Arrange: Create new table map
			const newTableMap: TableMap = {
				seats: 5,
				shape: 'oval',
				dmPosition: 0,
				assignments: [{ seatIndex: 1, playerId: 'player-1' }]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(newTableMap);

			// Assert: Local state should be updated
			expect(campaignStore.tableMap).toEqual(newTableMap);
		});

		it('should handle updating from undefined to a new table map', async () => {
			// Arrange: Campaign has no table map initially
			expect(campaignStore.tableMap).toBeUndefined();

			const newTableMap: TableMap = {
				seats: 4,
				shape: 'rectangular',
				dmPosition: undefined,
				assignments: []
			};

			// Act: Set table map for first time
			await campaignStore.updateTableMap(newTableMap);

			// Assert: Table map should be set
			expect(campaignStore.tableMap).toEqual(newTableMap);
		});

		it('should handle updating an existing table map', async () => {
			// Arrange: Set initial table map
			const initialTableMap: TableMap = {
				seats: 4,
				shape: 'rectangular',
				dmPosition: 0,
				assignments: []
			};

			await campaignStore.updateTableMap(initialTableMap);

			// Update to new table map
			const updatedTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 1,
				assignments: [
					{ seatIndex: 2, playerId: 'player-1', characterId: 'char-1' }
				]
			};

			// Act: Update to new configuration
			await campaignStore.updateTableMap(updatedTableMap);

			// Assert: Table map should be updated
			expect(campaignStore.tableMap).toEqual(updatedTableMap);
		});

		it('should handle removing table map by setting to undefined', async () => {
			// Arrange: Set initial table map
			const initialTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: []
			};

			await campaignStore.updateTableMap(initialTableMap);
			expect(campaignStore.tableMap).toEqual(initialTableMap);

			// Act: Remove table map
			await campaignStore.updateTableMap(undefined);

			// Assert: Table map should be undefined
			expect(campaignStore.tableMap).toBeUndefined();
		});

		it('should use deep clone to remove Svelte 5 Proxy wrappers', async () => {
			// Arrange: Create table map (simulates reactive state)
			const newTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [{ seatIndex: 1, playerId: 'player-1' }]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(newTableMap);

			// Assert: db.entities.update should be called with plain objects (no proxies)
			const updateCall = vi.mocked(mockDb.entities.update).mock.calls[0];
			const savedMetadata = updateCall[1].metadata;

			// Verify it's a plain object (not a Proxy)
			expect(Object.getPrototypeOf(savedMetadata)).toBe(Object.prototype);
			expect(Object.getPrototypeOf(savedMetadata.tableMap)).toBe(Object.prototype);
		});

		it('should handle table map with minimum seats (4)', async () => {
			// Arrange: Table map with minimum seats
			const minSeatsTableMap: TableMap = {
				seats: 4,
				shape: 'rectangular',
				dmPosition: 0,
				assignments: []
			};

			// Act: Update table map
			await campaignStore.updateTableMap(minSeatsTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap).toEqual(minSeatsTableMap);
		});

		it('should handle table map with maximum seats (10)', async () => {
			// Arrange: Table map with maximum seats
			const maxSeatsTableMap: TableMap = {
				seats: 10,
				shape: 'oval',
				dmPosition: 5,
				assignments: [
					{ seatIndex: 0, playerId: 'player-1' },
					{ seatIndex: 1, playerId: 'player-2' },
					{ seatIndex: 2, playerId: 'player-3' },
					{ seatIndex: 3, playerId: 'player-4' },
					{ seatIndex: 4, playerId: 'player-5' },
					{ seatIndex: 6, playerId: 'player-6' },
					{ seatIndex: 7, playerId: 'player-7' },
					{ seatIndex: 8, playerId: 'player-8' },
					{ seatIndex: 9, playerId: 'player-9' }
				]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(maxSeatsTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap).toEqual(maxSeatsTableMap);
		});

		it('should handle table map with no DM position', async () => {
			// Arrange: Table map without DM position
			const noDmTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: undefined,
				assignments: []
			};

			// Act: Update table map
			await campaignStore.updateTableMap(noDmTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap).toEqual(noDmTableMap);
			expect(campaignStore.tableMap.dmPosition).toBeUndefined();
		});

		it('should handle table map with both oval and rectangular shapes', async () => {
			// Arrange & Act: Test oval shape
			const ovalTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: []
			};
			await campaignStore.updateTableMap(ovalTableMap);
			expect(campaignStore.tableMap.shape).toBe('oval');

			// Test rectangular shape
			const rectTableMap: TableMap = {
				seats: 8,
				shape: 'rectangular',
				dmPosition: 0,
				assignments: []
			};
			await campaignStore.updateTableMap(rectTableMap);
			expect(campaignStore.tableMap.shape).toBe('rectangular');
		});

		it('should handle empty assignments array', async () => {
			// Arrange: Table map with no assignments
			const emptyAssignments: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: []
			};

			// Act: Update table map
			await campaignStore.updateTableMap(emptyAssignments);

			// Assert: Should save successfully
			expect(campaignStore.tableMap.assignments).toEqual([]);
		});

		it('should handle seat assignments with only playerId', async () => {
			// Arrange: Assignment with just player
			const playerOnlyTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [
					{ seatIndex: 1, playerId: 'player-1' }
				]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(playerOnlyTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap.assignments[0]).toEqual({
				seatIndex: 1,
				playerId: 'player-1'
			});
		});

		it('should handle seat assignments with only characterId', async () => {
			// Arrange: Assignment with just character
			const characterOnlyTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [
					{ seatIndex: 2, characterId: 'char-1' }
				]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(characterOnlyTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap.assignments[0]).toEqual({
				seatIndex: 2,
				characterId: 'char-1'
			});
		});

		it('should handle seat assignments with both playerId and characterId', async () => {
			// Arrange: Assignment with both player and character
			const fullAssignmentTableMap: TableMap = {
				seats: 6,
				shape: 'oval',
				dmPosition: 0,
				assignments: [
					{ seatIndex: 3, playerId: 'player-1', characterId: 'char-1' }
				]
			};

			// Act: Update table map
			await campaignStore.updateTableMap(fullAssignmentTableMap);

			// Assert: Should save successfully
			expect(campaignStore.tableMap.assignments[0]).toEqual({
				seatIndex: 3,
				playerId: 'player-1',
				characterId: 'char-1'
			});
		});
	});
});
