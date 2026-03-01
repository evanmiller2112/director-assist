/**
 * Tests for Backup Date Rehydration Service (TDD RED Phase)
 *
 * This test suite validates the `rehydrateBackupDates` utility function which
 * corrects a critical bug in the import flow: `JSON.parse` converts all Date
 * objects to ISO strings, so the raw result of parsing a backup file has
 * strings everywhere the application expects Date objects. Calling
 * `.toISOString()` on those strings throws a TypeError at runtime.
 *
 * The Valibot schemas in `src/lib/db/schemas/` already contain the correct
 * date transforms, but the settings page import path calls `JSON.parse(text)
 * as CampaignBackup` with a bare type assertion and never runs the schemas.
 * This service fills that gap.
 *
 * Testing Strategy:
 * - Each top-level date field in CampaignBackup is rehydrated to a Date
 * - Nested date fields in every session/entity collection are rehydrated
 * - Fields that are already Date objects are passed through unchanged (idempotency)
 * - Optional date fields that are absent remain absent (not set to undefined)
 * - The function does not mutate the input — it returns a new object
 *
 * Coverage:
 * - NegotiationSession: createdAt, updatedAt, completedAt
 * - NegotiationArgument (nested): arguments[].createdAt  <-- the crash site
 * - CombatSession: createdAt, updatedAt
 * - CombatLogEntry (nested): log[].timestamp
 * - MontageSession: createdAt, updatedAt, completedAt
 * - RespiteSession: createdAt, updatedAt, completedAt
 * - KitSwap (nested): kitSwaps[].createdAt
 * - BaseEntity: createdAt, updatedAt
 * - EntityLink (nested): links[].createdAt, links[].updatedAt
 * - ChatMessage: timestamp
 * - CampaignBackup top-level: exportedAt
 * - Already-Date passthrough (idempotency)
 *
 * RED Phase: These tests MUST FAIL because the module does not exist yet.
 * The implementation will be added in the GREEN phase.
 */

import { describe, it, expect } from 'vitest';
import { rehydrateBackupDates } from '$lib/services/backupRehydration';

// ---------------------------------------------------------------------------
// Shared ISO timestamps used across tests
// ---------------------------------------------------------------------------

const ISO_CREATED = '2025-01-15T10:00:00.000Z';
const ISO_UPDATED = '2025-01-15T11:00:00.000Z';
const ISO_COMPLETED = '2025-01-15T12:00:00.000Z';
const ISO_TIMESTAMP = '2025-01-15T10:30:00.000Z';
const ISO_EXPORTED = '2025-01-15T09:00:00.000Z';

// ---------------------------------------------------------------------------
// Helper builders that produce the shapes JSON.parse gives us — dates as
// ISO strings, not Date objects.
// ---------------------------------------------------------------------------

function makeRawNegotiationArgument(overrides: Record<string, unknown> = {}) {
	return {
		id: 'arg-1',
		type: 'motivation' as const,
		tier: 1 as const,
		description: 'A compelling argument',
		interestChange: 1,
		patienceChange: 0,
		createdAt: ISO_TIMESTAMP, // string, not Date — this is the crash site
		...overrides
	};
}

function makeRawNegotiationSession(overrides: Record<string, unknown> = {}) {
	return {
		id: 'neg-1',
		name: 'Test Negotiation',
		npcName: 'Merchant Aldric',
		status: 'active' as const,
		interest: 3,
		patience: 4,
		impression: 0,
		motivations: [],
		pitfalls: [],
		arguments: [makeRawNegotiationArgument()],
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		...overrides
	};
}

function makeRawCombatLogEntry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'log-1',
		round: 1,
		turn: 1,
		timestamp: ISO_TIMESTAMP, // string
		message: 'Aragorn attacks the orc.',
		type: 'action' as const,
		...overrides
	};
}

function makeRawCombatSession(overrides: Record<string, unknown> = {}) {
	return {
		id: 'combat-1',
		name: 'Battle at the Bridge',
		status: 'active' as const,
		currentRound: 1,
		currentTurn: 0,
		combatants: [],
		groups: [],
		victoryPoints: 0,
		heroPoints: 3,
		log: [makeRawCombatLogEntry()],
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		turnMode: 'director-selected' as const,
		actedCombatantIds: [],
		...overrides
	};
}

function makeRawMontageSession(overrides: Record<string, unknown> = {}) {
	return {
		id: 'montage-1',
		name: 'The Great Escape',
		status: 'active' as const,
		difficulty: 'moderate' as const,
		playerCount: 4,
		successLimit: 6,
		failureLimit: 3,
		challenges: [],
		successCount: 2,
		failureCount: 0,
		currentRound: 1 as const,
		victoryPoints: 0,
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		...overrides
	};
}

function makeRawKitSwap(overrides: Record<string, unknown> = {}) {
	return {
		id: 'swap-1',
		heroId: 'hero-1',
		from: 'Rogue Kit',
		to: 'Martial Artist Kit',
		createdAt: ISO_CREATED, // string
		...overrides
	};
}

function makeRawRespiteSession(overrides: Record<string, unknown> = {}) {
	return {
		id: 'respite-1',
		name: 'Rest at the Inn',
		status: 'active' as const,
		heroes: [],
		victoryPointsAvailable: 5,
		victoryPointsConverted: 0,
		activityIds: [],
		kitSwaps: [makeRawKitSwap()],
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		...overrides
	};
}

function makeRawEntityLink(overrides: Record<string, unknown> = {}) {
	return {
		id: 'link-1',
		targetId: 'entity-2',
		targetType: 'npc',
		relationship: 'knows',
		bidirectional: false,
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		...overrides
	};
}

function makeRawEntity(overrides: Record<string, unknown> = {}) {
	return {
		id: 'entity-1',
		type: 'character',
		name: 'Baldric the Bold',
		description: 'A seasoned adventurer.',
		tags: ['hero'],
		fields: {},
		links: [makeRawEntityLink()],
		notes: '',
		createdAt: ISO_CREATED, // string
		updatedAt: ISO_UPDATED, // string
		metadata: {}
	};
}

function makeRawChatMessage(overrides: Record<string, unknown> = {}) {
	return {
		id: 'msg-1',
		role: 'user' as const,
		content: 'What happens next?',
		timestamp: ISO_TIMESTAMP, // string
		...overrides
	};
}

function makeRawBackup(overrides: Record<string, unknown> = {}) {
	return {
		version: '2.0',
		exportedAt: ISO_EXPORTED, // string
		entities: [makeRawEntity()],
		chatHistory: [makeRawChatMessage()],
		negotiationSessions: [makeRawNegotiationSession()],
		combatSessions: [makeRawCombatSession()],
		montageSessions: [makeRawMontageSession()],
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('rehydrateBackupDates', () => {
	// -------------------------------------------------------------------------
	// Top-level backup field
	// -------------------------------------------------------------------------

	describe('CampaignBackup top-level fields', () => {
		it('should rehydrate exportedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.exportedAt).toBeInstanceOf(Date);
			expect(result.exportedAt.toISOString()).toBe(ISO_EXPORTED);
		});

		it('should pass through exportedAt when it is already a Date', () => {
			const existingDate = new Date(ISO_EXPORTED);
			const raw = makeRawBackup({ exportedAt: existingDate });

			const result = rehydrateBackupDates(raw);

			expect(result.exportedAt).toBeInstanceOf(Date);
			expect(result.exportedAt.toISOString()).toBe(ISO_EXPORTED);
		});

		it('should not mutate the input object', () => {
			const raw = makeRawBackup();
			const originalExportedAt = raw.exportedAt;

			rehydrateBackupDates(raw);

			// The original should still be a string
			expect(raw.exportedAt).toBe(originalExportedAt);
		});
	});

	// -------------------------------------------------------------------------
	// NegotiationSession — top-level dates
	// -------------------------------------------------------------------------

	describe('NegotiationSession dates', () => {
		it('should rehydrate createdAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].createdAt).toBeInstanceOf(Date);
			expect(result.negotiationSessions![0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].updatedAt).toBeInstanceOf(Date);
			expect(result.negotiationSessions![0].updatedAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should rehydrate completedAt from ISO string to Date when present', () => {
			const raw = makeRawBackup({
				negotiationSessions: [
					makeRawNegotiationSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].completedAt).toBeInstanceOf(Date);
			expect(result.negotiationSessions![0].completedAt!.toISOString()).toBe(ISO_COMPLETED);
		});

		it('should leave completedAt undefined when not present', () => {
			// makeRawNegotiationSession does not include completedAt by default
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].completedAt).toBeUndefined();
		});

		it('should pass through createdAt when it is already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				negotiationSessions: [makeRawNegotiationSession({ createdAt: existingDate })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].createdAt).toBeInstanceOf(Date);
			expect(result.negotiationSessions![0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should handle an empty negotiationSessions array', () => {
			const raw = makeRawBackup({ negotiationSessions: [] });

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions).toEqual([]);
		});

		it('should handle absent negotiationSessions', () => {
			const raw = makeRawBackup({ negotiationSessions: undefined });

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions).toBeUndefined();
		});

		it('should rehydrate all sessions when multiple exist', () => {
			const raw = makeRawBackup({
				negotiationSessions: [
					makeRawNegotiationSession({ id: 'neg-1' }),
					makeRawNegotiationSession({ id: 'neg-2' })
				]
			});

			const result = rehydrateBackupDates(raw);

			result.negotiationSessions!.forEach((session) => {
				expect(session.createdAt).toBeInstanceOf(Date);
				expect(session.updatedAt).toBeInstanceOf(Date);
			});
		});
	});

	// -------------------------------------------------------------------------
	// NegotiationArgument — nested dates (the actual crash site)
	// -------------------------------------------------------------------------

	describe('NegotiationArgument nested dates', () => {
		it('should rehydrate arguments[].createdAt from ISO string to Date', () => {
			// This is the specific field that causes the crash when .toISOString()
			// is called on it after a JSON.parse import.
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			const firstArg = result.negotiationSessions![0].arguments[0];
			expect(firstArg.createdAt).toBeInstanceOf(Date);
			expect(firstArg.createdAt.toISOString()).toBe(ISO_TIMESTAMP);
		});

		it('should rehydrate all arguments when multiple exist', () => {
			const raw = makeRawBackup({
				negotiationSessions: [
					makeRawNegotiationSession({
						arguments: [
							makeRawNegotiationArgument({ id: 'arg-1' }),
							makeRawNegotiationArgument({ id: 'arg-2', createdAt: ISO_UPDATED })
						]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			const args = result.negotiationSessions![0].arguments;
			expect(args[0].createdAt).toBeInstanceOf(Date);
			expect(args[1].createdAt).toBeInstanceOf(Date);
			expect(args[1].createdAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through arguments[].createdAt when already a Date', () => {
			const existingDate = new Date(ISO_TIMESTAMP);
			const raw = makeRawBackup({
				negotiationSessions: [
					makeRawNegotiationSession({
						arguments: [makeRawNegotiationArgument({ createdAt: existingDate })]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].arguments[0].createdAt).toBeInstanceOf(Date);
		});

		it('should handle an empty arguments array', () => {
			const raw = makeRawBackup({
				negotiationSessions: [makeRawNegotiationSession({ arguments: [] })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.negotiationSessions![0].arguments).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// CombatSession — top-level dates
	// -------------------------------------------------------------------------

	describe('CombatSession dates', () => {
		it('should rehydrate createdAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions![0].createdAt).toBeInstanceOf(Date);
			expect(result.combatSessions![0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions![0].updatedAt).toBeInstanceOf(Date);
			expect(result.combatSessions![0].updatedAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through createdAt when it is already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				combatSessions: [makeRawCombatSession({ createdAt: existingDate })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions![0].createdAt).toBeInstanceOf(Date);
		});

		it('should handle an empty combatSessions array', () => {
			const raw = makeRawBackup({ combatSessions: [] });

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions).toEqual([]);
		});

		it('should handle absent combatSessions', () => {
			const raw = makeRawBackup({ combatSessions: undefined });

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions).toBeUndefined();
		});
	});

	// -------------------------------------------------------------------------
	// CombatLogEntry — nested dates
	// -------------------------------------------------------------------------

	describe('CombatLogEntry nested dates', () => {
		it('should rehydrate log[].timestamp from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			const firstEntry = result.combatSessions![0].log[0];
			expect(firstEntry.timestamp).toBeInstanceOf(Date);
			expect(firstEntry.timestamp.toISOString()).toBe(ISO_TIMESTAMP);
		});

		it('should rehydrate all log entries when multiple exist', () => {
			const raw = makeRawBackup({
				combatSessions: [
					makeRawCombatSession({
						log: [
							makeRawCombatLogEntry({ id: 'log-1' }),
							makeRawCombatLogEntry({ id: 'log-2', timestamp: ISO_UPDATED })
						]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			const log = result.combatSessions![0].log;
			expect(log[0].timestamp).toBeInstanceOf(Date);
			expect(log[1].timestamp).toBeInstanceOf(Date);
			expect(log[1].timestamp.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through log[].timestamp when already a Date', () => {
			const existingDate = new Date(ISO_TIMESTAMP);
			const raw = makeRawBackup({
				combatSessions: [
					makeRawCombatSession({
						log: [makeRawCombatLogEntry({ timestamp: existingDate })]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions![0].log[0].timestamp).toBeInstanceOf(Date);
		});

		it('should handle an empty log array', () => {
			const raw = makeRawBackup({
				combatSessions: [makeRawCombatSession({ log: [] })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.combatSessions![0].log).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// MontageSession — top-level dates
	// -------------------------------------------------------------------------

	describe('MontageSession dates', () => {
		it('should rehydrate createdAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions![0].createdAt).toBeInstanceOf(Date);
			expect(result.montageSessions![0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions![0].updatedAt).toBeInstanceOf(Date);
			expect(result.montageSessions![0].updatedAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should rehydrate completedAt from ISO string to Date when present', () => {
			const raw = makeRawBackup({
				montageSessions: [makeRawMontageSession({ completedAt: ISO_COMPLETED, status: 'completed' })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions![0].completedAt).toBeInstanceOf(Date);
			expect(result.montageSessions![0].completedAt!.toISOString()).toBe(ISO_COMPLETED);
		});

		it('should leave completedAt undefined when not present', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions![0].completedAt).toBeUndefined();
		});

		it('should pass through createdAt when it is already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				montageSessions: [makeRawMontageSession({ createdAt: existingDate })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions![0].createdAt).toBeInstanceOf(Date);
		});

		it('should handle absent montageSessions', () => {
			const raw = makeRawBackup({ montageSessions: undefined });

			const result = rehydrateBackupDates(raw);

			expect(result.montageSessions).toBeUndefined();
		});
	});

	// -------------------------------------------------------------------------
	// RespiteSession — top-level dates
	// -------------------------------------------------------------------------

	describe('RespiteSession dates', () => {
		it('should rehydrate createdAt from ISO string to Date', () => {
			const raw = makeRawBackup({ respiteSessions: [makeRawRespiteSession()] });

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].createdAt).toBeInstanceOf(Date);
			expect(result.respiteSessions![0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup({ respiteSessions: [makeRawRespiteSession()] });

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].updatedAt).toBeInstanceOf(Date);
			expect(result.respiteSessions![0].updatedAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should rehydrate completedAt from ISO string to Date when present', () => {
			const raw = makeRawBackup({
				respiteSessions: [
					makeRawRespiteSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].completedAt).toBeInstanceOf(Date);
			expect(result.respiteSessions![0].completedAt!.toISOString()).toBe(ISO_COMPLETED);
		});

		it('should leave completedAt undefined when not present', () => {
			const raw = makeRawBackup({ respiteSessions: [makeRawRespiteSession()] });

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].completedAt).toBeUndefined();
		});

		it('should pass through createdAt when it is already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				respiteSessions: [makeRawRespiteSession({ createdAt: existingDate })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].createdAt).toBeInstanceOf(Date);
		});

		it('should handle an empty respiteSessions array', () => {
			const raw = makeRawBackup({ respiteSessions: [] });

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions).toEqual([]);
		});

		it('should handle absent respiteSessions', () => {
			const raw = makeRawBackup({ respiteSessions: undefined });

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions).toBeUndefined();
		});
	});

	// -------------------------------------------------------------------------
	// KitSwap — nested inside RespiteSession
	// -------------------------------------------------------------------------

	describe('KitSwap nested dates', () => {
		it('should rehydrate kitSwaps[].createdAt from ISO string to Date', () => {
			const raw = makeRawBackup({ respiteSessions: [makeRawRespiteSession()] });

			const result = rehydrateBackupDates(raw);

			const firstSwap = result.respiteSessions![0].kitSwaps[0];
			expect(firstSwap.createdAt).toBeInstanceOf(Date);
			expect(firstSwap.createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate all kitSwaps when multiple exist', () => {
			const raw = makeRawBackup({
				respiteSessions: [
					makeRawRespiteSession({
						kitSwaps: [
							makeRawKitSwap({ id: 'swap-1' }),
							makeRawKitSwap({ id: 'swap-2', createdAt: ISO_UPDATED })
						]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			const swaps = result.respiteSessions![0].kitSwaps;
			expect(swaps[0].createdAt).toBeInstanceOf(Date);
			expect(swaps[1].createdAt).toBeInstanceOf(Date);
			expect(swaps[1].createdAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through kitSwaps[].createdAt when already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				respiteSessions: [
					makeRawRespiteSession({
						kitSwaps: [makeRawKitSwap({ createdAt: existingDate })]
					})
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].kitSwaps[0].createdAt).toBeInstanceOf(Date);
		});

		it('should handle an empty kitSwaps array', () => {
			const raw = makeRawBackup({
				respiteSessions: [makeRawRespiteSession({ kitSwaps: [] })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.respiteSessions![0].kitSwaps).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// BaseEntity — top-level dates
	// -------------------------------------------------------------------------

	describe('BaseEntity dates', () => {
		it('should rehydrate entities[].createdAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.entities[0].createdAt).toBeInstanceOf(Date);
			expect(result.entities[0].createdAt.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate entities[].updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.entities[0].updatedAt).toBeInstanceOf(Date);
			expect(result.entities[0].updatedAt.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through entities[].createdAt when already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				entities: [makeRawEntity(), { ...makeRawEntity(), id: 'entity-2', createdAt: existingDate }]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.entities[1].createdAt).toBeInstanceOf(Date);
		});

		it('should rehydrate all entities when multiple exist', () => {
			const raw = makeRawBackup({
				entities: [makeRawEntity(), { ...makeRawEntity(), id: 'entity-2', name: 'Elara' }]
			});

			const result = rehydrateBackupDates(raw);

			result.entities.forEach((entity) => {
				expect(entity.createdAt).toBeInstanceOf(Date);
				expect(entity.updatedAt).toBeInstanceOf(Date);
			});
		});

		it('should handle an empty entities array', () => {
			const raw = makeRawBackup({ entities: [] });

			const result = rehydrateBackupDates(raw);

			expect(result.entities).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// EntityLink — nested inside BaseEntity
	// -------------------------------------------------------------------------

	describe('EntityLink nested dates', () => {
		it('should rehydrate entities[].links[].createdAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			const firstLink = result.entities[0].links[0];
			expect(firstLink.createdAt).toBeInstanceOf(Date);
			expect(firstLink.createdAt!.toISOString()).toBe(ISO_CREATED);
		});

		it('should rehydrate entities[].links[].updatedAt from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			const firstLink = result.entities[0].links[0];
			expect(firstLink.updatedAt).toBeInstanceOf(Date);
			expect(firstLink.updatedAt!.toISOString()).toBe(ISO_UPDATED);
		});

		it('should leave link createdAt undefined when not present on the link', () => {
			const linkWithoutDates = {
				id: 'link-nodates',
				targetId: 'entity-3',
				targetType: 'npc',
				relationship: 'allied_with',
				bidirectional: true
				// no createdAt, no updatedAt
			};
			const raw = makeRawBackup({
				entities: [{ ...makeRawEntity(), links: [linkWithoutDates] }]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.entities[0].links[0].createdAt).toBeUndefined();
			expect(result.entities[0].links[0].updatedAt).toBeUndefined();
		});

		it('should pass through link createdAt when already a Date', () => {
			const existingDate = new Date(ISO_CREATED);
			const raw = makeRawBackup({
				entities: [
					{
						...makeRawEntity(),
						links: [makeRawEntityLink({ createdAt: existingDate })]
					}
				]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.entities[0].links[0].createdAt).toBeInstanceOf(Date);
		});

		it('should rehydrate all links across all entities', () => {
			const raw = makeRawBackup({
				entities: [
					{
						...makeRawEntity(),
						id: 'entity-1',
						links: [makeRawEntityLink({ id: 'link-1' }), makeRawEntityLink({ id: 'link-2' })]
					},
					{
						...makeRawEntity(),
						id: 'entity-2',
						links: [makeRawEntityLink({ id: 'link-3' })]
					}
				]
			});

			const result = rehydrateBackupDates(raw);

			result.entities.forEach((entity) => {
				entity.links.forEach((link) => {
					expect(link.createdAt).toBeInstanceOf(Date);
					expect(link.updatedAt).toBeInstanceOf(Date);
				});
			});
		});

		it('should handle an entity with no links', () => {
			const raw = makeRawBackup({
				entities: [{ ...makeRawEntity(), links: [] }]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.entities[0].links).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// ChatMessage — top-level dates
	// -------------------------------------------------------------------------

	describe('ChatMessage dates', () => {
		it('should rehydrate chatHistory[].timestamp from ISO string to Date', () => {
			const raw = makeRawBackup();

			const result = rehydrateBackupDates(raw);

			expect(result.chatHistory[0].timestamp).toBeInstanceOf(Date);
			expect(result.chatHistory[0].timestamp.toISOString()).toBe(ISO_TIMESTAMP);
		});

		it('should rehydrate all messages when multiple exist', () => {
			const raw = makeRawBackup({
				chatHistory: [
					makeRawChatMessage({ id: 'msg-1' }),
					makeRawChatMessage({ id: 'msg-2', timestamp: ISO_UPDATED })
				]
			});

			const result = rehydrateBackupDates(raw);

			result.chatHistory.forEach((msg) => {
				expect(msg.timestamp).toBeInstanceOf(Date);
			});
			expect(result.chatHistory[1].timestamp.toISOString()).toBe(ISO_UPDATED);
		});

		it('should pass through chatHistory[].timestamp when already a Date', () => {
			const existingDate = new Date(ISO_TIMESTAMP);
			const raw = makeRawBackup({
				chatHistory: [makeRawChatMessage({ timestamp: existingDate })]
			});

			const result = rehydrateBackupDates(raw);

			expect(result.chatHistory[0].timestamp).toBeInstanceOf(Date);
		});

		it('should handle an empty chatHistory array', () => {
			const raw = makeRawBackup({ chatHistory: [] });

			const result = rehydrateBackupDates(raw);

			expect(result.chatHistory).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// Idempotency — already-Date fields are passed through unchanged
	// -------------------------------------------------------------------------

	describe('Idempotency — already-Date fields', () => {
		it('should be safe to call twice on the same data without double-converting', () => {
			const raw = makeRawBackup();

			const firstPass = rehydrateBackupDates(raw);
			// Calling again on the already-rehydrated result must not throw and
			// must return valid Dates.
			const secondPass = rehydrateBackupDates(firstPass);

			expect(secondPass.exportedAt).toBeInstanceOf(Date);
			expect(secondPass.negotiationSessions![0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.negotiationSessions![0].arguments[0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.combatSessions![0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.combatSessions![0].log[0].timestamp).toBeInstanceOf(Date);
			expect(secondPass.montageSessions![0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.entities[0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.entities[0].links[0].createdAt).toBeInstanceOf(Date);
			expect(secondPass.chatHistory[0].timestamp).toBeInstanceOf(Date);
		});
	});

	// -------------------------------------------------------------------------
	// Integration — full backup round-trip
	// -------------------------------------------------------------------------

	describe('Full backup round-trip', () => {
		it('should rehydrate every date field in a complete backup with all session types', () => {
			const raw = {
				version: '2.0',
				exportedAt: ISO_EXPORTED,
				entities: [makeRawEntity()],
				chatHistory: [makeRawChatMessage()],
				negotiationSessions: [
					makeRawNegotiationSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				],
				combatSessions: [makeRawCombatSession()],
				montageSessions: [
					makeRawMontageSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				],
				respiteSessions: [
					makeRawRespiteSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				]
			};

			const result = rehydrateBackupDates(raw);

			// Top-level
			expect(result.exportedAt).toBeInstanceOf(Date);

			// Negotiation
			const neg = result.negotiationSessions![0];
			expect(neg.createdAt).toBeInstanceOf(Date);
			expect(neg.updatedAt).toBeInstanceOf(Date);
			expect(neg.completedAt).toBeInstanceOf(Date);
			expect(neg.arguments[0].createdAt).toBeInstanceOf(Date);

			// Combat
			const combat = result.combatSessions![0];
			expect(combat.createdAt).toBeInstanceOf(Date);
			expect(combat.updatedAt).toBeInstanceOf(Date);
			expect(combat.log[0].timestamp).toBeInstanceOf(Date);

			// Montage
			const montage = result.montageSessions![0];
			expect(montage.createdAt).toBeInstanceOf(Date);
			expect(montage.updatedAt).toBeInstanceOf(Date);
			expect(montage.completedAt).toBeInstanceOf(Date);

			// Respite
			const respite = result.respiteSessions![0];
			expect(respite.createdAt).toBeInstanceOf(Date);
			expect(respite.updatedAt).toBeInstanceOf(Date);
			expect(respite.completedAt).toBeInstanceOf(Date);
			expect(respite.kitSwaps[0].createdAt).toBeInstanceOf(Date);

			// Entity
			const entity = result.entities[0];
			expect(entity.createdAt).toBeInstanceOf(Date);
			expect(entity.updatedAt).toBeInstanceOf(Date);
			expect(entity.links[0].createdAt).toBeInstanceOf(Date);
			expect(entity.links[0].updatedAt).toBeInstanceOf(Date);

			// Chat
			expect(result.chatHistory[0].timestamp).toBeInstanceOf(Date);
		});

		it('should not throw when calling .toISOString() on any rehydrated date field', () => {
			// This is the specific crash scenario described in the bug report.
			const raw = makeRawBackup({
				negotiationSessions: [
					makeRawNegotiationSession({ completedAt: ISO_COMPLETED, status: 'completed' })
				],
				respiteSessions: [makeRawRespiteSession()]
			});

			const result = rehydrateBackupDates(raw);

			expect(() => result.exportedAt.toISOString()).not.toThrow();
			expect(() => result.negotiationSessions![0].createdAt.toISOString()).not.toThrow();
			expect(() => result.negotiationSessions![0].updatedAt.toISOString()).not.toThrow();
			expect(() => result.negotiationSessions![0].completedAt!.toISOString()).not.toThrow();
			expect(() => result.negotiationSessions![0].arguments[0].createdAt.toISOString()).not.toThrow();
			expect(() => result.combatSessions![0].createdAt.toISOString()).not.toThrow();
			expect(() => result.combatSessions![0].updatedAt.toISOString()).not.toThrow();
			expect(() => result.combatSessions![0].log[0].timestamp.toISOString()).not.toThrow();
			expect(() => result.montageSessions![0].createdAt.toISOString()).not.toThrow();
			expect(() => result.montageSessions![0].updatedAt.toISOString()).not.toThrow();
			expect(() => result.respiteSessions![0].createdAt.toISOString()).not.toThrow();
			expect(() => result.respiteSessions![0].updatedAt.toISOString()).not.toThrow();
			expect(() => result.respiteSessions![0].kitSwaps[0].createdAt.toISOString()).not.toThrow();
			expect(() => result.entities[0].createdAt.toISOString()).not.toThrow();
			expect(() => result.entities[0].updatedAt.toISOString()).not.toThrow();
			expect(() => result.entities[0].links[0].createdAt!.toISOString()).not.toThrow();
			expect(() => result.entities[0].links[0].updatedAt!.toISOString()).not.toThrow();
			expect(() => result.chatHistory[0].timestamp.toISOString()).not.toThrow();
		});
	});
});
