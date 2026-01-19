import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { entityRepository } from './entityRepository';
import { db } from '../index';
import type { BaseEntity } from '$lib/types';

/**
 * Tests for Entity Repository - Campaign Deletion Guard - Issue #46
 *
 * These tests verify that the entity repository prevents deletion of the last campaign.
 * This is a safety measure to ensure users always have at least one campaign.
 *
 * RED PHASE: These tests will FAIL initially as the deletion guard logic doesn't exist yet.
 */

describe('Entity Repository - Campaign Deletion Guard - Issue #46', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();
	});

	afterEach(async () => {
		await db.entities.clear();
	});

	describe('Last Campaign Deletion Prevention', () => {
		it('should prevent deletion of the last campaign entity', async () => {
			// Create a single campaign
			const campaign: BaseEntity = {
				id: 'last-campaign',
				type: 'campaign',
				name: 'Last Campaign Standing',
				description: 'The only campaign',
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

			await db.entities.add(campaign);

			// Count campaigns before deletion attempt
			const campaignsBefore = await db.entities.where('type').equals('campaign').count();
			expect(campaignsBefore).toBe(1);

			// Attempt to delete the last campaign should throw error
			await expect(entityRepository.delete('last-campaign')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);

			// Campaign should still exist
			const campaignsAfter = await db.entities.where('type').equals('campaign').count();
			expect(campaignsAfter).toBe(1);

			const stillExists = await db.entities.get('last-campaign');
			expect(stillExists).toBeDefined();
		});

		it('should allow deletion of campaign when multiple campaigns exist', async () => {
			// Create two campaigns
			const campaign1: BaseEntity = {
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign 2',
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

			// Should allow deletion when multiple campaigns exist
			await entityRepository.delete('campaign-2');

			// Campaign-2 should be deleted
			const deleted = await db.entities.get('campaign-2');
			expect(deleted).toBeUndefined();

			// Campaign-1 should still exist
			const remaining = await db.entities.get('campaign-1');
			expect(remaining).toBeDefined();
		});

		it('should allow deletion of non-campaign entities freely', async () => {
			// Create a campaign and a character
			const campaign: BaseEntity = {
				id: 'some-campaign',
				type: 'campaign',
				name: 'A Campaign',
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

			const character: BaseEntity = {
				id: 'character-1',
				type: 'character',
				name: 'Aragorn',
				description: 'A ranger',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					playerName: 'John',
					concept: 'Ranger',
					status: 'active'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign);
			await db.entities.add(character);

			// Should allow deletion of character even though it's the only character
			await entityRepository.delete('character-1');

			const deletedCharacter = await db.entities.get('character-1');
			expect(deletedCharacter).toBeUndefined();

			// Campaign should still exist
			const campaignStillExists = await db.entities.get('some-campaign');
			expect(campaignStillExists).toBeDefined();
		});

		it('should prevent deletion of last campaign even with many other entities', async () => {
			// Create one campaign and multiple other entities
			const campaign: BaseEntity = {
				id: 'only-campaign',
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

			const character1: BaseEntity = {
				id: 'char-1',
				type: 'character',
				name: 'Character 1',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { playerName: 'Player 1', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const location1: BaseEntity = {
				id: 'loc-1',
				type: 'location',
				name: 'Location 1',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { locationType: 'city' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign);
			await db.entities.add(character1);
			await db.entities.add(location1);

			// Should still prevent deletion of last campaign
			await expect(entityRepository.delete('only-campaign')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);

			const campaignStillExists = await db.entities.get('only-campaign');
			expect(campaignStillExists).toBeDefined();
		});
	});

	describe('Campaign Deletion Guard - Edge Cases', () => {
		it('should handle concurrent deletion attempts of multiple campaigns', async () => {
			// Create three campaigns
			const campaign1: BaseEntity = {
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign 2',
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

			const campaign3: BaseEntity = {
				id: 'campaign-3',
				type: 'campaign',
				name: 'Campaign 3',
				description: '',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: { system: 'Call of Cthulhu', setting: '', status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign1);
			await db.entities.add(campaign2);
			await db.entities.add(campaign3);

			// Delete two campaigns successfully
			await entityRepository.delete('campaign-2');
			await entityRepository.delete('campaign-3');

			// Should have one campaign left
			const campaignsRemaining = await db.entities.where('type').equals('campaign').count();
			expect(campaignsRemaining).toBe(1);

			// Attempt to delete the last one should fail
			await expect(entityRepository.delete('campaign-1')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);
		});

		it('should check campaign count at deletion time, not when method is called', async () => {
			// Create two campaigns
			const campaign1: BaseEntity = {
				id: 'campaign-a',
				type: 'campaign',
				name: 'Campaign A',
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
				id: 'campaign-b',
				type: 'campaign',
				name: 'Campaign B',
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

			// Delete campaign-a (should succeed)
			await entityRepository.delete('campaign-a');

			// Now try to delete campaign-b (should fail as it's the last one)
			await expect(entityRepository.delete('campaign-b')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);
		});

		it('should only count campaign type entities when checking', async () => {
			// Create one campaign and entities that might be confused with campaigns
			const campaign: BaseEntity = {
				id: 'real-campaign',
				type: 'campaign',
				name: 'Real Campaign',
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

			// Entity with "campaign" in the name but wrong type
			const notACampaign: BaseEntity = {
				id: 'not-a-campaign',
				type: 'session',
				name: 'Campaign Session 1',
				description: 'This has campaign in the name but is not a campaign entity',
				summary: undefined,
				tags: [],
				imageUrl: undefined,
				fields: {
					sessionNumber: 1,
					status: 'completed'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(campaign);
			await db.entities.add(notACampaign);

			// Should still prevent deletion because only one campaign type entity exists
			await expect(entityRepository.delete('real-campaign')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);

			// Should allow deletion of the session
			await entityRepository.delete('not-a-campaign');

			const sessionDeleted = await db.entities.get('not-a-campaign');
			expect(sessionDeleted).toBeUndefined();
		});

		it('should provide clear error message when attempting to delete last campaign', async () => {
			const campaign: BaseEntity = {
				id: 'last-one',
				type: 'campaign',
				name: 'Last One',
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

			await db.entities.add(campaign);

			try {
				await entityRepository.delete('last-one');
				// If we get here, test should fail
				expect.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toBeDefined();
				expect(error instanceof Error).toBe(true);

				const errorMessage = (error as Error).message.toLowerCase();

				// Error message should be clear and mention "last campaign"
				expect(errorMessage).toMatch(/cannot.*delete/);
				expect(errorMessage).toMatch(/last.*campaign/);
			}
		});
	});

	describe('Campaign Deletion Guard - Batch Operations', () => {
		it('should prevent batch deletion if it would delete the last campaign', async () => {
			// This test assumes a batch delete functionality exists or will exist
			// If not, this documents the expected behavior

			const campaign1: BaseEntity = {
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

			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Campaign 2',
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

			// If attempting to delete all campaigns, should fail
			// This test documents the expected behavior for batch operations
			const campaignIds = ['campaign-1', 'campaign-2'];

			// For now, test individual deletions to ensure guard works
			await entityRepository.delete('campaign-1');

			// Deleting the last one should fail
			await expect(entityRepository.delete('campaign-2')).rejects.toThrow(
				/cannot delete.*last campaign/i
			);
		});
	});
});
