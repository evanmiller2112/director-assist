/**
 * Database Integrity Scheduler (Issue #511)
 *
 * Schedules integrity checks to run asynchronously in the background
 * using requestIdleCallback when available, falling back to setTimeout.
 */

import type { IntegrityCheckResult } from '$lib/types';

/**
 * Schedule an integrity check to run asynchronously in the background
 *
 * @param checkFn - Function that performs the integrity check
 * @param onResult - Callback for successful check result
 * @param onError - Callback for check errors
 * @returns Cleanup function to cancel the scheduled check
 */
export function scheduleIntegrityCheck(
	checkFn: () => Promise<IntegrityCheckResult>,
	onResult: (result: IntegrityCheckResult) => void,
	onError: (error: Error) => void
): () => void {
	let cancelled = false;
	let scheduledId: number | undefined;

	// Define the check execution function
	const executeCheck = async () => {
		if (cancelled) {
			return;
		}

		try {
			const result = await checkFn();
			if (!cancelled) {
				onResult(result);
			}
		} catch (error) {
			if (!cancelled) {
				onError(error as Error);
			}
		}
	};

	// Use requestIdleCallback if available, otherwise fall back to setTimeout
	if (typeof window !== 'undefined' && window.requestIdleCallback) {
		scheduledId = window.requestIdleCallback(() => {
			executeCheck();
		});
	} else {
		scheduledId = setTimeout(() => {
			executeCheck();
		}, 0) as unknown as number;
	}

	// Return cleanup function
	return () => {
		cancelled = true;

		if (scheduledId !== undefined) {
			if (typeof window !== 'undefined' && window.cancelIdleCallback) {
				window.cancelIdleCallback(scheduledId);
			} else {
				clearTimeout(scheduledId);
			}
		}
	};
}
