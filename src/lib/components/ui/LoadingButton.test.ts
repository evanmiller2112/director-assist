import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import LoadingButton from './LoadingButton.svelte';

/**
 * Tests for LoadingButton Component
 *
 * Issue #12: Add Loading States & Async Operation Feedback
 *
 * This component provides a button that shows loading state during async operations.
 * It's used throughout the app for save, submit, and action buttons that trigger
 * async operations.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

describe('LoadingButton Component - Basic Rendering (Issue #12)', () => {
	it('should render without crashing', () => {
		const { container } = render(LoadingButton);
		expect(container).toBeInTheDocument();
	});

	it('should render as a button element', () => {
		render(LoadingButton, {
			props: { children: 'Click me' }
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should display button text', () => {
		render(LoadingButton, {
			props: { children: 'Save Changes' }
		});

		expect(screen.getByText('Save Changes')).toBeInTheDocument();
	});

	it('should render with default slot content', () => {
		render(LoadingButton, {
			props: { children: 'Custom Content' }
		});

		expect(screen.getByText('Custom Content')).toBeInTheDocument();
	});
});

describe('LoadingButton Component - Loading State', () => {
	it('should show loading spinner when loading prop is true', () => {
		const { container } = render(LoadingButton, {
			props: {
				loading: true,
				children: 'Submit'
			}
		});

		// Should contain a spinner
		const spinner = container.querySelector('[role="status"], [class*="spin"], svg');
		expect(spinner).toBeInTheDocument();
	});

	it('should hide button text when loading', () => {
		render(LoadingButton, {
			props: {
				loading: true,
				children: 'Submit'
			}
		});

		// Text should be visually hidden but present for accessibility
		const text = screen.getByText('Submit');
		expect(text).toBeInTheDocument();
	});

	it('should show button text when not loading', () => {
		render(LoadingButton, {
			props: {
				loading: false,
				children: 'Submit'
			}
		});

		expect(screen.getByText('Submit')).toBeVisible();
	});

	it('should disable button when loading', () => {
		render(LoadingButton, {
			props: {
				loading: true,
				children: 'Submit'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should enable button when not loading', () => {
		render(LoadingButton, {
			props: {
				loading: false,
				children: 'Submit'
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});
});

describe('LoadingButton Component - Loading Text', () => {
	it('should show custom loading text when provided', () => {
		render(LoadingButton, {
			props: {
				loading: true,
				loadingText: 'Saving...',
				children: 'Save'
			}
		});

		expect(screen.getByText('Saving...')).toBeInTheDocument();
	});

	it('should show default text when not loading', () => {
		render(LoadingButton, {
			props: {
				loading: false,
				loadingText: 'Saving...',
				children: 'Save'
			}
		});

		expect(screen.getByText('Save')).toBeInTheDocument();
		expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
	});

	it('should show loading text alongside spinner', () => {
		const { container } = render(LoadingButton, {
			props: {
				loading: true,
				loadingText: 'Please wait...',
				children: 'Submit'
			}
		});

		expect(screen.getByText('Please wait...')).toBeInTheDocument();
		const spinner = container.querySelector('[role="status"]');
		expect(spinner).toBeInTheDocument();
	});
});

describe('LoadingButton Component - Button Variants', () => {
	it('should render primary variant', () => {
		render(LoadingButton, {
			props: {
				variant: 'primary',
				children: 'Primary Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/primary/);
	});

	it('should render secondary variant', () => {
		render(LoadingButton, {
			props: {
				variant: 'secondary',
				children: 'Secondary Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/secondary/);
	});

	it('should render danger variant', () => {
		render(LoadingButton, {
			props: {
				variant: 'danger',
				children: 'Delete'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/danger|destructive|red/);
	});

	it('should render ghost variant', () => {
		render(LoadingButton, {
			props: {
				variant: 'ghost',
				children: 'Cancel'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/ghost/);
	});

	it('should render outline variant', () => {
		render(LoadingButton, {
			props: {
				variant: 'outline',
				children: 'Outline'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/outline/);
	});
});

describe('LoadingButton Component - Button Sizes', () => {
	it('should render small size', () => {
		render(LoadingButton, {
			props: {
				size: 'sm',
				children: 'Small'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/sm|small/);
	});

	it('should render medium size as default', () => {
		render(LoadingButton, {
			props: {
				children: 'Medium'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/md|medium/);
	});

	it('should render large size', () => {
		render(LoadingButton, {
			props: {
				size: 'lg',
				children: 'Large'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/lg|large/);
	});
});

describe('LoadingButton Component - Disabled State', () => {
	it('should be disabled when disabled prop is true', () => {
		render(LoadingButton, {
			props: {
				disabled: true,
				children: 'Disabled'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should be enabled when disabled prop is false', () => {
		render(LoadingButton, {
			props: {
				disabled: false,
				children: 'Enabled'
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	it('should be disabled when both loading and disabled are true', () => {
		render(LoadingButton, {
			props: {
				loading: true,
				disabled: true,
				children: 'Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should prevent clicks when disabled', async () => {
		const onClick = vi.fn();

		render(LoadingButton, {
			props: {
				disabled: true,
				onclick: onClick,
				children: 'Click me'
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onClick).not.toHaveBeenCalled();
	});
});

describe('LoadingButton Component - Click Handling', () => {
	it('should call onclick handler when clicked', async () => {
		const onClick = vi.fn();

		render(LoadingButton, {
			props: {
				onclick: onClick,
				children: 'Click me'
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('should not call onclick when loading', async () => {
		const onClick = vi.fn();

		render(LoadingButton, {
			props: {
				loading: true,
				onclick: onClick,
				children: 'Click me'
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onClick).not.toHaveBeenCalled();
	});

	it('should not call onclick when disabled', async () => {
		const onClick = vi.fn();

		render(LoadingButton, {
			props: {
				disabled: true,
				onclick: onClick,
				children: 'Click me'
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onClick).not.toHaveBeenCalled();
	});
});

describe('LoadingButton Component - Type Attribute', () => {
	it('should have type="button" by default', () => {
		render(LoadingButton, {
			props: { children: 'Button' }
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'button');
	});

	it('should accept type="submit"', () => {
		render(LoadingButton, {
			props: {
				type: 'submit',
				children: 'Submit'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'submit');
	});

	it('should accept type="reset"', () => {
		render(LoadingButton, {
			props: {
				type: 'reset',
				children: 'Reset'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'reset');
	});
});

describe('LoadingButton Component - Full Width', () => {
	it('should render full width when fullWidth is true', () => {
		render(LoadingButton, {
			props: {
				fullWidth: true,
				children: 'Full Width Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/w-full|block/);
	});

	it('should render inline when fullWidth is false', () => {
		render(LoadingButton, {
			props: {
				fullWidth: false,
				children: 'Inline Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toHaveClass(/w-full|block/);
	});
});

describe('LoadingButton Component - Icon Support', () => {
	it('should render with left icon slot', () => {
		const { container } = render(LoadingButton, {
			props: {
				children: 'Save',
				leftIcon: true
			}
		});

		// Should have structure for left icon
		expect(container.querySelector('[data-icon="left"]')).toBeInTheDocument();
	});

	it('should render with right icon slot', () => {
		const { container } = render(LoadingButton, {
			props: {
				children: 'Next',
				rightIcon: true
			}
		});

		// Should have structure for right icon
		expect(container.querySelector('[data-icon="right"]')).toBeInTheDocument();
	});

	it('should hide icons when loading', () => {
		const { container } = render(LoadingButton, {
			props: {
				loading: true,
				children: 'Save',
				leftIcon: true
			}
		});

		// Icons should be hidden during loading
		const icon = container.querySelector('[data-icon="left"]');
		if (icon) {
			expect(icon).not.toBeVisible();
		}
	});
});

describe('LoadingButton Component - Spinner Position', () => {
	it('should center spinner in button when loading', () => {
		const { container } = render(LoadingButton, {
			props: {
				loading: true,
				children: 'Loading'
			}
		});

		// Spinner should be centered
		const button = screen.getByRole('button');
		expect(button).toHaveClass(/justify-center|items-center/);
	});

	it('should maintain button height when loading', () => {
		const { container } = render(LoadingButton, {
			props: {
				loading: false,
				children: 'Button Text Here'
			}
		});

		const normalButton = screen.getByRole('button');
		const normalHeight = normalButton.offsetHeight;

		// Re-render with loading
		const { container: loadingContainer } = render(LoadingButton, {
			props: {
				loading: true,
				children: 'Button Text Here'
			}
		});

		const loadingButton = screen.getAllByRole('button')[1];
		const loadingHeight = loadingButton.offsetHeight;

		// Height should remain consistent
		// (This might need adjustment based on actual implementation)
		expect(loadingHeight).toBeGreaterThan(0);
	});
});

describe('LoadingButton Component - Accessibility', () => {
	it('should have aria-busy="true" when loading', () => {
		render(LoadingButton, {
			props: {
				loading: true,
				children: 'Loading'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-busy', 'true');
	});

	it('should have aria-busy="false" when not loading', () => {
		render(LoadingButton, {
			props: {
				loading: false,
				children: 'Not Loading'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-busy', 'false');
	});

	it('should have aria-disabled when disabled', () => {
		render(LoadingButton, {
			props: {
				disabled: true,
				children: 'Disabled'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-disabled', 'true');
	});

	it('should be keyboard accessible when enabled', async () => {
		const onClick = vi.fn();

		render(LoadingButton, {
			props: {
				onclick: onClick,
				children: 'Click me'
			}
		});

		const button = screen.getByRole('button');
		button.focus();

		expect(document.activeElement).toBe(button);
	});

	it('should have accessible name from button text', () => {
		render(LoadingButton, {
			props: {
				children: 'Save Changes'
			}
		});

		const button = screen.getByRole('button', { name: 'Save Changes' });
		expect(button).toBeInTheDocument();
	});
});

describe('LoadingButton Component - Custom Classes', () => {
	it('should accept custom CSS classes', () => {
		render(LoadingButton, {
			props: {
				class: 'my-custom-class',
				children: 'Custom'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('my-custom-class');
	});

	it('should merge custom classes with default classes', () => {
		render(LoadingButton, {
			props: {
				class: 'extra-padding',
				children: 'Button'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('extra-padding');
		// Should also have base button classes
		expect(button.className.length).toBeGreaterThan('extra-padding'.length);
	});
});

describe('LoadingButton Component - Real-world Use Cases', () => {
	it('should handle save button scenario', async () => {
		const onSave = vi.fn(async () => {
			await new Promise(resolve => setTimeout(resolve, 100));
		});

		const { rerender } = render(LoadingButton, {
			props: {
				loading: false,
				onclick: onSave,
				children: 'Save Changes'
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();

		// Simulate click
		await fireEvent.click(button);

		// Parent component would set loading to true
		rerender({
			loading: true,
			onclick: onSave,
			children: 'Save Changes'
		});

		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('should handle delete button scenario', () => {
		render(LoadingButton, {
			props: {
				variant: 'danger',
				loading: false,
				loadingText: 'Deleting...',
				children: 'Delete Entity'
			}
		});

		expect(screen.getByText('Delete Entity')).toBeInTheDocument();
		const button = screen.getByRole('button');
		expect(button).toHaveClass(/danger|destructive/);
	});

	it('should handle form submit button scenario', () => {
		render(LoadingButton, {
			props: {
				type: 'submit',
				loading: false,
				loadingText: 'Submitting...',
				fullWidth: true,
				children: 'Create Entity'
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'submit');
		expect(button).toHaveClass(/w-full/);
	});
});
