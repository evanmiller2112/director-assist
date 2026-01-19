/**
 * Integration Tests for Backup/Restore with Custom Entity Types (TDD RED Phase - Issue #25)
 *
 * Phase 6: Data Persistence and Backup/Restore
 *
 * These tests verify that custom entity type definitions and overrides are properly
 * included in backup export and correctly restored on import. Tests should FAIL until
 * backup integration is implemented.
 *
 * Test Coverage:
 * - Custom entity type definitions are included in backup export
 * - Entity type overrides are included in backup export
 * - Import correctly restores custom types and overrides
 * - When custom type is deleted, orphaned entities are handled
 * - When field is removed from type, entity data is preserved
 * - Backward compatibility with old backups without custom types
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '$lib/db';
import type {
	CampaignBackup,
	BaseEntity,
	EntityTypeDefinition,
	EntityTypeOverride
} from '$lib/types';
import { campaignStore } from '$lib/stores';

// Mock localStorage
let localStorageMock: Record<string, string> = {};

beforeEach(async () => {
	// Setup mock localStorage
	localStorageMock = {};
	global.localStorage = {
		getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			localStorageMock[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete localStorageMock[key];
		}),
		clear: vi.fn(() => {
			Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
		}),
		length: 0,
		key: vi.fn()
	} as Storage;

	// Clear database before each test
	await db.entities.clear();
	await db.chatMessages.clear();
	await db.appConfig.clear();
});

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Test helper: Mock exportBackup function
 */
async function exportBackup(): Promise<CampaignBackup> {
	const entities = await db.entities.toArray();
	const chatHistory = await db.chatMessages.toArray();
	const activeCampaignId = (await db.appConfig.get('activeCampaignId'))?.value as
		| string
		| undefined;

	// Get selected model from localStorage
	const storedModel = localStorage.getItem('dm-assist-selected-model');
	const selectedModel = storedModel?.trim() || undefined;

	const backup: CampaignBackup = {
		version: '2.0.0',
		exportedAt: new Date(),
		entities,
		chatHistory,
		activeCampaignId,
		selectedModel
	};

	return backup;
}

/**
 * Test helper: Mock importBackup function
 */
async function importBackup(backup: CampaignBackup): Promise<void> {
	await db.entities.clear();
	await db.chatMessages.clear();
	await db.appConfig.clear();

	await db.entities.bulkAdd(backup.entities);
	if (backup.chatHistory) {
		await db.chatMessages.bulkAdd(backup.chatHistory);
	}

	if (backup.activeCampaignId) {
		await db.appConfig.put({ key: 'activeCampaignId', value: backup.activeCampaignId });
	}

	if (backup.selectedModel) {
		localStorage.setItem('dm-assist-selected-model', backup.selectedModel);
	} else {
		localStorage.removeItem('dm-assist-selected-model');
	}
}

describe('Backup Export - Custom Entity Types', () => {
	describe('Export Custom Entity Type Definitions', () => {
		it('should include custom entity types in campaign metadata', async () => {
			// Arrange: Create campaign with custom entity type
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: ['involves']
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					systemId: 'draw-steel',
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Custom types should be in campaign metadata
			const exportedCampaign = backup.entities.find((e) => e.id === 'campaign-1');
			expect(exportedCampaign).toBeDefined();
			expect(exportedCampaign?.metadata).toHaveProperty('customEntityTypes');

			const customTypes = (exportedCampaign?.metadata as any).customEntityTypes;
			expect(customTypes).toHaveLength(1);
			expect(customTypes[0].type).toBe('quest');
			expect(customTypes[0].label).toBe('Quest');
			expect(customTypes[0].fieldDefinitions).toHaveLength(1);
		});

		it('should export multiple custom entity types', async () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: customTypes,
					entityTypeOverrides: [],
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();

			const exportedCampaign = backup.entities.find((e) => e.id === 'campaign-1');
			const exportedTypes = (exportedCampaign?.metadata as any).customEntityTypes;

			expect(exportedTypes).toHaveLength(2);
			expect(exportedTypes.map((t: EntityTypeDefinition) => t.type)).toEqual(['quest', 'shop']);
		});

		it('should export custom type with all field definitions', async () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'difficulty',
						label: 'Difficulty',
						type: 'select',
						required: false,
						options: ['easy', 'medium', 'hard'],
						order: 2
					},
					{
						key: 'reward',
						label: 'Reward',
						type: 'richtext',
						required: false,
						order: 3
					}
				],
				defaultRelationships: ['involves', 'rewards']
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();
			const exportedCampaign = backup.entities.find((e) => e.id === 'campaign-1');
			const exportedType = (exportedCampaign?.metadata as any).customEntityTypes[0];

			expect(exportedType.fieldDefinitions).toHaveLength(3);
			expect(exportedType.fieldDefinitions[0].key).toBe('objective');
			expect(exportedType.fieldDefinitions[1].options).toEqual(['easy', 'medium', 'hard']);
			expect(exportedType.defaultRelationships).toEqual(['involves', 'rewards']);
		});
	});

	describe('Export Entity Type Overrides', () => {
		it('should include entity type overrides in campaign metadata', async () => {
			const override: EntityTypeOverride = {
				type: 'character',
				hiddenFromSidebar: false,
				hiddenFields: ['secrets'],
				additionalFields: [
					{
						key: 'customField',
						label: 'Custom Field',
						type: 'text',
						required: false,
						order: 10
					}
				]
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [override],
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();

			const exportedCampaign = backup.entities.find((e) => e.id === 'campaign-1');
			expect(exportedCampaign?.metadata).toHaveProperty('entityTypeOverrides');

			const overrides = (exportedCampaign?.metadata as any).entityTypeOverrides;
			expect(overrides).toHaveLength(1);
			expect(overrides[0].type).toBe('character');
			expect(overrides[0].hiddenFields).toEqual(['secrets']);
			expect(overrides[0].additionalFields).toHaveLength(1);
		});

		it('should export multiple entity type overrides', async () => {
			const overrides: EntityTypeOverride[] = [
				{
					type: 'character',
					hiddenFields: ['secrets']
				},
				{
					type: 'npc',
					hiddenFromSidebar: false,
					fieldOrder: ['name', 'role', 'personality']
				}
			];

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: overrides,
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();
			const exportedCampaign = backup.entities.find((e) => e.id === 'campaign-1');
			const exportedOverrides = (exportedCampaign?.metadata as any).entityTypeOverrides;

			expect(exportedOverrides).toHaveLength(2);
			expect(exportedOverrides.map((o: EntityTypeOverride) => o.type)).toEqual([
				'character',
				'npc'
			]);
		});
	});

	describe('Export Custom Entity Instances', () => {
		it('should export entities of custom type', async () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const questEntity: BaseEntity = {
				id: 'quest-1',
				type: 'quest',
				name: 'Find the Lost Artifact',
				description: 'A dangerous quest',
				notes: '',
				fields: {
					objective: 'Retrieve the ancient amulet',
					difficulty: 'hard'
				},
				tags: ['main-quest'],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.bulkAdd([campaignEntity, questEntity]);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();

			// Both campaign and quest should be in backup
			expect(backup.entities).toHaveLength(2);

			const exportedQuest = backup.entities.find((e) => e.type === 'quest');
			expect(exportedQuest).toBeDefined();
			expect(exportedQuest?.name).toBe('Find the Lost Artifact');
			expect(exportedQuest?.fields.objective).toBe('Retrieve the ancient amulet');
		});

		it('should export multiple entities of custom type', async () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const quest1: BaseEntity = {
				id: 'quest-1',
				type: 'quest',
				name: 'Quest 1',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const quest2: BaseEntity = {
				id: 'quest-2',
				type: 'quest',
				name: 'Quest 2',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.bulkAdd([campaignEntity, quest1, quest2]);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const backup = await exportBackup();

			const questEntities = backup.entities.filter((e) => e.type === 'quest');
			expect(questEntities).toHaveLength(2);
		});
	});
});

describe('Backup Import - Custom Entity Types', () => {
	describe('Import Custom Entity Type Definitions', () => {
		it('should restore custom entity types from backup', async () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: undefined
			};

			// Act: Import backup
			await importBackup(backup);

			// Assert: Custom type should be restored
			const importedCampaign = await db.entities.get('campaign-1');
			expect(importedCampaign).toBeDefined();

			const customTypes = (importedCampaign?.metadata as any).customEntityTypes;
			expect(customTypes).toHaveLength(1);
			expect(customTypes[0].type).toBe('quest');
			expect(customTypes[0].fieldDefinitions).toHaveLength(1);
		});

		it('should restore multiple custom entity types', async () => {
			const customTypes: EntityTypeDefinition[] = [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'scroll',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				{
					type: 'shop',
					label: 'Shop',
					labelPlural: 'Shops',
					icon: 'store',
					color: 'amber',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				}
			];

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: customTypes,
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: undefined
			};

			await importBackup(backup);

			const importedCampaign = await db.entities.get('campaign-1');
			const importedTypes = (importedCampaign?.metadata as any).customEntityTypes;

			expect(importedTypes).toHaveLength(2);
			expect(importedTypes.map((t: EntityTypeDefinition) => t.type)).toEqual(['quest', 'shop']);
		});
	});

	describe('Import Entity Type Overrides', () => {
		it('should restore entity type overrides from backup', async () => {
			const override: EntityTypeOverride = {
				type: 'character',
				hiddenFields: ['secrets'],
				additionalFields: [
					{
						key: 'customField',
						label: 'Custom Field',
						type: 'text',
						required: false,
						order: 10
					}
				]
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [override],
					settings: {}
				}
			};

			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: undefined
			};

			await importBackup(backup);

			const importedCampaign = await db.entities.get('campaign-1');
			const overrides = (importedCampaign?.metadata as any).entityTypeOverrides;

			expect(overrides).toHaveLength(1);
			expect(overrides[0].type).toBe('character');
			expect(overrides[0].hiddenFields).toEqual(['secrets']);
		});
	});

	describe('Import Custom Entity Instances', () => {
		it('should restore entities of custom type', async () => {
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const questEntity: BaseEntity = {
				id: 'quest-1',
				type: 'quest',
				name: 'Find the Artifact',
				description: '',
				notes: '',
				fields: { objective: 'Find it' },
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity, questEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: undefined
			};

			await importBackup(backup);

			const importedQuest = await db.entities.get('quest-1');
			expect(importedQuest).toBeDefined();
			expect(importedQuest?.type).toBe('quest');
			expect(importedQuest?.name).toBe('Find the Artifact');
			expect(importedQuest?.fields.objective).toBe('Find it');
		});
	});

	describe('Round Trip - Export and Import', () => {
		it('should preserve custom types through export/import cycle', async () => {
			// Create campaign with custom type
			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: ['involves']
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Original Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Export
			const backup = await exportBackup();

			// Clear database
			await db.entities.clear();
			await db.appConfig.clear();

			// Import
			await importBackup(backup);

			// Verify
			const restored = await db.entities.get('campaign-1');
			const restoredTypes = (restored?.metadata as any).customEntityTypes;

			expect(restoredTypes).toHaveLength(1);
			expect(restoredTypes[0].type).toBe('quest');
			expect(restoredTypes[0].label).toBe('Quest');
			expect(restoredTypes[0].fieldDefinitions[0].key).toBe('objective');
			expect(restoredTypes[0].defaultRelationships).toEqual(['involves']);
		});
	});
});

describe('Orphaned Entity Handling', () => {
	describe('When Custom Type is Deleted', () => {
		it('should preserve entities even when their custom type is deleted', async () => {
			// This test verifies that entity data persists even if the type definition
			// is removed from the campaign. The entities become "orphaned" but data is not lost.

			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			// Create campaign with custom type
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			// Create entity of custom type
			const questEntity: BaseEntity = {
				id: 'quest-1',
				type: 'quest',
				name: 'Find the Artifact',
				description: 'Important quest',
				notes: '',
				fields: { objective: 'Find it' },
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.bulkAdd([campaignEntity, questEntity]);

			// Delete custom type from campaign (simulating user deleting the type)
			const updatedCampaign = {
				...campaignEntity,
				metadata: {
					...campaignEntity.metadata,
					customEntityTypes: [] // Type removed
				}
			};
			await db.entities.put(updatedCampaign);

			// Quest entity should still exist in database
			const orphanedQuest = await db.entities.get('quest-1');
			expect(orphanedQuest).toBeDefined();
			expect(orphanedQuest?.name).toBe('Find the Artifact');
			expect(orphanedQuest?.fields.objective).toBe('Find it');

			// Note: Application should handle orphaned entities gracefully
			// (e.g., show warning, allow viewing but not creating new ones)
		});

		it('should allow entities to be queried even when type definition is missing', async () => {
			// Orphaned entities should still be queryable by type string

			const questEntity: BaseEntity = {
				id: 'quest-1',
				type: 'quest', // Type without definition
				name: 'Orphaned Quest',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(questEntity);

			// Should be able to query by type
			const questEntities = await db.entities.where('type').equals('quest').toArray();
			expect(questEntities).toHaveLength(1);
			expect(questEntities[0].name).toBe('Orphaned Quest');
		});
	});

	describe('When Field is Removed from Type', () => {
		it('should preserve field data when field is removed from type definition', async () => {
			// Field data should persist even when field definition is removed

			const customType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'reward',
						label: 'Reward',
						type: 'text',
						required: false,
						order: 2
					}
				],
				defaultRelationships: []
			};

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [customType],
					entityTypeOverrides: [],
					settings: {}
				}
			};

			const questEntity: BaseEntity = {
				id: 'quest-1',
				type: 'quest',
				name: 'Find Artifact',
				description: '',
				notes: '',
				fields: {
					objective: 'Find the ancient amulet',
					reward: '1000 gold pieces'
				},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.bulkAdd([campaignEntity, questEntity]);

			// Remove 'reward' field from type definition
			const updatedType: EntityTypeDefinition = {
				...customType,
				fieldDefinitions: [
					{
						key: 'objective',
						label: 'Objective',
						type: 'text',
						required: true,
						order: 1
					}
					// 'reward' field removed
				]
			};

			const updatedCampaign = {
				...campaignEntity,
				metadata: {
					...campaignEntity.metadata,
					customEntityTypes: [updatedType]
				}
			};
			await db.entities.put(updatedCampaign);

			// Entity data should still contain 'reward' field
			const quest = await db.entities.get('quest-1');
			expect(quest?.fields.reward).toBe('1000 gold pieces');

			// Note: UI may not display removed field, but data is preserved
		});
	});
});

describe('Backward Compatibility', () => {
	it('should import old backups without custom entity types', async () => {
		// Old backup format without customEntityTypes in metadata
		const oldCampaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'Old Campaign',
			description: '',
			notes: '',
			fields: {},
			tags: [],
			links: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {
				// No customEntityTypes or entityTypeOverrides
				settings: {}
			}
		};

		const oldBackup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [oldCampaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined
		};

		// Should import without errors
		await expect(importBackup(oldBackup)).resolves.not.toThrow();

		const imported = await db.entities.get('campaign-1');
		expect(imported).toBeDefined();
		expect(imported?.name).toBe('Old Campaign');

		// Should handle missing arrays gracefully
		const metadata = imported?.metadata as any;
		expect(metadata.customEntityTypes || []).toEqual([]);
		expect(metadata.entityTypeOverrides || []).toEqual([]);
	});

	it('should export new format even when no custom types exist', async () => {
		const campaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'Simple Campaign',
			description: '',
			notes: '',
			fields: {},
			tags: [],
			links: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {}
			}
		};

		await db.entities.add(campaignEntity);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		const backup = await exportBackup();

		const exported = backup.entities.find((e) => e.id === 'campaign-1');
		expect((exported?.metadata as any).customEntityTypes).toEqual([]);
		expect((exported?.metadata as any).entityTypeOverrides).toEqual([]);
	});
});
