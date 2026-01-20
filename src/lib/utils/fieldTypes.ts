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
 * Result of formula validation
 */
export interface ValidationResult {
	isValid: boolean;
	sanitized?: string;
	error?: string;
}

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
 * Validates a formula for safe evaluation with eval()
 *
 * This function implements multiple layers of security validation to prevent
 * code injection attacks when evaluating computed field formulas.
 *
 * SECURITY: This validation is CRITICAL for preventing arbitrary code execution.
 * The function blocks all JavaScript language features except safe mathematical
 * and logical expressions.
 *
 * Allowed patterns:
 * - Arithmetic operators: +, -, *, /, %
 * - Comparison operators: <, >, <=, >=, ==, !=, ===, !==
 * - Logical operators: &&, ||, !
 * - Parentheses for grouping: ( )
 * - Numeric literals: integers and decimals (e.g., 42, 3.14)
 * - Quoted strings: "text" or 'text'
 * - Whitespace
 *
 * Blocked patterns:
 * - JavaScript keywords (function, return, var, let, const, new, this, etc.)
 * - Function calls: identifier followed by (
 * - Property access: identifier followed by .
 * - Assignment operators: =, +=, -=, *=, /=
 * - Array/object literals: [], {}
 * - Template literals: backticks
 * - Semicolons (statement separators)
 * - Comments: single-line and multi-line
 *
 * @param formula - The formula string to validate (after field substitution)
 * @returns Validation result with isValid flag, sanitized formula, or error message
 */
export function validateFormulaForEval(formula: string): ValidationResult {
	// Allow empty or whitespace-only formulas
	if (formula.trim() === '') {
		return { isValid: true, sanitized: formula };
	}

	// Block template literals (backticks) - check early before other validations
	if (formula.includes('`')) {
		return { isValid: false, error: 'Dangerous pattern detected: template literal' };
	}

	// Block comments - single-line comments
	if (formula.includes('//')) {
		return { isValid: false, error: 'Dangerous pattern detected: comment' };
	}

	// Block comments - multi-line comments
	if (formula.includes('/*') || formula.includes('*/')) {
		return { isValid: false, error: 'Dangerous pattern detected: comment' };
	}

	// Block arrow functions: => (check before other patterns)
	if (formula.includes('=>')) {
		return { isValid: false, error: 'Dangerous pattern detected: arrow function' };
	}

	// List of dangerous JavaScript keywords to block
	// Check these keywords FIRST before function call pattern
	// because "if(", "for(", "function(", "new Thing()", etc. look like function calls but are keywords
	// Note: Use lowercase for keyword matching, case-insensitive regex
	const earlyKeywords = [
		{ keyword: 'function', caseSensitive: false }, // lowercase "function" keyword
		'new',
		'class',
		'import',
		'if',
		'else',
		'for',
		'while',
		'do',
		'switch',
		'case',
		'break',
		'continue',
		'try',
		'catch',
		'finally',
		'throw',
		'with'
	];

	// Check for these keywords first
	for (const item of earlyKeywords) {
		const keyword = typeof item === 'string' ? item : item.keyword;
		const caseSensitive = typeof item === 'object' && item.caseSensitive === true;

		// For "function", only match lowercase to avoid matching "Function" constructor
		if (keyword === 'function') {
			// Case-sensitive match for lowercase "function" only
			const functionRegex = /\bfunction\b/;
			if (functionRegex.test(formula)) {
				return { isValid: false, error: `Dangerous keyword detected: "${keyword}"` };
			}
		} else {
			// Case-insensitive for all other keywords
			const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
			if (keywordRegex.test(formula)) {
				return { isValid: false, error: `Dangerous keyword detected: "${keyword}"` };
			}
		}
	}

	// Block function calls: identifier followed by (
	// Check this AFTER control flow keywords but BEFORE other keywords
	// so that eval("...") is caught as function call, not keyword
	// Pattern: word character(s) followed immediately by (
	const functionCallPattern = /\w+\s*\(/;
	if (functionCallPattern.test(formula)) {
		return { isValid: false, error: 'Dangerous pattern detected: function call' };
	}

	// Block property access: . followed by identifier
	// But allow decimal numbers like 3.14
	// Strategy: Check for . that's preceded by a letter (not a digit)
	// Check this BEFORE other keywords so window.location is caught as property access
	const propertyAccessPattern = /[a-zA-Z_]\s*\.\s*[a-zA-Z_$]/;
	if (propertyAccessPattern.test(formula)) {
		return { isValid: false, error: 'Dangerous pattern detected: property access' };
	}

	// Block bracket notation property access: identifier followed by [
	// e.g., window["location"] or arr[0]
	const bracketNotationPattern = /\w+\s*\[/;
	if (bracketNotationPattern.test(formula)) {
		return { isValid: false, error: 'Dangerous pattern detected: property access' };
	}

	// Block array literals: [ or ] without preceding identifier
	if (formula.includes('[') || formula.includes(']')) {
		return { isValid: false, error: 'Dangerous pattern detected: array literal' };
	}

	// Block object literals
	if (formula.includes('{') || formula.includes('}')) {
		return { isValid: false, error: 'Dangerous pattern detected: object literal' };
	}

	// Check remaining dangerous keywords
	const dangerousKeywords = [
		'function',
		'return',
		'var',
		'let',
		'const',
		'eval',
		'new',
		'this',
		'window',
		'document',
		'import',
		'export',
		'require',
		'process',
		'global',
		'class',
		'async',
		'await',
		'yield',
		'delete',
		'typeof',
		'void',
		'in',
		'instanceof',
		'debugger'
	];

	// Check for dangerous keywords (case-insensitive word boundary match)
	for (const keyword of dangerousKeywords) {
		const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
		if (keywordRegex.test(formula)) {
			return { isValid: false, error: `Dangerous keyword detected: "${keyword}"` };
		}
	}

	// Block semicolons (statement separators)
	if (formula.includes(';')) {
		return { isValid: false, error: 'Dangerous pattern detected: semicolon' };
	}

	// Block assignment operators
	// Allow: ==, !=, <=, >=, ===, !==
	// Block: = (when not part of ==, !=, <=, >=)
	// Also block: +=, -=, *=, /=, %=
	const compoundAssignmentPattern = /[+\-*/%]=/;
	if (compoundAssignmentPattern.test(formula)) {
		return { isValid: false, error: 'Dangerous pattern detected: assignment' };
	}

	// Block single = that's not part of comparison operators
	// Look for = not preceded by <, >, !, or =
	const singleAssignmentPattern = /(?<![<>!=])=(?!=)/;
	if (singleAssignmentPattern.test(formula)) {
		return { isValid: false, error: 'Dangerous pattern detected: assignment' };
	}

	// If all checks pass, the formula is considered safe
	return { isValid: true, sanitized: formula };
}

/**
 * Evaluates a computed field formula
 *
 * SECURITY WARNING: This function uses eval() to evaluate formulas, which can be
 * dangerous if the formula contains malicious code. All formulas MUST be validated
 * using validateFormulaForEval() before evaluation to prevent code injection attacks.
 *
 * The validation blocks all JavaScript language features except safe mathematical
 * and logical expressions. See validateFormulaForEval() for details on what is
 * allowed and blocked.
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
 * @throws Error if the formula fails validation or evaluation
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

		// SECURITY: Validate the formula WITHOUT field references to catch malicious patterns
		// This validates the formula structure before field substitution
		const structureValidation = validateFormulaForEval(withoutFieldRefs);
		if (!structureValidation.isValid) {
			throw new Error(`Formula validation failed: ${structureValidation.error}`);
		}

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

		// SECURITY: Validate the formula AGAIN after field substitution to prevent injection via field values
		const validationResult = validateFormulaForEval(evaluatedFormula);
		if (!validationResult.isValid) {
			throw new Error(`Formula validation failed: ${validationResult.error}`);
		}

		// Evaluate the formula using the sanitized version
		// eslint-disable-next-line no-eval
		const result = eval(validationResult.sanitized!);

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
