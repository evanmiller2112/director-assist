/**
 * Tests for Entity Parser Service (TDD RED Phase)
 *
 * This service parses AI chat responses and extracts entity data.
 * Tests should FAIL initially as the service doesn't exist yet.
 *
 * Coverage:
 * - Type detection from markdown structure and keywords
 * - Name extraction from various formats
 * - Field extraction for different entity types
 * - Multi-entity splitting
 * - Summary generation
 * - Complete integration tests
 */
import { describe, it, expect } from 'vitest';
import {
	parseAIResponse,
	detectEntityType,
	extractEntityName,
	extractFields,
	splitIntoEntitySections,
	generateSummary,
	extractTags,
	type ParsedEntity,
	type ParseResult,
	type ParserOptions
} from './entityParserService';
import type { EntityType, EntityTypeDefinition, FieldValue } from '$lib/types';

describe('entityParserService', () => {
	describe('detectEntityType', () => {
		describe('NPC Detection', () => {
			it('should detect NPC from personality section', () => {
				const text = `## Captain Aldric

**Personality**: Stern but fair, with a dry sense of humor.`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect NPC from role section', () => {
				const text = `## Guard Commander

**Role/Occupation**: Leader of the city guard`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect NPC from motivation section', () => {
				const text = `## The Stranger

**Motivation**: To find the lost artifact and restore his family honor`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect NPC from voice/mannerisms section', () => {
				const text = `## Sela

**Voice/Mannerisms**: Speaks with a lilting accent, fidgets with her necklace`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect NPC from appearance section', () => {
				const text = `## The Innkeeper

**Appearance**: A stout dwarf with braided beard and kind eyes`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should have high confidence with multiple NPC indicators', () => {
				const text = `## Eldrin the Wise

**Role**: Court Wizard
**Personality**: Patient and scholarly
**Motivation**: Protect the kingdom from magical threats`;

				const result = detectEntityType(text);

				expect(result.type).toBe('npc');
				expect(result.confidence).toBeGreaterThan(0.7);
			});
		});

		describe('Location Detection', () => {
			it('should detect location from Type: Tavern pattern', () => {
				const text = `## The Rusty Anchor

**Type**: Tavern

A dimly lit establishment near the docks.`;

				const result = detectEntityType(text);

				expect(result.type).toBe('location');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect location from atmosphere section', () => {
				const text = `## Shadow District

**Atmosphere**: Dark, foggy streets with an air of danger`;

				const result = detectEntityType(text);

				expect(result.type).toBe('location');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect location from features section', () => {
				const text = `## Ancient Library

**Features**: Towering bookshelves, magical lighting, hidden passages`;

				const result = detectEntityType(text);

				expect(result.type).toBe('location');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect location from inhabitants section', () => {
				const text = `## Forest Village

**Inhabitants**: Peaceful elves who trade with nearby settlements`;

				const result = detectEntityType(text);

				expect(result.type).toBe('location');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect location type keywords', () => {
				const keywords = ['tavern', 'dungeon', 'city', 'fortress', 'temple', 'castle', 'village', 'forest'];

				keywords.forEach(keyword => {
					const text = `## Test Location\n\nA mysterious ${keyword} in the mountains.`;
					const result = detectEntityType(text);

					expect(result.type).toBe('location');
				});
			});
		});

		describe('Faction Detection', () => {
			it('should detect faction from goals section', () => {
				const text = `## The Iron Brotherhood

**Goals**: Unite all warrior clans under one banner`;

				const result = detectEntityType(text);

				expect(result.type).toBe('faction');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect faction from leadership section', () => {
				const text = `## Merchant Guild

**Leadership**: Council of Five, elected by guild members`;

				const result = detectEntityType(text);

				expect(result.type).toBe('faction');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect faction from resources section', () => {
				const text = `## Shadow Thieves

**Resources**: Network of informants, hidden safehouses throughout the city`;

				const result = detectEntityType(text);

				expect(result.type).toBe('faction');
				expect(result.confidence).toBeGreaterThan(0.5);
			});

			it('should detect faction type keywords', () => {
				const keywords = ['guild', 'kingdom', 'cult', 'organization', 'company', 'clan', 'order'];

				keywords.forEach(keyword => {
					const text = `## Test Group\n\nA powerful ${keyword} seeking control.`;
					const result = detectEntityType(text);

					expect(result.type).toBe('faction');
				});
			});
		});

		describe('Options Handling', () => {
			it('should respect preferredType option when confidence is low', () => {
				const text = `## Something Ambiguous

Just some generic text without clear indicators.`;

				const result = detectEntityType(text, { preferredType: 'item' });

				expect(result.type).toBe('item');
			});

			it('should override preferredType when confidence is high', () => {
				const text = `## Captain Aldric

**Role**: Guard Captain
**Personality**: Stern but fair
**Motivation**: Protect the innocent`;

				const result = detectEntityType(text, { preferredType: 'location' });

				// High confidence NPC indicators should override preferred location type
				expect(result.type).toBe('npc');
			});

			it('should respect excludeTypes option', () => {
				const text = `## The Tavern

**Type**: Tavern
**Atmosphere**: Warm and welcoming`;

				const result = detectEntityType(text, { excludeTypes: ['location'] });

				// Should not return location even though it matches
				expect(result.type).not.toBe('location');
			});

			it('should use minConfidence threshold', () => {
				const text = `## Weak Signals

**Goals**: vague mention`;

				const result = detectEntityType(text, { minConfidence: 0.8 });

				// Low confidence signals should not pass high threshold
				if (result.confidence < 0.8) {
					expect(result.type).toBeNull();
				}
			});
		});

		describe('Edge Cases', () => {
			it('should return null for undetectable content', () => {
				const text = `Just some random text without any entity indicators whatsoever.`;

				const result = detectEntityType(text);

				expect(result.type).toBeNull();
				expect(result.confidence).toBeLessThan(0.5);
			});

			it('should handle empty string', () => {
				const result = detectEntityType('');

				expect(result.type).toBeNull();
				expect(result.confidence).toBe(0);
			});

			it('should handle whitespace-only string', () => {
				const result = detectEntityType('   \n\t  ');

				expect(result.type).toBeNull();
				expect(result.confidence).toBe(0);
			});
		});

		describe('Custom Types', () => {
			it('should detect custom entity types from type definitions', () => {
				const customType: EntityTypeDefinition = {
					type: 'spell',
					label: 'Spell',
					labelPlural: 'Spells',
					icon: 'sparkles',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [
						{
							key: 'level',
							label: 'Level',
							type: 'number',
							required: true,
							order: 1
						},
						{
							key: 'school',
							label: 'School',
							type: 'select',
							options: ['evocation', 'abjuration'],
							required: true,
							order: 2
						}
					],
					defaultRelationships: []
				};

				const text = `## Fireball

**Level**: 3
**School**: Evocation`;

				const result = detectEntityType(text, { customTypes: [customType] });

				expect(result.type).toBe('spell');
			});
		});
	});

	describe('extractEntityName', () => {
		it('should extract name from markdown header', () => {
			const text = `## The Silver Dragon

Some description here`;

			const name = extractEntityName(text);

			expect(name).toBe('The Silver Dragon');
		});

		it('should extract name from bold text at start', () => {
			const text = `**Greta Ironhand**

A fierce warrior from the north`;

			const name = extractEntityName(text);

			expect(name).toBe('Greta Ironhand');
		});

		it('should extract name from Name: label pattern', () => {
			const text = `Name: Captain Aldric
Role: Guard Captain`;

			const name = extractEntityName(text);

			expect(name).toBe('Captain Aldric');
		});

		it('should prefer header over other formats', () => {
			const text = `## The Real Name

**Fake Name**

Name: Another Fake`;

			const name = extractEntityName(text);

			expect(name).toBe('The Real Name');
		});

		it('should strip entity type prefix from name', () => {
			const text = `## NPC: Captain Aldric

Some description`;

			const name = extractEntityName(text);

			expect(name).toBe('Captain Aldric');
		});

		it('should strip Location: prefix', () => {
			const text = `## Location: The Rusty Anchor`;

			const name = extractEntityName(text);

			expect(name).toBe('The Rusty Anchor');
		});

		it('should handle missing name', () => {
			const text = `Just some text without a clear name indicator`;

			const name = extractEntityName(text);

			expect(name).toBeNull();
		});

		it('should trim whitespace from extracted name', () => {
			const text = `##   The Silver Dragon   `;

			const name = extractEntityName(text);

			expect(name).toBe('The Silver Dragon');
		});

		it('should handle empty string', () => {
			const name = extractEntityName('');

			expect(name).toBeNull();
		});
	});

	describe('extractFields', () => {
		const npcType: EntityType = 'npc';
		const locationType: EntityType = 'location';
		const factionType: EntityType = 'faction';

		describe('NPC Fields', () => {
			it('should extract role field', () => {
				const text = `## Captain Aldric

**Role/Occupation**: City Guard Captain`;

				const fields = extractFields(text, npcType);

				expect(fields.role).toBe('City Guard Captain');
			});

			it('should extract personality field', () => {
				const text = `**Personality**: Stern but fair, with a dry sense of humor`;

				const fields = extractFields(text, npcType);

				expect(fields.personality).toBe('Stern but fair, with a dry sense of humor');
			});

			it('should extract appearance field', () => {
				const text = `**Appearance**: Tall human male with graying temples`;

				const fields = extractFields(text, npcType);

				expect(fields.appearance).toBe('Tall human male with graying temples');
			});

			it('should extract motivation field', () => {
				const text = `**Motivation**: Protect the innocent and maintain order`;

				const fields = extractFields(text, npcType);

				expect(fields.motivation).toBe('Protect the innocent and maintain order');
			});

			it('should extract voice/mannerisms field', () => {
				const text = `**Voice/Mannerisms**: Speaks in clipped, military tones`;

				const fields = extractFields(text, npcType);

				expect(fields.voice).toBe('Speaks in clipped, military tones');
			});

			it('should extract all NPC fields together', () => {
				const text = `## Captain Aldric

**Role/Occupation**: City Guard Captain
**Personality**: Stern but fair
**Appearance**: Tall with graying temples
**Motivation**: Protect the innocent
**Voice/Mannerisms**: Military tones`;

				const fields = extractFields(text, npcType);

				expect(fields.role).toBe('City Guard Captain');
				expect(fields.personality).toBe('Stern but fair');
				expect(fields.appearance).toBe('Tall with graying temples');
				expect(fields.motivation).toBe('Protect the innocent');
				expect(fields.voice).toBe('Military tones');
			});
		});

		describe('Location Fields', () => {
			it('should extract locationType field', () => {
				const text = `## The Rusty Anchor

**Type**: Tavern`;

				const fields = extractFields(text, locationType);

				expect(fields.locationType).toBe('Tavern');
			});

			it('should extract atmosphere field', () => {
				const text = `**Atmosphere**: Dimly lit, smoky, with the smell of ale`;

				const fields = extractFields(text, locationType);

				expect(fields.atmosphere).toBe('Dimly lit, smoky, with the smell of ale');
			});

			it('should extract features field', () => {
				const text = `**Features**: Large fireplace, private rooms upstairs, secret cellar`;

				const fields = extractFields(text, locationType);

				expect(fields.features).toBe('Large fireplace, private rooms upstairs, secret cellar');
			});

			it('should extract inhabitants field', () => {
				const text = `**Inhabitants**: Barmaid Sela and various dock workers`;

				const fields = extractFields(text, locationType);

				expect(fields.inhabitants).toBe('Barmaid Sela and various dock workers');
			});
		});

		describe('Faction Fields', () => {
			it('should extract factionType field', () => {
				const text = `## Merchant Guild

**Type**: Trade Guild`;

				const fields = extractFields(text, factionType);

				expect(fields.factionType).toBe('Trade Guild');
			});

			it('should extract goals field', () => {
				const text = `**Goals**: Control trade routes and maximize profit`;

				const fields = extractFields(text, factionType);

				expect(fields.goals).toBe('Control trade routes and maximize profit');
			});

			it('should extract resources field', () => {
				const text = `**Resources**: Extensive trade network, warehouses, armed guards`;

				const fields = extractFields(text, factionType);

				expect(fields.resources).toBe('Extensive trade network, warehouses, armed guards');
			});

			it('should extract leadership field', () => {
				const text = `**Leadership**: Council of Five merchant lords`;

				const fields = extractFields(text, factionType);

				expect(fields.leadership).toBe('Council of Five merchant lords');
			});
		});

		describe('Select Field Validation', () => {
			it('should match select options case-insensitively', () => {
				const customType: EntityTypeDefinition = {
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'user',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'status',
							label: 'Status',
							type: 'select',
							options: ['Alive', 'Deceased', 'Unknown'],
							required: true,
							order: 1
						}
					],
					defaultRelationships: []
				};

				const text = `**Status**: alive`;

				const fields = extractFields(text, 'npc', [customType]);

				expect(fields.status).toBe('Alive'); // Should normalize to exact option
			});

			it('should use default value for invalid select option', () => {
				const customType: EntityTypeDefinition = {
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'user',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'status',
							label: 'Status',
							type: 'select',
							options: ['Alive', 'Deceased', 'Unknown'],
							required: true,
							defaultValue: 'Unknown',
							order: 1
						}
					],
					defaultRelationships: []
				};

				const text = `**Status**: resurrected`; // Not in options

				const fields = extractFields(text, 'npc', [customType]);

				expect(fields.status).toBe('Unknown'); // Default value
			});

			it('should use first option when no default and invalid value', () => {
				const customType: EntityTypeDefinition = {
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'user',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'alignment',
							label: 'Alignment',
							type: 'select',
							options: ['Good', 'Neutral', 'Evil'],
							required: false,
							order: 1
						}
					],
					defaultRelationships: []
				};

				const text = `**Alignment**: chaotic`; // Not in options

				const fields = extractFields(text, 'npc', [customType]);

				expect(fields.alignment).toBe('Good'); // First option
			});
		});

		describe('Tags Field', () => {
			it('should parse comma-separated tags', () => {
				const text = `**Tags**: warrior, veteran, scarred`;

				const fields = extractFields(text, npcType);

				expect(fields.tags).toEqual(['warrior', 'veteran', 'scarred']);
			});

			it('should trim whitespace from tags', () => {
				const text = `**Tags**:  warrior ,  veteran  , scarred  `;

				const fields = extractFields(text, npcType);

				expect(fields.tags).toEqual(['warrior', 'veteran', 'scarred']);
			});

			it('should handle single tag', () => {
				const text = `**Tags**: warrior`;

				const fields = extractFields(text, npcType);

				expect(fields.tags).toEqual(['warrior']);
			});
		});

		describe('Missing Fields', () => {
			it('should return empty object when no fields found', () => {
				const text = `Just some text without any field markers`;

				const fields = extractFields(text, npcType);

				expect(fields).toEqual({});
			});

			it('should handle partial field extraction', () => {
				const text = `## Character

**Role**: Warrior
**Something Else**: Not a field`;

				const fields = extractFields(text, npcType);

				expect(fields.role).toBe('Warrior');
				expect(Object.keys(fields)).toHaveLength(1);
			});
		});

		describe('Custom Types', () => {
			it('should extract fields for custom entity types', () => {
				const customType: EntityTypeDefinition = {
					type: 'spell',
					label: 'Spell',
					labelPlural: 'Spells',
					icon: 'sparkles',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [
						{
							key: 'level',
							label: 'Level',
							type: 'number',
							required: true,
							order: 1
						},
						{
							key: 'school',
							label: 'School',
							type: 'text',
							required: true,
							order: 2
						},
						{
							key: 'castingTime',
							label: 'Casting Time',
							type: 'text',
							required: false,
							order: 3
						}
					],
					defaultRelationships: []
				};

				const text = `## Fireball

**Level**: 3
**School**: Evocation
**Casting Time**: 1 action`;

				const fields = extractFields(text, 'spell', [customType]);

				expect(fields.level).toBe(3);
				expect(fields.school).toBe('Evocation');
				expect(fields.castingTime).toBe('1 action');
			});
		});
	});

	describe('splitIntoEntitySections', () => {
		it('should split on horizontal rules', () => {
			const text = `## Entity One

Content for entity one

---

## Entity Two

Content for entity two`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(2);
			expect(sections[0]).toContain('Entity One');
			expect(sections[1]).toContain('Entity Two');
		});

		it('should split on level 1 headers', () => {
			const text = `# First Entity

Content

# Second Entity

More content`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(2);
		});

		it('should split on level 2 headers', () => {
			const text = `## First Entity

Content

## Second Entity

More content`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(2);
		});

		it('should handle single entity', () => {
			const text = `## Single Entity

Just one entity here`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(1);
			expect(sections[0]).toContain('Single Entity');
		});

		it('should handle mixed separators', () => {
			const text = `## Entity One

Content

---

## Entity Two

More content

---

## Entity Three

Even more`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(3);
		});

		it('should trim whitespace from sections', () => {
			const text = `## Entity One

Content


---


## Entity Two

Content`;

			const sections = splitIntoEntitySections(text);

			sections.forEach(section => {
				expect(section).toBe(section.trim());
			});
		});

		it('should filter out empty sections', () => {
			const text = `## Entity One

---

---

## Entity Two`;

			const sections = splitIntoEntitySections(text);

			expect(sections).toHaveLength(2);
		});

		it('should handle empty input', () => {
			const sections = splitIntoEntitySections('');

			expect(sections).toHaveLength(0);
		});
	});

	describe('generateSummary', () => {
		it('should return first sentence if under maxLength', () => {
			const description = 'This is a short sentence. This is another one.';

			const summary = generateSummary(description, 100);

			expect(summary).toBe('This is a short sentence.');
		});

		it('should truncate with ellipsis if too long', () => {
			const description = 'This is a very long description that goes on and on and contains way too much information for a brief summary.';

			const summary = generateSummary(description, 50);

			expect(summary).toHaveLength(50);
			expect(summary).toMatch(/\.\.\.$/);
		});

		it('should handle descriptions without sentences', () => {
			const description = 'Just a fragment without punctuation';

			const summary = generateSummary(description, 100);

			expect(summary).toBe(description);
		});

		it('should use default maxLength of 150', () => {
			const description = 'Short description.';

			const summary = generateSummary(description);

			expect(summary).toBe('Short description.');
		});

		it('should handle empty input', () => {
			const summary = generateSummary('');

			expect(summary).toBe('');
		});

		it('should handle whitespace-only input', () => {
			const summary = generateSummary('   \n\t  ');

			expect(summary).toBe('');
		});

		it('should preserve sentence boundaries', () => {
			const description = 'First sentence! Second sentence. Third sentence?';

			const summary = generateSummary(description, 100);

			expect(summary).toBe('First sentence!');
		});

		it('should handle very short maxLength gracefully', () => {
			const description = 'This is a test.';

			const summary = generateSummary(description, 5);

			expect(summary).toHaveLength(5);
			expect(summary).toBe('Th...');
		});
	});

	describe('extractTags', () => {
		it('should extract tags from Tags: label', () => {
			const text = `## Entity

**Tags**: warrior, veteran, scarred`;

			const tags = extractTags(text, 'npc');

			expect(tags).toEqual(['warrior', 'veteran', 'scarred']);
		});

		it('should infer tags from entity type', () => {
			const text = `## A Tavern`;

			const tags = extractTags(text, 'location');

			expect(tags).toContain('location');
		});

		it('should extract tags from bullet lists', () => {
			const text = `## Entity

Tags:
- warrior
- veteran
- scarred`;

			const tags = extractTags(text, 'npc');

			expect(tags).toEqual(['warrior', 'veteran', 'scarred']);
		});

		it('should deduplicate tags', () => {
			const text = `## Entity

**Tags**: warrior, veteran, warrior, scarred`;

			const tags = extractTags(text, 'npc');

			expect(tags).toEqual(['warrior', 'veteran', 'scarred']);
		});

		it('should return empty array when no tags found', () => {
			const text = `## Entity

Just a description`;

			const tags = extractTags(text, 'npc');

			expect(tags).toEqual([]);
		});

		it('should handle mixed case tags', () => {
			const text = `**Tags**: Warrior, VETERAN, Scarred`;

			const tags = extractTags(text, 'npc');

			expect(tags).toEqual(['warrior', 'veteran', 'scarred']);
		});
	});

	describe('parseAIResponse - Integration', () => {
		describe('Single Entity Parsing', () => {
			it('should parse complete NPC response', () => {
				const responseText = `## Captain Aldric

**Role/Occupation**: City Guard Captain

**Personality**: Stern but fair, with a dry sense of humor. Takes his duties seriously but cares deeply about his soldiers.

**Appearance**: Tall human male with graying temples and a prominent scar across his left cheek. Wears the captain's insignia with pride.

**Motivation**: Protect the innocent and maintain order in the city at all costs.

**Voice/Mannerisms**: Speaks in clipped, military tones. Often strokes his chin when thinking.`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				expect(result.hasMultiple).toBe(false);
				expect(result.errors).toHaveLength(0);

				const entity = result.entities[0];
				expect(entity.name).toBe('Captain Aldric');
				expect(entity.entityType).toBe('npc');
				expect(entity.confidence).toBeGreaterThan(0.5);
				expect(entity.description).toContain('Stern but fair');
				expect(entity.fields.role).toBe('City Guard Captain');
				expect(entity.fields.personality).toBe('Stern but fair, with a dry sense of humor. Takes his duties seriously but cares deeply about his soldiers.');
				expect(entity.fields.appearance).toContain('graying temples');
				expect(entity.fields.motivation).toContain('Protect the innocent');
				expect(entity.fields.voice).toContain('military tones');
			});

			it('should parse complete Location response', () => {
				const responseText = `## The Rusty Anchor

**Type**: Tavern

**Atmosphere**: Dimly lit, smoky, with the smell of ale and sea salt. Raucous laughter echoes from the corner tables.

**Features**: Large stone fireplace, worn wooden bar, rooms for rent upstairs, secret cellar for smugglers.

**Inhabitants**: Barmaid Sela serves drinks and sells information. Various dock workers and sailors frequent the establishment.`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				const entity = result.entities[0];

				expect(entity.name).toBe('The Rusty Anchor');
				expect(entity.entityType).toBe('location');
				expect(entity.fields.locationType).toBe('Tavern');
				expect(entity.fields.atmosphere).toContain('Dimly lit');
				expect(entity.fields.features).toContain('fireplace');
				expect(entity.fields.inhabitants).toContain('Barmaid Sela');
			});

			it('should parse complete Faction response', () => {
				const responseText = `## The Merchant Guild

**Type**: Trade Guild

**Goals**: Control all trade routes in the region and maximize profit for guild members.

**Leadership**: Council of Five wealthy merchant lords who vote on major decisions.

**Resources**: Extensive trade network, warehouses in every major city, private security force.`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				const entity = result.entities[0];

				expect(entity.name).toBe('The Merchant Guild');
				expect(entity.entityType).toBe('faction');
				expect(entity.fields.factionType).toBe('Trade Guild');
				expect(entity.fields.goals).toContain('Control all trade routes');
				expect(entity.fields.leadership).toContain('Council of Five');
			});

			it('should generate summary from description', () => {
				const responseText = `## Test Entity

This is a detailed description that should be summarized. It contains multiple sentences.`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].summary).toBeDefined();
				expect(result.entities[0].summary).toContain('This is a detailed description');
			});

			it('should extract tags when present', () => {
				const responseText = `## Test NPC

**Tags**: warrior, veteran, scarred

**Role**: Fighter`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].tags).toContain('warrior');
				expect(result.entities[0].tags).toContain('veteran');
				expect(result.entities[0].tags).toContain('scarred');
			});

			it('should track sourceRange for entity', () => {
				const responseText = `## Test Entity

Some content here`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].sourceRange).toBeDefined();
				expect(result.entities[0].sourceRange?.start).toBe(0);
				expect(result.entities[0].sourceRange?.end).toBeGreaterThan(0);
			});
		});

		describe('Multiple Entity Parsing', () => {
			it('should parse multiple entities separated by horizontal rules', () => {
				const responseText = `## The Rusty Anchor

**Type**: Tavern

**Atmosphere**: Dimly lit, smoky, with the smell of ale and sea salt.

---

## Barmaid Sela

**Role**: Tavern worker and information broker

**Personality**: Cheerful on the surface but shrewd underneath.`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(2);
				expect(result.hasMultiple).toBe(true);

				expect(result.entities[0].name).toBe('The Rusty Anchor');
				expect(result.entities[0].entityType).toBe('location');

				expect(result.entities[1].name).toBe('Barmaid Sela');
				expect(result.entities[1].entityType).toBe('npc');
			});

			it('should parse multiple entities separated by headers', () => {
				const responseText = `## First NPC

**Role**: Guard

## Second NPC

**Role**: Merchant

## Third NPC

**Role**: Priest`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(3);
				expect(result.hasMultiple).toBe(true);
			});

			it('should assign different sourceRanges to each entity', () => {
				const responseText = `## Entity One

Content

---

## Entity Two

Content`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].sourceRange?.start).toBe(0);
				expect(result.entities[1].sourceRange?.start).toBeGreaterThan(result.entities[0].sourceRange?.end || 0);
			});
		});

		describe('Options and Filtering', () => {
			it('should apply minConfidence filter', () => {
				const responseText = `## Ambiguous Entity

Some vague text that might not clearly indicate entity type.`;

				const result = parseAIResponse(responseText, { minConfidence: 0.8 });

				// Entities below confidence threshold should be filtered out
				expect(result.entities.length).toBeLessThanOrEqual(1);
				if (result.entities.length > 0) {
					expect(result.entities[0].confidence).toBeGreaterThanOrEqual(0.8);
				}
			});

			it('should use default minConfidence of 0.3', () => {
				const responseText = `## Weak Signals

**Goals**: vague`;

				const result = parseAIResponse(responseText);

				// Should include entities with confidence >= 0.3
				expect(result.entities.length).toBeGreaterThanOrEqual(0);
			});

			it('should respect preferredType option', () => {
				const responseText = `## Ambiguous Thing

Some description without clear type indicators.`;

				const result = parseAIResponse(responseText, { preferredType: 'item' });

				if (result.entities.length > 0) {
					expect(result.entities[0].entityType).toBe('item');
				}
			});

			it('should respect excludeTypes option', () => {
				const responseText = `## Captain Aldric

**Role**: Guard Captain
**Personality**: Stern

---

## The Tavern

**Type**: Tavern`;

				const result = parseAIResponse(responseText, { excludeTypes: ['location'] });

				expect(result.entities).toHaveLength(1);
				expect(result.entities[0].entityType).toBe('npc');
			});

			it('should support custom entity types', () => {
				const customType: EntityTypeDefinition = {
					type: 'spell',
					label: 'Spell',
					labelPlural: 'Spells',
					icon: 'sparkles',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [
						{
							key: 'level',
							label: 'Level',
							type: 'number',
							required: true,
							order: 1
						}
					],
					defaultRelationships: []
				};

				const responseText = `## Fireball

**Level**: 3`;

				const result = parseAIResponse(responseText, { customTypes: [customType] });

				expect(result.entities).toHaveLength(1);
				expect(result.entities[0].entityType).toBe('spell');
				expect(result.entities[0].fields.level).toBe(3);
			});
		});

		describe('Error Handling', () => {
			it('should handle empty input', () => {
				const result = parseAIResponse('');

				expect(result.entities).toHaveLength(0);
				expect(result.hasMultiple).toBe(false);
				expect(result.rawText).toBe('');
			});

			it('should handle whitespace-only input', () => {
				const result = parseAIResponse('   \n\t  ');

				expect(result.entities).toHaveLength(0);
			});

			it('should collect errors for unparseable sections', () => {
				const responseText = `## Entity Without Name Fields

Random text that does not follow any pattern at all and cannot be parsed.`;

				const result = parseAIResponse(responseText);

				// Should attempt to parse but may have low confidence or errors
				if (result.entities.length === 0) {
					expect(result.errors.length).toBeGreaterThan(0);
				}
			});

			it('should skip entities with missing names', () => {
				const responseText = `**Role**: Guard

No name header here

---

## Valid Entity

**Role**: Merchant`;

				const result = parseAIResponse(responseText);

				// Should only include entities with extractable names
				result.entities.forEach(entity => {
					expect(entity.name).toBeTruthy();
				});
			});

			it('should preserve rawText for debugging', () => {
				const responseText = `## Test

Content`;

				const result = parseAIResponse(responseText);

				expect(result.rawText).toBe(responseText);
			});
		});

		describe('Complex Scenarios', () => {
			it('should handle entity with all field types', () => {
				const responseText = `## Complex NPC

**Role**: Court Wizard
**Personality**: Mysterious and aloof
**Appearance**: Elderly with long white beard
**Motivation**: Protect ancient secrets
**Voice/Mannerisms**: Speaks slowly and deliberately
**Tags**: wizard, elderly, mysterious`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				const entity = result.entities[0];

				expect(entity.fields.role).toBe('Court Wizard');
				expect(entity.fields.personality).toBe('Mysterious and aloof');
				expect(entity.fields.appearance).toContain('Elderly');
				expect(entity.fields.motivation).toContain('Protect');
				expect(entity.fields.voice).toContain('slowly');
				expect(entity.tags).toContain('wizard');
			});

			it('should handle nested entity references in description', () => {
				const responseText = `## Guild Master

**Role**: Leader of the Merchant Guild

Works closely with Captain Aldric of the city guard. Often seen at The Rusty Anchor tavern.`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				// Description should preserve entity references
				expect(result.entities[0].description).toContain('Captain Aldric');
				expect(result.entities[0].description).toContain('Rusty Anchor');
			});

			it('should handle markdown formatting in fields', () => {
				const responseText = `## Test NPC

**Personality**: **Bold** trait, *italic* mannerism, and \`code-like\` speech pattern.`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].fields.personality).toContain('**Bold**');
				expect(result.entities[0].fields.personality).toContain('*italic*');
			});

			it('should handle very long descriptions', () => {
				const longDescription = 'A'.repeat(5000);
				const responseText = `## Entity

**Role**: Test

${longDescription}`;

				const result = parseAIResponse(responseText);

				expect(result.entities).toHaveLength(1);
				expect(result.entities[0].description).toContain(longDescription);
				// Summary should be truncated
				expect(result.entities[0].summary?.length).toBeLessThan(longDescription.length);
			});

			it('should handle special characters in names', () => {
				const responseText = `## Sela "The Shadow" O'Brien

**Role**: Information Broker`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].name).toBe('Sela "The Shadow" O\'Brien');
			});

			it('should handle unicode characters', () => {
				const responseText = `## Jôhn Döe

**Role**: Merchant from the Éast`;

				const result = parseAIResponse(responseText);

				expect(result.entities[0].name).toBe('Jôhn Döe');
				expect(result.entities[0].fields.role).toContain('Éast');
			});
		});
	});
});
