/**
 * Unit Tests for Field Guidance Tooltips (Issue #218)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until helpText is added to appropriate field definitions.
 *
 * Test Strategy:
 * 1. NPC Entity Tests - Verify key NPC fields have helpful tooltips
 * 2. Location Entity Tests - Verify key location fields have helpful tooltips
 * 3. Scene Entity Tests - Verify key scene fields have helpful tooltips
 * 4. Common Field Tests - Verify description/summary fields have tooltips
 * 5. HelpText Quality Tests - Ensure helpText content is meaningful and descriptive
 * 6. Coverage Tests - Verify minimum coverage across entity types
 *
 * Key Coverage Areas:
 * - Fields that benefit from guidance have helpText defined
 * - HelpText content is descriptive (minimum length, relevant keywords)
 * - At least NPC, Location, Scene entities have field tooltips
 * - Description and summary fields across entities have helpful tooltips
 * - HelpText enhances user experience without being verbose
 */
import { describe, it, expect } from 'vitest';
import { BUILT_IN_ENTITY_TYPES, getEntityTypeDefinition } from '$lib/config/entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types/entities';

describe('Entity Field Guidance Tooltips (Issue #218)', () => {
	// Helper function to get entity type definition
	const getEntityType = (type: string): EntityTypeDefinition => {
		const entityType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === type);
		if (!entityType) {
			throw new Error(`Entity type '${type}' not found in BUILT_IN_ENTITY_TYPES`);
		}
		return entityType;
	};

	// Helper function to get field from entity type
	const getField = (entityType: EntityTypeDefinition, fieldKey: string): FieldDefinition | undefined => {
		return entityType.fieldDefinitions.find((f) => f.key === fieldKey);
	};

	// Helper to validate helpText quality
	const validateHelpTextQuality = (helpText: string | undefined, fieldName: string): void => {
		expect(helpText).toBeDefined();
		expect(helpText).not.toBe('');
		expect(helpText!.length).toBeGreaterThan(10); // Minimum meaningful length
		expect(helpText!.length).toBeLessThan(200); // Not too verbose (tooltip size)

		// HelpText should not just repeat the field label
		expect(helpText!.toLowerCase()).not.toBe(fieldName.toLowerCase());
	};

	describe('NPC Entity - Field Tooltips', () => {
		let npcType: EntityTypeDefinition;

		beforeEach(() => {
			npcType = getEntityType('npc');
		});

		it('should have helpText on greetings field', () => {
			const greetingsField = getField(npcType, 'greetings');

			expect(greetingsField).toBeDefined();
			expect(greetingsField?.helpText).toBeDefined();
			expect(greetingsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for greetings field', () => {
			const greetingsField = getField(npcType, 'greetings');
			validateHelpTextQuality(greetingsField?.helpText, 'greetings');

			// HelpText should mention key concepts
			const helpText = greetingsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('greet') ||
				helpText.includes('meet') ||
				helpText.includes('first') ||
				helpText.includes('say') ||
				helpText.includes('player');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on personality field', () => {
			const personalityField = getField(npcType, 'personality');

			expect(personalityField).toBeDefined();
			expect(personalityField?.helpText).toBeDefined();
			expect(personalityField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for personality field', () => {
			const personalityField = getField(npcType, 'personality');
			validateHelpTextQuality(personalityField?.helpText, 'personality');

			// HelpText should guide user on what to include
			const helpText = personalityField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('trait') ||
				helpText.includes('behavior') ||
				helpText.includes('character') ||
				helpText.includes('quirk') ||
				helpText.includes('demeanor');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on motivation field', () => {
			const motivationField = getField(npcType, 'motivation');

			expect(motivationField).toBeDefined();
			expect(motivationField?.helpText).toBeDefined();
			expect(motivationField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for motivation field', () => {
			const motivationField = getField(npcType, 'motivation');
			validateHelpTextQuality(motivationField?.helpText, 'motivation');

			// HelpText should explain what motivations are
			const helpText = motivationField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('goal') ||
				helpText.includes('drive') ||
				helpText.includes('want') ||
				helpText.includes('desire') ||
				helpText.includes('seek');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on secrets field', () => {
			const secretsField = getField(npcType, 'secrets');

			expect(secretsField).toBeDefined();
			expect(secretsField?.helpText).toBeDefined();
			expect(secretsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for secrets field', () => {
			const secretsField = getField(npcType, 'secrets');
			validateHelpTextQuality(secretsField?.helpText, 'secrets');

			// HelpText should explain purpose of secrets
			const helpText = secretsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('hidden') ||
				helpText.includes('reveal') ||
				helpText.includes('discover') ||
				helpText.includes('player') ||
				helpText.includes('private') ||
				helpText.includes('dm');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 4 NPC fields with helpText', () => {
			const fieldsWithHelpText = npcType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(4);
		});
	});

	describe('Location Entity - Field Tooltips', () => {
		let locationType: EntityTypeDefinition;

		beforeEach(() => {
			locationType = getEntityType('location');
		});

		it('should have helpText on atmosphere field', () => {
			const atmosphereField = getField(locationType, 'atmosphere');

			expect(atmosphereField).toBeDefined();
			expect(atmosphereField?.helpText).toBeDefined();
			expect(atmosphereField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for atmosphere field', () => {
			const atmosphereField = getField(locationType, 'atmosphere');
			validateHelpTextQuality(atmosphereField?.helpText, 'atmosphere');

			// Current helpText is 'What does it feel like to be here?'
			// Should be maintained or enhanced
			const helpText = atmosphereField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('feel') ||
				helpText.includes('mood') ||
				helpText.includes('sense') ||
				helpText.includes('vibe') ||
				helpText.includes('atmosphere');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on features field', () => {
			const featuresField = getField(locationType, 'features');

			expect(featuresField).toBeDefined();
			expect(featuresField?.helpText).toBeDefined();
			expect(featuresField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for features field', () => {
			const featuresField = getField(locationType, 'features');
			validateHelpTextQuality(featuresField?.helpText, 'features');

			// HelpText should guide what notable features are
			const helpText = featuresField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('notable') ||
				helpText.includes('landmark') ||
				helpText.includes('stand') ||
				helpText.includes('unique') ||
				helpText.includes('distinguish');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on history field', () => {
			const historyField = getField(locationType, 'history');

			expect(historyField).toBeDefined();
			expect(historyField?.helpText).toBeDefined();
			expect(historyField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for history field', () => {
			const historyField = getField(locationType, 'history');
			validateHelpTextQuality(historyField?.helpText, 'history');

			// HelpText should explain what to include in history
			const helpText = historyField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('past') ||
				helpText.includes('event') ||
				helpText.includes('origin') ||
				helpText.includes('founded') ||
				helpText.includes('historical');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on secrets field', () => {
			const secretsField = getField(locationType, 'secrets');

			expect(secretsField).toBeDefined();
			expect(secretsField?.helpText).toBeDefined();
			expect(secretsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for secrets field', () => {
			const secretsField = getField(locationType, 'secrets');
			validateHelpTextQuality(secretsField?.helpText, 'secrets');

			// HelpText should explain hidden aspects
			const helpText = secretsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('hidden') ||
				helpText.includes('discover') ||
				helpText.includes('secret') ||
				helpText.includes('reveal') ||
				helpText.includes('dm');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 4 Location fields with helpText', () => {
			const fieldsWithHelpText = locationType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(4);
		});
	});

	describe('Scene Entity - Field Tooltips', () => {
		let sceneType: EntityTypeDefinition;

		beforeEach(() => {
			sceneType = getEntityType('scene');
		});

		it('should have helpText on sceneSettingText field', () => {
			const sceneSettingField = getField(sceneType, 'sceneSettingText');

			expect(sceneSettingField).toBeDefined();
			expect(sceneSettingField?.helpText).toBeDefined();
			expect(sceneSettingField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for sceneSettingText field', () => {
			const sceneSettingField = getField(sceneType, 'sceneSettingText');
			validateHelpTextQuality(sceneSettingField?.helpText, 'scene setting');

			// Current helpText mentions AI generation and vivid description
			// Should maintain or enhance this guidance
			const helpText = sceneSettingField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('description') ||
				helpText.includes('vivid') ||
				helpText.includes('ai') ||
				helpText.includes('read') ||
				helpText.includes('setting');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on whatHappened field', () => {
			const whatHappenedField = getField(sceneType, 'whatHappened');

			expect(whatHappenedField).toBeDefined();
			expect(whatHappenedField?.helpText).toBeDefined();
			expect(whatHappenedField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for whatHappened field', () => {
			const whatHappenedField = getField(sceneType, 'whatHappened');
			validateHelpTextQuality(whatHappenedField?.helpText, 'what happened');

			// Current helpText: 'Record what actually happened during the scene.'
			// Should be maintained or enhanced
			const helpText = whatHappenedField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('record') ||
				helpText.includes('happen') ||
				helpText.includes('actual') ||
				helpText.includes('during') ||
				helpText.includes('scene');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on preSummary field', () => {
			const preSummaryField = getField(sceneType, 'preSummary');

			expect(preSummaryField).toBeDefined();
			expect(preSummaryField?.helpText).toBeDefined();
			expect(preSummaryField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for preSummary field', () => {
			const preSummaryField = getField(sceneType, 'preSummary');
			validateHelpTextQuality(preSummaryField?.helpText, 'pre-scene summary');

			// Current helpText mentions brief summary and AI generation
			// Should maintain or enhance this guidance
			const helpText = preSummaryField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('summary') ||
				helpText.includes('brief') ||
				helpText.includes('setup') ||
				helpText.includes('ai') ||
				helpText.includes('sentence');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on postSummary field', () => {
			const postSummaryField = getField(sceneType, 'postSummary');

			expect(postSummaryField).toBeDefined();
			expect(postSummaryField?.helpText).toBeDefined();
			expect(postSummaryField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for postSummary field', () => {
			const postSummaryField = getField(sceneType, 'postSummary');
			validateHelpTextQuality(postSummaryField?.helpText, 'post-scene summary');

			// Current helpText mentions brief summary and AI generation
			// Should maintain or enhance this guidance
			const helpText = postSummaryField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('summary') ||
				helpText.includes('brief') ||
				helpText.includes('happened') ||
				helpText.includes('ai') ||
				helpText.includes('sentence');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 4 Scene fields with helpText', () => {
			const fieldsWithHelpText = sceneType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(4);
		});
	});

	describe('Player Character Entity - Field Tooltips', () => {
		let characterType: EntityTypeDefinition;

		beforeEach(() => {
			characterType = getEntityType('character');
		});

		it('should have helpText on concept field', () => {
			const conceptField = getField(characterType, 'concept');

			expect(conceptField).toBeDefined();
			expect(conceptField?.helpText).toBeDefined();
			expect(conceptField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for concept field', () => {
			const conceptField = getField(characterType, 'concept');
			validateHelpTextQuality(conceptField?.helpText, 'character concept');

			// HelpText should explain what a character concept is
			const helpText = conceptField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('concept') ||
				helpText.includes('idea') ||
				helpText.includes('summary') ||
				helpText.includes('brief') ||
				helpText.includes('character');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on goals field', () => {
			const goalsField = getField(characterType, 'goals');

			expect(goalsField).toBeDefined();
			expect(goalsField?.helpText).toBeDefined();
			expect(goalsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for goals field', () => {
			const goalsField = getField(characterType, 'goals');
			validateHelpTextQuality(goalsField?.helpText, 'goals and motivations');

			// HelpText should explain what to include
			const helpText = goalsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('goal') ||
				helpText.includes('motivation') ||
				helpText.includes('drive') ||
				helpText.includes('seek') ||
				helpText.includes('want');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on secrets field', () => {
			const secretsField = getField(characterType, 'secrets');

			expect(secretsField).toBeDefined();
			expect(secretsField?.helpText).toBeDefined();
			expect(secretsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for secrets field', () => {
			const secretsField = getField(characterType, 'secrets');
			validateHelpTextQuality(secretsField?.helpText, 'secrets');

			// HelpText should explain the purpose
			const helpText = secretsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('hidden') ||
				helpText.includes('secret') ||
				helpText.includes('backstory') ||
				helpText.includes('private') ||
				helpText.includes('dm');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 3 Character fields with helpText', () => {
			const fieldsWithHelpText = characterType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('Player Profile Entity - Field Tooltips', () => {
		let playerProfileType: EntityTypeDefinition;

		beforeEach(() => {
			playerProfileType = getEntityType('player_profile');
		});

		it('should have helpText on preferences field', () => {
			const preferencesField = getField(playerProfileType, 'preferences');

			expect(preferencesField).toBeDefined();
			expect(preferencesField?.helpText).toBeDefined();
			expect(preferencesField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for preferences field', () => {
			const preferencesField = getField(playerProfileType, 'preferences');
			validateHelpTextQuality(preferencesField?.helpText, 'preferences');

			// Current helpText: 'What kind of gameplay do they enjoy?'
			// Should be maintained or enhanced
			const helpText = preferencesField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('gameplay') ||
				helpText.includes('enjoy') ||
				helpText.includes('prefer') ||
				helpText.includes('like') ||
				helpText.includes('play');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on boundaries field', () => {
			const boundariesField = getField(playerProfileType, 'boundaries');

			expect(boundariesField).toBeDefined();
			expect(boundariesField?.helpText).toBeDefined();
			expect(boundariesField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for boundaries field', () => {
			const boundariesField = getField(playerProfileType, 'boundaries');
			validateHelpTextQuality(boundariesField?.helpText, 'boundaries');

			// Current helpText: 'Topics to avoid or handle carefully'
			// Should be maintained or enhanced
			const helpText = boundariesField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('topic') ||
				helpText.includes('avoid') ||
				helpText.includes('careful') ||
				helpText.includes('line') ||
				helpText.includes('veil');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 2 Player Profile fields with helpText', () => {
			const fieldsWithHelpText = playerProfileType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Timeline Event Entity - Field Tooltips', () => {
		let timelineEventType: EntityTypeDefinition;

		beforeEach(() => {
			timelineEventType = getEntityType('timeline_event');
		});

		it('should have helpText on sortOrder field', () => {
			const sortOrderField = getField(timelineEventType, 'sortOrder');

			expect(sortOrderField).toBeDefined();
			expect(sortOrderField?.helpText).toBeDefined();
			expect(sortOrderField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for sortOrder field', () => {
			const sortOrderField = getField(timelineEventType, 'sortOrder');
			validateHelpTextQuality(sortOrderField?.helpText, 'sort order');

			// Current helpText: 'Used to order events chronologically'
			// Should be maintained or enhanced
			const helpText = sortOrderField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('order') ||
				helpText.includes('chronolog') ||
				helpText.includes('event') ||
				helpText.includes('sort');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on significance field', () => {
			const significanceField = getField(timelineEventType, 'significance');

			expect(significanceField).toBeDefined();
			expect(significanceField?.helpText).toBeDefined();
			expect(significanceField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for significance field', () => {
			const significanceField = getField(timelineEventType, 'significance');
			validateHelpTextQuality(significanceField?.helpText, 'significance');

			// HelpText should explain what significance means
			const helpText = significanceField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('important') ||
				helpText.includes('impact') ||
				helpText.includes('matter') ||
				helpText.includes('significant') ||
				helpText.includes('why');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have at least 2 Timeline Event fields with helpText', () => {
			const fieldsWithHelpText = timelineEventType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Faction Entity - Field Tooltips', () => {
		let factionType: EntityTypeDefinition;

		beforeEach(() => {
			factionType = getEntityType('faction');
		});

		it('should have helpText on goals field', () => {
			const goalsField = getField(factionType, 'goals');

			expect(goalsField).toBeDefined();
			expect(goalsField?.helpText).toBeDefined();
			expect(goalsField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for goals field', () => {
			const goalsField = getField(factionType, 'goals');
			validateHelpTextQuality(goalsField?.helpText, 'goals');

			// HelpText should explain faction goals
			const helpText = goalsField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('goal') ||
				helpText.includes('objective') ||
				helpText.includes('seek') ||
				helpText.includes('aim') ||
				helpText.includes('faction');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on values field', () => {
			const valuesField = getField(factionType, 'values');

			expect(valuesField).toBeDefined();
			expect(valuesField?.helpText).toBeDefined();
			expect(valuesField?.helpText).not.toBe('');
		});

		it('should have meaningful helpText for values field', () => {
			const valuesField = getField(factionType, 'values');
			validateHelpTextQuality(valuesField?.helpText, 'values and beliefs');

			// HelpText should explain what values/beliefs are
			const helpText = valuesField?.helpText?.toLowerCase() || '';
			const hasRelevantKeywords =
				helpText.includes('value') ||
				helpText.includes('belief') ||
				helpText.includes('principle') ||
				helpText.includes('stand') ||
				helpText.includes('important');

			expect(hasRelevantKeywords).toBe(true);
		});

		it('should have helpText on secrets field', () => {
			const secretsField = getField(factionType, 'secrets');

			expect(secretsField).toBeDefined();
			expect(secretsField?.helpText).toBeDefined();
			expect(secretsField?.helpText).not.toBe('');
		});

		it('should have at least 3 Faction fields with helpText', () => {
			const fieldsWithHelpText = factionType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('HelpText Quality Standards', () => {
		it('should have all helpText following quality guidelines', () => {
			// Collect all fields with helpText across all entity types
			const allFieldsWithHelpText: Array<{ entityType: string; field: FieldDefinition }> = [];

			BUILT_IN_ENTITY_TYPES.forEach((entityType) => {
				entityType.fieldDefinitions
					.filter((f) => f.helpText && f.helpText.length > 0)
					.forEach((field) => {
						allFieldsWithHelpText.push({ entityType: entityType.type, field });
					});
			});

			// Should have at least 20 fields with helpText across all entities
			expect(allFieldsWithHelpText.length).toBeGreaterThanOrEqual(20);

			// Verify each helpText meets quality standards
			allFieldsWithHelpText.forEach(({ entityType, field }) => {
				const helpText = field.helpText!;

				// Not empty
				expect(helpText.length).toBeGreaterThan(0);

				// Reasonable length (not too short, not too long)
				expect(helpText.length).toBeGreaterThan(10);
				expect(helpText.length).toBeLessThan(200);

				// Starts with capital letter or question word
				expect(helpText[0]).toMatch(/[A-Z]/);

				// Contains meaningful words (not just punctuation)
				expect(helpText.match(/\w+/g)?.length).toBeGreaterThan(2);
			});
		});

		it('should have helpText that is distinct from field labels', () => {
			// Collect all fields with helpText
			const allFieldsWithHelpText: FieldDefinition[] = [];

			BUILT_IN_ENTITY_TYPES.forEach((entityType) => {
				entityType.fieldDefinitions
					.filter((f) => f.helpText && f.helpText.length > 0)
					.forEach((field) => {
						allFieldsWithHelpText.push(field);
					});
			});

			// Verify helpText is not just the label
			allFieldsWithHelpText.forEach((field) => {
				const helpText = field.helpText!.toLowerCase().trim();
				const label = field.label.toLowerCase().trim();

				// HelpText should not be identical to label
				expect(helpText).not.toBe(label);

				// HelpText should provide additional information beyond the label
				expect(helpText.length).toBeGreaterThan(label.length);
			});
		});

		it('should have helpText that uses helpful language patterns', () => {
			// Collect all fields with helpText
			const allFieldsWithHelpText: Array<{ field: FieldDefinition }> = [];

			BUILT_IN_ENTITY_TYPES.forEach((entityType) => {
				entityType.fieldDefinitions
					.filter((f) => f.helpText && f.helpText.length > 0)
					.forEach((field) => {
						allFieldsWithHelpText.push({ field });
					});
			});

			// At least 50% should use guidance patterns
			const guidancePatterns = [
				/what\s+/i,
				/how\s+/i,
				/describe/i,
				/used\s+to/i,
				/can\s+be/i,
				/brief/i,
				/record/i,
			];

			const fieldsWithGuidanceLanguage = allFieldsWithHelpText.filter(({ field }) => {
				const helpText = field.helpText!;
				return guidancePatterns.some((pattern) => pattern.test(helpText));
			});

			const percentageWithGuidance =
				(fieldsWithGuidanceLanguage.length / allFieldsWithHelpText.length) * 100;

			expect(percentageWithGuidance).toBeGreaterThanOrEqual(50);
		});
	});

	describe('Coverage Across Entity Types', () => {
		it('should have NPC entity type with field tooltips', () => {
			const npcType = getEntityType('npc');
			const fieldsWithHelpText = npcType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThan(0);
		});

		it('should have Location entity type with field tooltips', () => {
			const locationType = getEntityType('location');
			const fieldsWithHelpText = locationType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThan(0);
		});

		it('should have Scene entity type with field tooltips', () => {
			const sceneType = getEntityType('scene');
			const fieldsWithHelpText = sceneType.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBeGreaterThan(0);
		});

		it('should have at least 6 entity types with field tooltips', () => {
			const entityTypesWithTooltips = BUILT_IN_ENTITY_TYPES.filter((entityType) => {
				const fieldsWithHelpText = entityType.fieldDefinitions.filter(
					(f) => f.helpText && f.helpText.length > 0
				);
				return fieldsWithHelpText.length > 0;
			});

			expect(entityTypesWithTooltips.length).toBeGreaterThanOrEqual(6);
		});

		it('should have secrets fields across entity types with consistent helpText', () => {
			const secretsFields: Array<{ entityType: string; helpText: string }> = [];

			BUILT_IN_ENTITY_TYPES.forEach((entityType) => {
				const secretsField = getField(entityType, 'secrets');
				if (secretsField?.helpText) {
					secretsFields.push({
						entityType: entityType.type,
						helpText: secretsField.helpText
					});
				}
			});

			// Should have secrets helpText in at least 4 entity types
			expect(secretsFields.length).toBeGreaterThanOrEqual(4);

			// All secrets helpText should mention similar concepts
			secretsFields.forEach(({ entityType, helpText }) => {
				const lowerHelpText = helpText.toLowerCase();
				const hasRelevantKeywords =
					lowerHelpText.includes('hidden') ||
					lowerHelpText.includes('secret') ||
					lowerHelpText.includes('reveal') ||
					lowerHelpText.includes('discover') ||
					lowerHelpText.includes('private') ||
					lowerHelpText.includes('dm');

				expect(hasRelevantKeywords).toBe(true);
			});
		});
	});

	describe('Field Definition Type Safety', () => {
		it('should maintain FieldDefinition interface compatibility', () => {
			// Verify that all helpText additions conform to FieldDefinition interface
			BUILT_IN_ENTITY_TYPES.forEach((entityType) => {
				entityType.fieldDefinitions.forEach((field) => {
					// If helpText exists, it should be a string
					if (field.helpText !== undefined) {
						expect(typeof field.helpText).toBe('string');
					}

					// Required properties should still be present
					expect(field).toHaveProperty('key');
					expect(field).toHaveProperty('label');
					expect(field).toHaveProperty('type');
					expect(field).toHaveProperty('required');
					expect(field).toHaveProperty('order');
				});
			});
		});

		it('should not break getEntityTypeDefinition functionality', () => {
			// Verify that adding helpText doesn't break existing functionality
			const npcType = getEntityTypeDefinition('npc');

			expect(npcType).toBeDefined();
			expect(npcType?.type).toBe('npc');
			expect(npcType?.fieldDefinitions).toBeDefined();
			expect(Array.isArray(npcType?.fieldDefinitions)).toBe(true);
		});
	});

	describe('Backward Compatibility', () => {
		it('should maintain existing field properties when adding helpText', () => {
			const sceneType = getEntityType('scene');
			const sceneSettingField = getField(sceneType, 'sceneSettingText');

			// Existing properties should be unchanged
			expect(sceneSettingField?.key).toBe('sceneSettingText');
			expect(sceneSettingField?.label).toBe('Scene Setting (Read-Aloud)');
			expect(sceneSettingField?.type).toBe('richtext');
			expect(sceneSettingField?.required).toBe(false);
			expect(sceneSettingField?.order).toBe(5);
		});

		it('should maintain existing helpText where already present', () => {
			// Scene fields already have some helpText - should be maintained
			const sceneType = getEntityType('scene');

			// These fields already had helpText, verify they still exist
			const fieldsWithExistingHelpText = [
				'sceneSettingText',
				'whatHappened',
				'preSummary',
				'postSummary'
			];

			fieldsWithExistingHelpText.forEach((fieldKey) => {
				const field = getField(sceneType, fieldKey);
				expect(field?.helpText).toBeDefined();
				expect(field?.helpText).not.toBe('');
			});
		});

		it('should not remove or modify existing placeholders', () => {
			const npcType = getEntityType('npc');
			const greetingsField = getField(npcType, 'greetings');

			// Placeholder should still exist
			expect(greetingsField?.placeholder).toBeDefined();
			expect(greetingsField?.placeholder).not.toBe('');
		});
	});
});
