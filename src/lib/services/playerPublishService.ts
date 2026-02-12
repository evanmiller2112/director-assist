/**
 * Player Publish Service (Issue #445)
 *
 * This service manages the player data publishing workflow:
 * - Calls buildPlayerExport() to get player-visible entities
 * - Downloads the export as player_data.json
 * - Tracks last published timestamp in localStorage
 * - Calculates publish freshness (fresh/stale/expired/never)
 *
 * Features:
 * - localStorage timestamp tracking for "last published"
 * - SSR-safe operations
 * - Days since publish calculation
 * - Freshness classification (fresh/stale/expired/never)
 * - Publish download with JSON blob
 */

import { buildPlayerExport } from './playerExportService';
import type { PlayerExport } from '$lib/types/playerExport';

// localStorage key
const LAST_PUBLISHED_AT_KEY = 'dm-assist-last-player-published-at';

/**
 * Publish freshness states
 */
export type PublishFreshness = 'fresh' | 'stale' | 'expired' | 'never';

/**
 * Result from publishing player data
 */
export interface PublishResult {
	publishedAt: Date;
	entityCount: number;
	typeCount: number;
}

/**
 * Get the last published date from localStorage.
 * Returns null if not set, in SSR context, or on error.
 */
export function getLastPublishedAt(): Date | null {
	// Handle SSR
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const stored = localStorage.getItem(LAST_PUBLISHED_AT_KEY);
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
 * Save the last published date to localStorage.
 * Handles SSR gracefully by doing nothing.
 */
export function setLastPublishedAt(date: Date): void {
	// Handle SSR
	if (typeof window === 'undefined') {
		return;
	}

	try {
		localStorage.setItem(LAST_PUBLISHED_AT_KEY, date.toISOString());
	} catch (error) {
		// Silently handle errors
	}
}

/**
 * Calculate days since publish.
 * Returns null if lastPublishedAt is null.
 */
export function getDaysSincePublish(lastPublishedAt: Date | null): number | null {
	if (lastPublishedAt === null) {
		return null;
	}

	const now = Date.now();
	const publishTime = lastPublishedAt.getTime();
	const diffMs = now - publishTime;
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	return diffDays;
}

/**
 * Get the freshness classification for a publish.
 *
 * Classification:
 * - null → 'never' (never published)
 * - 0 → 'fresh' (today/less than 24 hours)
 * - 1-7 → 'stale' (within last week)
 * - >7 → 'expired' (more than a week old)
 * - negative → 'fresh' (future dates, treated as current)
 */
export function getPublishFreshness(daysSincePublish: number | null): PublishFreshness {
	if (daysSincePublish === null) {
		return 'never';
	}

	if (daysSincePublish <= 0) {
		return 'fresh';
	}

	if (daysSincePublish <= 7) {
		return 'stale';
	}

	return 'expired';
}

/**
 * Publish player data by building export, creating JSON blob, and triggering download.
 * Sets lastPublishedAt timestamp and returns counts.
 *
 * @throws Error if buildPlayerExport fails
 */
export async function publishPlayerData(): Promise<PublishResult> {
	// Build the player export
	const playerExport: PlayerExport = await buildPlayerExport();

	// Create JSON blob
	const jsonData = JSON.stringify(playerExport, null, 2);
	const blob = new Blob([jsonData], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	// Trigger download
	const a = document.createElement('a');
	a.href = url;
	a.download = 'player_data.json';
	a.click();

	// Cleanup
	URL.revokeObjectURL(url);

	// Set last published timestamp
	const publishedAt = new Date();
	setLastPublishedAt(publishedAt);

	// Calculate counts
	const entityCount = playerExport.entities.length;
	const uniqueTypes = new Set(playerExport.entities.map((e) => e.type));
	const typeCount = uniqueTypes.size;

	return {
		publishedAt,
		entityCount,
		typeCount
	};
}
