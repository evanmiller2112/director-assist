/**
 * Integration Tests for Backup Reminder Layout Reactivity (Issue #423)
 *
 * This test file tests the ACTUAL UI behavior in +layout.svelte to verify
 * that the banner dismisses correctly when the user clicks the dismiss button.
 *
 * The Bug:
 * - User clicks "Remind Me Later" or X button
 * - handleBackupDismiss() writes to localStorage
 * - Banner stays visible (doesn't disappear)
 * - Root cause: backupReminderState uses $derived.by() that reads localStorage
 * - localStorage reads aren't reactive in Svelte 5
 *
 * Expected Behavior After Fix:
 * - User clicks dismiss button
 * - handleBackupDismiss() writes to localStorage AND increments a reactive signal
 * - backupReminderState re-computes because the signal changed
 * - Banner disappears from UI
 *
 * These tests verify the EXPECTED behavior and should FAIL initially (RED phase).
 * The senior-web-architect will implement the fix to make them pass (GREEN phase).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';

// Component to test the reactive behavior
import TestLayoutReactivity from './fixtures/TestLayoutReactivity.svelte';

// Services
import {
	setLastBackupPromptDismissedAt,
	getLastBackupPromptDismissedAt,
	shouldShowBackupReminder
} from '$lib/services/backupReminderService';

// Mock localStorage
let mockStore: Record<string, string>;
let originalLocalStorage: Storage;

function setupLocalStorageMock() {
	mockStore = {};
	originalLocalStorage = global.localStorage;

	global.localStorage = {
		getItem: vi.fn((key: string) => mockStore[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			mockStore[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete mockStore[key];
		}),
		clear: vi.fn(() => {
			Object.keys(mockStore).forEach((key) => delete mockStore[key]);
		}),
		length: 0,
		key: vi.fn()
	} as Storage;
}

function restoreLocalStorage() {
	global.localStorage = originalLocalStorage;
}

describe('Layout Backup Reminder Reactivity (Issue #423)', () => {
	beforeEach(() => {
		setupLocalStorageMock();
		vi.clearAllMocks();
	});

	afterEach(() => {
		restoreLocalStorage();
	});

	describe('Banner visibility reactivity', () => {
		it('should show banner initially when conditions are met', async () => {
			// Render test component that simulates +layout.svelte behavior
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Banner should be visible initially (milestone reminder: 10 entities, last milestone 5)
			const banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();
		});

		it('should NOT show banner initially when dismissed recently', async () => {
			// Dismiss the banner before rendering
			setLastBackupPromptDismissedAt(new Date());

			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Banner should NOT be visible (dismissed within 24 hours)
			const banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).not.toBeInTheDocument();
		});
	});

	describe('Dismiss button reactivity (THE BUG)', () => {
		it('should hide banner when dismiss button is clicked', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Verify banner is visible initially
			let banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();

			// Find and click the dismiss button
			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			expect(dismissButton).toBeInTheDocument();

			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			// Wait for Svelte reactivity to update
			await tick();
			await waitFor(() => {
				banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });

			// THIS TEST WILL FAIL in RED phase because banner stays visible
		});

		it('should write dismiss timestamp to localStorage when button is clicked', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Initially no dismiss timestamp
			let dismissedAt = getLastBackupPromptDismissedAt();
			expect(dismissedAt).toBeNull();

			// Click dismiss button
			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			// Dismiss timestamp should be set
			dismissedAt = getLastBackupPromptDismissedAt();
			expect(dismissedAt).not.toBeNull();

			// This part works - localStorage is updated
			// The problem is the UI doesn't react to this change
		});

		it('should trigger backupReminderState re-computation on dismiss', async () => {
			// Track how many times the state is computed
			let computationCount = 0;

			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5,
					onStateComputed: () => {
						computationCount++;
					}
				}
			});

			await tick();

			const initialCount = computationCount;
			expect(initialCount).toBeGreaterThan(0);

			// Click dismiss
			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			// After fix, computation count should increase (state re-computed)
			// In RED phase, this will FAIL because the state doesn't re-compute
			expect(computationCount).toBeGreaterThan(initialCount);
		});
	});

	describe('Close button (X) reactivity', () => {
		it('should hide banner when X button is clicked', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Verify banner is visible initially
			let banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();

			// Click the X close button
			const closeButton = container.querySelector('[data-testid="close-button"]');
			expect(closeButton).toBeInTheDocument();

			closeButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();
			await waitFor(() => {
				banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });

			// THIS TEST WILL FAIL in RED phase
		});

		it('should have same behavior for both dismiss buttons', async () => {
			// Test that both "Remind Me Later" and "X" trigger the same dismiss logic

			// Test with "Remind Me Later"
			const { container: container1, unmount: unmount1 } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			const dismissButton = container1.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			const dismissed1 = getLastBackupPromptDismissedAt();
			expect(dismissed1).not.toBeNull();

			unmount1();

			// Clear and test with X button
			mockStore = {};
			const { container: container2, unmount: unmount2 } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			const closeButton = container2.querySelector('[data-testid="close-button"]');
			closeButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			const dismissed2 = getLastBackupPromptDismissedAt();
			expect(dismissed2).not.toBeNull();

			unmount2();

			// Both should result in dismiss being recorded
			expect(dismissed1).not.toBeNull();
			expect(dismissed2).not.toBeNull();
		});
	});

	describe('Multiple dismiss interactions', () => {
		it('should handle rapid consecutive dismiss clicks', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');

			// Click multiple times rapidly
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			// Banner should be hidden (only needs one click)
			await waitFor(() => {
				const banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });
		});

		it('should stay hidden after dismiss', async () => {
			const { container, rerender } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5
				}
			});

			await tick();

			// Dismiss
			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();
			await waitFor(() => {
				const banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });

			// Re-render with same props (simulating reactive update)
			rerender({
				entityCount: 10,
				lastExportedAt: null,
				lastMilestoneReached: 5
			});

			await tick();

			// Should still be hidden
			const banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).not.toBeInTheDocument();
		});
	});

	describe('Different reminder types dismiss correctly', () => {
		it('should dismiss first-time reminder', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 5,
					lastExportedAt: null,
					lastMilestoneReached: 0
				}
			});

			await tick();

			let banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();

			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();
			await waitFor(() => {
				banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });
		});

		it('should dismiss milestone reminder', async () => {
			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 25,
					lastExportedAt: new Date(),
					lastMilestoneReached: 10
				}
			});

			await tick();

			let banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();

			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();
			await waitFor(() => {
				banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });
		});

		it('should dismiss time-based reminder', async () => {
			const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);

			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: eightDaysAgo,
					lastMilestoneReached: 10
				}
			});

			await tick();

			let banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).toBeInTheDocument();

			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();
			await waitFor(() => {
				banner = container.querySelector('[data-testid="backup-banner"]');
				expect(banner).not.toBeInTheDocument();
			}, { timeout: 1000 });
		});
	});

	describe('Verify the reactive fix mechanism', () => {
		it('should have a reactive signal that changes on dismiss', async () => {
			// This test verifies that the fix includes a reactive signal
			// that increments or changes when dismiss is called

			const { container } = render(TestLayoutReactivity, {
				props: {
					entityCount: 10,
					lastExportedAt: null,
					lastMilestoneReached: 5,
					exposeReactiveSignal: true
				}
			});

			await tick();

			// Get initial signal value (should be 0 or initial state)
			const initialSignal = container.querySelector('[data-testid="reactive-signal"]')?.textContent;
			expect(initialSignal).toBeDefined();

			// Click dismiss
			const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
			dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

			await tick();

			// Signal should have changed (incremented)
			const afterDismissSignal = container.querySelector('[data-testid="reactive-signal"]')?.textContent;
			expect(afterDismissSignal).not.toBe(initialSignal);

			// This verifies the fix includes a reactive signal mechanism
		});
	});
});

describe('Backup Reminder - Real-world User Scenarios (Issue #423)', () => {
	beforeEach(() => {
		setupLocalStorageMock();
	});

	afterEach(() => {
		restoreLocalStorage();
	});

	it('User scenario: New user dismisses first backup reminder', async () => {
		// New user creates 5 entities
		const { container } = render(TestLayoutReactivity, {
			props: {
				entityCount: 5,
				lastExportedAt: null,
				lastMilestoneReached: 0
			}
		});

		await tick();

		// User sees first-time reminder
		let banner = container.querySelector('[data-testid="backup-banner"]');
		expect(banner).toBeInTheDocument();

		// User clicks "Remind Me Later" (wants to continue building campaign)
		const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
		dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

		await tick();

		// Banner should disappear immediately
		await waitFor(() => {
			banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).not.toBeInTheDocument();
		}, { timeout: 1000 });

		// User can continue working without the banner
		// Banner will reappear after 24 hours if still no backup
	});

	it('User scenario: User dismisses milestone reminder', async () => {
		// User has 25 entities, reached milestone
		const { container } = render(TestLayoutReactivity, {
			props: {
				entityCount: 25,
				lastExportedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
				lastMilestoneReached: 10
			}
		});

		await tick();

		// User sees milestone reminder (reached 25 entities)
		let banner = container.querySelector('[data-testid="backup-banner"]');
		expect(banner).toBeInTheDocument();

		// User clicks X to dismiss (busy right now)
		const closeButton = container.querySelector('[data-testid="close-button"]');
		closeButton?.dispatchEvent(new Event('click', { bubbles: true }));

		await tick();

		// Banner disappears
		await waitFor(() => {
			banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).not.toBeInTheDocument();
		}, { timeout: 1000 });
	});

	it('User scenario: User dismisses time-based reminder', async () => {
		// User last exported 10 days ago
		const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);

		const { container } = render(TestLayoutReactivity, {
			props: {
				entityCount: 15,
				lastExportedAt: tenDaysAgo,
				lastMilestoneReached: 10
			}
		});

		await tick();

		// User sees time-based reminder
		let banner = container.querySelector('[data-testid="backup-banner"]');
		expect(banner).toBeInTheDocument();

		// User dismisses (will backup later)
		const dismissButton = container.querySelector('[data-testid="dismiss-button"]');
		dismissButton?.dispatchEvent(new Event('click', { bubbles: true }));

		await tick();

		// Banner disappears
		await waitFor(() => {
			banner = container.querySelector('[data-testid="backup-banner"]');
			expect(banner).not.toBeInTheDocument();
		}, { timeout: 1000 });
	});
});
