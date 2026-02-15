/**
 * Tests for Markdown Formatter (TDD RED Phase)
 *
 * The Markdown formatter produces well-structured Markdown suitable for:
 * - Pasting into wikis (Notion, Obsidian, etc.)
 * - Version control (readable diffs)
 * - Note-taking applications
 *
 * Key requirements:
 * - Valid Markdown syntax
 * - Clear heading hierarchy (h1 campaign, h2 types, h3 entities)
 * - Table of contents with anchor links
 * - Escape Markdown special characters
 * - Support grouping by entity type
 * - Include images as markdown image syntax
 * - Respect includeTimestamps option
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect } from 'vitest';
import { formatAsMarkdown } from './markdownFormatter';
import {
	createCompletePlayerExport,
	createEmptyPlayerExport,
	createEntityWithSpecialChars,
	createCharacterEntity,
	createDefaultOptions,
	createMinimalOptions,
	createBasePlayerExport
} from './testFixtures';

describe('markdownFormatter', () => {
	describe('formatAsMarkdown', () => {
		describe('Document Structure', () => {
			it('should include campaign name as h1 heading', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/^# The Lost Kingdom of Aethermoor/m);
			});

			it('should include campaign description', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('An epic fantasy campaign');
			});

			it('should have proper heading hierarchy', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// h1 for campaign, h2 for sections/types, h3 for entities
				expect(result).toMatch(/^# /m); // h1
				expect(result).toMatch(/^## /m); // h2
				expect(result).toMatch(/^### /m); // h3
			});
		});

		describe('Table of Contents', () => {
			it('should include a table of contents section', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/## Table of Contents|## Contents/i);
			});

			it('should include links to entity sections in TOC', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsMarkdown(playerExport, options);

				// Should have markdown links [text](#anchor)
				expect(result).toMatch(/\[.*\]\(#.*\)/);
			});

			it('should create working anchor links in TOC', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsMarkdown(playerExport, options);

				// TOC should link to sections that exist
				const tocMatch = result.match(/\[([^\]]+)\]\(#([^)]+)\)/);
				if (tocMatch) {
					const anchor = tocMatch[2];
					// The heading should exist in the document
					expect(result).toMatch(new RegExp(`^##+ .*${anchor}`, 'im'));
				}
			});

			it('should organize TOC by entity type when groupByType is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsMarkdown(playerExport, options);

				// Should have type sections in TOC
				expect(result).toMatch(/\[.*[Cc]haracter.*\]/);
				expect(result).toMatch(/\[.*NPC.*\]/);
				expect(result).toMatch(/\[.*[Ll]ocation.*\]/);
			});
		});

		describe('Entity Grouping', () => {
			it('should group entities by type with h2 headings when groupByType is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/^## [Cc]haracters?$/m);
				expect(result).toMatch(/^## NPCs?$/m);
				expect(result).toMatch(/^## [Ll]ocations?$/m);
			});

			it('should list entities under their type sections when grouped', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsMarkdown(playerExport, options);

				// Character section should contain character entity
				const characterSectionMatch = result.match(/^## [Cc]haracters?$([\s\S]*?)^## /m);
				if (characterSectionMatch) {
					expect(characterSectionMatch[1]).toContain('Sir Aldric');
				}
			});

			it('should not include type headings when groupByType is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: false };

				const result = formatAsMarkdown(playerExport, options);

				// Should not have type-specific h2 headings
				expect(result).not.toMatch(/^## [Cc]haracters?$/m);
				expect(result).not.toMatch(/^## NPCs?$/m);
			});

			it('should list entities in order when groupByType is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: false };

				const result = formatAsMarkdown(playerExport, options);

				const aldricPos = result.indexOf('Sir Aldric');
				const elaraPos = result.indexOf('Elara Moonwhisper');
				const castlePos = result.indexOf('Castle Ravencrest');

				expect(aldricPos).toBeLessThan(elaraPos);
				expect(elaraPos).toBeLessThan(castlePos);
			});
		});

		describe('Entity Display', () => {
			it('should display entity names as h3 headings', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/^### Sir Aldric/m);
				expect(result).toMatch(/^### Elara Moonwhisper/m);
			});

			it('should include entity type indicator', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should show type as badge, label, or inline text
				expect(result).toMatch(/character|Character/);
				expect(result).toMatch(/npc|NPC/);
				expect(result).toMatch(/location|Location/);
			});

			it('should display entity descriptions', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('noble knight');
				expect(result).toContain('enigmatic elf mage');
			});

			it('should display entity summaries when present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Noble knight seeking redemption');
			});

			it('should display entity ID', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('char-001');
				expect(result).toContain('npc-001');
			});

			it('should handle empty entities array gracefully', () => {
				const playerExport = createEmptyPlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('# Empty Campaign');
				expect(result).toMatch(/no entities|empty/i);
			});
		});

		describe('Entity Fields', () => {
			it('should display entity fields section', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should have a fields/attributes/properties section
				expect(result).toMatch(/fields|attributes|properties/i);
			});

			it('should display field names and values', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('class');
				expect(result).toContain('Paladin');
				expect(result).toContain('level');
				expect(result).toContain('12');
			});

			it('should format fields as list or table', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should use markdown list (- or *) or table (|)
				expect(result).toMatch(/^[\s-*]|^\|/m);
			});

			it('should handle array field values', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Holy Avenger');
				expect(result).toContain('Plate Armor +2');
				expect(result).toContain('Shield of Faith');
			});

			it('should handle empty fields object', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Minimal entity has no fields - should not crash
				expect(result).toContain('Ambush at Darkwood');
			});
		});

		describe('Entity Tags', () => {
			it('should display entity tags', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('hero');
				expect(result).toContain('paladin');
				expect(result).toContain('nobility');
			});

			it('should format tags distinctly from regular text', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Tags should be formatted (e.g., `tag`, #tag, or in a special section)
				expect(result).toMatch(/`hero`|#hero|\[hero\]|tags?:/i);
			});

			it('should handle empty tags array', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Minimal entity has empty tags - should not crash
				expect(result).toContain('Ambush at Darkwood');
			});
		});

		describe('Relationships Section', () => {
			it('should include relationships section for entities with links', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/relationships?|links?|connections?/i);
			});

			it('should display relationship type', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('mentor_of');
				expect(result).toContain('resides_at');
			});

			it('should display target entity ID', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('npc-001');
				expect(result).toContain('loc-001');
			});

			it('should indicate bidirectional relationships', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should show ↔ or "bidirectional" or both directions
				expect(result).toMatch(/↔|bidirectional|student_of/i);
			});

			it('should display relationship strength when present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('strong');
			});

			it('should handle entities with no relationships', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// NPC has no links - should not crash
				expect(result).toContain('Elara Moonwhisper');
			});
		});

		describe('Markdown Escaping', () => {
			it('should escape * character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// * should be escaped to prevent unintended emphasis
				expect(result).toMatch(/\\\*/);
			});

			it('should escape _ character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// _ should be escaped to prevent unintended emphasis
				expect(result).toMatch(/\\_/);
			});

			it('should escape [ and ] characters in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Brackets should be escaped to prevent unintended links
				expect(result).toMatch(/\\\[|\\\]/);
			});

			it('should escape # character at line start', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				entity.description = '# This should not be a heading';
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// # in content should be escaped
				expect(result).toMatch(/\\#.*should not be a heading/);
			});

			it('should handle existing markdown in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// **bold** should be escaped so it appears as literal text
				expect(result).toContain('\\*\\*bold\\*\\*');
			});

			it('should not break code blocks or inline code', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				entity.fields = {
					...entity.fields,
					spell: 'Cast `fireball` using 3rd level slot'
				};
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Backticks should be preserved for inline code
				expect(result).toContain('`fireball`');
			});
		});

		describe('Image Handling', () => {
			it('should include markdown image syntax when includeImages is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/!\[.*\]\(https:\/\/example\.com\/images\/aldric\.png\)/);
			});

			it('should not include images when includeImages is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: false };

				const result = formatAsMarkdown(playerExport, options);

				expect(result).not.toContain('![');
				expect(result).not.toContain('https://example.com/images/aldric.png');
			});

			it('should include descriptive alt text in image syntax', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsMarkdown(playerExport, options);

				// Alt text should mention the entity name
				expect(result).toMatch(/!\[.*Sir Aldric.*\]/);
			});

			it('should handle entities without imageUrl', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsMarkdown(playerExport, options);

				// NPC has no image - should not crash
				expect(result).toContain('Elara Moonwhisper');
			});
		});

		describe('Timestamp Display', () => {
			it('should include timestamps when includeTimestamps is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/[Cc]reated|[Uu]pdated/);
				expect(result).toContain('2025-01-01');
			});

			it('should not include timestamps when includeTimestamps is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: false };

				const result = formatAsMarkdown(playerExport, options);

				expect(result).not.toContain('2025-01-01T08:00:00');
			});

			it('should format timestamps in readable format', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsMarkdown(playerExport, options);

				// Should be formatted nicely
				expect(result).toMatch(/2025-01-01|January.*2025/);
			});
		});

		describe('Export Metadata', () => {
			it('should include export version', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('1.0.0');
			});

			it('should include export date', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toMatch(/2025-01-15/);
			});

			it('should format metadata section clearly', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should have a metadata/info section
				expect(result).toMatch(/export|metadata|information/i);
			});
		});

		describe('Formatting and Readability', () => {
			it('should use proper line spacing between sections', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should have blank lines between major sections
				expect(result).toContain('\n\n');
			});

			it('should use consistent list formatting', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should consistently use - or * for lists
				const listMatches = result.match(/^[\s]*[-*]/gm);
				if (listMatches && listMatches.length > 1) {
					// All should use the same marker
					const markers = listMatches.map((m) => m.trim()[0]);
					expect(new Set(markers).size).toBeLessThanOrEqual(2); // Allow for nested lists
				}
			});

			it('should not have excessive blank lines', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should not have more than 2 consecutive blank lines
				expect(result).not.toMatch(/\n\n\n\n/);
			});

			it('should use horizontal rules to separate major sections', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should have horizontal rules (---, ***, or ___)
				expect(result).toMatch(/^(-{3,}|\*{3,}|_{3,})$/m);
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long entity names', () => {
				const playerExport = createBasePlayerExport();
				const longName = 'A'.repeat(200);
				playerExport.entities = [
					{
						...createCharacterEntity(),
						name: longName
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain(longName);
			});

			it('should handle entity names with special markdown characters', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						name: 'Sir [Bold] *Knight* _Underscore_ #Tagged'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Special characters should be escaped
				expect(result).toMatch(/\\[|\\]|\\\*|\\_|\\#/);
			});

			it('should handle multiline descriptions', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should preserve paragraph breaks
				expect(result).toMatch(/First paragraph\.\s+Second paragraph/);
			});

			it('should handle entity with many tags', () => {
				const playerExport = createBasePlayerExport();
				const manyTags = Array.from({ length: 30 }, (_, i) => `tag${i}`);
				playerExport.entities = [
					{
						...createCharacterEntity(),
						tags: manyTags
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('tag0');
				expect(result).toContain('tag29');
			});

			it('should handle mixed content with special characters', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Should be parseable markdown without syntax errors
				expect(result).toBeTruthy();
				expect(result.length).toBeGreaterThan(100);
			});
		});

		describe('Cross-references', () => {
			it('should handle entity cross-references in links', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Links should reference other entities
				expect(result).toContain('npc-001');
				expect(result).toContain('loc-001');
			});

			it('could create anchor links to referenced entities', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Optional: links could be clickable markdown links
				// This tests if implementation goes the extra mile
				if (result.includes('[npc-001]')) {
					expect(result).toMatch(/\[npc-001\]\(#.*\)/);
				}
			});
		});

		describe('Unicode and Special Characters', () => {
			it('should handle Unicode characters in entity names', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						name: 'Ælfred the Wise 智者'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Ælfred the Wise 智者');
			});

			it('should handle emoji in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: 'A hero with courage 🗡️ and wisdom 📚'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('🗡️');
				expect(result).toContain('📚');
			});
		});

		// -----------------------------------------------------------------------
		// GitHub Issue #522: Core field visibility - empty field handling
		// -----------------------------------------------------------------------
		describe('Core field visibility (Issue #522)', () => {
			it('should not render description section when description is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: ''
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				// Entity should be present but description should not have its own section
				expect(result).toContain('Sir Aldric');
				// Should not have description text or a description label/section
				const entitySection = result.split('Sir Aldric')[1].split('###')[0];
				expect(entitySection).not.toMatch(/description|^[A-Z][a-z]+ [a-z]/i);
			});

			it('should not render tags section when tags array is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						tags: []
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Sir Aldric');
				// Should not render "Tags:" section or similar
				const entitySection = result.split('Sir Aldric')[1].split('###')[0];
				expect(entitySection).not.toMatch(/\*\*tags?\*\*:|tags?:/i);
			});

			it('should not render relationships section when links array is empty', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						links: []
					}
				];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Sir Aldric');
				// Should not render relationships/links section
				const entitySection = result.split('Sir Aldric')[1].split('###')[0];
				expect(entitySection).not.toMatch(/\*\*(relationships?|links?|connections?)\*\*:/i);
			});

			it('should not render timestamp line when createdAt and updatedAt are undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				// Remove timestamps
				(entity as any).createdAt = undefined;
				(entity as any).updatedAt = undefined;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Sir Aldric');
				// Should not render created/updated timestamp lines
				const entitySection = result.split('Sir Aldric')[1].split('###')[0];
				expect(entitySection).not.toMatch(/created|updated/i);
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

				const result = formatAsMarkdown(playerExport, options);

				// Should still render the entity with name and fields
				expect(result).toContain('Sir Aldric');
				expect(result).toContain('Paladin');
				expect(result).toContain('12');
			});

			it('should not render summary when undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				delete entity.summary;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Sir Aldric');
				// Summary should not appear
				expect(result).not.toContain('Noble knight seeking redemption');
			});

			it('should not render image when imageUrl is undefined', () => {
				const playerExport = createBasePlayerExport();
				const entity = createCharacterEntity();
				delete entity.imageUrl;
				playerExport.entities = [entity];
				const options = createDefaultOptions();

				const result = formatAsMarkdown(playerExport, options);

				expect(result).toContain('Sir Aldric');
				// Should not have markdown image syntax
				expect(result).not.toMatch(/!\[.*\]\(.*\)/);
			});
		});
	});
});
