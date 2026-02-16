/**
 * Valibot Schemas for Entity Validation (Issue #504)
 *
 * Runtime validation schemas for BaseEntity and EntityLink types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// ResourceValue schema for field values
export const ResourceValueSchema = v.object({
	current: v.number(),
	max: v.number()
});

// DurationValue schema for field values
export const DurationValueSchema = v.object({
	value: v.optional(v.number()),
	unit: v.union([
		v.literal('round'),
		v.literal('rounds'),
		v.literal('minute'),
		v.literal('minutes'),
		v.literal('hour'),
		v.literal('hours'),
		v.literal('turn'),
		v.literal('turns'),
		v.literal('concentration'),
		v.literal('instant'),
		v.literal('permanent')
	])
});

// FieldValue schema - recursive type for field values
export const FieldValueSchema: v.GenericSchema = v.union([
	v.string(),
	v.number(),
	v.boolean(),
	v.array(v.string()),
	ResourceValueSchema,
	DurationValueSchema,
	v.null_(),
	v.undefined_()
]);

// EntityLink schema
export const EntityLinkSchema = v.looseObject({
	id: v.string(),
	sourceId: v.optional(v.string()),
	targetId: v.string(),
	targetType: v.string(),
	relationship: v.pipe(v.string(), v.minLength(1)),
	bidirectional: v.boolean(),
	reverseRelationship: v.optional(v.string()),
	notes: v.optional(v.string()),
	strength: v.optional(v.union([v.literal('strong'), v.literal('moderate'), v.literal('weak')])),
	playerVisible: v.optional(v.boolean()),
	createdAt: v.optional(v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))])),
	updatedAt: v.optional(v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))])),
	metadata: v.optional(v.record(v.string(), v.unknown()))
});

// BaseEntity schema
export const BaseEntitySchema = v.looseObject({
	id: v.string(),
	type: v.string(),
	name: v.pipe(v.string(), v.minLength(1)),
	description: v.string(),
	summary: v.optional(v.string()),
	tags: v.array(v.string()),
	imageUrl: v.optional(v.string()),
	fields: v.record(v.string(), FieldValueSchema),
	links: v.array(EntityLinkSchema),
	notes: v.string(),
	playerVisible: v.optional(v.boolean()),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	metadata: v.record(v.string(), v.unknown())
});
