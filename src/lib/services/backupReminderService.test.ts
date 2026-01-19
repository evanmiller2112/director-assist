/**
 * Tests for Backup Reminder Service (Issue #152)
 *
 * This service manages the smart backup reminder system that tracks user export
 * history and prompts users to backup their campaign data at appropriate times.
 *
 * Covers:
 * - localStorage get/set operations for lastExportedAt
 * - localStorage get/set operations for lastBackupPromptDismissedAt
 * - localStorage get/set operations for lastMilestoneReached
 * - SSR safety (typeof window checks)
 * - shouldShowBackupReminder logic for all trigger conditions:
 *   - first-time: 5+ entities, never exported, never dismissed
 *   - milestone: reaching 10, 25, 50, 100 entities (new milestone beyond lastReached)
 *   - time-based: 7+ days since export AND 5+ entities
 *   - null when dismissed within 24 hours
 *   - null when < 5 entities
 *   - null when exported within 7 days and no new milestone
 * - getNextMilestone calculation (5, 10, 25, 50, 100, 150, 200...)
 * - getDaysSinceExport returns null for null date, correct days otherwise
 * - Edge cases: corrupted localStorage data, null values, boundary conditions
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	getLastExportedAt,
	setLastExportedAt,
	getLastBackupPromptDismissedAt,
	setLastBackupPromptDismissedAt,
	getLastMilestoneReached,
	setLastMilestoneReached,
	shouldShowBackupReminder,
	getNextMilestone,
	getDaysSinceExport
} from './backupReminderService';
import type { BackupReminderReason } from '$lib/types';

describe('backupReminderService', () => {
	// Store original localStorage to restore after tests
	let originalLocalStorage: Storage;
	let mockStore: Record<string, string>;

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
	});

	afterEach(() => {
		global.localStorage = originalLocalStorage;
	});

	describe('getLastExportedAt', () => {
		describe('No Saved Date', () => {
			it('should return null when no export date is saved', () => {
				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null when localStorage is empty', () => {
				mockStore = {};
				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null when key does not exist', () => {
				mockStore['some-other-key'] = 'value';
				const date = getLastExportedAt();
				expect(date).toBeNull();
			});
		});

		describe('Valid Saved Date', () => {
			it('should return Date object when valid ISO string exists', () => {
				const now = new Date('2026-01-19T10:00:00.000Z');
				mockStore['dm-assist-last-exported-at'] = now.toISOString();

				const date = getLastExportedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(now.toISOString());
			});

			it('should return Date for past date', () => {
				const past = new Date('2025-12-01T00:00:00.000Z');
				mockStore['dm-assist-last-exported-at'] = past.toISOString();

				const date = getLastExportedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(past.toISOString());
			});

			it('should preserve time component of date', () => {
				const dateWithTime = new Date('2026-01-15T14:30:45.123Z');
				mockStore['dm-assist-last-exported-at'] = dateWithTime.toISOString();

				const date = getLastExportedAt();
				expect(date?.toISOString()).toBe(dateWithTime.toISOString());
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return null for invalid ISO string', () => {
				mockStore['dm-assist-last-exported-at'] = 'invalid-date';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for empty string', () => {
				mockStore['dm-assist-last-exported-at'] = '';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for whitespace string', () => {
				mockStore['dm-assist-last-exported-at'] = '   ';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for "null" string', () => {
				mockStore['dm-assist-last-exported-at'] = 'null';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for "undefined" string', () => {
				mockStore['dm-assist-last-exported-at'] = 'undefined';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for malformed JSON', () => {
				mockStore['dm-assist-last-exported-at'] = '{"date": "2026-01-19"}';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});

			it('should return null for number string', () => {
				mockStore['dm-assist-last-exported-at'] = '12345';

				const date = getLastExportedAt();
				expect(date).toBeNull();
			});
		});

		describe('SSR Context Handling', () => {
			it('should return null in SSR context (window undefined)', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const date = getLastExportedAt();
				expect(date).toBeNull();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getLastExportedAt()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setLastExportedAt', () => {
		describe('Setting Valid Date', () => {
			it('should save date to localStorage as ISO string', () => {
				const now = new Date('2026-01-19T10:00:00.000Z');
				setLastExportedAt(now);

				expect(mockStore['dm-assist-last-exported-at']).toBeDefined();
				expect(mockStore['dm-assist-last-exported-at']).toBe(now.toISOString());
			});

			it('should save current date correctly', () => {
				const now = new Date();
				setLastExportedAt(now);

				const saved = mockStore['dm-assist-last-exported-at'];
				expect(saved).toBe(now.toISOString());
			});

			it('should save past date correctly', () => {
				const past = new Date('2025-01-01T00:00:00.000Z');
				setLastExportedAt(past);

				expect(mockStore['dm-assist-last-exported-at']).toBe(past.toISOString());
			});

			it('should preserve time components', () => {
				const date = new Date('2026-01-15T14:30:45.678Z');
				setLastExportedAt(date);

				expect(mockStore['dm-assist-last-exported-at']).toBe(date.toISOString());
			});
		});

		describe('Overwriting Existing Date', () => {
			it('should overwrite existing date', () => {
				mockStore['dm-assist-last-exported-at'] = new Date('2025-01-01').toISOString();

				const newDate = new Date('2026-01-19');
				setLastExportedAt(newDate);

				expect(mockStore['dm-assist-last-exported-at']).toBe(newDate.toISOString());
			});

			it('should handle multiple updates', () => {
				setLastExportedAt(new Date('2026-01-01'));
				setLastExportedAt(new Date('2026-01-10'));
				setLastExportedAt(new Date('2026-01-19'));

				expect(mockStore['dm-assist-last-exported-at']).toBe(new Date('2026-01-19').toISOString());
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setLastExportedAt(new Date())).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setLastExportedAt(new Date('2026-01-19'));

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-last-exported-at']).toBeUndefined();
			});
		});
	});

	describe('getLastBackupPromptDismissedAt', () => {
		describe('No Saved Date', () => {
			it('should return null when no dismiss date is saved', () => {
				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeNull();
			});

			it('should return null when key does not exist', () => {
				mockStore['some-other-key'] = 'value';
				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeNull();
			});
		});

		describe('Valid Saved Date', () => {
			it('should return Date object when valid ISO string exists', () => {
				const now = new Date('2026-01-19T10:00:00.000Z');
				mockStore['dm-assist-last-backup-prompt-dismissed-at'] = now.toISOString();

				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(now.toISOString());
			});

			it('should return recent dismiss time', () => {
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
				mockStore['dm-assist-last-backup-prompt-dismissed-at'] = recentDismiss.toISOString();

				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeInstanceOf(Date);
				expect(date?.toISOString()).toBe(recentDismiss.toISOString());
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return null for invalid ISO string', () => {
				mockStore['dm-assist-last-backup-prompt-dismissed-at'] = 'invalid-date';

				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeNull();
			});

			it('should return null for empty string', () => {
				mockStore['dm-assist-last-backup-prompt-dismissed-at'] = '';

				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeNull();
			});
		});

		describe('SSR Context Handling', () => {
			it('should return null in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const date = getLastBackupPromptDismissedAt();
				expect(date).toBeNull();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getLastBackupPromptDismissedAt()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setLastBackupPromptDismissedAt', () => {
		describe('Setting Valid Date', () => {
			it('should save date to localStorage as ISO string', () => {
				const now = new Date('2026-01-19T10:00:00.000Z');
				setLastBackupPromptDismissedAt(now);

				expect(mockStore['dm-assist-last-backup-prompt-dismissed-at']).toBeDefined();
				expect(mockStore['dm-assist-last-backup-prompt-dismissed-at']).toBe(now.toISOString());
			});

			it('should save current time when dismissing', () => {
				const now = new Date();
				setLastBackupPromptDismissedAt(now);

				const saved = mockStore['dm-assist-last-backup-prompt-dismissed-at'];
				expect(saved).toBe(now.toISOString());
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setLastBackupPromptDismissedAt(new Date())).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setLastBackupPromptDismissedAt(new Date('2026-01-19'));

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-last-backup-prompt-dismissed-at']).toBeUndefined();
			});
		});
	});

	describe('getLastMilestoneReached', () => {
		describe('No Saved Milestone', () => {
			it('should return 0 when no milestone is saved', () => {
				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 when key does not exist', () => {
				mockStore['some-other-key'] = 'value';
				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});
		});

		describe('Valid Saved Milestone', () => {
			it('should return saved milestone number', () => {
				mockStore['dm-assist-last-milestone-reached'] = '10';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(10);
			});

			it('should return 5 for first milestone', () => {
				mockStore['dm-assist-last-milestone-reached'] = '5';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(5);
			});

			it('should return 100 for high milestone', () => {
				mockStore['dm-assist-last-milestone-reached'] = '100';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(100);
			});

			it('should return 200 for very high milestone', () => {
				mockStore['dm-assist-last-milestone-reached'] = '200';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(200);
			});
		});

		describe('Invalid/Corrupted Data', () => {
			it('should return 0 for non-numeric string', () => {
				mockStore['dm-assist-last-milestone-reached'] = 'invalid';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 for empty string', () => {
				mockStore['dm-assist-last-milestone-reached'] = '';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 for "null" string', () => {
				mockStore['dm-assist-last-milestone-reached'] = 'null';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 for "undefined" string', () => {
				mockStore['dm-assist-last-milestone-reached'] = 'undefined';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 for negative number', () => {
				mockStore['dm-assist-last-milestone-reached'] = '-10';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});

			it('should return 0 for decimal number', () => {
				mockStore['dm-assist-last-milestone-reached'] = '10.5';

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);
			});
		});

		describe('SSR Context Handling', () => {
			it('should return 0 in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				const milestone = getLastMilestoneReached();
				expect(milestone).toBe(0);

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => getLastMilestoneReached()).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});
		});
	});

	describe('setLastMilestoneReached', () => {
		describe('Setting Valid Milestone', () => {
			it('should save milestone to localStorage as string', () => {
				setLastMilestoneReached(10);

				expect(mockStore['dm-assist-last-milestone-reached']).toBeDefined();
				expect(mockStore['dm-assist-last-milestone-reached']).toBe('10');
			});

			it('should save first milestone', () => {
				setLastMilestoneReached(5);

				expect(mockStore['dm-assist-last-milestone-reached']).toBe('5');
			});

			it('should save high milestone', () => {
				setLastMilestoneReached(100);

				expect(mockStore['dm-assist-last-milestone-reached']).toBe('100');
			});

			it('should save very high milestone', () => {
				setLastMilestoneReached(200);

				expect(mockStore['dm-assist-last-milestone-reached']).toBe('200');
			});
		});

		describe('Overwriting Existing Milestone', () => {
			it('should overwrite existing milestone', () => {
				mockStore['dm-assist-last-milestone-reached'] = '10';

				setLastMilestoneReached(25);

				expect(mockStore['dm-assist-last-milestone-reached']).toBe('25');
			});

			it('should handle milestone progression', () => {
				setLastMilestoneReached(5);
				setLastMilestoneReached(10);
				setLastMilestoneReached(25);

				expect(mockStore['dm-assist-last-milestone-reached']).toBe('25');
			});
		});

		describe('SSR Context Handling', () => {
			it('should not throw in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				expect(() => setLastMilestoneReached(10)).not.toThrow();

				// Restore window
				global.window = originalWindow;
			});

			it('should not access localStorage in SSR context', () => {
				const originalWindow = global.window;
				// @ts-expect-error - Testing SSR behavior
				delete global.window;

				setLastMilestoneReached(10);

				// Restore window
				global.window = originalWindow;

				// Should not have saved to localStorage
				expect(mockStore['dm-assist-last-milestone-reached']).toBeUndefined();
			});
		});
	});

	describe('shouldShowBackupReminder', () => {
		describe('First-time Trigger (never exported, never dismissed, 5+ entities)', () => {
			it('should return first-time when 5 entities, never exported, never dismissed', () => {
				const result = shouldShowBackupReminder(5, null, null, 0);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('first-time' as BackupReminderReason);
			});

			it('should return first-time when 10 entities, never exported, never dismissed', () => {
				const result = shouldShowBackupReminder(10, null, null, 0);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('first-time' as BackupReminderReason);
			});

			it('should return first-time when 100 entities, never exported, never dismissed', () => {
				const result = shouldShowBackupReminder(100, null, null, 0);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('first-time' as BackupReminderReason);
			});

			it('should NOT show first-time when less than 5 entities', () => {
				const result = shouldShowBackupReminder(4, null, null, 0);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should NOT show first-time when previously exported', () => {
				const lastExported = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
				const result = shouldShowBackupReminder(5, lastExported, null, 0);

				expect(result.show).toBe(false);
			});

			it('should NOT show first-time when recently dismissed', () => {
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
				const result = shouldShowBackupReminder(5, null, recentDismiss, 0);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});
		});

		describe('Milestone Trigger (reaching 10, 25, 50, 100 entities)', () => {
			it('should return milestone when reaching 10 entities from 5', () => {
				const result = shouldShowBackupReminder(10, null, null, 5);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should return milestone when reaching 25 entities from 10', () => {
				const result = shouldShowBackupReminder(25, null, null, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should return milestone when reaching 50 entities from 25', () => {
				const result = shouldShowBackupReminder(50, null, null, 25);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should return milestone when reaching 100 entities from 50', () => {
				const result = shouldShowBackupReminder(100, null, null, 50);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should return milestone when reaching 150 entities from 100', () => {
				const result = shouldShowBackupReminder(150, null, null, 100);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should return milestone when reaching 200 entities from 150', () => {
				const result = shouldShowBackupReminder(200, null, null, 150);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should NOT show milestone when at same milestone', () => {
				const result = shouldShowBackupReminder(10, null, null, 10);

				expect(result.show).toBe(false);
			});

			it('should NOT show milestone when between milestones', () => {
				const result = shouldShowBackupReminder(12, null, null, 10);

				expect(result.show).toBe(false);
			});

			it('should NOT show milestone when recently dismissed (24 hours)', () => {
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
				const result = shouldShowBackupReminder(25, null, recentDismiss, 10);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should show milestone when dismissed more than 24 hours ago', () => {
				const oldDismiss = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
				const result = shouldShowBackupReminder(25, null, oldDismiss, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should prioritize milestone over first-time', () => {
				// Never exported, but reached milestone 10 from 5
				const result = shouldShowBackupReminder(10, null, null, 5);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});
		});

		describe('Time-based Trigger (7+ days since export, 5+ entities)', () => {
			it('should return time-based when 7 days since export with 5+ entities', () => {
				const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
				const result = shouldShowBackupReminder(5, sevenDaysAgo, null, 5);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('time-based' as BackupReminderReason);
			});

			it('should return time-based when 10 days since export', () => {
				const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
				const result = shouldShowBackupReminder(10, tenDaysAgo, null, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('time-based' as BackupReminderReason);
			});

			it('should return time-based when 30 days since export', () => {
				const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
				const result = shouldShowBackupReminder(20, thirtyDaysAgo, null, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('time-based' as BackupReminderReason);
			});

			it('should NOT show time-based when less than 7 days since export', () => {
				const sixDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 6);
				const result = shouldShowBackupReminder(10, sixDaysAgo, null, 10);

				expect(result.show).toBe(false);
			});

			it('should NOT show time-based when less than 5 entities', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const result = shouldShowBackupReminder(4, eightDaysAgo, null, 0);

				expect(result.show).toBe(false);
			});

			it('should NOT show time-based when recently dismissed (24 hours)', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
				const result = shouldShowBackupReminder(10, eightDaysAgo, recentDismiss, 10);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should show time-based when dismissed more than 24 hours ago', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const oldDismiss = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
				const result = shouldShowBackupReminder(10, eightDaysAgo, oldDismiss, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('time-based' as BackupReminderReason);
			});
		});

		describe('Dismiss Logic (24 hour suppression)', () => {
			it('should NOT show when dismissed 1 hour ago', () => {
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60);
				const result = shouldShowBackupReminder(10, null, recentDismiss, 5);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should NOT show when dismissed 23 hours ago', () => {
				const recentDismiss = new Date(Date.now() - 1000 * 60 * 60 * 23);
				const result = shouldShowBackupReminder(10, null, recentDismiss, 5);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should NOT show when dismissed exactly 24 hours ago', () => {
				const exactDismiss = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const result = shouldShowBackupReminder(10, null, exactDismiss, 5);

				expect(result.show).toBe(false);
			});

			it('should show when dismissed 25 hours ago', () => {
				const oldDismiss = new Date(Date.now() - 1000 * 60 * 60 * 25);
				const result = shouldShowBackupReminder(10, null, oldDismiss, 5);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should show when dismissed 7 days ago', () => {
				const oldDismiss = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
				const result = shouldShowBackupReminder(10, null, oldDismiss, 5);

				expect(result.show).toBe(true);
			});
		});

		describe('Entity Count Threshold (minimum 5 entities)', () => {
			it('should NOT show with 0 entities', () => {
				const result = shouldShowBackupReminder(0, null, null, 0);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should NOT show with 1 entity', () => {
				const result = shouldShowBackupReminder(1, null, null, 0);

				expect(result.show).toBe(false);
			});

			it('should NOT show with 4 entities', () => {
				const result = shouldShowBackupReminder(4, null, null, 0);

				expect(result.show).toBe(false);
			});

			it('should show with exactly 5 entities', () => {
				const result = shouldShowBackupReminder(5, null, null, 0);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('first-time' as BackupReminderReason);
			});

			it('should NOT show time-based with 4 entities even if 7+ days', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const result = shouldShowBackupReminder(4, eightDaysAgo, null, 0);

				expect(result.show).toBe(false);
			});
		});

		describe('Priority Logic', () => {
			it('should prioritize milestone over time-based', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const result = shouldShowBackupReminder(25, eightDaysAgo, null, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should prioritize milestone over first-time', () => {
				const result = shouldShowBackupReminder(10, null, null, 5);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('milestone' as BackupReminderReason);
			});

			it('should show time-based when no milestone reached', () => {
				const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
				const result = shouldShowBackupReminder(12, eightDaysAgo, null, 10);

				expect(result.show).toBe(true);
				expect(result.reason).toBe('time-based' as BackupReminderReason);
			});
		});

		describe('Edge Cases', () => {
			it('should handle negative entity count gracefully', () => {
				const result = shouldShowBackupReminder(-5, null, null, 0);

				expect(result.show).toBe(false);
				expect(result.reason).toBeNull();
			});

			it('should handle very large entity count', () => {
				const result = shouldShowBackupReminder(10000, null, null, 200);

				expect(result.show).toBe(true);
				// Should trigger milestone (next after 200 would be 250)
			});

			it('should handle future date for lastExported gracefully', () => {
				const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
				const result = shouldShowBackupReminder(10, futureDate, null, 0);

				expect(result.show).toBe(false);
			});

			it('should handle future date for lastDismissed gracefully', () => {
				const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
				const result = shouldShowBackupReminder(10, null, futureDate, 0);

				// Future dismiss date should be treated as "recently dismissed"
				expect(result.show).toBe(false);
			});

			it('should handle lastMilestoneReached higher than current count', () => {
				const result = shouldShowBackupReminder(10, null, null, 50);

				expect(result.show).toBe(false);
			});
		});
	});

	describe('getNextMilestone', () => {
		describe('Milestone Sequence (5, 10, 25, 50, 100, 150, 200...)', () => {
			it('should return 5 when starting from 0', () => {
				const next = getNextMilestone(0, 0);
				expect(next).toBe(5);
			});

			it('should return 10 when at 5 entities, last reached 0', () => {
				const next = getNextMilestone(5, 0);
				expect(next).toBe(5);
			});

			it('should return 10 when at 6 entities, last reached 5', () => {
				const next = getNextMilestone(6, 5);
				expect(next).toBe(10);
			});

			it('should return 25 when at 10 entities, last reached 10', () => {
				const next = getNextMilestone(10, 10);
				expect(next).toBeNull();
			});

			it('should return 25 when at 11 entities, last reached 10', () => {
				const next = getNextMilestone(11, 10);
				expect(next).toBe(25);
			});

			it('should return 50 when at 26 entities, last reached 25', () => {
				const next = getNextMilestone(26, 25);
				expect(next).toBe(50);
			});

			it('should return 100 when at 51 entities, last reached 50', () => {
				const next = getNextMilestone(51, 50);
				expect(next).toBe(100);
			});

			it('should return 150 when at 101 entities, last reached 100', () => {
				const next = getNextMilestone(101, 100);
				expect(next).toBe(150);
			});

			it('should return 200 when at 151 entities, last reached 150', () => {
				const next = getNextMilestone(151, 150);
				expect(next).toBe(200);
			});

			it('should return 250 when at 201 entities, last reached 200', () => {
				const next = getNextMilestone(201, 200);
				expect(next).toBe(250);
			});
		});

		describe('Between Milestones', () => {
			it('should return null when at milestone already', () => {
				const next = getNextMilestone(10, 10);
				expect(next).toBeNull();
			});

			it('should return null when between milestones but not reached next', () => {
				const next = getNextMilestone(7, 5);
				expect(next).toBeNull();
			});

			it('should return next milestone when reached', () => {
				const next = getNextMilestone(10, 5);
				expect(next).toBe(10);
			});
		});

		describe('Edge Cases', () => {
			it('should handle 0 current count', () => {
				const next = getNextMilestone(0, 0);
				expect(next).toBe(5);
			});

			it('should handle negative current count', () => {
				const next = getNextMilestone(-5, 0);
				expect(next).toBe(5);
			});

			it('should handle very large counts (50 increments after 100)', () => {
				const next = getNextMilestone(300, 250);
				expect(next).toBe(300);
			});

			it('should return null when current count less than last reached', () => {
				const next = getNextMilestone(5, 10);
				expect(next).toBeNull();
			});

			it('should handle jump across multiple milestones', () => {
				const next = getNextMilestone(100, 5);
				expect(next).toBe(10);
			});
		});
	});

	describe('getDaysSinceExport', () => {
		describe('Valid Dates', () => {
			it('should return null when lastExported is null', () => {
				const days = getDaysSinceExport(null);
				expect(days).toBeNull();
			});

			it('should return 0 for export today', () => {
				const today = new Date();
				const days = getDaysSinceExport(today);
				expect(days).toBe(0);
			});

			it('should return 1 for export 1 day ago', () => {
				const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const days = getDaysSinceExport(yesterday);
				expect(days).toBe(1);
			});

			it('should return 7 for export 7 days ago', () => {
				const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
				const days = getDaysSinceExport(sevenDaysAgo);
				expect(days).toBe(7);
			});

			it('should return 30 for export 30 days ago', () => {
				const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
				const days = getDaysSinceExport(thirtyDaysAgo);
				expect(days).toBe(30);
			});

			it('should return 365 for export 1 year ago', () => {
				const oneYearAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);
				const days = getDaysSinceExport(oneYearAgo);
				expect(days).toBe(365);
			});
		});

		describe('Edge Cases', () => {
			it('should return 0 for export less than 24 hours ago', () => {
				const twelveHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 12);
				const days = getDaysSinceExport(twelveHoursAgo);
				expect(days).toBe(0);
			});

			it('should return negative days for future date', () => {
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
				const days = getDaysSinceExport(tomorrow);
				expect(days).toBe(-1);
			});

			it('should handle very old dates', () => {
				const veryOld = new Date('2020-01-01');
				const days = getDaysSinceExport(veryOld);
				expect(days).toBeGreaterThan(1000);
			});
		});

		describe('Time Precision', () => {
			it('should round down partial days', () => {
				const oneDayAndTwelveHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 36);
				const days = getDaysSinceExport(oneDayAndTwelveHoursAgo);
				expect(days).toBe(1);
			});

			it('should handle exact 24 hour boundary', () => {
				const exactlyOneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
				const days = getDaysSinceExport(exactlyOneDayAgo);
				expect(days).toBe(1);
			});
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete first-time user flow', () => {
			// New user with no history
			const lastExported = getLastExportedAt();
			const lastDismissed = getLastBackupPromptDismissedAt();
			const lastMilestone = getLastMilestoneReached();

			expect(lastExported).toBeNull();
			expect(lastDismissed).toBeNull();
			expect(lastMilestone).toBe(0);

			// Check if should show reminder with 5 entities
			const result = shouldShowBackupReminder(5, lastExported, lastDismissed, lastMilestone);
			expect(result.show).toBe(true);
			expect(result.reason).toBe('first-time' as BackupReminderReason);
		});

		it('should handle export and milestone progression', () => {
			// User exports at 5 entities
			setLastExportedAt(new Date());
			setLastMilestoneReached(5);

			// Later, user has 10 entities
			const lastExported = getLastExportedAt();
			const lastMilestone = getLastMilestoneReached();
			const result = shouldShowBackupReminder(10, lastExported, null, lastMilestone);

			expect(result.show).toBe(true);
			expect(result.reason).toBe('milestone' as BackupReminderReason);
		});

		it('should handle dismiss and re-trigger after 24 hours', () => {
			// User dismisses reminder
			const dismissTime = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
			setLastBackupPromptDismissedAt(dismissTime);

			// Check if should show again
			const lastDismissed = getLastBackupPromptDismissedAt();
			const result = shouldShowBackupReminder(10, null, lastDismissed, 5);

			expect(result.show).toBe(true);
			expect(result.reason).toBe('milestone' as BackupReminderReason);
		});

		it('should handle time-based reminder flow', () => {
			// User exported 10 days ago
			const oldExport = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
			setLastExportedAt(oldExport);
			setLastMilestoneReached(10);

			// Check if should show time-based reminder
			const lastExported = getLastExportedAt();
			const lastMilestone = getLastMilestoneReached();
			const result = shouldShowBackupReminder(10, lastExported, null, lastMilestone);

			expect(result.show).toBe(true);
			expect(result.reason).toBe('time-based' as BackupReminderReason);

			// Calculate days since export
			const days = getDaysSinceExport(lastExported);
			expect(days).toBe(10);
		});

		it('should persist across localStorage get/set cycles', () => {
			const exportDate = new Date('2026-01-15T10:00:00.000Z');
			const dismissDate = new Date('2026-01-18T15:30:00.000Z');
			const milestone = 25;

			// Set values
			setLastExportedAt(exportDate);
			setLastBackupPromptDismissedAt(dismissDate);
			setLastMilestoneReached(milestone);

			// Get values
			const retrievedExport = getLastExportedAt();
			const retrievedDismiss = getLastBackupPromptDismissedAt();
			const retrievedMilestone = getLastMilestoneReached();

			// Verify exact values
			expect(retrievedExport?.toISOString()).toBe(exportDate.toISOString());
			expect(retrievedDismiss?.toISOString()).toBe(dismissDate.toISOString());
			expect(retrievedMilestone).toBe(milestone);
		});
	});
});
