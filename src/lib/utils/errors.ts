/**
 * Extract a human-readable error message from an unknown error value.
 * Used throughout the codebase to safely handle catch block errors.
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return 'An unknown error occurred';
}
