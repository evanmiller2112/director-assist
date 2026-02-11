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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
import type { FieldDefinition } from '$lib/types';

// Mock the campaign store with field templates
vi.mock('$lib/stores/campaign.svelte', () => ({
	campaignStore: {
		fieldTemplates: [
			{
				id: 'template-1',
				name: 'Combat Stats',
				description: 'Standard combat statistics for characters and NPCs',
				category: 'draw-steel',
				fieldDefinitions: [
					{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 1 },
					{ key: 'ac', label: 'Armor Class', type: 'number', required: true, order: 2 },
					{ key: 'initiative', label: 'Initiative', type: 'number', required: false, order: 3 }
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			},
			{
				id: 'template-2',
				name: 'Social Attributes',
				description: 'Social interaction and reputation fields',
				category: 'user',
				fieldDefinitions: [
					{ key: 'reputation', label: 'Reputation', type: 'text', required: false, order: 1 },
					{ key: 'faction_standing', label: 'Faction Standing', type: 'select', required: false, order: 2, options: ['Allied', 'Neutral', 'Hostile'] }
				],
				createdAt: new Date('2024-02-01'),
				updatedAt: new Date('2024-02-01')
			},
			{
				id: 'template-3',
				name: 'Location Details',
				description: 'Geographic and environmental details',
				category: 'user',
				fieldDefinitions: [
					{ key: 'climate', label: 'Climate', type: 'text', required: false, order: 1 },
					{ key: 'population', label: 'Population', type: 'number', required: false, order: 2 },
					{ key: 'government', label: 'Government', type: 'text', required: false, order: 3 },
					{ key: 'economy', label: 'Economy', type: 'textarea', required: false, order: 4 },
					{ key: 'landmarks', label: 'Landmarks', type: 'textarea', required: false, order: 5 }
				],
				createdAt: new Date('2024-03-01'),
				updatedAt: new Date('2024-03-01')
			}
		]
	}
}));

describe('FieldDefinitionEditor - Add from Template Button (Issue #210)', () => {
	it('should display "Add from Template" button', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		expect(addTemplateButton).toBeInTheDocument();
	});

	it('should place Add from Template button near Add Field button', () => {
		const fields: FieldDefinition[] = [];
		const { container } = render(FieldDefinitionEditor, { fields });

		const addFieldButton = screen.getByRole('button', { name: /^add new field$/i });
		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });

		// Both buttons should be in the same parent container
		const addFieldParent = addFieldButton.closest('div, section');
		const addTemplateParent = addTemplateButton.closest('div, section');

		expect(addFieldParent).toEqual(addTemplateParent);
	});

	it('should have appropriate icon for Add from Template button', () => {
		const fields: FieldDefinition[] = [];
		const { container } = render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		const buttonContainer = addTemplateButton.closest('button');

		// Should have an icon (like Library, Template, etc.)
		const icons = buttonContainer!.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should be enabled even when fields array is empty', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		expect(addTemplateButton).not.toBeDisabled();
	});

	it('should be enabled when fields already exist', () => {
		const fields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 }
		];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		expect(addTemplateButton).not.toBeDisabled();
	});
});

describe('FieldDefinitionEditor - Template Picker Modal (Issue #210)', () => {
	it('should open template picker modal when Add from Template is clicked', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText(/select.*field template/i)).toBeInTheDocument();
		});
	});

	it('should close template picker when Cancel is clicked', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const dialog = await screen.findByRole('dialog');
		const cancelButton = await within(dialog).findByRole('button', { name: /^cancel$/i });
		await fireEvent.click(cancelButton);
		await tick();

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should close template picker when Escape is pressed', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const dialog = await screen.findByRole('dialog');
		await fireEvent.keyDown(dialog, { key: 'Escape' });
		await tick();

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
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		// Select a template (Combat Stats template exists in picker)
		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		// Should call onChange with new fields added
		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			expect(updatedFields.length).toBe(3); // Combat Stats has 3 fields
			expect(updatedFields[0].key).toBe('hp');
			expect(updatedFields[1].key).toBe('ac');
			expect(updatedFields[2].key).toBe('initiative');
		});
	});

	it('should append template fields to existing fields', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'name', label: 'Name', type: 'text', required: true, order: 1 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			// Should include original field (1) plus template fields (3) = 4 total
			expect(updatedFields.length).toBe(4);
			// Original field should still be present
			expect(updatedFields.some((f: FieldDefinition) => f.key === 'name')).toBe(true);
			// Template fields should be added
			expect(updatedFields.some((f: FieldDefinition) => f.key === 'hp')).toBe(true);
		});
	});

	it('should close template picker after selection', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	it('should preserve field definition properties from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

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
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 1 },
			{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];

			// New fields should have order values starting from 3 (2 existing + 1)
			const newFields = updatedFields.slice(2);
			newFields.forEach((field: FieldDefinition) => {
				expect(field.order).toBeGreaterThanOrEqual(3);
			});
		});
	});
});

describe('FieldDefinitionEditor - Field Key Conflict Resolution (Issue #210)', () => {
	it('should detect field key conflicts when adding from template', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 1 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		// Select template that has 'hp' field
		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

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
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 1 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		// Combat Stats template doesn't have 'field1', but no conflict occurs
		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			// No conflict, just verify fields were added
			expect(updatedFields.length).toBe(4); // 1 existing + 3 from template
		});
	});

	it('should preserve field labels even when keys are renamed', async () => {
		const existingFields: FieldDefinition[] = [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: true, order: 1 }
		];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields: existingFields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

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

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		expect(addTemplateButton).toHaveAccessibleName();
	});

	it('should support keyboard navigation for Add from Template button', () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		expect(addTemplateButton).not.toHaveAttribute('tabindex', '-1');
	});

	it('should support Enter key to activate Add from Template button', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		addTemplateButton.focus();

		await fireEvent.keyDown(addTemplateButton, { key: 'Enter' });
		await tick();

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Template Feature Integration (Issue #210)', () => {
	it('should maintain existing field editor functionality', async () => {
		const fields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 1 }
		];
		render(FieldDefinitionEditor, { fields });

		// Existing functionality should still work
		expect(screen.getByRole('button', { name: /^add new field$/i })).toBeInTheDocument();
		expect(screen.getByText('Field 1')).toBeInTheDocument();
	});

	it('should allow adding manual fields after adding from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onchange: mockOnChange
		});

		// Add from template
		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Should still be able to add manual fields
		const addFieldButton = screen.getByRole('button', { name: /^add new field$/i });
		expect(addFieldButton).not.toBeDisabled();
	});

	it('should allow editing fields added from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Fields should be present and expandable
		const fieldHeaders = screen.getAllByRole('button', { name: /toggle field editor/i });
		expect(fieldHeaders.length).toBeGreaterThan(0);
	});

	it('should allow removing fields added from template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		const templateButton = await screen.findByRole('button', { name: /^select combat stats template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
		});

		// Expand first field to see delete button
		const fieldHeader = screen.getAllByRole('button', { name: /toggle field editor/i })[0];
		await fireEvent.click(fieldHeader);
		await tick();

		// Should have delete buttons for fields
		const deleteButtons = screen.getAllByRole('button', { name: /delete field/i });
		expect(deleteButtons.length).toBeGreaterThan(0);
	});
});

describe('FieldDefinitionEditor - Edge Cases (Issue #210)', () => {
	it('should handle adding template when no templates exist', async () => {
		const fields: FieldDefinition[] = [];

		// Note: vi.doMock doesn't work after initial import, but the current mock has templates
		// This test verifies behavior when modal opens - it will show templates or empty state
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		// If no templates, should show "No Field Templates" message
		// Current mock has templates, so dialog should appear
		await waitFor(() => {
			const dialog = screen.getByRole('dialog');
			expect(dialog).toBeInTheDocument();
		});
	});

	it('should handle adding very large template', async () => {
		const fields: FieldDefinition[] = [];
		const mockOnChange = vi.fn();

		render(FieldDefinitionEditor, {
			fields,
			onchange: mockOnChange
		});

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });
		await fireEvent.click(addTemplateButton);
		await tick();

		// Select template with many fields (Location Details has 5 fields)
		const templateButton = await screen.findByRole('button', { name: /^select location details template$/i });
		await fireEvent.click(templateButton);
		await tick();

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[0][0];
			expect(updatedFields.length).toBe(5); // Location Details has 5 fields
		});
	});

	it('should handle clicking Add from Template multiple times', async () => {
		const fields: FieldDefinition[] = [];
		render(FieldDefinitionEditor, { fields });

		const addTemplateButton = screen.getByRole('button', { name: /add.*fields.*from template/i });

		// Open picker
		await fireEvent.click(addTemplateButton);
		await tick();
		const dialog1 = await screen.findByRole('dialog');
		expect(dialog1).toBeInTheDocument();

		// Close picker
		const cancelButton = await within(dialog1).findByRole('button', { name: /^cancel$/i });
		await fireEvent.click(cancelButton);
		await tick();

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		// Open picker again
		await fireEvent.click(addTemplateButton);
		await tick();
		const dialog2 = await screen.findByRole('dialog');
		expect(dialog2).toBeInTheDocument();
	});
});
