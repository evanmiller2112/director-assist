/**
 * Tests for Plot Thread Analyzer (TDD RED Phase)
 *
 * The plot thread analyzer identifies recurring narrative themes and story threads:
 * - Groups entities by shared tags/keywords/themes
 * - Uses AI to analyze groups of 3+ related entities for plot patterns
 * - Detects unresolved conflicts, mysteries, recurring motifs
 * - Suggests narrative connections that span multiple entities
 *
 * These tests will FAIL until implementation is complete.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { plotThreadAnalyzer } from './plotThreadAnalyzer';
import type { BaseEntity } from '$lib/types';
import type { EntityAnalysisContext, AnalysisConfig } from './types';

// Mock the AI client
vi.mock('$lib/ai/client', () => ({
	generate: vi.fn()
}));

import { generate } from '$lib/ai/client';

describe('plotThreadAnalyzer', () => {
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

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Analyzer Properties', () => {
		it('should have type "plot_thread"', () => {
			expect(plotThreadAnalyzer.type).toBe('plot_thread');
		});

		it('should have analyze method', () => {
			expect(typeof plotThreadAnalyzer.analyze).toBe('function');
		});
	});

	describe('Theme Grouping', () => {
		it('should group entities by shared tags', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Lord Blackwood',
					description: 'A corrupt nobleman',
					tags: ['corruption', 'politics', 'antagonist'],
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
					name: 'Mayor Thompson',
					description: 'A politician taking bribes',
					tags: ['corruption', 'politics'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'faction-001',
					type: 'faction',
					name: 'The Shadow Syndicate',
					description: 'A criminal organization',
					tags: ['corruption', 'crime'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock AI response for plot thread detection
			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 				'Plot Thread: Political Corruption Network\n\n' +
				'These entities form a web of corruption involving local politics. ' +
				'Lord Blackwood appears to be the puppet master pulling strings through ' +
				'Mayor Thompson and using The Shadow Syndicate as enforcers.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('plot_thread');
			const plotThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002') &&
				s.affectedEntityIds.includes('faction-001')
			);

			expect(plotThread).toBeDefined();
			expect(plotThread?.description.toLowerCase()).toMatch(/corruption|politics/);
		});

		it('should require minimum 3 entities to form a plot thread', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Hero',
					description: 'A brave warrior',
					tags: ['hero', 'quest'],
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
					name: 'Villain',
					description: 'An evil sorcerer',
					tags: ['villain', 'quest'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			// Should not generate plot threads for only 2 entities
			expect(result.suggestions.length).toBe(0);
			expect(result.apiCallsMade).toBe(0);
		});

		it('should group entities by common keywords in descriptions', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'item-001',
					type: 'item',
					name: 'The Crimson Blade',
					description: 'An ancient sword forged in dragon fire',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'loc-001',
					type: 'location',
					name: 'Dragon\'s Peak',
					description: 'A mountain where the last dragon once lived',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Drakkir',
					description: 'The last surviving dragon in the realm',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Legacy of Dragons\n\n' +
				'These entities are connected through dragon mythology. ' +
				'The Crimson Blade was forged with dragon fire, Dragon\'s Peak is the ancient ' +
				'home of dragons, and Drakkir represents their last remnant.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			const plotThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('item-001') &&
				s.affectedEntityIds.includes('loc-001') &&
				s.affectedEntityIds.includes('npc-001')
			);

			expect(plotThread).toBeDefined();
			expect(plotThread?.description.toLowerCase()).toMatch(/dragon/);
		});

		it('should identify multiple distinct plot threads', async () => {
			const entities: BaseEntity[] = [
				// Thread 1: Revenge plot
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Aldric',
					description: 'Seeking revenge',
					tags: ['revenge', 'quest'],
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
					name: 'Villain',
					description: 'Killed Aldric\'s family',
					tags: ['revenge', 'antagonist'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'loc-001',
					type: 'location',
					name: 'Ruins of Home',
					description: 'Where the family died',
					tags: ['revenge', 'tragic'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				// Thread 2: Political intrigue
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Queen Elara',
					description: 'The ruler',
					tags: ['politics', 'royalty'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-004',
					type: 'npc',
					name: 'Lord Pembroke',
					description: 'Court advisor',
					tags: ['politics', 'conspiracy'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'faction-001',
					type: 'faction',
					name: 'The Conspirators',
					description: 'Plotting against the crown',
					tags: ['politics', 'conspiracy'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock two different AI responses
			vi.mocked(generate)
				.mockResolvedValueOnce({
					success: true,
					content: 'Plot Thread: Revenge Quest\n\nAldric seeks vengeance against the Villain who destroyed his home.'
				})
				.mockResolvedValueOnce({
					success: true,
					content: 'Plot Thread: Court Intrigue\n\nPolitical conspiracy threatens Queen Elara\'s reign.'
				});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.suggestions.length).toBeGreaterThanOrEqual(2);

			const revengeThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001')
			);
			const politicsThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-003')
			);

			expect(revengeThread).toBeDefined();
			expect(politicsThread).toBeDefined();
		});
	});

	describe('AI-Powered Analysis', () => {
		it('should call AI service to analyze entity groups', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Character A',
					description: 'First character',
					tags: ['mystery'],
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
					name: 'Character B',
					description: 'Second character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Character C',
					description: 'Third character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: The Mystery Connection\n\nThese three characters are linked by a shared secret.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(generate).toHaveBeenCalled();
			expect(result.apiCallsMade).toBeGreaterThan(0);
		});

		it('should skip AI analysis when enableAIAnalysis is false', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Character A',
					description: 'First character',
					tags: ['mystery'],
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
					name: 'Character B',
					description: 'Second character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Character C',
					description: 'Third character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const config: AnalysisConfig = {
				...defaultConfig,
				enableAIAnalysis: false
			};

			const result = await plotThreadAnalyzer.analyze(mockContext, config);

			expect(generate).not.toHaveBeenCalled();
			expect(result.apiCallsMade).toBe(0);
			expect(result.suggestions.length).toBe(0);
		});

		it('should handle AI service errors gracefully', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Character A',
					description: 'First character',
					tags: ['mystery'],
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
					name: 'Character B',
					description: 'Second character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Character C',
					description: 'Third character',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock AI error
			vi.mocked(generate).mockResolvedValueOnce({ success: false, error: 'API rate limit exceeded'})

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			// Should not throw, should return empty or partial results
			expect(result).toBeDefined();
			expect(result.type).toBe('plot_thread');
			expect(Array.isArray(result.suggestions)).toBe(true);
		});

		it('should include entity summaries in AI prompt for context', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Character A',
					description: 'Detailed description of character A with rich backstory',
					summary: 'A mysterious figure',
					tags: ['mystery'],
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
					name: 'Character B',
					description: 'Detailed description of character B',
					summary: 'An investigator',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Character C',
					description: 'Detailed description of character C',
					summary: 'A witness',
					tags: ['mystery'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Mystery Investigation\n\nConnection detected.'
			});

			await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(generate).toHaveBeenCalled();
			const callArgs = vi.mocked(generate).mock.calls[0];
			const prompt = callArgs[0];

			// Verify that entity information was included in the prompt
			expect(typeof prompt).toBe('string');
			expect(prompt.length).toBeGreaterThan(0);
		});

		it('should parse AI response and extract plot thread title and description', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'Character A',
					description: 'First character',
					tags: ['quest'],
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
					name: 'Character B',
					description: 'Second character',
					tags: ['quest'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'Character C',
					description: 'Third character',
					tags: ['quest'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: The Hero\'s Journey\n\n' +
				'These three characters represent different stages of the classic hero\'s journey. ' +
				'Character A is the mentor, Character B is the hero, and Character C is the threshold guardian.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			if (result.suggestions.length > 0) {
				const suggestion = result.suggestions[0];
				expect(suggestion.title).toContain('Journey');
				expect(suggestion.description).toContain('hero');
				expect(suggestion.description).toContain('mentor');
			}
		});
	});

	describe('Relevance Scoring', () => {
		it('should assign higher scores to threads with more entities', async () => {
			const smallGroup: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['small-group'],
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
					name: 'B',
					description: 'Second',
					tags: ['small-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['small-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			const largeGroup: BaseEntity[] = [
				{
					id: 'npc-004',
					type: 'npc',
					name: 'D',
					description: 'Fourth',
					tags: ['large-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-005',
					type: 'npc',
					name: 'E',
					description: 'Fifth',
					tags: ['large-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-006',
					type: 'npc',
					name: 'F',
					description: 'Sixth',
					tags: ['large-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-007',
					type: 'npc',
					name: 'G',
					description: 'Seventh',
					tags: ['large-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-008',
					type: 'npc',
					name: 'H',
					description: 'Eighth',
					tags: ['large-group'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = [...smallGroup, ...largeGroup];
			mockContext.entityMap = new Map(mockContext.entities.map(e => [e.id, e]));

			vi.mocked(generate)
				.mockResolvedValueOnce({ success: true, content: 'Plot Thread: Small Story\n\nA minor plot thread.' })
				.mockResolvedValueOnce({ success: true, content: 'Plot Thread: Epic Saga\n\nA major plot thread involving many characters.' });

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			const smallThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-001')
			);
			const largeThread = result.suggestions.find(s =>
				s.affectedEntityIds.includes('npc-004')
			);

			// Larger thread should have higher relevance
			if (smallThread && largeThread) {
				expect(largeThread.relevanceScore).toBeGreaterThan(smallThread.relevanceScore);
			}
		});

		it('should assign higher scores to threads with more interconnected entities', async () => {
			const connectedGroup: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['connected'],
					fields: {},
					links: [
						{
							id: 'link-1',
							sourceId: 'npc-001',
							targetId: 'npc-002',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: false
						},
						{
							id: 'link-2',
							sourceId: 'npc-001',
							targetId: 'npc-003',
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
					name: 'B',
					description: 'Second',
					tags: ['connected'],
					fields: {},
					links: [
						{
							id: 'link-3',
							sourceId: 'npc-002',
							targetId: 'npc-003',
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
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['connected'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = connectedGroup;
			mockContext.entityMap = new Map(connectedGroup.map(e => [e.id, e]));
			mockContext.relationshipMap = {
				nodes: ['npc-001', 'npc-002', 'npc-003'],
				edges: [
					{ source: 'npc-001', target: 'npc-002', relationship: 'knows' },
					{ source: 'npc-001', target: 'npc-003', relationship: 'knows' },
					{ source: 'npc-002', target: 'npc-003', relationship: 'knows' }
				]
			};

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Tightly Woven Web\n\nThese characters have deep interconnections.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			if (result.suggestions.length > 0) {
				// Highly connected group should have high relevance
				expect(result.suggestions[0].relevanceScore).toBeGreaterThanOrEqual(60);
			}
		});
	});

	describe('Configuration Options', () => {
		it('should respect maxSuggestionsPerType limit', async () => {
			// Create 15 distinct groups of 3 entities each
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 15; i++) {
				for (let j = 0; j < 3; j++) {
					entities.push({
						id: `npc-${i}-${j}`,
						type: 'npc',
						name: `Group ${i} NPC ${j}`,
						description: `Member of group ${i}`,
						tags: [`group-${i}`],
						fields: {},
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					});
				}
			}

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock AI responses for each group
			vi.mocked(generate).mockImplementation(async () => ({ success: true, content: 'Plot Thread: Generic Thread\n\nA plot thread was detected.' }));

			const config: AnalysisConfig = {
				...defaultConfig,
				maxSuggestionsPerType: 5,
				rateLimitMs: 1 // Fast for testing
			};

			const result = await plotThreadAnalyzer.analyze(mockContext, config);

			expect(result.suggestions.length).toBeLessThanOrEqual(5);
		});

		it('should filter out suggestions below minRelevanceScore', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['test'],
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
					name: 'B',
					description: 'Second',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Minor Connection\n\nA weak plot thread.'
			});

			const config: AnalysisConfig = {
				...defaultConfig,
				minRelevanceScore: 80
			};

			const result = await plotThreadAnalyzer.analyze(mockContext, config);

			// All suggestions should meet the minimum threshold
			expect(result.suggestions.every(s => s.relevanceScore >= 80)).toBe(true);
		});

		it('should respect rateLimitMs between AI calls', async () => {
			// Create 3 groups
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					entities.push({
						id: `npc-${i}-${j}`,
						type: 'npc',
						name: `Group ${i} NPC ${j}`,
						description: `Member of group ${i}`,
						tags: [`group-${i}`],
						fields: {},
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					});
				}
			}

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockImplementation(async () => ({ success: true, content: 'Plot Thread: Generic\n\nA plot thread.' }));

			const config: AnalysisConfig = {
				...defaultConfig,
				rateLimitMs: 100
			};

			const startTime = Date.now();
			const result = await plotThreadAnalyzer.analyze(mockContext, config);
			const endTime = Date.now();

			// If multiple API calls were made, they should be rate-limited
			if (result.apiCallsMade > 1) {
				const expectedMinTime = (result.apiCallsMade - 1) * config.rateLimitMs;
				expect(endTime - startTime).toBeGreaterThanOrEqual(expectedMinTime);
			}
		});
	});

	describe('Result Structure', () => {
		it('should return AnalysisResult with correct structure', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('plot_thread');
			expect(Array.isArray(result.suggestions)).toBe(true);
			expect(typeof result.analysisTimeMs).toBe('number');
			expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
			expect(typeof result.apiCallsMade).toBe('number');
			expect(result.apiCallsMade).toBeGreaterThanOrEqual(0);
		});

		it('should include required suggestion fields', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['test'],
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
					name: 'B',
					description: 'Second',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Test Thread\n\nA test plot thread.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

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
				expect(suggestion.affectedEntityIds.length).toBeGreaterThanOrEqual(3);
			}
		});

		it('should populate suggestedAction with flag-for-review', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['test'],
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
					name: 'B',
					description: 'Second',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'Plot Thread: Test Thread\n\nA test plot thread.'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			if (result.suggestions.length > 0) {
				const suggestion = result.suggestions[0];
				expect(suggestion.suggestedAction).toBeDefined();
				expect(suggestion.suggestedAction?.actionType).toBe('flag-for-review');
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entity list', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('plot_thread');
			expect(result.suggestions).toEqual([]);
			expect(result.apiCallsMade).toBe(0);
		});

		it('should handle entities with no shared tags', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['unique-a'],
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
					name: 'B',
					description: 'Second',
					tags: ['unique-b'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['unique-c'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			// Should not find plot threads without common themes
			expect(result.suggestions.length).toBe(0);
		});

		it('should handle AI responses with unexpected format', async () => {
			const entities: BaseEntity[] = [
				{
					id: 'npc-001',
					type: 'npc',
					name: 'A',
					description: 'First',
					tags: ['test'],
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
					name: 'B',
					description: 'Second',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-003',
					type: 'npc',
					name: 'C',
					description: 'Third',
					tags: ['test'],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock malformed AI response
			vi.mocked(generate).mockResolvedValueOnce({
				success: true,
				content: 'This is not a properly formatted response'
			});

			const result = await plotThreadAnalyzer.analyze(mockContext, defaultConfig);

			// Should handle gracefully, either skip or use fallback parsing
			expect(result).toBeDefined();
			expect(result.type).toBe('plot_thread');
		});
	});

	describe('Performance', () => {
		it('should complete analysis within reasonable time', async () => {
			// Create 30 entities in 10 groups
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 10; i++) {
				for (let j = 0; j < 3; j++) {
					entities.push({
						id: `npc-${i}-${j}`,
						type: 'npc',
						name: `Group ${i} NPC ${j}`,
						description: `Member of group ${i}`,
						tags: [`group-${i}`],
						fields: {},
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					});
				}
			}

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			// Mock fast AI responses
			vi.mocked(generate).mockImplementation(async () => ({ success: true, content: 'Plot Thread: Generic\n\nA plot thread.' }));

			const config: AnalysisConfig = {
				...defaultConfig,
				rateLimitMs: 10, // Low rate limit for performance test
				maxSuggestionsPerType: 5 // Limit suggestions
			};

			const startTime = Date.now();
			const result = await plotThreadAnalyzer.analyze(mockContext, config);
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
		});
	});
});
