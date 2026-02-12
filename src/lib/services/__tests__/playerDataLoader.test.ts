/**
 * Tests for Player Data Loader Service (TDD RED Phase - Issue #442)
 *
 * These tests define expected behavior for loading, validating, and parsing
 * player_data.json exports. Tests should FAIL initially.
 *
 * Covers:
 * - Fetching data from URLs with proper error handling
 * - PlayerExport structure validation
 * - Entity validation with defensive filtering
 * - Link validation within entities
 * - Date parsing and defaulting
 * - Edge cases (null/undefined values, empty objects, missing fields)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	loadPlayerData,
	validatePlayerExport,
	validateEntity
} from '$lib/services/playerDataLoader';
import type { PlayerExport, PlayerEntity } from '$lib/types/playerExport';

describe('playerDataLoader', () => {
	describe('loadPlayerData() - Fetch behavior', () => {
		let mockFetch: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			mockFetch = vi.fn();
			global.fetch = mockFetch as any;
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe('Successful fetch scenarios', () => {
			it('should successfully fetch and parse valid data from URL', async () => {
				const validExport: PlayerExport = {
					version: '1.0.0',
					exportedAt: new Date('2025-01-15T10:00:00Z'),
					campaignName: 'Test Campaign',
					campaignDescription: 'A test campaign',
					entities: []
				};

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						version: '1.0.0',
						exportedAt: '2025-01-15T10:00:00Z',
						campaignName: 'Test Campaign',
						campaignDescription: 'A test campaign',
						entities: []
					})
				});

				const result = await loadPlayerData('https://example.com/player_data.json');

				expect(result.campaignName).toBe('Test Campaign');
				expect(result.campaignDescription).toBe('A test campaign');
				expect(result.version).toBe('1.0.0');
				expect(result.entities).toEqual([]);
			});

			it('should use default URL "/player_data.json" when no URL provided', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						campaignName: 'Default Campaign',
						entities: []
					})
				});

				await loadPlayerData();

				expect(mockFetch).toHaveBeenCalledWith('/player_data.json');
			});

			it('should convert ISO date strings to Date objects', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						campaignName: 'Test',
						exportedAt: '2025-01-15T10:00:00Z',
						entities: [
							{
								id: 'entity-1',
								type: 'character',
								name: 'Test',
								description: 'Test',
								tags: [],
								fields: {},
								links: [],
								createdAt: '2025-01-01T00:00:00Z',
								updatedAt: '2025-01-02T00:00:00Z'
							}
						]
					})
				});

				const result = await loadPlayerData();

				expect(result.exportedAt).toBeInstanceOf(Date);
				expect(result.entities[0].createdAt).toBeInstanceOf(Date);
				expect(result.entities[0].updatedAt).toBeInstanceOf(Date);
			});
		});

		describe('HTTP error scenarios', () => {
			it('should throw descriptive error on 404 with user-friendly message', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 404,
					statusText: 'Not Found'
				});

				await expect(loadPlayerData()).rejects.toThrow(
					'No campaign data has been published yet'
				);
			});

			it('should throw descriptive error on 500 server error', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error'
				});

				await expect(loadPlayerData()).rejects.toThrow(
					'Server error while loading campaign data (500: Internal Server Error)'
				);
			});

			it('should throw descriptive error on 403 forbidden', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 403,
					statusText: 'Forbidden'
				});

				await expect(loadPlayerData()).rejects.toThrow(
					'Server error while loading campaign data (403: Forbidden)'
				);
			});
		});

		describe('Network and parsing errors', () => {
			it('should throw error on network failure', async () => {
				mockFetch.mockRejectedValueOnce(new Error('Network error'));

				await expect(loadPlayerData()).rejects.toThrow(
					'Unable to load campaign data. Please check your connection and try again.'
				);
			});

			it('should throw error on malformed JSON response', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => {
						throw new SyntaxError('Unexpected token');
					}
				});

				await expect(loadPlayerData()).rejects.toThrow(
					'Campaign data file is corrupted or invalid'
				);
			});

			it('should throw error when JSON is valid but structure is invalid', async () => {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						// Missing required campaignName field
						entities: []
					})
				});

				await expect(loadPlayerData()).rejects.toThrow();
			});
		});
	});

	describe('validatePlayerExport() - Structure validation', () => {
		describe('Valid export data', () => {
			it('should return valid PlayerExport for well-formed data', () => {
				const rawData = {
					version: '1.0.0',
					exportedAt: '2025-01-15T10:00:00Z',
					campaignName: 'Test Campaign',
					campaignDescription: 'A test campaign',
					entities: []
				};

				const result = validatePlayerExport(rawData);

				expect(result.version).toBe('1.0.0');
				expect(result.campaignName).toBe('Test Campaign');
				expect(result.campaignDescription).toBe('A test campaign');
				expect(result.entities).toEqual([]);
				expect(result.exportedAt).toBeInstanceOf(Date);
			});

			it('should default campaignDescription to empty string if missing', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: []
				};

				const result = validatePlayerExport(rawData);

				expect(result.campaignDescription).toBe('');
			});

			it('should default version to "unknown" if missing', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: []
				};

				const result = validatePlayerExport(rawData);

				expect(result.version).toBe('unknown');
			});

			it('should convert exportedAt from ISO string to Date', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					exportedAt: '2025-01-15T10:00:00Z',
					entities: []
				};

				const result = validatePlayerExport(rawData);

				expect(result.exportedAt).toBeInstanceOf(Date);
				expect(result.exportedAt.toISOString()).toBe('2025-01-15T10:00:00.000Z');
			});

			it('should default exportedAt to current date if missing', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: []
				};

				const beforeDate = new Date();
				const result = validatePlayerExport(rawData);
				const afterDate = new Date();

				expect(result.exportedAt).toBeInstanceOf(Date);
				expect(result.exportedAt.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
				expect(result.exportedAt.getTime()).toBeLessThanOrEqual(afterDate.getTime());
			});

			it('should default exportedAt to current date if invalid', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					exportedAt: 'not-a-date',
					entities: []
				};

				const result = validatePlayerExport(rawData);

				expect(result.exportedAt).toBeInstanceOf(Date);
				expect(isNaN(result.exportedAt.getTime())).toBe(false);
			});
		});

		describe('Invalid export data', () => {
			it('should throw if data is null', () => {
				expect(() => validatePlayerExport(null)).toThrow();
			});

			it('should throw if data is undefined', () => {
				expect(() => validatePlayerExport(undefined)).toThrow();
			});

			it('should throw if data is not an object (string)', () => {
				expect(() => validatePlayerExport('not an object')).toThrow();
			});

			it('should throw if data is not an object (number)', () => {
				expect(() => validatePlayerExport(123)).toThrow();
			});

			it('should throw if data is not an object (array)', () => {
				expect(() => validatePlayerExport([])).toThrow();
			});

			it('should throw if campaignName is missing', () => {
				const rawData = {
					entities: []
				};

				expect(() => validatePlayerExport(rawData)).toThrow(
					'Invalid player export: missing required field "campaignName"'
				);
			});

			it('should throw if entities is missing', () => {
				const rawData = {
					campaignName: 'Test Campaign'
				};

				expect(() => validatePlayerExport(rawData)).toThrow(
					'Invalid player export: missing required field "entities"'
				);
			});

			it('should throw if entities is not an array', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: 'not an array'
				};

				expect(() => validatePlayerExport(rawData)).toThrow(
					'Invalid player export: "entities" must be an array'
				);
			});
		});

		describe('Entity filtering', () => {
			it('should filter out malformed entities while keeping valid ones', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: [
						{
							id: 'entity-1',
							type: 'character',
							name: 'Valid Entity',
							description: 'A valid entity',
							tags: [],
							fields: {},
							links: [],
							createdAt: '2025-01-01T00:00:00Z',
							updatedAt: '2025-01-02T00:00:00Z'
						},
						{
							// Missing required fields
							id: 'entity-2',
							type: 'location'
						},
						{
							id: 'entity-3',
							type: 'item',
							name: 'Another Valid Entity',
							description: 'Also valid',
							tags: [],
							fields: {},
							links: [],
							createdAt: '2025-01-01T00:00:00Z',
							updatedAt: '2025-01-02T00:00:00Z'
						}
					]
				};

				const result = validatePlayerExport(rawData);

				expect(result.entities).toHaveLength(2);
				expect(result.entities[0].name).toBe('Valid Entity');
				expect(result.entities[1].name).toBe('Another Valid Entity');
			});

			it('should return empty entities array when all are malformed', () => {
				const rawData = {
					campaignName: 'Test Campaign',
					entities: [
						{ id: 'entity-1' },
						{ name: 'No ID' },
						null,
						'not an object'
					]
				};

				const result = validatePlayerExport(rawData);

				expect(result.entities).toEqual([]);
			});
		});
	});

	describe('validateEntity() - Entity validation', () => {
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleWarnSpy.mockRestore();
		});

		describe('Valid entity data', () => {
			it('should return valid PlayerEntity for well-formed entity', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test Character',
					description: 'A test character',
					tags: ['hero', 'player'],
					fields: { level: 5, class: 'Warrior' },
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.id).toBe('entity-1');
				expect(result!.type).toBe('character');
				expect(result!.name).toBe('Test Character');
				expect(result!.description).toBe('A test character');
				expect(result!.tags).toEqual(['hero', 'player']);
				expect(result!.fields).toEqual({ level: 5, class: 'Warrior' });
				expect(result!.links).toEqual([]);
				expect(result!.createdAt).toBeInstanceOf(Date);
				expect(result!.updatedAt).toBeInstanceOf(Date);
			});

			it('should include summary when present as string', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					summary: 'A short summary',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.summary).toBe('A short summary');
			});

			it('should not include summary when not a string', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					summary: 123,
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result).not.toHaveProperty('summary');
			});

			it('should include imageUrl when present as string', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					imageUrl: 'https://example.com/image.jpg',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.imageUrl).toBe('https://example.com/image.jpg');
			});

			it('should not include imageUrl when not a string', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					imageUrl: 123,
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result).not.toHaveProperty('imageUrl');
			});
		});

		describe('Invalid entity data', () => {
			it('should return null for null input', () => {
				const result = validateEntity(null, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalledWith(
					expect.stringContaining('Skipping entity at index 0')
				);
			});

			it('should return null for non-object input (string)', () => {
				const result = validateEntity('not an object', 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null for non-object input (number)', () => {
				const result = validateEntity(123, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null for non-object input (array)', () => {
				const result = validateEntity([], 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null when id is missing', () => {
				const rawEntity = {
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null when type is missing', () => {
				const rawEntity = {
					id: 'entity-1',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null when name is missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null when description is missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should return null when id is not a string (number)', () => {
				const rawEntity = {
					id: 123,
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).toBeNull();
				expect(consoleWarnSpy).toHaveBeenCalled();
			});

			it('should log console.warn for each skipped entity with the index', () => {
				validateEntity(null, 5);

				expect(consoleWarnSpy).toHaveBeenCalledWith(
					expect.stringContaining('index 5')
				);
			});
		});

		describe('Default values for optional fields', () => {
			it('should default tags to [] when missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.tags).toEqual([]);
			});

			it('should default tags to [] when not an array', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: 'not-an-array',
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.tags).toEqual([]);
			});

			it('should filter non-string tags from array', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: ['valid', 123, 'also-valid', null, 'third-valid'],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.tags).toEqual(['valid', 'also-valid', 'third-valid']);
			});

			it('should default fields to {} when missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.fields).toEqual({});
			});

			it('should default fields to {} when not an object', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: 'not-an-object',
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.fields).toEqual({});
			});

			it('should default links to [] when missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toEqual([]);
			});

			it('should default links to [] when not an array', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: 'not-an-array',
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toEqual([]);
			});
		});

		describe('Date parsing', () => {
			it('should convert createdAt from ISO string to Date', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.createdAt).toBeInstanceOf(Date);
				expect(result!.createdAt.toISOString()).toBe('2025-01-01T00:00:00.000Z');
			});

			it('should convert updatedAt from ISO string to Date', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.updatedAt).toBeInstanceOf(Date);
				expect(result!.updatedAt.toISOString()).toBe('2025-01-02T00:00:00.000Z');
			});

			it('should default createdAt to Date if missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.createdAt).toBeInstanceOf(Date);
			});

			it('should default updatedAt to Date if missing', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.updatedAt).toBeInstanceOf(Date);
			});

			it('should default createdAt to Date if invalid', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: 'not-a-date',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.createdAt).toBeInstanceOf(Date);
				expect(isNaN(result!.createdAt.getTime())).toBe(false);
			});

			it('should default updatedAt to Date if invalid', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: 'not-a-date'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.updatedAt).toBeInstanceOf(Date);
				expect(isNaN(result!.updatedAt.getTime())).toBe(false);
			});
		});

		describe('Link validation within entities', () => {
			it('should validate links with required fields', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{
							id: 'link-1',
							targetId: 'entity-2',
							targetType: 'location',
							relationship: 'lives in',
							bidirectional: false
						}
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(1);
				expect(result!.links[0].id).toBe('link-1');
				expect(result!.links[0].targetId).toBe('entity-2');
				expect(result!.links[0].targetType).toBe('location');
				expect(result!.links[0].relationship).toBe('lives in');
				expect(result!.links[0].bidirectional).toBe(false);
			});

			it('should handle links with optional fields (reverseRelationship, strength)', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{
							id: 'link-1',
							targetId: 'entity-2',
							targetType: 'character',
							relationship: 'friend of',
							bidirectional: true,
							reverseRelationship: 'friend of',
							strength: 'strong'
						}
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(1);
				expect(result!.links[0].reverseRelationship).toBe('friend of');
				expect(result!.links[0].strength).toBe('strong');
			});

			it('should filter out malformed links (missing targetId)', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{
							id: 'link-1',
							targetId: 'entity-2',
							targetType: 'location',
							relationship: 'lives in',
							bidirectional: false
						},
						{
							id: 'link-2',
							// Missing targetId
							targetType: 'item',
							relationship: 'owns',
							bidirectional: false
						},
						{
							id: 'link-3',
							targetId: 'entity-3',
							targetType: 'item',
							relationship: 'carries',
							bidirectional: false
						}
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(2);
				expect(result!.links[0].id).toBe('link-1');
				expect(result!.links[1].id).toBe('link-3');
			});

			it('should filter out malformed links (missing relationship)', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{
							id: 'link-1',
							targetId: 'entity-2',
							targetType: 'location',
							relationship: 'lives in',
							bidirectional: false
						},
						{
							id: 'link-2',
							targetId: 'entity-3',
							targetType: 'item',
							// Missing relationship
							bidirectional: false
						}
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(1);
				expect(result!.links[0].id).toBe('link-1');
			});

			it('should filter out non-object links', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{
							id: 'link-1',
							targetId: 'entity-2',
							targetType: 'location',
							relationship: 'lives in',
							bidirectional: false
						},
						'not a link object',
						null,
						123
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(1);
				expect(result!.links[0].id).toBe('link-1');
			});

			it('should return empty links array when all links are malformed', () => {
				const rawEntity = {
					id: 'entity-1',
					type: 'character',
					name: 'Test',
					description: 'Test',
					tags: [],
					fields: {},
					links: [
						{ id: 'link-1' },
						'not a link',
						null
					],
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-02T00:00:00Z'
				};

				const result = validateEntity(rawEntity, 0);

				expect(result).not.toBeNull();
				expect(result!.links).toEqual([]);
			});
		});
	});
});
