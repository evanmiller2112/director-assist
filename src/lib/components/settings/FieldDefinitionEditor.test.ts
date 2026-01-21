/**
 * Tests for FieldDefinitionEditor Component Enhancements - Phase 2
 *
 * Issue #25 Phase 2: Custom Entity Type Management UI
 *
 * This test suite covers the enhancements to FieldDefinitionEditor:
 * - Entity type selection for entity-ref and entity-refs fields (allowedEntityTypes)
 * - Computed field configuration (formula builder, dependencies, output type)
 * - Multi-select options editor improvements
 * - Field preview mode
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
import type { FieldDefinition } from '$lib/types';

describe('FieldDefinitionEditor - Entity Reference Type Selection (Issue #25 Phase 2)', () => {
	describe('Entity-ref field type - allowedEntityTypes selection', () => {
		it('should show entity type selector when field type is "entity-ref"', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'owner',
					label: 'Owner',
					type: 'entity-ref',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			// Expand the field
			const fieldHeader = screen.getByText('Owner');
			await fireEvent.click(fieldHeader);

			// Should show entity type selector
			const entityTypeLabel = screen.getByText(/Allowed Entity Types/i);
			expect(entityTypeLabel).toBeInTheDocument();
		});

		it('should NOT show entity type selector for non-entity-ref fields', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'name',
					label: 'Name',
					type: 'text',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			// Expand the field
			const fieldHeader = screen.getByText('Name');
			await fireEvent.click(fieldHeader);

			// Should NOT show entity type selector
			const entityTypeLabel = screen.queryByText(/Allowed Entity Types/i);
			expect(entityTypeLabel).not.toBeInTheDocument();
		});

		it('should display checkboxes for each available entity type', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'location_ref',
					label: 'Location',
					type: 'entity-ref',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Location');
			await fireEvent.click(fieldHeader);

			// Should show checkboxes for built-in entity types
			expect(screen.getByLabelText(/character/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/npc/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/faction/i)).toBeInTheDocument();
		});

		it('should allow selecting multiple entity types', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'related_entity',
					label: 'Related Entity',
					type: 'entity-ref',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Related Entity');
			await fireEvent.click(fieldHeader);

			// Select multiple entity types
			const characterCheckbox = screen.getByLabelText(/character/i);
			const npcCheckbox = screen.getByLabelText(/npc/i);

			await fireEvent.click(characterCheckbox);
			await fireEvent.click(npcCheckbox);

			// Should call onchange with entityTypes array
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].entityTypes).toContain('character');
			expect(updatedFields[0].entityTypes).toContain('npc');
		});

		it('should allow deselecting entity types', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'owner',
					label: 'Owner',
					type: 'entity-ref',
					required: false,
					order: 1,
					entityTypes: ['character', 'npc']
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Owner');
			await fireEvent.click(fieldHeader);

			// Deselect 'character'
			const characterCheckbox = screen.getByLabelText(/character/i) as HTMLInputElement;
			expect(characterCheckbox.checked).toBe(true);

			await fireEvent.click(characterCheckbox);

			// Should update entityTypes
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].entityTypes).not.toContain('character');
			expect(updatedFields[0].entityTypes).toContain('npc');
		});

		it('should show "All Types" option to allow any entity type', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'ref',
					label: 'Reference',
					type: 'entity-ref',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Reference');
			await fireEvent.click(fieldHeader);

			// Should have "All Types" option
			expect(screen.getByLabelText(/All Types/i)).toBeInTheDocument();
		});

		it('should clear specific type selections when "All Types" is selected', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'ref',
					label: 'Reference',
					type: 'entity-ref',
					required: false,
					order: 1,
					entityTypes: ['character', 'npc']
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Reference');
			await fireEvent.click(fieldHeader);

			// Click "All Types"
			const allTypesCheckbox = screen.getByLabelText(/All Types/i);
			await fireEvent.click(allTypesCheckbox);

			// Should clear entityTypes or set to undefined
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].entityTypes).toBeUndefined();
		});

		it('should persist entityTypes when field is collapsed and re-expanded', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'ref',
					label: 'Reference',
					type: 'entity-ref',
					required: false,
					order: 1,
					entityTypes: ['character', 'location']
				}
			];

			render(FieldDefinitionEditor, { fields });

			// Expand field
			const fieldHeader = screen.getByText('Reference');
			await fireEvent.click(fieldHeader);

			// Check that selections are shown
			const characterCheckbox = screen.getByLabelText(/character/i) as HTMLInputElement;
			const locationCheckbox = screen.getByLabelText(/location/i) as HTMLInputElement;
			expect(characterCheckbox.checked).toBe(true);
			expect(locationCheckbox.checked).toBe(true);

			// Collapse
			await fireEvent.click(fieldHeader);

			// Re-expand
			await fireEvent.click(fieldHeader);

			// Should still show selections
			const characterCheckbox2 = screen.getByLabelText(/character/i) as HTMLInputElement;
			expect(characterCheckbox2.checked).toBe(true);
		});
	});

	describe('Entity-refs field type - allowedEntityTypes selection', () => {
		it('should show entity type selector when field type is "entity-refs"', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'members',
					label: 'Members',
					type: 'entity-refs',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Members');
			await fireEvent.click(fieldHeader);

			// Should show entity type selector
			const entityTypeLabel = screen.getByText(/Allowed Entity Types/i);
			expect(entityTypeLabel).toBeInTheDocument();
		});

		it('should work identically to entity-ref for entity type selection', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'allies',
					label: 'Allies',
					type: 'entity-refs',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Allies');
			await fireEvent.click(fieldHeader);

			// Select entity types
			const characterCheckbox = screen.getByLabelText(/character/i);
			const npcCheckbox = screen.getByLabelText(/npc/i);

			await fireEvent.click(characterCheckbox);
			await fireEvent.click(npcCheckbox);

			// Should update entityTypes
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].entityTypes).toContain('character');
			expect(updatedFields[0].entityTypes).toContain('npc');
		});
	});

	describe('Entity type selector - custom entity types', () => {
		it('should include custom entity types in the selection list', async () => {
			// This test assumes custom entity types are passed as a prop or loaded from context
			const fields: FieldDefinition[] = [
				{
					key: 'spell_ref',
					label: 'Spell Reference',
					type: 'entity-ref',
					required: false,
					order: 1
				}
			];

			// TODO: Need to determine how custom entity types are passed to the component
			// For now, this test documents the expected behavior
			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Spell Reference');
			await fireEvent.click(fieldHeader);

			// Should show custom entity types alongside built-in ones
			// expect(screen.getByLabelText(/spell/i)).toBeInTheDocument();
			// expect(screen.getByLabelText(/vehicle/i)).toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Computed Field Configuration (Issue #25 Phase 2)', () => {
	describe('Computed field type - formula editor', () => {
		it('should show computed field editor when type is "computed"', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'total',
					label: 'Total',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Total');
			await fireEvent.click(fieldHeader);

			// Should show formula input
			expect(screen.getByLabelText(/Formula/i)).toBeInTheDocument();
		});

		it('should NOT show computed field editor for non-computed fields', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'name',
					label: 'Name',
					type: 'text',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Name');
			await fireEvent.click(fieldHeader);

			// Should NOT show formula input
			expect(screen.queryByLabelText(/Formula/i)).not.toBeInTheDocument();
		});

		it('should display formula input field', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'hp_max',
					label: 'Max HP',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Max HP');
			await fireEvent.click(fieldHeader);

			const formulaInput = screen.getByLabelText(/Formula/i) as HTMLInputElement;
			expect(formulaInput.tagName).toBe('INPUT');
		});

		it('should show output type selector (text/number/boolean)', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'result',
					label: 'Result',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Result');
			await fireEvent.click(fieldHeader);

			// Should have output type selector
			expect(screen.getByLabelText(/Output Type/i)).toBeInTheDocument();

			// Should have options for text, number, boolean
			const select = screen.getByLabelText(/Output Type/i) as HTMLSelectElement;
			const options = Array.from(select.options).map((o) => o.value);
			expect(options).toContain('text');
			expect(options).toContain('number');
			expect(options).toContain('boolean');
		});

		it('should show available fields picker for formula building', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'strength',
					label: 'Strength',
					type: 'number',
					required: false,
					order: 1
				},
				{
					key: 'modifier',
					label: 'Strength Modifier',
					type: 'computed',
					required: false,
					order: 2
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Strength Modifier');
			await fireEvent.click(fieldHeader);

			// Should show available fields
			expect(screen.getByText(/Available Fields/i)).toBeInTheDocument();
			expect(screen.getByText(/strength/i)).toBeInTheDocument();
		});

		it('should insert field placeholder when available field is clicked', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'base_damage',
					label: 'Base Damage',
					type: 'number',
					required: false,
					order: 1
				},
				{
					key: 'total_damage',
					label: 'Total Damage',
					type: 'computed',
					required: false,
					order: 2
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Total Damage');
			await fireEvent.click(fieldHeader);

			// Click on available field to insert
			const baseDamageButton = screen.getByText('base_damage');
			await fireEvent.click(baseDamageButton);

			// Should insert {base_damage} into formula
			const formulaInput = screen.getByLabelText(/Formula/i) as HTMLInputElement;
			expect(formulaInput.value).toContain('{base_damage}');
		});

		it('should update computedConfig when formula is entered', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'calc',
					label: 'Calculation',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Calculation');
			await fireEvent.click(fieldHeader);

			const formulaInput = screen.getByLabelText(/Formula/i);
			await fireEvent.input(formulaInput, { target: { value: '{field1} + {field2}' } });

			// Should call onchange with updated computedConfig
			expect(mockOnChange).toHaveBeenCalled();
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].computedConfig).toBeDefined();
			expect(updatedFields[0].computedConfig?.formula).toBe('{field1} + {field2}');
		});

		it('should auto-detect dependencies from formula', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'result',
					label: 'Result',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Result');
			await fireEvent.click(fieldHeader);

			const formulaInput = screen.getByLabelText(/Formula/i);
			await fireEvent.input(formulaInput, {
				target: { value: '{strength} + {constitution} * 2' }
			});

			// Should auto-detect dependencies
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].computedConfig?.dependencies).toContain('strength');
			expect(updatedFields[0].computedConfig?.dependencies).toContain('constitution');
		});

		it('should update computedConfig when output type is changed', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'value',
					label: 'Value',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Value');
			await fireEvent.click(fieldHeader);

			const outputTypeSelect = screen.getByLabelText(/Output Type/i);
			await fireEvent.change(outputTypeSelect, { target: { value: 'number' } });

			// Should update computedConfig.outputType
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].computedConfig?.outputType).toBe('number');
		});

		it('should validate formula syntax and show errors', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'bad_formula',
					label: 'Bad Formula',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Bad Formula');
			await fireEvent.click(fieldHeader);

			const formulaInput = screen.getByLabelText(/Formula/i);
			await fireEvent.input(formulaInput, { target: { value: '{invalid syntax ++' } });

			// Should show validation error
			expect(screen.getByText(/Invalid formula syntax/i)).toBeInTheDocument();
		});

		it('should show preview of computed result if possible', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'value1',
					label: 'Value 1',
					type: 'number',
					required: false,
					order: 1
				},
				{
					key: 'sum',
					label: 'Sum',
					type: 'computed',
					required: false,
					order: 2,
					computedConfig: {
						formula: '{value1} + 10',
						dependencies: ['value1'],
						outputType: 'number'
					}
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Sum');
			await fireEvent.click(fieldHeader);

			// Should show preview section
			expect(screen.getByText(/Preview/i)).toBeInTheDocument();
		});

		it('should display help text about formula syntax', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'formula_field',
					label: 'Formula Field',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Formula Field');
			await fireEvent.click(fieldHeader);

			// Should show help text
			expect(
				screen.getByText(/Use \{fieldName\} to reference other fields/i)
			).toBeInTheDocument();
		});
	});

	describe('Computed field - using ComputedFieldEditor component', () => {
		it('should delegate to ComputedFieldEditor component for complex editing', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'complex_calc',
					label: 'Complex Calculation',
					type: 'computed',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Complex Calculation');
			await fireEvent.click(fieldHeader);

			// Should render ComputedFieldEditor component (identifiable by specific features)
			// This is more of an integration point - the component should be present
			expect(screen.getByLabelText(/Formula/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Output Type/i)).toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Multi-Select Options Editor Improvements (Issue #25 Phase 2)', () => {
	describe('Options editor for select and multi-select fields', () => {
		it('should show improved options editor for select field', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'category',
					label: 'Category',
					type: 'select',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Category');
			await fireEvent.click(fieldHeader);

			// Should show options editor
			expect(screen.getByLabelText(/Options \(one per line\)/i)).toBeInTheDocument();
		});

		it('should show improved options editor for multi-select field', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'tags',
					label: 'Tags',
					type: 'multi-select',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Tags');
			await fireEvent.click(fieldHeader);

			// Should show options editor
			expect(screen.getByLabelText(/Options \(one per line\)/i)).toBeInTheDocument();
		});

		it('should display current options in textarea, one per line', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'skills',
					label: 'Skills',
					type: 'multi-select',
					required: false,
					order: 1,
					options: ['Stealth', 'Combat', 'Magic']
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Skills');
			await fireEvent.click(fieldHeader);

			const optionsTextarea = screen.getByLabelText(/Options \(one per line\)/i) as HTMLTextAreaElement;
			expect(optionsTextarea.value).toBe('Stealth\nCombat\nMagic');
		});

		it('should update options array when textarea is edited', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'priorities',
					label: 'Priorities',
					type: 'select',
					required: false,
					order: 1,
					options: ['High', 'Medium', 'Low']
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Priorities');
			await fireEvent.click(fieldHeader);

			const optionsTextarea = screen.getByLabelText(/Options \(one per line\)/i);
			await fireEvent.input(optionsTextarea, {
				target: { value: 'Critical\nHigh\nMedium\nLow' }
			});

			// Should update options array
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].options).toEqual(['Critical', 'High', 'Medium', 'Low']);
		});

		it('should trim whitespace from each option', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'choices',
					label: 'Choices',
					type: 'select',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Choices');
			await fireEvent.click(fieldHeader);

			const optionsTextarea = screen.getByLabelText(/Options \(one per line\)/i);
			await fireEvent.input(optionsTextarea, {
				target: { value: '  Option 1  \n  Option 2\nOption 3   ' }
			});

			// Should trim whitespace
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].options).toEqual(['Option 1', 'Option 2', 'Option 3']);
		});

		it('should filter out empty lines', async () => {
			const mockOnChange = vi.fn();
			const fields: FieldDefinition[] = [
				{
					key: 'items',
					label: 'Items',
					type: 'multi-select',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

			const fieldHeader = screen.getByText('Items');
			await fireEvent.click(fieldHeader);

			const optionsTextarea = screen.getByLabelText(/Options \(one per line\)/i);
			await fireEvent.input(optionsTextarea, {
				target: { value: 'Item 1\n\n\nItem 2\n\nItem 3' }
			});

			// Should filter empty lines
			const updatedFields = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
			expect(updatedFields[0].options).toEqual(['Item 1', 'Item 2', 'Item 3']);
		});

		it('should show placeholder text for empty options textarea', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'new_select',
					label: 'New Select',
					type: 'select',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('New Select');
			await fireEvent.click(fieldHeader);

			const optionsTextarea = screen.getByLabelText(/Options \(one per line\)/i) as HTMLTextAreaElement;
			expect(optionsTextarea.placeholder).toContain('Option 1');
		});

		it('should show count of options', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'categories',
					label: 'Categories',
					type: 'select',
					required: false,
					order: 1,
					options: ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4']
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Categories');
			await fireEvent.click(fieldHeader);

			// Should show count somewhere (e.g., "4 options")
			expect(screen.getByText(/4 options/i)).toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Field Preview Mode (Issue #25 Phase 2)', () => {
	describe('Field preview functionality', () => {
		it('should show preview button for each field', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'test_field',
					label: 'Test Field',
					type: 'text',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Test Field');
			await fireEvent.click(fieldHeader);

			// Should show preview button/toggle
			expect(screen.getByText(/Preview/i)).toBeInTheDocument();
		});

		it('should show preview of text field when preview is toggled', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'name',
					label: 'Character Name',
					type: 'text',
					required: true,
					placeholder: 'Enter name',
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Character Name');
			await fireEvent.click(fieldHeader);

			// Toggle preview
			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show preview of the field as it would appear in a form
			expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
		});

		it('should show preview of select field with options', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'class',
					label: 'Character Class',
					type: 'select',
					required: false,
					order: 1,
					options: ['Warrior', 'Mage', 'Rogue']
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Character Class');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show select dropdown with options
			const selectElement = screen.getByRole('combobox');
			expect(selectElement).toBeInTheDocument();

			// Should have the options
			const options = screen.getAllByRole('option');
			expect(options.length).toBeGreaterThanOrEqual(3);
		});

		it('should show preview of boolean field as checkbox', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'active',
					label: 'Is Active',
					type: 'boolean',
					required: false,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Is Active');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show checkbox
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toBeInTheDocument();
		});

		it('should show preview of number field', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'level',
					label: 'Level',
					type: 'number',
					required: false,
					order: 1,
					placeholder: 'Enter level'
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Level');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show number input
			const numberInput = screen.getByPlaceholderText('Enter level') as HTMLInputElement;
			expect(numberInput.type).toBe('number');
		});

		it('should show required indicator in preview if field is required', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'required_field',
					label: 'Required Field',
					type: 'text',
					required: true,
					order: 1
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Required Field');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show asterisk or "required" indicator
			expect(screen.getByText(/\*/)).toBeInTheDocument();
		});

		it('should show help text in preview if provided', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'description',
					label: 'Description',
					type: 'textarea',
					required: false,
					order: 1,
					helpText: 'Enter a brief description'
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Description');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);
			await fireEvent.click(previewButton);

			// Should show help text
			expect(screen.getByText('Enter a brief description')).toBeInTheDocument();
		});

		it('should hide preview when preview is toggled off', async () => {
			const fields: FieldDefinition[] = [
				{
					key: 'test',
					label: 'Test',
					type: 'text',
					required: false,
					order: 1,
					placeholder: 'Test placeholder'
				}
			];

			render(FieldDefinitionEditor, { fields });

			const fieldHeader = screen.getByText('Test');
			await fireEvent.click(fieldHeader);

			const previewButton = screen.getByText(/Preview/i);

			// Toggle on
			await fireEvent.click(previewButton);
			expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();

			// Toggle off
			await fireEvent.click(previewButton);
			expect(screen.queryByPlaceholderText('Test placeholder')).not.toBeInTheDocument();
		});
	});
});

describe('FieldDefinitionEditor - Integration Tests (Issue #25 Phase 2)', () => {
	it('should support all Phase 2 enhancements together', async () => {
		const mockOnChange = vi.fn();
		const fields: FieldDefinition[] = [
			{
				key: 'owner',
				label: 'Owner',
				type: 'entity-ref',
				required: false,
				order: 1
			},
			{
				key: 'hp',
				label: 'Hit Points',
				type: 'number',
				required: false,
				order: 2
			},
			{
				key: 'max_hp',
				label: 'Max HP',
				type: 'computed',
				required: false,
				order: 3
			}
		];

		render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

		// Test entity-ref field
		const ownerHeader = screen.getByText('Owner');
		await fireEvent.click(ownerHeader);
		expect(screen.getByText(/Allowed Entity Types/i)).toBeInTheDocument();

		// Collapse and test computed field
		await fireEvent.click(ownerHeader);

		const maxHpHeader = screen.getByText('Max HP');
		await fireEvent.click(maxHpHeader);
		expect(screen.getByLabelText(/Formula/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Output Type/i)).toBeInTheDocument();
	});

	it('should maintain field state across expansions and collapses', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'ref',
				label: 'Reference',
				type: 'entity-ref',
				required: false,
				order: 1,
				entityTypes: ['character', 'npc']
			}
		];

		render(FieldDefinitionEditor, { fields });

		// Expand
		const fieldHeader = screen.getByText('Reference');
		await fireEvent.click(fieldHeader);

		// Verify state
		const characterCheckbox = screen.getByLabelText(/character/i) as HTMLInputElement;
		expect(characterCheckbox.checked).toBe(true);

		// Collapse
		await fireEvent.click(fieldHeader);

		// Re-expand
		await fireEvent.click(fieldHeader);

		// State should persist
		const characterCheckbox2 = screen.getByLabelText(/character/i) as HTMLInputElement;
		expect(characterCheckbox2.checked).toBe(true);
	});
});

/**
 * Tests for FieldDefinitionEditor Component - Issue #168 Phase 1
 *
 * Issue #168 Phase 1: Field Type Recommendations
 *
 * This test suite covers Phase 1 enhancements for field type guidance:
 * - Field types grouped by category with headers
 * - "Recommended for Draw Steel" badges on select field types
 * - Descriptions/help text for each field type
 * - Visual organization improvements
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component enhancements are implemented.
 */

describe('FieldDefinitionEditor - Field Type Categories (Issue #168 Phase 1)', () => {
	it('should display field type selector with categories', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test_field',
				label: 'Test Field',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test Field');
		await fireEvent.click(fieldHeader);

		// Should show grouped field types
		const typeSelector = screen.getByLabelText(/Field Type/i);
		expect(typeSelector).toBeInTheDocument();
	});

	it('should show "Text & Content" category header', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// optgroup labels are in the label attribute, not text content
		const textOptgroup = container.querySelector('optgroup[label*="Text"]');
		expect(textOptgroup).toBeTruthy();
	});

	it('should show "Numeric" category header', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'number',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Numeric/i)).toBeInTheDocument();
	});

	it('should show "Selection" category header', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'select',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// optgroup labels are in the label attribute, not text content
		const selectionOptgroup = container.querySelector('optgroup[label="Selection"]');
		expect(selectionOptgroup).toBeTruthy();
	});

	it('should show "Links & References" category header', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'entity-ref',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// optgroup labels are in the label attribute, not text content
		const linksOptgroup = container.querySelector('optgroup[label*="Links"]');
		expect(linksOptgroup).toBeTruthy();
	});

	it('should show "Specialized" category header', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'date',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// optgroup labels are in the label attribute, not text content
		const specializedOptgroup = container.querySelector('optgroup[label="Specialized"]');
		expect(specializedOptgroup).toBeTruthy();
	});

	it('should group text, textarea, and richtext in Text & Content', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const textOptgroup = container.querySelector('optgroup[label*="Text"]');
		expect(textOptgroup).toBeTruthy();
		// Verify text types are in this group
		const options = textOptgroup?.querySelectorAll('option');
		const optionValues = Array.from(options || []).map((o) => o.getAttribute('value'));
		expect(optionValues).toContain('text');
		expect(optionValues).toContain('textarea');
		expect(optionValues).toContain('richtext');
	});

	it('should group select, multi-select, and tags in Selection', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'select',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const selectionOptgroup = container.querySelector('optgroup[label="Selection"]');
		expect(selectionOptgroup).toBeTruthy();
		// Verify selection types are in this group
		const options = selectionOptgroup?.querySelectorAll('option');
		const optionValues = Array.from(options || []).map((o) => o.getAttribute('value'));
		expect(optionValues).toContain('select');
		expect(optionValues).toContain('multi-select');
		expect(optionValues).toContain('tags');
	});

	it('should group entity-ref and entity-refs in Links & References', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'entity-ref',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const linksOptgroup = container.querySelector('optgroup[label*="Links"]');
		expect(linksOptgroup).toBeTruthy();
		// Verify reference types are in this group
		const options = linksOptgroup?.querySelectorAll('option');
		const optionValues = Array.from(options || []).map((o) => o.getAttribute('value'));
		expect(optionValues).toContain('entity-ref');
		expect(optionValues).toContain('entity-refs');
	});

	it('should group date, url, image, computed in Specialized', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'computed',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const specializedOptgroup = container.querySelector('optgroup[label="Specialized"]');
		expect(specializedOptgroup).toBeTruthy();
		// Verify specialized types are in this group
		const options = specializedOptgroup?.querySelectorAll('option');
		const optionValues = Array.from(options || []).map((o) => o.getAttribute('value'));
		expect(optionValues).toContain('date');
		expect(optionValues).toContain('url');
		expect(optionValues).toContain('image');
		expect(optionValues).toContain('computed');
	});
});

describe('FieldDefinitionEditor - Draw Steel Badges (Issue #168 Phase 1)', () => {
	it('should show "Recommended for Draw Steel" badge on text field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Badge should appear near or within the text field type option
		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on number field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'number',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on select field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'select',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on computed field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'computed',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on entity-ref field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'entity-ref',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on textarea field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'textarea',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should show badge on richtext field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'richtext',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/Recommended.*Draw Steel/i)).toBeInTheDocument();
	});

	it('should NOT show badge on url field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'url',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// URL field type should not have the badge
		const badges = screen.queryAllByText(/Recommended.*Draw Steel/i);
		// It's possible other field types show badges, but not this one
		expect(badges.length).toBe(0);
	});

	it('should use distinct styling for badge', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const badge = screen.getByText(/Recommended.*Draw Steel/i);
		// Badge uses font-medium styling and amber color for visual distinction
		expect(badge.className).toMatch(/font-medium/);
	});
});

describe('FieldDefinitionEditor - Field Type Descriptions (Issue #168 Phase 1)', () => {
	it('should show description for text field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/often used for.*names/i)).toBeInTheDocument();
	});

	it('should show description for number field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'number',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/AC.*HP.*bonuses/i)).toBeInTheDocument();
	});

	it('should show description for select field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'select',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/threat.*role.*school/i)).toBeInTheDocument();
	});

	it('should show description for computed field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'computed',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/calculated values/i)).toBeInTheDocument();
	});

	it('should show description for entity-ref field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'entity-ref',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		expect(screen.getByText(/link.*other entities/i)).toBeInTheDocument();
	});

	it('should show example for computed field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'computed',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Example like: total_hp = level * 3 + con
		expect(screen.getByText(/total_hp.*level/i)).toBeInTheDocument();
	});

	it('should show help text as a separate section below field type', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Help text should be styled differently (perhaps muted text)
		const helpText = screen.getByText(/often used for.*names/i);
		expect(helpText.className).toMatch(/text-gray|text-muted|help/);
	});
});

describe('FieldDefinitionEditor - Visual Organization (Issue #168 Phase 1)', () => {
	it('should use icons for field type categories', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		const { container } = render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Category headers should have icons
		const icons = container.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should display field types in a dropdown/select', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const typeSelector = screen.getByLabelText(/Field Type/i);
		expect(typeSelector.tagName).toMatch(/SELECT|INPUT/);
	});

	it('should maintain current functionality while adding categories', async () => {
		const mockOnChange = vi.fn();
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields, onchange: mockOnChange });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		const typeSelector = screen.getByLabelText(/Field Type/i);
		await fireEvent.change(typeSelector, { target: { value: 'number' } });

		// Should still call onchange
		expect(mockOnChange).toHaveBeenCalled();
	});
});

describe('FieldDefinitionEditor - Integration with DrawSteelTipsPanel (Issue #168 Phase 1)', () => {
	it('should work well alongside DrawSteelTipsPanel', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Component should render its own guidance without conflicting with tips panel
		expect(screen.getByText(/often used for.*names/i)).toBeInTheDocument();
	});

	it('should not duplicate guidance already in DrawSteelTipsPanel', async () => {
		const fields: FieldDefinition[] = [
			{
				key: 'test',
				label: 'Test',
				type: 'text',
				required: false,
				order: 1
			}
		];

		render(FieldDefinitionEditor, { fields });

		const fieldHeader = screen.getByText('Test');
		await fireEvent.click(fieldHeader);

		// Should show concise guidance specific to field type
		const helpTexts = screen.getAllByText(/often used for/i);
		expect(helpTexts.length).toBe(1); // Not duplicated
	});
});
