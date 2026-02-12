/**
 * Tests for Player Mode Detection Service (Issue #445)
 *
 * This service detects whether the app should run in player-only mode by
 * checking if a published player_data.json file exists in the static directory.
 *
 * Covers:
 * - HEAD request to /player_data.json
 * - Returns true on HTTP 200 (file exists)
 * - Returns false on HTTP 404 (file not found)
 * - Returns false on network errors
 * - Returns false on other HTTP errors (500, 403, etc.)
 * - Custom URL support
 * - Result caching (same URL)
 * - Cache invalidation (new URL)
 * - Cache reset function
 * - SSR safety (fetch API)
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectPlayerMode, resetDetectionCache } from '../playerModeDetectionService';

describe('playerModeDetectionService', () => {
	// Mock fetch
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Reset cache before each test
		resetDetectionCache();

		// Mock fetch globally
		mockFetch = vi.fn();
		global.fetch = mockFetch as unknown as typeof fetch;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe('detectPlayerMode', () => {
		describe('File Exists (HTTP 200)', () => {
			it('should return true when HEAD request gets 200', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				const result = await detectPlayerMode();

				expect(result).toBe(true);
			});

			it('should make HEAD request to /player_data.json by default', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				await detectPlayerMode();

				expect(mockFetch).toHaveBeenCalledWith('/player_data.json', {
					method: 'HEAD'
				});
			});

			it('should return true for 200 OK status', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				const result = await detectPlayerMode();

				expect(result).toBe(true);
			});
		});

		describe('File Not Found (HTTP 404)', () => {
			it('should return false when HEAD request gets 404', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should handle 404 Not Found status', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});
		});

		describe('Other HTTP Errors', () => {
			it('should return false for 500 Internal Server Error', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 500
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false for 403 Forbidden', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 403
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false for 401 Unauthorized', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 401
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false for 503 Service Unavailable', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 503
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});
		});

		describe('Network Errors', () => {
			it('should return false on network error', async () => {
				mockFetch.mockRejectedValue(new Error('Network error'));

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false on fetch timeout', async () => {
				mockFetch.mockRejectedValue(new Error('Request timeout'));

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false on CORS error', async () => {
				mockFetch.mockRejectedValue(new Error('CORS policy blocked'));

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should return false on DNS resolution failure', async () => {
				mockFetch.mockRejectedValue(new Error('DNS resolution failed'));

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});
		});

		describe('Custom URL', () => {
			it('should use custom URL when provided', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				await detectPlayerMode('/custom/path/player_data.json');

				expect(mockFetch).toHaveBeenCalledWith('/custom/path/player_data.json', {
					method: 'HEAD'
				});
			});

			it('should return true for custom URL with 200', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				const result = await detectPlayerMode('/static/player_data.json');

				expect(result).toBe(true);
			});

			it('should return false for custom URL with 404', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404
				});

				const result = await detectPlayerMode('/static/player_data.json');

				expect(result).toBe(false);
			});

			it('should handle absolute URLs', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				await detectPlayerMode('https://example.com/player_data.json');

				expect(mockFetch).toHaveBeenCalledWith('https://example.com/player_data.json', {
					method: 'HEAD'
				});
			});
		});

		describe('Caching Behavior', () => {
			it('should cache result after first call', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First call
				const result1 = await detectPlayerMode();
				expect(result1).toBe(true);
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Second call - should use cache
				const result2 = await detectPlayerMode();
				expect(result2).toBe(true);
				expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
			});

			it('should return cached false result', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404
				});

				// First call
				const result1 = await detectPlayerMode();
				expect(result1).toBe(false);
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Second call - should use cache
				const result2 = await detectPlayerMode();
				expect(result2).toBe(false);
				expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
			});

			it('should cache result even after error', async () => {
				mockFetch.mockRejectedValue(new Error('Network error'));

				// First call
				const result1 = await detectPlayerMode();
				expect(result1).toBe(false);
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Second call - should use cache
				const result2 = await detectPlayerMode();
				expect(result2).toBe(false);
				expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
			});

			it('should not cache if different URL provided', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First call with default URL
				await detectPlayerMode();
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Second call with different URL - should NOT use cache
				await detectPlayerMode('/custom/player_data.json');
				expect(mockFetch).toHaveBeenCalledTimes(2);
			});

			it('should use same cache for same custom URL', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First call with custom URL
				await detectPlayerMode('/custom/player_data.json');
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Second call with same custom URL - should use cache
				await detectPlayerMode('/custom/player_data.json');
				expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
			});

			it('should reset cache when different URL provided', async () => {
				mockFetch
					.mockResolvedValueOnce({
						ok: true,
						status: 200
					})
					.mockResolvedValueOnce({
						ok: false,
						status: 404
					});

				// First call with default URL
				const result1 = await detectPlayerMode();
				expect(result1).toBe(true);

				// Second call with different URL (should reset cache and make new request)
				const result2 = await detectPlayerMode('/other/player_data.json');
				expect(result2).toBe(false);

				expect(mockFetch).toHaveBeenCalledTimes(2);
			});
		});

		describe('resetDetectionCache', () => {
			it('should reset cache allowing new detection', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First call
				await detectPlayerMode();
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Reset cache
				resetDetectionCache();

				// Second call - should make new request
				await detectPlayerMode();
				expect(mockFetch).toHaveBeenCalledTimes(2);
			});

			it('should allow different result after cache reset', async () => {
				mockFetch
					.mockResolvedValueOnce({
						ok: true,
						status: 200
					})
					.mockResolvedValueOnce({
						ok: false,
						status: 404
					});

				// First call - returns true
				const result1 = await detectPlayerMode();
				expect(result1).toBe(true);

				// Reset cache
				resetDetectionCache();

				// Second call - returns false (new fetch)
				const result2 = await detectPlayerMode();
				expect(result2).toBe(false);

				expect(mockFetch).toHaveBeenCalledTimes(2);
			});

			it('should reset cache for custom URLs', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First call with custom URL
				await detectPlayerMode('/custom/player_data.json');
				expect(mockFetch).toHaveBeenCalledTimes(1);

				// Reset cache
				resetDetectionCache();

				// Second call with same custom URL - should make new request
				await detectPlayerMode('/custom/player_data.json');
				expect(mockFetch).toHaveBeenCalledTimes(2);
			});

			it('should be safe to call when no cache exists', () => {
				expect(() => resetDetectionCache()).not.toThrow();
			});

			it('should be safe to call multiple times', () => {
				expect(() => {
					resetDetectionCache();
					resetDetectionCache();
					resetDetectionCache();
				}).not.toThrow();
			});
		});

		describe('Edge Cases', () => {
			it('should handle response with no status', async () => {
				mockFetch.mockResolvedValue({
					ok: false
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should handle response with unexpected status codes', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 418 // I'm a teapot
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should handle null response', async () => {
				mockFetch.mockResolvedValue(null);

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should handle undefined response', async () => {
				mockFetch.mockResolvedValue(undefined);

				const result = await detectPlayerMode();

				expect(result).toBe(false);
			});

			it('should handle empty string URL', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				await detectPlayerMode('');

				expect(mockFetch).toHaveBeenCalledWith('', {
					method: 'HEAD'
				});
			});

			it('should handle malformed URL gracefully', async () => {
				mockFetch.mockRejectedValue(new Error('Invalid URL'));

				const result = await detectPlayerMode('not-a-valid-url');

				expect(result).toBe(false);
			});
		});

		describe('Integration Scenarios', () => {
			it('should handle fresh app load with no player_data.json', async () => {
				mockFetch.mockResolvedValue({
					ok: false,
					status: 404
				});

				const result = await detectPlayerMode();

				expect(result).toBe(false);
				expect(mockFetch).toHaveBeenCalledWith('/player_data.json', {
					method: 'HEAD'
				});
			});

			it('should handle app load with published player_data.json', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				const result = await detectPlayerMode();

				expect(result).toBe(true);
				expect(mockFetch).toHaveBeenCalledWith('/player_data.json', {
					method: 'HEAD'
				});
			});

			it('should handle app switching from DM to player mode', async () => {
				// Initial check - no file
				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 404
				});

				const result1 = await detectPlayerMode();
				expect(result1).toBe(false);

				// DM publishes player_data.json, cache is reset
				resetDetectionCache();

				// Second check - file now exists
				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200
				});

				const result2 = await detectPlayerMode();
				expect(result2).toBe(true);

				expect(mockFetch).toHaveBeenCalledTimes(2);
			});

			it('should handle network failure gracefully during app load', async () => {
				mockFetch.mockRejectedValue(new Error('Network unavailable'));

				const result = await detectPlayerMode();

				// App should default to DM mode on network failure
				expect(result).toBe(false);
			});

			it('should use cached result for performance on subsequent checks', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					status: 200
				});

				// First check
				const result1 = await detectPlayerMode();
				expect(result1).toBe(true);

				// Subsequent checks use cache (no additional fetch calls)
				const result2 = await detectPlayerMode();
				const result3 = await detectPlayerMode();
				const result4 = await detectPlayerMode();

				expect(result2).toBe(true);
				expect(result3).toBe(true);
				expect(result4).toBe(true);
				expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch call
			});
		});
	});
});
