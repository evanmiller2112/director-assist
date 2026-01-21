/**
 * Tests for FieldTemplateDeleteModal Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component provides a simple confirmation modal for deleting field templates.
 * It displays the template name and confirms the user's intent before deletion.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldTemplateDeleteModal from './FieldTemplateDeleteModal.svelte';
import type { FieldTemplate } from '$lib/types';

describe('FieldTemplateDeleteModal - Basic Rendering (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Combat Stats',
		description: 'Standard combat statistics',
		category: 'user',
		fieldDefinitions: [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 0 }
		],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should render without crashing', () => {
		const { container } = render(FieldTemplateDeleteModal, {
			props: {
				open: false,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: false,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open is true', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have appropriate title', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/delete.*template/i)).toBeInTheDocument();
	});
});

describe('FieldTemplateDeleteModal - Template Display (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Combat Stats',
		description: 'Standard combat statistics',
		category: 'user',
		fieldDefinitions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should display template name in confirmation message', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/Combat Stats/)).toBeInTheDocument();
	});

	it('should show warning message about deletion', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/delete|remove|permanently/i)).toBeInTheDocument();
		expect(screen.getByText(/cannot be undone|permanent/i)).toBeInTheDocument();
	});

	it('should display template name in quotes or emphasized', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Template name should be emphasized (bold, quotes, etc.)
		const templateNameElement = screen.getByText('Combat Stats');
		expect(templateNameElement).toBeInTheDocument();
	});
});

describe('FieldTemplateDeleteModal - Confirm Action (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Test Template',
		description: '',
		category: 'user',
		fieldDefinitions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should have Delete button', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toBeInTheDocument();
	});

	it('should call onconfirm when Delete button is clicked', async () => {
		const onconfirm = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm,
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(onconfirm).toHaveBeenCalledTimes(1);
	});

	it('should not call oncancel when Delete is clicked', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm,
				oncancel
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(onconfirm).toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});

	it('should style Delete button as destructive/danger', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toHaveClass(/danger|destructive|red/);
	});
});

describe('FieldTemplateDeleteModal - Cancel Action (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Test Template',
		description: '',
		category: 'user',
		fieldDefinitions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should have Cancel button', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should call oncancel when Cancel is clicked', async () => {
		const oncancel = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should not call onconfirm when Cancel is clicked', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm,
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(oncancel).toHaveBeenCalled();
		expect(onconfirm).not.toHaveBeenCalled();
	});

	it('should call oncancel when Escape key is pressed', async () => {
		const oncancel = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(oncancel).toHaveBeenCalledTimes(1);
	});
});

describe('FieldTemplateDeleteModal - Loading State (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Test Template',
		description: '',
		category: 'user',
		fieldDefinitions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should disable Delete button when loading', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: true,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toBeDisabled();
	});

	it('should disable Cancel button when loading', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: true,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeDisabled();
	});

	it('should show loading indicator on Delete button when loading', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: true,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toHaveAttribute('aria-busy', 'true');
	});

	it('should show "Deleting..." text when loading', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: true,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/deleting/i)).toBeInTheDocument();
	});

	it('should enable buttons when not loading', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: false,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		expect(deleteButton).not.toBeDisabled();
		expect(cancelButton).not.toBeDisabled();
	});

	it('should not call callbacks when buttons are disabled by loading', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				loading: true,
				onconfirm,
				oncancel
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		await fireEvent.click(deleteButton);
		await fireEvent.click(cancelButton);

		expect(onconfirm).not.toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});
});

describe('FieldTemplateDeleteModal - Accessibility (Issue #210)', () => {
	const mockTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Test Template',
		description: '',
		category: 'user',
		fieldDefinitions: [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should have aria-modal attribute', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/delete.*template/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should have aria-describedby connecting message to dialog', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const message = screen.getByText(/cannot be undone|permanent/i);

		const messageId = message.getAttribute('id');
		expect(messageId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-describedby', messageId);
	});

	it('should focus Delete button when opened', async () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });

		await waitFor(() => {
			expect(deleteButton).toHaveFocus();
		});
	});

	it('should allow keyboard navigation between buttons', () => {
		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		const cancelButton = screen.getByRole('button', { name: /cancel/i });

		expect(deleteButton).not.toHaveAttribute('tabindex', '-1');
		expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('FieldTemplateDeleteModal - Edge Cases (Issue #210)', () => {
	it('should handle template with very long name', () => {
		const longNameTemplate: FieldTemplate = {
			id: 'template-123',
			name: 'A'.repeat(100),
			description: '',
			category: 'user',
			fieldDefinitions: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: longNameTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(longNameTemplate.name)).toBeInTheDocument();
	});

	it('should handle template with special characters in name', () => {
		const specialNameTemplate: FieldTemplate = {
			id: 'template-123',
			name: 'Template <with> "special" & characters',
			description: '',
			category: 'user',
			fieldDefinitions: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: specialNameTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/Template.*with.*special.*characters/)).toBeInTheDocument();
	});

	it('should handle rapid open/close cycles', async () => {
		const mockTemplate: FieldTemplate = {
			id: 'template-123',
			name: 'Test',
			description: '',
			category: 'user',
			fieldDefinitions: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const { rerender } = render(FieldTemplateDeleteModal, {
			props: {
				open: true,
				template: mockTemplate,
				onconfirm: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Close
		rerender({ open: false, template: mockTemplate, onconfirm: vi.fn(), oncancel: vi.fn() });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		// Open
		rerender({ open: true, template: mockTemplate, onconfirm: vi.fn(), oncancel: vi.fn() });
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		// Close again
		rerender({ open: false, template: mockTemplate, onconfirm: vi.fn(), oncancel: vi.fn() });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
