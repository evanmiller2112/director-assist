import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { campaignStore } from './campaign.svelte';
import { db } from '$lib/db';
import type { BaseEntity } from '$lib/types';
import { appConfigRepository } from '$lib/db/repositories';

/**
 * Tests for Campaign Store - Issue #46: Refactor Campaign to first-class Entity type
 *
 * These tests verify that Campaign works as a first-class entity type:
 * - Campaign store manages multiple campaigns
 * - Active campaign switching works correctly
 * - Last campaign deletion is prevented
 * - Campaign entities have correct structure
 *
 * RED PHASE: These tests are written to FAIL initially as the full functionality
 * doesn't exist yet. They define the expected behavior.
 */

describe('Campaign Store - Issue #46', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear database before each test
		await db.entities.clear();
		await db.appConfig.clear();
		// Reset campaign store to initial state for test isolation
		campaignStore.reset();
	});

	afterEach(async () => {
		// Clean up
		await db.entities.clear();
		await db.appConfig.clear();
	});

	describe('Campaign Store - Multiple Campaigns', () => {
		it('should load all campaigns from the database', async () => {
			// Create multiple campaign entities
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'My First Campaign',
				description: 'A heroic adventure',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: 'D&D 5e',
					setting: 'Forgotten Realms',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'My Second Campaign',
				description: 'A darker tale',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: 'Call of Cthulhu',
					setting: 'Arkham',
					status: 'paused'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await appConfigRepository.setActiveCampaignId('campaign-1');

			// Load campaigns
			await campaignStore.load();

			// Should have loaded both campaigns
			expect(campaignStore.allCampaigns).toHaveLength(2);
			expect(campaignStore.allCampaigns.find(c => c.id === 'campaign-1')).toBeDefined();
			expect(campaignStore.allCampaigns.find(c => c.id === 'campaign-2')).toBeDefined();
		});

		it('should set the first campaign as active if no active campaign is configured', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'My Campaign',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					system: 'System Agnostic',
					setting: '',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);

			// Load campaigns without setting active campaign
			await campaignStore.load();

			// Should auto-select first campaign
			expect(campaignStore.activeCampaignId).toBe('campaign-1');
			expect(campaignStore.campaign?.id).toBe('campaign-1');
		});

		it('should create a default campaign if none exist', async () => {
			// Load campaigns with empty database
			await campaignStore.load();

			// Should have created a default campaign
			expect(campaignStore.allCampaigns).toHaveLength(1);
			expect(campaignStore.campaign).toBeDefined();
			expect(campaignStore.campaign?.name).toBe('My Campaign');
			expect(campaignStore.campaign?.type).toBe('campaign');
		});

		it('should track isLoading state during load', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'My Campaign',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'System Agnostic', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);

			// Check loading state
			expect(campaignStore.isLoading).toBe(true);

			await campaignStore.load();

			// Should no longer be loading
			expect(campaignStore.isLoading).toBe(false);
		});
	});

	describe('Campaign Store - Active Campaign Management', () => {
		it('should switch active campaign', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'D&D 5e', setting: 'Faerun', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: 'Golarion', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await appConfigRepository.setActiveCampaignId('campaign-1');

			await campaignStore.load();

			// Initially active campaign should be campaign-1
			expect(campaignStore.activeCampaignId).toBe('campaign-1');
			expect(campaignStore.campaign?.name).toBe('Campaign One');

			// Switch to campaign-2
			await campaignStore.setActiveCampaign('campaign-2');

			// Should have switched
			expect(campaignStore.activeCampaignId).toBe('campaign-2');
			expect(campaignStore.campaign?.name).toBe('Campaign Two');

			// Should persist to database
			const storedActiveId = await appConfigRepository.getActiveCampaignId();
			expect(storedActiveId).toBe('campaign-2');
		});

		it('should throw error when setting non-existent campaign as active', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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
			await campaignStore.load();

			// Try to set non-existent campaign as active
			await expect(campaignStore.setActiveCampaign('non-existent-id')).rejects.toThrow(
				'Campaign non-existent-id not found'
			);
		});

		it('should get active campaign from allCampaigns when loading', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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
			await appConfigRepository.setActiveCampaignId('campaign-1');

			await campaignStore.load();

			// Active campaign should be loaded from allCampaigns
			expect(campaignStore.campaign).toBeDefined();
			expect(campaignStore.campaign?.id).toBe('campaign-1');
			expect(campaignStore.allCampaigns.find(c => c.id === 'campaign-1')).toBe(
				campaignStore.campaign
			);
		});
	});

	describe('Campaign Store - Campaign Creation', () => {
		it('should create a new campaign entity', async () => {
			await campaignStore.load();

			const newCampaign = await campaignStore.create('My New Campaign', {
				description: 'An epic adventure',
				system: 'Draw Steel',
				setting: 'Custom World'
			});

			expect(newCampaign).toBeDefined();
			expect(newCampaign.id).toBeDefined();
			expect(newCampaign.type).toBe('campaign');
			expect(newCampaign.name).toBe('My New Campaign');
			expect(newCampaign.description).toBe('An epic adventure');
			expect(newCampaign.fields.system).toBe('Draw Steel');
			expect(newCampaign.fields.setting).toBe('Custom World');
			expect(newCampaign.fields.status).toBe('active');
		});

		it('should add created campaign to allCampaigns', async () => {
			await campaignStore.load();

			const initialCount = campaignStore.allCampaigns.length;
			const newCampaign = await campaignStore.create('Another Campaign');

			expect(campaignStore.allCampaigns).toHaveLength(initialCount + 1);
			expect(campaignStore.allCampaigns.find(c => c.id === newCampaign.id)).toBeDefined();
		});

		it('should set first campaign as active automatically', async () => {
			// Clear database to ensure no campaigns exist
			await db.entities.clear();
			await appConfigRepository.clear();

			const newCampaign = await campaignStore.create('First Campaign');

			// Should be set as active since it's the first one
			expect(campaignStore.activeCampaignId).toBe(newCampaign.id);
			expect(campaignStore.campaign?.id).toBe(newCampaign.id);
		});

		it('should not auto-activate second campaign', async () => {
			await campaignStore.load();

			const firstCampaign = campaignStore.campaign;
			const firstId = firstCampaign?.id;

			const secondCampaign = await campaignStore.create('Second Campaign');

			// Should still have first campaign active
			expect(campaignStore.activeCampaignId).toBe(firstId);
			expect(campaignStore.campaign?.id).toBe(firstId);
			expect(campaignStore.campaign?.id).not.toBe(secondCampaign.id);
		});
	});

	describe('Campaign Store - Campaign Deletion with Guard', () => {
		it('should prevent deletion of the last campaign', async () => {
			// Create a single campaign
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Only Campaign',
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
			await campaignStore.load();

			// Should have exactly one campaign
			expect(campaignStore.allCampaigns).toHaveLength(1);

			// Attempt to delete the last campaign should throw error
			await expect(campaignStore.deleteCampaign('campaign-1')).rejects.toThrow(
				'Cannot delete the last campaign'
			);

			// Campaign should still exist
			expect(campaignStore.allCampaigns).toHaveLength(1);
			expect(campaignStore.campaign?.id).toBe('campaign-1');
		});

		it('should allow deletion when multiple campaigns exist', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await campaignStore.load();

			// Should have two campaigns
			expect(campaignStore.allCampaigns).toHaveLength(2);

			// Delete campaign-2
			await campaignStore.deleteCampaign('campaign-2');

			// Should have one campaign left
			expect(campaignStore.allCampaigns).toHaveLength(1);
			expect(campaignStore.allCampaigns.find(c => c.id === 'campaign-2')).toBeUndefined();
		});

		it('should switch to another campaign when deleting active campaign', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await appConfigRepository.setActiveCampaignId('campaign-1');
			await campaignStore.load();

			// Campaign-1 should be active
			expect(campaignStore.activeCampaignId).toBe('campaign-1');

			// Delete active campaign
			await campaignStore.deleteCampaign('campaign-1');

			// Should have switched to campaign-2
			expect(campaignStore.activeCampaignId).toBe('campaign-2');
			expect(campaignStore.campaign?.id).toBe('campaign-2');
		});

		it('should not switch campaigns when deleting non-active campaign', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await appConfigRepository.setActiveCampaignId('campaign-1');
			await campaignStore.load();

			// Campaign-1 should be active
			expect(campaignStore.activeCampaignId).toBe('campaign-1');

			// Delete non-active campaign
			await campaignStore.deleteCampaign('campaign-2');

			// Should still have campaign-1 active
			expect(campaignStore.activeCampaignId).toBe('campaign-1');
			expect(campaignStore.campaign?.id).toBe('campaign-1');
		});

		it('should remove campaign from database when deleted', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await campaignStore.load();

			// Delete campaign-2
			await campaignStore.deleteCampaign('campaign-2');

			// Should be removed from database
			const dbCampaign = await db.entities.get('campaign-2');
			expect(dbCampaign).toBeUndefined();
		});
	});

	describe('Campaign Store - Update Operations', () => {
		it('should update campaign basic fields', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Old Name',
				description: 'Old description',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'D&D 5e', setting: 'Faerun', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await appConfigRepository.setActiveCampaignId('campaign-1');
			await campaignStore.load();

			// Update campaign
			await campaignStore.update({
				name: 'New Name',
				description: 'New description',
				system: 'Pathfinder 2e',
				setting: 'Golarion'
			});

			// Should update local state
			expect(campaignStore.campaign?.name).toBe('New Name');
			expect(campaignStore.campaign?.description).toBe('New description');
			expect(campaignStore.campaign?.fields.system).toBe('Pathfinder 2e');
			expect(campaignStore.campaign?.fields.setting).toBe('Golarion');

			// Should update in allCampaigns
			const campaignInList = campaignStore.allCampaigns.find(c => c.id === 'campaign-1');
			expect(campaignInList?.name).toBe('New Name');

			// Should persist to database
			const dbCampaign = await db.entities.get('campaign-1');
			expect(dbCampaign?.name).toBe('New Name');
			expect(dbCampaign?.fields.system).toBe('Pathfinder 2e');
		});

		it('should update updatedAt timestamp when updating', async () => {
			const oldDate = new Date('2024-01-01');
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'D&D 5e', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: oldDate,
				updatedAt: oldDate,
				metadata: {}
			};

			await db.entities.add(campaign1);
			await appConfigRepository.setActiveCampaignId('campaign-1');
			await campaignStore.load();

			const beforeUpdate = campaignStore.campaign?.updatedAt;

			// Wait a bit to ensure timestamp changes
			await new Promise(resolve => setTimeout(resolve, 10));

			await campaignStore.update({ name: 'Updated Campaign' });

			// updatedAt should have changed
			expect(campaignStore.campaign?.updatedAt).not.toEqual(beforeUpdate);
			expect(campaignStore.campaign?.updatedAt.getTime()).toBeGreaterThan(
				beforeUpdate!.getTime()
			);
		});
	});

	describe('Campaign Store - Reload Functionality', () => {
		it('should reload campaigns from database', async () => {
			const campaign1: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign One',
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
			await campaignStore.load();

			expect(campaignStore.allCampaigns).toHaveLength(1);

			// Add another campaign directly to database
			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign Two',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Pathfinder', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaign2);

			// Reload campaigns
			await campaignStore.reload();

			// Should have reloaded and found both campaigns
			expect(campaignStore.allCampaigns).toHaveLength(2);
		});
	});

	describe('Campaign Store - Error Handling', () => {
		it('should set error state when load fails', async () => {
			// Mock db.entities.where to throw an error
			const originalWhere = db.entities.where;
			db.entities.where = vi.fn(() => {
				throw new Error('Database error');
			}) as any;

			await campaignStore.load();

			// Should have error
			expect(campaignStore.error).toBeDefined();
			expect(campaignStore.error).toContain('Failed to load campaigns');
			expect(campaignStore.isLoading).toBe(false);

			// Restore original method
			db.entities.where = originalWhere;
		});

		it('should clear error on successful load', async () => {
			// First, cause an error
			const originalWhere = db.entities.where;
			db.entities.where = vi.fn(() => {
				throw new Error('Database error');
			}) as any;

			await campaignStore.load();
			expect(campaignStore.error).toBeDefined();

			// Restore and load successfully
			db.entities.where = originalWhere;
			await campaignStore.load();

			// Error should be cleared
			expect(campaignStore.error).toBeNull();
		});
	});
});
