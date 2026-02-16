/**
 * Tests for Entity Schemas (Issue #504)
 *
 * Tests Valibot schemas for BaseEntity and EntityLink validation.
 * These schemas provide runtime validation at the IndexedDB boundary.
 *
 * Testing Strategy:
 * - Valid data passes validation
 * - Missing required fields fail validation
 * - Invalid field types fail validation
 * - Empty/invalid string constraints are enforced
 * - Date fields accept both Date objects and ISO 8601 strings
 * - Extra/unknown properties don't cause failures (forward compatibility)
 *
 * Coverage:
 * - BaseEntitySchema: id, name, type, description, tags, fields, links, dates
 * - EntityLinkSchema: id, targetId, relationship, strength constraints
 * - Type coercion for JSON deserialization (ISO strings → Dates)
 * - Edge cases: empty arrays, empty objects, optional fields
 *
 * NOTE: These tests are expected to FAIL initially (RED phase of TDD).
 * Implementation will be added in the GREEN phase to make them pass.
 */

import { describe, it, expect } from 'vitest';
import { safeParse } from 'valibot';
import { BaseEntitySchema, EntityLinkSchema } from '$lib/db/schemas/entitySchemas';
import type { BaseEntity, EntityLink } from '$lib/types/entities';

describe('BaseEntitySchema', () => {
	describe('Valid BaseEntity', () => {
		it('should pass validation with all required fields', () => {
			const validEntity: BaseEntity = {
				id: 'entity-123',
				type: 'character',
				name: 'Gandalf',
				description: 'A wise wizard',
				tags: ['wizard', 'hero'],
				fields: {},
				links: [],
				notes: 'Private DM notes',
				createdAt: new Date('2024-01-15T10:00:00Z'),
				updatedAt: new Date('2024-01-15T10:00:00Z'),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, validEntity);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toEqual(validEntity);
			}
		});

		it('should pass validation with optional fields included', () => {
			const validEntity: BaseEntity = {
				id: 'entity-456',
				type: 'location',
				name: 'Rivendell',
				description: 'The Last Homely House',
				summary: 'Elven sanctuary',
				tags: ['location', 'safe'],
				imageUrl: 'https://example.com/rivendell.jpg',
				fields: { climate: 'temperate', population: 500 },
				links: [],
				notes: 'Hidden valley',
				playerVisible: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { custom: 'data' }
			};

			const result = safeParse(BaseEntitySchema, validEntity);
			expect(result.success).toBe(true);
		});

		it('should accept createdAt as Date object', () => {
			const entity = {
				id: 'entity-789',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date('2024-01-15T10:00:00Z'),
				updatedAt: new Date('2024-01-15T10:00:00Z'),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, entity);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.createdAt).toBeInstanceOf(Date);
			}
		});

		it('should accept and coerce createdAt as ISO 8601 string (JSON deserialization)', () => {
			const entity = {
				id: 'entity-790',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: '2024-01-15T10:00:00.000Z',
				updatedAt: '2024-01-15T10:00:00.000Z',
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, entity);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.createdAt).toBeInstanceOf(Date);
				expect(result.output.updatedAt).toBeInstanceOf(Date);
			}
		});

		it('should not fail on extra/unknown properties (forward compatibility)', () => {
			const entityWithExtra = {
				id: 'entity-999',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {},
				unknownField: 'should be ignored',
				futureFeature: { nested: 'data' }
			};

			const result = safeParse(BaseEntitySchema, entityWithExtra);
			expect(result.success).toBe(true);
		});
	});

	describe('Missing Required Fields', () => {
		it('should fail validation when id is missing', () => {
			const invalidEntity = {
				// id missing
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});

		it('should fail validation when name is missing', () => {
			const invalidEntity = {
				id: 'entity-123',
				type: 'character',
				// name missing
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});

		it('should fail validation when type is missing', () => {
			const invalidEntity = {
				id: 'entity-123',
				// type missing
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Field Values', () => {
		it('should fail validation when name is empty string (minLength constraint)', () => {
			const invalidEntity = {
				id: 'entity-123',
				type: 'character',
				name: '', // empty string
				description: 'Test description',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});

		it('should fail validation when tags is not an array', () => {
			const invalidEntity = {
				id: 'entity-123',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: 'not-an-array', // should be array
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});

		it('should fail validation when links is not an array', () => {
			const invalidEntity = {
				id: 'entity-123',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: {},
				links: 'not-an-array', // should be array
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});

		it('should fail validation when fields is not an object', () => {
			const invalidEntity = {
				id: 'entity-123',
				type: 'character',
				name: 'Test',
				description: 'Test description',
				tags: [],
				fields: 'not-an-object', // should be Record<string, unknown>
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const result = safeParse(BaseEntitySchema, invalidEntity);
			expect(result.success).toBe(false);
		});
	});
});

describe('EntityLinkSchema', () => {
	describe('Valid EntityLink', () => {
		it('should pass validation with all required fields', () => {
			const validLink: EntityLink = {
				id: 'link-123',
				sourceId: 'entity-1',
				targetId: 'entity-2',
				targetType: 'location',
				relationship: 'located_at',
				bidirectional: false
			};

			const result = safeParse(EntityLinkSchema, validLink);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output).toEqual(validLink);
			}
		});

		it('should pass validation with optional fields included', () => {
			const validLink: EntityLink = {
				id: 'link-456',
				sourceId: 'entity-1',
				targetId: 'entity-2',
				targetType: 'character',
				relationship: 'patron_of',
				bidirectional: true,
				reverseRelationship: 'client_of',
				notes: 'Special relationship notes'
			};

			const result = safeParse(EntityLinkSchema, validLink);
			expect(result.success).toBe(true);
		});

		it('should pass validation without sourceId (backward compatibility)', () => {
			const validLink = {
				id: 'link-789',
				// sourceId optional for backward compat
				targetId: 'entity-2',
				targetType: 'character',
				relationship: 'knows',
				bidirectional: true
			};

			const result = safeParse(EntityLinkSchema, validLink);
			expect(result.success).toBe(true);
		});
	});

	describe('Missing Required Fields', () => {
		it('should fail validation when targetId is missing', () => {
			const invalidLink = {
				id: 'link-123',
				sourceId: 'entity-1',
				// targetId missing
				targetType: 'location',
				relationship: 'located_at',
				bidirectional: false
			};

			const result = safeParse(EntityLinkSchema, invalidLink);
			expect(result.success).toBe(false);
		});

		it('should fail validation when relationship is missing', () => {
			const invalidLink = {
				id: 'link-123',
				sourceId: 'entity-1',
				targetId: 'entity-2',
				targetType: 'location',
				// relationship missing
				bidirectional: false
			};

			const result = safeParse(EntityLinkSchema, invalidLink);
			expect(result.success).toBe(false);
		});
	});

	describe('Invalid Field Values', () => {
		it('should fail validation when relationship is empty string', () => {
			const invalidLink = {
				id: 'link-123',
				sourceId: 'entity-1',
				targetId: 'entity-2',
				targetType: 'location',
				relationship: '', // empty string
				bidirectional: false
			};

			const result = safeParse(EntityLinkSchema, invalidLink);
			expect(result.success).toBe(false);
		});

		it('should fail validation when bidirectional is not a boolean', () => {
			const invalidLink = {
				id: 'link-123',
				sourceId: 'entity-1',
				targetId: 'entity-2',
				targetType: 'location',
				relationship: 'located_at',
				bidirectional: 'yes' // should be boolean
			};

			const result = safeParse(EntityLinkSchema, invalidLink);
			expect(result.success).toBe(false);
		});
	});
});
