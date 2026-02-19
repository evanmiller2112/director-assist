/**
 * Tests for Database Integrity Check Service (Issue #511)
 *
 * This service runs database integrity checks on app startup to detect:
 * - Missing or corrupted entities
 * - Invalid active campaign references
 * - Broken entity relationships (dangling links)
 * - Malformed entity data
 *
 * Testing Strategy:
 * - Fresh database detection (empty DB should skip checks)
 * - Table existence validation
 * - Sample-based entity validation (detect malformed data)
 * - Active campaign validation (valid/invalid references)
 * - Referential integrity checks (dangling links)
 * - Full integration test (all checks together)
 * - Edge cases: empty DB, corrupted data, missing fields
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { db } from '$lib/db';
import type { BaseEntity, EntityLink } from '$lib/types';
import {
	runIntegrityCheck,
	isFreshDatabase,
	checkTableExistence,
	checkSampleValidation,
	checkActiveCampaign,
	checkReferentialIntegrity
} from './dbIntegrityCheckService';

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

describe('dbIntegrityCheckService', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear all tables before each test
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
	});

	describe('isFreshDatabase', () => {
		it('should return true for completely empty database', async () => {
			const result = await isFreshDatabase(db);
			expect(result).toBe(true);
		});

		it('should return false when entities exist', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);

			const result = await isFreshDatabase(db);
			expect(result).toBe(false);
		});

		it('should return false when only chat messages exist', async () => {
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: 'conv-1',
				role: 'user',
				content: 'Hello',
				timestamp: new Date()
			});

			const result = await isFreshDatabase(db);
			expect(result).toBe(false);
		});

		it('should return false when both entities and messages exist', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);
			await db.chatMessages.add({
				id: 'msg-1',
				conversationId: 'conv-1',
				role: 'user',
				content: 'Hello',
				timestamp: new Date()
			});

			const result = await isFreshDatabase(db);
			expect(result).toBe(false);
		});
	});

	describe('checkTableExistence', () => {
		it('should return no issues for properly initialized database', async () => {
			const issues = await checkTableExistence(db);
			expect(issues).toEqual([]);
		});

		it('should verify expected table list is present', async () => {
			// This test verifies that the check correctly identifies the expected tables
			// In a real scenario with missing tables, this would return issues
			const issues = await checkTableExistence(db);
			expect(issues).toEqual([]);
		});
	});

	describe('checkSampleValidation', () => {
		it('should return no issues for valid entities', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Valid NPC'
				})
			);
			await db.entities.add(
				createTestEntity({
					id: 'entity-2',
					type: 'location',
					name: 'Valid Location'
				})
			);

			const issues = await checkSampleValidation(db, 10);
			expect(issues).toEqual([]);
		});

		it('should detect entity missing required name field', async () => {
			const malformed = createTestEntity({
				id: 'malformed-1',
				type: 'npc'
			});
			// @ts-expect-error - Intentionally creating malformed entity for testing
			delete malformed.name;
			await db.entities.add(malformed);

			const issues = await checkSampleValidation(db, 10);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('sample_validation');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('name');
		});

		it('should detect entity missing required type field', async () => {
			const malformed = createTestEntity({
				id: 'malformed-2',
				name: 'Test Entity'
			});
			// @ts-expect-error - Intentionally creating malformed entity for testing
			delete malformed.type;
			await db.entities.add(malformed);

			const issues = await checkSampleValidation(db, 10);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('sample_validation');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('type');
		});

		it('should detect multiple malformed entities', async () => {
			const malformed1 = createTestEntity({ id: 'malformed-1', type: 'npc' });
			// @ts-expect-error - Intentionally creating malformed entity for testing
			delete malformed1.name;
			await db.entities.add(malformed1);

			const malformed2 = createTestEntity({ id: 'malformed-2', name: 'Test' });
			// @ts-expect-error - Intentionally creating malformed entity for testing
			delete malformed2.type;
			await db.entities.add(malformed2);

			const issues = await checkSampleValidation(db, 10);
			expect(issues.length).toBeGreaterThan(0);
		});

		it('should return no issues for empty database', async () => {
			const issues = await checkSampleValidation(db, 10);
			expect(issues).toEqual([]);
		});

		it('should use custom validator when provided', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);

			// Custom validator that always fails
			const alwaysFailValidator = () => false;

			const issues = await checkSampleValidation(db, 10, alwaysFailValidator);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('sample_validation');
		});

		it('should respect sample size parameter', async () => {
			// Add 20 entities
			for (let i = 0; i < 20; i++) {
				await db.entities.add(
					createTestEntity({
						id: `entity-${i}`,
						type: 'npc',
						name: `NPC ${i}`
					})
				);
			}

			// With sample size 5, should only check 5 entities
			// The actual check should limit the number of entities examined
			const issues = await checkSampleValidation(db, 5);
			expect(issues).toEqual([]);
		});
	});

	describe('checkActiveCampaign', () => {
		it('should return no issues when active campaign is valid', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign'
				})
			);

			await db.appConfig.put({
				key: 'activeCampaignId',
				value: 'campaign-1'
			});

			const issues = await checkActiveCampaign(db);
			expect(issues).toEqual([]);
		});

		it('should return minor issue when active campaign ID points to non-existent entity', async () => {
			await db.appConfig.put({
				key: 'activeCampaignId',
				value: 'non-existent-campaign'
			});

			const issues = await checkActiveCampaign(db);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('active_campaign');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('does not exist');
		});

		it('should return minor issue when active campaign points to non-campaign entity', async () => {
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

			const issues = await checkActiveCampaign(db);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('active_campaign');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('not a campaign');
		});

		it('should return major issue when no campaigns exist but other entities do', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'npc-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);
			await db.entities.add(
				createTestEntity({
					id: 'location-1',
					type: 'location',
					name: 'Test Location'
				})
			);

			const issues = await checkActiveCampaign(db);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('active_campaign');
			expect(issues[0].severity).toBe('major');
			expect(issues[0].message).toContain('No campaigns');
		});

		it('should return minor issue when no active campaign set but campaigns exist', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign'
				})
			);

			// No activeCampaignId set in appConfig

			const issues = await checkActiveCampaign(db);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('active_campaign');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('No active campaign');
		});

		it('should return no issues for empty database', async () => {
			const issues = await checkActiveCampaign(db);
			expect(issues).toEqual([]);
		});
	});

	describe('checkReferentialIntegrity', () => {
		it('should return no issues when all link targets exist', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'target-1',
					type: 'npc',
					name: 'Target NPC'
				})
			);

			await db.entities.add(
				createTestEntity({
					id: 'source-1',
					type: 'location',
					name: 'Source Location',
					links: [createTestLink('target-1', 'contains')]
				})
			);

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues).toEqual([]);
		});

		it('should detect dangling reference when link target does not exist', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'source-1',
					type: 'location',
					name: 'Source Location',
					links: [createTestLink('non-existent', 'contains')]
				})
			);

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].type).toBe('referential_integrity');
			expect(issues[0].severity).toBe('minor');
			expect(issues[0].message).toContain('dangling');
		});

		it('should detect multiple dangling references', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'source-1',
					type: 'location',
					name: 'Source Location',
					links: [
						createTestLink('non-existent-1', 'contains'),
						createTestLink('non-existent-2', 'near')
					]
				})
			);

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues.length).toBeGreaterThan(0);
		});

		it('should escalate to major issue when many dangling references exist', async () => {
			// Create entities with many dangling references (>= 30% threshold)
			for (let i = 0; i < 10; i++) {
				await db.entities.add(
					createTestEntity({
						id: `source-${i}`,
						type: 'npc',
						name: `NPC ${i}`,
						links: [createTestLink('non-existent', 'knows')]
					})
				);
			}

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues.length).toBeGreaterThan(0);
			const hasMajorIssue = issues.some((issue) => issue.severity === 'major');
			expect(hasMajorIssue).toBe(true);
		});

		it('should return no issues for entities with no links', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'npc',
					name: 'NPC without links'
				})
			);

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues).toEqual([]);
		});

		it('should return no issues for empty database', async () => {
			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues).toEqual([]);
		});

		it('should provide descriptive details about dangling references', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'source-1',
					type: 'npc',
					name: 'Test NPC',
					links: [createTestLink('missing-target', 'ally')]
				})
			);

			const issues = await checkReferentialIntegrity(db, 10);
			expect(issues.length).toBeGreaterThan(0);
			expect(issues[0].details).toBeDefined();
			expect(issues[0].details?.sourceId).toBe('source-1');
		});
	});

	describe('runIntegrityCheck (Integration)', () => {
		it('should complete successfully for healthy database', async () => {
			// Set up a healthy database
			await db.entities.add(
				createTestEntity({
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign'
				})
			);
			await db.entities.add(
				createTestEntity({
					id: 'npc-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);
			await db.appConfig.put({
				key: 'activeCampaignId',
				value: 'campaign-1'
			});

			const result = await runIntegrityCheck(db);

			expect(result.completed).toBe(true);
			expect(result.skipped).toBe(false);
			expect(result.issues).toEqual([]);
			expect(result.hasMinorIssues).toBe(false);
			expect(result.hasMajorIssues).toBe(false);
			expect(result.checkedAt).toBeInstanceOf(Date);
			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it('should skip checks for fresh database', async () => {
			const result = await runIntegrityCheck(db);

			expect(result.skipped).toBe(true);
			expect(result.completed).toBe(true);
			expect(result.issues).toEqual([]);
			expect(result.hasMinorIssues).toBe(false);
			expect(result.hasMajorIssues).toBe(false);
		});

		it('should detect minor issues only', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign'
				})
			);
			await db.entities.add(
				createTestEntity({
					id: 'npc-1',
					type: 'npc',
					name: 'Test NPC',
					links: [createTestLink('non-existent', 'knows')]
				})
			);
			await db.appConfig.put({
				key: 'activeCampaignId',
				value: 'campaign-1'
			});

			const result = await runIntegrityCheck(db);

			expect(result.completed).toBe(true);
			expect(result.hasMinorIssues).toBe(true);
			expect(result.hasMajorIssues).toBe(false);
			expect(result.issues.length).toBeGreaterThan(0);
		});

		it('should detect major issues', async () => {
			// Create database with no campaigns but other entities (major issue)
			await db.entities.add(
				createTestEntity({
					id: 'npc-1',
					type: 'npc',
					name: 'Test NPC'
				})
			);

			const result = await runIntegrityCheck(db);

			expect(result.completed).toBe(true);
			expect(result.hasMajorIssues).toBe(true);
			expect(result.issues.length).toBeGreaterThan(0);
		});

		it('should report durationMs as a non-negative number', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'campaign',
					name: 'Test'
				})
			);

			const result = await runIntegrityCheck(db);

			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it('should report checkedAt as Date', async () => {
			const before = new Date();
			const result = await runIntegrityCheck(db);
			const after = new Date();

			expect(result.checkedAt).toBeInstanceOf(Date);
			expect(result.checkedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(result.checkedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should accept custom config options', async () => {
			await db.entities.add(
				createTestEntity({
					id: 'entity-1',
					type: 'campaign',
					name: 'Test'
				})
			);

			const result = await runIntegrityCheck(db, { sampleSize: 5 });

			expect(result.completed).toBe(true);
		});
	});
});
