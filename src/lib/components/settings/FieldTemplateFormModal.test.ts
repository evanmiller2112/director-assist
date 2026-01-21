/**
 * Tests for FieldTemplateFormModal Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component provides a modal form for creating and editing field templates.
 * Field templates are reusable collections of field definitions that can be
 * applied to custom entity types.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldTemplateFormModal from './FieldTemplateFormModal.svelte';
import type { FieldTemplate } from '$lib/types';

describe('FieldTemplateFormModal - Basic Rendering (Issue #210)', () => {
	it('should render without crashing', () => {
		const { container } = render(FieldTemplateFormModal, {
			props: {
				open: false,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: false,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open is true', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('FieldTemplateFormModal - Create Mode (Issue #210)', () => {
	it('should show "Create Field Template" title when no template provided', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/create.*field template/i)).toBeInTheDocument();
	});

	it('should have empty name field in create mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		expect(nameInput.value).toBe('');
	});

	it('should have empty description field in create mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('');
	});

	it('should have default category selected in create mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
		expect(categorySelect.value).toBe('user');
	});

	it('should have empty field definitions in create mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Should show "No fields yet" or "Add Field" button
		expect(screen.getByText(/no fields|add field/i)).toBeInTheDocument();
	});
});

describe('FieldTemplateFormModal - Edit Mode (Issue #210)', () => {
	const existingTemplate: FieldTemplate = {
		id: 'template-123',
		name: 'Combat Stats',
		description: 'Standard combat statistics',
		category: 'draw-steel',
		fieldDefinitions: [
			{ key: 'hit_points', label: 'Hit Points', type: 'number', required: true, order: 0 },
			{ key: 'armor_class', label: 'Armor Class', type: 'number', required: true, order: 1 }
		],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-15')
	};

	it('should show "Edit Field Template" title when template provided', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/edit.*field template/i)).toBeInTheDocument();
	});

	it('should pre-fill name field in edit mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		expect(nameInput.value).toBe('Combat Stats');
	});

	it('should pre-fill description field in edit mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('Standard combat statistics');
	});

	it('should pre-fill category field in edit mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
		expect(categorySelect.value).toBe('draw-steel');
	});

	it('should display existing field definitions in edit mode', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText('Hit Points')).toBeInTheDocument();
		expect(screen.getByText('Armor Class')).toBeInTheDocument();
	});
});

describe('FieldTemplateFormModal - Form Fields (Issue #210)', () => {
	it('should display name input field', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		expect(nameInput).toBeInTheDocument();
		expect(nameInput.tagName).toBe('INPUT');
	});

	it('should mark name field as required', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		expect(nameInput).toHaveAttribute('required');
	});

	it('should display description textarea', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const descriptionInput = screen.getByLabelText(/description/i);
		expect(descriptionInput).toBeInTheDocument();
		expect(descriptionInput.tagName).toBe('TEXTAREA');
	});

	it('should display category select field', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const categorySelect = screen.getByLabelText(/category/i);
		expect(categorySelect).toBeInTheDocument();
		expect(categorySelect.tagName).toBe('SELECT');
	});

	it('should have user and draw-steel category options', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const categorySelect = screen.getByLabelText(/category/i);
		const options = Array.from(categorySelect.querySelectorAll('option'));
		const optionValues = options.map((opt) => opt.value);

		expect(optionValues).toContain('user');
		expect(optionValues).toContain('draw-steel');
	});

	it('should allow entering template name', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'My Template' } });

		expect((nameInput as HTMLInputElement).value).toBe('My Template');
	});

	it('should allow entering description', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const descriptionInput = screen.getByLabelText(/description/i);
		await fireEvent.input(descriptionInput, { target: { value: 'My description' } });

		expect((descriptionInput as HTMLTextAreaElement).value).toBe('My description');
	});

	it('should allow selecting category', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const categorySelect = screen.getByLabelText(/category/i);
		await fireEvent.change(categorySelect, { target: { value: 'draw-steel' } });

		expect((categorySelect as HTMLSelectElement).value).toBe('draw-steel');
	});
});

describe('FieldTemplateFormModal - Field Definition Editor (Issue #210)', () => {
	it('should display field definition editor section', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/fields/i)).toBeInTheDocument();
	});

	it('should show Add Field button', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add field/i });
		expect(addButton).toBeInTheDocument();
	});

	it('should allow adding new field definitions', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add field/i });
		await fireEvent.click(addButton);

		// Should show field definition form
		expect(screen.getByLabelText(/field.*name|label/i)).toBeInTheDocument();
	});

	it('should allow removing field definitions', async () => {
		const template: FieldTemplate = {
			id: 'temp-1',
			name: 'Test',
			description: '',
			category: 'user',
			fieldDefinitions: [
				{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 }
			],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove|delete.*field/i });
		expect(removeButton).toBeInTheDocument();
	});

	it('should allow editing field definition properties', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add field/i });
		await fireEvent.click(addButton);

		// Should show field editor with editable properties
		expect(screen.getByLabelText(/field.*name|label/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/field.*type/i)).toBeInTheDocument();
	});
});

describe('FieldTemplateFormModal - Validation (Issue #210)', () => {
	it('should require name field', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const submitButton = screen.getByRole('button', { name: /create|save/i });
		await fireEvent.click(submitButton);

		// Should show validation error
		expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
	});

	it('should disable submit button when form is invalid', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const submitButton = screen.getByRole('button', { name: /create|save/i });
		expect(submitButton).toBeDisabled();
	});

	it('should enable submit button when form is valid', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Valid Name' } });

		const submitButton = screen.getByRole('button', { name: /create|save/i });
		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});
	});

	it('should show error for empty name after blur', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.focus(nameInput);
		await fireEvent.blur(nameInput);

		expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
	});

	it('should clear validation errors when field is corrected', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.blur(nameInput);
		expect(screen.getByText(/name.*required/i)).toBeInTheDocument();

		await fireEvent.input(nameInput, { target: { value: 'Valid Name' } });
		expect(screen.queryByText(/name.*required/i)).not.toBeInTheDocument();
	});
});

describe('FieldTemplateFormModal - Submit Action (Issue #210)', () => {
	it('should call onsubmit with complete template in create mode', async () => {
		const onsubmit = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit,
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'New Template' } });

		const descriptionInput = screen.getByLabelText(/description/i);
		await fireEvent.input(descriptionInput, { target: { value: 'Test description' } });

		const submitButton = screen.getByRole('button', { name: /create/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onsubmit).toHaveBeenCalledTimes(1);
		});

		const submittedTemplate: FieldTemplate = onsubmit.mock.calls[0][0];
		expect(submittedTemplate.name).toBe('New Template');
		expect(submittedTemplate.description).toBe('Test description');
		expect(submittedTemplate.category).toBe('user');
		expect(submittedTemplate.id).toBeTruthy();
		expect(submittedTemplate.createdAt).toBeInstanceOf(Date);
		expect(submittedTemplate.updatedAt).toBeInstanceOf(Date);
	});

	it('should call onsubmit with updated template in edit mode', async () => {
		const onsubmit = vi.fn();
		const existingTemplate: FieldTemplate = {
			id: 'template-123',
			name: 'Original Name',
			description: 'Original description',
			category: 'user',
			fieldDefinitions: [],
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01')
		};

		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit,
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });

		const submitButton = screen.getByRole('button', { name: /save/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onsubmit).toHaveBeenCalledTimes(1);
		});

		const submittedTemplate: FieldTemplate = onsubmit.mock.calls[0][0];
		expect(submittedTemplate.id).toBe('template-123');
		expect(submittedTemplate.name).toBe('Updated Name');
		expect(submittedTemplate.createdAt).toEqual(existingTemplate.createdAt);
		expect(submittedTemplate.updatedAt.getTime()).toBeGreaterThan(existingTemplate.updatedAt.getTime());
	});

	it('should preserve field definitions on submit', async () => {
		const onsubmit = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit,
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test Template' } });

		// Add a field (simplified - actual implementation may vary)
		const addButton = screen.getByRole('button', { name: /add field/i });
		await fireEvent.click(addButton);

		const submitButton = screen.getByRole('button', { name: /create/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onsubmit).toHaveBeenCalled();
		});

		const submittedTemplate: FieldTemplate = onsubmit.mock.calls[0][0];
		expect(submittedTemplate.fieldDefinitions).toBeInstanceOf(Array);
	});

	it('should generate unique ID in create mode', async () => {
		const onsubmit = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit,
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		const submitButton = screen.getByRole('button', { name: /create/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onsubmit).toHaveBeenCalled();
		});

		const template1: FieldTemplate = onsubmit.mock.calls[0][0];
		expect(template1.id).toBeTruthy();
		expect(typeof template1.id).toBe('string');
	});

	it('should not modify template ID in edit mode', async () => {
		const onsubmit = vi.fn();
		const existingTemplate: FieldTemplate = {
			id: 'fixed-id-123',
			name: 'Test',
			description: '',
			category: 'user',
			fieldDefinitions: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldTemplateFormModal, {
			props: {
				open: true,
				template: existingTemplate,
				onsubmit,
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Updated' } });

		const submitButton = screen.getByRole('button', { name: /save/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onsubmit).toHaveBeenCalled();
		});

		const submittedTemplate: FieldTemplate = onsubmit.mock.calls[0][0];
		expect(submittedTemplate.id).toBe('fixed-id-123');
	});
});

describe('FieldTemplateFormModal - Cancel Action (Issue #210)', () => {
	it('should have Cancel button', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should call oncancel when Cancel is clicked', async () => {
		const oncancel = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should call oncancel when Escape key is pressed', async () => {
		const oncancel = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should not call onsubmit when Cancel is clicked', async () => {
		const onsubmit = vi.fn();
		const oncancel = vi.fn();
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit,
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(onsubmit).not.toHaveBeenCalled();
	});
});

describe('FieldTemplateFormModal - Accessibility (Issue #210)', () => {
	it('should have aria-modal attribute', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/create.*field template/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should focus name input when opened', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);

		await waitFor(() => {
			expect(nameInput).toHaveFocus();
		});
	});

	it('should have proper labels for all form fields', () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
	});
});

describe('FieldTemplateFormModal - Edge Cases (Issue #210)', () => {
	it('should handle very long template names', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const longName = 'A'.repeat(200);
		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: longName } });

		expect((nameInput as HTMLInputElement).value).toBe(longName);
	});

	it('should handle multiline descriptions', async () => {
		render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const multilineText = 'Line 1\nLine 2\nLine 3';
		const descriptionInput = screen.getByLabelText(/description/i);
		await fireEvent.input(descriptionInput, { target: { value: multilineText } });

		expect((descriptionInput as HTMLTextAreaElement).value).toBe(multilineText);
	});

	it('should reset form when modal is closed and reopened', async () => {
		const { rerender } = render(FieldTemplateFormModal, {
			props: {
				open: true,
				onsubmit: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const nameInput = screen.getByLabelText(/name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test Name' } });

		// Close modal
		rerender({ open: false, onsubmit: vi.fn(), oncancel: vi.fn() });

		// Reopen modal
		rerender({ open: true, onsubmit: vi.fn(), oncancel: vi.fn() });

		const newNameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		expect(newNameInput.value).toBe('');
	});
});
