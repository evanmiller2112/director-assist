/**
 * Tests for EntityTemplateSelector Component - Issue #209
 *
 * Issue #209: Add template selection flow for custom entity creation
 *
 * This test suite covers the new EntityTemplateSelector component that orchestrates
 * the template selection flow, managing state transitions between the gallery view
 * and the form view, handling dirty form detection, and coordinating template changes.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import EntityTemplateSelector from './EntityTemplateSelector.svelte';
import type { EntityTypeDefinition } from '$lib/types';

describe('EntityTemplateSelector - Basic Rendering (Issue #209)', () => {
	it('should render without crashing', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { container } = render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(container).toBeInTheDocument();
	});

	it('should render gallery view by default', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Should show template selection heading
		expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();
	});

	it('should not render form view by default', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Form-specific elements should not be present
		expect(screen.queryByLabelText(/Display Name/i)).not.toBeInTheDocument();
	});

	it('should show all template cards in gallery', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Check for known templates from drawSteelEntityTemplates.ts using aria-labels
		expect(screen.getByRole('button', { name: /Use Monster\/Threat template/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Use Ability\/Power template/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Use Condition template/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Use Negotiation Outcome template/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Use Spell\/Ritual template/i })).toBeInTheDocument();
	});

	it('should show "Start from Scratch" option in gallery', () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Start from Scratch/i)).toBeInTheDocument();
	});
});

describe('EntityTemplateSelector - Template Selection (Issue #209)', () => {
	it('should show form when template is selected', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click on Monster/Threat template
		const monsterTemplateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(monsterTemplateButton);

		// Should now show the form
		expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
	});

	it('should hide gallery when template is selected', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click on a template
		const templateButton = screen.getByRole('button', {
			name: /Use Ability\/Power template/i
		});
		await fireEvent.click(templateButton);

		// Gallery heading should not be visible
		expect(screen.queryByText(/Choose a Template/i)).not.toBeInTheDocument();
	});

	it('should pass template data to form when template is selected', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select Monster/Threat template
		const monsterTemplateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(monsterTemplateButton);

		// Form should show the template name badge
		expect(screen.getByText(/Template: Monster\/Threat/i)).toBeInTheDocument();
	});

	it('should populate form with template field definitions', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select Monster/Threat template
		const monsterTemplateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(monsterTemplateButton);

		// Wait for form to render with template data
		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// The form should be populated with Monster/Threat template values
		const displayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
		expect(displayNameInput.value).toBe('Monster/Threat');
	});

	it('should handle different template selections', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		const { rerender } = render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select Condition template
		const conditionTemplateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(conditionTemplateButton);

		// Should show Condition template in form
		await waitFor(() => {
			expect(screen.getByText(/Template: Condition/i)).toBeInTheDocument();
		});

		const displayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
		expect(displayNameInput.value).toBe('Condition');
	});
});

describe('EntityTemplateSelector - Start from Scratch (Issue #209)', () => {
	it('should show form when "Start from Scratch" is clicked', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click "Start from Scratch"
		const scratchButton = screen.getByRole('button', {
			name: /Start from scratch without a template/i
		});
		await fireEvent.click(scratchButton);

		// Should show form
		expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
	});

	it('should show empty form when starting from scratch', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click "Start from Scratch"
		const scratchButton = screen.getByRole('button', {
			name: /Start from scratch without a template/i
		});
		await fireEvent.click(scratchButton);

		// Form should have empty values
		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
			expect(displayNameInput.value).toBe('');
		});
	});

	it('should not show template badge when starting from scratch', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click "Start from Scratch"
		const scratchButton = screen.getByRole('button', {
			name: /Start from scratch without a template/i
		});
		await fireEvent.click(scratchButton);

		// Should not show template badge
		await waitFor(() => {
			expect(screen.queryByText(/Template:/i)).not.toBeInTheDocument();
		});
	});
});

describe('EntityTemplateSelector - Form Submission (Issue #209)', () => {
	it('should call onSubmit with entity data when form is submitted', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(templateButton);

		// Wait for form to appear
		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Submit the form
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should call onSubmit with the entity type data
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					type: expect.any(String),
					label: expect.any(String),
					labelPlural: expect.any(String),
					icon: expect.any(String),
					color: expect.any(String),
					isBuiltIn: false,
					fieldDefinitions: expect.any(Array),
					defaultRelationships: expect.any(Array)
				})
			);
		});
	});

	it('should preserve template field definitions in submitted entity', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select Monster/Threat template which has specific field definitions
		const monsterTemplateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(monsterTemplateButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Submit the form
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Verify field definitions from template are included
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					fieldDefinitions: expect.arrayContaining([
						expect.objectContaining({ key: 'threat_level' }),
						expect.objectContaining({ key: 'role' }),
						expect.objectContaining({ key: 'ac' })
					])
				})
			);
		});
	});

	it('should allow modifying template data before submission', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Modify the display name
		const displayNameInput = screen.getByLabelText(/Display Name/i);
		await fireEvent.input(displayNameInput, { target: { value: 'Custom Condition' } });

		// Submit the form
		const submitButton = screen.getByRole('button', { name: /Create Entity Type/i });
		await fireEvent.click(submitButton);

		// Should submit with modified data
		await waitFor(() => {
			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					label: 'Custom Condition'
				})
			);
		});
	});
});

describe('EntityTemplateSelector - Cancel from Gallery (Issue #209)', () => {
	it('should call onCancel when canceling from gallery', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Look for a cancel/back button in gallery view
		// This might be a back arrow or "Cancel" button
		const cancelButton = screen.getByRole('button', { name: /Cancel|Back/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should not call onSubmit when canceling from gallery', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const cancelButton = screen.getByRole('button', { name: /Cancel|Back/i });
		await fireEvent.click(cancelButton);

		expect(mockOnSubmit).not.toHaveBeenCalled();
		expect(mockOnCancel).toHaveBeenCalled();
	});
});

describe('EntityTemplateSelector - Change Template from Form (Issue #209)', () => {
	it('should show "Change template" button in form when template is selected', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /Change template/i })).toBeInTheDocument();
		});
	});

	it('should not show "Change template" button when starting from scratch', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Click "Start from Scratch"
		const scratchButton = screen.getByRole('button', {
			name: /Start from scratch without a template/i
		});
		await fireEvent.click(scratchButton);

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: /Change template/i })).not.toBeInTheDocument();
		});
	});

	it('should return to gallery when "Change template" is clicked with clean form', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /Change template/i })).toBeInTheDocument();
		});

		// Click "Change template" without modifying the form
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		// Should return to gallery
		await waitFor(() => {
			expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();
		});
	});

	it('should show confirmation dialog when "Change template" is clicked with dirty form', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Ability\/Power template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Modify the form to make it dirty
		const displayNameInput = screen.getByLabelText(/Display Name/i);
		await fireEvent.input(displayNameInput, { target: { value: 'Custom Power' } });

		// Click "Change template"
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		// Should show confirmation dialog
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(
				screen.getByText(/discard your changes|lose your changes|unsaved changes/i)
			).toBeInTheDocument();
		});
	});

	it('should stay on form when user cancels template change confirmation', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template and modify form
		const templateButton = screen.getByRole('button', {
			name: /Use Spell\/Ritual template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Custom Spell' } });
		});

		// Click "Change template" to trigger confirmation
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		// Wait for dialog and click Cancel
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		const cancelDialogButton = within(screen.getByRole('dialog')).getByRole('button', {
			name: /Cancel|Keep editing/i
		});
		await fireEvent.click(cancelDialogButton);

		// Should still be on form, not gallery
		expect(screen.queryByText(/Choose a Template/i)).not.toBeInTheDocument();
		expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
	});

	it('should return to gallery when user confirms template change', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template and modify form
		const templateButton = screen.getByRole('button', {
			name: /Use Negotiation Outcome template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Custom Outcome' } });
		});

		// Click "Change template"
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		// Wait for dialog and click Confirm
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		const confirmDialogButton = within(screen.getByRole('dialog')).getByRole('button', {
			name: /Confirm|Discard|Change template/i
		});
		await fireEvent.click(confirmDialogButton);

		// Should return to gallery
		await waitFor(() => {
			expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();
		});
	});

	it('should reset form data when returning to gallery after template change', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template and modify
		const firstTemplateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(firstTemplateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Modified Monster' } });
		});

		// Change template (clean form for simplicity)
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });

		// First, clear the input to make it clean
		const displayNameInput = screen.getByLabelText(/Display Name/i);
		await fireEvent.input(displayNameInput, { target: { value: 'Monster/Threat' } });

		await fireEvent.click(changeTemplateButton);

		// Back at gallery, select a different template
		await waitFor(() => {
			expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();
		});

		const secondTemplateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(secondTemplateButton);

		// Should show fresh Condition template data, not modified Monster data
		await waitFor(() => {
			const newDisplayNameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
			expect(newDisplayNameInput.value).toBe('Condition');
		});
	});
});

describe('EntityTemplateSelector - Form Dirty State Detection (Issue #209)', () => {
	it('should detect dirty state when display name is modified', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template
		const templateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Custom Monster' } });
		});

		// Try to change template - should show confirmation
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	it('should detect dirty state when description is modified', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		const templateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			// Use the specific form description field (not field definition descriptions)
			const descriptionInput = screen.getByLabelText(/Description \(optional\)/i);
			fireEvent.input(descriptionInput, { target: { value: 'Custom description' } });
		});

		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});
	});

	it('should not show confirmation for clean form', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template but don't modify
		const templateButton = screen.getByRole('button', {
			name: /Use Ability\/Power template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Change template without modifying form
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		// Should go directly to gallery without confirmation
		await waitFor(() => {
			expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();
		});

		// Dialog should not appear
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});

describe('EntityTemplateSelector - Cancel from Form (Issue #209)', () => {
	it('should call onCancel when canceling from form', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select a template
		const templateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});

		// Click Cancel button in form
		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should call onCancel from form without showing template change confirmation', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template and modify form
		const templateButton = screen.getByRole('button', {
			name: /Use Spell\/Ritual template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Custom Spell' } });
		});

		// Click Cancel - should directly call onCancel, not show dialog
		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});

describe('EntityTemplateSelector - State Management (Issue #209)', () => {
	it('should maintain selected template across form modifications', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template
		const templateButton = screen.getByRole('button', {
			name: /Use Negotiation Outcome template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.getByText(/Template: Negotiation Outcome/i)).toBeInTheDocument();
		});

		// Modify form
		const displayNameInput = screen.getByLabelText(/Display Name/i);
		await fireEvent.input(displayNameInput, { target: { value: 'Custom Outcome' } });

		// Template badge should still be visible
		expect(screen.getByText(/Template: Negotiation Outcome/i)).toBeInTheDocument();
	});

	it('should track form mode (gallery vs form)', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Start in gallery mode
		expect(screen.getByText(/Choose a Template/i)).toBeInTheDocument();

		// Switch to form mode
		const templateButton = screen.getByRole('button', {
			name: /Use Condition template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			expect(screen.queryByText(/Choose a Template/i)).not.toBeInTheDocument();
			expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
		});
	});
});

describe('EntityTemplateSelector - Accessibility (Issue #209)', () => {
	it('should have proper focus management when switching views', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template
		const templateButton = screen.getByRole('button', {
			name: /Use Monster\/Threat template/i
		});
		await fireEvent.click(templateButton);

		// Form should be focused or have focusable elements
		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			expect(displayNameInput).toBeInTheDocument();
		});
	});

	it('should maintain keyboard navigation in confirmation dialog', async () => {
		const mockOnSubmit = vi.fn();
		const mockOnCancel = vi.fn();

		render(EntityTemplateSelector, {
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Select template and modify
		const templateButton = screen.getByRole('button', {
			name: /Use Ability\/Power template/i
		});
		await fireEvent.click(templateButton);

		await waitFor(() => {
			const displayNameInput = screen.getByLabelText(/Display Name/i);
			fireEvent.input(displayNameInput, { target: { value: 'Modified' } });
		});

		// Trigger confirmation dialog
		const changeTemplateButton = screen.getByRole('button', { name: /Change template/i });
		await fireEvent.click(changeTemplateButton);

		await waitFor(() => {
			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});
	});
});
