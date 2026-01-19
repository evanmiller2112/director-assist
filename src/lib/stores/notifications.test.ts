/**
 * Tests for Notification Store
 *
 * These tests verify the toast notification system which provides methods
 * to show success, error, and info notifications with auto-dismiss functionality.
 *
 * Test Coverage:
 * - Initial state (empty toasts array)
 * - Adding toasts (success, error, info)
 * - Auto-dismiss after duration
 * - Default duration handling
 * - Manual dismiss (by ID)
 * - Clear all toasts
 * - ID generation uniqueness
 * - Edge cases (non-existent IDs, zero duration, rapid additions)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Notification Store', () => {
	let notificationStore: any;

	beforeEach(async () => {
		// Clear all mocks and timers
		vi.clearAllMocks();
		vi.clearAllTimers();

		// Use fake timers for auto-dismiss testing
		vi.useFakeTimers();

		// Clear module cache and import fresh instance
		vi.resetModules();
		const module = await import('./notifications.svelte');
		notificationStore = module.notificationStore;
	});

	afterEach(() => {
		// Restore real timers
		vi.useRealTimers();
	});

	describe('Initial State', () => {
		it('should initialize with empty toasts array', () => {
			expect(notificationStore.toasts).toBeDefined();
			expect(Array.isArray(notificationStore.toasts)).toBe(true);
			expect(notificationStore.toasts.length).toBe(0);
		});
	});

	describe('success() Method', () => {
		it('should add a success toast with correct type', () => {
			notificationStore.success('Operation successful');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].type).toBe('success');
		});

		it('should add a success toast with correct message', () => {
			notificationStore.success('User saved successfully');

			expect(notificationStore.toasts[0].message).toBe('User saved successfully');
		});

		it('should return a unique toast ID', () => {
			const id = notificationStore.success('Test message');

			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
			expect(id).toMatch(/^toast-\d+-\d+$/);
		});

		it('should use default duration of 4000ms when not specified', () => {
			notificationStore.success('Test message');

			expect(notificationStore.toasts[0].duration).toBe(4000);
		});

		it('should use custom duration when specified', () => {
			notificationStore.success('Test message', 2000);

			expect(notificationStore.toasts[0].duration).toBe(2000);
		});

		it('should auto-dismiss after default duration', () => {
			notificationStore.success('Test message');

			expect(notificationStore.toasts.length).toBe(1);

			// Fast-forward time by 4000ms
			vi.advanceTimersByTime(4000);

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should auto-dismiss after custom duration', () => {
			notificationStore.success('Test message', 3000);

			expect(notificationStore.toasts.length).toBe(1);

			// Fast-forward time by 2999ms (not quite enough)
			vi.advanceTimersByTime(2999);
			expect(notificationStore.toasts.length).toBe(1);

			// Fast-forward by 1 more ms (total 3000ms)
			vi.advanceTimersByTime(1);
			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should not auto-dismiss when duration is 0', () => {
			notificationStore.success('Persistent message', 0);

			expect(notificationStore.toasts.length).toBe(1);

			// Fast-forward a long time
			vi.advanceTimersByTime(10000);

			// Toast should still be present
			expect(notificationStore.toasts.length).toBe(1);
		});

		it('should not auto-dismiss when duration is negative', () => {
			notificationStore.success('Persistent message', -1);

			expect(notificationStore.toasts.length).toBe(1);

			// Fast-forward time
			vi.advanceTimersByTime(5000);

			// Toast should still be present
			expect(notificationStore.toasts.length).toBe(1);
		});

		it('should add toast to toasts array', () => {
			const id = notificationStore.success('Test message');

			expect(notificationStore.toasts[0].id).toBe(id);
		});

		it('should generate unique IDs for multiple toasts', () => {
			const id1 = notificationStore.success('Message 1');
			const id2 = notificationStore.success('Message 2');
			const id3 = notificationStore.success('Message 3');

			expect(id1).not.toBe(id2);
			expect(id2).not.toBe(id3);
			expect(id1).not.toBe(id3);
		});
	});

	describe('error() Method', () => {
		it('should add an error toast with correct type', () => {
			notificationStore.error('Operation failed');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].type).toBe('error');
		});

		it('should add an error toast with correct message', () => {
			notificationStore.error('Failed to save user');

			expect(notificationStore.toasts[0].message).toBe('Failed to save user');
		});

		it('should return a unique toast ID', () => {
			const id = notificationStore.error('Error message');

			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
		});

		it('should use default duration when not specified', () => {
			notificationStore.error('Error message');

			expect(notificationStore.toasts[0].duration).toBe(4000);
		});

		it('should use custom duration when specified', () => {
			notificationStore.error('Error message', 5000);

			expect(notificationStore.toasts[0].duration).toBe(5000);
		});

		it('should auto-dismiss after duration', () => {
			notificationStore.error('Error message', 2000);

			expect(notificationStore.toasts.length).toBe(1);

			vi.advanceTimersByTime(2000);

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should not auto-dismiss when duration is 0', () => {
			notificationStore.error('Persistent error', 0);

			vi.advanceTimersByTime(10000);

			expect(notificationStore.toasts.length).toBe(1);
		});
	});

	describe('info() Method', () => {
		it('should add an info toast with correct type', () => {
			notificationStore.info('Information message');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].type).toBe('info');
		});

		it('should add an info toast with correct message', () => {
			notificationStore.info('Loading data...');

			expect(notificationStore.toasts[0].message).toBe('Loading data...');
		});

		it('should return a unique toast ID', () => {
			const id = notificationStore.info('Info message');

			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
		});

		it('should use default duration when not specified', () => {
			notificationStore.info('Info message');

			expect(notificationStore.toasts[0].duration).toBe(4000);
		});

		it('should use custom duration when specified', () => {
			notificationStore.info('Info message', 6000);

			expect(notificationStore.toasts[0].duration).toBe(6000);
		});

		it('should auto-dismiss after duration', () => {
			notificationStore.info('Info message', 1500);

			expect(notificationStore.toasts.length).toBe(1);

			vi.advanceTimersByTime(1500);

			expect(notificationStore.toasts.length).toBe(0);
		});
	});

	describe('dismiss() Method', () => {
		it('should remove toast by ID', () => {
			const id = notificationStore.success('Test message');

			expect(notificationStore.toasts.length).toBe(1);

			notificationStore.dismiss(id);

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should only remove the specified toast', () => {
			const id1 = notificationStore.success('Message 1');
			const id2 = notificationStore.success('Message 2');
			const id3 = notificationStore.success('Message 3');

			expect(notificationStore.toasts.length).toBe(3);

			notificationStore.dismiss(id2);

			expect(notificationStore.toasts.length).toBe(2);
			expect(notificationStore.toasts.some((t: any) => t.id === id1)).toBe(true);
			expect(notificationStore.toasts.some((t: any) => t.id === id2)).toBe(false);
			expect(notificationStore.toasts.some((t: any) => t.id === id3)).toBe(true);
		});

		it('should handle non-existent ID gracefully', () => {
			notificationStore.success('Test message');

			expect(notificationStore.toasts.length).toBe(1);

			// Try to dismiss non-existent toast
			notificationStore.dismiss('non-existent-id');

			// Should not throw and should not affect existing toasts
			expect(notificationStore.toasts.length).toBe(1);
		});

		it('should handle dismissing from empty toasts array', () => {
			expect(notificationStore.toasts.length).toBe(0);

			// Should not throw
			expect(() => {
				notificationStore.dismiss('any-id');
			}).not.toThrow();
		});

		it('should handle dismissing already dismissed toast', () => {
			const id = notificationStore.success('Test message');

			notificationStore.dismiss(id);
			expect(notificationStore.toasts.length).toBe(0);

			// Try to dismiss again
			notificationStore.dismiss(id);

			// Should not throw
			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should not interfere with auto-dismiss timers of other toasts', () => {
			const id1 = notificationStore.success('Message 1', 2000);
			const id2 = notificationStore.success('Message 2', 3000);

			// Manually dismiss first toast
			notificationStore.dismiss(id1);

			expect(notificationStore.toasts.length).toBe(1);

			// Second toast should still auto-dismiss after its duration
			vi.advanceTimersByTime(3000);

			expect(notificationStore.toasts.length).toBe(0);
		});
	});

	describe('clear() Method', () => {
		it('should remove all toasts', () => {
			notificationStore.success('Message 1');
			notificationStore.error('Message 2');
			notificationStore.info('Message 3');

			expect(notificationStore.toasts.length).toBe(3);

			notificationStore.clear();

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should work when toasts array is empty', () => {
			expect(notificationStore.toasts.length).toBe(0);

			// Should not throw
			expect(() => {
				notificationStore.clear();
			}).not.toThrow();

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should clear toasts of all types', () => {
			notificationStore.success('Success message');
			notificationStore.error('Error message');
			notificationStore.info('Info message');

			expect(notificationStore.toasts.length).toBe(3);

			notificationStore.clear();

			expect(notificationStore.toasts.length).toBe(0);
			expect(Array.isArray(notificationStore.toasts)).toBe(true);
		});

		it('should allow adding new toasts after clearing', () => {
			notificationStore.success('Message 1');
			notificationStore.clear();

			const id = notificationStore.success('Message 2');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].id).toBe(id);
		});
	});

	describe('Toast Object Structure', () => {
		it('should have all required properties', () => {
			const id = notificationStore.success('Test message', 5000);

			const toast = notificationStore.toasts[0];

			expect(toast).toHaveProperty('id');
			expect(toast).toHaveProperty('type');
			expect(toast).toHaveProperty('message');
			expect(toast).toHaveProperty('duration');
		});

		it('should have correct property types', () => {
			notificationStore.info('Test message', 3000);

			const toast = notificationStore.toasts[0];

			expect(typeof toast.id).toBe('string');
			expect(typeof toast.type).toBe('string');
			expect(typeof toast.message).toBe('string');
			expect(typeof toast.duration).toBe('number');
		});

		it('should have valid toast types', () => {
			const successId = notificationStore.success('Success');
			const errorId = notificationStore.error('Error');
			const infoId = notificationStore.info('Info');

			const types = notificationStore.toasts.map((t: any) => t.type);

			expect(types).toContain('success');
			expect(types).toContain('error');
			expect(types).toContain('info');
		});
	});

	describe('ID Generation', () => {
		it('should generate IDs with incrementing counter', () => {
			const id1 = notificationStore.success('Message 1');
			const id2 = notificationStore.success('Message 2');
			const id3 = notificationStore.success('Message 3');

			// Extract counter from ID (format: toast-{counter}-{timestamp})
			const counter1 = parseInt(id1.split('-')[1]);
			const counter2 = parseInt(id2.split('-')[1]);
			const counter3 = parseInt(id3.split('-')[1]);

			expect(counter2).toBeGreaterThan(counter1);
			expect(counter3).toBeGreaterThan(counter2);
		});

		it('should include timestamp in ID', () => {
			const id = notificationStore.success('Test');

			// ID format: toast-{counter}-{timestamp}
			const parts = id.split('-');
			expect(parts.length).toBe(3);

			const timestamp = parseInt(parts[2]);
			expect(timestamp).toBeGreaterThan(0);
			expect(timestamp).toBeLessThanOrEqual(Date.now());
		});

		it('should generate unique IDs even when called rapidly', () => {
			const ids = new Set<string>();

			// Add 10 toasts rapidly
			for (let i = 0; i < 10; i++) {
				const id = notificationStore.success(`Message ${i}`);
				ids.add(id);
			}

			// All IDs should be unique
			expect(ids.size).toBe(10);
		});
	});

	describe('Multiple Toasts Management', () => {
		it('should maintain multiple toasts simultaneously', () => {
			notificationStore.success('Success message', 0);
			notificationStore.error('Error message', 0);
			notificationStore.info('Info message', 0);

			expect(notificationStore.toasts.length).toBe(3);
		});

		it('should auto-dismiss toasts independently', () => {
			notificationStore.success('Message 1', 1000);
			notificationStore.success('Message 2', 2000);
			notificationStore.success('Message 3', 3000);

			expect(notificationStore.toasts.length).toBe(3);

			// First toast should dismiss at 1000ms
			vi.advanceTimersByTime(1000);
			expect(notificationStore.toasts.length).toBe(2);

			// Second toast should dismiss at 2000ms
			vi.advanceTimersByTime(1000);
			expect(notificationStore.toasts.length).toBe(1);

			// Third toast should dismiss at 3000ms
			vi.advanceTimersByTime(1000);
			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should handle mix of auto-dismiss and persistent toasts', () => {
			notificationStore.success('Auto-dismiss', 1000);
			notificationStore.error('Persistent', 0);
			notificationStore.info('Auto-dismiss', 2000);

			expect(notificationStore.toasts.length).toBe(3);

			// After 1000ms, first should be dismissed
			vi.advanceTimersByTime(1000);
			expect(notificationStore.toasts.length).toBe(2);

			// After another 1000ms (total 2000ms), third should be dismissed
			vi.advanceTimersByTime(1000);
			expect(notificationStore.toasts.length).toBe(1);

			// Persistent toast should remain
			expect(notificationStore.toasts[0].message).toBe('Persistent');
		});

		it('should maintain correct order of toasts', () => {
			const id1 = notificationStore.success('First', 0);
			const id2 = notificationStore.error('Second', 0);
			const id3 = notificationStore.info('Third', 0);

			expect(notificationStore.toasts[0].id).toBe(id1);
			expect(notificationStore.toasts[1].id).toBe(id2);
			expect(notificationStore.toasts[2].id).toBe(id3);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty message string', () => {
			const id = notificationStore.success('');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].message).toBe('');
		});

		it('should handle very long messages', () => {
			const longMessage = 'A'.repeat(1000);
			const id = notificationStore.success(longMessage);

			expect(notificationStore.toasts[0].message).toBe(longMessage);
		});

		it('should handle special characters in message', () => {
			const specialMessage = '<script>alert("XSS")</script> & "quotes" \'apostrophes\'';
			const id = notificationStore.success(specialMessage);

			expect(notificationStore.toasts[0].message).toBe(specialMessage);
		});

		it('should handle very large duration values', () => {
			notificationStore.success('Test', 999999999);

			expect(notificationStore.toasts[0].duration).toBe(999999999);
		});

		it('should handle adding toast after some have been dismissed', () => {
			const id1 = notificationStore.success('First');
			notificationStore.dismiss(id1);

			const id2 = notificationStore.success('Second');

			expect(notificationStore.toasts.length).toBe(1);
			expect(notificationStore.toasts[0].id).toBe(id2);
		});

		it('should handle rapid clear operations', () => {
			notificationStore.success('Message 1');
			notificationStore.success('Message 2');

			notificationStore.clear();
			notificationStore.clear();
			notificationStore.clear();

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should handle dismiss and clear interleaved', () => {
			const id1 = notificationStore.success('Message 1', 0);
			const id2 = notificationStore.success('Message 2', 0);

			notificationStore.dismiss(id1);
			notificationStore.clear();

			expect(notificationStore.toasts.length).toBe(0);
		});
	});

	describe('Reactivity', () => {
		it('should update toasts array when adding toast', () => {
			const initialLength = notificationStore.toasts.length;

			notificationStore.success('Test');

			expect(notificationStore.toasts.length).toBe(initialLength + 1);
		});

		it('should update toasts array when dismissing toast', () => {
			const id = notificationStore.success('Test');

			expect(notificationStore.toasts.length).toBe(1);

			notificationStore.dismiss(id);

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should update toasts array when clearing', () => {
			notificationStore.success('Test 1');
			notificationStore.success('Test 2');

			expect(notificationStore.toasts.length).toBe(2);

			notificationStore.clear();

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should reflect auto-dismiss in toasts array', () => {
			notificationStore.success('Test', 1000);

			expect(notificationStore.toasts.length).toBe(1);

			vi.advanceTimersByTime(1000);

			expect(notificationStore.toasts.length).toBe(0);
		});
	});

	describe('Method Chaining and Return Values', () => {
		it('should allow using returned ID to dismiss toast', () => {
			const id = notificationStore.success('Test message', 0);

			expect(notificationStore.toasts.length).toBe(1);

			notificationStore.dismiss(id);

			expect(notificationStore.toasts.length).toBe(0);
		});

		it('should return different IDs for different toast methods', () => {
			const successId = notificationStore.success('Success');
			const errorId = notificationStore.error('Error');
			const infoId = notificationStore.info('Info');

			expect(successId).not.toBe(errorId);
			expect(errorId).not.toBe(infoId);
			expect(successId).not.toBe(infoId);
		});

		it('should store returned ID in toast object', () => {
			const id = notificationStore.success('Test');

			expect(notificationStore.toasts[0].id).toBe(id);
		});
	});
});
