/**
 * Tests for Negotiation List Page (/negotiation)
 *
 * Issue #388: Write tests for negotiation list page (TDD - RED phase)
 *
 * This page displays all negotiation sessions and allows the user to:
 * - View all negotiation sessions
 * - See negotiation status (preparing, active, completed)
 * - Create new negotiation sessions
 * - Navigate to individual negotiation sessions
 * - Delete negotiations with confirmation
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import NegotiationListPage from './+page.svelte';
import {
	createMockNegotiationSession,
	createActiveNegotiationSession,
	createCompletedNegotiationSession,
	createPreparingNegotiationSession
} from '../../tests/utils/negotiationTestUtils';
import { goto } from '$app/navigation';
import type { NegotiationSession } from '$lib/types/negotiation';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock negotiation store
let mockNegotiationSessions: NegotiationSession[] = [];
const mockNegotiationStore = {
	subscribe: vi.fn(),
	getAll: vi.fn(() => mockNegotiationSessions),
	getById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	load: vi.fn()
};

vi.mock('$lib/stores/negotiation.svelte', () => ({
	negotiationStore: mockNegotiationStore
}));

describe('Negotiation List Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNegotiationSessions = [];
	});

	it('should render without crashing', () => {
		const { container } = render(NegotiationListPage);
		expect(container).toBeInTheDocument();
	});

	it('should display "Negotiations" heading', () => {
		render(NegotiationListPage);
		expect(screen.getByRole('heading', { name: /negotiations/i })).toBeInTheDocument();
	});

	it('should display "New Negotiation" button', () => {
		render(NegotiationListPage);
		const newButton = screen.getByRole('button', { name: /new negotiation/i });
		expect(newButton).toBeInTheDocument();
	});

	it('should show empty state when no negotiations exist', () => {
		mockNegotiationSessions = [];
		render(NegotiationListPage);

		expect(screen.getByText(/no negotiations/i)).toBeInTheDocument();
	});

	it('should display all negotiation sessions from the store', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'Peace Treaty', npcName: 'Lord Varric' }),
			createMockNegotiationSession({ id: 'neg-2', name: 'Trade Agreement', npcName: 'Merchant Guild' }),
			createMockNegotiationSession({ id: 'neg-3', name: 'Alliance', npcName: 'Queen Elara' })
		];

		render(NegotiationListPage);

		expect(screen.getByText('Peace Treaty')).toBeInTheDocument();
		expect(screen.getByText('Trade Agreement')).toBeInTheDocument();
		expect(screen.getByText('Alliance')).toBeInTheDocument();
	});
});

describe('Negotiation List Page - Status Display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display "Preparing" status badge for preparing negotiations', () => {
		mockNegotiationSessions = [
			createPreparingNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Test Negotiation';

		render(NegotiationListPage);

		expect(screen.getByText(/preparing/i)).toBeInTheDocument();
	});

	it('should display "Active" status badge for active negotiations', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Active Negotiation';

		render(NegotiationListPage);

		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should display "Completed" status badge for completed negotiations', () => {
		mockNegotiationSessions = [
			createCompletedNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Finished Negotiation';

		render(NegotiationListPage);

		expect(screen.getByText(/completed/i)).toBeInTheDocument();
	});

	it('should display different styled badges for different statuses', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'n1', status: 'preparing', name: 'Prep' }),
			createActiveNegotiationSession(),
			createCompletedNegotiationSession()
		];
		mockNegotiationSessions[1].id = 'n2';
		mockNegotiationSessions[1].name = 'Active';
		mockNegotiationSessions[2].id = 'n3';
		mockNegotiationSessions[2].name = 'Done';

		render(NegotiationListPage);

		const badges = screen.getAllByTestId(/status-badge/i);
		expect(badges.length).toBeGreaterThanOrEqual(3);
	});

	it('should use gray badge for preparing status', () => {
		mockNegotiationSessions = [
			createPreparingNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Test';

		render(NegotiationListPage);

		const badge = screen.getByTestId(/status-badge/i);
		expect(badge).toHaveClass(/gray|slate/);
	});

	it('should use blue badge for active status', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Test';

		render(NegotiationListPage);

		const badge = screen.getByTestId(/status-badge/i);
		expect(badge).toHaveClass(/blue/);
	});

	it('should use green badge for completed status', () => {
		mockNegotiationSessions = [
			createCompletedNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Test';

		render(NegotiationListPage);

		const badge = screen.getByTestId(/status-badge/i);
		expect(badge).toHaveClass(/green/);
	});
});

describe('Negotiation List Page - Card Information', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display negotiation name on card', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Peace Treaty Negotiation' })
		];

		render(NegotiationListPage);

		expect(screen.getByText('Peace Treaty Negotiation')).toBeInTheDocument();
	});

	it('should display NPC name on card', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({
				name: 'Test Negotiation',
				npcName: 'Lord Varric the Wise'
			})
		];

		render(NegotiationListPage);

		expect(screen.getByText(/Lord Varric the Wise/i)).toBeInTheDocument();
	});

	it('should display current interest level', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].interest = 3;

		render(NegotiationListPage);

		expect(screen.getByText(/interest.*3/i)).toBeInTheDocument();
	});

	it('should display current patience level', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].patience = 2;

		render(NegotiationListPage);

		expect(screen.getByText(/patience.*2/i)).toBeInTheDocument();
	});

	it('should display negotiation description if provided', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({
				name: 'Test Negotiation',
				description: 'Negotiating a peace treaty with the northern kingdom'
			})
		];

		render(NegotiationListPage);

		expect(screen.getByText(/peace treaty with the northern kingdom/i)).toBeInTheDocument();
	});

	it('should display created date', () => {
		const createdDate = new Date('2026-01-15T10:00:00');
		mockNegotiationSessions = [
			createMockNegotiationSession({ createdAt: createdDate, name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]');
		expect(card).toBeInTheDocument();
	});
});

describe('Negotiation List Page - Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate to new negotiation page when "New Negotiation" button is clicked', async () => {
		render(NegotiationListPage);

		const newButton = screen.getByRole('button', { name: /new negotiation/i });
		await fireEvent.click(newButton);

		expect(goto).toHaveBeenCalledWith('/negotiation/new');
	});

	it('should make negotiation cards clickable', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]');
		expect(card).toHaveAttribute('role', 'button');
	});

	it('should navigate to negotiation detail when card is clicked', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-123', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]');
		await fireEvent.click(card!);

		expect(goto).toHaveBeenCalledWith('/negotiation/neg-123');
	});

	it('should navigate to correct negotiation ID when multiple negotiations exist', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'First Negotiation' }),
			createMockNegotiationSession({ id: 'neg-2', name: 'Second Negotiation' })
		];

		render(NegotiationListPage);

		const secondCard = screen.getByText('Second Negotiation').closest('[data-testid="negotiation-card"]');
		await fireEvent.click(secondCard!);

		expect(goto).toHaveBeenCalledWith('/negotiation/neg-2');
	});
});

describe('Negotiation List Page - Sorting', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should sort active negotiations first', () => {
		mockNegotiationSessions = [
			createCompletedNegotiationSession(),
			createActiveNegotiationSession(),
			createPreparingNegotiationSession()
		];
		mockNegotiationSessions[0].name = 'Completed';
		mockNegotiationSessions[1].name = 'Active Fight';
		mockNegotiationSessions[2].name = 'Preparing';

		render(NegotiationListPage);

		const cards = screen.getAllByTestId('negotiation-card');
		const firstCardName = within(cards[0]).getByText(/Active Fight/i);

		expect(firstCardName).toBeInTheDocument();
	});

	it('should sort by most recently updated within status groups', () => {
		const older = createActiveNegotiationSession();
		older.id = 'old';
		older.name = 'Old Active';
		older.updatedAt = new Date('2026-01-10');

		const newer = createActiveNegotiationSession();
		newer.id = 'new';
		newer.name = 'New Active';
		newer.updatedAt = new Date('2026-01-20');

		mockNegotiationSessions = [older, newer];

		render(NegotiationListPage);

		const cards = screen.getAllByTestId('negotiation-card');
		const firstCardName = within(cards[0]).getByText(/New Active/i);

		expect(firstCardName).toBeInTheDocument();
	});
});

describe('Negotiation List Page - Delete Functionality', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display delete button on negotiation cards', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
	});

	it('should show confirmation dialog when delete button is clicked', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(screen.getByText(/confirm.*delete|are you sure/i)).toBeInTheDocument();
	});

	it('should not delete if confirmation is cancelled', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockNegotiationStore.delete).not.toHaveBeenCalled();
	});

	it('should delete negotiation if confirmed', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-123', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		const confirmButton = screen.getByRole('button', { name: /confirm|delete/i });
		await fireEvent.click(confirmButton);

		expect(mockNegotiationStore.delete).toHaveBeenCalledWith('neg-123');
	});

	it('should prevent card navigation when delete button is clicked', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		// Should not navigate to negotiation detail page
		expect(goto).not.toHaveBeenCalled();
	});
});

describe('Negotiation List Page - Empty States', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show empty state message when no negotiations exist', () => {
		mockNegotiationSessions = [];

		render(NegotiationListPage);

		expect(screen.getByText(/no negotiations/i)).toBeInTheDocument();
	});

	it('should show "Get Started" message in empty state', () => {
		mockNegotiationSessions = [];

		render(NegotiationListPage);

		expect(screen.getByText(/create.*first negotiation/i)).toBeInTheDocument();
	});

	it('should show New Negotiation button in empty state', () => {
		mockNegotiationSessions = [];

		render(NegotiationListPage);

		expect(screen.getByRole('button', { name: /new negotiation/i })).toBeInTheDocument();
	});
});

describe('Negotiation List Page - Loading State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading indicator while fetching negotiations', async () => {
		mockNegotiationStore.load.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

		render(NegotiationListPage);

		expect(screen.getByText(/loading/i)).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
		}, { timeout: 200 });
	});
});

describe('Negotiation List Page - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper ARIA labels on negotiation cards', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]');
		expect(card).toHaveAttribute('aria-label', expect.stringMatching(/test negotiation/i));
	});

	it('should have keyboard accessible negotiation cards', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]');
		expect(card).toHaveAttribute('tabindex', '0');
	});

	it('should trigger navigation on Enter key', async () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ id: 'neg-1', name: 'Test Negotiation' })
		];

		render(NegotiationListPage);

		const card = screen.getByText('Test Negotiation').closest('[data-testid="negotiation-card"]') as HTMLElement;
		card.focus();
		await fireEvent.keyDown(card, { key: 'Enter' });

		expect(goto).toHaveBeenCalledWith('/negotiation/neg-1');
	});

	it('should have descriptive button text', () => {
		render(NegotiationListPage);

		const newButton = screen.getByRole('button', { name: /new negotiation/i });
		expect(newButton).toHaveAccessibleName();
	});
});

describe('Negotiation List Page - Responsive Design', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render negotiation cards in a grid layout', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({ name: 'Negotiation 1' }),
			createMockNegotiationSession({ name: 'Negotiation 2' }),
			createMockNegotiationSession({ name: 'Negotiation 3' })
		];

		const { container } = render(NegotiationListPage);

		const gridContainer = container.querySelector('[class*="grid"]');
		expect(gridContainer).toBeInTheDocument();
	});
});

describe('Negotiation List Page - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle negotiation with no description', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({
				name: 'Test Negotiation',
				description: undefined
			})
		];

		render(NegotiationListPage);

		expect(screen.getByText('Test Negotiation')).toBeInTheDocument();
	});

	it('should handle negotiation with very long name', () => {
		mockNegotiationSessions = [
			createMockNegotiationSession({
				name: 'This Is A Very Long Negotiation Session Name That Should Wrap Or Truncate Properly'
			})
		];

		render(NegotiationListPage);

		expect(screen.getByText(/This Is A Very Long/)).toBeInTheDocument();
	});

	it('should handle many negotiation sessions', () => {
		mockNegotiationSessions = Array.from({ length: 50 }, (_, i) =>
			createMockNegotiationSession({ id: `neg-${i}`, name: `Negotiation ${i + 1}` })
		);

		render(NegotiationListPage);

		expect(screen.getAllByTestId('negotiation-card').length).toBe(50);
	});

	it('should handle interest at 0', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].interest = 0;

		render(NegotiationListPage);

		expect(screen.getByText(/interest.*0/i)).toBeInTheDocument();
	});

	it('should handle patience at 0', () => {
		mockNegotiationSessions = [
			createActiveNegotiationSession()
		];
		mockNegotiationSessions[0].patience = 0;

		render(NegotiationListPage);

		expect(screen.getByText(/patience.*0/i)).toBeInTheDocument();
	});
});
