import type { ParsedEntity } from './entityParserService';
import type { EntityTypeDefinition, BaseEntity } from '$lib/types';
import { createEntity } from '$lib/types/entities';
import { entitiesStore } from '$lib/stores/entities.svelte';

export interface SaveEntityResult {
	success: boolean;
	entity?: BaseEntity;
	error?: string;
}

/**
 * Converts a ParsedEntity to a BaseEntity and saves it to the database
 * @param parsed - The parsed entity from the AI response
 * @param customTypes - Optional custom entity type definitions
 * @returns SaveEntityResult with success status and saved entity or error
 */
export async function saveEntityFromParsed(
	parsed: ParsedEntity,
	customTypes?: EntityTypeDefinition[]
): Promise<SaveEntityResult> {
	try {
		// Check for validation errors first
		if (parsed.validationErrors && Object.keys(parsed.validationErrors).length > 0) {
			return {
				success: false,
				error: 'Entity has validation errors'
			};
		}

		// Convert ParsedEntity to NewEntity for saving
		const newEntity = {
			type: parsed.entityType,
			name: parsed.name,
			description: parsed.description,
			summary: parsed.summary,
			tags: parsed.tags,
			fields: parsed.fields,
			notes: '',
			links: [],
			metadata: {}
		};

		// Save to database via entitiesStore
		const savedEntity = await entitiesStore.create(newEntity);

		return {
			success: true,
			entity: savedEntity
		};
	} catch (error) {
		// Handle errors from the save operation
		const errorMessage = error instanceof Error ? error.message : 'Failed to save entity';

		return {
			success: false,
			error: errorMessage
		};
	}
}
