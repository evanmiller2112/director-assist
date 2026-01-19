/**
 * Tests for ComputedFieldEditor Component - Phase 2
 *
 * Issue #25 Phase 2: Custom Entity Type Management UI
 *
 * This component provides a dedicated editor for computed field configuration,
 * allowing users to build formulas that reference other fields and automatically
 * calculate values.
 *
 * Features:
 * - Formula input with field picker
 * - Output type selector (text/number/boolean)
 * - Preview of computed result
 * - Validation of formula syntax with error display
 * - Auto-detection of field dependencies
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import ComputedFieldEditor from './ComputedFieldEditor.svelte';
import type { ComputedFieldConfig, FieldDefinition } from '$lib/types';

describe('ComputedFieldEditor - Basic Rendering (Issue #25 Phase 2)', () => {
	it('should render without crashing', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		const { container } = render(ComputedFieldEditor, {
			availableFields,
			config
		});

		expect(container).toBeTruthy();
	});

	it('should display formula input field', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		expect(formulaInput).toBeInTheDocument();
	});

	it('should display output type selector', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const outputTypeSelect = screen.getByLabelText(/Output Type/i);
		expect(outputTypeSelect).toBeInTheDocument();
	});

	it('should display available fields section', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText(/Available Fields/i)).toBeInTheDocument();
	});

	it('should render with initial config values', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '{field1} + {field2}',
			dependencies: ['field1', 'field2'],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i) as HTMLInputElement;
		expect(formulaInput.value).toBe('{field1} + {field2}');

		const outputTypeSelect = screen.getByLabelText(/Output Type/i) as HTMLSelectElement;
		expect(outputTypeSelect.value).toBe('number');
	});
});

describe('ComputedFieldEditor - Formula Input (Issue #25 Phase 2)', () => {
	it('should allow typing in formula input', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{hp} * 2' } });

		expect(mockOnChange).toHaveBeenCalled();
	});

	it('should call onchange when formula is modified', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{strength} + 10' } });

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				formula: '{strength} + 10'
			})
		);
	});

	it('should show placeholder text in empty formula input', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i) as HTMLInputElement;
		expect(formulaInput.placeholder).toBeTruthy();
		expect(formulaInput.placeholder).toContain('{');
	});

	it('should display multi-line formula input', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		// Should be textarea for multi-line support
		expect(formulaInput.tagName).toBe('TEXTAREA');
	});

	it('should display help text about formula syntax', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// Should show help text explaining {fieldName} syntax
		expect(
			screen.getByText(/Use \{fieldName\} to reference other fields/i)
		).toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Available Fields Picker (Issue #25 Phase 2)', () => {
	it('should display list of available fields', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'strength', label: 'Strength', type: 'number', required: false, order: 1 },
			{ key: 'constitution', label: 'Constitution', type: 'number', required: false, order: 2 },
			{ key: 'level', label: 'Level', type: 'number', required: false, order: 3 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText('strength')).toBeInTheDocument();
		expect(screen.getByText('constitution')).toBeInTheDocument();
		expect(screen.getByText('level')).toBeInTheDocument();
	});

	it('should show field labels alongside field keys', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'str', label: 'Strength', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText(/Strength/i)).toBeInTheDocument();
	});

	it('should make available fields clickable', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'hp', label: 'Hit Points', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const fieldButton = screen.getByText('hp');
		expect(fieldButton.tagName).toBe('BUTTON');
	});

	it('should insert field placeholder when field is clicked', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'damage', label: 'Damage', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const fieldButton = screen.getByText('damage');
		await fireEvent.click(fieldButton);

		// Should insert {damage} into formula
		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				formula: expect.stringContaining('{damage}')
			})
		);
	});

	it('should append to existing formula when field is clicked', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'base', label: 'Base', type: 'number', required: false, order: 1 },
			{ key: 'bonus', label: 'Bonus', type: 'number', required: false, order: 2 }
		];
		const config: ComputedFieldConfig = {
			formula: '{base}',
			dependencies: ['base'],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const bonusButton = screen.getByText('bonus');
		await fireEvent.click(bonusButton);

		// Should append to formula
		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				formula: expect.stringMatching(/\{base\}.*\{bonus\}/)
			})
		);
	});

	it('should show message when no fields are available', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(
			screen.getByText(/No fields available|Add other fields first/i)
		).toBeInTheDocument();
	});

	it('should exclude computed fields from available fields list', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'base_value', label: 'Base Value', type: 'number', required: false, order: 1 },
			{ key: 'computed_value', label: 'Computed Value', type: 'computed', required: false, order: 2 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText('base_value')).toBeInTheDocument();
		expect(screen.queryByText('computed_value')).not.toBeInTheDocument();
	});

	it('should filter available fields by type (only allow numeric fields for number formulas)', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'strength', label: 'Strength', type: 'number', required: false, order: 1 },
			{ key: 'name', label: 'Name', type: 'text', required: false, order: 2 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// When output type is number, might want to highlight numeric fields
		expect(screen.getByText('strength')).toBeInTheDocument();
		expect(screen.getByText('name')).toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Output Type Selector (Issue #25 Phase 2)', () => {
	it('should have options for text, number, and boolean', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const select = screen.getByLabelText(/Output Type/i) as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);

		expect(options).toContain('text');
		expect(options).toContain('number');
		expect(options).toContain('boolean');
	});

	it('should reflect current output type', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const select = screen.getByLabelText(/Output Type/i) as HTMLSelectElement;
		expect(select.value).toBe('number');
	});

	it('should call onchange when output type is changed', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '{field1}',
			dependencies: ['field1'],
			outputType: 'text'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const select = screen.getByLabelText(/Output Type/i);
		await fireEvent.change(select, { target: { value: 'number' } });

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				outputType: 'number'
			})
		);
	});

	it('should display help text for each output type', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// Should have descriptive labels or help text
		expect(screen.getByText(/Text/i)).toBeInTheDocument();
		expect(screen.getByText(/Number/i)).toBeInTheDocument();
		expect(screen.getByText(/Boolean/i)).toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Auto-Detect Dependencies (Issue #25 Phase 2)', () => {
	it('should auto-detect dependencies when formula changes', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'strength', label: 'Strength', type: 'number', required: false, order: 1 },
			{ key: 'constitution', label: 'Constitution', type: 'number', required: false, order: 2 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, {
			target: { value: '{strength} + {constitution}' }
		});

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				dependencies: expect.arrayContaining(['strength', 'constitution'])
			})
		);
	});

	it('should detect dependencies from complex formulas', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'base', label: 'Base', type: 'number', required: false, order: 1 },
			{ key: 'modifier', label: 'Modifier', type: 'number', required: false, order: 2 },
			{ key: 'level', label: 'Level', type: 'number', required: false, order: 3 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, {
			target: { value: '({base} + {modifier}) * {level}' }
		});

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				dependencies: expect.arrayContaining(['base', 'modifier', 'level'])
			})
		);
	});

	it('should display detected dependencies', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'hp', label: 'HP', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '{hp} * 2',
			dependencies: ['hp'],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// Should show dependencies somewhere
		expect(screen.getByText(/Dependencies/i)).toBeInTheDocument();
		expect(screen.getByText(/hp/)).toBeInTheDocument();
	});

	it('should handle formulas with no dependencies', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '42' } });

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.objectContaining({
				dependencies: []
			})
		);
	});

	it('should deduplicate dependencies', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'value', label: 'Value', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{value} + {value} * {value}' } });

		const updatedConfig = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
		// Should only have 'value' once
		expect(updatedConfig.dependencies.filter((d: string) => d === 'value').length).toBe(1);
	});
});

describe('ComputedFieldEditor - Formula Validation (Issue #25 Phase 2)', () => {
	it('should validate formula syntax', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{invalid syntax ++' } });

		// Should show validation error
		expect(screen.getByText(/Invalid formula|Syntax error/i)).toBeInTheDocument();
	});

	it('should show error for unmatched braces', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{field1 + {field2}' } });

		expect(screen.getByText(/Unmatched|braces|brackets/i)).toBeInTheDocument();
	});

	it('should show error for undefined field references', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'valid_field', label: 'Valid', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{nonexistent_field}' } });

		expect(screen.getByText(/Unknown field|not found/i)).toBeInTheDocument();
	});

	it('should clear validation errors when formula is corrected', async () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);

		// Enter invalid formula
		await fireEvent.input(formulaInput, { target: { value: '{invalid ++' } });
		expect(screen.getByText(/Invalid|Syntax error/i)).toBeInTheDocument();

		// Correct the formula
		await fireEvent.input(formulaInput, { target: { value: '{field1} + 10' } });

		// Error should be gone
		expect(screen.queryByText(/Invalid|Syntax error/i)).not.toBeInTheDocument();
	});

	it('should show warning for circular dependencies', async () => {
		// Note: This requires tracking which field is being edited
		// For now, document the expected behavior
		const availableFields: FieldDefinition[] = [
			{ key: 'field_a', label: 'Field A', type: 'computed', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// If editing field_a and referencing field_a in formula
		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '{field_a} + 1' } });

		// Should show circular dependency warning
		// expect(screen.getByText(/Circular|self-reference/i)).toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Preview (Issue #25 Phase 2)', () => {
	it('should show preview section', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText(/Preview/i)).toBeInTheDocument();
	});

	it('should show computed result preview when formula is valid', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '10 + 5',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// Should show result
		expect(screen.getByText(/15/)).toBeInTheDocument();
	});

	it('should show placeholder values for field dependencies in preview', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'strength', label: 'Strength', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '{strength} + 10',
			dependencies: ['strength'],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		// Should show that strength will be replaced with actual value
		expect(screen.getByText(/strength.*=.*\d+|example/i)).toBeInTheDocument();
	});

	it('should update preview when formula changes', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '5',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '10' } });

		// Preview should update
		expect(screen.getByText(/10/)).toBeInTheDocument();
	});

	it('should show error in preview for invalid formulas', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: 'invalid' } });

		// Preview should show error
		expect(screen.getByText(/Error|Invalid/i)).toBeInTheDocument();
	});

	it('should show message when formula is empty', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByText(/Enter a formula|No formula/i)).toBeInTheDocument();
	});
});

describe('ComputedFieldEditor - Edge Cases (Issue #25 Phase 2)', () => {
	it('should handle very long formulas', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const longFormula = '{a} + {b} + {c} + {d} + {e} + {f} + {g} + {h}';
		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: longFormula } });

		expect(mockOnChange).toHaveBeenCalled();
	});

	it('should handle formulas with special characters', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'text'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: '"{field1}" + " - " + "{field2}"' } });

		expect(mockOnChange).toHaveBeenCalled();
	});

	it('should handle empty config gracefully', () => {
		const availableFields: FieldDefinition[] = [];
		const config = undefined as any;

		expect(() => {
			render(ComputedFieldEditor, { availableFields, config });
		}).not.toThrow();
	});

	it('should handle missing onchange callback gracefully', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);

		// Should not throw error
		await expect(async () => {
			await fireEvent.input(formulaInput, { target: { value: '{field}' } });
		}).not.toThrow();
	});

	it('should handle rapid formula changes', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};
		const mockOnChange = vi.fn();

		render(ComputedFieldEditor, { availableFields, config, onchange: mockOnChange });

		const formulaInput = screen.getByLabelText(/Formula/i);

		// Rapid changes
		await fireEvent.input(formulaInput, { target: { value: '{a}' } });
		await fireEvent.input(formulaInput, { target: { value: '{a} +' } });
		await fireEvent.input(formulaInput, { target: { value: '{a} + {b}' } });

		// Should handle all changes
		expect(mockOnChange).toHaveBeenCalled();
	});
});

describe('ComputedFieldEditor - Accessibility (Issue #25 Phase 2)', () => {
	it('should have proper labels for all inputs', () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		expect(screen.getByLabelText(/Formula/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Output Type/i)).toBeInTheDocument();
	});

	it('should be keyboard navigable', () => {
		const availableFields: FieldDefinition[] = [
			{ key: 'field1', label: 'Field 1', type: 'number', required: false, order: 1 }
		];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i) as HTMLInputElement;
		const outputTypeSelect = screen.getByLabelText(/Output Type/i) as HTMLSelectElement;
		const fieldButton = screen.getByText('field1') as HTMLButtonElement;

		expect(formulaInput.tabIndex).toBeGreaterThanOrEqual(0);
		expect(outputTypeSelect.tabIndex).toBeGreaterThanOrEqual(0);
		expect(fieldButton.tabIndex).toBeGreaterThanOrEqual(0);
	});

	it('should show validation errors in accessible way', async () => {
		const availableFields: FieldDefinition[] = [];
		const config: ComputedFieldConfig = {
			formula: '',
			dependencies: [],
			outputType: 'number'
		};

		render(ComputedFieldEditor, { availableFields, config });

		const formulaInput = screen.getByLabelText(/Formula/i);
		await fireEvent.input(formulaInput, { target: { value: 'invalid' } });

		// Error should be associated with input
		const errorMessage = screen.getByText(/Invalid|Error/i);
		expect(errorMessage).toBeInTheDocument();
	});
});
