/**
 * Tests for Time Formatting Utility
 *
 * Issue #62 & #134: Relationship Context UI with Cache Status
 *
 * Provides human-readable relative time formatting for displaying cache age.
 * Used to show when relationship summaries were cached (e.g., "2 hours ago", "just now").
 *
 * These are FAILING tests written following TDD principles (RED phase).
 * They define the expected behavior before implementation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from './timeFormat';

describe('formatRelativeTime', () => {
	let now: Date;

	beforeEach(() => {
		// Set a fixed "now" for consistent testing
		now = new Date('2024-01-20T12:00:00Z');
		vi.useFakeTimers();
		vi.setSystemTime(now);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Recent Times (< 60 seconds)', () => {
		it('should return "just now" for 0 seconds ago', () => {
			const timestamp = new Date('2024-01-20T12:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('just now');
		});

		it('should return "just now" for 30 seconds ago', () => {
			const timestamp = new Date('2024-01-20T11:59:30Z');
			expect(formatRelativeTime(timestamp)).toBe('just now');
		});

		it('should return "just now" for 59 seconds ago', () => {
			const timestamp = new Date('2024-01-20T11:59:01Z');
			expect(formatRelativeTime(timestamp)).toBe('just now');
		});

		it('should return "just now" for 1 second ago', () => {
			const timestamp = new Date('2024-01-20T11:59:59Z');
			expect(formatRelativeTime(timestamp)).toBe('just now');
		});
	});

	describe('Minutes Ago (< 60 minutes)', () => {
		it('should return "1 minute ago" for exactly 1 minute', () => {
			const timestamp = new Date('2024-01-20T11:59:00Z');
			expect(formatRelativeTime(timestamp)).toBe('1 minute ago');
		});

		it('should return "2 minutes ago" for 2 minutes', () => {
			const timestamp = new Date('2024-01-20T11:58:00Z');
			expect(formatRelativeTime(timestamp)).toBe('2 minutes ago');
		});

		it('should return "5 minutes ago" for 5 minutes', () => {
			const timestamp = new Date('2024-01-20T11:55:00Z');
			expect(formatRelativeTime(timestamp)).toBe('5 minutes ago');
		});

		it('should return "30 minutes ago" for 30 minutes', () => {
			const timestamp = new Date('2024-01-20T11:30:00Z');
			expect(formatRelativeTime(timestamp)).toBe('30 minutes ago');
		});

		it('should return "59 minutes ago" for 59 minutes', () => {
			const timestamp = new Date('2024-01-20T11:01:00Z');
			expect(formatRelativeTime(timestamp)).toBe('59 minutes ago');
		});

		it('should use singular for 1 minute', () => {
			const timestamp = new Date('2024-01-20T11:59:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toBe('1 minute ago');
			expect(result).not.toContain('minutes');
		});

		it('should use plural for multiple minutes', () => {
			const timestamp = new Date('2024-01-20T11:58:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toContain('minutes');
		});
	});

	describe('Hours Ago (< 24 hours)', () => {
		it('should return "1 hour ago" for exactly 1 hour', () => {
			const timestamp = new Date('2024-01-20T11:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('1 hour ago');
		});

		it('should return "2 hours ago" for 2 hours', () => {
			const timestamp = new Date('2024-01-20T10:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('2 hours ago');
		});

		it('should return "5 hours ago" for 5 hours', () => {
			const timestamp = new Date('2024-01-20T07:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('5 hours ago');
		});

		it('should return "12 hours ago" for 12 hours', () => {
			const timestamp = new Date('2024-01-20T00:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('12 hours ago');
		});

		it('should return "23 hours ago" for 23 hours', () => {
			const timestamp = new Date('2024-01-19T13:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('23 hours ago');
		});

		it('should use singular for 1 hour', () => {
			const timestamp = new Date('2024-01-20T11:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toBe('1 hour ago');
			expect(result).not.toContain('hours');
		});

		it('should use plural for multiple hours', () => {
			const timestamp = new Date('2024-01-20T10:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toContain('hours');
		});
	});

	describe('Days Ago (< 7 days)', () => {
		it('should return "1 day ago" for exactly 1 day', () => {
			const timestamp = new Date('2024-01-19T12:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('1 day ago');
		});

		it('should return "2 days ago" for 2 days', () => {
			const timestamp = new Date('2024-01-18T12:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('2 days ago');
		});

		it('should return "3 days ago" for 3 days', () => {
			const timestamp = new Date('2024-01-17T12:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('3 days ago');
		});

		it('should return "6 days ago" for 6 days', () => {
			const timestamp = new Date('2024-01-14T12:00:00Z');
			expect(formatRelativeTime(timestamp)).toBe('6 days ago');
		});

		it('should use singular for 1 day', () => {
			const timestamp = new Date('2024-01-19T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toBe('1 day ago');
			expect(result).not.toContain('days');
		});

		it('should use plural for multiple days', () => {
			const timestamp = new Date('2024-01-18T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toContain('days');
		});
	});

	describe('Older Dates (>= 7 days)', () => {
		it('should return formatted date for exactly 7 days ago', () => {
			const timestamp = new Date('2024-01-13T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).not.toContain('ago');
			expect(result).toMatch(/Jan|January/);
			expect(result).toContain('13');
		});

		it('should return formatted date for 14 days ago', () => {
			const timestamp = new Date('2024-01-06T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).not.toContain('ago');
			expect(result).toMatch(/Jan|January/);
			expect(result).toContain('6');
		});

		it('should return formatted date for 30 days ago', () => {
			const timestamp = new Date('2023-12-21T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).not.toContain('ago');
			expect(result).toMatch(/Dec|December/);
			expect(result).toContain('21');
		});

		it('should return formatted date for 1 year ago', () => {
			const timestamp = new Date('2023-01-20T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).not.toContain('ago');
			expect(result).toContain('2023');
		});

		it('should include year for dates in different year', () => {
			const timestamp = new Date('2023-12-25T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			expect(result).toContain('2023');
		});

		it('should format date consistently', () => {
			const timestamp = new Date('2024-01-13T12:00:00Z');
			const result = formatRelativeTime(timestamp);
			// Should be in format like "Jan 13" or "January 13" or "Jan 13, 2024"
			expect(result).toMatch(/\w+\s+\d+/);
		});
	});

	describe('Edge Cases', () => {
		it('should handle future dates gracefully', () => {
			const futureDate = new Date('2024-01-21T12:00:00Z');
			// Should either return "just now" or handle as 0 time difference
			const result = formatRelativeTime(futureDate);
			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should handle Date objects', () => {
			const date = new Date('2024-01-20T11:30:00Z');
			expect(formatRelativeTime(date)).toBe('30 minutes ago');
		});

		it('should handle timestamp numbers', () => {
			const timestamp = new Date('2024-01-20T11:30:00Z').getTime();
			expect(formatRelativeTime(timestamp)).toBe('30 minutes ago');
		});

		it('should handle ISO string dates', () => {
			const isoString = '2024-01-20T11:30:00Z';
			expect(formatRelativeTime(isoString)).toBe('30 minutes ago');
		});

		it('should handle very old dates', () => {
			const veryOld = new Date('2020-01-01T00:00:00Z');
			const result = formatRelativeTime(veryOld);
			expect(result).toContain('2020');
		});

		it('should handle timestamps at midnight', () => {
			const midnight = new Date('2024-01-20T00:00:00Z');
			expect(formatRelativeTime(midnight)).toBe('12 hours ago');
		});

		it('should round down partial time units', () => {
			// 1.5 minutes should be "1 minute ago"
			const timestamp = new Date('2024-01-20T11:58:30Z');
			expect(formatRelativeTime(timestamp)).toBe('1 minute ago');
		});
	});

	describe('Boundary Conditions', () => {
		it('should correctly handle 60 seconds boundary', () => {
			const justUnderMinute = new Date('2024-01-20T11:59:01Z');
			const exactlyOneMinute = new Date('2024-01-20T11:59:00Z');

			expect(formatRelativeTime(justUnderMinute)).toBe('just now');
			expect(formatRelativeTime(exactlyOneMinute)).toBe('1 minute ago');
		});

		it('should correctly handle 60 minutes boundary', () => {
			const justUnderHour = new Date('2024-01-20T11:01:00Z');
			const exactlyOneHour = new Date('2024-01-20T11:00:00Z');

			expect(formatRelativeTime(justUnderHour)).toBe('59 minutes ago');
			expect(formatRelativeTime(exactlyOneHour)).toBe('1 hour ago');
		});

		it('should correctly handle 24 hours boundary', () => {
			const justUnderDay = new Date('2024-01-19T13:00:00Z');
			const exactlyOneDay = new Date('2024-01-19T12:00:00Z');

			expect(formatRelativeTime(justUnderDay)).toBe('23 hours ago');
			expect(formatRelativeTime(exactlyOneDay)).toBe('1 day ago');
		});

		it('should correctly handle 7 days boundary', () => {
			const sixDays = new Date('2024-01-14T12:00:00Z');
			const sevenDays = new Date('2024-01-13T12:00:00Z');

			expect(formatRelativeTime(sixDays)).toBe('6 days ago');
			const sevenDaysResult = formatRelativeTime(sevenDays);
			expect(sevenDaysResult).not.toContain('days ago');
			expect(sevenDaysResult).toMatch(/Jan|January/);
		});
	});

	describe('Integration with Cache Status', () => {
		it('should format cache age for recently generated summary', () => {
			const cacheGeneratedAt = new Date('2024-01-20T11:55:00Z');
			expect(formatRelativeTime(cacheGeneratedAt)).toBe('5 minutes ago');
		});

		it('should format cache age for summary from hours ago', () => {
			const cacheGeneratedAt = new Date('2024-01-20T09:00:00Z');
			expect(formatRelativeTime(cacheGeneratedAt)).toBe('3 hours ago');
		});

		it('should format cache age for stale summary from days ago', () => {
			const cacheGeneratedAt = new Date('2024-01-18T12:00:00Z');
			expect(formatRelativeTime(cacheGeneratedAt)).toBe('2 days ago');
		});

		it('should format cache age for very old summary', () => {
			const cacheGeneratedAt = new Date('2023-12-20T12:00:00Z');
			const result = formatRelativeTime(cacheGeneratedAt);
			expect(result).toContain('Dec');
			expect(result).toContain('20');
		});
	});
});
