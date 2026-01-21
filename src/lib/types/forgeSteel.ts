/**
 * Forge Steel Import Type Definitions
 *
 * Types and type guards for importing character data from Forge Steel
 * character builder into Director Assist entities.
 */

// Forge Steel data structure types
export interface ForgeSteelAncestry {
	name: string;
	[key: string]: unknown; // Allow additional properties
}

export interface ForgeSteelClass {
	name: string;
	level: number;
	[key: string]: unknown; // Allow additional properties
}

export interface ForgeSteelState {
	notes: string;
	defeated: boolean;
	[key: string]: unknown; // Allow additional properties
}

export interface ForgeSteelHero {
	id: string;
	name: string;
	ancestry: ForgeSteelAncestry | null;
	class: ForgeSteelClass | null;
	state: ForgeSteelState;
}

// Validation result type
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

// Type guards
export function isForgeSteelAncestry(value: unknown): value is ForgeSteelAncestry | null {
	if (value === null) {
		return true;
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const obj = value as Record<string, unknown>;

	if (!('name' in obj) || typeof obj.name !== 'string' || obj.name.trim() === '') {
		return false;
	}

	return true;
}

export function isForgeSteelClass(value: unknown): value is ForgeSteelClass | null {
	if (value === null) {
		return true;
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const obj = value as Record<string, unknown>;

	if (!('name' in obj) || typeof obj.name !== 'string' || obj.name.trim() === '') {
		return false;
	}

	if (!('level' in obj) || typeof obj.level !== 'number' || obj.level <= 0) {
		return false;
	}

	return true;
}

export function isForgeSteelState(value: unknown): value is ForgeSteelState {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const obj = value as Record<string, unknown>;

	if (!('notes' in obj) || typeof obj.notes !== 'string') {
		return false;
	}

	if (!('defeated' in obj) || typeof obj.defeated !== 'boolean') {
		return false;
	}

	return true;
}

export function isForgeSteelHero(value: unknown): value is ForgeSteelHero {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}

	const obj = value as Record<string, unknown>;

	// Check required id field
	if (!('id' in obj) || typeof obj.id !== 'string') {
		return false;
	}

	// Check required name field
	if (!('name' in obj) || typeof obj.name !== 'string' || obj.name.trim() === '') {
		return false;
	}

	// Check ancestry field (can be null)
	if (!('ancestry' in obj) || !isForgeSteelAncestry(obj.ancestry)) {
		return false;
	}

	// Check class field (can be null)
	if (!('class' in obj) || !isForgeSteelClass(obj.class)) {
		return false;
	}

	// Check state field (required)
	if (!('state' in obj) || !isForgeSteelState(obj.state)) {
		return false;
	}

	return true;
}

// Validation function for detailed error messages
export function validateForgeSteelHeroStructure(hero: unknown): ValidationResult {
	const errors: string[] = [];

	if (typeof hero !== 'object' || hero === null || Array.isArray(hero)) {
		errors.push('Hero must be an object');
		return { valid: false, errors };
	}

	const obj = hero as Record<string, unknown>;

	// Validate id
	if (!('id' in obj)) {
		errors.push('Missing required field: id');
	} else if (typeof obj.id !== 'string') {
		errors.push('Field "id" must be a string');
	}

	// Validate name
	if (!('name' in obj)) {
		errors.push('Missing required field: name');
	} else if (typeof obj.name !== 'string') {
		errors.push('Field "name" must be a string');
	} else if (obj.name.trim() === '') {
		errors.push('Hero name cannot be empty');
	}

	// Validate ancestry
	if ('ancestry' in obj && !isForgeSteelAncestry(obj.ancestry)) {
		errors.push('Invalid ancestry structure');
	}

	// Validate class
	if ('class' in obj && !isForgeSteelClass(obj.class)) {
		errors.push('Invalid class structure');
	}

	// Validate state
	if (!('state' in obj)) {
		errors.push('Missing required field: state');
	} else if (!isForgeSteelState(obj.state)) {
		errors.push('Invalid state structure');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
