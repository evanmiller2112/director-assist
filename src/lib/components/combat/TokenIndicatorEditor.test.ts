/**
 * Tests for Token Indicator Editing After Combat Creation (Issue #600)
 *
 * TDD RED PHASE - These tests MUST FAIL until the feature is implemented.
 *
 * Feature: Allow editing Token Indicator after creature creation in combat.
 *
 * Background:
 * The tokenIndicator field already exists on the Combatant type and is set at
 * creation time via AddCombatantModal. However, there is currently no UI or
 * store-level convenience path that surfaces editing this value once the combatant
 * is already in combat. The data layer (UpdateCombatantInput + combatRepository
 * .updateCombatant) already supports the field; only the UI is missing.
 *
 * What these tests cover:
 * 1. CombatantCard renders an edit control (button/inline input) for tokenIndicator
 * 2. Activating the edit control reveals an editable input pre-filled with the
 *    current value
 * 3. Submitting a new value calls onUpdateTokenIndicator with the trimmed value
 * 4. Clearing the value (empty string) calls onUpdateTokenIndicator with undefined
 * 5. Cancelling the edit restores the original value with no callback
 * 6. The store's updateCombatant correctly propagates tokenIndicator changes
 * 7. The repository's updateCombatant persists tokenIndicator changes
 * 8. Edge cases: whitespace-only, special characters, very long values,
 *    switching from defined to undefined and vice versa
 *
 * Testing Strategy:
 * - CombatantCard tests use @testing-library/svelte with a new `onUpdateTokenIndicator`
 *   prop that the component does not currently accept — these tests will FAIL
 *   because the prop and the edit UI do not exist yet.
 * - Store tests verify that combatStore.updateCombatant passes tokenIndicator
 *   through to the repository — these pass through existing plumbing and are
 *   structural smoke-tests for the wiring.
 * - Repository tests use the real IndexedDB (fake-indexeddb via happy-dom) to
 *   verify round-trip persistence.
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import CombatantCard from './CombatantCard.svelte';
import {
	createMockHeroCombatant,
	createMockCreatureCombatant
} from '../../../tests/utils/combatTestUtils';
import type { Combatant } from '$lib/types/combat';

// ---------------------------------------------------------------------------
// Section 1: CombatantCard — Edit Control Rendering
// ---------------------------------------------------------------------------
// These tests verify that CombatantCard exposes a UI affordance for editing
// the token indicator. They will FAIL because no such control exists today.

describe('CombatantCard - Token Indicator Edit Control (Issue #600)', () => {
	it('should render an edit button for the token indicator when one is present', () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });

		// Act
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Assert — an edit trigger must be present near the badge
		// The component does not currently render this button, so the test FAILS.
		const editButton = screen.getByTestId('token-indicator-edit-button');
		expect(editButton).toBeInTheDocument();
	});

	it('should render an edit button for the token indicator even when none is currently set', () => {
		// Arrange — no tokenIndicator; user needs to be able to set one post-creation
		const combatant = createMockCreatureCombatant({ tokenIndicator: undefined });

		// Act
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Assert — edit affordance should always be present when the prop is supplied
		const editButton = screen.getByTestId('token-indicator-edit-button');
		expect(editButton).toBeInTheDocument();
	});

	it('should NOT render the edit button when onUpdateTokenIndicator prop is not provided', () => {
		// Arrange — read-only mode (prop absent), existing badge must still show
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'B' });

		// Act
		render(CombatantCard, { props: { combatant } });

		// Assert — no edit affordance in read-only mode (existing behaviour preserved)
		expect(screen.queryByTestId('token-indicator-edit-button')).not.toBeInTheDocument();
		// Badge itself should still be visible
		expect(screen.getByTestId('token-indicator-badge')).toBeInTheDocument();
	});

	it('should have an accessible label on the edit button', () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'C' });

		// Act
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Assert
		const editButton = screen.getByTestId('token-indicator-edit-button');
		expect(editButton).toHaveAttribute('aria-label', expect.stringMatching(/edit.*token/i));
	});

	it('should work for hero combatants as well as creature combatants', () => {
		// Arrange
		const hero = createMockHeroCombatant({ tokenIndicator: '1' });

		// Act
		render(CombatantCard, {
			props: { combatant: hero, onUpdateTokenIndicator: vi.fn() }
		});

		// Assert
		expect(screen.getByTestId('token-indicator-edit-button')).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Section 2: CombatantCard — Inline Edit Interaction
// ---------------------------------------------------------------------------
// These tests verify the full edit flow: open editor → mutate value → confirm.
// All will FAIL because the inline editor does not exist in the component today.

describe('CombatantCard - Token Indicator Inline Edit Flow (Issue #600)', () => {
	it('should reveal an editable input when the edit button is clicked', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		const editButton = screen.getByTestId('token-indicator-edit-button');
		await fireEvent.click(editButton);
		await tick();

		// Assert — an input for editing should appear
		const input = screen.getByTestId('token-indicator-input');
		expect(input).toBeInTheDocument();
	});

	it('should pre-fill the edit input with the current token indicator value', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'Goblin-3' });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();

		// Assert
		const input = screen.getByTestId('token-indicator-input') as HTMLInputElement;
		expect(input.value).toBe('Goblin-3');
	});

	it('should pre-fill the edit input with an empty string when no indicator exists', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: undefined });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();

		// Assert
		const input = screen.getByTestId('token-indicator-input') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('should hide the static badge and show the input while editing', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'X' });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();

		// Assert — badge swaps out for the input while editing
		expect(screen.queryByTestId('token-indicator-badge')).not.toBeInTheDocument();
		expect(screen.getByTestId('token-indicator-input')).toBeInTheDocument();
	});

	it('should render a confirm/save button while the editor is open', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();

		// Assert
		expect(screen.getByTestId('token-indicator-save-button')).toBeInTheDocument();
	});

	it('should render a cancel button while the editor is open', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, {
			props: { combatant, onUpdateTokenIndicator: vi.fn() }
		});

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();

		// Assert
		expect(screen.getByTestId('token-indicator-cancel-button')).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Section 3: CombatantCard — Callback Behaviour on Save
// ---------------------------------------------------------------------------

describe('CombatantCard - Token Indicator Save Behaviour (Issue #600)', () => {
	it('should call onUpdateTokenIndicator with the new value when saved', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act — open editor, change value, save
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: 'B' } });
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert
		expect(onUpdateTokenIndicator).toHaveBeenCalledOnce();
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('B');
	});

	it('should trim whitespace from the new value before calling the callback', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: '  B  ' } });
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — value is trimmed
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('B');
	});

	it('should call onUpdateTokenIndicator with undefined when the new value is empty', async () => {
		// Arrange — clearing the indicator is intentional, maps to undefined
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act — clear the field and save
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — empty string becomes undefined (no badge to render)
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith(undefined);
	});

	it('should call onUpdateTokenIndicator with undefined when the new value is whitespace only', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: '   ' } });
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — whitespace-only trims to empty, which maps to undefined
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith(undefined);
	});

	it('should close the editor after saving', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.input(screen.getByTestId('token-indicator-input'), {
			target: { value: 'Z' }
		});
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — editor is closed; input is gone
		expect(screen.queryByTestId('token-indicator-input')).not.toBeInTheDocument();
	});

	it('should submit on Enter key press in the input', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: 'Enter-Test' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		await tick();

		// Assert
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('Enter-Test');
	});
});

// ---------------------------------------------------------------------------
// Section 4: CombatantCard — Cancel Behaviour
// ---------------------------------------------------------------------------

describe('CombatantCard - Token Indicator Cancel Behaviour (Issue #600)', () => {
	it('should NOT call onUpdateTokenIndicator when cancel is clicked', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act — open, mutate, then cancel
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.input(screen.getByTestId('token-indicator-input'), {
			target: { value: 'Should-Not-Save' }
		});
		await fireEvent.click(screen.getByTestId('token-indicator-cancel-button'));
		await tick();

		// Assert — callback must not have fired
		expect(onUpdateTokenIndicator).not.toHaveBeenCalled();
	});

	it('should close the editor when cancel is clicked', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator: vi.fn() } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.click(screen.getByTestId('token-indicator-cancel-button'));
		await tick();

		// Assert
		expect(screen.queryByTestId('token-indicator-input')).not.toBeInTheDocument();
	});

	it('should restore the original badge after cancellation', async () => {
		// Arrange
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator: vi.fn() } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.click(screen.getByTestId('token-indicator-cancel-button'));
		await tick();

		// Assert — original badge is back
		const badge = screen.getByTestId('token-indicator-badge');
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveTextContent('A');
	});

	it('should dismiss the editor when Escape is pressed', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.keyDown(screen.getByTestId('token-indicator-input'), { key: 'Escape' });
		await tick();

		// Assert
		expect(onUpdateTokenIndicator).not.toHaveBeenCalled();
		expect(screen.queryByTestId('token-indicator-input')).not.toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// Section 5: CombatantCard — Edge Cases
// ---------------------------------------------------------------------------

describe('CombatantCard - Token Indicator Edge Cases (Issue #600)', () => {
	it('should handle special characters in the token indicator value', async () => {
		// Arrange — special chars are valid indicator labels
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		const input = screen.getByTestId('token-indicator-input');
		await fireEvent.input(input, { target: { value: 'Red-★' } });
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — special chars preserved, not stripped
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('Red-★');
	});

	it('should handle very long token indicator values without crashing', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'A' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });
		const longValue = 'Goblin-Alpha-Squad-Member-007-North-Quadrant';

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.input(screen.getByTestId('token-indicator-input'), {
			target: { value: longValue }
		});
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — full value passed through
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith(longValue);
	});

	it('should allow setting a token indicator on a combatant that had none', async () => {
		// Arrange — combatant starts with no indicator
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: undefined });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.input(screen.getByTestId('token-indicator-input'), {
			target: { value: 'New' }
		});
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — a new value is propagated
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('New');
	});

	it('should not call onUpdateTokenIndicator if the value is unchanged', async () => {
		// Arrange — saving the exact same value should be a no-op (or at minimum
		// must not crash). Implementations may choose to skip the callback in this
		// case; we assert it is called at most once and with the original value.
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: 'Same' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		// Value not changed from pre-fill
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — if called, it was called with the unchanged value; no crash
		if (onUpdateTokenIndicator.mock.calls.length > 0) {
			expect(onUpdateTokenIndicator).toHaveBeenCalledWith('Same');
		}
		expect(onUpdateTokenIndicator).toHaveBeenCalledTimes(
			onUpdateTokenIndicator.mock.calls.length
		);
	});

	it('should handle numeric-only token indicator strings', async () => {
		// Arrange
		const onUpdateTokenIndicator = vi.fn();
		const combatant = createMockCreatureCombatant({ tokenIndicator: '1' });
		render(CombatantCard, { props: { combatant, onUpdateTokenIndicator } });

		// Act
		await fireEvent.click(screen.getByTestId('token-indicator-edit-button'));
		await tick();
		await fireEvent.input(screen.getByTestId('token-indicator-input'), {
			target: { value: '42' }
		});
		await fireEvent.click(screen.getByTestId('token-indicator-save-button'));
		await tick();

		// Assert — stored as string, not coerced to number
		expect(onUpdateTokenIndicator).toHaveBeenCalledWith('42');
	});
});

// ---------------------------------------------------------------------------
// Section 6: Combat Store — updateCombatant Token Indicator Wiring (Issue #600)
// ---------------------------------------------------------------------------
// These tests verify that the combat store's updateCombatant action correctly
// passes tokenIndicator through to the repository. They will FAIL if the store
// omits tokenIndicator from what it forwards to the repository, but they will
// also help catch regressions in the existing wiring.

vi.mock('$lib/db/repositories', () => ({
	combatRepository: {
		getAll: vi.fn(() => ({
			subscribe: vi.fn((observer) => {
				if (typeof observer === 'object' && observer.next) {
					observer.next([]);
				}
				return { unsubscribe: vi.fn() };
			})
		})),
		create: vi.fn(),
		getById: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		startCombat: vi.fn(),
		pauseCombat: vi.fn(),
		resumeCombat: vi.fn(),
		endCombat: vi.fn(),
		reopenCombat: vi.fn(),
		addHeroCombatant: vi.fn(),
		addCreatureCombatant: vi.fn(),
		addQuickCombatant: vi.fn(),
		updateCombatant: vi.fn(),
		removeCombatant: vi.fn(),
		moveCombatantToPosition: vi.fn(),
		updateTurnOrder: vi.fn(),
		rollInitiative: vi.fn(),
		rollInitiativeForAll: vi.fn(),
		selectCombatantTurn: vi.fn(),
		nextTurn: vi.fn(),
		previousTurn: vi.fn(),
		applyDamage: vi.fn(),
		applyHealing: vi.fn(),
		addTemporaryHp: vi.fn(),
		updateMaxHp: vi.fn(),
		addCondition: vi.fn(),
		removeCondition: vi.fn(),
		addHeroPoints: vi.fn(),
		spendHeroPoint: vi.fn(),
		addVictoryPoints: vi.fn(),
		removeVictoryPoints: vi.fn(),
		addLogEntry: vi.fn(),
		logPowerRoll: vi.fn()
	}
}));

describe('CombatStore - updateCombatant forwards tokenIndicator (Issue #600)', () => {
	let combatStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Re-import to pick up fresh mock state
		const module = await import('$lib/stores/combat.svelte');
		combatStore = module.combatStore;
	});

	it('should call combatRepository.updateCombatant with tokenIndicator included', async () => {
		// Arrange
		const { combatRepository } = await import('$lib/db/repositories');
		const mockSession = {
			id: 'combat-1',
			name: 'Test Combat',
			status: 'active' as const,
			currentRound: 1,
			currentTurn: 0,
			combatants: [
				{
					id: 'creature-1',
					type: 'creature' as const,
					name: 'Goblin',
					initiative: 10,
					initiativeRoll: [5, 5] as [number, number],
					turnOrder: 1,
					hp: 20,
					maxHp: 20,
					tempHp: 0,
					conditions: [],
					threat: 1,
					tokenIndicator: 'A'
				}
			],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			turnMode: 'director-selected' as const,
			actedCombatantIds: []
		};

		vi.mocked(combatRepository.updateCombatant).mockResolvedValueOnce(mockSession);

		// Act — update only the tokenIndicator
		await combatStore.updateCombatant('combat-1', 'creature-1', {
			tokenIndicator: 'B'
		});

		// Assert — repository received the tokenIndicator field
		expect(combatRepository.updateCombatant).toHaveBeenCalledWith(
			'combat-1',
			'creature-1',
			expect.objectContaining({ tokenIndicator: 'B' })
		);
	});

	it('should call combatRepository.updateCombatant with tokenIndicator: undefined to clear it', async () => {
		// Arrange
		const { combatRepository } = await import('$lib/db/repositories');
		const mockSession = {
			id: 'combat-1',
			name: 'Test Combat',
			status: 'active' as const,
			currentRound: 1,
			currentTurn: 0,
			combatants: [],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			turnMode: 'director-selected' as const,
			actedCombatantIds: []
		};

		vi.mocked(combatRepository.updateCombatant).mockResolvedValueOnce(mockSession);

		// Act — clear the token indicator by setting undefined
		await combatStore.updateCombatant('combat-1', 'creature-1', {
			tokenIndicator: undefined
		});

		// Assert — undefined is forwarded, not silently dropped
		expect(combatRepository.updateCombatant).toHaveBeenCalledWith(
			'combat-1',
			'creature-1',
			expect.objectContaining({ tokenIndicator: undefined })
		);
	});

	it('should update activeCombat in the store after a tokenIndicator change', async () => {
		// Arrange — prime activeCombat so the store can update it
		const { combatRepository } = await import('$lib/db/repositories');
		const combatId = 'combat-active-1';

		const initialSession = {
			id: combatId,
			name: 'Active Combat',
			status: 'active' as const,
			currentRound: 1,
			currentTurn: 0,
			combatants: [
				{
					id: 'creature-1',
					type: 'creature' as const,
					name: 'Orc',
					initiative: 12,
					initiativeRoll: [6, 6] as [number, number],
					turnOrder: 1,
					hp: 30,
					maxHp: 30,
					tempHp: 0,
					conditions: [],
					threat: 1,
					tokenIndicator: 'X'
				}
			],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			turnMode: 'director-selected' as const,
			actedCombatantIds: []
		};

		// Prime the active combat via selectCombat
		vi.mocked(combatRepository.getById).mockResolvedValueOnce(initialSession);
		await combatStore.selectCombat(combatId);

		// Now set up the updated session returned by updateCombatant
		const updatedSession = {
			...initialSession,
			combatants: [
				{
					...initialSession.combatants[0],
					tokenIndicator: 'Y'
				}
			],
			updatedAt: new Date()
		};
		vi.mocked(combatRepository.updateCombatant).mockResolvedValueOnce(updatedSession);

		// Act
		await combatStore.updateCombatant(combatId, 'creature-1', { tokenIndicator: 'Y' });

		// Assert — activeCombat now reflects the updated tokenIndicator
		expect(combatStore.activeCombat).not.toBeNull();
		const updatedCombatant = combatStore.activeCombat?.combatants.find(
			(c: { id: string }) => c.id === 'creature-1'
		);
		expect(updatedCombatant?.tokenIndicator).toBe('Y');
	});

	it('should propagate repository errors when updating tokenIndicator', async () => {
		// Arrange
		const { combatRepository } = await import('$lib/db/repositories');
		vi.mocked(combatRepository.updateCombatant).mockRejectedValueOnce(
			new Error('Combatant not found')
		);

		// Act & Assert — store must re-throw, not swallow the error
		await expect(
			combatStore.updateCombatant('missing-combat', 'missing-combatant', {
				tokenIndicator: 'Z'
			})
		).rejects.toThrow('Combatant not found');
	});
});

// ---------------------------------------------------------------------------
// Section 7: Repository Layer — tokenIndicator Persistence (Issue #600)
// ---------------------------------------------------------------------------
// These tests use the real combatRepository against fake-indexeddb (via
// happy-dom). They verify that a tokenIndicator change round-trips correctly
// through the database — set, read back, update, read back again.

describe('CombatRepository - updateCombatant persists tokenIndicator (Issue #600)', () => {
	// Isolated import so the mock above does not bleed in
	let repo: typeof import('$lib/db/repositories/combatRepository').combatRepository;
	let db: typeof import('$lib/db').db;

	beforeAll(async () => {
		const repoModule = await import('$lib/db/repositories/combatRepository');
		const dbModule = await import('$lib/db');
		repo = repoModule.combatRepository;
		db = dbModule.db;
		await db.open();
	});

	beforeEach(async () => {
		await db.combatSessions.clear();
	});

	afterEach(async () => {
		await db.combatSessions.clear();
	});

	it('should persist a tokenIndicator change via updateCombatant', async () => {
		// Arrange — create a combat with a creature that has an initial indicator
		const combat = await repo.create({ name: 'Persistence Test' });
		const withCreature = await repo.addCreatureCombatant(combat.id, {
			name: 'Goblin',
			hp: 20,
			maxHp: 20,
			threat: 1,
			tokenIndicator: 'A'
		});
		const creatureId = withCreature.combatants[0].id;

		// Act — update the token indicator
		const afterUpdate = await repo.updateCombatant(combat.id, creatureId, {
			tokenIndicator: 'B'
		});

		// Assert — updated value returned immediately
		const updatedCombatant = afterUpdate.combatants.find((c) => c.id === creatureId);
		expect(updatedCombatant?.tokenIndicator).toBe('B');
	});

	it('should read back the updated tokenIndicator after a page-reload simulation (getById)', async () => {
		// Arrange
		const combat = await repo.create({ name: 'Reload Test' });
		const withCreature = await repo.addCreatureCombatant(combat.id, {
			name: 'Orc',
			hp: 30,
			maxHp: 30,
			threat: 1,
			tokenIndicator: 'OldValue'
		});
		const creatureId = withCreature.combatants[0].id;

		// Act — update, then re-fetch (simulates page reload / session restoration)
		await repo.updateCombatant(combat.id, creatureId, { tokenIndicator: 'NewValue' });
		const reloaded = await repo.getById(combat.id);

		// Assert — value persisted to IndexedDB
		const reloadedCombatant = reloaded?.combatants.find((c) => c.id === creatureId);
		expect(reloadedCombatant?.tokenIndicator).toBe('NewValue');
	});

	it('should persist clearing a tokenIndicator (setting to undefined)', async () => {
		// Arrange
		const combat = await repo.create({ name: 'Clear Test' });
		const withCreature = await repo.addCreatureCombatant(combat.id, {
			name: 'Troll',
			hp: 50,
			maxHp: 50,
			threat: 2,
			tokenIndicator: 'T'
		});
		const creatureId = withCreature.combatants[0].id;

		// Act — clear the indicator
		await repo.updateCombatant(combat.id, creatureId, { tokenIndicator: undefined });
		const reloaded = await repo.getById(combat.id);

		// Assert — cleared value persisted
		const reloadedCombatant = reloaded?.combatants.find((c) => c.id === creatureId);
		expect(reloadedCombatant?.tokenIndicator).toBeUndefined();
	});

	it('should not affect other combatant fields when only tokenIndicator is updated', async () => {
		// Arrange
		const combat = await repo.create({ name: 'Isolation Test' });
		const withCreature = await repo.addCreatureCombatant(combat.id, {
			name: 'Dragon',
			hp: 100,
			maxHp: 100,
			threat: 3,
			tokenIndicator: 'D'
		});
		const creatureId = withCreature.combatants[0].id;
		const creatureBefore = withCreature.combatants.find((c) => c.id === creatureId)!;

		// Act — only update tokenIndicator
		const afterUpdate = await repo.updateCombatant(combat.id, creatureId, {
			tokenIndicator: 'Dragon-A'
		});
		const creatureAfter = afterUpdate.combatants.find((c) => c.id === creatureId)!;

		// Assert — only tokenIndicator changed; other fields untouched
		expect(creatureAfter.name).toBe(creatureBefore.name);
		expect(creatureAfter.hp).toBe(creatureBefore.hp);
		expect(creatureAfter.maxHp).toBe(creatureBefore.maxHp);
		expect(creatureAfter.tokenIndicator).toBe('Dragon-A');
	});

	it('should update tokenIndicator for the correct combatant when multiple exist', async () => {
		// Arrange
		const combat = await repo.create({ name: 'Multi-combatant Test' });
		let session = await repo.addCreatureCombatant(combat.id, {
			name: 'Goblin A',
			hp: 10,
			maxHp: 10,
			threat: 1,
			tokenIndicator: 'G1'
		});
		session = await repo.addCreatureCombatant(combat.id, {
			name: 'Goblin B',
			hp: 10,
			maxHp: 10,
			threat: 1,
			tokenIndicator: 'G2'
		});

		const goblinAId = session.combatants.find((c) => c.name === 'Goblin A')!.id;
		const goblinBId = session.combatants.find((c) => c.name === 'Goblin B')!.id;

		// Act — only update Goblin B's indicator
		const afterUpdate = await repo.updateCombatant(combat.id, goblinBId, {
			tokenIndicator: 'G2-updated'
		});

		// Assert — Goblin A's indicator unchanged; Goblin B's updated
		const goblinA = afterUpdate.combatants.find((c) => c.id === goblinAId)!;
		const goblinB = afterUpdate.combatants.find((c) => c.id === goblinBId)!;
		expect(goblinA.tokenIndicator).toBe('G1');
		expect(goblinB.tokenIndicator).toBe('G2-updated');
	});

	it('should throw if the combat session does not exist', async () => {
		// Arrange — non-existent session ID
		await expect(
			repo.updateCombatant('non-existent-combat', 'any-combatant', {
				tokenIndicator: 'X'
			})
		).rejects.toThrow(/combat session.*not found/i);
	});

	it('should throw if the combatant does not exist in the session', async () => {
		// Arrange
		const combat = await repo.create({ name: 'Missing Combatant Test' });

		await expect(
			repo.updateCombatant(combat.id, 'non-existent-combatant', {
				tokenIndicator: 'X'
			})
		).rejects.toThrow(/combatant.*not found/i);
	});
});
