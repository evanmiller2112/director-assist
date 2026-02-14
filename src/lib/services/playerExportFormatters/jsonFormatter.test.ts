/**
 * Tests for JSON Formatter (TDD RED Phase)
 *
 * The JSON formatter produces structured JSON output suitable for:
 * - Importing into other tools
 * - Programmatic access
 * - Data interchange
 *
 * Key requirements:
 * - Valid, parseable JSON
 * - Preserves complete data structure
 * - Respects includeTimestamps option
 * - Respects includeImages option
 * - Handles special characters correctly
 * - Properly serializes Date objects to ISO format
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect } from 'vitest';
import { formatAsJson } from './jsonFormatter';
import {
	createCompletePlayerExport,
	createEmptyPlayerExport,
	createEntityWithSpecialChars,
	createCharacterEntity,
	createDefaultOptions,
	createMinimalOptions,
	createBasePlayerExport
} from './testFixtures';
import type { PlayerExport } from '$lib/types/playerExport';

describe('jsonFormatter', () => {
	describe('formatAsJson', () => {
		describe('Valid JSON Output', () => {
			it('should produce valid, parseable JSON', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);

				// Should be parseable without throwing
				expect(() => JSON.parse(result)).not.toThrow();
			});

			it('should produce valid JSON for empty entities array', () => {
				const playerExport = createEmptyPlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities).toEqual([]);
			});

			it('should produce properly formatted JSON with correct indentation', () => {
				const playerExport = createEmptyPlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);

				// Should have newlines and indentation (pretty-printed)
				expect(result).toContain('\n');
				expect(result).toMatch(/\s{2,}/); // At least 2 spaces of indentation
			});
		});

		describe('Campaign Metadata', () => {
			it('should include version field', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.version).toBe('1.0.0');
			});

			it('should include exportedAt as ISO string', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.exportedAt).toBe('2025-01-15T10:30:00.000Z');
				// Should be able to parse back to Date
				expect(new Date(parsed.exportedAt).toISOString()).toBe('2025-01-15T10:30:00.000Z');
			});

			it('should include campaignName', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.campaignName).toBe('The Lost Kingdom of Aethermoor');
			});

			it('should include campaignDescription', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.campaignDescription).toBe(
					'An epic fantasy campaign where heroes seek to restore the fallen kingdom and uncover ancient secrets.'
				);
			});
		});

		describe('Entity Structure', () => {
			it('should include all entities with correct structure', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities).toHaveLength(6);
				expect(parsed.entities[0]).toHaveProperty('id');
				expect(parsed.entities[0]).toHaveProperty('type');
				expect(parsed.entities[0]).toHaveProperty('name');
				expect(parsed.entities[0]).toHaveProperty('description');
				expect(parsed.entities[0]).toHaveProperty('tags');
				expect(parsed.entities[0]).toHaveProperty('fields');
				expect(parsed.entities[0]).toHaveProperty('links');
			});

			it('should preserve entity id', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].id).toBe('char-001');
			});

			it('should preserve entity type', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].type).toBe('character');
				expect(parsed.entities[1].type).toBe('npc');
				expect(parsed.entities[2].type).toBe('location');
			});

			it('should preserve entity name', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].name).toBe('Sir Aldric "The Bold" Stormwind');
			});

			it('should preserve entity description', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].description).toContain('noble knight');
			});

			it('should preserve summary when present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].summary).toBe('Noble knight seeking redemption');
			});

			it('should handle missing summary', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// NPC entity doesn't have summary
				expect(parsed.entities[1]).not.toHaveProperty('summary');
			});

			it('should preserve tags array', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].tags).toEqual(['hero', 'paladin', 'nobility']);
			});

			it('should handle empty tags array', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// Minimal entity has empty tags
				expect(parsed.entities[5].tags).toEqual([]);
			});
		});

		describe('Entity Fields', () => {
			it('should preserve fields object', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].fields).toHaveProperty('class');
				expect(parsed.entities[0].fields.class).toBe('Paladin');
			});

			it('should handle numeric field values', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].fields.level).toBe(12);
				expect(typeof parsed.entities[0].fields.level).toBe('number');
			});

			it('should handle array field values', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].fields.equipment).toEqual([
					'Holy Avenger',
					'Plate Armor +2',
					'Shield of Faith'
				]);
			});

			it('should handle empty fields object', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// Minimal entity has empty fields
				expect(parsed.entities[5].fields).toEqual({});
			});
		});

		describe('Entity Links', () => {
			it('should preserve links array', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].links).toHaveLength(2);
			});

			it('should preserve link structure', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				const link = parsed.entities[0].links[0];
				expect(link.id).toBe('link-001');
				expect(link.targetId).toBe('npc-001');
				expect(link.targetType).toBe('npc');
				expect(link.relationship).toBe('mentor_of');
				expect(link.bidirectional).toBe(true);
				expect(link.reverseRelationship).toBe('student_of');
				expect(link.strength).toBe('strong');
			});

			it('should handle links without optional fields', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				const link = parsed.entities[0].links[1];
				expect(link.bidirectional).toBe(false);
				expect(link).not.toHaveProperty('reverseRelationship');
				expect(link).not.toHaveProperty('strength');
			});

			it('should handle empty links array', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// NPC entity has no links
				expect(parsed.entities[1].links).toEqual([]);
			});
		});

		describe('Timestamp Handling', () => {
			it('should include createdAt when includeTimestamps is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].createdAt).toBe('2025-01-01T08:00:00.000Z');
			});

			it('should include updatedAt when includeTimestamps is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].updatedAt).toBe('2025-01-10T14:30:00.000Z');
			});

			it('should exclude createdAt when includeTimestamps is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: false };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('createdAt');
			});

			it('should exclude updatedAt when includeTimestamps is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: false };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('updatedAt');
			});

			it('should serialize Date objects to ISO 8601 format', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
				expect(parsed.entities[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
			});
		});

		describe('Image URL Handling', () => {
			it('should include imageUrl when includeImages is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].imageUrl).toBe('https://example.com/images/aldric.png');
			});

			it('should exclude imageUrl when includeImages is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: false };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('imageUrl');
			});

			it('should handle missing imageUrl when includeImages is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// NPC entity doesn't have imageUrl
				expect(parsed.entities[1]).not.toHaveProperty('imageUrl');
			});
		});

		describe('Special Character Handling', () => {
			it('should handle special characters in entity names', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].name).toBe('Tome of <Ancient> Knowledge & "Forbidden" Secrets');
			});

			it('should handle special characters in descriptions', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].description).toContain('<script>alert("test")</script>');
				expect(parsed.entities[0].description).toContain('**bold**');
				expect(parsed.entities[0].description).toContain('&');
			});

			it('should handle special characters in field values', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].fields.specialChars).toBe(
					'Symbols: < > & " \' ` | \\ / * _ [ ] ( ) { } # + - . !'
				);
			});

			it('should handle JSON content in field values', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].fields.jsonContent).toBe(
					'{"key": "value", "nested": {"array": [1, 2, 3]}}'
				);
			});

			it('should handle Unicode characters', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						name: 'Ælfred the Wise 智者',
						description: 'A scholar who studies runes: ᚠᚢᚦᚨᚱᚲ and kanji: 漢字'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].name).toBe('Ælfred the Wise 智者');
				expect(parsed.entities[0].description).toContain('ᚠᚢᚦᚨᚱᚲ');
				expect(parsed.entities[0].description).toContain('漢字');
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty campaign name', () => {
				const playerExport = createCompletePlayerExport();
				playerExport.campaignName = '';
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.campaignName).toBe('');
			});

			it('should handle empty campaign description', () => {
				const playerExport = createCompletePlayerExport();
				playerExport.campaignDescription = '';
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.campaignDescription).toBe('');
			});

			it('should handle entity with all optional fields present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				const character = parsed.entities[0];
				expect(character).toHaveProperty('summary');
				expect(character).toHaveProperty('imageUrl');
				expect(character).toHaveProperty('createdAt');
				expect(character).toHaveProperty('updatedAt');
			});

			it('should handle entity with all optional fields missing', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: false, includeImages: false };

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				const npc = parsed.entities[1]; // NPC has no summary or imageUrl
				expect(npc).not.toHaveProperty('summary');
				expect(npc).not.toHaveProperty('imageUrl');
				expect(npc).not.toHaveProperty('createdAt');
				expect(npc).not.toHaveProperty('updatedAt');
			});
		});

		describe('Options Interaction', () => {
			it('should respect all options when all are false', () => {
				const playerExport = createCompletePlayerExport();
				const options = createMinimalOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('createdAt');
				expect(parsed.entities[0]).not.toHaveProperty('updatedAt');
				expect(parsed.entities[0]).not.toHaveProperty('imageUrl');
			});

			it('should respect all options when all are true', () => {
				const playerExport = createCompletePlayerExport();
				const options = {
					format: 'json' as const,
					includeTimestamps: true,
					includeImages: true,
					groupByType: true
				};

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).toHaveProperty('createdAt');
				expect(parsed.entities[0]).toHaveProperty('updatedAt');
				expect(parsed.entities[0]).toHaveProperty('imageUrl');
			});

			it('should not be affected by groupByType option (JSON is always flat)', () => {
				const playerExport = createCompletePlayerExport();
				const optionsGrouped = { ...createDefaultOptions(), groupByType: true };
				const optionsUngrouped = { ...createDefaultOptions(), groupByType: false };

				const resultGrouped = formatAsJson(playerExport, optionsGrouped);
				const resultUngrouped = formatAsJson(playerExport, optionsUngrouped);

				// JSON output should be identical regardless of groupByType
				expect(JSON.parse(resultGrouped)).toEqual(JSON.parse(resultUngrouped));
			});
		});

		// -----------------------------------------------------------------------
		// GitHub Issue #522: Core field visibility - empty field handling
		// -----------------------------------------------------------------------
		describe('Core field visibility (Issue #522)', () => {
			it('should include description as empty string when description is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: ''
					}
				];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].description).toBe('');
			});

			it('should include tags as empty array when tags array is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						tags: []
					}
				];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].tags).toEqual([]);
			});

			it('should include links as empty array when links array is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						links: []
					}
				];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0].links).toEqual([]);
			});

			it('should not include createdAt when undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				(entity as any).createdAt = undefined;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('createdAt');
			});

			it('should not include updatedAt when undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				(entity as any).updatedAt = undefined;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('updatedAt');
			});

			it('should handle entity with all core fields empty/hidden gracefully', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				entity.description = '';
				entity.tags = [];
				entity.links = [];
				delete entity.summary;
				delete entity.imageUrl;
				(entity as any).createdAt = undefined;
				(entity as any).updatedAt = undefined;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				// Should still have core structure
				expect(parsed.entities[0].id).toBe('char-001');
				expect(parsed.entities[0].name).toContain('Sir Aldric');
				expect(parsed.entities[0].description).toBe('');
				expect(parsed.entities[0].tags).toEqual([]);
				expect(parsed.entities[0].links).toEqual([]);
				expect(parsed.entities[0]).not.toHaveProperty('summary');
				expect(parsed.entities[0]).not.toHaveProperty('imageUrl');
				expect(parsed.entities[0]).not.toHaveProperty('createdAt');
				expect(parsed.entities[0]).not.toHaveProperty('updatedAt');
			});

			it('should not include summary when undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				delete entity.summary;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('summary');
			});

			it('should not include imageUrl when undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				delete entity.imageUrl;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsJson(playerExport, options);
				const parsed = JSON.parse(result);

				expect(parsed.entities[0]).not.toHaveProperty('imageUrl');
			});
		});
	});
});
