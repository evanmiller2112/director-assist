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
			Promise.reject({ message: 'Type key already exists' })
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

		await waitFor(() => {
			expect(screen.getByText(/Type key already exists/i)).toBeInTheDocument();
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

		expect(screen.getByText(/Fields/i)).toBeInTheDocument();
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
