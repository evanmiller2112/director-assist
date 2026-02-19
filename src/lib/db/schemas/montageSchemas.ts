/**
 * Valibot Schemas for Montage Validation (Issue #504)
 *
 * Runtime validation schemas for MontageSession and related types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// PredefinedChallenge schema
const PredefinedChallengeSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	suggestedSkills: v.optional(v.array(v.string()))
});

// MontageChallenge schema
const MontageChallengeSchema = v.looseObject({
	id: v.string(),
	round: v.union([v.literal(1), v.literal(2)]),
	result: v.union([v.literal('success'), v.literal('failure'), v.literal('skip'), v.literal('pending')]),
	description: v.optional(v.string()),
	playerName: v.optional(v.string()),
	notes: v.optional(v.string()),
	predefinedChallengeId: v.optional(v.string())
});

// MontageSession schema
export const MontageSessionSchema = v.looseObject({
	id: v.string(),
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.optional(v.string()),
	status: v.union([v.literal('preparing'), v.literal('active'), v.literal('completed')]),
	difficulty: v.union([v.literal('easy'), v.literal('moderate'), v.literal('hard')]),
	playerCount: v.number(),
	successLimit: v.number(),
	failureLimit: v.number(),
	challenges: v.array(MontageChallengeSchema),
	successCount: v.number(),
	failureCount: v.number(),
	currentRound: v.union([v.literal(1), v.literal(2)]),
	outcome: v.optional(v.union([v.literal('total_success'), v.literal('partial_success'), v.literal('total_failure')])),
	victoryPoints: v.number(),
	predefinedChallenges: v.optional(v.array(PredefinedChallengeSchema)),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	completedAt: v.optional(v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]))
});
