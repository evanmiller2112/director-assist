/**
 * Tests for Entity Regeneration Service (TDD RED Phase)
 * GitHub Issue #308: Character Regeneration with Full Context Integration
 *
 * Tests the entity regeneration service that preserves entity identity while
 * regenerating content with full relationship context awareness.
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 *
 * Covers:
 * - Prompt building with entity identity and relationship context
 * - Regeneration flow with field preservation options
 * - Diff computation for changed vs unchanged fields
 * - Apply regeneration with selective field updates
 * - Context integration with related entities
 * - Error handling for missing API keys and entities
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import {
	regenerateEntity,
	computeRegenerationDiff,
	applyRegeneration,
	type RegenerationOptions,
	type RegenerationResult,
	type RegenerationDiff
} from './entityRegenerationService';
import { db } from '$lib/db';
import { createMockEntity } from '../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';
import Anthropic from '@anthropic-ai/sdk';

// Mock the model service
vi.mock('./modelService', () => ({
	getSelectedModel: vi.fn().mockReturnValue('claude-3-5-sonnet-20241022')
}));

// Mock the relationship context builder
vi.mock('./relationshipContextBuilder', () => ({
	buildRelationshipContext: vi.fn().mockResolvedValue({
		sourceEntityId: 'test-id',
		sourceEntityName: 'Test Entity',
		relatedEntities: [
			{
				relationship: 'member_of',
				entityId: 'faction-1',
				entityType: 'faction',
				name: 'Shadow Guild',
				summary: 'A secretive organization of rogues and thieves',
				direction: 'outgoing',
				depth: 1
			},
			{
				relationship: 'located_at',
				entityId: 'location-1',
				entityType: 'location',
				name: 'Tavern',
				summary: 'A busy tavern in the city',
				direction: 'outgoing',
				depth: 1
			}
		],
		totalCharacters: 150,
		truncated: false
	}),
	formatRelationshipContextForPrompt: vi.fn().mockReturnValue(
		'=== Relationships for Test Entity ===\n[Relationship: member_of] Shadow Guild (Faction): A secretive organization\n[Relationship: located_at] Tavern (Location): A busy tavern'
	)
}));

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
	const mockCreate = vi.fn().mockResolvedValue({
		content: [
			{
				type: 'text',
				text: JSON.stringify({
					name: 'Regenerated Name',
					description: 'Regenerated description with new details.',
					summary: 'Regenerated summary.',
					tags: ['regenerated', 'test'],
					fields: {
						occupation: 'Master Thief',
						personality: 'Cunning and strategic',
						appearance: 'Wears dark leather armor',
						level: 10
					}
				})
			}
		]
	});

	const MockAnthropic = function (this: any, config: any) {
		this.messages = {
			create: mockCreate
		};
	};

	(MockAnthropic as any).APIError = class APIError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
			this.name = 'APIError';
		}
	};

	return {
		default: MockAnthropic
	};
});

describe('entityRegenerationService', () => {
	let mockCreate: ReturnType<typeof vi.fn>;

	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		// Clear database
		await db.entities.clear();

		// Get the mock function from the mocked Anthropic constructor
		const AnthropicModule = await import('@anthropic-ai/sdk');
		const testClient = new AnthropicModule.default({ apiKey: 'test' });
		mockCreate = testClient.messages.create as unknown as ReturnType<typeof vi.fn>;

		// Mock localStorage for API key
		global.localStorage = {
			getItem: vi.fn((key: string) => {
				if (key === 'dm-assist-api-key') return 'test-api-key';
				return null;
			}),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			length: 0,
			key: vi.fn()
		};

		// Reset mock to default successful response
		mockCreate.mockResolvedValue({
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						name: 'Regenerated Name',
						description: 'Regenerated description with new details.',
						summary: 'Regenerated summary.',
						tags: ['regenerated', 'test'],
						fields: {
							occupation: 'Master Thief',
							personality: 'Cunning and strategic',
							appearance: 'Wears dark leather armor',
							level: 10
						}
					})
				}
			]
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Prompt Building Tests', () => {
		it('should include entity current name and identity in regeneration prompt', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Aldric the Bold',
				type: 'npc',
				description: 'A brave knight',
				fields: {
					occupation: 'Knight',
					level: 5
				}
			});

			await db.entities.add(entity);

			await regenerateEntity(entity.id);

			// Verify prompt includes the entity's current name
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({
							content: expect.stringContaining('Aldric the Bold')
						})
					])
				})
			);
		});

		it('should include relationship context when entity has links', async () => {
			const faction = createMockEntity({
				id: 'faction-1',
				name: 'Shadow Guild',
				type: 'faction',
				description: 'A secretive organization'
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Rogue',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'faction-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(faction);
			await db.entities.add(entity);

			await regenerateEntity(entity.id, { includeRelationshipContext: true });

			// Verify prompt includes relationship context
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({
							content: expect.stringContaining('Shadow Guild')
						})
					])
				})
			);
		});

		it('should include campaign context when available', async () => {
			const campaign = createMockEntity({
				id: 'campaign-1',
				name: 'The Dark Tower',
				type: 'campaign',
				fields: {
					setting: 'Dark Fantasy',
					system: 'Draw Steel'
				}
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Hero',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'campaign-1',
						targetType: 'campaign',
						relationship: 'belongs_to_campaign',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(campaign);
			await db.entities.add(entity);

			await regenerateEntity(entity.id);

			// Verify prompt includes campaign context
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({
							content: expect.stringContaining('The Dark Tower')
						})
					])
				})
			);
		});

		it('should mark preserved fields in prompt instructions', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Wizard',
				type: 'npc',
				fields: {
					occupation: 'Court Wizard',
					level: 15,
					personality: 'Wise and patient'
				}
			});

			await db.entities.add(entity);

			await regenerateEntity(entity.id, {
				preserveFields: ['occupation', 'level']
			});

			const call = mockCreate.mock.calls[0][0];
			const prompt = call.messages[0].content;

			// Verify prompt indicates which fields to preserve
			expect(prompt).toContain('occupation');
			expect(prompt).toContain('Court Wizard');
			expect(prompt).toContain('preserve');
		});

		it('should use Draw Steel system profile when system is set', async () => {
			const campaign = createMockEntity({
				id: 'campaign-1',
				name: 'Test Campaign',
				type: 'campaign',
				fields: {
					system: 'Draw Steel'
				}
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'campaign-1',
						targetType: 'campaign',
						relationship: 'belongs_to_campaign',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(campaign);
			await db.entities.add(entity);

			await regenerateEntity(entity.id);

			// Verify system prompt includes Draw Steel context
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					system: expect.stringContaining('Draw Steel')
				})
			);
		});
	});

	describe('Regeneration Flow Tests', () => {
		it('should return error when API key is missing', async () => {
			global.localStorage.getItem = vi.fn(() => null);

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc'
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('API key');
			expect(result.regenerated).toBeUndefined();
		});

		it('should return error when entity ID is not found', async () => {
			const result = await regenerateEntity('non-existent-id');

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('not found');
		});

		it('should successfully call AI with regeneration prompt', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Warrior',
				type: 'npc',
				description: 'A brave fighter',
				fields: {
					occupation: 'Soldier',
					level: 5
				}
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(true);
			expect(mockCreate).toHaveBeenCalledTimes(1);
			expect(result.regenerated).toBeDefined();
		});

		it('should preserve name when preserveName is true (default)', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Original Name',
				type: 'npc',
				description: 'A character'
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(true);
			// Name should be preserved (not included in regenerated fields)
			expect(result.regenerated?.name).toBeUndefined();
		});

		it('should preserve tags when preserveTags is true (default)', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				tags: ['important', 'quest-giver']
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(true);
			// Tags should be preserved (not included in regenerated fields)
			expect(result.regenerated?.tags).toBeUndefined();
		});

		it('should preserve notes when preserveNotes is true (default)', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				notes: 'Secret DM notes about this character'
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(true);
			// Notes should be preserved (not included in regenerated fields)
			expect(result.regenerated?.notes).toBeUndefined();
		});

		it('should preserve specified fields via preserveFields option', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Wizard',
				type: 'npc',
				fields: {
					occupation: 'Court Wizard',
					level: 20,
					personality: 'Wise',
					appearance: 'Old and bearded'
				}
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id, {
				preserveFields: ['occupation', 'level']
			});

			expect(result.success).toBe(true);
			expect(result.regenerated?.fields?.occupation).toBeUndefined();
			expect(result.regenerated?.fields?.level).toBeUndefined();
			// Other fields should be regenerated
			expect(result.regenerated?.fields?.personality).toBeDefined();
		});

		it('should include relationship context from linked entities', async () => {
			const faction = createMockEntity({
				id: 'faction-1',
				name: 'Thieves Guild',
				type: 'faction',
				summary: 'Underground criminal organization'
			});

			const location = createMockEntity({
				id: 'location-1',
				name: 'Tavern',
				type: 'location',
				summary: 'A bustling tavern'
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Rogue',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'faction-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					},
					{
						id: 'link-2',
						sourceId: 'entity-1',
						targetId: 'location-1',
						targetType: 'location',
						relationship: 'frequents',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(faction);
			await db.entities.add(location);
			await db.entities.add(entity);

			await regenerateEntity(entity.id, { includeRelationshipContext: true });

			const call = mockCreate.mock.calls[0][0];
			const prompt = call.messages[0].content;

			// Should include context from both related entities
			expect(prompt).toContain('Thieves Guild');
			expect(prompt).toContain('Tavern');
		});

		it('should handle API errors gracefully', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc'
			});

			await db.entities.add(entity);

			const APIError = (Anthropic as any).APIError;
			mockCreate.mockRejectedValue(new APIError('Rate limit exceeded', 429));

			const result = await regenerateEntity(entity.id);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Rate limit');
		});
	});

	describe('Diff Computation Tests', () => {
		it('should detect changed fields correctly', () => {
			const original: BaseEntity = createMockEntity({
				id: 'entity-1',
				name: 'Original Name',
				type: 'npc',
				description: 'Original description',
				fields: {
					occupation: 'Knight',
					level: 5
				}
			});

			const regenerated: Partial<BaseEntity> = {
				description: 'New description',
				fields: {
					occupation: 'Paladin',
					level: 10
				}
			};

			const diffs = computeRegenerationDiff(original, regenerated);

			const descDiff = diffs.find((d) => d.field === 'description');
			expect(descDiff).toBeDefined();
			expect(descDiff?.changed).toBe(true);
			expect(descDiff?.original).toBe('Original description');
			expect(descDiff?.regenerated).toBe('New description');

			const occupationDiff = diffs.find((d) => d.field === 'fields.occupation');
			expect(occupationDiff).toBeDefined();
			expect(occupationDiff?.changed).toBe(true);
		});

		it('should mark unchanged fields as changed: false', () => {
			const original: BaseEntity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc',
				description: 'Same description',
				fields: {
					occupation: 'Knight'
				}
			});

			const regenerated: Partial<BaseEntity> = {
				description: 'Same description',
				fields: {
					occupation: 'Knight'
				}
			};

			const diffs = computeRegenerationDiff(original, regenerated);

			const descDiff = diffs.find((d) => d.field === 'description');
			expect(descDiff?.changed).toBe(false);

			const occupationDiff = diffs.find((d) => d.field === 'fields.occupation');
			expect(occupationDiff?.changed).toBe(false);
		});

		it('should handle array fields (tags)', () => {
			const original: BaseEntity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc',
				tags: ['hero', 'warrior']
			});

			const regenerated: Partial<BaseEntity> = {
				tags: ['hero', 'knight']
			};

			const diffs = computeRegenerationDiff(original, regenerated);

			const tagsDiff = diffs.find((d) => d.field === 'tags');
			expect(tagsDiff).toBeDefined();
			expect(tagsDiff?.changed).toBe(true);
			expect(tagsDiff?.original).toContain('hero, warrior');
			expect(tagsDiff?.regenerated).toContain('hero, knight');
		});

		it('should handle empty original values', () => {
			const original: BaseEntity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc',
				description: '',
				summary: ''
			});

			const regenerated: Partial<BaseEntity> = {
				description: 'New description',
				summary: 'New summary'
			};

			const diffs = computeRegenerationDiff(original, regenerated);

			const descDiff = diffs.find((d) => d.field === 'description');
			expect(descDiff?.changed).toBe(true);
			expect(descDiff?.original).toBe('(empty)');
			expect(descDiff?.regenerated).toBe('New description');
		});

		it('should include description, summary, and type-specific fields', () => {
			const original: BaseEntity = createMockEntity({
				id: 'entity-1',
				name: 'Test',
				type: 'npc',
				description: 'Desc',
				summary: 'Sum',
				fields: {
					occupation: 'Knight',
					personality: 'Brave'
				}
			});

			const regenerated: Partial<BaseEntity> = {
				description: 'New desc',
				summary: 'New sum',
				fields: {
					occupation: 'Paladin',
					personality: 'Heroic'
				}
			};

			const diffs = computeRegenerationDiff(original, regenerated);

			expect(diffs.find((d) => d.field === 'description')).toBeDefined();
			expect(diffs.find((d) => d.field === 'summary')).toBeDefined();
			expect(diffs.find((d) => d.field === 'fields.occupation')).toBeDefined();
			expect(diffs.find((d) => d.field === 'fields.personality')).toBeDefined();
		});
	});

	describe('Apply Regeneration Tests', () => {
		it('should update only selected fields', async () => {
			const original = createMockEntity({
				id: 'entity-1',
				name: 'Original Name',
				type: 'npc',
				description: 'Original description',
				summary: 'Original summary',
				fields: {
					occupation: 'Knight',
					level: 5
				}
			});

			await db.entities.add(original);

			const regenerated: Partial<BaseEntity> = {
				description: 'New description',
				summary: 'New summary',
				fields: {
					occupation: 'Paladin',
					level: 10
				}
			};

			// Only select description to update
			const selectedFields = ['description'];

			await applyRegeneration(original.id, regenerated, selectedFields);

			const updated = await db.entities.get(original.id);

			expect(updated?.description).toBe('New description');
			// Summary should remain unchanged
			expect(updated?.summary).toBe('Original summary');
			// Fields should remain unchanged
			expect(updated?.fields.occupation).toBe('Knight');
		});

		it('should preserve entity links/relationships', async () => {
			const original = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				description: 'Original',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'faction-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(original);

			const regenerated: Partial<BaseEntity> = {
				description: 'New description'
			};

			await applyRegeneration(original.id, regenerated, ['description']);

			const updated = await db.entities.get(original.id);

			expect(updated?.links).toHaveLength(1);
			expect(updated?.links[0].targetId).toBe('faction-1');
		});

		it('should preserve entity ID and type', async () => {
			const original = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				description: 'Original'
			});

			await db.entities.add(original);

			const regenerated: Partial<BaseEntity> = {
				description: 'New description'
			};

			await applyRegeneration(original.id, regenerated, ['description']);

			const updated = await db.entities.get(original.id);

			expect(updated?.id).toBe('entity-1');
			expect(updated?.type).toBe('npc');
		});

		it('should preserve createdAt timestamp', async () => {
			const createdDate = new Date('2023-01-01');
			const original = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				description: 'Original',
				createdAt: createdDate
			});

			await db.entities.add(original);

			const regenerated: Partial<BaseEntity> = {
				description: 'New description'
			};

			await applyRegeneration(original.id, regenerated, ['description']);

			const updated = await db.entities.get(original.id);

			expect(updated?.createdAt.getTime()).toBe(createdDate.getTime());
		});

		it('should update updatedAt timestamp', async () => {
			const oldDate = new Date('2023-01-01');
			const original = createMockEntity({
				id: 'entity-1',
				name: 'Character',
				type: 'npc',
				description: 'Original',
				updatedAt: oldDate
			});

			await db.entities.add(original);

			const regenerated: Partial<BaseEntity> = {
				description: 'New description'
			};

			const beforeApply = new Date();
			await applyRegeneration(original.id, regenerated, ['description']);
			const afterApply = new Date();

			const updated = await db.entities.get(original.id);

			expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeApply.getTime());
			expect(updated?.updatedAt.getTime()).toBeLessThanOrEqual(afterApply.getTime());
		});
	});

	describe('Context Integration Tests', () => {
		it('should gather context from outgoing and incoming relationships', async () => {
			const faction = createMockEntity({
				id: 'faction-1',
				name: 'Guild',
				type: 'faction',
				summary: 'A powerful guild'
			});

			const location = createMockEntity({
				id: 'location-1',
				name: 'Hideout',
				type: 'location',
				summary: 'Secret hideout',
				links: [
					{
						id: 'link-incoming',
						sourceId: 'location-1',
						targetId: 'entity-1',
						targetType: 'npc',
						relationship: 'home_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Rogue',
				type: 'npc',
				links: [
					{
						id: 'link-outgoing',
						sourceId: 'entity-1',
						targetId: 'faction-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(faction);
			await db.entities.add(location);
			await db.entities.add(entity);

			await regenerateEntity(entity.id, { includeRelationshipContext: true });

			// Context should include both outgoing and incoming relationships
			const call = mockCreate.mock.calls[0][0];
			const prompt = call.messages[0].content;

			expect(prompt).toContain('Guild');
			expect(prompt).toContain('Hideout');
		});

		it('should respect maxRelatedEntities option', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Popular Character',
				type: 'npc',
				links: []
			});

			// Add many links
			for (let i = 1; i <= 30; i++) {
				const relatedEntity = createMockEntity({
					id: `related-${i}`,
					name: `Related ${i}`,
					type: 'npc',
					summary: `Summary ${i}`
				});
				await db.entities.add(relatedEntity);

				entity.links.push({
					id: `link-${i}`,
					sourceId: 'entity-1',
					targetId: `related-${i}`,
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: false,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}

			await db.entities.add(entity);

			await regenerateEntity(entity.id, {
				includeRelationshipContext: true,
				maxRelatedEntities: 5
			});

			// Should limit to 5 entities despite 30 being linked
			const call = mockCreate.mock.calls[0][0];
			const prompt = call.messages[0].content;

			// Count how many "Related" mentions (rough check)
			const relatedCount = (prompt.match(/Related \d+/g) || []).length;
			expect(relatedCount).toBeLessThanOrEqual(5);
		});

		it('should include entity summaries for related entities', async () => {
			const faction = createMockEntity({
				id: 'faction-1',
				name: 'The Order',
				type: 'faction',
				summary: 'A holy order of paladins dedicated to justice'
			});

			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Paladin',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'entity-1',
						targetId: 'faction-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(faction);
			await db.entities.add(entity);

			await regenerateEntity(entity.id, { includeRelationshipContext: true });

			const call = mockCreate.mock.calls[0][0];
			const prompt = call.messages[0].content;

			// Should include the summary of the related entity
			expect(prompt).toContain('holy order of paladins');
		});

		it('should handle entities with no relationships', async () => {
			const entity = createMockEntity({
				id: 'entity-1',
				name: 'Isolated Character',
				type: 'npc',
				description: 'A loner',
				links: []
			});

			await db.entities.add(entity);

			const result = await regenerateEntity(entity.id, { includeRelationshipContext: true });

			expect(result.success).toBe(true);
			// Should still work even with no relationships
		});
	});
});
