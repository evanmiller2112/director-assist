/**
 * Integrity Check Store (Issue #511)
 *
 * Svelte 5 runes-based store that manages the full lifecycle of a database
 * integrity check: running the check, exposing its result, and driving the
 * UI state (warning banner vs. recovery dialog).
 */

import { db } from '$lib/db';
import { runIntegrityCheck } from '$lib/services/dbIntegrityCheckService';
import { repairDatabase, resetDatabase } from '$lib/services/dbRecoveryService';
import type { IntegrityCheckResult } from '$lib/types/dbIntegrity';

class IntegrityCheckStore {
	result = $state<IntegrityCheckResult | null>(null);
	isChecking = $state(false);
	showWarning = $state(false);
	showRecoveryDialog = $state(false);

	/**
	 * Run a full integrity check against the database.
	 * Sets UI flags based on the severity of issues found.
	 * Gracefully handles service errors without throwing.
	 */
	async runCheck(): Promise<void> {
		this.isChecking = true;

		try {
			const result = await runIntegrityCheck(db);
			this.result = result;

			if (result.hasMajorIssues) {
				// Major issues take priority — show the recovery dialog, not just the banner
				this.showRecoveryDialog = true;
				this.showWarning = false;
			} else if (result.hasMinorIssues) {
				this.showWarning = true;
			}
		} catch {
			// Swallow errors — integrity check failure should not crash the app
		} finally {
			this.isChecking = false;
		}
	}

	/**
	 * Dismiss the minor-issue warning banner without touching other state.
	 */
	dismissWarning(): void {
		this.showWarning = false;
	}

	/**
	 * Open the recovery dialog (e.g. from the warning banner's "View Details" action).
	 */
	openRecoveryDialog(): void {
		this.showRecoveryDialog = true;
	}

	/**
	 * Close the recovery dialog without performing any recovery action.
	 */
	closeRecoveryDialog(): void {
		this.showRecoveryDialog = false;
	}

	/**
	 * Attempt automatic repair of detected issues.
	 * Closes the recovery dialog on success.
	 * Gracefully handles service errors without throwing.
	 */
	async repair(): Promise<void> {
		this.isChecking = true;

		try {
			const issues = this.result?.issues ?? [];
			await repairDatabase(db, issues);
			this.showRecoveryDialog = false;
		} catch {
			// Repair failure is surfaced via notifications or left to the caller
		} finally {
			this.isChecking = false;
		}
	}

	/**
	 * Reset the entire database (destructive).
	 * Clears the stored result and closes the dialog on success.
	 * Gracefully handles service errors without throwing.
	 */
	async reset(): Promise<void> {
		this.isChecking = true;

		try {
			await resetDatabase(db);
			this.result = null;
			this.showRecoveryDialog = false;
		} catch {
			// Reset failure is left to the caller to handle
		} finally {
			this.isChecking = false;
		}
	}
}

export const integrityCheckStore = new IntegrityCheckStore();
