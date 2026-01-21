/**
 * Tests for HTML Formatter (TDD RED Phase)
 *
 * The HTML formatter produces a complete, printable HTML document with:
 * - Proper document structure (DOCTYPE, html, head, body)
 * - Embedded CSS styling
 * - Campaign metadata in headers
 * - Entity sections (optionally grouped by type)
 * - Links/relationships display
 * - HTML-escaped content for safety
 *
 * Key requirements:
 * - Valid HTML5 structure
 * - Escape special HTML characters (< > & ")
 * - Include embedded CSS for styling
 * - Support grouping by entity type
 * - Handle images when includeImages is true
 * - Respect includeTimestamps option
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect } from 'vitest';
import { formatAsHtml } from './htmlFormatter';
import {
	createCompletePlayerExport,
	createEmptyPlayerExport,
	createEntityWithSpecialChars,
	createCharacterEntity,
	createDefaultOptions,
	createMinimalOptions,
	createBasePlayerExport
} from './testFixtures';

describe('htmlFormatter', () => {
	describe('formatAsHtml', () => {
		describe('HTML Document Structure', () => {
			it('should produce valid HTML5 document with DOCTYPE', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/^<!DOCTYPE html>/i);
			});

			it('should have html root element', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<html');
				expect(result).toContain('</html>');
			});

			it('should have head element', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<head>');
				expect(result).toContain('</head>');
			});

			it('should have body element', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<body>');
				expect(result).toContain('</body>');
			});

			it('should include meta charset utf-8', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<meta\s+charset=["']utf-8["']/i);
			});

			it('should include viewport meta tag for responsive design', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<meta\s+name=["']viewport["']/i);
			});

			it('should include title element with campaign name', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<title>');
				expect(result).toContain('The Lost Kingdom of Aethermoor');
				expect(result).toContain('</title>');
			});
		});

		describe('CSS Styling', () => {
			it('should include embedded style tag', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<style>');
				expect(result).toContain('</style>');
			});

			it('should include CSS for body styling', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/body\s*{[^}]*}/);
			});

			it('should include CSS for typography', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should have styles for headings
				expect(result).toMatch(/h[1-6]\s*{[^}]*}/);
			});

			it('should include CSS for entity sections', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should have styles for entity display
				expect(result).toMatch(/\.entity|entity-/);
			});
		});

		describe('Campaign Metadata', () => {
			it('should include campaign name as h1 heading', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<h1[^>]*>.*The Lost Kingdom of Aethermoor.*<\/h1>/);
			});

			it('should include campaign description', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('An epic fantasy campaign');
			});

			it('should include export metadata (version and date)', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('1.0.0');
				expect(result).toMatch(/2025-01-15/);
			});
		});

		describe('Entity Display', () => {
			it('should display all entities', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Check for entity names
				expect(result).toContain('Sir Aldric');
				expect(result).toContain('Elara Moonwhisper');
				expect(result).toContain('Castle Ravencrest');
				expect(result).toContain('Order of the Silver Dawn');
			});

			it('should display entity names as headings', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<h[2-4][^>]*>.*Sir Aldric.*<\/h[2-4]>/);
			});

			it('should display entity descriptions', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('noble knight');
				expect(result).toContain('enigmatic elf mage');
			});

			it('should display entity summaries when present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('Noble knight seeking redemption');
			});

			it('should display entity tags', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('hero');
				expect(result).toContain('paladin');
				expect(result).toContain('nobility');
			});

			it('should display entity fields', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('Paladin');
				expect(result).toContain('12'); // level
				expect(result).toContain('Lawful Good');
			});

			it('should handle empty entities array gracefully', () => {
				const playerExport = createEmptyPlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should still be valid HTML
				expect(result).toContain('<!DOCTYPE html>');
				expect(result).toContain('<body>');
				// Should indicate no entities
				expect(result).toMatch(/no entities|empty/i);
			});
		});

		describe('Grouping by Type', () => {
			it('should group entities by type when groupByType is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsHtml(playerExport, options);

				// Should have section headers for entity types
				expect(result).toMatch(/<h2[^>]*>.*[Cc]haracters?.*<\/h2>/);
				expect(result).toMatch(/<h2[^>]*>.*NPCs?.*<\/h2>/);
				expect(result).toMatch(/<h2[^>]*>.*[Ll]ocations?.*<\/h2>/);
			});

			it('should not group entities when groupByType is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: false };

				const result = formatAsHtml(playerExport, options);

				// Entities should be listed in order without type headers
				const aldricPos = result.indexOf('Sir Aldric');
				const elaraPos = result.indexOf('Elara Moonwhisper');
				const castlePos = result.indexOf('Castle Ravencrest');

				// Should appear in original order
				expect(aldricPos).toBeLessThan(elaraPos);
				expect(elaraPos).toBeLessThan(castlePos);
			});

			it('should organize grouped entities under their type sections', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: true };

				const result = formatAsHtml(playerExport, options);

				// Character section should contain character
				const characterSectionMatch = result.match(/<h2[^>]*>.*[Cc]haracters?.*<\/h2>([\s\S]*?)(<h2|$)/);
				if (characterSectionMatch) {
					expect(characterSectionMatch[1]).toContain('Sir Aldric');
				}
			});
		});

		describe('HTML Escaping', () => {
			it('should escape < character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Raw < should become &lt;
				expect(result).toContain('&lt;Ancient&gt;');
			});

			it('should escape > character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('&lt;Ancient&gt;');
			});

			it('should escape & character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('&amp;');
			});

			it('should escape " character in content', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('&quot;Forbidden&quot;');
			});

			it('should prevent script injection in entity names', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Script tags should be escaped, not executable
				expect(result).toContain('&lt;script&gt;');
				expect(result).not.toContain('<script>alert');
			});

			it('should prevent HTML injection in descriptions', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [createEntityWithSpecialChars()];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('&lt;div class=');
				expect(result).not.toMatch(/<div class="magic">/);
			});
		});

		describe('Links and Relationships', () => {
			it('should display entity links section', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should have a section for relationships/links
				expect(result).toMatch(/[Rr]elationships?|[Ll]inks?/);
			});

			it('should display relationship types', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('mentor_of');
				expect(result).toContain('resides_at');
			});

			it('should display target entity information', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should mention the NPC entity that character is mentor of
				expect(result).toContain('npc-001');
			});

			it('should indicate bidirectional relationships', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should show bidirectional indicator or reverse relationship
				expect(result).toContain('student_of');
			});

			it('should display relationship strength when present', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('strong');
			});

			it('should handle entities with no links', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should not crash, may show "no relationships" or simply omit section
				expect(result).toContain('<!DOCTYPE html>');
			});
		});

		describe('Image Handling', () => {
			it('should include img tags when includeImages is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('<img');
				expect(result).toContain('https://example.com/images/aldric.png');
			});

			it('should not include img tags when includeImages is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: false };

				const result = formatAsHtml(playerExport, options);

				expect(result).not.toContain('<img');
				expect(result).not.toContain('https://example.com/images/aldric.png');
			});

			it('should include alt text in img tags', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<img[^>]*alt=/);
			});

			it('should handle entities without imageUrl', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeImages: true };

				const result = formatAsHtml(playerExport, options);

				// Should not crash for entities without images
				expect(result).toContain('Elara Moonwhisper'); // NPC with no image
			});
		});

		describe('Timestamp Display', () => {
			it('should display timestamps when includeTimestamps is true', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsHtml(playerExport, options);

				// Should show created/updated dates
				expect(result).toMatch(/[Cc]reated|[Uu]pdated/);
				expect(result).toContain('2025-01-01');
			});

			it('should not display timestamps when includeTimestamps is false', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: false };

				const result = formatAsHtml(playerExport, options);

				// Should not show timestamp metadata
				expect(result).not.toContain('2025-01-01T08:00:00');
			});

			it('should format timestamps in human-readable format', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), includeTimestamps: true };

				const result = formatAsHtml(playerExport, options);

				// Should format dates nicely, not raw ISO strings
				// Could be "January 1, 2025" or "2025-01-01" but not the full timestamp
				expect(result).toMatch(/2025-01-01|January.*2025|Jan.*2025/);
			});
		});

		describe('Print-Friendly Features', () => {
			it('should include print-specific CSS', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/@media\s+print/);
			});

			it('should include page break controls for printing', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/page-break|break-/);
			});
		});

		describe('Accessibility', () => {
			it('should include lang attribute on html element', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toMatch(/<html[^>]*lang=/);
			});

			it('should use semantic HTML elements', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should use header, main, section, article, etc.
				expect(result).toMatch(/<(header|main|section|article)/);
			});
		});

		describe('Edge Cases', () => {
			it('should handle very long entity descriptions', () => {
				const playerExport = createBasePlayerExport();
				const longDescription = 'A'.repeat(10000);
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: longDescription
					}
				];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain(longDescription);
			});

			it('should handle entity with many fields', () => {
				const playerExport = createBasePlayerExport();
				const manyFields: Record<string, string> = {};
				for (let i = 0; i < 50; i++) {
					manyFields[`field${i}`] = `Value ${i}`;
				}
				playerExport.entities = [
					{
						...createCharacterEntity(),
						fields: manyFields
					}
				];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('field0');
				expect(result).toContain('field49');
			});

			it('should handle entity with many links', () => {
				const playerExport = createBasePlayerExport();
				const manyLinks = Array.from({ length: 20 }, (_, i) => ({
					id: `link-${i}`,
					targetId: `target-${i}`,
					targetType: 'npc' as const,
					relationship: `relationship_${i}`,
					bidirectional: false
				}));
				playerExport.entities = [
					{
						...createCharacterEntity(),
						links: manyLinks
					}
				];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				expect(result).toContain('relationship_0');
				expect(result).toContain('relationship_19');
			});

			it('should handle mixed entity types in correct order', () => {
				const playerExport = createCompletePlayerExport();
				const options = { ...createDefaultOptions(), groupByType: false };

				const result = formatAsHtml(playerExport, options);

				// Should maintain insertion order
				expect(result).toContain('char-001');
				expect(result).toContain('npc-001');
				expect(result).toContain('loc-001');
			});
		});

		describe('Whitespace and Formatting', () => {
			it('should produce readable HTML with proper indentation', () => {
				const playerExport = createCompletePlayerExport();
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should have newlines and indentation
				expect(result).toContain('\n');
				expect(result.match(/\n/g)?.length).toBeGreaterThan(20);
			});

			it('should preserve paragraph breaks in descriptions', () => {
				const playerExport = createBasePlayerExport();
				playerExport.entities = [
					{
						...createCharacterEntity(),
						description: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
					}
				];
				const options = createDefaultOptions();

				const result = formatAsHtml(playerExport, options);

				// Should convert to <p> tags or <br> tags
				expect(result).toMatch(/<p>|<br>/);
			});
		});
	});
});
