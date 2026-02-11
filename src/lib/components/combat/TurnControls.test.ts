/**
 * Tests for TurnControls Component
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker
 *
 * TurnControls provides buttons for navigating combat turns (next/previous)
 * and managing combat state (start/pause/end).
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TurnControls from './TurnControls.svelte';
import { createActiveCombatSession, createMockCombatSession, createMockHeroCombatant } from '../../../tests/utils/combatTestUtils';
import type { CombatSession } from '$lib/types/combat';

describe('TurnControls Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const combat = createActiveCombatSession();
		const { container } = render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display Next Turn button', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /next.*turn/i })).toBeInTheDocument();
	});

	it('should display Previous Turn button', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /previous.*turn/i })).toBeInTheDocument();
	});

	it('should display current round and turn information', () => {
		const combat = createActiveCombatSession();
		combat.currentRound = 3;
		combat.currentTurn = 2;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByText(/round.*3/i)).toBeInTheDocument();
	});
});

describe('TurnControls Component - Next Turn', () => {
	it('should call onNextTurn when Next button is clicked', async () => {
		const onNextTurn = vi.fn();
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn,
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		await fireEvent.click(nextButton);

		expect(onNextTurn).toHaveBeenCalledTimes(1);
	});

	it('should be enabled during active combat', () => {
		const combat = createActiveCombatSession();
		combat.status = 'active';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).not.toBeDisabled();
	});

	it('should be disabled when combat is not active', () => {
		const combat = createMockCombatSession();
		combat.status = 'preparing';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toBeDisabled();
	});

	it('should be disabled when combat is completed', () => {
		const combat = createActiveCombatSession();
		combat.status = 'completed';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toBeDisabled();
	});

	it('should show keyboard shortcut hint', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toHaveAttribute('title', expect.stringMatching(/arrow|shortcut/i));
	});
});

describe('TurnControls Component - Previous Turn', () => {
	it('should call onPreviousTurn when Previous button is clicked', async () => {
		const onPreviousTurn = vi.fn();
		const combat = createActiveCombatSession();
		combat.currentTurn = 2;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		await fireEvent.click(prevButton);

		expect(onPreviousTurn).toHaveBeenCalledTimes(1);
	});

	it('should be enabled when not on first turn', () => {
		const combat = createActiveCombatSession();
		combat.currentTurn = 2;
		combat.status = 'active';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		expect(prevButton).not.toBeDisabled();
	});

	it('should be disabled on first turn of first round', () => {
		const combat = createActiveCombatSession();
		combat.currentRound = 1;
		combat.currentTurn = 0;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		expect(prevButton).toBeDisabled();
	});

	it('should be disabled when combat is not active', () => {
		const combat = createMockCombatSession();
		combat.status = 'preparing';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		expect(prevButton).toBeDisabled();
	});
});

describe('TurnControls Component - Combat State Controls', () => {
	it('should show Start Combat button when status is preparing', () => {
		const combat = createMockCombatSession();
		combat.status = 'preparing';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onStartCombat: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /start.*combat/i })).toBeInTheDocument();
	});

	it('should call onStartCombat when Start button is clicked', async () => {
		const onStartCombat = vi.fn();
		const combat = createMockCombatSession();
		combat.status = 'preparing';
		combat.combatants = [createMockHeroCombatant()]; // Need at least one combatant

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onStartCombat
			}
		});

		const startButton = screen.getByRole('button', { name: /start.*combat/i });
		await fireEvent.click(startButton);

		expect(onStartCombat).toHaveBeenCalledTimes(1);
	});

	it('should disable Start button when no combatants', () => {
		const combat = createMockCombatSession();
		combat.status = 'preparing';
		combat.combatants = [];

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onStartCombat: vi.fn()
			}
		});

		const startButton = screen.getByRole('button', { name: /start.*combat/i });
		expect(startButton).toBeDisabled();
	});

	it('should show Pause button when combat is active', () => {
		const combat = createActiveCombatSession();
		combat.status = 'active';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onPauseCombat: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
	});

	it('should call onPauseCombat when Pause button is clicked', async () => {
		const onPauseCombat = vi.fn();
		const combat = createActiveCombatSession();
		combat.status = 'active';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onPauseCombat
			}
		});

		const pauseButton = screen.getByRole('button', { name: /pause/i });
		await fireEvent.click(pauseButton);

		expect(onPauseCombat).toHaveBeenCalledTimes(1);
	});

	it('should show Resume button when combat is paused', () => {
		const combat = createActiveCombatSession();
		combat.status = 'paused';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onResumeCombat: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
	});

	it('should call onResumeCombat when Resume button is clicked', async () => {
		const onResumeCombat = vi.fn();
		const combat = createActiveCombatSession();
		combat.status = 'paused';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onResumeCombat
			}
		});

		const resumeButton = screen.getByRole('button', { name: /resume/i });
		await fireEvent.click(resumeButton);

		expect(onResumeCombat).toHaveBeenCalledTimes(1);
	});

	it('should show End Combat button when combat is active or paused', () => {
		const combat = createActiveCombatSession();
		combat.status = 'active';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onEndCombat: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /end.*combat/i })).toBeInTheDocument();
	});

	it('should call onEndCombat when End button is clicked', async () => {
		const onEndCombat = vi.fn();
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onEndCombat
			}
		});

		const endButton = screen.getByRole('button', { name: /end.*combat/i });
		await fireEvent.click(endButton);

		expect(onEndCombat).toHaveBeenCalledTimes(1);
	});
});

describe('TurnControls Component - Round Display', () => {
	it('should display current round number', () => {
		const combat = createActiveCombatSession();
		combat.currentRound = 5;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByText(/round.*5/i)).toBeInTheDocument();
	});

	it('should show preparing message when round is 0', () => {
		const combat = createMockCombatSession();
		combat.currentRound = 0;
		combat.status = 'preparing';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByText(/preparing|setup/i)).toBeInTheDocument();
	});

	it('should display turn counter', () => {
		const combat = createActiveCombatSession();
		combat.currentTurn = 3;
		combat.combatants = Array(5).fill(null).map((_, i) => createMockHeroCombatant({ name: `Hero ${i + 1}` }));

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		// Component shows "Turn 4 of 5" in separate elements
		expect(screen.getByText(/turn 4 of 5/i)).toBeInTheDocument();
	});
});

describe('TurnControls Component - Keyboard Shortcuts', () => {
	it('should respond to ArrowRight for next turn', async () => {
		const onNextTurn = vi.fn();
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn,
				onPreviousTurn: vi.fn()
			}
		});

		await fireEvent.keyDown(document, { key: 'ArrowRight' });

		expect(onNextTurn).toHaveBeenCalled();
	});

	it('should respond to ArrowLeft for previous turn', async () => {
		const onPreviousTurn = vi.fn();
		const combat = createActiveCombatSession();
		combat.currentTurn = 1;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn
			}
		});

		await fireEvent.keyDown(document, { key: 'ArrowLeft' });

		expect(onPreviousTurn).toHaveBeenCalled();
	});

	it('should not respond to shortcuts when combat is not active', async () => {
		const onNextTurn = vi.fn();
		const combat = createMockCombatSession();
		combat.status = 'preparing';

		render(TurnControls, {
			props: {
				combat,
				onNextTurn,
				onPreviousTurn: vi.fn()
			}
		});

		await fireEvent.keyDown(document, { key: 'ArrowRight' });

		expect(onNextTurn).not.toHaveBeenCalled();
	});
});

describe('TurnControls Component - Visual Indicators', () => {
	it('should show current combatant name', () => {
		const combat = createActiveCombatSession();
		const currentCombatant = combat.combatants[combat.currentTurn];

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByText(new RegExp(currentCombatant.name, 'i'))).toBeInTheDocument();
	});

	it('should highlight turn navigation buttons', () => {
		const combat = createActiveCombatSession();

		const { container } = render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toHaveClass(/primary|accent/i);
	});

	it('should show round advancement indicator when wrapping to next round', () => {
		const combat = createActiveCombatSession();
		combat.currentTurn = combat.combatants.length - 1; // Last turn

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				showRoundAdvance: true
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toHaveAttribute('title', expect.stringMatching(/next round/i));
	});
});

describe('TurnControls Component - Accessibility', () => {
	it('should have proper ARIA labels for navigation buttons', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toHaveAttribute('aria-label');
	});

	it('should announce round changes to screen readers', () => {
		const combat = createActiveCombatSession();
		combat.currentRound = 3;

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const roundDisplay = screen.getByText(/round.*3/i);
		expect(roundDisplay).toHaveAttribute('aria-live', 'polite');
	});

	it('should provide button disabled reasons', () => {
		const combat = createMockCombatSession();
		combat.status = 'preparing';
		combat.combatants = [];

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				onStartCombat: vi.fn()
			}
		});

		const startButton = screen.getByRole('button', { name: /start.*combat/i });
		expect(startButton).toHaveAttribute('title', expect.stringMatching(/add.*combatants/i));
	});

	it('should be keyboard navigable', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});
});

describe('TurnControls Component - Loading States', () => {
	it('should disable buttons during loading', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				loading: true
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });

		expect(nextButton).toBeDisabled();
		expect(prevButton).toBeDisabled();
	});

	it('should show loading indicator when processing', () => {
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn(),
				loading: true
			}
		});

		expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
	});
});

describe('TurnControls Component - Edge Cases', () => {
	it('should handle combat with single combatant', () => {
		const combat = createActiveCombatSession(1, 0);

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		expect(screen.getByText(/turn.*1.*1/i)).toBeInTheDocument();
	});

	it('should handle combat with no combatants gracefully', () => {
		const combat = createActiveCombatSession();
		combat.combatants = [];

		render(TurnControls, {
			props: {
				combat,
				onNextTurn: vi.fn(),
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toBeDisabled();
	});

	it('should handle rapid button clicks gracefully', async () => {
		const onNextTurn = vi.fn();
		const combat = createActiveCombatSession();

		render(TurnControls, {
			props: {
				combat,
				onNextTurn,
				onPreviousTurn: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });

		// Simulate rapid clicks
		await fireEvent.click(nextButton);
		await fireEvent.click(nextButton);
		await fireEvent.click(nextButton);

		// Should handle gracefully (component might implement debouncing)
		expect(onNextTurn).toHaveBeenCalled();
	});
});
