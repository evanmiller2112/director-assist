/**
 * Entity Type Validation Utilities (Issue #25 - Phase 7)
 *
 * Provides comprehensive validation for custom entity types and field definitions.
 * Used when creating/editing custom entity types to ensure data integrity.
 */

import type { EntityTypeDefinition, FieldDefinition, FieldType } from '$lib/types';
import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';

/**
 * Validation result type
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Valid field types for validation
 */
const VALID_FIELD_TYPES: FieldType[] = [
	'text',
	'textarea',
	'richtext',
	'number',
	'boolean',
	'select',
	'multi-select',
	'tags',
	'entity-ref',
	'entity-refs',
	'date',
	'url',
	'image',
	'computed'
];

/**
 * Validates an entity type definition
 * Returns validation result with any errors found
 */
export function validateEntityTypeDefinition(
	typeDef: Partial<EntityTypeDefinition>,
	existingCustomTypes: EntityTypeDefinition[] = []
): ValidationResult {
	const errors: string[] = [];

	// Validate required fields
	if (typeDef.type === undefined || typeDef.type === null) {
		errors.push('Entity type must have a type key');
	} else if (typeDef.type === '') {
		errors.push('Entity type key cannot be empty');
	} else {
		// Validate type key format
		if (/\s/.test(typeDef.type)) {
			errors.push('Entity type key cannot contain spaces');
		}
		if (!/^[a-z][a-z0-9_-]*$/.test(typeDef.type)) {
			if (/[A-Z]/.test(typeDef.type)) {
				errors.push('Entity type key must be lowercase');
			} else if (!/^[a-z]/.test(typeDef.type)) {
				errors.push('Entity type key must start with a letter');
			} else {
				errors.push('Entity type key can only contain letters, numbers, hyphens, and underscores');
			}
		}

		// Validate type key uniqueness
		const uniquenessResult = validateTypeKeyUniqueness(typeDef.type, existingCustomTypes);
		if (!uniquenessResult.valid) {
			// Convert "Type key" to "Entity type key" for consistency in entity type validation
			const adjustedErrors = uniquenessResult.errors.map((err) =>
				err.replace('Type key', 'Entity type key')
			);
			errors.push(...adjustedErrors);
		}
	}

	if (!typeDef.label) {
		errors.push('Entity type must have a label');
	} else if (typeDef.label === '') {
		errors.push('Entity type label cannot be empty');
	}

	if (!typeDef.labelPlural) {
		errors.push('Entity type must have a labelPlural');
	} else if (typeDef.labelPlural === '') {
		errors.push('Entity type labelPlural cannot be empty');
	}

	if (!typeDef.icon) {
		errors.push('Entity type must have an icon');
	} else if (typeDef.icon === '') {
		errors.push('Entity type icon cannot be empty');
	}

	if (!typeDef.color) {
		errors.push('Entity type must have a color');
	} else if (typeDef.color === '') {
		errors.push('Entity type color cannot be empty');
	}

	// Validate field definitions
	if (typeDef.fieldDefinitions && Array.isArray(typeDef.fieldDefinitions)) {
		const fieldKeys = new Set<string>();

		for (const field of typeDef.fieldDefinitions) {
			// Check for duplicate field keys
			if (field.key && fieldKeys.has(field.key)) {
				errors.push(`Duplicate field key: ${field.key}`);
			} else if (field.key) {
				fieldKeys.add(field.key);
			}

			// Validate each field definition
			const fieldResult = validateFieldDefinition(field);
			if (!fieldResult.valid) {
				errors.push(...fieldResult.errors);
			}
		}

		// Check for circular dependencies in computed fields
		const circularResult = detectCircularDependencies(typeDef.fieldDefinitions);
		if (circularResult.hasCircular) {
			errors.push(
				`Circular dependency detected in computed fields: ${circularResult.cyclePath?.join(' -> ')}`
			);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validates a field definition
 * Returns validation result with any errors found
 */
export function validateFieldDefinition(field: Partial<FieldDefinition>): ValidationResult {
	const errors: string[] = [];

	// Validate required fields
	if (field.key === undefined || field.key === null) {
		errors.push('Field must have a key');
	} else if (field.key === '') {
		errors.push('Field key cannot be empty');
	} else {
		// Validate field key format
		if (/\s/.test(field.key)) {
			errors.push('Field key cannot contain spaces');
		}
		if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.key)) {
			if (!/^[a-zA-Z]/.test(field.key)) {
				errors.push('Field key must start with a letter');
			} else {
				errors.push('Field key can only contain letters, numbers, and underscores');
			}
		}
	}

	if (!field.label && field.label !== '') {
		errors.push('Field must have a label');
	} else if (field.label === '') {
		errors.push('Field label cannot be empty');
	}

	if (!field.type) {
		errors.push('Field must have a type');
	} else if (!VALID_FIELD_TYPES.includes(field.type as FieldType)) {
		errors.push(`Field has invalid type: ${field.type}`);
	} else {
		// Type-specific validation
		if (field.type === 'select') {
			if (!field.options) {
				errors.push(`Select field "${field.key}" must have options`);
			} else if (field.options.length === 0) {
				errors.push(`Select field "${field.key}" must have at least one option`);
			} else {
				// Check for duplicate options
				const optionSet = new Set<string>();
				for (const option of field.options) {
					if (option === '') {
						errors.push(`Select field "${field.key}" has empty option`);
					} else if (optionSet.has(option)) {
						errors.push(`Select field "${field.key}" has duplicate option: ${option}`);
					} else {
						optionSet.add(option);
					}
				}
			}
		}

		if (field.type === 'multi-select') {
			if (!field.options) {
				errors.push(`Multi-select field "${field.key}" must have options`);
			} else if (field.options.length === 0) {
				errors.push(`Multi-select field "${field.key}" must have at least one option`);
			}
		}

		if (field.type === 'entity-ref' || field.type === 'entity-refs') {
			if (!field.entityTypes) {
				errors.push(`Entity reference field "${field.key}" must have entityTypes`);
			} else if (field.entityTypes.length === 0) {
				errors.push(`Entity reference field "${field.key}" must have at least one entity type`);
			}
		}

		if (field.type === 'computed') {
			if (!field.computedConfig) {
				errors.push(`Computed field "${field.key}" must have computedConfig`);
			} else {
				if (!field.computedConfig.formula && field.computedConfig.formula !== '') {
					errors.push(`Computed field "${field.key}" must have formula`);
				} else if (field.computedConfig.formula === '') {
					errors.push(`Computed field "${field.key}" formula cannot be empty`);
				}

				if (!field.computedConfig.dependencies) {
					errors.push(`Computed field "${field.key}" must have dependencies array`);
				}

				if (!field.computedConfig.outputType) {
					errors.push(`Computed field "${field.key}" must have outputType`);
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validates that a type key is unique across built-in and custom types
 */
export function validateTypeKeyUniqueness(
	typeKey: string,
	customTypes: EntityTypeDefinition[] = []
): ValidationResult {
	const errors: string[] = [];

	// Check against built-in types (case-sensitive)
	const builtInTypeKeys = BUILT_IN_ENTITY_TYPES.map((t) => t.type);
	if (builtInTypeKeys.includes(typeKey)) {
		errors.push(`Type key "${typeKey}" conflicts with a built-in type`);
	}

	// Check against custom types
	if (customTypes.some((t) => t.type === typeKey)) {
		errors.push(`Type key "${typeKey}" is already in use`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validates computed field formula syntax and dependencies
 */
export function validateComputedFieldFormula(
	formula: string,
	dependencies: string[],
	allFieldKeys: string[]
): ValidationResult {
	const errors: string[] = [];

	// Extract placeholders from formula
	const placeholderRegex = /\{([^}]+)\}/g;
	const matches = [...formula.matchAll(placeholderRegex)];
	const placeholders = new Set(matches.map((m) => m[1]));

	// Check for unclosed placeholders
	const openBraces = (formula.match(/\{/g) || []).length;
	const closeBraces = (formula.match(/\}/g) || []).length;
	if (openBraces !== closeBraces) {
		errors.push('Formula has unclosed placeholder');
		return { valid: false, errors };
	}

	// Check for invalid placeholder syntax (placeholder should only contain valid field names)
	for (const match of matches) {
		const placeholder = match[1];
		if (!placeholder || /\s/.test(placeholder)) {
			errors.push('Formula has invalid placeholder syntax');
			break;
		}
	}

	// Check that all placeholders reference existing fields
	for (const placeholder of placeholders) {
		if (!allFieldKeys.includes(placeholder)) {
			errors.push(`Formula references undefined field: ${placeholder}`);
		}
	}

	// Check that all declared dependencies are used in formula
	for (const dep of dependencies) {
		if (!placeholders.has(dep)) {
			errors.push(`Dependency "${dep}" is not used in formula`);
		}
	}

	// Check that all fields used in formula are declared as dependencies
	for (const placeholder of placeholders) {
		if (!dependencies.includes(placeholder)) {
			errors.push(`Formula uses field "${placeholder}" not in dependencies`);
		}
	}

	// Check for unbalanced parentheses
	const openParens = (formula.match(/\(/g) || []).length;
	const closeParens = (formula.match(/\)/g) || []).length;
	if (openParens !== closeParens) {
		errors.push('Formula has unbalanced parentheses');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Detects circular dependencies in computed field formulas
 */
export function detectCircularDependencies(
	fields: FieldDefinition[]
): { hasCircular: boolean; cyclePath?: string[] } {
	// Build dependency graph
	const graph = new Map<string, Set<string>>();

	for (const field of fields) {
		if (field.type === 'computed' && field.computedConfig) {
			graph.set(field.key, new Set(field.computedConfig.dependencies));
		}
	}

	// Detect cycles using DFS
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const path: string[] = [];

	function dfs(node: string): boolean {
		visited.add(node);
		recursionStack.add(node);
		path.push(node);

		const dependencies = graph.get(node);
		if (dependencies) {
			for (const dep of dependencies) {
				if (!visited.has(dep)) {
					if (dfs(dep)) {
						return true;
					}
				} else if (recursionStack.has(dep)) {
					// Found a cycle
					path.push(dep);
					return true;
				}
			}
		}

		recursionStack.delete(node);
		path.pop();
		return false;
	}

	// Check each computed field for cycles
	for (const field of fields) {
		if (field.type === 'computed' && !visited.has(field.key)) {
			if (dfs(field.key)) {
				return { hasCircular: true, cyclePath: [...path] };
			}
		}
	}

	return { hasCircular: false };
}
