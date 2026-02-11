/**
 * Tests for Combat Runner Page (/combat/[id])
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker - Combat Runner UI
 *
 * This page is the main combat interface where the GM runs combat, including:
 * - Initiative tracking
 * - Turn management
 * - HP tracking
 * - Condition management
 * - Round advancement
 * - Hero/Victory points
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import CombatRunnerPage from './+page.svelte';
import {
	createActiveCombatSession,
	createMockCombatSession,
	createMockHeroCombatant,
	createMockCreatureCombatant
} from '../../../tests/utils/combatTestUtils';
import type { CombatSession } from '$lib/types/combat';

// Mock page params and combat store - use vi.hoisted() for proper mock hoisting
const { mockParams, mockPage, mockCurrentCombat, mockCombatStore } = vi.hoisted(() => {
	const params = { id: 'combat-123' };
	const page = {
		params: params
	};
	const currentCombat = { value: null as CombatSession | null };
	return {
		mockParams: params,
		mockPage: page,
		mockCurrentCombat: currentCombat,
		mockCombatStore: {
			subscribe: vi.fn(),
			getById: vi.fn((id: string) => currentCombat.value),
			update: vi.fn(),
			startCombat: vi.fn(),
			nextTurn: vi.fn(),
			previousTurn: vi.fn(),
			endRound: vi.fn(),
			addCombatant: vi.fn(),
			updateCombatant: vi.fn(),
			removeCombatant: vi.fn(),
			addCondition: vi.fn(),
			removeCondition: vi.fn(),
			updateHeroPoints: vi.fn(),
			updateVictoryPoints: vi.fn()
		}
	};
});

vi.mock('$app/stores', () => ({
	page: {
		subscribe: (fn: (value: typeof mockPage) => void) => {
			fn(mockPage);
			return () => {};
		}
	}
}));

vi.mock('$lib/stores/combatStore', () => ({
	combatStore: mockCombatStore
}));

describe('Combat Runner Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
		mockCurrentCombat.value.name = 'Test Combat';
	});

	it('should render without crashing', () => {
		const { container } = render(CombatRunnerPage);
		expect(container).toBeInTheDocument();
	});

	it('should display combat name', () => {
		render(CombatRunnerPage);
		expect(screen.getByText('Test Combat')).toBeInTheDocument();
	});

	it('should display current round number', () => {
		mockCurrentCombat.value!.currentRound = 3;
		render(CombatRunnerPage);

		expect(screen.getByText(/round.*3/i)).toBeInTheDocument();
	});

	it('should display InitiativeTracker component', () => {
		render(CombatRunnerPage);

		// InitiativeTracker should be present (check for combatant names)
		mockCurrentCombat.value!.combatants.forEach(combatant => {
			expect(screen.getByText(combatant.name)).toBeInTheDocument();
		});
	});

	it('should display TurnControls component', () => {
		render(CombatRunnerPage);

		// TurnControls should have next/previous buttons
		expect(screen.getByRole('button', { name: /next.*turn/i })).toBeInTheDocument();
	});

	it('should show "Not Found" message when combat does not exist', () => {
		mockCurrentCombat.value = null;
		render(CombatRunnerPage);

		expect(screen.getByText(/combat.*not found/i)).toBeInTheDocument();
	});
});

describe('Combat Runner Page - Initiative Tracker Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display all combatants in InitiativeTracker', () => {
		render(CombatRunnerPage);

		mockCurrentCombat.value!.combatants.forEach(combatant => {
			expect(screen.getByText(combatant.name)).toBeInTheDocument();
		});
	});

	it('should highlight current combatant in InitiativeTracker', () => {
		mockCurrentCombat.value!.currentTurn = 1;
		render(CombatRunnerPage);

		const currentCombatant = mockCurrentCombat.value!.combatants[1];
		const card = screen.getByText(currentCombatant.name).closest('[data-testid="combatant-card"]');

		expect(card).toHaveClass(/current|active/);
	});

	it('should allow selecting a combatant by clicking in InitiativeTracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');

		await fireEvent.click(card!);

		// Should select the combatant (showing HP tracker and condition manager)
		// Verify by checking if HP tracker is visible
		await waitFor(() => {
			expect(screen.getByTestId('hp-tracker')).toBeInTheDocument();
		});
	});
});

describe('Combat Runner Page - Turn Controls', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display "Next Turn" button', () => {
		render(CombatRunnerPage);
		expect(screen.getByRole('button', { name: /next.*turn/i })).toBeInTheDocument();
	});

	it('should display "Previous Turn" button', () => {
		render(CombatRunnerPage);
		expect(screen.getByRole('button', { name: /previous.*turn/i })).toBeInTheDocument();
	});

	it('should call nextTurn when "Next Turn" button is clicked', async () => {
		render(CombatRunnerPage);

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		await fireEvent.click(nextButton);

		expect(mockCombatStore.nextTurn).toHaveBeenCalledWith('combat-123');
	});

	it('should call previousTurn when "Previous Turn" button is clicked', async () => {
		mockCurrentCombat.value!.currentTurn = 2;
		render(CombatRunnerPage);

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		await fireEvent.click(prevButton);

		expect(mockCombatStore.previousTurn).toHaveBeenCalledWith('combat-123');
	});

	it('should disable "Previous Turn" button on first turn', () => {
		mockCurrentCombat.value!.currentTurn = 0;
		mockCurrentCombat.value!.currentRound = 1;
		render(CombatRunnerPage);

		const prevButton = screen.getByRole('button', { name: /previous.*turn/i });
		expect(prevButton).toBeDisabled();
	});

	it('should show "End Round" button on last turn', () => {
		mockCurrentCombat.value!.currentTurn = mockCurrentCombat.value!.combatants.length - 1;
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /end.*round/i })).toBeInTheDocument();
	});

	it('should call endRound when "End Round" button is clicked', async () => {
		mockCurrentCombat.value!.currentTurn = mockCurrentCombat.value!.combatants.length - 1;
		render(CombatRunnerPage);

		const endRoundButton = screen.getByRole('button', { name: /end.*round/i });
		await fireEvent.click(endRoundButton);

		expect(mockCombatStore.endRound).toHaveBeenCalledWith('combat-123');
	});
});

describe('Combat Runner Page - HP Tracker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should show HP tracker when a combatant is selected', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByTestId('hp-tracker')).toBeInTheDocument();
		});
	});

	it('should display current HP in HP tracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			const hpTracker = screen.getByTestId('hp-tracker');
			expect(within(hpTracker).getByText(new RegExp(combatant.hp.toString()))).toBeInTheDocument();
		});
	});

	it('should display max HP in HP tracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			const hpTracker = screen.getByTestId('hp-tracker');
			expect(within(hpTracker).getByText(new RegExp(combatant.maxHp!.toString()))).toBeInTheDocument();
		});
	});

	it('should have damage button in HP tracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /damage|deal.*damage/i })).toBeInTheDocument();
		});
	});

	it('should have heal button in HP tracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /heal/i })).toBeInTheDocument();
		});
	});

	it('should have temp HP input in HP tracker', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByLabelText(/temp.*hp/i)).toBeInTheDocument();
		});
	});
});

describe('Combat Runner Page - Condition Manager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should show condition manager when a combatant is selected', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByTestId('condition-manager')).toBeInTheDocument();
		});
	});

	it('should display "Add Condition" button', async () => {
		render(CombatRunnerPage);

		const combatant = mockCurrentCombat.value!.combatants[0];
		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /add.*condition/i })).toBeInTheDocument();
		});
	});

	it('should display existing conditions', async () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				{ name: 'Bleeding', source: 'Sword', duration: 2 },
				{ name: 'Slowed', source: 'Spell', duration: 1 }
			]
		});
		mockCurrentCombat.value!.combatants[0] = combatant;

		render(CombatRunnerPage);

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByText('Bleeding')).toBeInTheDocument();
			expect(screen.getByText('Slowed')).toBeInTheDocument();
		});
	});

	it('should display condition duration', async () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				{ name: 'Poisoned', source: 'Trap', duration: 3 }
			]
		});
		mockCurrentCombat.value!.combatants[0] = combatant;

		render(CombatRunnerPage);

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			expect(screen.getByText(/3.*rounds?/i)).toBeInTheDocument();
		});
	});

	it('should have remove button for each condition', async () => {
		const combatant = createMockHeroCombatant({
			conditions: [
				{ name: 'Stunned', source: 'Attack', duration: 1 }
			]
		});
		mockCurrentCombat.value!.combatants[0] = combatant;

		render(CombatRunnerPage);

		const card = screen.getByText(combatant.name).closest('[data-testid="combatant-card"]');
		await fireEvent.click(card!);

		await waitFor(() => {
			const conditionManager = screen.getByTestId('condition-manager');
			const removeButton = within(conditionManager).getByRole('button', { name: /remove|delete/i });
			expect(removeButton).toBeInTheDocument();
		});
	});
});

describe('Combat Runner Page - Hero Points Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display hero points counter', () => {
		mockCurrentCombat.value!.heroPoints = 3;
		render(CombatRunnerPage);

		expect(screen.getByText(/hero points?/i)).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('should have button to spend hero point', () => {
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /spend.*hero point/i })).toBeInTheDocument();
	});

	it('should have button to add hero point', () => {
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /add.*hero point/i })).toBeInTheDocument();
	});

	it('should call updateHeroPoints when spend button is clicked', async () => {
		mockCurrentCombat.value!.heroPoints = 3;
		render(CombatRunnerPage);

		const spendButton = screen.getByRole('button', { name: /spend.*hero point/i });
		await fireEvent.click(spendButton);

		expect(mockCombatStore.updateHeroPoints).toHaveBeenCalledWith('combat-123', 2);
	});

	it('should disable spend button when hero points are 0', () => {
		mockCurrentCombat.value!.heroPoints = 0;
		render(CombatRunnerPage);

		const spendButton = screen.getByRole('button', { name: /spend.*hero point/i });
		expect(spendButton).toBeDisabled();
	});
});

describe('Combat Runner Page - Victory Points Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display victory points counter', () => {
		mockCurrentCombat.value!.victoryPoints = 5;
		render(CombatRunnerPage);

		expect(screen.getByText(/victory points?/i)).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
	});

	it('should have button to increment victory points', () => {
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /add.*victory point|\+/i })).toBeInTheDocument();
	});

	it('should have button to decrement victory points', () => {
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /subtract.*victory point|-/i })).toBeInTheDocument();
	});

	it('should call updateVictoryPoints when increment button is clicked', async () => {
		mockCurrentCombat.value!.victoryPoints = 2;
		render(CombatRunnerPage);

		const addButton = screen.getByRole('button', { name: /add.*victory point|\+/i });
		await fireEvent.click(addButton);

		expect(mockCombatStore.updateVictoryPoints).toHaveBeenCalledWith('combat-123', 3);
	});
});

describe('Combat Runner Page - Add Combatant', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display "Add Combatant" button', () => {
		render(CombatRunnerPage);

		expect(screen.getByRole('button', { name: /add.*combatant/i })).toBeInTheDocument();
	});

	it('should open AddCombatantModal when "Add Combatant" button is clicked', async () => {
		render(CombatRunnerPage);

		const addButton = screen.getByRole('button', { name: /add.*combatant/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: /add.*combatant/i })).toBeInTheDocument();
		});
	});

	it('should close modal when cancel is clicked', async () => {
		render(CombatRunnerPage);

		const addButton = screen.getByRole('button', { name: /add.*combatant/i });
		await fireEvent.click(addButton);

		const modal = await screen.findByRole('dialog');
		const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});
});

describe('Combat Runner Page - Combat Status Indicator', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should display "Active" status badge for active combat', () => {
		mockCurrentCombat.value!.status = 'active';
		render(CombatRunnerPage);

		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should display "Paused" status badge for paused combat', () => {
		mockCurrentCombat.value!.status = 'paused';
		render(CombatRunnerPage);

		expect(screen.getByText(/paused/i)).toBeInTheDocument();
	});

	it('should display "Preparing" status badge for preparing combat', () => {
		mockCurrentCombat.value = createMockCombatSession({ status: 'preparing', name: 'Test' });
		mockCurrentCombat.value.id = 'combat-123';
		render(CombatRunnerPage);

		expect(screen.getByText(/preparing/i)).toBeInTheDocument();
	});
});

describe('Combat Runner Page - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentCombat.value = createActiveCombatSession(2, 2);
		mockCurrentCombat.value.id = 'combat-123';
	});

	it('should have proper heading hierarchy', () => {
		render(CombatRunnerPage);

		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();
	});

	it('should have ARIA labels on control buttons', () => {
		render(CombatRunnerPage);

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).toHaveAccessibleName();
	});

	it('should have keyboard accessible turn controls', () => {
		render(CombatRunnerPage);

		const nextButton = screen.getByRole('button', { name: /next.*turn/i });
		expect(nextButton).not.toHaveAttribute('tabindex', '-1');
	});

	it('should announce round changes to screen readers', () => {
		render(CombatRunnerPage);

		const roundDisplay = screen.getByText(/round/i).closest('[role="status"]');
		expect(roundDisplay).toHaveAttribute('aria-live', 'polite');
	});
});

describe('Combat Runner Page - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle combat with no combatants', () => {
		mockCurrentCombat.value = createMockCombatSession({ name: 'Empty Combat' });
		mockCurrentCombat.value.id = 'combat-123';
		mockCurrentCombat.value.combatants = [];

		render(CombatRunnerPage);

		expect(screen.getByText(/no combatants/i)).toBeInTheDocument();
	});

	it('should handle combat with only heroes', () => {
		mockCurrentCombat.value = createActiveCombatSession(3, 0);
		mockCurrentCombat.value.id = 'combat-123';

		render(CombatRunnerPage);

		expect(screen.getAllByTestId('hero-indicator').length).toBe(3);
	});

	it('should handle combat with only creatures', () => {
		mockCurrentCombat.value = createActiveCombatSession(0, 3);
		mockCurrentCombat.value.id = 'combat-123';

		render(CombatRunnerPage);

		expect(screen.getAllByTestId('threat-badge').length).toBe(3);
	});

	it('should handle invalid combat ID', () => {
		mockCurrentCombat.value = null;
		mockParams.id = 'invalid-id';

		render(CombatRunnerPage);

		expect(screen.getByText(/combat.*not found/i)).toBeInTheDocument();
	});
});
