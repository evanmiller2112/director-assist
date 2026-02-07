/**
 * Tests for New Negotiation Page (/negotiation/new)
 *
 * Issue #389: Write tests for new negotiation page (TDD - RED phase)
 *
 * This page allows creating a new negotiation session:
 * - Renders page title "New Negotiation"
 * - Back button linking to /negotiation
 * - Contains NegotiationSetup component
 * - On create event, redirects to /negotiation/[id]
 * - On cancel event, navigates back to list
 *
 * These tests will FAIL until the page is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import NewNegotiationPage from './+page.svelte';
import { goto } from '$app/navigation';
import type { CreateNegotiationInput } from '$lib/types/negotiation';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock negotiation store
const mockCreateNegotiation = vi.fn();
const mockNegotiationStore = {
	subscribe: vi.fn(),
	getAll: vi.fn(),
	getById: vi.fn(),
	create: mockCreateNegotiation,
	update: vi.fn(),
	delete: vi.fn(),
	load: vi.fn()
};

vi.mock('$lib/stores/negotiation.svelte', () => ({
	negotiationStore: mockNegotiationStore
}));

// Mock NegotiationSetup component
vi.mock('$lib/components/negotiation/NegotiationSetup.svelte', () => ({
	default: class MockNegotiationSetup {
		constructor() {}
	}
}));

describe('New Negotiation Page - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(NewNegotiationPage);
		expect(container).toBeInTheDocument();
	});

	it('should display "New Negotiation" heading', () => {
		render(NewNegotiationPage);
		expect(screen.getByRole('heading', { name: /new negotiation/i })).toBeInTheDocument();
	});

	it('should display back button', () => {
		render(NewNegotiationPage);
		expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
	});

	it('should contain NegotiationSetup component', () => {
		const { container } = render(NewNegotiationPage);
		// The component should be present (we check via data-testid or component presence)
		expect(container.querySelector('[data-testid="negotiation-setup"]')).toBeInTheDocument();
	});
});

describe('New Negotiation Page - Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate back to /negotiation when back button is clicked', async () => {
		render(NewNegotiationPage);

		const backButton = screen.getByRole('button', { name: /back/i });
		await fireEvent.click(backButton);

		expect(goto).toHaveBeenCalledWith('/negotiation');
	});

	it('should not navigate away automatically on page load', () => {
		render(NewNegotiationPage);

		expect(goto).not.toHaveBeenCalled();
	});
});

describe('New Negotiation Page - Create Negotiation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateNegotiation.mockResolvedValue('neg-new-123');
	});

	it('should call store.create when NegotiationSetup emits create event', async () => {
		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Peace Treaty',
			npcName: 'Lord Varric',
			description: 'Negotiating peace terms',
			motivations: [
				{ type: 'justice', description: 'Values fairness' }
			],
			pitfalls: [
				{ description: 'Mentions of war' }
			]
		};

		// Simulate the create event from NegotiationSetup
		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalledWith(createData);
		});
	});

	it('should navigate to new negotiation detail page after creation', async () => {
		mockCreateNegotiation.mockResolvedValue('neg-new-123');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/negotiation/neg-new-123');
		});
	});

	it('should navigate to correct ID for different negotiations', async () => {
		mockCreateNegotiation.mockResolvedValue('neg-different-456');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Different',
			npcName: 'Different NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/negotiation/neg-different-456');
		});
	});

	it('should handle create with all fields populated', async () => {
		mockCreateNegotiation.mockResolvedValue('neg-full-789');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Complex Negotiation',
			npcName: 'Queen Elara',
			description: 'A complex diplomatic negotiation',
			motivations: [
				{ type: 'justice', description: 'Seeks fairness' },
				{ type: 'peace', description: 'Wants harmony' },
				{ type: 'protection', description: 'Protects citizens' }
			],
			pitfalls: [
				{ description: 'Mentions of past wars' },
				{ description: 'Threats or aggression' }
			]
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalledWith(createData);
			expect(goto).toHaveBeenCalledWith('/negotiation/neg-full-789');
		});
	});

	it('should handle create with minimal required fields', async () => {
		mockCreateNegotiation.mockResolvedValue('neg-minimal-100');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Minimal',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalledWith(createData);
			expect(goto).toHaveBeenCalledWith('/negotiation/neg-minimal-100');
		});
	});
});

describe('New Negotiation Page - Cancel Handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should navigate back to list when cancel event is emitted', async () => {
		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		await fireEvent(setupComponent, new CustomEvent('cancel'));

		expect(goto).toHaveBeenCalledWith('/negotiation');
	});

	it('should not create negotiation when cancelled', async () => {
		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		await fireEvent(setupComponent, new CustomEvent('cancel'));

		expect(mockCreateNegotiation).not.toHaveBeenCalled();
	});
});

describe('New Negotiation Page - Error Handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle creation errors gracefully', async () => {
		mockCreateNegotiation.mockRejectedValue(new Error('Creation failed'));

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalled();
		});

		// Should not navigate on error
		expect(goto).not.toHaveBeenCalled();
	});

	it('should display error message when creation fails', async () => {
		mockCreateNegotiation.mockRejectedValue(new Error('Database error'));

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
		});
	});

	it('should allow retry after error', async () => {
		mockCreateNegotiation
			.mockRejectedValueOnce(new Error('First attempt failed'))
			.mockResolvedValueOnce('neg-retry-200');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		// First attempt fails
		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
		});

		// Second attempt succeeds
		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith('/negotiation/neg-retry-200');
		});
	});
});

describe('New Negotiation Page - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper heading hierarchy', () => {
		render(NewNegotiationPage);

		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent(/new negotiation/i);
	});

	it('should have accessible back button', () => {
		render(NewNegotiationPage);

		const backButton = screen.getByRole('button', { name: /back/i });
		expect(backButton).toHaveAccessibleName();
	});

	it('should have keyboard accessible back button', () => {
		render(NewNegotiationPage);

		const backButton = screen.getByRole('button', { name: /back/i });
		expect(backButton).not.toHaveAttribute('tabindex', '-1');
	});

	it('should allow keyboard navigation of back button', async () => {
		render(NewNegotiationPage);

		const backButton = screen.getByRole('button', { name: /back/i }) as HTMLElement;
		backButton.focus();

		await fireEvent.keyDown(backButton, { key: 'Enter' });

		expect(goto).toHaveBeenCalledWith('/negotiation');
	});
});

describe('New Negotiation Page - Loading States', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading state during creation', async () => {
		mockCreateNegotiation.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('neg-123'), 100)));

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		expect(screen.getByText(/creating|saving/i)).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.queryByText(/creating|saving/i)).not.toBeInTheDocument();
		}, { timeout: 200 });
	});

	it('should disable form during creation', async () => {
		mockCreateNegotiation.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('neg-123'), 100)));

		const { container } = render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		// Form should be disabled during creation
		const form = container.querySelector('form');
		expect(form).toHaveAttribute('aria-busy', 'true');

		await waitFor(() => {
			expect(form).not.toHaveAttribute('aria-busy', 'true');
		}, { timeout: 200 });
	});
});

describe('New Negotiation Page - Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle rapid back button clicks', async () => {
		render(NewNegotiationPage);

		const backButton = screen.getByRole('button', { name: /back/i });

		await fireEvent.click(backButton);
		await fireEvent.click(backButton);
		await fireEvent.click(backButton);

		// Should only navigate once
		expect(goto).toHaveBeenCalledTimes(1);
		expect(goto).toHaveBeenCalledWith('/negotiation');
	});

	it('should handle creation returning null ID', async () => {
		mockCreateNegotiation.mockResolvedValue(null);

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'Test',
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalled();
		});

		// Should not navigate with null ID
		expect(goto).not.toHaveBeenCalled();
		expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
	});

	it('should handle very long negotiation names', async () => {
		mockCreateNegotiation.mockResolvedValue('neg-long-300');

		render(NewNegotiationPage);

		const setupComponent = screen.getByTestId('negotiation-setup');

		const createData: CreateNegotiationInput = {
			name: 'A'.repeat(500),
			npcName: 'NPC',
			motivations: [],
			pitfalls: []
		};

		await fireEvent(setupComponent, new CustomEvent('create', { detail: createData }));

		await waitFor(() => {
			expect(mockCreateNegotiation).toHaveBeenCalledWith(createData);
		});
	});
});
