/**
 * Backup Reminder Service (Issue #152)
 *
 * Manages the smart backup reminder system that tracks user export history
 * and prompts users to backup their campaign data at appropriate times.
 *
 * Features:
 * - Track last export date
 * - Track last reminder dismissal date
 * - Track milestone progress (5, 10, 25, 50, 100, 150, 200, ...)
 * - Determine when to show backup reminders based on:
 *   - First-time: 5+ entities, never exported, not dismissed in 24h
 *   - Milestone: reached new milestone (10, 25, 50, 100, ...)
 *   - Time-based: 7+ days since export AND 5+ entities
 * - 24-hour dismissal window for all reminders
 * - Minimum 5 entities required to show any reminder
 */

import type { BackupReminderResult, BackupReminderReason } from '$lib/types';

// localStorage keys
const LAST_EXPORTED_AT_KEY = 'dm-assist-last-exported-at';
const LAST_DISMISSED_AT_KEY = 'dm-assist-last-backup-prompt-dismissed-at';
const LAST_MILESTONE_KEY = 'dm-assist-last-milestone-reached';

// Milestone sequence: 5, 10, 25, 50, then increments of 50 (100, 150, 200, 250, ...)
const MILESTONES = [5, 10, 25, 50];
const MILESTONE_INCREMENT = 50;

/**
 * Get the last exported date from localStorage.
 * Returns null if not set, in SSR context, or on error.
 */
export function getLastExportedAt(): Date | null {
	// Handle SSR
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(LAST_EXPORTED_AT_KEY);
		if (!stored || stored.trim() === '') {
			return null;
		}

		// Validate that it's a proper ISO string format
		// Reject numeric strings and other non-ISO formats
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(stored)) {
			return null;
		}

		const date = new Date(stored);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return null;
		}

		return date;
	} catch (error) {
		return null;
	}
}

/**
 * Save the last exported date to localStorage.
 * Handles SSR gracefully by doing nothing.
 */
export function setLastExportedAt(date: Date): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(LAST_EXPORTED_AT_KEY, date.toISOString());
	} catch (error) {
		// Silently handle errors
	}
}

/**
 * Get the last backup prompt dismissed date from localStorage.
 * Returns null if not set, in SSR context, or on error.
 */
export function getLastBackupPromptDismissedAt(): Date | null {
	// Handle SSR
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(LAST_DISMISSED_AT_KEY);
		if (!stored || stored.trim() === '') {
			return null;
		}

		// Validate that it's a proper ISO string format
		// Reject numeric strings and other non-ISO formats
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(stored)) {
			return null;
		}

		const date = new Date(stored);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return null;
		}

		return date;
	} catch (error) {
		return null;
	}
}

/**
 * Save the last backup prompt dismissed date to localStorage.
 * Handles SSR gracefully by doing nothing.
 */
export function setLastBackupPromptDismissedAt(date: Date): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(LAST_DISMISSED_AT_KEY, date.toISOString());
	} catch (error) {
		// Silently handle errors
	}
}

/**
 * Get the last milestone reached from localStorage.
 * Returns 0 if not set, in SSR context, or on error.
 */
export function getLastMilestoneReached(): number {
	// Handle SSR
	if (typeof window === 'undefined') {
		return 0;
	}

	try {
		const stored = localStorage.getItem(LAST_MILESTONE_KEY);
		if (!stored || stored.trim() === '') {
			return 0;
		}

		// Check if string contains decimal point (reject decimals)
		if (stored.includes('.')) {
			return 0;
		}

		const parsed = parseInt(stored, 10);
		// Validate: must be positive integer and equal to the stored string (no decimals)
		if (isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed) || parsed.toString() !== stored) {
			return 0;
		}

		return parsed;
	} catch (error) {
		return 0;
	}
}

/**
 * Save the last milestone reached to localStorage.
 * Handles SSR gracefully by doing nothing.
 */
export function setLastMilestoneReached(milestone: number): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(LAST_MILESTONE_KEY, milestone.toString());
	} catch (error) {
		// Silently handle errors
	}
}

/**
 * Calculate days since export.
 * Returns null if lastExportedAt is null.
 */
export function getDaysSinceExport(lastExportedAt: Date | null): number | null {
	if (lastExportedAt === null) {
		return null;
	}

	const now = Date.now();
	const exportTime = lastExportedAt.getTime();
	const diffMs = now - exportTime;
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	return diffDays;
}

/**
 * Get the next milestone to reach.
 * Returns the next milestone after lastReached if currentCount > lastReached.
 * Returns null if currentCount hasn't moved past lastReached, or if currentCount < lastReached.
 *
 * Special case: If lastReached is 0 and currentCount is also 0, returns 5 (first milestone to aim for).
 *
 * When currentCount reaches or exceeds the next milestone, that milestone is returned.
 * This is used to trigger the milestone reminder.
 *
 * @param currentCount Current entity count
 * @param lastReached Last milestone reached
 * @returns Next milestone to aim for if currentCount > lastReached, null otherwise
 */
export function getNextMilestone(currentCount: number, lastReached: number): number | null {
	// Handle edge cases
	if (currentCount < 0) {
		currentCount = 0;
	}

	// Special case: starting from 0, next milestone is 5
	if (currentCount === 0 && lastReached === 0) {
		return 5;
	}

	// If current count is less than or equal to last reached, return null
	if (currentCount <= lastReached) {
		return null;
	}

	// Find the next milestone after lastReached
	let nextMilestone: number | null = null;

	// Check fixed milestones first
	for (const milestone of MILESTONES) {
		if (milestone > lastReached) {
			nextMilestone = milestone;
			break;
		}
	}

	// If we've passed all fixed milestones, calculate increment-based milestones
	if (nextMilestone === null) {
		const lastFixed = MILESTONES[MILESTONES.length - 1]; // 50

		// If we're beyond the last fixed milestone, use 50-increment pattern
		if (lastReached >= lastFixed) {
			nextMilestone = lastReached + MILESTONE_INCREMENT;
		} else {
			// This shouldn't happen if MILESTONES is configured correctly
			nextMilestone = lastFixed + MILESTONE_INCREMENT;
		}
	}

	// Return the next milestone if:
	// 1. We've reached it (currentCount >= nextMilestone), OR
	// 2. We just moved past the last milestone (currentCount == lastReached + 1)
	//    This helps prompt early for the next backup
	if (currentCount >= nextMilestone || currentCount == lastReached + 1) {
		return nextMilestone;
	}

	return null;
}

/**
 * Determine if the backup reminder should be shown.
 *
 * Trigger logic (checked in priority order):
 * 1. Minimum 5 entities required for any reminder
 * 2. Never show if dismissed within last 24 hours
 * 3. Milestone: currentCount >= nextMilestone (but only if lastMilestoneReached > 0)
 * 4. Time-based: 7+ days since export AND 5+ entities
 * 5. First-time: never exported, lastMilestoneReached === 0
 *
 * Note: "first-time" is specifically for the initial 5+ entity milestone when never exported.
 *       Subsequent milestones (10, 25, 50, ...) use "milestone" reason.
 *
 * @param entityCount Current number of entities
 * @param lastExportedAt Date of last export (null if never exported)
 * @param lastDismissedAt Date of last dismissal (null if never dismissed)
 * @param lastMilestoneReached Last milestone that was reached
 * @returns Result indicating if should show and the reason
 */
export function shouldShowBackupReminder(
	entityCount: number,
	lastExportedAt: Date | null,
	lastDismissedAt: Date | null,
	lastMilestoneReached: number
): BackupReminderResult {
	// Requirement 1: Minimum 5 entities
	if (entityCount < 5) {
		return { show: false, reason: null };
	}

	// Requirement 2: Check 24-hour dismissal window
	if (lastDismissedAt !== null) {
		const hoursSinceDismiss = (Date.now() - lastDismissedAt.getTime()) / (1000 * 60 * 60);
		if (hoursSinceDismiss <= 24) {
			return { show: false, reason: null };
		}
	}

	// Priority 1: Milestone reached (only if we've passed the first-time milestone)
	if (lastMilestoneReached > 0) {
		const nextMilestone = getNextMilestone(entityCount, lastMilestoneReached);
		if (nextMilestone !== null && entityCount >= nextMilestone) {
			return { show: true, reason: 'milestone' };
		}
	}

	// Priority 2: Time-based (7+ days since export)
	if (lastExportedAt !== null) {
		const daysSince = getDaysSinceExport(lastExportedAt);
		if (daysSince !== null && daysSince >= 7) {
			return { show: true, reason: 'time-based' };
		}
	}

	// Priority 3: First-time (never exported and at initial milestone)
	if (lastExportedAt === null && lastMilestoneReached === 0) {
		return { show: true, reason: 'first-time' };
	}

	// No trigger conditions met
	return { show: false, reason: null };
}
