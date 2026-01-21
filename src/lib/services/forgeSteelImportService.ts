/**
 * Forge Steel Import Service
 *
 * Service functions for validating and mapping Forge Steel character data
 * to Director Assist entities.
 */

import type { NewEntity } from '$lib/types';
import type { ForgeSteelHero } from '$lib/types/forgeSteel';
import { validateForgeSteelHeroStructure } from '$lib/types/forgeSteel';

export interface ImportValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Validates a Forge Steel hero for import
 * @param data - The hero data to validate
 * @param existingCharacterNames - Array of existing character names to check for conflicts
 * @returns Validation result with errors and warnings
 */
export function validateForgeSteelImport(
	data: unknown,
	existingCharacterNames: string[]
): ImportValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for null/undefined
	if (data === null || data === undefined) {
		errors.push('Import data is null or undefined');
		return { valid: false, errors, warnings };
	}

	// Check that data is an object
	if (typeof data !== 'object' || Array.isArray(data)) {
		errors.push('Import data must be an object');
		return { valid: false, errors, warnings };
	}

	// Validate structure
	const structureValidation = validateForgeSteelHeroStructure(data);
	if (!structureValidation.valid) {
		// Replace "Hero name" with "Character name" for import context
		const importErrors = structureValidation.errors.map((error) =>
			error.replace('Hero name cannot be empty', 'Character name cannot be empty')
		);
		errors.push(...importErrors);
	}

	// If we have fatal errors, return early
	if (errors.length > 0) {
		return { valid: false, errors, warnings };
	}

	// At this point we know it's a valid ForgeSteelHero
	const hero = data as ForgeSteelHero;

	// Check for name conflicts (case-insensitive)
	const trimmedName = hero.name.trim();
	const nameExists = existingCharacterNames.some(
		(existingName) => existingName.toLowerCase() === trimmedName.toLowerCase()
	);
	if (nameExists) {
		errors.push(
			`A character named "${hero.name}" already exists. Please rename before importing.`
		);
	}

	// Warnings for incomplete data
	if (hero.ancestry === null) {
		warnings.push('Character has no ancestry defined - concept field will be incomplete');
	}

	if (hero.class === null) {
		warnings.push('Character has no class defined - concept field will be incomplete');
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Maps a Forge Steel hero to a Director Assist NewEntity
 * @param hero - The validated Forge Steel hero
 * @returns A NewEntity ready to be saved
 */
export function mapForgeSteelHeroToEntity(hero: ForgeSteelHero): NewEntity {
	// Build concept field from ancestry and class
	const ancestryName = hero.ancestry?.name || '';
	const className = hero.class?.name || '';
	const concept = [ancestryName, className]
		.filter((part) => part.trim() !== '')
		.join(' ')
		.trim();

	// Map defeated status
	const status = hero.state.defeated ? 'deceased' : 'active';

	return {
		type: 'character',
		name: hero.name.trim(),
		description: '',
		tags: ['forge-steel-import'],
		fields: {
			concept,
			background: hero.state.notes,
			status
		},
		links: [],
		notes: 'Imported from Forge Steel',
		metadata: {}
	};
}
