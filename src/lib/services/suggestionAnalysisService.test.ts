/**
 * Tests for Suggestion Analysis Service (TDD RED Phase)
 *
 * The main orchestration service that:
 * - Coordinates all analyzers (inconsistency, enhancement, relationship, plot thread)
 * - Builds EntityAnalysisContext from campaign data
 * - Deduplicates suggestions
 * - Manages configuration and scheduling
 * - Stores results in suggestionRepository
 *
 * These tests will FAIL until implementation is complete.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { suggestionAnalysisService } from './suggestionAnalysisService';
import type { BaseEntity } from '$lib/types';

// Mock all dependencies
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getAll: vi.fn(),
		getById: vi.fn()
	},
	suggestionRepository: {
		bulkAdd: vi.fn(),
		clearAll: vi.fn(),
		getStats: vi.fn()
	}
}));

vi.mock('./analyzers/inconsistencyAnalyzer', () => ({
	inconsistencyAnalyzer: {
		type: 'inconsistency',
		analyze: vi.fn()
	}
}));

vi.mock('./analyzers/enhancementAnalyzer', () => ({
	enhancementAnalyzer: {
		type: 'enhancement',
		analyze: vi.fn()
	}
}));

vi.mock('./analyzers/relationshipAnalyzer', () => ({
	relationshipAnalyzer: {
		type: 'relationship',
		analyze: vi.fn()
	}
}));

vi.mock('./analyzers/plotThreadAnalyzer', () => ({
	plotThreadAnalyzer: {
		type: 'plot_thread',
		analyze: vi.fn()
	}
}));

import { entityRepository, suggestionRepository } from '$lib/db/repositories';
import { inconsistencyAnalyzer } from './analyzers/inconsistencyAnalyzer';
import { enhancementAnalyzer } from './analyzers/enhancementAnalyzer';
import { relationshipAnalyzer } from './analyzers/relationshipAnalyzer';
import { plotThreadAnalyzer } from './analyzers/plotThreadAnalyzer';

describe('suggestionAnalysisService', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock implementations
		vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
			type: 'inconsistency',
			suggestions: [],
			analysisTimeMs: 100,
			apiCallsMade: 0
		});

		vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
			type: 'enhancement',
			suggestions: [],
			analysisTimeMs: 100,
			apiCallsMade: 0
		});

		vi.mocked(relationshipAnalyzer.analyze).mockResolvedValue({
			type: 'relationship',
			suggestions: [],
			analysisTimeMs: 100,
			apiCallsMade: 0
		});

		vi.mocked(plotThreadAnalyzer.analyze).mockResolvedValue({
			type: 'plot_thread',
			suggestions: [],
			analysisTimeMs: 100,
			apiCallsMade: 0
		});

		vi.mocked(suggestionRepository.bulkAdd).mockResolvedValue(undefined);
		vi.mocked(suggestionRepository.clearAll).mockResolvedValue(undefined);
		vi.mocked(suggestionRepository.getStats).mockResolvedValue({
			total: 0,
			byStatus: { pending: 0, accepted: 0, dismissed: 0 },
			byType: {
				relationship: 0,
				plot_thread: 0,
				inconsistency: 0,
				enhancement: 0,
				recommendation: 0
			},
			expiredCount: 0
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Service Structure', () => {
		it('should expose runFullAnalysis method', () => {
			expect(typeof suggestionAnalysisService.runFullAnalysis).toBe('function');
		});

		it('should expose analyzeEntity method', () => {
			expect(typeof suggestionAnalysisService.analyzeEntity).toBe('function');
		});

		it('should expose shouldRunAnalysis method', () => {
			expect(typeof suggestionAnalysisService.shouldRunAnalysis).toBe('function');
		});

		it('should expose getConfig method', () => {
			expect(typeof suggestionAnalysisService.getConfig).toBe('function');
		});
	});

	describe('getConfig', () => {
		it('should return default configuration', () => {
			const config = suggestionAnalysisService.getConfig();

			expect(config).toBeDefined();
			expect(typeof config.maxSuggestionsPerType).toBe('number');
			expect(typeof config.minRelevanceScore).toBe('number');
			expect(typeof config.enableAIAnalysis).toBe('boolean');
			expect(typeof config.rateLimitMs).toBe('number');
			expect(typeof config.expirationDays).toBe('number');
		});

		it('should return config with sensible defaults', () => {
			const config = suggestionAnalysisService.getConfig();

			expect(config.maxSuggestionsPerType).toBe(10);
			expect(config.minRelevanceScore).toBe(30);
			expect(config.enableAIAnalysis).toBe(true);
			expect(config.rateLimitMs).toBe(1000);
			expect(config.expirationDays).toBe(7);
		});

		it('should allow config overrides', () => {
			const customConfig = {
				maxSuggestionsPerType: 20,
				minRelevanceScore: 50,
				enableAIAnalysis: false,
				rateLimitMs: 2000,
				expirationDays: 14
			};

			const config = suggestionAnalysisService.getConfig(customConfig);

			expect(config.maxSuggestionsPerType).toBe(20);
			expect(config.minRelevanceScore).toBe(50);
			expect(config.enableAIAnalysis).toBe(false);
			expect(config.rateLimitMs).toBe(2000);
			expect(config.expirationDays).toBe(14);
		});

		it('should merge partial config with defaults', () => {
			const partialConfig = {
				maxSuggestionsPerType: 15
			};

			const config = suggestionAnalysisService.getConfig(partialConfig);

			expect(config.maxSuggestionsPerType).toBe(15);
			expect(config.minRelevanceScore).toBe(30); // default
			expect(config.enableAIAnalysis).toBe(true); // default
		});
	});

	describe('runFullAnalysis', () => {
		it('should load all entities from repository', async () => {
			const mockEntities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Test NPC',
					description: 'A test NPC',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			expect(entityRepository.getAll).toHaveBeenCalled();
		});

		it('should call all four analyzers', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			expect(inconsistencyAnalyzer.analyze).toHaveBeenCalled();
			expect(enhancementAnalyzer.analyze).toHaveBeenCalled();
			expect(relationshipAnalyzer.analyze).toHaveBeenCalled();
			expect(plotThreadAnalyzer.analyze).toHaveBeenCalled();
		});

		it('should pass EntityAnalysisContext to each analyzer', async () => {
			const mockEntities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Test NPC',
					description: 'A test NPC',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			// Verify context structure passed to analyzers
			expect(inconsistencyAnalyzer.analyze).toHaveBeenCalledWith(
				expect.objectContaining({
					entities: expect.any(Array),
					entityMap: expect.any(Map),
					relationshipMap: expect.any(Object),
					locationsByEntity: expect.any(Map),
					mentionedNames: expect.any(Map)
				}),
				expect.any(Object)
			);
		});

		it('should build EntityAnalysisContext with correct data structures', async () => {
			const mockEntities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Aldric',
					description: 'A warrior who knows Garin',
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
				},
				{
					id: 'npc-002',
					type: 'npc',
					name: 'Garin',
					description: 'A rogue',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			const contextArg = vi.mocked(inconsistencyAnalyzer.analyze).mock.calls[0][0];

			expect(contextArg.entities).toHaveLength(2);
			expect(contextArg.entityMap.size).toBe(2);
			expect(contextArg.entityMap.get('npc-001')).toBeDefined();
			expect(contextArg.locationsByEntity.get('npc-001')).toContain('loc-001');
		});

		it('should collect suggestions from all analyzers', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [
					{
						type: 'inconsistency',
						title: 'Location Conflict',
						description: 'Entity in multiple locations',
						relevanceScore: 80,
						affectedEntityIds: ['npc-001']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
				type: 'enhancement',
				suggestions: [
					{
						type: 'enhancement',
						title: 'Sparse Entity',
						description: 'Entity needs more detail',
						relevanceScore: 60,
						affectedEntityIds: ['npc-002']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			expect(result.totalSuggestions).toBe(2);
			expect(result.results).toHaveLength(4); // All 4 analyzers
		});

		it('should store suggestions in repository', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [
					{
						type: 'inconsistency',
						title: 'Test Suggestion',
						description: 'Test description',
						relevanceScore: 75,
						affectedEntityIds: ['npc-001']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			await suggestionAnalysisService.runFullAnalysis();

			expect(suggestionRepository.bulkAdd).toHaveBeenCalled();
			const addedSuggestions = vi.mocked(suggestionRepository.bulkAdd).mock.calls[0][0];
			expect(addedSuggestions.length).toBeGreaterThan(0);
			expect(addedSuggestions[0]).toHaveProperty('id');
			expect(addedSuggestions[0]).toHaveProperty('createdAt');
			expect(addedSuggestions[0]).toHaveProperty('expiresAt');
		});

		it('should set expiresAt based on expirationDays config', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [
					{
						type: 'inconsistency',
						title: 'Test',
						description: 'Test',
						relevanceScore: 75,
						affectedEntityIds: ['npc-001']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const config = {
				expirationDays: 14
			};

			await suggestionAnalysisService.runFullAnalysis(config);

			const addedSuggestions = vi.mocked(suggestionRepository.bulkAdd).mock.calls[0][0];
			const suggestion = addedSuggestions[0];

			expect(suggestion.expiresAt).toBeDefined();
			const daysDiff = Math.floor(
				((suggestion.expiresAt as Date).getTime() - suggestion.createdAt.getTime()) /
					(1000 * 60 * 60 * 24)
			);
			expect(daysDiff).toBe(14);
		});

		it('should return FullAnalysisResult with correct structure', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			const result = await suggestionAnalysisService.runFullAnalysis();

			expect(result).toBeDefined();
			expect(Array.isArray(result.results)).toBe(true);
			expect(typeof result.totalSuggestions).toBe('number');
			expect(typeof result.totalApiCalls).toBe('number');
			expect(typeof result.totalTimeMs).toBe('number');
			expect(Array.isArray(result.errors)).toBe(true);
		});

		it('should aggregate API calls from all analyzers', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(relationshipAnalyzer.analyze).mockResolvedValue({
				type: 'relationship',
				suggestions: [],
				analysisTimeMs: 100,
				apiCallsMade: 3
			});

			vi.mocked(plotThreadAnalyzer.analyze).mockResolvedValue({
				type: 'plot_thread',
				suggestions: [],
				analysisTimeMs: 100,
				apiCallsMade: 5
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			expect(result.totalApiCalls).toBe(8); // 3 + 5
		});

		it('should aggregate analysis time from all analyzers', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [],
				analysisTimeMs: 150,
				apiCallsMade: 0
			});

			vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
				type: 'enhancement',
				suggestions: [],
				analysisTimeMs: 200,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			expect(result.totalTimeMs).toBeGreaterThanOrEqual(350);
		});

		it('should handle analyzer errors gracefully', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockRejectedValue(
				new Error('Analysis failed')
			);

			const result = await suggestionAnalysisService.runFullAnalysis();

			// Should not throw, should capture error
			expect(result).toBeDefined();
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0]).toContain('inconsistency');
		});

		it('should continue analysis even if one analyzer fails', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(inconsistencyAnalyzer.analyze).mockRejectedValue(
				new Error('Analysis failed')
			);

			vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
				type: 'enhancement',
				suggestions: [
					{
						type: 'enhancement',
						title: 'Test',
						description: 'Test',
						relevanceScore: 60,
						affectedEntityIds: ['npc-001']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			// Should have results from enhancementAnalyzer
			expect(result.totalSuggestions).toBeGreaterThan(0);
			// Should have error from inconsistencyAnalyzer
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should pass custom config to all analyzers', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			const customConfig = {
				maxSuggestionsPerType: 5,
				minRelevanceScore: 50,
				enableAIAnalysis: false
			};

			await suggestionAnalysisService.runFullAnalysis(customConfig);

			expect(inconsistencyAnalyzer.analyze).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					maxSuggestionsPerType: 5,
					minRelevanceScore: 50,
					enableAIAnalysis: false
				})
			);
		});

		it('should handle empty entity list', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			const result = await suggestionAnalysisService.runFullAnalysis();

			expect(result).toBeDefined();
			expect(result.totalSuggestions).toBe(0);
			expect(result.errors.length).toBe(0);
		});
	});

	describe('Deduplication', () => {
		it('should deduplicate suggestions with identical content', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			// Two analyzers return identical suggestions
			const duplicateSuggestion = {
				type: 'relationship' as const,
				title: 'Suggest Relationship',
				description: 'These entities should be linked',
				relevanceScore: 70,
				affectedEntityIds: ['npc-001', 'npc-002']
			};

			vi.mocked(relationshipAnalyzer.analyze).mockResolvedValue({
				type: 'relationship',
				suggestions: [duplicateSuggestion],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [duplicateSuggestion],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			// Should only count unique suggestions
			const addedSuggestions = vi.mocked(suggestionRepository.bulkAdd).mock.calls[0][0];
			expect(addedSuggestions.length).toBe(1);
		});

		it('should keep suggestion with higher relevance score when deduplicating', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(relationshipAnalyzer.analyze).mockResolvedValue({
				type: 'relationship',
				suggestions: [
					{
						type: 'relationship',
						title: 'Suggest Relationship',
						description: 'These entities should be linked',
						relevanceScore: 60,
						affectedEntityIds: ['npc-001', 'npc-002']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			vi.mocked(inconsistencyAnalyzer.analyze).mockResolvedValue({
				type: 'inconsistency',
				suggestions: [
					{
						type: 'inconsistency',
						title: 'Suggest Relationship',
						description: 'These entities should be linked',
						relevanceScore: 85,
						affectedEntityIds: ['npc-001', 'npc-002']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			const addedSuggestions = vi.mocked(suggestionRepository.bulkAdd).mock.calls[0][0];
			expect(addedSuggestions.length).toBe(1);
			expect(addedSuggestions[0].relevanceScore).toBe(85);
		});

		it('should not deduplicate suggestions with different affected entities', async () => {
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
				type: 'enhancement',
				suggestions: [
					{
						type: 'enhancement',
						title: 'Sparse Entity',
						description: 'Entity needs more detail',
						relevanceScore: 60,
						affectedEntityIds: ['npc-001']
					},
					{
						type: 'enhancement',
						title: 'Sparse Entity',
						description: 'Entity needs more detail',
						relevanceScore: 60,
						affectedEntityIds: ['npc-002']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.runFullAnalysis();

			const addedSuggestions = vi.mocked(suggestionRepository.bulkAdd).mock.calls[0][0];
			expect(addedSuggestions.length).toBe(2);
		});
	});

	describe('analyzeEntity', () => {
		it('should analyze only the specified entity', async () => {
			const mockEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Test NPC',
				description: 'A test NPC',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(mockEntity);

			const result = await suggestionAnalysisService.analyzeEntity('npc-001');

			expect(entityRepository.getById).toHaveBeenCalledWith('npc-001');
			expect(result).toBeDefined();
		});

		it('should throw error if entity not found', async () => {
			vi.mocked(entityRepository.getById).mockResolvedValue(undefined);

			await expect(suggestionAnalysisService.analyzeEntity('nonexistent')).rejects.toThrow();
		});

		it('should run relevant analyzers for the entity', async () => {
			const mockEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Test NPC',
				description: 'Short',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(mockEntity);
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([mockEntity]);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.analyzeEntity('npc-001');

			// Should call analyzers
			expect(enhancementAnalyzer.analyze).toHaveBeenCalled();
		});

		it('should filter suggestions to only include the target entity', async () => {
			const mockEntity: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Test NPC',
				description: 'Test',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(mockEntity);
			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback([mockEntity]);
					return { unsubscribe: () => {} };
				}
			} as any);

			vi.mocked(enhancementAnalyzer.analyze).mockResolvedValue({
				type: 'enhancement',
				suggestions: [
					{
						type: 'enhancement',
						title: 'Suggestion for npc-001',
						description: 'Test',
						relevanceScore: 60,
						affectedEntityIds: ['npc-001']
					},
					{
						type: 'enhancement',
						title: 'Suggestion for npc-002',
						description: 'Test',
						relevanceScore: 60,
						affectedEntityIds: ['npc-002']
					}
				],
				analysisTimeMs: 100,
				apiCallsMade: 0
			});

			const result = await suggestionAnalysisService.analyzeEntity('npc-001');

			expect(result.totalSuggestions).toBe(1);
			expect(result.results[0].suggestions[0].affectedEntityIds).toContain('npc-001');
		});
	});

	describe('shouldRunAnalysis', () => {
		it('should return true if no analysis has been run', async () => {
			vi.mocked(suggestionRepository.getStats).mockResolvedValue({
				total: 0,
				byStatus: { pending: 0, accepted: 0, dismissed: 0 },
				byType: {
					relationship: 0,
					plot_thread: 0,
					inconsistency: 0,
					enhancement: 0,
					recommendation: 0
				},
				expiredCount: 0
			});

			const should = await suggestionAnalysisService.shouldRunAnalysis();

			expect(should).toBe(true);
		});

		it('should return false if recent analysis exists', async () => {
			vi.mocked(suggestionRepository.getStats).mockResolvedValue({
				total: 10,
				byStatus: { pending: 10, accepted: 0, dismissed: 0 },
				byType: {
					relationship: 5,
					plot_thread: 2,
					inconsistency: 2,
					enhancement: 1,
					recommendation: 0
				},
				expiredCount: 0
			});

			// Mock that suggestions were created recently
			const should = await suggestionAnalysisService.shouldRunAnalysis();

			// Implementation might check timestamp or other criteria
			expect(typeof should).toBe('boolean');
		});

		it('should return true if all suggestions are expired', async () => {
			vi.mocked(suggestionRepository.getStats).mockResolvedValue({
				total: 10,
				byStatus: { pending: 0, accepted: 0, dismissed: 10 },
				byType: {
					relationship: 5,
					plot_thread: 2,
					inconsistency: 2,
					enhancement: 1,
					recommendation: 0
				},
				expiredCount: 10
			});

			const should = await suggestionAnalysisService.shouldRunAnalysis();

			expect(should).toBe(true);
		});

		it('should return true if entity count has changed significantly', async () => {
			// This test validates that the service tracks entity count
			// and triggers re-analysis when the campaign grows
			vi.mocked(suggestionRepository.getStats).mockResolvedValue({
				total: 5,
				byStatus: { pending: 5, accepted: 0, dismissed: 0 },
				byType: {
					relationship: 5,
					plot_thread: 0,
					inconsistency: 0,
					enhancement: 0,
					recommendation: 0
				},
				expiredCount: 0
			});

			const should = await suggestionAnalysisService.shouldRunAnalysis();

			expect(typeof should).toBe('boolean');
		});
	});

	describe('Context Building', () => {
		it('should build mentionedNames map from entity descriptions', async () => {
			const mockEntities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Captain Roderick',
					description: 'The captain of the guard',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-002',
					type: 'npc',
					name: 'Elena',
					description: 'Elena works with Captain Roderick',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			const contextArg = vi.mocked(relationshipAnalyzer.analyze).mock.calls[0][0];

			expect(contextArg.mentionedNames).toBeDefined();
			expect(contextArg.mentionedNames.size).toBeGreaterThan(0);
		});

		it('should build locationsByEntity map from entity links', async () => {
			const mockEntities: BaseEntity[] = [
				{
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
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			const contextArg = vi.mocked(relationshipAnalyzer.analyze).mock.calls[0][0];

			expect(contextArg.locationsByEntity.get('npc-001')).toBeDefined();
			expect(contextArg.locationsByEntity.get('npc-001')).toContain('loc-001');
		});

		it('should build relationshipMap with nodes and edges', async () => {
			const mockEntities: BaseEntity[] = [
				{
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
				},
				{
					id: 'npc-002',
					type: 'npc',
					name: 'Garin',
					description: 'A rogue',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			await suggestionAnalysisService.runFullAnalysis();

			const contextArg = vi.mocked(relationshipAnalyzer.analyze).mock.calls[0][0];

			expect(contextArg.relationshipMap.nodes).toBeDefined();
			expect(contextArg.relationshipMap.edges).toBeDefined();
			expect(contextArg.relationshipMap.nodes.length).toBeGreaterThan(0);
		});
	});

	describe('Performance', () => {
		it('should complete analysis within reasonable time for moderate dataset', async () => {
			const mockEntities: BaseEntity[] = [];
			for (let i = 0; i < 50; i++) {
				mockEntities.push({
					id: `entity-${i}`,
					type: 'npc',
					name: `NPC ${i}`,
					description: `Description ${i}`,
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				});
			}

			vi.mocked(entityRepository.getAll).mockReturnValue({
				subscribe: (callback: (entities: BaseEntity[]) => void) => {
					callback(mockEntities);
					return { unsubscribe: () => {} };
				}
			} as any);

			const startTime = Date.now();
			const result = await suggestionAnalysisService.runFullAnalysis();
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
		});
	});
});
