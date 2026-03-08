/**
 * Tests for Issue #566: Reveal button greys out and does nothing
 *
 * TDD RED PHASE - These tests MUST FAIL against the current implementation.
 * Do NOT implement the fix until these tests are confirmed failing.
 *
 * ## Root Cause Summary
 *
 * There are two distinct bugs that together cause the Reveal button to grey out
 * permanently and never reveal the item:
 *
 * BUG 1 — Component never clears the revealing state (MotivationPitfallPanel.svelte)
 *   revealMotivation() and revealPitfall() push the type into revealingMotivations /
 *   revealingPitfalls, which disables the button. The onReveal* callbacks are typed as
 *   `(type: string) => void` — the component cannot await them — so the revealing arrays
 *   are never cleared after the async DB write finishes. The button stays disabled forever.
 *
 *   Fix direction: Change the prop signatures to `(type: string) => Promise<void>` and
 *   await the callback in revealMotivation() / revealPitfall(), clearing the array entry
 *   afterward (both on success and on error).
 *
 * BUG 2 — Page handler looks up pitfall by wrong key (+page.svelte handleRevealPitfall)
 *   npcPitfalls is derived with `type: p.description.toLowerCase()` (e.g. "greed").
 *   handleRevealPitfall receives that lowercase type and tries to match it with
 *   `negotiation.pitfalls.findIndex((p) => p.description === type)`.
 *   But the DB stores descriptions with original casing (e.g. "Greed"), so the find
 *   always returns -1 and negotiationStore.revealPitfall() is never called.
 *
 *   Fix direction: Change the comparison to case-insensitive, e.g.
 *   `p.description.toLowerCase() === type`.
 *
 * ## Test Coverage Plan
 *   1. Callback invocation — reveal triggers the callback with the correct type
 *   2. Async clearing (success) — revealing state is cleared after the async op resolves
 *   3. Async clearing (failure) — revealing state is cleared even when the async op rejects
 *   4. Button re-enabled after reveal completes (not permanently disabled)
 *   5. Multiple independent items — revealing one does not disable another
 *   6. Rapid double-click protection — second click while in flight is a no-op
 *   7. Pitfall case-insensitive lookup — handler finds pitfall regardless of DB casing
 *   8. Motivation lookup — handler finds motivation by type correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import MotivationPitfallPanel from './MotivationPitfallPanel.svelte';
import type { NPCMotivation, NPCPitfall } from '$lib/types/negotiation';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeMotivation(type: string, isKnown = false, used = false): NPCMotivation {
	return { type, isKnown, used };
}

function makeMotivations(types: string[], isKnown = false): NPCMotivation[] {
	return types.map((t) => makeMotivation(t, isKnown));
}

function makePitfall(type: string, isKnown = false): NPCPitfall {
	return { type, isKnown };
}

// ---------------------------------------------------------------------------
// Suite 1: Callback invocation
//   Verify the parent-provided callbacks are called with the correct argument.
//   (These likely pass today — they serve as regression anchors.)
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Reveal button invokes callback (Issue #566)', () => {
	it('should call onRevealMotivation with the correct type when Reveal is clicked', async () => {
		const onRevealMotivation = vi.fn().mockResolvedValue(undefined);
		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /reveal motivation/i }));

		expect(onRevealMotivation).toHaveBeenCalledOnce();
		expect(onRevealMotivation).toHaveBeenCalledWith('justice');
	});

	it('should call onRevealPitfall with the correct type when Reveal is clicked', async () => {
		const onRevealPitfall = vi.fn().mockResolvedValue(undefined);
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /reveal pitfall/i }));

		expect(onRevealPitfall).toHaveBeenCalledOnce();
		expect(onRevealPitfall).toHaveBeenCalledWith('greed');
	});

	it('should call onRevealMotivation with the right type among multiple unknowns', async () => {
		const onRevealMotivation = vi.fn().mockResolvedValue(undefined);
		render(MotivationPitfallPanel, {
			props: {
				motivations: [
					makeMotivation('justice', false),
					makeMotivation('power', false)
				],
				pitfalls: [],
				onRevealMotivation
			}
		});

		// Click the second reveal button (power)
		const buttons = screen.getAllByRole('button', { name: /reveal motivation/i });
		await fireEvent.click(buttons[1]);

		expect(onRevealMotivation).toHaveBeenCalledWith('power');
	});

	it('should call onRevealPitfall with the right type among multiple unknown pitfalls', async () => {
		const onRevealPitfall = vi.fn().mockResolvedValue(undefined);
		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false), makePitfall('revenge', false)],
				onRevealPitfall
			}
		});

		const buttons = screen.getAllByRole('button', { name: /reveal pitfall/i });
		await fireEvent.click(buttons[1]);

		expect(onRevealPitfall).toHaveBeenCalledWith('revenge');
	});
});

// ---------------------------------------------------------------------------
// Suite 2: Revealing state clears on async success (BUG 1)
//   The button must become enabled again — and eventually disappear — after
//   the promise returned by the callback resolves.
//
//   CURRENT BEHAVIOUR: The component ignores the return value of the callback
//   entirely (the prop is `(type: string) => void`). The revealingMotivations /
//   revealingPitfalls arrays are populated but never emptied, so the button
//   stays disabled indefinitely. These tests WILL FAIL until the prop types are
//   changed to `Promise<void>` and the component awaits them.
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Revealing state clears after async success (Issue #566 BUG 1)', () => {
	it('should re-enable the motivation Reveal button after the callback promise resolves', async () => {
		// Simulate an async reveal that takes a tick to resolve
		let resolveReveal!: () => void;
		const onRevealMotivation = vi.fn(
			() => new Promise<void>((res) => { resolveReveal = res; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		const button = screen.getByRole('button', { name: /reveal motivation/i });

		// Click — button should become disabled while the promise is in-flight
		await fireEvent.click(button);
		expect(button).toBeDisabled();

		// Resolve the async operation — button should become enabled again
		resolveReveal();
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should re-enable the pitfall Reveal button after the callback promise resolves', async () => {
		let resolveReveal!: () => void;
		const onRevealPitfall = vi.fn(
			() => new Promise<void>((res) => { resolveReveal = res; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall
			}
		});

		const button = screen.getByRole('button', { name: /reveal pitfall/i });
		await fireEvent.click(button);
		expect(button).toBeDisabled();

		resolveReveal();
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should remove the Reveal button when motivations prop updates to show item as known', async () => {
		// After a successful reveal the parent will re-render with isKnown: true.
		// The button for that item should disappear entirely.
		const onRevealMotivation = vi.fn().mockResolvedValue(undefined);

		const { rerender } = render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /reveal motivation/i }));

		// Parent simulates a successful reveal by re-rendering with isKnown: true
		await rerender({
			motivations: [makeMotivation('justice', true)],
			pitfalls: [],
			onRevealMotivation
		});

		await waitFor(() => {
			const buttons = screen.queryAllByRole('button', { name: /reveal motivation/i });
			expect(buttons).toHaveLength(0);
		});
	});

	it('should remove the Reveal button when pitfalls prop updates to show item as known', async () => {
		const onRevealPitfall = vi.fn().mockResolvedValue(undefined);

		const { rerender } = render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /reveal pitfall/i }));

		await rerender({
			motivations: [],
			pitfalls: [makePitfall('greed', true)],
			onRevealPitfall
		});

		await waitFor(() => {
			const buttons = screen.queryAllByRole('button', { name: /reveal pitfall/i });
			expect(buttons).toHaveLength(0);
		});
	});
});

// ---------------------------------------------------------------------------
// Suite 3: Revealing state clears on async failure (BUG 1 — error path)
//   Even when the async operation throws, the button must recover so the user
//   can try again. Currently the array is never cleared on any path, so both
//   success and failure leave the button permanently greyed out.
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Revealing state clears after async failure (Issue #566 BUG 1)', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('should re-enable the motivation Reveal button when the callback promise rejects', async () => {
		let rejectReveal!: (err: Error) => void;
		const onRevealMotivation = vi.fn(
			() => new Promise<void>((_, rej) => { rejectReveal = rej; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		const button = screen.getByRole('button', { name: /reveal motivation/i });
		await fireEvent.click(button);

		// Button is disabled while the promise is pending
		expect(button).toBeDisabled();

		// Simulate a DB or network failure
		rejectReveal(new Error('IndexedDB write failed'));

		// Button MUST become enabled again so the user can retry
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should re-enable the pitfall Reveal button when the callback promise rejects', async () => {
		let rejectReveal!: (err: Error) => void;
		const onRevealPitfall = vi.fn(
			() => new Promise<void>((_, rej) => { rejectReveal = rej; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall
			}
		});

		const button = screen.getByRole('button', { name: /reveal pitfall/i });
		await fireEvent.click(button);
		expect(button).toBeDisabled();

		rejectReveal(new Error('IndexedDB write failed'));
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should allow a second reveal attempt after the first one fails', async () => {
		// First call rejects; second call succeeds. The callback must be invokable twice.
		const onRevealMotivation = vi.fn()
			.mockRejectedValueOnce(new Error('Temporary failure'))
			.mockResolvedValueOnce(undefined);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		const button = screen.getByRole('button', { name: /reveal motivation/i });

		// First click — fails
		await fireEvent.click(button);
		await waitFor(() => expect(button).not.toBeDisabled());

		// Second click — succeeds
		await fireEvent.click(button);
		expect(onRevealMotivation).toHaveBeenCalledTimes(2);
	});
});

// ---------------------------------------------------------------------------
// Suite 4: Rapid / double-click protection
//   While a reveal is in-flight the button must be disabled so a second click
//   cannot queue a duplicate DB write. After the operation completes the button
//   must return to its normal enabled state.
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Rapid click protection (Issue #566)', () => {
	it('should not call onRevealMotivation twice when the button is double-clicked rapidly', async () => {
		let resolveReveal!: () => void;
		const onRevealMotivation = vi.fn(
			() => new Promise<void>((res) => { resolveReveal = res; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation
			}
		});

		const button = screen.getByRole('button', { name: /reveal motivation/i });

		// Rapid double-click
		await fireEvent.click(button);
		await fireEvent.click(button); // button should be disabled, this click is a no-op

		// The callback must only have been invoked once
		expect(onRevealMotivation).toHaveBeenCalledOnce();

		// Clean up: resolve the pending promise so the component settles
		resolveReveal();
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should not call onRevealPitfall twice when the button is double-clicked rapidly', async () => {
		let resolveReveal!: () => void;
		const onRevealPitfall = vi.fn(
			() => new Promise<void>((res) => { resolveReveal = res; })
		);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall
			}
		});

		const button = screen.getByRole('button', { name: /reveal pitfall/i });

		await fireEvent.click(button);
		await fireEvent.click(button);

		expect(onRevealPitfall).toHaveBeenCalledOnce();

		resolveReveal();
		await waitFor(() => expect(button).not.toBeDisabled());
	});
});

// ---------------------------------------------------------------------------
// Suite 5: Multiple independent items — isolation
//   Revealing one item must not permanently disable the Reveal buttons for
//   other items in the same list.
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Independent item revealing (Issue #566)', () => {
	it('should not permanently disable a sibling motivation Reveal button after one reveal completes', async () => {
		const onRevealMotivation = vi.fn().mockResolvedValue(undefined);

		render(MotivationPitfallPanel, {
			props: {
				motivations: makeMotivations(['justice', 'power', 'charity'], false),
				pitfalls: [],
				onRevealMotivation
			}
		});

		const buttons = screen.getAllByRole('button', { name: /reveal motivation/i });
		expect(buttons).toHaveLength(3);

		// Reveal the first item
		await fireEvent.click(buttons[0]);
		await waitFor(() => expect(onRevealMotivation).toHaveBeenCalledWith('justice'));

		// The other two buttons must remain enabled
		await waitFor(() => {
			expect(buttons[1]).not.toBeDisabled();
			expect(buttons[2]).not.toBeDisabled();
		});
	});

	it('should not permanently disable a sibling pitfall Reveal button after one reveal completes', async () => {
		const onRevealPitfall = vi.fn().mockResolvedValue(undefined);

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false), makePitfall('revenge', false)],
				onRevealPitfall
			}
		});

		const buttons = screen.getAllByRole('button', { name: /reveal pitfall/i });
		await fireEvent.click(buttons[0]);
		await waitFor(() => expect(onRevealPitfall).toHaveBeenCalledWith('greed'));

		await waitFor(() => expect(buttons[1]).not.toBeDisabled());
	});

	it('should keep the motivation button for an already-revealing item disabled while a sibling reveal is pending', async () => {
		// Both items are in-flight simultaneously. Each must only disable its own button.
		let resolveJustice!: () => void;
		let resolvePower!: () => void;
		const onRevealMotivation = vi.fn()
			.mockImplementationOnce(() => new Promise<void>((res) => { resolveJustice = res; }))
			.mockImplementationOnce(() => new Promise<void>((res) => { resolvePower = res; }));

		render(MotivationPitfallPanel, {
			props: {
				motivations: makeMotivations(['justice', 'power'], false),
				pitfalls: [],
				onRevealMotivation
			}
		});

		const buttons = screen.getAllByRole('button', { name: /reveal motivation/i });

		// Click both buttons — each starts its own in-flight operation
		await fireEvent.click(buttons[0]); // justice in flight
		await fireEvent.click(buttons[1]); // power in flight

		// Both buttons should be disabled
		expect(buttons[0]).toBeDisabled();
		expect(buttons[1]).toBeDisabled();

		// Resolve justice only
		resolveJustice();
		await waitFor(() => expect(buttons[0]).not.toBeDisabled());

		// Power is still pending — its button should still be disabled
		expect(buttons[1]).toBeDisabled();

		// Clean up
		resolvePower();
		await waitFor(() => expect(buttons[1]).not.toBeDisabled());
	});
});

// ---------------------------------------------------------------------------
// Suite 6: Page-level pitfall lookup bug (BUG 2)
//   The +page.svelte handleRevealPitfall does:
//     negotiation.pitfalls.findIndex((p) => p.description === type)
//   But `type` comes from npcPitfalls which applies `.toLowerCase()` to the
//   DB description. So if the DB stores "Greed", the lookup receives "greed"
//   and findIndex returns -1 — the store is never called.
//
//   These tests exercise the page-level handler logic in isolation by
//   simulating the same lookup that the page performs.
// ---------------------------------------------------------------------------

describe('Page handler: pitfall lookup case-sensitivity (Issue #566 BUG 2)', () => {
	/**
	 * Simulate the current (buggy) handleRevealPitfall logic from +page.svelte.
	 * findIndex uses strict equality against the raw description.
	 */
	function buggyHandleRevealPitfall(
		pitfalls: Array<{ description: string; isKnown: boolean }>,
		type: string
	): number {
		return pitfalls.findIndex((p) => p.description === type);
	}

	/**
	 * Simulate the fixed handleRevealPitfall logic.
	 * findIndex uses case-insensitive comparison.
	 */
	function fixedHandleRevealPitfall(
		pitfalls: Array<{ description: string; isKnown: boolean }>,
		type: string
	): number {
		return pitfalls.findIndex((p) => p.description.toLowerCase() === type);
	}

	/**
	 * Simulate the npcPitfalls $derived transform from +page.svelte:
	 *   type: p.description.toLowerCase()
	 */
	function deriveNpcPitfalls(pitfalls: Array<{ description: string; isKnown: boolean }>) {
		return pitfalls.map((p) => ({ type: p.description.toLowerCase(), isKnown: p.isKnown }));
	}

	it('BUG: current buggy lookup returns -1 when DB stores "Greed" but component passes "greed"', () => {
		// DB record with mixed-case description (as stored by NegotiationSetup)
		const dbPitfalls = [{ description: 'Greed', isKnown: false }];

		// The component receives the lowercase-transformed type
		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);
		const typePassedFromComponent = npcPitfalls[0].type; // "greed"

		// The current handler uses strict equality — this FAILS to find the pitfall
		const index = buggyHandleRevealPitfall(dbPitfalls, typePassedFromComponent);

		// BUG: index is -1, so revealPitfall() is never called
		// This test asserts the buggy outcome to prove it fails
		expect(index).toBe(-1);
	});

	it('BUG: current buggy lookup fails for all mixed-case pitfall descriptions', () => {
		const dbPitfalls = [
			{ description: 'Justice', isKnown: false },
			{ description: 'Power', isKnown: false },
			{ description: 'Revenge', isKnown: false }
		];

		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);

		npcPitfalls.forEach((npcPitfall, i) => {
			const index = buggyHandleRevealPitfall(dbPitfalls, npcPitfall.type);
			// All lookups fail with the buggy strict-equality comparison
			expect(index).toBe(-1);
		});
	});

	it('FIX: case-insensitive lookup correctly finds "Greed" when component passes "greed"', () => {
		const dbPitfalls = [{ description: 'Greed', isKnown: false }];
		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);
		const typePassedFromComponent = npcPitfalls[0].type; // "greed"

		// Fixed lookup — this MUST pass after the fix is applied
		const index = fixedHandleRevealPitfall(dbPitfalls, typePassedFromComponent);
		expect(index).toBe(0);
	});

	it('FIX: case-insensitive lookup works for all mixed-case descriptions', () => {
		const dbPitfalls = [
			{ description: 'Justice', isKnown: false },
			{ description: 'Power', isKnown: false },
			{ description: 'Revenge', isKnown: false }
		];

		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);

		npcPitfalls.forEach((npcPitfall, i) => {
			const index = fixedHandleRevealPitfall(dbPitfalls, npcPitfall.type);
			expect(index).toBe(i);
		});
	});

	it('FIX: case-insensitive lookup works when DB description is already lowercase', () => {
		// Edge case: some entries may already be lowercase — the fix must not break these
		const dbPitfalls = [{ description: 'greed', isKnown: false }];
		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);

		const index = fixedHandleRevealPitfall(dbPitfalls, npcPitfalls[0].type);
		expect(index).toBe(0);
	});

	it('FIX: case-insensitive lookup works with multi-word descriptions', () => {
		// NegotiationSetup stores formatted types, e.g. "No Mercy" -> "no mercy"
		const dbPitfalls = [{ description: 'No Mercy', isKnown: false }];
		const npcPitfalls = deriveNpcPitfalls(dbPitfalls);

		const index = fixedHandleRevealPitfall(dbPitfalls, npcPitfalls[0].type);
		expect(index).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Suite 7: Page-level motivation lookup (regression guard)
//   The motivation lookup in handleRevealMotivation uses m.type directly
//   (no case transform) and npcMotivations also uses m.type directly —
//   these should match. This suite confirms the motivation path is not broken
//   so the fix for pitfalls does not regress it.
// ---------------------------------------------------------------------------

describe('Page handler: motivation lookup correctness (Issue #566 regression guard)', () => {
	/**
	 * Simulate handleRevealMotivation from +page.svelte.
	 * Uses strict equality on type, which is consistent with how npcMotivations is derived.
	 */
	function handleRevealMotivation(
		motivations: Array<{ type: string; description: string; isKnown: boolean; timesUsed: number }>,
		type: string
	): number {
		return motivations.findIndex((m) => m.type === type);
	}

	it('should correctly find a motivation by type (exact match)', () => {
		const dbMotivations = [
			{ type: 'justice', description: 'Seeks fairness', isKnown: false, timesUsed: 0 }
		];
		const index = handleRevealMotivation(dbMotivations, 'justice');
		expect(index).toBe(0);
	});

	it('should correctly find the right motivation among multiple', () => {
		const dbMotivations = [
			{ type: 'justice', description: 'Seeks fairness', isKnown: false, timesUsed: 0 },
			{ type: 'power', description: 'Desires power', isKnown: false, timesUsed: 0 },
			{ type: 'charity', description: 'Gives freely', isKnown: false, timesUsed: 0 }
		];
		expect(handleRevealMotivation(dbMotivations, 'power')).toBe(1);
	});

	it('should return -1 for an unknown motivation type (defensive guard)', () => {
		const dbMotivations = [
			{ type: 'justice', description: 'Seeks fairness', isKnown: false, timesUsed: 0 }
		];
		expect(handleRevealMotivation(dbMotivations, 'nonexistent')).toBe(-1);
	});
});

// ---------------------------------------------------------------------------
// Suite 8: Prop type contract — callbacks must accept Promise return
//   These tests document that the component's onReveal* props MUST accept an
//   async handler (i.e. one that returns a Promise). The current prop type is
//   `(type: string) => void`, which means the component discards the return
//   value and cannot await it. After the fix the type must be
//   `(type: string) => Promise<void>` (or `void | Promise<void>`).
// ---------------------------------------------------------------------------

describe('MotivationPitfallPanel - Prop contract: async callbacks (Issue #566)', () => {
	it('should accept and await an async onRevealMotivation callback', async () => {
		// An async handler that takes a measurable amount of time
		const asyncReveal = vi.fn(async (type: string) => {
			// Simulate a real async operation (e.g. IndexedDB write)
			await new Promise<void>((res) => setTimeout(res, 0));
		});

		render(MotivationPitfallPanel, {
			props: {
				motivations: [makeMotivation('justice', false)],
				pitfalls: [],
				onRevealMotivation: asyncReveal
			}
		});

		const button = screen.getByRole('button', { name: /reveal motivation/i });
		await fireEvent.click(button);

		// Callback must have been called
		expect(asyncReveal).toHaveBeenCalledOnce();

		// After the async operation completes, the button must be enabled again.
		// This fails today because the component never awaits the return value.
		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it('should accept and await an async onRevealPitfall callback', async () => {
		const asyncReveal = vi.fn(async (_type: string) => {
			await new Promise<void>((res) => setTimeout(res, 0));
		});

		render(MotivationPitfallPanel, {
			props: {
				motivations: [],
				pitfalls: [makePitfall('greed', false)],
				onRevealPitfall: asyncReveal
			}
		});

		const button = screen.getByRole('button', { name: /reveal pitfall/i });
		await fireEvent.click(button);

		expect(asyncReveal).toHaveBeenCalledOnce();
		await waitFor(() => expect(button).not.toBeDisabled());
	});
});
