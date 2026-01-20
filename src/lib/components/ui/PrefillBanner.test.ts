/**
 * Tests for PrefillBanner Component (TDD RED Phase - Phase A4)
 *
 * Issue #40: AI Chat Panel - Phase A4 (Save Flow & Prefill)
 *
 * This component displays an informational banner at the top of entity forms
 * when they have been prefilled from chat. It shows a message explaining the
 * prefill, a dismiss button, and optionally a link back to the original chat message.
 *
 * These tests should FAIL initially as the component doesn't exist yet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PrefillBanner from './PrefillBanner.svelte';
import { goto } from '$app/navigation';

// Mock the navigation
vi.mock('$app/navigation', async () => {
	const actual = await vi.importActual('../../../tests/mocks/$app/navigation');
	return actual;
});

describe('PrefillBanner Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering - Basic Display', () => {
		it('should render info message about prefilled form', () => {
			render(PrefillBanner, {
				props: {}
			});

			expect(screen.getByText(/prefilled/i)).toBeInTheDocument();
		});

		it('should render dismiss button', () => {
			render(PrefillBanner, {
				props: {}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			expect(dismissButton).toBeInTheDocument();
		});

		it('should have informational styling', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			// Should use info/blue colors
			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner).toBeInTheDocument();
		});

		it('should display clear message about AI-generated content', () => {
			render(PrefillBanner, {
				props: {}
			});

			// Should mention that data was generated or prefilled
			const text = screen.getByText(/prefilled|generated|chat/i);
			expect(text).toBeInTheDocument();
		});

		it('should render with appropriate ARIA role', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			// Should have role="status" or role="alert" for screen readers
			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner).toBeInTheDocument();
		});
	});

	describe('Dismiss Functionality', () => {
		it('should call onDismiss when dismiss button clicked', async () => {
			const onDismiss = vi.fn();

			render(PrefillBanner, {
				props: {
					onDismiss
				}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			await fireEvent.click(dismissButton);

			expect(onDismiss).toHaveBeenCalledTimes(1);
		});

		it('should not throw error when onDismiss not provided', async () => {
			render(PrefillBanner, {
				props: {}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });

			expect(async () => {
				await fireEvent.click(dismissButton);
			}).not.toThrow();
		});

		it('should call onDismiss only once per click', async () => {
			const onDismiss = vi.fn();

			render(PrefillBanner, {
				props: {
					onDismiss
				}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			await fireEvent.click(dismissButton);

			expect(onDismiss).toHaveBeenCalledTimes(1);
		});

		it('should have accessible dismiss button', () => {
			render(PrefillBanner, {
				props: {}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			expect(dismissButton).toHaveAccessibleName();
		});
	});

	describe('Source Message Link', () => {
		it('should show "View original message" link when sourceMessageId provided', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-123'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link).toBeInTheDocument();
		});

		it('should not show link when sourceMessageId not provided', () => {
			render(PrefillBanner, {
				props: {}
			});

			const link = screen.queryByRole('link', { name: /view original message|original message/i });
			expect(link).not.toBeInTheDocument();
		});

		it('should not show link when sourceMessageId is empty string', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: ''
				}
			});

			const link = screen.queryByRole('link', { name: /view original message|original message/i });
			expect(link).not.toBeInTheDocument();
		});

		it('should not show link when sourceMessageId is undefined', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: undefined
				}
			});

			const link = screen.queryByRole('link', { name: /view original message|original message/i });
			expect(link).not.toBeInTheDocument();
		});

		it('should navigate to chat page when link clicked', async () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-456'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			await fireEvent.click(link);

			expect(goto).toHaveBeenCalled();
		});

		it('should navigate to correct chat URL with message ID', async () => {
			const messageId = 'msg-789';

			render(PrefillBanner, {
				props: {
					sourceMessageId: messageId
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			await fireEvent.click(link);

			expect(goto).toHaveBeenCalledWith(expect.stringContaining('/chat'));
			expect(goto).toHaveBeenCalledWith(expect.stringContaining(messageId));
		});

		it('should have proper href attribute for keyboard navigation', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-abc'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link).toHaveAttribute('href');
			expect(link.getAttribute('href')).toContain('/chat');
		});

		it('should be accessible via keyboard', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-def'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link.tagName).toBe('A');
		});
	});

	describe('Visual Styling', () => {
		it('should use info/blue color scheme', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner?.className).toMatch(/blue|info/i);
		});

		it('should have appropriate padding and spacing', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner?.className).toMatch(/p-|padding/);
		});

		it('should have rounded corners', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner?.className).toMatch(/rounded/);
		});

		it('should display icon for visual emphasis', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			// Should contain an info/alert icon
			const svg = container.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('should have close/dismiss icon button', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			const svg = dismissButton.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA role', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner).toBeInTheDocument();
		});

		it('should have accessible dismiss button', () => {
			render(PrefillBanner, {
				props: {}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			expect(dismissButton).toHaveAccessibleName();
		});

		it('should have accessible link when sourceMessageId provided', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-123'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link).toHaveAccessibleName();
		});

		it('should support keyboard navigation for dismiss', async () => {
			const onDismiss = vi.fn();

			render(PrefillBanner, {
				props: {
					onDismiss
				}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			expect(dismissButton).toHaveAttribute('type', 'button');
		});

		it('should support keyboard navigation for link', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-456'
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link.tagName).toBe('A');
			expect(link).toHaveAttribute('href');
		});

		it('should have descriptive text for screen readers', () => {
			render(PrefillBanner, {
				props: {}
			});

			// Should have clear text explaining the prefill
			const text = screen.getByText(/prefilled|generated/i);
			expect(text).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle very long sourceMessageId', () => {
			const longMessageId = 'msg-' + 'a'.repeat(100);

			render(PrefillBanner, {
				props: {
					sourceMessageId: longMessageId
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link).toBeInTheDocument();
		});

		it('should handle special characters in sourceMessageId', () => {
			const specialMessageId = 'msg-with-special-chars-&-symbols';

			render(PrefillBanner, {
				props: {
					sourceMessageId: specialMessageId
				}
			});

			const link = screen.getByRole('link', { name: /view original message|original message/i });
			expect(link).toBeInTheDocument();
		});

		it('should handle multiple rapid dismiss clicks', async () => {
			const onDismiss = vi.fn();

			render(PrefillBanner, {
				props: {
					onDismiss
				}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });

			// Click multiple times rapidly
			await fireEvent.click(dismissButton);
			await fireEvent.click(dismissButton);
			await fireEvent.click(dismissButton);

			// Should handle gracefully (might be called multiple times)
			expect(onDismiss.mock.calls.length).toBeGreaterThanOrEqual(1);
		});

		it('should render without errors when all props are undefined', () => {
			expect(() => {
				render(PrefillBanner, {
					props: {}
				});
			}).not.toThrow();
		});

		it('should not break with null sourceMessageId', () => {
			expect(() => {
				render(PrefillBanner, {
					props: {
						sourceMessageId: null as any
					}
				});
			}).not.toThrow();
		});
	});

	describe('Integration with Entity Forms', () => {
		it('should work in entity creation forms', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-create'
				}
			});

			expect(screen.getByText(/prefilled/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
			expect(screen.getByRole('link', { name: /view original message|original message/i })).toBeInTheDocument();
		});

		it('should allow dismissing to remove banner from view', async () => {
			const onDismiss = vi.fn();

			render(PrefillBanner, {
				props: {
					onDismiss
				}
			});

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			await fireEvent.click(dismissButton);

			expect(onDismiss).toHaveBeenCalled();
		});

		it('should provide clear context about data source', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-123'
				}
			});

			// Should mention AI chat or similar context
			const banner = screen.getByText(/prefilled|chat|AI|generated/i);
			expect(banner).toBeInTheDocument();
		});
	});

	describe('Dark Mode Support', () => {
		it('should have dark mode classes', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner?.className).toMatch(/dark:/);
		});
	});

	describe('Responsive Design', () => {
		it('should render on mobile viewports', () => {
			render(PrefillBanner, {
				props: {
					sourceMessageId: 'msg-mobile'
				}
			});

			const banner = screen.getByText(/prefilled/i);
			expect(banner).toBeInTheDocument();
		});

		it('should have appropriate flex layout', () => {
			const { container } = render(PrefillBanner, {
				props: {}
			});

			const banner = container.querySelector('[role="alert"], [role="status"]');
			expect(banner?.className).toMatch(/flex/);
		});
	});
});
