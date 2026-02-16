/**
 * Tests for Backup Schemas (Issue #504)
 *
 * Tests Valibot schemas for CampaignBackup validation.
 * These schemas provide runtime validation at the IndexedDB boundary.
 *
 * Testing Strategy:
 * - Valid backup with all required fields passes validation
 * - Missing required fields fail validation
 * - Optional fields can be omitted
 * - Nested entities within backup are validated
 * - Date fields accept both Date objects and ISO 8601 strings
 *
 * Coverage:
 * - CampaignBackupSchema: version, exportedAt, entities, optional sessions
 * - Nested entity validation within backup
 * - Optional combat/montage/negotiation sessions
 * - Type coercion for JSON deserialization (ISO strings → Dates)
 * - Backward compatibility with deprecated campaign field
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect } from 'vitest';
import { safeParse } from 'valibot';
import { CampaignBackupSchema } from '$lib/db/schemas/backupSchemas';
import type { CampaignBackup, BaseEntity } from '$lib/types';

describe('CampaignBackupSchema', () => {
	describe('Valid CampaignBackup', () => {
		it('should pass validation with all required fields', () => {
			const validBackup: CampaignBackup = {
				version: '1.0',
				exportedAt: new Date('2024-01-15T10:00:00Z'),
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toEqual(validBackup);
			}
		});

		it('should pass validation with entities array populated', () => {
			const entity: BaseEntity = {
				id: 'entity-123',
				type: 'character',
				name: 'Gandalf',
				description: 'A wise wizard',
				tags: ['wizard'],
				fields: {},
				links: [],
				notes: 'DM notes',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const validBackup: CampaignBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [entity],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
		});

		it('should pass validation with all optional fields included', () => {
			const validBackup: CampaignBackup = {
				version: '2.0',
				exportedAt: new Date(),
				entities: [],
				chatHistory: [],
				activeCampaignId: 'campaign-123',
				selectedModel: 'claude-sonnet-4-5-20250929',
				combatSessions: [],
				montageSessions: [],
				negotiationSessions: []
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
		});

		it('should pass validation with combat sessions', () => {
			const validBackup: CampaignBackup = {
				version: '1.5',
				exportedAt: new Date(),
				entities: [],
				chatHistory: [],
				combatSessions: [
					{
						id: 'combat-1',
						name: 'Test Combat',
						status: 'completed',
						currentRound: 5,
						currentTurn: 0,
						combatants: [],
						groups: [],
						victoryPoints: 3,
						heroPoints: 2,
						log: [],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
		});

		it('should accept exportedAt as Date object', () => {
			const backup = {
				version: '1.0',
				exportedAt: new Date('2024-01-15T10:00:00Z'),
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, backup);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.exportedAt).toBeInstanceOf(Date);
			}
		});

		it('should accept and coerce exportedAt as ISO 8601 string (JSON deserialization)', () => {
			const backup = {
				version: '1.0',
				exportedAt: '2024-01-15T10:00:00.000Z',
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, backup);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.exportedAt).toBeInstanceOf(Date);
				expect(result.output.exportedAt.toISOString()).toBe('2024-01-15T10:00:00.000Z');
			}
		});

		it('should pass validation with chatHistory populated', () => {
			const validBackup: CampaignBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [],
				chatHistory: [
					{
						id: 'msg-1',
						role: 'user',
						content: 'Test message',
						timestamp: new Date()
					},
					{
						id: 'msg-2',
						role: 'assistant',
						content: 'Response message',
						timestamp: new Date()
					}
				]
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
		});
	});

	describe('Missing Required Fields', () => {
		it('should fail validation when version is missing', () => {
			const invalidBackup = {
				// version missing
				exportedAt: new Date(),
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when exportedAt is missing', () => {
			const invalidBackup = {
				version: '1.0',
				// exportedAt missing
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when entities array is missing', () => {
			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				// entities missing
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when chatHistory is missing', () => {
			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: []
				// chatHistory missing
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Field Types', () => {
		it('should fail validation when version is not a string', () => {
			const invalidBackup = {
				version: 1.0, // should be string
				exportedAt: new Date(),
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when entities is not an array', () => {
			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: 'not-an-array', // should be array
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when chatHistory is not an array', () => {
			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [],
				chatHistory: 'not-an-array' // should be array
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when exportedAt is invalid date string', () => {
			const invalidBackup = {
				version: '1.0',
				exportedAt: 'not-a-date',
				entities: [],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});
	});

	describe('Nested Entity Validation', () => {
		it('should validate entities within the backup', () => {
			const invalidEntity = {
				id: 'entity-bad',
				type: 'character',
				name: '', // empty name should fail
				description: 'Test',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [invalidEntity],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when entity is missing required fields', () => {
			const invalidEntity = {
				id: 'entity-bad',
				// type missing
				name: 'Test Entity',
				description: 'Test',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [invalidEntity],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should pass validation with multiple valid entities', () => {
			const entity1: BaseEntity = {
				id: 'entity-1',
				type: 'character',
				name: 'Frodo',
				description: 'A hobbit',
				tags: ['hobbit', 'hero'],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const entity2: BaseEntity = {
				id: 'entity-2',
				type: 'location',
				name: 'The Shire',
				description: 'A peaceful land',
				tags: ['location', 'safe'],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const validBackup: CampaignBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [entity1, entity2],
				chatHistory: []
			};

			const result = safeParse(CampaignBackupSchema, validBackup);
			expect(result.success).toBe(true);
		});
	});

	describe('Nested ChatMessage Validation', () => {
		it('should fail validation when chatHistory contains invalid message', () => {
			const invalidMessage = {
				id: 'msg-bad',
				role: 'invalid-role', // should be 'user' or 'assistant'
				content: 'Test',
				timestamp: new Date()
			};

			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [],
				chatHistory: [invalidMessage]
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});

		it('should fail validation when chatMessage is missing required field', () => {
			const invalidMessage = {
				id: 'msg-bad',
				role: 'user',
				// content missing
				timestamp: new Date()
			};

			const invalidBackup = {
				version: '1.0',
				exportedAt: new Date(),
				entities: [],
				chatHistory: [invalidMessage]
			};

			const result = safeParse(CampaignBackupSchema, invalidBackup);
			expect(result.success).toBe(false);
		});
	});
});
