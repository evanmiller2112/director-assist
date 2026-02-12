/**
 * Tests for Player Data Store (TDD RED Phase)
 *
 * Issue #441: Player route layout and navigation
 *
 * This Svelte 5 runes-based store manages player export data state for the player view.
 * It provides reactive state, derived values, and helper methods for accessing and searching entities.
 *
 * Store API:
 * - State: data, isLoaded, isLoading, error
 * - Derived: campaignName, campaignDescription, entities, entityTypes, entitiesByType
 * - Methods: load, setLoading, setError, clear, getEntityById, searchEntities, getByType
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tick } from 'svelte';
import type { PlayerExport, PlayerEntity } from '$lib/types/playerExport';

// Create comprehensive mock data fixture
function createMockPlayerExport(): PlayerExport {
	const now = new Date('2025-01-15T12:00:00Z');

	const entities: PlayerEntity[] = [
		{
			id: 'char-1',
			type: 'Character',
			name: 'Aria Stormblade',
			description: 'A fierce warrior from the northern clans',
			summary: 'Warrior seeking revenge',
			tags: ['warrior', 'north', 'hero'],
			imageUrl: '/images/aria.jpg',
			fields: {
				level: 5,
				class: 'Fighter',
				hp: 45
			},
			links: [
				{
					id: 'link-1',
					targetId: 'char-2',
					targetType: 'Character',
					relationship: 'ally',
					bidirectional: true
				}
			],
			createdAt: now,
			updatedAt: now
		},
		{
			id: 'char-2',
			type: 'Character',
			name: 'Finn the Quick',
			description: 'A nimble rogue with a mysterious past',
			tags: ['rogue', 'stealth', 'hero'],
			fields: {
				level: 4,
				class: 'Rogue',
				hp: 32
			},
			links: [],
			createdAt: now,
			updatedAt: now
		},
		{
			id: 'loc-1',
			type: 'Location',
			name: 'The Crimson Tavern',
			description: 'A popular meeting spot in the city square',
			summary: 'Tavern where adventures begin',
			tags: ['tavern', 'city', 'social'],
			fields: {
				region: 'City Center',
				atmosphere: 'lively'
			},
			links: [],
			createdAt: now,
			updatedAt: now
		},
		{
			id: 'loc-2',
			type: 'Location',
			name: 'Shadowmire Forest',
			description: 'A dark and dangerous woodland filled with ancient magic',
			tags: ['forest', 'dangerous', 'magic'],
			fields: {
				region: 'Northern Wilds',
				dangerLevel: 'high'
			},
			links: [],
			createdAt: now,
			updatedAt: now
		},
		{
			id: 'item-1',
			type: 'Item',
			name: 'Blade of Dawn',
			description: 'A legendary sword that glows with holy light',
			tags: ['weapon', 'legendary', 'holy'],
			fields: {
				damage: '2d6',
				rarity: 'legendary',
				properties: ['finesse', 'versatile']
			},
			links: [],
			createdAt: now,
			updatedAt: now
		}
	];

	return {
		version: '1.0.0',
		exportedAt: now,
		campaignName: 'The Shattered Crown',
		campaignDescription: 'A tale of ancient prophecies and broken kingdoms',
		entities
	};
}

describe('Player Data Store', () => {
	let playerDataStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Dynamically import the store to get a fresh instance
		const module = await import('../playerData.svelte');
		playerDataStore = module.playerDataStore;

		// Clear store state to ensure test isolation
		playerDataStore.clear();
	});

	describe('Store Structure', () => {
		it('should expose data state', () => {
			expect(playerDataStore).toHaveProperty('data');
		});

		it('should expose isLoaded state', () => {
			expect(playerDataStore).toHaveProperty('isLoaded');
		});

		it('should expose isLoading state', () => {
			expect(playerDataStore).toHaveProperty('isLoading');
		});

		it('should expose error state', () => {
			expect(playerDataStore).toHaveProperty('error');
		});

		it('should expose campaignName derived state', () => {
			expect(playerDataStore).toHaveProperty('campaignName');
		});

		it('should expose campaignDescription derived state', () => {
			expect(playerDataStore).toHaveProperty('campaignDescription');
		});

		it('should expose entities derived state', () => {
			expect(playerDataStore).toHaveProperty('entities');
		});

		it('should expose entityTypes derived state', () => {
			expect(playerDataStore).toHaveProperty('entityTypes');
		});

		it('should expose entitiesByType derived state', () => {
			expect(playerDataStore).toHaveProperty('entitiesByType');
		});

		it('should expose load method', () => {
			expect(typeof playerDataStore.load).toBe('function');
		});

		it('should expose setLoading method', () => {
			expect(typeof playerDataStore.setLoading).toBe('function');
		});

		it('should expose setError method', () => {
			expect(typeof playerDataStore.setError).toBe('function');
		});

		it('should expose clear method', () => {
			expect(typeof playerDataStore.clear).toBe('function');
		});

		it('should expose getEntityById method', () => {
			expect(typeof playerDataStore.getEntityById).toBe('function');
		});

		it('should expose searchEntities method', () => {
			expect(typeof playerDataStore.searchEntities).toBe('function');
		});

		it('should expose getByType method', () => {
			expect(typeof playerDataStore.getByType).toBe('function');
		});
	});

	describe('Initial State', () => {
		it('should start with null data', () => {
			expect(playerDataStore.data).toBeNull();
		});

		it('should start with isLoaded as false', () => {
			expect(playerDataStore.isLoaded).toBe(false);
		});

		it('should start with isLoading as false', () => {
			expect(playerDataStore.isLoading).toBe(false);
		});

		it('should start with null error', () => {
			expect(playerDataStore.error).toBeNull();
		});

		it('should have empty string campaignName when no data loaded', () => {
			expect(playerDataStore.campaignName).toBe('');
		});

		it('should have empty string campaignDescription when no data loaded', () => {
			expect(playerDataStore.campaignDescription).toBe('');
		});

		it('should have empty entities array when no data loaded', () => {
			expect(playerDataStore.entities).toEqual([]);
		});

		it('should have empty entityTypes array when no data loaded', () => {
			expect(playerDataStore.entityTypes).toEqual([]);
		});

		it('should have empty entitiesByType object when no data loaded', () => {
			expect(playerDataStore.entitiesByType).toEqual({});
		});
	});

	describe('load() method', () => {
		it('should set data correctly', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.data).toEqual(mockData);
		});

		it('should set isLoaded to true', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.isLoaded).toBe(true);
		});

		it('should clear isLoading flag', async () => {
			const mockData = createMockPlayerExport();

			// Manually set loading to true first
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.isLoading).toBe(false);
		});

		it('should clear any previous error', async () => {
			const mockData = createMockPlayerExport();

			// Set an error first
			playerDataStore.setError('Previous error');
			expect(playerDataStore.error).toBe('Previous error');

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.error).toBeNull();
		});

		it('should update campaignName derived value', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.campaignName).toBe('The Shattered Crown');
		});

		it('should update campaignDescription derived value', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.campaignDescription).toBe('A tale of ancient prophecies and broken kingdoms');
		});

		it('should update entities derived value', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.entities).toHaveLength(5);
			expect(playerDataStore.entities).toEqual(mockData.entities);
		});

		it('should handle loading data with no entities', async () => {
			const mockData = createMockPlayerExport();
			mockData.entities = [];

			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.data).toEqual(mockData);
			expect(playerDataStore.entities).toEqual([]);
		});

		it('should replace previous data when loading new data', async () => {
			const firstData = createMockPlayerExport();
			const secondData = createMockPlayerExport();
			secondData.campaignName = 'New Campaign';
			secondData.entities = secondData.entities.slice(0, 2);

			playerDataStore.load(firstData);
			await tick();
			expect(playerDataStore.campaignName).toBe('The Shattered Crown');
			expect(playerDataStore.entities).toHaveLength(5);

			playerDataStore.load(secondData);
			await tick();
			expect(playerDataStore.campaignName).toBe('New Campaign');
			expect(playerDataStore.entities).toHaveLength(2);
		});
	});

	describe('setLoading() method', () => {
		it('should set isLoading to true', () => {
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);
		});

		it('should set isLoading to false', () => {
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);

			playerDataStore.setLoading(false);
			expect(playerDataStore.isLoading).toBe(false);
		});

		it('should not affect other state', () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);

			playerDataStore.setLoading(true);

			expect(playerDataStore.data).toEqual(mockData);
			expect(playerDataStore.isLoaded).toBe(true);
			expect(playerDataStore.error).toBeNull();
		});
	});

	describe('setError() method', () => {
		it('should set error message', () => {
			playerDataStore.setError('Failed to load data');
			expect(playerDataStore.error).toBe('Failed to load data');
		});

		it('should clear isLoading when error is set', () => {
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);

			playerDataStore.setError('Error occurred');
			expect(playerDataStore.isLoading).toBe(false);
		});

		it('should not affect loaded data', () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);

			playerDataStore.setError('Some error');

			expect(playerDataStore.data).toEqual(mockData);
			expect(playerDataStore.entities).toHaveLength(5);
		});

		it('should allow clearing error by passing null', () => {
			playerDataStore.setError('Error message');
			expect(playerDataStore.error).toBe('Error message');

			playerDataStore.setError(null);
			expect(playerDataStore.error).toBeNull();
		});
	});

	describe('clear() method', () => {
		it('should reset data to null', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			expect(playerDataStore.data).not.toBeNull();

			playerDataStore.clear();
			await tick();

			expect(playerDataStore.data).toBeNull();
		});

		it('should reset isLoaded to false', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			expect(playerDataStore.isLoaded).toBe(true);

			playerDataStore.clear();
			await tick();

			expect(playerDataStore.isLoaded).toBe(false);
		});

		it('should clear error', async () => {
			playerDataStore.setError('Some error');
			expect(playerDataStore.error).toBe('Some error');

			playerDataStore.clear();
			await tick();

			expect(playerDataStore.error).toBeNull();
		});

		it('should clear isLoading', async () => {
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);

			playerDataStore.clear();
			await tick();

			expect(playerDataStore.isLoading).toBe(false);
		});

		it('should reset derived values to defaults', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);

			playerDataStore.clear();
			await tick();

			expect(playerDataStore.campaignName).toBe('');
			expect(playerDataStore.campaignDescription).toBe('');
			expect(playerDataStore.entities).toEqual([]);
			expect(playerDataStore.entityTypes).toEqual([]);
			expect(playerDataStore.entitiesByType).toEqual({});
		});
	});

	describe('entityTypes derived state', () => {
		it('should return distinct entity types', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const types = playerDataStore.entityTypes;
			expect(types).toContain('Character');
			expect(types).toContain('Location');
			expect(types).toContain('Item');
			expect(types).toHaveLength(3);
		});

		it('should only include types that have entities', async () => {
			const mockData = createMockPlayerExport();
			// Keep only Character entities
			mockData.entities = mockData.entities.filter(e => e.type === 'Character');
			playerDataStore.load(mockData);
			await tick();

			const types = playerDataStore.entityTypes;
			expect(types).toEqual(['Character']);
		});

		it('should return empty array when no data loaded', () => {
			expect(playerDataStore.entityTypes).toEqual([]);
		});

		it('should handle data with no entities', async () => {
			const mockData = createMockPlayerExport();
			mockData.entities = [];
			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.entityTypes).toEqual([]);
		});

		it('should not duplicate types', async () => {
			const mockData = createMockPlayerExport();
			// Add more characters to ensure duplicates aren't included
			mockData.entities.push({
				id: 'char-3',
				type: 'Character',
				name: 'Another Character',
				description: 'Test',
				tags: [],
				fields: {},
				links: [],
				createdAt: new Date(),
				updatedAt: new Date()
			});
			playerDataStore.load(mockData);
			await tick();

			const types = playerDataStore.entityTypes;
			const characterCount = types.filter((t: string) => t === 'Character').length;
			expect(characterCount).toBe(1);
		});

		it('should be reactive to data changes', async () => {
			const firstData = createMockPlayerExport();
			firstData.entities = firstData.entities.filter(e => e.type === 'Character');

			playerDataStore.load(firstData);
			await tick();
			expect(playerDataStore.entityTypes).toEqual(['Character']);

			const secondData = createMockPlayerExport();
			secondData.entities = secondData.entities.filter(e => e.type === 'Location');

			playerDataStore.load(secondData);
			await tick();
			expect(playerDataStore.entityTypes).toEqual(['Location']);
		});
	});

	describe('entitiesByType derived state', () => {
		it('should group entities by type', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const byType = playerDataStore.entitiesByType;

			expect(byType['Character']).toBeDefined();
			expect(byType['Character']).toHaveLength(2);
			expect(byType['Location']).toHaveLength(2);
			expect(byType['Item']).toHaveLength(1);
		});

		it('should handle multiple entities of the same type', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const characters = playerDataStore.entitiesByType['Character'];
			expect(characters).toHaveLength(2);
			expect(characters[0].name).toBe('Aria Stormblade');
			expect(characters[1].name).toBe('Finn the Quick');
		});

		it('should handle single entity types', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const items = playerDataStore.entitiesByType['Item'];
			expect(items).toHaveLength(1);
			expect(items[0].name).toBe('Blade of Dawn');
		});

		it('should return empty object when no data loaded', () => {
			expect(playerDataStore.entitiesByType).toEqual({});
		});

		it('should preserve entity order within each type', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const locations = playerDataStore.entitiesByType['Location'];
			expect(locations[0].id).toBe('loc-1');
			expect(locations[1].id).toBe('loc-2');
		});

		it('should update reactively when data changes', async () => {
			const firstData = createMockPlayerExport();
			firstData.entities = firstData.entities.slice(0, 2); // Just 2 characters

			playerDataStore.load(firstData);
			await tick();
			expect(Object.keys(playerDataStore.entitiesByType)).toHaveLength(1);
			expect(playerDataStore.entitiesByType['Character']).toHaveLength(2);

			const secondData = createMockPlayerExport();
			playerDataStore.load(secondData);
			await tick();
			expect(Object.keys(playerDataStore.entitiesByType)).toHaveLength(3);
		});
	});

	describe('getEntityById() method', () => {
		beforeEach(async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();
		});

		it('should find entity by id', () => {
			const entity = playerDataStore.getEntityById('char-1');
			expect(entity).toBeDefined();
			expect(entity?.name).toBe('Aria Stormblade');
		});

		it('should return correct entity for each id', () => {
			const aria = playerDataStore.getEntityById('char-1');
			const finn = playerDataStore.getEntityById('char-2');
			const tavern = playerDataStore.getEntityById('loc-1');

			expect(aria?.name).toBe('Aria Stormblade');
			expect(finn?.name).toBe('Finn the Quick');
			expect(tavern?.name).toBe('The Crimson Tavern');
		});

		it('should return undefined for unknown id', () => {
			const result = playerDataStore.getEntityById('non-existent-id');
			expect(result).toBeUndefined();
		});

		it('should return undefined when no data loaded', () => {
			playerDataStore.clear();
			const result = playerDataStore.getEntityById('char-1');
			expect(result).toBeUndefined();
		});

		it('should handle empty string id', () => {
			const result = playerDataStore.getEntityById('');
			expect(result).toBeUndefined();
		});
	});

	describe('getByType() method', () => {
		beforeEach(async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();
		});

		it('should return all entities of given type', () => {
			const characters = playerDataStore.getByType('Character');
			expect(characters).toHaveLength(2);
			expect(characters.every((e: PlayerEntity) => e.type === 'Character')).toBe(true);
		});

		it('should return correct entities for Location type', () => {
			const locations = playerDataStore.getByType('Location');
			expect(locations).toHaveLength(2);
			expect(locations[0].name).toBe('The Crimson Tavern');
			expect(locations[1].name).toBe('Shadowmire Forest');
		});

		it('should return empty array for unknown type', () => {
			const result = playerDataStore.getByType('UnknownType');
			expect(result).toEqual([]);
		});

		it('should return empty array when no data loaded', () => {
			playerDataStore.clear();
			const result = playerDataStore.getByType('Character');
			expect(result).toEqual([]);
		});

		it('should handle empty string type', () => {
			const result = playerDataStore.getByType('');
			expect(result).toEqual([]);
		});

		it('should be case-sensitive for type matching', () => {
			const result = playerDataStore.getByType('character'); // lowercase
			expect(result).toEqual([]);
		});
	});

	describe('searchEntities() method', () => {
		beforeEach(async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();
		});

		describe('name matching', () => {
			it('should find entities by name (case-insensitive)', () => {
				const results = playerDataStore.searchEntities('aria');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Aria Stormblade');
			});

			it('should match partial names', () => {
				const results = playerDataStore.searchEntities('storm');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Aria Stormblade');
			});

			it('should handle uppercase query', () => {
				const results = playerDataStore.searchEntities('FINN');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Finn the Quick');
			});

			it('should handle mixed case query', () => {
				const results = playerDataStore.searchEntities('CrImSoN');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('The Crimson Tavern');
			});
		});

		describe('description matching', () => {
			it('should find entities by description (case-insensitive)', () => {
				const results = playerDataStore.searchEntities('warrior');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Aria Stormblade');
			});

			it('should match partial description text', () => {
				const results = playerDataStore.searchEntities('mysterious past');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Finn the Quick');
			});

			it('should handle description-only matches', () => {
				const results = playerDataStore.searchEntities('ancient magic');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Shadowmire Forest');
			});
		});

		describe('tag matching', () => {
			it('should find entities by tag (case-insensitive)', () => {
				const results = playerDataStore.searchEntities('rogue');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Finn the Quick');
			});

			it('should match tags with uppercase query', () => {
				const results = playerDataStore.searchEntities('HERO');
				expect(results).toHaveLength(2);
				expect(results.some((e: PlayerEntity) => e.name === 'Aria Stormblade')).toBe(true);
				expect(results.some((e: PlayerEntity) => e.name === 'Finn the Quick')).toBe(true);
			});

			it('should match partial tag text', () => {
				const results = playerDataStore.searchEntities('tav');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('The Crimson Tavern');
			});
		});

		describe('multi-field matching', () => {
			it('should match across name, description, and tags', () => {
				// 'holy' appears in description of Blade of Dawn
				const holyResults = playerDataStore.searchEntities('holy');
				expect(holyResults).toHaveLength(1);
				expect(holyResults[0].name).toBe('Blade of Dawn');
			});

			it('should not duplicate results if query matches multiple fields', () => {
				// 'warrior' appears in both description and tags of Aria
				const results = playerDataStore.searchEntities('warrior');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Aria Stormblade');
			});
		});

		describe('edge cases', () => {
			it('should return all entities for empty query', () => {
				const results = playerDataStore.searchEntities('');
				expect(results).toHaveLength(5);
			});

			it('should return all entities for whitespace-only query', () => {
				const results = playerDataStore.searchEntities('   ');
				expect(results).toHaveLength(5);
			});

			it('should return empty array when nothing matches', () => {
				const results = playerDataStore.searchEntities('xyznonexistent');
				expect(results).toEqual([]);
			});

			it('should return empty array when no data loaded', () => {
				playerDataStore.clear();
				const results = playerDataStore.searchEntities('aria');
				expect(results).toEqual([]);
			});

			it('should handle special characters in query', () => {
				const results = playerDataStore.searchEntities('the quick');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Finn the Quick');
			});

			it('should trim whitespace from query', () => {
				const results = playerDataStore.searchEntities('  blade  ');
				// "blade" matches both "Blade of Dawn" and "Aria Stormblade"
				expect(results).toHaveLength(2);
				expect(results.some((r: PlayerEntity) => r.name === 'Blade of Dawn')).toBe(true);
			});
		});

		describe('performance scenarios', () => {
			it('should handle entities without summary field', () => {
				// Finn and Locations don't have summary in the mock
				const results = playerDataStore.searchEntities('quick');
				expect(results).toHaveLength(1);
				expect(results[0].name).toBe('Finn the Quick');
			});

			it('should handle entities with empty tags array', () => {
				const mockData = createMockPlayerExport();
				mockData.entities[0].tags = [];
				playerDataStore.load(mockData);

				const results = playerDataStore.searchEntities('aria');
				expect(results).toHaveLength(1);
			});

			it('should handle entities with undefined optional fields', () => {
				const mockData = createMockPlayerExport();
				delete mockData.entities[0].summary;
				delete mockData.entities[0].imageUrl;
				playerDataStore.load(mockData);

				const results = playerDataStore.searchEntities('aria');
				expect(results).toHaveLength(1);
			});
		});
	});

	describe('Integration Tests', () => {
		it('should support complete workflow: load, search, get by id', async () => {
			const mockData = createMockPlayerExport();

			// Load data
			playerDataStore.load(mockData);
			await tick();
			expect(playerDataStore.isLoaded).toBe(true);

			// Search for entities
			const searchResults = playerDataStore.searchEntities('warrior');
			expect(searchResults).toHaveLength(1);

			// Get specific entity by ID
			const entity = playerDataStore.getEntityById(searchResults[0].id);
			expect(entity?.name).toBe('Aria Stormblade');
		});

		it('should handle load-clear-reload cycle', async () => {
			const mockData = createMockPlayerExport();

			// Initial load
			playerDataStore.load(mockData);
			await tick();
			expect(playerDataStore.entities).toHaveLength(5);

			// Clear
			playerDataStore.clear();
			await tick();
			expect(playerDataStore.entities).toEqual([]);

			// Reload
			playerDataStore.load(mockData);
			await tick();
			expect(playerDataStore.entities).toHaveLength(5);
		});

		it('should maintain derived state consistency after multiple operations', async () => {
			const mockData = createMockPlayerExport();

			playerDataStore.load(mockData);
			await tick();

			const types1 = playerDataStore.entityTypes;
			const byType1 = playerDataStore.entitiesByType;

			// These should be consistent
			expect(types1).toHaveLength(Object.keys(byType1).length);

			// Each type should have corresponding entities
			types1.forEach((type: string) => {
				expect(byType1[type]).toBeDefined();
				expect(byType1[type].length).toBeGreaterThan(0);
			});
		});

		it('should handle error recovery workflow', async () => {
			// Set loading state
			playerDataStore.setLoading(true);
			expect(playerDataStore.isLoading).toBe(true);

			// Simulate error
			playerDataStore.setError('Network error');
			expect(playerDataStore.error).toBe('Network error');
			expect(playerDataStore.isLoading).toBe(false);

			// Recover by loading data
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			expect(playerDataStore.error).toBeNull();
			expect(playerDataStore.isLoaded).toBe(true);
			expect(playerDataStore.data).toEqual(mockData);
		});

		it('should support type filtering and search combination', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			// Get all characters
			const characters = playerDataStore.getByType('Character');
			expect(characters).toHaveLength(2);

			// Search within the general dataset
			const heroResults = playerDataStore.searchEntities('hero');
			expect(heroResults).toHaveLength(2);

			// Both results should be characters (based on our test data)
			expect(heroResults.every((e: PlayerEntity) => e.type === 'Character')).toBe(true);
		});
	});

	describe('Reactivity', () => {
		it('should update all derived values when data changes', async () => {
			const firstData = createMockPlayerExport();
			firstData.campaignName = 'First Campaign';
			firstData.entities = firstData.entities.slice(0, 2);

			playerDataStore.load(firstData);
			await tick();

			expect(playerDataStore.campaignName).toBe('First Campaign');
			expect(playerDataStore.entities).toHaveLength(2);
			expect(playerDataStore.entityTypes).toHaveLength(1);

			const secondData = createMockPlayerExport();
			secondData.campaignName = 'Second Campaign';

			playerDataStore.load(secondData);
			await tick();

			expect(playerDataStore.campaignName).toBe('Second Campaign');
			expect(playerDataStore.entities).toHaveLength(5);
			expect(playerDataStore.entityTypes).toHaveLength(3);
		});

		it('should maintain referential stability for derived values when data unchanged', async () => {
			const mockData = createMockPlayerExport();
			playerDataStore.load(mockData);
			await tick();

			const entities1 = playerDataStore.entities;
			const types1 = playerDataStore.entityTypes;
			const byType1 = playerDataStore.entitiesByType;

			// Accessing again without data change should return same references
			const entities2 = playerDataStore.entities;
			const types2 = playerDataStore.entityTypes;
			const byType2 = playerDataStore.entitiesByType;

			expect(entities1).toBe(entities2);
			expect(types1).toBe(types2);
			expect(byType1).toBe(byType2);
		});
	});
});
