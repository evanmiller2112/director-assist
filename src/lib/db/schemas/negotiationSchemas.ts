/**
 * Valibot Schemas for Negotiation Validation (Issue #504)
 *
 * Runtime validation schemas for NegotiationSession and related types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// MotivationType schema
const MotivationTypeSchema = v.union([
	v.literal('charity'),
	v.literal('discovery'),
	v.literal('faith'),
	v.literal('freedom'),
	v.literal('greed'),
	v.literal('harmony'),
	v.literal('justice'),
	v.literal('knowledge'),
	v.literal('legacy'),
	v.literal('power'),
	v.literal('protection'),
	v.literal('revenge'),
	v.literal('wealth')
]);

// NegotiationMotivation schema
const NegotiationMotivationSchema = v.looseObject({
	type: MotivationTypeSchema,
	description: v.string(),
	isKnown: v.boolean(),
	timesUsed: v.number()
});

// NegotiationPitfall schema
const NegotiationPitfallSchema = v.looseObject({
	description: v.string(),
	isKnown: v.boolean()
});

// NegotiationArgument schema
const NegotiationArgumentSchema = v.looseObject({
	id: v.string(),
	type: v.union([v.literal('motivation'), v.literal('no_motivation'), v.literal('pitfall')]),
	tier: v.union([v.literal(1), v.literal(2), v.literal(3)]),
	description: v.string(),
	motivationType: v.optional(MotivationTypeSchema),
	interestChange: v.number(),
	patienceChange: v.number(),
	playerName: v.optional(v.string()),
	notes: v.optional(v.string()),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))])
});

// NegotiationSession schema
export const NegotiationSessionSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	npcName: v.string(),
	status: v.union([v.literal('preparing'), v.literal('active'), v.literal('completed')]),
	interest: v.number(),
	patience: v.number(),
	motivations: v.array(NegotiationMotivationSchema),
	pitfalls: v.array(NegotiationPitfallSchema),
	arguments: v.array(NegotiationArgumentSchema),
	outcome: v.optional(v.union([v.literal('failure'), v.literal('minor_favor'), v.literal('major_favor'), v.literal('alliance')])),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	completedAt: v.optional(v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]))
});
