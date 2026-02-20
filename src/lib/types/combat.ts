/**
 * Combat System Types for Draw Steel RPG
 *
 * This module defines the type system for the A1 Combat Foundation,
 * implementing Draw Steel's unique combat mechanics:
 * - Initiative uses 2d10 (not d20)
 * - Threat levels for creatures (1-3)
 * - Hero points as shared party resource
 * - Victory points for combat objectives
 * - Conditions with duration tracking
 * - Power rolls with tiers
 */

// ============================================================================
// Combat Session Status
// ============================================================================

export type CombatStatus = 'preparing' | 'active' | 'paused' | 'completed';

// ============================================================================
// Turn Mode (Issue #501)
// ============================================================================

/**
 * Turn mode for combat session.
 * - 'sequential': Traditional fixed-order turn system (legacy)
 * - 'director-selected': Director chooses who acts next (Draw Steel alternating turns)
 */
export type TurnMode = 'sequential' | 'director-selected';

// ============================================================================
// Combatant Types
// ============================================================================

export type CombatantType = 'hero' | 'creature';

// ============================================================================
// Draw Steel Mechanics - Conditions
// ============================================================================

/**
 * Combat condition applied to a combatant.
 *
 * Duration values:
 * - Positive number: Decrements at end of each round, removed when reaches 0
 * - 0: Lasts until end of combat
 * - -1: Permanent condition (does not expire)
 */
export interface CombatCondition {
	name: string;
	description?: string;
	source: string;
	duration: number;
}

// ============================================================================
// Draw Steel Mechanics - Heroic Resources
// ============================================================================

/**
 * Hero-specific resource that tracks during combat.
 * Examples: Victories, Focus, Fury, Resolve, etc.
 */
export interface HeroicResource {
	current: number;
	max: number;
	name: string;
}

// ============================================================================
// Combatant Base Types
// ============================================================================

/**
 * Base combatant properties shared by heroes and creatures.
 */
interface BaseCombatant {
	id: string;
	type: CombatantType;
	name: string;
	entityId?: string; // Reference to entity in entities table (optional for ad-hoc combatants)
	initiative: number;
	initiativeRoll: [number, number]; // Draw Steel uses 2d10
	turnOrder: number; // Float for flexible ordering (e.g., 2.1, 2.2, 2.3 for grouped combatants)
	hp: number;
	maxHp?: number; // Optional for ad-hoc combatants and uncapped healing
	startingHp?: number; // Used for healing cap when maxHp is undefined (quick-add combatants)
	tempHp: number;
	ac?: number;
	conditions: CombatCondition[];
	isAdHoc?: boolean; // Flag for ad-hoc combatants added without entity template
	tokenIndicator?: string; // Optional token marker for physical tracking (e.g., "A", "1", "red base")
	groupId?: string; // Reference to group this combatant belongs to (Issue #263)
}

/**
 * Hero combatant with heroic resources.
 */
export interface HeroCombatant extends BaseCombatant {
	type: 'hero';
	heroicResource?: HeroicResource; // Optional for ad-hoc heroes
}

/**
 * Creature combatant with threat level.
 * Threat levels: 1 (minion/standard), 2 (elite), 3 (boss/solo)
 */
export interface CreatureCombatant extends BaseCombatant {
	type: 'creature';
	threat: number;
}

/**
 * Union type for all combatant types.
 */
export type Combatant = HeroCombatant | CreatureCombatant;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if combatant is a hero.
 */
export function isHeroCombatant(combatant: Combatant): combatant is HeroCombatant {
	return combatant.type === 'hero';
}

/**
 * Type guard to check if combatant is a creature.
 */
export function isCreatureCombatant(combatant: Combatant): combatant is CreatureCombatant {
	return combatant.type === 'creature';
}

/**
 * Type guard to check if combatant belongs to a group.
 */
export function isGroupedCombatant(combatant: Combatant): boolean {
	return combatant.groupId !== undefined;
}

// ============================================================================
// Combat Log
// ============================================================================

export type CombatLogType =
	| 'system'
	| 'action'
	| 'damage'
	| 'healing'
	| 'condition'
	| 'initiative'
	| 'note';

/**
 * Entry in the combat log.
 */
export interface CombatLogEntry {
	id: string;
	round: number;
	turn: number;
	timestamp: Date;
	message: string;
	type: CombatLogType;
	combatantId?: string;
	metadata?: Record<string, unknown>;
}

// ============================================================================
// Draw Steel Mechanics - Power Rolls
// ============================================================================

/**
 * Power roll result (Draw Steel uses 2d10).
 *
 * Tier thresholds:
 * - Tier 1: 3-11
 * - Tier 2: 12-16
 * - Tier 3: 17-19
 * - Tier 4 (Critical): 20 (double 10s)
 */
export interface PowerRollResult {
	roll1: number;
	roll2: number;
	total: number;
	tier: number;
	critical?: boolean;
}

// ============================================================================
// Combatant Groups (Issue #263)
// ============================================================================

/**
 * Group of combatants sharing initiative.
 * Members act in sequence using fractional turnOrder.
 */
export interface CombatantGroup {
	id: string;
	name: string;
	memberIds: string[];
	initiative: number;
	initiativeRoll: [number, number];
	turnOrder: number;
	isCollapsed?: boolean;
}

// ============================================================================
// Combat Session
// ============================================================================

/**
 * Complete combat session with all combatants and state.
 */
export interface CombatSession {
	id: string;
	name: string;
	description?: string;
	status: CombatStatus;
	currentRound: number;
	currentTurn: number;
	combatants: Combatant[];
	groups: CombatantGroup[];
	victoryPoints: number;
	heroPoints: number;
	log: CombatLogEntry[];
	createdAt: Date;
	updatedAt: Date;
	// Director-selected turn mode fields (Issue #501)
	turnMode: TurnMode;
	actedCombatantIds: string[]; // IDs of combatants who have acted this round
	activeCombatantId?: string; // ID of currently acting combatant (director-selected mode only)
}

// ============================================================================
// Input Types for Repository Operations
// ============================================================================

/**
 * Input for creating a new combat session.
 */
export interface CreateCombatInput {
	name: string;
	description?: string;
	turnMode?: TurnMode; // Optional, defaults to 'director-selected'
}

/**
 * Input for updating combat session fields.
 */
export interface UpdateCombatInput {
	name?: string;
	description?: string;
}

/**
 * Input for adding a hero combatant.
 */
export interface AddHeroCombatantInput {
	name: string;
	entityId?: string; // Optional for ad-hoc combatants
	hp?: number; // Starting HP (defaults to maxHp if not provided)
	maxHp?: number; // Optional for ad-hoc combatants and uncapped healing
	ac?: number;
	heroicResource?: HeroicResource; // Optional for simplified heroes
	tokenIndicator?: string; // Optional token marker
}

/**
 * Input for adding a creature combatant.
 */
export interface AddCreatureCombatantInput {
	name: string;
	entityId?: string; // Optional for ad-hoc combatants
	hp?: number; // Starting HP (defaults to maxHp if not provided)
	maxHp?: number; // Optional for ad-hoc combatants
	ac?: number;
	threat?: number; // Optional for ad-hoc combatants (defaults to 1)
	tokenIndicator?: string; // Optional token marker
}

/**
 * Input for quick-adding an ad-hoc combatant (Issue #233).
 * Simplified interface requiring only name, HP, and type.
 */
export interface AddQuickCombatantInput {
	name: string;
	hp: number;
	type: CombatantType;
	ac?: number;
	threat?: number; // For creatures, defaults to 1
	tokenIndicator?: string; // Optional token marker
}

/**
 * Input for updating combatant fields.
 */
export interface UpdateCombatantInput {
	name?: string;
	initiative?: number;
	initiativeRoll?: [number, number];
	turnOrder?: number;
	hp?: number;
	maxHp?: number;
	tempHp?: number;
	ac?: number;
	conditions?: CombatCondition[];
	tokenIndicator?: string; // Optional token marker
}

/**
 * Input for adding a condition to a combatant.
 */
export interface AddConditionInput {
	name: string;
	description?: string;
	source: string;
	duration: number;
}

/**
 * Input for adding a log entry.
 */
export interface AddLogEntryInput {
	message: string;
	type: CombatLogType;
	combatantId?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Input for logging a power roll.
 */
export interface LogPowerRollInput {
	combatantName: string;
	roll1: number;
	roll2: number;
	total: number;
	tier: number;
	critical?: boolean;
	action: string;
	combatantId?: string;
}

/**
 * Input for creating a combatant group (Issue #263).
 */
export interface CreateGroupInput {
	name: string;
	memberIds: string[];
	initiative?: number;
}
