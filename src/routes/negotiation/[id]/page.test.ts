/**
 * Tests for Negotiation Runner Page (/negotiation/[id])
 *
 * Issue #390: Write tests for negotiation runner page (TDD - RED phase)
 *
 * This page is the main negotiation interface where the GM runs negotiations, including:
 * - Loading negotiation by ID from URL params
 * - Showing 404 or redirect if negotiation not found
 * - Header shows NPC name and status badge
 * - Different UI for preparing, active, and completed states
 * - Argument tracking and history
 * - Interest/patience management
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import NegotiationRunnerPage from './+page.svelte';
import {
	createMockNegotiationSession,
	createPreparingNegotiationSession,
	createActiveNegotiationSession,
	createCompletedNegotiationSession,
	createLowPatienceNegotiationSession,
	createHighInterestNegotiationSession
} from '../../../tests/utils/negotiationTestUtils';
import type { NegotiationSession } from '$lib/types/negotiation';

// Mock page params
let mockParams = { id: 'neg-123' };
const mockPage = {
	params: mockParams
};

vi.mock('$app/stores', () => ({
	page: {
		subscribe: (fn: (value: typeof mockPage) => void) => {
			fn(mockPage);
			return () => {};
		}
	}
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock negotiation store
let mockCurrentNegotiation: NegotiationSession | null = null;
const mockNegotiationStore = {
	subscribe: vi.fn(),
	getById: vi.fn((id: string) => mockCurrentNegotiation),
	update: vi.fn(),
	startNegotiation: vi.fn(),
	recordArgument: vi.fn(),
	endNegotiation: vi.fn(),
	reopenNegotiation: vi.fn(),
	updateMotivation: vi.fn(),
	updatePitfall: vi.fn()
};

vi.mock('$lib/stores/negotiation.svelte', () => ({
	negotiationStore: mockNegotiationStore
}));

describe('Negotiation Runner Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.name = 'Test Negotiation';
		mockCurrentNegotiation.npcName = 'Lord Varric';
	});

	it('should render without crashing', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container).toBeInTheDocument();
	});

	it('should load negotiation by ID from URL params', () => {
		render(NegotiationRunnerPage);
		expect(mockNegotiationStore.getById).toHaveBeenCalledWith('neg-123');
	});

	it('should display negotiation name', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText('Test Negotiation')).toBeInTheDocument();
	});

	it('should display NPC name', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText(/Lord Varric/i)).toBeInTheDocument();
	});

	it('should display status badge', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByTestId('status-badge')).toBeInTheDocument();
	});

	it('should show "Not Found" message when negotiation does not exist', () => {
		mockCurrentNegotiation = null;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/negotiation.*not found|not found/i)).toBeInTheDocument();
	});

	it('should show link to return to list when negotiation not found', () => {
		mockCurrentNegotiation = null;
		render(NegotiationRunnerPage);

		expect(screen.getByRole('link', { name: /back.*list|return.*negotiations/i })).toBeInTheDocument();
	});
});

describe('Negotiation Runner Page - Preparing State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createPreparingNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.name = 'Preparing Negotiation';
	});

	it('should display "Preparing" status badge', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText(/preparing/i)).toBeInTheDocument();
	});

	it('should show NegotiationSetup component for editing', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="negotiation-setup"]')).toBeInTheDocument();
	});

	it('should display "Start Negotiation" button', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByRole('button', { name: /start.*negotiation/i })).toBeInTheDocument();
	});

	it('should call startNegotiation when "Start Negotiation" button is clicked', async () => {
		render(NegotiationRunnerPage);

		const startButton = screen.getByRole('button', { name: /start.*negotiation/i });
		await fireEvent.click(startButton);

		expect(mockNegotiationStore.startNegotiation).toHaveBeenCalledWith('neg-123');
	});

	it('should allow modifying motivations in preparing state', () => {
		render(NegotiationRunnerPage);

		const setupComponent = screen.getByTestId('negotiation-setup');
		expect(setupComponent).toBeInTheDocument();
	});

	it('should allow modifying pitfalls in preparing state', () => {
		render(NegotiationRunnerPage);

		const setupComponent = screen.getByTestId('negotiation-setup');
		expect(setupComponent).toBeInTheDocument();
	});

	it('should allow adjusting starting interest', () => {
		render(NegotiationRunnerPage);

		const interestSelect = screen.getByLabelText(/starting.*interest/i);
		expect(interestSelect).toBeInTheDocument();
	});

	it('should allow adjusting starting patience', () => {
		render(NegotiationRunnerPage);

		const patienceSelect = screen.getByLabelText(/starting.*patience/i);
		expect(patienceSelect).toBeInTheDocument();
	});

	it('should save changes when starting negotiation', async () => {
		render(NegotiationRunnerPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		// Simulate editing
		await fireEvent(setupComponent, new CustomEvent('update', {
			detail: {
				interest: 3,
				patience: 4
			}
		}));

		const startButton = screen.getByRole('button', { name: /start.*negotiation/i });
		await fireEvent.click(startButton);

		expect(mockNegotiationStore.update).toHaveBeenCalled();
		expect(mockNegotiationStore.startNegotiation).toHaveBeenCalledWith('neg-123');
	});
});

describe('Negotiation Runner Page - Active State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.name = 'Active Negotiation';
	});

	it('should display "Active" status badge', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});

	it('should show NegotiationProgress component', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="negotiation-progress"]')).toBeInTheDocument();
	});

	it('should show MotivationPitfallPanel', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="motivation-pitfall-panel"]')).toBeInTheDocument();
	});

	it('should show ArgumentControls', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="argument-controls"]')).toBeInTheDocument();
	});

	it('should display current interest level', () => {
		mockCurrentNegotiation!.interest = 3;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/interest.*3/i)).toBeInTheDocument();
	});

	it('should display current patience level', () => {
		mockCurrentNegotiation!.patience = 2;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/patience.*2/i)).toBeInTheDocument();
	});

	it('should show current "offer preview" based on interest', () => {
		mockCurrentNegotiation!.interest = 4;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/success|full.*agreement/i)).toBeInTheDocument();
	});

	it('should display offer preview for interest 0 (hostile)', () => {
		mockCurrentNegotiation!.interest = 0;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/hostile/i)).toBeInTheDocument();
	});

	it('should display offer preview for interest 2 (lesser offer)', () => {
		mockCurrentNegotiation!.interest = 2;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/lesser.*offer/i)).toBeInTheDocument();
	});

	it('should display offer preview for interest 5 (full success)', () => {
		mockCurrentNegotiation = createHighInterestNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.interest = 5;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/full.*success|everything.*bonus/i)).toBeInTheDocument();
	});

	it('should display "End Negotiation" button', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByRole('button', { name: /end.*negotiation/i })).toBeInTheDocument();
	});

	it('should call endNegotiation when "End Negotiation" button is clicked', async () => {
		render(NegotiationRunnerPage);

		const endButton = screen.getByRole('button', { name: /end.*negotiation/i });
		await fireEvent.click(endButton);

		expect(mockNegotiationStore.endNegotiation).toHaveBeenCalledWith('neg-123');
	});

	it('should show confirmation before ending negotiation', async () => {
		render(NegotiationRunnerPage);

		const endButton = screen.getByRole('button', { name: /end.*negotiation/i });
		await fireEvent.click(endButton);

		expect(screen.getByText(/confirm.*end|are you sure/i)).toBeInTheDocument();
	});

	it('should not end negotiation if cancelled', async () => {
		render(NegotiationRunnerPage);

		const endButton = screen.getByRole('button', { name: /end.*negotiation/i });
		await fireEvent.click(endButton);

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockNegotiationStore.endNegotiation).not.toHaveBeenCalled();
	});
});

describe('Negotiation Runner Page - Argument History', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
	});

	it('should display argument history list', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="argument-history"]')).toBeInTheDocument();
	});

	it('should display all arguments in history', () => {
		render(NegotiationRunnerPage);

		mockCurrentNegotiation!.arguments.forEach(arg => {
			expect(screen.getByText(arg.description)).toBeInTheDocument();
		});
	});

	it('should show ArgumentCard for each argument', () => {
		render(NegotiationRunnerPage);

		const argumentCards = screen.getAllByTestId(/argument-card/i);
		expect(argumentCards.length).toBe(mockCurrentNegotiation!.arguments.length);
	});

	it('should display argument tier', () => {
		render(NegotiationRunnerPage);

		const firstArg = mockCurrentNegotiation!.arguments[0];
		expect(screen.getByText(new RegExp(`tier.*${firstArg.tier}`, 'i'))).toBeInTheDocument();
	});

	it('should display argument type (motivation/no_motivation/pitfall)', () => {
		render(NegotiationRunnerPage);

		const firstArg = mockCurrentNegotiation!.arguments[0];
		if (firstArg.type === 'motivation') {
			expect(screen.getByText(/motivation/i)).toBeInTheDocument();
		}
	});

	it('should display player name for each argument', () => {
		render(NegotiationRunnerPage);

		mockCurrentNegotiation!.arguments.forEach(arg => {
			if (arg.playerName) {
				expect(screen.getByText(new RegExp(arg.playerName, 'i'))).toBeInTheDocument();
			}
		});
	});

	it('should display interest change for each argument', () => {
		render(NegotiationRunnerPage);

		const firstArg = mockCurrentNegotiation!.arguments[0];
		expect(screen.getByText(new RegExp(`[+-]${Math.abs(firstArg.interestChange)}.*interest`, 'i'))).toBeInTheDocument();
	});

	it('should display patience change for each argument', () => {
		render(NegotiationRunnerPage);

		const firstArg = mockCurrentNegotiation!.arguments[0];
		expect(screen.getByText(new RegExp(`[+-]${Math.abs(firstArg.patienceChange)}.*patience`, 'i'))).toBeInTheDocument();
	});

	it('should show arguments in chronological order (newest first)', () => {
		render(NegotiationRunnerPage);

		const argumentCards = screen.getAllByTestId(/argument-card/i);
		const firstCard = argumentCards[0];
		const lastArg = mockCurrentNegotiation!.arguments[mockCurrentNegotiation!.arguments.length - 1];

		expect(within(firstCard).getByText(lastArg.description)).toBeInTheDocument();
	});

	it('should handle empty argument history', () => {
		mockCurrentNegotiation!.arguments = [];
		render(NegotiationRunnerPage);

		expect(screen.getByText(/no arguments.*yet|no arguments.*made/i)).toBeInTheDocument();
	});
});

describe('Negotiation Runner Page - Recording Arguments', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
	});

	it('should allow recording a motivation argument', async () => {
		render(NegotiationRunnerPage);

		const argumentControls = screen.getByTestId('argument-controls');

		await fireEvent(argumentControls, new CustomEvent('record', {
			detail: {
				type: 'motivation',
				tier: 2,
				description: 'Appeal to justice',
				motivationType: 'justice'
			}
		}));

		expect(mockNegotiationStore.recordArgument).toHaveBeenCalledWith(
			'neg-123',
			expect.objectContaining({
				type: 'motivation',
				tier: 2,
				motivationType: 'justice'
			})
		);
	});

	it('should allow recording a no_motivation argument', async () => {
		render(NegotiationRunnerPage);

		const argumentControls = screen.getByTestId('argument-controls');

		await fireEvent(argumentControls, new CustomEvent('record', {
			detail: {
				type: 'no_motivation',
				tier: 1,
				description: 'Generic appeal'
			}
		}));

		expect(mockNegotiationStore.recordArgument).toHaveBeenCalledWith(
			'neg-123',
			expect.objectContaining({
				type: 'no_motivation',
				tier: 1
			})
		);
	});

	it('should allow recording a pitfall argument', async () => {
		render(NegotiationRunnerPage);

		const argumentControls = screen.getByTestId('argument-controls');

		await fireEvent(argumentControls, new CustomEvent('record', {
			detail: {
				type: 'pitfall',
				tier: 2,
				description: 'Mentioned war'
			}
		}));

		expect(mockNegotiationStore.recordArgument).toHaveBeenCalledWith(
			'neg-123',
			expect.objectContaining({
				type: 'pitfall',
				tier: 2
			})
		);
	});

	it('should update interest and patience after recording argument', async () => {
		mockNegotiationStore.recordArgument.mockImplementation(() => {
			mockCurrentNegotiation!.interest = 5;
			mockCurrentNegotiation!.patience = 1;
		});

		render(NegotiationRunnerPage);

		const argumentControls = screen.getByTestId('argument-controls');

		await fireEvent(argumentControls, new CustomEvent('record', {
			detail: {
				type: 'motivation',
				tier: 3,
				description: 'Strong appeal',
				motivationType: 'peace'
			}
		}));

		await waitFor(() => {
			expect(screen.getByText(/interest.*5/i)).toBeInTheDocument();
			expect(screen.getByText(/patience.*1/i)).toBeInTheDocument();
		});
	});

	it('should auto-end negotiation when patience reaches 0', async () => {
		mockCurrentNegotiation = createLowPatienceNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.patience = 1;

		mockNegotiationStore.recordArgument.mockImplementation(() => {
			mockCurrentNegotiation!.patience = 0;
		});

		render(NegotiationRunnerPage);

		const argumentControls = screen.getByTestId('argument-controls');

		await fireEvent(argumentControls, new CustomEvent('record', {
			detail: {
				type: 'no_motivation',
				tier: 1,
				description: 'Final argument'
			}
		}));

		await waitFor(() => {
			expect(mockNegotiationStore.endNegotiation).toHaveBeenCalledWith('neg-123');
		});
	});
});

describe('Negotiation Runner Page - Completed State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createCompletedNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.name = 'Completed Negotiation';
	});

	it('should display "Completed" status badge', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText(/completed/i)).toBeInTheDocument();
	});

	it('should show NegotiationOutcomeDisplay component', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="negotiation-outcome"]')).toBeInTheDocument();
	});

	it('should display final offer summary', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByText(/full.*success|outcome/i)).toBeInTheDocument();
	});

	it('should display final interest level', () => {
		mockCurrentNegotiation!.interest = 5;
		render(NegotiationRunnerPage);

		expect(screen.getByText(/interest.*5/i)).toBeInTheDocument();
	});

	it('should show argument history in readonly mode', () => {
		render(NegotiationRunnerPage);

		const argumentHistory = screen.getByTestId('argument-history');
		expect(argumentHistory).toHaveAttribute('aria-readonly', 'true');
	});

	it('should display "Reopen Negotiation" button', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByRole('button', { name: /reopen.*negotiation/i })).toBeInTheDocument();
	});

	it('should display "Back to List" button', () => {
		render(NegotiationRunnerPage);
		expect(screen.getByRole('button', { name: /back.*list/i })).toBeInTheDocument();
	});

	it('should call reopenNegotiation when "Reopen Negotiation" button is clicked', async () => {
		render(NegotiationRunnerPage);

		const reopenButton = screen.getByRole('button', { name: /reopen.*negotiation/i });
		await fireEvent.click(reopenButton);

		expect(mockNegotiationStore.reopenNegotiation).toHaveBeenCalledWith('neg-123');
	});

	it('should navigate to list when "Back to List" button is clicked', async () => {
		const { goto } = await import('$app/navigation');

		render(NegotiationRunnerPage);

		const backButton = screen.getByRole('button', { name: /back.*list/i });
		await fireEvent.click(backButton);

		expect(goto).toHaveBeenCalledWith('/negotiation');
	});

	it('should not show ArgumentControls in completed state', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="argument-controls"]')).not.toBeInTheDocument();
	});

	it('should not allow editing motivations/pitfalls in completed state', () => {
		const { container } = render(NegotiationRunnerPage);
		expect(container.querySelector('[data-testid="negotiation-setup"]')).not.toBeInTheDocument();
	});

	it('should show all arguments made during negotiation', () => {
		render(NegotiationRunnerPage);

		mockCurrentNegotiation!.arguments.forEach(arg => {
			expect(screen.getByText(arg.description)).toBeInTheDocument();
		});
	});

	it('should display outcome based on final interest', () => {
		mockCurrentNegotiation!.interest = 5;
		mockCurrentNegotiation!.outcome = 'success_full';

		render(NegotiationRunnerPage);

		expect(screen.getByText(/full.*success/i)).toBeInTheDocument();
	});

	it('should show hostile outcome for interest 0', () => {
		mockCurrentNegotiation!.interest = 0;
		mockCurrentNegotiation!.outcome = 'hostile';

		render(NegotiationRunnerPage);

		expect(screen.getByText(/hostile/i)).toBeInTheDocument();
	});

	it('should show compromise outcome for interest 3', () => {
		mockCurrentNegotiation!.interest = 3;
		mockCurrentNegotiation!.outcome = 'compromise';

		render(NegotiationRunnerPage);

		expect(screen.getByText(/compromise/i)).toBeInTheDocument();
	});
});

describe('Negotiation Runner Page - Motivation/Pitfall Panel', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
	});

	it('should display all motivations', () => {
		render(NegotiationRunnerPage);

		mockCurrentNegotiation!.motivations.forEach(motivation => {
			expect(screen.getByText(new RegExp(motivation.type, 'i'))).toBeInTheDocument();
		});
	});

	it('should display all pitfalls', () => {
		render(NegotiationRunnerPage);

		mockCurrentNegotiation!.pitfalls.forEach(pitfall => {
			expect(screen.getByText(new RegExp(pitfall.description, 'i'))).toBeInTheDocument();
		});
	});

	it('should show known state for motivations', () => {
		render(NegotiationRunnerPage);

		const knownMotivations = mockCurrentNegotiation!.motivations.filter(m => m.isKnown);
		expect(knownMotivations.length).toBeGreaterThan(0);
	});

	it('should show usage count for motivations', () => {
		const usedMotivation = mockCurrentNegotiation!.motivations.find(m => m.timesUsed > 0);
		if (usedMotivation) {
			render(NegotiationRunnerPage);
			expect(screen.getByText(new RegExp(`${usedMotivation.timesUsed}.*times?.*used`, 'i'))).toBeInTheDocument();
		}
	});

	it('should allow revealing unknown motivations', async () => {
		render(NegotiationRunnerPage);

		const unknownMotivation = mockCurrentNegotiation!.motivations.find(m => !m.isKnown);
		if (unknownMotivation) {
			const revealButton = screen.getByRole('button', { name: new RegExp(`reveal.*${unknownMotivation.type}`, 'i') });
			await fireEvent.click(revealButton);

			expect(mockNegotiationStore.updateMotivation).toHaveBeenCalled();
		}
	});

	it('should allow revealing unknown pitfalls', async () => {
		render(NegotiationRunnerPage);

		const unknownPitfall = mockCurrentNegotiation!.pitfalls.find(p => !p.isKnown);
		if (unknownPitfall) {
			const revealButton = screen.getByRole('button', { name: /reveal/i });
			await fireEvent.click(revealButton);

			expect(mockNegotiationStore.updatePitfall).toHaveBeenCalled();
		}
	});
});

describe('Negotiation Runner Page - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
	});

	it('should have proper heading hierarchy', () => {
		render(NegotiationRunnerPage);

		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();
	});

	it('should have ARIA labels on control buttons', () => {
		render(NegotiationRunnerPage);

		const endButton = screen.getByRole('button', { name: /end.*negotiation/i });
		expect(endButton).toHaveAccessibleName();
	});

	it('should have keyboard accessible controls', () => {
		render(NegotiationRunnerPage);

		const endButton = screen.getByRole('button', { name: /end.*negotiation/i });
		expect(endButton).not.toHaveAttribute('tabindex', '-1');
	});

	it('should announce interest/patience changes to screen readers', () => {
		const { container } = render(NegotiationRunnerPage);

		const progressDisplay = container.querySelector('[data-testid="negotiation-progress"]');
		expect(progressDisplay).toHaveAttribute('role', 'status');
		expect(progressDisplay).toHaveAttribute('aria-live', 'polite');
	});
});

describe('Negotiation Runner Page - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle invalid negotiation ID', () => {
		mockCurrentNegotiation = null;
		mockParams.id = 'invalid-id';

		render(NegotiationRunnerPage);

		expect(screen.getByText(/negotiation.*not found/i)).toBeInTheDocument();
	});

	it('should handle negotiation with no motivations', () => {
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.motivations = [];

		render(NegotiationRunnerPage);

		expect(screen.getByText(/no motivations/i)).toBeInTheDocument();
	});

	it('should handle negotiation with no pitfalls', () => {
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.pitfalls = [];

		render(NegotiationRunnerPage);

		expect(screen.getByText(/no pitfalls/i)).toBeInTheDocument();
	});

	it('should handle interest at maximum (5)', () => {
		mockCurrentNegotiation = createHighInterestNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.interest = 5;

		render(NegotiationRunnerPage);

		expect(screen.getByText(/interest.*5/i)).toBeInTheDocument();
	});

	it('should handle patience at 0', () => {
		mockCurrentNegotiation = createLowPatienceNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.patience = 0;

		render(NegotiationRunnerPage);

		expect(screen.getByText(/patience.*0/i)).toBeInTheDocument();
		// Should automatically end or show warning
		expect(screen.getByText(/patience.*exhausted|negotiation.*ended/i)).toBeInTheDocument();
	});

	it('should handle very long argument descriptions', () => {
		mockCurrentNegotiation = createActiveNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';
		mockCurrentNegotiation.arguments[0].description = 'A'.repeat(500);

		render(NegotiationRunnerPage);

		expect(screen.getByText(/A{10,}/)).toBeInTheDocument();
	});

	it('should handle switching between states (preparing to active)', async () => {
		mockCurrentNegotiation = createPreparingNegotiationSession();
		mockCurrentNegotiation.id = 'neg-123';

		const { rerender } = render(NegotiationRunnerPage);

		expect(screen.getByText(/preparing/i)).toBeInTheDocument();

		// Change to active
		mockCurrentNegotiation.status = 'active';
		rerender({});

		expect(screen.getByText(/active/i)).toBeInTheDocument();
	});
});
