/**
 * Tests for Database Integrity Scheduler (Issue #511)
 *
 * This scheduler runs the integrity check in the background after app startup,
 * using requestIdleCallback when available or setTimeout as fallback.
 *
 * Testing Strategy:
 * - Deferred execution (check runs asynchronously)
 * - Success callback handling
 * - Error callback handling
 * - Cleanup function prevents execution
 * - requestIdleCallback detection and usage
 * - setTimeout fallback when requestIdleCallback unavailable
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scheduleIntegrityCheck } from './dbIntegrityScheduler';
import type { IntegrityCheckResult } from '$lib/types';

describe('dbIntegrityScheduler', () => {
	let originalRequestIdleCallback: typeof window.requestIdleCallback | undefined;
	let originalCancelIdleCallback: typeof window.cancelIdleCallback | undefined;

	beforeEach(() => {
		// Store originals
		originalRequestIdleCallback = window.requestIdleCallback;
		originalCancelIdleCallback = window.cancelIdleCallback;
	});

	afterEach(() => {
		// Restore originals
		if (originalRequestIdleCallback) {
			window.requestIdleCallback = originalRequestIdleCallback;
		} else {
			// @ts-expect-error - Testing cleanup
			delete window.requestIdleCallback;
		}
		if (originalCancelIdleCallback) {
			window.cancelIdleCallback = originalCancelIdleCallback;
		} else {
			// @ts-expect-error - Testing cleanup
			delete window.cancelIdleCallback;
		}
		vi.clearAllTimers();
		vi.restoreAllMocks();
	});

	describe('Deferred Execution', () => {
		it('should not call check function synchronously', () => {
			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			expect(checkFn).not.toHaveBeenCalled();
		});

		it('should call check function asynchronously', async () => {
			const result: IntegrityCheckResult = {
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			};

			const checkFn = vi.fn(async () => result);
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			// Wait for async execution
			await vi.waitFor(() => {
				expect(checkFn).toHaveBeenCalled();
			});
		});
	});

	describe('Success Callback', () => {
		it('should call onResult with check result', async () => {
			const result: IntegrityCheckResult = {
				completed: true,
				checkedAt: new Date(),
				durationMs: 150,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			};

			const checkFn = vi.fn(async () => result);
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			await vi.waitFor(() => {
				expect(onResult).toHaveBeenCalledWith(result);
			});
			expect(onError).not.toHaveBeenCalled();
		});

		it('should pass result with issues to onResult', async () => {
			const result: IntegrityCheckResult = {
				completed: true,
				checkedAt: new Date(),
				durationMs: 200,
				issues: [
					{
						type: 'referential_integrity',
						severity: 'minor',
						message: 'Dangling reference detected'
					}
				],
				skipped: false,
				hasMinorIssues: true,
				hasMajorIssues: false
			};

			const checkFn = vi.fn(async () => result);
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			await vi.waitFor(() => {
				expect(onResult).toHaveBeenCalledWith(result);
			});
		});
	});

	describe('Error Callback', () => {
		it('should call onError when check function throws', async () => {
			const error = new Error('Database check failed');
			const checkFn = vi.fn(async () => {
				throw error;
			});
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			await vi.waitFor(() => {
				expect(onError).toHaveBeenCalledWith(error);
			});
			expect(onResult).not.toHaveBeenCalled();
		});

		it('should handle async errors', async () => {
			const error = new Error('Async failure');
			const checkFn = vi.fn(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw error;
			});
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			await vi.waitFor(() => {
				expect(onError).toHaveBeenCalledWith(error);
			});
		});
	});

	describe('Cleanup Function', () => {
		it('should return a cleanup function', () => {
			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			const cleanup = scheduleIntegrityCheck(checkFn, onResult, onError);

			expect(typeof cleanup).toBe('function');
		});

		it('should prevent check execution when cleanup called before execution', async () => {
			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			const cleanup = scheduleIntegrityCheck(checkFn, onResult, onError);

			// Call cleanup immediately
			cleanup();

			// Wait to ensure check doesn't execute
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(checkFn).not.toHaveBeenCalled();
			expect(onResult).not.toHaveBeenCalled();
			expect(onError).not.toHaveBeenCalled();
		});

		it('should be safe to call cleanup multiple times', () => {
			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			const cleanup = scheduleIntegrityCheck(checkFn, onResult, onError);

			expect(() => {
				cleanup();
				cleanup();
				cleanup();
			}).not.toThrow();
		});
	});

	describe('requestIdleCallback Support', () => {
		it('should use requestIdleCallback when available', () => {
			const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
				// Execute immediately for test
				callback({
					didTimeout: false,
					timeRemaining: () => 50
				} as IdleDeadline);
				return 1;
			});
			const mockCancelIdleCallback = vi.fn();

			window.requestIdleCallback = mockRequestIdleCallback;
			window.cancelIdleCallback = mockCancelIdleCallback;

			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			expect(mockRequestIdleCallback).toHaveBeenCalled();
		});

		it('should use cancelIdleCallback for cleanup when available', () => {
			const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
				return 1;
			});
			const mockCancelIdleCallback = vi.fn();

			window.requestIdleCallback = mockRequestIdleCallback;
			window.cancelIdleCallback = mockCancelIdleCallback;

			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			const cleanup = scheduleIntegrityCheck(checkFn, onResult, onError);
			cleanup();

			expect(mockCancelIdleCallback).toHaveBeenCalledWith(1);
		});
	});

	describe('setTimeout Fallback', () => {
		it('should fall back to setTimeout when requestIdleCallback unavailable', () => {
			// Remove requestIdleCallback
			// @ts-expect-error - Testing fallback
			delete window.requestIdleCallback;

			const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			scheduleIntegrityCheck(checkFn, onResult, onError);

			expect(setTimeoutSpy).toHaveBeenCalled();
		});

		it('should use clearTimeout for cleanup when using setTimeout', () => {
			// Remove requestIdleCallback
			// @ts-expect-error - Testing fallback
			delete window.requestIdleCallback;

			const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

			const checkFn = vi.fn(async () => ({
				completed: true,
				checkedAt: new Date(),
				durationMs: 100,
				issues: [],
				skipped: false,
				hasMinorIssues: false,
				hasMajorIssues: false
			}));
			const onResult = vi.fn();
			const onError = vi.fn();

			const cleanup = scheduleIntegrityCheck(checkFn, onResult, onError);
			cleanup();

			expect(clearTimeoutSpy).toHaveBeenCalled();
		});
	});
});
