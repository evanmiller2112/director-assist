/**
 * Tests for BackupReminderBanner Component (Issue #152)
 *
 * This component displays a smart backup reminder banner that prompts users to
 * backup their campaign data based on different trigger conditions (first-time,
 * milestone, or time-based).
 *
 * Covers:
 * - Rendering different message variants for each reason type
 * - Displaying entity count for milestone messages
 * - Displaying days count for time-based messages
 * - Export Now button callback
 * - Remind Me Later button callback
 * - Close (X) button callback
 * - Proper accessibility attributes
 * - Banner visibility and styling
 * - Button interactivity
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BackupReminderBanner from './BackupReminderBanner.svelte';
import type { BackupReminderReason } from '$lib/types';

describe('BackupReminderBanner Component - Basic Rendering (Issue #152)', () => {
	it('should render without crashing', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render as a visible banner', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have distinctive styling (background color)', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Banner should have background color for visibility
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/bg-/);
	});

	it('should have padding for content spacing', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/p-|px-|py-/);
	});
});

describe('BackupReminderBanner Component - First-time Message', () => {
	it('should render first-time message correctly', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Should mention backing up data
		expect(screen.getByText(/backup/i)).toBeInTheDocument();
	});

	it('should suggest creating first backup', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Message should indicate this is the first time
		expect(screen.getByText(/first|initial|start/i)).toBeInTheDocument();
	});

	it('should encourage user to protect their data', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Should have positive, encouraging message
		expect(screen.getByText(/campaign|data|content/i)).toBeInTheDocument();
	});

	it('should display first-time message for various entity counts', () => {
		const { rerender } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		expect(screen.getByText(/backup/i)).toBeInTheDocument();

		rerender({ reason: 'first-time' as BackupReminderReason, entityCount: 10 });
		expect(screen.getByText(/backup/i)).toBeInTheDocument();

		rerender({ reason: 'first-time' as BackupReminderReason, entityCount: 100 });
		expect(screen.getByText(/backup/i)).toBeInTheDocument();
	});
});

describe('BackupReminderBanner Component - Milestone Message', () => {
	it('should render milestone message correctly', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 10
			}
		});

		// Should mention milestone or achievement
		expect(screen.getByText(/milestone|reached|created/i)).toBeInTheDocument();
	});

	it('should display entity count in milestone message', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 10
			}
		});

		// Should show the specific count
		expect(screen.getByText(/10/)).toBeInTheDocument();
	});

	it('should display 25 entities milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25
			}
		});

		expect(screen.getByText(/25/)).toBeInTheDocument();
	});

	it('should display 50 entities milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 50
			}
		});

		expect(screen.getByText(/50/)).toBeInTheDocument();
	});

	it('should display 100 entities milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 100
			}
		});

		expect(screen.getByText(/100/)).toBeInTheDocument();
	});

	it('should display 150 entities milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 150
			}
		});

		expect(screen.getByText(/150/)).toBeInTheDocument();
	});

	it('should display very high entity count milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 500
			}
		});

		expect(screen.getByText(/500/)).toBeInTheDocument();
	});

	it('should congratulate user on milestone', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25
			}
		});

		// Should have positive/congratulatory tone
		expect(screen.getByText(/great|congrat|nice|awesome|amazing/i)).toBeInTheDocument();
	});

	it('should mention backing up data in milestone message', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25
			}
		});

		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup|save|export|protect/i);
		expect(matches.length).toBeGreaterThan(0);
	});
});

describe('BackupReminderBanner Component - Time-based Message', () => {
	it('should render time-based message correctly', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 7
			}
		});

		// Should mention time period
		expect(screen.getByText(/day|week|time/i)).toBeInTheDocument();
	});

	it('should display days since export in time-based message', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 7
			}
		});

		// Should show the specific number of days
		expect(screen.getByText(/7/)).toBeInTheDocument();
	});

	it('should display 10 days since export', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 15,
				daysSinceExport: 10
			}
		});

		expect(screen.getByText(/10/)).toBeInTheDocument();
	});

	it('should display 30 days since export', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 20,
				daysSinceExport: 30
			}
		});

		expect(screen.getByText(/30/)).toBeInTheDocument();
	});

	it('should display 90 days since export', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 25,
				daysSinceExport: 90
			}
		});

		expect(screen.getByText(/90/)).toBeInTheDocument();
	});

	it('should mention last backup/export in time-based message', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 7
			}
		});

		expect(screen.getByText(/last|since|ago/i)).toBeInTheDocument();
	});

	it('should suggest creating new backup in time-based message', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 10
			}
		});

		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup|export|save/i);
		expect(matches.length).toBeGreaterThan(0);
	});

	it('should handle missing daysSinceExport gracefully', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10
				// daysSinceExport not provided
			}
		});

		// Should still render without crashing
		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup/i);
		expect(matches.length).toBeGreaterThan(0);
	});
});

describe('BackupReminderBanner Component - Action Buttons', () => {
	it('should render Export Now button', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		expect(exportButton).toBeInTheDocument();
	});

	it('should render Remind Me Later button', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later|dismiss/i });
		expect(remindButton).toBeInTheDocument();
	});

	it('should render close (X) button', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Look for close button (might be aria-label or icon)
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should style Export Now as primary action', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		// Primary button should have prominent styling
		expect(exportButton).toHaveClass(/primary|bg-|border/);
	});

	it('should style Remind Me Later as secondary action', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		// Secondary button should have less prominent styling
		expect(remindButton).toHaveClass(/secondary|ghost|text-|border/);
	});

	it('should render all buttons for all reason types', () => {
		const reasons: BackupReminderReason[] = ['first-time', 'milestone', 'time-based'];

		reasons.forEach((reason) => {
			const { unmount } = render(BackupReminderBanner, {
				props: {
					reason,
					entityCount: 10,
					daysSinceExport: 7
				}
			});

			expect(screen.getByRole('button', { name: /export|backup now/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /remind|later/i })).toBeInTheDocument();

			unmount();
		});
	});
});

describe('BackupReminderBanner Component - Export Now Callback', () => {
	it('should call onExportNow when Export button is clicked', async () => {
		const onExportNow = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onExportNow
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		await fireEvent.click(exportButton);

		expect(onExportNow).toHaveBeenCalledTimes(1);
	});

	it('should call onExportNow for milestone reason', async () => {
		const onExportNow = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25,
				onExportNow
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		await fireEvent.click(exportButton);

		expect(onExportNow).toHaveBeenCalled();
	});

	it('should call onExportNow for time-based reason', async () => {
		const onExportNow = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 7,
				onExportNow
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		await fireEvent.click(exportButton);

		expect(onExportNow).toHaveBeenCalled();
	});

	it('should handle missing onExportNow callback gracefully', async () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(exportButton);
		}).not.toThrow();
	});

	it('should not call onDismiss when Export button is clicked', async () => {
		const onExportNow = vi.fn();
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onExportNow,
				onDismiss
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		await fireEvent.click(exportButton);

		expect(onExportNow).toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

describe('BackupReminderBanner Component - Remind Me Later Callback', () => {
	it('should call onDismiss when Remind Me Later button is clicked', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onDismiss
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		await fireEvent.click(remindButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should call onDismiss for milestone reason', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25,
				onDismiss
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		await fireEvent.click(remindButton);

		expect(onDismiss).toHaveBeenCalled();
	});

	it('should call onDismiss for time-based reason', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 7,
				onDismiss
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		await fireEvent.click(remindButton);

		expect(onDismiss).toHaveBeenCalled();
	});

	it('should handle missing onDismiss callback gracefully', async () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(remindButton);
		}).not.toThrow();
	});

	it('should not call onExportNow when Remind Me Later is clicked', async () => {
		const onExportNow = vi.fn();
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onExportNow,
				onDismiss
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		await fireEvent.click(remindButton);

		expect(onDismiss).toHaveBeenCalled();
		expect(onExportNow).not.toHaveBeenCalled();
	});
});

describe('BackupReminderBanner Component - Close Button Callback', () => {
	it('should call onDismiss when close (X) button is clicked', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onDismiss
			}
		});

		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
		await fireEvent.click(closeButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should call onDismiss for all reason types via close button', async () => {
		const reasons: BackupReminderReason[] = ['first-time', 'milestone', 'time-based'];

		for (const reason of reasons) {
			const onDismiss = vi.fn();
			const { unmount } = render(BackupReminderBanner, {
				props: {
					reason,
					entityCount: 10,
					daysSinceExport: 7,
					onDismiss
				}
			});

			const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
			await fireEvent.click(closeButton);

			expect(onDismiss).toHaveBeenCalled();

			unmount();
		}
	});

	it('should distinguish close button from Remind Me Later button', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onDismiss
			}
		});

		// Both should call onDismiss but should be separate buttons
		const buttons = screen.getAllByRole('button');
		const dismissButtons = buttons.filter((btn) =>
			/close|dismiss|remind|later/i.test(btn.textContent || btn.getAttribute('aria-label') || '')
		);

		expect(dismissButtons.length).toBeGreaterThanOrEqual(2);
	});
});

describe('BackupReminderBanner Component - Accessibility', () => {
	it('should have role="alert" or role="banner"', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have aria-live for screen readers', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[aria-live="polite"], [aria-live="assertive"]');
		expect(banner).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });

		expect(exportButton).toHaveAccessibleName();
		expect(remindButton).toHaveAccessibleName();
		expect(closeButton).toHaveAccessibleName();
	});

	it('should have keyboard accessible buttons', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			// Buttons should not have tabindex -1 (should be focusable)
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should have appropriate color contrast', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Banner should have visible background
		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/bg-/);

		// Text should be readable (not invisible)
		expect(banner).not.toHaveClass(/text-transparent/);
	});

	it('should provide context for screen reader users', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 25
			}
		});

		// Should have meaningful text content
		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup/i);
		expect(matches.length).toBeGreaterThan(0);

		// Entity count should be announced
		const count = screen.getByText(/25/);
		expect(count).toBeInTheDocument();
	});

	it('should have focus visible styles on buttons', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });

		// Button should have focus styles
		expect(exportButton).toHaveClass(/focus|ring/);
	});
});

describe('BackupReminderBanner Component - Visual Design', () => {
	it('should have border for visual separation', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/border/);
	});

	it('should have rounded corners', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		expect(banner).toHaveClass(/rounded/);
	});

	it('should use appropriate spacing between elements', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const banner = container.querySelector('[role="alert"], [role="banner"]');
		// Should have gap or space classes for children
		expect(banner).toHaveClass(/gap|space/);
	});

	it('should have icon for visual clarity', () => {
		const { container } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Look for icon element (svg, or icon class)
		const icon = container.querySelector('svg, [class*="icon"]');
		expect(icon).toBeInTheDocument();
	});

	it('should arrange buttons in a logical flow', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const buttons = screen.getAllByRole('button');
		// Should have at least 2 action buttons (Export and Remind)
		expect(buttons.length).toBeGreaterThanOrEqual(2);
	});
});

describe('BackupReminderBanner Component - Props Validation', () => {
	it('should handle all valid reason types', () => {
		const reasons: BackupReminderReason[] = ['first-time', 'milestone', 'time-based'];

		reasons.forEach((reason) => {
			const { container, unmount } = render(BackupReminderBanner, {
				props: {
					reason,
					entityCount: 10,
					daysSinceExport: 7
				}
			});

			expect(container).toBeInTheDocument();
			unmount();
		});
	});

	it('should require entityCount prop', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 10
			}
		});

		// Should render without error
		expect(screen.getByText(/backup/i)).toBeInTheDocument();
	});

	it('should handle optional daysSinceExport prop', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
				// daysSinceExport omitted
			}
		});

		// Should render without error
		expect(screen.getByText(/backup/i)).toBeInTheDocument();
	});

	it('should handle very large entity counts', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'milestone' as BackupReminderReason,
				entityCount: 10000
			}
		});

		expect(screen.getByText(/10000/)).toBeInTheDocument();
	});

	it('should handle very large days since export', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 365
			}
		});

		expect(screen.getByText(/365/)).toBeInTheDocument();
	});
});

describe('BackupReminderBanner Component - Edge Cases', () => {
	it('should handle multiple rapid clicks on Export button', async () => {
		const onExportNow = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onExportNow
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });

		await fireEvent.click(exportButton);
		await fireEvent.click(exportButton);
		await fireEvent.click(exportButton);

		// Should call callback multiple times (parent handles debouncing if needed)
		expect(onExportNow).toHaveBeenCalledTimes(3);
	});

	it('should handle multiple rapid clicks on Dismiss button', async () => {
		const onDismiss = vi.fn();

		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5,
				onDismiss
			}
		});

		const remindButton = screen.getByRole('button', { name: /remind|later/i });

		await fireEvent.click(remindButton);
		await fireEvent.click(remindButton);

		expect(onDismiss).toHaveBeenCalled();
	});

	it('should maintain message content across reason changes', () => {
		const { rerender } = render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Use getAllByText since "backup" appears in both message and button
		expect(screen.getAllByText(/backup/i).length).toBeGreaterThan(0);

		rerender({
			reason: 'milestone' as BackupReminderReason,
			entityCount: 10
		});

		expect(screen.getAllByText(/backup/i).length).toBeGreaterThan(0);

		rerender({
			reason: 'time-based' as BackupReminderReason,
			entityCount: 10,
			daysSinceExport: 7
		});

		expect(screen.getAllByText(/backup/i).length).toBeGreaterThan(0);
	});

	it('should handle zero entity count gracefully', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 0
			}
		});

		// Should render without error
		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup/i);
		expect(matches.length).toBeGreaterThan(0);
	});

	it('should handle zero days since export gracefully', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'time-based' as BackupReminderReason,
				entityCount: 10,
				daysSinceExport: 0
			}
		});

		// Should render without error
		// Use getAllByText since "backup" appears in both message and button
		const matches = screen.getAllByText(/backup/i);
		expect(matches.length).toBeGreaterThan(0);
	});
});

describe('BackupReminderBanner Component - Interaction Flow', () => {
	it('should provide clear call-to-action', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Primary action should be clear
		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		expect(exportButton).toBeInTheDocument();
		expect(exportButton).toBeVisible();
	});

	it('should allow easy dismissal', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		// Should have at least 2 ways to dismiss (Remind Later and X)
		const remindButton = screen.getByRole('button', { name: /remind|later/i });
		const closeButton = screen.getByRole('button', { name: /close|dismiss/i });

		expect(remindButton).toBeInTheDocument();
		expect(closeButton).toBeInTheDocument();
	});

	it('should maintain consistent button order', () => {
		const reasons: BackupReminderReason[] = ['first-time', 'milestone', 'time-based'];

		reasons.forEach((reason) => {
			const { container, unmount } = render(BackupReminderBanner, {
				props: {
					reason,
					entityCount: 10,
					daysSinceExport: 7
				}
			});

			const buttons = container.querySelectorAll('button');
			// Button order should be consistent across all reason types
			expect(buttons.length).toBeGreaterThanOrEqual(2);

			unmount();
		});
	});

	it('should provide feedback on hover (via CSS)', () => {
		render(BackupReminderBanner, {
			props: {
				reason: 'first-time' as BackupReminderReason,
				entityCount: 5
			}
		});

		const exportButton = screen.getByRole('button', { name: /export|backup now/i });
		// Button should have hover styles
		expect(exportButton).toHaveClass(/hover/);
	});
});
