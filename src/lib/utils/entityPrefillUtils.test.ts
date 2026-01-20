/**
 * Tests for Entity Prefill Utilities (TDD RED Phase - Phase A4)
 *
 * Issue #40: AI Chat Panel - Phase A4 (Save Flow & Prefill)
 *
 * This utility handles serialization and deserialization of parsed entities
 * for URL-based prefilling in entity forms. It enables the "Review & Edit"
 * flow where users can navigate from chat to a prefilled entity form.
 *
 * These tests should FAIL initially as the utility doesn't exist yet.
 */
import { describe, it, expect } from 'vitest';
import {
	serializePrefillParams,
	deserializePrefillParams,
	buildPrefillUrl,
	type PrefillParams
} from './entityPrefillUtils';
import type { ParsedEntity } from '$lib/services/entityParserService';
import type { EntityType } from '$lib/types';

describe('entityPrefillUtils - Serialization', () => {
	const mockParsedEntity: ParsedEntity = {
		entityType: 'npc' as EntityType,
		confidence: 0.8,
		name: 'Captain Aldric',
		description: 'A stern guard captain with years of experience',
		summary: 'Guard captain',
		tags: ['guard', 'military'],
		fields: {
			role: 'Guard Captain',
			personality: 'Stern but fair'
		},
		validationErrors: {}
	};

	describe('serializePrefillParams', () => {
		it('should serialize ParsedEntity to URL-safe string', () => {
			const result = serializePrefillParams(mockParsedEntity);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should create a valid base64-encoded string', () => {
			const result = serializePrefillParams(mockParsedEntity);

			// Base64 should only contain alphanumeric, +, /, and =
			expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
		});

		it('should include all entity properties', () => {
			const result = serializePrefillParams(mockParsedEntity);
			const decoded = atob(result);

			expect(decoded).toContain('Captain Aldric');
			expect(decoded).toContain('npc');
			expect(decoded).toContain('guard');
			expect(decoded).toContain('Guard Captain');
		});

		it('should handle entity without optional summary', () => {
			const entityWithoutSummary: ParsedEntity = {
				...mockParsedEntity,
				summary: undefined
			};

			const result = serializePrefillParams(entityWithoutSummary);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});

		it('should handle entity with empty tags array', () => {
			const entityWithEmptyTags: ParsedEntity = {
				...mockParsedEntity,
				tags: []
			};

			const result = serializePrefillParams(entityWithEmptyTags);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});

		it('should handle entity with empty fields', () => {
			const entityWithEmptyFields: ParsedEntity = {
				...mockParsedEntity,
				fields: {}
			};

			const result = serializePrefillParams(entityWithEmptyFields);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});

		it('should include sourceMessageId when provided', () => {
			const messageId = 'msg-123';
			const result = serializePrefillParams(mockParsedEntity, messageId);
			const decoded = atob(result);

			expect(decoded).toContain(messageId);
		});

		it('should not include sourceMessageId when not provided', () => {
			const result = serializePrefillParams(mockParsedEntity);
			const decoded = atob(result);

			expect(decoded).not.toContain('sourceMessageId');
		});

		it('should handle special characters in name', () => {
			const entityWithSpecialChars: ParsedEntity = {
				...mockParsedEntity,
				name: "Sir O'Brien & Sons, Ltd."
			};

			const result = serializePrefillParams(entityWithSpecialChars);

			expect(result).toBeTruthy();
			expect(() => atob(result)).not.toThrow();
		});

		it('should handle special characters in description', () => {
			const entityWithSpecialChars: ParsedEntity = {
				...mockParsedEntity,
				description: 'Description with "quotes", & ampersands, and <html> tags'
			};

			const result = serializePrefillParams(entityWithSpecialChars);

			expect(result).toBeTruthy();
			expect(() => atob(result)).not.toThrow();
		});

		it('should handle unicode characters', () => {
			const entityWithUnicode: ParsedEntity = {
				...mockParsedEntity,
				name: 'Éléonore 北京',
				description: 'Contains émojis 🎭 and spëcial çharacters'
			};

			const result = serializePrefillParams(entityWithUnicode);

			expect(result).toBeTruthy();
			expect(() => atob(result)).not.toThrow();
		});

		it('should handle long descriptions gracefully', () => {
			const longDescription = 'A'.repeat(2000);
			const entityWithLongDesc: ParsedEntity = {
				...mockParsedEntity,
				description: longDescription
			};

			const result = serializePrefillParams(entityWithLongDesc);

			expect(result).toBeTruthy();
			expect(typeof result).toBe('string');
		});

		it('should handle complex field values', () => {
			const entityWithComplexFields: ParsedEntity = {
				...mockParsedEntity,
				fields: {
					role: 'Guard Captain',
					level: 10,
					isAlive: true,
					tags: ['warrior', 'leader'],
					nullField: null
				}
			};

			const result = serializePrefillParams(entityWithComplexFields);

			expect(result).toBeTruthy();
			const decoded = atob(result);
			expect(decoded).toContain('Guard Captain');
			expect(decoded).toContain('10');
		});
	});
});

describe('entityPrefillUtils - Deserialization', () => {
	const mockParsedEntity: ParsedEntity = {
		entityType: 'npc' as EntityType,
		confidence: 0.8,
		name: 'Captain Aldric',
		description: 'A stern guard captain',
		summary: 'Guard captain',
		tags: ['guard'],
		fields: {
			role: 'Guard Captain'
		},
		validationErrors: {}
	};

	describe('deserializePrefillParams', () => {
		it('should deserialize a valid serialized entity', () => {
			const serialized = serializePrefillParams(mockParsedEntity);
			const result = deserializePrefillParams(serialized);

			expect(result).toBeTruthy();
			expect(result?.type).toBe('npc');
			expect(result?.name).toBe('Captain Aldric');
		});

		it('should restore all entity properties correctly', () => {
			const serialized = serializePrefillParams(mockParsedEntity);
			const result = deserializePrefillParams(serialized);

			expect(result).toMatchObject({
				type: 'npc',
				name: 'Captain Aldric',
				description: 'A stern guard captain',
				summary: 'Guard captain',
				tags: ['guard']
			});
		});

		it('should restore fields correctly', () => {
			const serialized = serializePrefillParams(mockParsedEntity);
			const result = deserializePrefillParams(serialized);

			expect(result?.fields).toEqual({
				role: 'Guard Captain'
			});
		});

		it('should perform round-trip serialization/deserialization', () => {
			const serialized = serializePrefillParams(mockParsedEntity);
			const deserialized = deserializePrefillParams(serialized);

			expect(deserialized?.name).toBe(mockParsedEntity.name);
			expect(deserialized?.description).toBe(mockParsedEntity.description);
			expect(deserialized?.summary).toBe(mockParsedEntity.summary);
			expect(deserialized?.tags).toEqual(mockParsedEntity.tags);
			expect(deserialized?.fields).toEqual(mockParsedEntity.fields);
		});

		it('should restore sourceMessageId when present', () => {
			const messageId = 'msg-456';
			const serialized = serializePrefillParams(mockParsedEntity, messageId);
			const result = deserializePrefillParams(serialized);

			expect(result?.sourceMessageId).toBe(messageId);
		});

		it('should not have sourceMessageId when not provided', () => {
			const serialized = serializePrefillParams(mockParsedEntity);
			const result = deserializePrefillParams(serialized);

			expect(result?.sourceMessageId).toBeUndefined();
		});

		it('should return null for invalid base64 string', () => {
			const result = deserializePrefillParams('not-valid-base64!!!');

			expect(result).toBeNull();
		});

		it('should return null for corrupted JSON', () => {
			const invalidJson = btoa('{invalid json}');
			const result = deserializePrefillParams(invalidJson);

			expect(result).toBeNull();
		});

		it('should return null for empty string', () => {
			const result = deserializePrefillParams('');

			expect(result).toBeNull();
		});

		it('should return null for malformed data', () => {
			const malformed = btoa('just a plain string, not json');
			const result = deserializePrefillParams(malformed);

			expect(result).toBeNull();
		});

		it('should handle special characters in round-trip', () => {
			const entityWithSpecialChars: ParsedEntity = {
				...mockParsedEntity,
				name: "Sir O'Brien & Co.",
				description: 'Has "quotes" and <tags>'
			};

			const serialized = serializePrefillParams(entityWithSpecialChars);
			const result = deserializePrefillParams(serialized);

			expect(result?.name).toBe("Sir O'Brien & Co.");
			expect(result?.description).toBe('Has "quotes" and <tags>');
		});

		it('should handle unicode in round-trip', () => {
			const entityWithUnicode: ParsedEntity = {
				...mockParsedEntity,
				name: 'Éléonore 北京 🎭'
			};

			const serialized = serializePrefillParams(entityWithUnicode);
			const result = deserializePrefillParams(serialized);

			expect(result?.name).toBe('Éléonore 北京 🎭');
		});

		it('should validate that type field exists', () => {
			const invalidData = btoa(JSON.stringify({
				name: 'Test',
				description: 'Test'
				// Missing 'type' field
			}));

			const result = deserializePrefillParams(invalidData);

			expect(result).toBeNull();
		});

		it('should validate that name field exists', () => {
			const invalidData = btoa(JSON.stringify({
				type: 'npc',
				description: 'Test'
				// Missing 'name' field
			}));

			const result = deserializePrefillParams(invalidData);

			expect(result).toBeNull();
		});

		it('should validate that description field exists', () => {
			const invalidData = btoa(JSON.stringify({
				type: 'npc',
				name: 'Test'
				// Missing 'description' field
			}));

			const result = deserializePrefillParams(invalidData);

			expect(result).toBeNull();
		});
	});
});

describe('entityPrefillUtils - URL Building', () => {
	const mockParsedEntity: ParsedEntity = {
		entityType: 'npc' as EntityType,
		confidence: 0.8,
		name: 'Captain Aldric',
		description: 'A stern guard captain',
		tags: ['guard'],
		fields: {
			role: 'Guard Captain'
		},
		validationErrors: {}
	};

	describe('buildPrefillUrl', () => {
		it('should build a valid URL path', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			expect(result).toBeTruthy();
			expect(result).toContain('/entities/new/');
		});

		it('should include entity type in URL', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			expect(result).toContain('/entities/new/npc');
		});

		it('should include prefill query parameter', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			expect(result).toContain('?prefill=');
		});

		it('should have URL-safe prefill parameter', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			const urlObj = new URL(result, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');

			expect(prefillParam).toBeTruthy();
			expect(prefillParam).toMatch(/^[A-Za-z0-9+/=]+$/);
		});

		it('should build URLs for different entity types', () => {
			const locationEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'location'
			};
			const factionEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'faction'
			};

			const locationUrl = buildPrefillUrl(locationEntity);
			const factionUrl = buildPrefillUrl(factionEntity);

			expect(locationUrl).toContain('/entities/new/location');
			expect(factionUrl).toContain('/entities/new/faction');
		});

		it('should include messageId in prefill data when provided', () => {
			const messageId = 'msg-789';
			const result = buildPrefillUrl(mockParsedEntity, messageId);

			const urlObj = new URL(result, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');
			expect(prefillParam).toBeTruthy();

			const decoded = atob(prefillParam!);
			expect(decoded).toContain(messageId);
		});

		it('should not include messageId when not provided', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			const urlObj = new URL(result, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');
			expect(prefillParam).toBeTruthy();

			const decoded = atob(prefillParam!);
			expect(decoded).not.toContain('sourceMessageId');
		});

		it('should properly encode URL parameters', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			// Should be a valid URL when combined with base
			expect(() => {
				new URL(result, 'http://localhost');
			}).not.toThrow();
		});

		it('should handle entity with special characters', () => {
			const entityWithSpecialChars: ParsedEntity = {
				...mockParsedEntity,
				name: 'Test & <Test>'
			};

			const result = buildPrefillUrl(entityWithSpecialChars);

			expect(() => {
				new URL(result, 'http://localhost');
			}).not.toThrow();
		});

		it('should build URL that can be deserialized back', () => {
			const result = buildPrefillUrl(mockParsedEntity);

			const urlObj = new URL(result, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');
			expect(prefillParam).toBeTruthy();

			const deserialized = deserializePrefillParams(prefillParam!);
			expect(deserialized).toBeTruthy();
			expect(deserialized?.name).toBe('Captain Aldric');
			expect(deserialized?.type).toBe('npc');
		});

		it('should build URL for custom entity types', () => {
			const customEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'custom_magic_item' as EntityType
			};

			const result = buildPrefillUrl(customEntity);

			expect(result).toContain('/entities/new/custom_magic_item');
		});
	});
});

describe('entityPrefillUtils - Integration Tests', () => {
	describe('Complete prefill workflow', () => {
		it('should serialize, build URL, and deserialize successfully', () => {
			const originalEntity: ParsedEntity = {
				entityType: 'location' as EntityType,
				confidence: 0.9,
				name: 'The Rusty Anchor',
				description: 'A weathered tavern by the docks',
				summary: 'Dockside tavern',
				tags: ['tavern', 'docks'],
				fields: {
					locationType: 'Tavern',
					atmosphere: 'Lively and rough'
				},
				validationErrors: {}
			};

			// Build URL with messageId
			const messageId = 'msg-integration-test';
			const url = buildPrefillUrl(originalEntity, messageId);

			// Extract prefill param
			const urlObj = new URL(url, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');
			expect(prefillParam).toBeTruthy();

			// Deserialize
			const deserialized = deserializePrefillParams(prefillParam!);

			// Verify all data preserved
			expect(deserialized).toMatchObject({
				type: 'location',
				name: 'The Rusty Anchor',
				description: 'A weathered tavern by the docks',
				summary: 'Dockside tavern',
				tags: ['tavern', 'docks'],
				sourceMessageId: messageId
			});
			expect(deserialized?.fields).toEqual({
				locationType: 'Tavern',
				atmosphere: 'Lively and rough'
			});
		});

		it('should handle complex entities with all field types', () => {
			const complexEntity: ParsedEntity = {
				entityType: 'npc' as EntityType,
				confidence: 0.95,
				name: 'Zara the Enchantress',
				description: 'A mysterious wizard with ancient knowledge',
				summary: 'Ancient wizard',
				tags: ['magic', 'mysterious', 'powerful'],
				fields: {
					role: 'Court Wizard',
					personality: 'Enigmatic and calculating',
					level: 15,
					isHostile: false,
					spells: ['Fireball', 'Teleport', 'Scrying'],
					notes: 'Has connections to the Shadow Council'
				},
				validationErrors: {}
			};

			const url = buildPrefillUrl(complexEntity, 'msg-complex');
			const urlObj = new URL(url, 'http://localhost');
			const prefillParam = urlObj.searchParams.get('prefill');
			const deserialized = deserializePrefillParams(prefillParam!);

			expect(deserialized).toBeTruthy();
			expect(deserialized?.fields.level).toBe(15);
			expect(deserialized?.fields.isHostile).toBe(false);
			expect(deserialized?.fields.spells).toEqual(['Fireball', 'Teleport', 'Scrying']);
		});

		it('should maintain data integrity through multiple round-trips', () => {
			const entity: ParsedEntity = {
				entityType: 'faction' as EntityType,
				confidence: 0.85,
				name: 'The Silver Order',
				description: 'A knightly order dedicated to justice',
				tags: ['knights', 'justice'],
				fields: {
					factionType: 'Military Order',
					goals: 'Protect the innocent'
				},
				validationErrors: {}
			};

			// First round-trip
			let serialized1 = serializePrefillParams(entity);
			let deserialized1 = deserializePrefillParams(serialized1);

			// Second round-trip
			let serialized2 = serializePrefillParams({
				...entity,
				name: deserialized1!.name,
				description: deserialized1!.description
			});
			let deserialized2 = deserializePrefillParams(serialized2);

			// Should be identical
			expect(deserialized2?.name).toBe(entity.name);
			expect(deserialized2?.description).toBe(entity.description);
			expect(deserialized2?.fields).toEqual(entity.fields);
		});
	});
});
