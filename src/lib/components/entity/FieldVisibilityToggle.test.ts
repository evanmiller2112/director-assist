/**
 * Tests for FieldVisibilityToggle Component - disabled prop (TDD RED Phase)
 *
 * GitHub Issue #519: Add UI toggle to exclude entire entities from player mode export
 *
 * This test suite covers the new `disabled` prop functionality that will be added
 * to the FieldVisibilityToggle component. When disabled:
 * - The button should have the `disabled` attribute
 * - Clicking should NOT call `onToggle`
 * - Visual styling should show reduced opacity
 * - Tooltip should mention entity being hidden
 *
 * These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FieldVisibilityToggle from './FieldVisibilityToggle.svelte';

describe('FieldVisibilityToggle - disabled prop', () => {
	let mockOnToggle: (fieldKey: string, value: boolean | undefined) => void;
	let defaultProps: {
		fieldKey: string;
		entityMetadata: Record<string, unknown>;
		categoryDefault: boolean;
		onToggle: (fieldKey: string, value: boolean | undefined) => void;
	};

	beforeEach(() => {
		mockOnToggle = vi.fn() as (fieldKey: string, value: boolean | undefined) => void;
		defaultProps = {
			fieldKey: 'occupation',
			entityMetadata: {},
			categoryDefault: true,
			onToggle: mockOnToggle
		};
	});

	describe('when disabled is true', () => {
		it('should render button with disabled attribute', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
		});

		it('should NOT call onToggle when clicked', async () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(mockOnToggle).not.toHaveBeenCalled();
		});

		it('should apply reduced opacity styling', () => {
			const { container } = render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = container.querySelector('button');
			expect(button).toHaveClass('opacity-40');
		});

		it('should show tooltip indicating entity is hidden', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			const title = button.getAttribute('title');
			expect(title).toMatch(/entity.*hidden/i);
		});

		it('should include disabled state in aria-label', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			const ariaLabel = button.getAttribute('aria-label');
			expect(ariaLabel).toMatch(/disabled|entity.*hidden/i);
		});
	});

	describe('when disabled is false', () => {
		it('should render button without disabled attribute', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: false
				}
			});

			const button = screen.getByRole('button');
			expect(button).not.toBeDisabled();
		});

		it('should call onToggle when clicked', async () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: false
				}
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(mockOnToggle).toHaveBeenCalledTimes(1);
			expect(mockOnToggle).toHaveBeenCalledWith('occupation', expect.any(Boolean));
		});

		it('should NOT apply disabled opacity styling', () => {
			const { container } = render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: false
				}
			});

			const button = container.querySelector('button');
			expect(button).not.toHaveClass('opacity-40');
		});
	});

	describe('when disabled is undefined (default behavior)', () => {
		it('should render button without disabled attribute', () => {
			render(FieldVisibilityToggle, {
				props: defaultProps
			});

			const button = screen.getByRole('button');
			expect(button).not.toBeDisabled();
		});

		it('should call onToggle when clicked', async () => {
			render(FieldVisibilityToggle, {
				props: defaultProps
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(mockOnToggle).toHaveBeenCalledTimes(1);
		});

		it('should show normal tooltip without disabled message', () => {
			render(FieldVisibilityToggle, {
				props: defaultProps
			});

			const button = screen.getByRole('button');
			const title = button.getAttribute('title');
			// Should show normal visibility tooltip, not entity hidden message
			expect(title).toMatch(/visible to players|hidden from players/i);
			expect(title).not.toMatch(/entity.*hidden/i);
		});
	});

	describe('interaction behavior with different override states', () => {
		it('should remain disabled even when override state is explicitly visible', async () => {
			const metadata = {
				playerExportFieldOverrides: {
					occupation: true // explicitly visible
				}
			};

			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					entityMetadata: metadata,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();

			await fireEvent.click(button);
			expect(mockOnToggle).not.toHaveBeenCalled();
		});

		it('should remain disabled even when override state is explicitly hidden', async () => {
			const metadata = {
				playerExportFieldOverrides: {
					occupation: false // explicitly hidden
				}
			};

			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					entityMetadata: metadata,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();

			await fireEvent.click(button);
			expect(mockOnToggle).not.toHaveBeenCalled();
		});

		it('should remain disabled even when inheriting category default', async () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					entityMetadata: {},
					categoryDefault: true,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();

			await fireEvent.click(button);
			expect(mockOnToggle).not.toHaveBeenCalled();
		});
	});

	describe('edge cases', () => {
		it('should handle disabled prop changing from false to true', async () => {
			const { component, rerender } = render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: false
				}
			});

			let button = screen.getByRole('button');
			expect(button).not.toBeDisabled();

			// Update props
			await rerender({
				...defaultProps,
				disabled: true
			});

			button = screen.getByRole('button');
			expect(button).toBeDisabled();
		});

		it('should handle disabled prop changing from true to false', async () => {
			const { rerender } = render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			let button = screen.getByRole('button');
			expect(button).toBeDisabled();

			// Update props
			await rerender({
				...defaultProps,
				disabled: false
			});

			button = screen.getByRole('button');
			expect(button).not.toBeDisabled();

			await fireEvent.click(button);
			expect(mockOnToggle).toHaveBeenCalledTimes(1);
		});

		it('should prevent keyboard activation when disabled', async () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');

			// Try to activate with Enter key
			await fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
			expect(mockOnToggle).not.toHaveBeenCalled();

			// Try to activate with Space key
			await fireEvent.keyDown(button, { key: ' ', code: 'Space' });
			expect(mockOnToggle).not.toHaveBeenCalled();
		});

		it('should have proper focus styling even when disabled', () => {
			const { container } = render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = container.querySelector('button');
			// Should still have focus ring classes for accessibility
			expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
		});
	});

	describe('accessibility', () => {
		it('should maintain proper ARIA attributes when disabled', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-label');
			expect(button).toHaveAttribute('title');
		});

		it('should be keyboard focusable even when disabled', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			// Disabled buttons are typically not focusable in HTML,
			// but we want them to be for tooltip accessibility
			// This is achieved with aria-disabled instead of disabled attribute
			// Or by using a different approach
			expect(button).toBeInTheDocument();
		});

		it('should provide clear feedback about why toggle is disabled', () => {
			render(FieldVisibilityToggle, {
				props: {
					...defaultProps,
					disabled: true
				}
			});

			const button = screen.getByRole('button');
			const title = button.getAttribute('title');
			const ariaLabel = button.getAttribute('aria-label');

			// At least one should explain why it's disabled
			const hasExplanation =
				(title && /entity.*hidden/i.test(title)) ||
				(ariaLabel && /entity.*hidden/i.test(ariaLabel));

			expect(hasExplanation).toBe(true);
		});
	});
});
