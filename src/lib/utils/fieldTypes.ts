/**
 * Field Type Utilities - Phase 1: Type System Enhancements (Issue #25)
 *
 * This module provides utilities for working with field types:
 * 1. FIELD_TYPE_METADATA - Comprehensive metadata for all field types
 * 2. normalizeFieldType() - Converts field type aliases to canonical types
 * 3. evaluateComputedField() - Evaluates computed field formulas
 *
 * Phase 1 Requirements:
 * - Support for 13 standard field types + 1 computed type (14 total)
 * - Field type alias normalization (short-text → text, long-text → textarea)
 * - Computed field evaluation with formula parsing and dependency tracking
 * - Output type conversion (text, number, boolean)
 * - Graceful error handling for missing dependencies and invalid formulas
 */

import type { FieldType, ComputedFieldConfig } from '$lib/types';

/**
 * Metadata for all field types
 * Provides human-readable labels, categories, and descriptions for UI and documentation
 */
export const FIELD_TYPE_METADATA: Record<
	FieldType,
	{ label: string; category: string; description: string }
> = {
	text: {
		label: 'Text',
		category: 'Basic',
		description: 'Single line text input for short text values'
	},
	textarea: {
		label: 'Text Area',
		category: 'Text',
		description: 'Multi-line text input for longer text values'
	},
	richtext: {
		label: 'Rich Text',
		category: 'Text',
		description: 'Markdown-enabled rich text editor for formatted content'
	},
	number: {
		label: 'Number',
		category: 'Basic',
		description: 'Numeric input for integer or decimal values'
	},
	boolean: {
		label: 'Boolean',
		category: 'Basic',
		description: 'Checkbox for true/false values'
	},
	select: {
		label: 'Select',
		category: 'Selection',
		description: 'Dropdown menu for selecting a single option from a list'
	},
	'multi-select': {
		label: 'Multi-Select',
		category: 'Selection',
		description: 'Multiple selection from a list of options'
	},
	tags: {
		label: 'Tags',
		category: 'Selection',
		description: 'Tag input for creating and selecting multiple tags'
	},
	'entity-ref': {
		label: 'Entity Reference',
		category: 'Reference',
		description: 'Reference to a single entity in the database'
	},
	'entity-refs': {
		label: 'Entity References',
		category: 'Reference',
		description: 'References to multiple entities in the database'
	},
	date: {
		label: 'Date',
		category: 'Special',
		description: 'Date picker for selecting dates'
	},
	url: {
		label: 'URL',
		category: 'Special',
		description: 'URL input with validation and link preview'
	},
	image: {
		label: 'Image',
		category: 'Special',
		description: 'Image upload and display'
	},
	computed: {
		label: 'Computed',
		category: 'Advanced',
		description: 'Calculated field based on formula and other field values'
	}
};

/**
 * Normalizes field type aliases to their canonical types
 *
 * Aliases:
 * - short-text → text
 * - long-text → textarea
 *
 * @param type - The field type to normalize (may be an alias)
 * @returns The canonical field type
 */
export function normalizeFieldType(type: string): FieldType {
	const normalized = type.toLowerCase();

	if (normalized === 'short-text') {
		return 'text';
	}

	if (normalized === 'long-text') {
		return 'textarea';
	}

	// Return unchanged if not an alias
	return type as FieldType;
}

/**
 * Evaluates a computed field formula
 *
 * Formulas can contain:
 * - Field references: {fieldName}
 * - Arithmetic operators: +, -, *, /
 * - Comparison operators: >, <, >=, <=, ==, !=
 * - Parentheses for grouping: ( )
 * - String templates with field references
 *
 * Examples:
 * - Arithmetic: "{level} * 10"
 * - String concat: "{firstName} {lastName}"
 * - Boolean: "{hp} > 0"
 * - Complex: "({level} * 8) + ({constitution} * 2)"
 *
 * @param config - The computed field configuration
 * @param fields - The field values to use in the formula
 * @returns The computed result, converted to the specified outputType, or null if dependencies are missing
 */
export function evaluateComputedField(
	config: ComputedFieldConfig,
	fields: Record<string, any>
): any {
	const { formula, dependencies, outputType } = config;

	// Handle empty formula
	if (formula === '') {
		return '';
	}

	// Check if all dependencies are present and not null/undefined
	for (const dep of dependencies) {
		if (fields[dep] === undefined || fields[dep] === null) {
			return null;
		}
	}

	// Check if formula contains any field references
	const hasFieldReferences = /{[\w_]+}/g.test(formula);

	// If there are dependencies but no field references in the formula, return null
	if (dependencies.length > 0 && !hasFieldReferences) {
		return null;
	}

	try {
		// Check if this is a string template or an arithmetic/boolean expression
		const fieldRefPattern = /{([\w_]+\d*)}/g;

		// Remove all field references and check what's left
		const withoutFieldRefs = formula.replace(fieldRefPattern, '');

		// Check if there are arithmetic or boolean operators
		const hasArithmeticOps = /[+\-*/<>=!()]/.test(withoutFieldRefs);

		// If no arithmetic operators, treat as string template
		if (!hasArithmeticOps) {
			// This is a string template - just replace field references with values
			const result = formula.replace(fieldRefPattern, (match, fieldName) => {
				const value = fields[fieldName];
				return String(value);
			});

			// Convert result to the specified output type
			switch (outputType) {
				case 'number':
					return Number(result);
				case 'text':
					return String(result);
				case 'boolean':
					return Boolean(result);
				default:
					return result;
			}
		}

		// Otherwise, it's an arithmetic/boolean expression, evaluate it
		let evaluatedFormula = formula;

		// For each field reference in the formula, replace with the actual value
		evaluatedFormula = evaluatedFormula.replace(fieldRefPattern, (match, fieldName) => {
			const value = fields[fieldName];

			// If the value is a string, wrap it in quotes for eval
			if (typeof value === 'string') {
				return `"${value.replace(/"/g, '\\"')}"`;
			}

			// For numbers and booleans, return as-is
			return String(value);
		});

		// Evaluate the formula
		// eslint-disable-next-line no-eval
		const result = eval(evaluatedFormula);

		// Convert result to the specified output type
		switch (outputType) {
			case 'number':
				return Number(result);
			case 'text':
				return String(result);
			case 'boolean':
				return Boolean(result);
			default:
				return result;
		}
	} catch (error) {
		// If evaluation fails, throw the error
		throw error;
	}
}
