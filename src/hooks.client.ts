/**
 * SvelteKit Client Hooks
 *
 * Issue #508: Add error boundaries and custom error page
 *
 * Handles unhandled client-side errors globally and logs them
 * for debugging while showing user-friendly error messages.
 */

import type { HandleClientError } from '@sveltejs/kit';
import { logError } from '$lib/services/errorLoggingService';

export const handleError: HandleClientError = ({ error, status, message }) => {
	logError({
		message: message ?? 'Unhandled client error',
		error,
		context: 'sveltekit-client'
	});

	return {
		message: message ?? 'Something went wrong'
	};
};
