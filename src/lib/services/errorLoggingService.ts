/**
 * Error Logging Service
 *
 * Issue #508: Add error boundaries and custom error page
 *
 * Provides centralized error logging with context and formatting.
 * Used by error boundaries, error pages, and hooks to log errors consistently.
 */

export interface ErrorLogEntry {
	message: string;
	error: unknown;
	context?: string;
	route?: string;
	timestamp: Date;
}

/**
 * Logs an error to the console with context information.
 *
 * @param entry - Error log entry (timestamp will be added automatically)
 */
export function logError(entry: Omit<ErrorLogEntry, 'timestamp'>): void {
	const fullEntry: ErrorLogEntry = { ...entry, timestamp: new Date() };
	console.error(`[${fullEntry.context ?? 'app'}]`, fullEntry.message, fullEntry.error);
}

/**
 * Formats an error into a user-friendly message string.
 *
 * @param error - The error to format (can be Error, string, or unknown)
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return 'An unexpected error occurred';
}
