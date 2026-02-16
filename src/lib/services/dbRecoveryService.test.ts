/**
 * Tests for Database Recovery Service (Issue #511)
 *
 * This service provides recovery actions for database integrity issues:
 * - repairDatabase: Fixes minor issues (removes dangling links, resets invalid active campaign)
 * - resetDatabase: Clears all tables (destructive recovery)
 *
 * Testing Strategy:
 * - Repair removes dangling link references
 * - Repair resets invalid active campaign to first valid campaign
 * - Repair returns count of repairs made
 * - Repair is no-op when no issues exist
 * - Reset clears all tables
 * - Edge cases: empty database, no issues, partial corruption
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { db } from '$lib/db';
import { repairDatabase, resetDatabase } from './dbRecoveryService';
import type { IntegrityIssue, BaseEntity, EntityLink } from '$lib/types';

// Helper to create a valid entity with minimal required fields
function createTestEntity(overrides: Partial<BaseEntity>): BaseEntity {
	return {
		id: 'test-id',
		type: 'npc',
		name: 'Test Entity',
		description: '',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

// Helper to create a valid entity link
function createTestLink(
	targetId: string,
	relationship: string,
	overrides?: Partial<EntityLink>
): EntityLink {
	return {
		id: `link-${targetId}`,
		targetId,
		targetType: 'npc',
		relationship,
		bidirectional: false,
		...overrides
	};
}

describe('dbRecoveryService', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear all tables before each test
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
		await db.conversations.clear();
		await db.suggestions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
		await db.conversations.clear();
		await db.suggestions.clear();
	});

	describe('repairDatabase', () => {
		describe('Dangling Link Removal', () => {
			it('should remove dangling link references', async () => {
				// Create entity with dangling link
				await db.entities.add(
					createTestEntity({
						id: 'source-1',
						type: 'npc',
						name: 'Test NPC',
						links: [
							createTestLink('existing-target', 'knows'),
							createTestLink('non-existent', 'ally')
						]
					})
				);

				// Create the valid target
				await db.entities.add(
					createTestEntity({
						id: 'existing-target',
						type: 'npc',
						name: 'Existing NPC'
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference detected',
						details: {
							sourceId: 'source-1',
							targetId: 'non-existent'
						}
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBeGreaterThan(0);

				// Verify the dangling link was removed
				const entity = await db.entities.get('source-1');
				expect(entity?.links).toBeDefined();
				expect(entity?.links?.length).toBe(1);
				expect(entity?.links?.[0].targetId).toBe('existing-target');
			});

			it('should remove all links if all are dangling', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'source-1',
						type: 'npc',
						name: 'Test NPC',
						links: [
							createTestLink('non-existent-1', 'knows'),
							createTestLink('non-existent-2', 'ally')
						]
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'non-existent-1' }
					},
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'non-existent-2' }
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(2);

				const entity = await db.entities.get('source-1');
				expect(entity?.links).toEqual([]);
			});

			it('should handle multiple entities with dangling links', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'source-1',
						type: 'npc',
						name: 'NPC 1',
						links: [createTestLink('non-existent', 'knows')]
					})
				);

				await db.entities.add(
					createTestEntity({
						id: 'source-2',
						type: 'location',
						name: 'Location 1',
						links: [createTestLink('another-missing', 'contains', { targetType: 'location' })]
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'non-existent' }
					},
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-2', targetId: 'another-missing' }
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(2);

				const entity1 = await db.entities.get('source-1');
				const entity2 = await db.entities.get('source-2');
				expect(entity1?.links).toEqual([]);
				expect(entity2?.links).toEqual([]);
			});
		});

		describe('Active Campaign Reset', () => {
			it('should reset active campaign to first valid campaign when current is invalid', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'campaign-1',
						type: 'campaign',
						name: 'Valid Campaign'
					})
				);

				await db.appConfig.put({
					key: 'activeCampaignId',
					value: 'non-existent-campaign'
				});

				const issues: IntegrityIssue[] = [
					{
						type: 'active_campaign',
						severity: 'minor',
						message: 'Active campaign does not exist'
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBeGreaterThan(0);

				const config = await db.appConfig.get('activeCampaignId');
				expect(config?.value).toBe('campaign-1');
			});

			it('should set active campaign when none is set but campaigns exist', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'campaign-1',
						type: 'campaign',
						name: 'Campaign 1',
						createdAt: new Date('2024-01-01'),
						updatedAt: new Date('2024-01-01')
					})
				);

				await db.entities.add(
					createTestEntity({
						id: 'campaign-2',
						type: 'campaign',
						name: 'Campaign 2',
						createdAt: new Date('2024-01-02'),
						updatedAt: new Date('2024-01-02')
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'active_campaign',
						severity: 'minor',
						message: 'No active campaign set'
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(1);

				const config = await db.appConfig.get('activeCampaignId');
				expect(config?.value).toBeTruthy();
				expect(typeof config?.value).toBe('string');
			});

			it('should reset to first campaign when active points to non-campaign entity', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'campaign-1',
						type: 'campaign',
						name: 'Valid Campaign'
					})
				);

				await db.entities.add(
					createTestEntity({
						id: 'npc-1',
						type: 'npc',
						name: 'Not a Campaign'
					})
				);

				await db.appConfig.put({
					key: 'activeCampaignId',
					value: 'npc-1'
				});

				const issues: IntegrityIssue[] = [
					{
						type: 'active_campaign',
						severity: 'minor',
						message: 'Active campaign is not a campaign entity'
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(1);

				const config = await db.appConfig.get('activeCampaignId');
				expect(config?.value).toBe('campaign-1');
			});
		});

		describe('Repair Count', () => {
			it('should return count of repairs made', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'source-1',
						type: 'npc',
						name: 'Test NPC',
						links: [createTestLink('non-existent', 'knows')]
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'non-existent' }
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(1);
			});

			it('should return correct count for multiple repairs', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'source-1',
						type: 'npc',
						name: 'NPC 1',
						links: [createTestLink('missing-1', 'knows'), createTestLink('missing-2', 'ally')]
					})
				);

				await db.entities.add(
					createTestEntity({
						id: 'campaign-1',
						type: 'campaign',
						name: 'Campaign'
					})
				);

				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'missing-1' }
					},
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'source-1', targetId: 'missing-2' }
					},
					{
						type: 'active_campaign',
						severity: 'minor',
						message: 'No active campaign set'
					}
				];

				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBe(3);
			});
		});

		describe('No-op Cases', () => {
			it('should return 0 when issues array is empty', async () => {
				const repairCount = await repairDatabase(db, []);

				expect(repairCount).toBe(0);
			});

			it('should not modify database when no issues exist', async () => {
				await db.entities.add(
					createTestEntity({
						id: 'entity-1',
						type: 'npc',
						name: 'Test NPC',
						links: [createTestLink('entity-2', 'knows')]
					})
				);

				await db.entities.add(
					createTestEntity({
						id: 'entity-2',
						type: 'npc',
						name: 'Valid Target'
					})
				);

				const entityBefore = await db.entities.get('entity-1');
				const repairCount = await repairDatabase(db, []);
				const entityAfter = await db.entities.get('entity-1');

				expect(repairCount).toBe(0);
				expect(entityAfter).toEqual(entityBefore);
			});

			it('should handle major issues gracefully', async () => {
				const issues: IntegrityIssue[] = [
					{
						type: 'active_campaign',
						severity: 'major',
						message: 'No campaigns exist'
					}
				];

				// Major issues typically cannot be auto-repaired
				const repairCount = await repairDatabase(db, issues);

				expect(repairCount).toBeGreaterThanOrEqual(0);
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty database gracefully', async () => {
				const repairCount = await repairDatabase(db, []);

				expect(repairCount).toBe(0);
			});

			it('should handle issues with missing details', async () => {
				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference'
						// No details object
					}
				];

				expect(async () => {
					await repairDatabase(db, issues);
				}).not.toThrow();
			});

			it('should handle non-existent entity in issue details', async () => {
				const issues: IntegrityIssue[] = [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference',
						details: { sourceId: 'non-existent-source', targetId: 'non-existent-target' }
					}
				];

				expect(async () => {
					const repairCount = await repairDatabase(db, issues);
					expect(repairCount).toBe(0);
				}).not.toThrow();
			});
		});
	});

	describe('resetDatabase', () => {
		it('should clear all entities', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);
			await db.entities.add(
				createTestEntity({
					id: 'entity-2',
					type: 'location',
					name: 'Test Location'
				})
			);

			await resetDatabase(db);

			const count = await db.entities.count();
			expect(count).toBe(0);
		});

		it('should clear all chat messages', async () => {
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: 'conv-1',
				role: 'user',
				content: 'Test message',
				timestamp: new Date()
			});

			await resetDatabase(db);

			const count = await db.chatMessages.count();
			expect(count).toBe(0);
		});

		it('should clear all conversations', async () => {
			await db.conversations.add({
				id: 'conv-1',
				name: 'Test Conversation',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await resetDatabase(db);

			const count = await db.conversations.count();
			expect(count).toBe(0);
		});

		it('should clear app config', async () => {
			await db.appConfig.put({
				key: 'activeCampaignId',
				value: 'campaign-1'
			});
			await db.appConfig.put({
				key: 'theme',
				value: 'dark'
			});

			await resetDatabase(db);

			const count = await db.appConfig.count();
			expect(count).toBe(0);
		});

		it('should clear all tables in database', async () => {
			// Populate multiple tables
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test'
				})
			);
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: 'conv-1',
				role: 'user',
				content: 'Test',
				timestamp: new Date()
			});
			await db.appConfig.put({ key: 'test', value: 'value' });
			await db.suggestions.add({
				id: 'sug-1',
				type: 'relationship',
				status: 'pending',
				createdAt: new Date(),
				suggestion: 'Test suggestion',
				affectedEntityIds: []
			} as any);

			await resetDatabase(db);

			const entityCount = await db.entities.count();
			const messageCount = await db.chatMessages.count();
			const configCount = await db.appConfig.count();
			const suggestionCount = await db.suggestions.count();

			expect(entityCount).toBe(0);
			expect(messageCount).toBe(0);
			expect(configCount).toBe(0);
			expect(suggestionCount).toBe(0);
		});

		it('should not throw when called on empty database', async () => {
			expect(async () => {
				await resetDatabase(db);
			}).not.toThrow();
		});

		it('should be idempotent', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test'
				})
			);

			await resetDatabase(db);
			await resetDatabase(db);
			await resetDatabase(db);

			const count = await db.entities.count();
			expect(count).toBe(0);
		});
	});
});
