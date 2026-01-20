/**
 * Tests for Inconsistency Analyzer (TDD RED Phase)
 *
 * The inconsistency analyzer detects data conflicts and inconsistencies across entities:
 * - Location conflicts: Entity references multiple incompatible locations
 * - Status conflicts: Active relationships with deceased/inactive entities
 * - Name duplicates: Similar entity names that might be duplicates
 * - Relationship asymmetry: Bidirectional relationships missing reverse link
 *
 * These tests will FAIL until implementation is complete.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inconsistencyAnalyzer } from './inconsistencyAnalyzer';
import type { BaseEntity, EntityId } from '$lib/types';
import type { EntityAnalysisContext, AnalysisConfig } from './types';

describe('inconsistencyAnalyzer', () => {
	let mockContext: EntityAnalysisContext;
	let defaultConfig: AnalysisConfig;

	beforeEach(() => {
		// Default configuration
		defaultConfig = {
			maxSuggestionsPerType: 10,
			minRelevanceScore: 30,
			enableAIAnalysis: true,
			rateLimitMs: 1000,
			expirationDays: 7
		};

		// Initialize empty context
		mockContext = {
			entities: [],
			entityMap: new Map(),
			relationshipMap: { nodes: [], edges: [] },
			locationsByEntity: new Map(),
			mentionedNames: new Map()
		};
	});

	describe('Analyzer Properties', () => {
		it('should have type "inconsistency"', () => {
			expect(inconsistencyAnalyzer.type).toBe('inconsistency');
		});

		it('should have analyze method', () => {
			expect(typeof inconsistencyAnalyzer.analyze).toBe('function');
		});
	});

	describe('Location Conflicts', () => {
		it('should detect entity with multiple incompatible location references', async () => {
			// Create entity linked to two different locations
			const tavern: BaseEntity = {
				id: 'loc-tavern',
				type: 'location',
				name: 'The Drunken Dragon Tavern',
				description: 'A rowdy tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const castle: BaseEntity = {
				id: 'loc-castle',
				type: 'location',
				name: 'Stormwatch Castle',
				description: 'A fortress on the mountain',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Garin the Merchant',
				description: 'A traveling merchant',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-tavern',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					},
					{
						id: 'link-2',
						sourceId: 'npc-001',
						targetId: 'loc-castle',
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

			mockContext.entities = [npc, tavern, castle];
			mockContext.entityMap = new Map([
				['npc-001', npc],
				['loc-tavern', tavern],
				['loc-castle', castle]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-tavern', 'loc-castle']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('inconsistency');
			expect(result.suggestions.length).toBeGreaterThan(0);

			const locationConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('location') &&
				s.affectedEntityIds.includes('npc-001')
			);

			expect(locationConflict).toBeDefined();
			expect(locationConflict?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
			expect(locationConflict?.description).toContain('multiple');
		});

		it('should not flag entity with single location', async () => {
			const tavern: BaseEntity = {
				id: 'loc-tavern',
				type: 'location',
				name: 'The Drunken Dragon Tavern',
				description: 'A rowdy tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Garin the Merchant',
				description: 'A traveling merchant',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-tavern',
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

			mockContext.entities = [npc, tavern];
			mockContext.entityMap = new Map([
				['npc-001', npc],
				['loc-tavern', tavern]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-tavern']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const locationConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('location') &&
				s.affectedEntityIds.includes('npc-001')
			);

			expect(locationConflict).toBeUndefined();
		});

		it('should handle nested locations gracefully', async () => {
			// Tavern is inside a city - this is valid hierarchy, not a conflict
			const city: BaseEntity = {
				id: 'loc-city',
				type: 'location',
				name: 'Waterdeep',
				description: 'A great city',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const tavern: BaseEntity = {
				id: 'loc-tavern',
				type: 'location',
				name: 'The Drunken Dragon Tavern',
				description: 'A rowdy tavern',
				tags: [],
				fields: { parent_location: 'Waterdeep' },
				links: [
					{
						id: 'link-parent',
						sourceId: 'loc-tavern',
						targetId: 'loc-city',
						targetType: 'location',
						relationship: 'located_in',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const npc: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Garin the Merchant',
				description: 'A traveling merchant',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'loc-tavern',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false
					},
					{
						id: 'link-2',
						sourceId: 'npc-001',
						targetId: 'loc-city',
						targetType: 'location',
						relationship: 'located_in',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [npc, tavern, city];
			mockContext.entityMap = new Map([
				['npc-001', npc],
				['loc-tavern', tavern],
				['loc-city', city]
			]);
			mockContext.locationsByEntity = new Map([
				['npc-001', ['loc-tavern', 'loc-city']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Should not flag nested locations as conflict
			const locationConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('location conflict') &&
				s.affectedEntityIds.includes('npc-001')
			);

			// This test validates that implementation correctly handles hierarchical locations
			expect(locationConflict).toBeUndefined();
		});
	});

	describe('Status Conflicts', () => {
		it('should detect relationships to deceased entities', async () => {
			const deceasedNPC: BaseEntity = {
				id: 'npc-deceased',
				type: 'npc',
				name: 'Lord Blackthorn',
				description: 'Former ruler of the realm',
				tags: ['deceased'],
				fields: { status: 'deceased' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const activeNPC: BaseEntity = {
				id: 'npc-active',
				type: 'npc',
				name: 'Sir Roland',
				description: 'A loyal knight',
				tags: [],
				fields: { status: 'active' },
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-active',
						targetId: 'npc-deceased',
						targetType: 'npc',
						relationship: 'serves',
						bidirectional: false
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [activeNPC, deceasedNPC];
			mockContext.entityMap = new Map([
				['npc-active', activeNPC],
				['npc-deceased', deceasedNPC]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const statusConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('status') &&
				s.affectedEntityIds.includes('npc-active')
			);

			expect(statusConflict).toBeDefined();
			expect(statusConflict?.description.toLowerCase()).toMatch(/deceased|inactive/);
			expect(statusConflict?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should not flag historical relationships to deceased entities', async () => {
			const deceasedNPC: BaseEntity = {
				id: 'npc-deceased',
				type: 'npc',
				name: 'Lord Blackthorn',
				description: 'Former ruler of the realm',
				tags: ['deceased', 'historical'],
				fields: { status: 'deceased' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const activeNPC: BaseEntity = {
				id: 'npc-active',
				type: 'npc',
				name: 'Sir Roland',
				description: 'A loyal knight',
				tags: [],
				fields: { status: 'active' },
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-active',
						targetId: 'npc-deceased',
						targetType: 'npc',
						relationship: 'served',
						bidirectional: false,
						notes: 'Past tense - historical relationship'
					}
				],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [activeNPC, deceasedNPC];
			mockContext.entityMap = new Map([
				['npc-active', activeNPC],
				['npc-deceased', deceasedNPC]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Past-tense relationship "served" should not be flagged
			const statusConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('status') &&
				s.affectedEntityIds.includes('npc-active')
			);

			expect(statusConflict).toBeUndefined();
		});

		it('should detect inactive faction memberships', async () => {
			const inactiveFaction: BaseEntity = {
				id: 'faction-001',
				type: 'faction',
				name: 'The Fallen Order',
				description: 'A disbanded order',
				tags: ['disbanded'],
				fields: { status: 'disbanded' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const character: BaseEntity = {
				id: 'char-001',
				type: 'character',
				name: 'Elena Stormwind',
				description: 'A mage',
				tags: [],
				fields: {},
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
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			mockContext.entities = [character, inactiveFaction];
			mockContext.entityMap = new Map([
				['char-001', character],
				['faction-001', inactiveFaction]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const statusConflict = result.suggestions.find(s =>
				s.title.toLowerCase().includes('status') &&
				s.affectedEntityIds.includes('char-001')
			);

			expect(statusConflict).toBeDefined();
			expect(statusConflict?.description.toLowerCase()).toMatch(/disbanded|inactive/);
		});
	});

	describe('Name Duplicates', () => {
		it('should detect exact name duplicates across different entities', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'John Smith',
				description: 'A blacksmith',
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
				name: 'John Smith',
				description: 'A merchant',
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
				['john smith', ['npc-001', 'npc-002']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const nameDuplicate = result.suggestions.find(s =>
				s.title.toLowerCase().includes('duplicate') &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(nameDuplicate).toBeDefined();
			expect(nameDuplicate?.description).toContain('John Smith');
			expect(nameDuplicate?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should detect similar names with minor variations', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Garin the Bold',
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
				name: 'Garin the Brave',
				description: 'A knight',
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
				['garin', ['npc-001', 'npc-002']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const nameSimilarity = result.suggestions.find(s =>
				(s.title.toLowerCase().includes('similar') || s.title.toLowerCase().includes('duplicate')) &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(nameSimilarity).toBeDefined();
			expect(nameSimilarity?.description.toLowerCase()).toMatch(/garin|similar/);
		});

		it('should not flag intentionally similar names (e.g., family members)', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Lord Edmund Blackwood',
				description: 'The patriarch',
				tags: ['noble', 'blackwood-family'],
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
				name: 'Lady Margaret Blackwood',
				description: 'His wife',
				tags: ['noble', 'blackwood-family'],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-002',
						targetId: 'npc-001',
						targetType: 'npc',
						relationship: 'married_to',
						bidirectional: true
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
				['blackwood', ['npc-001', 'npc-002']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Should not flag family members with shared surname as duplicates
			const nameDuplicate = result.suggestions.find(s =>
				s.title.toLowerCase().includes('duplicate') &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(nameDuplicate).toBeUndefined();
		});

		it('should use Levenshtein distance or similar algorithm for name comparison', async () => {
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
				name: 'Aldrich',
				description: 'A mage',
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Aldric vs Aldrich - only 1 character difference
			const nameSimilarity = result.suggestions.find(s =>
				s.title.toLowerCase().includes('similar') &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(nameSimilarity).toBeDefined();
		});
	});

	describe('Relationship Asymmetry', () => {
		it('should detect bidirectional relationship missing reverse link', async () => {
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
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'allied_with',
						bidirectional: true
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
				links: [], // Missing reverse link
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const asymmetry = result.suggestions.find(s =>
				s.title.toLowerCase().includes('asymmetric') &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(asymmetry).toBeDefined();
			expect(asymmetry?.description.toLowerCase()).toMatch(/bidirectional|reverse/);
			expect(asymmetry?.relevanceScore).toBeGreaterThanOrEqual(defaultConfig.minRelevanceScore);
		});

		it('should not flag unidirectional relationships', async () => {
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
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'respects',
						bidirectional: false // Explicitly unidirectional
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const asymmetry = result.suggestions.find(s =>
				s.title.toLowerCase().includes('asymmetric') &&
				s.affectedEntityIds.includes('npc-001')
			);

			expect(asymmetry).toBeUndefined();
		});

		it('should not flag when reverse link exists', async () => {
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
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'allied_with',
						bidirectional: true
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
						targetId: 'npc-001',
						targetType: 'npc',
						relationship: 'allied_with',
						bidirectional: true
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const asymmetry = result.suggestions.find(s =>
				s.title.toLowerCase().includes('asymmetric')
			);

			expect(asymmetry).toBeUndefined();
		});

		it('should handle asymmetric bidirectional relationships with reverseRelationship', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Lord Marcus',
				description: 'A noble patron',
				tags: [],
				fields: {},
				links: [
					{
						id: 'link-1',
						sourceId: 'npc-001',
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'patron_of',
						bidirectional: true,
						reverseRelationship: 'client_of'
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
				name: 'Elena the Artist',
				description: 'A skilled painter',
				tags: [],
				fields: {},
				links: [], // Missing reverse link with client_of
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const asymmetry = result.suggestions.find(s =>
				s.title.toLowerCase().includes('asymmetric') &&
				s.affectedEntityIds.includes('npc-001') &&
				s.affectedEntityIds.includes('npc-002')
			);

			expect(asymmetry).toBeDefined();
			expect(asymmetry?.description.toLowerCase()).toMatch(/client_of|patron_of/);
		});
	});

	describe('Configuration Options', () => {
		it('should respect maxSuggestionsPerType limit', async () => {
			// Create 15 entities with exact duplicate names
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 15; i++) {
				entities.push({
					id: `npc-${i}`,
					type: 'npc',
					name: 'Duplicate Name',
					description: `NPC ${i}`,
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, config);

			expect(result.suggestions.length).toBeLessThanOrEqual(5);
		});

		it('should filter out suggestions below minRelevanceScore', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'John Smith',
				description: 'A blacksmith',
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
				name: 'John Smith',
				description: 'A merchant',
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
				['john smith', ['npc-001', 'npc-002']]
			]);

			const config: AnalysisConfig = {
				...defaultConfig,
				minRelevanceScore: 80
			};

			const result = await inconsistencyAnalyzer.analyze(mockContext, config);

			// All suggestions should meet the minimum threshold
			expect(result.suggestions.every(s => s.relevanceScore >= 80)).toBe(true);
		});
	});

	describe('Result Structure', () => {
		it('should return AnalysisResult with correct structure', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('inconsistency');
			expect(Array.isArray(result.suggestions)).toBe(true);
			expect(typeof result.analysisTimeMs).toBe('number');
			expect(result.analysisTimeMs).toBeGreaterThanOrEqual(0);
			expect(typeof result.apiCallsMade).toBe('number');
			expect(result.apiCallsMade).toBe(0); // Heuristic analyzer makes no API calls
		});

		it('should include required suggestion fields', async () => {
			const npc1: BaseEntity = {
				id: 'npc-001',
				type: 'npc',
				name: 'Duplicate',
				description: 'First',
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
				name: 'Duplicate',
				description: 'Second',
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
				['duplicate', ['npc-001', 'npc-002']]
			]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

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

		it('should populate suggestedAction for actionable inconsistencies', async () => {
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
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'allied_with',
						bidirectional: true
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			const asymmetry = result.suggestions.find(s =>
				s.title.toLowerCase().includes('asymmetric')
			);

			if (asymmetry) {
				expect(asymmetry.suggestedAction).toBeDefined();
				expect(asymmetry.suggestedAction?.actionType).toBe('create-relationship');
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty entity list', async () => {
			mockContext.entities = [];
			mockContext.entityMap = new Map();

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.type).toBe('inconsistency');
			expect(result.suggestions).toEqual([]);
			expect(result.apiCallsMade).toBe(0);
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			expect(result.suggestions).toEqual([]);
		});

		it('should handle entities with no relationships', async () => {
			const entities: BaseEntity[] = [
				{
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

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Should not crash, may return name similarity suggestions but no relationship issues
			expect(result).toBeDefined();
			expect(result.type).toBe('inconsistency');
		});

		it('should handle malformed or missing fields gracefully', async () => {
			const npc: BaseEntity = {
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

			mockContext.entities = [npc];
			mockContext.entityMap = new Map([['npc-001', npc]]);

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			expect(result).toBeDefined();
			expect(result.type).toBe('inconsistency');
		});

		it('should handle circular relationships', async () => {
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
						targetId: 'npc-002',
						targetType: 'npc',
						relationship: 'allies_with',
						bidirectional: true
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
						targetId: 'npc-001',
						targetType: 'npc',
						relationship: 'allies_with',
						bidirectional: true
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

			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);

			// Should handle circular refs without infinite loop
			expect(result).toBeDefined();
		});
	});

	describe('Performance', () => {
		it('should complete analysis within reasonable time for large dataset', async () => {
			// Create 100 entities
			const entities: BaseEntity[] = [];
			for (let i = 0; i < 100; i++) {
				entities.push({
					id: `entity-${i}`,
					type: 'npc',
					name: `NPC ${i}`,
					description: `Description ${i}`,
					tags: [],
					fields: {},
					links: [
						{
							id: `link-${i}`,
							sourceId: `entity-${i}`,
							targetId: `entity-${(i + 1) % 100}`,
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: false
						}
					],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				});
			}

			mockContext.entities = entities;
			mockContext.entityMap = new Map(entities.map(e => [e.id, e]));

			const startTime = Date.now();
			const result = await inconsistencyAnalyzer.analyze(mockContext, defaultConfig);
			const endTime = Date.now();

			expect(result).toBeDefined();
			expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
		});
	});
});
