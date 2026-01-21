/**
 * Tests for FieldDefinitionEditor Component - Add from Template Feature
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This test file extends FieldDefinitionEditor with tests for the new
 * "Add from Template" feature that allows users to quickly add pre-configured
 * field definitions from saved templates.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
import type { FieldDefinition } from '$lib/types';

describe('FieldDefinitionEditor - Add from Template Button (Issue #210)', () => {
	it('should display "Add from Template" button', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		expect(addTemplateButton).toBeInTheDocument();
	});

	it('should place Add from Template button near Add Field button', () => {
		const fields: FieldDefinition[] = [];
		const { container } = render(FieldDefinitionEditor, { fields });

		const addFieldButton = screen.getByRole('button', { name: /add field/i });
		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });

		// Both buttons should be in the same parent container
		const addFieldParent = addFieldButton.closest('div, section');
		const addTemplateParent = addTemplateButton.closest('div, section');

		expect(addFieldParent).toEqual(addTemplateParent);
	});

	it('should have appropriate icon for Add from Template button', () => {
		const fields: FieldDefinition[] = [];
		const { container } = render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		const buttonContainer = addTemplateButton.closest('button');

		// Should have an icon (like Library, Template, etc.)
		const icons = buttonContainer!.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should be enabled even when fields array is empty', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		expect(addTemplateButton).not.toBeDisabled();
	});

	it('should be enabled when fields already exist', () => {
		const fields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 }
		];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		expect(addTemplateButton).not.toBeDisabled();
	});
});

describe('FieldDefinitionEditor - Template Picker Modal (Issue #210)', () => {
	it('should open template picker modal when Add from Template is clicked', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText(/select.*field template|choose.*template/i)).toBeInTheDocument();
		});
	});

	it('should close template picker when Cancel is clicked', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should close template picker when Escape is pressed', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		await fireEvent.keyDown(document, { key: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Adding Fields from Template (Issue #210)', () => {
	it('should add template fields when template is selected', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		// Select a template (assuming Combat Stats template exists in picker)
		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		// Should call onChange with new fields added
		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			expect(updatedFields.length).toBeGreaterThan(0);
		});
	});

	it('should append template fields to existing fields', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'name', label: 'Name', type: 'text', required: true, order: 0 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			// Should include original field plus template fields
			expect(updatedFields.length).toBeGreaterThan(1);
			// Original field should still be present
			expect(updatedFields.some((f: FieldDefinition) => f.key === 'name')).toBe(true);
		});
	});

	it('should close template picker after selection', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should preserve field definition properties from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];

			// Check that field properties are preserved
			updatedFields.forEach((field: FieldDefinition) => {
				expect(field.key).toBeTruthy();
				expect(field.label).toBeTruthy();
				expect(field.type).toBeTruthy();
				expect(typeof field.required).toBe('boolean');
				expect(typeof field.order).toBe('number');
			});
		});
	});

	it('should update field order when adding from template', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 },
			{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 1 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];

			// New fields should have order values starting from 2
			const newFields = updatedFields.slice(2);
			newFields.forEach((field: FieldDefinition, index: number) => {
				expect(field.order).toBeGreaterThanOrEqual(2);
			});
		});
	});
});

describe('FieldDefinitionEditor - Field Key Conflict Resolution (Issue #210)', () => {
	it('should detect field key conflicts when adding from template', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 0 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		// Select template that has 'hp' field
		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];

			// Should have renamed conflicting field key
			const hpFields = updatedFields.filter((f: FieldDefinition) =>
				f.key.startsWith('hp')
			);
			// Original field + renamed field from template
			expect(hpFields.length).toBe(2);
			expect(hpFields.some((f: FieldDefinition) => f.key === 'hp')).toBe(true);
			expect(hpFields.some((f: FieldDefinition) => f.key.match(/hp_\d+/))).toBe(true);
		});
	});

	it('should append numeric suffix to conflicting field keys', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		// Assuming template has a field with key 'field1'
		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			const updatedFields = mockOnChange.mock.calls[0][0];
			const conflictingFields = updatedFields.filter((f: FieldDefinition) =>
				f.key.startsWith('field1')
			);

			if (conflictingFields.length > 1) {
				// Should have renamed: field1, field1_1, field1_2, etc.
				expect(conflictingFields.some((f: FieldDefinition) => f.key.match(/_\d+$/))).toBe(true);
			}
		});
	});

	it('should preserve field labels even when keys are renamed', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 0 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			const updatedFields = mockOnChange.mock.calls[0][0];
			const hpFields = updatedFields.filter((f: FieldDefinition) =>
				f.key.startsWith('hp')
			);

			// Labels should be preserved
			hpFields.forEach((field: FieldDefinition) => {
				expect(field.label).toBeTruthy();
			});
		});
	});
});

describe('FieldDefinitionEditor - Template Feature Accessibility (Issue #210)', () => {
	it('should have accessible label for Add from Template button', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		expect(addTemplateButton).toHaveAccessibleName();
	});

	it('should support keyboard navigation for Add from Template button', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		expect(addTemplateButton).not.toHaveAttribute('tabindex', '-1');
	});

	it('should support Enter key to activate Add from Template button', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		addTemplateButton.focus();

		await fireEvent.keyDown(addTemplateButton, { key: 'Enter' });

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Template Feature Integration (Issue #210)', () => {
	it('should maintain existing field editor functionality', async () => {
		const fields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 }
		];
		render(FieldDefinitionEditor, { fields });

		// Existing functionality should still work
		expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
		expect(screen.getByText('Field 1')).toBeInTheDocument();
	});

	it('should allow adding manual fields after adding from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		// Add from template
		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Should still be able to add manual fields
		const addFieldButton = screen.getByRole('button', { name: /add field/i });
		expect(addFieldButton).not.toBeDisabled();
	});

	it('should allow editing fields added from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Fields should be editable (expandable, have edit controls, etc.)
		// Exact implementation depends on field editor design
	});

	it('should allow removing fields added from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		const templateOption = screen.getByText(/combat stats/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Should have remove buttons for fields
		const removeButtons = screen.getAllByRole('button', { name: /remove|delete/i });
		expect(removeButtons.length).toBeGreaterThan(0);
	});
});

describe('FieldDefinitionEditor - Edge Cases (Issue #210)', () => {
	it('should handle adding template when no templates exist', async () => {
		const fields: FieldDefinition[] = [];

		// Mock empty templates
		vi.doMock('$lib/stores/campaign.svelte', () => ({
			campaignStore: {
				fieldTemplates: []
			}
		}));

		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		await waitFor(() => {
			expect(screen.getByText(/no.*field templates|no templates available/i)).toBeInTheDocument();
		});
	});

	it('should handle adding very large template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onChange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });
		await fireEvent.click(addTemplateButton);

		// Select template with many fields
		const templateOption = screen.getByText(/location details/i).closest('button');
		await fireEvent.click(templateOption!);

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			expect(updatedFields.length).toBeGreaterThan(0);
		});
	});

	it('should handle clicking Add from Template multiple times', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add from template/i });

		// Open picker
		await fireEvent.click(addTemplateButton);
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		// Close picker
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		// Open picker again
		await fireEvent.click(addTemplateButton);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
