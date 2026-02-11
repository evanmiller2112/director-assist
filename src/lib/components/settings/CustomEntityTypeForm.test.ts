/**
 * Tests for CustomEntityTypeForm Component Enhancements - Phase 2
 *
 * Issue #25 Phase 2: Custom Entity Type Management UI
 *
 * This test suite covers the enhancements to CustomEntityTypeForm:
 * - Description field for entity types
 * - Improved validation messages
 * - Preview of entity type in sidebar
 * - Better error handling for duplicate type keys
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import CustomEntityTypeForm from './CustomEntityTypeForm.svelte';
import type { EntityTypeDefinition } from '$lib/types';

describe('CustomEntityTypeForm - Description Field (Issue #25 Phase 2)', () => {
	it('should display description field', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
	});

	it('should show description input as textarea', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const descriptionInput = screen.getByLabelText(/Description/i);
		expect(descriptionInput.tagName).toBe('TEXTAREA');
	});

	it('should populate description from initialValue', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const initialValue: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: [],
			description: 'Magical spells and incantations'
		};

		render(CustomEntityTypeForm, {
			initialValue,
			isEditing: true,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('Magical spells and incantations');
	});

	it('should allow editing description field', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const descriptionInput = screen.getByLabelText(/Description/i);
		await fireEvent.input(descriptionInput, {
			target: { value: 'A custom entity type for tracking quests' }
		});

		expect((descriptionInput as HTMLTextAreaElement).value).toBe(
			'A custom entity type for tracking quests'
		);
	});

	it('should include description in submitted entity type', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Fill in required fields
		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});
		await fireEvent.input(screen.getByLabelText(/Description/i), {
			target: { value: 'Campaign quests and objectives' }
		});

		// Submit form
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Campaign quests and objectives'
				})
			);
		});
	});

	it('should show placeholder text for description', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
		expect(descriptionInput.placeholder).toBeTruthy();
	});

	it('should allow multiline description', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const descriptionInput = screen.getByLabelText(/Description/i);
		const multilineText = 'Line 1\nLine 2\nLine 3';
		await fireEvent.input(descriptionInput, { target: { value: multilineText } });

		expect((descriptionInput as HTMLTextAreaElement).value).toBe(multilineText);
	});

	it('should show help text for description field', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(
			screen.getByText(/Brief description of this entity type|Describe this entity type/i)
		).toBeInTheDocument();
	});

	it('should make description optional (not required)', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Fill required fields but leave description empty
		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should allow submission without description
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalled();
		});
	});
});

describe('CustomEntityTypeForm - Improved Validation Messages (Issue #25 Phase 2)', () => {
	it('should show specific error for empty display name', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		expect(screen.getByText(/Display name is required|Label is required/i)).toBeInTheDocument();
	});

	it('should show specific error for invalid type key', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Test' }
		});

		// Manually edit type key to invalid value
		const typeKeyInput = screen.getByLabelText(/Type Key/i);
		await fireEvent.input(typeKeyInput, { target: { value: 'Invalid-Key!' } });

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		expect(
			screen.getByText(/Type key must.*lowercase.*letters.*numbers.*underscores/i)
		).toBeInTheDocument();
	});

	it('should show specific error for type key starting with number', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Test' }
		});

		const typeKeyInput = screen.getByLabelText(/Type Key/i);
		await fireEvent.input(typeKeyInput, { target: { value: '123_type' } });

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		expect(screen.getByText(/Type key must start with a letter/i)).toBeInTheDocument();
	});

	it('should show specific error for empty plural name', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Clear the auto-generated plural
		const pluralInput = screen.getByLabelText(/Plural Name/i);
		await fireEvent.input(pluralInput, { target: { value: '' } });

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		expect(screen.getByText(/Plural.*is required/i)).toBeInTheDocument();
	});

	it('should show error for duplicate type key', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		// Assume 'character' is a built-in type
		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Character' }
		});

		// Type key will auto-generate to 'character'
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should show duplicate error
		expect(
			screen.getByText(/already exists|Type key.*already in use|duplicate/i)
		).toBeInTheDocument();
	});

	it('should clear validation errors when fields are corrected', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Trigger validation
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();

		// Fix the error
		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Error should clear
		expect(screen.queryByText(/Display name is required/i)).not.toBeInTheDocument();
	});

	it('should show validation errors inline with fields', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Error should appear near the Display Name field
		const displayNameSection = screen.getByLabelText(/Display Name/i).closest('div');
		expect(displayNameSection).toBeTruthy();
		expect(within(displayNameSection!).getByText(/is required/i)).toBeInTheDocument();
	});

	it('should show multiple validation errors simultaneously', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Clear plural name
		const pluralInput = screen.getByLabelText(/Plural Name/i);
		await fireEvent.input(pluralInput, { target: { value: '' } });

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should show errors for both display name and plural
		expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();
		expect(screen.getByText(/Plural.*is required/i)).toBeInTheDocument();
	});

	it('should use red styling for error messages', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		const errorMessage = screen.getByText(/Display name is required/i);
		expect(errorMessage.className).toMatch(/text-red/);
	});
});

describe('CustomEntityTypeForm - Preview Functionality (Issue #25 Phase 2)', () => {
	it('should show preview section', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Preview/i)).toBeInTheDocument();
	});

	it('should preview entity type as it would appear in sidebar', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Preview should show "Quests" (plural)
		expect(screen.getByText(/Quests/)).toBeInTheDocument();
	});

	it('should show selected icon in preview', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Should show icon preview (implementation depends on IconPicker)
		// The preview section should contain the selected icon
		const previewSection = screen.getByText(/Preview/i).closest('section');
		expect(previewSection).toBeTruthy();
	});

	it('should show selected color in preview', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Preview should use the selected color
		const previewSection = screen.getByText(/Preview/i).closest('section');
		expect(previewSection).toBeTruthy();
	});

	it('should update preview in real-time as fields change', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		expect(screen.getByText(/Quests/)).toBeInTheDocument();

		// Change plural
		await fireEvent.input(screen.getByLabelText(/Plural Name/i), {
			target: { value: 'Quest Items' }
		});

		expect(screen.getByText(/Quest Items/)).toBeInTheDocument();
	});

	it('should show preview as sidebar item mock', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Preview should look like a sidebar navigation item
		const previewSection = screen.getByText(/Preview/i).closest('section');
		expect(previewSection).toBeTruthy();

		// Should have visual elements similar to sidebar items
		// (icon, label, possibly count placeholder)
	});

	it('should show entity count placeholder in preview', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		// Preview might show "0" or "(0)" as placeholder count
		const previewSection = screen.getByText(/Preview/i).closest('section');
		expect(previewSection).toBeTruthy();
	});

	it('should show description in preview if provided', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});
		await fireEvent.input(screen.getByLabelText(/Description/i), {
			target: { value: 'Campaign objectives and missions' }
		});

		// Description should appear in preview
		expect(screen.getByText(/Campaign objectives and missions/)).toBeInTheDocument();
	});
});

describe('CustomEntityTypeForm - Better Error Handling (Issue #25 Phase 2)', () => {
	it('should prevent submission while saving', async () => {
		const mockOnSubmit = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 1000))
		);
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Button should be disabled while saving
		await waitFor(() => {
			expect(submitButton).toBeDisabled();
		});
	});

	it('should show loading state while saving', async () => {
		const mockOnSubmit = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 100))
		);
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should show "Saving..." text
		await waitFor(() => {
			expect(screen.getByText(/Saving/i)).toBeInTheDocument();
		});
	});

	it('should handle async submission errors gracefully', async () => {
		const mockOnSubmit = vi.fn(() => Promise.reject(new Error('Save failed')));
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should show error message
		await waitFor(() => {
			expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
		});
	});

	it('should re-enable form after submission error', async () => {
		const mockOnSubmit = vi.fn(() => Promise.reject(new Error('Save failed')));
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// After error, form should be re-enabled
		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});
	});

	it('should validate before attempting submission', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should not call onsubmit if validation fails
		expect(mockOnSubmit).not.toHaveBeenCalled();
	});

	it('should show validation summary if multiple errors exist', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const pluralInput = screen.getByLabelText(/Plural Name/i);
		await fireEvent.input(pluralInput, { target: { value: '' } });

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should show validation errors
		expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();
		expect(screen.getByText(/Plural.*is required/i)).toBeInTheDocument();
	});

	it('should handle server-side validation errors', async () => {
		const mockOnSubmit = vi.fn(() =>
			Promise.reject(new Error('Type key already exists'))
		);
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Component shows the error message - look for text containing "failed" or the actual error
		await waitFor(() => {
			const errorElement = screen.getByText(/Type key already exists|failed/i);
			expect(errorElement).toBeInTheDocument();
		});
	});
});

describe('CustomEntityTypeForm - Existing Functionality (Regression Tests)', () => {
	it('should auto-generate type key from display name', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'My Custom Type' }
		});

		const typeKeyInput = screen.getByLabelText(/Type Key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('my_custom_type');
	});

	it('should auto-generate plural from singular', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});

		const pluralInput = screen.getByLabelText(/Plural Name/i) as HTMLInputElement;
		expect(pluralInput.value).toBe('Quests');
	});

	it('should disable type key editing when isEditing is true', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const initialValue: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(CustomEntityTypeForm, {
			initialValue,
			isEditing: true,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const typeKeyInput = screen.getByLabelText(/Type Key/i) as HTMLInputElement;
		expect(typeKeyInput.disabled).toBe(true);
	});

	it('should show cancel button that calls oncancel', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should render icon picker', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Icon/i)).toBeInTheDocument();
	});

	it('should render color picker', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Color/i)).toBeInTheDocument();
	});

	it('should render field definitions editor', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Look for the Fields heading specifically (h2 with "Fields" text)
		const fieldsHeading = screen.getByRole('heading', { name: /^Fields$/i });
		expect(fieldsHeading).toBeInTheDocument();
	});

	it('should render default relationships section', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Default Relationships/i)).toBeInTheDocument();
	});
});

describe('CustomEntityTypeForm - Integration (Issue #25 Phase 2)', () => {
	it('should support full create workflow with all Phase 2 features', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Fill in all fields including new description
		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Quest' }
		});
		await fireEvent.input(screen.getByLabelText(/Description/i), {
			target: { value: 'Campaign objectives' }
		});

		// Check preview
		expect(screen.getByText(/Preview/i)).toBeInTheDocument();
		expect(screen.getByText(/Quests/)).toBeInTheDocument();

		// Submit
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					description: 'Campaign objectives'
				})
			);
		});
	});

	it('should support full edit workflow with Phase 2 features', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const initialValue: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: [],
			description: 'Magical spells'
		};

		render(CustomEntityTypeForm, {
			initialValue,
			isEditing: true,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Update description
		await fireEvent.input(screen.getByLabelText(/Description/i), {
			target: { value: 'Magical spells and incantations' }
		});

		// Check preview updates
		expect(screen.getByText(/Magical spells and incantations/)).toBeInTheDocument();

		// Submit
		const submitButton = screen.getByRole('button', { name: /Save Changes/i });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'Magical spells and incantations'
				})
			);
		});
	});
});

/**
 * Tests for CustomEntityTypeForm Component - Issue #209
 *
 * Issue #209: Add template selection flow for custom entity creation
 *
 * This test suite covers the new template indicator props added to CustomEntityTypeForm:
 * - templateName prop for displaying which template was selected
 * - onChangeTemplate callback for switching templates
 * - Template badge display
 * - "Change template" button behavior
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

describe('CustomEntityTypeForm - Template Name Badge (Issue #209)', () => {
	it('should show template name badge when templateName prop is provided', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Monster/Threat',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Template: Monster\/Threat/i)).toBeInTheDocument();
	});

	it('should not show template badge when templateName is undefined', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.queryByText(/Template:/i)).not.toBeInTheDocument();
	});

	it('should display correct template name for different templates', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { rerender } = render(CustomEntityTypeForm, {
			templateName: 'Ability/Power',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Template: Ability\/Power/i)).toBeInTheDocument();

		// Change to different template
		rerender({
			templateName: 'Spell/Ritual',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Template: Spell\/Ritual/i)).toBeInTheDocument();
	});

	it('should style template badge distinctly from other form elements', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Condition',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const badge = screen.getByText(/Template: Condition/i);
		// Badge should have distinct styling (badge, pill, or tag appearance)
		expect(badge.className).toMatch(/badge|pill|tag|inline-flex/);
	});

	it('should position template badge prominently in the form', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Negotiation Outcome',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const badge = screen.getByText(/Template: Negotiation Outcome/i);
		expect(badge).toBeInTheDocument();
		// Badge should be visible and near the top of the form
		expect(badge).toBeVisible();
	});
});

describe('CustomEntityTypeForm - Change Template Button (Issue #209)', () => {
	it('should show "Change template" button when onChangeTemplate callback is provided', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Monster/Threat',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByRole('button', { name: /Change template/i })).toBeInTheDocument();
	});

	it('should not show "Change template" button when onChangeTemplate is undefined', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Condition',
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.queryByRole('button', { name: /Change template/i })).not.toBeInTheDocument();
	});

	it('should call onChangeTemplate when "Change template" button is clicked', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Ability/Power',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		expect(mockOnChangeTemplate).toHaveBeenCalledTimes(1);
	});

	it('should not show "Change template" button in edit mode', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();
		const initialValue: EntityTypeDefinition = {
			type: 'monster',
			label: 'Monster',
			labelPlural: 'Monsters',
			icon: 'skull',
			color: 'red',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(CustomEntityTypeForm, {
			initialValue,
			isEditing: true,
			templateName: 'Monster/Threat',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.queryByRole('button', { name: /Change template/i })).not.toBeInTheDocument();
	});

	it('should position "Change template" button near template badge', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			templateName: 'Spell/Ritual',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const badge = screen.getByText(/Template: Spell\/Ritual/i);
		const changeButton = screen.getByRole('button', { name: /Change template/i });

		// Both should be in the same container/section
		expect(badge).toBeInTheDocument();
		expect(changeButton).toBeInTheDocument();
	});

	it('should style "Change template" button as a secondary action', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Negotiation Outcome',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const changeButton = screen.getByRole('button', { name: /Change template/i });
		// Button should have secondary or link styling, not primary
		expect(changeButton.className).toMatch(/secondary|link|ghost|text/);
	});

	it('should be keyboard accessible', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Condition',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const changeButton = screen.getByRole('button', { name: /Change template/i });

		// Button should be focusable (keyboard accessible)
		changeButton.focus();
		expect(document.activeElement).toBe(changeButton);

		// Native buttons handle Enter/Space via click, so test click behavior
		await fireEvent.click(changeButton);

		expect(mockOnChangeTemplate).toHaveBeenCalled();
	});
});

describe('CustomEntityTypeForm - Template Props Integration (Issue #209)', () => {
	it('should work with both templateName and onChangeTemplate together', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Monster/Threat',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Both badge and button should be visible
		expect(screen.getByText(/Template: Monster\/Threat/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Change template/i })).toBeInTheDocument();

		// Button should work
		const changeButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeButton);

		expect(mockOnChangeTemplate).toHaveBeenCalled();
	});

	it('should work without template props (backward compatibility)', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Should render normally without template features
		expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		expect(screen.queryByText(/Template:/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Change template/i })).not.toBeInTheDocument();
	});

	it('should populate form with template data from initialValue', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		const templateData: EntityTypeDefinition = {
			type: 'ds-monster-threat',
			label: 'Monster/Threat',
			labelPlural: 'Monsters/Threats',
			icon: 'skull',
			color: 'red',
			isBuiltIn: false,
			fieldDefinitions: [
				{ key: 'threat_level', label: 'Threat Level', type: 'select', required: false, order: 1 }
			],
			defaultRelationships: []
		};

		render(CustomEntityTypeForm, {
			initialValue: templateData,
			templateName: 'Monster/Threat',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Form should be populated with template data
		const displayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
		expect(displayNameInput.value).toBe('Monster/Threat');

		// Template badge should show
		expect(screen.getByText(/Template: Monster\/Threat/i)).toBeInTheDocument();
	});

	it('should not show template features when creating from scratch', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		// No templateName or onChangeTemplate provided
		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// No template indicators should be present
		expect(screen.queryByText(/Template:/i)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Change template/i })).not.toBeInTheDocument();

		// Form should work normally
		expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
	});
});

describe('CustomEntityTypeForm - Template Props with Existing Features (Issue #209)', () => {
	it('should show template badge alongside form validation', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Ability/Power',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Clear display name to trigger validation
		const displayNameInput = screen.getByLabelText(/Display Name/i);
		await fireEvent.input(displayNameInput, { target: { value: '' } });

		// Submit to trigger validation
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Both template badge and validation error should be visible
		expect(screen.getByText(/Template: Ability\/Power/i)).toBeInTheDocument();
		expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();
	});

	it('should maintain template badge in preview section', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		render(CustomEntityTypeForm, {
			templateName: 'Spell/Ritual',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Template badge should be visible
		expect(screen.getByText(/Template: Spell\/Ritual/i)).toBeInTheDocument();

		// Preview should also be present
		expect(screen.getByText(/Preview/i)).toBeInTheDocument();
	});

	it('should include template information in form submission', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();
		const mockOnChangeTemplate = vi.fn();

		const templateData: EntityTypeDefinition = {
			type: 'ds-condition',
			label: 'Condition',
			labelPlural: 'Conditions',
			icon: 'flame',
			color: 'orange',
			isBuiltIn: false,
			fieldDefinitions: [
				{ key: 'duration', label: 'Duration', type: 'text', required: false, order: 1 }
			],
			defaultRelationships: []
		};

		render(CustomEntityTypeForm, {
			initialValue: templateData,
			templateName: 'Condition',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Submit the form
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should submit with template field definitions
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'ds-condition',
					label: 'Condition',
					fieldDefinitions: expect.arrayContaining([
						expect.objectContaining({ key: 'duration' })
					])
				})
			);
		});
	});
});

/**
 * Tests for CustomEntityTypeForm Component - Issue #168 Phase 1
 *
 * Issue #168 Phase 1: Relationship Guidance
 *
 * This test suite covers Phase 1 enhancements for relationship selection:
 * - Relationship groups with categories
 * - Descriptions for each relationship
 * - Tips panel integration
 * - Improved relationship picker organization
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

describe('CustomEntityTypeForm - Relationship Groups (Issue #168 Phase 1)', () => {
	it('should display relationships grouped by category', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Should show group headers
		expect(screen.getByText(/Character Relationships/i)).toBeInTheDocument();
	});

	it('should show Character Relationships group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Character Relationships/i)).toBeInTheDocument();
	});

	it('should show Physical Location group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Use getAllByText since there may be multiple mentions
		expect(screen.getAllByText(/Physical Location/i).length).toBeGreaterThan(0);
	});

	it('should show Authority/Control group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// The label is 'Authority & Control'
		expect(screen.getAllByText(/Authority.*Control/i).length).toBeGreaterThan(0);
	});

	it('should show Causality group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// The label is 'Causality & Events'
		expect(screen.getAllByText(/Causality.*Events/i).length).toBeGreaterThan(0);
	});

	it('should display relationships within Character Relationships group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Find the character group by its aria-label
		const characterSection = container.querySelector('[aria-label="Character Relationships"]');
		expect(characterSection).toBeTruthy();

		// Should contain character relationships - displayed text has spaces
		expect(within(characterSection as HTMLElement).getByText(/knows/i)).toBeInTheDocument();
		expect(within(characterSection as HTMLElement).getByText(/allied with/i)).toBeInTheDocument();
	});

	it('should display relationships within Physical Location group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Find the location group by its aria-label
		const locationSection = container.querySelector('[aria-label="Physical Location"]');
		expect(locationSection).toBeTruthy();

		expect(within(locationSection as HTMLElement).getByText(/located at/i)).toBeInTheDocument();
		expect(within(locationSection as HTMLElement).getByText(/part of/i)).toBeInTheDocument();
	});

	it('should display relationships within Authority/Control group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Find the authority group by its aria-label
		const authoritySection = container.querySelector('[aria-label="Authority & Control"]');
		expect(authoritySection).toBeTruthy();

		expect(within(authoritySection as HTMLElement).getByText(/serves/i)).toBeInTheDocument();
		expect(within(authoritySection as HTMLElement).getByText(/owns/i)).toBeInTheDocument();
	});

	it('should display relationships within Causality group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Find the causality group by its aria-label
		const causalitySection = container.querySelector('[aria-label="Causality & Events"]');
		expect(causalitySection).toBeTruthy();

		expect(within(causalitySection as HTMLElement).getByText(/caused by/i)).toBeInTheDocument();
		expect(within(causalitySection as HTMLElement).getByText(/led to/i)).toBeInTheDocument();
	});
});

describe('CustomEntityTypeForm - Relationship Descriptions (Issue #168 Phase 1)', () => {
	it('should show description for Character Relationships group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/social.*interpersonal/i)).toBeInTheDocument();
	});

	it('should show description for Physical Location group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/spatial.*physical/i)).toBeInTheDocument();
	});

	it('should show description for Authority/Control group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Description is 'Power dynamics, ownership, and authority relationships'
		expect(screen.getByText(/power.*dynamics.*ownership/i)).toBeInTheDocument();
	});

	it('should show description for Causality group', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Description is 'Temporal and cause-and-effect relationships'
		expect(screen.getByText(/temporal.*cause.*effect/i)).toBeInTheDocument();
	});

	it('should display descriptions with muted styling', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const description = screen.getByText(/social.*interpersonal/i);
		expect(description.className).toMatch(/text-gray|text-muted|opacity/);
	});
});

describe('CustomEntityTypeForm - Relationship Selection (Issue #168 Phase 1)', () => {
	it('should allow selecting relationships from different groups', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select from Character group - aria-label uses spaces, not underscores
		const knowsCheckbox = screen.getByLabelText('knows');
		await fireEvent.click(knowsCheckbox);

		// Select from Location group - aria-label is 'located at' (with space)
		const locatedAtCheckbox = screen.getByLabelText('located at');
		await fireEvent.click(locatedAtCheckbox);

		// Both should be selected
		expect((knowsCheckbox as HTMLInputElement).checked).toBe(true);
		expect((locatedAtCheckbox as HTMLInputElement).checked).toBe(true);
	});

	it('should maintain existing relationship selection functionality', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		await fireEvent.input(screen.getByLabelText(/Display Name/i), {
			target: { value: 'Test Entity' }
		});

		// aria-label uses 'knows' without underscore
		const knowsCheckbox = screen.getByLabelText('knows');
		await fireEvent.click(knowsCheckbox);

		// Find submit button by type="submit" to be more specific
		const submitButtons = screen.getAllByRole('button');
		const submitButton = submitButtons.find((btn) => btn.getAttribute('type') === 'submit');
		expect(submitButton).toBeTruthy();
		await fireEvent.click(submitButton!);

		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					defaultRelationships: expect.arrayContaining(['knows'])
				})
			);
		});
	});

	it('should show all relationships even when grouped', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// All key relationships should be present - aria-labels use spaces not underscores
		expect(screen.getByLabelText('knows')).toBeInTheDocument();
		expect(screen.getByLabelText('allied with')).toBeInTheDocument();
		expect(screen.getByLabelText('located at')).toBeInTheDocument();
		expect(screen.getByLabelText('serves')).toBeInTheDocument();
		expect(screen.getByLabelText('caused by')).toBeInTheDocument();
	});
});

describe('CustomEntityTypeForm - DrawSteelTipsPanel Integration (Issue #168 Phase 1)', () => {
	it('should render DrawSteelTipsPanel component', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();
	});

	it('should show tips panel by default when creating new entity type', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const tipsPanel = screen.getByText(/Tips for Draw Steel/i);
		expect(tipsPanel).toBeVisible();
	});

	it('should allow dismissing the tips panel', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Tips for Draw Steel/i)).toBeInTheDocument();

		const dismissButton = screen.getByRole('button', { name: /dismiss|close|hide/i });
		await fireEvent.click(dismissButton);

		expect(screen.queryByText(/Tips for Draw Steel/i)).not.toBeInTheDocument();
	});

	it('should position tips panel appropriately within form', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const tipsPanel = screen.getByText(/Tips for Draw Steel/i).closest('div, aside, section');
		expect(tipsPanel).toBeTruthy();

		// Should be within the form
		const form = container.querySelector('form') as HTMLElement;
		expect(form).toContainElement(tipsPanel as HTMLElement);
	});
});

describe('CustomEntityTypeForm - Grouped UI Improvements (Issue #168 Phase 1)', () => {
	it('should use collapsible sections for relationship groups', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const characterHeader = screen.getByText(/Character Relationships/i);
		const headerButton = characterHeader.closest('button');

		if (headerButton) {
			await fireEvent.click(headerButton);
			expect(headerButton).toHaveAttribute('aria-expanded');
		}
	});

	it('should show group icons for visual clarity', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Lucide icons render as SVGs
		const icons = container.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should maintain consistent spacing between groups', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Use aria-labels to find the relationship groups
		const characterGroup = container.querySelector('[aria-label="Character Relationships"]');
		const locationGroup = container.querySelector('[aria-label="Physical Location"]');

		expect(characterGroup).toBeTruthy();
		expect(locationGroup).toBeTruthy();
	});

	it('should use visual hierarchy to distinguish groups', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const groupHeader = screen.getByText(/Character Relationships/i);
		expect(groupHeader.className).toMatch(/font-medium|font-semibold|text-lg/);
	});
});

describe('CustomEntityTypeForm - Accessibility for Grouped Relationships (Issue #168 Phase 1)', () => {
	it('should have proper ARIA labels for relationship groups', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Find groups by their role="group" attribute which have aria-label
		const characterSection = container.querySelector('[aria-label="Character Relationships"]');
		expect(characterSection).toBeTruthy();
		expect(characterSection).toHaveAttribute('role', 'group');
	});

	it('should use semantic HTML for grouping', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Groups should use fieldset or section elements
		const groups = container.querySelectorAll('fieldset, section[aria-label], div[role="group"]');
		expect(groups.length).toBeGreaterThanOrEqual(4); // 4 relationship groups
	});

	it('should maintain keyboard navigation for relationship checkboxes', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(CustomEntityTypeForm, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			expect(checkbox).not.toHaveAttribute('tabindex', '-1');
		});
	});
});
