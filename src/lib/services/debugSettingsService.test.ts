/**
 * Tests for Debug Settings Service (TDD RED Phase)
 *
 * Issue #118: Add debug console for AI request/response inspection
 *
 * Covers:
 * - isDebugEnabled returns false by default
 * - setDebugEnabled(true) persists to localStorage
 * - setDebugEnabled(false) removes from localStorage
 * - SSR safety (handles missing window)
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	isDebugEnabled,
	setDebugEnabled
} from './debugSettingsService';

describe('debugSettingsService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let store: Record<string, string>;

	beforeEach(() => {
		// Mock localStorage
		originalLocalStorage = global.localStorage;
		store = {};

		global.localStorage = {
			getItem: vi.fn((key: string) => store[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				Object.keys(store).forEach((key) => delete store[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
		vi.clearAllMocks();
	});

	describe('isDebugEnabled', () => {
		describe('Default State', () => {
			it('should return false when no setting is stored', () => {
				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});

			it('should return false when localStorage is empty', () => {
				store['dm-assist-debug-enabled'] = '';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});

			it('should return false by default', () => {
				// Ensure key is not set
				delete store['dm-assist-debug-enabled'];

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});
		});

		describe('Stored Values', () => {
			it('should return true when enabled is stored as "true"', () => {
				store['dm-assist-debug-enabled'] = 'true';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(true);
			});

			it('should return false when enabled is stored as "false"', () => {
				store['dm-assist-debug-enabled'] = 'false';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});

			it('should return false for any non-"true" value', () => {
				store['dm-assist-debug-enabled'] = 'yes';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});

			it('should return false for invalid stored value', () => {
				store['dm-assist-debug-enabled'] = 'invalid';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});
		});

		describe('SSR Context Handling', () => {
			it('should return false when window is undefined (SSR)', () => {
				// Simulate SSR by making window undefined
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				// This should not throw even though localStorage is unavailable
				expect(() => isDebugEnabled()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should handle typeof window === "undefined" gracefully', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Edge Cases', () => {
			it('should handle localStorage.getItem throwing error', () => {
				vi.mocked(global.localStorage.getItem).mockImplementation(() => {
					throw new Error('localStorage access denied');
				});

				expect(() => isDebugEnabled()).not.toThrow();

				const enabled = isDebugEnabled();
				expect(enabled).toBe(false);
			});

			it('should handle null value from localStorage', () => {
				vi.mocked(global.localStorage.getItem).mockReturnValue(null);

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});

			it('should handle empty string from localStorage', () => {
				store['dm-assist-debug-enabled'] = '';

				const enabled = isDebugEnabled();

				expect(enabled).toBe(false);
			});
		});
	});

	describe('setDebugEnabled', () => {
		describe('Enable Debug Mode', () => {
			it('should save "true" to localStorage when enabling', () => {
				setDebugEnabled(true);

				expect(localStorage.setItem).toHaveBeenCalledWith('dm-assist-debug-enabled', 'true');
			});

			it('should persist enabled state to store', () => {
				setDebugEnabled(true);

				const stored = store['dm-assist-debug-enabled'];
				expect(stored).toBe('true');
			});

			it('should allow isDebugEnabled to return true after enabling', () => {
				setDebugEnabled(true);

				const enabled = isDebugEnabled();
				expect(enabled).toBe(true);
			});
		});

		describe('Disable Debug Mode', () => {
			it('should remove from localStorage when disabling', () => {
				setDebugEnabled(false);

				expect(localStorage.removeItem).toHaveBeenCalledWith('dm-assist-debug-enabled');
			});

			it('should remove value from store', () => {
				// First enable
				store['dm-assist-debug-enabled'] = 'true';

				// Then disable
				setDebugEnabled(false);

				expect(store['dm-assist-debug-enabled']).toBeUndefined();
			});

			it('should allow isDebugEnabled to return false after disabling', () => {
				// First enable
				store['dm-assist-debug-enabled'] = 'true';

				// Then disable
				setDebugEnabled(false);

				const enabled = isDebugEnabled();
				expect(enabled).toBe(false);
			});

			it('should not throw when disabling if already disabled', () => {
				expect(() => setDebugEnabled(false)).not.toThrow();
			});
		});

		describe('Toggle Behavior', () => {
			it('should support toggling on and off', () => {
				// Enable
				setDebugEnabled(true);
				expect(isDebugEnabled()).toBe(true);

				// Disable
				setDebugEnabled(false);
				expect(isDebugEnabled()).toBe(false);

				// Enable again
				setDebugEnabled(true);
				expect(isDebugEnabled()).toBe(true);
			});

			it('should overwrite existing value when enabling', () => {
				store['dm-assist-debug-enabled'] = 'some-value';

				setDebugEnabled(true);

				expect(store['dm-assist-debug-enabled']).toBe('true');
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw when window is undefined', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setDebugEnabled(true)).not.toThrow();
				expect(() => setDebugEnabled(false)).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should handle SSR gracefully without accessing localStorage', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setDebugEnabled(true);

				// Should not have called localStorage methods
				// (can't verify since window is undefined)

				// Restore window
				global.window = originalWindow;
			});
		});

		describe('Edge Cases', () => {
			it('should handle localStorage.setItem throwing error', () => {
				vi.mocked(global.localStorage.setItem).mockImplementation(() => {
					throw new Error('localStorage quota exceeded');
				});

				expect(() => setDebugEnabled(true)).not.toThrow();
			});

			it('should handle localStorage.removeItem throwing error', () => {
				vi.mocked(global.localStorage.removeItem).mockImplementation(() => {
					throw new Error('localStorage access denied');
				});

				expect(() => setDebugEnabled(false)).not.toThrow();
			});
		});
	});

	describe('localStorage Key Consistency', () => {
		it('should use "dm-assist-debug-enabled" as storage key', () => {
			setDebugEnabled(true);

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'dm-assist-debug-enabled',
				'true'
			);
		});

		it('should use same key for get and set operations', () => {
			setDebugEnabled(true);
			isDebugEnabled();

			expect(localStorage.setItem).toHaveBeenCalledWith(
				'dm-assist-debug-enabled',
				'true'
			);
			expect(localStorage.getItem).toHaveBeenCalledWith('dm-assist-debug-enabled');
		});

		it('should use same key for remove operation', () => {
			setDebugEnabled(false);

			expect(localStorage.removeItem).toHaveBeenCalledWith('dm-assist-debug-enabled');
		});
	});
});
