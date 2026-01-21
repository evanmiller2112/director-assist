/**
 * Entity Type Export/Import Types (GitHub Issue #210)
 *
 * Type definitions for exporting and importing custom entity types and field templates.
 * Enables sharing of custom entity configurations as JSON files.
 */

import type { EntityTypeDefinition } from './entities';
import type { FieldTemplate } from './campaign';

/**
 * Export format for entity types and field templates
 * Version 1.0.0 structure
 */
export interface EntityTypeExport {
	version: '1.0.0'; // Export format version
	exportedAt: Date; // Timestamp of export
	generator: {
		name: 'Director Assist'; // Application name
		version: string; // Application version (e.g., "0.8.0")
	};
	type: 'entity-type' | 'field-template'; // Type of export
	data: EntityTypeDefinition | FieldTemplate; // The exported data
	metadata: {
		// Optional metadata about the export
		author?: string; // Creator of the entity type/template
		sourceUrl?: string; // URL to original source
		license?: string; // License information (e.g., "CC-BY-4.0", "MIT")
		[key: string]: unknown; // Allow additional custom metadata
	};
}

/**
 * Result of import validation
 * Provides validation status, errors, warnings, and preview information
 */
export interface ImportValidationResult {
	valid: boolean; // Whether the import data is valid
	errors: string[]; // Critical errors that prevent import
	warnings: string[]; // Non-critical warnings (e.g., old version, potential conflicts)
	preview: {
		// Preview information for user before importing
		name: string; // Name of the entity type or template
		type: 'entity-type' | 'field-template'; // Type being imported
		fieldCount: number; // Number of field definitions
		conflictsWithExisting: boolean; // Whether this conflicts with existing data
	};
}
