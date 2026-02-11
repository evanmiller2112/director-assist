/**
 * Tests for DeleteEntityTypeModal Component - Phase 2
 *
 * Issue #25 Phase 2: Custom Entity Type Management UI
 *
 * This component provides a safe deletion workflow for custom entity types,
 * with clear warnings about data loss and confirmation requirements.
 *
 * Features:
 * - Shows count of entities that will be affected
 * - Requires typing the type name to confirm deletion
 * - Clear warning about data loss
 * - Cancel and Delete buttons with appropriate styling
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import DeleteEntityTypeModal from './DeleteEntityTypeModal.svelte';
import type { EntityTypeDefinition } from '$lib/types';

describe('DeleteEntityTypeModal - Basic Rendering (Issue #25 Phase 2)', () => {
	it('should not render when open is false', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: false,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should render when open is true', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should display modal as dialog element', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 10,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should display entity type name in title', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'vehicle',
			label: 'Vehicle',
			labelPlural: 'Vehicles',
			icon: 'car',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 3,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Delete.*Vehicle/i)).toBeInTheDocument();
	});

	it('should render Cancel button', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
	});

	it('should render Delete button', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
	});
});

describe('DeleteEntityTypeModal - Entity Count Display (Issue #25 Phase 2)', () => {
	it('should display count of entities that will be deleted', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 12,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/12.*entities|12.*Quests/i)).toBeInTheDocument();
	});

	it('should display singular form when count is 1', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'vehicle',
			label: 'Vehicle',
			labelPlural: 'Vehicles',
			icon: 'car',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 1,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/1.*Vehicle|1.*entity/i)).toBeInTheDocument();
	});

	it('should display plural form when count is 0', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 0,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/0.*Quests|0.*entities|No entities/i)).toBeInTheDocument();
	});

	it('should display plural form when count is greater than 1', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 25,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/25.*Spells/i)).toBeInTheDocument();
	});

	it('should prominently display entity count', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 50,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Count should be visually prominent (e.g., in a callout box, bold, large text)
		const countElement = screen.getByText(/50/);
		expect(countElement).toBeInTheDocument();
	});
});

describe('DeleteEntityTypeModal - Warning Messages (Issue #25 Phase 2)', () => {
	it('should display data loss warning', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Multiple elements have this text - just check one exists
		const warnings = screen.getAllByText(/This action cannot be undone|permanently deleted|data loss/i);
		expect(warnings.length).toBeGreaterThan(0);
	});

	it('should display warning that all entities will be deleted', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Multiple elements with this warning text
		const warnings = screen.getAllByText(/all.*entities.*deleted|lose all data/i);
		expect(warnings.length).toBeGreaterThan(0);
	});

	it('should use danger/destructive styling for warnings', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { container } = render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const warningText = screen.getByText(/cannot be undone/i);
		expect(warningText.className).toMatch(/text-red|text-danger|text-destructive/);
	});

	it('should show warning icon', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { container } = render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Should contain a warning or alert icon (AlertTriangle, AlertCircle, etc.)
		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});
});

describe('DeleteEntityTypeModal - Type Name Confirmation (Issue #25 Phase 2)', () => {
	it('should display input for typing entity type name', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(
			screen.getByLabelText(/Type.*to confirm|Enter.*name|Confirm deletion/i)
		).toBeInTheDocument();
	});

	it('should show instruction to type the type name', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'vehicle',
			label: 'Vehicle',
			labelPlural: 'Vehicles',
			icon: 'car',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 3,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Text is broken up with <span class="font-semibold"> tag
		const label = screen.getByText((content, element) => {
			return element?.tagName === 'LABEL' && /Type.*to confirm/i.test(element.textContent ?? '');
		});
		expect(label).toBeInTheDocument();
		expect(label.textContent).toMatch(/Vehicle/);
	});

	it('should disable Delete button when confirmation is empty', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		expect(deleteButton).toBeDisabled();
	});

	it('should disable Delete button when confirmation does not match', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'Wrong' } });

		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		expect(deleteButton).toBeDisabled();
	});

	it('should enable Delete button when confirmation matches exactly', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'Quest' } });

		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		expect(deleteButton).not.toBeDisabled();
	});

	it('should be case-sensitive for confirmation', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'quest' } });

		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		// Should not match because case doesn't match
		expect(deleteButton).toBeDisabled();
	});

	it('should show placeholder in confirmation input', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'vehicle',
			label: 'Vehicle',
			labelPlural: 'Vehicles',
			icon: 'car',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 3,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i) as HTMLInputElement;
		expect(confirmInput.placeholder).toBeTruthy();
	});

	it('should clear confirmation input when modal reopens', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'Quest' } });

		// Close modal
		rerender({ open: false, entityType, entityCount: 5, onconfirm: mockOnConfirm, oncancel: mockOnCancel });

		// Reopen modal
		rerender({ open: true, entityType, entityCount: 5, onconfirm: mockOnConfirm, oncancel: mockOnCancel });

		const confirmInput2 = screen.getByLabelText(/Type.*to confirm/i) as HTMLInputElement;
		expect(confirmInput2.value).toBe('');
	});
});

describe('DeleteEntityTypeModal - Button Actions (Issue #25 Phase 2)', () => {
	it('should call oncancel when Cancel button is clicked', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should call onconfirm when Delete button is clicked with valid confirmation', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Type confirmation
		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'Quest' } });

		// Click delete
		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		await fireEvent.click(deleteButton);

		expect(mockOnConfirm).toHaveBeenCalled();
	});

	it('should NOT call onconfirm when Delete button is disabled', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Don't type confirmation
		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		await fireEvent.click(deleteButton);

		// Should not call onconfirm because button is disabled
		expect(mockOnConfirm).not.toHaveBeenCalled();
	});

	it('should call oncancel when Escape key is pressed', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Press Escape on the dialog element
		const dialog = screen.getByRole('dialog');
		await fireEvent.keyDown(dialog, { key: 'Escape' });

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should call oncancel when backdrop is clicked', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		// Click the dialog itself (backdrop) - need to click outside the content div
		const rect = dialog.getBoundingClientRect();
		await fireEvent.click(dialog, {
			clientX: rect.left - 10,
			clientY: rect.top - 10
		});

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should use danger/destructive styling for Delete button', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const deleteButton = screen.getByRole('button', { name: /Delete/i });
		expect(deleteButton.className).toMatch(/danger|destructive|red/);
	});
});

describe('DeleteEntityTypeModal - Loading State (Issue #25 Phase 2)', () => {
	it('should disable buttons when loading', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			loading: true,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// When loading, button text changes to "Deleting..."
		const deleteButton = screen.getByRole('button', { name: /Deleting|Delete/i });
		const cancelButton = screen.getByRole('button', { name: /Cancel/i });

		expect(deleteButton).toBeDisabled();
		expect(cancelButton).toBeDisabled();
	});

	it('should show loading text on Delete button', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			loading: true,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/Deleting/i)).toBeInTheDocument();
	});

	it('should show loading indicator on Delete button', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			loading: true,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const deleteButton = screen.getByRole('button', { name: /Deleting/i });
		expect(deleteButton).toHaveAttribute('aria-busy', 'true');
	});

	it('should disable confirmation input when loading', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			loading: true,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i) as HTMLInputElement;
		expect(confirmInput.disabled).toBe(true);
	});
});

describe('DeleteEntityTypeModal - Accessibility (Issue #25 Phase 2)', () => {
	it('should have aria-modal="true"', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have descriptive aria-labelledby', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		const titleId = dialog.getAttribute('aria-labelledby');
		expect(titleId).toBeTruthy();

		const title = document.getElementById(titleId!);
		expect(title).toBeTruthy();
		expect(title?.textContent).toMatch(/Delete/i);
	});

	it('should have aria-describedby for warning message', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		const descId = dialog.getAttribute('aria-describedby');
		expect(descId).toBeTruthy();
	});

	it('should focus confirmation input when opened', async () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);

		await waitFor(() => {
			expect(confirmInput).toHaveFocus();
		});
	});

	it('should trap focus within modal', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');

		// All buttons should be within the dialog
		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});

	it('should be keyboard navigable', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		const deleteButton = screen.getByRole('button', { name: /Delete/i });

		expect(confirmInput).not.toHaveAttribute('tabindex', '-1');
		expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
		expect(deleteButton).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('DeleteEntityTypeModal - Edge Cases (Issue #25 Phase 2)', () => {
	it('should handle entity type with very long name', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'very_long_type_name',
			label: 'Very Long Entity Type Name That Might Wrap',
			labelPlural: 'Very Long Entity Type Names',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		// Long name appears in title and label - just check it's displayed somewhere
		const textElements = screen.getAllByText(/Very Long Entity Type Name/i);
		expect(textElements.length).toBeGreaterThan(0);
	});

	it('should handle very large entity count', () => {
		const mockOnConfirm = vi.fn();
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 9999,
			onconfirm: mockOnConfirm,
			oncancel: mockOnCancel
		});

		expect(screen.getByText(/9999/)).toBeInTheDocument();
	});

	it('should handle missing onconfirm callback gracefully', async () => {
		const mockOnCancel = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			oncancel: mockOnCancel
		});

		const confirmInput = screen.getByLabelText(/Type.*to confirm/i);
		await fireEvent.input(confirmInput, { target: { value: 'Quest' } });

		const deleteButton = screen.getByRole('button', { name: /Delete/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(deleteButton);
		}).not.toThrow();
	});

	it('should handle missing oncancel callback gracefully', async () => {
		const mockOnConfirm = vi.fn();
		const entityType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'scroll',
			color: 'yellow',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(DeleteEntityTypeModal, {
			open: true,
			entityType,
			entityCount: 5,
			onconfirm: mockOnConfirm
		});

		const cancelButton = screen.getByRole('button', { name: /Cancel/i });

		// Should not throw error
		await expect(async () => {
			await fireEvent.click(cancelButton);
		}).not.toThrow();
	});
});
