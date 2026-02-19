/**
 * Integration Tests: Repository Validation (Issue #504) - TDD RED Phase
 *
 * These tests verify that runtime schema validation is properly integrated into
 * every repository that reads from or writes to IndexedDB. They are written
 * BEFORE the implementation exists, so they will fail until the GREEN phase.
 *
 * Validation contract under test:
 *   - WRITE (create / update): validateForWrite() must be called before the DB
 *     call. If the data is invalid the repository method must throw.
 *   - READ (getById / getAllArray): validateForRead() / validateArrayForRead()
 *     must be called after the DB call. Invalid data is returned immediately
 *     but a console.warn is emitted asynchronously via queueMicrotask.
 *   - IMPORT (backup): validateArrayForImport() must be called. Errors are
 *     collected into a result object — the function never throws.
 *
 * Testing strategy:
 *   1. Write validation – supply data that violates a required schema field and
 *      assert the repository method rejects.
 *   2. Read validation – bypass the repository to insert malformed data directly
 *      into the Dexie table, then call the repository reader and assert that
 *      (a) data is still returned and (b) console.warn fires asynchronously.
 *   3. Import validation – exercise the backup schema path with mixed
 *      valid/invalid entity arrays and verify the error collection behaviour.
 *
 * Each describe block is self-contained: it opens/closes the DB once and
 * truncates affected tables before every individual test.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { db } from '$lib/db';
import { entityRepository } from '$lib/db/repositories/entityRepository';
import { chatRepository } from '$lib/db/repositories/chatRepository';
import { conversationRepository } from '$lib/db/repositories/conversationRepository';
import { combatRepository } from '$lib/db/repositories/combatRepository';
import { montageRepository } from '$lib/db/repositories/montageRepository';
import { negotiationRepository } from '$lib/db/repositories/negotiationRepository';
import { respiteRepository } from '$lib/db/repositories/respiteRepository';
import { appConfigRepository } from '$lib/db/repositories/appConfigRepository';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

// ---------------------------------------------------------------------------
// Helper: flush the microtask queue so queueMicrotask callbacks run
// ---------------------------------------------------------------------------
function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// WRITE VALIDATION — create() / update() must throw on invalid data
// ---------------------------------------------------------------------------

describe('Write Validation Integration', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.conversations.clear();
		await db.combatSessions.clear();
		await db.montageSessions.clear();
		await db.negotiationSessions.clear();
		await db.respiteSessions.clear();
		await db.appConfig.clear();
	});

	// -----------------------------------------------------------------------
	// entityRepository
	// -----------------------------------------------------------------------

	describe('entityRepository.create', () => {
		it('should throw when name is an empty string', async () => {
			// BaseEntitySchema enforces name: pipe(string(), minLength(1))
			await expect(
				entityRepository.create({
					type: 'character',
					name: '',           // violates minLength(1)
					description: 'A mysterious figure',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					metadata: {}
				})
			).rejects.toThrow();
		});

		it('should throw with a message that identifies the validation context', async () => {
			await expect(
				entityRepository.create({
					type: 'character',
					name: '',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					metadata: {}
				})
			).rejects.toThrow(/validation/i);
		});

		it('should succeed when all required fields are valid', async () => {
			const entity = await entityRepository.create({
				type: 'character',
				name: 'Aldric the Brave',
				description: 'A seasoned knight',
				tags: ['hero'],
				fields: {},
				links: [],
				notes: '',
				metadata: {}
			});

			expect(entity.id).toBeDefined();
			expect(entity.name).toBe('Aldric the Brave');
		});
	});

	describe('entityRepository.update', () => {
		it('should throw when update sets name to an empty string', async () => {
			// Insert a valid entity first, then attempt an invalid update
			const entity = await entityRepository.create({
				type: 'location',
				name: 'Thornwall Keep',
				description: 'An ancient fortress',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				metadata: {}
			});

			// Attempting to update name to '' should fail schema validation
			await expect(
				entityRepository.update(entity.id, { name: '' })
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// chatRepository
	// -----------------------------------------------------------------------

	describe('chatRepository.add', () => {
		it('should persist a valid user message without throwing', async () => {
			const message = await chatRepository.add('user', 'Tell me about the dungeon.');

			expect(message.id).toBeDefined();
			expect(message.role).toBe('user');
			expect(message.content).toBe('Tell me about the dungeon.');
		});

		it('should persist a valid assistant message without throwing', async () => {
			const message = await chatRepository.add('assistant', 'The dungeon lies to the north.');

			expect(message.role).toBe('assistant');
		});

		it('should throw when role is not "user" or "assistant"', async () => {
			// ChatMessageSchema enforces role: union([literal('user'), literal('assistant')])
			await expect(
				// Intentionally bypass TypeScript via cast to simulate runtime bad data
				chatRepository.add('narrator' as 'user', 'Out-of-character comment')
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// conversationRepository
	// -----------------------------------------------------------------------

	describe('conversationRepository.create', () => {
		it('should persist a valid conversation without throwing', async () => {
			const conversation = await conversationRepository.create('Campaign Session 1');

			expect(conversation.id).toBeDefined();
			expect(conversation.name).toBe('Campaign Session 1');
		});
	});

	// -----------------------------------------------------------------------
	// combatRepository
	// -----------------------------------------------------------------------

	describe('combatRepository.create', () => {
		it('should succeed with a valid minimal input', async () => {
			const combat = await combatRepository.create({ name: 'Ambush at the Bridge' });

			expect(combat.id).toBeDefined();
			expect(combat.status).toBe('preparing');
		});

		it('should throw when name is an empty string', async () => {
			// CombatSessionSchema has name: string() — the repository should
			// validate before writing; an empty name should be rejected.
			await expect(
				combatRepository.create({ name: '' })
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// montageRepository
	// -----------------------------------------------------------------------

	describe('montageRepository.create', () => {
		it('should succeed with valid difficulty and playerCount', async () => {
			const montage = await montageRepository.create({
				name: 'The Great Escape',
				difficulty: 'moderate',
				playerCount: 4
			});

			expect(montage.id).toBeDefined();
			expect(montage.difficulty).toBe('moderate');
		});

		it('should throw when name is an empty string', async () => {
			await expect(
				montageRepository.create({
					name: '',
					difficulty: 'easy',
					playerCount: 3
				})
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// negotiationRepository
	// -----------------------------------------------------------------------

	describe('negotiationRepository.create', () => {
		it('should succeed with valid negotiation input', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Trade Agreement',
				npcName: 'Merchant Voss',
				motivations: [],
				pitfalls: []
			});

			expect(negotiation.id).toBeDefined();
			expect(negotiation.npcName).toBe('Merchant Voss');
			expect(negotiation.interest).toBe(2);
			expect(negotiation.patience).toBe(5);
		});

		it('should throw when name is an empty string', async () => {
			await expect(
				negotiationRepository.create({
					name: '',
					npcName: 'Merchant Voss',
					motivations: [],
					pitfalls: []
				})
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// respiteRepository
	// -----------------------------------------------------------------------

	describe('respiteRepository.create', () => {
		it('should succeed with valid respite input', async () => {
			const respite = await respiteRepository.create({ name: 'Rest at the Waypoint' });

			expect(respite.id).toBeDefined();
			expect(respite.status).toBe('preparing');
		});

		it('should throw when name is an empty string', async () => {
			await expect(
				respiteRepository.create({ name: '' })
			).rejects.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// appConfigRepository
	// -----------------------------------------------------------------------

	describe('appConfigRepository.set', () => {
		it('should persist a valid key-value pair without throwing', async () => {
			// AppConfigSchema: { key: string(), value: unknown() }
			await expect(
				appConfigRepository.set('activeCampaignId', 'campaign-abc-123')
			).resolves.not.toThrow();

			const stored = await appConfigRepository.get<string>('activeCampaignId');
			expect(stored).toBe('campaign-abc-123');
		});
	});
});

// ---------------------------------------------------------------------------
// READ VALIDATION — reads return data immediately; warn fires asynchronously
// ---------------------------------------------------------------------------

describe('Read Validation Integration', () => {
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();
		consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(async () => {
		await db.entities.clear();
		consoleWarnSpy.mockRestore();
	});

	// -----------------------------------------------------------------------
	// entityRepository.getById
	// -----------------------------------------------------------------------

	describe('entityRepository.getById', () => {
		it('should return data even when the stored entity violates the schema', async () => {
			// Insert malformed data directly into Dexie, bypassing the repository
			const badEntity = {
				id: 'bad-entity-1',
				type: 'character',
				name: '',          // violates minLength(1)
				description: 'Corrupted record',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(badEntity as unknown as BaseEntity);

			// Read through the repository — should NOT throw
			const result = await entityRepository.getById('bad-entity-1');

			// Data is returned despite the violation (non-blocking read semantics)
			expect(result).toBeDefined();
			expect(result!.id).toBe('bad-entity-1');
		});

		it('should emit console.warn asynchronously for an invalid entity', async () => {
			const badEntity = {
				id: 'bad-entity-warn',
				type: 'character',
				name: '',          // violates minLength(1)
				description: 'Bad data',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(badEntity as unknown as BaseEntity);

			await entityRepository.getById('bad-entity-warn');

			// warn should NOT have been called synchronously
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			// Flush the microtask queue and verify the deferred warn fires
			await flushMicrotasks();
			expect(consoleWarnSpy).toHaveBeenCalled();
		});

		it('should NOT emit console.warn for a valid entity', async () => {
			const goodEntity = createMockEntity({ id: 'good-entity-1', name: 'Lyria' });
			await db.entities.add(goodEntity);

			await entityRepository.getById('good-entity-1');
			await flushMicrotasks();

			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});
	});

	// -----------------------------------------------------------------------
	// entityRepository.getAllArray
	// -----------------------------------------------------------------------

	describe('entityRepository.getAllArray', () => {
		it('should return all entities including those that violate the schema', async () => {
			const goodEntity = createMockEntity({ id: 'good-1', name: 'Lyria' });
			const badEntity = {
				id: 'bad-1',
				type: 'character',
				name: '',          // violates minLength(1)
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			await db.entities.add(goodEntity);
			await db.entities.add(badEntity as unknown as BaseEntity);

			const results = await entityRepository.getAllArray();

			// Both records are returned — read validation never drops data
			expect(results).toHaveLength(2);
		});

		it('should emit console.warn for each invalid entity in the array', async () => {
			const good = createMockEntity({ id: 'good-array', name: 'Theron' });
			const bad1 = { ...createMockEntity({ id: 'bad-array-1' }), name: '' };
			const bad2 = { ...createMockEntity({ id: 'bad-array-2' }), name: '' };

			await db.entities.add(good);
			await db.entities.add(bad1 as unknown as BaseEntity);
			await db.entities.add(bad2 as unknown as BaseEntity);

			await entityRepository.getAllArray();

			// Synchronous call should not have triggered warns yet
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			await flushMicrotasks();

			// One warn per invalid item — two bad entities means two warns
			expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
		});

		it('should NOT emit console.warn when all entities are valid', async () => {
			await db.entities.add(createMockEntity({ id: 'valid-a', name: 'Aldric' }));
			await db.entities.add(createMockEntity({ id: 'valid-b', name: 'Soren' }));

			await entityRepository.getAllArray();
			await flushMicrotasks();

			expect(consoleWarnSpy).not.toHaveBeenCalled();
		});
	});
});

// ---------------------------------------------------------------------------
// IMPORT VALIDATION — backup import collects errors without throwing
// ---------------------------------------------------------------------------

describe('Import Validation Integration', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();
	});

	/**
	 * The backup/import path is exercised through the same validation layer
	 * (validateArrayForImport). These tests confirm the integration of that
	 * layer with the entity data model by constructing backup payloads that
	 * contain known-invalid entries.
	 *
	 * NOTE: If the project exposes a dedicated importBackup() function on a
	 * repository or service, use that instead. For now these tests target the
	 * validation utility directly with realistic backup payloads to establish
	 * the contract that future repository integration must satisfy.
	 */

	it('should collect errors for invalid entities without throwing', async () => {
		const { validateArrayForImport } = await import('$lib/db/validation');
		const { BaseEntitySchema } = await import('$lib/db/schemas/entitySchemas');

		const now = new Date();

		const validEntity = createMockEntity({ id: 'import-good-1', name: 'Caelum' });
		const invalidEntity = {
			id: 'import-bad-1',
			type: 'character',
			name: '',          // violates minLength(1)
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: now,
			updatedAt: now,
			metadata: {}
		};

		const result = validateArrayForImport(BaseEntitySchema, [validEntity, invalidEntity], 'Importing entities');

		// Never throws — returns a structured result
		expect(result.totalCount).toBe(2);
		expect(result.validCount).toBe(1);
		expect(result.errorCount).toBe(1);
		expect(result.errors).toHaveLength(1);
		expect(result.validItems).toHaveLength(1);
		expect(result.validItems[0].name).toBe('Caelum');
	});

	it('should report zero errors when all entities in the backup are valid', async () => {
		const { validateArrayForImport } = await import('$lib/db/validation');
		const { BaseEntitySchema } = await import('$lib/db/schemas/entitySchemas');

		const entities = [
			createMockEntity({ id: 'import-v1', name: 'Riven' }),
			createMockEntity({ id: 'import-v2', name: 'Mira' }),
			createMockEntity({ id: 'import-v3', name: 'Dax' })
		];

		const result = validateArrayForImport(BaseEntitySchema, entities, 'Importing valid entities');

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((result as any).valid).toBeUndefined(); // validateArrayForImport has no top-level `valid` flag
		expect(result.errorCount).toBe(0);
		expect(result.validCount).toBe(3);
		expect(result.errors).toHaveLength(0);
	});

	it('should include entity index in each error message', async () => {
		const { validateArrayForImport } = await import('$lib/db/validation');
		const { BaseEntitySchema } = await import('$lib/db/schemas/entitySchemas');

		const now = new Date();

		const entities = [
			createMockEntity({ id: 'idx-good', name: 'Good' }),
			// index 1 — invalid
			{
				id: 'idx-bad-1',
				type: 'character',
				name: '',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: now,
				updatedAt: now,
				metadata: {}
			},
			createMockEntity({ id: 'idx-good-2', name: 'AlsoGood' }),
			// index 3 — invalid
			{
				id: 'idx-bad-2',
				type: 'location',
				name: '',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: now,
				updatedAt: now,
				metadata: {}
			}
		];

		const result = validateArrayForImport(BaseEntitySchema, entities, 'Index check');

		expect(result.errorCount).toBe(2);

		const combinedErrors = result.errors.join(' ');
		expect(combinedErrors).toMatch(/index.*1/i);
		expect(combinedErrors).toMatch(/index.*3/i);
	});

	it('should handle an empty backup array gracefully', async () => {
		const { validateArrayForImport } = await import('$lib/db/validation');
		const { BaseEntitySchema } = await import('$lib/db/schemas/entitySchemas');

		const result = validateArrayForImport(BaseEntitySchema, [], 'Empty backup');

		expect(result.totalCount).toBe(0);
		expect(result.validCount).toBe(0);
		expect(result.errorCount).toBe(0);
		expect(result.validItems).toEqual([]);
		expect(result.errors).toEqual([]);
	});
});
