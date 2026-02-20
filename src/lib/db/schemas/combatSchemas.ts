/**
 * Valibot Schemas for Combat Validation (Issue #504)
 *
 * Runtime validation schemas for CombatSession and related types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// CombatCondition schema
const CombatConditionSchema = v.object({
	name: v.string(),
	description: v.optional(v.string()),
	source: v.string(),
	duration: v.number()
});

// HeroicResource schema
const HeroicResourceSchema = v.object({
	current: v.number(),
	max: v.number(),
	name: v.optional(v.string()) // Name is optional in practice
});

// Initiative roll validation - must be exactly 2 numbers
const InitiativeRollSchema = v.pipe(
	v.array(v.number()),
	v.length(2),
	v.transform((arr) => arr as [number, number])
);

// Base combatant schema (shared properties)
const BaseCombatantSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	entityId: v.optional(v.string()),
	initiative: v.number(),
	initiativeRoll: InitiativeRollSchema,
	turnOrder: v.number(),
	hp: v.number(),
	maxHp: v.optional(v.number()),
	startingHp: v.optional(v.number()),
	tempHp: v.number(),
	ac: v.optional(v.number()),
	conditions: v.array(CombatConditionSchema),
	isAdHoc: v.optional(v.boolean()),
	tokenIndicator: v.optional(v.string()),
	groupId: v.optional(v.string())
});

// Hero combatant schema
const HeroCombatantSchema = v.looseObject({
	...BaseCombatantSchema.entries,
	type: v.literal('hero'),
	heroicResource: v.optional(HeroicResourceSchema)
});

// Creature combatant schema
const CreatureCombatantSchema = v.looseObject({
	...BaseCombatantSchema.entries,
	type: v.literal('creature'),
	threat: v.number()
});

// Combatant union schema
const CombatantSchema = v.union([HeroCombatantSchema, CreatureCombatantSchema]);

// CombatLogEntry schema
const CombatLogEntrySchema = v.looseObject({
	id: v.string(),
	round: v.number(),
	turn: v.number(),
	timestamp: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	message: v.string(),
	type: v.union([
		v.literal('system'),
		v.literal('action'),
		v.literal('damage'),
		v.literal('healing'),
		v.literal('condition'),
		v.literal('initiative'),
		v.literal('note')
	]),
	combatantId: v.optional(v.string()),
	metadata: v.optional(v.record(v.string(), v.unknown()))
});

// CombatantGroup schema
const CombatantGroupSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	memberIds: v.array(v.string()),
	initiative: v.number(),
	initiativeRoll: InitiativeRollSchema,
	turnOrder: v.number(),
	isCollapsed: v.optional(v.boolean())
});

// CombatSession schema
export const CombatSessionSchema = v.looseObject({
	id: v.string(),
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.optional(v.string()),
	status: v.union([v.literal('preparing'), v.literal('active'), v.literal('paused'), v.literal('completed')]),
	currentRound: v.number(),
	currentTurn: v.number(),
	combatants: v.array(CombatantSchema),
	groups: v.array(CombatantGroupSchema),
	victoryPoints: v.number(),
	heroPoints: v.number(),
	log: v.array(CombatLogEntrySchema),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	// Director-selected turn mode fields (Issue #501)
	turnMode: v.optional(v.union([v.literal('sequential'), v.literal('director-selected')]), 'director-selected'),
	actedCombatantIds: v.optional(v.array(v.string()), []),
	activeCombatantId: v.optional(v.string())
});
