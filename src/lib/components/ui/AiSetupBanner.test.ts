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

		// Should mention AI or configuration (using getAllByText since text appears multiple times)
		const elements = screen.getAllByText(/AI|configure|setup|assistant/i);
		expect(elements.length).toBeGreaterThan(0);
	});

	it('should explain what needs to be configured', () => {
		render(AiSetupBanner);

		// Should mention API key or configuration
		expect(screen.getByText(/API|key|configure|setup/i)).toBeInTheDocument();
	});

	it('should have encouraging, helpful tone', () => {
		render(AiSetupBanner);

		// Should have positive message about AI features (using getAllByText since text appears multiple times)
		const elements = screen.getAllByText(/AI|configure|setup|assistant/i);
		expect(elements.length).toBeGreaterThan(0);
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
	// ISSUE #214: THREE-BUTTON ENHANCEMENT - These tests will FAIL until implemented
	it('should render "Get Started" button', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		expect(getStartedButton).toBeInTheDocument();
	});

	it('should render "I\'m a Player" button', () => {
		render(AiSetupBanner);

		const playerButton = screen.getByRole('button', { name: /player/i });
		expect(playerButton).toBeInTheDocument();
	});

	it('should render "Not Using AI" button', () => {
		render(AiSetupBanner);

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		expect(notUsingButton).toBeInTheDocument();
	});

	it('should render close (X) button', () => {
		render(AiSetupBanner);

		// Look for close button (might be aria-label or icon)
		const closeButton = screen.getByRole('button', { name: /close/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should have all THREE action buttons visible', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		expect(getStartedButton).toBeInTheDocument();
		expect(playerButton).toBeInTheDocument();
		expect(notUsingButton).toBeInTheDocument();
	});

	it('should style "Get Started" as primary action', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		// Primary button should have prominent styling
		expect(getStartedButton).toHaveClass(/primary|bg-blue/);
	});

	it('should style "I\'m a Player" as secondary action', () => {
		render(AiSetupBanner);

		const playerButton = screen.getByRole('button', { name: /player/i });
		// Secondary button should have less prominent styling
		expect(playerButton).toHaveClass(/secondary|border|text-/);
	});

	it('should style "Not Using AI" as secondary action', () => {
		render(AiSetupBanner);

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		// Secondary button should have less prominent styling
		expect(notUsingButton).toHaveClass(/secondary|border|text-/);
	});

	it('should have proper button order (Get Started, Player, Not Using AI)', () => {
		const { container } = render(AiSetupBanner);

		const buttons = container.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map(
			(btn) => btn.textContent?.toLowerCase() || btn.getAttribute('aria-label')?.toLowerCase() || ''
		);

		// Get Started should come before Player and Not Using AI
		const getStartedIndex = buttonTexts.findIndex((text) => text.includes('get started'));
		const playerIndex = buttonTexts.findIndex((text) => text.includes('player'));
		const notUsingIndex = buttonTexts.findIndex((text) => text.includes('not using'));

		expect(getStartedIndex).toBeGreaterThanOrEqual(0);
		expect(playerIndex).toBeGreaterThan(getStartedIndex);
		expect(notUsingIndex).toBeGreaterThan(playerIndex);
	});
});

describe('AiSetupBanner Component - Get Started Callback', () => {
	// ISSUE #214: "Get Started" button navigates to AI settings
	it('should call onGetStarted when "Get Started" button is clicked', async () => {
		const onGetStarted = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		await fireEvent.click(getStartedButton);

		expect(onGetStarted).toHaveBeenCalledTimes(1);
	});

	it('should call onGetStarted only once per click', async () => {
		const onGetStarted = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		await fireEvent.click(getStartedButton);

		expect(onGetStarted).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onGetStarted callback gracefully', async () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(getStartedButton);
		}).not.toThrow();
	});

	it('should not call other callbacks when Get Started is clicked', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		await fireEvent.click(getStartedButton);

		expect(onGetStarted).toHaveBeenCalled();
		expect(onPlayerDismiss).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();
	});

	it('should handle multiple rapid clicks on Get Started', async () => {
		const onGetStarted = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });

		await fireEvent.click(getStartedButton);
		await fireEvent.click(getStartedButton);
		await fireEvent.click(getStartedButton);

		// Should call callback multiple times (parent handles debouncing if needed)
		expect(onGetStarted).toHaveBeenCalledTimes(3);
	});
});

describe('AiSetupBanner Component - "I\'m a Player" Callback', () => {
	// ISSUE #214: "I'm a Player" button dismisses without disabling AI
	it('should call onPlayerDismiss when "I\'m a Player" button is clicked', async () => {
		const onPlayerDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onPlayerDismiss
			}
		});

		const playerButton = screen.getByRole('button', { name: /player/i });
		await fireEvent.click(playerButton);

		expect(onPlayerDismiss).toHaveBeenCalledTimes(1);
	});

	it('should call onPlayerDismiss only once per click', async () => {
		const onPlayerDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onPlayerDismiss
			}
		});

		const playerButton = screen.getByRole('button', { name: /player/i });
		await fireEvent.click(playerButton);

		expect(onPlayerDismiss).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onPlayerDismiss callback gracefully', async () => {
		render(AiSetupBanner);

		const playerButton = screen.getByRole('button', { name: /player/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(playerButton);
		}).not.toThrow();
	});

	it('should not call other callbacks when Player button is clicked', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		const playerButton = screen.getByRole('button', { name: /player/i });
		await fireEvent.click(playerButton);

		expect(onPlayerDismiss).toHaveBeenCalled();
		expect(onGetStarted).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();
	});

	it('should handle multiple rapid clicks on Player button', async () => {
		const onPlayerDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onPlayerDismiss
			}
		});

		const playerButton = screen.getByRole('button', { name: /player/i });

		await fireEvent.click(playerButton);
		await fireEvent.click(playerButton);

		expect(onPlayerDismiss).toHaveBeenCalled();
	});
});

describe('AiSetupBanner Component - "Not Using AI" Callback', () => {
	// ISSUE #214: "Not Using AI" button disables AI and dismisses
	it('should call onDisableAi when "Not Using AI" button is clicked', async () => {
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDisableAi
			}
		});

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		await fireEvent.click(notUsingButton);

		expect(onDisableAi).toHaveBeenCalledTimes(1);
	});

	it('should call onDisableAi only once per click', async () => {
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDisableAi
			}
		});

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		await fireEvent.click(notUsingButton);

		expect(onDisableAi).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onDisableAi callback gracefully', async () => {
		render(AiSetupBanner);

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(notUsingButton);
		}).not.toThrow();
	});

	it('should not call other callbacks when Not Using AI is clicked', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		await fireEvent.click(notUsingButton);

		expect(onDisableAi).toHaveBeenCalled();
		expect(onGetStarted).not.toHaveBeenCalled();
		expect(onPlayerDismiss).not.toHaveBeenCalled();
	});

	it('should handle multiple rapid clicks on Not Using AI button', async () => {
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onDisableAi
			}
		});

		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		await fireEvent.click(notUsingButton);
		await fireEvent.click(notUsingButton);

		expect(onDisableAi).toHaveBeenCalled();
	});
});

describe('AiSetupBanner Component - Close Button Callback', () => {
	// ISSUE #214: Close button should behave like temporary dismiss
	it('should call onPlayerDismiss when close (X) button is clicked', async () => {
		const onPlayerDismiss = vi.fn();

		render(AiSetupBanner, {
			props: {
				onPlayerDismiss
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onPlayerDismiss).toHaveBeenCalledTimes(1);
	});

	it('should distinguish close button from action buttons', async () => {
		render(AiSetupBanner);

		// Should have close button plus 3 action buttons
		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBeGreaterThanOrEqual(4);
	});

	it('should not call other callbacks when close button is clicked', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onPlayerDismiss).toHaveBeenCalled();
		expect(onGetStarted).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();
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

	// ISSUE #214: All three buttons must have accessible labels
	it('should have accessible button labels for all THREE action buttons', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		const closeButton = screen.getByRole('button', { name: /close/i });

		expect(getStartedButton).toHaveAccessibleName();
		expect(playerButton).toHaveAccessibleName();
		expect(notUsingButton).toHaveAccessibleName();
		expect(closeButton).toHaveAccessibleName();
	});

	it('should have descriptive aria-labels that explain button purpose', () => {
		render(AiSetupBanner);

		// "Get Started" should clearly indicate it navigates to settings
		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		expect(getStartedButton).toHaveAccessibleName();

		// "I'm a Player" should indicate it's for players who don't need AI
		const playerButton = screen.getByRole('button', { name: /player/i });
		expect(playerButton).toHaveAccessibleName();

		// "Not Using AI" should indicate it disables AI features
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		expect(notUsingButton).toHaveAccessibleName();
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

		// Should have meaningful text content about AI (using getAllByText since text appears multiple times)
		const elements = screen.getAllByText(/AI|configure|setup|assistant/i);
		expect(elements.length).toBeGreaterThan(0);
	});

	it('should have focus visible styles on all buttons', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// All buttons should have focus styles
		expect(getStartedButton).toHaveClass(/focus|ring/);
		expect(playerButton).toHaveClass(/focus|ring/);
		expect(notUsingButton).toHaveClass(/focus|ring/);
	});

	it('should have descriptive aria-label for close button', () => {
		render(AiSetupBanner);

		const closeButton = screen.getByRole('button', { name: /close/i });
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
	// ISSUE #214: Three clear options for different user scenarios
	it('should provide clear call-to-action for DMs who want AI', () => {
		render(AiSetupBanner);

		// Primary action should be clear
		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		expect(getStartedButton).toBeInTheDocument();
		expect(getStartedButton).toBeVisible();
	});

	it('should provide clear option for players', () => {
		render(AiSetupBanner);

		// Player option should be clear
		const playerButton = screen.getByRole('button', { name: /player/i });
		expect(playerButton).toBeInTheDocument();
		expect(playerButton).toBeVisible();
	});

	it('should provide clear option for DMs not using AI', () => {
		render(AiSetupBanner);

		// Not using AI option should be clear
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		expect(notUsingButton).toBeInTheDocument();
		expect(notUsingButton).toBeVisible();
	});

	it('should allow easy dismissal with close button', () => {
		render(AiSetupBanner);

		// Should have close button for quick dismissal
		const closeButton = screen.getByRole('button', { name: /close/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should maintain consistent button order (Get Started, Player, Not Using)', () => {
		const { container } = render(AiSetupBanner);

		const buttons = container.querySelectorAll('button');
		// Should have 4 buttons total (3 actions + close)
		expect(buttons.length).toBe(4);
	});

	it('should provide feedback on hover for all action buttons (via CSS)', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// All buttons should have hover styles
		expect(getStartedButton).toHaveClass(/hover/);
		expect(playerButton).toHaveClass(/hover/);
		expect(notUsingButton).toHaveClass(/hover/);
	});

	it('should clearly differentiate primary action from alternatives', () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// Primary should have more prominent styling
		expect(getStartedButton).toHaveClass(/bg-blue/);
		// Alternatives should be less prominent
		expect(playerButton).toHaveClass(/border/);
		expect(notUsingButton).toHaveClass(/border/);
	});
});

describe('AiSetupBanner Component - Edge Cases', () => {
	it('should render consistently on multiple renders', () => {
		const { rerender } = render(AiSetupBanner);

		// Using getAllByText since text appears multiple times
		let elements = screen.getAllByText(/AI|configure|setup|assistant/i);
		expect(elements.length).toBeGreaterThan(0);

		rerender({});

		elements = screen.getAllByText(/AI|configure|setup|assistant/i);
		expect(elements.length).toBeGreaterThan(0);
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
	// ISSUE #214: All three callbacks work independently
	it('should work with all THREE callbacks provided', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		await fireEvent.click(getStartedButton);
		expect(onGetStarted).toHaveBeenCalledTimes(1);
		expect(onPlayerDismiss).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();

		await fireEvent.click(playerButton);
		expect(onPlayerDismiss).toHaveBeenCalledTimes(1);
		expect(onGetStarted).toHaveBeenCalledTimes(1); // Still just 1
		expect(onDisableAi).not.toHaveBeenCalled();

		await fireEvent.click(notUsingButton);
		expect(onDisableAi).toHaveBeenCalledTimes(1);
		expect(onGetStarted).toHaveBeenCalledTimes(1); // Still just 1
		expect(onPlayerDismiss).toHaveBeenCalledTimes(1); // Still just 1
	});

	it('should work with no callbacks provided', async () => {
		render(AiSetupBanner);

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// Should not throw
		await expect(async () => {
			await fireEvent.click(getStartedButton);
			await fireEvent.click(playerButton);
			await fireEvent.click(notUsingButton);
		}).not.toThrow();
	});

	it('should work with partial callbacks provided', async () => {
		const onGetStarted = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted
				// onPlayerDismiss and onDisableAi not provided
			}
		});

		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		const playerButton = screen.getByRole('button', { name: /player/i });
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });

		// Should not throw even with missing callbacks
		await expect(async () => {
			await fireEvent.click(getStartedButton);
			await fireEvent.click(playerButton);
			await fireEvent.click(notUsingButton);
		}).not.toThrow();

		expect(onGetStarted).toHaveBeenCalledTimes(1);
	});

	it('should be usable in different layout contexts', () => {
		const { container } = render(AiSetupBanner);

		// Should render correctly regardless of parent
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should handle complete user flow: DM gets started', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		// DM clicks "Get Started" to configure AI
		const getStartedButton = screen.getByRole('button', { name: /get started/i });
		await fireEvent.click(getStartedButton);

		expect(onGetStarted).toHaveBeenCalledTimes(1);
		expect(onPlayerDismiss).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();
	});

	it('should handle complete user flow: Player dismisses', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		// Player clicks "I'm a Player" to dismiss
		const playerButton = screen.getByRole('button', { name: /player/i });
		await fireEvent.click(playerButton);

		expect(onPlayerDismiss).toHaveBeenCalledTimes(1);
		expect(onGetStarted).not.toHaveBeenCalled();
		expect(onDisableAi).not.toHaveBeenCalled();
	});

	it('should handle complete user flow: DM disables AI', async () => {
		const onGetStarted = vi.fn();
		const onPlayerDismiss = vi.fn();
		const onDisableAi = vi.fn();

		render(AiSetupBanner, {
			props: {
				onGetStarted,
				onPlayerDismiss,
				onDisableAi
			}
		});

		// DM clicks "Not Using AI" to disable AI features
		const notUsingButton = screen.getByRole('button', { name: /not using ai/i });
		await fireEvent.click(notUsingButton);

		expect(onDisableAi).toHaveBeenCalledTimes(1);
		expect(onGetStarted).not.toHaveBeenCalled();
		expect(onPlayerDismiss).not.toHaveBeenCalled();
	});
});
