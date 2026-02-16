/**
 * Tests for AI Schemas (Issue #504)
 *
 * Tests Valibot schemas for ChatMessage validation.
 * These schemas provide runtime validation at the IndexedDB boundary.
 *
 * Testing Strategy:
 * - Valid chat messages pass validation
 * - Invalid role values fail (must be 'user' or 'assistant')
 * - Missing required fields fail validation
 * - Date fields accept both Date objects and ISO 8601 strings
 * - Optional fields can be omitted
 *
 * Coverage:
 * - ChatMessageSchema: id, role, content, timestamp
 * - Role enum validation ('user' | 'assistant')
 * - Type coercion for JSON deserialization (ISO strings → Dates)
 * - Optional conversationId and contextEntities fields
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect } from 'vitest';
import { safeParse } from 'valibot';
import { ChatMessageSchema } from '$lib/db/schemas/aiSchemas';
import type { ChatMessage } from '$lib/types/ai';

describe('ChatMessageSchema', () => {
	describe('Valid ChatMessage', () => {
		it('should pass validation for user message with all required fields', () => {
			const validMessage: ChatMessage = {
				id: 'msg-123',
				role: 'user',
				content: 'What is the capital of Gondor?',
				timestamp: new Date('2024-01-15T10:00:00Z')
			};

			const result = safeParse(ChatMessageSchema, validMessage);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toEqual(validMessage);
			}
		});

		it('should pass validation for assistant message with all required fields', () => {
			const validMessage: ChatMessage = {
				id: 'msg-456',
				role: 'assistant',
				content: 'The capital of Gondor is Minas Tirith.',
				timestamp: new Date('2024-01-15T10:01:00Z')
			};

			const result = safeParse(ChatMessageSchema, validMessage);
			expect(result.success).toBe(true);
		});

		it('should pass validation with optional conversationId', () => {
			const validMessage: ChatMessage = {
				id: 'msg-789',
				role: 'user',
				content: 'Tell me about Rivendell',
				timestamp: new Date(),
				conversationId: 'conv-123'
			};

			const result = safeParse(ChatMessageSchema, validMessage);
			expect(result.success).toBe(true);
		});

		it('should pass validation with optional contextEntities', () => {
			const validMessage: ChatMessage = {
				id: 'msg-101',
				role: 'assistant',
				content: 'Rivendell is an elven sanctuary.',
				timestamp: new Date(),
				contextEntities: ['entity-1', 'entity-2']
			};

			const result = safeParse(ChatMessageSchema, validMessage);
			expect(result.success).toBe(true);
		});

		it('should accept timestamp as Date object', () => {
			const message = {
				id: 'msg-202',
				role: 'user',
				content: 'Test message',
				timestamp: new Date('2024-01-15T10:00:00Z')
			};

			const result = safeParse(ChatMessageSchema, message);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.timestamp).toBeInstanceOf(Date);
			}
		});

		it('should accept and coerce timestamp as ISO 8601 string (JSON deserialization)', () => {
			const message = {
				id: 'msg-303',
				role: 'assistant',
				content: 'Test response',
				timestamp: '2024-01-15T10:00:00.000Z'
			};

			const result = safeParse(ChatMessageSchema, message);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.timestamp).toBeInstanceOf(Date);
				expect(result.output.timestamp.toISOString()).toBe('2024-01-15T10:00:00.000Z');
			}
		});
	});

	describe('Invalid Role Values', () => {
		it('should fail validation when role is not "user" or "assistant"', () => {
			const invalidMessage = {
				id: 'msg-404',
				role: 'system', // invalid role
				content: 'System message',
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when role is empty string', () => {
			const invalidMessage = {
				id: 'msg-505',
				role: '', // empty string
				content: 'Test message',
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when role is arbitrary string', () => {
			const invalidMessage = {
				id: 'msg-606',
				role: 'moderator', // not 'user' or 'assistant'
				content: 'Test message',
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('Missing Required Fields', () => {
		it('should fail validation when id is missing', () => {
			const invalidMessage = {
				// id missing
				role: 'user',
				content: 'Test message',
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when content is missing', () => {
			const invalidMessage = {
				id: 'msg-707',
				role: 'user',
				// content missing
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when timestamp is missing', () => {
			const invalidMessage = {
				id: 'msg-808',
				role: 'user',
				content: 'Test message'
				// timestamp missing
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when role is missing', () => {
			const invalidMessage = {
				id: 'msg-909',
				// role missing
				content: 'Test message',
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Field Types', () => {
		it('should fail validation when content is not a string', () => {
			const invalidMessage = {
				id: 'msg-1010',
				role: 'user',
				content: 123, // should be string
				timestamp: new Date()
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when timestamp is invalid date string', () => {
			const invalidMessage = {
				id: 'msg-1111',
				role: 'user',
				content: 'Test message',
				timestamp: 'not-a-date'
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should fail validation when contextEntities is not an array', () => {
			const invalidMessage = {
				id: 'msg-1212',
				role: 'user',
				content: 'Test message',
				timestamp: new Date(),
				contextEntities: 'entity-1' // should be array
			};

			const result = safeParse(ChatMessageSchema, invalidMessage);
			expect(result.success).toBe(false);
		});
	});
});
