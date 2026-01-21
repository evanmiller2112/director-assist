/**
 * Debug Store (Svelte 5 runes-based)
 *
 * Manages debug console state and entries for AI request/response inspection.
 * Entries are stored in memory (not persisted), but enabled state is persisted via debugSettingsService.
 */

import { isDebugEnabled, setDebugEnabled } from '$lib/services/debugSettingsService';
import type { DebugEntry } from '$lib/types/debug';

// Maximum number of entries to keep (FIFO - oldest removed when exceeded)
const MAX_ENTRIES = 50;

// State using Svelte 5 runes
let enabled = $state(false);
let entries = $state<DebugEntry[]>([]);
let isExpanded = $state(false);

/**
 * Load enabled state from localStorage using debugSettingsService
 */
function load(): void {
	try {
		enabled = isDebugEnabled();
	} catch (error) {
		// Silently handle errors - enabled will remain false
		console.warn('Failed to load debug settings:', error);
	}
}

/**
 * Set enabled state and persist to localStorage
 */
function setEnabled(value: boolean): void {
	enabled = value;
	setDebugEnabled(value);
}

/**
 * Add a new debug entry.
 * Maintains max 50 entries using FIFO (removes oldest when limit exceeded).
 * New entries are added to the front of the array.
 */
function addEntry(entry: DebugEntry): void {
	// Add new entry to the front
	entries = [entry, ...entries];

	// Enforce max limit - keep only the 50 most recent entries
	if (entries.length > MAX_ENTRIES) {
		entries = entries.slice(0, MAX_ENTRIES);
	}
}

/**
 * Clear all debug entries
 */
function clearEntries(): void {
	entries = [];
}

/**
 * Toggle expanded state
 */
function toggleExpanded(): void {
	isExpanded = !isExpanded;
}

/**
 * Reset store to initial state (for testing)
 * @internal
 */
function reset(): void {
	enabled = false;
	entries = [];
	isExpanded = false;
}

// Export store object with getters and methods
export const debugStore = {
	get enabled() {
		return enabled;
	},
	get entries() {
		return entries;
	},
	get isExpanded() {
		return isExpanded;
	},
	load,
	setEnabled,
	addEntry,
	clearEntries,
	toggleExpanded,
	reset // For testing
};
