import type { EntityType, FieldValue } from '$lib/types';
import type { FieldDefinition as RealFieldDefinition, EntityTypeDefinition as RealEntityTypeDefinition } from '$lib/types';

// Local flexible types for tests and compatibility
interface FieldDefinition {
	key: string;
	label: string;
	type: string;
	section?: string;
	[key: string]: unknown;
}

export interface EntityTypeDefinition {
	type?: EntityType;
	label?: string;
	fieldDefinitions?: FieldDefinition[];
	[key: string]: unknown;
}

export interface ContextSummaryInput {
	entityType: EntityType;
	typeDefinition?: EntityTypeDefinition | RealEntityTypeDefinition;
	currentValues: {
		name?: string;
		description?: string;
		tags?: string[];
		notes?: string;
		fields: Record<string, FieldValue>;
	};
	campaignContext?: {
		name: string;
		setting: string;
		system: string;
	};
	targetFieldKey?: string;
}

const MAX_STRING_LENGTH = 100;
const MAX_FIELDS_SHOWN = 5;

/**
 * Formats a context summary for display in tooltips on Generate buttons.
 * Lists available context by name/title, excluding target field and hidden fields.
 */
export function formatContextSummary(input: ContextSummaryInput): string {
	const sections: string[] = [];

	// Campaign Context
	if (input.campaignContext) {
		const campaignParts: string[] = [];
		if (input.campaignContext.name) {
			campaignParts.push(`Campaign: ${input.campaignContext.name}`);
		}
		if (input.campaignContext.setting) {
			campaignParts.push(`Setting: ${input.campaignContext.setting}`);
		}
		if (input.campaignContext.system) {
			campaignParts.push(`System: ${input.campaignContext.system}`);
		}
		if (campaignParts.length > 0) {
			sections.push(campaignParts.join('\n'));
		}
	}

	// Entity Metadata
	const metadataParts: string[] = [];

	if (input.currentValues.name) {
		metadataParts.push(`Name: ${truncateString(input.currentValues.name)}`);
	}

	if (input.currentValues.description) {
		metadataParts.push(`Description: ${truncateString(input.currentValues.description)}`);
	}

	if (input.currentValues.tags && input.currentValues.tags.length > 0) {
		metadataParts.push(`Tags: ${input.currentValues.tags.join(', ')}`);
	}

	if (input.currentValues.notes) {
		metadataParts.push(`Notes: ${truncateString(input.currentValues.notes)}`);
	}

	if (metadataParts.length > 0) {
		sections.push(metadataParts.join('\n'));
	}

	// Fields
	const fieldParts: string[] = [];
	const fieldEntries = Object.entries(input.currentValues.fields);

	// Get the field definitions array
	const fieldDefs = input.typeDefinition?.fieldDefinitions;

	for (const [key, value] of fieldEntries) {
		// Skip if this is the target field
		if (input.targetFieldKey && key === input.targetFieldKey) {
			continue;
		}

		// Skip if field is in a hidden section
		if (fieldDefs) {
			const fieldDef = fieldDefs.find((f) => f.key === key);
			if (fieldDef?.section === 'hidden') {
				continue;
			}
		}

		// Skip empty values
		if (!hasValue(value)) {
			continue;
		}

		// Get field label
		const label = getFieldLabel(key, input.typeDefinition);
		const formattedValue = formatFieldValue(value);

		if (formattedValue) {
			fieldParts.push(`${label}: ${formattedValue}`);
		}

		// Stop if we've reached the max fields
		if (fieldParts.length >= MAX_FIELDS_SHOWN) {
			break;
		}
	}

	if (fieldParts.length > 0) {
		sections.push(fieldParts.join('\n'));

		// Add overflow message if there are more fields
		const remainingFields = fieldEntries.filter(([key, value]) => {
			if (input.targetFieldKey && key === input.targetFieldKey) return false;
			if (fieldDefs) {
				const fieldDef = fieldDefs.find((f) => f.key === key);
				if (fieldDef?.section === 'hidden') return false;
			}
			return hasValue(value);
		}).length - MAX_FIELDS_SHOWN;

		if (remainingFields > 0) {
			sections.push(`...and ${remainingFields} more`);
		}
	}

	// Return default message if no context
	if (sections.length === 0) {
		return 'No context available';
	}

	return sections.join('\n\n');
}

function truncateString(str: string): string {
	if (str.length <= MAX_STRING_LENGTH) {
		return str;
	}
	return str.substring(0, MAX_STRING_LENGTH) + '...';
}

function hasValue(value: FieldValue): boolean {
	if (value === null || value === undefined) {
		return false;
	}
	if (typeof value === 'string' && value.trim() === '') {
		return false;
	}
	if (Array.isArray(value) && value.length === 0) {
		return false;
	}
	return true;
}

function getFieldLabel(key: string, typeDefinition?: EntityTypeDefinition | RealEntityTypeDefinition): string {
	if (!typeDefinition || !typeDefinition.fieldDefinitions) {
		// Convert camelCase to Title Case
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}

	const fieldDef = typeDefinition.fieldDefinitions.find((f) => f.key === key);
	return fieldDef?.label || key;
}

function formatFieldValue(value: FieldValue): string {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'boolean') {
		return value ? 'Yes' : 'No';
	}

	if (typeof value === 'number') {
		return value.toString();
	}

	if (Array.isArray(value)) {
		return truncateString(value.join(', '));
	}

	if (typeof value === 'string') {
		return truncateString(value);
	}

	return '';
}
