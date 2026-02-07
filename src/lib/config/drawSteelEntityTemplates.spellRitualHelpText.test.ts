/**
 * Unit Tests for Spell/Ritual Template Context Help (Issue #223)
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until helpText is added to spellRitualTemplate field definitions.
 *
 * Test Strategy:
 * 1. Field-Specific HelpText Tests - Verify each field has appropriate help text
 * 2. HelpText Quality Tests - Ensure helpText is meaningful and well-formatted
 * 3. Draw Steel Context Tests - Verify helpText acknowledges Draw Steel flexibility
 * 4. Content Validation Tests - Ensure keywords and guidance are present
 * 5. Integration Tests - Verify template structure remains intact
 *
 * Requirements from Issue #223:
 * - Add helpText to all fields in spellRitualTemplate
 * - Follow the pattern established in Issue #218 for field tooltips
 * - Provide helpful guidance for each field explaining what to enter
 * - Ensure Directors understand they can customize for their campaign's magic system
 *
 * Context from Issue #218 Pattern:
 * - HelpText should be 1-2 sentences, informative but brief
 * - HelpText should explain the field's purpose and Draw Steel context
 * - HelpText should be 10-200 characters (tooltip-appropriate)
 * - HelpText should use guidance language patterns (what, how, describe, etc.)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DRAW_STEEL_ENTITY_TEMPLATES } from './drawSteelEntityTemplates';
import type { EntityTypeTemplate } from './drawSteelEntityTemplates';
import type { FieldDefinition } from '$lib/types';

describe('Spell/Ritual Template Context Help (Issue #223)', () => {
	// Helper to get the spell/ritual template
	const getSpellRitualTemplate = (): EntityTypeTemplate | undefined => {
		return DRAW_STEEL_ENTITY_TEMPLATES.find((t) => t.id === 'ds-spell-ritual');
	};

	// Helper to get a specific field from the template
	const getField = (template: EntityTypeTemplate, fieldKey: string): FieldDefinition | undefined => {
		return template.template.fieldDefinitions.find((f) => f.key === fieldKey);
	};

	// Helper to validate helpText quality (following Issue #218 pattern)
	const validateHelpTextQuality = (
		helpText: string | undefined,
		fieldLabel: string,
		context?: string
	): void => {
		expect(helpText).toBeDefined();
		expect(helpText).not.toBe('');

		// HelpText should be meaningful (minimum length)
		expect(helpText!.length).toBeGreaterThan(10);

		// HelpText should be concise (tooltip-appropriate, not verbose)
		expect(helpText!.length).toBeLessThan(200);

		// HelpText should not just repeat the field label
		const lowerHelpText = helpText!.toLowerCase();
		const lowerLabel = fieldLabel.toLowerCase();
		expect(lowerHelpText).not.toBe(lowerLabel);

		// If context provided, use it in error messages
		const contextMsg = context ? ` (${context})` : '';

		// HelpText should start with capital letter or question word
		expect(helpText![0]).toMatch(/[A-Z]/);

		// HelpText should contain meaningful words
		const wordCount = helpText!.match(/\w+/g)?.length || 0;
		expect(wordCount).toBeGreaterThan(2);
	};

	describe('Template Structure Validation', () => {
		it('should have spell/ritual template in DRAW_STEEL_ENTITY_TEMPLATES', () => {
			const template = getSpellRitualTemplate();
			expect(template).toBeDefined();
			expect(template?.id).toBe('ds-spell-ritual');
		});

		it('should have exactly 5 field definitions', () => {
			const template = getSpellRitualTemplate();
			expect(template?.template.fieldDefinitions.length).toBe(5);
		});

		it('should maintain existing field structure after adding helpText', () => {
			const template = getSpellRitualTemplate();

			// Verify all expected fields exist
			const expectedFields = ['level', 'schools', 'casting_time', 'range', 'duration'];
			const actualFieldKeys = template?.template.fieldDefinitions.map((f) => f.key) || [];

			expectedFields.forEach((fieldKey) => {
				expect(actualFieldKeys).toContain(fieldKey);
			});
		});
	});

	describe('Field-Specific HelpText Tests', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		describe('Level Field', () => {
			it('should have helpText on level field', () => {
				const levelField = getField(template, 'level');

				expect(levelField).toBeDefined();
				expect(levelField?.helpText).toBeDefined();
				expect(levelField?.helpText).not.toBe('');
			});

			it('should have meaningful helpText for level field', () => {
				const levelField = getField(template, 'level');
				validateHelpTextQuality(levelField?.helpText, 'Level', 'spell level');

				// HelpText should explain what spell level represents
				const helpText = levelField?.helpText?.toLowerCase() || '';
				const hasRelevantKeywords =
					helpText.includes('level') ||
					helpText.includes('power') ||
					helpText.includes('tier') ||
					helpText.includes('rank') ||
					helpText.includes('strength');

				expect(hasRelevantKeywords).toBe(true);
			});

			it('should mention numeric input in level helpText', () => {
				const levelField = getField(template, 'level');
				const helpText = levelField?.helpText?.toLowerCase() || '';

				// Should indicate it's a number (0, 1, 2, etc.) or mention level tiers
				const mentionsNumericConcept =
					helpText.includes('number') ||
					helpText.includes('1') ||
					helpText.includes('0') ||
					helpText.includes('tier') ||
					helpText.includes('rank');

				expect(mentionsNumericConcept).toBe(true);
			});
		});

		describe('Schools Field', () => {
			it('should have helpText on schools field', () => {
				const schoolsField = getField(template, 'schools');

				expect(schoolsField).toBeDefined();
				expect(schoolsField?.helpText).toBeDefined();
				expect(schoolsField?.helpText).not.toBe('');
			});

			it('should have meaningful helpText for schools field', () => {
				const schoolsField = getField(template, 'schools');
				validateHelpTextQuality(schoolsField?.helpText, 'Schools', 'magic schools');

				// HelpText should explain what magic schools are
				const helpText = schoolsField?.helpText?.toLowerCase() || '';
				const hasRelevantKeywords =
					helpText.includes('school') ||
					helpText.includes('magic') ||
					helpText.includes('type') ||
					helpText.includes('category') ||
					helpText.includes('discipline');

				expect(hasRelevantKeywords).toBe(true);
			});

			it('should mention customization in schools helpText (Issue #223 requirement)', () => {
				const schoolsField = getField(template, 'schools');
				const helpText = schoolsField?.helpText?.toLowerCase() || '';

				// Per Issue #223, should mention that schools are customizable
				const mentionsCustomization =
					helpText.includes('custom') ||
					helpText.includes('campaign') ||
					helpText.includes('adapt') ||
					helpText.includes('modify') ||
					helpText.includes('change') ||
					helpText.includes('own') ||
					helpText.includes('homebrew');

				expect(mentionsCustomization).toBe(true);
			});

			it('should acknowledge Draw Steel flexibility in schools helpText', () => {
				const schoolsField = getField(template, 'schools');
				const helpText = schoolsField?.helpText?.toLowerCase() || '';

				// Should indicate these are suggestions or can be customized
				const acknowledgesFlexibility =
					helpText.includes('can') ||
					helpText.includes('may') ||
					helpText.includes('custom') ||
					helpText.includes('your') ||
					helpText.includes('optional');

				expect(acknowledgesFlexibility).toBe(true);
			});
		});

		describe('Casting Time Field', () => {
			it('should have helpText on casting_time field', () => {
				const castingTimeField = getField(template, 'casting_time');

				expect(castingTimeField).toBeDefined();
				expect(castingTimeField?.helpText).toBeDefined();
				expect(castingTimeField?.helpText).not.toBe('');
			});

			it('should have meaningful helpText for casting_time field', () => {
				const castingTimeField = getField(template, 'casting_time');
				validateHelpTextQuality(castingTimeField?.helpText, 'Casting Time', 'casting time');

				// HelpText should explain what casting time represents
				const helpText = castingTimeField?.helpText?.toLowerCase() || '';
				const hasRelevantKeywords =
					helpText.includes('time') ||
					helpText.includes('cast') ||
					helpText.includes('action') ||
					helpText.includes('long') ||
					helpText.includes('duration') ||
					helpText.includes('take');

				expect(hasRelevantKeywords).toBe(true);
			});

			it('should provide examples or guidance for casting_time input', () => {
				const castingTimeField = getField(template, 'casting_time');
				const helpText = castingTimeField?.helpText?.toLowerCase() || '';

				// Should mention actions, time units, or give examples
				const providesGuidance =
					helpText.includes('action') ||
					helpText.includes('maneuver') ||
					helpText.includes('minute') ||
					helpText.includes('hour') ||
					helpText.includes('round') ||
					helpText.includes('instant') ||
					helpText.includes('ritual');

				expect(providesGuidance).toBe(true);
			});
		});

		describe('Range Field', () => {
			it('should have helpText on range field', () => {
				const rangeField = getField(template, 'range');

				expect(rangeField).toBeDefined();
				expect(rangeField?.helpText).toBeDefined();
				expect(rangeField?.helpText).not.toBe('');
			});

			it('should have meaningful helpText for range field', () => {
				const rangeField = getField(template, 'range');
				validateHelpTextQuality(rangeField?.helpText, 'Range', 'spell range');

				// HelpText should explain what range represents
				const helpText = rangeField?.helpText?.toLowerCase() || '';
				const hasRelevantKeywords =
					helpText.includes('range') ||
					helpText.includes('distance') ||
					helpText.includes('far') ||
					helpText.includes('reach') ||
					helpText.includes('target') ||
					helpText.includes('cast');

				expect(hasRelevantKeywords).toBe(true);
			});

			it('should provide examples or guidance for range input', () => {
				const rangeField = getField(template, 'range');
				const helpText = rangeField?.helpText?.toLowerCase() || '';

				// Should mention distance units or give examples
				const providesGuidance =
					helpText.includes('self') ||
					helpText.includes('touch') ||
					helpText.includes('square') ||
					helpText.includes('feet') ||
					helpText.includes('meter') ||
					helpText.includes('distance') ||
					helpText.includes('5') ||
					helpText.includes('10');

				expect(providesGuidance).toBe(true);
			});
		});

		describe('Duration Field', () => {
			it('should have helpText on duration field', () => {
				const durationField = getField(template, 'duration');

				expect(durationField).toBeDefined();
				expect(durationField?.helpText).toBeDefined();
				expect(durationField?.helpText).not.toBe('');
			});

			it('should have meaningful helpText for duration field', () => {
				const durationField = getField(template, 'duration');
				validateHelpTextQuality(durationField?.helpText, 'Duration', 'spell duration');

				// HelpText should explain what duration represents
				const helpText = durationField?.helpText?.toLowerCase() || '';
				const hasRelevantKeywords =
					helpText.includes('duration') ||
					helpText.includes('last') ||
					helpText.includes('long') ||
					helpText.includes('effect') ||
					helpText.includes('active') ||
					helpText.includes('time');

				expect(hasRelevantKeywords).toBe(true);
			});

			it('should provide examples or guidance for duration input', () => {
				const durationField = getField(template, 'duration');
				const helpText = durationField?.helpText?.toLowerCase() || '';

				// Should mention time units or give examples
				const providesGuidance =
					helpText.includes('instant') ||
					helpText.includes('concentration') ||
					helpText.includes('round') ||
					helpText.includes('minute') ||
					helpText.includes('hour') ||
					helpText.includes('permanent') ||
					helpText.includes('turn');

				expect(providesGuidance).toBe(true);
			});
		});
	});

	describe('HelpText Quality Standards', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		it('should have all 5 fields with helpText', () => {
			const fieldsWithHelpText = template.template.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			expect(fieldsWithHelpText.length).toBe(5);
		});

		it('should have helpText that is distinct from field labels', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					const helpText = field.helpText.toLowerCase().trim();
					const label = field.label.toLowerCase().trim();

					// HelpText should not be identical to label
					expect(helpText).not.toBe(label);

					// HelpText should provide additional information
					expect(helpText.length).toBeGreaterThan(label.length);
				}
			});
		});

		it('should have helpText with appropriate length for all fields', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					// Minimum meaningful length
					expect(field.helpText.length).toBeGreaterThan(10);

					// Maximum tooltip-appropriate length
					expect(field.helpText.length).toBeLessThan(200);
				}
			});
		});

		it('should have helpText starting with capital letters', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					expect(field.helpText[0]).toMatch(/[A-Z]/);
				}
			});
		});

		it('should have helpText with meaningful word count', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					const wordCount = field.helpText.match(/\w+/g)?.length || 0;
					expect(wordCount).toBeGreaterThan(2);
				}
			});
		});

		it('should have at least 60% of fields using guidance language patterns', () => {
			const guidancePatterns = [
				/what\s+/i,
				/how\s+/i,
				/describe/i,
				/used\s+to/i,
				/can\s+be/i,
				/specify/i,
				/enter/i,
				/choose/i,
				/select/i,
				/define/i
			];

			const fieldsWithHelpText = template.template.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			const fieldsWithGuidanceLanguage = fieldsWithHelpText.filter((field) => {
				return guidancePatterns.some((pattern) => pattern.test(field.helpText!));
			});

			const percentage =
				(fieldsWithGuidanceLanguage.length / fieldsWithHelpText.length) * 100;

			expect(percentage).toBeGreaterThanOrEqual(60);
		});
	});

	describe('Draw Steel Context and Customization', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		it('should have at least one field mentioning customization or campaign-specific usage', () => {
			const customizationKeywords = [
				'custom',
				'campaign',
				'your',
				'adapt',
				'modify',
				'homebrew',
				'own'
			];

			const fieldsWithCustomizationGuidance = template.template.fieldDefinitions.filter((field) => {
				if (!field.helpText) return false;
				const helpText = field.helpText.toLowerCase();
				return customizationKeywords.some((keyword) => helpText.includes(keyword));
			});

			expect(fieldsWithCustomizationGuidance.length).toBeGreaterThanOrEqual(1);
		});

		it('should acknowledge Draw Steel flexibility in magic system', () => {
			// Draw Steel doesn't have rigid spell schools like D&D 5e
			// At least one field should acknowledge this flexibility
			const flexibilityKeywords = [
				'can',
				'may',
				'optional',
				'custom',
				'your',
				'campaign',
				'adapt'
			];

			const fieldsAcknowledgingFlexibility = template.template.fieldDefinitions.filter((field) => {
				if (!field.helpText) return false;
				const helpText = field.helpText.toLowerCase();
				return flexibilityKeywords.some((keyword) => helpText.includes(keyword));
			});

			expect(fieldsAcknowledgingFlexibility.length).toBeGreaterThanOrEqual(1);
		});

		it('should provide practical guidance for Directors building magic systems', () => {
			// HelpText should help Directors understand how to use the template
			const practicalKeywords = [
				'enter',
				'describe',
				'specify',
				'define',
				'choose',
				'select',
				'example',
				'such as',
				'like'
			];

			const fieldsWithPracticalGuidance = template.template.fieldDefinitions.filter((field) => {
				if (!field.helpText) return false;
				const helpText = field.helpText.toLowerCase();
				return practicalKeywords.some((keyword) => helpText.includes(keyword));
			});

			// At least 3 fields should have practical guidance
			expect(fieldsWithPracticalGuidance.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe('Integration and Backward Compatibility', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		it('should maintain existing field properties when adding helpText', () => {
			// Verify level field
			const levelField = getField(template, 'level');
			expect(levelField?.key).toBe('level');
			expect(levelField?.label).toBe('Level');
			expect(levelField?.type).toBe('number');
			expect(levelField?.required).toBe(false);
			expect(levelField?.order).toBe(1);

			// Verify schools field
			const schoolsField = getField(template, 'schools');
			expect(schoolsField?.key).toBe('schools');
			expect(schoolsField?.label).toBe('Schools');
			expect(schoolsField?.type).toBe('multi-select');
			expect(schoolsField?.required).toBe(false);
			expect(schoolsField?.order).toBe(2);
			expect(schoolsField?.options).toBeDefined();
			expect(schoolsField?.options?.length).toBe(8);
		});

		it('should maintain schools options when adding helpText', () => {
			const schoolsField = getField(template, 'schools');

			expect(schoolsField?.options).toContain('abjuration');
			expect(schoolsField?.options).toContain('conjuration');
			expect(schoolsField?.options).toContain('divination');
			expect(schoolsField?.options).toContain('enchantment');
			expect(schoolsField?.options).toContain('evocation');
			expect(schoolsField?.options).toContain('illusion');
			expect(schoolsField?.options).toContain('necromancy');
			expect(schoolsField?.options).toContain('transmutation');
		});

		it('should maintain field order when adding helpText', () => {
			const fieldOrder = template.template.fieldDefinitions
				.map((f) => ({ key: f.key, order: f.order }))
				.sort((a, b) => a.order - b.order);

			expect(fieldOrder[0].key).toBe('level');
			expect(fieldOrder[1].key).toBe('schools');
			expect(fieldOrder[2].key).toBe('casting_time');
			expect(fieldOrder[3].key).toBe('range');
			expect(fieldOrder[4].key).toBe('duration');
		});

		it('should not break template metadata when adding helpText', () => {
			expect(template.id).toBe('ds-spell-ritual');
			expect(template.name).toBe('Spell/Ritual');
			expect(template.description).toBeDefined();
			expect(template.category).toBe('draw-steel');
			expect(template.template.type).toBe('ds-spell-ritual');
			expect(template.template.icon).toBe('sparkles');
			expect(template.template.color).toBe('blue');
			expect(template.template.isBuiltIn).toBe(false);
		});

		it('should maintain TypeScript type compatibility', () => {
			// Verify all fields conform to FieldDefinition interface
			template.template.fieldDefinitions.forEach((field) => {
				expect(field).toHaveProperty('key');
				expect(field).toHaveProperty('label');
				expect(field).toHaveProperty('type');
				expect(field).toHaveProperty('required');
				expect(field).toHaveProperty('order');

				// If helpText exists, it should be a string
				if (field.helpText !== undefined) {
					expect(typeof field.helpText).toBe('string');
				}
			});
		});
	});

	describe('Content-Specific Guidance', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		it('should provide level-specific guidance that helps Directors understand power scaling', () => {
			const levelField = getField(template, 'level');
			const helpText = levelField?.helpText?.toLowerCase() || '';

			// Should help Directors understand what level means
			const hasScalingConcept =
				helpText.includes('power') ||
				helpText.includes('tier') ||
				helpText.includes('strength') ||
				helpText.includes('potent') ||
				helpText.includes('advanced');

			expect(hasScalingConcept).toBe(true);
		});

		it('should provide schools-specific guidance that acknowledges standard options', () => {
			const schoolsField = getField(template, 'schools');
			const helpText = schoolsField?.helpText?.toLowerCase() || '';

			// Should reference the concept of magic schools
			const mentionsMagicSchools =
				helpText.includes('school') ||
				helpText.includes('magic') ||
				helpText.includes('abjur') ||
				helpText.includes('conjur') ||
				helpText.includes('evoc');

			expect(mentionsMagicSchools).toBe(true);
		});

		it('should provide casting_time guidance that relates to game mechanics', () => {
			const castingTimeField = getField(template, 'casting_time');
			const helpText = castingTimeField?.helpText?.toLowerCase() || '';

			// Should relate to action economy or time units
			const relatesToMechanics =
				helpText.includes('action') ||
				helpText.includes('maneuver') ||
				helpText.includes('turn') ||
				helpText.includes('round') ||
				helpText.includes('instant') ||
				helpText.includes('ritual');

			expect(relatesToMechanics).toBe(true);
		});

		it('should provide range guidance that helps with positioning mechanics', () => {
			const rangeField = getField(template, 'range');
			const helpText = rangeField?.helpText?.toLowerCase() || '';

			// Should help Directors understand range mechanics
			const helpsWithPositioning =
				helpText.includes('distance') ||
				helpText.includes('far') ||
				helpText.includes('reach') ||
				helpText.includes('self') ||
				helpText.includes('touch') ||
				helpText.includes('square');

			expect(helpsWithPositioning).toBe(true);
		});

		it('should provide duration guidance that helps with spell effect timing', () => {
			const durationField = getField(template, 'duration');
			const helpText = durationField?.helpText?.toLowerCase() || '';

			// Should help Directors understand how long effects last
			const helpsWithTiming =
				helpText.includes('last') ||
				helpText.includes('effect') ||
				helpText.includes('active') ||
				helpText.includes('instant') ||
				helpText.includes('concentration') ||
				helpText.includes('permanent');

			expect(helpsWithTiming).toBe(true);
		});
	});

	describe('User Experience and Accessibility', () => {
		let template: EntityTypeTemplate;

		beforeEach(() => {
			template = getSpellRitualTemplate()!;
		});

		it('should have helpText that is screen-reader friendly', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					// Should be complete sentences or phrases
					// Should not have excessive abbreviations
					const hasCompleteThought = field.helpText.length > 15;
					expect(hasCompleteThought).toBe(true);

					// Should not rely solely on symbols or formatting
					const hasWords = field.helpText.match(/[a-zA-Z]+/g);
					expect(hasWords).toBeDefined();
					expect(hasWords!.length).toBeGreaterThan(2);
				}
			});
		});

		it('should have helpText that avoids technical jargon where possible', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					// Should be understandable to Directors new to Draw Steel
					// This is subjective, but we can check for clarity indicators
					const hasExplanation =
						field.helpText.includes('what') ||
						field.helpText.includes('how') ||
						field.helpText.includes('describe') ||
						field.helpText.length > 20;

					// At least provide some context
					expect(hasExplanation).toBe(true);
				}
			});
		});

		it('should have helpText that provides value beyond the field label', () => {
			template.template.fieldDefinitions.forEach((field) => {
				if (field.helpText) {
					// HelpText should add information not obvious from label alone
					const labelWords = field.label.toLowerCase().split(/\s+/);
					const helpTextWords = field.helpText.toLowerCase().split(/\s+/);

					// HelpText should have words not in the label
					const uniqueWords = helpTextWords.filter((word) => {
						return !labelWords.includes(word) && word.length > 3;
					});

					expect(uniqueWords.length).toBeGreaterThan(0);
				}
			});
		});
	});

	describe('Consistency with Other Templates', () => {
		it('should follow similar helpText patterns as other Draw Steel templates', () => {
			const spellTemplate = getSpellRitualTemplate()!;

			// Compare with ability/power template which has similar mechanics
			const abilityTemplate = DRAW_STEEL_ENTITY_TEMPLATES.find(
				(t) => t.id === 'ds-ability-power'
			);

			if (abilityTemplate) {
				// Both should have range fields - check for consistency
				const spellRangeField = getField(spellTemplate, 'range');
				const abilityRangeField = abilityTemplate.template.fieldDefinitions.find(
					(f) => f.key === 'range'
				);

				if (spellRangeField?.helpText && abilityRangeField?.helpText) {
					// Both should mention similar concepts for range
					const spellRangeLower = spellRangeField.helpText.toLowerCase();
					const abilityRangeLower = abilityRangeField.helpText.toLowerCase();

					// Both should use helpful guidance language
					const spellHasGuidance =
						spellRangeLower.includes('distance') ||
						spellRangeLower.includes('range') ||
						spellRangeLower.includes('far');

					const abilityHasGuidance =
						abilityRangeLower.includes('distance') ||
						abilityRangeLower.includes('range') ||
						abilityRangeLower.includes('far');

					// At least one should have guidance (may differ in wording)
					expect(spellHasGuidance || abilityHasGuidance).toBe(true);
				}
			}
		});

		it('should have similar helpText quality as other templates in the system', () => {
			const spellTemplate = getSpellRitualTemplate()!;

			const fieldsWithHelpText = spellTemplate.template.fieldDefinitions.filter(
				(f) => f.helpText && f.helpText.length > 0
			);

			// Quality metrics should match other templates
			fieldsWithHelpText.forEach((field) => {
				// Length appropriate
				expect(field.helpText!.length).toBeGreaterThan(10);
				expect(field.helpText!.length).toBeLessThan(200);

				// Starts with capital
				expect(field.helpText![0]).toMatch(/[A-Z]/);

				// Has meaningful content
				const wordCount = field.helpText!.match(/\w+/g)?.length || 0;
				expect(wordCount).toBeGreaterThan(2);
			});
		});
	});
});
