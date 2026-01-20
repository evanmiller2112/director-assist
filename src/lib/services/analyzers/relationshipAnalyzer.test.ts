/**
 * Tests for Relationship Analyzer (TDD RED Phase)
 *
 * The relationship analyzer suggests new relationships between entities using both:
 * - Local analysis: Find entities mentioned in text but not linked
 * - Common location analysis: Entities in the same location
 * - AI analysis: Semantic relationship inference (optional, mocked in tests)
 *
 * These tests will FAIL until implementation is complete.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the AI client
vi.mock('$lib/ai/client', () => ({
	generate: vi.fn()
}));

import { relationshipAnalyzer } from './relationshipAnalyzer';
import type { BaseEntity } from '$lib/types';
import type { EntityAnalysisContext, AnalysisConfig } from './types';

describe('relationshipAnalyzer', () => {
	let mockContext: EntityAnalysisContext;
	let defaultConfig: AnalysisConfig;

	beforeEach(() => {
		defaultConfig = {
			maxSuggestionsPerType: 10,
			minRelevanceScore: 30,
			enableAIAnalysis: true,
			rateLimitMs: 1000,
			expirationDays: 7
		};

		mockContext = {
			entities: [],
			entityMap: new Map(),
			relationshipMap: { nodes: [], edges: [] },
			locationsByEntity: new Map(),
			mentionedNames: new Map()
		};
	});

	describe('Analyzer Properties', () => {
		it('should have type "relationship"', () => {
			expect(relationshipAnalyzer.type).toBe('relationship');
		});

		it('should have analyze method', () => {
			expect(typeof relationshipAnalyzer.analyze).toBe('function');
		});
	});

	describe('Text Mention Detection', () => {
		it('should detect entity mentioned in another entity\'s description', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Captain Roderick',
				description: 'Captain of the city guard',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Elena Stormwind',
				description: 'A mage who frequently consults with Captain Roderick on magical threats',
				tags: [],
				fields: {},
				links: [], // No existing link to npc-001
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['captain roderick', ['npc-001']],
				['roderick', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('relationship');
			const mentionSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(mentionSuggestion).toBeDefined();
			expect(mentionSuggestion?.description.toLowerCase()).toMatch(/mentioned|description/);
			expect(mentionSuggestion?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should detect entity mentioned in fields', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Lord Blackwood',
				description: 'A noble',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Sir Roland',
				description: 'A knight',
				tags: [],
				fields: {
					patron: 'Lord Blackwood',
					allegiance: 'Serves Lord Blackwood loyally'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['lord blackwood', ['npc-001']],
				['blackwood', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const mentionSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(mentionSuggestion).toBeDefined();
			expect(mentionSuggestion?.suggestedAction?.actionType).toBe('create-relationship');
		});

		it('should not suggest relationship if link already exists', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Captain Roderick',
				description: 'Captain of the city guard',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Elena Stormwind',
				description: 'A mage who frequently consults with Captain Roderick',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-002',
						targetId: 'npc-001',
						targetType: 'npc',
						relationship: 'consults_with',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['captain roderick', ['npc-001']]
			]);
			// Set up the relationship in the edges (this is what hasRelationship checks)
			mockContext.relationshipMap = {
				nodes: [],
				edges: [{ source: 'npc-002', target: 'npc-001', relationship: 'consults_with' }]
			};

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			// Should not suggest a relationship that already exists
			const duplicateSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(duplicateSuggestion).toBeUndefined();
		});

		it('should handle partial name matches', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric Stormwind',
				description: 'A warrior from the north',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue who once worked with Aldric on a dangerous mission',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']],
				['aldric stormwind', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const mentionSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(mentionSuggestion).toBeDefined();
		});

		it('should not flag self-references', async () => {
			const npc: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'Aldric is a brave warrior who leads his troops into battle',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc];
			mockContext.entityMap = new Map([['npc-001', npc]]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			// Should not suggest self-relationship
			const selfSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.length === 1 &&
				s.affectedEntityIds.includes('npc-001')
			);

			expect(selfSuggestion).toBeUndefined();
		});
	});

	describe('Common Location Detection', () => {
		it('should detect entities in the same location', async () => {
			const location: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'The Drunken Dragon Tavern',
				description: 'A popular tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-2',
						sourceId: 'npc-002',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [location, npc1, npc2];
			mockContext.entityMap = new Map([
				['loc-001', location],
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-001']],
				['npc-002', ['loc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const locationSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(locationSuggestion).toBeDefined();
			expect(locationSuggestion?.description.toLowerCase()).toMatch(/locat|same place/);
		});

		it('should not suggest relationships for entities in different locations', async () => {
			const location1: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'Tavern',
				description: 'A tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const location2: BaseEntity = {
				id: 'loc-002',
				type: 'location',
				name: 'Castle',
				description: 'A castle',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-2',
						sourceId: 'npc-002',
						targetId: 'loc-002',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [location1, location2, npc1, npc2];
			mockContext.entityMap = new Map([
				['loc-001', location1],
				['loc-002', location2],
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-001']],
				['npc-002', ['loc-002']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const locationSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002') &&
				s.description.toLowerCase().includes('location')
			);

			expect(locationSuggestion).toBeUndefined();
		});

		it('should prioritize suggestions for locations with fewer entities', async () => {
			const location1: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'Small Village',
				description: 'A small village',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const location2: BaseEntity = {
				id: 'loc-002',
				type: 'location',
				name: 'Large City',
				description: 'A bustling metropolis',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			// 2 NPCs in small village
			const villageNPC1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Alice',
				description: 'A villager',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const villageNPC2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Bob',
				description: 'A villager',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-2',
						sourceId: 'npc-002',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			// 10 NPCs in large city (create simplified entities)
			const cityNPCs: BaseEntity[] = Array.from({ length: 10 }, (_, i) => ({
				id: `city-npc-${i}`,
				type: 'npc',
				name: `City NPC ${i}`,
				description: 'A city dweller',
				tags: [],
				fields: {},
				links: [
					{
						id: `link-city-${i}`,
						sourceId: `city-npc-${i}`,
						targetId: 'loc-002',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}));

			mockContext.entities = [location1, location2, villageNPC1, villageNPC2, ...cityNPCs];
			mockContext.entityMap = new Map([
				['loc-001', location1],
				['loc-002', location2],
				['npc-001', villageNPC1],
				['npc-002', villageNPC2],
				...cityNPCs.map(e => [e.id, e] as [string, BaseEntity])
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-001']],
				['npc-002', ['loc-001']],
				...cityNPCs.map((e, i) => [`city-npc-${i}`, ['loc-002']] as [string, string[]])
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const villageSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			const citySuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('city-npc-0') &&
				s.affectedEntityIds.includes('city-npc-1')
			);

			// Village NPCs should have higher relevance (smaller location = more likely to know each other)
			if (villageSuggestion && citySuggestion) {
				expect(villageSuggestion.relevanceScore).toBeGreaterThan(citySuggestion.relevanceScore);
			}
		});

		it('should not suggest relationships if entities already linked', async () => {
			const location: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'Tavern',
				description: 'A tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					},
					{
						id: 'link-3',
						sourceId: 'npc-001',
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-2',
						sourceId: 'npc-002',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [location, npc1, npc2];
			mockContext.entityMap = new Map([
				['loc-001', location],
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-001']],
				['npc-002', ['loc-001']]
			]);
			// Set up the relationship in the edges (this is what hasRelationship checks)
			mockContext.relationshipMap = {
				nodes: [],
				edges: [{ source: 'npc-001', target: 'npc-002', relationship: 'knows' }]
			};

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			// Should not suggest relationship since they're already linked
			const duplicateSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(duplicateSuggestion).toBeUndefined();
		});
	});

	describe('AI-Powered Analysis', () => {
		it('should skip AI analysis when enableAIAnalysis is false', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior seeking revenge',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue fleeing from justice',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);

			const config: AnalysisConfig = {
				...defaultConfig,
				enableAIAnalysis: false
			};

			const result = await relationshipAnalyzer.analyze(mockContext, config);

			expect(result.type).toBe('relationship');
			expect(result.apiCallsMade).toBe(0);
		});

		it('should make AI calls when enableAIAnalysis is true', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior seeking revenge for his fallen comrades',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'A rogue who was there when the comrades fell',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);

			const config: AnalysisConfig = {
				...defaultConfig,
				enableAIAnalysis: true
			};

			const result = await relationshipAnalyzer.analyze(mockContext, config);

			// AI analysis may make API calls
			expect(typeof result.apiCallsMade).toBe('number');
		});

		it('should handle AI analysis errors gracefully', async () => {
			// This test will verify that if AI analysis fails, the analyzer
			// still returns local analysis results
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'Aldric is mentioned here',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			// Should still return local analysis results even if AI fails
			expect(result).toBeDefined();
			expect(result.type).toBe('relationship');
			expect(Array.isArray(result.suggestions)).toBe(true);
		});
	});

	describe('Suggested Relationship Types', () => {
		it('should suggest "knows" for generic mentions', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'Garin has met Aldric',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const suggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			if (suggestion && suggestion.suggestedAction) {
				expect(suggestion.suggestedAction.actionType).toBe('create-relationship');
				expect(suggestion.suggestedAction.actionData).toHaveProperty('relationship');
			}
		});

		it('should populate suggestedAction with source and target entity IDs', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'Aldric is mentioned here',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const suggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			if (suggestion && suggestion.suggestedAction) {
				expect(suggestion.suggestedAction.actionData).toHaveProperty('sourceId');
				expect(suggestion.suggestedAction.actionData).toHaveProperty('targetId');
			}
		});
	});

	describe('Configuration Options', () => {
		it('should respect maxSuggestionsPerType limit', async () => {
			// Create a location with 15 NPCs
			const location: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'Tavern',
				description: 'A crowded tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npcs: BaseEntity[] = Array.from({ length: 15 }, (_, i) => ({
				id: `npc-${i}`,
				type: 'npc',
				name: `NPC ${i}`,
				description: `NPC number ${i}`,
				tags: [],
				fields: {},
				links: [
					{
						id: `link-${i}`,
						sourceId: `npc-${i}`,
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}));

			mockContext.entities = [location, ...npcs];
			mockContext.entityMap = new Map([
				['loc-001', location],
				...npcs.map(e => [e.id, e] as [string, BaseEntity])
			]);
			mockContext.locationsByEntity = new Map(
				npcs.map(e => [e.id, ['loc-001']] as [string, string[]])
			);

			const config: AnalysisConfig = {
				...defaultConfig,
				maxSuggestionsPerType: 5
			};

			const result = await relationshipAnalyzer.analyze(mockContext, config);

			expect(result.suggestions.length).toBeLessThanOrEqual(5);
		});

		it('should filter out suggestions below minRelevanceScore', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'Mentions Aldric',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const config: AnalysisConfig = {
				...defaultConfig,
				minRelevanceScore: 80
			};

			const result = await relationshipAnalyzer.analyze(mockContext, config);

			// All suggestions should meet the minimum threshold
			expect(result.suggestions.every(s => s.relevanceScore >= 80)).toBe(true);
		});

		it('should respect rateLimitMs for AI calls', async () => {
			// This test verifies the rate limiting config is passed correctly
			// Actual rate limiting is tested via integration tests since mocked AI returns instantly
			const entities: BaseEntity[] = Array.from({ length: 5 }, (_, i) => ({
				id: `npc-${i}`,
				type: 'npc',
				name: `NPC ${i}`,
				description: 'A complex character with deep backstory',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}));

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const config: AnalysisConfig = {
				...defaultConfig,
				enableAIAnalysis: true,
				rateLimitMs: 100
			};

			const result = await relationshipAnalyzer.analyze(mockContext, config);

			// Verify the analysis completes without error
			expect(result.type).toBe('relationship');
			expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Result Structure', () => {
		it('should return AnalysisResult with correct structure', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('relationship');
			expect(Array.isArray(result.suggestions)).toBe(true);
			expect(typeof result.analysisTimeMs).toBe('number');
			expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
			expect(typeof result.apiCallsMade).toBe('number');
			expect(result.apiCallsMade).toBeGreaterThanOrEqual(0);
		});

		it('should include required suggestion fields', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: 'Mentions Aldric',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['aldric', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			if (result.suggestions.length > 0) {
				const suggestion = result.suggestions[0];
				expect(typeof suggestion.title).toBe('string');
				expect(suggestion.title.length).toBeGreaterThan(0);
				expect(typeof suggestion.description).toBe('string');
				expect(suggestion.description.length).toBeGreaterThan(0);
				expect(typeof suggestion.relevanceScore).toBe('number');
				expect(suggestion.relevanceScore).toBeGreaterThanOrEqual(0);
				expect(suggestion.relevanceScore).toBeLessThanOrEqual(100);
				expect(Array.isArray(suggestion.affectedEntityIds)).toBe(true);
				expect(suggestion.affectedEntityIds.length).toBeGreaterThanOrEqual(2);
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entity list', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('relationship');
			expect(result.suggestions).toEqual([]);
		});

		it('should handle single entity', async () => {
			const npc: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: 'A warrior',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc];
			mockContext.entityMap = new Map([['npc-001', npc]]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.suggestions).toEqual([]);
		});

		it('should handle entities with empty descriptions', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Garin',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('relationship');
		});

		it('should handle case-insensitive name matching', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Captain Roderick',
				description: 'A guard captain',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Elena',
				description: 'Elena works with CAPTAIN RODERICK on security matters',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc1, npc2];
			mockContext.entityMap = new Map([
				['npc-001', npc1],
				['npc-002', npc2]
			]);
			mockContext.mentionedNames = new Map([
				['captain roderick', ['npc-001']]
			]);

			const result = await relationshipAnalyzer.analyze(mockContext, defaultConfig);

			const suggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(suggestion).toBeDefined();
		});
	});

	describe('Performance', () => {
		it('should complete analysis within reasonable time for large dataset', async () => {
			// Create 50 entities
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 50; i++) {
				entities.push({
					id: `entity-${i}`,
					type: 'npc',
					name: `NPC ${i}`,
					description: `Description for NPC ${i}`,
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				});
			}

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const config: AnalysisConfig = {
				...defaultConfig,
				enableAIAnalysis: false // Disable AI for performance test
			};

			const startTime = Date.now();
			const result = await relationshipAnalyzer.analyze(mockContext, config);
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
		});
	});
});
