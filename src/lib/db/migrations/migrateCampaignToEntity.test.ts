import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { migrateCampaignToEntity, convertOldCampaignToEntity } from './migrateCampaignToEntity';
import { db } from '../index';
import { appConfigRepository } from '../repositories/appConfigRepository';
import type { Campaign } from '$lib/types';

/**
 * Tests for Campaign Migration - Issue #46: Refactor Campaign to first-class Entity type
 *
 * These tests verify the migration from the old singleton Campaign table to Campaign entities:
 * - Old campaign data is properly converted to entity format
 * - Migration is idempotent (can run multiple times safely)
 * - Active campaign is properly set after migration
 * - Backward compatibility with old backup formats
 *
 * RED PHASE: These tests verify the migration logic works correctly.
 */

describe('Campaign Migration - Issue #46', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		// Clear both old and new campaign storage
		await db.campaign.clear();
		await db.entities.clear();
		await db.appConfig.clear();
	});

	afterEach(async () => {
		await db.campaign.clear();
		await db.entities.clear();
		await db.appConfig.clear();
	});

	describe('Migration from Old Campaign Table', () => {
		it('should migrate old campaign to campaign entity', async () => {
			// Create old campaign in legacy table
			const oldCampaign: Campaign = {
				id: 'old-campaign-id',
				name: 'Legacy Campaign',
				description: 'A campaign from the old system',
				system: 'D&D 5e',
				setting: 'Forgotten Realms',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			// Should have created campaign entity
			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);

			const migratedCampaign = campaignEntities[0];
			expect(migratedCampaign.id).toBe('old-campaign-id');
			expect(migratedCampaign.type).toBe('campaign');
			expect(migratedCampaign.name).toBe('Legacy Campaign');
			expect(migratedCampaign.description).toBe('A campaign from the old system');
			expect(migratedCampaign.fields.system).toBe('D&D 5e');
			expect(migratedCampaign.fields.setting).toBe('Forgotten Realms');
			expect(migratedCampaign.fields.status).toBe('active');
		});

		it('should migrate campaign metadata correctly', async () => {
			const oldCampaign: Campaign = {
				id: 'campaign-with-metadata',
				name: 'Campaign with Custom Types',
				description: '',
				system: 'Pathfinder',
				setting: 'Golarion',
				customEntityTypes: [
					{
						type: 'custom_monster',
						label: 'Custom Monster',
						labelPlural: 'Custom Monsters',
						icon: 'skull',
						color: 'red',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					}
				],
				entityTypeOverrides: [
					{
						type: 'character',
						hiddenFields: ['secrets']
					}
				],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'dark',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			const migratedCampaign = campaignEntities[0];

			// Check metadata structure
			expect(migratedCampaign.metadata).toBeDefined();

			const metadata = migratedCampaign.metadata as any;
			expect(metadata.customEntityTypes).toHaveLength(1);
			expect(metadata.customEntityTypes[0].type).toBe('custom_monster');

			expect(metadata.entityTypeOverrides).toHaveLength(1);
			expect(metadata.entityTypeOverrides[0].type).toBe('character');

			expect(metadata.settings).toBeDefined();
		});

		it('should set migrated campaign as active', async () => {
			const oldCampaign: Campaign = {
				id: 'old-campaign',
				name: 'Old Campaign',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			// Check active campaign is set
			const activeCampaignId = await appConfigRepository.getActiveCampaignId();
			expect(activeCampaignId).toBe('old-campaign');
		});

		it('should preserve timestamps from old campaign', async () => {
			const createdDate = new Date('2024-01-01T10:00:00Z');
			const updatedDate = new Date('2024-06-15T14:30:00Z');

			const oldCampaign: Campaign = {
				id: 'timestamped-campaign',
				name: 'Campaign with Timestamps',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: createdDate,
				updatedAt: updatedDate
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			const migratedCampaign = campaignEntities[0];

			expect(migratedCampaign.createdAt).toEqual(createdDate);
			expect(migratedCampaign.updatedAt).toEqual(updatedDate);
		});
	});

	describe('Migration Idempotency', () => {
		it('should not duplicate campaigns if run multiple times', async () => {
			const oldCampaign: Campaign = {
				id: 'idempotent-test',
				name: 'Idempotent Campaign',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign);

			// Run migration twice
			await migrateCampaignToEntity();
			await migrateCampaignToEntity();

			// Should only have one campaign entity
			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);
		});

		it('should skip migration if campaign entities already exist', async () => {
			// Create campaign entity directly (simulating already migrated)
			const existingCampaign = {
				id: 'existing-campaign',
				type: 'campaign',
				name: 'Existing Campaign Entity',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: 'D&D 5e',
					setting: 'Eberron',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(existingCampaign);

			// Add old campaign to test migration doesn't run
			const oldCampaign: Campaign = {
				id: 'should-not-migrate',
				name: 'Should Not Migrate',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			// Should still only have the existing campaign entity
			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);
			expect(campaignEntities[0].id).toBe('existing-campaign');
		});

		it('should set active campaign if missing but entities exist', async () => {
			// Create campaign entities without setting active
			const campaign1 = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign 1',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'D&D 5e', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);

			// Run migration
			await migrateCampaignToEntity();

			// Should have set first campaign as active
			const activeCampaignId = await appConfigRepository.getActiveCampaignId();
			expect(activeCampaignId).toBe('campaign-1');
		});
	});

	describe('Migration Edge Cases', () => {
		it('should handle empty old campaign table gracefully', async () => {
			// No old campaigns exist

			// Run migration
			await migrateCampaignToEntity();

			// Should complete without errors
			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(0);
		});

		it('should handle old campaign without ID', async () => {
			const oldCampaign: Campaign = {
				id: '', // Empty ID
				name: 'No ID Campaign',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign);

			// Run migration
			await migrateCampaignToEntity();

			// Should generate new ID
			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);
			expect(campaignEntities[0].id).toBeTruthy();
			expect(campaignEntities[0].id.length).toBeGreaterThan(0);
		});

		it('should handle old campaign with missing optional fields', async () => {
			const oldCampaign: Partial<Campaign> = {
				id: 'minimal-campaign',
				name: 'Minimal Campaign',
				// Missing description, system, setting
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign as Campaign);

			// Run migration
			await migrateCampaignToEntity();

			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);

			const migratedCampaign = campaignEntities[0];
			expect(migratedCampaign.description).toBe('');
			expect(migratedCampaign.fields.system).toBe('System Agnostic');
			expect(migratedCampaign.fields.setting).toBe('');
		});

		it('should handle old campaign with missing metadata', async () => {
			const oldCampaign: Partial<Campaign> = {
				id: 'no-metadata',
				name: 'No Metadata Campaign',
				description: '',
				system: 'D&D 5e',
				setting: '',
				// Missing customEntityTypes, entityTypeOverrides, settings
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.campaign.add(oldCampaign as Campaign);

			// Run migration
			await migrateCampaignToEntity();

			const campaignEntities = await db.entities.where('type').equals('campaign').toArray();
			expect(campaignEntities).toHaveLength(1);

			const migratedCampaign = campaignEntities[0];
			const metadata = migratedCampaign.metadata as any;

			expect(metadata.customEntityTypes).toEqual([]);
			expect(metadata.entityTypeOverrides).toEqual([]);
			expect(metadata.settings).toBeDefined();
		});
	});

	describe('convertOldCampaignToEntity Helper', () => {
		it('should convert old campaign to entity format', () => {
			const oldCampaign: Campaign = {
				id: 'convert-test',
				name: 'Convert Test',
				description: 'Testing conversion',
				system: 'Pathfinder 2e',
				setting: 'Golarion',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			};

			const entityCampaign = convertOldCampaignToEntity(oldCampaign);

			expect(entityCampaign.id).toBe('convert-test');
			expect(entityCampaign.type).toBe('campaign');
			expect(entityCampaign.name).toBe('Convert Test');
			expect(entityCampaign.description).toBe('Testing conversion');
			expect(entityCampaign.fields.system).toBe('Pathfinder 2e');
			expect(entityCampaign.fields.setting).toBe('Golarion');
			expect(entityCampaign.fields.status).toBe('active');
		});

		it('should convert campaign metadata to entity metadata format', () => {
			const oldCampaign: Campaign = {
				id: 'metadata-test',
				name: 'Metadata Test',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [
					{
						type: 'starship',
						label: 'Starship',
						labelPlural: 'Starships',
						icon: 'rocket',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					}
				],
				entityTypeOverrides: [
					{
						type: 'npc',
						hiddenFields: ['secrets']
					}
				],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'dark',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const entityCampaign = convertOldCampaignToEntity(oldCampaign);

			const metadata = entityCampaign.metadata as any;
			expect(metadata.customEntityTypes).toHaveLength(1);
			expect(metadata.customEntityTypes[0].type).toBe('starship');
			expect(metadata.entityTypeOverrides).toHaveLength(1);
			expect(metadata.settings.theme).toBe('dark');
		});

		it('should generate new ID if old campaign has no ID', () => {
			const oldCampaign: Campaign = {
				id: '',
				name: 'No ID',
				description: '',
				system: 'System Agnostic',
				setting: '',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const entityCampaign = convertOldCampaignToEntity(oldCampaign);

			expect(entityCampaign.id).toBeTruthy();
			expect(entityCampaign.id.length).toBeGreaterThan(0);
		});

		it('should handle missing optional fields with defaults', () => {
			const oldCampaign: Partial<Campaign> = {
				id: 'defaults-test',
				name: 'Defaults Test',
				// Missing most fields
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const entityCampaign = convertOldCampaignToEntity(oldCampaign as Campaign);

			expect(entityCampaign.description).toBe('');
			expect(entityCampaign.fields.system).toBe('System Agnostic');
			expect(entityCampaign.fields.setting).toBe('');
			expect(entityCampaign.fields.status).toBe('active');
		});
	});

	describe('Backward Compatibility - Backup Import', () => {
		it('should handle backup with old campaign property', () => {
			// Simulating a backup with old Campaign format
			const oldCampaign: Campaign = {
				id: 'backup-campaign',
				name: 'Backup Campaign',
				description: 'From old backup',
				system: 'D&D 5e',
				setting: 'Custom',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: [], enabledEntityTypes: [],
					theme: 'light',
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Convert to entity format (as would happen during import)
			const entityCampaign = convertOldCampaignToEntity(oldCampaign);

			expect(entityCampaign.type).toBe('campaign');
			expect(entityCampaign.name).toBe('Backup Campaign');
		});

		it('should handle backup with campaign as entity already', async () => {
			// Simulating a backup that already has campaign as entity
			const campaignEntity = {
				id: 'entity-backup',
				type: 'campaign',
				name: 'Already Entity Campaign',
				description: 'Already in entity format',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: 'Draw Steel',
					setting: 'Timescape',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {
					customEntityTypes: [],
					entityTypeOverrides: [],
					settings: {
						customRelationships: [], enabledEntityTypes: [],
						theme: 'light',
					}
				}
			};

			// Import directly to entities table
			await db.entities.add(campaignEntity);

			const imported = await db.entities.get('entity-backup');
			expect(imported).toBeDefined();
			expect(imported?.type).toBe('campaign');
			expect(imported?.name).toBe('Already Entity Campaign');
		});
	});
});
