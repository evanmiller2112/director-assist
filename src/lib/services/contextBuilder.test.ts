/**
 * Tests for Context Builder Service (TDD RED Phase)
 *
 * Testing the "Send All Context" feature (GitHub Issue #430)
 *
 * Test Coverage:
 * - buildContext with sendAll option (fetch ALL entities instead of just selected IDs)
 * - buildContext with detailLevel: 'summary' (existing behavior)
 * - buildContext with detailLevel: 'full' (include description, fields, notes)
 * - buildFullEntityContext function (format entity with full details)
 * - buildCampaignMetadataContext function (format campaign info)
 * - buildRelationshipGraphContext function (format relationship edges)
 * - Character budget handling for both summary and full modes
 * - Context structure with campaign metadata section
 * - Edge cases: empty entities, missing fields, deduplication
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	buildContext,
	formatContextEntry,
	formatContextForPrompt,
	getContextStats,
	buildFullEntityContext,
	buildCampaignMetadataContext,
	buildRelationshipGraphContext
} from './contextBuilder';
import type { BaseEntity, EntityId, Campaign } from '$lib/types';
import type { ContextOptions, BuiltContext, EntityContext } from './contextBuilder';
import { entityRepository } from '$lib/db/repositories';

// Mock the entityRepository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getByIds: vi.fn(),
		getAllLinkedIds: vi.fn(),
		getAll: vi.fn(),
		getAllArray: vi.fn()
	}
}));

// Mock the entity type definition getter
vi.mock('$lib/config/entityTypes', () => ({
	getEntityTypeDefinition: vi.fn((type: string) => ({
		label: type.charAt(0).toUpperCase() + type.slice(1),
		type
	}))
}));

describe('contextBuilder - Send All Context Feature', () => {
	// Sample entities for testing
	const createMockEntity = (
		id: string,
		name: string,
		type: string,
		summary?: string,
		description?: string,
		fields?: Record<string, any>,
		notes?: string
	): BaseEntity => ({
		id,
		type,
		name,
		description: description || '',
		summary,
		tags: [],
		fields: fields || {},
		links: [],
		notes: notes || '',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		metadata: {}
	});

	const mockCampaign: Campaign = {
		id: 'campaign-1',
		name: 'Lost Mines of Phandelver',
		description: 'A classic adventure',
		system: 'D&D 5e',
		setting: 'Forgotten Realms',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		customEntityTypes: [],
		entityTypeOverrides: [],
		settings: {
			customRelationships: [],
			enabledEntityTypes: []
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('buildContext - sendAll option', () => {
		it('should fetch all entities when sendAll is true', async () => {
			const allEntities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard'),
				createMockEntity('2', 'Bilbo', 'npc', 'A hobbit adventurer'),
				createMockEntity('3', 'Rivendell', 'location', 'An elven refuge')
			];

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(allEntities);

			const result = await buildContext({
				sendAll: true
			});

			expect(entityRepository.getAllArray).toHaveBeenCalled();
			expect(entityRepository.getByIds).not.toHaveBeenCalled();
			expect(result.entities.length).toBe(3);
			expect(result.entities.map(e => e.name)).toEqual(['Gandalf', 'Bilbo', 'Rivendell']);
		});

		it('should use getByIds when sendAll is false', async () => {
			const selectedEntities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(selectedEntities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				sendAll: false,
				entityIds: ['1']
			});

			expect(entityRepository.getByIds).toHaveBeenCalledWith(['1']);
			expect(entityRepository.getAllArray).not.toHaveBeenCalled();
			expect(result.entities.length).toBe(1);
		});

		it('should default to sendAll: false when not specified', async () => {
			const selectedEntities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(selectedEntities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			await buildContext({
				entityIds: ['1']
			});

			expect(entityRepository.getByIds).toHaveBeenCalled();
			expect(entityRepository.getAllArray).not.toHaveBeenCalled();
		});

		it('should filter entities by type when sendAll is true', async () => {
			const allEntities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard'),
				createMockEntity('2', 'Bilbo', 'npc', 'A hobbit adventurer'),
				createMockEntity('3', 'Rivendell', 'location', 'An elven refuge'),
				createMockEntity('4', 'Council of Elrond', 'faction', 'Elven council')
			];

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(allEntities);

			const result = await buildContext({
				sendAll: true,
				entityTypes: ['npc', 'location']
			});

			// Should only include NPCs and locations
			expect(result.entities.length).toBe(3);
			expect(result.entities.map(e => e.type)).not.toContain('Faction');
		});

		it('should respect maxEntities when sendAll is true', async () => {
			const allEntities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary 1'),
				createMockEntity('2', 'Entity 2', 'npc', 'Summary 2'),
				createMockEntity('3', 'Entity 3', 'npc', 'Summary 3'),
				createMockEntity('4', 'Entity 4', 'npc', 'Summary 4'),
				createMockEntity('5', 'Entity 5', 'npc', 'Summary 5')
			];

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(allEntities);

			const result = await buildContext({
				sendAll: true,
				maxEntities: 3
			});

			expect(result.entities.length).toBe(3);
			expect(result.truncated).toBe(true);
		});
	});

	describe('buildContext - detailLevel option', () => {
		it('should use summary format when detailLevel is "summary"', async () => {
			const entities: BaseEntity[] = [
				createMockEntity(
					'1',
					'Gandalf',
					'npc',
					'A wise wizard',
					'Gandalf the Grey is a powerful wizard who guides the fellowship',
					{ age: 2000, class: 'Wizard' },
					'Secret: He is actually a Maia'
				)
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1'],
				detailLevel: 'summary'
			});

			// Summary should only include name and summary, not description/fields/notes
			expect(result.entities.length).toBe(1);
			expect(result.entities[0].summary).toBe('A wise wizard');
			// Full context shouldn't be in the EntityContext in summary mode
			expect(result.entities[0]).not.toHaveProperty('description');
			expect(result.entities[0]).not.toHaveProperty('fields');
			expect(result.entities[0]).not.toHaveProperty('notes');
		});

		it('should use full format when detailLevel is "full"', async () => {
			const entities: BaseEntity[] = [
				createMockEntity(
					'1',
					'Gandalf',
					'npc',
					'A wise wizard',
					'Gandalf the Grey is a powerful wizard who guides the fellowship',
					{ age: 2000, class: 'Wizard' },
					'Secret: He is actually a Maia'
				)
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1'],
				detailLevel: 'full'
			});

			// Full mode should include description, fields, and notes
			expect(result.entities.length).toBe(1);
			// In full mode, the entity should have extended information
			const formatted = formatContextEntry(result.entities[0]);
			expect(formatted).toContain('Gandalf');
			// The actual formatting is tested in buildFullEntityContext tests
		});

		it('should default to "summary" when detailLevel not specified', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard', 'Full description')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1']
			});

			// Should behave like summary mode
			expect(result.entities[0].summary).toBe('A wise wizard');
		});

		it('should use higher character budget for full mode (30000 vs 6000)', async () => {
			const largeDescription = 'A'.repeat(15000);
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary', largeDescription),
				createMockEntity('2', 'Entity 2', 'npc', 'Summary', largeDescription)
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const summaryResult = await buildContext({
				entityIds: ['1', '2'],
				detailLevel: 'summary'
			});

			const fullResult = await buildContext({
				entityIds: ['1', '2'],
				detailLevel: 'full'
			});

			// Full mode should have higher character budget
			// This is a behavior test - full mode allows more characters
			expect(fullResult.totalCharacters).toBeGreaterThanOrEqual(summaryResult.totalCharacters);
		});
	});

	describe('buildFullEntityContext', () => {
		it('should format entity with name, type, summary, description, fields, and notes', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Gandalf',
				'npc',
				'A wise wizard',
				'Gandalf the Grey is a powerful wizard who guides the fellowship',
				{ age: 2000, class: 'Wizard', alignment: 'Good' },
				'Secret: He is actually a Maia'
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Gandalf');
			expect(result).toContain('Npc'); // Type label
			expect(result).toContain('A wise wizard'); // Summary
			expect(result).toContain('Gandalf the Grey is a powerful wizard'); // Description
			expect(result).toContain('age'); // Field key
			expect(result).toContain('2000'); // Field value
			expect(result).toContain('class');
			expect(result).toContain('Wizard');
			expect(result).toContain('Secret: He is actually a Maia'); // Notes
		});

		it('should handle entity with empty description gracefully', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Bilbo',
				'npc',
				'A hobbit',
				'', // Empty description
				{ age: 50 }
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Bilbo');
			expect(result).toContain('A hobbit');
			expect(result).not.toContain('Description:');
		});

		it('should handle entity with no fields gracefully', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Rivendell',
				'location',
				'An elven refuge',
				'A beautiful valley',
				{} // No fields
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Rivendell');
			expect(result).toContain('An elven refuge');
			expect(result).toContain('A beautiful valley');
			// Should not have a fields section or should handle empty fields gracefully
		});

		it('should handle entity with empty notes gracefully', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Frodo',
				'npc',
				'The ring bearer',
				'A brave hobbit',
				{ age: 33 },
				'' // Empty notes
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Frodo');
			expect(result).not.toContain('Notes:');
		});

		it('should format complex field values correctly', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Aragorn',
				'npc',
				'A ranger',
				'The rightful king',
				{
					age: 87,
					class: 'Ranger',
					skills: ['tracking', 'swordsmanship', 'leadership'],
					hitPoints: { current: 45, max: 60 },
					active: true
				}
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Aragorn');
			expect(result).toContain('87');
			expect(result).toContain('Ranger');
			// Arrays should be formatted
			expect(result).toContain('tracking');
			expect(result).toContain('swordsmanship');
			// Objects should be formatted (e.g., ResourceValue)
			expect(result).toContain('45');
			expect(result).toContain('60');
			// Booleans should be formatted
			expect(result).toContain('true');
		});

		it('should handle null and undefined field values gracefully', () => {
			const entity: BaseEntity = createMockEntity(
				'1',
				'Gandalf',
				'npc',
				'A wizard',
				'A powerful wizard',
				{
					age: 2000,
					weapon: null,
					armor: undefined,
					class: 'Wizard'
				}
			);

			const result = buildFullEntityContext(entity);

			expect(result).toContain('Gandalf');
			expect(result).toContain('2000');
			expect(result).toContain('Wizard');
			// Null/undefined fields should be handled gracefully (not throw errors)
		});
	});

	describe('buildCampaignMetadataContext', () => {
		it('should format campaign with name, system, and setting', () => {
			const result = buildCampaignMetadataContext(mockCampaign);

			expect(result).toContain('Lost Mines of Phandelver');
			expect(result).toContain('D&D 5e');
			expect(result).toContain('Forgotten Realms');
		});

		it('should handle campaign with missing system gracefully', () => {
			const campaign: Campaign = {
				...mockCampaign,
				system: ''
			};

			const result = buildCampaignMetadataContext(campaign);

			expect(result).toContain('Lost Mines of Phandelver');
			expect(result).toContain('Forgotten Realms');
			// Should not throw or include empty system
		});

		it('should handle campaign with missing setting gracefully', () => {
			const campaign: Campaign = {
				...mockCampaign,
				setting: ''
			};

			const result = buildCampaignMetadataContext(campaign);

			expect(result).toContain('Lost Mines of Phandelver');
			expect(result).toContain('D&D 5e');
			// Should not throw or include empty setting
		});

		it('should handle campaign with all fields empty', () => {
			const campaign: Campaign = {
				...mockCampaign,
				name: '',
				system: '',
				setting: ''
			};

			const result = buildCampaignMetadataContext(campaign);

			// Should not throw and should return empty or minimal string
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});
	});

	describe('buildRelationshipGraphContext', () => {
		const createEntityWithLinks = (id: string, name: string, links: any[]): BaseEntity => ({
			id,
			name,
			type: 'npc',
			description: '',
			summary: 'A character',
			tags: [],
			fields: {},
			links,
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		});

		it('should format relationship edges between entities', () => {
			const entities: BaseEntity[] = [
				createEntityWithLinks('1', 'Gandalf', [
					{
						id: 'link-1',
						sourceId: '1',
						targetId: '2',
						targetType: 'npc',
						relationship: 'mentor_of',
						bidirectional: false
					}
				]),
				createEntityWithLinks('2', 'Frodo', [])
			];

			const result = buildRelationshipGraphContext(entities);

			expect(result).toContain('Gandalf');
			expect(result).toContain('Frodo');
			expect(result).toContain('mentor_of');
		});

		it('should deduplicate bidirectional relationships', () => {
			const entities: BaseEntity[] = [
				createEntityWithLinks('1', 'Gandalf', [
					{
						id: 'link-1',
						sourceId: '1',
						targetId: '2',
						targetType: 'npc',
						relationship: 'friends_with',
						bidirectional: true
					}
				]),
				createEntityWithLinks('2', 'Frodo', [
					{
						id: 'link-2',
						sourceId: '2',
						targetId: '1',
						targetType: 'npc',
						relationship: 'friends_with',
						bidirectional: true
					}
				])
			];

			const result = buildRelationshipGraphContext(entities);

			// Should only show the relationship once, not twice
			expect(result).toContain('Gandalf');
			expect(result).toContain('Frodo');
			expect(result).toContain('friends_with');

			// Count occurrences of "friends_with" - should appear only once for bidirectional
			const occurrences = (result.match(/friends_with/g) || []).length;
			expect(occurrences).toBe(1);
		});

		it('should handle entities with no links', () => {
			const entities: BaseEntity[] = [
				createEntityWithLinks('1', 'Gandalf', []),
				createEntityWithLinks('2', 'Frodo', [])
			];

			const result = buildRelationshipGraphContext(entities);

			// Should not throw and should return empty or minimal string
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should handle empty entities array', () => {
			const result = buildRelationshipGraphContext([]);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should show reverse relationship labels for asymmetric bidirectional links', () => {
			const entities: BaseEntity[] = [
				createEntityWithLinks('1', 'Lord', [
					{
						id: 'link-1',
						sourceId: '1',
						targetId: '2',
						targetType: 'npc',
						relationship: 'patron_of',
						bidirectional: true,
						reverseRelationship: 'client_of'
					}
				]),
				createEntityWithLinks('2', 'Client', [])
			];

			const result = buildRelationshipGraphContext(entities);

			expect(result).toContain('Lord');
			expect(result).toContain('Client');
			// Should show both relationship types
			expect(result).toContain('patron_of');
			expect(result).toContain('client_of');
		});

		it('should filter out links to entities not in the provided list', () => {
			const entities: BaseEntity[] = [
				createEntityWithLinks('1', 'Gandalf', [
					{
						id: 'link-1',
						sourceId: '1',
						targetId: '2',
						targetType: 'npc',
						relationship: 'mentor_of',
						bidirectional: false
					},
					{
						id: 'link-2',
						sourceId: '1',
						targetId: '99', // Entity 99 not in list
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: false
					}
				]),
				createEntityWithLinks('2', 'Frodo', [])
			];

			const result = buildRelationshipGraphContext(entities);

			// Should only include link to Frodo (entity 2), not entity 99
			expect(result).toContain('Frodo');
			expect(result).toContain('mentor_of');
			// Link to entity 99 should be filtered out
		});
	});

	describe('buildContext - character budget and truncation', () => {
		it('should respect maxCharacters limit in summary mode', async () => {
			const longSummary = 'A'.repeat(5000);
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', longSummary),
				createMockEntity('2', 'Entity 2', 'npc', longSummary)
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1', '2'],
				maxCharacters: 6000
			});

			expect(result.totalCharacters).toBeLessThanOrEqual(6000);
			expect(result.truncated).toBe(true);
		});

		it('should respect maxCharacters limit in full mode', async () => {
			const longDescription = 'B'.repeat(10000);
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary', longDescription),
				createMockEntity('2', 'Entity 2', 'npc', 'Summary', longDescription),
				createMockEntity('3', 'Entity 3', 'npc', 'Summary', longDescription),
				createMockEntity('4', 'Entity 4', 'npc', 'Summary', longDescription)
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1', '2', '3', '4'],
				detailLevel: 'full',
				maxCharacters: 30000
			});

			expect(result.totalCharacters).toBeLessThanOrEqual(30000);
		});

		it('should set truncated flag when hitting character limit', async () => {
			const entities: BaseEntity[] = Array.from({ length: 100 }, (_, i) =>
				createMockEntity(`${i}`, `Entity ${i}`, 'npc', 'A'.repeat(100))
			);

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(entities);

			const result = await buildContext({
				sendAll: true,
				maxCharacters: 1000
			});

			expect(result.truncated).toBe(true);
			expect(result.totalCharacters).toBeLessThanOrEqual(1000);
		});

		it('should not set truncated flag when all entities fit within budget', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Short summary')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1'],
				maxCharacters: 10000
			});

			expect(result.truncated).toBe(false);
		});
	});

	describe('buildContext - campaign metadata integration', () => {
		it('should include campaign metadata section when campaign provided', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1'],
				campaign: mockCampaign
			});

			// Context should include campaign metadata
			const formatted = formatContextForPrompt(result);
			expect(formatted).toContain('Lost Mines of Phandelver');
			expect(formatted).toContain('D&D 5e');
			expect(formatted).toContain('Forgotten Realms');
		});

		it('should not include campaign metadata when campaign not provided', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Gandalf', 'npc', 'A wise wizard')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1']
			});

			const formatted = formatContextForPrompt(result);
			expect(formatted).not.toContain('Lost Mines of Phandelver');
		});
	});

	describe('buildContext - edge cases', () => {
		it('should handle entities without summaries when using summary mode', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', undefined), // No summary
				createMockEntity('2', 'Entity 2', 'npc', 'Has summary')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1', '2'],
				detailLevel: 'summary'
			});

			// Should filter out entities without summaries in summary mode
			expect(result.entities.length).toBe(1);
			expect(result.entities[0].name).toBe('Entity 2');
		});

		it('should handle entities without summaries when using full mode', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', undefined, 'Has description'),
				createMockEntity('2', 'Entity 2', 'npc', 'Has summary', 'Also has description')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const result = await buildContext({
				entityIds: ['1', '2'],
				detailLevel: 'full'
			});

			// In full mode, should include entities even without summaries if they have other content
			expect(result.entities.length).toBeGreaterThanOrEqual(1);
		});

		it('should handle sendAll with empty database', async () => {
			vi.mocked(entityRepository.getAllArray).mockResolvedValue([]);

			const result = await buildContext({
				sendAll: true
			});

			expect(result.entities.length).toBe(0);
			expect(result.totalCharacters).toBe(0);
			expect(result.truncated).toBe(false);
		});

		it('should handle combination of sendAll and entityTypes filter resulting in no matches', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary'),
				createMockEntity('2', 'Entity 2', 'npc', 'Summary')
			];

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(entities);

			const result = await buildContext({
				sendAll: true,
				entityTypes: ['location', 'faction'] // No NPCs
			});

			expect(result.entities.length).toBe(0);
		});
	});

	describe('Extended ContextOptions interface', () => {
		it('should accept sendAll in ContextOptions', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary')
			];

			vi.mocked(entityRepository.getAllArray).mockResolvedValue(entities);

			const options: ContextOptions = {
				sendAll: true,
				maxCharacters: 30000
			};

			const result = await buildContext(options);

			expect(result.entities.length).toBe(1);
		});

		it('should accept detailLevel in ContextOptions', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary', 'Description')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const options: ContextOptions = {
				entityIds: ['1'],
				detailLevel: 'full'
			};

			const result = await buildContext(options);

			expect(result.entities.length).toBe(1);
		});

		it('should accept campaign in ContextOptions', async () => {
			const entities: BaseEntity[] = [
				createMockEntity('1', 'Entity 1', 'npc', 'Summary')
			];

			vi.mocked(entityRepository.getByIds).mockResolvedValue(entities);
			vi.mocked(entityRepository.getAllLinkedIds).mockResolvedValue([]);

			const options: ContextOptions = {
				entityIds: ['1'],
				campaign: mockCampaign
			};

			const result = await buildContext(options);

			expect(result.entities.length).toBe(1);
		});
	});
});
