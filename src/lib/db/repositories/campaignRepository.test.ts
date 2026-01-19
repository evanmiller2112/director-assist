/**
 * Tests for Campaign Repository
 *
 * This repository manages the campaign stored in IndexedDB. There is only
 * one active campaign at a time in the application.
 *
 * Covers:
 * - Live query observables (getCurrent)
 * - Synchronous retrieval (getCurrentSync)
 * - Campaign creation and updates (save)
 * - Settings management (updateSettings)
 * - Bulk operations (clear)
 * - Timestamp management (createdAt, updatedAt)
 * - ID preservation during updates
 * - Edge cases (empty state, partial updates, settings merging)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { campaignRepository } from './campaignRepository';
import { db } from '../index';
import type { Campaign } from '$lib/types';
import { DEFAULT_CAMPAIGN_SETTINGS } from '$lib/types';

describe('CampaignRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear campaign table before each test
		await db.campaign.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.campaign.clear();
	});

	describe('getCurrent', () => {
		it('should return observable', () => {
			const observable = campaignRepository.getCurrent();

			expect(observable).toBeDefined();
			expect(typeof observable.subscribe).toBe('function');
		});

		it('should return undefined when no campaign exists', async () => {
			return new Promise<void>((resolve) => {
				const observable = campaignRepository.getCurrent();

				const subscription = observable.subscribe((campaign) => {
					expect(campaign).toBeUndefined();
					subscription.unsubscribe();
					resolve();
				});
			});
		});

		it('should return the first campaign when one exists', async () => {
			const savedCampaign = await campaignRepository.save({
				name: 'Test Campaign'
			});

			return new Promise<void>((resolve) => {
				const observable = campaignRepository.getCurrent();

				const subscription = observable.subscribe((campaign) => {
					if (campaign) {
						expect(campaign).toBeDefined();
						expect(campaign.id).toBe(savedCampaign.id);
						expect(campaign.name).toBe('Test Campaign');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should return campaign with all properties intact', async () => {
			const savedCampaign = await campaignRepository.save({
				name: 'Detailed Campaign',
				description: 'A test campaign',
				system: 'D&D 5e',
				setting: 'Forgotten Realms',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			});

			return new Promise<void>((resolve) => {
				const observable = campaignRepository.getCurrent();

				const subscription = observable.subscribe((campaign) => {
					if (campaign) {
						expect(campaign.name).toBe('Detailed Campaign');
						expect(campaign.description).toBe('A test campaign');
						expect(campaign.system).toBe('D&D 5e');
						expect(campaign.setting).toBe('Forgotten Realms');
						expect(campaign.customEntityTypes).toEqual([]);
						expect(campaign.entityTypeOverrides).toEqual([]);
						expect(campaign.settings).toEqual(DEFAULT_CAMPAIGN_SETTINGS);
						expect(campaign.createdAt).toBeInstanceOf(Date);
						expect(campaign.updatedAt).toBeInstanceOf(Date);
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should return updated results when campaign is created', async () => {
			const observable = campaignRepository.getCurrent();
			const results: (Campaign | undefined)[] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((campaign) => {
					results.push(campaign);

					if (results.length === 1) {
						// First emission: undefined (no campaign)
						expect(campaign).toBeUndefined();
						// Create a campaign
						campaignRepository.save({ name: 'New Campaign' });
					} else if (results.length === 2) {
						// Second emission: after creating campaign
						expect(campaign).toBeDefined();
						expect(campaign?.name).toBe('New Campaign');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should return updated results when campaign is modified', async () => {
			await campaignRepository.save({ name: 'Original Name' });

			const observable = campaignRepository.getCurrent();
			const results: (Campaign | undefined)[] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((campaign) => {
					results.push(campaign);

					if (results.length === 1) {
						// First emission: original campaign
						expect(campaign?.name).toBe('Original Name');
						// Update the campaign
						campaignRepository.save({ name: 'Updated Name' });
					} else if (results.length === 2) {
						// Second emission: after update
						expect(campaign?.name).toBe('Updated Name');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should return first campaign when multiple exist', async () => {
			// Create multiple campaigns (edge case, should not happen in normal use)
			const campaign1: Campaign = {
				id: 'campaign-1',
				name: 'First Campaign',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date('2024-01-01T10:00:00Z'),
				updatedAt: new Date('2024-01-01T10:00:00Z'),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			const campaign2: Campaign = {
				id: 'campaign-2',
				name: 'Second Campaign',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date('2024-01-01T11:00:00Z'),
				updatedAt: new Date('2024-01-01T11:00:00Z'),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			await db.campaign.bulkAdd([campaign1, campaign2]);

			return new Promise<void>((resolve) => {
				const observable = campaignRepository.getCurrent();

				const subscription = observable.subscribe((campaign) => {
					if (campaign) {
						// Should return the first one in the array
						expect(campaign.id).toBe('campaign-1');
						expect(campaign.name).toBe('First Campaign');
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});
	});

	describe('getCurrentSync', () => {
		it('should return undefined when no campaign exists', async () => {
			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign).toBeUndefined();
		});

		it('should return the first campaign when one exists', async () => {
			const savedCampaign = await campaignRepository.save({
				name: 'Sync Test Campaign'
			});

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign).toBeDefined();
			expect(campaign?.id).toBe(savedCampaign.id);
			expect(campaign?.name).toBe('Sync Test Campaign');
		});

		it('should return campaign synchronously with all properties', async () => {
			await campaignRepository.save({
				name: 'Full Campaign',
				description: 'Test description',
				system: 'Draw Steel',
				setting: 'Timescape',
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: {
					customRelationships: ['ally', 'enemy'],
					enabledEntityTypes: ['character', 'npc'],
					theme: 'dark'
				}
			});

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign).toBeDefined();
			expect(campaign?.name).toBe('Full Campaign');
			expect(campaign?.description).toBe('Test description');
			expect(campaign?.system).toBe('Draw Steel');
			expect(campaign?.setting).toBe('Timescape');
			expect(campaign?.settings.customRelationships).toEqual(['ally', 'enemy']);
			expect(campaign?.settings.enabledEntityTypes).toEqual(['character', 'npc']);
			expect(campaign?.settings.theme).toBe('dark');
		});

		it('should return first campaign when multiple exist', async () => {
			// Create multiple campaigns (edge case)
			const campaign1: Campaign = {
				id: 'campaign-1',
				name: 'First',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			const campaign2: Campaign = {
				id: 'campaign-2',
				name: 'Second',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			await db.campaign.bulkAdd([campaign1, campaign2]);

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign?.id).toBe('campaign-1');
			expect(campaign?.name).toBe('First');
		});

		it('should return latest state after updates', async () => {
			await campaignRepository.save({ name: 'Original' });

			let campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('Original');

			await campaignRepository.save({ name: 'Updated' });

			campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('Updated');
		});

		it('should handle unicode in campaign name', async () => {
			await campaignRepository.save({
				name: 'Campaign 世界 🐉 ñ ü é'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('Campaign 世界 🐉 ñ ü é');
		});

		it('should preserve Date objects', async () => {
			const before = new Date();
			await campaignRepository.save({ name: 'Date Test' });
			const after = new Date();

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign?.createdAt).toBeInstanceOf(Date);
			expect(campaign?.updatedAt).toBeInstanceOf(Date);
			expect(campaign?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(campaign?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('save', () => {
		it('should create new campaign when none exists', async () => {
			const campaign = await campaignRepository.save({
				name: 'New Campaign'
			});

			expect(campaign).toBeDefined();
			expect(campaign.id).toBeDefined();
			expect(campaign.id.length).toBeGreaterThan(0);
			expect(campaign.name).toBe('New Campaign');
			expect(campaign.createdAt).toBeInstanceOf(Date);
			expect(campaign.updatedAt).toBeInstanceOf(Date);
		});

		it('should update existing campaign when one exists', async () => {
			const created = await campaignRepository.save({
				name: 'Original Campaign'
			});

			const originalId = created.id;

			const updated = await campaignRepository.save({
				name: 'Updated Campaign'
			});

			expect(updated.id).toBe(originalId);
			expect(updated.name).toBe('Updated Campaign');

			// Verify only one campaign exists
			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should set createdAt timestamp on new campaign', async () => {
			const before = new Date();
			const campaign = await campaignRepository.save({
				name: 'Timestamp Test'
			});
			const after = new Date();

			expect(campaign.createdAt).toBeInstanceOf(Date);
			expect(campaign.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(campaign.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should set updatedAt timestamp on save', async () => {
			const before = new Date();
			const campaign = await campaignRepository.save({
				name: 'Update Timestamp Test'
			});
			const after = new Date();

			expect(campaign.updatedAt).toBeInstanceOf(Date);
			expect(campaign.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(campaign.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should update updatedAt when updating existing campaign', async () => {
			const created = await campaignRepository.save({
				name: 'Original'
			});

			const originalCreatedAt = created.createdAt;
			const originalUpdatedAt = created.updatedAt;

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			const updated = await campaignRepository.save({
				name: 'Updated'
			});

			expect(updated.createdAt.getTime()).toBe(originalCreatedAt.getTime());
			expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
		});

		it('should preserve id when updating', async () => {
			const created = await campaignRepository.save({
				name: 'First Version'
			});

			const id1 = created.id;

			const updated1 = await campaignRepository.save({
				name: 'Second Version'
			});

			const updated2 = await campaignRepository.save({
				name: 'Third Version'
			});

			expect(updated1.id).toBe(id1);
			expect(updated2.id).toBe(id1);

			// Verify still only one campaign
			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should merge partial updates with existing campaign', async () => {
			await campaignRepository.save({
				name: 'Original',
				description: 'Original description',
				system: 'D&D 5e',
				setting: 'Forgotten Realms'
			});

			const updated = await campaignRepository.save({
				name: 'Updated Name'
			});

			expect(updated.name).toBe('Updated Name');
			expect(updated.description).toBe('Original description');
			expect(updated.system).toBe('D&D 5e');
			expect(updated.setting).toBe('Forgotten Realms');
		});

		it('should handle all campaign properties', async () => {
			const campaign = await campaignRepository.save({
				name: 'Complete Campaign',
				description: 'A fully detailed campaign',
				system: 'Draw Steel',
				setting: 'Timescape',
				customEntityTypes: [
					{
						id: 'custom-type-1',
						name: 'Custom Type',
						category: 'custom',
						fields: []
					}
				],
				entityTypeOverrides: [
					{
						entityType: 'npc',
						fields: []
					}
				],
				settings: {
					customRelationships: ['mentor', 'rival'],
					enabledEntityTypes: ['character', 'npc', 'location'],
					theme: 'dark'
				}
			});

			expect(campaign.name).toBe('Complete Campaign');
			expect(campaign.description).toBe('A fully detailed campaign');
			expect(campaign.system).toBe('Draw Steel');
			expect(campaign.setting).toBe('Timescape');
			expect(campaign.customEntityTypes).toHaveLength(1);
			expect(campaign.customEntityTypes[0].name).toBe('Custom Type');
			expect(campaign.entityTypeOverrides).toHaveLength(1);
			expect(campaign.entityTypeOverrides[0].entityType).toBe('npc');
			expect(campaign.settings.customRelationships).toEqual(['mentor', 'rival']);
			expect(campaign.settings.enabledEntityTypes).toEqual(['character', 'npc', 'location']);
			expect(campaign.settings.theme).toBe('dark');
		});

		it('should apply default settings when not provided', async () => {
			const campaign = await campaignRepository.save({
				name: 'Minimal Campaign'
			});

			expect(campaign.settings).toBeDefined();
			expect(campaign.settings.customRelationships).toEqual(
				DEFAULT_CAMPAIGN_SETTINGS.customRelationships
			);
			expect(campaign.settings.enabledEntityTypes).toEqual(
				DEFAULT_CAMPAIGN_SETTINGS.enabledEntityTypes
			);
			expect(campaign.settings.theme).toBe(DEFAULT_CAMPAIGN_SETTINGS.theme);
		});

		it('should handle empty string values', async () => {
			const campaign = await campaignRepository.save({
				name: 'Empty Fields',
				description: '',
				system: '',
				setting: ''
			});

			expect(campaign.name).toBe('Empty Fields');
			expect(campaign.description).toBe('');
			expect(campaign.system).toBe('');
			expect(campaign.setting).toBe('');
		});

		it('should handle unicode characters', async () => {
			const campaign = await campaignRepository.save({
				name: 'Campaign 世界',
				description: 'Description with ñ ü é',
				system: 'D&D 5e 🐉',
				setting: 'Forgotten Realms'
			});

			expect(campaign.name).toBe('Campaign 世界');
			expect(campaign.description).toBe('Description with ñ ü é');
			expect(campaign.system).toBe('D&D 5e 🐉');
		});

		it('should handle very long text fields', async () => {
			const longDescription = 'A'.repeat(10000);

			const campaign = await campaignRepository.save({
				name: 'Long Description Campaign',
				description: longDescription
			});

			expect(campaign.description).toBe(longDescription);
			expect(campaign.description.length).toBe(10000);
		});

		it('should handle markdown in description', async () => {
			const markdownDescription =
				'# Campaign Overview\n\n**Bold** and *italic*\n\n- List item 1\n- List item 2';

			const campaign = await campaignRepository.save({
				name: 'Markdown Campaign',
				description: markdownDescription
			});

			expect(campaign.description).toBe(markdownDescription);
		});

		it('should handle empty customEntityTypes array', async () => {
			const campaign = await campaignRepository.save({
				name: 'No Custom Types',
				customEntityTypes: []
			});

			expect(campaign.customEntityTypes).toEqual([]);
		});

		it('should handle empty entityTypeOverrides array', async () => {
			const campaign = await campaignRepository.save({
				name: 'No Overrides',
				entityTypeOverrides: []
			});

			expect(campaign.entityTypeOverrides).toEqual([]);
		});

		it('should persist to database', async () => {
			const campaign = await campaignRepository.save({
				name: 'Persisted Campaign'
			});

			const stored = await db.campaign.get(campaign.id);
			expect(stored).toBeDefined();
			expect(stored?.name).toBe('Persisted Campaign');
		});

		it('should generate unique IDs for different campaigns', async () => {
			const campaign1 = await campaignRepository.save({
				name: 'Campaign 1'
			});

			await campaignRepository.clear();

			const campaign2 = await campaignRepository.save({
				name: 'Campaign 2'
			});

			expect(campaign1.id).not.toBe(campaign2.id);
		});
	});

	describe('updateSettings', () => {
		it('should update campaign settings', async () => {
			await campaignRepository.save({
				name: 'Settings Test',
				settings: {
					customRelationships: [],
					enabledEntityTypes: ['character'],
					theme: 'light'
				}
			});

			await campaignRepository.updateSettings({
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign?.settings.theme).toBe('dark');
			expect(campaign?.settings.customRelationships).toEqual([]);
			expect(campaign?.settings.enabledEntityTypes).toEqual(['character']);
		});

		it('should merge settings with existing values', async () => {
			await campaignRepository.save({
				name: 'Merge Test',
				settings: {
					customRelationships: ['ally', 'enemy'],
					enabledEntityTypes: ['character', 'npc'],
					theme: 'light'
				}
			});

			await campaignRepository.updateSettings({
				customRelationships: ['mentor', 'rival']
			});

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign?.settings.customRelationships).toEqual(['mentor', 'rival']);
			expect(campaign?.settings.enabledEntityTypes).toEqual(['character', 'npc']);
			expect(campaign?.settings.theme).toBe('light');
		});

		it('should update updatedAt timestamp', async () => {
			const created = await campaignRepository.save({
				name: 'Timestamp Test'
			});

			const originalUpdatedAt = created.updatedAt;

			// Wait to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10));

			await campaignRepository.updateSettings({
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();

			expect(campaign?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
		});

		it('should do nothing when no campaign exists', async () => {
			await campaignRepository.updateSettings({
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign).toBeUndefined();
		});

		it('should handle updating customRelationships', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				customRelationships: ['mentor', 'student', 'rival']
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual(['mentor', 'student', 'rival']);
		});

		it('should handle updating enabledEntityTypes', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				enabledEntityTypes: ['character', 'npc', 'faction']
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.enabledEntityTypes).toEqual(['character', 'npc', 'faction']);
		});

		it('should handle updating theme to light', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				theme: 'light'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.theme).toBe('light');
		});

		it('should handle updating theme to dark', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.theme).toBe('dark');
		});

		it('should handle updating theme to system', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				theme: 'system'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.theme).toBe('system');
		});

		it('should handle updating multiple settings at once', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				customRelationships: ['friend', 'foe'],
				enabledEntityTypes: ['character', 'location'],
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual(['friend', 'foe']);
			expect(campaign?.settings.enabledEntityTypes).toEqual(['character', 'location']);
			expect(campaign?.settings.theme).toBe('dark');
		});

		it('should handle empty customRelationships array', async () => {
			await campaignRepository.save({
				name: 'Test',
				settings: {
					customRelationships: ['ally', 'enemy'],
					enabledEntityTypes: ['character'],
					theme: 'light'
				}
			});

			await campaignRepository.updateSettings({
				customRelationships: []
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual([]);
		});

		it('should handle empty enabledEntityTypes array', async () => {
			await campaignRepository.save({
				name: 'Test',
				settings: {
					customRelationships: [],
					enabledEntityTypes: ['character', 'npc'],
					theme: 'light'
				}
			});

			await campaignRepository.updateSettings({
				enabledEntityTypes: []
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.enabledEntityTypes).toEqual([]);
		});

		it('should preserve other campaign properties', async () => {
			await campaignRepository.save({
				name: 'Original Name',
				description: 'Original Description',
				system: 'D&D 5e',
				setting: 'Forgotten Realms'
			});

			await campaignRepository.updateSettings({
				theme: 'dark'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('Original Name');
			expect(campaign?.description).toBe('Original Description');
			expect(campaign?.system).toBe('D&D 5e');
			expect(campaign?.setting).toBe('Forgotten Realms');
		});

		it('should handle rapid successive updates', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({ theme: 'light' });
			await campaignRepository.updateSettings({ theme: 'dark' });
			await campaignRepository.updateSettings({ theme: 'system' });

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.theme).toBe('system');
		});

		it('should handle special characters in customRelationships', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				customRelationships: ['ally-in-arms', 'mentor_student', 'friend:close']
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual([
				'ally-in-arms',
				'mentor_student',
				'friend:close'
			]);
		});

		it('should handle unicode in customRelationships', async () => {
			await campaignRepository.save({ name: 'Test' });

			await campaignRepository.updateSettings({
				customRelationships: ['amigo', 'amié', 'друг']
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual(['amigo', 'amié', 'друг']);
		});
	});

	describe('clear', () => {
		it('should remove all campaigns', async () => {
			await campaignRepository.save({
				name: 'Campaign 1'
			});

			await campaignRepository.clear();

			const count = await db.campaign.count();
			expect(count).toBe(0);
		});

		it('should remove campaign completely', async () => {
			const campaign = await campaignRepository.save({
				name: 'To Be Cleared'
			});

			await campaignRepository.clear();

			const retrieved = await db.campaign.get(campaign.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not throw error when clearing empty table', async () => {
			await expect(campaignRepository.clear()).resolves.not.toThrow();
		});

		it('should allow creating new campaign after clearing', async () => {
			await campaignRepository.save({ name: 'First' });
			await campaignRepository.clear();
			const newCampaign = await campaignRepository.save({ name: 'Second' });

			expect(newCampaign.name).toBe('Second');

			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should not affect other database tables', async () => {
			await campaignRepository.save({ name: 'Test Campaign' });
			await campaignRepository.clear();

			// Verify campaign cleared
			const campaignCount = await db.campaign.count();
			expect(campaignCount).toBe(0);

			// Verify other tables still accessible
			expect(db.entities).toBeDefined();
			expect(db.chatMessages).toBeDefined();
			expect(db.appConfig).toBeDefined();
		});

		it('should clear multiple campaigns if they exist', async () => {
			// Edge case: multiple campaigns (shouldn't happen in normal use)
			const campaign1: Campaign = {
				id: 'campaign-1',
				name: 'First',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			const campaign2: Campaign = {
				id: 'campaign-2',
				name: 'Second',
				description: '',
				system: 'System Agnostic',
				setting: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				customEntityTypes: [],
				entityTypeOverrides: [],
				settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
			};

			await db.campaign.bulkAdd([campaign1, campaign2]);

			let count = await db.campaign.count();
			expect(count).toBe(2);

			await campaignRepository.clear();

			count = await db.campaign.count();
			expect(count).toBe(0);
		});

		it('should trigger observable updates after clearing', async () => {
			await campaignRepository.save({ name: 'Test Campaign' });

			const observable = campaignRepository.getCurrent();
			const results: (Campaign | undefined)[] = [];

			return new Promise<void>((resolve) => {
				const subscription = observable.subscribe((campaign) => {
					results.push(campaign);

					if (results.length === 1) {
						// First emission: campaign exists
						expect(campaign).toBeDefined();
						expect(campaign?.name).toBe('Test Campaign');
						// Clear campaigns
						campaignRepository.clear();
					} else if (results.length === 2) {
						// Second emission: after clearing
						expect(campaign).toBeUndefined();
						subscription.unsubscribe();
						resolve();
					}
				});
			});
		});

		it('should be idempotent - multiple clears should not error', async () => {
			await campaignRepository.save({ name: 'Test' });
			await campaignRepository.clear();
			await campaignRepository.clear();
			await campaignRepository.clear();

			const count = await db.campaign.count();
			expect(count).toBe(0);
		});
	});

	describe('Edge Cases and Integration', () => {
		it('should handle rapid successive saves', async () => {
			await campaignRepository.save({ name: 'Version 1' });
			await campaignRepository.save({ name: 'Version 2' });
			await campaignRepository.save({ name: 'Version 3' });

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('Version 3');

			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should handle save after clear', async () => {
			await campaignRepository.save({ name: 'Before Clear' });
			await campaignRepository.clear();
			await campaignRepository.save({ name: 'After Clear' });

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.name).toBe('After Clear');

			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should handle updateSettings after clear', async () => {
			await campaignRepository.save({ name: 'Test' });
			await campaignRepository.clear();

			// Should do nothing without error
			await campaignRepository.updateSettings({ theme: 'dark' });

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign).toBeUndefined();
		});

		it('should handle mixed operations sequence', async () => {
			// Create
			const created = await campaignRepository.save({ name: 'Initial' });
			expect(created.name).toBe('Initial');

			// Update settings
			await campaignRepository.updateSettings({ theme: 'dark' });
			let current = await campaignRepository.getCurrentSync();
			expect(current?.settings.theme).toBe('dark');

			// Update campaign
			await campaignRepository.save({ name: 'Updated' });
			current = await campaignRepository.getCurrentSync();
			expect(current?.name).toBe('Updated');
			expect(current?.settings.theme).toBe('dark');

			// Update settings again
			await campaignRepository.updateSettings({ customRelationships: ['friend'] });
			current = await campaignRepository.getCurrentSync();
			expect(current?.settings.customRelationships).toEqual(['friend']);

			// Verify still only one campaign
			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should preserve complex nested settings through updates', async () => {
			await campaignRepository.save({
				name: 'Complex Settings',
				settings: {
					customRelationships: ['ally', 'enemy', 'neutral'],
					enabledEntityTypes: [
						'character',
						'npc',
						'location',
						'faction',
						'item',
						'encounter',
						'session'
					],
					theme: 'dark'
				}
			});

			await campaignRepository.save({
				name: 'Updated Name'
			});

			const campaign = await campaignRepository.getCurrentSync();
			expect(campaign?.settings.customRelationships).toEqual(['ally', 'enemy', 'neutral']);
			expect(campaign?.settings.enabledEntityTypes).toHaveLength(7);
			expect(campaign?.settings.theme).toBe('dark');
		});

		it('should handle campaign with maximum data', async () => {
			const maxCampaign = await campaignRepository.save({
				name: 'Maximum Campaign',
				description: 'A'.repeat(50000),
				system: 'Draw Steel Extended Edition',
				setting: 'Timescape and Beyond',
				customEntityTypes: Array.from({ length: 10 }, (_, i) => ({
					id: `custom-${i}`,
					name: `Custom Type ${i}`,
					category: 'custom',
					fields: []
				})),
				entityTypeOverrides: Array.from({ length: 5 }, (_, i) => ({
					entityType: `type-${i}`,
					fields: []
				})),
				settings: {
					customRelationships: Array.from({ length: 20 }, (_, i) => `relationship-${i}`),
					enabledEntityTypes: Array.from({ length: 15 }, (_, i) => `type-${i}`),
					theme: 'dark'
				}
			});

			expect(maxCampaign.description.length).toBe(50000);
			expect(maxCampaign.customEntityTypes).toHaveLength(10);
			expect(maxCampaign.entityTypeOverrides).toHaveLength(5);
			expect(maxCampaign.settings.customRelationships).toHaveLength(20);
			expect(maxCampaign.settings.enabledEntityTypes).toHaveLength(15);
		});

		it('should maintain referential integrity through full lifecycle', async () => {
			// Create
			const created = await campaignRepository.save({
				name: 'Lifecycle Test',
				description: 'Initial description'
			});
			const originalId = created.id;

			// Update multiple times
			await campaignRepository.save({ description: 'Updated description 1' });
			await campaignRepository.save({ description: 'Updated description 2' });
			await campaignRepository.updateSettings({ theme: 'dark' });
			await campaignRepository.save({ name: 'Updated Name' });

			// Verify
			const final = await campaignRepository.getCurrentSync();
			expect(final?.id).toBe(originalId);
			expect(final?.name).toBe('Updated Name');
			expect(final?.description).toBe('Updated description 2');
			expect(final?.settings.theme).toBe('dark');

			// Verify still only one campaign
			const count = await db.campaign.count();
			expect(count).toBe(1);
		});

		it('should handle concurrent observable subscriptions', async () => {
			await campaignRepository.save({ name: 'Observable Test' });

			const observable = campaignRepository.getCurrent();
			const results1: (Campaign | undefined)[] = [];
			const results2: (Campaign | undefined)[] = [];

			return new Promise<void>((resolve) => {
				let completedCount = 0;

				const subscription1 = observable.subscribe((campaign) => {
					results1.push(campaign);
					if (results1.length === 2) {
						expect(campaign?.name).toBe('Updated');
						subscription1.unsubscribe();
						completedCount++;
						if (completedCount === 2) resolve();
					} else {
						campaignRepository.save({ name: 'Updated' });
					}
				});

				const subscription2 = observable.subscribe((campaign) => {
					results2.push(campaign);
					if (results2.length === 2) {
						expect(campaign?.name).toBe('Updated');
						subscription2.unsubscribe();
						completedCount++;
						if (completedCount === 2) resolve();
					}
				});
			});
		});
	});
});
