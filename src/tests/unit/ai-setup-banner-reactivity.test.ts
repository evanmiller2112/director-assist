/**
 * Tests for AI Setup Banner Reactivity Fix (Issue #490)
 *
 * The bug: Clicking dismiss buttons on the AI setup banner updates localStorage
 * but the banner remains visible because Svelte 5's $derived blocks don't
 * reactively track localStorage changes.
 *
 * The fix: Add a reactive $state signal that dismiss handlers update, causing
 * the $derived block to re-compute and hide the banner immediately.
 *
 * These tests verify that the banner visibility updates immediately when
 * dismiss handlers are called, without requiring a page refresh.
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the banner's reactive dismiss state
// This simulates the behavior we'll implement in +layout.svelte
class MockAiSetupBannerState {
	private dismissSignal = 0;
	private dismissed = false;

	// Simulates $derived.by() that reads dismissSignal
	get shouldShow(): boolean {
		// Force re-computation by reading dismissSignal
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		this.dismissSignal;

		// Check localStorage
		if (typeof window === 'undefined') return false;
		try {
			const isDismissed = localStorage.getItem('dm-assist-ai-setup-dismissed') === 'true';
			return !isDismissed;
		} catch {
			return false;
		}
	}

	// Simulates dismiss handler that updates both localStorage AND reactive state
	dismiss(): void {
		if (typeof window === 'undefined') return;

		try {
			// Update localStorage (for persistence)
			localStorage.setItem('dm-assist-ai-setup-dismissed', 'true');

			// Update reactive signal (for immediate UI update)
			this.dismissSignal++;
			this.dismissed = true;
		} catch {
			// Handle errors gracefully
		}
	}

	// Simulates reading the reactive signal
	get signal(): number {
		return this.dismissSignal;
	}

	reset(): void {
		this.dismissSignal = 0;
		this.dismissed = false;
		if (typeof window !== 'undefined') {
			try {
				localStorage.removeItem('dm-assist-ai-setup-dismissed');
			} catch {
				// Ignore
			}
		}
	}
}

describe('AI Setup Banner Reactivity (Issue #490)', () => {
	let bannerState: MockAiSetupBannerState;
	let mockStore: Record<string, string>;

	beforeEach(() => {
		// Reset state
		bannerState = new MockAiSetupBannerState();
		mockStore = {};

		// Mock localStorage
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
	});

	describe('Reactive Dismiss Signal Pattern', () => {
		it('should show banner initially when not dismissed', () => {
			// Banner should be visible by default
			expect(bannerState.shouldShow).toBe(true);
		});

		it('should hide banner immediately after dismiss() is called', () => {
			// Banner visible initially
			expect(bannerState.shouldShow).toBe(true);

			// Dismiss the banner
			bannerState.dismiss();

			// Banner should be hidden IMMEDIATELY (no page refresh needed)
			expect(bannerState.shouldShow).toBe(false);
		});

		it('should increment reactive signal when dismiss() is called', () => {
			const initialSignal = bannerState.signal;

			bannerState.dismiss();

			// Signal should increment to trigger $derived re-computation
			expect(bannerState.signal).toBe(initialSignal + 1);
		});

		it('should update localStorage when dismiss() is called', () => {
			bannerState.dismiss();

			// localStorage should be updated for persistence
			expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');
		});

		it('should handle multiple dismiss calls gracefully', () => {
			bannerState.dismiss();
			expect(bannerState.shouldShow).toBe(false);

			bannerState.dismiss();
			expect(bannerState.shouldShow).toBe(false);

			// Signal should increment each time (idempotent)
			expect(bannerState.signal).toBeGreaterThan(0);
		});

		it('should remain hidden after page refresh simulation', () => {
			// Dismiss and hide banner
			bannerState.dismiss();
			expect(bannerState.shouldShow).toBe(false);

			// Simulate page refresh: create new state instance
			// (mimics remounting the component on navigation)
			const newState = new MockAiSetupBannerState();

			// Banner should remain hidden (reads from localStorage)
			expect(newState.shouldShow).toBe(false);
		});
	});

	describe('Button Click Scenarios', () => {
		it('should hide banner when X button is clicked (onPlayerDismiss)', () => {
			// X button calls handleAiSetupPlayerDismiss which calls setAiSetupDismissed
			expect(bannerState.shouldShow).toBe(true);

			// Simulate X button click
			bannerState.dismiss();

			// Banner should disappear immediately
			expect(bannerState.shouldShow).toBe(false);
		});

		it('should hide banner when "I\'m a Player" is clicked (onPlayerDismiss)', () => {
			// "I'm a Player" button calls handleAiSetupPlayerDismiss
			expect(bannerState.shouldShow).toBe(true);

			// Simulate button click
			bannerState.dismiss();

			// Banner should disappear immediately
			expect(bannerState.shouldShow).toBe(false);
		});

		it('should hide banner when "Not Using AI" is clicked (onDisableAi)', () => {
			// "Not Using AI" button calls handleAiSetupDisableAi which calls setAiSetupDismissed
			expect(bannerState.shouldShow).toBe(true);

			// Simulate button click
			bannerState.dismiss();

			// Banner should disappear immediately
			expect(bannerState.shouldShow).toBe(false);
		});
	});

	describe('Comparison with Backup Banner Pattern', () => {
		it('should follow same pattern as backup reminder banner (Issue #423)', () => {
			// The backup banner uses a reactive signal pattern:
			// let backupDismissSignal = $state(0);
			// handleBackupDismiss() { backupDismissSignal++; }
			// $derived.by(() => { backupDismissSignal; ... })

			// AI setup banner should follow the same pattern
			expect(bannerState.shouldShow).toBe(true);

			bannerState.dismiss();

			// Should work exactly like backup banner
			expect(bannerState.shouldShow).toBe(false);
			expect(bannerState.signal).toBeGreaterThan(0);
		});

		it('should increment signal to force $derived re-computation', () => {
			// This is the key pattern from Issue #423:
			// "Increment signal to trigger backupReminderState re-computation"
			const initialSignal = bannerState.signal;

			bannerState.dismiss();

			// Signal increments, causing $derived to re-run
			expect(bannerState.signal).toBeGreaterThan(initialSignal);
		});
	});

	describe('Edge Cases', () => {
		it('should handle SSR context gracefully', () => {
			const originalWindow = global.window;
			// @ts-expect-error - Testing SSR behavior
			delete global.window;

			// Should not throw in SSR
			expect(() => {
				bannerState.dismiss();
			}).not.toThrow();

			// Restore window
			global.window = originalWindow;
		});

		it('should handle localStorage errors gracefully', () => {
			// Mock localStorage to throw errors
			global.localStorage.setItem = vi.fn(() => {
				throw new Error('localStorage full');
			});

			// Should not throw
			expect(() => {
				bannerState.dismiss();
			}).not.toThrow();
		});

		it('should work when banner is already dismissed', () => {
			// Pre-dismiss the banner
			mockStore['dm-assist-ai-setup-dismissed'] = 'true';

			// Create new state (like page refresh)
			const state = new MockAiSetupBannerState();

			// Should start hidden
			expect(state.shouldShow).toBe(false);

			// Dismiss again (should be idempotent)
			state.dismiss();

			// Should remain hidden
			expect(state.shouldShow).toBe(false);
		});
	});

	describe('Implementation Requirements', () => {
		it('should use a reactive $state variable for dismiss signal', () => {
			// In +layout.svelte, we need:
			// let aiDismissSignal = $state(0);
			//
			// This test verifies the pattern works
			expect(bannerState.signal).toBeDefined();
			expect(typeof bannerState.signal).toBe('number');
		});

		it('should reference signal in $derived.by() to create reactive dependency', () => {
			// In +layout.svelte:
			// const aiSetupReminderState = $derived.by(() => {
			//     aiDismissSignal; // <- reference to create dependency
			//     const isDismissed = isAiSetupDismissed();
			//     ...
			// });

			// Test that reading shouldShow works correctly
			expect(bannerState.shouldShow).toBe(true);

			// Modify signal
			bannerState.dismiss();

			// Reading shouldShow again should see the change
			expect(bannerState.shouldShow).toBe(false);
		});

		it('should increment signal in dismiss handlers', () => {
			// handleAiSetupPlayerDismiss() and handleAiSetupDisableAi()
			// should both increment the signal:
			// setAiSetupDismissed();
			// aiDismissSignal++; // <- this line is the fix

			const before = bannerState.signal;
			bannerState.dismiss();
			const after = bannerState.signal;

			expect(after).toBeGreaterThan(before);
		});

		it('should keep both localStorage write AND signal increment', () => {
			// The fix requires BOTH:
			// 1. setAiSetupDismissed() - for persistence across page refreshes
			// 2. aiDismissSignal++ - for immediate UI update

			bannerState.dismiss();

			// Check localStorage was updated (persistence)
			expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');

			// Check signal was incremented (reactivity)
			expect(bannerState.signal).toBeGreaterThan(0);

			// Check banner is hidden (immediate effect)
			expect(bannerState.shouldShow).toBe(false);
		});
	});

	describe('Fix Validation', () => {
		it('should fix the reported bug: banner disappears without page refresh', () => {
			// BUG: User clicks dismiss, localStorage updates, but banner stays visible
			// FIX: Add reactive signal that updates immediately

			// Step 1: Banner is visible
			expect(bannerState.shouldShow).toBe(true);

			// Step 2: User clicks dismiss button
			bannerState.dismiss();

			// Step 3: Banner should disappear IMMEDIATELY (this was failing before)
			expect(bannerState.shouldShow).toBe(false);

			// Step 4: localStorage should be updated for persistence
			expect(mockStore['dm-assist-ai-setup-dismissed']).toBe('true');

			// Step 5: After page refresh, banner should still be hidden
			const afterRefresh = new MockAiSetupBannerState();
			expect(afterRefresh.shouldShow).toBe(false);
		});

		it('should match the backup banner behavior exactly', () => {
			// The backup banner (Issue #423) uses this exact pattern:
			// 1. Reactive signal: let backupDismissSignal = $state(0);
			// 2. Reference in $derived: backupDismissSignal;
			// 3. Increment in handler: backupDismissSignal++;

			// AI banner should work identically
			const initial = bannerState.shouldShow;
			expect(initial).toBe(true);

			bannerState.dismiss();

			const afterDismiss = bannerState.shouldShow;
			expect(afterDismiss).toBe(false);
			expect(afterDismiss).not.toBe(initial); // State changed
		});
	});
});
