/**
 * Tests for RelationshipBreadcrumbs Component
 *
 * Issue #79: Relationship Navigation Breadcrumbs
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until RelationshipBreadcrumbs.svelte is properly implemented.
 *
 * This component displays a breadcrumb trail showing the navigation path through
 * relationship chains. It allows users to see where they've been and navigate
 * back through the hierarchy.
 *
 * Covers:
 * - Rendering breadcrumb segments
 * - Truncation and ellipsis for long paths
 * - Navigation click handling
 * - Clear button functionality
 * - Current entity display
 * - Responsive behavior
 * - Accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import RelationshipBreadcrumbs from './RelationshipBreadcrumbs.svelte';
import type { BreadcrumbSegment } from '$lib/utils/breadcrumbUtils';

describe('RelationshipBreadcrumbs Component - Basic Rendering', () => {
	it('should render single breadcrumb segment', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'allied_with',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
	});

	it('should render multiple breadcrumb segments', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'allied_with',
				entityName: 'Gandalf',
				entityType: 'npc'
			},
			{
				entityId: 'def456',
				relationship: 'resides_at',
				entityName: 'Rivendell',
				entityType: 'location'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Rivendell')).toBeInTheDocument();
	});

	it('should display current entity as final breadcrumb', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Frodo')).toBeInTheDocument();
	});

	it('should show current entity even with no breadcrumb segments', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Frodo')).toBeInTheDocument();
	});

	it('should display relationship arrows between segments', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			},
			{
				entityId: 'def456',
				relationship: 'lives_at',
				entityName: 'Rivendell',
				entityType: 'location'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		// Should have visual separators (arrows, chevrons, etc.)
		// Look for ChevronRight icon or similar separator
		const separators = container.querySelectorAll('[class*="separator"], svg');
		expect(separators.length).toBeGreaterThan(0);
	});

	it('should render as a navigation element', () => {
		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const nav = container.querySelector('nav');
		expect(nav).toBeInTheDocument();
	});

	it('should have breadcrumb list with proper aria attributes', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [
					{
						entityId: 'abc123',
						relationship: 'knows',
						entityName: 'Gandalf',
						entityType: 'npc'
					}
				],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const list = screen.getByRole('list');
		expect(list).toBeInTheDocument();
		expect(list).toHaveAttribute('aria-label', 'Breadcrumb');
	});
});

describe('RelationshipBreadcrumbs Component - Truncation and Ellipsis', () => {
	it('should display all segments when count is under maxVisible', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 5
			}
		});

		expect(screen.getByText('Name1')).toBeInTheDocument();
		expect(screen.getByText('Name2')).toBeInTheDocument();
		expect(screen.getByText('Name3')).toBeInTheDocument();
	});

	it('should show ellipsis when segments exceed maxVisible', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
			{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
			{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' },
			{ entityId: 'id6', relationship: 'rel6', entityName: 'Name6', entityType: 'type6' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 3
			}
		});

		expect(screen.getByText('...')).toBeInTheDocument();
	});

	it('should show most recent segments when truncated', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
			{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' },
			{ entityId: 'id5', relationship: 'rel5', entityName: 'Name5', entityType: 'type5' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 2
			}
		});

		// Should show Name4 and Name5 (most recent)
		expect(screen.queryByText('Name1')).not.toBeInTheDocument();
		expect(screen.queryByText('Name2')).not.toBeInTheDocument();
		expect(screen.queryByText('Name3')).not.toBeInTheDocument();
		expect(screen.getByText('Name4')).toBeInTheDocument();
		expect(screen.getByText('Name5')).toBeInTheDocument();
	});

	it('should not show ellipsis when exactly at maxVisible', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 3
			}
		});

		expect(screen.queryByText('...')).not.toBeInTheDocument();
	});

	it('should use default maxVisible of 5 when not specified', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' },
			{ entityId: 'id4', relationship: 'rel4', entityName: 'Name4', entityType: 'type4' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
				// maxVisible not specified, should default to 5
			}
		});

		// All 4 should be visible (under default of 5)
		expect(screen.getByText('Name1')).toBeInTheDocument();
		expect(screen.getByText('Name4')).toBeInTheDocument();
		expect(screen.queryByText('...')).not.toBeInTheDocument();
	});
});

describe('RelationshipBreadcrumbs Component - Navigation', () => {
	it('should call onNavigate when breadcrumb segment is clicked', async () => {
		const onNavigate = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate,
				onClear: vi.fn()
			}
		});

		const link = screen.getByText('Gandalf');
		await fireEvent.click(link);

		expect(onNavigate).toHaveBeenCalledTimes(1);
	});

	it('should pass correct segment index to onNavigate', async () => {
		const onNavigate = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'id1',
				relationship: 'rel1',
				entityName: 'Name1',
				entityType: 'type1'
			},
			{
				entityId: 'id2',
				relationship: 'rel2',
				entityName: 'Name2',
				entityType: 'type2'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate,
				onClear: vi.fn()
			}
		});

		const firstSegment = screen.getByText('Name1');
		await fireEvent.click(firstSegment);

		expect(onNavigate).toHaveBeenCalledWith(0);

		const secondSegment = screen.getByText('Name2');
		await fireEvent.click(secondSegment);

		expect(onNavigate).toHaveBeenCalledWith(1);
	});

	it('should NOT call onNavigate when current entity is clicked', async () => {
		const onNavigate = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate,
				onClear: vi.fn()
			}
		});

		const currentEntity = screen.getByText('Frodo');
		await fireEvent.click(currentEntity);

		expect(onNavigate).not.toHaveBeenCalled();
	});

	it('should render breadcrumb segments as clickable links', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const link = screen.getByText('Gandalf');
		expect(link.tagName).toBe('BUTTON');
		expect(link).toHaveAttribute('type', 'button');
	});

	it('should render current entity as non-clickable text', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const currentEntityElement = screen.getByText('Frodo');
		expect(currentEntityElement.tagName).not.toBe('BUTTON');
		expect(currentEntityElement.tagName).not.toBe('A');
	});

	it('should handle multiple clicks on same segment', async () => {
		const onNavigate = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate,
				onClear: vi.fn()
			}
		});

		const link = screen.getByText('Gandalf');
		await fireEvent.click(link);
		await fireEvent.click(link);
		await fireEvent.click(link);

		expect(onNavigate).toHaveBeenCalledTimes(3);
	});
});

describe('RelationshipBreadcrumbs Component - Clear Button', () => {
	it('should render clear button when segments exist', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear/i });
		expect(clearButton).toBeInTheDocument();
	});

	it('should NOT render clear button when no segments exist', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clearButton = screen.queryByRole('button', { name: /clear/i });
		expect(clearButton).not.toBeInTheDocument();
	});

	it('should call onClear when clear button is clicked', async () => {
		const onClear = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear/i });
		await fireEvent.click(clearButton);

		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it('should have accessible label on clear button', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear/i });
		expect(clearButton).toHaveAccessibleName();
	});

	it('should have clear icon on clear button', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear/i });
		const icon = clearButton.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should position clear button at end of breadcrumbs', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear/i });
		const nav = container.querySelector('nav');

		// Clear button should be inside the nav element
		expect(nav).toContainElement(clearButton);
	});
});

describe('RelationshipBreadcrumbs Component - Responsive Behavior', () => {
	it('should have responsive layout classes', () => {
		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const nav = container.querySelector('nav');
		// Should have responsive flex/wrap classes
		expect(nav).toHaveClass(/flex|wrap/);
	});

	it('should handle very long entity names gracefully', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'A Very Long Entity Name That Goes On And On And On',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText(/A Very Long Entity Name/i)).toBeInTheDocument();
	});

	it('should apply truncation or ellipsis to long entity names', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'A Very Long Entity Name That Should Be Truncated',
				entityType: 'npc'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const nameElement = screen.getByText(/A Very Long Entity Name/i);
		// Should have truncate or max-width classes
		expect(nameElement).toHaveClass(/truncate|max-w/);
	});
});

describe('RelationshipBreadcrumbs Component - Styling', () => {
	it('should have different styling for clickable vs current breadcrumb', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clickableSegment = screen.getByText('Gandalf');
		const currentSegment = screen.getByText('Frodo');

		// Current should have different styling (e.g., bold, different color)
		expect(currentSegment.className).not.toBe(clickableSegment.className);
	});

	it('should have hover state styling on clickable breadcrumbs', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const clickableSegment = screen.getByText('Gandalf');

		// Should have hover classes
		expect(clickableSegment).toHaveClass(/hover/);
	});

	it('should have appropriate spacing between breadcrumb items', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'id1',
				relationship: 'rel1',
				entityName: 'Name1',
				entityType: 'type1'
			},
			{
				entityId: 'id2',
				relationship: 'rel2',
				entityName: 'Name2',
				entityType: 'type2'
			}
		];

		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const list = screen.getByRole('list');
		// Should have gap or space classes
		expect(list).toHaveClass(/gap|space/);
	});
});

describe('RelationshipBreadcrumbs Component - Accessibility', () => {
	it('should have proper ARIA role for navigation', () => {
		const { container } = render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const nav = container.querySelector('nav');
		expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
	});

	it('should have accessible labels for all interactive elements', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});
	});

	it('should support keyboard navigation', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAttribute('type', 'button');
		});
	});

	it('should mark current page in breadcrumbs with aria-current', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: 'Gandalf',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const currentElement = screen.getByText('Frodo');
		expect(currentElement).toHaveAttribute('aria-current', 'page');
	});

	it('should have list items for each breadcrumb segment', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		const listItems = screen.getAllByRole('listitem');
		// Should have at least 2 segments + current entity = 3 list items
		expect(listItems.length).toBeGreaterThanOrEqual(3);
	});
});

describe('RelationshipBreadcrumbs Component - Edge Cases', () => {
	it('should handle empty segments array', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Frodo')).toBeInTheDocument();
	});

	it('should handle segments with empty entity names', () => {
		const segments: BreadcrumbSegment[] = [
			{
				entityId: 'abc123',
				relationship: 'knows',
				entityName: '',
				entityType: 'npc'
			}
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		// Should render without crashing
		expect(screen.getByText('Frodo')).toBeInTheDocument();
	});

	it('should handle current entity with special characters in name', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: "Frodo O'Brien (the Great)", type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText("Frodo O'Brien (the Great)")).toBeInTheDocument();
	});

	it('should handle maxVisible of 0', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 0
			}
		});

		// Should show ellipsis and current entity at minimum
		expect(screen.getByText('Current')).toBeInTheDocument();
	});

	it('should handle very large maxVisible value', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn(),
				maxVisible: 1000
			}
		});

		expect(screen.getByText('Name1')).toBeInTheDocument();
		expect(screen.getByText('Name2')).toBeInTheDocument();
	});

	it('should handle rapid clicks on different segments', async () => {
		const onNavigate = vi.fn();
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate,
				onClear: vi.fn()
			}
		});

		const first = screen.getByText('Name1');
		const second = screen.getByText('Name2');

		await fireEvent.click(first);
		await fireEvent.click(second);
		await fireEvent.click(first);

		expect(onNavigate).toHaveBeenCalledTimes(3);
	});
});

describe('RelationshipBreadcrumbs Component - Props Validation', () => {
	it('should render with all required props', () => {
		render(RelationshipBreadcrumbs, {
			props: {
				segments: [],
				currentEntity: { id: 'current', name: 'Frodo', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
			}
		});

		expect(screen.getByText('Frodo')).toBeInTheDocument();
	});

	it('should use default maxVisible when not provided', () => {
		const segments: BreadcrumbSegment[] = [
			{ entityId: 'id1', relationship: 'rel1', entityName: 'Name1', entityType: 'type1' },
			{ entityId: 'id2', relationship: 'rel2', entityName: 'Name2', entityType: 'type2' },
			{ entityId: 'id3', relationship: 'rel3', entityName: 'Name3', entityType: 'type3' }
		];

		render(RelationshipBreadcrumbs, {
			props: {
				segments,
				currentEntity: { id: 'current', name: 'Current', type: 'character' },
				onNavigate: vi.fn(),
				onClear: vi.fn()
				// maxVisible not provided
			}
		});

		// All 3 should be visible with default maxVisible of 5
		expect(screen.getByText('Name1')).toBeInTheDocument();
		expect(screen.getByText('Name2')).toBeInTheDocument();
		expect(screen.getByText('Name3')).toBeInTheDocument();
	});
});
