/**
 * Valibot Schemas for Respite Validation (Issue #504)
 *
 * Runtime validation schemas for RespiteSession and related types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// RespiteHero schema
const RespiteHeroSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	heroId: v.optional(v.string()),
	recoveries: v.object({
		current: v.number(),
		max: v.number(),
		gained: v.number()
	}),
	conditions: v.optional(v.array(v.string())),
	notes: v.optional(v.string())
});

// KitSwap schema
const KitSwapSchema = v.looseObject({
	id: v.string(),
	heroId: v.string(),
	from: v.string(),
	to: v.string(),
	reason: v.optional(v.string()),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))])
});

// RespiteSession schema
export const RespiteSessionSchema = v.looseObject({
	id: v.string(),
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.optional(v.string()),
	status: v.union([v.literal('preparing'), v.literal('active'), v.literal('completed')]),
	heroes: v.array(RespiteHeroSchema),
	victoryPointsAvailable: v.number(),
	victoryPointsConverted: v.number(),
	activityIds: v.array(v.string()),
	kitSwaps: v.array(KitSwapSchema),
	campaignId: v.optional(v.string()),
	characterIds: v.optional(v.array(v.string())),
	linkedSessionIds: v.optional(v.array(v.string())),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	completedAt: v.optional(v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]))
});
