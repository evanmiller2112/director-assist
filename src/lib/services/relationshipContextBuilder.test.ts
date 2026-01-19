/**
 * Tests for Relationship Context Builder Service (TDD RED Phase)
 *
 * Covers:
 * - buildRelationshipContext returns correct structure
 * - Outgoing/incoming/both relationship directions
 * - maxRelatedEntities and maxCharacters limits
 * - Privacy protection (exclude hidden fields, never include secrets)
 * - Filtering by relationshipTypes and entityTypes
 * - formatRelatedEntityEntry produces correct format
 * - Statistics calculation (getRelationshipContextStats)
 * - Edge cases: non-existent entity, no relationships, circular relationships
 * - Depth traversal (maxDepth)
 * - includeStrength and includeNotes options
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	buildRelationshipContext,
	formatRelatedEntityEntry,
	formatRelationshipContextForPrompt,
	getRelationshipContextStats,
	buildPrivacySafeSummary,
	type RelationshipContextOptions,
	type RelatedEntityContext,
	type RelationshipContext,
	type RelationshipContextStats
} from './relationshipContextBuilder';
import type { BaseEntity, EntityId, EntityType } from '$lib/types';

// Mock the entity repository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getById: vi.fn(),
		getByIds: vi.fn(),
		getEntitiesLinkingTo: vi.fn()
	}
}));

import { entityRepository } from '$lib/db/repositories';

describe('relationshipContextBuilder', () => {
	// Test data setup
	let sourceEntity: BaseEntity;
	let relatedFaction: BaseEntity;
	let relatedLocation: BaseEntity;
	let relatedNPC: BaseEntity;
	let relatedCharacter: BaseEntity;

	beforeEach(() => {
		vi.clearAllMocks();

		// Set default mocks to return empty arrays (tests can override with mockResolvedValueOnce)
		vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
		vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

		// Source entity - a character with multiple relationships
		sourceEntity = {
			id: 'char-001',
			type: 'character',
			name: 'Aldric the Brave',
			description: 'A noble knight from the northern kingdoms',
			summary: 'Noble knight seeking to restore honor to his family',
			tags: ['hero', 'knight'],
			fields: {
				class: 'Fighter',
				level: 5,
				alignment: 'Lawful Good',
				secrets: 'Has a hidden fear of dark magic' // Should be excluded from context
			},
			links: [
				{
					id: 'link-001',
					sourceId: 'char-001',
					targetId: 'faction-001',
					targetType: 'faction',
					relationship: 'member_of',
					bidirectional: false,
					strength: 'strong',
					notes: 'Sworn oath to defend the order'
				},
				{
					id: 'link-002',
					sourceId: 'char-001',
					targetId: 'loc-001',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false,
					strength: 'moderate'
				},
				{
					id: 'link-003',
					sourceId: 'char-001',
					targetId: 'npc-001',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: true,
					strength: 'weak',
					notes: 'Met during the battle of Stormwatch'
				}
			],
			notes: 'Player character in the main campaign',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-15'),
			metadata: {}
		};

		// Related entities
		relatedFaction = {
			id: 'faction-001',
			type: 'faction',
			name: 'Order of the Silver Dragon',
			description: 'An ancient order of knights dedicated to protecting the realm',
			summary: 'Ancient knightly order protecting the realm from darkness',
			tags: ['knights', 'lawful-good'],
			fields: {
				headquarters: 'Dragonspire Keep',
				foundedYear: 1423,
				secrets: 'The order is secretly funded by a dragon' // Should be excluded
			},
			links: [],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};

		relatedLocation = {
			id: 'loc-001',
			type: 'location',
			name: 'Stormwatch Keep',
			description: 'A fortress on the northern border',
			summary: 'Fortress guarding the northern border against invaders',
			tags: ['fortress', 'military'],
			fields: {
				region: 'Northern Marches',
				population: 500
			},
			links: [],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};

		relatedNPC = {
			id: 'npc-001',
			type: 'npc',
			name: 'Captain Roderick',
			description: 'A grizzled veteran of many battles',
			summary: 'Veteran soldier and mentor to young knights',
			tags: ['soldier', 'mentor'],
			fields: {
				role: 'Guard Captain',
				personality: 'Stern but fair',
				secrets: 'Once failed to protect a noble' // Should be excluded
			},
			links: [
				{
					id: 'link-004',
					sourceId: 'npc-001',
					targetId: 'char-001',
					targetType: 'character',
					relationship: 'knows',
					bidirectional: true
				}
			],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};

		relatedCharacter = {
			id: 'char-002',
			type: 'character',
			name: 'Lyra Shadowstep',
			description: 'A mysterious rogue with a hidden past',
			summary: 'Rogue seeking redemption for past mistakes',
			tags: ['rogue', 'secretive'],
			fields: {
				class: 'Rogue',
				level: 4
			},
			links: [],
			notes: '',
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: {}
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('buildRelationshipContext', () => {
		describe('Core Functionality', () => {
			it('should return correct structure with basic relationship data', async () => {
				// Mock repository methods
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result).toBeDefined();
				expect(result.sourceEntityId).toBe('char-001');
				expect(result.sourceEntityName).toBe('Aldric the Brave');
				expect(result.relatedEntities).toBeInstanceOf(Array);
				expect(result.totalCharacters).toBeGreaterThan(0);
				expect(typeof result.truncated).toBe('boolean');
			});

			it('should include all outgoing relationships by default', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				// Should have 3 outgoing relationships
				expect(result.relatedEntities.length).toBeGreaterThanOrEqual(3);
				expect(result.relatedEntities.some((r) => r.entityId === 'faction-001')).toBe(true);
				expect(result.relatedEntities.some((r) => r.entityId === 'loc-001')).toBe(true);
				expect(result.relatedEntities.some((r) => r.entityId === 'npc-001')).toBe(true);
			});

			it('should populate RelatedEntityContext with required fields', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry).toBeDefined();
				expect(entry?.relationship).toBe('member_of');
				expect(entry?.entityId).toBe('faction-001');
				expect(entry?.entityType).toBe('faction');
				expect(entry?.name).toBe('Order of the Silver Dragon');
				expect(entry?.summary).toBeDefined();
				expect(entry?.direction).toBe('outgoing');
				expect(entry?.depth).toBe(1);
			});
		});

		describe('Direction Filtering', () => {
			it('should return only outgoing relationships when direction=outgoing', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					direction: 'outgoing'
				});

				expect(result.relatedEntities.every((r) => r.direction === 'outgoing')).toBe(true);
			});

			it('should return only incoming relationships when direction=incoming', async () => {
				// Mock incoming relationships
				const incomingEntity: BaseEntity = {
					...relatedCharacter,
					links: [
						{
							id: 'link-005',
							sourceId: 'char-002',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'allies_with',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				// No getByIds mock needed - direction='incoming' doesn't process outgoing links
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([incomingEntity]);

				const result = await buildRelationshipContext('char-001', {
					direction: 'incoming'
				});

				expect(result.relatedEntities.every((r) => r.direction === 'incoming')).toBe(true);
			});

			it('should return both incoming and outgoing when direction=both', async () => {
				const incomingEntity: BaseEntity = {
					...relatedCharacter,
					links: [
						{
							id: 'link-005',
							sourceId: 'char-002',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'allies_with',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([incomingEntity]);

				const result = await buildRelationshipContext('char-001', {
					direction: 'both'
				});

				const hasOutgoing = result.relatedEntities.some((r) => r.direction === 'outgoing');
				const hasIncoming = result.relatedEntities.some((r) => r.direction === 'incoming');
				expect(hasOutgoing).toBe(true);
				expect(hasIncoming).toBe(true);
			});

			it('should default to both directions when direction not specified', async () => {
				const incomingEntity: BaseEntity = {
					...relatedCharacter,
					links: [
						{
							id: 'link-005',
							sourceId: 'char-002',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'allies_with',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([incomingEntity]);

				const result = await buildRelationshipContext('char-001');

				const hasOutgoing = result.relatedEntities.some((r) => r.direction === 'outgoing');
				const hasIncoming = result.relatedEntities.some((r) => r.direction === 'incoming');
				expect(hasOutgoing).toBe(true);
				expect(hasIncoming).toBe(true);
			});
		});

		describe('Entity Limits', () => {
			it('should respect maxRelatedEntities limit', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxRelatedEntities: 2
				});

				expect(result.relatedEntities.length).toBeLessThanOrEqual(2);
			});

			it('should use default maxRelatedEntities of 20 when not specified', async () => {
				// Create source with many relationships
				const manyLinks = Array.from({ length: 30 }, (_, i) => ({
					id: `link-${i}`,
					sourceId: 'char-001',
					targetId: `entity-${i}`,
					targetType: 'npc' as EntityType,
					relationship: 'knows',
					bidirectional: false
				}));

				const sourceWithMany = { ...sourceEntity, links: manyLinks };
				const manyEntities = Array.from({ length: 30 }, (_, i) => ({
					...relatedNPC,
					id: `entity-${i}`,
					name: `Entity ${i}`
				}));

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithMany);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce(manyEntities);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result.relatedEntities.length).toBeLessThanOrEqual(20);
			});

			it('should set truncated=true when entities exceed maxRelatedEntities', async () => {
				const manyLinks = Array.from({ length: 10 }, (_, i) => ({
					id: `link-${i}`,
					sourceId: 'char-001',
					targetId: `entity-${i}`,
					targetType: 'npc' as EntityType,
					relationship: 'knows',
					bidirectional: false
				}));

				const sourceWithMany = { ...sourceEntity, links: manyLinks };
				const manyEntities = Array.from({ length: 10 }, (_, i) => ({
					...relatedNPC,
					id: `entity-${i}`,
					name: `Entity ${i}`
				}));

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithMany);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce(manyEntities);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxRelatedEntities: 5
				});

				expect(result.truncated).toBe(true);
			});

			it('should set truncated=false when entities within limit', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxRelatedEntities: 10
				});

				expect(result.truncated).toBe(false);
			});
		});

		describe('Character Limit', () => {
			it('should respect maxCharacters limit', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxCharacters: 500
				});

				expect(result.totalCharacters).toBeLessThanOrEqual(500);
			});

			it('should use default maxCharacters of 4000 when not specified', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result.totalCharacters).toBeLessThanOrEqual(4000);
			});

			it('should set truncated=true when character limit reached', async () => {
				// Create entities with very long summaries
				const longFaction = {
					...relatedFaction,
					summary: 'A'.repeat(3000)
				};
				const longLocation = {
					...relatedLocation,
					summary: 'B'.repeat(3000)
				};

				// Create source entity with links to these two entities only
				const sourceWithTwoLinks: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-001',
							sourceId: 'char-001',
							targetId: 'faction-001',
							targetType: 'faction',
							relationship: 'member_of',
							bidirectional: false
						},
						{
							id: 'link-002',
							sourceId: 'char-001',
							targetId: 'loc-001',
							targetType: 'location',
							relationship: 'located_at',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithTwoLinks);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([longFaction, longLocation]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxCharacters: 1000
				});

				expect(result.truncated).toBe(true);
			});

			it('should truncate entities to fit within character limit', async () => {
				const longFaction = {
					...relatedFaction,
					summary: 'A'.repeat(3000)
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([longFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxCharacters: 500
				});

				expect(result.totalCharacters).toBeLessThanOrEqual(500);
				expect(result.relatedEntities.length).toBeGreaterThan(0); // Should include at least one
			});
		});

		describe('Privacy Protection', () => {
			it('should exclude hidden section fields from summaries', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const factionEntry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(factionEntry?.summary).toBeDefined();
				// Summary should not contain the secret
				expect(factionEntry?.summary.toLowerCase()).not.toContain('funded by a dragon');
			});

			it('should never include fields named "secrets" in context', async () => {
				// Create source entity with only the npc link
				const sourceWithNPCLink: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-003',
							sourceId: 'char-001',
							targetId: 'npc-001',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: true
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithNPCLink);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedNPC]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const npcEntry = result.relatedEntities.find((r) => r.entityId === 'npc-001');
				expect(npcEntry?.summary).toBeDefined();
				expect(npcEntry?.summary.toLowerCase()).not.toContain('failed to protect');
			});

			it('should exclude notes field from related entity context', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					includeNotes: false
				});

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry?.notes).toBeUndefined();
			});

			it('should include notes when includeNotes=true', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					includeNotes: true
				});

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				// Note: this tests the link notes, not entity notes
				if (entry && sourceEntity.links.find((l) => l.targetId === 'faction-001')?.notes) {
					expect(entry.notes).toBeDefined();
				}
			});
		});

		describe('Relationship Type Filtering', () => {
			it('should filter by single relationship type', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					relationshipTypes: ['member_of']
				});

				expect(result.relatedEntities.every((r) => r.relationship === 'member_of')).toBe(true);
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should filter by multiple relationship types', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					relationshipTypes: ['member_of', 'located_at']
				});

				expect(
					result.relatedEntities.every(
						(r) => r.relationship === 'member_of' || r.relationship === 'located_at'
					)
				).toBe(true);
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should return empty array when no relationships match filter', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					relationshipTypes: ['nonexistent_relationship']
				});

				expect(result.relatedEntities.length).toBe(0);
			});
		});

		describe('Entity Type Filtering', () => {
			it('should filter by single entity type', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					entityTypes: ['faction']
				});

				expect(result.relatedEntities.every((r) => r.entityType === 'faction')).toBe(true);
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should filter by multiple entity types', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					entityTypes: ['faction', 'location']
				});

				expect(
					result.relatedEntities.every(
						(r) => r.entityType === 'faction' || r.entityType === 'location'
					)
				).toBe(true);
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should return empty array when no entity types match filter', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					entityTypes: ['item', 'encounter']
				});

				expect(result.relatedEntities.length).toBe(0);
			});
		});

		describe('Combined Filtering', () => {
			it('should apply both relationship type and entity type filters', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					relationshipTypes: ['member_of', 'located_at'],
					entityTypes: ['faction']
				});

				// Should only return faction with member_of relationship
				expect(result.relatedEntities.every((r) => r.entityType === 'faction')).toBe(true);
				expect(result.relatedEntities.every((r) => r.relationship === 'member_of')).toBe(true);
			});

			it('should apply all filters together (type, entity, direction)', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					relationshipTypes: ['member_of'],
					entityTypes: ['faction'],
					direction: 'outgoing'
				});

				expect(result.relatedEntities.length).toBeGreaterThan(0);
				expect(result.relatedEntities[0].entityType).toBe('faction');
				expect(result.relatedEntities[0].relationship).toBe('member_of');
				expect(result.relatedEntities[0].direction).toBe('outgoing');
			});
		});

		describe('Relationship Strength', () => {
			it('should include strength when includeStrength=true', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					includeStrength: true
				});

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry?.strength).toBeDefined();
				expect(entry?.strength).toBe('strong');
			});

			it('should exclude strength when includeStrength=false', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					includeStrength: false
				});

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry?.strength).toBeUndefined();
			});

			it('should default to excluding strength when not specified', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedFaction]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry?.strength).toBeUndefined();
			});
		});

		describe('Depth Traversal', () => {
			it('should only include depth 1 relationships when maxDepth=1', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxDepth: 1
				});

				expect(result.relatedEntities.every((r) => r.depth === 1)).toBe(true);
			});

			it('should default to maxDepth=1 when not specified', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					relatedNPC
				]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result.relatedEntities.every((r) => r.depth === 1)).toBe(true);
			});

			it('should include depth 2 relationships when maxDepth=2', async () => {
				// Create a depth-2 relationship chain
				// char-001 -> npc-001 -> char-002
				const npcWithLinks: BaseEntity = {
					...relatedNPC,
					links: [
						{
							id: 'link-004',
							sourceId: 'npc-001',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'knows',
							bidirectional: true
						},
						{
							id: 'link-006',
							sourceId: 'npc-001',
							targetId: 'char-002',
							targetType: 'character',
							relationship: 'mentors',
							bidirectional: false
						}
					]
				};

				// Source entity with simplified links for testing
				const sourceForDepth: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-001',
							sourceId: 'char-001',
							targetId: 'faction-001',
							targetType: 'faction',
							relationship: 'member_of',
							bidirectional: false
						},
						{
							id: 'link-002',
							sourceId: 'char-001',
							targetId: 'loc-001',
							targetType: 'location',
							relationship: 'located_at',
							bidirectional: false
						},
						{
							id: 'link-003',
							sourceId: 'char-001',
							targetId: 'npc-001',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: true
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceForDepth);
				// First call for depth 0 -> depth 1 (sourceEntity's links)
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([
					relatedFaction,
					relatedLocation,
					npcWithLinks
				]);
				// Call for npc's links (depth 1 -> depth 2) - npc has a link to char-002
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([relatedCharacter]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxDepth: 2
				});

				const hasDepth1 = result.relatedEntities.some((r) => r.depth === 1);
				const hasDepth2 = result.relatedEntities.some((r) => r.depth === 2);
				expect(hasDepth1).toBe(true);
				expect(hasDepth2).toBe(true);
			});

			it('should respect maxDepth limit even with circular references', async () => {
				// Create circular reference: char-001 -> npc-001 -> char-001
				const npcWithCircular: BaseEntity = {
					...relatedNPC,
					links: [
						{
							id: 'link-004',
							sourceId: 'npc-001',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'knows',
							bidirectional: true
						},
						{
							id: 'link-007',
							sourceId: 'npc-001',
							targetId: 'char-001',
							targetType: 'character',
							relationship: 'mentored_by',
							bidirectional: false
						}
					]
				};

				// Source entity with just one link to npc
				const sourceWithNPC: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-003',
							sourceId: 'char-001',
							targetId: 'npc-001',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: true
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithNPC);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([npcWithCircular]);
				// NPC tries to link back to char-001, which should be skipped
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([sourceWithNPC]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001', {
					maxDepth: 2
				});

				// Should not infinitely recurse
				expect(result.relatedEntities.length).toBeGreaterThan(0);
				expect(result.relatedEntities.every((r) => r.depth <= 2)).toBe(true);
			});
		});

		describe('Edge Cases', () => {
			it('should handle non-existent entity gracefully', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(undefined);

				await expect(buildRelationshipContext('nonexistent-id')).rejects.toThrow();
			});

			it('should handle entity with no relationships', async () => {
				const isolatedEntity: BaseEntity = {
					...sourceEntity,
					links: []
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(isolatedEntity);
				// No getByIds mock needed - entity has no links
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result.sourceEntityId).toBe('char-001');
				expect(result.relatedEntities.length).toBe(0);
				expect(result.truncated).toBe(false);
			});

			it('should handle circular relationships without infinite loop', async () => {
				// A -> B -> C -> A
				const entityA: BaseEntity = {
					...sourceEntity,
					id: 'entity-a',
					links: [
						{
							id: 'link-a-b',
							sourceId: 'entity-a',
							targetId: 'entity-b',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: false
						}
					]
				};

				const entityB: BaseEntity = {
					...relatedNPC,
					id: 'entity-b',
					links: [
						{
							id: 'link-b-c',
							sourceId: 'entity-b',
							targetId: 'entity-c',
							targetType: 'character',
							relationship: 'knows',
							bidirectional: false
						}
					]
				};

				const entityC: BaseEntity = {
					...relatedCharacter,
					id: 'entity-c',
					links: [
						{
							id: 'link-c-a',
							sourceId: 'entity-c',
							targetId: 'entity-a',
							targetType: 'character',
							relationship: 'knows',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(entityA);
				// Depth 0 -> 1: A -> B
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([entityB]);
				// Depth 1 -> 2: B -> C
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([entityC]);
				// Depth 2 -> 3: C -> A (this creates the circle, but A is already visited)
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([entityA]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('entity-a', {
					maxDepth: 3
				});

				// Should complete without infinite loop
				expect(result).toBeDefined();
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should handle missing related entities gracefully', async () => {
				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceEntity);
				// Return empty array even though links exist
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				// Should not crash, but may have fewer entities
				expect(result).toBeDefined();
				expect(result.sourceEntityId).toBe('char-001');
			});

			it('should handle entities with missing summaries', async () => {
				const entityWithoutSummary: BaseEntity = {
					...relatedFaction,
					summary: undefined
				};

				// Source entity with just faction link
				const sourceWithFaction: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-001',
							sourceId: 'char-001',
							targetId: 'faction-001',
							targetType: 'faction',
							relationship: 'member_of',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithFaction);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([entityWithoutSummary]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry).toBeDefined();
				// Should fallback to generating summary from available data
				expect(entry?.summary).toBeDefined();
			});

			it('should handle very long entity names', async () => {
				const longNameEntity: BaseEntity = {
					...relatedFaction,
					name: 'A'.repeat(500)
				};

				// Source entity with just faction link
				const sourceWithFaction: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-001',
							sourceId: 'char-001',
							targetId: 'faction-001',
							targetType: 'faction',
							relationship: 'member_of',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithFaction);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([longNameEntity]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				expect(result).toBeDefined();
				expect(result.relatedEntities.length).toBeGreaterThan(0);
			});

			it('should handle special characters in entity data', async () => {
				const specialEntity: BaseEntity = {
					...relatedFaction,
					name: 'Order of <Dragons> & "Knights"',
					summary: 'A faction with special chars: <>&"\''
				};

				// Source entity with just faction link
				const sourceWithFaction: BaseEntity = {
					...sourceEntity,
					links: [
						{
							id: 'link-001',
							sourceId: 'char-001',
							targetId: 'faction-001',
							targetType: 'faction',
							relationship: 'member_of',
							bidirectional: false
						}
					]
				};

				vi.mocked(entityRepository.getById).mockResolvedValueOnce(sourceWithFaction);
				vi.mocked(entityRepository.getByIds).mockResolvedValueOnce([specialEntity]);
				vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValueOnce([]);

				const result = await buildRelationshipContext('char-001');

				const entry = result.relatedEntities.find((r) => r.entityId === 'faction-001');
				expect(entry).toBeDefined();
				expect(entry?.name).toContain('<Dragons>');
			});
		});
	});

	describe('formatRelatedEntityEntry', () => {
		it('should format entry with relationship, name, type, and summary', () => {
			const entry: RelatedEntityContext = {
				relationship: 'member_of',
				entityId: 'faction-001',
				entityType: 'faction',
				name: 'Order of the Silver Dragon',
				summary: 'Ancient knightly order protecting the realm',
				direction: 'outgoing',
				depth: 1
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted).toContain('member_of');
			expect(formatted).toContain('Order of the Silver Dragon');
			expect(formatted).toContain('Faction');
			expect(formatted).toContain('Ancient knightly order protecting the realm');
		});

		it('should use format: [Relationship: X] Name (Type): summary', () => {
			const entry: RelatedEntityContext = {
				relationship: 'located_at',
				entityId: 'loc-001',
				entityType: 'location',
				name: 'Stormwatch Keep',
				summary: 'Fortress guarding the northern border',
				direction: 'outgoing',
				depth: 1
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted).toMatch(/\[Relationship: located_at\]/);
			expect(formatted).toContain('Stormwatch Keep');
			expect(formatted).toMatch(/\(Location\)/i);
		});

		it('should include strength when provided', () => {
			const entry: RelatedEntityContext = {
				relationship: 'member_of',
				entityId: 'faction-001',
				entityType: 'faction',
				name: 'Order of the Silver Dragon',
				summary: 'Ancient knightly order',
				direction: 'outgoing',
				depth: 1,
				strength: 'strong'
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted.toLowerCase()).toContain('strong');
		});

		it('should include notes when provided', () => {
			const entry: RelatedEntityContext = {
				relationship: 'knows',
				entityId: 'npc-001',
				entityType: 'npc',
				name: 'Captain Roderick',
				summary: 'Veteran soldier',
				direction: 'outgoing',
				depth: 1,
				notes: 'Met during the battle of Stormwatch'
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted).toContain('Met during the battle of Stormwatch');
		});

		it('should handle missing optional fields gracefully', () => {
			const entry: RelatedEntityContext = {
				relationship: 'knows',
				entityId: 'npc-001',
				entityType: 'npc',
				name: 'Captain Roderick',
				summary: 'Veteran soldier',
				direction: 'outgoing',
				depth: 1
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted).toBeDefined();
			expect(formatted.length).toBeGreaterThan(0);
		});

		it('should properly capitalize entity type', () => {
			const entry: RelatedEntityContext = {
				relationship: 'member_of',
				entityId: 'faction-001',
				entityType: 'faction',
				name: 'Test Faction',
				summary: 'Test summary',
				direction: 'outgoing',
				depth: 1
			};

			const formatted = formatRelatedEntityEntry(entry);

			expect(formatted).toContain('Faction');
			expect(formatted).not.toContain('faction)'); // lowercase in parentheses
		});
	});

	describe('formatRelationshipContextForPrompt', () => {
		it('should format complete context for AI prompt', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric the Brave',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Order of the Silver Dragon',
						summary: 'Ancient knightly order',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'located_at',
						entityId: 'loc-001',
						entityType: 'location',
						name: 'Stormwatch Keep',
						summary: 'Fortress on the border',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 250,
				truncated: false
			};

			const formatted = formatRelationshipContextForPrompt(context);

			expect(formatted).toContain('Aldric the Brave');
			expect(formatted).toContain('Order of the Silver Dragon');
			expect(formatted).toContain('Stormwatch Keep');
		});

		it('should include header with source entity name', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric the Brave',
				relatedEntities: [],
				totalCharacters: 0,
				truncated: false
			};

			const formatted = formatRelationshipContextForPrompt(context);

			expect(formatted).toContain('Aldric the Brave');
		});

		it('should format each related entity on separate line', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Faction A',
						summary: 'First faction',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'knows',
						entityId: 'npc-001',
						entityType: 'npc',
						name: 'NPC B',
						summary: 'Second NPC',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 100,
				truncated: false
			};

			const formatted = formatRelationshipContextForPrompt(context);

			const lines = formatted.split('\n').filter((l) => l.trim());
			expect(lines.length).toBeGreaterThanOrEqual(2); // At least 2 entity entries
		});

		it('should handle empty related entities', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [],
				totalCharacters: 0,
				truncated: false
			};

			const formatted = formatRelationshipContextForPrompt(context);

			expect(formatted).toBeDefined();
			expect(formatted.length).toBeGreaterThan(0);
		});

		it('should indicate when context is truncated', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Faction',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 5000,
				truncated: true
			};

			const formatted = formatRelationshipContextForPrompt(context);

			expect(formatted.toLowerCase()).toContain('truncated');
		});
	});

	describe('getRelationshipContextStats', () => {
		it('should calculate relatedEntityCount correctly', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Faction',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'knows',
						entityId: 'npc-001',
						entityType: 'npc',
						name: 'NPC',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 100,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.relatedEntityCount).toBe(2);
		});

		it('should calculate characterCount correctly', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [],
				totalCharacters: 250,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.characterCount).toBe(250);
		});

		it('should estimate tokens (characters / 4)', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [],
				totalCharacters: 400,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.estimatedTokens).toBe(100); // 400 / 4
		});

		it('should include truncated flag', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [],
				totalCharacters: 5000,
				truncated: true
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.truncated).toBe(true);
		});

		it('should provide relationshipBreakdown by type', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Faction',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'member_of',
						entityId: 'faction-002',
						entityType: 'faction',
						name: 'Faction 2',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'knows',
						entityId: 'npc-001',
						entityType: 'npc',
						name: 'NPC',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 100,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.relationshipBreakdown).toBeDefined();
			expect(stats.relationshipBreakdown['member_of']).toBe(2);
			expect(stats.relationshipBreakdown['knows']).toBe(1);
		});

		it('should provide entityTypeBreakdown', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [
					{
						relationship: 'member_of',
						entityId: 'faction-001',
						entityType: 'faction',
						name: 'Faction',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'knows',
						entityId: 'npc-001',
						entityType: 'npc',
						name: 'NPC 1',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					},
					{
						relationship: 'allies_with',
						entityId: 'npc-002',
						entityType: 'npc',
						name: 'NPC 2',
						summary: 'Summary',
						direction: 'outgoing',
						depth: 1
					}
				],
				totalCharacters: 100,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.entityTypeBreakdown).toBeDefined();
			expect(stats.entityTypeBreakdown['faction']).toBe(1);
			expect(stats.entityTypeBreakdown['npc']).toBe(2);
		});

		it('should handle empty relatedEntities', () => {
			const context: RelationshipContext = {
				sourceEntityId: 'char-001',
				sourceEntityName: 'Aldric',
				relatedEntities: [],
				totalCharacters: 0,
				truncated: false
			};

			const stats = getRelationshipContextStats(context);

			expect(stats.relatedEntityCount).toBe(0);
			expect(stats.relationshipBreakdown).toEqual({});
			expect(stats.entityTypeBreakdown).toEqual({});
		});
	});

	describe('buildPrivacySafeSummary', () => {
		it('should build summary from entity name and description', () => {
			const summary = buildPrivacySafeSummary(relatedFaction);

			expect(summary).toContain('Order of the Silver Dragon');
			expect(summary).toContain('ancient order of knights');
		});

		it('should exclude hidden section fields', () => {
			const summary = buildPrivacySafeSummary(relatedFaction);

			// Check that the secrets field content is not included
			expect(summary.toLowerCase()).not.toContain('secretly funded');
		});

		it('should exclude fields named "secrets"', () => {
			const summary = buildPrivacySafeSummary(relatedNPC);

			expect(summary.toLowerCase()).not.toContain('failed to protect');
		});

		it('should exclude fields named "notes"', () => {
			const entityWithNotes: BaseEntity = {
				...relatedFaction,
				notes: 'DM only: This faction is actually evil'
			};

			const summary = buildPrivacySafeSummary(entityWithNotes);

			expect(summary.toLowerCase()).not.toContain('dm only');
			expect(summary.toLowerCase()).not.toContain('actually evil');
		});

		it('should use entity summary if available', () => {
			const summary = buildPrivacySafeSummary(relatedFaction);

			expect(summary).toContain('Ancient knightly order protecting the realm from darkness');
		});

		it('should fallback to description when summary is missing', () => {
			const entityWithoutSummary: BaseEntity = {
				...relatedFaction,
				summary: undefined
			};

			const summary = buildPrivacySafeSummary(entityWithoutSummary);

			expect(summary).toBeDefined();
			expect(summary.length).toBeGreaterThan(0);
		});

		it('should include non-hidden fields in summary', () => {
			const summary = buildPrivacySafeSummary(relatedFaction);

			// Should include headquarters since it's not hidden
			expect(summary.toLowerCase()).toContain('dragonspire keep');
		});

		it('should handle entities with no fields', () => {
			const minimalEntity: BaseEntity = {
				...relatedFaction,
				fields: {}
			};

			const summary = buildPrivacySafeSummary(minimalEntity);

			expect(summary).toBeDefined();
			expect(summary).toContain('Order of the Silver Dragon');
		});

		it('should handle special characters in entity data', () => {
			const specialEntity: BaseEntity = {
				...relatedFaction,
				name: 'Order of <Dragons> & "Knights"',
				description: 'A faction with special chars: <>&"\''
			};

			const summary = buildPrivacySafeSummary(specialEntity);

			expect(summary).toBeDefined();
			expect(summary).toContain('Order of');
		});

		it('should limit summary length to reasonable size', () => {
			const longEntity: BaseEntity = {
				...relatedFaction,
				description: 'A'.repeat(10000)
			};

			const summary = buildPrivacySafeSummary(longEntity);

			// Should be truncated to reasonable length (e.g., 500 chars)
			expect(summary.length).toBeLessThan(1000);
		});
	});
});
