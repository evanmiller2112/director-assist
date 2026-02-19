/**
 * Tests for Scene Suggestion Service (TDD RED Phase)
 * GitHub Issue #546: Location-based NPC suggestion service
 *
 * This service accepts a location ID and returns suggested NPCs/characters
 * that might plausibly be present at that location, ranked by confidence.
 *
 * Query strategy (layered):
 *   1. Direct: NPCs/characters with `located_at` -> this location,
 *              or location `contains` -> them
 *   2. Indirect (1 hop): NPCs who have relationships (serves, works_for, knows,
 *              member_of) with direct NPCs at the location
 *   3. Sub-locations: NPCs at child locations (`part_of` this location)
 *
 * Confidence levels:
 *   - direct     -> 'high'
 *   - indirect   -> 'medium'
 *   - sub-location -> 'low'
 *
 * RED Phase: These tests MUST FAIL until the service is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	getSceneSuggestions,
	type EntitySuggestion
} from './sceneSuggestionService';
import type { BaseEntity, EntityLink } from '$lib/types';

// ---------------------------------------------------------------------------
// Mock the entityRepository
// ---------------------------------------------------------------------------

vi.mock('$lib/db/repositories/entityRepository', () => ({
	entityRepository: {
		getById: vi.fn(),
		getByIds: vi.fn(),
		getEntitiesLinkingTo: vi.fn(),
		getAllArray: vi.fn()
	}
}));

import { entityRepository } from '$lib/db/repositories/entityRepository';

// ---------------------------------------------------------------------------
// Shared test-entity factory
// ---------------------------------------------------------------------------

function makeEntity(
	overrides: Partial<BaseEntity> & { id: string; name: string; type: BaseEntity['type'] }
): BaseEntity {
	const now = new Date('2025-01-01T00:00:00.000Z');
	return {
		description: '',
		summary: undefined,
		tags: [],
		fields: {},
		links: [],
		notes: '',
		playerVisible: true,
		createdAt: now,
		updatedAt: now,
		metadata: {},
		...overrides
	};
}

function makeLink(overrides: Partial<EntityLink> & { targetId: string; relationship: string }): EntityLink {
	return {
		id: `link-${Math.random().toString(36).slice(2)}`,
		sourceId: 'source-placeholder',
		targetType: 'npc',
		bidirectional: false,
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const LOCATION_ID = 'loc-joes-bar';

const locationEntity = makeEntity({
	id: LOCATION_ID,
	name: "Joe's Bar",
	type: 'location',
	links: []
});

const npcBarkeep = makeEntity({
	id: 'npc-barkeep',
	name: 'Joe the Barkeep',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-barkeep', targetId: LOCATION_ID, targetType: 'location', relationship: 'located_at' })
	]
});

const charPatron = makeEntity({
	id: 'char-patron',
	name: 'Elara the Patron',
	type: 'character',
	links: [
		makeLink({ sourceId: 'char-patron', targetId: LOCATION_ID, targetType: 'location', relationship: 'located_at' })
	]
});

const npcBouncer = makeEntity({
	id: 'npc-bouncer',
	name: 'Brutus the Bouncer',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-bouncer', targetId: 'npc-barkeep', targetType: 'npc', relationship: 'serves' })
	]
});

const npcSupplier = makeEntity({
	id: 'npc-supplier',
	name: 'Marta the Supplier',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-supplier', targetId: 'npc-barkeep', targetType: 'npc', relationship: 'works_for' })
	]
});

const npcFriend = makeEntity({
	id: 'npc-friend',
	name: 'Finn the Friend',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-friend', targetId: 'npc-barkeep', targetType: 'npc', relationship: 'knows' })
	]
});

const npcGuildMember = makeEntity({
	id: 'npc-guild-member',
	name: 'Greta of the Guild',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-guild-member', targetId: 'npc-barkeep', targetType: 'npc', relationship: 'member_of' })
	]
});

const backRoomLocation = makeEntity({
	id: 'loc-back-room',
	name: "Joe's Back Room",
	type: 'location',
	links: [
		makeLink({ sourceId: 'loc-back-room', targetId: LOCATION_ID, targetType: 'location', relationship: 'part_of' })
	]
});

const npcInBackRoom = makeEntity({
	id: 'npc-in-back-room',
	name: 'Shadowy Figure',
	type: 'npc',
	links: [
		makeLink({ sourceId: 'npc-in-back-room', targetId: 'loc-back-room', targetType: 'location', relationship: 'located_at' })
	]
});

const factionEntity = makeEntity({
	id: 'faction-thieves',
	name: "Thieves' Guild",
	type: 'faction',
	links: [
		makeLink({ sourceId: 'faction-thieves', targetId: LOCATION_ID, targetType: 'location', relationship: 'located_at' })
	]
});

// ---------------------------------------------------------------------------
// Helpers to set up common mock responses
// ---------------------------------------------------------------------------

function setupEmptyLocation() {
	vi.mocked(entityRepository.getById).mockResolvedValue(makeEntity({
		id: LOCATION_ID,
		name: "Joe's Bar",
		type: 'location',
		links: []
	}));
	vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
	vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
	vi.mocked(entityRepository.getAllArray).mockResolvedValue([]);
}

function setupDirectNpcsViaLocatedAt() {
	const location = makeEntity({
		id: LOCATION_ID,
		name: "Joe's Bar",
		type: 'location',
		links: []
	});

	vi.mocked(entityRepository.getById).mockResolvedValue(location);

	// entities that link TO the location
	vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([
		npcBarkeep,
		charPatron
	]);

	vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
	vi.mocked(entityRepository.getAllArray).mockResolvedValue([
		location,
		npcBarkeep,
		charPatron
	]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sceneSuggestionService', () => {

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// -------------------------------------------------------------------------
	// Module shape
	// -------------------------------------------------------------------------

	describe('module exports', () => {
		it('should export a getSceneSuggestions function', () => {
			expect(typeof getSceneSuggestions).toBe('function');
		});
	});

	// -------------------------------------------------------------------------
	// Return type shape
	// -------------------------------------------------------------------------

	describe('return type', () => {
		it('should return an array', async () => {
			setupEmptyLocation();
			const result = await getSceneSuggestions(LOCATION_ID);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return EntitySuggestion objects with required fields', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			expect(result.length).toBeGreaterThan(0);

			const suggestion = result[0];
			expect(suggestion).toHaveProperty('entity');
			expect(suggestion).toHaveProperty('reason');
			expect(suggestion).toHaveProperty('confidence');
			expect(suggestion).toHaveProperty('sourceRelationship');
		});

		it('should have a string reason on every suggestion', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			for (const s of result) {
				expect(typeof s.reason).toBe('string');
				expect(s.reason.length).toBeGreaterThan(0);
			}
		});

		it('should have a valid confidence level on every suggestion', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const validLevels = ['high', 'medium', 'low'];
			for (const s of result) {
				expect(validLevels).toContain(s.confidence);
			}
		});

		it('should have a string sourceRelationship on every suggestion', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			for (const s of result) {
				expect(typeof s.sourceRelationship).toBe('string');
			}
		});

		it('should include the full BaseEntity on each suggestion', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion).toBeDefined();
			expect(barkeepSuggestion!.entity.name).toBe('Joe the Barkeep');
			expect(barkeepSuggestion!.entity.type).toBe('npc');
		});
	});

	// -------------------------------------------------------------------------
	// Empty results
	// -------------------------------------------------------------------------

	describe('empty results', () => {
		it('should return an empty array when the location has no linked NPCs', async () => {
			setupEmptyLocation();

			const result = await getSceneSuggestions(LOCATION_ID);

			expect(result).toEqual([]);
		});

		it('should return an empty array when the location does not exist', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(undefined);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([]);

			const result = await getSceneSuggestions('non-existent-location');

			expect(result).toEqual([]);
		});
	});

	// -------------------------------------------------------------------------
	// Layer 1 – Direct NPCs via `located_at` (entity -> location)
	// -------------------------------------------------------------------------

	describe('direct NPCs via located_at relationship', () => {
		it('should suggest an NPC that has `located_at` pointing to the location', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-barkeep');
		});

		it('should suggest a character that has `located_at` pointing to the location', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('char-patron');
		});

		it('should assign confidence high to directly located NPCs', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion!.confidence).toBe('high');
		});

		it('should produce a human-readable reason mentioning the location name', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion!.reason).toMatch(/Joe's Bar/i);
		});

		it('should set sourceRelationship to "located_at" for direct NPCs', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion!.sourceRelationship).toBe('located_at');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 1 – Direct NPCs via `contains` (location -> entity)
	// -------------------------------------------------------------------------

	describe('direct NPCs via contains relationship on the location', () => {
		it('should suggest an NPC that the location `contains`', async () => {
			const locationWithContains = makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: [
					makeLink({
						sourceId: LOCATION_ID,
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'contains'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationWithContains);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([npcBarkeep]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationWithContains, npcBarkeep]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-barkeep');
		});

		it('should assign confidence high to NPCs found via location `contains`', async () => {
			const locationWithContains = makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: [
					makeLink({
						sourceId: LOCATION_ID,
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'contains'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationWithContains);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([npcBarkeep]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationWithContains, npcBarkeep]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion!.confidence).toBe('high');
		});

		it('should set sourceRelationship to "contains" for entities found via location contains', async () => {
			const locationWithContains = makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: [
					makeLink({
						sourceId: LOCATION_ID,
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'contains'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationWithContains);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([npcBarkeep]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationWithContains, npcBarkeep]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSuggestion = result.find(s => s.entity.id === 'npc-barkeep');
			expect(barkeepSuggestion!.sourceRelationship).toBe('contains');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 2 – Indirect NPCs (1-hop) via serves
	// -------------------------------------------------------------------------

	describe('indirect NPCs via serves relationship', () => {
		it('should suggest an NPC that `serves` a direct NPC at the location', async () => {
			setupDirectNpcsViaLocatedAt();

			// npcBouncer serves npcBarkeep
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-bouncer');
		});

		it('should assign confidence medium to NPCs found via indirect serves relationship', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const bouncerSuggestion = result.find(s => s.entity.id === 'npc-bouncer');
			expect(bouncerSuggestion!.confidence).toBe('medium');
		});

		it('should produce a human-readable reason mentioning the direct NPC being served', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const bouncerSuggestion = result.find(s => s.entity.id === 'npc-bouncer');
			// Reason should reference Joe the Barkeep or the relationship
			expect(bouncerSuggestion!.reason).toMatch(/Joe the Barkeep|serves/i);
		});

		it('should set sourceRelationship to "serves" for indirectly linked NPCs', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const bouncerSuggestion = result.find(s => s.entity.id === 'npc-bouncer');
			expect(bouncerSuggestion!.sourceRelationship).toBe('serves');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 2 – Indirect NPCs (1-hop) via works_for
	// -------------------------------------------------------------------------

	describe('indirect NPCs via works_for relationship', () => {
		it('should suggest an NPC that `works_for` a direct NPC at the location', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcSupplier
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-supplier');
		});

		it('should assign confidence medium to NPCs found via works_for', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcSupplier
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const supplierSuggestion = result.find(s => s.entity.id === 'npc-supplier');
			expect(supplierSuggestion!.confidence).toBe('medium');
		});

		it('should set sourceRelationship to "works_for" for relevant indirect NPCs', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcSupplier
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const supplierSuggestion = result.find(s => s.entity.id === 'npc-supplier');
			expect(supplierSuggestion!.sourceRelationship).toBe('works_for');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 2 – Indirect NPCs (1-hop) via knows
	// -------------------------------------------------------------------------

	describe('indirect NPCs via knows relationship', () => {
		it('should suggest an NPC that `knows` a direct NPC at the location', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcFriend
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-friend');
		});

		it('should assign confidence medium to NPCs found via knows', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcFriend
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const friendSuggestion = result.find(s => s.entity.id === 'npc-friend');
			expect(friendSuggestion!.confidence).toBe('medium');
		});

		it('should set sourceRelationship to "knows" for indirect NPCs via knows', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcFriend
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const friendSuggestion = result.find(s => s.entity.id === 'npc-friend');
			expect(friendSuggestion!.sourceRelationship).toBe('knows');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 2 – Indirect NPCs (1-hop) via member_of
	// -------------------------------------------------------------------------

	describe('indirect NPCs via member_of relationship', () => {
		it('should suggest an NPC that is `member_of` a group with a direct NPC at the location', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcGuildMember
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-guild-member');
		});

		it('should assign confidence medium to NPCs found via member_of', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcGuildMember
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const guildSuggestion = result.find(s => s.entity.id === 'npc-guild-member');
			expect(guildSuggestion!.confidence).toBe('medium');
		});

		it('should set sourceRelationship to "member_of" for indirect NPCs via member_of', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcGuildMember
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const guildSuggestion = result.find(s => s.entity.id === 'npc-guild-member');
			expect(guildSuggestion!.sourceRelationship).toBe('member_of');
		});
	});

	// -------------------------------------------------------------------------
	// Layer 3 – Sub-location NPCs via `part_of`
	// -------------------------------------------------------------------------

	describe('sub-location NPCs via part_of relationship', () => {
		it('should suggest an NPC located at a child location that is `part_of` the queried location', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: []
			}));
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-in-back-room');
		});

		it('should assign confidence low to NPCs at sub-locations', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: []
			}));
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const shadowySuggestion = result.find(s => s.entity.id === 'npc-in-back-room');
			expect(shadowySuggestion!.confidence).toBe('low');
		});

		it('should produce a human-readable reason that references the sub-location name', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: []
			}));
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const shadowySuggestion = result.find(s => s.entity.id === 'npc-in-back-room');
			expect(shadowySuggestion!.reason).toMatch(/Back Room|part_of|sub-location/i);
		});

		it('should set sourceRelationship to "part_of" for sub-location NPCs', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(makeEntity({
				id: LOCATION_ID,
				name: "Joe's Bar",
				type: 'location',
				links: []
			}));
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const shadowySuggestion = result.find(s => s.entity.id === 'npc-in-back-room');
			expect(shadowySuggestion!.sourceRelationship).toBe('part_of');
		});
	});

	// -------------------------------------------------------------------------
	// Confidence ordering
	// -------------------------------------------------------------------------

	describe('confidence ordering', () => {
		it('should list high-confidence suggestions before medium-confidence ones', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const confidenceOrder = result.map(s => s.confidence);
			const firstMediumIndex = confidenceOrder.indexOf('medium');
			const lastHighIndex = confidenceOrder.lastIndexOf('high');

			// All 'high' entries must come before all 'medium' entries
			if (firstMediumIndex !== -1 && lastHighIndex !== -1) {
				expect(lastHighIndex).toBeLessThan(firstMediumIndex);
			}
		});

		it('should list medium-confidence suggestions before low-confidence ones', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const confidenceOrder = result.map(s => s.confidence);
			const firstLowIndex = confidenceOrder.indexOf('low');
			const lastMediumIndex = confidenceOrder.lastIndexOf('medium');

			if (firstLowIndex !== -1 && lastMediumIndex !== -1) {
				expect(lastMediumIndex).toBeLessThan(firstLowIndex);
			}
		});
	});

	// -------------------------------------------------------------------------
	// Deduplication
	// -------------------------------------------------------------------------

	describe('deduplication', () => {
		it('should deduplicate an NPC found via both located_at and serves, keeping the higher confidence', async () => {
			// npcBouncer has located_at (direct) AND serves (indirect) pointing to the location
			const bouncerWithBothLinks = makeEntity({
				id: 'npc-bouncer',
				name: 'Brutus the Bouncer',
				type: 'npc',
				links: [
					makeLink({
						sourceId: 'npc-bouncer',
						targetId: LOCATION_ID,
						targetType: 'location',
						relationship: 'located_at'
					}),
					makeLink({
						sourceId: 'npc-bouncer',
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'serves'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([
				npcBarkeep,
				bouncerWithBothLinks
			]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				bouncerWithBothLinks
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			// Should appear exactly once
			const bouncerSuggestions = result.filter(s => s.entity.id === 'npc-bouncer');
			expect(bouncerSuggestions).toHaveLength(1);

			// When found via both direct and indirect, direct (high) should win
			expect(bouncerSuggestions[0].confidence).toBe('high');
		});

		it('should not produce duplicate suggestions for an NPC appearing in two indirect paths', async () => {
			// npcFriend knows both npcBarkeep and charPatron (both direct)
			const friendKnowsTwo = makeEntity({
				id: 'npc-friend',
				name: 'Finn the Friend',
				type: 'npc',
				links: [
					makeLink({
						sourceId: 'npc-friend',
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'knows'
					}),
					makeLink({
						sourceId: 'npc-friend',
						targetId: 'char-patron',
						targetType: 'character',
						relationship: 'knows'
					})
				]
			});

			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				friendKnowsTwo
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const friendSuggestions = result.filter(s => s.entity.id === 'npc-friend');
			expect(friendSuggestions).toHaveLength(1);
		});

		it('should prefer high over medium when deduplicating', async () => {
			// An NPC that is found via indirect path AND direct path
			// The service should keep confidence 'high'
			const npcDoubleFound = makeEntity({
				id: 'npc-double',
				name: 'Double Found NPC',
				type: 'npc',
				links: [
					makeLink({
						sourceId: 'npc-double',
						targetId: LOCATION_ID,
						targetType: 'location',
						relationship: 'located_at'
					}),
					makeLink({
						sourceId: 'npc-double',
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'works_for'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([npcBarkeep, npcDoubleFound]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				npcDoubleFound
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const suggestions = result.filter(s => s.entity.id === 'npc-double');
			expect(suggestions).toHaveLength(1);
			expect(suggestions[0].confidence).toBe('high');
		});

		it('should prefer medium over low when deduplicating', async () => {
			// NPC is both in a sub-location AND serves a direct NPC
			const npcInSubAndIndirect = makeEntity({
				id: 'npc-sub-indirect',
				name: 'Dual Path NPC',
				type: 'npc',
				links: [
					makeLink({
						sourceId: 'npc-sub-indirect',
						targetId: 'loc-back-room',
						targetType: 'location',
						relationship: 'located_at'
					}),
					makeLink({
						sourceId: 'npc-sub-indirect',
						targetId: 'npc-barkeep',
						targetType: 'npc',
						relationship: 'serves'
					})
				]
			});

			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				backRoomLocation,
				npcInSubAndIndirect
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const suggestions = result.filter(s => s.entity.id === 'npc-sub-indirect');
			expect(suggestions).toHaveLength(1);
			expect(suggestions[0].confidence).toBe('medium');
		});
	});

	// -------------------------------------------------------------------------
	// Entity type filtering
	// -------------------------------------------------------------------------

	describe('entity type filtering', () => {
		it('should include entities of type npc in suggestions', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const npcSuggestions = result.filter(s => s.entity.type === 'npc');
			expect(npcSuggestions.length).toBeGreaterThan(0);
		});

		it('should include entities of type character in suggestions', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const characterSuggestions = result.filter(s => s.entity.type === 'character');
			expect(characterSuggestions.length).toBeGreaterThan(0);
		});

		it('should NOT include entities of type faction in suggestions', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([factionEntity]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationEntity, factionEntity]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const factionSuggestions = result.filter(s => s.entity.type === 'faction');
			expect(factionSuggestions).toHaveLength(0);
		});

		it('should NOT include the location entity itself in suggestions', async () => {
			// A location that links to itself via contains (edge case)
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const locationSuggestions = result.filter(s => s.entity.type === 'location');
			expect(locationSuggestions).toHaveLength(0);
		});

		it('should NOT include item entities in suggestions', async () => {
			const itemEntity = makeEntity({
				id: 'item-sword',
				name: 'Enchanted Sword',
				type: 'item',
				links: [
					makeLink({
						sourceId: 'item-sword',
						targetId: LOCATION_ID,
						targetType: 'location',
						relationship: 'located_at'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([itemEntity]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationEntity, itemEntity]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const itemSuggestions = result.filter(s => s.entity.type === 'item');
			expect(itemSuggestions).toHaveLength(0);
		});

		it('should NOT include session entities in suggestions', async () => {
			const sessionEntity = makeEntity({
				id: 'session-1',
				name: 'Session 1',
				type: 'session',
				links: [
					makeLink({
						sourceId: 'session-1',
						targetId: LOCATION_ID,
						targetType: 'location',
						relationship: 'located_at'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([sessionEntity]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([locationEntity, sessionEntity]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const sessionSuggestions = result.filter(s => s.entity.type === 'session');
			expect(sessionSuggestions).toHaveLength(0);
		});
	});

	// -------------------------------------------------------------------------
	// Reason string content
	// -------------------------------------------------------------------------

	describe('reason string', () => {
		it('should include the location name in the reason for directly located entities', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			for (const s of result.filter(x => x.confidence === 'high')) {
				expect(s.reason).toMatch(/Joe's Bar/i);
			}
		});

		it('should include the related NPC name in the reason for indirect entities', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const bouncerSuggestion = result.find(s => s.entity.id === 'npc-bouncer');
			// Must mention either the direct NPC's name or the relationship to make it human-readable
			expect(bouncerSuggestion!.reason).toMatch(/Joe the Barkeep|barkeep|serves/i);
		});

		it('should include the sub-location name in the reason for sub-location entities', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const shadowySuggestion = result.find(s => s.entity.id === 'npc-in-back-room');
			expect(shadowySuggestion!.reason).toMatch(/Back Room/i);
		});
	});

	// -------------------------------------------------------------------------
	// excludeIds optional parameter
	// -------------------------------------------------------------------------

	describe('excludeIds optional parameter', () => {
		it('should exclude NPCs whose IDs are in the excludeIds list', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID, {
				excludeIds: ['npc-barkeep']
			});

			const ids = result.map(s => s.entity.id);
			expect(ids).not.toContain('npc-barkeep');
		});

		it('should still return other NPCs not in the excludeIds list', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID, {
				excludeIds: ['npc-barkeep']
			});

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('char-patron');
		});

		it('should return all NPCs when excludeIds is an empty array', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID, {
				excludeIds: []
			});

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-barkeep');
			expect(ids).toContain('char-patron');
		});

		it('should return all NPCs when excludeIds is omitted', async () => {
			setupDirectNpcsViaLocatedAt();

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);
			expect(ids).toContain('npc-barkeep');
			expect(ids).toContain('char-patron');
		});

		it('should exclude NPCs in the excludeIds list even when found via indirect paths', async () => {
			setupDirectNpcsViaLocatedAt();

			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				charPatron,
				npcBouncer
			]);

			const result = await getSceneSuggestions(LOCATION_ID, {
				excludeIds: ['npc-bouncer']
			});

			const ids = result.map(s => s.entity.id);
			expect(ids).not.toContain('npc-bouncer');
		});
	});

	// -------------------------------------------------------------------------
	// No indirect suggestions from non-NPC/character direct entities
	// -------------------------------------------------------------------------

	describe('indirect hop filtering', () => {
		it('should not follow indirect hops from faction entities found at the location', async () => {
			// Faction is at location; npcGuildMember is member_of the faction
			// The service should NOT include npcGuildMember via faction indirect hop
			// because factions are not npc/character types
			const factionAtLocation = makeEntity({
				id: 'faction-thieves',
				name: "Thieves' Guild",
				type: 'faction',
				links: [
					makeLink({
						sourceId: 'faction-thieves',
						targetId: LOCATION_ID,
						targetType: 'location',
						relationship: 'located_at'
					})
				]
			});

			const npcMemberOfFaction = makeEntity({
				id: 'npc-thief',
				name: 'The Thief',
				type: 'npc',
				links: [
					makeLink({
						sourceId: 'npc-thief',
						targetId: 'faction-thieves',
						targetType: 'faction',
						relationship: 'member_of'
					})
				]
			});

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([factionAtLocation]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				factionAtLocation,
				npcMemberOfFaction
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			// npcMemberOfFaction should NOT be suggested because
			// indirect hops are only performed from npc/character direct entities
			const ids = result.map(s => s.entity.id);
			expect(ids).not.toContain('npc-thief');
		});
	});

	// -------------------------------------------------------------------------
	// Multiple suggestions from all three layers simultaneously
	// -------------------------------------------------------------------------

	describe('all three layers combined', () => {
		it('should return suggestions from all three layers when applicable', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([npcBarkeep]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				npcBouncer,     // serves npcBarkeep -> indirect
				backRoomLocation, // part_of locationEntity -> sub-location
				npcInBackRoom   // located_at backRoomLocation -> sub-location NPC
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const ids = result.map(s => s.entity.id);

			// Direct
			expect(ids).toContain('npc-barkeep');

			// Indirect
			expect(ids).toContain('npc-bouncer');

			// Sub-location
			expect(ids).toContain('npc-in-back-room');
		});

		it('should have correct confidence for each layer in a combined result', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([npcBarkeep]);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([
				locationEntity,
				npcBarkeep,
				npcBouncer,
				backRoomLocation,
				npcInBackRoom
			]);

			const result = await getSceneSuggestions(LOCATION_ID);

			const barkeepSugg = result.find(s => s.entity.id === 'npc-barkeep');
			const bouncerSugg = result.find(s => s.entity.id === 'npc-bouncer');
			const shadowySugg = result.find(s => s.entity.id === 'npc-in-back-room');

			expect(barkeepSugg!.confidence).toBe('high');
			expect(bouncerSugg!.confidence).toBe('medium');
			expect(shadowySugg!.confidence).toBe('low');
		});
	});
});
