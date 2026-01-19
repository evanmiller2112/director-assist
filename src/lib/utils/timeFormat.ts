/**
 * Time Formatting Utilities
 *
 * Issue #62 & #134: Relationship Context UI with Cache Status
 *
 * Provides human-readable relative time formatting for displaying cache age.
 */

/**
 * Formats a timestamp as a human-readable relative time string
 * @param timestamp - Date, timestamp number, or ISO string
 * @returns Human-readable relative time (e.g., "2 hours ago", "just now")
 */
export function formatRelativeTime(timestamp: Date | number | string): string {
	// Convert input to Date object
	const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
	const now = new Date();

	// Calculate difference in seconds
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);

	// Handle future dates or just now (< 60 seconds)
	if (diffSeconds < 60) {
		return 'just now';
	}

	// Minutes ago (< 60 minutes)
	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) {
		return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
	}

	// Hours ago (< 24 hours)
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
	}

	// Days ago (< 7 days)
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) {
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
	}

	// 7 days or older: format as date
	const isCurrentYear = date.getFullYear() === now.getFullYear();

	if (isCurrentYear) {
		// Same year: "Jan 13" format
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	} else {
		// Different year: "Jan 13, 2023" format
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
}
