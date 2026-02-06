/**
 * Player Character Context Service
 *
 * Builds full player character context for AI generation when generating content
 * for entities linked to player characters.
 *
 * Key Features:
 * - Finds player characters linked to an entity (both outgoing and incoming)
 * - Builds full character context including all fields (standard + custom)
 * - Excludes hidden/secrets fields for privacy protection
 * - Formats context for AI prompt injection
 *
 * @see GitHub Issue #319
 */

import type { BaseEntity, EntityId } from '$lib/types';
import { entityRepository } from '$lib/db/repositories';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';

/**
 * Information about a linked player character
 */
export interface LinkedCharacterInfo {
	/** The player character entity */
	character: BaseEntity;
	/** The relationship type (e.g., 'knows', 'trusts') */
	relationship: string;
	/** Direction of the relationship (optional, for internal use) */
	direction?: 'outgoing' | 'incoming';
}

/**
 * Full context for a player character
 */
export interface PlayerCharacterContext {
	/** Character name */
	characterName: string;
	/** Relationship to the entity being generated for */
	relationship: string;
	/** Character description */
	description?: string;
	/** Character summary */
	summary?: string;
	/** All character fields (excluding hidden/secrets) */
	fields: Record<string, any>;
	/** Field labels for proper formatting */
	fieldLabels: Record<string, string>;
}

/**
 * Result of building player character context
 */
export interface PlayerCharacterContextResult {
	/** Whether any player character context exists */
	hasContext: boolean;
	/** List of linked characters (if any) */
	linkedCharacters?: LinkedCharacterInfo[];
	/** Full context for each character (if any) */
	contexts?: PlayerCharacterContext[];
	/** Formatted context string ready for AI prompt */
	formattedContext: string;
	/** Number of linked characters */
	characterCount?: number;
}

/**
 * Find all player characters linked to an entity.
 * Checks both outgoing and incoming relationships.
 *
 * @param entityId - The entity to find linked characters for
 * @returns Array of linked player character information
 * @throws Error if entity not found
 */
export async function findLinkedPlayerCharacters(
	entityId: EntityId
): Promise<LinkedCharacterInfo[]> {
	// Get the source entity
	const entity = await entityRepository.getById(entityId);
	if (!entity) {
		throw new Error('Entity not found');
	}

	const linkedCharacters: LinkedCharacterInfo[] = [];

	// Find outgoing relationships to characters
	if (entity.links && entity.links.length > 0) {
		const characterLinks = entity.links.filter((link) => link.targetType === 'character');

		if (characterLinks.length > 0) {
			const targetIds = characterLinks.map((link) => link.targetId);
			const targetEntities = await entityRepository.getByIds(targetIds);

			if (targetEntities) {
				for (const link of characterLinks) {
					const character = targetEntities.find((e) => e.id === link.targetId);
					if (character && character.type === 'character') {
						linkedCharacters.push({
							character,
							relationship: link.relationship,
							direction: 'outgoing'
						});
					}
				}
			}
		}
	}

	// Find incoming relationships from characters
	const incomingEntities = await entityRepository.getEntitiesLinkingTo(entityId);
	for (const incomingEntity of incomingEntities) {
		if (incomingEntity.type === 'character') {
			// Find the link that points to our entity
			const link = incomingEntity.links.find((l) => l.targetId === entityId);
			if (link) {
				linkedCharacters.push({
					character: incomingEntity,
					relationship: link.relationship,
					direction: 'incoming'
				});
			}
		}
	}

	return linkedCharacters;
}

/**
 * Build full context for a player character.
 * Includes all fields (standard + custom) except hidden/secrets fields.
 *
 * @param linkedChar - The linked character information
 * @returns Full character context with all non-hidden fields
 */
export async function buildFullCharacterContext(
	linkedChar: LinkedCharacterInfo
): Promise<PlayerCharacterContext> {
	const { character, relationship } = linkedChar;

	// Get the character type definition to access field definitions
	const typeDef = getEntityTypeDefinition('character');

	const fields: Record<string, any> = {};
	const fieldLabels: Record<string, string> = {};

	// Process all fields from the character
	for (const [key, value] of Object.entries(character.fields)) {
		// Skip empty/null/undefined values
		if (value === null || value === undefined || value === '') {
			continue;
		}

		// Find the field definition
		const fieldDef = typeDef?.fieldDefinitions.find((f) => f.key === key);

		// Skip hidden section fields (like secrets)
		if (fieldDef?.section === 'hidden') {
			continue;
		}

		// Include the field
		fields[key] = value;

		// Store the label
		fieldLabels[key] = fieldDef?.label ?? key;
	}

	return {
		characterName: character.name,
		relationship,
		description: character.description,
		summary: character.summary,
		fields,
		fieldLabels
	};
}

/**
 * Format player character contexts for AI prompt injection.
 * Creates a clearly labeled section with all character information.
 *
 * @param contexts - Array of player character contexts
 * @returns Formatted string for AI prompt (empty string if no contexts)
 */
export function formatPlayerCharacterContextForPrompt(
	contexts: PlayerCharacterContext[]
): string {
	if (contexts.length === 0) {
		return '';
	}

	let output = '=== Player Character Context ===\n';

	for (const context of contexts) {
		output += `\nCharacter: ${context.characterName}\n`;
		output += `Relationship: ${context.relationship}\n`;

		if (context.description) {
			output += `Description: ${context.description}\n`;
		}

		if (context.summary) {
			output += `Summary: ${context.summary}\n`;
		}

		// Add all fields
		for (const [key, value] of Object.entries(context.fields)) {
			const label = context.fieldLabels[key] || key;
			const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
			output += `${label}: ${displayValue}\n`;
		}
	}

	return output;
}

/**
 * Build complete player character context for an entity.
 * This is the main entry point that combines all the functionality.
 *
 * @param entityId - The entity to build PC context for
 * @returns Complete context result with formatted prompt section
 */
export async function buildPlayerCharacterContext(
	entityId: EntityId
): Promise<PlayerCharacterContextResult> {
	// Find linked player characters
	const linkedCharacters = await findLinkedPlayerCharacters(entityId);

	// If no linked characters, return empty result
	if (linkedCharacters.length === 0) {
		return {
			hasContext: false,
			formattedContext: ''
		};
	}

	// Build full context for each character
	const contexts: PlayerCharacterContext[] = [];
	for (const linkedChar of linkedCharacters) {
		const context = await buildFullCharacterContext(linkedChar);
		contexts.push(context);
	}

	// Format for AI prompt
	const formattedContext = formatPlayerCharacterContextForPrompt(contexts);

	return {
		hasContext: true,
		linkedCharacters,
		contexts,
		formattedContext,
		characterCount: linkedCharacters.length
	};
}
