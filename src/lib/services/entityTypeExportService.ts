/**
 * Entity Type Export/Import Service (GitHub Issue #210)
 *
 * Provides functionality to export and import custom entity types and field templates
 * as JSON files. This enables sharing of custom configurations between campaigns and users.
 *
 * Export Format (Version 1.0.0):
 * - Standardized JSON structure with version tracking
 * - Includes metadata (author, license, source URL)
 * - Generator information for compatibility tracking
 * - Supports both entity types and field templates
 *
 * Import Validation:
 * - Version compatibility checking
 * - Data structure validation
 * - Conflict detection with existing types
 * - Preview information before import
 */

import type {
	EntityTypeDefinition,
	FieldTemplate,
	EntityTypeExport,
	ImportValidationResult
} from '$lib/types';

/**
 * Export format version
 * Follow semver: increment major for breaking changes
 */
export const EXPORT_VERSION = '1.0.0' as const;

/**
 * Application version - used in generator field
 * Read from package.json or use fallback
 */
const APP_VERSION = '0.9.0'; // This should match package.json version

/**
 * Export an entity type definition to JSON format
 *
 * @param definition - The entity type definition to export
 * @param metadata - Optional metadata about the export (author, license, source URL)
 * @returns Export object ready to be serialized to JSON
 *
 * @example
 * ```ts
 * const monsterType = getEntityType('custom_monster');
 * const exported = exportEntityType(monsterType, {
 *   author: 'John Doe',
 *   license: 'CC-BY-4.0'
 * });
 * const json = JSON.stringify(exported, null, 2);
 * // Save to file or share
 * ```
 */
export function exportEntityType(
	definition: EntityTypeDefinition,
	metadata?: { author?: string; sourceUrl?: string; license?: string }
): EntityTypeExport {
	return {
		version: EXPORT_VERSION,
		exportedAt: new Date(),
		generator: {
			name: 'Director Assist',
			version: APP_VERSION
		},
		type: 'entity-type',
		data: definition,
		metadata: metadata ?? {}
	};
}

/**
 * Export a field template to JSON format
 *
 * @param template - The field template to export
 * @param metadata - Optional metadata about the export (author, license, source URL)
 * @returns Export object ready to be serialized to JSON
 *
 * @example
 * ```ts
 * const template = campaignStore.getFieldTemplate('combat-stats');
 * const exported = exportFieldTemplate(template, {
 *   author: 'Jane Smith',
 *   license: 'MIT'
 * });
 * const json = JSON.stringify(exported, null, 2);
 * ```
 */
export function exportFieldTemplate(
	template: FieldTemplate,
	metadata?: { author?: string; sourceUrl?: string; license?: string }
): EntityTypeExport {
	return {
		version: EXPORT_VERSION,
		exportedAt: new Date(),
		generator: {
			name: 'Director Assist',
			version: APP_VERSION
		},
		type: 'field-template',
		data: template,
		metadata: metadata ?? {}
	};
}

/**
 * Validate import data and provide preview information
 *
 * Checks for:
 * - Valid version (currently only 1.0.0 supported)
 * - Required fields (version, type, data, exportedAt, generator)
 * - Data structure validity (entity type or field template)
 * - Conflicts with existing types/templates
 *
 * @param data - The import data to validate (from JSON.parse)
 * @param existingTypes - Array of existing entity type keys to check for conflicts
 * @param existingTemplateIds - Array of existing template IDs to check for conflicts
 * @returns Validation result with errors, warnings, and preview information
 *
 * @example
 * ```ts
 * const jsonData = JSON.parse(fileContents);
 * const existingTypes = ['character', 'npc', 'custom_monster'];
 * const result = validateImport(jsonData, existingTypes);
 * if (!result.valid) {
 *   console.error('Import failed:', result.errors);
 * } else {
 *   console.log('Preview:', result.preview);
 * }
 * ```
 */
export function validateImport(
	data: unknown,
	existingTypes?: string[],
	existingTemplateIds?: string[]
): ImportValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	let preview = {
		name: '',
		type: 'entity-type' as 'entity-type' | 'field-template',
		fieldCount: 0,
		conflictsWithExisting: false
	};

	// Handle null/undefined
	if (data === null || data === undefined) {
		errors.push('Import data is null or undefined');
		return { valid: false, errors, warnings, preview };
	}

	// Must be an object
	if (typeof data !== 'object') {
		errors.push('Import data must be an object');
		return { valid: false, errors, warnings, preview };
	}

	const exportData = data as Record<string, unknown>;

	// Validate version
	if (!exportData.version) {
		errors.push('Missing required field: version');
	} else if (exportData.version !== '1.0.0') {
		errors.push(`Unsupported version: ${exportData.version}. Only version 1.0.0 is supported.`);
	}

	// Validate required fields
	if (!exportData.type) {
		errors.push('Missing required field: type');
	}
	if (!exportData.data) {
		errors.push('Missing required field: data');
	}
	if (!exportData.exportedAt) {
		errors.push('Missing required field: exportedAt');
	}
	if (!exportData.generator) {
		errors.push('Missing required field: generator');
	}

	// If basic validation failed, return early
	if (errors.length > 0) {
		return { valid: false, errors, warnings, preview };
	}

	// Validate type field
	const type = exportData.type as string;
	if (type !== 'entity-type' && type !== 'field-template') {
		errors.push(`Invalid type: ${type}. Must be 'entity-type' or 'field-template'.`);
		return { valid: false, errors, warnings, preview };
	}

	preview.type = type as 'entity-type' | 'field-template';

	// Validate data structure based on type
	const exportedData = exportData.data as Record<string, unknown>;
	if (!exportedData || typeof exportedData !== 'object') {
		errors.push('Data field must be an object');
		return { valid: false, errors, warnings, preview };
	}

	if (type === 'entity-type') {
		// Validate EntityTypeDefinition structure
		const entityType = exportedData as Partial<EntityTypeDefinition>;

		if (!entityType.type || typeof entityType.type !== 'string') {
			errors.push('Entity type data missing or invalid: type');
		}
		if (!entityType.label || typeof entityType.label !== 'string') {
			errors.push('Entity type data missing or invalid: label');
		}
		if (!entityType.icon || typeof entityType.icon !== 'string') {
			errors.push('Entity type data missing or invalid: icon');
		}
		if (!entityType.color || typeof entityType.color !== 'string') {
			errors.push('Entity type data missing or invalid: color');
		}
		if (entityType.isBuiltIn === undefined || typeof entityType.isBuiltIn !== 'boolean') {
			errors.push('Entity type data missing or invalid: isBuiltIn');
		}
		if (!Array.isArray(entityType.fieldDefinitions)) {
			errors.push('Entity type data missing or invalid: fieldDefinitions');
		} else {
			// Validate field definitions
			entityType.fieldDefinitions.forEach((field, index) => {
				if (!field.key || typeof field.key !== 'string') {
					errors.push(`Entity type field definition ${index} missing or invalid: key`);
				}
				if (!field.label || typeof field.label !== 'string') {
					errors.push(`Entity type field definition ${index} missing or invalid: label`);
				}
				if (!field.type || typeof field.type !== 'string') {
					errors.push(`Entity type field definition ${index} missing or invalid: type`);
				}
				if (field.required === undefined || typeof field.required !== 'boolean') {
					errors.push(`Entity type field definition ${index} missing or invalid: required`);
				}
				if (field.order === undefined || typeof field.order !== 'number') {
					errors.push(`Entity type field definition ${index} missing or invalid: order`);
				}
			});

			preview.fieldCount = entityType.fieldDefinitions.length;
		}
		if (!Array.isArray(entityType.defaultRelationships)) {
			errors.push('Entity type data missing or invalid: defaultRelationships');
		}

		if (entityType.label) {
			preview.name = entityType.label;
		}

		// Check for conflicts
		if (existingTypes && entityType.type && existingTypes.includes(entityType.type)) {
			preview.conflictsWithExisting = true;
			warnings.push(
				`An entity type with key "${entityType.type}" already exists. Importing will require choosing a different key.`
			);
		}
	} else if (type === 'field-template') {
		// Validate FieldTemplate structure
		const template = exportedData as Partial<FieldTemplate>;

		if (!template.id || typeof template.id !== 'string') {
			errors.push('Field template data missing or invalid: id');
		}
		if (!template.name || typeof template.name !== 'string') {
			errors.push('Field template data missing or invalid: name');
		}
		if (!template.category || typeof template.category !== 'string') {
			errors.push('Field template data missing or invalid: category');
		}
		if (!Array.isArray(template.fieldDefinitions)) {
			errors.push('Field template data missing or invalid: fieldDefinitions');
		} else {
			// Validate field definitions (same as entity type)
			template.fieldDefinitions.forEach((field, index) => {
				if (!field.key || typeof field.key !== 'string') {
					errors.push(`Template field definition ${index} missing or invalid: key`);
				}
				if (!field.label || typeof field.label !== 'string') {
					errors.push(`Template field definition ${index} missing or invalid: label`);
				}
				if (!field.type || typeof field.type !== 'string') {
					errors.push(`Template field definition ${index} missing or invalid: type`);
				}
				if (field.required === undefined || typeof field.required !== 'boolean') {
					errors.push(`Template field definition ${index} missing or invalid: required`);
				}
				if (field.order === undefined || typeof field.order !== 'number') {
					errors.push(`Template field definition ${index} missing or invalid: order`);
				}
			});

			preview.fieldCount = template.fieldDefinitions.length;
		}
		if (!template.createdAt) {
			errors.push('Field template data missing or invalid: createdAt');
		}
		if (!template.updatedAt) {
			errors.push('Field template data missing or invalid: updatedAt');
		}

		if (template.name) {
			preview.name = template.name;
		}

		// Check for conflicts
		if (existingTemplateIds && template.id && existingTemplateIds.includes(template.id)) {
			preview.conflictsWithExisting = true;
			warnings.push(
				`A field template with ID "${template.id}" already exists. Importing will replace the existing template.`
			);
		}
	}

	// Check for old version warning
	const generator = exportData.generator as Record<string, unknown>;
	if (generator?.version && typeof generator.version === 'string') {
		const exportVersion = generator.version;
		// Simple version comparison - just check if it's very old
		const [major] = exportVersion.split('.').map(Number);
		if (major === 0 && exportVersion !== APP_VERSION) {
			warnings.push(
				`This export was created with an old version of Director Assist (${exportVersion}). Some features may not be fully compatible.`
			);
		}
	}

	// Check for old export date warning
	if (exportData.exportedAt) {
		const exportDate = new Date(exportData.exportedAt as string);
		const now = new Date();
		const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
		if (exportDate < yearAgo) {
			warnings.push('This export is over a year old and may not include newer features.');
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		preview
	};
}
