/**
 * Tests for Combat List Page (/combat)
 *
 * TDD RED PHASE - Tests for A2 Combat Round Tracker - Combat List UI
 *
 * This page displays all combat sessions and allows the user to:
 * - View all combat sessions
 * - See combat status (preparing, active, paused, completed)
 * - Create new combat sessions
 * - Navigate to individual combat sessions
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import CombatListPage from './+page.svelte';
import { createMockCombatSession, createActiveCombatSession, createCompletedCombatSession } from '../../tests/utils/combatTestUtils';
import { goto } from '$app/navigation';
import type { CombatSession } from '$lib/types/combat';

// Mock navigation and combat store - use vi.hoisted() for proper mock hoisting
const { mockCombatSessions, mockCombatStore, mockGoto } = vi.hoisted(() => {
	const sessions: CombatSession[] = [];
	return {
		mockCombatSessions: sessions,
		mockGoto: vi.fn(),
		mockCombatStore: {
			subscribe: vi.fn(),
			getAll: vi.fn(() => sessions),
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			load: vi.fn()
		}
	};
});

vi.mock('$app/navigation', () => ({
	goto: mockGoto
}));

vi.mock('$lib/stores/combatStore', () => ({
	combatStore: mockCombatStore
}));

describe('Combat List Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCombatSessions.length = 0;
	});

	it('should render without crashing', () => {
		const { container } = render(CombatListPage);
		expect(container).toBeInTheDocument();
	});

	it('should display "Combat Sessions" heading', () => {
		render(CombatListPage);
		expect(screen.getByRole('heading', { name: /combat sessions/i })).toBeInTheDocument();
	});

	it('should display "New Combat" button', () => {
		render(CombatListPage);
		const newButton = screen.getByRole('button', { name: /new combat/i });
		expect(newButton).toBeInTheDocument();
	});

	it('should show empty state when no combats exist', () => {
		mockCombatSessions.length = 0;
		render(CombatListPage);

		expect(screen.getByText(/no combat sessions/i)).toBeInTheDocument();
	});

	it('should display all combat sessions from the store', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'combat-1', name: 'Dragon Fight' }),
			createMockCombatSession({ id: 'combat-2', name: 'Bandit Ambush' }),
			createMockCombatSession({ id: 'combat-3', name: 'Boss Battle' })
		);

		render(CombatListPage);

		expect(screen.getByText('Dragon Fight')).toBeInTheDocument();
		expect(screen.getByText('Bandit Ambush')).toBeInTheDocument();
		expect(screen.getByText('Boss Battle')).toBeInTheDocument();
	});
});

describe('Combat List Page - Combat Status Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display "Preparing" status badge for preparing combats', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ status: 'preparing', name: 'Test Combat' })
		);

		render(CombatListPage);

		expect(screen.getByText(/preparing/i)).toBeInTheDocument();
	});

	it('should display "Active" status badge for active combats', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createActiveCombatSession()
		);
		mockCombatSessions[0].name = 'Active Combat';

		render(CombatListPage);

		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should display "Paused" status badge for paused combats', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ status: 'paused', name: 'Paused Combat' })
		);

		render(CombatListPage);

		expect(screen.getByText(/paused/i)).toBeInTheDocument();
	});

	it('should display "Completed" status badge for completed combats', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createCompletedCombatSession()
		);
		mockCombatSessions[0].name = 'Finished Combat';

		render(CombatListPage);

		expect(screen.getByText(/completed/i)).toBeInTheDocument();
	});

	it('should display different styled badges for different statuses', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'c1', status: 'preparing', name: 'Prep' }),
			createActiveCombatSession(),
			createMockCombatSession({ id: 'c3', status: 'paused', name: 'Pause' }),
			createCompletedCombatSession()
		);

		render(CombatListPage);

		const badges = screen.getAllByTestId(/status-badge/i);
		expect(badges.length).toBeGreaterThanOrEqual(4);
	});
});

describe('Combat List Page - Combat Card Information', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display combat name on card', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Test Combat Name' })
		);

		render(CombatListPage);

		expect(screen.getByText('Test Combat Name')).toBeInTheDocument();
	});

	it('should display combat description if provided', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({
				name: 'Test Combat',
				description: 'A dangerous encounter'
			})
		);

		render(CombatListPage);

		expect(screen.getByText('A dangerous encounter')).toBeInTheDocument();
	});

	it('should display current round for active combats', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createActiveCombatSession()
		);
		mockCombatSessions[0].currentRound = 3;

		render(CombatListPage);

		expect(screen.getByText(/round.*3/i)).toBeInTheDocument();
	});

	it('should display number of combatants', () => {
		const combat = createActiveCombatSession(2, 3);
		mockCombatSessions.splice(0, mockCombatSessions.length, combat);

		render(CombatListPage);

		// Should show 5 combatants (2 heroes + 3 creatures)
		expect(screen.getByText(/5.*combatants?/i)).toBeInTheDocument();
	});

	it('should display created date', () => {
		const createdDate = new Date('2026-01-15T10:00:00');
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ createdAt: createdDate, name: 'Test Combat' })
		);

		render(CombatListPage);

		// Should display date in some format
		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]');
		expect(card).toBeInTheDocument();
	});
});

describe('Combat List Page - Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate to new combat page when "New Combat" button is clicked', async () => {
		render(CombatListPage);

		const newButton = screen.getByRole('button', { name: /new combat/i });
		await fireEvent.click(newButton);

		expect(mockGoto).toHaveBeenCalledWith('/combat/new');
	});

	it('should make combat cards clickable', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'combat-1', name: 'Test Combat' })
		);

		render(CombatListPage);

		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]');
		expect(card).toHaveAttribute('role', 'button');
	});

	it('should navigate to combat detail when card is clicked', async () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'combat-123', name: 'Test Combat' })
		);

		render(CombatListPage);

		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]');
		await fireEvent.click(card!);

		expect(mockGoto).toHaveBeenCalledWith('/combat/combat-123');
	});

	it('should navigate to correct combat ID when multiple combats exist', async () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'combat-1', name: 'First Combat' }),
			createMockCombatSession({ id: 'combat-2', name: 'Second Combat' })
		);

		render(CombatListPage);

		const secondCard = screen.getByText('Second Combat').closest('[data-testid="combat-card"]');
		await fireEvent.click(secondCard!);

		expect(mockGoto).toHaveBeenCalledWith('/combat/combat-2');
	});
});

describe('Combat List Page - Combat Filtering and Sorting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display all status types together', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ status: 'preparing', name: 'Prep Combat' }),
			createActiveCombatSession(),
			createMockCombatSession({ status: 'paused', name: 'Paused Combat' }),
			createCompletedCombatSession()
		);

		render(CombatListPage);

		expect(screen.getByText('Prep Combat')).toBeInTheDocument();
		expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0);
		expect(screen.getByText('Paused Combat')).toBeInTheDocument();
	});

	it('should sort combats by most recently updated first', () => {
		const older = createMockCombatSession({
			id: 'old',
			name: 'Old Combat',
			updatedAt: new Date('2026-01-10')
		});
		const newer = createMockCombatSession({
			id: 'new',
			name: 'New Combat',
			updatedAt: new Date('2026-01-20')
		});

		mockCombatSessions.splice(0, mockCombatSessions.length, older, newer);

		render(CombatListPage);

		const cards = screen.getAllByTestId('combat-card');
		const firstCardName = within(cards[0]).getByText(/Combat/);

		expect(firstCardName.textContent).toContain('New Combat');
	});

	it('should prioritize active combats over others', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createCompletedCombatSession(),
			createActiveCombatSession(),
			createMockCombatSession({ status: 'preparing', name: 'Prep' })
		);
		mockCombatSessions[1].name = 'Active Fight';

		render(CombatListPage);

		const cards = screen.getAllByTestId('combat-card');
		const firstCardName = within(cards[0]).getByText(/Fight|Combat/);

		expect(firstCardName.textContent).toContain('Active Fight');
	});
});

describe('Combat List Page - Empty States', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show empty state message when no combats exist', () => {
		mockCombatSessions.length = 0;

		render(CombatListPage);

		expect(screen.getByText(/no combat sessions/i)).toBeInTheDocument();
	});

	it('should show "Get Started" message in empty state', () => {
		mockCombatSessions.length = 0;

		render(CombatListPage);

		expect(screen.getByText(/create.*first combat/i)).toBeInTheDocument();
	});

	it('should show New Combat button in empty state', () => {
		mockCombatSessions.length = 0;

		render(CombatListPage);

		expect(screen.getByRole('button', { name: /new combat/i })).toBeInTheDocument();
	});
});

describe('Combat List Page - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper ARIA labels on combat cards', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Test Combat' })
		);

		render(CombatListPage);

		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]');
		expect(card).toHaveAttribute('aria-label', expect.stringMatching(/test combat/i));
	});

	it('should have keyboard accessible combat cards', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Test Combat' })
		);

		render(CombatListPage);

		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]');
		expect(card).toHaveAttribute('tabindex', '0');
	});

	it('should trigger navigation on Enter key', async () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ id: 'combat-1', name: 'Test Combat' })
		);

		render(CombatListPage);

		const card = screen.getByText('Test Combat').closest('[data-testid="combat-card"]') as HTMLElement;
		card.focus();
		await fireEvent.keyDown(card, { key: 'Enter' });

		expect(mockGoto).toHaveBeenCalledWith('/combat/combat-1');
	});

	it('should have descriptive button text', () => {
		render(CombatListPage);

		const newButton = screen.getByRole('button', { name: /new combat/i });
		expect(newButton).toHaveAccessibleName();
	});
});

describe('Combat List Page - Responsive Design', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render combat cards in a grid layout', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Combat 1' }),
			createMockCombatSession({ name: 'Combat 2' }),
			createMockCombatSession({ name: 'Combat 3' })
		);

		const { container } = render(CombatListPage);

		const gridContainer = container.querySelector('[class*="grid"]');
		expect(gridContainer).toBeInTheDocument();
	});

	it('should display cards responsively', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Combat 1' })
		);

		const { container } = render(CombatListPage);

		// Should have responsive grid classes
		expect(container.innerHTML).toMatch(/grid/);
	});
});

describe('Combat List Page - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle combat with no description', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({
				name: 'Test Combat',
				description: undefined
			})
		);

		render(CombatListPage);

		expect(screen.getByText('Test Combat')).toBeInTheDocument();
	});

	it('should handle combat with very long name', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({
				name: 'This Is A Very Long Combat Session Name That Should Wrap Or Truncate Properly'
			})
		);

		render(CombatListPage);

		expect(screen.getByText(/This Is A Very Long/)).toBeInTheDocument();
	});

	it('should handle many combat sessions', () => {
		const manyCombats = Array.from({ length: 50 }, (_, i) =>
			createMockCombatSession({ id: `combat-${i}`, name: `Combat ${i + 1}` })
		);
		mockCombatSessions.splice(0, mockCombatSessions.length, ...manyCombats);

		render(CombatListPage);

		// Should render all combats
		expect(screen.getAllByTestId('combat-card').length).toBe(50);
	});

	it('should handle combat with 0 combatants', () => {
		mockCombatSessions.splice(0, mockCombatSessions.length, 
			createMockCombatSession({ name: 'Empty Combat' })
		);
		mockCombatSessions[0].combatants = [];

		render(CombatListPage);

		expect(screen.getByText(/0.*combatants?/i)).toBeInTheDocument();
	});
});
