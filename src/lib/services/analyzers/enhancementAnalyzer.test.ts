/**
 * Tests for Enhancement Analyzer (TDD RED Phase)
 *
 * The enhancement analyzer detects entities that could be improved:
 * - Sparse entities: Minimal description/fields filled
 * - Missing summaries: Important entities without AI summaries
 * - Orphan entities: No relationships to other entities
 * - Missing core fields: Required-like fields that are empty
 *
 * These tests will FAIL until implementation is complete.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { enhancementAnalyzer } from './enhancementAnalyzer';
import type { BaseEntity } from '$lib/types';
import type { EntityAnalysisContext, AnalysisConfig } from './types';

describe('enhancementAnalyzer', () => {
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
		it('should have type "enhancement"', () => {
			expect(enhancementAnalyzer.type).toBe('enhancement');
		});

		it('should have analyze method', () => {
			expect(typeof enhancementAnalyzer.analyze).toBe('function');
		});
	});

	describe('Sparse Entity Detection', () => {
		it('should detect entity with minimal description', async () => {
			const sparseEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: 'A guy.',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [sparseEntity];
			mockContext.entityMap = new Map([['npc-001', sparseEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('enhancement');
			const sparseSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('sparse')
			);

			expect(sparseSuggestion).toBeDefined();
			expect(sparseSuggestion?.description.toLowerCase()).toMatch(/description|detail/);
			expect(sparseSuggestion?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should detect entity with empty description', async () => {
			const emptyDescEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [emptyDescEntity];
			mockContext.entityMap = new Map([['npc-001', emptyDescEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const sparseSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001')
			);

			expect(sparseSuggestion).toBeDefined();
			expect(sparseSuggestion?.relevanceScore).toBeGreaterThan(50); // Empty desc is high priority
		});

		it('should detect entity with minimal fields populated', async () => {
			const minimalFieldsEntity: BaseEntity = {
				id: 'char-001',
				type: 'character',
				name: 'Hero',
				description: 'A brave adventurer seeking glory.',
				tags: [],
				fields: {
					// Character type typically has class, level, alignment, background, etc.
					// Only one field populated
					class: 'Fighter'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [minimalFieldsEntity];
			mockContext.entityMap = new Map([['char-001', minimalFieldsEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const sparseSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('char-001') &&
				(s.title.toLowerCase().includes('field') || s.title.toLowerCase().includes('sparse'))
			);

			expect(sparseSuggestion).toBeDefined();
		});

		it('should not flag well-detailed entities', async () => {
			const detailedEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Aldric Stormwind',
				description: 'A veteran soldier of the Northern Campaign, Aldric now serves as captain of the guard in Waterdeep. His weathered face and graying hair speak to years of service, and the deep scar across his left cheek is a souvenir from the Battle of Thornwall. Despite his gruff exterior, he has a soft spot for helping young recruits.',
				summary: 'Veteran soldier and guard captain with a gruff exterior but kind heart',
				tags: ['guard', 'military', 'waterdeep'],
				fields: {
					age: 47,
					role: 'Captain of the Guard',
					personality: 'Stern but fair',
					background: 'Military veteran',
					alignment: 'Lawful Good'
				},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'stationed_at',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [detailedEntity];
			mockContext.entityMap = new Map([['npc-001', detailedEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const sparseSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('sparse')
			);

			expect(sparseSuggestion).toBeUndefined();
		});

		it('should calculate sparsity score based on description length and field count', async () => {
			const entity1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: 'A guy.',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const entity2: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Alice',
				description: 'A person who does things.',
				tags: [],
				fields: { role: 'merchant' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [entity1, entity2];
			mockContext.entityMap = new Map([
				['npc-001', entity1],
				['npc-002', entity2]
			]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const suggestion1 = result.suggestions.find(s => s.affectedEntityIds.includes('npc-001'));
			const suggestion2 = result.suggestions.find(s => s.affectedEntityIds.includes('npc-002'));

			// entity1 is sparser than entity2, so should have higher relevance score
			if (suggestion1 && suggestion2) {
				expect(suggestion1.relevanceScore).toBeGreaterThan(suggestion2.relevanceScore);
			}
		});
	});

	describe('Missing Summary Detection', () => {
		it('should detect important entity without AI summary', async () => {
			const importantEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Lord Blackwood',
				description: 'The ruler of the northern provinces, Lord Blackwood is a cunning politician who has maintained power through strategic alliances and ruthless suppression of dissent.',
				tags: ['noble', 'important', 'antagonist'],
				fields: {
					role: 'Provincial Lord',
					alignment: 'Lawful Evil',
					power_level: 'High'
				},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-001',
						targetType: 'location',
						relationship: 'rules',
						bidirectional: false
					},
					{
						id: 'link-2',
						sourceId: 'npc-001',
						targetId: 'faction-001',
						targetType: 'faction',
						relationship: 'leads',
						bidirectional: false
					}
				],
				notes: 'Key antagonist in the campaign',
				summary: undefined, // Missing summary
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [importantEntity];
			mockContext.entityMap = new Map([['npc-001', importantEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const summarySuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('summary')
			);

			expect(summarySuggestion).toBeDefined();
			expect(summarySuggestion?.description.toLowerCase()).toMatch(/summary|ai/);
			expect(summarySuggestion?.suggestedAction?.actionType).toBe('edit-entity');
		});

		it('should prioritize entities with more relationships for summaries', async () => {
			const wellConnectedEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Important NPC',
				description: 'A detailed description',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'entity-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: false
					},
					{
						id: 'link-2',
						sourceId: 'npc-001',
						targetId: 'entity-2',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: false
					},
					{
						id: 'link-3',
						sourceId: 'npc-001',
						targetId: 'entity-3',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					}
				],
				summary: undefined,
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const isolatedEntity: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Minor NPC',
				description: 'A detailed description',
				tags: [],
				fields: {},
				links: [],
				summary: undefined,
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [wellConnectedEntity, isolatedEntity];
			mockContext.entityMap = new Map([
				['npc-001', wellConnectedEntity],
				['npc-002', isolatedEntity]
			]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const suggestion1 = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('summary')
			);
			const suggestion2 = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-002') &&
				s.title.toLowerCase().includes('summary')
			);

			// Well-connected entity should have higher relevance score
			if (suggestion1 && suggestion2) {
				expect(suggestion1.relevanceScore).toBeGreaterThan(suggestion2.relevanceScore);
			}
		});

		it('should not flag entities that already have summaries', async () => {
			const entityWithSummary: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Garin',
				description: 'A merchant who travels the roads',
				summary: 'Traveling merchant',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [entityWithSummary];
			mockContext.entityMap = new Map([['npc-001', entityWithSummary]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const summarySuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('summary')
			);

			expect(summarySuggestion).toBeUndefined();
		});

		it('should not flag minor entities without summaries', async () => {
			const minorEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Random Guard',
				description: 'A guard.',
				tags: ['minor'],
				fields: {},
				links: [],
				summary: undefined,
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [minorEntity];
			mockContext.entityMap = new Map([['npc-001', minorEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const summarySuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('summary')
			);

			// Minor entities don't need summaries
			expect(summarySuggestion).toBeUndefined();
		});
	});

	describe('Orphan Entity Detection', () => {
		it('should detect entity with no relationships', async () => {
			const orphanEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Lonely NPC',
				description: 'An NPC with no connections',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [orphanEntity];
			mockContext.entityMap = new Map([['npc-001', orphanEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const orphanSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('orphan')
			);

			expect(orphanSuggestion).toBeDefined();
			expect(orphanSuggestion?.description.toLowerCase()).toMatch(/relationship|connect/);
			expect(orphanSuggestion?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should not flag entity with outgoing relationships', async () => {
			const connectedEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Connected NPC',
				description: 'An NPC with connections',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
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

			mockContext.entities = [connectedEntity];
			mockContext.entityMap = new Map([['npc-001', connectedEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const orphanSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.title.toLowerCase().includes('orphan')
			);

			expect(orphanSuggestion).toBeUndefined();
		});

		it('should not flag entity with incoming relationships', async () => {
			const targetEntity: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Target NPC',
				description: 'Referenced by others',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const sourceEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Source NPC',
				description: 'References target',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
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

			mockContext.entities = [targetEntity, sourceEntity];
			mockContext.entityMap = new Map([
				['npc-001', sourceEntity],
				['npc-002', targetEntity]
			]);
			mockContext.relationshipMap = {
				nodes: ['npc-001', 'npc-002'],
				edges: [
					{
						source: 'npc-001',
						target: 'npc-002',
						relationship: 'knows'
					}
				]
			};

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const orphanSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-002') &&
				s.title.toLowerCase().includes('orphan')
			);

			expect(orphanSuggestion).toBeUndefined();
		});

		it('should not flag certain entity types as orphans', async () => {
			// Session and timeline_event entities might naturally be orphaned
			const sessionEntity: BaseEntity = {
				id: 'session-001',
				type: 'session',
				name: 'Session 1',
				description: 'The party met in a tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [sessionEntity];
			mockContext.entityMap = new Map([['session-001', sessionEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const orphanSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('session-001') &&
				s.title.toLowerCase().includes('orphan')
			);

			// Sessions can be naturally orphaned
			expect(orphanSuggestion).toBeUndefined();
		});

		it('should prioritize orphan suggestions by entity importance', async () => {
			const importantOrphan: BaseEntity = {
				id: 'char-001',
				type: 'character',
				name: 'Main Character',
				description: 'The protagonist of the campaign',
				tags: ['player', 'important'],
				fields: {
					class: 'Paladin',
					level: 5
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const minorOrphan: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Random Merchant',
				description: 'A merchant',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [importantOrphan, minorOrphan];
			mockContext.entityMap = new Map([
				['char-001', importantOrphan],
				['npc-001', minorOrphan]
			]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const importantSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('char-001')
			);
			const minorSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001')
			);

			// Important entities should have higher relevance scores
			if (importantSuggestion && minorSuggestion) {
				expect(importantSuggestion.relevanceScore).toBeGreaterThan(minorSuggestion.relevanceScore);
			}
		});
	});

	describe('Missing Core Fields Detection', () => {
		it('should detect character without class field', async () => {
			const character: BaseEntity = {
				id: 'char-001',
				type: 'character',
				name: 'Hero',
				description: 'A brave adventurer',
				tags: [],
				fields: {
					level: 5,
					alignment: 'Lawful Good'
					// Missing: class
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [character];
			mockContext.entityMap = new Map([['char-001', character]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const missingFieldSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('char-001') &&
				s.title.toLowerCase().includes('field')
			);

			expect(missingFieldSuggestion).toBeDefined();
			expect(missingFieldSuggestion?.description.toLowerCase()).toMatch(/class|field/);
		});

		it('should detect location without region field', async () => {
			const location: BaseEntity = {
				id: 'loc-001',
				type: 'location',
				name: 'Waterdeep',
				description: 'A great city',
				tags: [],
				fields: {
					population: 50000
					// Missing: region, type
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [location];
			mockContext.entityMap = new Map([['loc-001', location]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const missingFieldSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('loc-001') &&
				s.title.toLowerCase().includes('field')
			);

			expect(missingFieldSuggestion).toBeDefined();
		});

		it('should detect faction without leader field', async () => {
			const faction: BaseEntity = {
				id: 'faction-001',
				type: 'faction',
				name: 'The Order',
				description: 'A knightly order',
				tags: [],
				fields: {
					alignment: 'Lawful Good'
					// Missing: leader, headquarters
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [faction];
			mockContext.entityMap = new Map([['faction-001', faction]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const missingFieldSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('faction-001') &&
				s.title.toLowerCase().includes('field')
			);

			expect(missingFieldSuggestion).toBeDefined();
		});

		it('should not flag custom entity types with missing fields', async () => {
			// Custom entity types don't have predefined core fields
			const customEntity: BaseEntity = {
				id: 'custom-001',
				type: 'magic_item',
				name: 'Sword of Power',
				description: 'A magical sword',
				tags: [],
				fields: {}, // Empty but acceptable for custom type
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [customEntity];
			mockContext.entityMap = new Map([['custom-001', customEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			const missingFieldSuggestion = result.suggestions.find(s =>
				s.affectedEntityIds.includes('custom-001') &&
				s.title.toLowerCase().includes('core field')
			);

			expect(missingFieldSuggestion).toBeUndefined();
		});
	});

	describe('Configuration Options', () => {
		it('should respect maxSuggestionsPerType limit', async () => {
			// Create 15 sparse entities
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 15; i++) {
				entities.push({
					id: `npc-${i}`,
					type: 'npc',
					name: `NPC ${i}`,
					description: 'Short.',
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
				maxSuggestionsPerType: 5
			};

			const result = await enhancementAnalyzer.analyze(mockContext, config);

			expect(result.suggestions.length).toBeLessThanOrEqual(5);
		});

		it('should filter out suggestions below minRelevanceScore', async () => {
			const sparseEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: 'A guy.',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [sparseEntity];
			mockContext.entityMap = new Map([['npc-001', sparseEntity]]);

			const config: AnalysisConfig = {
				...defaultConfig,
				minRelevanceScore: 80
			};

			const result = await enhancementAnalyzer.analyze(mockContext, config);

			// All suggestions should meet the minimum threshold
			expect(result.suggestions.every(s => s.relevanceScore >= 80)).toBe(true);
		});
	});

	describe('Result Structure', () => {
		it('should return AnalysisResult with correct structure', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('enhancement');
			expect(Array.isArray(result.suggestions)).toBe(true);
			expect(typeof result.analysisTimeMs).toBe('number');
			expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
			expect(typeof result.apiCallsMade).toBe('number');
			expect(result.apiCallsMade).toBe(0); // Heuristic analyzer makes no API calls
		});

		it('should include required suggestion fields', async () => {
			const sparseEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [sparseEntity];
			mockContext.entityMap = new Map([['npc-001', sparseEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

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
				expect(suggestion.affectedEntityIds.length).toBeGreaterThan(0);
			}
		});

		it('should populate suggestedAction with edit-entity action', async () => {
			const sparseEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [sparseEntity];
			mockContext.entityMap = new Map([['npc-001', sparseEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			if (result.suggestions.length > 0) {
				const suggestion = result.suggestions[0];
				expect(suggestion.suggestedAction).toBeDefined();
				expect(suggestion.suggestedAction?.actionType).toBe('edit-entity');
				expect(suggestion.suggestedAction?.actionData).toBeDefined();
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entity list', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('enhancement');
			expect(result.suggestions).toEqual([]);
			expect(result.apiCallsMade).toBe(0);
		});

		it('should handle single entity', async () => {
			const entity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Bob',
				description: 'A guy',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [entity];
			mockContext.entityMap = new Map([['npc-001', entity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('enhancement');
		});

		it('should handle entities with all fields populated', async () => {
			const completeEntity: BaseEntity = {
				id: 'char-001',
				type: 'character',
				name: 'Complete Character',
				description: 'A fully detailed character with extensive backstory and personality',
				summary: 'A complete character',
				tags: ['player', 'complete'],
				fields: {
					class: 'Paladin',
					level: 10,
					alignment: 'Lawful Good',
					background: 'Noble',
					personality: 'Brave and honorable',
					appearance: 'Tall with shining armor'
				},
				links: [
					{
						id: 'link-1',
						sourceId: 'char-001',
						targetId: 'faction-001',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false
					}
				],
				notes: 'Detailed notes',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [completeEntity];
			mockContext.entityMap = new Map([['char-001', completeEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			// Should not suggest any enhancements for complete entity
			const suggestionForEntity = result.suggestions.find(s =>
				s.affectedEntityIds.includes('char-001')
			);
			expect(suggestionForEntity).toBeUndefined();
		});

		it('should handle malformed or missing fields gracefully', async () => {
			const malformedEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: '',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [malformedEntity];
			mockContext.entityMap = new Map([['npc-001', malformedEntity]]);

			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('enhancement');
		});
	});

	describe('Performance', () => {
		it('should complete analysis within reasonable time for large dataset', async () => {
			// Create 100 sparse entities
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 100; i++) {
				entities.push({
					id: `entity-${i}`,
					type: 'npc',
					name: `NPC ${i}`,
					description: 'Short description.',
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

			const startTime = Date.now();
			const result = await enhancementAnalyzer.analyze(mockContext, defaultConfig);
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
		});
	});
});
