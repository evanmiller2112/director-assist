/**
 * Tests for RelationshipContextItem Component
 *
 * Issue #62 & #134: Relationship Context UI with Cache Status
 *
 * Displays a single relationship with checkbox, summary preview, cache status,
 * and regenerate button. Used within RelationshipContextSelector.
 *
 * These are FAILING tests written following TDD principles (RED phase).
 * They define the expected behavior before implementation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipContextItem from './RelationshipContextItem.svelte';
import type { BaseEntity, EntityLink } from '$lib/types';
import type { CacheStatus } from '$lib/types/cache';

describe('RelationshipContextItem Component', () => {
	// Mock entities
	const mockSourceEntity: BaseEntity = {
		id: 'npc-1',
		type: 'npc',
		name: 'Aldric the Brave',
		description: 'A noble knight',
		summary: 'A brave knight',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	const mockTargetEntity: BaseEntity = {
		id: 'faction-1',
		type: 'faction',
		name: 'Order of the Silver Dawn',
		description: 'A religious order',
		summary: 'A holy order',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	const mockRelationship: EntityLink = {
		id: 'link-1',
		sourceId: 'npc-1',
		targetId: 'faction-1',
		targetType: 'faction',
		relationship: 'member_of',
		bidirectional: false
	};

	describe('Basic Rendering', () => {
		it('should render without crashing', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Aldric is a loyal member of the Order',
					generatedAt: new Date()
				}
			});
			expect(container).toBeInTheDocument();
		});

		it('should display target entity name', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			expect(screen.getByText('Order of the Silver Dawn')).toBeInTheDocument();
		});

		it('should display target entity type', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			expect(screen.getByText(/faction/i)).toBeInTheDocument();
		});

		it('should display relationship type', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			expect(screen.getByText(/member_of|member of/i)).toBeInTheDocument();
		});

		it('should format relationship type for display', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: { ...mockRelationship, relationship: 'ally_of' },
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			// Should convert underscores to spaces or similar formatting
			const text = screen.getByText(/ally/i);
			expect(text).toBeInTheDocument();
		});
	});

	describe('Checkbox State', () => {
		it('should render checkbox', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toBeInTheDocument();
		});

		it('should show checked checkbox when included is true', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
			expect(checkbox.checked).toBe(true);
		});

		it('should show unchecked checkbox when included is false', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: false,
					cacheStatus: 'valid',
					summary: 'Test summary'
				}
			});

			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
			expect(checkbox.checked).toBe(false);
		});

		it('should call onToggle when checkbox is clicked', async () => {
			const onToggle = vi.fn();

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					onToggle
				}
			});

			const checkbox = screen.getByRole('checkbox');
			await fireEvent.click(checkbox);

			expect(onToggle).toHaveBeenCalledTimes(1);
		});

		it('should toggle checkbox state when clicked', async () => {
			const onToggle = vi.fn();

			const { rerender } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					onToggle
				}
			});

			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
			expect(checkbox.checked).toBe(true);

			await fireEvent.click(checkbox);
			expect(onToggle).toHaveBeenCalled();

			// Re-render with updated state
			rerender({
				targetEntity: mockTargetEntity,
				relationship: mockRelationship,
				included: false,
				cacheStatus: 'valid',
				summary: 'Test summary',
				onToggle
			});

			expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
		});
	});

	describe('Cache Status Badge', () => {
		it('should show "Valid" badge with green styling for valid cache', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const badge = screen.getByTestId('cache-status');
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveTextContent('Valid');
			// Should have green/success styling
			expect(badge).toHaveClass(/green|success/);
		});

		it('should show "Stale" badge with yellow styling for stale cache', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'stale',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const badge = screen.getByTestId('cache-status');
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveTextContent('Stale');
			// Should have yellow/warning styling
			expect(badge).toHaveClass(/yellow|warning|amber/);
		});

		it('should show "No Cache" badge with gray styling for missing cache', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'missing',
					summary: undefined
				}
			});

			expect(screen.getByText(/no cache|missing|not cached/i)).toBeInTheDocument();
			// Should have gray/muted styling
			const badge = container.querySelector('[data-testid="cache-status"], [class*="badge"]');
			expect(badge).toHaveClass(/gray|muted|neutral/);
		});
	});

	describe('Cache Age Display', () => {
		it('should show "Cached X ago" when generatedAt is provided', () => {
			const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: twoHoursAgo
				}
			});

			expect(screen.getByText(/cached.*ago/i)).toBeInTheDocument();
		});

		it('should show relative time for cache age', () => {
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: fiveMinutesAgo
				}
			});

			// Should use formatRelativeTime utility
			expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
		});

		it('should not show cache age when generatedAt is missing', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'missing',
					summary: undefined
				}
			});

			expect(screen.queryByText(/cached.*ago/i)).not.toBeInTheDocument();
		});

		it('should show "No summary" when cache is missing', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'missing',
					summary: undefined
				}
			});

			expect(screen.getByText(/no summary|not generated/i)).toBeInTheDocument();
		});
	});

	describe('Summary Display', () => {
		it('should display relationship summary when provided', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Aldric is a dedicated member of the Order, sworn to protect the innocent.',
					generatedAt: new Date()
				}
			});

			expect(
				screen.getByText(/Aldric is a dedicated member of the Order/i)
			).toBeInTheDocument();
		});

		it('should truncate long summaries with ellipsis', () => {
			const longSummary =
				'This is a very long summary that should be truncated to avoid taking up too much space in the UI. It contains lots of detail about the relationship between these entities, including their history, current status, and future plans.';

			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: longSummary,
					generatedAt: new Date()
				}
			});

			// Should either truncate or use CSS to limit lines
			const summaryElement = container.querySelector('[data-testid="summary"], [class*="summary"]');
			expect(summaryElement).toBeInTheDocument();
		});

		it('should show placeholder when summary is missing', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'missing',
					summary: undefined
				}
			});

			expect(screen.getByText(/no summary|not generated/i)).toBeInTheDocument();
		});
	});

	describe('Regenerate Button', () => {
		it('should render regenerate button', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			expect(button).toBeInTheDocument();
		});

		it('should call onRegenerate when regenerate button is clicked', async () => {
			const onRegenerate = vi.fn();

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					onRegenerate
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			await fireEvent.click(button);

			expect(onRegenerate).toHaveBeenCalledTimes(1);
		});

		it('should show loading spinner when regenerating', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					regenerating: true
				}
			});

			// Should show spinner in button
			const spinner = container.querySelector('[role="status"], [class*="spin"]');
			expect(spinner).toBeInTheDocument();
		});

		it('should disable regenerate button when regenerating', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					regenerating: true
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			expect(button).toBeDisabled();
		});

		it('should not call onRegenerate when already regenerating', async () => {
			const onRegenerate = vi.fn();

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					regenerating: true,
					onRegenerate
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			await fireEvent.click(button);

			expect(onRegenerate).not.toHaveBeenCalled();
		});

		it('should show different text or icon when regenerating', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					regenerating: true
				}
			});

			// Should show "Regenerating..." or similar
			expect(screen.getByText(/regenerating/i)).toBeInTheDocument();
		});
	});

	describe('Visual States', () => {
		it('should have different styling when included', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const item = container.querySelector('[data-testid="relationship-item"]');
			expect(item).toHaveClass(/selected|active|included/);
		});

		it('should have muted styling when not included', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: false,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const item = container.querySelector('[data-testid="relationship-item"]');
			expect(item).toHaveClass(/muted|inactive|disabled/);
		});

		it('should highlight stale cache entries', () => {
			const { container } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'stale',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			// Should have warning/stale styling
			const item = container.querySelector('[data-testid="relationship-item"]');
			expect(item).toHaveClass(/stale|warning/);
		});
	});

	describe('Accessibility', () => {
		it('should have accessible checkbox label', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAccessibleName(/Order of the Silver Dawn/i);
		});

		it('should have accessible regenerate button', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			expect(button).toHaveAccessibleName();
		});

		it('should announce loading state for screen readers', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					regenerating: true
				}
			});

			const button = screen.getByRole('button', { name: /regenerate/i });
			expect(button).toHaveAttribute('aria-busy', 'true');
		});
	});

	describe('Token Count Display', () => {
		it('should show token count when provided', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					tokenCount: 45
				}
			});

			expect(screen.getByText(/45.*tokens?/i)).toBeInTheDocument();
		});

		it('should not show token count when not provided', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date()
				}
			});

			expect(screen.queryByText(/tokens?/i)).not.toBeInTheDocument();
		});

		it('should format token count with separator for large numbers', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Test summary',
					generatedAt: new Date(),
					tokenCount: 1500
				}
			});

			// Should show as "1,500 tokens" or similar
			expect(screen.getByText(/1[,\s]500/)).toBeInTheDocument();
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete valid cache scenario', () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'valid',
					summary: 'Aldric serves the Order faithfully.',
					generatedAt: oneHourAgo,
					tokenCount: 42
				}
			});

			// Should show all elements
			expect(screen.getByText('Order of the Silver Dawn')).toBeInTheDocument();
			expect(screen.getByTestId('cache-status')).toHaveTextContent('Valid');
			expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument();
			expect(screen.getByText(/Aldric serves/i)).toBeInTheDocument();
			expect(screen.getByText(/42.*tokens?/i)).toBeInTheDocument();
			expect(screen.getByRole('checkbox')).toBeChecked();
		});

		it('should handle stale cache scenario', () => {
			const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'stale',
					summary: 'Outdated summary text.',
					generatedAt: twoDaysAgo
				}
			});

			expect(screen.getByTestId('cache-status')).toHaveTextContent('Stale');
			expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
		});

		it('should handle missing cache scenario', () => {
			render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: false,
					cacheStatus: 'missing',
					summary: undefined
				}
			});

			expect(screen.getByText(/no cache|missing/i)).toBeInTheDocument();
			expect(screen.getByText(/no summary|not generated/i)).toBeInTheDocument();
			expect(screen.getByRole('checkbox')).not.toBeChecked();
		});

		it('should handle regeneration workflow', async () => {
			const onRegenerate = vi.fn();
			const { rerender } = render(RelationshipContextItem, {
				props: {
					targetEntity: mockTargetEntity,
					relationship: mockRelationship,
					included: true,
					cacheStatus: 'stale',
					summary: 'Old summary',
					generatedAt: new Date(),
					regenerating: false,
					onRegenerate
				}
			});

			// Click regenerate
			const button = screen.getByRole('button', { name: /regenerate/i });
			await fireEvent.click(button);
			expect(onRegenerate).toHaveBeenCalled();

			// Parent sets regenerating to true
			rerender({
				targetEntity: mockTargetEntity,
				relationship: mockRelationship,
				included: true,
				cacheStatus: 'stale',
				summary: 'Old summary',
				generatedAt: new Date(),
				regenerating: true,
				onRegenerate
			});

			expect(screen.getByRole('button', { name: /regenerate/i })).toBeDisabled();
			expect(screen.getByText(/regenerating/i)).toBeInTheDocument();
		});
	});
});
