/**
 * Tests for ComputedFieldEditor Component - Reactivity Issues
 *
 * Issue #327: Fix Svelte 5 reactivity warnings
 *
 * This test file verifies that the ComputedFieldEditor component properly reacts to prop changes.
 * The component has the following reactivity issues:
 * - Lines 14, 15: `config` prop captured at initial value in $state()
 *   - formula and outputType are initialized from config prop
 *
 * The problem: When the config prop changes (e.g., user switches to a different computed field
 * to edit), the component's state does not update because $state() captures the prop value
 * only at initialization time.
 *
 * While there is an $effect() on lines 208-215 that tries to sync config changes,
 * the initial state capture is still incorrect and causes Svelte 5 warnings.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * reactivity issues are fixed by senior-web-architect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ComputedFieldEditor from './ComputedFieldEditor.svelte';
import type { ComputedFieldConfig, FieldDefinition } from '$lib/types';

describe('ComputedFieldEditor - Reactivity: Config Prop Changes', () => {
	const mockOnChange = vi.fn();
	const availableFields: FieldDefinition[] = [
		{ key: 'strength', label: 'Strength', type: 'number', required: false, order: 1 },
		{ key: 'dexterity', label: 'Dexterity', type: 'number', required: false, order: 2 },
		{ key: 'constitution', label: 'Constitution', type: 'number', required: false, order: 3 }
	];

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	it('should initially render with values from config prop', () => {
		const config: ComputedFieldConfig = {
			formula: '{strength} + {dexterity}',
			dependencies: ['strength', 'dexterity'],
			outputType: 'number'
		};

		render(ComputedFieldEditor, {
			props: {
				availableFields,
				config,
				onchange: mockOnChange
			}
		});

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('{strength} + {dexterity}');

		const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;
		expect(outputTypeSelect.value).toBe('number');
	});

	it('should update formula when config prop changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{strength} * 2',
			dependencies: ['strength'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('{strength} * 2');

		// User switches to edit a different computed field
		const config2: ComputedFieldConfig = {
			formula: '{constitution} + 10',
			dependencies: ['constitution'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Formula should update to new config
		expect(formulaInput.value).toBe('{constitution} + 10');
	});

	it('should update output type when config prop changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{strength} + {dexterity}',
			dependencies: ['strength', 'dexterity'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;
		expect(outputTypeSelect.value).toBe('number');

		// Switch to boolean output type config
		const config2: ComputedFieldConfig = {
			formula: '{strength} > 10',
			dependencies: ['strength'],
			outputType: 'boolean'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		expect(outputTypeSelect.value).toBe('boolean');
	});

	it('should update both formula and output type when config changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: 'Simple text',
			dependencies: [],
			outputType: 'text'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;

		expect(formulaInput.value).toBe('Simple text');
		expect(outputTypeSelect.value).toBe('text');

		// Change to number formula
		const config2: ComputedFieldConfig = {
			formula: '{strength} + {constitution}',
			dependencies: ['strength', 'constitution'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		expect(formulaInput.value).toBe('{strength} + {constitution}');
		expect(outputTypeSelect.value).toBe('number');
	});

	it('should clear formula when config changes to empty', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{strength} * 5',
			dependencies: ['strength'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('{strength} * 5');

		// Change to empty config (new computed field being created)
		const config2: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		expect(formulaInput.value).toBe('');

		const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;
		expect(outputTypeSelect.value).toBe('text');
	});

	it('should update preview when config changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: '10 + 5',
			dependencies: [],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Preview should show result of formula
		expect(screen.getByText(/15/)).toBeInTheDocument();

		// Change to different formula
		const config2: ComputedFieldConfig = {
			formula: '20 + 30',
			dependencies: [],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Preview should update
		expect(screen.getByText(/50/)).toBeInTheDocument();
	});

	it('should clear validation errors when config changes to valid formula', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{invalid_field}',
			dependencies: ['invalid_field'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Should show validation error for unknown field (appears in multiple places - validation and preview)
		const errors = screen.getAllByText(/unknown field/i);
		expect(errors.length).toBeGreaterThan(0);

		// Change to valid config
		const config2: ComputedFieldConfig = {
			formula: '{strength}',
			dependencies: ['strength'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Error should be cleared
		expect(screen.queryByText(/unknown field/i)).not.toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Reactivity: Config Changes After User Edits', () => {
	const mockOnChange = vi.fn();
	const availableFields: FieldDefinition[] = [
		{ key: 'hp', label: 'Hit Points', type: 'number', required: false, order: 1 },
		{ key: 'ac', label: 'Armor Class', type: 'number', required: false, order: 2 }
	];

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	it('should discard user edits when config prop changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{hp}',
			dependencies: ['hp'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// User edits the formula
		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		await fireEvent.input(formulaInput, {
			target: { value: '{hp} * 2' }
		});

		expect(formulaInput.value).toBe('{hp} * 2');

		// Config changes (user switches to different computed field)
		const config2: ComputedFieldConfig = {
			formula: '{ac} + 10',
			dependencies: ['ac'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// User's edits should be discarded, showing new config
		expect(formulaInput.value).toBe('{ac} + 10');
	});

	it('should reset output type even if user changed it', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{hp}',
			dependencies: ['hp'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// User changes output type
		const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;
		await fireEvent.change(outputTypeSelect, { target: { value: 'text' } });

		expect(outputTypeSelect.value).toBe('text');

		// Config changes
		const config2: ComputedFieldConfig = {
			formula: '{ac} > 15',
			dependencies: ['ac'],
			outputType: 'boolean'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Should reset to new config's output type
		expect(outputTypeSelect.value).toBe('boolean');
	});
});

describe('ComputedFieldEditor - Reactivity: Edge Cases', () => {
	const mockOnChange = vi.fn();
	const availableFields: FieldDefinition[] = [
		{ key: 'field1', label: 'Field 1', type: 'number', required: false, order: 1 },
		{ key: 'field2', label: 'Field 2', type: 'number', required: false, order: 2 }
	];

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	it('should handle rapid config changes', async () => {
		const configs: ComputedFieldConfig[] = [
			{
				formula: '{field1}',
				dependencies: ['field1'],
				outputType: 'number'
			},
			{
				formula: '{field2}',
				dependencies: ['field2'],
				outputType: 'number'
			},
			{
				formula: '{field1} + {field2}',
				dependencies: ['field1', 'field2'],
				outputType: 'number'
			}
		];

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: configs[0],
				onchange: mockOnChange
			}
		});

		// Rapidly change configs
		for (const config of configs) {
			await rerender({
				availableFields,
				config,
				onchange: mockOnChange
			});
		}

		// Should end up with last config
		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('{field1} + {field2}');
	});

	it('should handle config with complex formula', async () => {
		const config1: ComputedFieldConfig = {
			formula: 'simple',
			dependencies: [],
			outputType: 'text'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('simple');

		// Change to complex formula
		const config2: ComputedFieldConfig = {
			formula: '({field1} + {field2}) * 2 > 100 ? "high" : "low"',
			dependencies: ['field1', 'field2'],
			outputType: 'text'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		expect(formulaInput.value).toBe('({field1} + {field2}) * 2 > 100 ? "high" : "low"');
	});

	it('should handle switching between different output types', async () => {
		const outputTypes: Array<'text' | 'number' | 'boolean'> = ['text', 'number', 'boolean'];

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: {
					formula: 'test',
					dependencies: [],
					outputType: outputTypes[0]
				},
				onchange: mockOnChange
			}
		});

		for (const outputType of outputTypes) {
			await rerender({
				availableFields,
				config: {
					formula: 'test',
					dependencies: [],
					outputType
				},
				onchange: mockOnChange
			});

			const outputTypeSelect = screen.getByLabelText(/output type/i) as HTMLSelectElement;
			expect(outputTypeSelect.value).toBe(outputType);
		}
	});

	it('should handle undefined config gracefully', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{field1}',
			dependencies: ['field1'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Change to undefined config
		await rerender({
			availableFields,
			config: undefined as any,
			onchange: mockOnChange
		});

		// Should not crash - component should handle gracefully
		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput).toBeInTheDocument();
	});

	it('should update dependencies display when config changes', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{field1}',
			dependencies: ['field1'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Should show field1 as dependency (may appear in multiple places)
		const field1Elements = screen.getAllByText(/^field1$/);
		expect(field1Elements.length).toBeGreaterThan(0);

		// Change to formula with different dependencies
		const config2: ComputedFieldConfig = {
			formula: '{field2} + 5',
			dependencies: ['field2'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Dependencies should update
		const dependenciesSection = screen.getByText(/dependencies/i).parentElement;
		expect(dependenciesSection).toHaveTextContent('field2');
	});

	it('should handle config changes with validation state', async () => {
		const config1: ComputedFieldConfig = {
			formula: '{invalid_field}',
			dependencies: ['invalid_field'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Should show error (appears in multiple places)
		const errors = screen.getAllByText(/unknown field/i);
		expect(errors.length).toBeGreaterThan(0);

		// Change to another invalid config
		const config2: ComputedFieldConfig = {
			formula: '{{{malformed',
			dependencies: [],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config2,
			onchange: mockOnChange
		});

		// Should show different error (may appear in multiple places)
		const braceErrors = screen.getAllByText(/unmatched|braces/i);
		expect(braceErrors.length).toBeGreaterThan(0);

		// Change to valid config
		const config3: ComputedFieldConfig = {
			formula: '{field1}',
			dependencies: ['field1'],
			outputType: 'number'
		};

		await rerender({
			availableFields,
			config: config3,
			onchange: mockOnChange
		});

		// Error should clear
		expect(screen.queryByText(/error|invalid/i)).not.toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Reactivity: Integration with AvailableFields', () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	it('should update validation when both config and availableFields change', async () => {
		const fields1: FieldDefinition[] = [
			{ key: 'oldField', label: 'Old Field', type: 'number', required: false, order: 1 }
		];

		const config1: ComputedFieldConfig = {
			formula: '{oldField}',
			dependencies: ['oldField'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields: fields1,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Should be valid
		expect(screen.queryByText(/unknown field/i)).not.toBeInTheDocument();

		// Change both availableFields and config
		const fields2: FieldDefinition[] = [
			{ key: 'newField', label: 'New Field', type: 'number', required: false, order: 1 }
		];

		const config2: ComputedFieldConfig = {
			formula: '{newField}',
			dependencies: ['newField'],
			outputType: 'number'
		};

		await rerender({
			availableFields: fields2,
			config: config2,
			onchange: mockOnChange
		});

		// Should still be valid with new field
		expect(screen.queryByText(/unknown field/i)).not.toBeInTheDocument();

		const formulaInput = screen.getByLabelText(/formula/i) as HTMLTextAreaElement;
		expect(formulaInput.value).toBe('{newField}');
	});

	it('should show validation error when config references field not in availableFields', async () => {
		const fields: FieldDefinition[] = [
			{ key: 'existingField', label: 'Existing', type: 'number', required: false, order: 1 }
		];

		const config1: ComputedFieldConfig = {
			formula: '{existingField}',
			dependencies: ['existingField'],
			outputType: 'number'
		};

		const { rerender } = render(ComputedFieldEditor, {
			props: {
				availableFields: fields,
				config: config1,
				onchange: mockOnChange
			}
		});

		// Valid initially
		expect(screen.queryByText(/unknown field/i)).not.toBeInTheDocument();

		// Change config to reference non-existent field
		const config2: ComputedFieldConfig = {
			formula: '{nonExistentField}',
			dependencies: ['nonExistentField'],
			outputType: 'number'
		};

		await rerender({
			availableFields: fields,
			config: config2,
			onchange: mockOnChange
		});

		// Should show error (appears in multiple places)
		const errors = screen.getAllByText(/unknown field/i);
		expect(errors.length).toBeGreaterThan(0);
	});
});
