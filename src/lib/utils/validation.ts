import type { FieldDefinition, FieldValue } from '$lib/types';

export interface ValidationResult {
	valid: boolean;
	errors: Record<string, string>;
}

/**
 * Validate a single field value against its definition
 */
export function validateField(definition: FieldDefinition, value: FieldValue): string | null {
	// Required check (applies to all field types)
	if (definition.required) {
		if (value === null || value === undefined) {
			return `${definition.label} is required`;
		}
		if (typeof value === 'string' && !value.trim()) {
			return `${definition.label} is required`;
		}
		if (Array.isArray(value) && value.length === 0) {
			return `${definition.label} is required`;
		}
	}

	// Skip further validation if empty and not required
	if (value === null || value === undefined || value === '') {
		return null;
	}

	// Type-specific validation
	return validateByType(definition, value);
}

function validateByType(definition: FieldDefinition, value: FieldValue): string | null {
	switch (definition.type) {
		case 'text':
		case 'textarea':
		case 'richtext':
			return null; // Basic string validation handled by required check

		case 'number':
			return validateNumber(definition, value);

		case 'select':
			return validateSelect(definition, value as string);

		case 'multi-select':
		case 'tags':
			return validateArray(definition, value);

		case 'url':
			return validateUrl(definition, value as string);

		case 'date':
			// Dates in this app are free-form strings (e.g., "Year 1042, Third Age")
			return null;

		case 'entity-ref':
		case 'entity-refs':
			// Reference validation would be async - skip for now
			return null;

		case 'boolean':
			// Boolean values are inherently valid
			return null;

		case 'image':
			// Image URLs - validates format and security concerns
			return validateImageUrl(definition, value);

		default:
			return null;
	}
}

function validateNumber(definition: FieldDefinition, value: FieldValue): string | null {
	if (typeof value === 'string') {
		// Try to parse string as number
		const parsed = parseFloat(value);
		if (isNaN(parsed)) {
			return `${definition.label} must be a valid number`;
		}
	} else if (typeof value !== 'number' || isNaN(value)) {
		return `${definition.label} must be a valid number`;
	}
	return null;
}

function validateSelect(definition: FieldDefinition, value: string): string | null {
	// Note: Issue #429 originally disabled strict validation to allow custom values.
	// However, for entities parsed from AI responses, we want to validate against options
	// to catch AI hallucinations like "Resurrected" when only "Alive/Deceased/Unknown" are valid.
	// This validation helps maintain data quality for AI-generated content.

	// If options are defined, validate the value is one of them
	if (definition.options && definition.options.length > 0) {
		if (!definition.options.includes(value)) {
			return `${definition.label} must be one of the available options: ${definition.options.join(', ')}`;
		}
	}

	return null;
}

function validateArray(definition: FieldDefinition, value: FieldValue): string | null {
	if (value !== null && value !== undefined && !Array.isArray(value)) {
		return `${definition.label} must be an array`;
	}

	// For multi-select, validate that all selected values are from allowed options
	if (definition.type === 'multi-select' && Array.isArray(value)) {
		// Check for duplicates
		const uniqueValues = new Set(value);
		if (uniqueValues.size !== value.length) {
			return `${definition.label} contains duplicate values`;
		}

		// Only validate against options if options are defined
		if (definition.options && definition.options.length >= 0) {
			const invalidValues = value.filter((v) => !definition.options!.includes(v as string));
			if (invalidValues.length > 0) {
				// Report only the first invalid value
				return `${definition.label} contains invalid option: ${invalidValues[0]}`;
			}
		}
	}

	return null;
}

function validateUrl(definition: FieldDefinition, value: string): string | null {
	if (typeof value !== 'string' || !value.trim()) {
		return null; // Empty is ok if not required
	}
	try {
		new URL(value);
		return null;
	} catch {
		return `${definition.label} must be a valid URL`;
	}
}

function validateImageUrl(definition: FieldDefinition, value: FieldValue): string | null {
	// Type check: must be a string
	if (value !== null && value !== undefined && typeof value !== 'string') {
		return `${definition.label} must be a string`;
	}

	// Empty/null is ok if not required
	if (typeof value !== 'string' || !value.trim()) {
		return null;
	}

	const trimmedValue = value.trim().toLowerCase();

	// Security: Reject javascript: protocol (XSS prevention)
	if (trimmedValue.startsWith('javascript:')) {
		return `${definition.label} must be a valid image URL or data URL`;
	}

	// Security: Reject data:text/html (XSS prevention)
	if (trimmedValue.startsWith('data:text/html')) {
		return `${definition.label} must be a valid image URL or data URL`;
	}

	// Security: Reject blob: URLs (not persistable)
	if (trimmedValue.startsWith('blob:')) {
		return `${definition.label} must be a valid image URL or data URL`;
	}

	// For data: URLs, verify it's an image MIME type
	if (trimmedValue.startsWith('data:')) {
		if (!trimmedValue.startsWith('data:image/')) {
			return `${definition.label} must be a valid image URL or data URL`;
		}
		return null; // Valid data:image/* URL
	}

	// For other URLs, validate as URL but return image-specific error message
	try {
		new URL(value);
		return null;
	} catch {
		return `${definition.label} must be a valid image URL or data URL`;
	}
}

/**
 * Validate the core entity fields (name)
 */
export function validateCoreFields(name: string): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!name.trim()) {
		errors.name = 'Name is required';
	}

	return errors;
}

/**
 * Validate all dynamic fields against their definitions
 */
export function validateDynamicFields(
	fields: Record<string, FieldValue>,
	definitions: FieldDefinition[]
): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const definition of definitions) {
		// Skip hidden/secret fields from validation
		if (definition.section === 'hidden') {
			continue;
		}

		const value = fields[definition.key];
		const error = validateField(definition, value);
		if (error) {
			errors[definition.key] = error;
		}
	}

	return errors;
}

/**
 * Full entity validation - combines core and dynamic field validation
 */
export function validateEntity(
	name: string,
	fields: Record<string, FieldValue>,
	definitions: FieldDefinition[]
): ValidationResult {
	const coreErrors = validateCoreFields(name);
	const fieldErrors = validateDynamicFields(fields, definitions);

	const errors = { ...coreErrors, ...fieldErrors };

	return {
		valid: Object.keys(errors).length === 0,
		errors
	};
}
