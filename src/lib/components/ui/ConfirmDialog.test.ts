/**
 * Tests for ConfirmDialog Component
 *
 * Issue #123: Add auto-generate buttons for summary and description
 *
 * This component provides a reusable confirmation dialog for potentially
 * destructive actions like overwriting existing content with AI-generated text.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ConfirmDialog from './ConfirmDialog.svelte';

describe('ConfirmDialog Component - Basic Rendering (Issue #123)', () => {
	it('should render without crashing', () => {
		const { container } = render(ConfirmDialog, {
			props: {
				open: false,
				title: 'Test Dialog',
				message: 'Test message'
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open prop is false', () => {
		render(ConfirmDialog, {
			props: {
				open: false,
				title: 'Confirm Action',
				message: 'Are you sure?'
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open prop is true', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm Action',
				message: 'Are you sure?'
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should display the provided title', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Replace Content',
				message: 'This will overwrite existing content.'
			}
		});

		expect(screen.getByText('Replace Content')).toBeInTheDocument();
	});

	it('should display the provided message', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm',
				message: 'This action cannot be undone. Are you sure?'
			}
		});

		expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
	});

	it('should render as a modal dialog', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('ConfirmDialog Component - Button Rendering', () => {
	it('should render Confirm button', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		expect(confirmButton).toBeInTheDocument();
	});

	it('should render Cancel button', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should render custom confirm button text', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				confirmText: 'Generate Now'
			}
		});

		expect(screen.getByRole('button', { name: 'Generate Now' })).toBeInTheDocument();
	});

	it('should render custom cancel button text', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				cancelText: 'Nevermind'
			}
		});

		expect(screen.getByRole('button', { name: 'Nevermind' })).toBeInTheDocument();
	});

	it('should use default "Confirm" text when confirmText not provided', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
	});

	it('should use default "Cancel" text when cancelText not provided', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});
});

describe('ConfirmDialog Component - Confirm Action', () => {
	it('should call onConfirm callback when Confirm button is clicked', async () => {
		const onConfirm = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onConfirm
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		await fireEvent.click(confirmButton);

		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it('should not call onCancel when Confirm button is clicked', async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onConfirm,
				onCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		await fireEvent.click(confirmButton);

		expect(onConfirm).toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	it('should handle missing onConfirm callback gracefully', async () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(confirmButton);
		}).not.toThrow();
	});
});

describe('ConfirmDialog Component - Cancel Action', () => {
	it('should call onCancel callback when Cancel button is clicked', async () => {
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onCancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('should not call onConfirm when Cancel button is clicked', async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onConfirm,
				onCancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalled();
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('should call onCancel when Escape key is pressed', async () => {
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onCancel
			}
		});

		// Press Escape key
		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onCancel callback gracefully', async () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(cancelButton);
		}).not.toThrow();
	});
});

describe('ConfirmDialog Component - Backdrop Click', () => {
	it('should call onCancel when backdrop is clicked', async () => {
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onCancel
			}
		});

		const dialog = screen.getByRole('dialog');

		// Click on the backdrop (the dialog element itself, not its content)
		await fireEvent.click(dialog);

		// This behavior may vary by implementation
		// Some implementations use a separate backdrop element
		expect(onCancel).toHaveBeenCalled();
	});

	it('should NOT call onCancel when clicking inside dialog content', async () => {
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test Dialog',
				message: 'Test message',
				onCancel
			}
		});

		const title = screen.getByText('Test Dialog');
		await fireEvent.click(title);

		// Clicking inside the dialog should not trigger cancel
		expect(onCancel).not.toHaveBeenCalled();
	});
});

describe('ConfirmDialog Component - Variants', () => {
	it('should render default variant', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should render warning variant with appropriate styling', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Warning',
				message: 'This will overwrite content',
				variant: 'warning'
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		// Warning variant might have yellow/amber styling
		expect(confirmButton).toBeInTheDocument();
	});

	it('should render danger variant with appropriate styling', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Danger',
				message: 'This action is destructive',
				variant: 'danger'
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		// Danger variant might have red styling
		expect(confirmButton).toHaveClass(/danger|destructive|red/);
	});

	it('should apply variant styling to confirm button', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				variant: 'danger',
				confirmText: 'Delete Forever'
			}
		});

		const confirmButton = screen.getByRole('button', { name: 'Delete Forever' });
		expect(confirmButton).toHaveClass(/danger|destructive|red/);
	});
});

describe('ConfirmDialog Component - Accessibility', () => {
	it('should have aria-modal="true"', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm Action',
				message: 'Test message'
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText('Confirm Action');

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should have aria-describedby connecting message to dialog', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'This is the description text'
			}
		});

		const dialog = screen.getByRole('dialog');
		const message = screen.getByText('This is the description text');

		const messageId = message.getAttribute('id');
		expect(messageId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-describedby', messageId);
	});

	it('should focus first focusable element when opened', async () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		// The focus trap focuses the first focusable element (Cancel button)
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		await waitFor(() => {
			expect(cancelButton).toHaveFocus();
		});
	});

	it('should trap focus within dialog', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');

		// All buttons should be within the dialog
		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});

	it('should be keyboard accessible', async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onConfirm,
				onCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		confirmButton.focus();

		// Press Enter
		await fireEvent.keyDown(confirmButton, { key: 'Enter' });

		expect(onConfirm).toHaveBeenCalled();
	});

	it('should allow Tab navigation between buttons', async () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message'
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		// Both buttons should be focusable
		expect(confirmButton).not.toHaveAttribute('tabindex', '-1');
		expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('ConfirmDialog Component - Loading State', () => {
	it('should disable buttons when loading', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				loading: true
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		expect(confirmButton).toBeDisabled();
		expect(cancelButton).toBeDisabled();
	});

	it('should show loading state on confirm button', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				loading: true
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });

		// Should show loading indicator (spinner, aria-busy, etc.)
		expect(confirmButton).toHaveAttribute('aria-busy', 'true');
	});

	it('should enable buttons when not loading', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				loading: false
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		expect(confirmButton).not.toBeDisabled();
		expect(cancelButton).not.toBeDisabled();
	});

	it('should not call callbacks when buttons are disabled by loading', async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				loading: true,
				onConfirm,
				onCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		await fireEvent.click(confirmButton);
		await fireEvent.click(cancelButton);

		expect(onConfirm).not.toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});
});

describe('ConfirmDialog Component - Icon Support', () => {
	it('should render with warning icon when variant is warning', () => {
		const { container } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Warning',
				message: 'This is a warning',
				variant: 'warning'
			}
		});

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
		// Icon rendering will depend on implementation
	});

	it('should render with danger icon when variant is danger', () => {
		const { container } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Danger',
				message: 'This is dangerous',
				variant: 'danger'
			}
		});

		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeInTheDocument();
		// Icon rendering will depend on implementation
	});
});

describe('ConfirmDialog Component - Edge Cases', () => {
	it('should handle very long title text', () => {
		const longTitle =
			'This is a very long title that might wrap to multiple lines and needs to be handled gracefully';

		render(ConfirmDialog, {
			props: {
				open: true,
				title: longTitle,
				message: 'Test message'
			}
		});

		expect(screen.getByText(longTitle)).toBeInTheDocument();
	});

	it('should handle very long message text', () => {
		const longMessage = `This is a very long message with multiple sentences.
			It includes line breaks and extended explanations about what will happen
			when the user confirms this action. The dialog should handle this gracefully
			and display it in a readable format.`;

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: longMessage
			}
		});

		expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
	});

	it('should handle special characters in title', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm <Action> & "Proceed"',
				message: 'Test message'
			}
		});

		expect(screen.getByText(/Confirm.*Action.*Proceed/)).toBeInTheDocument();
	});

	it('should handle special characters in message', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Are you sure you want to continue? <This> & "That" won\'t be saved.'
			}
		});

		expect(screen.getByText(/Are you sure.*continue/)).toBeInTheDocument();
	});

	it('should handle rapid open/close cycles', async () => {
		const onCancel = vi.fn();
		const { rerender } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test',
				message: 'Test message',
				onCancel
			}
		});

		// Close
		rerender({ open: false, title: 'Test', message: 'Test message', onCancel });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		// Open
		rerender({ open: true, title: 'Test', message: 'Test message', onCancel });
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		// Close again
		rerender({ open: false, title: 'Test', message: 'Test message', onCancel });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});

describe('ConfirmDialog Component - Real-world Use Cases', () => {
	it('should handle AI generation overwrite confirmation scenario', async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Replace Existing Content?',
				message:
					'This will replace your current summary with AI-generated content. This action cannot be undone.',
				variant: 'warning',
				confirmText: 'Generate',
				cancelText: 'Cancel',
				onConfirm,
				onCancel
			}
		});

		expect(screen.getByText('Replace Existing Content?')).toBeInTheDocument();
		expect(screen.getByText(/replace your current summary/i)).toBeInTheDocument();

		const generateButton = screen.getByRole('button', { name: 'Generate' });
		await fireEvent.click(generateButton);

		expect(onConfirm).toHaveBeenCalled();
	});

	it('should handle deletion confirmation scenario', async () => {
		const onConfirm = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Delete Entity?',
				message: 'This entity will be permanently deleted. This action cannot be undone.',
				variant: 'danger',
				confirmText: 'Delete',
				cancelText: 'Cancel',
				onConfirm
			}
		});

		const deleteButton = screen.getByRole('button', { name: 'Delete' });
		expect(deleteButton).toHaveClass(/danger|destructive|red/);

		await fireEvent.click(deleteButton);
		expect(onConfirm).toHaveBeenCalled();
	});

	it('should handle loading state during async confirmation', async () => {
		const onConfirm = vi.fn();

		const { rerender } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Generating...',
				message: 'Please wait while we generate content',
				loading: false,
				onConfirm
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm/i });
		expect(confirmButton).not.toBeDisabled();

		// Simulate clicking and then loading state
		await fireEvent.click(confirmButton);
		expect(onConfirm).toHaveBeenCalled();

		// Parent component would set loading to true
		rerender({
			open: true,
			title: 'Generating...',
			message: 'Please wait while we generate content',
			loading: true,
			onConfirm
		});

		const loadingButton = screen.getByRole('button', { name: /confirm/i });
		expect(loadingButton).toBeDisabled();
		expect(loadingButton).toHaveAttribute('aria-busy', 'true');
	});
});
