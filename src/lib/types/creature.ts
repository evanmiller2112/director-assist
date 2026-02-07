/**
 * Creature Template Types for Draw Steel Monster Database
 *
 * Issue #305: Creature Templates for Monsters
 *
 * This module defines types for creature templates, which are pre-configured
 * monster stat blocks that can be used to quickly add creatures to combat.
 *
 * Key Features:
 * - Threat levels: 1 (minion/standard), 2 (elite), 3 (boss/solo)
 * - Creature roles from Draw Steel (Ambusher, Artillery, Brute, etc.)
 * - Tag-based categorization for filtering and organization
 * - Abilities for reference during combat
 * - Templates can be created from ad-hoc combat creatures
 * - Import/export library functionality
 */

// ============================================================================
// Threat Levels
// ============================================================================

/**
 * Draw Steel threat level for creatures.
 * - 1: Minion or Standard creature
 * - 2: Elite creature (tougher, more dangerous)
 * - 3: Boss or Solo creature (major encounter)
 */
export type ThreatLevel = 1 | 2 | 3;

/**
 * Type guard to check if a value is a valid threat level.
 */
export function isValidThreatLevel(value: unknown): value is ThreatLevel {
	return typeof value === 'number' && (value === 1 || value === 2 || value === 3);
}

// ============================================================================
// Creature Roles
// ============================================================================

/**
 * Draw Steel creature roles that define combat behavior and tactics.
 */
export type CreatureRole =
	| 'Ambusher' // Strikes from stealth/surprise
	| 'Artillery' // Ranged attacks, stays at distance
	| 'Brute' // High damage, direct combat
	| 'Controller' // Battlefield control, area effects
	| 'Defender' // Protects allies, high AC/HP
	| 'Harrier' // Mobile, hit-and-run tactics
	| 'Hexer' // Debuffs and curses
	| 'Leader' // Buffs allies, commands
	| 'Mount' // Carries riders
	| 'Support'; // Heals and assists allies

/**
 * Type guard to check if a value is a valid creature role.
 */
export function isValidCreatureRole(value: unknown): value is CreatureRole {
	if (typeof value !== 'string') return false;

	const validRoles: CreatureRole[] = [
		'Ambusher',
		'Artillery',
		'Brute',
		'Controller',
		'Defender',
		'Harrier',
		'Hexer',
		'Leader',
		'Mount',
		'Support'
	];

	return validRoles.includes(value as CreatureRole);
}

// ============================================================================
// Creature Abilities
// ============================================================================

/**
 * Ability type classification for creature actions.
 */
export type CreatureAbilityType = 'action' | 'maneuver' | 'triggered' | 'villain';

/**
 * A creature ability that can be used during combat.
 */
export interface CreatureAbility {
	name: string;
	description: string;
	type: CreatureAbilityType;
}

// ============================================================================
// Creature Template
// ============================================================================

/**
 * A creature template that can be saved and reused.
 * Stores pre-configured creature stats for quick addition to combat.
 */
export interface CreatureTemplate {
	id: string;
	name: string;
	description?: string;
	hp: number;
	maxHp: number;
	ac?: number;
	threat: ThreatLevel;
	role?: CreatureRole;
	movement?: number;
	abilities: CreatureAbility[];
	tags: string[];
	source?: string; // Source book or origin
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input type for creating a new creature template.
 * Omits id and timestamps which are generated automatically.
 */
export type CreateCreatureTemplateInput = Omit<
	CreatureTemplate,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Input type for updating an existing creature template.
 * All fields are optional except those required for identification.
 */
export type UpdateCreatureTemplateInput = Partial<
	Omit<CreatureTemplate, 'id' | 'createdAt' | 'updatedAt'>
>;

// ============================================================================
// Library Export/Import
// ============================================================================

/**
 * Export format for creature template libraries.
 * Used for sharing and backing up creature collections.
 */
export interface CreatureLibraryExport {
	version: number;
	exportedAt: Date;
	templates: (Omit<CreatureTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: never })[];
}

/**
 * Import mode for library imports.
 * - 'merge': Add new templates, skip duplicates
 * - 'replace': Clear existing library and import
 */
export type ImportMode = 'merge' | 'replace';

/**
 * Result of a library import operation.
 */
export interface ImportResult {
	imported: number;
	skipped: number;
	errors: string[];
}
