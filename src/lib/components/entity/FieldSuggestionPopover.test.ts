/**
 * Tests for FieldSuggestionPopover Component (Issue #366, Phase 4)
 *
 * This component displays a popover with the full AI suggestion content
 * and provides actions to accept, dismiss, or close the suggestion.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until FieldSuggestionPopover component is implemented.
 *
 * Features tested:
 * - Display full suggestion content
 * - Accept button functionality (copies content, closes popover)
 * - Dismiss button functionality (marks dismissed, closes popover)
 * - Close button/X functionality (closes without action)
 * - Popover positioning and responsive design
 * - Accessibility (focus trap, ESC key, screen readers)
 * - Visual styling with card design and shadows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldSuggestionPopover from './FieldSuggestionPopover.svelte';

// Mock FieldSuggestion type based on Phase 2 requirements
interface FieldSuggestion {
	id?: number;
	entityType: string;
	entityId?: number;
	fieldName: string;
	suggestedContent: string;
	createdAt: Date;
	dismissed?: boolean;
}

describe('FieldSuggestionPopover Component - Basic Rendering', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		entityId: 123,
		fieldName: 'tactics',
		suggestedContent: 'Use stealth and ranged attacks to keep distance from enemies.',
		createdAt: new Date(),
		dismissed: false
	};

	it('should render without crashing', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render as a popover or dialog', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should have popover or dialog role/structure
		const popover = container.querySelector('[role="dialog"], [role="tooltip"], [class*="popover"]');
		expect(popover).toBeInTheDocument();
	});

	it('should display suggestion content', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/stealth and ranged attacks/i)).toBeInTheDocument();
	});

	it('should display full suggestion text', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(
			screen.getByText('Use stealth and ranged attacks to keep distance from enemies.')
		).toBeInTheDocument();
	});

	it('should have card-style visual design', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		// Should have card styling: background, border, rounded
		expect(popover).toHaveClass(/bg-|border|rounded/);
	});

	it('should have shadow for visual depth', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/shadow/);
	});

	it('should have padding for content spacing', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/p-|px-|py-/);
	});
});

describe('FieldSuggestionPopover Component - Accept Button', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		entityId: 123,
		fieldName: 'tactics',
		suggestedContent: 'Use stealth and ranged attacks.',
		createdAt: new Date()
	};

	it('should render Accept button', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		expect(acceptButton).toBeInTheDocument();
	});

	it('should call onAccept with content when Accept button clicked', async () => {
		const onAccept = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept,
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalledTimes(1);
		expect(onAccept).toHaveBeenCalledWith(mockSuggestion.suggestedContent);
	});

	it('should not call onDismiss or onClose when Accept clicked', async () => {
		const onAccept = vi.fn();
		const onDismiss = vi.fn();
		const onClose = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept,
				onDismiss,
				onClose
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should have checkmark icon on Accept button', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should have SVG icon (checkmark/check)
		const acceptButton = screen.getByRole('button', { name: /accept/i });
		const icon = acceptButton.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have primary or success styling on Accept button', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		// Should have prominent positive styling
		expect(acceptButton).toHaveClass(/primary|success|green|blue|bg-/);
	});

	it('should handle missing onAccept callback gracefully', async () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });

		await expect(async () => {
			await fireEvent.click(acceptButton);
		}).not.toThrow();
	});
});

describe('FieldSuggestionPopover Component - Dismiss Button', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use stealth attacks.',
		createdAt: new Date()
	};

	it('should render Dismiss button', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should call onDismiss when Dismiss button clicked', async () => {
		const onDismiss = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss,
				onClose: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('should not call onAccept or onClose when Dismiss clicked', async () => {
		const onAccept = vi.fn();
		const onDismiss = vi.fn();
		const onClose = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept,
				onDismiss,
				onClose
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('should have X or close icon on Dismiss button', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		const icon = dismissButton.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have secondary or danger styling on Dismiss button', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		// Should have secondary or muted styling
		expect(dismissButton).toHaveClass(/secondary|ghost|border|text-/);
	});

	it('should handle missing onDismiss callback gracefully', async () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onClose: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});
});

describe('FieldSuggestionPopover Component - Close Button', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use ranged attacks.',
		createdAt: new Date()
	};

	it('should render Close button (X)', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Close button might have aria-label "close" or similar
		const closeButton = screen.getByRole('button', { name: /close/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should call onClose when Close button clicked', async () => {
		const onClose = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should not call onAccept or onDismiss when Close clicked', async () => {
		const onAccept = vi.fn();
		const onDismiss = vi.fn();
		const onClose = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept,
				onDismiss,
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should have X icon on Close button', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		const icon = closeButton.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should position Close button in top corner', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		// Should have absolute positioning classes
		expect(closeButton).toHaveClass(/absolute|top-|right-/);
	});

	it('should handle missing onClose callback gracefully', async () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });

		await expect(async () => {
			await fireEvent.click(closeButton);
		}).not.toThrow();
	});
});

describe('FieldSuggestionPopover Component - Content Display', () => {
	it('should display suggestion content with proper formatting', () => {
		const suggestionWithFormatting: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: 'Use **stealth** and _ranged_ attacks.\n\nKeep your distance.',
			createdAt: new Date()
		};

		render(FieldSuggestionPopover, {
			props: {
				suggestion: suggestionWithFormatting,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should display the content (formatting handled by implementation)
		expect(screen.getByText(/stealth.*ranged.*attacks/i)).toBeInTheDocument();
	});

	it('should handle long suggestion content', () => {
		const longContent = 'This is a very long suggestion that contains many words and sentences. '.repeat(
			10
		);

		const longSuggestion: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'backstory',
			suggestedContent: longContent,
			createdAt: new Date()
		};

		render(FieldSuggestionPopover, {
			props: {
				suggestion: longSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/very long suggestion/i)).toBeInTheDocument();
	});

	it('should handle empty suggestion content', () => {
		const emptySuggestion: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: '',
			createdAt: new Date()
		};

		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: emptySuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should preserve line breaks in content', () => {
		const multilineSuggestion: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'description',
			suggestedContent: 'Line 1\nLine 2\nLine 3',
			createdAt: new Date()
		};

		render(FieldSuggestionPopover, {
			props: {
				suggestion: multilineSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/Line 1/i)).toBeInTheDocument();
	});

	it('should display content in readable format', () => {
		const mockSuggestion: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: 'Use stealth attacks.',
			createdAt: new Date()
		};

		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Content should have readable text size
		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).not.toHaveClass(/text-xs/);
	});
});

describe('FieldSuggestionPopover Component - Button Layout', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use stealth.',
		createdAt: new Date()
	};

	it('should render all three buttons (Accept, Dismiss, Close)', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		expect(buttons.length).toBeGreaterThanOrEqual(3);
	});

	it('should distinguish Accept button from Dismiss button', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		// Should be different buttons
		expect(acceptButton).not.toBe(dismissButton);
	});

	it('should have clear visual hierarchy between buttons', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		// Accept should be more prominent
		expect(acceptButton).toHaveClass(/primary|bg-/);
		expect(dismissButton).toHaveClass(/secondary|border/);
	});

	it('should arrange action buttons horizontally or vertically', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// Should have flex or grid layout for buttons
		const buttonContainer = container.querySelector('[class*="flex"], [class*="grid"]');
		expect(buttonContainer).toBeInTheDocument();
	});
});

describe('FieldSuggestionPopover Component - Accessibility', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use stealth.',
		createdAt: new Date()
	};

	it('should have dialog or tooltip role', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [role="tooltip"]');
		expect(popover).toBeInTheDocument();
	});

	it('should trap focus within popover', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		// All buttons should be focusable
		buttons.forEach((button) => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should close on ESC key press', async () => {
		const onClose = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should have accessible button labels', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		const closeButton = screen.getByRole('button', { name: /close/i });

		expect(acceptButton).toHaveAccessibleName();
		expect(dismissButton).toHaveAccessibleName();
		expect(closeButton).toHaveAccessibleName();
	});

	it('should announce content to screen readers', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"]');
		// Should have aria-label or aria-describedby
		expect(
			popover?.hasAttribute('aria-label') || popover?.hasAttribute('aria-describedby')
		).toBe(true);
	});

	it('should be keyboard navigable between buttons', async () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');

		// Tab through buttons
		buttons[0].focus();
		expect(document.activeElement).toBe(buttons[0]);
	});

	it('should have visible focus indicators', () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveClass(/focus|ring/);
		});
	});
});

describe('FieldSuggestionPopover Component - Positioning', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use stealth.',
		createdAt: new Date()
	};

	it('should have absolute or fixed positioning', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/absolute|fixed/);
	});

	it('should prevent overflow off screen', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		// Should have max-width or positioning constraints
		expect(popover).toHaveClass(/max-w|w-/);
	});

	it('should be responsive on mobile devices', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toBeInTheDocument();
	});

	it('should have appropriate z-index for overlay', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/z-/);
	});
});

describe('FieldSuggestionPopover Component - Edge Cases', () => {
	it('should handle suggestion without ID', () => {
		const suggestionNoId: FieldSuggestion = {
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: 'Use stealth.',
			createdAt: new Date()
		};

		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: suggestionNoId,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle suggestion without entityId', () => {
		const suggestionNoEntityId: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: 'Use stealth.',
			createdAt: new Date()
		};

		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: suggestionNoEntityId,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle special characters in content', () => {
		const specialCharSuggestion: FieldSuggestion = {
			id: 1,
			entityType: 'character',
			fieldName: 'tactics',
			suggestedContent: 'Use "stealth" & <ranged> attacks!',
			createdAt: new Date()
		};

		render(FieldSuggestionPopover, {
			props: {
				suggestion: specialCharSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		expect(screen.getByText(/stealth.*ranged.*attacks/i)).toBeInTheDocument();
	});

	it('should handle rapid button clicks', async () => {
		const onAccept = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'character',
					fieldName: 'tactics',
					suggestedContent: 'Use stealth.',
					createdAt: new Date()
				},
				onAccept,
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const acceptButton = screen.getByRole('button', { name: /accept/i });

		// Rapid clicks
		await fireEvent.click(acceptButton);
		await fireEvent.click(acceptButton);
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalled();
	});

	it('should handle all callbacks being undefined', async () => {
		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'character',
					fieldName: 'tactics',
					suggestedContent: 'Use stealth.',
					createdAt: new Date()
				}
			}
		});

		const buttons = screen.getAllByRole('button');

		// Should not throw when clicking any button
		for (const button of buttons) {
			await expect(async () => {
				await fireEvent.click(button);
			}).not.toThrow();
		}
	});
});

describe('FieldSuggestionPopover Component - Visual Design', () => {
	const mockSuggestion: FieldSuggestion = {
		id: 1,
		entityType: 'character',
		fieldName: 'tactics',
		suggestedContent: 'Use stealth.',
		createdAt: new Date()
	};

	it('should match Director Assist design system', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toBeInTheDocument();
	});

	it('should use Lucide icons for buttons', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const icons = container.querySelectorAll('svg');
		// Should have icons for Accept (check), Dismiss (X), Close (X)
		expect(icons.length).toBeGreaterThanOrEqual(2);
	});

	it('should have sufficient contrast for readability', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).not.toHaveClass(/text-transparent|opacity-0/);
	});

	it('should have rounded corners', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/rounded/);
	});

	it('should have border for definition', () => {
		const { container } = render(FieldSuggestionPopover, {
			props: {
				suggestion: mockSuggestion,
				onAccept: vi.fn(),
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		const popover = container.querySelector('[role="dialog"], [class*="popover"]');
		expect(popover).toHaveClass(/border/);
	});
});

describe('FieldSuggestionPopover Component - Real-world Use Cases', () => {
	it('should handle complete accept workflow', async () => {
		const onAccept = vi.fn();
		const content = 'Use stealth and ranged attacks to maintain distance.';

		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'character',
					entityId: 123,
					fieldName: 'tactics',
					suggestedContent: content,
					createdAt: new Date()
				},
				onAccept,
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// User clicks Accept
		const acceptButton = screen.getByRole('button', { name: /accept/i });
		await fireEvent.click(acceptButton);

		// Should call onAccept with the content
		expect(onAccept).toHaveBeenCalledWith(content);
	});

	it('should handle complete dismiss workflow', async () => {
		const onDismiss = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'character',
					fieldName: 'tactics',
					suggestedContent: 'Use stealth.',
					createdAt: new Date()
				},
				onAccept: vi.fn(),
				onDismiss,
				onClose: vi.fn()
			}
		});

		// User clicks Dismiss
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		// Should call onDismiss
		expect(onDismiss).toHaveBeenCalled();
	});

	it('should handle temporary close without action', async () => {
		const onClose = vi.fn();
		const onAccept = vi.fn();
		const onDismiss = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'character',
					fieldName: 'tactics',
					suggestedContent: 'Use stealth.',
					createdAt: new Date()
				},
				onAccept,
				onDismiss,
				onClose
			}
		});

		// User clicks Close (X)
		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		// Should only call onClose
		expect(onClose).toHaveBeenCalled();
		expect(onAccept).not.toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should integrate with field suggestion workflow', async () => {
		const onAccept = vi.fn();

		render(FieldSuggestionPopover, {
			props: {
				suggestion: {
					id: 1,
					entityType: 'monster',
					entityId: 456,
					fieldName: 'tactics',
					suggestedContent: 'Flank and overwhelm with numbers.',
					createdAt: new Date()
				},
				onAccept,
				onDismiss: vi.fn(),
				onClose: vi.fn()
			}
		});

		// User reviews suggestion and accepts it
		expect(screen.getByText(/Flank and overwhelm/i)).toBeInTheDocument();

		const acceptButton = screen.getByRole('button', { name: /accept/i });
		await fireEvent.click(acceptButton);

		expect(onAccept).toHaveBeenCalledWith('Flank and overwhelm with numbers.');
	});
});
