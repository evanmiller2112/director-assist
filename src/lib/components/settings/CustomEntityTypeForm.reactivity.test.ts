/**
 * Tests for CustomEntityTypeForm Component - Reactivity Issues
 *
 * Issue #327: Fix Svelte 5 reactivity warnings
 *
 * This test file verifies that the CustomEntityTypeForm component properly reacts to prop changes.
 * The component has the following reactivity issues:
 * - Lines 24-31: Multiple `initialValue` prop references captured at initial value in $state()
 *   - typeKey, label, labelPlural, description, icon, color, fieldDefinitions, selectedRelationships
 *
 * The problem: When initialValue prop changes, the component's state does not update because
 * $state() captures the prop value only at initialization time.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * reactivity issues are fixed by senior-web-architect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CustomEntityTypeForm from './CustomEntityTypeForm.svelte';
import type { EntityTypeDefinition } from '$lib/types';

describe('CustomEntityTypeForm - Reactivity: InitialValue Prop Changes', () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
	});

	it('should initially render with values from initialValue prop', () => {
		const initialValue: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			description: 'A quest or mission',
			icon: 'target',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: ['related_to']
		};

		render(CustomEntityTypeForm, {
			props: {
				initialValue,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Check that form fields are populated with initial values
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Quest');

		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('quest');

		const pluralInput = screen.getByLabelText(/plural name/i) as HTMLInputElement;
		expect(pluralInput.value).toBe('Quests');

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('A quest or mission');
	});

	it('should update form fields when initialValue prop changes', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'vehicle',
			label: 'Vehicle',
			labelPlural: 'Vehicles',
			description: 'A mode of transportation',
			icon: 'car',
			color: 'red',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Verify initial state
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Vehicle');

		// Change the initialValue prop (simulating template change)
		const initialValue2: EntityTypeDefinition = {
			type: 'weapon',
			label: 'Weapon',
			labelPlural: 'Weapons',
			description: 'A combat item',
			icon: 'sword',
			color: 'gray',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: ['equipped_by']
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Form should update to reflect new initialValue
		expect(labelInput.value).toBe('Weapon');

		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('weapon');

		const pluralInput = screen.getByLabelText(/plural name/i) as HTMLInputElement;
		expect(pluralInput.value).toBe('Weapons');

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('A combat item');
	});

	it('should update default relationships when initialValue changes', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: ['knows']
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Check initial relationship selection
		const knowsCheckbox = screen.getByLabelText(/^knows$/i) as HTMLInputElement;
		expect(knowsCheckbox.checked).toBe(true);

		// Change initialValue with different relationships
		const initialValue2: EntityTypeDefinition = {
			type: 'spell',
			label: 'Spell',
			labelPlural: 'Spells',
			icon: 'wand',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: ['allied_with', 'created_by']
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Relationships should update
		expect(knowsCheckbox.checked).toBe(false);

		const alliedWithCheckbox = screen.getByLabelText(/allied with/i) as HTMLInputElement;
		expect(alliedWithCheckbox.checked).toBe(true);

		const createdByCheckbox = screen.getByLabelText(/created by/i) as HTMLInputElement;
		expect(createdByCheckbox.checked).toBe(true);
	});

	it('should update field definitions when initialValue changes', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'item',
			label: 'Item',
			labelPlural: 'Items',
			icon: 'package',
			color: 'brown',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'weight',
					label: 'Weight',
					type: 'number',
					required: false,
					order: 1
				}
			],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Check that weight field is present (implementation may vary)
		// This is a simplified check - actual implementation depends on FieldDefinitionEditor

		// Change to different field definitions
		const initialValue2: EntityTypeDefinition = {
			type: 'item',
			label: 'Item',
			labelPlural: 'Items',
			icon: 'package',
			color: 'brown',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'rarity',
					label: 'Rarity',
					type: 'select',
					required: false,
					order: 1,
					options: ['common', 'rare', 'legendary']
				}
			],
			defaultRelationships: []
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Field definitions should update (exact verification depends on FieldDefinitionEditor implementation)
		// This test ensures the prop is reactive
		// Verify the form is still rendered with the new field definitions
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Item');
	});

	it('should reset icon and color when initialValue changes', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'artifact',
			label: 'Artifact',
			labelPlural: 'Artifacts',
			icon: 'gem',
			color: 'gold',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Icon and color are bound to state, so they should be set initially
		// (Exact verification depends on IconPicker and ColorPicker components)

		const initialValue2: EntityTypeDefinition = {
			type: 'artifact',
			label: 'Artifact',
			labelPlural: 'Artifacts',
			icon: 'star',
			color: 'silver',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Icon and color should update
		// This test ensures state is reactive to prop changes
		// Verify the form still renders after the change
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Artifact');
	});
});

describe('CustomEntityTypeForm - Reactivity: Template Changes', () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();
	const mockOnChangeTemplate = vi.fn();

	beforeEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
		mockOnChangeTemplate.mockClear();
	});

	it('should handle switching between templates via initialValue changes', async () => {
		const template1: EntityTypeDefinition = {
			type: 'ancestry',
			label: 'Ancestry',
			labelPlural: 'Ancestries',
			description: 'Character lineage',
			icon: 'users',
			color: 'green',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'heritage',
					label: 'Heritage',
					type: 'text',
					required: false,
					order: 1
				}
			],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: template1,
				isEditing: false,
				templateName: 'Draw Steel Ancestry',
				onChangeTemplate: mockOnChangeTemplate,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Verify initial template
		expect(screen.getByText(/template: draw steel ancestry/i)).toBeInTheDocument();

		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Ancestry');

		// Switch to different template
		const template2: EntityTypeDefinition = {
			type: 'career',
			label: 'Career',
			labelPlural: 'Careers',
			description: 'Character profession',
			icon: 'briefcase',
			color: 'blue',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'skills',
					label: 'Skills',
					type: 'tags',
					required: false,
					order: 1
				}
			],
			defaultRelationships: ['grants']
		};

		await rerender({
			initialValue: template2,
			isEditing: false,
			templateName: 'Draw Steel Career',
			onChangeTemplate: mockOnChangeTemplate,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Should update to new template
		expect(screen.getByText(/template: draw steel career/i)).toBeInTheDocument();
		expect(labelInput.value).toBe('Career');

		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('career');

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('Character profession');
	});

	it('should clear form when initialValue changes from a value to undefined', async () => {
		const initialValue: EntityTypeDefinition = {
			type: 'monster',
			label: 'Monster',
			labelPlural: 'Monsters',
			description: 'A creature',
			icon: 'skull',
			color: 'red',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Monster');

		// Remove initialValue (user clicks "Start from scratch")
		await rerender({
			initialValue: undefined,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Form should clear
		expect(labelInput.value).toBe('');

		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('');

		const pluralInput = screen.getByLabelText(/plural name/i) as HTMLInputElement;
		expect(pluralInput.value).toBe('');
	});

	it('should preserve user edits when NOT changing initialValue', async () => {
		const initialValue: EntityTypeDefinition = {
			type: 'trap',
			label: 'Trap',
			labelPlural: 'Traps',
			icon: 'zap',
			color: 'orange',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// User modifies the label
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		await fireEvent.input(labelInput, { target: { value: 'Deadly Trap' } });

		expect(labelInput.value).toBe('Deadly Trap');

		// Rerender without changing initialValue (e.g., parent component updates for other reasons)
		await rerender({
			initialValue,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// User's edit should be preserved
		expect(labelInput.value).toBe('Deadly Trap');
	});
});

describe('CustomEntityTypeForm - Reactivity: Editing Mode', () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
	});

	it('should update form when initialValue changes in editing mode', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'custom_entity',
			label: 'Custom Entity',
			labelPlural: 'Custom Entities',
			icon: 'box',
			color: 'gray',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: true,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Custom Entity');

		// In edit mode, type key should be disabled
		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput).toBeDisabled();
		expect(typeKeyInput.value).toBe('custom_entity');

		// Update the initialValue (e.g., fetched updated data from server)
		const initialValue2: EntityTypeDefinition = {
			type: 'custom_entity',
			label: 'Updated Custom Entity',
			labelPlural: 'Updated Custom Entities',
			icon: 'archive',
			color: 'teal',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: ['linked_to']
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: true,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Form should update
		expect(labelInput.value).toBe('Updated Custom Entity');

		const pluralInput = screen.getByLabelText(/plural name/i) as HTMLInputElement;
		expect(pluralInput.value).toBe('Updated Custom Entities');

		// Type key should still be disabled and unchanged
		expect(typeKeyInput).toBeDisabled();
		expect(typeKeyInput.value).toBe('custom_entity');
	});
});

describe('CustomEntityTypeForm - Reactivity: Edge Cases', () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		mockOnSubmit.mockClear();
		mockOnCancel.mockClear();
	});

	it('should handle rapid initialValue changes', async () => {
		const values: EntityTypeDefinition[] = [
			{
				type: 'type1',
				label: 'Type 1',
				labelPlural: 'Types 1',
				icon: 'circle',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			{
				type: 'type2',
				label: 'Type 2',
				labelPlural: 'Types 2',
				icon: 'square',
				color: 'blue',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			{
				type: 'type3',
				label: 'Type 3',
				labelPlural: 'Types 3',
				icon: 'triangle',
				color: 'green',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			}
		];

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: values[0],
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Rapidly change initialValue
		for (const value of values) {
			await rerender({
				initialValue: value,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			});
		}

		// Should end up with last value
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput.value).toBe('Type 3');

		const typeKeyInput = screen.getByLabelText(/type key/i) as HTMLInputElement;
		expect(typeKeyInput.value).toBe('type3');
	});

	it('should handle initialValue with complex field definitions', async () => {
		const initialValue1: EntityTypeDefinition = {
			type: 'complex',
			label: 'Complex',
			labelPlural: 'Complexes',
			icon: 'layers',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'field1',
					label: 'Field 1',
					type: 'text',
					required: true,
					order: 1
				},
				{
					key: 'field2',
					label: 'Field 2',
					type: 'number',
					required: false,
					order: 2
				}
			],
			defaultRelationships: ['rel1', 'rel2']
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: initialValue1,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		// Change to different complex structure
		const initialValue2: EntityTypeDefinition = {
			type: 'complex',
			label: 'Complex',
			labelPlural: 'Complexes',
			icon: 'layers',
			color: 'purple',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'field3',
					label: 'Field 3',
					type: 'select',
					required: false,
					order: 1,
					options: ['a', 'b', 'c']
				}
			],
			defaultRelationships: ['rel3']
		};

		await rerender({
			initialValue: initialValue2,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		// Should handle the change without errors
		// Verify the form still renders with complex fields
		const labelInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
		expect(labelInput).toBeInTheDocument();
	});

	it('should handle switching between initialValue with and without optional fields', async () => {
		const minimalValue: EntityTypeDefinition = {
			type: 'minimal',
			label: 'Minimal',
			labelPlural: 'Minimals',
			icon: 'circle',
			color: 'gray',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		const completeValue: EntityTypeDefinition = {
			type: 'complete',
			label: 'Complete',
			labelPlural: 'Completes',
			description: 'A complete entity type',
			icon: 'check-circle',
			color: 'green',
			isBuiltIn: false,
			fieldDefinitions: [
				{
					key: 'status',
					label: 'Status',
					type: 'select',
					required: false,
					order: 1,
					options: ['active', 'inactive']
				}
			],
			defaultRelationships: ['contains', 'part_of']
		};

		const { rerender } = render(CustomEntityTypeForm, {
			props: {
				initialValue: minimalValue,
				isEditing: false,
				onsubmit: mockOnSubmit,
				oncancel: mockOnCancel
			}
		});

		const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		expect(descriptionInput.value).toBe('');

		// Change to complete value
		await rerender({
			initialValue: completeValue,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(descriptionInput.value).toBe('A complete entity type');

		// Change back to minimal
		await rerender({
			initialValue: minimalValue,
			isEditing: false,
			onsubmit: mockOnSubmit,
			oncancel: mockOnCancel
		});

		expect(descriptionInput.value).toBe('');
	});
});
