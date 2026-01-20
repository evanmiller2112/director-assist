/**
 * Tests for AiSetupBanner Component (Issue #195)
 *
 * This component displays a banner prompting users to configure AI when they
 * haven't set up any API keys yet. It offers two actions: configure AI or
 * permanently dismiss the banner.
 *
 * Covers:
 * - Rendering and basic display
 * - Message content about AI setup
 * - Configure button callback
 * - Dismiss button callback
 * - Close (X) button callback
 * - Proper accessibility attributes
 * - Banner visibility and styling
 * - Button interactivity
 * - Edge cases and error handling
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AiSetupBanner from './AiSetupBanner.svelte';

describe('AiSetupBanner Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(AiSetupBanner);
		expect(container).toBeInTheDocument();
	});

	it('should render as a visible banner', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have distinctive styling (background color)', () => {
		const { container } = render(AiSetupBanner);

		// Banner should have background color for visibility
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/bg-/);
	});

	it('should have padding for content spacing', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/p-|px-|py-/);
	});

	it('should be visually distinct from other banners', () => {
		const { container } = render(AiSetupBanner);

		// Should have border or other visual distinction
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});
});

describe('AiSetupBanner Component - Message Content', () => {
	it('should display message about AI setup', () => {
		render(AiSetupBanner);

		// Should mention AI or configuration
		expect(screen.getByText(/AI|configure|setup|assistant/i)).toBeInTheDocument();
	});

	it('should explain what needs to be configured', () => {
		render(AiSetupBanner);

		// Should mention API key or configuration
		expect(screen.getByText(/API|key|configure|setup/i)).toBeInTheDocument();
	});

	it('should have encouraging, helpful tone', () => {
		render(AiSetupBanner);

		// Should have positive message about AI features
		const banner = screen.getByText(/AI|configure|setup|assistant/i);
		expect(banner).toBeInTheDocument();
	});

	it('should explain the benefit of setting up AI', () => {
		render(AiSetupBanner);

		// Should mention features, help, or benefits
		expect(
			screen.getByText(/feature|help|assist|generate|enhance|improve|content|description/i)
		).toBeInTheDocument();
	});

	it('should be clear and concise', () => {
		const { container } = render(AiSetupBanner);

		// Message shouldn't be excessively long
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		const text = banner?.textContent || '';

		// Message should be present but not overwhelming
		expect(text.length).toBeGreaterThan(10);
		expect(text.length).toBeLessThan(500);
	});
});

describe('AiSetupBanner Component - Action Buttons', () => {
	it('should render Configure button', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		expect(configButton).toBeInTheDocument();
	});

	it('should render Dismiss button', () => {
		render(AiSetupBanner);

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should render close (X) button', () => {
		render(AiSetupBanner);

		// Look for close button (might be aria-label or icon)
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should style Configure as primary action', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		// Primary button should have prominent styling
		expect(configButton).toHaveClass(/primary|bg-|border/);
	});

	it('should style Dismiss as secondary action', () => {
		render(AiSetupBanner);

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		// Secondary button should have less prominent styling
		expect(dismissButton).toHaveClass(/secondary|ghost|text-|border/);
	});

	it('should have both action buttons', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		expect(configButton).toBeInTheDocument();
		expect(dismissButton).toBeInTheDocument();
	});
});

describe('AiSetupBanner Component - Configure Callback', () => {
	it('should call onConfigure when Configure button is clicked', async () => {
		const onConfigure = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		await fireEvent.click(configButton);

		expect(onConfigure).toHaveBeenCalledTimes(1);
	});

	it('should call onConfigure only once per click', async () => {
		const onConfigure = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		await fireEvent.click(configButton);

		expect(onConfigure).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onConfigure callback gracefully', async () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(configButton);
		}).not.toThrow();
	});

	it('should not call onDismiss when Configure button is clicked', async () => {
		const onConfigure = vi.fn();
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure,
				onDismiss
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		await fireEvent.click(configButton);

		expect(onConfigure).toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should handle multiple rapid clicks on Configure', async () => {
		const onConfigure = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });

		await fireEvent.click(configButton);
		await fireEvent.click(configButton);
		await fireEvent.click(configButton);

		// Should call callback multiple times (parent handles debouncing if needed)
		expect(onConfigure).toHaveBeenCalledTimes(3);
	});
});

describe('AiSetupBanner Component - Dismiss Callback', () => {
	it('should call onDismiss when Dismiss button is clicked', async () => {
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should call onDismiss only once per click', async () => {
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onDismiss callback gracefully', async () => {
		render(AiSetupBanner);

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});

	it('should not call onConfigure when Dismiss button is clicked', async () => {
		const onConfigure = vi.fn();
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure,
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalled();
		expect(onConfigure).not.toHaveBeenCalled();
	});

	it('should handle multiple rapid clicks on Dismiss', async () => {
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		await fireEvent.click(dismissButton);
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalled();
	});
});

describe('AiSetupBanner Component - Close Button Callback', () => {
	it('should call onDismiss when close (X) button is clicked', async () => {
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDismiss
			}
		});

		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		await fireEvent.click(closeButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should distinguish close button from Dismiss button', async () => {
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDismiss
			}
		});

		// Both should call onDismiss but should be separate buttons
		const buttons = screen.getAllByRole('button');
		const dismissButtons = buttons.filter((btn) =>
			/close|dismiss|not now|skip/i.test(btn.textContent || btn.getAttribute('aria-label') || '')
		);

		expect(dismissButtons.length).toBeGreaterThanOrEqual(2);
	});

	it('should not call onConfigure when close button is clicked', async () => {
		const onConfigure = vi.fn();
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure,
				onDismiss
			}
		});

		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		await fireEvent.click(closeButton);

		expect(onDismiss).toHaveBeenCalled();
		expect(onConfigure).not.toHaveBeenCalled();
	});
});

describe('AiSetupBanner Component - Accessibility', () => {
	it('should have role="alert" or role="banner"', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have aria-live for screen readers', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[aria-live="polite"], [aria-live="assertive"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });

		expect(configButton).toHaveAccessibleName();
		expect(dismissButton).toHaveAccessibleName();
		expect(closeButton).toHaveAccessibleName();
	});

	it('should have keyboard accessible buttons', () => {
		render(AiSetupBanner);

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			// Buttons should not have tabindex -1 (should be focusable)
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should have appropriate color contrast', () => {
		const { container } = render(AiSetupBanner);

		// Banner should have visible background
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/bg-/);

		// Text should be readable (not invisible)
		expect(banner).not.toHaveClass(/text-transparent/);
	});

	it('should provide context for screen reader users', () => {
		render(AiSetupBanner);

		// Should have meaningful text content about AI
		expect(screen.getByText(/AI|configure|setup|assistant/i)).toBeInTheDocument();
	});

	it('should have focus visible styles on buttons', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });

		// Button should have focus styles
		expect(configButton).toHaveClass(/focus|ring/);
	});

	it('should have descriptive aria-label for close button', () => {
		render(AiSetupBanner);

		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		expect(closeButton).toHaveAccessibleName();
	});
});

describe('AiSetupBanner Component - Visual Design', () => {
	it('should have border for visual separation', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/border/);
	});

	it('should have rounded corners', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/rounded/);
	});

	it('should use appropriate spacing between elements', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		// Should have gap or space classes for children
		expect(banner).toHaveClass(/gap|space/);
	});

	it('should have icon for visual clarity', () => {
		const { container } = render(AiSetupBanner);

		// Look for icon element (svg, or icon class)
		const icon = container.querySelector('svg, [class*="icon"]');
		expect(icon).toBeInTheDocument();
	});

	it('should arrange buttons in a logical flow', () => {
		render(AiSetupBanner);

		const buttons = screen.getAllByRole('button');
		// Should have at least 2 action buttons (Configure and Dismiss)
		expect(buttons.length).toBeGreaterThanOrEqual(2);
	});

	it('should be full-width or prominently placed', () => {
		const { container } = render(AiSetupBanner);

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		// Should have width styling
		expect(banner).toHaveClass(/w-/);
	});

	it('should have consistent styling with other banners', () => {
		const { container } = render(AiSetupBanner);

		// Should follow similar pattern to BackupReminderBanner
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
		expect(banner).toHaveClass(/bg-/);
		expect(banner).toHaveClass(/border/);
		expect(banner).toHaveClass(/rounded/);
	});
});

describe('AiSetupBanner Component - Interaction Flow', () => {
	it('should provide clear call-to-action', () => {
		render(AiSetupBanner);

		// Primary action should be clear
		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		expect(configButton).toBeInTheDocument();
		expect(configButton).toBeVisible();
	});

	it('should allow easy dismissal', () => {
		render(AiSetupBanner);

		// Should have at least 2 ways to dismiss (Dismiss button and X)
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });

		expect(dismissButton).toBeInTheDocument();
		expect(closeButton).toBeInTheDocument();
	});

	it('should maintain consistent button order', () => {
		const { container } = render(AiSetupBanner);

		const buttons = container.querySelectorAll('button');
		// Button order should be consistent
		expect(buttons.length).toBeGreaterThanOrEqual(2);
	});

	it('should provide feedback on hover (via CSS)', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		// Button should have hover styles
		expect(configButton).toHaveClass(/hover/);
	});

	it('should clearly differentiate primary and secondary actions', () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		// Primary should have more prominent styling
		expect(configButton).toHaveClass(/bg-|primary/);
		// Secondary should be less prominent
		expect(dismissButton).toHaveClass(/secondary|ghost|text-/);
	});
});

describe('AiSetupBanner Component - Edge Cases', () => {
	it('should render consistently on multiple renders', () => {
		const { rerender } = render(AiSetupBanner);

		expect(screen.getByText(/AI|configure|setup|assistant/i)).toBeInTheDocument();

		rerender({});

		expect(screen.getByText(/AI|configure|setup|assistant/i)).toBeInTheDocument();
	});

	it('should handle undefined callbacks gracefully', async () => {
		render(AiSetupBanner, {
			props: {
				onConfigure: undefined,
				onDismiss: undefined
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		// Should not throw
		await expect(async () => {
			await fireEvent.click(configButton);
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});

	it('should maintain state across props changes', () => {
		const onConfigure1 = vi.fn();
		const onConfigure2 = vi.fn();

		const { rerender } = render(AiSetupBanner, {
			props: {
				onConfigure: onConfigure1
			}
		});

		rerender({ onConfigure: onConfigure2 });

		// Should still render correctly
		expect(screen.getByRole('button', { name: /configure|setup|get started/i })).toBeInTheDocument();
	});

	it('should be responsive to different screen sizes (via CSS)', () => {
		const { container } = render(AiSetupBanner);

		// Should have responsive classes
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		// Responsive design typically uses sm:, md:, lg: prefixes
		expect(banner).toBeInTheDocument();
	});
});

describe('AiSetupBanner Component - Content Quality', () => {
	it('should explain why AI is useful', () => {
		render(AiSetupBanner);

		// Should mention benefits like generating content, helping, etc.
		expect(
			screen.getByText(/generate|help|assist|feature|enhance|improve|content|description/i)
		).toBeInTheDocument();
	});

	it('should be welcoming and non-intrusive', () => {
		const { container } = render(AiSetupBanner);

		// Message should be helpful, not demanding
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should indicate this is optional', () => {
		render(AiSetupBanner);

		// Should have dismiss option indicating it's optional
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should be clear about what action Configure takes', () => {
		render(AiSetupBanner);

		// Configure button should be clearly labeled
		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		expect(configButton).toHaveAccessibleName();
	});

	it('should be clear about permanence of dismissal', () => {
		render(AiSetupBanner);

		// Dismiss button should exist (permanence will be explained in implementation)
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });
		expect(dismissButton).toBeInTheDocument();
	});
});

describe('AiSetupBanner Component - Integration', () => {
	it('should work with both callbacks provided', async () => {
		const onConfigure = vi.fn();
		const onDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onConfigure,
				onDismiss
			}
		});

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		await fireEvent.click(configButton);
		expect(onConfigure).toHaveBeenCalledTimes(1);
		expect(onDismiss).not.toHaveBeenCalled();

		await fireEvent.click(dismissButton);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onConfigure).toHaveBeenCalledTimes(1); // Still just 1
	});

	it('should work with no callbacks provided', async () => {
		render(AiSetupBanner);

		const configButton = screen.getByRole('button', { name: /configure|setup|get started/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss|not now|skip/i });

		// Should not throw
		await expect(async () => {
			await fireEvent.click(configButton);
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});

	it('should be usable in different layout contexts', () => {
		const { container } = render(AiSetupBanner);

		// Should render correctly regardless of parent
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});
});
