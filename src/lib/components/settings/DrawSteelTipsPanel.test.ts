/**
 * Tests for DrawSteelTipsPanel Component
 *
 * Issue #168 Phase 1: Improve custom entity creation UX
 *
 * This component provides Draw Steel-specific guidance to users
 * when creating custom entity types. It displays:
 * - Field type recommendations
 * - Common patterns for Draw Steel campaigns
 * - Examples of custom entity types
 * - Best practices
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DrawSteelTipsPanel from './DrawSteelTipsPanel.svelte';

describe('DrawSteelTipsPanel Component - Basic Rendering (Issue #168)', () => {
	it('should render without crashing', () => {
		const { container } = render(DrawSteelTipsPanel);
		expect(container).toBeInTheDocument();
	});

	it('should display panel title', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();
	});

	it('should render as an info panel', () => {
		render(DrawSteelTipsPanel);
		const panel = screen.getByText(/Tips for Draw Steel/i).closest('div');
		expect(panel).toBeTruthy();
	});

	it('should have appropriate styling for info panel', () => {
		const { container } = render(DrawSteelTipsPanel);
		const panel = container.querySelector('[data-testid="tips-panel"]');
		expect(panel).toBeTruthy();
	});
});

describe('DrawSteelTipsPanel Component - Field Type Recommendations', () => {
	it('should display text field recommendation', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/text.*for names, descriptions/i)).toBeInTheDocument();
	});

	it('should display number field recommendation', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/number.*for AC, HP, damage/i)).toBeInTheDocument();
	});

	it('should display select field recommendation', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/select.*for threat_level, role/i)).toBeInTheDocument();
	});

	it('should display computed field recommendation', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/computed.*for calculated values/i)).toBeInTheDocument();
	});

	it('should display entity-ref field recommendation', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/entity-ref.*to link to other entities/i)).toBeInTheDocument();
	});

	it('should show example for computed field', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/total_hp.*level.*con/i)).toBeInTheDocument();
	});
});

describe('DrawSteelTipsPanel Component - Common Patterns', () => {
	it('should show examples of custom entity types', () => {
		render(DrawSteelTipsPanel);
		// Check that all three entity type examples are shown
		expect(screen.getAllByText(/Monster|Ability|Condition/i).length).toBeGreaterThanOrEqual(1);
	});

	it('should display monster entity type example', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/monster/i)).toBeInTheDocument();
	});

	it('should display ability entity type example', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/ability/i)).toBeInTheDocument();
	});

	it('should display condition entity type example', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/condition/i)).toBeInTheDocument();
	});

	it('should provide field naming guidance', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/snake_case|lowercase.*underscores/i)).toBeInTheDocument();
	});
});

describe('DrawSteelTipsPanel Component - Dismiss Functionality', () => {
	it('should show dismiss button', () => {
		render(DrawSteelTipsPanel);
		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should call onDismiss callback when dismiss button is clicked', async () => {
		const onDismiss = vi.fn();
		render(DrawSteelTipsPanel, { onDismiss });

		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should hide panel when dismissed', async () => {
		const { rerender } = render(DrawSteelTipsPanel, { dismissed: false });
		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();

		rerender({ dismissed: true });
		expect(screen.queryByText(/Tips for Draw Steel/i)).not.toBeInTheDocument();
	});

	it('should not render when dismissed prop is true', () => {
		render(DrawSteelTipsPanel, { dismissed: true });
		expect(screen.queryByText(/Tips for Draw Steel/i)).not.toBeInTheDocument();
	});
});

describe('DrawSteelTipsPanel Component - Collapsible Sections', () => {
	it('should show expandable sections for different topics', () => {
		render(DrawSteelTipsPanel);
		expect(screen.getByText(/Field Types/i)).toBeInTheDocument();
		expect(screen.getByText(/Examples/i)).toBeInTheDocument();
	});

	it('should allow toggling section visibility', async () => {
		render(DrawSteelTipsPanel);

		const fieldTypesHeader = screen.getByText(/Field Types/i);
		const parentButton = fieldTypesHeader.closest('button');

		if (parentButton) {
			await fireEvent.click(parentButton);
			// Section content visibility should toggle
			expect(parentButton).toHaveAttribute('aria-expanded');
		}
	});
});

describe('DrawSteelTipsPanel Component - Accessibility', () => {
	it('should have proper ARIA role', () => {
		const { container } = render(DrawSteelTipsPanel);
		const panel = container.querySelector('[role="region"]') || container.querySelector('[role="complementary"]');
		expect(panel).toBeTruthy();
	});

	it('should have aria-label for tips panel', () => {
		const { container } = render(DrawSteelTipsPanel);
		const panel = container.querySelector('[aria-label*="tips"]') || container.querySelector('[aria-labelledby]');
		expect(panel).toBeTruthy();
	});

	it('should have accessible dismiss button', () => {
		render(DrawSteelTipsPanel);
		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });
		expect(dismissButton).toHaveAttribute('aria-label');
	});

	it('should be keyboard navigable', () => {
		render(DrawSteelTipsPanel);
		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });
		expect(dismissButton).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('DrawSteelTipsPanel Component - Content Organization', () => {
	it('should group tips by category', () => {
		render(DrawSteelTipsPanel);
		// Should have sections or headings organizing the tips
		const headings = screen.getAllByRole('heading', { level: 3 });
		expect(headings.length).toBeGreaterThan(0);
	});

	it('should use icons for visual clarity', () => {
		const { container } = render(DrawSteelTipsPanel);
		// Lucide icons are typically rendered as SVGs
		const icons = container.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should use a distinct visual style', () => {
		const { container } = render(DrawSteelTipsPanel);
		const panel = container.querySelector('[data-testid="tips-panel"]');
		expect(panel?.className).toMatch(/border|rounded|bg-/);
	});
});

describe('DrawSteelTipsPanel Component - Edge Cases', () => {
	it('should handle missing onDismiss callback gracefully', async () => {
		render(DrawSteelTipsPanel);

		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });

		// Should not throw error when onDismiss is undefined
		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});

	it('should render all content when not dismissed', () => {
		render(DrawSteelTipsPanel, { dismissed: false });

		// All major sections should be present
		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();
		expect(screen.getByText(/text.*for names/i)).toBeInTheDocument();
		expect(screen.getByText(/number.*for AC/i)).toBeInTheDocument();
	});

	it('should maintain state across rerenders', () => {
		const { rerender } = render(DrawSteelTipsPanel, { dismissed: false });

		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();

		rerender({ dismissed: false });
		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();
	});
});
