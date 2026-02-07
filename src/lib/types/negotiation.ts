/**
 * Negotiation Tracker Types for Draw Steel RPG
 *
 * This module defines the type system for the Negotiation Tracker,
 * implementing Draw Steel's negotiation mechanics:
 * - Interest and patience tracking (0-5 scale)
 * - NPC motivations and pitfalls
 * - Argument results based on tier and type
 * - Outcome determination based on final interest level
 */

// ============================================================================
// Negotiation Status
// ============================================================================

/**
 * Current status of the negotiation.
 * - preparing: Setup phase, arguments not yet made
 * - active: Negotiation in progress
 * - completed: Negotiation finished with an outcome
 */
export type NegotiationStatus = 'preparing' | 'active' | 'completed';

// ============================================================================
// Motivation Type
// ============================================================================

/**
 * NPC motivation types that can be used in arguments.
 * These represent the core drives that motivate NPCs in negotiations.
 */
export type MotivationType =
	| 'benevolence'
	| 'discovery'
	| 'freedom'
	| 'greed'
	| 'higher_authority'
	| 'justice'
	| 'legacy'
	| 'peace'
	| 'power'
	| 'protection'
	| 'reputation'
	| 'revelry'
	| 'vengeance'
	| 'wealth';

// ============================================================================
// Argument Type
// ============================================================================

/**
 * Type of argument being made.
 * - motivation: Argument appeals to one of the NPC's motivations
 * - no_motivation: Argument doesn't appeal to any motivation
 * - pitfall: Argument triggers one of the NPC's pitfalls
 */
export type ArgumentType = 'motivation' | 'no_motivation' | 'pitfall';

// ============================================================================
// Negotiation Tier
// ============================================================================

/**
 * The tier of the argument (1, 2, or 3).
 * Higher tiers have better effects on interest and patience.
 */
export type NegotiationTier = 1 | 2 | 3;

// ============================================================================
// Negotiation Argument
// ============================================================================

/**
 * Individual argument made during a negotiation.
 * Records the type, tier, effects, and context of each argument.
 */
export interface NegotiationArgument {
	id: string;
	type: ArgumentType;
	tier: NegotiationTier;
	description: string;
	motivationType?: MotivationType;
	interestChange: number;
	patienceChange: number;
	playerName?: string;
	notes?: string;
	createdAt: Date;
}

// ============================================================================
// NPC Motivation
// ============================================================================

/**
 * NPC motivation configuration.
 * Tracks which motivations the NPC has, whether they're known to players,
 * and how many times they've been used in arguments.
 */
export interface NegotiationMotivation {
	type: MotivationType;
	description: string;
	isKnown: boolean;
	timesUsed: number;
}

// ============================================================================
// NPC Pitfall
// ============================================================================

/**
 * NPC pitfall configuration.
 * Tracks topics that trigger negative reactions and whether they're known.
 */
export interface NegotiationPitfall {
	description: string;
	isKnown: boolean;
}

/**
 * Simplified NPC motivation for UI display.
 * Used in components to show motivation type, known state, and usage.
 */
export interface NPCMotivation {
	type: MotivationType;
	isKnown: boolean;
	used: boolean;
}

/**
 * Simplified NPC pitfall for UI display.
 * Used in components to show pitfall type and known state.
 */
export interface NPCPitfall {
	type: MotivationType;
	isKnown: boolean;
}

// ============================================================================
// Negotiation Outcome
// ============================================================================

/**
 * Final outcome of a negotiation based on interest level.
 * - failure: Interest 0-1 - No agreement
 * - minor_favor: Interest 2 - Limited success
 * - major_favor: Interest 3-4 - Strong agreement
 * - alliance: Interest 5 - Best possible outcome
 */
export type NegotiationOutcome = 'failure' | 'minor_favor' | 'major_favor' | 'alliance';

// ============================================================================
// Negotiation Session
// ============================================================================

/**
 * Complete negotiation session.
 * Tracks the full state of a negotiation including NPC configuration,
 * interest/patience levels, and all arguments made.
 */
export interface NegotiationSession {
	id: string;
	name: string;
	description?: string;
	npcName: string;
	status: NegotiationStatus;
	interest: number;
	patience: number;
	motivations: NegotiationMotivation[];
	pitfalls: NegotiationPitfall[];
	arguments: NegotiationArgument[];
	outcome?: NegotiationOutcome;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date;
}

// ============================================================================
// Input Types for Repository Operations
// ============================================================================

/**
 * Input for creating a new negotiation session.
 */
export interface CreateNegotiationInput {
	name: string;
	description?: string;
	npcName: string;
	motivations: Array<{ type: MotivationType; description: string }>;
	pitfalls: Array<{ description: string }>;
}

/**
 * Input for updating negotiation session fields.
 */
export interface UpdateNegotiationInput {
	name?: string;
	description?: string;
	npcName?: string;
	motivations?: NegotiationMotivation[];
	pitfalls?: NegotiationPitfall[];
}

/**
 * Input for recording an argument in the negotiation.
 */
export interface RecordArgumentInput {
	type: ArgumentType;
	tier: NegotiationTier;
	description: string;
	motivationType?: MotivationType;
	playerName?: string;
	notes?: string;
}
