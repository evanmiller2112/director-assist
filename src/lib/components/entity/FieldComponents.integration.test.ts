/**
 * Integration Test for FieldInput and FieldRenderer Components
 * Phase 4: Entity Form Field Rendering (Issue #25)
 *
 * This test verifies that both components can be imported and rendered
 * without errors for basic field types.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import FieldInput from './FieldInput.svelte';
import FieldRenderer from './FieldRenderer.svelte';
import type { FieldDefinition } from '$lib/types';

describe('FieldInput and FieldRenderer - Basic Integration', () => {
	const textField: FieldDefinition = {
		key: 'test_field',
		label: 'Test Field',
		type: 'text',
		required: false,
		order: 1
	};

	describe('FieldInput', () => {
		it('should render text input without crashing', () => {
			const mockOnChange = () => {};
			const { container } = render(FieldInput, {
				props: {
					field: textField,
					value: 'test value',
					onchange: mockOnChange
				}
			});
			expect(container).toBeTruthy();
		});

		it('should render with null value', () => {
			const mockOnChange = () => {};
			const { container } = render(FieldInput, {
				props: {
					field: textField,
					value: null,
					onchange: mockOnChange
				}
			});
			expect(container).toBeTruthy();
		});

		it('should render disabled state', () => {
			const mockOnChange = () => {};
			const { container } = render(FieldInput, {
				props: {
					field: textField,
					value: 'test',
					onchange: mockOnChange,
					disabled: true
				}
			});
			expect(container).toBeTruthy();
		});

		it('should render with error', () => {
			const mockOnChange = () => {};
			const { container } = render(FieldInput, {
				props: {
					field: textField,
					value: '',
					onchange: mockOnChange,
					error: 'This field is required'
				}
			});
			expect(container).toBeTruthy();
		});
	});

	describe('FieldRenderer', () => {
		it('should render text value without crashing', () => {
			const { container } = render(FieldRenderer, {
				props: {
					field: textField,
					value: 'test value'
				}
			});
			expect(container).toBeTruthy();
		});

		it('should render with null value', () => {
			const { container } = render(FieldRenderer, {
				props: {
					field: textField,
					value: null
				}
			});
			expect(container).toBeTruthy();
		});

		it('should render in compact mode', () => {
			const { container } = render(FieldRenderer, {
				props: {
					field: textField,
					value: 'test value',
					compact: true
				}
			});
			expect(container).toBeTruthy();
		});
	});

	describe('All field types render without errors', () => {
		const fieldTypes: Array<{ type: FieldDefinition['type']; value: any }> = [
			{ type: 'text', value: 'test' },
			{ type: 'textarea', value: 'long text' },
			{ type: 'richtext', value: '# Heading' },
			{ type: 'number', value: 42 },
			{ type: 'boolean', value: true },
			{ type: 'date', value: '2024-01-01' },
			{ type: 'select', value: 'option1' },
			{ type: 'multi-select', value: ['option1', 'option2'] },
			{ type: 'tags', value: ['tag1', 'tag2'] },
			{ type: 'entity-ref', value: 'entity-id-123' },
			{ type: 'entity-refs', value: ['entity-id-1', 'entity-id-2'] },
			{ type: 'url', value: 'https://example.com' },
			{ type: 'image', value: 'https://example.com/image.png' },
			{
				type: 'computed',
				value: null
			}
		];

		fieldTypes.forEach(({ type, value: testValue }) => {
			it(`should render FieldInput for ${type}`, () => {
				const field: FieldDefinition = {
					key: 'test',
					label: 'Test',
					type,
					required: false,
					order: 1,
					options: type === 'select' || type === 'multi-select' ? ['option1', 'option2'] : undefined,
					computedConfig:
						type === 'computed'
							? {
									formula: '{test} * 2',
									dependencies: ['test'],
									outputType: 'number'
								}
							: undefined
				};
				const mockOnChange = () => {};
				const { container } = render(FieldInput, {
					props: {
						field,
						value: testValue,
						onchange: mockOnChange,
						allFields: { test: 5 }
					}
				});
				expect(container).toBeTruthy();
			});

			it(`should render FieldRenderer for ${type}`, () => {
				const field: FieldDefinition = {
					key: 'test',
					label: 'Test',
					type,
					required: false,
					order: 1,
					options: type === 'select' || type === 'multi-select' ? ['option1', 'option2'] : undefined,
					computedConfig:
						type === 'computed'
							? {
									formula: '{test} * 2',
									dependencies: ['test'],
									outputType: 'number'
								}
							: undefined
				};
				const { container } = render(FieldRenderer, {
					props: {
						field,
						value: testValue,
						allFields: { test: 5 }
					}
				});
				expect(container).toBeTruthy();
			});
		});
	});
});
