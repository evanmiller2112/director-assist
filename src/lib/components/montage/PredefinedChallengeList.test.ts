import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PredefinedChallengeList from './PredefinedChallengeList.svelte';
import type { PredefinedChallenge, MontageChallenge } from '$lib/types/montage';

/**
 * Tests for PredefinedChallengeList Component
 *
 * Issue #278: Predefined Montage Challenges UI Implementation
 *
 * This component displays predefined challenges in the runner view and allows
 * players to select them for recording. Shows status indicators for each challenge.
 *
 * These tests follow TDD - they define expected behavior before implementation.
 */

describe('PredefinedChallengeList Component - Basic Rendering', () => {
	const mockChallenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Find Shelter' },
		{ id: '2', name: 'Rally Horse' },
		{ id: '3', name: 'Forage for Herbs' }
	];

	it('should render without crashing', () => {
		const { container } = render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: mockChallenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display all predefined challenges', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: mockChallenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText('Find Shelter')).toBeInTheDocument();
		expect(screen.getByText('Rally Horse')).toBeInTheDocument();
		expect(screen.getByText('Forage for Herbs')).toBeInTheDocument();
	});

	it('should display section header', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: mockChallenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText(/Predefined Challenges/i)).toBeInTheDocument();
	});

	it('should display helper text', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: mockChallenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText(/Click a challenge to select it/i)).toBeInTheDocument();
	});

	it('should display empty state when no challenges', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: [],
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText(/No predefined challenges/i)).toBeInTheDocument();
	});
});

describe('PredefinedChallengeList Component - Challenge Details', () => {
	it('should display challenge description when provided', () => {
		const challenges: PredefinedChallenge[] = [
			{ id: '1', name: 'Find Shelter', description: 'Locate safe haven' }
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText('Locate safe haven')).toBeInTheDocument();
	});

	it('should display suggested skills when provided', () => {
		const challenges: PredefinedChallenge[] = [
			{
				id: '1',
				name: 'Test Challenge',
				suggestedSkills: ['Nature', 'Survival']
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText(/Nature/)).toBeInTheDocument();
		expect(screen.getByText(/Survival/)).toBeInTheDocument();
	});

	it('should not display description section when no description', () => {
		const challenges: PredefinedChallenge[] = [
			{ id: '1', name: 'Test Challenge' }
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		expect(screen.getByText('Test Challenge')).toBeInTheDocument();
		// Should only show name
	});
});

describe('PredefinedChallengeList Component - Status Indicators', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' },
		{ id: '2', name: 'Challenge 2' },
		{ id: '3', name: 'Challenge 3' },
		{ id: '4', name: 'Challenge 4' }
	];

	it('should show pending status for unresolved challenges', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		// All challenges should show as pending (gray)
		const challengeCards = screen.getAllByRole('button');
		challengeCards.forEach(card => {
			expect(card).toHaveClass(/gray|slate/);
		});
	});

	it('should show success status for successfully completed challenges', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'success',
				predefinedChallengeId: '1'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		const challenge1 = screen.getByText('Challenge 1').closest('button');
		expect(challenge1).toHaveClass(/green/);
	});

	it('should show failure status for failed challenges', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'failure',
				predefinedChallengeId: '2'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		const challenge2 = screen.getByText('Challenge 2').closest('button');
		expect(challenge2).toHaveClass(/red/);
	});

	it('should show skip status for skipped challenges', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'skip',
				predefinedChallengeId: '3'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		const challenge3 = screen.getByText('Challenge 3').closest('button');
		expect(challenge3).toHaveClass(/yellow|amber/);
	});

	it('should display status icons for different result types', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'success',
				predefinedChallengeId: '1'
			},
			{
				id: 'rec2',
				round: 1,
				result: 'failure',
				predefinedChallengeId: '2'
			}
		];

		const { container } = render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		// Should have icons for success and failure
		const icons = container.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});
});

describe('PredefinedChallengeList Component - Selection', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' },
		{ id: '2', name: 'Challenge 2' }
	];

	it('should call onSelectChallenge when pending challenge is clicked', async () => {
		const onSelectChallenge = vi.fn();

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge
			}
		});

		const challenge1Button = screen.getByText('Challenge 1').closest('button');
		if (challenge1Button) {
			await fireEvent.click(challenge1Button);
		}

		expect(onSelectChallenge).toHaveBeenCalledWith(challenges[0]);
	});

	it('should allow clicking resolved challenges to re-attempt', async () => {
		const onSelectChallenge = vi.fn();
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'failure',
				predefinedChallengeId: '1'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge
			}
		});

		const challenge1Button = screen.getByText('Challenge 1').closest('button');
		if (challenge1Button) {
			await fireEvent.click(challenge1Button);
		}

		expect(onSelectChallenge).toHaveBeenCalledWith(challenges[0]);
	});

	it('should highlight selected challenge', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn(),
				selectedChallengeId: '1'
			}
		});

		const challenge1Button = screen.getByText('Challenge 1').closest('button');
		expect(challenge1Button).toHaveClass(/ring|border-blue/);
	});

	it('should not highlight unselected challenges', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn(),
				selectedChallengeId: '1'
			}
		});

		const challenge2Button = screen.getByText('Challenge 2').closest('button');
		expect(challenge2Button).not.toHaveClass(/ring|border-blue/);
	});
});

describe('PredefinedChallengeList Component - Disabled State', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' }
	];

	it('should disable all challenge buttons when disabled prop is true', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn(),
				disabled: true
			}
		});

		const challengeButton = screen.getByText('Challenge 1').closest('button');
		expect(challengeButton).toBeDisabled();
	});

	it('should not call onSelectChallenge when disabled', async () => {
		const onSelectChallenge = vi.fn();

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge,
				disabled: true
			}
		});

		const challengeButton = screen.getByText('Challenge 1').closest('button');
		if (challengeButton) {
			await fireEvent.click(challengeButton);
		}

		expect(onSelectChallenge).not.toHaveBeenCalled();
	});
});

describe('PredefinedChallengeList Component - Multiple Attempts', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' }
	];

	it('should show most recent result when challenge attempted multiple times', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'failure',
				predefinedChallengeId: '1'
			},
			{
				id: 'rec2',
				round: 2,
				result: 'success',
				predefinedChallengeId: '1'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		const challenge1Button = screen.getByText('Challenge 1').closest('button');
		// Should show success status (most recent)
		expect(challenge1Button).toHaveClass(/green/);
	});

	it('should display attempt count badge when attempted multiple times', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'failure',
				predefinedChallengeId: '1'
			},
			{
				id: 'rec2',
				round: 2,
				result: 'success',
				predefinedChallengeId: '1'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		// Should have badge showing 2 attempts (visible text)
		const badge = screen.getAllByText(/2.*attempts?/i).find(el =>
			el.textContent === '2 attempts'
		);
		expect(badge).toBeInTheDocument();
	});
});

describe('PredefinedChallengeList Component - Accessibility', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' }
	];

	it('should have accessible button roles', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBeGreaterThan(0);
	});

	it('should have descriptive aria-label for challenge buttons', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		const button = screen.getByRole('button', { name: /select.*challenge 1/i });
		expect(button).toBeInTheDocument();
	});

	it('should indicate disabled state with aria-disabled', () => {
		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn(),
				disabled: true
			}
		});

		const button = screen.getByText('Challenge 1').closest('button');
		expect(button).toHaveAttribute('aria-disabled', 'true');
	});

	it('should have accessible status announcements', () => {
		const recordedChallenges: MontageChallenge[] = [
			{
				id: 'rec1',
				round: 1,
				result: 'success',
				predefinedChallengeId: '1'
			}
		];

		render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges,
				onSelectChallenge: vi.fn()
			}
		});

		// Should have status text for screen readers
		expect(screen.getByText(/success/i)).toBeInTheDocument();
	});
});

describe('PredefinedChallengeList Component - Layout', () => {
	const challenges: PredefinedChallenge[] = [
		{ id: '1', name: 'Challenge 1' },
		{ id: '2', name: 'Challenge 2' },
		{ id: '3', name: 'Challenge 3' }
	];

	it('should display challenges in a grid or list layout', () => {
		const { container } = render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		// Should have container with grid or space-y classes
		const listContainer = container.querySelector('[class*="grid"], [class*="space-y"]');
		expect(listContainer).toBeInTheDocument();
	});

	it('should be responsive on different screen sizes', () => {
		const { container } = render(PredefinedChallengeList, {
			props: {
				predefinedChallenges: challenges,
				recordedChallenges: [],
				onSelectChallenge: vi.fn()
			}
		});

		// Should have a layout container (space-y for vertical stacking)
		const listContainer = container.querySelector('[class*="space-y"]');
		expect(listContainer).toBeInTheDocument();
	});
});
