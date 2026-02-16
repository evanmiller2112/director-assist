/**
 * Valibot Schemas for AI Validation (Issue #504)
 *
 * Runtime validation schemas for ChatMessage and Conversation types.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// ChatMessage schema
export const ChatMessageSchema = v.looseObject({
	id: v.string(),
	role: v.union([v.literal('user'), v.literal('assistant')]),
	content: v.string(),
	timestamp: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	conversationId: v.optional(v.string()),
	contextEntities: v.optional(v.array(v.string())),
	generationType: v.optional(v.string()),
	generatedEntityId: v.optional(v.string())
});

// Conversation schema
export const ConversationSchema = v.looseObject({
	id: v.string(),
	name: v.string(),
	createdAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	updatedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))])
});
