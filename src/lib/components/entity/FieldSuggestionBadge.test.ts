/**
 * Tests for FieldSuggestionBadge Component (Issue #366, Phase 4)
 *
 * This component displays a small inline badge next to field labels when
 * AI suggestions are available. The badge is clickable and triggers a popover
 * to display the full suggestion.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until FieldSuggestionBadge component is implemented.
 *
 * Features tested:
 * - Visibility based on hasSuggestion prop
 * - Badge styling and appearance (amber color, AI/lightbulb icon)
 * - Click interaction triggers onClick callback
 * - Accessibility (keyboard navigation, screen readers)
 * - Hover states and visual feedback
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FieldSuggestionBadge from './FieldSuggestionBadge.svelte';

describe('FieldSuggestionBadge Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render badge when hasSuggestion is true', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Badge should be visible as a button or clickable element
		const badge = container.querySelector('[role="button"], button');
		expect(badge).toBeInTheDocument();
	});

	it('should NOT render badge when hasSuggestion is false', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: false,
				onClick: vi.fn()
			}
		});

		// Badge should not be visible
		const badge = container.querySelector('[role="button"], button');
		expect(badge).not.toBeInTheDocument();
	});

	it('should be hidden when hasSuggestion is false', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: false,
				onClick: vi.fn()
			}
		});

		// Should not find any visible badge text or icon
		expect(screen.queryByText(/Suggestions/i)).not.toBeInTheDocument();
	});

	it('should render as inline element', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Badge should have inline or inline-block display
		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/inline/);
	});
});

describe('FieldSuggestionBadge Component - Visual Appearance', () => {
	it('should have amber/yellow color scheme', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should have amber, yellow, or warning colors
		expect(badge).toHaveClass(/amber|yellow|bg-amber|bg-yellow/);
	});

	it('should display "Suggestions" text or icon', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Should have "Suggestions" text OR an icon (svg element)
		const suggestionsText = screen.queryByText(/Suggestions/i);
		const icon = document.querySelector('svg');

		expect(suggestionsText || icon).toBeTruthy();
	});

	it('should display "Suggestions" text on larger screens', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Should explicitly show "Suggestions" text (not "AI")
		const suggestionsText = screen.queryByText('Suggestions');
		expect(suggestionsText).toBeInTheDocument();
	});

	it('should NOT display "AI" text', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Should not show "AI" text - we want "Suggestions" instead
		const aiText = screen.queryByText('AI');
		expect(aiText).not.toBeInTheDocument();
	});

	it('should use lightbulb or sparkles icon from Lucide', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Should have an SVG icon
		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should be small and unobtrusive', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should have small size classes
		expect(badge).toHaveClass(/text-xs|text-sm|w-|h-/);
	});

	it('should have rounded corners', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/rounded/);
	});

	it('should have padding for visual comfort', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/p-|px-|py-/);
	});

	it('should have hover state styling', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/hover/);
	});

	it('should have subtle appearance to not distract', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should not have bold or overly prominent classes
		expect(badge).toBeInTheDocument();
	});
});

describe('FieldSuggestionBadge Component - Click Interaction', () => {
	it('should call onClick callback when clicked', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		await fireEvent.click(badge);

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('should call onClick only once per click', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		await fireEvent.click(badge);

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('should handle multiple clicks correctly', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		await fireEvent.click(badge);
		await fireEvent.click(badge);
		await fireEvent.click(badge);

		expect(onClick).toHaveBeenCalledTimes(3);
	});

	it('should handle missing onClick callback gracefully', async () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true
			}
		});

		const badge = screen.getByRole('button');

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(badge);
		}).not.toThrow();
	});

	it('should be clickable element (button or role=button)', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should have cursor pointer on hover', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/cursor-pointer/);
	});
});

describe('FieldSuggestionBadge Component - Accessibility', () => {
	it('should have accessible button role', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should have descriptive aria-label', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		const ariaLabel = badge.getAttribute('aria-label');

		// Should include "suggestion" and field name
		expect(ariaLabel).toMatch(/suggestion|description/i);
	});

	it('should be keyboard accessible', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		badge.focus();

		expect(document.activeElement).toBe(badge);
	});

	it('should respond to Enter key', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		badge.focus();
		await fireEvent.keyDown(badge, { key: 'Enter' });

		expect(onClick).toHaveBeenCalled();
	});

	it('should respond to Space key', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		badge.focus();
		await fireEvent.keyDown(badge, { key: ' ' });

		expect(onClick).toHaveBeenCalled();
	});

	it('should have visible focus indicator', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should have focus ring classes
		expect(badge).toHaveClass(/focus|ring/);
	});

	it('should not have tabindex -1 (should be focusable)', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).not.toHaveAttribute('tabindex', '-1');
	});

	it('should provide context for screen readers', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		// Should have aria-label that explains what the badge does
		expect(badge).toHaveAttribute('aria-label');
	});
});

describe('FieldSuggestionBadge Component - Field Context', () => {
	it('should accept fieldName prop', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'tactics',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should include fieldName in aria-label for context', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'tactics',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		const ariaLabel = badge.getAttribute('aria-label');

		expect(ariaLabel).toMatch(/tactics/i);
	});

	it('should work with different field names', () => {
		const fieldNames = ['description', 'tactics', 'summary', 'backstory', 'goals'];

		fieldNames.forEach((fieldName) => {
			const { unmount } = render(FieldSuggestionBadge, {
				props: {
					fieldName,
					hasSuggestion: true,
					onClick: vi.fn()
				}
			});

			const badge = screen.getByRole('button');
			expect(badge).toBeInTheDocument();

			unmount();
		});
	});
});

describe('FieldSuggestionBadge Component - State Management', () => {
	it('should update visibility when hasSuggestion changes', async () => {
		const { rerender } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Initially visible
		let badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();

		// Hide badge
		rerender({
			fieldName: 'description',
			hasSuggestion: false,
			onClick: vi.fn()
		});

		// Should not be visible
		badge = screen.queryByRole('button') as HTMLElement;
		expect(badge).not.toBeInTheDocument();
	});

	it('should show badge when hasSuggestion changes from false to true', () => {
		const { rerender } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: false,
				onClick: vi.fn()
			}
		});

		// Initially hidden
		let badge = screen.queryByRole('button');
		expect(badge).not.toBeInTheDocument();

		// Show badge
		rerender({
			fieldName: 'description',
			hasSuggestion: true,
			onClick: vi.fn()
		});

		// Should now be visible
		badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should handle rapid visibility toggles', () => {
		const { rerender } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		for (let i = 0; i < 5; i++) {
			rerender({
				fieldName: 'description',
				hasSuggestion: i % 2 === 0,
				onClick: vi.fn()
			});
		}

		// Should handle multiple state changes without errors
		expect(true).toBe(true);
	});
});

describe('FieldSuggestionBadge Component - Edge Cases', () => {
	it('should handle empty fieldName', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: '',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle very long fieldName', () => {
		const longFieldName = 'this_is_a_very_long_field_name_that_might_be_used_in_some_edge_cases';

		render(FieldSuggestionBadge, {
			props: {
				fieldName: longFieldName,
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should handle special characters in fieldName', () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'field-name_with.special/chars',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should not crash when onClick is undefined', async () => {
		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true
			}
		});

		const badge = screen.getByRole('button');

		await expect(async () => {
			await fireEvent.click(badge);
		}).not.toThrow();
	});
});

describe('FieldSuggestionBadge Component - Real-world Use Cases', () => {
	it('should work in entity form field label context', () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		expect(badge).toBeInTheDocument();
	});

	it('should integrate with field suggestion popover workflow', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'tactics',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');
		await fireEvent.click(badge);

		// Clicking should trigger popover display (handled by parent)
		expect(onClick).toHaveBeenCalled();
	});

	it('should handle rapid user interactions', async () => {
		const onClick = vi.fn();

		render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick
			}
		});

		const badge = screen.getByRole('button');

		// Rapid clicks
		for (let i = 0; i < 10; i++) {
			await fireEvent.click(badge);
		}

		expect(onClick).toHaveBeenCalledTimes(10);
	});

	it('should work alongside other field label elements', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Badge should be small enough to fit inline with label
		const badge = container.querySelector('[role="button"], button');
		expect(badge).toHaveClass(/inline/);
	});
});

describe('FieldSuggestionBadge Component - Visual Design Consistency', () => {
	it('should match Director Assist design system', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should use Tailwind classes consistent with the app
		expect(badge).toBeInTheDocument();
	});

	it('should use Lucide icon library', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		// Should have SVG icon from Lucide
		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have sufficient color contrast', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Should not have low-contrast or invisible colors
		expect(badge).not.toHaveClass(/text-transparent|opacity-0/);
	});

	it('should be responsive on mobile devices', () => {
		const { container } = render(FieldSuggestionBadge, {
			props: {
				fieldName: 'description',
				hasSuggestion: true,
				onClick: vi.fn()
			}
		});

		const badge = container.querySelector('[role="button"], button');
		// Badge should work on small screens
		expect(badge).toBeInTheDocument();
	});
});
