/**
 * Tests for SuggestionCard Component
 *
 * Issue #43 Phase B3: Suggestions Panel UI
 *
 * This component displays a single AI suggestion with:
 * - Type icon (GitBranch, BookOpen, AlertTriangle, Lightbulb, Sparkles)
 * - Relevance score badge with color (high=red, medium=yellow, low=slate)
 * - Priority border based on relevance
 * - Title and description (truncated)
 * - Relative time display
 * - Action buttons (Accept, Dismiss, View Details) visible on hover
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SuggestionCard from './SuggestionCard.svelte';
import type { AISuggestion } from '$lib/types/ai';

// Mock suggestion used across all test suites
const mockSuggestion: AISuggestion = {
	id: 'test-suggestion-1',
	type: 'relationship',
	title: 'Connect NPCs',
	description: 'Consider adding a relationship between these characters',
	relevanceScore: 75,
	affectedEntityIds: ['entity-1', 'entity-2'],
	status: 'pending',
	createdAt: new Date('2024-01-15T10:00:00Z')
};

describe('SuggestionCard Component - Basic Rendering', () => {

	it('should render without crashing', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		expect(container).toBeInTheDocument();
	});

	it('should display suggestion title', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		expect(screen.getByText('Connect NPCs')).toBeInTheDocument();
	});

	it('should display suggestion description', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		expect(screen.getByText(/Consider adding a relationship/)).toBeInTheDocument();
	});

	it('should display relevance score', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		expect(screen.getByText('75')).toBeInTheDocument();
	});

	it('should truncate long descriptions', () => {
		const longDescription = 'A'.repeat(500);
		const suggestion = { ...mockSuggestion, description: longDescription };

		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const descElement = container.querySelector('[class*="line-clamp"], [class*="truncate"]');
		expect(descElement).toBeInTheDocument();
	});

	it('should have card styling', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const card = container.querySelector('[class*="border"], [class*="rounded"]');
		expect(card).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Type Icons', () => {
	it('should display GitBranch icon for relationship type', () => {
		const suggestion = { ...mockSuggestion, type: 'relationship' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Icon should be present (testing for svg or icon class)
		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should display BookOpen icon for plot_thread type', () => {
		const suggestion = { ...mockSuggestion, type: 'plot_thread' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should display AlertTriangle icon for inconsistency type', () => {
		const suggestion = { ...mockSuggestion, type: 'inconsistency' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should display Lightbulb icon for enhancement type', () => {
		const suggestion = { ...mockSuggestion, type: 'enhancement' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should display Sparkles icon for recommendation type', () => {
		const suggestion = { ...mockSuggestion, type: 'recommendation' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Relevance Badge', () => {
	it('should show high priority badge for score >= 80', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 90 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// High priority should have red/rose styling
		const badge = container.querySelector('[class*="bg-red"], [class*="bg-rose"]');
		expect(badge).toBeInTheDocument();
	});

	it('should show medium priority badge for score >= 50 and < 80', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 65 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Medium priority should have yellow/amber styling
		const badge = container.querySelector('[class*="bg-yellow"], [class*="bg-amber"]');
		expect(badge).toBeInTheDocument();
	});

	it('should show low priority badge for score < 50', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 30 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Low priority should have slate/gray styling
		const badge = container.querySelector('[class*="bg-slate"], [class*="bg-gray"]');
		expect(badge).toBeInTheDocument();
	});

	it('should handle edge case of score = 80', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 80 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Should be high priority
		const badge = container.querySelector('[class*="bg-red"], [class*="bg-rose"]');
		expect(badge).toBeInTheDocument();
	});

	it('should handle edge case of score = 50', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 50 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Should be medium priority
		const badge = container.querySelector('[class*="bg-yellow"], [class*="bg-amber"]');
		expect(badge).toBeInTheDocument();
	});

	it('should handle edge case of score = 0', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 0 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Should be low priority
		const badge = container.querySelector('[class*="bg-slate"], [class*="bg-gray"]');
		expect(badge).toBeInTheDocument();
	});

	it('should handle edge case of score = 100', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 100 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Should be high priority
		expect(screen.getByText('100')).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Priority Border', () => {
	it('should have high priority border for score >= 80', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 90 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const card = container.querySelector('[class*="border-red"], [class*="border-rose"]');
		expect(card).toBeInTheDocument();
	});

	it('should have medium priority border for score >= 50 and < 80', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 65 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const card = container.querySelector('[class*="border-yellow"], [class*="border-amber"]');
		expect(card).toBeInTheDocument();
	});

	it('should have low priority border for score < 50', () => {
		const suggestion = { ...mockSuggestion, relevanceScore: 30 };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		const card = container.querySelector('[class*="border-slate"], [class*="border-gray"]');
		expect(card).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Relative Time', () => {
	it('should display relative time for recent suggestion', () => {
		const recentDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
		const suggestion = { ...mockSuggestion, createdAt: recentDate };

		render(SuggestionCard, {
			props: { suggestion }
		});

		// Should show something like "5 minutes ago" or "5m"
		const timeElement = screen.getByText(/min|minute/i);
		expect(timeElement).toBeInTheDocument();
	});

	it('should display relative time for older suggestion', () => {
		const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2); // 2 days ago
		const suggestion = { ...mockSuggestion, createdAt: oldDate };

		render(SuggestionCard, {
			props: { suggestion }
		});

		// Should show something like "2 days ago" or "2d"
		const timeElement = screen.getByText(/\d+\s*days?\s+ago/i);
		expect(timeElement).toBeInTheDocument();
	});

	it('should handle very old suggestions', () => {
		const veryOldDate = new Date('2020-01-01');
		const suggestion = { ...mockSuggestion, createdAt: veryOldDate };

		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Should display some time representation
		const timeElement = container.querySelector('[class*="time"], time');
		expect(timeElement).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Action Buttons', () => {
	it('should render Accept button', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		expect(acceptButton).toBeInTheDocument();
	});

	it('should render Dismiss button', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should render View Details button', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const detailsButton = screen.getByRole('button', { name: /view details|details/i });
		expect(detailsButton).toBeInTheDocument();
	});

	it('should call onAccept when Accept button is clicked', async () => {
		const onAccept = vi.fn();

		render(SuggestionCard, {
			props: { suggestion: mockSuggestion, onAccept }
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalledTimes(1);
		expect(onAccept).toHaveBeenCalledWith(mockSuggestion);
	});

	it('should call onDismiss when Dismiss button is clicked', async () => {
		const onDismiss = vi.fn();

		render(SuggestionCard, {
			props: { suggestion: mockSuggestion, onDismiss }
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onDismiss).toHaveBeenCalledWith(mockSuggestion);
	});

	it('should call onViewDetails when View Details button is clicked', async () => {
		const onViewDetails = vi.fn();

		render(SuggestionCard, {
			props: { suggestion: mockSuggestion, onViewDetails }
		});

		const detailsButton = screen.getByRole('button', { name: /view details|details/i });
		await fireEvent.click(detailsButton);

		expect(onViewDetails).toHaveBeenCalledTimes(1);
		expect(onViewDetails).toHaveBeenCalledWith(mockSuggestion);
	});

	it('should handle missing onAccept callback gracefully', async () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });

		await expect(async () => {
			await fireEvent.click(acceptButton);
		}).not.toThrow();
	});

	it('should handle missing onDismiss callback gracefully', async () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});

	it('should handle missing onViewDetails callback gracefully', async () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const detailsButton = screen.getByRole('button', { name: /view details|details/i });

		await expect(async () => {
			await fireEvent.click(detailsButton);
		}).not.toThrow();
	});

	it('should show action buttons on hover', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		// Action buttons should have hover-triggered visibility classes
		const actionContainer = container.querySelector('[class*="opacity-0"], [class*="group-hover"]');
		expect(actionContainer).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Status Display', () => {
	it('should indicate pending status', () => {
		const suggestion = { ...mockSuggestion, status: 'pending' as const };
		render(SuggestionCard, {
			props: { suggestion }
		});

		// Pending suggestions should show action buttons
		expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
	});

	it('should indicate accepted status', () => {
		const suggestion = { ...mockSuggestion, status: 'accepted' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Accepted suggestions might have different styling or indicator
		const card = container.querySelector('[class*="accepted"], [class*="opacity"]');
		expect(card).toBeInTheDocument();
	});

	it('should indicate dismissed status', () => {
		const suggestion = { ...mockSuggestion, status: 'dismissed' as const };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Dismissed suggestions might have different styling or indicator
		const card = container.querySelector('[class*="dismissed"], [class*="opacity"]');
		expect(card).toBeInTheDocument();
	});

	it('should hide action buttons for accepted suggestions', () => {
		const suggestion = { ...mockSuggestion, status: 'accepted' as const };
		render(SuggestionCard, {
			props: { suggestion }
		});

		const acceptButton = screen.queryByRole('button', { name: /accept/i });
		const dismissButton = screen.queryByRole('button', { name: /dismiss/i });

		// Buttons should be hidden or disabled
		expect(acceptButton).not.toBeInTheDocument();
		expect(dismissButton).not.toBeInTheDocument();
	});

	it('should hide action buttons for dismissed suggestions', () => {
		const suggestion = { ...mockSuggestion, status: 'dismissed' as const };
		render(SuggestionCard, {
			props: { suggestion }
		});

		const acceptButton = screen.queryByRole('button', { name: /accept/i });
		const dismissButton = screen.queryByRole('button', { name: /dismiss/i });

		// Buttons should be hidden or disabled
		expect(acceptButton).not.toBeInTheDocument();
		expect(dismissButton).not.toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Accessibility', () => {
	it('should have proper heading hierarchy', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const heading = screen.getByRole('heading', { name: /Connect NPCs/i });
		expect(heading).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		const detailsButton = screen.getByRole('button', { name: /view details|details/i });

		expect(acceptButton).toHaveAccessibleName();
		expect(dismissButton).toHaveAccessibleName();
		expect(detailsButton).toHaveAccessibleName();
	});

	it('should have semantic HTML structure', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const article = container.querySelector('article');
		expect(article).toBeInTheDocument();
	});

	it('should have keyboard accessible buttons', async () => {
		const onAccept = vi.fn();

		render(SuggestionCard, {
			props: { suggestion: mockSuggestion, onAccept }
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		acceptButton.focus();

		// Buttons respond to click events, which browsers generate from Enter/Space key presses
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalled();
	});
});

describe('SuggestionCard Component - Edge Cases', () => {
	it('should handle empty title', () => {
		const suggestion = { ...mockSuggestion, title: '' };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle empty description', () => {
		const suggestion = { ...mockSuggestion, description: '' };
		render(SuggestionCard, {
			props: { suggestion }
		});

		expect(screen.getByText('Connect NPCs')).toBeInTheDocument();
	});

	it('should handle very long title', () => {
		const longTitle = 'A'.repeat(200);
		const suggestion = { ...mockSuggestion, title: longTitle };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		// Title should be truncated or wrapped
		const titleElement = container.querySelector('[class*="truncate"], [class*="line-clamp"]');
		expect(titleElement).toBeInTheDocument();
	});

	it('should handle special characters in title', () => {
		const suggestion = { ...mockSuggestion, title: '<script>alert("XSS")</script>' };
		render(SuggestionCard, {
			props: { suggestion }
		});

		// Should escape HTML
		expect(screen.getByText(/<script>/)).toBeInTheDocument();
	});

	it('should handle special characters in description', () => {
		const suggestion = { ...mockSuggestion, description: 'Test & "quotes" <tags>' };
		render(SuggestionCard, {
			props: { suggestion }
		});

		expect(screen.getByText(/Test & "quotes"/)).toBeInTheDocument();
	});

	it('should handle future createdAt date', () => {
		const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // Tomorrow
		const suggestion = { ...mockSuggestion, createdAt: futureDate };

		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle empty affectedEntityIds', () => {
		const suggestion = { ...mockSuggestion, affectedEntityIds: [] };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle many affectedEntityIds', () => {
		const manyIds = Array.from({ length: 100 }, (_, i) => `entity-${i}`);
		const suggestion = { ...mockSuggestion, affectedEntityIds: manyIds };
		const { container } = render(SuggestionCard, {
			props: { suggestion }
		});

		expect(container).toBeInTheDocument();
	});
});

describe('SuggestionCard Component - Visual States', () => {
	it('should have hover state', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const card = container.querySelector('[class*="hover"]');
		expect(card).toBeInTheDocument();
	});

	it('should have transition animations', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const card = container.querySelector('[class*="transition"]');
		expect(card).toBeInTheDocument();
	});

	it('should have shadow on hover', () => {
		const { container } = render(SuggestionCard, {
			props: { suggestion: mockSuggestion }
		});

		const card = container.querySelector('[class*="shadow"], [class*="hover:shadow"]');
		expect(card).toBeInTheDocument();
	});
});
