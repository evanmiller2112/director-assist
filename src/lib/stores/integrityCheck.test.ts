/**
 * Tests for Integrity Check Store (Issue #511)
 *
 * This Svelte 5 runes-based store manages the full lifecycle of a database
 * integrity check: running the check, exposing its result, and driving the
 * UI state (warning banner vs. recovery dialog).
 *
 * Testing Strategy:
 * - Initial state (all fields at their zero values)
 * - runCheck() sets isChecking, resolves result, clears isChecking
 * - runCheck() sets showWarning for minor-only results
 * - runCheck() sets showRecoveryDialog for results with major issues
 * - runCheck() leaves UI flags clear when no issues are found
 * - runCheck() handles service errors gracefully
 * - dismissWarning() clears showWarning without touching other state
 * - openRecoveryDialog() / closeRecoveryDialog() manage showRecoveryDialog
 * - repair() delegates to repairDatabase and updates state on success/error
 * - reset() delegates to resetDatabase and updates state on success/error
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IntegrityCheckResult, IntegrityIssue } from '$lib/types/dbIntegrity';

// ---------------------------------------------------------------------------
// Service mocks — declared before the dynamic import so vi.mock hoisting works
// ---------------------------------------------------------------------------

vi.mock('$lib/services/dbIntegrityCheckService', () => ({
	runIntegrityCheck: vi.fn()
}));

vi.mock('$lib/services/dbRecoveryService', () => ({
	repairDatabase: vi.fn(),
	resetDatabase: vi.fn()
}));

import { runIntegrityCheck } from '$lib/services/dbIntegrityCheckService';
import { repairDatabase, resetDatabase } from '$lib/services/dbRecoveryService';

// ---------------------------------------------------------------------------
// Shared test factories
// ---------------------------------------------------------------------------

function makeMinorIssue(overrides: Partial<IntegrityIssue> = {}): IntegrityIssue {
	return {
		type: 'active_campaign',
		severity: 'minor',
		message: 'No active campaign set but campaigns exist',
		...overrides
	};
}

function makeMajorIssue(overrides: Partial<IntegrityIssue> = {}): IntegrityIssue {
	return {
		type: 'table_existence',
		severity: 'major',
		message: 'Expected table "entities" is missing from database',
		...overrides
	};
}

function makeCheckResult(overrides: Partial<IntegrityCheckResult> = {}): IntegrityCheckResult {
	const issues = overrides.issues ?? [];
	return {
		completed: true,
		checkedAt: new Date(),
		durationMs: 42,
		issues,
		skipped: false,
		hasMinorIssues: issues.some((i) => i.severity === 'minor'),
		hasMajorIssues: issues.some((i) => i.severity === 'major'),
		...overrides
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('integrityCheckStore', () => {
	let store: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		// Re-apply mocks after module reset so the fresh store import picks them up
		vi.mock('$lib/services/dbIntegrityCheckService', () => ({
			runIntegrityCheck: vi.fn()
		}));
		vi.mock('$lib/services/dbRecoveryService', () => ({
			repairDatabase: vi.fn(),
			resetDatabase: vi.fn()
		}));

		const module = await import('./integrityCheck.svelte');
		store = module.integrityCheckStore;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// -------------------------------------------------------------------------
	// Store shape
	// -------------------------------------------------------------------------

	describe('Store Structure', () => {
		it('should expose a result property', () => {
			expect(store).toHaveProperty('result');
		});

		it('should expose an isChecking property', () => {
			expect(store).toHaveProperty('isChecking');
		});

		it('should expose a showWarning property', () => {
			expect(store).toHaveProperty('showWarning');
		});

		it('should expose a showRecoveryDialog property', () => {
			expect(store).toHaveProperty('showRecoveryDialog');
		});

		it('should expose a runCheck method', () => {
			expect(typeof store.runCheck).toBe('function');
		});

		it('should expose a dismissWarning method', () => {
			expect(typeof store.dismissWarning).toBe('function');
		});

		it('should expose an openRecoveryDialog method', () => {
			expect(typeof store.openRecoveryDialog).toBe('function');
		});

		it('should expose a closeRecoveryDialog method', () => {
			expect(typeof store.closeRecoveryDialog).toBe('function');
		});

		it('should expose a repair method', () => {
			expect(typeof store.repair).toBe('function');
		});

		it('should expose a reset method', () => {
			expect(typeof store.reset).toBe('function');
		});
	});

	// -------------------------------------------------------------------------
	// Initial state
	// -------------------------------------------------------------------------

	describe('Initial State', () => {
		it('should initialise result as null', () => {
			expect(store.result).toBeNull();
		});

		it('should initialise isChecking as false', () => {
			expect(store.isChecking).toBe(false);
		});

		it('should initialise showWarning as false', () => {
			expect(store.showWarning).toBe(false);
		});

		it('should initialise showRecoveryDialog as false', () => {
			expect(store.showRecoveryDialog).toBe(false);
		});
	});

	// -------------------------------------------------------------------------
	// runCheck()
	// -------------------------------------------------------------------------

	describe('runCheck()', () => {
		it('should call runIntegrityCheck when invoked', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(makeCheckResult());

			await store.runCheck();

			expect(runIntegrityCheck).toHaveBeenCalledTimes(1);
		});

		it('should store the result returned by the service', async () => {
			const result = makeCheckResult({ issues: [] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.result).toEqual(result);
		});

		it('should set isChecking to true while the check is in progress', async () => {
			let resolveCheck!: (r: IntegrityCheckResult) => void;
			vi.mocked(runIntegrityCheck).mockReturnValueOnce(
				new Promise<IntegrityCheckResult>((resolve) => {
					resolveCheck = resolve;
				})
			);

			const checkPromise = store.runCheck();
			expect(store.isChecking).toBe(true);

			resolveCheck(makeCheckResult());
			await checkPromise;
		});

		it('should set isChecking back to false after the check completes', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(makeCheckResult());

			await store.runCheck();

			expect(store.isChecking).toBe(false);
		});

		it('should set isChecking back to false when the service throws', async () => {
			vi.mocked(runIntegrityCheck).mockRejectedValueOnce(new Error('DB unavailable'));

			await store.runCheck();

			expect(store.isChecking).toBe(false);
		});

		it('should not throw when the service rejects', async () => {
			vi.mocked(runIntegrityCheck).mockRejectedValueOnce(new Error('unexpected'));

			await expect(store.runCheck()).resolves.not.toThrow();
		});

		// --- UI-flag logic after check ---

		it('should set showWarning when result has only minor issues', async () => {
			const result = makeCheckResult({ issues: [makeMinorIssue()] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showWarning).toBe(true);
			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should set showRecoveryDialog when result has major issues', async () => {
			const result = makeCheckResult({ issues: [makeMajorIssue()] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showRecoveryDialog).toBe(true);
		});

		it('should not set showWarning when result has major issues', async () => {
			const result = makeCheckResult({ issues: [makeMajorIssue()] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showWarning).toBe(false);
		});

		it('should set showRecoveryDialog when result has both minor and major issues', async () => {
			const result = makeCheckResult({
				issues: [makeMinorIssue(), makeMajorIssue()]
			});
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showRecoveryDialog).toBe(true);
		});

		it('should leave both UI flags false when there are no issues', async () => {
			const result = makeCheckResult({ issues: [] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showWarning).toBe(false);
			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should leave both UI flags false when the check was skipped', async () => {
			const result = makeCheckResult({ skipped: true, issues: [] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);

			await store.runCheck();

			expect(store.showWarning).toBe(false);
			expect(store.showRecoveryDialog).toBe(false);
		});
	});

	// -------------------------------------------------------------------------
	// dismissWarning()
	// -------------------------------------------------------------------------

	describe('dismissWarning()', () => {
		it('should set showWarning to false', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMinorIssue()] })
			);
			await store.runCheck();
			expect(store.showWarning).toBe(true);

			store.dismissWarning();

			expect(store.showWarning).toBe(false);
		});

		it('should not affect result', async () => {
			const result = makeCheckResult({ issues: [makeMinorIssue()] });
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(result);
			await store.runCheck();

			store.dismissWarning();

			expect(store.result).toEqual(result);
		});

		it('should not affect showRecoveryDialog', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			await store.runCheck();
			expect(store.showRecoveryDialog).toBe(true);

			store.dismissWarning();

			expect(store.showRecoveryDialog).toBe(true);
		});

		it('should be safe to call when showWarning is already false', () => {
			expect(() => store.dismissWarning()).not.toThrow();
			expect(store.showWarning).toBe(false);
		});
	});

	// -------------------------------------------------------------------------
	// openRecoveryDialog() / closeRecoveryDialog()
	// -------------------------------------------------------------------------

	describe('openRecoveryDialog()', () => {
		it('should set showRecoveryDialog to true', () => {
			store.openRecoveryDialog();

			expect(store.showRecoveryDialog).toBe(true);
		});

		it('should be safe to call multiple times', () => {
			store.openRecoveryDialog();
			store.openRecoveryDialog();

			expect(store.showRecoveryDialog).toBe(true);
		});
	});

	describe('closeRecoveryDialog()', () => {
		it('should set showRecoveryDialog to false', () => {
			store.openRecoveryDialog();
			store.closeRecoveryDialog();

			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should be safe to call when dialog is already closed', () => {
			expect(() => store.closeRecoveryDialog()).not.toThrow();
			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should not affect showWarning', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMinorIssue()] })
			);
			await store.runCheck();
			store.openRecoveryDialog();

			store.closeRecoveryDialog();

			expect(store.showWarning).toBe(true);
		});
	});

	// -------------------------------------------------------------------------
	// repair()
	// -------------------------------------------------------------------------

	describe('repair()', () => {
		it('should call repairDatabase with the current issues', async () => {
			const issues = [makeMinorIssue()];
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(makeCheckResult({ issues }));
			vi.mocked(repairDatabase).mockResolvedValueOnce(1);
			await store.runCheck();

			await store.repair();

			expect(repairDatabase).toHaveBeenCalledWith(expect.anything(), issues);
		});

		it('should close the recovery dialog on success', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			vi.mocked(repairDatabase).mockResolvedValueOnce(1);
			await store.runCheck();

			await store.repair();

			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should not throw when repairDatabase rejects', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			vi.mocked(repairDatabase).mockRejectedValueOnce(new Error('repair failed'));
			await store.runCheck();

			await expect(store.repair()).resolves.not.toThrow();
		});

		it('should set isChecking to false after repair even on error', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			vi.mocked(repairDatabase).mockRejectedValueOnce(new Error('oops'));
			await store.runCheck();

			await store.repair();

			expect(store.isChecking).toBe(false);
		});
	});

	// -------------------------------------------------------------------------
	// reset()
	// -------------------------------------------------------------------------

	describe('reset()', () => {
		it('should call resetDatabase', async () => {
			vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);

			await store.reset();

			expect(resetDatabase).toHaveBeenCalledTimes(1);
		});

		it('should clear the result after successful reset', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);
			await store.runCheck();
			expect(store.result).not.toBeNull();

			await store.reset();

			expect(store.result).toBeNull();
		});

		it('should close the recovery dialog after successful reset', async () => {
			vi.mocked(runIntegrityCheck).mockResolvedValueOnce(
				makeCheckResult({ issues: [makeMajorIssue()] })
			);
			vi.mocked(resetDatabase).mockResolvedValueOnce(undefined);
			await store.runCheck();

			await store.reset();

			expect(store.showRecoveryDialog).toBe(false);
		});

		it('should not throw when resetDatabase rejects', async () => {
			vi.mocked(resetDatabase).mockRejectedValueOnce(new Error('reset failed'));

			await expect(store.reset()).resolves.not.toThrow();
		});

		it('should set isChecking to false after reset even on error', async () => {
			vi.mocked(resetDatabase).mockRejectedValueOnce(new Error('oops'));

			await store.reset();

			expect(store.isChecking).toBe(false);
		});
	});
});
