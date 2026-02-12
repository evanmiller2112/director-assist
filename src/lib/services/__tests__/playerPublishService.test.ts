/**
 * Tests for Player Publish Service (Issue #445)
 *
 * This service manages the player data publishing workflow:
 * - Calls buildPlayerExport() to get player-visible entities
 * - Downloads the export as player_data.json
 * - Tracks last published timestamp in localStorage
 * - Calculates publish freshness (fresh/stale/expired/never)
 *
 * Covers:
 * - localStorage get/set operations for lastPublishedAt
 * - SSR safety (typeof window checks)
 * - getDaysSincePublish calculation
 * - getPublishFreshness classification:
 *   - 'never' when null
 *   - 'fresh' when 0 (today/less than 24h)
 *   - 'stale' when 1-7 days
 *   - 'expired' when >7 days
 * - publishPlayerData workflow:
 *   - Calls buildPlayerExport()
 *   - Creates JSON blob
 *   - Triggers download with filename 'player_data.json'
 *   - Sets lastPublishedAt timestamp
 *   - Returns PublishResult with counts
 * - Edge cases: corrupted localStorage, invalid dates, export failures
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	getLastPublishedAt,
	setLastPublishedAt,
	getDaysSincePublish,
	getPublishFreshness,
	publishPlayerData,
	type PublishFreshness,
	type PublishResult
} from '../playerPublishService';

// Mock the playerExportService
vi.mock('../playerExportService', () => ({
	buildPlayerExport: vi.fn()
}));

import { buildPlayerExport } from '../playerExportService';

describe('playerPublishService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let mockStore: Record<string, string>;

	// Mock DOM APIs
	let mockCreateElement: ReturnType<typeof vi.fn>;
	let mockCreateObjectURL: ReturnType<typeof vi.fn>;
	let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock localStorage
		mockStore = {};
		originalLocalStorage = global.localStorage;

		global.localStorage = {
			getItem: vi.fn((key: string) => mockStore[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				mockStore[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete mockStore[key];
			}),
			clear: vi.fn(() => {
				Object.keys(mockStore).forEach((key) => delete mockStore[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;

		// Mock DOM APIs for file download
		mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
		mockRevokeObjectURL = vi.fn();

		global.URL.createObjectURL = mockCreateObjectURL as unknown as typeof URL.createObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL as unknown as typeof URL.revokeObjectURL;

		const mockAnchor = {
			href: '',
			download: '',
			click: vi.fn()
		};

		mockCreateElement = vi.fn(() => mockAnchor);
		global.document.createElement = mockCreateElement as unknown as typeof document.createElement;

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('getLastPublishedAt', () => {
		describe('No Saved Date', () => {
			it('should return null when no publish date is saved', () => {
				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null when localStorage is empty', () => {
				mockStore = {};
				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null when key does not exist', () => {
				mockStore['some-other-key'] = 'value';
				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});
		});

		describe('Valid Saved Date', () => {
			it('should return Date object when valid ISO string exists', () => {
				const now = new Date('2026-02-12T10:00:00.000Z');
				mockStore['dm-assist-last-player-published-at'] = now.toISOString();

				const date = getLastPublishedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(now.toISOString());
			});

			it('should return Date for past date', () => {
				const past = new Date('2026-01-01T00:00:00.000Z');
				mockStore['dm-assist-last-player-published-at'] = past.toISOString();

				const date = getLastPublishedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(past.toISOString());
			});

			it('should preserve time component of date', () => {
				const dateWithTime = new Date('2026-02-10T14:30:45.123Z');
				mockStore['dm-assist-last-player-published-at'] = dateWithTime.toISOString();

				const date = getLastPublishedAt();
				expect(date?.toISOString()).toBe(dateWithTime.toISOString());
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return null for invalid ISO string', () => {
				mockStore['dm-assist-last-player-published-at'] = 'invalid-date';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for empty string', () => {
				mockStore['dm-assist-last-player-published-at'] = '';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for whitespace string', () => {
				mockStore['dm-assist-last-player-published-at'] = '   ';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for "null" string', () => {
				mockStore['dm-assist-last-player-published-at'] = 'null';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for "undefined" string', () => {
				mockStore['dm-assist-last-player-published-at'] = 'undefined';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for number string', () => {
				mockStore['dm-assist-last-player-published-at'] = '12345';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});

			it('should return null for malformed JSON', () => {
				mockStore['dm-assist-last-player-published-at'] = '{"date": "2026-02-12"}';

				const date = getLastPublishedAt();
				expect(date).toBeNull();
			});
		});

		describe('SSR Context Handling', () => {
			it('should return null in SSR context (window undefined)', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const date = getLastPublishedAt();
				expect(date).toBeNull();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getLastPublishedAt()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setLastPublishedAt', () => {
		describe('Setting Valid Date', () => {
			it('should save date to localStorage as ISO string', () => {
				const now = new Date('2026-02-12T10:00:00.000Z');
				setLastPublishedAt(now);

				expect(mockStore['dm-assist-last-player-published-at']).toBeDefined();
				expect(mockStore['dm-assist-last-player-published-at']).toBe(now.toISOString());
			});

			it('should save current date correctly', () => {
				const now = new Date();
				setLastPublishedAt(now);

				const saved = mockStore['dm-assist-last-player-published-at'];
				expect(saved).toBe(now.toISOString());
			});

			it('should save past date correctly', () => {
				const past = new Date('2026-01-01T00:00:00.000Z');
				setLastPublishedAt(past);

				expect(mockStore['dm-assist-last-player-published-at']).toBe(past.toISOString());
			});

			it('should preserve time components', () => {
				const date = new Date('2026-02-10T14:30:45.678Z');
				setLastPublishedAt(date);

				expect(mockStore['dm-assist-last-player-published-at']).toBe(date.toISOString());
			});
		});

		describe('Overwriting Existing Date', () => {
			it('should overwrite existing date', () => {
				mockStore['dm-assist-last-player-published-at'] = new Date('2026-01-01').toISOString();

				const newDate = new Date('2026-02-12');
				setLastPublishedAt(newDate);

				expect(mockStore['dm-assist-last-player-published-at']).toBe(newDate.toISOString());
			});

			it('should handle multiple updates', () => {
				setLastPublishedAt(new Date('2026-01-01'));
				setLastPublishedAt(new Date('2026-02-01'));
				setLastPublishedAt(new Date('2026-02-12'));

				expect(mockStore['dm-assist-last-player-published-at']).toBe(
					new Date('2026-02-12').toISOString()
				);
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setLastPublishedAt(new Date())).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setLastPublishedAt(new Date('2026-02-12'));

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-last-player-published-at']).toBeUndefined();
			});
		});
	});

	describe('getDaysSincePublish', () => {
		describe('Valid Dates', () => {
			it('should return null when lastPublished is null', () => {
				const days = getDaysSincePublish(null);
				expect(days).toBeNull();
			});

			it('should return 0 for publish today', () => {
				const today = new Date();
				const days = getDaysSincePublish(today);
				expect(days).toBe(0);
			});

			it('should return 1 for publish 1 day ago', () => {
				const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const days = getDaysSincePublish(yesterday);
				expect(days).toBe(1);
			});

			it('should return 7 for publish 7 days ago', () => {
				const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
				const days = getDaysSincePublish(sevenDaysAgo);
				expect(days).toBe(7);
			});

			it('should return 30 for publish 30 days ago', () => {
				const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
				const days = getDaysSincePublish(thirtyDaysAgo);
				expect(days).toBe(30);
			});
		});

		describe('Edge Cases', () => {
			it('should return 0 for publish less than 24 hours ago', () => {
				const twelveHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 12);
				const days = getDaysSincePublish(twelveHoursAgo);
				expect(days).toBe(0);
			});

			it('should return negative days for future date', () => {
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
				const days = getDaysSincePublish(tomorrow);
				expect(days).toBe(-1);
			});

			it('should handle very old dates', () => {
				const veryOld = new Date('2020-01-01');
				const days = getDaysSincePublish(veryOld);
				expect(days).toBeGreaterThan(1000);
			});
		});

		describe('Time Precision', () => {
			it('should round down partial days', () => {
				const oneDayAndTwelveHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 36);
				const days = getDaysSincePublish(oneDayAndTwelveHoursAgo);
				expect(days).toBe(1);
			});

			it('should handle exact 24 hour boundary', () => {
				const exactlyOneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const days = getDaysSincePublish(exactlyOneDayAgo);
				expect(days).toBe(1);
			});
		});
	});

	describe('getPublishFreshness', () => {
		describe('Never Published', () => {
			it('should return "never" when input is null', () => {
				const freshness = getPublishFreshness(null);
				expect(freshness).toBe('never' as PublishFreshness);
			});
		});

		describe('Fresh (0 days / less than 24 hours)', () => {
			it('should return "fresh" for 0 days (today)', () => {
				const freshness = getPublishFreshness(0);
				expect(freshness).toBe('fresh' as PublishFreshness);
			});
		});

		describe('Stale (1-7 days)', () => {
			it('should return "stale" for 1 day', () => {
				const freshness = getPublishFreshness(1);
				expect(freshness).toBe('stale' as PublishFreshness);
			});

			it('should return "stale" for 3 days', () => {
				const freshness = getPublishFreshness(3);
				expect(freshness).toBe('stale' as PublishFreshness);
			});

			it('should return "stale" for 7 days', () => {
				const freshness = getPublishFreshness(7);
				expect(freshness).toBe('stale' as PublishFreshness);
			});
		});

		describe('Expired (>7 days)', () => {
			it('should return "expired" for 8 days', () => {
				const freshness = getPublishFreshness(8);
				expect(freshness).toBe('expired' as PublishFreshness);
			});

			it('should return "expired" for 30 days', () => {
				const freshness = getPublishFreshness(30);
				expect(freshness).toBe('expired' as PublishFreshness);
			});

			it('should return "expired" for 365 days', () => {
				const freshness = getPublishFreshness(365);
				expect(freshness).toBe('expired' as PublishFreshness);
			});
		});

		describe('Edge Cases', () => {
			it('should handle 0 correctly (boundary between fresh and stale)', () => {
				const freshness = getPublishFreshness(0);
				expect(freshness).toBe('fresh' as PublishFreshness);
			});

			it('should handle 7 correctly (boundary between stale and expired)', () => {
				const freshness = getPublishFreshness(7);
				expect(freshness).toBe('stale' as PublishFreshness);
			});

			it('should handle negative days (future dates)', () => {
				// Future dates should be treated as fresh
				const freshness = getPublishFreshness(-1);
				expect(freshness).toBe('fresh' as PublishFreshness);
			});
		});
	});

	describe('publishPlayerData', () => {
		const mockPlayerExport = {
			version: '1.0.0',
			exportedAt: new Date('2026-02-12T10:00:00.000Z'),
			campaignName: 'Test Campaign',
			campaignDescription: 'A test campaign',
			entities: [
				{
					id: '1',
					type: 'character',
					name: 'Hero',
					description: 'A brave hero',
					tags: [],
					fields: {},
					links: [],
					createdAt: new Date('2026-01-01'),
					updatedAt: new Date('2026-01-01')
				},
				{
					id: '2',
					type: 'location',
					name: 'Town',
					description: 'A small town',
					tags: [],
					fields: {},
					links: [],
					createdAt: new Date('2026-01-01'),
					updatedAt: new Date('2026-01-01')
				},
				{
					id: '3',
					type: 'character',
					name: 'Villain',
					description: 'A villain',
					tags: [],
					fields: {},
					links: [],
					createdAt: new Date('2026-01-01'),
					updatedAt: new Date('2026-01-01')
				}
			]
		};

		beforeEach(() => {
			vi.mocked(buildPlayerExport).mockResolvedValue(mockPlayerExport);
		});

		describe('Successful Publish', () => {
			it('should call buildPlayerExport', async () => {
				await publishPlayerData();

				expect(buildPlayerExport).toHaveBeenCalledTimes(1);
			});

			it('should create JSON blob with player export data', async () => {
				await publishPlayerData();

				// Check that a Blob was created with JSON content
				// Note: We can't directly test Blob creation in Node, but we verify the flow
				expect(buildPlayerExport).toHaveBeenCalled();
			});

			it('should trigger download with filename "player_data.json"', async () => {
				await publishPlayerData();

				const mockAnchor = mockCreateElement.mock.results[0].value;
				expect(mockAnchor.download).toBe('player_data.json');
			});

			it('should set href to blob URL', async () => {
				await publishPlayerData();

				const mockAnchor = mockCreateElement.mock.results[0].value;
				expect(mockAnchor.href).toBe('blob:mock-url');
			});

			it('should click anchor to trigger download', async () => {
				await publishPlayerData();

				const mockAnchor = mockCreateElement.mock.results[0].value;
				expect(mockAnchor.click).toHaveBeenCalledTimes(1);
			});

			it('should revoke object URL after download', async () => {
				await publishPlayerData();

				expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
			});

			it('should set lastPublishedAt timestamp', async () => {
				const beforePublish = Date.now();
				await publishPlayerData();
				const afterPublish = Date.now();

				const saved = mockStore['dm-assist-last-player-published-at'];
				expect(saved).toBeDefined();

				const savedDate = new Date(saved);
				expect(savedDate.getTime()).toBeGreaterThanOrEqual(beforePublish);
				expect(savedDate.getTime()).toBeLessThanOrEqual(afterPublish);
			});

			it('should return PublishResult with correct entity count', async () => {
				const result = await publishPlayerData();

				expect(result.entityCount).toBe(3);
			});

			it('should return PublishResult with correct type count', async () => {
				const result = await publishPlayerData();

				expect(result.typeCount).toBe(2); // character and location
			});

			it('should return PublishResult with publishedAt timestamp', async () => {
				const beforePublish = Date.now();
				const result = await publishPlayerData();
				const afterPublish = Date.now();

				expect(result.publishedAt).toBeInstanceOf(Date);
				expect(result.publishedAt.getTime()).toBeGreaterThanOrEqual(beforePublish);
				expect(result.publishedAt.getTime()).toBeLessThanOrEqual(afterPublish);
			});
		});

		describe('Empty Export', () => {
			it('should handle export with no entities', async () => {
				vi.mocked(buildPlayerExport).mockResolvedValue({
					...mockPlayerExport,
					entities: []
				});

				const result = await publishPlayerData();

				expect(result.entityCount).toBe(0);
				expect(result.typeCount).toBe(0);
			});

			it('should still trigger download with empty entities', async () => {
				vi.mocked(buildPlayerExport).mockResolvedValue({
					...mockPlayerExport,
					entities: []
				});

				await publishPlayerData();

				const mockAnchor = mockCreateElement.mock.results[0].value;
				expect(mockAnchor.click).toHaveBeenCalled();
			});
		});

		describe('Single Entity Type', () => {
			it('should return typeCount of 1 for single entity type', async () => {
				vi.mocked(buildPlayerExport).mockResolvedValue({
					...mockPlayerExport,
					entities: [
						{
							id: '1',
							type: 'character',
							name: 'Hero 1',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						},
						{
							id: '2',
							type: 'character',
							name: 'Hero 2',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						}
					]
				});

				const result = await publishPlayerData();

				expect(result.entityCount).toBe(2);
				expect(result.typeCount).toBe(1);
			});
		});

		describe('Many Entity Types', () => {
			it('should count all unique entity types', async () => {
				vi.mocked(buildPlayerExport).mockResolvedValue({
					...mockPlayerExport,
					entities: [
						{
							id: '1',
							type: 'character',
							name: 'Hero',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						},
						{
							id: '2',
							type: 'location',
							name: 'Town',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						},
						{
							id: '3',
							type: 'item',
							name: 'Sword',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						},
						{
							id: '4',
							type: 'event',
							name: 'Battle',
							description: '',
							tags: [],
							fields: {},
							links: [],
							createdAt: new Date(),
							updatedAt: new Date()
						}
					]
				});

				const result = await publishPlayerData();

				expect(result.entityCount).toBe(4);
				expect(result.typeCount).toBe(4);
			});
		});

		describe('Error Handling', () => {
			it('should throw if buildPlayerExport fails', async () => {
				vi.mocked(buildPlayerExport).mockRejectedValue(new Error('No active campaign found'));

				await expect(publishPlayerData()).rejects.toThrow('No active campaign found');
			});

			it('should not set timestamp if export fails', async () => {
				vi.mocked(buildPlayerExport).mockRejectedValue(new Error('Database error'));

				await expect(publishPlayerData()).rejects.toThrow();

				expect(mockStore['dm-assist-last-player-published-at']).toBeUndefined();
			});

			it('should not trigger download if export fails', async () => {
				vi.mocked(buildPlayerExport).mockRejectedValue(new Error('Export error'));

				await expect(publishPlayerData()).rejects.toThrow();

				expect(mockCreateElement).not.toHaveBeenCalled();
			});
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete first-time publish flow', () => {
			// New user with no history
			const lastPublished = getLastPublishedAt();
			expect(lastPublished).toBeNull();

			const days = getDaysSincePublish(lastPublished);
			expect(days).toBeNull();

			const freshness = getPublishFreshness(days);
			expect(freshness).toBe('never' as PublishFreshness);
		});

		it('should handle publish and freshness check flow', async () => {
			// Mock export
			vi.mocked(buildPlayerExport).mockResolvedValue({
				version: '1.0.0',
				exportedAt: new Date(),
				campaignName: 'Test',
				campaignDescription: '',
				entities: [
					{
						id: '1',
						type: 'character',
						name: 'Hero',
						description: '',
						tags: [],
						fields: {},
						links: [],
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			// Publish
			await publishPlayerData();

			// Check freshness
			const lastPublished = getLastPublishedAt();
			expect(lastPublished).toBeInstanceOf(Date);

			const days = getDaysSincePublish(lastPublished);
			expect(days).toBe(0);

			const freshness = getPublishFreshness(days);
			expect(freshness).toBe('fresh' as PublishFreshness);
		});

		it('should handle stale publish detection', () => {
			// Simulate publish 3 days ago
			const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
			setLastPublishedAt(threeDaysAgo);

			const lastPublished = getLastPublishedAt();
			const days = getDaysSincePublish(lastPublished);
			const freshness = getPublishFreshness(days);

			expect(days).toBe(3);
			expect(freshness).toBe('stale' as PublishFreshness);
		});

		it('should handle expired publish detection', () => {
			// Simulate publish 10 days ago
			const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
			setLastPublishedAt(tenDaysAgo);

			const lastPublished = getLastPublishedAt();
			const days = getDaysSincePublish(lastPublished);
			const freshness = getPublishFreshness(days);

			expect(days).toBe(10);
			expect(freshness).toBe('expired' as PublishFreshness);
		});

		it('should persist across localStorage get/set cycles', () => {
			const publishDate = new Date('2026-02-10T10:00:00.000Z');

			// Set value
			setLastPublishedAt(publishDate);

			// Get value
			const retrieved = getLastPublishedAt();

			// Verify exact value
			expect(retrieved?.toISOString()).toBe(publishDate.toISOString());
		});
	});
});
