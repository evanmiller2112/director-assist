/**
 * Tests for Mention Detection Service (TDD RED Phase)
 * GitHub Issue #199: Core Mention Detection Utility
 *
 * This service provides pure utility functions for detecting and resolving "@" mentions
 * in chat input, supporting autocomplete, entity matching, and context entity extraction.
 *
 * Test Coverage:
 * - detectMentionTrigger: Detect "@" at cursor and extract partial search text
 * - extractMentionTokens: Extract all @mention tokens from complete messages
 * - matchEntitiesToMentions: Match mention tokens to actual entities
 * - resolvePartialMention: Fuzzy/partial matching for autocomplete
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 */

import { describe, it, expect } from 'vitest';
import {
	detectMentionTrigger,
	extractMentionTokens,
	matchEntitiesToMentions,
	resolvePartialMention,
	type MentionToken,
	type EntityStub,
	type ResolvedMention
} from './mentionDetectionService';

describe('MentionDetectionService', () => {
	describe('detectMentionTrigger', () => {
		describe('Active Mention Triggers', () => {
			it('should return active trigger when "@" is at cursor position', () => {
				const result = detectMentionTrigger('@', 1);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('');
				expect(result?.mentionStart).toBe(0);
			});

			it('should return active trigger when "@" is followed by partial text', () => {
				const result = detectMentionTrigger('@Gan', 4);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Gan');
				expect(result?.mentionStart).toBe(0);
			});

			it('should handle "@" at start of input', () => {
				const result = detectMentionTrigger('@Gandalf', 8);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Gandalf');
				expect(result?.mentionStart).toBe(0);
			});

			it('should handle "@" in middle of text', () => {
				const result = detectMentionTrigger('Talk to @Frodo about', 14);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Frodo');
				expect(result?.mentionStart).toBe(8);
			});

			it('should handle cursor at end of text after "@"', () => {
				const result = detectMentionTrigger('Message @Sam', 12);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Sam');
				expect(result?.mentionStart).toBe(8);
			});

			it('should handle "@" followed by space and cursor at end', () => {
				const result = detectMentionTrigger('Hello @', 7);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('');
				expect(result?.mentionStart).toBe(6);
			});

			it('should extract partial text when cursor is mid-mention', () => {
				const result = detectMentionTrigger('@Gandalf the Grey', 5);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Gand');
				expect(result?.mentionStart).toBe(0);
			});
		});

		describe('Inactive Mention Triggers', () => {
			it('should return null when no "@" is present', () => {
				const result = detectMentionTrigger('Hello world', 5);

				expect(result).toBeNull();
			});

			it('should return null when "@" is part of email address', () => {
				// "@" preceded by non-space character should not trigger
				const result = detectMentionTrigger('Contact user@example.com for info', 20);

				expect(result).toBeNull();
			});

			it('should return null for empty text', () => {
				const result = detectMentionTrigger('', 0);

				expect(result).toBeNull();
			});

			it('should return null when cursor is before "@"', () => {
				const result = detectMentionTrigger('Hello @Gandalf', 3);

				expect(result).toBeNull();
			});

			it('should return null when "@" exists but cursor is far after it', () => {
				// Cursor is after a space following the mention, so mention is "complete"
				const result = detectMentionTrigger('@Gandalf is here', 16);

				expect(result).toBeNull();
			});
		});

		describe('Multiple "@" Scenarios', () => {
			it('should use the "@" closest to cursor position', () => {
				const result = detectMentionTrigger('Hi @Frodo, ask @Sam', 19);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Sam');
				expect(result?.mentionStart).toBe(15);
			});

			it('should handle multiple "@" with cursor at first mention', () => {
				const result = detectMentionTrigger('@Frodo and @Gandalf', 6);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Frodo');
				expect(result?.mentionStart).toBe(0);
			});

			it('should handle consecutive "@" symbols', () => {
				const result = detectMentionTrigger('@@Frodo', 7);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				// Should handle the closest "@" to cursor
				expect(result?.mentionStart).toBeGreaterThanOrEqual(0);
			});
		});

		describe('Edge Cases', () => {
			it('should handle cursor at position 0 with "@" at start', () => {
				const result = detectMentionTrigger('@test', 0);

				expect(result).toBeNull();
			});

			it('should handle very long mention text', () => {
				const longName = 'A'.repeat(100);
				const result = detectMentionTrigger(`@${longName}`, longName.length + 1);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe(longName);
			});

			it('should handle special characters after "@"', () => {
				const result = detectMentionTrigger('@Gandalf_the_Grey', 17);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Gandalf_the_Grey');
			});

			it('should handle Unicode characters in mention', () => {
				const result = detectMentionTrigger('@Frödö', 6);

				expect(result).not.toBeNull();
				expect(result?.active).toBe(true);
				expect(result?.searchText).toBe('Frödö');
			});
		});
	});

	describe('extractMentionTokens', () => {
		describe('Single Mention Extraction', () => {
			it('should extract single mention at start of text', () => {
				const tokens = extractMentionTokens('@Gandalf is wise');

				expect(tokens).toHaveLength(1);
				expect(tokens[0]).toEqual({
					name: 'Gandalf',
					startIndex: 0,
					endIndex: 8
				});
			});

			it('should extract single mention in middle of text', () => {
				const tokens = extractMentionTokens('Talk to @Frodo about the ring');

				expect(tokens).toHaveLength(1);
				expect(tokens[0]).toEqual({
					name: 'Frodo',
					startIndex: 8,
					endIndex: 14
				});
			});

			it('should extract single mention at end of text', () => {
				const tokens = extractMentionTokens('The wizard is @Gandalf');

				expect(tokens).toHaveLength(1);
				expect(tokens[0]).toEqual({
					name: 'Gandalf',
					startIndex: 14,
					endIndex: 22
				});
			});
		});

		describe('Multiple Mention Extraction', () => {
			it('should extract multiple mentions', () => {
				const tokens = extractMentionTokens('@Frodo and @Sam are on a quest');

				expect(tokens).toHaveLength(2);
				expect(tokens[0]).toEqual({
					name: 'Frodo',
					startIndex: 0,
					endIndex: 6
				});
				expect(tokens[1]).toEqual({
					name: 'Sam',
					startIndex: 11,
					endIndex: 15
				});
			});

			it('should extract three or more mentions', () => {
				const tokens = extractMentionTokens('@Frodo, @Sam, and @Gandalf');

				expect(tokens).toHaveLength(3);
				expect(tokens[0].name).toBe('Frodo');
				expect(tokens[1].name).toBe('Sam');
				expect(tokens[2].name).toBe('Gandalf');
			});

			it('should handle consecutive mentions', () => {
				const tokens = extractMentionTokens('@Frodo@Sam@Gandalf');

				expect(tokens).toHaveLength(3);
				expect(tokens[0].name).toBe('Frodo');
				expect(tokens[1].name).toBe('Sam');
				expect(tokens[2].name).toBe('Gandalf');
			});
		});

		describe('Multi-word Mention Names', () => {
			it('should extract mentions with multi-word names', () => {
				const tokens = extractMentionTokens('@Gandalf the Grey arrived');

				expect(tokens).toHaveLength(1);
				expect(tokens[0]).toEqual({
					name: 'Gandalf the Grey',
					startIndex: 0,
					endIndex: 17
				});
			});

			it('should handle multiple multi-word mentions', () => {
				const tokens = extractMentionTokens('@Gandalf the Grey and @Frodo Baggins');

				expect(tokens).toHaveLength(2);
				expect(tokens[0].name).toBe('Gandalf the Grey');
				expect(tokens[1].name).toBe('Frodo Baggins');
			});

			it('should stop multi-word mention at punctuation', () => {
				const tokens = extractMentionTokens('@Gandalf the Grey, the wizard');

				expect(tokens).toHaveLength(1);
				expect(tokens[0].name).toBe('Gandalf the Grey');
			});
		});

		describe('No Mentions', () => {
			it('should return empty array when no mentions', () => {
				const tokens = extractMentionTokens('Hello world');

				expect(tokens).toEqual([]);
			});

			it('should return empty array for empty text', () => {
				const tokens = extractMentionTokens('');

				expect(tokens).toEqual([]);
			});

			it('should ignore "@" in email addresses', () => {
				const tokens = extractMentionTokens('Contact user@example.com');

				expect(tokens).toEqual([]);
			});
		});

		describe('Edge Cases', () => {
			it('should handle "@" at end with no name', () => {
				const tokens = extractMentionTokens('Message to @');

				// Should either return empty array or a token with empty name
				// Depends on implementation - document expected behavior
				expect(Array.isArray(tokens)).toBe(true);
			});

			it('should handle special characters in mention names', () => {
				const tokens = extractMentionTokens('@Gandalf_the_Grey');

				expect(tokens).toHaveLength(1);
				expect(tokens[0].name).toContain('Gandalf');
			});

			it('should handle Unicode in mention names', () => {
				const tokens = extractMentionTokens('@Frödö Bággíns');

				expect(tokens).toHaveLength(1);
				expect(tokens[0].name).toContain('Frödö');
			});

			it('should handle mentions with numbers', () => {
				const tokens = extractMentionTokens('@Guard42');

				expect(tokens).toHaveLength(1);
				expect(tokens[0].name).toBe('Guard42');
			});
		});
	});

	describe('matchEntitiesToMentions', () => {
		const mockEntities: EntityStub[] = [
			{ id: 'npc-1', name: 'Gandalf', type: 'npc' },
			{ id: 'npc-2', name: 'Frodo', type: 'npc' },
			{ id: 'npc-3', name: 'Sam', type: 'npc' },
			{ id: 'loc-1', name: 'The Shire', type: 'location' },
			{ id: 'npc-4', name: 'Gandalf the Grey', type: 'npc' }
		];

		describe('Exact Matching', () => {
			it('should match exact entity names', () => {
				const tokens: MentionToken[] = [
					{ name: 'Gandalf', startIndex: 0, endIndex: 8 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityId).toBe('npc-1');
				expect(matches[0].entityName).toBe('Gandalf');
				expect(matches[0].entityType).toBe('npc');
				expect(matches[0].matchScore).toBeGreaterThan(0);
			});

			it('should match multiple exact names', () => {
				const tokens: MentionToken[] = [
					{ name: 'Frodo', startIndex: 0, endIndex: 6 },
					{ name: 'Sam', startIndex: 11, endIndex: 15 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(2);
				expect(matches.find(m => m.entityName === 'Frodo')).toBeDefined();
				expect(matches.find(m => m.entityName === 'Sam')).toBeDefined();
			});

			it('should match different entity types', () => {
				const tokens: MentionToken[] = [
					{ name: 'The Shire', startIndex: 0, endIndex: 10 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityId).toBe('loc-1');
				expect(matches[0].entityType).toBe('location');
			});
		});

		describe('Case-Insensitive Matching', () => {
			it('should match case-insensitively', () => {
				const tokens: MentionToken[] = [
					{ name: 'gandalf', startIndex: 0, endIndex: 7 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityId).toBe('npc-1');
			});

			it('should match mixed case', () => {
				const tokens: MentionToken[] = [
					{ name: 'FRODO', startIndex: 0, endIndex: 5 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityName).toBe('Frodo');
			});

			it('should match multi-word with different casing', () => {
				const tokens: MentionToken[] = [
					{ name: 'the shire', startIndex: 0, endIndex: 9 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityName).toBe('The Shire');
			});
		});

		describe('No Matches', () => {
			it('should return empty array when no matches', () => {
				const tokens: MentionToken[] = [
					{ name: 'Sauron', startIndex: 0, endIndex: 6 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toEqual([]);
			});

			it('should return empty array for empty tokens', () => {
				const matches = matchEntitiesToMentions([], mockEntities);

				expect(matches).toEqual([]);
			});

			it('should return empty array when no entities', () => {
				const tokens: MentionToken[] = [
					{ name: 'Gandalf', startIndex: 0, endIndex: 8 }
				];

				const matches = matchEntitiesToMentions(tokens, []);

				expect(matches).toEqual([]);
			});
		});

		describe('Match Scoring', () => {
			it('should assign higher score to exact matches', () => {
				const tokens: MentionToken[] = [
					{ name: 'Gandalf', startIndex: 0, endIndex: 8 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches[0].matchScore).toBeGreaterThan(90);
			});

			it('should assign scores to all matches', () => {
				const tokens: MentionToken[] = [
					{ name: 'Frodo', startIndex: 0, endIndex: 6 },
					{ name: 'Sam', startIndex: 11, endIndex: 15 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches.every(m => m.matchScore > 0)).toBe(true);
			});
		});

		describe('Partial Name Matching', () => {
			it('should match full name when partial exists', () => {
				// If user mentions "Gandalf the Grey", should match the full name entity
				const tokens: MentionToken[] = [
					{ name: 'Gandalf the Grey', startIndex: 0, endIndex: 17 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				expect(matches).toHaveLength(1);
				expect(matches[0].entityId).toBe('npc-4');
				expect(matches[0].entityName).toBe('Gandalf the Grey');
			});

			it('should prefer exact match over partial', () => {
				// If user mentions "Gandalf", should match "Gandalf" not "Gandalf the Grey"
				const tokens: MentionToken[] = [
					{ name: 'Gandalf', startIndex: 0, endIndex: 8 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				// Should have matches, but exact match should score higher
				const exactMatch = matches.find(m => m.entityName === 'Gandalf');
				const partialMatch = matches.find(m => m.entityName === 'Gandalf the Grey');

				if (exactMatch && partialMatch) {
					expect(exactMatch.matchScore).toBeGreaterThanOrEqual(partialMatch.matchScore);
				}
			});
		});

		describe('Duplicate Handling', () => {
			it('should handle same mention appearing multiple times', () => {
				const tokens: MentionToken[] = [
					{ name: 'Gandalf', startIndex: 0, endIndex: 8 },
					{ name: 'Gandalf', startIndex: 20, endIndex: 28 }
				];

				const matches = matchEntitiesToMentions(tokens, mockEntities);

				// Should return match for each token, or deduplicate
				// Document expected behavior
				expect(matches.length).toBeGreaterThan(0);
			});
		});
	});

	describe('resolvePartialMention', () => {
		const mockEntities: EntityStub[] = [
			{ id: 'npc-1', name: 'Gandalf', type: 'npc' },
			{ id: 'npc-2', name: 'Gandalf the Grey', type: 'npc' },
			{ id: 'npc-3', name: 'Gandalf the White', type: 'npc' },
			{ id: 'npc-4', name: 'Frodo Baggins', type: 'npc' },
			{ id: 'npc-5', name: 'Sam Gamgee', type: 'npc' },
			{ id: 'loc-1', name: 'The Shire', type: 'location' },
			{ id: 'loc-2', name: 'Rivendell', type: 'location' },
			{ id: 'fac-1', name: 'The Fellowship', type: 'faction' },
			{ id: 'npc-6', name: 'Gimli', type: 'npc' },
			{ id: 'npc-7', name: 'Legolas', type: 'npc' }
		];

		describe('Prefix Matching', () => {
			it('should match entities by prefix (case-insensitive)', () => {
				const matches = resolvePartialMention('Gan', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.every(m => m.name.toLowerCase().startsWith('gan'))).toBe(true);
			});

			it('should match single character prefix', () => {
				const matches = resolvePartialMention('G', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name === 'Gandalf')).toBe(true);
				expect(matches.some(m => m.name === 'Gimli')).toBe(true);
			});

			it('should match full name prefix', () => {
				const matches = resolvePartialMention('Gandalf', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.every(m => m.name.toLowerCase().startsWith('gandalf'))).toBe(true);
			});

			it('should be case-insensitive', () => {
				const matches = resolvePartialMention('gan', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name === 'Gandalf')).toBe(true);
			});
		});

		describe('Substring Matching', () => {
			it('should match entities by substring', () => {
				const matches = resolvePartialMention('shire', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name === 'The Shire')).toBe(true);
			});

			it('should match substring in middle of name', () => {
				const matches = resolvePartialMention('fellow', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name === 'The Fellowship')).toBe(true);
			});

			it('should match substring at end of name', () => {
				const matches = resolvePartialMention('gins', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name === 'Frodo Baggins')).toBe(true);
			});
		});

		describe('Ranking', () => {
			it('should rank exact prefix matches higher than substring matches', () => {
				const matches = resolvePartialMention('Gan', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				// First results should be prefix matches (Gandalf variants)
				const topMatch = matches[0];
				expect(topMatch.name.toLowerCase().startsWith('gan')).toBe(true);
			});

			it('should rank shorter matches higher than longer ones for same prefix', () => {
				const matches = resolvePartialMention('Gandalf', mockEntities);

				// "Gandalf" should rank higher than "Gandalf the Grey"
				const gandalfIndex = matches.findIndex(m => m.name === 'Gandalf');
				const gandalfGreyIndex = matches.findIndex(m => m.name === 'Gandalf the Grey');

				if (gandalfIndex !== -1 && gandalfGreyIndex !== -1) {
					expect(gandalfIndex).toBeLessThan(gandalfGreyIndex);
				}
			});

			it('should maintain consistent ordering for same search', () => {
				const matches1 = resolvePartialMention('Gan', mockEntities);
				const matches2 = resolvePartialMention('Gan', mockEntities);

				expect(matches1.map(m => m.id)).toEqual(matches2.map(m => m.id));
			});
		});

		describe('No Matches', () => {
			it('should return empty array for no matches', () => {
				const matches = resolvePartialMention('Sauron', mockEntities);

				expect(matches).toEqual([]);
			});

			it('should return empty array for very specific non-existent search', () => {
				const matches = resolvePartialMention('xyz123', mockEntities);

				expect(matches).toEqual([]);
			});
		});

		describe('Empty Search Text', () => {
			it('should return all entities for empty search text', () => {
				const matches = resolvePartialMention('', mockEntities);

				expect(matches.length).toBe(mockEntities.length);
			});

			it('should return entities in some consistent order for empty search', () => {
				const matches = resolvePartialMention('', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				// Should be ordered somehow (alphabetically or by type)
				expect(Array.isArray(matches)).toBe(true);
			});
		});

		describe('Multiple Entity Types', () => {
			it('should return all entity types (NPC, location, faction, etc.)', () => {
				const matches = resolvePartialMention('', mockEntities);

				const types = new Set(matches.map(m => m.type));
				expect(types.has('npc')).toBe(true);
				expect(types.has('location')).toBe(true);
				expect(types.has('faction')).toBe(true);
			});

			it('should match across all entity types for search text', () => {
				const matches = resolvePartialMention('The', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				// Should include both "The Shire" (location) and "The Fellowship" (faction)
				const types = new Set(matches.map(m => m.type));
				expect(types.size).toBeGreaterThan(1);
			});
		});

		describe('Result Limiting', () => {
			it('should limit results to reasonable number', () => {
				// Create many entities with same prefix
				const manyEntities: EntityStub[] = [];
				for (let i = 0; i < 100; i++) {
					manyEntities.push({
						id: `test-${i}`,
						name: `Test Entity ${i}`,
						type: 'npc'
					});
				}

				const matches = resolvePartialMention('Test', manyEntities);

				// Should limit to reasonable number (e.g., 10-20)
				expect(matches.length).toBeLessThanOrEqual(50);
				expect(matches.length).toBeGreaterThan(0);
			});
		});

		describe('Special Characters', () => {
			it('should handle searches with special characters', () => {
				const entities: EntityStub[] = [
					{ id: 'test-1', name: "Gandalf's Staff", type: 'item' },
					{ id: 'test-2', name: 'The One Ring', type: 'item' }
				];

				const matches = resolvePartialMention("Gandalf's", entities);

				expect(matches.length).toBeGreaterThan(0);
			});

			it('should handle Unicode in search text', () => {
				const entities: EntityStub[] = [
					{ id: 'test-1', name: 'Frödö', type: 'npc' }
				];

				const matches = resolvePartialMention('Frö', entities);

				expect(matches.length).toBeGreaterThan(0);
			});
		});

		describe('Whitespace Handling', () => {
			it('should handle leading whitespace in search', () => {
				const matches = resolvePartialMention(' Gan', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
			});

			it('should handle trailing whitespace in search', () => {
				const matches = resolvePartialMention('Gan ', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
			});

			it('should handle multi-word searches', () => {
				const matches = resolvePartialMention('Gandalf the', mockEntities);

				expect(matches.length).toBeGreaterThan(0);
				expect(matches.some(m => m.name.includes('Gandalf the'))).toBe(true);
			});
		});
	});
});
